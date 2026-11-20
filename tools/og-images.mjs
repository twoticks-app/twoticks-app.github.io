// Copyright (c) 2026 Osman Bodur. All rights reserved.
// Makes the link previews of the site (Open Graph, 1200 x 630 PNG), one per language, so that a shared link shows a
// card in the language of its page: src/img/og-<code>.png. Each card is drawn in HTML with the site's own fonts (the
// files in src/fonts) and photographed by Chromium (Playwright). On the brand's slate: the ticks of the logo, the
// wordmark with its slogan, a headline of at most two lines (the extension's summary in that language up to its
// colon, extDescription in _locales) and the page's install button (hero.cta) in the Chrome Web Store's blue with
// Google's four colours along its foot. Arabic is laid out right to left; the ticks keep their direction.
// Every card is checked before anything is saved: all its letters come from IBM Plex (no fallback font, Arabic and
// Hindi in their own faces), the headline has at most two lines, no text leaves its column or its button, nothing
// comes near the card's edges or touches another part of the card, and the PNG stays under 300 KB.
// Usage: node tools/og-images.mjs "<TwoTicks project folder>" [--sheet <file.png>]
//        --sheet also puts all cards side by side into one picture, to look at them together.
// Needs Playwright with its Chromium (npm i -g @playwright/cli); set PLAYWRIGHT or CHROMIUM to other locations.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'img');
const W = 1200;
const H = 630;
const EDGE = 40; // the least room to the card's edges (some sites crop the card to 2:1)
const GAP = 12; // the least room between two parts of the card
const PAD = 4; // the least room between the button's words and the edge of its blue
const OVERHANG = 4; // how far a letter may reach past the side of its column (a bold W does by 2 px)
const SIZES = { max: 58, min: 36 }; // the headline's font size in px: as large as two lines allow
const MAX_BYTES = 300 * 1024;
const SLATE = [0x16, 0x23, 0x2d];

// The two ticks of the logo (white behind, blue in front), in the coordinates of the 800 px channel picture.
const T1 = '163,416 207,373 302,466 485,251 531,290 305,559';
const T2 = '322,470 365,427 406,466 589,251 635,290 410,559';
// The store icon of the site's buttons (src/page.mjs).
const STORE = '<path d="M4 9h16l-1 12H5L4 9zM8 9V6a4 4 0 0 1 8 0v3"/>';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const require = createRequire(import.meta.url);

function playwright() {
  for (const c of [process.env.PLAYWRIGHT, 'playwright', `${process.env.APPDATA}/npm/node_modules/@playwright/cli/node_modules/playwright`].filter(Boolean)) {
    try { return require(c); } catch { /* next */ }
  }
  throw new Error('Playwright not found (npm i -g @playwright/cli, or set PLAYWRIGHT)');
}

function chromium() {
  if (process.env.CHROMIUM) return process.env.CHROMIUM;
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  const dirs = fs.existsSync(base) ? fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => b.split('-')[1] - a.split('-')[1]) : [];
  for (const d of dirs) {
    const exe = path.join(base, d, 'chrome-win64', 'chrome.exe');
    if (fs.existsSync(exe)) return exe;
  }
  return undefined; // Playwright's own choice
}

// The site's fonts. src/fonts.css gives every file the one family "Plex"; Chrome then draws a text of one weight and
// width only from the faces declared with the same weights and widths, so the variable Latin face and the fixed
// Arabic and Devanagari faces never mix, and the letters of the other script fall back to a system font. Here each
// file family gets a name of its own and the card lists them in order, so every letter finds its IBM Plex face.
function fonts() {
  const faces = [];
  const families = [];
  for (const [rule] of fs.readFileSync(path.join(ROOT, 'src', 'fonts.css'), 'utf8').matchAll(/@font-face \{[^}]*\}/g)) {
    if (!rule.includes('font-family: "Plex";')) continue;
    const file = /url\("fonts\/([^"]+)"\)/.exec(rule)[1];
    const family = file.replace(/(-\d{3})+-[a-z-]+\.woff2$/, ''); // ibm-plex-sans, ibm-plex-sans-arabic, ...
    if (!families.includes(family)) families.push(family);
    const data = fs.readFileSync(path.join(ROOT, 'src', 'fonts', file)).toString('base64');
    faces.push(rule.replace('"Plex"', `"${family}"`).replace(/url\("[^"]+"\)/, `url(data:font/woff2;base64,${data})`));
  }
  if (!families.length) throw new Error('src/fonts.css: no faces of the family "Plex"');
  return { css: faces.join('\n'), stack: families.map((f) => `"${f}"`).join(', ') };
}

