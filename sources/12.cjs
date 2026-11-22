'use strict';

// 12 · 청록빛이 감도는 수초 수조
// A planted aquarium glowing in a dark room before dawn. The long glass tank stands on a dark wooden
// cabinet; inside, a landscape of sand, stones and driftwood is grown over with stem plants, ribbon grass
// and carpeting moss, all swaying in the filter's current. A small school of tetras moves through, light
// rippling down from the surface in caustic patterns onto the sand and spilling teal onto the wall and
// the room. Bubbles rise from the corner.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, planks } = paint;

const TANK = { x0: 300, x1: 1620, top: 220, bottom: 760, surface: 262 };

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function room(ctx, rnd) {
  ctx.fillStyle = '#0c1014'; ctx.fillRect(0, 0, W, H);
  // teal light spilling from the tank onto the wall and the floor
  glow(ctx, 960, 480, 1100, 600, '40,120,120', .35);
  ctx.fillStyle = vertical(ctx, 900, H, [[0, '#14181a'], [1, '#08090a']]); ctx.fillRect(0, 900, W, H);
  // the cabinet
  fill(ctx, [[260, 770], [1660, 770], [1660, 1000], [260, 1000]], '#2a1e18');
  planks(ctx, [[260, 790], [1660, 790], [1660, 1000], [260, 1000]], rnd, { along: 'v', width: [.15, .2], base: [56, 40, 32], vary: 10, streaks: 1 });
  fill(ctx, [[250, 760], [1670, 760], [1670, 792], [250, 792]], '#3a2a22');
  for (const x of [600, 960, 1320]) { ctx.fillStyle = '#8a7a60'; ctx.fillRect(x - 20, 880, 40, 6); }
}

function tankInside(ctx, rnd) {
  const { x0, x1, top, bottom, surface } = TANK;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, top, x1 - x0, bottom - top); ctx.clip();
  ctx.fillStyle = vertical(ctx, top, bottom, [[0, '#2a7a74'], [.6, '#1a5a5a'], [1, '#0e3a3a']]); ctx.fillRect(x0, top, x1 - x0, bottom - top);
  glow(ctx, 960, surface + 20, 700, 120, '170,230,210', .3);
  // the far planting, softened by the water
  for (let i = 0; i < 80; i++) {
    const x = x0 + rnd() * (x1 - x0), h = 120 + rnd() * 260;
    ctx.strokeStyle = shade([60, 120, 90], (rnd() - .5) * 30, .5); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, bottom - 60); ctx.quadraticCurveTo(x + 20, bottom - 60 - h * .6, x + (rnd() - .5) * 40, bottom - 60 - h); ctx.stroke();
  }
  // sand bed rising toward the back, stones and a driftwood branch
  fill(ctx, [[x0, bottom - 90], [x1, bottom - 70], [x1, bottom], [x0, bottom]], vertical(ctx, bottom - 90, bottom, [[0, '#a89a76'], [1, '#6a5e48']]));
  for (let i = 0; i < 9; i++) {
    const x = x0 + 80 + rnd() * (x1 - x0 - 160), y = bottom - 70 - rnd() * 20, r = 20 + rnd() * 50;
    fill(ctx, paint.wobble(Array.from({ length: 9 }, (_, k) => [x + Math.cos(k / 9 * TAU) * r * 1.3, y + Math.sin(k / 9 * TAU) * r * .7 - r * .4]), r * .1, 121 + i, 10), shade([80, 86, 84], (rnd() - .5) * 20));
  }
  ctx.strokeStyle = '#3a2a1e'; ctx.lineCap = 'round';
  const branch = (x, y, a, len, w, d) => { const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke(); if (d) for (let k = 0; k < 2; k++) branch(ex, ey, a + (rnd() - .5) * 1.2, len * .65, w * .6, d - 1); };
  branch(700, bottom - 80, -1, 200, 24, 4);
  // moss carpet: dense dots over the sand's front
  for (let i = 0; i < 1500; i++) { const x = x0 + rnd() * (x1 - x0), y = bottom - 40 - rnd() * 40; ctx.fillStyle = shade([70, 140, 70], (rnd() - .5) * 40, .8); ctx.fillRect(x, y, 3, 3); }
  ctx.restore();
}

