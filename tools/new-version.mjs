// Copyright (c) 2026 Osman Bodur. All rights reserved.
// Brings a new version of TwoTicks onto the site in one command. It copies the version's Chrome Web Store descriptions
// from the extension to content/listing/ (store/listing/<version>/description.<locale>.txt, or
// store/listing/description.<locale>.txt when the version has no folder of its own; pt_BR and pt_PT become pt-BR and
// pt-PT), but only once all of them have the structure build.mjs reads; copies the extension's privacy policy
// (store/privacy-policy.md, to content/privacy-policy.md, the page privacy/); reads the panel's texts again
// (tools/panel-texts.cjs, into content/panel.json) and the list of how-to films (tools/films.cjs, from films.js into
// content/films.json, the pages watch/<number>/); with --whats-new, shows the version's "What's new" on the home page
// (whatsNew in site.config.json, texts in content/whatsnew/<version>.json); builds the site and shows what changed.
// Nothing is committed or pushed without --publish.
// Usage: node tools/new-version.mjs <version> [--ext "<extension folder>"] [--whats-new] [--publish]
//   --ext        the TwoTicks extension folder (default: the folder that holds this site's folder)
//   --whats-new  sets "whatsNew": { "version": "<version>", "show": true } in site.config.json, and writes today as
//                the day of publication ("date") into content/whatsnew/<version>.json when it has none: from then
//                on the version history (versions/) lists the version too. Use it on the day the store publishes it.
//   --publish    afterwards: git add -A, git commit -m "chore: <version> magaza metinleri", git push
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = path.join(ROOT, 'site.config.json');
const USAGE = 'Usage: node tools/new-version.mjs <version> [--ext "<extension folder>"] [--whats-new] [--publish]';
// The blocks of a store description (separated by blank lines) and their lines, in the order build.mjs reads them:
// the intro, privacy, productivity, files, the languages, the price, how to use, the permissions (as many as the
// version asks for, under their heading), the note on "Several chats", the disclaimer, support.
const SHAPE = [1, 4, 9, 5, 1, 2, 4, 'N', 1, 1, 3];
// What this command writes. With --publish, other changes that were there before it ran stop it, because git add -A
// would put them into the version's commit.
const OWN = ['content/listing/', 'content/panel.json', 'content/privacy-policy.md', 'content/films.json', 'content/whatsnew/', 'site.config.json'];

function stop(message) {
  console.error(`\n${message}`);
  process.exit(1);
}
const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');
// A command in the site's folder, its output shown as it comes; true when it ended well.
const run = (cmd, args) => spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit' }).status === 0;
function gitLines(...args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) stop(`git ${args.join(' ')} failed: ${(r.stderr || String(r.error)).trim()}`);
  return r.stdout.split('\n').filter(Boolean);
}

// --- what to do ----------------------------------------------------------------------------------------------------
let version = '';
let ext = path.dirname(ROOT);
let whatsNew = false;
let publish = false;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--ext') ext = argv[++i] || stop(`--ext needs a folder.\n${USAGE}`);
  else if (a.startsWith('--ext=')) ext = a.slice('--ext='.length);
  else if (a === '--whats-new') whatsNew = true;
  else if (a === '--publish') publish = true;
  else if (a === '--help' || a === '-h') { console.log(USAGE); process.exit(0); }
  else if (!a.startsWith('-') && !version) version = a;
  else stop(`Unknown argument "${a}".\n${USAGE}`);
}
if (!version) stop(USAGE);
if (!/^\d+(\.\d+){0,3}$/.test(version)) stop(`"${version}" is not a version such as 1.1.0.`);
ext = path.resolve(ext);

