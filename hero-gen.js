// Hero "generation" entrance, drawn with the transitions.dev UI generation runtime (vendor/transitions):
// the hero's type and layout appear as if an agent were drawing them, then hand over to the real thing.
// Four options, picked with ?hero=a|b|c|d (or off). Adding ?hero=… also shows a small switcher.
import { generate } from "./vendor/transitions/ui-generation.js";

const root = document.documentElement;
const overlay = document.querySelector(".hero-overlay");
const title = overlay && overlay.querySelector(".hero-title");
const label = overlay && overlay.querySelector(".hero-label");
const blurb = overlay && overlay.querySelector(".hero-blurb");

const OPTIONS = {
  a: "Traced type",
  b: "Technical",
  c: "Wireframe",
  d: "Agent log",
  off: "Off",
};
const DEFAULT = "a";
const asked = new URLSearchParams(location.search).get("hero");
let current = asked in OPTIONS ? asked : DEFAULT;
let runs = [], timers = [];

const stop = () => {
  runs.forEach((r) => r.cancel());
  timers.forEach(clearTimeout);
  runs = []; timers = [];
  overlay.classList.remove("gen-late");
};
// The buttons and the hint are not drawn by the type options; they fade in once the headline is mostly there.
const late = (ms) => { overlay.classList.add("gen-late"); timers.push(setTimeout(() => overlay.classList.remove("gen-late"), ms)); };

function play(key) {
  stop();
  root.classList.remove("gen-wait");   // from here the runtime holds the elements hidden itself
  if (key === "off" || !title) return;
  const inside = { parent: overlay };  // the drawing lives in the pinned layer, so it stays with the hero
  const quick = { fadeStagger: null };  // small text inks as its dotted line passes, so a paragraph does not take ten seconds
  if (key === "a" || key === "b") {
    const tech = key === "b";
    runs.push(generate(label, { variant: "small-text", duration: 1200, ...quick, ...inside }));
    runs.push(generate(title, { variant: "text", duration: 3400, delay: 150, fadeStagger: 50, guides: tech, focus: tech, readout: tech, ...inside }));
    runs.push(generate(blurb, { variant: "small-text", duration: 1900, delay: 1500, ...quick, ...inside }));
    late(2600);
  } else if (key === "c") {
    // The two text groups as dotted wireframes: outline, boxes, text lines, guides and size labels, then a scan-line reveal.
    runs.push(generate(overlay.querySelector(".hero-intro"), { mode: "skeleton", duration: 2600 }));
    runs.push(generate(overlay.querySelector(".hero-base"), { mode: "skeleton", duration: 2600, delay: 320 }));
  } else if (key === "d") {
    // Traced type plus the agent's log and step line. The runtime only writes them where the page is empty and
    // tests that with the pointer, so the layer has to take the pointer while it measures.
    overlay.style.pointerEvents = "auto";
    timers.push(setTimeout(() => { overlay.style.pointerEvents = ""; }, 500));
    runs.push(generate(label, { variant: "small-text", duration: 1200, ...quick, ...inside }));
    runs.push(generate(title, {
      variant: "text", mode: "skeleton-texts", duration: 3400, delay: 150, fadeStagger: 50, focus: true,
      steps: ["Reading the brief", "Setting type", "Tracing glyphs", "Inking"], done: "Hero ready", ...inside,
    }));
    runs.push(generate(blurb, { variant: "small-text", duration: 1900, delay: 1500, ...quick, ...inside }));
    late(2600);
  }
}

// The hero is pinned while the page scrolls, and its text drifts up: a drawing in progress would come apart, so end it.
window.addEventListener("scroll", () => { if (runs.length && window.scrollY > 12) stop(); }, { passive: true });

// A switcher, only when an option was asked for in the address.
function picker() {
  const bar = document.createElement("div");
  bar.className = "gen-picker";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Hero entrance options");
  const mark = () => bar.querySelectorAll("button[data-k]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === current)));
  const go = (key) => {
    current = key;
    history.replaceState(null, "", `?hero=${key}`);
    mark();
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => play(key));
  };
  Object.entries(OPTIONS).forEach(([k, name]) => {
    const b = document.createElement("button");
    b.type = "button"; b.dataset.k = k;
    b.textContent = k === "off" ? name : `${k.toUpperCase()} · ${name}`;
    b.addEventListener("click", () => go(k));
    bar.appendChild(b);
  });
  const again = document.createElement("button");
  again.type = "button"; again.className = "gen-replay"; again.textContent = "Replay";
  again.addEventListener("click", () => go(current));
  bar.appendChild(again);
  document.body.appendChild(bar);
  mark();
}

if (overlay) {
  if (asked !== null) picker();
  // Glyphs are traced in the face the page renders, so wait for the fonts; only play at the top of the page.
  const start = () => { if (window.scrollY > 12) { root.classList.remove("gen-wait"); return; } play(current); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start, start);
}
