// Copyright (c) 2026 Osman Bodur. All rights reserved.
// The reviews section of a page, as HTML: the average rating and the number of ratings of TwoTicks in the Chrome Web
// Store, every review that tools/reviews.mjs read from the store (content/reviews.json), newest first, and a link to
// all reviews in the store. Without reviews it gives ''.
// Its words, per language, are in content/reviews-i18n.json:
//   title    the heading of the section
//   summary  beside the average: the number of ratings, {count} (a language may also use {average})
//   stars    what a screen reader says for a row of stars, {n} ("4.8" for the average, "5" for one review)
//   all      the link to the reviews in the store
//   note     (may be left out) where the reviews come from and when they were read, {date}
//   hint     (may be left out) how to see the reviews of every language in the store: {language} and
//            {allLanguages} are the store's own words for its menu, given in "labels" and set like Chrome's words
// Every text may use {store}. A text is a string, or an object of plural forms ("zero", "one", "two", "few", "many",
// "other") chosen with Intl.PluralRules by {count} (summary) or by {n} (stars); "other" stands in for a missing form.
// The reviews stay as written, in their own languages. Their language is unknown, so they get no lang attribute, but
// dir="auto", so that each one runs in its own direction on the Arabic page as well. Its look is in
// src/parts/reviews.css (with the site's .sec-head, .btn, .btn-line and .ui from styles.css).
// Usage: renderReviews({ data, code, esc, texts, storeName, reviewsUrl, locale }) gives the section's HTML, indented
// for its place in src/page.mjs, or '' when there is no review.
//   data        the parsed content/reviews.json
//   code        the page's language code, as in site.config.json ("en", "pt-BR", ...)
//   esc         the page's escape for text (src/page.mjs)
//   texts       the parsed content/reviews-i18n.json, [code]
//   storeName   the store's name in that language, as plain text (i18n "store.name")
//   reviewsUrl  the store's reviews page in that language (with ?hl=)
//   locale      (optional) the Intl locale for numbers and dates (site.config.json "intl", such as "ar-u-nu-latn");
//               without it, code
// It stops the build (throws) on a review without author, stars from 1 to 5 or a date, and on a missing text.

// A five-pointed star with sharp points in a 24 x 24 box, and five of them in a row.
const GAP = 4;
const STAR = Array.from({ length: 10 }, (_, k) => {
  const a = ((k * 36 - 90) * Math.PI) / 180;
  const r = k % 2 ? 5.4 : 11.5;
  return [12 + r * Math.cos(a), 13.1 + r * Math.sin(a)];
});
const points = (dx) => STAR.map(([x, y]) => `${+(x + dx).toFixed(2)},${+y.toFixed(2)}`).join(' ');
const ROW = [0, 1, 2, 3, 4].map((i) => points(i * (24 + GAP)));
const ONE = points(0);
const WIDTH = 5 * 24 + 4 * GAP;

// Five stars, filled up to value (4.8: four full ones and most of the fifth), as one picture whose text is label.
// The part of a star is a nested <svg>, which shows only what lies inside its own width (no ids, no style attributes).
function starRow(value, label, cls) {
  let off = '';
  let on = '';
  for (let i = 0; i < 5; i++) {
    const part = Math.max(0, Math.min(1, value - i));
    if (part >= 0.995) { on += `<polygon points="${ROW[i]}"/>`; continue; }
    off += `<polygon points="${ROW[i]}"/>`;
    if (part > 0.005) {
      const w = +(24 * part).toFixed(2);
      on += `<svg x="${i * (24 + GAP)}" y="0" width="${w}" height="24" viewBox="0 0 ${w} 24"><polygon points="${ONE}"/></svg>`;
    }
  }
  return `<svg class="${cls}" viewBox="0 0 ${WIDTH} 24" role="img" aria-label="${label}" focusable="false">${off ? `<g class="rv-off">${off}</g>` : ''}<g class="rv-on">${on}</g></svg>`;
}

// The store's bag, as on the site's other links into the store.
const STORE_ICON = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M4 9h16l-1 12H5L4 9zM8 9V6a4 4 0 0 1 8 0v3"/></svg>';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const asDate = (s) => {
  const d = DAY.test(String(s)) ? new Date(`${s}T00:00:00Z`) : null;
  return d && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s ? d : null;
};

