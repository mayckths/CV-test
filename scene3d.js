// 3D layer. Follows the "layered separation" pattern: Three.js renders, GSAP ScrollTrigger
// drives scroll, HTML stays on top. One owner per property to avoid animation conflicts:
//   rig   (position, scale, rotation.y) -> GSAP ScrollTrigger
//   tilt  (rotation.x, rotation.y)      -> pointer parallax
//   spin  (rotation) and floating parts -> idle loop
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.getElementById("stage");
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch (e) {
    canvas.remove();
    return;
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.z = 10;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4, 5);
  scene.add(key);
  const warm = new THREE.DirectionalLight(0xff8a5c, 1.4);
  warm.position.set(-4, -2, 3);
  scene.add(warm);

  const disposables = [];
  const style = getComputedStyle(document.documentElement);
  const accent = new THREE.Color(style.getPropertyValue("--accent").trim() || "#ff4a1c");

  function rigFor(spin) {
    const tilt = new THREE.Group();
    tilt.add(spin);
    const rig = new THREE.Group();
    rig.add(tilt);
    scene.add(rig);
    return { rig, tilt, spin };
  }

  // Hero: a soft sculpture after Mayck's digital art piece. Aqua pills with coral pockets,
  // a violet sphere behind, a dotted indigo sphere, floating coral balls and a frosted glass bar.
  function blobSculpture() {
    const spin = new THREE.Group();
    const soft = (color, extra = {}) => {
      const m = new THREE.MeshPhysicalMaterial({
        color, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.18,
        sheen: 0.5, sheenColor: new THREE.Color("#ffffff"), ...extra,
      });
      disposables.push(m);
      return m;
    };
    const add = (geo, mat, pos, rot = [0, 0, 0], scale = [1, 1, 1], parent = spin) => {
      disposables.push(geo);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      mesh.scale.set(...scale);
      parent.add(mesh);
      return mesh;
    };
    const lean = 0.5;

    add(new THREE.SphereGeometry(0.82, 64, 48), soft("#6a4cdb", { roughness: 0.42 }), [-0.42, 0.62, -0.75]);

    const aqua = soft("#72dde2");
    add(new THREE.CapsuleGeometry(0.44, 1.5, 16, 56), aqua, [-0.18, 0.02, 0], [0, 0, lean]);
    add(new THREE.CapsuleGeometry(0.34, 1.05, 16, 56), aqua, [0.44, -0.3, 0.12], [0, 0, lean]);

    const coral = soft(accent, { roughness: 0.36 });
    add(new THREE.CapsuleGeometry(0.17, 0.42, 12, 32), coral, [-0.16, 0.22, 0.36], [0, 0, lean], [1, 1, 0.45]);
    add(new THREE.CapsuleGeometry(0.12, 0.24, 12, 32), coral, [0.47, -0.4, 0.42], [0, 0, lean], [1, 1, 0.45]);
    add(new THREE.SphereGeometry(0.12, 32, 24), soft("#ff9a6b"), [-0.42, -0.42, 0.34], [0, 0, 0], [1, 1, 0.5]);

    // Dotted sphere: an instanced field of small beads on a Fibonacci lattice.
    const dotted = new THREE.Group();
    dotted.position.set(0.8, 0.42, -0.3);
    spin.add(dotted);
    add(new THREE.SphereGeometry(0.4, 48, 32), soft("#2d2a8c", { roughness: 0.55, sheen: 0 }), [0, 0, 0], [0, 0, 0], [1, 1, 1], dotted);
    const beadGeo = new THREE.SphereGeometry(0.016, 8, 6);
    const beadMat = soft("#a49cff", { roughness: 0.4, sheen: 0 });
    disposables.push(beadGeo);
    const count = 260;
    const beads = new THREE.InstancedMesh(beadGeo, beadMat, count);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * Math.PI * (3 - Math.sqrt(5));
      m4.makeTranslation(Math.cos(th) * r * 0.41, y * 0.41, Math.sin(th) * r * 0.41);
      beads.setMatrixAt(i, m4);
    }
    dotted.add(beads);

    // Floating balls, each with its own bob phase.
    const floats = [
      [0.34, 1.08, 0.12, 0.2], [-0.98, 0.1, 0.22, 0.16], [0.98, -0.62, 0.05, 0.19],
      [-0.6, -1.0, 0.2, 0.13], [0.15, -1.2, -0.25, 0.22], [-1.05, 0.95, -0.4, 0.11], [1.18, 0.02, 0.3, 0.09],
    ].map(([x, y, z, r], i) => {
      const ball = add(new THREE.SphereGeometry(r, 40, 28), i % 3 === 2 ? soft("#4b3fc4") : coral, [x, y, z]);
      ball.userData = { y, phase: i * 1.7, speed: 0.6 + (i % 3) * 0.18 };
      return ball;
    });

    const glass = new THREE.MeshPhysicalMaterial({
      color: "#ffffff", transparent: true, opacity: 0.26, roughness: 0.15,
      clearcoat: 1, depthWrite: false,
    });
    disposables.push(glass);
    add(new THREE.BoxGeometry(0.26, 3.4, 0.05), glass, [0.05, 0.05, 0.75], [0, 0, -0.62]);

    const s = rigFor(spin);
    s.update = (t) => {
      // Sway instead of a full turn so the composition always faces the viewer.
      spin.rotation.y = Math.sin(t * 0.35) * 0.55;
      spin.rotation.x = Math.sin(t * 0.22) * 0.12;
      dotted.rotation.y = t * 0.3;
      floats.forEach((b) => { b.position.y = b.userData.y + Math.sin(t * b.userData.speed + b.userData.phase) * 0.07; });
    };
    return s;
  }

  // Footer: three interlocked knots, flattened so the tubes read as ribbons.
  function ribbonSculpture() {
    const ribbons = [
      { p: 2, q: 3, r: 1.0, tube: 0.2, color: accent, rough: 0.22, metal: 0.35 },
      { p: 3, q: 2, r: 1.22, tube: 0.1, color: new THREE.Color("#efe6ff"), rough: 0.08, metal: 0.9 },
      { p: 1, q: 4, r: 0.78, tube: 0.07, color: new THREE.Color("#1b1a17"), rough: 0.15, metal: 0.6 },
    ];
    const spin = new THREE.Group();
    ribbons.forEach((k, i) => {
      const geo = new THREE.TorusKnotGeometry(k.r, k.tube, 260, 28, k.p, k.q);
      const mat = new THREE.MeshPhysicalMaterial({
        color: k.color, roughness: k.rough, metalness: k.metal,
        clearcoat: 1, clearcoatRoughness: 0.12,
        iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [120, 620],
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.z = 0.62;
      mesh.rotation.set(i * 0.9, i * 1.3, i * 0.5);
      spin.add(mesh);
      disposables.push(geo, mat);
    });
    spin.rotation.set(1.1, 0.4, 2.0);
    const s = rigFor(spin);
    s.update = (t, dt) => {
      spin.rotation.y += dt * 0.22;
      spin.rotation.x += dt * 0.09;
    };
    return s;
  }

  const hero = blobSculpture();
  const foot = ribbonSculpture();
  foot.rig.visible = false;

  // Screen-fraction to world-unit helpers, recomputed on resize.
  const view = { w: 1, h: 1, vw: 1, vh: 1, mobile: false };
  function resize() {
    view.vw = window.innerWidth;
    view.vh = window.innerHeight;
    view.mobile = view.vw < 820;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, view.mobile ? 1.5 : 2));
    renderer.setSize(view.vw, view.vh, false);
    camera.aspect = view.vw / view.vh;
    camera.updateProjectionMatrix();
    view.h = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    view.w = view.h * camera.aspect;
  }
  const wx = (f) => (f - 0.5) * view.w;
  const wy = (f) => (0.5 - f) * view.h;
  // Size the sculpture relative to the smaller viewport side so it never dominates.
  const size = (f) => (Math.min(view.w, view.h) * f) / 4.6;

  const heroPose = () => view.mobile
    ? { x: wx(0.74), y: wy(0.165), s: size(0.44) }
    : { x: wx(0.81), y: wy(0.4), s: size(0.6) };
  const footPose = () => view.mobile
    ? { x: wx(0.66), y: wy(0.36), s: size(0.4) }
    : { x: wx(0.8), y: wy(0.64), s: size(0.5) };

  // On-demand rendering: the loop only runs while a sculpture is on screen and the tab is visible.
  let running = false;
  let raf = 0;
  const pointer = { x: 0, y: 0 };
  const clock = new THREE.Clock();
  let t = 0;
  const active = () => (hero.rig.visible || foot.rig.visible) && !document.hidden;

  function frame() {
    // Draw one last frame when going idle so no stale image stays on the canvas.
    if (!active()) { running = false; renderer.render(scene, camera); return; }
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;
    for (const s of [hero, foot]) {
      if (!s.rig.visible) continue;
      s.update(t, dt);
      s.tilt.rotation.y += (pointer.x * 0.5 - s.tilt.rotation.y) * 0.06;
      s.tilt.rotation.x += (pointer.y * 0.35 - s.tilt.rotation.x) * 0.06;
    }
    renderer.render(scene, camera);
  }
  function wake() {
    if (reduced) { renderer.render(scene, camera); return; }
    if (!running && active()) { running = true; clock.getDelta(); frame(); }
  }

  resize();
  hero.update(0, 0);

  function place() {
    const h = heroPose();
    hero.rig.position.set(h.x, h.y, 0);
    hero.rig.scale.setScalar(h.s);
  }

  let triggers = [];
  function build() {
    triggers.forEach((tr) => tr.kill());
    triggers = [];
    place();
    if (reduced || !gsap || !ScrollTrigger) { wake(); return; }
    gsap.registerPlugin(ScrollTrigger);

    // Hero: the sculpture leaves upward faster than the page, turning and shrinking as it goes.
    const heroEl = document.querySelector(".hero");
    const h = heroPose();
    const travel = (heroEl.offsetHeight / view.vh) * view.h * 1.15;
    triggers.push(gsap.timeline({
      scrollTrigger: {
        trigger: heroEl, start: "top top", end: "bottom top", scrub: 0.6,
        onUpdate: (st) => { hero.rig.visible = st.progress < 1; wake(); },
      },
    })
      .fromTo(hero.rig.position, { y: h.y }, { y: h.y + travel, ease: "none" }, 0)
      .fromTo(hero.rig.rotation, { y: 0 }, { y: Math.PI * 0.8, ease: "none" }, 0)
      .fromTo(hero.rig.scale, { x: h.s, y: h.s, z: h.s }, { x: h.s * 0.55, y: h.s * 0.55, z: h.s * 0.55, ease: "none" }, 0));

    // Footer: a second sculpture rises into place behind the closing line.
    const f = footPose();
    foot.rig.position.x = f.x;
    triggers.push(gsap.timeline({
      scrollTrigger: {
        trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: 0.6,
        onUpdate: (st) => { foot.rig.visible = st.progress > 0; wake(); },
      },
    })
      .fromTo(foot.rig.position, { y: f.y - view.h }, { y: f.y, ease: "power2.out" }, 0)
      .fromTo(foot.rig.rotation, { y: -Math.PI }, { y: 0, ease: "power2.out" }, 0)
      .fromTo(foot.rig.scale, { x: f.s * 0.5, y: f.s * 0.5, z: f.s * 0.5 }, { x: f.s, y: f.s, z: f.s, ease: "power2.out" }, 0));
    wake();
  }
  build();
  canvas.classList.add("ready");

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); build(); if (ScrollTrigger) ScrollTrigger.refresh(); }, 150);
  });
  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX / view.vw - 0.5;
    pointer.y = e.clientY / view.vh - 0.5;
  }, { passive: true });
  document.addEventListener("visibilitychange", wake);

  // Cleanup, so nothing keeps animating or holding GPU memory after the page goes away.
  window.addEventListener("pagehide", (e) => {
    if (e.persisted) return;
    cancelAnimationFrame(raf);
    triggers.forEach((tr) => tr.kill());
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
  });

  // Depth on the case study images: GSAP owns this transform, CSS owns nothing on the same element.
  if (!reduced && gsap && matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".case-media").forEach((el) => {
      // Tilt the whole frame so full-bleed media never shows an edge.
      const inner = el;
      gsap.set(inner, { transformPerspective: 900, transformOrigin: "center" });
      const rx = gsap.quickTo(inner, "rotationX", { duration: 0.5, ease: "power3" });
      const ry = gsap.quickTo(inner, "rotationY", { duration: 0.5, ease: "power3" });
      const sc = gsap.quickTo(inner, "scale", { duration: 0.5, ease: "power3" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 14);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
        sc(1.04);
      });
      el.addEventListener("pointerleave", () => { rx(0); ry(0); sc(1); });
    });
  }
}

if (canvas) init();