// The headline: the extension's own summary in this language, up to its colon ("Privacy and productivity on
// WhatsApp Web"). The extension's language folders write pt_BR and pt_PT.
function headline(project, code) {
  const file = path.join(project, '_locales', code.replace('-', '_'), 'messages.json');
  const text = JSON.parse(fs.readFileSync(file, 'utf8')).extDescription.message.split(/[:：]/)[0].trim();
  if (!text) throw new Error(`${file}: no extDescription`);
  return text;
}

// "WhatsApp Web" stays on one line, together with the word that ties it into the sentence ("on", "für", "için").
const bind = (s) => s.replace(/ /g, '\u00a0');
const keepTogether = (s) => s.replace(/\S+ WhatsApp Web$/u, bind).replace(/^WhatsApp Web \S+/u, bind).replace(/WhatsApp Web/g, 'WhatsApp\u00a0Web');

function card(lang, head, cta, font) {
  return `<!doctype html>
<html lang="${lang.code}" dir="${lang.dir === 'rtl' ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<style>
${font.css}
* { box-sizing: border-box; margin: 0; border-radius: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #16232d; }
body { color: #ffffff; font-family: ${font.stack}; font-synthesis: none; -webkit-font-smoothing: antialiased; }
/* As in the hero: the text at the start of the line, the ticks beside it. Right to left the layout turns, the ticks
   do not. */
.ticks { position: absolute; inset-inline-end: 56px; top: 50%; width: 420px; translate: 0 -50%; overflow: visible; }
.ticks .t1 { fill: #ffffff; }
.ticks .t2 { fill: #53bdeb; stroke: #16232d; stroke-width: 12; paint-order: stroke; }
.text {
  position: absolute; inset-block: 0; inset-inline-start: 72px; width: 620px;
  display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
}
.word { font-size: 120px; font-weight: 700; font-stretch: 85%; line-height: 0.86; letter-spacing: -0.012em; }
.slogan {
  display: grid; justify-items: start; gap: 14px; margin-block-start: 20px;
  color: #a3b4be; font-size: 28px; font-weight: 500; line-height: 1.2;
}
.slogan::before { content: ""; width: 120px; height: 6px; background: #53bdeb; }
.head {
  width: 100%; margin-block-start: 44px;
  font-size: var(--size, ${SIZES.max}px); font-weight: 700; font-stretch: 85%; line-height: 1.1; text-wrap: balance;
}
/* Arabic and Devanagari have no narrow width; the Latin words beside them keep the normal width too. */
:lang(ar) .head, :lang(hi) .head { font-stretch: 100%; line-height: 1.4; }
/* The page's install button: the store's blue, Google's four colours along its foot. */
.chip {
  position: relative; display: inline-flex; align-items: center; gap: 14px; max-width: 100%;
  margin-block-start: 40px; padding-block: 13px 19px; padding-inline: 20px 24px;
  background: #0b57d0; color: #ffffff; font-size: 27px; font-weight: 700; line-height: 1.3; white-space: nowrap;
}
.chip::after {
  content: ""; position: absolute; inset-inline: 0; inset-block-end: 0; height: 6px;
  background: linear-gradient(90deg, #ea4335 0 25%, #fbbc04 0 50%, #34a853 0 75%, #4285f4 0);
}
.chip svg { flex: none; width: 28px; height: 28px; }
.chip.bare { background: none; }
.chip.bare::after { content: none; }
</style>
</head>
<body>
<svg class="ticks" data-part="ticks" viewBox="150 240 500 330" aria-hidden="true"><polygon class="t1" points="${T1}"/><polygon class="t2" points="${T2}"/></svg>
<div class="text">
<p class="word" data-part="wordmark">TwoTicks</p>
<p class="slogan" data-part="slogan"><span lang="en" dir="ltr">for WApp-Web</span></p>
<p class="head" data-part="headline">${esc(keepTogether(head))}</p>
<p class="chip" data-part="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${STORE}</svg><span>${esc(cta)}</span></p>
</div>
</body>
</html>`;
}

// In the page: the largest size at which the headline takes at most two lines without running out of its column.
// Lines are told apart by the height of the headline's text boxes (one line of mixed scripts has several boxes).
function fitHeadline({ max, min }) {
  const head = document.querySelector('.head');
  const lines = () => {
    const range = document.createRange();
    range.selectNodeContents(head);
    const mids = [];
    for (const r of range.getClientRects()) {
      const mid = r.top + r.height / 2;
      if (r.width > 0 && !mids.some((m) => Math.abs(m - mid) < r.height / 2)) mids.push(mid);
    }
    return mids.length;
  };
  for (let size = max; size >= min; size--) {
    head.style.setProperty('--size', `${size}px`);
    if (lines() <= 2 && head.scrollWidth <= head.clientWidth) return { size, lines: lines() };
  }
  return { size: 0, lines: lines() };
}

