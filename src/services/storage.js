const PREFIX = 'palamarket:';

/**
 * Acceso a localStorage. Solo se guardan datos no sensibles: la preferencia de
 * tema y los favoritos y el carrito de quien aún no ha iniciado sesión.
 */
export const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(`${PREFIX}${key}`);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    } catch {
      // La aplicación sigue funcionando si el navegador bloquea el almacenamiento.
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(`${PREFIX}${key}`);
    } catch {
      // Sin acceso al almacenamiento no hay nada que borrar.
    }
  },
};
