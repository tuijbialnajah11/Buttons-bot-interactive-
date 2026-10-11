export const BOT_PREFIX = '-';
const MAX_REPLY_LENGTH = 4096;

const MENU = [
  '🤖 *WhatsApp Bot — command menu*',
  '',
  '-ping  Check that the bot is online',
  '-menu  Show this command menu (with clickable buttons)',
  '-preview  Open live HTML preview inside WhatsApp (CTA Webview)',
  '-anime  Show anime character card preview',
  '-help  Show the command menu',
  '-about  About this bot',
  '-time  Show the current time',
  '-echo <text>  Echo your text',
  '-buttons [options]  Send interactive action buttons',
].join('\n');

function truncate(text) {
  if (text.length <= MAX_REPLY_LENGTH) {
    return text;
  }

  let end = MAX_REPLY_LENGTH - 1;
  const lastCodeUnit = text.charCodeAt(end - 1);
  if (lastCodeUnit >= 0xd800 && lastCodeUnit <= 0xdbff) {
    end -= 1;
  }
  return `${text.slice(0, end)}…`;
}

export function getCommandReply(input) {
  if (typeof input !== 'string') {
    return null;
  }

  const text = input.trim();
  if (!text.startsWith(BOT_PREFIX)) {
    return null;
  }

  const [rawCommand = '', ...args] = text.slice(BOT_PREFIX.length).trim().split(/\s+/);
  const command = rawCommand.toLowerCase();
  const argumentText = args.join(' ');

  switch (command) {
    case 'ping':
      return '🏓 Pong! The bot is online.';
    case 'menu':
    case 'help':
      return MENU;
    case 'preview':
    case 'anime':
    case 'card':
      return '🌸 *Mao Mao · Anime Card Preview*\nNeeche diye gaye button par click karein to open WhatsApp in-app browser preview:';
    case 'html': {
      const parts = argumentText.split('|').map((p) => p.trim()).filter(Boolean);
      const title = parts[0] || 'Custom Live Preview';
      return `✨ *${title}*\nNeeche CTA button tap karein to view live in-app preview:`;
    }
    case 'about':
      return 'I am a WhatsApp command bot with interactive buttons and in-app HTML preview support. Send -menu to see what I can do.';
    case 'time':
      return `Current time: ${new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: 'Asia/Kolkata',
      }).format(new Date())}`;
    case 'echo':
      return argumentText
        ? truncate(argumentText)
        : 'Usage: -echo <text>';
    case 'btn':
    case 'button':
    case 'buttons':
      return argumentText
        ? `🔘 Interactive Buttons: ${argumentText}`
        : '🔘 Interactive buttons menu. Tap any option below:';
    case '':
      return 'Send -menu to see the available commands.';
    default:
      return truncate(`Unknown command: -${rawCommand}. Send -menu to see the available commands.`);
  }
}

