/** Aviso discreto cuando la API no responde: la tienda sigue funcionando sin cuenta. */
export const ServiceBanner = (state) => (state.apiOnline
  ? ''
  : `<div class="service-banner" role="status">
    <p>No se puede conectar con el servidor, por lo que el inicio de sesión no está disponible. Puedes seguir explorando el catálogo.</p>
    <button class="button button--small button--secondary" type="button" data-action="retry-session">Reintentar</button>
  </div>`);
