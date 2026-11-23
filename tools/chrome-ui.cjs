// Copyright (c) 2026 Osman Bodur. All rights reserved.
// Reads the words of Chrome's own interface that the install guide quotes, in every language of the site, so that
// each step names exactly what people see in their Chrome:
// 1. From chrome://extensions, in a Chromium started in that language (Playwright, headless, with one unpacked
//    extension loaded): the page title, "Developer mode", "Load unpacked", "Pack extension", "Update" and the card of
//    an unpacked extension ("Details", "Remove", the reload button, "Unpacked extension").
// 2. From the language files (.pak) of the installed Google Chrome, when there is one: the app menu's "Extensions"
//    and "Manage extensions", "Pin", the install dialog ('Add "$1"?', "Add extension", "Cancel"), "Remove from
//    Chrome", the error Chrome shows for a wrong folder ("Failed to load extension", "Manifest file is missing
//    or unreadable"), and the request for an optional permission that the TwoTicks MCP page quotes ("Communicate with
//    cooperating native applications", "Allow").
// Usage: node tools/chrome-ui.cjs <folder of an unpacked extension>   ->  content/chrome-ui.json
//        node tools/chrome-ui.cjs --pak-only                          (only part 2, keeps part 1 as it is)
// Needs Playwright with its Chromium (npm i -g @playwright/cli); set PLAYWRIGHT or CHROMIUM to other locations.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'content', 'chrome-ui.json');
// Site language -> Chrome's language name. Spanish: Chrome has "es" (Spain) and "es-419" (Latin America); both are
// read, and the site shows the Latin American label beside the other where they differ.
const LANGS = {
  en: 'en-US', de: 'de', es: 'es', 'es-419': 'es-419', fr: 'fr', it: 'it', 'pt-BR': 'pt-BR', 'pt-PT': 'pt-PT',
  ru: 'ru', tr: 'tr', ar: 'ar', hi: 'hi', id: 'id',
};

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

