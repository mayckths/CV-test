// The hero (index.html, and the test page lab/hero-grow.html): two pyramids of pale stone. The pyramids turn their
// front faces toward the pointer. Wherever the pointer passes a meadow grows: tufts of grass, daisies on stalks with
// leaves, sprays of blossom and small wildflowers, and the stone under them turns green. Two seconds later the meadow
// withers back on its own, leaving a few flowers standing on stone that stays a little earthy; the pointer can grow it
// again. A click on a pyramid plants one larger flower that stays. The ground reacts too: a wide horizon haze leans
// toward the pointer, a faint light follows it, and floating pollen drifts around it.
// The ground is drawn in layers (.grow-layer, each painting one background named by data-bg). On the portfolio the
// hero opens on Night and turns to Studio as its second, pinned screen scrolls in: the Night layer fades out and the
// 3D lights, the pollen and the type change with it. The test page has one layer and a switcher for all eight.
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

async function init() {
  const panel = document.querySelector(".hero.grow");
  if (!panel) return;
  const canvas = panel.querySelector(".lens-fx"), sunEls = [...panel.querySelectorAll(".grow-sun")], glowEls = [...panel.querySelectorAll(".grow-glow")], dustEls = [...panel.querySelectorAll(".grow-dust")];
  let dirty = true, raf = 0, seen = true, kick = () => {};                       // kick() starts the drawing loop once it exists
  const breathe = () => new Promise((r) => setTimeout(r, 0));                     // let the page scroll and paint between heavy steps
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches, RATE = reduced ? 40 : 1;
  panel.style.setProperty("--navw", document.querySelector(".top").offsetWidth + "px");
  const q = new URLSearchParams(location.search).get("q");
  const low = q === "low" || (q !== "high" && (window.innerWidth < 700 || matchMedia("(pointer: coarse)").matches));   // phones get a lighter scene

  // --- the ground: the sun glow leans toward the pointer, a soft light follows it, and pollen floats around it.
  //     This part is plain DOM and 2D canvas, so it works even where WebGL does not.
  const sky = (() => {
    const ctxs = dustEls.map((c) => c.getContext("2d")), motes = [], dpr = [1, 1];
    const sprite = (rgb, hard) => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(hard, `rgba(${rgb},${hard > 0.2 ? 0.9 : 0.55})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; };
    const SPR = []; let amp = 1;
    function tint(rgb, a) { SPR.length = 0; SPR.push(sprite(rgb[0], 0.3), sprite(rgb[1], 0.3), sprite(rgb[0], 0.04), sprite(rgb[1], 0.04)); amp = a; }
    const p = { x: 0, y: 0, vx: 0, vy: 0, on: false, at: 0 }, sun = { x: 0, y: 0, sx: NaN, sy: NaN }, glow = { x: 0, y: 0, set: false };
    let W = 0, H = 0;
    function resize(w, h) {
      if (W && H) for (const m of motes) { m.x *= w / W; m.y *= h / H; }
      W = w; H = h;
      dustEls.forEach((c, k) => { const d = Math.min(window.devicePixelRatio || 1, k ? 1 : 2); dpr[k] = d; c.width = Math.round(w * d); c.height = Math.round(h * d); });
      if (!motes.length) {
        const nb = low ? 40 : 80, nf = dustEls.length > 1 ? (low ? 4 : 8) : 0;
        for (let i = 0; i < nb + nf; i++) {
          const front = i >= nb, blur = front || Math.random() < 0.3;
          motes.push({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, k: front ? 1 : 0, ph: Math.random() * 6.283,
            z: front ? 1.5 + Math.random() : blur ? 0.45 + 0.3 * Math.random() : 0.7 + 0.45 * Math.random(),
            r: front ? 9 + 12 * Math.random() : blur ? 3 + 4 * Math.random() : 0.8 + 1.7 * Math.random(),
            a: front ? 0.2 + 0.16 * Math.random() : blur ? 0.28 + 0.2 * Math.random() : 0.5 + 0.45 * Math.random(),
            s: (blur ? 2 : 0) + (Math.random() < 0.4 ? 1 : 0) });
        }
      }
    }
    function point(x, y, on) {
      const now = performance.now();
      if (on && p.on) { const dt = Math.max(8, now - p.at) / 1000; p.vx = Math.max(-2500, Math.min(2500, (x - p.x) / dt)); p.vy = Math.max(-2500, Math.min(2500, (y - p.y) / dt)); }
      p.at = now; p.on = on; if (on) { p.x = x; p.y = y; }
    }
    function update(dt, t) {
      // pollen: a slow rising drift; near the pointer it is pushed aside and carried along in its wake
      const R = Math.max(110, Math.min(W, H) * 0.17), dk = Math.exp(-dt * 4); p.vx *= dk; p.vy *= dk;
      for (const m of motes) {
        const tvx = (4 + 5 * Math.sin(t * 0.21 + m.ph)) * m.z, tvy = (-7 - 4 * Math.sin(t * 0.33 + m.ph * 1.7)) * m.z;
        if (p.on && !reduced) { const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy) + 0.01, rr = R * (0.7 + 0.3 * m.z); if (d < rr) { const f = (1 - d / rr) ** 2 * dt * 3; m.vx += ((dx / d) * 260 + p.vx * 0.9) * f; m.vy += ((dy / d) * 260 + p.vy * 0.9) * f; } }
        const e = Math.min(1, dt * 0.9); m.vx += (tvx - m.vx) * e; m.vy += (tvy - m.vy) * e;
        if (!reduced) { m.x += m.vx * dt; m.y += m.vy * dt; }
        const pad = m.r * 3; if (m.x < -pad) m.x += W + 2 * pad; else if (m.x > W + pad) m.x -= W + 2 * pad; if (m.y < -pad) m.y += H + 2 * pad; else if (m.y > H + pad) m.y -= H + 2 * pad;
      }
      ctxs.forEach((g, k) => { g.setTransform(dpr[k], 0, 0, dpr[k], 0, 0); g.clearRect(0, 0, W, H); });
      for (const m of motes) { const g = ctxs[m.k]; g.globalAlpha = Math.min(1, m.a * amp * (0.8 + 0.2 * Math.sin(t * 1.1 + m.ph))); const s = m.r * (m.s >= 2 ? 3 : 5); g.drawImage(SPR[m.s], m.x - s / 2, m.y - s / 2, s, s); }
      // the sun glow leans a little toward the pointer and drifts back when it leaves
      const tx = p.on ? (p.x - W / 2) * 0.13 : 0, ty = p.on ? (p.y - H * 0.62) * 0.08 : 0, e1 = 1 - Math.exp(-dt * 1.8);
      sun.x += (tx - sun.x) * e1; sun.y += (ty - sun.y) * e1;
      if (Math.abs(sun.x - sun.sx) + Math.abs(sun.y - sun.sy) > 0.05 || isNaN(sun.sx)) { sun.sx = sun.x; sun.sy = sun.y; const tf = `translate3d(${sun.x.toFixed(1)}px,${sun.y.toFixed(1)}px,0)`; for (const el of sunEls) el.style.transform = tf; }
      if (p.on) { const e2 = glow.set ? 1 - Math.exp(-dt * 10) : 1; glow.set = true; const nx = glow.x + (p.x - glow.x) * e2, ny = glow.y + (p.y - glow.y) * e2; if (Math.abs(nx - glow.x) + Math.abs(ny - glow.y) > 0.05) { glow.x = nx; glow.y = ny; const tf = `translate3d(${nx.toFixed(1)}px,${ny.toFixed(1)}px,0)`; for (const el of glowEls) el.style.transform = tf; } }
    }
    return { resize, point, update, tint, lean: () => (W ? sun.x / W : 0) };
  })();

  // --- backgrounds to choose from (?bg=name, or the switcher on the page). The CSS for each is in hero-grow.html;
  //     here are the lights that suit it and the colour of the pollen (on the dark ones it glows like fireflies).
  const THEMES = {
    golden: { hemi: ["#fff0dc", "#8a6f60", 1.5], sun: ["#fff0d6", 2.9], rim: ["#ff9ab8", 0.9], exp: 1.08, dust: ["255,252,242", "255,214,146"], a: 1, ink: "#1f1c1c" },
    studio: { hemi: ["#ffffff", "#9a9088", 1.6], sun: ["#fffaf2", 2.7], rim: ["#ffffff", 0.45], exp: 1.05, dust: ["176,160,142", "205,192,176"], a: 0.8, ink: "#1f1c1c" },
    sky: { hemi: ["#eaf4ff", "#8b8a78", 1.6], sun: ["#fffaf0", 3.0], rim: ["#bfe0ff", 0.8], exp: 1.06, dust: ["255,255,255", "255,246,214"], a: 1, ink: "#1f1c1c" },
    sunset: { hemi: ["#ffd9c0", "#7a4a6a", 1.4], sun: ["#ffc890", 2.8], rim: ["#ff5c98", 1.3], exp: 1.06, dust: ["255,240,208", "255,190,150"], a: 1, ink: "#1f1c1c" },
    pink: { hemi: ["#ffe3ee", "#8a4a62", 1.5], sun: ["#fff2f6", 2.8], rim: ["#ffffff", 0.9], exp: 1.06, dust: ["255,255,255", "255,214,232"], a: 1, ink: "#1f1c1c" },
    holo: { hemi: ["#f3ecff", "#7f8aa8", 1.6], sun: ["#fffaff", 2.7], rim: ["#7fe9ff", 1.0], exp: 1.06, dust: ["255,255,255", "204,242,255"], a: 1, ink: "#1f1c1c" },
    dusk: { hemi: ["#a894ff", "#241a4d", 0.95], sun: ["#ffa8c4", 1.9], rim: ["#7fdcff", 1.7], exp: 0.92, dust: ["255,238,160", "255,200,120"], a: 1.25, ink: "#ffffff" },
    night: { hemi: ["#7f95c4", "#101810", 0.6], sun: ["#c4d6ff", 1.35], rim: ["#ffd27a", 1.0], exp: 0.86, dust: ["255,230,120", "214,255,150"], a: 1.35, ink: "#ffffff" },
  };
  const fromL = panel.querySelector(".grow-layer.from"), toL = panel.querySelector(".grow-layer.to"), picker = document.querySelector(".bg-pick"), wrap = panel.closest(".hero-wrap");
  const asked = picker && new URLSearchParams(location.search).get("bg");
  let lightsFor = null, A = THEMES[asked] ? asked : fromL && THEMES[fromL.dataset.bg] ? fromL.dataset.bg : "studio", blend = 0, dustStep = -1;
  const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t), lerpN = (a, b, t) => a + (b - a) * t;
  const lerpRGB = (a, b, t) => { const q = b.split(","); return a.split(",").map((v, k) => Math.round(lerpN(+v, +q[k], t))).join(","); };
  function refresh() {                                                            // show theme A, blended toward the scroll theme
    const a = THEMES[A], b = (toL && THEMES[toL.dataset.bg]) || a, t = b === a ? 0 : blend;
    if (fromL) { fromL.dataset.bg = A; fromL.style.opacity = (1 - t).toFixed(3); }
    panel.style.setProperty("--lens-ink", "#" + lerpC(a.ink, b.ink, t).getHexString());
    const step = Math.round(t * 24); if (step !== dustStep) { dustStep = step; const u = step / 24; sky.tint([lerpRGB(a.dust[0], b.dust[0], u), lerpRGB(a.dust[1], b.dust[1], u)], lerpN(a.a, b.a, u)); }
    if (lightsFor) lightsFor(a, b, t);
  }
  function applyBg(name) {                                                        // the test page's switcher
    A = name; dustStep = -1; refresh();
    if (picker) { picker.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.bg === name)); const u = new URL(location.href); u.searchParams.set("bg", name); history.replaceState(null, "", u); }
  }
  if (picker) picker.addEventListener("click", (e) => { const b = e.target.closest("button[data-bg]"); if (b) applyBg(b.dataset.bg); });
  applyBg(A);
  // On the portfolio the second screen of the pinned hero brings in the scroll theme (Studio).
  if (wrap && toL && !reduced) {
    const onScroll = () => {
      const r = wrap.getBoundingClientRect(), hp = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight))), u = Math.min(1, Math.max(0, (hp - 0.06) / 0.3)), v = u * u * (3 - 2 * u);
      if (Math.abs(v - blend) > 0.001) { blend = v; refresh(); kick(); }
    };
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll); onScroll();
  }
  const pointGround = (e, on) => { const r = panel.getBoundingClientRect(); sky.point(e.clientX - r.left, e.clientY - r.top, on); panel.classList.toggle("lit", on); };
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); }
  catch (e) {                                                                     // no WebGL: the ground still moves
    const loop = (t) => { requestAnimationFrame(loop); sky.update(1 / 60, t / 1000); };
    sky.resize(panel.clientWidth, panel.clientHeight); requestAnimationFrame(loop);
    panel.addEventListener("pointermove", (e) => pointGround(e, true)); panel.addEventListener("pointerleave", (e) => pointGround(e, false));
    return;
  }

  const STONE = "#d9d4cb", MOSS = "#48702a", EARTH = "#9c7754", EA = 0.5;
  const GRASS = ["#4f7a2a", "#6b9a34", "#3d6624", "#86a845", "#5a8a3a", "#73993a"], STRAW = "#b3a65e";
  const DAISY = ["#ffffff", "#ffffff", "#fff3f6", "#ff8fb4", "#ff5c98", "#ffd23c", "#c9b6ff"], BLOSSOM = ["#ff5c98", "#ff8fb4", "#c9b6ff", "#ffffff", "#ff9a5c"], WILD = ["#ff5c98", "#ffd23c", "#c9b6ff", "#ff9a5c", "#ffffff"];
  const HERO = [{ petal: "#ff5c98", eye: "#ffc21a" }, { petal: "#ffffff", eye: "#ffc21a" }, { petal: "#ffd23c", eye: "#4a2a14" }, { petal: "#ff9a5c", eye: "#4a2a14" }, { petal: "#c9b6ff", eye: "#ffd23c" }, { petal: "#ff3d7f", eye: "#ffe08a" }];
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60); camera.position.set(0, 0, 10);
  const hemi = new THREE.HemisphereLight("#fff0dc", "#8a6f60", 1.5); scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff0d6", 2.9); sun.position.set(-4.5, 5.5, 5.5); sun.castShadow = true; sun.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 1, far: 20 }); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4; scene.add(sun);
  const rim = new THREE.DirectionalLight("#ff9ab8", 0.9); rim.position.set(5, 2.5, -3.5); scene.add(rim);
  lightsFor = (a, b, t) => {
    hemi.color.copy(lerpC(a.hemi[0], b.hemi[0], t)); hemi.groundColor.copy(lerpC(a.hemi[1], b.hemi[1], t)); hemi.intensity = lerpN(a.hemi[2], b.hemi[2], t);
    sun.color.copy(lerpC(a.sun[0], b.sun[0], t)); sun.intensity = lerpN(a.sun[1], b.sun[1], t); rim.color.copy(lerpC(a.rim[0], b.rim[0], t)); rim.intensity = lerpN(a.rim[1], b.rim[1], t);
    renderer.toneMappingExposure = lerpN(a.exp, b.exp, t); dirty = true;
  };

  const h3 = (x, y, z) => { const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return n - Math.floor(n); };
  const vn = (x, y, z) => { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), s = (t) => t * t * (3 - 2 * t), u = s(x - xi), v = s(y - yi), w = s(z - zi), l = (a, b, t) => a + (b - a) * t;
    return l(l(l(h3(xi, yi, zi), h3(xi + 1, yi, zi), u), l(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), u), v), l(l(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), u), l(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), u), v), w); };
  const fbm = (x, y, z) => vn(x, y, z) * 0.5 + vn(x * 2.1, y * 2.1, z * 2.1) * 0.25 + vn(x * 4.3, y * 4.3, z * 4.3) * 0.125 + vn(x * 8.7, y * 8.7, z * 8.7) * 0.0625;
  const fbm2 = (x, y, z) => fbm(x, y, z) + vn(x * 16.7, y * 16.7, z) * 0.03125;
  let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // --- the stone, painted once: colour and height for the relief. Each face of a pyramid gets its own quarter.
  const TS = low ? 768 : 1280, base = new THREE.Color(STONE), paint = base.clone().convertLinearToSRGB();
  async function sheets() {
    const cc = document.createElement("canvas"), hc = document.createElement("canvas"); cc.width = cc.height = hc.width = hc.height = TS;
    const cx = cc.getContext("2d"), hx = hc.getContext("2d"), ci = cx.createImageData(TS, TS), hi = hx.createImageData(TS, TS);
    let t0 = performance.now();
    for (let j = 0; j < TS; j++) { if (performance.now() - t0 > 12) { await breathe(); t0 = performance.now(); } for (let i = 0; i < TS; i++) {
      const u = (i / TS) * 9, v = (j / TS) * 9;
      const patch = fbm2(u * 0.9, v * 0.9, 1.3), streak = fbm(u * 3.2, v * 0.5, 7.7), grain = fbm2(u * 9, v * 9, 3.1), fineG = fbm(u * 34, v * 34, 6.2), speck = vn(u * 60, v * 60, 5.9), salt = h3(i, j, 1.7);
      const c1 = Math.abs(fbm2(u * 0.8, v * 0.8, 11.3) * 2 - 0.97), crack = Math.max(0, 1 - c1 / 0.007) * (0.5 + 0.5 * vn(u * 3, v * 3, 4.1));
      const pit = speck > 0.9 ? (speck - 0.9) * 9 : 0, fleck = speck < 0.08 ? 0.1 : 0;
      const val = 0.94 + (patch - 0.48) * 0.36 + (streak - 0.48) * 0.14 + (grain - 0.48) * 0.38 + (fineG - 0.48) * 0.3 + (salt - 0.5) * 0.12 + fleck - crack * 0.34 - pit * 0.4;
      const warm = fbm(u * 0.5 + 9, v * 0.5, 2.2) - 0.47, o = (j * TS + i) * 4;
      ci.data[o] = Math.max(0, Math.min(255, paint.r * 255 * val * (1.01 + warm * 0.1))); ci.data[o + 1] = Math.max(0, Math.min(255, paint.g * 255 * val * (1.0 + warm * 0.03))); ci.data[o + 2] = Math.max(0, Math.min(255, paint.b * 255 * val * (0.99 - warm * 0.1))); ci.data[o + 3] = 255;
      const hgt = 0.6 + (grain - 0.48) * 0.8 + (fineG - 0.48) * 0.7 + (patch - 0.48) * 0.3 + (salt - 0.5) * 0.16 - crack * 0.5 - pit * 0.6;
      hi.data[o] = hi.data[o + 1] = hi.data[o + 2] = Math.max(0, Math.min(255, hgt * 255)); hi.data[o + 3] = 255;
    } }
    cx.putImageData(ci, 0, 0); hx.putImageData(hi, 0, 0);
    const m = new THREE.CanvasTexture(cc), h = new THREE.CanvasTexture(hc); m.colorSpace = THREE.SRGBColorSpace; m.anisotropy = h.anisotropy = 8; return [m, h];
  }
  const [colourMap, heightMap] = await sheets();

  // --- two true square pyramids, with a fine roughness, hairline cracks and slightly worn edges
  const BASE_Y = 0.36, SWING = 0.6;                                              // resting turn, and how far the pointer turns them
  const group = new THREE.Group(); group.rotation.set(0.13, BASE_Y, 0); scene.add(group);
  const HGT = 2.35, RS = low ? 120 : 232, HS = low ? 68 : 132;
  function pyramid(cx, sd, turn) {
    const g = new THREE.ConeGeometry(1, HGT, RS, HS, false, Math.PI), p = g.attributes.position, n = p.count, uv = g.attributes.uv, col = new Float32Array(n * 3), shade0 = new Float32Array(n), gv = new Float32Array(n), ge = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i), shade = 1; const r = Math.hypot(x, z);
      if (r < 1e-5 && y < 0) { y -= 0.3; shade = 0.6; uv.setXY(i, 0.25, 0.25); }
      else {
        const a = Math.atan2(z, x), ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a)), k = r > 1e-5 ? 1 / Math.max(ca, sa) : 1; x *= k; z *= k;
        const face = ca > sa ? (x > 0 ? 0 : 2) : (z > 0 ? 1 : 3), along = ca > sa ? z : x, f = (face + turn) % 4;
        uv.setXY(i, along * 0.19 + 0.25 + (f % 2) * 0.5, y * 0.19 + 0.25 + (f > 1 ? 0.5 : 0));
        const up = (y + HGT / 2) / HGT, corner = Math.max(0, 1 - Math.abs(ca - sa) * 9);
        const lump = fbm(x * 2.2 + sd, y * 2.2, z * 2.2) - 0.47, fine = fbm(x * 9 + sd, y * 9, z * 9) - 0.47, grit = fbm(x * 28 + sd, y * 28, z * 28) - 0.47, crack = Math.max(0, 0.03 - Math.abs(fbm(x * 2.4 + sd, y * 2.4, z * 2.4) * 2 - 0.94));
        const d = (lump * 0.035 + fine * 0.03 + grit * 0.014 - crack * 0.5 - corner * (0.008 + 0.04 * Math.max(0, vn(x * 5 + sd, y * 5, z * 5) - 0.55))) * (1 - up * 0.6), L = Math.hypot(x, z) || 1;
        x += (x / L) * d; z += (z / L) * d; shade = Math.max(0.7, Math.min(1.1, 1 + fine * 0.6 + grit * 0.5 - crack * 6));
      }
      p.setXYZ(i, x + cx, y, z); col.set([shade, shade, shade], i * 3); shade0[i] = shade;
      gv[i] = 0.75 + 0.5 * vn(x * 14, y * 14, z * 14); ge[i] = 0.78 + 0.44 * vn(x * 7 + 3, y * 7, z * 7);
    }
    g.computeVertexNormals(); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, map: colourMap, bumpMap: heightMap, bumpScale: 4.2, roughness: 1, metalness: 0 }));
    m.castShadow = m.receiveShadow = true; group.add(m);
    // per vertex: moss (m), earth left behind (e), state (0 bare, 1 greening, 2 green, 3 fading) and when it was last touched
    return { mesh: m, n, shade0, gv, ge, m: new Float32Array(n), e: new Float32Array(n), vs: new Uint8Array(n), vt: new Float32Array(n), busy: false };
  }
  const rocks = [pyramid(-0.975, 3.1, 0)]; await breathe(); rocks.push(pyramid(0.975, 9.7, 2)); await breathe();   // the bases overlap a hair, so no gap shows between them
  // Plain pyramids for finding where the pointer is on the stone (the real ones have tens of thousands of faces).
  const proxies = [-0.975, 0.975].map((cx) => { const g = new THREE.ConeGeometry(Math.SQRT2, HGT, 4, 1, false, Math.PI / 4); g.translate(cx, 0, 0); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ visible: false })); group.add(m); return m; });

  let W = 1, H = 1; refresh();
  function fit() {
    W = panel.clientWidth; H = panel.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    const visH = 2 * 10 * Math.tan(THREE.MathUtils.degToRad(15)), visW = visH * camera.aspect, narrow = camera.aspect < 0.9;
    group.scale.setScalar(Math.min(0.74, (visW * 0.86) / 4.5)); group.position.y = narrow ? -visH * 0.09 : -0.78;
    group.updateMatrixWorld(true); camera.updateMatrixWorld(true); renderer.shadowMap.needsUpdate = true; dirty = true;
    sky.resize(W, H);
  }
  fit();

  // --- where things can grow: points spread over every face that can come into view as the pyramids turn
  const views = [BASE_Y - SWING / 2 - 0.05, BASE_Y, BASE_Y + SWING / 2 + 0.05].map((y) => { group.rotation.y = y; group.updateMatrixWorld(true); return { m: group.matrixWorld.clone(), n: new THREE.Matrix3().getNormalMatrix(group.matrixWorld) }; });
  group.rotation.y = BASE_Y; group.updateMatrixWorld(true);
  const P = new THREE.Vector3(), N = new THREE.Vector3(), V = new THREE.Vector3(), WN = new THREE.Vector3(), WP = new THREE.Vector3(), cand = [];
  for (const r of rocks) {
    const sampler = new MeshSurfaceSampler(r.mesh).build();
    for (let i = 0, n = low ? 10000 : 28000; i < n; i++) {
      sampler.sample(P, N); if (N.y < -0.35) continue;
      if (!views.some((v) => WN.copy(N).applyMatrix3(v.n).normalize().dot(V.copy(camera.position).sub(WP.copy(P).applyMatrix4(v.m)).normalize()) > -0.02)) continue;
      cand.push({ p: P.clone(), n: N.clone() });
    }
  }
  await breathe();
  const C = cand.length, cx = new Float32Array(C), cy = new Float32Array(C), cz = new Float32Array(C), reach = new Float32Array(C), jit = new Float32Array(C);
  const prog = new Float32Array(C), wait = new Float32Array(C), touch = new Float32Array(C), full = new Float32Array(C), state = new Uint8Array(C), kept = new Uint8Array(C), act = new Int32Array(C);
  let actN = 0;
  cand.forEach((c, i) => { cx[i] = c.p.x; cy[i] = c.p.y; cz[i] = c.p.z; reach[i] = 0.55 + 0.6 * fbm(c.p.x * 2.6, c.p.y * 2.6, c.p.z * 2.6) + 0.25 * rnd(); jit[i] = 0.7 * fbm(c.p.x * 3.3 + 7, c.p.y * 3.3, c.p.z * 3.3) + 0.25 * rnd(); });

  // --- the plants, built once as small meshes and drawn many times
  const UP = new THREE.Vector3(0, 1, 0), QS = new THREE.Quaternion(), colr = new THREE.Color(), pick = (a) => a[(rnd() * a.length) | 0];
  const orient = (d, spin) => new THREE.Quaternion().setFromUnitVectors(UP, d).multiply(QS.setFromAxisAngle(UP, spin));
  const dirOf = (n, lift, wob) => new THREE.Vector3(n.x + (rnd() - 0.5) * wob, n.y + lift + (rnd() - 0.5) * wob, n.z + (rnd() - 0.5) * wob).normalize();
  const colour = (g, k) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), c = Array.isArray(k) ? k : [k, k, k]; for (let i = 0; i < n; i++) a.set(c, i * 3); g.setAttribute("color", new THREE.BufferAttribute(a, 3)); return g; };
  function strip(rows, cols, fn) {                                               // a bent sheet: fn(u, v) gives x, y, z and a shade
    const pos = [], col = [], idx = [];
    for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) { const r = fn(i / rows, j / cols); pos.push(r[0], r[1], r[2]); col.push(r[3], r[4], r[5]); }
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const a = i * (cols + 1) + j, b = a + 1, c = a + cols + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  // A blade of grass: narrows to a point, bends over and twists a little; dark at the root, light and warm at the tip.
  const blade = (h, w, bend, twist) => strip(low ? 3 : 4, 1, (u, v) => { const s = (v * 2 - 1) * w * 0.5 * Math.pow(1 - u, 0.85), a = twist * u, k = Math.pow(u, 0.8); return [s * Math.cos(a), h * u * (1 - 0.2 * bend * u), bend * h * u * u + s * Math.sin(a), 0.36 + 0.76 * k, 0.44 + 0.68 * k, 0.3 + 0.55 * k]; });
  function tuft(n) { const parts = []; for (let i = 0; i < n; i++) { const g = blade(0.55 + 0.45 * rnd(), 0.085 + 0.05 * rnd(), 0.18 + 0.32 * rnd(), (rnd() - 0.5) * 1.2); g.rotateX(0.08 + 0.3 * rnd()); g.rotateY((i / n) * 6.283 + rnd() * 0.9); g.translate((rnd() - 0.5) * 0.08, 0, (rnd() - 0.5) * 0.08); parts.push(g); } return mergeGeometries(parts); }
  // A petal: narrow where it joins, round at the end, curling up along its length and cupped across; paler at the tip.
  const petal = (L, W, curl, cup, r0, rows = 6) => strip(rows, 2, (u, v) => { const w = W * Math.pow(Math.sin(Math.PI * Math.min(u, 0.999)), 0.55), e = Math.abs(v - 0.5) * 2, sh = (0.74 + 0.26 * Math.min(1, u * 2.4)) * (1 - 0.06 * (1 - e)); return [r0 + u * L, curl * L * u * u + cup * W * e * e, (v - 0.5) * w, sh, sh, sh]; });
  function ring(n, make, tilt, turn = 0, lift = 0) { const parts = []; for (let i = 0; i < n; i++) { const g = make(); g.rotateZ(tilt()); g.rotateY((i / n) * 6.283 + turn + (rnd() - 0.5) * 0.12); g.translate(0, lift, 0); parts.push(g); } return parts; }
  function eye(r, h, studs) {                                                    // the middle of a flower: a speckled dome
    const g = new THREE.SphereGeometry(1, 16, 10); g.deleteAttribute("uv"); g.scale(r, h, r); g.translate(0, h * 0.3, 0);
    const p = g.attributes.position, c = []; for (let i = 0; i < p.count; i++) { const k = (0.7 + 0.32 * h3(p.getX(i) * 50, p.getY(i) * 50, p.getZ(i) * 50)) * (p.getY(i) > h * 0.3 ? 1 : 0.65); c.push(k, k, k); }
    g.setAttribute("color", new THREE.Float32BufferAttribute(c, 3)); const parts = [g];
    for (let i = 0; i < studs; i++) { const s = new THREE.SphereGeometry(r * 0.13, 5, 4); s.deleteAttribute("uv"); colour(s, 1.15); const a = (i / studs) * 6.283; s.translate(Math.cos(a) * r * 0.92, h * 0.55, Math.sin(a) * r * 0.92); parts.push(s); }
    return studs ? mergeGeometries(parts) : g;
  }
  const STEM_TIP = new THREE.Vector3(0.14, 1, 0), STEM_TAN = new THREE.Vector3(0.28, 0.9, 0).normalize(), STEM = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(0, 0.55, 0), STEM_TIP.clone());
  function stem(r, leaves) {                                                     // a curved stalk with leaves
    const g = colour(new THREE.TubeGeometry(STEM, 10, r, 5, false), 1); g.deleteAttribute("uv"); const parts = [g];
    for (let i = 0; i < leaves; i++) { const l = petal(0.32, 0.1, 0.35, 0.06, 0, 5); l.rotateZ(0.45 + 0.25 * rnd()); l.rotateY(i * 3.1 + rnd() * 0.8); const at = STEM.getPoint(0.2 + i * 0.22); l.translate(at.x, at.y, at.z); parts.push(l); }
    return mergeGeometries(parts);
  }
  const daisyGeo = mergeGeometries(ring(low ? 13 : 16, () => petal(0.9 + 0.2 * rnd(), 0.24, 0.12 + 0.12 * rnd(), 0.05, 0.12), () => 0.1 + 0.12 * rnd()));
  const blossomGeo = () => { const c = colour(new THREE.SphereGeometry(0.12, 6, 4), [1.4, 1.1, 0.45]); c.deleteAttribute("uv"); c.translate(0, 0.05, 0); return mergeGeometries([...ring(5, () => petal(0.55, 0.52, 0.3, 0.12, 0.04, 4), () => 0.32), c]); };
  const cosmosGeo = mergeGeometries([...ring(8, () => petal(1, 0.5, 0.1, 0.08, 0.16, 7), () => 0.12 + 0.06 * rnd()), ...ring(8, () => petal(0.62, 0.4, 0.25, 0.1, 0.12, 5), () => 0.4, 0.39, 0.03)]);

  // Each kind of plant is a pool: only the plants that are growing or standing are drawn, each scaled by its own
  // aGrow (0 to 1) so it can grow out of the stone and wither back into it.
  const growable = (m) => { m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float aGrow;").replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed *= aGrow;"); }; return m; };
  const mat = (o) => new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.7, ...o });
  const M4 = new THREE.Matrix4(), SV = new THREE.Vector3();
  function pool(geo, material, list, vary) {
    const N = Math.max(1, list.length), mats = new Float32Array(N * 16), cols = new Float32Array(N * 3), pid = new Int32Array(N), delay = new Float32Array(N), keep = new Uint8Array(N);
    list.forEach((it, j) => { M4.compose(it.p, it.q, SV.fromArray(it.s)).toArray(mats, j * 16); colr.set(it.c).multiplyScalar(1 - vary / 2 + vary * rnd()).toArray(cols, j * 3); pid[j] = it.id; delay[j] = it.w || 0; keep[j] = it.keep ? 1 : 0; });
    const im = new THREE.InstancedMesh(geo, growable(material), N); im.count = 0;
    im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    const g = new THREE.InstancedBufferAttribute(new Float32Array(N), 1); geo.setAttribute("aGrow", g);
    for (const a of [im.instanceMatrix, im.instanceColor, g]) a.setUsage(THREE.DynamicDrawUsage);
    im.frustumCulled = false; im.receiveShadow = true; group.add(im);
    const start = new Int32Array(C + 1); for (let j = 0; j < list.length; j++) start[pid[j] + 1]++; for (let i = 0; i < C; i++) start[i + 1] += start[i];
    const slot = new Int32Array(N).fill(-1), at = new Int32Array(N), Mx = im.instanceMatrix.array, Kc = im.instanceColor.array, G = g.array;
    let n = 0, moved = false, changed = false;
    return { start, delay, keep, get n() { return n; },
      set(j, v) {
        let s = slot[j];
        if (v <= 0.001) {
          if (s < 0) return;
          const l = --n; if (s !== l) { const o = at[l]; Mx.copyWithin(s * 16, l * 16, l * 16 + 16); Kc.copyWithin(s * 3, l * 3, l * 3 + 3); G[s] = G[l]; at[s] = o; slot[o] = s; }
          slot[j] = -1; moved = changed = true; return;
        }
        if (s < 0) { s = n++; Mx.set(mats.subarray(j * 16, j * 16 + 16), s * 16); Kc.set(cols.subarray(j * 3, j * 3 + 3), s * 3); at[s] = j; slot[j] = s; moved = true; }
        if (G[s] !== v) { G[s] = v; changed = true; }
      },
      flush() {
        if (!changed && !moved) return false;
        im.count = n;
        if (n) { if (moved) for (const a of [im.instanceMatrix, im.instanceColor]) { a.clearUpdateRanges(); a.addUpdateRange(0, n * a.itemSize); a.needsUpdate = true; } g.clearUpdateRanges(); g.addUpdateRange(0, n); g.needsUpdate = true; }
        moved = changed = false; return true;
      } };
  }

  // What grows where. Flowers come in drifts (more where a slow noise is high), and about a third of them are the
  // ones that stay when the meadow withers.
  group.updateMatrixWorld(true);
  const camL = group.worldToLocal(camera.position.clone()), fScale = Math.min(3, 30000 / Math.max(1, C));
  const L = { t0: [], t1: [], stalk: [], head: [], eye: [], bl: [], wild: [] };
  const faceCam = (tip, tan, k) => tan.clone().multiplyScalar(1 - k).add(camL.clone().sub(tip).normalize().multiplyScalar(k)).normalize();
  cand.forEach((c, i) => {
    const sc = (low ? 0.075 : 0.06) + 0.075 * rnd(), wx = 0.85 + 0.4 * rnd();
    (rnd() < 0.5 ? L.t0 : L.t1).push({ id: i, p: c.p.clone().addScaledVector(c.n, -0.004), q: orient(dirOf(c.n, 0.8, 0.45), rnd() * 6.283), s: [sc * wx, sc, sc * wx], c: rnd() < 0.05 ? STRAW : pick(GRASS) });
    const cl = fbm(c.p.x * 1.6 + 4, c.p.y * 1.6, c.p.z * 1.6), clump = 0.15 + 2.2 * Math.max(0, Math.min(1, (cl - 0.4) / 0.22)), u = rnd() / (clump * fScale);
    if (u < 0.016) {                                                              // a daisy on a stalk with a leaf
      const Ls = 0.1 + 0.15 * rnd(), q = orient(dirOf(c.n, 0.9, 0.6), rnd() * 6.283), tip = STEM_TIP.clone().multiplyScalar(Ls).applyQuaternion(q).add(c.p), qh = orient(faceCam(tip, STEM_TAN.clone().applyQuaternion(q), 0.4), rnd() * 6.283), s = 0.027 + 0.02 * rnd(), keep = rnd() < 0.34;
      L.stalk.push({ id: i, p: c.p, q, s: [Ls, Ls, Ls], c: "#6a8a42", w: 0.12, keep });
      L.head.push({ id: i, p: tip, q: qh, s: [s, s, s], c: pick(DAISY), w: 0.5, keep });
      L.eye.push({ id: i, p: tip, q: qh, s: [s, s, s], c: pick(["#ffc21a", "#f5a623"]), w: 0.55, keep });
    } else if (u < 0.021) {                                                       // a long spray of blossom
      const Ls = 0.22 + 0.3 * rnd(), q = orient(dirOf(c.n, 0.4, 0.8), rnd() * 6.283), col = pick(BLOSSOM), keep = rnd() < 0.25;
      L.stalk.push({ id: i, p: c.p, q, s: [Ls, Ls, Ls], c: "#7a8f58", w: 0.1, keep });
      for (let k = 0, n = 6 + ((rnd() * 5) | 0); k < n; k++) {
        const t = 0.55 + 0.45 * rnd(), at = STEM.getPoint(t).multiplyScalar(Ls).applyQuaternion(q).add(c.p).add(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.07 * Ls)), s = 0.012 + 0.01 * rnd();
        L.bl.push({ id: i, p: at, q: orient(faceCam(at, STEM.getTangent(t).applyQuaternion(q), 0.5), rnd() * 6.283), s: [s, s, s], c: col, w: 0.4 + 0.4 * t, keep });
      }
    } else if (u < 0.033) {                                                       // a small wildflower among the grass
      const s = 0.012 + 0.012 * rnd(), p = c.p.clone().addScaledVector(c.n, 0.03 + 0.03 * rnd());
      L.wild.push({ id: i, p, q: orient(faceCam(p, c.n.clone(), 0.45), rnd() * 6.283), s: [s, s, s], c: pick(WILD), w: 0.3, keep: rnd() < 0.2 });
    }
  });
  await breathe();
  const grassMat = () => mat({ roughness: 0.8 });
  const meadow = [pool(tuft(low ? 4 : 5), grassMat(), L.t0, 0.35), pool(tuft(low ? 3 : 4), grassMat(), L.t1, 0.35), pool(stem(0.02, 1), mat({ roughness: 0.75 }), L.stalk, 0.2),
    pool(daisyGeo, mat({ roughness: 0.55 }), L.head, 0.1), pool(eye(0.24, 0.12, 0), mat({ roughness: 0.8, side: THREE.FrontSide }), L.eye, 0.15), pool(blossomGeo(), mat({ roughness: 0.55 }), L.bl, 0.2), pool(blossomGeo(), mat({ roughness: 0.55 }), L.wild, 0.25)];

  // --- the flowers planted by a click: a stalk with two leaves, a cosmos-like head and a studded middle
  const CAP = 120, born = new Float32Array(CAP), done = new Uint8Array(CAP); let planted = 0;
  function fixed(geo, material) { const im = new THREE.InstancedMesh(geo, growable(material), CAP); im.count = 0; const g = new THREE.InstancedBufferAttribute(new Float32Array(CAP), 1); g.setUsage(THREE.DynamicDrawUsage); geo.setAttribute("aGrow", g); im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 3), 3); im.frustumCulled = false; im.receiveShadow = true; group.add(im); return im; }
  const heroStem = fixed(stem(0.026, 2), mat({ roughness: 0.75 })), heroHead = fixed(cosmosGeo, mat({ roughness: 0.5 })), heroEye = fixed(eye(0.26, 0.17, 16), mat({ roughness: 0.8, side: THREE.FrontSide }));
  const place = (im, k, p, q, s, c) => { im.setMatrixAt(k, M4.compose(p, q, SV.setScalar(s))); im.setColorAt(k, colr.set(c)); im.geometry.attributes.aGrow.array[k] = 0; };
  function plant(p, n) {
    const k = planted % CAP, R = Math.random, Ls = (low ? 0.36 : 0.32) + 0.12 * R(), q = orient(new THREE.Vector3(n.x + (R() - 0.5) * 0.3, n.y + 0.95, n.z + (R() - 0.5) * 0.3).normalize(), R() * 6.283);
    const tip = STEM_TIP.clone().multiplyScalar(Ls).applyQuaternion(q).add(p), cam = group.worldToLocal(camera.position.clone()).sub(tip).normalize(), hd = STEM_TAN.clone().applyQuaternion(q).multiplyScalar(0.55).add(cam.multiplyScalar(0.45)).normalize();
    const qh = orient(hd, R() * 6.283), hs = (low ? 0.09 : 0.08) + 0.026 * R(), look = HERO[(R() * HERO.length) | 0];
    place(heroStem, k, p.clone().addScaledVector(n, -0.012), q, Ls, "#5f7f3a"); place(heroHead, k, tip, qh, hs, look.petal); place(heroEye, k, tip.clone().addScaledVector(hd, hs * 0.04), qh, hs, look.eye);
    born[k] = clock; done[k] = 0; planted++;
    for (const m of [heroStem, heroHead, heroEye]) { m.count = Math.min(planted, CAP); m.instanceMatrix.needsUpdate = m.instanceColor.needsUpdate = true; }
  }

  const REACH = 0.44;                                                           // how far one touch of the pointer reaches


  // --- growing and withering
  const lin = (c) => [c.r, c.g, c.b], b3 = lin(base), mossT = lin(new THREE.Color(MOSS)).map((v, k) => (v / b3[k]) * 1.25), earthT = lin(new THREE.Color(EARTH)).map((v, k) => v / b3[k]);
  const HOLD = 2;                                                                // seconds a patch stays green before it withers
  let clock = 0;
  function grow(at3, radius) {
    const r2 = radius * radius;
    for (let i = 0; i < C; i++) {
      const dx = cx[i] - at3.x, dy = cy[i] - at3.y, dz = cz[i] - at3.z, d2 = dx * dx + dy * dy + dz * dz; if (d2 >= r2 * reach[i] * reach[i]) continue;
      touch[i] = clock; const s = state[i];
      if (s === 0) { state[i] = 1; wait[i] = reduced ? 0 : (Math.sqrt(d2) / radius) * 0.45 + rnd() * 0.25; act[actN++] = i; }
      else if (s === 3) { state[i] = 1; wait[i] = 0; }
    }
    const s2 = r2 * 1.15;
    for (const r of rocks) { const p = r.mesh.geometry.attributes.position.array; for (let i = 0; i < r.n; i++) { const dx = p[i * 3] - at3.x, dy = p[i * 3 + 1] - at3.y, dz = p[i * 3 + 2] - at3.z; if (dx * dx + dy * dy + dz * dz < s2 * (0.7 + 0.6 * r.gv[i] - 0.3)) { r.vt[i] = clock; if (r.vs[i] !== 1 && r.vs[i] !== 2) r.vs[i] = 1; r.busy = true; } } }
  }
  const back = (u) => { const v = u - 1; return 1 + 2.3 * v * v * v + 1.3 * v * v; }, pop = (u) => { const v = u - 1; return 1 + 2.7 * v * v * v + 1.7 * v * v; }, smooth = (u) => u * u * (3 - 2 * u);
  function paintPoint(i) {
    const t = prog[i], wither = state[i] === 3, kp = kept[i];
    for (const Pl of meadow) for (let j = Pl.start[i], e = Pl.start[i + 1]; j < e; j++) {
      if (kp && Pl.keep[j]) { Pl.set(j, 1); continue; }
      const w = Pl.delay[j], u = t <= w ? 0 : (t - w) / (1 - w);
      Pl.set(j, u <= 0 ? 0 : wither ? smooth(u) : back(u));
    }
  }
  function advance(dt) {
    for (let k = actN - 1; k >= 0; k--) {
      const i = act[k], s = state[i];
      if (s === 1) { if (wait[i] > 0) { wait[i] -= dt; continue; } prog[i] = Math.min(1, prog[i] + (dt * RATE) / 0.85); if (prog[i] >= 1) { state[i] = 2; full[i] = clock; kept[i] = 1; } paintPoint(i); }
      else if (s === 2) { if (clock - Math.max(touch[i], full[i]) > HOLD + jit[i]) state[i] = 3; }
      else { prog[i] = Math.max(0, prog[i] - (dt * RATE) / 1.2); paintPoint(i); if (prog[i] <= 0) { state[i] = 0; act[k] = act[--actN]; } }
    }
    for (const Pl of meadow) if (Pl.flush()) dirty = true;
    for (const r of rocks) if (r.busy) {
      let any = false, chg = false; const c = r.mesh.geometry.attributes.color.array;
      for (let i = 0; i < r.n; i++) {
        const s = r.vs[i]; if (!s) continue; any = true;
        if (s === 1) { r.m[i] = Math.min(1, r.m[i] + (dt * RATE) / 1.0); if (r.m[i] >= 1) r.vs[i] = 2; }
        else if (s === 2) { if (clock - r.vt[i] > HOLD + 1.1 + 0.6 * r.ge[i]) r.vs[i] = 3; continue; }
        else { r.m[i] = Math.max(0, r.m[i] - (dt * RATE) / 1.5); r.e[i] = Math.min(1, r.e[i] + (dt * RATE) / 1.5); if (r.m[i] <= 0) r.vs[i] = 0; }
        const b0 = r.shade0[i], k = smooth(r.m[i]), ee = r.e[i] * EA, g = r.gv[i], ge = r.ge[i];
        for (let ch = 0; ch < 3; ch++) { const E = b0 * (1 + (earthT[ch] * ge - 1) * ee); c[i * 3 + ch] = E + (mossT[ch] * g - E) * k; }
        chg = true;
      }
      if (chg) { r.mesh.geometry.attributes.color.needsUpdate = true; dirty = true; }
      r.busy = any;
    }
    let anim = false;
    for (let k = 0, n = Math.min(planted, CAP); k < n; k++) if (!done[k]) {
      const t = (clock - born[k]) * RATE, a = Math.min(1, t / 0.75), b = Math.min(1, Math.max(0, (t - 0.4) / 0.7));
      heroStem.geometry.attributes.aGrow.array[k] = a <= 0 ? 0 : back(a); heroHead.geometry.attributes.aGrow.array[k] = heroEye.geometry.attributes.aGrow.array[k] = b <= 0 ? 0 : pop(b);
      if (b >= 1) done[k] = 1; anim = true;
    }
    if (anim) { for (const m of [heroStem, heroHead, heroEye]) m.geometry.attributes.aGrow.needsUpdate = true; dirty = true; }
  }

  // --- the pointer: turns the pyramids, grows the meadow, moves the ground; a click plants a flower
  const ray = new THREE.Raycaster(), ptr = { x: 0, y: 0, moved: false, over: false, in: false }, ndc = new THREE.Vector2(), rot = { y: BASE_Y, t: BASE_Y };
  const aim = (px, py) => { const r = canvas.getBoundingClientRect(); ndc.set(((px - r.left) / r.width) * 2 - 1, -((py - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); };
  const point = (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.moved = ptr.in = true; const r = panel.getBoundingClientRect(); rot.t = BASE_Y + ((e.clientX - r.left) / r.width - 0.5) * SWING; pointGround(e, true); start(); };
  panel.addEventListener("pointermove", point); panel.addEventListener("pointerdown", point);
  panel.addEventListener("pointerleave", (e) => { ptr.over = ptr.in = false; pointGround(e, false); });
  panel.addEventListener("pointerup", (e) => { if (e.pointerType === "touch") panel.classList.remove("lit"); });
  panel.addEventListener("click", (e) => {
    if (e.target.closest("a, button, .hero-cue")) return;
    aim(e.clientX, e.clientY); const h = ray.intersectObjects(rocks.map((r) => r.mesh))[0];
    if (h) { plant(group.worldToLocal(h.point.clone()), h.face.normal.clone()); start(); }
  });

  let last = performance.now(), lastHit = 0, glFrames = 0, lean = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
    if (Math.abs(rot.t - rot.y) > 0.0004) {                                       // the front faces turn toward the pointer
      rot.y += (rot.t - rot.y) * (1 - Math.exp(-dt * (reduced ? 30 : 3.2))); group.rotation.y = rot.y; group.updateMatrixWorld(true);
      renderer.shadowMap.needsUpdate = true; dirty = true; if (ptr.over && clock - lastHit > 0.06) ptr.moved = true;   // keep growing as the stone turns under the pointer
    }
    if (ptr.moved && ptr.in) {
      ptr.moved = false; lastHit = clock; aim(ptr.x, ptr.y); const h = ray.intersectObjects(proxies)[0]; ptr.over = !!h;
      if (h) grow(group.worldToLocal(h.point.clone()), REACH);
    }
    advance(dt);
    sky.update(dt, clock);
    const ln = sky.lean(); if (Math.abs(ln - lean) > 0.0005) { lean = ln; rim.position.x = 5 + lean * 30; dirty = true; }   // the back light leans with the sun glow
    if (dirty) { dirty = false; renderer.render(scene, camera); glFrames++; }
    else if (reduced && !actN && !rocks[0].busy && !rocks[1].busy) stop();       // with reduced motion nothing drifts: wait for the pointer
  }
  function start() { if (!raf && seen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  kick = start;
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else { dirty = true; start(); } });
  if ("IntersectionObserver" in window) new IntersectionObserver((en) => { seen = en[en.length - 1].isIntersecting; if (seen) { dirty = true; start(); } else stop(); }).observe(panel);
  let rt = 0; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { panel.style.setProperty("--navw", document.querySelector(".top").offsetWidth + "px"); fit(); start(); }, 120); });

  renderer.render(scene, camera); panel.classList.add("live"); start();
  window.__grow = { bg: applyBg, get points() { return C; }, get active() { return actN; }, get drawn() { return meadow.reduce((a, p) => a + p.n, 0); }, get flowers() { return planted; }, get turn() { return group.rotation.y; }, get frames() { return glFrames; }, low };
}
init().catch((e) => console.error("hero-grow:", e));
