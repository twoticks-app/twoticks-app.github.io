# Copyright (c) 2026 Osman Bodur. All rights reserved.
# Makes the posters of the site's films from their YouTube thumbnails, which the TwoTicks project keeps with the
# finished films (store/video/_final/thumbnails/, most of them listed with their YouTube ids in manifest.json). Every
# film that site.config.json names gets its poster: src/img/film-<YouTube id>-<width>.<format>, AVIF and WebP.
# The films shown large (the overview film, each tool's film and its step-by-step film) get 640 and 1280 pixels; the
# films shown small in a list (a tool's stories and further films, the home page's further films) get 640 pixels.
# A film whose thumbnail the manifest does not list by its YouTube id names its file in "thumb" (for example "tl11").
# The site serves the posters itself, so nothing loads from YouTube before someone presses play. The folder is
# written afresh: posters of films the site no longer names are removed.
# Usage: python -I tools/film-frames.py "<TwoTicks project folder>"   (needs Pillow with AVIF and WebP)
import json
import sys
from pathlib import Path

from PIL import Image, features

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "img"


def films(cfg: dict) -> dict:
    """YouTube id -> (thumbnail name or None, shown large)."""
    out: dict = {}

    def add(film: dict, large: bool) -> None:
        thumb, was_large = out.get(film["id"], (None, False))
        out[film["id"]] = (film.get("thumb") or thumb, large or was_large)

    add({"id": cfg["youtube"]["film"]}, True)
    for f in cfg["youtube"].get("more", []):
        add(f, False)
    for tool in cfg["tools"]:
        add(tool["film"], True)
        if tool.get("steps"):
            add(tool["steps"], True)
        for f in tool.get("stories", []) + tool.get("more", []):
            add(f, False)
    return out


def main(project: Path) -> None:
    if not (features.check("webp") and features.check("avif")):
        sys.exit("Pillow needs WebP and AVIF support")
    cfg = json.loads((ROOT / "site.config.json").read_text(encoding="utf-8"))
    thumbs = project / "store" / "video" / "_final" / "thumbnails"
    manifest = json.loads((thumbs / "manifest.json").read_text(encoding="utf-8"))
    by_id = {v["yt"]: thumbs / Path(v["file"]).name for v in manifest.values() if v.get("kind") == "long" and v.get("yt")}
    plan = films(cfg)
    sources = {}
    for film, (thumb, _) in plan.items():
        path = thumbs / f"{thumb}.jpg" if thumb else by_id.get(film)
        if not path or not path.exists():
            sys.exit(f"No thumbnail for {film}: give it a \"thumb\" in site.config.json, or list it in {thumbs / 'manifest.json'}")
        sources[film] = path
    for old in OUT.glob("film-*"):
        old.unlink()
    total = 0
    for film, (_, large) in plan.items():
        img = Image.open(sources[film]).convert("RGB")
        if img.size != (1280, 720):
            sys.exit(f"{sources[film].name}: {img.size[0]} x {img.size[1]}, not 1280 x 720")
        for width in (640, 1280) if large else (640,):
            pic = img if width == 1280 else img.resize((width, width * 9 // 16), Image.Resampling.LANCZOS)
            for fmt, opts in (("avif", {"quality": 58, "speed": 4}), ("webp", {"quality": 80, "method": 6})):
                path = OUT / f"film-{film}-{width}.{fmt}"
                pic.save(path, fmt.upper(), **opts)
                total += path.stat().st_size
    large = sum(1 for _, big in plan.values() if big)
    print(f"{len(plan)} film posters ({large} large, {len(plan) - large} small) in {OUT.relative_to(ROOT)}, {total // 1024} KB in all")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit('Usage: python -I tools/film-frames.py "<TwoTicks project folder>"')
    main(Path(sys.argv[1]))
