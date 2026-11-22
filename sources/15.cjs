'use strict';

// 15 · 새벽에 내리는 한 잔의 커피
// Close on a pour-over at a kitchen window before dawn. A ceramic cone dripper sits on a white cup on a
// wooden board; the grounds in its paper filter are dark and wet, and coffee drips from its tip into the
// cup in a slow thread. A gooseneck kettle stands beside it, a bag of beans spilled a little, a spoon. The
// window behind shows the city's roofs going pink under a lavender sky; the glass is fogged at the edges
// with the kitchen's warmth. Steam lifts from the cup; a drop falls every second or so.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, planks } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function windowView(ctx, rnd) {
  ctx.fillStyle = '#1e1a1e'; ctx.fillRect(0, 0, W, H);
  const x0 = 120, x1 = 1800, y0 = 40, y1 = 640;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
  ctx.fillStyle = vertical(ctx, y0, y1, [[0, '#3a3a64'], [.5, '#8a6a8a'], [.85, '#e4a490'], [1, '#f0c0a0']]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  glow(ctx, 1300, y1, 700, 200, '255,200,160', .35);
  // rooftops: a jumble of slopes and chimneys in silhouette, a few windows lit
  for (let i = 0; i < 26; i++) {
    const x = x0 + i * 70 + (rnd() - .5) * 40, w = 60 + rnd() * 80, h = 40 + rnd() * 120, top = y1 - h;
    ctx.fillStyle = shade([40, 34, 46], (rnd() - .5) * 10);
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, top + 20); ctx.lineTo(x + w * (.3 + rnd() * .4), top); ctx.lineTo(x + w, top + 20); ctx.lineTo(x + w, y1); ctx.fill();
    if (rnd() < .5) { ctx.fillRect(x + w * .7, top - 20, 10, 24); }
    if (rnd() < .3) { ctx.fillStyle = '#f0c088'; ctx.fillRect(x + w * .3, top + 40, 8, 10); }
  }
  // fog creeping in from the glass's edges
  const fog = ctx.createRadialGradient(960, 340, 400, 960, 340, 1000);
  fog.addColorStop(0, 'rgba(220,210,214,0)'); fog.addColorStop(1, 'rgba(220,210,214,.45)');
  ctx.fillStyle = fog; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.restore();
  // the window frame and sill
  ctx.strokeStyle = '#d8d0c4'; ctx.lineWidth = 22; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(960, y0); ctx.lineTo(960, y1); ctx.stroke();
  fill(ctx, [[60, y1 + 10], [1860, y1 + 10], [1900, y1 + 50], [20, y1 + 50]], '#c8c0b2');
}

