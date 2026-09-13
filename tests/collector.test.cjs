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
  appendRow(row) {
    this.rows.push([...row]);
  }
  clearContents() {
    this.rows = [];
  }
  setFrozenRows() {}
  autoResizeColumns() {}
  getRange(row, col, n, m) {
    const sheet = this;
    return {
      setNumberFormat() {
        return this;
      },
      setValues(values) {
        values.forEach((values, i) => {
          if (!sheet.rows[row - 1 + i]) sheet.rows[row - 1 + i] = [];
          values.forEach((v, j) => (sheet.rows[row - 1 + i][col - 1 + j] = v));
        });
        return this;
      },
      getValues() {
        return Array.from({ length: n }, (_, i) =>
          (sheet.rows[row - 1 + i] || []).slice(col - 1, col - 1 + m),
        );
      },
      createTextFinder(id) {
        return {
          matchEntireCell() {
            return this;
          },
          findNext() {
            return sheet.rows
              .slice(row - 1, row - 1 + n)
              .some((r) => r[col - 1] === id)
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
  };
  sheets.EventsV1.appendRow(Array.from(context.EVENT_FIELDS));
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
      openById: () => ({ getSheetByName: (name) => sheets[name] }),
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
test("GET never returns spreadsheet records or totals", () => {
  const { scope } = runtime();
  assert.deepEqual(Object.keys(scope.doGet()).sort(), [
    "service",
    "status",
    "version",
  ]);
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
  assert.equal(
    sheets.Dashboard.rows.slice(1).reduce((sum, row) => sum + row[6], 0),
    2,
  );
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
  assert.equal(sheets.Dashboard.getLastRow(), 1);
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
