"use strict";
(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const track = (name, properties = {}) =>
    window.trackPortfolioEvent?.(name, properties);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let toastTimer;
  const toast = (message) => {
    const box = $(".toast");
    clearTimeout(toastTimer);
    box.textContent = message;
    box.hidden = false;
    toastTimer = setTimeout(() => {
      box.hidden = true;
    }, 4500);
  };
  const theme = $(".theme-toggle");
  theme.hidden = false;
  theme.addEventListener("click", () => {
    const value =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = value;
    try {
      localStorage.setItem("theme", value);
    } catch {
      /* Optional preference. */
    }
    document.dispatchEvent(new Event("portfolio-theme"));
  });
  const menu = $(".menu-toggle");
  const nav = $("#main-nav");
  menu.hidden = false;
  const closeMenu = (returnFocus = false) => {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
    if (returnFocus) menu.focus();
  };
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("open"))
      closeMenu(true);
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) closeMenu();
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.documentElement.classList.add("nav-ready");
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (
      url.origin !== location.origin ||
      url.pathname !== location.pathname ||
      !url.hash
    )
      return;
    let anchor;
    try {
      anchor = decodeURIComponent(url.hash.slice(1));
    } catch {
      return;
    }
    const target = document.getElementById(anchor);
    if (!target) return;
    event.preventDefault();
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: reducedMotion.matches ? "instant" : "smooth",
      block: "start",
    });
    history.pushState(null, "", url.hash);
  });
  const applyFilter = (value) => {
    let count = 0;
    $$(".project-card").forEach((card) => {
      const visible =
        value === "all" || card.dataset.skills.split(" ").includes(value);
      card.hidden = !visible;
      if (visible) count++;
    });
    $$(".filter-button").forEach((button) => {
      const selected = button.dataset.filter === value;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    const status = $("#filter-status");
    if (status)
      status.textContent = count
        ? `${count} ${status.dataset.results}`
        : status.dataset.empty;
  };
  if ($(".filters")) {
    $(".filters").hidden = false;
    $$(".filter-button").forEach((button) =>
      button.addEventListener("click", () =>
        applyFilter(button.dataset.filter),
      ),
    );
  }
  $$("[data-skill]").forEach((link) =>
    link.addEventListener("click", () => applyFilter(link.dataset.skill)),
  );
  const copy = $(".copy-email");
  if (copy) {
    copy.hidden = false;
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copy.dataset.email);
        toast(copy.dataset.success);
        track("copy_result", { outcome: "success" });
      } catch {
        toast(copy.dataset.error);
        track("copy_result", { outcome: "error" });
      }
    });
  }
  const form = $("#contact-form");
  if (form) {
    form.noValidate = true;
    const selection = new URLSearchParams(location.search).get("project");
    if ([...$("#project").options].some((option) => option.value === selection))
      $("#project").value = selection;
    const fields = ["name", "email", "message"].map((id) => $("#" + id));
    const status = $("#form-status");
    const button = form.querySelector("[type=submit]");
    const fallback = $(".form-fallback");
    fields.forEach((field) =>
      field.addEventListener("input", () => {
        field.removeAttribute("aria-invalid");
        $("#" + field.id + "-error").textContent = "";
      }),
    );
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (button.disabled) return;
      let invalid = null;
      for (const field of fields) {
        const blank = !field.value.trim();
        const tooShort =
          field.id === "message" && field.value.trim().length < 3;
        const valid = !blank && !tooShort && field.checkValidity();
        field.setAttribute("aria-invalid", String(!valid));
        $("#" + field.id + "-error").textContent = valid
          ? ""
          : field.validationMessage || form.dataset.invalid;
        if (!valid && !invalid) invalid = field;
      }
      if (invalid) {
        status.textContent = form.dataset.invalid;
        invalid.focus();
        track("contact_result", { outcome: "invalid" });
        return;
      }
      if ($("#website").value) return;
      const original = button.textContent;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.textContent = form.dataset.sending;
      status.textContent = "";
      fallback.hidden = true;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!response.ok) {
          const error = new Error("Contact request failed");
          error.status = response.status;
          throw error;
        }
        form.reset();
        fields.forEach((field) => field.removeAttribute("aria-invalid"));
        status.textContent = form.dataset.success;
        track("contact_result", { outcome: "success" });
      } catch (error) {
        status.textContent =
          error.status === 429 ? form.dataset.rateError : form.dataset.error;
        fallback.hidden = false;
        const body = `${$("#message").value}\n\n${$("#name").value}\n${$("#email").value}`;
        fallback.querySelector("a").href =
          `mailto:${copy.dataset.email}?subject=${encodeURIComponent($("#reason").selectedOptions[0].textContent)}&body=${encodeURIComponent(body)}`;
        track("contact_result", {
          outcome:
            error.name === "AbortError"
              ? "timeout"
              : error.status === 429
                ? "limited"
                : "error",
        });
      } finally {
        clearTimeout(timeout);
        button.disabled = false;
        button.removeAttribute("aria-busy");
        button.textContent = original;
        status.focus({ preventScroll: true });
      }
    });
  }
  const canvas = $("#signal-canvas");
  if (canvas) {
    const context = canvas.getContext("2d");
    const noise = $("#noise");
    const smoothing = $("#smoothing");
    $(".lab-controls").hidden = false;
    let frame;
    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const scale = Math.min(devicePixelRatio || 1, 2);
      canvas.width = width * scale;
      canvas.height = height * scale;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      const amplitude = Number(noise.value);
      const windowSize = Number(smoothing.value);
      const n = 160;
      const clean = Array.from(
        { length: n },
        (_, i) => 0.7 * Math.sin(i * 0.11) + 0.2 * Math.cos(i * 0.23),
      );
      let seed = 739;
      const raw = clean.map((value) => {
        seed = (1664525 * seed + 1013904223) >>> 0;
        return value + amplitude * ((seed / 4294967296) * 2 - 1);
      });
      const filtered = raw.map((_, i) => {
        const start = Math.max(0, i - Math.floor(windowSize / 2));
        const end = Math.min(n, i + Math.floor(windowSize / 2) + 1);
        return raw.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
      });
      const rms = (values) =>
        Math.sqrt(
          values.reduce((sum, v, i) => sum + (v - clean[i]) ** 2, 0) / n,
        ).toFixed(3);
      $("#raw-rms").textContent = rms(raw);
      $("#filtered-rms").textContent = rms(filtered);
      $("#noise-value").value = amplitude.toFixed(2);
      $("#smoothing-value").value = windowSize;
      const css = getComputedStyle(document.documentElement);
      const line = (values, color, lineWidth) => {
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        values.forEach((value, i) => {
          const x = 8 + (i * (width - 16)) / (n - 1);
          const y = height / 2 - value * (height * 0.25);
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();
      };
      context.clearRect(0, 0, width, height);
      context.strokeStyle = css.getPropertyValue("--line");
      context.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        context.beginPath();
        context.moveTo(0, (height * i) / 4);
        context.lineTo(width, (height * i) / 4);
        context.stroke();
      }
      line(raw, css.getPropertyValue("--violet").trim(), 1.2);
      line(filtered, css.getPropertyValue("--cyan").trim(), 2.4);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    [noise, smoothing].forEach((input) =>
      input.addEventListener("input", schedule),
    );
    $(".lab-reset").addEventListener("click", () => {
      noise.value = "0.45";
      smoothing.value = "9";
      draw();
    });
    document.addEventListener("portfolio-theme", draw);
    new ResizeObserver(schedule).observe(canvas);
    draw();
  }
})();
