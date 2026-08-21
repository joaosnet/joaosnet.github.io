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

function setupDashboard(ss, force) {
  var dash = ss.getSheetByName('Dashboard');
  if (!dash) {
    dash = ss.insertSheet('Dashboard', 0);
  }

  var visitsSheet = ss.getSheetByName('Visitas');
  var eventsSheet = ss.getSheetByName('Eventos');

  // Obter dados brutos de visitas
  var visitsData = [];
  if (visitsSheet && visitsSheet.getLastRow() > 1) {
    visitsData = visitsSheet.getRange(2, 1, visitsSheet.getLastRow() - 1, visitsSheet.getLastColumn()).getValues();
  }

  // Obter dados brutos de eventos
  var eventsData = [];
  if (eventsSheet && eventsSheet.getLastRow() > 1) {
    eventsData = eventsSheet.getRange(2, 1, eventsSheet.getLastRow() - 1, eventsSheet.getLastColumn()).getValues();
  }

  // 1. Contadores calculados diretamente pelo script (100% imune a erros de fórmula e idioma)
  var totalVisitas = visitsData.length;
  
  var cvDownloads = 0;
  var contatos = 0;
  var telegramClicks = 0;
  var linkedinClicks = 0;
  var conquistas = 0;

  eventsData.forEach(function(row) {
    var ev = String(row[1] || '').toLowerCase();
    if (ev.indexOf('download_cv') !== -1) cvDownloads++;
    else if (ev.indexOf('submit_contact') !== -1) contatos++;
    else if (ev.indexOf('click_telegram') !== -1) telegramClicks++;
    else if (ev.indexOf('click_linkedin') !== -1) linkedinClicks++;
    else if (ev.indexOf('achievement_footer_reached') !== -1) conquistas++;
  });

  var desktopCount = 0;
  var mobileCount = 0;
  var tabletCount = 0;

  var socialCount = 0;
  var devCount = 0;
  var directCount = 0;
  var searchCount = 0;
  var messagingCount = 0;

  var chromeCount = 0;
  var safariCount = 0;
  var edgeCount = 0;
  var firefoxCount = 0;
  var outrosNavCount = 0;

  visitsData.forEach(function(row) {
    // Dispositivo (Coluna C -> index 2)
    var dev = String(row[2] || '');
    if (dev === 'Desktop') desktopCount++;
    else if (dev === 'Mobile') mobileCount++;
    else if (dev === 'Tablet') tabletCount++;

    // Canal de Tráfego (Coluna K -> index 10)
    var channel = String(row[10] || '').toLowerCase();
    if (channel === 'social') socialCount++;
    else if (channel === 'dev') devCount++;
    else if (channel === 'direct') directCount++;
    else if (channel === 'search') searchCount++;
    else if (channel === 'messaging') messagingCount++;

    // Navegador (Coluna E -> index 4)
    var nav = String(row[4] || '');
    if (nav === 'Chrome') chromeCount++;
    else if (nav === 'Safari') safariCount++;
    else if (nav === 'Edge') edgeCount++;
    else if (nav === 'Firefox') firefoxCount++;
    else if (nav) outrosNavCount++;
  });

  dash.clear();
  dash.setTabColor('#38bdf8');

  // Cabeçalho Principal com timestamp da última atualização
  var dataAtualizacao = Utilities.formatDate(new Date(), 'America/Belem', 'dd/MM/yyyy HH:mm:ss');
  dash.getRange('A1:F1').merge().setValue('📊 DASHBOARD DE TELEMETRIA & CONVERSÕES — JOÃO SILVA NETO (Atualizado: ' + dataAtualizacao + ')')
    .setFontSize(12).setFontWeight('bold').setBackground('#0f172a').setFontColor('#38bdf8').setHorizontalAlignment('center');

  // 1. CARDS KPI (Linha 3 e 4)
  dash.getRange('A3').setValue('👥 Total de Visitas');
  dash.getRange('A4').setValue(totalVisitas);
  dash.getRange('A3:A4').setFontWeight('bold').setBackground('#e2e8f0').setHorizontalAlignment('center');

  dash.getRange('B3').setValue('📄 Downloads de CV');
  dash.getRange('B4').setValue(cvDownloads);
  dash.getRange('B3:B4').setFontWeight('bold').setBackground('#e0f2fe').setFontColor('#0284c7').setHorizontalAlignment('center');

  dash.getRange('C3').setValue('✉️ Contatos Enviados');
  dash.getRange('C4').setValue(contatos);
  dash.getRange('C3:C4').setFontWeight('bold').setBackground('#fae8ff').setFontColor('#a21caf').setHorizontalAlignment('center');

  dash.getRange('D3').setValue('💬 Cliques Telegram');
  dash.getRange('D4').setValue(telegramClicks);
  dash.getRange('D3:D4').setFontWeight('bold').setBackground('#f0fdf4').setFontColor('#15803d').setHorizontalAlignment('center');

  dash.getRange('E3').setValue('💼 Cliques LinkedIn');
  dash.getRange('E4').setValue(linkedinClicks);
  dash.getRange('E3:E4').setFontWeight('bold').setBackground('#fef3c7').setFontColor('#b45309').setHorizontalAlignment('center');

  dash.getRange('F3').setValue('🏆 Conquistas Fim Página');
  dash.getRange('F4').setValue(conquistas);
  dash.getRange('F3:F4').setFontWeight('bold').setBackground('#ffedd5').setFontColor('#c2410c').setHorizontalAlignment('center');

  dash.getRange('A4:F4').setFontSize(16);

  // 2. TABELAS DE DETALHAMENTO (Linha 6 em diante)
  
  // Tabela: Dispositivos
  dash.getRange('A6:B6').merge().setValue('📱 Dispositivos').setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
  dash.getRange('A7').setValue('Desktop');
  dash.getRange('B7').setValue(desktopCount);
  dash.getRange('A8').setValue('Mobile');
  dash.getRange('B8').setValue(mobileCount);
  dash.getRange('A9').setValue('Tablet');
  dash.getRange('B9').setValue(tabletCount);

  // Tabela: Canais de Origem
  dash.getRange('C6:D6').merge().setValue('🌐 Canais de Tráfego').setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
  dash.getRange('C7').setValue('social (LinkedIn/X)');
  dash.getRange('D7').setValue(socialCount);
  dash.getRange('C8').setValue('dev (GitHub/Lattes)');
  dash.getRange('D8').setValue(devCount);
  dash.getRange('C9').setValue('direct (Acesso Direto)');
  dash.getRange('D9').setValue(directCount);
  dash.getRange('C10').setValue('search (Google/Bing)');
  dash.getRange('D10').setValue(searchCount);
  dash.getRange('C11').setValue('messaging (Telegram)');
  dash.getRange('D11').setValue(messagingCount);

  // Tabela: Navegadores Mais Usados
  dash.getRange('E6:F6').merge().setValue('🧭 Navegadores').setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
  dash.getRange('E7').setValue('Chrome');
  dash.getRange('F7').setValue(chromeCount);
  dash.getRange('E8').setValue('Safari');
  dash.getRange('F8').setValue(safariCount);
  dash.getRange('E9').setValue('Edge');
  dash.getRange('F9').setValue(edgeCount);
  dash.getRange('E10').setValue('Firefox');
  dash.getRange('F10').setValue(firefoxCount);
  dash.getRange('E11').setValue('Opera / Outros');
  dash.getRange('F11').setValue(outrosNavCount);

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

