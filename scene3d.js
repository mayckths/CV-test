// The M, in two states, on one WebGL layer that only ever draws inside a panel (hero or footer):
//   - glass: an extruded serif M that turns in front of Mayck's name and bends the letters behind it,
//     with colour fringes (hero);
//   - particles: soft round motes that hold the same M. They gather into it on load, scatter when it
//     is pressed, and are the M itself on the dark footer panel. They step away from the cursor.
// The M's slots are real buttons: drag to turn, press to scatter, arrow keys to nudge.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

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

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-3, 4, 6);
  scene.add(key);

  // The M's outline (the letterform of the GIF: hairline left stem, heavy diagonal, heavy right stem).
  const OUTLINE = [[3,0],[31,0],[31,4],[20,5],[20,94],[53,0],[58,0],[84,86.7],[84,5],[73,4],[73,0],[113,0],[113,4],
    [102,5],[102,95],[113,96],[113,100],[83,100],[63,33.3],[41,100],[3,100],[3,96],[14,95],[14,5],[3,4]]
    .map(([x, y]) => [(x - 58) / 100, (y - 50) / 100]);
  const inside = (x, y) => {
    let hit = false;
    for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
      const [xi, yi] = OUTLINE[i], [xj, yj] = OUTLINE[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };
  const DEPTH = 0.16;

  // --- Glass M ---
  const shape = new THREE.Shape(OUTLINE.map(([x, y]) => new THREE.Vector2(x, y)));
  const mGeo = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.006, bevelSegments: 3, curveSegments: 1 });
  mGeo.translate(0, 0, -DEPTH / 2);
  // Near-clear glass, so the name stays bright through it; a low red glow gives the faces their own colour.
  const faceMat = new THREE.MeshPhysicalMaterial({
    color: "#fff1ec", roughness: 0.04, metalness: 0, transmission: 1, thickness: 0.14, ior: 1.5,
    dispersion: 14, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.7,
    emissive: "#ff2610", emissiveIntensity: 0.95,
  });
  const sideMat = new THREE.MeshPhysicalMaterial({ color: "#e76ae0", roughness: 0.22, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.2 });
  const glass = new THREE.Mesh(mGeo, [faceMat, sideMat]);
  const mGroup = new THREE.Group();
  mGroup.add(glass);
  scene.add(mGroup);

  // --- The name, drawn into the scene so the glass can bend it ---
  const hero = document.querySelector(".hero.panel"), nameEl = document.querySelector(".hero-name");
  const nameCanvas = document.createElement("canvas");
  const nameTex = new THREE.CanvasTexture(nameCanvas);
  nameTex.colorSpace = THREE.SRGBColorSpace;
  nameTex.anisotropy = 4;
  const nameMat = new THREE.MeshBasicMaterial({ map: nameTex, alphaTest: 0.5, alphaToCoverage: true, color: "#f3e7e0", toneMapped: false });
  const nameGeo = new THREE.PlaneGeometry(1, 1);
  const namePlane = new THREE.Mesh(nameGeo, nameMat);
  namePlane.visible = false;
  scene.add(namePlane);
  const NAME_Z = -0.9;
  let nameRect = null, nameReady = false;
  function drawName() {
    if (!nameEl) return;
    const spans = [...nameEl.children];
    const rs = spans.map((s) => s.getBoundingClientRect());
    const left = Math.min(...rs.map((r) => r.left)), right = Math.max(...rs.map((r) => r.right));
    const top = Math.min(...rs.map((r) => r.top)), bottom = Math.max(...rs.map((r) => r.bottom));
    const w = right - left, h = bottom - top;
    if (w < 2) return;
    const pr = hero.getBoundingClientRect();
    // Kept relative to the panel, so the plane follows the panel while it scrolls.
    nameRect = { x: left - pr.left, y: top - pr.top, w, h };
    const k = Math.min(2400 / w, 3);
    const cw = Math.round(w * k), ch = Math.round(h * k);
    // A texture's storage is fixed once uploaded, so a new size needs a fresh upload.
    if (cw !== nameCanvas.width || ch !== nameCanvas.height) nameTex.dispose();
    nameCanvas.width = cw;
    nameCanvas.height = ch;
    const ctx = nameCanvas.getContext("2d");
    const cs = getComputedStyle(nameEl);
    ctx.clearRect(0, 0, nameCanvas.width, nameCanvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = `${cs.fontWeight} ${parseFloat(cs.fontSize) * k}px ${cs.fontFamily}`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${parseFloat(cs.letterSpacing) * k || 0}px`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    spans.forEach((s, i) => {
      const r = rs[i], text = s.textContent.toLowerCase();
      const m = ctx.measureText(text);
      const asc = m.fontBoundingBoxAscent || parseFloat(cs.fontSize) * k * 0.9, desc = m.fontBoundingBoxDescent || parseFloat(cs.fontSize) * k * 0.25;
      const baseline = (r.top - top) * k + (r.height * k) * (asc / (asc + desc));
      ctx.fillText(text, ((r.left + r.right) / 2 - left) * k, baseline);
    });
    nameTex.needsUpdate = true;
    nameReady = true;
    hero.classList.add("live");
  }

  // --- Particles: soft motes holding the same M, with its edges drawn a little denser ---
  const COUNT = mobile ? 2600 : 5200;
  const segs = OUTLINE.map((p, i) => [p, OUTLINE[(i + 1) % OUTLINE.length]]);
  const segLen = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const totalLen = segLen.reduce((a, b) => a + b, 0);
  const target = new Float32Array(COUNT * 3), scatter = new Float32Array(COUNT * 3), colour = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT), sizes = new Float32Array(COUNT);
  const palette = ["#ffffff", "#f3d9ff", "#c9a2ff", "#9a63f5", "#ff9fd0", "#ffd8c2"].map((c) => new THREE.Color(c));
  for (let i = 0; i < COUNT; i++) {
    let x, y, z;
    if (i % 10 < 3) {
      // On the outline, front or back face, or down the side walls.
      let r = Math.random() * totalLen, s = 0;
      while (r > segLen[s]) { r -= segLen[s]; s++; }
      const [a, b] = segs[s], t = r / segLen[s];
      x = a[0] + (b[0] - a[0]) * t; y = a[1] + (b[1] - a[1]) * t;
      const side = Math.random();
      z = side < 0.4 ? DEPTH / 2 : side < 0.8 ? -DEPTH / 2 : (Math.random() - 0.5) * DEPTH;
    } else {
      do { x = Math.random() * 1.14 - 0.57; y = Math.random() - 0.5; } while (!inside(x, y));
      z = (Math.random() - 0.5) * DEPTH;
    }
    target.set([x, y, z], i * 3);
    scatter.set([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1], i * 3);
    const c = palette[Math.floor(Math.random() * palette.length)];
    colour.set([c.r, c.g, c.b], i * 3);
    seed[i] = Math.random();
    sizes[i] = 0.007 + 0.02 * Math.pow(Math.random(), 3.2);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(target, 3));
  pGeo.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
  pGeo.setAttribute("aColor", new THREE.BufferAttribute(colour, 3));
  pGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  pGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const uniforms = {
    uForm: { value: 0 }, uAngle: { value: 0 }, uScale: { value: 1 }, uTime: { value: 0 }, uPx: { value: 1 }, uSolid: { value: 0 },
    uCenter: { value: new THREE.Vector3() }, uPanelC: { value: new THREE.Vector2() }, uPanelH: { value: new THREE.Vector2(1, 1) },
    uPointer: { value: new THREE.Vector2(99, 99) },
  };
  const pMat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: `
      attribute vec3 aScatter; attribute vec3 aColor; attribute float aSeed; attribute float aSize;
      uniform float uForm, uAngle, uScale, uTime, uPx, uSolid;
      uniform vec3 uCenter; uniform vec2 uPanelC; uniform vec2 uPanelH; uniform vec2 uPointer;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        // Each mote joins at its own moment, so the letter gathers instead of snapping.
        float m = smoothstep(0.0, 1.0, clamp(uForm * 1.5 - aSeed * 0.5, 0.0, 1.0));
        float c = cos(uAngle), s = sin(uAngle);
        vec3 t = position * uScale;
        vec3 formed = vec3(t.x * c + t.z * s, t.y, -t.x * s + t.z * c) + uCenter;
        formed.xy += vec2(sin(uTime * 0.9 + aSeed * 40.0), cos(uTime * 0.8 + aSeed * 27.0)) * 0.005 * uScale;
        vec3 loose = vec3(uPanelC + aScatter.xy * uPanelH * 0.96, aScatter.z * 1.2);
        loose.xy += vec2(sin(uTime * 0.25 + aSeed * 30.0), cos(uTime * 0.21 + aSeed * 21.0)) * 0.08;
        vec3 p = mix(loose, formed, m);
        vec2 d = p.xy - uPointer;
        float push = smoothstep(0.7, 0.0, length(d));
        p.xy += normalize(d + 1e-4) * push * 0.38;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        // When the glass M is standing, the motes inside it shrink away.
        float hide = 1.0 - uSolid * smoothstep(0.86, 1.0, uForm);
        gl_PointSize = max(uPx * uScale * aSize * (1.0 + push) * (10.0 / -mv.z) * hide, 0.0);
        vColor = aColor;
        vAlpha = (0.55 + 0.45 * aSeed) * hide;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.2, r);
        vec3 col = mix(vColor, vec3(1.0), smoothstep(0.3, 0.0, r) * 0.55);
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
  const footPanel = document.querySelector(".foot.panel");
  const st = { form: 0, burst: 0, burstT: -1, spin: 0, vel: 0, dragging: false, intro: reduced ? 1 : 0, mode: null,
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
    uniforms.uScale.value = wl(slot.height * 0.84);
    uniforms.uPanelC.value.set(wx(panel.left + panel.width / 2), wy(panel.top + panel.height / 2));
    uniforms.uPanelH.value.set(wl(panel.width / 2), wl(panel.height / 2));
    // Nothing is ever drawn outside the panel.
    const x = Math.max(0, panel.left), y = Math.max(0, panel.top), r = Math.min(view.vw, panel.right), b = Math.min(view.vh, panel.bottom);
    renderer.setScissor(x, view.vh - b, Math.max(0, r - x), Math.max(0, b - y));
    if (mode === "hero") {
      if (nameReady && nameRect) {
        const f = (10 - NAME_Z) / 10;
        namePlane.position.set(wx(hr.left + nameRect.x + nameRect.w / 2) * f, wy(hr.top + nameRect.y + nameRect.h / 2) * f, NAME_Z);
        namePlane.scale.set(wl(nameRect.w) * f, wl(nameRect.h) * f, 1);
      }
      return clamp01(1 - (-hr.top / (hr.height * 0.6)));
    }
    return clamp01((view.vh * 0.98 - slot.top) / (view.vh * 0.45));
  }

  const clock = new THREE.Clock();
  let t = 0, raf = 0, cleared = false;
  function step(dt) {
    t += dt;
    const goal = anchor();
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
      const b = st.burstT, u = (b - 1.0) / 1.5;
      st.burst = b < 0.5 ? 1 - Math.pow(1 - b / 0.5, 3) : b < 1.0 ? 1 : Math.max(0, 1 - u * u * (3 - 2 * u));
      if (b > 2.5) { st.burst = 0; st.burstT = -1; }
    }
    const want = goal * introForm * (1 - st.burst);
    st.form += (want - st.form) * (reduced ? 1 : 1 - Math.exp(-dt * 7));
    if (!st.dragging) {
      st.spin += st.vel * dt;
      st.vel *= Math.exp(-dt * 1.6);
      if (Math.abs(st.vel) < 0.6) st.spin += (Math.round(st.spin / (Math.PI * 2)) * Math.PI * 2 - st.spin) * (1 - Math.exp(-dt * 1.2));
    }
    const sway = reduced ? -0.45 : Math.sin(t * 0.5) * 0.6;
    const angle = sway + st.spin;
    st.pointer.lerp(st.pointerGoal, reduced ? 1 : 1 - Math.exp(-dt * 10));
    const isHero = st.mode === "hero";
    uniforms.uForm.value = st.form;
    uniforms.uAngle.value = angle;
    uniforms.uTime.value = reduced ? 0 : t;
    uniforms.uSolid.value = isHero ? 1 : 0;
    uniforms.uPointer.value.copy(st.pointer);
    // Glass M: grows out of the gathered motes, leans a little toward the cursor.
    const g = isHero ? THREE.MathUtils.smoothstep(st.form, 0.8, 1) : 0;
    mGroup.visible = g > 0.001;
    namePlane.visible = isHero && nameReady;
    if (mGroup.visible) {
      const c = uniforms.uCenter.value;
      st.tilt.x += ((st.pointer.y - c.y) * -0.04 - st.tilt.x) * 0.08;
      st.tilt.y += ((st.pointer.x - c.x) * 0.04 - st.tilt.y) * 0.08;
      mGroup.position.copy(c);
      mGroup.scale.setScalar(uniforms.uScale.value * g);
      mGroup.rotation.set(reduced ? 0 : THREE.MathUtils.clamp(st.tilt.x, -0.18, 0.18), angle + (reduced ? 0 : THREE.MathUtils.clamp(st.tilt.y, -0.18, 0.18)), 0);
    }
    // The name eases from the panel's own colour to cream as the panel opens.
    nameMat.color.set("#ff4a22").lerp(new THREE.Color("#f3e7e0"), THREE.MathUtils.smoothstep(st.intro, 0.3, 0.8));
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
  wake();
  canvas.classList.add("ready");
  // The name is drawn with the page's display face, so redraw once that face has loaded.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawName(); wake(); });

  let resizeTimer = 0;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { resize(); wake(); }, 120); });
  document.addEventListener("visibilitychange", wake);
  if (reduced) {
    let tick = 0;
    window.addEventListener("scroll", () => { if (!tick) tick = requestAnimationFrame(() => { tick = 0; still(); }); }, { passive: true });
  } else {
    window.addEventListener("pointermove", (e) => st.pointerGoal.set(wx(e.clientX), wy(e.clientY)), { passive: true });
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
    [mGeo, faceMat, sideMat, nameGeo, nameMat, nameTex, pGeo, pMat].forEach((d) => d.dispose());
    renderer.dispose();
  });
}

if (canvas) init();
