"""Build only explicitly approved public assets. Never reads .env or calls the network."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape

ROOT = Path(__file__).resolve().parent
TOKEN = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
REPO = re.compile(r"^[A-Za-z0-9][A-Za-z0-9-]{0,38}/(?!\.{1,2}$)[A-Za-z0-9_.-]{1,100}$")


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def get_content_lastmod():
    site_file = ROOT / "content/site.json"
    try:
        res = subprocess.run(
            ["git", "-C", str(ROOT), "log", "-1", "--format=%cs", str(site_file)],
            capture_output=True,
            text=True,
            check=False,
        )
        date_str = res.stdout.strip()
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", date_str):
            return date_str
    except Exception:
        pass
    if site_file.exists():
        return datetime.fromtimestamp(site_file.stat().st_mtime, tz=timezone.utc).strftime("%Y-%m-%d")
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


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
        if project["visual"] not in ("signal", "mobile", "optimization", "code"):
            raise ValueError("Unknown project visual")
        for lang in ("pt", "en", "es"):
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
    services = read_json(ROOT / "content/services.json")
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
    if site.get("scheduling"):
        safe_url(site["scheduling"], {"cal.com", "calendly.com"})
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

    for lang in ("pt", "en", "es"):
        base = "/" if lang == "pt" else f"/{lang}/"
        routes = [("home.html", base, None), ("privacy.html", base + "privacy/", None)]
        routes += [("project.html", base + "projects/" + p["id"] + "/", p) for p in projects]
        routes.append(("404.html", base + "404.html", None))

        for template, path, project in routes:
            # Canonical path mapping across languages
            if path.startswith("/en/"):
                suffix = path.removeprefix("/en/")
            elif path.startswith("/es/"):
                suffix = path.removeprefix("/es/")
            else:
                suffix = path.removeprefix("/")

            if path.endswith("404.html"):
                pt_path = "/404.html"
                en_path = "/en/404.html"
                es_path = "/es/404.html"
            else:
                pt_path = "/" + suffix if suffix else "/"
                en_path = "/en/" + suffix if suffix else "/en/"
                es_path = "/es/" + suffix if suffix else "/es/"

            alternates = {
                "pt": pt_path,
                "en": en_path,
                "es": es_path,
            }
            # For header fast switch: toggles between primary languages
            alternate = en_path if lang == "pt" else pt_path

            if project is not None:
                schema_data = {
                    "@context": "https://schema.org",
                    "@type": "SoftwareSourceCode",
                    "name": project["name"],
                    "description": project[lang]["summary"],
                    "programmingLanguage": project["tags"],
                    "codeRepository": project.get("github") or site["github"],
                    "author": {
                        "@type": "Person",
                        "name": site["name"],
                        "url": site["url"],
                    },
                }
                if project.get("registration"):
                    reg = project["registration"]
                    schema_data["identifier"] = {
                        "@type": "PropertyValue",
                        "propertyID": "INPI",
                        "value": reg["process"],
                    }
                    schema_data["dateCreated"] = reg["created_date"]
                    schema_data["datePublished"] = reg["issued_date"]
                    schema_data["copyrightHolder"] = [{"@type": "Organization", "name": h} for h in reg["holders"]]
            elif template == "home.html":
                price_range = "R$$" if lang == "pt" else "$$"
                offer_cat_names = {
                    "pt": "Serviços & Soluções",
                    "en": "Services & Solutions",
                    "es": "Servicios & Soluciones",
                }
                schema_data = {
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "Person",
                            "name": site["name"],
                            "url": site["url"],
                            "description": site["profile"][lang]["description"],
                            "jobTitle": site["profile"][lang]["title"],
                            "sameAs": [site["github"], site["linkedin"], site["lattes"]],
                            "knowsAbout": [
                                "Python",
                                "FastAPI",
                                "Rust",
                                "AWS",
                                "ESP32",
                                "Docker",
                                "Model Context Protocol",
                            ],
                        },
                        {
                            "@type": "ProfessionalService",
                            "name": f"{site['name']} · Software Engineering",
                            "url": site["url"],
                            "priceRange": price_range,
                            "areaServed": "Worldwide",
                            "hasOfferCatalog": {
                                "@type": "OfferCatalog",
                                "name": offer_cat_names[lang],
                                "itemListElement": [
                                    {
                                        "@type": "Offer",
                                        "name": pkg[lang]["title"],
                                        "description": pkg[lang]["description"],
                                    }
                                    for pkg in services["packages"]
                                ],
                            },
                        },
                    ],
                }
            else:
                schema_data = {
                    "@context": "https://schema.org",
                    "@type": "Person",
                    "name": site["name"],
                    "url": site["url"],
                    "description": site["profile"][lang]["description"],
                    "sameAs": [site["github"], site["linkedin"]],
                }

            schema = json.dumps(schema_data, ensure_ascii=False).replace("<", "\\u003c")
            schema_hash = base64.b64encode(hashlib.sha256(schema.encode()).digest()).decode()
            page_csp = csp.replace("script-src 'self'", f"script-src 'self' 'sha256-{schema_hash}'")

            context = dict(
                site=site,
                t=ui[lang],
                profile=site["profile"][lang],
                lang=lang,
                base=base,
                path=path,
                alternate=alternate,
                alternates=alternates,
                services=services,
                projects=projects,
                cards=cards,
                project=project,
                csp=page_csp,
                schema=schema,
                cv=f"/docs/cv-joao-natividade-{lang}.pdf",
            )
            html = env.get_template(template).render(**context)
            track_ids.update(re.findall(r'data-track="([a-z0-9-]+)"', html))
            target = destination / (path.lstrip("/") + ("index.html" if path.endswith("/") else ""))
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(html, encoding="utf-8")
            all_pages.append(path)
            if template != "404.html":
                pages.append((path, project))

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

    # Official INPI certificate
    inpi_cert = ROOT / "docs/inpi-dmovel-br512025004902-1.pdf"
    if inpi_cert.exists():
        target_inpi = destination / "docs/inpi-dmovel-br512025004902-1.pdf"
        target_inpi.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(inpi_cert, target_inpi)

    project_images_dir = ROOT / "assets/project-images"
    if project_images_dir.exists():
        target_images_dir = destination / "assets/project-images"
        target_images_dir.mkdir(parents=True, exist_ok=True)
        allowed_img_exts = {".webp", ".png", ".jpg", ".jpeg", ".svg", ".gif"}
        for img in project_images_dir.iterdir():
            if (
                img.is_file()
                and img.suffix.lower() in allowed_img_exts
                and not img.name.startswith(".")
                and not any(k in img.name.lower() for k in ("private", "fastapi"))
            ):
                shutil.copyfile(img, target_images_dir / img.name)
    fonts = ROOT / "assets/fonts"
    if fonts.exists():
        shutil.copytree(fonts, destination / "assets/fonts")
    if (ROOT / "assets/images/og-excellence.png").exists():
        shutil.copyfile(ROOT / "assets/images/og-excellence.png", destination / "assets/images/og-excellence.png")

    from scripts.build_cv import generate_cvs

    generate_cvs(destination / "docs", site, projects)

    # docs/index.html: hybrid client/meta redirect with noindex
    docs_dir = destination / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)
    redirect_script = (
        "var lang = (localStorage.getItem('portfolio-language') || navigator.language || '').toLowerCase();\n"
        "var target = lang.startsWith('en') ? '/en/#education' : "
        "(lang.startsWith('es') ? '/es/#education' : '/#education');\n"
        "location.replace(target);"
    )
    redirect_hash = base64.b64encode(hashlib.sha256(redirect_script.encode()).digest()).decode()
    docs_csp = f"default-src 'none'; script-src 'sha256-{redirect_hash}'; base-uri 'none'"
    docs_html = (
        "<!doctype html>\n"
        '<html lang="pt-BR">\n'
        "<head>\n"
        '  <meta charset="utf-8">\n'
        '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f'  <meta http-equiv="Content-Security-Policy" content="{docs_csp}">\n'
        '  <title>João Silva Neto · Redirecionamento</title>\n'
        '  <meta name="robots" content="noindex, follow">\n'
        f'  <link rel="canonical" href="{site["url"]}/#education">\n'
        '  <meta http-equiv="refresh" content="0; url=/#education">\n'
        f"  <script>{redirect_script}</script>\n"
        "</head>\n"
        "<body>\n"
        f"  <h1>{site['name']}</h1>\n"
        '  <p>Redirecionando para Formação / Redirecting to education... '
        '<a href="/#education">Clique aqui se não for redirecionado automaticamente</a>.</p>\n'
        "</body>\n"
        "</html>\n"
    )
    (docs_dir / "index.html").write_text(docs_html, encoding="utf-8")

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

    static_lastmod = get_content_lastmod()
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    for p, proj in pages:
        loc = f"{site['url']}{p}"
        if p in ("/", "/en/", "/es/"):
            priority = "1.0" if p == "/" else "0.9"
            changefreq = "weekly"
            lastmod = static_lastmod
        elif "privacy" in p:
            priority = "0.3"
            changefreq = "monthly"
            lastmod = static_lastmod
        else:
            priority = "0.8"
            changefreq = "weekly"
            if proj:
                lastmod = (
                    proj.get("updated")
                    or (proj.get("registration", {}).get("issued_date") if proj.get("registration") else "")
                    or static_lastmod
                )
            else:
                lastmod = static_lastmod

        if p.startswith("/en/"):
            suffix = p.removeprefix("/en/")
        elif p.startswith("/es/"):
            suffix = p.removeprefix("/es/")
        else:
            suffix = p.removeprefix("/")

        pt_url = f"{site['url']}/{suffix}" if suffix else f"{site['url']}/"
        en_url = f"{site['url']}/en/{suffix}" if suffix else f"{site['url']}/en/"
        es_url = f"{site['url']}/es/{suffix}" if suffix else f"{site['url']}/es/"

        xml += "  <url>\n"
        xml += f"    <loc>{loc}</loc>\n"
        xml += f"    <lastmod>{lastmod}</lastmod>\n"
        xml += f"    <changefreq>{changefreq}</changefreq>\n"
        xml += f"    <priority>{priority}</priority>\n"
        xml += f'    <xhtml:link rel="alternate" hreflang="pt-BR" href="{pt_url}"/>\n'
        xml += f'    <xhtml:link rel="alternate" hreflang="en" href="{en_url}"/>\n'
        xml += f'    <xhtml:link rel="alternate" hreflang="es" href="{es_url}"/>\n'
        xml += f'    <xhtml:link rel="alternate" hreflang="x-default" href="{pt_url}"/>\n'
        xml += "  </url>\n"
    xml += "</urlset>\n"
    (destination / "sitemap.xml").write_text(xml, encoding="utf-8")
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    (destination / ".nojekyll").touch()
    (ROOT / ".nojekyll").touch()

    # Synchronize root index.html, 404.html, analytics config, docs, and routes with the built site
    shutil.copyfile(destination / "index.html", ROOT / "index.html")
    shutil.copyfile(destination / "404.html", ROOT / "404.html")
    (ROOT / "assets").mkdir(parents=True, exist_ok=True)
    shutil.copyfile(destination / "assets/analytics-config.json", ROOT / "assets/analytics-config.json")
    for route in ("projects", "en", "es", "privacy"):
        src = destination / route
        dest = ROOT / route
        if src.exists():
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(src, dest)
    docs_src = destination / "docs"
    docs_dest = ROOT / "docs"
    if docs_src.exists():
        docs_dest.mkdir(parents=True, exist_ok=True)
        shutil.copytree(docs_src, docs_dest, dirs_exist_ok=True)
    digest = hashlib.sha256((destination / "index.html").read_bytes()).hexdigest()[:12]
    if final_destination.exists():
        shutil.rmtree(final_destination)
    destination.replace(final_destination)
    print(f"Built {len(pages)} pages + 404 + trilingual PDFs in dist (home {digest})")
    return final_destination


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    build()
