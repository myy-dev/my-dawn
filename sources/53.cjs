'use strict';

// 53 · 이끼가 번진 오래된 돌담
// An old dry-stone wall running through the woods at first light, seen along its length so it curves away
// from us into the trees. Its stones are rounded fieldstones of many sizes, settled and leaning, thick with
// moss on their tops and north faces, ferns and a sapling growing from the joints. A little stream runs
// beside it in a stony bed. The trunks of the wood rise behind in the haze; a few drops fall from the
// canopy and the stream glints.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, glow, pathOf, shade, camera, wobble, v3 } = paint;
const { add } = v3;

const cam = camera({ x: 0, y: 1.1, z: 0, yaw: .3, pitch: -.04, focal: 1100, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const FOG = [130, 146, 130];
const fogAt = z => Math.min(.9, 1 - Math.exp(-Math.max(0, z - 4) / 22));
const wallAt = t => [-1.2 + Math.sin(t * 2.2) * 2.2 + t * 6, 0, 1.5 + t * 40];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function wood(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#3a4a40'], [.45, '#8a9a84'], [.6, '#5a6a50'], [1, '#1e2618']]);
  ctx.fillRect(0, 0, W, H);
  glow(ctx, 1300, 380, 600, 400, '230,230,200', .35);
  // trunks through the haze, farther ones paler
  for (let i = 0; i < 70; i++) {
    const z = 6 + rnd() ** 1.2 * 50, x = (rnd() - .5) * z * 2.4 + 8, b = cam.project([x, 0, z]); if (b[2] <= 0) continue;
    const k = cam.focal / b[2], w = (.18 + rnd() * .25) * k, fog = fogAt(z);
    const g = ctx.createLinearGradient(b[0] - w, 0, b[0] + w, 0);
    g.addColorStop(0, shade(paint.aerial([40, 42, 36], fog, FOG))); g.addColorStop(.6, shade(paint.aerial([70, 72, 62], fog, FOG))); g.addColorStop(1, shade(paint.aerial([30, 32, 28], fog, FOG)));
    fill(ctx, [[b[0] - w, b[1]], [b[0] + w, b[1]], [b[0] + w * .7, -10], [b[0] - w * .7, -10]], g);
  }
  // forest floor: leaf litter, moss, a few ferns
  for (let i = 0; i < 4000; i++) {
    const z = 1 + rnd() ** 1.6 * 45, x = (rnd() - .5) * z * 2.6 + 4, s = cam.project([x, 0, z]); if (s[2] <= 0) continue;
    const k = cam.focal / s[2], fog = fogAt(z);
    ctx.fillStyle = shade(paint.aerial(rnd() < .5 ? [70, 90, 50] : [100, 80, 50], fog, FOG), (rnd() - .5) * 30, .8);
    ctx.beginPath(); ctx.ellipse(s[0], s[1], (.04 + rnd() * .05) * k, (.015 + rnd() * .02) * k, rnd(), 0, TAU); ctx.fill();
  }
}

// The stream: a strip of dark water with pale stones, running beside the wall toward us.
function stream(ctx, rnd) {
  const left = [], right = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40, w = wallAt(t); left.push(P(add(w, [1.0, -.05, 0]))); right.push(P(add(w, [1.9 + t * .5, -.05, 0]))); }
  fill(ctx, left.concat(right.slice().reverse()), vertical(ctx, P(wallAt(1))[1], H, [[0, '#8a9a90'], [1, '#1a2422']]));
  for (let i = 0; i < 160; i++) {
    const t = rnd() ** 1.4, w = wallAt(t), p = add(w, [1.0 + rnd() * (1 + t * .5), 0, 0]), s = cam.project(p); if (s[2] <= 0) continue;
    const k = cam.focal / s[2], r = (.05 + rnd() * .12) * k;
    ctx.fillStyle = shade(paint.aerial([120, 116, 104], fogAt(p[2]), FOG), (rnd() - .5) * 30); ctx.beginPath(); ctx.ellipse(s[0], s[1], r, r * .55, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(220,226,210,.2)'; ctx.beginPath(); ctx.ellipse(s[0] - r * .2, s[1] - r * .25, r * .5, r * .2, 0, 0, TAU); ctx.fill();
  }
}

// The wall, stone by stone: courses of rounded fieldstones along its line, each with moss on top.
function wall(ctx, rnd) {
  const stones = [];
  for (let t = 0; t < 1; t += .004 + t * .006) {
    for (let c = 0; c < 4; c++) {
      const w = wallAt(t), h = c * .24 + rnd() * .05;
      if (c === 3 && rnd() < .4) continue;
      stones.push({ p: add(w, [(rnd() - .5) * .3, h, (rnd() - .5) * .2]), r: .16 + rnd() * .14, c, z: w[2], seed: rnd() * 1e6 | 0 });
    }
  }
  stones.sort((a, b) => b.z - a.z || a.c - b.c);
  for (const s of stones) {
    const sc = cam.project(s.p); if (s.p[2] < 1.6 || sc[2] <= 0) continue;
    const k = cam.focal / sc[2], rx = s.r * k * 1.3, ry = s.r * k, fog = fogAt(s.z), rr = paint.seeded(s.seed);
    const outline = wobble(Array.from({ length: 10 }, (_, i) => [sc[0] + Math.cos(i / 10 * TAU) * rx * (.85 + rr() * .3), sc[1] - ry + Math.sin(i / 10 * TAU) * ry * (.85 + rr() * .3)]), Math.max(.5, rx * .06), s.seed, Math.max(3, rx / 3));
    const g = ctx.createLinearGradient(0, sc[1] - ry * 2, 0, sc[1]);
    g.addColorStop(0, shade(paint.aerial([132, 128, 118], fog, FOG), (rr() - .5) * 30)); g.addColorStop(1, shade(paint.aerial([60, 60, 56], fog, FOG)));
    fill(ctx, outline, g);
    // moss cap: a green cushion over the top of the stone, deepest on the side away from the light
    const cap = outline.filter(p => p[1] < sc[1] - ry * .9);
    if (cap.length > 2) {
      fill(ctx, cap.concat([[cap[cap.length - 1][0], cap[cap.length - 1][1] + ry * .3], [cap[0][0], cap[0][1] + ry * .3]]), shade(paint.aerial([70, 104, 46], fog, FOG), (rr() - .5) * 30, .9));
      for (let m = 0; m < 10; m++) { const q = cap[Math.floor(rr() * cap.length)]; ctx.fillStyle = shade(paint.aerial([120, 150, 70], fog, FOG), 0, .7); ctx.fillRect(q[0] + (rr() - .5) * 4, q[1] + rr() * ry * .2, 2, 2); }
    }
    ctx.strokeStyle = 'rgba(10,12,10,.45)'; ctx.lineWidth = Math.max(.8, rx * .03); pathOf(ctx, outline); ctx.stroke();
  }
  // a fern and a young sapling growing out of the wall's joints
  const fern = P(add(wallAt(.06), [0, .7, 0]));
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * .3, l = 80 + rnd() * 40;
    ctx.strokeStyle = '#3a5a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...fern); ctx.quadraticCurveTo(fern[0] + Math.cos(a) * l * .6, fern[1] + Math.sin(a) * l * .8, fern[0] + Math.cos(a) * l, fern[1] + Math.sin(a) * l * .5 + 20); ctx.stroke();
    for (let p = 1; p < 8; p++) { const t = p / 8, x = fern[0] + Math.cos(a) * l * t, y = fern[1] + Math.sin(a) * l * t * .7; ctx.fillStyle = '#4a7034'; ctx.beginPath(); ctx.ellipse(x, y, 8 * (1 - t * .6), 3, a + 1.2, 0, TAU); ctx.ellipse(x, y, 8 * (1 - t * .6), 3, a - 1.2, 0, TAU); ctx.fill(); }
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(53011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  wood(ctx, rnd);
  stream(ctx, rnd);
  wall(ctx, rnd);
  paint.applyTexture(ctx, make, 5301, .36, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.78, .82, .78], lights: [{ x: 1300, y: 420, rx: 900, ry: 700, power: .25, color: [1.05, 1.02, .9] }] })(ctx);
  const drops = paint.particles(rnd, 24, { kind: 'rain', near: .4, slant: .02, speed: .5 });
  const glints = Array.from({ length: 30 }, () => { const t = rnd() ** 1.3, w = wallAt(t); return { p: P(add(w, [1.2 + rnd() * .8, 0, 0])), offset: rnd() }; });

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const g of glints) {
      const a = Math.max(0, Math.sin(TAU * (phase * 3 + g.offset))) ** 4;
      target.fillStyle = `rgba(240,244,230,${a * .6})`; target.fillRect(g.p[0] - 6, g.p[1], 12, 1.5);
    }
    drops.draw(target, phase, '210,220,210');
  };
}

module.exports = {
  title: '이끼가 번진 오래된 돌담',
  slug: 'moss-on-the-old-garden-wall',
  sound: 'forest',
  createScene,
};
