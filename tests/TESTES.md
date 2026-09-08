# Validação do portfólio

Instale os lockfiles com `uv sync --frozen --extra dev` e `npm ci --ignore-scripts`.

```powershell
uv run ruff check build_site.py update_projects.py scripts tests
uv run pytest tests -q -p no:cacheprovider
npm run test:syntax
npm test
npm run test:browser
npm run audit:performance
```

O navegador usa Edge instalado no Windows e Chromium no CI. Em Linux, execute `npx playwright install --with-deps chromium`. Playwright inicia a prévia automaticamente. Para desempenho e capturas, mantenha `uv run python scripts/preview.py --port 8765` aberto em outro terminal.

- Python: build bilíngue, links, PDFs, CSP, fronteira de publicação, URLs, falhas de API e aprovação de conteúdo privado.
- Node: contrato fechado do coletor, campos desconhecidos, injeção de planilha, lotes, quota, deduplicação, retenção e recuperação após falha na limpeza.
- Playwright: desktop/celular, teclado, idiomas, temas, axe WCAG A/AA, filtros, laboratório, contato, timeout, opt-out, lotes, páginas ausentes e conteúdo sem JavaScript.
- Lighthouse móvel: desempenho ≥90; acessibilidade, boas práticas e SEO ≥95 nas duas páginas iniciais e em AetherSense. Pontuações não substituem revisão visual.

Formspree e transporte de métricas são interceptados. Não há mensagens reais enviadas. O coletor roda em ambiente simulado; sua implantação exige [homologação](../docs/analytics-apps-script.md).

`node scripts/capture_preview.cjs` salva capturas em `artifacts/`. Use `--baseline` somente para registrar a versão pública anterior. Auditorias: `npm audit --audit-level=moderate` e `uv run pip-audit --local`. Relatórios, traces e perfis não são publicados.
