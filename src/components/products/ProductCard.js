import { appState } from '../../state/appState.js';
import { icon } from '../ui/icons.js';
import { ProductVisual } from './ProductVisual.js';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export const ProductCard = (product) => {
  const favorite = appState.isFavorite(product.id);
  return `<article class="product-card">
    <div class="product-card__visual">
      ${ProductVisual(product)}
      <button class="icon-button favorite-button ${favorite ? 'is-active' : ''}" data-favorite="${product.id}" aria-label="${favorite ? 'Quitar' : 'Añadir'} ${product.name} de favoritos" aria-pressed="${favorite}">${icon('heart')}</button>
      ${product.stock === 0 ? '<span class="stock-badge">Agotada</span>' : ''}
    </div>
    <div class="product-card__body">
      <p class="eyebrow">${product.brand} · ${product.shape}</p>
      <h3><a href="#/producto/${product.id}">${product.name}</a></h3>
      <div class="product-meta"><span>${product.level}</span><span aria-label="Valoración ${product.rating} de 5">★ ${product.rating.toFixed(1)}</span></div>
      <div class="product-card__footer"><strong>${euro.format(product.price)}</strong><button class="button button--small" data-add-cart="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>${product.stock === 0 ? 'Sin stock' : 'Añadir'}</button></div>
    </div>
  </article>`;
};
