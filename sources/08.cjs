'use strict';

// 08 · 잿불이 남은 벽난로
// A stone fireplace late at night, the fire burned down. Inside the soot-black firebox, on an iron grate,
// two half-burnt logs have collapsed together, split open and glowing orange in their cracks under a skin
// of grey ash; a bed of embers beneath them breathes brighter and dimmer; one small blue-and-amber flame
// still licks along a log's edge. The fieldstone surround and the hearth slab catch the warm glow; a brass
// fender, a poker and tongs on a stand, a basket of kindling. Sparks drift up now and then.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, noise, pathOf } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
const BOX = { x0: 560, x1: 1360, top: 330, floor: 760, back: { x0: 680, x1: 1240, top: 400, floor: 690 } };

function surround(ctx, rnd) {
  ctx.fillStyle = '#16100c'; ctx.fillRect(0, 0, W, H);
  // the fieldstone chimney breast: irregular stones in mortar, around the opening
  const face = [[260, -10], [1660, -10], [1660, 860], [260, 860]];
  paint.masonry(ctx, face, rnd, { courses: 14, length: [.05, .11], base: [70, 62, 56], vary: 30, mortar: [34, 30, 28] });
  // the mantel: a thick oak beam with a few things on it
  fill(ctx, [[200, 170], [1720, 170], [1720, 230], [200, 230]], '#4a3020');
  fill(ctx, [[200, 230], [1720, 230], [1700, 250], [220, 250]], '#2a1a10');
  paint.planks(ctx, [[200, 170], [1720, 170], [1720, 230], [200, 230]], rnd, { along: 'u', width: [1, 1], base: [100, 66, 42], vary: 10, streaks: 6 });
  fill(ctx, [[420, 170], [470, 170], [466, 60], [424, 60]], '#c8b890'); glow(ctx, 445, 50, 10, 16, '255,200,120', .4);
  fill(ctx, [[1300, 170], [1440, 170], [1440, 70], [1300, 70]], '#2a2420'); ctx.fillStyle = '#d8d0bc'; ctx.beginPath(); ctx.arc(1370, 118, 36, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(1370, 118); ctx.lineTo(1370, 92); ctx.moveTo(1370, 118); ctx.lineTo(1388, 126); ctx.stroke();
  for (let b = 0; b < 4; b++) fill(ctx, [[900 + b * 34, 170], [928 + b * 34, 170], [928 + b * 34, 90 + b * 6], [900 + b * 34, 90 + b * 6]], shade([[120, 40, 40], [40, 60, 90], [140, 120, 70], [60, 80, 60]][b], 0));
  // the opening: a stone arch lintel, the firebox in perspective (back wall, sides, floor), all sooty
  const { x0, x1, top, floor, back } = BOX;
  fill(ctx, [[x0, top], [x1, top], [x1, floor], [x0, floor]], '#0c0806');
  fill(ctx, [[x0, top], [back.x0, back.top], [back.x0, back.floor], [x0, floor]], '#1a120e');
  fill(ctx, [[x1, top], [back.x1, back.top], [back.x1, back.floor], [x1, floor]], '#160e0a');
  paint.masonry(ctx, [[back.x0, back.top], [back.x1, back.top], [back.x1, back.floor], [back.x0, back.floor]], rnd, { courses: 7, length: [.12, .2], base: [40, 30, 26], vary: 14, mortar: [20, 16, 14] });
  fill(ctx, [[back.x0, back.top], [back.x1, back.top], [back.x1, back.floor], [back.x0, back.floor]], 'rgba(0,0,0,.45)');
  fill(ctx, [[x0, floor], [x1, floor], [back.x1, back.floor], [back.x0, back.floor]], '#1e1612');
  // lintel stones in an arch
  for (let i = 0; i < 9; i++) { const t0 = i / 9, t1 = (i + 1) / 9, a0 = Math.PI * (1 - t0), a1 = Math.PI * (1 - t1), cx = (x0 + x1) / 2, rx = (x1 - x0) / 2 + 20, ry = 60; fill(ctx, [[cx + Math.cos(a0) * rx, top + 30 - Math.sin(a0) * ry], [cx + Math.cos(a1) * rx, top + 30 - Math.sin(a1) * ry], [cx + Math.cos(a1) * (rx + 70), top + 30 - Math.sin(a1) * (ry + 60)], [cx + Math.cos(a0) * (rx + 70), top + 30 - Math.sin(a0) * (ry + 60)]], shade([110, 100, 88], (rnd() - .5) * 24)); }
  // hearth slab in front
  fill(ctx, [[180, 860], [1740, 860], [1920, H], [0, H]], '#3a3430');
  fill(ctx, [[180, 840], [1740, 840], [1740, 860], [180, 860]], '#4a4440');
  // tools on a stand at the right, a kindling basket at the left
  ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(1560, 960); ctx.lineTo(1560, 560); ctx.stroke();
  for (const dx of [-30, 0, 30]) { ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(1560 + dx, 570); ctx.lineTo(1560 + dx * 1.4, 900); ctx.stroke(); }
  ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(1560, 550, 14, 0, TAU); ctx.fill();
  fill(ctx, [[220, 980], [440, 980], [420, 840], [240, 840]], '#6a4a2a');
  for (let w = 0; w < 9; w++) { ctx.strokeStyle = 'rgba(30,20,10,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(220 + w * 25, 980); ctx.lineTo(240 + w * 22, 840); ctx.stroke(); }
  for (let s = 0; s < 14; s++) { ctx.strokeStyle = shade([150, 110, 70], (rnd() - .5) * 30); ctx.lineWidth = 6; ctx.beginPath(); const x = 250 + rnd() * 160; ctx.moveTo(x, 850); ctx.lineTo(x + (rnd() - .5) * 60, 760 - rnd() * 40); ctx.stroke(); }
  // brass fender across the front of the hearth
  ctx.strokeStyle = '#a8803a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x0 - 60, 830); ctx.lineTo(x1 + 60, 830); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,150,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 - 60, 826); ctx.lineTo(x1 + 60, 826); ctx.stroke();
}

// The logs and the ember bed, as shapes; the glow in their cracks is drawn per frame.
function makeFire(rnd) {
  const logs = [
    { a: [760, 700], b: [1160, 650], r: 46 },
    { a: [820, 640], b: [1180, 700], r: 40 },
  ];
  const cracks = logs.flatMap(l => Array.from({ length: 22 }, () => { const t = rnd(), x = lerp(l.a[0], l.b[0], t), y = lerp(l.a[1], l.b[1], t) + (rnd() - .5) * l.r * 1.2; return { x, y, len: 6 + rnd() * 22, ang: (rnd() - .5) * 1.2 + Math.PI / 2, lag: rnd() }; }));
  const coals = Array.from({ length: 90 }, () => ({ x: lerp(720, 1220, rnd()), y: lerp(700, 745, rnd()), r: 3 + rnd() * 6, lag: rnd() * TAU, rate: 1 + Math.floor(rnd() * 3) }));
  return { logs, cracks, coals };
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(8011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  surround(ctx, rnd);
  const fire = makeFire(rnd);
  // grate bars
  ctx.strokeStyle = '#0c0a0a'; ctx.lineWidth = 8; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(720 + i * 80, 750); ctx.lineTo(740 + i * 80, 720); ctx.stroke(); }
  // the logs: charred bodies with an ash-grey skin and split ends
  for (const l of fire.logs) {
    const dx = l.b[0] - l.a[0], dy = l.b[1] - l.a[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    fill(ctx, [[l.a[0] + nx * l.r, l.a[1] + ny * l.r], [l.b[0] + nx * l.r, l.b[1] + ny * l.r], [l.b[0] - nx * l.r, l.b[1] - ny * l.r], [l.a[0] - nx * l.r, l.a[1] - ny * l.r]], '#1a1210');
    for (let i = 0; i < 40; i++) { const t = rnd(), s = (rnd() - .5) * 1.8; ctx.fillStyle = `rgba(${120 + rnd() * 40},${116 + rnd() * 30},${110 + rnd() * 20},${.2 + rnd() * .3})`; ctx.beginPath(); ctx.ellipse(l.a[0] + dx * t + nx * s * l.r * .5, l.a[1] + dy * t + ny * s * l.r * .5, 6 + rnd() * 14, 3 + rnd() * 5, Math.atan2(dy, dx), 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#2a1a14'; ctx.beginPath(); ctx.ellipse(l.a[0], l.a[1], l.r * .35, l.r, Math.atan2(dy, dx), 0, TAU); ctx.fill();
  }
  paint.applyTexture(ctx, make, 8012, .32, 0, 0, W, H, true);
  const light = paint.lighting(make, { ambient: [.36, .3, .3], lights: [paint.LIGHT.lamp(960, 720, .8, 900, 500, [1.4, .85, .45])] });
  light(ctx);
  const sparks = Array.from({ length: 16 }, () => ({ x: lerp(800, 1120, rnd()), lag: rnd(), sway: (rnd() - .5) * 60 }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    const breath = .75 + .25 * Math.sin(TAU * phase) * .6 + .15 * Math.sin(TAU * phase * 3 + 1);
    // the glow of the fire on the hearth and the surround, breathing
    glow(target, 960, 760, 700, 220, '255,120,40', .16 * breath);
    glow(target, 960, 620, 360, 200, '255,150,60', .14 * breath);
    // the ember bed: coals pulsing out of step
    for (const c of fire.coals) { const b = .5 + .5 * Math.sin(TAU * phase * c.rate + c.lag); glow(target, c.x, c.y, c.r * 2, c.r * 1.2, `255,${Math.round(80 + 70 * b)},${Math.round(30 + 20 * b)}`, (.12 + .3 * b) * breath); }
    // cracks in the logs glowing
    target.lineCap = 'round';
    for (const k of fire.cracks) { const b = .5 + .5 * Math.sin(TAU * (phase * 2 + k.lag)); target.strokeStyle = `rgba(255,${Math.round(120 + 80 * b)},60,${.5 + .4 * b})`; target.lineWidth = 2 + b * 2; target.beginPath(); target.moveTo(k.x, k.y); target.lineTo(k.x + Math.cos(k.ang) * k.len, k.y + Math.sin(k.ang) * k.len * .4); target.stroke(); }
    // one small flame licking along the far log
    for (let f = 0; f < 7; f++) {
      const t = phase * (3 + f % 3) + f / 7, h = (f % 3 === 1 ? 90 : 50) + 30 * Math.sin(TAU * t) + 14 * Math.sin(TAU * t * 2), x = 860 + f * 46 + Math.sin(TAU * t) * 6, y = 668 - Math.abs(f - 3) * 6;
      const g = target.createLinearGradient(x, y, x, y - h); g.addColorStop(0, 'rgba(80,120,255,.6)'); g.addColorStop(.3, 'rgba(255,170,60,.8)'); g.addColorStop(1, 'rgba(255,220,120,0)');
      target.fillStyle = g; target.beginPath(); target.moveTo(x - 10, y); target.quadraticCurveTo(x - 12, y - h * .5, x + Math.sin(TAU * t * 2) * 8, y - h); target.quadraticCurveTo(x + 12, y - h * .5, x + 10, y); target.fill();
    }
    // sparks rising, each once a loop
    for (const s of sparks) { const t = (phase + s.lag) % 1; if (t > .3) continue; const u = t / .3; glow(target, s.x + s.sway * u, 680 - u * 360, 3, 3, '255,200,120', .9 * (1 - u)); }
  };
}

module.exports = {
  title: '잿불이 남은 벽난로',
  slug: 'quiet-hearth',
  sound: 'embers',
  createScene,
};