// The labels of chrome://extensions in one language.
async function extensionsPage(pw, exe, ext, lang) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-chrome-ui-'));
  const ctx = await pw.chromium.launchPersistentContext(profile, {
    executablePath: exe,
    headless: true,
    args: [`--lang=${lang}`, `--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  try {
    const page = ctx.pages()[0] || (await ctx.newPage());
    await page.goto('chrome://extensions');
    await page.locator('#detailsButton').first().waitFor({ timeout: 15000 });
    const get = async (sel, attr) => {
      const el = page.locator(sel).first();
      return ((attr ? await el.getAttribute(attr) : await el.textContent()) || '').trim().replace(/\s+/g, ' ');
    };
    return {
      title: (await page.title()).trim(),
      developerMode: await get('#devModeLabel'),
      loadUnpacked: await get('#loadUnpacked'),
      packExtension: await get('#packExtensions'),
      update: await get('#updateNow'),
      details: await get('#detailsButton'),
      remove: await get('#removeButton'),
      reload: await get('#dev-reload-button', 'aria-label'),
      unpacked: await get('#source-indicator-text'),
      search: await get('#prompt'),
    };
  } finally {
    await ctx.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

// Chrome's .pak files (format 5): a table of resource ids and offsets, then the strings.
function readPak(file) {
  const b = fs.readFileSync(file);
  const version = b.readUInt32LE(0);
  if (version !== 5) throw new Error(`${file}: pak format ${version}, expected 5`);
  const count = b.readUInt16LE(8);
  const aliases = b.readUInt16LE(10);
  const map = new Map();
  const entries = [];
  for (let i = 0; i <= count; i++) entries.push([b.readUInt16LE(12 + i * 6), b.readUInt32LE(14 + i * 6)]);
  for (let i = 0; i < count; i++) map.set(entries[i][0], b.toString('utf8', entries[i][1], entries[i + 1][1]));
  const at = 12 + (count + 1) * 6;
  for (let i = 0; i < aliases; i++) {
    const id = b.readUInt16LE(at + i * 4);
    const index = b.readUInt16LE(at + i * 4 + 2);
    map.set(id, map.get(entries[index][0]));
  }
  return map;
}

function chromeLocales() {
  const app = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'Application');
  if (!fs.existsSync(app)) return null;
  const version = fs.readdirSync(app).filter((d) => /^\d+\.\d+\.\d+\.\d+$/.test(d)).sort((a, b) => (a.split('.').map(Number) > b.split('.').map(Number) ? -1 : 1))[0];
  const dir = version && path.join(app, version, 'Locales');
  return dir && fs.existsSync(dir) ? { version, dir } : null;
}

// The app menu's labels: the ids whose English text is the label ("&Extensions" is the menu item, with its
// keyboard mnemonic), read in each language; where several ids carry the same English text, the most common
// translation wins. Mnemonics ("&E", "(&E)") are removed.
function menuLabels(loc) {
  const en = readPak(path.join(loc.dir, 'en-US.pak'));
  const want = {
    extensionsMenu: /^&Extensions$/,
    manageExtensions: /^Manage extensions$/i,
    pin: /^Pin$/,
    failedToLoad: /^Failed to load extension$/,
    manifestError: /^Manifest file is missing or unreadable$/,
    webStore: /^Chrome Web Store$/,
    addTitle: /^Add "\$1"\?$/,
    addExtension: /^Add extension$/,
    removeFromChrome: /^Remove from Chrome$/,
    cancel: /^Cancel$/,
    nativeMessaging: /^Communicate with cooperating native applications$/,
    allow: /^Allow$/,
  };
  const ids = {};
  for (const [key, re] of Object.entries(want)) ids[key] = [...en].filter(([, v]) => re.test(v.trim())).map(([id]) => id);
  const result = {};
  for (const [site, lang] of Object.entries(LANGS)) {
    const file = path.join(loc.dir, `${lang}.pak`);
    if (!fs.existsSync(file)) continue;
    const pak = readPak(file);
    result[site] = {};
    for (const [key, list] of Object.entries(ids)) {
      const counts = new Map();
      for (const id of list) {
        const v = pak.get(id);
        if (v) counts.set(v, (counts.get(v) || 0) + 1);
      }
      const best = [...counts].sort((a, b) => b[1] - a[1])[0];
      if (best) result[site][key] = best[0].replace(/\(&.\)/g, '').replace(/&(.)/g, '$1').trim();
    }
  }
  return { ids, result };
}

(async () => {
  // --pak-only: keep the labels read from chrome://extensions and read the .pak labels again (no browser needed).
  const pakOnly = process.argv.includes('--pak-only');
  const ext = process.argv.slice(2).find((a) => !a.startsWith('--'));
  let labels = {};
  let chromiumVersion = '';
  if (pakOnly) {
    const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    labels = old.labels;
    chromiumVersion = old.playwrightChromium;
  } else {
    if (!ext || !fs.existsSync(path.join(ext, 'manifest.json'))) throw new Error('Usage: node tools/chrome-ui.cjs <folder of an unpacked extension> | --pak-only');
    const pw = playwright();
    const exe = chromium();
    for (const [site, lang] of Object.entries(LANGS)) {
      labels[site] = await extensionsPage(pw, exe, path.resolve(ext), lang);
      console.log(`${site.padEnd(7)} ${labels[site].developerMode} | ${labels[site].loadUnpacked} | ${labels[site].reload}`);
    }
    chromiumVersion = (exe && (exe.match(/chromium-(\d+)/) || [])[1]) || '';
  }
  const loc = chromeLocales();
  let chromeVersion = '';
  if (loc) {
    chromeVersion = loc.version;
    const { ids, result } = menuLabels(loc);
    console.log(`Google Chrome ${loc.version}: menu ids ${JSON.stringify(ids)}`);
    for (const [site, v] of Object.entries(result)) Object.assign(labels[site], v);
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify({ read: new Date().toISOString().slice(0, 10), chrome: chromeVersion, playwrightChromium: chromiumVersion, labels }, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, OUT)}`);
})().catch((e) => { console.error(e); process.exit(1); });
