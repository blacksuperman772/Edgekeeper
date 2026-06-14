'use strict';
require('dns').setDefaultResultOrder('ipv4first');
require('dotenv').config();

const express    = require('express');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Remove fingerprinting ─────────────────────────────────────────────────────
app.disable('x-powered-by');

// ── Security headers ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0'); // modern browsers — let CSP do the work
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      // Inline scripts used throughout; migrate to nonces in a future pass
      "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src https://fonts.gstatic.com",
      // Only talk to our own proxy — browser never reaches OpenAI directly
      "connect-src 'self'",
      "img-src 'self' data:",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  next();
});

// ── Block sensitive files BEFORE static middleware ────────────────────────────
const BLOCKED = [
  '/server.js', '/.env', '/package.json', '/package-lock.json',
  '/node_modules', '/.gitignore',
];
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (BLOCKED.some(b => p === b || p.startsWith('/node_modules'))) {
    return res.status(404).end();
  }
  next();
});

// ── Root redirect ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.redirect('/edgekeeper.html'));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '32kb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute window
  max: 30,               // 30 AI calls per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// ── Chat proxy ────────────────────────────────────────────────────────────────
app.post('/api/chat', chatLimiter, async (req, res) => {
  const { messages, systemPrompt } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array' });
  }
  if (messages.length > 35) {
    return res.status(400).json({ error: 'Too many messages in context' });
  }
  if (typeof systemPrompt !== 'string') {
    return res.status(400).json({ error: 'systemPrompt must be a string' });
  }
  if (systemPrompt.length > 16000) {
    return res.status(400).json({ error: 'systemPrompt too long' });
  }

  for (const msg of messages) {
    if (!msg || typeof msg.role !== 'string' || typeof msg.content !== 'string') {
      return res.status(400).json({ error: 'Invalid message format' });
    }
    if (!['user', 'assistant', 'system'].includes(msg.role)) {
      return res.status(400).json({ error: 'Invalid message role' });
    }
    if (msg.content.length > 4000) {
      return res.status(400).json({ error: 'Message content too long' });
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your-openai-key-here') {
    console.error('OPENAI_API_KEY not configured');
    return res.status(503).json({ error: 'AI service not configured' });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.5',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_completion_tokens: 700,
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      console.error('OpenAI error:', upstream.status, err);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await upstream.json();
    const content = (data.choices?.[0]?.message?.content || '').trim();
    res.json({ content });

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nEdgeKeeper dev server → http://localhost:${PORT}\n`);
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-key-here') {
    console.warn('  ⚠  OPENAI_API_KEY not set in .env — AI will run in demo mode\n');
  }
});
