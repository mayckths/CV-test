// Pixel field. One WebGL layer behind the page, made only of square pixels (small cubes):
//   - Mayck's serif M is built from pixels and turns slowly in a slot in the hero;
//   - as the page scrolls the pixels leave the M and become a drifting field behind the content;
//   - at the footer they gather into the M again;
//   - everywhere, pixels move away from the cursor and show their colour when disturbed.
// The M's slots are real buttons in the layout: drag to turn, press to scatter, arrow keys to nudge.
import * as THREE from "three";

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

  // The M's outline (same letterform as the GIF: hairline left stem, heavy diagonal, heavy right stem).
  const OUTLINE = [[3,0],[31,0],[31,4],[20,5],[20,94],[53,0],[58,0],[84,86.7],[84,5],[73,4],[73,0],[113,0],[113,4],
    [102,5],[102,95],[113,96],[113,100],[83,100],[63,33.3],[41,100],[3,100],[3,96],[14,95],[14,5],[3,4]];
  const inside = (x, y) => {
    let hit = false;
    for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
      const [xi, yi] = OUTLINE[i], [xj, yj] = OUTLINE[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };

  // Sample the M on a pixel grid, a few layers deep, so it reads as a solid letter when it turns.
  const ROWS = mobile ? 26 : 34, LAYERS = mobile ? 4 : 5, CELL = 1 / ROWS;
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < Math.ceil(1.16 * ROWS); c++) {
      const x = (c + 0.5) * CELL - 0.58, y = (r + 0.5) * CELL - 0.5;
      if (!inside(x * 100 + 58, y * 100 + 50)) continue;
      for (let l = 0; l < LAYERS; l++) cells.push([x, y, (l - (LAYERS - 1) / 2) * CELL]);
    }
  }
  const AMBIENT = mobile ? 220 : 460;
  const N = cells.length + AMBIENT;

  const palette = ["#9a86ff", "#ff6a45", "#62dbe0", "#5d58ff", "#f04fae", "#ffc23a", "#ffffff"].map((c) => new THREE.Color(c));
  const target = new Float32Array(N * 3), field = new Float32Array(N * 3), color = new Float32Array(N * 3);
  const seed = new Float32Array(N), join = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const isM = i < cells.length;
    if (isM) target.set(cells[i], i * 3);
    field.set([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.pow(Math.random(), 0.8)], i * 3);
    const col = palette[Math.floor(Math.random() * palette.length)];
    color.set([col.r, col.g, col.b], i * 3);
    seed[i] = Math.random();
    join[i] = isM ? 1 : 0;
  }
  const box = new THREE.BoxGeometry(1, 1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = box.index;
  geo.setAttribute("position", box.getAttribute("position"));
  geo.setAttribute("normal", box.getAttribute("normal"));
  geo.setAttribute("iTarget", new THREE.InstancedBufferAttribute(target, 3));
  geo.setAttribute("iField", new THREE.InstancedBufferAttribute(field, 3));
  geo.setAttribute("iColor", new THREE.InstancedBufferAttribute(color, 3));
  geo.setAttribute("iSeed", new THREE.InstancedBufferAttribute(seed, 1));
  geo.setAttribute("iJoin", new THREE.InstancedBufferAttribute(join, 1));
  geo.instanceCount = N;

  const uniforms = {
    uForm: { value: 1 }, uAngle: { value: 0 }, uScale: { value: 1 }, uTime: { value: 0 }, uScroll: { value: 0 },
    uPix: { value: 0.034 }, uCell: { value: CELL }, uCenter: { value: new THREE.Vector3() },
    uView: { value: new THREE.Vector2(1, 1) }, uPointer: { value: new THREE.Vector2(99, 99) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      attribute vec3 iTarget; attribute vec3 iField; attribute vec3 iColor; attribute float iSeed; attribute float iJoin;
      uniform float uForm, uAngle, uScale, uTime, uScroll, uPix, uCell;
      uniform vec3 uCenter; uniform vec2 uView; uniform vec2 uPointer;
      varying vec3 vColor;
      void main() {
        // Each pixel joins the M at its own moment, so the letter gathers instead of snapping.
        float m = iJoin * smoothstep(0.0, 1.0, clamp(uForm * 1.5 - iSeed * 0.5, 0.0, 1.0));
        float c = cos(uAngle), s = sin(uAngle);
        vec3 t = iTarget * uScale;
        vec3 formed = vec3(t.x * c + t.z * s, t.y, -t.x * s + t.z * c) + uCenter;
        // Field: pixels spread through depth and slide with the scroll, nearer ones faster.
        float depth = iField.z;
        float y = mod(iField.y + uScroll * (0.16 + 0.38 * (1.0 - depth)) + 1.0, 2.0) - 1.0;
        vec2 span = 0.5 * uView * (1.0 + 0.62 * depth) * 1.06;
        vec3 fld = vec3(iField.x * span.x + sin(uTime * 0.2 + iSeed * 30.0) * 0.06,
                        y * span.y + cos(uTime * 0.17 + iSeed * 21.0) * 0.06, -depth * 6.0);
        vec3 p = mix(fld, formed, m);
        // Cursor: pixels step aside, measured where they appear on screen.
        float k = 10.0 / (10.0 - p.z);
        vec2 d = p.xy * k - uPointer;
        float push = smoothstep(0.8, 0.0, length(d));
        p.xy += normalize(d + 1e-4) * push * 0.42 / k;
        // The pixel itself: a cube that turns with the M when it is part of it.
        float rot = uAngle * m, rc = cos(rot), rs = sin(rot);
        vec3 lp = vec3(position.x * rc + position.z * rs, position.y, -position.x * rs + position.z * rc);
        vec3 n = vec3(normal.x * rc + normal.z * rs, normal.y, -normal.x * rs + normal.z * rc);
        // Loose pixels are dust: the M's own pixels shrink to specks, a few free ones stay larger.
        float dust = mix(0.5 + 0.9 * iSeed, 0.22 + 0.5 * iSeed, iJoin);
        float size = mix(uPix * dust, uCell * uScale * 0.84, m) * (1.0 + push * 1.4);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p + lp * size, 1.0);
        float light = 0.46 + 0.54 * max(dot(n, normalize(vec3(0.35, 0.5, 0.8))), 0.0);
        float twinkle = 0.6 + 0.4 * sin(uTime * (0.5 + iSeed * 1.6) + iSeed * 50.0);
        // At rest the field is pale and dim; a pixel shows its colour when the cursor disturbs it.
        vec3 pale = mix(vec3(0.74, 0.72, 1.0), iColor, 0.25) * mix(0.5, 0.28, iJoin);
        vec3 fieldCol = mix(pale * twinkle * mix(1.0, 0.4, depth), iColor, push);
        vec3 formCol = mix(vec3(1.0), iColor, 0.08 + 0.92 * push) * light;
        vColor = mix(fieldCol, formCol, m);
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const view = { w: 1, h: 1, vw: 1, vh: 1 };
  function resize() {
    view.vw = window.innerWidth;
    view.vh = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    renderer.setSize(view.vw, view.vh, false);
    camera.aspect = view.vw / view.vh;
    camera.updateProjectionMatrix();
    view.h = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    view.w = view.h * camera.aspect;
    uniforms.uView.value.set(view.w, view.h);
  }

  // The two slots where the M forms. Whichever is in play anchors the letter.
  const heroSlot = document.getElementById("m-hero"), footSlot = document.getElementById("m-foot");
  const st = { form: 1, burst: 0, burstT: -1, spin: 0, vel: 0, dragging: false, pointer: new THREE.Vector2(99, 99), pointerGoal: new THREE.Vector2(99, 99) };
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  function anchor() {
    const fr = footSlot ? footSlot.getBoundingClientRect() : null;
    const footForm = fr && fr.width ? clamp01((view.vh * 0.98 - fr.top) / (view.vh * 0.5)) : 0;
    const hr = heroSlot ? heroSlot.getBoundingClientRect() : null;
    const heroForm = hr && hr.width ? clamp01(1 - (window.scrollY / Math.max(hr.height, 1)) * 0.9) : 0;
    const useFoot = footForm > 0 && heroForm <= 0.02;
    const r = useFoot ? fr : hr;
    if (r && r.width) {
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      uniforms.uCenter.value.set((cx / view.vw - 0.5) * view.w, (0.5 - cy / view.vh) * view.h, 0);
      uniforms.uScale.value = r.height * 0.78 * (view.h / view.vh);
    }
    return useFoot ? footForm : heroForm;
  }

  const clock = new THREE.Clock();
  let t = 0, raf = 0;
  function step(dt) {
    t += dt;
    const goal = anchor();
    // A press scatters the pixels, holds a beat, then lets them gather again.
    if (st.burstT >= 0) {
      st.burstT += dt;
      const b = st.burstT;
      st.burst = b < 0.5 ? 1 - Math.pow(1 - b / 0.5, 3) : b < 0.95 ? 1 : Math.max(0, 1 - Math.pow((b - 0.95) / 1.5, 2) * (3 - 2 * (b - 0.95) / 1.5));
      if (b > 2.45) { st.burst = 0; st.burstT = -1; }
    }
    const want = goal * (1 - st.burst);
    st.form += (want - st.form) * (reduced ? 1 : 1 - Math.exp(-dt * 7));
    if (!st.dragging) {
      st.spin += st.vel * dt;
      st.vel *= Math.exp(-dt * 1.6);
      // Settle back to a front-facing rest once the throw has died down.
      if (Math.abs(st.vel) < 0.6) st.spin += (Math.round(st.spin / (Math.PI * 2)) * Math.PI * 2 - st.spin) * (1 - Math.exp(-dt * 1.2));
    }
    const sway = reduced ? -0.42 : Math.sin(t * 0.45) * 0.55;
    st.pointer.lerp(st.pointerGoal, reduced ? 1 : 1 - Math.exp(-dt * 10));
    uniforms.uForm.value = st.form;
    uniforms.uAngle.value = sway + st.spin;
    uniforms.uTime.value = reduced ? 0 : t;
    uniforms.uScroll.value = window.scrollY / view.vh;
    uniforms.uPointer.value.copy(st.pointer);
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

  resize();
  wake();
  canvas.classList.add("ready");

  let resizeTimer = 0;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { resize(); wake(); }, 120); });
  document.addEventListener("visibilitychange", wake);
  if (reduced) {
    let tick = 0;
    window.addEventListener("scroll", () => { if (!tick) tick = requestAnimationFrame(() => { tick = 0; still(); }); }, { passive: true });
  } else {
    window.addEventListener("pointermove", (e) => {
      st.pointerGoal.set((e.clientX / view.vw - 0.5) * view.w, (0.5 - e.clientY / view.vh) * view.h);
    }, { passive: true });
    document.addEventListener("pointerleave", () => st.pointerGoal.set(99, 99));
  }

  // Slot interactions.
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
    geo.dispose(); box.dispose(); mat.dispose(); renderer.dispose();
  });
}

if (canvas) init();
