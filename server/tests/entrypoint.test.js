import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';

// api/index.js se importa en un proceso aparte sin variables de entorno: simula un despliegue sin configurar.
const script = `
import http from 'node:http';
const handler = (await import('../api/index.js')).default;
const server = http.createServer(handler).listen(0, async () => {
  const res = await fetch('http://127.0.0.1:' + server.address().port + '/api/health');
  console.log(JSON.stringify({ status: res.status, type: res.headers.get('content-type'), body: await res.json() }));
  server.close();
});
`;

describe('función serverless sin configuración', () => {
  it('responde 503 en JSON, sin nombres ni valores de variables, en lugar de caerse', () => {
    const env = { ...process.env };
    for (const key of ['JWT_SECRET', 'MONGODB_URI', 'CORS_ORIGINS', 'NODE_ENV']) delete env[key];
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: new URL('../', import.meta.url), env, encoding: 'utf8' });
    const result = JSON.parse(run.stdout.trim().split('\n').pop());
    assert.equal(result.status, 503);
    assert.match(result.type, /application\/json/);
    assert.equal(result.body.error.code, 'SERVICE_NOT_CONFIGURED');
    assert.ok(!/JWT|MONGODB|CORS|secret/i.test(JSON.stringify(result.body)));
    assert.match(run.stderr, /Configuración no válida/); // el motivo solo va a los registros del servidor
  });
});
