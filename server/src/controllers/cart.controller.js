import { z } from 'zod';
import { AppError } from '../utils/AppError.js';
import { isKnownProduct, stockOf } from '../utils/catalog.js';

const MAX_LINES = 100;
const MAX_QUANTITY = 99;

const quantity = z
  .number({ error: 'La cantidad debe ser un número.' })
  .int('La cantidad debe ser un número entero.')
  .min(0, 'La cantidad no puede ser negativa.')
  .max(MAX_QUANTITY, `La cantidad máxima es ${MAX_QUANTITY}.`);

export const setQuantitySchema = z.object({ quantity });
export const mergeCartSchema = z.object({
  items: z
    .array(z.object({ productId: z.string().max(80), quantity: z.number().int().min(1).max(MAX_QUANTITY) }))
    .max(MAX_LINES),
});

const view = (user) => ({ cart: user.cart.map((line) => ({ productId: line.productId, quantity: line.quantity })) });

// Todas las operaciones se aplican sobre req.user: el carrito de otra persona es inaccesible.
export const cartController = {
  list: (req, res) => res.json(view(req.user)),

  async setQuantity(req, res) {
    const { productId } = req.valid.params;
    const wanted = req.valid.body.quantity;
    if (!isKnownProduct(productId)) throw new AppError(404, 'UNKNOWN_PRODUCT', 'Esa pala no existe en el catálogo.');
    if (wanted > stockOf(productId)) {
      throw new AppError(422, 'QUANTITY_EXCEEDS_STOCK', `Solo quedan ${stockOf(productId)} unidades de esa pala.`);
    }

    const lines = req.user.cart.filter((line) => line.productId !== productId);
    if (wanted > 0) {
      if (lines.length >= MAX_LINES) throw new AppError(422, 'CART_FULL', 'El carrito no admite más productos distintos.');
      lines.push({ productId, quantity: wanted });
    }
    req.user.cart = lines;
    await req.user.save();
    res.json(view(req.user));
  },

  async remove(req, res) {
    req.user.cart = req.user.cart.filter((line) => line.productId !== req.valid.params.productId);
    await req.user.save();
    res.json(view(req.user));
  },

  async clear(req, res) {
    req.user.cart = [];
    await req.user.save();
    res.json(view(req.user));
  },

  /** Suma el carrito anónimo al del usuario respetando el stock de cada pala. */
  async merge(req, res) {
    const lines = new Map(req.user.cart.map((line) => [line.productId, line.quantity]));
    for (const item of req.valid.body.items) {
      if (!isKnownProduct(item.productId)) continue;
      const total = (lines.get(item.productId) ?? 0) + item.quantity;
      lines.set(item.productId, Math.min(total, stockOf(item.productId), MAX_QUANTITY));
    }
    req.user.cart = [...lines]
      .filter(([, amount]) => amount > 0)
      .slice(0, MAX_LINES)
      .map(([productId, amount]) => ({ productId, quantity: amount }));
    await req.user.save();
    res.json(view(req.user));
  },
};
