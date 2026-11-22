'use strict';

// 45 · 새벽에 핀 은방울꽃
// A patch of lily of the valley on a mossy bank at dawn, seen from the height of the flowers. Broad
// leaves rise in pairs, furled at the base and opening into long pointed blades with parallel veins; between
// them arch slender stems, each hung with a row of small white bells that grow from bud at the tip to full
// flower at the bottom, their rims flaring in six points. Behind, out of focus, a thread of forest stream
// glints over stones. The stems nod in the faint air; the stream's light shivers.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function background(make, rnd) {
  const bg = make(W, H), c = bg.getContext('2d');
  c.fillStyle = vertical(c, 0, H, [[0, '#24342c'], [.45, '#4a6250'], [.6, '#2a3a30'], [1, '#121a14']]);
  c.fillRect(0, 0, W, H);
  glow(c, 700, 300, 800, 400, '210,224,200', .35);
  // the stream: a pale ribbon across the middle distance, with stones
  c.fillStyle = 'rgba(170,190,186,.55)';
  c.beginPath(); c.moveTo(0, 540); for (let x = 0; x <= W; x += 40) c.lineTo(x, 520 + 30 * Math.sin(x * .004 + 1)); for (let x = W; x >= 0; x -= 40) c.lineTo(x, 560 + 26 * Math.sin(x * .005)); c.fill();
  for (let i = 0; i < 20; i++) glow(c, rnd() * W, 520 + rnd() * 50, 30 + rnd() * 60, 14 + rnd() * 20, '40,50,44', .6);
  for (let i = 0; i < 40; i++) glow(c, rnd() * W, rnd() * 480, 60 + rnd() * 160, 40 + rnd() * 120, rnd() < .5 ? '70,96,70' : '24,36,28', .4);
  const out = make(W, H), o = out.getContext('2d');
  o.filter = 'blur(16px)'; o.drawImage(bg, 0, 0);
  return out;
}

// A leaf: a long blade from a furled base, widest a third of the way up, with parallel veins and a lit edge.
function leaf(ctx, base, angle, len, width, tone) {
  const tip = [base[0] + Math.cos(angle) * len, base[1] + Math.sin(angle) * len];
  const n = [-Math.sin(angle), Math.cos(angle)], at = t => [lerp(base[0], tip[0], t), lerp(base[1], tip[1], t)];
  const edge = (t, side) => { const p = at(t), w = width * Math.sin(Math.PI * Math.pow(t, .75)) * (1 - t * .15); return [p[0] + n[0] * w * side, p[1] + n[1] * w * side]; };
  const left = [], right = [];
  for (let i = 0; i <= 20; i++) { left.push(edge(i / 20, -1)); right.push(edge(i / 20, 1)); }
  const g = ctx.createLinearGradient(...edge(.4, -1), ...edge(.4, 1));
  g.addColorStop(0, shade(tone, -30)); g.addColorStop(.5, shade(tone, 10)); g.addColorStop(1, shade(tone, -14));
  fill(ctx, left.concat(right.reverse()), g);
  for (let v = -2; v <= 2; v++) {
    ctx.strokeStyle = shade(tone, v === 0 ? -40 : -24, .5); ctx.lineWidth = v === 0 ? 1.4 : .7;
    ctx.beginPath(); for (let i = 0; i <= 20; i++) { const t = i / 20, p = at(t), w = width * Math.sin(Math.PI * Math.pow(t, .75)) * .35 * v / 2; i ? ctx.lineTo(p[0] + n[0] * w, p[1] + n[1] * w) : ctx.moveTo(p[0], p[1]); } ctx.stroke();
  }
  ctx.strokeStyle = shade(tone, 60, .5); ctx.lineWidth = 1.2; ctx.beginPath(); left.reverse().forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
}

