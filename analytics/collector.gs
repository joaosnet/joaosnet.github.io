/** Event-only & Visit telemetry collector v2. Keep this script and its Google Sheet private.
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
  "Origem",
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
    // Previne injeção de fórmulas no catálogo ou payloads
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
    sanitizeText(payload.referrer || payload.origem || "", 150),
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
      // Deduplicação pelo UUID
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

      // Se o lote contiver evento de page_view, sincroniza também na aba Visitas se configurado
      var pageView = payload.events.find(function (evt) {
        return evt.name === "page_view";
      });
      if (pageView) {
        recordVisit(
          {
            timestamp: pageView.time,
            path: pageView.page,
            device: pageView.modality === "touch" ? "Mobile" : "Desktop",
            language: pageView.lang,
            source: "events-batch",
          },
          book,
          properties,
        );
      }
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

  // Inicializa o catálogo padrão nas propriedades do script caso ainda não exista
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

  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === "maintain";
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });
  ScriptApp.newTrigger("maintain").timeBased().everyDays(1).atHour(3).create();
  maintain();
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

// A single rectangular write replaces values without a destructive clear-first gap.
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
    var merged = aggregateRows(live);
    monthly.forEach(function (row) {
      var key = row.slice(0, 8).join("|");
      merged[key] = (merged[key] || 0) + Number(row[8]);
    });
    var totals = {};
    Object.keys(merged).forEach(function (key) {
      var parts = key.split("|");
      var dimension = [
        parts[1],
        parts[3],
        parts[4],
        parts[5],
        parts[6],
        parts[7],
      ].join("|");
      totals[dimension] = (totals[dimension] || 0) + merged[key];
    });

    var dashboard = book.getSheetByName("Dashboard");
    if (!dashboard) return;
    var dashboardHeader = [
      "Event",
      "Section",
      "Element",
      "Project",
      "Language",
      "Outcome",
      "Count (events, not people)",
    ];
    var table = Object.keys(totals)
      .sort(function (a, b) {
        return totals[b] - totals[a];
      })
      .map(function (key) {
        return key.split("|").concat(totals[key]);
      });
    replaceRows(dashboard, [dashboardHeader].concat(table), 7);
    dashboard.setFrozenRows(1);
    dashboard.autoResizeColumns(1, 7);
  } finally {
    lock.releaseLock();
  }
}
