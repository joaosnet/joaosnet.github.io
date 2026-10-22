/** Event-only & Visit telemetry collector v3. Keep this script and its Google Sheet private.
 * Run setup() as the sheet owner, then deploy a web app (execute as owner).
 * POST writes events and visits. GET exposes version/health and summary totals.
 * No secrets in browser JavaScript. Public ingress is best-effort, not abuse-proof.
 */
var EVENT_FIELDS = [
  "version",
  "id",
  "name",
  "time",
  "page",
  "section",
  "element",
  "project",
  "lang",
  "modality",
  "outcome",
  "release",
];
var EVENT_NAMES = [
  "page_view",
  "click",
  "change",
  "contact_result",
  "copy_result",
];
var VISIT_FIELDS = [
  "Data/Hora",
  "Página",
  "Dispositivo",
  "Sistema Operacional",
  "Navegador",
  "Resolução",
  "Fuso IANA",
  "Cidade/Região",
  "Idioma",
  "UTC Offset",
  "Canal de Tráfego",
  "Domínio Origem",
];
var MAX_EVENTS_PER_DAY = 2000;
var MAX_EVENTS_PER_BATCH = 20;
var RETENTION_DAYS = 180;

var DEFAULT_CATALOG = {
  pages: [
    "/",
    "/privacy/",
    "/projects/aethersense/",
    "/projects/dmovel/",
    "/projects/evolutionary-lab/",
    "/404.html",
    "/en/",
    "/en/privacy/",
    "/en/projects/aethersense/",
    "/en/projects/dmovel/",
    "/en/projects/evolutionary-lab/",
    "/en/404.html",
  ],
  elements: [
    "back-top",
    "brand",
    "case-back",
    "case-code",
    "case-contact",
    "case-demo",
    "case-history",
    "case-readme",
    "contact-project",
    "contact-reason",
    "contact-submit",
    "content",
    "cv-download",
    "cv-view",
    "email-copy",
    "email-fallback",
    "email-open",
    "explorer-badge",
    "filter-all",
    "filter-backend",
    "filter-data",
    "filter-devices",
    "filter-interfaces",
    "form-field",
    "github",
    "header-contact",
    "hero-projects",
    "hero-scroll",
    "lab-demo",
    "lab-noise",
    "lab-reset",
    "lab-smoothing",
    "language",
    "language-select",
    "lattes",
    "linkedin",
    "menu",
    "metrics-toggle",
    "nav-about",
    "nav-contact",
    "nav-lab",
    "nav-projects",
    "page",
    "privacy",
    "project-case",
    "project-title",
    "project-visual",
    "secret-terminal",
    "skill-backend",
    "skill-data",
    "skill-devices",
    "skill-interfaces",
    "theme",
    "theme-palette",
    "unlabelled-control",
    "visitor-badge",
  ],
  projects: [
    "aethersense",
    "dmovel",
    "evolutionary-lab",
    "cartilha-dash",
    "dmovel-sitec",
    "sigaa-mcp",
    "varedura",
    "klique-api",
    "federated-learning",
  ],
  releases: ["portfolio-excellence-v1"],
};

function onOpen() {
  if (typeof SpreadsheetApp.getUi === "function") {
    SpreadsheetApp.getUi()
      .createMenu("📊 Telemetria Portfólio")
      .addItem("🔄 Recriar / Atualizar Dashboard", "criarDashboard")
      .addToUi();
  }
}

function criarDashboard() {
  var properties = PropertiesService.getScriptProperties();
  var book = getBook(properties);
  if (book) {
    setupDashboard(book);
    if (typeof book.toast === "function") {
      book.toast("Dashboard atualizado com sucesso!", "📊 Telemetria", 5);
    }
  }
}

function sanitizeText(value, maxLen) {
  if (value === null || value === undefined) return "";
  var str = String(value).trim();
  if (maxLen && str.length > maxLen) str = str.slice(0, maxLen);
  if (/^[=+\-@\t\r\n]/.test(str)) {
    str = "'" + str;
  }
  return str;
}

function getBook(properties) {
  var sheetId = properties ? properties.getProperty("SHEET_ID") : null;
  if (sheetId) {
    try {
      var book = SpreadsheetApp.openById(sheetId);
      if (book) return book;
    } catch (_) {}
  }
  try {
    if (typeof SpreadsheetApp.getActiveSpreadsheet === "function") {
      var active = SpreadsheetApp.getActiveSpreadsheet();
      if (active) {
        if (properties && !sheetId) {
          try {
            properties.setProperty("SHEET_ID", active.getId());
          } catch (_) {}
        }
        return active;
      }
    }
  } catch (_) {}
  return null;
}

