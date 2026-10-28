const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const SAME_SITE_VALUES = ['lax', 'strict', 'none'];

const list = (value) => (value ?? '').split(',').map((item) => item.trim()).filter(Boolean);

/**
 * Lee y valida la configuración. Falla al arrancar si falta algo crítico,
 * en lugar de funcionar con valores inseguros por defecto.
 */
export const loadConfig = (env = process.env) => {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const isProduction = nodeEnv === 'production';
  const jwtSecret = env.JWT_SECRET ?? '';
  const mongoUri = env.MONGODB_URI ?? '';

  if (jwtSecret.length < 32) throw new Error('JWT_SECRET es obligatorio y debe tener al menos 32 caracteres.');
  if (!mongoUri && nodeEnv !== 'test') throw new Error('MONGODB_URI es obligatorio.');

  const origins = list(env.CORS_ORIGINS);
  if (isProduction && origins.length === 0) throw new Error('CORS_ORIGINS es obligatorio en producción (dominio real de la web).');

  const jwtExpiresIn = env.JWT_EXPIRES_IN ?? '7d';
  if (!/^\d+[smhd]?$/.test(jwtExpiresIn)) throw new Error('JWT_EXPIRES_IN debe ser un número seguido de s, m, h o d (por ejemplo 7d).');

  const sameSite = (env.COOKIE_SAME_SITE ?? 'lax').toLowerCase();
  if (!SAME_SITE_VALUES.includes(sameSite)) throw new Error('COOKIE_SAME_SITE debe ser lax, strict o none.');

  return {
    nodeEnv,
    isProduction,
    port: Number(env.PORT ?? 4000),
    mongoUri,
    jwtSecret,
    dbTimeoutMs: Number(env.DB_TIMEOUT_MS ?? 8000),
    jwtExpiresIn,
    corsOrigins: origins.length ? origins : DEV_ORIGINS,
    cookie: {
      name: 'pm_session',
      // Señal sin datos ("hay sesión"): permite al frontend no consultar la API si no puede haber sesión.
      hintName: 'pm_auth',
      // SameSite=None solo es válido con Secure, así que lo fuerza.
      secure: isProduction || sameSite === 'none',
      sameSite,
      maxAgeMs: Number(env.COOKIE_MAX_AGE_DAYS ?? 7) * 24 * 60 * 60 * 1000,
    },
    trustProxy: env.TRUST_PROXY === undefined ? (isProduction ? 1 : false) : Number(env.TRUST_PROXY),
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      authMax: Number(env.AUTH_RATE_LIMIT_MAX ?? 10),
      apiMax: Number(env.API_RATE_LIMIT_MAX ?? 300),
    },
  };
};
