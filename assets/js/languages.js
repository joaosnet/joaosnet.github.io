"use strict";
(() => {
  const key = "portfolio-language";
  const source = document.body.dataset.lang || "pt";
  const picker = document.getElementById("site-language");
  const status = document.getElementById("translation-status");
  if (!picker) return;
  const supported = new Set(
    "af sq am ar hy az eu be bn bs bg ca ceb ny zh-CN zh-TW co hr cs da nl en eo et tl fi fr fy gl ka de el gu ht ha haw iw hi hmn hu is ig id ga it ja jw kn kk km ko ku ky lo la lv lt lb mk mg ms ml mt mi mr mn my ne no ps fa pl pt pa ro ru sm gd sr st sn sd si sk sl so es su sw sv tg ta te th tr uk ur uz vi cy xh yi yo zu".split(
      " ",
    ),
  );
  const normalize = (value) => {
    const code = String(value).replaceAll("_", "-").toLowerCase();
    if (/^zh-(tw|hk|hant)/.test(code)) return "zh-TW";
    if (code.startsWith("zh")) return "zh-CN";
    if (code.startsWith("he")) return "iw";
    const base = code.split("-")[0];
    return supported.has(base) ? base : null;
  };
  const read = () => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const save = (value) => {
    try {
      localStorage.setItem(key, value);
      localStorage.removeItem("__GT_TRANSLATE_LANGS");
    } catch {
      /* Preference is optional. */
    }
  };
  let desired =
    normalize(read() || navigator.languages?.[0] || navigator.language) ||
    source;
  // Explicit English URLs keep their reviewed English copy unless a machine language was chosen.
  if (location.pathname.startsWith("/en/") && ["pt", "en"].includes(desired))
    desired = "en";
  const native = (language) => {
    save(language);
    let path = location.pathname.replace(/^\/en(?:\/|$)/, "/");
    if (!path.startsWith("/")) path = "/" + path;
    const target =
      language === "en" ? "/en" + (path === "/" ? "/" : path) : path;
    const targetUrl = target + location.search + location.hash;
    if (location.pathname === target) {
      location.reload();
    } else {
      location.assign(targetUrl);
    }
  };
  document
    .querySelectorAll(".language-switch")
    .forEach((link) =>
      link.addEventListener("click", () => save(source === "pt" ? "en" : "pt")),
    );
  let names;
  try {
    names = new Intl.DisplayNames([source], { type: "language" });
  } catch {
    /* Codes are valid fallback labels. */
  }
  const machineGroup =
    picker.querySelector("optgroup[data-machine]") || picker;
  const formatName = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
  [...supported]
    .filter((code) => !["pt", "en"].includes(code))
    .sort((a, b) => (names?.of(a) || a).localeCompare(names?.of(b) || b))
    .forEach((code) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = formatName(names?.of(code) || code);
      machineGroup.append(option);
    });
  picker.hidden = false;
  picker.value = desired;
  const updateStatus = () => {
    if (!status) return;
    if (desired === "pt") {
      status.textContent =
        source === "pt"
          ? "Versão nativa (revisada)"
          : "Native version (reviewed)";
    } else if (desired === "en") {
      status.textContent =
        source === "pt"
          ? "Versão nativa (revisada)"
          : "Native version (reviewed)";
    }
  };
  if (["pt", "en"].includes(desired)) {
    updateStatus();
  }
  // Never let the translation engine inspect editable/contact content.
  document
    .querySelectorAll(
      "form,input,textarea,[contenteditable],.brand,.portrait-frame",
    )
    .forEach((element) => {
      element.classList.add("notranslate");
      element.setAttribute("translate", "no");
    });
  let library;
  const load = () =>
    (library ||= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.gtranslate.net/widgets/latest/lib.min.js";
      // REMOVED script.integrity and script.crossOrigin to prevent CORS / SRI failures on cdn.gtranslate.net
      const timeout = setTimeout(
        () => reject(new Error("Translator timeout")),
        12000,
      );
      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Translator unavailable"));
      };
      script.onload = () => {
        const engine = window.__GT?.translator;
        if (!engine) {
          clearTimeout(timeout);
          reject(new Error("Translator unavailable"));
          return;
        }
        const ready = () => {
          clearTimeout(timeout);
          resolve(engine);
        };
        if (engine.libReady) ready();
        else engine.readyCallback = ready;
      };
      document.head.append(script);
    }));
  let revision = 0;
  const translate = async (language) => {
    const current = ++revision;
    status.textContent =
      source === "pt"
        ? "Traduzindo automaticamente…"
        : "Translating automatically…";
    try {
      const engine = await load();
      if (current !== revision) return;
      const timer = setTimeout(() => {
        if (current === revision)
          status.textContent =
            "Translation unavailable. Português / English remain available.";
      }, 20000);
      engine.resultCallback = () => {
        clearTimeout(timer);
        if (current !== revision) return;
        status.textContent = engine.error
          ? "Translation unavailable. Português / English remain available."
          : "Auto · GTranslate / Google";
        if (!engine.error) {
          document.documentElement.lang = language;
          document.documentElement.dir = [
            "ar",
            "fa",
            "iw",
            "ur",
            "ps",
            "sd",
            "yi",
          ].includes(language)
            ? "rtl"
            : "ltr";
        }
      };
      engine.translate(source, language);
    } catch {
      if (current === revision)
        status.textContent =
          "Translation unavailable. Português / English remain available.";
    }
  };
  picker.addEventListener("change", () => {
    desired = picker.value;
    if (["pt", "en"].includes(desired)) {
      native(desired);
    } else {
      save(desired);
      const engine = window.__GT?.translator;
      if (engine && engine.finished) {
        try {
          engine.revert();
        } catch {
          location.reload();
          return;
        }
      }
      translate(desired);
    }
  });
  if (!["pt", "en"].includes(desired)) translate(desired);
})();
