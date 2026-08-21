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

// Adiciona menu personalizado na barra superior do Google Sheets ao abrir
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📊 Telemetria Portfólio')
    .addItem('🔄 Recriar / Atualizar Dashboard', 'criarDashboard')
    .addToUi();
}

// Função para criar/atualizar manualmente pelo botão Executar ou menu
function criarDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupDashboard(ss, true);
  SpreadsheetApp.getActiveSpreadsheet().toast('Dashboard atualizado com sucesso!', '📊 Telemetria', 5);
}

// Responde a testes no navegador (GET) e valida se o endpoint está online
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupDashboard(ss, false);

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

    setupDashboard(ss, false);

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

function setSmartFormula(cell, formulaPt, formulaEn) {
  try {
    cell.setFormulaLocal(formulaPt);
  } catch (e) {
    try {
      cell.setFormula(formulaEn);
    } catch (err) {}
  }
}

function setupDashboard(ss, force) {
  var dash = ss.getSheetByName('Dashboard');
  
  // Se não existir, cria; se force=true ou estiver vazio, recria o layout
  if (!dash) {
    dash = ss.insertSheet('Dashboard', 0);
  } else if (!force && dash.getLastRow() > 2) {
    return; // Já preenchido
  }

  dash.clear();
  dash.setTabColor('#38bdf8');

  // Cabeçalho Principal
  dash.getRange('A1:F1').merge().setValue('📊 DASHBOARD DE TELEMETRIA & CONVERSÕES — JOÃO SILVA NETO')
    .setFontSize(13).setFontWeight('bold').setBackground('#0f172a').setFontColor('#38bdf8').setHorizontalAlignment('center');

  // 1. CARDS KPI (Linha 3 e 4)
  dash.getRange('A3').setValue('👥 Total de Visitas');
  setSmartFormula(dash.getRange('A4'), '=SEERRO(CONT.VALORES(Visitas!A2:A); 0)', '=IFERROR(COUNTA(Visitas!A2:A), 0)');
  dash.getRange('A3:A4').setFontWeight('bold').setBackground('#e2e8f0').setHorizontalAlignment('center');

  dash.getRange('B3').setValue('📄 Downloads de CV');
  setSmartFormula(dash.getRange('B4'), '=SEERRO(CONT.SE(Eventos!B2:B; "download_cv"); 0)', '=IFERROR(COUNTIF(Eventos!B2:B, "download_cv"), 0)');
  dash.getRange('B3:B4').setFontWeight('bold').setBackground('#e0f2fe').setFontColor('#0284c7').setHorizontalAlignment('center');

  dash.getRange('C3').setValue('✉️ Contatos Enviados');
  setSmartFormula(dash.getRange('C4'), '=SEERRO(CONT.SE(Eventos!B2:B; "submit_contact"); 0)', '=IFERROR(COUNTIF(Eventos!B2:B, "submit_contact"), 0)');
  dash.getRange('C3:C4').setFontWeight('bold').setBackground('#fae8ff').setFontColor('#a21caf').setHorizontalAlignment('center');

  dash.getRange('D3').setValue('💬 Cliques Telegram');
  setSmartFormula(dash.getRange('D4'), '=SEERRO(CONT.SE(Eventos!B2:B; "click_telegram"); 0)', '=IFERROR(COUNTIF(Eventos!B2:B, "click_telegram"), 0)');
  dash.getRange('D3:D4').setFontWeight('bold').setBackground('#f0fdf4').setFontColor('#15803d').setHorizontalAlignment('center');

  dash.getRange('E3').setValue('💼 Cliques LinkedIn');
  setSmartFormula(dash.getRange('E4'), '=SEERRO(CONT.SE(Eventos!B2:B; "click_linkedin"); 0)', '=IFERROR(COUNTIF(Eventos!B2:B, "click_linkedin"), 0)');
  dash.getRange('E3:E4').setFontWeight('bold').setBackground('#fef3c7').setFontColor('#b45309').setHorizontalAlignment('center');

  dash.getRange('F3').setValue('🏆 Conquistas Fim Página');
  setSmartFormula(dash.getRange('F4'), '=SEERRO(CONT.SE(Eventos!B2:B; "achievement_footer_reached"); 0)', '=IFERROR(COUNTIF(Eventos!B2:B, "achievement_footer_reached"), 0)');
  dash.getRange('F3:F4').setFontWeight('bold').setBackground('#ffedd5').setFontColor('#c2410c').setHorizontalAlignment('center');

  dash.getRange('A4:F4').setFontSize(16);

  // 2. TABELAS DE DETALHAMENTO (Linha 6 em diante)
  
  // Tabela: Dispositivos
  dash.getRange('A6:B6').merge().setValue('📱 Dispositivos').setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
  dash.getRange('A7').setValue('Desktop');
  setSmartFormula(dash.getRange('B7'), '=SEERRO(CONT.SE(Visitas!C2:C; "Desktop"); 0)', '=IFERROR(COUNTIF(Visitas!C2:C, "Desktop"), 0)');
  dash.getRange('A8').setValue('Mobile');
  setSmartFormula(dash.getRange('B8'), '=SEERRO(CONT.SE(Visitas!C2:C; "Mobile"); 0)', '=IFERROR(COUNTIF(Visitas!C2:C, "Mobile"), 0)');
  dash.getRange('A9').setValue('Tablet');
  setSmartFormula(dash.getRange('B9'), '=SEERRO(CONT.SE(Visitas!C2:C; "Tablet"); 0)', '=IFERROR(COUNTIF(Visitas!C2:C, "Tablet"), 0)');

  // Tabela: Canais de Origem
  dash.getRange('C6:D6').merge().setValue('🌐 Canais de Tráfego').setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
  dash.getRange('C7').setValue('social (LinkedIn/X)');
  setSmartFormula(dash.getRange('D7'), '=SEERRO(CONT.SE(Visitas!K2:K; "social"); 0)', '=IFERROR(COUNTIF(Visitas!K2:K, "social"), 0)');
  dash.getRange('C8').setValue('dev (GitHub/Lattes)');
  setSmartFormula(dash.getRange('D8'), '=SEERRO(CONT.SE(Visitas!K2:K; "dev"); 0)', '=IFERROR(COUNTIF(Visitas!K2:K, "dev"), 0)');
  dash.getRange('C9').setValue('direct (Acesso Direto)');
  setSmartFormula(dash.getRange('D9'), '=SEERRO(CONT.SE(Visitas!K2:K; "direct"); 0)', '=IFERROR(COUNTIF(Visitas!K2:K, "direct"), 0)');
  dash.getRange('C10').setValue('search (Google/Bing)');
  setSmartFormula(dash.getRange('D10'), '=SEERRO(CONT.SE(Visitas!K2:K; "search"); 0)', '=IFERROR(COUNTIF(Visitas!K2:K, "search"), 0)');
  dash.getRange('C11').setValue('messaging (Telegram)');
  setSmartFormula(dash.getRange('D11'), '=SEERRO(CONT.SE(Visitas!K2:K; "messaging"); 0)', '=IFERROR(COUNTIF(Visitas!K2:K, "messaging"), 0)');

  // Tabela: Navegadores Mais Usados
  dash.getRange('E6:F6').merge().setValue('🧭 Navegadores').setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
  dash.getRange('E7').setValue('Chrome');
  setSmartFormula(dash.getRange('F7'), '=SEERRO(CONT.SE(Visitas!E2:E; "Chrome"); 0)', '=IFERROR(COUNTIF(Visitas!E2:E, "Chrome"), 0)');
  dash.getRange('E8').setValue('Safari');
  setSmartFormula(dash.getRange('F8'), '=SEERRO(CONT.SE(Visitas!E2:E; "Safari"); 0)', '=IFERROR(COUNTIF(Visitas!E2:E, "Safari"), 0)');
  dash.getRange('E9').setValue('Edge');
  setSmartFormula(dash.getRange('F9'), '=SEERRO(CONT.SE(Visitas!E2:E; "Edge"); 0)', '=IFERROR(COUNTIF(Visitas!E2:E, "Edge"), 0)');
  dash.getRange('E10').setValue('Firefox');
  setSmartFormula(dash.getRange('F10'), '=SEERRO(CONT.SE(Visitas!E2:E; "Firefox"); 0)', '=IFERROR(COUNTIF(Visitas!E2:E, "Firefox"), 0)');
  dash.getRange('E11').setValue('Opera / Outros');
  setSmartFormula(dash.getRange('F11'), '=SEERRO(CONT.SE(Visitas!E2:E; "Opera") + CONT.SE(Visitas!E2:E; "Outro"); 0)', '=IFERROR(COUNTIF(Visitas!E2:E, "Opera") + COUNTIF(Visitas!E2:E, "Outro"), 0)');

  // Bordas e alinhamentos
  dash.getRange('A6:F11').setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  dash.getRange('B7:B9').setHorizontalAlignment('center').setFontWeight('bold');
  dash.getRange('D7:D11').setHorizontalAlignment('center').setFontWeight('bold');
  dash.getRange('F7:F11').setHorizontalAlignment('center').setFontWeight('bold');

  // Ajuste de largura das colunas
  dash.setColumnWidth(1, 140);
  dash.setColumnWidth(2, 110);
  dash.setColumnWidth(3, 160);
  dash.setColumnWidth(4, 110);
  dash.setColumnWidth(5, 150);
  dash.setColumnWidth(6, 130);
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

