/* EdgeKeeper — reveal safety net.
 * Pages fade content in with `.reveal { opacity: 0 }` + a per-page
 * IntersectionObserver that adds `.in` on scroll. That observer does not fire
 * reliably in every mobile webview, which leaves whole sections invisible — a
 * header followed by a blank void. This is a backstop: content must never stay
 * hidden because an animation didn't run.
 *
 * - No IntersectionObserver support -> reveal everything at once.
 * - Otherwise -> let the page's own observer play the scroll animation, then a
 *   short while after load reveal anything still hidden. Below-the-fold items get
 *   revealed off-screen, so the entrance animation for the first screen is kept
 *   while guaranteeing nothing is ever permanently invisible. */
(function () {
  function revealAll() {
    var els = document.querySelectorAll('.reveal');
    for (var i = 0; i < els.length; i++) els[i].classList.add('in');
  }
  if (!('IntersectionObserver' in window)) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', revealAll);
    } else {
      revealAll();
    }
    return;
  }
  function net() { setTimeout(revealAll, 1500); }
  if (document.readyState === 'complete') net();
  else window.addEventListener('load', net);
})();
