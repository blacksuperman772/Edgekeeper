/* ──────────────────────────────────────────────────────────────────────────
 * ek-voice.js — shared in-app voice call (ElevenLabs Conversational AI)
 *
 * Renders a FULL-SCREEN call page (orb + live timer + mute/end + back-to-chat),
 * its own view over whatever page called it. Used by Iris's Chamber, Theo's
 * Academy and (later) Marcus's Office. Marcus keeps his inline copy for now.
 *
 * Requires on the page: livekit-client@2.19.2 + @11labs/client@0.2.0 (window.client) + gsap (optional)
 *
 * Usage:
 *   EKVoice.start({ mentor:'iris', getContext:()=>"…", clientTools:{…}, onEnd:(secs)=>{} });
 * ────────────────────────────────────────────────────────────────────────── */
(function (w) {
  'use strict';
  if (w.EKVoice) return;

  var STYLE_ID = 'ek-voice-style';
  var NAMES  = { marcus: 'Marcus', iris: 'Iris', theo: 'Theo' };
  var COLORS = { marcus: '#b8a06a', iris: '#6b8c6b', theo: '#6b82a0' };
  var state = { conv: null, phase: 'idle', seconds: 0, timer: null, endedByTimeout: false, muted: false, opts: null };

  function el(id) { return document.getElementById(id); }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#ekv{--ekv:#6b8c6b;position:fixed;inset:0;z-index:9000;display:none;flex-direction:column;align-items:center;justify-content:center;',
      "background:radial-gradient(ellipse 72% 56% at 50% 40%, color-mix(in srgb,var(--ekv) 12%,#060806) 0%, #060806 70%);font-family:var(--sans,Inter,sans-serif);}",
      '#ekv.active{display:flex;}',
      '#ekv-back{position:absolute;top:0;left:0;height:56px;display:flex;align-items:center;gap:9px;padding:0 18px;',
      'color:var(--faint,#7d8a7c);font-family:var(--mono,monospace);font-size:0.58rem;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer;background:none;border:none;}',
      '#ekv-back:hover{color:var(--ekv);} #ekv-back svg{width:15px;height:15px;}',
      '#ekv-orb{width:150px;height:150px;border-radius:50%;margin-bottom:34px;',
      'background:radial-gradient(circle at 42% 38%, color-mix(in srgb,var(--ekv) 55%,#fff), var(--ekv) 55%, color-mix(in srgb,var(--ekv) 40%,#000) 100%);',
      'box-shadow:0 0 60px color-mix(in srgb,var(--ekv) 45%,transparent),0 0 120px color-mix(in srgb,var(--ekv) 18%,transparent);transition:transform .3s ease;}',
      '#ekv-orb.speaking{animation:ekvBreathe 1.6s ease-in-out infinite;}',
      '#ekv-orb.listening{transform:scale(0.86);opacity:0.75;}',
      '@keyframes ekvBreathe{0%,100%{transform:scale(1);}50%{transform:scale(1.07);}}',
      '#ekv-name{font-family:var(--serif,Georgia,serif);font-weight:400;font-size:2.4rem;color:var(--bright,#eef2ec);}',
      '#ekv-status{font-family:var(--mono,monospace);font-size:0.62rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--ekv);margin-top:12px;min-height:16px;}',
      '#ekv-note{font-size:0.72rem;color:var(--muted,#5f6b5e);margin-top:16px;max-width:300px;text-align:center;line-height:1.5;}',
      '#ekv-err{display:none;color:var(--red,#a85a4a);font-size:0.8rem;line-height:1.6;margin-top:16px;max-width:340px;text-align:center;}',
      '#ekv-ctrls{position:absolute;bottom:42px;display:flex;gap:20px;align-items:center;}',
      '.ekv-btn{width:58px;height:58px;border-radius:50%;border:1px solid #2a332a;background:#0c0f0c;color:#b4bdb2;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:border-color .2s,color .2s;}',
      '.ekv-btn:hover{border-color:var(--ekv);color:var(--ekv);} .ekv-btn svg{width:21px;height:21px;}',
      '.ekv-btn.on{border-color:var(--ekv);color:var(--ekv);background:color-mix(in srgb,var(--ekv) 10%,#0c0f0c);}',
      '#ekv-end{width:66px;height:66px;border-radius:50%;background:rgba(168,90,74,0.15);border:1px solid #a85a4a;color:#c9796a;display:flex;align-items:center;justify-content:center;cursor:pointer;}',
      '#ekv-end:hover{background:rgba(168,90,74,0.26);} #ekv-end svg{width:25px;height:25px;}'
    ].join('');
    document.head.appendChild(s);
  }

  function injectView() {
    if (el('ekv')) return;
    var v = document.createElement('div');
    v.id = 'ekv';
    v.innerHTML =
      '<button id="ekv-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg> Back to chat</button>' +
      '<div id="ekv-orb"></div>' +
      '<div id="ekv-name"></div>' +
      '<div id="ekv-status">Connecting…</div>' +
      '<div id="ekv-note">Behavioural coaching, not financial advice. Your mic is used only for this call.</div>' +
      '<div id="ekv-err"></div>' +
      '<div id="ekv-ctrls">' +
        '<button class="ekv-btn" id="ekv-mute" title="Mute"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg></button>' +
        '<button id="ekv-end" title="End call"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.6 13.6a1 1 0 0 1-.3-1.2C4.9 8.9 8.2 6.5 12 6.5s7.1 2.4 8.7 5.9a1 1 0 0 1-.3 1.2l-2.4 1.8a1 1 0 0 1-1.3-.1l-1.6-1.6a1 1 0 0 1-.2-1.1c.1-.3.2-.6.2-.8-1-.4-2-.6-3.1-.6s-2.1.2-3.1.6c0 .2.1.5.2.8a1 1 0 0 1-.2 1.1L7 15.3a1 1 0 0 1-1.3.1z"/></svg></button>' +
      '</div>';
    document.body.appendChild(v);
    el('ekv-back').onclick = end;
    el('ekv-end').onclick = end;
    el('ekv-mute').onclick = toggleMute;
  }

  function open() {
    var mk = state.opts.mentor;
    var v = el('ekv');
    v.style.setProperty('--ekv', COLORS[mk] || '#6b8c6b');
    el('ekv-name').textContent = NAMES[mk] || 'Mentor';
    setStatus('Connecting…');
    el('ekv-err').style.display = 'none';
    el('ekv-mute').classList.remove('on'); state.muted = false;
    setOrb('');
    state.seconds = 0; state.endedByTimeout = false; tick();
    v.classList.add('active');
    if (w.gsap) w.gsap.fromTo(v, { opacity: 0 }, { opacity: 1, duration: 0.35 });
  }
  function hide() { var v = el('ekv'); if (v) v.classList.remove('active'); }

  function setStatus(txt) { var s = el('ekv-status'); if (s) s.textContent = txt; }
  function setOrb(cls) { var o = el('ekv-orb'); if (o) o.className = cls; }
  function showErr(msg) {
    setStatus('Not connected'); setOrb('');
    var e = el('ekv-err'); if (e) { e.style.display = 'block'; e.innerHTML = msg; }
  }
  function tick() {
    if (state.phase === 'active') setStatus('● Live · ' + fmt());
  }
  function fmt() { var m = Math.floor(state.seconds / 60), s = String(state.seconds % 60).padStart(2, '0'); return m + ':' + s; }
  function startTimer() { clearInterval(state.timer); state.timer = setInterval(function () { state.seconds++; if (state.phase === 'active') setStatus('● Live · ' + fmt()); }, 1000); }
  function stopTimer() { clearInterval(state.timer); state.timer = null; }

  function toggleMute() {
    state.muted = !state.muted;
    el('ekv-mute').classList.toggle('on', state.muted);
    try { if (state.conv && typeof state.conv.setMicMuted === 'function') state.conv.setMicMuted(state.muted); } catch (_) {}
  }

  function stripStageTags(s) {
    return String(s || '')
      .replace(/\[(?:slow|normal|fast|slower|faster|pause|long pause|short pause|beat|whisper|whispering|sighs?|laughs?|chuckles?|warmly|softly|firmly|quietly|gently|serious|flat|calm|warm)\]/gi, '')
      .replace(/\s{2,}/g, ' ').trim();
  }

  async function connect() {
    if (state.phase === 'connecting' || state.phase === 'active') return;
    state.phase = 'connecting';
    var opts = state.opts;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(function (t) { t.stop(); });
      }
    } catch (permErr) {
      showErr('Microphone access is needed for a call. Allow it in your browser, then try again.');
      state.phase = 'idle'; return;
    }

    try {
      var res = await fetch('/api/voice/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentor: opts.mentor }),
      });
      if (res.status === 401) { showErr('Sign in to start a call.'); state.phase = 'idle'; return; }
      if (res.status === 429) {
        var e429 = await res.json().catch(function () { return {}; });
        showErr((e429.error || 'Monthly voice limit reached.') + ' <a href="/pricing.html" style="color:var(--ekv);">Upgrade →</a>');
        state.phase = 'idle'; return;
      }
      if (!res.ok) {
        var ebad = await res.json().catch(function () { return {}; });
        showErr(ebad.error || 'Could not start the call. Please try again.');
        state.phase = 'idle'; return;
      }
      var body = await res.json();
      var signedUrl = body.signedUrl, serverPrompt = body.prompt, firstMessage = body.firstMessage;

      var ELConv = w.client && w.client.Conversation;
      if (!ELConv || typeof ELConv.startSession !== 'function') {
        showErr('Voice engine failed to load. Refresh and try again.'); state.phase = 'idle'; return;
      }

      var ctx = (typeof opts.getContext === 'function' && opts.getContext()) || '';
      var fullPrompt = [serverPrompt, ctx].filter(Boolean).join('\n\n');
      var override = {};
      if (fullPrompt) override.prompt = { prompt: fullPrompt };
      if (firstMessage) override.first_message = firstMessage;
      var overrides = Object.keys(override).length ? { agent: override } : undefined;

      var cbs = {
        clientTools: opts.clientTools || {},
        onMessage: function (p) { /* call stays in the call view; transcript not dumped into chat */ },
        onModeChange: function (p) {
          if (p.mode === 'speaking') { setOrb('speaking'); }
          else { setOrb('listening'); }
        },
        onStatusChange: function (p) {
          if (p.status === 'connected') { state.phase = 'active'; setOrb(''); startTimer(); setStatus('● Live · ' + fmt()); }
        },
        onDisconnect: function () { if (state.phase !== 'ending') { state.endedByTimeout = true; end(); } },
        onError: function (m, c) { console.error('EKVoice error:', m, c); showErr('The call dropped. Please try again.'); state.phase = 'idle'; stopTimer(); },
      };

      try {
        state.conv = await ELConv.startSession(Object.assign({ signedUrl: signedUrl, overrides: overrides }, cbs));
      } catch (ovErr) {
        console.warn('EKVoice: overrides rejected, retrying prompt-only —', ovErr);
        var promptOnly = fullPrompt ? { agent: { prompt: { prompt: fullPrompt } } } : undefined;
        state.conv = await ELConv.startSession(Object.assign({ signedUrl: signedUrl, overrides: promptOnly }, cbs));
      }
    } catch (err) {
      console.error('EKVoice connect:', err);
      showErr('Could not start the call. Please refresh and try again.');
      state.phase = 'idle';
    }
  }

  async function end() {
    if (state.phase === 'idle' && !state.conv) { hide(); return; }
    if (state.phase === 'ending') return;
    state.phase = 'ending';
    stopTimer();
    if (state.conv) { try { await state.conv.endSession(); } catch (_) {} state.conv = null; }
    hide();
    var secs = state.seconds;
    state.phase = 'idle';
    if (state.opts && typeof state.opts.onEnd === 'function') { try { state.opts.onEnd(secs); } catch (_) {} }
  }

  w.EKVoice = {
    start: function (opts) { state.opts = opts || {}; injectStyles(); injectView(); open(); connect(); },
    end: end,
    isActive: function () { return state.phase === 'active' || state.phase === 'connecting'; },
  };
})(window);