function getCatalog(properties) {
  var raw = properties ? properties.getProperty("ALLOWED_CATALOG") : null;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (_) {}
  }
  if (properties && !raw) {
    try {
      properties.setProperty(
        "ALLOWED_CATALOG",
        JSON.stringify(DEFAULT_CATALOG),
      );
    } catch (_) {}
  }
  return DEFAULT_CATALOG;
}

function validateBatch(payload, allowed, now) {
  if (
    !payload ||
    payload.version !== 1 ||
    Object.keys(payload).sort().join(",") !== "events,version" ||
    !Array.isArray(payload.events) ||
    !payload.events.length ||
    payload.events.length > MAX_EVENTS_PER_BATCH
  )
    throw new Error("batch");
  return payload.events.map(function (e) {
    if (
      !e ||
      Object.keys(e).sort().join(",") !== EVENT_FIELDS.slice().sort().join(",")
    )
      throw new Error("fields");
    if (
      e.version !== 1 ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        e.id,
      )
    )
      throw new Error("id");
    if (
      EVENT_NAMES.indexOf(e.name) < 0 ||
      allowed.pages.indexOf(e.page) < 0 ||
      allowed.elements.indexOf(e.element) < 0 ||
      (e.project !== "" && allowed.projects.indexOf(e.project) < 0) ||
      allowed.releases.indexOf(e.release) < 0
    )
      throw new Error("catalog");
    if (
      [
        "home",
        "projects",
        "lab",
        "about",
        "contact",
        "case",
        "privacy",
        "footer",
        "header",
        "page",
      ].indexOf(e.section) < 0 ||
      ["pt", "en"].indexOf(e.lang) < 0 ||
      ["mouse", "touch", "pen", "keyboard", "system"].indexOf(e.modality) < 0 ||
      ["none", "success", "error", "invalid", "timeout", "limited"].indexOf(
        e.outcome,
      ) < 0
    )
      throw new Error("enum");
    if (
      typeof e.time !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(e.time) ||
      !isFinite(Date.parse(e.time)) ||
      Math.abs(Date.parse(e.time) - now) > 86400000
    )
      throw new Error("time");
    EVENT_FIELDS.forEach(function (key) {
      var value = e[key];
      if (key === "version") return;
      if (
        typeof value !== "string" ||
        value.length > 160 ||
        /^[=+\-@\t\r\n]/.test(value)
      )
        throw new Error("text");
    });
    return EVENT_FIELDS.map(function (key) {
      return e[key];
    });
  });
}

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function doGet() {
  var totalVisitas = 0;
  var totalEventos = 0;
  try {
    var properties = PropertiesService.getScriptProperties();
    var book = getBook(properties);
    if (book) {
      var visitasSheet = book.getSheetByName("Visitas");
      if (visitasSheet && visitasSheet.getLastRow() > 1) {
        totalVisitas = visitasSheet.getLastRow() - 1;
      }
      var legacyEvents = book.getSheetByName("Eventos");
      if (legacyEvents && legacyEvents.getLastRow() > 1) {
        totalEventos += legacyEvents.getLastRow() - 1;
      }
      var eventsSheet = book.getSheetByName("EventsV1");
      if (eventsSheet && eventsSheet.getLastRow() > 1) {
        totalEventos += eventsSheet.getLastRow() - 1;
      }
      var monthlySheet = book.getSheetByName("MonthlyV1");
      if (monthlySheet && monthlySheet.getLastRow() > 1) {
        var mRows = monthlySheet
          .getRange(2, 9, monthlySheet.getLastRow() - 1, 1)
          .getValues();
        mRows.forEach(function (r) {
          totalEventos += Number(r[0]) || 0;
        });
      }
    }
  } catch (_) {}

  return jsonResponse({
    status: "online",
    version: 1,
    service: "portfolio-telemetry",
    timestamp: new Date().toISOString(),
    metricas: {
      totalVisitasRegistradas: totalVisitas,
      totalEventosRegistrados: totalEventos,
    },
  });
}

