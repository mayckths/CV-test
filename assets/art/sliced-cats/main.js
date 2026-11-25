// Sliced Cats — a three.js / WebGL study of two stacked-slab cat sculptures.
//
// Geometry is authored in the pixel coordinates of reference.jpg (1512 x 2000) and
// converted to world units (100 px = 1 unit, ground at y = 0), so every measurement
// below can be read straight off the reference image.
//
// Rendering is progressive: while the camera is still, each frame draws the scene with
// one jittered sample of a large soft key light and one sample of a sky dome, and the
// frames are averaged. That converges to true soft shadows, ambient occlusion and
// supersampled edges — the things that make stone look like stone.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const params = new URLSearchParams(location.search);
const IMG_W = 1512, IMG_H = 2000, IMG_A = IMG_W / IMG_H;
const GROUND_PY = 1625;
const X = (px) => (px - IMG_W / 2) / 100;
const Y = (py) => (GROUND_PY - py) / 100;
const U = (d) => d / 100;
const lerp = (a, b, t) => a + (b - a) * t;

const MAX_SAMPLES = +(params.get('samples') || 400);
const TARGET = new THREE.Vector3(0, Y(IMG_H / 2), 0);
const CAM_HOME = new THREE.Vector3(0, 8.1, 70);
const D0 = CAM_HOME.distanceTo(TARGET);

// ───────────────────────────────────────────────────────────── renderer
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
renderer.autoClear = true;
document.body.prepend(renderer.domElement);

const gl = renderer.getContext();
const floatOK = !!gl.getExtension('EXT_color_buffer_float');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05080d);

const camera = new THREE.PerspectiveCamera(16, 1, 5, 400);
camera.position.copy(CAM_HOME);
camera.lookAt(TARGET);

// ───────────────────────────────────────────────────────────── shaders: procedural surfaces
const NOISE = /* glsl */`
float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec3 hash33(vec3 p3){ p3 = fract(p3 * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yxx) * p3.zyx); }
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
const mat3 ROT = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
float fbm(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = ROT * p * 2.03 + vec3(17.1, 3.7, 9.2); a *= .5; } return s; }
float fbm3(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 3; i++){ s += a * vnoise(p); p = ROT * p * 2.03 + vec3(17.1, 3.7, 9.2); a *= .5; } return s; }
// x: distance to nearest feature point, y: random id of that cell
vec2 cell(vec3 p){
  vec3 i = floor(p), f = fract(p); float d = 9.; float id = 0.;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++){
    vec3 g = vec3(float(x), float(y), float(z)); vec3 o = hash33(i + g);
    float dd = length(g + o - f); if (dd < d){ d = dd; id = hash13(i + g + 7.7); }
  }
  return vec2(d, id);
}
float gShade = 1.; // extra light falloff a surface can ask for (applied to all outgoing light)
float gFoot = 0.; // world-space pixel footprint, set before surfH() so fine detail fades instead of aliasing
float fade(float freq){ return 1. - smoothstep(.55, 1.5, gFoot * freq); }
`;

// Cream sandstone: sugary grain, pinpoint ochre specks, rust blotches that gather in patches, rare hairline cracks.
const SURF_STONE = /* glsl */`
uniform vec3 uBase; uniform vec3 uWarm; uniform vec3 uSpeck; uniform float uTopWarm;
float speck(vec3 p){ vec2 c = cell(ROT * p * 21. + fbm3(p * 11.) * .9); return step(.3, c.y) * (1. - smoothstep(.02, .07 + .27 * fract(c.y * 7.3), c.x)) * fade(21.); }
float pit(vec3 p){ vec2 c = cell(ROT * p * 8.5 + 3.); return step(.82, c.y) * (1. - smoothstep(.05, .12 + .1 * fract(c.y * 5.1), c.x)); }
float surfH(vec3 p){
  float h = (fbm3(ROT * p * 55.) - .5) * .0080 * fade(55.);
  h += (fbm3(p * 16.) - .5) * .0035;
  h += (vnoise(p * 3.6) - .5) * .003;
  h -= speck(p) * .006 + pit(p) * .012;
  return h;
}
vec3 surfColor(vec3 p, out float rough){
  vec3 c = uBase;
  float m = fbm(p * 1.15 + 3.1);
  c *= .86 + .28 * m;
  float cl = smoothstep(.38, .7, fbm3(p * 1.6 + 4.));
  c = mix(c, uWarm, smoothstep(.42, .78, fbm(p * .55 + 9.)) * .45);
  c = mix(c, c * vec3(1.0, .88, .70), smoothstep(8.4, 11.6, p.y) * uTopWarm);
  float blot = smoothstep(.48, .64, fbm3(ROT * p * 11. + 1.7)) * (.25 + .75 * cl);
  c = mix(c, uSpeck * 1.9, blot * .5);
  c = mix(c, uSpeck, speck(p) * (.62 + .3 * cl));
  c = mix(c, uSpeck * .7, pit(p) * .8);
  c = mix(c, uSpeck * .9, smoothstep(.66, .76, vnoise(ROT * p * 83. + 11.)) * fade(83.) * .55);
  c *= .88 + .24 * mix(.5, vnoise(ROT * p * 120.), fade(120.));
  float cr = abs(fbm3(p * vec3(.9, .55, .9) + 21.) - .5);
  float crMask = smoothstep(.66, .8, vnoise(p * .4 + 40.));
  c *= 1. - .3 * crMask * (1. - smoothstep(.0, .0035, cr)) * fade(30.);
  rough = .93 - .08 * m;
  return c;
}
`;

// Near-black cast surface: fine leathery grain with faint diagonal drag marks and warm pinpoint glints.
const SURF_IRON = /* glsl */`
uniform vec3 uBase; uniform vec3 uWarm; uniform vec3 uSpeck;
float surfH(vec3 p){
  vec3 q = vec3(p.x * .94 + p.y * .34, p.y * .94 - p.x * .34, p.z);
  float h = (fbm3(q * vec3(13., 58., 30.)) - .5) * .011 * fade(58.);
  h += (fbm3(p * 62.) - .5) * .009 * fade(62.);
  h += (fbm3(p * 9.) - .5) * .008;
  return h;
}
vec3 surfColor(vec3 p, out float rough){
  float m = fbm(p * 1.4 + 11.);
  vec3 c = mix(uBase, uWarm, smoothstep(.3, .8, m));
  c *= .78 + .44 * mix(.5, vnoise(p * 70.), fade(70.));
  c = mix(c, uSpeck, smoothstep(.76, .84, vnoise(p * 96. + 3.)) * fade(96.) * .6);
  rough = .42 + .2 * m;
  return c;
}
`;

// Painted backdrop sweeping into a felt-like floor.
const SURF_CYC = /* glsl */`
uniform vec3 uBase; uniform vec3 uWarm; uniform vec3 uSpeck;
float surfH(vec3 p){
  float fl = 1. - smoothstep(.0, 2.5, p.y);
  float h = (fbm3(p * vec3(34., 34., 34.)) - .5) * .010 * fade(60.) * fl;
  h += (fbm3(p * 2.6 + 5.) - .5) * .008 * (1. - fl);
  return h;
}
vec3 surfColor(vec3 p, out float rough){
  float wallT = smoothstep(.15, 5.5, p.y);
  // wall: mottled, brushed paint with a soft pool of light behind the figures
  float mott = fbm(vec3(p.x * .16, p.y * .16, 2.3));
  float brush = fbm(vec3(p.x * .5 + 7., p.y * 2.6, 4.1));
  vec3 wall = uBase * (.78 + .34 * mott + .10 * (brush - .5));
  vec2 q = (p.xy - vec2(-1.5, 9.5)) / vec2(11.5, 13.);
  float wallShade = mix(.52, 1.02, exp(-dot(q, q) * 1.4));
  wall *= .94 + .12 * vnoise(p * 3.1 + 2.);
  // floor: fibrous felt
  float fib = fbm3(vec3(p.x * 9., p.z * 42., .5)) * fade(60.) + .5 * (1. - fade(60.));
  float blot = fbm(vec3(p.x * .35, p.z * .35, 8.));
  vec3 flo = uWarm * (.70 + .3 * blot + .55 * (fib - .5));
  flo += uSpeck * step(.93, hash13(floor(p * vec3(140., 1., 140.)))) * .05 * fade(140.);
  // the pool of light sits in front of the figures and dies away just behind them
  float floShade = mix(.3, 1.0, smoothstep(-2.2, 2.4, p.z)) * mix(.9, 1.05, smoothstep(2., 14., p.z));
  gShade = mix(floShade, wallShade, wallT);
  rough = mix(.93, .97, wallT);
  return mix(flo, wall, wallT);
}
`;

