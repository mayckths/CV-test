// One WebGL layer that only ever draws inside a panel (hero or footer):
//   - hero background: plain blue.
//   - hero figure: two pyramids drawn in soft particles (an M) in front of the name logo. As the pinned
//     hero scrolls, the logo slides away and the particles re-form as "I DESIGN", which crystallises into
//     glass between two role labels. When the hero leaves, the words turn back into particles, travel
//     down and reshape into the "I design" that opens the headline.
//   - footer: the particle pyramids again, on the dark panel.
// Particles step away from the cursor. The slots are real buttons: drag to turn, press to scatter.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
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

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-3, 4, 6);
  scene.add(key);

  // --- Glass words ---
  const mGeo = new TextGeometry("I DESIGN", { font, size: 1, depth: 0.2, curveSegments: 8, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.012, bevelSegments: 3 });
  mGeo.center();
  mGeo.computeBoundingBox();
  const textW = mGeo.boundingBox.max.x - mGeo.boundingBox.min.x;
  mGeo.scale(1 / textW, 1 / textW, 1 / textW);   // width 1, so the slot's width sets its size
  // Near-clear glass, so the name stays bright through it; a low red glow gives the faces their own colour.
  const faceMat = new THREE.MeshPhysicalMaterial({
    color: "#fff1ec", roughness: 0.04, metalness: 0, transmission: 1, thickness: 0.14, ior: 1.5,
    dispersion: 14, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.7,
    emissive: "#ff2610", emissiveIntensity: 0.95,
  });
  const sideMat = new THREE.MeshPhysicalMaterial({ color: "#e76ae0", roughness: 0.22, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.2 });
  // The solids never grow: they crystallise in place. A hashed dissolve lets grains of glass appear across
  // the surface where the motes have settled, until the whole figure is solid.
  for (const m of [faceMat, sideMat]) m.alphaHash = true;
  const glass = new THREE.Mesh(mGeo, [faceMat, sideMat]);
  const mGroup = new THREE.Group();
  mGroup.add(glass);
  scene.add(mGroup);

  // --- Pyramids: two side by side read as an M. They are only ever drawn in particles. ---
  const PYR = mobile ? 1.15 : 0.74;            // size relative to the width of the words
  const PR = 0.36 * PYR, PH = 0.64 * PYR, PX = PR * Math.SQRT1_2, PYR_W = 4 * PX;
  const pyrGeo = new THREE.ConeGeometry(PR, PH, 4, 1);
  pyrGeo.rotateY(Math.PI / 4);                  // a flat face to the front

  // --- Background: plain blue, drawn here (not only in CSS) so the glass words have something to bend. ---
  const BG_Z = -1.6;
  const bgMat = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, alphaToCoverage: true,
    uniforms: { uColor: { value: new THREE.Color("#1b3ae6") }, uRect: { value: new THREE.Vector4() }, uRadius: { value: 28 } },
    vertexShader: `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uRadius; uniform vec4 uRect;
      void main() {
        // Rounded corners of the panel.
        vec2 c = gl_FragCoord.xy - (uRect.xy + uRect.zw * 0.5);
        vec2 q = abs(c) - uRect.zw * 0.5 + uRadius;
        float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
        gl_FragColor = vec4(uColor, clamp(0.5 - d, 0.0, 1.0));
        #include <colorspace_fragment>
      }`,
  });
  const bgGeo = new THREE.PlaneGeometry(1, 1);
  const bgPlane = new THREE.Mesh(bgGeo, bgMat);
  bgPlane.renderOrder = -10;
  bgPlane.frustumCulled = false;
  bgPlane.visible = false;
  scene.add(bgPlane);

  // --- The name, drawn into the scene so the glass can bend it ---
  const hero = document.querySelector(".hero.panel"), heroWrap = document.querySelector(".hero-wrap"), logoEl = document.querySelector(".hero-logo");
  const nameCanvas = document.createElement("canvas");
  const nameTex = new THREE.CanvasTexture(nameCanvas);
  nameTex.colorSpace = THREE.SRGBColorSpace;
  nameTex.anisotropy = 4;
  const nameMat = new THREE.MeshBasicMaterial({ map: nameTex, alphaTest: 0.5, alphaToCoverage: true, color: "#ffffff", toneMapped: false });
  const nameGeo = new THREE.PlaneGeometry(1, 1);
  const namePlane = new THREE.Mesh(nameGeo, nameMat);
  namePlane.visible = false;
  scene.add(namePlane);
  const NAME_Z = -0.9;
  let nameRect = null, nameReady = false;
  function drawName() {
    if (!logoEl) return;
    const r = logoEl.getBoundingClientRect(), pr = hero.getBoundingClientRect();
    if (r.width < 2) return;
    nameRect = { x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height };
    const k = Math.min(2400 / r.width, 3);
    const cw = Math.round(r.width * k), ch = Math.round(r.height * k);
    // A texture's storage is fixed once uploaded, so a new size needs a fresh upload.
    if (cw !== nameCanvas.width || ch !== nameCanvas.height) nameTex.dispose();
    nameCanvas.width = cw;
    nameCanvas.height = ch;
    const ctx = nameCanvas.getContext("2d");
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "#fff";
    ctx.scale(cw / 198, ch / 96);   // the logo's own viewBox
    logoEl.querySelectorAll("path").forEach((p) => ctx.fill(new Path2D(p.getAttribute("d"))));
    nameTex.needsUpdate = true;
    nameReady = true;
    hero.classList.add("live");
  }

  // --- Particles: motes that hold the pyramids, the words, or the headline lettering ---
  const COUNT = mobile ? 2800 : 5600;
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(mGeo)).build();
  const pyrSampler = new MeshSurfaceSampler(new THREE.Mesh(pyrGeo)).build();
  const target = new Float32Array(COUNT * 3), pyr = new Float32Array(COUNT * 3), scatter = new Float32Array(COUNT * 3), colour = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT), sizes = new Float32Array(COUNT);
  const palette = ["#ffffff", "#f3d9ff", "#c9a2ff", "#9a63f5", "#ff9fd0", "#ffd8c2"].map((c) => new THREE.Color(c));
  const v = new THREE.Vector3();
  for (let i = 0; i < COUNT; i++) {
    sampler.sample(v);
    target.set([v.x, v.y, v.z], i * 3);
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
    uForm: { value: 0 }, uAngle: { value: 0 }, uScale: { value: 1 }, uTime: { value: 0 }, uPx: { value: 1 }, uSolid: { value: 0 }, uMote: { value: 1 }, uMorph: { value: 0 }, uFade: { value: 1 }, uLand: { value: 0 },
    uCenter: { value: new THREE.Vector3() }, uPanelC: { value: new THREE.Vector2() }, uPanelH: { value: new THREE.Vector2(1, 1) },
    uPointer: { value: new THREE.Vector2(99, 99) },
  };
  const pMat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: `
      attribute vec3 aPyr; attribute vec3 aLead; attribute vec3 aScatter; attribute vec3 aColor; attribute float aSeed; attribute float aSize;
      uniform float uForm, uAngle, uScale, uTime, uPx, uSolid, uMote, uMorph, uFade, uLand;
      uniform vec3 uCenter; uniform vec2 uPanelC; uniform vec2 uPanelH; uniform vec2 uPointer;
      varying vec3 vColor; varying float vAlpha; varying float vCore;
      void main() {
        // Each mote joins at its own moment, so the letter gathers instead of snapping.
        float m = smoothstep(0.0, 1.0, clamp(uForm * 1.5 - aSeed * 0.5, 0.0, 1.0));
        float c = cos(uAngle), s = sin(uAngle);
        vec3 words = mix(position, aLead, uLand);
        vec3 t = mix(aPyr, words, uMorph) * uScale;
        vec3 turned = vec3(t.x * c + t.z * s, t.y, -t.x * s + t.z * c);
        vec3 formed = turned + uCenter;
        vec3 loose = vec3(uPanelC + aScatter.xy * uPanelH * 0.96, aScatter.z * 1.2);
        loose.xy += vec2(sin(uTime * 0.25 + aSeed * 30.0), cos(uTime * 0.21 + aSeed * 21.0)) * 0.08;
        vec3 p = mix(loose, formed, m);
        vec2 d = p.xy - uPointer;
        float push = smoothstep(0.7, 0.0, length(d));
        p.xy += normalize(d + 1e-4) * push * 0.38;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        // When the glass M is standing, the motes inside it shrink away.
        float hide = 1.0 - smoothstep(0.35, 1.0, uSolid) * smoothstep(0.86, 1.0, uForm);
        gl_PointSize = max(uPx * uMote * aSize * (1.0 + push) * (10.0 / -mv.z) * hide * uFade, 0.0);
        // Landing on the headline, the motes take the ink of the type they are becoming.
        vColor = mix(aColor, vec3(0.015, 0.012, 0.012), uLand);
        vCore = 1.0 - uLand;
        vAlpha = mix(0.7 + 0.3 * aSeed, 1.0, uLand) * hide * uFade;
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
    drawName();
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
  const st = { form: 0, burst: 0, burstT: -1, spin: 0, vel: 0, dragging: false, intro: reduced ? 1 : 0, mode: null, hp: 0, q: 0,
    pointer: new THREE.Vector2(99, 99), pointerGoal: new THREE.Vector2(99, 99), tilt: new THREE.Vector2() };
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
      if (nameReady && nameRect) {
        const f = (10 - NAME_Z) / 10;
        // While the hero is pinned, the logo slides down and out so the role labels can take its place.
        const drop = THREE.MathUtils.smoothstep(st.hp, 0.02, 0.5) * hr.height * 0.95;
        namePlane.position.set(wx(hr.left + nameRect.x + nameRect.w / 2) * f, wy(hr.top + nameRect.y + nameRect.h / 2 + drop) * f, NAME_Z);
        namePlane.scale.set(wl(nameRect.w) * f, wl(nameRect.h) * f, 1);
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
    const settle = 1 - SS(q, 0, 0.7);                       // the words stop turning as they land
    const sway = (reduced ? -0.35 : Math.sin(t * 0.5) * 0.5) * settle;
    const angle = sway + st.spin * settle;
    st.pointer.lerp(st.pointerGoal, reduced ? 1 : 1 - Math.exp(-dt * 10));
    // Hero choreography: pyramids, then motes that re-form, then the words, then the landing.
    const wordSolid = SS(hp, 0.38, 0.52) * (1 - SS(q, 0.02, 0.22));   // back to motes for the trip down
    const formed = SS(st.form, 0.8, 1);
    uniforms.uForm.value = st.form;
    uniforms.uAngle.value = angle;
    uniforms.uTime.value = reduced ? 0 : t;
    uniforms.uSolid.value = isHero ? wordSolid : 0;
    uniforms.uMorph.value = isHero ? SS(hp, 0.1, 0.36) : 0;      // pyramids re-form as the words; the footer keeps the pyramids
    uniforms.uLand.value = isHero ? SS(q, 0.28, 0.76) : 0;               // capitals reshape into the headline lettering
    uniforms.uFade.value = 1 - SS(q, 0.86, 1);
    uniforms.uPointer.value.copy(st.pointer);
    if (isHero) showLead(SS(q, 0.8, 0.96));
    const c = uniforms.uCenter.value;
    st.tilt.x += ((st.pointer.y - c.y) * -0.04 - st.tilt.x) * 0.08;
    st.tilt.y += ((st.pointer.x - c.x) * 0.04 - st.tilt.y) * 0.08;
    const tx = reduced ? 0 : THREE.MathUtils.clamp(st.tilt.x, -0.18, 0.18) * settle, ty = reduced ? 0 : THREE.MathUtils.clamp(st.tilt.y, -0.18, 0.18) * settle;
    for (const [group, solid, mats] of [[mGroup, wordSolid, [faceMat, sideMat]]]) {
      const g = isHero ? solid * formed : 0;
      group.visible = g > 0.001;
      if (!group.visible) continue;
      group.position.copy(c);
      group.scale.setScalar(uniforms.uScale.value);   // always full size
      group.rotation.set(tx, angle + ty, 0);
      for (const m of mats) m.opacity = g;            // how much of the surface has crystallised
    }
    namePlane.visible = isHero && nameReady && hp < 0.6;
    bgPlane.visible = isHero;
    // The name eases from the panel's own colour to cream as the panel opens.

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
  // The name is drawn with the page's display face, so redraw once that face has loaded.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawName(); sampleLead(); wake(); });

  let resizeTimer = 0;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { resize(); sampleLead(); wake(); }, 120); });
  document.addEventListener("visibilitychange", wake);
  if (reduced) {
    let tick = 0;
    window.addEventListener("scroll", () => { if (!tick) tick = requestAnimationFrame(() => { tick = 0; still(); }); }, { passive: true });
  } else {
    window.addEventListener("pointermove", (e) => {
      st.pointerGoal.set(wx(e.clientX), wy(e.clientY));
    }, { passive: true });
    document.addEventListener("pointerleave", () => st.pointerGoal.set(99, 99));
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
    [mGeo, pyrGeo, faceMat, sideMat, bgGeo, bgMat, nameGeo, nameMat, nameTex, pGeo, pMat].forEach((d) => d.dispose());
    renderer.dispose();
  });
}

// The glass words need a typeface; without it the hero simply shows the logo.
if (canvas) new FontLoader().load(FONT_URL, init, undefined, () => canvas.remove());
