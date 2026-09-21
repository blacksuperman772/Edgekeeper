(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  var banner;
  var installPrompt = null;

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

  function showInstallPrompt() {
    if (isStandalone || localStorage.getItem('ek_install_dismissed_v1')) return;
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!installPrompt && !ios) return;
    var bar = document.createElement('div');
    bar.className = 'ek-install-banner';
    bar.innerHTML = '<span>Keep EdgeKeeper close.</span><button type="button">' + (ios ? 'Add to Home Screen' : 'Install') + '</button><button type="button" aria-label="Dismiss">×</button>';
    document.body.appendChild(bar);
    var buttons = bar.querySelectorAll('button');
    buttons[0].addEventListener('click', async function () {
      if (installPrompt) {
        installPrompt.prompt();
        await installPrompt.userChoice;
        installPrompt = null;
        bar.remove();
      } else {
        bar.querySelector('span').textContent = 'Use Share, then Add to Home Screen.';
      }
    });
    buttons[1].addEventListener('click', function () {
      localStorage.setItem('ek_install_dismissed_v1', '1');
      bar.remove();
    });
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    installPrompt = event;
    setTimeout(showInstallPrompt, 1200);
  });
  window.addEventListener('appinstalled', function () {
    installPrompt = null;
    var existing = document.querySelector('.ek-install-banner');
    if (existing) existing.remove();
  });

  function base64ToBytes(value) {
    var padding = '='.repeat((4 - value.length % 4) % 4);
    var raw = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
    var bytes = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }

  async function enablePush() {
    if (!('Notification' in window) || Notification.permission === 'denied') return { ok: false, reason: 'unsupported_or_denied' };
    var permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: 'permission_denied' };
    var registration = await navigator.serviceWorker.ready;
    var keyResponse = await fetch('/api/push/vapid-public-key', { credentials: 'include' });
    if (!keyResponse.ok) return { ok: false, reason: 'push_not_configured' };
    var keyData = await keyResponse.json();
    var subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToBytes(keyData.publicKey),
    });
    var saveResponse = await fetch('/api/push/subscribe', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON(), deviceLabel: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop' }),
    });
    return { ok: saveResponse.ok, reason: saveResponse.ok ? 'enabled' : 'save_failed' };
  }

  async function disablePush() {
    var registration = await navigator.serviceWorker.ready;
    var subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(function () {});
      await subscription.unsubscribe().catch(function () {});
    }
    return { ok: true };
  }

  window.EKPush = { enable: enablePush, disable: disablePush };

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

  // Installed launches restore the authenticated product space instead of
  // dropping a returning user on the public landing page.
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone && location.pathname === '/edgekeeper.html') {
    fetch('/api/auth/me', { credentials: 'include' }).then(function (response) {
      if (!response.ok) return;
      return response.json();
    }).then(function (user) {
      if (user) location.replace(user.workspaceAccess ? '/workspace.html' : '/onboarding.html');
    }).catch(function () {});
  }

  window.addEventListener('pagehide', function () { sessionStorage.setItem('ek_last_route', location.pathname + location.search); });
  if (isStandalone) document.documentElement.classList.add('ek-standalone');
  if (!isStandalone && /iphone|ipad|ipod/i.test(navigator.userAgent)) setTimeout(showInstallPrompt, 1200);
  window.addEventListener('pageshow', function () { document.documentElement.classList.add('ek-app-ready'); });

  window.addEventListener('load', function () {
    var panel = new URLSearchParams(location.search).get('panel');
    if (panel && typeof window.showPanel === 'function') window.showPanel(panel);
  });
}());