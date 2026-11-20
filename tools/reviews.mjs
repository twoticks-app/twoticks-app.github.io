// Copyright (c) 2026 Osman Bodur. All rights reserved.
// Reads the reviews of TwoTicks from its page in the Chrome Web Store into content/reviews.json, for the reviews
// section of the site: every review in every language, newest first, with its stars, its date, its text as written
// and its author as first name and last initial (no photos, no full names), and the average rating and the number of
// ratings that the store shows under TwoTicks' name.
// It starts a headless Chromium with a new, empty profile and reads the store in English (?hl=en). From the EU, Google
// first shows its consent page ("Before you continue"); the script chooses "Reject all". On the reviews page it sets
// the language menu to "All languages" (the store first shows only the reviews in the page's language), opens every
// "Load more" and every "Show more", and reads the reviews.
// It stops with an error, and leaves content/reviews.json as it is, when the store's pages do not look as expected or
// show no review at all.
// Usage: node tools/reviews.mjs [--dry-run] [--shots] [--allow-empty]
//   --dry-run      print what was read, write nothing
//   --shots        also save pictures of the two store pages in the system's temp folder, to compare by eye
//   --allow-empty  write the file even when the store shows no review
// Needs Playwright with its Chromium (npm i -g @playwright/cli); set PLAYWRIGHT or CHROMIUM to other locations.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'content', 'reviews.json');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const args = new Set(process.argv.slice(2));
const require = createRequire(import.meta.url);
const STORE_HOST = 'chromewebstore.google.com';

