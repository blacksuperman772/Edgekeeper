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
  var COLORS = { marcus: '#b8a06a', iris: '#6b8c6b', theo: '#b8a06a' };
  // Per-mentor orb palettes (c1 light → c3 deep) so each orb has its own character.
  var PALETTES = {
    iris:   { c1: '#aed8b6', c2: '#6ea88e', c3: '#2e5343', bg: '#edf4ef' }, // sage → forest
    marcus: { c1: '#ecd7a0', c2: '#c29a4a', c3: '#6c5a34', bg: '#f3eee4' }, // wheat → bronze
    theo:   { c1: '#ecd7a0', c2: '#c29a4a', c3: '#6c5a34', bg: '#f3eee4' }, // gold (same family)
  };
  var state = { conv: null, phase: 'idle', seconds: 0, timer: null, endedByTimeout: false, muted: false, opts: null };

  function el(id) { return document.getElementById(id); }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      // Above the top bar (9999) and menu (10001) so the call view covers "Call [mentor]".
      '#ekv{--ekv:#6b8c6b;position:fixed;inset:0;z-index:10050;display:none;flex-direction:column;align-items:center;justify-content:center;',
      "background:#070708;font-family:var(--sans,Inter,sans-serif);}",
      '#ekv.active{display:flex;}',
      // Siri-style orb: layered conic gradients rotated via @property --ekv-angle, a
      // dot-texture overlay, blur + contrast, tinted to the room colour, over a halo.
      '@property --ekv-angle{syntax:"<angle>";inherits:false;initial-value:0deg;}',
      '#ekv-orbwrap{position:relative;width:clamp(240px,64vw,300px);height:clamp(240px,64vw,300px);margin-bottom:46px;display:flex;align-items:center;justify-content:center;}',
      '#ekv-orb{--c1:color-mix(in srgb,var(--ekv) 92%,#fff);--c2:color-mix(in srgb,var(--ekv) 55%,#fff);--c3:color-mix(in srgb,var(--ekv) 72%,#000);--ekbg:color-mix(in srgb,var(--ekv) 10%,#eff3f1);',
      'position:relative;width:90%;height:90%;display:grid;grid-template-areas:"stack";overflow:hidden;border-radius:50%;isolation:isolate;transform:scale(1);transition:transform .6s cubic-bezier(.4,0,.2,1);}',
      '#ekv-orb::before,#ekv-orb::after{content:"";display:block;grid-area:stack;width:100%;height:100%;border-radius:50%;}',
      '#ekv-orb::before{background:conic-gradient(from calc(var(--ekv-angle)*2) at 25% 70%,var(--c3),transparent 20% 80%,var(--c3)),conic-gradient(from calc(var(--ekv-angle)*2) at 45% 75%,var(--c2),transparent 30% 60%,var(--c2)),conic-gradient(from calc(var(--ekv-angle)*-3) at 80% 20%,var(--c1),transparent 40% 60%,var(--c1)),conic-gradient(from calc(var(--ekv-angle)*2) at 15% 5%,var(--c2),transparent 10% 90%,var(--c2)),conic-gradient(from calc(var(--ekv-angle)*1) at 20% 80%,var(--c1),transparent 10% 90%,var(--c1)),conic-gradient(from calc(var(--ekv-angle)*-2) at 85% 10%,var(--c3),transparent 20% 80%,var(--c3));box-shadow:inset var(--ekbg) 0 0 2px 0.4px;filter:blur(4px) contrast(1.5);animation:ekvRotate 18s linear infinite;will-change:transform;}',
      '#ekv-orb::after{background:radial-gradient(circle at 36% 28%,rgba(255,255,255,.38) 0%,rgba(255,255,255,.08) 20%,transparent 46%),radial-gradient(circle at 70% 82%,rgba(0,0,0,.28),transparent 46%);}',
      // Reaction = a smooth scale transition only. Rotation speed never changes, so the
      // @property angle never jumps (that was the speaking-state glitch).
      '#ekv-orb.speaking{transform:scale(1.045);}',
      '#ekv-orb.listening{transform:scale(.955);}',
      '@keyframes ekvRotate{to{--ekv-angle:360deg;}}',
      '@media (prefers-reduced-motion:reduce){#ekv-orb::before{animation:none!important;}#ekv-orb.listening,#ekv-orb.speaking{transform:none;}}',
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
      '<div id="ekv-orbwrap"><div id="ekv-orb"></div></div>' +
      '<div id="ekv-name"></div>' +
      '<div id="ekv-status">Connecting…</div>' +
      '<div id="ekv-note">Behavioural coaching, not financial advice. Your mic is used only for this call.</div>' +
      '<div id="ekv-err"></div>' +
      '<div id="ekv-ctrls">' +
        '<button class="ekv-btn" id="ekv-mute" title="Mute"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg></button>' +
        '<button id="ekv-end" title="End call"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.6 13.6a1 1 0 0 1-.3-1.2C4.9 8.9 8.2 6.5 12 6.5s7.1 2.4 8.7 5.9a1 1 0 0 1-.3 1.2l-2.4 1.8a1 1 0 0 1-1.3-.1l-1.6-1.6a1 1 0 0 1-.2-1.1c.1-.3.2-.6.2-.8-1-.4-2-.6-3.1-.6s-2.1.2-3.1.6c0 .2.1.5.2.8a1 1 0 0 1-.2 1.1L7 15.3a1 1 0 0 1-1.3.1z"/></svg></button>' +
      '</div>';
    document.body.appendChild(v);
    el('ekv-end').onclick = end;
    el('ekv-mute').onclick = toggleMute;
  }

  function open() {
    var mk = state.opts.mentor;
    var v = el('ekv');
    v.style.setProperty('--ekv', COLORS[mk] || '#6b8c6b');
    var pal = PALETTES[mk], orb = el('ekv-orb');
    if (pal && orb) { orb.style.setProperty('--c1', pal.c1); orb.style.setProperty('--c2', pal.c2); orb.style.setProperty('--c3', pal.c3); orb.style.setProperty('--ekbg', pal.bg); }
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

  // ── Per-mentor voice tools ────────────────────────────────────────────────
  // Each mentor's own tools, callable by voice. The agent declares the tool
  // (name + schema) on ElevenLabs; these are the browser-side implementations
  // it invokes. Every one hits a real endpoint and returns a short, spoken-
  // friendly string — real data, so the mentor never has to make anything up.
  // The matching tool must be registered on that mentor's ElevenLabs agent or
  // it simply never fires; wiring them here is harmless until then.
  function toast(m) { if (typeof w.ekToast === 'function') w.ekToast(m); }
  async function getJSON(url) {
    var r = await fetch(url, { credentials: 'include' });
    return { status: r.status, ok: r.ok, data: await r.json().catch(function () { return {}; }) };
  }

  async function readRules() {
    try {
      var r = await getJSON('/api/rules');
      if (r.status === 403) return "They're not on a plan that has saved rules yet.";
      if (!r.ok) return "Couldn't pull their rules right now.";
      var list = (r.data.rules || []).filter(function (x) { return x.is_active !== false; }).map(function (x) { return x.rule_text; });
      if (!list.length) return "They haven't saved any rules yet.";
      return "Their current rules are: " + list.join(" | ");
    } catch (_) { return "Couldn't reach their rules right now."; }
  }

  var TOOLS = {
    iris: function () {
      return {
        save_rule: async function (a) {
          try {
            var r = await fetch('/api/rules', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rule_text: a && a.rule_text, category: (a && a.category) || 'General', rationale: (a && a.rationale) || null, origin_mentor: 'ashley' }) });
            if (r.status === 403) return "Setting personal laws needs a Resident plan or above.";
            if (!r.ok) { var e = await r.json().catch(function () { return {}; }); return "I couldn't save that: " + (e.error || "try again"); }
            toast('New law set'); return "Done. That's law now.";
          } catch (_) { return "Something went wrong saving that."; }
        },
        read_my_rules: readRules,
        read_limits: async function () {
          try {
            var r = await getJSON('/api/guardian/limits');
            if (r.status === 403) return "Custom risk limits are a Fellow-plan thing.";
            if (!r.ok) return "Couldn't pull their limits right now.";
            var d = r.data.limits || {}, p = [];
            if (d.risk_per_trade_pct != null) p.push("per-trade risk " + d.risk_per_trade_pct + "%");
            if (d.risk_max_daily_loss_pct != null) p.push("max daily loss " + d.risk_max_daily_loss_pct + "%");
            if (d.risk_max_drawdown_pct != null) p.push("max drawdown " + d.risk_max_drawdown_pct + "%");
            if (d.risk_max_loss_streak != null) p.push("max losing streak " + d.risk_max_loss_streak);
            if (d.risk_max_lots != null) p.push("max lots " + d.risk_max_lots);
            return p.length ? "Their limits: " + p.join(", ") + "." : "They haven't set any custom limits yet.";
          } catch (_) { return "Couldn't reach their limits right now."; }
        },
        read_guardian_state: async function () {
          try {
            var r = await getJSON('/api/guardian');
            if (r.status === 403) return "The Guardian is a Fellow-plan feature.";
            if (!r.ok) return "Couldn't read the Guardian right now.";
            var g = r.data.guardian;
            if (!g || !g.is_connected) return "No trading account is connected, so there's no live standing to read.";
            var p = [];
            if (g.daily_pnl_pct != null) p.push("today they're " + (g.daily_pnl_pct >= 0 ? "up " : "down ") + Math.abs(g.daily_pnl_pct) + "%");
            if (g.max_drawdown_pct != null) p.push("drawdown " + g.max_drawdown_pct + "%");
            if (g.consecutive_losses != null) p.push(g.consecutive_losses + " losses in a row");
            if (g.open_lots != null) p.push(g.open_lots + " lots open");
            return p.length ? "Live standing: " + p.join(", ") + "." : "The account's connected but nothing stands out right now.";
          } catch (_) { return "Couldn't reach the Guardian right now."; }
        },
        set_limit: async function (a) {
          // Sets the trader's risk limits in ONE commitment. The endpoint replaces
          // the whole set and starts a 24h tighten-only lock, so setting them
          // piecemeal would keep restarting that lock — Iris gathers the full set
          // and saves once. Unspecified fields keep their current value.
          a = a || {};
          try {
            var cur = await getJSON('/api/guardian/limits');
            if (cur.status === 403) return "Custom limits are a Fellow-plan feature.";
            if (!cur.ok) return "Couldn't read their current limits to change them.";
            var L = cur.data.limits || {};
            var body = {
              risk_per_trade_pct: L.risk_per_trade_pct, risk_per_trade_mode: L.risk_per_trade_mode || 'pct',
              risk_max_daily_loss_pct: L.risk_max_daily_loss_pct, risk_max_daily_loss_mode: L.risk_max_daily_loss_mode || 'pct',
              risk_max_drawdown_pct: L.risk_max_drawdown_pct, risk_max_drawdown_mode: L.risk_max_drawdown_mode || 'pct',
              risk_max_loss_streak: L.risk_max_loss_streak, risk_max_lots: L.risk_max_lots,
            };
            var given = function (x) { return !(x === null || x === '' || x === undefined); };
            var mode = function (x) { return x === 'amt' ? 'amt' : 'pct'; };
            var touched = false;
            if (given(a.per_trade))   { body.risk_per_trade_pct = Number(a.per_trade); if (a.per_trade_mode) body.risk_per_trade_mode = mode(a.per_trade_mode); touched = true; }
            if (given(a.daily_loss))  { body.risk_max_daily_loss_pct = Number(a.daily_loss); if (a.daily_loss_mode) body.risk_max_daily_loss_mode = mode(a.daily_loss_mode); touched = true; }
            if (given(a.drawdown))    { body.risk_max_drawdown_pct = Number(a.drawdown); if (a.drawdown_mode) body.risk_max_drawdown_mode = mode(a.drawdown_mode); touched = true; }
            if (given(a.loss_streak)) { body.risk_max_loss_streak = Number(a.loss_streak); touched = true; }
            if (given(a.max_lots))    { body.risk_max_lots = Number(a.max_lots); touched = true; }
            if (!touched) return "Tell me the limits you want and the numbers, and I'll set them together.";
            var r = await fetch('/api/guardian/limits', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (r.status === 403) return "Custom limits are a Fellow-plan feature.";
            if (r.status === 423) return "Their rules are locked right now — they can tighten a limit but not loosen one until the cooldown ends.";
            if (!r.ok) { var e = await r.json().catch(function () { return {}; }); return "Couldn't set those: " + (e.error || "a value was out of range"); }
            toast('Limits updated'); return "Done — those limits are set now, and they lock for 24 hours.";
          } catch (_) { return "Something went wrong setting those."; }
        },
      };
    },
    marcus: function () {
      return {
        add_journal_entry: async function (a) {
          try {
            var text = ((a && a.entry_text) || '').trim();
            if (text.length < 3) return "There's nothing to write down yet.";
            var r = await fetch('/api/journal', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text, entry_type: 'free', mentor_notes: 'Logged on a call with Marcus' }) });
            if (r.status === 403) return "Journaling needs the Resident plan or above.";
            if (!r.ok) return "Couldn't save that to the journal.";
            toast('Journal entry saved'); return "Saved to their journal.";
          } catch (_) { return "Something went wrong saving that."; }
        },
        read_analytics: async function () {
          try {
            var r = await getJSON('/api/analytics');
            if (r.status === 403) return "Behavior analytics needs the Resident plan or above.";
            if (!r.ok) return "Couldn't pull their analytics right now.";
            var d = r.data, p = [];
            if (d.disciplineScore != null) p.push("discipline score " + d.disciplineScore);
            if (d.adherencePct != null) p.push("rule adherence " + d.adherencePct + "%");
            if (d.flagsThisWeek != null) p.push(d.flagsThisWeek + " flags this week");
            if (d.totalRules != null && d.totalRules > 0) p.push(d.brokenRules + " of " + d.totalRules + " rules broken lately");
            return p.length ? "This week: " + p.join(", ") + "." : "Not enough activity yet to read anything into.";
          } catch (_) { return "Couldn't reach their analytics right now."; }
        },
      };
    },
    theo: function () {
      return {
        read_progress: async function () {
          try {
            var r = await getJSON('/api/academy/progress');
            if (!r.ok) return "Couldn't pull their Academy progress right now.";
            var prog = r.data.progress || {};
            var keys = Object.keys(prog);
            var done = keys.filter(function (k) { return prog[k] && prog[k].completed; }).length;
            var track = r.data.track ? ("on the " + r.data.track + " track") : "not enrolled in a track yet";
            var inProg = keys.length - done;
            return "They're " + track + ", with " + done + " lesson" + (done === 1 ? "" : "s") + " completed" + (inProg > 0 ? (" and " + inProg + " in progress") : "") + ".";
          } catch (_) { return "Couldn't reach their progress right now."; }
        },
        mark_lesson_complete: async function (a) {
          try {
            var key = ((a && a.module_key) || w.EK_CURRENT_MODULE || '').trim();
            if (!/^[a-z0-9_]{2,60}$/.test(key)) return "I need the lesson's key to mark it done.";
            var r = await fetch('/api/academy/progress', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ module: key, completed: Date.now() }) });
            if (!r.ok) return "Couldn't mark that lesson complete.";
            toast('Lesson marked complete'); return "Marked that lesson complete for them.";
          } catch (_) { return "Something went wrong marking it."; }
        },
      };
    },
  };

  w.EKVoiceTools = function (mentor) {
    var f = TOOLS[mentor];
    try { return f ? f() : {}; } catch (_) { return {}; }
  };

  w.EKVoice = {
    start: function (opts) { state.opts = opts || {}; injectStyles(); injectView(); open(); connect(); },
    end: end,
    isActive: function () { return state.phase === 'active' || state.phase === 'connecting'; },
  };
})(window);
