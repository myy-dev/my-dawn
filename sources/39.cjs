'use strict';

// 39 · 강가 물레방앗간의 새벽 불빛
// A watermill on a river at dawn. The mill is a timber-framed house on a stone base, its overshot wheel
// turning on the river side, fed by a wooden flume; water spills off the buckets in sheets and the river
// races white below it. One upstairs window is lit where the miller is already up. Willows lean over the
// bank; the sky is turning pink behind the far trees and the river holds the colours. The wheel turns,
// the water falls and the lit window flickers.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, planks, v3 } = paint;
const { add, mul } = v3;

const cam = camera({ x: 0, y: 1.6, z: 0, yaw: .14, pitch: .03, focal: 1100, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const M = paint.mirrorOf(cam, 0);
const HORIZON = cam.project([0, 1.6, 1e6])[1];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// The mill, built in metres: the wheel's axle is at AX, the house stands behind it on the bank.
const T = .55, A = [Math.cos(T), 0, Math.sin(T)], B = [-Math.sin(T), 0, Math.cos(T)];
const O = [.6, .2, 14];
const AX = add(O, mul(A, 3), mul(B, -1.2), [0, 2.4, 0]);
const RADIUS = 2.6;

function mill(ctx, rnd, Q) {
  const at = (a, b, h) => Q(add(O, mul(A, a), mul(B, b), [0, h, 0]));
  // stone base, then the timber-framed walls above it
  paint.masonry(ctx, (u, v) => at(u * 8, 0, 1.8 * (1 - v) - .2), rnd, { courses: 4, length: [.06, .1], base: [100, 96, 90] });
  planks(ctx, (u, v) => at(u * 8, 0, 1.6 + 3.4 * (1 - v)), rnd, { along: 'v', width: [.025, .035], base: [110, 92, 74], vary: 18, streaks: 3 });
  for (const a of [0, 2.7, 5.3, 8]) { ctx.strokeStyle = '#2a1e18'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(...at(a, 0, 1.6)); ctx.lineTo(...at(a, 0, 5)); ctx.stroke(); }
  ctx.strokeStyle = '#2a1e18'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(...at(0, 0, 3.3)); ctx.lineTo(...at(8, 0, 3.3)); ctx.stroke();
  // the gable end facing the river
  const gab = [at(8, 0, 5), at(8, 5, 5), at(8, 5, 1.6), at(8, 0, 1.6)];
  fill(ctx, gab, '#5a4636');
  fill(ctx, [at(8, -.3, 5), at(8, 2.5, 7.4), at(8, 5.3, 5)], '#5a4636');
  // roof
  fill(ctx, [at(-.3, -.4, 5), at(8.3, -.4, 5), at(8.3, 2.5, 7.4), at(-.3, 2.5, 7.4)], '#3a3034');
  for (let r = 1; r < 8; r++) { const t = r / 8; ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...Q(v3.lerp(add(O, mul(A, -.3), mul(B, -.4), [0, 5, 0]), add(O, mul(A, -.3), mul(B, 2.5), [0, 7.4, 0]), t))); ctx.lineTo(...Q(v3.lerp(add(O, mul(A, 8.3), mul(B, -.4), [0, 5, 0]), add(O, mul(A, 8.3), mul(B, 2.5), [0, 7.4, 0]), t))); ctx.stroke(); }
  // windows: one upstairs lit
  const win = (a0, h0, lit) => { const q = [at(a0, 0, h0 + .9), at(a0 + .8, 0, h0 + .9), at(a0 + .8, 0, h0), at(a0, 0, h0)]; fill(ctx, q, lit ? '#f0b870' : '#1a1e26'); ctx.strokeStyle = '#2a1e18'; ctx.lineWidth = 3; pathOf(ctx, q); ctx.stroke(); };
  win(1.2, 2, false); win(4, 2, false); win(4, 3.7, true); win(6.4, 3.7, false);
  // the flume: a wooden trough on trestles bringing water to the top of the wheel
  const f0 = add(AX, mul(A, -6), [0, RADIUS + .3, 0]), f1 = add(AX, [0, RADIUS + .3, 0]);
  fill(ctx, [Q(f0), Q(f1), Q(add(f1, [0, -.4, 0])), Q(add(f0, [0, -.4, 0]))], '#4a3a2c');
  for (let i = 0; i < 3; i++) { const p = v3.lerp(f0, f1, i / 3); ctx.strokeStyle = '#3a2c22'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(...Q(add(p, [0, -.4, 0]))); ctx.lineTo(...Q([p[0], 0, p[2]])); ctx.stroke(); }
  return at(4.4, 0, 4.15);
}

// The overshot wheel at angle `a`: two rims, spokes, buckets between the rims.
function wheel(ctx, a, Q) {
  const rim = (r, off) => Array.from({ length: 33 }, (_, i) => { const t = i / 32 * TAU; return Q(add(AX, mul(A, Math.cos(t) * r), [0, Math.sin(t) * r, 0], mul(B, off))); });
  for (const off of [-.5, .5]) { ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 5; ctx.beginPath(); rim(RADIUS, off).forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke(); }
  for (let k = 0; k < 16; k++) {
    const t = a + k / 16 * TAU, c = Math.cos(t), s = Math.sin(t);
    const o = add(AX, mul(A, c * RADIUS), [0, s * RADIUS, 0]), i = add(AX, mul(A, c * (RADIUS - .45)), [0, s * (RADIUS - .45), 0]);
    fill(ctx, [Q(add(o, mul(B, -.5))), Q(add(o, mul(B, .5))), Q(add(i, mul(B, .5))), Q(add(i, mul(B, -.5)))], k % 2 ? '#5a4232' : '#4a3628');
    if (k % 4 === 0) { ctx.strokeStyle = '#2a1e16'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...Q(AX)); ctx.lineTo(...Q(o)); ctx.stroke(); }
  }
  const hub = Q(AX); ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.arc(hub[0], hub[1], 10, 0, TAU); ctx.fill();
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(39011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#2a3456'], [.6, '#8a7290'], [1, '#e4a68c']]);
  ctx.fillRect(0, 0, W, HORIZON + 2);
  glow(ctx, 600, HORIZON, 600, 150, '255,200,160', .35);
  paint.ridgeline(ctx, HORIZON + 3, 70, [44, 48, 56], 391, [[240, 1], [50, .6], [12, .4], [4, .2]], HORIZON + 10);
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#a48294'], [.3, '#3a3a4a'], [1, '#0e1218']]);
  ctx.fillRect(0, HORIZON, W, H);
  const refl = make(W, H), rc = refl.getContext('2d');
  rc.save(); rc.translate(0, HORIZON * 2); rc.scale(1, -1); rc.drawImage(plate, 0, 0, W, HORIZON, 0, 0, W, HORIZON); rc.restore();
  // the bank under the mill and willows on it
  fill(ctx, [P([-30, .3, 30]), P([30, .3, 20]), P([30, 0, 20]), P([-30, 0, 30])], '#2a2c22');
  for (let w = 0; w < 3; w++) {
    const b = P([-12 + w * 5, .3, 26 + w * 2]), k = cam.focal / (26 + w * 2);
    // a willow: a short leaning trunk under a crown of long hanging switches
    // a willow: a thick leaning trunk forking into arching limbs, and curtains of switches hanging from them almost to the water
    ctx.strokeStyle = '#1e1a16'; ctx.lineCap = 'round'; ctx.lineWidth = .6 * k; ctx.beginPath(); ctx.moveTo(...b); ctx.quadraticCurveTo(b[0] + .6 * k, b[1] - 2.4 * k, b[0] + 1.2 * k, b[1] - 4.6 * k); ctx.stroke();
    const top = [b[0] + 1.2 * k, b[1] - 4.6 * k];
    for (let l = 0; l < 7; l++) {
      const dir = (l / 6 - .5) * 2.4, reach = (3.4 + rnd() * 1.8) * k, tip = [top[0] + Math.sin(dir) * reach * 1.3, top[1] - Math.cos(dir * .6) * reach * .7];
      ctx.lineWidth = .18 * k; ctx.beginPath(); ctx.moveTo(...top); ctx.quadraticCurveTo(top[0] + Math.sin(dir) * reach * .5, top[1] - reach, ...tip); ctx.stroke();
      for (let s2 = 0; s2 < 40; s2++) {
        const t = rnd(), sx = lerp(top[0], tip[0], t) + (rnd() - .5) * .3 * k, sy = lerp(top[1] - reach * .6 * Math.sin(Math.PI * t), tip[1], t), len = (2.6 + rnd() * 2.4) * k;
        ctx.strokeStyle = `rgba(${44 + rnd() * 20},${62 + rnd() * 20},${40 + rnd() * 12},.75)`; ctx.lineWidth = 1.2 + rnd(); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + Math.sin(dir) * 6, sy + len * .5, sx + Math.sin(dir) * 10, sy + len); ctx.stroke();
      }
    }
  }
  // the mill goes on its own layer, laid over the rippling water so the water never covers its base
  const front = make(W, H), fc = front.getContext('2d');
  const lit = mill(fc, paint.seeded(3902), P);
  mill(rc, paint.seeded(3902), M);
  rc.globalCompositeOperation = 'source-atop'; rc.fillStyle = 'rgba(10,12,20,.4)'; rc.fillRect(0, 0, W, H);
  paint.applyTexture(ctx, make, 3901, .32, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.72, .7, .8], lights: [paint.LIGHT.lamp(lit[0], lit[1] + 40, .4, 240, 220)] })(ctx);
  const spill = P(add(AX, mul(A, RADIUS * .7), [0, -RADIUS * .7, 0])), foot = P(add(AX, mul(A, RADIUS * .6), [0, -RADIUS - .4, 0]));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    paint.ripple(target, refl, HORIZON, phase, { amp: 1.4, bands: 3 });
    target.drawImage(front, 0, 0);
    // the wheel turns a whole number of bucket spacings per loop, so the loop is seamless
    target.save(); target.beginPath(); target.rect(0, HORIZON, W, H - HORIZON); target.clip(); target.globalAlpha = .45; wheel(target, -phase * TAU / 16 * 8, M); target.restore();
    wheel(target, -phase * TAU / 16 * 8, P);           // eight buckets per loop keeps the spokes (every fourth) aligned
    // water spilling from the buckets on the down side and churning white at the wheel's foot
    for (let i = 0; i < 20; i++) {
      const t = (phase * 5 + i / 20) % 1, x = spill[0] + (i % 5 - 2) * 8 + t * 20, y = lerp(spill[1], foot[1], t);
      target.fillStyle = `rgba(226,232,244,${.6 * (1 - t * .6)})`; target.fillRect(x, y, 3, 10);
    }
    for (let i = 0; i < 10; i++) {
      const age = (phase * 3 + i / 10) % 1;
      glow(target, foot[0] + (i - 5) * 14 + age * 120, foot[1] + age * 30, 30 + age * 40, 8, '226,232,244', .3 * (1 - age));
    }
    glow(target, lit[0], lit[1], 50, 40, '255,190,120', .3 + .05 * paint.loopNoise(phase, 4, 8));
  };
}

module.exports = {
  title: '강가 물레방앗간의 새벽 불빛',
  slug: 'lamplit-watermill-before-dawn',
  sound: 'lake',
  createScene,
};
