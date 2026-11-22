'use strict';

// 32 · 돌다리 밑으로 흐르는 밤 운하
// An old city canal after midnight, seen from water level. Tall houses of stone and stucco rise straight
// from the water on both sides, their foundations dark and weedy, a few windows lit high up. A humpbacked
// stone bridge crosses ahead, its arch and keystone picked out by two iron lamps at either end. Moored
// boats under tarpaulins line one bank. The water carries every light in long trembling columns, and the
// arch's reflection completes a full circle with the bridge.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, v3 } = paint;
const { add } = v3;

const cam = camera({ x: 0, y: 1.3, z: 0, yaw: 0, pitch: .04, focal: 1100, cx: 960, cy: 600 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const M = paint.mirrorOf(cam, 0);
const HORIZON = cam.project([0, 1.3, 1e6])[1];
const BRIDGE = 34, HALF = 7;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// The houses along one side: a run of facades, each its own height, colour and window rhythm.
function facades(ctx, rnd, Q, side, lit) {
  let z = 3;
  while (z < 90) {
    const w = 5 + rnd() * 5, h = 9 + rnd() * 8, x = side * HALF, tone = [[150, 130, 110], [120, 110, 100], [160, 140, 120], [110, 100, 96], [140, 120, 100]][Math.floor(rnd() * 5)];
    const face = (u, v) => Q([x, h * (1 - v), z + u * w]);
    const pts = paint.outline(face, 4);
    fill(ctx, pts, shade(tone.map(c => c * .28), (rnd() - .5) * 10));
    fill(ctx, [Q([x, 1.4, z]), Q([x, 1.4, z + w]), Q([x, 0, z + w]), Q([x, 0, z])], '#1a1e1a');
    const cols = Math.max(2, Math.round(w / 1.6)), rows = Math.floor((h - 2) / 2.6);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const u0 = (c + .3) / cols, u1 = (c + .7) / cols, y0 = 2.2 + r * 2.6, y1 = y0 + 1.5;
      const on = rnd() < .14;
      fill(ctx, [Q([x, y1, z + u0 * w]), Q([x, y1, z + u1 * w]), Q([x, y0, z + u1 * w]), Q([x, y0, z + u0 * w])], on ? '#f0c088' : '#141820');
      if (on) lit.push(Q([x, (y0 + y1) / 2, z + (u0 + u1) / 2 * w]));
    }
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...Q([x, 0, z + w])); ctx.lineTo(...Q([x, h, z + w])); ctx.stroke();
    z += w;
  }
}

// The bridge: an arch spanning the canal, voussoirs around the opening, a parapet on top.
function bridge(ctx, rnd, Q) {
  const rise = 4.2, deck = 5.4, arch = [];
  for (let i = 0; i <= 24; i++) { const a = Math.PI * (1 - i / 24); arch.push([Math.cos(a) * HALF * .85, Math.sin(a) * rise]); }
  const body = [Q([-HALF - 2, deck, BRIDGE]), Q([HALF + 2, deck, BRIDGE]), Q([HALF + 2, 0, BRIDGE]), ...arch.slice().reverse().map(([x, y]) => Q([x, y, BRIDGE])), Q([-HALF - 2, 0, BRIDGE])];
  fill(ctx, body, '#3a3834');
  for (let i = 0; i < 24; i++) {
    const a = arch[i], b = arch[i + 1], n = [a[0] / (HALF * .85), a[1] / rise];
    const q = [Q([a[0], a[1], BRIDGE - .01]), Q([b[0], b[1], BRIDGE - .01]), Q([b[0] * 1.14, b[1] * 1.14 + .2, BRIDGE - .01]), Q([a[0] * 1.14, a[1] * 1.14 + .2, BRIDGE - .01])];
    fill(ctx, q, shade([96, 90, 82], (rnd() - .5) * 20 + (i === 12 ? 20 : 0)));
    ctx.strokeStyle = 'rgba(10,10,10,.7)'; ctx.lineWidth = 1.2; pathOf(ctx, q); ctx.stroke();
    void n;
  }
  fill(ctx, [Q([-HALF - 2, deck + .9, BRIDGE]), Q([HALF + 2, deck + .9, BRIDGE]), Q([HALF + 2, deck, BRIDGE]), Q([-HALF - 2, deck, BRIDGE])], '#4a4640');
  return [Q([-HALF - 1.5, deck + 2.6, BRIDGE]), Q([HALF + 1.5, deck + 2.6, BRIDGE])];
}

