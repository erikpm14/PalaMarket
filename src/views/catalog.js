import { products } from '../data/products.js';
import { ProductFilters } from '../components/products/ProductFilters.js';
import { ProductGrid } from '../components/products/ProductGrid.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { router } from '../router.js';

const defaults = { search: '', brand: '', shape: '', level: '', min: '', max: '', sort: 'featured' };
let filters = { ...defaults };
let searchTimer;

const isOffersRoute = () => router.current().query.get('ofertas') === '1';

const filteredProducts = () => {
  const query = filters.search.trim().toLowerCase();
  const result = products.filter((product) => {
    const matchesQuery = !query || `${product.name} ${product.brand}`.toLowerCase().includes(query);
    return matchesQuery && (!isOffersRoute() || product.offer) && (!filters.brand || product.brand === filters.brand) && (!filters.shape || product.shape === filters.shape) && (!filters.level || product.level === filters.level) && (!filters.min || product.price >= Number(filters.min)) && (!filters.max || product.price <= Number(filters.max));
  });
  const sorts = {
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name, 'es'),
    rating: (a, b) => b.rating - a.rating,
    featured: (a, b) => Number(b.featured) - Number(a.featured),
  };
  return result.sort(sorts[filters.sort]);
};

export const catalogView = () => {
  const brands = [...new Set(products.map((product) => product.brand))].sort();
  const results = filteredProducts();
  const offers = isOffersRoute();
  return `<main id="main-content"><section class="page-hero page-hero--catalog"><div class="container"><p class="eyebrow eyebrow--accent">${offers ? 'Ofertas seleccionadas' : 'Catálogo 2026'}</p><h1>${offers ? 'Palas con precio especial' : 'Encuentra tu próxima pala'}</h1><p>${offers ? 'Dos modelos seleccionados con descuento para esta demostración académica.' : 'Filtra por lo que importa y compara cada modelo a tu ritmo.'}</p></div></section><section class="section section--catalog"><div class="container">${ProductFilters(filters, brands)}<div class="results-bar"><p aria-live="polite"><strong>${results.length}</strong> ${results.length === 1 ? 'pala encontrada' : 'palas encontradas'}</p><span>Precios orientativos para este proyecto académico</span></div><div id="catalog-results">${results.length ? ProductGrid(results) : EmptyState({ title: 'No encontramos ninguna pala', text: 'Prueba a ampliar el rango de precio o a limpiar los filtros.', action: '' })}</div></div></section></main>`;
};

export const bindCatalog = (render) => {
  const form = document.querySelector('#catalog-filters');
  if (!form) return;
  form.addEventListener('input', (event) => {
    filters = Object.fromEntries(new FormData(form).entries());
    if (event.target.name === 'search') {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(render, 180);
    } else {
      render();
    }
  });
  document.querySelector('#clear-filters')?.addEventListener('click', () => { filters = { ...defaults }; render(); });
};
