import bcrypt from 'bcrypt';
import { z } from 'zod';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { clearSessionCookie, setSessionCookie, signSession, verifySession } from '../utils/session.js';

const BCRYPT_ROUNDS = 12;

// bcrypt solo usa los primeros 72 bytes de la contraseña.
const password = z
  .string({ error: 'La contraseña es obligatoria.' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .max(72, 'La contraseña no puede superar los 72 caracteres.');

const email = z
  .string({ error: 'El email es obligatorio.' })
  .trim()
  .toLowerCase()
  .max(254, 'El email es demasiado largo.')
  .pipe(z.email('Introduce un email válido.'));

export const registerSchema = z.object({
  name: z
    .string({ error: 'El nombre es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(60, 'El nombre no puede superar los 60 caracteres.'),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'La contraseña es obligatoria.' }).min(1, 'La contraseña es obligatoria.').max(72, 'Contraseña no válida.'),
});

// Hash ficticio: se compara aunque el email no exista, para que el tiempo de respuesta no delate qué cuentas existen.
const DUMMY_HASH = bcrypt.hashSync('contraseña-ficticia', BCRYPT_ROUNDS);

export const authController = (config) => {
  const startSession = (res, user) => setSessionCookie(res, signSession(user, config), config);

  return {
    async register(req, res) {
      const { name, email: address, password: plain } = req.valid.body;
      const passwordHash = await bcrypt.hash(plain, BCRYPT_ROUNDS);
      let user;
      try {
        user = await User.create({ name, email: address, passwordHash });
      } catch (error) {
        if (error.code === 11000) throw new AppError(409, 'EMAIL_TAKEN', 'Ya existe una cuenta con ese email.');
        throw error;
      }
      startSession(res, user);
      res.status(201).json({ user });
    },

    async login(req, res) {
      const { email: address, password: plain } = req.valid.body;
      const user = await User.findOne({ email: address }).select('+passwordHash');
      const valid = await bcrypt.compare(plain, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Email o contraseña incorrectos.');
      startSession(res, user);
      res.json({ user });
    },

    /** Cierra la sesión de verdad: borra la cookie e invalida los tokens ya emitidos. */
    async logout(req, res) {
      const token = req.cookies?.[config.cookie.name];
      const payload = token ? verifySession(token, config) : null;
      if (payload && typeof payload.sub === 'string') {
        await User.updateOne({ _id: payload.sub, tokenVersion: payload.tv }, { $inc: { tokenVersion: 1 } });
      }
      clearSessionCookie(res, config);
      res.json({ ok: true });
    },

    me(req, res) {
      res.json({ user: req.user });
    },
  };
};
