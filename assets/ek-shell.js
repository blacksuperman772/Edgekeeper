/* ──────────────────────────────────────────────────────────────────────────
 * ek-shell.js — shared app-shell menu for the mentor pages
 *
 * Injects the slide-in menu (EdgeKeeper/Home, the three mentors, account) that
 * the ☰ button opens, themed to the current room. The bar itself (☰ + Call)
 * lives in each page's own header; it just calls EKShell.openMenu() / EKShell.call().
 *
 *   EKShell.init({ mentor:'iris', voice:{ getContext, clientTools } });
 *   EKShell.setUser({ name:'Alexander', plan:'Fellow' });   // optional
 *   // wire your bar:  ☰ -> EKShell.openMenu()   Call -> EKShell.call()
 * ────────────────────────────────────────────────────────────────────────── */
(function (w) {
  'use strict';
  if (w.EKShell) return;

  var COLORS = { marcus: '#b8a06a', iris: '#6b8c6b', theo: '#b8a06a' };
  var MENTORS = [
    { key: 'marcus', label: 'Marcus', href: '/workspace.html' },
    { key: 'theo',   label: 'Theo',   href: '/my-academy' },
    { key: 'iris',   label: 'Iris',   href: '/chamber' },
  ];
  var state = { mentor: 'iris', voice: {}, tools: null };

  // Icon set — mentor glyphs match the home nav (Marcus ledger, Theo cap, Iris shield).
  var ICONS = {
    home:   '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>',
    ledger: '<rect x="4" y="5" width="16" height="14" rx="1"/><path d="M8 9h8M8 13h5"/>',
    cap:    '<path d="m3 9 9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>',
    shield: '<path d="M12 3 20 7v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
    shieldplain: '<path d="M12 3 20 7v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>',
    eye:    '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    link:   '<path d="M9 15l6-6"/><path d="M11 6l1-1a4 4 0 0 1 5 5l-1 1"/><path d="M13 18l-1 1a4 4 0 0 1-5-5l1-1"/>',
    trend:  '<path d="M4 17l5-5 3 3 7-8"/>',
    levels: '<path d="M5 19V9M11 19V5M17 19v-6"/>',
    book:   '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 8h6M9 12h4"/>',
    check:  '<path d="M5 7l2 2 4-4M5 15l2 2 4-4"/><path d="M14 7h5M14 17h5"/>',
    card:   '<rect x="4" y="4" width="16" height="16" rx="1"/><circle cx="12" cy="10" r="2.5"/><path d="M8 17c0-2 8-2 8 0"/>',
    chart:  '<path d="M4 18l5-5 3 3 7-8"/>',
    lock:   '<rect x="4" y="10" width="16" height="11" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/>',
    mail:   '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 6l9 7 9-7"/>',
    gear:   '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M5 5l1.8 1.8M17.2 17.2L19 19M3 12h2.5M18.5 12H21M5 19l1.8-1.8M17.2 6.8L19 5"/>',
    dot:    '<circle cx="12" cy="12" r="3.5"/>',
  };
  var MENTOR_ICON = { marcus: 'ledger', theo: 'cap', iris: 'shield' };
  function icon(key) {
    return '<svg class="eks-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[key] || ICONS.dot) + '</svg>';
  }

  function injectStyles() {
    if (document.getElementById('ek-shell-style')) return;
    var s = document.createElement('style');
    s.id = 'ek-shell-style';
    s.textContent = [
      '#eks-scrim{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.5);opacity:0;pointer-events:none;transition:opacity .25s;}',
      '#eks-scrim.open{opacity:1;pointer-events:auto;}',
      // A drawer on every screen (never full-width): the chat stays visible behind the scrim.
      '#eks-menu{--eks:#6b8c6b;box-sizing:border-box;position:fixed;top:0;left:0;bottom:0;z-index:10001;width:300px;max-width:86vw;overflow:hidden;overscroll-behavior:contain;background:#0b0b0d;border-right:1px solid rgba(255,255,255,0.08);box-shadow:4px 0 40px rgba(0,0,0,0.45);padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);',
      'display:flex;flex-direction:column;transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);font-family:var(--sans,Inter,sans-serif);}',
      '#eks-menu.open{transform:translateX(0);}',
      // Neutral darks everywhere; the room colour lives only in --eks (logo, active item, icons, avatar).
      '.eks-top{padding:20px 22px 14px;border-bottom:1px solid rgba(255,255,255,0.06);}',
      '.eks-logo{font-family:var(--serif,Georgia,serif);font-size:1.1rem;letter-spacing:0.2em;text-transform:uppercase;color:#eef2ec;text-decoration:none;display:block;}',
      '.eks-logo b{color:var(--eks);font-weight:500;}',
      '.eks-home{display:flex;align-items:center;gap:12px;font-size:0.86rem;color:#9a9aa0;margin-top:16px;text-decoration:none;}',
      '.eks-home:hover{color:#eef2ec;}',
      '.eks-mid{flex:1;padding:14px 0;overflow-y:auto;}',
      '.eks-sec{font-family:var(--mono,monospace);font-size:0.5rem;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);padding:10px 22px 8px;}',
      '.eks-item{display:flex;align-items:center;gap:12px;padding:12px 22px;color:#b7b7bd;text-decoration:none;font-size:0.86rem;}',
      '.eks-item:hover{background:rgba(255,255,255,0.04);color:#eef2ec;}',
      '.eks-item.on{color:#eef2ec;background:color-mix(in srgb,var(--eks) 13%,transparent);}',
      '.eks-tool{background:none;border:none;width:100%;text-align:left;cursor:pointer;font-family:var(--sans,Inter,sans-serif);font-size:0.84rem;color:#a0a0a6;}',
      '.eks-tool:hover{background:rgba(255,255,255,0.04);color:#eef2ec;}',
      '.eks-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}',
      '.eks-ic{width:17px;height:17px;flex-shrink:0;opacity:.68;}',
      '.eks-item.on .eks-ic{color:var(--eks);opacity:1;} .eks-item:hover .eks-ic{opacity:.95;}',
      '.eks-foot{border-top:1px solid rgba(255,255,255,0.06);padding:14px 18px;display:flex;align-items:center;gap:12px;text-decoration:none;}',
      '.eks-foot:hover{background:rgba(255,255,255,0.04);}',
      '.eks-av{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,0.14);background:color-mix(in srgb,var(--eks) 20%,#141416);display:flex;align-items:center;justify-content:center;font-family:var(--serif,Georgia,serif);color:#e8e8ea;font-size:0.9rem;flex-shrink:0;}',
      '.eks-nm{font-size:0.84rem;color:#dcdce0;} .eks-pl{font-family:var(--mono,monospace);font-size:0.52rem;letter-spacing:0.1em;color:rgba(255,255,255,0.4);margin-top:2px;}',
      '.eks-gear{margin-left:auto;color:rgba(255,255,255,0.4);} .eks-gear:hover{color:var(--eks);} .eks-gear svg{width:17px;height:17px;}'
    ].join('');
    document.head.appendChild(s);
  }

  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; }); }

  function injectMenu() {
    if (document.getElementById('eks-menu')) return;
    var scrim = document.createElement('div'); scrim.id = 'eks-scrim'; scrim.onclick = closeMenu;
    document.body.appendChild(scrim);

    // A <div>, not a <nav>: the app-mode shell hides `body>nav:not(.ek-appnav)`,
    // which would otherwise display:none this menu. role keeps the landmark.
    var m = document.createElement('div'); m.id = 'eks-menu'; m.setAttribute('role', 'navigation'); m.setAttribute('aria-label', 'Main menu');
    m.style.setProperty('--eks', COLORS[state.mentor] || '#6b8c6b');
    var items = MENTORS.map(function (x) {
      return '<a class="eks-item' + (x.key === state.mentor ? ' on' : '') + '" href="' + x.href + '">' +
        icon(MENTOR_ICON[x.key]) + esc(x.label) + '</a>';
    }).join('');
    var toolsHtml = '';
    if (state.tools && state.tools.items && state.tools.items.length) {
      toolsHtml = '<div class="eks-sec" style="margin-top:4px">' + esc(state.tools.label || 'In this room') + '</div>'
        + state.tools.items.map(function (t, i) {
            return '<button class="eks-item eks-tool" data-i="' + i + '">' + icon(t.ic) + esc(t.l) + '</button>';
          }).join('');
    }
    m.innerHTML =
      '<div class="eks-top">' +
        '<a class="eks-logo" href="/app">Edge<b>K</b>eeper</a>' +
        '<a class="eks-home" href="/app">' + icon('home') + '<span>Home</span></a>' +
      '</div>' +
      '<div class="eks-mid"><div class="eks-sec">Your mentors</div>' + items + toolsHtml + '</div>' +
      '<a class="eks-foot" href="/profile.html">' +
        '<div class="eks-av" id="eks-av">·</div>' +
        '<div><div class="eks-nm" id="eks-nm">Account</div><div class="eks-pl" id="eks-pl"></div></div>' +
        '<span class="eks-gear" onclick="event.preventDefault();event.stopPropagation();location.href=\'/settings.html\'">' + icon('gear') + '</span>' +
      '</a>';
    document.body.appendChild(m);
    if (state.tools && state.tools.fn) {
      m.querySelectorAll('.eks-tool').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var it = state.tools.items[+btn.dataset.i];
          closeMenu();
          try { if (typeof window[state.tools.fn] === 'function') window[state.tools.fn](it.a); } catch (e) {}
        });
      });
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  function openMenu() { injectMenu(); document.getElementById('eks-menu').classList.add('open'); document.getElementById('eks-scrim').classList.add('open'); }
  function closeMenu() { var m = document.getElementById('eks-menu'), s = document.getElementById('eks-scrim'); if (m) m.classList.remove('open'); if (s) s.classList.remove('open'); }

  w.EKShell = {
    init: function (o) {
      o = o || {};
      state.mentor = o.mentor || 'iris';
      state.voice = o.voice || {};
      state.tools = o.tools || null;
      injectStyles();
      var m = document.getElementById('eks-menu'); if (m) m.remove();
      var s = document.getElementById('eks-scrim'); if (s) s.remove();
      injectMenu();
    },
    openMenu: openMenu,
    closeMenu: closeMenu,
    call: function () { if (w.EKVoice) w.EKVoice.start(Object.assign({ mentor: state.mentor }, state.voice)); },
    setUser: function (u) {
      u = u || {};
      var nm = document.getElementById('eks-nm'), pl = document.getElementById('eks-pl'), av = document.getElementById('eks-av');
      if (nm && u.name) nm.textContent = u.name;
      if (pl && u.plan) pl.textContent = u.plan;
      if (av && u.name) av.textContent = u.name.trim().charAt(0).toUpperCase();
    },
  };
})(window);
