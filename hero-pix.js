// Hero entrance: the whole hero opens as a very coarse ordered-dither image, the same print as the art stamps
// (a Bayer 4x4 matrix choosing between four opaque tones of one ink), and is discovered in steps: each step
// halves the cell size, and the last one gives way to the real hero.
//
// The picture is live. scene3d.js hands over its two WebGL canvases after each draw (window.__heroSnap), the
// hero's text is drawn from where the page laid it out, and the three are printed together on one small canvas
// that CSS scales up without smoothing. Without WebGL the still ground and the text are printed on their own.
const root = document.documentElement;
const view = document.querySelector(".hero-pix");
const overlay = document.querySelector(".hero-overlay");

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const TONES = [[13, 7, 48], [34, 18, 109], [111, 92, 224], [241, 238, 253]];   // deep ground, hero blue, lilac, text
const STEPS = 5, STEP = 120, FADE = 250;   // five prints, 0.12 s each, then the fade: 0.85 s in all
const LIMIT = 2000;                        // the whole hero is in view by this long after the page began to load

function run() {
  const mk = (opts) => { const c = document.createElement("canvas"); return [c, c.getContext("2d", opts)]; };
  const [hazeC, hazeX] = mk(), [stageC, stageX] = mk(), [textC, textX] = mk(), [midC, midX] = mk(), [hopC, hopX] = mk();
  const [workC, workX] = mk({ willReadFrequently: true });
  const out = view.getContext("2d");
  // The steps start at once: nothing is waited for. If the page was slow to get here they are run faster, so the
  // entrance still ends inside the limit (performance.now() counts from the start of the page load).
  const born = performance.now();
  const pace = Math.min(1, Math.max(0.45, (LIMIT - born) / (STEP * STEPS + FADE)));
  let W = 0, H = 0, cols0 = 0, mw = 0, mh = 0, raf = 0, ended = false;

  // The still ground of the hero (styles.css --blue-bg), for the frames before the drifting one arrives.
  function ground() {
    hazeX.fillStyle = "#0d0730";
    hazeX.fillRect(0, 0, mw, mh);
    const glow = (x, y, r, from) => {
      const g = hazeX.createRadialGradient(x * mw, y * mh, 0, x * mw, y * mh, r * mw);
      g.addColorStop(0, from); g.addColorStop(1, "rgba(34, 18, 109, 0)");
      hazeX.fillStyle = g; hazeX.fillRect(0, 0, mw, mh);
    };
    glow(0.22, 0.08, 0.6, "#22126d");
    glow(0.78, 0.88, 0.5, "rgba(67, 48, 196, .55)");
  }

  // The hero's text, word by word, where the page put it and in the face and colour the page gave it.
  function words() {
    const k = mw / W, o = view.getBoundingClientRect(), range = document.createRange();
    textX.setTransform(1, 0, 0, 1, 0, 0);
    textX.clearRect(0, 0, mw, mh);
    textX.setTransform(k, 0, 0, k, 0, 0);
    textX.textBaseline = "alphabetic";
    for (const el of overlay.querySelectorAll(".hero-intro, .hero-base, .hero-hint")) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n; (n = walker.nextNode());) {
        const cs = getComputedStyle(n.parentElement), upper = cs.textTransform === "uppercase";
        if (cs.display === "none") continue;
        textX.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        textX.fillStyle = cs.color;
        if ("letterSpacing" in textX) textX.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
        const m = textX.measureText("Hg");
        const asc = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent, desc = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent;
        for (const w of n.data.matchAll(/\S+/g)) {
          range.setStart(n, w.index); range.setEnd(n, w.index + w[0].length);
          const r = range.getBoundingClientRect();
          if (r.width) textX.fillText(upper ? w[0].toUpperCase() : w[0], r.left - o.left, r.top - o.top + (r.height - asc - desc) / 2 + asc);
        }
      }
    }
  }

  function setup() {
    const r = view.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = r.width; H = r.height;
    cols0 = Math.max(6, Math.round(W / (W < 600 ? 41 : 64)));   // the first print: cells about 64 px wide, 41 px on a phone
    mw = cols0 << (STEPS);                                      // working size: twice the finest print
    mh = Math.max(1, Math.round(mw * H / W));
    for (const c of [hazeC, stageC, textC, midC, hopC]) { c.width = mw; c.height = mh; }
    for (const x of [hazeX, stageX, midX, hopX]) x.imageSmoothingQuality = "high";
    ground();
    words();
  }

  // Called by scene3d.js right after it draws, while the WebGL buffers still hold the frame.
  window.__heroSnap = (haze, stage) => {
    if (!mw || ended) return;
    try {
      if (haze) hazeX.drawImage(haze, 0, 0, mw, mh);
      if (stage) {
        const p = view.getBoundingClientRect(), s = stage.getBoundingClientRect(), k = stage.width / s.width;
        stageX.clearRect(0, 0, mw, mh);
        stageX.drawImage(stage, (p.left - s.left) * k, (p.top - s.top) * k, p.width * k, p.height * k, 0, 0, mw, mh);
      }
    } catch (e) { /* a lost context: carry on with what we have */ }
  };

  function print(cols) {
    const rows = Math.max(1, Math.round(cols * H / W));
    if (view.width !== cols || view.height !== rows) { view.width = workC.width = cols; view.height = workC.height = rows; }
    midX.drawImage(hazeC, 0, 0);
    midX.drawImage(stageC, 0, 0);
    midX.drawImage(textC, 0, 0);
    // Down to the print size by halves, so every cell is the average of what it covers and fine marks do not flicker.
    let src = midC, w = mw, h = mh;
    while (w > cols * 2) {
      const nw = Math.max(cols, w >> 1), nh = Math.max(rows, h >> 1);
      hopX.drawImage(src, 0, 0, w, h, 0, 0, nw, nh);
      src = hopC; w = nw; h = nh;
    }
    workX.drawImage(src, 0, 0, w, h, 0, 0, cols, rows);
    const img = workX.getImageData(0, 0, cols, rows), d = img.data;
    for (let y = 0, p = 0; y < rows; y++) for (let x = 0; x < cols; x++, p += 4) {
      const lum = (d[p] * 0.3 + d[p + 1] * 0.59 + d[p + 2] * 0.11) / 255;
      // The hero is dark, so the tones are spread over its range: the haze sits between the two darkest.
      const v = Math.min(1, Math.max(0, (Math.sqrt(lum) - 0.19) / 0.78));
      const tone = TONES[Math.min(3, Math.floor(v * 3 + (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16))];
      d[p] = tone[0]; d[p + 1] = tone[1]; d[p + 2] = tone[2]; d[p + 3] = 255;
    }
    out.putImageData(img, 0, 0);
  }

  function finish(ms) {
    if (ended) return;
    ended = true;
    view.style.transition = `opacity ${ms}ms ease`;
    view.style.opacity = "0";
    setTimeout(() => {
      cancelAnimationFrame(raf);
      delete window.__heroSnap;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", setup);
      root.classList.remove("pix");
      view.remove();
    }, ms);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!mw) { setup(); if (!mw) return; }
    // Whatever has arrived is printed: the 3D layer and the real type join in as soon as they are ready.
    const e = Math.max(0, now - born) / pace;
    print(cols0 << Math.min(STEPS - 1, Math.floor(e / STEP)));
    if (e >= STEP * STEPS) finish(FADE * pace);
  }

  // The hero is pinned while the page scrolls and its text drifts up, so the print would come apart: let go.
  const onScroll = () => { if (window.scrollY > 12) finish(180); };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", setup);
  const fonts = () => { if (mw && !ended) words(); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fonts, fonts);
  setup();
  if (mw) print(cols0);   // the first print is on the page before anything else gets the main thread
  raf = requestAnimationFrame(frame);
}

if (view && overlay && root.classList.contains("pix")) {
  window.__pix = true;   // tells the page's safety timer that the entrance is running
  if (window.scrollY > 12) { root.classList.remove("pix"); view.remove(); }
  else { try { run(); } catch (e) { root.classList.remove("pix"); } }
}
