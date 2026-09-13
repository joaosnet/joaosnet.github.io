"""Build only explicitly approved public assets. Never reads .env or calls the network."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape

ROOT = Path(__file__).resolve().parent
TOKEN = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
REPO = re.compile(r"^[A-Za-z0-9][A-Za-z0-9-]{0,38}/(?!\.{1,2}$)[A-Za-z0-9_.-]{1,100}$")


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def safe_url(url, hosts=None):
    if not url:
        return ""
    parts = urlsplit(url)
    if (
        parts.scheme != "https"
        or not parts.hostname
        or parts.username
        or parts.password
        or parts.port not in (None, 443)
        or any(c.isspace() for c in url)
    ):
        raise ValueError("Only absolute HTTPS URLs without credentials are allowed")
    if hosts and parts.hostname not in hosts:
        raise ValueError("Host is not approved")
    return url


def load_projects():
    projects = read_json(ROOT / "content/projects.json")
    private = ROOT / "content/private-approved.json"
    if private.exists():
        projects += read_json(private)
    seen = set()
    for project in projects:
        key = project["id"]
        if not TOKEN.fullmatch(key) or key in seen:
            raise ValueError("Invalid or duplicate project identifier")
        seen.add(key)
        if project["visibility"] == "public":
            if not REPO.fullmatch(project["repo"]):
                raise ValueError("Invalid repository")
            project["github"] = "https://github.com/" + project["repo"]
        elif project["visibility"] == "private" and project.get("reviewed") is True:
            if "repo" in project:
                raise ValueError("Private source identifiers must not be exported")
            project["github"] = ""
        else:
            raise ValueError("Unreviewed private project")
        safe_url(project.get("demo", ""))
        if project["visual"] not in ("signal", "mobile", "optimization"):
            raise ValueError("Unknown project visual")
        for lang in ("pt", "en"):
            for field in (
                "title",
                "summary",
                "role",
                "problem",
                "decisions",
                "limitations",
                "evidence",
                "takeaway",
                "status",
                "eyebrow",
            ):
                if not project[lang].get(field):
                    raise ValueError(f"Missing project translation: {key}/{lang}/{field}")
    metadata_path = ROOT / "content/public-metadata.json"
    metadata = read_json(metadata_path) if metadata_path.exists() else {}
    for project in projects:
        updated = metadata.get(project["id"], {}).get("updated_at") if project["visibility"] == "public" else None
        project["updated"] = (
            datetime.fromisoformat(updated.replace("Z", "+00:00")).date().isoformat() if updated else ""
        )
    return projects


def build(output=None):
    requested = Path(output or ROOT / "dist")
    if requested.is_symlink() or requested.is_junction():
        raise ValueError("Build destination cannot be a symlink or junction")
    destination = requested.resolve()
    # Only this dedicated generated directory may be cleared; never a computed arbitrary tree.
    if destination != (ROOT / "dist").resolve():
        raise ValueError("Build output must be the dedicated workspace dist directory")
    if destination.is_symlink():
        raise ValueError("Build destination cannot be a symlink")
    final_destination = destination
    destination = ROOT / ".build-staging"
    if destination.is_symlink() or destination.is_junction() or destination.resolve().parent != ROOT.resolve():
        raise ValueError("Unsafe staging directory")
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir()
    site = read_json(ROOT / "content/site.json")
    ui = read_json(ROOT / "content/ui.json")
    projects = load_projects()
    extra_cards = read_json(ROOT / "content/project-cards.json")
    ids = {p["id"] for p in projects}
    for index, card in enumerate(extra_cards, start=len(projects) + 1):
        if not REPO.fullmatch(card["repo"]) or not TOKEN.fullmatch(card["id"]) or card["id"] in ids:
            raise ValueError("Invalid or duplicate project card")
        ids.add(card["id"])
        safe_url(card.get("demo", ""))
        card["number"] = f"{index:02}"
        card["card_url"] = "https://github.com/" + card["repo"]
        card["card_cta_url"] = card.get("demo") or card["card_url"]
    cards = projects + extra_cards
    safe_url(site["url"])
    safe_url(site["github"], {"github.com"})
    safe_url(site["lattes"], {"lattes.cnpq.br"})
    safe_url(site["linkedin"], {"linkedin.com", "www.linkedin.com"})
    safe_url(site["form_endpoint"], {"formspree.io"})
    endpoint = site.get("analytics_endpoint", "")
    if endpoint:
        safe_url(endpoint, {"script.google.com"})
        if not site.get("analytics_validated"):
            raise ValueError("Analytics collector must be validated before enabling transport")
    env = Environment(
        loader=FileSystemLoader(ROOT / "templates"), autoescape=select_autoescape(), undefined=StrictUndefined
    )
    pages = []
    all_pages = []
    track_ids = {"content", "form-field", "unlabelled-control", "page"}
    csp = (
        "default-src 'none'; "
        "script-src 'self' https://cdn.gtranslate.net/widgets/latest/lib.min.js; "
        "style-src 'self' 'unsafe-inline' https://cdn.gtranslate.net; "
        "img-src 'self' data: https://cdn.gtranslate.net; font-src 'self'; "
        "connect-src 'self' https://formspree.io https://translate-pa.googleapis.com"
    )
    if endpoint:
        csp += " https://script.google.com https://script.googleusercontent.com"
    csp += "; form-action https://formspree.io; base-uri 'none'; object-src 'none'"
    for lang in ("pt", "en"):
        base = "/" if lang == "pt" else "/en/"
        routes = [("home.html", base, None), ("privacy.html", base + "privacy/", None)]
        routes += [("project.html", base + "projects/" + p["id"] + "/", p) for p in projects]
        routes.append(("404.html", base + "404.html", None))
        for template, path, project in routes:
            schema = json.dumps(
                {
                    "@context": "https://schema.org",
                    "@type": "Person",
                    "name": site["name"],
                    "url": site["url"],
                    "description": site["profile"][lang]["description"],
                    "sameAs": [site["github"], site["linkedin"]],
                },
                ensure_ascii=False,
            ).replace("<", "\\u003c")
            schema_hash = base64.b64encode(hashlib.sha256(schema.encode()).digest()).decode()
            page_csp = csp.replace("script-src 'self'", f"script-src 'self' 'sha256-{schema_hash}'")
            alternate = ("/en" + path) if lang == "pt" else path.removeprefix("/en")
            context = dict(
                site=site,
                t=ui[lang],
                profile=site["profile"][lang],
                lang=lang,
                base=base,
                path=path,
                alternate=alternate,
                projects=projects,
                cards=cards,
                project=project,
                csp=page_csp,
                schema=schema,
                cv="/docs/crv.pdf" if lang == "pt" else "/docs/cv-joao-silva-neto-en.pdf",
            )
            html = env.get_template(template).render(**context)
            track_ids.update(re.findall(r'data-track="([a-z0-9-]+)"', html))
            target = destination / (path.lstrip("/") + ("index.html" if path.endswith("/") else ""))
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(html, encoding="utf-8")
            all_pages.append(path)
            if template != "404.html":
                pages.append(path)
    # Copy an allowlist, never the repository or historical project-image directory.
    assets = [
        "assets/css/portfolio.css",
        "assets/js/boot.js",
        "assets/js/portfolio.js",
        "assets/js/analytics.js",
        "assets/js/languages.js",
        "assets/js/easter-eggs.js",
        "assets/images/hero-avatar.jpg",
        "assets/images/favicon.png",
        "assets/images/favicon.svg",
    ]
    for asset in assets:
        target = destination / asset
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / asset, target)
    project_images_dir = ROOT / "assets/project-images"
    if project_images_dir.exists():
        target_images_dir = destination / "assets/project-images"
        target_images_dir.mkdir(parents=True, exist_ok=True)
        for img in project_images_dir.iterdir():
            if img.is_file() and not any(k in img.name for k in ("private", "fastapi")):
                shutil.copyfile(img, target_images_dir / img.name)
    fonts = ROOT / "assets/fonts"
    if fonts.exists():
        shutil.copytree(fonts, destination / "assets/fonts")
    if (ROOT / "assets/images/og-excellence.png").exists():
        shutil.copyfile(ROOT / "assets/images/og-excellence.png", destination / "assets/images/og-excellence.png")
    from scripts.build_cv import generate_cvs

    generate_cvs(destination / "docs", site, projects)
    config = {
        "endpoint": endpoint,
        "release": site["release"],
        "pageIds": all_pages,
        "productionHost": urlsplit(site["url"]).hostname,
        "trackIds": sorted(track_ids),
        "projects": [p["id"] for p in cards],
        "text": {
            k: {n: ui[k][n] for n in ("metrics_notice", "metrics_off", "metrics_preview", "disable", "enable")}
            for k in ui
        },
    }
    (destination / "assets/analytics-config.json").write_text(json.dumps(config, ensure_ascii=False), encoding="utf-8")
    catalog = {
        "pages": all_pages,
        "elements": sorted(track_ids),
        "projects": [p["id"] for p in cards],
        "releases": [site["release"]],
    }
    # Deployment instructions consume this catalog; it contains only public identifiers.
    (ROOT / "analytics/catalog.json").write_text(json.dumps(catalog, indent=2), encoding="utf-8")
    robots_content = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /tests/\n"
        "Disallow: /artifacts/\n"
        "Disallow: /.private-preview/\n\n"
        f"Sitemap: {site['url']}/sitemap.xml\n"
    )
    (destination / "robots.txt").write_text(robots_content, encoding="utf-8")
    (ROOT / "robots.txt").write_text(robots_content, encoding="utf-8")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    for p in pages:
        loc = f"{site['url']}{p}"
        if p in ("/", "/en/"):
            priority = "1.0" if p == "/" else "0.9"
            changefreq = "weekly"
        elif "privacy" in p:
            priority = "0.3"
            changefreq = "monthly"
        else:
            priority = "0.8"
            changefreq = "weekly"

        pt_path = p.removeprefix("/en") if p.startswith("/en/") else p
        en_path = p if p.startswith("/en/") else ("/en" + p)
        pt_url = f"{site['url']}{pt_path}"
        en_url = f"{site['url']}{en_path}"

        xml += "  <url>\n"
        xml += f"    <loc>{loc}</loc>\n"
        xml += f'    <xhtml:link rel="alternate" hreflang="pt-BR" href="{pt_url}"/>\n'
        xml += f'    <xhtml:link rel="alternate" hreflang="en" href="{en_url}"/>\n'
        xml += f'    <xhtml:link rel="alternate" hreflang="x-default" href="{pt_url}"/>\n'
        xml += f"    <lastmod>{today}</lastmod>\n"
        xml += f"    <changefreq>{changefreq}</changefreq>\n"
        xml += f"    <priority>{priority}</priority>\n"
        xml += "  </url>\n"
    xml += "</urlset>\n"
    (destination / "sitemap.xml").write_text(xml, encoding="utf-8")
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    (destination / ".nojekyll").touch()
    # Synchronize root index.html with the built homepage
    shutil.copyfile(destination / "index.html", ROOT / "index.html")
    digest = hashlib.sha256((destination / "index.html").read_bytes()).hexdigest()[:12]
    if final_destination.exists():
        shutil.rmtree(final_destination)
    destination.replace(final_destination)
    print(f"Built {len(pages)} pages + 404 + bilingual PDFs in dist (home {digest})")
    return final_destination


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    build()
