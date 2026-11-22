'use strict';

// 11 · 유리 온실에 맺힌 새벽 이슬
// Inside an old iron-framed glasshouse just before dawn. Slender cast-iron ribs arch overhead and divide
// the glass into panes; beyond them the garden is blue and the sky is beginning to pale. Inside it is warm
// and the glass is fogged with condensation: beads gather on every pane and now and then one runs down,
// leaving a clear trail. Slatted staging benches carry rows of terracotta pots: ferns, geraniums, a lemon
// tree, cuttings under a bell jar; a watering can stands on the brick floor.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, glow, pathOf, shade, camera, v3 } = paint;


const cam = camera({ x: 0, y: 1.5, z: 0, yaw: 0, pitch: .12, focal: 900, cx: 960, cy: 600 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HALF = 3.2, EAVE = 2.6, RIDGE = 4.6;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}
// The glasshouse cross-section at depth z: straight walls to the eave, then a curved roof to the ridge.
const section = (t, z) => {
  if (t < .25) { const u = t / .25; return [-HALF, EAVE * u, z]; }
  if (t > .75) { const u = (1 - t) / .25; return [HALF, EAVE * u, z]; }
  const a = Math.PI * (1 - (t - .25) / .5); return [Math.cos(a) * HALF, EAVE + Math.sin(a) * (RIDGE - EAVE), z];
};

function outside(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#2a3a5a'], [.5, '#6a7a96'], [.7, '#8a8a9c'], [1, '#3a4a4a']]);
  ctx.fillRect(0, 0, W, H);
  glow(ctx, 960, 560, 700, 300, '230,214,200', .3);
  for (let i = 0; i < 40; i++) glow(ctx, rnd() * W, 540 + rnd() * 80, 60 + rnd() * 120, 40 + rnd() * 60, '40,56,52', .7);
}

// The frame: ribs every so often down the house, purlins along it, glazing bars dividing the panes.
function frame(ctx) {
  ctx.strokeStyle = '#1c2224'; ctx.lineCap = 'round';
  for (let z = 1.5; z <= 22; z += 1.5) {
    ctx.lineWidth = Math.max(2, 70 / z); ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const p = P(section(i / 40, z)); i ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke();
  }
  for (let t = 0; t <= 1.001; t += 1 / 16) {
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...P(section(t, 1.5))); ctx.lineTo(...P(section(t, 22))); ctx.stroke();
  }
}

