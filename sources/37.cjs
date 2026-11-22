'use strict';

// 37 · 얼음 조각이 떠가는 겨울 바닷가
// A frozen shore on a winter morning before sunrise. Snow covers the beach and the rocks; the shallows are
// crusted with shore ice broken into slabs that have been pushed up at angles, their broken edges blue and
// glassy. Out on the dark open water, floes drift past on the current, each its own shape, white on top
// with a blue-green rim at the waterline. The wind is hard and cold: snow streams off the slabs.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, glow, pathOf, camera, wobble } = paint;

const cam = camera({ x: 0, y: 1.6, z: 0, yaw: -.04, pitch: -.02, focal: 1100, cx: 960, cy: 520 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.6, 1e6])[1];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// An ice slab seen in 3D: a flat top (snowy), a thickness at its edge (blue-green, glassy).
function slab(ctx, c, r, tilt, seed, Q = P, top = '#7e8a9a') {
  const rnd = paint.seeded(seed), pts = [];
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = r * (.6 + rnd() * .5); pts.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr * tilt, c[2] + Math.sin(a) * rr]); }
  const upper = pts.map(p => Q(p)), lower = pts.map(p => Q([p[0], p[1] - .25, p[2]]));
  for (let i = 0; i < 9; i++) {
    const j = (i + 1) % 9;
    if (upper[i][1] < upper[j][1] - 100) continue;
    fill(ctx, [upper[i], upper[j], lower[j], lower[i]], i % 2 ? '#2a4e5c' : '#3e6a76');
  }
  fill(ctx, upper, top);
  ctx.strokeStyle = 'rgba(150,200,220,.6)'; ctx.lineWidth = 1.2; pathOf(ctx, upper); ctx.stroke();
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(37011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#2a3650'], [.6, '#6a7a92'], [1, '#c4b4b0']]);
  ctx.fillRect(0, 0, W, HORIZON + 2);
  glow(ctx, 1400, HORIZON, 600, 120, '240,200,180', .3);
  for (let i = 0; i < 20; i++) glow(ctx, rnd() * W, 80 + rnd() * 300, 300 + rnd() * 400, 20 + rnd() * 30, '120,130,150', .2);
  // open water: dark, with the sky's light in long streaks
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#4a5668'], [.3, '#1e2a3a'], [1, '#0a1018']]);
  ctx.fillRect(0, HORIZON, W, H);
  // the shore: a snowy beach curving along the bottom left, with snow-capped rocks
  const beach = [[-40, 760], [400, 800], [800, 880], [1100, 980], [1300, H + 40], [-40, H + 40]];
  fill(ctx, wobble(beach, 10, 371, 30), vertical(ctx, 760, H, [[0, '#8a94a6'], [1, '#56606e']]));
  for (let i = 0; i < 8; i++) {
    const x = rnd() * 900, y = 820 + rnd() * 200, r = 40 + rnd() * 70;
    fill(ctx, wobble(Array.from({ length: 10 }, (_, k) => [x + Math.cos(k / 10 * TAU) * r, y + Math.sin(k / 10 * TAU) * r * .6 - r * .3]), r * .1, 372 + i, 12), '#2a2e36');
    fill(ctx, wobble(Array.from({ length: 10 }, (_, k) => [x + Math.cos(k / 10 * TAU) * r * .9, y - r * .5 + Math.sin(k / 10 * TAU) * r * .25]), r * .08, 380 + i, 10), '#9ca6b6');
  }
  // shore ice: slabs pushed up along the waterline at angles
  for (let i = 0; i < 18; i++) slab(ctx, [-6 + i * .9 + rnd(), .15 + rnd() * .2, 4 + i * 1.2 + rnd() * 2], .8 + rnd() * 1.2, .3 + rnd() * .5, 3700 + i);
  paint.applyTexture(ctx, make, 3701, .32, 0, 0, W, H, true);
  const floes = Array.from({ length: 10 }, (_, i) => ({ z: 14 + rnd() * 60, r: .8 + rnd() * 2.4, offset: rnd(), turns: 1, seed: 3750 + i }));
  floes.sort((a, b) => b.z - a.z);
  const spin = paint.particles(rnd, 160, { kind: 'rain', near: .3, slant: -2.2, speed: .5 });

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // floes drift right to left across the open water, one full crossing per loop, wrapping off-screen
    for (const f of floes) {
      const span = f.z * 2.2, x = span - ((phase * f.turns + f.offset) % 1) * span * 2;
      if (f.z < 20 && x < 2) continue;
      slab(target, [x, .05, f.z], f.r, .25, f.seed);
    }
    spin.draw(target, phase, '230,236,244');
  };
}

module.exports = {
  title: '얼음 조각이 떠가는 겨울 바닷가',
  slug: 'winter-sea-with-drifting-ice',
  sound: 'wind',
  createScene,
};
