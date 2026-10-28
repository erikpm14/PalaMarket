import Swal from 'sweetalert2';
import './styles/variables.css';
import './styles/reset.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';
import { router } from './router.js';
import { appState } from './state/appState.js';
import { markBrokenImage } from './components/products/ProductVisual.js';
import { Header } from './components/layout/Header.js';
import { Footer } from './components/layout/Footer.js';
import { ServiceBanner } from './components/layout/ServiceBanner.js';
import { CartDrawer, cartLines, cartTotals } from './components/cart/CartDrawer.js';
import { homeView } from './views/home.js';
import { catalogView, bindCatalog } from './views/catalog.js';
import { productView } from './views/product.js';
import { favoritesView } from './views/favorites.js';
import { storesView } from './views/stores.js';
import { contactView, bindContact } from './views/contact.js';
import { loginView, bindLogin } from './views/login.js';
import { notFoundView } from './views/notFound.js';

const app = document.querySelector('#app');
const views = {
  '/': homeView,
  '/catalogo': catalogView,
  '/favoritos': favoritesView,
  '/tiendas': storesView,
  '/contacto': contactView,
  '/login': loginView,
  '/perfil': loginView,
};

let lastPath = null;
let cartWasOpen = false;
let menuOpen = false;

/** Una dirección con un escape inválido (por ejemplo «%») no debe romper la página: se trata como no encontrada. */
const decode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

const resolveView = (path) => {
  const product = path.match(/^\/producto\/(.+)$/);
  if (product) {
    const id = decode(product[1]);
    return id === null ? notFoundView() : productView(id);
  }
  return (views[path] ?? notFoundView)();
};

/** Identifica el control con foco para devolvérselo tras volver a pintar. */
const focusSelector = () => {
  const active = document.activeElement;
  if (!active || active === document.body) return null;
  const { action, id } = active.dataset;
  if (action && id) return `[data-action="${action}"][data-id="${id}"]`;
  if (action) return `[data-action="${action}"]`;
  return active.id ? `#${active.id}` : null;
};

const updateDocumentTitle = (path) => {
  const titles = { '/catalogo': 'Catálogo', '/favoritos': 'Favoritos', '/tiendas': 'Tiendas', '/contacto': 'Contacto', '/login': 'Acceso', '/perfil': 'Mi perfil' };
  const section = path.startsWith('/producto/') ? 'Ficha de pala' : titles[path];
  document.title = section ? `${section} · PalaMarket` : 'PalaMarket · Encuentra tu próxima pala';
};

/** Guarda lo escrito en los formularios para no perderlo si la interfaz se repinta mientras se rellenan. */
const captureFormValues = () => Object.fromEntries(
  [...document.querySelectorAll('[data-preserve] input, [data-preserve] select, [data-preserve] textarea')]
    .filter((field) => field.id)
    .map((field) => [field.id, field.value]),
);

const restoreFormValues = (values) => {
  Object.entries(values).forEach(([id, value]) => {
    const field = document.getElementById(id);
    if (field && !field.value) field.value = value;
  });
};

const render = () => {
  const { path } = router.current();
  const state = appState.get();
  const pathChanged = path !== lastPath;
  if (pathChanged && state.cartOpen) {
    // Al cambiar de página (enlace, atrás o URL directa) el carrito se cierra y se vuelve a pintar.
    appState.toggleCart(false);
    return;
  }
  const justOpened = state.cartOpen && !cartWasOpen;
  const refocus = pathChanged ? null : focusSelector();
  const formValues = pathChanged ? {} : captureFormValues();
  if (pathChanged) menuOpen = false;

  document.documentElement.dataset.theme = state.theme;
  app.innerHTML = `${Header(state, path, menuOpen)}${ServiceBanner(state)}${resolveView(path)}${Footer()}${CartDrawer(state, justOpened)}`;
  restoreFormValues(formValues);

  // Con el carrito abierto, el resto de la página queda inerte para teclado y lectores de pantalla.
  app.querySelectorAll(':scope > :not(.cart-drawer):not(.drawer-backdrop)').forEach((element) => {
    element.inert = state.cartOpen;
  });

  // Imágenes que ya fallaron antes de que existiera el listener (p. ej. por caché).
  app.querySelectorAll('.product-visual img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) markBrokenImage(img);
  });

  bindCatalog(render);
  bindContact(() => Swal.fire({ icon: 'success', title: 'Consulta preparada', text: 'El envío ha sido simulado. No se ha compartido ningún dato.', confirmButtonText: 'Entendido', customClass: { popup: 'pm-swal' } }));
  bindLogin();

  if (pathChanged) {
    updateDocumentTitle(path);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  if (justOpened) document.querySelector('#cart-close')?.focus();
  else if (cartWasOpen && !state.cartOpen && !pathChanged) document.querySelector('#cart-toggle')?.focus();
  else if (refocus) document.querySelector(refocus)?.focus({ preventScroll: true });

  lastPath = path;
  cartWasOpen = state.cartOpen;
};

const confirmClear = async () => {
  const result = await Swal.fire({
    title: '¿Vaciar el carrito?',
    text: 'Se eliminarán todos los productos.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, vaciar',
    cancelButtonText: 'Cancelar',
    customClass: { popup: 'pm-swal' },
  });
  if (result.isConfirmed) appState.clearCart();
};

const checkout = async () => {
  const { total } = cartTotals(cartLines(appState.get().cart));
  await Swal.fire({
    icon: 'success',
    title: '¡Pedido simulado!',
    text: `Gracias por probar PalaMarket. Total del pedido: ${total.toFixed(2).replace('.', ',')} €. No se ha realizado ningún pago.`,
    confirmButtonText: 'Volver a la tienda',
    customClass: { popup: 'pm-swal' },
  });
  appState.clearCart();
  appState.toggleCart(false);
  router.navigate('/');
};

const actions = {
  'toggle-theme': () => appState.toggleTheme(),
  'retry-session': () => appState.retry(),
  'toggle-menu': () => { menuOpen = !menuOpen; render(); },
  'open-cart': () => appState.toggleCart(true),
  'close-cart': () => appState.toggleCart(false),
  'toggle-favorite': ({ id }) => appState.toggleFavorite(id),
  'add-to-cart': ({ id }) => appState.addToCart(id),
  'remove-from-cart': ({ id }) => appState.removeFromCart(id),
  'change-quantity': ({ id, delta }) => {
    const line = appState.get().cart.find((item) => item.id === id);
    if (line) appState.setQuantity(id, line.quantity + Number(delta));
  },
  'clear-cart': confirmClear,
  checkout,
};

document.addEventListener('error', (event) => {
  if (event.target.tagName === 'IMG') markBrokenImage(event.target);
}, true);

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (target) actions[target.dataset.action]?.(target.dataset);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (appState.get().cartOpen) appState.toggleCart(false);
  else if (menuOpen) { menuOpen = false; render(); }
});

appState.subscribe(render);
appState.onNotice((message) => Swal.fire({
  toast: true,
  position: 'bottom',
  icon: 'error',
  title: message,
  showConfirmButton: false,
  timer: 6000,
  timerProgressBar: true,
  customClass: { popup: 'pm-swal' },
}));
router.start(render);
appState.init();
