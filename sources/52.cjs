'use strict';

// 52 · 벚꽃 가지가 흔들리는 새벽 하늘
// Cherry boughs heavy with blossom reach across a dawn sky going from violet to peach. The dark, glossy
// bark is banded with pale lenticels; along the branches the flowers sit in clusters of three or four on
// short stalks, five notched petals each, white flushed with pink, a red eye at the centre; buds and a
// few new leaves among them. The boughs rock in the morning air and petals come loose and drift across.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade } = paint;

function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#24264e'], [.45, '#5a4c78'], [.8, '#a87c8c'], [1, '#c89a8a']]);
  ctx.fillRect(0, 0, W, H);
  glow(ctx, 600, H, 900, 260, '255,200,170', .2);
  for (let i = 0; i < 16; i++) glow(ctx, rnd() * W, 200 + rnd() * 600, 300 + rnd() * 400, 14 + rnd() * 20, '200,150,170', .18);
  paint.starfield(ctx, rnd, 40, 300);
}

// A blossom: five notched petals around a red eye with stamens.
function flower(ctx, x, y, r, ang, open) {
  for (let p = 0; p < 5; p++) {
    const a = ang + p / 5 * TAU, px = x + Math.cos(a) * r * .55 * open, py = y + Math.sin(a) * r * .55 * open;
    ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 2);
    const g = ctx.createRadialGradient(0, r * .3, 0, 0, 0, r * .7);
    g.addColorStop(0, '#d88aa4'); g.addColorStop(1, '#f4d4dc');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, r * .35); ctx.quadraticCurveTo(-r * .55, 0, -r * .2, -r * .5); ctx.lineTo(0, -r * .38); ctx.lineTo(r * .2, -r * .5); ctx.quadraticCurveTo(r * .55, 0, 0, r * .35); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#a02040'; ctx.beginPath(); ctx.arc(x, y, r * .16, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(250,230,200,.8)'; ctx.lineWidth = .8;
  for (let s = 0; s < 8; s++) { const a = s / 8 * TAU; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * .35, y + Math.sin(a) * r * .35); ctx.stroke(); }
}

function growBoughs(rnd) {
  const segs = [], clusters = [];
  const grow = (x, y, a, len, w, depth) => {
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
    const c = [(x + ex) / 2 + (rnd() - .5) * len * .2, (y + ey) / 2 + (rnd() - .5) * len * .2];
    segs.push({ a: [x, y], c, b: [ex, ey], w, depth });
    const n = Math.floor(len / 40);
    for (let i = 0; i < n; i++) if (depth >= 1 && rnd() < .42) {
      const t = (i + .5) / n, u = 1 - t;
      clusters.push({ x: u * u * x + 2 * u * t * c[0] + t * t * ex, y: u * u * y + 2 * u * t * c[1] + t * t * ey, a, size: 16 + rnd() * 10, lag: rnd() * TAU, seed: rnd() * 1e6 | 0 });
    }
    if (depth >= 4) return;
    for (let k = 0; k < 2; k++) grow(ex, ey, a + (rnd() - .5) * 1, len * (.6 + rnd() * .2), w * .6, depth + 1);
  };
  grow(-60, 300, .15, 520, 46, 0);
  grow(W + 60, 760, Math.PI + .3, 480, 40, 0);
  grow(800, -60, 1.6, 300, 24, 1);
  return { segs, clusters };
}

function cluster(ctx, c, sway) {
  const rnd = paint.seeded(c.seed), n = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const a = c.a - Math.PI / 2 + (rnd() - .5) * 2.4 + sway, d = 10 + rnd() * 22;
    const x = c.x + Math.cos(a) * d, y = c.y + Math.sin(a) * d;
    ctx.strokeStyle = 'rgba(90,60,50,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(x, y); ctx.stroke();
    if (rnd() < .15) { ctx.fillStyle = '#d06080'; ctx.beginPath(); ctx.ellipse(x, y, c.size * .18, c.size * .26, a, 0, TAU); ctx.fill(); }
    else flower(ctx, x, y, c.size * (.8 + rnd() * .4), rnd() * TAU, .85 + rnd() * .3);
  }
  if (rnd() < .3) { ctx.fillStyle = 'rgba(110,140,70,.8)'; ctx.beginPath(); ctx.ellipse(c.x + 8, c.y - 6, 6, 14, c.a + .5, 0, TAU); ctx.fill(); }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(52011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  const boughs = growBoughs(rnd);
  ctx.lineCap = 'round';
  for (const s of boughs.segs) {
    ctx.strokeStyle = shade([44, 30, 34], -s.depth * 4); ctx.lineWidth = Math.max(1.5, s.w);
    ctx.beginPath(); ctx.moveTo(...s.a); ctx.quadraticCurveTo(...s.c, ...s.b); ctx.stroke();
    // lenticels: short pale horizontal dashes across the bark, the cherry's mark
    if (s.w > 8) for (let i = 0; i < s.w * .8; i++) {
      const t = rnd(), u = 1 - t, x = u * u * s.a[0] + 2 * u * t * s.c[0] + t * t * s.b[0], y = u * u * s.a[1] + 2 * u * t * s.c[1] + t * t * s.b[1];
      ctx.strokeStyle = 'rgba(200,170,160,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - s.w * .2, y + (rnd() - .5) * s.w * .5); ctx.lineTo(x + s.w * .2, y + (rnd() - .5) * s.w * .5); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,210,200,.25)'; ctx.lineWidth = Math.max(.8, s.w * .18);
    ctx.beginPath(); ctx.moveTo(s.a[0], s.a[1] - s.w * .3); ctx.quadraticCurveTo(s.c[0], s.c[1] - s.w * .3, s.b[0], s.b[1] - s.w * .3); ctx.stroke();
  }
  paint.applyTexture(ctx, make, 5201, .3, 0, 0, W, H, true);
  const petals = Array.from({ length: 36 }, () => ({ x: rnd() * W, y: rnd(), turns: 1, spin: 1 + Math.floor(rnd() * 3), sway: 30 + rnd() * 100, offset: rnd(), r: 5 + rnd() * 5 }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const c of boughs.clusters) cluster(target, c, .05 * Math.sin(TAU * phase * 2 + c.lag));
    for (const p of petals) {
      const y = ((p.y + phase) % 1) * (H + 60) - 30, x = ((p.x + phase * (W + 100) + Math.sin(TAU * (phase * 2 + p.offset)) * p.sway) % (W + 100) + W + 100) % (W + 100) - 50;
      const flip = Math.abs(Math.cos(TAU * (phase * p.spin + p.offset)));
      target.fillStyle = `rgba(255,226,232,${.6 + flip * .3})`; target.beginPath(); target.ellipse(x, y, p.r, p.r * (.3 + .7 * flip), TAU * (phase * p.spin + p.offset), 0, TAU); target.fill();
    }
  };
}

module.exports = {
  title: '벚꽃 가지가 흔들리는 새벽 하늘',
  slug: 'blossom-boughs-at-dawn',
  sound: 'leaves',
  createScene,
};
