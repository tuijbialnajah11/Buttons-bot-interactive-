function escapeHtml(unsafe) {
  return String(unsafe ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderPreviewHtml({
  title = 'Mao Mao · Anime Bot Preview',
  description = 'Live Interactive Preview rendered inside WhatsApp in-app browser.',
  character = 'Mao Mao (猫猫)',
  theme = 'anime',
  botName = 'wa-bot',
  appUrl = '',
} = {}) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeCharacter = escapeHtml(character);
  const safeBotName = escapeHtml(botName);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta name="theme-color" content="#0d1410">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:type" content="website">
  <style>
    :root {
      --bg: #0b110e;
      --card-bg: rgba(18, 28, 22, 0.85);
      --card-border: rgba(94, 204, 131, 0.25);
      --accent: #4ade80;
      --accent-glow: rgba(74, 222, 128, 0.35);
      --purple: #c084fc;
      --purple-glow: rgba(192, 132, 252, 0.35);
      --text: #f0fdf4;
      --muted: #94a3b8;
      --chip-bg: rgba(255, 255, 255, 0.06);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: var(--bg);
      background-image: 
        radial-gradient(circle at 15% 20%, rgba(74, 222, 128, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 85% 80%, rgba(192, 132, 252, 0.15) 0%, transparent 45%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      width: 100%;
      max-width: 440px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 24px 20px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 0 0 24px var(--accent-glow);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .badge-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #86efac;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.3);
      padding: 4px 10px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .dot {
      width: 6px;
      height: 6px;
      background: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 8px #22c55e;
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.8); }
    }
    .tag {
      font-size: 11px;
      color: var(--purple);
      background: rgba(192, 132, 252, 0.12);
      border: 1px solid rgba(192, 132, 252, 0.25);
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 500;
    }
    .hero-card {
      text-align: center;
      padding: 16px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 18px;
    }
    .avatar-wrap {
      width: 76px;
      height: 76px;
      margin: 0 auto 12px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4ade80, #c084fc);
      padding: 2.5px;
      box-shadow: 0 0 20px var(--accent-glow);
    }
    .avatar-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #14221a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }
    .hero-title {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 4px;
      letter-spacing: -0.01em;
    }
    .hero-character {
      font-size: 13px;
      color: var(--accent);
      font-weight: 600;
      margin-bottom: 8px;
    }
    .hero-desc {
      font-size: 13px;
      line-height: 1.5;
      color: var(--muted);
      padding: 0 8px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 18px;
    }
    .stat-box {
      background: var(--chip-bg);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 10px 6px;
      text-align: center;
    }
    .stat-val {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
    }
    .stat-label {
      font-size: 10px;
      color: var(--muted);
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
      border: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: #052e16;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35);
    }
    .btn-primary:active {
      transform: scale(0.98);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
    }
    .btn-secondary:active {
      background: rgba(255, 255, 255, 0.1);
    }
    .footer-note {
      text-align: center;
      margin-top: 14px;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge-bar">
      <div class="live-badge">
        <span class="dot"></span>
        <span>WhatsApp Webview</span>
      </div>
      <div class="tag">Baileys 7.0 · Relay</div>
    </div>

    <div class="hero-card">
      <div class="avatar-wrap">
        <div class="avatar-inner">🌸</div>
      </div>
      <h1 class="hero-title">${safeTitle}</h1>
      <div class="hero-character">${safeCharacter}</div>
      <p class="hero-desc">${safeDesc}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-val">⚡ Fast</div>
        <div class="stat-label">Relay Mode</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">✨ Live</div>
        <div class="stat-label">In-App HTML</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">📱 Native</div>
        <div class="stat-label">CTA Sheet</div>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-primary" onclick="alert('🌸 Mao Mao Bot is active! Send -menu in chat.')">
        💬 Send Command in WhatsApp
      </button>
      <button class="btn btn-secondary" onclick="navigator.clipboard?.writeText('-menu'); alert('Copied -menu to clipboard!');">
        📋 Copy "-menu" Command
      </button>
    </div>

    <div class="footer-note">
      Loaded directly inside WhatsApp In-App Browser via CTA URL
    </div>
  </div>
</body>
</html>`;
}
