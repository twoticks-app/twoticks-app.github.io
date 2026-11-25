# TwoTicks site

The site of the Chrome extension TwoTicks ("TwoTicks for WApp-Web"): what it adds to WhatsApp Web and how to add it to Google Chrome from the Chrome Web Store, in twelve languages. English is at the root; the other languages are in their own folders (de, es, fr, it, pt-br, pt-pt, tr, ru, ar, hi, id).

Address: https://twoticks-app.github.io/

TwoTicks is installed only from its page in the Chrome Web Store: https://chromewebstore.google.com/detail/twoticks-for-wapp-web/goajkkkmjngpbedafmgffkkhfnmkkgon

## How the site is made

`node build.mjs` writes the site into `dist/`: in each language the home page, the version history (`versions/`), a page for each of the thirteen tools (`tools/<tool>/`, for example `tools/scheduler/` or `tr/tools/scheduler/`), with the tool's film, its screenshot where there is one, the store's words for it and the panel's, and the page of TwoTicks MCP (`mcp/`, `tr/mcp/`), the optional program for Windows that lets AI programs on the user's computer use TwoTicks' tools (since TwoTicks 1.3.0, whose settings open that page; every page's header and footer and a question on the home page link to it). In English only, it also writes the extension's privacy policy (`privacy/`, which every page's footer links to and whose address goes into the Chrome Web Store's privacy field) and a page for each of the extension's how-to films (`watch/01/` to `watch/17/`), which the extension's film window opens; those film pages are not linked from the site and not in the sitemap. GitHub Actions (`.github/workflows/pages.yml`) runs it on every push to `main` and publishes `dist/` on GitHub Pages. The site needs no packages: Node 22 or newer is enough.