const BUMP = /* glsl */`
{
  vec3 bp = vWPos;
  vec3 dpx = dFdx(bp), dpy = dFdy(bp);
  gFoot = max(length(dpx), length(dpy));
  float h0 = surfH(bp);
  float hx = surfH(bp + dpx) - h0, hy = surfH(bp + dpy) - h0;
  vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);
  vec3 r1 = cross(sy, normal), r2 = cross(normal, sx);
  float det = dot(sx, r1);
  vec3 grad = sign(det) * (hx * r1 + hy * r2);
  normal = normalize(abs(det) * normal - uBump * grad);
}
`;

function makeSurface(kind, surf, { base, warm, speck, bump = 1, roughness = 0.85, specular = 1, local = false }) {
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness, metalness: 0, specularIntensity: specular });
  const uniforms = {
    uBase: { value: new THREE.Color(base) },
    uWarm: { value: new THREE.Color(warm) },
    uSpeck: { value: new THREE.Color(speck) },
    uBump: { value: bump },
    uTopWarm: { value: 0 },
  };
  m.userData.uniforms = uniforms;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = ' + (local ? 'transformed' : '(modelMatrix * vec4(transformed, 1.0)).xyz') + ';');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nuniform float uBump;\n' + NOISE + surf)
      .replace('#include <map_fragment>', '#include <map_fragment>\nfloat sRough = 1.0;\n{ vec3 fpx = dFdx(vWPos), fpy = dFdy(vWPos); gFoot = max(length(fpx), length(fpy)); }\ndiffuseColor.rgb *= surfColor(vWPos, sRough);')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = sRough;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + BUMP)
      .replace('#include <opaque_fragment>', 'outgoingLight *= gShade;\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'surf-' + kind;
  return m;
}

const matCream = makeSurface('stone', SURF_STONE, { base: '#cbbfab', warm: '#c2a47c', speck: '#6b4720' });
const matBlack = makeSurface('iron', SURF_IRON, { base: '#0c0a08', warm: '#1a140d', speck: '#7a5a3a' });
const matCyc = makeSurface('cyc', SURF_CYC, { base: '#1a4366', warm: '#17345e', speck: '#9fb4d8', local: true });

// ───────────────────────────────────────────────────────────── geometry helpers
const SEG = 176;

function ellipsePts(cx, cz, rx, rz, n = SEG) {
  const pts = [];
  for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz]); }
  return pts;
}

// Skin a stack of horizontal rings (bottom → top). Coincident neighbouring ring points
// produce hard creases (their zero-area quads contribute nothing to the normals).
// Every vertex also carries a "wire" coordinate for the wireframe view: (cos, sin) of its place round the
// ring, a row number that counts up the form, and how many lines to draw round it. Lines fall on whole numbers.
// A ring may set its own row number (ring.w) so the lines land on real edges; otherwise rows are spread evenly.
function loft(rings, { capBottom = true, capTop = true, wireCols = 24, wireRows = 8 } = {}) {
  const M = rings[0].pts.length, pos = [], idx = [], wire = [], L = rings.length;
  const wOf = (i) => rings[i].w ?? (i / (L - 1)) * wireRows;
  rings.forEach((r, i) => r.pts.forEach((p, j) => {
    pos.push(p[0], r.y, p[1]);
    const a = (j / M) * Math.PI * 2; wire.push(Math.cos(a), Math.sin(a), wOf(i), wireCols);
  }));
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < M; j++) {
    const a = i * M + j, b = i * M + ((j + 1) % M), c = a + M, d = b + M;
    idx.push(a, c, b, b, c, d);
  }
  const cap = (ring, up) => {
    const base = pos.length / 3; let cx = 0, cz = 0;
    const wc = Math.floor(wOf(rings.indexOf(ring))) + 0.5;   // between two rows, so a cap only gets spokes
    ring.pts.forEach((p, j) => { cx += p[0]; cz += p[1]; pos.push(p[0], ring.y, p[1]); const a = (j / M) * Math.PI * 2; wire.push(Math.cos(a), Math.sin(a), wc, wireCols); });
    const ci = pos.length / 3; pos.push(cx / M, ring.y, cz / M); wire.push(0, 0, wc, wireCols);
    for (let j = 0; j < M; j++) { const a = base + j, b = base + ((j + 1) % M); up ? idx.push(ci, b, a) : idx.push(ci, a, b); }
  };
  if (capBottom) cap(rings[0], false);
  if (capTop) cap(rings[rings.length - 1], true);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aWire', new THREE.Float32BufferAttribute(wire, 4));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Catmull-Rom resample of a table of numeric rows.
function resample(rows, n) {
  const k = rows[0].length, out = [];
  const cr = (p0, p1, p2, p3, t) => 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  for (let i = 0; i <= n; i++) {
    const f = (i / n) * (rows.length - 1), s = Math.min(Math.floor(f), rows.length - 2), t = f - s;
    const r0 = rows[Math.max(s - 1, 0)], r1 = rows[s], r2 = rows[s + 1], r3 = rows[Math.min(s + 2, rows.length - 1)];
    const row = []; for (let c = 0; c < k; c++) row.push(cr(r0[c], r1[c], r2[c], r3[c], t));
    out.push(row);
  }
  return out;
}

// ───────────────────────────────────────────────────────────── wireframe look (shown while the camera moves)
// Not the raw triangles — those are far too dense — but a tidy cage drawn from each mesh's wire coordinate:
// a few lines round the form and a few up it, with the faces filled dark so the far side stays hidden.
const WIRE_VERT = /* glsl */`
  attribute vec4 aWire; varying vec4 vWire; varying vec3 vN, vV;
  void main(){ vWire = aWire; vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalMatrix * normal; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;
const WIRE_FRAG = /* glsl */`
  uniform vec3 uLine, uFill; uniform float uPx; varying vec4 vWire; varying vec3 vN, vV;
  void main(){
    float len = length(vWire.xy), k = vWire.w / 6.2831853;
    float a = atan(vWire.y, vWire.x) * k;
    float da = k * length(vec2(length(dFdx(vWire.xy)), length(dFdy(vWire.xy)))) / max(len, 1e-4);
    float dr = fwidth(vWire.z);
    float lc = abs(fract(a + .5) - .5) / max(da, 1e-6), lr = abs(fract(vWire.z + .5) - .5) / max(dr, 1e-6);
    // lines fade out where they would crowd together (edge-on faces, the hub of a cap)
    float kc = (1. - smoothstep(uPx - .6, uPx + .6, lc)) * (1. - smoothstep(.1, .22, da)) * smoothstep(.04, .14, len);
    float kr = (1. - smoothstep(uPx - .6, uPx + .6, lr)) * (1. - smoothstep(.16, .32, dr));
    float ndv = abs(dot(normalize(vN), normalize(vV)));
    vec3 c = uFill + uLine * (max(kc, kr) * mix(.45, 1., ndv) + pow(1. - ndv, 3.) * .2);
    gl_FragColor = vec4(c, 1.);
  }`;
const makeWire = (line, fill) => new THREE.ShaderMaterial({
  uniforms: { uLine: { value: new THREE.Vector3(...line) }, uFill: { value: new THREE.Vector3(...fill) }, uPx: { value: 1 } },
  vertexShader: WIRE_VERT, fragmentShader: WIRE_FRAG,
});
const wireCream = makeWire([0.95, 0.82, 0.6], [0.014, 0.02, 0.032]);
const wireBlack = makeWire([0.14, 0.24, 0.5], [0.003, 0.005, 0.011]);
// backdrop in the same mode: flat dark, with a measured grid on the floor that stays put as the camera orbits
const wireCyc = new THREE.ShaderMaterial({
  uniforms: { uPx: { value: 1 } },
  vertexShader: /* glsl */`varying vec3 vW; varying float vUp;
    void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vUp = normal.y; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: /* glsl */`uniform float uPx; varying vec3 vW; varying float vUp;
    float grid(vec2 g){ vec2 d = fwidth(g), l = abs(fract(g + .5) - .5) / max(d, vec2(1e-6));
      return (1. - smoothstep(uPx - .6, uPx + .6, min(l.x, l.y))) * (1. - smoothstep(.2, .45, max(d.x, d.y))); }
    void main(){
      float fade = exp(-length(vW.xz) / 24.) * smoothstep(.9, .995, vUp);
      vec3 c = vec3(.0062, .0115, .025) + vec3(.035, .07, .15) * (grid(vW.xz) * .3 + grid(vW.xz / 5.) * .8) * fade;
      gl_FragColor = vec4(c, 1.);
    }`,
});