// --- checks, before anything changes -------------------------------------------------------------------------------
const listingDir = path.join(ext, 'store', 'listing');
if (!fs.existsSync(listingDir)) stop(`${ext} has no store/listing/. Is it the TwoTicks extension folder? Name it with --ext.`);
// The privacy policy, as build.mjs reads it: a "# " title and the day of its last change.
const policyFrom = path.join(ext, 'store', 'privacy-policy.md');
const policyTo = path.join(ROOT, 'content', 'privacy-policy.md');
const policyText = fs.existsSync(policyFrom) ? fs.readFileSync(policyFrom, 'utf8') : '';
const policyDate = (/^Last updated: (.+?)\s*$/m.exec(policyText) || [])[1];
if (!/^# \S/m.test(policyText) || !policyDate) stop(`${policyFrom} is missing, or has no "# " title or no "Last updated:" line. Nothing was changed.`);
let codes;
try {
  codes = JSON.parse(fs.readFileSync(CONFIG, 'utf8')).languages.map((l) => l.code);
} catch (e) {
  stop(`site.config.json: ${e.message}`);
}

const whatsNewFile = path.join(ROOT, 'content', 'whatsnew', `${version}.json`);
if (whatsNew) {
  if (!fs.existsSync(whatsNewFile)) {
    stop(`${rel(whatsNewFile)} is missing. Write the version's "What's new" there first (like content/whatsnew/1.1.0.json), or leave out --whats-new.`);
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(whatsNewFile, 'utf8'));
  } catch (e) {
    stop(`${rel(whatsNewFile)}: ${e.message}`);
  }
  if (!data || data.version !== version) stop(`${rel(whatsNewFile)} says "version": "${data && data.version}", not "${version}".`);
  const without = codes.filter((c) => !(data.texts && data.texts[c]));
  if (without.length) console.log(`Note: ${rel(whatsNewFile)} has no texts for ${without.join(', ')}; those pages show no "What's new".`);
}

if (publish) {
  const foreign = gitLines('status', '--porcelain', '--untracked-files=all').filter((line) => {
    const file = line.slice(3).split(' -> ').pop().replace(/^"|"$/g, '');
    return !OWN.some((own) => (own.endsWith('/') ? file.startsWith(own) : file === own));
  });
  if (foreign.length) {
    stop(`--publish commits the whole working tree (git add -A), and it holds changes that are not part of a version update:\n${foreign.map((l) => `  ${l}`).join('\n')}\nCommit them first, or run without --publish.`);
  }
}

try {
  const at = JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json'), 'utf8')).version;
  if (at && at !== version) console.log(`Note: the extension folder is at version ${at} (manifest.json), so content/panel.json gets the panel texts of ${at}.`);
} catch {
  // No manifest to compare with: tools/panel-texts.cjs, below, says what the folder lacks.
}

// --- 1. the store descriptions -------------------------------------------------------------------------------------
const versionDir = path.join(listingDir, version);
const fromDir = fs.existsSync(versionDir) && fs.statSync(versionDir).isDirectory() ? versionDir : listingDir;
const fromRel = path.relative(ext, fromDir).split(path.sep).join('/');
console.log(`Store descriptions of ${version}: ${fromRel}/ in ${ext}${fromDir === listingDir ? ` (there is no store/listing/${version}/)` : ''}`);
const files = codes.map((code) => ({
  code,
  from: path.join(fromDir, `description.${code.replace('-', '_')}.txt`),
  to: path.join(ROOT, 'content', 'listing', `${code}.txt`),
}));
const absent = files.filter((f) => !fs.existsSync(f.from));
if (absent.length) stop(`Not in ${fromDir}: ${absent.map((f) => path.basename(f.from)).join(', ')}`);

const shapes = files.map((f) => fs.readFileSync(f.from, 'utf8').replace(/\r/g, '').trim()
  .split(/\n\s*\n/).map((b) => b.split('\n').filter(Boolean).length));
const wrong = files.filter((f, i) => shapes[i].length !== SHAPE.length
  || SHAPE.some((n, j) => (n === 'N' ? shapes[i][j] < 2 : shapes[i][j] !== n)));
