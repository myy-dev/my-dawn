'use strict';

// 48 · 새벽빛에 흐르는 라벤더 밭
// A lavender farm in the blue hour before sunrise. Rows of rounded lavender bushes run in long curves over a
// gentle rise, the earth between them pale and dry; each bush is a dome of grey-green leaves bristling with
// violet spikes. At the top of the rise stand a lone almond tree and a stone farmhouse with one lit window.
// The east is warming behind them. A breeze passes along the rows and the spikes ripple in sequence.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: .3, y: 1.4, z: 0, yaw: .05, pitch: -.02, focal: 1100, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.4, 1e6])[1];
const rise = (x, z) => 3.2 * Math.max(0, Math.sin(Math.min(z, 120) / 120 * Math.PI * .9)) + .3 * Math.sin(x * .05);
const rowX = (r, z) => r * 1.5 + Math.sin(z * .03 + r * .1) * 2;
const HAZE = [120, 116, 150];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 10, [[0, '#1c2244'], [.5, '#3e4470'], [.85, '#9a7c92'], [1, '#e0a88e']]);
  ctx.fillRect(0, 0, W, HORIZON + 10);
  paint.starfield(ctx, rnd, 80, HORIZON * .4);
  glow(ctx, 1300, HORIZON, 700, 160, '255,190,150', .3);
  for (let i = 0; i < 12; i++) glow(ctx, rnd() * W, 120 + rnd() * 300, 300 + rnd() * 400, 10 + rnd() * 16, '120,110,150', .16);
}

function land(ctx, rnd) {
  const crest = [];
  for (let x = -120; x <= 120; x += 2) crest.push(P([x, rise(x, 110), 110]));
  crest.push([W, H], [0, H]);
  fill(ctx, crest, vertical(ctx, HORIZON - 40, H, [[0, '#6a6070'], [.4, '#8a7a76'], [1, '#4a4038']]));
  // the farmhouse and almond tree on the crest
  const house = P([12, rise(12, 104), 104]), k = cam.focal / 104;
  fill(ctx, [[house[0] - 5 * k, house[1]], [house[0] + 4 * k, house[1]], [house[0] + 4 * k, house[1] - 3.4 * k], [house[0] - .5 * k, house[1] - 5.4 * k], [house[0] - 5 * k, house[1] - 3.4 * k]], '#3a3440');
  glow(ctx, house[0] + 1.6 * k, house[1] - 1.6 * k, .5 * k, .4 * k, '255,200,140', .9);
  const tree = P([-10, rise(-10, 106), 106]);
  ctx.strokeStyle = '#2a2430'; ctx.lineWidth = .3 * k; ctx.lineCap = 'round';
  const limb = (x, y, a, l, w, d) => { const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke(); if (d) for (let i = 0; i < 2; i++) limb(ex, ey, a + (rnd() - .5) * 1.4, l * .7, w * .6, d - 1); else glow(ctx, ex, ey, .8 * k, .6 * k, '50,44,56', .9); };
  limb(tree[0], tree[1], -Math.PI / 2, 2 * k, .3 * k, 4);
}

// Bushes along curving rows: domes of grey-green with violet spikes standing out of them.
function makeBushes(rnd) {
  const out = [];
  for (let r = -14; r <= 14; r++) {
    for (let z = 2 + rnd() * .6; z < 105; z += .85 + z * .004) {
      const x = rowX(r, z);
      out.push({ x, z, y: rise(x, z), r: .38 + rnd() * .08, seed: rnd() * 1e6 | 0, lag: z * .2 + r * .4 });
    }
  }
  return out.sort((a, b) => b.z - a.z);
}
function bush(ctx, b, sway) {
  const s = cam.project([b.x, b.y, b.z]); if (s[2] <= .4) return;
  const k = cam.focal / s[2], rnd = paint.seeded(b.seed), fog = Math.min(.85, b.z / 110), r = b.r * k;
  const leaf = shade(paint.aerial([86, 98, 90], fog, HAZE)), dark = shade(paint.aerial([48, 54, 56], fog, HAZE));
  ctx.fillStyle = 'rgba(30,26,40,.35)'; ctx.beginPath(); ctx.ellipse(s[0] + r * .2, s[1] + r * .05, r * 1.05, r * .28, 0, 0, TAU); ctx.fill();
  // the bush is a cluster of overlapping leafy lumps, darker underneath
  for (let i = 0; i < 6; i++) {
    const ox = (rnd() - .5) * r * 1.1, oy = -r * (.15 + rnd() * .35), rr = r * (.45 + rnd() * .3);
    ctx.fillStyle = i < 2 ? dark : leaf; ctx.beginPath(); ctx.ellipse(s[0] + ox, s[1] + oy, rr, rr * .7, 0, 0, TAU); ctx.fill();
  }
  if (r < 2) return;
  const spikes = Math.min(70, Math.round(r * 1.8));
  for (let i = 0; i < spikes; i++) {
    const a = -Math.PI / 2 + (rnd() - .5) * 2.2 + sway, l = r * (.5 + rnd() * .5);
    const x0 = s[0] + (rnd() - .5) * r * 1.4, y0 = s[1] - r * .25 - rnd() * r * .2;
    const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l;
    ctx.strokeStyle = shade(paint.aerial([110, 104, 80], fog, HAZE), 0, .7); ctx.lineWidth = Math.max(.4, r * .02);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = shade(paint.aerial([120, 86, 176], fog, HAZE), (rnd() - .5) * 30, .95); ctx.lineWidth = Math.max(.7, r * .035);
    ctx.beginPath(); ctx.moveTo(lerp(x0, x1, .65), lerp(y0, y1, .65)); ctx.lineTo(x1, y1); ctx.stroke();
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(48011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  land(ctx, rnd);
  const bushes = makeBushes(rnd);
  for (const b of bushes) if (b.z > 9) bush(ctx, b, 0);
  paint.applyTexture(ctx, make, 4801, .32, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.78, .78, .9], lights: [paint.LIGHT.dawn(HORIZON, .25, 1300, 1000)] })(ctx);
  const near = bushes.filter(b => b.z <= 9);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const b of near) bush(target, b, .12 * Math.sin(TAU * phase * 2 - b.lag));
  };
}

module.exports = {
  title: '새벽빛에 흐르는 라벤더 밭',
  slug: 'lavender-field-in-blue-hour',
  sound: 'grass',
  createScene,
};
