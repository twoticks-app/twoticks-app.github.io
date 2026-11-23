// Copyright (c) 2026 Osman Bodur. All rights reserved.
// The pages of one language, as HTML: the home page (render), the page of each tool (renderTool), the version history
// (renderVersions) and the page of the optional program for AI programs, TwoTicks MCP (renderMcp), around one shell
// (head, masthead, footer); the privacy policy (renderPrivacy) in English and its translations. build.mjs gives them
// everything they show: the site's texts (t, ta), the words of Chrome and of the Chrome Web Store in that language
// (ui), the store listing (listing) and the panel's own texts (panel). TwoTicks is installed from the Chrome Web
// Store only.

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
  steps: icon('<path d="M4 6h3M4 12h3M4 18h3M10 6h10M10 12h10M10 18h10"/>'),
  chevron: icon('<path d="M6 9l6 6 6-6"/>', 'i chev'),
  restart: icon('<path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v5h5"/>'),
  copy: icon('<path d="M9 9h11v11H9zM5 15H4V4h11v1"/>'),
  arrow: icon('<path d="M4 12h15M13 6l6 6-6 6"/>', 'i arrow'),
};

// Key combinations, kept on one line.
const keys = (combo) => `<span class="keys">${combo.split('+').map((k) => `<kbd>${k}</kbd>`).join('+')}</span>`;
const kbd = (html) => html.replace(/\b(?:Alt|Ctrl|Shift)(?:\+(?:Alt|Ctrl|Shift|[A-Z]))+/g, keys);
const linkMail = (html) => html.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/g, (m) => `<a href="mailto:${m}">${m}</a>`);
// Braces that people type (the "{Name}" of quick replies) are written as character references, and such a word
// keeps its own direction inside Arabic text.
const braces = (html) => html
  .replace(/\{([^{}<>]{1,40})\}/g, '<bdi>&#123;$1&#125;</bdi>')
  .replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
const minSec = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const cut = (s, n) => {
  if (s.length <= n) return s;
  const at = s.lastIndexOf(' ', n - 1);
  return `${s.slice(0, at > n / 2 ? at : n - 1).replace(/[\s,;:.]+$/, '')}…`;
};

// What both kinds of page share: words, links and the shell around the main content.
function common(c) {
  const { t, ta, ui, uiAlt, cfg, lang, base } = c;
  const store = t.raw('store.name');
  const chip = (key, cls = '') => {
    const alt = uiAlt && uiAlt[key] && uiAlt[key] !== ui[key] ? ` data-es="${esc(uiAlt[key])}"` : '';
    return `<span class="ui${cls ? ` ${cls}` : ''}"${alt}>${esc(ui[key])}</span>`;
  };
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
  // The store's page in the page's language, tagged so that the store's statistics (and the Google Analytics property
  // the Chrome Web Store keeps for TwoTicks) show visits and installs from this site, by language and button.
  const storeLink = (place) => `${cfg.storeUrl}?hl=${lang.code}&utm_source=${encodeURIComponent(new URL(cfg.siteUrl).host)}&utm_medium=website&utm_campaign=site&utm_content=${place}-${lang.code.toLowerCase()}`;
  const home = `${base}${lang.path}`;
  const newTab = `<span class="vh"> ${t('a11y.newTab')}</span>`;
  return { store, chip, addTitle, vars, T, storeLink, home, newTab, ta };
}

// The poster of a film: its own YouTube thumbnail, served by the site (tools/film-frames.py), so that nothing loads
// from YouTube before a click.
function poster(c, id, sizes) {
  // Films shown large have their poster in 640 and 1280 pixels, films shown small in a list only in 640.
  const widths = c.bigFrames.has(id) ? [640, 1280] : [640];
  const src = (w, f) => `${c.base}assets/img/film-${id}-${w}.${f}`;
  const set = (f) => widths.map((w) => `${src(w, f)} ${w}w`).join(', ');
  return `<picture>
            <source type="image/avif" srcset="${set('avif')}" sizes="${sizes}" width="1280" height="720">
            <img src="${src(widths[widths.length - 1], 'webp')}" srcset="${set('webp')}" sizes="${sizes}" width="1280" height="720" alt="" loading="lazy" decoding="async">
          </picture>`;
}

// A film as this page shows it: where the page's language has the same film made in it (content/films-i18n.json), that
// film, with its own YouTube id, title and length ("local"); otherwise the English film, its title marked as English.
function loc(c, film) {
  const f = c.films && c.films[film.id];
  return f ? { ...film, id: f.id, title: f.title, seconds: f.seconds, local: true } : film;
}
const enLang = (film) => (film.local ? '' : ' lang="en"');
// The line under a film: its length and language ("in English", or the page's own language for a local film).
const filmMeta = (x, film) => x.T(film.local ? 'video.metaLocal' : 'video.meta', { duration: esc(minSec(film.seconds)) });

// Further films, each a small poster beside its title and length; they open on YouTube.
function alsoItems(c, x, films) {
  return films.map((f0) => {
    const f = loc(c, f0);
    return `<li><a class="also-link" href="https://youtu.be/${f.id}">${c.frames.has(f.id) ? poster(c, f.id, '144px') : ''}<span><span class="also-name"${enLang(f)}>${esc(f.title)}</span><span class="also-meta">${filmMeta(x, f)}</span></span></a></li>`;
  }).join('');
}

