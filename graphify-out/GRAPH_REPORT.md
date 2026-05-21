# Graph Report - .  (2026-05-21)

## Corpus Check
- 29 files · ~233,418 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 379 nodes · 520 edges · 21 communities (9 shown, 12 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.8)
- Token cost: 125,606 input · 1,837 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Project Sync Pipeline|Project Sync Pipeline]]
- [[_COMMUNITY_Horizontal Scroll UI|Horizontal Scroll UI]]
- [[_COMMUNITY_Environment Security Tests|Environment Security Tests]]
- [[_COMMUNITY_Site Structure Tests|Site Structure Tests]]
- [[_COMMUNITY_Project HTML Tests|Project HTML Tests]]
- [[_COMMUNITY_Index Feature Tests|Index Feature Tests]]
- [[_COMMUNITY_Translation Utilities|Translation Utilities]]
- [[_COMMUNITY_Theme Selector Modal|Theme Selector Modal]]
- [[_COMMUNITY_Visit Counter|Visit Counter]]
- [[_COMMUNITY_Scroll Animations|Scroll Animations]]
- [[_COMMUNITY_Contact Form|Contact Form]]
- [[_COMMUNITY_Project Detail Modal|Project Detail Modal]]
- [[_COMMUNITY_Asset Directory Tests|Asset Directory Tests]]
- [[_COMMUNITY_Mobile Menu|Mobile Menu]]
- [[_COMMUNITY_Legacy Theme UI|Legacy Theme UI]]
- [[_COMMUNITY_Theme Manager|Theme Manager]]
- [[_COMMUNITY_Particle Effects|Particle Effects]]
- [[_COMMUNITY_Index Fixture Loader|Index Fixture Loader]]
- [[_COMMUNITY_Translation Skip Case|Translation Skip Case]]

## God Nodes (most connected - your core abstractions)
1. `HorizontalScrollHandler` - 45 edges
2. `generate_project_html()` - 16 edges
3. `ThemeSelector` - 16 edges
4. `TestIndexHTMLStructure` - 16 edges
5. `main()` - 14 edges
6. `GeoViewsCounter` - 13 edges
7. `AnimationsHandler` - 12 edges
8. `ContactFormHandler` - 12 edges
9. `ProjectDetailsModal` - 12 edges
10. `detect_language()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `test_skip_translation_if_portuguese()` --calls--> `translate_to_portuguese()`  [INFERRED]
  tests/test_update_projects.py → update_projects.py

## Communities (21 total, 12 thin omitted)

### Community 0 - "Project Sync Pipeline"
Cohesion: 0.06
Nodes (38): check_user_contributed(), collect_public_pages_links(), commit_downloaded_images(), download_image_for_private_repo(), fetch_projects(), find_image_in_readme(), find_repo_preview_image(), generate_pages_links_html() (+30 more)

### Community 2 - "Environment Security Tests"
Cohesion: 0.05
Nodes (24): Testes para validação de variáveis de ambiente Verifica: - Existência do arquivo, Carregar .env não deve falhar, os.environ deve ser acessível, Testes para .gitignore, .gitignore deve existir, .env deve estar listado no .gitignore, .env.example NÃO deve estar no .gitignore (é público), Testes de segurança para variáveis de ambiente (+16 more)

### Community 3 - "Site Structure Tests"
Cohesion: 0.06
Nodes (18): HTMLParser, parser(), Testes para validar a estrutura do site (index.html) Verifica: - Presença de mar, Testes para validar arquivos JavaScript, Parser HTML simples para extrair informações, Todos os arquivos JS obrigatórios devem existir, utils.js não deve ter erros de sintaxe (verificação básica), geo-counter.js não deve ter erros de sintaxe (verificação básica) (+10 more)

### Community 4 - "Project HTML Tests"
Cohesion: 0.08
Nodes (20): generate_project_html(), Deve gerar link de GitHub Pages quando o projeto público tiver Pages, Deve gerar HTML correto para projeto privado, Deve lidar com descrição None, Deve lidar com descrição vazia, Deve usar descrição traduzida se disponível, Deve manter assinatura legada sem voltar ao layout alternado, Testes de validação de estrutura de projetos (+12 more)

### Community 5 - "Index Feature Tests"
Cohesion: 0.07
Nodes (16): Deve ter meta viewport para responsividade, Deve ter meta charset, Deve ter formulário de contato, Deve ter botão de troca de tema, Deve ter botão flutuante de contato, Deve ter contador de visitantes no footer, Deve ter link para download do currículo, Deve ter botão para contato no Telegram (+8 more)

### Community 6 - "Translation Utilities"
Cohesion: 0.10
Nodes (17): detect_language(), Detect if text is likely in Portuguese or another language.     Returns 'pt' if, Translate text to Portuguese using free translation APIs.     Tries multiple fr, translate_to_portuguese(), Testes para o script update_projects.py Testa funcionalidades críticas como: - D, Testes para detecção de idioma, Deve detectar texto em português, Deve detectar português por palavras comuns (+9 more)

### Community 12 - "Asset Directory Tests"
Cohesion: 0.20
Nodes (6): Testes para validar diretórios de assets, Diretório de imagens de projetos deve existir, Diretório de webfonts deve existir, Diretório de imagens gerais deve existir, Arquivo de currículo deve existir, TestAssetDirectories

## Knowledge Gaps
- **1 isolated node(s):** `toggleBtn`
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_api_token()` connect `Project Sync Pipeline` to `Environment Security Tests`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `generate_project_html()` connect `Project HTML Tests` to `Project Sync Pipeline`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `generate_project_html()` (e.g. with `.test_generate_html_public_project()` and `.test_generate_html_public_project_with_github_pages()`) actually correct?**
  _`generate_project_html()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `update_projects.py Automação para gerar as entradas de projetos no index.html`, `Detect if text is likely in Portuguese or another language.     Returns 'pt' if`, `Translate text to Portuguese using free translation APIs.     Tries multiple fr` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Project Sync Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.06292517006802721 - nodes in this community are weakly interconnected._
- **Should `Horizontal Scroll UI` be split into smaller, more focused modules?**
  _Cohesion score 0.08599033816425121 - nodes in this community are weakly interconnected._
- **Should `Environment Security Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._