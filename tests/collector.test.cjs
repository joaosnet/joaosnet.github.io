const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { randomUUID } = require("node:crypto");

const source = fs.readFileSync(path.join(__dirname, "../analytics/collector.gs"), "utf8");
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "../analytics/catalog.json"), "utf8"));
const context = vm.createContext({});
vm.runInContext(source, context);

const event = (overrides = {}) => ({
  version: 1,
  id: randomUUID(),
  name: "click",
  time: new Date().toISOString(),
  page: "/",
  section: "home",
  element: "hero-projects",
  project: "",
  lang: "pt",
  modality: "touch",
  outcome: "none",
  release: catalog.releases[0],
  ...overrides,
});

const validate = (events) =>
  context.validateBatch({ version: 1, events }, catalog, Date.now());

test("accepts the exact browser schema and maintains stable column ordering", () => {
  const e = event();
  const rows = validate([e]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0][1], e.id);
  assert.equal(rows[0][6], "hero-projects");
});

test("accepts events in all supported languages: pt, en, es", () => {
  for (const lang of ["pt", "en", "es"]) {
    const rows = validate([event({ lang })]);
    assert.equal(rows.length, 1);
  }
});

for (const [key, value] of Object.entries({
  name: "unknown",
  page: "/?email=secret",
  section: "secret",
  element: '=IMPORTXML("evil")',
  project: "private-source",
  lang: "fr",
  modality: "fingerprint",
  outcome: "unknown",
  release: "unapproved",
  time: "2020-01-01T00:00:00.000Z",
  id: "=formula",
  version: 2,
})) {
  test("rejects invalid " + key, () =>
    assert.throws(() => validate([event({ [key]: value })])),
  );
}

test("rejects unknown elements not registered in catalog", () => {
  const unknownElements = [
    "non-existent-button",
    "unregistered-cta",
    "custom-tracker-999",
    "random-element",
  ];
  for (const element of unknownElements) {
    assert.throws(
      () => validate([event({ element })]),
      /catalog/,
      `Should have thrown catalog error for unknown element: ${element}`,
    );
  }
});

test("rejects additional personal-data fields", () =>
  assert.throws(() => validate([event({ email: "private@example.test" })])));

test("rejects a batch over the limit", () =>
  assert.throws(() => validate(Array.from({ length: 21 }, () => event()))));

test("rejects empty and incorrectly versioned batches", () => {
  assert.throws(() => validate([]));
  assert.throws(() =>
    context.validateBatch(
      { version: 2, events: [event()] },
      catalog,
      Date.now(),
    ),
  );
});

test("rejects formulas even if the catalog was edited incorrectly", () => {
  const altered = structuredClone(catalog);
  altered.elements.push("=SUM(A1)");
  assert.throws(() =>
    context.validateBatch(
      { version: 1, events: [event({ element: "=SUM(A1)" })] },
      altered,
      Date.now(),
    ),
  );
});

test("monthly aggregation counts events and never introduces a visitor identity", () => {
  const rows = validate([event(), event()]);
  const result = context.aggregateRows(rows);
  assert.equal(Object.values(result)[0], 2);
  assert.match(Object.keys(result)[0], /click\|\/\|home\|hero-projects/);
});

function parseA1Notation(rangeStr) {
  if (typeof rangeStr !== "string") {
    return { row: 1, col: 1, numRows: 1, numCols: 1 };
  }
  const parts = rangeStr.split(":");
  const m1 = parts[0].match(/([A-Z]+)(\d+)/);
  if (!m1) return { row: 1, col: 1, numRows: 1, numCols: 1 };
  const col1 = m1[1].split("").reduce((acc, c) => acc * 26 + c.charCodeAt(0) - 64, 0);
  const row1 = parseInt(m1[2], 10);
  if (parts.length === 1) {
    return { row: row1, col: col1, numRows: 1, numCols: 1 };
  }
  const m2 = parts[1].match(/([A-Z]+)(\d+)/);
  if (!m2) return { row: row1, col: col1, numRows: 1, numCols: 1 };
  const col2 = m2[1].split("").reduce((acc, c) => acc * 26 + c.charCodeAt(0) - 64, 0);
  const row2 = parseInt(m2[2], 10);
  return {
    row: Math.min(row1, row2),
    col: Math.min(col1, col2),
    numRows: Math.abs(row2 - row1) + 1,
    numCols: Math.abs(col2 - col1) + 1,
  };
}

