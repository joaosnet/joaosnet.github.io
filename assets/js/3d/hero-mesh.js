// Hero "topology mesh": a PCB-like bus drawn on a 2D canvas behind the portrait.
// The geometry is read from the static SVG poster in the template, so the poster
// (no-JS / reduced-motion fallback) and the animation can never drift apart.
const VIEW = 400;
const PULSE_SPEED = 0.00022; // fraction of a trace per ms
const AMBIENT_EVERY = 1400; // ms between ambient pulses
const HOVER_RADIUS = 34; // in view units

const parsePoints = (value) =>
  value
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(",").map(Number));

const buildTrace = (points) => {
  const segments = [];
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    const size = Math.hypot(x2 - x1, y2 - y1);
    segments.push({ x1, y1, x2, y2, start: length, size });
    length += size;
  }
  return { points, segments, length };
};

const pointAt = (trace, t) => {
  const target = t * trace.length;
  const segment =
    trace.segments.find((s) => target <= s.start + s.size) ||
    trace.segments[trace.segments.length - 1];
  const local = segment.size ? (target - segment.start) / segment.size : 0;
  return [
    segment.x1 + (segment.x2 - segment.x1) * local,
    segment.y1 + (segment.y2 - segment.y1) * local,
  ];
};

export function init({ host }) {
  const frame = host?.querySelector(".portrait-frame");
  const poster = frame?.querySelector(".hero-mesh-poster");
  if (!frame || !poster) return;

  const traces = [...poster.querySelectorAll("[data-mesh-trace]")].map((el) =>
    buildTrace(parsePoints(el.getAttribute("points"))),
  );
  const nodes = [...poster.querySelectorAll("[data-mesh-node]")].map((el) => [
    Number(el.getAttribute("cx")),
    Number(el.getAttribute("cy")),
  ]);
  if (!traces.length) return;

  const canvas = document.createElement("canvas");
  canvas.className = "hero-mesh-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  frame.prepend(canvas);
  frame.classList.add("has-mesh");

  const root = document.documentElement;
  let colors = {};
  const readColors = () => {
    const style = getComputedStyle(root);
    colors = {
      line: style.getPropertyValue("--line").trim(),
      cyan: style.getPropertyValue("--cyan").trim(),
      violet: style.getPropertyValue("--violet").trim(),
      surface: style.getPropertyValue("--surface").trim(),
    };
  };
  readColors();
  // Theme toggle and hue picker both mutate attributes on <html>.
  new MutationObserver(readColors).observe(root, {
    attributes: true,
    attributeFilter: ["data-theme", "style"],
  });

  let width = 0;
  let height = 0;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  const resize = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    width = frame.clientWidth;
    height = frame.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    scale = Math.min(width, height) / VIEW;
    offsetX = (width - VIEW * scale) / 2;
    offsetY = (height - VIEW * scale) / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  new ResizeObserver(resize).observe(frame);

  // Parallax: target follows the pointer, current eases toward it (lerp).
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, vx: -999, vy: -999 };
  host.addEventListener("pointermove", (event) => {
    const rect = frame.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    pointer.tx = Math.max(-0.5, Math.min(0.5, nx));
    pointer.ty = Math.max(-0.5, Math.min(0.5, ny));
    pointer.vx = (event.clientX - rect.left - offsetX) / scale;
    pointer.vy = (event.clientY - rect.top - offsetY) / scale;
  });
  host.addEventListener("pointerleave", () => {
    pointer.tx = 0;
    pointer.ty = 0;
    pointer.vx = -999;
    pointer.vy = -999;
  });

  const pulses = [];
  const touches = (trace, [x, y]) =>
    trace.points.some(([px, py]) => px === x && py === y);
  const spawn = (trace, reverse = false) => {
    if (pulses.length < 24) pulses.push({ trace, t: 0, reverse });
  };
  let hovered = -1;
  let lastAmbient = 0;

  const draw = (now, dt) => {
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 0.006);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 0.006);
    const shift = 14 * scale;
    const tx = offsetX + pointer.x * shift;
    const ty = offsetY + pointer.y * shift;
    const nodeShift = 1.6; // nodes float slightly above the traces

    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";

    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const trace of traces) {
      trace.points.forEach(([x, y], i) => {
        const px = tx + x * scale;
        const py = ty + y * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
    }
    ctx.stroke();

    // Hover: entering a node's radius fires pulses along every trace it touches.
    const nearest = nodes.findIndex(
      ([x, y]) => Math.hypot(pointer.vx - x, pointer.vy - y) < HOVER_RADIUS,
    );
    if (nearest !== hovered) {
      hovered = nearest;
      if (nearest >= 0) {
        const node = nodes[nearest];
        traces.forEach((trace) => {
          if (touches(trace, node)) {
            const [ex, ey] = trace.points[trace.points.length - 1];
            spawn(trace, ex === node[0] && ey === node[1]);
          }
        });
      }
    }
    if (now - lastAmbient > AMBIENT_EVERY) {
      lastAmbient = now;
      spawn(traces[Math.floor(Math.random() * traces.length)], Math.random() < 0.5);
    }

    for (let i = pulses.length - 1; i >= 0; i -= 1) {
      const pulse = pulses[i];
      pulse.t += (dt * PULSE_SPEED * VIEW) / pulse.trace.length;
      if (pulse.t >= 1) {
        pulses.splice(i, 1);
        continue;
      }
      const head = pulse.reverse ? 1 - pulse.t : pulse.t;
      const tail = pulse.reverse
        ? Math.min(1, head + 40 / pulse.trace.length)
        : Math.max(0, head - 40 / pulse.trace.length);
      const [hx, hy] = pointAt(pulse.trace, head);
      const [sx, sy] = pointAt(pulse.trace, tail);
      const gradient = ctx.createLinearGradient(
        tx + sx * scale,
        ty + sy * scale,
        tx + hx * scale,
        ty + hy * scale,
      );
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(1, colors.cyan);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tx + sx * scale, ty + sy * scale);
      ctx.lineTo(tx + hx * scale, ty + hy * scale);
      ctx.stroke();
    }

    nodes.forEach(([x, y], i) => {
      const px = tx + pointer.x * shift * (nodeShift - 1) + x * scale;
      const py = ty + pointer.y * shift * (nodeShift - 1) + y * scale;
      ctx.beginPath();
      ctx.arc(px, py, (i === hovered ? 5 : 3.5) * scale, 0, Math.PI * 2);
      ctx.fillStyle = colors.surface;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = i === hovered ? colors.cyan : colors.violet;
      ctx.stroke();
    });
  };

  let running = false;
  let visible = true;
  let raf = 0;
  let last = 0;
  const loop = (now) => {
    const dt = Math.min(64, now - (last || now));
    last = now;
    draw(now, dt);
    raf = requestAnimationFrame(loop);
  };
  const sync = () => {
    const shouldRun = visible && !document.hidden;
    if (shouldRun === running) return;
    running = shouldRun;
    if (running) {
      last = 0;
      raf = requestAnimationFrame(loop);
    } else cancelAnimationFrame(raf);
  };
  new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    sync();
  }).observe(frame);
  document.addEventListener("visibilitychange", sync);
  sync();
}
