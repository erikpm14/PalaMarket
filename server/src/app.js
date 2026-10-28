import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { connectDb } from './config/db.js';
import { User } from './models/User.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter, corsMiddleware, originCheck } from './middleware/security.js';
import { createRouter } from './routes/index.js';

export const createApp = (config) => {
  const app = express();
  if (config.trustProxy !== false) app.set('trust proxy', config.trustProxy);

  app.use(helmet());
  app.use(corsMiddleware(config));
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use('/api', apiLimiter(config), originCheck(config));

  // En serverless no hay arranque previo: la conexión se abre en la primera petición y se reutiliza.
  app.use('/api', async (_req, _res, next) => {
    try {
      await connectDb(config.mongoUri, config.dbTimeoutMs);
      // El índice único del email debe existir antes de aceptar registros (evita duplicados en el arranque en frío).
      await User.init();
      next();
    } catch (error) {
      console.error('No se pudo conectar con la base de datos:', error.name);
      next(Object.assign(new Error('Base de datos no disponible'), { isDbError: true }));
    }
  });

  app.use('/api', createRouter(config));
  app.use(notFound);
  app.use(errorHandler(config.isProduction));
  return app;
};
