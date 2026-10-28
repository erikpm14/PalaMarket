import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../src/config/db.js';

let mongo;
before(async () => { mongo = await MongoMemoryServer.create(); });
after(async () => {
  await disconnectDb();
  await mongo.stop();
});

describe('conexión a MongoDB', () => {
  it('reutiliza la misma conexión entre llamadas', async () => {
    const uri = mongo.getUri('conexion');
    const [first, second] = await Promise.all([connectDb(uri), connectDb(uri)]);
    assert.equal(first, second);
    assert.equal(mongoose.connection.readyState, 1);
  });

  it('una reconexión pedida durante un cierre espera a que el cierre termine', async () => {
    const uri = mongo.getUri('conexion');
    await connectDb(uri);
    const closing = disconnectDb();
    const reopening = connectDb(uri); // se pide mientras el cierre sigue en curso
    await Promise.all([closing, reopening]);
    assert.equal(mongoose.connection.readyState, 1);
    assert.equal((await mongoose.connection.db.admin().ping()).ok, 1);
  });
});
