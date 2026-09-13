# Graph Report - joaosnet.github.io  (2026-09-13)

## Corpus Check
- 33 files · ~200,379 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1170 nodes · 1409 edges · 71 communities (53 shown, 18 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `511cb65d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 135|Community 135]]
- [[_COMMUNITY_Community 136|Community 136]]
- [[_COMMUNITY_Community 176|Community 176]]
- [[_COMMUNITY_Community 181|Community 181]]
- [[_COMMUNITY_Community 182|Community 182]]
- [[_COMMUNITY_Community 183|Community 183]]

## God Nodes (most connected - your core abstractions)
1. `pt` - 109 edges
2. `en` - 109 edges
3. `HorizontalScrollHandler` - 48 edges
4. `GeoViewsCounter` - 28 edges
5. `ScrollNavigationHandler` - 23 edges
6. `TestIndexHTMLStructure` - 19 edges
7. `main()` - 18 edges
8. `ThemeSelector` - 18 edges
9. `generate_project_html()` - 16 edges
10. `aethersense` - 15 edges

## Surprising Connections (you probably didn't know these)
- `private_preview()` --calls--> `read_json()`  [INFERRED]
  update_projects.py → build_site.py
- `main()` --calls--> `read_json()`  [INFERRED]
  update_projects.py → build_site.py
- `approve_export()` --calls--> `load_projects()`  [INFERRED]
  update_projects.py → build_site.py
- `build()` --calls--> `generate_cvs()`  [INFERRED]
  build_site.py → scripts/build_cv.py
- `test_skip_translation_if_portuguese()` --calls--> `translate_to_portuguese()`  [INFERRED]
  tests/test_update_projects.py → update_projects.py

## Communities (71 total, 18 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (11): collect_public_pages_links(), get_github_pages_url(), normalize_url(), Normalize user-facing URLs for project links., Return the public GitHub Pages URL for a repository when available.      GitHu, Normalize user-facing URLs for project links., Return the public GitHub Pages URL for a repository when available.      GitHu, Collect all public GitHub Pages links from the fetched repositories. (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (24): Configuration tests use synthetic environments; never open a developer's .env., Carregar .env não deve falhar, os.environ deve ser acessível, Testes para .gitignore, .gitignore deve existir, .env deve estar listado no .gitignore, .env.example NÃO deve estar no .gitignore (é público), Testes de segurança para variáveis de ambiente (+16 more)

### Community 3 - "Community 3"
Cohesion: 0.29
Nodes (6): Comparação visual, Evidências de validação, Limitações que permanecem explícitas, O que mudou, Origem da imagem social, Prévia para avaliação — 8 de setembro de 2026

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (28): generate_project_html(), Deve gerar link de GitHub Pages quando o projeto público tiver Pages, Deve gerar HTML correto para projeto privado, Deve lidar com descrição None, Deve lidar com descrição vazia, Deve usar descrição traduzida se disponível, Deve manter assinatura legada sem voltar ao layout alternado, Testes de validação de estrutura de projetos (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (20): Deve ter meta viewport para responsividade, Deve ter meta charset, Deve ter formulário de contato, Deve ter botão de troca de tema, Deve ter botão flutuante de contato, Deve ter contador de visitantes no footer, Deve ter link para download do currículo, Deve ter botão para contato no Telegram (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (27): detect_language(), Translate text to Portuguese using free translation APIs.     Tries multiple fr, Detect if text is likely in Portuguese or another language.     Returns 'pt' if, Detect if text is likely in Portuguese or another language.     Returns 'pt' if, Translate text to Portuguese using free translation APIs.     Tries multiple fr, translate_to_portuguese(), client(), Testes para o script update_projects.py Testa funcionalidades críticas como: - D (+19 more)

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (7): mask_repo_name(), Mask repository name if it's private to avoid leaking info in logs., Mask repository name if it's private to avoid leaking info in logs., Testes para mascaramento de nomes de repositórios, Deve mascarar nome de repo privado, Deve mostrar nome de repo público, TestMaskRepoName

### Community 21 - "Community 21"
Cohesion: 0.07
Nodes (29): 1. Testes Unitários (`tests/test_update_projects.py`), 2. Testes de Estrutura (`tests/test_site_structure.py`), 3. Testes de Variáveis de Ambiente (`tests/test_env_variables.py`), 📝 Adicionando Novos Testes, code:powershell (uv run ruff check build_site.py update_projects.py scripts t), code:python (import pytest), code:bash (# Ver saída detalhada), code:bash (uv run pytest tests/test_update_projects.py -v) (+21 more)

### Community 22 - "Community 22"
Cohesion: 0.40
Nodes (5): Replace owner avatar image URLs with a local placeholder inside the projects blo, Replace owner avatar image URLs with a local placeholder inside the projects blo, Replace owner avatar image URLs with a local placeholder inside the projects blo, Replace owner avatar image URLs with a local placeholder inside the projects blo, sanitize_existing_project_images()

### Community 23 - "Community 23"
Cohesion: 0.18
Nodes (8): load(), native(), option, picker, save(), status, supported, translate()

### Community 24 - "Community 24"
Cohesion: 0.15
Nodes (16): approve_export(), check_user_contributed(), fetch_repository(), main(), private_preview(), public_snapshot(), Explicit project imports. Public refreshes never receive private credentials., # IMPORTANT: Skip avatars.githubusercontent.com - these are user/org avatars, no (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.20
Nodes (7): badge, dialog, observer, sections, sequence, trigger, visited

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (16): download_image_for_private_repo(), _finalize_downloaded_image(), find_image_in_readme(), get_repo_default_branch(), optimize_image(), Extract image URL from README file.     Looks for markdown images: ![alt](url), For private repos, download the image and save it locally in the portfolio., For private repos, download the image and save it locally in the portfolio. (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.20
Nodes (10): fetch_projects(), find_repo_preview_image(), get_api_token(), Find the best preview image for a repository.      Strategy (in order):     1, Find the best preview image for a repository.      Strategy (in order):     1, Find the best preview image for a repository.      Strategy (in order):     1, Return the best available token, preferring PRIVATE_REPOS_TOKEN., Fetch repositories from GitHub API.     Tries authenticated endpoint first (pub (+2 more)

### Community 29 - "Community 29"
Cohesion: 0.33
Nodes (5): description, name, private, source, updated_at

### Community 30 - "Community 30"
Cohesion: 0.04
Nodes (48): carousel, initialSelected, isFiltersVisible, isPausedAfterLeave, isPausedOnHover, pillProgressInfo, pillProgressPaused, pillsCount (+40 more)

### Community 31 - "Community 31"
Cohesion: 0.12
Nodes (16): 1. Campos Coletados, 2. Código Pronto para o Google Apps Script, 3. Como Implantar no Google Sheets, Aba `Eventos` (Conversões & Interações), Aba `Visitas` (Acessos à Página), Analytics Próprio (Cookieless) — Registro & Dashboard no Google Sheets, Analytics próprio (cookieless) — registro no Google Sheets, code:javascript (/**) (+8 more)

### Community 34 - "Community 34"
Cohesion: 0.40
Nodes (5): commit_downloaded_images(), Commit downloaded images to git., Commit downloaded images to git., Commit downloaded images to git., Commit downloaded images to git.

### Community 37 - "Community 37"
Cohesion: 0.15
Nodes (10): Testes para validar arquivos JavaScript, Testes para validar arquivos JavaScript, utils.js não deve ter erros de sintaxe (verificação básica), geo-counter.js não deve ter erros de sintaxe (verificação básica), utils.js não deve ter erros de sintaxe (verificação básica), geo-counter.js não deve chamar APIs públicas de IP/geo no navegador, geo-counter.js não deve ter erros de sintaxe (verificação básica), geo-counter.js deve ter métodos de sincronização global com Apps Script (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.10
Nodes (16): Testes para validar diretórios de assets, Diretório de imagens de projetos deve existir, Diretório de webfonts deve existir, Diretório de imagens gerais deve existir, Testes para validar diretórios de assets, Diretório de imagens de projetos deve existir, Arquivo de currículo deve existir, Diretório de webfonts deve existir (+8 more)

### Community 40 - "Community 40"
Cohesion: 0.02
Nodes (109): pt, about_kicker, about_title, all, back, backend, case, close_notice (+101 more)

### Community 41 - "Community 41"
Cohesion: 0.02
Nodes (109): en, about_kicker, about_title, all, back, backend, case, close_notice (+101 more)

### Community 42 - "Community 42"
Cohesion: 0.38
Nodes (6): draw_annotated_box(), main(), process_pair(), Generate annotated comparison crops with professional red bounding boxes and pin, Draw a clean, surgical red bounding box with corner accents and a floating badge, Crop image, draw annotations, scale if needed, and save.

### Community 43 - "Community 43"
Cohesion: 0.05
Nodes (37): analytics_endpoint, analytics_validated, email, about, availability, description, education, education_detail (+29 more)

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (7): $(), applyFilter(), draw(), restartPillAnimation(), resumeCarouselTimer(), startCarouselTimer(), toast()

### Community 46 - "Community 46"
Cohesion: 0.13
Nodes (15): complete, computedAspectRatio, computedHeight, computedWidth, cssClass, display, heightAttr, loading (+7 more)

### Community 47 - "Community 47"
Cohesion: 0.13
Nodes (15): complete, computedAspectRatio, computedHeight, computedWidth, cssClass, display, heightAttr, loading (+7 more)

### Community 48 - "Community 48"
Cohesion: 0.13
Nodes (15): complete, computedAspectRatio, computedHeight, computedWidth, cssClass, display, heightAttr, loading (+7 more)

### Community 49 - "Community 49"
Cohesion: 0.04
Nodes (38): button, canvas, carouselCategories, context, controller, copy, currentYear, error (+30 more)

### Community 50 - "Community 50"
Cohesion: 0.13
Nodes (15): complete, computedAspectRatio, computedHeight, computedWidth, cssClass, display, heightAttr, loading (+7 more)

### Community 51 - "Community 51"
Cohesion: 0.13
Nodes (15): varedura, complete, computedAspectRatio, computedHeight, computedWidth, cssClass, display, heightAttr (+7 more)

### Community 52 - "Community 52"
Cohesion: 0.17
Nodes (10): Testes para validar arquivos CSS, styles.css deve existir, Testes para validar arquivos CSS, styles.css deve existir, Testes para validar arquivos CSS, styles.css deve ter override para tema claro, styles.css deve existir, styles.css deve ter override para tema claro (+2 more)

### Community 53 - "Community 53"
Cohesion: 0.20
Nodes (7): contact-form.js não deve ter erros de sintaxe (verificação básica), project-details.js não deve ter erros de sintaxe (verificação básica), contact-form.js não deve ter erros de sintaxe (verificação básica), contact-form.js não deve ter erros de sintaxe (verificação básica), project-details.js não deve ter erros de sintaxe (verificação básica), styles.css deve ter variáveis de tema, styles.css deve ter variáveis de tema

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (9): hasFallbackClass, imgDisplay, imgOpacity, imgVisibility, vectorDisplay, vectorVisibility, images, fallbackTest (+1 more)

### Community 55 - "Community 55"
Cohesion: 0.29
Nodes (3): parser(), Parser HTML simples para extrair informações, SimpleHTMLParser

### Community 56 - "Community 56"
Cohesion: 0.50
Nodes (3): generate_pages_links_html(), Generate the public GitHub Pages showcase block., Generate the public GitHub Pages showcase block.

### Community 58 - "Community 58"
Cohesion: 0.13
Nodes (6): HTMLParser, Page, Testes para validar a estrutura do site (index.html) Verifica: - Presença de mar, test_bilingual_routes_metadata_and_names(), test_every_local_link_and_asset_exists(), test_strict_csp_and_no_inline_event_handlers()

### Community 64 - "Community 64"
Cohesion: 0.14
Nodes (13): devDependencies, @axe-core/playwright, lighthouse, @playwright/test, prettier, name, private, scripts (+5 more)

### Community 66 - "Community 66"
Cohesion: 0.26
Nodes (11): capture(), emit(), flush(), id(), isLive(), names, notice, outcomes (+3 more)

### Community 70 - "Community 70"
Cohesion: 0.18
Nodes (10): Atualizar projetos, code:powershell (uv sync --frozen --extra dev), code:powershell (uv run python update_projects.py public), code:powershell (uv run ruff check build_site.py update_projects.py scripts/b), Editar conteúdo, João Silva Neto · Portfolio, Métricas e serviços externos, Prévia local (+2 more)

### Community 74 - "Community 74"
Cohesion: 0.31
Nodes (8): build(), load_projects(), Build only explicitly approved public assets. Never reads .env or calls the netw, read_json(), safe_url(), generate_cvs(), Generate concise, selectable bilingual PDFs using only documented profile facts., test_unsafe_links_are_rejected()

### Community 75 - "Community 75"
Cohesion: 0.20
Nodes (9): aethersense, stars, updated_at, dmovel, stars, updated_at, evolutionary-lab, stars (+1 more)

### Community 135 - "Community 135"
Cohesion: 0.29
Nodes (6): Controles novos, Fontes de conteúdo, Fronteira de publicação, Limites do GitHub Pages, Material histórico identificado, Revisão de segurança da evolução do portfólio

### Community 136 - "Community 136"
Cohesion: 0.33
Nodes (3): Handler, Serve only the generated site, with localized 404 pages and a test-friendly heal, SimpleHTTPRequestHandler

### Community 176 - "Community 176"
Cohesion: 0.40
Nodes (4): elements, pages, projects, releases

### Community 181 - "Community 181"
Cohesion: 0.40
Nodes (4): navLang, preference, saved, savedHue

## Knowledge Gaps
- **488 isolated node(s):** `name`, `private`, `version`, `test`, `test:browser` (+483 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pt` connect `Community 40` to `Community 41`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `projects` connect `Community 54` to `Community 46`, `Community 47`, `Community 48`, `Community 50`, `Community 51`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `Build only explicitly approved public assets. Never reads .env or calls the netw`, `name`, `private` to the rest of the system?**
  _662 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08865248226950355 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.06097560975609756 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._