class Sheet {
  constructor() {
    this.rows = [];
    this.maxRows = 1000;
  }
  getLastRow() {
    let last = this.rows.length;
    while (
      last &&
      this.rows[last - 1].every((value) => value === "" || value === undefined)
    )
      last--;
    return last;
  }
  getLastColumn() {
    return (context && context.VISIT_FIELDS) ? context.VISIT_FIELDS.length : 16;
  }
  getMaxRows() {
    return this.maxRows;
  }
  insertRowsAfter(afterPosition, howMany) {
    this.maxRows += howMany;
  }
  deleteRows(rowPosition, howMany) {
    this.rows.splice(rowPosition - 1, howMany);
  }
  appendRow(row) {
    this.rows.push([...row]);
  }
  clearContents() {
    this.rows = [];
  }
  clear() {
    this.rows = [];
  }
  setFrozenRows() {}
  setTabColor() {}
  setColumnWidth() {}
  autoResizeColumns() {}
  getRange(row, col, n, m) {
    const sheet = this;
    let rIdx, cIdx, numRows, numCols;

    if (typeof row === "string") {
      const parsed = parseA1Notation(row);
      rIdx = parsed.row;
      cIdx = parsed.col;
      numRows = parsed.numRows;
      numCols = parsed.numCols;
    } else {
      rIdx = typeof row === "number" ? row : 1;
      cIdx = typeof col === "number" ? col : 1;
      numRows = typeof n === "number" ? n : 1;
      numCols = typeof m === "number" ? m : 1;
    }

    return {
      merge() {
        return this;
      },
      setValue(val) {
        if (!sheet.rows[rIdx - 1]) sheet.rows[rIdx - 1] = [];
        sheet.rows[rIdx - 1][cIdx - 1] = val;
        return this;
      },
      setFontSize() {
        return this;
      },
      setFontWeight() {
        return this;
      },
      setBackground() {
        return this;
      },
      setFontColor() {
        return this;
      },
      setHorizontalAlignment() {
        return this;
      },
      setBorder() {
        return this;
      },
      setNumberFormat() {
        return this;
      },
      setValues(values) {
        values.forEach((vals, i) => {
          if (!sheet.rows[rIdx - 1 + i]) sheet.rows[rIdx - 1 + i] = [];
          vals.forEach((v, j) => (sheet.rows[rIdx - 1 + i][cIdx - 1 + j] = v));
        });
        return this;
      },
      getValues() {
        return Array.from({ length: numRows }, (_, i) =>
          (sheet.rows[rIdx - 1 + i] || []).slice(cIdx - 1, cIdx - 1 + numCols),
        );
      },
      createTextFinder(id) {
        return {
          matchEntireCell() {
            return this;
          },
          findNext() {
            return sheet.rows
              .slice(rIdx - 1, rIdx - 1 + numRows)
              .some((r) => r[cIdx - 1] === id)
              ? {}
              : null;
          },
        };
      },
    };
  }
}

function runtime() {
  const sheets = {
    EventsV1: new Sheet(),
    MonthlyV1: new Sheet(),
    Dashboard: new Sheet(),
    Visitas: new Sheet(),
    Eventos: new Sheet(),
  };
  sheets.EventsV1.appendRow(Array.from(context.EVENT_FIELDS));
  sheets.Visitas.appendRow(Array.from(context.VISIT_FIELDS));
  const props = {
    SHEET_ID: "test-only",
    ALLOWED_CATALOG: JSON.stringify(catalog),
  };
  let lockable = true;
  const cache = new Map();
  const scope = vm.createContext({
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (s) => ({
        setMimeType() {
          return JSON.parse(s);
        },
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => props[key],
        setProperties: (values) => Object.assign(props, values),
        setProperty: (key, val) => (props[key] = val),
      }),
    },
    LockService: {
      getScriptLock: () => ({ tryLock: () => lockable, releaseLock() {} }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (key) => cache.get(key),
        put: (key, value) => cache.set(key, value),
      }),
    },
    SpreadsheetApp: {
      openById: () => ({
        getSheetByName: (name) => sheets[name],
        insertSheet: (name) => {
          if (!sheets[name]) sheets[name] = new Sheet();
          return sheets[name];
        },
      }),
      getActiveSpreadsheet: () => ({
        getId: () => "test-only",
        getSheetByName: (name) => sheets[name],
        insertSheet: (name) => {
          if (!sheets[name]) sheets[name] = new Sheet();
          return sheets[name];
        },
      }),
    },
  });
  vm.runInContext(source, scope);
  return {
    scope,
    sheets,
    props,
    lock: (value) => {
      lockable = value;
    },
  };
}

