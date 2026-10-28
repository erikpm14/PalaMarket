import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { baseEnv, newUser, startTestApp } from './helpers.js';
import { loadConfig } from '../src/config/env.js';

let ctx;
before(async () => { ctx = await startTestApp(); });
after(async () => { await ctx.stop(); });

// Cada invocación serverless puede ejecutarse en una instancia distinta, sin memoria compartida.
// Se simulan varias aplicaciones independientes que solo comparten la base de datos.
const instance = () => createApp(loadConfig(baseEnv(ctx.config.mongoUri)));
const cookieHeader = (res) => res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');

describe('entorno serverless: sin estado en memoria', () => {
  it('una sesión creada en una instancia es válida en otra', async () => {
    const [a, b] = [instance(), instance()];
    const reg = await request(a).post('/api/auth/register').send(newUser());
    const cookie = cookieHeader(reg);
    assert.equal((await request(b).get('/api/auth/me').set('Cookie', cookie)).status, 200);
    await request(a).put('/api/favorites/coello-pro').set('Cookie', cookie);
    assert.deepEqual((await request(b).get('/api/favorites').set('Cookie', cookie)).body.favorites, ['coello-pro']);
  });

  it('el cierre de sesión en una instancia invalida el token en todas las demás, también en las nuevas', async () => {
    const [a, b] = [instance(), instance()];
    const reg = await request(a).post('/api/auth/register').send(newUser());
    const cookie = cookieHeader(reg);
    assert.equal((await request(a).get('/api/auth/me').set('Cookie', cookie)).status, 200);

    assert.equal((await request(b).post('/api/auth/logout').set('Cookie', cookie)).status, 200);

    assert.equal((await request(a).get('/api/auth/me').set('Cookie', cookie)).status, 401);
    assert.equal((await request(b).get('/api/auth/me').set('Cookie', cookie)).status, 401);
    const cold = instance(); // arranque en frío posterior al cierre de sesión
    assert.equal((await request(cold).get('/api/auth/me').set('Cookie', cookie)).status, 401);
    assert.equal((await request(cold).get('/api/favorites').set('Cookie', cookie)).status, 401);
  });

  it('volver a iniciar sesión da un token nuevo válido; el antiguo sigue invalidado', async () => {
    const [a, b] = [instance(), instance()];
    const user = newUser();
    const reg = await request(a).post('/api/auth/register').send(user);
    const old = cookieHeader(reg);
    await request(a).post('/api/auth/logout').set('Cookie', old);
    const login = await request(b).post('/api/auth/login').send({ email: user.email, password: user.password });
    const fresh = cookieHeader(login);
    assert.equal((await request(a).get('/api/auth/me').set('Cookie', fresh)).status, 200);
    assert.equal((await request(a).get('/api/auth/me').set('Cookie', old)).status, 401);
  });

  it('el registro simultáneo con el mismo email desde varias instancias crea una sola cuenta', async () => {
    const instances = [instance(), instance(), instance(), instance()];
    const data = newUser();
    const results = await Promise.all(instances.map((app) => request(app).post('/api/auth/register').send(data)));
    assert.equal(results.filter((r) => r.status === 201).length, 1);
    assert.equal(results.filter((r) => r.status === 409).length, 3);
  });
});
