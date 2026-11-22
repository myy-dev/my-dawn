'use strict';

// 100 · 시나브로 밝는 들판
// The last scene: a wide valley of fields at the moment the sky starts to lighten. Seen from a field gate on
// a low rise, the land falls away in long folds: hedged fields, a line of poplars along a stream that
// catches the sky in silver threads, a village with a church spire on the far slope, hills fading in layers
// beyond. The east glows rose and gold behind the hills; the land is still blue. Mist lies in the stream's
// course and breathes; a skein of geese crosses the sky once each loop. The gate post and a stand of tall
// grass are close to us on the right.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: 0, y: 3.2, z: 0, yaw: -.04, pitch: .04, focal: 1150, cx: 960, cy: 500 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 3.2, 1e6])[1];
const land = (x, z) => -2 - z * .025 + 3.2 * Math.sin(x * .012 + .4) * Math.min(1, z / 200) + 1.5 * edge(x + z * 2, 201, [[400, 1], [100, .3]]);
const HAZE = [126, 132, 160];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 20, [[0, '#1c2440'], [.45, '#4a4c6e'], [.75, '#a87a86'], [.92, '#e4a888'], [1, '#f0c49a']]);
  ctx.fillRect(0, 0, W, HORIZON + 20);
  paint.starfield(ctx, rnd, 60, HORIZON * .35);
  glow(ctx, 1240, HORIZON, 900, 220, '255,200,150', .3);
  for (let i = 0; i < 14; i++) {
    const y = 120 + rnd() * (HORIZON - 260), x = rnd() * W;
    glow(ctx, x, y, 300 + rnd() * 400, 10 + rnd() * 14, y > HORIZON * .55 ? '230,160,150' : '96,90,120', .2);
  }
  // hills in receding layers, each paler and bluer
  const layers = [[HORIZON + 6, 60, [110, 104, 132], 202], [HORIZON + 18, 48, [86, 86, 116], 203], [HORIZON + 34, 40, [64, 68, 98], 204]];
  for (const [base, amp, color, seed] of layers) paint.ridgeline(ctx, base, amp, color, seed, [[520, 1], [140, .4], [30, .12]]);
}

// The valley, drawn as receding folds of land: each fold is a strip of fields in its own tones, divided by
// hedges that run down the slope, with the next fold's edge laid over it. Far folds go blue in the haze.
function valley(ctx, rnd) {
  const tones = [[58, 80, 60], [96, 100, 70], [46, 64, 60], [110, 104, 80], [70, 88, 74], [84, 76, 62]];
  const folds = 22;
  for (let f = 0; f < folds; f++) {
    const z = lerp(1500, 40, (f / (folds - 1)) ** .55), haze = Math.min(.9, z / 1500 + .12);
    const ridge = [];
    for (let x = -1.2 * z; x <= 1.2 * z; x += z / 40) ridge.push(P([x, land(x, z), z]));
    const outline = ridge.concat([[W + 50, H + 50], [-50, H + 50]]);
    fill(ctx, outline, shade(paint.aerial(tones[f % tones.length], haze, HAZE), -6 - 48 * (1 - haze)));
    // fields across the fold: colour changes at hedge lines spaced unevenly
    ctx.save(); pathOf(ctx, outline); ctx.clip();
    let x0 = -1.2 * z;
    while (x0 < 1.2 * z) {
      const w = z * (.08 + rnd() * .18), tone = paint.aerial(tones[Math.floor(rnd() * tones.length)], haze, HAZE);
      const a = P([x0, land(x0, z), z]), b = P([x0 + w, land(x0 + w, z), z]);
      const near = P([x0 * 1.15, land(x0, z * .85), z * .85]), nearB = P([(x0 + w) * 1.15, land(x0 + w, z * .85), z * .85]);
      const g = ctx.createLinearGradient(0, Math.min(a[1], b[1]), 0, Math.max(near[1], nearB[1]));
      // nearer folds are still in the blue shadow of the dawn: darker and cooler than the far ones
      const dusk = -48 * (1 - haze);
      g.addColorStop(0, shade(tone, 8 + dusk)); g.addColorStop(1, shade(tone, -12 + dusk));
      fill(ctx, [a, b, nearB, near], g);
      ctx.strokeStyle = shade(paint.aerial([30, 40, 34], haze, HAZE)); ctx.lineWidth = Math.max(1, 2.4 * (1 - haze));
      ctx.beginPath(); ctx.moveTo(...b); ctx.lineTo(...nearB); ctx.stroke();
      x0 += w;
    }
    ctx.restore();
    // the fold's crest carries a hedge with the odd tree
    ctx.strokeStyle = shade(paint.aerial([30, 40, 34], haze, HAZE)); ctx.lineWidth = Math.max(1, 3.5 * (1 - haze));
    ctx.beginPath(); ridge.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
    for (let t = 0; t < 4; t++) {
      const x = (rnd() - .5) * 2 * z, s2 = P([x, land(x, z), z]), k = cam.focal / Math.max(1, cam.project([x, 0, z])[2]);
      glow(ctx, s2[0], s2[1] - 5 * k, 3.5 * k, 4.5 * k, shade(paint.aerial([28, 38, 34], haze, HAZE)).slice(5, -3), .9);
    }
  }
}

