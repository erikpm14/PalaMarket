import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { User } from '../src/models/User.js';
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

  it('fusiona el carrito anónimo conservando la mayor cantidad (hasta el stock) y se puede vaciar', async () => {
    const { client } = await loggedClient(ctx);
    await client.put('/api/cart/coello-pro').send({ quantity: 1 });
    const res = await client.post('/api/cart/merge').send({ items: [{ productId: 'coello-pro', quantity: 5 }, { productId: 'air-viper-26', quantity: 2 }, { productId: 'x', quantity: 1 }] });
    assert.equal(res.status, 200);
    const byId = Object.fromEntries(res.body.cart.map((l) => [l.productId, l.quantity]));
    assert.deepEqual(byId, { 'coello-pro': 2, 'air-viper-26': 2 });
    assert.deepEqual((await client.delete('/api/cart')).body, { cart: [] });
  });
});

describe('carrito: concurrencia e idempotencia', () => {
  const byId = (cart) => Object.fromEntries(cart.map((l) => [l.productId, l.quantity]));

  it('la fusión es idempotente: repetirla (p. ej. tras perder la respuesta) no duplica cantidades', async () => {
    const { client } = await loggedClient(ctx);
    const items = [{ productId: 'air-viper-26', quantity: 2 }, { productId: 'coello-pro', quantity: 1 }];
    const first = (await client.post('/api/cart/merge').send({ items })).body.cart;
    const second = (await client.post('/api/cart/merge').send({ items })).body.cart;
    const third = (await client.post('/api/cart/merge').send({ items })).body.cart;
    assert.deepEqual(byId(first), { 'air-viper-26': 2, 'coello-pro': 1 });
    assert.deepEqual(byId(second), byId(first));
    assert.deepEqual(byId(third), byId(first));
  });

  it('la fusión conserva la mayor cantidad y nunca reduce la que ya hay en la cuenta', async () => {
    const { client } = await loggedClient(ctx);
    await client.put('/api/cart/air-viper-26').send({ quantity: 4 });
    const res = await client.post('/api/cart/merge').send({ items: [{ productId: 'air-viper-26', quantity: 1 }, { productId: 'air-viper-26', quantity: 2 }] });
    assert.deepEqual(res.body.cart, [{ productId: 'air-viper-26', quantity: 4 }]);
  });

  it('peticiones simultáneas sobre productos distintos no se pisan (operaciones atómicas)', async () => {
    const { client } = await loggedClient(ctx);
    const ids = ['air-viper-26', 'air-veron-26', 'air-vertuo-26', 'counter-viper-26', 'counter-veron-26', 'counter-vertuo-26', 'technical-origin-plus', 'hack-03-2024'];
    const results = await Promise.all(ids.map((id) => client.put(`/api/cart/${id}`).send({ quantity: 1 })));
    assert.ok(results.every((r) => r.status === 200));
    const cart = (await client.get('/api/cart')).body.cart;
    assert.deepEqual(cart.map((l) => l.productId).sort(), [...ids].sort());
  });

  it('peticiones simultáneas sobre el mismo producto no crean líneas duplicadas', async () => {
    const { client } = await loggedClient(ctx);
    const results = await Promise.all([1, 2, 1, 2, 1, 2].map((quantity) => client.put('/api/cart/air-viper-26').send({ quantity })));
    assert.ok(results.every((r) => r.status === 200));
    const cart = (await client.get('/api/cart')).body.cart;
    assert.equal(cart.length, 1);
    assert.ok([1, 2].includes(cart[0].quantity));
  });

  it('fusiones y cambios simultáneos (varias pestañas) conservan todo', async () => {
    const { client } = await loggedClient(ctx);
    await Promise.all([
      client.post('/api/cart/merge').send({ items: [{ productId: 'air-viper-26', quantity: 2 }] }),
      client.post('/api/cart/merge').send({ items: [{ productId: 'air-veron-26', quantity: 3 }] }),
      client.put('/api/favorites/coello-pro'),
      client.put('/api/cart/air-vertuo-26').send({ quantity: 1 }),
    ]);
    assert.deepEqual(byId((await client.get('/api/cart')).body.cart), { 'air-viper-26': 2, 'air-veron-26': 3, 'air-vertuo-26': 1 });
    assert.deepEqual((await client.get('/api/favorites')).body.favorites, ['coello-pro']);
  });
});

describe('carrito: fusiones simultáneas y carrito lleno', () => {
  it('siete fusiones simultáneas de la misma pala convergen siempre a la mayor cantidad', async () => {
    for (let round = 0; round < 5; round += 1) {
      const { client } = await loggedClient(ctx);
      const quantities = [1, 5, 2, 4, 3, 5, 1];
      const results = await Promise.all(quantities.map((quantity) => client.post('/api/cart/merge').send({ items: [{ productId: 'air-viper-26', quantity }] })));
      assert.ok(results.every((r) => r.status === 200), JSON.stringify(results.map((r) => r.status)));
      assert.deepEqual((await client.get('/api/cart')).body.cart, [{ productId: 'air-viper-26', quantity: 4 }], `ronda ${round}`); // stock de air-viper-26 = 4
    }
  });

  it('con el carrito lleno avisa de las líneas que no caben en lugar de aceptarlas en silencio', async () => {
    const { client, id } = await loggedClient(ctx);
    const lines = Array.from({ length: 100 }, (_, i) => ({ productId: `heredada-${i}`, quantity: 1 }));
    await User.updateOne({ _id: id }, { $set: { cart: lines } });

    const merge = await client.post('/api/cart/merge').send({ items: [{ productId: 'coello-pro', quantity: 1 }] });
    assert.equal(merge.status, 422);
    assert.equal(merge.body.error.code, 'CART_FULL');
    assert.deepEqual(merge.body.error.details.map((d) => d.field), ['coello-pro']);

    const put = await client.put('/api/cart/coello-pro').send({ quantity: 1 });
    assert.equal(put.status, 422);
    assert.equal(put.body.error.code, 'CART_FULL');

    // Una línea que ya existe sí se puede modificar aunque el carrito esté lleno.
    await User.updateOne({ _id: id }, { $set: { 'cart.0.productId': 'air-viper-26' } });
    assert.equal((await client.put('/api/cart/air-viper-26').send({ quantity: 2 })).status, 200);
    assert.equal((await client.get('/api/cart')).body.cart.length, 100);
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
