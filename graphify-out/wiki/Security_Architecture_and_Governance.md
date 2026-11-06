# Security Architecture and Governance

> 17 nodes · cohesion 0.15

## Key Concepts

- **test_env_variables.py** (8 connections) — `tests/test_env_variables.py`
- **Arquitetura, Governança de Dados e Isolamento de Segurança** (6 connections) — `docs/architecture-security-isolation.md`
- **4. Testes de Segurança em Ambiente Sintético (`tests/test_env_variables.py`)** (5 connections) — `docs/architecture-security-isolation.md`
- **5. Diretriz Universal para Agentes de IA: Knowledge Graph First** (5 connections) — `docs/architecture-security-isolation.md`
- **pytest** (4 connections)
- **test_private_import_without_token_does_not_access_network()** (4 connections) — `tests/test_env_variables.py`
- **test_import_does_not_load_dotenv()** (3 connections) — `tests/test_env_variables.py`
- **ast** (2 connections)
- **3. Isolamento e Segurança de Projetos Privados (`private_preview`)** (2 connections) — `docs/architecture-security-isolation.md`
- **test_private_review_and_env_are_ignored()** (2 connections) — `tests/test_env_variables.py`
- **architecture-security-isolation.md** (1 connections) — `docs/architecture-security-isolation.md`
- **1. Topologia do Sistema e Fronteira de Publicação** (1 connections) — `docs/architecture-security-isolation.md`
- **A. Proibição Estrita de Varredura Especulativa** (1 connections) — `docs/architecture-security-isolation.md`
- **B. Ordem de Navegação Obrigatória** (1 connections) — `docs/architecture-security-isolation.md`
- **C. Protocolo de Delegação para Subagentes** (1 connections) — `docs/architecture-security-isolation.md`
- **D. Higiene e Atualização do Grafo** (1 connections) — `docs/architecture-security-isolation.md`
- **Configuration tests use synthetic environments; never open a developer's .env.** (1 connections) — `tests/test_env_variables.py`

## Relationships

- [Build System and Agent Rules](Build_System_and_Agent_Rules.md) (7 shared connections)
- [HTML and PDF Parsing Tests](HTML_and_PDF_Parsing_Tests.md) (1 shared connections)

## Source Files

- `docs/architecture-security-isolation.md`
- `tests/test_env_variables.py`

## Audit Trail

- EXTRACTED: 23 (82%)
- INFERRED: 5 (18%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*