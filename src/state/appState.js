import { products } from '../data/products.js';
import { ApiError, api, isConnectivityError } from '../services/api.js';
import { storage } from '../services/storage.js';

const listeners = new Set();
const noticeListeners = new Set();
const productIds = new Set(products.map((product) => product.id));
const stockOf = (id) => products.find((product) => product.id === id)?.stock ?? 0;

/** Descarta datos corruptos o de modelos que ya no existen en el catálogo. */
const loadFavorites = () => {
  const saved = storage.get('favorites', []);
  return Array.isArray(saved) ? saved.filter((id) => productIds.has(id)) : [];
};

const loadCart = () => {
  const saved = storage.get('cart', []);
  if (!Array.isArray(saved)) return [];
  return saved
    .filter((line) => productIds.has(line?.id) && Number.isInteger(line.quantity) && line.quantity > 0)
    .map((line) => ({ id: line.id, quantity: Math.min(line.quantity, stockOf(line.id)) }))
    .filter((line) => line.quantity > 0);
};

// La sesión vive en una cookie httpOnly: ya no se guarda ningún dato de usuario en el navegador.
storage.remove('user');

const state = {
  favorites: loadFavorites(),
  cart: loadCart(),
  user: null,
  /** 'loading' mientras se comprueba la sesión; después 'anonymous' o 'authenticated'. */
  auth: 'loading',
  /** false si la API no responde: la tienda sigue funcionando sin cuenta. */
  apiOnline: true,
  theme: storage.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  cartOpen: false,
};

const isAuthenticated = () => state.user !== null;
// La API deja una cookie-señal sin datos (pm_auth) al abrir sesión: sin ella no hace falta preguntar al servidor.
const mayHaveSession = () => document.cookie.split('; ').includes('pm_auth=1');
const notify = () => listeners.forEach((listener) => listener({ ...state }));
const announce = (message) => noticeListeners.forEach((listener) => listener(message));

// Anónimo: favoritos y carrito se conservan en este dispositivo. Con sesión: los guarda el servidor.
const persist = () => {
  storage.set('theme', state.theme);
  if (isAuthenticated()) return;
  storage.set('favorites', state.favorites);
  storage.set('cart', state.cart);
};
const commit = () => {
  persist();
  notify();
};

// --- Sincronización con el servidor -------------------------------------------------------------

/** Última copia confirmada por el servidor (se restaura si una operación falla). */
let confirmed = { favorites: [], cart: [] };
let queue = Promise.resolve();
let pending = 0;

const fromServerCart = (cart) => cart.map(({ productId, quantity }) => ({ id: productId, quantity }));

const resetPrivateState = () => {
  state.user = null;
  state.favorites = [];
  state.cart = [];
  confirmed = { favorites: [], cart: [] };
};

const adoptConfirmed = () => {
  state.favorites = confirmed.favorites;
  state.cart = confirmed.cart;
};

const handleFailure = (error) => {
  if (error instanceof ApiError && error.status === 401) {
    resetPrivateState();
    state.auth = 'anonymous';
    announce('Tu sesión ha caducado. Inicia sesión de nuevo.');
    return;
  }
  if (isConnectivityError(error)) state.apiOnline = false;
  adoptConfirmed();
  announce(isConnectivityError(error) ? 'No se ha podido guardar el cambio: sin conexión con el servidor.' : error.message);
};

/**
 * Aplica el cambio en pantalla al instante y lo envía al servidor en orden.
 * Si el servidor lo rechaza, se vuelve a la última copia confirmada y se avisa.
 */
const syncWithServer = (request) => {
  pending += 1;
  queue = queue.then(async () => {
    try {
      const data = await request();
      state.apiOnline = true;
      if (data.favorites) confirmed.favorites = data.favorites;
      if (data.cart) confirmed.cart = fromServerCart(data.cart);
    } catch (error) {
      handleFailure(error);
    } finally {
      pending -= 1;
      if (pending === 0 && isAuthenticated()) adoptConfirmed();
      notify();
    }
  });
};

/** Descarga favoritos y carrito del usuario. */
const loadPrivateData = async () => {
  const [favorites, cart] = await Promise.all([api.getFavorites(), api.getCart()]);
  confirmed = { favorites: favorites.favorites, cart: fromServerCart(cart.cart) };
  adoptConfirmed();
};

