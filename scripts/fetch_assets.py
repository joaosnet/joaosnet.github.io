"""One-time download of locally hosted, OFL-licensed Outfit fonts."""

import re
from pathlib import Path

import requests

root = Path(__file__).resolve().parents[1] / "assets/fonts"
root.mkdir(parents=True, exist_ok=True)
urls = {
    "Outfit.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/Outfit%5Bwght%5D.ttf",
    "OFL.txt": "https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/OFL.txt",
}
for filename, url in urls.items():
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    (root / filename).write_bytes(response.content)
response = requests.get(
    "https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap",
    timeout=30,
    headers={
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
        )
    },
)
response.raise_for_status()
woff = re.findall(r"url\((https://fonts.gstatic.com/[^)]+\.woff2)\)", response.text)[-1]
response = requests.get(woff, timeout=30)
response.raise_for_status()
(root / "outfit-latin.woff2").write_bytes(response.content)
print("Downloaded Outfit TrueType, Latin WOFF2 and OFL license")
