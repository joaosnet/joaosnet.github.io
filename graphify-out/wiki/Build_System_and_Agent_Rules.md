# Build System and Agent Rules

> 57 nodes · cohesion 0.08

## Key Concepts

- **build_site.py** (19 connections) — `build_site.py`
- **update_projects.py** (18 connections) — `update_projects.py`
- **test_update_projects.py** (17 connections) — `tests/test_update_projects.py`
- **build()** (12 connections) — `build_site.py`
- **private_preview()** (12 connections) — `update_projects.py`
- **json** (11 connections)
- **main()** (11 connections) — `update_projects.py`
- **read_json()** (10 connections) — `build_site.py`
- **pathlib** (8 connections)
- **client()** (8 connections) — `tests/test_update_projects.py`
- **load_projects()** (7 connections) — `build_site.py`
- **test_telemetry.py** (7 connections) — `tests/test_telemetry.py`
- **approve_export()** (7 connections) — `update_projects.py`
- **fetch_repository()** (7 connections) — `update_projects.py`
- **hashlib** (6 connections)
- **generate_cvs()** (6 connections) — `scripts/build_cv.py`
- **public_snapshot()** (6 connections) — `update_projects.py`
- **safe_url()** (5 connections) — `build_site.py`
- **discover_public_repos()** (5 connections) — `update_projects.py`
- **argparse** (4 connections)
- **2. Ponto de Entrada `main()` e Governança de Dados** (4 connections) — `docs/architecture-security-isolation.md`
- **requests** (4 connections)
- **fetch_assets.py** (4 connections) — `scripts/fetch_assets.py`
- **shutil** (4 connections)
- **test_api_failure_does_not_accept_redirect_or_data()** (4 connections) — `tests/test_update_projects.py`
- *... and 32 more nodes in this community*

## Relationships

- [HTML and PDF Parsing Tests](HTML_and_PDF_Parsing_Tests.md) (7 shared connections)
- [Security Architecture and Governance](Security_Architecture_and_Governance.md) (7 shared connections)
- [Bilingual CV Generation](Bilingual_CV_Generation.md) (3 shared connections)
- [Local Preview Server](Local_Preview_Server.md) (2 shared connections)
- [Analytics and Review Documentation](Analytics_and_Review_Documentation.md) (1 shared connections)

## Source Files

- `AGENTS.md`
- `build_site.py`
- `docs/architecture-security-isolation.md`
- `scripts/build_cv.py`
- `scripts/fetch_assets.py`
- `tests/conftest.py`
- `tests/test_site_structure.py`
- `tests/test_telemetry.py`
- `tests/test_update_projects.py`
- `update_projects.py`

## Audit Trail

- EXTRACTED: 136 (94%)
- INFERRED: 8 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*