// Copyright (c) 2026 Osman Bodur. All rights reserved.
// The page of one language, as HTML. build.mjs gives it everything it shows: the translated texts (t, ta), the words
// of Chrome and of the Chrome Web Store in that language (ui), and the store listing of that language (listing).
// TwoTicks is installed from the Chrome Web Store only.

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The two ticks of the logo (white tick behind, blue tick in front), in the coordinates of the 800 px channel picture.
const T1 = '163,416 207,373 302,466 485,251 531,290 305,559';
const T2 = '322,470 365,427 406,466 589,251 635,290 410,559';
export const ticks = (cls) => `<svg class="${cls}" viewBox="150 240 500 330" aria-hidden="true" focusable="false"><polygon class="t1" points="${T1}"/><polygon class="t2" points="${T2}"/></svg>`;
const tile = (cls) => `<svg class="${cls}" viewBox="100 100 600 600" aria-hidden="true" focusable="false"><rect class="tile-bg" x="100" y="100" width="600" height="600"/><polygon class="t1" points="${T1}"/><polygon class="t2" points="${T2}"/></svg>`;

// The flags of the extension's own language menu (i18n.js of TwoTicks: 3:2, square corners, a thin frame; English
// with the British flag, Brazilian Portuguese with Brazil's, Arabic with the flag of the United Arab Emirates), and
// Portugal's for European Portuguese, drawn the same way.
const rows = (a, b, c) => `<rect width="30" height="20" fill="${c}"/><rect width="30" height="13.34" fill="${b}"/><rect width="30" height="6.67" fill="${a}"/>`;
const cols = (a, b, c) => `<rect width="30" height="20" fill="${c}"/><rect width="20" height="20" fill="${b}"/><rect width="10" height="20" fill="${a}"/>`;
const FLAGS = {
  en: '<rect width="30" height="20" fill="#012169"/><path d="M0 0l30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" stroke-width="1.6"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#C8102E" stroke-width="3.6"/>',
  de: rows('#000', '#DD0000', '#FFCE00'),
  es: '<rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/>',
  fr: cols('#0055A4', '#fff', '#EF4135'),
  it: cols('#009246', '#fff', '#CE2B37'),
  'pt-BR': '<rect width="30" height="20" fill="#009C3B"/><path d="M15 2.6L27.4 10 15 17.4 2.6 10z" fill="#FFDF00"/><circle cx="15" cy="10" r="4.1" fill="#002776"/>',
  'pt-PT': '<rect width="30" height="20" fill="#DA291C"/><rect width="12" height="20" fill="#046A38"/><circle cx="12" cy="10" r="3.6" fill="#FFE900"/><circle cx="12" cy="10" r="2.4" fill="#DA291C"/><rect x="11" y="8.4" width="2" height="3" fill="#fff"/>',
  tr: '<rect width="30" height="20" fill="#E30A17"/><circle cx="11" cy="10" r="5" fill="#fff"/><circle cx="12.25" cy="10" r="4" fill="#E30A17"/><path d="M14.7 10l1.73-.56V7.62l1.07 1.47 1.72-.56L18.16 10l1.06 1.47-1.72-.56-1.07 1.47v-1.82z" fill="#fff"/>',
  ru: rows('#fff', '#0039A6', '#D52B1E'),
  ar: '<rect width="30" height="20" fill="#000"/><rect width="30" height="13.34" fill="#fff"/><rect width="30" height="6.67" fill="#009739"/><rect width="7.5" height="20" fill="#EF3340"/>',
  hi: `${rows('#FF9933', '#fff', '#138808')}<circle cx="15" cy="10" r="2.5" fill="none" stroke="#000080" stroke-width=".7"/><circle cx="15" cy="10" r=".6" fill="#000080"/>`,
  id: '<rect width="30" height="20" fill="#fff"/><rect width="30" height="10" fill="#CE1126"/>',
};
const FRAME = '<rect x=".25" y=".25" width="29.5" height="19.5" fill="none" stroke="rgba(0,0,0,.28)" stroke-width=".5"/>';
export const flag = (code) => (FLAGS[code] ? `<svg class="flag" viewBox="0 0 30 20" width="21" height="14" aria-hidden="true" focusable="false">${FLAGS[code]}${FRAME}</svg>` : '');