const group = new THREE.Group();
scene.add(group);
function add(geometry, material) {
  const m = new THREE.Mesh(geometry, material);
  m.userData.solid = material; m.userData.wire = material === matBlack ? wireBlack : wireCream;
  m.castShadow = true; m.receiveShadow = true;
  group.add(m);
  return m;
}

// side-to-side depth of a slab from its half-length: a seated cat is roughly three-quarters as wide as it is long
const depthFor = (rx) => Math.min(rx * 0.92, 2.15);

// Outline of two overlapping ellipses joined with a smooth union, sampled around a point inside both.
function unionRing(e1, e2, inset, k, n = SEG) {
  const el = (e, x, z) => Math.hypot((x - e.cx) / Math.max(e.rx - inset, 1e-3), (z - e.cz) / Math.max(e.rz - inset, 1e-3)) - 1;
  const f = (x, z) => { const a = el(e1, x, z), b = el(e2, x, z), h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  const x0 = (Math.max(e1.cx - e1.rx, e2.cx - e2.rx) + Math.min(e1.cx + e1.rx, e2.cx + e2.rx)) / 2, z0 = (e1.cz + e2.cz) / 2;
  const pts = [];
  for (let j = 0; j < n; j++) {
    const a = (j / n) * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
    let lo = 0, hi = 8;
    for (let it = 0; it < 34; it++) { const mid = (lo + hi) / 2; if (f(x0 + dx * mid, z0 + dz * mid) < 0) lo = mid; else hi = mid; }
    pts.push([x0 + dx * lo, z0 + dz * lo]);
  }
  return pts;
}

// A sliced slab: elliptical frustum with a crisp top edge and a softer, rolled bottom edge.
// top / bot are [py, pxLeft, pxRight] read off the reference; lobe adds a shoulder: { top: [pxL, pxR], bot: [pxL, pxR], rz, z }.
function slab(mat, { top, bot, rz, z = 0, bt = 0.045, bb = 0.11, lobe = null, k = 0.32 }) {
  const y1 = Y(top[0]), y0 = Y(bot[0]);
  const c1 = (X(top[1]) + X(top[2])) / 2, r1 = (X(top[2]) - X(top[1])) / 2;
  const c0 = (X(bot[1]) + X(bot[2])) / 2, r0 = (X(bot[2]) - X(bot[1])) / 2;
  const rz0 = rz ?? depthFor(Math.max(r0, r1)), rz1 = rz0 * (r1 / r0);
  let L = null;
  if (lobe) L = { c1: (X(lobe.top[0]) + X(lobe.top[1])) / 2, r1: (X(lobe.top[1]) - X(lobe.top[0])) / 2, c0: (X(lobe.bot[0]) + X(lobe.bot[1])) / 2, r0: (X(lobe.bot[1]) - X(lobe.bot[0])) / 2 };
  const at = (y, inset) => {
    const t = (y - y0) / (y1 - y0);
    const e1 = { cx: lerp(c0, c1, t), cz: z, rx: lerp(r0, r1, t), rz: lerp(rz0, rz1, t) };
    if (!L) return { y, pts: ellipsePts(e1.cx, z, e1.rx - inset, e1.rz - inset) };
    const e2 = { cx: lerp(L.c0, L.c1, t), cz: lobe.z ?? 0.1, rx: lerp(L.r0, L.r1, t), rz: lobe.rz };
    return { y, pts: unionRing(e1, e2, inset, k) };
  };
  const rings = [], K = 7;
  for (let i = 0; i <= K; i++) { const p = (i / K) * Math.PI / 2; rings.push({ ...at(y0 + bb * (1 - Math.cos(p)), bb * (1 - Math.sin(p))), w: i / K }); }
  for (let i = K; i >= 0; i--) { const p = (i / K) * Math.PI / 2; rings.push({ ...at(y1 - bt * (1 - Math.cos(p)), bt * (1 - Math.sin(p))), w: 3 - i / K }); }
  return add(loft(rings, { wireCols: 32 }), mat);
}

// Free profile of elliptical rings; rows are [py, pxLeft, pxRight] or [py, pxLeft, pxRight, half-depth], bottom → top.
function profile(mat, rows, { rzK = 0.7, z = 0, n = 28, capBottom = true, capTop = true } = {}) {
  const rings = resample(rows, n).map(([py, xl, xr, rz]) => {
    const rx = Math.max((X(xr) - X(xl)) / 2, 0.004);
    return { y: Y(py), pts: ellipsePts((X(xl) + X(xr)) / 2, z, rx, rz ?? rx * rzK) };
  });
  return add(loft(rings, { capBottom, capTop }), mat);
}

// Variable-radius tube through pixel-space points, with round or flat ends.
function tube(mat, pts, radii, { z = 0, zs = null, radial = 40, segs = 140, start = 'round', end = 'round', zScale = 1 } = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p, i) => new THREE.Vector3(X(p[0]), Y(p[1]), zs ? zs[i] : z)), false, 'centripetal');
  const n = pts.length;
  const radAt = (t) => { const f = t * (n - 1), i = Math.min(Math.floor(f), n - 2); return U(lerp(radii[i], radii[i + 1], f - i)); };
  const st = [];
  let N = new THREE.Vector3(0, 0, 1), prevT = null;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, P = curve.getPoint(t), T = curve.getTangent(t).normalize();
    if (prevT) { const ax = new THREE.Vector3().crossVectors(prevT, T); const s = ax.length(); if (s > 1e-6) N.applyAxisAngle(ax.normalize(), Math.asin(Math.min(s, 1))); }
    N.addScaledVector(T, -N.dot(T)).normalize();
    st.push({ P, T, N: N.clone(), r: radAt(t) });
    prevT = T;
  }
  const K = 8, stations = [];
  if (start === 'round') { const s = st[0]; for (let k = K; k >= 1; k--) { const p = (k / K) * Math.PI / 2; stations.push({ P: s.P.clone().addScaledVector(s.T, -s.r * Math.sin(p)), T: s.T, N: s.N, r: Math.max(s.r * Math.cos(p), 1e-4) }); } }
  stations.push(...st);
  if (end === 'round') { const s = st[st.length - 1]; for (let k = 1; k <= K; k++) { const p = (k / K) * Math.PI / 2; stations.push({ P: s.P.clone().addScaledVector(s.T, s.r * Math.sin(p)), T: s.T, N: s.N, r: Math.max(s.r * Math.cos(p), 1e-4) }); } }
  const pos = [], idx = [], wire = [], B = new THREE.Vector3(), v = new THREE.Vector3();
  const WC = 10, wRows = Math.max(4, Math.round(curve.getLength() / 0.42)), wAt = (i) => (i / (stations.length - 1)) * wRows;
  stations.forEach((s, i) => {
    B.crossVectors(s.T, s.N);
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      v.copy(s.P).addScaledVector(s.N, Math.cos(a) * s.r * zScale).addScaledVector(B, Math.sin(a) * s.r);
      pos.push(v.x, v.y, v.z); wire.push(Math.cos(a), Math.sin(a), wAt(i), WC);
    }
  });
  for (let i = 0; i < stations.length - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * radial + j, b = i * radial + ((j + 1) % radial), c = a + radial, d = b + radial;
    idx.push(a, b, c, b, d, c);
  }
  const fan = (s, atEnd) => {
    B.crossVectors(s.T, s.N);
    const base = pos.length / 3, wc = (atEnd ? wRows : 0) + 0.5;
    for (let j = 0; j < radial; j++) { const a = (j / radial) * Math.PI * 2; v.copy(s.P).addScaledVector(s.N, Math.cos(a) * s.r * zScale).addScaledVector(B, Math.sin(a) * s.r); pos.push(v.x, v.y, v.z); wire.push(Math.cos(a), Math.sin(a), wc, WC); }
    const ci = pos.length / 3; pos.push(s.P.x, s.P.y, s.P.z); wire.push(0, 0, wc, WC);
    for (let j = 0; j < radial; j++) { const a = base + j, b = base + ((j + 1) % radial); atEnd ? idx.push(ci, a, b) : idx.push(ci, b, a); }
  };
  if (start === 'flat') fan(stations[0], false);
  if (end === 'flat') fan(stations[stations.length - 1], true);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aWire', new THREE.Float32BufferAttribute(wire, 4));
  g.setIndex(idx);
  g.computeVertexNormals();
  return add(g, mat);
}

