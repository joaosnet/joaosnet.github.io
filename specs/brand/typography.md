# Tipografia

| Papel | Fonte | Onde |
| --- | --- | --- |
| Títulos e texto corrido | **Outfit** (variável 100–900, `assets/fonts/outfit-latin.woff2`, `font-display: swap`, com preload) | `body`, `h1–h3`, botões |
| Metadados, métricas, anotações | **JetBrains Mono** (variável 400–700, `assets/fonts/jetbrains-mono-latin.woff2`, `font-display: optional`, sem preload) | `.eyebrow`, `.fig-label`, `.tags`, `.card-eyebrow`, barra de status, abas do code stream, números de linha |

## Regras

- Use sempre `var(--font-sans)` / `var(--font-mono)`; nunca o genérico `monospace`.
- A mono é **não crítica**: `optional` evita troca tardia (sem CLS) e não compete com a Outfit pelo LCP. Na primeira visita em rede lenta pode aparecer a mono do sistema — é intencional.
- Escala Major Third (1.25) em `--step--2 … --step-5`. Os títulos `h1/h2` continuam com `clamp()` fluido; use os steps em componentes novos.
- Espaçamento em grade 4/8 (`--space-*`).
- Contraste: texto pequeno em mono usa `--muted` ou `--text`, nunca `--subtle`.
- Fontes são auto-hospedadas (CSP `font-src 'self'`). Para atualizar: `uv run python scripts/fetch_assets.py jetbrains-mono`.
