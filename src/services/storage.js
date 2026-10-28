const PREFIX = 'palamarket:';

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
};
