'use strict';

const VERSION = 'edgekeeper-shell-v6';
const STATIC_CACHE = VERSION + '-static';
const NAVIGATION_CACHE = VERSION + '-navigation';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/assets/app-icon-180.png',
  '/assets/app-icon-192.png',
  '/assets/app-icon-512.png',
  '/assets/shared.css',
  '/assets/pwa.js',
  '/assets/reveal-safety.js',
  '/assets/pillars.js',
  '/assets/analytics.js',
  OFFLINE_URL,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key !== STATIC_CACHE && key !== NAVIGATION_CACHE)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (_) {}
  const title = payload.title || 'EdgeKeeper';
  const isCall = payload.call === true;
  const options = {
    body: payload.body || 'You have an update waiting in EdgeKeeper.',
    icon: payload.icon || '/assets/app-icon-192.png',
    badge: payload.badge || '/assets/app-icon-192.png',
    tag: isCall ? 'iris-call' : (payload.type || 'edgekeeper'),
    data: { url: payload.url || '/workspace.html', type: payload.type || 'system', entityId: payload.entityId || null, call: isCall },
    renotify: true,
  };
  if (isCall) {
    // Make it behave like an incoming call: stays on screen until acted on,
    // rings the device's vibrate, and offers Answer / Decline.
    options.requireInteraction = true;
    options.vibrate = [600, 300, 600, 300, 600, 300, 600];
    options.actions = [
      { action: 'answer', title: 'Answer' },
      { action: 'decline', title: 'Decline' },
    ];
  }
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data || {};
  event.notification.close();
  // Declining a call just clears the pending call server-side — don't open.
  if (data.call && event.action === 'decline') {
    event.waitUntil(fetch('/api/voice/incoming/ack', { method: 'POST', credentials: 'include' }).catch(() => {}));
    return;
  }
  const target = new URL(data.url || '/workspace.html', self.location.origin).href;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client && new URL(client.url).origin === self.location.origin) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/billing/')) return;
  if (url.pathname === '/service-worker.js' || url.pathname === '/manifest.webmanifest') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.startsWith('/assets/') || /\.(?:svg|png|jpe?g|webp|gif|ico|woff2?|css|js)$/.test(url.pathname)) {
    event.respondWith(cacheFirstStatic(request));
  }
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (_) {
    return (await caches.match(request)) ||
      (await caches.match(OFFLINE_URL));
  }
}

async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}