// A flower stem: an arching wire with bells hanging on short pedicels, largest at the bottom.
function stem(ctx, s, nod) {
  const pts = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30, a = s.angle + (s.arch + nod) * t * t;
    pts.push(i ? [pts[i - 1][0] + Math.cos(a) * s.len / 30, pts[i - 1][1] + Math.sin(a) * s.len / 30] : s.base);
  }
  ctx.strokeStyle = '#5a7a44'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  for (let b = 0; b < s.bells; b++) {
    const t = .4 + b / s.bells * .58, p = pts[Math.round(t * 30)], size = s.size * (1 - b / s.bells * .65);
    const hang = [p[0] + 3, p[1] + size * .9];
    ctx.strokeStyle = '#6a8a50'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(...p); ctx.quadraticCurveTo(p[0] + size * .4, p[1], hang[0], hang[1] - size * .4); ctx.stroke();
    bell(ctx, hang[0], hang[1], size, b / s.bells);
  }
}

// A bell: a rounded white cup, shaded on its far side, its rim flaring into six small points.
function bell(ctx, x, y, r, bud) {
  const g = ctx.createRadialGradient(x - r * .3, y - r * .5, r * .1, x, y - r * .2, r * 1.1);
  g.addColorStop(0, '#ffffff'); g.addColorStop(.6, '#e6ece4'); g.addColorStop(1, '#a8b4a6');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x - r * .8, y); ctx.quadraticCurveTo(x - r * .95, y - r * 1.15, x, y - r * 1.15); ctx.quadraticCurveTo(x + r * .95, y - r * 1.15, x + r * .8, y);
  if (bud < .75) for (let k = 0; k <= 6; k++) { const px = x + r * .8 - k * r * 1.6 / 6; ctx.lineTo(px, y + (k % 2 ? r * .22 : 0)); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(60,70,60,.35)'; ctx.beginPath(); ctx.ellipse(x, y, r * .7, r * .14, 0, 0, TAU); ctx.fill();
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(45011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.drawImage(background(make, rnd), 0, 0);
  // moss bank: a soft rise across the bottom, fine and grainy
  ctx.fillStyle = vertical(ctx, 820, H, [[0, '#3a5230'], [1, '#18240f']]);
  ctx.beginPath(); ctx.moveTo(0, 860); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 840 + 30 * Math.sin(x * .003 + 1)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  for (let i = 0; i < 5000; i++) { const x = rnd() * W, y = 840 + rnd() * 240; ctx.fillStyle = shade([70, 104, 52], (rnd() - .5) * 50, .6); ctx.fillRect(x, y, 2, 2); }
  // leaves, each pair from its own furled sheath
  const leaves = [];
  for (let i = 0; i < 7; i++) {
    const bx = 180 + i * 250 + (rnd() - .5) * 120, by = 900 + rnd() * 60;
    leaves.push([[bx, by], -Math.PI / 2 - .3 + rnd() * .2, 520 + rnd() * 260, 70 + rnd() * 40, [54, 96, 50]]);
    leaves.push([[bx + 10, by], -Math.PI / 2 + .1 + rnd() * .3, 440 + rnd() * 220, 60 + rnd() * 30, [62, 104, 56]]);
  }
  for (const l of leaves) leaf(ctx, ...l);
  paint.applyTexture(ctx, make, 4501, .3, 0, 0, W, H, true);
  const stems = Array.from({ length: 6 }, (_, i) => ({
    base: [260 + i * 270 + (rnd() - .5) * 80, 900], angle: -Math.PI / 2 + .15, arch: .9 + rnd() * .5, len: 360 + rnd() * 140,
    bells: 6 + Math.floor(rnd() * 5), size: 22 + rnd() * 10, lag: rnd() * TAU,
  }));
  // front leaves drawn over the stems for depth
  const front = make(W, H), fc = front.getContext('2d');
  for (let i = 0; i < 3; i++) leaf(fc, [300 + i * 600 + rnd() * 100, H + 40], -Math.PI / 2 + (rnd() - .5) * .5, 560 + rnd() * 140, 90, [44, 80, 42]);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (let i = 0; i < 12; i++) {
      const x = (i * 170 + phase * 340) % W, y = 530 + 14 * Math.sin(x * .004 + 1);
      glow(target, x, y, 40, 4, '230,240,236', .12 + .1 * Math.sin(TAU * (phase * 3 + i * .3)));
    }
    for (const s of stems) stem(target, s, .05 * Math.sin(TAU * phase * 2 + s.lag));
    target.drawImage(front, 0, 0);
  };
}

module.exports = {
  title: '새벽에 핀 은방울꽃',
  slug: 'lily-bells-before-dawn',
  sound: 'forest',
  createScene,
};
