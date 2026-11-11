// Hero entrance, drawn with the transitions.dev UI generation runtime (vendor/transitions): the hero's two
// text groups appear as dotted wireframes (outline, boxes, text lines, guides, handles and size labels) and
// the real text is then revealed behind a scan line, as if an agent had just built it.
import { generate } from "./vendor/transitions/ui-generation.js";

const root = document.documentElement;
const overlay = document.querySelector(".hero-overlay");
let runs = [], timer = 0;

const stop = () => {
  runs.forEach((r) => r.cancel());
  clearTimeout(timer);
  runs = [];
  if (overlay) overlay.classList.remove("gen-late");
};

function play() {
  root.classList.remove("gen-wait");   // from here the runtime holds the elements hidden itself
  runs.push(generate(overlay.querySelector(".hero-intro"), { mode: "skeleton", duration: 2600 }));
  runs.push(generate(overlay.querySelector(".hero-base"), { mode: "skeleton", duration: 2600, delay: 320 }));
  // The small hint is not part of either group; it comes in as they are revealed.
  overlay.classList.add("gen-late");
  timer = setTimeout(() => overlay.classList.remove("gen-late"), 2300);
}

if (overlay) {
  // The hero is pinned while the page scrolls and its text drifts up, so a drawing in progress would come apart: end it.
  window.addEventListener("scroll", () => { if (runs.length && window.scrollY > 12) stop(); }, { passive: true });
  // Text lines are measured in the face the page renders, so wait for the fonts; only play at the top of the page.
  const start = () => { if (window.scrollY > 12) { root.classList.remove("gen-wait"); return; } play(); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start, start);
}
