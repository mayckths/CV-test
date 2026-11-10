// 3D layer. Follows the "layered separation" pattern: Three.js renders, GSAP ScrollTrigger
// drives scroll, HTML stays on top. One owner per property to avoid animation conflicts:
//   rig   (position, scale, rotation.y) -> GSAP ScrollTrigger
//   tilt  (rotation.x, rotation.y)      -> pointer parallax
//   spin  (rotation)                    -> idle loop
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

  // Ribbon sculpture: three interlocked knots, flattened so the tubes read as ribbons.
  const style = getComputedStyle(document.documentElement);
  const accent = new THREE.Color(style.getPropertyValue("--accent").trim() || "#ff4a1c");
  const ribbons = [
    { p: 2, q: 3, r: 1.0, tube: 0.2, color: accent, rough: 0.22, metal: 0.35 },
    { p: 3, q: 2, r: 1.22, tube: 0.1, color: new THREE.Color("#efe6ff"), rough: 0.08, metal: 0.9 },
    { p: 1, q: 4, r: 0.78, tube: 0.07, color: new THREE.Color("#1b1a17"), rough: 0.15, metal: 0.6 },
  ];
  const disposables = [];
  function sculpture() {
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
    const tilt = new THREE.Group();
    tilt.add(spin);
    const rig = new THREE.Group();
    rig.add(tilt);
    scene.add(rig);
    return { rig, tilt, spin };
  }
  const hero = sculpture();
  const foot = sculpture();
  foot.spin.rotation.set(1.1, 0.4, 2.0);
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
    ? { x: wx(0.92), y: wy(0.115), s: size(0.34) }
    : { x: wx(0.82), y: wy(0.4), s: size(0.56) };
  const footPose = () => view.mobile
    ? { x: wx(0.86), y: wy(0.8), s: size(0.34) }
    : { x: wx(0.82), y: wy(0.5), s: size(0.56) };

  // On-demand rendering: the loop only runs while a sculpture is on screen and the tab is visible.
  let running = false;
  let raf = 0;
  const pointer = { x: 0, y: 0 };
  const clock = new THREE.Clock();
  const active = () => (hero.rig.visible || foot.rig.visible) && !document.hidden;

  function frame() {
    // Draw one last frame when going idle so no stale image stays on the canvas.
    if (!active()) { running = false; renderer.render(scene, camera); return; }
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    for (const s of [hero, foot]) {
      if (!s.rig.visible) continue;
      s.spin.rotation.y += dt * 0.22;
      s.spin.rotation.x += dt * 0.09;
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

  function place() {
    const h = heroPose();
    hero.rig.position.set(h.x, h.y, 0);
    hero.rig.scale.setScalar(h.s);
  }

  let triggers = [];
  function build() {
    triggers.forEach((t) => t.kill());
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
      .fromTo(hero.rig.rotation, { y: 0 }, { y: Math.PI * 1.2, ease: "none" }, 0)
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
    triggers.forEach((t) => t.kill());
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
  });

  // Depth on the case study images: GSAP owns this transform, CSS owns nothing on the same element.
  if (!reduced && gsap && matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".case-media").forEach((el) => {
      const inner = el.firstElementChild;
      if (!inner) return;
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
