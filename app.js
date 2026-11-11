// Scripted "ask" panel. Every answer is hand-written: edit ANSWERS to change the content.
const ANSWERS = [
  {
    id: "short",
    q: "Give me the 30-second version",
    keys: ["30", "short", "summary", "who", "about", "bio", "intro", "tldr"],
    html: `
      <p>Lead Product Designer with 10+ years in fintech and consumer products. At Novo I own core banking and growth journeys, set the design team's AI strategy, and shipped the in-app AI assistant for a fintech.</p>
      <div class="a-stats">
        <div><b>200,000+</b><span>businesses using the AI assistant</span></div>
        <div><b>+50%</b><span>activation, first month</span></div>
        <div><b>4+</b><span>design systems for Google</span></div>
      </div>
      <p>Start with the <a href="#ai-assistant">AI Assistant</a> or the <a href="#onboarding">first time experience</a>.</p>`,
  },
  {
    id: "ai",
    q: "What did you ship with AI?",
    keys: ["ai", "llm", "agent", "assistant", "chat", "claude", "conversational", "model", "prompt"],
    html: `
      <p>Three things, from product to tooling:</p>
      <ul class="a-list">
        <li><a href="#ai-assistant">AI Assistant</a>: a fintech assistant live for 200,000+ businesses, with error, retry and trust states designed for non-deterministic answers.</li>
        <li><a href="#componetizer">Design System Componetizer</a>: a tool on a custom Claude skill that creates screens in VS Code, Claude artifacts and Figma from one connected design system.</li>
        <li>The team's AI workflow: Figma MCP and Code Connect linking the design system to the codebase, with a review step for accuracy and compliance.</li>
      </ul>`,
  },
  {
    id: "impact",
    q: "Show me the impact",
    keys: ["impact", "result", "metric", "number", "kpi", "outcome", "data", "growth"],
    html: `
      <table class="a-table">
        <thead><tr><th>Project</th><th>What changed</th><th>Result</th></tr></thead>
        <tbody>
          <tr><td><a href="#onboarding">First time experience</a></td><td>Activation rate, first month</td><td>+50%</td></tr>
          <tr><td><a href="#ai-assistant">AI Assistant</a></td><td>Businesses with the assistant live</td><td>200,000+</td></tr>
          <tr><td>AI workflow</td><td>Design cycle time</td><td>1 mo → 1 wk</td></tr>
          <tr><td>Google at Huge</td><td>Components migrated to Figma</td><td>200+</td></tr>
        </tbody>
      </table>`,
  },
  {
    id: "eng",
    q: "How do you work with engineers?",
    keys: ["engineer", "dev", "code", "react", "prototype", "process", "work", "handoff", "collaborat", "team"],
    html: `
      <p>I close the gap between the mockup and the build:</p>
      <ul class="a-list">
        <li>I prototype in the product's own codebases (React web, Android Compose) with Claude Code, so we review real behavior instead of pictures.</li>
        <li>The design system lives in Figma and in code as React components and tokens, connected through Figma MCP and Code Connect.</li>
        <li>I decide what to build with evidence: painted-door tests, unmoderated prototype studies and funnel analytics.</li>
      </ul>
      <p>This site follows the same approach. It was designed and built in code.</p>`,
  },
  {
    id: "clients",
    q: "Who have you worked with?",
    keys: ["client", "compan", "google", "logitech", "huge", "novo", "accuweather", "bizagi", "experience", "career", "job"],
    html: `
      <ul class="a-list">
        <li><b>Novo</b> (2023 to now): business banking. Onboarding, payments, lending, payroll and the AI assistant.</li>
        <li><b>Logitech G</b> (2023): 0 to 1 audio mixing platform, now a live product.</li>
        <li><b>Huge</b> (2019 to 2023): Google (Wear OS, Google TV, Chrome, Built-in Auto) and AccuWeather.</li>
        <li><b>Bizagi</b> (2015 to 2019): product and marketing design plus front-end build.</li>
      </ul>
      <p>The full timeline is under <a href="#experience">Experience</a>.</p>`,
  },
  {
    id: "quotes",
    q: "What do colleagues say?",
    keys: ["say", "recommend", "reference", "colleague", "feedback", "testimonial", "people"],
    html: `
      <p class="a-quote">"He's leveled up our design process and language, and I've been inspired by his creativity and eye for detail."</p>
      <small>John Chang · Senior Product Designer, Netflix</small>
      <p class="a-quote">"Not only reliable, but also delivers at premium quality every time."</p>
      <small>Amar Mehta · Program Management and Product Strategy</small>`,
  },
];

