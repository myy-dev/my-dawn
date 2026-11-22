'use strict';

// 61 · 달빛 한 줄이 닿는 절벽
// The bottom of a narrow canyon of dark slate at night. Two cliffs of fractured grey-blue rock rise sheer
// on either side, split into blocky facets and thin plates, wet and glinting. Through a crack far above,
// a single blade of moonlight slants down between them, full of drifting mist, and lands on the canyon
// floor in a narrow bright strip across a still pool and scattered boulders. Everything outside the beam
// is near-black blue. Water drips from the rock into the pool and rings spread slowly through the light.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, noise, pathOf } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }

// A cliff face built from many angled facets (plates of slate), each a quad with its own tilt and tone.
// A cliff face of slate: tall slabs standing side by side, stepping back from the gap. Each slab follows the
// gap's wandering edge, has a darker body, a thin lit edge on the side facing the gap, and slanted bedding
// cracks across it. Drawn from the outermost slab inward so nearer slabs overlap.
function cliff(ctx, rnd, side) {
  const inner = y => 960 + side * (120 + 260 * (y / H) ** 1.4 + 60 * noise(y / 120, side, 3));
  const slabs = [];
  let d = 0;
  while (d < 1100) { const w = 40 + rnd() * 120; slabs.push({ d, w, jag: rnd() * 100, tone: rnd() }); d += w * (.7 + rnd() * .2); }
  for (const sl of slabs.reverse()) {
    const edge = y => inner(y) + side * (sl.d + 18 * noise(y / 60, sl.jag, 5) - 9);
    const back = y => edge(y) + side * sl.w;
    const pts = [];
    for (let y = -40; y <= H + 40; y += 24) pts.push([edge(y), y]);
    for (let y = H + 40; y >= -40; y -= 24) pts.push([back(y), y]);
    const near = 1 - Math.min(1, sl.d / 900);
    fill(ctx, pts, shade([34, 40, 54].map(c => c * (.55 + .5 * near + .2 * sl.tone)), 0));
    // the lit edge: a thin strip on the gap side, brighter toward the moonbeam's height
    const lip = [];
    for (let y = -40; y <= H + 40; y += 24) lip.push([edge(y), y]);
    for (let y = H + 40; y >= -40; y -= 24) lip.push([edge(y) + side * (4 + 6 * near), y]);
    fill(ctx, lip, `rgba(150,170,210,${.12 + .25 * near})`);
    // bedding cracks: slanted lines across the slab
    ctx.strokeStyle = `rgba(8,10,18,${.35 + .3 * near})`; ctx.lineWidth = 1.5;
    for (let c = 0; c < 9; c++) { const y = rnd() * H, x0 = edge(y), x1 = back(y + 20); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y + 26 + rnd() * 20); ctx.stroke(); }
  }
  return inner;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(61011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.fillStyle = '#05070c'; ctx.fillRect(0, 0, W, H);
  // the crack of sky at the top and the far end of the canyon fading into mist
  const sky = ctx.createLinearGradient(0, 0, 0, 300); sky.addColorStop(0, '#1a2440'); sky.addColorStop(1, '#0a0e1a');
  ctx.fillStyle = sky; ctx.fillRect(820, 0, 280, 300);
  paint.starfield(ctx, rnd, 40, 160);
  glow(ctx, 960, 560, 260, 300, '60,70,100', .3);
  // floor: dark gravel, the pool, boulders
  const floorY = 800;
  ctx.fillStyle = '#0c0e14'; ctx.fillRect(0, floorY - 120, W, H);
  for (let i = 0; i < 1400; i++) { const y = floorY - 120 + rnd() ** .6 * 400, x = rnd() * W; ctx.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '70,80,100'},.3)`; ctx.fillRect(x, y, 2 + (y - floorY) * .02, 1 + (y - floorY) * .01); }
  const pool = []; for (let a = 0; a < 24; a++) { const t = a / 24 * TAU; pool.push([1000 + Math.cos(t) * (330 + 30 * Math.sin(t * 3)), 880 + Math.sin(t) * (80 + 10 * Math.cos(t * 2))]); }
  fill(ctx, pool, '#06080e');
  for (let i = 0; i < 14; i++) { const x = rnd() * W, y = floorY - 60 + rnd() * 300, r = 16 + rnd() * 50 * (y / floorY); fill(ctx, paint.wobble(Array.from({ length: 9 }, (_, k) => [x + Math.cos(k / 9 * TAU) * r * 1.3, y + Math.sin(k / 9 * TAU) * r * .6 - r * .3]), r * .1, 611 + i, 10), shade([40, 46, 60], (rnd() - .5) * 16)); }
  cliff(ctx, rnd, -1); cliff(ctx, rnd, 1);
  // the moonbeam's strip on the floor: across the pool and gravel, with a reflected sheen
  const strip = [[860, 700], [980, 700], [1220, H], [980, H]];
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; fill(ctx, strip, 'rgba(110,130,170,.28)');
  ctx.save(); pathOf(ctx, pool); ctx.clip(); fill(ctx, strip, 'rgba(160,180,220,.25)'); ctx.restore(); ctx.restore();
  paint.applyTexture(ctx, make, 6101, .36, 0, 0, W, H, true);
  const motes = Array.from({ length: 70 }, () => ({ t: rnd(), u: rnd(), lag: rnd() * TAU, turns: 1 + Math.floor(rnd() * 2) }));
  const drips = [{ x: 1150, top: 520 }, { x: 900, top: 600 }, { x: 1260, top: 650 }].map((d, i) => ({ ...d, offset: i / 3, turns: 2 + i }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the blade of light from the crack to the floor, breathing a little as mist moves through it
    const breath = .8 + .2 * Math.sin(TAU * phase);
    target.save(); target.globalCompositeOperation = 'lighter';
    const g = target.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(150,170,210,${.2 * breath})`); g.addColorStop(1, `rgba(150,170,210,${.05 * breath})`);
    target.fillStyle = g; target.beginPath(); target.moveTo(900, 0); target.lineTo(940, 0); target.lineTo(1220, H); target.lineTo(980, H); target.fill();
    for (const m of motes) { const t = (m.t + phase * .2 * m.turns) % 1, x = lerp(lerp(900, 980, m.u), lerp(940, 1220, m.u), t) + Math.sin(TAU * phase * m.turns + m.lag) * 8, y = t * H; glow(target, x, y, 2.5, 2.5, '210,220,250', .45 * Math.sin(Math.PI * t)); }
    for (let i = 0; i < 4; i++) glow(target, lerp(920, 1100, i / 3) + Math.sin(TAU * (phase + i * .25)) * 30, 300 + i * 160, 120, 50, '150,170,210', .06);
    target.restore();
    // drips from the rock: fall, then rings in the pool
    for (const d of drips) {
      const t = (phase * d.turns + d.offset) % 1;
      if (t < .25) { const y = lerp(d.top, 870, (t / .25) ** 2); target.fillStyle = 'rgba(190,210,240,.8)'; target.fillRect(d.x - 1, y, 2, 8); }
      else { const r = (t - .25) / .75; target.strokeStyle = `rgba(170,190,230,${.5 * (1 - r)})`; target.lineWidth = 1.2; target.beginPath(); target.ellipse(d.x, 878, 6 + r * 90, 2 + r * 18, 0, 0, TAU); target.stroke(); }
    }
  };
}

module.exports = {
  title: '달빛 한 줄이 닿는 절벽',
  slug: 'moonlight-between-slate-walls',
  sound: 'gust',
  createScene,
};
