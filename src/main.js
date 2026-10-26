import Swal from 'sweetalert2';
import './styles/variables.css';
import './styles/reset.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import { router } from './router.js';
import { appState } from './state/appState.js';
import { products } from './data/products.js';
import { Header } from './components/layout/Header.js';
import { Footer } from './components/layout/Footer.js';
import { CartDrawer } from './components/cart/CartDrawer.js';
import { homeView } from './views/home.js';
import { catalogView, bindCatalog } from './views/catalog.js';
import { productView } from './views/product.js';
import { favoritesView } from './views/favorites.js';
import { storesView } from './views/stores.js';
import { contactView, bindContact } from './views/contact.js';
import { loginView, bindLogin } from './views/login.js';

const app = document.querySelector('#app');
const views = { '/': homeView, '/catalogo': catalogView, '/favoritos': favoritesView, '/tiendas': storesView, '/contacto': contactView, '/login': loginView, '/perfil': loginView };
let firstRender = true;

const render = () => {
  const { path } = router.current(); const state = appState.get();
  document.documentElement.dataset.theme = state.theme;
  const productMatch = path.match(/^\/producto\/(.+)$/);
  const view = productMatch ? productView(productMatch[1]) : (views[path] || (() => '<main id="main-content" class="section"><div class="container"><h1>Página no encontrada</h1><a href="#/">Volver al inicio</a></div></main>'))();
  app.innerHTML = `${Header(state, path)}${view}${Footer()}${CartDrawer(state)}`;
  bindGlobal(); bindCatalog(render); bindContact(() => Swal.fire({ icon: 'success', title: 'Consulta preparada', text: 'El envío ha sido simulado. No se ha compartido ningún dato.', confirmButtonText: 'Entendido' })); bindLogin(router.navigate);
  if (!firstRender && !state.cartOpen) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  firstRender = false;
};

const bindGlobal = () => {
  document.querySelector('#theme-toggle')?.addEventListener('click', appState.toggleTheme);
  document.querySelector('#cart-toggle')?.addEventListener('click', () => appState.toggleCart(true));
  document.querySelector('#cart-close')?.addEventListener('click', () => appState.toggleCart(false));
  document.querySelector('#cart-backdrop')?.addEventListener('click', () => appState.toggleCart(false));
  document.querySelector('#cart-shop-link')?.addEventListener('click', () => appState.toggleCart(false));
  const menuButton = document.querySelector('#mobile-menu-toggle');
  menuButton?.addEventListener('click', () => { const nav = document.querySelector('#mobile-nav'); const open = nav.classList.toggle('is-open'); menuButton.setAttribute('aria-expanded', String(open)); });
  document.querySelectorAll('[data-favorite]').forEach((button) => button.addEventListener('click', () => appState.toggleFavorite(button.dataset.favorite)));
  document.querySelectorAll('[data-add-cart]').forEach((button) => button.addEventListener('click', () => appState.addToCart(button.dataset.addCart)));
  document.querySelectorAll('[data-remove-cart]').forEach((button) => button.addEventListener('click', () => appState.removeFromCart(button.dataset.removeCart)));
  document.querySelectorAll('[data-quantity]').forEach((button) => button.addEventListener('click', () => { const line = appState.get().cart.find((item) => item.id === button.dataset.quantity); appState.setQuantity(button.dataset.quantity, line.quantity + Number(button.dataset.delta)); }));
  document.querySelector('#clear-cart')?.addEventListener('click', async () => { const result = await Swal.fire({ title: '¿Vaciar el carrito?', text: 'Se eliminarán todos los productos.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, vaciar', cancelButtonText: 'Cancelar' }); if (result.isConfirmed) appState.clearCart(); });
  document.querySelector('#checkout-button')?.addEventListener('click', async () => { await Swal.fire({ icon: 'success', title: '¡Pedido simulado!', text: 'Gracias por probar PalaMarket. No se ha realizado ningún pago.', confirmButtonText: 'Volver a la tienda' }); appState.clearCart(); appState.toggleCart(false); router.navigate('/'); });
};

document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && appState.get().cartOpen) appState.toggleCart(false); });
appState.subscribe(render);
router.start(render);

window.__PALAMARKET__ = { appState, products };
