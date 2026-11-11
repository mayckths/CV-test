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
        <li><a href="#componetizer">Figma DS Componetizer</a>: a plugin on a custom Claude skill that conforms mockups to the design system.</li>
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
        <li><b>Logitech G</b> (2023): 0 to 1 audio mixing platform, patent pending.</li>
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
if ("IntersectionObserver" in window) {
  const so = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => {
        if (a.getAttribute("href") === `#${en.target.id}`) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  navLinks.forEach((a) => { const t = document.querySelector(a.getAttribute("href")); if (t) so.observe(t); });
  so.observe(document.getElementById("intro"));
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

// Intro scene: the card stays pinned and shows one message per scroll step; behind it a camera travels
// around the blueprint of the M, framing another corner and its bezier handles at each step.
const scene = document.querySelector(".scene");
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
  const bp = scene.querySelector(".blueprint"), card = scene.querySelector(".scene-card");
  const SHOTS = [
    { f: [58, 50], a: [0.27, 0.72], h: 177 },   // the whole letter
    { f: [10, 6], a: [0.16, 0.76], h: 64 },     // top-left serif and its bracket
    { f: [106, 6], a: [0.84, 0.22], h: 64 },    // top-right serif
    { f: [57, 97], a: [0.5, 0.86], h: 84 },     // the vertex where the diagonals meet
    { f: [93, 95], a: [0.8, 0.78], h: 64 },     // right foot
    { f: [17, 95], a: [0.2, 0.78], h: 64 },     // left foot
    { f: [58, 50], a: [0.5, 0.5], h: 135 },     // the whole letter again, behind the list
  ];
  const anchors = bp ? [...bp.querySelectorAll(".bp-a")].map((el) => ({ el, x: +el.getAttribute("x") + 1, y: +el.getAttribute("y") + 1 })) : [];
  const handles = bp ? [...bp.querySelectorAll(".bp-handles path")].map((el) => {
    const n = el.getAttribute("d").match(/-?[\d.]+/g).map(Number);   // two handle lines: anchor, control, anchor, control
    return { els: [el, el.nextElementSibling, el.nextElementSibling.nextElementSibling], x: (n[0] + n[4]) / 2, y: (n[1] + n[5]) / 2 };
  }) : [];
  const cam = { v: null, goal: null, raf: 0, last: 0 };
  const shotAt = (p) => {
    const s = Math.min(SHOTS.length - 1, Math.max(0, p * steps.length - 0.5)), i = Math.min(SHOTS.length - 2, Math.floor(s));
    // Hold on each shot while its step is on screen; travel around the moment the steps swap.
    let t = Math.min(1, Math.max(0, (s - i - 0.25) / 0.5)); t = t * t * (3 - 2 * t);
    const A = SHOTS[i], B = SHOTS[i + 1], mix = (a, b) => a + (b - a) * t;
    return [mix(A.f[0], B.f[0]), mix(A.f[1], B.f[1]), mix(A.a[0], B.a[0]), mix(A.a[1], B.a[1]), mix(Math.log(A.h), Math.log(B.h))];
  };
  const frame = () => {
    const [fx, fy, ax, ay, lh] = cam.v, h = Math.exp(lh), cw = card.clientWidth, ch = Math.max(1, card.clientHeight), w = h * cw / ch;
    bp.setAttribute("viewBox", `${(fx - ax * w).toFixed(2)} ${(fy - ay * h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
    bp.style.setProperty("--k", (4.5 * h / ch).toFixed(3));          // anchors stay about 9px whatever the zoom
    // Close in, the node nearest the focus reads as selected, with its handles.
    const near = (list) => h < 110 ? list.reduce((best, o) => (Math.hypot(o.x - fx, o.y - fy) < Math.hypot(best.x - fx, best.y - fy) ? o : best)) : null;
    const na = near(anchors), nh = near(handles);
    anchors.forEach((o) => o.el.classList.toggle("sel", o === na));
    handles.forEach((o) => o.els.forEach((el) => el.classList.toggle("sel", o === nh && Math.hypot(o.x - fx, o.y - fy) < 14)));
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
    if (bp && anchors.length) {
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
// when you hover, focus or tap it.
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
  stamp.addEventListener("click", (e) => { if (e.pointerType === "touch" || e.detail === 0) set(!stamp.classList.contains("clear")); });
});
