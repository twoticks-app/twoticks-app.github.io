// Copyright (c) 2026 Osman Bodur. All rights reserved.
// Reads the how-to films of TwoTicks from the extension, for the site's film pages (watch/<number>/, the pages the
// extension's film window opens): films.js (TT_FILMS: each film's number on the channel, its YouTube video and its
// length) with the English title the panel gives it (a tool's own title, or the film's own title: i18n.js and
// lang/en.js, loaded the way tools/panel-texts.cjs loads them). GitHub builds the site without the extension, so the
// site keeps this copy; tools/new-version.mjs refreshes it.
// Usage: node tools/films.cjs "<TwoTicks extension folder>"   ->  content/films.json
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'content', 'films.json');

const ext = process.argv[2];
if (!ext || !['films.js', 'i18n.js', path.join('lang', 'en.js')].every((f) => fs.existsSync(path.join(ext, f)))) {
  console.error('Usage: node tools/films.cjs "<TwoTicks extension folder>" (the folder with films.js, i18n.js and lang/en.js)');
  process.exit(1);
}
const box = { navigator: { language: 'en-US', languages: ['en-US'] }, Intl };
box.window = box;
vm.createContext(box);
for (const f of ['i18n.js', path.join('lang', 'en.js'), 'films.js']) vm.runInContext(fs.readFileSync(path.join(ext, f), 'utf8'), box, { filename: f });
const en = box.TT_I18N && box.TT_I18N.STRINGS && box.TT_I18N.STRINGS.en;
const list = box.TT_FILMS;
if (!en || !Array.isArray(list) || !list.length) {
  console.error('films.js or lang/en.js did not load: no TT_FILMS or no English strings');
  process.exit(1);
}
const version = (JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json'), 'utf8')).version) || '';

// The page's address holds the number and its player the video: both are checked here, and again by build.mjs.
const problems = [];
const films = list.map((f) => {
  const title = en[f.key];
  if (!/^\d{2}$/.test(f.n)) problems.push(`film ${f.n}: the number is not two digits`);
  if (!/^[A-Za-z0-9_-]{11}$/.test(f.yt)) problems.push(`film ${f.n}: "${f.yt}" is not a YouTube video id`);
  if (!Number.isInteger(f.s) || f.s <= 0) problems.push(`film ${f.n}: no length in seconds`);
  if (typeof title !== 'string' || !title.trim()) problems.push(`film ${f.n}: no English text for its title "${f.key}"`);
  return { n: f.n, yt: f.yt, s: f.s, title };
});
for (const k of ['n', 'yt']) {
  const seen = new Set();
  for (const f of films) {
    if (seen.has(f[k])) problems.push(`two films have the ${k === 'n' ? 'number' : 'video'} ${f[k]}`);
    seen.add(f[k]);
  }
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
fs.writeFileSync(OUT, `${JSON.stringify({ read: new Date().toISOString().slice(0, 10), extensionVersion: version, films }, null, 2)}\n`);
console.log(`Wrote ${path.relative(ROOT, OUT)}: ${films.length} films (extension ${version})`);