function ellipsoid(mat, cpx, cpy, z, rx, ry, rz) {
  const g = new THREE.SphereGeometry(1, 56, 36);
  { const uv = g.attributes.uv, wire = [];
    for (let i = 0; i < uv.count; i++) { const a = uv.getX(i) * Math.PI * 2; wire.push(Math.cos(a), Math.sin(a), uv.getY(i) * 4, 8); }
    g.setAttribute('aWire', new THREE.Float32BufferAttribute(wire, 4)); }
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(X(cpx), Y(cpy), z), new THREE.Quaternion(), new THREE.Vector3(U(rx), U(ry), U(rz))));
  return add(g, mat);
}

// A paw: a soft loaf with four toes fanned around its tip. dir = +1 points right, -1 left.
function paw(mat, cpx, cpy, rx, ry, rz, dir, z = 0) {
  ellipsoid(mat, cpx, cpy, z, rx, ry, rz);
  for (const deg of [-57, -19, 19, 57]) {
    const a = THREE.MathUtils.degToRad(deg);
    ellipsoid(mat, cpx + dir * Math.cos(a) * rx * 0.44, cpy + ry * 0.04, z + Math.sin(a) * U(rz) * 0.5, rx * 0.6, ry * 0.95, rz * 0.5);
  }
}

// A foot: a solid block with a stadium footprint and rolled top and bottom edges.
// rake: optional [[py, px], …] (top → bottom) giving the left end at each height, for an undercut heel.
function pill(mat, { x0, x1, top, bot, r, z = 0, bevel = 0.2, rake = null }) {
  const y1 = Y(top), y0 = Y(bot);
  const leftAt = (y) => {
    if (!rake) return X(x0);
    const py = 1625 - y * 100; let i = 0;
    while (i < rake.length - 2 && py > rake[i + 1][0]) i++;
    return X(lerp(rake[i][1], rake[i + 1][1], THREE.MathUtils.clamp((py - rake[i][0]) / (rake[i + 1][0] - rake[i][0]), 0, 1)));
  };
  const ring = (y, inset) => {
    const cx = (leftAt(y) + X(x1)) / 2, half = (X(x1) - leftAt(y)) / 2 - r;
    const rr = r - inset, pts = [];
    for (let j = 0; j < SEG; j++) { const a = (j / SEG) * Math.PI * 2, c = Math.cos(a); pts.push([cx + (c >= 0 ? half : -half) + c * rr, z + Math.sin(a) * rr]); }
    return { y, pts };
  };
  const rings = [], K = 8;
  for (let i = 0; i <= K; i++) { const p = (i / K) * Math.PI / 2; rings.push({ ...ring(y0 + bevel * (1 - Math.cos(p)), bevel * (1 - Math.sin(p))), w: i / K }); }
  for (let i = K; i >= 0; i--) { const p = (i / K) * Math.PI / 2; rings.push({ ...ring(y1 - bevel * (1 - Math.cos(p)), bevel * (1 - Math.sin(p))), w: 3 - i / K }); }
  return add(loft(rings, { wireCols: 28 }), mat);
}

