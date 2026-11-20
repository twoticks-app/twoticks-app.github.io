// Copyright (c) 2026 Osman Bodur. All rights reserved.
// Builds the site of TwoTicks into dist/: per language (English at the root, the others in their folders) the home
// page and one page for each tool (tools/<slug>/), the stylesheet with the fonts, the script, the pictures,
// 404.html, robots.txt and sitemap.xml.
// TwoTicks is installed from the Chrome Web Store; the site guides there and through Chrome's own steps.
// Usage: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { render, renderTool, esc, flag } from './src/page.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'dist');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const cfg = JSON.parse(read('site.config.json'));
const chromeUi = JSON.parse(read('content/chrome-ui.json')).labels;
const webstore = JSON.parse(read('content/webstore.json')).labels;
const panelTexts = JSON.parse(read('content/panel.json')).texts;
// The films that have their poster in src/img (made by tools/film-frames.py).
const frames = new Set(fs.readdirSync(path.join(ROOT, 'src', 'img')).map((f) => /^film-(.+)-1280\.webp$/.exec(f)).filter(Boolean).map((m) => m[1]));
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
const pageRels = ['', ...cfg.tools.map((tool) => `tools/${tool.slug}/`)];
const pages = [];
for (const lang of cfg.languages) {
  const dict = JSON.parse(read(`i18n/${lang.code}.json`));
  for (const k of Object.keys(enDict)) if (!(k in dict)) throw new Error(`i18n/${lang.code}.json: missing ${k}`);
  const { t, ta } = texts(dict, lang.code);
  // Chrome's words and the store's words in this language; for Spanish, Latin America's first and Spain's beside.
  const words = (code) => (code ? { ...chromeUi[code], ...webstore[code] } : null);
  const ui = words(lang.chrome);
  const uiAlt = words(lang.chromeAlt);
  for (const k of ['addToChrome', 'addTitle', 'addExtension', 'cancel', 'pin', 'remove', 'removeFromChrome', 'extensionsMenu']) {
    if (!ui[k]) throw new Error(`${lang.code}: no label "${k}" in content/chrome-ui.json or content/webstore.json`);
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
  const fonts = [...FONT_PRELOADS.base, ...(FONT_PRELOADS[lang.code] || [])];
  // The preview picture when the page is shared: the one of its language where there is one.
  const ogImage = fs.existsSync(path.join(ROOT, 'src', 'img', `og-${lang.code}.png`)) ? `assets/img/og-${lang.code}.png` : 'assets/img/og.png';
  const context = (depth) => {
    const base = '../'.repeat(depth);
    return {
      t, ta, ui, uiAlt, listing: list, panel, cfg, lang, langs: cfg.languages, base, ogImage, frames,
      css: cssRef, js: jsRef,
      preloads: fonts.map((f) => `<link rel="preload" href="${base}assets/fonts/${f}" as="font" type="font/woff2" crossorigin>`).join('\n'),
      redirect: english ? REDIRECT : '',
      csp: csp(english ? redirectHash : ''),
      durationText: `${Math.floor(cfg.youtube.seconds / 60)}:${String(cfg.youtube.seconds % 60).padStart(2, '0')}`,
    };
  };
  const depth = lang.path.split('/').filter(Boolean).length;
  const home = render(context(depth));
  check(home, lang.code);
  writePage(lang.path, home);
  let toolBytes = 0;
  for (const tool of cfg.tools) {
    const html = renderTool(context(depth + 2), tool);
    check(html, `${lang.code} ${tool.slug}`);
    writePage(`${lang.path}tools/${tool.slug}/`, html);
    toolBytes += Buffer.byteLength(html);
  }
  pages.push({ lang, bytes: Buffer.byteLength(home), toolBytes });
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
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${cfg.siteUrl}sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

const kb = (n) => `${Math.round(n / 1024)} KB`;
console.log(`Built ${pages.length * pageRels.length} pages in dist/ for ${cfg.siteUrl}: ${pages.length} languages, each with its home page and ${cfg.tools.length} tool pages`);
for (const p of pages) console.log(`  ${(p.lang.path || '(root)').padEnd(8)} ${p.lang.code.padEnd(6)} home ${kb(p.bytes)}, tools ${kb(p.toolBytes)}`);
console.log(`  assets: site.css ${kb(Buffer.byteLength(css))}, app.js ${kb(Buffer.byteLength(js))}`);