test("GET returns health status and counts for visits and events", () => {
  const { scope, sheets } = runtime();
  sheets.Visitas.appendRow([
    "2026-10-22",
    "/",
    "Desktop",
    "Windows",
    "Chrome",
    "1920x1080",
    "UTC",
    "SP",
    "pt-BR",
    "UTC-3",
    "direct",
    "",
  ]);
  const res = scope.doGet();
  assert.equal(res.status, "online");
  assert.equal(res.service, "portfolio-telemetry");
  assert.equal(res.metricas.totalVisitasRegistradas, 1);
  assert.equal(res.metricas.totalEventosRegistrados, 0);
});

test("POST validates before writing, deduplicates, and respects lock/quota", () => {
  const { scope, sheets, props, lock } = runtime();
  const e = event();
  const request = {
    postData: { contents: JSON.stringify({ version: 1, events: [e, e] }) },
  };
  assert.equal(scope.doPost(request).ok, true);
  assert.equal(sheets.EventsV1.getLastRow(), 2);
  assert.equal(scope.doPost(request).ok, true);
  assert.equal(sheets.EventsV1.getLastRow(), 2);
  lock(false);
  assert.equal(scope.doPost(request).ok, false);
  lock(true);
  props.QUOTA_COUNT = "2000";
  assert.equal(
    scope.doPost({
      postData: { contents: JSON.stringify({ version: 1, events: [event()] }) },
    }).ok,
    false,
  );
  assert.equal(sheets.EventsV1.getLastRow(), 2);
  assert.equal(scope.doPost({ postData: { contents: "not json" } }).ok, false);
});

test("doPost rejects batch containing unknown element", () => {
  const { scope, sheets } = runtime();
  const res = scope.doPost({
    postData: {
      contents: JSON.stringify({
        version: 1,
        events: [event({ element: "completely-unknown-element" })],
      }),
    },
  });
  assert.equal(res.ok, false);
  assert.equal(res.status, "error");
  assert.equal(sheets.EventsV1.getLastRow(), 1);
});

test("doPost rejects payload exceeding 20KB threshold (> 20000 characters)", () => {
  const { scope, sheets } = runtime();
  const oversizedRaw = JSON.stringify({ version: 1, events: [event()] }) + " ".repeat(20005);
  assert.ok(oversizedRaw.length > 20000);
  const resRaw = scope.doPost({
    postData: { contents: oversizedRaw },
  });
  assert.equal(resRaw.ok, false);
  assert.equal(resRaw.status, "error");

  const oversizedVisit = JSON.stringify({
    type: "visit",
    path: "/",
    device: "Desktop",
    overflow: "A".repeat(20050),
  });
  assert.ok(oversizedVisit.length > 20000);
  const resVisit = scope.doPost({
    postData: { contents: oversizedVisit },
  });
  assert.equal(resVisit.ok, false);
  assert.equal(resVisit.status, "error");
  assert.equal(sheets.Visitas.getLastRow(), 1);
});

test("POST visit records visitor metadata, sanitizes formulas, and increments quota", () => {
  const { scope, sheets } = runtime();
  const visitPayload = {
    type: "visit",
    timestamp: new Date().toISOString(),
    path: "/",
    device: "Desktop",
    os: "Windows",
    browser: "Chrome",
    resolution: "1920x1080",
    timezone: "America/Sao_Paulo",
    cityRegion: "=CMD|' /C calc'!A0",
    language: "pt-BR",
    utcOffset: "UTC-3",
    channel: "direct",
    referrer: "https://google.com",
  };
  const request = {
    postData: { contents: JSON.stringify(visitPayload) },
  };
  const res = scope.doPost(request);
  assert.equal(res.ok, true);
  assert.equal(sheets.Visitas.getLastRow(), 2);
  assert.equal(sheets.Visitas.rows[1][7].startsWith("'"), true);
});

