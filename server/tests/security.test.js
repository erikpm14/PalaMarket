import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { ORIGIN, SECRET, baseEnv, newUser, startTestApp } from './helpers.js';

let ctx;
before(async () => { ctx = await startTestApp(); });
after(async () => { await ctx.stop(); });

describe('cabeceras, CORS y origen', () => {
  it('aplica las cabeceras de seguridad de Helmet y no revela el framework', async () => {
    const res = await ctx.plain().get('/api/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok', database: 'up' });
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-powered-by'], undefined);
    assert.ok(res.headers['content-security-policy']);
  });

  it('CORS: solo el origen autorizado recibe permiso, con credenciales', async () => {
    const ok = await ctx.plain().get('/api/health').set('Origin', ORIGIN);
    assert.equal(ok.headers['access-control-allow-origin'], ORIGIN);
    assert.equal(ok.headers['access-control-allow-credentials'], 'true');

    const evil = await ctx.plain().get('/api/health').set('Origin', 'https://sitio-malicioso.example');
    assert.equal(evil.headers['access-control-allow-origin'], undefined);
    assert.notEqual(evil.headers['access-control-allow-origin'], '*');
  });

  it('CORS: la petición previa (preflight) solo se acepta desde el origen permitido', async () => {
    const ok = await ctx.plain().options('/api/auth/login').set('Origin', ORIGIN).set('Access-Control-Request-Method', 'POST');
    assert.equal(ok.headers['access-control-allow-origin'], ORIGIN);
    assert.match(ok.headers['access-control-allow-methods'], /POST/);
    const bad = await ctx.plain().options('/api/auth/login').set('Origin', 'https://sitio-malicioso.example').set('Access-Control-Request-Method', 'POST');
    assert.equal(bad.headers['access-control-allow-origin'], undefined);
  });

  it('bloquea peticiones que modifican datos desde un origen no permitido (CSRF)', async () => {
    const res = await ctx.plain().post('/api/auth/login').set('Origin', 'https://sitio-malicioso.example').send({ email: 'a@b.co', password: 'x' });
    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'ORIGIN_NOT_ALLOWED');
    const allowed = await ctx.plain().post('/api/auth/login').set('Origin', ORIGIN).send({ email: 'a@b.co', password: 'x' });
    assert.equal(allowed.status, 401);
  });
});

describe('errores y límites', () => {
  it('todas las respuestas de error usan el mismo formato JSON', async () => {
    const notFound = await ctx.plain().get('/api/no-existe');
    assert.equal(notFound.status, 404);
    assert.equal(notFound.body.error.code, 'NOT_FOUND');
    assert.match(notFound.headers['content-type'], /json/);

    const badJson = await ctx.plain().post('/api/auth/login').set('Content-Type', 'application/json').send('{no es json');
    assert.equal(badJson.status, 400);
    assert.equal(badJson.body.error.code, 'INVALID_JSON');

    const big = await ctx.plain().post('/api/auth/register').send({ ...newUser(), name: 'x'.repeat(20000) });
    assert.equal(big.status, 413);
    assert.equal(big.body.error.code, 'PAYLOAD_TOO_LARGE');
  });

  it('los errores no revelan trazas ni detalles de la base de datos', async () => {
    const res = await ctx.plain().get('/api/cart').set('Cookie', 'pm_session=basura');
    const text = JSON.stringify(res.body);
    assert.ok(!/mongo|mongoose|stack|at .*\.js/i.test(text));
  });

  it('limita los intentos de login y registro (fuerza bruta)', async () => {
    const limited = createApp(loadConfig(baseEnv(ctx.config.mongoUri, { AUTH_RATE_LIMIT_MAX: '3' })));
    const statuses = [];
    for (let i = 0; i < 5; i += 1) {
      statuses.push((await request(limited).post('/api/auth/login').send({ email: 'a@b.co', password: 'mala-contraseña' })).status);
    }
    assert.deepEqual(statuses, [401, 401, 401, 429, 429]);
    const blocked = await request(limited).post('/api/auth/register').send(newUser());
    assert.equal(blocked.status, 429);
    assert.equal(blocked.body.error.code, 'TOO_MANY_ATTEMPTS');
  });
});

describe('configuración', () => {
  it('exige un secreto JWT largo y orígenes CORS en producción', () => {
    const ok = { NODE_ENV: 'production', JWT_SECRET: SECRET, MONGODB_URI: 'mongodb://x/y', CORS_ORIGINS: 'https://palamarket.vercel.app' };
    assert.doesNotThrow(() => loadConfig(ok));
    assert.throws(() => loadConfig({ ...ok, JWT_SECRET: 'corto' }), /JWT_SECRET/);
    assert.throws(() => loadConfig({ ...ok, JWT_SECRET: undefined }), /JWT_SECRET/);
    assert.throws(() => loadConfig({ ...ok, CORS_ORIGINS: '' }), /CORS_ORIGINS/);
    assert.throws(() => loadConfig({ ...ok, MONGODB_URI: '' }), /MONGODB_URI/);
    assert.throws(() => loadConfig({ ...ok, COOKIE_SAME_SITE: 'cualquiera' }), /COOKIE_SAME_SITE/);
  });

  it('en producción la cookie es Secure y la API nunca queda abierta a cualquier origen', () => {
    const prod = loadConfig({ NODE_ENV: 'production', JWT_SECRET: SECRET, MONGODB_URI: 'mongodb://x/y', CORS_ORIGINS: 'https://palamarket.vercel.app' });
    assert.equal(prod.cookie.secure, true);
    assert.deepEqual(prod.corsOrigins, ['https://palamarket.vercel.app']);
    assert.ok(!prod.corsOrigins.includes('*'));
    const cross = loadConfig({ NODE_ENV: 'development', JWT_SECRET: SECRET, MONGODB_URI: 'mongodb://x/y', COOKIE_SAME_SITE: 'none' });
    assert.equal(cross.cookie.secure, true);
  });
});
