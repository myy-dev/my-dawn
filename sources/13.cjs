'use strict';

// 13 · 달빛이 드는 겨울 정원
// A garden room at night in deep winter. A wall of tall many-paned windows looks out onto a snow-covered
// garden: clipped hedges, a sundial, bare trees, the moon high and white. Moonlight comes in through the
// glazing and lays the window's grid across the tiled floor in long pale shapes. Inside, a wicker chair
// with a folded blanket, a lemon tree in a tub, a small table with a cup gone cold. The bare branches
// outside move in the wind and their shadows move in the window shapes on the floor.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, v3 } = paint;

const cam = camera({ x: 0, y: 1.5, z: 0, yaw: -.3, pitch: .04, focal: 950, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const WALL_Z = 7, MOON = unit3([.25, .6, -1]);
function unit3(v) { return v3.unit(v); }

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// The window wall at z = WALL_Z from x -6 to 3: frames dividing tall panes; returns the panes in metres.
function panes() {
  const out = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
    const x0 = -6 + i * 1.5 + .06, x1 = x0 + 1.38, y0 = .5 + j * .9 + .04, y1 = y0 + .82;
    out.push([x0, x1, y0, y1]);
  }
  return out;
}

function garden(ctx, rnd, branchSway) {
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#0a1222'], [.5, '#1e2a44'], [1, '#2a3450']]); ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 120, 500);
  const moon = P([-2, 9, 40]);
  glow(ctx, moon[0], moon[1], 160, 160, '210,220,240', .3); ctx.fillStyle = '#eef2f6'; ctx.beginPath(); ctx.arc(moon[0], moon[1], 20, 0, TAU); ctx.fill();
  const snowLine = P([0, 0, 30])[1];
  ctx.fillStyle = vertical(ctx, snowLine - 60, H, [[0, '#7a8aa4'], [1, '#a4b2c8']]); ctx.fillRect(0, snowLine - 30, W, H);
  for (let i = 0; i < 8; i++) { const p = P([-8 + i * 2.6, 0, 18 + (i % 3) * 3]), k = cam.focal / (18 + (i % 3) * 3); fill(ctx, [[p[0] - .9 * k, p[1]], [p[0] + .9 * k, p[1]], [p[0] + .8 * k, p[1] - .9 * k], [p[0] - .8 * k, p[1] - .9 * k]], '#1e2a2a'); fill(ctx, [[p[0] - .9 * k, p[1] - .9 * k], [p[0] + .9 * k, p[1] - .9 * k], [p[0] + .7 * k, p[1] - 1.05 * k], [p[0] - .7 * k, p[1] - 1.05 * k]], '#c8d4e4'); }
  const sd = P([-1, 0, 14]), k = cam.focal / 14;
  fill(ctx, [[sd[0] - .15 * k, sd[1]], [sd[0] + .15 * k, sd[1]], [sd[0] + .1 * k, sd[1] - 1 * k], [sd[0] - .1 * k, sd[1] - 1 * k]], '#4a4e5a');
  fill(ctx, [[sd[0] - .3 * k, sd[1] - 1 * k], [sd[0] + .3 * k, sd[1] - 1 * k], [sd[0] + .3 * k, sd[1] - 1.08 * k], [sd[0] - .3 * k, sd[1] - 1.08 * k]], '#c8d4e4');
  // bare trees, their twigs moving
  ctx.strokeStyle = '#141a24'; ctx.lineCap = 'round';
  const tree = (x, y, a, len, w, d) => { const sw = branchSway * (4 - d) * .02, ex = x + Math.cos(a + sw) * len, ey = y + Math.sin(a + sw) * len; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke(); if (d) for (let i = 0; i < 2; i++) tree(ex, ey, a + (i ? .45 : -.4) + (rnd() - .5) * .3, len * .72, w * .65, d - 1); };
  const r2 = paint.seeded(1302);
  for (const [tx, tz] of [[-4, 20], [3, 26], [-9, 24]]) { const b = P([tx, 0, tz]); const kk = cam.focal / tz; const save = rnd; tree(b[0], b[1], -Math.PI / 2, 2.4 * kk, .3 * kk, 6); void save; void r2; }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(13011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  // the room: dark walls, a tiled floor, the window wall's frames
  ctx.fillStyle = '#14161c'; ctx.fillRect(0, 0, W, H);
  const floor = [P([-7, 0, 1]), P([4, 0, 1]), P([4, 0, WALL_Z]), P([-7, 0, WALL_Z])];
  fill(ctx, floor, '#2a2c34');
  for (let i = -7; i <= 4; i += .5) { ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...P([i, 0, 1])); ctx.lineTo(...P([i, 0, WALL_Z])); ctx.stroke(); }
  for (let z = 1; z <= WALL_Z; z += .5) { ctx.beginPath(); ctx.moveTo(...P([-7, 0, z])); ctx.lineTo(...P([4, 0, z])); ctx.stroke(); }
  paint.applyTexture(ctx, make, 1301, .3, 0, 0, W, H, true);
  // furniture in front of the window: a wicker chair with a blanket, a tub with a lemon tree, a little table
  const furniture = make(W, H), fc = furniture.getContext('2d');
  // the wicker chair: a rounded barrel back woven in rings, a plump cushion, splayed legs
  { const c = P([-2.2, 0, 4.2]), k = cam.focal / 4.2;
    fc.strokeStyle = '#5a4a32'; fc.lineWidth = .04 * k; for (const dx of [-.32, .32]) { fc.beginPath(); fc.moveTo(c[0] + dx * k, c[1] - .38 * k); fc.lineTo(c[0] + dx * 1.15 * k, c[1]); fc.stroke(); }
    const back = fc.createLinearGradient(c[0] - .5 * k, 0, c[0] + .5 * k, 0); back.addColorStop(0, '#9a8258'); back.addColorStop(.5, '#7a6444'); back.addColorStop(1, '#4a3a26');
    fc.fillStyle = back; fc.beginPath(); fc.moveTo(c[0] - .48 * k, c[1] - .4 * k); fc.bezierCurveTo(c[0] - .6 * k, c[1] - 1.2 * k, c[0] + .6 * k, c[1] - 1.2 * k, c[0] + .48 * k, c[1] - .4 * k); fc.quadraticCurveTo(c[0], c[1] - .3 * k, c[0] - .48 * k, c[1] - .4 * k); fc.fill();
    for (let r = 0; r < 12; r++) { fc.strokeStyle = 'rgba(40,28,16,.35)'; fc.lineWidth = 1; fc.beginPath(); fc.ellipse(c[0], c[1] - .42 * k - r * .055 * k, (.46 - r * .012) * k, .08 * k, 0, Math.PI, TAU); fc.stroke(); }
    fc.fillStyle = '#7a3a3a'; fc.beginPath(); fc.ellipse(c[0], c[1] - .44 * k, .42 * k, .12 * k, 0, 0, TAU); fc.fill();
    fc.fillStyle = 'rgba(255,200,190,.15)'; fc.beginPath(); fc.ellipse(c[0] - .1 * k, c[1] - .48 * k, .2 * k, .05 * k, 0, 0, TAU); fc.fill();
    fc.fillStyle = '#4a5a6a'; fc.beginPath(); fc.moveTo(c[0] + .1 * k, c[1] - .5 * k); fc.quadraticCurveTo(c[0] + .5 * k, c[1] - .4 * k, c[0] + .45 * k, c[1] - .1 * k); fc.lineTo(c[0] + .3 * k, c[1] - .15 * k); fc.quadraticCurveTo(c[0] + .3 * k, c[1] - .4 * k, c[0] + .1 * k, c[1] - .5 * k); fc.fill(); }
  // the lemon tree's tub: a round wooden half-barrel with hoops
  { const t = P([.6, 0, 4.6]), k = cam.focal / 4.6; const g = fc.createLinearGradient(t[0] - .32 * k, 0, t[0] + .32 * k, 0); g.addColorStop(0, '#6a4a30'); g.addColorStop(.5, '#5a3a24'); g.addColorStop(1, '#2a1a10');
    fc.fillStyle = g; fc.beginPath(); fc.moveTo(t[0] - .34 * k, t[1] - .5 * k); fc.lineTo(t[0] + .34 * k, t[1] - .5 * k); fc.lineTo(t[0] + .28 * k, t[1]); fc.lineTo(t[0] - .28 * k, t[1]); fc.fill();
    fc.fillStyle = '#2a1e16'; fc.beginPath(); fc.ellipse(t[0], t[1] - .5 * k, .34 * k, .07 * k, 0, 0, TAU); fc.fill();
    for (const y of [.12, .38]) { fc.strokeStyle = '#1a1a1a'; fc.lineWidth = 3; fc.beginPath(); fc.moveTo(t[0] - (.29 + y * .1) * k, t[1] - y * k); fc.lineTo(t[0] + (.29 + y * .1) * k, t[1] - y * k); fc.stroke(); } }
  const lt = P([.6, .5, 4.6]), lk = cam.focal / 4.6;
  fc.strokeStyle = '#3a2a1e'; fc.lineWidth = .05 * lk; fc.beginPath(); fc.moveTo(...lt); fc.lineTo(lt[0], lt[1] - 1 * lk); fc.stroke();
  for (let i = 0; i < 60; i++) { const x = lt[0] + (rnd() - .5) * 1.1 * lk, y = lt[1] - (1 + rnd() * .9) * lk; fc.fillStyle = shade([40, 70, 40], (rnd() - .5) * 20); fc.beginPath(); fc.ellipse(x, y, .06 * lk, .03 * lk, rnd() * 3, 0, TAU); fc.fill(); }
  for (let i = 0; i < 7; i++) { fc.fillStyle = '#d8c040'; fc.beginPath(); fc.arc(lt[0] + (rnd() - .5) * .8 * lk, lt[1] - (1.1 + rnd() * .6) * lk, .045 * lk, 0, TAU); fc.fill(); }
  // a small round side table on a pedestal, the cold cup and saucer on it
  { const t = P([-.9, 0, 3.4]), k = cam.focal / 3.4; fc.fillStyle = 'rgba(0,0,0,.3)'; fc.beginPath(); fc.ellipse(t[0], t[1], .24 * k, .05 * k, 0, 0, TAU); fc.fill();
    fc.strokeStyle = '#2a201a'; fc.lineWidth = .05 * k; fc.beginPath(); fc.moveTo(t[0], t[1]); fc.lineTo(t[0], t[1] - .55 * k); fc.stroke(); fc.lineWidth = .03 * k; for (const dx of [-.18, .18]) { fc.beginPath(); fc.moveTo(t[0], t[1] - .08 * k); fc.quadraticCurveTo(t[0] + dx * .6 * k, t[1] - .02 * k, t[0] + dx * k, t[1]); fc.stroke(); }
    fc.fillStyle = '#3a2a20'; fc.beginPath(); fc.ellipse(t[0], t[1] - .56 * k, .28 * k, .07 * k, 0, 0, TAU); fc.fill(); fc.fillStyle = '#4a3a2e'; fc.beginPath(); fc.ellipse(t[0], t[1] - .58 * k, .28 * k, .07 * k, 0, 0, TAU); fc.fill(); }
  const cup = P([-.9, .6, 3.4]), ck = cam.focal / 3.4; fc.fillStyle = '#d8d4cc'; fc.beginPath(); fc.ellipse(cup[0], cup[1], .07 * ck, .018 * ck, 0, 0, TAU); fc.fill(); fill(fc, [[cup[0] - .045 * ck, cup[1] - .005 * ck], [cup[0] + .045 * ck, cup[1] - .005 * ck], [cup[0] + .04 * ck, cup[1] - .07 * ck], [cup[0] - .04 * ck, cup[1] - .07 * ck]], '#c8c4bc');
  const list = panes();

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    const sway = Math.sin(TAU * phase * 2);
    // the garden, visible through each pane
    const view = make(W, H); garden(view.getContext('2d'), paint.seeded(1303), sway);
    for (const [x0, x1, y0, y1] of list) { target.save(); pathOf(target, [P([x0, y1, WALL_Z]), P([x1, y1, WALL_Z]), P([x1, y0, WALL_Z]), P([x0, y0, WALL_Z])]); target.clip(); target.drawImage(view, 0, 0); target.restore(); }
    // the window's moonlight on the floor: each pane projected back along the moon's rays to y = 0
    target.save(); target.globalCompositeOperation = 'lighter';
    for (const [x0, x1, y0, y1] of list) {
      const drop = p => { const t = p[1] / -MOON[1]; return P([p[0] + MOON[0] * t, 0, p[2] + MOON[2] * t]); };
      const q = [[x0, y1, WALL_Z], [x1, y1, WALL_Z], [x1, y0, WALL_Z], [x0, y0, WALL_Z]].map(drop);
      fill(target, q, `rgba(150,170,210,${.3 + .03 * Math.sin(TAU * phase * 2 + x0)})`);
    }
    target.restore();
    target.drawImage(furniture, 0, 0);
  };
}

module.exports = {
  title: '달빛이 드는 겨울 정원',
  slug: 'winter-conservatory-moon',
  sound: 'room-wind',
  createScene,
};
