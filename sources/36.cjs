'use strict';

// 36 · 해식동굴 밖 달빛 물결
// From inside a sea cave, looking out through its mouth at the moonlit sea. The cave's walls and roof frame
// the view in black, ragged rock: water-worn hollows, a glistening rim where wet stone faces the opening.
// Out beyond, the moon stands over the sea and lays its glade straight in toward us. The swell breathes in
// and out of the cave: the water inside rises and falls, its surface catching the moonlight in moving
// patches and slapping softly against the walls.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, edge, glow, pathOf, wobble } = paint;

const HORIZON = 560;
const MOON = [1010, 390];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// The mouth's outline: an irregular arch, wider at the water, leaning a little.
const MOUTH = (() => {
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, a = Math.PI * (1 - t), rx = 520 + 40 * Math.sin(t * 7), ry = 460 + 30 * Math.cos(t * 5);
    pts.push([980 + Math.cos(a) * rx + 30 * edge(i * 50, 361), HORIZON + 140 - Math.sin(a) * ry + 20 * edge(i * 50 + 9, 362)]);
  }
  return [[pts[0][0], H + 40], ...pts, [pts[40][0], H + 40]];
})();

function outside(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#0e1630'], [1, '#2e3a58']]);
  ctx.fillRect(0, 0, W, HORIZON + 2);
  paint.starfield(ctx, rnd, 200, HORIZON);
  glow(ctx, ...MOON, 260, 260, '206,220,240', .3);
  ctx.fillStyle = '#eef2f6'; ctx.beginPath(); ctx.arc(...MOON, 30, 0, TAU); ctx.fill();
  paint.ridgeline(ctx, HORIZON, 30, [30, 40, 56], 363, [[300, 1], [60, .4]], HORIZON + 4);
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#2a3650'], [1, '#0a1020']]);
  ctx.fillRect(0, HORIZON + 2, W, H);
}

// The cave walls: the rock everywhere outside the mouth, with hollows and a wet rim of light.
function cave(make, rnd) {
  const layer = make(W, H), c = layer.getContext('2d');
  c.fillStyle = vertical(c, 0, H, [[0, '#0c0d10'], [1, '#121418']]);
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 120; i++) {
    const x = rnd() * W, y = rnd() * H, r = 30 + rnd() * 140;
    glow(c, x, y, r, r * .7, rnd() < .5 ? '30,32,38' : '4,4,6', .6);
  }
  // wet rock catching the moon near the opening: bright rim strokes following the mouth's edge
  c.globalCompositeOperation = 'destination-out';
  pathOf(c, MOUTH); c.fill();
  c.globalCompositeOperation = 'source-over';
  c.save(); c.lineWidth = 60; c.strokeStyle = 'rgba(0,0,0,0)';
  for (let i = 1; i < MOUTH.length - 2; i++) {
    const [x, y] = MOUTH[i], d = Math.hypot(x - MOON[0], y - MOON[1]);
    for (let k = 0; k < 4; k++) {
      c.strokeStyle = `rgba(170,186,214,${(.4 - k * .08) * Math.max(.2, 1 - d / 900)})`; c.lineWidth = 3 - k * .5;
      c.beginPath(); c.moveTo(x + (x < 980 ? -1 : 1) * (6 + k * 10), y - k * 4); c.lineTo(MOUTH[i + 1][0] + (x < 980 ? -1 : 1) * (6 + k * 10), MOUTH[i + 1][1] - k * 4); c.stroke();
    }
  }
  c.restore();
  // stalactite-like drips of rock hanging from the roof of the mouth
  for (let i = 0; i < 10; i++) {
    const t = .2 + rnd() * .6, p = MOUTH[1 + Math.floor(t * 40)], h = 30 + rnd() * 70, w = 10 + rnd() * 20;
    fill(c, wobble([[p[0] - w, p[1] - 10], [p[0] + w, p[1] - 10], [p[0] + 2, p[1] + h]], 3, 364 + i, 8), '#0e0f12');
  }
  return layer;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(36011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  outside(ctx, rnd);
  const walls = cave(make, rnd);
  paint.applyTexture(ctx, make, 3601, .3, 0, 0, W, H, true);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the moon's glade coming straight in toward the cave
    for (let i = 0; i < 70; i++) {
      const y = HORIZON + 8 + (i / 70) ** 1.3 * (H - HORIZON), spread = 10 + (y - HORIZON) * .5;
      const x = MOON[0] + Math.sin(TAU * (phase * 3 + i * .37)) * spread * .4, a = (.5 + .5 * Math.sin(TAU * (phase * 4 + i * .61))) * .45;
      target.fillStyle = `rgba(214,226,244,${a})`; target.fillRect(x - spread * .3, y, spread * .6, 1.8);
    }
    target.drawImage(walls, 0, 0);
    // the cave's own water at the bottom: rising and falling with the swell, moon patches sliding on it
    const swell = Math.sin(TAU * phase * 2), level = H - 150 - swell * 26;
    target.fillStyle = vertical(target, level, H, [[0, 'rgba(20,30,50,.85)'], [1, 'rgba(6,8,14,.95)']]);
    target.beginPath(); target.moveTo(0, H); for (let x = 0; x <= W; x += 20) target.lineTo(x, level + 8 * Math.sin(x * .01 + TAU * phase * 2)); target.lineTo(W, H); target.fill();
    for (let i = 0; i < 30; i++) {
      const x = MOON[0] + (i - 15) * 30 + Math.sin(TAU * (phase * 2 + i * .2)) * 20, y = level + 20 + (i % 5) * 18;
      target.fillStyle = `rgba(200,214,236,${.25 * (.5 + .5 * Math.sin(TAU * (phase * 3 + i * .3)))})`; target.fillRect(x - 14, y, 28, 2);
    }
    // a lip of foam where the swell slaps the walls on the way in
    const slap = Math.max(0, swell);
    target.strokeStyle = `rgba(220,230,244,${.5 * slap})`; target.lineWidth = 3;
    target.beginPath(); target.moveTo(0, level + 4); target.lineTo(320, level + 2); target.moveTo(W - 340, level + 2); target.lineTo(W, level + 4); target.stroke();
  };
}

module.exports = {
  title: '해식동굴 밖 달빛 물결',
  slug: 'moonlit-water-through-the-grotto',
  sound: 'sea',
  createScene,
};
