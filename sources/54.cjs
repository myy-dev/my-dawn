'use strict';

// 54 · 숲속 안개가 덮은 돌계단
// Old stone steps climbing a wooded slope into fog. Each step is a slab of its own size, its nose worn
// round, moss in the risers' joints; they turn a little as they climb and vanish into white. Cedars stand
// on both sides, straight and tall, their lower trunks dark and their tops lost. The fog moves slowly up the
// slope, swallowing and giving back the upper steps; a breath of wind stirs the ferns beside the stairs.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, wobble, v3 } = paint;
const { add } = v3;

const cam = camera({ x: 0, y: 1.5, z: 0, yaw: 0, pitch: .16, focal: 1050, cx: 960, cy: 640 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const slope = z => Math.max(0, z - 1.5) * .55;
const stairAt = t => [Math.sin(t * 2.4) * .9, 0, lerp(1.6, 26, t)];
const FOG = [196, 202, 200];
const fogAt = z => Math.min(.96, 1 - Math.exp(-Math.max(0, z - 2) / 9));

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function hillside(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#d0d4d0'], [.5, '#a4aca4'], [1, '#2a3226']]);
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 4000; i++) {
    const z = 1 + rnd() ** 1.4 * 26, x = (rnd() - .5) * z * 2.4, s = cam.project([x, slope(z), z]); if (s[2] <= 0) continue;
    const k = cam.focal / s[2], fog = fogAt(z);
    ctx.fillStyle = shade(paint.aerial(rnd() < .6 ? [50, 70, 40] : [90, 76, 52], fog, FOG), (rnd() - .5) * 30, .7);
    ctx.beginPath(); ctx.ellipse(s[0], s[1], (.05 + rnd() * .06) * k, (.02 + rnd() * .02) * k, 0, 0, TAU); ctx.fill();
  }
}

function cedar(ctx, rnd, x, z) {
  const b = cam.project([x, slope(z), z]); if (b[2] <= .5) return;
  const k = cam.focal / b[2], w = (.3 + rnd() * .2) * k, fog = fogAt(z);
  const g = ctx.createLinearGradient(b[0] - w, 0, b[0] + w, 0);
  g.addColorStop(0, shade(paint.aerial([40, 30, 26], fog, FOG))); g.addColorStop(.4, shade(paint.aerial([96, 70, 56], fog, FOG))); g.addColorStop(1, shade(paint.aerial([30, 24, 22], fog, FOG)));
  fill(ctx, [[b[0] - w * 1.3, b[1]], [b[0] + w * 1.3, b[1]], [b[0] + w * .8, -20], [b[0] - w * .8, -20]], g);
  // the cedar's stringy bark: long vertical fibres
  for (let i = 0; i < 12; i++) { const fx = b[0] + (rnd() - .5) * w * 1.6; ctx.strokeStyle = `rgba(20,14,12,${.25 * (1 - fog)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(fx, b[1]); ctx.lineTo(fx + (rnd() - .5) * 6, -20); ctx.stroke(); }
}

// Steps: for each, a tread (top face) and a riser (front face), the nose rounded with a highlight.
function steps(ctx, rnd) {
  const out = [];
  for (let i = 0; i < 34; i++) {
    const t = i / 34, c = stairAt(t), z0 = c[2], z1 = stairAt((i + 1) / 34)[2], y0 = slope(z0), y1 = y0 + .17 + rnd() * .04;
    const half = .9 + rnd() * .3, skew = (rnd() - .5) * .15;
    out.push({ c, z0, z1, y0, y1, half, skew, seed: rnd() * 1e6 | 0 });
  }
  for (const s of out.slice().reverse()) {
    const fog = fogAt(s.z0), rr = paint.seeded(s.seed);
    const riser = [[s.c[0] - s.half, s.y1, s.z0], [s.c[0] + s.half, s.y1 + s.skew * .2, s.z0], [s.c[0] + s.half, s.y0, s.z0], [s.c[0] - s.half, s.y0, s.z0]].map(P);
    const tread = [[s.c[0] - s.half, s.y1, s.z1 - .05], [s.c[0] + s.half, s.y1 + s.skew * .2, s.z1 - .05], [s.c[0] + s.half, s.y1 + s.skew * .2, s.z0], [s.c[0] - s.half, s.y1, s.z0]].map(P);
    if ([...riser, ...tread].some(p => !isFinite(p[0]))) continue;
    const size = Math.abs(riser[1][0] - riser[0][0]);
    fill(ctx, wobble(tread, Math.max(.5, size * .01), s.seed, Math.max(4, size / 8)), shade(paint.aerial([126, 124, 116], fog, FOG), (rr() - .5) * 20));
    fill(ctx, wobble(riser, Math.max(.5, size * .012), s.seed + 1, Math.max(4, size / 8)), shade(paint.aerial([66, 66, 62], fog, FOG), (rr() - .5) * 16));
    ctx.strokeStyle = shade(paint.aerial([200, 200, 190], fog, FOG), 0, .5); ctx.lineWidth = Math.max(1, size * .006);
    ctx.beginPath(); ctx.moveTo(...riser[0]); ctx.lineTo(...riser[1]); ctx.stroke();
    // moss along the riser's foot and the step's ends
    ctx.fillStyle = shade(paint.aerial([64, 96, 44], fog, FOG), 0, .8);
    for (let m = 0; m < 20; m++) { const u = rr(), x = lerp(riser[3][0], riser[2][0], u), y = lerp(riser[3][1], riser[2][1], u); ctx.fillRect(x, y - rr() * 4, 3, 3); }
  }
}

function makeFerns(rnd) {
  return Array.from({ length: 16 }, (_, i) => {
    const side = i % 2 ? 1 : -1, z = 1.6 + rnd() * 5, x = stairAt((z - 1.6) / 24.4)[0] + side * (1.3 + rnd() * .8);
    return { p: P([x, slope(z), z]), k: cam.focal / cam.project([x, 0, z])[2], side, lag: rnd() * TAU, fronds: 5 + Math.floor(rnd() * 4) };
  });
}
function fern(ctx, f, sway) {
  for (let i = 0; i < f.fronds; i++) {
    const a = -Math.PI / 2 + (i / (f.fronds - 1) - .5) * 2.4 + sway, l = f.k * (.5 + (i % 3) * .1);
    const tip = [f.p[0] + Math.cos(a) * l, f.p[1] + Math.sin(a) * l * .6 + l * .2];
    ctx.strokeStyle = '#3a5a2a'; ctx.lineWidth = Math.max(1, f.k * .01);
    ctx.beginPath(); ctx.moveTo(...f.p); ctx.quadraticCurveTo(f.p[0] + Math.cos(a) * l * .6, f.p[1] - l * .4, ...tip); ctx.stroke();
    for (let p = 1; p < 10; p++) {
      const t = p / 10, u = 1 - t, x = u * u * f.p[0] + 2 * u * t * (f.p[0] + Math.cos(a) * l * .6) + t * t * tip[0], y = u * u * f.p[1] + 2 * u * t * (f.p[1] - l * .4) + t * t * tip[1];
      ctx.fillStyle = '#4a7a34'; ctx.beginPath(); ctx.ellipse(x, y, f.k * .05 * (1 - t * .6), f.k * .012, a + 1.3, 0, TAU); ctx.ellipse(x, y, f.k * .05 * (1 - t * .6), f.k * .012, a - 1.3, 0, TAU); ctx.fill();
    }
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(54011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  hillside(ctx, rnd);
  const trees = [];
  for (let i = 0; i < 40; i++) { const z = 2.5 + rnd() ** 1.2 * 26, side = rnd() < .5 ? -1 : 1; trees.push([stairAt((z - 1.6) / 24.4)[0] + side * (2 + rnd() * 6), z]); }
  for (const [x, z] of trees.sort((a, b) => b[1] - a[1])) cedar(ctx, rnd, x, z);
  steps(ctx, rnd);
  paint.applyTexture(ctx, make, 5401, .34, 0, 0, W, H, true);
  const ferns = makeFerns(rnd);
  // fog banks that climb the slope, wrapping
  const fog = make(W, H * 2), fc = fog.getContext('2d');
  for (let i = 0; i < 50; i++) { const y = rnd() * H * 2; for (const dy of [0, -H * 2, H * 2]) glow(fc, rnd() * W, y + dy, 300 + rnd() * 500, 60 + rnd() * 80, '214,218,214', .2); }

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.beginPath(); target.rect(0, 0, W, P(stairAt(.35))[1]); target.clip();
    const y = (phase * H * 2) % (H * 2);
    target.drawImage(fog, 0, -y); target.drawImage(fog, 0, H * 2 - y);
    target.restore();
    for (const f of ferns) fern(target, f, .05 * Math.sin(TAU * phase * 2 + f.lag));
  };
}

module.exports = {
  title: '숲속 안개가 덮은 돌계단',
  slug: 'quiet-fog-on-the-stone-steps',
  sound: 'leaves',
  createScene,
};
