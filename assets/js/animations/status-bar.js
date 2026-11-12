// Live clock (Belém, UTC−3) and measured render time for the status bar.
export function init() {
  const clock = document.querySelector("[data-status-clock]");
  const render = document.querySelector("[data-status-render]");

  if (render) {
    const report = () => {
      const [navigation] = performance.getEntriesByType("navigation");
      const ms = navigation?.domContentLoadedEventEnd;
      if (ms > 0) render.textContent = `${Math.round(ms)}ms`;
    };
    if (document.readyState === "complete") report();
    else addEventListener("load", report, { once: true });
  }

  if (!clock) return;
  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Belem",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  let timer = 0;
  const tick = () => {
    clock.textContent = format.format(new Date());
    // Re-align to the next wall-clock second instead of drifting with setInterval.
    timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  };
  document.addEventListener("visibilitychange", () => {
    clearTimeout(timer);
    if (!document.hidden) tick();
  });
  tick();
}