export function renderReviews({ data, code, esc, texts, storeName, reviewsUrl, locale = code }) {
  const list = data && Array.isArray(data.reviews) ? data.reviews : [];
  if (!list.length) return '';
  const where = `content/reviews-i18n.json ${code}`;
  if (!texts) throw new Error(`${where}: no texts`);
  for (const k of ['title', 'summary', 'stars', 'all']) if (!texts[k]) throw new Error(`${where}: no "${k}"`);

  // The reviews: checked, newest first (a day keeps the order of the file, which is the store's).
  const bad = (i, what) => new Error(`content/reviews.json: review ${i + 1} ${what}`);
  const reviews = list.map((r, i) => {
    if (!r || typeof r.author !== 'string' || !r.author.trim()) throw bad(i, 'has no author');
    if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) throw bad(i, `has the rating ${r.rating}`);
    const day = asDate(r.date);
    if (!day) throw bad(i, `has the date ${r.date}`);
    if (typeof r.text !== 'string') throw bad(i, 'has no text');
    return { ...r, day };
  }).sort((a, b) => b.day - a.day);
  const average = typeof data.average === 'number' && data.average > 0 && data.average <= 5 ? data.average : null;
  const count = Number.isInteger(data.count) && data.count > 0 ? data.count : 0;

  const num = new Intl.NumberFormat(locale);
  const avgNum = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const plural = new Intl.PluralRules(locale);
  const pluralAvg = new Intl.PluralRules(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const longDay = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' });

  // The words people wrote: escaped, and with { } and $ as character references, so that the build's checks for
  // placeholders left in the page ({name}, $1) do not stop at a review that happens to contain them.
  const own = (s) => esc(s).replace(/[{}$]/g, (c) => `&#${c.charCodeAt(0)};`);
  const labels = texts.labels || {};
  const chip = (s) => `<span class="ui">${esc(s)}</span>`;
  const values = {
    store: esc(storeName),
    count: num.format(count),
    average: average === null ? '' : avgNum.format(average),
    date: asDate(data.read) ? longDay.format(asDate(data.read)) : '',
    ...(labels.language ? { language: chip(labels.language) } : {}),
    ...(labels.allLanguages ? { allLanguages: chip(labels.allLanguages) } : {}),
  };
  // A text with its plural form chosen by n (with rules), its own words escaped and its {placeholders} filled.
  const say = (key, extra = {}, n = count, rules = plural) => {
    let text = texts[key];
    if (text && typeof text === 'object') text = text[rules.select(n)] ?? text.other;
    if (typeof text !== 'string') throw new Error(`${where}: "${key}" has no form for ${n}`);
    const all = { ...values, ...extra };
    return esc(text).replace(/\{([a-zA-Z]+)\}/g, (m, k) => {
      if (!(k in all) || all[k] === '') throw new Error(`${where} ${key}: no value for {${k}}`);
      return all[k];
    });
  };
  const starsLabel = (n, shown, rules) => say('stars', { n: shown }, n, rules);

  const score = average !== null && count > 0 ? `
        <div class="rv-score">
          <span class="rv-avg" aria-hidden="true">${values.average}</span>
          <div class="rv-score-side">
            ${starRow(average, starsLabel(average, values.average, pluralAvg), 'rv-stars rv-stars-big')}
            <p class="rv-summary">${say('summary')}</p>
          </div>
        </div>` : '';
  const note = texts.note && values.date ? `
        <p class="rv-note">${say('note')}</p>` : '';
  const cards = reviews.map((r) => `
        <li class="rv-item">
          <figure class="rv-card">
            ${starRow(r.rating, starsLabel(r.rating, num.format(r.rating), plural), 'rv-stars')}${r.text.trim() ? `
            <blockquote class="rv-quote"><p dir="auto">${own(r.text.trim())}</p></blockquote>` : ''}
            <figcaption class="rv-by"><bdi class="rv-author">${own(r.author.trim())}</bdi> <time class="rv-date" datetime="${r.date}">${longDay.format(r.day)}</time></figcaption>
          </figure>
        </li>`).join('');
  const hint = texts.hint ? `
        <p class="rv-hint">${say('hint')}</p>` : '';

  return `  <section id="reviews" class="reviews" aria-labelledby="reviews-title">
    <div class="wrap">
      <header class="sec-head rv-head">
        <h2 id="reviews-title">${say('title')}</h2>${score}${note}
      </header>
      <ul class="rv-list" role="list">${cards}
      </ul>
      <div class="rv-foot">
        <a class="btn btn-line rv-all" href="${esc(reviewsUrl)}">${STORE_ICON}<span>${say('all')}</span></a>${hint}
      </div>
    </div>
  </section>`;
}
