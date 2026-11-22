'use strict';

// 71 · 막차가 떠난 버스 정류장
// A rainy street at two in the morning, the last bus just gone. In the foreground at the right a bus shelter:
// a thin steel frame, glass panels running with water, an advertising light box glowing cold white, a
// slatted bench, a timetable. Across the wet road a row of three old shop houses with shutters down, their
// rooflines sagging with age, a single upstairs window still lit. A sodium streetlamp hangs over the kerb.
// Everything glistens: the asphalt holds long wavering reflections of every light, rain falls slanted and
// rings open in the puddles; far down the street the bus's red tail lights shrink away into the rain.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, v3 } = paint;


const cam = camera({ x: -.6, y: 1.6, z: 0, yaw: -.1, pitch: -.04, focal: 1000, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(-.1) * 1e6, 1.6, Math.cos(-.1) * 1e6])[1];
const ROAD = { near: 1, far: 140, kerbL: -9, kerbR: 2.2 };   // the road runs along +z
const LAMP = [2.6, 5.6, 16];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// A shop house facing the road (+x normal), its front along z from z0 to z1, set back at x; the eaves and
// ridge sag in the middle; plaster walls with stains, a shutter, upstairs windows.
function shopHouse(ctx, rnd, { x, z0, z1, eaves, ridge, tone, litWindow, sign }) {
  const len = z1 - z0, sag = .12 + rnd() * .14;
  const front = (u, v) => P([x + .03 * Math.sin(u * 7 + z0), lerp(eaves - sag * Math.sin(Math.PI * u), 0, v), z0 + u * len]);
  fill(ctx, paint.outline(front, 16), shade(tone.map(c => c * .62), 0));
  // plaster: blotchy patches and rain streaks running down from the eaves
  ctx.save(); pathOf(ctx, paint.outline(front, 16)); ctx.clip();
  for (let i = 0; i < 70; i++) { const p = front(rnd(), rnd()); glow(ctx, p[0], p[1], 20 + rnd() * 60, 10 + rnd() * 40, rnd() < .5 ? '0,0,0' : '200,200,190', .05 + rnd() * .06); }
  for (let i = 0; i < 40; i++) { const u = rnd(), a = front(u, 0), b = front(u, .2 + rnd() * .5); ctx.strokeStyle = `rgba(10,10,14,${.08 + rnd() * .12})`; ctx.lineWidth = 1 + rnd() * 3; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(b[0] + (rnd() - .5) * 3, b[1]); ctx.stroke(); }
  ctx.restore();
  // the roof slope going back from the eaves to the ridge (seen from below at this distance: a thin band)
  const roof = (u, v) => P([lerp(x - 3.2, x + .35, v), lerp(ridge - sag * 1.4 * Math.sin(Math.PI * u), eaves - sag * Math.sin(Math.PI * u) + .02, v), z0 - .2 + u * (len + .4)]);
  paint.shingles(ctx, roof, rnd, { rows: 7, cols: Math.round(len * 3), base: shade(tone, -60).match(/\d+/g).map(Number), moss: [44, 50, 40], mossAt: .8, seed: z0 });
  // gutter under the eaves
  ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = 4; ctx.beginPath();
  for (let i = 0; i <= 12; i++) { const p = front(i / 12, -.01); i ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke();
  // the shop front: a rolled-down shutter between two piers, a sign board above
  const sh = (u, v) => P([x + .06, lerp(2.6, 0, v), z0 + lerp(.12, .88, u) * len]);
  fill(ctx, paint.outline(sh, 4), '#3a3c42');
  for (let r = 0; r < 26; r++) { const a = sh(0, r / 26), b = sh(1, r / 26); ctx.strokeStyle = r % 2 ? 'rgba(0,0,0,.35)' : 'rgba(200,210,220,.08)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  const sb = (u, v) => P([x + .1, lerp(3.4, 2.75, v), z0 + lerp(.08, .92, u) * len]);
  fill(ctx, paint.outline(sb, 4), sign);
  for (let l = 0; l < 3; l++) { const a = sb(.2 + l * .22, .35), b = sb(.34 + l * .22, .65); ctx.fillStyle = 'rgba(240,236,220,.55)'; ctx.fillRect(Math.min(a[0], b[0]), a[1], Math.abs(b[0] - a[0]), b[1] - a[1]); }
  // upstairs windows: deep reveals, one of them lit behind a curtain
  const wins = [];
  for (const u0 of [.18, .6]) {
    const wq = (u, v) => P([x + .02, lerp(eaves - .7 - sag * Math.sin(Math.PI * (u0 + .1)), 4.1, v), z0 + (u0 + u * .22) * len]);
    const poly = paint.outline(wq, 4), on = litWindow === u0;
    fill(ctx, poly.map(([px, py]) => [px, py]), on ? '#e8a858' : '#141820');
    if (on) { const c = wq(.5, .5); glow(ctx, c[0], c[1], 60, 50, '255,190,120', .5); fill(ctx, paint.outline((u, v) => wq(u * .45, v), 4), 'rgba(160,80,50,.55)'); }
    ctx.strokeStyle = '#2a2826'; ctx.lineWidth = 3; pathOf(ctx, poly); ctx.stroke();
    const m0 = wq(.5, 0), m1 = wq(.5, 1); ctx.beginPath(); ctx.moveTo(...m0); ctx.lineTo(...m1); ctx.stroke();
    const sill = [wq(-.08, 1.02), wq(1.08, 1.02)]; ctx.strokeStyle = '#8a8680'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(...sill[0]); ctx.lineTo(...sill[1]); ctx.stroke();
    if (on) wins.push(wq(.5, .5));
  }
  return wins;
}

function street(ctx, rnd) {
  ctx.fillStyle = '#1c1e26'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#0a0c14'], [1, '#1e2230']]); ctx.fillRect(0, 0, W, HORIZON + 2);
  glow(ctx, 600, HORIZON, 900, 200, '120,90,70', .2);
  // far blocks dissolving into the rain
  for (let i = 0; i < 14; i++) { const z = 50 + i * 7, b = P([-12, 0, z]), t = P([-12, 8 + rnd() * 10, z]), b2 = P([-12, 0, z + 7]); fill(ctx, [[b[0], b[1]], [b2[0], b2[1]], [b2[0], t[1]], [b[0], t[1]]], shade([30, 32, 42], i)); if (rnd() < .4) glow(ctx, lerp(b[0], b2[0], .5), lerp(t[1], b[1], .4), 6, 6, '255,200,140', .6); }
  // asphalt: dark, sheened toward the lights, with the far pavement opposite
  fill(ctx, [P([ROAD.kerbL, 0, ROAD.near]), P([ROAD.kerbR, 0, ROAD.near]), P([ROAD.kerbR, 0, ROAD.far]), P([ROAD.kerbL, 0, ROAD.far])], vertical(ctx, HORIZON, H, [[0, '#2a2a30'], [1, '#121216']]));
  fill(ctx, [P([ROAD.kerbL - 3, 0, 4]), P([ROAD.kerbL, 0, 4]), P([ROAD.kerbL, 0, ROAD.far]), P([ROAD.kerbL - 3, 0, ROAD.far])], '#2a2a2e');
  fill(ctx, [P([ROAD.kerbR, .14, ROAD.near]), P([ROAD.kerbR + 6, .14, ROAD.near]), P([ROAD.kerbR + 6, .14, ROAD.far]), P([ROAD.kerbR, .14, ROAD.far])], '#222024');
  fill(ctx, [P([ROAD.kerbR, .14, ROAD.near]), P([ROAD.kerbR, .14, ROAD.far]), P([ROAD.kerbR, 0, ROAD.far]), P([ROAD.kerbR, 0, ROAD.near])], '#4a4848');
  // paving slabs on our pavement
  for (let z = 1; z < 40; z += .9) { ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...P([ROAD.kerbR, .14, z])); ctx.lineTo(...P([ROAD.kerbR + 6, .14, z])); ctx.stroke(); }
  // lane markings, broken and worn
  for (let z = 3; z < 120; z += 6) { const a = P([-3.4, 0, z]), b = P([-3.3, 0, z + 3]), c = P([-3.2, 0, z + 3]), d = P([-3.3, 0, z]); fill(ctx, [a, b, c, d], 'rgba(200,196,180,.35)'); }
  // three shop houses opposite
  const lit = [];
  let z = 6;
  [[[118, 110, 98], .6, '#6a2a22'], [[96, 104, 108], null, '#2a4a5a'], [[124, 112, 90], null, '#3a3a2a'], [[100, 96, 102], .18, '#5a4a22']].forEach(([tone, l, sign], i) => {
    const len = 6.5 + rnd() * 2;
    lit.push(...shopHouse(ctx, rnd, { x: ROAD.kerbL - 3, z0: z, z1: z + len, eaves: 6.4 + (i % 2) * .8, ridge: 8.4 + (i % 2), tone, litWindow: l, sign }));
    z += len + .15;
  });
  return lit;
}

// The shelter, close at the right: posts, roof, glass panels, light box, bench.
function shelter(ctx, rnd) {
  const x0 = 2.8, x1 = 4.3, z0 = 5.5, z1 = 10, top = 2.5;
  const back = (u, v) => P([x1, lerp(top, .1, v), lerp(z0, z1, u)]);
  fill(ctx, paint.outline(back, 4), 'rgba(90,110,130,.22)');
  // light box on the near end panel, facing the road
  const box = (u, v) => P([lerp(x0 + .15, x1 - .1, u), lerp(2.15, .35, v), z0]);
  fill(ctx, paint.outline(box, 4), vertical(ctx, box(0, 0)[1], box(0, 1)[1], [[0, '#d8e4ee'], [1, '#b8c8d8']]));
  // the poster inside it: an abstract seaside ad, sun and stripes
  ctx.save(); pathOf(ctx, paint.outline((u, v) => box(.08 + u * .84, .06 + v * .88), 4)); ctx.clip();
  const c = box(.5, .5);
  ctx.fillStyle = '#5a9ac8'; ctx.fillRect(c[0] - 300, c[1] - 400, 600, 800);
  ctx.fillStyle = '#f0c060'; ctx.beginPath(); ctx.arc(c[0] - 20, c[1] - 120, 70, 0, TAU); ctx.fill();
  for (let s = 0; s < 4; s++) { ctx.fillStyle = s % 2 ? '#e8eef2' : '#3a7aa8'; ctx.fillRect(c[0] - 300, c[1] + 40 + s * 40, 600, 40); }
  ctx.restore();
  const roof = [P([x0 - .3, top, z0 - .2]), P([x1 + .2, top + .1, z0 - .2]), P([x1 + .2, top + .1, z1 + .2]), P([x0 - .3, top, z1 + .2])];
  fill(ctx, roof, '#1e2026');
  fill(ctx, [roof[0], roof[1], P([x1 + .2, top - .06, z0 - .2]), P([x0 - .3, top - .1, z0 - .2])], '#3a3e46');
  for (const [px, pz] of [[x0, z0], [x1, z0], [x1, z1]]) { const a = P([px, 0, pz]), b = P([px, top, pz]), k = cam.focal / cam.project([px, 1, pz])[2]; ctx.strokeStyle = '#2a2e34'; ctx.lineWidth = .07 * k; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.strokeStyle = 'rgba(200,210,220,.25)'; ctx.lineWidth = .015 * k; ctx.beginPath(); ctx.moveTo(a[0] - .02 * k, a[1]); ctx.lineTo(b[0] - .02 * k, b[1]); ctx.stroke(); }
  // bench: slats on two legs, wet sheen
  for (let s = 0; s < 4; s++) { const y = .46 - s * .005, zz = lerp(z0 + .7, z1 - .4, 0); const a = P([x1 - .45 + s * .08, y, zz]), b = P([x1 - .45 + s * .08, y, z1 - .4]); ctx.strokeStyle = s % 2 ? '#6a4a30' : '#7a5838'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  for (const zz of [z0 + 1, z1 - .8]) { const a = P([x1 - .3, 0, zz]), b = P([x1 - .3, .45, zz]); ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // timetable on the back glass
  fill(ctx, paint.outline((u, v) => P([x1 - .02, lerp(1.7, 1.1, v), lerp(z0 + 2.6, z0 + 3.2, u)]), 4), '#e8e4d8');
  for (let r = 0; r < 8; r++) { const a = P([x1 - .03, 1.64 - r * .06, z0 + 2.65]), b = P([x1 - .03, 1.64 - r * .06, z0 + 3.1]); ctx.strokeStyle = 'rgba(30,30,40,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  return { box: box(.5, .5), glass: paint.outline(back, 4) };
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(71011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const lit = street(ctx, rnd);
  const s = shelter(ctx, rnd);
  // the lamp post on our kerb
  const foot = P([LAMP[0] - 1, .14, LAMP[2]]), head = P(LAMP), k = cam.focal / cam.project(LAMP)[2];
  ctx.strokeStyle = '#18181c'; ctx.lineWidth = .14 * k; ctx.beginPath(); ctx.moveTo(...foot); ctx.lineTo(foot[0], head[1] - .3 * k); ctx.quadraticCurveTo(foot[0], head[1] - .5 * k, head[0], head[1] - .3 * k); ctx.stroke();
  fill(ctx, [[head[0] - .4 * k, head[1] - .35 * k], [head[0] + .3 * k, head[1] - .35 * k], [head[0] + .2 * k, head[1]], [head[0] - .3 * k, head[1]]], '#22222a');
  paint.applyTexture(ctx, make, 7101, .36, 0, 0, W, H, true);
  const lights = [[head[0], head[1] + 6, '255,176,90', .9], [s.box[0], s.box[1], '200,220,240', .6], ...lit.map(p => [p[0], p[1], '255,190,120', .5])];
  paint.lighting(make, { skyline: HORIZON, ambient: [.42, .44, .56], lights: [paint.LIGHT.lamp(head[0], head[1] + 260, .4, 360, 380, [1.35, .95, .55]), paint.LIGHT.lamp(s.box[0], s.box[1], .3, 260, 300, [.8, .95, 1.15])] })(ctx);
  // reflections: each light drawn as a long vertical streak below its position on the wet road
  const refl = make(W, H), rc = refl.getContext('2d');
  const roadTop = P([ROAD.kerbL, 0, 60])[1];
  for (const [x, y, col, a] of lights) {
    const ground = Math.max(roadTop, y + (H - y) * .45);
    for (let i = 0; i < 18; i++) glow(rc, x, ground + i * 16, 16 - i * .4, 18, col, a * .25 * (1 - i / 18));
  }
  const rain = paint.particles(rnd, 340, { kind: 'rain', near: .2, slant: .12, speed: 1 });
  const rings = Array.from({ length: 22 }, () => ({ at: P([lerp(-8, 2, rnd()), 0, lerp(3, 14, rnd())]), offset: rnd(), turns: 3 + Math.floor(rnd() * 3) }));
  const drips = Array.from({ length: 26 }, () => ({ u: rnd(), v: rnd(), turns: 1 + Math.floor(rnd() * 2), len: 10 + rnd() * 30 }));
  const tail = [[-1.2, 0], [1.2, 0]];

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.beginPath(); target.rect(0, roadTop, W, H - roadTop); target.clip();
    target.globalCompositeOperation = 'lighter';
    paint.ripple(target, refl, roadTop, phase, { bands: 3, amp: .8, speed: 3 });
    target.restore();
    // the bus's tail lights receding twice a loop, fading in and out at the ends
    for (let b = 0; b < 2; b++) {
      const t = (phase * 2 + b * .5) % 1, z = lerp(22, 130, t * t), a = Math.sin(Math.PI * t);
      for (const [dx] of tail) { const p = P([-4.5 + dx, .9, z]); glow(target, p[0], p[1], 10, 6, '255,40,30', .9 * a); glow(target, p[0], p[1] + (H - p[1]) * .25, 4, 30, '255,40,30', .25 * a); }
    }
    for (const r of rings) { const t = (phase * r.turns + r.offset) % 1; target.strokeStyle = `rgba(200,206,220,${.35 * (1 - t) * Math.min(1, t * 12)})`; target.lineWidth = 1; target.beginPath(); target.ellipse(r.at[0], r.at[1], 4 + t * 26, 1 + t * 6, 0, 0, TAU); target.stroke(); }
    // water running down the shelter glass
    target.save(); pathOf(target, s.glass); target.clip();
    const xs = s.glass.map(p => p[0]), ys = s.glass.map(p => p[1]);
    for (const d of drips) { const x = lerp(Math.min(...xs), Math.max(...xs), d.u), y = lerp(Math.min(...ys) - 40, Math.max(...ys), (d.v + phase * d.turns) % 1); target.strokeStyle = 'rgba(200,220,240,.3)'; target.lineWidth = 1.5; target.beginPath(); target.moveTo(x, y); target.lineTo(x + 1, y + d.len); target.stroke(); }
    target.restore();
    rain.draw(target, phase, '190,200,220');
    glow(target, head[0], head[1] + 4, 40, 18, '255,200,120', .8);
  };
}

module.exports = {
  title: '막차가 떠난 버스 정류장',
  slug: 'after-the-last-bus',
  sound: 'rain-street',
  createScene,
};
