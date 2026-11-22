'use strict';

// 17 · 오래된 턴테이블의 한 바퀴
// Seen from a little above, a record player on a low teak sideboard in a living room before dawn. The
// black disc turns, its grooves catching the lamp in a pair of soft bright wedges that stay put while the
// record spins under them; the paper label with its print goes round. The tonearm rests in the groove,
// rising and falling a hair with the record's warp. Beside it a stack of sleeves leans, a glass of water,
// a small lamp with a fabric shade; behind, the window's blinds let in thin blue bars of early light.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, glow, pathOf, shade, planks } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// The view is tilted: circles on the deck are ellipses squashed by SQ.
const SQ = .52, REC = { x: 860, y: 640, r: 380 };

function room(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, 380, [[0, '#1a1c26'], [1, '#262630']]); ctx.fillRect(0, 0, W, 380);
  // blinds: horizontal slats with blue light between them
  for (let i = 0; i < 18; i++) {
    const y = 10 + i * 20;
    ctx.fillStyle = `rgba(110,140,190,${.2 + .1 * Math.sin(i * .7)})`; ctx.fillRect(1180, y, 640, 5);
    ctx.fillStyle = '#20222c'; ctx.fillRect(1180, y + 5, 640, 15);
  }
  glow(ctx, 1500, 200, 500, 200, '110,140,190', .2);
  // the sideboard top in teak, seen steeply
  fill(ctx, [[0, 330], [W, 330], [W, H], [0, H]], '#2a1c14');
  planks(ctx, [[0, 340], [W, 340], [W, H], [0, H]], rnd, { along: 'u', width: [.12, .16], base: [120, 72, 42], vary: 16, streaks: 3 });
  fill(ctx, [[0, 330], [W, 330], [W, 344], [0, 344]], '#4a3020');
}

