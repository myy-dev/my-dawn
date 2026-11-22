'use strict';

// 25 · 작은 등이 켜진 새벽 독서실
// A public reading room before opening, rain outside. Long oak tables run away from us in two rows, each
// place with a green-shaded brass lamp; only a few are lit, throwing warm ovals on the wood and on an open
// book, a pair of glasses, a pencil. Bookshelves climb the side walls to a gallery with an iron rail;
// tall arched windows at the far end show grey rain, the drops sliding down. Everything else is dim.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, planks } = paint;

const cam = camera({ x: 0, y: 1.75, z: 0, yaw: .04, pitch: .1, focal: 860, cx: 960, cy: 520 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HALF = 5, END = 20, TABLE = .78;
const LIT = new Set(['-1.6,3', '1.6,5.5', '-1.6,10.5', '1.6,3']);

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }

function walls(ctx, rnd) {
  ctx.fillStyle = '#0c0b0e'; ctx.fillRect(0, 0, W, H);
  const floor = [P([-HALF, 0, 1]), P([HALF, 0, 1]), P([HALF, 0, END]), P([-HALF, 0, END])];
  planks(ctx, [floor[3], floor[2], floor[1], floor[0]], rnd, { along: 'v', width: [.02, .03], base: [60, 44, 32], vary: 10, streaks: 2 });
  // end wall with three arched windows
  fill(ctx, [P([-HALF, 0, END]), P([HALF, 0, END]), P([HALF, 7, END]), P([-HALF, 7, END])], '#2a2624');
  const wins = [];
  for (const x of [-2.6, 0, 2.6]) {
    const pts = [P([x - .8, 1.8, END]), P([x + .8, 1.8, END])];
    for (let a = 0; a <= 16; a++) { const t = a / 16 * Math.PI; pts.push(P([x + Math.cos(t) * .8, 5.4 + Math.sin(t) * .8, END])); }
    const outline = [pts[0], pts[1], ...pts.slice(2)];
    fill(ctx, outline, '#4a5462');
    ctx.save(); pathOf(ctx, outline); ctx.clip();
    const g = ctx.createLinearGradient(0, outline[outline.length - 8][1], 0, pts[0][1]); g.addColorStop(0, '#6a7686'); g.addColorStop(1, '#3a4452');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    ctx.strokeStyle = '#1e1c1e'; ctx.lineWidth = 4; pathOf(ctx, outline); ctx.stroke();
    for (let m = 1; m < 3; m++) { ctx.beginPath(); ctx.moveTo(...P([x - .8 + m * .53, 1.8, END])); ctx.lineTo(...P([x - .8 + m * .53, 5.8, END])); ctx.stroke(); }
    for (let m = 1; m < 5; m++) { ctx.beginPath(); ctx.moveTo(...P([x - .8, 1.8 + m * .8, END])); ctx.lineTo(...P([x + .8, 1.8 + m * .8, END])); ctx.stroke(); }
    wins.push(outline);
  }
  // side walls: shelves of books up to the gallery, then more above the rail
  for (const s of [-1, 1]) {
    fill(ctx, [P([s * HALF, 0, 1]), P([s * HALF, 0, END]), P([s * HALF, 7, END]), P([s * HALF, 7, 1])], '#1a1410');
    for (const [y0, y1] of [[0, 3], [3.6, 6.6]]) for (let shelf = 0; shelf < 7; shelf++) {
      const y = lerp(y0, y1, shelf / 7), h = (y1 - y0) / 7;
      let z = 1;
      while (z < END) {
        const w = .03 + rnd() * .04, bh = h * (.7 + rnd() * .25);
        fill(ctx, [P([s * HALF, y + .02, z]), P([s * HALF, y + .02, z + w]), P([s * HALF, y + bh, z + w]), P([s * HALF, y + bh, z])], shade([[110, 40, 30], [40, 60, 90], [90, 80, 50], [50, 70, 50], [120, 100, 70]][Math.floor(rnd() * 5)], (rnd() - .5) * 30 - 20, 1));
        z += w;
      }
      ctx.strokeStyle = '#2a1e14'; ctx.lineWidth = cam.focal / 6 * .04; ctx.beginPath(); ctx.moveTo(...P([s * HALF, y, 1])); ctx.lineTo(...P([s * HALF, y, END])); ctx.stroke();
    }
    // the gallery's walkway and iron rail
    fill(ctx, [P([s * HALF, 3.1, 1]), P([s * HALF, 3.1, END]), P([s * (HALF - .8), 3.1, END]), P([s * (HALF - .8), 3.1, 1])], '#2a1c14');
    fill(ctx, [P([s * (HALF - .8), 3.1, 1]), P([s * (HALF - .8), 3.1, END]), P([s * (HALF - .8), 2.9, END]), P([s * (HALF - .8), 2.9, 1])], '#3a2a1e');
    ctx.strokeStyle = '#141414'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...P([s * (HALF - .8), 4.05, 1])); ctx.lineTo(...P([s * (HALF - .8), 4.05, END])); ctx.stroke();
    for (let z = 1; z < END; z += .25) { ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...P([s * (HALF - .8), 3.1, z])); ctx.lineTo(...P([s * (HALF - .8), 4.05, z])); ctx.stroke(); }
  }
  return wins;
}

