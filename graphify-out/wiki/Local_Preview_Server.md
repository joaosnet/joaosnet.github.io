# Local Preview Server

> 8 nodes · cohesion 0.29

## Key Concepts

- **preview.py** (5 connections) — `scripts/preview.py`
- **Handler** (5 connections) — `scripts/preview.py`
- **.end_headers()** (2 connections) — `scripts/preview.py`
- **.send_error()** (2 connections) — `scripts/preview.py`
- **http_server** (1 connections)
- **.__init__()** (1 connections) — `scripts/preview.py`
- **Serve only the generated site, with localized 404 pages and a test-friendly…** (1 connections) — `scripts/preview.py`
- **SimpleHTTPRequestHandler** (1 connections)

## Relationships

- [Site Build Logic](Site_Build_Logic.md) (2 shared connections)

## Source Files

- `scripts/preview.py`

## Audit Trail

- EXTRACTED: 10 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*