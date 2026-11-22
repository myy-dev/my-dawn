'use strict';

// 07 · 반딧불이 머무는 밤의 개울
// A small stream in a broadleaf forest on a warm summer night. The water comes toward us over a staircase
// of mossy stones, pooling, slipping between boulders, glinting faintly where it catches the sky through
// the canopy. Ferns arch over both banks; big trunks with ridged bark rise into darkness; a fallen log
// spans the stream. Hundreds of fireflies drift low over the water and among the ferns, each pulsing on
// and off in its own slow rhythm, some reflected in the still pools.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, noise, pathOf } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
// The stream's centre line and half-width, by screen y (it narrows and wanders as it recedes).
const centre = y => 960 + (330 * Math.sin(y / 180 + .5) + 120 * Math.sin(y / 70 + 2)) * ((y - 380) / 700);
const half = y => lerp(30, 520, ((y - 420) / 660) ** 1.2);

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(7011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  // the deep forest behind: layers of trunks fading into blue-green dark
  ctx.fillStyle = '#060c0c'; ctx.fillRect(0, 0, W, H);
  glow(ctx, 960, 380, 500, 200, '40,70,80', .35);
  for (let layer = 0; layer < 4; layer++) {
    const tone = [14 + layer * 4, 24 + layer * 5, 24 + layer * 5];
    for (let i = 0; i < 26 - layer * 4; i++) {
      const x = rnd() * W, w = (6 + rnd() * 10) * (1 + layer * 1.2), base = 440 + layer * 60;
      if (Math.abs(x - centre(base)) < half(base) + w) continue;
      fill(ctx, [[x - w / 2, -10], [x + w / 2, -10], [x + w / 2 + w * .2, base], [x - w / 2 - w * .2, base]], shade(tone, (rnd() - .5) * 6));
    }
  }
  // the canopy: dark masses of leaves with a few gaps of night sky
  for (let i = 0; i < 260; i++) { const x = rnd() * W, y = rnd() * 260 - 40; ctx.fillStyle = shade([10, 20, 16], (rnd() - .5) * 8); ctx.beginPath(); ctx.ellipse(x, y, 40 + rnd() * 80, 20 + rnd() * 40, rnd() * 3, 0, TAU); ctx.fill(); }
  // banks: dark earth and moss on both sides of the stream
  const bank = s => { const pts = [[s < 0 ? -10 : W + 10, 400]]; for (let y = 400; y <= H + 10; y += 10) pts.push([centre(y) + s * (half(y) + 10 + 30 * noise(y / 40, s, 3)), y]); pts.push([s < 0 ? -10 : W + 10, H + 10]); return pts; };
  for (const s of [-1, 1]) fill(ctx, bank(s), '#141c14');
  // the stream bed: water darker in pools, lighter over the shallow steps
  const water = []; for (let y = 400; y <= H + 10; y += 10) water.push([centre(y) - half(y), y]); for (let y = H + 10; y >= 400; y -= 10) water.push([centre(y) + half(y), y]);
  const wg = ctx.createLinearGradient(0, 400, 0, H); wg.addColorStop(0, '#1a2c34'); wg.addColorStop(1, '#0a1418');
  fill(ctx, water, wg);
  // stepping stones and boulders in the stream, mossy tops
  const rocks = [];
  for (let i = 0; i < 46; i++) { const y = lerp(430, H + 20, rnd() ** .8), x = centre(y) + (rnd() - .5) * half(y) * 2.1, r = lerp(8, 90, (y - 420) / 660) * (.5 + rnd() * .8); rocks.push([x, y, r]); }
  rocks.sort((a, b) => a[1] - b[1]);
  for (const [x, y, r] of rocks) {
    const pts = paint.wobble(Array.from({ length: 10 }, (_, k) => [x + Math.cos(k / 10 * TAU) * r * 1.3, y + Math.sin(k / 10 * TAU) * r * .55 - r * .25]), r * .12, Math.floor(x * 7 + y), 10);
    fill(ctx, pts, shade([46, 50, 50], (rnd() - .5) * 16));
    ctx.save(); pathOf(ctx, pts); ctx.clip(); ctx.fillStyle = 'rgba(40,66,36,.65)'; ctx.beginPath(); ctx.ellipse(x - r * .1, y - r * .55, r * 1.1, r * .32, 0, 0, TAU); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(190,210,220,.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y + r * .2, r * 1.35, r * .3, 0, .2, Math.PI - .2); ctx.stroke();
  }
  // the fallen log across the stream, mid-distance
  const ly = 520, la = [centre(ly) - half(ly) - 160, ly - 10], lb = [centre(ly) + half(ly) + 140, ly + 18];
  ctx.strokeStyle = '#1e1a14'; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...la); ctx.lineTo(...lb); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,100,50,.6)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(la[0], la[1] - 13); ctx.lineTo(lb[0], lb[1] - 13); ctx.stroke();
  // two big trunks close at the sides with ridged bark
  for (const [x, w] of [[120, 150], [1820, 190]]) { const pts = [[x - w / 2, -10], [x + w / 2, -10], [x + w / 2 + 30, H + 10], [x - w / 2 - 30, H + 10]]; fill(ctx, pts, '#1a1814'); paint.bark(ctx, pts, rnd, { base: [44, 40, 34], dir: 'v', marks: 90, light: x < 960 ? 1 : -1, vary: 12 }); }
  // ferns arching over the banks
  for (let i = 0; i < 46; i++) {
    const s = rnd() < .5 ? -1 : 1, y = lerp(470, H + 30, rnd() ** .7), x = centre(y) + s * (half(y) + 20 + rnd() * 200), size = lerp(40, 260, (y - 450) / 660);
    for (let f = 0; f < 6; f++) {
      const a = -Math.PI / 2 + s * (.3 + f * .22) + (rnd() - .5) * .2, tip = [x + Math.cos(a) * size, y + Math.sin(a) * size * .7 + size * .3];
      ctx.strokeStyle = '#1a3020'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * size * .6, y + Math.sin(a) * size * .9, ...tip); ctx.stroke();
      for (let l = 2; l < 16; l++) { const t = l / 16, px = lerp(x, tip[0], t), py = lerp(y, tip[1], t) - Math.sin(Math.PI * t) * size * .25, ls = size * .12 * (1 - t * .7); for (const sd of [-1, 1]) { ctx.fillStyle = shade([30, 60, 36], (rnd() - .5) * 14); ctx.beginPath(); ctx.ellipse(px + sd * ls * .5, py + ls * .3, ls * .6, ls * .18, a + sd * 1.1, 0, TAU); ctx.fill(); } }
    }
  }
  paint.applyTexture(ctx, make, 7012, .34, 0, 0, W, H, true);
  // fireflies: each with a home, a slow drift, and its own blink rhythm (integer per loop)
  const flies = Array.from({ length: 180 }, () => { const y = lerp(380, H, rnd() ** .9), x = centre(y) + (rnd() - .5) * (half(y) * 2 + 600); return { x, y, rx: 20 + rnd() * 60, ry: 10 + rnd() * 30, lag: rnd(), blink: 2 + Math.floor(rnd() * 5), drift: 1 + Math.floor(rnd() * 2), near: (y - 380) / 700 }; });
  const glints = Array.from({ length: 70 }, () => { const y = lerp(430, H, rnd()), x = centre(y) + (rnd() - .5) * half(y) * 1.8; return { x, y, lag: rnd(), turns: 2 + Math.floor(rnd() * 3) }; });

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // water glints sliding downstream
    for (const g of glints) { const t = (phase * g.turns + g.lag) % 1; target.strokeStyle = `rgba(170,200,210,${.3 * Math.sin(Math.PI * t)})`; target.lineWidth = 1.2; const y = g.y + t * 20; target.beginPath(); target.moveTo(g.x - 10, y); target.lineTo(g.x + 10, y + 2); target.stroke(); }
    for (const f of flies) {
      const a = TAU * (phase * f.drift + f.lag), x = f.x + Math.cos(a) * f.rx, y = f.y + Math.sin(a * 2) * f.ry;
      const on = Math.max(0, Math.sin(TAU * (phase * f.blink + f.lag * 3))) ** 3;
      if (on < .02) continue;
      const r = 2 + f.near * 4;
      glow(target, x, y, r * 7, r * 7, '190,240,120', .25 * on);
      glow(target, x, y, r, r, '240,255,190', .95 * on);
      // reflection in the water when over the stream
      if (Math.abs(x - centre(y)) < half(y)) glow(target, x, y + 30 + f.near * 30, r * 2, r * 5, '190,240,120', .18 * on);
    }
  };
}

module.exports = {
  title: '반딧불이 머무는 밤의 개울',
  slug: 'firefly-creek',
  sound: 'forest',
  createScene,
};