// A film: the poster with a play button; a click puts YouTube's player in its place (src/app.js). Where a film has
// no poster yet, the ticks and its title stand in. The caption stays below the player. `film` is as loc() gives it.
function filmFig(c, x, film, caption, sizes) {
  const art = c.frames.has(film.id)
    ? poster(c, film.id, sizes)
    : `<span class="film-art" aria-hidden="true">${ticks('film-ticks')}</span><span class="film-stand"${enLang(film)} aria-hidden="true">${esc(film.title)}</span>`;
  return `<figure class="film-fig">
        <a class="film-play" href="https://youtu.be/${film.id}" data-film="${film.id}" data-hl="${c.lang.code}" data-title="${esc(film.title)}">
          ${art}
          <span class="film-btn">${I.play}<span class="vh">${x.T('video.play')}: <span${enLang(film)}>${esc(film.title)}</span></span></span>
        </a>
        <figcaption class="film-cap">${caption}</figcaption>
      </figure>`;
}

function shot(c, x, s, sizes = '(min-width: 980px) 720px, 86vw') {
  const tool = c.listing[s.group][s.index].name;
  // In the page's language where the store has the screenshot in it (build.mjs: shotLang), else in English.
  const file = c.shotLang ? `${s.file}-${c.shotLang}` : s.file;
  const src = (w, f) => `${c.base}assets/img/${file}-${w}.${f}`;
  return `<picture>
          <source type="image/avif" srcset="${src(640, 'avif')} 640w, ${src(1280, 'avif')} 1280w" sizes="${sizes}" width="1280" height="800">
          <img src="${src(1280, 'webp')}" srcset="${src(640, 'webp')} 640w, ${src(1280, 'webp')} 1280w" sizes="${sizes}" width="1280" height="800" alt="${x.ta(s.alt, { tool })}" loading="lazy" decoding="async">
        </picture>`;
}

// The whole document: head, masthead, the page's main content, footer. `page` gives the parts that differ. A page in
// some languages only (page.langs, their codes: the privacy policy) names only those as its other versions, and its
// language lists lead the other languages to their home page; a page in one language names none, and its language
// lists have the heading page.langsLabel.
function shell(c, x, page) {
  const { cfg, lang, langs, base } = c;
  const rtl = lang.dir === 'rtl';
  const has = (l) => !page.langs || page.langs.includes(l.code);
  const several = !page.langs || page.langs.length > 1;
  const relOf = (l) => (has(l) ? page.rel : '');
  const langList = (cls) => `<ul class="${cls}">${langs.map((l) => `<li><a href="${base}${l.path}${relOf(l)}" hreflang="${l.code}" lang="${l.code}" data-lang="${l.code}"${l.code === lang.code ? ' aria-current="page"' : ''}>${flag(l.code)}<span>${esc(l.native)}</span></a></li>`).join('')}</ul>`;
  const url = (l) => `${cfg.siteUrl}${l.path}${page.rel}`;
  const alternates = several ? `${langs.filter(has).map((l) => `<link rel="alternate" hreflang="${l.code}" href="${url(l)}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${cfg.siteUrl}${page.rel}">
` : '';
  const ogAlternates = several ? `${langs.filter((l) => has(l) && l.code !== lang.code).map((l) => `<meta property="og:locale:alternate" content="${l.og}">`).join('\n')}
` : '';
  const langsLabel = page.langsLabel ? esc(page.langsLabel) : x.T('footer.languages');
  const nav = (hash) => (page.rel ? `${x.home}#${hash}` : `#${hash}`);
  return `<!doctype html>
<html lang="${lang.code}" dir="${rtl ? 'rtl' : 'ltr'}" data-page="${page.rel}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${c.csp}">
<meta name="referrer" content="strict-origin-when-cross-origin">
${cfg.googleSiteVerification ? `<meta name="google-site-verification" content="${esc(cfg.googleSiteVerification)}">\n` : ''}<title>${page.title}</title>
<meta name="description" content="${page.description}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#16232d">
<link rel="canonical" href="${url(lang)}">
${alternates}<meta property="og:type" content="website">
<meta property="og:site_name" content="TwoTicks">
<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${page.description}">
<meta property="og:url" content="${url(lang)}">
<meta property="og:image" content="${cfg.siteUrl}${c.ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(cfg.name)}">
<meta property="og:locale" content="${lang.og}">
${ogAlternates}<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}assets/img/icon.svg" type="image/svg+xml">
<link rel="icon" href="${base}assets/img/icon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${base}assets/img/icon-180.png">
${c.preloads}
<link rel="stylesheet" href="${base}${c.css}">
${c.redirect ? `<script>${c.redirect}</script>` : ''}
<script src="${base}${c.js}" defer></script>
<script type="application/ld+json">${JSON.stringify(page.jsonLd).replace(/</g, '\\u003c')}</script>
</head>
<body>
<a class="skip" href="${page.skip}">${x.T(page.rel ? 'nav.skipMain' : 'nav.skip')}</a>
<header class="masthead">
  <div class="wrap mast-in">
    <a class="brand" href="${x.home}">${tile('logo-tile')}<span>TwoTicks</span></a>
    <nav class="nav" aria-label="${x.ta('nav.label')}">
      <ul>
        <li><a href="${nav('install')}">${x.T('nav.install')}</a></li>
        <li><a href="${nav('features')}">${x.T('nav.features')}</a></li>
        <li><a href="${nav('faq')}">${x.T('nav.faq')}</a></li>${c.hasMcp ? `
        <li><a href="${x.home}mcp/"${page.place === 'mcp' ? ' aria-current="page"' : ''}>MCP</a></li>` : ''}
      </ul>
    </nav>
    <div class="lang">
      <button type="button" class="lang-btn" popovertarget="lang-menu" aria-label="${x.ta('nav.language')}: ${esc(lang.native)}">${flag(lang.code)}<span>${esc(lang.native)}</span>${I.chevron}</button>
      <div id="lang-menu" class="lang-menu" popover>${langList('lang-list')}</div>
    </div>
  </div>
</header>

<main id="main">
${page.main}
</main>

<footer class="footer">
  <div class="wrap foot-in">
    <div class="foot-brand">${tile('logo-tile')}<p><b>TwoTicks</b> <span lang="en">for WApp-Web</span></p></div>
    <div class="foot-text">
      <p>${x.T('footer.publisher')}</p>
      <p>${linkMail(esc(c.listing.support[0]))}</p>
      <p>${esc(c.listing.support[1])}</p>
      <p>${esc(c.listing.disclaimer)}</p>
      <p>${x.T('footer.page')}</p>
      <p>${esc(cfg.copyright)} ${x.T('footer.rights')}</p>
    </div>
    <nav class="foot-links" aria-label="TwoTicks">
      <ul>
        <li><a href="${esc(x.storeLink(page.place || 'footer'))}">${x.T('store.name')}</a></li>
        ${c.hasVersions ? `<li><a href="${x.home}versions/">${x.T('versions.title')}</a></li>` : ''}
        ${c.hasMcp ? `<li><a href="${x.home}mcp/"${page.place === 'mcp' ? ' aria-current="page"' : ''}>TwoTicks MCP</a></li>` : ''}
        <li><a href="${base}${c.privacyHref}" hreflang="${c.privacyLang}"${page.place === 'privacy' ? ' aria-current="page"' : ''}>${x.T('footer.privacy')}</a></li>
        <li><a href="${esc(cfg.youtube.channel)}">YouTube</a></li>
      </ul>
    </nav>
    <nav class="foot-langs" aria-label="${langsLabel}">
      <p class="foot-k">${langsLabel}</p>
      ${langList('foot-lang-list')}
    </nav>
  </div>
</footer>
</body>
</html>
`;
}

