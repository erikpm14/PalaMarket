import { products } from '../../../src/data/products.js';

// El catálogo vive en el frontend; el servidor lo reutiliza para validar identificadores y stock.
const byId = new Map(products.map((product) => [product.id, product]));

export const findProduct = (id) => byId.get(id);
export const isKnownProduct = (id) => byId.has(id);
export const stockOf = (id) => byId.get(id)?.stock ?? 0;
