import { products } from '../data/products.js';
import { storage } from '../services/storage.js';

const listeners = new Set();
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

const loadUser = () => {
  const saved = storage.get('user', null);
  return saved && typeof saved.name === 'string' && typeof saved.email === 'string' ? saved : null;
};

const state = {
  favorites: loadFavorites(),
  cart: loadCart(),
  user: loadUser(),
  theme: storage.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  cartOpen: false,
};

const notify = () => listeners.forEach((listener) => listener({ ...state }));
const persist = () => {
  storage.set('favorites', state.favorites);
  storage.set('cart', state.cart);
  storage.set('user', state.user);
  storage.set('theme', state.theme);
};
const commit = () => {
  persist();
  notify();
};

export const appState = {
  get: () => ({ ...state }),
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  isFavorite: (id) => state.favorites.includes(id),
  toggleFavorite(id) {
    state.favorites = state.favorites.includes(id)
      ? state.favorites.filter((item) => item !== id)
      : [...state.favorites, id];
    commit();
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
  },
  setQuantity(id, quantity) {
    const capped = Math.min(quantity, stockOf(id));
    state.cart = capped <= 0
      ? state.cart.filter((item) => item.id !== id)
      : state.cart.map((item) => (item.id === id ? { ...item, quantity: capped } : item));
    commit();
  },
  removeFromCart(id) {
    state.cart = state.cart.filter((item) => item.id !== id);
    commit();
  },
  clearCart() {
    state.cart = [];
    commit();
  },
  toggleCart(force) {
    state.cartOpen = typeof force === 'boolean' ? force : !state.cartOpen;
    notify();
  },
  login(user) {
    state.user = user;
    commit();
  },
  logout() {
    state.user = null;
    commit();
  },
  toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    commit();
  },
};
