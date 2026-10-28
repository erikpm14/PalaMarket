import { createApp } from '../server/src/app.js';
import { loadConfig } from '../server/src/config/env.js';

// Punto de entrada de la función de Vercel: reutiliza la misma aplicación Express que `server/`.
export default createApp(loadConfig());
