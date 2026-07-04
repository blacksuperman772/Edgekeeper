/* EdgeKeeper — first-party analytics beacon.
 * window.ek(event, props) queues an event to POST /api/event. An anonymous
 * session id (ek_sid, localStorage) links a visitor's events; the server adds
 * user_id when a session cookie is present. Auto-fires page_view on load.
 * sendBeacon so events survive navigation; silent no-op on any failure —
 * analytics must never break the product. */
(function () {
  var sid;
  try {
    sid = localStorage.getItem('ek_sid');
    if (!sid) {
      sid = 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('ek_sid', sid);
    }
  } catch (e) { sid = 's_mem_' + Math.random().toString(36).slice(2, 10); }

  window.ek = function (event, props) {
    try {
      var body = JSON.stringify({ event: event, props: props || null, path: location.pathname, sid: sid });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/event', new Blob([body], { type: 'application/json' }));
      } else {
        fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true, credentials: 'include' }).catch(function () {});
      }
    } catch (e) { /* never surface */ }
  };

  window.ek('page_view');
})();
