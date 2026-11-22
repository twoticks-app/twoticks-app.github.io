# Copyright (c) 2026 Osman Bodur. All rights reserved.
# The privacy policy in the site's other languages: content/privacy-policy-i18n/<language>.md, translations of
# content/privacy-policy.md (the English text, which stays the binding one at privacy/). Two steps around a
# translation service (DeepL), which translates the lines this tool gives it:
#   prepare             writes <work>/segments.json: every line, list item, heading and table cell to translate, in
#                       order. Addresses and the e-mail address become ⟦U1⟧, ⟦M1⟧; a word in quotes that is the
#                       panel's own (lang/en.js of the extension) becomes "⟦L1⟧", a policy heading in quotes "⟦H1⟧",
#                       a model's name "⟦T1⟧": they come back in the language's own words, not translated anew.
#   assemble <code> <translations.json>
#                       takes the translated lines (a JSON list in the order of segments.json) and writes the
#                       language's file: the panel's words from lang/<language>.js, the headings as translated, the
#                       addresses as they are. It stops when a placeholder or a bold mark got lost.
# Each file starts with <!-- en: Last updated: ... -->, the English text's date line it was translated from; build.mjs
# shows a translation only while that line is the English text's own, so a changed policy is never shown out of date.
# Usage: python -I tools/privacy-i18n.py "<TwoTicks project folder>" prepare <work folder>
#        python -I tools/privacy-i18n.py "<TwoTicks project folder>" assemble <work folder> <language> <translations.json>
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EN = ROOT / "content" / "privacy-policy.md"
OUT = ROOT / "content" / "privacy-policy-i18n"
URL = re.compile(r"https?://[^\s)]+[^\s).,;:!?\"']")
MAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
QUOTED = re.compile(r'"([^"\n]{1,80})"')
TERMS = {"gpt-oss:120b-cloud", "cloud"}  # model names in quotes: never translated
ROW = re.compile(r"^\s*\|")
SEP = re.compile(r"^\s*\|?\s*:?-{3,}")
ITEM = re.compile(r"^(\s*(?:[-*]|\d+\.)\s+)(.*)$")
HEAD = re.compile(r"^(#{1,6}\s+)(.*)$")
PANEL = {"pt-BR": "pt", "pt-PT": "pt"}  # the panel has one Portuguese
# Table cells that are a service's own name stay as they are ("Anthropic Claude" is a name, not words to translate).
NAMES = {"Anthropic Claude", "OpenAI", "Google Gemini", "Mistral AI", "OpenRouter"}
# Each language's quotation marks: straight double quotes the translation left become these.
QUOTES = {"de": ("„", "“"), "tr": ("“", "”"), "es": ("«", "»"), "it": ("«", "»"), "pt-PT": ("«", "»"), "pt-BR": ("“", "”"),
          "ru": ("«", "»"), "id": ("“", "”"), "ar": ("«", "»"), "hi": ("“", "”"), "fr": ("«", "»")}


