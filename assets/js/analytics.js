"use strict";
/* First-party, event-only metrics. No field values, user/session IDs or URL queries. */
(() => {
  const KEY = "portfolio-metrics-disabled";
  const names = new Set([
    "page_view",
    "click",
    "change",
    "contact_result",
    "copy_result",
  ]);
  const outcomes = new Set([
    "none",
    "success",
    "error",
    "invalid",
    "timeout",
    "limited",
  ]);
  const sections = new Set([
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
  ]);
  let enabled = true;
  try {
    enabled = localStorage.getItem(KEY) !== "true";
  } catch {
    enabled = false;
  }
  let config = null;
  let queue = [];
  let timer = null;
  let lastInput = "keyboard";
  const lang = document.body.dataset.lang === "en" ? "en" : "pt";
  const page = document.body.dataset.page;
  const notice = document.querySelector(".metrics-notice");
  const id = () => {
    // One ID per event, never per person or visit.
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const h = [...bytes].map((n) => n.toString(16).padStart(2, "0")).join("");
    return [
      h.slice(0, 8),
      h.slice(8, 12),
      h.slice(12, 16),
      h.slice(16, 20),
      h.slice(20),
    ].join("-");
  };
  const isLive = () =>
    Boolean(config?.endpoint && location.hostname === config.productionHost);
  const update = () => {
    if (!config) return;
    const t = config.text[lang];
    const message = !enabled
      ? t.metrics_off
      : isLive()
        ? t.metrics_notice
        : t.metrics_preview;
    document.getElementById("metrics-label").textContent = message;
    document.querySelectorAll(".metrics-toggle").forEach((button) => {
      button.hidden = false;
      button.textContent = enabled ? t.disable : t.enable;
      button.setAttribute(
        "aria-label",
        (enabled ? t.disable : t.enable) +
          " · " +
          (lang === "pt" ? "métricas de uso" : "usage metrics"),
      );
      button.setAttribute("aria-pressed", String(enabled));
    });
    const status = document.querySelector(".privacy-status");
    if (status) status.textContent = message;
  };
  const flush = () => {
    clearTimeout(timer);
    timer = null;
    if (!enabled) {
      queue = [];
      return;
    }
    if (!config || !isLive() || !queue.length) return;
    const events = queue.splice(0, 20);
    const body = JSON.stringify({ version: 1, events });
    // Apps Script redirects have no portable CORS acknowledgement. Best effort, no blind retry.
    // Bounded batches remain well below the keepalive payload limit.
    fetch(config.endpoint, {
      method: "POST",
      mode: "no-cors",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body,
      keepalive: true,
    }).catch(() => {});
    if (queue.length) timer = setTimeout(flush, 5000);
  };
  const emit = (name, properties = {}) => {
    if (
      !enabled ||
      !config ||
      !names.has(name) ||
      !config.pageIds.includes(page)
    )
      return;
    const element = config.trackIds.includes(properties.element)
      ? properties.element
      : "content";
    const project = config.projects.includes(properties.project)
      ? properties.project
      : "";
    const section = sections.has(properties.section)
      ? properties.section
      : "page";
    const modality = ["mouse", "touch", "pen", "keyboard", "system"].includes(
      properties.modality,
    )
      ? properties.modality
      : "system";
    const outcome = outcomes.has(properties.outcome)
      ? properties.outcome
      : "none";
    const event = {
      version: 1,
      id: id(),
      name,
      time: new Date().toISOString(),
      page,
      section,
      element,
      project,
      lang,
      modality,
      outcome,
      release: config.release,
    };
    queue.push(event);
    if (queue.length > 100) queue.shift();
    // Preview tests can observe this safe event shape without a deployed collector.
    document.dispatchEvent(
      new CustomEvent("portfolio:metric", { detail: { ...event } }),
    );
    if (queue.length >= 20) flush();
    else if (!timer && isLive()) timer = setTimeout(flush, 5000);
  };
  window.trackPortfolioEvent = emit;
  document.querySelectorAll(".metrics-toggle").forEach((button) =>
    button.addEventListener("click", () => {
      enabled = !enabled;
      queue = [];
      clearTimeout(timer);
      timer = null;
      try {
        localStorage.setItem(KEY, String(!enabled));
      } catch {
        /* The current-page choice still applies. */
      }
      update();
    }),
  );
  document.querySelector(".notice-close").addEventListener("click", () => {
    notice.hidden = true;
  });
  window.addEventListener("storage", (event) => {
    if (event.key === KEY) {
      enabled = event.newValue !== "true";
      if (!enabled) {
        queue = [];
        clearTimeout(timer);
        timer = null;
      }
      update();
    }
  });
  document.addEventListener(
    "pointerdown",
    (event) => {
      lastInput = event.pointerType || "mouse";
    },
    { passive: true },
  );
  document.addEventListener(
    "keydown",
    () => {
      lastInput = "keyboard";
    },
    { passive: true },
  );
  const capture = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (
      !target ||
      target.closest(".metrics-notice, .metrics-toggle, .toast, .honeypot")
    )
      return;
    const tracked = target.closest("[data-track]");
    const field = target.closest("input,textarea,select");
    // Read only identifiers configured at build time, never labels, hrefs, names or values.
    const element =
      tracked?.dataset.track ||
      (field
        ? "form-field"
        : target.closest("a,button")
          ? "unlabelled-control"
          : "content");
    emit(event.type === "change" ? "change" : "click", {
      element,
      project: target.closest("[data-project]")?.dataset.project,
      section:
        target.closest("[data-section]")?.dataset.section ||
        (target.closest("header") ? "header" : "page"),
      modality:
        event.detail === 0 && event.type === "click" ? "keyboard" : lastInput,
    });
  };
  // A single click listener covers mouse, synthesized touch clicks and keyboard activation.
  document.addEventListener("click", capture);
  document.addEventListener("change", capture);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
  fetch("/assets/analytics-config.json", { credentials: "omit" })
    .then((response) => {
      if (!response.ok) throw new Error("Config unavailable");
      return response.json();
    })
    .then((value) => {
      if (
        !Array.isArray(value.pageIds) ||
        !Array.isArray(value.trackIds) ||
        !Array.isArray(value.projects)
      )
        return;
      if (
        value.endpoint &&
        !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(
          value.endpoint,
        )
      )
        return;
      config = value;
      update();
      notice.hidden = false;
      emit("page_view", {
        element: "page",
        section: "page",
        modality: "system",
      });
    })
    .catch(() => {
      enabled = false;
      queue = [];
    });
})();
