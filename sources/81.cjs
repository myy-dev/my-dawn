'use strict';

// 81 · 언덕을 오르는 막차 전차
// A steep cobbled street climbing a hill at night, tram rails set into the stones and an overhead wire
// strung from poles. The last tram, a small two-tone car glowing from within, has passed us and is grinding
// up the hill away from us, its windows a warm yellow box, a spark crackling now and then where its pole
// meets the wire. Narrow tall houses with shuttered windows step up both sides, their facades leaning
// slightly with age, iron balconies, lamps on brackets. At the top, the sky lightens a little behind roofs.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: 0, y: 1.6, z: 0, yaw: 0, pitch: -.12, focal: 1000, cx: 960, cy: 600 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const SLOPE = .26, HALF = 5;
const groundY = z => Math.max(0, z - 2) * SLOPE;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// A tall narrow house on side s (±1), front from z0 to z1, its base following the slope. Leans by `lean`.
function house(ctx, rnd, s, z0, z1, floors, tone, lamps) {
  const hgt = floors * 3 + 1, x = s * HALF;
  const f = (u, v) => { const z = lerp(z0, z1, u), y = lerp(groundY(z0) + hgt, groundY(z), v); return P([x + s * (1 - v) * .25 * Math.sin(z0) + s * .05 * Math.sin(u * 9), y, z]); };
  fill(ctx, paint.outline(f, 10), shade(tone, 0));
  ctx.save(); pathOf(ctx, paint.outline(f, 10)); ctx.clip();
  for (let i = 0; i < 40; i++) { const p = f(rnd(), rnd()); glow(ctx, p[0], p[1], 20 + rnd() * 60, 20 + rnd() * 50, rnd() < .5 ? '0,0,0' : '255,240,220', .06); }
  ctx.restore();
  fill(ctx, paint.outline(f, 10), 'rgba(12,14,28,.4)');
  // cornice at the top: a ledge that catches the sky
  const c0 = f(0, 0), c1 = f(1, 0); ctx.strokeStyle = shade(tone, 30); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(...c0); ctx.lineTo(...c1); ctx.stroke();
  // windows with shutters, a balcony on the first floor
  for (let fl = 0; fl < floors; fl++) {
    const v0 = (1 + fl * 3) / hgt, n = Math.max(1, Math.round((z1 - z0) / 2.2));
    for (let w = 0; w < n; w++) {
      const u0 = (w + .3) / n, u1 = (w + .7) / n, vt = 1 - v0 - 2 / hgt, vb = 1 - v0 - .4 / hgt;
      const q = [f(u0, vt), f(u1, vt), f(u1, vb), f(u0, vb)], lit = rnd() < .12;
      fill(ctx, q, lit ? '#e0a060' : '#14161e');
      if (lit) glow(ctx, (q[0][0] + q[1][0]) / 2, (q[0][1] + q[2][1]) / 2, 40, 40, '255,180,110', .4);
      else { fill(ctx, [q[0], f(lerp(u0, u1, .5), vt), f(lerp(u0, u1, .5), vb), q[3]], shade([60, 80, 70], (rnd() - .5) * 20)); fill(ctx, [f(lerp(u0, u1, .5), vt), q[1], q[2], f(lerp(u0, u1, .5), vb)], shade([60, 80, 70], (rnd() - .5) * 20 - 8)); }
      if (fl === 1) { const a = f(u0 - .05, vb), b = f(u1 + .05, vb); ctx.strokeStyle = '#141418'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.moveTo(a[0], a[1] - 18); ctx.lineTo(b[0], b[1] - 18); ctx.stroke(); for (let r = 0; r <= 6; r++) { const p = [lerp(a[0], b[0], r / 6), lerp(a[1], b[1], r / 6)]; ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(p[0], p[1] - 18); ctx.stroke(); } }
    }
  }
  if (lamps) { const p = f(.5, 1 - 3.4 / hgt), k = cam.focal / cam.project([x, 3, (z0 + z1) / 2])[2]; ctx.strokeStyle = '#141418'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(p[0] - s * .4 * k, p[1]); ctx.stroke(); lamps.push([p[0] - s * .4 * k, p[1] + 6, k]); }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(81011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.fillStyle = vertical(ctx, 0, 600, [[0, '#0a0c18'], [1, '#3a3850']]); ctx.fillRect(0, 0, W, H);
  const topZ = 70, crest = P([0, groundY(topZ), topZ]);
  glow(ctx, crest[0], crest[1], 600, 200, '150,130,150', .3);
  // the street: cobbles in arcs, rails set in them
  const st = (u, v) => P([lerp(-HALF, HALF, u), groundY(lerp(topZ, 1, v)), lerp(topZ, 1, v)]);
  fill(ctx, paint.outline(st, 16), vertical(ctx, crest[1], H, [[0, '#3a3a44'], [1, '#1e1e24']]));
  for (let z = 1.2; z < 40; z += .18) {
    const k = cam.focal / cam.project([0, groundY(z), z])[2];
    for (let x = -HALF; x < HALF; x += .2) { const p = P([x + (Math.round(z / .18) % 2) * .1, groundY(z), z]); ctx.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '200,190,180'},${.08 + rnd() * .06})`; ctx.beginPath(); ctx.ellipse(p[0], p[1], .09 * k, .035 * k, 0, 0, TAU); ctx.fill(); }
  }
  for (const x of [-.72, .72]) { ctx.strokeStyle = 'rgba(200,200,210,.5)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const z = 1 + (topZ - 1) * (i / 40) ** 1.6; const p = P([x, groundY(z) + .01, z]); i ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke(); }
  // houses climbing both sides, far first
  const lamps = [];
  for (const s of [-1, 1]) {
    const list = []; let z = 1;
    while (z < topZ) { const len = 4 + rnd() * 3; list.push([z, z + len]); z += len + .1; }
    list.reverse().forEach(([z0, z1], i) => house(ctx, rnd, s, z0, z1, 3 + Math.floor(rnd() * 2), [[140, 120, 100], [110, 116, 120], [150, 130, 120], [120, 110, 90]][(i + (s > 0 ? 1 : 0)) % 4].map(c => c * .7), i % 3 === 1 ? lamps : null));
  }
  // poles and the overhead wire
  const wire = []; for (let i = 0; i <= 40; i++) { const z = 1 + (topZ - 1) * (i / 40) ** 1.6; wire.push(P([0, groundY(z) + 5.6, z])); }
  for (let z = 6; z < topZ; z += 10) { const a = P([HALF - .4, groundY(z), z]), b = P([HALF - .4, groundY(z) + 6.2, z]), c = P([0, groundY(z) + 5.7, z]), k = cam.focal / cam.project([0, 3, z])[2]; ctx.strokeStyle = '#141418'; ctx.lineWidth = Math.max(1.5, .14 * k); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(...b); ctx.lineTo(...c); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(20,20,26,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); wire.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  paint.applyTexture(ctx, make, 8101, .36, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.5, .52, .66], lights: lamps.map(([x, y, k]) => paint.LIGHT.lamp(x, y + 1.5 * k, .45, 2 * k, 2.4 * k, [1.3, 1, .65])) })(ctx);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const [x, y] of lamps) glow(target, x, y, 16, 10, '255,210,150', .8);
    // the tram: climbs from just ahead of us to the crest and over it, fading, then a new run begins
    const t = phase, z = lerp(9, topZ + 4, t ** .8), alpha = Math.min(1, (1 - t) * 6) * Math.min(1, t * 20);
    const y = groundY(z), back = [-1.2, 1.2].map(x => P([x, y + .3, z])), roof = [-1.2, 1.2].map(x => P([x, y + 3.1, z])), k = cam.focal / cam.project([0, y, z])[2];
    target.globalAlpha = alpha;
    // body: cream above, maroon below, the rear window and the destination box lit
    fill(target, [roof[0], roof[1], P([1.2, y + 1.6, z]), P([-1.2, y + 1.6, z])], '#c8c0a0');
    fill(target, [P([-1.2, y + 1.6, z]), P([1.2, y + 1.6, z]), back[1], back[0]], '#6a2a28');
    fill(target, [P([-.9, y + 2.8, z - .01]), P([.9, y + 2.8, z - .01]), P([.9, y + 1.8, z - .01]), P([-.9, y + 1.8, z - .01])], '#f0c070');
    glow(target, ...P([0, y + 2.3, z]), 1.4 * k, .8 * k, '255,200,120', .5);
    fill(target, [P([-.6, y + 3.05, z - .01]), P([.6, y + 3.05, z - .01]), P([.6, y + 2.85, z - .01]), P([-.6, y + 2.85, z - .01])], '#f8e8a8');
    for (const x of [-.9, .9]) glow(target, ...P([x, y + .7, z - .01]), .12 * k, .12 * k, '255,40,40', .9);
    // trolley pole up to the wire, with a spark now and then
    const pb = P([0, y + 3.1, z + .5]), pt = P([0, groundY(z + 2.5) + 5.6, z + 2.5]);
    target.strokeStyle = '#18181c'; target.lineWidth = Math.max(1.5, .05 * k); target.beginPath(); target.moveTo(...pb); target.lineTo(...pt); target.stroke();
    const spark = Math.max(0, Math.sin(TAU * phase * 7)) ** 30 + Math.max(0, Math.sin(TAU * phase * 11 + 1)) ** 40;
    if (spark > .05) { glow(target, pt[0], pt[1], 60 * spark, 60 * spark, '170,200,255', .7 * spark); glow(target, pt[0], pt[1], 6, 6, '240,248,255', spark); }
    // its light on the cobbles behind it
    glow(target, ...P([0, y, z - 2]), 2 * k, .6 * k, '255,200,130', .25);
    target.globalAlpha = 1;
  };
}

module.exports = {
  title: '언덕을 오르는 막차 전차',
  slug: 'last-tram-up-the-hill',
  sound: 'train',
  createScene,
};
