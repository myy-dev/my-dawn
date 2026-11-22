'use strict';

// 20 · 실을 꿰는 제본 작업대
// A bookbinder's bench under a paper-screened window. Folded signatures stand in a sewing frame, linen
// tapes stretched taut from crossbar to bed; a half-sewn book block sits in it with the waxed thread
// hanging from the needle, swaying. Around it the tools: a bone folder, an awl, a pot of paste with a
// brush, a small press with brass screws, a stack of marbled papers. The paper window glows dim blue and
// breathes in and out with the wind; a desk lamp lights the work in a warm circle.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, planks } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function windowWall(ctx, rnd) {
  ctx.fillStyle = '#2a2420'; ctx.fillRect(0, 0, W, 520);
  // the lattice window: a grid of thin wooden bars over paper, the dawn behind it
  const x0 = 260, x1 = 1660, y0 = 30, y1 = 470;
  ctx.fillStyle = vertical(ctx, y0, y1, [[0, '#5a6a86'], [1, '#8a92a6']]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  // the paper's fibres: faint mottling
  for (let i = 0; i < 400; i++) { ctx.fillStyle = `rgba(255,255,255,${rnd() * .05})`; ctx.fillRect(x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0), 6 + rnd() * 30, 1 + rnd() * 2); }
  // a branch's shadow on the paper
  ctx.strokeStyle = 'rgba(40,50,70,.35)'; ctx.lineCap = 'round';
  const twig = (x, y, a, len, w, d) => { const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke(); if (d) for (let k = 0; k < 2; k++) twig(ex, ey, a + (rnd() - .5) * 1.1, len * .7, w * .7, d - 1); };
  twig(x1, 120, Math.PI + .3, 220, 10, 5);
  ctx.strokeStyle = '#3a2a1e'; ctx.lineWidth = 7;
  for (let x = x0; x <= x1; x += 100) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); }
  for (let y = y0; y <= y1; y += 88) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
  ctx.lineWidth = 22; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  return { x0, x1, y0, y1 };
}

