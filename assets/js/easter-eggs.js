"use strict";
(() => {
  const dialog = document.getElementById("secret-dialog");
  const trigger = document.getElementById("secret-terminal");
  const badge = document.getElementById("explorer-badge");
  if (!dialog || !trigger) return;
  trigger.hidden = false;
  let previousFocus;
  const open = () => {
    if (dialog.open) return;
    previousFocus = document.activeElement;
    dialog.showModal();
  };
  trigger.addEventListener("click", open);
  dialog.addEventListener("close", () =>
    previousFocus?.focus({ preventScroll: true }),
  );
  const sequence = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];
  let index = 0;
  let last = 0;
  document.addEventListener("keydown", (event) => {
    if (
      event.target.closest("input,textarea,select,[contenteditable=true]") ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.repeat
    )
      return;
    if (Date.now() - last > 4000) index = 0;
    last = Date.now();
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    index = key === sequence[index] ? index + 1 : key === sequence[0] ? 1 : 0;
    if (index === sequence.length) {
      index = 0;
      open();
    }
  });
  let signalFound = false;
  const revealSignal = () => {
    if (
      signalFound ||
      document.getElementById("noise")?.value !== "0" ||
      document.getElementById("smoothing")?.value !== "1"
    )
      return;
    signalFound = true;
    const note = document.createElement("p");
    note.className = "signal-secret";
    note.setAttribute("role", "status");
    note.textContent =
      document.body.dataset.lang === "pt"
        ? "✦ Sinal puro encontrado. Às vezes, a melhor solução é remover o que atrapalha."
        : "✦ Pure signal found. Sometimes the best solution is removing what gets in the way.";
    document.querySelector(".lab-info").append(note);
  };
  document.getElementById("noise")?.addEventListener("input", revealSignal);
  document.getElementById("smoothing")?.addEventListener("input", revealSignal);
  const sections = [...document.querySelectorAll("main > section[id]")];
  if (sections.length && "IntersectionObserver" in window) {
    const visited = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visited.add(entry.target.id);
      });
      if (visited.size === sections.length) {
        badge.hidden = false;
        observer.disconnect();
      }
    });
    sections.forEach((section) => observer.observe(section));
  }
  badge.addEventListener("click", () => {
    document.documentElement.classList.add("celebrating");
    setTimeout(
      () => document.documentElement.classList.remove("celebrating"),
      2400,
    );
    open();
  });
})();
