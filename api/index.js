import { createApp } from '../server/src/app.js';
import { loadConfig } from '../server/src/config/env.js';

// Punto de entrada de la función de Vercel: reutiliza la misma aplicación Express que `server/`.
// Si falta configuración se responde un 503 en JSON (sin nombres ni valores) en lugar de dejar caer la función.
const unconfigured = (_req, res) => {
  res.statusCode = 503;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: { code: 'SERVICE_NOT_CONFIGURED', message: 'El servicio no está configurado.' } }));
};

let handler;
try {
  handler = createApp(loadConfig());
} catch (error) {
  console.error(`Configuración no válida: ${error.message}`);
  handler = unconfigured;
}

export default handler;
