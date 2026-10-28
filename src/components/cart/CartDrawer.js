import { products } from '../../data/products.js';
import { formatTotal } from '../../utils/format.js';
import { icon } from '../ui/icons.js';
import { CartItem } from './CartItem.js';

export const FREE_SHIPPING_FROM = 300;
const SHIPPING_COST = 12.9;

export const cartLines = (cart) => cart
  .map((line) => ({ ...line, product: products.find((product) => product.id === line.id) }))
  .filter((line) => line.product);

export const cartTotals = (lines) => {
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
  return { subtotal, shipping, total: subtotal + shipping };
};

const EmptyCart = () => `<div class="cart-empty">
  <span class="empty-state__mark">${icon('cart')}</span>
  <h3>Tu carrito está vacío</h3>
  <p>Explora el catálogo y añade una pala para verla aquí.</p>
  <a href="#/catalogo" class="button" data-action="close-cart">Ver catálogo</a>
</div>`;

const CartSummary = (lines) => {
  const { subtotal, shipping, total } = cartTotals(lines);
  const missing = FREE_SHIPPING_FROM - subtotal;
  return `<div class="cart-summary">
    <p class="cart-summary__hint">${shipping ? `Te faltan <strong>${formatTotal(missing)}</strong> para el envío gratis.` : 'Tienes envío gratis.'}</p>
    <dl>
      <div><dt>Subtotal</dt><dd>${formatTotal(subtotal)}</dd></div>
      <div><dt>Envío</dt><dd>${shipping ? formatTotal(shipping) : 'Gratis'}</dd></div>
      <div class="cart-total"><dt>Total</dt><dd>${formatTotal(total)}</dd></div>
    </dl>
    <button class="button button--wide" type="button" data-action="checkout">Finalizar compra</button>
    <button class="text-button" type="button" data-action="clear-cart">Vaciar carrito</button>
    <p class="form-note">Pago simulado. No se realizará ningún cargo.</p>
  </div>`;
};

export const CartDrawer = (state, justOpened) => {
  const lines = cartLines(state.cart);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const open = state.cartOpen;
  return `<div class="drawer-backdrop${open ? ' is-open' : ''}" data-action="close-cart"></div>
  <aside class="cart-drawer${open ? ' is-open' : ''}${justOpened ? ' is-entering' : ''}" id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title"${open ? '' : ' inert'}>
    <div class="drawer-header">
      <div><p class="eyebrow">Tu selección</p><h2 id="cart-title">Carrito <span class="drawer-count">${count}</span></h2></div>
      <button class="icon-button" id="cart-close" type="button" data-action="close-cart" aria-label="Cerrar carrito">${icon('close')}</button>
    </div>
    <div class="drawer-body">${lines.length ? `<ul class="cart-list">${lines.map((line) => CartItem(line.product, line.quantity)).join('')}</ul>` : EmptyCart()}</div>
    ${lines.length ? CartSummary(lines) : ''}
  </aside>`;
};
