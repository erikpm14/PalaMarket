import { products } from '../../data/products.js';
import { CartItem } from './CartItem.js';
import { icon } from '../ui/icons.js';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export const CartDrawer = (state) => {
  const lines = state.cart.map((line) => ({ ...line, product: products.find((product) => product.id === line.id) })).filter((line) => line.product);
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 300 ? 0 : 12.9;
  return `<div class="drawer-backdrop ${state.cartOpen ? 'is-open' : ''}" id="cart-backdrop"></div><aside class="cart-drawer ${state.cartOpen ? 'is-open' : ''}" aria-label="Carrito" aria-hidden="${!state.cartOpen}">
    <div class="drawer-header"><div><p class="eyebrow">Tu selección</p><h2>Carrito <span>${lines.reduce((sum, line) => sum + line.quantity, 0)}</span></h2></div><button class="icon-button" id="cart-close" aria-label="Cerrar carrito">${icon('close')}</button></div>
    <div class="drawer-body">${lines.length ? `<ul class="cart-list">${lines.map((line) => CartItem(line.product, line.quantity)).join('')}</ul>` : '<div class="cart-empty"><span>0</span><h3>Tu carrito está vacío</h3><p>Explora el catálogo y añade una pala para verla aquí.</p><a href="#/catalogo" class="button" id="cart-shop-link">Ver catálogo</a></div>'}</div>
    ${lines.length ? `<div class="cart-summary"><div><span>Subtotal</span><strong>${euro.format(subtotal)}</strong></div><div><span>Envío</span><strong>${shipping ? euro.format(shipping) : 'Gratis'}</strong></div><div class="cart-total"><span>Total</span><strong>${euro.format(subtotal + shipping)}</strong></div><button class="button button--wide" id="checkout-button">Finalizar compra</button><button class="text-button" id="clear-cart">Vaciar carrito</button><p>Pago simulado. No se realizará ningún cargo.</p></div>` : ''}
  </aside>`;
};