function board(ctx, rnd) {
  fill(ctx, [[0, 700], [W, 700], [W, H], [0, H]], '#2a221c');
  planks(ctx, [[0, 720], [W, 720], [W, H], [0, H]], rnd, { along: 'u', width: [.18, .24], base: [120, 84, 56], vary: 18, streaks: 2 });
  // a cutting board under the cup
  fill(ctx, [[640, 840], [1320, 840], [1380, 1000], [580, 1000]], '#a8804e');
  fill(ctx, [[580, 1000], [1380, 1000], [1380, 1016], [580, 1016]], '#6a4a2e');
  // spilled beans
  for (let i = 0; i < 26; i++) {
    const x = 300 + rnd() * 260, y = 900 + rnd() * 90, a = rnd() * TAU;
    ctx.fillStyle = shade([70, 40, 26], (rnd() - .5) * 20); ctx.beginPath(); ctx.ellipse(x, y, 13, 9, a, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(20,10,6,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 9, y - Math.sin(a) * 9); ctx.quadraticCurveTo(x, y + 2, x + Math.cos(a) * 9, y + Math.sin(a) * 9); ctx.stroke();
  }
  fill(ctx, [[180, 800], [420, 790], [440, 960], [200, 980]], '#b89a70');
  fill(ctx, [[180, 800], [420, 790], [400, 760], [210, 770]], '#9a7e58');
}

// Cup, dripper and kettle in a gentle three-quarter view.
function brew(ctx) {
  const cx = 980, cy = 900;
  // cup: white ceramic, a handle, the coffee inside catching the window
  fill(ctx, [[cx - 120, cy - 150], [cx + 120, cy - 150], [cx + 104, cy], [cx - 104, cy]], vertical(ctx, cy - 150, cy, [[0, '#f0ece4'], [1, '#c8c0b4']]));
  ctx.fillStyle = 'rgba(100,90,80,.35)'; ctx.fillRect(cx + 40, cy - 150, 60, 150);
  ctx.fillStyle = '#e8e4dc'; ctx.beginPath(); ctx.ellipse(cx, cy - 150, 120, 26, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#d8d2c8'; ctx.lineWidth = 18; ctx.beginPath(); ctx.ellipse(cx + 140, cy - 80, 34, 46, 0, -1.3, 1.3); ctx.stroke();
  ctx.fillStyle = '#e8e2d8'; ctx.beginPath(); ctx.ellipse(cx, cy + 4, 160, 22, 0, 0, TAU); ctx.fill();
  // dripper: a ribbed ceramic cone with the filter and wet grounds showing at the top
  const dTop = cy - 360, dBot = cy - 160;
  fill(ctx, [[cx - 150, dTop], [cx + 150, dTop], [cx + 40, dBot], [cx - 40, dBot]], vertical(ctx, dTop, dBot, [[0, '#d8a68a'], [1, '#a46a50']]));
  for (let r = -4; r <= 4; r++) { ctx.strokeStyle = 'rgba(90,50,36,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + r * 32, dTop + 10); ctx.lineTo(cx + r * 8, dBot); ctx.stroke(); }
  ctx.fillStyle = '#c4a078'; ctx.beginPath(); ctx.ellipse(cx, dTop, 150, 30, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#efe6d6'; ctx.beginPath(); ctx.ellipse(cx, dTop - 6, 136, 24, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.ellipse(cx, dTop + 2, 110, 16, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(200,150,110,.35)'; ctx.beginPath(); ctx.ellipse(cx - 30, dTop, 40, 6, 0, 0, TAU); ctx.fill();
  fill(ctx, [[cx - 160, dBot - 4], [cx + 160, dBot - 4], [cx + 170, dBot + 10], [cx - 170, dBot + 10]], '#a86a50');
  // gooseneck kettle to the right: matte black, the long thin spout curving toward the dripper
  const kx = 1500, ky = 880;
  fill(ctx, [[kx - 140, ky - 210], [kx + 140, ky - 210], [kx + 160, ky], [kx - 160, ky]], vertical(ctx, ky - 210, ky, [[0, '#3a3a3e'], [1, '#18181a']]));
  ctx.fillStyle = '#2a2a2e'; ctx.beginPath(); ctx.ellipse(kx, ky - 210, 140, 24, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(200,190,200,.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(kx - 120, ky - 190); ctx.lineTo(kx - 132, ky - 20); ctx.stroke();
  ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(kx - 150, ky - 40); ctx.quadraticCurveTo(kx - 260, ky - 60, kx - 290, ky - 300); ctx.quadraticCurveTo(kx - 300, ky - 340, kx - 340, ky - 330); ctx.stroke();
  ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(kx + 120, ky - 170); ctx.quadraticCurveTo(kx + 230, ky - 130, kx + 140, ky - 30); ctx.stroke();
  return { tip: [cx, dBot + 12], surface: cy - 150 };
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(15011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  windowView(ctx, rnd);
  board(ctx, rnd);
  const b = brew(ctx);
  paint.applyTexture(ctx, make, 1501, .3, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.7, .64, .72], lights: [paint.LIGHT.lamp(1300, 640, .18, 900, 400, [1.1, .9, .85])] })(ctx);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // drips from the dripper's tip into the cup: several per loop
    for (let d = 0; d < 6; d++) {
      const t = (phase * 6 + d / 6 * 0) % 1;
      if (d) break;
      const y = lerp(b.tip[1], b.surface - 10, Math.min(1, t * 2.2));
      if (t < .45) { target.fillStyle = 'rgba(60,30,16,.9)'; target.beginPath(); target.ellipse(b.tip[0], y, 4, 7, 0, 0, TAU); target.fill(); }
      else { const r = (t - .45) / .55; target.strokeStyle = `rgba(200,150,110,${.5 * (1 - r)})`; target.lineWidth = 1.5; target.beginPath(); target.ellipse(b.tip[0], b.surface - 8, 8 + r * 70, 2 + r * 12, 0, 0, TAU); target.stroke(); }
    }
    // steam from the cup and from the grounds, curling as it climbs past the window
    for (let i = 0; i < 10; i++) {
      const t = (phase * 2 + i / 10) % 1;
      glow(target, 980 + Math.sin(t * 6 + i) * 40 * t + (i % 2 ? 60 : -60) * t, b.surface - 220 - t * 400, 20 + t * 60, 14 + t * 40, '240,236,236', .16 * (1 - t));
    }
  };
}

module.exports = {
  title: '새벽에 내리는 한 잔의 커피',
  slug: 'predawn-coffee-dripper',
  sound: 'rain-room',
  createScene,
};
