/*! assets/js/floater.js — Lightweight floater controller */
(function () {
  'use strict';

  // Utility kecil
  const q = (sel, ctx = document) => ctx.querySelector(sel);
  const toInt = (v, d = 0) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : d;
  };

  // Cari floater di halaman
  const floater = q('.floating-cta') || q('#floater');
  if (!floater) return; // nothing to do

  // Config via data-attributes (fallback ke default)
  const cfg = {
    showAfter: toInt(floater.getAttribute('data-show-after'), 480),
    hideBefore: toInt(floater.getAttribute('data-hide-before'), 120),
    alwaysVisible: (String(floater.getAttribute('data-always-visible') || '').toLowerCase() === 'true'),
    throttleMs: 120
  };

  // Accessibility & interaction defaults
  floater.setAttribute('role', floater.getAttribute('role') || 'complementary');
  if (!floater.hasAttribute('aria-hidden')) floater.setAttribute('aria-hidden', cfg.alwaysVisible ? 'false' : 'true');
  // ensure children are clickable even if root uses pointer-events none in CSS
  floater.style.pointerEvents = floater.style.pointerEvents || '';

  // If requested to be always visible, show now and exit
  if (cfg.alwaysVisible) {
    floater.classList.add('show');
    floater.setAttribute('aria-hidden', 'false');
    // ensure it's painted visible without anim jank:
    floater.style.transition = floater.style.transition || '';
    return;
  }

  // Respect reduced motion (if user prefers reduced motion, we still show/hide but avoid animations)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // optionally we could disable transitions via inline style:
    try { floater.style.transition = 'none'; } catch (e) { /* ignore */ }
  }

  // Throttled scroll handler using rAF + timestamp throttle
  let lastRun = 0;
  let ticking = false;
  function evaluateShowState() {
    const y = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

    if (y > cfg.showAfter && !floater.classList.contains('show')) {
      floater.classList.add('show');
      floater.setAttribute('aria-hidden', 'false');
    } else if (y <= cfg.hideBefore && floater.classList.contains('show')) {
      floater.classList.remove('show');
      floater.setAttribute('aria-hidden', 'true');
    }
  }

  function onScroll() {
    const now = Date.now();
    if (now - lastRun < cfg.throttleMs) {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          evaluateShowState();
          ticking = false;
        });
      }
      return;
    }
    lastRun = now;
    evaluateShowState();
  }

  // Attach event listeners (passive for performance)
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // Run once on init (in case page loaded scrolled)
  evaluateShowState();

  // Optional: protect against other scripts accidentally removing 'show' quickly
  // (lightweight observer that restores the class if removed while scroll suggests it should be visible)
  try {
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && (m.attributeName === 'class' || m.attributeName === 'style')) {
          // compute desired state from current scroll position
          const y = window.scrollY || window.pageYOffset || 0;
          const shouldBeVisible = y > cfg.showAfter;
          const hasShow = floater.classList.contains('show');
          if (shouldBeVisible && !hasShow) {
            floater.classList.add('show');
            floater.setAttribute('aria-hidden', 'false');
          }
        }
      }
    });
    mo.observe(floater, { attributes: true, attributeFilter: ['class', 'style'] });
    // disconnect on unload to avoid leaks
    window.addEventListener('beforeunload', () => mo.disconnect(), { passive: true });
  } catch (err) {
    // MutationObserver mungkin tidak didukung di environment lama — aman diabaikan
  }

  // Expose a tiny API for debugging / manual control
  window.__floater = window.__floater || {};
  window.__floater.show = () => { floater.classList.add('show'); floater.setAttribute('aria-hidden', 'false'); };
  window.__floater.hide = () => { floater.classList.remove('show'); floater.setAttribute('aria-hidden', 'true'); };
  window.__floater.config = cfg;

})();
