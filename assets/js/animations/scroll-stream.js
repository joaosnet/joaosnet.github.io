// Featured-project "code stream": WAI-ARIA tabs everywhere, plus a pinned
// scroll-driven mode (vertical scroll walks through the files) when motion is
// allowed and the viewport is wide enough. Without JS the panels stay stacked.
export function init({ motion }) {
  const stream = document.querySelector("[data-stream]");
  if (!stream) return;
  const tablist = stream.querySelector('[role="tablist"]');
  const tabs = [...stream.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((tab) =>
    document.getElementById(tab.getAttribute("aria-controls")),
  );
  const sticky = stream.querySelector(".stream-sticky");
  const hint = stream.querySelector(".stream-hint");
  if (!tabs.length || panels.includes(null)) return;

  let active = 0;
  let pinned = false;
  let frame = 0;

  panels.forEach((panel, index) => {
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tabs[index].id);
    panel.tabIndex = 0;
  });
  tablist.hidden = false;
  if (hint) hint.hidden = false;
  stream.classList.add("is-tabbed");

  const select = (index, { focus = false } = {}) => {
    active = index;
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
    if (focus) tabs[index].focus();
  };

  const scrollRange = () => {
    const top = stream.getBoundingClientRect().top + scrollY;
    const travel = Math.max(1, stream.offsetHeight - sticky.offsetHeight);
    return { top, travel };
  };

  // Keep scroll position and selected tab consistent when tabs are used in pinned mode.
  const scrollToTab = (index) => {
    const { top, travel } = scrollRange();
    scrollTo({ top: top + ((index + 0.5) / tabs.length) * travel, behavior: "smooth" });
  };

  const activate = (index, options) => {
    if (pinned) scrollToTab(index);
    select(index, options);
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(index));
    tab.addEventListener("keydown", (event) => {
      const last = tabs.length - 1;
      const next = {
        ArrowRight: index === last ? 0 : index + 1,
        ArrowDown: index === last ? 0 : index + 1,
        ArrowLeft: index === 0 ? last : index - 1,
        ArrowUp: index === 0 ? last : index - 1,
        Home: 0,
        End: last,
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      activate(next, { focus: true });
    });
  });

  const update = () => {
    frame = 0;
    const { top, travel } = scrollRange();
    const progress = Math.min(1, Math.max(0, (scrollY - top) / travel));
    const scaled = progress * tabs.length;
    const index = Math.min(tabs.length - 1, Math.floor(scaled));
    if (index !== active) select(index);
    const local = Math.min(1, Math.max(0, scaled - index));
    // 0 → trace fully hidden, 1 → fully drawn (pathLength="1").
    stream.style.setProperty("--draw", (1 - Math.min(1, local * 1.6)).toFixed(3));
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  const wide = matchMedia("(min-width: 900px)");
  const setMode = () => {
    const shouldPin = motion === "full" && wide.matches;
    if (shouldPin === pinned) return;
    pinned = shouldPin;
    stream.classList.toggle("is-pinned", pinned);
    stream.style.setProperty("--stream-count", String(tabs.length));
    if (pinned) {
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", onScroll, { passive: true });
      update();
    } else {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      stream.style.removeProperty("--draw");
    }
  };

  select(0);
  setMode();
  wide.addEventListener("change", setMode);
}
