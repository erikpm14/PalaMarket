import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { SECRET, loggedClient, newUser, startTestApp } from './helpers.js';

let ctx;
before(async () => { ctx = await startTestApp(); });
after(async () => { await ctx.stop(); });

const cookieOf = (res) => (res.headers['set-cookie'] ?? []).find((c) => c.startsWith('pm_session='));

describe('registro', () => {
  it('registra un usuario, normaliza el email, cifra la contraseña y no la devuelve', async () => {
    const data = newUser({ email: '  Persona.Nueva@Ejemplo.COM ', name: '  Ana Pérez ' });
    const res = await ctx.plain().post('/api/auth/register').send(data);
    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, 'persona.nueva@ejemplo.com');
    assert.equal(res.body.user.name, 'Ana Pérez');
    assert.equal(res.body.user.role, 'user');
    assert.ok(res.body.user.id);
    const text = JSON.stringify(res.body);
    assert.ok(!text.includes('password') && !text.includes('Hash') && !text.includes(data.password));

    const stored = await mongoose.connection.db.collection('users').findOne({ email: 'persona.nueva@ejemplo.com' });
    assert.match(stored.passwordHash, /^\$2[aby]\$12\$/);
    assert.notEqual(stored.passwordHash, data.password);
  });

  it('entrega la sesión en una cookie httpOnly con SameSite y sin token en el cuerpo', async () => {
    const res = await ctx.plain().post('/api/auth/register').send(newUser());
    const cookie = cookieOf(res);
    assert.ok(cookie, 'falta la cookie de sesión');
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.match(cookie, /Path=\//);
    assert.match(cookie, /Expires=/i);
    assert.ok(!JSON.stringify(res.body).includes('token'));
  });

  it('deja una cookie-señal sin datos (no httpOnly) para que el frontend sepa si puede haber sesión', async () => {
    const res = await ctx.plain().post('/api/auth/register').send(newUser());
    const hint = (res.headers['set-cookie'] ?? []).find((c) => c.startsWith('pm_auth='));
    assert.ok(hint);
    assert.match(hint, /^pm_auth=1;/);
    assert.ok(!/HttpOnly/i.test(hint));
    assert.ok(!hint.includes(cookieOf(res).split(';')[0].split('=')[1]), 'la señal no debe contener el token');
  });

  it('rechaza un email duplicado, también con otras mayúsculas', async () => {
    const data = newUser();
    assert.equal((await ctx.plain().post('/api/auth/register').send(data)).status, 201);
    const again = await ctx.plain().post('/api/auth/register').send({ ...data, email: data.email.toUpperCase() });
    assert.equal(again.status, 409);
    assert.equal(again.body.error.code, 'EMAIL_TAKEN');
  });

  const invalid = {
    'sin datos': {},
    'email inválido': { email: 'no-es-un-email' },
    'contraseña corta': { password: '1234567' },
    'contraseña demasiado larga': { password: 'a'.repeat(73) },
    'nombre demasiado corto': { name: 'A' },
    'email como objeto (inyección NoSQL)': { email: { $ne: null } },
    'contraseña numérica': { password: 12345678 },
  };
  for (const [label, override] of Object.entries(invalid)) {
    it(`rechaza datos inválidos: ${label}`, async () => {
      const body = label === 'sin datos' ? {} : { ...newUser(), ...override };
      const res = await ctx.plain().post('/api/auth/register').send(body);
      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
      assert.ok(Array.isArray(res.body.error.details) && res.body.error.details.length > 0);
    });
  }
});

describe('contraseñas y bcrypt (límite de 72 bytes)', () => {
  it('rechaza contraseñas que superan 72 BYTES aunque tengan menos de 72 caracteres', async () => {
    const tooLong = 'ñ'.repeat(40); // 40 caracteres = 80 bytes
    assert.ok(tooLong.length < 72 && Buffer.byteLength(tooLong) > 72);
    const res = await ctx.plain().post('/api/auth/register').send({ ...newUser(), password: tooLong });
    assert.equal(res.status, 400);
    assert.match(res.body.error.details[0].message, /72 bytes/);
  });

  it('admite exactamente 72 bytes (con caracteres multibyte) y distingue contraseñas distintas', async () => {
    const user = newUser();
    const password = 'ñ'.repeat(36); // 72 bytes exactos
    assert.equal(Buffer.byteLength(password), 72);
    assert.equal((await ctx.plain().post('/api/auth/register').send({ ...user, password })).status, 201);
    assert.equal((await ctx.plain().post('/api/auth/login').send({ email: user.email, password })).status, 200);
    const other = await ctx.plain().post('/api/auth/login').send({ email: user.email, password: `${'ñ'.repeat(35)}nn` });
    assert.equal(other.status, 401);
  });

  it('el login con más de 72 bytes se rechaza sin llegar a comparar', async () => {
    const res = await ctx.plain().post('/api/auth/login').send({ email: 'a@b.co', password: 'ñ'.repeat(40) });
    assert.equal(res.status, 400);
  });
});