function playwright() {
  for (const c of [process.env.PLAYWRIGHT, 'playwright', path.join(process.env.APPDATA || '', 'npm/node_modules/@playwright/cli/node_modules/playwright')].filter(Boolean)) {
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

// --- the store's pages ---------------------------------------------------------------------------------------------

// Google's consent page, shown from the EU to a browser without cookies. Of its two forms (both post to
// consent.google.com/save), the one with set_eom=true is "Reject all", in any language.
async function passConsent(page) {
  const onConsent = new URL(page.url()).hostname.startsWith('consent.');
  let reject = page.getByRole('button', { name: /^reject all$/i });
  if (onConsent && !(await reject.count())) reject = page.locator('form[action*="consent.google.com/save"]:has(input[name="set_eom"][value="true"]) button');
  if (!(await reject.count())) {
    if (onConsent) throw new Error(`Google's consent page has no "Reject all" button: ${page.url()}`);
    return;
  }
  await reject.first().click();
  // Back to the store through a few redirects (waiting for one navigation can fail when the next one replaces it).
  for (const end = Date.now() + 30000; new URL(page.url()).hostname !== STORE_HOST;) {
    if (Date.now() > end) throw new Error(`Still on ${page.url()} after "Reject all"`);
    await page.waitForTimeout(250);
  }
  await page.waitForLoadState('domcontentloaded');
}

async function open(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await passConsent(page);
  if (new URL(page.url()).hostname !== STORE_HOST) throw new Error(`Expected the Chrome Web Store, got ${page.url()}`);
  await page.locator('main h1').first().waitFor({ timeout: 30000 })
    .catch(() => { throw new Error(`The store's page shows no item name (no <h1> in <main>): ${page.url()}`); });
}

// The store loads new reviews through its "batchexecute" calls; after one, wait until the list stops changing.
const dataCall = (page) => page.waitForResponse((r) => r.url().includes('/batchexecute'), { timeout: 15000 }).catch(() => null);
const listSignature = (page) => page.evaluate(() => [...document.querySelectorAll('main section h3')].map((h) => h.textContent).join('\n'));
async function settle(page, quiet = 1200) {
  let last = null;
  let since = Date.now();
  const end = Date.now() + 20000;
  while (Date.now() < end) {
    const sig = await listSignature(page);
    if (sig !== last) { last = sig; since = Date.now(); } else if (Date.now() - since >= quiet) return;
    await page.waitForTimeout(200);
  }
}

// One of the three menus above the reviews ("Filter by", "Sort by", "Language"), set to one of its options.
async function choose(page, menu, option) {
  const box = page.getByRole('combobox', { name: menu, exact: true });
  if ((await box.count()) !== 1) throw new Error(`The reviews page has no menu "${menu}"`);
  const shows = async () => (await box.innerText()).split('\n').map((s) => s.trim()).includes(option);
  if (await shows()) return;
  await box.click();
  const item = page.getByRole('option', { name: option, exact: true });
  await item.waitFor({ timeout: 10000 }).catch(() => { throw new Error(`The menu "${menu}" has no option "${option}"`); });
  const call = dataCall(page);
  await item.click();
  await call;
  await settle(page);
  if (!(await shows())) throw new Error(`Could not set the menu "${menu}" to "${option}"`);
}

// The average and the number of ratings under the item's name ("5.0 ★ (1 rating)"); the related items further
// down the detail page have their own, so only the first ones after the h1 count.
function readSummary(page) {
  return page.evaluate(() => {
    const main = document.querySelector('main');
    const h1 = main.querySelector('h1');
    const after = (e) => Boolean(h1.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING);
    const avg = [...main.querySelectorAll('[role="img"][aria-label]')].find((e) => /^average rating/i.test(e.getAttribute('aria-label')) && after(e));
    const count = [...main.querySelectorAll('a, p')].find((e) => /^[\d.,]+\s*[KM]?\s+ratings?$/i.test(e.textContent.trim()) && after(e));
    return {
      name: h1.textContent.trim(),
      averageText: avg ? avg.textContent.trim() : null,
      averageLabel: avg ? avg.getAttribute('aria-label') : null,
      countText: count ? count.textContent.trim() : null,
    };
  });
}

// Every review on the reviews page, as the page has it. A review is a <section> with an <h3>: the author, a picture
// of the stars ("5 out of 5 stars"), the date; then its text in a <p>. A reply of the developer is a <section> inside
// it with its own heading and text, and is left out.
function readList(page) {
  return page.evaluate(() => [...document.querySelectorAll('main section h3')].map((h) => {
    const box = h.closest('section');
    const stars = h.querySelector('[role="img"][aria-label]');
    let author = '';
    let date = '';
    let past = false;
    for (const n of h.childNodes) {
      if (stars && (n === stars || (n.nodeType === 1 && n.contains(stars)))) { past = true; continue; }
      if (past) date += n.textContent; else author += n.textContent;
    }
    const p = [...box.querySelectorAll('p')].find((x) => x.closest('section') === box && Boolean(h.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING));
    let text = '';
    let cut = false;
    if (p) {
      const copy = p.cloneNode(true);
      for (const b of copy.querySelectorAll('[role="button"], button')) {
        if (!/less/i.test(b.textContent)) cut = true; // "Show more" still there: the text is cut short
        b.remove();
      }
      text = copy.textContent;
    }
    const idEl = box.querySelector('[data-ugc-id]');
    return { id: idEl ? idEl.getAttribute('data-ugc-id') : '', author, stars: stars ? stars.getAttribute('aria-label') : '', date, text, hasText: Boolean(p), cut };
  }));
}

async function readReviews(page) {
  // The store first shows only the reviews in the page's language; newest first and every rating are its defaults.
  await choose(page, 'Language', 'All languages');
  await choose(page, 'Sort by', 'Recent');
  await choose(page, 'Filter by', 'All reviews');
  // Ten reviews at a time: "Load more" until it is gone.
  for (let round = 0; ; round++) {
    const more = page.getByRole('button', { name: 'Load more', exact: true });
    if (!(await more.count()) || !(await more.first().isVisible())) break;
    if (round > 500) throw new Error('"Load more" does not end');
    const before = await page.locator('main section h3').count();
    const call = dataCall(page);
    await more.first().click();
    await call;
    await page.waitForFunction((n) => {
      const btn = [...document.querySelectorAll('main button')].find((b) => b.textContent.trim() === 'Load more');
      return document.querySelectorAll('main section h3').length > n || !btn || !btn.offsetParent;
    }, before, { timeout: 20000 }).catch(() => { throw new Error('"Load more" loaded nothing'); });
    await settle(page, 600);
  }
  // Long reviews end in "..." with "Show more" inside the text: open each one.
  const toggles = page.locator('main section p [role="button"]').filter({ hasText: /^\s*show more\s*$/i });
  for (let i = 0; (await toggles.count()) > 0; i++) {
    if (i > 2000) throw new Error('"Show more" does not end');
    await toggles.first().click();
    await page.waitForTimeout(150);
  }
  return readList(page);
}

// --- what is kept --------------------------------------------------------------------------------------------------

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// "Nov 19, 2026" (the store in English) -> "2026-11-19".
function isoDate(s) {
  const m = /^([A-Za-z]{3,9})\.?\s+(\d{1,2}),\s*(\d{4})$/.exec(s.trim());
  const month = m ? MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) : -1;
  if (month < 0) return null;
  const d = new Date(Date.UTC(Number(m[3]), month, Number(m[2])));
  return d.getUTCDate() === Number(m[2]) ? d.toISOString().slice(0, 10) : null;
}

// "4 out of 5 stars" -> 4.
function stars(label) {
  const m = /^(\d+(?:\.\d+)?) out of 5\b/i.exec(label.trim());
  const n = m ? Number(m[1]) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

// "Maria Kowalska" -> "Maria K.": the first name and the first letter of the last name. A nickname in brackets
// ("Alex S (Userone)") is left out; a single name (often a nickname) stays as it is, except in Chinese, Japanese and
// Korean, which write a full name without a space ("이현관" -> "이."): there only its first sign stays.
const graphemes = new Intl.Segmenter('und', { granularity: 'grapheme' });
const firstLetter = (s) => [...graphemes.segment(s)].map((g) => g.segment).find((g) => /\p{L}/u.test(g));
function shortName(full) {
  const plain = full.replace(/\s+/g, ' ').trim();
  const parts = (plain.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').trim() || plain.replace(/[()[\]]/g, '')).split(' ').filter(Boolean);
  if (parts.length === 1 && /^[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}]{2,}$/u.test(parts[0])) return `${firstLetter(parts[0])}.`;
  if (parts.length < 2) return parts[0] || '';
  const initial = firstLetter(parts[parts.length - 1]);
  return initial ? `${parts[0]} ${initial.toLocaleUpperCase()}.` : parts[0];
}

// "1 rating", "1,234 ratings", "3.9K ratings" -> the number, and whether the store rounded it.
function ratingCount(text) {
  const m = /^([\d.,]+)\s*([KM])?\s+ratings?$/i.exec(text.trim());
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ''));
  if (!Number.isFinite(n)) return null;
  const k = { K: 1e3, M: 1e6 }[(m[2] || '').toUpperCase()] || 1;
  return { count: Math.round(n * k), rounded: k > 1 };
}