const FALLBACK = `
  <p>I don't have a written answer for that one. This box is scripted, so I'd rather say so than guess.</p>
  <p>Try a suggestion below, or <a href="#contact">ask me directly</a>.</p>`;

const thread = document.getElementById("thread");
const chips = document.getElementById("chips");
const form = document.getElementById("composer");
const input = document.getElementById("q");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const asked = new Set();

const MAX_CHIPS = 4;
const resetBtn = document.createElement("button");
resetBtn.type = "button";
resetBtn.className = "chat-reset";
resetBtn.textContent = "Start over";
const tools = document.createElement("div");
tools.className = "chat-tools";
tools.hidden = true;
tools.appendChild(resetBtn);
thread.after(tools);
resetBtn.addEventListener("click", () => {
  thread.innerHTML = "";
  asked.clear();
  tools.hidden = true;
  renderChips();
  input.focus();
});

function renderChips() {
  chips.innerHTML = "";
  ANSWERS.filter((a) => !asked.has(a.id)).slice(0, MAX_CHIPS).forEach((a) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = a.q;
    b.addEventListener("click", () => ask(a.q, a));
    chips.appendChild(b);
  });
}

function match(text) {
  const t = text.toLowerCase();
  let best = null;
  let score = 0;
  for (const a of ANSWERS) {
    const s = a.keys.filter((k) => new RegExp(`\\b${k}`).test(t)).length;
    if (s > score) { best = a; score = s; }
  }
  return best;
}

function bubble(cls, html, isText) {
  const el = document.createElement("div");
  el.className = `msg ${cls}`;
  if (isText) el.textContent = html; else el.innerHTML = html;
  thread.appendChild(el);
  return el;
}

function ask(text, answer) {
  bubble("user", text, true);
  tools.hidden = false;
  const a = answer || match(text);
  if (a) asked.add(a.id);
  const bot = bubble("bot", `<span class="typing" aria-label="Writing"><i></i><i></i><i></i></span>`);
  setTimeout(() => {
    bot.innerHTML = a ? a.html : FALLBACK;
    renderChips();
    bot.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
  }, reduced ? 0 : 550);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  ask(text);
});

renderChips();

// Looping videos (converted from the original GIFs): play only while visible, never with reduced motion.
const loops = document.querySelectorAll("video.loop");
if (reduced) {
  loops.forEach((v) => { v.removeAttribute("autoplay"); v.pause(); });
}

if (!reduced && "IntersectionObserver" in window) {
  const vo = new IntersectionObserver((entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) { v.play().catch(() => {}); } else { v.pause(); }
    });
  }, { rootMargin: "120px 0px" });
  loops.forEach((v) => vo.observe(v));
}

// Header: hairline once scrolled, and mark the nav link for the section in view.
const header = document.querySelector(".top");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();
const navLinks = [...document.querySelectorAll('.top nav a[href^="#"]:not(.pill)')];
{
  // The current link is the last section whose top has passed a line 40% down the screen,
  // so it follows the page's order and never skips a short section.
  const targets = navLinks.map((a) => ({ a, el: document.querySelector(a.getAttribute("href")) })).filter((t) => t.el);
  let queued = 0;
  const mark = () => {
    queued = 0;
    const line = window.innerHeight * 0.4;
    let now = null;
    targets.forEach((t) => { if (t.el.getBoundingClientRect().top <= line) now = t; });
    targets.forEach((t) => { if (t === now) t.a.setAttribute("aria-current", "true"); else t.a.removeAttribute("aria-current"); });
  };
  window.addEventListener("scroll", () => { if (!queued) queued = requestAnimationFrame(mark); }, { passive: true });
  window.addEventListener("resize", mark);
  mark();
}

