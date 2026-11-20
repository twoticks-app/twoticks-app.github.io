# TwoTicks site

The site of the Chrome extension TwoTicks ("TwoTicks for WApp-Web"): what it adds to WhatsApp Web and how to add it to Google Chrome from the Chrome Web Store, in twelve languages. English is at the root; the other languages are in their own folders (de, es, fr, it, pt-br, pt-pt, tr, ru, ar, hi, id).

Address: https://twoticks-app.github.io/

TwoTicks is installed only from its page in the Chrome Web Store: https://chromewebstore.google.com/detail/twoticks-for-wapp-web/goajkkkmjngpbedafmgffkkhfnmkkgon

## How the site is made

`node build.mjs` writes the site into `dist/`: in each language the home page, the version history (`versions/`) and a page for each of the thirteen tools (`tools/<tool>/`, for example `tools/scheduler/` or `tr/tools/scheduler/`), with the tool's film, its screenshot where there is one, the store's words for it and the panel's. GitHub Actions (`.github/workflows/pages.yml`) runs it on every push to `main` and publishes `dist/` on GitHub Pages. The site needs no packages: Node 22 or newer is enough.

| Where | What |
|---|---|
| `src/page.mjs` | The pages (the home page and the page of a tool), as templates for every language |
| `site.config.json` | The addresses, the languages, and the tools with their films and screenshots |
| `src/styles.css`, `src/app.js` | Its look and its script (the ticks of the install steps, the notice for other browsers, the language menu, the film) |
| `i18n/<language>.json` | The site's own texts in each language |
| `content/listing/<language>.txt` | The Chrome Web Store description in each language (copied from `store/listing/1.1.0/` of the extension): the tools, the price, the permissions, the support line |
| `content/panel.json` | The panel's own words for each tool in each language (title, text, hint), read from the extension by `tools/panel-texts.cjs` |
| `content/chrome-ui.json` | Chrome's own words in each language ('Add "$1"?', "Add extension", "Pin", "Remove from Chrome" and more), read from Chrome by `tools/chrome-ui.cjs` |
| `content/webstore.json` | The Chrome Web Store's words in each language ("Add to Chrome" and the store's name), read from the store's page |
| `content/whatsnew/<version>.json`, `src/whatsnew.mjs` | What's new in each version, in each language, with the day the store published it (`"date"`): the latest on the home pages while `"whatsNew"` in `site.config.json` says so, all of them on the version history page (`versions/`) |
| `content/reviews.json`, `content/reviews-i18n.json`, `src/reviews.mjs` | The reviews of TwoTicks in the Chrome Web Store, read by `tools/reviews.mjs` (names shortened), with their words in each language; shown on the home pages while `"reviews"` in `site.config.json` says so |
| `src/parts/*.css` | The look of such parts, added to the stylesheet after `src/styles.css` |
| `src/fonts/`, `src/fonts.css` | IBM Plex, served from the site itself (`tools/fonts.mjs`; licence in `licenses/`) |
| `src/img/` | Screenshots and the icons (`tools/images.py`, from the extension's store pictures); the link preview of each language, `og-<language>.png` (`tools/og-images.mjs`); the films' posters (`tools/film-frames.py`, from the films' own YouTube thumbnails, so nothing loads from YouTube before a click) |

## Commands

```
node build.mjs                      the site into dist/
node tools/serve.mjs                look at dist/ on http://localhost:8723/
node tools/chrome-ui.cjs --pak-only Chrome's words again, from the installed Google Chrome
node tools/panel-texts.cjs "<extension folder>"   the panel's words again, from the extension
python -I tools/film-frames.py "<project folder>"   the films' posters again
node tools/og-images.mjs "<project folder>"        the link previews again
node tools/reviews.mjs                              the store's reviews again
node tools/new-version.mjs <version>                a new version of TwoTicks (see below)
```

## A new version of TwoTicks

When the extension has the new version's store descriptions (`store/listing/<version>/`), one command brings them onto the site:

```
node tools/new-version.mjs <version> [--whats-new] [--publish]
```

It first checks that all twelve descriptions have the structure `build.mjs` reads, and stops before changing anything when one does not. Then it copies them to `content/listing/` (`pt_BR` and `pt_PT` become `pt-BR` and `pt-PT`), reads the panel's texts again into `content/panel.json`, builds the site and shows what changed. With `--whats-new` the home pages show the version's changes from `content/whatsnew/<version>.json` (write that file first, like `content/whatsnew/1.1.0.json`), and the command writes the day into it, so the version history lists the version too; `"whatsNew"` in `site.config.json` switches the home pages' part on and off. With `--publish` it commits and pushes, and GitHub Actions publishes the site.

The page sets no cookies and has no analytics. The film loads from YouTube (youtube-nocookie.com) only when someone presses play.

Copyright (c) 2026 Osman Bodur. All rights reserved. TwoTicks is not affiliated with, endorsed by or sponsored by WhatsApp or Meta.
