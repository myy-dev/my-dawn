'use strict';

// 42 · 은행잎이 놓인 돌길
// A stone path through an old ginkgo grove on an autumn dawn. The path's flagstones are irregular, worn
// hollow in the middle and edged with moss, half buried in fallen fan-shaped leaves. Ginkgos stand on both
// sides: furrowed grey trunks, branches held up and out, crowns that are clouds of yellow leaves lit gold
// from the low sun behind them. A stone lantern stands at the bend. Leaves drift down, turning.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, wobble, v3 } = paint;
const { add, mul, unit } = v3;

const cam = camera({ x: 0, y: 1.6, z: 0, yaw: .04, pitch: .04, focal: 1100, cx: 960, cy: 580 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.6, 1e6])[1];
const SUN = [3, 4, 80];
const FOG = [196, 176, 120];
const fogAt = z => Math.min(.9, 1 - Math.exp(-Math.max(0, z - 4) / 30));
const pathAt = t => [Math.sin(t * 3.2 + .3) * 1.8 * t + .4, 0, lerp(1.4, 46, t ** 1.4)];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// A ginkgo leaf: a fan on a short stalk, notched in the middle.
function leaf(ctx, x, y, size, ang, color, alpha = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size * .5, -size * .85); ctx.quadraticCurveTo(-size * .2, -size * 1.05, -size * .03, -size * .8);
  ctx.lineTo(0, -size * .7); ctx.lineTo(size * .03, -size * .82); ctx.quadraticCurveTo(size * .25, -size * 1.05, size * .5, -size * .85); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(120,90,30,.6)'; ctx.lineWidth = Math.max(.5, size * .05); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, size * .35); ctx.stroke();
  ctx.restore();
}

function backdrop(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#6a6a7a'], [.4, '#c8b48a'], [.55, '#e8cc8a'], [.62, '#8a7a50'], [1, '#3a3020']]);
  ctx.fillRect(0, 0, W, H);
  const sun = P(SUN);
  glow(ctx, sun[0], sun[1], 600, 400, '255,226,160', .55);
  // the far grove, yellow and hazy, in two banks
  for (let b = 0; b < 2; b++) {
    for (let i = 0; i < 80; i++) {
      const z = 50 + b * 20 + rnd() * 20, x = (rnd() - .5) * z * 2.6, s = P([x, 6 + rnd() * 8, z]), k = cam.focal / z;
      glow(ctx, s[0], s[1], (3 + rnd() * 4) * k, (2.5 + rnd() * 3) * k, shade(paint.aerial([210, 170, 60], .5 + b * .2, FOG)).slice(5, -3), .5);
    }
  }
}

// The ground: a carpet of fallen leaves, densest at the path's edges and under the trees.
function leafCarpet(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#a08850'], [.4, '#7a6434'], [1, '#3a2e18']]);
  ctx.fillRect(0, HORIZON, W, H);
  for (let i = 0; i < 12000; i++) {
    const z = 1.2 + rnd() ** 1.8 * 50, x = (rnd() - .5) * z * 2.6, s = cam.project([x, 0, z]); if (s[2] <= 0 || s[1] < HORIZON) continue;
    const k = cam.focal / s[2], fog = fogAt(z), tone = rnd() < .8 ? [214, 170, 50] : [170, 120, 40];
    leaf(ctx, s[0], s[1], .06 * k, rnd() * TAU, shade(paint.aerial(tone, fog, FOG), (rnd() - .5) * 40), .9);
  }
}

// Flagstones along the path: each slab its own outline, worn pale in the middle, moss in the joints,
// with leaves lying across some of them.
function flagstones(ctx, rnd) {
  for (let i = 60; i >= 0; i--) {
    const t = i / 60, c = pathAt(t), next = pathAt(Math.min(1, t + 1 / 60)), w = lerp(1.1, .9, t);
    for (const side of [-1, 1]) {
      if (rnd() < .15) continue;
      const x0 = c[0] + (side < 0 ? -w : .04), x1 = c[0] + (side < 0 ? -.04 : w);
      const slab = [[x0, 0, c[2] + .05], [x1, 0, c[2] + .05], [x1 + (next[0] - c[0]), 0, next[2] - .05], [x0 + (next[0] - c[0]), 0, next[2] - .05]].map(P);
      if (slab.some(p => !isFinite(p[0]))) continue;
      const size = Math.abs(slab[1][0] - slab[0][0]);
      const pts = wobble(slab, Math.max(.6, size * .05), Math.floor(rnd() * 1e6), Math.max(4, size / 4));
      const fog = fogAt(c[2]);
      fill(ctx, pts, shade(paint.aerial([120, 116, 104], fog, FOG), (rnd() - .5) * 26));
      const mid = [(slab[0][0] + slab[2][0]) / 2, (slab[0][1] + slab[2][1]) / 2];
      glow(ctx, mid[0], mid[1], size * .35, size * .08, '210,200,176', .35 * (1 - fog));
      ctx.strokeStyle = shade(paint.aerial([40, 46, 30], fog, FOG), 0, .7); ctx.lineWidth = Math.max(.8, size * .015); pathOf(ctx, pts); ctx.stroke();
      const k = cam.focal / cam.project(c)[2];
      for (let l = 0; l < 2; l++) if (rnd() < .5) leaf(ctx, lerp(slab[0][0], slab[1][0], rnd()), lerp(slab[0][1], slab[3][1], rnd()), .07 * k, rnd() * TAU, shade(paint.aerial([224, 180, 60], fog, FOG)));
    }
  }
}

