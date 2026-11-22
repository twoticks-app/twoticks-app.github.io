# Copyright (c) 2026 Osman Bodur. All rights reserved.
# Makes the site's pictures from the extension's own store pictures (in the TwoTicks project folder):
# - the five store screenshots as AVIF and WebP, 640 and 1280 pixels wide, in English and in every other language the
#   store has them in (store/screenshots/<name>.<code>.png -> src/img/<name>-<code>-<width>.<format>);
# - the picture for link previews (Open Graph, 1200 x 630) from the marquee promo tile;
# - the icons (32, 180, 192, 512 pixels) from the YouTube channel picture, and the SVG icon from the logo's geometry.
# Usage: python -I tools/images.py "<TwoTicks project folder>"   (needs Pillow with AVIF and WebP)
import sys
from pathlib import Path

from PIL import Image, features

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "img"
SLATE = (0x16, 0x23, 0x2D)
SHOTS = ["1-privacy-screen", "2-unanswered", "3-quick-replies", "4-ai-assistant", "5-export-chats"]

# The two ticks of the logo, measured on the 800 x 800 channel picture (white tick behind, blue tick in front).
TICK_WHITE = "163,416 207,373 302,466 485,251 531,290 305,559"
TICK_BLUE = "322,470 365,427 406,466 589,251 635,290 410,559"


def main(project: Path) -> None:
    if not (features.check("webp") and features.check("avif")):
        sys.exit("Pillow needs WebP and AVIF support")
    OUT.mkdir(parents=True, exist_ok=True)
    store = project / "store"
    total = 0
    shots = store / "screenshots"
    for name in SHOTS:
        # The English screenshot, then the store's screenshots in the panel's other languages (<name>.<code>.png, for
        # example 1-privacy-screen.tr.png), as <name>-<code>-<width>: a page shows those of its own language.
        for source in [shots / f"{name}.png"] + sorted(shots.glob(f"{name}.*.png")):
            code = source.stem[len(name) + 1:]
            img = Image.open(source).convert("RGB")
            for width in (640, 1280):
                pic = img if img.width == width else img.resize((width, round(img.height * width / img.width)), Image.Resampling.LANCZOS)
                for fmt, opts in (("avif", {"quality": 62, "speed": 4}), ("webp", {"quality": 84, "method": 6})):
                    path = OUT / (f"{name}-{code}-{width}.{fmt}" if code else f"{name}-{width}.{fmt}")
                    pic.save(path, fmt.upper(), **opts)
                    total += path.stat().st_size

    # Link preview: the marquee lockup, centred on the brand's slate at 1200 x 630.
    marquee = Image.open(store / "promo-marquee-1400x560.png").convert("RGB")
    lock = marquee.resize((1200, 480), Image.Resampling.LANCZOS)
    og = Image.new("RGB", (1200, 630), SLATE)
    og.paste(lock, (0, 75))
    og.save(OUT / "og.png", "PNG", optimize=True)

    # Icons from the channel picture (the ticks on slate, full bleed).
    pic = Image.open(store / "youtube" / "channel-picture-800.png").convert("RGB")
    for size in (32, 180, 192, 512):
        pic.resize((size, size), Image.Resampling.LANCZOS).save(OUT / f"icon-{size}.png", "PNG", optimize=True)

    # The SVG icon: the same geometry, cropped to the ticks with a margin, on slate.
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="100 100 600 600">'
        '<rect x="100" y="100" width="600" height="600" fill="#16232d"/>'
        f'<polygon points="{TICK_WHITE}" fill="#fff"/>'
        f'<polygon points="{TICK_BLUE}" fill="#53bdeb" stroke="#16232d" stroke-width="14" paint-order="stroke"/>'
        "</svg>\n"
    )
    (OUT / "icon.svg").write_text(svg, encoding="utf-8")
    files = sorted(OUT.iterdir())
    print(f"{len(files)} files in {OUT.relative_to(ROOT)}; screenshots {total // 1024} KB in all")
    for f in files:
        print(f"  {f.name}  {f.stat().st_size // 1024} KB")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit('Usage: python -I tools/images.py "<TwoTicks project folder>"')
    main(Path(sys.argv[1]))
