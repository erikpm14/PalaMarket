import { z } from 'zod';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { isKnownProduct } from '../utils/catalog.js';

export const productParams = z.object({ productId: z.string().min(1).max(80) });
export const mergeFavoritesSchema = z.object({ ids: z.array(z.string().max(80)).max(200) });

// Todas las operaciones usan req.user._id: un usuario no puede tocar los datos de otro.
export const favoritesController = {
  list: (req, res) => res.json({ favorites: req.user.favorites }),

  async add(req, res) {
    const { productId } = req.valid.params;
    if (!isKnownProduct(productId)) throw new AppError(404, 'UNKNOWN_PRODUCT', 'Esa pala no existe en el catálogo.');
    const user = await User.findByIdAndUpdate(req.user._id, { $addToSet: { favorites: productId } }, { new: true });
    res.json({ favorites: user.favorites });
  },

  async remove(req, res) {
    const user = await User.findByIdAndUpdate(req.user._id, { $pull: { favorites: req.valid.params.productId } }, { new: true });
    res.json({ favorites: user.favorites });
  },

  /** Incorpora los favoritos guardados como anónimo al iniciar sesión; ignora los identificadores desconocidos. */
  async merge(req, res) {
    const ids = [...new Set(req.valid.body.ids)].filter(isKnownProduct);
    const user = await User.findByIdAndUpdate(req.user._id, { $addToSet: { favorites: { $each: ids } } }, { new: true });
    res.json({ favorites: user.favorites });
  },
};
