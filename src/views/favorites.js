import { products } from '../data/products.js';
import { appState } from '../state/appState.js';
import { ProductGrid } from '../components/products/ProductGrid.js';
import { EmptyState } from '../components/ui/EmptyState.js';

export const favoritesView = () => {
  const state = appState.get();
  if (!state.user) return `<main id="main-content"><section class="locked-view"><div class="locked-card"><span class="locked-mark">♡</span><p class="eyebrow">Zona personal</p><h1>Inicia sesión para ver tus favoritos</h1><p>Tus palas guardadas ya están en este navegador. Accede de forma simulada para consultar esta zona.</p><a class="button" href="#/login?next=favoritos">Iniciar sesión</a><small>Este acceso no utiliza un servidor ni guarda contraseñas.</small></div></section></main>`;
  const favorites = products.filter((product) => state.favorites.includes(product.id));
  return `<main id="main-content"><section class="page-hero"><div class="container"><p class="eyebrow eyebrow--accent">Tu selección</p><h1>Favoritos de ${state.user.name.split(' ')[0]}</h1><p>Una lista corta para comparar con calma.</p></div></section><section class="section"><div class="container">${favorites.length ? ProductGrid(favorites) : EmptyState({ title: 'Todavía no tienes favoritos', text: 'Guarda las palas que te interesan y aparecerán aquí.', action: 'Explorar catálogo' })}</div></section></main>`;
};
