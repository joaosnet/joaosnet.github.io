<div align="center">

# João Natividade · Portfólio

**Engenharia de Computação & Software de Sistemas**  
*Arquitetura Static-First, Backend de Alta Precisão, IoT & Interfaces Verificáveis*

[![Validate & CI](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/validate.yml/badge.svg?branch=main)](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/validate.yml)
[![Pages Deploy](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/pages.yml/badge.svg?branch=main)](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/pages.yml)
[![Python 3.14](https://img.shields.io/badge/python-3.14-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Node.js 24](https://img.shields.io/badge/node.js-24-339933.svg?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![uv](https://img.shields.io/badge/package%20manager-uv-DE5FE9.svg)](https://github.com/astral-sh/uv)
[![WCAG 2.2 AAA](https://img.shields.io/badge/accessibility-WCAG%202.2%20AAA-4c1.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<br>

[English](README.md) · **Português** · [Español](README.es.md)

[🌐 Acessar Portfólio](https://joaosnet.github.io) • [📄 Currículo (PT-BR)](https://joaosnet.github.io/docs/cv-joao-natividade-pt.pdf) • [📄 Résumé (EN)](https://joaosnet.github.io/docs/cv-joao-natividade-en.pdf) • [📄 Currículum (ES)](https://joaosnet.github.io/docs/cv-joao-natividade-es.pdf) • [🔬 Laboratório](https://joaosnet.github.io#lab)

---

</div>

## Visão Geral

Código-fonte do portfólio profissional de **João Natividade**, estudante de Engenharia de Computação na Universidade Federal do Pará (UFPA).

Construído sob a arquitetura **Static-First**, o site não executa frameworks JavaScript no navegador. Um pipeline determinístico em Python (`build_site.py`) com Jinja2 compila o conteúdo estruturado em artefatos estáticos na pasta `dist/`, garantindo build reprodutível, carregamento sob 50ms e conformidade estrita com o Core Web Vitals.

---

## Arquitetura & Topologia do Sistema

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        TOPOLOGIA & PIPELINE DO SISTEMA                 │
│                                                                        │
│   [Conteúdo Estruturado]         [Motor de Compilação]                 │
│     content/site.json        ──►    build_site.py (Jinja2)             │
│     content/projects.json    ──►    scripts/build_cv.py (ReportLab)    │
│     content/ui.json                                                    │
│                                            │                           │
│                                            ▼                           │
│   [Assets do Cliente]             [Artefatos Estáticos]                │
│     Vanilla JS + Modern CSS  ──►       dist/ (HTML, CSS, JS, PDFs)     │
│     WebP 16:9 + SVG Vetorial               │                           │
│                                            ▼                           │
│   [Auditoria e CI/CD]             [Deploy Automatizado]                │
│     Playwright + Axe + Pytest ──►    GitHub Pages (GitHub Actions)     │
└────────────────────────────────────────────────────────────────────────┘
```

### Pilares de Engenharia

1. **Design System com Acessibilidade WCAG 2.2 AAA**: Relação de contraste acima de 7:1 em temas claro e escuro. Resolução síncrona de tema via `localStorage` e `prefers-color-scheme`, eliminando flash de tela desestilizada (Zero FOUC).
2. **Internacionalização Estática (i18n)**: Rotas nativas pré-renderizadas `/` (Português) e `/en/` (Inglês), com tradução dinâmica no cliente para idiomas adicionais. Metadados bidirecionais `hreflang` garantem indexação correta em motores de busca.
3. **Telemetria Privacy-First**: Coletor serverless leve em Google Apps Script (`analytics/collector.gs`). Zero cookies, zero dados pessoais (PII), sem registro de endereços IP e com suporte a *opt-out*.
4. **Compilação Programática de Documentos**: Geração automatizada de currículos em PDF com tipografia vetorial via **ReportLab 5.x** (`docs/cv-joao-natividade-pt.pdf`, `docs/cv-joao-natividade-en.pdf`, `docs/cv-joao-natividade-es.pdf`).

---

## Isolamento de Segurança & Protocolo de Credenciais

Este repositório adota limites rígidos de isolamento detalhados em [docs/architecture-security-isolation.md](docs/architecture-security-isolation.md):

- **Build Público Livre de Credenciais**: O compilador `build_site.py` e os workflows públicos do GitHub Actions não consomem chaves de API nem arquivos de ambiente. Testes de AST em `tests/test_env_variables.py` garantem que o módulo `dotenv` nunca é importado em produção.
- **Isolamento Fail-Safe em Projetos Privados**: A avaliação de repositórios privados via `update_projects.py private_preview` exige obrigatoriamente `.private-preview/allowlist.json` e a variável de ambiente `PRIVATE_REPOS_TOKEN`. Na ausência da variável, a execução aborta imediatamente sem qualquer requisição de rede. Arquivos temporários ficam restritos a `.private-preview/` (ignorado no git).
- **Protocolo de Verificação Segura**: Nunca inspecione variáveis ou credenciais via `cat` ou `echo`. Verifique a presença de tokens em modo silencioso:
  ```bash
  # POSIX / Bash: verificação sem vazamento no terminal
  grep -sq "^PRIVATE_REPOS_TOKEN=" ~/.env && echo "Token presente."

  # PowerShell: verificação sem exibir o arquivo
  if (Test-Path "$HOME\.env") { Select-String -Path "$HOME\.env" -Pattern "^PRIVATE_REPOS_TOKEN=" -Quiet }
  ```
- **Entrada Interativa de Credenciais**: Para salvar variáveis localmente sem expor os caracteres digitados:
  ```bash
  # Entrada oculta via 'read -s'
  printf "Digite PRIVATE_REPOS_TOKEN (entrada oculta): " && read -s val && echo && echo "PRIVATE_REPOS_TOKEN=$val" >> ~/.env && echo "Salvo."
  ```

---

## Estrutura do Repositório

```text
.
├── .github/
│   ├── dependabot.yml           # Gerenciamento de dependências automatizado
│   └── workflows/
│       ├── validate.yml         # Pipeline de CI (Ruff, Pytest, Playwright, Auditorias)
│       ├── pages.yml            # Publicação contínua no GitHub Pages
│       └── update_projects.yml  # Sincronização agendada de projetos do GitHub
├── analytics/
│   ├── catalog.json             # Catálogo público de eventos de telemetria
│   └── collector.gs             # Backend serverless em Google Apps Script
├── assets/
│   ├── css/portfolio.css        # Variáveis CSS, layout em grid e microinterações
│   ├── js/                      # JavaScript modular puro (boot, portfolio, languages)
│   └── project-images/          # Imagens de projetos em WebP 16:9
├── content/                     # Dados estruturados em JSON (PT, EN, ES)
├── docs/                        # Especificações técnicas, arquitetura e PDFs gerados
├── scripts/
│   ├── build_cv.py              # Compilador de currículos via ReportLab 5.x
│   └── preview.py               # Servidor local isolado servindo apenas dist/
├── templates/                   # Templates semânticos em Jinja2 (base, components, index)
├── tests/                       # Suíte automatizada de testes (Pytest, Playwright E2E, Node)
├── build_site.py                # Ponto de entrada da compilação estática
├── update_projects.py           # Coletor da API do GitHub e gestor de metadados
├── pyproject.toml               # Manifesto Python 3.14 gerenciado com uv
└── package.json                 # Dependências Node 24 e scripts de testes
```

---

## Desenvolvimento Local

### Pré-requisitos

- [Python 3.14+](https://www.python.org/)
- [uv](https://github.com/astral-sh/uv) (gerenciador de dependências e ambientes Python)
- [Node.js 24+](https://nodejs.org/) & `npm`

### 1. Instalação

```powershell
# Clonar o repositório
git clone https://github.com/joaosnet/joaosnet.github.io.git
cd joaosnet.github.io

# Sincronizar o ambiente Python e instalar dependências Node
uv sync --frozen --extra dev
npm ci --ignore-scripts
```

### 2. Compilação e Prévia Local

```powershell
# Compilar páginas, sitemaps e currículos em PDF
uv run python build_site.py

# Iniciar o servidor de prévia isolado
uv run python scripts/preview.py --port 8765
```

Acesse `http://localhost:8765/` (Português) ou `http://localhost:8765/en/` (Inglês). O servidor publica estritamente a pasta `dist/`, impedindo vazamento de arquivos internos.

---

## Atualização do Catálogo de Projetos

Para sincronizar métricas e lançamentos diretamente da API do GitHub:

```powershell
# Consultar repositórios públicos e regenerar content/projects.json
uv run python update_projects.py public

# Recompilar a distribuição estática
uv run python build_site.py
```

Execuções automáticas diárias são mantidas pelo workflow [`.github/workflows/update_projects.yml`](.github/workflows/update_projects.yml).

---

## Garantia de Qualidade & Critérios "The Bar"

Toda alteração deve atender a critérios rigorosos de aceitação antes da mesclagem:

| Comando | Escopo da Validação |
| :--- | :--- |
| `uv run ruff check` | Análise estática e regras de estilo do Python 3.14 |
| `uv run pytest` | 54 testes unitários e de integração (templates, isolamento, telemetria) |
| `npm run test:syntax` | Validação de sintaxe e módulos ECMAScript |
| `npm test` | 38 testes de esquema, sanitização e proteção contra injeção de fórmulas |
| `npm run test:browser` | 28 testes ponta a ponta (Desktop e Mobile) via Playwright |
| `uv run pip-audit --local` | Varredura de vulnerabilidades em dependências Python |
| `npm audit` | Auditoria de segurança de dependências Node.js |
| `graphify update .` | Atualização do grafo de conhecimento arquitetural via AST |

Execução da suíte completa de verificação:

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

## Documentação Técnica

- [Arquitetura, Governança de Dados e Isolamento de Segurança](docs/architecture-security-isolation.md)
- [Coletor de Telemetria e Backend Serverless](docs/analytics-apps-script.md)
- [Revisão de Segurança e Modelo de Ameaças](docs/security-review.md)
- [Diretrizes para Projetos Privados](docs/private-projects.md)
- [Revisão e Validação de Prévia](docs/preview-review.md)

---

## Contato

- **E-mail**: [joaodacruznatividade+carreira@gmail.com](mailto:joaodacruznatividade+carreira@gmail.com)
- **LinkedIn**: [linkedin.com/in/joaonativi](https://www.linkedin.com/in/joaonativi/)
- **Currículo Lattes**: [lattes.cnpq.br/1140714924160415](https://lattes.cnpq.br/1140714924160415)
- **Website**: [joaosnet.github.io](https://joaosnet.github.io)

---

<div align="center">
  <sub>Construído com foco em precisão técnica, acessibilidade e performance. © 2026 João Natividade.</sub>
</div>
