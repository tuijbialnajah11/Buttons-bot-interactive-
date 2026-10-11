import assert from 'node:assert/strict';
import test from 'node:test';
import { BOT_PREFIX, extractMessageText, getCommandReply, getInteractiveButtonConfig } from '../src/bot.js';

test('uses a hyphen as the bot command prefix', () => {
  assert.equal(BOT_PREFIX, '-');
  assert.match(getCommandReply('-ping'), /Pong/);
  assert.match(getCommandReply('  -PING  '), /Pong/);
  assert.equal(getCommandReply('ping'), null);
  assert.equal(getCommandReply('hello -ping'), null);
});

test('provides menu, help, about, time, echo, and unknown-command replies', () => {
  assert.match(getCommandReply('-menu'), /-ping/);
  assert.match(getCommandReply('-help'), /-echo/);
  assert.match(getCommandReply('-about'), /WhatsApp command bot/);
  assert.match(getCommandReply('-time'), /Current time/);
  assert.equal(getCommandReply('-echo hello there'), 'hello there');
  assert.match(getCommandReply('-echo'), /Usage/);
  assert.match(getCommandReply('-unknown'), /Unknown command/);
  assert.match(getCommandReply('-buttons'), /Interactive buttons/);
});

test('generates interactive button configs for commands', () => {
  const menuButtons = getInteractiveButtonConfig('-menu');
  assert.ok(menuButtons);
  assert.ok(menuButtons.buttons.length >= 3);
  const pingBtn = menuButtons.buttons.find((b) => b.id === '-ping');
  assert.ok(pingBtn);
  const previewBtn = menuButtons.buttons.find((b) => b.type === 'url');
  assert.ok(previewBtn);
  assert.match(previewBtn.url, /\/preview/);

  const previewConfig = getInteractiveButtonConfig('-preview');
  assert.ok(previewConfig);
  assert.equal(previewConfig.buttons[0].type, 'url');
  assert.match(previewConfig.buttons[0].url, /\/preview/);

  const pingButtons = getInteractiveButtonConfig('-ping');
  assert.ok(pingButtons);
  assert.equal(pingButtons.buttons[0].id, '-menu');

  const customButtons = getInteractiveButtonConfig('-buttons Choose | Yes | No');
  assert.ok(customButtons);
  assert.equal(customButtons.buttons.length, 2);
  assert.match(customButtons.buttons[0].id, /Yes/);
});

test('limits replies and extracts text from regular, wrapped, or button messages', () => {
  assert.ok(getCommandReply(`-echo ${'😀'.repeat(3000)}`).length <= 4096);
  assert.equal(extractMessageText({ conversation: '-ping' }), '-ping');
  assert.equal(extractMessageText({ extendedTextMessage: { text: '-menu' } }), '-menu');
  assert.equal(extractMessageText({ ephemeralMessage: { message: { conversation: '-help' } } }), '-help');
  assert.equal(extractMessageText({ imageMessage: { caption: '-ping' } }), '-ping');
  assert.equal(extractMessageText({ imageMessage: { url: 'ignored' } }), '');

  // Native flow interactive button click response
  assert.equal(
    extractMessageText({
      interactiveResponseMessage: {
        nativeFlowResponseMessage: {
          paramsJson: JSON.stringify({ id: '-ping' }),
        },
      },
    }),
    '-ping',
  );

  // Quick reply button response
  assert.equal(
    extractMessageText({
      buttonsResponseMessage: {
        selectedButtonId: '-menu',
      },
    }),
    '-menu',
  );
});
