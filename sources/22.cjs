'use strict';

// 22 · 회중시계를 고치는 방
// Looking down at a watchmaker's bench under a magnifier lamp. On a green baize mat lies an open pocket
// watch: its case back open on a hinge, the movement exposed: gilded plates, red jewels in gold
// chatons, blued screws, the escape wheel, and the balance wheel swinging back and forth with its
// hairspring breathing. Beside it the dial with its black numerals, the hands laid out, tweezers,
// a loupe, a tray of tiny screws, an oiler. The ring lamp throws a pool of cool-white light.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
const MOV = { x: 900, y: 560, r: 330 };
const BAL = { x: 1060, y: 470, r: 96 };
const ESC = { x: 860, y: 430, r: 44 };

function gear(ctx, x, y, r, teeth, a, fillStyle) {
  ctx.fillStyle = fillStyle; ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) { const t = a + i / (teeth * 2) * TAU, rr = i % 2 ? r : r * .9; i ? ctx.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr) : ctx.moveTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.35)'; for (let s = 0; s < 4; s++) { const t = a + s * TAU / 4; ctx.beginPath(); ctx.arc(x + Math.cos(t) * r * .5, y + Math.sin(t) * r * .5, r * .22, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#b8304a'; ctx.beginPath(); ctx.arc(x, y, Math.max(3, r * .08), 0, TAU); ctx.fill();
}

