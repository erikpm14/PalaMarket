import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { clearSessionCookie, verifySession } from '../utils/session.js';

/** Protege las rutas privadas: lee la cookie httpOnly, comprueba el token y carga al usuario. */
export const requireAuth = (config) => async (req, res, next) => {
  const token = req.cookies?.[config.cookie.name];
  const payload = token ? verifySession(token, config) : null;
  // Si había una cookie que ya no vale, se elimina para que el navegador deje de enviarla.
  const reject = (message) => {
    if (token) clearSessionCookie(res, config);
    return next(new AppError(401, 'UNAUTHENTICATED', message));
  };
  if (!payload || typeof payload.sub !== 'string') return reject('Inicia sesión para continuar.');
  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tv) return reject('Tu sesión ha caducado. Inicia sesión de nuevo.');
  req.user = user;
  return next();
};
