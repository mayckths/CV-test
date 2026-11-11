// One WebGL layer that only ever draws inside a panel (hero or footer):
//   - hero background: a dark ground with a drifting haze of the blue, faint stars, and a light that trails the cursor.
//   - hero figure: two pyramids drawn in soft particles (an M), alone on the panel. As the pinned
//     hero scrolls, the particles re-form as "I DESIGN" in 3D, still only pixels, between two role labels.
//     When the hero leaves, they travel down and reshape into the "I design" that opens the headline.
//   - footer: the particle pyramids again, on the dark panel.
// Particles step away from the cursor. The slots are real buttons: drag to turn, press to scatter.
import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";

const FONT_URL = "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json";

const canvas = document.getElementById("stage");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

function init(font) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch (e) {
    canvas.remove();
    return;
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.z = 10;
  const mobile = window.innerWidth < 820;

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-3, 4, 6);
  scene.add(key);

  // --- The words, as places for the particles ---
  // "I DESIGN" is never a solid object. The letters are filled with an even grid of points, like a dot-matrix
  // print: one layer, one size, one colour, so the words read calmly. Returns points in units of the text's
  // width (x from -0.5 to 0.5) and the spacing between them.
  function wordGrid(text, want) {
    const shapes = font.generateShapes(text, 100);
    const box = new THREE.Box2();
    const rings = shapes.map((sh) => [sh.getPoints(10), ...sh.holes.map((h) => h.getPoints(10))]);
    rings.forEach((rs) => rs[0].forEach((pt) => box.expandByPoint(pt)));
    const w = box.max.x - box.min.x, h = box.max.y - box.min.y, W = 1400, k = W / w, H = Math.ceil(h * k);
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.beginPath();
    rings.forEach((rs) => rs.forEach((ring) => {
      ring.forEach((pt, n) => { const x = (pt.x - box.min.x) * k, y = H - (pt.y - box.min.y) * k; if (n) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.closePath();
    }));
    ctx.fill("evenodd");
    const data = ctx.getImageData(0, 0, W, H).data;
    let ink = 0;
    for (let n = 3; n < data.length; n += 4) if (data[n] > 128) ink++;
    const g = Math.sqrt((ink / (W * W)) / want);           // spacing that gives about `want` points
    const pts = [];
    for (let y = g / 2; y < H / W; y += g) for (let x = g / 2; x < 1; x += g) {
      if (data[(Math.min(H - 1, Math.floor(y * W)) * W + Math.floor(x * W)) * 4 + 3] > 128) pts.push(x - 0.5, (H / W) / 2 - y);
    }
    return { pts, g };
  }

  // --- Pyramids: two side by side read as an M. They are only ever drawn in particles. ---
  const PYR = mobile ? 1.0 : 0.6;            // size relative to the width of the words
  const PR = 0.36 * PYR, PH = 0.64 * PYR, PX = PR * Math.SQRT1_2, PYR_W = 4 * PX;
  const pyrGeo = new THREE.ConeGeometry(PR, PH, 4, 1);
  pyrGeo.rotateY(Math.PI / 4);                  // a flat face to the front

  // --- Background: a dark ground with a slow haze of the blue drifting across it and a few faint stars.
  //     The haze leans toward the cursor and a soft light follows it. ---
  const BG_Z = -1.6;
  const srgb = (hex) => { const c = new THREE.Color(hex); return new THREE.Vector3(...c.convertLinearToSRGB().toArray()); };   // keep CSS values as written
  const bgMat = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, alphaToCoverage: true,
    uniforms: {
      uDeep: { value: srgb("#0d0730") }, uBase: { value: srgb("#22126d") }, uLight: { value: srgb("#4330c4") },
      uTime: { value: 0 }, uDpr: { value: 1 }, uPointer: { value: new THREE.Vector2(0.7, 0.3) },
      uRect: { value: new THREE.Vector4() }, uRadius: { value: 28 },
    },
    vertexShader: `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 uDeep, uBase, uLight; uniform float uRadius, uTime, uDpr; uniform vec4 uRect; uniform vec2 uPointer;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; } return s; }
      void main() {
        vec2 px = gl_FragCoord.xy - uRect.xy, uv = px / uRect.zw;
        float A = uRect.z / uRect.w;
        vec2 p = vec2(uv.x * A, uv.y), m = vec2(uPointer.x * A, uPointer.y);
        // Haze: warped noise gives long soft bands; it drifts on its own and slides against the cursor.
        float t = uTime * 0.03;
        vec2 q = p * 0.95 + vec2(t, -t * 0.6) - (m - vec2(0.5 * A, 0.5)) * 0.22;
        float n = fbm(q + fbm(q * 0.8 - t) * 0.9);
        float band = smoothstep(0.40, 0.80, n);
        float near = exp(-dot(p - m, p - m) / 0.16);                       // a soft light where the cursor is
        vec3 col = mix(uDeep, uBase, clamp(band + near * 0.55, 0.0, 1.0));
        col = mix(col, uLight, clamp(band * band * 0.34 + near * 0.26, 0.0, 1.0));
        // Stars: one faint point in some cells of a grid, twinkling, shifting a few pixels with the cursor.
        vec2 sp = (px / uDpr + (uPointer - 0.5) * 16.0) / 56.0, id = floor(sp), f = fract(sp);
        float h = hash(id);
        vec2 o = 0.2 + 0.6 * vec2(hash(id + 7.7), hash(id + 13.3));
        float tw = 0.55 + 0.45 * sin(uTime * (0.4 + h * 1.4) + h * 40.0);
        col += step(0.5, h) * smoothstep(0.7 + h * 0.9, 0.0, length(f - o) * 56.0) * tw * vec3(0.74, 0.72, 1.0) * 0.6;
        col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;                      // no banding
        col = pow(max(col, 0.0), vec3(2.2));
        // Rounded corners of the panel.
        vec2 c = gl_FragCoord.xy - (uRect.xy + uRect.zw * 0.5);
        vec2 r = abs(c) - uRect.zw * 0.5 + uRadius;
        float d = length(max(r, 0.0)) + min(max(r.x, r.y), 0.0) - uRadius;
        gl_FragColor = vec4(col, clamp(0.5 - d, 0.0, 1.0));
        #include <colorspace_fragment>
      }`,
  });
  const bgGeo = new THREE.PlaneGeometry(1, 1);
  const bgPlane = new THREE.Mesh(bgGeo, bgMat);
  bgPlane.renderOrder = -10;
  bgPlane.frustumCulled = false;
  bgPlane.visible = false;
  scene.add(bgPlane);

  const hero = document.querySelector(".hero.panel"), heroWrap = document.querySelector(".hero-wrap");

  // --- Particles: motes that hold the pyramids, the words, or the headline lettering ---
  const COUNT = mobile ? 2800 : 5600;
  const grid = wordGrid("I DESIGN", COUNT / 2);   // two motes share each point, so every point is solid
  const pyrSampler = new MeshSurfaceSampler(new THREE.Mesh(pyrGeo)).build();
  const target = new Float32Array(COUNT * 3), pyr = new Float32Array(COUNT * 3), scatter = new Float32Array(COUNT * 3), colour = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT), sizes = new Float32Array(COUNT);
  const palette = ["#ffffff", "#f3d9ff", "#c9a2ff", "#9a63f5", "#ff9fd0", "#ffd8c2"].map((c) => new THREE.Color(c));
  const v = new THREE.Vector3();
  for (let i = 0; i < COUNT; i++) {
    const gp = (i % (grid.pts.length / 2)) * 2;
    target.set([grid.pts[gp], grid.pts[gp + 1], 0], i * 3);
    if (i % 5 < 2) {
      // On an edge: from the apex to a base corner, or along the base.
      const k = Math.floor(Math.random() * 4), a = (k * Math.PI) / 2 + Math.PI / 4, b = a + Math.PI / 2, u = Math.random();
      const ax = Math.sin(a) * PR, az = Math.cos(a) * PR, bx = Math.sin(b) * PR, bz = Math.cos(b) * PR;
      if (Math.random() < 0.55) v.set(ax * u, PH / 2 - PH * u, az * u); else v.set(ax + (bx - ax) * u, -PH / 2, az + (bz - az) * u);
    } else pyrSampler.sample(v);
    pyr.set([v.x + (i % 2 ? PX : -PX), v.y, v.z], i * 3);
    scatter.set([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1], i * 3);
    const col = palette[Math.floor(Math.random() * palette.length)];
    colour.set([col.r, col.g, col.b], i * 3);
    seed[i] = Math.random();
    sizes[i] = 0.007 + 0.02 * Math.pow(Math.random(), 3.2);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(target, 3));
  pGeo.setAttribute("aPyr", new THREE.BufferAttribute(pyr, 3));
  // Where each mote sits in the headline's own "I design", sampled from the real lettering once fonts load.
  const leadPts = new Float32Array(COUNT * 3);
  const leadAttr = new THREE.BufferAttribute(leadPts, 3);
  pGeo.setAttribute("aLead", leadAttr);
  pGeo.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
  pGeo.setAttribute("aColor", new THREE.BufferAttribute(colour, 3));
  pGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  pGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const uniforms = {
    uForm: { value: 0 }, uAngle: { value: 0 }, uTilt: { value: 0 }, uScale: { value: 1 }, uTime: { value: 0 }, uPx: { value: 1 }, uMote: { value: 1 }, uMorph: { value: 0 }, uFade: { value: 1 }, uLand: { value: 0 },
    uCenter: { value: new THREE.Vector3() }, uPanelC: { value: new THREE.Vector2() }, uPanelH: { value: new THREE.Vector2(1, 1) },
    uPointer: { value: new THREE.Vector2(99, 99) }, uHole: { value: 0.5 }, uWord: { value: new THREE.Color("#f5ebe3") }, uDot: { value: grid.g * 1.75 },
  };
  const pMat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: `
      attribute vec3 aPyr; attribute vec3 aLead; attribute vec3 aScatter; attribute vec3 aColor; attribute float aSeed; attribute float aSize;
      uniform float uForm, uAngle, uTilt, uScale, uTime, uPx, uMote, uMorph, uFade, uLand, uHole, uDot;
      uniform vec3 uCenter; uniform vec3 uWord; uniform vec2 uPanelC; uniform vec2 uPanelH; uniform vec2 uPointer;
      varying vec3 vColor; varying float vAlpha; varying float vCore; varying float vEdge;
      void main() {
        // Each mote joins at its own moment, so the letter gathers instead of snapping.
        float m = smoothstep(0.0, 1.0, clamp(uForm * 1.5 - aSeed * 0.5, 0.0, 1.0));
        float c = cos(uAngle), s = sin(uAngle);
        vec3 words = mix(position, aLead, uLand);
        vec3 t = mix(aPyr, words, uMorph) * uScale;
        vec3 turned = vec3(t.x * c + t.z * s, t.y, -t.x * s + t.z * c);
        float ct = cos(uTilt), sn = sin(uTilt);                    // then pitched, so the figure can face the cursor
        turned = vec3(turned.x, turned.y * ct - turned.z * sn, turned.y * sn + turned.z * ct);
        vec3 formed = turned + uCenter;
        vec3 loose = vec3(uPanelC + aScatter.xy * uPanelH * 0.96, aScatter.z * 1.2);
        loose.xy += vec2(sin(uTime * 0.25 + aSeed * 30.0), cos(uTime * 0.21 + aSeed * 21.0)) * 0.08;
        vec3 p = mix(loose, formed, m);
        // The cursor is an attractor: motes within reach are drawn in toward it and circle it, and go home when it leaves.
        // Wherever it is on the panel, every mote also leans a little toward it, each by its own amount
        // (the dots of the words all by the same amount, so their grid stays even).
        // None of this applies while the motes are landing on the headline.
        float free = 1.0 - uLand;
        vec2 d = p.xy - uPointer;
        float len = length(d);
        float f = smoothstep(uHole, 0.0, len);
        f *= f * free * (1.0 - 0.8 * uMorph);                     // the words' grid is barely disturbed
        float lean = 0.05 / (1.0 + len * len * 0.12) * mix(0.4 + 1.2 * fract(aSeed * 5.3), 0.6, uMorph) * free;
        d *= 1.0 - f * 0.26 - lean * (1.0 - f);                    // a gentle draw, not a grab
        float a = f * (0.22 + 0.14 * sin(uTime * 0.9 + aSeed * 31.0));
        p.xy = uPointer + vec2(d.x * cos(a) - d.y * sin(a), d.x * sin(a) + d.y * cos(a));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        // As the words every mote is the same size, set by the grid, so the letters are an even field of dots.
        float word = uMorph * (1.0 - uLand);
        gl_PointSize = max(uPx * uMote * mix(aSize, uDot, word) * (10.0 / -mv.z) * uFade, 0.0);
        // Landing on the headline, the motes take the ink of the type they are becoming.
        // As the words they warm toward the page's beige; landing on the headline they take the ink of the type.
        vColor = mix(mix(aColor, uWord, uMorph), vec3(0.015, 0.012, 0.012), uLand);
        vCore = 1.0 - max(uLand, uMorph);                           // no bright core on the dots of the words
        vAlpha = mix(0.7 + 0.3 * aSeed, 1.0, max(uLand, uMorph)) * uFade;
        vEdge = word;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vAlpha; varying float vCore; varying float vEdge;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, mix(0.2, 0.4, vEdge), r);          // the dots of the words have a crisper edge
        vec3 col = mix(vColor, vec3(1.0), smoothstep(0.3, 0.0, r) * 0.55 * vCore);
        gl_FragColor = vec4(col, a * vAlpha);
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(pGeo, pMat);
  points.frustumCulled = false;
  points.renderOrder = 5;
  scene.add(points);

  const view = { w: 1, h: 1, vw: 1, vh: 1, dpr: 1 };
  function resize() {
    view.vw = window.innerWidth;
    view.vh = window.innerHeight;
    view.dpr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);
    renderer.setPixelRatio(view.dpr);
    renderer.setSize(view.vw, view.vh, false);
    camera.aspect = view.vw / view.vh;
    camera.updateProjectionMatrix();
    view.h = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    view.w = view.h * camera.aspect;
    uniforms.uPx.value = (view.vh * view.dpr) / view.h;
  }
  const wx = (px) => (px / view.vw - 0.5) * view.w, wy = (px) => (0.5 - px / view.vh) * view.h, wl = (px) => px * (view.h / view.vh);

  const heroSlot = document.getElementById("m-hero"), footSlot = document.getElementById("m-foot");
  const lead = document.querySelector(".h1-lead");
  const panelRadius = hero ? parseFloat(getComputedStyle(hero).borderTopLeftRadius) || 0 : 0;
  const stickyTop = hero ? parseFloat(getComputedStyle(hero).top) || 0 : 0;
  let leadShown = "";
  function sampleLead() {
    if (!lead) return;
    const r = lead.getBoundingClientRect();
    if (r.width < 2) return;
    const W = 640, H = Math.max(8, Math.round((W * r.height) / r.width)), k = W / r.width;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    const cs = getComputedStyle(lead);
    ctx.font = `${cs.fontWeight} ${parseFloat(cs.fontSize) * k}px ${cs.fontFamily}`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${parseFloat(cs.letterSpacing) * k || 0}px`;
    ctx.textBaseline = "alphabetic";
    const m = ctx.measureText(lead.textContent);
    const asc = m.fontBoundingBoxAscent || H * 0.78, desc = m.fontBoundingBoxDescent || H * 0.22;
    ctx.fillText(lead.textContent, 0, (H * asc) / (asc + desc));
    const data = ctx.getImageData(0, 0, W, H).data, filled = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 128) filled.push(x, y);
    if (!filled.length) return;
    for (let i = 0; i < COUNT; i++) {
      const j = Math.floor(Math.random() * (filled.length / 2)) * 2;
      leadPts.set([(filled[j] + Math.random()) / W - 0.5, (H / 2 - filled[j + 1] - Math.random()) / W, 0], i * 3);
    }
    leadAttr.needsUpdate = true;
  }
  const showLead = (v) => { const s = v.toFixed(2); if (s !== leadShown) { leadShown = s; document.documentElement.style.setProperty("--lead", s); } };
  const footPanel = document.querySelector(".foot.panel");
  // The pyramids are simply there on load (form and intro start complete); only the hero's text has an entrance.
  const st = { form: 1, burst: 0, burstT: -1, spin: 0, vel: 0, dragging: false, intro: 1, mode: null, hp: 0, q: 0,
    pointer: new THREE.Vector2(99, 99), pointerGoal: new THREE.Vector2(99, 99), tilt: new THREE.Vector2(), idle: 1,
    bgPointer: new THREE.Vector2(0.7, 0.3), bgGoal: new THREE.Vector2(0.7, 0.3) };
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const onScreen = (r) => r && r.width > 0 && r.bottom > 0 && r.top < view.vh;

  // Decide which panel owns the M right now, place everything on it, and return how formed it should be.
  function anchor() {
    const hr = hero ? hero.getBoundingClientRect() : null, fr = footPanel ? footPanel.getBoundingClientRect() : null;
    const mode = onScreen(hr) ? "hero" : onScreen(fr) ? "foot" : null;
    st.mode = mode;
    if (!mode) return 0;
    const panel = mode === "hero" ? hr : fr, slot = (mode === "hero" ? heroSlot : footSlot).getBoundingClientRect();
    uniforms.uCenter.value.set(wx(slot.left + slot.width / 2), wy(slot.top + slot.height / 2), 0);
    uniforms.uScale.value = mode === "hero" ? wl(slot.width * 0.96) : wl((slot.width * 0.92) / PYR_W);
    uniforms.uMote.value = wl(mode === "hero" ? slot.height * 2.3 : slot.height * 0.75);
    uniforms.uPanelC.value.set(wx(panel.left + panel.width / 2), wy(panel.top + panel.height / 2));
    uniforms.uPanelH.value.set(wl(panel.width / 2), wl(panel.height / 2));
    // Nothing is ever drawn outside the panel.
    const x = Math.max(0, panel.left), y = Math.max(0, panel.top), r = Math.min(view.vw, panel.right), b = Math.min(view.vh, panel.bottom);
    renderer.setScissor(x, view.vh - b, Math.max(0, r - x), Math.max(0, b - y));
    if (mode === "hero") {
      // Background plane behind everything, covering the panel exactly.
      const fb = (10 - BG_Z) / 10, u = bgMat.uniforms;
      bgPlane.position.set(wx(hr.left + hr.width / 2) * fb, wy(hr.top + hr.height / 2) * fb, BG_Z);
      bgPlane.scale.set(wl(hr.width) * fb, wl(hr.height) * fb, 1);
      u.uRect.value.set(hr.left * view.dpr, (view.vh - hr.bottom) * view.dpr, hr.width * view.dpr, hr.height * view.dpr);
      u.uRadius.value = panelRadius * view.dpr;
      const wr = heroWrap ? heroWrap.getBoundingClientRect() : hr;
      st.hp = reduced ? 0 : clamp01(-wr.top / Math.max(1, wr.height - view.vh));
      if (!mobile) {
        // As pyramids the figure sits a little right of centre and lower, clear of the headline; it centres as it becomes the words.
        const k = 1 - THREE.MathUtils.smoothstep(st.hp, 0.05, 0.3), c0 = uniforms.uCenter.value;
        c0.x += wl(hr.width * 0.055) * k;
        c0.y -= wl(hr.height * 0.045) * k;
      }
      // Once the pin ends the panel scrolls away; q runs 0 to 1 over that exit.
      st.q = reduced || !lead ? 0 : clamp01((stickyTop - hr.top) / Math.max(1, hr.height));
      if (st.q > 0) {
        // The words travel from the panel onto the "I design" that opens the headline, and nothing clips them.
        const lr = lead.getBoundingClientRect(), e = THREE.MathUtils.smoothstep(st.q, 0, 0.78);   // landed before they dissolve
        const c = uniforms.uCenter.value;
        c.set(c.x + (wx(lr.left + lr.width / 2) - c.x) * e, c.y + (wy(lr.top + lr.height / 2) - c.y) * e, 0);
        uniforms.uScale.value += (wl(lr.width) - uniforms.uScale.value) * e;
        uniforms.uMote.value += (wl(lr.height * 0.55) - uniforms.uMote.value) * e;
        renderer.setScissor(0, 0, view.vw, view.vh);
      }
      return reduced || !lead ? clamp01(1 - (-hr.top / (hr.height * 0.6))) : 1;
    }
    return clamp01((view.vh * 0.98 - slot.top) / (view.vh * 0.45));
  }

  const clock = new THREE.Clock();
  let t = 0, raf = 0, cleared = false;
  function step(dt) {
    t += dt;
    const goal = anchor();
    if (st.mode !== "hero") showLead(1);
    if (!st.mode) {
      if (!cleared) { renderer.setScissorTest(false); renderer.clear(); cleared = true; }
      return;
    }
    cleared = false;
    // Load: a short hold, then the motes gather.
    if (st.intro < 1) st.intro = Math.min(1, st.intro + dt / 1.9);
    const introForm = THREE.MathUtils.smoothstep(st.intro, 0.25, 1);
    if (st.burstT >= 0) {
      st.burstT += dt;
      // Out in 0.3 s, a short beat, back in 0.6 s.
      const b = st.burstT, u = (b - 0.42) / 0.6;
      st.burst = b < 0.3 ? 1 - Math.pow(1 - b / 0.3, 3) : b < 0.42 ? 1 : Math.max(0, 1 - u * u * (3 - 2 * u));
      if (b > 1.02) { st.burst = 0; st.burstT = -1; }
    }
    const want = goal * introForm * (1 - st.burst);
    st.form += (want - st.form) * (reduced ? 1 : 1 - Math.exp(-dt * 12));
    if (!st.dragging) {
      st.spin += st.vel * dt;
      st.vel *= Math.exp(-dt * 1.6);
      if (Math.abs(st.vel) < 0.6) st.spin += (Math.round(st.spin / (Math.PI * 2)) * Math.PI * 2 - st.spin) * (1 - Math.exp(-dt * 1.2));
    }
    const isHero = st.mode === "hero", SS = THREE.MathUtils.smoothstep;
    const hp = isHero ? st.hp : 0, q = isHero ? st.q : 0;
    // Only the pyramids face the cursor and sway. By the time the words have formed they face front and stay
    // still, through the rest of the pinned hero and all the way down into the sentence.
    const settle = (isHero ? 1 - SS(hp, 0.26, 0.4) : 1) * (1 - SS(q, 0, 0.3));
    // The figure faces the cursor: yaw and pitch follow where the pointer is. With no cursor (touch, or it has
    // left the page) it faces front and sways a little more on its own.
    const ctr = uniforms.uCenter.value, away = st.pointer.x > 50, ease = reduced ? 1 : 1 - Math.exp(-dt * 5);
    st.idle += ((away ? 1 : 0) - st.idle) * ease;
    const clampTo = THREE.MathUtils.clamp;
    st.tilt.y += ((away ? 0 : clampTo((st.pointer.x - ctr.x) / (view.w * 0.5), -1, 1) * 0.34) - st.tilt.y) * ease;
    st.tilt.x += ((away ? 0 : clampTo((st.pointer.y - ctr.y) / (view.h * 0.5), -1, 1) * -0.2) - st.tilt.x) * ease;
    const tx = reduced ? 0 : st.tilt.x * settle, ty = reduced ? 0 : st.tilt.y * settle;
    const sway = (reduced ? -0.35 : Math.sin(t * 0.5) * (0.06 + 0.3 * st.idle)) * settle;
    const angle = sway + st.spin * settle;   // no turn on scroll: the pyramids become the words where they stand
    st.pointer.lerp(st.pointerGoal, reduced ? 1 : 1 - Math.exp(-dt * 10));
    // Hero choreography: pyramids, then motes that re-form, then the words, then the landing.
    uniforms.uForm.value = st.form;
    uniforms.uAngle.value = angle + ty;
    uniforms.uTilt.value = tx;
    uniforms.uTime.value = reduced ? 0 : t;
    uniforms.uMorph.value = isHero ? SS(hp, 0.1, 0.36) : 0;      // pyramids re-form as the words; the footer keeps the pyramids
    uniforms.uLand.value = isHero ? SS(q, 0.28, 0.76) : 0;               // capitals reshape into the headline lettering
    uniforms.uFade.value = 1 - SS(q, 0.86, 1);
    uniforms.uPointer.value.copy(st.pointer);
    uniforms.uHole.value = wl(mobile ? 120 : 190);   // the attractor's reach
    if (isHero) showLead(SS(q, 0.8, 0.96));
    const c = uniforms.uCenter.value;
    bgPlane.visible = isHero;
    if (heroSlot) {
      const words = isHero && hp > 0.28;
      if (words !== st.words) { st.words = words; heroSlot.classList.toggle("still", words); }
      if (words) st.vel *= Math.exp(-dt * 8);          // any spin left from a drag dies out
    }
    if (isHero) {
      // The background's light trails the cursor slowly, like something heavy.
      st.bgPointer.lerp(st.bgGoal, reduced ? 1 : 1 - Math.exp(-dt * 1.6));
      bgMat.uniforms.uPointer.value.copy(st.bgPointer);
      bgMat.uniforms.uTime.value = reduced ? 0 : t;
      bgMat.uniforms.uDpr.value = view.dpr;
    }

    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    renderer.render(scene, camera);
  }
  function loop() {
    if (document.hidden) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
    step(Math.min(clock.getDelta(), 0.05));
  }
  const still = () => step(0);
  function wake() {
    if (reduced) { still(); return; }
    if (!raf) { clock.getDelta(); loop(); }
  }

  renderer.autoClear = false;
  resize();
  sampleLead();
  wake();
  canvas.classList.add("ready");
  // The headline is sampled in the page's display face, so sample again once that face has loaded.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { sampleLead(); wake(); });

  let resizeTimer = 0;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { resize(); sampleLead(); wake(); }, 120); });
  document.addEventListener("visibilitychange", wake);
  if (reduced) {
    let tick = 0;
    window.addEventListener("scroll", () => { if (!tick) tick = requestAnimationFrame(() => { tick = 0; still(); }); }, { passive: true });
  } else {
    window.addEventListener("pointermove", (e) => {
      st.pointerGoal.set(wx(e.clientX), wy(e.clientY));
      const r = hero && hero.getBoundingClientRect();
      if (r && r.width && r.bottom > 0) st.bgGoal.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    }, { passive: true });
    document.addEventListener("pointerleave", () => st.pointerGoal.set(99, 99));
    // A finger does not hover: let the hole close when it lifts.
    const lift = (e) => { if (e.pointerType !== "mouse") st.pointerGoal.set(99, 99); };
    window.addEventListener("pointerup", lift, { passive: true });
    window.addEventListener("pointercancel", lift, { passive: true });
  }

  for (const slot of [heroSlot, footSlot]) {
    if (!slot) continue;
    slot.classList.add("live");
    let downX = 0, lastX = 0, lastT = 0, moved = 0;
    // Only the pyramids are a toy: once they have become the words, the hero figure ignores drags, presses and keys.
    const asWords = () => slot === heroSlot && st.mode === "hero" && st.hp > 0.28;
    slot.addEventListener("pointerdown", (e) => {
      if (asWords()) return;
      st.dragging = true; moved = 0; downX = lastX = e.clientX; lastT = performance.now(); st.vel = 0;
      slot.setPointerCapture(e.pointerId);
      slot.classList.add("grabbing");
    });
    slot.addEventListener("pointermove", (e) => {
      if (!st.dragging) return;
      const now = performance.now(), dx = e.clientX - lastX;
      moved = Math.max(moved, Math.abs(e.clientX - downX));
      st.spin += dx * 0.011;
      st.vel = THREE.MathUtils.clamp((dx * 0.011) / (Math.max(now - lastT, 8) / 1000), -14, 14);
      lastX = e.clientX; lastT = now;
      if (reduced) still();
    });
    const release = () => {
      if (!st.dragging) return;
      st.dragging = false;
      slot.classList.remove("grabbing");
      if (reduced || performance.now() - lastT > 120) st.vel = 0;
    };
    slot.addEventListener("pointerup", release);
    slot.addEventListener("pointercancel", release);
    slot.addEventListener("click", () => {
      if (asWords()) { moved = 0; return; }
      if (moved < 6) {
        if (reduced) { st.spin += Math.PI / 4; still(); } else { st.burstT = 0; st.vel += 5; }
      }
      moved = 0;
    });
    slot.addEventListener("keydown", (e) => {
      if ((e.key !== "ArrowLeft" && e.key !== "ArrowRight") || asWords()) return;
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      if (reduced) { st.spin += dir * Math.PI / 8; still(); } else st.vel += dir * 5;
    });
  }

  window.addEventListener("pagehide", (e) => {
    if (e.persisted) return;
    cancelAnimationFrame(raf);
    [pyrGeo, bgGeo, bgMat, pGeo, pMat].forEach((d) => d.dispose());
    renderer.dispose();
  });
}

// The words need a typeface for their shape; without it the canvas is removed and the page shows its still background.
if (canvas) new FontLoader().load(FONT_URL, init, undefined, () => canvas.remove());
