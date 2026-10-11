import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createHttpServer } from '../src/http-server.js';

async function withServer(bot, callback, options = {}) {
  const server = createHttpServer({ bot, logger: { error() {} }, ...options });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test('serves the browser dashboard and current session status', async () => {
  const bot = { getStatus: () => ({ state: 'idle', pairingCode: '' }) };
  await withServer(bot, async (baseUrl) => {
    const page = await fetch(baseUrl);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Get your pairing code/);

    const status = await fetch(`${baseUrl}/api/status`);
    assert.deepEqual(await status.json(), { state: 'idle', pairingCode: '' });

    const preview = await fetch(`${baseUrl}/preview?title=MaoMaoTest`);
    assert.equal(preview.status, 200);
    assert.match(await preview.text(), /MaoMaoTest/);

    const health = await fetch(`${baseUrl}/healthz`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true });
  });
});

test('serves the public dashboard and API without requiring passwords or authentication', async () => {
  const bot = { getStatus: () => ({ state: 'idle' }) };
  await withServer(bot, async (baseUrl) => {
    const page = await fetch(baseUrl);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Get your pairing code/);

    const health = await fetch(`${baseUrl}/healthz`);
    assert.equal(health.status, 200);

    const status = await fetch(`${baseUrl}/api/status`);
    assert.equal(status.status, 200);
    assert.deepEqual(await status.json(), { state: 'idle' });
  });
});

test('validates phone numbers and starts pairing from the browser API', async () => {
  let requested;
  const bot = {
    getStatus: () => ({ state: 'connecting' }),
    requestPairingCode: (number) => {
      requested = number;
      return Promise.resolve();
    },
  };
  await withServer(bot, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/pair`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '+91 98765 43210' }),
    });
    assert.equal(response.status, 202);
    assert.equal(requested, '919876543210');

    const invalid = await fetch(`${baseUrl}/api/pair`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phoneNumber: 'bad-number' }),
    });
    assert.equal(invalid.status, 400);
  });
});
