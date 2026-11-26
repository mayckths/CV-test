// The hero. It exists twice, one on top of the other: a light one and a hot pink one. The pink one is only shown
// inside a lens that follows the pointer while it moves, and everything here is made of particles. One system of
// round grains drifts in slow bands, gathers into the two pyramids and parts around the lens. The lens has no hard
// edge: it breaks up into dots of its own, which trail behind it and fade when the pointer stops. The lens, its dots,
// the type and the grains inside it carry a colour aberration: a cyan and a yellow ghost, pulled apart along the way
// the pointer is moving. Nothing moves the lens or turns the pyramids on its own.
(() => {
  const panel = document.querySelector(".hero.lens");
  if (!panel) return;
  const grey = panel.querySelector(".lens-grey"), pink = panel.querySelector(".lens-pink");
  pink.appendChild(grey.querySelector(".lens-copy").cloneNode(true));   // the pink hero says the same as the grey one
  const fxA = grey.querySelector(".lens-fx"), fxB = pink.querySelector(".lens-fx"), pxC = panel.querySelector(".lens-px");
  const a = fxA.getContext("2d"), b = fxB.getContext("2d"), px = pxC.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // The grains are the blues of the footer's pyramids: from the deep indigo to the bright violet-blue.
  const BLUES = ["#22126d", "#33209a", "#4630c8", "#5a3cf2"];
  // Colour aberration: the lens and its loose pixels split into a cyan and a yellow copy, pulled apart along the way
  // the pointer is moving, and further the faster it goes.
  const CYAN = "#19e3ff", YELLOW = "#ffd400";
  const tmp = document.createElement("canvas"), tx = tmp.getContext("2d");
  const hash = (x, y) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  let W = 0, H = 0, dpr = 1, cell = 26, cols = 0, rows = 0, heat = new Float32Array(0), phone = false;
  let dotX, dotY, dotR, dotT, dotC, ground = "#fffaf5";
  const DOTS = ["#ff2e7e", "#1a1466", "#2de2e6", "#ffffff"], lists = [[], [], [], [], []];   // four colours, and the holes
  let RS = 90, grains = [], pyr = { cx: 0, base: 0, a: 0, h: 0, win: 1 };
  const lens = { x: 0, y: 0, tx: 0, ty: 0, seen: -1e9, on: false, travel: 0, r: 0, vx: 0, vy: 0 };

  function build() {
    const r = panel.getBoundingClientRect();
    panel.style.setProperty("--navw", document.querySelector(".top").offsetWidth + "px");
    W = r.width; H = r.height; phone = W < 700; dpr = Math.min(window.devicePixelRatio || 1, 1.5);   // the dust is soft enough not to need more
    for (const c of [fxA, fxB, pxC, tmp]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
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
    ground = getComputedStyle(grey).backgroundColor;
    RS = phone ? W * 0.22 : Math.min(W, H) * 0.15;   // the lens's size while the pointer is moving
    // One system of grains. Every grain rides one of four slow wavy bands across the panel, and every grain looks the
    // same. Some also own a place on the two pyramids (an M): a core that always holds it, and many more that settle
    // on it only while their band carries them past, then peel off and drift on. So the pyramids are where the dust
    // gathers, not a separate thing on top of it.
    const wp = phone ? W * 0.78 : Math.min(W * 0.31, H * 0.56), pa = wp / 4, ph = wp * 0.6;
    pyr = { cx: W / 2, base: phone ? H * 0.66 : H * 0.74, a: pa, h: ph, win: wp * 0.62 };
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]], bands = [[0.16, 0.045, 1.1, 0.4, 0.05], [0.4, 0.06, 0.8, 2.1, 0.07], [0.63, 0.05, 1.3, 4.0, 0.085], [0.86, 0.04, 0.9, 0.9, 0.075]];
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
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
    const count = phone ? [1100, 1500, 1200] : [2100, 2900, 2400];   // core, passing through, never settling
    grains = [];
    count.forEach((n, kind) => { for (let i = 0; i < n; i++) grains.push({ kind, band: bands[(Math.random() * 4) | 0], u: Math.random(), off: gauss(), speed: 0.004 + 0.008 * Math.random(), ox: 0, oy: 0, seed: Math.random() * 6.283, slot: kind < 2 ? place(i) : null, tint: (Math.random() * BLUES.length) | 0, size: 1.2 + 3.4 * Math.pow(Math.random(), 3), alpha: Math.round((0.5 + 0.5 * Math.pow(Math.random(), 1.2)) * 8) / 8 }); });
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

  let last = performance.now(), t = 0, clip = "", raf = 0, seen = true, splitWas = "";
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
    const r0 = lens.r, r1 = r0 + Math.max(1, Math.min(r0 * 0.8, 120)), live = r0 >= 1;

    // 1. The lens, made of particles. Its core is a clean disc of the pink hero. It has no outline: across its edge
    //    the disc breaks up into dots that thin out and shrink outwards, a few holes open just inside it, and the
    //    dots the lens has just passed over stay for a moment and shrink away, so it trails particles behind it.
    px.setTransform(dpr, 0, 0, dpr, 0, 0); px.clearRect(0, 0, W, H);
    const ux = speed > 4 ? lens.vx / speed : 0.92, uy = speed > 4 ? lens.vy / speed : 0.38, o = 3 + Math.min(16, speed * 0.011);
    const core = live ? `circle(${r0.toFixed(1)}px at ${lens.x.toFixed(1)}px ${lens.y.toFixed(1)}px)` : "";
    if (core !== clip) { clip = core; pink.style.clipPath = core || "inset(100%)"; pink.style.webkitClipPath = pink.style.clipPath; }
    // The split: the disc twice, pushed apart, with the disc itself cut out of them. That leaves a cyan crescent on
    // one side and a yellow one on the other.
    const disc = (ox, oy) => { px.beginPath(); px.arc(lens.x + ox, lens.y + oy, r0, 0, 6.283); px.fill(); };
    if (live) {
      px.fillStyle = CYAN; disc(-ux * o, -uy * o); px.fillStyle = YELLOW; disc(ux * o, uy * o);
      px.globalCompositeOperation = "destination-out"; disc(0, 0); px.globalCompositeOperation = "source-over";
    }
    for (const l of lists) l.length = 0;
    const band = r1 - r0, n = cols * rows, hk = dt * 1.9;
    for (let i = 0; i < n; i++) {
      const dist = Math.hypot(dotX[i] - lens.x, dotY[i] - lens.y), k = live ? (dist - r0) / band : 9, th = dotT[i];
      if (k <= 0) { heat[i] = 1; if (k > -0.45 && th < 0.5 * (1 + k / 0.45)) lists[4].push(dotX[i], dotY[i], dotR[i] * (1 + k)); continue; }   // inside: a hole near the edge
      const on = k < 1 && th > k, far = k >= 1 && k < 1.9 && th > 0.9 + 0.1 * (k - 1) / 0.9;
      heat[i] = on ? 1 : Math.max(0, heat[i] - hk);
      const size = on ? 1 - 0.5 * k : far ? 0.55 : th > 0.3 ? heat[i] * 0.9 : 0;
      if (size > 0.04) lists[dotC[i]].push(dotX[i], dotY[i], dotR[i] * size);
    }
    // Every dot has the same two ghosts as the disc, then its own colour on top; the holes are the light ground.
    const og = o * 0.6, dots = (l, ox, oy) => { px.beginPath(); for (let i = 0; i < l.length; i += 3) { px.moveTo(l[i] + ox + l[i + 2], l[i + 1] + oy); px.arc(l[i] + ox, l[i + 1] + oy, l[i + 2], 0, 6.283); } px.fill(); };
    px.fillStyle = CYAN; for (let c = 0; c < 4; c++) dots(lists[c], -ux * og, -uy * og);
    px.fillStyle = YELLOW; for (let c = 0; c < 4; c++) dots(lists[c], ux * og, uy * og);
    for (let c = 0; c < 4; c++) { px.fillStyle = DOTS[c]; dots(lists[c], 0, 0); }
    px.fillStyle = ground; dots(lists[4], 0, 0);
    const split = (Math.round(o * 0.3 * 2) / 2).toFixed(1);
    if (split !== splitWas) { splitWas = split; panel.style.setProperty("--split", split + "px"); }

    // 2. The grains, pyramids and dust alike, drawn once in blue for the light hero and copied in white for the pink
    //    one. So the lens changes their colour and nothing else: same grains, same places.
    a.setTransform(dpr, 0, 0, dpr, 0, 0); a.clearRect(0, 0, W, H);
    const push = Math.min(r0, RS * 1.5) * 0.9, reach = Math.max(1, Math.min(r1, RS * 2.6) * 0.95), k2 = 1 - Math.exp(-dt * 5);
    // The pyramids are seen from slightly above, in perspective. With the lens in the middle they face straight
    // ahead, centred and symmetrical; moving the lens left or right turns them a little that way. Nothing else
    // moves them: not the lens going up or down, and never on their own.
    const yaw = ((lens.x - W / 2) / W) * 0.6, pitch = 0.3;
    const ca = Math.cos(yaw), sa = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), f = pyr.a * 7;
    let alpha = -1, tint = -1;
    a.beginPath();
    for (const g of grains) {
      const bd = g.band, u = (g.u + t * g.speed) % 1;
      let x = u * (W + 40) - 20, y = H * (bd[0] + bd[1] * Math.sin(bd[2] * 6.283 * u + bd[3] + t * 0.12) + 0.02 * Math.sin(5.1 * 6.283 * u + bd[3] * 2) + g.off * bd[4] * 0.95), m = 0;
      if (g.slot) {
        const xr = g.slot.x * ca + g.slot.z * sa, zr = -g.slot.x * sa + g.slot.z * ca, sc = f / (f + zr * cp - g.slot.y * sp);
        const sx = pyr.cx + xr * sc + Math.sin(t * 0.55 + g.seed) * 1.6, sy = pyr.base - (g.slot.y * cp + zr * sp) * sc + Math.cos(t * 0.47 + g.seed) * 1.6;
        if (g.kind === 0) m = 1;
        else { const q = Math.min(1, Math.max(0, (pyr.win - Math.abs(x - sx)) / (pyr.win * 0.3))); m = q * q * (3 - 2 * q); }   // settles while its band passes the pyramids
        x += (sx - x) * m; y += (sy - y) * m;
      }
      const dx = x - lens.x, dy = y - lens.y, dist = Math.hypot(dx, dy) + 0.001, fo = push * Math.exp(-(dist / reach) * (dist / reach)) * (1 - 0.88 * m);
      g.ox += (dx / dist * fo - g.ox) * k2; g.oy += (dy / dist * fo - g.oy) * k2;
      if (g.alpha !== alpha || g.tint !== tint) { a.fill(); a.beginPath(); alpha = g.alpha; tint = g.tint; a.globalAlpha = alpha; a.fillStyle = BLUES[tint]; }
      const X = x + g.ox, Y = y + g.oy, r = g.size;
      if (r < 1.6) a.rect(X, Y, r, r); else { a.moveTo(X + r * 0.6, Y); a.arc(X, Y, r * 0.6, 0, 6.283); }
    }
    a.fill(); a.globalAlpha = 1;
    // In the lens the grains are white, with the same cyan and yellow ghosts. Not drawn at all while the lens is shut.
    if (clip) {
      const tinted = (col) => { tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalCompositeOperation = "copy"; tx.drawImage(fxA, 0, 0); tx.globalCompositeOperation = "source-in"; tx.fillStyle = col; tx.fillRect(0, 0, tmp.width, tmp.height); return tmp; };
      const gx = Math.round(ux * o * 0.4 * dpr), gy = Math.round(uy * o * 0.4 * dpr);
      b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = "source-over"; b.clearRect(0, 0, fxB.width, fxB.height);
      b.drawImage(tinted(CYAN), -gx, -gy); b.drawImage(tinted(YELLOW), gx, gy); b.drawImage(tinted("#fff"), 0, 0);
    }
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