function bench(ctx, rnd) {
  fill(ctx, [[0, 500], [W, 500], [W, H], [0, H]], '#3a281a');
  planks(ctx, [[0, 520], [W, 520], [W, H], [0, H]], rnd, { along: 'u', width: [.16, .22], base: [140, 100, 64], vary: 18, streaks: 3 });
  fill(ctx, [[0, 500], [W, 500], [W, 524], [0, 524]], '#5a3e26');
  // marbled papers at the left, stacked a little askew
  for (let i = 0; i < 5; i++) {
    const dx = i * 6 - 12, dy = -i * 8;
    fill(ctx, [[80 + dx, 760 + dy], [460 + dx, 740 + dy], [480 + dx, 920 + dy], [100 + dx, 940 + dy]], ['#2a3a6a', '#8a3a3a', '#3a6a5a', '#c8a050', '#5a3a6a'][i]);
  }
  const top = { x0: 104, y0: 716 };
  for (let i = 0; i < 40; i++) { ctx.strokeStyle = ['rgba(240,220,180,.6)', 'rgba(200,60,60,.6)', 'rgba(30,40,80,.6)'][i % 3]; ctx.lineWidth = 2 + rnd() * 3; ctx.beginPath(); const y = top.y0 + 10 + rnd() * 170; ctx.moveTo(top.x0 + 10, y); ctx.bezierCurveTo(top.x0 + 120, y - 30 + rnd() * 60, top.x0 + 240, y - 30 + rnd() * 60, top.x0 + 360, y + (rnd() - .5) * 20); ctx.stroke(); }
  // the press: two boards with brass screws
  fill(ctx, [[1420, 640], [1800, 640], [1800, 700], [1420, 700]], '#6a4a2e');
  fill(ctx, [[1420, 760], [1800, 760], [1800, 820], [1420, 820]], '#6a4a2e');
  fill(ctx, [[1440, 700], [1780, 700], [1780, 760], [1440, 760]], '#e4dac4');
  for (const x of [1470, 1750]) { ctx.fillStyle = '#c8a050'; ctx.fillRect(x - 8, 560, 16, 80); ctx.beginPath(); ctx.ellipse(x, 560, 34, 12, 0, 0, TAU); ctx.fill(); }
  // paste pot with brush, bone folder, awl
  ctx.fillStyle = '#c8c0b0'; ctx.beginPath(); ctx.ellipse(1240, 930, 80, 26, 0, 0, TAU); ctx.fill(); fill(ctx, [[1160, 930], [1320, 930], [1310, 1010], [1170, 1010]], '#a8a090');
  ctx.fillStyle = '#f0ece0'; ctx.beginPath(); ctx.ellipse(1240, 930, 66, 20, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(1240, 930); ctx.lineTo(1330, 790); ctx.stroke();
  fill(ctx, [[560, 980], [900, 950], [904, 968], [562, 1000]], '#e8e0cc');
  ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(960, 1000); ctx.lineTo(1060, 980); ctx.stroke();
  ctx.strokeStyle = '#b0b0b4'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(1060, 980); ctx.lineTo(1140, 966); ctx.stroke();
}

// The sewing frame with the book block.
function frame(ctx) {
  const x0 = 640, x1 = 1280, bed = 800, bar = 330;
  fill(ctx, [[x0 - 60, bed], [x1 + 60, bed], [x1 + 60, bed + 40], [x0 - 60, bed + 40]], '#7a5232');
  for (const x of [x0, x1]) { fill(ctx, [[x - 16, bar], [x + 16, bar], [x + 16, bed], [x - 16, bed]], '#8a5e3a'); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x + 4, bar, 12, bed - bar); }
  fill(ctx, [[x0 - 30, bar - 30], [x1 + 30, bar - 30], [x1 + 30, bar], [x0 - 30, bar]], '#8a5e3a');
  // tapes
  for (const x of [780, 900, 1020, 1140]) { fill(ctx, [[x - 10, bar], [x + 10, bar], [x + 10, bed], [x - 10, bed]], '#e4dcc8'); }
  // book block: a stack of folded signatures seen from the spine, each a thin curved bundle
  for (let s = 0; s < 14; s++) {
    const y = bed - 12 - s * 14, sewn = s < 9;
    ctx.fillStyle = shade([228, 220, 200], -s * 2); ctx.beginPath(); ctx.moveTo(700, y); ctx.quadraticCurveTo(960, y - 6, 1220, y); ctx.lineTo(1220, y + 12); ctx.quadraticCurveTo(960, y + 6, 700, y + 12); ctx.fill();
    ctx.strokeStyle = 'rgba(120,100,80,.5)'; ctx.lineWidth = 1; ctx.stroke();
    if (sewn) for (const x of [780, 900, 1020, 1140]) { ctx.strokeStyle = '#d8b080'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 16, y + 6); ctx.lineTo(x + 16, y + 6); ctx.stroke(); }
  }
  return { top: bed - 12 - 13 * 14, start: [1140, bed - 12 - 8 * 14 + 6] };
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(20011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const win = windowWall(ctx, rnd);
  bench(ctx, rnd);
  const f = frame(ctx);
  paint.applyTexture(ctx, make, 2001, .3, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.55, .56, .68], lights: [paint.LIGHT.lamp(1500, 300, .8, 900, 600, [1.15, .95, .75])] })(ctx);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the paper breathing: a soft brightening as the wind presses on it
    const gust = .5 + .5 * Math.sin(TAU * phase * 2) * Math.sin(TAU * phase * 3);
    glow(target, (win.x0 + win.x1) / 2, (win.y0 + win.y1) / 2, 700, 240, '170,186,220', .06 + .05 * gust);
    // the thread: from the last stitch up to the needle, swaying as a pendulum
    const sw = Math.sin(TAU * phase * 3) * .12 + Math.sin(TAU * phase * 2) * .04, len = 260;
    const [sx, sy] = f.start, nx = sx + 60 + Math.sin(sw) * len, ny = sy + Math.cos(sw) * len - 380;
    target.strokeStyle = '#e0c088'; target.lineWidth = 2; target.beginPath(); target.moveTo(sx, sy); target.quadraticCurveTo(sx + 90, sy - 120 + Math.sin(sw) * 40, nx, ny); target.stroke();
    target.strokeStyle = '#d8d8dc'; target.lineWidth = 3; target.beginPath(); target.moveTo(nx, ny); target.lineTo(nx + Math.sin(sw) * 50, ny - 70); target.stroke();
    glow(target, nx, ny - 30, 6, 30, '255,255,255', .3);
  };
}

module.exports = {
  title: '실을 꿰는 제본 작업대',
  slug: 'quiet-bookbinding-bench',
  sound: 'room-wind',
  createScene,
};