function recordVisit(payload, book, properties) {
  var sheet = book.getSheetByName("Visitas");
  if (!sheet) {
    if (book.insertSheet) {
      sheet = book.insertSheet("Visitas");
      sheet.appendRow(VISIT_FIELDS);
      sheet.setFrozenRows(1);
    } else {
      return false;
    }
  }

  var channel = payload.channel || payload.canal || "direct";
  var referrer = payload.referrer || payload.origem || "";
  var domain = "";
  if (referrer) {
    try {
      var match = referrer.match(/^https?:\/\/([^/?#]+)/i);
      if (match) domain = match[1];
    } catch (_) {}
  }

  var row = [
    sanitizeText(payload.timestamp || new Date().toISOString(), 40),
    sanitizeText(payload.path || "/", 100),
    sanitizeText(payload.device || "Desktop", 20),
    sanitizeText(payload.os || payload.sistemaOperacional || "Desconhecido", 40),
    sanitizeText(payload.browser || payload.navegador || "Desconhecido", 40),
    sanitizeText(payload.resolution || payload.resolucao || "Desconhecido", 30),
    sanitizeText(payload.timezone || payload.fuso || "Desconhecido", 60),
    sanitizeText(payload.cityRegion || payload.cidade || "Desconhecido", 60),
    sanitizeText(payload.language || payload.idioma || "pt-BR", 20),
    sanitizeText(payload.utcOffset || "UTC", 20),
    sanitizeText(channel, 30),
    sanitizeText(domain || referrer, 100),
  ];

  if (sheet.getRange) {
    var target = sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length);
    if (target.setNumberFormat) target.setNumberFormat("@");
    if (target.setValues) target.setValues([row]);
    else if (sheet.appendRow) sheet.appendRow(row);
  } else if (sheet.appendRow) {
    sheet.appendRow(row);
  }
  return true;
}

function setupDashboard(book) {
  var dash = book.getSheetByName("Dashboard");
  if (!dash) {
    dash = book.insertSheet ? book.insertSheet("Dashboard", 0) : null;
  }
  if (!dash) return;

  var visitsSheet = book.getSheetByName("Visitas");
  var legacyEvents = book.getSheetByName("Eventos");
  var modernEvents = book.getSheetByName("EventsV1");

  var visitsData = [];
  if (visitsSheet && visitsSheet.getLastRow() > 1) {
    var vCols =
      typeof visitsSheet.getLastColumn === "function"
        ? visitsSheet.getLastColumn()
        : 12;
    visitsData = visitsSheet
      .getRange(2, 1, visitsSheet.getLastRow() - 1, Math.max(12, vCols))
      .getValues();
  }

  var cvDownloads = 0;
  var contatos = 0;
  var telegramClicks = 0;
  var linkedinClicks = 0;
  var conquistas = 0;

  if (legacyEvents && legacyEvents.getLastRow() > 1) {
    var lCols =
      typeof legacyEvents.getLastColumn === "function"
        ? legacyEvents.getLastColumn()
        : 10;
    var legacyData = legacyEvents
      .getRange(2, 1, legacyEvents.getLastRow() - 1, lCols)
      .getValues();
    legacyData.forEach(function (row) {
      var ev = String(row[1] || "").toLowerCase();
      if (ev.indexOf("download_cv") !== -1) cvDownloads++;
      else if (ev.indexOf("submit_contact") !== -1) contatos++;
      else if (ev.indexOf("click_telegram") !== -1) telegramClicks++;
      else if (ev.indexOf("click_linkedin") !== -1) linkedinClicks++;
      else if (ev.indexOf("achievement_footer_reached") !== -1) conquistas++;
    });
  }

  if (modernEvents && modernEvents.getLastRow() > 1) {
    var mCols =
      typeof modernEvents.getLastColumn === "function"
        ? modernEvents.getLastColumn()
        : 12;
    var modernData = modernEvents
      .getRange(2, 1, modernEvents.getLastRow() - 1, mCols)
      .getValues();
    modernData.forEach(function (row) {
      var name = String(row[2] || "").toLowerCase();
      var element = String(row[6] || "").toLowerCase();
      if (
        element.indexOf("cv-download") !== -1 ||
        element.indexOf("cv-view") !== -1
      )
        cvDownloads++;
      else if (
        name === "contact_result" ||
        element.indexOf("contact-submit") !== -1
      )
        contatos++;
      else if (element.indexOf("linkedin") !== -1) linkedinClicks++;
      else if (element.indexOf("explorer-badge") !== -1) conquistas++;
    });
  }

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

  visitsData.forEach(function (row) {
    var dev = String(row[2] || "");
    if (dev === "Desktop") desktopCount++;
    else if (dev === "Mobile") mobileCount++;
    else if (dev === "Tablet") tabletCount++;

    var nav = String(row[4] || "");
    if (nav === "Chrome") chromeCount++;
    else if (nav === "Safari") safariCount++;
    else if (nav === "Edge") edgeCount++;
    else if (nav === "Firefox") firefoxCount++;
    else if (nav && nav !== "Desconhecido") outrosNavCount++;

    var channel = String(row[10] || "").toLowerCase();
    if (channel === "social") socialCount++;
    else if (channel === "dev") devCount++;
    else if (channel === "direct") directCount++;
    else if (channel === "search") searchCount++;
    else if (channel === "messaging") messagingCount++;
  });

  if (typeof dash.clear === "function") dash.clear();
  if (typeof dash.setTabColor === "function") dash.setTabColor("#38bdf8");

  var dataAtualizacao = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Belem",
  });

  var setCell = function (
    rangeStr,
    val,
    bg,
    fg,
    size,
    isBold,
    align,
    doMerge,
  ) {
    if (!dash.getRange) return;
    var r = dash.getRange(rangeStr);
    if (!r) return;
    if (doMerge && typeof r.merge === "function") r.merge();
    if (typeof r.setValue === "function") r.setValue(val);
    if (bg && typeof r.setBackground === "function") r.setBackground(bg);
    if (fg && typeof r.setFontColor === "function") r.setFontColor(fg);
    if (size && typeof r.setFontSize === "function") r.setFontSize(size);
    if (isBold && typeof r.setFontWeight === "function") r.setFontWeight("bold");
    if (align && typeof r.setHorizontalAlignment === "function")
      r.setHorizontalAlignment(align);
  };

  setCell(
    "A1:F1",
    "📊 DASHBOARD DE TELEMETRIA & CONVERSÕES — JOÃO SILVA NETO (Atualizado: " +
      dataAtualizacao +
      ")",
    "#0f172a",
    "#38bdf8",
    12,
    true,
    "center",
    true,
  );

  setCell("A3", "👥 Total de Visitas", "#e2e8f0", null, null, true, "center");
  setCell("A4", visitsData.length, "#e2e8f0", null, 16, true, "center");

  setCell("B3", "📄 Downloads de CV", "#e0f2fe", "#0284c7", null, true, "center");
  setCell("B4", cvDownloads, "#e0f2fe", "#0284c7", 16, true, "center");

  setCell("C3", "✉️ Contatos Enviados", "#fae8ff", "#a21caf", null, true, "center");
  setCell("C4", contatos, "#fae8ff", "#a21caf", 16, true, "center");

  setCell("D3", "💬 Cliques Telegram", "#f0fdf4", "#15803d", null, true, "center");
  setCell("D4", telegramClicks, "#f0fdf4", "#15803d", 16, true, "center");

  setCell("E3", "💼 Cliques LinkedIn", "#fef3c7", "#b45309", null, true, "center");
  setCell("E4", linkedinClicks, "#fef3c7", "#b45309", 16, true, "center");

  setCell(
    "F3",
    "🏆 Conquistas Fim Página",
    "#ffedd5",
    "#c2410c",
    null,
    true,
    "center",
  );
  setCell("F4", conquistas, "#ffedd5", "#c2410c", 16, true, "center");

  setCell(
    "A6:B6",
    "📱 Dispositivos",
    "#1e293b",
    "#ffffff",
    null,
    true,
    null,
    true,
  );
  setCell("A7", "Desktop");
  setCell("B7", desktopCount, null, null, null, true, "center");
  setCell("A8", "Mobile");
  setCell("B8", mobileCount, null, null, null, true, "center");
  setCell("A9", "Tablet");
  setCell("B9", tabletCount, null, null, null, true, "center");

  setCell(
    "C6:D6",
    "🌐 Canais de Tráfego",
    "#1e293b",
    "#ffffff",
    null,
    true,
    null,
    true,
  );
  setCell("C7", "social (LinkedIn/X)");
  setCell("D7", socialCount, null, null, null, true, "center");
  setCell("C8", "dev (GitHub/Lattes)");
  setCell("D8", devCount, null, null, null, true, "center");
  setCell("C9", "direct (Acesso Direto)");
  setCell("D9", directCount, null, null, null, true, "center");
  setCell("C10", "search (Google/Bing)");
  setCell("D10", searchCount, null, null, null, true, "center");
  setCell("C11", "messaging (Telegram)");
  setCell("D11", messagingCount, null, null, null, true, "center");

  setCell(
    "E6:F6",
    "🧭 Navegadores",
    "#1e293b",
    "#ffffff",
    null,
    true,
    null,
    true,
  );
  setCell("E7", "Chrome");
  setCell("F7", chromeCount, null, null, null, true, "center");
  setCell("E8", "Safari");
  setCell("F8", safariCount, null, null, null, true, "center");
  setCell("E9", "Edge");
  setCell("F9", edgeCount, null, null, null, true, "center");
  setCell("E10", "Firefox");
  setCell("F10", firefoxCount, null, null, null, true, "center");
  setCell("E11", "Opera / Outros");
  setCell("F11", outrosNavCount, null, null, null, true, "center");

  if (dash.setBorder) {
    try {
      dash
        .getRange("A6:F11")
        .setBorder(
          true,
          true,
          true,
          true,
          true,
          true,
          "#cbd5e1",
          SpreadsheetApp.BorderStyle ? SpreadsheetApp.BorderStyle.SOLID : null,
        );
    } catch (_) {}
  }

  if (dash.setColumnWidth) {
    try {
      dash.setColumnWidth(1, 140);
      dash.setColumnWidth(2, 110);
      dash.setColumnWidth(3, 160);
      dash.setColumnWidth(4, 110);
      dash.setColumnWidth(5, 150);
      dash.setColumnWidth(6, 130);
    } catch (_) {}
  }
}

