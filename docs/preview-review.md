# Prévia para avaliação — 8 de setembro de 2026

Branch: `feat/portfolio-excellence`. Abra [a página em português](http://localhost:8765/) ou [em inglês](http://localhost:8765/en/) com o servidor local iniciado. Comando: `uv run python scripts/preview.py --port 8765`. A versão pública permanece anterior; não houve push, merge ou deploy.

## O que mudou

A apresentação destaca a busca por estágio em software e a formação na UFPA, com acesso imediato ao currículo e aos projetos. O tema escuro, o retrato e os acentos luminosos preservam reconhecimento visual. O tema claro é voluntário. Não há modal de primeira visita ou tradução automática.

Três estudos de caso substituem a listagem genérica: AetherSense, DMóvel e Evolutionary Lab, com contexto, participação, escolhas técnicas, limites e links para evidências públicas. O laboratório calcula uma média móvel de um sinal sintético; os filtros e o mapa de competências levam a projetos relacionados. Currículos PT/EN têm uma página, texto selecionável e links.

O formulário valida campos, mantém a mensagem após falhas e timeout e oferece recuperação explícita por e-mail. O build publica somente arquivos selecionados; importações privadas exigem prévia local e aprovação editorial. Métricas usam eventos conhecidos, preferência persistente de desativação e nenhum conteúdo de campos.

## Comparação visual

As imagens abaixo estão em `artifacts/`, fora do repositório e da publicação. Foram capturadas em Edge: desktop 1440 × 1000 e celular 390 × 844; imagens completas têm a altura total da página.

| Visualização | Antes | Depois |
| --- | --- | --- |
| Desktop | [Versão anterior](../artifacts/before-desktop.png) | [Versão nova](../artifacts/after-desktop.png) |
| Celular | [Versão anterior](../artifacts/before-mobile.png) | [Versão nova](../artifacts/after-mobile.png) |

[Início desktop](../artifacts/after-desktop-hero.png) · [Início celular](../artifacts/after-mobile-hero.png) · [Tema claro](../artifacts/after-desktop-light.png) · [Laboratório](../artifacts/after-desktop-lab.png) · [Estudo de caso](../artifacts/after-case-study.png) · [Inglês](../artifacts/after-english.png)

Os PDFs foram renderizados e revisados: [currículo PT](../dist/docs/crv.pdf), [currículo EN](../dist/docs/cv-joao-silva-neto-en.pdf), [render PT](../artifacts/crv.pdf.png) e [render EN](../artifacts/cv-joao-silva-neto-en.pdf.png).

## Evidências de validação

- 36 testes Python passaram; 23 testes do coletor passaram; 28 testes Playwright passaram em desktop/celular.
- Ruff e verificações de sintaxe JavaScript passaram. A auditoria Python não encontrou vulnerabilidades conhecidas; npm também registrou zero após atualização das dependências.
- Axe não encontrou violações A/AA nas páginas iniciais, três estudos de caso e privacidade, em PT/EN e nos dois temas. Testes cobrem teclado, movimento reduzido, tela de 320 px, falhas de armazenamento, formulário e navegação sem JavaScript.
- O transporte simulado comprovou lotes de 20 eventos e descarte da fila ao desativar. O coletor foi testado contra dados pessoais extras, fórmulas, duplicação, quota, retenção e falha entre arquivamento e limpeza.
- Graphify atualizado por extração AST, sem chamadas a modelos; configurações pessoais e relatórios locais excluídos.

Última execução Lighthouse móvel, em prévia local com Edge:

| Página | Desempenho | Acessibilidade | Boas práticas | SEO | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Português | 91 | 100 | 100 | 100 | 0 |
| Inglês | 91 | 100 | 100 | 100 | 0 |
| AetherSense | 100 | 100 | 100 | 100 | 0 |

[Resumo Lighthouse](../artifacts/lighthouse-summary.json) · [Relatório PT](../artifacts/lighthouse-.html) · [Relatório EN](../artifacts/lighthouse-en-.html) · [Resultados do navegador](../artifacts/browser-results.json). Em execução anterior as páginas iniciais marcaram 94/93; desempenho varia com carga da máquina. Os resultados não são medições da versão publicada nem certificação de acessibilidade.

## Limitações que permanecem explícitas

O Apps Script está implementado e testado localmente, mas ainda não foi implantado/homologado na conta Google. `analytics_endpoint` está vazio; a prévia informa que não envia métricas. Permissões, gravação real, limpeza automática e painel privado precisam ser confirmados no serviço antes de ativação. O plano completo de métricas operacionais depende dessa etapa.

As respostas do Formspree foram simuladas para não enviar mensagens reais; entrega de e-mails e quota da conta não foram comprovadas. Nenhum projeto privado foi importado sem seleção e revisão do proprietário. Os dois banners históricos revisados não exibem credenciais legíveis; isso não constitui auditoria completa de segredos no histórico Git. Veja [revisão de segurança](security-review.md) e [homologação do coletor](analytics-apps-script.md).

Merge e publicação ficam para depois da avaliação. O pipeline de deploy é manual e restrito à `main`; workflows foram revisados localmente, ainda sem execução no GitHub nesta branch.

## Origem da imagem social

`assets/images/og-excellence.png` foi gerada com ImageGen e revisada visualmente. Direção: fundo #080b10, ciano #67d8f4 e lavanda #b9a1ff; texto exato “João Silva Neto”, “Software, systems & experiments” e “joaosnet.github.io”; órbitas e ondas abstratas, sem retrato, logos de empresas ou alegações profissionais. É usada apenas como prévia de compartilhamento; os visuais interativos do site são HTML/CSS/canvas locais.