export function getInteractiveButtonConfig(input, appUrl = '') {
  if (typeof input !== 'string') return null;
  const text = input.trim();
  if (!text.startsWith(BOT_PREFIX)) return null;

  const [rawCommand = '', ...args] = text.slice(BOT_PREFIX.length).trim().split(/\s+/);
  const command = rawCommand.toLowerCase();
  const argumentText = args.join(' ');
  const base = String(appUrl || '').replace(/\/+$/, '') || 'http://localhost:3000';
  const previewUrl = `${base}/preview`;

  switch (command) {
    case 'menu':
    case 'help':
      return {
        header: 'Mao Mao Bot 🤖',
        footer: 'Interactive Button System · Baileys 7.0',
        buttons: [
          { text: '🌐 Open HTML Preview', type: 'url', url: previewUrl },
          { text: '🏓 Ping', id: '-ping' },
          { text: '🕒 Current Time', id: '-time' },
          { text: 'ℹ️ About Bot', id: '-about' },
        ],
      };
    case 'preview':
    case 'anime':
    case 'card':
      return {
        header: 'Mao Mao Anime Card 🌸',
        footer: 'WhatsApp In-App Browser Preview',
        buttons: [
          { text: '🌐 Open HTML Preview', type: 'url', url: previewUrl },
          { text: '📜 Command Menu', id: '-menu' },
          { text: '🏓 Ping Bot', id: '-ping' },
        ],
      };
    case 'html': {
      const parts = argumentText.split('|').map((p) => p.trim()).filter(Boolean);
      const title = parts[0] || 'Custom Preview';
      const desc = parts[1] || 'Rendered inside WhatsApp In-App Webview';
      const customUrl = `${base}/preview?title=${encodeURIComponent(title)}&desc=${encodeURIComponent(desc)}`;
      return {
        header: `${title} ✨`,
        footer: 'WhatsApp Webview Relay',
        buttons: [
          { text: '🌐 View Live Preview', type: 'url', url: customUrl },
          { text: '📜 Menu', id: '-menu' },
        ],
      };
    }
    case 'ping':
      return {
        header: 'Ping Response 🏓',
        footer: 'Bot Status: Online',
        buttons: [
          { text: '📜 Command Menu', id: '-menu' },
          { text: '🕒 Check Time', id: '-time' },
          { text: '🌐 Open Preview', type: 'url', url: previewUrl },
        ],
      };
    case 'time':
      return {
        header: 'Current Time 🕒',
        footer: 'Asia/Kolkata (IST)',
        buttons: [
          { text: '📜 Command Menu', id: '-menu' },
          { text: '🏓 Ping', id: '-ping' },
          { text: '🌐 Preview', type: 'url', url: previewUrl },
        ],
      };
    case 'about':
      return {
        header: 'About Mao Mao Bot ℹ️',
        footer: 'WhatsApp Interactive Bot',
        buttons: [
          { text: '🌐 Open In-App Preview', type: 'url', url: previewUrl },
          { text: '📜 Command Menu', id: '-menu' },
          { text: '🏓 Ping', id: '-ping' },
        ],
      };
    case 'btn':
    case 'button':
    case 'buttons': {
      if (!argumentText) {
        return {
          header: 'Interactive Action Buttons 🔘',
          footer: 'Tap any action button:',
          buttons: [
            { text: '🌐 Open HTML Preview', type: 'url', url: previewUrl },
            { text: '🏓 Ping', id: '-ping' },
            { text: '📜 Menu', id: '-menu' },
            { text: '🕒 Time', id: '-time' },
          ],
        };
      }
      const parts = argumentText.split('|').map((p) => p.trim()).filter(Boolean);
      const title = parts[0] || 'Interactive Buttons';
      const buttonLabels = parts.slice(1);
      const buttons = buttonLabels.length > 0
        ? buttonLabels.map((lbl) => ({ text: lbl, id: `-echo Selected: ${lbl}` }))
        : [
            { text: '🌐 Open HTML Preview', type: 'url', url: previewUrl },
            { text: '🏓 Ping', id: '-ping' },
            { text: '📜 Menu', id: '-menu' },
          ];
      return {
        header: title,
        footer: 'Mao Mao Interactive Action',
        buttons,
      };
    }
    default:
      return null;
  }
}

export function extractMessageText(content) {
  let current = content;

  // WhatsApp can wrap text in ephemeral/view-once message containers.
  for (let depth = 0; current && depth < 6; depth += 1) {
    if (typeof current.conversation === 'string') return current.conversation;
    if (typeof current.extendedTextMessage?.text === 'string') return current.extendedTextMessage.text;
    if (typeof current.imageMessage?.caption === 'string') return current.imageMessage.caption;
    if (typeof current.videoMessage?.caption === 'string') return current.videoMessage.caption;
    if (typeof current.documentMessage?.caption === 'string') return current.documentMessage.caption;

    // Interactive button response handling (nativeFlowMessage quick_reply / cta)
    if (typeof current.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson === 'string') {
      try {
        const parsed = JSON.parse(current.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
        if (typeof parsed?.id === 'string') return parsed.id;
      } catch {}
    }
    if (typeof current.interactiveResponseMessage?.body?.text === 'string') {
      return current.interactiveResponseMessage.body.text;
    }
    if (typeof current.buttonsResponseMessage?.selectedButtonId === 'string') {
      return current.buttonsResponseMessage.selectedButtonId;
    }
    if (typeof current.buttonsResponseMessage?.selectedDisplayText === 'string') {
      return current.buttonsResponseMessage.selectedDisplayText;
    }
    if (typeof current.templateButtonReplyMessage?.selectedId === 'string') {
      return current.templateButtonReplyMessage.selectedId;
    }
    if (typeof current.listResponseMessage?.singleSelectReply?.selectedRowId === 'string') {
      return current.listResponseMessage.singleSelectReply.selectedRowId;
    }
    if (typeof current.listResponseMessage?.title === 'string') return current.listResponseMessage.title;

    current = current.ephemeralMessage?.message
      ?? current.viewOnceMessage?.message
      ?? current.viewOnceMessageV2?.message
      ?? current.documentWithCaptionMessage?.message;
  }

  return '';
}
