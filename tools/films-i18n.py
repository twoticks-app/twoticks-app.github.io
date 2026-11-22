# Copyright (c) 2026 Osman Bodur. All rights reserved.
# Writes content/films-i18n.json: for a language whose films are on YouTube, the same films made in that language. For
# every film that site.config.json names (the overview film, the home page's further films, each tool's film, its
# step-by-step film, its stories and further films) it finds the film in the TwoTicks project and writes, under the
# English film's YouTube id: the language's YouTube id, its title, its length and its poster's cover.
#   - which film it is: the English cover's name ("thumb" in site.config.json, or the English YouTube id in
#     store/video/_final/thumbnails/manifest.json), for example f17, l05 or tl14;
#   - the language's film: store/video/_final/thumbnails/<language>/manifest.json gives that name's film code (1-17),
#     the status table of store/youtube/YOUTUBE-<language>.md gives the code's file and YouTube address;
#   - the title: the file's name without the code ("1-17 Bir gün, on üç araç.mp4" -> "Bir gün, on üç araç"); a
#     step-by-step film (tl..) gets the language's "step by step" after it, as the English titles do;
#   - the length: the file's length (ffprobe), rounded to the second, as YouTube shows it;
#   - the poster: the language's cover, store/video/_final/thumbnails/<language>/<name>.jpg (tools/film-frames.py).
# The other languages in the file are kept. It stops before writing anything when a film is missing.
# Usage: python -I tools/films-i18n.py "<TwoTicks project folder>" <language>   (needs ffprobe)
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "content" / "films-i18n.json"
STEP = {"tr": ", adım adım"}  # the English titles' ", step by step"


def site_films(cfg: dict) -> list:
    """(English YouTube id, thumb or None) of every film the site names, in the order of site.config.json."""
    out = [(cfg["youtube"]["film"], None)]
    out += [(f["id"], f.get("thumb")) for f in cfg["youtube"].get("more", [])]
    for tool in cfg["tools"]:
        films = [tool["film"]] + ([tool["steps"]] if tool.get("steps") else []) + tool.get("stories", []) + tool.get("more", [])
        out += [(f["id"], f.get("thumb")) for f in films]
    seen, unique = set(), []
    for film in out:
        if film[0] not in seen:
            seen.add(film[0])
            unique.append(film)
    return unique


def main(project: Path, lang: str) -> None:
    if lang not in STEP:
        sys.exit(f'No "step by step" for {lang}: add it to STEP in {Path(__file__).name}')
    cfg = json.loads((ROOT / "site.config.json").read_text(encoding="utf-8"))
    thumbs = project / "store" / "video" / "_final" / "thumbnails"
    en = json.loads((thumbs / "manifest.json").read_text(encoding="utf-8"))
    by_yt = {v["yt"]: k for k, v in en.items() if v.get("yt")}
    local = json.loads((thumbs / lang / "manifest.json").read_text(encoding="utf-8"))
    doc = (project / "store" / "youtube" / f"YOUTUBE-{lang}.md").read_text(encoding="utf-8")
    table = {code: (file, vid) for code, file, vid in re.findall(
        r"^\| (\d-S?\d{2}) \| `([^`]+)` \| https://(?:youtu\.be/|youtube\.com/shorts/)([\w-]{11}) \|", doc, re.M)}
    films, missing = {}, []
    for en_id, thumb in site_films(cfg):
        name = thumb or by_yt.get(en_id)
        code = local.get(name, {}).get("code") if name else None
        if not name or not code or code not in table:
            missing.append(f"{en_id} ({name or 'no cover name'}, {code or 'no code'}): not uploaded in {lang}")
            continue
        file, vid = table[code]
        path = project / "store" / "video" / "_final" / lang / file
        cover = thumbs / lang / f"{name}.jpg"
        if not path.exists() or not cover.exists():
            missing.append(f"{en_id} ({code}): {'no file ' + str(path) if not path.exists() else 'no cover ' + str(cover)}")
            continue
        seconds = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                                       capture_output=True, text=True, check=True).stdout)
        title = re.sub(r"^\d-S?\d{2} ", "", Path(file).stem) + (STEP[lang] if name.startswith("tl") else "")
        films[en_id] = {"id": vid, "title": title, "seconds": round(seconds), "thumb": f"{lang}/{name}"}
    if missing:
        sys.exit("Not written:\n  " + "\n  ".join(missing))
    data = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    data[lang] = films
    OUT.write_text(json.dumps(dict(sorted(data.items())), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}: {len(films)} {lang} films for the {len(films)} films of the site")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit('Usage: python -I tools/films-i18n.py "<TwoTicks project folder>" <language>')
    main(Path(sys.argv[1]), sys.argv[2])