// ───────────────────────────────────────────────────────────── the cream cat (left)
{
  const C = matCream;
  // head cap: a low wedge with a rolled lip — a straight slope up from the nose, rounder toward the back.
  // rows: [py, pxLeft, pxRight, half-depth]. The section is slightly squared so the crown stays broad
  // enough between the ears for both of them to grow out of it.
  const capRows = [[596, 484, 768, 1.02], [592.5, 473, 777, 1.09], [587, 467.5, 781.5, 1.13], [582, 468, 782, 1.14], [562, 487, 779, 1.12], [541, 508, 771, 1.05],
    [521, 528, 758, 0.96], [505, 545, 743, 0.92], [495, 559, 727, 0.87], [488, 578, 703, 0.76], [484.5, 606, 674, 0.58], [483.5, 632, 652, 0.4]];
  add(loft(resample(capRows, 44).map(([py, xl, xr, rz]) => {
    const rx = Math.max((X(xr) - X(xl)) / 2, 0.004), cx = (X(xl) + X(xr)) / 2, pts = [];
    for (let j = 0; j < SEG; j++) { const th = (j / SEG) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th); pts.push([cx + Math.sign(cs) * Math.pow(Math.abs(cs), 2 / 3) * rx, Math.sign(sn) * Math.pow(Math.abs(sn), 2 / 3) * rz]); }
    return { y: Y(py), pts };
  })), C);

  // …and the ears: a pair of thin cupped shells, one each side of the crown. Each section is a hook: from
  // the outer rim (the ridge in the reference) the wall wraps round the back of the ear and runs forward
  // along the inner side to a second rim, leaving a hollow that opens forward and outward.
  // rows: [py, pxLeft, pxRidge, pxRight]. From the front the far ear sits behind the near one.
  const earRows = [
    [572, 492, 620, 716], [552, 506, 626, 721], [520, 534, 636, 727], [500, 553, 643, 731], [480, 573, 652, 735], [460, 598, 663, 740],
    [440, 620, 676, 745], [420, 640, 688, 750], [400, 659, 700, 755], [380, 678, 713, 759], [360, 696, 727, 762],
    [345, 712, 738, 762.5], [333, 729, 747, 761], [325, 741, 751, 758], [321.5, 748, 752, 755.5],
  ];
  const NO = 96, NC = 5, TAU = Math.PI * 2;
  for (const side of [1, -1]) {
    const earRings = resample(earRows, 56).map(([py, xl, xm, xr0]) => {
      // the far ear is trimmed a touch so perspective can't let its edge peek out past the near one
      const xr = side > 0 ? xr0 : xr0 - Math.min(5, (xr0 - xm) * 0.4);
      const a = Math.max((X(xr) - X(xl)) / 2, 0.012), c = (X(xl) + X(xr)) / 2;
      const t = THREE.MathUtils.clamp((552 - py) / 230.5, 0, 1);
      // seen head-on each ear is a triangle: the outer edge bows in toward a blunt tip, the inner edge leans out
      // …and near the tip the hollow shallows out and the top rounds over
      const shut = THREE.MathUtils.smoothstep(t, 0.78, 0.985), round = t > 0.94 ? Math.max(Math.sqrt(Math.max(1 - ((t - 0.94) / 0.06) ** 2, 0)), 0.16) : 1;
      const zMid = lerp(0.56, 0.72, t), zHalf = lerp(0.46, 0.08, t * (2 - t) * 0.35 + t * 0.65) * round;
      const zOut = zMid + zHalf, zIn = zMid - zHalf;
      const zc = lerp(zIn, zOut, 0.36), bF = zOut - zc, bB = zc - zIn;
      const w = Math.min(lerp(0.13, 0.06, t), 0.42 * Math.min(a, bB));
      const thM = Math.acos(THREE.MathUtils.clamp((X(xm) - c) / a, -0.95, 0.95));
      // past the back of the ear the inner wall stays out by the midline instead of curling back in
      const E = (th, inset) => {
        const sn = Math.sin(th), q4 = th > Math.PI * 1.5;
        return [c + Math.cos(th) * (a - inset), zc + (sn > 0 ? sn * (bF - inset) : -(q4 ? lerp(-sn, 1, 0.86 * (1 - shut)) : -sn) * (bB - inset))];
      };
      const pts = [];
      for (let k = 0; k <= NO; k++) pts.push(E(lerp(thM, TAU, k / NO), 0));                       // outside
      const O2 = pts[pts.length - 1], I2 = E(TAU, w), c2 = [(O2[0] + I2[0]) / 2, (O2[1] + I2[1]) / 2], r2 = Math.hypot(O2[0] - I2[0], O2[1] - I2[1]) / 2;
      for (let k = 1; k <= NC; k++) { const ph = (k / (NC + 1)) * Math.PI, cu = Math.cos(ph), su = Math.sin(ph); pts.push([c2[0] + cu * (O2[0] - c2[0]), c2[1] + cu * (O2[1] - c2[1]) + su * r2]); } // inner rim, rolled
      const I1 = E(thM, w);
      for (let k = 0; k <= NO; k++) {                                                             // hollow, flattening to a plain face at the tip
        const p = E(lerp(TAU, thM, k / NO), w);
        pts.push([lerp(p[0], lerp(I2[0], I1[0], k / NO), shut), lerp(p[1], lerp(I2[1], I1[1], k / NO), shut)]);
      }
      const O = pts[0], I = pts[pts.length - 1], cm = [(O[0] + I[0]) / 2, (O[1] + I[1]) / 2], r = Math.hypot(O[0] - I[0], O[1] - I[1]) / 2;
      const tx = -Math.sin(thM) * a, tz = Math.cos(thM) * bF, tl = Math.hypot(tx, tz) || 1;
      for (let k = 1; k <= NC; k++) {                                                             // outer rim (the ridge), rolled
        const ph = (k / (NC + 1)) * Math.PI, cu = Math.cos(ph), su = Math.sin(ph);
        pts.push([cm[0] + cu * (I[0] - cm[0]) - su * r * tx / tl, cm[1] + cu * (I[1] - cm[1]) - su * r * tz / tl]);
      }
      return { y: Y(py), pts: side > 0 ? pts : pts.map(([x, z]) => [x, -z]).reverse() };
    });
    add(loft(earRings, { capBottom: false }), C);
  }

  // a short stem down to the black cat's head (the head slab's slanted end carries the rest of the neck)
  slab(C, { top: [650, 690, 797], bot: [733, 692, 797], rz: 0.58, z: 0, bt: 0.02, bb: 0.02 });

  slab(C, { top: [580, 654, 937], bot: [652.5, 633, 970], bb: 0.09 });                 // C1 – head slab
  slab(C, { top: [653, 435, 741], bot: [729.5, 405, 753], bb: 0.12 });                       // C2
  slab(C, { top: [806, 376, 630], bot: [884, 344, 657] });                                    // C3
  slab(C, { top: [948, 316, 676], bot: [1026, 286, 696] });                                   // C4
  slab(C, { top: [1089, 257, 596], bot: [1178, 234, 606], bb: 0.14, lobe: { top: [505, 693], bot: [510, 678], rz: 1.45, z: 0 } }); // C5 + shoulders
  slab(C, { top: [1230, 212, 580], bot: [1321, 209, 585], bb: 0.15, bt: 0.07, lobe: { top: [506, 648], bot: [512, 645], rz: 1.45, z: 0 } }); // C6 + shoulders

  // haunch: thick rim over a deep bowl
  slab(C, { top: [1367, 204, 548], bot: [1452, 207, 541], bt: 0.07, bb: 0.05 });
  profile(C, [[1576, 318, 405], [1573, 298, 420], [1565, 280, 432], [1555, 266, 441], [1540, 257, 459], [1520, 246, 483],
    [1500, 236, 500], [1480, 228, 512], [1460, 221, 521], [1452, 217, 524], [1444, 216, 526]], { rzK: 0.95, n: 36 });

  // front legs and paws, one each side of the chest
  for (const side of [1, -1]) {
    tube(C, [[594, 1300], [600, 1340], [617, 1410], [638, 1497], [652, 1545], [664, 1575]], [47, 47, 45, 42, 42, 44], { start: 'flat', end: 'round', z: side * 0.68 });
    paw(C, 678, 1579, 56, 40, 48, 1, side * 0.7);
  }

  // hind feet: long low runners the bowl settles into, one each side. Their flat tops reach just past the
  // bowl where it meets them, so the bowl sinks in cleanly instead of sagging over the edge. They reach back
  // under the whole haunch and their heels are undercut, carrying the bowl's curve down to the ground.
  for (const side of [1, -1]) pill(C, { x0: 266, x1: 561, top: 1558, bot: 1623, r: 0.38, z: side * 0.53, bevel: 0.08,
    rake: [[1558, 266], [1570, 278], [1585, 292], [1600, 306], [1613, 325], [1623, 345]] });

  // tail
  tube(C, [[278, 1533], [232, 1552], [190, 1557], [150, 1540], [122, 1500], [110, 1450], [112, 1400], [128, 1330], [141, 1250], [138, 1200], [123, 1163], [96, 1129]],
    [31, 29, 27.5, 26.5, 25.5, 25, 24.5, 24, 23, 22.5, 21.5, 21], { start: 'round', end: 'flat', segs: 220, z: 0 });
}

