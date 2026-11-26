// The hero: a light panel with two pyramids drawn in round motes and a cloud of loose molecules floating around
// them, as in the footer. Some motes are out of focus, which gives the cloud depth. While the pointer moves, the motes
// near it take the glare's colours (mostly hot pink), each with a cyan and a yellow ghost pulled apart along the way
// the pointer is moving, and keep them for a moment after it has gone. The glare adds no particles of its own.
// Nothing moves or turns on its own except the slow drift.
(() => {
  const panel = document.querySelector(".hero.lens");
  if (!panel) return;
  const grey = panel.querySelector(".lens-grey");
  const fxA = grey.querySelector(".lens-fx"), a = fxA.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // The grains are the blues of the footer's pyramids: from the deep indigo to the bright violet-blue.
  const BLUES = ["#22126d", "#33209a", "#4630c8", "#5a3cf2"];
  // Colour aberration: the lens and its loose pixels split into a cyan and a yellow copy, pulled apart along the way
  // the pointer is moving, and further the faster it goes.
  const CYAN = "#19e3ff", YELLOW = "#ffd400";

  let W = 0, H = 0, dpr = 1, phone = false;
  const DOTS = ["#ff2e7e", "#1a1466", "#2de2e6", "#ffffff"];   // the glare's colours: mostly the pink
  let RS = 90, grains = [], pyr = { cx: 0, base: 0, a: 0, h: 0 };
  const hot = [[], [], [], []];   // motes the glare has coloured this frame, one list per colour
  const soft = [], behind = [];   // this frame's out-of-focus motes, loose ones and the pyramids' back: x, y, radius, alpha, blue, glare colour, heat
  // A soft-edged dot of each colour, for the out-of-focus motes.
  const sprite = (col) => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, col); g.addColorStop(0.28, col + "e0"); g.addColorStop(0.62, col + "59"); g.addColorStop(1, col + "00"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c; };
  const SOFT_BLUE = BLUES.map(sprite), SOFT_DOT = DOTS.map(sprite);
  const lens = { x: 0, y: 0, tx: 0, ty: 0, seen: -1e9, on: false, travel: 0, r: 0, vx: 0, vy: 0 };

  function build() {
    const r = panel.getBoundingClientRect();
    panel.style.setProperty("--navw", document.querySelector(".top").offsetWidth + "px");
    W = r.width; H = r.height; phone = W < 700; dpr = Math.min(window.devicePixelRatio || 1, 1.5);   // the dust is soft enough not to need more
    fxA.width = Math.round(W * dpr); fxA.height = Math.round(H * dpr);
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
        col: c < 0.7 ? 0 : c < 0.82 ? 1 : c < 0.92 ? 2 : 3, heat: 0, ox: 0, oy: 0,
        // Depth: nearly half of the molecules are out of focus (the pyramids' own motes blur by how far back they are), as if nearer or further
        // than the rest. They are drawn larger, soft-edged and fainter.
        blur: free && Math.random() < 0.4 ? 0.3 + 0.8 * Math.random() : 0 });
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

    // 1. The glare. It makes no particles of its own: it is only a reach around the pointer inside which the
    //    particles that are already there change colour. Its split pulls apart along the way the pointer is moving.
    const ux = speed > 4 ? lens.vx / speed : 0.92, uy = speed > 4 ? lens.vy / speed : 0.38, o = 3 + Math.min(16, speed * 0.011);
    const reachG = r0 * 1.9, og = o * 0.6;
    const paint = (cx) => (l, ox, oy) => { cx.beginPath(); for (let i = 0; i < l.length; i += 3) { cx.moveTo(l[i] + ox + l[i + 2], l[i + 1] + oy); cx.arc(l[i] + ox, l[i + 1] + oy, l[i + 2], 0, 6.283); } cx.fill(); };

    // 2. The particles. Where the glare passes they take its colours, each with the same two ghosts, and keep
    //    them for a moment after it has gone, so the pyramids and the cloud mix with what the pointer leaves behind.
    a.setTransform(dpr, 0, 0, dpr, 0, 0); a.clearRect(0, 0, W, H);
    // The pyramids face straight ahead with the pointer in the middle and turn their front face towards it as it
    // goes to either side (a negative turn brings the near face round to the right).
    const yaw = -((lens.x - W / 2) / W) * 0.6, pitch = 0.05;
    const ca = Math.cos(yaw), sa = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), f = pyr.a * 7;
    const midY = pyr.base - pyr.h / 2, ft = t * 0.16, fieldX = Math.min(pyr.a * 3.5, W * 0.47), fieldY = Math.min(pyr.h, H * 0.44), flow = pyr.a * 0.22;
    const reach = Math.max(1, reachG * 0.8), k2 = 1 - Math.exp(-dt * 4), cool = dt * 1.1;
    for (const l of hot) l.length = 0; soft.length = 0; behind.length = 0;
    let alpha = -1, tint = -1;
    a.beginPath();
    for (const g of grains) {
      let x, y, back = 0, near = 1;
      if (g.free) {
        x = pyr.cx + g.hx * fieldX + (Math.sin(ft + g.seed * 43) + 0.6 * Math.sin(ft * 1.7 + g.hy * 5 + g.seed * 17)) * flow;
        y = midY + g.hy * fieldY + (Math.cos(ft * 0.9 + g.seed * 31) + 0.6 * Math.cos(ft * 1.6 + g.hx * 5 + g.seed * 23)) * flow;
      } else {
        const xr = g.slot.x * ca + g.slot.z * sa, zr = -g.slot.x * sa + g.slot.z * ca, sc = f / (f + zr * cp - g.slot.y * sp);
        x = g.lx + (pyr.cx + xr * sc - g.lx) * g.m; y = g.ly + (pyr.base - (g.slot.y * cp + zr * sp) * sc - g.ly) * g.m;
        // How far behind the middle of the pyramids this mote is, after the turn: 0 at the front and middle, 1 at the back.
        const d = Math.min(1, Math.max(0, (zr / pyr.a - 0.08) / 0.85)); back = d * d * (3 - 2 * d); near = sc;
      }
      const amp = pyr.a * (0.02 + 0.2 * (g.free ? 1 : 1 - g.m)) * (0.5 + g.seed);   // each on its own small, slow loop
      x += Math.sin(t * 0.55 + g.seed * 41) * amp; y += Math.cos(t * 0.47 + g.seed * 27) * amp;
      // The pointer draws them in a little as it passes, the molecules more than the pyramids, and they ease back.
      const dx = lens.x - x, dy = lens.y - y, dist = Math.hypot(dx, dy) + 0.001, k = live ? dist / reachG : 9;
      const pull = live ? (g.free ? 18 : 6) * Math.exp(-(dist / reach) * (dist / reach)) : 0;
      g.ox += (dx / dist * pull - g.ox) * k2; g.oy += (dy / dist * pull - g.oy) * k2;
      g.heat = Math.max(g.heat - cool, k < 1 ? Math.min(1, (1 - k) * 1.8) : 0);
      const X = x + g.ox, Y = y + g.oy, r = g.size * near;   // nearer motes are a touch larger
      if (g.blur) { soft.push(X, Y, r * (1.7 + 1.5 * g.blur), g.alpha * (0.72 - 0.2 * g.blur), g.tint, g.col, g.heat); continue; }
      // The back of the pyramids is a little out of focus and fainter, more so the further back, which tells the
      // front from the back as they turn.
      if (back > 0.1) { behind.push(X, Y, r * (1.3 + 1.3 * back), g.alpha * (1 - 0.42 * back), g.tint, g.col, g.heat); continue; }
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
    // The out-of-focus motes: blue, cross-fading to the glare's colour where it has passed. The loose ones go on
    // top of everything; the pyramids' back goes underneath what is already drawn.
    const blurred = (l, under) => {
      a.globalCompositeOperation = under ? "destination-over" : "source-over";
      for (let i = 0; i < l.length; i += 7) {
        const X = l[i], Y = l[i + 1], R = l[i + 2], al = l[i + 3], h = Math.min(1, l[i + 6] * 1.4);
        const blue = () => { if (h < 0.98) { a.globalAlpha = al * (1 - h); a.drawImage(SOFT_BLUE[l[i + 4]], X - R, Y - R, R * 2, R * 2); } };
        const lit = () => { if (h > 0.02) { a.globalAlpha = Math.min(1, al * 1.25) * h; a.drawImage(SOFT_DOT[l[i + 5]], X - R, Y - R, R * 2, R * 2); } };
        if (under) { lit(); blue(); } else { blue(); lit(); }
      }
      a.globalCompositeOperation = "source-over"; a.globalAlpha = 1;
    };
    blurred(soft, false); blurred(behind, true);
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
