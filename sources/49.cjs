'use strict';

// 49 · 갈대 숲 너머 희미한 아침
// The edge of a reed marsh as a faint morning comes. Tall reeds stand close in front of us, brown plumes
// nodding over strap leaves, and through gaps in them we see open water, flat and pale, with a far bank of
// reeds and a line of willows in the mist. A pair of herons stands in the shallows. The reeds rock in the
// wind in sheets; small ripples cross the water and the mist drifts.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, shade } = paint;

const HORIZON = 600;

function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function scene(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#4a5466'], [.6, '#9a9a9c'], [1, '#d4c4ac']]);
  ctx.fillRect(0, 0, W, HORIZON);
  glow(ctx, 1200, HORIZON - 20, 700, 140, '250,220,180', .35);
  // far bank: willows as soft domes, reeds as a fine fringe
  for (let i = 0; i < 26; i++) glow(ctx, rnd() * W, HORIZON - 30 - rnd() * 30, 60 + rnd() * 90, 40 + rnd() * 40, '92,98,96', .6);
  paint.ridgeline(ctx, HORIZON, 10, [104, 104, 96], 491, [[60, 1], [12, .8], [4, .5]], HORIZON + 6);
  // open water: the sky reflected, darker toward us, with long faint streaks
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#c8bca8'], [.3, '#8a8a90'], [1, '#3a4250']]);
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  for (let i = 0; i < 60; i++) { const y = HORIZON + rnd() ** 1.5 * (H - HORIZON); ctx.fillStyle = `rgba(230,224,210,${.05 + rnd() * .08})`; ctx.fillRect(rnd() * W, y, 60 + rnd() * 300, 1.4); }
  // herons in the shallows, standing on their reflections
  for (const [x, y, s, head] of [[740, 668, 1, -1], [812, 672, .9, 1]]) {
    ctx.fillStyle = '#4a4e56';
    ctx.beginPath(); ctx.ellipse(x, y - 34 * s, 10 * s, 16 * s, .3 * head, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#4a4e56'; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 4 * s * head, y - 46 * s); ctx.quadraticCurveTo(x + 12 * s * head, y - 60 * s, x + 6 * s * head, y - 70 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 6 * s * head, y - 70 * s); ctx.lineTo(x + 20 * s * head, y - 68 * s); ctx.stroke();
    ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.moveTo(x - 2 * s, y - 20 * s); ctx.lineTo(x - 3 * s, y); ctx.moveTo(x + 3 * s, y - 20 * s); ctx.lineTo(x + 4 * s, y); ctx.stroke();
    ctx.strokeStyle = 'rgba(74,78,86,.35)'; ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x, y + 30 * s); ctx.stroke();
  }
}

// Reeds: each a tall stem with strap leaves angling off it and a plume at the top. Near reeds are big and
// rock in the wind; mid reeds form the near bank behind them.
function makeReeds(rnd) {
  const reeds = [];
  for (let i = 0; i < 260; i++) {
    const near = i < 70, x = rnd() * (W + 200) - 100;
    if (!near && x > 560 && x < 1100 && rnd() < .8) continue;           // the gap we look through
    reeds.push({
      x, base: near ? H + 30 : 720 + rnd() * 120, h: near ? 700 + rnd() * 400 : 220 + rnd() * 200, near,
      lean: (rnd() - .5) * .2, lag: x * .004 + rnd() * .5, leaves: 3 + Math.floor(rnd() * 3), seed: rnd() * 1e6 | 0, w: near ? 4 + rnd() * 3 : 1.4 + rnd(),
    });
  }
  return reeds.sort((a, b) => a.w - b.w);
}
function reed(ctx, r, sway) {
  const rnd = paint.seeded(r.seed), lean = r.lean + sway;
  const at = t => [r.x + Math.sin(lean) * r.h * t * t, r.base - r.h * t];
  const tone = r.near ? [70, 62, 44] : [110, 104, 84];
  ctx.strokeStyle = shade(tone); ctx.lineWidth = r.w; ctx.lineCap = 'round';
  ctx.beginPath(); for (let i = 0; i <= 12; i++) { const p = at(i / 12); i ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke();
  for (let l = 0; l < r.leaves; l++) {
    const t = .2 + l * .18, p = at(t), side = l % 2 ? 1 : -1, len = r.h * (.22 + rnd() * .1), a = -Math.PI / 2 + side * (.5 + rnd() * .4) + lean;
    const tip = [p[0] + Math.cos(a) * len, p[1] + Math.sin(a) * len + len * .35];
    ctx.strokeStyle = shade(r.near ? [60, 70, 44] : [104, 110, 86], (rnd() - .5) * 20); ctx.lineWidth = r.w * 1.6;
    ctx.beginPath(); ctx.moveTo(...p); ctx.quadraticCurveTo(p[0] + Math.cos(a) * len * .6, p[1] + Math.sin(a) * len * .6, ...tip); ctx.stroke();
  }
  // plume: a dense drooping brush of fine rays, lit warm on its top
  const top = at(1);
  for (let i = 0; i < (r.near ? 40 : 14); i++) {
    const a = Math.PI / 2 + lean * 2 + (rnd() - .5) * 1.1, l = r.h * (.06 + rnd() * .06);
    ctx.strokeStyle = i % 4 ? shade([140, 112, 84], 0, .7) : 'rgba(240,214,170,.7)'; ctx.lineWidth = Math.max(.6, r.w * .3);
    ctx.beginPath(); ctx.moveTo(...top); ctx.quadraticCurveTo(top[0] + Math.cos(a - .8) * l * .6, top[1] - l * .3, top[0] + Math.cos(a) * l + Math.sin(lean) * l, top[1] + Math.sin(a) * l * .7); ctx.stroke();
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(49011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  scene(ctx, rnd);
  const reeds = makeReeds(rnd);
  for (const r of reeds) if (!r.near) reed(ctx, r, 0);
  paint.applyTexture(ctx, make, 4901, .32, 0, 0, W, H, true);
  const mist = make(W * 2, 180), mc = mist.getContext('2d');
  for (let i = 0; i < 30; i++) { const x = rnd() * W * 2; for (const dx of [0, -W * 2, W * 2]) glow(mc, x + dx, 90, 240 + rnd() * 300, 20 + rnd() * 20, '230,224,214', .16); }
  const near = reeds.filter(r => r.near);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    const mx = (phase * W * 2) % (W * 2);
    target.drawImage(mist, -mx, HORIZON - 120); target.drawImage(mist, W * 2 - mx, HORIZON - 120);
    for (let i = 0; i < 6; i++) {
      const y = HORIZON + 40 + i * 50, x = ((phase * (i % 2 ? 1 : 2) + i * .17) % 1) * (W + 400) - 200;
      target.fillStyle = 'rgba(230,226,214,.12)'; target.fillRect(x, y, 200 + i * 40, 1.5);
    }
    for (const r of near) reed(target, r, .06 * Math.sin(TAU * phase * 2 + r.lag) + .03 * Math.sin(TAU * phase * 5 + r.lag * 2));
  };
}

module.exports = {
  title: '갈대 숲 너머 희미한 아침',
  slug: 'first-light-beyond-the-reeds',
  sound: 'grass',
  createScene,
};