// Scroll reading: the closing line and the recommendations light up word by word as they scroll in.
if (!reduced) {
  const lines = [...document.querySelectorAll(".foot .big, .quotes blockquote")].map((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    el.classList.add("read");
    const spans = words.map((w, i) => {
      const sp = document.createElement("span");
      sp.textContent = w;
      el.append(sp, i < words.length - 1 ? " " : "");
      return sp;
    });
    return { el, spans };
  });
  let tick = 0;
  const read = () => {
    tick = 0;
    const vh = window.innerHeight;
    for (const { el, spans } of lines) {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.92 - r.top) / (vh * 0.36)));
      const lit = Math.round(p * spans.length);
      spans.forEach((sp, i) => sp.classList.toggle("on", i < lit));
    }
  };
  window.addEventListener("scroll", () => { if (!tick) tick = requestAnimationFrame(read); }, { passive: true });
  window.addEventListener("resize", read);
  // Late-loading media moves the lines without a scroll event, so re-read when the page height changes.
  if ("ResizeObserver" in window) new ResizeObserver(() => { if (!tick) tick = requestAnimationFrame(read); }).observe(document.body);
  read();
}

// Project media leans toward the cursor.
if (!reduced && matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll(".stack .case-media").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 12, rx = -((e.clientY - r.top) / r.height - 0.5) * 10;
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(1.02)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
}

