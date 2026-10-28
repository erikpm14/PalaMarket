import { escapeHtml, formatPrice } from '../../utils/format.js';
import { FREE_SHIPPING_FROM } from '../cart/CartDrawer.js';
import { icon } from '../ui/icons.js';

const links = [
  ['Inicio', '/'],
  ['Catálogo', '/catalogo'],
  ['Favoritos', '/favoritos'],
  ['Tiendas', '/tiendas'],
  ['Contacto', '/contacto'],
];

const isActive = (href, route) => (href === '/catalogo' ? route === href || route.startsWith('/producto/') : route === href);

const NavLink = ([label, href], route, state) => {
  const count = href === '/favoritos' && state.favorites.length
    ? `<span class="nav-count" aria-label="${state.favorites.length} favoritos">${state.favorites.length}</span>`
    : '';
  return `<a href="#${href}"${isActive(href, route) ? ' aria-current="page"' : ''}>${label}${count}</a>`;
};

export const Header = (state, route, menuOpen) => {
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const firstName = state.user ? escapeHtml(state.user.name.split(' ')[0]) : '';
  const checking = state.auth === 'loading';
  const userLabel = checking ? '' : (state.user ? firstName : 'Entrar');
  const nextTheme = state.theme === 'light' ? 'oscuro' : 'claro';
  return `<header class="site-header">
    <p class="announcement">Envío gratis a partir de ${formatPrice(FREE_SHIPPING_FROM)} · Proyecto académico con compra simulada</p>
    <div class="container header-main">
      <a class="brand" href="#/"><span class="brand__mark" aria-hidden="true">P</span><span class="brand__name">Pala<span>Market</span></span></a>
      <nav class="desktop-nav" aria-label="Principal">${links.map((link) => NavLink(link, route, state)).join('')}</nav>
      <div class="header-actions">
        <button class="icon-button" type="button" data-action="toggle-theme" aria-label="Cambiar a tema ${nextTheme}">${icon(state.theme === 'light' ? 'moon' : 'sun')}</button>
        <a class="icon-button user-action" href="#/${state.user ? 'perfil' : 'login'}"${state.user ? ` aria-label="Perfil de ${firstName}"` : ''}${checking ? ' aria-busy="true"' : ''}>${icon('user')}<span>${userLabel}</span>${checking ? '<span class="visually-hidden">Comprobando sesión</span>' : ''}</a>
        <button class="icon-button cart-action" id="cart-toggle" type="button" data-action="open-cart" aria-label="Abrir carrito, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}">${icon('cart')}${cartCount ? `<span class="action-count">${cartCount}</span>` : ''}</button>
        <button class="icon-button mobile-menu-button" type="button" data-action="toggle-menu" aria-expanded="${menuOpen}" aria-controls="mobile-nav" aria-label="${menuOpen ? 'Cerrar menú' : 'Abrir menú'}">${icon(menuOpen ? 'close' : 'menu')}</button>
      </div>
    </div>
    <nav class="mobile-nav${menuOpen ? ' is-open' : ''}" id="mobile-nav" aria-label="Principal (móvil)">${links.map((link) => NavLink(link, route, state)).join('')}<a href="#/${state.user ? 'perfil' : 'login'}"${['/login', '/perfil'].includes(route) ? ' aria-current="page"' : ''}>${state.user ? `Mi perfil (${firstName})` : 'Iniciar sesión'}</a></nav>
  </header>`;
};