function lamps(ctx, at) {
  for (const p of at) {
    const k = cam.focal / BRIDGE;
    ctx.strokeStyle = '#121214'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p[0], p[1] + 1.7 * k); ctx.lineTo(p[0], p[1] + .3 * k); ctx.stroke();
    fill(ctx, [[p[0] - .25 * k, p[1] + .3 * k], [p[0] + .25 * k, p[1] + .3 * k], [p[0] + .2 * k, p[1] - .3 * k], [p[0] - .2 * k, p[1] - .3 * k]], '#ffd898');
  }
}

function boats(ctx, Q) {
  for (let i = 0; i < 4; i++) {
    const z = 8 + i * 6.5, x = -HALF + 1.2;
    const hull = [Q([x - .9, .5, z]), Q([x + .9, .5, z]), Q([x + .9, .5, z + 5]), Q([x - .9, .5, z + 5])];
    fill(ctx, [Q([x + .9, .5, z]), Q([x + .9, .5, z + 5]), Q([x + .9, 0, z + 4.6]), Q([x + .9, 0, z + .4])], ['#3a4a5a', '#5a3a30', '#2a3a30', '#4a4a50'][i]);
    fill(ctx, hull, ['#4a6a7a', '#7a4a3a', '#3a5a44', '#5a5a64'][i]);
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(32011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#06080e'], [1, '#141a26']]);
  ctx.fillRect(0, 0, W, HORIZON + 2);
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#0e1218'], [1, '#04060a']]);
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  const lit = [];
  const refl = make(W, H), rc = refl.getContext('2d');
  for (const side of [-1, 1]) { facades(ctx, paint.seeded(3200 + side), P, side, lit); facades(rc, paint.seeded(3200 + side), M, side, []); }
  const lampAt = bridge(ctx, paint.seeded(3203), P); bridge(rc, paint.seeded(3203), M);
  boats(ctx, P); boats(rc, M);
  lamps(ctx, lampAt);
  rc.globalCompositeOperation = 'source-atop'; rc.fillStyle = 'rgba(4,8,14,.4)'; rc.fillRect(0, 0, W, H);
  paint.applyTexture(ctx, make, 3201, .32, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.6, .62, .7], lights: lampAt.map(p => paint.LIGHT.lamp(p[0], p[1] + 80, .7, 300, 360)) })(ctx);
  const lights = lit.concat(lampAt);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    paint.ripple(target, refl, HORIZON, phase, { amp: .9, bands: 3 });
    // every light trembles on the water as a broken column
    for (const l of lights) {
      const y0 = 2 * HORIZON - l[1];
      for (let i = 0; i < 16; i++) {
        const y = y0 + (i - 4) * 6, x = l[0] + Math.sin(TAU * (phase * 3 + i * .5 + l[0] * .01)) * (2 + i * .6);
        if (y < HORIZON || y > H) continue;
        target.fillStyle = `rgba(255,200,130,${.32 * (1 - Math.abs(i - 4) / 12)})`; target.fillRect(x - 5, y, 10, 2);
      }
    }
    for (const l of lampAt) glow(target, l[0], l[1], 60, 60, '255,210,150', .55);
  };
}

module.exports = {
  title: '돌다리 밑으로 흐르는 밤 운하',
  slug: 'old-stone-canal-after-midnight',
  sound: 'lake',
  createScene,
};
