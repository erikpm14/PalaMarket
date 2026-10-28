import { stores } from '../data/stores.js';
import { StoreCard } from '../components/stores/StoreCard.js';

export const storesView = () => `<main id="main-content">
  <section class="page-hero"><div class="container">
    <p class="eyebrow eyebrow--on-dark">Puntos físicos</p>
    <h1>Tiendas cerca de tu pista</h1>
    <p>Directorio de tiendas para esta demostración académica.</p>
  </div></section>
  <section class="section section--tight"><div class="container">
    <div class="store-grid">${stores.map(StoreCard).join('')}</div>
    <p class="form-note">Los teléfonos son ficticios y se muestran únicamente como parte de la interfaz.</p>
  </div></section>
</main>`;