function doPost(e) {
  if (
    !e ||
    !e.postData ||
    typeof e.postData.contents !== "string" ||
    e.postData.contents.length > 20000
  )
    return jsonResponse({ ok: false, status: "error" });

  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (_) {
    return jsonResponse({ ok: false, status: "error" });
  }

  var properties = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return jsonResponse({ ok: false, status: "error" });

  try {
    var day = new Date().toISOString().slice(0, 10);
    var count =
      properties.getProperty("QUOTA_DAY") === day
        ? Number(properties.getProperty("QUOTA_COUNT") || 0)
        : 0;

    var book = getBook(properties);
    if (!book) return jsonResponse({ ok: false, status: "error" });

    // Rota 1: Registro de Visita individual ({ type: "visit", ... })
    if (payload && payload.type === "visit") {
      if (count + 1 > MAX_EVENTS_PER_DAY)
        return jsonResponse({ ok: false, status: "quota_exceeded" });
      recordVisit(payload, book, properties);
      properties.setProperties({
        QUOTA_DAY: day,
        QUOTA_COUNT: String(count + 1),
      });
      return jsonResponse({ ok: true, status: "success" });
    }

    // Rota 2: Lote moderno de eventos ({ version: 1, events: [...] })
    var allowed = getCatalog(properties);
    var rows = validateBatch(payload, allowed, Date.now());

    if (count + rows.length > MAX_EVENTS_PER_DAY)
      return jsonResponse({ ok: false, status: "quota_exceeded" });

    var sheet =
      book.getSheetByName("EventsV1") || book.getSheetByName("Eventos");
    if (!sheet) return jsonResponse({ ok: false, status: "error" });
    if (sheet.getLastRow() + rows.length > 360001)
      return jsonResponse({ ok: false, status: "error" });

    var cache = CacheService.getScriptCache();
    var seen = {};
    rows = rows.filter(function (row) {
      var id = row[1];
      if (seen[id] || (cache && cache.get(id))) return false;
      seen[id] = true;
      return (
        sheet.getLastRow() < 2 ||
        !sheet
          .getRange(2, 2, sheet.getLastRow() - 1, 1)
          .createTextFinder(id)
          .matchEntireCell(true)
          .findNext()
      );
    });

    if (rows.length) {
      var target = sheet.getRange(
        sheet.getLastRow() + 1,
        1,
        rows.length,
        EVENT_FIELDS.length,
      );
      if (target.setNumberFormat) target.setNumberFormat("@");
      target.setValues(rows);
      if (cache) {
        rows.forEach(function (row) {
          cache.put(row[1], "1", 21600);
        });
      }
      properties.setProperties({
        QUOTA_DAY: day,
        QUOTA_COUNT: String(count + rows.length),
      });
    }

    return jsonResponse({ ok: true, status: "success" });
  } catch (_) {
    return jsonResponse({ ok: false, status: "error" });
  } finally {
    lock.releaseLock();
  }
}