test("visit integrity: validates 16-column schema, default values, length clamping, and domain parsing", () => {
  const { scope, sheets } = runtime();

  // Test 1: Minimal payload applies proper defaults and outputs exact 16 columns
  const minimalVisit = { type: "visit" };
  const resMin = scope.doPost({
    postData: { contents: JSON.stringify(minimalVisit) },
  });
  assert.equal(resMin.ok, true);
  assert.equal(resMin.status, "success");
  assert.equal(sheets.Visitas.getLastRow(), 2);

  const row1 = sheets.Visitas.rows[1];
  assert.equal(row1.length, 16, "Visit row must contain exactly 16 columns");
  assert.ok(row1[0].length > 0, "timestamp default should be generated");
  assert.equal(row1[1], "/", "default path should be /");
  assert.equal(row1[2], "Desktop", "default device should be Desktop");
  assert.equal(row1[3], "Desconhecido", "default OS should be Desconhecido");
  assert.equal(row1[4], "Desconhecido", "default browser should be Desconhecido");
  assert.equal(row1[5], "Desconhecido", "default resolution should be Desconhecido");
  assert.equal(row1[6], "Desconhecido", "default timezone should be Desconhecido");
  assert.equal(row1[7], "Desconhecido", "default cityRegion should be Desconhecido");
  assert.equal(row1[8], "pt-BR", "default language should be pt-BR");
  assert.equal(row1[9], "UTC", "default utcOffset should be UTC");
  assert.equal(row1[10], "direct", "default channel should be direct");
  assert.equal(row1[11], "", "default referrer should be empty");
  assert.equal(row1[12], "", "default referrerCompleto should be empty");
  assert.equal(row1[13], "", "default utmSource should be empty");
  assert.equal(row1[14], "", "default utmMedium should be empty");
  assert.equal(row1[15], "", "default utmCampaign should be empty");

  // Test 2: Full payload with domain extraction and Portuguese aliases
  const fullVisit = {
    type: "visit",
    timestamp: "2026-11-07T12:00:00.000Z",
    path: "/projects/aethersense/",
    device: "Mobile",
    sistemaOperacional: "Android 15",
    navegador: "Firefox Mobile",
    resolucao: "1080x2400",
    fuso: "America/Belem",
    cidade: "Belem/PA",
    idioma: "pt-BR",
    utcOffset: "UTC-3",
    canal: "referral",
    origem: "https://news.ycombinator.com/item?id=42000000",
    referrerCompleto: "https://news.ycombinator.com/item?id=42000000",
    utmSource: "hackernews",
    utmMedium: "post",
    utmCampaign: "launch",
  };
  const resFull = scope.doPost({
    postData: { contents: JSON.stringify(fullVisit) },
  });
  assert.equal(resFull.ok, true);
  assert.equal(sheets.Visitas.getLastRow(), 3);

  const row2 = sheets.Visitas.rows[2];
  assert.equal(row2[0], "2026-11-07T12:00:00.000Z");
  assert.equal(row2[1], "/projects/aethersense/");
  assert.equal(row2[2], "Mobile");
  assert.equal(row2[3], "Android 15");
  assert.equal(row2[4], "Firefox Mobile");
  assert.equal(row2[5], "1080x2400");
  assert.equal(row2[6], "America/Belem");
  assert.equal(row2[7], "Belem/PA");
  assert.equal(row2[8], "pt-BR");
  assert.equal(row2[9], "UTC-3");
  assert.equal(row2[10], "referral");
  assert.equal(row2[11], "news.ycombinator.com", "domain should be extracted from referrer URL");
  assert.equal(row2[12], "https://news.ycombinator.com/item?id=42000000");
  assert.equal(row2[13], "hackernews");
  assert.equal(row2[14], "post");
  assert.equal(row2[15], "launch");

  // Test 3: String length truncation according to column limits
  const longVisit = {
    type: "visit",
    path: "/" + "p".repeat(200),
    device: "D".repeat(50),
    os: "O".repeat(60),
    browser: "B".repeat(60),
    resolution: "R".repeat(50),
    timezone: "T".repeat(80),
    cityRegion: "C".repeat(80),
    language: "L".repeat(40),
    utcOffset: "U".repeat(40),
    channel: "H".repeat(50),
    referrer: "not-a-url-" + "x".repeat(150),
    referrerCompleto: "https://" + "x".repeat(250),
    utmSource: "S".repeat(100),
    utmMedium: "M".repeat(100),
    utmCampaign: "C".repeat(100),
  };
  const resLong = scope.doPost({
    postData: { contents: JSON.stringify(longVisit) },
  });
  assert.equal(resLong.ok, true);
  const row3 = sheets.Visitas.rows[3];
  assert.ok(row3[1].length <= 100);
  assert.ok(row3[2].length <= 20);
  assert.ok(row3[3].length <= 40);
  assert.ok(row3[4].length <= 40);
  assert.ok(row3[5].length <= 30);
  assert.ok(row3[6].length <= 60);
  assert.ok(row3[7].length <= 60);
  assert.ok(row3[8].length <= 20);
  assert.ok(row3[9].length <= 20);
  assert.ok(row3[10].length <= 30);
  assert.ok(row3[11].length <= 100);
  assert.ok(row3[12].length <= 200);
  assert.ok(row3[13].length <= 60);
  assert.ok(row3[14].length <= 60);
  assert.ok(row3[15].length <= 60);
});

