# Graph Report - joaosnet.github.io  (2026-11-06)

## Corpus Check
- 45 files · ~49,338 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 4, .gs 1, .css 1)

## Summary
- 407 nodes · 487 edges · 33 communities (21 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5b1ec2a5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Portfolio Features and Documentation
- Deployment Pipeline Configuration
- Security Architecture and Governance
- Analytics and Review Documentation
- GitHub Pages Deployment
- Dependabot Configuration
- Bilingual CV Generation
- Frontend Dependencies and Testing
- Maintenance Workflow
- Node.js Core Utilities
- Project Update Workflow
- Claude Agent Guidelines
- CI Cache and Environment Setup
- Python Validation Workflow
- Multi-Language Build Steps
- Gemini Agent Guidelines
- Validation Job Definitions
- Local Test Suite Execution
- Conditional Workflow Steps
- Browser Validation Workflow
- Node.js Validation Workflow
- Workflow Trigger Rules
- Project Root Identifier
- Build System and Agent Rules
- HTML and PDF Parsing Tests
- Local Preview Server

## God Nodes (most connected - your core abstractions)
1. `with` - 14 edges
2. `Sheet` - 13 edges
3. `with` - 12 edges
4. `private_preview()` - 12 edges
5. `main()` - 11 edges
6. `Testes Locais - Portfolio Website` - 10 edges
7. `João Silva Neto · Portfolio` - 9 edges
8. `Page` - 8 edges
9. `client()` - 8 edges
10. `read_json()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `3. Isolamento e Segurança de Projetos Privados (`private_preview`)` --references--> `private_preview()`  [INFERRED]
  docs/architecture-security-isolation.md → update_projects.py
- `Limitações que permanecem explícitas` --references--> `main()`  [INFERRED]
  docs/preview-review.md → update_projects.py
- `4. Testes de Segurança em Ambiente Sintético (`tests/test_env_variables.py`)` --references--> `test_private_review_and_env_are_ignored()`  [INFERRED]
  docs/architecture-security-isolation.md → tests/test_env_variables.py
- `4. Testes de Segurança em Ambiente Sintético (`tests/test_env_variables.py`)` --references--> `private_preview()`  [INFERRED]
  docs/architecture-security-isolation.md → update_projects.py
- `4. Testes de Segurança em Ambiente Sintético (`tests/test_env_variables.py`)` --references--> `test_import_does_not_load_dotenv()`  [INFERRED]
  docs/architecture-security-isolation.md → tests/test_env_variables.py

## Import Cycles
- None detected.

## Communities (33 total, 12 thin omitted)

### Community 0 - "Portfolio Features and Documentation"
Cohesion: 0.12
Nodes (16): 1. Acessibilidade e Design System AAA, 1. Clonagem e Instalação, 2. Compilação e Prévia Local, 2. Internacionalização Híbrida (I18n), 3. Coleta de Métricas Privacy-First, 4. Geração Programática de Currículos, Atualização de Projetos, Começando (Desenvolvimento Local) (+8 more)

### Community 1 - "Deployment Pipeline Configuration"
Cohesion: 0.08
Nodes (26): environment, needs, permissions, runs-on, steps, name, url, jobs (+18 more)

### Community 2 - "Security Architecture and Governance"
Cohesion: 0.15
Nodes (12): 1. Topologia do Sistema e Fronteira de Publicação, 3. Isolamento e Segurança de Projetos Privados (`private_preview`), 4. Testes de Segurança em Ambiente Sintético (`tests/test_env_variables.py`), 5. Diretriz Universal para Agentes de IA: Knowledge Graph First, A. Proibição Estrita de Varredura Especulativa, Arquitetura, Governança de Dados e Isolamento de Segurança, B. Ordem de Navegação Obrigatória, C. Protocolo de Delegação para Subagentes (+4 more)

### Community 3 - "Analytics and Review Documentation"
Cohesion: 0.09
Nodes (19): Dados e controles, Estado da entrega, Extrair insights, Implantação após a revisão, Métricas de interação · coletor v1, Retenção, segurança e limites, Comparação visual, Evidências de validação (+11 more)

### Community 4 - "GitHub Pages Deployment"
Cohesion: 0.18
Nodes (10): concurrency, cancel-in-progress, group, name, on, push, workflow_dispatch, permissions (+2 more)

### Community 5 - "Dependabot Configuration"
Cohesion: 0.20
Nodes (9): patterns, dependencies, interval, updates, directory, groups, package-ecosystem, schedule (+1 more)

### Community 7 - "Frontend Dependencies and Testing"
Cohesion: 0.07
Nodes (25): devDependencies, @axe-core/playwright@4.14.0, lighthouse@13.5.0, @playwright/test@1.64.1, prettier@3.9.10, name, private, scripts (+17 more)

### Community 8 - "Maintenance Workflow"
Cohesion: 0.07
Nodes (28): jobs, maintenance, runs-on, steps, timeout-minutes, name, on, schedule (+20 more)

### Community 9 - "Node.js Core Utilities"
Cohesion: 0.07
Nodes (10): assert, catalog, context, fs, { randomUUID }, runtime(), Sheet, source (+2 more)

### Community 10 - "Project Update Workflow"
Cohesion: 0.09
Nodes (21): jobs, update-projects, name, on, push, schedule, workflow_dispatch, permissions (+13 more)

### Community 13 - "CI Cache and Environment Setup"
Cohesion: 0.18
Nodes (11): with, cache, filters, if-no-files-found, include-hidden-files, name, node-version, path (+3 more)

### Community 14 - "Python Validation Workflow"
Cohesion: 0.20
Nodes (9): jobs, validate-python, name, permissions, contents, if, needs, runs-on (+1 more)

### Community 15 - "Multi-Language Build Steps"
Cohesion: 0.25
Nodes (8): outputs, runs-on, steps, changes, browser, node, python, id

### Community 17 - "Validation Job Definitions"
Cohesion: 0.33
Nodes (6): validate, name, if, needs, runs-on, steps

### Community 21 - "Local Test Suite Execution"
Cohesion: 0.07
Nodes (29): 1. Testes Unitários (`tests/test_update_projects.py`), 2. Testes de Estrutura (`tests/test_site_structure.py`), 3. Testes de Variáveis de Ambiente (`tests/test_env_variables.py`), 📝 Adicionando Novos Testes, code:powershell (uv run ruff check build_site.py update_projects.py scripts t), code:python (import pytest), code:bash (# Ver saída detalhada), code:bash (uv run pytest tests/test_update_projects.py -v) (+21 more)

### Community 28 - "Conditional Workflow Steps"
Cohesion: 0.47
Nodes (6): if, run, uses, steps, steps, steps

### Community 30 - "Browser Validation Workflow"
Cohesion: 0.40
Nodes (5): validate-browser, if, needs, runs-on, timeout-minutes

### Community 39 - "Node.js Validation Workflow"
Cohesion: 0.40
Nodes (5): validate-node, if, needs, runs-on, timeout-minutes

### Community 42 - "Workflow Trigger Rules"
Cohesion: 0.40
Nodes (5): on, pull_request, push, workflow_call, branches

### Community 57 - "Build System and Agent Rules"
Cohesion: 0.08
Nodes (23): graphify & Knowledge Graph First, Rules for All Agents & Subagents:, read_json(), 2. Ponto de Entrada `main()` e Governança de Dados, test_live_production_telemetry_health(), test_telemetry_config_and_catalog_alignment(), client(), test_api_failure_does_not_accept_redirect_or_data() (+15 more)

### Community 58 - "HTML and PDF Parsing Tests"
Cohesion: 0.11
Nodes (8): built(), Page, test_bilingual_routes_metadata_and_names(), test_cv_is_one_page_selectable_and_factual(), test_every_local_link_and_asset_exists(), test_metrics_have_no_transport_before_backend_validation(), test_private_projects_require_review_and_cannot_export_sources(), test_strict_csp_and_no_inline_event_handlers()

## Knowledge Gaps
- **1 isolated node(s):** `joaosnet-portfolio`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 238 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `main()` connect `Build System and Agent Rules` to `Analytics and Review Documentation`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `private_preview()` (e.g. with `Rules for All Agents & Subagents:` and `3. Isolamento e Segurança de Projetos Privados (`private_preview`)`) actually correct?**
  _`private_preview()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `joaosnet-portfolio` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Portfolio Features and Documentation` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Why does `Limitações que permanecem explícitas` connect `Analytics and Review Documentation` to `Build System and Agent Rules`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `main()` (e.g. with `Rules for All Agents & Subagents:` and `2. Ponto de Entrada `main()` e Governança de Dados`) actually correct?**
  _`main()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `Deployment Pipeline Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._