function plinth(ctx) {
  // the turntable's wooden plinth with a bevelled edge, and its platter's shadow
  const x0 = 380, x1 = 1460, y0 = 380, y1 = 1000;
  fill(ctx, [[x0 + 10, y1 + 30], [x1 + 30, y1 + 30], [x1 + 30, y0 + 40], [x0 + 10, y0 + 40]], 'rgba(0,0,0,.45)');
  fill(ctx, [[x0, y1], [x1, y1], [x1, y1 + 36], [x0, y1 + 36]], '#5a3a22');
  fill(ctx, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], vertical(ctx, y0, y1, [[0, '#8a5a34'], [1, '#6a4428']]));
  fill(ctx, [[x0 + 14, y0 + 10], [x1 - 14, y0 + 10], [x1 - 14, y1 - 10], [x0 + 14, y1 - 10]], '#262224');
  // the platter rim
  ctx.fillStyle = '#5a5a5e'; ctx.beginPath(); ctx.ellipse(REC.x, REC.y + 12, REC.r + 14, (REC.r + 14) * SQ, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8a8a8e'; ctx.beginPath(); ctx.ellipse(REC.x, REC.y, REC.r + 14, (REC.r + 14) * SQ, 0, 0, TAU); ctx.fill();
  // knobs and the speed buttons
  for (const [x, c] of [[1340, '#c8c4bc'], [1390, '#c8c4bc']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, 940, 18, 10, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#d86a3a'; ctx.beginPath(); ctx.ellipse(470, 950, 6, 4, 0, 0, TAU); ctx.fill();
}

function sideThings(ctx, rnd) {
  // sleeves leaning on the left, a glass on the right, the lamp's base behind
  for (let i = 0; i < 5; i++) {
    const x = 60 + i * 26, top = 160 + i * 10;
    const c = [[180, 60, 50], [40, 80, 120], [200, 180, 140], [60, 60, 60], [120, 140, 90]][i];
    fill(ctx, [[x, 760], [x + 260, 760], [x + 300, top], [x + 40, top]], shade(c, -i * 6, .9));
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x + 80, top + 80, 120, 120);
  }
  const gx = 1640, gy = 760;
  fill(ctx, [[gx - 60, gy - 220], [gx + 60, gy - 220], [gx + 50, gy], [gx - 50, gy]], 'rgba(200,210,220,.18)');
  fill(ctx, [[gx - 54, gy - 120], [gx + 54, gy - 120], [gx + 50, gy], [gx - 50, gy]], 'rgba(160,180,200,.2)');
  ctx.strokeStyle = 'rgba(230,236,240,.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(gx, gy - 220, 60, 14, 0, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(gx - 40, gy - 200); ctx.lineTo(gx - 36, gy - 20); ctx.stroke();
  // lamp: a fabric drum shade at the top right, glowing
  fill(ctx, [[1500, 0], [1780, 0], [1820, 150], [1460, 150]], vertical(ctx, 0, 150, [[0, '#d8b080'], [1, '#f0d0a0']]));
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(1640, 150); ctx.lineTo(1640, 330); ctx.stroke();
}

function makeRecord(make, rnd) {
  // a flat (unsquashed) record image, rotated each frame then squashed
  const s = REC.r * 2 + 4, c = make(s, s), x = c.getContext('2d'), o = s / 2;
  x.fillStyle = '#0e0e10'; x.beginPath(); x.arc(o, o, REC.r, 0, TAU); x.fill();
  for (let r = REC.r * .38; r < REC.r - 6; r += 2.2) { x.strokeStyle = `rgba(${40 + rnd() * 30},${40 + rnd() * 30},${44 + rnd() * 30},.5)`; x.lineWidth = 1; x.beginPath(); x.arc(o, o, r, 0, TAU); x.stroke(); }
  for (const r of [REC.r * .55, REC.r * .72, REC.r * .86]) { x.strokeStyle = '#060608'; x.lineWidth = 3; x.beginPath(); x.arc(o, o, r, 0, TAU); x.stroke(); }
  // label: a cream paper disc with a red band, print and a logo
  x.fillStyle = '#e4d6b4'; x.beginPath(); x.arc(o, o, REC.r * .34, 0, TAU); x.fill();
  x.fillStyle = '#b83a2e'; x.beginPath(); x.arc(o, o, REC.r * .34, -1.1, .4); x.arc(o, o, REC.r * .2, .4, -1.1, true); x.fill();
  x.fillStyle = '#2a2420'; for (let l = 0; l < 4; l++) x.fillRect(o - 50 + l * 6, o + 30 + l * 12, 90 - l * 14, 4);
  x.font = 'bold 22px serif'; x.textAlign = 'center'; x.fillText('SIDE B', o, o - 40);
  x.fillStyle = '#c8c4bc'; x.beginPath(); x.arc(o, o, 7, 0, TAU); x.fill();
  return c;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(17011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  room(ctx, rnd);
  plinth(ctx);
  sideThings(ctx, rnd);
  paint.applyTexture(ctx, make, 1701, .3, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.46, .48, .6], lights: [paint.LIGHT.lamp(1640, 160, .9, 1100, 700, [1.15, .95, .78])] })(ctx);
  const disc = makeRecord(make, rnd);
  const over = make(W, H), oc = over.getContext('2d');
  // tonearm: a pivot base at the right rear, an S-curved arm, a headshell on the record
  const pivot = [1300, 470], head = [1060, 760];
  oc.fillStyle = '#9a9a9e'; oc.beginPath(); oc.ellipse(pivot[0], pivot[1], 56, 30, 0, 0, TAU); oc.fill();
  oc.fillStyle = '#5a5a5e'; oc.beginPath(); oc.ellipse(pivot[0] + 40, pivot[1] - 40, 28, 18, 0, 0, TAU); oc.fill();

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the record: 4 turns per loop at a slow pace, squashed into the deck's perspective
    target.save(); target.translate(REC.x, REC.y); target.scale(1, SQ); target.rotate(TAU * phase * 4);
    target.drawImage(disc, -disc.width / 2, -disc.height / 2); target.restore();
    // the stationary sheen: two lit wedges of the grooves toward the lamp
    target.save(); target.globalCompositeOperation = 'lighter';
    for (const a of [-.85, -.85 + Math.PI]) {
      const g = target.createRadialGradient(REC.x, REC.y, REC.r * .4, REC.x, REC.y, REC.r);
      g.addColorStop(0, 'rgba(120,110,100,0)'); g.addColorStop(.6, 'rgba(120,110,100,.16)'); g.addColorStop(1, 'rgba(120,110,100,0)');
      target.fillStyle = g; target.beginPath(); target.moveTo(REC.x, REC.y);
      target.ellipse(REC.x, REC.y, REC.r, REC.r * SQ, 0, a - .22, a + .22); target.fill();
    }
    target.restore();
    target.drawImage(over, 0, 0);
    // the arm, rising and falling a little with the record's warp
    const warp = Math.sin(TAU * phase * 4) * 3, hx = head[0], hy = head[1] + warp;
    target.strokeStyle = 'rgba(0,0,0,.35)'; target.lineWidth = 10; target.beginPath(); target.moveTo(pivot[0], pivot[1] + 30); target.quadraticCurveTo(1240, 720, hx + 10, hy + 40); target.stroke();
    target.strokeStyle = '#c8c8cc'; target.lineWidth = 9; target.lineCap = 'round'; target.beginPath(); target.moveTo(...pivot); target.quadraticCurveTo(1250, 680, hx, hy); target.stroke();
    target.strokeStyle = 'rgba(255,255,255,.5)'; target.lineWidth = 2; target.beginPath(); target.moveTo(pivot[0] - 3, pivot[1] - 3); target.quadraticCurveTo(1246, 676, hx - 3, hy - 3); target.stroke();
    fill(target, [[hx - 40, hy - 6], [hx + 10, hy - 14], [hx + 16, hy + 10], [hx - 34, hy + 18]], '#2a2a2e');
    target.fillStyle = '#ff9a5a'; target.beginPath(); target.arc(470, 950, 4 + Math.sin(TAU * phase * 8) * .5, 0, TAU); target.fill();
    // dust motes in the lamp light
    for (let i = 0; i < 24; i++) { const lap = ((i * 47 + phase * 600) % 600) / 600, x = 1300 + Math.sin(i * 3.1 + TAU * phase) * 300, y = 120 + lap * 600; const a = .5 * Math.sin(Math.PI * lap); if (a > .01) glow(target, x, y, 3, 3, '255,230,190', a); }
  };
}

module.exports = {
  title: '오래된 턴테이블의 한 바퀴',
  slug: 'turntable-last-side',
  sound: 'record',
  createScene,
};