function setup() {
  var properties = PropertiesService.getScriptProperties();
  var book = getBook(properties);
  if (!book) {
    throw new Error(
      "Não foi possível acessar a planilha. Execute o Apps Script diretamente de dentro da planilha (Extensões > Apps Script) ou configure a propriedade SHEET_ID.",
    );
  }

  getCatalog(properties);

  var events = book.getSheetByName("EventsV1") || book.insertSheet("EventsV1");
  if (!events.getLastRow()) events.appendRow(EVENT_FIELDS);
  events.setFrozenRows(1);

  var visitas = book.getSheetByName("Visitas") || book.insertSheet("Visitas");
  if (!visitas.getLastRow()) visitas.appendRow(VISIT_FIELDS);
  visitas.setFrozenRows(1);

  ["MonthlyV1", "Dashboard"].forEach(function (name) {
    if (!book.getSheetByName(name)) book.insertSheet(name);
  });

  setupDashboard(book);

  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === "maintain";
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });
  ScriptApp.newTrigger("maintain").timeBased().everyDays(1).atHour(3).create();
}

function aggregateRows(rows) {
  var counts = {};
  rows.forEach(function (row) {
    var key = [
      String(row[3]).slice(0, 7),
      row[2],
      row[4],
      row[5],
      row[6],
      row[7],
      row[8],
      row[10],
    ].join("|");
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

function replaceRows(sheet, rows, width) {
  var height = Math.max(sheet.getLastRow(), rows.length);
  var padded = [];
  for (var i = 0; i < height; i++) {
    var row = rows[i] ? rows[i].slice() : [];
    while (row.length < width) row.push("");
    padded.push(row);
  }
  sheet.getRange(1, 1, height, width).setNumberFormat("@").setValues(padded);
}

function maintain() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var properties = PropertiesService.getScriptProperties();
    var book = getBook(properties);
    if (!book) return;

    var events =
      book.getSheetByName("EventsV1") || book.getSheetByName("Eventos");
    if (!events) return;
    var summary = book.getSheetByName("MonthlyV1");
    if (!summary) return;

    var rows =
      events.getLastRow() > 1
        ? events
            .getRange(2, 1, events.getLastRow() - 1, EVENT_FIELDS.length)
            .getValues()
        : [];
    var now = new Date();
    var cutoff = now.getTime() - RETENTION_DAYS * 86400000;
    var monthCutoff = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
    )
      .toISOString()
      .slice(0, 7);
    var live = [];
    var expired = [];
    rows.forEach(function (row) {
      (Date.parse(String(row[3])) >= cutoff ? live : expired).push(row);
    });

    var archived =
      summary.getLastRow() > 1
        ? summary.getRange(2, 1, summary.getLastRow() - 1, 9).getValues()
        : [];
    var watermark = summary.getLastRow()
      ? Date.parse(String(summary.getRange(1, 10, 1, 1).getValues()[0][0]))
      : NaN;
    if (!isFinite(watermark)) watermark = -Infinity;
    var counts = aggregateRows(
      expired.filter(function (row) {
        return Date.parse(String(row[3])) > watermark;
      }),
    );
    archived.forEach(function (row) {
      var key = row.slice(0, 8).join("|");
      counts[key] = (counts[key] || 0) + Number(row[8]);
    });
    var monthly = Object.keys(counts)
      .sort()
      .filter(function (key) {
        return key.slice(0, 7) >= monthCutoff;
      })
      .map(function (key) {
        return key.split("|").concat(counts[key]);
      });
    var monthlyHeader = [
      "month",
      "event",
      "page",
      "section",
      "element",
      "project",
      "lang",
      "outcome",
      "count",
      new Date(cutoff).toISOString(),
    ];
    replaceRows(summary, [monthlyHeader].concat(monthly), 10);
    if (expired.length) {
      replaceRows(events, [EVENT_FIELDS].concat(live), EVENT_FIELDS.length);
    }

    setupDashboard(book);
  } finally {
    lock.releaseLock();
  }
}
