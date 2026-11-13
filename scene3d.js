// Two WebGL layers. The hero background has its own canvas inside the hero panel. The particles have one canvas
// that is fixed to the screen over the hero and lives inside the footer panel in the footer:
//   - hero background: a dark ground with a drifting haze of the blue, faint stars, and a light that trails the cursor.
//   - hero figure: two pyramids drawn in soft particles (an M), alone on the panel. As the pinned
//     hero scrolls they stay, between two role labels. When the hero leaves, the motes travel down and
//     reshape into the "I design" that opens the headline.
//   - footer: the particle pyramids again, on the dark panel.
// Particles step away from the cursor. The slots are real buttons: drag to turn, press to scatter.
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";


const canvas = document.getElementById("stage");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

function init() {
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


  // --- Pyramids: two side by side read as an M. They are only ever drawn in particles. ---
  const PYR = mobile ? 1.0 : 0.6;            // size relative to the width of the words
  const PR = 0.36 * PYR, PH = 0.64 * PYR, PX = PR * Math.SQRT1_2, PYR_W = 4 * PX;
  const pyrGeo = new THREE.ConeGeometry(PR, PH, 4, 1);
  pyrGeo.rotateY(Math.PI / 4);                  // a flat face to the front

  // --- Hero background: a dark ground with a slow haze of the blue and a few faint stars. The haze leans toward
  //     the cursor and a soft light follows it. It has its own canvas inside the hero panel, so it scrolls with the
  //     panel exactly (a layer fixed to the screen trails the page by a frame while scrolling) and it is drawn at a
  //     lower resolution than the particles, which keeps scrolling light. ---
  const hero = document.querySelector(".hero.panel"), heroWrap = document.querySelector(".hero-wrap");
  const srgb = (hex) => { const c = new THREE.Color(hex); return new THREE.Vector3(...c.convertLinearToSRGB().toArray()); };   // keep CSS values as written
  const haze = (() => {
    const host = hero && hero.querySelector(".panel-bg");
    if (!host) return null;
    const cv = document.createElement("canvas");
    cv.className = "hero-haze";
    let r;
    try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: false, powerPreference: "low-power" }); } catch (e) { return null; }
    host.appendChild(cv);
    const mat = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: {
        uDeep: { value: srgb("#0d0730") }, uBase: { value: srgb("#22126d") }, uLight: { value: srgb("#4330c4") },
        uTime: { value: 0 }, uDpr: { value: 1 }, uPointer: { value: new THREE.Vector2(0.7, 0.3) }, uRes: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `
      uniform vec3 uDeep, uBase, uLight; uniform float uTime, uDpr; uniform vec2 uRes; uniform vec2 uPointer;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; } return s; }
      void main() {
        vec2 px = gl_FragCoord.xy, uv = px / uRes;
        float A = uRes.x / uRes.y;
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
        gl_FragColor = vec4(pow(max(col, 0.0), vec3(2.2)), 1.0);
        #include <colorspace_fragment>
      }`,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    quad.frustumCulled = false;
    const sc = new THREE.Scene(), cam = new THREE.Camera();
    sc.add(quad);
    const ratio = Math.min(window.devicePixelRatio, mobile ? 1.5 : 1);
    const size = () => {
      const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
      r.setPixelRatio(ratio); r.setSize(w, h, false);
      mat.uniforms.uRes.value.set(w * ratio, h * ratio); mat.uniforms.uDpr.value = ratio;
    };
    size();
    return { el: cv, mat, size, draw: () => r.render(sc, cam), dispose: () => { quad.geometry.dispose(); mat.dispose(); r.dispose(); } };
  })();

  // --- Particles: motes that hold the pyramids, the words, or the headline lettering ---
  const COUNT = mobile ? 2800 : 5600;
  const pyrSampler = new MeshSurfaceSampler(new THREE.Mesh(pyrGeo)).build();
  const pyr = new Float32Array(COUNT * 3), scatter = new Float32Array(COUNT * 3), colour = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT), sizes = new Float32Array(COUNT);
  const palette = ["#ffffff", "#f3d9ff", "#c9a2ff", "#9a63f5", "#ff9fd0", "#ffd8c2"].map((c) => new THREE.Color(c));
  const v = new THREE.Vector3();
  for (let i = 0; i < COUNT; i++) {
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
  const pyrAttr = new THREE.BufferAttribute(pyr, 3);
  pGeo.setAttribute("position", pyrAttr);   // three needs one; the shader reads the pyramid places as aPyr
  pGeo.setAttribute("aPyr", pyrAttr);
  // Where each mote sits in the headline's own "I design", sampled from the real lettering once fonts load.
  const leadPts = new Float32Array(COUNT * 3);
  const leadAttr = new THREE.BufferAttribute(leadPts, 3);
  pGeo.setAttribute("aLead", leadAttr);
  pGeo.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
  pGeo.setAttribute("aColor", new THREE.BufferAttribute(colour, 3));
  pGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  pGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const uniforms = {
    uForm: { value: 0 }, uAngle: { value: 0 }, uScale: { value: 1 }, uTime: { value: 0 }, uPx: { value: 1 }, uMote: { value: 1 }, uFade: { value: 1 }, uLand: { value: 0 },
    uCenter: { value: new THREE.Vector3() }, uPanelC: { value: new THREE.Vector2() }, uPanelH: { value: new THREE.Vector2(1, 1) },
    uPointer: { value: new THREE.Vector2(99, 99) }, uHole: { value: 0.5 },
    // On the beige footer the motes are drawn in the hero's blues instead of light tints.
    uFoot: { value: 0 }, uInkA: { value: new THREE.Color("#22126d") }, uInkB: { value: new THREE.Color("#5a3cf2") },
  };
  const pMat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: `
      attribute vec3 aPyr; attribute vec3 aLead; attribute vec3 aScatter; attribute vec3 aColor; attribute float aSeed; attribute float aSize;
      uniform float uForm, uAngle, uScale, uTime, uPx, uMote, uFade, uLand, uHole, uFoot;
      uniform vec3 uCenter; uniform vec3 uInkA; uniform vec3 uInkB; uniform vec2 uPanelC; uniform vec2 uPanelH; uniform vec2 uPointer;
      varying vec3 vColor; varying float vAlpha; varying float vCore;
      void main() {
        // Each mote joins at its own moment, so the letter gathers instead of snapping.
        float m = smoothstep(0.0, 1.0, clamp(uForm * 1.5 - aSeed * 0.5, 0.0, 1.0));
        float c = cos(uAngle), s = sin(uAngle);
        vec3 t = mix(aPyr, aLead, uLand) * uScale;                 // the pyramids, or the headline lettering they land on
        vec3 turned = vec3(t.x * c + t.z * s, t.y, -t.x * s + t.z * c);
        vec3 formed = turned + uCenter;
        vec3 loose = vec3(uPanelC + aScatter.xy * uPanelH * 0.96, aScatter.z * 1.2);
        loose.xy += vec2(sin(uTime * 0.25 + aSeed * 30.0), cos(uTime * 0.21 + aSeed * 21.0)) * 0.08;
        vec3 p = mix(loose, formed, m);
        // The cursor is an attractor: motes within reach are drawn in toward it and circle it, and go home when it leaves.
        // Wherever it is on the panel, every mote also leans a little toward it, each by its own amount.
        // None of this applies while the motes are landing on the headline.
        float free = 1.0 - uLand;
        vec2 d = p.xy - uPointer;
        float len = length(d);
        float f = smoothstep(uHole, 0.0, len);
        f *= f * free;
        float lean = 0.05 / (1.0 + len * len * 0.12) * (0.4 + 1.2 * fract(aSeed * 5.3)) * free;
        d *= 1.0 - f * 0.26 - lean * (1.0 - f);                    // a gentle draw, not a grab
        float a = f * (0.22 + 0.14 * sin(uTime * 0.9 + aSeed * 31.0));
        p.xy = uPointer + vec2(d.x * cos(a) - d.y * sin(a), d.x * sin(a) + d.y * cos(a));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(uPx * uMote * aSize * (10.0 / -mv.z) * uFade, 0.0);
        // Landing on the headline, the motes take the ink of the type they are becoming.
        vColor = mix(mix(aColor, mix(uInkA, uInkB, fract(aSeed * 3.1)), uFoot), vec3(0.015, 0.012, 0.012), uLand);
        vCore = (1.0 - uLand) * (1.0 - uFoot);                      // the bright core only shows on the dark hero
        vAlpha = mix(0.7 + 0.3 * aSeed, 1.0, max(uLand, uFoot * 0.7)) * uFade;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vAlpha; varying float vCore;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.2, r);
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
  // The particle canvas has two homes. Over the hero it is fixed to the screen, because the particles have to
  // leave the panel and land on the headline. In the footer it lives inside the footer panel and scrolls with it,
  // so the pyramids stay glued to the page while scrolling. Sizes and coordinates follow whichever home it is in.
  const org = { x: 0, y: 0 };                 // the canvas's top-left corner on screen
  function resize() {
    const inFoot = footPanel && canvas.parentNode === footPanel;
    view.vw = inFoot ? footPanel.clientWidth : window.innerWidth;
    view.vh = inFoot ? footPanel.clientHeight : window.innerHeight;
    view.dpr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);
    renderer.setPixelRatio(view.dpr);
    renderer.setSize(view.vw, view.vh, false);
    camera.aspect = view.vw / view.vh;
    camera.updateProjectionMatrix();
    view.h = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    view.w = view.h * camera.aspect;
    uniforms.uPx.value = (view.vh * view.dpr) / view.h;
    if (haze) haze.size();
  }
  function place(mode) {
    if (mode === "foot") { footPanel.insertBefore(canvas, footPanel.children[1] || null); canvas.classList.add("in-panel"); }
    else { document.body.insertBefore(canvas, document.body.firstChild); canvas.classList.remove("in-panel"); }
    resize();
  }
  // Screen pixels to world units: wx and wy take a position on screen, wl a length.
  const wx = (px) => ((px - org.x) / view.vw - 0.5) * view.w, wy = (px) => (0.5 - (px - org.y) / view.vh) * view.h, wl = (px) => px * (view.h / view.vh);
  const HERO_FIT = mobile ? 1 : 0.62;         // how much of the hero figure's reference width its drag area covers

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
  // Set on the word itself: a custom property on the root would make the browser restyle the whole page each time.
  const showLead = (v) => { const s = v.toFixed(2); if (s !== leadShown && lead) { leadShown = s; lead.style.setProperty("--lead", s); } };
  const footPanel = document.querySelector(".foot.panel");
  // The pyramids are simply there on load (form and intro start complete); only the hero's text has an entrance.
  // The pyramids open turned a little (TURN0) and come round to face front as the hero appears.
  const TURN0 = -0.35;   // about 20 degrees, the right pyramid nearer
  const st = { form: 1, burst: 0, burstT: -1, spin: reduced ? 0 : TURN0, vel: 0, dragging: false, intro: 1, mode: null, home: "hero", hp: 0, q: 0, tick: 0,
    pointer: new THREE.Vector2(99, 99), pointerGoal: new THREE.Vector2(99, 99), client: { x: 0, y: 0, on: false },
    bgPointer: new THREE.Vector2(0.7, 0.3), bgGoal: new THREE.Vector2(0.7, 0.3) };
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const onScreen = (r) => r && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;

  // Decide which panel owns the M right now, place everything on it, and return how formed it should be.
  function anchor() {
    const hr = hero ? hero.getBoundingClientRect() : null, fr = footPanel ? footPanel.getBoundingClientRect() : null;
    const mode = onScreen(hr) ? "hero" : onScreen(fr) ? "foot" : null;
    st.mode = mode;
    if (!mode) return 0;
    if (mode !== st.home) { st.home = mode; place(mode); }
    const panel = mode === "hero" ? hr : fr, slot = (mode === "hero" ? heroSlot : footSlot).getBoundingClientRect();
    org.x = mode === "foot" ? fr.left : 0; org.y = mode === "foot" ? fr.top : 0;
    const vh = window.innerHeight, base = slot.width / HERO_FIT;
    uniforms.uCenter.value.set(wx(slot.left + slot.width / 2), wy(slot.top + slot.height / 2), 0);
    uniforms.uScale.value = mode === "hero" ? wl(base * 0.96) : wl((slot.width * 0.92) / PYR_W);
    uniforms.uMote.value = wl(mode === "hero" ? base * 0.5 : slot.height * 0.75);
    uniforms.uPanelC.value.set(wx(panel.left + panel.width / 2), wy(panel.top + panel.height / 2));
    uniforms.uPanelH.value.set(wl(panel.width / 2), wl(panel.height / 2));
    // Nothing is ever drawn outside the panel. (In the footer the canvas is the panel.)
    if (mode === "foot") renderer.setScissor(0, 0, view.vw, view.vh);
    else {
      const x = Math.max(0, panel.left), y = Math.max(0, panel.top), r = Math.min(view.vw, panel.right), b = Math.min(view.vh, panel.bottom);
      renderer.setScissor(x, view.vh - b, Math.max(0, r - x), Math.max(0, b - y));
    }
    if (mode === "hero") {
      const wr = heroWrap ? heroWrap.getBoundingClientRect() : hr;
      st.hp = reduced ? 0 : clamp01(-wr.top / Math.max(1, wr.height - vh));
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
    return clamp01((vh * 0.98 - slot.top) / (vh * 0.45));
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
      // They wait, turned, under the dithered entrance (hero-pix.js) and start coming round as it gives way.
      const held = window.__pix === true && document.documentElement.classList.contains("pix");
      if (Math.abs(st.vel) < 0.6 && !held) st.spin += (Math.round(st.spin / (Math.PI * 2)) * Math.PI * 2 - st.spin) * (1 - Math.exp(-dt * 1.2));
    }
    const isHero = st.mode === "hero", SS = THREE.MathUtils.smoothstep;
    const hp = isHero ? st.hp : 0, q = isHero ? st.q : 0;
    // The pyramids stay through the whole pinned hero. They come to rest facing front as the hero lets go, so
    // nothing turns while the motes travel down and become the headline's "I design".
    const settle = 1 - SS(q, 0, 0.3);
    // Nothing turns the pyramids on its own: no idle motion, no facing the cursor, no turn on scroll. Only a drag
    // turns them, and they ease back to face front afterwards (the offset from the nearest full turn, so a spin
    // never has to unwind). They are in the same place and state on both screens of the pinned hero.
    const angle = (st.spin - Math.round(st.spin / (Math.PI * 2)) * Math.PI * 2) * settle;
    // The cursor's place is worked out each frame from where it is on screen, so it stays right while the page scrolls.
    if (st.client.on) st.pointerGoal.set(wx(st.client.x), wy(st.client.y)); else st.pointerGoal.set(99, 99);
    st.pointer.lerp(st.pointerGoal, reduced ? 1 : 1 - Math.exp(-dt * 10));
    // Hero choreography: pyramids, then motes that re-form, then the words, then the landing.
    uniforms.uForm.value = st.form;
    uniforms.uAngle.value = angle;
    uniforms.uTime.value = reduced ? 0 : t;
    uniforms.uFoot.value = st.mode === "foot" ? 1 : 0;
    uniforms.uLand.value = isHero ? SS(q, 0.28, 0.76) : 0;               // capitals reshape into the headline lettering
    uniforms.uFade.value = 1 - SS(q, 0.86, 1);
    uniforms.uPointer.value.copy(st.pointer);
    uniforms.uHole.value = wl(mobile ? 120 : 190);   // the attractor's reach
    if (isHero) showLead(SS(q, 0.8, 0.96));
    let hazeDrawn = false;
    if (isHero && haze && (reduced || st.tick++ % 2 === 0)) {
      hazeDrawn = true;
      // The background is drawn every other frame: it moves slowly, and its light trails the cursor like something heavy.
      st.bgPointer.lerp(st.bgGoal, reduced ? 1 : 1 - Math.exp(-dt * 3.2));
      haze.mat.uniforms.uPointer.value.copy(st.bgPointer);
      haze.mat.uniforms.uTime.value = reduced ? 0 : t;
      haze.draw();
    }

    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    renderer.render(scene, camera);
    // The entrance (hero-pix.js) prints the hero from these two canvases, and has to copy them before the frame is shown.
    if (isHero && window.__heroSnap) window.__heroSnap(hazeDrawn ? haze.el : null, canvas);
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
      st.client.x = e.clientX; st.client.y = e.clientY; st.client.on = true;
      const r = hero && hero.getBoundingClientRect();
      if (r && r.width && r.bottom > 0) st.bgGoal.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    }, { passive: true });
    document.addEventListener("pointerleave", () => { st.client.on = false; });
    // A finger does not hover: let the hole close when it lifts.
    const lift = (e) => { if (e.pointerType !== "mouse") st.client.on = false; };
    window.addEventListener("pointerup", lift, { passive: true });
    window.addEventListener("pointercancel", lift, { passive: true });
  }

  for (const slot of [heroSlot, footSlot]) {
    if (!slot) continue;
    slot.classList.add("live");
    let downX = 0, lastX = 0, lastT = 0, moved = 0;
    slot.addEventListener("pointerdown", (e) => {
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
      if (moved < 6) {
        if (reduced) { st.spin += Math.PI / 4; still(); } else { st.burstT = 0; st.vel += 5; }
      }
      moved = 0;
    });
    slot.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      if (reduced) { st.spin += dir * Math.PI / 8; still(); } else st.vel += dir * 5;
    });
  }

  window.addEventListener("pagehide", (e) => {
    if (e.persisted) return;
    cancelAnimationFrame(raf);
    [pyrGeo, pGeo, pMat].forEach((d) => d.dispose());
    if (haze) haze.dispose();
    renderer.dispose();
  });
}

if (canvas) init();
