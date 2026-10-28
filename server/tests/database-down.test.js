import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { baseEnv } from './helpers.js';

describe('base de datos no disponible', () => {
  it('responde 503 con un mensaje genérico, sin filtrar la cadena de conexión', async () => {
    const uri = 'mongodb://usuario:clave-secreta@127.0.0.1:1/palamarket?serverSelectionTimeoutMS=500';
    const app = createApp(loadConfig(baseEnv(uri, { DB_TIMEOUT_MS: '800' })));
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'contraseña1' });
    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, 'DATABASE_UNAVAILABLE');
    const text = JSON.stringify(res.body);
    assert.ok(!text.includes('clave-secreta') && !text.includes('127.0.0.1') && !/mongo/i.test(text));
  });
});
