import { products } from '../data/products.js';
import { appState } from '../state/appState.js';
import { ProductGrid } from '../components/products/ProductGrid.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { escapeHtml } from '../utils/format.js';

const LockedView = () => `<main id="main-content">
  <section class="section"><div class="container">
    <div class="auth-card auth-card--center">
      <span class="auth-logo">♡</span>
      <p class="eyebrow">Zona personal</p>
      <h1>Inicia sesión para ver tus favoritos</h1>
      <p>Tus palas guardadas ya están en este navegador. Accede de forma simulada para consultar esta zona.</p>
      <a class="button button--large" href="#/login?next=favoritos">Iniciar sesión</a>
      <p class="form-note">Este acceso no utiliza un servidor ni guarda contraseñas.</p>
    </div>
  </div></section>
</main>`;

export const favoritesView = () => {
  const { user, favorites } = appState.get();
  if (!user) return LockedView();
  const saved = products.filter((product) => favorites.includes(product.id));
  const content = saved.length
    ? ProductGrid(saved)
    : EmptyState({
      title: 'Todavía no tienes favoritos',
      text: 'Pulsa el corazón de las palas que te interesan y aparecerán aquí.',
      actionLabel: 'Explorar catálogo',
      iconName: 'heart',
    });
  return `<main id="main-content">
    <section class="page-hero"><div class="container">
      <p class="eyebrow eyebrow--on-dark">Tu selección</p>
      <h1>Favoritos de ${escapeHtml(user.name.split(' ')[0])}</h1>
      <p>Una lista corta para comparar con calma.</p>
    </div></section>
    <section class="section section--tight"><div class="container"><h2 class="visually-hidden">Palas guardadas</h2>${content}</div></section>
  </main>`;
};
