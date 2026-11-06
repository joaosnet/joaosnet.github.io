# Site Build Logic

> 53 nodes · cohesion 0.08

## Key Concepts

- **build_site.py** (19 connections) — `build_site.py`
- **update_projects.py** (18 connections) — `update_projects.py`
- **test_update_projects.py** (17 connections) — `tests/test_update_projects.py`
- **build()** (12 connections) — `build_site.py`
- **json** (11 connections)
- **read_json()** (10 connections) — `build_site.py`
- **main()** (9 connections) — `update_projects.py`
- **private_preview()** (9 connections) — `update_projects.py`
- **pathlib** (8 connections)
- **client()** (8 connections) — `tests/test_update_projects.py`
- **load_projects()** (7 connections) — `build_site.py`
- **test_telemetry.py** (7 connections) — `tests/test_telemetry.py`
- **approve_export()** (7 connections) — `update_projects.py`
- **fetch_repository()** (7 connections) — `update_projects.py`
- **hashlib** (6 connections)
- **generate_cvs()** (6 connections) — `scripts/build_cv.py`
- **safe_url()** (5 connections) — `build_site.py`
- **public_snapshot()** (5 connections) — `update_projects.py`
- **argparse** (4 connections)
- **requests** (4 connections)
- **fetch_assets.py** (4 connections) — `scripts/fetch_assets.py`
- **shutil** (4 connections)
- **test_api_failure_does_not_accept_redirect_or_data()** (4 connections) — `tests/test_update_projects.py`
- **test_repository_identifier_injection_is_rejected()** (4 connections) — `tests/test_update_projects.py`
- **discover_public_repos()** (4 connections) — `update_projects.py`
- *... and 28 more nodes in this community*

## Relationships

- [HTML and PDF Parsing](HTML_and_PDF_Parsing.md) (7 shared connections)
- [Environment Security Tests](Environment_Security_Tests.md) (4 shared connections)
- [PDF Resume Generation](PDF_Resume_Generation.md) (3 shared connections)
- [Local Preview Server](Local_Preview_Server.md) (2 shared connections)
- [Analytics and Review Docs](Analytics_and_Review_Docs.md) (1 shared connections)

## Source Files

- `build_site.py`
- `scripts/build_cv.py`
- `scripts/fetch_assets.py`
- `tests/conftest.py`
- `tests/test_site_structure.py`
- `tests/test_telemetry.py`
- `tests/test_update_projects.py`
- `update_projects.py`

## Audit Trail

- EXTRACTED: 133 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*