// Blueprint of the M: a real path whose points can be dragged. The markup is the fallback; with scripts
// on, the outline is read into a model, and the anchors and handles are rebuilt from it so they stay in step.
const scene = document.querySelector(".scene");
const blueprint = (() => {
  const svg = scene && scene.querySelector(".blueprint"), card = scene && scene.querySelector(".scene-card");
  const line = svg && svg.querySelector(".bp-line"), fill = svg && svg.querySelector(".bp-fill");
  if (!line || !fill) return null;
  const NS = "http://www.w3.org/2000/svg";
  const make = (tag, parent, cls) => { const el = document.createElementNS(NS, tag); if (cls) el.setAttribute("class", cls); return parent.appendChild(el); };

  // The outline uses M, L and C in absolute coordinates and closes with Z.
  const anchors = [], controls = [], segs = [];
  let prev = null;
  for (const m of line.getAttribute("d").matchAll(/([MLC])([^MLCZ]*)/g)) {
    const n = m[2].trim().split(/[\s,]+/).map(Number), end = { x: n[n.length - 2], y: n[n.length - 1] };
    anchors.push(end);
    if (m[1] === "C") {
      const c1 = { x: n[0], y: n[1], of: prev }, c2 = { x: n[2], y: n[3], of: end };   // each handle belongs to an anchor
      controls.push(c1, c2);
      segs.push({ start: prev, end, c1, c2 });
    } else segs.push({ end, move: m[1] === "M" });
    prev = end;
  }
  const points = [...anchors, ...controls], home = points.map((p) => [p.x, p.y]);

  // Visible points sit behind the text; an empty twin of the drawing sits above it and only carries the grab areas.
  const hits = svg.cloneNode(false);
  hits.classList.add("bp-hits");
  card.insertBefore(hits, card.querySelector(".scene-foot"));
  const gH = svg.querySelector(".bp-handles"), gA = svg.querySelector(".bp-anchors");
  gH.textContent = ""; gA.textContent = "";
  controls.forEach((c) => { c.stem = make("path", gH); c.el = make("circle", gH); c.el.setAttribute("r", 0.9); });
  anchors.forEach((a) => { a.el = make("rect", gA, "bp-a"); a.el.setAttribute("width", 2); a.el.setAttribute("height", 2); });
  points.forEach((p) => { p.hit = make("circle", hits); p.hit.setAttribute("r", 1); });

  const f = (v) => +v.toFixed(2);
  const render = () => {
    let d = "";
    segs.forEach((s) => { d += s.c1 ? `C${f(s.c1.x)} ${f(s.c1.y)} ${f(s.c2.x)} ${f(s.c2.y)} ${f(s.end.x)} ${f(s.end.y)}` : `${s.move ? "M" : "L"}${f(s.end.x)} ${f(s.end.y)}`; });
    line.setAttribute("d", d + "Z"); fill.setAttribute("d", d + "Z");
    controls.forEach((c) => { c.stem.setAttribute("d", `M${f(c.of.x)} ${f(c.of.y)}L${f(c.x)} ${f(c.y)}`); c.el.setAttribute("cx", f(c.x)); c.el.setAttribute("cy", f(c.y)); });
    anchors.forEach((a) => { a.el.setAttribute("x", f(a.x - 1)); a.el.setAttribute("y", f(a.y - 1)); });
    points.forEach((p) => { p.hit.setAttribute("cx", f(p.x)); p.hit.setAttribute("cy", f(p.y)); });
  };

  // A hint that turns into a reset once the letter has been changed.
  const ui = document.createElement("div");
  ui.className = "bp-ui";
  ui.innerHTML = '<span class="bp-hint">Drag any point of the M</span><button type="button" class="bp-reset" hidden>Reset shape</button>';
  card.appendChild(ui);
  const hint = ui.firstChild, resetBtn = ui.lastChild;
  const setEdited = (on) => { hint.hidden = on; resetBtn.hidden = !on; };
  resetBtn.addEventListener("click", () => {
    const from = points.map((p) => [p.x, p.y]), t0 = performance.now();
    const tick = (now) => {
      const t = reduced ? 1 : Math.min(1, (now - t0) / 350), e = 1 - Math.pow(1 - t, 3);
      points.forEach((p, i) => { p.x = from[i][0] + (home[i][0] - from[i][0]) * e; p.y = from[i][1] + (home[i][1] - from[i][1]) * e; });
      render();
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setEdited(false);
  });

  // Dragging: an anchor carries its handles with it; a handle moves alone and bends its curve.
  const toSvg = (e) => { const m = hits.getScreenCTM().inverse(); return { x: m.a * e.clientX + m.c * e.clientY + m.e, y: m.b * e.clientX + m.d * e.clientY + m.f }; };
  const look = (p, cls, on) => [p.el, p.stem].forEach((el) => el && el.classList.toggle(cls, on));
  let drag = null;
  points.forEach((p) => {
    p.hit.addEventListener("pointerenter", () => look(p, "hot", true));
    p.hit.addEventListener("pointerleave", () => look(p, "hot", false));
    p.hit.addEventListener("pointerdown", (e) => {
      if (e.button) return;
      e.preventDefault();
      const at = toSvg(e);
      drag = { p, dx: p.x - at.x, dy: p.y - at.y };
      p.hit.setPointerCapture(e.pointerId);
      look(p, "grab", true);
      scene.classList.add("bp-dragging");
    });
    p.hit.addEventListener("pointermove", (e) => {
      if (!drag || drag.p !== p) return;
      const at = toSvg(e), mx = at.x + drag.dx - p.x, my = at.y + drag.dy - p.y;
      p.x += mx; p.y += my;
      if (!("of" in p)) controls.forEach((c) => { if (c.of === p) { c.x += mx; c.y += my; } });
      render();
      setEdited(true);
    });
    const drop = () => { if (drag && drag.p === p) { drag = null; look(p, "grab", false); scene.classList.remove("bp-dragging"); } };
    p.hit.addEventListener("pointerup", drop);
    p.hit.addEventListener("pointercancel", drop);
  });

  // Points keep their size on screen whatever the zoom: upp is drawing units per pixel.
  const GRAB = matchMedia("(pointer: coarse)").matches ? 12 : 14;
  const scale = (upp, fixAnchors) => {
    if (fixAnchors) svg.style.setProperty("--k", (4.5 * upp).toFixed(3));
    hits.style.setProperty("--kh", (GRAB * upp).toFixed(3));
  };
  const view = (box, upp) => { svg.setAttribute("viewBox", box); hits.setAttribute("viewBox", box); scale(upp, true); };
  const measure = () => { const m = hits.getScreenCTM(); if (m && m.a) scale(1 / m.a, false); };   // the still layout, no camera
  measure();
  window.addEventListener("resize", measure);
  render();
  return { card, anchors, corners: segs.filter((s) => s.c1), view };
})();

// Intro scene: the card stays pinned and shows one message per scroll step; behind it a camera travels
// around the blueprint of the M, framing another corner and its bezier handles at each step.
if (scene && !reduced) {
  const steps = [...scene.querySelectorAll(".step")];
  const rail = scene.querySelector(".scene-rail");
  const ticks = steps.map(() => rail.appendChild(document.createElement("i")));
  scene.style.setProperty("--n", steps.length);
  scene.classList.add("js");
  let current = -1, queued = 0;

  // Blueprint camera. Each step frames another part of the M: f is the point of the letter in focus
  // (in the drawing's own units), a is where that point sits on the card (0 to 1), h is how many units
  // of the drawing fit the card's height. Scrolling glides from one shot to the next.
  const SHOTS = [
    { f: [58, 50], a: [0.27, 0.72], h: 177 },   // the whole letter
    { f: [10, 6], a: [0.16, 0.76], h: 64 },     // top-left serif and its bracket
    { f: [106, 6], a: [0.84, 0.22], h: 64 },    // top-right serif
    { f: [57, 97], a: [0.5, 0.86], h: 84 },     // the vertex where the diagonals meet
    { f: [93, 95], a: [0.8, 0.78], h: 64 },     // right foot
    { f: [58, 50], a: [0.5, 0.5], h: 135 },     // the whole letter again, behind the list
  ];
  const cam = { v: null, goal: null, raf: 0, last: 0 };
  const shotAt = (p) => {
    const s = Math.min(SHOTS.length - 1, Math.max(0, p * steps.length - 0.5)), i = Math.min(SHOTS.length - 2, Math.floor(s));
    // Hold on each shot while its step is on screen; travel around the moment the steps swap.
    let t = Math.min(1, Math.max(0, (s - i - 0.25) / 0.5)); t = t * t * (3 - 2 * t);
    const A = SHOTS[i], B = SHOTS[i + 1], mix = (a, b) => a + (b - a) * t;
    return [mix(A.f[0], B.f[0]), mix(A.f[1], B.f[1]), mix(A.a[0], B.a[0]), mix(A.a[1], B.a[1]), mix(Math.log(A.h), Math.log(B.h))];
  };
  const frame = () => {
    const { card, anchors, corners } = blueprint;
    const [fx, fy, ax, ay, lh] = cam.v, h = Math.exp(lh), cw = card.clientWidth, ch = Math.max(1, card.clientHeight), w = h * cw / ch;
    blueprint.view(`${(fx - ax * w).toFixed(2)} ${(fy - ay * h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`, h / ch);
    // Close in, the node nearest the focus reads as selected, and so do the handles of the nearest curve.
    const far = (x, y) => Math.hypot(x - fx, y - fy);
    const na = h < 110 ? anchors.reduce((best, o) => (far(o.x, o.y) < far(best.x, best.y) ? o : best)) : null;
    const mid = (c) => far((c.start.x + c.end.x) / 2, (c.start.y + c.end.y) / 2);
    const nc = h < 110 ? corners.reduce((best, c) => (mid(c) < mid(best) ? c : best)) : null;
    anchors.forEach((o) => o.el.classList.toggle("sel", o === na));
    corners.forEach((c) => { const on = c === nc && mid(c) < 14; [c.c1, c.c2].forEach((k) => { k.el.classList.toggle("sel", on); k.stem.classList.toggle("sel", on); }); });
  };
  const glide = (now) => {
    const dt = Math.min(0.05, (now - cam.last) / 1000); cam.last = now;
    const k = 1 - Math.exp(-dt * 7);
    let rest = 0;
    cam.v = cam.v.map((v, i) => { rest += Math.abs(cam.goal[i] - v); return v + (cam.goal[i] - v) * k; });
    frame();
    cam.raf = rest > 0.002 ? requestAnimationFrame(glide) : 0;
  };

  const update = () => {
    queued = 0;
    const r = scene.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
    const idx = Math.min(steps.length - 1, Math.floor(p * steps.length));
    // The outline is complete early; anchors and handles follow it in.
    const draw = Math.min(1, 0.35 + p * 4);
    scene.style.setProperty("--draw", draw.toFixed(3));
    scene.classList.toggle("drawn", draw >= 1);
    scene.style.setProperty("--points", Math.min(1, Math.max(0, p * 6 - 0.4)).toFixed(3));
    if (blueprint) {
      cam.goal = shotAt(p);
      if (!cam.v) { cam.v = cam.goal.slice(); frame(); }
      else if (!cam.raf) { cam.last = performance.now(); cam.raf = requestAnimationFrame(glide); }
    }
    if (idx === current) return;
    current = idx;
    steps.forEach((s, i) => { s.classList.toggle("is-on", i === idx); s.classList.toggle("is-past", i < idx); });
    ticks.forEach((t, i) => t.classList.toggle("on", i === idx));
    scene.classList.toggle("dense", steps[idx].classList.contains("creds"));
  };
  window.addEventListener("scroll", () => { if (!queued) queued = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener("resize", update);
  update();
}

// Spotlight: dark surfaces carry a soft light that follows the cursor.
if (!reduced && matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll(".ask-panel, .foot.panel").forEach((el) => {
    const target = el.classList.contains("foot") ? el.querySelector(".panel-bg") : el;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      target.style.setProperty("--sx", `${e.clientX - r.left}px`);
      target.style.setProperty("--sy", `${e.clientY - r.top}px`);
    });
  });
}

// Pinned hero: publish how far through it the page has scrolled, for the logo, the roles and the gradient.
const heroWrap = document.querySelector(".hero-wrap");
if (heroWrap && !reduced) {
  let queued = 0;
  const set = () => {
    queued = 0;
    const r = heroWrap.getBoundingClientRect();
    heroWrap.style.setProperty("--hp", Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight))).toFixed(3));
  };
  window.addEventListener("scroll", () => { if (!queued) queued = requestAnimationFrame(set); }, { passive: true });
  window.addEventListener("resize", set);
  set();
}

