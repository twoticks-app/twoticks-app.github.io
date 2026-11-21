// Copyright (c) 2026 Osman Bodur. All rights reserved.
// A small Markdown reader for the documents the site shows as the extension writes them (the privacy policy,
// content/privacy-policy.md): headings (# to ###), paragraphs (a line break inside one stays a line break), lists
// with "- " or "1. " (one nested level, indented by two spaces or more), tables with "|", **bold**, [words](address),
// and web and e-mail addresses, which become links. Everything else is text: it is escaped and never passed on as
// HTML, and a link goes only to an https:, http: or mailto: address.
// Usage: markdown(source, { esc }) gives { title, html }: the words of the first "# " heading, which the page shows
// itself, and the rest as HTML, each heading with an id made from its words ("## Your rights" -> id="your-rights").
//   esc  the page's escape for text (src/page.mjs)

// The links of a line of escaped text, each found once and left to right: [words](address), a web address, an e-mail
// address. A web address ends before a space, a tag or an escaped quote or angle bracket.
const LINKS = /\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s()<>]+)\)|(https?:\/\/(?:(?!&quot;|&lt;|&gt;)[^\s<])+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
// Punctuation after a web address belongs to the sentence, not to the address.
const TAIL = /[.,;:!?)]+$/;
const HEADING = /^(#{1,3})\s+(.+?)\s*#*\s*$/;
const ITEM = /^(\s*)(?:[-*]|(\d{1,9})\.)\s+(.*)$/;
const ROW = /^\s*\|/;

export function markdown(source, { esc }) {
  const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  const ids = new Map();
  let title = '';

  // Text of one line: escaped first (braces too, so that nothing in a document reads as a placeholder of the page),
  // then the links, then **bold** inside the text between tags.
  const inline = (text) => esc(text)
    .replace(/[{}]/g, (b) => (b === '{' ? '&#123;' : '&#125;'))
    .replace(LINKS, (m, words, href, url, mail) => {
      if (words) return `<a href="${href}">${words}</a>`;
      if (url) {
        const tail = (url.match(TAIL) || [''])[0];
        const bare = url.slice(0, url.length - tail.length);
        return `<a href="${bare}">${bare}</a>${tail}`;
      }
      return `<a href="mailto:${mail}">${mail}</a>`;
    })
    .replace(/(<[^>]+>)|([^<]+)/g, (m, tag, txt) => tag || txt.replace(/\*\*(?=\S)(.+?)\*\*/g, '<strong>$1</strong>'));
  // An id from a heading's words: small letters, digits and hyphens; a second heading of the same words gets "-2".
  const slug = (text) => {
    const base = text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
    const n = (ids.get(base) || 0) + 1;
    ids.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
  const cells = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  const startsBlock = (line) => HEADING.test(line) || ROW.test(line) || ITEM.test(line);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const h = HEADING.exec(line);
    if (h) {
      // The first "# " heading is the document's title; a later one counts as a section.
      if (h[1].length === 1 && !title) title = h[2];
      else {
        const level = Math.max(2, h[1].length);
        out.push(`<h${level} id="${slug(h[2])}">${inline(h[2])}</h${level}>`);
      }
      i++;
      continue;
    }

    if (ROW.test(line)) {
      const rows = [];
      for (; i < lines.length && ROW.test(lines[i]); i++) rows.push(cells(lines[i]));
      // A header row is followed by a row of dashes (|---|---|).
      const ruled = rows.length > 1 && rows[1].every((c) => /^:?-{3,}:?$/.test(c));
      const head = ruled ? `<thead><tr>${rows[0].map((c) => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead>` : '';
      const body = (ruled ? rows.slice(2) : rows).map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('');
      out.push(`<div class="doc-table"><table>${head}<tbody>${body}</tbody></table></div>`);
      continue;
    }

    if (ITEM.test(line)) {
      const items = [];
      let ordered = null;
      for (; i < lines.length; i++) {
        const m = ITEM.exec(lines[i]);
        if (m) {
          const [, indent, num, text] = m;
          if (indent.length >= 2 && items.length) {
            const last = items[items.length - 1];
            if (last.subOrdered === null) last.subOrdered = num !== undefined;
            last.sub.push(text);
          } else {
            if (ordered === null) ordered = num !== undefined;
            items.push({ text, sub: [], subOrdered: null });
          }
          continue;
        }
        // An indented line that starts no item goes on with the item above.
        if (items.length && /^\s+\S/.test(lines[i])) {
          const last = items[items.length - 1];
          if (last.sub.length) last.sub[last.sub.length - 1] += ` ${lines[i].trim()}`;
          else last.text += ` ${lines[i].trim()}`;
          continue;
        }
        break;
      }
      const list = (tag, entries) => `<${tag}>${entries.join('')}</${tag}>`;
      out.push(list(ordered ? 'ol' : 'ul', items.map((it) => `<li>${inline(it.text)}${it.sub.length ? list(it.subOrdered ? 'ol' : 'ul', it.sub.map((s) => `<li>${inline(s)}</li>`)) : ''}</li>`)));
      continue;
    }

    const para = [];
    for (; i < lines.length && lines[i].trim() && !startsBlock(lines[i]); i++) para.push(lines[i].trim());
    out.push(`<p>${para.map(inline).join('<br>')}</p>`);
  }
  return { title, html: out.join('\n') };
}
