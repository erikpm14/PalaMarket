/**
 * Cliente HTTP de la API. Centraliza las peticiones, el formato de errores y los
 * tiempos de espera. La sesión viaja en una cookie httpOnly: el navegador la
 * adjunta solo y el código de la aplicación nunca la ve ni la guarda.
 */
const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const TIMEOUT_MS = 10000;

const FALLBACK_MESSAGES = {
  NETWORK_ERROR: 'No se puede conectar con el servidor. Comprueba tu conexión.',
  TIMEOUT: 'El servidor tarda demasiado en responder. Inténtalo de nuevo.',
  SERVER_UNAVAILABLE: 'El servidor no está disponible ahora mismo. Inténtalo más tarde.',
  REQUEST_FAILED: 'No se pudo completar la operación.',
};

export class ApiError extends Error {
  constructor({ status = 0, code = 'NETWORK_ERROR', message, details = [] }) {
    super(message ?? FALLBACK_MESSAGES[code] ?? FALLBACK_MESSAGES.REQUEST_FAILED);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Errores de validación por campo, p. ej. { email: 'Introduce un email válido.' }. */
  get fieldErrors() {
    return Object.fromEntries(this.details.map(({ field, message }) => [field, message]));
  }
}

/** True cuando el fallo es de conectividad o del servicio (no del usuario). */
export const isConnectivityError = (error) =>
  error instanceof ApiError && (error.status === 0 || ['SERVER_UNAVAILABLE', 'DATABASE_UNAVAILABLE'].includes(error.code));

const request = async (method, path, body) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const code = data?.error?.code ?? (response.status >= 500 ? 'SERVER_UNAVAILABLE' : 'REQUEST_FAILED');
      throw new ApiError({ status: response.status, ...data?.error, code });
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError({ status: 0, code: error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR' });
  } finally {
    clearTimeout(timer);
  }
};

const item = (productId) => encodeURIComponent(productId);

export const api = {
  register: (data) => request('POST', '/auth/register', data),
  login: (data) => request('POST', '/auth/login', data),
  logout: () => request('POST', '/auth/logout'),
  me: () => request('GET', '/auth/me'),
  health: () => request('GET', '/health'),

  getFavorites: () => request('GET', '/favorites'),
  addFavorite: (productId) => request('PUT', `/favorites/${item(productId)}`),
  removeFavorite: (productId) => request('DELETE', `/favorites/${item(productId)}`),
  mergeFavorites: (ids) => request('POST', '/favorites/merge', { ids }),

  getCart: () => request('GET', '/cart'),
  setCartItem: (productId, quantity) => request('PUT', `/cart/${item(productId)}`, { quantity }),
  removeCartItem: (productId) => request('DELETE', `/cart/${item(productId)}`),
  clearCart: () => request('DELETE', '/cart'),
  mergeCart: (items) => request('POST', '/cart/merge', { items }),
};