// ───────────────────────────────────────────────────────────── the black cat (right)
{
  const B = matBlack;
  // ears: a pair of cones, one each side. The far one shows past the cream ear as in the reference; the near
  // one has its inner edge held just clear of the cream ear so it never crosses in front of it.
  profile(B, [[503, 733, 836], [500, 727, 843], [496, 726, 845], [485, 729, 830], [465, 736, 806], [445, 742, 783], [430, 746, 767], [421, 748, 757], [417, 750, 753]], { z: -0.85, rzK: 0.9, n: 26 });
  profile(B, [[503, 733, 836], [500, 733, 843], [496, 734, 845], [485, 736, 830], [465, 741, 806], [445, 746, 783], [430, 749.5, 767], [421, 751.5, 757.5], [417, 752, 754.5]], { z: 0.85, rzK: 0.9, n: 26 });

  slab(B, { top: [731, 637, 1005], bot: [802, 640, 1037], bt: 0.05, bb: 0.07 });               // B1 – head slab
  // chin swelling under the head
  const chin = [];
  for (let k = 0; k <= 16; k++) {
    const p = (1 - k / 16) * Math.PI / 2 * 0.985;
    chin.push({ y: Y(792) - U(49) * Math.sin(p), pts: ellipsePts(X(703), 0, U(66) * Math.cos(p), U(84) * Math.cos(p)) });
  }
  add(loft(chin), B);

  slab(B, { top: [874, 784, 1076], bot: [948, 749, 1116] });                                    // B2
  slab(B, { top: [1016, 846, 1150], bot: [1098, 854, 1194], bb: 0.12, lobe: { top: [737, 922], bot: [748, 927], rz: 1.5, z: 0 }, k: 0.4 }); // B3 + shoulders
  slab(B, { top: [1159, 888, 1230], bot: [1247, 893, 1250], bb: 0.13, lobe: { top: [763, 930], bot: [790, 925], rz: 1.45, z: 0 } }); // B4 + shoulders
  slab(B, { top: [1301, 878, 1262], bot: [1398, 882, 1267], bt: 0.09, bb: 0.15, lobe: { top: [805, 915], bot: [808, 912], rz: 1.45, z: 0 } }); // B5 + shoulders

  // haunch bowl
  profile(B, [[1558, 1040, 1125], [1555, 1000, 1165], [1546, 968, 1200], [1530, 946, 1224], [1510, 926, 1240], [1490, 912, 1251], [1468, 904, 1257], [1448, 902, 1258], [1441, 903, 1257], [1437.5, 907, 1253]], { rzK: 0.95, n: 30 });

  // front leg stubs and paws, one each side
  for (const side of [1, -1]) {
    tube(B, [[833, 1439], [831, 1470], [826, 1505], [818, 1545], [808, 1574]], [38, 39, 43, 47, 49], { start: 'flat', end: 'round', z: side * 0.68 });
    paw(B, 796, 1583, 62, 39, 49, -1, side * 0.7);
  }
  // hind feet with toes, one each side
  for (const side of [1, -1]) {
    pill(B, { x0: 894, x1: 1222, top: 1556, bot: 1623, r: 0.5, z: side * 0.86, bevel: 0.19 });
    for (const dz of [-0.3, 0, 0.3]) ellipsoid(B, 912, 1594, side * 0.86 + dz, 24, 27, 18);
  }

  // tail
  tube(B, [[1228, 1572], [1280, 1568], [1318, 1545], [1338, 1497], [1343, 1413], [1343, 1330], [1346, 1247], [1364, 1192], [1390, 1152], [1408, 1132]],
    [33, 32, 30, 28, 26, 25, 24.5, 26, 29, 28], { start: 'round', end: 'round', segs: 200, z: 0 });
}

