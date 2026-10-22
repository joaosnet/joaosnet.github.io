const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { randomUUID } = require("node:crypto");
const source = fs.readFileSync("analytics/collector.gs", "utf8");
const catalog = JSON.parse(fs.readFileSync("analytics/catalog.json", "utf8"));
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

class Sheet {
  constructor() {
    this.rows = [];
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
    return 12;
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
    const rIdx = typeof row === "number" ? row : 1;
    const cIdx = typeof col === "number" ? col : 1;
    const numRows = typeof n === "number" ? n : 1;
    const numCols = typeof m === "number" ? m : 1;

    return {
      merge() {
        return this;
      },
      setValue() {
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
