// TwoTicks site. Copyright (c) 2026 Osman Bodur. All rights reserved.
// The page works without this script; the script adds: the ticks of the install steps (remembered in this
// browser), the notice for other browsers, Chrome's words of Spain on the Spanish page, the language menu where
// popovers are missing, the remembered language, and the film, which loads from YouTube only on a click.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked: nothing is remembered */ } },
  };

  // --- the install steps: to do (one grey tick), next (two grey ticks), done (two blue ticks) ---
  const list = $('.steps');
  const steps = list ? $$('.step', list) : [];
  const progress = $('[data-progress]');
  const allDone = $('[data-all-done]');
  const KEY = 'tt-steps';
  let done = new Set();
  try {
    done = new Set(JSON.parse(store.get(KEY) || '[]').filter((n) => Number.isInteger(n) && n >= 1 && n <= steps.length));
  } catch { /* unreadable: start empty */ }
  const save = () => store.set(KEY, JSON.stringify([...done].sort()));
  function paint() {
    if (!list) return;
    const labels = { todo: list.dataset.stateTodo, next: list.dataset.stateNext, done: list.dataset.stateDone };
    const next = steps.find((s) => !done.has(Number(s.dataset.step)));
    for (const s of steps) {
      const n = Number(s.dataset.step);
      const state = done.has(n) ? 'done' : s === next ? 'next' : 'todo';
      s.dataset.state = state;
      const label = $('[data-state-label]', s);
      if (label) label.textContent = `${labels[state]}: `;
      const btn = $('.done-btn', s);
      if (btn) btn.setAttribute('aria-pressed', String(done.has(n)));
    }
    if (progress) {
      progress.textContent = progress.dataset.progress.replace('{done}', String(done.size));
      progress.hidden = false;
    }
    if (allDone) allDone.hidden = done.size < steps.length;
  }
  for (const b of $$('.done-btn')) b.hidden = false;
  paint();

  // --- one listener for the page's clicks ---
  document.addEventListener('click', (e) => {
    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    const toggle = t.closest('.done-btn');
    if (toggle) {
      const n = Number(toggle.dataset.step);
      if (done.has(n)) done.delete(n); else done.add(n);
      save();
      paint();
      return;
    }
    const complete = t.closest('[data-complete]');
    if (complete) {
      done.add(Number(complete.dataset.complete));
      save();
      paint();
      return;
    }
    if (t.closest('[data-reset]')) {
      done.clear();
      save();
      paint();
      const title = $('#step-1 .step-title');
      if (title) {
        title.tabIndex = -1;
        title.focus();
        title.addEventListener('blur', () => title.removeAttribute('tabindex'), { once: true });
      }
      return;
    }
    const lang = t.closest('a[data-lang]');
    if (lang) {
      store.set('tt-lang', lang.dataset.lang);
      return;
    }
    const film = t.closest('.film-play');
    if (film && e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      const frame = document.createElement('iframe');
      frame.className = 'film-frame';
      frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(film.dataset.film)}?autoplay=1&rel=0&hl=${encodeURIComponent(film.dataset.hl)}`;
      frame.title = film.dataset.title;
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      film.replaceWith(frame);
      frame.focus();
    }
  });

  // --- the visitor's browser ---
  const ua = navigator.userAgent;
  const uad = navigator.userAgentData;
  const brands = ((uad && uad.brands) || []).map((b) => b.brand);
  const mobile = uad ? uad.mobile : /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  let kind = 'chrome';
  let name = '';
  let address = 'chrome://extensions';
  if (/Edg\//.test(ua) || brands.includes('Microsoft Edge')) { kind = 'other'; name = 'Microsoft Edge'; address = 'edge://extensions'; }
  else if (/OPR\//.test(ua) || brands.includes('Opera')) { kind = 'other'; name = 'Opera'; address = 'opera://extensions'; }
  else if (navigator.brave) { kind = 'other'; name = 'Brave'; address = 'brave://extensions'; }
  else if (/Vivaldi/.test(ua) || brands.includes('Vivaldi')) { kind = 'other'; name = 'Vivaldi'; address = 'vivaldi://extensions'; }
  else if (/Firefox\//.test(ua) || (/Safari\//.test(ua) && !/Chrom(e|ium)\//.test(ua))) kind = 'none';
  const version = Number((ua.match(/Chrom(?:e|ium)\/(\d+)/) || [])[1] || 0);
  const notice = $('[data-notice]');
  if (notice) {
    let message = '';
    if (mobile) message = notice.dataset.mobile;
    else if (kind === 'none') message = notice.dataset.notChromium;
    else if (kind === 'other') message = notice.dataset.other.replace('{browser}', name);
    else if (version && version < Number(notice.dataset.min)) message = notice.dataset.oldChrome.replace('{version}', String(version));
    if (message) {
      notice.textContent = message;
      notice.hidden = false;
    }
  }
  if (kind === 'other') for (const el of $$('[data-addr]')) el.textContent = address;

  // --- Spanish: Chrome and its store word some buttons differently in Spain and in Latin America ---
  if (document.documentElement.lang === 'es' && /^es(-es)?$/i.test(navigator.language || '')) {
    for (const el of $$('[data-es]')) el.textContent = el.dataset.es;
  }

  // --- the language menu where the browser has no popovers ---
  const langBtn = $('.lang-btn');
  const menu = $('#lang-menu');
  if (langBtn && menu && !Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'popover')) {
    menu.removeAttribute('popover');
    menu.classList.add('is-fallback');
    menu.hidden = true;
    langBtn.setAttribute('aria-expanded', 'false');
    langBtn.setAttribute('aria-controls', 'lang-menu');
    langBtn.addEventListener('click', () => {
      menu.hidden = !menu.hidden;
      langBtn.setAttribute('aria-expanded', String(!menu.hidden));
    });
  }
})();
