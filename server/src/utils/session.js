import jwt from 'jsonwebtoken';

const ALGORITHM = 'HS256';

/** El token solo identifica al usuario y la versión de sesión; nunca datos personales. */
export const signSession = (user, config) =>
  jwt.sign({ sub: user.id, tv: user.tokenVersion }, config.jwtSecret, {
    algorithm: ALGORITHM,
    expiresIn: config.jwtExpiresIn,
  });

export const verifySession = (token, config) => {
  try {
    return jwt.verify(token, config.jwtSecret, { algorithms: [ALGORITHM] });
  } catch {
    return null;
  }
};

const baseCookie = (config) => ({
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  path: '/',
});

export const setSessionCookie = (res, token, config) => {
  const maxAge = config.cookie.maxAgeMs;
  res.cookie(config.cookie.name, token, { ...baseCookie(config), httpOnly: true, maxAge });
  res.cookie(config.cookie.hintName, '1', { ...baseCookie(config), httpOnly: false, maxAge });
};

export const clearSessionCookie = (res, config) => {
  res.clearCookie(config.cookie.name, { ...baseCookie(config), httpOnly: true });
  res.clearCookie(config.cookie.hintName, { ...baseCookie(config), httpOnly: false });
};
