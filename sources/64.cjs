'use strict';

// 64 · 은하수 아래 바스락이는 억새
// A hillside of silver grass in late autumn under the Milky Way. The plumes of eulalia fill the frame,
// thousands of them, each a soft feathery spray on a thin bending stem, catching the faint starlight in
// silver. In the foreground they stand taller than us and are sharp; behind, they become a pale sea that
// runs up to a soft ridge against the stars. The Milky Way arcs over the ridge. The wind sends long waves
// rolling through the plumes; they bow together and rise again.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, noise } = paint;

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(64011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const ridgeY = x => 600 - 90 * Math.sin(x / 700 + .6) - 30 * noise(x / 200, 1, 4);
  const sky = ctx.createLinearGradient(0, 0, 0, 700); sky.addColorStop(0, '#03060e'); sky.addColorStop(1, '#13223a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // Milky Way arc
  const arc = t => [lerp(-100, W + 100, t), 640 - Math.sin(Math.PI * t) * 560];
  for (let i = 0; i < 320; i++) { const t = rnd(), [x, y] = arc(t), off = (rnd() - .5) * 220; glow(ctx, x, y + off, 70 + rnd() * 130, 40 + rnd() * 80, rnd() < .7 ? '150,170,210' : '210,200,180', .045); }
  for (let i = 0; i < 2500; i++) { const t = rnd(), [x, y] = arc(t); ctx.fillStyle = `rgba(230,236,255,${.15 + rnd() * .5})`; ctx.fillRect(x + (rnd() - .5) * 40, y + (rnd() - .5) * 200, 1, 1); }
  for (let i = 0; i < 26; i++) { const t = .1 + rnd() * .8, [x, y] = arc(t); glow(ctx, x, y + (rnd() - .5) * 40, 70, 18, '3,6,14', .15); }
  paint.starfield(ctx, rnd, 900, 640);
  // the ridge, and the far grass as a pale mottled sea
  ctx.fillStyle = '#1a2430'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 10) ctx.lineTo(x, ridgeY(x)); ctx.lineTo(W, H); ctx.fill();
  for (let i = 0; i < 9000; i++) {
    const x = rnd() * W, y = ridgeY(x) + rnd() ** 1.5 * (H - ridgeY(x)), s = .6 + (y - 500) / 500;
    ctx.fillStyle = `rgba(${170 + rnd() * 40},${176 + rnd() * 40},${190 + rnd() * 30},${.08 + rnd() * .12})`;
    ctx.beginPath(); ctx.ellipse(x, y, 4 * s, 1.5 * s, -.4, 0, TAU); ctx.fill();
  }
  paint.applyTexture(ctx, make, 6401, .34, 0, 0, W, H, true);
  // the near plumes, drawn per frame: each a stem and a feathery fan of fine strokes at its top
  const plumes = Array.from({ length: 420 }, () => {
    const depth = rnd() ** 1.4, x = rnd() * (W + 200) - 100, base = lerp(H * .78, H + 60, depth);
    return { x, base, h: lerp(160, 620, depth) * (.7 + rnd() * .5), depth, lag: rnd() * TAU, lean: (rnd() - .5) * .3, n: Math.round(lerp(8, 22, depth)), seed: rnd() * 100 };
  }).sort((a, b) => a.depth - b.depth);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.lineCap = 'round';
    for (const p of plumes) {
      // a wave travelling left to right, two per loop
      const wave = Math.sin(TAU * (phase * 2 - p.x / 900)) * .5 + .5, flick = Math.sin(TAU * phase * 7 + p.lag) * .04;
      const bend = p.lean + wave * .45 + flick;
      const tip = [p.x + Math.sin(bend) * p.h, p.base - Math.cos(bend) * p.h];
      const ctrl = [p.x + Math.sin(bend * .4) * p.h * .5, p.base - p.h * .55];
      const a = .35 + p.depth * .5;
      target.strokeStyle = `rgba(90,96,100,${a})`; target.lineWidth = .8 + p.depth * 1.6;
      target.beginPath(); target.moveTo(p.x, p.base); target.quadraticCurveTo(...ctrl, ...tip); target.stroke();
      // the plume: fine silvery strokes fanning from near the tip, drooping with the bend
      const len = p.h * .22, dir = Math.atan2(tip[1] - ctrl[1], tip[0] - ctrl[0]);
      target.lineWidth = .6 + p.depth;
      for (let i = 0; i < p.n; i++) {
        const t = i / p.n, sx = lerp(ctrl[0], tip[0], .7 + t * .3), sy = lerp(ctrl[1], tip[1], .7 + t * .3);
        const ang = dir + .6 + ((i * 7.3 + p.seed) % 1 - .5) * .8 + wave * .3;
        target.strokeStyle = `rgba(${180 + (i % 3) * 14},${188 + (i % 3) * 12},${206},${a * .38})`;
        target.beginPath(); target.moveTo(sx, sy); target.quadraticCurveTo(sx + Math.cos(ang - .3) * len * .5, sy + Math.sin(ang - .3) * len * .5, sx + Math.cos(ang) * len, sy + Math.sin(ang) * len); target.stroke();
      }
    }
  };
}

module.exports = {
  title: '은하수 아래 바스락이는 억새',
  slug: 'silver-grass-under-the-milky-way',
  sound: 'grass',
  createScene,
};
