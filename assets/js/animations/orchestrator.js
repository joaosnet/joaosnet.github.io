// Progressive enhancement entry point. The static HTML is complete without it;
// each module only upgrades markup that already works on its own.
const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const connection = navigator.connection;
const constrained =
  Boolean(connection?.saveData) ||
  /(^|-)2g$/.test(connection?.effectiveType || "") ||
  (navigator.hardwareConcurrency || 4) <= 2;
const motion = reducedMotion || constrained ? "reduced" : "full";
root.dataset.motion = motion;

const load = (path, options) =>
  import(path)
    .then((module) => module.init?.(options))
    .catch(() => {
      /* Enhancement failed; the static layout stays fully usable. */
    });

const context = { motion };
load("./status-bar.js", context);
if (document.querySelector("[data-stream]")) load("./scroll-stream.js", context);
if (document.querySelector("[data-stack]")) load("./draggable-cards.js", context);

const heroArt = document.querySelector("[data-hero-mesh]");
if (heroArt && motion === "full" && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      load("../3d/hero-mesh.js", { ...context, host: heroArt });
    }
  });
  observer.observe(heroArt);
}