function bench(ctx, rnd) {
  ctx.fillStyle = '#1a2e24'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 6000; i++) { ctx.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '80,120,90'},.12)`; ctx.fillRect(rnd() * W, rnd() * H, 2, 2); }
  // the case: a gold circle with milled edge, the back open on its hinge to the left
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(MOV.x + 30, MOV.y + 30, MOV.r + 40, MOV.r + 40, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#b08a3a'; ctx.beginPath(); ctx.arc(MOV.x, MOV.y, MOV.r + 36, 0, TAU); ctx.fill();
  for (let i = 0; i < 180; i++) { const a = i / 180 * TAU; ctx.strokeStyle = i % 2 ? '#8a6a2a' : '#d8b060'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(MOV.x + Math.cos(a) * (MOV.r + 28), MOV.y + Math.sin(a) * (MOV.r + 28)); ctx.lineTo(MOV.x + Math.cos(a) * (MOV.r + 36), MOV.y + Math.sin(a) * (MOV.r + 36)); ctx.stroke(); }
  const back = [MOV.x - MOV.r * 1.95, MOV.y + 10];
  const bg = ctx.createRadialGradient(back[0] - 60, back[1] - 80, 20, back[0], back[1], MOV.r);
  bg.addColorStop(0, '#f0d08a'); bg.addColorStop(.6, '#b08a3a'); bg.addColorStop(1, '#6a4a1a');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(back[0], back[1], MOV.r * .95, MOV.r * .9, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(80,50,10,.4)'; ctx.lineWidth = 2; for (let r = 40; r < MOV.r * .8; r += 16) { ctx.beginPath(); ctx.ellipse(back[0], back[1], r, r * .95, 0, 0, TAU); ctx.stroke(); }
  fill(ctx, [[MOV.x - MOV.r - 40, MOV.y - 20], [MOV.x - MOV.r - 10, MOV.y - 20], [MOV.x - MOV.r - 10, MOV.y + 40], [MOV.x - MOV.r - 40, MOV.y + 40]], '#8a6a2a');
  // the movement: gilded plate with côtes de Genève stripes, cut away where the wheels show
  ctx.save(); ctx.beginPath(); ctx.arc(MOV.x, MOV.y, MOV.r, 0, TAU); ctx.clip();
  ctx.fillStyle = '#9a7e40'; ctx.fillRect(MOV.x - MOV.r, MOV.y - MOV.r, MOV.r * 2, MOV.r * 2);
  for (let k = -12; k < 12; k++) { ctx.fillStyle = k % 2 ? 'rgba(255,240,200,.14)' : 'rgba(100,70,20,.1)'; ctx.save(); ctx.translate(MOV.x, MOV.y); ctx.rotate(-.5); ctx.fillRect(k * 30, -MOV.r * 1.5, 30, MOV.r * 3); ctx.restore(); }
  // the gear train, partly visible
  gear(ctx, MOV.x - 80, MOV.y + 60, 120, 60, .1, '#b8963e');
  gear(ctx, MOV.x + 100, MOV.y + 150, 70, 40, .3, '#b0903a');
  gear(ctx, MOV.x - 150, MOV.y - 120, 60, 36, .5, '#b8963e');
  // bridges: darker gilded shapes over the wheels with blued screws
  ctx.fillStyle = '#8a6e30';
  ctx.beginPath(); ctx.moveTo(MOV.x - MOV.r, MOV.y + 120); ctx.quadraticCurveTo(MOV.x - 40, MOV.y + 40, MOV.x + 160, MOV.y + 260); ctx.lineTo(MOV.x + 40, MOV.y + MOV.r); ctx.lineTo(MOV.x - MOV.r, MOV.y + MOV.r); ctx.fill();
  for (const [x, y] of [[MOV.x - 200, MOV.y + 180], [MOV.x - 20, MOV.y + 260], [MOV.x + 220, MOV.y - 40], [MOV.x - 240, MOV.y - 40]]) { ctx.fillStyle = '#2a3a8a'; ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a9ad8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.stroke(); }
  for (const [x, y] of [[MOV.x - 80, MOV.y + 60], [MOV.x + 100, MOV.y + 150], [MOV.x - 150, MOV.y - 120], [MOV.x, MOV.y]]) { ctx.fillStyle = '#d0b060'; ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fill(); ctx.fillStyle = '#c0203a'; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,200,210,.7)'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 2, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(30,20,10,.5)'; ctx.beginPath(); ctx.arc(BAL.x, BAL.y, BAL.r + 16, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(30,20,10,.4)'; ctx.beginPath(); ctx.arc(ESC.x, ESC.y, ESC.r + 8, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.font = 'italic 18px serif'; ctx.fillStyle = 'rgba(80,50,20,.8)'; ctx.fillText('Fifteen Jewels · Adjusted', MOV.x - 140, MOV.y + MOV.r - 60);
  // dial to the right, hands laid on it
  const dx = 1580, dy = 360, dr = 190;
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(dx + 16, dy + 16, dr, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f0ece0'; ctx.beginPath(); ctx.arc(dx, dy, dr, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1a1a'; ctx.font = '30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const roman = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  roman.forEach((n, i) => { const a = i / 12 * TAU - Math.PI / 2; ctx.fillText(n, dx + Math.cos(a) * dr * .78, dy + Math.sin(a) * dr * .78); });
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = i % 5 ? 1 : 2; ctx.beginPath(); ctx.moveTo(dx + Math.cos(a) * dr * .93, dy + Math.sin(a) * dr * .93); ctx.lineTo(dx + Math.cos(a) * dr * .98, dy + Math.sin(a) * dr * .98); ctx.stroke(); }
  ctx.fillStyle = '#e8e4d8'; ctx.beginPath(); ctx.arc(dx, dy + dr * .5, dr * .2, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#1a2a6a'; ctx.beginPath(); ctx.moveTo(1500, 700); ctx.lineTo(1660, 640); ctx.lineTo(1664, 648); ctx.lineTo(1504, 708); ctx.fill();
  ctx.beginPath(); ctx.moveTo(1500, 760); ctx.lineTo(1720, 720); ctx.lineTo(1722, 726); ctx.lineTo(1502, 766); ctx.fill();
  // tweezers, loupe, screws tray, oiler
  ctx.strokeStyle = '#b8b8bc'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(1420, 1010); ctx.lineTo(1780, 900); ctx.moveTo(1420, 1020); ctx.lineTo(1786, 920); ctx.stroke();
  ctx.fillStyle = '#141414'; ctx.beginPath(); ctx.ellipse(300, 960, 110, 70, -.2, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(160,190,210,.3)'; ctx.beginPath(); ctx.ellipse(300, 960, 80, 50, -.2, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(272, 944, 24, 10, -.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d8d4cc'; ctx.beginPath(); ctx.arc(1240, 900, 90, 0, TAU); ctx.fill(); ctx.fillStyle = '#b8b4ac'; ctx.beginPath(); ctx.arc(1240, 900, 78, 0, TAU); ctx.fill();
  for (let i = 0; i < 30; i++) { const a = rnd() * TAU, r = rnd() * 80; ctx.fillStyle = rnd() < .5 ? '#2a3a8a' : '#a8a8ac'; ctx.beginPath(); ctx.arc(1240 + Math.cos(a) * r * .8, 900 + Math.sin(a) * r * .8, 3, 0, TAU); ctx.fill(); }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(22011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  bench(ctx, rnd);
  paint.applyTexture(ctx, make, 2201, .26, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.72, .74, .78], lights: [paint.LIGHT.lamp(900, 520, .32, 900, 700, [1.05, 1.05, 1.1])] })(ctx);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the balance swings 30 full beats per loop; the escape wheel steps a tooth with each tick
    const swing = Math.sin(TAU * phase * 30), a = swing * 2.2;
    const ticks = Math.floor(phase * 60), step = Math.min(1, (phase * 60 - ticks) * 6);
    gear(target, ESC.x, ESC.y, ESC.r, 15, (ticks + step) / 15 * TAU / 4, '#c0c4cc');
    // pallet fork rocking between them
    target.strokeStyle = '#a8a8ae'; target.lineWidth = 6; target.beginPath(); target.moveTo(ESC.x + 30, ESC.y - 10); target.lineTo(BAL.x - 40 + swing * 6, BAL.y + 10); target.stroke();
    // hairspring: a spiral breathing with the swing
    target.strokeStyle = 'rgba(40,50,120,.9)'; target.lineWidth = 1.2; target.beginPath();
    for (let t = 0; t < 1; t += .005) { const r = 10 + t * 56, ang = t * TAU * 8 + a * (1 - t) * .3; target.lineTo(BAL.x + Math.cos(ang) * r * (1 + swing * .02 * t), BAL.y + Math.sin(ang) * r); }
    target.stroke();
    // balance rim with screws and its crossing arms
    target.save(); target.translate(BAL.x, BAL.y); target.rotate(a);
    target.strokeStyle = '#d8b868'; target.lineWidth = 10; target.beginPath(); target.arc(0, 0, BAL.r, 0, TAU); target.stroke();
    target.lineWidth = 6; target.beginPath(); target.moveTo(-BAL.r, 0); target.lineTo(BAL.r, 0); target.stroke();
    for (let s = 0; s < 14; s++) { const t = s / 14 * TAU; target.fillStyle = s % 2 ? '#e8c870' : '#2a3a8a'; target.beginPath(); target.arc(Math.cos(t) * (BAL.r + 7), Math.sin(t) * (BAL.r + 7), 4, 0, TAU); target.fill(); }
    target.fillStyle = 'rgba(255,240,200,.6)'; target.beginPath(); target.arc(-BAL.r * .7, -BAL.r * .7, 3, 0, TAU); target.fill();
    target.restore();
    target.fillStyle = '#c0203a'; target.beginPath(); target.arc(BAL.x, BAL.y, 7, 0, TAU); target.fill();
    // the lamp's ring reflected as a glint that slides over the gilt with the balance
    glow(target, BAL.x + Math.cos(a) * BAL.r, BAL.y + Math.sin(a) * BAL.r, 18, 18, '255,250,230', .5);
  };
}

module.exports = {
  title: '회중시계를 고치는 방',
  slug: 'pocket-watch-repair',
  sound: 'room-wind',
  createScene,
};