test("visit integrity: sanitizes formula injections across all fields", () => {
  const { scope, sheets } = runtime();
  const injectionVisit = {
    type: "visit",
    timestamp: "=NOW()",
    path: "+/secret",
    device: "-RootDevice",
    os: "@EvilOS",
    browser: "=EvilBrowser",
    resolution: "+1920x1080",
    timezone: "-UTC",
    cityRegion: "=CMD|' /C calc'!A0",
    language: "@pt-BR",
    utcOffset: "+03:00",
    channel: "-direct",
    referrer: "@https://evil.site",
    referrerCompleto: "=https://evil.site/full",
    utmSource: "+evil_source",
    utmMedium: "-evil_medium",
    utmCampaign: "@evil_campaign",
  };
  const res = scope.doPost({
    postData: { contents: JSON.stringify(injectionVisit) },
  });
  assert.equal(res.ok, true);
  const row = sheets.Visitas.rows[1];
  for (let col = 0; col < 16; col++) {
    assert.equal(
      row[col].startsWith("'"),
      true,
      `Column ${col} (${context.VISIT_FIELDS[col]}) must start with quote sanitization, got: ${row[col]}`,
    );
  }
});

test("visit integrity: enforces daily quota limit", () => {
  const { scope, sheets, props } = runtime();
  props.QUOTA_DAY = new Date().toISOString().slice(0, 10);
  props.QUOTA_COUNT = "2000";

  const res = scope.doPost({
    postData: { contents: JSON.stringify({ type: "visit", path: "/" }) },
  });
  assert.equal(res.ok, false);
  assert.equal(res.status, "quota_exceeded");
  assert.equal(sheets.Visitas.getLastRow(), 1);
});

test("visit integrity: auto-creates Visitas sheet if not present", () => {
  const { scope, sheets } = runtime();
  delete sheets.Visitas;

  const res = scope.doPost({
    postData: { contents: JSON.stringify({ type: "visit", path: "/" }) },
  });
  assert.equal(res.ok, true);
  assert.ok(sheets.Visitas, "Visitas sheet must be created dynamically");
  assert.equal(sheets.Visitas.getLastRow(), 2);
  assert.deepEqual(sheets.Visitas.rows[0], Array.from(context.VISIT_FIELDS));
});