function tables(ctx, rnd) {
  const lamps = [];
  for (const x of [-1.6, 1.6]) {
    // a long table running away: top, front edge, legs
    const top = [P([x - .7, TABLE, 1.5]), P([x + .7, TABLE, 1.5]), P([x + .7, TABLE, 15]), P([x - .7, TABLE, 15])];
    planks(ctx, [top[3], top[2], top[1], top[0]], rnd, { along: 'v', width: [.3, .34], base: [96, 66, 40], vary: 10, streaks: 3 });
    fill(ctx, [P([x - .7, TABLE, 1.5]), P([x + .7, TABLE, 1.5]), P([x + .7, TABLE - .06, 1.5]), P([x - .7, TABLE - .06, 1.5])], '#3a2416');
    for (let z = 3; z <= 14; z += 2.5) {
      const zz = Math.round(z * 10) / 10;
      // chairs on the outer side
      paint.box(ctx, cam, { at: [x + Math.sign(x) * 1, 0, zz], sa: .22, sb: .22, h: .46 }, n => (n === 'top' ? '#4a3020' : '#2a1c12'));
      paint.box(ctx, cam, { at: [x + Math.sign(x) * 1.2, .46, zz], sa: .03, sb: .22, h: .5 }, () => '#3a2618');
      lamps.push({ x, z: zz, lit: LIT.has(`${x},${zz}`) });
    }
  }
  // lamps drawn back to front
  lamps.sort((a, b) => b.z - a.z);
  for (const l of lamps) {
    const base = P([l.x, TABLE, l.z]), k = cam.focal / cam.project([l.x, TABLE, l.z])[2];
    if (l.lit) { glow(ctx, base[0], base[1] + .05 * k, .7 * k, .22 * k, '255,210,140', .55); }
    ctx.fillStyle = '#a8883a'; ctx.beginPath(); ctx.ellipse(base[0], base[1], .08 * k, .025 * k, 0, 0, TAU); ctx.fill();
    ctx.fillRect(base[0] - .008 * k, base[1] - .35 * k, .016 * k, .35 * k);
    ctx.fillStyle = l.lit ? '#2a6a3a' : '#1a3a22';
    ctx.beginPath(); ctx.moveTo(base[0] - .2 * k, base[1] - .3 * k); ctx.quadraticCurveTo(base[0], base[1] - .46 * k, base[0] + .2 * k, base[1] - .3 * k); ctx.lineTo(base[0] + .2 * k, base[1] - .27 * k); ctx.lineTo(base[0] - .2 * k, base[1] - .27 * k); ctx.fill();
    if (l.lit) { ctx.fillStyle = '#ffe6b0'; ctx.fillRect(base[0] - .19 * k, base[1] - .27 * k, .38 * k, .02 * k); }
    if (l.lit && l.z === 3) {
      // an open book and glasses at this nearest place
      const b = P([l.x + .05, TABLE + .005, 2.5]), bk = cam.focal / 2.5;
      fill(ctx, [[b[0] - .26 * bk, b[1]], [b[0], b[1] - .02 * bk], [b[0], b[1] + .1 * bk], [b[0] - .28 * bk, b[1] + .12 * bk]], '#e8e0cc');
      fill(ctx, [[b[0], b[1] - .02 * bk], [b[0] + .26 * bk, b[1]], [b[0] + .28 * bk, b[1] + .12 * bk], [b[0], b[1] + .1 * bk]], '#ece4d2');
      for (let r = 0; r < 8; r++) { ctx.fillStyle = 'rgba(60,50,40,.4)'; ctx.fillRect(b[0] - .23 * bk, b[1] + (.005 + r * .012) * bk, .19 * bk, 1.5); ctx.fillRect(b[0] + .04 * bk, b[1] + (.005 + r * .012) * bk, .19 * bk, 1.5); }
      ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(b[0] + .38 * bk, b[1] + .08 * bk, .04 * bk, .02 * bk, 0, 0, TAU); ctx.moveTo(b[0] + .5 * bk, b[1] + .08 * bk); ctx.ellipse(b[0] + .46 * bk, b[1] + .08 * bk, .04 * bk, .02 * bk, 0, 0, TAU); ctx.stroke();
    }
  }
  return lamps.filter(l => l.lit);
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(25011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const wins = walls(ctx, rnd);
  const lit = tables(ctx, rnd);
  paint.applyTexture(ctx, make, 2501, .32, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.5, .52, .62], lights: lit.map(l => { const p = P([l.x, TABLE + .3, l.z]); return paint.LIGHT.lamp(p[0], p[1], .35, 260 * 3 / l.z, 200 * 3 / l.z, [1.2, .95, .7]); }) })(ctx);
  const drops = wins.map(w => {
    const xs = w.map(p => p[0]), ys = w.map(p => p[1]);
    return { w, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), list: Array.from({ length: 24 }, () => ({ u: rnd(), v: rnd(), turns: 1 + Math.floor(rnd() * 2), len: 4 + rnd() * 10 })) };
  });

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const d of drops) {
      target.save(); pathOf(target, d.w); target.clip();
      for (const r of d.list) { const x = lerp(d.x0, d.x1, r.u), y = lerp(d.y0 - 20, d.y1 + 20, (r.v + phase * r.turns) % 1); target.strokeStyle = 'rgba(200,214,230,.4)'; target.lineWidth = 1; target.beginPath(); target.moveTo(x, y); target.lineTo(x, y + r.len); target.stroke(); }
      target.restore();
    }
  };
}

module.exports = {
  title: '작은 등이 켜진 새벽 독서실',
  slug: 'reading-room-before-dawn',
  sound: 'rain-room',
  createScene,
};
