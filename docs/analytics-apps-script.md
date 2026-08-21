# Analytics Próprio (Cookieless) — Registro & Dashboard no Google Sheets

O sistema de telemetria do portfólio (`assets/js/geo-counter.js`) envia, **sem cookies e sem APIs externas de IP**, registros de **Visitas** e **Eventos de Conversão** para o seu Google Apps Script (modo `no-cors`).

---

## 1. Campos Coletados

### Aba `Visitas` (Acessos à Página)
| Coluna | Descrição | Exemplo |
|---|---|---|
| `Data/Hora` | Horário exato da visita | `2026-08-21T16:30:00.000Z` |
| `Página / Hash` | Página e seção acessada | `/`, `#projects`, `#contact` |
| `Dispositivo` | Tipo de aparelho | `Desktop`, `Mobile`, `Tablet` |
| `Sistema Operacional` | SO do visitante | `Windows 10/11`, `Android`, `iOS`, `macOS`, `Linux` |
| `Navegador` | Browser utilizado | `Chrome`, `Safari`, `Firefox`, `Edge`, `Opera` |
| `Resolução de Tela` | Resolução nativa | `1920x1080`, `390x844` |
| `Fuso / Localização` | Fuso IANA (privado e preciso) | `America/Belem`, `America/Sao_Paulo`, `Europe/Lisbon` |
| `Cidade / Região` | Região derivada | `Belem`, `Sao Paulo`, `Lisbon` |
| `Idioma` | Idioma do navegador | `pt-BR`, `en-US` |
| `Offset UTC` | Deslocamento de fuso | `UTC-3`, `UTC+1` |
| `Canal de Tráfego` | Categoria de origem | `social`, `dev`, `search`, `messaging`, `direct` |
| `Domínio Origem` | Domínio de referência | `linkedin.com`, `github.com`, `t.me` |
| `URL Completa Referrer` | Referrer completo | `https://www.linkedin.com/feed/...` |
| `Campanha UTM` | Origem / Meio / Campanha | `utm_source=linkedin&utm_medium=post` |

### Aba `Eventos` (Conversões & Interações)
| Evento | O que representa |
|---|---|
| `download_cv` | Clique no botão para Baixar Currículo em PDF |
| `click_telegram` | Clique no botão para Conversar no Telegram |
| `click_linkedin` | Clique no link do LinkedIn |
| `click_lattes` | Clique no link do Currículo Lattes |
| `click_github` | Clique no link do perfil do GitHub |
| `submit_contact` | Envio realizado no formulário de contato |

---

## 2. Código Pronto para o Google Apps Script

Abra a sua planilha no Google Sheets, clique em **Extensões → Apps Script**, substitua o conteúdo do arquivo `Código.gs` pelo código abaixo e clique em **Salvar** (`Ctrl + S`):