test("maintenance purges 180-day events and keeps monthly counts exactly once", () => {
  const { scope, sheets } = runtime();
  const old = event({
    time: new Date(Date.now() - 181 * 86400000).toISOString(),
  });
  const fresh = event();
  const columns = Array.from(context.EVENT_FIELDS);
  sheets.EventsV1.appendRow(columns.map((k) => old[k]));
  sheets.EventsV1.appendRow(columns.map((k) => fresh[k]));
  scope.maintain();
  assert.equal(sheets.EventsV1.getLastRow(), 2);
  assert.equal(sheets.MonthlyV1.getLastRow(), 2);
  assert.equal(sheets.MonthlyV1.rows[1][8], 1);
  scope.maintain();
  assert.equal(sheets.MonthlyV1.rows[1][8], 1);
});

test("maintenance removes monthly totals older than twelve calendar months", () => {
  const { scope, sheets } = runtime();
  sheets.MonthlyV1.rows = [
    [
      "month",
      "event",
      "page",
      "section",
      "element",
      "project",
      "lang",
      "outcome",
      "count",
    ],
    ["2020-01", "click", "/", "home", "hero-projects", "", "pt", "none", 999],
  ];
  scope.maintain();
  assert.equal(sheets.MonthlyV1.getLastRow(), 1);
});

test("maintenance retry after pruning failure does not archive events twice", () => {
  const { scope, sheets } = runtime();
  const old = event({
    time: new Date(Date.now() - 181 * 86400000).toISOString(),
  });
  sheets.EventsV1.appendRow(
    Array.from(context.EVENT_FIELDS).map((key) => old[key]),
  );
  const replace = scope.replaceRows;
  scope.replaceRows = (sheet, rows, width) => {
    if (sheet === sheets.EventsV1)
      throw new Error("simulated spreadsheet outage");
    return replace(sheet, rows, width);
  };
  assert.throws(() => scope.maintain(), /simulated spreadsheet outage/);
  assert.equal(sheets.MonthlyV1.rows[1][8], 1);
  assert.equal(sheets.EventsV1.getLastRow(), 2);
  scope.replaceRows = replace;
  scope.maintain();
  assert.equal(sheets.EventsV1.getLastRow(), 1);
  assert.equal(sheets.MonthlyV1.rows[1][8], 1);
});

test("DEFAULT_CATALOG elements match catalog.json exactly in strict alphabetical order", () => {
  assert.deepEqual([...context.DEFAULT_CATALOG.elements], catalog.elements);
  assert.equal(context.DEFAULT_CATALOG.elements.includes("language-es"), false);
  const required = [
    "contact-schedule",
    "hero-contact",
    "hero-schedule",
    "nav-services",
    "pricing-cta-fixed",
    "pricing-cta-hourly",
    "pricing-cta-retainer",
    "service-proof-apis",
    "service-proof-automation",
    "service-proof-iot",
  ];
  for (const el of required) {
    assert.equal(context.DEFAULT_CATALOG.elements.includes(el), true, `Missing: ${el}`);
  }
  const sorted = [...context.DEFAULT_CATALOG.elements].sort();
  assert.deepEqual([...context.DEFAULT_CATALOG.elements], sorted);
});

test("auto-expansion of rows in recordVisit and doPost when approaching maxRows", () => {
  const { scope, sheets } = runtime();
  sheets.Visitas.maxRows = 1;
  const visitPayload = {
    type: "visit",
    timestamp: new Date().toISOString(),
    path: "/",
    device: "Desktop",
    channel: "direct",
  };
  scope.doPost({ postData: { contents: JSON.stringify(visitPayload) } });
  assert.equal(sheets.Visitas.maxRows >= 501, true);

  sheets.EventsV1.maxRows = 1;
  const e = event();
  scope.doPost({ postData: { contents: JSON.stringify({ version: 1, events: [e] }) } });
  assert.equal(sheets.EventsV1.maxRows >= 501, true);
});