def panel_strings(project: Path) -> dict:
    """{language: {key: text}} of the extension's panel (lang/*.js), plain strings only."""
    js = r"""
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = process.argv[1], out = {};
for (const f of fs.readdirSync(dir).filter((f) => /^[a-z]{2}\.js$/.test(f))) {
  const ctx = { TT_I18N: { STRINGS: {} } };
  vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx);
  for (const [code, table] of Object.entries(ctx.TT_I18N.STRINGS)) {
    out[code] = Object.fromEntries(Object.entries(table).filter(([, v]) => typeof v === 'string'));
  }
}
process.stdout.write(JSON.stringify(out));
"""
    res = subprocess.run(["node", "-e", js, str(project / "lang")], capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(res.stdout)


def norm(s: str) -> str:
    return s.replace("’", "'").replace("“", '"').replace("”", '"')


def prepare(project: Path, work: Path) -> None:
    lines = EN.read_text(encoding="utf-8").replace("\r\n", "\n").split("\n")
    date = next((l.strip() for l in lines if l.startswith("Last updated:")), None)
    if not date:
        sys.exit(f"{EN}: no 'Last updated:' line")
    strings = panel_strings(project)
    by_text = {}
    for key, text in strings["en"].items():
        by_text.setdefault(norm(text), key)
    headings = [m.group(2).strip() for m in (HEAD.match(l) for l in lines) if m]
    segments, template, marks = [], [], {"U": [], "M": [], "L": [], "H": [], "T": []}

    def mark(kind: str, value) -> str:
        if value not in marks[kind]:
            marks[kind].append(value)
        return f"⟦{kind}{marks[kind].index(value) + 1}⟧"

    def seg(text: str) -> "int | list":
        text = URL.sub(lambda m: mark("U", m.group(0)), text)
        text = MAIL.sub(lambda m: mark("M", m.group(0)), text)

        def quote(m):
            inner = m.group(1)
            if inner in TERMS:
                return f'"{mark("T", inner)}"'
            if inner in headings:
                return f'"{mark("H", headings.index(inner))}"'
            key = by_text.get(norm(inner))
            return f'"{mark("L", key)}"' if key else m.group(0)
        text = QUOTED.sub(quote, text)
        # A long paragraph goes in groups of sentences (the service takes at most 5000 characters at a time); the
        # groups are joined again with a space. A bold pair is never cut.
        parts, cur = [], ""
        for s in re.split(r"(?<=[.!?:])\s+(?=[A-Z*\"(])", text) if len(text) > 1500 else [text]:
            if cur and len(cur) + 1 + len(s) > 1500 and cur.count("**") % 2 == 0:
                parts.append(cur)
                cur = s
            else:
                cur = f"{cur} {s}" if cur else s
        parts.append(cur)
        segments.extend(parts)
        n = len(segments)
        return n - 1 if len(parts) == 1 else list(range(n - len(parts), n))

    for line in lines:
        head, item = HEAD.match(line), ITEM.match(line)
        if not line.strip() or SEP.match(line):
            template.append({"raw": line})
        elif head:
            pre, text = head.groups()
            template.append({"pre": pre, "seg": seg(text.strip()), "heading": headings.index(text.strip())})
        elif ROW.match(line):
            cells = line.strip().strip("|").split("|")
            row = []
            for c in cells:
                c = c.strip()
                row.append({"raw": c} if not re.search(r"[A-Za-z]{2}", URL.sub("", c)) else {"seg": seg(c)})
            template.append({"row": row})
        elif item:
            pre, text = item.groups()
            template.append({"pre": pre, "seg": seg(text)})
        else:
            template.append({"pre": "", "seg": seg(line)})
    work.mkdir(parents=True, exist_ok=True)
    data = {"date": date, "segments": segments, "template": template, "marks": marks}
    (work / "segments.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    total = sum(len(s) for s in segments)
    print(f"{len(segments)} segments, {total} characters; placeholders: " + ", ".join(f"{k} {len(v)}" for k, v in marks.items()))


def assemble(project: Path, work: Path, code: str, translated: Path) -> None:
    data = json.loads((work / "segments.json").read_text(encoding="utf-8"))
    out = json.loads(translated.read_text(encoding="utf-8"))
    if len(out) != len(data["segments"]):
        sys.exit(f"{translated}: {len(out)} lines, segments.json has {len(data['segments'])}")
    strings = panel_strings(project)
    panel = strings.get(PANEL.get(code, code.split("-")[0]), {})
    problems = []
    for i, (src, tr) in enumerate(zip(data["segments"], out)):
        for ph in re.findall(r"⟦[A-Z]\d+⟧", src):
            if tr.count(ph) != src.count(ph):
                problems.append(f"line {i + 1}: {ph} {src.count(ph)}x in English, {tr.count(ph)}x in {code}")
        if src.count("**") != tr.count("**"):
            problems.append(f"line {i + 1}: {src.count('**')} bold marks in English, {tr.count('**')} in {code}")
        if not tr.strip():
            problems.append(f"line {i + 1}: empty")
    if problems:
        sys.exit("Not written:\n  " + "\n  ".join(problems))
    marks = data["marks"]
    heads = {}
    for t in data["template"]:
        if "heading" in t:
            heads[t["heading"]] = out[t["seg"]]

    def fill(text: str, depth: int = 0) -> str:
        def one(m):
            kind, n = m.group(1), int(m.group(2)) - 1
            value = marks[kind][n]
            if kind == "L":
                return panel.get(value) or strings["en"][value]
            if kind == "H":
                return fill(heads[value], depth + 1).replace("**", "") if depth < 3 else heads[value]
            return value
        return re.sub(r"⟦([A-Z])(\d+)⟧", one, text)

    def text(ref) -> str:
        refs = ref if isinstance(ref, list) else [ref]
        if len(refs) == 1 and data["segments"][refs[0]] in NAMES:
            return data["segments"][refs[0]]
        s = " ".join(fill(out[i]).strip() for i in refs)
        if code in QUOTES:
            s = re.sub(r'"([^"\n]*)"', lambda m: QUOTES[code][0] + m.group(1) + QUOTES[code][1], s)
        if code == "fr":  # French guillemets hold the words with a no-break space inside: « Envoyer »
            s = re.sub(r"«\s*", "« ", s)
            s = re.sub(r"\s*»", " »", s)
        # Two labels the panel calls the same in this language ("No reply needed" or "No answer needed"): name it once.
        return re.sub(r"([“\"„«] ?)([^”\"“«»]{1,60}?)( ?[”\"“»]) \([^\W\d_]+ \1\2\3\)", r"\1\2\3", s)

    lines = [f"<!-- en: {data['date']} -->"]
    for t in data["template"]:
        if "raw" in t:
            lines.append(t["raw"])
        elif "row" in t:
            lines.append("| " + " | ".join(c["raw"] if "raw" in c else text(c["seg"]) for c in t["row"]) + " |")
        else:
            lines.append(t["pre"] + text(t["seg"]))
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{code}.md"
    path.write_text("\n".join(lines).rstrip("\n") + "\n", encoding="utf-8")
    left = re.findall(r"⟦[^⟧]*⟧", path.read_text(encoding="utf-8"))
    print(f"{path.relative_to(ROOT)}: {len(lines) - 1} lines" + (f"; placeholders left: {left}" if left else ""))


if __name__ == "__main__":
    if len(sys.argv) >= 4 and sys.argv[2] == "prepare":
        prepare(Path(sys.argv[1]), Path(sys.argv[3]))
    elif len(sys.argv) == 6 and sys.argv[2] == "assemble":
        assemble(Path(sys.argv[1]), Path(sys.argv[3]), sys.argv[4], Path(sys.argv[5]))
    else:
        sys.exit(__doc__ if __doc__ else "see the comment at the top")
