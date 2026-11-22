'use strict';

// 14 · 구리 주전자가 식는 부엌
// A farmhouse kitchen on a rainy night, the stove's work done. A copper kettle sits on the cast-iron range,
// its belly reflecting the room in warm curves, a last thread of steam rising from the spout. Behind it
// white tiles with dark grout, a rail with ladles and a pan, a shelf of jars. A rain-streaked window over
// the sink shows the dark yard. A lamp under the shelf lights the counter. Rain runs down the glass.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, planks } = paint;

const cam = camera({ x: .3, y: 1.55, z: 0, yaw: -.05, pitch: .06, focal: 1150, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const WALL = 2.4, COUNTER = .9;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function wall(ctx, rnd) {
  // tiles: rows of white glazed squares, each a hair different, slight sheen
  for (let r = 0; r < 14; r++) for (let c = -20; c < 16; c++) {
    const x0 = c * .15, y0 = COUNTER + r * .15, q = [P([x0 + .005, y0 + .145, WALL]), P([x0 + .145, y0 + .145, WALL]), P([x0 + .145, y0 + .005, WALL]), P([x0 + .005, y0 + .005, WALL])];
    fill(ctx, q, shade([150, 152, 150], (rnd() - .5) * 12));
  }
  const grout = [P([-1.8, COUNTER, WALL]), P([1.8, COUNTER, WALL]), P([1.8, 3, WALL]), P([-1.8, 3, WALL])];
  ctx.save(); pathOf(ctx, grout); ctx.clip(); ctx.restore();
  // the window above the sink on the right: frame, dark yard, rain on the glass
  const win = [P([.55, 2.6, WALL - .01]), P([1.5, 2.6, WALL - .01]), P([1.5, 1.3, WALL - .01]), P([.55, 1.3, WALL - .01])];
  fill(ctx, win.map(([x, y], i) => [x + [-10, 10, 10, -10][i], y + [-10, -10, 10, 10][i]]), '#e0dcd0');
  fill(ctx, win, vertical(ctx, win[0][1], win[2][1], [[0, '#0e1420'], [1, '#1e2836']]));
  glow(ctx, (win[0][0] + win[1][0]) / 2, win[2][1] - 60, 120, 40, '60,70,90', .5);
  ctx.strokeStyle = '#e0dcd0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo((win[0][0] + win[1][0]) / 2, win[0][1]); ctx.lineTo((win[3][0] + win[2][0]) / 2, win[3][1]); ctx.stroke();
  // shelf of jars and the rail of utensils
  paint.box(ctx, cam, { at: [-.4, 2.1, WALL - .15], sa: 1.2, sb: .15, h: .04 }, n => (n === 'top' ? '#6a4a32' : '#4a3424'));
  for (let i = 0; i < 7; i++) {
    const x = -1.4 + i * .3 + (rnd() - .5) * .05, h = .14 + rnd() * .1, c = [[120, 90, 60], [160, 130, 70], [90, 110, 70], [180, 160, 120]][i % 4];
    paint.box(ctx, cam, { at: [x, 2.14, WALL - .15], sa: .06, sb: .06, h }, n => shade(c, n === 'top' ? 20 : 0, .85));
    paint.box(ctx, cam, { at: [x, 2.14 + h, WALL - .15], sa: .065, sb: .065, h: .03 }, () => '#3a3a3a');
  }
  const rail = [P([-1.6, 1.75, WALL - .05]), P([-.4, 1.75, WALL - .05])];
  ctx.strokeStyle = '#8a8a86'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...rail[0]); ctx.lineTo(...rail[1]); ctx.stroke();
  for (let i = 0; i < 4; i++) { const p = P([-1.5 + i * .3, 1.75, WALL - .05]), k = cam.focal / 2.35; ctx.strokeStyle = '#6a6a66'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(p[0], p[1] + .3 * k); ctx.stroke(); ctx.fillStyle = '#7a7a76'; ctx.beginPath(); ctx.ellipse(p[0], p[1] + .32 * k, .04 * k, .03 * k, 0, 0, TAU); ctx.fill(); }
}

function range(ctx, rnd) {
  // the cast-iron range under the kettle, its rails and hotplate, a towel over the bar
  paint.box(ctx, cam, { at: [-.25, 0, 1.9], sa: .55, sb: .32, h: COUNTER }, n => (n === 'top' ? '#2a2a2e' : n === 'front' ? '#1c1c20' : '#141418'));
  const hp = P([-.25, COUNTER + .005, 1.85]), k = cam.focal / 1.85;
  ctx.fillStyle = '#121214'; ctx.beginPath(); ctx.ellipse(hp[0], hp[1], .22 * k, .07 * k, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#3a3a3e'; ctx.lineWidth = 2; for (let r = 1; r < 4; r++) { ctx.beginPath(); ctx.ellipse(hp[0], hp[1], .06 * r * k, .02 * r * k, 0, 0, TAU); ctx.stroke(); }
  const bar = [P([-.78, .7, 1.56]), P([.28, .7, 1.56])];
  ctx.strokeStyle = '#a8a6a0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(...bar[0]); ctx.lineTo(...bar[1]); ctx.stroke();
  fill(ctx, [P([-.6, .72, 1.56]), P([-.32, .72, 1.56]), P([-.3, .35, 1.55]), P([-.62, .38, 1.55])], '#b84a3a');
  for (let s = 0; s < 4; s++) { const a = P([-.6, .6 - s * .06, 1.555]), b = P([-.31, .6 - s * .06, 1.555]); ctx.strokeStyle = 'rgba(240,230,220,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // counters to either side: worn wood tops on painted cupboards
  for (const [x, w] of [[-1.5, .7], [1, .9]]) {
    paint.box(ctx, cam, { at: [x, 0, 1.95], sa: w, sb: .3, h: COUNTER - .04 }, n => (n === 'front' ? '#3a4a52' : '#2a363c'));
    const top = [P([x - w, COUNTER, 1.62]), P([x + w, COUNTER, 1.62]), P([x + w, COUNTER, 2.28]), P([x - w, COUNTER, 2.28])];
    planks(ctx, [top[3], top[2], top[1], top[0]], rnd, { along: 'u', width: [.2, .26], base: [130, 96, 66], vary: 16, streaks: 1 });
  }
}

// The kettle: a round copper body, a lid with a knob, a curving spout, a handle; the copper reflects the
// lamp in a bright streak and the room in dark bands.
function kettle(ctx) {
  const c = P([-.25, COUNTER + .2, 1.85]), k = cam.focal / 1.85, r = .2 * k;
  const g = ctx.createRadialGradient(c[0] - r * .4, c[1] - r * .4, r * .1, c[0], c[1], r * 1.1);
  g.addColorStop(0, '#f4c08a'); g.addColorStop(.35, '#c4743e'); g.addColorStop(.75, '#7a3a1e'); g.addColorStop(1, '#3a1a10');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(c[0], c[1], r * 1.15, r, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(30,20,20,.35)'; ctx.beginPath(); ctx.ellipse(c[0] + r * .4, c[1] + r * .1, r * .3, r * .7, .3, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,236,200,.8)'; ctx.beginPath(); ctx.ellipse(c[0] - r * .5, c[1] - r * .35, r * .08, r * .3, .5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#a8602e'; ctx.beginPath(); ctx.ellipse(c[0], c[1] - r * .92, r * .5, r * .14, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a1a14'; ctx.beginPath(); ctx.arc(c[0], c[1] - r * 1.08, r * .12, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#b8682e'; ctx.lineWidth = r * .18; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(c[0] + r * .9, c[1] + r * .1); ctx.quadraticCurveTo(c[0] + r * 1.5, c[1] - r * .1, c[0] + r * 1.7, c[1] - r * .7); ctx.stroke();
  ctx.strokeStyle = '#2a1e18'; ctx.lineWidth = r * .1;
  ctx.beginPath(); ctx.moveTo(c[0] - r * .6, c[1] - r * .8); ctx.quadraticCurveTo(c[0], c[1] - r * 2, c[0] + r * .6, c[1] - r * .8); ctx.stroke();
  return [c[0] + r * 1.7, c[1] - r * .75];
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(14011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.fillStyle = '#18161a'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#3a3a3c'; ctx.fillRect(0, 0, W, H);
  wall(ctx, rnd);
  range(ctx, rnd);
  const spout = kettle(ctx);
  const lampAt = P([-.4, 2.05, 2.1]);
  paint.applyTexture(ctx, make, 1401, .32, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.52, .54, .64], lights: [paint.LIGHT.hood(lampAt[0], lampAt[1] + 20, .6, 700, 520), paint.LIGHT.lamp(P([1, 2, 2.4])[0], P([1, 2, 2.4])[1], .25, 300, 300, [.6, .7, 1])] })(ctx);
  const win = { x0: P([.55, 2.6, 2.4])[0], x1: P([1.5, 2.6, 2.4])[0], y0: P([.55, 2.6, 2.4])[1], y1: P([.55, 1.3, 2.4])[1] };
  const drops = Array.from({ length: 50 }, () => ({ x: lerp(win.x0, win.x1, rnd()), y: rnd(), turns: 1 + Math.floor(rnd() * 2), len: 10 + rnd() * 30, a: .2 + rnd() * .3 }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.beginPath(); target.rect(win.x0, win.y0, win.x1 - win.x0, win.y1 - win.y0); target.clip();
    for (const d of drops) { const y = lerp(win.y0 - 40, win.y1 + 40, (d.y + phase * d.turns) % 1); target.strokeStyle = `rgba(180,196,220,${d.a})`; target.lineWidth = 1.2; target.beginPath(); target.moveTo(d.x, y); target.lineTo(d.x + 1, y + d.len); target.stroke(); }
    target.restore();
    // the last of the steam: soft puffs rising and curling from the spout
    for (let i = 0; i < 8; i++) {
      const t = (phase * 2 + i / 8) % 1;
      glow(target, spout[0] + Math.sin(t * 5 + i) * 20 * t + t * 30, spout[1] - t * 220, 12 + t * 40, 10 + t * 30, '230,230,236', .22 * (1 - t) * Math.min(1, t * 10));
    }
  };
}

module.exports = {
  title: '구리 주전자가 식는 부엌',
  slug: 'copper-kettle-kitchen',
  sound: 'rain-room',
  createScene,
};
