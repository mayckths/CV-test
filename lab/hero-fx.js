// Test page only (lab/hero-yellow.html): the live hero's script with an acid yellow lens and three ways of drawing
// the lens, switched with the buttons on the page: glitch slices, colour aberration, and the live pixel edge.
(() => {
  const panel = document.querySelector(".hero.lens");
  if (!panel) return;
  const grey = panel.querySelector(".lens-grey"), pink = panel.querySelector(".lens-pink");
  pink.appendChild(grey.querySelector(".lens-copy").cloneNode(true));   // the pink hero says the same as the grey one
  const fxA = grey.querySelector(".lens-fx"), fxB = pink.querySelector(".lens-fx"), pxC = panel.querySelector(".lens-px");
  const a = fxA.getContext("2d"), b = fxB.getContext("2d"), px = pxC.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  // The grains are the blues of the footer's pyramids: from the deep indigo to the bright violet-blue.
  const BLUES = ["#22126d", "#33209a", "#4630c8", "#5a3cf2"];
  const COLOURS = ["#e8ff3c", "#17141a", "#5b2cff", "#ffffff", "#e8ff3c", "#17141a"];
  const INK = "#17141a", CYAN = "#00d8ff", MAGENTA = "#ff2bd6";
  let mode = new URLSearchParams(location.search).get("fx") || "glitch";
  const tmp = document.createElement("canvas"), tx = tmp.getContext("2d");
  const hash = (x, y) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  let W = 0, H = 0, dpr = 1, cell = 26, cols = 0, rows = 0, heat = new Float32Array(0), phone = false;
  let RS = 90, grains = [], pyr = { cx: 0, base: 0, a: 0, h: 0, win: 1 };
  const lens = { x: 0, y: 0, tx: 0, ty: 0, seen: 0, on: false, travel: 0, r: 0, inv: false, wait: 0, vx: 0, vy: 0 };

  function build() {
    const r = panel.getBoundingClientRect();
    panel.style.setProperty("--navw", document.querySelector(".top").offsetWidth + "px");
    W = r.width; H = r.height; phone = W < 700; dpr = Math.min(window.devicePixelRatio || 1, 1.5);   // the dust is soft enough not to need more
    for (const c of [fxA, fxB, pxC, tmp]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    cell = phone ? 17 : Math.max(20, Math.round(W / 54));
    cols = Math.ceil(W / cell); rows = Math.ceil(H / cell); heat = new Float32Array(cols * rows);
    RS = phone ? W * 0.2 : Math.min(W, H) * 0.115;   // the lens's size while the pointer is moving: small
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

  let last = performance.now(), t = 0, clip = "", raf = 0, seen = true;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!reduced) t += dt;
    const ease = 1 - Math.exp(-dt * 9);
    // The lens is small while the pointer moves. When the pointer rests, the lens starts to grow, slowly at first,
    // until it has taken the whole panel. At that moment the two heroes change places: what was inside the lens is
    // now the page, and a new small lens opens at the pointer showing the other one. So a still pointer turns the
    // page pink, then light again, and so on; a moving one always carries a small window onto the other side.
    const farthest = Math.max(Math.hypot(lens.x, lens.y), Math.hypot(W - lens.x, lens.y), Math.hypot(lens.x, H - lens.y), Math.hypot(W - lens.x, H - lens.y)) + cell * 2 + (mode === "glitch" ? RS * 2.4 : 0);   // slices are pushed sideways, so they need a little more to cover
    if (reduced) lens.r = RS;
    else if (now - lens.seen > 500 && now > lens.wait) {
      lens.r += dt * (14 + lens.r * 0.4);   // slowly at first, then gathering pace: about six seconds to take the panel
      if (lens.r >= farthest) { lens.inv = !lens.inv; lens.r = 0; heat.fill(0); lens.wait = now + 1800; panel.dataset.ground = lens.inv ? "pink" : "light"; }
    } else lens.r += (RS - lens.r) * (1 - Math.exp(-dt * 6));
    const r0 = lens.r, r1 = r0 + Math.max(1, Math.min(r0 * 0.6, cell * 5));
    const mx = (lens.tx - lens.x) * ease, my = (lens.ty - lens.y) * ease;
    lens.x += mx; lens.y += my; lens.travel += Math.hypot(mx, my);
    const vk = 1 - Math.exp(-dt * 8); lens.vx += (mx / Math.max(dt, 0.001) - lens.vx) * vk; lens.vy += (my / Math.max(dt, 0.001) - lens.vy) * vk;

    px.setTransform(dpr, 0, 0, dpr, 0, 0); px.clearRect(0, 0, W, H);
    let d = "";
    if (mode === "glitch") {
      // 1a. Glitch slices. The lens is cut into horizontal strips of uneven height. Some strips are pushed sideways,
      //     some run on past the edge, and a few stray bars sit just outside. The cut changes as the lens travels and
      //     holds still when it does. Shifted strips carry a cyan and a magenta sliver at their ends.
      const tick = Math.floor(lens.travel / 46), HS = [5, 8, 12, 20, 32, 52], cap = Math.min(r0, RS * 2.2);
      for (let y = 0, k = 0; y < H; k++) {
        const h = HS[(hash(k, tick) * HS.length) | 0], mid = y + h / 2 - lens.y, u = hash(k + 211, tick);
        let x0 = 1, x1 = 0, shifted = false;
        if (Math.abs(mid) < r0) {
          const half = Math.sqrt(r0 * r0 - mid * mid), off = u < 0.52 ? 0 : (hash(k + 77, tick) - 0.5) * 2 * cap * 0.75;
          const ext = u > 0.74 ? hash(k + 31, tick) * cap * 1.5 : 0, side = hash(k + 5, tick) < 0.5;
          x0 = lens.x - half + off - (side ? ext : 0); x1 = lens.x + half + off + (side ? 0 : ext); shifted = off !== 0 || ext > 0;
        } else if (Math.abs(mid) < r0 * 1.4 + 20 && r0 > 8 && u < 0.26) {
          x0 = lens.x + (hash(k + 9, tick) - 0.5) * 2 * r0; x1 = x0 + (0.3 + hash(k + 13, tick)) * cap; shifted = true;
        }
        x0 = Math.max(0, Math.round(x0)); x1 = Math.min(W, Math.round(x1));
        const yy = Math.round(y), hh = Math.round(y + h) - yy;
        if (x1 > x0) {
          if (!lens.inv) d += `M${x0} ${yy}h${x1 - x0}v${hh}h${x0 - x1}z`;
          else { if (x0 > 0) d += `M0 ${yy}h${x0}v${hh}h${-x0}z`; if (x1 < W) d += `M${x1} ${yy}h${W - x1}v${hh}h${x1 - W}z`; }
          if (shifted) { const w = 4 + hash(k + 3, tick) * 10; px.fillStyle = CYAN; px.fillRect(x0 - w, yy, w, hh); px.fillStyle = MAGENTA; px.fillRect(x1, yy, w, hh); }
        } else if (lens.inv) d += `M0 ${yy}h${W}v${hh}h${-W}z`;
        y += h;
      }
    } else if (mode === "chroma") {
      // 1b. Colour aberration. The lens is a clean circle. Its edge splits into a cyan and a magenta ring, pulled
      //     apart along the way the lens is moving and further the faster it goes; at rest they sit close together.
      const rr = Math.max(0, r0), cxp = lens.x.toFixed(1), cyp = lens.y.toFixed(1), R = rr.toFixed(1);
      const disc = rr > 0.5 ? `M${(lens.x - rr).toFixed(1)} ${cyp}a${R} ${R} 0 1 0 ${(2 * rr).toFixed(1)} 0a${R} ${R} 0 1 0 ${(-2 * rr).toFixed(1)} 0z` : "";
      d = lens.inv ? `M0 0h${W}v${H}h${-W}z${disc}` : disc;
      const sp = Math.hypot(lens.vx, lens.vy), ux = sp > 4 ? lens.vx / sp : 0.92, uy = sp > 4 ? lens.vy / sp : 0.38, o = 4 + Math.min(26, sp * 0.03);
      if (rr > 1) for (const [col, sgn] of [[CYAN, -1], [MAGENTA, 1]]) {
        px.strokeStyle = col; px.lineWidth = o * 1.1 + 2; px.beginPath(); px.arc(lens.x + ux * o * sgn, lens.y + uy * o * sgn, rr, 0, 6.283); px.stroke();
      }
      panel.style.setProperty("--split", (0.02 + Math.min(0.05, sp * 0.00006)).toFixed(4) + "em");
    } else {
      // 1. The lens as cells. Inside it every cell shows; across its edge fewer and fewer do, in the order of a Bayer
      //    matrix; and a cell the lens has just left stays for a moment, so the lens trails a few pixels behind it.
      const tick = Math.floor(lens.travel / (cell * 1.4)); let d = "";   // the coloured pixels reshuffle as the lens travels, and hold still when it does
      for (let y = 0; y < rows; y++) {
        let start = -1;
        for (let x = 0; x <= cols; x++) {
          let show = false;
          if (x < cols) {
            const i = y * cols + x, cxp = (x + 0.5) * cell, cyp = (y + 0.5) * cell;
            const dist = Math.hypot(cxp - lens.x, cyp - lens.y), k = (dist - r0) / (r1 - r0), bay = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
            const inside = k <= 0 || (k < 1 && bay > k);
            heat[i] = inside ? 1 : Math.max(0, heat[i] - dt * 1.7);
            const inLens = inside || heat[i] > 0.3 + 0.65 * bay;
            show = inLens !== lens.inv;   // the pink hero is drawn inside the lens, or everywhere but the lens
            // Coloured pixels: thick in the edge, thinning outwards, a few just inside it, and in the trail.
            const h1 = hash(x * 31 + tick * ((i % 7) + 1), y * 17 + ((i * 13) % 5)), h2 = hash(x + 91, y + 57 + tick);
            let p = 0;
            if (!inLens) p = k < 1 ? 0.5 * (1 - k) + 0.07 : k < 1.75 ? 0.1 * (1.75 - k) / 0.75 : 0, p = Math.max(p, heat[i] * 0.45);
            else if (k > -0.22) p = 0.09;
            if (p && h1 < p) { px.fillStyle = COLOURS[(h2 * COLOURS.length) | 0]; px.fillRect(x * cell, y * cell, cell, cell); }
          }
          if (show && start < 0) start = x;
          else if (!show && start >= 0) { d += `M${start * cell} ${y * cell}h${(x - start) * cell}v${cell}h${-(x - start) * cell}z`; start = -1; }
        }
      }
    }
    if (d !== clip) { clip = d; pink.style.clipPath = d ? `path(evenodd, "${d}")` : "inset(100%)"; pink.style.webkitClipPath = pink.style.clipPath; }

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
    // In the lens the grains are ink on the yellow. With colour aberration they are drawn three times: a cyan and a
    // magenta copy pulled apart, and the ink one on top.
    const tinted = (col) => { tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalCompositeOperation = "copy"; tx.drawImage(fxA, 0, 0); tx.globalCompositeOperation = "source-in"; tx.fillStyle = col; tx.fillRect(0, 0, tmp.width, tmp.height); return tmp; };
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = "source-over"; b.clearRect(0, 0, fxB.width, fxB.height);
    if (mode === "chroma") { const o = Math.round((3 + Math.min(10, Math.hypot(lens.vx, lens.vy) * 0.012)) * dpr); b.drawImage(tinted(CYAN), -o, 0); b.drawImage(tinted(MAGENTA), o, 0); }
    b.drawImage(tinted(INK), 0, 0);
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
  // The buttons on the test page
  const setMode = (m) => { mode = m; panel.dataset.fx = m; heat.fill(0); clip = ""; lens.inv = false; lens.r = 0; lens.seen = performance.now(); panel.dataset.ground = "light";   // each effect starts from the light page document.querySelectorAll("[data-fx-set]").forEach((b0) => b0.setAttribute("aria-pressed", String(b0.dataset.fxSet === m))); };
  document.querySelectorAll("[data-fx-set]").forEach((b0) => b0.addEventListener("click", () => setMode(b0.dataset.fxSet)));
  setMode(mode);
})();
