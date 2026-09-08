/** Event-only collector v1. Keep this script and its Google Sheet private.
 * Run setup() as the sheet owner, then deploy a web app (execute as owner).
 * POST writes events. GET exposes only version/health, never records or totals.
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
var MAX_EVENTS_PER_DAY = 2000;
var MAX_EVENTS_PER_BATCH = 20;
var RETENTION_DAYS = 180;

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
    // Even an incorrectly edited catalog cannot authorize spreadsheet formulas.
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
  return jsonResponse({
    version: 1,
    service: "portfolio-events",
    status: "ready",
  });
}
function doPost(e) {
  if (
    !e ||
    !e.postData ||
    typeof e.postData.contents !== "string" ||
    e.postData.contents.length > 20000
  )
    return jsonResponse({ ok: false });
  var rows;
  try {
    var properties = PropertiesService.getScriptProperties();
    var allowed = JSON.parse(properties.getProperty("ALLOWED_CATALOG") || "{}");
    rows = validateBatch(JSON.parse(e.postData.contents), allowed, Date.now());
  } catch (_) {
    return jsonResponse({ ok: false });
  }
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return jsonResponse({ ok: false });
  try {
    var day = new Date().toISOString().slice(0, 10);
    var count =
      properties.getProperty("QUOTA_DAY") === day
        ? Number(properties.getProperty("QUOTA_COUNT") || 0)
        : 0;
    if (count + rows.length > MAX_EVENTS_PER_DAY)
      return jsonResponse({ ok: false });
    var sheet = SpreadsheetApp.openById(
      properties.getProperty("SHEET_ID"),
    ).getSheetByName("EventsV1");
    if (!sheet) return jsonResponse({ ok: false });
    if (sheet.getLastRow() + rows.length > 360001)
      return jsonResponse({ ok: false });
    var cache = CacheService.getScriptCache();
    var seen = {};
    rows = rows.filter(function (row) {
      var id = row[1];
      if (seen[id] || cache.get(id)) return false;
      seen[id] = true;
      // Durable deduplication; exact UUID matches in the ID column only.
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
      target.setNumberFormat("@");
      target.setValues(rows);
      rows.forEach(function (row) {
        cache.put(row[1], "1", 21600);
      });
      properties.setProperties({
        QUOTA_DAY: day,
        QUOTA_COUNT: String(count + rows.length),
      });
    }
    return jsonResponse({ ok: true });
  } catch (_) {
    return jsonResponse({ ok: false });
  } finally {
    lock.releaseLock();
  }
}

function setup() {
  var properties = PropertiesService.getScriptProperties();
  if (
    !properties.getProperty("SHEET_ID") ||
    !properties.getProperty("ALLOWED_CATALOG")
  )
    throw new Error("Set SHEET_ID and ALLOWED_CATALOG script properties first");
  var book = SpreadsheetApp.openById(properties.getProperty("SHEET_ID"));
  var events = book.getSheetByName("EventsV1") || book.insertSheet("EventsV1");
  if (!events.getLastRow()) events.appendRow(EVENT_FIELDS);
  events.setFrozenRows(1);
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
    var book = SpreadsheetApp.openById(
      PropertiesService.getScriptProperties().getProperty("SHEET_ID"),
    );
    var events = book.getSheetByName("EventsV1");
    var summary = book.getSheetByName("MonthlyV1");
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
    // MonthlyV1 stores ONLY already-expired rows, so daily runs never double-count live events.
    var archived =
      summary.getLastRow() > 1
        ? summary.getRange(2, 1, summary.getLastRow() - 1, 9).getValues()
        : [];
    // The watermark is committed in the same write as monthly totals. If the
    // subsequent event pruning fails, a retry must not archive those rows twice.
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