// The tools of the store listing, in its three groups. `link(tool)` gives the address of a tool's page. Two
// bullets of the privacy group are promises, not tools: the home page shows them, without a page of their own.
function toolGroups(c, x, link, current) {
  return ['privacy', 'productivity', 'files'].map((g) => {
    const items = c.listing[g].map((it, i) => {
      const tool = c.cfg.tools.find((tl) => tl.group === g && tl.index === i);
      if (!tool) return current ? '' : `<li><h4 class="tool-name">${esc(it.name)}</h4><p>${kbd(esc(it.sentence))}</p></li>`;
      if (current) {
        return tool.slug === current
          ? `<li aria-current="page"><b>${esc(it.name)}</b></li>`
          : `<li><a href="${link(tool)}">${esc(it.name)}</a></li>`;
      }
      return `<li><h4 class="tool-name"><a href="${link(tool)}">${esc(it.name)}</a></h4><p>${kbd(esc(it.sentence))}</p><a class="film-link" href="https://youtu.be/${loc(c, tool.film).id}">${I.play}<span>${x.T('features.film')}</span><span class="vh">: ${esc(it.name)}</span></a></li>`;
    }).join('');
    return `<section class="group" aria-labelledby="g-${g}"><h3 id="g-${g}">${x.T(`features.group.${g}`)}</h3><ul class="tools${current ? ' tools-links' : ''}">${items}</ul></section>`;
  }).join('\n');
}

