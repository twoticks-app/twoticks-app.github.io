# Copyright (c) 2026 Osman Bodur. All rights reserved.
# Makes the posters of the site's films from their YouTube thumbnails, which the TwoTicks project keeps with the
# finished films (store/video/_final/thumbnails/, listed with their YouTube ids in manifest.json). Every film that
# site.config.json names (the overview film, each tool's film and the further films of a tool) gets its poster as
# AVIF and WebP, 640 and 1280 pixels wide: src/img/film-<YouTube id>-<width>.<format>. The site serves them itself,
# so nothing loads from YouTube before someone presses play.
# Usage: python -I tools/film-frames.py "<TwoTicks project folder>"   (needs Pillow with AVIF and WebP)
import json
import sys
from pathlib import Path

from PIL import Image, features

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "img"


def films(cfg: dict) -> list:
    ids = [cfg["youtube"]["film"]]
    for tool in cfg["tools"]:
        ids.append(tool["film"]["id"])
        ids.extend(f["id"] for f in tool.get("more", []))
    return list(dict.fromkeys(ids))


def main(project: Path) -> None:
    if not (features.check("webp") and features.check("avif")):
        sys.exit("Pillow needs WebP and AVIF support")
    cfg = json.loads((ROOT / "site.config.json").read_text(encoding="utf-8"))
    thumbs = project / "store" / "video" / "_final" / "thumbnails"
    manifest = json.loads((thumbs / "manifest.json").read_text(encoding="utf-8"))
    by_id = {v["yt"]: thumbs / Path(v["file"]).name for v in manifest.values() if v.get("kind") == "long"}
    missing = [i for i in films(cfg) if i not in by_id]
    if missing:
        sys.exit(f"No thumbnail in {thumbs / 'manifest.json'} for: {', '.join(missing)}")
    total = 0
    for film in films(cfg):
        img = Image.open(by_id[film]).convert("RGB")
        if img.size != (1280, 720):
            sys.exit(f"{by_id[film].name}: {img.size[0]} x {img.size[1]}, not 1280 x 720")
        for width in (640, 1280):
            pic = img if width == 1280 else img.resize((width, width * 9 // 16), Image.Resampling.LANCZOS)
            for fmt, opts in (("avif", {"quality": 58, "speed": 4}), ("webp", {"quality": 80, "method": 6})):
                path = OUT / f"film-{film}-{width}.{fmt}"
                pic.save(path, fmt.upper(), **opts)
                total += path.stat().st_size
    print(f"{len(films(cfg))} film posters in {OUT.relative_to(ROOT)}, {total // 1024} KB in all")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit('Usage: python -I tools/film-frames.py "<TwoTicks project folder>"')
    main(Path(sys.argv[1]))
