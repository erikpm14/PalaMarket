const euroWhole = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const euroExact = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export const formatPrice = (value) => euroWhole.format(value);
export const formatTotal = (value) => euroExact.format(value);

export const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/** Minúsculas y sin acentos, para que «lagrima» encuentre «lágrima». */
export const normalize = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => entities[char]);

export const discountPercent = (product) => Math.round((1 - product.price / product.oldPrice) * 100);
