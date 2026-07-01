/* EdgeKeeper — pillar switcher behaviour.
 * Records the current space in an `ek_last_space` cookie so returning users land
 * back where they left off (read server-side by lastSpacePath), and highlights
 * the active pill. Path-based, so it needs no per-page configuration. Safe to load
 * on any page — it no-ops when the page isn't one of the three spaces. */
(function () {
  var p = location.pathname, space = null;
  if (/\/(workspace|office)(\.html)?$/.test(p) || p === '/marcus') space = 'marcus';
  else if (/\/(my-academy|academy|study)(\.html)?$/.test(p)) space = 'theo';
  else if (/\/chamber(\.html)?$/.test(p) || p === '/iris') space = 'iris';
  if (!space) return;

  try {
    document.cookie = 'ek_last_space=' + space + ';path=/;max-age=31536000;SameSite=Lax';
  } catch (e) { /* cookies disabled — routing just falls back to the office */ }

  function mark() {
    var els = document.querySelectorAll('.ek-pillar[data-space="' + space + '"]');
    for (var i = 0; i < els.length; i++) els[i].classList.add('active');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mark);
  else mark();
})();
