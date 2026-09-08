"use strict";
document.documentElement.classList.add("js");
try {
  const preference = localStorage.getItem("theme");
  document.documentElement.dataset.theme =
    preference === "light" ? "light" : "dark";
} catch {
  /* The default dark theme does not depend on storage. */
}
