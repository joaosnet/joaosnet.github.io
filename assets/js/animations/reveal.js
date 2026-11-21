// Reveals [data-reveal] blocks as they enter the viewport. The markup is fully
// visible without this module: nothing is hidden until `reveal-ready` is set,
// and that only happens after the blocks already on screen are marked.
export function init({ motion } = {}) {
  const items = [...document.querySelectorAll("[data-reveal]")];
  if (motion !== "full" || !("IntersectionObserver" in window) || !items.length)
    return;

  const pending = [];
  for (const item of items) {
    // On screen or already scrolled past: show at once, without animation.
    if (item.getBoundingClientRect().top < window.innerHeight)
      item.classList.add("is-revealed", "is-instant");
    else pending.push(item);
  }
  document.documentElement.classList.add("reveal-ready");

  const observer = new IntersectionObserver(
    (entries) => {
      let order = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.style.setProperty("--reveal-i", String(order++));
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  pending.forEach((item) => observer.observe(item));
}
