# Graph Report - joaosnet.github.io  (2026-11-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 397 nodes · 488 edges · 34 communities (20 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.88)
- Token cost: 1,290 input · 334 output

## Graph Freshness
- Built from commit: `d4bcfaf4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Portfolio Project Overview
- Deployment Pipeline
- Environment Security Tests
- Analytics and Review Docs
- GitHub Pages Deployment
- Dependabot Configuration
- Node Dependency Management
- Maintenance Workflows
- Node Core Utilities
- Project Update Automation
- Agent Documentation
- Claude AI Documentation
- Workflow Action Configuration
- Python Validation Workflow
- Environment Output Mapping
- Gemini AI Documentation
- Validation Job Steps
- Local Testing Documentation
- Conditional Workflow Steps
- Browser Validation Workflow
- Node Validation Workflow
- Workflow Trigger Rules
- Project Root Metadata
- Site Build Logic
- HTML and PDF Parsing
- Local Preview Server

## God Nodes (most connected - your core abstractions)
1. `with` - 14 edges
2. `Sheet` - 13 edges
3. `build()` - 12 edges
4. `with` - 12 edges
5. `read_json()` - 10 edges
6. `Testes Locais - Portfolio Website` - 10 edges
7. `main()` - 9 edges
8. `private_preview()` - 9 edges
9. `João Silva Neto · Portfolio` - 9 edges
10. `Page` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Limitações que permanecem explícitas` --references--> `main()`  [INFERRED]
  docs/preview-review.md → update_projects.py
- `test_build_cannot_delete_other_directories()` --calls--> `build()`  [EXTRACTED]
  tests/test_site_structure.py → build_site.py
- `test_metrics_have_no_transport_before_backend_validation()` --calls--> `read_json()`  [EXTRACTED]
  tests/test_site_structure.py → build_site.py
- `built()` --calls--> `build()`  [EXTRACTED]
  tests/test_site_structure.py → build_site.py
- `test_private_import_without_token_does_not_access_network()` --calls--> `private_preview()`  [EXTRACTED]
  tests/test_env_variables.py → update_projects.py

## Import Cycles
- None detected.

## Communities (34 total, 14 thin omitted)

### Community 0 - "Portfolio Project Overview"
Cohesion: 0.12
Nodes (16): 1. Acessibilidade e Design System AAA, 1. Clonagem e Instalação, 2. Compilação e Prévia Local, 2. Internacionalização Híbrida (I18n), 3. Coleta de Métricas Privacy-First, 4. Geração Programática de Currículos, Atualização de Projetos, Começando (Desenvolvimento Local) (+8 more)

### Community 1 - "Deployment Pipeline"
Cohesion: 0.08
Nodes (26): environment, needs, permissions, runs-on, steps, name, url, jobs (+18 more)

### Community 3 - "Analytics and Review Docs"
Cohesion: 0.09
Nodes (19): Dados e controles, Estado da entrega, Extrair insights, Implantação após a revisão, Métricas de interação · coletor v1, Retenção, segurança e limites, Comparação visual, Evidências de validação (+11 more)

### Community 4 - "GitHub Pages Deployment"
Cohesion: 0.18
Nodes (10): concurrency, cancel-in-progress, group, name, on, push, workflow_dispatch, permissions (+2 more)

### Community 5 - "Dependabot Configuration"
Cohesion: 0.20
Nodes (9): patterns, dependencies, interval, updates, directory, groups, package-ecosystem, schedule (+1 more)

### Community 7 - "Node Dependency Management"
Cohesion: 0.07
Nodes (25): devDependencies, @axe-core/playwright@4.14.0, lighthouse@13.5.0, @playwright/test@1.64.1, prettier@3.9.10, name, private, scripts (+17 more)

### Community 8 - "Maintenance Workflows"
Cohesion: 0.07
Nodes (28): jobs, maintenance, runs-on, steps, timeout-minutes, name, on, schedule (+20 more)

### Community 9 - "Node Core Utilities"
Cohesion: 0.07
Nodes (10): assert, catalog, context, fs, { randomUUID }, runtime(), Sheet, source (+2 more)

### Community 10 - "Project Update Automation"
Cohesion: 0.09
Nodes (21): jobs, update-projects, name, on, push, schedule, workflow_dispatch, permissions (+13 more)

### Community 13 - "Workflow Action Configuration"
Cohesion: 0.18
Nodes (11): with, cache, filters, if-no-files-found, include-hidden-files, name, node-version, path (+3 more)

### Community 14 - "Python Validation Workflow"
Cohesion: 0.20
Nodes (9): jobs, validate-python, name, permissions, contents, if, needs, runs-on (+1 more)

### Community 15 - "Environment Output Mapping"
Cohesion: 0.25
Nodes (8): outputs, runs-on, steps, changes, browser, node, python, id

### Community 17 - "Validation Job Steps"
Cohesion: 0.33
Nodes (6): validate, name, if, needs, runs-on, steps

### Community 21 - "Local Testing Documentation"
Cohesion: 0.07
Nodes (29): 1. Testes Unitários (`tests/test_update_projects.py`), 2. Testes de Estrutura (`tests/test_site_structure.py`), 3. Testes de Variáveis de Ambiente (`tests/test_env_variables.py`), 📝 Adicionando Novos Testes, code:powershell (uv run ruff check build_site.py update_projects.py scripts t), code:python (import pytest), code:bash (# Ver saída detalhada), code:bash (uv run pytest tests/test_update_projects.py -v) (+21 more)

### Community 28 - "Conditional Workflow Steps"
Cohesion: 0.47
Nodes (6): if, run, uses, steps, steps, steps

### Community 30 - "Browser Validation Workflow"
Cohesion: 0.40
Nodes (5): validate-browser, if, needs, runs-on, timeout-minutes

### Community 39 - "Node Validation Workflow"
Cohesion: 0.40
Nodes (5): validate-node, if, needs, runs-on, timeout-minutes

### Community 42 - "Workflow Trigger Rules"
Cohesion: 0.40
Nodes (5): on, pull_request, push, workflow_call, branches

### Community 57 - "Site Build Logic"
Cohesion: 0.08
Nodes (25): build(), load_projects(), read_json(), safe_url(), generate_cvs(), test_private_projects_require_review_and_cannot_export_sources(), test_live_production_telemetry_health(), test_telemetry_config_and_catalog_alignment() (+17 more)

### Community 58 - "HTML and PDF Parsing"
Cohesion: 0.12
Nodes (8): built(), Page, test_bilingual_routes_metadata_and_names(), test_build_cannot_delete_other_directories(), test_cv_is_one_page_selectable_and_factual(), test_every_local_link_and_asset_exists(), test_metrics_have_no_transport_before_backend_validation(), test_strict_csp_and_no_inline_event_handlers()

## Knowledge Gaps
- **1 isolated node(s):** `joaosnet-portfolio`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 231 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `main()` connect `Site Build Logic` to `Analytics and Review Docs`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **What connects `joaosnet-portfolio` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Portfolio Project Overview` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Why does `Limitações que permanecem explícitas` connect `Analytics and Review Docs` to `Site Build Logic`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `Deployment Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Analytics and Review Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.09057971014492754 - nodes in this community are weakly interconnected._
- **Should `Node Dependency Management` be split into smaller, more focused modules?**
  _Cohesion score 0.07308377896613191 - nodes in this community are weakly interconnected._