'use strict';

// 18 · 푸른 불빛이 켜진 카세트
// Close on a hi-fi cassette deck on a shelf in a dark room. Brushed aluminium faceplate, the cassette
// well with its smoked-glass door; through it the tape's two reels turn, the left emptying and the right
// filling, the brown tape running between them past the heads. A row of blue VU meters with needles
// trembling to the music, small blue LEDs, the counter's digits. Its blue light falls on the shelf, a
// pair of headphones, a stack of tapes with handwritten spines. The room behind is lost in dark.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}
const FACE = { x0: 180, x1: 1740, y0: 260, y1: 800 };
const WELL = { x0: 260, x1: 900, y0: 330, y1: 720 };
const REELS = [[430, 520], [730, 520]];

function deck(ctx, rnd) {
  ctx.fillStyle = '#08090c'; ctx.fillRect(0, 0, W, H);
  glow(ctx, 960, 520, 1100, 500, '40,80,160', .25);
  // the shelf below and its front edge
  fill(ctx, [[0, 840], [W, 840], [W, H], [0, H]], vertical(ctx, 840, H, [[0, '#1c1a1e'], [1, '#0c0b0e']]));
  fill(ctx, [[0, 830], [W, 830], [W, 850], [0, 850]], '#2a2628');
  // body and shadow
  fill(ctx, [[FACE.x0 + 20, FACE.y1 + 40], [FACE.x1 + 40, FACE.y1 + 40], [FACE.x1 + 30, FACE.y1], [FACE.x0 + 10, FACE.y1]], 'rgba(0,0,0,.6)');
  fill(ctx, [[FACE.x0, FACE.y0], [FACE.x1, FACE.y0], [FACE.x1, FACE.y1], [FACE.x0, FACE.y1]], '#6a6c72');
  // brushed aluminium: many faint horizontal hairlines
  for (let y = FACE.y0; y < FACE.y1; y += 2) { ctx.strokeStyle = `rgba(${rnd() < .5 ? '255,255,255' : '0,0,0'},${.03 + rnd() * .04})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(FACE.x0, y); ctx.lineTo(FACE.x1, y); ctx.stroke(); }
  ctx.fillStyle = vertical(ctx, FACE.y0, FACE.y1, [[0, 'rgba(255,255,255,.12)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.2)']]); ctx.fillRect(FACE.x0, FACE.y0, FACE.x1 - FACE.x0, FACE.y1 - FACE.y0);
  ctx.strokeStyle = '#2a2c30'; ctx.lineWidth = 3; ctx.strokeRect(FACE.x0, FACE.y0, FACE.x1 - FACE.x0, FACE.y1 - FACE.y0);
  // the cassette well, recessed
  fill(ctx, [[WELL.x0 - 8, WELL.y0 - 8], [WELL.x1 + 8, WELL.y0 - 8], [WELL.x1 + 8, WELL.y1 + 8], [WELL.x0 - 8, WELL.y1 + 8]], '#2a2c30');
  fill(ctx, [[WELL.x0, WELL.y0], [WELL.x1, WELL.y0], [WELL.x1, WELL.y1], [WELL.x0, WELL.y1]], '#101216');
  // the cassette shell: a cream label, the window cut-out, screws
  const c = { x0: 300, x1: 860, y0: 380, y1: 690 };
  fill(ctx, [[c.x0, c.y0], [c.x1, c.y0], [c.x1, c.y1], [c.x0, c.y1]], '#24262a');
  fill(ctx, [[c.x0 + 24, c.y0 + 20], [c.x1 - 24, c.y0 + 20], [c.x1 - 24, c.y0 + 220], [c.x0 + 24, c.y0 + 220]], '#d8ccb0');
  ctx.fillStyle = '#c84a2a'; ctx.fillRect(c.x0 + 24, c.y0 + 34, c.x1 - c.x0 - 48, 10);
  ctx.strokeStyle = '#3a3a6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c.x0 + 60, c.y0 + 74); ctx.bezierCurveTo(c.x0 + 160, c.y0 + 60, c.x0 + 260, c.y0 + 90, c.x0 + 380, c.y0 + 70); ctx.stroke();
  fill(ctx, [[360, 470], [800, 470], [800, 570], [360, 570]], '#0a0a0c');
  fill(ctx, [[c.x0 + 80, c.y1 - 60], [c.x1 - 80, c.y1 - 60], [c.x1 - 110, c.y1], [c.x0 + 110, c.y1]], '#1a1c20');
  for (const [x, y] of [[c.x0 + 14, c.y0 + 14], [c.x1 - 14, c.y0 + 14], [c.x0 + 14, c.y1 - 14], [c.x1 - 14, c.y1 - 14]]) { ctx.fillStyle = '#6a6a6e'; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); }
  // controls on the right: meters panel, counter, transport keys, two knobs
  fill(ctx, [[980, 330], [1660, 330], [1660, 540], [980, 540]], '#0a0e18');
  fill(ctx, [[1000, 600], [1160, 600], [1160, 650], [1000, 650]], '#0a0c10');
  for (let k = 0; k < 6; k++) { const x = 980 + k * 70; fill(ctx, [[x, 700], [x + 60, 700], [x + 60, 750], [x, 750]], vertical(ctx, 700, 750, [[0, '#9a9ca2'], [1, '#5a5c62']])); ctx.fillStyle = '#2a2c30'; ctx.fillRect(x + 22, 718, 16, 14); }
  for (const x of [1480, 1620]) { ctx.fillStyle = '#2a2c30'; ctx.beginPath(); ctx.arc(x, 690, 52, 0, TAU); ctx.fill(); ctx.fillStyle = vertical(ctx, 640, 740, [[0, '#c8cad0'], [1, '#6a6c72']]); ctx.beginPath(); ctx.arc(x, 690, 44, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2a2c30'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, 690); ctx.lineTo(x - 20, 654); ctx.stroke(); }
  // things on the shelf: headphones and a stack of tapes
  ctx.strokeStyle = '#1e1e22'; ctx.lineWidth = 22; ctx.beginPath(); ctx.ellipse(1840, 860, 90, 50, 0, Math.PI, TAU); ctx.stroke();
  for (let i = 0; i < 6; i++) { const y = 900 + i * 26; fill(ctx, [[60, y], [400, y + 4], [400, y + 26], [60, y + 22]], shade([30, 30, 34], i * 3)); fill(ctx, [[80, y + 4], [380, y + 8], [380, y + 20], [80, y + 16]], '#c8c0aa'); ctx.strokeStyle = '#2a2a5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(100, y + 12); ctx.lineTo(160 + rnd() * 160, y + 13); ctx.stroke(); }
}

function reel(ctx, x, y, r, a) {
  ctx.fillStyle = '#4a2e1e'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8e8ec'; ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0a0a0c'; ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8e8ec';
  for (let i = 0; i < 6; i++) { const t = a + i * TAU / 6; ctx.beginPath(); ctx.arc(x + Math.cos(t) * 14, y + Math.sin(t) * 14, 4, 0, TAU); ctx.fill(); }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(18011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  deck(ctx, rnd);
  paint.applyTexture(ctx, make, 1801, .26, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.55, .6, .82], lights: [paint.LIGHT.lamp(1320, 430, .5, 700, 300, [.6, .8, 1.3])] })(ctx);
  const glass = make(W, H), gc = glass.getContext('2d');
  gc.fillStyle = 'rgba(30,40,60,.35)'; gc.fillRect(WELL.x0, WELL.y0, WELL.x1 - WELL.x0, WELL.y1 - WELL.y0);
  gc.fillStyle = 'rgba(200,220,255,.1)'; pathOf(gc, [[WELL.x0, WELL.y0], [WELL.x0 + 200, WELL.y0], [WELL.x0 + 60, WELL.y1], [WELL.x0, WELL.y1]]); gc.fill();

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the reels, seen through the window: the left a little fuller, both turning (integer turns per loop)
    target.save(); target.beginPath(); target.rect(360, 470, 440, 100); target.clip();
    const fillL = 92 - 6 * Math.sin(TAU * phase), fillR = 76 + 6 * Math.sin(TAU * phase);
    reel(target, ...REELS[0], fillL, TAU * phase * 6);
    reel(target, ...REELS[1], fillR, TAU * phase * 7);
    target.strokeStyle = '#3a2418'; target.lineWidth = 2; target.beginPath(); target.moveTo(REELS[0][0], REELS[0][1] + fillL); target.lineTo(REELS[1][0], REELS[1][1] + fillR); target.stroke();
    target.restore();
    target.drawImage(glass, 0, 0);
    // VU meters: two blue faces with scales and needles trembling
    for (let m = 0; m < 2; m++) {
      const x0 = 1010 + m * 330, y0 = 350, w = 300, h = 170;
      target.fillStyle = vertical(target, y0, y0 + h, [[0, '#3a6ac8'], [1, '#1a3a88']]); target.fillRect(x0, y0, w, h);
      glow(target, x0 + w / 2, y0 + h / 2, w * .7, h * .7, '90,150,255', .35);
      target.strokeStyle = 'rgba(230,240,255,.8)'; target.lineWidth = 2; target.beginPath(); target.arc(x0 + w / 2, y0 + h + 40, 170, -2.4, -.74); target.stroke();
      for (let t = 0; t <= 10; t++) { const a = lerp(-2.4, -.74, t / 10); target.strokeStyle = t > 7 ? '#ff6a5a' : 'rgba(230,240,255,.8)'; target.beginPath(); target.moveTo(x0 + w / 2 + Math.cos(a) * 170, y0 + h + 40 + Math.sin(a) * 170); target.lineTo(x0 + w / 2 + Math.cos(a) * 184, y0 + h + 40 + Math.sin(a) * 184); target.stroke(); }
      const level = .45 + .18 * Math.sin(TAU * (phase * 9 + m * .3)) + .1 * Math.sin(TAU * (phase * 23 + m)) + .05 * Math.sin(TAU * phase * 41);
      const a = lerp(-2.4, -.74, level);
      target.strokeStyle = '#141414'; target.lineWidth = 3; target.beginPath(); target.moveTo(x0 + w / 2, y0 + h + 30); target.lineTo(x0 + w / 2 + Math.cos(a) * 180, y0 + h + 40 + Math.sin(a) * 180); target.stroke();
      target.strokeStyle = '#2a2c30'; target.lineWidth = 6; target.strokeRect(x0, y0, w, h);
    }
    // counter and LEDs
    target.fillStyle = '#6ab0ff'; target.font = 'bold 36px monospace'; target.textAlign = 'left';
    target.fillText('0214', 1012, 640);
    for (let i = 0; i < 4; i++) { const on = i === 1 || (i === 3 && Math.sin(TAU * phase * 8) > 0); target.fillStyle = on ? '#7ac0ff' : '#1a2a40'; target.beginPath(); target.arc(1220 + i * 40, 625, 6, 0, TAU); target.fill(); if (on) glow(target, 1220 + i * 40, 625, 20, 20, '120,190,255', .6); }
  };
}

module.exports = {
  title: '푸른 불빛이 켜진 카세트',
  slug: 'blue-cassette-deck',
  sound: 'mechanism',
  createScene,
};
