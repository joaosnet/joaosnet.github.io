<div align="center">

# João Natividade · Portafolio

**Ingeniería de Computación & Software de Sistemas**  
*Arquitectura Static-First, Backend de Alta Precisión, IoT & Interfaces Verificables*

[![Validate & CI](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/validate.yml/badge.svg?branch=main)](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/validate.yml)
[![Pages Deploy](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/pages.yml/badge.svg?branch=main)](https://github.com/joaosnet/joaosnet.github.io/actions/workflows/pages.yml)
[![Python 3.14](https://img.shields.io/badge/python-3.14-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Node.js 24](https://img.shields.io/badge/node.js-24-339933.svg?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![uv](https://img.shields.io/badge/package%20manager-uv-DE5FE9.svg)](https://github.com/astral-sh/uv)
[![WCAG 2.2 AAA](https://img.shields.io/badge/accessibility-WCAG%202.2%20AAA-4c1.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<br>

[English](README.md) · [Português](README.pt.md) · **Español**

[🌐 Ver Portafolio](https://joaosnet.github.io) • [📄 Currículum (ES)](https://joaosnet.github.io/docs/cv-joao-natividade-es.pdf) • [📄 Résumé (EN)](https://joaosnet.github.io/docs/cv-joao-natividade-en.pdf) • [📄 Currículo (PT-BR)](https://joaosnet.github.io/docs/cv-joao-natividade-pt.pdf) • [🔬 Laboratorio](https://joaosnet.github.io#lab)

---

</div>

## Visión General

Código fuente del portafolio profesional de **João Natividade**, estudiante de Ingeniería de Computación en la Universidade Federal do Pará (UFPA).

Construido bajo la arquitectura **Static-First**, el sitio no ejecuta frameworks JavaScript en el cliente. Un flujo determinista en Python (`build_site.py`) con Jinja2 compila el contenido estructurado en artefactos estáticos dentro de `dist/`, asegurando compilaciones reproducibles, tiempos de respuesta menores a 50 ms y cumplimiento estricto de Core Web Vitals.

---

## Arquitectura & Topología del Sistema

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        TOPOLOGÍA & PIPELINE DEL SISTEMA                │
│                                                                        │
│   [Contenido Estructurado]       [Motor de Compilación]                │
│     content/site.json        ──►    build_site.py (Jinja2)             │
│     content/projects.json    ──►    scripts/build_cv.py (ReportLab)    │
│     content/ui.json                                                    │
│                                            │                           │
│                                            ▼                           │
│   [Recursos de Cliente]           [Artefactos Estáticos]               │
│     Vanilla JS + Modern CSS  ──►       dist/ (HTML, CSS, JS, PDFs)     │
│     WebP 16:9 + Vector SVG                 │                           │
│                                            ▼                           │
│   [Auditoría y CI/CD]             [Despliegue Automatizado]            │
│     Playwright + Axe + Pytest ──►    GitHub Pages (GitHub Actions)     │
└────────────────────────────────────────────────────────────────────────┘
```

### Pilares de Ingeniería

1. **Sistema de Diseño Accesible WCAG 2.2 AAA**: Relación de contraste superior a 7:1 en modos claro y oscuro. Detección síncrona de tema mediante `localStorage` y `prefers-color-scheme`, eliminando el parpadeo de contenido sin estilo (Zero FOUC).
2. **Internacionalización Estática (i18n)**: Rutas nativas pre-renderizadas `/` (portugués) y `/en/` (inglés), complementadas con traducción en el cliente para idiomas adicionales. Metadatos bidireccionales `hreflang` para indexación precisa en motores de búsqueda.
3. **Telemetría Privacy-First**: Colector serverless ligero en Google Apps Script (`analytics/collector.gs`). Cero cookies, cero datos personales identificables (PII), sin almacenamiento de direcciones IP y con soporte para *opt-out*.
4. **Compilación Programática de Documentos**: Generación automatizada de currículums en PDF con tipografía vectorial mediante **ReportLab 5.x** (`docs/cv-joao-natividade-es.pdf`, `docs/cv-joao-natividade-en.pdf`, `docs/cv-joao-natividade-pt.pdf`).

---

## Aislamiento de Seguridad & Protocolo de Credenciales

Este repositorio aplica límites estrictos de aislamiento especificados en [docs/architecture-security-isolation.md](docs/architecture-security-isolation.md):

- **Compilación Pública Libre de Credenciales**: El compilador `build_site.py` y los flujos de GitHub Actions no consumen claves de API ni archivos `.env`. Las pruebas estáticas de AST en `tests/test_env_variables.py` validan que el módulo `dotenv` nunca se importa en producción.
- **Aislamiento Fail-Safe para Proyectos Privados**: La evaluación de repositorios privados con `update_projects.py private_preview` exige obligatoriamente el archivo `.private-preview/allowlist.json` y la variable de entorno `PRIVATE_REPOS_TOKEN`. Si la variable no está configurada, la ejecución se interrumpe inmediatamente sin realizar peticiones de red. La salida temporal queda aislada en `.private-preview/` (ignorado por git).
- **Protocolo de Verificación Segura**: No exponga variables ni claves en consolas o contextos de agentes usando `cat` o `echo`. Compruebe la presencia de variables de forma silenciosa:
  ```bash
  # POSIX / Bash: comprobación sin imprimir valores
  grep -sq "^PRIVATE_REPOS_TOKEN=" ~/.env && echo "Token presente."

  # PowerShell: comprobación sin emitir contenido
  if (Test-Path "$HOME\.env") { Select-String -Path "$HOME\.env" -Pattern "^PRIVATE_REPOS_TOKEN=" -Quiet }
  ```
- **Entrada Interactiva de Credenciales**: Para almacenar variables localmente sin mostrar caracteres en pantalla:
  ```bash
  # Entrada oculta con 'read -s'
  printf "Introduzca PRIVATE_REPOS_TOKEN (entrada oculta): " && read -s val && echo && echo "PRIVATE_REPOS_TOKEN=$val" >> ~/.env && echo "Guardado."
  ```

---

## Estructura del Repositorio

```text
.
├── .github/
│   ├── dependabot.yml           # Gestión automatizada de dependencias
│   └── workflows/
│       ├── validate.yml         # Pipeline de CI (Ruff, Pytest, Playwright, Auditorías)
│       ├── pages.yml            # Despliegue en GitHub Pages
│       └── update_projects.yml  # Sincronización programada de proyectos de GitHub
├── analytics/
│   ├── catalog.json             # Catálogo público de eventos de telemetría
│   └── collector.gs             # Backend serverless en Google Apps Script
├── assets/
│   ├── css/portfolio.css        # Variables CSS, diseño responsivo y microinteracciones
│   ├── js/                      # Módulos JavaScript nativos (boot, portfolio, languages)
│   └── project-images/          # Banners e imágenes en formato WebP 16:9
├── content/                     # Contenido estructurado en JSON (PT, EN, ES)
├── docs/                        # Especificaciones técnicas, arquitectura y PDFs
├── scripts/
│   ├── build_cv.py              # Compilador de currículums con ReportLab 5.x
│   └── preview.py               # Servidor local aislado que expone únicamente dist/
├── templates/                   # Plantillas modulares Jinja2 (base, components, index)
├── tests/                       # Batería de pruebas automatizadas (Pytest, Playwright, Node)
├── build_site.py                # Entrada principal de compilación estática
├── update_projects.py           # Gestor de metadados y colector de API de GitHub
├── pyproject.toml               # Manifiesto de Python 3.14 administrado con uv
└── package.json                 # Dependencias Node 24 y scripts de pruebas
```

---

## Desarrollo Local

### Requisitos Previos

- [Python 3.14+](https://www.python.org/)
- [uv](https://github.com/astral-sh/uv) (gestor rápido de paquetes y entornos de Python)
- [Node.js 24+](https://nodejs.org/) & `npm`

### 1. Instalación

```powershell
# Clonar el repositorio
git clone https://github.com/joaosnet/joaosnet.github.io.git
cd joaosnet.github.io

# Sincronizar el entorno de Python e instalar dependencias Node
uv sync --frozen --extra dev
npm ci --ignore-scripts
```

### 2. Compilación y Previsualización Local

```powershell
# Compilar páginas estáticas, mapas de sitio y currículums en PDF
uv run python build_site.py

# Iniciar el servidor local aislado
uv run python scripts/preview.py --port 8765
```

Visite `http://localhost:8765/` (portugués) o `http://localhost:8765/en/` (inglés). El servidor sirve estrictamente desde `dist/`, impidiendo accesos indebidos a archivos de la raíz.

---

## Actualización del Catálogo de Proyectos

Para sincronizar estadísticas y lanzamientos públicos desde la API de GitHub:

```powershell
# Consultar repositorios públicos y regenerar content/projects.json
uv run python update_projects.py public

# Recompilar los archivos estáticos
uv run python build_site.py
```

Las ejecuciones programadas se gestionan mediante el workflow [`.github/workflows/update_projects.yml`](.github/workflows/update_projects.yml).

---

## Garantía de Calidad & Criterios "The Bar"

Cada cambio debe cumplir con criterios innegociables de validación antes de su integración:

| Comando | Alcance de la Validación |
| :--- | :--- |
| `uv run ruff check` | Linting estático y reglas de Python 3.14 |
| `uv run pytest` | 54 pruebas unitarias y de integración (plantillas, aislamiento, telemetría) |
| `npm run test:syntax` | Validación de sintaxis y módulos ECMAScript |
| `npm test` | 38 pruebas de esquema, sanitización e inyección de fórmulas |
| `npm run test:browser` | 28 pruebas de navegador de extremo a extremo con Playwright |
| `uv run pip-audit --local` | Auditoría de vulnerabilidades en paquetes Python |
| `npm audit` | Auditoría de seguridad de dependencias Node.js |
| `graphify update .` | Sincronización del grafo de conocimiento arquitectónico vía AST |

Ejecución de la suite completa de pruebas:

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

## Documentación Técnica

- [Arquitectura, Gobernanza de Datos y Aislamiento de Seguridad](docs/architecture-security-isolation.md)
- [Colector de Telemetría y Backend Serverless](docs/analytics-apps-script.md)
- [Revisión de Seguridad y Modelo de Amenazas](docs/security-review.md)
- [Directrices para Proyectos Privados](docs/private-projects.md)
- [Revisión y Validación de Previsualizaciones](docs/preview-review.md)

---

## Contacto

- **Correo electrónico**: [joaodacruznatividade+carreira@gmail.com](mailto:joaodacruznatividade+carreira@gmail.com)
- **LinkedIn**: [linkedin.com/in/joaonativi](https://www.linkedin.com/in/joaonativi/)
- **Currículum Lattes**: [lattes.cnpq.br/1140714924160415](https://lattes.cnpq.br/1140714924160415)
- **Sitio web**: [joaosnet.github.io](https://joaosnet.github.io)

---

<div align="center">
  <sub>Desarrollado con enfoque en precisión técnica, accesibilidad y rendimiento. © 2026 João Natividade.</sub>
</div>