// Line icons, square ends like the logo.
const icon = (body, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">${body}</svg>`;
const I = {
  store: icon('<path d="M4 9h16l-1 12H5L4 9zM8 9V6a4 4 0 0 1 8 0v3"/>'),
  check: icon('<path d="M4 12l5 5L20 6"/>'),
  play: icon('<path d="M7 4l13 8-13 8V4z" fill="currentColor"/>'),
  puzzle: icon('<path d="M4 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4H4z"/>'),
  pin: icon('<path d="M9 3h6l-1 7 4 4H6l4-4-1-7zM12 14v7"/>'),
  external: icon('<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>'),
  arrowDown: icon('<path d="M12 4v15M6 13l6 6 6-6"/>'),
  chevron: icon('<path d="M6 9l6 6 6-6"/>', 'i chev'),
  restart: icon('<path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v5h5"/>'),
};

export function render(c) {
  const { t, ta, ui, uiAlt, listing, cfg, lang, langs, base } = c;
  const store = t.raw('store.name');
  // A label of Chrome's or of the store's interface, set as a chip; on the Spanish page also the label of Spain's
  // Spanish, which the script shows instead when the browser speaks Spanish of Spain.
  const chip = (key, cls = '') => {
    const alt = uiAlt && uiAlt[key] && uiAlt[key] !== ui[key] ? ` data-es="${esc(uiAlt[key])}"` : '';
    return `<span class="ui${cls ? ` ${cls}` : ''}"${alt}>${esc(ui[key])}</span>`;
  };
  const kbd = (html) => html.replace(/\b(?:Alt|Ctrl|Shift)(?:\+(?:Alt|Ctrl|Shift|[A-Z]))+/g, (m) => m.split('+').map((k) => `<kbd>${k}</kbd>`).join('+'));
  const linkMail = (html) => html.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/g, (m) => `<a href="mailto:${m}">${m}</a>`);
  const addTitle = (s) => s.replace('$1', cfg.name);
  const vars = {
    name: esc(cfg.name), minChrome: String(cfg.minChrome), store: esc(store),
    addToChrome: chip('addToChrome', 'ui-blue'), addExtension: chip('addExtension', 'ui-blue'),
    addTitle: `<span class="ui"${uiAlt && uiAlt.addTitle !== ui.addTitle ? ` data-es="${esc(addTitle(uiAlt.addTitle))}"` : ''}>${esc(addTitle(ui.addTitle))}</span>`,
    pin: chip('pin'), remove: chip('remove'), removeFromChrome: chip('removeFromChrome'),
    address: '<code class="addr-inline" data-addr>chrome://extensions</code>',
    publisher: `<b>${esc(cfg.publisher)}</b>`, duration: esc(c.durationText),
  };
  const T = (key, extra) => t(key, { ...vars, ...extra });
  const newTab = `<span class="vh"> ${t('a11y.newTab')}</span>`;
  const rtl = lang.dir === 'rtl';
  // The store's page in the page's language, tagged so that the store's own statistics (and the Google Analytics
  // property the Chrome Web Store keeps for TwoTicks) show visits and installs that came from this site, by language
  // and by button. The site itself measures nothing.
  const storeLink = (place) => `${cfg.storeUrl}?hl=${lang.code}&utm_source=${encodeURIComponent(new URL(cfg.siteUrl).host)}&utm_medium=website&utm_campaign=site&utm_content=${place}-${lang.code.toLowerCase()}`;

  const langList = (cls) => `<ul class="${cls}">${langs.map((l) => `<li><a href="${base}${l.path}" hreflang="${l.code}" lang="${l.code}" data-lang="${l.code}"${l.code === lang.code ? ' aria-current="page"' : ''}>${flag(l.code)}<span>${esc(l.native)}</span></a></li>`).join('')}</ul>`;

  // The four steps. Every step: a mark (the ticks), the text, its own action and a picture of what Chrome shows.
  const steps = [
    {
      body: `<p>${T('step1.text')}</p>
        <div class="actions">
          <a class="btn btn-store" href="${esc(storeLink('step1'))}" target="_blank" rel="noopener" data-complete="1">${I.store}<span>${T('step1.button')}</span>${newTab}</a>
          ${doneBtn(1)}
        </div>`,
      fig: `<div class="mock mock-store">
          <div class="g-stripe"></div>
          <div class="ms-bar"><span class="ms-name">${esc(store)}</span><span class="ms-search"></span></div>
          <div class="ms-item">
            ${tile('logo-tile')}
            <span class="ms-text"><b>${esc(cfg.name)}</b><i></i></span>
            <span class="ms-add hl">${esc(ui.addToChrome)}</span>
          </div>
        </div>`,
    },
    {
      body: `<p>${T('step2.text')}</p>
        <div class="actions">${doneBtn(2)}</div>`,
      fig: `<div class="mock mock-dialog">
          <div class="md-box">
            <p class="md-title">${tile('logo-tile')}<span>${esc(addTitle(ui.addTitle))}</span></p>
            <p class="md-lines"><i></i><i></i></p>
            <p class="md-actions"><span class="md-btn">${esc(ui.cancel)}</span><span class="md-btn md-primary hl">${esc(ui.addExtension)}</span></p>
          </div>
        </div>`,
    },
    {
      body: `<p>${T('step3.text')}</p>
        <div class="actions">${doneBtn(3)}</div>`,
      fig: `<div class="mock mock-browser">
          <div class="mb-bar"><span class="mb-omni">web.whatsapp.com</span><span class="mb-ext hl">${I.puzzle}</span></div>
          <div class="mt-menu">
            <p class="mt-head">${esc(ui.extensionsMenu)}</p>
            <p class="mt-row">${tile('logo-tile')}<span>${esc(cfg.name)}</span><span class="mt-pin hl" title="${esc(ui.pin)}">${I.pin}</span></p>
          </div>
        </div>`,
    },
    {
      body: `<p>${kbd(esc(listing.howto[0]))} ${kbd(esc(listing.howto[1]))}</p>
        <div class="actions">
          <a class="btn btn-solid" href="https://web.whatsapp.com/" target="_blank" rel="noopener" data-complete="4">${I.external}<span>${T('step4.button')}</span>${newTab}</a>
          ${doneBtn(4)}
        </div>`,
      fig: `<div class="mock mock-browser">
          <div class="mb-bar"><span class="mb-omni">web.whatsapp.com</span><span class="mb-ext">${I.puzzle}</span></div>
          <div class="mb-page mb-wa">
            <div class="wa-list"><i></i><i></i><i></i><i></i><i></i></div>
            <div class="wa-chat"><i></i><i></i><i></i></div>
            <span class="wa-fab hl">${ticks('fab-ticks')}</span>
          </div>
          <p class="mb-keys"><kbd>Alt</kbd><kbd>Shift</kbd><kbd>H</kbd></p>
        </div>`,
    },
  ];

  function doneBtn(n) {
    return `<button type="button" class="btn btn-line done-btn" data-step="${n}" aria-pressed="false" hidden>${I.check}<span>${T('install.markDone')}</span></button>`;
  }

  const stateLabels = { todo: t.raw('install.stateTodo'), next: t.raw('install.stateNext'), done: t.raw('install.stateDone') };
  const stepItems = steps.map((s, i) => {
    const n = i + 1;
    const state = n === 1 ? 'next' : 'todo';
    return `<li class="step" id="step-${n}" data-step="${n}" data-state="${state}">
      <span class="mark" aria-hidden="true">${ticks('mark-ticks')}</span>
      <div class="step-main">
        <h3 class="step-title"><span class="step-no" aria-hidden="true">${n}</span><span class="vh" data-state-label>${esc(stateLabels[state])}: </span>${T(`step${n}.title`)}</h3>
        ${s.body}
      </div>
      <figure class="step-fig" aria-hidden="true">${s.fig}</figure>
    </li>`;
  }).join('\n');

  // The tools of the store listing, in its three groups; each links to its film.
  const groups = ['privacy', 'productivity', 'files'].map((g) => {
    const items = listing[g].map((it, i) => {
      const film = cfg.films[g][i];
      const link = film ? `<a class="film-link" href="https://youtu.be/${film}">${I.play}<span>${T('features.film')}</span><span class="vh">: ${esc(it.name)}</span></a>` : '';
      return `<li><h4 class="tool-name">${esc(it.name)}</h4><p>${kbd(esc(it.sentence))}</p>${link}</li>`;
    }).join('');
    return `<section class="group" aria-labelledby="g-${g}"><h3 id="g-${g}">${T(`features.group.${g}`)}</h3><ul class="tools">${items}</ul></section>`;
  }).join('\n');

  const shots = cfg.shots.map((s, i) => {
    const tool = listing[s.group][s.index].name;
    const alt = ta(s.alt, { tool });
    const src = (w, f) => `${base}assets/img/${s.file}-${w}.${f}`;
    return `<figure class="shot">
        <picture>
          <source type="image/avif" srcset="${src(640, 'avif')} 640w, ${src(1280, 'avif')} 1280w" sizes="(min-width: 980px) 720px, 86vw" width="1280" height="800">
          <img src="${src(1280, 'webp')}" srcset="${src(640, 'webp')} 640w, ${src(1280, 'webp')} 1280w" sizes="(min-width: 980px) 720px, 86vw" width="1280" height="800" alt="${alt}" loading="lazy" decoding="async">
        </picture>
        <figcaption><span class="shot-no" aria-hidden="true">${i + 1}/${cfg.shots.length}</span>${esc(tool)}</figcaption>
      </figure>`;
  }).join('\n');

  const faq = [
    ['faq.free.q', `<p>${kbd(esc(listing.price))}</p>`],
    ['faq.privacy.q', `<p>${esc(listing.privacy[1].name)}: ${esc(listing.privacy[1].text)}</p><p>${esc(listing.privacy[2].name)}: ${esc(listing.privacy[2].text)}</p><p><a href="${esc(cfg.privacyUrl)}" hreflang="en">${T('faq.privacy.link')}</a></p>`],
    ['faq.permissions.q', `<ul>${listing.permissions.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`],
    ['faq.update.q', `<p>${T('faq.update.a')}</p>`],
    ['faq.browsers.q', `<p>${T('faq.browsers.a')}</p>`],
    ['faq.blocked.q', `<p>${T('faq.blocked.a')}</p>`],
    ['faq.remove.q', `<p>${T('faq.remove.a')}</p>`],
  ].map(([q, a]) => `<details><summary>${I.chevron}<span>${T(q)}</span></summary><div class="answer">${a}</div></details>`).join('\n');

  const alternates = langs.map((l) => `<link rel="alternate" hreflang="${l.code}" href="${cfg.siteUrl}${l.path}">`).join('\n');
  const ogAlternates = langs.filter((l) => l.code !== lang.code).map((l) => `<meta property="og:locale:alternate" content="${l.og}">`).join('\n');
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: cfg.name, applicationCategory: 'BrowserApplication',
    operatingSystem: 'Windows, macOS, Linux, ChromeOS', browserRequirements: `Google Chrome ${cfg.minChrome} or newer`,
    installUrl: cfg.storeUrl, url: `${cfg.siteUrl}${lang.path}`, inLanguage: lang.code,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, author: { '@type': 'Person', name: cfg.publisher },
  }).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="${lang.code}" dir="${rtl ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${c.csp}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${ta('meta.title', { name: cfg.name })}</title>
