'use strict';

// 80 · 눈 쌓인 승강장의 먼 신호
// A small country station at night under falling snow. We stand on the platform: its edge with a yellow
// line runs away beside two snow-filled tracks, the rails showing as thin dark lines where wheels last ran.
// A wooden shelter with a bench and a hanging lamp, a station name board, a row of lamp posts each in its
// own halo. Far down the line, past where the rails converge into the dark, a signal glows red, then turns
// green for a train that doesn't come yet. Snow falls steadily, thicker in the lamplight.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: -.6, y: 1.65, z: 0, yaw: .1, pitch: .02, focal: 1000, cx: 960, cy: 540 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(.1) * 1e6, 1.65, Math.cos(.1) * 1e6])[1];
const EDGE = .8, PLAT = .9;                               // platform edge at x = EDGE, height PLAT above rails

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}
// The camera stands on the platform, so the platform surface is y = 0 and the track bed is y = -PLAT.

function scene(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 10, [[0, '#0e1222'], [1, '#2a3040']]); ctx.fillRect(0, 0, W, H);
  // far fields and a tree line under snow
  fill(ctx, [[0, HORIZON - 4], [W, HORIZON - 4], [W, H], [0, H]], '#4a5062');
  for (let i = 0; i < 60; i++) { const x = rnd() * W, h = 6 + rnd() * 26; ctx.fillStyle = shade([30, 34, 44], (rnd() - .5) * 10); ctx.beginPath(); ctx.moveTo(x - h * .4, HORIZON - 2); ctx.lineTo(x, HORIZON - 2 - h); ctx.lineTo(x + h * .4, HORIZON - 2); ctx.fill(); }
  // track bed: snow with the rails' lines and buried sleepers' bumps
  const bed = (u, v) => P([lerp(EDGE, 9, u), -PLAT, lerp(400, 1, v)]);
  fill(ctx, paint.outline(bed, 8), vertical(ctx, HORIZON, H, [[0, '#5a6274'], [1, '#8a92a6']]));
  for (const x of [1.6, 3.04, 5.2, 6.64]) {
    ctx.strokeStyle = 'rgba(30,34,44,.85)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const z = 1.5 * Math.pow(250, i / 40), p = P([x, -PLAT + .02, z]); i ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke();
  }
  for (let z = 2; z < 60; z += .65) { const a = P([1.3, -PLAT, z]), b = P([3.34, -PLAT, z]); ctx.strokeStyle = 'rgba(60,66,80,.25)'; ctx.lineWidth = Math.max(1, 800 / z * .05); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // platform face (the vertical edge) and the platform top
  fill(ctx, [P([EDGE, 0, 1]), P([EDGE, 0, 300]), P([EDGE, -PLAT, 300]), P([EDGE, -PLAT, 1])], '#3a3a44');
  const top = (u, v) => P([lerp(-6, EDGE, u), 0, lerp(300, .6, v)]);
  fill(ctx, paint.outline(top, 8), vertical(ctx, HORIZON, H, [[0, '#6a7286'], [1, '#949aac']]));
  // the yellow line half-buried, and footprints wandering along
  const line = []; for (let i = 0; i <= 30; i++) { const z = .6 * Math.pow(400, i / 30); line.push(P([EDGE - .5, .01, z])); } for (let i = 30; i >= 0; i--) { const z = .6 * Math.pow(400, i / 30); line.push(P([EDGE - .42, .01, z])); }
  fill(ctx, line, 'rgba(200,170,60,.55)');
  for (let i = 0; i < 40; i++) { const z = 1.2 + i * .55, x = -1.2 + Math.sin(i * .4) * .3 + (i % 2) * .22, p = P([x, 0, z]), k = cam.focal / z; ctx.fillStyle = 'rgba(70,76,96,.45)'; ctx.beginPath(); ctx.ellipse(p[0], p[1], .06 * k, .025 * k, 0, 0, TAU); ctx.fill(); }
  // the shelter on the left: a timber hut with an open front, bench, and its own lamp
  const sx = -3.4, sz0 = 5, sz1 = 9.5;
  paint.box(ctx, cam, { at: [sx, 0, (sz0 + sz1) / 2], sa: .9, sb: (sz1 - sz0) / 2, h: 2.5 }, n => (n === 'right' ? '#3a2a22' : n === 'top' ? '#c8ccd8' : '#2a1e18'));
  const open = (u, v) => P([sx + .91, lerp(2.2, 0, v), lerp(sz0 + .3, sz1 - .3, u)]);
  fill(ctx, paint.outline(open, 4), '#1a1410');
  planks(ctx, (u, v) => P([sx - .85, lerp(2.2, 0, v), lerp(sz0 + .3, sz1 - .3, u)]), rnd);
  // roof: a pitched snow-laden roof overhanging the front
  const roof = [P([sx - 1.1, 2.5, sz0 - .3]), P([sx + 1.4, 2.3, sz0 - .3]), P([sx + 1.4, 2.3, sz1 + .3]), P([sx - 1.1, 2.5, sz1 + .3])];
  fill(ctx, roof, '#c8ccd8');
  const lip = []; for (let i = 0; i <= 12; i++) { const z = lerp(sz0 - .3, sz1 + .3, i / 12); lip.push(P([sx + 1.4, 2.3 - .05 - .06 * Math.sin(i * 1.3) ** 2, z])); }
  ctx.strokeStyle = '#dde0ea'; ctx.lineWidth = 6; ctx.beginPath(); lip.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  for (let i = 0; i < 4; i++) { const p = P([sx + 1.4, 2.25, lerp(sz0, sz1, (i + .5) / 4)]); ctx.strokeStyle = 'rgba(200,220,240,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(p[0], p[1] + 14 + i * 5); ctx.stroke(); }
  const bench = [P([sx + .2, .45, sz0 + .6]), P([sx + .6, .45, sz0 + .6]), P([sx + .6, .45, sz1 - .6]), P([sx + .2, .45, sz1 - .6])];
  fill(ctx, bench, '#6a4a30');
  // the station board on two posts
  const bz = 14, b0 = P([-1.4, 1.8, bz]), b1 = P([.2, 2.4, bz]), bk = cam.focal / bz;
  for (const x of [-1.3, .1]) { const a = P([x, 0, bz]), c = P([x, 1.8, bz]); ctx.strokeStyle = '#18181e'; ctx.lineWidth = .08 * bk; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...c); ctx.stroke(); }
  fill(ctx, [[b0[0], b1[1]], [b1[0], b1[1]], [b1[0], b0[1]], [b0[0], b0[1]]], '#e8e8ec');
  fill(ctx, [[b0[0], b1[1] - 4], [b1[0], b1[1] - 4], [b1[0], b1[1] + 2], [b0[0], b1[1] + 2]], '#dfe2ec');
  ctx.fillStyle = '#1a2a5a'; ctx.font = `bold ${Math.round(.28 * bk)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('소 리 내', (b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2);
  return { shelter: P([sx + 1, 2.1, (sz0 + sz1) / 2]) };
}
function planks(ctx, map, rnd) { paint.planks(ctx, map, rnd, { along: 'u', width: [.1, .14], base: [70, 52, 40], vary: 14, streaks: 2 }); }

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(80011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sc = scene(ctx, rnd);
  // lamp posts along the platform, each with a snow cap
  const lamps = [];
  for (const z of [4, 12, 22, 36, 56]) { const foot = P([-.3, 0, z]), head = P([-.3, 3.4, z]), k = cam.focal / cam.project([-.3, 3.4, z])[2]; ctx.strokeStyle = '#16161c'; ctx.lineWidth = Math.max(1.5, .09 * k); ctx.beginPath(); ctx.moveTo(...foot); ctx.lineTo(...head); ctx.stroke(); fill(ctx, [[head[0] - .18 * k, head[1]], [head[0] + .18 * k, head[1]], [head[0] + .1 * k, head[1] - .12 * k], [head[0] - .1 * k, head[1] - .12 * k]], '#1a1a20'); ctx.fillStyle = '#e0e4ee'; ctx.beginPath(); ctx.ellipse(head[0], head[1] - .13 * k, .12 * k, .04 * k, 0, 0, TAU); ctx.fill(); lamps.push({ at: head, k, z }); }
  paint.applyTexture(ctx, make, 8001, .34, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.48, .52, .7], lights: [...lamps.map(l => paint.LIGHT.lamp(l.at[0], l.at[1] + 2.4 * l.k, Math.min(.3, 1.6 / l.z), 1.6 * l.k, 1.4 * l.k, [1.3, 1.02, .7])), paint.LIGHT.lamp(sc.shelter[0], sc.shelter[1], .3, 160, 200, [1.3, 1, .7])] })(ctx);
  const signal = P([2.4, -PLAT + 3, 260]);
  const snow = paint.particles(rnd, 460, { kind: 'snow', near: .15, speed: 1 });

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the distant signal: red for most of the loop, green for a while in the middle, a soft change
    const g = Math.min(1, Math.max(0, (Math.sin(TAU * (phase - .25)) - .2) * 3));
    glow(target, signal[0], signal[1], 26, 26, `${Math.round(lerp(255, 80, g))},${Math.round(lerp(50, 230, g))},${Math.round(lerp(40, 120, g))}`, .7);
    glow(target, signal[0], signal[1], 3, 3, '255,255,255', .8);
    for (const l of lamps) { glow(target, l.at[0], l.at[1] + 4, .5 * l.k, .3 * l.k, '255,220,160', .5); glow(target, l.at[0], l.at[1] + .6 * l.k, 1.1 * l.k, 1.3 * l.k, '255,210,150', .05); }
    snow.draw(target, phase, '232,236,246');
    // flakes near a lamp glint warm
    for (const p of snow.items) { if (!p.close) continue; const [x, y] = snow.at(p, phase); for (const l of lamps.slice(0, 2)) if (Math.hypot(x - l.at[0], (y - l.at[1]) * .7) < 1.4 * l.k) glow(target, x, y, p.r * 3, p.r * 3, '255,220,170', .4); }
  };
}

module.exports = {
  title: '눈 쌓인 승강장의 먼 신호',
  slug: 'snow-on-the-empty-platform',
  sound: 'snow',
  createScene,
};