// ───────────────────────────────────────────────────────────── cyclorama: floor sweeping up into the wall
// The backdrop and the lights turn with the camera (as if the cats sat on a turntable in a fixed studio),
// so the sculpture is lit and framed the same way from every side.
let cyc;
{
  const FY = 0.07;
  const prof = [[140, FY], [40, FY], [10, FY], [-4.5, FY]];
  const R = 7.5, zc = -4.5;
  for (let k = 1; k <= 24; k++) { const p = (k / 24) * Math.PI / 2; prof.push([zc - R * Math.sin(p), FY + R - R * Math.cos(p)]); }
  prof.push([zc - R, 30], [zc - R, 90]);
  const xs = [-220, 220], pos = [], idx = [];
  for (const [z, y] of prof) for (const x of xs) pos.push(x, y, z);
  for (let k = 0; k < prof.length - 1; k++) { const a = k * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  cyc = new THREE.Mesh(g, matCyc); cyc.receiveShadow = true; scene.add(cyc);
}

// ───────────────────────────────────────────────────────────── lights
const cfg = {
  keyDir: new THREE.Vector3(-0.5, 0.78, 0.42),
  keySpread: 0.4,                 // softbox size (tan of half-angle)
  keyI: 3.5, skyI: 0.62,
  skyTop: 0.5,                     // how much brighter the dome is overhead than at the horizon
  skySide: 0.6,                    // extra dome brightness toward the key side
};

function shadowLight(color, size) {
  const l = new THREE.DirectionalLight(color, 1);
  l.castShadow = true;
  l.shadow.mapSize.set(size, size);
  const c = l.shadow.camera; c.left = -11; c.right = 11; c.top = 11; c.bottom = -11; c.near = 34; c.far = 66; c.updateProjectionMatrix();
  l.shadow.bias = -0.00025; l.shadow.normalBias = 0.012; l.shadow.radius = 1.5;
  l.target.position.set(0, 6.4, 0);
  scene.add(l, l.target);
  return l;
}
const key = shadowLight(0xfff1dd, 4096);
const sky = shadowLight(0xf6e6d2, 2048);
const hemi = new THREE.HemisphereLight(0xf6e6d2, 0x1a2540, 1);   // stands in for the sky dome while orbiting
const amb = new THREE.AmbientLight(0xb89468, 0.06);
scene.add(hemi, amb);

const LT = new THREE.Vector3(0, 6.4, 0);
const KEY_DIR = new THREE.Vector3(), kU = new THREE.Vector3(), kV = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
let studioAz = 0;
function syncStudio() {
  studioAz = Math.atan2(camera.position.x - TARGET.x, camera.position.z - TARGET.z);
  cyc.rotation.y = studioAz;
}
function keyBasis() {
  syncStudio();
  KEY_DIR.copy(cfg.keyDir).normalize().applyAxisAngle(UP, studioAz);
  kU.crossVectors(KEY_DIR, UP).normalize();
  kV.crossVectors(kU, KEY_DIR).normalize();
}
const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
const tmp = new THREE.Vector3();

function lightsPreview() {
  keyBasis();
  key.position.copy(LT).addScaledVector(KEY_DIR, 50); key.intensity = cfg.keyI;
  sky.visible = false; hemi.visible = true; hemi.intensity = cfg.skyI * 0.42;
}
function lightsSample(s) {
  keyBasis();
  const r = Math.sqrt(halton(s, 2)) * cfg.keySpread, a = 2 * Math.PI * halton(s, 3);
  tmp.copy(KEY_DIR).addScaledVector(kU, r * Math.cos(a)).addScaledVector(kV, r * Math.sin(a)).normalize();
  key.position.copy(LT).addScaledVector(tmp, 50); key.intensity = cfg.keyI;
  // one direction of a sky dome that is brighter overhead and toward the key side
  const y = 0.03 + 0.97 * halton(s, 5), rr = Math.sqrt(1 - y * y), ph = 2 * Math.PI * halton(s, 7);
  tmp.set(rr * Math.cos(ph), y, rr * Math.sin(ph));
  const w = (1 - cfg.skyTop + cfg.skyTop * y) * (1 + cfg.skySide * Math.max(0, tmp.dot(KEY_DIR)));
  sky.position.copy(LT).addScaledVector(tmp, 50); sky.intensity = cfg.skyI * w;
  sky.visible = true; hemi.visible = false;
}

// ───────────────────────────────────────────────────────────── progressive accumulation
const fsScene = new THREE.Scene();
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const fsQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
fsQuad.frustumCulled = false;
fsScene.add(fsQuad);
const FS_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

const blendMat = new THREE.ShaderMaterial({
  uniforms: { tPrev: { value: null }, tNew: { value: null }, uAlpha: { value: 1 } },
  vertexShader: FS_VERT,
  fragmentShader: /* glsl */`uniform sampler2D tPrev, tNew; uniform float uAlpha; varying vec2 vUv;
    void main(){ gl_FragColor = vec4(mix(texture2D(tPrev, vUv).rgb, texture2D(tNew, vUv).rgb, uAlpha), 1.); }`,
  depthTest: false, depthWrite: false,
});

const outMat = new THREE.ShaderMaterial({
  uniforms: { tWire: { value: null }, tPreview: { value: null }, tAccum: { value: null }, uExposure: { value: 1.0 }, uAspect: { value: 1 },
    uF1: { value: 1.1 }, uF2: { value: 1.1 }, uDissolve: { value: 0 },
    tNum: { value: null }, tMask: { value: null }, uNum: { value: 0 } },
  vertexShader: FS_VERT,
  fragmentShader: /* glsl */`
    uniform sampler2D tWire, tPreview, tAccum, tNum, tMask; uniform float uF1, uF2, uDissolve, uExposure, uAspect, uNum; varying vec2 vUv;
    float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
    void main(){
      // Three layers, uncovered from the floor upward by two fronts: wireframe → plain lit materials → the
      // refined image with its soft shadows.
      vec3 wire = texture2D(tWire, vUv).rgb, clay = texture2D(tPreview, vUv).rgb, acc = texture2D(tAccum, vUv).rgb;
      float mask = texture2D(tMask, vUv).r, d1 = vUv.y - uF1;
      float on1 = smoothstep(-.1, -.04, uF1) * (1. - smoothstep(1.04, 1.1, uF1));
      float r1 = 1. - smoothstep(-.004, .004, d1);
      float r2 = 1. - smoothstep(uF2 - .07, uF2 + .07, vUv.y);
      wire *= 1. + 2.4 * on1 * exp(-max(d1, 0.) / .1);                      // the wires charge up just ahead of the fill
      vec3 c = mix(wire, clay, r1);
      c = mix(c, acc, r2);
      c += (clay + .02) * vec3(.5, .68, 1.) * on1 * r1 * exp(d1 / .04) * (.2 + .8 * mask);   // fresh material still glowing
      c += vec3(.5, .72, 1.) * on1 * exp(-d1 * d1 / 6.5e-6) * (.12 + .88 * mask) * 1.5;      // the front: a thin bright line
      c = mix(c, clay, uDissolve);                                           // a finished image melting back into wires
      c *= uExposure;
      vec2 q = (vUv - .5) * vec2(min(uAspect / ${IMG_A.toFixed(4)}, 1.6), 1.);
      c *= mix(1., .58, smoothstep(.34, 1.0, length(q) * 1.2));
      c = aces(c);
      c = pow(c, vec3(1. / 2.2));
      // the progress number: pale against the backdrop, and only where no sculpture covers it
      float num = texture2D(tNum, vUv).r * (1. - texture2D(tMask, vUv).r) * uNum;
      c = mix(c, vec3(.87, .9, .96), num * .82);
      c += (h12(gl_FragCoord.xy) - .5) * .022 * (1. - .5 * dot(c, vec3(.33)));
      gl_FragColor = vec4(c, 1.);
    }`,
  depthTest: false, depthWrite: false,
});

let rtPreview, rtWire, rtSample, rtA, rtB, rtMask, bufW = 0, bufH = 0;
function makeTargets() {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  bufW = size.x; bufH = size.y;
  for (const t of [rtPreview, rtWire, rtSample, rtA, rtB, rtMask]) t && t.dispose();
  const accType = floatOK ? THREE.FloatType : THREE.HalfFloatType;
  rtPreview = new THREE.WebGLRenderTarget(bufW, bufH, { type: THREE.HalfFloatType, samples: 4 });
  rtWire = new THREE.WebGLRenderTarget(bufW, bufH, { type: THREE.HalfFloatType, samples: 4 });
  rtSample = new THREE.WebGLRenderTarget(bufW, bufH, { type: THREE.HalfFloatType, samples: 0 });
  const acc = { type: accType, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter };
  rtA = new THREE.WebGLRenderTarget(bufW, bufH, acc);
  rtB = new THREE.WebGLRenderTarget(bufW, bufH, acc);
  rtMask = new THREE.WebGLRenderTarget(bufW, bufH, { samples: 4 });
  numCanvas.height = Math.min(bufH, 1400); numCanvas.width = Math.max(Math.round(numCanvas.height * bufW / bufH), 2);
  numTex.dispose();   // the canvas changed size, so its GPU copy has to be rebuilt
  numShown = -1;
}

let samples = 0, dirty = true;

// The refining percentage, drawn as a small number in the top-left corner of the backdrop. It is composited in the
// output pass (not in the scene) so it never smears into the accumulated image; a silhouette mask of the
// sculpture keeps it behind them.
const numCanvas = document.createElement('canvas'), numCtx = numCanvas.getContext('2d');
const numTex = new THREE.CanvasTexture(numCanvas);
numTex.generateMipmaps = false; numTex.minFilter = THREE.LinearFilter;
let numShown = -1, numAlpha = 0, doneAt = 0, lastT = performance.now();
// the number counts to 100 over the first 40% of the refinement — by then the image already reads as
// finished — and the remaining passes run on quietly without it
const NUM_SAMPLES = Math.max(Math.round(MAX_SAMPLES * 0.4), 1);
const numPct = () => Math.min(Math.round((samples / NUM_SAMPLES) * 100), 100);
const NUM_FONT = 'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
function drawNumber(pct) {
  if (pct === numShown) return;
  numShown = pct;
  const w = numCanvas.width, h = numCanvas.height, g = numCtx, txt = String(pct);
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  // small, tucked into the top-left corner
  const fs = Math.min(h, w) * 0.085, cap = fs * 0.72, x0 = Math.min(h, w) * 0.045, base = x0 + cap;
  g.font = `700 ${fs}px ${NUM_FONT}`; const wd = g.measureText(txt).width;
  g.fillText(txt, x0, base);
  g.font = `600 ${fs * 0.42}px ${NUM_FONT}`; g.fillText('%', x0 + wd + fs * 0.06, base - cap + fs * 0.42 * 0.74);
  numTex.needsUpdate = true;
}
const maskMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const MASK_BG = new THREE.Color(0x000000);
function renderMask() {
  const bg = scene.background, auto = renderer.shadowMap.autoUpdate;
  scene.background = MASK_BG; scene.overrideMaterial = maskMat; cyc.visible = false; renderer.shadowMap.autoUpdate = false;
  renderer.setRenderTarget(rtMask);
  renderer.render(scene, camera);
  scene.background = bg; scene.overrideMaterial = null; cyc.visible = true; renderer.shadowMap.autoUpdate = auto;
}

// the wireframe layer
function renderWire() {
  camera.clearViewOffset(); syncStudio();
  const px = 0.5 * renderer.getPixelRatio();
  for (const m of [wireCream, wireBlack, wireCyc]) m.uniforms.uPx.value = px;
  for (const m of group.children) m.material = m.userData.wire;
  cyc.material = wireCyc;
  const auto = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
  renderer.setRenderTarget(rtWire);
  renderer.render(scene, camera);
  renderer.shadowMap.autoUpdate = auto;
  for (const m of group.children) m.material = m.userData.solid;
  cyc.material = matCyc;
}
// the "materials only" layer: one quick frame, lit but with nothing casting shadows yet
function renderPreview() {
  camera.clearViewOffset();
  lightsPreview();
  for (const m of group.children) m.castShadow = false;
  renderer.setRenderTarget(rtPreview);
  renderer.render(scene, camera);
  for (const m of group.children) m.castShadow = true;
  renderMask();
}
function renderSample(s) {
  camera.setViewOffset(bufW, bufH, halton(s + 1, 11) - 0.5, halton(s + 1, 13) - 0.5, bufW, bufH);
  lightsSample(s + 1);
  renderer.setRenderTarget(rtSample);
  renderer.render(scene, camera);
  camera.clearViewOffset();
  // running average: rtB = mix(rtA, sample, 1 / (s + 1))
  blendMat.uniforms.tPrev.value = rtA.texture; blendMat.uniforms.tNew.value = rtSample.texture; blendMat.uniforms.uAlpha.value = 1 / (s + 1);
  fsQuad.material = blendMat;
  renderer.setRenderTarget(rtB);
  renderer.render(fsScene, fsCam);
  [rtA, rtB] = [rtB, rtA];
}
// Fill-in transition. sw1 / sw2 run 0 → 1 once the camera rests: the first front lays in the materials, the
// second follows a beat behind with the shadows and soft light. Any camera movement resets both to wireframe.
const SWEEP = 1.15;                                    // seconds for a front to cross the frame
let sw1 = 0, sw2 = 0, dissolve = 0, moving = false;
const frontAt = (t) => lerp(-0.1, 1.1, lerp(t, t * t * (3 - 2 * t), 0.6));
function present(fronts = null) {
  const u = outMat.uniforms;
  u.tWire.value = rtWire.texture; u.tPreview.value = rtPreview.texture; u.tAccum.value = rtA.texture;
  u.uF1.value = fronts ? fronts[0] : frontAt(sw1); u.uF2.value = fronts ? fronts[1] : frontAt(sw2);
  u.uDissolve.value = fronts ? 0 : dissolve;
  outMat.uniforms.tNum.value = numTex; outMat.uniforms.tMask.value = rtMask.texture; outMat.uniforms.uNum.value = numAlpha;
  fsQuad.material = outMat;
  renderer.setRenderTarget(null);
  renderer.render(fsScene, fsCam);
}

// ───────────────────────────────────────────────────────────── controls & layout
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(TARGET);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 26; controls.maxDistance = 120;
controls.autoRotateSpeed = 2.4;   // one turn in about 40 s
controls.minPolarAngle = Math.PI / 2 - 0.7; controls.maxPolarAngle = Math.PI / 2 + 0.035;
controls.rotateSpeed = 0.5; controls.zoomSpeed = 0.6;
controls.addEventListener('change', () => { dirty = true; });
controls.update();

// reference overlay: created up front for sizing, but only loaded and attached the first time it is shown
const refEl = Object.assign(new Image(), { id: 'ref', alt: 'Reference image', hidden: true });
refEl.addEventListener('error', () => { refMode = 0; refEl.hidden = true; });   // no reference.jpg alongside (a published copy): R simply does nothing
let lastW = 0, lastH = 0;
function layout() {
  lastW = window.innerWidth; lastH = window.innerHeight;
  const w = Math.max(window.innerWidth, 2), h = Math.max(window.innerHeight, 2), a = w / h;
  renderer.setSize(w, h, false);
  const halfH = a >= IMG_A ? IMG_H / 200 : (IMG_W / 200) / a;
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(halfH / D0));
  camera.aspect = a; camera.updateProjectionMatrix();
  const fh = a >= IMG_A ? h : w / IMG_A;
  refEl.style.height = fh + 'px'; refEl.style.width = fh * IMG_A + 'px';
  outMat.uniforms.uAspect.value = a;
  makeTargets();
  dirty = true;
}
window.addEventListener('resize', layout);
layout();