describe('login', () => {
  it('inicia sesión con credenciales correctas (sin distinguir mayúsculas en el email)', async () => {
    const data = newUser();
    await ctx.plain().post('/api/auth/register').send(data);
    const res = await ctx.plain().post('/api/auth/login').send({ email: data.email.toUpperCase(), password: data.password });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, data.email);
    assert.ok(cookieOf(res));
  });

  it('rechaza contraseña incorrecta y email inexistente con el mismo mensaje', async () => {
    const data = newUser();
    await ctx.plain().post('/api/auth/register').send(data);
    const wrongPass = await ctx.plain().post('/api/auth/login').send({ email: data.email, password: 'otra-contraseña' });
    const unknown = await ctx.plain().post('/api/auth/login').send({ email: 'nadie@ejemplo.com', password: 'otra-contraseña' });
    for (const res of [wrongPass, unknown]) {
      assert.equal(res.status, 401);
      assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
      assert.ok(!cookieOf(res));
    }
    assert.equal(wrongPass.body.error.message, unknown.body.error.message);
  });

  it('no admite operadores de MongoDB en el login', async () => {
    const res = await ctx.plain().post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });
});

describe('sesión', () => {
  it('rechaza al usuario no autenticado en rutas privadas', async () => {
    for (const path of ['/api/auth/me', '/api/favorites', '/api/cart']) {
      const res = await ctx.plain().get(path);
      assert.equal(res.status, 401, path);
      assert.equal(res.body.error.code, 'UNAUTHENTICATED');
    }
  });

  it('devuelve el usuario autenticado y mantiene la sesión entre peticiones (recarga)', async () => {
    const { client, user } = await loggedClient(ctx);
    const res = await client.get('/api/auth/me');
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, user.email);
    assert.ok(!JSON.stringify(res.body).includes('passwordHash'));
    assert.equal((await client.get('/api/auth/me')).status, 200);
  });

  it('cierra la sesión: borra la cookie e invalida el token ya emitido', async () => {
    const { client, user } = await loggedClient(ctx);
    const login = await ctx.plain().post('/api/auth/login').send({ email: user.email, password: user.password });
    const stolen = cookieOf(login).split(';')[0];

    const out = await client.post('/api/auth/logout');
    assert.equal(out.status, 200);
    assert.match(cookieOf(out), /pm_session=;/);
    assert.equal((await client.get('/api/auth/me')).status, 401);
    // Un token copiado antes del logout deja de valer.
    assert.equal((await ctx.plain().get('/api/auth/me').set('Cookie', stolen)).status, 401);
  });

  it('el logout y una sesión inválida eliminan también la cookie-señal', async () => {
    const { client } = await loggedClient(ctx);
    const out = await client.post('/api/auth/logout');
    assert.ok((out.headers['set-cookie'] ?? []).some((c) => /^pm_auth=;/.test(c)));
    const stale = await ctx.plain().get('/api/auth/me').set('Cookie', 'pm_session=caducada');
    assert.equal(stale.status, 401);
    const cleared = stale.headers['set-cookie'] ?? [];
    assert.ok(cleared.some((c) => /^pm_session=;/.test(c)) && cleared.some((c) => /^pm_auth=;/.test(c)));
  });

  it('el logout sin sesión es inofensivo', async () => {
    assert.equal((await ctx.plain().post('/api/auth/logout')).status, 200);
  });

  it('rechaza tokens caducados, firmados con otro secreto o sin firma', async () => {
    const { id } = await loggedClient(ctx);
    const forged = {
      caducado: jwt.sign({ sub: id, tv: 0 }, SECRET, { expiresIn: -10 }),
      'otro secreto': jwt.sign({ sub: id, tv: 0 }, 'otro-secreto-distinto-de-32-caracteres-xx'),
      'sin firma': `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, tv: 0 })).toString('base64url')}.`,
      'versión de sesión antigua': jwt.sign({ sub: id, tv: 99 }, SECRET, { expiresIn: '1h' }),
      'sin caducidad válida pero usuario inexistente': jwt.sign({ sub: '64b64b64b64b64b64b64b64b', tv: 0 }, SECRET, { expiresIn: '1h' }),
    };
    for (const [label, token] of Object.entries(forged)) {
      const res = await ctx.plain().get('/api/auth/me').set('Cookie', `pm_session=${token}`);
      assert.equal(res.status, 401, label);
    }
  });

  it('los tokens emitidos caducan y solo contienen identificador y versión de sesión', async () => {
    const res = await ctx.plain().post('/api/auth/register').send(newUser());
    const token = cookieOf(res).split(';')[0].split('=')[1];
    const decoded = jwt.decode(token);
    assert.ok(decoded.exp > decoded.iat, 'el token debe llevar exp');
    assert.ok(decoded.exp - decoded.iat <= 7 * 24 * 3600 + 5);
    assert.deepEqual(Object.keys(decoded).sort(), ['exp', 'iat', 'sub', 'tv']);
  });
});
