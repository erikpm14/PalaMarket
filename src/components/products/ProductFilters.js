import { capitalize } from '../../utils/format.js';
import { icon } from '../ui/icons.js';

const sortOptions = [
  ['featured', 'Destacadas'],
  ['price-asc', 'Precio: menor a mayor'],
  ['price-desc', 'Precio: mayor a menor'],
  ['rating', 'Mejor valoradas'],
  ['name', 'Nombre (A-Z)'],
];

const SelectField = ({ id, label, allLabel, values, selected }) => `<div class="field">
  <label for="${id}">${label}</label>
  <select id="${id}" name="${id}">
    <option value="">${allLabel}</option>
    ${values.map((value) => `<option value="${value}"${selected === value ? ' selected' : ''}>${capitalize(value)}</option>`).join('')}
  </select>
</div>`;

export const ProductFilters = (filters, options, hasActiveFilters) => `<form class="filters" id="catalog-filters" role="search" aria-label="Filtrar palas">
  <div class="field field--search">
    <label for="search">Buscar</label>
    <div class="input-with-icon">${icon('search')}<input id="search" name="search" type="search" value="${filters.search.replace(/"/g, '&quot;')}" placeholder="Nombre o marca" autocomplete="off"></div>
  </div>
  ${SelectField({ id: 'brand', label: 'Marca', allLabel: 'Todas', values: options.brands, selected: filters.brand })}
  ${SelectField({ id: 'shape', label: 'Forma', allLabel: 'Todas', values: options.shapes, selected: filters.shape })}
  ${SelectField({ id: 'level', label: 'Nivel', allLabel: 'Todos', values: options.levels, selected: filters.level })}
  ${SelectField({ id: 'gameType', label: 'Tipo de juego', allLabel: 'Todos', values: options.gameTypes, selected: filters.gameType })}
  <div class="field">
    <label for="min">Precio mín. (€)</label>
    <input id="min" name="min" type="number" inputmode="numeric" min="0" max="500" step="10" value="${filters.min}" placeholder="0">
  </div>
  <div class="field">
    <label for="max">Precio máx. (€)</label>
    <input id="max" name="max" type="number" inputmode="numeric" min="0" max="500" step="10" value="${filters.max}" placeholder="500">
  </div>
  <div class="field">
    <label for="sort">Ordenar por</label>
    <select id="sort" name="sort">${sortOptions.map(([value, label]) => `<option value="${value}"${filters.sort === value ? ' selected' : ''}>${label}</option>`).join('')}</select>
  </div>
  <button type="button" class="button button--ghost filters__clear" data-action="clear-filters"${hasActiveFilters ? '' : ' disabled'}>Limpiar filtros</button>
</form>`;
