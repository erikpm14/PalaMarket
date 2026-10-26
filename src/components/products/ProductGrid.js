import { ProductCard } from './ProductCard.js';

export const ProductGrid = (products) => `<div class="product-grid">${products.map(ProductCard).join('')}</div>`;