if (wrong.length) {
  stop(`These descriptions do not have the structure build.mjs reads (blocks separated by blank lines, with ${SHAPE.join(',')} lines):\n${wrong.map((f) => `  ${path.basename(f.from)}: ${shapes[files.indexOf(f)].join(',')}`).join('\n')}\nNothing was changed.`);
}
const count = (s) => shapes.filter((x) => String(x) === String(s)).length;
const usual = shapes.reduce((a, b) => (count(b) > count(a) ? b : a));
const odd = files.filter((f, i) => String(shapes[i]) !== String(usual));
if (odd.length) {
  stop(`All ${files.length} descriptions must have the same blocks and lines. Most have ${usual.join(',')}, but:\n${odd.map((f) => `  ${path.basename(f.from)}: ${shapes[files.indexOf(f)].join(',')}`).join('\n')}\nNothing was changed.`);
}
let changed = 0;
for (const f of files) {
  const text = fs.readFileSync(f.from);
  if (fs.existsSync(f.to) && fs.readFileSync(f.to).equals(text)) continue;
  fs.writeFileSync(f.to, text);
  changed++;
}
console.log(`content/listing/: ${files.length} descriptions with the structure ${shapes[0].join(',')}, ${changed} changed`);

// --- 1b. the privacy policy ----------------------------------------------------------------------------------------
const policySame = fs.existsSync(policyTo) && fs.readFileSync(policyTo).equals(fs.readFileSync(policyFrom));
if (!policySame) fs.copyFileSync(policyFrom, policyTo);
console.log(`content/privacy-policy.md: the privacy policy of ${policyDate}, ${policySame ? 'unchanged' : 'copied from store/privacy-policy.md'}`);

// --- 2. the panel's texts and the films ----------------------------------------------------------------------------
console.log('\n> node tools/panel-texts.cjs');
if (!run(process.execPath, [path.join('tools', 'panel-texts.cjs'), ext])) stop('tools/panel-texts.cjs failed (see above).');
console.log('\n> node tools/films.cjs');
if (!run(process.execPath, [path.join('tools', 'films.cjs'), ext])) stop('tools/films.cjs failed (see above).');

// --- 3. What's new -------------------------------------------------------------------------------------------------
if (whatsNew) {
  const cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf8')); // read again, just before writing
  const value = { version, show: true };
  let out = cfg;
  if (Object.hasOwn(cfg, 'whatsNew')) {
    cfg.whatsNew = value;
  } else {
    out = {};
    for (const [key, v] of Object.entries(cfg)) {
      if (key === 'tools') out.whatsNew = value;
      out[key] = v;
    }
    if (!Object.hasOwn(out, 'whatsNew')) out.whatsNew = value;
  }
  fs.writeFileSync(CONFIG, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`\nsite.config.json: "whatsNew": { "version": "${version}", "show": true }`);
  // The day the store published the version (this computer's date), right after "version".
  const notes = JSON.parse(fs.readFileSync(whatsNewFile, 'utf8'));
  if (!notes.date) {
    const date = new Date().toLocaleDateString('sv-SE');
    const { version: v, ...rest } = notes;
    fs.writeFileSync(whatsNewFile, `${JSON.stringify({ version: v, date, ...rest }, null, 2)}\n`);
    console.log(`${rel(whatsNewFile)}: "date": "${date}"`);
  }
}

// --- 4. build, and what changed ------------------------------------------------------------------------------------
console.log('\n> node build.mjs');
const built = run(process.execPath, ['build.mjs']);
console.log('\n> git status --short');
run('git', ['status', '--short']);
console.log('\n> git diff --stat');
run('git', ['diff', '--stat']);
if (!built) stop('node build.mjs failed (see above), so nothing was committed. Fix it and run this again.');

// --- 5. publish ----------------------------------------------------------------------------------------------------
if (!publish) {
  console.log('\nNothing committed. Look at the site with node tools/serve.mjs; run this again with --publish to commit and push.');
  process.exit(0);
}
if (!gitLines('status', '--porcelain').length) {
  console.log('\nNothing to commit: the site already has these texts.');
  process.exit(0);
}
const message = `chore: ${version} magaza metinleri`;
for (const args of [['add', '-A'], ['commit', '-m', message], ['push']]) {
  console.log(`\n> git ${args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`);
  if (!run('git', args)) stop(`git ${args[0]} failed (see above).`);
}
console.log(`\nCommitted and pushed "${message}". GitHub Actions builds the site and publishes it.`);
