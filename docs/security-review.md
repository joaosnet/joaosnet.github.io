# Revisão de segurança da evolução do portfólio

## Fronteira de publicação

Somente `dist/` deve ser publicado. O build copia os três scripts novos, CSS novo, fonte local, retrato, favicon, imagem social e currículos gerados. Não copia diretórios de projetos privados, fontes internas, histórico, testes, arquivos `.env` ou código do coletor.

O fluxo antigo consultava privados, baixava imagens e podia traduzir descrições fora do GitHub. A versão nova consulta apenas os repositórios públicos selecionados e separa a importação privada local da aprovação editorial. Não lê segredos do ambiente durante o build.

## Material histórico identificado

- O HTML anterior mostrava um card de API privada e uma imagem com origem no repositório privado do DMóvel.
- `assets/project-images/LAPSHub_dmovel-fastapi_banner_readme.webp` e o asset cujo nome contém `aethersense-private-archive` merecem revisão de divulgação pelo proprietário. Nenhum é copiado para a nova publicação.
- Revisão visual dos dois arquivos: o primeiro é uma ilustração de FastAPI/Python; o segundo é um logo com a descrição do AetherSense. Não há credenciais legíveis nessas imagens. Essa constatação não estabelece autorização de divulgação nem cobre todo o histórico Git.
- A presença desses arquivos no histórico público já existente não é revertida pela exclusão do novo artefato. Não houve reescrita de histórico, revogação de credenciais ou alteração na versão publicada. Caso o conteúdo histórico tenha informação confidencial, a remediação deve considerar cópias, caches e permissões de divulgação.
- Valores do `.env` pessoal não foram lidos para esta implementação. Testes usam dados sintéticos. Não se deve interpretar testes de regex como prova de que jamais existiu segredo no histórico.

## Controles novos

Política CSP com fontes locais e endpoints de contato explícitos; hash específico para JSON-LD; ausência de scripts/eventos inline executáveis, `unsafe-inline` e `unsafe-eval`. Links externos com isolamento de janela. Conteúdo editorial escapado pelo template e URLs HTTPS verificadas. Formulário sem redirecionamento automático em falhas.

A auditoria de dependências é repetível com `npm audit` e `uv run pip-audit --local`; as versões resolvidas estão em lockfiles. Os workflows usam SHA de Actions e separam leitura, validação e permissões de publicação. Não há token de repositórios privados no CI.

O coletor novo aceita somente dados do catálogo, não retorna registros no GET e impõe retenção, limites, lock e deduplicação. Veja as limitações de abuso e quotas em `analytics-apps-script.md`.

`.graphifyignore` exclui configurações locais, prévias privadas, dependências e relatórios temporários. Nós e caches anteriores dessas fontes foram removidos do grafo regenerado. O HTML e os scripts antigos da raiz continuam como referência histórica nesta branch, mas não entram em `dist/`; o ponto de entrada novo é `templates/home.html`.

## Limites do GitHub Pages

A resposta pública inspecionada já fornecia HSTS. Uma política CSP por `<meta>` não implementa `frame-ancestors`, cabeçalhos de resposta adicionais nem controles de servidor. Não há afirmação de proteção completa contra enquadramento da página ou de conformidade legal automática. Controle adicional por cabeçalhos exigiria uma hospedagem/proxy configurável, fora da decisão atual de preservar GitHub Pages.

## Fontes de conteúdo

Os textos foram redigidos a partir dos currículos existentes e dos READMEs públicos de `joaosnet/aethersense`, `LAPSHub/dmovel_web_app` e `joaosnet/evolutionary-optimization-viz-ag-pso`. Contribuições de equipe são identificadas; não foram inventadas métricas, certificações ou responsabilidade exclusiva. O AetherSense é descrito como protótipo de pesquisa, respeitando seus limites documentados.