| Where | What |
|---|---|
| `src/page.mjs` | The pages (the home page, the page of a tool, the version history and the privacy policy), as templates for every language |
| `site.config.json` | The addresses (`privacyUrl`: the privacy policy's page on this site), the languages, and the tools with their screenshots and films: the tool's film, its step-by-step film (`steps`), its everyday stories (`stories`) and further films (`more`); the home page's further films (`youtube.more`) |
| `src/styles.css`, `src/app.js` | Its look and its script (the ticks of the install steps, the notice for other browsers, the language menu, the film) |
| `i18n/<language>.json` | The site's own texts in each language |
| `content/listing/<language>.txt` | The Chrome Web Store description in each language (copied from `store/listing/1.2.0/` of the extension): the tools, the price, the permissions, the support line |
| `content/privacy-policy.md`, `src/markdown.mjs`, `src/parts/doc.css` | The extension's privacy policy, a copy of its `store/privacy-policy.md`, shown in English at `privacy/`; `src/markdown.mjs` turns its headings, paragraphs, lists, tables, bold words and links into HTML and escapes everything else |
| `content/privacy-policy-i18n/<language>.md`, `tools/privacy-i18n.py` | The privacy policy in the site's other languages, each at its language's `privacy/` (for example `tr/privacy/`): translations of `content/privacy-policy.md`, whose English text stays the binding one at `privacy/` (the store's privacy field). Each page starts with a note that says so and links to the English text; each language's footer and questions link to its own translation. A translation's first line names the English text's date line it was made from (`<!-- en: Last updated: ... -->`); while that is not the English text's own, `build.mjs` warns and that language links to the English text, so a changed policy never shows in an old translation. `tools/privacy-i18n.py` cuts the English text into the lines to translate and puts a language's translated lines back together, with the panel's own words for its buttons and tools (from the extension's `lang/<language>.js`) |
| `content/films-i18n.json` | The same films made in other languages (so far Turkish): under each English film's YouTube id, the language's YouTube id, title, length and cover, written by `tools/films-i18n.py` from the TwoTicks project (the covers' `manifest.json`, the status table of `store/youtube/YOUTUBE-<language>.md`, the films' files). That language's pages show these films, their titles in the language and their length line in it (`video.metaLocal` in `i18n/<language>.json`, for example "Türkçe"); a film the file does not list stays English there, marked as English |
| `content/films.json`, `src/watch.mjs` | The extension's how-to films (number, YouTube video, length and the panel's English title), read from its `films.js` and `lang/en.js` by `tools/films.cjs`; one page each at `watch/<number>/`: YouTube's privacy-enhanced player on black and nothing else (no script, no font), because YouTube refuses that player inside an extension's page or on its own ("Error 153"). A film made in another language (`content/films-i18n.json`) has a second page at `watch/<number>/<language>/` (Turkish: `watch/01/tr/`), which the extension opens since 1.2.2 when its panel speaks that language |
| `content/panel.json` | The panel's own words for each tool in each language (title, text, hint), read from the extension by `tools/panel-texts.cjs`; under `mcp` the tools for AI programs (the extension's `mcp-tools.js`: name, group, whether the user confirms) and the settings' words for them in each language (the tab, its switch and buttons, the groups' and tools' names) and the words of the window in which the user confirms a message, which the TwoTicks MCP page quotes |
| `content/chrome-ui.json` | Chrome's own words in each language ('Add "$1"?', "Add extension", "Pin", "Remove from Chrome", the permission "Communicate with cooperating native applications" and its "Allow", and more), read from Chrome by `tools/chrome-ui.cjs` |
| `src/page.mjs` (`renderMcp`), `src/parts/mcp.css`, `"mcp"` in `site.config.json` | The TwoTicks MCP page: first an example (a terminal box in the site's colours with two requests and TwoTicks' confirmation window, three points beside it; its texts are `mcp.term.*` in `i18n/`, the names in it are invented and each language has its own), then how it works, what it needs, its setup in three steps with the commands (copy buttons from `src/app.js`; while `"interim": true` stands in `"mcp"` of `site.config.json`, the page also says what the version `newIn` adds and how the settings tab of the version `minVersion` differs: on the day `newIn` is published, set `"interim": false` and `"minVersion"` to it), five points for Claude Code users (`mcp.cc.*`: where the install command adds the server, a new session, Claude Code's own question, the confirmation on WhatsApp Web, "Claude Code: not found"), the tools in their groups, the user's confirmation, attachments, privacy, other AI programs, status and removal; `site.config.json` gives the versions and the commands, and `"show"` switches the page, its entry in the header's navigation ("MCP"), its footer link and its question on the home page on and off (it goes live with TwoTicks 1.3.0, once the program is on npm) |
| `content/webstore.json` | The Chrome Web Store's words in each language ("Add to Chrome" and the store's name), read from the store's page |
| `content/whatsnew/<version>.json`, `src/whatsnew.mjs` | What's new in each version, in each language, with the day the store published it (`"date"`): the latest on the home pages while `"whatsNew"` in `site.config.json` says so, all of them on the version history page (`versions/`) |
| `content/reviews.json`, `content/reviews-i18n.json`, `src/reviews.mjs` | The reviews of TwoTicks in the Chrome Web Store, read by `tools/reviews.mjs` (names shortened), with their words in each language; shown on the home pages while `"reviews"` in `site.config.json` says so |
| `src/parts/*.css` | The look of such parts, added to the stylesheet after `src/styles.css` |
| `src/fonts/`, `src/fonts.css` | IBM Plex, served from the site itself (`tools/fonts.mjs`; licence in `licenses/`) |
| `src/img/` | Screenshots and the icons (`tools/images.py`, from the extension's store pictures): the five screenshots in English and in every language the store has them in, `<name>-<code>-<width>`, and each language's pages show their own (both Portuguese sites `pt`, the panel's one Portuguese); the link preview of each language, `og-<language>.png` (`tools/og-images.mjs`); the films' posters (`tools/film-frames.py`, from the films' own YouTube thumbnails, and for the films of `content/films-i18n.json` from that language's covers, so nothing loads from YouTube before a click) |

## Commands

```
node build.mjs                      the site into dist/
node tools/serve.mjs                look at dist/ on http://localhost:8723/
node tools/chrome-ui.cjs --pak-only Chrome's words again, from the installed Google Chrome
node tools/panel-texts.cjs "<extension folder>"   the panel's words again, from the extension
node tools/films.cjs "<extension folder>"         the list of how-to films again, from the extension
python -I tools/privacy-i18n.py "<project folder>" prepare <work>   the privacy policy's lines to translate (<work>/segments.json)
python -I tools/privacy-i18n.py "<project folder>" assemble <work> <language> <lines.json>   a language's translation from its translated lines
python -I tools/films-i18n.py "<project folder>" tr   the site's films in Turkish again (then the posters)
python -I tools/film-frames.py "<project folder>"   the films' posters again
node tools/og-images.mjs "<project folder>"        the link previews again
node tools/reviews.mjs                              the store's reviews again
node tools/new-version.mjs <version>                a new version of TwoTicks: store texts, privacy policy, panel words, films (see below)
```

## A new version of TwoTicks

When the extension has the new version's store descriptions (`store/listing/<version>/`), one command brings them onto the site:

```
node tools/new-version.mjs <version> [--whats-new] [--publish]
```

It first checks that all twelve descriptions have the structure `build.mjs` reads and that the extension's privacy policy has its title and its "Last updated:" line, and stops before changing anything when one does not. Then it copies the descriptions to `content/listing/` (`pt_BR` and `pt_PT` become `pt-BR` and `pt-PT`) and the privacy policy (`store/privacy-policy.md`) to `content/privacy-policy.md`, reads the panel's texts again into `content/panel.json` and the list of films into `content/films.json`, builds the site and shows what changed. Before a version goes to the store for review, the site must already carry its privacy policy and its film pages (the store's privacy field points to `privacy/`, and the version's film window opens `watch/<number>/`). Run this command then; or, while the version's store descriptions are not written yet, copy `store/privacy-policy.md` of the extension to `content/privacy-policy.md` and run `node tools/films.cjs "<extension folder>"`, then build, look and push. With `--whats-new` the home pages show the version's changes from `content/whatsnew/<version>.json` (write that file first, like `content/whatsnew/1.1.0.json`), and the command writes the day into it, so the version history lists the version too; `"whatsNew"` in `site.config.json` switches the home pages' part on and off. With `--publish` it commits and pushes, and GitHub Actions publishes the site.

When the extension's privacy policy changes, its translations no longer match it: the build says so and those languages link to the English text until they are translated again (`tools/privacy-i18n.py prepare`, then the lines through DeepL, at most 5000 characters per request, then `assemble` for each language).

The page sets no cookies and has no analytics. The film loads from YouTube (youtube-nocookie.com) only when someone presses play. A film page under `watch/` loads YouTube's player as soon as it opens; the extension opens one only when its user clicks a film.

Copyright (c) 2026 Osman Bodur. All rights reserved. TwoTicks is not affiliated with, endorsed by or sponsored by WhatsApp or Meta.
