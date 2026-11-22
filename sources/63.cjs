'use strict';

// 63 · 고원 전망대의 빈 나무 의자
// A lookout on a highland ridge at dawn. In the foreground an old wooden bench stands on a few flat stones
// at the edge, its slats weathered grey, one end of its back sagging; tall grass grows up around its legs.
// Beyond it the land drops away into a vast valley: ridge after ridge receding in bluer and paler layers,
// with rivers of mist lying in the folds between them. The sky over the far ridges warms to peach and
// gold. The grass bends and recovers in the wind; the mist slowly flows along the valleys.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, noise, pathOf } = paint;

const cam = camera({ x: 0, y: 1.3, z: 0, yaw: .1, pitch: -.04, focal: 1100, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(.1) * 1e6, 1.3, Math.cos(.1) * 1e6])[1];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(63011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON + 60);
  sky.addColorStop(0, '#2a3458'); sky.addColorStop(.55, '#8a7e9a'); sky.addColorStop(.85, '#c89080'); sky.addColorStop(1, '#e0a888');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  glow(ctx, 700, HORIZON + 20, 700, 140, '255,210,160', .22);
  for (let i = 0; i < 10; i++) glow(ctx, rnd() * W, 80 + rnd() * 240, 200 + rnd() * 300, 8 + rnd() * 12, '250,190,170', .25);
  // the ridges: ten layers from far (pale, low contrast) to near (dark, blue-green); mist between
  const layers = 10, mists = [];
  for (let l = 0; l < layers; l++) {
    const t = l / (layers - 1), base = HORIZON + 10 + t * t * 360, amp = 20 + t * 90;
    const far = [200, 170, 180], near = [40, 56, 70], c = far.map((f, i) => lerp(f, near[i], t ** .8));
    const ridge = x => base - amp * (noise(x / (700 - l * 40), l * 3.1, 9) * 1.2 - .2) - amp * .25 * noise(x / 90, l, 4);
    ctx.fillStyle = shade(c, 0); ctx.beginPath(); ctx.moveTo(-10, H); for (let x = -10; x <= W + 10; x += 12) ctx.lineTo(x, ridge(x)); ctx.lineTo(W + 10, H); ctx.fill();
    // the sunward slopes: a warm wash on the left-facing flanks
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let x = 0; x < W; x += 24) { const d = ridge(x) - ridge(x + 24); if (d > 2) glow(ctx, x + 12, ridge(x) + 20, 30, 30, '120,70,40', Math.min(.3, d * .02) * (1 - t)); }
    ctx.restore();
    mists.push({ y: base + 20, a: .35 * (1 - t * .6), w: 1600 });
  }
  // the foreground ground: a grassy rise with flat stones
  ctx.fillStyle = '#1a2420'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 820); ctx.bezierCurveTo(500, 790, 1200, 780, W, 840); ctx.lineTo(W, H); ctx.fill();
  for (let i = 0; i < 7; i++) { const x = 760 + i * 70 + (rnd() - .5) * 30, y = 900 + (rnd() - .5) * 20; fill(ctx, paint.wobble([[x - 40, y], [x + 40, y - 4], [x + 44, y + 16], [x - 36, y + 18]], 3, 631 + i, 8), shade([96, 96, 92], (rnd() - .5) * 20)); }
  // the bench: two trestles, three seat slats, a back of two rails, the right end of the back sagging
  const bench = (x, y, z) => P([x, y, z]);
  const Z = 3.4, X0 = -.6, X1 = 1.2, SEAT = .45;
  for (const x of [X0 + .15, X1 - .15]) { for (const dz of [-.2, .2]) { const a = bench(x, 0, Z + dz), b = bench(x, SEAT, Z + dz); ctx.strokeStyle = '#3a3430'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); } const a = bench(x, SEAT + .02, Z + .22), b = bench(x, .95, Z + .32); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  for (let s = 0; s < 3; s++) { const z = Z - .18 + s * .14; const a = bench(X0, SEAT, z), b = bench(X1, SEAT - .03 * (s === 2), z); ctx.strokeStyle = shade([120, 112, 102], s * 6 - 8); ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.strokeStyle = 'rgba(255,230,200,.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a[0], a[1] - 5); ctx.lineTo(b[0], b[1] - 5); ctx.stroke(); }
  for (const [y, sag] of [[.72, .03], [.92, .1]]) { const a = bench(X0, y, Z + .28), m = bench((X0 + X1) / 2, y - sag * .3, Z + .29), b = bench(X1, y - sag, Z + .3); ctx.strokeStyle = '#7a7268'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(...a); ctx.quadraticCurveTo(...m, ...b); ctx.stroke(); }
  paint.applyTexture(ctx, make, 6301, .34, 0, 0, W, H, true);
  // grass in clumps around the bench and along the front, drawn per frame for the wind
  const blades = Array.from({ length: 1300 }, () => { const x = rnd() * W, y = lerp(800, H + 20, rnd() ** .8), h = 30 + (y - 780) * .35 * (.5 + rnd()); return { x, y, h, lag: rnd() * TAU, tone: (rnd() - .5) * 26, seed: rnd() }; });
  const flows = mists.map((m, i) => ({ ...m, lag: rnd(), turns: (i % 2 ? 1 : -1) }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const m of flows) for (let j = 0; j < 4; j++) { const x = ((j / 4 + phase * m.turns + m.lag) % 1 + 1) % 1 * (W + 800) - 400; glow(target, x, m.y, 500, 16, '240,220,230', m.a * .5); }
    // wind: a gust passing across the grass twice a loop
    target.lineCap = 'round';
    for (const b of blades) {
      const gust = .5 + .5 * Math.sin(TAU * (phase * 2 - b.x / W));
      const sway = (Math.sin(TAU * phase * 6 + b.lag) * .08 + gust * .35) * b.h;
      target.strokeStyle = shade([66, 82, 56], b.tone + gust * 10); target.lineWidth = 1.2 + b.h * .015;
      target.beginPath(); target.moveTo(b.x, b.y); target.quadraticCurveTo(b.x + sway * .3, b.y - b.h * .6, b.x + sway, b.y - b.h * (1 - gust * .12)); target.stroke();
    }
  };
}

module.exports = {
  title: '고원 전망대의 빈 나무 의자',
  slug: 'empty-bench-on-the-highland',
  sound: 'grass',
  createScene,
};
