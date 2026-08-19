# Diretriz Universal: Planejamento, Validação Crítica via MCP e Padrão AAA

Esta regra define os padrões inegociáveis de desenvolvimento, planejamento e garantia de qualidade para todo e qualquer agente autônomo e assistente de código neste repositório.

## 1. Planejamento com Ferramentas MCP (MCP-Driven Planning)
- **Diagnóstico Ativo**: Antes de planejar, propor ou alterar qualquer código visual, comportamental ou de integração, utilize ativamente as ferramentas MCP disponíveis (ex: navegador Playwright/Blink via `MCP_DOCKER`, ferramentas de pesquisa, inspeção de DOM e requisições de rede) para inspecionar o estado real da aplicação e evitar suposições.
- **Mapeamento Prévio de Riscos**: Identifique potenciais pontos de falha, conflitos de renderização, camadas de toque (*touch traps*), comportamentos de contêineres e responsividade em múltiplos viewports (mobile 390px, tablet 768px, desktop 1920px).

## 2. Validação Crítica Obrigatória em Execução
- **Zero Suposição**: NUNCA considere uma tarefa, bug ou funcionalidade como concluída apenas por ter editado arquivos de código estático. A validação dinâmica em tempo de execução é obrigatória.
- **Testes com Navegador Real**:
  - Navegar na URL real/local através do MCP (`browser_navigate`).
  - Simular interações físicas exatas (toques touch, cliques, scrolls, troca de temas, redimensionamento de viewport).
  - Validar estado do DOM, dimensões computadas e classes via `browser_evaluate`.
  - Capturar e analisar criticamente screenshots (`browser_take_screenshot`) para garantir que o resultado visual atingiu a perfeição esperada.
- **Detecção e Correção Autônoma**: Se a validação MCP apontar qualquer desalinhamento, quebra de transição, lentidão ou problema de contraste, o assistente deve corrigir imediatamente antes de concluir a resposta.

## 3. Padrão de Qualidade AAA
- **Responsividade & Touch**: Interfaces fluidas em dispositivos móveis (60/120 FPS), sem bloqueio de gestos e com navegação granular sem perda de conteúdo.
- **Temas e Contraste**: Contraste perfeito e legibilidade em Dark Mode e Light Mode.
- **Versionamento & Cache**: Garantir cache-busting adequado para entrega imediata em produção.
