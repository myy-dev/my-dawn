'use strict';

// 06 · 달빛 해안을 지나는 야간열차
// Inside a night train running along a coast, looking out past a small table. The window is a big rounded
// rectangle in the carriage wall; through it the moonlit sea, the moon's path broken on the swell, a dark
// headland far off with a town's few lights, and close by the shore rushing past: rocks, a fence, telegraph
// poles flicking by. Everything outside slides at its own speed — near things fast, the far coast slowly,
// the moon not at all. Inside: worn velvet seat edge, a reading lamp, a cup of tea trembling with the rails.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, noise, pathOf } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
const WIN = { x: 300, y: 120, w: 1360, h: 640, r: 90 }, SEA = 470;

// A strip that tiles horizontally every `period` px, so sliding it loops cleanly.
function strip(make, period, height, draw) { const c = make(period, height); draw(c.getContext('2d'), period, height); return c; }

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(6011);
  // static sky and sea
  const outside = make(W, H), oc = outside.getContext('2d');
  const sky = oc.createLinearGradient(0, WIN.y, 0, SEA); sky.addColorStop(0, '#0a1226'); sky.addColorStop(1, '#22304a');
  oc.fillStyle = sky; oc.fillRect(0, 0, W, SEA);
  paint.starfield(oc, rnd, 200, SEA - 40);
  const moon = [1240, 250];
  glow(oc, moon[0], moon[1], 220, 220, '210,220,240', .2); oc.fillStyle = '#eef2f6'; oc.beginPath(); oc.arc(moon[0], moon[1], 26, 0, TAU); oc.fill();
  const sea = oc.createLinearGradient(0, SEA, 0, H); sea.addColorStop(0, '#1e2a3e'); sea.addColorStop(1, '#0a1018');
  oc.fillStyle = sea; oc.fillRect(0, SEA, W, H);
  // layers that slide: far coast (slow), near shore and rocks (fast), poles (fastest)
  const far = strip(make, 2400, 120, (c, w, h) => {
    c.fillStyle = '#0e141e'; c.beginPath(); c.moveTo(0, h);
    const per = x => Math.sin(TAU * x / w * 3 + 1) * .5 + Math.sin(TAU * x / w * 7 + 2) * .3 + Math.sin(TAU * x / w * 17) * .12;
    for (let x = 0; x <= w; x += 10) c.lineTo(x, h - 30 - 50 * Math.max(0, per(x) + .2));
    c.lineTo(w, h); c.fill();
    for (let i = 0; i < 18; i++) { const x = (300 + i * 37 + (i % 3) * 11) % w; glow(c, x, h - 14 - (i % 4) * 4, 3, 3, '255,200,130', .9); }
  });
  const near = strip(make, 1900, 260, (c, w, h) => {
    c.fillStyle = '#080a0e'; c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 6) c.lineTo(x, 130 + 22 * Math.sin(TAU * x / w * 5) + 12 * Math.sin(TAU * x / w * 13 + 1) + 6 * Math.sin(TAU * x / w * 41 + 2)); c.lineTo(w, h); c.fill();
    for (let i = 0; i < 26; i++) { const x = (i + .5) * w / 26, y = 110 + (i % 5) * 10; c.fillStyle = '#12151c'; c.beginPath(); c.ellipse(x, y + 40, 30 + (i % 4) * 14, 16 + (i % 3) * 6, 0, Math.PI, TAU); c.fill(); c.strokeStyle = 'rgba(170,190,220,.25)'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y + 40, 30 + (i % 4) * 14, 16 + (i % 3) * 6, 0, Math.PI * 1.2, Math.PI * 1.6); c.stroke(); }
    c.strokeStyle = '#06070a'; c.lineWidth = 2; for (let x = 0; x < w; x += 38) { c.beginPath(); c.moveTo(x, 70); c.lineTo(x, 130); c.stroke(); } c.beginPath(); c.moveTo(0, 82); c.lineTo(w, 82); c.moveTo(0, 104); c.lineTo(w, 104); c.stroke();
  });
  const poles = strip(make, 1700, WIN.h + 200, (c, w, h) => {
    c.strokeStyle = '#030406'; c.lineWidth = 16; c.beginPath(); c.moveTo(300, 0); c.lineTo(300, h); c.stroke();
    c.lineWidth = 8; c.beginPath(); c.moveTo(240, 70); c.lineTo(360, 70); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(0, 80); c.quadraticCurveTo(w / 2, 150, w, 80); c.moveTo(0, 100); c.quadraticCurveTo(w / 2, 170, w, 100); c.stroke();
  });
  // the carriage interior over everything, with the window cut out
  const inside = make(W, H), ic = inside.getContext('2d');
  const wall = ic.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#3a2a28'); wall.addColorStop(1, '#22181a');
  ic.fillStyle = wall; ic.fillRect(0, 0, W, H);
  paint.planks(ic, [[0, 0], [W, 0], [W, H], [0, H]], rnd, { along: 'v', width: [.05, .07], base: [86, 58, 46], vary: 10, streaks: 2 });
  // a curtain tied back at the left, the seat back's edge, the table and the cup, a reading lamp
  ic.fillStyle = '#5a1e22'; ic.beginPath(); ic.moveTo(160, 0); ic.lineTo(400, 0); ic.quadraticCurveTo(330, 360, 400, 520); ic.quadraticCurveTo(300, 600, 200, 1000); ic.lineTo(120, 1000); ic.quadraticCurveTo(220, 600, 280, 520); ic.quadraticCurveTo(200, 360, 160, 0); ic.fill();
  for (let f = 0; f < 6; f++) { ic.strokeStyle = 'rgba(0,0,0,.3)'; ic.lineWidth = 3; ic.beginPath(); ic.moveTo(190 + f * 36, 0); ic.quadraticCurveTo(260 + f * 10, 360, 300 + f * 6, 520); ic.stroke(); }
  ic.fillStyle = '#c8a050'; ic.fillRect(270, 500, 60, 22);
  fill(ic, [[0, 760], [420, 740], [520, H], [0, H]], '#3a2a4a');
  for (let i = 0; i < 400; i++) { ic.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '120,100,140'},.12)`; ic.fillRect(rnd() * 480, 760 + rnd() * 320, 3, 3); }
  fill(ic, [[1220, 820], [1920, 800], [1920, 860], [1240, 880]], '#6a4a32');
  fill(ic, [[1240, 880], [1920, 860], [1920, 900], [1250, 912]], '#3a2818');
  ic.fillStyle = '#c8a050'; ic.fillRect(1760, 140, 20, 120); ic.beginPath(); ic.ellipse(1770, 140, 50, 22, 0, Math.PI, TAU); ic.fill();
  paint.applyTexture(ic, make, 6012, .32, 0, 0, W, H, true);
  const lamp = paint.lighting(make, { ambient: [.66, .66, .76], lights: [paint.LIGHT.lamp(1770, 300, .45, 600, 500, [1.35, 1, .62])] });
  lamp(ic);
  ic.save(); rrect(ic, WIN.x - 26, WIN.y - 26, WIN.w + 52, WIN.h + 52, WIN.r + 20); ic.fillStyle = '#6a5a48'; ic.fill(); rrect(ic, WIN.x - 12, WIN.y - 12, WIN.w + 24, WIN.h + 24, WIN.r + 8); ic.fillStyle = '#2a201c'; ic.fill();
  ic.globalCompositeOperation = 'destination-out'; rrect(ic, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); ic.fill(); ic.restore();
  const cup = [1520, 830];
  const moonPath = Array.from({ length: 70 }, () => ({ y: lerp(SEA + 4, WIN.y + WIN.h, rnd() ** 1.4), dx: (rnd() - .5), lag: rnd() * TAU }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    const sway = Math.sin(TAU * phase * 6) * 1.5;
    target.drawImage(outside, 0, 0);
    // the moon's path on the swell: short bright dashes that shimmer
    for (const m of moonPath) { const w = lerp(6, 70, (m.y - SEA) / (H - SEA)); glow(target, moon[0] + m.dx * w * 2.4, m.y, w * (.5 + .5 * Math.sin(TAU * phase * 3 + m.lag)), 2 + (m.y - SEA) * .01, '220,230,246', .3); }
    // sliding layers: far coast 1 period per loop, near shore 6 periods, poles 9 periods
    const slide = (img, periods, y) => { const off = (phase * periods % 1) * img.width; for (let x = -off; x < W; x += img.width) target.drawImage(img, x, y); };
    slide(far, 1, SEA - 110);
    slide(near, 6, WIN.y + WIN.h - 200 + sway);
    slide(poles, 9, WIN.y - 60 + sway);
    // a faint reflection of the lamp in the glass
    glow(target, 1640, 300, 160, 120, '255,200,140', .08);
    target.drawImage(inside, 0, sway * .4);
    // the cup on the table with tea trembling
    target.fillStyle = '#e8e2d8'; target.beginPath(); target.ellipse(cup[0], cup[1] + sway * .4, 70, 16, 0, 0, TAU); target.fill();
    fill(target, [[cup[0] - 44, cup[1] - 70 + sway * .4], [cup[0] + 44, cup[1] - 70 + sway * .4], [cup[0] + 38, cup[1] - 4 + sway * .4], [cup[0] - 38, cup[1] - 4 + sway * .4]], '#ece6dc');
    target.fillStyle = '#7a4a24'; target.beginPath(); target.ellipse(cup[0], cup[1] - 70 + sway * .4, 44, 10, 0, 0, TAU); target.fill();
    for (let r = 1; r < 3; r++) { target.strokeStyle = `rgba(255,220,180,${.3 * Math.abs(Math.sin(TAU * phase * 6 + r))})`; target.lineWidth = 1; target.beginPath(); target.ellipse(cup[0], cup[1] - 70 + sway * .4, 12 * r, 3 * r, 0, 0, TAU); target.stroke(); }
    for (let i = 0; i < 6; i++) { const t = (phase * 2 + i / 6) % 1; glow(target, cup[0] + Math.sin(t * 6 + i) * 10 * t - t * 30, cup[1] - 90 - t * 160, 10 + t * 30, 8 + t * 20, '240,236,230', .14 * (1 - t)); }
  };
}

module.exports = {
  title: '달빛 해안을 지나는 야간열차',
  slug: 'moonlit-coastal-train',
  sound: 'train',
  createScene,
};
