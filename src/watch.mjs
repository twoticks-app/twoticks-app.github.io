// Copyright (c) 2026 Osman Bodur. All rights reserved.
// The film pages (watch/<number>/): the page the extension's film window opens for one of its how-to films
// (content/films.json, copied from the extension's films.js by tools/films.cjs). YouTube's privacy-enhanced player
// refuses to play inside an extension's page or as a page of its own ("Error 153"); inside an ordinary web page it
// plays. So each page is only that player, on black, filling the window: no script, no font, nothing else loaded
// (its content security policy allows the player's frame and the page's own style, no more). The pages are not
// linked from the site, are not in the sitemap and ask search engines not to list them.
// Usage: renderWatch(film, { esc, sha }) gives the page's HTML; film = { n, yt, s, title }.

const STYLE = 'html,body{height:100%;margin:0;background:#000}iframe{display:block;width:100%;height:100%;border:0}';

export function renderWatch(film, { esc, sha }) {
  if (!/^\d{2}$/.test(film.n) || !/^[A-Za-z0-9_-]{11}$/.test(film.yt) || typeof film.title !== 'string' || !film.title.trim()) {
    throw new Error(`content/films.json: film ${JSON.stringify(film)} has no two-digit number, no YouTube video id or no title`);
  }
  const csp = [
    "default-src 'none'",
    `style-src 'sha256-${sha(STYLE, 'base64')}'`,
    'frame-src https://www.youtube-nocookie.com',
    // The site's own icon, so that the film window shows TwoTicks' mark.
    "img-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="robots" content="noindex">
<title>${esc(film.title)} · TwoTicks</title>
<link rel="icon" href="../../assets/img/icon.svg" type="image/svg+xml">
<link rel="icon" href="../../assets/img/icon-32.png" sizes="32x32" type="image/png">
<style>${STYLE}</style>
</head>
<body>
<iframe src="https://www.youtube-nocookie.com/embed/${film.yt}?autoplay=1&amp;rel=0" title="${esc(film.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
</body>
</html>
`;
}
