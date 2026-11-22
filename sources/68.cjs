'use strict';

// 68 · 달 아래 빙하의 푸른 단면
// The calving face of a glacier at night under a high moon. A cliff of ice rises from a black fjord: its
// face split into towering seracs and columns by deep vertical crevasses, glowing an inner blue where the
// moonlight passes into it, white on the tops, banded with dark lines of old debris. At its foot the water
// is littered with floating brash ice and a few bergy bits catching the light. The moon's path lies across
// the water. Small pieces of ice rock on the slow swell; now and then a sliver falls from the face.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, noise, pathOf } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
const WATER = 760;

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(68011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, WATER); sky.addColorStop(0, '#04081a'); sky.addColorStop(1, '#16243a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 400, WATER);
  const moon = [1500, 150];
  glow(ctx, moon[0], moon[1], 260, 260, '200,220,240', .2); ctx.fillStyle = '#f0f4f8'; ctx.beginPath(); ctx.arc(moon[0], moon[1], 30, 0, TAU); ctx.fill();
  // far mountains behind the glacier
  ctx.fillStyle = '#121a2a'; ctx.beginPath(); ctx.moveTo(0, WATER); for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 300 + 120 * noise(x / 300, 1, 3) + 40 * noise(x / 60, 2, 4)); ctx.lineTo(W, WATER); ctx.fill();
  ctx.strokeStyle = 'rgba(200,220,240,.25)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x <= W; x += 10) { const y = 300 + 120 * noise(x / 300, 1, 3) + 40 * noise(x / 60, 2, 4); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  // the glacier face: columns of ice side by side, each with its own top, depth and shading
  const top = x => 380 + 60 * Math.sin(x / 400) + 50 * noise(x / 120, 5, 6);
  // one continuous face: a jagged serac skyline, a blue body darkening toward the water, vertical
  // fractures, lighter and darker slabs between them, debris bands, a snow rim along the top
  const columns = [], skyline = [];
  for (let x = -40; x <= W + 40; x += 8) skyline.push([x, top(x) + 60 + 40 * noise(x / 40, 7, 2) - 70 * Math.max(0, noise(x / 25, 9, 3) - .55) * 3]);
  const face = [...skyline, [W + 40, WATER], [-40, WATER]];
  const body = ctx.createLinearGradient(0, 380, 0, WATER); body.addColorStop(0, '#5a98b8'); body.addColorStop(.5, '#2e6488'); body.addColorStop(1, '#10283c');
  fill(ctx, face, body);
  ctx.save(); pathOf(ctx, face); ctx.clip();
  for (let x = -40; x < W + 40;) {
    const w = 20 + rnd() * 70, t = top(x + w / 2) + 40;
    ctx.fillStyle = rnd() < .5 ? `rgba(150,210,235,${.06 + rnd() * .1})` : `rgba(4,14,30,${.1 + rnd() * .2})`;
    ctx.beginPath(); ctx.moveTo(x, t - 100); ctx.lineTo(x + w, t - 100); ctx.lineTo(x + w + (rnd() - .5) * 10, WATER); ctx.lineTo(x + (rnd() - .5) * 10, WATER); ctx.fill();
    glow(ctx, x + w * .5, lerp(t, WATER, .45), w * .4, (WATER - t) * .3, '90,180,220', .12 * rnd());
    // fracture: a dark tapering wedge from the top down
    const d = 120 + rnd() * (WATER - t); ctx.fillStyle = 'rgba(2,8,18,.75)'; ctx.beginPath(); ctx.moveTo(x - 3, t - 80); ctx.lineTo(x + 4, t - 80); ctx.lineTo(x + (rnd() - .5) * 8, t + d); ctx.fill();
    columns.push({ x, w, t });
    x += w;
  }
  for (let b = 0; b < 7; b++) { const y0 = lerp(470, WATER - 30, b / 7) + rnd() * 20; ctx.strokeStyle = `rgba(20,24,32,${.15 + rnd() * .2})`; ctx.lineWidth = 1 + rnd() * 3; ctx.beginPath(); for (let x = -40; x <= W + 40; x += 40) ctx.lineTo(x, y0 + 12 * Math.sin(x / 200 + b) + (rnd() - .5) * 4); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = '#d0e0ec'; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.beginPath(); skyline.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] + 2) : ctx.moveTo(p[0], p[1] + 2))); ctx.stroke();
  // water: dark with the moon's path and the face's reflection, brash ice
  ctx.fillStyle = '#060a14'; ctx.fillRect(0, WATER, W, H - WATER);
  paint.applyTexture(ctx, make, 6801, .3, 0, 0, W, H, true);
  // reflection of the face, for the ripple
  const refl = make(W, H), rc = refl.getContext('2d');
  rc.save(); rc.translate(0, 2 * WATER); rc.scale(1, -1); rc.globalAlpha = .45; rc.drawImage(plate, 0, 0, W, WATER, 0, 0, W, WATER); rc.restore();
  for (let i = 0; i < 30; i++) glow(rc, moon[0] + (rnd() - .5) * 60, lerp(WATER + 10, H, rnd()), 40 + rnd() * 60, 4, '220,236,250', .4);
  // floating ice: flat irregular pieces, larger and fewer near, many small far
  const floes = Array.from({ length: 70 }, () => { const y = lerp(WATER + 6, H - 20, rnd() ** 1.6), s = lerp(4, 36, (y - WATER) / (H - WATER)) * (.4 + rnd()); return { x: rnd() * W, y, s, lag: rnd() * TAU, seed: Math.floor(rnd() * 1e6) }; });
  const falls = [{ col: columns[Math.floor(columns.length * .35)], t: .2 }, { col: columns[Math.floor(columns.length * .7)], t: .65 }];

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    paint.ripple(target, refl, WATER, phase, { bands: 3, amp: .9, speed: 2 });
    for (const f of floes) {
      const bob = Math.sin(TAU * phase * 2 + f.lag) * f.s * .04, tilt = Math.sin(TAU * phase + f.lag) * .05;
      const pts = paint.wobble(Array.from({ length: 8 }, (_, k) => [f.x + Math.cos(k / 8 * TAU + tilt) * f.s, f.y + bob + Math.sin(k / 8 * TAU) * f.s * .28]), f.s * .15, f.seed, 8);
      fill(target, pts, '#5a7890');
      fill(target, pts.map(([px, py]) => [px, py - f.s * .08]), '#a8c0d4');
    }
    // slivers dropping from the face, each once per loop, with a splash ring
    for (const fl of falls) {
      const t = (phase - fl.t + 1) % 1; if (t > .25) continue;
      const u = t / .25, c = fl.col, x0 = c.x + c.w * .5, y = lerp(c.t + 60, WATER, Math.min(1, u * 1.6) ** 2);
      if (u < .62) { fill(target, [[x0 - 6, y - 20], [x0 + 6, y - 22], [x0 + 5, y], [x0 - 4, y + 2]], '#c8dcea'); }
      else { const r = (u - .62) / .38; target.strokeStyle = `rgba(200,220,240,${.6 * (1 - r)})`; target.lineWidth = 1.5; target.beginPath(); target.ellipse(x0, WATER + 6, 10 + r * 60, 2 + r * 8, 0, 0, TAU); target.stroke(); glow(target, x0, WATER - 10 * (1 - r), 20, 30 * (1 - r), '220,236,250', .4 * (1 - r)); }
    }
  };
}

module.exports = {
  title: '달 아래 빙하의 푸른 단면',
  slug: 'blue-glacier-wall-in-moonlight',
  sound: 'snow',
  createScene,
};