let refMode = params.has('ref') ? (params.get('ref') === 'half' ? 2 : 1) : 0;
// 0 = off (not even loaded), 1 = reference on top, 2 = 50% blend
const applyRef = () => {
  if (refMode && !refEl.isConnected) { refEl.src = 'reference.jpg'; document.body.append(refEl); }
  refEl.hidden = refMode === 0;
  refEl.className = refMode === 2 ? 'half' : '';
};
applyRef();

function resetView() {
  controls.autoRotate = false;
  controls.enableDamping = false; controls.update(); controls.enableDamping = true;   // flush leftover orbit inertia
  camera.position.copy(CAM_HOME); controls.target.copy(TARGET); controls.update(); dirty = true; }
function savePNG() {
  const a0 = numAlpha; numAlpha = 0; present([1.1, 1.1]); numAlpha = a0;   // always the finished image, never the number or the wires
  renderer.domElement.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'sliced-cats.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, 'image/png');
}
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'r') { refMode = (refMode + 1) % 3; applyRef(); }
  else if (k === 's') savePNG();
  else if (k === '0') resetView();
  else if (k === ' ') { e.preventDefault(); controls.autoRotate = !controls.autoRotate; dirty = true; }
});
renderer.domElement.addEventListener('dblclick', resetView);

// ───────────────────────────────────────────────────────────── loop
const perFrame = () => +(params.get('spf') || (bufW * bufH < 2.6e6 ? 4 : bufW * bufH < 5.5e6 ? 2 : 1));
function tick() { requestAnimationFrame(tick); frame(); }
function frame() {
  if (window.innerWidth !== lastW || window.innerHeight !== lastH) layout();
  controls.update();
  const now = performance.now(), dt = Math.min((now - lastT) / 1000, 0.1); lastT = now;
  let drew = false;
  if (dirty) {
    // the camera is moving: wireframe. Whatever image was up melts into the wires over a few frames.
    dirty = false; samples = 0;
    if (!moving) { moving = true; dissolve = THREE.MathUtils.smoothstep(sw1, 0.15, 0.6); }
    sw1 = sw2 = 0;
    dissolve *= Math.exp(-dt / 0.08); if (dissolve < 0.01) dissolve = 0;
    renderWire();
    if (dissolve > 0) renderPreview(); else renderMask();
    drew = true;
  } else {
    if (moving) { moving = false; dissolve = 0; }
    if (samples < MAX_SAMPLES) {
      if (samples === 0) renderPreview();
      for (let i = perFrame(); i > 0 && samples < MAX_SAMPLES; i--) { renderSample(samples); samples++; }
      drew = true;
    }
    if (sw2 < 1) {
      sw1 = Math.min(sw1 + dt / SWEEP, 1);
      if (sw1 > 0.26 && samples >= 12) sw2 = Math.min(sw2 + dt / SWEEP, 1);   // shadows wait for a few passes to settle
      drew = true;
    }
  }
  // the number shows while it counts up, holds a moment at 100, then fades away
  const numDone = samples >= NUM_SAMPLES;
  if (!numDone) doneAt = 0; else if (!doneAt) doneAt = now;
  const want = (samples > 0 && !numDone) || (numDone && now - doneAt < 900) ? 1 : 0;
  if (numAlpha !== want) {
    numAlpha += (want - numAlpha) * (1 - Math.exp(-dt * (want ? 6 : 3)));
    if (Math.abs(want - numAlpha) < 0.004) numAlpha = want;
    drew = true;
  }
  if (!drew) return;
  if (samples > 0) drawNumber(numPct());
  present();
}

// debugging / tuning handle
window.__cats = {
  THREE, scene, camera, renderer, key, sky, hemi, amb, outMat, controls, cfg, mats: { matCream, matBlack, matCyc },
  redraw: () => { dirty = true; },
  get samples() { return samples; },
  frame,   // run one frame of the loop by hand (the loop itself stops while the tab is hidden)
  // synchronously refine to n samples (useful when the tab is throttled) and return a PNG data URL.
  // number: keep the progress number in the capture. fronts: [f1, f2] freezes the fill-in transition with its
  // two fronts at those heights (0 = bottom of the frame, 1 = top); left out, the finished image is returned.
  converge(n = 96, { number = false, fronts = null } = {}) {
    if (window.innerWidth !== lastW || window.innerHeight !== lastH) layout();
    samples = 0; dirty = false; moving = false; dissolve = 0; sw1 = sw2 = 1;
    renderWire(); renderPreview();
    for (let i = 0; i < n; i++) { renderSample(samples); samples++; }
    if (number) drawNumber(numPct());
    numAlpha = number ? 1 : 0;
    present(fronts ?? [1.1, 1.1]);
    return renderer.domElement.toDataURL('image/png');
  },
};

try { tick(); } catch (err) {
  const el = document.getElementById('err'); el.style.display = 'grid'; el.textContent = 'WebGL error: ' + err.message;
}
