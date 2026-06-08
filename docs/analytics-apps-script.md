# Analytics próprio (cookieless) — registro no Google Sheets

O contador de visitas (`assets/js/geo-counter.js`) envia, **sem cookies e sem APIs de IP**, um
evento por visita ao seu Google Apps Script (modo `no-cors`). Desde a última atualização, o payload
inclui campos úteis para entender a **origem do tráfego** e ajudar a ter mais visualizações:

| Campo            | Exemplo                          | Para que serve                              |
|------------------|----------------------------------|---------------------------------------------|
| `timestamp`      | `2026-06-08T13:20:00.000Z`       | Quando a visita ocorreu                     |
| `path` / `url`   | `/`                              | Página visitada                             |
| `referrer`       | `https://www.linkedin.com/...`   | De onde a pessoa veio (URL completa)        |
| `referrerHost`   | `linkedin.com`                   | Domínio de origem                           |
| `referrerSource` | `social` / `search` / `dev` / `direct` | Categoria da origem                  |
| `utmSource`      | `linkedin`                       | Campanha (`?utm_source=...`)                |
| `utmMedium`      | `post`                           | Meio da campanha                            |
| `utmCampaign`    | `lancamento`                     | Nome da campanha                            |
| `language`       | `pt-BR`                          | Idioma do navegador                         |
| `device`         | `mobile` / `tablet` / `desktop`  | Tipo de dispositivo                         |
| `timezone`       | `America/Belem`                  | Fuso (sinal geográfico aproximado, privado) |

## Como registrar esses campos na planilha

Para ver os dados na sua planilha, o Apps Script precisa gravar essas colunas. Abra
**Extensões → Apps Script** na sua planilha e use um `doPost` parecido com este (adapte ao seu
código atual — o ponto-chave é ler os novos campos do JSON e escrever uma linha):

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Visitas')
            || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Visitas');

  // Cabeçalho na primeira vez
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'timestamp', 'path', 'referrerSource', 'referrerHost', 'referrer',
      'utmSource', 'utmMedium', 'utmCampaign', 'language', 'device', 'timezone'
    ]);
  }

  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) { d = {}; }

  sheet.appendRow([
    d.timestamp || new Date().toISOString(),
    d.path || '',
    d.referrerSource || '',
    d.referrerHost || '',
    d.referrer || '',
    d.utmSource || '',
    d.utmMedium || '',
    d.utmCampaign || '',
    d.language || '',
    d.device || '',
    d.timezone || ''
  ]);

  return ContentService.createTextOutput('ok');
}
```

Depois clique em **Implantar → Gerenciar implantações → Editar** e publique uma nova versão
(o URL `/exec` continua o mesmo, então nada muda no site).

## Dicas para usar nas campanhas

- Ao compartilhar o portfólio, anexe parâmetros UTM ao link, ex.:
  `https://joaosnet.github.io/?utm_source=linkedin&utm_medium=post&utm_campaign=vaga-x`.
  Assim você sabe exatamente qual post/canal trouxe cada visita.
- A coluna `referrerSource` agrupa automaticamente as origens (busca, social, dev, mensageiro,
  direto), facilitando um gráfico de pizza na planilha.

> Observação: a contagem exibida no rodapé ("Visitas locais") é apenas o contador **local** deste
> navegador. O histórico real e agregado fica na sua planilha do Google.
