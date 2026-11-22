'use strict';

// 82 · 텅 빈 활주로의 푸른 점등
// A small airfield before dawn, empty. Low across the frame runs the runway, a broad strip of dark
// tarmac with its white centre line and threshold bars, edged by rows of lights: blue along the taxiway,
// white along the runway, green at the threshold, red beyond the far end, all shrinking into the distance
// and the flat land beyond. A windsock on its mast swings and fills in the wind. The control tower's
// lit cab stands off to one side, a beacon on top sweeping its beam round. The sky's lower edge pales.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, camera } = paint;

const cam = camera({ x: -24, y: 2.2, z: 0, yaw: .16, pitch: .02, focal: 1000, cx: 960, cy: 520 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(.16) * 1e6, 2.2, Math.cos(.16) * 1e6])[1];
const RW = { x0: -15, x1: 15, z0: 20, z1: 1800 };          // runway runs along +z, 30 m wide

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function field(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#0a0e1e'], [.7, '#22304a'], [1, '#6a6a80']]); ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 120, HORIZON * .8);
  glow(ctx, 1500, HORIZON, 900, 120, '200,170,170', .25);
  // the flat grass, darker near us
  fill(ctx, [[0, HORIZON], [W, HORIZON], [W, H], [0, H]], vertical(ctx, HORIZON, H, [[0, '#2a3036'], [1, '#121618']]));
  for (let i = 0; i < 2000; i++) { const z = 8 + rnd() ** 2 * 400, x = -14 + (rnd() - .5) * z * 2.4, p = P([x, 0, z]); if (p[1] < HORIZON) continue; ctx.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '90,110,96'},.18)`; ctx.fillRect(p[0], p[1], Math.max(1, 600 / z), 1); }
  // runway and the taxiway beside it
  fill(ctx, [P([RW.x0, 0, RW.z0]), P([RW.x1, 0, RW.z0]), P([RW.x1, 0, RW.z1]), P([RW.x0, 0, RW.z1])], '#1a1c22');
  fill(ctx, [P([-40, 0, 6]), P([-30, 0, 6]), P([-30, 0, 900]), P([-40, 0, 900])], '#1c1e24');
  // markings: threshold piano keys, the centre line dashes, the aiming blocks
  for (let i = 0; i < 12; i++) { const x = RW.x0 + 1.5 + i * 2.3 + (i > 5 ? 3 : 0); fill(ctx, [P([x, 0, RW.z0 + 6]), P([x + 1.6, 0, RW.z0 + 6]), P([x + 1.6, 0, RW.z0 + 36]), P([x, 0, RW.z0 + 36])], 'rgba(200,200,196,.55)'); }
  for (let z = RW.z0 + 60; z < RW.z1; z += 60) fill(ctx, [P([-.45, 0, z]), P([.45, 0, z]), P([.45, 0, z + 30]), P([-.45, 0, z + 30])], 'rgba(200,200,196,.45)');
  for (const x of [-9, 6]) fill(ctx, [P([x, 0, RW.z0 + 300]), P([x + 3, 0, RW.z0 + 300]), P([x + 3, 0, RW.z0 + 360]), P([x, 0, RW.z0 + 360])], 'rgba(200,200,196,.4)');
  // tyre marks near the touchdown zone
  for (let i = 0; i < 30; i++) { const x = (rnd() - .5) * 8, z = RW.z0 + 280 + rnd() * 300; ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...P([x, 0, z])); ctx.lineTo(...P([x + .2, 0, z + 40 + rnd() * 60])); ctx.stroke(); }
  // a distant hangar and the tower
  paint.box(ctx, cam, { at: [80, 0, 420], sa: 30, sb: 20, h: 14 }, n => (n === 'top' ? '#3a3e48' : '#22262e'));
  const tw = [60, 0, 160];
  paint.box(ctx, cam, { at: tw, sa: 2.5, sb: 2.5, h: 22 }, n => (n === 'left' ? '#2a2e36' : '#1e222a'));
  const cab = paint.box(ctx, cam, { at: [tw[0], 22, tw[2]], sa: 4, sb: 4, h: 3.4 }, () => '#e8d8a0');
  paint.box(ctx, cam, { at: [tw[0], 25.4, tw[2]], sa: 4.6, sb: 4.6, h: .6 }, n => (n === 'top' ? '#2a2e36' : '#1a1e24'));
  for (const name in cab) { const q = cab[name]; for (let m = 1; m < 4; m++) { ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lerp(q[0][0], q[1][0], m / 4), q[0][1]); ctx.lineTo(lerp(q[3][0], q[2][0], m / 4), q[3][1]); ctx.stroke(); } }
  return { beacon: P([tw[0], 27, tw[2]]), cab: P([tw[0], 23.7, tw[2]]) };
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(82011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const f = field(ctx, rnd);
  paint.applyTexture(ctx, make, 8201, .32, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.6, .64, .8], lights: [paint.LIGHT.lamp(f.cab[0], f.cab[1], .4, 120, 100, [1.3, 1.1, .7])] })(ctx);
  // light rows
  const rows = [];
  for (let z = RW.z0; z < RW.z1; z += 60) { rows.push([RW.x0 - 1, z, '235,240,255']); rows.push([RW.x1 + 1, z, '235,240,255']); }
  for (let z = 10; z < 900; z += 30) rows.push([-29, z, '80,140,255'], [-41, z, '80,140,255']);
  for (let x = RW.x0; x <= RW.x1; x += 2.5) rows.push([x, RW.z0 - 1, '80,255,140'], [x, RW.z1, '255,60,50']);
  const lights = rows.map(([x, z, c]) => { const p = P([x, .3, z]); return { p, c, k: cam.focal / cam.project([x, .3, z])[2], z }; }).filter(l => l.p[1] >= HORIZON - 2);
  const sock = { base: P([-24, 0, 40]), top: P([-24, 6, 40]), k: cam.focal / cam.project([-24, 6, 40])[2] };

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // runway lights: a gentle shimmer through the low air, brighter close up
    for (const l of lights) { const tw = .8 + .2 * Math.sin(TAU * (phase * 3 + l.z * .013)); const r = Math.max(2.6, .4 * l.k); glow(target, l.p[0], l.p[1], r * 4, r * 2.5, l.c, .75 * tw); glow(target, l.p[0], l.p[1], r * .8, r * .8, '255,255,255', .9 * tw); }
    // the beacon on the tower: a beam sweeping round twice a loop, flashing when it faces us
    const a = TAU * phase * 2, facing = Math.max(0, Math.cos(a)) ** 6;
    glow(target, f.beacon[0], f.beacon[1], 10 + 50 * facing, 10 + 50 * facing, Math.floor(phase * 2 + .5) % 2 ? '120,255,160' : '255,255,240', .3 + .7 * facing);
    target.save(); target.globalCompositeOperation = 'lighter';
    const dx = Math.sin(a) * 900, dy = -Math.abs(Math.cos(a)) * 30 - 10;
    const g = target.createLinearGradient(f.beacon[0], f.beacon[1], f.beacon[0] + dx, f.beacon[1] + dy);
    g.addColorStop(0, `rgba(220,240,230,${.18 * (1 - facing)})`); g.addColorStop(1, 'rgba(220,240,230,0)');
    target.fillStyle = g; target.beginPath(); target.moveTo(...f.beacon); target.lineTo(f.beacon[0] + dx, f.beacon[1] + dy - 40); target.lineTo(f.beacon[0] + dx, f.beacon[1] + dy + 40); target.fill();
    target.restore();
    // the windsock: a striped cone swinging and filling with the gusts
    const fillAmt = .65 + .3 * Math.sin(TAU * phase * 2) + .05 * Math.sin(TAU * phase * 9), sw = .5 + .3 * Math.sin(TAU * phase + 1);
    target.strokeStyle = '#18181c'; target.lineWidth = 3; target.beginPath(); target.moveTo(...sock.base); target.lineTo(...sock.top); target.stroke();
    const L = 4 * sock.k, droop = (1 - fillAmt) * 1.2;
    for (let seg = 0; seg < 5; seg++) {
      const t0 = seg / 5, t1 = (seg + 1) / 5, r0 = lerp(.45, .2, t0) * sock.k, r1 = lerp(.45, .2, t1) * sock.k;
      const pt = t => [sock.top[0] + Math.cos(sw) * L * t, sock.top[1] + Math.sin(sw * .3) * L * t * .2 + droop * (t * t) * L];
      const a0 = pt(t0), a1 = pt(t1);
      fill(target, [[a0[0], a0[1] - r0], [a1[0], a1[1] - r1 * fillAmt], [a1[0], a1[1] + r1 * fillAmt], [a0[0], a0[1] + r0]], seg % 2 ? '#e8e4dc' : '#d8602a');
    }
  };
}

module.exports = {
  title: '텅 빈 활주로의 푸른 점등',
  slug: 'blue-lights-on-an-empty-runway',
  sound: 'gust',
  createScene,
};