test("setupDashboard counts exclusively contact_result with success and rescues MonthlyV1 history", () => {
  const { scope, sheets } = runtime();
  const book = scope.SpreadsheetApp.getActiveSpreadsheet();

  const columns = Array.from(context.EVENT_FIELDS);
  sheets.EventsV1.appendRow(columns.map((k) => event({
    name: "contact_result",
    outcome: "success",
    element: "contact-submit",
  })[k]));
  sheets.EventsV1.appendRow(columns.map((k) => event({
    name: "contact_result",
    outcome: "error",
    element: "contact-submit",
  })[k]));
  sheets.EventsV1.appendRow(columns.map((k) => event({
    name: "click",
    outcome: "none",
    element: "contact-submit",
  })[k]));
  sheets.EventsV1.appendRow(columns.map((k) => event({
    name: "click",
    outcome: "none",
    element: "cv-download",
  })[k]));

  sheets.MonthlyV1.appendRow([
    "month", "event", "page", "section", "element", "project", "lang", "outcome", "count",
  ]);
  sheets.MonthlyV1.appendRow([
    "2026-01", "contact_result", "/contact/", "contact", "contact-submit", "", "pt", "success", 3,
  ]);
  sheets.MonthlyV1.appendRow([
    "2026-01", "contact_result", "/contact/", "contact", "contact-submit", "", "pt", "error", 2,
  ]);
  sheets.MonthlyV1.appendRow([
    "2026-01", "click", "/", "home", "cv-download", "", "pt", "none", 10,
  ]);
  sheets.MonthlyV1.appendRow([
    "2026-01", "click", "/", "header", "linkedin", "", "pt", "none", 4,
  ]);
  sheets.MonthlyV1.appendRow([
    "2026-01", "click", "/", "footer", "explorer-badge", "", "pt", "none", 2,
  ]);

  scope.setupDashboard(book);

  assert.equal(sheets.Dashboard.rows[3][2], 4);
  assert.equal(sheets.Dashboard.rows[3][1], 11);
  assert.equal(sheets.Dashboard.rows[3][4], 4);
  assert.equal(sheets.Dashboard.rows[3][5], 2);
});

test("setupDashboard supports other traffic channel and adds row outros (Referral / Outros)", () => {
  const { scope, sheets } = runtime();
  const book = scope.SpreadsheetApp.getActiveSpreadsheet();

  sheets.Visitas.appendRow([
    "2026-11-01", "/", "Desktop", "Windows", "Chrome", "1920x1080", "UTC", "SP", "pt-BR", "UTC-3", "social", "",
  ]);
  sheets.Visitas.appendRow([
    "2026-11-01", "/", "Desktop", "Windows", "Chrome", "1920x1080", "UTC", "SP", "pt-BR", "UTC-3", "other", "https://somewebsite.org",
  ]);
  sheets.Visitas.appendRow([
    "2026-11-01", "/", "Desktop", "Windows", "Chrome", "1920x1080", "UTC", "SP", "pt-BR", "UTC-3", "referral", "https://another.com",
  ]);

  scope.setupDashboard(book);

  assert.equal(sheets.Dashboard.rows[3][0], 3);
  assert.equal(sheets.Dashboard.rows[11][2], "outros (Referral / Outros)");
  assert.equal(sheets.Dashboard.rows[11][3], 2);
  assert.equal(sheets.Dashboard.rows[6][3], 1);
});

test("replaceRows shrinks sheet by calling deleteRows when rows count decreases", () => {
  const { scope } = runtime();
  const sheet = new Sheet();
  sheet.appendRow(["header"]);
  sheet.appendRow(["row1"]);
  sheet.appendRow(["row2"]);
  sheet.appendRow(["row3"]);
  assert.equal(sheet.getLastRow(), 4);

  scope.replaceRows(sheet, [["header"], ["row1"]], 1);
  assert.equal(sheet.getLastRow(), 2);
  assert.equal(sheet.rows.length, 2);
});

test("maintenance protects against invalid watermark and does not duplicate archived events", () => {
  const { scope, sheets } = runtime();
  const oldEvent = event({
    time: new Date(Date.now() - 190 * 86400000).toISOString(),
  });
  const columns = Array.from(context.EVENT_FIELDS);
  sheets.EventsV1.appendRow(columns.map((k) => oldEvent[k]));

  sheets.MonthlyV1.appendRow([
    "month", "event", "page", "section", "element", "project", "lang", "outcome", "count", "corrupted-invalid-date",
  ]);
  sheets.MonthlyV1.appendRow([
    "2026-01", "click", "/", "home", "hero-projects", "", "pt", "none", 5,
  ]);

  scope.maintain();

  assert.equal(sheets.MonthlyV1.rows[1][8], 5);
});
