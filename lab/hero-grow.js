// Test page (lab/hero-grow.html): two pyramids of pale stone, and a meadow that grows on them wherever the pointer
// passes. The pyramids are plain square pyramids; the stone is in their painted texture and fine relief. Under the
// pointer a small wire net marks the patch that is about to grow: grass first, then daisies on stalks, long sprays
// of blossom and small buds, and the stone under them stains green. What has grown stays.
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

function init() {
  const panel = document.querySelector(".hero.grow");
  if (!panel) return;
  const canvas = panel.querySelector(".lens-fx"), reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  panel.style.setProperty("--navw", document.querySelector(".top").offsetWidth + "px");
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); } catch (e) { return; }   // no WebGL: the ground and the text stay
  const q = new URLSearchParams(location.search).get("q");
  const low = q === "low" || (q !== "high" && (window.innerWidth < 700 || matchMedia("(pointer: coarse)").matches));   // phones get a lighter scene
  const STONE = "#d9d4cb", MOSS = "#48702a", GRASS = ["#5d8a2e", "#7da63a", "#3f6b22", "#9bbb4c", "#4c7a36"], FLOWERS = ["#ff5c98", "#ff9a5c", "#ffd23c", "#ffffff", "#c9b6ff"];
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60); camera.position.set(0, 0, 10);
  scene.add(new THREE.HemisphereLight("#fff0dc", "#8a6f60", 1.5));
  const sun = new THREE.DirectionalLight("#fff0d6", 2.9); sun.position.set(-4.5, 5.5, 5.5); sun.castShadow = true; sun.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 1, far: 20 }); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4; scene.add(sun);
  const rim = new THREE.DirectionalLight("#ff9ab8", 0.9); rim.position.set(5, 2.5, -3.5); scene.add(rim);

  const h3 = (x, y, z) => { const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return n - Math.floor(n); };
  const vn = (x, y, z) => { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), s = (t) => t * t * (3 - 2 * t), u = s(x - xi), v = s(y - yi), w = s(z - zi), l = (a, b, t) => a + (b - a) * t;
    return l(l(l(h3(xi, yi, zi), h3(xi + 1, yi, zi), u), l(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), u), v), l(l(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), u), l(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), u), v), w); };
  const fbm = (x, y, z) => vn(x, y, z) * 0.5 + vn(x * 2.1, y * 2.1, z * 2.1) * 0.25 + vn(x * 4.3, y * 4.3, z * 4.3) * 0.125 + vn(x * 8.7, y * 8.7, z * 8.7) * 0.0625;
  const fbm2 = (x, y, z) => fbm(x, y, z) + vn(x * 16.7, y * 16.7, z) * 0.03125;
  let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // --- the stone, painted once: colour (grains at several sizes, soft patches, faint streaks, hairline cracks, small
  //     pits) and height for the relief. Each face of a pyramid gets its own quarter of the sheet.
  const TS = low ? 768 : 1280, base = new THREE.Color(STONE), paint = base.clone().convertLinearToSRGB();
  function sheets() {
    const cc = document.createElement("canvas"), hc = document.createElement("canvas"); cc.width = cc.height = hc.width = hc.height = TS;
    const cx = cc.getContext("2d"), hx = hc.getContext("2d"), ci = cx.createImageData(TS, TS), hi = hx.createImageData(TS, TS);
    for (let j = 0; j < TS; j++) for (let i = 0; i < TS; i++) {
      const u = (i / TS) * 9, v = (j / TS) * 9;
      const patch = fbm2(u * 0.9, v * 0.9, 1.3), streak = fbm(u * 3.2, v * 0.5, 7.7), grain = fbm2(u * 9, v * 9, 3.1), fineG = fbm(u * 34, v * 34, 6.2), speck = vn(u * 60, v * 60, 5.9), salt = h3(i, j, 1.7);
      const c1 = Math.abs(fbm2(u * 0.8, v * 0.8, 11.3) * 2 - 0.97), crack = Math.max(0, 1 - c1 / 0.007) * (0.5 + 0.5 * vn(u * 3, v * 3, 4.1));
      const pit = speck > 0.9 ? (speck - 0.9) * 9 : 0, fleck = speck < 0.08 ? 0.1 : 0;
      const val = 0.94 + (patch - 0.48) * 0.36 + (streak - 0.48) * 0.14 + (grain - 0.48) * 0.38 + (fineG - 0.48) * 0.3 + (salt - 0.5) * 0.12 + fleck - crack * 0.34 - pit * 0.4;
      const warm = fbm(u * 0.5 + 9, v * 0.5, 2.2) - 0.47, o = (j * TS + i) * 4;
      ci.data[o] = Math.max(0, Math.min(255, paint.r * 255 * val * (1.01 + warm * 0.1))); ci.data[o + 1] = Math.max(0, Math.min(255, paint.g * 255 * val * (1.0 + warm * 0.03))); ci.data[o + 2] = Math.max(0, Math.min(255, paint.b * 255 * val * (0.99 - warm * 0.1))); ci.data[o + 3] = 255;
      const hgt = 0.6 + (grain - 0.48) * 0.8 + (fineG - 0.48) * 0.7 + (patch - 0.48) * 0.3 + (salt - 0.5) * 0.16 - crack * 0.5 - pit * 0.6;
      hi.data[o] = hi.data[o + 1] = hi.data[o + 2] = Math.max(0, Math.min(255, hgt * 255)); hi.data[o + 3] = 255;
    }
    cx.putImageData(ci, 0, 0); hx.putImageData(hi, 0, 0);
    const m = new THREE.CanvasTexture(cc), h = new THREE.CanvasTexture(hc); m.colorSpace = THREE.SRGBColorSpace; m.anisotropy = h.anisotropy = 8; return [m, h];
  }
  const [colourMap, heightMap] = sheets();

  // --- two true square pyramids, with a fine roughness, hairline cracks and slightly worn edges
  const group = new THREE.Group(); group.rotation.set(0.13, 0.4, 0); scene.add(group);
  const HGT = 2.35, RS = low ? 120 : 232, HS = low ? 68 : 132;
  function pyramid(cx, sd, turn) {
    const g = new THREE.ConeGeometry(1, HGT, RS, HS, false, Math.PI), p = g.attributes.position, n = p.count, uv = g.attributes.uv, col = new Float32Array(n * 3), shade0 = new Float32Array(n);
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
    }
    g.computeVertexNormals(); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, map: colourMap, bumpMap: heightMap, bumpScale: 4.2, roughness: 1, metalness: 0 }));
    m.castShadow = m.receiveShadow = true; group.add(m);
    return { mesh: m, shade0, stain: new Float32Array(n), stainOn: new Uint8Array(n), busy: false };
  }
  const rocks = [pyramid(-1.03, 3.1, 0), pyramid(1.03, 9.7, 2)];
  // Plain pyramids for finding where the pointer is on the stone (the real ones have tens of thousands of faces).
  const proxies = [-1.03, 1.03].map((cx) => { const g = new THREE.ConeGeometry(Math.SQRT2, HGT, 4, 1, false, Math.PI / 4); g.translate(cx, 0, 0); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ visible: false })); group.add(m); return m; });

  let W = 1, H = 1;
  function fit() {
    W = panel.clientWidth; H = panel.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    const visH = 2 * 10 * Math.tan(THREE.MathUtils.degToRad(15)), visW = visH * camera.aspect, narrow = camera.aspect < 0.9;
    group.scale.setScalar(Math.min(0.74, (visW * 0.86) / 4.5)); group.position.y = narrow ? -visH * 0.09 : -0.78;
    group.updateMatrixWorld(true); camera.updateMatrixWorld(true); renderer.shadowMap.needsUpdate = true; dirty = true;
  }
  let dirty = true; fit();

  // --- where things can grow: points spread over the faces we can see
  const P = new THREE.Vector3(), N = new THREE.Vector3(), V = new THREE.Vector3(), nm = new THREE.Matrix3().getNormalMatrix(group.matrixWorld), cand = [];
  for (const r of rocks) {
    const sampler = new MeshSurfaceSampler(r.mesh).build();
    for (let i = 0, n = low ? 34000 : 110000; i < n; i++) {
      sampler.sample(P, N); if (N.y < -0.35) continue;
      const wn = N.clone().applyMatrix3(nm).normalize(), wp = P.clone().applyMatrix4(group.matrixWorld);
      if (wn.dot(V.copy(camera.position).sub(wp).normalize()) < -0.02) continue;
      cand.push({ p: P.clone(), n: N.clone() });
    }
  }
  const C = cand.length, cx = new Float32Array(C), cy = new Float32Array(C), cz = new Float32Array(C), reach = new Float32Array(C), prog = new Float32Array(C), wait = new Float32Array(C), on = new Uint8Array(C);
  cand.forEach((c, i) => { cx[i] = c.p.x; cy[i] = c.p.y; cz[i] = c.p.z; reach[i] = 0.55 + 0.6 * fbm(c.p.x * 2.6, c.p.y * 2.6, c.p.z * 2.6) + 0.25 * rnd(); });   // a ragged edge to every patch

  // --- what grows. Every piece is scaled up from nothing by its own aGrow, which follows the progress of its point.
  const dummy = new THREE.Object3D(), UP = new THREE.Vector3(0, 1, 0), colr = new THREE.Color(), pick = (a) => a[(rnd() * a.length) | 0], sets = [];
  const growable = (m) => { m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float aGrow;").replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed *= aGrow;"); }; return m; };
  function inst(geo, mat, list, vary = 0.4) {
    const im = new THREE.InstancedMesh(geo, growable(mat), list.length), ids = new Uint32Array(list.length), delay = new Float32Array(list.length);
    list.forEach((it, i) => { dummy.position.copy(it.p); dummy.quaternion.setFromUnitVectors(UP, it.d); dummy.rotateY(rnd() * 6.283); dummy.scale.set(it.s[0], it.s[1], it.s[2]); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); im.setColorAt(i, colr.set(it.c).multiplyScalar(1 - vary / 2 + vary * rnd())); ids[i] = it.id; delay[i] = it.w || 0; });
    const attr = new THREE.InstancedBufferAttribute(new Float32Array(list.length), 1); attr.setUsage(THREE.DynamicDrawUsage); geo.setAttribute("aGrow", attr);
    im.instanceColor.needsUpdate = true; im.receiveShadow = true; im.frustumCulled = false; group.add(im); sets.push({ attr, ids, delay });
  }
  const dirOf = (n, lift, wob) => new THREE.Vector3(n.x + (rnd() - 0.5) * wob, n.y + lift + (rnd() - 0.5) * wob, n.z + (rnd() - 0.5) * wob).normalize();
  const mat = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.7, ...o });
  const blade = new THREE.ConeGeometry(low ? 0.021 : 0.015, 1, 3, 1, true); blade.translate(0, 0.5, 0);
  inst(blade, mat({ roughness: 0.85, side: THREE.DoubleSide }), cand.map((c, i) => ({ id: i, p: c.p, d: dirOf(c.n, 0.75, 0.75), s: [1 + rnd(), 0.045 + 0.1 * rnd(), 1 + rnd()], c: pick(GRASS) })));
  const petals = mergeGeometries(Array.from({ length: 6 }, (_, i) => { const g = new THREE.SphereGeometry(1, 7, 5); g.scale(0.5, 0.13, 0.26); g.translate(0.62, 0, 0); g.rotateZ(0.22); g.rotateY((i * Math.PI) / 3); return g; }));
  const stalk = new THREE.CylinderGeometry(0.0035, 0.0045, 1, 5); stalk.translate(0, 0.5, 0);
  const stalks = [], heads = [], centres = [], small = [], kd = low ? 2.6 : 1;   // fewer points on phones, so a larger share of them flower
  cand.forEach((c, i) => {
    const u = rnd();
    if (u < 0.0075 * kd) { const d = dirOf(c.n, 0.9, 0.8), L = 0.1 + 0.17 * rnd(), s = 0.02 + 0.022 * rnd(), tip = c.p.clone().addScaledVector(d, L); stalks.push({ id: i, p: c.p, d, s: [1, L, 1], c: "#6f8a4a", w: 0.1 }); heads.push({ id: i, p: tip, d, s: [s, s, s], c: pick(FLOWERS), w: 0.5 }); centres.push({ id: i, p: tip.clone().addScaledVector(d, s * 0.12), d, s: [s * 0.3, s * 0.2, s * 0.3], c: "#ffd23c", w: 0.55 }); }
    else if (u < 0.009 * kd) { const d = dirOf(c.n, 0.25, 0.9), L = 0.3 + 0.38 * rnd(), col = pick(FLOWERS); stalks.push({ id: i, p: c.p, d, s: [0.8, L, 0.8], c: "#7a8f58", w: 0.1 }); for (let k = 0, n = 6 + ((rnd() * 5) | 0); k < n; k++) { const t = 0.72 + 0.3 * rnd(), s = 0.011 + 0.012 * rnd(); small.push({ id: i, p: c.p.clone().addScaledVector(d, L * t).add(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.075)), d, s: [s, s * 0.8, s], c: col, w: 0.5 + 0.3 * rnd() }); } }
    else if (u < 0.017 * kd) small.push({ id: i, p: c.p.clone().addScaledVector(c.n, 0.03 + 0.04 * rnd()), d: c.n, s: [0.008, 0.008, 0.008].map((v) => v * (0.7 + rnd())), c: pick(FLOWERS), w: 0.3 });
  });
  inst(stalk, mat({ roughness: 0.8 }), stalks, 0.25); inst(petals, mat({ roughness: 0.5 }), heads, 0.25);
  inst(new THREE.SphereGeometry(1, 8, 6), mat({ roughness: 0.5 }), centres, 0.15); inst(new THREE.IcosahedronGeometry(1, 1), mat({ roughness: 0.5 }), small, 0.3);

  // --- the net that marks the next patch
  const REACH = 0.44, netPts = [], st = 0.07, at = (a, b) => { const w = 0.03 * Math.sin(a * 9 + b * 7); return new THREE.Vector3(a + w, b + w * 0.6, 0); };
  for (let a = -0.4; a <= 0.4 + 1e-6; a += st) for (let b = -0.4; b < 0.4 - 1e-6; b += st) if (a * a + (b + st / 2) ** 2 < 0.16) netPts.push(at(a, b), at(a, b + st), at(b, a), at(b + st, a));
  const net = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(netPts), new THREE.LineBasicMaterial({ color: "#fff6dc", transparent: true, opacity: 0, depthTest: false })); net.renderOrder = 9; group.add(net);

  // --- growing
  const mossTint = new THREE.Color(MOSS), tint = [mossTint.r / base.r * 1.25, mossTint.g / base.g * 1.25, mossTint.b / base.b * 1.25];
  let growing = false;
  function grow(at3, radius, instant) {
    const r2 = radius * radius;
    for (let i = 0; i < C; i++) { if (on[i]) continue; const dx = cx[i] - at3.x, dy = cy[i] - at3.y, dz = cz[i] - at3.z, d2 = dx * dx + dy * dy + dz * dz, lim = r2 * reach[i] * reach[i]; if (d2 < lim) { on[i] = 1; wait[i] = instant ? 0 : (Math.sqrt(d2) / radius) * 0.45 + rnd() * 0.25; if (instant) prog[i] = 1; growing = true; } }
    const s2 = r2 * 1.15;
    for (const r of rocks) { const p = r.mesh.geometry.attributes.position.array; for (let i = 0, n = r.stain.length; i < n; i++) { if (r.stainOn[i]) continue; const dx = p[i * 3] - at3.x, dy = p[i * 3 + 1] - at3.y, dz = p[i * 3 + 2] - at3.z; if (dx * dx + dy * dy + dz * dz < s2 * (0.7 + 0.6 * vn(p[i * 3] * 6, p[i * 3 + 1] * 6, p[i * 3 + 2] * 6))) { r.stainOn[i] = 1; if (instant) r.stain[i] = 1; r.busy = true; } } }
  }
  const back = (u) => { const v = u - 1; return 1 + 2.3 * v * v * v + 1.3 * v * v; };   // a small overshoot as it settles
  function advance(dt) {
    if (growing) {
      let any = false;
      for (let i = 0; i < C; i++) if (on[i] && prog[i] < 1) { if (wait[i] > 0) wait[i] -= dt; else prog[i] = Math.min(1, prog[i] + dt / 0.9); any = true; }
      for (const s of sets) { const a = s.attr.array; for (let j = 0, n = a.length; j < n; j++) { const t = prog[s.ids[j]], w = s.delay[j]; a[j] = t <= w ? 0 : back((t - w) / (1 - w)); } s.attr.needsUpdate = true; }
      growing = any; dirty = true;
    }
    for (const r of rocks) if (r.busy) {
      let any = false; const c = r.mesh.geometry.attributes.color.array, p = r.mesh.geometry.attributes.position.array;
      for (let i = 0, n = r.stain.length; i < n; i++) if (r.stainOn[i] && r.stain[i] < 1.001) {
        r.stain[i] = Math.min(1.002, r.stain[i] + dt / 1.1); if (r.stain[i] < 1) any = true;
        const s = Math.min(1, r.stain[i]), k = s * s * (3 - 2 * s), g = 0.75 + 0.5 * vn(p[i * 3] * 14, p[i * 3 + 1] * 14, p[i * 3 + 2] * 14), b0 = r.shade0[i];
        c[i * 3] = b0 + (tint[0] * g - b0) * k; c[i * 3 + 1] = b0 + (tint[1] * g - b0) * k; c[i * 3 + 2] = b0 + (tint[2] * g - b0) * k;
      }
      r.mesh.geometry.attributes.color.needsUpdate = true; r.busy = any; dirty = true;
    }
  }

  // --- the pointer
  const ray = new THREE.Raycaster(), ptr = { x: 0, y: 0, moved: false, over: false }, ndc = new THREE.Vector2(), FWD = new THREE.Vector3(0, 0, 1), netGoal = new THREE.Vector3();
  const hitAt = (px, py) => { const r = canvas.getBoundingClientRect(); ndc.set(((px - r.left) / r.width) * 2 - 1, -((py - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObjects(proxies)[0]; };
  const point = (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.moved = true; start(); };
  panel.addEventListener("pointermove", point); panel.addEventListener("pointerdown", point);
  panel.addEventListener("pointerleave", () => { ptr.over = false; dirty = true; });

  let last = performance.now(), raf = 0, seen = true;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (ptr.moved) {
      ptr.moved = false; const h = hitAt(ptr.x, ptr.y); ptr.over = !!h;
      if (h) { const local = group.worldToLocal(h.point.clone()); grow(local, REACH, reduced); netGoal.copy(local).addScaledVector(h.face.normal, 0.05); net.quaternion.setFromUnitVectors(FWD, h.face.normal); if (net.material.opacity < 0.05) net.position.copy(netGoal); }
    }
    const want = ptr.over ? 0.85 : 0, o = net.material.opacity; if (Math.abs(want - o) > 0.004) { net.material.opacity = o + (want - o) * (1 - Math.exp(-dt * 7)); dirty = true; }
    if (ptr.over && net.position.distanceToSquared(netGoal) > 1e-7) { net.position.lerp(netGoal, 1 - Math.exp(-dt * 16)); dirty = true; }
    advance(dt);
    if (dirty) { dirty = false; renderer.render(scene, camera); }
    else if (!growing && !rocks[0].busy && !rocks[1].busy) stop();                // nothing is moving: wait for the pointer
  }
  function start() { if (!raf && seen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else { dirty = true; start(); } });
  if ("IntersectionObserver" in window) new IntersectionObserver((en) => { seen = en[en.length - 1].isIntersecting; if (seen) { dirty = true; start(); } else stop(); }).observe(panel);
  let rt = 0; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { panel.style.setProperty("--navw", document.querySelector(".top").offsetWidth + "px"); fit(); start(); }, 120); });

  renderer.render(scene, camera); panel.classList.add("live"); start();
  // A first small patch grows by itself on the left pyramid, to show what the stone does.
  setTimeout(() => { const b = new THREE.Box3().setFromObject(rocks[0].mesh), a = new THREE.Vector3(b.min.x * 0.42 + b.max.x * 0.58, b.min.y * 0.7 + b.max.y * 0.3, b.max.z).project(camera), r = canvas.getBoundingClientRect(), h = hitAt(r.left + (a.x * 0.5 + 0.5) * r.width, r.top + (-a.y * 0.5 + 0.5) * r.height); if (h) { grow(group.worldToLocal(h.point.clone()), 0.36, reduced); start(); } }, 700);
  window.__grow = { get points() { return C; }, get grown() { let n = 0; for (let i = 0; i < C; i++) n += on[i]; return n; }, get running() { return !!raf; }, low };
}
init();
