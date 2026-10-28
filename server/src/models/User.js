import mongoose from 'mongoose';

const cartLineSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, max: 99 },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    // Solo se guarda el hash de bcrypt y nunca se devuelve en las consultas.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Se incrementa al cerrar sesión: invalida los tokens emitidos anteriormente.
    tokenVersion: { type: Number, default: 0 },
    favorites: { type: [String], default: [] },
    cart: { type: [cartLineSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => ({
        id: ret._id.toString(),
        name: ret.name,
        email: ret.email,
        role: ret.role,
        createdAt: ret.createdAt,
      }),
    },
  },
);

export const User = mongoose.model('User', userSchema, 'users');
