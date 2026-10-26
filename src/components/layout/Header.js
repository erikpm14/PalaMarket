import { icon } from '../ui/icons.js';

const links = [
  ['Inicio', '/'], ['Catálogo', '/catalogo'], ['Favoritos', '/favoritos'], ['Tiendas', '/tiendas'], ['Contacto', '/contacto'],
];

export const Header = (state, route) => {
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  return `<header class="site-header">
    <div class="announcement">Envío simulado gratuito a partir de 300 € · Proyecto académico</div>
    <div class="container header-main">
      <a class="brand" href="#/" aria-label="PalaMarket, inicio"><span class="brand__mark">P</span><span>Pala<span>Market</span></span></a>
      <nav class="desktop-nav" aria-label="Navegación principal">${links.map(([label, href]) => `<a href="#${href}" class="${route === href || (href === '/catalogo' && route.startsWith('/producto/')) ? 'is-active' : ''}">${label}${href === '/favoritos' && state.favorites.length ? `<span class="nav-count">${state.favorites.length}</span>` : ''}</a>`).join('')}</nav>
      <div class="header-actions">
        <button class="icon-button" id="theme-toggle" aria-label="Cambiar a tema ${state.theme === 'light' ? 'oscuro' : 'claro'}">${icon(state.theme === 'light' ? 'moon' : 'sun')}</button>
        <a class="icon-button user-action" href="#/${state.user ? 'perfil' : 'login'}" aria-label="${state.user ? `Perfil de ${state.user.name}` : 'Iniciar sesión'}">${icon('user')}<span>${state.user ? state.user.name.split(' ')[0] : 'Entrar'}</span></a>
        <button class="icon-button cart-action" id="cart-toggle" aria-label="Abrir carrito, ${cartCount} productos">${icon('cart')}<span class="action-count">${cartCount}</span></button>
        <button class="icon-button mobile-menu-button" id="mobile-menu-toggle" aria-label="Abrir menú" aria-expanded="false">${icon('menu')}</button>
      </div>
    </div>
    <nav class="mobile-nav" id="mobile-nav" aria-label="Navegación móvil">${links.map(([label, href]) => `<a href="#${href}">${label}${href === '/favoritos' ? `<span>${state.favorites.length}</span>` : ''}</a>`).join('')}</nav>
  </header>`;
};
