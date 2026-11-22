'use strict';

// 09 · 오로라가 흐르는 설원
// Arctic tundra under a full aurora. Low rolling snowfields run to a line of distant ridges; in the middle
// distance a stone cairn stands on a rise, and a few wind-bent dwarf birches poke through the snow near us.
// Above, the aurora hangs in great folded curtains — green at their lower hems where they're brightest,
// fading to violet higher up, made of countless vertical rays — rippling and folding slowly, a pulse of
// brightness racing along a fold now and then. The snow takes a faint green cast from it. Stars behind.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, noise, pathOf } = paint;

const cam = camera({ x: 0, y: 2.2, z: 0, yaw: 0, pitch: -.1, focal: 1000, cx: 960, cy: 600 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 2.2, 1e6])[1];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
const ground = (x, z) => 7 * noise(x / 120, z / 120, 3) + 3 * noise(x / 40, z / 40, 4) - 4 + (z > 800 ? (z - 800) * .02 * noise(x / 300, 1, 5) : 0);

// Curtains: each a wavy hem line across the sky; rays rise from it.
const CURTAINS = [
  { y: 560, amp: 80, k: 1.3, len: 320, hue: 0, speed: 1 },
  { y: 440, amp: 70, k: 2.1, len: 280, hue: .4, speed: -1 },
  { y: 300, amp: 60, k: 1.7, len: 220, hue: .8, speed: 1 },
];

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(9011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON); sky.addColorStop(0, '#02040c'); sky.addColorStop(1, '#0c1a26');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 900, HORIZON);
  // distant ridges
  ctx.fillStyle = '#0e1a22'; ctx.beginPath(); ctx.moveTo(0, HORIZON + 4); for (let x = 0; x <= W; x += 10) ctx.lineTo(x, HORIZON - 30 - 50 * noise(x / 260, 3, 6) - 14 * noise(x / 50, 4, 7)); ctx.lineTo(W, HORIZON + 4); ctx.fill();
  // tundra: overlapping drifts receding to the ridges, each a soft rounded swell lit on its crest
  for (let l = 0; l < 9; l++) {
    const t = l / 8, base = lerp(HORIZON + 6, H + 40, t ** 1.6), amp = lerp(6, 90, t);
    const crest = x => base - amp * (.5 + .5 * Math.sin(x / lerp(300, 700, t) + l * 1.7)) - amp * .3 * noise(x / 200, l, 9);
    const g = ctx.createLinearGradient(0, base - amp, 0, base + 60);
    g.addColorStop(0, shade([lerp(90, 150, t), lerp(116, 176, t), lerp(126, 184, t)], 0)); g.addColorStop(1, shade([lerp(30, 54, t), lerp(42, 70, t), lerp(54, 86, t)], 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H + 50); for (let x = 0; x <= W; x += 12) ctx.lineTo(x, crest(x)); ctx.lineTo(W, H + 50); ctx.fill();
    ctx.strokeStyle = `rgba(200,240,230,${.08 + .1 * t})`; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x <= W; x += 12) (x ? ctx.lineTo(x, crest(x) + 1) : ctx.moveTo(x, crest(x) + 1)); ctx.stroke();
  }
  // the cairn on a rise
  const c = [6, ground(6, 60), 60], cb = P(c), ck = cam.focal / 60;
  for (let s = 0; s < 6; s++) { const w = (1.1 - s * .15) * ck, y = cb[1] - s * .38 * ck; fill(ctx, paint.wobble([[cb[0] - w, y], [cb[0] + w, y - 2], [cb[0] + w * .9, y - .38 * ck], [cb[0] - w * .85, y - .36 * ck]], 2, 91 + s, 6), shade([40, 44, 50], (rnd() - .5) * 16)); ctx.fillStyle = 'rgba(220,230,240,.6)'; ctx.fillRect(cb[0] - w * .7, y - .38 * ck, w * 1.3, 2); }
  // dwarf birches near us, bent by the wind
  for (let t = 0; t < 7; t++) {
    const x = -14 + rnd() * 30, z = 6 + rnd() * 18, b = P([x, ground(x, z), z]), k = cam.focal / z;
    ctx.strokeStyle = '#1a1a1e'; ctx.lineCap = 'round';
    const branch = (px, py, a, len, w, d) => { const ex = px + Math.cos(a) * len, ey = py + Math.sin(a) * len; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke(); if (d) for (let i = 0; i < 2; i++) branch(ex, ey, a + (i ? .5 : -.35) + .2 + (rnd() - .5) * .4, len * .7, w * .65, d - 1); };
    branch(b[0], b[1], -Math.PI / 2 + .5, .9 * k, .08 * k, 4);
  }
  paint.applyTexture(ctx, make, 9012, .34, 0, 0, W, H, true);
  // ray texture per curtain: a strip of vertical streaks to be drawn along the hem
  const rays = CURTAINS.map(cu => Array.from({ length: 420 }, () => ({ u: rnd(), len: cu.len * (.4 + rnd() * .9), a: .3 + rnd() * .7, w: 6 + rnd() * 14 })));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.globalCompositeOperation = 'lighter';
    CURTAINS.forEach((cu, ci) => {
      const hem = u => cu.y + cu.amp * Math.sin(TAU * (u * cu.k + phase * cu.speed) + ci) + .4 * cu.amp * Math.sin(TAU * (u * cu.k * 2.3 - phase * cu.speed * 2) + ci * 2);
      const pulseAt = (phase * 2 + ci * .3) % 1;
      for (const r of rays[ci]) {
        const x = lerp(-100, W + 100, r.u), y = hem(r.u), d = Math.min(Math.abs(r.u - pulseAt), 1 - Math.abs(r.u - pulseAt)), pulse = Math.exp(-((d / .05) ** 2));
        const flick = .7 + .3 * Math.sin(TAU * (phase * 3 + r.u * 17));
        const g = target.createLinearGradient(x, y, x, y - r.len);
        const green = `rgba(${Math.round(80 + 80 * pulse)},255,${Math.round(150 + 40 * cu.hue)},${(.11 + .2 * pulse) * r.a * flick})`;
        g.addColorStop(0, green); g.addColorStop(.35, `rgba(90,220,170,${.07 * r.a * flick})`); g.addColorStop(1, `rgba(${Math.round(150 + 60 * cu.hue)},80,220,0)`);
        target.fillStyle = g; target.fillRect(x - r.w / 2, y - r.len, r.w, r.len);
      }
      // a soft glow bleeding below the hem
      for (let u = 0; u <= 1; u += .05) glow(target, lerp(-100, W + 100, u), hem(u) + 40, 90, 70, '60,180,130', .05);
      // the bright hem
      target.strokeStyle = 'rgba(140,255,190,.07)'; target.lineWidth = 14; target.beginPath();
      for (let u = 0; u <= 1.0001; u += .01) { const x = lerp(-100, W + 100, u); u ? target.lineTo(x, hem(u)) : target.moveTo(x, hem(u)); } target.stroke();
    });
    // the green cast on the snow, rising and falling with the display
    const g2 = target.createLinearGradient(0, HORIZON, 0, H); g2.addColorStop(0, `rgba(60,160,110,${.08 + .03 * Math.sin(TAU * phase)})`); g2.addColorStop(1, 'rgba(60,160,110,0)');
    target.fillStyle = g2; target.fillRect(0, HORIZON, W, H - HORIZON);
    target.restore();
  };
}

module.exports = {
  title: '오로라가 흐르는 설원',
  slug: 'aurora-over-the-tundra',
  sound: 'wind',
  createScene,
};
