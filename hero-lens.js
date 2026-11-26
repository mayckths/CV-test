// The hero: a light panel, and everything on it made of particles. Two pyramids are drawn in round motes, with a
// cloud of loose molecules floating around them, as in the footer. While the pointer moves it carries a glare: a
// cloud of coloured dots (mostly hot pink) that trails behind it and fades when it stops, each dot with a cyan and a
// yellow ghost pulled apart along the way the pointer is moving. The motes the glare passes over take its colours
// and keep them for a moment. Nothing moves or turns on its own except the slow drift.
(() => {
  const panel = document.querySelector(".hero.lens");
  if (!panel) return;
  const grey = panel.querySelector(".lens-grey");
  const fxA = grey.querySelector(".lens-fx"), pxC = panel.querySelector(".lens-px");
  const a = fxA.getContext("2d"), px = pxC.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // The grains are the blues of the footer's pyramids: from the deep indigo to the bright violet-blue.
  const BLUES = ["#22126d", "#33209a", "#4630c8", "#5a3cf2"];
  // Colour aberration: the lens and its loose pixels split into a cyan and a yellow copy, pulled apart along the way
  // the pointer is moving, and further the faster it goes.
  const CYAN = "#19e3ff", YELLOW = "#ffd400";
  const hash = (x, y) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  let W = 0, H = 0, dpr = 1, cell = 26, cols = 0, rows = 0, heat = new Float32Array(0), phone = false;
  let dotX, dotY, dotR, dotT, dotC;
  const DOTS = ["#ff2e7e", "#1a1466", "#2de2e6", "#ffffff"], lists = [[], [], [], []];   // one list of dots per colour
  let RS = 90, grains = [], pyr = { cx: 0, base: 0, a: 0, h: 0 };
  const hot = [[], [], [], []];   // motes the glare has coloured this frame, one list per colour
  const lens = { x: 0, y: 0, tx: 0, ty: 0, seen: -1e9, on: false, travel: 0, r: 0, vx: 0, vy: 0 };

  function build() {
    const r = panel.getBoundingClientRect();
    panel.style.setProperty("--navw", document.querySelector(".top").offsetWidth + "px");
    W = r.width; H = r.height; phone = W < 700; dpr = Math.min(window.devicePixelRatio || 1, 1.5);   // the dust is soft enough not to need more
    for (const c of [fxA, pxC]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    // The lens's own particles: a field of dots fixed to the panel, one to a small square, each at its own place in
    // the square, with its own size, colour and the moment at which the lens's edge switches it on.
    cell = phone ? 10 : 13;
    cols = Math.ceil(W / cell); rows = Math.ceil(H / cell); heat = new Float32Array(cols * rows);
    dotX = new Float32Array(cols * rows); dotY = new Float32Array(cols * rows); dotR = new Float32Array(cols * rows); dotT = new Float32Array(cols * rows); dotC = new Uint8Array(cols * rows);
    for (let y = 0, i = 0; y < rows; y++) for (let x = 0; x < cols; x++, i++) {
      dotX[i] = (x + 0.12 + 0.76 * hash(x, y)) * cell; dotY[i] = (y + 0.12 + 0.76 * hash(x + 191, y + 77)) * cell;
      dotR[i] = 2 + 7 * Math.pow(hash(x + 31, y + 17), 2); dotT[i] = hash(x * 7 + 3, y * 13 + 1);
      const c = hash(x + 5, y + 401); dotC[i] = c < 0.7 ? 0 : c < 0.82 ? 1 : c < 0.92 ? 2 : 3;   // mostly pink; some navy, cyan and white
    }

    RS = phone ? W * 0.22 : Math.min(W, H) * 0.15;   // the lens's size while the pointer is moving
    // The particles, as in the footer: two pyramids (an M) drawn in round motes. Two motes in five lie on an edge,
    // the rest on the faces, and the later ones stop a little short of their places, so the shape stays soft. About
    // a fifth are molecules that never join it: they float in a cloud around the pyramids, thicker near the shape,
    // each on its own slow current.
    const wp = phone ? W * 0.8 : Math.min(W * 0.34, H * 0.62), pa = wp / 4, ph = wp * 0.6;
    pyr = { cx: W / 2, base: phone ? H * 0.68 : H * 0.76, a: pa, h: ph };
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    const place = (i) => {
      const side = i % 2 ? 1 : -1; let x, y, z;
      if (i % 5 < 2) {
        const k = (Math.random() * 4) | 0, c0 = corners[k], c1 = corners[(k + 1) % 4], u = Math.random();
        if (Math.random() < 0.6) { x = c0[0] * pa * (1 - u); z = c0[1] * pa * (1 - u); y = ph * u; }
        else { x = (c0[0] + (c1[0] - c0[0]) * u) * pa; z = (c0[1] + (c1[1] - c0[1]) * u) * pa; y = 0; }
      } else {
        const k = (Math.random() * 4) | 0, c0 = corners[k], c1 = corners[(k + 1) % 4]; let u = Math.random(), v = Math.random(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
        x = (c0[0] * u + c1[0] * v) * pa; z = (c0[1] * u + c1[1] * v) * pa; y = ph * (1 - u - v);
      }
      return { x: x + side * pa, y, z };
    };
    const count = phone ? 2600 : 4800, smooth = (v) => { v = Math.min(1, Math.max(0, v)); return v * v * (3 - 2 * v); };
    grains = [];
    for (let i = 0; i < count; i++) {
      const seed = Math.random(), free = seed >= 0.8, sx = Math.random() * 2 - 1, sy = Math.random() * 2 - 1, out = 0.38 + 0.62 * Math.random();
      const c = Math.random();
      grains.push({ free, seed, slot: place(i), lx: W / 2 + sx * W * 0.48, ly: H / 2 + sy * H * 0.48, m: free ? 1 : smooth(1.26 - seed * 0.5), hx: sx * out, hy: sy * out,
        size: 0.7 + 3.3 * Math.pow(Math.random(), 3.2), alpha: Math.round((0.7 + 0.3 * seed) * 8) / 8, tint: (Math.random() * BLUES.length) | 0,
        col: c < 0.7 ? 0 : c < 0.82 ? 1 : c < 0.92 ? 2 : 3, heat: 0, ox: 0, oy: 0 });
    }
    grains.sort((p, q) => p.tint - q.tint || p.alpha - q.alpha);   // drawn in runs of one colour and strength
    if (!lens.on) { lens.x = lens.tx = W / 2; lens.y = lens.ty = H * 0.52; }
  }

  // The lens follows the pointer (or a finger) and stays where it was left. It never moves by itself.
  const point = (e) => {
    const r = panel.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (Math.abs(x - lens.tx) + Math.abs(y - lens.ty) > 1.5 || !lens.on) lens.seen = performance.now();   // a real move, not a jitter
    lens.tx = x; lens.ty = y; lens.on = true;
  };
  panel.addEventListener("pointermove", point); panel.addEventListener("pointerdown", point);

  let last = performance.now(), t = 0, raf = 0, seen = true;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!reduced) t += dt;
    const ease = 1 - Math.exp(-dt * 9);
    // The lens is only there while the pointer is moving. It opens as the pointer sets off, a little larger the
    // faster it goes, and when the pointer stops it closes and its last pixels fade out. It never grows on its own.
    const mx = (lens.tx - lens.x) * ease, my = (lens.ty - lens.y) * ease;
    lens.x += mx; lens.y += my; lens.travel += Math.hypot(mx, my);
    const vk = 1 - Math.exp(-dt * 8); lens.vx += (mx / Math.max(dt, 0.001) - lens.vx) * vk; lens.vy += (my / Math.max(dt, 0.001) - lens.vy) * vk;
    const speed = Math.hypot(lens.vx, lens.vy), moving = now - lens.seen < 200;
    const want = moving ? RS * (0.8 + Math.min(0.5, speed / 2400)) : 0;
    lens.r += (want - lens.r) * (reduced ? 1 : 1 - Math.exp(-dt * (moving ? 10 : 4)));
    if (!moving && lens.r < 0.5) lens.r = 0;
    const r0 = lens.r, r1 = r0 * 1.7, live = r0 >= 1;

    // 1. The glare: a cloud of particles around the pointer and nothing else. There is no disc and no second hero
    //    under it. The dots are thick at the pointer and thin out and shrink towards the cloud's edge, with a few
    //    strays beyond it; dots the pointer has just passed stay for a moment and shrink away, so it trails them.
    px.setTransform(dpr, 0, 0, dpr, 0, 0); px.clearRect(0, 0, W, H);
    const ux = speed > 4 ? lens.vx / speed : 0.92, uy = speed > 4 ? lens.vy / speed : 0.38, o = 3 + Math.min(16, speed * 0.011);
    for (const l of lists) l.length = 0;
    const reachG = r0 * 1.7, n = cols * rows, hk = dt * 1.9;
    for (let i = 0; i < n; i++) {
      const k = live ? Math.hypot(dotX[i] - lens.x, dotY[i] - lens.y) / reachG : 9, th = dotT[i];
      const on = k < 1 && th > k * k, far = k >= 1 && k < 1.5 && th > 0.9 + 0.1 * (k - 1) / 0.5;
      heat[i] = on ? 1 : Math.max(0, heat[i] - hk);
      const size = on ? 1 - 0.55 * k : far ? 0.5 : th > 0.3 ? heat[i] * 0.9 : 0;
      if (size > 0.04) lists[dotC[i]].push(dotX[i], dotY[i], dotR[i] * size);
    }
    // The colour aberration: every dot has a cyan and a yellow ghost, pulled apart along the way the pointer is
    // moving and further the faster it goes, and its own colour on top.
    const og = o * 0.6, paint = (cx) => (l, ox, oy) => { cx.beginPath(); for (let i = 0; i < l.length; i += 3) { cx.moveTo(l[i] + ox + l[i + 2], l[i + 1] + oy); cx.arc(l[i] + ox, l[i + 1] + oy, l[i + 2], 0, 6.283); } cx.fill(); }, dots = paint(px);
    px.fillStyle = CYAN; for (let c = 0; c < 4; c++) dots(lists[c], -ux * og, -uy * og);
    px.fillStyle = YELLOW; for (let c = 0; c < 4; c++) dots(lists[c], ux * og, uy * og);
    for (let c = 0; c < 4; c++) { px.fillStyle = DOTS[c]; dots(lists[c], 0, 0); }

    // 2. The particles. Where the glare passes they take its colours, each with the same two ghosts, and keep
    //    them for a moment after it has gone, so the pyramids and the cloud mix with what the pointer leaves behind.
    a.setTransform(dpr, 0, 0, dpr, 0, 0); a.clearRect(0, 0, W, H);
    // The pyramids face straight ahead with the pointer in the middle and turn a little with it to either side.
    const yaw = ((lens.x - W / 2) / W) * 0.6, pitch = 0.05;
    const ca = Math.cos(yaw), sa = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), f = pyr.a * 7;
    const midY = pyr.base - pyr.h / 2, ft = t * 0.16, fieldX = Math.min(pyr.a * 3.5, W * 0.47), fieldY = Math.min(pyr.h, H * 0.44), flow = pyr.a * 0.22;
    const reach = Math.max(1, reachG * 0.8), k2 = 1 - Math.exp(-dt * 4), cool = dt * 1.1;
    for (const l of hot) l.length = 0;
    let alpha = -1, tint = -1;
    a.beginPath();
    for (const g of grains) {
      let x, y;
      if (g.free) {
        x = pyr.cx + g.hx * fieldX + (Math.sin(ft + g.seed * 43) + 0.6 * Math.sin(ft * 1.7 + g.hy * 5 + g.seed * 17)) * flow;
        y = midY + g.hy * fieldY + (Math.cos(ft * 0.9 + g.seed * 31) + 0.6 * Math.cos(ft * 1.6 + g.hx * 5 + g.seed * 23)) * flow;
      } else {
        const xr = g.slot.x * ca + g.slot.z * sa, zr = -g.slot.x * sa + g.slot.z * ca, sc = f / (f + zr * cp - g.slot.y * sp);
        x = g.lx + (pyr.cx + xr * sc - g.lx) * g.m; y = g.ly + (pyr.base - (g.slot.y * cp + zr * sp) * sc - g.ly) * g.m;
      }
      const amp = pyr.a * (0.02 + 0.2 * (g.free ? 1 : 1 - g.m)) * (0.5 + g.seed);   // each on its own small, slow loop
      x += Math.sin(t * 0.55 + g.seed * 41) * amp; y += Math.cos(t * 0.47 + g.seed * 27) * amp;
      // The pointer draws them in a little as it passes, the molecules more than the pyramids, and they ease back.
      const dx = lens.x - x, dy = lens.y - y, dist = Math.hypot(dx, dy) + 0.001, k = live ? dist / reachG : 9;
      const pull = live ? (g.free ? 18 : 6) * Math.exp(-(dist / reach) * (dist / reach)) : 0;
      g.ox += (dx / dist * pull - g.ox) * k2; g.oy += (dy / dist * pull - g.oy) * k2;
      g.heat = Math.max(g.heat - cool, k < 1 ? Math.min(1, (1 - k) * 1.8) : 0);
      const X = x + g.ox, Y = y + g.oy, r = g.size;
      if (g.heat > 0.03) hot[g.col].push(X, Y, r * (1 + 0.6 * g.heat) * Math.min(1, g.heat * 1.6));
      if (g.heat > 0.6) continue;   // fully coloured: the blue mote under it is not drawn
      if (g.alpha !== alpha || g.tint !== tint) { a.fill(); a.beginPath(); alpha = g.alpha; tint = g.tint; a.globalAlpha = alpha; a.fillStyle = BLUES[tint]; }
      if (r < 0.9) a.rect(X - r, Y - r, r * 2, r * 2); else { a.moveTo(X + r, Y); a.arc(X, Y, r, 0, 6.283); }
    }
    a.fill(); a.globalAlpha = 1;
    const motes = paint(a);
    a.fillStyle = CYAN; for (const l of hot) motes(l, -ux * og, -uy * og);
    a.fillStyle = YELLOW; for (const l of hot) motes(l, ux * og, uy * og);
    for (let c = 0; c < 4; c++) { a.fillStyle = DOTS[c]; motes(hot[c], 0, 0); }
  }
  // It only runs while the hero is on screen and the tab is in front.
  const start = () => { if (!raf && seen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else start(); });
  if ("IntersectionObserver" in window) new IntersectionObserver((en) => { seen = en[en.length - 1].isIntersecting; if (seen) start(); else stop(); }).observe(panel);
  let rt = 0; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 120); });
  build(); start();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => panel.style.setProperty("--navw", document.querySelector(".top").offsetWidth + "px"));
  panel.classList.add("live");
})();
