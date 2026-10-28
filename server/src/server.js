import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { connectDb } from './config/db.js';

// En desarrollo las variables se leen de server/.env; en producción las aporta la plataforma.
try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch {
  // Sin archivo .env: se usan las variables del entorno.
}

let config;
try {
  config = loadConfig();
} catch (error) {
  console.error(`Configuración no válida: ${error.message}`);
  process.exit(1);
}

try {
  await connectDb(config.mongoUri, config.dbTimeoutMs);
  console.log('Conectado a MongoDB');
} catch (error) {
  console.error('No se pudo conectar con MongoDB:', error.message);
  process.exit(1);
}

createApp(config).listen(config.port, () => {
  console.log(`API de PalaMarket escuchando en http://localhost:${config.port}`);
});
