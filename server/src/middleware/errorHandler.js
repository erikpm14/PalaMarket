import { AppError } from '../utils/AppError.js';

export const notFound = (_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Ruta no encontrada.'));

/** Formato único de error: { error: { code, message, details? } }. No expone trazas ni mensajes de la base de datos. */
export const errorHandler = (isProduction) => (error, _req, res, _next) => {
  if (error instanceof AppError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message, ...(error.details && { details: error.details }) } });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'El cuerpo de la petición no es un JSON válido.' } });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'La petición es demasiado grande.' } });
  }
  if (error.isDbError) {
    return res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'El servicio no está disponible en este momento. Inténtalo más tarde.' } });
  }
  if (!isProduction) console.error(error);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' } });
};
