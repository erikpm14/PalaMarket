import { icon } from '../ui/icons.js';

export const ProductFilters = (filters, brands, shapes, levels, gameTypes) => `<form class="filters" id="catalog-filters">
  <div class="field field--search"><label for="search">Buscar</label><div class="input-with-icon">${icon('search')}<input id="search" name="search" type="search" value="${filters.search}" placeholder="Nombre o marca" autocomplete="off"></div></div>
  <div class="field"><label for="brand">Marca</label><select id="brand" name="brand"><option value="">Todas</option>${brands.map((v) => `<option ${filters.brand === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
  <div class="field"><label for="shape">Forma</label><select id="shape" name="shape"><option value="">Todas</option>${shapes.map((v) => `<option ${filters.shape === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
  <div class="field"><label for="level">Nivel</label><select id="level" name="level"><option value="">Todos</option>${levels.map((v) => `<option ${filters.level === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
  <div class="field"><label for="gameType">Tipo de juego</label><select id="gameType" name="gameType"><option value="">Todos</option>${gameTypes.map((v) => `<option ${filters.gameType === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
  <div class="field"><label for="min-price">Precio mín.</label><input id="min-price" name="min" type="number" min="0" max="500" step="10" value="${filters.min}" placeholder="0 €"></div>
  <div class="field"><label for="max-price">Precio máx.</label><input id="max-price" name="max" type="number" min="0" max="500" step="10" value="${filters.max}" placeholder="500 €"></div>
  <div class="field"><label for="sort">Ordenar</label><select id="sort" name="sort"><option value="featured">Destacadas</option><option value="price-asc" ${filters.sort === 'price-asc' ? 'selected' : ''}>Precio: menor a mayor</option><option value="price-desc" ${filters.sort === 'price-desc' ? 'selected' : ''}>Precio: mayor a menor</option><option value="name" ${filters.sort === 'name' ? 'selected' : ''}>Nombre</option><option value="rating" ${filters.sort === 'rating' ? 'selected' : ''}>Valoración</option></select></div>
  <button type="button" class="button button--ghost filters__clear" id="clear-filters">Limpiar</button>
</form>`;
