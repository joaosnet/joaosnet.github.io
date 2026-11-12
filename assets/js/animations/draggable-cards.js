// Credential stack: drag the top card away (spring physics) or use the
// Previous/Next buttons and arrow keys. Without JS the cards are a plain list.
const STIFFNESS = 0.0009; // spring constant per ms²
const DAMPING = 0.028; // velocity damping per ms
const THROW_DISTANCE = 0.32; // fraction of card width
const THROW_VELOCITY = 0.55; // px per ms

export function init({ motion }) {
  const stack = document.querySelector("[data-stack]");
  if (!stack) return;
  const cards = [...stack.querySelectorAll(".stack-card")];
  if (cards.length < 2) return;
  const controls = stack.querySelector(".stack-controls");
  const status = stack.querySelector(".stack-status");
  const hint = stack.closest(".stack-container")?.querySelector(".stack-hint");
  const animate = motion === "full";
  const total = cards.length;
  let current = 0;

  stack.classList.add("is-stacked");
  controls.hidden = false;
  if (hint) hint.hidden = false;
  cards.forEach((card) => card.setAttribute("aria-roledescription", "slide"));

  const announce = () => {
    status.textContent = (status.dataset.template || "{current} / {total}")
      .replace("{current}", String(current + 1))
      .replace("{total}", String(total));
  };

  const layout = () => {
    cards.forEach((card, i) => {
      const depth = (i - current + total) % total;
      card.style.setProperty("--depth", String(depth));
      card.style.zIndex = String(total - depth);
      card.inert = depth !== 0;
      card.classList.toggle("is-top", depth === 0);
    });
    announce();
  };

  const go = (step) => {
    current = (current + step + total) % total;
    layout();
  };

  // Recycle the thrown card to the back without sliding it across the screen.
  const recycle = (card, step) => {
    card.classList.add("is-recycling");
    card.style.removeProperty("transform");
    go(step);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => card.classList.remove("is-recycling")),
    );
  };

  stack.querySelector("[data-stack-prev]").addEventListener("click", () => go(-1));
  stack.querySelector("[data-stack-next]").addEventListener("click", () => go(1));
  stack.addEventListener("keydown", (event) => {
    if (event.target.closest("input, textarea, select")) return;
    if (event.key === "ArrowRight") go(1);
    else if (event.key === "ArrowLeft") go(-1);
    else return;
    event.preventDefault();
  });

  // Spring simulation for release: either back to rest or off-screen.
  const spring = (card, state, targetX, done) => {
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(32, now - last);
      last = now;
      state.vx += ((targetX - state.x) * STIFFNESS - state.vx * DAMPING) * dt;
      state.vy += ((0 - state.y) * STIFFNESS - state.vy * DAMPING) * dt;
      state.x += state.vx * dt;
      state.y += state.vy * dt;
      const rotate = state.x * 0.04 + state.vx * 4;
      card.style.transform = `translate(${state.x}px, ${state.y}px) rotate(${rotate}deg)`;
      const settled =
        Math.abs(targetX - state.x) < 0.5 &&
        Math.abs(state.y) < 0.5 &&
        Math.abs(state.vx) < 0.01;
      const gone = targetX !== 0 && Math.abs(state.x) > Math.abs(targetX) * 0.9;
      if (settled || gone) done();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  let drag = null;
  stack.addEventListener("pointerdown", (event) => {
    const card = event.target.closest(".stack-card.is-top");
    if (!card || !animate || event.button !== 0) return;
    if (event.target.closest("a, button, input, textarea, select, code")) return;
    drag = {
      card,
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      time: performance.now(),
    };
    card.setPointerCapture(event.pointerId);
    card.classList.add("is-dragging");
  });
  stack.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const now = performance.now();
    const dt = Math.max(1, now - drag.time);
    const x = event.clientX - drag.startX;
    const y = (event.clientY - drag.startY) * 0.35;
    // Exponential smoothing keeps the release velocity stable on noisy input.
    drag.vx = drag.vx * 0.6 + ((x - drag.x) / dt) * 0.4;
    drag.vy = drag.vy * 0.6 + ((y - drag.y) / dt) * 0.4;
    drag.x = x;
    drag.y = y;
    drag.time = now;
    drag.card.style.transform = `translate(${x}px, ${y}px) rotate(${x * 0.04 + drag.vx * 4}deg)`;
  });
  const release = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const { card } = drag;
    const state = { x: drag.x, y: drag.y, vx: drag.vx, vy: drag.vy };
    drag = null;
    const width = card.offsetWidth;
    const thrown =
      Math.abs(state.x) > width * THROW_DISTANCE ||
      Math.abs(state.vx) > THROW_VELOCITY;
    if (thrown) {
      const direction = Math.sign(state.x || state.vx);
      state.vx = direction * Math.max(Math.abs(state.vx), 1.2);
      spring(card, state, direction * width * 1.6, () => {
        card.classList.remove("is-dragging");
        recycle(card, 1);
      });
    } else {
      spring(card, state, 0, () => {
        card.classList.remove("is-dragging");
        card.style.removeProperty("transform");
      });
    }
  };
  stack.addEventListener("pointerup", release);
  stack.addEventListener("pointercancel", release);

  layout();
}
