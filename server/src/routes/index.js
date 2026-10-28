import { Router } from 'express';
import { isDbReady } from '../config/db.js';
import { authController, loginSchema, registerSchema } from '../controllers/auth.controller.js';
import { cartController, mergeCartSchema, setQuantitySchema } from '../controllers/cart.controller.js';
import { favoritesController, mergeFavoritesSchema, productParams } from '../controllers/favorites.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';

export const createRouter = (config) => {
  const router = Router();
  const auth = authController(config);
  const protect = requireAuth(config);
  const params = validate(productParams, 'params');
  // Un único contador para registro e inicio de sesión: no se pueden alternar para duplicar los intentos.
  const limitAuth = authLimiter(config);

  router.get('/health', (_req, res) => res.json({ status: 'ok', database: isDbReady() ? 'up' : 'down' }));

  router.post('/auth/register', limitAuth, validate(registerSchema), auth.register);
  router.post('/auth/login', limitAuth, validate(loginSchema), auth.login);
  router.post('/auth/logout', auth.logout);
  router.get('/auth/me', protect, auth.me);

  router.get('/favorites', protect, favoritesController.list);
  router.post('/favorites/merge', protect, validate(mergeFavoritesSchema), favoritesController.merge);
  router.put('/favorites/:productId', protect, params, favoritesController.add);
  router.delete('/favorites/:productId', protect, params, favoritesController.remove);

  router.get('/cart', protect, cartController.list);
  router.post('/cart/merge', protect, validate(mergeCartSchema), cartController.merge);
  router.delete('/cart', protect, cartController.clear);
  router.put('/cart/:productId', protect, params, validate(setQuantitySchema), cartController.setQuantity);
  router.delete('/cart/:productId', protect, params, cartController.remove);

  return router;
};