function makePlants(rnd) {
  return Array.from({ length: 34 }, () => ({ x: TANK.x0 + 40 + rnd() * (TANK.x1 - TANK.x0 - 80), h: 200 + rnd() * 300, kind: Math.floor(rnd() * 3), lag: rnd() * TAU, tone: rnd() }));
}
function plant(ctx, p, sway) {
  const base = [p.x, TANK.bottom - 50];
  const at = t => [base[0] + Math.sin(sway + t * 2) * 18 * t * t, base[1] - p.h * t];
  if (p.kind === 0) {           // stem plant: a stalk with whorls of small leaves
    ctx.strokeStyle = '#3a7a4a'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 10; i++) { const q = at(i / 10); i ? ctx.lineTo(...q) : ctx.moveTo(...q); } ctx.stroke();
    for (let i = 1; i <= 10; i++) { const q = at(i / 10); for (const s of [-1, 1]) { ctx.fillStyle = p.tone < .3 ? '#a8503a' : shade([80, 160, 80], i * 3); ctx.beginPath(); ctx.ellipse(q[0] + s * 10, q[1], 10, 4, s * .4, 0, TAU); ctx.fill(); } }
  } else if (p.kind === 1) {    // ribbon grass: long flat blades bending in the current
    for (let b = 0; b < 4; b++) { ctx.strokeStyle = shade([60, 130, 80], b * 8, .85); ctx.lineWidth = 5; ctx.beginPath(); for (let i = 0; i <= 10; i++) { const t = i / 10, q = [base[0] + b * 6 + Math.sin(sway + t * 3 + b) * 30 * t, base[1] - p.h * .8 * t]; i ? ctx.lineTo(...q) : ctx.moveTo(...q); } ctx.stroke(); }
  } else {                      // broad-leaved rosette
    for (let l = 0; l < 7; l++) { const a = -Math.PI / 2 + (l - 3) * .35 + Math.sin(sway) * .1, len = p.h * .35; ctx.fillStyle = shade([50, 120, 70], l * 4, .9); ctx.beginPath(); ctx.ellipse(base[0] + Math.cos(a) * len * .5, base[1] + Math.sin(a) * len * .5, len * .5, len * .14, a, 0, TAU); ctx.fill(); }
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(12011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  room(ctx, rnd);
  tankInside(ctx, rnd);
  paint.applyTexture(ctx, make, 1201, .28, 0, 0, W, H, true);
  const plants = makePlants(rnd);
  const fish = Array.from({ length: 14 }, (_, i) => ({ offset: i * .04 + rnd() * .02, dy: (rnd() - .5) * 60, dz: rnd() }));
  const bubbles = Array.from({ length: 30 }, () => ({ x: TANK.x1 - 60 + (rnd() - .5) * 16, offset: rnd(), r: 2 + rnd() * 4 }));
  const { x0, x1, top, bottom, surface } = TANK;

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.beginPath(); target.rect(x0, top, x1 - x0, bottom - top); target.clip();
    for (const p of plants) plant(target, p, Math.sin(TAU * phase * 2 + p.lag) * .5);
    // the school: tetras with a red stripe, swimming a loop around the tank once per cycle
    for (const f of fish) {
      const t = (phase + f.offset) % 1, a = TAU * t;
      const x = 960 + Math.cos(a) * 520, y = 480 + Math.sin(a * 2) * 80 + f.dy, dir = -Math.sin(a) > 0 ? 1 : -1, s = 10 + f.dz * 6;
      target.fillStyle = 'rgba(180,200,210,.9)'; target.beginPath(); target.ellipse(x, y, s * 1.6, s * .55, 0, 0, TAU); target.fill();
      target.fillStyle = '#c83a3a'; target.fillRect(x - s * .8 * dir, y - s * .1, s * 1.2 * dir, s * .2);
      target.fillStyle = 'rgba(80,200,220,.9)'; target.fillRect(x - s * .6 * dir, y - s * .3, s * 1.1 * dir, s * .12);
      target.fillStyle = 'rgba(180,200,210,.7)'; target.beginPath(); target.moveTo(x - s * 1.5 * dir, y); target.lineTo(x - s * 2.3 * dir, y - s * .5); target.lineTo(x - s * 2.3 * dir, y + s * .5); target.fill();
    }
    // caustics: wavering bright lines on the sand from the rippling surface
    for (let i = 0; i < 40; i++) {
      const x = x0 + (i / 40) * (x1 - x0) + Math.sin(TAU * (phase * 2 + i * .3)) * 30, y = bottom - 60 + Math.sin(i * 1.7) * 20;
      target.strokeStyle = `rgba(200,250,230,${.12 + .1 * Math.sin(TAU * (phase * 3 + i * .5))})`; target.lineWidth = 2;
      target.beginPath(); target.moveTo(x, y); target.quadraticCurveTo(x + 30, y - 10, x + 60, y); target.stroke();
    }
    for (const b of bubbles) { const t = (phase * 2 + b.offset) % 1, y = lerp(bottom - 60, surface, t); target.strokeStyle = 'rgba(220,250,240,.7)'; target.lineWidth = 1.2; target.beginPath(); target.arc(b.x + Math.sin(t * 20) * 3, y, b.r, 0, TAU); target.stroke(); }
    // the surface seen from below: a bright wavering line
    target.strokeStyle = 'rgba(220,250,240,.6)'; target.lineWidth = 2; target.beginPath();
    for (let x = x0; x <= x1; x += 20) target.lineTo(x, surface + 3 * Math.sin(x * .02 + TAU * phase * 3)); target.stroke();
    target.restore();
    // the glass frame
    target.strokeStyle = '#1a1e20'; target.lineWidth = 8; target.strokeRect(x0, top, x1 - x0, bottom - top);
    target.fillStyle = '#14181a'; target.fillRect(x0 - 10, top - 18, x1 - x0 + 20, 22);
    glow(target, 960, top - 6, 600, 20, '200,250,240', .25);
  };
}

module.exports = {
  title: '청록빛이 감도는 수초 수조',
  slug: 'quiet-aquarium-plants',
  sound: 'lake',
  createScene,
};
