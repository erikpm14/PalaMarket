export const ProductVisual = (product, className = '') => {
  if (product.image) {
    return `
      <div class="product-visual product-visual--photo ${className}" role="img" aria-label="Fotografía de ${product.name}">
        <img src="${product.image}" alt="${product.name}" loading="lazy" referrerpolicy="no-referrer">
      </div>`;
  }

  return `
    <div class="product-visual ${className}" style="--racket-accent:${product.accent}" role="img" aria-label="Ilustración de ${product.name}">
      <div class="racket-shadow"></div>
      <div class="racket">
        <div class="racket-face"><span>${product.brand.slice(0, 1)}</span></div>
        <div class="racket-neck"></div><div class="racket-handle"></div>
      </div>
      <span class="visual-number">${String(product.rating).replace('.', '')}</span>
    </div>`;
};
