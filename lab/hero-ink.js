// Test page (lab/hero-ink.html): the hero as a marker drawing. Two pyramids are drawn in pen, each face in one of
// three tones (paper, hatching, solid ink), with their shadows hatched on the floor. The pointer is the light:
// nothing marks it, but as it moves the shadows swing away from it and the faces change tone. It is all drawn on a
// 2D canvas, and only redrawn while the light is moving.
(() => {
  const panel = document.querySelector(".hero.lens");
  if (!panel) return;
  const cv = panel.querySelector(".lens-fx"), x = cv.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const INK = "#17141a", PAPER = getComputedStyle(panel.querySelector(".lens-grey")).backgroundColor;
  const YAW = 0.62, PITCH = 0.4, ca = Math.cos(YAW), sa = Math.sin(YAW), cp = Math.cos(PITCH), sp = Math.sin(PITCH);
  const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  let W = 0, H = 0, dpr = 1, phone = false, A = 60, Hh = 150, cx = 0, base = 0, f = 800, dots = null;
  const light = { x: 0, y: 0, tx: 0, ty: 0, on: false };

  // Every stroke has its own wobble, fixed by a number, so the drawing holds still from one frame to the next.
  const rng = (s) => { s = (Math.abs(Math.round(s)) % 2147483646) + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const hand = (x0, y0, x1, y1, w, key) => {
    const r = rng(key * 7919 + 13), L = Math.hypot(x1 - x0, y1 - y0) || 1, m = Math.max(2, Math.round(L / 26)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    x.lineWidth = w * (0.9 + 0.2 * r()); x.beginPath(); x.moveTo(x0 + (r() - 0.5), y0 + (r() - 0.5));
    for (let i = 1; i <= m; i++) { const t = i / m, j = (r() - 0.5) * 1.5; x.lineTo(x0 + (x1 - x0) * t + nx * j, y0 + (y1 - y0) * t + ny * j); }
    x.stroke();
  };
  const poly = (pts) => { x.beginPath(); pts.forEach((q, i) => (i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]))); x.closePath(); };
  const outline = (pts, w, key) => pts.forEach((q, i) => { const r = pts[(i + 1) % pts.length]; hand(q[0], q[1], r[0], r[1], w, key + i); });
  // Parallel pen lines across a shape. The lines are counted from the middle, so each one keeps its wobble as the gap changes.
  const hatch = (pts, ang, gap, w, key) => {
    x.save(); poly(pts); x.clip();
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]), mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
    const L = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 8, dx = Math.cos(ang), dy = Math.sin(ang), n = Math.ceil(L / gap);
    for (let i = -n; i <= n; i++) { const d = i * gap, ox = mx - dy * d, oy = my + dx * d; hand(ox - dx * L, oy - dy * L, ox + dx * L, oy + dy * L, w, key + (i + 500) * 3); }
    x.restore();
  };
  const hull = (pts) => {
    const s = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const q of s) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of s.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  };
  // A point of the scene on the panel: the pyramids are seen from the side and from above, in perspective.
  const P = (X, Y, Z) => { const xr = X * ca + Z * sa, zr = -X * sa + Z * ca, sc = f / (f + zr * cp - Y * sp); return [cx + xr * sc, base - (Y * cp + zr * sp) * sc, zr]; };

  function build() {
    const r = panel.getBoundingClientRect();
    panel.style.setProperty("--navw", document.querySelector(".top").offsetWidth + "px");
    W = r.width; H = r.height; phone = W < 700; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const wp = phone ? W * 0.6 : Math.min(W * 0.34, H * 0.62) * 1.04;
    A = wp / 4; Hh = A * 2.5; cx = W / 2; base = phone ? H * 0.7 : H * 0.79; f = A * 14;
    // The ground: fine ink dots, drawn once.
    dots = document.createElement("canvas"); dots.width = cv.width; dots.height = cv.height;
    const d = dots.getContext("2d"), rr = rng(4242); d.scale(dpr, dpr); d.fillStyle = INK;
    for (let i = 0, n = phone ? 260 : 520; i < n; i++) { const a = rr() * 6.283, q = Math.pow(rr(), 0.7) * A * 4.6, X = cx + Math.cos(a) * q * 1.25, Y = base - A * 1.1 + Math.sin(a) * q * 0.72; d.globalAlpha = 0.5 + 0.5 * rr(); d.beginPath(); d.arc(X, Y, 0.7 + 1.7 * rr() * rr(), 0, 6.283); d.fill(); }
    if (!light.on) { light.tx = W * 0.2; light.ty = H * 0.4; light.x = reduced ? light.tx : -W * 0.25; light.y = reduced ? light.ty : H * 0.62; }   // on load the light comes in from the left
    dirty = true;
  }

  function draw() {
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H); x.lineCap = x.lineJoin = "round"; x.strokeStyle = INK;
    // Where the light is, on the floor: away from the pointer, and longer the further off it is (a lower sun).
    const dx = cx - light.x, dy = base - A - light.y, L = Math.hypot(dx, dy) || 1, lx = dx / L, lz = (-dy / L) * 0.7, ln = Math.hypot(lx, lz) || 1;
    const dir = [(lx * ca - lz * sa) / ln, (lx * sa + lz * ca) / ln], len = Math.min(1.25, Math.max(0.3, L / (A * 5)));
    const pyrs = [-1, 1].map((sd, k) => ({ k, top: P(sd * A * 1.04, Hh, 0), base: CORNERS.map((q) => P(sd * A * 1.04 + q[0] * A, 0, q[1] * A)), tip: P(sd * A * 1.04 + dir[0] * Hh * len, 0, dir[1] * Hh * len), mid: P(sd * A * 1.04, 0, 0)[2] })).sort((p0, p1) => p1.mid - p0.mid);
    const LW = phone ? 1.8 : 2.4;
    for (const py of pyrs) hatch(hull(py.base.map((q) => [q[0], q[1]]).concat([[py.tip[0], py.tip[1]]])), 0.05, phone ? 5 : 6.5, LW * 0.62, 9000 + py.k * 4000);   // the shadows
    x.drawImage(dots, 0, 0, W, H);
    for (const py of pyrs) {
      const faces = [];
      CORNERS.forEach((q, i) => {
        const e = CORNERS[(i + 1) % 4], nx = (q[0] + e[0]) / 2, nz = (q[1] + e[1]) / 2;
        if (-nx * sa + nz * ca >= 0) return;                                           // turned away from us
        faces.push({ i, pts: [py.base[i], py.base[(i + 1) % 4], py.top], lit: -(nx * dir[0] + nz * dir[1]) });
      });
      for (const fc of faces) {
        // Three tones by how much the face is turned to the light: paper, hatching that tightens, solid ink.
        const dark = Math.min(1, Math.max(0, 0.62 - fc.lit * 0.6)), key = 20000 + py.k * 8000 + fc.i * 2000;
        poly(fc.pts); x.fillStyle = dark > 0.9 ? INK : PAPER; x.fill();
        if (dark > 0.08 && dark <= 0.9) hatch(fc.pts, Math.atan2(fc.pts[2][1] - fc.pts[0][1], fc.pts[2][0] - fc.pts[0][0]), (phone ? 11 : 15) - (phone ? 8.4 : 11.6) * dark, LW * 0.8, key);
      }
      for (const fc of faces) outline(fc.pts, LW * 1.15, 50000 + py.k * 100 + fc.i * 10);
    }
  }

  const point = (e) => { const r = panel.getBoundingClientRect(); light.tx = e.clientX - r.left; light.ty = e.clientY - r.top; light.on = true; };
  panel.addEventListener("pointermove", point); panel.addEventListener("pointerdown", point);
  let dirty = true, last = performance.now(), raf = 0, seen = true;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const k = reduced ? 1 : 1 - Math.exp(-dt * (light.on ? 6 : 2.2)), mx = (light.tx - light.x) * k, my = (light.ty - light.y) * k;
    if (Math.abs(mx) + Math.abs(my) > 0.02) { light.x += mx; light.y += my; dirty = true; }
    if (dirty) { dirty = false; draw(); }
  }
  const start = () => { if (!raf && seen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else start(); });
  if ("IntersectionObserver" in window) new IntersectionObserver((en) => { seen = en[en.length - 1].isIntersecting; if (seen) start(); else stop(); }).observe(panel);
  let rt = 0; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 120); });
  build(); start();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => panel.style.setProperty("--navw", document.querySelector(".top").offsetWidth + "px"));
  panel.classList.add("live");
  window.__ink = { light };
})();
