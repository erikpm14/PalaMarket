import { icon } from '../ui/icons.js';

export const StoreCard = (store) => `<article class="store-card"><div class="store-card__icon">${icon('pin')}</div><p class="eyebrow">${store.city}</p><h2>${store.name}</h2><address>${store.address}<br>${store.city}</address><a href="tel:${store.phone.replaceAll(' ', '')}">${store.phone}</a><ul>${store.services.map((service) => `<li>${icon('check')}${service}</li>`).join('')}</ul></article>`;