<meta name="description" content="${ta('meta.description')}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#16232d">
<link rel="canonical" href="${cfg.siteUrl}${lang.path}">
${alternates}
<link rel="alternate" hreflang="x-default" href="${cfg.siteUrl}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="TwoTicks">
<meta property="og:title" content="${ta('meta.title', { name: cfg.name })}">
<meta property="og:description" content="${ta('meta.description')}">
<meta property="og:url" content="${cfg.siteUrl}${lang.path}">
<meta property="og:image" content="${cfg.siteUrl}assets/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(cfg.name)}">
<meta property="og:locale" content="${lang.og}">
${ogAlternates}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}assets/img/icon.svg" type="image/svg+xml">
<link rel="icon" href="${base}assets/img/icon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${base}assets/img/icon-180.png">
${c.preloads}
<link rel="stylesheet" href="${base}${c.css}">
${c.redirect ? `<script>${c.redirect}</script>` : ''}
<script src="${base}${c.js}" defer></script>
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
<a class="skip" href="#install">${T('nav.skip')}</a>
<header class="masthead">
  <div class="wrap mast-in">
    <a class="brand" href="${base}${lang.path}">${tile('logo-tile')}<span>TwoTicks</span></a>
    <nav class="nav" aria-label="${ta('nav.label')}">
      <ul>
        <li><a href="#install">${T('nav.install')}</a></li>
        <li><a href="#features">${T('nav.features')}</a></li>
        <li><a href="#faq">${T('nav.faq')}</a></li>
      </ul>
    </nav>
    <div class="lang">
      <button type="button" class="lang-btn" popovertarget="lang-menu" aria-label="${ta('nav.language')}: ${esc(lang.native)}">${flag(lang.code)}<span>${esc(lang.native)}</span>${I.chevron}</button>
      <div id="lang-menu" class="lang-menu" popover>${langList('lang-list')}</div>
    </div>
  </div>
