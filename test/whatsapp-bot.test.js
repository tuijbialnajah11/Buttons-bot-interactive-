import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { normalizePhoneNumber, WhatsAppBot } from '../src/whatsapp-bot.js';

class FakeSocket {
  constructor() {
    this.ev = new EventEmitter();
    this.sent = [];
    this.requestedNumber = '';
  }
  async requestPairingCode(number) {
    this.requestedNumber = number;
    return 'ABCD-EFGH';
  }
  async sendMessage(jid, message) {
    this.sent.push({ jid, message });
  }
  async logout() {}
  end() {}
}

async function makeBot(t, { registered = false } = {}) {
  const authDir = await mkdtemp(join(tmpdir(), 'wa-bot-test-'));
  const sockets = [];
  const bot = new WhatsAppBot({
    authDir,
    authStateLoader: async () => ({
      state: { creds: { registered } },
      saveCreds: async () => {},
    }),
    socketFactory: () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
    logger: { error() {} },
  });
  t.after(async () => {
    bot.shutdown();
    await rm(authDir, { recursive: true, force: true });
  });
  return { bot, sockets, authDir };
}

test('normalizes international numbers and rejects invalid input', () => {
  assert.equal(normalizePhoneNumber('+91 98765-43210'), '919876543210');
  assert.equal(normalizePhoneNumber('(44) 7700 900123'), '447700900123');
  assert.throws(() => normalizePhoneNumber('0123456789'), /8 to 15 digits/);
  assert.throws(() => normalizePhoneNumber('+0 12345678'), /8 to 15 digits/);
  assert.throws(() => normalizePhoneNumber('call-me-please'), /international number/i);
});

test('generates a pairing code and reflects the pairing state', async (t) => {
  const { bot, sockets } = await makeBot(t);
  await bot.restore();
  await bot.requestPairingCode('+91 98765 43210');

  assert.equal(sockets.length, 1);
  assert.equal(sockets[0].requestedNumber, '919876543210');
  assert.deepEqual(bot.getStatus(), {
    state: 'pairing',
    phoneNumber: '+919876543210',
    pairingCode: 'ABCD-EFGH',
    message: 'Code ready. Enter it in WhatsApp on your phone.',
  });
});

test('only responds to prefixed incoming messages and ignores own/status messages', async (t) => {
  const { bot, sockets } = await makeBot(t);
  await bot.requestPairingCode('919876543210');
  const socket = sockets[0];
  socket.ev.emit('messages.upsert', {
    type: 'notify',
    messages: [
      { key: { remoteJid: '123@s.whatsapp.net' }, message: { conversation: '-echo test message' } },
      { key: { remoteJid: '456@s.whatsapp.net' }, message: { conversation: 'hello' } },
      { key: { remoteJid: '789@s.whatsapp.net', fromMe: true }, message: { conversation: '-echo test message' } },
      { key: { remoteJid: 'status@broadcast' }, message: { conversation: '-echo test message' } },
    ],
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(socket.sent, [{
    jid: '123@s.whatsapp.net',
    message: { text: 'test message' },
  }]);
});

test('relays interactive button messages when socket supports relayMessage', async (t) => {
  const { bot, sockets } = await makeBot(t);
  await bot.requestPairingCode('919876543210');
  const socket = sockets[0];
  const relayed = [];
  socket.relayMessage = async (jid, message, options) => {
    relayed.push({ jid, message, options });
  };

  socket.ev.emit('messages.upsert', {
    type: 'notify',
    messages: [
      { key: { remoteJid: 'user123@s.whatsapp.net' }, message: { conversation: '-menu' } },
    ],
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(relayed.length, 1);
  assert.equal(relayed[0].jid, 'user123@s.whatsapp.net');
  assert.ok(relayed[0].message?.viewOnceMessage?.message?.interactiveMessage);
});

test('responds to commands in WhatsApp groups and quotes original message', async (t) => {
  const { bot, sockets } = await makeBot(t);
  await bot.requestPairingCode('919876543210');
  const socket = sockets[0];
  const groupSent = [];
  socket.sendMessage = async (jid, message, options) => {
    groupSent.push({ jid, message, options });
  };

  socket.ev.emit('messages.upsert', {
    type: 'notify',
    messages: [
      {
        key: { remoteJid: '120363021234567890@g.us', participant: '919876543210@s.whatsapp.net' },
        message: { extendedTextMessage: { text: '.ping' } },
      },
    ],
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(groupSent.length, 1);
  assert.equal(groupSent[0].jid, '120363021234567890@g.us');
  assert.equal(groupSent[0].message.text, '🏓 Pong! The bot is online.');
  assert.ok(groupSent[0].options?.quoted);
});

test('rejects a second pairing request while a session is active', async (t) => {
  const { bot } = await makeBot(t);
  await bot.requestPairingCode('919876543210');
  assert.throws(() => bot.requestPairingCode('447700900123'), /already starting or connected/i);
});

test('disconnect clears credentials and returns the dashboard to idle', async (t) => {
  const { bot, authDir } = await makeBot(t);
  await bot.requestPairingCode('919876543210');
  await bot.disconnect();
  assert.equal(bot.getStatus().state, 'idle');
  assert.equal(bot.getStatus().pairingCode, '');
  await assert.rejects(import('node:fs/promises').then(({ access }) => access(authDir)));
});
