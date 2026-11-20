# TwoTicks site

The site of the Chrome extension TwoTicks ("TwoTicks for WApp-Web"): what it adds to WhatsApp Web and how to add it to Google Chrome from the Chrome Web Store, in twelve languages. English is at the root; the other languages are in their own folders (de, es, fr, it, pt-br, pt-pt, tr, ru, ar, hi, id).

Address: https://twoticks-app.github.io/

TwoTicks is installed only from its page in the Chrome Web Store: https://chromewebstore.google.com/detail/twoticks-for-wapp-web/goajkkkmjngpbedafmgffkkhfnmkkgon

## How the site is made

`node build.mjs` writes the site into `dist/`, one static page per language. GitHub Actions (`.github/workflows/pages.yml`) runs it on every push to `main` and publishes `dist/` on GitHub Pages. The site needs no packages: Node 22 or newer is enough.

| Where | What |
|---|---|
| `src/page.mjs` | The page, as one template for every language |
| `src/styles.css`, `src/app.js` | Its look and its script (the ticks of the install steps, the notice for other browsers, the language menu, the film) |
| `i18n/<language>.json` | The site's own texts in each language |
| `content/listing/<language>.txt` | The Chrome Web Store description in each language (copied from `store/listing/1.1.0/` of the extension): the tools, the price, the permissions, the support line |
| `content/chrome-ui.json` | Chrome's own words in each language ('Add "$1"?', "Add extension", "Pin", "Remove from Chrome" and more), read from Chrome by `tools/chrome-ui.cjs` |
| `content/webstore.json` | The Chrome Web Store's words in each language ("Add to Chrome" and the store's name), read from the store's page |
| `src/fonts/`, `src/fonts.css` | IBM Plex, served from the site itself (`tools/fonts.mjs`; licence in `licenses/`) |
| `src/img/` | Screenshots, the link preview and the icons (`tools/images.py`, from the extension's store pictures) |

## Commands

```
node build.mjs                      the site into dist/
node tools/serve.mjs                look at dist/ on http://localhost:8723/
node tools/chrome-ui.cjs --pak-only Chrome's words again, from the installed Google Chrome
```

## Before a new version

When the store gets a new description, copy `store/listing/<version>/description.<locale>.txt` of the extension to `content/listing/` (`pt_BR` and `pt_PT` become `pt-BR` and `pt-PT`) and build again. The structure of the description (its groups and bullets) must stay the same in all twelve languages; `build.mjs` stops when it does not.

The page sets no cookies and has no analytics. The film loads from YouTube (youtube-nocookie.com) only when someone presses play.

Copyright (c) 2026 Osman Bodur. All rights reserved. TwoTicks is not affiliated with, endorsed by or sponsored by WhatsApp or Meta.
