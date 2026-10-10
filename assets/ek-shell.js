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

  var COLORS = { marcus: '#b8a06a', iris: '#6b8c6b', theo: '#6b82a0' };
  var MENTORS = [
    { key: 'marcus', label: 'Marcus · the day-to-day', href: '/workspace.html' },
    { key: 'theo',   label: 'Theo · the Academy',      href: '/my-academy' },
    { key: 'iris',   label: 'Iris · the Guardian',     href: '/chamber' },
  ];
  var state = { mentor: 'iris', voice: {} };

  function injectStyles() {
    if (document.getElementById('ek-shell-style')) return;
    var s = document.createElement('style');
    s.id = 'ek-shell-style';
    s.textContent = [
      '#eks-scrim{position:fixed;inset:0;z-index:10000;background:rgba(3,4,3,0.6);opacity:0;pointer-events:none;transition:opacity .25s;}',
      '#eks-scrim.open{opacity:1;pointer-events:auto;}',
      '#eks-menu{--eks:#6b8c6b;position:fixed;top:0;left:0;bottom:0;z-index:10001;width:278px;max-width:86vw;background:#0c0f0c;border-right:1px solid #1a201a;',
      'display:flex;flex-direction:column;transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);font-family:var(--sans,Inter,sans-serif);}',
      '#eks-menu.open{transform:translateX(0);}',
      '@media (max-width:640px){#eks-menu{width:100%;max-width:100%;}}',
      '.eks-top{padding:20px 22px 14px;border-bottom:1px solid #141a14;}',
      '.eks-logo{font-family:var(--serif,Georgia,serif);font-size:1.1rem;letter-spacing:0.2em;text-transform:uppercase;color:#eef2ec;text-decoration:none;display:block;}',
      '.eks-logo b{color:var(--eks);font-weight:500;}',
      '.eks-home{display:flex;align-items:center;gap:11px;font-size:0.8rem;color:#7d8a7c;margin-top:14px;text-decoration:none;}',
      '.eks-home:hover{color:#d6dcd4;} .eks-home svg{width:15px;height:15px;opacity:.7;}',
      '.eks-mid{flex:1;padding:14px 0;overflow-y:auto;}',
      '.eks-sec{font-family:var(--mono,monospace);font-size:0.5rem;letter-spacing:0.2em;text-transform:uppercase;color:#4a544a;padding:8px 22px;}',
      '.eks-item{display:flex;align-items:center;gap:12px;padding:12px 22px;color:#b4bdb2;text-decoration:none;font-size:0.86rem;}',
      '.eks-item:hover{background:#10140f;color:#eef2ec;}',
      '.eks-item.on{color:#eef2ec;background:#10140f;}',
      '.eks-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}',
      '.eks-foot{border-top:1px solid #141a14;padding:14px 18px;display:flex;align-items:center;gap:12px;text-decoration:none;}',
      '.eks-foot:hover{background:#10140f;}',
      '.eks-av{width:34px;height:34px;border-radius:50%;border:1px solid #273027;background:radial-gradient(circle at 35% 30%,#2a332a,#12170f);display:flex;align-items:center;justify-content:center;font-family:var(--serif,Georgia,serif);color:#9aa69a;font-size:0.9rem;flex-shrink:0;}',
      '.eks-nm{font-size:0.84rem;color:#d6dcd4;} .eks-pl{font-family:var(--mono,monospace);font-size:0.52rem;letter-spacing:0.1em;color:#5f6b5e;margin-top:2px;}',
      '.eks-gear{margin-left:auto;color:#5f6b5e;} .eks-gear:hover{color:var(--eks);} .eks-gear svg{width:17px;height:17px;}'
    ].join('');
    document.head.appendChild(s);
  }

  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; }); }

  function injectMenu() {
    if (document.getElementById('eks-menu')) return;
    var scrim = document.createElement('div'); scrim.id = 'eks-scrim'; scrim.onclick = closeMenu;
    document.body.appendChild(scrim);

    var m = document.createElement('nav'); m.id = 'eks-menu';
    m.style.setProperty('--eks', COLORS[state.mentor] || '#6b8c6b');
    var items = MENTORS.map(function (x) {
      return '<a class="eks-item' + (x.key === state.mentor ? ' on' : '') + '" href="' + x.href + '">' +
        '<span class="eks-dot" style="background:' + COLORS[x.key] + '"></span>' + esc(x.label) + '</a>';
    }).join('');
    m.innerHTML =
      '<div class="eks-top">' +
        '<a class="eks-logo" href="/edgekeeper.html">Edge<b>K</b>eeper</a>' +
        '<a class="eks-home" href="/edgekeeper.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg> Home</a>' +
      '</div>' +
      '<div class="eks-mid"><div class="eks-sec">Your mentors</div>' + items + '</div>' +
      '<a class="eks-foot" href="/profile.html">' +
        '<div class="eks-av" id="eks-av">·</div>' +
        '<div><div class="eks-nm" id="eks-nm">Account</div><div class="eks-pl" id="eks-pl"></div></div>' +
        '<span class="eks-gear" onclick="event.preventDefault();event.stopPropagation();location.href=\'/settings.html\'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg></span>' +
      '</a>';
    document.body.appendChild(m);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  function openMenu() { injectMenu(); document.getElementById('eks-menu').classList.add('open'); document.getElementById('eks-scrim').classList.add('open'); }
  function closeMenu() { var m = document.getElementById('eks-menu'), s = document.getElementById('eks-scrim'); if (m) m.classList.remove('open'); if (s) s.classList.remove('open'); }

  w.EKShell = {
    init: function (o) { o = o || {}; state.mentor = o.mentor || 'iris'; state.voice = o.voice || {}; injectStyles(); injectMenu(); },
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
