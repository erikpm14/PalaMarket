import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { disconnectDb } from '../src/config/db.js';

export const ORIGIN = 'http://localhost:5173';
export const SECRET = 'secreto-solo-para-pruebas-con-mas-de-32-caracteres';

export const baseEnv = (uri, extra = {}) => ({
  NODE_ENV: 'test',
  JWT_SECRET: SECRET,
  MONGODB_URI: uri,
  CORS_ORIGINS: ORIGIN,
  AUTH_RATE_LIMIT_MAX: '1000',
  API_RATE_LIMIT_MAX: '10000',
  ...extra,
});

/** Arranca una base de datos MongoDB en memoria y una aplicación configurada para pruebas. */
export const startTestApp = async (extraEnv = {}) => {
  const mongo = await MongoMemoryServer.create();
  const config = loadConfig(baseEnv(mongo.getUri('palamarket_test'), extraEnv));
  const app = createApp(config);
  return {
    app,
    config,
    client: () => request.agent(app),
    plain: () => request(app),
    stop: async () => {
      await disconnectDb();
      await mongo.stop();
    },
  };
};

let counter = 0;
export const newUser = (overrides = {}) => {
  counter += 1;
  return { name: `Usuario ${counter}`, email: `usuario${counter}@ejemplo.com`, password: 'ContraseñaSegura1', ...overrides };
};

/** Devuelve un cliente con la sesión ya iniciada (la cookie queda guardada en el cliente). */
export const loggedClient = async (ctx, user = newUser()) => {
  const client = ctx.client();
  const res = await client.post('/api/auth/register').send(user);
  if (res.status !== 201) throw new Error(`No se pudo registrar: ${res.status} ${JSON.stringify(res.body)}`);
  return { client, user, id: res.body.user.id };
};