</header>

<main id="main">
  <section class="hero" aria-labelledby="hero-title">
    <div class="wrap hero-in">
      <div class="hero-text">
        <h1 id="hero-title" class="wordmark"><span class="word">TwoTicks</span><span class="slogan" lang="en">for WApp-Web</span></h1>
        <p class="lead">${esc(listing.intro)}</p>
        <div class="cta">
          <a class="btn btn-hero btn-store" href="${esc(storeLink('hero'))}" target="_blank" rel="noopener" data-complete="1">
            ${I.store}<span class="btn-two"><span class="btn-label">${T('hero.cta')}</span><span class="btn-meta">${T('hero.ctaMeta')}</span></span>${newTab}
          </a>
          <a class="btn btn-hero btn-hero-alt" href="#features">${I.arrowDown}<span class="btn-label">${T('hero.tools')}</span></a>
        </div>
        <p class="hero-note">${T('hero.note')}</p>
      </div>
    </div>
    <div class="hero-art" aria-hidden="true">${ticks('hero-ticks')}</div>
  </section>

  <section id="install" class="install" aria-labelledby="install-title">
    <div class="wrap">
      <header class="sec-head">
        <h2 id="install-title">${T('install.title')}</h2>
        <p class="sec-intro">${T('install.intro')}</p>
        <p class="notice" data-notice hidden data-min="${cfg.minChrome}"
          data-old-chrome="${ta('notice.oldChrome', { version: '{version}', minChrome: String(cfg.minChrome) })}"
          data-other="${ta('notice.otherChromium', { browser: '{browser}', store })}"
          data-not-chromium="${ta('notice.notChromium')}"
          data-mobile="${ta('notice.mobile')}"></p>
        <p class="progress" data-progress="${ta('install.progress', { done: '{done}' })}" aria-live="polite" hidden></p>
      </header>
      <ol class="steps" data-state-todo="${esc(stateLabels.todo)}" data-state-next="${esc(stateLabels.next)}" data-state-done="${esc(stateLabels.done)}">
