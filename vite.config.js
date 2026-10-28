import { defineConfig } from 'vite';

// En desarrollo y en la vista previa la API se sirve desde el mismo origen que la web, igual que en producción.
const proxy = { '/api': { target: 'http://localhost:4000', changeOrigin: false } };

export default defineConfig({
  base: '/',
  server: { proxy },
  preview: { proxy },
});
