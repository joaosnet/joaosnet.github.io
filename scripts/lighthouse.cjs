/* Use the already-installed Edge/Chromium executable; never download a browser here. */
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const { default: lighthouse } = await import("lighthouse");
  const { launch } = await import("chrome-launcher");
  fs.mkdirSync("artifacts/lighthouse-profile", { recursive: true });
  const chrome = await launch({
    userDataDir: path.resolve("artifacts/lighthouse-profile"),
    chromePath:
      process.env.CHROME_PATH ||
      (process.platform === "win32"
        ? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
        : undefined),
    chromeFlags: ["--headless", "--disable-gpu", "--no-first-run"],
  });
  try {
    fs.mkdirSync("artifacts", { recursive: true });
    const summaries = [];
    for (const route of ["/", "/en/", "/projects/aethersense/"]) {
      const result = await lighthouse("http://127.0.0.1:8765" + route, {
        port: chrome.port,
        output: ["html", "json"],
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
        logLevel: "error",
        formFactor: "mobile",
      });
      const name = route.replaceAll("/", "-") || "home";
      fs.writeFileSync(
        path.join("artifacts", "lighthouse" + name + ".html"),
        result.report[0],
      );
      fs.writeFileSync(
        path.join("artifacts", "lighthouse" + name + ".json"),
        result.report[1],
      );
      const summary = {
        route,
        scores: Object.fromEntries(
          Object.entries(result.lhr.categories).map(([key, value]) => [
            key,
            Math.round(value.score * 100),
          ]),
        ),
        LCP: result.lhr.audits["largest-contentful-paint"].numericValue,
        CLS: result.lhr.audits["cumulative-layout-shift"].numericValue,
      };
      summaries.push(summary);
      console.log(JSON.stringify(summary));
    }
    fs.writeFileSync(
      "artifacts/lighthouse-summary.json",
      JSON.stringify(summaries, null, 2),
    );
    if (
      summaries.some(
        (s) =>
          s.scores.performance < 90 ||
          s.scores.accessibility < 95 ||
          s.scores["best-practices"] < 95 ||
          s.scores.seo < 95,
      )
    )
      process.exitCode = 1;
  } finally {
    await chrome.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
