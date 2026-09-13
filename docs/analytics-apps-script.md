# Métricas de interação · coletor v1

## Estado da entrega

O frontend e o coletor foram implementados com testes locais. **O novo script não foi implantado na conta Google** e `content/site.json` mantém `analytics_endpoint` vazio e `analytics_validated: false`. O endpoint antigo não é reutilizado: o código implantado nele não foi confirmado. A versão pública atual permanece intacta durante a revisão desta branch.

## Implantação após a revisão

1. Crie uma planilha Google privada e um Apps Script privado vinculado a ela. Substitua o código pelo conteúdo de `analytics/collector.gs`.
2. Em **Propriedades do script**, configure `SHEET_ID` com o identificador da planilha e `ALLOWED_CATALOG` com o JSON completo de `analytics/catalog.json`. Nenhum desses valores deve ser incorporado ao navegador. O catálogo é público, mas sua configuração no backend deve ser controlada pelo proprietário.
3. Execute `setup()` como proprietário. Ele cria `EventsV1`, `MonthlyV1` e `Dashboard`, e instala um gatilho diário de manutenção. Confira que o gatilho está habilitado e que a planilha não é compartilhada publicamente.
4. Implante uma nova versão como aplicativo web executado pelo proprietário, permitindo acesso ao endpoint de coleta. Não publique a planilha. GET expõe somente versão e estado do serviço; não há API pública de leitura de eventos.
5. Valide em uma planilha de teste: um lote válido entra uma vez; repetir os mesmos UUIDs não duplica; campos extras, fórmulas, eventos desconhecidos e payloads inválidos são rejeitados. Confirme também oposição no navegador e limpeza de dados antigos. Os testes Node locais cobrem essas regras, mas não substituem a verificação de permissões e do runtime Google.
6. Somente após essa verificação, coloque a URL **da nova implantação** em `analytics_endpoint` e defina `analytics_validated: true`. Gere novamente o site e revise o catálogo. Publique junto com a versão aprovada do frontend.

## Dados e controles

O contrato tem `version`, UUID por evento, nome do evento, horário UTC, página canônica, seção, identificador fixo de elemento, projeto público opcional, idioma, modalidade, resultado e versão do site. Não há ID de pessoa/sessão, campos do formulário, URL com query/hash, IP no payload, resolução detalhada, geolocalização ou fingerprint.

O listener único de clique cobre mouse, toque sintetizado e ativação por teclado. Mudanças de controles e resultados de contato/cópia são eventos separados. Áreas sem ação usam um identificador genérico; isso informa a existência de cliques sem resposta, não constitui um mapa de calor de coordenadas nem gravação de sessão. Demonstrações externas são medidas apenas na abertura.

A coleta é ativa por padrão, conforme a preferência escolhida para o produto. O controle de oposição está no aviso e no rodapé. Desativar remove a fila pendente e impede novos eventos; a escolha se propaga para outras abas e persiste neste navegador. Não registramos silêncio como consentimento. Quando o armazenamento está bloqueado, o padrão conservador é não coletar. Aplicação legal do modo ativo exige considerar a finalidade e os mercados atendidos, sem alegação automática de conformidade.

## Retenção, segurança e limites

- Eventos detalhados: até 180 dias; totais mensais: 12 meses calendários, incluindo o atual.
- A manutenção arquiva somente linhas expiradas e usa um marcador temporal gravado com os totais para evitar contagem dupla em uma retomada. Escritas retangulares evitam apagar a planilha antes de gravar a substituição.
- Esquema fechado, enums, catálogo permitido, UUIDs, tempo máximo de desvio de 24 horas e limite de strings previnem conteúdo arbitrário e fórmulas nas células.
- Lotes de até 20 eventos, corpo de até 20.000 caracteres, máximo de 2.000 eventos/dia e 360.000 eventos armazenados. A manutenção e as cotas reais do Google podem limitar esse volume antes desses tetos.
- Lock verificado antes de escrever; UUIDs deduplicados na planilha e em cache. O endpoint público continua sujeito a tráfego falso e abuso de quota. Origem e tokens inseridos no frontend não autenticariam visitantes.
- O frontend guarda no máximo 100 eventos em memória; envia em lotes e em melhor esforço. O modo `no-cors` do Apps Script não permite confirmar recebimento no navegador. Não há retry cego, fila persistente ou promessa de capturar 100% das interações. Bloqueadores, desconexão e cotas geram perdas sem atrapalhar a página.
- A prévia local nunca transmite, mesmo com endpoint configurado. `productionHost` limita o transporte ao hostname público do build; isso é um controle de ambiente, não uma defesa contra clientes maliciosos.
- Dados do coletor antigo não são migrados nem apagados automaticamente. Avalie separadamente sua retenção e permissões; não misture contadores antigos com eventos v1.

## Extrair insights

`Dashboard` apresenta contagens por evento, seção, elemento, projeto, idioma e resultado. `MonthlyV1` armazena totais históricos já arquivados; os eventos ainda dentro da retenção estão em `EventsV1`. O painel consolida ambos sem contar o mesmo evento duas vezes.

Compare aberturas de estudos de caso e demos, cliques no currículo, uso de filtros/laboratório e resultados de contato. Contagens são **eventos, não pessoas nem recrutadores**. Sem identificação persistente, não há reconstrução de jornadas individuais nem taxa de conversão por visitante único. Comparações mensais devem considerar alterações de versão, oposição, falhas de coleta e tráfego automatizado.
