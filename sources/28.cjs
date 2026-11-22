'use strict';

// 28 · 피오르를 빠져나오는 여객선
// Dawn in a fjord: steep walls of dark rock streaked with waterfalls rise on both sides, snow in their high
// gullies, and the water between them is glass. A white ferry with rows of lit windows is gliding out
// toward the open sea, its bow wave spreading in a long V behind it that rocks the reflections. The sky at
// the fjord's mouth is turning apricot; mist lies on the water along the foot of the walls.
const paint = require('../lib/paint.cjs');
const { W, H, lerp, edge, glow, pathOf, camera, v3 } = paint;
const { add } = v3;

const cam = camera({ x: 0, y: 4, z: 0, yaw: 0, pitch: .02, focal: 1150, cx: 960, cy: 540 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const M = paint.mirrorOf(cam, 0);
const HORIZON = cam.project([0, 4, 1e6])[1];
const SHIP = [10, 0, 190];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// A fjord wall: a steep face from the water up to a ragged crest, drawn for camera or mirror.
function wall(ctx, rnd, Q, side, tone) {
  const pts = [];
  for (let z = 20; z <= 700; z += 6) {
    const x = side * (26 + z * .1 + 10 * edge(z * 3, 281 + side)), top = 70 + 70 * Math.max(0, edge(z * 2, 283 + side, [[400, 1], [120, .5], [30, .2]]) + .5) - z * .02;
    pts.push(Q([x, top, z]));
  }
  for (let z = 700; z >= 20; z -= 6) pts.push(Q([side * (18 + z * .09), 0, z]));
  fill(ctx, pts, tone);
  return pts;
}

function walls(ctx, rnd, Q) {
  for (const side of [-1, 1]) {
    const face = wall(ctx, rnd, Q, side, vertical(ctx, 0, H, [[0, '#3a3a48'], [.5, '#22242e'], [1, '#14161c']]));
    ctx.save(); pathOf(ctx, face); ctx.clip();
    // snow in the high gullies, streaks of falling water, ledges catching the dawn
    for (let i = 0; i < 40; i++) {
      const z = 40 + rnd() * 500, x = side * (24 + z * .1), top = Q([x, 60 + rnd() * 50, z]), bot = Q([x, 20 + rnd() * 30, z]);
      ctx.strokeStyle = i % 4 ? 'rgba(200,206,220,.25)' : 'rgba(230,236,244,.5)'; ctx.lineWidth = 1 + rnd() * 3;
      ctx.beginPath(); ctx.moveTo(...top); ctx.lineTo(bot[0] + (rnd() - .5) * 20, bot[1]); ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const z = 60 + rnd() * 300, x = side * (22 + z * .095), top = Q([x, 40 + rnd() * 40, z]), foot = Q([x, 0, z]);
      ctx.strokeStyle = 'rgba(220,230,240,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...top);
      for (let k = 1; k <= 10; k++) ctx.lineTo(lerp(top[0], foot[0], k / 10) + Math.sin(k) * 2, lerp(top[1], foot[1], k / 10)); ctx.stroke();
    }
    ctx.fillStyle = side < 0 ? 'rgba(255,190,150,.06)' : 'rgba(10,10,20,.25)'; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// The ferry: a long white hull with a dark waterline, two decks of lit windows, a funnel.
function ferry(ctx, Q) {
  const at = (x, y, z) => Q(add(SHIP, [x, y, z]));
  fill(ctx, [at(-30, 4, 0), at(26, 4, 0), at(32, 2, 0), at(30, 0, 0), at(-30, 0, 0)], '#8a8c92');
  fill(ctx, [at(-30, 1, 0), at(30, 1, 0), at(30, 0, 0), at(-30, 0, 0)], '#3a2a30');
  fill(ctx, [at(-24, 8, 0), at(18, 8, 0), at(20, 4, 0), at(-26, 4, 0)], '#7e8088');
  fill(ctx, [at(-16, 11, 0), at(8, 11, 0), at(10, 8, 0), at(-18, 8, 0)], '#74767e');
  fill(ctx, [at(-12, 15, 0), at(-7, 15, 0), at(-7, 11, 0), at(-12, 11, 0)], '#3a4a6a');
  for (const [y, x0, x1] of [[5.6, -24, 18], [9.2, -16, 7], [2.6, -28, 24]]) {
    for (let x = x0; x < x1; x += 2.2) { const p = at(x, y, 0), q = at(x + 1.2, y + .9, 0); ctx.fillStyle = '#ffd898'; ctx.fillRect(p[0], q[1], Math.max(1, q[0] - p[0]), Math.max(1, p[1] - q[1])); }
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(28011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#2a3456'], [.6, '#8a8494'], [.9, '#e4b494'], [1, '#f0c8a0']]);
  ctx.fillRect(0, 0, W, HORIZON + 2);
  glow(ctx, W / 2, HORIZON, 400, 120, '255,210,170', .4);
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#9a8c90'], [.2, '#3a3c4c'], [1, '#0e1218']]);
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  walls(ctx, paint.seeded(2802), P);
  ferry(ctx, P);
  const refl = make(W, H), rc = refl.getContext('2d');
  rc.save(); rc.translate(0, HORIZON * 2); rc.scale(1, -1); rc.drawImage(plate, 0, 0, W, HORIZON, 0, 0, W, HORIZON); rc.restore();
  walls(rc, paint.seeded(2802), M);
  ferry(rc, M);
  rc.globalCompositeOperation = 'source-atop'; rc.fillStyle = 'rgba(8,12,22,.4)'; rc.fillRect(0, 0, W, H);
  paint.applyTexture(ctx, make, 2801, .3, 0, 0, W, H, true);
  const mist = make(W * 2, 160), mc = mist.getContext('2d');
  for (let i = 0; i < 36; i++) { const x = rnd() * W * 2; for (const dx of [0, -W * 2, W * 2]) glow(mc, x + dx, 80, 260 + rnd() * 300, 16 + rnd() * 16, '200,190,196', .18); }
  const stern = P(add(SHIP, [-30, 0, 0])), bow = P(add(SHIP, [30, 0, 0]));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    paint.ripple(target, refl, HORIZON, phase, { amp: .7, bands: 3 });
    // the wake: two arms of a V spreading back from the ship across the glassy water, rolling outward
    for (let k = 0; k < 10; k++) {
      const t = ((phase * 2 + k / 10) % 1), spread = t * 900, y = stern[1] + t * 340;
      target.strokeStyle = `rgba(230,220,214,${.25 * (1 - t)})`; target.lineWidth = 1 + t * 2;
      target.beginPath(); target.moveTo(stern[0] - spread * .3, y); target.lineTo(stern[0] - spread, y + t * 40); target.stroke();
      target.beginPath(); target.moveTo(bow[0] + spread * .2, y); target.lineTo(bow[0] + spread * .8, y + t * 40); target.stroke();
    }
    const x = (phase * W * 2) % (W * 2);
    target.drawImage(mist, -x, HORIZON - 80); target.drawImage(mist, W * 2 - x, HORIZON - 80);
  };
}

module.exports = {
  title: '피오르를 빠져나오는 여객선',
  slug: 'ferry-leaving-the-fjord',
  sound: 'sea',
  createScene,
};
