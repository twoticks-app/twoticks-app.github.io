// Copyright (c) 2026 Osman Bodur. All rights reserved.
// Reads, for every tool of TwoTicks, the title and the description that its panel shows above the tool (and a hint
// where the panel gives one), in every language of the site, from the extension's own translations (i18n.js and
// lang/*.js, loaded the way the extension's tests load them). The tool pages quote them, so a page says what the
// panel says. Portuguese: the extension has one Portuguese (Brazilian), used for both Portuguese pages.
// Usage: node tools/panel-texts.cjs "<TwoTicks extension folder>"   ->  content/panel.json
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'content', 'panel.json');
// Site language -> the extension's language.
const LANGS = { en: 'en', de: 'de', es: 'es', fr: 'fr', it: 'it', 'pt-BR': 'pt', 'pt-PT': 'pt', tr: 'tr', ru: 'ru', ar: 'ar', hi: 'hi', id: 'id' };
// The tools in the order of the store listing (privacy, productivity, files), with their key in the panel's texts
// and the hint the page shows below the description, if any.
const TOOLS = [
  ['privacy-screen', 'pv', null],
  ['unanswered-chats', 'un', null],
  ['quick-replies', 'qr', null],
  ['ai-assistant', 'ai', null],
  ['chat-analysis', 'an', null],
  ['scheduler', 'sc', 'sc.hintAuto'],
  ['direct-message', 'dm', 'dm.hintDefault'],
  ['compliments', 'cp', null],
  ['several-chats', 'bk', null],
  ['export-chats', 'chats', null],
  ['export-contacts', 'contacts', null],
  ['download-media', 'media', 'media.hint'],
  ['deleted-messages', 'del', null],
];

const ext = process.argv[2];
if (!ext || !fs.existsSync(path.join(ext, 'i18n.js'))) {
  console.error('Usage: node tools/panel-texts.cjs "<TwoTicks extension folder>"');
  process.exit(1);
}
const box = { navigator: { language: 'en-US', languages: ['en-US'] }, Intl };
box.window = box;
vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(ext, 'i18n.js'), 'utf8'), box);
for (const f of fs.readdirSync(path.join(ext, 'lang')).filter((x) => x.endsWith('.js'))) {
  vm.runInContext(fs.readFileSync(path.join(ext, 'lang', f), 'utf8'), box);
}
const strings = box.TT_I18N.STRINGS;
const version = (JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json'), 'utf8')).version) || '';

const out = { read: new Date().toISOString().slice(0, 10), extensionVersion: version, tools: TOOLS.map(([slug, key]) => ({ slug, key })), texts: {} };
const problems = [];
for (const [site, code] of Object.entries(LANGS)) {
  const s = strings[code];
  if (!s) { problems.push(`${code}: no strings`); continue; }
  // The panel's own placeholders, filled as the panel fills them (injected.js). The token itself ("{Name}" in the
  // language) is a word people type, not a placeholder, so the check below leaves it out.
  const token = s['bk.token'] || strings.en['bk.token'];
  const fill = (text) => String(text).replace(/\{token\}/g, token).replace(/\{keys\}/g, 'Alt+Shift+Q');
  out.texts[site] = {};
  for (const [slug, key, hint] of TOOLS) {
    const title = s[`${key}.title`];
    const desc = s[`${key}.desc`];
    if (typeof title !== 'string' || typeof desc !== 'string') { problems.push(`${code}: ${key}.title or ${key}.desc missing`); continue; }
    const entry = { title, desc: fill(desc) };
    if (hint && typeof s[hint] === 'string') entry.hint = fill(s[hint]);
    for (const v of Object.values(entry)) if (/\{[a-zA-Z]+\}/.test(v.split(token).join(''))) problems.push(`${code} ${key}: placeholder left in "${v.slice(0, 60)}"`);
    out.texts[site][slug] = entry;
  }
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
fs.writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
console.log(`Wrote ${path.relative(ROOT, OUT)}: ${TOOLS.length} tools in ${Object.keys(out.texts).length} languages (extension ${version})`);
