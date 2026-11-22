'use strict';

// 30 · 물 채운 다랑논의 푸른 새벽
// Terraced rice paddies flooded for planting, climbing a hillside in the blue dawn, seen from below. Each
// terrace is a curved shelf of still water held by an earth bund that follows the contour, and from here
// each one shows as a thin bright crescent of mirrored sky above a dark grassy riser. The shelves get
// narrower as they climb; a thatched farmhouse and a stand of bamboo sit near the top, under a pale moon.
// Mist lies along the middle terraces. A breeze passes up the hill, shivering the pools one after another.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, shade } = paint;

const MOON = [1500, 120];
const COUNT = 16;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// Terrace i (0 = nearest, lowest): its bund line across the screen, curving with the contour, and the
// thickness of its pool and riser, both shrinking as the terraces recede up the hill.
function bund(i, x) {
  const t = i / COUNT, y = lerp(1000, 300, t ** .85);
  const sweep = (60 - t * 40) * Math.sin(x / W * Math.PI * (1.2 + i * .07) + i * .6) + 14 * edge(x * 2 + i * 80, 301) * (1 - t);
  return y + sweep;
}
const poolDepth = i => lerp(46, 5, (i / COUNT) ** .7);
const riserDepth = i => lerp(110, 10, (i / COUNT) ** .8);

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(30011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#1c2a4a'], [.35, '#4a5a7a'], [1, '#6a7290']]);
  ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 60, 220);
  glow(ctx, ...MOON, 160, 160, '210,220,236', .25); ctx.fillStyle = 'rgba(230,236,244,.85)'; ctx.beginPath(); ctx.arc(...MOON, 18, 0, TAU); ctx.fill();
  // the hill's crest beyond the last terrace, with the farmhouse and bamboo on it
  paint.ridgeline(ctx, 300, 60, [40, 50, 50], 302, [[600, 1], [140, .4], [30, .15]], 340);
  const hx = 560, hy = 268;
  fill(ctx, [[hx - 70, hy], [hx + 70, hy], [hx + 70, hy - 34], [hx - 70, hy - 34]], '#3e3630');
  fill(ctx, [[hx - 90, hy - 30], [hx + 90, hy - 30], [hx + 54, hy - 76], [hx - 54, hy - 76]], '#6a5a40');
  for (let r = 0; r < 6; r++) { ctx.strokeStyle = 'rgba(30,24,16,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx - 90 + r * 6, hy - 30 - r * 7.6); ctx.lineTo(hx + 90 - r * 6, hy - 30 - r * 7.6); ctx.stroke(); }
  glow(ctx, hx + 30, hy - 14, 14, 10, '255,200,140', .9); ctx.fillStyle = '#ffcc88'; ctx.fillRect(hx + 24, hy - 20, 12, 10);
  for (let b = 0; b < 18; b++) { const x = hx + 110 + b * 7 + rnd() * 6, h = 120 + rnd() * 60; ctx.strokeStyle = shade([40, 56, 40], (rnd() - .5) * 20); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, hy + 4); ctx.quadraticCurveTo(x + 8, hy - h * .6, x + 20 + rnd() * 10, hy - h); ctx.stroke(); }
  // terraces from the top of the hill down to us, so each nearer riser overlaps the one above
  const pools = [];
  for (let i = COUNT - 1; i >= 0; i--) {
    const top = [], bot = [], riser = [];
    for (let x = -20; x <= W + 20; x += 12) { const y = bund(i, x); top.push([x, y - poolDepth(i)]); bot.push([x, y]); riser.push([x, y + riserDepth(i)]); }
    const pool = top.concat(bot.slice().reverse()), ys = pool.map(p => p[1]);
    fill(ctx, pool, vertical(ctx, Math.min(...ys), Math.max(...ys), [[0, '#a4a2b6'], [.5, '#767c98'], [1, '#4a5674']]));
    pools.push({ pool, top: Math.min(...ys), bottom: Math.max(...ys), i });
    if (i < 5) for (let k = 0; k < 120; k++) { const p = bot[Math.floor(rnd() * bot.length)], y = p[1] - rnd() * poolDepth(i) * .8; ctx.strokeStyle = 'rgba(90,120,70,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p[0], y); ctx.lineTo(p[0] + 2, y - 4 - (5 - i) * 2); ctx.stroke(); }
    fill(ctx, bot.concat(riser.slice().reverse()), vertical(ctx, Math.min(...bot.map(p => p[1])), Math.max(...riser.map(p => p[1])), [[0, shade([60, 76, 52], -i)], [1, shade([24, 32, 26], -i)]]));
    ctx.strokeStyle = 'rgba(190,180,160,.5)'; ctx.lineWidth = Math.max(1, 3 - i * .15); ctx.beginPath(); bot.forEach((p, k) => (k ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
    for (let g = 0; g < 160 * (1 - i / COUNT); g++) { const p = riser[Math.floor(rnd() * riser.length)], d = rnd() * riserDepth(i); ctx.strokeStyle = 'rgba(70,96,60,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p[0], p[1] - d); ctx.lineTo(p[0] + (rnd() - .5) * 4, p[1] - d - 6); ctx.stroke(); }
  }
  paint.applyTexture(ctx, make, 3001, .3, 0, 0, W, H, true);
  const mist = make(W * 2, 260), mc = mist.getContext('2d');
  for (let i = 0; i < 30; i++) { const x = rnd() * W * 2; for (const dx of [0, -W * 2, W * 2]) glow(mc, x + dx, 130, 300 + rnd() * 400, 30 + rnd() * 30, '196,196,214', .2); }

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const p of pools) {
      const d = (((phase * 2) % 1) * (COUNT + 8) - 4 - p.i) / 1.4, wave = Math.exp(-(d * d));
      if (wave < .05) continue;
      target.save(); pathOf(target, p.pool); target.clip();
      for (let y = p.top; y < p.bottom; y += 2) { target.fillStyle = `rgba(236,236,246,${.18 * wave * (.5 + .5 * Math.sin(y * 1.3 + phase * 60))})`; target.fillRect(0, y, W, 1); }
      target.restore();
    }
    const x = (phase * W * 2) % (W * 2);
    target.drawImage(mist, -x, 430); target.drawImage(mist, W * 2 - x, 430);
  };
}

module.exports = {
  title: '물 채운 다랑논의 푸른 새벽',
  slug: 'flooded-rice-terraces-before-dawn',
  sound: 'lake',
  createScene,
};