```javascript
/**
 * Google Apps Script - Telemetria & Analytics do Portfólio
 * João Silva Neto
 */

// Responde a testes no navegador (GET) e valida se o endpoint está online
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupDashboard(ss);

  var visitsSheet = ss.getSheetByName('Visitas');
  var eventsSheet = ss.getSheetByName('Eventos');

  var totalVisitas = visitsSheet ? Math.max(0, visitsSheet.getLastRow() - 1) : 0;
  var totalEventos = eventsSheet ? Math.max(0, eventsSheet.getLastRow() - 1) : 0;

  var response = {
    status: 'online',
    message: 'API de Telemetria do Portfólio de João Silva Neto está funcionando perfeitamente!',
    timestamp: new Date().toISOString(),
    metricas: {
      totalVisitasRegistradas: totalVisitas,
      totalEventosRegistrados: totalEventos
    }
  };

  return ContentService.createTextOutput(JSON.stringify(response, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

// Recebe dados de telemetria e eventos via POST do site
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = {};
    try {
      if (e && e.postData && e.postData.contents) {
        payload = JSON.parse(e.postData.contents);
      }
    } catch (err) {
      payload = {};
    }

    var type = payload.type || 'visit';

    if (type === 'event') {
      recordEvent(ss, payload);
    } else {
      recordVisit(ss, payload);
    }

    setupDashboard(ss);

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function recordVisit(ss, d) {
  var sheet = ss.getSheetByName('Visitas') || ss.insertSheet('Visitas');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Data/Hora', 'Página', 'Dispositivo', 'Sistema Operacional', 'Navegador',
      'Resolução', 'Fuso IANA', 'Cidade/Região', 'Idioma', 'UTC Offset',
      'Canal de Tráfego', 'Domínio Origem', 'Referrer Completo',
      'UTM Source', 'UTM Medium', 'UTM Campaign'
    ]);
    sheet.getRange(1, 1, 1, 16).setFontWeight('bold').setBackground('#1e293b').setFontColor('#f8fafc');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    d.timestamp || new Date().toISOString(),
    d.path || '/',
    d.device || 'Desktop',
    d.os || 'Desconhecido',
    d.browser || 'Desconhecido',
    d.screenResolution || 'Desconhecido',
    d.timezone || 'Desconhecido',
    d.cityRegion || 'Desconhecido',
    d.language || 'pt-BR',
    d.utcOffset || 'UTC-3',
    d.referrerSource || 'direct',
    d.referrerHost || 'Direto',
    d.referrer || '',
    d.utmSource || '',
    d.utmMedium || '',
    d.utmCampaign || ''
  ]);
}

function recordEvent(ss, d) {
  var sheet = ss.getSheetByName('Eventos') || ss.insertSheet('Eventos');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Data/Hora', 'Evento', 'Página', 'Dispositivo', 'Sistema Operacional',
      'Navegador', 'Fuso IANA', 'Cidade/Região', 'Idioma', 'Detalhes'
    ]);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#0f172a').setFontColor('#38bdf8');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    d.timestamp || new Date().toISOString(),
    d.eventName || 'clique',
    d.path || '/',
    d.device || 'Desktop',
    d.os || 'Desconhecido',
    d.browser || 'Desconhecido',
    d.timezone || 'Desconhecido',
    d.cityRegion || 'Desconhecido',
    d.language || 'pt-BR',
    d.details || ''
  ]);
}

function setupDashboard(ss) {
  var dash = ss.getSheetByName('Dashboard');
  if (dash) return; // Já configurado

  dash = ss.insertSheet('Dashboard', 0);
  dash.setTabColor('#3b82f6');

  // Cabeçalho do Dashboard
  dash.getRange('A1:F1').merge().setValue('📊 DASHBOARD DE VISITANTES & CONVERSÕES — JOÃO SILVA NETO')
    .setFontSize(14).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff').setHorizontalAlignment('center');

  // Cards de Métricas Principais
  dash.getRange('A3').setValue('Total de Visitas');
  dash.getRange('A4').setFormula('=COUNTA(Visitas!A2:A)');
  dash.getRange('A3:A4').setFontWeight('bold').setBackground('#e2e8f0').setHorizontalAlignment('center');

  dash.getRange('B3').setValue('Downloads de CV');
  dash.getRange('B4').setFormula('=COUNTIF(Eventos!B2:B, "download_cv")');
  dash.getRange('B3:B4').setFontWeight('bold').setBackground('#e0f2fe').setFontColor('#0369a1').setHorizontalAlignment('center');

  dash.getRange('C3').setValue('Cliques Telegram');
  dash.getRange('C4').setFormula('=COUNTIF(Eventos!B2:B, "click_telegram")');
  dash.getRange('C3:C4').setFontWeight('bold').setBackground('#f0fdf4').setFontColor('#15803d').setHorizontalAlignment('center');

  dash.getRange('D3').setValue('Cliques LinkedIn');
  dash.getRange('D4').setFormula('=COUNTIF(Eventos!B2:B, "click_linkedin")');
  dash.getRange('D3:D4').setFontWeight('bold').setBackground('#fef3c7').setFontColor('#b45309').setHorizontalAlignment('center');

  dash.getRange('E3').setValue('Contatos Enviados');
  dash.getRange('E4').setFormula('=COUNTIF(Eventos!B2:B, "submit_contact")');
  dash.getRange('E3:E4').setFontWeight('bold').setBackground('#fae8ff').setFontColor('#86198f').setHorizontalAlignment('center');

  // Tabela: Dispositivos
  dash.getRange('A6').setValue('Dispositivo').setFontWeight('bold');
  dash.getRange('B6').setValue('Acessos').setFontWeight('bold');
  dash.getRange('A7').setValue('Desktop');
  dash.getRange('B7').setFormula('=COUNTIF(Visitas!C2:C, "Desktop")');
  dash.getRange('A8').setValue('Mobile');
  dash.getRange('B8').setFormula('=COUNTIF(Visitas!C2:C, "Mobile")');
  dash.getRange('A9').setValue('Tablet');
  dash.getRange('B9').setFormula('=COUNTIF(Visitas!C2:C, "Tablet")');

  // Tabela: Top Canais
  dash.getRange('D6').setValue('Canal de Origem').setFontWeight('bold');
  dash.getRange('E6').setValue('Acessos').setFontWeight('bold');
  dash.getRange('D7').setValue('social (LinkedIn/Twitter)');
  dash.getRange('E7').setFormula('=COUNTIF(Visitas!K2:K, "social")');
  dash.getRange('D8').setValue('dev (GitHub/Lattes)');
  dash.getRange('E8').setFormula('=COUNTIF(Visitas!K2:K, "dev")');
  dash.getRange('D9').setValue('direct (Acesso direto)');
  dash.getRange('E9').setFormula('=COUNTIF(Visitas!K2:K, "direct")');
  dash.getRange('D10').setValue('search (Google/Bing)');
  dash.getRange('E10').setFormula('=COUNTIF(Visitas!K2:K, "search")');
  dash.getRange('D11').setValue('messaging (Telegram/Zap)');
  dash.getRange('E11').setFormula('=COUNTIF(Visitas!K2:K, "messaging")');
}
```

---

## 3. Como Implantar no Google Sheets

1. No editor do Apps Script, clique no botão azul **Implantar** (canto superior direito) → **Nova Implantação**.
2. Clique no ícone de engrenagem ⚙️ ao lado de "Selecione o tipo" e escolha **App da Web**.
3. Configure:
   - **Descrição**: `Portfolio Telemetry v4`
   - **Executar como**: `Eu (seu-email@gmail.com)`
   - **Quem tem acesso**: `Qualquer pessoa` (necessário para receber os acessos dos visitantes)
4. Clique em **Implantar** e copie a **URL do App da Web** gerada (termina com `/exec`).
5. Cole essa URL no arquivo `assets/js/geo-counter.js` na variável `this.GOOGLE_APPS_SCRIPT_URL`.

