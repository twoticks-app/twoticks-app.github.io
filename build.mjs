// Copyright (c) 2026 Osman Bodur. All rights reserved.
// Builds the site of TwoTicks into dist/: per language (English at the root, the others in their folders) the home
// page, one page for each tool (tools/<slug>/), the version history (versions/) and the page of the optional program
// for AI programs, TwoTicks MCP (mcp/, while site.config.json shows it); once, in English, the privacy
// policy of the extension (privacy/, the address privacyUrl in site.config.json) and the film pages that the
// extension's film window opens (watch/<number>/, not linked from the site); the stylesheet with the fonts, the
// script, the pictures, 404.html, robots.txt and sitemap.xml.
// TwoTicks is installed from the Chrome Web Store; the site guides there and through Chrome's own steps.
// Usage: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { render, renderTool, renderVersions, renderPrivacy, renderMcp, esc, flag } from './src/page.mjs';
import { renderWhatsNew } from './src/whatsnew.mjs';
import { renderReviews } from './src/reviews.mjs';
import { markdown } from './src/markdown.mjs';
import { renderWatch } from './src/watch.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'dist');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const cfg = JSON.parse(read('site.config.json'));
const chromeUi = JSON.parse(read('content/chrome-ui.json')).labels;
const webstore = JSON.parse(read('content/webstore.json')).labels;
const panelJson = JSON.parse(read('content/panel.json'));
const panelTexts = panelJson.texts;
// TwoTicks MCP (mcp/, since TwoTicks 1.3.0): the page of the optional program for AI programs, while site.config.json
// shows it; the tools, their groups and the extension's words for them come from content/panel.json
// (tools/panel-texts.cjs).
const mcpCfg = cfg.mcp && cfg.mcp.show ? cfg.mcp : null;
const panelMcp = panelJson.mcp;
if (mcpCfg) {
  for (const k of ['minVersion', 'node', 'install', 'status', 'uninstall', 'manual']) if (!mcpCfg[k]) throw new Error(`site.config.json: "mcp" needs "${k}"`);
  if (!panelMcp || !Array.isArray(panelMcp.tools) || !panelMcp.tools.length || !Array.isArray(panelMcp.groups)) throw new Error('content/panel.json: no "mcp" tools (node tools/panel-texts.cjs "<extension folder>" with TwoTicks 1.3.0 or newer)');
}
// The films that have their poster in src/img (made by tools/film-frames.py): every one in 640 pixels (frames), the
// films shown large also in 1280 (bigFrames).
const images = fs.readdirSync(path.join(ROOT, 'src', 'img'));
const posters = (width) => new Set(images.map((f) => new RegExp(`^film-(.+)-${width}\\.webp$`).exec(f)).filter(Boolean).map((m) => m[1]));
const frames = posters(640);
const bigFrames = posters(1280);
// The films made in a language (content/films-i18n.json, tools/films-i18n.py): under each English film's YouTube id the
// same film in that language. A language's pages show those; a film the file does not have stays English there.
const filmsI18n = fs.existsSync(path.join(ROOT, 'content', 'films-i18n.json')) ? JSON.parse(read('content/films-i18n.json')) : {};
for (const [code, list] of Object.entries(filmsI18n)) {
  if (!cfg.languages.some((l) => l.code === code)) throw new Error(`content/films-i18n.json: ${code} is not a language of the site`);
  for (const [en, f] of Object.entries(list)) {
    if (!/^[\w-]{11}$/.test(f.id) || !f.title || !(f.seconds > 0)) throw new Error(`content/films-i18n.json: ${code} ${en} needs an id, a title and seconds`);
  }
}
const sha = (data, enc = 'hex') => String(crypto.createHash('sha256').update(data).digest(enc));

