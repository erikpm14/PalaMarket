import { getProduct, products } from '../data/products.js';
import { appState } from '../state/appState.js';
import { ProductVisual } from '../components/products/ProductVisual.js';
import { ProductGrid } from '../components/products/ProductGrid.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { icon } from '../components/ui/icons.js';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export const productView = (id) => {
  const product = getProduct(id);
  if (!product) return `<main id="main-content" class="section">${EmptyState({ title: 'Pala no encontrada', text: 'Puede que este modelo ya no forme parte del catálogo.', action: 'Volver al catálogo' })}</main>`;
  const favorite = appState.isFavorite(id);
  const related = products.filter((item) => item.id !== id && (item.brand === product.brand || item.shape === product.shape)).slice(0, 3);
  return `<main id="main-content"><section class="product-detail section"><div class="container"><a class="back-link" href="#/catalogo">← Volver al catálogo</a><div class="detail-grid"><div class="detail-visual">${ProductVisual(product, 'product-visual--detail')}</div><div class="detail-copy"><p class="eyebrow">${product.brand} · Colección 2026</p><h1>${product.name}</h1><div class="detail-rating"><span>★ ${product.rating.toFixed(1)}</span><span>${product.stock ? `${product.stock} unidades disponibles` : 'Temporalmente agotada'}</span></div><p class="detail-price">${euro.format(product.price)}</p><p class="detail-description">${product.description}</p><dl class="spec-grid"><div><dt>Forma</dt><dd>${product.shape}</dd></div><div><dt>Peso</dt><dd>${product.weight}</dd></div><div><dt>Nivel</dt><dd>${product.level}</dd></div><div><dt>Material</dt><dd>${product.material}</dd></div></dl><div class="detail-actions"><button class="button button--wide" data-add-cart="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>${product.stock ? `Añadir al carrito · ${euro.format(product.price)}` : 'Sin stock'}</button><button class="button button--secondary button--favorite ${favorite ? 'is-active' : ''}" data-favorite="${product.id}" aria-pressed="${favorite}">${icon('heart')} ${favorite ? 'Guardada' : 'Guardar'}</button></div><p class="academic-note">Compra simulada para fines académicos. No se realizará ningún pago.</p></div></div></div></section><section class="section section--soft"><div class="container"><div class="section-heading"><div><p class="eyebrow">También te puede encajar</p><h2>Modelos relacionados</h2></div></div>${ProductGrid(related)}</div></section></main>`;
};
