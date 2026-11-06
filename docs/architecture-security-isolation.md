# Arquitetura, Governança de Dados e Isolamento de Segurança

Este documento é a referência canônica de arquitetura de dados, limites de isolamento de segurança e diretrizes de eficiência de contexto para agentes de IA e desenvolvedores no repositório `joaosnet.github.io`.

---

## 1. Topologia do Sistema e Fronteira de Publicação

O portfólio opera sob uma arquitetura puramente estática gerada via Python e servida pelo GitHub Pages:
- **Gerador Principal (`build_site.py`)**: Constrói o site estático em `dist/`, consumindo apenas metadados públicos aprovados em `content/public-metadata.json` e templates semânticos em `templates/`.
- **Automação de Projetos (`update_projects.py`)**: Script responsável por coletar metadados da API do GitHub, atualizar imagens sociais locais e catalogar lançamentos públicos.
- **Fronteira Rígida de Publicação**:
  - Apenas o diretório `dist/` é implantado.
  - O pipeline de deploy no GitHub Actions jamais carrega credenciais de repositórios privados, não lê arquivos `.env` e não expõe diretórios de staging ou testes.

---

## 2. Ponto de Entrada `main()` e Governança de Dados

A função `main()` em `update_projects.py` atua como uma ponte (*bridge node*) de alta centralidade de intermediação no Grafo de Conhecimento, conectando o código executável (`Site Build Logic`) às políticas de auditoria (`Analytics and Review Docs`):

- **Orquestração de Lançamentos Públicos**: Executa `public_snapshot()` e `discover_public_repos()`, garantindo que apenas repositórios explicitamente permitidos sejam inseridos nos metadados públicos.
- **Governança Documental**: O comportamento de `main()` é vinculado às diretrizes de `docs/preview-review.md` (*Limitações que permanecem explícitas*) e `docs/analytics-apps-script.md`:
  - Nenhuma informação privada é importada ou publicada sem revisão editorial prévia.
  - A telemetria e o coletor de métricas (`geo-counter.js`) não coletam dados pessoais identificáveis (PII) e operam de forma isolada sem rede durante testes e prévias locais.

---

## 3. Isolamento e Segurança de Projetos Privados (`private_preview`)

A importação e avaliação de repositórios privados pelo script `update_projects.py` através da função `private_preview()` obedece a travas inegociáveis de isolamento:

1. **Lista de Permissões Local Obrigatória**: Requer o arquivo `.private-preview/allowlist.json`. Se o repositório não estiver na lista ou o arquivo não existir, a operação é terminantemente abortada.
2. **Injeção Restrita de Token**: Depende exclusivamente da variável de ambiente `PRIVATE_REPOS_TOKEN`.
3. **Fail-Safe Sem Rede**: Se o token não estiver presente no ambiente do processo, a função `private_preview()` lança imediatamente uma exceção (`ValueError: process environment`), impedindo qualquer chamada à API ou vazamento de metadados em rede.
4. **Isolamento de Staging**: Todos os artefatos de prévias são gerados exclusivamente dentro de `.private-preview/`, diretório estritamente fora da árvore de commits e bloqueado no `.gitignore`.

---

## 4. Testes de Segurança em Ambiente Sintético (`tests/test_env_variables.py`)

A camada de testes de ambiente foi projetada sob o seguinte princípio arquitetural:
> *"Configuration tests use synthetic environments; never open a developer's .env."*

Esta diretriz é validada por três testes fundamentais:
- **`test_import_does_not_load_dotenv()`**:
  - Utiliza análise estática via AST (`ast.parse`) em `update_projects.py` para atestar que `dotenv` jamais é importado ou acionado em nível global. Isso impede que credenciais do ambiente de desenvolvimento sejam carregadas silenciosamente durante execuções de produção.
- **`test_private_import_without_token_does_not_access_network()`**:
  - Executa `private_preview()` com ambiente sintético isolado (`monkeypatch.delenv`), comprovando que na ausência do token o fail-safe bloqueia qualquer acesso externo de rede.
- **`test_private_review_and_env_are_ignored()`**:
  - Valida programmaticamente que os arquivos `.env` e a pasta `.private-preview/` constam explicitamente no `.gitignore`.

---

## 5. Diretriz Universal para Agentes de IA: Knowledge Graph First

Para minimizar drasticamente o consumo de tokens e evitar alucinações arquiteturais, todos os agentes autônomos (Google Antigravity, Claude Code, Codex, Gemini CLI, Cursor) e subagentes devem obedecer ao seguinte protocolo:

### A. Proibição Estrita de Varredura Especulativa
- **Zero Varrimento Cego**: É proibido executar `Get-ChildItem -Recurse`, `ls -R` ou comandos amplos de `grep` na raiz do repositório para "descobrir onde algo está".
- **Leitura Cirúrgica**: A leitura direta de arquivos (`read_file`) é estritamente pontual e só deve ocorrer **após** a localização dos nós e símbolos exatos pelo Grafo ou pela Wiki.

### B. Ordem de Navegação Obrigatória
1. **Wiki Primeiro**: Consultar `graphify-out/wiki/index.md` e o artigo da comunidade relevante. É o método mais rápido e com menor custo de tokens para compreender os módulos e arquitetura.
2. **MCP / CLI Graphify**:
   - `query_graph` / `graphify query "<pergunta>"` para contextualização de fluxos.
   - `shortest_path` / `graphify path "<A>" "<B>"` para mapear dependências entre símbolos e documentos.
   - `get_node` / `graphify explain "<símbolo>"` para examinar vizinhos imediatos.
3. **Leitura de Código**: Acessar somente as linhas indicadas pelo grafo (`source_location`).

### C. Protocolo de Delegação para Subagentes
- O agente pai **NUNCA** deve despachar um subagente com instruções vagas como "explore o repositório".
- O agente pai deve consultar o grafo previamente e injetar no prompt do subagente o contexto exato (caminho do artigo da wiki ou lista de nós/arquivos a inspecionar).

### D. Higiene e Atualização do Grafo
- Diretórios temporários de testes e caches (`.pytest_tmp/`, `.pytest_cache/`, `.ruff_cache/`, `__pycache__/`) são bloqueados no `.graphifyignore` para manter o grafo limpo e enxuto.
- Os Git Hooks (`post-commit`, `post-merge`, `post-checkout`) mantêm o grafo sincronizado deterministicamente sem consumo de tokens de LLM.
