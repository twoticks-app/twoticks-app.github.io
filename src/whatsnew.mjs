// Copyright (c) 2026 Osman Bodur. All rights reserved.
// The "What's new" section of the home page: the changes of one version of TwoTicks in the page's language, between
// the hero and the install steps. Its texts are in content/whatsnew/<version>.json:
//   { "version": "1.1.0", "date": "2026-11-20", "texts": { "<code>": { "title": "...", "items": ["...", "..."] } } }
// "date" is the day the Chrome Web Store published the version (tools/new-version.mjs --whats-new writes it); the
// version history page (renderVersions in src/page.mjs) lists every version that has one.
// site.config.json says which version the page shows and whether it shows one at all: "whatsNew": { "version", "show" }.
// Its look is in src/parts/whatsnew.css.
// Usage: renderWhatsNew({ data, code, esc, more }) gives the section's HTML (indented for its place in src/page.mjs,
// where render() puts c.whatsNewHtml), or '' when data has no texts for that language.
//   data  the parsed content/whatsnew/<version>.json
//   code  the page's language code, as in site.config.json ("en", "pt-BR", ...)
//   esc   the page's escape for text (src/page.mjs)
//   more  (may be left out) { href, text }: a link under the heading, to the version history

export function renderWhatsNew({ data, code, esc, more }) {
  const texts = data && data.texts ? data.texts[code] : null;
  if (!texts || typeof texts.title !== 'string' || !texts.title.trim() || !Array.isArray(texts.items)) return '';
  const items = texts.items.filter((s) => typeof s === 'string' && s.trim());
  if (!items.length) return '';
  return `  <section id="whats-new" class="whats-new" aria-labelledby="whats-new-title">
    <div class="wrap">
      <div class="wn-head">
        <h2 id="whats-new-title">${esc(texts.title)}</h2>${more ? `
        <p class="wn-more"><a href="${esc(more.href)}">${esc(more.text)}</a></p>` : ''}
      </div>
      <ul class="wn-list">
${items.map((s) => `        <li>${esc(s)}</li>`).join('\n')}
      </ul>
    </div>
  </section>`;
}
