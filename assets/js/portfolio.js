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
  const prefersDarkScheme = matchMedia("(prefers-color-scheme: dark)");
  const handleSystemThemeChange = (e) => {
    try {
      if (localStorage.getItem("theme")) return;
    } catch {
      /* Optional preference. */
    }
    document.documentElement.dataset.theme = e.matches ? "dark" : "light";
    document.dispatchEvent(new Event("portfolio-theme"));
  };
  if (prefersDarkScheme?.addEventListener) {
    prefersDarkScheme.addEventListener("change", handleSystemThemeChange);
  } else if (prefersDarkScheme?.addListener) {
    prefersDarkScheme.addListener(handleSystemThemeChange);
  }
  const paletteToggle = $(".palette-toggle");
  const palettePopover = $("#palette-popover");
  const hueSlider = $("#palette-hue-slider");
  const hueLabel = $("#palette-hue-label");
  const paletteReset = $(".palette-reset");
  if (paletteToggle && palettePopover && hueSlider) {
    paletteToggle.hidden = false;
    const currentHue =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--theme-hue")
        .trim() || "192";
    hueSlider.value = currentHue;
    if (hueLabel) hueLabel.textContent = `${currentHue}° HUE`;

    const setHue = (hue) => {
      document.documentElement.style.setProperty("--theme-hue", hue);
      hueSlider.value = hue;
      if (hueLabel) hueLabel.textContent = `${hue}° HUE`;
      try {
        localStorage.setItem("portfolio-hue", hue);
      } catch {
        /* Storage is optional */
      }
      document.dispatchEvent(new Event("portfolio-theme"));
    };

    paletteToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = paletteToggle.getAttribute("aria-expanded") !== "true";
      paletteToggle.setAttribute("aria-expanded", String(open));
      palettePopover.hidden = !open;
      track("click", { element: "theme-palette" });
    });

    hueSlider.addEventListener("input", () => {
      setHue(hueSlider.value);
    });

    $$(".palette-preset").forEach((preset) => {
      preset.addEventListener("click", () => {
        setHue(preset.dataset.hue);
      });
    });

    paletteReset?.addEventListener("click", () => {
      setHue("192");
      try {
        localStorage.removeItem("portfolio-hue");
      } catch {
        /* Storage is optional */
      }
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".palette-wrapper") && !palettePopover.hidden) {
        palettePopover.hidden = true;
        paletteToggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !palettePopover.hidden) {
        palettePopover.hidden = true;
        paletteToggle.setAttribute("aria-expanded", "false");
        paletteToggle.focus();
      }
    });
  }
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
  const carouselCategories = ["backend", "devices", "data", "interfaces"];
  let carouselIndex = 0;
  let carouselTimer = null;
  let carouselStartTime = 0;
  let carouselRemaining = 7000;
  let carouselPaused = false;
  let carouselDisabled = reducedMotion.matches;
  const projectsSection = $(".projects-section");
  const filtersContainer = $(".filters");

  const restartPillAnimation = (button) => {
    const progress = button?.querySelector(".pill-progress");
    if (progress) {
      progress.style.animation = "none";
      void progress.offsetHeight;
      progress.style.animation = "";
    }
  };

  const startCarouselTimer = (duration = 7000) => {
    if (carouselDisabled) return;
    clearTimeout(carouselTimer);
    carouselRemaining = duration;
    carouselStartTime = Date.now();
    carouselPaused = false;
    filtersContainer?.classList.remove("paused");
    projectsSection?.classList.remove("paused");

    const currentButton = $(
      `[data-filter="${carouselCategories[carouselIndex]}"]`,
    );
    if (currentButton) restartPillAnimation(currentButton);

    carouselTimer = setTimeout(() => {
      carouselIndex = (carouselIndex + 1) % carouselCategories.length;
      applyFilter(carouselCategories[carouselIndex]);
      startCarouselTimer(7000);
    }, duration);
  };

  const pauseCarouselTimer = () => {
    if (carouselDisabled || carouselPaused) return;
    clearTimeout(carouselTimer);
    const elapsed = Date.now() - carouselStartTime;
    carouselRemaining = Math.max(0, carouselRemaining - elapsed);
    carouselPaused = true;
    filtersContainer?.classList.add("paused");
    projectsSection?.classList.add("paused");
  };

  const resumeCarouselTimer = () => {
    if (carouselDisabled || !carouselPaused || carouselRemaining <= 0) return;
    clearTimeout(carouselTimer);
    carouselStartTime = Date.now();
    carouselPaused = false;
    filtersContainer?.classList.remove("paused");
    projectsSection?.classList.remove("paused");

    carouselTimer = setTimeout(() => {
      carouselIndex = (carouselIndex + 1) % carouselCategories.length;
      applyFilter(carouselCategories[carouselIndex]);
      startCarouselTimer(7000);
    }, carouselRemaining);
  };

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

  if (filtersContainer) {
    filtersContainer.hidden = false;
    applyFilter(carouselCategories[0]);
    startCarouselTimer(7000);

    $$(".filter-button").forEach((button) =>
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        if (filter === "all") {
          carouselDisabled = true;
          clearTimeout(carouselTimer);
          filtersContainer?.classList.add("paused");
          projectsSection?.classList.add("paused");
        } else {
          const idx = carouselCategories.indexOf(filter);
          if (idx !== -1) {
            carouselIndex = idx;
            carouselDisabled = reducedMotion.matches;
            startCarouselTimer(7000);
          }
        }
        applyFilter(filter);
      }),
    );

    filtersContainer.addEventListener("mouseenter", pauseCarouselTimer);
    filtersContainer.addEventListener("mouseleave", resumeCarouselTimer);
    filtersContainer.addEventListener("focusin", pauseCarouselTimer);
    filtersContainer.addEventListener("focusout", resumeCarouselTimer);
  }

  $$("[data-skill]").forEach((link) =>
    link.addEventListener("click", () => {
      const skill = link.dataset.skill;
      const idx = carouselCategories.indexOf(skill);
      if (idx !== -1) {
        carouselIndex = idx;
        carouselDisabled = reducedMotion.matches;
        startCarouselTimer(7000);
      }
      applyFilter(skill);
    }),
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

  // --- Minimalist Visitor / Explorer Counter ---
  const visitorBadge = $("#visitor-badge");
  const visitorCountEl = $("#visitor-count");
  if (visitorBadge && visitorCountEl) {
    const currentYear = new Date().getFullYear();
    const countKey = `joaosnet_views_${currentYear}`;
    const sessionKey = `joaosnet_session_counted_${currentYear}`;
    let targetCount = 1;

    try {
      const rawSaved = localStorage.getItem(countKey);
      const savedCount = parseInt(rawSaved || "0", 10);
      // Discard legacy/artificial baseline (>= 1000) from earlier development
      if (savedCount > 0 && savedCount < 1000) {
        targetCount = savedCount;
      } else if (savedCount >= 1000) {
        localStorage.removeItem(countKey);
      }
    } catch {
      /* Storage is optional */
    }

    visitorCountEl.textContent = targetCount.toLocaleString(
      document.body.dataset.lang === "pt" ? "pt-BR" : "en-US",
    );
    visitorBadge.hidden = false;

    const syncRemoteViews = async () => {
      try {
        const scriptUrl =
          "https://script.google.com/macros/s/AKfycbxzLmn6N4YTTDG_e0JvTxagP3NqXRxaoxj22yuNi7GPrAIg9ZhMksw85kORdgCUTgwWdQ/exec";

        // Record new visit via POST if not already counted in this session
        try {
          const isSessionCounted = sessionStorage.getItem(sessionKey);
          const host = window.location.hostname || "";
          const isLocal =
            window.location.protocol === "file:" ||
            host === "localhost" ||
            host === "127.0.0.1";
          if (!isSessionCounted && !isLocal) {
            sessionStorage.setItem(sessionKey, "true");
            const visitData = {
              type: "visit",
              timestamp: new Date().toISOString(),
              path: window.location.pathname + window.location.hash,
              url: window.location.href,
              referrer: document.referrer || "",
              language: navigator.language || "",
              device: /Mobi|Android/i.test(navigator.userAgent)
                ? "Mobile"
                : "Desktop",
              source: "portfolio-client",
            };
            fetch(scriptUrl, {
              method: "POST",
              mode: "no-cors",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify(visitData),
              keepalive: true,
            }).catch(() => {});
          }
        } catch {
          /* Session storage optional */
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(scriptUrl, {
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          const remoteCount = data?.metricas?.totalVisitasRegistradas;
          if (typeof remoteCount === "number" && remoteCount > 0) {
            targetCount = remoteCount;
            try {
              localStorage.setItem(countKey, String(targetCount));
            } catch {
              /* Storage is optional */
            }
            const isPt = document.body.dataset.lang === "pt";
            visitorCountEl.textContent = targetCount.toLocaleString(
              isPt ? "pt-BR" : "en-US",
            );
          }
        }
      } catch {
        /* Remote sync is silent and non-blocking */
      }
    };
    syncRemoteViews();

    const animateCountUp = () => {
      const duration = 800;
      const start = 1;
      const startTime = performance.now();
      const isPt = document.body.dataset.lang === "pt";
      const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (targetCount - start) * ease);
        visitorCountEl.textContent = current.toLocaleString(
          isPt ? "pt-BR" : "en-US",
        );
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          visitorCountEl.textContent = targetCount.toLocaleString(
            isPt ? "pt-BR" : "en-US",
          );
        }
      };
      requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            animateCountUp();
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(visitorBadge);
    } else {
      animateCountUp();
    }
  }

  // Graceful fallback for project images
  $$(".project-card-image").forEach((img) => {
    if (img.complete && img.naturalWidth === 0) {
      img.classList.add("img-fallback");
    } else {
      img.addEventListener("error", () => img.classList.add("img-fallback"));
    }
  });
})();