// --- texts ---------------------------------------------------------------------------------------------------------
// t: a text as HTML; its own words are escaped, the values put in for {placeholders} are HTML already. Every
// placeholder must get a value. ta: a text for an attribute; values are plain text, unknown placeholders stay.
function texts(dict, code) {
  const t = (key, vars = {}) => {
    if (!(key in dict)) throw new Error(`${code}: no text for ${key}`);
    return esc(dict[key]).replace(/\{([a-zA-Z0-9]+)\}/g, (_, k) => {
      if (!(k in vars)) throw new Error(`${code} ${key}: no value for {${k}}`);
      return vars[k];
    });
  };
  t.raw = (key) => dict[key];
  const ta = (key, vars = {}) => esc(dict[key].replace(/\{([a-zA-Z0-9]+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)));
  return { t, ta };
}

// The store listing of one language, in the structure all twelve share: the intro, three groups of bullets
// ("Name: text"), the languages bullet, the price, three steps of use, the permissions, two notes and two support
// lines.
function listing(code) {
  const text = read(`content/listing/${code}.txt`).replace(/\r/g, '').trim();
  const b = text.split(/\n\s*\n/).map((x) => x.split('\n').filter(Boolean));
  const shape = b.map((x) => x.length).join(',');
  if (b.length !== 11 || b[1].length !== 4 || b[2].length !== 9 || b[3].length !== 5 || b[6].length !== 4 || b[10].length !== 3) {
    throw new Error(`content/listing/${code}.txt: unexpected structure ${shape}`);
  }
  const bullet = (s) => s.replace(/^•\s*/, '').trim();
  // After "Name:" the listing goes on in small letters; standing alone, the text starts with a capital (in the
  // language's own way: Turkish i becomes İ). Scripts without capitals stay as they are.
  const cap = (s) => s.charAt(0).toLocaleUpperCase(code) + s.slice(1);
  const split = (s) => {
    const m = /^(.+?)\s*[:：]\s+(.+)$/.exec(bullet(s));
    if (!m) throw new Error(`content/listing/${code}.txt: no "Name: text" in "${s}"`);
    return { name: m[1].trim(), text: m[2].trim(), sentence: cap(m[2].trim()) };
  };
  return {
    intro: b[0][0],
    privacy: b[1].slice(1).map(split),
    productivity: b[2].slice(1).map(split),
    files: b[3].slice(1).map(split),
    languages: split(b[4][0]),
    price: b[5].slice(1).join(' '),
    howto: b[6].slice(1).map((s) => s.replace(/^\d+\.\s*/, '')),
    permissions: b[7].slice(1).map(bullet),
    several: b[8][0],
    disclaimer: b[9][0],
    support: b[10].slice(1),
  };
}

// --- assets --------------------------------------------------------------------------------------------------------
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) fs.copyFileSync(path.join(from, f), path.join(to, f));
}

// The inline script on the English pages: a first visit in another of the site's languages goes to the same page
// in that language, once; a language chosen in the menu is remembered and wins. The page says where it is in the
// site (data-page on <html>), so one script, with one hash in the CSP, serves every English page.
const ROOT_PATH = new URL(cfg.siteUrl).pathname;
const REDIRECT = `(function(){try{if(localStorage.getItem('tt-lang'))return;var m={de:'de/',es:'es/',fr:'fr/',it:'it/',pt:'pt-br/','pt-br':'pt-br/','pt-pt':'pt-pt/',tr:'tr/',ru:'ru/',ar:'ar/',hi:'hi/',id:'id/','in':'id/'};var l=navigator.languages||[navigator.language];for(var i=0;i<l.length;i++){var c=String(l[i]||'').toLowerCase();if(c==='en'||c.indexOf('en-')===0)return;var p=m[c]||m[c.split('-')[0]];if(p){location.replace('${ROOT_PATH}'+p+(document.documentElement.getAttribute('data-page')||'')+location.search+location.hash);return;}}}catch(e){}})();`;