// In the page: the box around everything in a photo of the card that is not the slate background.
async function inkBox({ png, bg }) {
  const img = new Image();
  img.src = `data:image/png;base64,${png}`;
  await img.decode();
  const ctx = new OffscreenCanvas(img.width, img.height).getContext('2d');
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) > 24) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  return right < 0 ? null : { left, top, right: right + 1, bottom: bottom + 1 };
}

// Where each part of the card puts ink: the card photographed with only that part shown. "words" is the button
// without its blue and its stripe: its icon and words alone.
async function inkBoxes(page) {
  const show = (part, bare = false) => page.evaluate(([p, b]) => {
    for (const e of document.querySelectorAll('[data-part]')) e.style.visibility = e.dataset.part === p ? '' : 'hidden';
    document.querySelector('.chip').classList.toggle('bare', b);
  }, [part, bare]);
  const shoot = async () => page.evaluate(inkBox, { png: (await page.screenshot({ type: 'png' })).toString('base64'), bg: SLATE });
  const boxes = {};
  for (const part of ['ticks', 'wordmark', 'slogan', 'headline', 'button']) {
    await show(part);
    boxes[part] = await shoot();
  }
  await show('button', true);
  const words = await shoot();
  await page.evaluate(() => {
    for (const e of document.querySelectorAll('[data-part]')) e.style.visibility = '';
    document.querySelector('.chip').classList.remove('bare');
  });
  return { boxes, words };
}

const fmt = (b) => `${Math.round(b.left)},${Math.round(b.top)} to ${Math.round(b.right)},${Math.round(b.bottom)}`;
const apart = (a, b, gap) => a.right + gap <= b.left || b.right + gap <= a.left || a.bottom + gap <= b.top || b.bottom + gap <= a.top;

// Every text of the card in IBM Plex, and Arabic and Hindi in their own Plex faces, as Chrome reports the fonts it
// drew with (no fallback to a font of the system).
async function checkFonts(cdp, code) {
  const fails = [];
  const { root } = await cdp.send('DOM.getDocument');
  const used = {};
  for (const part of ['wordmark', 'slogan', 'headline', 'button']) {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-part="${part}"]` });
    const { fonts: list } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    used[part] = list.map((f) => f.postScriptName);
    const other = list.filter((f) => !f.isCustomFont || !/^IBM/i.test(f.postScriptName));
    if (other.length) fails.push(`${part}: drawn in ${other.map((f) => `${f.familyName} (${f.glyphCount} letters)`).join(', ')}, not in IBM Plex`);
  }
  const script = { ar: 'Arabic', hi: 'Devanagari' }[code];
  for (const part of script ? ['headline', 'button'] : []) {
    if (!used[part].some((n) => n.includes(script))) fails.push(`${part}: not in IBM Plex Sans ${script}`);
  }
  return { fails, used };
}

// Nothing near the card's edges, no text out of its column, the button's words on its blue, no two parts touching.
async function checkLayout(page) {
  const fails = [];
  const { boxes, words } = await inkBoxes(page);
  const { column, chip } = await page.evaluate(() => {
    const box = (s) => { const r = document.querySelector(s).getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
    return { column: box('.text'), chip: box('.chip') };
  });
  for (const [part, b] of Object.entries(boxes)) {
    if (!b) { fails.push(`${part}: not drawn`); continue; }
    if (b.left < EDGE || b.top < EDGE || b.right > W - EDGE || b.bottom > H - EDGE) fails.push(`${part}: closer than ${EDGE} px to the card's edge (${fmt(b)})`);
    if (part !== 'ticks' && (b.left < column.left - OVERHANG || b.right > column.right + OVERHANG)) fails.push(`${part}: out of its column (${fmt(b)})`);
  }
  const blue = { left: chip.left + PAD, top: chip.top + PAD, right: chip.right - PAD, bottom: chip.bottom - 6 - PAD };
  if (!words) fails.push('button: no words drawn');
  else if (words.left < blue.left || words.top < blue.top || words.right > blue.right || words.bottom > blue.bottom) fails.push(`button: its words leave the blue (${fmt(words)})`);
  const parts = Object.keys(boxes).filter((p) => boxes[p]);
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      if (!apart(boxes[parts[i]], boxes[parts[j]], GAP)) fails.push(`${parts[i]} and ${parts[j]}: closer than ${GAP} px`);
    }
  }
  return fails;
}

