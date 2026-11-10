// 3D layer. Follows the "layered separation" pattern: Three.js renders, GSAP ScrollTrigger
// drives scroll, HTML stays on top. One owner per property to avoid animation conflicts:
//   rig   (position, scale, rotation.y) -> GSAP ScrollTrigger
//   tilt  (rotation.x, rotation.y)      -> pointer parallax
//   spin  (rotation) and floating parts -> idle loop
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";

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

  // Footer: Mayck's M, rebuilt from his GIF. A deep extruded serif M turns inside a dark glass ball
  // with a blue rim. The M is also a particle form (after ricardochance.com): it assembles as the
  // footer scrolls in, scatters on a press, and the loose particles move away from the cursor.
  const orbEl = document.querySelector(".orb");
  const IDLE_SPIN = reduced ? 0 : (Math.PI * 2) / 4.9; // the GIF turns once every 4.9 s
  function mOrb() {
    const OUTLINE = [[3,0],[31,0],[31,4],[20,5],[20,94],[53,0],[58,0],[84,86.7],[84,5],[73,4],[73,0],[113,0],[113,4],
      [102,5],[102,95],[113,96],[113,100],[83,100],[63,33.3],[41,100],[3,100],[3,96],[14,95],[14,5],[3,4]];
    const K = 0.0074, DEPTH = 0.62;
    const shape = new THREE.Shape(OUTLINE.map(([x, y]) => new THREE.Vector2((x - 58) * K, (y - 50) * K)));
    const mGeo = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: false, curveSegments: 1 });
    mGeo.translate(0, 0, -DEPTH / 2);
    const mMat = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 1.15, roughness: 0.6 });
    const letter = new THREE.Mesh(mGeo, mMat);

    // Particle form of the same M, plus a few that never join and drift around the ball.
    const COUNT = view0.mobile ? 1500 : 2600;
    const sampler = new MeshSurfaceSampler(letter).build();
    const target = new Float32Array(COUNT * 3), scatter = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3), seeds = new Float32Array(COUNT);
    const palette = ["#6a4cdb", "#ff5a36", "#57d3d9", "#2d2a8c", "#e0399b", "#ffc23a", "#2f3fd6"].map((c) => new THREE.Color(c));
    const v = new THREE.Vector3();
    for (let i = 0; i < COUNT; i++) {
      sampler.sample(v);
      target.set([v.x, v.y, v.z], i * 3);
      // Scattered positions ring the ball in the screen plane, so loose particles never sit in front of the glass.
      const th = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.pow(Math.random(), 1.8) * 1.3;
      scatter.set([r * Math.cos(th), r * Math.sin(th), (Math.random() - 0.5) * 0.5], i * 3);
      const c = palette[i % palette.length];
      colors.set([c.r, c.g, c.b], i * 3);
      seeds[i] = Math.random();
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(target, 3));
    pGeo.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
    pGeo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    pGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    pGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
    const uniforms = { uMix: { value: 1 }, uTime: { value: 0 }, uPointer: { value: new THREE.Vector3(99, 99, 99) }, uPx: { value: 1 }, uAngle: { value: 0 } };
    // Opaque round points, so the ones inside the ball are refracted by the glass like the solid M.
    const pMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        attribute vec3 aScatter; attribute vec3 aColor; attribute float aSeed;
        uniform float uMix, uTime, uPx, uAngle; uniform vec3 uPointer;
        varying vec3 vColor;
        void main() {
          // A few particles never join: they keep orbiting the ball, like dust around the mark.
          float joins = step(aSeed, 0.968);
          float m = joins * smoothstep(0.0, 1.0, clamp(uMix * 1.45 - aSeed * 0.45, 0.0, 1.0));
          vec3 drift = vec3(sin(uTime * 0.6 + aSeed * 40.0), cos(uTime * 0.5 + aSeed * 31.0), 0.0) * 0.07;
          // Slow orbit in the screen plane, then undo the M's own turn so the cloud stays put while the M spins.
          float o = uTime * (0.03 + aSeed * 0.05);
          vec3 sc = aScatter + drift;
          sc = vec3(sc.x * cos(o) - sc.y * sin(o), sc.x * sin(o) + sc.y * cos(o), sc.z);
          sc = vec3(sc.x * cos(uAngle) - sc.z * sin(uAngle), sc.y, sc.x * sin(uAngle) + sc.z * cos(uAngle));
          vec3 p = mix(sc, position, m);
          vec3 away = p - uPointer;
          float push = (1.0 - m) * smoothstep(0.85, 0.0, length(away));
          p += normalize(away + 1e-4) * push * 0.55;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uPx * mix(0.026 + aSeed * 0.022, 0.02, m) * (10.0 / -mv.z) * (1.0 - joins * smoothstep(0.86, 1.0, uMix));
          vColor = mix(aColor, vec3(1.0), m);
        }`,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          if (length(gl_PointCoord - 0.5) > 0.5) discard;
          gl_FragColor = vec4(vColor, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const points = new THREE.Points(pGeo, pMat);

    const turn = new THREE.Group();
    turn.add(letter, points);
    // The far inside wall of the ball: black, seen only from within.
    const wallGeo = new THREE.SphereGeometry(0.965, 64, 48);
    const wallMat = new THREE.MeshBasicMaterial({ color: "#050508", side: THREE.BackSide });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    // The glass: refracts everything inside it, which gives the lens swell of the GIF.
    const glassGeo = new THREE.SphereGeometry(1, 96, 64);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: "#ffffff", transmission: 1, thickness: 0.55, ior: 1.22, roughness: 0, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 1.5,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    // The blue rim, brightest at grazing angles.
    const rimGeo = new THREE.SphereGeometry(1.004, 64, 48);
    const rimMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color("#2438ff") }, uGain: { value: 1.6 } },
      vertexShader: `
        varying vec3 vN; varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uGain; varying vec3 vN; varying vec3 vV;
        void main() {
          float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.6);
          gl_FragColor = vec4(uColor * f * uGain, f);
          #include <colorspace_fragment>
        }`,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.renderOrder = 2;
    disposables.push(mGeo, mMat, pGeo, pMat, wallGeo, wallMat, glassGeo, glassMat, rimGeo, rimMat);

    const body = new THREE.Group();
    body.add(wall, turn, glass, rim);
    const s = rigFor(body);
    s.state = { form: 1, burst: 0, angle: 0, vel: IDLE_SPIN, dragging: false };
    const local = new THREE.Vector3();
    s.update = (t, dt) => {
      const st = s.state;
      if (!st.dragging) {
        st.vel += (IDLE_SPIN - st.vel) * (1 - Math.exp(-dt * 1.1));
        st.angle += st.vel * dt;
      }
      turn.rotation.y = st.angle;
      const mixv = st.form * (1 - st.burst);
      uniforms.uMix.value = mixv;
      uniforms.uTime.value = t;
      uniforms.uAngle.value = st.angle;
      uniforms.uPx.value = renderer.domElement.height / view.h * s.rig.scale.x;
      // The solid letter grows out of the particle cluster at the end of the assembly.
      const g = THREE.MathUtils.smoothstep(mixv, 0.8, 1);
      letter.scale.setScalar(Math.max(g, 0.0001));
      // Cursor in the particles' own space, for the repulsion.
      local.set(pointer.x * view.w, -pointer.y * view.h, 0);
      turn.worldToLocal(local);
      uniforms.uPointer.value.copy(local);
    };
    return s;
  }

  // Screen-fraction to world-unit helpers, recomputed on resize.
  const view = { w: 1, h: 1, vw: 1, vh: 1, mobile: false };
  const view0 = { mobile: window.innerWidth < 820 };
  const pointer = { x: 0, y: 0 };

  const hero = blobSculpture();
  const foot = mOrb();
  foot.rig.visible = false;
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
    ? { x: wx(0.72), y: wy(0.235), s: size(0.4) }
    : { x: wx(0.81), y: wy(0.4), s: size(0.6) };


  // On-demand rendering: the loop only runs while a sculpture is on screen and the tab is visible.
  let running = false;
  let raf = 0;
  const clock = new THREE.Clock();
  let t = 0;
  const active = () => (hero.rig.visible || foot.rig.visible) && !document.hidden;

  function frame() {
    // Draw one last frame when going idle so no stale image stays on the canvas.
    if (!active()) { running = false; renderer.render(scene, camera); return; }
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;
    syncOrb();
    for (const s of [hero, foot]) {
      if (!s.rig.visible) continue;
      s.update(t, dt);
      const k = s === foot ? 0.45 : 1;
      s.tilt.rotation.y += (pointer.x * 0.5 * k - s.tilt.rotation.y) * 0.06;
      s.tilt.rotation.x += (pointer.y * 0.35 * k - s.tilt.rotation.x) * 0.06;
    }
    renderer.render(scene, camera);
    drawConstruct();
  }
  // The orb is a real element in the footer; the 3D ball is placed over that element every frame.
  function syncOrb() {
    if (!orbEl) return;
    const r = orbEl.getBoundingClientRect();
    const vis = r.width > 0 && r.bottom > -view.vh * 0.6 && r.top < view.vh * 1.6;
    foot.rig.visible = vis;
    if (!vis) return;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    foot.rig.position.set((cx / view.vw - 0.5) * view.w, (0.5 - cy / view.vh) * view.h, 0);
    foot.rig.scale.setScalar((r.width / 2) * (view.h / view.vh) * 0.9);
  }
  function renderStill() {
    syncOrb();
    if (reduced) hero.rig.visible = window.scrollY < view.vh * 0.5;
    if (foot.rig.visible) foot.update(t, 0);
    renderer.render(scene, camera);
    drawConstruct();
  }
  function wake() {
    if (reduced) { renderStill(); return; }
    if (!running && active()) { running = true; clock.getDelta(); frame(); }
  }

  // Construction lines that track the hero sculpture on screen (the .construct overlay in index.html).
  const construct = document.querySelector(".construct");
  const cDim = construct && construct.querySelector(".c-dim");
  const tmp = new THREE.Vector3();
  let lastDim = "";
  function drawConstruct() {
    if (!construct) return;
    if (!hero.rig.visible) { construct.style.setProperty("--co", "0"); return; }
    tmp.copy(hero.rig.position).project(camera);
    const cx = (tmp.x * 0.5 + 0.5) * view.vw, cy = (-tmp.y * 0.5 + 0.5) * view.vh;
    const r = 1.55 * hero.rig.scale.x * (view.vh / view.h);
    const fade = Math.max(0, 1 - window.scrollY / (view.vh * 0.45));
    construct.style.setProperty("--cx", cx.toFixed(1));
    construct.style.setProperty("--cy", cy.toFixed(1));
    construct.style.setProperty("--r", r.toFixed(1));
    construct.style.setProperty("--co", fade.toFixed(3));
    const d = "Ø " + Math.round(r * 2) + " px";
    if (cDim && d !== lastDim) { cDim.textContent = d; lastDim = d; }
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
    if (reduced || !gsap || !ScrollTrigger) { foot.state.form = 1; wake(); return; }
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

    // Footer: the M assembles from its particles as the footer scrolls in.
    foot.state.form = 0;
    triggers.push(gsap.timeline({
      scrollTrigger: { trigger: ".foot", start: "top 88%", end: "top 30%", scrub: 0.5, onUpdate: () => wake() },
    }).fromTo(foot.state, { form: 0 }, { form: 1, ease: "none" }, 0));
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
  let scrollTick = 0;
  window.addEventListener("scroll", () => {
    if (reduced) { cancelAnimationFrame(scrollTick); scrollTick = requestAnimationFrame(renderStill); return; }
    drawConstruct(); syncOrb(); wake();
  }, { passive: true });

  // Orb interactions: drag to spin (with inertia), press to scatter into particles, arrow keys to nudge.
  if (orbEl) {
    orbEl.classList.add("live");
    const st = foot.state;
    let downX = 0, lastX = 0, lastT = 0, moved = 0;
    const scatterNow = () => {
      if (reduced || !gsap) { st.angle += Math.PI / 4; renderStill(); return; }
      st.vel += 7;
      gsap.killTweensOf(st, "burst");
      gsap.timeline().to(st, { burst: 1, duration: 0.55, ease: "power3.out" }).to(st, { burst: 0, duration: 1.5, ease: "power2.inOut" }, "+=0.45");
      wake();
    };
    orbEl.addEventListener("pointerdown", (e) => {
      st.dragging = true; moved = 0; downX = lastX = e.clientX; lastT = performance.now();
      st.vel = 0;
      orbEl.setPointerCapture(e.pointerId);
      orbEl.classList.add("grabbing");
    });
    orbEl.addEventListener("pointermove", (e) => {
      if (!st.dragging) return;
      const now = performance.now(), dx = e.clientX - lastX;
      moved = Math.max(moved, Math.abs(e.clientX - downX));
      st.angle += dx * 0.011;
      const dt = Math.max(now - lastT, 8) / 1000;
      st.vel = THREE.MathUtils.clamp((dx * 0.011) / dt, -14, 14);
      lastX = e.clientX; lastT = now;
      if (reduced) renderStill();
    });
    const release = () => {
      if (!st.dragging) return;
      st.dragging = false;
      orbEl.classList.remove("grabbing");
      if (performance.now() - lastT > 120) st.vel = 0;
      if (reduced) st.vel = 0;
    };
    orbEl.addEventListener("pointerup", release);
    orbEl.addEventListener("pointercancel", release);
    // A press without a drag scatters; this also covers Enter and Space on the focused button.
    orbEl.addEventListener("click", () => { if (moved < 6) scatterNow(); moved = 0; });
    orbEl.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      if (reduced) { st.angle += dir * Math.PI / 8; renderStill(); } else { st.vel += dir * 5; wake(); }
    });
  }

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
