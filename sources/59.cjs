'use strict';

// 59 · 별이 보이는 사암 협곡
// Deep inside a slot canyon at night, looking up. The sandstone walls rise on both sides in smooth flowing
// curves carved by old floods, their layers sweeping in bands of rust, salmon and cream that bulge and
// pinch as they climb. High above, the walls almost meet, leaving a winding ribbon of sky full of stars.
// Starlight is faint; the walls are lit only by the glow from that ribbon, brightest on the overhangs that
// face up. A thread of sand trickles from a ledge now and then; the stars in the gap twinkle.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, noise, pathOf } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }

// The gap: its left and right edges as functions of y (the slot winds as it rises).
const gapL = y => 860 + 140 * Math.sin(y / 190) - 60 * Math.sin(y / 70 + 1) - (1 - y / H) * 40;
const gapR = y => gapL(y) + 60 + 120 * (1 - y / H) ** 2 + 40 * Math.sin(y / 120 + 2);

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(59011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  // sky behind everything
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0a1026'); sky.addColorStop(1, '#1a2440');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 500, H);
  // each wall: flowing bands that follow the gap's edge outward, the way flood-carved sandstone curves
  // round a slot; nearest the gap they glow with reflected sky, farther out they sink into dark rust.
  for (const side of [-1, 1]) {
    for (let d = 0; d <= 1100; d += 14) {
      const wave = y => 26 * Math.sin(y / 90 + d / 70) * Math.min(1, d / 120) + 14 * noise(y / 160, d / 90, side + 4);
      const edge = y => (side < 0 ? gapL(y) : gapR(y)) + side * (d * (1 + .5 * (1 - y / H)) + wave(y));
      const pts = [];
      for (let i = 0; i <= 40; i++) { const y = lerp(-20, H + 20, i / 40); pts.push([edge(y), y]); }
      const outer = side < 0 ? -60 : W + 60;
      pts.push([outer, H + 20], [outer, -20]);
      const t = d / 1100, layer = Math.floor(d / 14) % 7;
      const tone = [[214, 126, 84], [196, 104, 70], [228, 150, 100], [170, 84, 60], [204, 118, 80], [236, 170, 120], [180, 96, 70]][layer];
      const light = .1 + .62 * Math.exp(-d / 160) + .05 * (layer % 2);
      fill(ctx, pts, shade(tone.map(c => c * light * (1 - t * .4)), 0));
    }
  }
  glow(ctx, 960, 200, 300, 400, '140,150,200', .1);
  paint.applyTexture(ctx, make, 5901, .38, 0, 0, W, H, true);
  // stars visible in the gap (for twinkling): sample positions inside it
  const twinkle = [];
  for (let i = 0; i < 40; i++) { const y = rnd() * H * .8, x = lerp(gapL(y), gapR(y), rnd()); twinkle.push({ x, y, lag: rnd(), turns: 1 + Math.floor(rnd() * 3) }); }
  const trickle = { x: gapL(620) + 20, y: 620 };

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const t of twinkle) glow(target, t.x, t.y, 3, 3, '235,240,255', .3 + .35 * Math.sin(TAU * (phase * t.turns + t.lag)));
    // sand trickling off a ledge in a thin stream, twice a loop
    const on = Math.max(0, Math.sin(TAU * phase * 2));
    for (let i = 0; i < 30; i++) { const t = (phase * 6 + i / 30) % 1, y = trickle.y + t * t * 420; target.fillStyle = `rgba(210,170,130,${.5 * on * (1 - t)})`; target.fillRect(trickle.x + Math.sin(i) * 2 + t * 6, y, 1.5, 3); }
  };
}

module.exports = {
  title: '별이 보이는 사암 협곡',
  slug: 'stars-through-sandstone',
  sound: 'gust',
  createScene,
};
