<div align="center">

# João Natividade · Portfolio

**Computer Engineering & Systems Software**  
*Static-First Architecture, High-Precision Backend, IoT & Verifiable Interfaces*

[![Validate & CI](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/validate.yml/badge.svg?branch=main)](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/validate.yml)
[![Pages Deploy](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/pages.yml/badge.svg?branch=main)](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/pages.yml)
[![Python 3.14](https://img.shields.io/badge/python-3.14-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Node.js 24](https://img.shields.io/badge/node.js-24-339933.svg?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![uv](https://img.shields.io/badge/package%20manager-uv-DE5FE9.svg)](https://github.com/astral-sh/uv)
[![WCAG 2.2 AAA](https://img.shields.io/badge/accessibility-WCAG%202.2%20AAA-4c1.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<br>

**English** · [Português](README.pt.md) · [Español](README.es.md)

[🌐 Live Portfolio](https://joaosnet.github.io/en/) • [📄 Résumé (EN)](https://joaosnet.github.io/docs/cv-joao-natividade-en.pdf) • [📄 Currículo (PT-BR)](https://joaosnet.github.io/docs/cv-joao-natividade-pt.pdf) • [📄 Currículum (ES)](https://joaosnet.github.io/docs/cv-joao-natividade-es.pdf) • [🔬 Interactive Lab](https://joaosnet.github.io/en/#lab)

---

</div>

## Overview

Source code for the professional portfolio of **João Natividade**, Computer Engineering student at Universidade Federal do Pará (UFPA).

Built with a **Static-First** design, the site executes zero JavaScript frameworks on the client. A deterministic Python compilation pipeline (`build_site.py`) with Jinja2 compiles structured content into static artifacts under `dist/`, ensuring deterministic output, sub-50ms initial render, and strict Core Web Vitals compliance.

---

## Architecture & System Topology

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        SYSTEM TOPOLOGY & PIPELINE                      │
│                                                                        │
│   [Structured Content]           [Compilation Engine]                  │
│     content/site.json        ──►    build_site.py (Jinja2)             │
│     content/projects.json    ──►    scripts/build_cv.py (ReportLab)    │
│     content/ui.json                                                    │
│                                            │                           │
│                                            ▼                           │
│   [Client Assets]                 [Static Artifacts]                   │
│     Vanilla JS + Modern CSS  ──►       dist/ (HTML, CSS, JS, PDFs)     │
│     WebP 16:9 + Vector SVG                 │                           │
│                                            ▼                           │
│   [Verification & CI]             [Automated Deployment]               │
│     Playwright + Axe + Pytest ──►    GitHub Pages (GitHub Actions)     │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Engineering Pillars

1. **WCAG 2.2 AAA Design System**: Contrast ratios exceed 7:1 across both dark and light modes. Theme preference is resolved synchronously from `localStorage` and `prefers-color-scheme` to eliminate flash of unstyled content (Zero FOUC).
2. **Static Internationalization (i18n)**: Native prerendered routes `/` (Portuguese) and `/en/` (English), supplemented by client-side translation fallback for additional locales. Bi-directional `hreflang` metadata ensures accurate search indexing.
3. **Privacy-First Telemetry**: Lightweight serverless collector hosted on Google Apps Script (`analytics/collector.gs`). Zero cookies, zero PII, no IP storage, and explicit user opt-out support.
4. **Deterministic Document Compilation**: Programmatic PDF resume generation via **ReportLab 5.x** with vector typography (`docs/cv-joao-natividade-en.pdf`, `docs/cv-joao-natividade-pt.pdf`, `docs/cv-joao-natividade-es.pdf`).

---

## Security Isolation & Credentials Protocol

This repository implements strict isolation boundaries documented in [docs/architecture-security-isolation.md](docs/architecture-security-isolation.md):

- **Zero-Credential Public Builds**: Neither `build_site.py` nor public GitHub Actions workflows require API keys or environment files. AST static analysis in `tests/test_env_variables.py` proves `dotenv` is never imported or loaded during production builds.
- **Fail-Safe Private Preview Isolation**: Evaluating private repositories with `update_projects.py private_preview` strictly requires `.private-preview/allowlist.json` and the `PRIVATE_REPOS_TOKEN` environment variable. If the variable is absent, execution halts immediately with zero network requests. All staging output is restricted to `.private-preview/` (git-ignored).
- **Safe Verification Protocol**: Never inspect credentials in terminal logs or agent context using `cat` or `echo`. Verify variable presence quietly:
  ```bash
  # POSIX / Bash: check without echoing secrets
  grep -sq "^PRIVATE_REPOS_TOKEN=" ~/.env && echo "Token present."

  # PowerShell: check without outputting file contents
  if (Test-Path "$HOME\.env") { Select-String -Path "$HOME\.env" -Pattern "^PRIVATE_REPOS_TOKEN=" -Quiet }
  ```
- **Interactive Secret Input**: To store credentials locally without printing characters on screen:
  ```bash
  # Typing is hidden via 'read -s'
  printf "Enter PRIVATE_REPOS_TOKEN (typing hidden): " && read -s val && echo && echo "PRIVATE_REPOS_TOKEN=$val" >> ~/.env && echo "Saved."
  ```

---

## Repository Structure

```text
.
├── .github/
│   ├── dependabot.yml           # Grouped automated dependency management
│   └── workflows/
│       ├── validate.yml         # CI pipeline (Ruff, Pytest, Playwright, Audits)
│       ├── pages.yml            # Deployment to GitHub Pages
│       └── update_projects.yml  # Scheduled GitHub repository synchronization
├── analytics/
│   ├── catalog.json             # Public telemetry events catalog
│   └── collector.gs             # Serverless backend (Google Apps Script)
├── assets/
│   ├── css/portfolio.css        # CSS custom properties, responsive grid & states
│   ├── js/                      # Vanilla JS modules (boot, portfolio, languages)
│   └── project-images/          # Responsive 16:9 WebP banners and thumbnails
├── content/                     # Structured JSON content and metadata (PT, EN, ES)
├── docs/                        # Technical specifications, architecture docs & PDFs
├── scripts/
│   ├── build_cv.py              # PDF compiler using ReportLab 5.x
│   └── preview.py               # Sandboxed local HTTP server serving dist/ only
├── templates/                   # Semantic Jinja2 templates (base, components, index)
├── tests/                       # Automated test suite (Pytest, Playwright E2E, Node)
├── build_site.py                # Main static site compilation entry point
├── update_projects.py           # GitHub API data collector and metadata manager
├── pyproject.toml               # Python 3.14 project manifest managed via uv
└── package.json                 # Node 24 dependencies and test scripts
```

---

## Local Development

### Prerequisites

- [Python 3.14+](https://www.python.org/)
- [uv](https://github.com/astral-sh/uv) (fast Python package and project manager)
- [Node.js 24+](https://nodejs.org/) & `npm`

### 1. Installation

```powershell
# Clone the repository
git clone https://github.com/joaosnet/joaosnet.github.io.git
cd joaosnet.github.io

# Synchronize virtualenv and install Node dependencies
uv sync --frozen --extra dev
npm ci --ignore-scripts
```

### 2. Compilation and Local Preview

```powershell
# Compile all pages, sitemaps, and PDF resumes
uv run python build_site.py

# Start the sandboxed preview server
uv run python scripts/preview.py --port 8765
```

Navigate to `http://localhost:8765/` (Portuguese) or `http://localhost:8765/en/` (English). The preview server serves strictly from `dist/` to prevent directory traversal into repository internals.

---

## Project Catalog Updates

Public repository metrics and releases can be synchronized from the GitHub API:

```powershell
# Query public repositories and regenerate content/projects.json
uv run python update_projects.py public

# Recompile the static distribution
uv run python build_site.py
```

Automated daily runs are managed by [`.github/workflows/update_projects.yml`](.github/workflows/update_projects.yml).

---

## Quality Assurance & The Bar

Every change must satisfy non-negotiable verification criteria prior to merge:

| Command | Verification Scope |
| :--- | :--- |
| `uv run ruff check` | Static linting and Python 3.14 rules |
| `uv run pytest` | 54 unit and integration tests (templates, telemetry, security isolation) |
| `npm run test:syntax` | ECMAScript module and syntax validation |
| `npm test` | 38 telemetry schema, sanitization, and formula-injection tests |
| `npm run test:browser` | 28 end-to-end browser tests (Desktop & Mobile) via Playwright |
| `uv run pip-audit --local` | Vulnerability scanning for Python packages |
| `npm audit` | Dependency audit for Node.js modules |
| `graphify update .` | AST-based architectural knowledge graph synchronization |

To run the complete verification suite:

```powershell
uv run python build_site.py
uv run ruff check .
uv run pytest tests -q -p no:cacheprovider
npm run test:syntax
npm test
npm run test:browser
uv run pip-audit --local
npm audit --audit-level=moderate
graphify update .
```

---

## Technical Documentation

- [Architecture, Data Governance & Security Isolation](docs/architecture-security-isolation.md)
- [Analytics Collector & Serverless Backend](docs/analytics-apps-script.md)
- [Security Review & Threat Model](docs/security-review.md)
- [Private Projects Guidelines](docs/private-projects.md)
- [Preview Review & Verification](docs/preview-review.md)

---

## Contact

- **Email**: [joaodacruznatividade+carreira@gmail.com](mailto:joaodacruznatividade+carreira@gmail.com)
- **LinkedIn**: [linkedin.com/in/joaonativi](https://www.linkedin.com/in/joaonativi/)
- **Lattes**: [lattes.cnpq.br/1140714924160415](https://lattes.cnpq.br/1140714924160415)
- **Website**: [joaosnet.github.io](https://joaosnet.github.io)

---

<div align="center">
  <sub>Engineered for technical precision, accessibility, and performance. © 2026 João Natividade.</sub>
</div>
