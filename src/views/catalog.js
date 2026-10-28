import { products } from '../data/products.js';
import { ProductFilters } from '../components/products/ProductFilters.js';
import { ProductGrid } from '../components/products/ProductGrid.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { router } from '../router.js';
import { normalize } from '../utils/format.js';

const defaults = { search: '', brand: '', shape: '', level: '', gameType: '', min: '', max: '', sort: 'featured' };
const SEARCH_DELAY = 180;

let filters = { ...defaults };
let searchTimer;

const unique = (key) => [...new Set(products.map((product) => product[key]))].sort((a, b) => a.localeCompare(b, 'es'));
const options = {
  brands: unique('brand'),
  shapes: unique('shape'),
  levels: unique('level'),
  gameTypes: unique('gameType'),
};

const isOffersRoute = () => router.current().query.get('ofertas') === '1';
const hasActiveFilters = () => Object.keys(defaults).some((key) => filters[key] !== defaults[key]);

const sorters = {
  featured: (a, b) => Number(b.featured) - Number(a.featured),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  name: (a, b) => a.name.localeCompare(b.name, 'es'),
};

const matches = (product, offersOnly) => {
  const query = normalize(filters.search.trim());
  const min = filters.min === '' ? 0 : Number(filters.min);
  const max = filters.max === '' ? Infinity : Number(filters.max);
  return (!query || normalize(`${product.name} ${product.brand}`).includes(query))
    && (!offersOnly || product.offer)
    && (!filters.brand || product.brand === filters.brand)
    && (!filters.shape || product.shape === filters.shape)
    && (!filters.level || product.level === filters.level)
    && (!filters.gameType || product.gameType === filters.gameType)
    && product.price >= min
    && product.price <= max;
};

const filteredProducts = () => {
  const offersOnly = isOffersRoute();
  return products.filter((product) => matches(product, offersOnly)).sort(sorters[filters.sort] ?? sorters.featured);
};

const Results = () => {
  const results = filteredProducts();
  const content = results.length
    ? ProductGrid(results)
    : EmptyState({
      title: 'No encontramos ninguna pala',
      text: 'Prueba a ampliar el rango de precio o a limpiar los filtros.',
      actionLabel: 'Limpiar filtros',
      dataAction: 'clear-filters',
    });
  return `<h2 class="visually-hidden">Resultados</h2><div class="results-bar"><p role="status"><strong>${results.length}</strong> ${results.length === 1 ? 'pala encontrada' : 'palas encontradas'}</p><span>Precios orientativos para este proyecto académico</span></div>${content}`;
};

export const catalogView = () => {
  const offers = isOffersRoute();
  return `<main id="main-content">
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow eyebrow--on-dark">${offers ? 'Ofertas seleccionadas' : 'Catálogo 2026'}</p>
        <h1>${offers ? 'Palas con precio especial' : 'Encuentra tu próxima pala'}</h1>
        <p>${offers ? 'Dos modelos con descuento para esta demostración académica.' : 'Filtra por lo que importa y compara cada modelo a tu ritmo.'}</p>
      </div>
    </section>
    <section class="section section--tight">
      <div class="container">
        ${ProductFilters(filters, options, hasActiveFilters())}
        <div id="catalog-results">${Results()}</div>
      </div>
    </section>
  </main>`;
};

/** Actualiza solo los resultados para no perder el foco del campo que se está editando. */
export const bindCatalog = (rerender) => {
  const form = document.querySelector('#catalog-filters');
  if (!form) return;
  const results = document.querySelector('#catalog-results');
  const clearButton = form.querySelector('[data-action="clear-filters"]');

  const refresh = () => {
    results.innerHTML = Results();
    clearButton.disabled = !hasActiveFilters();
  };

  form.addEventListener('input', (event) => {
    filters = { ...defaults, ...Object.fromEntries(new FormData(form).entries()) };
    clearTimeout(searchTimer);
    if (event.target.name === 'search') searchTimer = setTimeout(refresh, SEARCH_DELAY);
    else refresh();
  });
  form.addEventListener('submit', (event) => event.preventDefault());

  // El botón de «Limpiar» también aparece en el estado vacío, fuera del formulario.
  document.querySelector('main').addEventListener('click', (event) => {
    if (!event.target.closest('[data-action="clear-filters"]')) return;
    filters = { ...defaults };
    rerender();
    document.querySelector('#search')?.focus();
  });
};
