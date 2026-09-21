(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  var banner;

  function showOffline() {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'ek-offline-banner';
    banner.setAttribute('role', 'status');
    banner.textContent = 'You are offline. Live mentor and account features will return when connected.';
    document.body.appendChild(banner);
  }

  function hideOffline() {
    if (!banner) return;
    banner.remove();
    banner = null;
  }

  window.addEventListener('offline', showOffline);
  window.addEventListener('online', hideOffline);
  if (!navigator.onLine) showOffline();

  navigator.serviceWorker.register('/service-worker.js', { scope: '/' }).then(function (registration) {
    registration.addEventListener('updatefound', function () {
      var worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', function () {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          worker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });
  }).catch(function () {
    // PWA support is progressive; the site remains fully usable without it.
  });
}());