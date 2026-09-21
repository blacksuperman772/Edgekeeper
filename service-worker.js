'use strict';

const VERSION = 'edgekeeper-shell-v1';
const STATIC_CACHE = VERSION + '-static';
const NAVIGATION_CACHE = VERSION + '-navigation';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/assets/app-icon-180.svg',
  '/assets/app-icon-192.svg',
  '/assets/app-icon-512.svg',
  '/assets/shared.css',
  '/assets/pwa.js',
  '/assets/reveal-safety.js',
  '/assets/pillars.js',
  '/assets/analytics.js',
  '/edgekeeper.html',
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
    if (response.ok && new URL(request.url).pathname === '/edgekeeper.html') {
      const cache = await caches.open(NAVIGATION_CACHE);
      await cache.put(request, response.clone());
    }
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