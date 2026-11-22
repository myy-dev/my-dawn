'use strict';

// 16 · 빵을 식히는 나무 작업대
// A baker's workroom in the hour before opening. On a long, scarred wooden bench, fresh loaves cool on wire
// racks: crusty boules with flour-dusted scored tops, a long baguette, a plaited loaf; a linen cloth, a
// scatter of flour, a dough scraper. A pendant lamp hangs low over the bench and lights the crusts; behind
// it the wall holds wooden peels and baskets, and a small window shows the first grey-blue of morning.
// Steam rises from the warm bread; a breath of wind from outside stirs the lamp.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, camera, planks } = paint;

const cam = camera({ x: 0, y: 1.5, z: .2, yaw: .05, pitch: .15, focal: 1150, cx: 960, cy: 540 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const BENCH = .9, WALL = 3;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function room(ctx, rnd) {
  ctx.fillStyle = '#2a221e'; ctx.fillRect(0, 0, W, H);
  paint.masonry(ctx, (u, v) => P([lerp(-3, 3, u), lerp(3.2, BENCH, v), WALL]), rnd, { courses: 32, length: [.012, .022], base: [116, 98, 86], vary: 16, mortar: [92, 80, 72] });
  // small window
  const w = [P([1, 2.5, WALL - .01]), P([1.8, 2.5, WALL - .01]), P([1.8, 1.7, WALL - .01]), P([1, 1.7, WALL - .01])];
  fill(ctx, w, vertical(ctx, w[0][1], w[2][1], [[0, '#4a5a7a'], [1, '#8a94a8']]));
  ctx.strokeStyle = '#3a2c22'; ctx.lineWidth = 8; pathOf(ctx, w); ctx.stroke();
  ctx.beginPath(); ctx.moveTo((w[0][0] + w[1][0]) / 2, w[0][1]); ctx.lineTo((w[3][0] + w[2][0]) / 2, w[3][1]); ctx.stroke();
  // peels and baskets on the wall
  for (let i = 0; i < 3; i++) {
    const x = -2.4 + i * .5, top = P([x, 2.9, WALL - .05]), bot = P([x + .05, 1.3, WALL - .05]), k = cam.focal / 3;
    ctx.strokeStyle = '#8a6a48'; ctx.lineWidth = .05 * k; ctx.beginPath(); ctx.moveTo(...top); ctx.lineTo(...bot); ctx.stroke();
    fill(ctx, [[bot[0] - .16 * k, bot[1]], [bot[0] + .16 * k, bot[1]], [bot[0] + .14 * k, bot[1] + .5 * k], [bot[0] - .14 * k, bot[1] + .5 * k]], '#a8845a');
  }
  for (let i = 0; i < 3; i++) { const c = P([-.6 + i * .5, 2.4, WALL - .2]), k = cam.focal / 2.8; ctx.fillStyle = '#8a6a40'; ctx.beginPath(); ctx.ellipse(c[0], c[1], .2 * k, .08 * k, 0, 0, Math.PI); ctx.fill(); for (let s = 0; s < 6; s++) { ctx.strokeStyle = 'rgba(40,24,12,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c[0] - .2 * k + s * .07 * k, c[1]); ctx.lineTo(c[0] - .18 * k + s * .065 * k, c[1] + .07 * k); ctx.stroke(); } }
}

function bench(ctx, rnd) {
  const top = [P([-2.6, BENCH, 1.1]), P([2.6, BENCH, 1.1]), P([2.6, BENCH, 2.6]), P([-2.6, BENCH, 2.6])];
  planks(ctx, [top[3], top[2], top[1], top[0]], rnd, { along: 'v', width: [.05, .08], base: [150, 110, 72], vary: 22, streaks: 2 });
  // knife scars and flour dust
  for (let i = 0; i < 60; i++) { const a = P([lerp(-2.4, 2.4, rnd()), BENCH, lerp(1.2, 2.5, rnd())]); ctx.strokeStyle = 'rgba(60,40,24,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(a[0] + (rnd() - .5) * 60, a[1] + (rnd() - .5) * 8); ctx.stroke(); }
  for (let i = 0; i < 40; i++) glow(ctx, ...P([lerp(-2, 2, rnd()), BENCH, lerp(1.2, 2.4, rnd())]), 30 + rnd() * 60, 8 + rnd() * 14, '236,230,214', .25);
  fill(ctx, [top[0], top[1], P([2.6, BENCH - .08, 1.1]), P([-2.6, BENCH - .08, 1.1])], '#5a3e28');
}

// Wire racks with loaves.
function rack(ctx, x0, x1, z0, z1) {
  const h = BENCH + .06;
  for (let i = 0; i <= 10; i++) { const x = lerp(x0, x1, i / 10); ctx.strokeStyle = 'rgba(60,60,64,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...P([x, h, z0])); ctx.lineTo(...P([x, h, z1])); ctx.stroke(); }
  for (let i = 0; i <= 6; i++) { const z = lerp(z0, z1, i / 6); ctx.beginPath(); ctx.moveTo(...P([x0, h, z])); ctx.lineTo(...P([x1, h, z])); ctx.stroke(); }
}
function boule(ctx, rnd, at, r) {
  const c = P(at), k = cam.focal / cam.project(at)[2], rx = r * k, ry = r * .75 * k;
  const g = ctx.createRadialGradient(c[0] - rx * .3, c[1] - ry * .6, rx * .1, c[0], c[1] - ry * .3, rx * 1.1);
  g.addColorStop(0, '#e4a860'); g.addColorStop(.5, '#a86428'); g.addColorStop(1, '#5a2e14');
  ctx.fillStyle = 'rgba(20,12,8,.45)'; ctx.beginPath(); ctx.ellipse(c[0] + rx * .15, c[1] + ry * .02, rx * 1.05, ry * .22, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(c[0] - rx, c[1] - ry * .25); ctx.bezierCurveTo(c[0] - rx * 1.02, c[1] - ry * 1.35, c[0] + rx * 1.02, c[1] - ry * 1.35, c[0] + rx, c[1] - ry * .25); ctx.bezierCurveTo(c[0] + rx * .95, c[1] + ry * .08, c[0] - rx * .95, c[1] + ry * .08, c[0] - rx, c[1] - ry * .25); ctx.fill();
  ctx.fillStyle = 'rgba(60,24,8,.35)'; ctx.beginPath(); ctx.ellipse(c[0] + rx * .25, c[1] - ry * .2, rx * .7, ry * .25, 0, 0, TAU); ctx.fill();
  // flour and the scored ears
  glow(ctx, c[0], c[1] - ry * .9, rx * .6, ry * .3, '240,234,220', .5);
  for (let s = 0; s < 3; s++) { const off = (s - 1) * rx * .35; ctx.strokeStyle = '#f0d4a0'; ctx.lineWidth = Math.max(1.5, rx * .05); ctx.beginPath(); ctx.moveTo(c[0] + off - rx * .3, c[1] - ry * .95); ctx.quadraticCurveTo(c[0] + off, c[1] - ry * 1.15, c[0] + off + rx * .3, c[1] - ry * .95); ctx.stroke(); }
  return [c[0], c[1] - ry];
}
function baguette(ctx, a, b, r) {
  const pa = P(a), pb = P(b), k = cam.focal / cam.project(a)[2];
  ctx.strokeStyle = '#a86428'; ctx.lineWidth = r * 2 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...pa); ctx.lineTo(...pb); ctx.stroke();
  ctx.strokeStyle = '#d89a58'; ctx.lineWidth = r * k; ctx.beginPath(); ctx.moveTo(pa[0], pa[1] - r * .5 * k); ctx.lineTo(pb[0], pb[1] - r * .5 * k); ctx.stroke();
  for (let s = 0; s < 6; s++) { const t = (s + .5) / 6, x = lerp(pa[0], pb[0], t), y = lerp(pa[1], pb[1], t) - r * .6 * k; ctx.strokeStyle = '#f0cc90'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r * .5 * k, y + 3); ctx.lineTo(x + r * .5 * k, y - 3); ctx.stroke(); }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(16011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  room(ctx, rnd);
  bench(ctx, rnd);
  rack(ctx, -1.6, .2, 1.5, 2.3); rack(ctx, .5, 1.9, 1.4, 2.2);
  const tops = [boule(ctx, rnd, [-1.2, BENCH + .06, 2], .3), boule(ctx, rnd, [-.35, BENCH + .06, 1.85], .26), boule(ctx, rnd, [1.2, BENCH + .06, 1.95], .32)];
  baguette(ctx, [.4, BENCH + .1, 1.5], [1.9, BENCH + .1, 1.42], .07);
  // linen cloth and the dough scraper
  fill(ctx, [P([-2.4, BENCH + .005, 1.3]), P([-1.7, BENCH + .005, 1.25]), P([-1.6, BENCH + .005, 1.7]), P([-2.35, BENCH + .005, 1.8])], '#e4dccc');
  fill(ctx, [P([1.9, BENCH + .01, 1.3]), P([2.2, BENCH + .01, 1.3]), P([2.2, BENCH + .01, 1.42]), P([1.9, BENCH + .01, 1.42])], '#9aa0a8');
  paint.applyTexture(ctx, make, 1601, .32, 0, 0, W, H, true);
  const lamp = P([0, 2.0, 1.9]);
  paint.lighting(make, { ambient: [.5, .5, .6], lights: [paint.LIGHT.hood(lamp[0], lamp[1] + 30, 1.1, 800, 640)] })(ctx);
  const hook = P([0, 3.2, 1.9]);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const t0 of tops) for (let i = 0; i < 4; i++) {
      const t = (phase * 2 + i / 4 + t0[0] * .001) % 1;
      glow(target, t0[0] + Math.sin(t * 6 + i) * 16 * t, t0[1] - t * 220, 10 + t * 30, 8 + t * 22, '240,236,230', .2 * (1 - t));
    }
    const sw = .025 * Math.sin(TAU * phase * 2), lx = hook[0] + Math.sin(sw) * (lamp[1] - hook[1]), ly = hook[1] + Math.cos(sw) * (lamp[1] - hook[1]);
    target.strokeStyle = '#141010'; target.lineWidth = 2; target.beginPath(); target.moveTo(...hook); target.lineTo(lx, ly - 30); target.stroke();
    fill(target, [[lx - 22, ly - 34], [lx + 22, ly - 34], [lx + 90, ly + 6], [lx - 90, ly + 6]], '#3a2e26');
    target.fillStyle = '#ffe0a8'; target.beginPath(); target.ellipse(lx, ly + 6, 88, 12, 0, 0, TAU); target.fill();
    glow(target, lx, ly + 10, 160, 80, '255,210,150', .4);
  };
}

module.exports = {
  title: '빵을 식히는 나무 작업대',
  slug: 'bread-on-the-cooling-rack',
  sound: 'room-wind',
  createScene,
};
