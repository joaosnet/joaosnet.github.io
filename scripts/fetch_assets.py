"""One-time download of locally hosted, OFL-licensed fonts (Outfit and JetBrains Mono).

Usage: ``uv run python scripts/fetch_assets.py [outfit|jetbrains-mono ...]`` (default: all).
"""

import re
import sys
from pathlib import Path

import requests

root = Path(__file__).resolve().parents[1] / "assets/fonts"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
)
FONTS = {
    "outfit": {
        "files": {
            "Outfit.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/Outfit%5Bwght%5D.ttf",
            "OFL.txt": "https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/OFL.txt",
        },
        "css": "https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap",
        "woff2": "outfit-latin.woff2",
    },
    "jetbrains-mono": {
        "files": {
            "OFL-JetBrainsMono.txt": "https://raw.githubusercontent.com/google/fonts/main/ofl/jetbrainsmono/OFL.txt",
        },
        "css": "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..700&display=swap",
        "woff2": "jetbrains-mono-latin.woff2",
    },
}


def get(url: str) -> requests.Response:
    response = requests.get(url, timeout=30, headers={"User-Agent": USER_AGENT})
    response.raise_for_status()
    return response


def fetch(name: str) -> None:
    spec = FONTS[name]
    for filename, url in spec["files"].items():
        (root / filename).write_bytes(get(url).content)
    css = get(spec["css"]).text
    # Google Fonts lists subsets in order; the last block is the basic "latin" subset.
    woff = re.findall(r"url\((https://fonts.gstatic.com/[^)]+\.woff2)\)", css)[-1]
    (root / spec["woff2"]).write_bytes(get(woff).content)
    print(f"Downloaded {name}: {', '.join([*spec['files'], spec['woff2']])}")


if __name__ == "__main__":
    root.mkdir(parents=True, exist_ok=True)
    for font in sys.argv[1:] or list(FONTS):
        fetch(font)