/** Tras iniciar sesión: integra lo guardado como anónimo en la cuenta y carga los datos del servidor. */
const startSession = async (user) => {
  const anonymous = { favorites: state.favorites, cart: state.cart };
  state.user = user;
  state.auth = 'authenticated';
  state.apiOnline = true;
  try {
    if (anonymous.favorites.length) await api.mergeFavorites(anonymous.favorites);
    if (anonymous.cart.length) await api.mergeCart(anonymous.cart.map(({ id, quantity }) => ({ productId: id, quantity })));
    // Ya están en la cuenta (la fusión es idempotente): se borra la copia local antes de descargar los datos.
    storage.remove('favorites');
    storage.remove('cart');
    await loadPrivateData();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      handleFailure(error);
    } else {
      // Sesión iniciada, pero sin poder traer los datos: se conservan los locales y se avisa.
      if (isConnectivityError(error)) state.apiOnline = false;
      confirmed = { favorites: state.favorites, cart: state.cart };
      announce('Has iniciado sesión, pero no se pudieron sincronizar tus favoritos y tu carrito.');
    }
  }
  commit();
};

/** Ejecuta una petición de acceso y, si falla por conectividad, deja constancia para mostrar el aviso. */
const attempt = async (request) => {
  try {
    const data = await request();
    state.apiOnline = true;
    return data;
  } catch (error) {
    if (isConnectivityError(error)) {
      state.apiOnline = false;
      notify();
    }
    throw error;
  }
};

export const appState = {
  get: () => ({ ...state }),
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Avisos de error que la interfaz debe mostrar (por ejemplo, un cambio que no se pudo guardar). */
  onNotice(listener) {
    noticeListeners.add(listener);
    return () => noticeListeners.delete(listener);
  },
  isFavorite: (id) => state.favorites.includes(id),

  /** Comprueba si hay una sesión abierta (cookie) y, en ese caso, carga sus datos. */
  async init() {
    if (!mayHaveSession()) {
      state.auth = 'anonymous';
      notify();
      return;
    }
    state.auth = 'loading';
    notify();
    try {
      const { user } = await api.me();
      await startSession(user);
    } catch (error) {
      state.auth = 'anonymous';
      state.apiOnline = !isConnectivityError(error);
      notify();
    }
  },

  async register(data) {
    const { user } = await attempt(() => api.register(data));
    await startSession(user);
    return user;
  },

  async login(data) {
    const { user } = await attempt(() => api.login(data));
    await startSession(user);
    return user;
  },

  /** Botón «Reintentar» del aviso de servicio: comprueba la API y, si hay sesión, la recupera. */
  async retry() {
    try {
      await api.health();
      state.apiOnline = true;
    } catch {
      state.apiOnline = false;
    }
    notify();
    if (state.apiOnline) await this.init();
  },

  /** Cierra la sesión en el servidor y limpia el estado privado local (los datos del servidor se conservan). */
  async logout() {
    await api.logout();
    resetPrivateState();
    state.auth = 'anonymous';
    state.apiOnline = true;
    commit();
  },

  toggleFavorite(id) {
    const adding = !state.favorites.includes(id);
    state.favorites = adding ? [...state.favorites, id] : state.favorites.filter((item) => item !== id);
    commit();
    if (isAuthenticated()) syncWithServer(() => (adding ? api.addFavorite(id) : api.removeFavorite(id)));
  },

  addToCart(id) {
    const line = state.cart.find((item) => item.id === id);
    const quantity = (line?.quantity ?? 0) + 1;
    if (quantity > stockOf(id)) return;
    state.cart = line
      ? state.cart.map((item) => (item.id === id ? { ...item, quantity } : item))
      : [...state.cart, { id, quantity }];
    state.cartOpen = true;
    commit();
    if (isAuthenticated()) syncWithServer(() => api.setCartItem(id, quantity));
  },

  setQuantity(id, quantity) {
    const capped = Math.min(quantity, stockOf(id));
    state.cart = capped <= 0
      ? state.cart.filter((item) => item.id !== id)
      : state.cart.map((item) => (item.id === id ? { ...item, quantity: capped } : item));
    commit();
    if (isAuthenticated()) syncWithServer(() => (capped <= 0 ? api.removeCartItem(id) : api.setCartItem(id, capped)));
  },

  removeFromCart(id) {
    state.cart = state.cart.filter((item) => item.id !== id);
    commit();
    if (isAuthenticated()) syncWithServer(() => api.removeCartItem(id));
  },

  clearCart() {
    state.cart = [];
    commit();
    if (isAuthenticated()) syncWithServer(() => api.clearCart());
  },

  toggleCart(force) {
    state.cartOpen = typeof force === 'boolean' ? force : !state.cartOpen;
    notify();
  },

  toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    commit();
  },
};
