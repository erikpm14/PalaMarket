import { formatTotal } from '../../utils/format.js';
import { icon } from '../ui/icons.js';
import { ProductVisual } from '../products/ProductVisual.js';

export const CartItem = (product, quantity) => `<li class="cart-item">
  <a class="cart-item__visual" href="#/producto/${product.id}" tabindex="-1" aria-hidden="true">${ProductVisual(product)}</a>
  <div class="cart-item__content">
    <p class="eyebrow">${product.brand}</p>
    <h3><a href="#/producto/${product.id}">${product.name}</a></h3>
    <p class="cart-item__unit">${formatTotal(product.price)} / unidad</p>
    <div class="quantity-control" role="group" aria-label="Cantidad de ${product.name}">
      <button type="button" data-action="change-quantity" data-id="${product.id}" data-delta="-1" aria-label="Reducir cantidad">${icon('minus')}</button>
      <output aria-live="polite">${quantity}</output>
      <button type="button" data-action="change-quantity" data-id="${product.id}" data-delta="1" aria-label="Aumentar cantidad"${quantity >= product.stock ? ' disabled' : ''}>${icon('plus')}</button>
    </div>
  </div>
  <div class="cart-item__end">
    <button class="icon-button" type="button" data-action="remove-from-cart" data-id="${product.id}" aria-label="Eliminar ${product.name} del carrito">${icon('trash')}</button>
    <strong>${formatTotal(product.price * quantity)}</strong>
  </div>
</li>`;
