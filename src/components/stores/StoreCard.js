import { icon } from '../ui/icons.js';

export const StoreCard = (store) => `<article class="store-card">
  <span class="store-card__icon">${icon('pin')}</span>
  <p class="eyebrow">${store.city}</p>
  <h2>${store.name}</h2>
  <address>${store.address}<br>${store.city}</address>
  <a class="store-card__phone" href="tel:${store.phone.replaceAll(' ', '')}">${store.phone}</a>
  <ul class="store-card__services">${store.services.map((service) => `<li>${icon('check')}${service}</li>`).join('')}</ul>
</article>`;
