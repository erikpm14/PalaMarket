import { icon } from './icons.js';

/** `action` puede ser un enlace (`href`) o un botón con `data-action`. */
export const EmptyState = ({ title, text, actionLabel = '', href = '#/catalogo', dataAction = '', iconName = 'search', level = 2 }) => {
  let action = '';
  if (actionLabel && dataAction) action = `<button class="button" type="button" data-action="${dataAction}">${actionLabel}</button>`;
  else if (actionLabel) action = `<a class="button" href="${href}">${actionLabel}</a>`;
  return `<div class="empty-state"><span class="empty-state__mark">${icon(iconName)}</span><h${level}>${title}</h${level}><p>${text}</p>${action}</div>`;
};
