import { stores } from '../data/stores.js';
import { StoreCard } from '../components/stores/StoreCard.js';

export const storesView = () => `<main id="main-content"><section class="page-hero page-hero--stores"><div class="container"><p class="eyebrow eyebrow--accent">Puntos físicos</p><h1>Tiendas cerca de tu pista</h1><p>Datos adaptados del proyecto original para esta demostración académica.</p></div></section><section class="section"><div class="container"><div class="store-grid">${stores.map(StoreCard).join('')}</div><p class="data-note">Los teléfonos son ficticios y se muestran únicamente como parte de la interfaz.</p></div></section></main>`;
