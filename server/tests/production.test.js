import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { disconnectDb } from '../src/config/db.js';
import { SECRET, newUser } from './helpers.js';

const DOMAIN = 'palamarket.vercel.app';
const ORIGIN = `https://${DOMAIN}`;

let mongo;
let app;

/** Cabeceras que añade la plataforma delante de la API (HTTPS, dominio y IP del visitante). */
const edge = (ip = '203.0.113.10') => ({ Host: DOMAIN, 'X-Forwarded-Proto': 'https', 'X-Forwarded-For': ip });

before(async () => {
  mongo = await MongoMemoryServer.create();
  const config = loadConfig({
    NODE_ENV: 'production',
    JWT_SECRET: SECRET,
    MONGODB_URI: mongo.getUri('palamarket_prod'),
    CORS_ORIGINS: ORIGIN,
    AUTH_RATE_LIMIT_MAX: '3',
  });
  app = createApp(config);
});
after(async () => {
  await disconnectDb();
  await mongo.stop();
});

// Cada petición simula a un visitante distinto para que el límite de intentos no interfiera entre pruebas.
let visitor = 0;
const post = (path, body, headers = {}) => request(app).post(path).set({ ...edge(`203.0.113.${(visitor += 1)}`), ...headers }).send(body);

describe('producción: cookies', () => {
  it('la sesión es httpOnly + Secure + SameSite=Lax y la cookie-señal es Secure sin httpOnly', async () => {
    const res = await post('/api/auth/register', newUser(), { Origin: ORIGIN });
    assert.equal(res.status, 201);
    const cookies = res.headers['set-cookie'];
    const session = cookies.find((c) => c.startsWith('pm_session='));
    const hint = cookies.find((c) => c.startsWith('pm_auth='));
    for (const attr of [/HttpOnly/i, /Secure/i, /SameSite=Lax/i, /Path=\//, /Expires=/i]) assert.match(session, attr);
    assert.match(hint, /Secure/i);
    assert.match(hint, /SameSite=Lax/i);
    assert.ok(!/HttpOnly/i.test(hint));
  });

  it('el cierre de sesión borra ambas cookies con los mismos atributos', async () => {
    const reg = await post('/api/auth/register', newUser(), { Origin: ORIGIN });
    const cookie = reg.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');
    const out = await request(app).post('/api/auth/logout').set({ ...edge(), Origin: ORIGIN, Cookie: cookie });
    const cleared = out.headers['set-cookie'];
    assert.equal(out.status, 200);
    for (const name of ['pm_session', 'pm_auth']) {
      const line = cleared.find((c) => c.startsWith(`${name}=;`));
      assert.ok(line, name);
      assert.match(line, /Secure/i);
      assert.match(line, /SameSite=Lax/i);
      assert.match(line, /Expires=Thu, 01 Jan 1970/);
    }
  });
});

describe('producción: CORS y CSRF', () => {
  it('solo el dominio real recibe permiso CORS con credenciales (ni localhost ni otros)', async () => {
    const ok = await request(app).get('/api/health').set({ ...edge(), Origin: ORIGIN });
    assert.equal(ok.headers['access-control-allow-origin'], ORIGIN);
    assert.equal(ok.headers['access-control-allow-credentials'], 'true');
    for (const origin of ['http://localhost:5173', 'https://sitio-malicioso.example', 'https://palamarket.vercel.app.evil.example']) {
      const res = await request(app).get('/api/health').set({ ...edge(), Origin: origin });
      assert.equal(res.headers['access-control-allow-origin'], undefined, origin);
    }
  });

  it('bloquea escrituras desde otros orígenes, pero admite el propio dominio y las previews', async () => {
    const evil = await post('/api/auth/login', { email: 'a@b.co', password: 'x' }, { Origin: 'https://sitio-malicioso.example' });
    assert.equal(evil.status, 403);
    assert.equal(evil.body.error.code, 'ORIGIN_NOT_ALLOWED');

    const own = await post('/api/auth/login', { email: 'a@b.co', password: 'x' }, { Origin: ORIGIN });
    assert.equal(own.status, 401);

    // Una vista previa de Vercel tiene su propio dominio: el origen coincide con su Host.
    const preview = 'palamarket-git-feature-backend-auth.vercel.app';
    const res = await request(app).post('/api/auth/login').set({ ...edge('203.0.113.50'), Host: preview, Origin: `https://${preview}` }).send({ email: 'a@b.co', password: 'x' });
    assert.equal(res.status, 401);
  });
});

describe('producción: Helmet, errores y secretos', () => {
  it('envía las cabeceras de seguridad (incluido HSTS) y no revela el servidor', async () => {
    const res = await request(app).get('/api/health').set(edge());
    assert.match(res.headers['strict-transport-security'], /max-age=\d+/);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
    assert.ok(res.headers['content-security-policy']);
    assert.ok(res.headers['referrer-policy']);
    assert.equal(res.headers['x-powered-by'], undefined);
  });

  it('valida las entradas también en producción', async () => {
    const res = await post('/api/auth/register', { name: 'A', email: 'mal', password: '1' }, { Origin: ORIGIN });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  it('ninguna respuesta ni cabecera expone contraseñas, hashes, el JWT, el secreto ni variables privadas', async () => {
    const user = newUser();
    const reg = await post('/api/auth/register', user, { Origin: ORIGIN });
    const session = reg.headers['set-cookie'].find((c) => c.startsWith('pm_session=')).split(';')[0].split('=')[1];
    const cookie = reg.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');
    const responses = [
      reg,
      await post('/api/auth/login', { email: user.email, password: user.password }, { Origin: ORIGIN }),
      await post('/api/auth/login', { email: user.email, password: 'incorrecta1' }, { Origin: ORIGIN }),
      await request(app).get('/api/auth/me').set({ ...edge(), Cookie: cookie }),
      await request(app).get('/api/favorites').set({ ...edge(), Cookie: cookie }),
      await request(app).get('/api/cart').set({ ...edge(), Cookie: cookie }),
      await request(app).get('/api/health').set(edge()),
      await request(app).get('/api/nada').set(edge()),
    ];
    const forbidden = [SECRET, user.password, session, '$2b$', 'passwordHash', 'JWT_SECRET', 'MONGODB_URI', 'mongodb://', 'tokenVersion'];
    for (const res of responses) {
      // El token solo puede viajar en la cabecera Set-Cookie, nunca en el cuerpo.
      const visible = JSON.stringify(res.body) + JSON.stringify({ ...res.headers, 'set-cookie': undefined });
      for (const secret of forbidden) assert.ok(!visible.includes(secret), `${res.req.path} expone "${secret}"`);
    }
  });
});

describe('producción: límite de intentos detrás de un proxy', () => {
  it('cuenta por IP real del visitante: añadir direcciones falsas no permite saltarse el límite', async () => {
    const attempt = (forwardedFor) => request(app).post('/api/auth/login').set({ Host: DOMAIN, 'X-Forwarded-Proto': 'https', 'X-Forwarded-For': forwardedFor }).send({ email: 'nadie@ejemplo.com', password: 'incorrecta123' });
    const statuses = [];
    // La plataforma añade la IP real al final; el visitante intenta inventarse otras al principio.
    for (let i = 0; i < 5; i += 1) statuses.push((await attempt(`10.0.0.${i}, 198.51.100.7`)).status);
    assert.deepEqual(statuses, [401, 401, 401, 429, 429]);
    const other = await attempt('198.51.100.99');
    assert.equal(other.status, 401, 'otro visitante no debe verse afectado');
    const blocked = await attempt('1.2.3.4, 198.51.100.7');
    assert.equal(blocked.body.error.code, 'TOO_MANY_ATTEMPTS');
  });
});