const FONT_PRELOADS = {
  base: ['ibm-plex-sans-400-700-latin.woff2'],
  tr: ['ibm-plex-sans-400-700-latin-ext.woff2'],
  ru: ['ibm-plex-sans-400-700-cyrillic.woff2'],
  ar: ['ibm-plex-sans-arabic-400-arabic.woff2', 'ibm-plex-sans-arabic-700-arabic.woff2'],
  hi: ['ibm-plex-sans-devanagari-400-devanagari.woff2', 'ibm-plex-sans-devanagari-700-devanagari.woff2'],
};

function csp(inlineHash) {
  return [
    "default-src 'self'",
    `script-src 'self'${inlineHash ? ` 'sha256-${inlineHash}'` : ''}`,
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    'frame-src https://www.youtube-nocookie.com',
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'none'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

// --- build ---------------------------------------------------------------------------------------------------------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
copyDir(path.join(ROOT, 'src', 'fonts'), path.join(OUT, 'assets', 'fonts'));
copyDir(path.join(ROOT, 'src', 'img'), path.join(OUT, 'assets', 'img'));
// The stylesheet: the fonts, the site's own styles, then the parts that other tools add (src/parts/*.css).
const partsDir = path.join(ROOT, 'src', 'parts');
const partsCss = fs.existsSync(partsDir) ? fs.readdirSync(partsDir).filter((f) => f.endsWith('.css')).sort().map((f) => read(`src/parts/${f}`)) : [];
const css = [read('src/fonts.css'), read('src/styles.css'), ...partsCss].join('\n');
const js = read('src/app.js');
fs.writeFileSync(path.join(OUT, 'assets', 'site.css'), css);
fs.writeFileSync(path.join(OUT, 'assets', 'app.js'), js);
const cssRef = `assets/site.css?v=${sha(css).slice(0, 10)}`;
const jsRef = `assets/app.js?v=${sha(js).slice(0, 10)}`;
const redirectHash = sha(REDIRECT, 'base64');

// Placeholders may stay only where the script fills them in (data-* attributes).
function check(html, where) {
  const loose = html.replace(/data-[a-z-]+="[^"]*"/g, '').replace(/<script[\s\S]*?<\/script>/g, '').match(/\{[a-zA-Z0-9]+\}/g);
  if (loose) throw new Error(`${where}: placeholders left in the page: ${[...new Set(loose)].join(', ')}`);
  if (/\$1/.test(html)) throw new Error(`${where}: "$1" left in the page`);
}
function writePage(rel, html) {
  const file = path.join(OUT, rel, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

const enDict = JSON.parse(read('i18n/en.json'));
// What's new: the changes of one version on the home pages, when site.config.json shows them (tools/new-version.mjs
// switches them on with --whats-new).
const whatsNew = cfg.whatsNew && cfg.whatsNew.show ? JSON.parse(read(`content/whatsnew/${cfg.whatsNew.version}.json`)) : null;
// The reviews of the Chrome Web Store (read by tools/reviews.mjs) on the home pages, when site.config.json shows them.
const reviewData = cfg.reviews && cfg.reviews.show ? JSON.parse(read('content/reviews.json')) : null;
const reviewTexts = reviewData ? JSON.parse(read('content/reviews-i18n.json')) : null;
// The version history: every content/whatsnew/<version>.json with the day the store published it ("date"), newest
// first. A version that is not out yet has no date and waits.
const semver = (v) => v.split('.').map(Number);
const newer = (a, b) => { const x = semver(a); const y = semver(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (y[i] || 0) - (x[i] || 0); if (d) return d; } return 0; };
const versions = fs.readdirSync(path.join(ROOT, 'content', 'whatsnew')).filter((f) => /^\d+(\.\d+){1,3}\.json$/.test(f))
  .map((f) => ({ f, data: JSON.parse(read(`content/whatsnew/${f}`)) }))
  .filter(({ data }) => data.date)
  .map(({ f, data }) => {
    if (`${data.version}.json` !== f) throw new Error(`content/whatsnew/${f}: "version" is ${data.version}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new Error(`content/whatsnew/${f}: "date" is ${data.date}, not YYYY-MM-DD`);
    for (const l of cfg.languages) {
      const items = data.texts && data.texts[l.code] && data.texts[l.code].items;
      if (!Array.isArray(items) || !items.length || items.some((s) => typeof s !== 'string' || !s.trim())) throw new Error(`content/whatsnew/${f}: no items for ${l.code}`);
    }
    return data;
  })
  .sort((a, b) => newer(a.version, b.version));
const pageRels = ['', ...cfg.tools.map((tool) => `tools/${tool.slug}/`), ...(versions.length ? ['versions/'] : []), ...(mcpCfg ? ['mcp/'] : [])];
// The privacy policy of the extension, in English only: content/privacy-policy.md, a copy of the extension's
// store/privacy-policy.md (tools/new-version.mjs copies it). It stands at privacyUrl, a folder of this site; every
// page's footer and the home page's questions link to it.
if (typeof cfg.privacyUrl !== 'string' || !cfg.privacyUrl.startsWith(cfg.siteUrl) || cfg.privacyUrl === cfg.siteUrl || !cfg.privacyUrl.endsWith('/')) {
  throw new Error(`site.config.json: "privacyUrl" must be a folder of ${cfg.siteUrl}, such as ${cfg.siteUrl}privacy/, not ${cfg.privacyUrl}`);
}
const PRIVACY_REL = cfg.privacyUrl.slice(cfg.siteUrl.length);
const policySource = read('content/privacy-policy.md');
const policy = markdown(policySource, { esc });
if (!policy.title || !policy.html) throw new Error('content/privacy-policy.md: no "# " title, or no text below it');
// Its translations (content/privacy-policy-i18n/<language>.md, tools/privacy-i18n.py), each at its language's
// privacy/ (tr/privacy/). The English text stays the binding one, and each translation says so with a link to it. A
// translation names on its first line the English text's date line it was made from (<!-- en: Last updated: ... -->);
// while that is not the English text's own, the language's pages link to the English text, so a changed policy is
// never shown in an old translation.
const policyDate = (/^Last updated:.*$/m.exec(policySource) || [''])[0].trim();
const policies = { en: policy };
for (const l of cfg.languages) {
  const rel = `content/privacy-policy-i18n/${l.code}.md`;
  if (l.code === 'en' || !fs.existsSync(path.join(ROOT, rel))) continue;
  const src = read(rel);
  const head = /^<!-- en: (.+?) -->\r?\n/.exec(src);
  if (!head) throw new Error(`${rel}: no "<!-- en: Last updated: ... -->" first line`);
  if (head[1].trim() !== policyDate) {
    console.warn(`  ${l.code}: ${rel} is a translation of "${head[1].trim()}", the English text is of "${policyDate}": its pages link to the English text until it is translated again`);
    continue;
  }
  const doc = markdown(src.slice(head[0].length), { esc });
  if (!doc.title || !doc.html) throw new Error(`${rel}: no "# " title, or no text below it`);
  policies[l.code] = doc;
}
const privacyLangs = cfg.languages.filter((l) => policies[l.code]).map((l) => l.code);
let privacyBytes = 0;
const privacyPages = [];
const pages = [];
for (const lang of cfg.languages) {
  const dict = JSON.parse(read(`i18n/${lang.code}.json`));
  for (const k of Object.keys(enDict)) if (!(k in dict)) throw new Error(`i18n/${lang.code}.json: missing ${k}`);
  const { t, ta } = texts(dict, lang.code);
  // Chrome's words and the store's words in this language; for Spanish, Latin America's first and Spain's beside.
  const words = (code) => (code ? { ...chromeUi[code], ...webstore[code] } : null);
  const ui = words(lang.chrome);
  const uiAlt = words(lang.chromeAlt);
  for (const k of ['addToChrome', 'addTitle', 'addExtension', 'cancel', 'pin', 'remove', 'removeFromChrome', 'extensionsMenu', ...(mcpCfg ? ['nativeMessaging', 'allow'] : [])]) {
    if (!ui[k]) throw new Error(`${lang.code}: no label "${k}" in content/chrome-ui.json or content/webstore.json`);
  }
  // The extension's words for the TwoTicks MCP page in this language: every group and every tool named.
  const mcpWords = mcpCfg ? panelMcp.texts && panelMcp.texts[lang.code] : null;
  if (mcpCfg) {
    const missing = !mcpWords ? ['all'] : [
      ...['tab', 'on', 'agree', 'allow', 'confirmHere', 'withYou', 'connectedNow', 'cfBrand', 'cfSend', 'cfTo', 'cfText', 'cfGo', 'cfCancel'].filter((k) => !mcpWords[k]),
      ...panelMcp.groups.filter((g) => !mcpWords.groups || !mcpWords.groups[g.id] || !mcpWords.groups[g.id].title || !mcpWords.groups[g.id].sub).map((g) => `group ${g.id}`),
      ...panelMcp.tools.filter((tl) => !mcpWords.tools || !mcpWords.tools[tl.name]).map((tl) => `tool ${tl.name}`),
    ];
    if (missing.length) throw new Error(`${lang.code}: content/panel.json has no words for TwoTicks MCP: ${missing.join(', ')}`);
  }
  const list = listing(lang.code);
  // Every tool of the listing has its page, and the panel's own words for it. (The privacy group of the listing
  // has one tool and two promises.)
  for (const g of ['productivity', 'files']) {
    const n = cfg.tools.filter((tool) => tool.group === g).length;
    if (n !== list[g].length) throw new Error(`${lang.code}: the listing has ${list[g].length} tools in "${g}", site.config.json ${n}`);
  }
  const panel = panelTexts[lang.code];
  for (const tool of cfg.tools) {
    if (!list[tool.group][tool.index]) throw new Error(`${lang.code}: no listing entry for ${tool.slug}`);
    if (!panel || !panel[tool.slug]) throw new Error(`${lang.code}: no panel text for ${tool.slug} in content/panel.json`);
  }
  const english = !lang.path;
  // The store's screenshots in this language (tools/images.py: <file>-<code>-<width>; "pt" serves both Portuguese
  // sites, as the panel has one Portuguese) where all of them are there in both sizes and formats; else the English.
  const shotCode = lang.code.split('-')[0].toLowerCase();
  const shotLang = !english && cfg.shots.every((s) => ['640.webp', '640.avif', '1280.webp', '1280.avif'].every((w) => images.includes(`${s.file}-${shotCode}-${w}`))) ? shotCode : '';
  const fonts = [...FONT_PRELOADS.base, ...(FONT_PRELOADS[lang.code] || [])];
  // The preview picture when the page is shared: the one of its language where there is one.
  const ogImage = fs.existsSync(path.join(ROOT, 'src', 'img', `og-${lang.code}.png`)) ? `assets/img/og-${lang.code}.png` : 'assets/img/og.png';
  const context = (depth) => {
    const base = '../'.repeat(depth);
    return {
      t, ta, ui, uiAlt, listing: list, panel, cfg, lang, langs: cfg.languages, base, ogImage, frames, bigFrames, hasVersions: versions.length > 0,
      hasMcp: !!mcpCfg,
      films: filmsI18n[lang.code] || {},
      shotLang,
      // The privacy policy this language's pages link to: its own translation, or the English text.
      privacyHref: policies[lang.code] ? `${lang.path}${PRIVACY_REL}` : PRIVACY_REL,
      privacyLang: policies[lang.code] ? lang.code : 'en',
      privacyLangs,
      privacyRel: PRIVACY_REL, css: cssRef, js: jsRef,
      preloads: fonts.map((f) => `<link rel="preload" href="${base}assets/fonts/${f}" as="font" type="font/woff2" crossorigin>`).join('\n'),
      redirect: english ? REDIRECT : '',
      csp: csp(english ? redirectHash : ''),
      durationText: `${Math.floor(cfg.youtube.seconds / 60)}:${String(cfg.youtube.seconds % 60).padStart(2, '0')}`,
    };
  };
  const depth = lang.path.split('/').filter(Boolean).length;
  const reviewsHtml = reviewData ? renderReviews({
    data: reviewData, code: lang.code, esc, texts: reviewTexts[lang.code], storeName: dict['store.name'], locale: lang.intl,
    reviewsUrl: `${cfg.storeUrl}/reviews?hl=${lang.code}&utm_source=${encodeURIComponent(new URL(cfg.siteUrl).host)}&utm_medium=website&utm_campaign=site&utm_content=reviews-${lang.code.toLowerCase()}`,
  }) : '';
  const more = versions.length ? { href: 'versions/', text: dict['versions.all'] } : null;
  const home = render({ ...context(depth), whatsNewHtml: renderWhatsNew({ data: whatsNew, code: lang.code, esc, more }), reviewsHtml });
  check(home, lang.code);
  writePage(lang.path, home);
  if (versions.length) {
    const html = renderVersions(context(depth + 1), versions.map((v) => ({ version: v.version, date: v.date, items: v.texts[lang.code].items })));
    check(html, `${lang.code} versions`);
    writePage(`${lang.path}versions/`, html);
  }
  let mcpBytes = 0;
  if (mcpCfg) {
    const html = renderMcp(context(depth + 1), { cfg: mcpCfg, groups: panelMcp.groups, tools: panelMcp.tools, words: mcpWords });
    check(html, `${lang.code} mcp`);
    writePage(`${lang.path}mcp/`, html);
    mcpBytes = Buffer.byteLength(html);
  }
  let toolBytes = 0;
  for (const tool of cfg.tools) {
    const html = renderTool(context(depth + 2), tool);
    check(html, `${lang.code} ${tool.slug}`);
    writePage(`${lang.path}tools/${tool.slug}/`, html);
    toolBytes += Buffer.byteLength(html);
  }
  // The privacy policy: the English text at privacyUrl; a language with a current translation also has it at its own
  // privacy/, with a note that leads to the English text. No language redirect on these pages.
  if (policies[lang.code]) {
    const en = lang.code === 'en';
    const rel = en ? PRIVACY_REL : `${lang.path}${PRIVACY_REL}`;
    const html = renderPrivacy({ ...context(rel.split('/').filter(Boolean).length), redirect: '', csp: csp('') }, policies[lang.code], en ? null : policy);
    check(html, 'privacy');
    writePage(rel, html);
    if (en) privacyBytes = Buffer.byteLength(html);
    else privacyPages.push({ lang, rel, bytes: Buffer.byteLength(html) });
  }
  pages.push({ lang, bytes: Buffer.byteLength(home), toolBytes, mcpBytes });
}
if (!privacyBytes) throw new Error('site.config.json: no language "en" for the privacy policy');

// The film pages: one for each how-to film of the extension (content/films.json, copied from its films.js by
// tools/films.cjs), at watch/<number>/, the address the extension's film window opens. Not linked from the site
// and not in the sitemap.
const films = JSON.parse(read('content/films.json')).films;
if (!Array.isArray(films) || !films.length) throw new Error('content/films.json: no films');
if (new Set(films.map((f) => f.n)).size !== films.length) throw new Error('content/films.json: two films have the same number');
for (const film of films) writePage(`watch/${film.n}/`, renderWatch(film, { esc, sha }));
// The same films in a language they were made in (content/films-i18n.json, under each English film's YouTube id), at
// watch/<number>/<language>/: the extension opens that page when its panel speaks the language (since 1.2.2; its
// films.js names the languages, by the panel's two-letter code, which is the address's too).
const filmLangs = [];
for (const [code, made] of Object.entries(filmsI18n)) {
  const own = films.filter((film) => made[film.yt]);
  if (!own.length) continue;
  if (!/^[a-z]{2}$/.test(code)) throw new Error(`content/films-i18n.json: no film pages for "${code}": the extension's panel knows two-letter codes only`);
  for (const film of own) writePage(`watch/${film.n}/${code}/`, renderWatch({ n: film.n, yt: made[film.yt].id, s: made[film.yt].seconds, title: made[film.yt].title }, { esc, sha, lang: code }));
  filmLangs.push({ code, n: own.length });
}

// 404: GitHub Pages serves it for every missing address, at any depth, so its links start at the site's root.
const rootPath = new URL(cfg.siteUrl).pathname;
fs.writeFileSync(path.join(OUT, '404.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>TwoTicks: page not found</title>
<meta name="color-scheme" content="light dark">
<link rel="icon" href="${rootPath}assets/img/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${rootPath}${cssRef}">
</head>
<body class="lost">
<main class="wrap narrow lost-in">
<h1>Page not found</h1>
<p>This address does not exist on the TwoTicks site.</p>
<ul class="foot-lang-list">${cfg.languages.map((l) => `<li><a href="${rootPath}${l.path}" hreflang="${l.code}" lang="${l.code}">${flag(l.code)}<span>${esc(l.native)}</span></a></li>`).join('')}</ul>
</main>
</body>
</html>
`);

const today = new Date().toISOString().slice(0, 10);
const urls = pageRels.flatMap((rel) => {
  const alt = cfg.languages.map((l) => `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${cfg.siteUrl}${l.path}${rel}"/>`).join('\n');
  return cfg.languages.map((l) => `  <url>\n    <loc>${cfg.siteUrl}${l.path}${rel}</loc>\n    <lastmod>${today}</lastmod>\n${alt}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${cfg.siteUrl}${rel}"/>\n  </url>`);
});
// The privacy policy in each language it is in, each naming the others; the English text is the default.
const privacyUrlOf = (code) => `${cfg.siteUrl}${cfg.languages.find((l) => l.code === code).path}${PRIVACY_REL}`;
const privacyAlt = privacyLangs.length > 1
  ? `${privacyLangs.map((code) => `    <xhtml:link rel="alternate" hreflang="${code}" href="${privacyUrlOf(code)}"/>`).join('\n')}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${cfg.privacyUrl}"/>\n`
  : '';
for (const code of privacyLangs) urls.push(`  <url>\n    <loc>${privacyUrlOf(code)}</loc>\n    <lastmod>${today}</lastmod>\n${privacyAlt}  </url>`);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${cfg.siteUrl}sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

const kb = (n) => `${Math.round(n / 1024)} KB`;
console.log(`Built ${pages.length * pageRels.length + 1 + privacyPages.length} pages in dist/ for ${cfg.siteUrl}: ${pages.length} languages, each with its home page, ${cfg.tools.length} tool pages${versions.length ? `, the history of ${versions.length} versions` : ''}${mcpCfg ? ' and the page of TwoTicks MCP' : ''}; the privacy policy in English${privacyPages.length ? ` and ${privacyPages.length} translations of it` : ''}`);
for (const p of pages) console.log(`  ${(p.lang.path || '(root)').padEnd(8)} ${p.lang.code.padEnd(6)} home ${kb(p.bytes)}, tools ${kb(p.toolBytes)}${p.mcpBytes ? `, TwoTicks MCP ${kb(p.mcpBytes)}` : ''}`);
console.log(`  ${PRIVACY_REL.padEnd(8)} en     privacy policy ${kb(privacyBytes)} (${policy.title})`);
for (const p of privacyPages) console.log(`  ${p.rel.padEnd(8)} ${p.lang.code.padEnd(6)} privacy policy ${kb(p.bytes)}, a translation (${policies[p.lang.code].title})`);
console.log(`  watch/   en     ${films.length} film pages for the extension's film window: ${films.map((f) => f.n).sort().join(', ')}`);
for (const l of filmLangs) console.log(`  watch/   ${l.code.padEnd(6)} ${l.n} of them in that language too (watch/<number>/${l.code}/)${l.n < films.length ? ' — NOT ALL: the extension lists a language only with every film' : ''}`);
console.log(`  assets: site.css ${kb(Buffer.byteLength(css))}, app.js ${kb(Buffer.byteLength(js))}`);
