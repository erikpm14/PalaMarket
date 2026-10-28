import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';

export const corsMiddleware = (config) =>
  cors({
    origin: (origin, callback) => callback(null, !origin || config.corsOrigins.includes(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
  });

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Defensa frente a CSRF: una petición que modifica datos y declara un origen
 * debe venir del propio sitio o de uno de los orígenes permitidos.
 */
export const originCheck = (config) => (req, _res, next) => {
  const origin = req.get('origin');
  if (!origin || !UNSAFE_METHODS.has(req.method)) return next();
  const own = `${req.protocol}://${req.get('host')}`;
  if (origin === own || config.corsOrigins.includes(origin)) return next();
  return next(new AppError(403, 'ORIGIN_NOT_ALLOWED', 'Origen no permitido.'));
};

const limiter = ({ windowMs, max, code, message }) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new AppError(429, code, message)),
  });

export const apiLimiter = (config) =>
  limiter({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.apiMax, code: 'RATE_LIMITED', message: 'Demasiadas peticiones. Espera unos minutos.' });

/** Límite estricto para registro e inicio de sesión (frena la fuerza bruta). */
export const authLimiter = (config) =>
  limiter({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.authMax, code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos. Inténtalo de nuevo en unos minutos.' });