// Stamps: each 3D piece prints as an ordered-dither pixel image in one ink, and resolves into the render
// when you hover or focus it. A click opens its story (see the spotlight below).
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function dither(canvas, img, cells, ink) {
  const w = canvas.width, tmp = dither.tmp || (dither.tmp = document.createElement("canvas"));
  tmp.width = tmp.height = cells;
  const tctx = tmp.getContext("2d", { willReadFrequently: true });
  tctx.drawImage(img, 0, 0, cells, cells);
  const px = tctx.getImageData(0, 0, cells, cells).data, ctx = canvas.getContext("2d"), size = w / cells;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(ink.slice(i, i + 2), 16));
  // Four opaque tones of one ink on paper: paper, light, mid, full. The Bayer matrix decides between neighbours.
  const tone = (k) => `rgb(${Math.round(255 + (r - 255) * k)},${Math.round(255 + (g - 255) * k)},${Math.round(255 + (b - 255) * k)})`;
  const tones = [tone(0.1), tone(0.36), tone(0.66), tone(1)];
  ctx.fillStyle = tones[0];
  ctx.fillRect(0, 0, w, w);
  for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) {
    const i = (y * cells + x) * 4, lum = (px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11) / 255;
    const level = Math.min(3, Math.floor((1 - lum) * 3 + (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16));
    if (!level) continue;
    ctx.fillStyle = tones[level];
    ctx.fillRect(Math.round(x * size), Math.round(y * size), Math.ceil(size), Math.ceil(size));
  }
}
document.querySelectorAll(".stamp").forEach((stamp) => {
  const img = stamp.querySelector("img"), canvas = stamp.querySelector("canvas");
  const ink = getComputedStyle(stamp).getPropertyValue("--ink").trim();
  const STEPS = [48, 72, 144];
  let timer = 0;
  const draw = (cells) => { try { dither(canvas, img, cells, ink); } catch (e) { stamp.classList.add("clear"); } };
  const ready = () => draw(STEPS[0]);
  if (img.complete && img.naturalWidth) ready(); else img.addEventListener("load", ready, { once: true });
  const set = (on) => {
    clearTimeout(timer);
    if (reduced) { stamp.classList.toggle("clear", on); return; }
    if (on) {
      // Sharpen in a couple of steps, then give way to the render.
      draw(STEPS[1]);
      timer = setTimeout(() => { draw(STEPS[2]); timer = setTimeout(() => stamp.classList.add("clear"), 90); }, 90);
    } else {
      stamp.classList.remove("clear");
      draw(STEPS[1]);
      timer = setTimeout(() => draw(STEPS[0]), 120);
    }
  };
  stamp.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") set(true); });
  stamp.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") set(false); });
  stamp.addEventListener("focus", () => set(true));
  stamp.addEventListener("blur", () => set(false));
});

