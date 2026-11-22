'use strict';

// 21 · 천 조각과 재봉등
// A sewing corner at night while it rains. An old black sewing machine with gold decals sits on a table,
// its little lamp lighting a run of floral cotton under the presser foot. Around it: a tomato pincushion
// bristling with pins, wooden spools of thread, shears, a tape measure trailing off the edge, a pile of
// cut squares in blues and ochres. On the wall a cork board of pinned swatches and paper patterns. A
// rain-dark window behind; drops run down the pane. The tape measure sways a little.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}
const WIN = { x0: 1180, x1: 1820, y0: 40, y1: 520 };

function floral(ctx, rnd, pts, base, bloom) {
  ctx.save(); pathOf(ctx, pts); ctx.clip();
  ctx.fillStyle = base; ctx.fill();
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  for (let i = 0; i < 160; i++) {
    const x = lerp(Math.min(...xs), Math.max(...xs), rnd()), y = lerp(Math.min(...ys), Math.max(...ys), rnd());
    for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; ctx.fillStyle = bloom; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(70,110,60,.8)'; ctx.beginPath(); ctx.ellipse(x + 10, y + 6, 6, 2.5, .6, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function room(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, 620, [[0, '#2a2a30'], [1, '#34323a']]); ctx.fillRect(0, 0, W, 620);
  // window: rainy night outside, a far streetlight
  fill(ctx, [[WIN.x0, WIN.y0], [WIN.x1, WIN.y0], [WIN.x1, WIN.y1], [WIN.x0, WIN.y1]], vertical(ctx, WIN.y0, WIN.y1, [[0, '#0e1420'], [1, '#1a2230']]));
  glow(ctx, 1600, 330, 90, 90, '255,200,130', .4);
  ctx.strokeStyle = '#c8c2b4'; ctx.lineWidth = 18; ctx.strokeRect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
  ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(WIN.x0, 280); ctx.lineTo(WIN.x1, 280); ctx.moveTo(1500, WIN.y0); ctx.lineTo(1500, WIN.y1); ctx.stroke();
  // cork board with swatches and a paper pattern
  fill(ctx, [[120, 60], [960, 60], [960, 500], [120, 500]], '#a8804e');
  for (let i = 0; i < 2000; i++) { ctx.fillStyle = `rgba(${rnd() < .5 ? '80,50,30' : '200,160,110'},.25)`; ctx.fillRect(120 + rnd() * 840, 60 + rnd() * 440, 2, 2); }
  ctx.strokeStyle = '#5a3e26'; ctx.lineWidth = 14; ctx.strokeRect(120, 60, 840, 440);
  fill(ctx, [[540, 90], [920, 110], [900, 470], [520, 450]], '#d8cca8');
  ctx.strokeStyle = 'rgba(60,60,80,.6)'; ctx.lineWidth = 2; ctx.setLineDash([10, 6]); ctx.beginPath(); ctx.moveTo(580, 140); ctx.bezierCurveTo(760, 120, 860, 220, 840, 420); ctx.lineTo(580, 400); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  const sw = [['#3a5a8a', '#e8e0d0'], ['#c8883a', '#8a3a2a'], ['#5a7a5a', '#e8d8b0'], ['#8a3a4a', '#f0e0c8'], ['#2a3a5a', '#c8b060']];
  sw.forEach(([b, f], i) => { const x = 170 + (i % 3) * 120, y = 110 + Math.floor(i / 3) * 170, q = [[x, y], [x + 100, y + 6], [x + 96, y + 130], [x - 4, y + 124]]; floral(ctx, rnd, q, b, f); ctx.fillStyle = '#d83a3a'; ctx.beginPath(); ctx.arc(x + 50, y + 10, 6, 0, TAU); ctx.fill(); });
  // the table
  fill(ctx, [[0, 600], [W, 600], [W, H], [0, H]], vertical(ctx, 600, H, [[0, '#5a4030'], [1, '#2a1e16']]));
  fill(ctx, [[0, 600], [W, 600], [W, 616], [0, 616]], '#6a4c36');
}

function machine(ctx, rnd) {
  // fabric under the foot first
  floral(ctx, rnd, [[340, 820], [1300, 780], [1420, 1000], [300, 1060]], '#dcd0b8', '#c84a5a');
  // base, the arched arm, the head, the wheel at the right
  fill(ctx, [[500, 800], [1240, 800], [1260, 860], [480, 860]], '#141416');
  ctx.fillStyle = '#18181c';
  ctx.beginPath(); ctx.moveTo(1120, 800); ctx.lineTo(1120, 420); ctx.quadraticCurveTo(1120, 360, 1060, 360); ctx.lineTo(620, 360); ctx.quadraticCurveTo(560, 360, 560, 420); ctx.lineTo(560, 520); ctx.lineTo(640, 520); ctx.lineTo(640, 450); ctx.lineTo(1040, 450); ctx.lineTo(1040, 800); ctx.fill();
  fill(ctx, [[540, 400], [660, 400], [660, 640], [540, 640]], '#1e1e22');
  // gold decals and a sheen along the arm
  ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) { const x = 680 + i * 60; ctx.beginPath(); ctx.moveTo(x, 380); ctx.bezierCurveTo(x + 20, 370, x + 30, 400, x + 50, 388); ctx.stroke(); }
  ctx.fillStyle = '#c8a050'; ctx.font = 'italic bold 30px serif'; ctx.fillText('Cordelia', 760, 432);
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(640, 372); ctx.lineTo(1060, 372); ctx.stroke();
  // needle bar and presser foot
  ctx.fillStyle = '#9a9a9e'; ctx.fillRect(590, 640, 12, 110); ctx.fillRect(570, 750, 50, 10);
  // hand wheel
  ctx.fillStyle = '#2a2a2e'; ctx.beginPath(); ctx.ellipse(1140, 480, 30, 90, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#8a8a8e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(1140, 480, 26, 84, 0, 0, TAU); ctx.stroke();
  // spool pin with a spool on top
  ctx.fillStyle = '#c8a06a'; ctx.fillRect(880, 300, 40, 60); ctx.fillStyle = '#3a6a8a'; ctx.fillRect(884, 310, 32, 40);
  // the lamp under the head
  glow(ctx, 610, 660, 200, 140, '255,220,160', .5);
  // around: pincushion, spools, shears
  ctx.fillStyle = '#c83a32'; ctx.beginPath(); ctx.ellipse(1520, 840, 90, 70, 0, 0, TAU); ctx.fill();
  for (let s = 0; s < 6; s++) { ctx.strokeStyle = 'rgba(80,20,16,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1520, 774); ctx.quadraticCurveTo(1440 + s * 32, 840, 1520, 908); ctx.stroke(); }
  for (let p = 0; p < 18; p++) { const a = rnd() * TAU, r = rnd() * 60, x = 1520 + Math.cos(a) * r, y = 830 + Math.sin(a) * r * .7; ctx.strokeStyle = '#b8b8bc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 20, y - 30); ctx.stroke(); ctx.fillStyle = ['#e8e0d0', '#3a6aa8', '#e8c040', '#5aa85a'][p % 4]; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 20, y - 30, 5, 0, TAU); ctx.fill(); }
  for (let s = 0; s < 4; s++) { const x = 1700 + (s % 2) * 80, y = 760 + Math.floor(s / 2) * 140; ctx.fillStyle = '#c8a06a'; ctx.fillRect(x, y, 56, 16); ctx.fillRect(x, y + 70, 56, 16); ctx.fillStyle = ['#3a5a8a', '#8a3a3a', '#e8d8b0', '#4a7a4a'][s]; ctx.fillRect(x + 6, y + 16, 44, 54); for (let l = 0; l < 10; l++) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x + 6, y + 18 + l * 5, 44, 1); } }
  ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(140, 960); ctx.lineTo(320, 880); ctx.moveTo(140, 880); ctx.lineTo(320, 960); ctx.stroke();
  ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(110, 990, 34, 0, TAU); ctx.arc(110, 850, 34, 0, TAU); ctx.stroke();
  // cut squares
  for (let i = 0; i < 6; i++) { const x = 60 + i * 34, y = 680 - i * 6; fill(ctx, [[x, y], [x + 160, y - 10], [x + 170, y + 120], [x + 10, y + 130]], ['#3a5a8a', '#c8883a', '#e8dcc0', '#2a3a5a', '#a8603a', '#6a8aa8'][i]); }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(21011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  room(ctx, rnd);
  machine(ctx, rnd);
  paint.applyTexture(ctx, make, 2101, .3, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.5, .52, .64], lights: [paint.LIGHT.lamp(610, 660, .9, 700, 500, [1.2, 1, .8]), paint.LIGHT.lamp(1500, 300, .2, 500, 400, [.6, .7, 1])] })(ctx);
  const drops = Array.from({ length: 60 }, () => ({ x: lerp(WIN.x0 + 12, WIN.x1 - 12, rnd()), y: rnd(), turns: 1 + Math.floor(rnd() * 3), len: 8 + rnd() * 26, a: .15 + rnd() * .3 }));
  const beads = Array.from({ length: 40 }, () => ({ x: lerp(WIN.x0 + 12, WIN.x1 - 12, rnd()), y: lerp(WIN.y0 + 12, WIN.y1 - 12, rnd()), r: 2 + rnd() * 4 }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.beginPath(); target.rect(WIN.x0 + 9, WIN.y0 + 9, WIN.x1 - WIN.x0 - 18, WIN.y1 - WIN.y0 - 18); target.clip();
    for (const b of beads) { target.fillStyle = 'rgba(170,186,210,.35)'; target.beginPath(); target.arc(b.x, b.y, b.r, 0, TAU); target.fill(); }
    for (const d of drops) { const y = lerp(WIN.y0 - 30, WIN.y1 + 30, (d.y + phase * d.turns) % 1); target.strokeStyle = `rgba(170,190,220,${d.a})`; target.lineWidth = 1.5; target.beginPath(); target.moveTo(d.x, y); target.lineTo(d.x + 2, y + d.len); target.stroke(); }
    target.restore();
    // the tape measure trailing off the table edge, swaying
    const sw = Math.sin(TAU * phase * 2) * 10;
    target.fillStyle = '#e8c840';
    target.beginPath(); target.moveTo(820, 1000); target.quadraticCurveTo(880, 1040, 900 + sw * .5, H); target.lineTo(930 + sw * .5, H); target.quadraticCurveTo(910, 1036, 846, 994); target.fill();
    for (let t = 0; t < 8; t++) { const y = 1010 + t * 10; target.fillStyle = '#2a2a2a'; target.fillRect(860 + t * 6 + sw * t / 16, y, 10, 1.5); }
  };
}

module.exports = {
  title: '천 조각과 재봉등',
  slug: 'sewing-room-fabric',
  sound: 'rain-room',
  createScene,
};
