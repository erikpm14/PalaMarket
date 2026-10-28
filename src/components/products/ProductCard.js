import { appState } from '../../state/appState.js';
import { capitalize, discountPercent, formatPrice } from '../../utils/format.js';
import { icon } from '../ui/icons.js';
import { ProductVisual } from './ProductVisual.js';

const LOW_STOCK = 3;

const badges = (product) => {
  const items = [];
  if (product.stock === 0) items.push('<span class="badge badge--sold-out">Agotada</span>');
  else if (product.stock <= LOW_STOCK) items.push(`<span class="badge badge--low">Quedan ${product.stock}</span>`);
  if (product.offer) items.push(`<span class="badge badge--offer">Oferta −${discountPercent(product)}%</span>`);
  return items.length ? `<div class="product-card__badges">${items.join('')}</div>` : '';
};

export const ProductCard = (product) => {
  const favorite = appState.isFavorite(product.id);
  const soldOut = product.stock === 0;
  return `<article class="product-card${soldOut ? ' is-sold-out' : ''}">
    <div class="product-card__visual">
      ${ProductVisual(product)}
      ${badges(product)}
      <button class="icon-button favorite-button${favorite ? ' is-active' : ''}" type="button" data-action="toggle-favorite" data-id="${product.id}" aria-pressed="${favorite}" aria-label="${favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}: ${product.name}">${icon('heart')}</button>
    </div>
    <div class="product-card__body">
      <p class="eyebrow">${product.brand} · ${capitalize(product.shape)}</p>
      <h3 class="product-card__title"><a href="#/producto/${product.id}">${product.name}</a></h3>
      <p class="product-card__meta">
        <span>${capitalize(product.level)} · ${capitalize(product.gameType)}</span>
        <span class="rating" aria-label="Valoración ${product.rating} de 5">${icon('star')}${product.rating.toFixed(1)}</span>
      </p>
      <div class="product-card__footer">
        <p class="price">${product.offer ? `<del class="price__old"><span class="visually-hidden">Antes </span>${formatPrice(product.oldPrice)}</del>` : ''}<strong class="price__current">${formatPrice(product.price)}</strong></p>
        <button class="button button--small" type="button" data-action="add-to-cart" data-id="${product.id}"${soldOut ? ' disabled' : ''}>${soldOut ? 'Sin stock' : 'Añadir'}</button>
      </div>
    </div>
  </article>`;
};