// Art spotlight: a stamp opens a dialog with the piece and its story. It opens and closes with the
// transitions.dev modal transition (scale up from centre, a softer and quicker scale down).
const spot = document.querySelector(".spot");
if (spot && typeof spot.showModal === "function") {
  const card = spot.querySelector(".spot-card"), stamps = [...document.querySelectorAll(".stamp")];
  const $ = (sel) => spot.querySelector(sel);
  const closeMs = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--modal-close-dur")) || 150;
  let index = 0, opener = null, closing = 0;
  const fill = (i) => {
    index = (i + stamps.length) % stamps.length;
    const s = stamps[index], q = (sel) => s.querySelector(sel);
    spot.style.setProperty("--ink", getComputedStyle(s).getPropertyValue("--ink"));
    $(".spot-art img").src = q("img").currentSrc || q("img").src;
    $(".spot-art img").alt = q("img").alt;
    $(".spot-meta").textContent = q(".stamp-meta").textContent;
    $("#spot-title").textContent = q(".stamp-title").textContent;
    $(".spot-year").textContent = q(".stamp-year").textContent;
    $(".spot-text").textContent = q(".stamp-info").textContent;
    const link = $(".spot-link");
    link.hidden = !s.dataset.link;
    if (s.dataset.link) { link.href = s.dataset.link; link.textContent = s.dataset.linkLabel; }
    $(".spot-count").textContent = `${index + 1} / ${stamps.length}`;
  };
  const open = (i, from) => {
    clearTimeout(closing);
    opener = from;
    fill(i);
    if (!spot.open) spot.showModal();
    document.documentElement.classList.add("spot-open");
    card.classList.remove("is-closing");
    void card.offsetWidth;                       // so the open transition starts from the resting scale
    card.classList.add("is-open");
    spot.classList.add("is-open");
  };
  const close = () => {
    card.classList.remove("is-open");
    card.classList.add("is-closing");
    spot.classList.remove("is-open");
    closing = setTimeout(() => {
      card.classList.remove("is-closing");
      spot.close();
      document.documentElement.classList.remove("spot-open");
      if (opener) opener.focus({ preventScroll: true });
    }, closeMs);
  };
  spot.addEventListener("cancel", (e) => { e.preventDefault(); close(); });                 // Escape
  spot.addEventListener("click", (e) => { if (e.target === spot || e.target.classList.contains("spot-shade")) close(); });
  $(".spot-close").addEventListener("click", close);
  $(".spot-prev").addEventListener("click", () => fill(index - 1));
  $(".spot-next").addEventListener("click", () => fill(index + 1));
  spot.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") fill(index - 1); else if (e.key === "ArrowRight") fill(index + 1); });
  stamps.forEach((s, i) => {
    s.addEventListener("click", () => open(i, s));
    s.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i, s); } });
  });
}
