# João Silva Neto · Portfolio

Portfólio bilíngue de software, sistemas e experimentos. O site público é gerado em `dist/` a partir de conteúdo editorial e templates; não há framework no navegador.

## Prévia local

```powershell
uv sync --frozen --extra dev
npm ci --ignore-scripts
uv run python build_site.py
uv run python scripts/preview.py --port 8765
```

Abra **http://localhost:8765/** ou **http://localhost:8765/en/**. O servidor publica somente `dist/`. Nunca sirva a raiz do repositório, pois ela pode conter configuração local privada.

## Editar conteúdo

- `content/site.json`: perfil, contato e configuração pública; textos acadêmicos devem ser atualizados quando a situação mudar.
- `content/projects.json`: três destaques curados, textos PT/EN, fontes, tecnologias e demonstrações. A ordem é editorial.
- `content/ui.json`: interface PT/EN. `templates/` contém o HTML compartilhado e as páginas.
- `assets/css/portfolio.css`, `assets/js/portfolio.js`: aparência e comportamento progressivo. O laboratório gera um sinal sintético local e aplica média móvel; não simula resultados científicos reais.
- `scripts/build_cv.py`: PDFs de uma página com texto selecionável. `docs/crv.pdf` continua sendo a URL pública do currículo PT, gerada no build; `/docs/cv-joao-silva-neto-en.pdf` é a versão EN.

O build é offline, mantém a versão anterior se a geração falhar e copia uma lista explícita de assets. O conteúdo de repositórios, planilhas, arquivos de ambiente e ferramentas internas não faz parte da publicação. As fontes Outfit são hospedadas localmente com licença OFL; os currículos usam fontes PDF padrão para legibilidade.

## Atualizar projetos

```powershell
uv run python update_projects.py public
uv run python build_site.py
```

A importação consulta somente os repositórios públicos escolhidos, sem token nem credenciais de `.netrc`. Metadados ficam separados dos textos editoriais. Falha da API preserva os dados anteriores. Não há tradução externa, commits ou pushes automáticos.

Projetos privados usam revisão local descrita em [docs/private-projects.md](docs/private-projects.md). Tokens privados não entram no CI.

## Qualidade

```powershell
uv run ruff check build_site.py update_projects.py scripts/build_cv.py scripts/preview.py scripts/fetch_assets.py tests
uv run pytest tests -q -p no:cacheprovider
npm test
npm run test:syntax
npm run test:browser
npm run audit:performance
uv run pip-audit --local
npm audit
```

Os testes de navegador usam Edge já instalado no Windows. No CI Linux, o workflow prepara Chromium. Formspree e analytics são interceptados nos testes: nenhuma mensagem real é enviada. O Lighthouse usa navegador existente e gera relatórios em `artifacts/`. As medições locais não comprovam os Core Web Vitals de todos os visitantes; INP em campo depende de tráfego real.

Capturas de comparação: `node scripts/capture_preview.cjs --baseline` (consulta o site público). A flag pode ser omitida para capturar somente a prévia local.

## Métricas e serviços externos

O novo coletor está em `analytics/collector.gs`, com catálogo público gerado em `analytics/catalog.json`. A implantação privada, validação e limites estão em [docs/analytics-apps-script.md](docs/analytics-apps-script.md).

`analytics_endpoint` permanece vazio até validar o novo backend. Mesmo configurado, a prévia local não envia eventos: transporte é permitido somente no hostname público configurado. A preferência padrão de coleta é ativa, com oposição persistente e aviso discreto; isso não representa consentimento por silêncio nem certificação legal. Eventos não contêm mensagens, valores de campos, URLs completas, fingerprint ou identificador persistente de visitante.

O formulário mantém o endpoint Formspree existente. Limites de conta, entrega efetiva de e-mails e configurações no painel são administrados no serviço. A prévia testa o comportamento de envio com respostas simuladas; não presume que uma mensagem real foi entregue.

## Publicação e retorno de versão

1. Avaliar a prévia da branch `feat/portfolio-excellence`.
2. Após aprovação, incorporar a branch à `main` e configurar GitHub Pages para **GitHub Actions**.
3. Executar manualmente **Publish reviewed portfolio** na `main`. O workflow valida e publica apenas o build estático. Não há publicação em push, em PR ou nesta branch.
4. Para voltar, selecionar o commit previamente aprovado em uma branch de correção, executar os mesmos controles e publicar manualmente. O histórico original permanece intacto.

O workflow de atualização pública produz somente um artefato para revisão. Credenciais de escrita em Pages pertencem exclusivamente ao job de deploy; Actions são fixadas por SHA e dependências por lockfile.

Depois de modificar código: `graphify update .`. Consulte [docs/security-review.md](docs/security-review.md) para o inventário de riscos e limites da hospedagem.