// The stream: a winding silver thread down the valley floor, poplars standing along it, mist above it.
const streamAt = t => { const z = lerp(60, 1400, t ** 1.3), x = Math.sin(t * 7) * 120 * (1 - t * .5) - 80; return [x, land(x, z) + .05, z]; };
function stream(ctx, rnd) {
  for (let i = 1; i <= 80; i++) {
    const a = P(streamAt((i - 1) / 80)), b = P(streamAt(i / 80)), z = streamAt(i / 80)[2];
    ctx.strokeStyle = `rgba(230,200,190,${.6 * (1 - z / 1600)})`; ctx.lineWidth = Math.max(.8, 8 * 60 / z);
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  }
  for (let i = 0; i < 70; i++) {
    const p = streamAt(rnd() * .8), side = rnd() < .5 ? -1 : 1, base = [p[0] + side * (8 + rnd() * 6), p[1], p[2]];
    // a Lombardy poplar: a narrow flame of foliage built from small clumps, thinner at the top
    const s = P(base), k = cam.focal / cam.project(base)[2], hgt = (16 + rnd() * 8) * k, haze = Math.min(.9, base[2] / 1500 + .2);
    const tone = shade(paint.aerial([30, 40, 38], haze, HAZE)).slice(5, -3);
    for (let c = 0; c < 14; c++) {
      const t = c / 14, w = hgt * .09 * (1 - t * .7);
      glow(ctx, s[0] + (rnd() - .5) * w, s[1] - hgt * (.15 + t * .8), w * (1 + rnd() * .4), hgt * .08, tone, .9);
    }
  }
}

// A village on the far slope: a cluster of roofs and a church with a spire, a couple of lit windows.
function village(ctx, rnd) {
  const c = P([260, land(260, 900), 900]), k = cam.focal / cam.project([260, 0, 900])[2];
  for (let i = 0; i < 16; i++) {
    const x = c[0] + (rnd() - .5) * 26 * k, y = c[1] + (rnd() - .5) * 4 * k, w = (2 + rnd() * 2) * k, h = (1.5 + rnd()) * k;
    fill(ctx, [[x - w, y], [x + w, y], [x + w, y - h], [x, y - h - w * .6], [x - w, y - h]], shade(paint.aerial([60, 58, 70], .55, HAZE), (rnd() - .5) * 10));
    if (rnd() < .2) glow(ctx, x, y - h * .5, 3, 2, '255,200,140', .8);
  }
  const ch = [c[0] + 6 * k, c[1]];
  fill(ctx, [[ch[0] - 2 * k, ch[1]], [ch[0] + 2 * k, ch[1]], [ch[0] + 2 * k, ch[1] - 6 * k], [ch[0], ch[1] - 14 * k], [ch[0] - 2 * k, ch[1] - 6 * k]], shade(paint.aerial([56, 54, 66], .55, HAZE)));
}

