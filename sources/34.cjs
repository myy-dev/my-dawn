'use strict';

// 34 · 맹그로브 숲길 끝의 물빛
// A channel through a mangrove forest opening onto bright water at first light. Mangroves crowd both
// banks, each standing on a tangle of arching prop roots that dive into the water; their canopies meet
// overhead in dark masses of leathery leaves. Ahead, where the channel opens, the lagoon is pale gold. The
// still water doubles every arch of root. Light flickers on the water and on the undersides of the leaves.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, glow, shade, camera } = paint;

const cam = camera({ x: 0, y: 1.1, z: 0, yaw: 0, pitch: .05, focal: 1050, cx: 960, cy: 580 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const M = paint.mirrorOf(cam, 0);
const HORIZON = cam.project([0, 1.1, 1e6])[1];
const FOG = [200, 190, 150];
const fogAt = z => Math.min(.9, 1 - Math.exp(-Math.max(0, z - 4) / 24));

function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// One mangrove: a trunk springing from a dome of arching roots, a spread crown. Drawn through Q.
function mangrove(ctx, t, Q, rnd) {
  const fog = fogAt(t.z), bark = shade(paint.aerial([54, 46, 40], fog, FOG)), leaf = paint.aerial([36, 54, 40], fog, FOG);
  const hub = [t.x, 1.6, t.z];
  ctx.lineCap = 'round';
  for (let r = 0; r < 12; r++) {
    const a = rnd() * TAU, reach = 1.2 + rnd() * 1.6, foot = [t.x + Math.cos(a) * reach, 0, t.z + Math.sin(a) * reach * .6];
    const ctrl = [t.x + Math.cos(a) * reach * .5, 1.9 + rnd() * .6, t.z + Math.sin(a) * reach * .3];
    const s0 = Q(hub), s1 = Q(ctrl), s2 = Q(foot), k = cam.focal / Math.max(1, cam.project(hub)[2]);
    ctx.strokeStyle = bark; ctx.lineWidth = Math.max(1, .07 * k);
    ctx.beginPath(); ctx.moveTo(...s0); ctx.quadraticCurveTo(...s1, ...s2); ctx.stroke();
  }
  const top = Q([t.x + (rnd() - .5), t.h, t.z]), base = Q(hub), k = cam.focal / Math.max(1, cam.project(hub)[2]);
  ctx.strokeStyle = bark; ctx.lineWidth = Math.max(1.5, .22 * k); ctx.beginPath(); ctx.moveTo(...base); ctx.lineTo(...top); ctx.stroke();
  for (let c = 0; c < 26; c++) {
    const p = Q([t.x + (rnd() - .5) * 6, t.h + (rnd() - .3) * 2.6, t.z + (rnd() - .5) * 3]);
    glow(ctx, p[0], p[1], (1 + rnd()) * k, (.6 + rnd() * .5) * k, shade(leaf, (rnd() - .5) * 20).slice(5, -3), .9);
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(34011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#2a3a34'], [.45, '#c8b490'], [.55, '#f0d8a4'], [1, '#2a3024']]);
  ctx.fillRect(0, 0, W, H);
  glow(ctx, W / 2, HORIZON, 500, 200, '255,236,190', .5);
  const trees = [];
  for (let i = 0; i < 46; i++) { const side = i % 2 ? 1 : -1, z = 3 + rnd() ** 1.2 * 60; trees.push({ x: side * (3.4 + z * .06 + rnd() * 3), z, h: 6 + rnd() * 4, seed: rnd() * 1e6 | 0 }); }
  trees.sort((a, b) => b.z - a.z);
  const refl = make(W, H), rc = refl.getContext('2d');
  rc.fillStyle = vertical(rc, HORIZON, H, [[0, '#f0d8a4'], [.4, '#a89870'], [1, '#2a2a20']]); rc.fillRect(0, HORIZON, W, H);
  for (const t of trees) { mangrove(ctx, t, P, paint.seeded(t.seed)); mangrove(rc, t, M, paint.seeded(t.seed)); }
  rc.globalCompositeOperation = 'source-atop'; rc.fillStyle = 'rgba(20,20,10,.35)'; rc.fillRect(0, 0, W, H);
  // the canopy closing overhead, a dark ragged ceiling
  for (let i = 0; i < 80; i++) glow(ctx, rnd() * W, rnd() * 220, 120 + rnd() * 200, 60 + rnd() * 80, '18,26,20', .9);
  paint.applyTexture(ctx, make, 3401, .32, 0, 0, W, H, true);
  const flecks = Array.from({ length: 40 }, () => ({ x: rnd() * W, y: 120 + rnd() * 300, offset: rnd() }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    paint.ripple(target, refl, HORIZON, phase, { amp: .6, bands: 3 });
    // light thrown up off the water dancing on the leaves overhead
    for (const f of flecks) {
      const a = Math.max(0, Math.sin(TAU * (phase * 3 + f.offset))) ** 3;
      glow(target, f.x + Math.sin(TAU * (phase * 2 + f.offset)) * 20, f.y, 30, 10, '240,220,170', .2 * a);
    }
  };
}

module.exports = {
  title: '맹그로브 숲길 끝의 물빛',
  slug: 'mangrove-water-at-first-light',
  sound: 'forest',
  createScene,
};
