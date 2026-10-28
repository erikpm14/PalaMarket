import { getProduct, products } from '../data/products.js';
import { appState } from '../state/appState.js';
import { ProductVisual } from '../components/products/ProductVisual.js';
import { ProductGrid } from '../components/products/ProductGrid.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { icon } from '../components/ui/icons.js';
import { capitalize, discountPercent, formatPrice } from '../utils/format.js';

const LOW_STOCK = 3;

const availability = (stock) => {
  if (stock === 0) return '<span class="stock stock--out">Temporalmente agotada</span>';
  if (stock <= LOW_STOCK) return `<span class="stock stock--low">Últimas ${stock} unidades</span>`;
  return `<span class="stock stock--ok">En stock · ${stock} unidades</span>`;
};

const relatedTo = (product) => products
  .filter((item) => item.id !== product.id)
  .map((item) => ({ item, score: Number(item.brand === product.brand) + Number(item.shape === product.shape) + Number(item.level === product.level) }))
  .filter(({ score }) => score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 4)
  .map(({ item }) => item);

export const productView = (id) => {
  const product = getProduct(id);
  if (!product) {
    return `<main id="main-content" class="section"><div class="container">${EmptyState({
      title: 'Pala no encontrada',
      text: 'Puede que este modelo ya no forme parte del catálogo.',
      actionLabel: 'Volver al catálogo',
      level: 1,
    })}</div></main>`;
  }
  const favorite = appState.isFavorite(id);
  const soldOut = product.stock === 0;
  return `<main id="main-content">
    <section class="section section--tight">
      <div class="container">
        <a class="back-link" href="#/catalogo">${icon('back')} Volver al catálogo</a>
        <div class="detail-grid">
          <div class="detail-visual">${ProductVisual(product, 'product-visual--detail', { eager: true })}${product.offer ? `<span class="badge badge--offer">Oferta −${discountPercent(product)}%</span>` : ''}</div>
          <div class="detail-copy">
            <p class="eyebrow">${product.brand} · Colección 2026</p>
            <h1>${product.name}</h1>
            <p class="detail-rating"><span class="rating">${icon('star')}${product.rating.toFixed(1)}</span>${availability(product.stock)}</p>
            <p class="price price--large">${product.offer ? `<del class="price__old"><span class="visually-hidden">Antes </span>${formatPrice(product.oldPrice)}</del>` : ''}<strong class="price__current">${formatPrice(product.price)}</strong></p>
            <p class="detail-description">${product.description}</p>
            <dl class="spec-grid">
              <div><dt>Forma</dt><dd>${capitalize(product.shape)}</dd></div>
              <div><dt>Nivel</dt><dd>${capitalize(product.level)}</dd></div>
              <div><dt>Tipo de juego</dt><dd>${capitalize(product.gameType)}</dd></div>
              <div><dt>Peso</dt><dd>${product.weight}</dd></div>
              <div class="spec-grid__wide"><dt>Material</dt><dd>${product.material}</dd></div>
            </dl>
            <div class="detail-actions">
              <button class="button button--large" type="button" data-action="add-to-cart" data-id="${product.id}"${soldOut ? ' disabled' : ''}>${soldOut ? 'Sin stock' : `Añadir al carrito · ${formatPrice(product.price)}`}</button>
              <button class="button button--large button--secondary button--favorite${favorite ? ' is-active' : ''}" type="button" data-action="toggle-favorite" data-id="${product.id}" aria-pressed="${favorite}">${icon('heart')} ${favorite ? 'Guardada' : 'Guardar'}</button>
            </div>
            <p class="form-note">Compra simulada para fines académicos. No se realizará ningún pago.</p>
          </div>
        </div>
      </div>
    </section>
    <section class="section section--soft">
      <div class="container">
        <div class="section-heading"><div><p class="eyebrow">También te puede encajar</p><h2>Modelos relacionados</h2></div></div>
        ${ProductGrid(relatedTo(product))}
      </div>
    </section>
  </main>`;
};