${stepItems}
      </ol>
      <div class="all-done" data-all-done hidden>
        <span class="mark mark-big" aria-hidden="true">${ticks('mark-ticks')}</span>
        <p role="status">${T('install.allDone')}</p>
        <button type="button" class="btn btn-line" data-reset>${I.restart}<span>${T('install.reset')}</span></button>
      </div>
    </div>
  </section>

  <section id="features" class="features" aria-labelledby="features-title">
    <div class="wrap">
      <header class="sec-head"><h2 id="features-title">${T('features.title')}</h2></header>
      <div class="shots" role="region" aria-label="${ta('features.shots')}" tabindex="0">
${shots}
      </div>
      <div class="groups">
${groups}
      </div>
      <p class="langs-line"><b>${esc(listing.languages.name)}:</b> ${esc(listing.languages.text)}</p>
      <div class="film">
        <a class="film-play" href="https://youtu.be/${cfg.youtube.film}" data-film="${cfg.youtube.film}" data-hl="${lang.code}" data-title="${esc(cfg.youtube.filmTitle)}">
          <span class="film-art" aria-hidden="true">${ticks('film-ticks')}</span>
          <span class="film-text">
            <span class="film-kicker">${T('video.title')}</span>
            <span class="film-title" lang="en">${esc(cfg.youtube.filmTitle)}</span>
            <span class="film-meta">${T('video.meta')}</span>
          </span>
          <span class="film-btn">${I.play}<span>${T('video.play')}</span></span>
        </a>
        <p class="film-note">${T('video.note')} <a href="${esc(cfg.youtube.channel)}">${T('video.channel')}</a></p>
      </div>
    </div>
  </section>

  <section id="faq" class="faq" aria-labelledby="faq-title">
    <div class="wrap narrow">
      <h2 id="faq-title">${T('faq.title')}</h2>
${faq}
    </div>
  </section>
</main>

<footer class="footer">
  <div class="wrap foot-in">
    <div class="foot-brand">${tile('logo-tile')}<p><b>TwoTicks</b> <span lang="en">for WApp-Web</span></p></div>
    <div class="foot-text">
      <p>${T('footer.publisher')}</p>
      <p>${linkMail(esc(listing.support[0]))}</p>
      <p>${esc(listing.support[1])}</p>
      <p>${esc(listing.disclaimer)}</p>
      <p>${T('footer.page')}</p>
      <p>${esc(cfg.copyright)} ${T('footer.rights')}</p>
    </div>
    <nav class="foot-links" aria-label="TwoTicks">
      <ul>
        <li><a href="${esc(storeLink('footer'))}">${T('store.name')}</a></li>
        <li><a href="${esc(cfg.privacyUrl)}" hreflang="en">${T('footer.privacy')}</a></li>
        <li><a href="${esc(cfg.youtube.channel)}">YouTube</a></li>
      </ul>
    </nav>
    <nav class="foot-langs" aria-label="${ta('footer.languages')}">
      <p class="foot-k">${T('footer.languages')}</p>
      ${langList('foot-lang-list')}
    </nav>
  </div>
</footer>
</body>
</html>
`;
}
