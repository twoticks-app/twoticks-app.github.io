// Copyright (c) 2026 Osman Bodur. All rights reserved.
// The "What's new" section of the home page: the changes of one version of TwoTicks in the page's language, between
// the hero and the install steps. Its texts are in content/whatsnew/<version>.json:
//   { "version": "1.1.0", "texts": { "<code>": { "title": "...", "items": ["...", "..."] } } }
// site.config.json says which version the page shows and whether it shows one at all: "whatsNew": { "version", "show" }.
// Its look is in src/parts/whatsnew.css.
// Usage: renderWhatsNew({ data, code, esc }) gives the section's HTML (indented for its place in src/page.mjs, where
// render() puts c.whatsNewHtml), or '' when data has no texts for that language.
//   data  the parsed content/whatsnew/<version>.json
//   code  the page's language code, as in site.config.json ("en", "pt-BR", ...)
//   esc   the page's escape for text (src/page.mjs)

export function renderWhatsNew({ data, code, esc }) {
  const texts = data && data.texts ? data.texts[code] : null;
  if (!texts || typeof texts.title !== 'string' || !texts.title.trim() || !Array.isArray(texts.items)) return '';
  const items = texts.items.filter((s) => typeof s === 'string' && s.trim());
  if (!items.length) return '';
  return `  <section id="whats-new" class="whats-new" aria-labelledby="whats-new-title">
    <div class="wrap">
      <h2 id="whats-new-title">${esc(texts.title)}</h2>
      <ul class="wn-list">
${items.map((s) => `        <li>${esc(s)}</li>`).join('\n')}
      </ul>
    </div>
  </section>`;
}
