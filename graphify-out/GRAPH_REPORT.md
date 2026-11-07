# Graph Report - joaosnet.github.io  (2026-11-07)

## Corpus Check
- 50 files · ~76,301 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 4, .gs 1, .css 1)

## Summary
- 477 nodes · 626 edges · 34 communities (22 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8e640cf0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- João Natividade · Portfolio
- Deployment Pipeline Configuration
- test_env_variables.py
- Analytics and Review Documentation
- João Natividade · Portafolio
- Dependabot Configuration
- build_site.py
- Frontend Dependencies and Testing
- Maintenance Workflow
- Node.js Core Utilities
- Project Update Workflow
- preview.py
- Claude Agent Guidelines
- with
- João Natividade · Portfólio
- jobs
- Gemini Agent Guidelines
- outputs
- Local Test Suite Execution
- validate
- steps
- validate-browser
- validate-node
- Workflow Trigger Rules
- Project Root Identifier
- build_site.py

## God Nodes (most connected - your core abstractions)
1. `Sheet` - 16 edges
2. `fetch_project_images()` - 14 edges
3. `with` - 14 edges
4. `build()` - 13 edges
5. `read_json()` - 12 edges
6. `main()` - 12 edges
7. `private_preview()` - 12 edges
8. `with` - 12 edges
9. `João Natividade · Portafolio` - 10 edges
10. `João Natividade · Portfolio` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Limitações que permanecem explícitas` --references--> `main()`  [INFERRED]
  docs/preview-review.md → update_projects.py
- `3. Isolamento e Segurança de Projetos Privados (`private_preview`)` --references--> `private_preview()`  [INFERRED]
  docs/architecture-security-isolation.md → update_projects.py
- `4. Testes de Segurança em Ambiente Sintético (`tests/test_env_variables.py`)` --references--> `test_private_review_and_env_are_ignored()`  [INFERRED]
  docs/architecture-security-isolation.md → tests/test_env_variables.py
- `4. Testes de Segurança em Ambiente Sintético (`tests/test_env_variables.py`)` --references--> `private_preview()`  [INFERRED]
  docs/architecture-security-isolation.md → update_projects.py
- `4. Testes de Segurança em Ambiente Sintético (`tests/test_env_variables.py`)` --references--> `test_import_does_not_load_dotenv()`  [INFERRED]
  docs/architecture-security-isolation.md → tests/test_env_variables.py

## Import Cycles
- None detected.

## Communities (34 total, 12 thin omitted)

### Community 0 - "João Natividade · Portfolio"
Cohesion: 0.14
Nodes (14): 1. Installation, 2. Compilation and Local Preview, Architecture & System Topology, Contact, Core Engineering Pillars, João Natividade · Portfolio, Local Development, Overview (+6 more)

### Community 1 - "Deployment Pipeline Configuration"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, environment, needs, permissions, runs-on, steps (+28 more)

### Community 2 - "test_env_variables.py"
Cohesion: 0.15
Nodes (12): 1. Topologia do Sistema e Fronteira de Publicação, 3. Isolamento e Segurança de Projetos Privados (`private_preview`), 4. Testes de Segurança em Ambiente Sintético (`tests/test_env_variables.py`), 5. Diretriz Universal para Agentes de IA: Knowledge Graph First, A. Proibição Estrita de Varredura Especulativa, Arquitetura, Governança de Dados e Isolamento de Segurança, B. Ordem de Navegação Obrigatória, C. Protocolo de Delegação para Subagentes (+4 more)

### Community 3 - "Analytics and Review Documentation"
Cohesion: 0.11
Nodes (19): Dados e controles, Estado da entrega, Extrair insights, Implantação após a revisão, Métricas de interação · coletor v1, Retenção, segurança e limites, Comparação visual, Evidências de validação (+11 more)

### Community 4 - "João Natividade · Portafolio"
Cohesion: 0.14
Nodes (14): 1. Instalación, 2. Compilación y Previsualización Local, Actualización del Catálogo de Proyectos, Aislamiento de Seguridad & Protocolo de Credenciales, Arquitectura & Topología del Sistema, Contacto, Desarrollo Local, Documentación Técnica (+6 more)

### Community 5 - "Dependabot Configuration"
Cohesion: 0.20
Nodes (9): patterns, dependencies, interval, updates, directory, groups, package-ecosystem, schedule (+1 more)

### Community 6 - "build_site.py"
Cohesion: 0.08
Nodes (34): graphify & Knowledge Graph First, Rules for All Agents & Subagents:, 2. Ponto de Entrada `main()` e Governança de Dados, client(), test_api_failure_does_not_accept_redirect_or_data(), test_changed_review_digest_is_rejected(), test_download_project_image_optimizes_heavy_gif(), test_download_project_image_verifies_magic_bytes_and_path() (+26 more)

### Community 7 - "Frontend Dependencies and Testing"
Cohesion: 0.07
Nodes (26): devDependencies, @axe-core/playwright@4.14.0, lighthouse@13.5.0, @playwright/test@1.64.1, prettier@3.9.10, name, private, scripts (+18 more)

### Community 8 - "Maintenance Workflow"
Cohesion: 0.07
Nodes (28): jobs, maintenance, runs-on, steps, timeout-minutes, name, on, schedule (+20 more)

### Community 9 - "Node.js Core Utilities"
Cohesion: 0.06
Nodes (12): assert, catalog, context, fs, parseA1Notation(), path, { randomUUID }, runtime() (+4 more)

### Community 10 - "Project Update Workflow"
Cohesion: 0.09
Nodes (21): jobs, update-projects, name, on, push, schedule, workflow_dispatch, permissions (+13 more)

### Community 13 - "with"
Cohesion: 0.18
Nodes (11): with, cache, filters, if-no-files-found, include-hidden-files, name, node-version, path (+3 more)

### Community 14 - "João Natividade · Portfólio"
Cohesion: 0.14
Nodes (14): 1. Instalação, 2. Compilação e Prévia Local, Arquitetura & Topologia do Sistema, Atualização do Catálogo de Projetos, Contato, Desenvolvimento Local, Documentação Técnica, Estrutura do Repositório (+6 more)

### Community 15 - "jobs"
Cohesion: 0.20
Nodes (9): jobs, validate-python, name, permissions, contents, if, needs, runs-on (+1 more)

### Community 17 - "outputs"
Cohesion: 0.25
Nodes (8): outputs, runs-on, steps, changes, browser, node, python, id

### Community 21 - "Local Test Suite Execution"
Cohesion: 0.07
Nodes (29): 1. Testes Unitários (`tests/test_update_projects.py`), 2. Testes de Estrutura (`tests/test_site_structure.py`), 3. Testes de Variáveis de Ambiente (`tests/test_env_variables.py`), 📝 Adicionando Novos Testes, code:powershell (uv run ruff check build_site.py update_projects.py scripts t), code:python (import pytest), code:bash (# Ver saída detalhada), code:bash (uv run pytest tests/test_update_projects.py -v) (+21 more)

### Community 26 - "validate"
Cohesion: 0.33
Nodes (6): validate, name, if, needs, runs-on, steps

### Community 27 - "steps"
Cohesion: 0.47
Nodes (6): if, run, uses, steps, steps, steps

### Community 28 - "validate-browser"
Cohesion: 0.40
Nodes (5): validate-browser, if, needs, runs-on, timeout-minutes

### Community 29 - "validate-node"
Cohesion: 0.40
Nodes (5): validate-node, if, needs, runs-on, timeout-minutes

### Community 42 - "Workflow Trigger Rules"
Cohesion: 0.40
Nodes (5): on, pull_request, push, workflow_call, branches

### Community 136 - "build_site.py"
Cohesion: 0.05
Nodes (21): build(), get_content_lastmod(), load_projects(), read_json(), safe_url(), generate_cvs(), install(), built() (+13 more)

## Knowledge Gaps
- **1 isolated node(s):** `joaosnet-portfolio`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 269 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `main()` connect `build_site.py` to `preview.py`, `Analytics and Review Documentation`, `build_site.py`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **What connects `joaosnet-portfolio` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `João Natividade · Portfolio` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `Arquitetura, Governança de Dados e Isolamento de Segurança` connect `test_env_variables.py` to `Analytics and Review Documentation`, `build_site.py`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `Deployment Pipeline Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `test_env_variables.py` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._
- **Should `Analytics and Review Documentation` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._