// A ginkgo: a straight furrowed trunk, branches angled upward in tiers, a crown of yellow leaf clumps,
// bright on the side toward the sun and deep amber on the shaded side.
function ginkgo(ctx, rnd, base) {
  const fog = fogAt(base[2]), h = 12 + rnd() * 6, lean = [(rnd() - .5) * .1, 0, 0];
  const trunk = [], r0 = .22 + rnd() * .16;
  for (let i = 0; i <= 16; i++) { const t = i / 16; trunk.push(add(base, mul(lean, h * t), [0, h * t, 0])); }
  const flare = i => (i < 2 ? 1.5 - i * .25 : 1) * (1 - i / 20);
  const left = trunk.map((p, i) => P(add(p, [-r0 * flare(i), 0, 0]))), right = trunk.map((p, i) => P(add(p, [r0 * flare(i), 0, 0])));
  paint.bark(ctx, left.concat(right.slice().reverse()), rnd, { base: paint.aerial([92, 86, 78], fog, FOG), dir: 'v', marks: 60, light: SUN[0] > base[0] ? 1 : -1 });
  ctx.lineCap = 'round';
  const crown = [];
  for (let b = 0; b < 9; b++) {
    const t = .35 + b / 9 * .6, from = trunk[Math.round(t * 16)], a = rnd() * TAU, dir = unit([Math.cos(a), .9 + rnd() * .5, Math.sin(a) * .6]);
    const to = add(from, mul(dir, (3.5 - t * 2) * (.8 + rnd() * .4)));
    const s0 = cam.project(from), s1 = cam.project(to); if (s0[2] <= .5 || s1[2] <= .5) continue;
    ctx.strokeStyle = shade(paint.aerial([70, 64, 58], fog, FOG)); ctx.lineWidth = Math.max(1, .1 * cam.focal / s0[2]);
    ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke();
    crown.push(to);
  }
  for (let i = 0; i < 70; i++) {
    const c = crown[Math.floor(rnd() * crown.length)]; if (!c) continue;
    const p = add(c, [(rnd() - .5) * 3, (rnd() - .4) * 2.4, (rnd() - .5) * 1.5]), s = cam.project(p); if (s[2] <= .5) continue;
    const k = cam.focal / s[2], sunward = (SUN[0] - p[0]) * (s[0] - P(base)[0]) > 0 ? 1 : 0;
    const tone = sunward ? [236, 196, 70] : [180, 128, 40];
    glow(ctx, s[0], s[1], (.9 + rnd() * .8) * k, (.7 + rnd() * .5) * k, shade(paint.aerial(tone, fog, FOG), (rnd() - .5) * 20).slice(5, -3), .85);
  }
}

// A stone lantern: base, shaft, firebox with a glowing window, a curving cap.
function stoneLantern(ctx, at) {
  const s = P(at), k = cam.focal / cam.project(at)[2], c = shade([110, 106, 96]), d = shade([70, 66, 60]);
  const box = (x0, x1, y0, y1, color) => fill(ctx, [[s[0] + x0 * k, s[1] - y1 * k], [s[0] + x1 * k, s[1] - y1 * k], [s[0] + x1 * k, s[1] - y0 * k], [s[0] + x0 * k, s[1] - y0 * k]], color);
  box(-.35, .35, 0, .18, d); box(-.12, .12, .18, .9, c); box(-.3, .3, .9, 1.0, d); box(-.24, .24, 1.0, 1.4, c);
  box(-.1, .1, 1.08, 1.32, '#ffcf8a');
  fill(ctx, [[s[0] - .45 * k, s[1] - 1.4 * k], [s[0] + .45 * k, s[1] - 1.4 * k], [s[0] + .15 * k, s[1] - 1.62 * k], [s[0] - .15 * k, s[1] - 1.62 * k]], d);
  box(-.05, .05, 1.62, 1.75, d);
  glow(ctx, s[0], s[1] - 1.2 * k, .5 * k, .4 * k, '255,200,130', .6);
  return [s[0], s[1] - 1.2 * k];
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(42011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  backdrop(ctx, rnd);
  leafCarpet(ctx, rnd);
  flagstones(ctx, rnd);
  const trees = [];
  for (let i = 0; i < 18; i++) {
    const t = .05 + i / 18 * .9, c = pathAt(t), side = i % 2 ? 1 : -1;
    trees.push(add(c, [side * (2.6 + rnd() * 3), 0, (rnd() - .5) * 2]));
  }
  for (const b of trees.sort((a, b) => b[2] - a[2])) if (b[2] > 3) ginkgo(ctx, rnd, b);
  const lamp = stoneLantern(ctx, add(pathAt(.32), [-1.6, 0, 0]));
  paint.applyTexture(ctx, make, 4201, .36, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.82, .78, .76], lights: [paint.LIGHT.lamp(lamp[0], lamp[1] + 60, .3, 200, 200)] })(ctx);
  const falling = Array.from({ length: 50 }, () => ({ x: rnd() * W, y: rnd(), turns: 1, spin: 1 + Math.floor(rnd() * 3), sway: 30 + rnd() * 80, size: 10 + rnd() * 18, offset: rnd(), tone: rnd() }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const f of falling) {
      const y = ((f.y + phase * f.turns) % 1) * (H + 80) - 40, x = f.x + Math.sin(TAU * (phase * 2 + f.offset)) * f.sway;
      leaf(target, x, y, f.size * (.6 + .4 * Math.abs(Math.cos(TAU * (phase * f.spin + f.offset)))), TAU * (phase * f.spin + f.offset), f.tone < .7 ? '#e8bc48' : '#c8902c', .9);
    }
  };
}

module.exports = {
  title: '은행잎이 놓인 돌길',
  slug: 'ginkgo-stone-path',
  sound: 'leaves',
  createScene,
};
