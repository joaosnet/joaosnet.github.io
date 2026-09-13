<div align="center">

# João Silva Neto · Portfolio

**Engenharia de Computação & Desenvolvimento de Software**  
*Sistemas Conectados, Backend de Alta Precisão, IoT & Interfaces Verificáveis*

[![Validate & CI](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/validate.yml/badge.svg?branch=main)](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/validate.yml)
[![Pages Deploy](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/pages.yml/badge.svg?branch=main)](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/pages.yml)
[![Python 3.14](https://img.shields.io/badge/python-3.14-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Node.js 24](https://img.shields.io/badge/node.js-24-339933.svg?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![uv](https://img.shields.io/badge/package%20manager-uv-DE5FE9.svg)](https://github.com/astral-sh/uv)
[![WCAG 2.2 AAA](https://img.shields.io/badge/accessibility-WCAG%202.2%20AAA-4c1.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Dependabot Grouped](https://img.shields.io/badge/dependabot-grouped-0366d6.svg?logo=dependabot&logoColor=white)](https://github.com/joaosnet/joaosnet.github.io/blob/main/.github/dependabot.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[🌐 Acessar Portfólio](https://joaosnet.github.io) • [📄 Currículo (PT-BR)](https://joaosnet.github.io/docs/crv.pdf) • [📄 Résumé (EN)](https://joaosnet.github.io/docs/cv-joao-silva-neto-en.pdf) • [🔬 Laboratório](https://joaosnet.github.io#lab)

---

</div>

## Visão Geral

Este repositório abriga o código-fonte do portfólio profissional de **João Silva Neto**, graduando em Engenharia de Computação na Universidade Federal do Pará (UFPA). 

Construído sob a filosofia **Static-First**, o projeto não utiliza frameworks JavaScript pesados em tempo de execução no navegador. Todo o conteúdo editorial e páginas são compilados estaticamente para o diretório `dist/` através de um pipeline determinístico em Python (`build_site.py`) com Jinja2, garantindo tempos de carregamento instantâneos, segurança máxima e notas de excelência nos Core Web Vitals.

---

## Destaques de Engenharia & Padrão AAA

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITETURA DE CAMADAS                          │
│                                                                        │
│   [Conteúdo & Metadados]         [Motor de Renderização]               │
│     content/site.json        ──►    build_site.py (Jinja2)             │
│     content/projects.json    ──►    scripts/build_cv.py (ReportLab)    │
│     content/ui.json                                                    │
│                                            │                           │
│                                            ▼                           │
│   [Assets Otimizados]             [Publicação Estática]                │
│     Vanilla JS + Modern CSS  ──►       dist/ (HTML, CSS, JS, PDFs)     │
│     WebP 16:9 + SVG Vetorial               │                           │
│                                            ▼                           │
│   [Auditoria e CI/CD]             [Deploy Automatizado]                │
│     Playwright + Axe + Pytest ──►    GitHub Pages (GitHub Actions)     │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Acessibilidade e Design System AAA
- **Adaptação Automática de Tema**: Detecção síncrona de `prefers-color-scheme` (Dark/Light) com persistência em `localStorage` e zero flash de conteúdo desestilizado (*Zero FOUC*).
- **Contraste Rigoroso WCAG 2.2 AAA**: Relação de contraste validada acima de `7:1` em todos os elementos de texto e componentes interativos nos modos claro e escuro.
- **Microinterações Refinadas**: Carrossel de categorias com anel de contagem regressiva em SVG e congelamento milimétrico ao passar o cursor ou focar (`animation-play-state: paused`).

### 2. Internacionalização Híbrida (I18n)
- **Rotas Nacionais e Internacionais**: Rotas estáticas nativas `/` (Português) e `/en/` (Inglês) com detecção automática do idioma do navegador na primeira visita.
- **Tradutor Global**: Integração otimizada para mais de 10 idiomas sem bloqueios de CORS ou dependências invasivas.
- **SEO Multilíngue**: `sitemap.xml` e `robots.txt` completos, mapeando todas as rotas com anotações bidirecionais `xhtml:link rel="alternate" hreflang`.

### 3. Coleta de Métricas Privacy-First
- **Telemetria Serverless**: Coletor hospedado em Google Apps Script (`analytics/collector.gs`) com persistência em planilha dedicada.
- **Contador Dinâmico de Visitantes**: Exibição em tempo real do badge de navegadores únicos anuais (`Navegador nº 1.4xx em 2026`).
- **Privacidade por Padrão**: Zero rastreamento de dados pessoais, sem cookies de terceiros, sem armazenamento de endereços IP completos e com suporte a *opt-out*.

### 4. Geração Programática de Currículos
- Geração automática de currículos PDF de alta fidelidade com texto selecionável e vetorial via **ReportLab 5.x** em Português (`docs/crv.pdf`) e Inglês (`docs/cv-joao-silva-neto-en.pdf`).

---

## Estrutura do Repositório

```text
.
├── .github/
│   ├── dependabot.yml           # Atualizações automáticas agrupadas por ecossistema
│   └── workflows/
│       ├── validate.yml         # CI rigoroso (Ruff, Pytest, Playwright, Audits)
│       ├── pages.yml            # Deploy contínuo no GitHub Pages
│       └── update_projects.yml  # Sincronização diária de repositórios do GitHub
├── analytics/
│   ├── catalog.json             # Catálogo público de eventos de telemetria
│   └── collector.gs             # Backend em Google Apps Script (Serverless)
├── assets/
│   ├── css/portfolio.css        # Variáveis CSS, grid responsivo e microinterações
│   ├── js/                      # JavaScript modular sem frameworks (boot, portfolio, languages)
│   └── project-images/          # Banners e miniaturas otimizadas em WebP (16:9)
├── content/                     # Dados estruturados e textos editoriais (PT/EN)
├── scripts/
│   ├── build_cv.py              # Compilador de PDFs com ReportLab
│   └── preview.py               # Servidor local isolado servindo apenas dist/
├── templates/                   # Templates modulares Jinja2 (base, components, index)
├── tests/                       # Suíte automatizada (Unitários, Integração e E2E Playwright)
├── build_site.py                # Pipeline principal de compilação estática
├── update_projects.py           # Atualizador de metadados de projetos via API do GitHub
├── pyproject.toml               # Dependências Python gerenciadas via uv
└── package.json                 # Dependências Node.js e scripts de automação de testes
```

---

## Começando (Desenvolvimento Local)

### Pré-requisitos
- [Python 3.14+](https://www.python.org/)
- [uv](https://github.com/astral-sh/uv) (gerenciador de pacotes e ambientes virtuais ultrarrápido)
- [Node.js 24+](https://nodejs.org/) & `npm`

### 1. Clonagem e Instalação

```powershell
# Clonar o repositório
git clone https://github.com/joaosnet/joaosnet.github.io.git
cd joaosnet.github.io

# Sincronizar ambiente Python e dependências Node.js
uv sync --frozen --extra dev
npm ci --ignore-scripts
```

### 2. Compilação e Prévia Local

```powershell
# Compilar todas as páginas estáticas, sitemap e currículos em PDF
uv run python build_site.py

# Iniciar o servidor de visualização seguro
uv run python scripts/preview.py --port 8765
```

> [!NOTE]
> Acesse **http://localhost:8765/** (Português) ou **http://localhost:8765/en/** (Inglês).  
> O servidor de prévia publica estritamente a pasta `dist/`, impedindo exposição de arquivos internos da raiz.

---

## Atualização de Projetos

O catálogo de projetos pode ser atualizado com as estatísticas e metadados mais recentes do GitHub:

```powershell
# Consultar repositórios públicos e regenerar content/projects.json
uv run python update_projects.py public

# Recompilar a distribuição estática
uv run python build_site.py
```

> [!TIP]
> Em produção, este processo é executado de forma 100% autônoma todas as noites pelo workflow [`.github/workflows/update_projects.yml`](.github/workflows/update_projects.yml).

---

## Garantia de Qualidade & Critérios "The Bar"

Todas as alterações submetidas passam pelo ciclo rigoroso de validação local e CI:

| Comando | Descrição do Teste / Validação |
| :--- | :--- |
| `uv run ruff check` | Linting estático e aderência às regras do Python 3.14 |
| `uv run pytest` | 36 testes unitários e de integração de templates e estrutura |
| `npm run test:syntax` | Validação de sintaxe ECMAScript em todos os scripts JS |
| `npm test` | 23 testes unitários de telemetria, esquema e sanitização |
| `npm run test:browser` | 28 testes ponta a ponta (Desktop & Mobile) via Playwright |
| `uv run pip-audit --local` | Auditoria contra vulnerabilidades conhecidas em pacotes Python |
| `npm audit` | Auditoria de segurança de dependências Node.js |
| `graphify update .` | Atualização do grafo de conhecimento arquitetural do projeto |

Para rodar toda a suíte de qualidade de uma só vez:

```powershell
uv run python build_site.py
uv run ruff check .
uv run pytest tests -q -p no:cacheprovider
npm run test:syntax
npm test
npm run test:browser
uv run pip-audit --local
npm audit --audit-level=moderate
```

---

## Documentação Detalhada

- 📊 [**Configuração do Coletor e Apps Script**](docs/analytics-apps-script.md): Especificação da arquitetura serverless de telemetria.
- 🔒 [**Revisão de Segurança e Limites de Hospedagem**](docs/security-review.md): Modelo de ameaças e práticas de isolamento.
- 📁 [**Diretrizes para Projetos Privados**](docs/private-projects.md): Processo editorial de projetos proprietários e acadêmicos.
- 👁️ [**Revisão e Comparação de Prévia**](docs/preview-review.md): Procedimentos de inspeção de fidelidade visual.

---

## Contato & Redes

- **Website**: [joaosnet.github.io](https://joaosnet.github.io)
- **LinkedIn**: [linkedin.com/in/joaonativi](https://www.linkedin.com/in/joaonativi/)
- **Currículo Lattes**: [lattes.cnpq.br/1140714924160415](https://lattes.cnpq.br/1140714924160415)
- **E-mail Institucional**: [joao.silva.neto@itec.ufpa.br](mailto:joao.silva.neto@itec.ufpa.br)

---

<div align="center">
  <sub>Desenvolvido com foco em precisão técnica, acessibilidade e performance. © 2026 João Silva Neto.</sub>
</div>