function foreground(ctx, rnd) {
  // the rise we stand on: dark, rough grass falling away to the valley
  const rise = [];
  for (let x = 0; x <= W; x += 10) rise.push([x, H - 150 + 40 * Math.sin(x * .002 + 1) + 12 * edge(x, 205)]);
  rise.push([W, H], [0, H]);
  fill(ctx, rise, vertical(ctx, H - 200, H, [[0, '#2a2e34'], [1, '#141618']]));
  for (let i = 0; i < 900; i++) {
    const x = rnd() * W, y = H - 140 + rnd() ** .5 * 140, h = 20 + rnd() * 80;
    ctx.strokeStyle = shade([40, 46, 44], (rnd() - .5) * 16, .9); ctx.lineWidth = 1 + rnd() * 1.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6, y - h * .6, x + (rnd() - .3) * 24, y - h); ctx.stroke();
  }
  // the gate post: a squared oak post, cracked, a rusted hinge pin, the top of the gate's bars
  const px = 1660;
  fill(ctx, [[px, H - 560], [px + 70, H - 570], [px + 78, H], [px - 6, H]], vertical(ctx, H - 570, H, [[0, '#3a3430'], [1, '#1a1716']]));
  fill(ctx, [[px + 70, H - 570], [px + 92, H - 560], [px + 98, H], [px + 78, H]], '#14110f');
  ctx.strokeStyle = 'rgba(240,190,160,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + 2, H - 560); ctx.lineTo(px - 4, H); ctx.stroke();
  for (const y of [H - 420, H - 300, H - 180]) { ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(px - 4, y); ctx.lineTo(px - 700, y + 30); ctx.stroke(); }
  ctx.strokeStyle = '#5a2e1a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(px - 6, H - 400); ctx.lineTo(px + 12, H - 400); ctx.stroke();
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(10011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  valley(ctx, rnd);
  stream(ctx, rnd);
  village(ctx, rnd);
  paint.applyTexture(ctx, make, 10001, .34, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.74, .76, .9], lights: [paint.LIGHT.dawn(HORIZON + 30, .2, 1240, 1200)] })(ctx);
  const fg = make(W, H);
  foreground(fg.getContext('2d'), rnd);
  // valley mist along the stream, slow
  const mist = make(W * 2, 200), mc = mist.getContext('2d');
  for (let i = 0; i < 40; i++) { const x = rnd() * W * 2; for (const dx of [0, -W * 2, W * 2]) glow(mc, x + dx, 100 + (rnd() - .5) * 50, 200 + rnd() * 400, 14 + rnd() * 20, '220,200,210', .16); }
  const mistY = P(streamAt(.3))[1] - 100;
  const geese = Array.from({ length: 11 }, (_, i) => ({ dx: Math.abs(i - 5) * 26, dy: (i - 5) * 9 + (i % 2) * 3, flap: rnd() }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    const mx = (phase * W * 2) % (W * 2);
    target.globalAlpha = .9 + .1 * Math.sin(TAU * phase);
    target.drawImage(mist, -mx, mistY); target.drawImage(mist, W * 2 - mx, mistY);
    target.globalAlpha = 1;
    // a skein of geese crossing once per loop, wings beating out of step
    const gx = -300 + phase * (W + 600), gy = 260 - phase * 60;
    target.strokeStyle = 'rgba(30,26,40,.85)'; target.lineWidth = 2;
    for (const g of geese) {
      const x = gx - g.dx, y = gy + g.dy, w = 8 * Math.sin(TAU * (phase * 40 + g.flap));
      target.beginPath(); target.moveTo(x - 9, y - w); target.lineTo(x, y); target.lineTo(x + 9, y - w); target.stroke();
    }
    target.drawImage(fg, 0, 0);
  };
}

module.exports = {
  title: '시나브로 밝는 들판',
  slug: 'first-light-over-the-fields',
  sound: 'wind',
  createScene,
};
