const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("node:fs");

test.beforeEach(async ({ page }) => {
  // Never submit a real message or contact the real analytics deployment from tests.
  await page.route("https://formspree.io/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"ok":true}',
    }),
  );
  await page.route("https://script.google.com/**", (route) => route.abort());
});

test("first visit is readable, has no modal, no overflow or JS errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#raw-rms")).not.toHaveText("—");
  await expect(page.locator("h1")).toContainText("vida em código");
  await expect(page.locator("[role=dialog]:visible")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

for (const lang of ["pt", "en"]) {
  test(`${lang} pages have no axe A/AA violations in both themes`, async ({
    page,
  }) => {
    const root = lang === "pt" ? "/" : "/en/";
    for (const route of [
      root,
      root + "projects/aethersense/",
      root + "projects/dmovel/",
      root + "projects/evolutionary-lab/",
      root + "privacy/",
    ]) {
      await page.goto(route);
      for (const theme of ["dark", "light"]) {
        if ((await page.locator("html").getAttribute("data-theme")) !== theme) {
          await page.locator(".theme-toggle").click();
          await page.waitForTimeout(200);
        }
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(
          result.violations,
          JSON.stringify(
            result.violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => ({
                target: n.target,
                summary: n.failureSummary,
              })),
            })),
            null,
            2,
          ),
        ).toEqual([]);
      }
    }
  });
}

test("keyboard skip link moves focus to main and menu closes with Escape", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  if (testInfo.project.name === "mobile") {
    await page.locator(".menu-toggle").click();
    await expect(page.locator("#main-nav")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".menu-toggle")).toBeFocused();
    await expect(page.locator(".menu-toggle")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  }
});

test("filters and skill map select real projects", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-filter=backend]").click();
  await expect(page.locator(".project-card:visible")).toHaveCount(4);
  await expect(page.locator(".project-card:visible h3").first()).toContainText(
    "AetherSense",
  );
  await page.locator("[data-skill=interfaces]").click();
  await expect(page.locator(".project-card:visible")).toHaveCount(4);
  await page.locator("[data-filter=all]").click();
  await expect(page.locator(".project-card:visible")).toHaveCount(9);
});

test("lab computes actual results and reset restores them", async ({
  page,
}) => {
  await page.goto("/");
  const initial = await page.locator("#raw-rms").textContent();
  await page.locator("#noise").fill("0.9");
  await expect(page.locator("#raw-rms")).not.toHaveText(initial);
  const raw = Number(await page.locator("#raw-rms").textContent());
  const smooth = Number(await page.locator("#filtered-rms").textContent());
  expect(smooth).toBeLessThan(raw);
  await page.locator(".lab-reset").click();
  await expect(page.locator("#raw-rms")).toHaveText(initial);
});

