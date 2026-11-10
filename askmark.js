// Ask Novo mark: the Novo "n" splits into one leg, turns into the four-petal mark, thinks, then lands
// as the avatar of an intro chat screen. Geometry and timing are ported from Mayck's "Ask Novo Logo
// Evolution" Motion film; every frame is a pure function of time, so it can scrub, replay or rest.
(() => {
const root = document.querySelector("[data-askmark]");
if (!root) return;
const kit = { h(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; } };
// The drafting sheet: one rig and one camera, both posed from FILM time, so the mark never stops or jumps at a cut.
// Film seconds: sheet 0 | take 3.0 | turn 6.0 | round 9.2 | shift 12.0 | think 14.8 | end 18.0-22.8
//   mark inks in -1.4-1.2 | letters un-draw 2.6-3.6 | n splits, arch vanishes 3.6-4.1 | camera glides to the cross 3.9-5.3 (the leg never moves on the sheet)
//   arms swing 6.6/6.95/7.3 +1.6 | corners round 9.5+0.3k +1.1 | offset 12.0+0.12k +1.3 | wheel 15.2 (3.5 s) | end move 18.8-20.0
// The wordmark is placed so the n's leg already stands in the cross's bottom slot: origin (924.04, 561.06), scale 9.4.
const W = {};
Object.assign(W, {
  WORD_ARCH: 'M7.65027 9.80805e-08V7.82595C8.65536 7.82526 9.65073 8.0272 10.5795 8.42024C11.5082 8.81328 12.3521 9.38969 13.0628 10.1165C13.7736 10.8434 14.3372 11.7064 14.7216 12.6562C15.106 13.606 15.3036 14.6239 15.303 15.6519V23.5164H22.9558V15.6519C22.9558 13.5963 22.5599 11.5609 21.7907 9.66177C21.0215 7.76268 19.8941 6.03715 18.4728 4.58372C17.0516 3.13028 15.3643 1.97741 13.5073 1.19093C11.6504 0.404448 9.66014 -0.000230013 7.65027 9.80805e-08Z',
  WORD_LETTERS: ['M30.5356 8.0117H34.918V10.1914H35.2152C36.3399 8.43922 37.7918 7.55789 39.6275 7.55789C43.0616 7.55789 45.3427 10.2834 45.3427 14.0084V23.5182H40.9604V14.6436C40.9604 12.7346 39.8931 11.4021 38.1165 11.4021C36.3699 11.4021 34.918 12.8257 34.918 14.7934V23.5182H30.5356V8.0117Z', 'M47.3446 15.7649C47.3446 10.7669 50.6904 7.52985 55.7538 7.52985C60.7879 7.52985 64.1646 10.7713 64.1646 15.7649C64.1646 20.7918 60.7879 24 55.7538 24C50.6904 24 47.3446 20.7585 47.3446 15.7649ZM59.7523 15.7649C59.7523 13.191 58.094 11.3732 55.7538 11.3732C53.3853 11.3732 51.7278 13.191 51.7278 15.7649C51.7278 18.3388 53.3861 20.1865 55.7538 20.1865C58.094 20.1865 59.7523 18.3388 59.7523 15.7649Z', 'M64.2323 8.01172H68.851L72.5241 19.8536H72.8205L76.5218 8.01172H81.1114L75.8399 23.5182H69.5038L64.2323 8.01172Z', 'M81.1799 15.7649C81.1799 10.7669 84.5258 7.52985 89.5891 7.52985C94.6233 7.52985 97.9999 10.7713 97.9999 15.7649C97.9999 20.7918 94.6233 24 89.5891 24C84.5258 24 81.1799 20.7585 81.1799 15.7649ZM93.5876 15.7649C93.5876 13.191 91.9293 11.3732 89.5891 11.3732C87.2206 11.3732 85.5631 13.191 85.5631 15.7649C85.5631 18.3388 87.2206 20.1865 89.5891 20.1865C91.9293 20.1865 93.5876 18.3388 93.5876 15.7649Z'],
  cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; },
  seg(F, a, b) { return W.cl((F - a) / (b - a)); },
  lerp(a, b, p) { return a + (b - a) * p; },
  eio(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
  eob(x, s) { return x <= 0 ? 0 : x >= 1 ? 1 : 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); },
  // A point of the leaf system (40 units round the mark's centre) on the sheet, turned clockwise by deg.
  pt(u, v, deg) { const a = (deg || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [960 + 9 * (u * c - v * s), 600 + 9 * (u * s + v * c)]; },
  // A petal pointing up in the leaf system, from the square leg (p 0) to the rounded leaf (p 1).
  petalPath(p) {
    const k = 0.5523, x0 = -4, x1 = 4, y0 = -20 - 2 * p, y1 = -4 + 1 * p;
    const tl = 8 * p, br = 8, tr = 0, bl = 0;
    const f = n => n.toFixed(3);
    return 'M' + f(x0 + tl) + ',' + f(y0) +
      ' L' + f(x1 - tr) + ',' + f(y0) + ' C' + f(x1 - tr + k * tr) + ',' + f(y0) + ' ' + f(x1) + ',' + f(y0 + tr - k * tr) + ' ' + f(x1) + ',' + f(y0 + tr) +
      ' L' + f(x1) + ',' + f(y1 - br) + ' C' + f(x1) + ',' + f(y1 - br + k * br) + ' ' + f(x1 - br + k * br) + ',' + f(y1) + ' ' + f(x1 - br) + ',' + f(y1) +
      ' L' + f(x0 + bl) + ',' + f(y1) + ' C' + f(x0 + bl - k * bl) + ',' + f(y1) + ' ' + f(x0) + ',' + f(y1 - bl + k * bl) + ' ' + f(x0) + ',' + f(y1 - bl) +
      ' L' + f(x0) + ',' + f(y0 + tl) + ' C' + f(x0) + ',' + f(y0 + tl - k * tl) + ' ' + f(x0 + tl - k * tl) + ',' + f(y0) + ' ' + f(x0 + tl) + ',' + f(y0) + ' Z';
  },
  // Offset morph: the rounded leaf (LEAF14) to the real mark's top petal (FINAL14), point by point.
  LEAF14: [[4,-22],[4,-11],[4,-8.791],[3.1045,-6.791],[1.65675,-5.34325],[0.209,-3.8955],[-1.791,-3],[-4,-3],[-4,-14],[-4,-16.209],[-3.1045,-18.209],[-1.65675,-19.65675],[-0.209,-21.1045],[1.791,-22]],
  FINAL14: [[4.84853,-17.77778],[4.83858,-12.49541],[4.83858,-10.03858],[3.85582,-7.58939],[2.08871,-5.8517],[0.6416,-4.42878],[-1.22951,-3.51644],[-3.23236,-3.23236],[-3.23076,-8.60672],[-3.23058,-11.06347],[-2.23804,-13.42082],[-0.47093,-15.1584],[0.97618,-16.58124],[2.84569,-17.4936]],
  offsetPath(p) {
    const P = W.LEAF14.map((a, i) => { const b = W.FINAL14[i]; return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p]; });
    const f = q => q[0].toFixed(3) + ',' + q[1].toFixed(3);
    return 'M' + f(P[0]) + ' L' + f(P[1]) + ' C' + f(P[2]) + ' ' + f(P[3]) + ' ' + f(P[4]) + ' C' + f(P[5]) + ' ' + f(P[6]) + ' ' + f(P[7]) +
      ' L' + f(P[8]) + ' C' + f(P[9]) + ' ' + f(P[10]) + ' ' + f(P[11]) + ' C' + f(P[12]) + ' ' + f(P[13]) + ' ' + f(P[0]) + ' Z';
  },
  bez(x1, y1, x2, y2) {
    const cx = 3*x1, bx = 3*(x2-x1)-cx, ax = 1-cx-bx, cy = 3*y1, by = 3*(y2-y1)-cy, ay = 1-cy-by;
    const sx = u => ((ax*u+bx)*u+cx)*u, sy = u => ((ay*u+by)*u+cy)*u;
    return x => { if (x <= 0) return 0; if (x >= 1) return 1; let lo = 0, hi = 1, u = x; for (let i = 0; i < 24; i++) { const v = sx(u); if (Math.abs(v-x) < 1e-5) break; if (v < x) lo = u; else hi = u; u = (lo+hi)/2; } return sy(u); };
  },
  // The thinking loop's easing, shared by the rig and the plotted curve.
  spinEase(x) { return (W._E || (W._E = W.bez(0.55, 0, 0.45, 1)))(x); },
  // The Wheel loop (3.5 s, two turns, petals fold -138 deg about their hinge and push out).
  wheelLeaf(turn, folds, u, cycle) {
    const c = cycle || 3.5, p = W.cl(u / c);
    const half = p < 0.5 ? W.spinEase(p / 0.5) : W.spinEase((1 - p) / 0.5);
    turn.setAttribute('transform', 'rotate(' + (720 * W.spinEase(p)) + ')');
    const hx = -1.42222, hy = -1.52889, push = 2.84444 * half;
    const tf = 'translate(' + (0.316 * push) + ' ' + (-0.949 * push) + ') rotate(' + (-138 * half) + ' ' + hx + ' ' + hy + ')';
    for (const f of folds) f.setAttribute('transform', tf);
  },
  armSwing(F, i) { if (i === 0) return 0; const a0 = 6.6 + 0.35 * (i - 1); return W.eob(W.seg(F, a0, a0 + 1.6), 1.3); },
  armRound(F, i) { return W.eio(W.seg(F, 9.5 + 0.3 * i, 10.6 + 0.3 * i)); },
  // The petals take their final form while the camera pulls back (12.0-13.6), so the mark stylises as it shrinks.
  armShift(F, i) { return W.eio(W.seg(F, 12.0 + 0.12 * i, 13.3 + 0.12 * i)); },
  // The camera: the sheet point (960,600), the mark's centre, sits at screen (x,y) at zoom z.
  cam(F) {
    const s = (a, b) => W.seg(F, a, b), e = W.eio;
    // Opening: the wordmark is centred (its centre, sheet 1384.6,674, at screen 960,600). Then ONE eased glide reframes onto the cross, which carries the leg on screen in a straight line.
    const z = 1 + 0.02 * s(0, 3) + 0.13 * e(s(3.9, 5.3)) + 0.05 * s(5.3, 9.2) + 0.35 * e(s(9.3, 10.5)) + 0.05 * s(10.5, 12) - 0.3 * e(s(12, 13.6)) - 0.04 * s(13, 18.2) - 0.26 * e(s(18.4, 19.8)) + 0.015 * s(19.8, 22.8);
    const go = e(s(3.9, 5.3)), back = e(s(18.4, 19.8));
    return { x: W.lerp(535.4, 1240, go) - 280 * back, y: W.lerp(526, 560, go) + 40 * back, z };
  },
  rig(kit) {
    const dash = ' pathLength="1" style="stroke-dasharray:1 1"';
    const arm = '<g class="lg-rot"><g class="lg-leg"><g class="lg-fold"><path class="mk lg-arm"' + dash + ' d="' + W.petalPath(0) + '"/></g></g></g>';
    // One construction circle and one centre mark run through the whole build: the circle rings the n, travels with it and becomes the guide round the centre.
    const svg = kit.h('<svg class="art" viewBox="0 0 1920 1080">' +
      '<circle class="ln lg-ring" pathLength="1" style="stroke-dasharray:1 1" cx="660" cy="598" r="150"/>' +
      '<path class="ln lg-cross" d="M932 600 H988 M960 572 V628"/>' +
      '<g class="lg-letters">' + W.WORD_LETTERS.map(d => '<path class="mk lg-ltr"' + dash + ' d="' + d + '"/>').join('') + '</g>' +
      '<g class="lg-arch"><path class="mk lg-archp"' + dash + ' d="' + W.WORD_ARCH + '"/></g>' +
      '<g class="lg-leaf"><g class="lg-turn">' + arm + arm + arm + arm + '</g></g></svg>');
    const q = s => [...svg.querySelectorAll(s)];
    return { svg, letters: svg.querySelector('.lg-letters'), arch: svg.querySelector('.lg-arch'), leaf: svg.querySelector('.lg-leaf'), turn: svg.querySelector('.lg-turn'),
      rots: q('.lg-rot'), legs: q('.lg-leg'), folds: q('.lg-fold'), arms: q('.lg-arm'), inks: q('.lg-archp, .lg-arm'), ltrs: q('.lg-ltr'),
      ring: svg.querySelector('.lg-ring'), cross: svg.querySelector('.lg-cross') };
  },
  pose(r, F) {
    const seg = (a, b) => W.seg(F, a, b), lerp = W.lerp, eio = W.eio, eo = x => 1 - Math.pow(1 - x, 3);
    // Ink: the outline is drawn, then filled; the stroke leaves as the fill arrives.
    const dw = eio(seg(-1.4, 0.6)), fo = eio(seg(0.3, 1.2));
    for (const p of r.inks) p.style.strokeDashoffset = (1 - dw).toFixed(4);
    // The letters stay where they are: their fill lifts back to the outline, then the outline is un-drawn, the way it was drawn, before the n moves.
    const lf = eio(seg(2.6, 3.0)), lu = eio(seg(3.0, 3.6));
    r.letters.setAttribute('transform', 'translate(924.04 561.06) scale(9.4)');
    r.letters.style.fillOpacity = fo * (1 - lf);
    r.letters.style.strokeOpacity = Math.min(1, 1 - fo + lf);
    for (const p of r.ltrs) p.style.strokeDashoffset = (1 - dw + lu).toFixed(4);
    // The split: the arch parts from the leg along their seam and vanishes as it goes (3.6-4.1); the leg stays exactly where it is.
    const sp = eio(seg(3.6, 4.1));
    r.arch.setAttribute('transform', 'translate(' + (924.04 + 16 * sp) + ' 561.06) scale(9.4)');
    r.arch.style.opacity = 1 - eio(seg(3.75, 4.1));
    r.arch.style.fillOpacity = fo; r.arch.style.strokeOpacity = 1 - fo;
    // The guide circle round the centre: drawn as the copies start to turn, cleared with the angle arcs, drawn again as the track for the thinking spin.
    r.ring.setAttribute('cx', '960'); r.ring.setAttribute('cy', '600'); r.ring.setAttribute('r', '210');
    r.ring.setAttribute('transform', 'rotate(-90 960 600)');
    W.drawOn(r.ring, F < 12 ? eio(seg(6.0, 6.7)) : eio(seg(14.8, 15.4)));
    r.ring.style.opacity = W.cl(eo(seg(6.0, 6.1)) - eio(seg(8.7, 9.2)) + eio(seg(14.8, 15.0)) - eio(seg(18.5, 19.1)));
    r.cross.style.opacity = eo(seg(4.0, 4.4)) * (1 - eio(seg(14.8, 15.2)));
    // Leaf group: breathing, then the end move (shrink, travel left, a quarter turn).
    const b = 1 + 0.006 * Math.sin(F * 2 * Math.PI / 3.2);
    const pe = eio(seg(18.8, 20.0));
    r.leaf.setAttribute('transform', 'translate(' + lerp(960, 620, pe) + ' ' + lerp(600, 540, pe) + ') rotate(' + (90 * pe) + ') scale(' + (9 * b * lerp(1, 220 / 384, pe)) + ')');
    r.leaf.style.fillOpacity = fo; r.leaf.style.strokeOpacity = 1 - fo;
    // The leg: the square petal laid exactly over the n's leg (turned 180). The wordmark stands so that this IS the cross's bottom slot;
    // only a last-pixel fit (under 3%) eases in while the camera glides, so the leg never travels (the mark ends turned 180, which its four-fold symmetry hides).
    const q = eio(seg(3.9, 5.3));
    const ax = (924.04 + 3.8255 * 9.4 - 960) / (9 * b), ay = (561.06 + 15.632 * 9.4 - 600) / (9 * b);
    const leg = 'translate(' + lerp(ax, 0, q) + ' ' + lerp(ay, 12, q) + ') rotate(180) scale(' + lerp(0.9563 * 9.4 / (9 * b), 1, q) + ' ' + lerp(0.9856 * 9.4 / (9 * b), 1, q) + ') translate(0 12)';
    for (const g of r.legs) g.setAttribute('transform', leg);
    for (let i = 0; i < 4; i++) {
      r.rots[i].setAttribute('transform', 'rotate(' + (90 * i * W.armSwing(F, i)) + ')');
      const po = W.armShift(F, i);
      r.arms[i].setAttribute('d', po > 0 ? W.offsetPath(po) : W.petalPath(W.armRound(F, i)));
    }
    W.wheelLeaf(r.turn, r.folds, F - 15.2, 3.5);
  },
  // The sheet's border with its zone ticks, fixed to the frame.
  sheetFrame() {
    let s = '<svg class="art bp-frame" viewBox="0 0 1920 1080"><rect class="ln soft" x="40" y="40" width="1840" height="1000"/><path class="ln soft" d="';
    for (let x = 160; x < 1880; x += 160) s += 'M' + x + ' 40 v16 M' + x + ' 1040 v-16 ';
    for (let y = 160; y < 1040; y += 160) s += 'M40 ' + y + ' h16 M1880 ' + y + ' h-16 ';
    return s + '"/></svg>';
  },
  block() {
    return '<div class="words bp-block"><p class="bp-name">Ask Novo</p><p class="mono">Mark construction</p><p class="mono">Sheet 1 of 1 · Scale 9:1</p></div>';
  },
  // Every scene is a view of the same sheet: o.under (svg under the mark), o.notes (labels over it, sheet px), o.words and o.screen (fixed to the frame).
  build(kit, o) {
    const r = W.rig(kit);
    const root = kit.h('<div class="ground"><div class="bp-sheet"><div class="bp-pool"></div><div class="bp-grid"></div><svg class="art bp-under" viewBox="0 0 1920 1080">' + (o.under || '') + '</svg></div>' + W.sheetFrame() + '<div class="edge"></div>' + W.block() + '</div>');
    const sheet = root.querySelector('.bp-sheet');
    sheet.append(r.svg);
    if (o.notes) sheet.append(kit.h('<div class="bp-notes">' + o.notes + '</div>'));
    if (o.screen) root.append(kit.h(o.screen));
    if (o.words) root.append(kit.h(o.words));
    kit.stage.append(root);
    return { root, sheet, rig: r, q: s => root.querySelector(s), qa: s => [...root.querySelectorAll(s)] };
  },
  frame(b, F) {
    const c = W.cam(F);
    b.sheet.style.transform = 'translate(' + c.x.toFixed(2) + 'px,' + c.y.toFixed(2) + 'px) scale(' + c.z.toFixed(4) + ') translate(-960px,-600px)';
    W.pose(b.rig, F);
  },
  // A path with pathLength="1" and stroke-dasharray 1 1, drawn from 0 to p.
  drawOn(el, p) { el.style.strokeDashoffset = (1 - W.cl(p)).toFixed(4); },
});

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const art = root.querySelector(".am-art");
const r = W.rig(kit);
// The rig is one 1920x1080 sheet; the panel shows it through a camera group.
const svg = r.svg;
svg.setAttribute("viewBox", "0 0 800 1000");
svg.setAttribute("aria-hidden", "true");
svg.removeAttribute("class"); // "art" is also the page's Art section class
const cam = document.createElementNS("http://www.w3.org/2000/svg", "g");
while (svg.firstChild) cam.appendChild(svg.firstChild);
svg.appendChild(cam);
art.appendChild(svg);

// Panel time t (s) to film time F: the build plays faster than the film, the thinking spin at film speed.
const MAP = [[0, -1.2], [2.0, 1.2], [2.6, 2.6], [4.2, 5.4], [9.0, 14.8], [12.9, 18.7]];
const MAIN = MAP[MAP.length - 1][0], LAND = 1.5, END = MAIN + LAND;
function filmTime(t) {
  for (let i = 1; i < MAP.length; i++) {
    const [t0, f0] = MAP[i - 1], [t1, f1] = MAP[i];
    if (t <= t1) return W.lerp(f0, f1, W.cl((t - t0) / (t1 - t0)));
  }
  return MAP[MAP.length - 1][1];
}
const K = 0.62;                 // panel scale of the film frame
const CX = 400, CY = 470;       // where the mark's centre sits while it is built
const AVATAR = { x: 400, y: 232, s: 0.26 };
const ui = root.querySelector(".am-ui");

function render(t) {
  const F = filmTime(Math.min(t, MAIN));
  W.pose(r, F);
  // Once un-drawn, the letters leave the sheet entirely (a zero-length dash can still leave a speck).
  r.letters.style.display = F > 3.62 ? "none" : "";
  r.arch.style.display = F > 4.12 ? "none" : "";
  const c = W.cam(F);
  let s = c.z * K;
  const go = W.eio(W.seg(F, 3.9, 5.3));
  // Opening: the whole wordmark is framed; one eased glide then centres the mark, as in the film.
  let x = W.lerp(CX - (1384.6 - 960) * s, CX, go);
  let y = W.lerp(CY - (674 - 600) * s, CY, go);
  const land = W.eio(W.cl((t - MAIN) / LAND));
  if (land > 0) {
    x = W.lerp(x, AVATAR.x, land);
    y = W.lerp(y, AVATAR.y, land);
    s = W.lerp(s, AVATAR.s, land);
    r.ring.style.opacity = String(Number(r.ring.style.opacity || 0) * (1 - land));
    r.cross.style.opacity = String(Number(r.cross.style.opacity || 0) * (1 - land));
  }
  cam.setAttribute("transform", "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") scale(" + s.toFixed(4) + ") translate(-960 -600)");
  const show = W.eio(W.cl((t - MAIN - LAND * 0.45) / (LAND * 0.55)));
  ui.style.setProperty("--am-in", show.toFixed(3));
  root.toggleAttribute("data-landed", show >= 1);
}

let start = 0, raf = 0, playing = false;
function tick(now) {
  const t = (now - start) / 1000;
  render(t);
  if (t < END) raf = requestAnimationFrame(tick);
  else { playing = false; root.classList.remove("is-playing"); }
}
function play() {
  cancelAnimationFrame(raf);
  playing = true; root.classList.add("is-playing");
  start = performance.now();
  raf = requestAnimationFrame(tick);
}

const replay = root.parentElement.querySelector(".am-replay");
if (reduced) {
  render(END);
  if (replay) replay.hidden = true;
} else {
  render(0);
  if (replay) replay.addEventListener("click", play);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); play(); }
    }, { threshold: 0.5 });
    io.observe(root);
  } else play();
}
})();
