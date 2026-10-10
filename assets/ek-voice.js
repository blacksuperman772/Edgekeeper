/* ──────────────────────────────────────────────────────────────────────────
 * ek-voice.js — shared in-app voice widget (ElevenLabs Conversational AI)
 *
 * One call starts a live voice session with a mentor and renders its own
 * overlay (no per-page markup/CSS). Used by chamber.html (Iris) and the
 * Academy (Theo). Marcus keeps his own inline copy in workspace.html for now.
 *
 * Requires on the page (same CDN build workspace.html uses):
 *   livekit-client@2.19.2  +  @11labs/client@0.2.0 (UMD → window.client)  +  gsap (optional)
 *
 * Usage:
 *   EKVoice.start({
 *     mentor: 'iris',
 *     getContext: () => "recent text context string",   // optional
 *     clientTools: { save_rule: async ({rule_text, category}) => "spoken result" },
 *     onEnd: (seconds) => {}                              // optional
 *   });
 * ────────────────────────────────────────────────────────────────────────── */
(function (w) {
  'use strict';
  if (w.EKVoice) return;

  var STYLE_ID = 'ek-voice-style';
  var state = { conv: null, phase: 'idle', seconds: 0, timer: null, endedByTimeout: false, opts: null };

  var NAMES = { marcus: 'Marcus', iris: 'Iris', theo: 'Theo' };

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#ekv-overlay{position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;',
      'background:rgba(4,5,4,0.86);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font-family:var(--sans,Inter,sans-serif);}',
      '#ekv-overlay.active{display:flex;}',
      '.ekv-card{width:min(440px,92vw);background:var(--stone,#0c0f0c);border:1px solid var(--border,#1a201a);',
      'padding:40px 36px 30px;text-align:center;}',
      '.ekv-label{font-family:var(--mono,monospace);font-size:0.56rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--accent,#6b8c6b);}',
      '.ekv-title{font-family:var(--serif,Georgia,serif);font-size:1.9rem;font-weight:300;color:var(--bright,#eef2ec);margin:12px 0 6px;}',
      '.ekv-status{font-family:var(--mono,monospace);font-size:0.58rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--faint,#7d8a7c);min-height:16px;}',
      '.ekv-status.active{color:var(--accent,#6b8c6b);}',
      '.ekv-pulse{width:16px;height:16px;border-radius:50%;margin:26px auto;background:var(--accent,#6b8c6b);transition:transform .25s;}',
      '.ekv-pulse.mentor-speaking{animation:ekvPulse 1s ease-in-out infinite;}',
      '.ekv-pulse.user-speaking{transform:scale(0.7);opacity:0.5;}',
      '@keyframes ekvPulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--accent,#6b8c6b) 40%,transparent);}50%{box-shadow:0 0 0 16px transparent;}}',
      '.ekv-timer{font-family:var(--mono,monospace);font-size:0.78rem;color:var(--text,#d6dcd4);letter-spacing:0.08em;}',
      '.ekv-transcript{max-height:140px;overflow-y:auto;text-align:left;margin:18px 0 6px;font-size:0.78rem;line-height:1.6;color:var(--faint,#7d8a7c);}',
      '.ekv-transcript .m{color:var(--text,#d6dcd4);}',
      '.ekv-err{display:none;color:var(--red,#a85a4a);font-size:0.76rem;line-height:1.6;margin-top:14px;}',
      '.ekv-end{margin-top:22px;background:none;border:1px solid var(--accent,#6b8c6b);color:var(--accent,#6b8c6b);',
      'font-family:var(--mono,monospace);font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;padding:12px 30px;cursor:pointer;transition:background .2s;}',
      '.ekv-end:hover{background:var(--iris-bg,rgba(107,140,107,0.08));}',
      /* disclaimer gate */
      '#ekv-gate{position:fixed;inset:0;z-index:9100;display:none;align-items:center;justify-content:center;background:rgba(4,5,4,0.9);}',
      '#ekv-gate.active{display:flex;}',
      '.ekv-gate-card{width:min(420px,92vw);background:var(--stone,#0c0f0c);border:1px solid var(--border,#1a201a);padding:34px 32px;}',
      '.ekv-gate-card h3{font-family:var(--serif,Georgia,serif);font-weight:300;font-size:1.4rem;color:var(--bright,#eef2ec);margin-bottom:12px;}',
      '.ekv-gate-card p{font-size:0.8rem;line-height:1.65;color:var(--faint,#7d8a7c);margin-bottom:22px;}',
      '.ekv-gate-row{display:flex;gap:12px;justify-content:flex-end;}',
      '.ekv-gate-row button{font-family:var(--mono,monospace);font-size:0.54rem;letter-spacing:0.14em;text-transform:uppercase;padding:11px 22px;cursor:pointer;border:1px solid var(--border,#1a201a);background:none;color:var(--faint,#7d8a7c);}',
      '.ekv-gate-row button.go{border-color:var(--accent,#6b8c6b);color:var(--accent,#6b8c6b);}'
    ].join('');
    document.head.appendChild(s);
  }

  function el(id) { return document.getElementById(id); }

  function injectOverlay() {
    if (el('ekv-overlay')) return;
    var o = document.createElement('div');
    o.id = 'ekv-overlay';
    o.innerHTML =
      '<div class="ekv-card">' +
        '<div class="ekv-label" id="ekv-mentor-label"></div>' +
        '<div class="ekv-title">Voice Session</div>' +
        '<div class="ekv-status" id="ekv-status">Connecting…</div>' +
        '<div class="ekv-pulse" id="ekv-pulse"></div>' +
        '<div class="ekv-timer" id="ekv-timer">0:00</div>' +
        '<div class="ekv-transcript" id="ekv-transcript"></div>' +
        '<div class="ekv-err" id="ekv-err"></div>' +
        '<button class="ekv-end" id="ekv-end">End Session</button>' +
      '</div>';
    document.body.appendChild(o);

    var g = document.createElement('div');
    g.id = 'ekv-gate';
    g.innerHTML =
      '<div class="ekv-gate-card">' +
        '<h3 id="ekv-gate-title">Voice Session</h3>' +
        '<p>This is a live, spoken conversation. Behavioural coaching, not financial advice. ' +
        'Your microphone is used only for this call and audio is not stored by EdgeKeeper.</p>' +
        '<div class="ekv-gate-row">' +
          '<button id="ekv-gate-cancel">Cancel</button>' +
          '<button class="go" id="ekv-gate-go">Start call</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(g);
    el('ekv-gate-cancel').onclick = function () { g.classList.remove('active'); };
  }

  function showGate(opts) {
    injectStyles(); injectOverlay();
    state.opts = opts;
    var name = NAMES[opts.mentor] || 'your mentor';
    el('ekv-gate-title').textContent = 'Voice Session with ' + name;
    el('ekv-gate-go').onclick = function () { el('ekv-gate').classList.remove('active'); openPanel(); connect(); };
    el('ekv-gate').classList.add('active');
  }

  function openPanel() {
    var name = NAMES[state.opts.mentor] || 'Mentor';
    el('ekv-mentor-label').textContent = name + ' · EdgeKeeper';
    setStatus('Connecting…', false);
    el('ekv-err').style.display = 'none';
    el('ekv-transcript').innerHTML = '';
    el('ekv-end').textContent = 'End Session';
    el('ekv-end').onclick = end;
    state.seconds = 0; state.endedByTimeout = false; tick();
    var o = el('ekv-overlay'); o.classList.add('active');
    if (w.gsap) w.gsap.fromTo(o, { opacity: 0 }, { opacity: 1, duration: 0.4 });
  }

  function hidePanel() {
    var o = el('ekv-overlay'); if (o) o.classList.remove('active');
  }

  function setStatus(txt, active) {
    var s = el('ekv-status'); if (!s) return;
    s.textContent = txt; s.className = 'ekv-status' + (active ? ' active' : '');
  }

  function showErr(msg) {
    setStatus('Not connected', false);
    var e = el('ekv-err'); if (e) { e.style.display = 'block'; e.innerHTML = msg; }
    var b = el('ekv-end'); if (b) { b.textContent = 'Close'; b.onclick = hidePanel; }
  }

  function tick() {
    var t = el('ekv-timer'); if (!t) return;
    var m = Math.floor(state.seconds / 60), s = String(state.seconds % 60).padStart(2, '0');
    t.textContent = m + ':' + s;
  }
  function startTimer() { clearInterval(state.timer); state.timer = setInterval(function () { state.seconds++; tick(); }, 1000); }
  function stopTimer() { clearInterval(state.timer); state.timer = null; }

  function appendTranscript(who, txt) {
    var box = el('ekv-transcript'); if (!box) return;
    var line = document.createElement('div');
    if (who === 'mentor') line.className = 'm';
    line.textContent = txt;
    box.appendChild(line); box.scrollTop = box.scrollHeight;
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

    // Mic permission (best-effort; SDK also requests it)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(function (t) { t.stop(); });
      }
    } catch (permErr) {
      showErr('Microphone access is needed for a voice call. Allow it in your browser, then try again.');
      state.phase = 'idle'; return;
    }

    try {
      var res = await fetch('/api/voice/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentor: opts.mentor }),
      });
      if (res.status === 401) { showErr('Sign in to start a voice session.'); state.phase = 'idle'; return; }
      if (res.status === 429) {
        var e429 = await res.json().catch(function () { return {}; });
        showErr((e429.error || 'Monthly voice limit reached.') + ' <a href="/pricing.html" style="color:var(--accent,#6b8c6b);">Upgrade →</a>');
        state.phase = 'idle'; return;
      }
      if (!res.ok) {
        var ebad = await res.json().catch(function () { return {}; });
        showErr(ebad.error || 'Could not start the voice session. Please try again.');
        state.phase = 'idle'; return;
      }
      var body = await res.json();
      var signedUrl = body.signedUrl, serverPrompt = body.prompt, firstMessage = body.firstMessage;

      var ELConv = w.client && w.client.Conversation;
      if (!ELConv || typeof ELConv.startSession !== 'function') {
        showErr('Voice engine failed to load. Refresh the page and try again.');
        state.phase = 'idle'; return;
      }

      var ctx = (typeof opts.getContext === 'function' && opts.getContext()) || '';
      var fullPrompt = [serverPrompt, ctx].filter(Boolean).join('\n\n');
      var override = {};
      if (fullPrompt) override.prompt = { prompt: fullPrompt };
      if (firstMessage) override.first_message = firstMessage;
      var overrides = Object.keys(override).length ? { agent: override } : undefined;

      var cbs = {
        clientTools: opts.clientTools || {},
        onMessage: function (p) {
          var isMentor = p.source === 'ai';
          var clean = stripStageTags(p.message);
          if (clean) appendTranscript(isMentor ? 'mentor' : 'user', clean);
        },
        onModeChange: function (p) {
          var pulse = el('ekv-pulse'); if (!pulse) return;
          if (p.mode === 'speaking') { pulse.className = 'ekv-pulse mentor-speaking'; setStatus((NAMES[opts.mentor] || 'Mentor') + ' speaking', true); }
          else { pulse.className = 'ekv-pulse user-speaking'; setStatus('Listening…', true); }
        },
        onStatusChange: function (p) {
          if (p.status === 'connected') { state.phase = 'active'; setStatus('Live', true); startTimer(); }
        },
        onDisconnect: function () { if (state.phase !== 'ending') { state.endedByTimeout = true; end(); } },
        onError: function (m, c) { console.error('EKVoice error:', m, c); showErr('The voice connection dropped. Please try again.'); state.phase = 'idle'; stopTimer(); },
      };

      try {
        state.conv = await ELConv.startSession(Object.assign({ signedUrl: signedUrl, overrides: overrides }, cbs));
      } catch (ovErr) {
        // Agent may not have overrides enabled — retry prompt-only so the call still connects.
        console.warn('EKVoice: overrides rejected, retrying prompt-only —', ovErr);
        var promptOnly = fullPrompt ? { agent: { prompt: { prompt: fullPrompt } } } : undefined;
        state.conv = await ELConv.startSession(Object.assign({ signedUrl: signedUrl, overrides: promptOnly }, cbs));
      }
    } catch (err) {
      console.error('EKVoice connect:', err);
      showErr('Could not start the voice session. Please refresh and try again.');
      state.phase = 'idle';
    }
  }

  async function end() {
    if (state.phase === 'ending') return;
    state.phase = 'ending';
    stopTimer();
    if (state.conv) { try { await state.conv.endSession(); } catch (_) {} state.conv = null; }
    hidePanel();
    var secs = state.seconds;
    state.phase = 'idle';
    if (state.opts && typeof state.opts.onEnd === 'function') { try { state.opts.onEnd(secs); } catch (_) {} }
  }

  w.EKVoice = {
    start: function (opts) { showGate(opts || {}); },     // opens the disclaimer gate, then connects
    end: end,
    isActive: function () { return state.phase === 'active' || state.phase === 'connecting'; },
  };
})(window);
