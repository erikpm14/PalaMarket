import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { isKnownProduct, stockOf } from '../utils/catalog.js';

const MAX_LINES = 100;
const MAX_QUANTITY = 99;
// Los operadores de estas consultas son propios, no vienen del cliente: se marcan como de confianza.
const { trusted } = mongoose;

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

const readCart = async (userId) => {
  const user = await User.findById(userId).select('cart');
  return { cart: user.cart.map((line) => ({ productId: line.productId, quantity: line.quantity })) };
};

/**
 * Todas las escrituras son operaciones atómicas de MongoDB sobre una línea concreta,
 * nunca «leer el carrito, modificarlo y guardarlo entero»: dos pestañas, dispositivos
 * o instancias que cambian productos distintos a la vez no se pisan entre sí.
 */
const setLine = async (userId, productId, amount) => {
  // La línea ya existe: se fija su cantidad.
  const updated = await User.updateOne({ _id: userId, 'cart.productId': productId }, { $set: { 'cart.$.quantity': amount } });
  if (updated.matchedCount) return true;
  // No existe: se añade solo si sigue sin existir y queda hueco.
  const pushed = await User.updateOne(
    { _id: userId, 'cart.productId': trusted({ $ne: productId }), [`cart.${MAX_LINES - 1}`]: trusted({ $exists: false }) },
    { $push: { cart: { productId, quantity: amount } } },
  );
  return pushed.matchedCount > 0;
};

/**
 * Sube la cantidad de una línea hasta `amount` si es menor (nunca la reduce): idempotente.
 * Devuelve false solo si la línea no existe y no cabe (carrito lleno).
 */
const raiseLine = async (userId, productId, amount) => {
  // Hasta dos vueltas: si otra fusión simultánea inserta la línea entre medias, la segunda vuelta
  // ya la encuentra y la sube, de modo que el resultado converge siempre al máximo.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raised = await User.updateOne(
      { _id: userId, cart: trusted({ $elemMatch: { productId, quantity: { $lt: amount } } }) },
      { $set: { 'cart.$.quantity': amount } },
    );
    if (raised.matchedCount) return true;
    const pushed = await User.updateOne(
      { _id: userId, 'cart.productId': trusted({ $ne: productId }), [`cart.${MAX_LINES - 1}`]: trusted({ $exists: false }) },
      { $push: { cart: { productId, quantity: amount } } },
    );
    if (pushed.matchedCount) return true;
  }
  // Ni se pudo subir ni insertar: o ya hay una línea con cantidad suficiente, o el carrito está lleno.
  return (await User.exists({ _id: userId, 'cart.productId': productId })) !== null;
};

// Todas las operaciones se aplican sobre req.user._id: el carrito de otra persona es inaccesible.
export const cartController = {
  async list(req, res) {
    res.json(await readCart(req.user._id));
  },

  async setQuantity(req, res) {
    const { productId } = req.valid.params;
    const wanted = req.valid.body.quantity;
    if (!isKnownProduct(productId)) throw new AppError(404, 'UNKNOWN_PRODUCT', 'Esa pala no existe en el catálogo.');
    if (wanted > stockOf(productId)) {
      throw new AppError(422, 'QUANTITY_EXCEEDS_STOCK', `Solo quedan ${stockOf(productId)} unidades de esa pala.`);
    }

    if (wanted === 0) {
      await User.updateOne({ _id: req.user._id }, { $pull: { cart: { productId } } });
    } else if (!(await setLine(req.user._id, productId, wanted)) && !(await setLine(req.user._id, productId, wanted))) {
      // El segundo intento cubre la carrera «otra petición acaba de añadir esta línea».
      throw new AppError(422, 'CART_FULL', 'El carrito no admite más productos distintos.');
    }
    res.json(await readCart(req.user._id));
  },

  async remove(req, res) {
    await User.updateOne({ _id: req.user._id }, { $pull: { cart: { productId: req.valid.params.productId } } });
    res.json(await readCart(req.user._id));
  },

  async clear(req, res) {
    await User.updateOne({ _id: req.user._id }, { $set: { cart: [] } });
    res.json(await readCart(req.user._id));
  },

  /**
   * Incorpora el carrito guardado como anónimo conservando la mayor cantidad de cada pala
   * (respetando el stock). Es idempotente: repetir la misma fusión, por ejemplo tras perder
   * la respuesta, deja el carrito exactamente igual.
   */
  async merge(req, res) {
    const wanted = new Map();
    for (const item of req.valid.body.items) {
      if (!isKnownProduct(item.productId)) continue;
      const amount = Math.min(item.quantity, stockOf(item.productId), MAX_QUANTITY);
      if (amount > 0) wanted.set(item.productId, Math.max(wanted.get(item.productId) ?? 0, amount));
    }
    const rejected = [];
    for (const [productId, amount] of wanted) {
      if (!(await raiseLine(req.user._id, productId, amount))) rejected.push(productId);
    }
    // Si alguna línea no cupo se avisa: el cliente solo borra su copia local cuando todo se aceptó.
    if (rejected.length) throw new AppError(422, 'CART_FULL', 'El carrito no admite más productos distintos.', rejected.map((id) => ({ field: id, message: 'No cabe en el carrito.' })));
    res.json(await readCart(req.user._id));
  },
};
