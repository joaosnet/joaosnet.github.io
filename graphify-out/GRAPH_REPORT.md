# Graph Report - joaosnet.github.io  (2026-05-21)

## Corpus Check
- 21 files · ~1,337,871 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 452 nodes · 595 edges · 34 communities (18 shown, 16 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `035eebe6`
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
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]

## God Nodes (most connected - your core abstractions)
1. `HorizontalScrollHandler` - 47 edges
2. `ThemeSelector` - 17 edges
3. `generate_project_html()` - 16 edges
4. `TestIndexHTMLStructure` - 16 edges
5. `main()` - 14 edges
6. `GeoViewsCounter` - 13 edges
7. `AnimationsHandler` - 12 edges
8. `ContactFormHandler` - 12 edges
9. `ProjectDetailsModal` - 12 edges
10. `detect_language()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `test_skip_translation_if_portuguese()` --calls--> `translate_to_portuguese()`  [INFERRED]
  tests/test_update_projects.py → update_projects.py

## Communities (34 total, 16 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.21
Nodes (8): get_github_pages_url(), normalize_url(), Normalize user-facing URLs for project links., Return the public GitHub Pages URL for a repository when available.      GitHu, Normalize user-facing URLs for project links., Return the public GitHub Pages URL for a repository when available.      GitHu, Testes para links públicos de GitHub Pages, TestGitHubPagesLinks

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (16): Testes para validação de variáveis de ambiente Verifica: - Existência do arquivo, Carregar .env não deve falhar, os.environ deve ser acessível, Testes para .gitignore, .gitignore deve existir, .env deve estar listado no .gitignore, .env.example NÃO deve estar no .gitignore (é público), Testes de segurança para variáveis de ambiente (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (18): HTMLParser, parser(), Testes para validar a estrutura do site (index.html) Verifica: - Presença de mar, Testes para validar arquivos JavaScript, Parser HTML simples para extrair informações, Todos os arquivos JS obrigatórios devem existir, utils.js não deve ter erros de sintaxe (verificação básica), geo-counter.js não deve ter erros de sintaxe (verificação básica) (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (28): generate_project_html(), Deve gerar link de GitHub Pages quando o projeto público tiver Pages, Deve gerar HTML correto para projeto privado, Deve lidar com descrição None, Deve lidar com descrição vazia, Deve usar descrição traduzida se disponível, Deve manter assinatura legada sem voltar ao layout alternado, Testes de validação de estrutura de projetos (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (16): Deve ter meta viewport para responsividade, Deve ter meta charset, Deve ter formulário de contato, Deve ter botão de troca de tema, Deve ter botão flutuante de contato, Deve ter contador de visitantes no footer, Deve ter link para download do currículo, Deve ter botão para contato no Telegram (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (23): detect_language(), Translate text to Portuguese using free translation APIs.     Tries multiple fr, Detect if text is likely in Portuguese or another language.     Returns 'pt' if, Detect if text is likely in Portuguese or another language.     Returns 'pt' if, Translate text to Portuguese using free translation APIs.     Tries multiple fr, translate_to_portuguese(), Testes para o script update_projects.py Testa funcionalidades críticas como: - D, Testes para mascaramento de nomes de repositórios (+15 more)

### Community 12 - "Community 12"
Cohesion: 0.20
Nodes (6): Testes para validar diretórios de assets, Diretório de imagens de projetos deve existir, Diretório de webfonts deve existir, Diretório de imagens gerais deve existir, Arquivo de currículo deve existir, TestAssetDirectories

### Community 21 - "Community 21"
Cohesion: 0.07
Nodes (27): 1. Testes Unitários (`tests/test_update_projects.py`), 2. Testes de Estrutura (`tests/test_site_structure.py`), 3. Testes de Variáveis de Ambiente (`tests/test_env_variables.py`), 📝 Adicionando Novos Testes, code:bash (uv run pytest tests/ -v), code:python (import pytest), code:bash (# Ver saída detalhada), code:bash (uv run pytest tests/test_update_projects.py -v) (+19 more)

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (8): Testes para arquivo .env, Arquivo .env deve existir, Arquivo .env.example deve existir, .env deve estar no .gitignore, Arquivo .env não deve estar vazio (deve ter variáveis), .env.example deve ter todas as variáveis necessárias, Arquivo .env deve ter pelo menos PRIVATE_REPOS_TOKEN configurado, TestEnvFile

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (8): Architecture & Key Components, Code Conventions & Patterns, Critical Workflows, Development Guidelines, GitHub Copilot Instructions for joaosnet.github.io, Key Files, Project Overview, Removed Files (No Longer Needed)

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (6): check_user_contributed(), update_projects.py Automação para gerar as entradas de projetos no index.html, # IMPORTANT: Skip avatars.githubusercontent.com - these are user/org avatars, no, # IMPORTANT: Skip avatars.githubusercontent.com - these are user/org avatars, no, Check if the user has actually contributed to the repository.     Returns True, Check if the user has actually contributed to the repository.     Returns True

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (8): commit_downloaded_images(), generate_pages_links_html(), main(), Commit downloaded images to git., Commit downloaded images to git., Generate the public GitHub Pages showcase block., Generate the public GitHub Pages showcase block., update_index_html()

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (9): download_image_for_private_repo(), find_image_in_readme(), get_repo_default_branch(), For private repos, download the image and save it locally in the portfolio., For private repos, download the image and save it locally in the portfolio., Get the default branch of a repository using GitHub API., Extract image URL from README file.     Looks for markdown images: ![alt](url), Get the default branch of a repository using GitHub API. (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.33
Nodes (6): fetch_projects(), get_api_token(), Return the best available token, preferring PRIVATE_REPOS_TOKEN., Fetch repositories from GitHub API.     Tries authenticated endpoint first (pub, Return the best available token, preferring PRIVATE_REPOS_TOKEN., Fetch repositories from GitHub API.     Tries authenticated endpoint first (pub

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (6): find_repo_preview_image(), mask_repo_name(), Find the best preview image for a repository.      Strategy (in order):     1, Find the best preview image for a repository.      Strategy (in order):     1, Mask repository name if it's private to avoid leaking info in logs., Mask repository name if it's private to avoid leaking info in logs.

### Community 29 - "Community 29"
Cohesion: 0.50
Nodes (3): collect_public_pages_links(), Collect all public GitHub Pages links from the fetched repositories., Collect all public GitHub Pages links from the fetched repositories.

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (3): Replace owner avatar image URLs with a local placeholder inside the projects blo, Replace owner avatar image URLs with a local placeholder inside the projects blo, sanitize_existing_project_images()

## Knowledge Gaps
- **26 isolated node(s):** `PreToolUse`, `toggleBtn`, `graphify`, `graphify`, `Workflow: graphify` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_api_token()` connect `Community 27` to `Community 24`, `Community 25`, `Community 2`, `Community 28`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `generate_project_html()` connect `Community 4` to `Community 24`, `Community 0`, `Community 25`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `generate_project_html()` (e.g. with `.test_generate_html_public_project()` and `.test_generate_html_public_project_with_github_pages()`) actually correct?**
  _`generate_project_html()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `update_projects.py Automação para gerar as entradas de projetos no index.html`, `Detect if text is likely in Portuguese or another language.     Returns 'pt' if`, `Translate text to Portuguese using free translation APIs.     Tries multiple fr` to the rest of the system?**
  _154 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0851063829787234 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._