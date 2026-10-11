import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { normalizePhoneNumber } from './whatsapp-bot.js';
import { renderPreviewHtml } from './preview-html.js';

const publicDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const staticFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
]);
const MAX_API_BODY_BYTES = 4096;

function send(res, statusCode, body, contentType = 'application/json; charset=utf-8') {
  if (res.destroyed || res.writableEnded) return;
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'self'; form-action 'self'",
  });
  res.end(body);
}

function sendJson(res, statusCode, value) {
  send(res, statusCode, JSON.stringify(value));
}

function readJsonBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let bytes = 0;
    let tooLarge = false;

    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_API_BODY_BYTES) {
        tooLarge = true;
      } else if (!tooLarge) {
        chunks.push(chunk);
      }
    });

    req.on('end', () => {
      if (tooLarge) {
        const error = new Error('Request body is too large.');
        error.statusCode = 413;
        reject(error);
        return;
      }

      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        const error = new Error('Request body must be valid JSON.');
        error.statusCode = 400;
        reject(error);
      }
    });

    req.on('aborted', () => reject(new Error('Request was aborted.')));
    req.on('error', reject);
  });
}

export function createHttpServer({ bot, logger = console }) {
  if (!bot || typeof bot.getStatus !== 'function') {
    throw new TypeError('HTTP server requires a WhatsApp bot manager.');
  }

  return createServer((req, res) => {
    void route(req, res).catch((error) => {
      logger.error?.(`HTTP request failed: ${error?.message ?? error}`);
      sendJson(res, 500, { error: 'Internal server error.' });
    });
  });

  async function route(req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/healthz') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && (url.pathname === '/preview' || url.pathname.startsWith('/preview/'))) {
      const title = url.searchParams.get('title') || 'Mao Mao · Anime Preview';
      const description = url.searchParams.get('desc') || 'Live interactive HTML card rendered inside WhatsApp in-app browser.';
      const character = url.searchParams.get('character') || 'Mao Mao (猫猫)';
      const html = renderPreviewHtml({ title, description, character });
      send(res, 200, html, 'text/html; charset=utf-8');
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/status') {
      sendJson(res, 200, bot.getStatus());
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/pair') {
      let payload;
      try {
        payload = await readJsonBody(req);
      } catch (error) {
        sendJson(res, error.statusCode ?? 400, { error: error.message });
        return;
      }

      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        sendJson(res, 400, { error: 'Request body must be a JSON object.' });
        return;
      }

      let phoneNumber;
      let operation;
      try {
        phoneNumber = normalizePhoneNumber(payload.phoneNumber);
        operation = bot.requestPairingCode(phoneNumber);
      } catch (error) {
        sendJson(res, error.statusCode ?? 400, { error: error.message });
        return;
      }

      Promise.resolve(operation).catch((error) => {
        logger.error?.(`Pairing request failed: ${error?.message ?? error}`);
      });
      sendJson(res, 202, { ok: true, message: 'Pairing started. This page will show the code when it is ready.' });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/disconnect') {
      if (typeof bot.disconnect !== 'function') {
        sendJson(res, 501, { error: 'Disconnect is not supported.' });
        return;
      }

      Promise.resolve(bot.disconnect()).catch((error) => {
        logger.error?.(`Disconnect failed: ${error?.message ?? error}`);
      });
      sendJson(res, 202, { ok: true, message: 'Disconnecting and clearing the saved session.' });
      return;
    }

    const staticFile = staticFiles.get(url.pathname);
    if (req.method === 'GET' && staticFile) {
      try {
        const body = await readFile(resolve(publicDirectory, staticFile[0]));
        send(res, 200, body, staticFile[1]);
      } catch (error) {
        logger.error?.(`Could not read browser asset: ${error?.message ?? error}`);
        send(res, 500, 'Could not load the browser app.', 'text/plain; charset=utf-8');
      }
      return;
    }

    sendJson(res, 404, { error: 'Not found.' });
  }
}
