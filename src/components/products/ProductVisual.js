/**
 * Imagen de producto. Muestra la fotografía del modelo y, si no existe o no
 * carga, una ilustración vectorial neutra (silueta de su forma y color de
 * acento) que no pretende pasar por una foto real.
 */
const faces = {
  redonda: 'M100 22C138 22 162 50 162 88C162 126 138 152 100 152C62 152 38 126 38 88C38 50 62 22 100 22Z',
  lágrima: 'M100 18C140 18 160 46 160 80C160 112 136 146 112 158L88 158C64 146 40 112 40 80C40 46 60 18 100 18Z',
  híbrida: 'M100 16C138 16 160 44 160 80C160 114 134 148 112 158L88 158C66 148 40 114 40 80C40 44 62 16 100 16Z',
  diamante: 'M100 12C124 12 154 34 160 70C164 100 126 144 112 158L88 158C74 144 36 100 40 70C46 34 76 12 100 12Z',
};

const Illustration = (product) => {
  const face = faces[product.shape] ?? faces.lágrima;
  const uid = `pv-${product.id}`;
  return `<svg class="product-visual__art" viewBox="0 0 200 260" role="img" aria-label="Ilustración de la pala ${product.brand} ${product.name}" focusable="false">
      <defs>
        <pattern id="${uid}-holes" width="13" height="13" patternUnits="userSpaceOnUse"><circle cx="6.5" cy="6.5" r="2.1" fill="#10281f" fill-opacity=".34"/></pattern>
        <clipPath id="${uid}-clip"><path d="${face}"/></clipPath>
      </defs>
      <ellipse cx="108" cy="246" rx="58" ry="7" fill="#10281f" fill-opacity=".12"/>
      <g transform="rotate(16 100 140)">
        <path d="M88 156h24l6 32H82z" fill="#14312a"/>
        <rect x="90" y="184" width="20" height="62" rx="9" fill="#14312a"/>
        <path d="M90 200l20-6M90 212l20-6M90 224l20-6M90 236l20-6" stroke="var(--racket)" stroke-width="3" stroke-linecap="round"/>
        <path d="${face}" fill="var(--racket)"/>
        <rect x="30" y="0" width="140" height="170" fill="url(#${uid}-holes)" clip-path="url(#${uid}-clip)"/>
        <path d="${face}" fill="none" stroke="#14312a" stroke-width="9" stroke-linejoin="round"/>
        <circle cx="100" cy="84" r="19" fill="#fff" fill-opacity=".92"/>
        <text x="100" y="92" text-anchor="middle" font-family="Barlow Condensed, Inter, sans-serif" font-size="26" font-weight="800" fill="#14312a">${product.brand.charAt(0)}</text>
      </g>
    </svg>`;
};

export const ProductVisual = (product, className = '', { eager = false } = {}) => {
  const label = `Pala ${product.brand} ${product.name}`;
  const photo = product.image
    ? `<img src="${product.image}" alt="${label}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" referrerpolicy="no-referrer">`
    : '';
  return `<div class="product-visual ${photo ? 'product-visual--photo' : ''} ${className}" style="--racket:${product.accent}">${photo}${Illustration(product)}</div>`;
};

/** Cambia a la ilustración cuando una fotografía falla (se llama en captura, porque `error` no burbujea). */
export const markBrokenImage = (img) => img.closest('.product-visual')?.classList.add('is-broken');
