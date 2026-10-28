import { products } from '../data/products.js';
import { appState } from '../state/appState.js';
import { ProductGrid } from '../components/products/ProductGrid.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { escapeHtml } from '../utils/format.js';

const Loading = () => `<main id="main-content"><section class="section"><div class="container">
  <div class="auth-card auth-card--center" role="status"><span class="spinner" aria-hidden="true"></span><p>Comprobando tu sesión…</p></div>
</div></section></main>`;

const LockedView = (local) => `<main id="main-content">
  <section class="section"><div class="container">
    <div class="auth-card auth-card--center">
      <span class="auth-logo">♡</span>
      <p class="eyebrow">Zona personal</p>
      <h1>Inicia sesión para ver tus favoritos</h1>
      <p>${local
    ? `Tienes ${local} ${local === 1 ? 'pala guardada' : 'palas guardadas'} en este dispositivo. Al iniciar sesión o crear una cuenta se añadirán a tu cuenta.`
    : 'Crea una cuenta o inicia sesión para guardar tus palas favoritas y recuperarlas en cualquier dispositivo.'}</p>
      <div class="auth-actions">
        <a class="button" href="#/login?next=favoritos">Iniciar sesión</a>
        <a class="button button--secondary" href="#/login?modo=registro&next=favoritos">Crear cuenta</a>
      </div>
    </div>
  </div></section>
</main>`;

export const favoritesView = () => {
  const { user, auth, favorites } = appState.get();
  if (auth === 'loading') return Loading();
  if (!user) return LockedView(favorites.length);
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
      <p>Guardados en tu cuenta, disponibles en cualquier dispositivo.</p>
    </div></section>
    <section class="section section--tight"><div class="container"><h2 class="visually-hidden">Palas guardadas</h2>${content}</div></section>
  </main>`;
};
