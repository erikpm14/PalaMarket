import { icon } from '../ui/icons.js';
import { ProductVisual } from '../products/ProductVisual.js';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export const CartItem = (product, quantity) => `<li class="cart-item">
  ${ProductVisual(product, 'product-visual--mini')}
  <div class="cart-item__content"><p class="eyebrow">${product.brand}</p><h3>${product.name}</h3><p>${euro.format(product.price)} / unidad</p>
    <div class="quantity-control"><button data-quantity="${product.id}" data-delta="-1" aria-label="Reducir cantidad">${icon('minus')}</button><span aria-label="Cantidad ${quantity}">${quantity}</span><button data-quantity="${product.id}" data-delta="1" aria-label="Aumentar cantidad">${icon('plus')}</button></div>
  </div><div class="cart-item__end"><button class="icon-button" data-remove-cart="${product.id}" aria-label="Eliminar ${product.name}">${icon('trash')}</button><strong>${euro.format(product.price * quantity)}</strong></div>
</li>`;
