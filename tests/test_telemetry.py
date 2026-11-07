"""Automated end-to-end tests for portfolio telemetry and catalog alignment."""

import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_telemetry_config_and_catalog_alignment():
    config_path = ROOT / "dist/assets/analytics-config.json"
    catalog_path = ROOT / "analytics/catalog.json"
    if not config_path.exists():
        import build_site as builder

        builder.build()
    assert config_path.exists(), "analytics-config.json must be built"
    assert catalog_path.exists(), "catalog.json must exist"

    config = json.loads(config_path.read_text(encoding="utf-8"))
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))

    assert set(config["trackIds"]) == set(catalog["elements"])
    assert set(config["pageIds"]) == set(catalog["pages"])
    assert set(config["projects"]) == set(catalog["projects"])
    assert config["release"] in catalog["releases"]


def test_collector_gs_default_catalog_supports_v1_and_v2():
    collector = (ROOT / "analytics/collector.gs").read_text(encoding="utf-8")
    catalog = json.loads((ROOT / "analytics/catalog.json").read_text(encoding="utf-8"))
    assert '"portfolio-excellence-v1"' in collector
    assert '"portfolio-excellence-v2"' in collector
    assert '"/projects/interactive-signals/"' in collector
    assert '"interactive-signals"' in collector
    assert "function atualizarCatalogo()" in collector

    for element in catalog["elements"]:
        assert f'"{element}"' in collector, f"Element '{element}' missing from collector.gs"


def test_live_production_telemetry_health():
    site = json.loads((ROOT / "content/site.json").read_text(encoding="utf-8"))
    endpoint = site.get("analytics_endpoint", "")
    assert endpoint.startswith("https://script.google.com/macros/s/"), "Invalid endpoint"

    req = urllib.request.Request(endpoint, headers={"User-Agent": "Portfolio-Telemetry-Test/2.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode("utf-8"))
        assert data.get("status") == "online"
        assert "metricas" in data
        assert isinstance(data["metricas"].get("totalVisitasRegistradas"), int)
        assert isinstance(data["metricas"].get("totalEventosRegistrados"), int)
