'use strict';

// 51 · 단풍나무 사이의 반달
// Looking up through the branches of a Japanese maple at a half moon in the deep blue before dawn. Slender
// grey limbs fork and fork again, holding sprays of five- and seven-lobed leaves gone crimson, orange and
// a few still green; the leaves nearest us are large and translucent where the moonlight comes through,
// the farther ones are dark shapes against the sky. A few leaves let go and spin down. The branches rock.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, glow, shade } = paint;

const MOON = [1120, 300];

function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#0a1026'], [.6, '#1e2c50'], [1, '#3a4466']]);
  ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 220, H);
  glow(ctx, ...MOON, 300, 300, '206,216,236', .25);
  ctx.fillStyle = 'rgba(60,70,100,.6)'; ctx.beginPath(); ctx.arc(...MOON, 40, 0, TAU); ctx.fill();
  ctx.fillStyle = '#eef0f4'; ctx.beginPath(); ctx.arc(...MOON, 40, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fill();
}

// A maple leaf: lobes radiating from the stem end, each a pointed lobe with a toothed edge.
function leaf(ctx, x, y, size, ang, color, lobes = 5, lit = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(0, 0);
  for (let i = 0; i < lobes; i++) {
    const a = -Math.PI / 2 + (i - (lobes - 1) / 2) * (Math.PI * 1.25 / (lobes - 1)), l = size * (i === (lobes - 1) / 2 ? 1 : .8 - Math.abs(i - (lobes - 1) / 2) * .1);
    const a0 = a - .22, a1 = a + .22;
    ctx.lineTo(Math.cos(a0) * l * .35, Math.sin(a0) * l * .35);
    ctx.lineTo(Math.cos(a - .06) * l * .8, Math.sin(a - .06) * l * .8); ctx.lineTo(Math.cos(a) * l, Math.sin(a) * l); ctx.lineTo(Math.cos(a + .06) * l * .8, Math.sin(a + .06) * l * .8);
    ctx.lineTo(Math.cos(a1) * l * .35, Math.sin(a1) * l * .35);
  }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  if (lit) {
    ctx.strokeStyle = `rgba(255,200,160,${lit * .45})`; ctx.lineWidth = 1;
    for (let i = 0; i < lobes; i++) { const a = -Math.PI / 2 + (i - (lobes - 1) / 2) * (Math.PI * 1.25 / (lobes - 1)); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * size * .8, Math.sin(a) * size * .8); ctx.stroke(); }
  }
  ctx.restore();
}

function growMaple(rnd) {
  const segs = [], sprays = [];
  const grow = (x, y, a, len, w, depth) => {
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
    const cx = (x + ex) / 2 + Math.cos(a + Math.PI / 2) * len * .1 * (rnd() - .5), cy = (y + ey) / 2 + Math.sin(a + Math.PI / 2) * len * .1 * (rnd() - .5);
    segs.push({ a: [x, y], c: [cx, cy], b: [ex, ey], w, depth });
    if (depth >= 4) { sprays.push({ x: ex, y: ey, a, depth, lag: rnd() * TAU, seed: rnd() * 1e6 | 0 }); return; }
    const kids = 2 + (rnd() < .4 ? 1 : 0);
    for (let k = 0; k < kids; k++) grow(ex, ey, a + (rnd() - .5) * 1.2, len * (.62 + rnd() * .15), w * .62, depth + 1);
    if (depth >= 2) sprays.push({ x: (x + ex) / 2, y: (y + ey) / 2, a, depth, lag: rnd() * TAU, seed: rnd() * 1e6 | 0 });
  };
  grow(-40, 1120, -.95, 420, 60, 0);
  grow(W + 60, 1000, -2.3, 380, 50, 0);
  grow(W + 40, 120, 2.9, 300, 34, 1);
  return { segs, sprays };
}

const COLORS = [[176, 34, 30], [200, 70, 30], [150, 26, 40], [214, 110, 40], [90, 110, 50]];
function spray(ctx, s, sway, near) {
  const rnd = paint.seeded(s.seed), n = near ? 7 : 5;
  for (let i = 0; i < n; i++) {
    const a = s.a + (rnd() - .5) * 2.4 + sway, d = 20 + rnd() * 60;
    const x = s.x + Math.cos(a) * d, y = s.y + Math.sin(a) * d, size = (near ? 34 : 20) + rnd() * 18;
    const c = COLORS[Math.floor(rnd() * COLORS.length)];
    const toMoon = Math.max(0, 1 - Math.hypot(x - MOON[0], y - MOON[1]) / 700);
    const color = near ? shade(c.map(v => v * (.55 + toMoon * .6)), 0) : shade(c.map(v => v * .35), 0);
    ctx.strokeStyle = 'rgba(40,20,20,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(x, y); ctx.stroke();
    leaf(ctx, x, y, size, a + Math.PI / 2 + (rnd() - .5) * .8, color, rnd() < .3 ? 7 : 5, near ? toMoon : 0);
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(51011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  const maple = growMaple(rnd);
  // far foliage first, darker, behind the limbs
  for (const s of maple.sprays) if (s.depth >= 4) spray(ctx, s, 0, false);
  ctx.lineCap = 'round';
  for (const s of maple.segs) {
    ctx.strokeStyle = shade([58, 54, 60], -s.depth * 6); ctx.lineWidth = Math.max(1.5, s.w);
    ctx.beginPath(); ctx.moveTo(...s.a); ctx.quadraticCurveTo(...s.c, ...s.b); ctx.stroke();
    ctx.strokeStyle = 'rgba(180,190,220,.2)'; ctx.lineWidth = Math.max(.8, s.w * .2);
    ctx.beginPath(); ctx.moveTo(s.a[0] + s.w * .25, s.a[1] - s.w * .25); ctx.quadraticCurveTo(s.c[0] + s.w * .25, s.c[1] - s.w * .25, s.b[0] + s.w * .25, s.b[1] - s.w * .25); ctx.stroke();
  }
  paint.applyTexture(ctx, make, 5101, .3, 0, 0, W, H, true);
  const near = maple.sprays.filter(s => s.depth < 4);
  const falling = Array.from({ length: 12 }, () => ({ x: rnd() * W, y: rnd(), spin: 1 + Math.floor(rnd() * 2), sway: 40 + rnd() * 80, offset: rnd(), c: COLORS[Math.floor(rnd() * 4)] }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const s of near) spray(target, s, .06 * Math.sin(TAU * phase * 2 + s.lag), true);
    for (const f of falling) {
      const y = ((f.y + phase) % 1) * (H + 100) - 50, x = f.x + Math.sin(TAU * (phase * 2 + f.offset)) * f.sway;
      leaf(target, x, y, 18 * (.5 + .5 * Math.abs(Math.cos(TAU * (phase * f.spin + f.offset)))), TAU * (phase * f.spin + f.offset), shade(f.c.map(v => v * .7)));
    }
  };
}

module.exports = {
  title: '단풍나무 사이의 반달',
  slug: 'crescent-through-the-maples',
  sound: 'leaves',
  createScene,
};