// All cards side by side, with their language, size and headline.
async function contactSheet(browser, cards, file, font) {
  const page = await browser.newPage({ viewport: { width: 1902, height: 600 }, deviceScaleFactor: 1 });
  const items = cards.map((c) => {
    const img = `<img src="data:image/png;base64,${c.png.toString('base64')}" width="600" height="315" alt="">`;
    const about = `${c.size} px, ${c.lines} lines, ${Math.round(c.png.length / 1024)} KB`;
    return `<figure>${img}<figcaption><b>${c.code}</b> <span dir="auto">${esc(c.head)}</span><i>${about}</i></figcaption></figure>`;
  }).join('\n');
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${font.css}
body { margin: 0; padding: 24px; background: #e8edf0; color: #16232d; font: 400 15px/1.45 ${font.stack}; }
main { display: grid; grid-template-columns: repeat(3, 602px); gap: 26px 24px; }
figure { margin: 0; }
img { display: block; border: 1px solid #9fb0bb; }
figcaption { display: flex; flex-wrap: wrap; gap: 0 10px; margin-top: 6px; }
i { margin-inline-start: auto; color: #4c5f6b; font-style: normal; }
</style></head><body><main>${items}</main></body></html>`);
  await page.evaluate(() => Promise.all([...document.fonts].map((f) => f.load())));
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  await page.screenshot({ path: path.resolve(file), fullPage: true });
  await page.close();
}

async function main() {
  const args = process.argv.slice(2);
  const at = args.indexOf('--sheet');
  const sheet = at >= 0 ? args[at + 1] : null;
  const project = args.find((a, i) => !a.startsWith('--') && (at < 0 || i !== at + 1));
  if (!project || !fs.existsSync(path.join(project, '_locales')) || (at >= 0 && !sheet)) {
    throw new Error('Usage: node tools/og-images.mjs "<TwoTicks project folder>" [--sheet <file.png>]');
  }
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
  const font = fonts();
  const browser = await playwright().chromium.launch({ executablePath: chromium() });
  const cards = [];
  const problems = [];
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    for (const lang of cfg.languages) {
      const fails = [];
      const cta = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', `${lang.code}.json`), 'utf8'))['hero.cta'];
      if (!cta || /\{[a-zA-Z0-9]+\}/.test(cta)) fails.push(`i18n/${lang.code}.json: "hero.cta" is missing or has a placeholder`);
      const head = headline(project, lang.code);
      await page.setContent(card(lang, head, cta || '', font));
      await page.evaluate(() => Promise.all([...document.fonts].map((f) => f.load())).then(() => document.fonts.ready));
      const fit = await page.evaluate(fitHeadline, SIZES);
      if (!fit.size) fails.push(`headline: ${fit.lines} lines even at ${SIZES.min} px`);
      const fontCheck = await checkFonts(cdp, lang.code);
      fails.push(...fontCheck.fails, ...(await checkLayout(page)));
      const png = await page.screenshot({ type: 'png' });
      if (png.readUInt32BE(16) !== W || png.readUInt32BE(20) !== H) fails.push(`picture: ${png.readUInt32BE(16)} x ${png.readUInt32BE(20)} px, not ${W} x ${H}`);
      if (png.length >= MAX_BYTES) fails.push(`picture: ${Math.round(png.length / 1024)} KB, more than ${MAX_BYTES / 1024} KB`);
      cards.push({ code: lang.code, head, cta, size: fit.size, lines: fit.lines, png, fonts: [...new Set(Object.values(fontCheck.used).flat())] });
      for (const f of fails) problems.push(`${lang.code}: ${f}`);
      console.log(`${lang.code.padEnd(6)} ${String(fit.size).padStart(2)} px, ${fit.lines} lines, ${String(Math.round(png.length / 1024)).padStart(3)} KB  ${head}  [${cta}]${fails.length ? '  FAILED' : ''}`);
    }
    if (sheet) {
      await contactSheet(browser, cards, sheet, font);
      console.log(`Sheet: ${path.resolve(sheet)}`);
    }
  } finally {
    await browser.close();
  }
  if (problems.length) {
    console.error(`\nNothing saved:\n${problems.map((p) => `  ${p}`).join('\n')}`);
    process.exitCode = 1;
    return;
  }
  for (const c of cards) fs.writeFileSync(path.join(OUT, `og-${c.code}.png`), c.png);
  console.log(`\nWrote ${cards.length} cards: src/img/og-<code>.png. Fonts: ${[...new Set(cards.flatMap((c) => c.fonts))].sort().join(', ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
