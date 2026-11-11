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

// Intro scene: the card stays pinned and shows one message per scroll step; the blueprint draws as you go.
const scene = document.querySelector(".scene");
if (scene && !reduced) {
  const steps = [...scene.querySelectorAll(".step")];
  const rail = scene.querySelector(".scene-rail");
  const ticks = steps.map(() => rail.appendChild(document.createElement("i")));
  scene.style.setProperty("--n", steps.length);
  scene.classList.add("js");
  let current = -1, queued = 0;
  const update = () => {
    queued = 0;
    const r = scene.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
    const idx = Math.min(steps.length - 1, Math.floor(p * steps.length));
    scene.style.setProperty("--draw", Math.min(1, 0.12 + p * 1.1).toFixed(3));
    if (idx === current) return;
    current = idx;
    steps.forEach((s, i) => { s.classList.toggle("is-on", i === idx); s.classList.toggle("is-past", i < idx); });
    ticks.forEach((t, i) => t.classList.toggle("on", i === idx));
  };
  window.addEventListener("scroll", () => { if (!queued) queued = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener("resize", update);
  update();
}

// Spotlight: dark surfaces carry a soft light that follows the cursor.
if (!reduced && matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll(".flagship, .ask-panel, .foot.panel").forEach((el) => {
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
