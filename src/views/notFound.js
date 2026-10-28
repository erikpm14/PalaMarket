import { EmptyState } from '../components/ui/EmptyState.js';

export const notFoundView = () => `<main id="main-content"><section class="section"><div class="container">${EmptyState({
  title: 'Página no encontrada',
  text: 'La dirección que buscas no existe o ha cambiado de sitio.',
  actionLabel: 'Volver al inicio',
  href: '#/',
  iconName: 'arrow',
  level: 1,
})}</div></section></main>`;
