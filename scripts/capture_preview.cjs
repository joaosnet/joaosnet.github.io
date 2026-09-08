const { chromium } = require("@playwright/test");
const fs = require("node:fs");
(async () => {
  fs.mkdirSync("artifacts", { recursive: true });
  const browser = await chromium.launch({
    channel: process.platform === "win32" ? "msedge" : "chromium",
  });
  try {
    const context = await browser.newContext({
      locale: "pt-BR",
      reducedMotion: "reduce",
    });
    await context.route("https://script.google.com/**", (route) =>
      route.abort(),
    );
    await context.route("https://formspree.io/**", (route) => route.abort());
    const page = await context.newPage();
    if (process.argv.includes("--baseline")) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto("https://joaosnet.github.io/");
      await page.waitForTimeout(1800);
      await page.screenshot({
        path: "artifacts/before-desktop.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: "artifacts/before-mobile.png",
        fullPage: true,
      });
    }
    for (const [label, width, height] of [
      ["desktop", 1440, 1000],
      ["mobile", 390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto("http://127.0.0.1:8765/");
      await page.locator("#raw-rms").waitFor();
      await page.waitForTimeout(250);
      await page.screenshot({
        path: `artifacts/after-${label}.png`,
        fullPage: true,
      });
      await page.screenshot({ path: `artifacts/after-${label}-hero.png` });
      await page.locator("#published").scrollIntoViewIfNeeded();
      await page.screenshot({ path: `artifacts/after-${label}-lab.png` });
      await page.locator(".theme-toggle").click();
      await page.evaluate(() => {
        document.activeElement.blur();
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(150);
      await page.screenshot({
        path: `artifacts/after-${label}-light.png`,
        fullPage: true,
      });
      await page.locator(".theme-toggle").click();
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("http://127.0.0.1:8765/en/");
    await page.screenshot({
      path: "artifacts/after-english.png",
      fullPage: true,
    });
    await page.goto("http://127.0.0.1:8765/projects/aethersense/");
    await page.screenshot({
      path: "artifacts/after-case-study.png",
      fullPage: true,
    });
    console.log(
      "Saved desktop/mobile, light/dark, English and case-study screenshots in artifacts/",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
