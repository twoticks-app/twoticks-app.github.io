// Copyright (c) 2026 Osman Bodur. All rights reserved.
// Serves dist/ for a look before publishing, under the same path as on GitHub Pages (the path of siteUrl), with
// 404.html for missing addresses. Usage: node tools/serve.mjs [port]   (default 8723)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const BASE = new URL(cfg.siteUrl).pathname; // "/" for a site at the root of its address
const PORT = Number(process.argv[2]) || 8723;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/' && BASE !== '/') { res.writeHead(302, { location: BASE }); res.end(); return; }
  let rel = decodeURIComponent(url.pathname);
  rel = rel.startsWith(BASE) ? rel.slice(BASE.length) : null;
  let file = rel === null ? null : path.join(DIST, rel);
  if (file && !file.startsWith(DIST)) file = null;
  if (file && fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!url.pathname.endsWith('/')) { res.writeHead(301, { location: `${url.pathname}/` }); res.end(); return; }
    file = path.join(file, 'index.html');
  }
  if (!file || !fs.existsSync(file)) {
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    res.end(fs.readFileSync(path.join(DIST, '404.html')));
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`TwoTicks site: http://localhost:${PORT}${BASE}`));