// --- the home page ----------------------------------------------------------------------------------------------
export function render(c) {
  const { t, ta, ui, listing, cfg, lang } = c;
  // The overview film ("One day, thirteen tools"), in the page's language where it is made in it.
  const dayFilm = loc(c, { id: cfg.youtube.film, title: cfg.youtube.filmTitle, seconds: cfg.youtube.seconds });
  const x = common(c);
  const { T, newTab, storeLink, addTitle } = x;

  const steps = [
    {
      body: `<p>${T('step1.text')}</p>
        <div class="actions">
          <a class="btn btn-store" href="${esc(storeLink('step1'))}" target="_blank" rel="noopener" data-complete="1">${I.store}<span>${T('step1.button')}</span>${newTab}</a>
          ${doneBtn(1)}
        </div>`,
      fig: `<div class="mock mock-store">
          <div class="g-stripe"></div>
          <div class="ms-bar"><span class="ms-name">${esc(x.store)}</span><span class="ms-search"></span></div>
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

  const shots = cfg.shots.map((s, i) => `<figure class="shot">
        ${shot(c, x, s)}
        <figcaption><span class="shot-no" aria-hidden="true">${i + 1}/${cfg.shots.length}</span>${esc(listing[s.group][s.index].name)}</figcaption>
      </figure>`).join('\n');

  const faq = [
    ['faq.free.q', `<p>${kbd(esc(listing.price))}</p>`],
    ['faq.privacy.q', `<p>${esc(listing.privacy[1].name)}: ${esc(listing.privacy[1].text)}</p><p>${esc(listing.privacy[2].name)}: ${esc(listing.privacy[2].text)}</p><p><a href="${c.base}${c.privacyHref}" hreflang="${c.privacyLang}">${T('faq.privacy.link')}</a></p>`],
    ['faq.permissions.q', `<ul>${listing.permissions.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`],
    ['faq.update.q', `<p>${T('faq.update.a')}</p>`],
    ['faq.browsers.q', `<p>${T('faq.browsers.a')}</p>`],
    ...(c.hasMcp ? [['faq.mcp.q', `<p>${T('faq.mcp.a', { link: `<a href="${x.home}mcp/">${T('faq.mcp.link')}</a>` })}</p>`]] : []),
    ['faq.blocked.q', `<p>${T('faq.blocked.a')}</p>`],
    ['faq.remove.q', `<p>${T('faq.remove.a')}</p>`],
  ].map(([q, a]) => `<details><summary>${I.chevron}<span>${T(q)}</span></summary><div class="answer">${a}</div></details>`).join('\n');

  const main = `  <section class="hero" aria-labelledby="hero-title">
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
${c.whatsNewHtml || ''}
  <section id="install" class="install" aria-labelledby="install-title">
    <div class="wrap">
      <header class="sec-head">
        <h2 id="install-title">${T('install.title')}</h2>
        <p class="sec-intro">${T('install.intro')}</p>
        <p class="notice" data-notice hidden data-min="${cfg.minChrome}"
          data-old-chrome="${ta('notice.oldChrome', { version: '{version}', minChrome: String(cfg.minChrome) })}"
          data-other="${ta('notice.otherChromium', { browser: '{browser}', store: x.store })}"
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
${toolGroups(c, x, (tool) => `tools/${tool.slug}/`)}
      </div>
      <p class="langs-line"><b>${esc(listing.languages.name)}:</b> ${esc(listing.languages.text)}</p>
      <div class="film">
        ${filmFig(c, x, dayFilm, `
          <p class="film-kicker">${T('video.title')}</p>
          <p class="film-title"${enLang(dayFilm)}>${esc(dayFilm.title)}</p>
          <p class="film-meta">${filmMeta(x, dayFilm)}</p>
          <p class="film-note">${T('video.note')} <a href="${esc(cfg.youtube.channel)}">${T('video.channel')}</a></p>`,
          '(min-width: 1240px) 680px, (min-width: 900px) 60vw, 92vw')}
        ${(cfg.youtube.more || []).length ? `<p class="also-k">${T('tool.alsoFilm')}</p>
        <ul class="also also-wide">${alsoItems(c, x, cfg.youtube.more)}</ul>` : ''}
      </div>
    </div>
  </section>
${c.reviewsHtml || ''}
  <section id="faq" class="faq" aria-labelledby="faq-title">
    <div class="wrap narrow">
      <h2 id="faq-title">${T('faq.title')}</h2>
${faq}
    </div>
  </section>`;

  return shell(c, x, {
    rel: '', skip: '#install', main,
    title: ta('meta.title', { name: cfg.name }),
    description: ta('meta.description'),
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: cfg.name, applicationCategory: 'BrowserApplication',
      operatingSystem: 'Windows, macOS, Linux, ChromeOS', browserRequirements: `Google Chrome ${cfg.minChrome} or newer`,
      installUrl: cfg.storeUrl, url: `${cfg.siteUrl}${lang.path}`, inLanguage: lang.code,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, author: { '@type': 'Person', name: cfg.publisher },
    },
  });
}

// --- the page of one tool ----------------------------------------------------------------------------------------
export function renderTool(c, tool) {
  const { ta, listing, panel, cfg, lang } = c;
  const x = common(c);
  const { T, newTab, storeLink, home } = x;
  const item = listing[tool.group][tool.index];
  const p = panel[tool.slug];
  const rel = `tools/${tool.slug}/`;
  const shotCfg = cfg.shots.find((s) => s.file === tool.shot);
  const extra = [];
  if (tool.slug === 'several-chats') extra.push(`<p class="tool-note">${esc(listing.several)}</p>`);
  if (tool.slug === 'ai-assistant') extra.push(`<p class="tool-note"><b>${esc(listing.privacy[2].name)}:</b> ${esc(listing.privacy[2].text)}</p>`);
  // The tool's film and its step-by-step film, in the page's language where they are made in it.
  const toolFilm = loc(c, tool.film);
  const stepsFilm = tool.steps ? loc(c, tool.steps) : null;
  // The tool's everyday stories, then its further films.
  const more = alsoItems(c, x, [...(tool.stories || []), ...(tool.more || [])]);

  const main = `  <section class="hero tool-hero" aria-labelledby="tool-title">
    <div class="wrap hero-in tool-hero-in">
      <nav class="crumbs" aria-label="${ta('tool.crumbTools')}">
        <ol><li><a href="${home}">TwoTicks</a></li><li><a href="${home}#features">${T('tool.crumbTools')}</a></li><li aria-current="page">${esc(item.name)}</li></ol>
      </nav>
      <div class="hero-text">
        <h1 id="tool-title" class="tool-h1">${esc(item.name)}</h1>
        <p class="lead">${kbd(esc(item.sentence))}</p>
        <div class="cta">
          <a class="btn btn-hero btn-store" href="${esc(storeLink(`tool-${tool.slug}`))}" target="_blank" rel="noopener" data-complete="1">
            ${I.store}<span class="btn-two"><span class="btn-label">${T('hero.cta')}</span><span class="btn-meta">${T('hero.ctaMeta')}</span></span>${newTab}
          </a>
          <a class="btn btn-hero btn-hero-alt" href="${home}#install">${I.steps}<span class="btn-label">${T('tool.installGuide')}</span></a>
        </div>
      </div>
    </div>
    <div class="hero-art" aria-hidden="true">${ticks('hero-ticks')}</div>
  </section>

  <section class="tool-body" aria-labelledby="panel-title">
    <div class="wrap tool-grid">
      <div class="tool-col">
        <h2 id="panel-title">${T('tool.panel')}</h2>
        <figure class="panel-box">
          <div class="pb-bar">${tile('logo-tile')}<span>TwoTicks</span></div>
          <div class="pb-body">
            <p class="pb-title">${braces(esc(p.title))}</p>
            <p class="pb-desc">${braces(kbd(esc(p.desc)))}</p>
            ${p.hint ? `<p class="pb-hint">${braces(kbd(esc(p.hint)))}</p>` : ''}
          </div>
        </figure>
        ${extra.join('\n')}
        <h2>${T('tool.howTitle')}</h2>
        <p>${T('tool.how', { keys: keys('Alt+Shift+H'), panelTool: `<span class="ui">${braces(esc(p.title))}</span>` })}</p>
        ${stepsFilm ? filmFig(c, x, stepsFilm, `<p><span class="film-name"${enLang(stepsFilm)}>${esc(stepsFilm.title)}</span> <span class="film-meta">${filmMeta(x, stepsFilm)}</span></p>`,
          '(min-width: 1240px) 500px, (min-width: 980px) 44vw, 92vw') : ''}
      </div>
      <div class="tool-col">
        <h2>${T('tool.film')}</h2>
        ${filmFig(c, x, toolFilm, `<p><span class="film-name"${enLang(toolFilm)}>${esc(toolFilm.title)}</span> <span class="film-meta">${filmMeta(x, toolFilm)}</span></p>`,
          '(min-width: 1240px) 550px, (min-width: 980px) 48vw, 92vw')}
        ${more ? `<p class="also-k">${T('tool.alsoFilm')}</p><ul class="also">${more}</ul>` : ''}
        <p class="film-note">${T('video.note')}</p>
      </div>
    </div>
    ${shotCfg ? `<div class="wrap"><figure class="tool-shot">${shot(c, x, shotCfg, '(min-width: 1240px) 1100px, 92vw')}</figure></div>` : ''}
  </section>

  <section class="tool-others" aria-labelledby="others-title">
    <div class="wrap">
      <h2 id="others-title">${T('tool.others')}</h2>
      <div class="groups groups-links">
${toolGroups(c, x, (tl) => `../${tl.slug}/`, tool.slug)}
      </div>
    </div>
  </section>`;

  return shell(c, x, {
    rel, skip: '#main', main, place: `tool-${tool.slug}`,
    title: ta('tool.metaTitle', { tool: item.name }),
    description: esc(cut(item.sentence, 155)),
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'TwoTicks', item: `${cfg.siteUrl}${lang.path}` },
        { '@type': 'ListItem', position: 2, name: item.name, item: `${cfg.siteUrl}${lang.path}${rel}` },
      ],
    },
  });
}

// --- the version history -----------------------------------------------------------------------------------------
// versions: the published versions (content/whatsnew/<version>.json with a date), newest first, each with the items
// of this page's language: [{ version, date, items }].
export function renderVersions(c, versions) {
  const { ta, cfg, lang } = c;
  const x = common(c);
  const { T, newTab, storeLink, home } = x;
  const rel = 'versions/';
  const day = new Intl.DateTimeFormat(lang.intl, { dateStyle: 'long', timeZone: 'UTC' });
  const blocks = versions.map((v, i) => {
    const id = `v-${v.version.replace(/\./g, '-')}`;
    const date = `<time datetime="${v.date}">${esc(day.format(new Date(`${v.date}T00:00:00Z`)))}</time>`;
    return `      <section class="ver" aria-labelledby="${id}">
        <header class="ver-head">
          <h2 id="${id}">TwoTicks ${esc(v.version)}</h2>
          <p class="ver-date">${T('versions.date', { date })}</p>${i === 0 ? `
          <p class="ver-now">${T('versions.current')}</p>` : ''}
        </header>
        <ul class="wn-list">
${v.items.map((s) => `          <li>${esc(s)}</li>`).join('\n')}
        </ul>
      </section>`;
  }).join('\n');

  const main = `  <section class="hero tool-hero" aria-labelledby="versions-title">
    <div class="wrap hero-in tool-hero-in">
      <nav class="crumbs" aria-label="${ta('versions.title')}">
        <ol><li><a href="${home}">TwoTicks</a></li><li aria-current="page">${T('versions.title')}</li></ol>
      </nav>
      <div class="hero-text">
        <h1 id="versions-title" class="tool-h1">${T('versions.title')}</h1>
        <p class="lead">${T('versions.intro')}</p>
        <div class="cta">
          <a class="btn btn-hero btn-store" href="${esc(storeLink('versions'))}" target="_blank" rel="noopener" data-complete="1">
            ${I.store}<span class="btn-two"><span class="btn-label">${T('hero.cta')}</span><span class="btn-meta">${T('hero.ctaMeta')}</span></span>${newTab}
          </a>
        </div>
      </div>
    </div>
    <div class="hero-art" aria-hidden="true">${ticks('hero-ticks')}</div>
  </section>

  <div class="versions">
    <div class="wrap">
${blocks}
    </div>
  </div>`;

  return shell(c, x, {
    rel, skip: '#main', main, place: 'versions',
    title: `${ta('versions.title')}: TwoTicks`,
    description: ta('versions.description'),
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'TwoTicks', item: `${cfg.siteUrl}${lang.path}` },
        { '@type': 'ListItem', position: 2, name: c.t.raw('versions.title'), item: `${cfg.siteUrl}${lang.path}${rel}` },
      ],
    },
  });
}

// --- TwoTicks MCP ------------------------------------------------------------------------------------------------
// The page of TwoTicks MCP (mcp/), the optional, separate program for Windows that lets AI programs on the user's
// computer use TwoTicks' tools (since TwoTicks 1.3.0, whose settings open this page): how it works, what it needs, its
// setup in four steps, the tools in their groups, what waits for the user's confirmation, attachments, privacy and
// removal; below the hero, an example in Claude Code (a terminal box with a request and the confirmation). `mcp` = { cfg: "mcp" of site.config.json (versions and commands), groups and tools (the extension's
// mcp-tools.js: each tool's group and whether it waits for the user's confirmation), words: the extension's own words
// in this language (its settings' tab, switch and buttons, the groups' and the tools' names; content/panel.json) }.
// Chrome's words for the permission come from content/chrome-ui.json. Its look is in src/parts/mcp.css; the copy
// buttons work through src/app.js and stay hidden without it.
export function renderMcp(c, mcp) {
  const { ta, cfg, lang } = c;
  const x = common(c);
  const { T, newTab, storeLink, home, chip } = x;
  const m = mcp.cfg;
  const w = mcp.words;
  const rel = 'mcp/';
  const say = (s) => `<span class="ui">${esc(s)}</span>`;
  let codes = 0;
  const code = (s) => {
    const id = `cmd-${++codes}`;
    return `<div class="mcp-code"><code id="${id}" dir="ltr">${esc(s)}</code><button type="button" class="btn btn-line mcp-copy" data-copy="${id}" data-done="${ta('mcp.copied')}" hidden>${I.copy}<span aria-live="polite">${T('mcp.copy')}</span></button></div>`;
  };
  const section = (id, title, body, extra = '') => `      <section class="mcp-sec"${extra} aria-labelledby="${id}">
        <h2 id="${id}">${title}</h2>
${body}
      </section>`;

  const flow = [1, 2, 3, 4].map((n) => `<li><b>${T(`mcp.flow${n}.name`)}</b><span>${T(`mcp.flow${n}`)}</span>${n < 4 ? `<span class="mcp-next" aria-hidden="true">${I.arrow}</span>` : ''}</li>`).join('');
  const needs = [
    T('mcp.need1', { version: esc(m.minVersion) }),
    T('mcp.need2', { node: esc(String(m.node)), nodejs: '<a href="https://nodejs.org/" lang="en">nodejs.org</a>' }),
    T('mcp.need3'),
  ].map((s) => `<li>${s}</li>`).join('');
  const step = (n, body) => `<li class="mcp-step"><h3><span class="mcp-no" aria-hidden="true">${n}</span>${T(`mcp.step${n}.title`)}</h3>${body}</li>`;
  const steps = [
    step(1, `<p>${T('mcp.step1.text')}</p>${code(m.install)}<p>${T('mcp.step1.npx', { ask: '<code dir="ltr" lang="en">Ok to proceed?</code>', y: '<kbd dir="ltr">y</kbd>' })}</p><p>${T('mcp.step1.after')}</p><p class="mcp-small">${T('mcp.step1.ps', { npxcmd: '<code>npx.cmd</code>', npx: '<code>npx</code>' })}</p>`),
    step(2, `<p>${T('mcp.step2.text', { tab: say(w.tab), on: say(w.on), agree: say(w.agree), permission: chip('nativeMessaging'), allowChrome: chip('allow') })}</p>`),
    step(3, `<p>${T('mcp.step3.text', { allow: say(w.allow) })}</p>`),
    step(4, `<p>${T('mcp.step4.text')}</p><ul class="mcp-asks">${[1, 2, 3, 4].map((n) => `<li>${T(`mcp.ask${n}`)}</li>`).join('')}</ul>`),
  ].join('\n');
  // For Claude Code users: where the install command puts the server, a new session, Claude Code's own question,
  // the confirmation on WhatsApp Web when Claude Code's panel in VS Code shows no forms, and what to do when the install
  // command does not find Claude Code (its line "Claude Code: not found", in English as it prints it).
  const ccWords = { now: say(w.connectedNow), mcp: '<code dir="ltr">/mcp</code>', notFound: '<code dir="ltr" lang="en">Claude Code: not found</code>', add: '<code dir="ltr">claude mcp add</code>' };
  const tips = [1, 2, 3, 4, 5].map((n) => `<li><b>${T(`mcp.cc.p${n}.title`, ccWords)}</b><span>${T(`mcp.cc.p${n}.text`, ccWords)}</span></li>`).join('');
  const groups = mcp.groups.map((g) => {
    const gw = w.groups[g.id];
    const tools = mcp.tools.filter((tl) => tl.group === g.id);
    return `<section class="mcp-group" aria-labelledby="mg-${g.id}">
          <h3 id="mg-${g.id}">${esc(gw.title)}</h3>${g.on ? '' : `
          <p class="mcp-off">${T('mcp.offByDefault')}</p>`}
          <p>${esc(gw.sub)}</p>
          <ul>${tools.map((tl) => `<li>${esc(w.tools[tl.name])}${tl.confirm ? ` <span class="mcp-tag">${esc(w.withYou)}</span>` : ''}</li>`).join('')}</ul>
        </section>`;
  }).join('\n');
  const privacyLink = `<a href="${c.base}${c.privacyHref}" hreflang="${c.privacyLang}">${T('mcp.privacyLink')}</a>`;
  // An example in Claude Code, drawn as a terminal in the site's own colours: two requests, the tool that answers each
  // (named as the panel names it) and the window in which the user confirms the message, in the panel's own words.
  // The names are invented, each language has its own. The signs before the lines are not read aloud; the browser
  // itself turns the request sign round in Arabic.
  const sign = (ch) => `<span class="mcp-term-sign" aria-hidden="true">${ch}</span>`;
  const toolLine = (name) => `<p class="mcp-term-tool">${sign('●')}<span><span dir="ltr">twoticks</span> · ${esc(w.tools[name])}</span></p>`;
  const waiting = [1, 2, 3].map((n) => `<li><b>${T(`mcp.term.n${n}`)}</b><span class="mcp-term-age">${T(`mcp.term.w${n}`)}</span><span class="mcp-term-said">${T(`mcp.term.q${n}`)}</span></li>`).join('');
  const example = `        <div class="mcp-show">
          <figure class="mcp-fig">
            <div class="mcp-term">
              <p class="mcp-term-bar"><b>${T('mcp.term.bar')}</b><span lang="en" dir="ltr">Claude Code</span></p>
              <div class="mcp-term-body">
                <p class="mcp-term-ask">${sign('›')}<span>${T('mcp.ask1')}</span></p>
                <div class="mcp-term-ans">
                  ${toolLine('unanswered')}
                  <p class="mcp-term-out">${T('mcp.term.count')}</p>
                  <ul class="mcp-term-rows">${waiting}</ul>
                </div>
                <p class="mcp-term-ask">${sign('›')}<span>${T('mcp.term.ask2')}</span></p>
                <div class="mcp-term-ans">
                  ${toolLine('send_message')}
                  <p class="mcp-term-out">${T('mcp.term.wait')}</p>
                  <div class="mcp-card">
                    <p class="mcp-card-hd"><b>TwoTicks</b><span>${esc(w.cfBrand)}</span></p>
                    <div class="mcp-card-bd">
                      <p class="mcp-card-q">${esc(w.cfSend)}</p>
                      <dl class="mcp-card-rows"><dt>${esc(w.cfTo)}</dt><dd>${T('mcp.term.n1')}</dd><dt>${esc(w.cfText)}</dt><dd class="mcp-card-text">${T('mcp.term.msg')}</dd></dl>
                      <p class="mcp-card-acts" aria-hidden="true"><span>${esc(w.cfCancel)}</span><span class="mcp-card-go">${esc(w.cfGo)}</span></p>
                    </div>
                  </div>
                </div>
                <p class="mcp-term-done">${sign('✓')}<span>${T('mcp.term.done')}</span></p>
              </div>
            </div>
            <figcaption class="mcp-small">${T('mcp.term.note')}</figcaption>
          </figure>
          <ul class="mcp-points">
            ${[1, 2, 3].map((n) => `<li><b>${T(`mcp.term.p${n}.title`)}</b><span>${T(`mcp.term.p${n}.text`)}</span></li>`).join('\n            ')}
          </ul>
        </div>`;

  const main = `  <section class="hero tool-hero" aria-labelledby="mcp-title">
    <div class="wrap hero-in tool-hero-in">
      <nav class="crumbs" aria-label="TwoTicks MCP">
        <ol><li><a href="${home}">TwoTicks</a></li><li aria-current="page">TwoTicks MCP</li></ol>
      </nav>
      <div class="hero-text">
        <h1 id="mcp-title" class="tool-h1">TwoTicks MCP</h1>
        <p class="lead">${T('mcp.lead')}</p>
        <div class="cta">
          <a class="btn btn-hero btn-store" href="${esc(storeLink('mcp'))}" target="_blank" rel="noopener">
            ${I.store}<span class="btn-two"><span class="btn-label">${T('hero.cta')}</span><span class="btn-meta">${T('hero.ctaMeta')}</span></span>${newTab}
          </a>
          <a class="btn btn-hero btn-hero-alt" href="#setup">${I.steps}<span class="btn-label">${T('mcp.ctaSetup')}</span></a>
        </div>
        <p class="hero-note">${T('mcp.facts')}</p>
      </div>
    </div>
    <div class="hero-art" aria-hidden="true">${ticks('hero-ticks')}</div>
  </section>

  <div class="mcp">
    <div class="wrap">
${section('mcp-see', T('mcp.term.title'), example)}
${section('mcp-how', T('mcp.flowTitle'), `        <ol class="mcp-flow">${flow}</ol>`)}
${section('mcp-need', T('mcp.needTitle'), `        <ul class="mcp-list">${needs}</ul>`)}
${section('mcp-setup', T('mcp.stepsTitle'), `        <ol class="mcp-steps">
${steps}
        </ol>`, ' id="setup"')}
${section('mcp-cc', T('mcp.cc.title'), `        <ul class="mcp-tips">${tips}</ul>`)}
${section('mcp-tools', T('mcp.toolsTitle'), `        <p class="mcp-intro">${T('mcp.toolsIntro', { tag: `<span class="mcp-tag">${esc(w.withYou)}</span>` })}</p>
        <div class="mcp-groups">
${groups}
        </div>`)}
${section('mcp-confirm', T('mcp.confirmTitle'), `        <p>${T('mcp.confirm1', { confirmHere: say(w.confirmHere) })}</p>
        <p>${T('mcp.confirm4')}</p>
        <p>${T('mcp.confirm2')}</p>
        <p>${T('mcp.confirm3')}</p>`)}
${section('mcp-files', T('mcp.filesTitle'), `        <p>${T('mcp.files1', { folder: '<code>twoticks-files</code>' })}</p>
        <p>${T('mcp.files2')}</p>
        <p>${T('mcp.files3')}</p>`)}
${section('mcp-privacy', T('mcp.privacyTitle'), `        <p>${T('mcp.privacy1')}</p>
        <p>${T('mcp.privacy2')}</p>
        <p>${T('mcp.privacy3')}</p>
        <p>${privacyLink}</p>`)}
${section('mcp-other', T('mcp.otherTitle'), `        <p>${T('mcp.otherText')}</p>
        ${code(m.manual)}`)}
${section('mcp-remove', T('mcp.removeTitle'), `        <p>${T('mcp.status')}</p>
        ${code(m.status)}
        <p>${T('mcp.uninstall')}</p>
        ${code(m.uninstall)}
        <p>${T('mcp.removeNote', { tab: say(w.tab) })}</p>`)}
    </div>
  </div>`;

  return shell(c, x, {
    rel, skip: '#main', main, place: 'mcp',
    title: ta('mcp.metaTitle'),
    description: ta('mcp.description'),
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'TwoTicks', item: `${cfg.siteUrl}${lang.path}` },
        { '@type': 'ListItem', position: 2, name: 'TwoTicks MCP', item: `${cfg.siteUrl}${lang.path}${rel}` },
      ],
    },
  });
}

// --- the privacy policy ----------------------------------------------------------------------------------------------
// The extension's privacy policy at privacyUrl (site.config.json): content/privacy-policy.md, a copy of the
// extension's store/privacy-policy.md (tools/new-version.mjs copies it), read by src/markdown.mjs into
// doc = { title, html }; in a language with a translation (build.mjs) also at that language's privacy/, where `english`
// is the English doc and a note at the top says that the English text is the binding one. Every page's footer links to
// the policy in its language, else to the English one. Its look is in src/parts/doc.css.
export function renderPrivacy(c, doc, english) {
  const { ta, cfg } = c;
  const x = common(c);
  const { T, home } = x;
  const note = english
    ? `<p class="tool-note">${T('privacy.translated', { link: `<a href="${c.base}${c.privacyRel}" hreflang="en" lang="en">${esc(english.title)}</a>` })}</p>\n`
    : '';

  const main = `  <section class="hero tool-hero" aria-labelledby="doc-title">
    <div class="wrap hero-in tool-hero-in">
      <nav class="crumbs" aria-label="${ta('footer.privacy')}">
        <ol><li><a href="${home}">TwoTicks</a></li><li aria-current="page">${T('footer.privacy')}</li></ol>
      </nav>
      <div class="hero-text">
        <h1 id="doc-title" class="tool-h1">${esc(doc.title)}</h1>
      </div>
    </div>
    <div class="hero-art" aria-hidden="true">${ticks('hero-ticks')}</div>
  </section>

  <div class="doc">
    <div class="wrap">
      <article class="doc-body" aria-labelledby="doc-title">
${note}${doc.html}
      </article>
    </div>
  </div>`;

  return shell(c, x, {
    rel: c.privacyRel, skip: '#main', main, place: 'privacy', langs: c.privacyLangs,
    ...(c.privacyLangs.length > 1 ? {} : { langsLabel: 'This site in other languages' }),
    title: `${ta('footer.privacy')} · ${esc(cfg.name)}`,
    description: ta('privacy.description', { name: cfg.name }),
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'TwoTicks', item: `${cfg.siteUrl}${c.lang.path}` },
        { '@type': 'ListItem', position: 2, name: c.t.raw('footer.privacy'), item: `${cfg.siteUrl}${c.lang.path}${c.privacyRel}` },
      ],
    },
  });
}