// Condensation: a fog over the glass with beads; a few drops will run each loop.
function condensation(ctx, rnd) {
  ctx.fillStyle = 'rgba(200,210,214,.18)'; ctx.fillRect(0, 0, W, 700);
  for (let i = 0; i < 3000; i++) {
    const x = rnd() * W, y = rnd() ** 1.4 * 700, r = .6 + rnd() * 2.4;
    ctx.fillStyle = `rgba(230,236,240,${.2 + rnd() * .3})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(40,50,60,.25)'; ctx.beginPath(); ctx.arc(x + r * .3, y + r * .3, r * .5, 0, TAU); ctx.fill();
  }
}

function bench(ctx, rnd, side) {
  const x0 = side * HALF * .55, at = (dx, y, z) => P([x0 + dx * side, y, z]);
  // legs and slatted top
  for (let z = 2; z < 16; z += 2.5) for (const dx of [-.4, .4]) { ctx.strokeStyle = '#3a3026'; ctx.lineWidth = Math.max(2, 40 / z); ctx.beginPath(); ctx.moveTo(...at(dx, .8, z)); ctx.lineTo(...at(dx, 0, z)); ctx.stroke(); }
  for (let s = 0; s < 6; s++) { const dx = -.45 + s * .18; fill(ctx, [at(dx, .82, 1.6), at(dx + .14, .82, 1.6), at(dx + .14, .82, 16), at(dx, .82, 16)], shade([110, 90, 66], (rnd() - .5) * 20)); }
  fill(ctx, [at(-.45, .82, 1.6), at(.55, .82, 1.6), at(.55, .74, 1.6), at(-.45, .74, 1.6)], '#4a3a2c');
  // pots: terracotta, each with its plant
  const pots = [];
  for (let z = 2.2; z < 15; z += .7 + rnd() * .6) pots.push(z);
  for (const z of pots.reverse()) {
    const c = [x0 + (rnd() - .5) * .3 * side, .82, z], k = cam.focal / cam.project(c)[2], r = (.12 + rnd() * .06) * k, h = r * 1.1, s = P(c);
    const g = ctx.createLinearGradient(s[0] - r, 0, s[0] + r, 0);
    g.addColorStop(0, '#6a3422'); g.addColorStop(.4, '#b8643e'); g.addColorStop(1, '#5a2a1c');
    fill(ctx, [[s[0] - r, s[1] - h], [s[0] + r, s[1] - h], [s[0] + r * .75, s[1]], [s[0] - r * .75, s[1]]], g);
    fill(ctx, [[s[0] - r * 1.08, s[1] - h - r * .18], [s[0] + r * 1.08, s[1] - h - r * .18], [s[0] + r * 1.05, s[1] - h], [s[0] - r * 1.05, s[1] - h]], '#c4724a');
    const kind = Math.floor(rnd() * 3), top = [s[0], s[1] - h];
    for (let l = 0; l < 14; l++) {
      const a = -Math.PI / 2 + (rnd() - .5) * (kind === 0 ? 2.6 : 1.6), len = r * (1.2 + rnd() * 1.8);
      if (kind === 0) { ctx.strokeStyle = shade([60, 100, 54], (rnd() - .5) * 30); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...top); ctx.quadraticCurveTo(top[0] + Math.cos(a) * len * .5, top[1] - len * .6, top[0] + Math.cos(a) * len, top[1] + Math.sin(a) * len * .5); ctx.stroke(); }
      else { const lx = top[0] + Math.cos(a) * len * .6, ly = top[1] + Math.sin(a) * len * .6; ctx.fillStyle = shade(kind === 1 ? [70, 104, 50] : [50, 84, 44], (rnd() - .5) * 30); ctx.beginPath(); ctx.ellipse(lx, ly, r * .35, r * .25, a, 0, TAU); ctx.fill(); }
    }
    if (kind === 1 && rnd() < .6) { ctx.fillStyle = '#c03a3a'; ctx.beginPath(); ctx.arc(top[0], top[1] - r * 1.4, r * .25, 0, TAU); ctx.fill(); }
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(11011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  outside(ctx, rnd);
  condensation(ctx, rnd);
  frame(ctx);
  // brick floor down the middle aisle, herringbone, damp
  fill(ctx, [P([-HALF, 0, 1.2]), P([HALF, 0, 1.2]), P([HALF, 0, 22]), P([-HALF, 0, 22])], '#4a3428');
  for (let z = 1.2; z < 22; z += .22) { ctx.strokeStyle = 'rgba(20,12,8,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...P([-HALF, 0, z])); ctx.lineTo(...P([HALF, 0, z])); ctx.stroke(); }
  bench(ctx, rnd, -1); bench(ctx, rnd, 1);
  // a watering can on the floor
  const wc = P([.5, 0, 3.2]), k = cam.focal / 3.2;
  fill(ctx, [[wc[0] - .18 * k, wc[1]], [wc[0] + .18 * k, wc[1]], [wc[0] + .16 * k, wc[1] - .24 * k], [wc[0] - .16 * k, wc[1] - .24 * k]], '#5a6a6a');
  ctx.strokeStyle = '#5a6a6a'; ctx.lineWidth = .03 * k; ctx.beginPath(); ctx.moveTo(wc[0] + .16 * k, wc[1] - .1 * k); ctx.lineTo(wc[0] + .4 * k, wc[1] - .3 * k); ctx.stroke();
  paint.applyTexture(ctx, make, 1101, .32, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.8, .84, .9], lights: [{ x: 960, y: 560, rx: 900, ry: 500, power: .2, color: [1, 1, 1.05] }] })(ctx);
  const runs = Array.from({ length: 10 }, () => ({ x: rnd() * W, y: rnd() * 200, offset: rnd(), len: 200 + rnd() * 300 }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // drops running down the glass, each clearing a trail behind it
    for (const r of runs) {
      const t = (phase + r.offset) % 1, y = r.y + t * r.len;
      target.strokeStyle = 'rgba(120,140,160,.25)'; target.lineWidth = 3;
      target.beginPath(); target.moveTo(r.x, r.y); target.lineTo(r.x + Math.sin(t * 6) * 2, y); target.stroke();
      target.fillStyle = 'rgba(240,244,248,.8)'; target.beginPath(); target.arc(r.x + Math.sin(t * 6) * 2, y, 3, 0, TAU); target.fill();
    }
  };
}

module.exports = {
  title: '유리 온실에 맺힌 새벽 이슬',
  slug: 'glasshouse-before-dawn',
  sound: 'drips',
  createScene,
};