test("language switch preserves project and name", async ({ page }) => {
  await page.goto("/projects/dmovel/");
  await page.locator(".language-switch").click();
  await expect(page).toHaveURL(/\/en\/projects\/dmovel\//);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".brand").first()).toContainText("João Silva Neto");
  await expect(page.locator("h1")).toContainText("different screens");
});

test("contact validates, preserves failure, retries, and prevents duplicate submits", async ({
  page,
}) => {
  await page.goto("/?project=aethersense#contact");
  await expect(page.locator("#project")).toHaveValue("aethersense");
  await page.locator(".submit-button").click();
  await expect(page.locator("#name")).toHaveAttribute("aria-invalid", "true");
  await page.locator("#name").fill("Test Visitor");
  await page.locator("#email").fill("test@example.test");
  await page
    .locator("#message")
    .fill("Local browser test; never send to a real service.");
  await page.route("https://formspree.io/**", (route) =>
    route.fulfill({ status: 429, body: "{}" }),
  );
  await page.locator(".submit-button").click();
  await expect(page.locator(".form-fallback")).toBeVisible();
  await expect(page.locator("#message")).toHaveValue(
    "Local browser test; never send to a real service.",
  );
  await expect(page.locator("#form-status")).toContainText(
    "muitas solicitações",
  );
  let calls = 0;
  await page.route("https://formspree.io/**", async (route) => {
    calls++;
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({ status: 200, body: '{"ok":true}' });
  });
  await page.locator(".submit-button").click();
  await expect(page.locator(".submit-button")).toBeDisabled();
  await expect(page.locator("#form-status")).toContainText("Mensagem enviada");
  expect(calls).toBe(1);
  await expect(page.locator("#message")).toHaveValue("");
});

test("contact timeout preserves content and offers explicit fallback", async ({
  page,
}) => {
  await page.goto("/#contact");
  await page.locator("#name").fill("Test");
  await page.locator("#email").fill("test@example.test");
  await page.locator("#message").fill("Timeout test");
  await page.route("https://formspree.io/**", () => new Promise(() => {}));
  await page.locator(".submit-button").click();
  await expect(page.locator(".form-fallback")).toBeVisible({ timeout: 15000 });
  await expect(page.locator("#message")).toHaveValue("Timeout test");
  await expect(page.locator(".submit-button")).toBeEnabled();
});

test("metrics omit PII and disabling stops events across reload", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.captured = [];
    document.addEventListener("portfolio:metric", (event) =>
      window.captured.push(event.detail),
    );
  });
  await page.goto("/?email=must-not-collect@example.test#contact");
  await expect(page.locator(".metrics-notice")).toBeVisible();
  await page.locator("#name").fill("DO NOT COLLECT");
  await page.locator("#email").fill("secret@example.test");
  await page.locator("#message").fill("Private content");
  await page.locator(".theme-toggle").click();
  const events = await page.evaluate(() => window.captured);
  expect(events.some((e) => e.name === "click" && e.element === "theme")).toBe(
    true,
  );
  expect(JSON.stringify(events)).not.toMatch(
    /secret|DO NOT COLLECT|Private content|must-not-collect/,
  );
  expect(
    events.every(
      (e) =>
        Object.keys(e).sort().join(",") ===
        "element,id,lang,modality,name,outcome,page,project,release,section,time,version",
    ),
  ).toBe(true);
  await page.locator(".metrics-notice .metrics-toggle").click();
  const count = await page.evaluate(() => window.captured.length);
  await page.locator(".theme-toggle").click();
  expect(await page.evaluate(() => window.captured.length)).toBe(count);
  await page.reload();
  await expect(page.locator("#metrics-label")).toContainText("desativadas");
  await page.locator(".theme-toggle").click();
  expect(await page.evaluate(() => window.captured.length)).toBe(0);
});

test("all essential content and contact work without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:8765/");
  await expect(page.locator("#main-nav")).toBeVisible();
  await expect(page.locator("#education h2")).toBeVisible();
  await expect(page.locator(".project-card")).toHaveCount(9);
  await expect(page.locator("#contact-form")).toHaveAttribute("method", "post");
  await expect(page.locator("a[download]").first()).toHaveAttribute(
    "href",
    "/docs/crv.pdf",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});

test("transport batches safe events and opt-out discards pending delivery", async ({
  page,
}) => {
  const batches = [];
  // Mirror the builder's CSP for a configured collector; all POSTs stay intercepted.
  await page.route("http://127.0.0.1:8765/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: fs
        .readFileSync("dist/index.html", "utf8")
        .replace(
          "connect-src &#39;self&#39; https://formspree.io",
          "connect-src &#39;self&#39; https://formspree.io https://script.google.com",
        ),
    }),
  );
  await page.route("**/assets/analytics-config.json", async (route) => {
    const config = JSON.parse(
      fs.readFileSync("dist/assets/analytics-config.json", "utf8"),
    );
    config.productionHost = "127.0.0.1";
    config.endpoint = "https://script.google.com/macros/s/TEST_ONLY/exec";
    await route.fulfill({ json: config });
  });
  await page.route(
    "https://script.google.com/macros/s/TEST_ONLY/exec",
    async (route) => {
      batches.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, body: "ok" });
    },
  );
  await page.goto("/");
  await expect(page.locator(".metrics-notice")).toBeVisible();
  await page.evaluate(() => {
    for (let i = 0; i < 19; i++)
      document.querySelector(".theme-toggle").click();
  });
  await expect.poll(() => batches.length).toBe(1);
  expect(batches[0].events).toHaveLength(20);
  expect(new Set(batches[0].events.map((event) => event.id)).size).toBe(20);
  await page.locator(".theme-toggle").click();
  await page.locator(".metrics-notice .metrics-toggle").click();
  await page.waitForTimeout(5200);
  expect(batches).toHaveLength(1);
});

test("missing pages return localized accessible recovery with HTTP 404", async ({
  page,
}) => {
  for (const path of ["/missing-page/", "/en/missing-page/"]) {
    const response = await page.goto(path);
    expect(response.status()).toBe(404);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, follow",
    );
    await page.locator(".not-found .button").click();
    await expect(page.locator(".project-card")).toHaveCount(9);
  }
});

test("reduced motion, denied storage, malformed hash and small screen remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/#%E0%A4%A");
  await expect(page.locator("h1")).toBeVisible();
  await page.locator(".theme-toggle").click();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