function average(s) {
  const fromText = s.averageText && /^\d(?:\.\d+)?$/.test(s.averageText) ? Number(s.averageText) : null;
  const m = s.averageLabel && /average rating ([\d.]+) out of 5/i.exec(s.averageLabel);
  const value = fromText ?? (m ? Number(m[1]) : null);
  if (s.averageLabel && (value === null || !(value > 0 && value <= 5))) throw new Error(`Cannot read the average rating from "${s.averageLabel}" / "${s.averageText}"`);
  return value;
}

const localDay = () => new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD, in this computer's time zone

async function shot(page, name) {
  const file = path.join(os.tmpdir(), `twoticks-${name}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  return file;
}

// --- run -----------------------------------------------------------------------------------------------------------
const pw = playwright();
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-reviews-'));
const ctx = await pw.chromium.launchPersistentContext(profile, {
  executablePath: chromium(), headless: true, locale: 'en-US', viewport: { width: 1280, height: 1000 },
});
let page;
try {
  page = ctx.pages()[0] || (await ctx.newPage());

  // 1. TwoTicks' page: the average and the number of ratings.
  await open(page, `${cfg.storeUrl}?hl=en`);
  const summary = await readSummary(page);
  if (summary.name !== cfg.name) console.warn(`Note: the store calls the item "${summary.name}", site.config.json "${cfg.name}".`);
  const avg = average(summary);
  let count = 0;
  if (summary.countText) {
    const c = ratingCount(summary.countText);
    if (!c) throw new Error(`Cannot read the number of ratings from "${summary.countText}"`);
    count = c.count;
    if (c.rounded) {
      // In English the store rounds large numbers ("3.9K ratings"); in German it writes them out below a million
      // ("3855 Bewertungen", "12.345 Bewertungen").
      await open(page, `${cfg.storeUrl}?hl=de`);
      const de = await page.evaluate(() => [...document.querySelectorAll('main a, main p')].map((e) => e.textContent.trim()).find((t) => /^\d[\d.]*\s+Bewertung(en)?$/.test(t)));
      if (de) count = Number(de.replace(/\D/g, ''));
      else console.warn(`Note: the store rounds the number of ratings ("${summary.countText}"); kept as ${count}.`);
    }
  }
  if (avg === null && count) throw new Error(`The store shows ${count} ratings but no average`);
  const detailShot = args.has('--shots') ? await shot(page, 'store-detail') : null;

  // 2. The reviews page: every review.
  await open(page, `${cfg.storeUrl}/reviews?hl=en`);
  const head = await readSummary(page);
  if (head.averageText !== summary.averageText || head.countText !== summary.countText) {
    console.warn(`Note: the reviews page shows "${head.averageText}" / "${head.countText}", the item's page "${summary.averageText}" / "${summary.countText}".`);
  }
  const raw = await readReviews(page);
  const reviewsShot = args.has('--shots') ? await shot(page, 'store-reviews') : null;

  const problems = [];
  const seen = new Set();
  const reviews = [];
  raw.forEach((r, i) => {
    const key = r.id || `${r.author}|${r.date}|${r.text}`;
    if (seen.has(key)) return;
    seen.add(key);
    const review = { author: shortName(r.author), rating: stars(r.stars), date: isoDate(r.date), text: r.text.replace(/\r\n?/g, '\n').trim() };
    const where = `review ${i + 1} ("${r.author.trim()}", "${r.date.trim()}")`;
    if (!review.author) problems.push(`${where}: no author`);
    if (review.rating === null) problems.push(`${where}: cannot read the stars from "${r.stars}"`);
    if (review.date === null) problems.push(`${where}: cannot read the date "${r.date.trim()}"`);
    if (r.cut) problems.push(`${where}: the text is still cut short ("Show more")`);
    reviews.push(review);
  });
  if (reviews.length && raw.every((r) => !r.hasText)) problems.push('no review has a text: the page has changed');
  if (problems.length) throw new Error(`The reviews page does not look as expected:\n  ${problems.join('\n  ')}`);
  if (!reviews.length && !args.has('--allow-empty')) throw new Error('Found no review on the reviews page (use --allow-empty if the store really has none)');
  reviews.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)); // newest first; a day keeps the store's order

  const data = { read: localDay(), average: avg, count, reviews };
  console.log(`Read ${reviews.length} review${reviews.length === 1 ? '' : 's'}; average ${avg ?? '-'} from ${count} rating${count === 1 ? '' : 's'}.`);
  for (const r of reviews) console.log(`  ${r.date}  ${'*'.repeat(r.rating).padEnd(5)}  ${r.author.padEnd(16)} ${r.text.replace(/\s+/g, ' ').slice(0, 70)}${r.text.length > 70 ? '...' : ''}`);
  if (detailShot) console.log(`Pictures: ${detailShot}\n          ${reviewsShot}`);

  let old = null;
  try { old = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch { /* none yet */ }
  if (old && Array.isArray(old.reviews) && old.reviews.length > reviews.length) {
    console.warn(`Note: ${old.reviews.length - reviews.length} review(s) fewer than in the file before (${old.reviews.length}); authors or Google can remove reviews.`);
  }
  if (args.has('--dry-run')) {
    console.log('Dry run: nothing written.');
  } else {
    fs.writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`Wrote ${path.relative(ROOT, OUT)}`);
  }
} catch (e) {
  const file = page ? await shot(page, 'reviews-error') : null;
  console.error(`${e.message}${file ? `\nThe page at that moment: ${file}` : ''}\n${path.relative(ROOT, OUT)} is unchanged.`);
  process.exitCode = 1;
} finally {
  await ctx.close();
  fs.rmSync(profile, { recursive: true, force: true });
}
