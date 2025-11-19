/**
 * Google Apps Script - Receptor de dados de visitantes
 * 
 * INSTRUÇÕES:
 * 1. Abra https://script.google.com
 * 2. Crie um novo projeto
 * 3. Cole TUDO este código
 * 4. SUBSTITUA "SEU_SPREADSHEET_ID" com o ID da sua planilha
 *    (encontra na URL: https://docs.google.com/spreadsheets/d/[ID_AQUI]/edit)
 * 5. Deploy como Web App (Execute as: Sua conta | Who has access: Anyone)
 */

// ⚠️ IMPORTANTE: Substitua com o ID da sua planilha Google
const SPREADSHEET_ID = "SEU_SPREADSHEET_ID";

/**
 * Função principal - recebe dados POST do site
 */
function doPost(e) {
  try {
    Logger.log("doPost chamado");
    Logger.log("Conteúdo recebido:", e.postData.contents);
    
    // Parsear JSON recebido
    const data = JSON.parse(e.postData.contents);
    Logger.log("Dados parseados:", data);
    
    // Validar dados
    if (!data.timestamp || !data.ip) {
      return ContentService.createTextOutput(JSON.stringify({
        error: true,
        message: "Dados incompletos"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Adicionar à planilha
    appendVisitToSheet(data);
    
    // Responder com sucesso
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Dados recebidos e salvos",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log("ERRO em doPost:", error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      error: true,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Adiciona uma linha de visita na planilha
 */
function appendVisitToSheet(data) {
  try {
    const sheet = getVisitasSheet();
    
    // Garantir que tem headers
    ensureHeaders(sheet);
    
    // Preparar linha de dados
    const row = [
      data.timestamp || "",
      data.ip || "",
      data.country || "",
      data.city || "",
      data.isp || "",
      data.userAgent || "",
      data.url || "",
      data.referrer || ""
    ];
    
    // Adicionar linha
    sheet.appendRow(row);
    Logger.log("Linha adicionada com sucesso");
    
    // Atualizar estatísticas
    updateStatistics();
    
  } catch (error) {
    Logger.log("ERRO em appendVisitToSheet:", error.toString());
    throw error;
  }
}

/**
 * Garante que a aba "Visitas" existe com headers
 */
function ensureHeaders(sheet) {
  try {
    const headers = sheet.getRange(1, 1, 1, 8).getValues()[0];
    const expectedHeaders = ["Timestamp", "IP", "País", "Cidade", "ISP", "User Agent", "URL", "Referrer"];
    
    // Se não tem headers ou estão vazios
    if (!headers[0] || headers[0].toString().trim() === "") {
      sheet.insertRows(1);
      sheet.getRange(1, 1, 1, 8).setValues([expectedHeaders]);
      Logger.log("Headers criados");
    }
  } catch (error) {
    Logger.log("ERRO em ensureHeaders:", error.toString());
  }
}

/**
 * Obtém ou cria a aba "Visitas"
 */
function getVisitasSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName("Visitas");
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet("Visitas");
      Logger.log("Aba 'Visitas' criada");
    }
    
    return sheet;
  } catch (error) {
    Logger.log("ERRO em getVisitasSheet:", error.toString());
    throw new Error("Não consegui acessar a planilha. SPREADSHEET_ID está correto?");
  }
}

/**
 * Atualiza estatísticas na aba "Estatísticas"
 */
function updateStatistics() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const visitasSheet = spreadsheet.getSheetByName("Visitas");
    
    if (!visitasSheet) return;
    
    // Obter dados
    const data = visitasSheet.getRange(2, 1, visitasSheet.getLastRow() - 1, 8).getValues();
    
    // Contar por país
    const countries = {};
    const cities = {};
    
    data.forEach(row => {
      const country = row[2]; // Coluna país
      const city = row[3];    // Coluna cidade
      
      if (country) countries[country] = (countries[country] || 0) + 1;
      if (city) cities[city] = (cities[city] || 0) + 1;
    });
    
    // Criar ou atualizar aba de estatísticas
    let statsSheet = spreadsheet.getSheetByName("Estatísticas");
    if (!statsSheet) {
      statsSheet = spreadsheet.insertSheet("Estatísticas");
    } else {
      statsSheet.clear();
    }
    
    // Escrever estatísticas
    statsSheet.appendRow(["País", "Visitas"]);
    Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([country, count]) => {
        statsSheet.appendRow([country, count]);
      });
    
    // Adicionar espaço
    statsSheet.appendRow([]);
    
    // Cidades
    statsSheet.appendRow(["Cidade", "Visitas"]);
    Object.entries(cities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([city, count]) => {
        statsSheet.appendRow([city, count]);
      });
    
    Logger.log("Estatísticas atualizadas");
    
  } catch (error) {
    Logger.log("ERRO em updateStatistics:", error.toString());
  }
}

/**
 * Função para testar manualmente (execute no Apps Script)
 */
function testDoPost() {
  try {
    const testData = {
      timestamp: new Date().toISOString(),
      ip: "192.168.1.1",
      country: "Brazil",
      city: "São Paulo",
      isp: "Test ISP",
      userAgent: "Test",
      url: "https://test.com",
      referrer: ""
    };
    
    const e = {
      postData: {
        contents: JSON.stringify(testData)
      }
    };
    
    const result = doPost(e);
    Logger.log("Resultado do teste:", result.getContent());
  } catch (error) {
    Logger.log("ERRO no teste:", error.toString());
  }
}
