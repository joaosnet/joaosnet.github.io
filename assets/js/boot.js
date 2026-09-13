"use strict";
document.documentElement.classList.add("js");
// Native translations are preferred; an explicit choice always wins on entry URLs.
try {
  const saved = localStorage.getItem("portfolio-language");
  const isRootPt =
    location.pathname === "/" || location.pathname === "/index.html";
  const isRootEn =
    location.pathname === "/en/" ||
    location.pathname === "/en" ||
    location.pathname === "/en/index.html";

  if (!saved) {
    const navLang = (
      (navigator.languages && navigator.languages[0]) ||
      navigator.language ||
      ""
    ).toLowerCase();
    if (navLang.startsWith("en") && isRootPt) {
      location.replace("/en/" + location.search + location.hash);
    } else if (navLang.startsWith("pt") && isRootEn) {
      location.replace("/" + location.search + location.hash);
    }
  } else if (saved === "en" && isRootPt) {
    location.replace("/en/" + location.search + location.hash);
  } else if (saved === "pt" && isRootEn) {
    location.replace("/" + location.search + location.hash);
  }
} catch {
  // Storage is optional; the page and manual selector remain available.
}
try {
  const preference = localStorage.getItem("theme");
  if (preference === "light" || preference === "dark") {
    document.documentElement.dataset.theme = preference;
  } else {
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
  }
} catch {
  try {
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
  } catch {
    /* The default dark theme does not depend on storage. */
  }
}
try {
  const savedHue = localStorage.getItem("portfolio-hue");
  if (savedHue && !isNaN(Number(savedHue))) {
    document.documentElement.style.setProperty("--theme-hue", savedHue);
  }
} catch {
  /* Default hue does not depend on storage. */
}
