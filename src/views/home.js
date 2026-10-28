import { products } from '../data/products.js';
import { ProductGrid } from '../components/products/ProductGrid.js';
import { ProductVisual } from '../components/products/ProductVisual.js';
import { icon } from '../components/ui/icons.js';
import { discountPercent, formatPrice } from '../utils/format.js';

const heroProduct = products.find((product) => product.id === 'metalbone-2026');
const FEATURED_COUNT = 4;

/** Destacadas sin oferta (ya tienen su propia sección); si faltan, se completan con las mejor valoradas. */
const featuredProducts = products
  .filter((product) => !product.offer)
  .sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating)
  .slice(0, FEATURED_COUNT);
const brandCount = new Set(products.map((product) => product.brand)).size;

const Hero = () => `<section class="hero">
  <div class="container hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">Tu juego empieza aquí</p>
      <h1>La pala correcta cambia <em>el punto.</em></h1>
      <p class="hero-lead">Compara formas, niveles y sensaciones sin complicarte. Una selección pensada para ayudarte a elegir mejor.</p>
      <div class="hero-actions">
        <a class="button button--large" href="#/catalogo">Explorar catálogo ${icon('arrow')}</a>
        <a class="button button--large button--secondary" href="#/catalogo?ofertas=1">Ver ofertas</a>
      </div>
      <dl class="hero-proof">
        <div><dt>${products.length}</dt><dd>palas seleccionadas</dd></div>
        <div><dt>${brandCount}</dt><dd>marcas reconocidas</dd></div>
        <div><dt>4</dt><dd>formas y 3 niveles</dd></div>
      </dl>
    </div>
    <div class="hero-showcase">
      <a class="hero-showcase__stage" href="#/producto/${heroProduct.id}" aria-label="Ver ${heroProduct.name}">${ProductVisual(heroProduct, 'product-visual--hero', { eager: true })}</a>
      <div class="hero-product-label">
        <span class="badge badge--offer">Oferta −${discountPercent(heroProduct)}%</span>
        <strong>${heroProduct.brand} ${heroProduct.name}</strong>
        <p class="price"><del class="price__old">${formatPrice(heroProduct.oldPrice)}</del><strong class="price__current">${formatPrice(heroProduct.price)}</strong></p>
      </div>
    </div>
  </div>
</section>`;

const Offers = () => `<section class="section section--soft">
  <div class="container offers-layout">
    <div class="offers-copy">
      <p class="eyebrow">Precio especial</p>
      <h2>Dos ofertas que merecen la pena</h2>
      <p>Modelos de gama alta con un descuento que no suele repetirse. Hasta fin de existencias.</p>
      <a class="button" href="#/catalogo?ofertas=1">Ver ofertas ${icon('arrow')}</a>
    </div>
    ${ProductGrid(products.filter((product) => product.offer))}
  </div>
</section>`;

const Featured = () => `<section class="section">
  <div class="container">
    <div class="section-heading">
      <div><p class="eyebrow">Selección PalaMarket</p><h2>Palas que merece la pena conocer</h2></div>
      <a class="text-link" href="#/catalogo">Ver todo el catálogo ${icon('arrow')}</a>
    </div>
    ${ProductGrid(featuredProducts)}
  </div>
</section>`;

const Keys = () => `<section class="section section--brand">
  <div class="container">
    <div class="section-heading section-heading--light"><div><p class="eyebrow eyebrow--on-dark">Elige con criterio</p><h2>Tres claves. Una decisión mejor.</h2></div></div>
    <div class="key-grid">
      <article><span>01</span><h3>Forma</h3><p>Redonda para control, lágrima para equilibrio y diamante para potencia.</p></article>
      <article><span>02</span><h3>Nivel</h3><p>Una pala adecuada acompaña tu técnica; no necesitas la más exigente para jugar mejor.</p></article>
      <article><span>03</span><h3>Sensaciones</h3><p>Peso, material y balance definen cómo responde la pala en defensa y en ataque.</p></article>
    </div>
  </div>
</section>`;

const Guide = () => `<section class="section">
  <div class="container guide-grid">
    <div>
      <p class="eyebrow">Guía rápida</p>
      <h2>¿No sabes por dónde empezar?</h2>
      <p>Filtra por tu nivel y por la forma que prefieras. Después compara peso, materiales y valoración en la ficha de cada pala.</p>
      <a class="button" href="#/catalogo">Encontrar mi pala ${icon('arrow')}</a>
    </div>
    <div class="shape-diagram" aria-hidden="true">
      <div class="shape shape--round"><span>Control</span></div>
      <div class="shape shape--drop"><span>Equilibrio</span></div>
      <div class="shape shape--diamond"><span>Potencia</span></div>
    </div>
  </div>
</section>`;

export const homeView = () => `<main id="main-content">${Hero()}${Offers()}${Featured()}${Keys()}${Guide()}</main>`;
