import json
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.parse import urlsplit

import pytest
from pypdf import PdfReader

import build_site as builder


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.elements = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))

    def find(self, tag, **attrs):
        return [a for t, a in self.elements if t == tag and all(a.get(k) == v for k, v in attrs.items())]


@pytest.fixture(scope="module")
def built():
    return builder.build()


def test_only_allowlisted_public_files_are_built(built):
    files = [str(p.relative_to(built)).replace("\\", "/") for p in built.rglob("*") if p.is_file()]
    assert len(list(built.rglob("*.html"))) == 12
    for path in files:
        assert not any(
            x in path
            for x in [
                ".env",
                ".git/",
                "graphify",
                "private-preview",
                "project-images",
                "collector.gs",
                "analytics-apps-script",
                "uv.lock",
                "tests/",
            ]
        )
    assert not (built / "assets/js/geo-counter.js").exists()


def test_every_local_link_and_asset_exists(built):
    for path in built.rglob("*.html"):
        page = Page(path.read_text(encoding="utf-8"))
        ids = {a["id"] for _, a in page.elements if "id" in a}
        for tag, attrs in page.elements:
            for key in ("href", "src"):
                value = attrs.get(key, "")
                url = urlsplit(value)
                if not value or url.scheme or url.netloc:
                    continue
                if not url.path:
                    if url.fragment:
                        assert url.fragment in ids, (path, value)
                    continue
                local = (built / url.path.lstrip("/")) if url.path.startswith("/") else path.parent / url.path
                if url.path.endswith("/"):
                    local = local / "index.html"
                assert local.exists(), (path, value)
                if url.fragment and local.suffix == ".html":
                    target = Page(local.read_text(encoding="utf-8"))
                    assert any(a.get("id") == url.fragment for _, a in target.elements), (path, value)


def test_bilingual_routes_metadata_and_names(built):
    for path in built.rglob("*.html"):
        text = path.read_text(encoding="utf-8")
        page = Page(text)
        en = path.is_relative_to(built / "en")
        assert page.find("html", lang="en" if en else "pt-BR")
        assert "João Silva Neto" in text
        assert "GTranslate" not in text
        assert len(page.find("h1")) == 1
        canonical = page.find("link", rel="canonical")[0]["href"]
        assert canonical.startswith("https://joaosnet.github.io/")
        if path.name != "404.html":
            for alternate in page.find("link", rel="alternate"):
                dest = built / urlsplit(alternate["href"]).path.lstrip("/") / "index.html"
                assert dest.exists()
    assert "Engenheiro da Computação" not in (built / "index.html").read_text(encoding="utf-8")


def test_strict_csp_and_no_inline_event_handlers(built):
    for path in built.rglob("*.html"):
        page = Page(path.read_text(encoding="utf-8"))
        csp = page.find("meta", **{"http-equiv": "Content-Security-Policy"})[0]["content"]
        assert "default-src 'none'" in csp
        assert "unsafe-inline" not in csp and "unsafe-eval" not in csp
        assert "base-uri 'none'" in csp
        for tag, attrs in page.elements:
            assert not any(k.startswith("on") or k == "style" for k in attrs)
            if tag == "script" and "src" in attrs:
                assert attrs["src"].startswith("/assets/")


def test_sitemap_covers_all_indexable_pages(built):
    tree = ET.parse(built / "sitemap.xml")
    locs = tree.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
    assert len(locs) == 10
    assert all("404" not in node.text for node in locs)


@pytest.mark.parametrize("name,phrase", [("crv.pdf", "em andamento"), ("cv-joao-silva-neto-en.pdf", "in progress")])
def test_cv_is_one_page_selectable_and_factual(built, name, phrase):
    pdf = PdfReader(built / "docs" / name)
    assert len(pdf.pages) == 1
    text = pdf.pages[0].extract_text()
    assert "João Silva Neto" in text and phrase in text
    assert "AetherSense" in text and "DMóvel" in text


def test_metrics_have_no_transport_before_backend_validation(built):
    config = json.loads((built / "assets/analytics-config.json").read_text(encoding="utf-8"))
    assert config["endpoint"] == ""
    assert "form-field" in config["trackIds"]
    assert not any(key in config for key in ("token", "secret", "ip"))


def test_build_cannot_delete_other_directories(tmp_path):
    marker = tmp_path / "keep"
    marker.write_text("keep")
    with pytest.raises(ValueError):
        builder.build(tmp_path)
    assert marker.read_text() == "keep"


def test_private_projects_require_review_and_cannot_export_sources(monkeypatch):
    projects = builder.read_json(builder.ROOT / "content/projects.json")
    projects[0]["visibility"] = "private"
    monkeypatch.setattr(builder, "read_json", lambda path: projects)
    with pytest.raises(ValueError):
        builder.load_projects()
    projects[0]["reviewed"] = True
    with pytest.raises(ValueError):
        builder.load_projects()
