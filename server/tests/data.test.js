import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loggedClient, startTestApp } from './helpers.js';

let ctx;
before(async () => { ctx = await startTestApp(); });
after(async () => { await ctx.stop(); });

describe('favoritos', () => {
  it('añade, lista y elimina favoritos sin duplicarlos', async () => {
    const { client } = await loggedClient(ctx);
    assert.deepEqual((await client.get('/api/favorites')).body, { favorites: [] });
    assert.deepEqual((await client.put('/api/favorites/metalbone-2026')).body.favorites, ['metalbone-2026']);
    assert.deepEqual((await client.put('/api/favorites/metalbone-2026')).body.favorites, ['metalbone-2026']);
    assert.deepEqual((await client.put('/api/favorites/coello-pro')).body.favorites, ['metalbone-2026', 'coello-pro']);
    assert.deepEqual((await client.delete('/api/favorites/metalbone-2026')).body.favorites, ['coello-pro']);
    assert.deepEqual((await client.get('/api/favorites')).body.favorites, ['coello-pro']);
  });

  it('rechaza palas que no existen y exige sesión', async () => {
    const { client } = await loggedClient(ctx);
    const res = await client.put('/api/favorites/pala-inventada');
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'UNKNOWN_PRODUCT');
    assert.equal((await ctx.plain().put('/api/favorites/coello-pro')).status, 401);
  });

  it('fusiona los favoritos anónimos ignorando identificadores desconocidos', async () => {
    const { client } = await loggedClient(ctx);
    await client.put('/api/favorites/coello-pro');
    const res = await client.post('/api/favorites/merge').send({ ids: ['coello-pro', 'air-viper-26', 'x', 'air-viper-26'] });
    assert.equal(res.status, 200);
    assert.deepEqual([...res.body.favorites].sort(), ['air-viper-26', 'coello-pro']);
    assert.equal((await client.post('/api/favorites/merge').send({ ids: 'no-es-lista' })).status, 400);
  });
});

describe('carrito', () => {
  it('establece, modifica y elimina cantidades', async () => {
    const { client } = await loggedClient(ctx);
    assert.deepEqual((await client.get('/api/cart')).body, { cart: [] });
    assert.deepEqual((await client.put('/api/cart/air-viper-26').send({ quantity: 2 })).body.cart, [{ productId: 'air-viper-26', quantity: 2 }]);
    assert.deepEqual((await client.put('/api/cart/air-viper-26').send({ quantity: 3 })).body.cart, [{ productId: 'air-viper-26', quantity: 3 }]);
    await client.put('/api/cart/coello-pro').send({ quantity: 1 });
    assert.equal((await client.get('/api/cart')).body.cart.length, 2);
    assert.deepEqual((await client.put('/api/cart/coello-pro').send({ quantity: 0 })).body.cart, [{ productId: 'air-viper-26', quantity: 3 }]);
    assert.deepEqual((await client.delete('/api/cart/air-viper-26')).body.cart, []);
  });

  it('respeta el stock y valida la cantidad', async () => {
    const { client } = await loggedClient(ctx);
    const over = await client.put('/api/cart/coello-pro').send({ quantity: 3 }); // stock: 2
    assert.equal(over.status, 422);
    assert.equal(over.body.error.code, 'QUANTITY_EXCEEDS_STOCK');
    for (const quantity of [-1, 1.5, '2', null, 100]) {
      const res = await client.put('/api/cart/air-viper-26').send({ quantity });
      assert.equal(res.status, 400, JSON.stringify(quantity));
    }
    assert.equal((await client.put('/api/cart/pala-inventada').send({ quantity: 1 })).status, 404);
    assert.deepEqual((await client.get('/api/cart')).body.cart, []);
  });

  it('fusiona el carrito anónimo sumando cantidades hasta el stock y vacía el carrito', async () => {
    const { client } = await loggedClient(ctx);
    await client.put('/api/cart/coello-pro').send({ quantity: 1 });
    const res = await client.post('/api/cart/merge').send({ items: [{ productId: 'coello-pro', quantity: 5 }, { productId: 'air-viper-26', quantity: 2 }, { productId: 'x', quantity: 1 }] });
    assert.equal(res.status, 200);
    const byId = Object.fromEntries(res.body.cart.map((l) => [l.productId, l.quantity]));
    assert.deepEqual(byId, { 'coello-pro': 2, 'air-viper-26': 2 });
    assert.deepEqual((await client.delete('/api/cart')).body, { cart: [] });
  });
});

describe('separación entre usuarios y persistencia', () => {
  it('cada usuario solo ve y modifica lo suyo', async () => {
    const a = await loggedClient(ctx);
    const b = await loggedClient(ctx);
    await a.client.put('/api/favorites/metalbone-2026');
    await a.client.put('/api/cart/air-viper-26').send({ quantity: 2 });

    assert.deepEqual((await b.client.get('/api/favorites')).body.favorites, []);
    assert.deepEqual((await b.client.get('/api/cart')).body.cart, []);

    await b.client.put('/api/favorites/coello-pro');
    await b.client.delete('/api/favorites/metalbone-2026'); // no afecta a A
    await b.client.delete('/api/cart');
    assert.deepEqual((await a.client.get('/api/favorites')).body.favorites, ['metalbone-2026']);
    assert.deepEqual((await a.client.get('/api/cart')).body.cart, [{ productId: 'air-viper-26', quantity: 2 }]);
  });

  it('no hay forma de indicar el usuario en la petición: se ignora cualquier id ajeno', async () => {
    const a = await loggedClient(ctx);
    const b = await loggedClient(ctx);
    await a.client.put('/api/favorites/metalbone-2026');
    const res = await b.client.post('/api/favorites/merge').send({ ids: ['coello-pro'], userId: a.id, user: a.id });
    assert.deepEqual(res.body.favorites, ['coello-pro']);
    assert.deepEqual((await a.client.get('/api/favorites')).body.favorites, ['metalbone-2026']);
  });

  it('los datos persisten al cerrar sesión y volver a entrar', async () => {
    const { client, user } = await loggedClient(ctx);
    await client.put('/api/favorites/air-viper-26');
    await client.put('/api/cart/air-viper-26').send({ quantity: 2 });
    await client.post('/api/auth/logout');
    assert.equal((await client.get('/api/favorites')).status, 401);

    const again = ctx.client();
    await again.post('/api/auth/login').send({ email: user.email, password: user.password });
    assert.deepEqual((await again.get('/api/favorites')).body.favorites, ['air-viper-26']);
    assert.deepEqual((await again.get('/api/cart')).body.cart, [{ productId: 'air-viper-26', quantity: 2 }]);
  });
});
