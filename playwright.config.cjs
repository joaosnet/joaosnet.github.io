const { defineConfig } = require("@playwright/test");
const path = require("node:path");
module.exports = defineConfig({
  testDir: "./tests/browser",
  timeout: 30000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "artifacts/browser-results.json" }],
  ],
  use: {
    locale: "pt-BR",
    baseURL: "http://127.0.0.1:8765",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    channel: process.platform === "win32" ? "msedge" : "chromium",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command:
      (process.platform === "win32"
        ? '"' + path.resolve(".venv/Scripts/python.exe") + '"'
        : "python") + " scripts/preview.py --port 8765",
    url: "http://127.0.0.1:8765",
    reuseExistingServer: !process.env.CI,
    timeout: 20000,
  },
});
