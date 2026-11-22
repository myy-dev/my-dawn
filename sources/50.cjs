'use strict';

// 50 · 소나무 끝에 걸린 달
// An old red pine leans out from a rocky ridge into the night, and the full moon has risen to sit just at
// the end of its highest branch. The trunk twists, its bark breaking into red-brown plates that go grey
// low down; the branches reach out nearly level in the pine's way, each ending in dense tufts of needles
// that fan out like brushes. Below, the ridge drops into a valley full of mist, layered ridges beyond.
// The needles stir in the night wind; the mist creeps along the valley.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, wobble } = paint;

const MOON = [1380, 250];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#060a16'], [.55, '#18223a'], [1, '#2a3448']]);
  ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 300, 700);
  glow(ctx, ...MOON, 420, 420, '210,220,236', .25);
  glow(ctx, ...MOON, 90, 90, '236,240,246', .5);
  ctx.fillStyle = '#eef0f2'; ctx.beginPath(); ctx.arc(...MOON, 46, 0, TAU); ctx.fill();
  // maria: the moon's darker seas
  for (const [dx, dy, r] of [[-14, -10, 14], [10, 6, 11], [-4, 16, 8], [16, -14, 7]]) { ctx.fillStyle = 'rgba(170,176,190,.45)'; ctx.beginPath(); ctx.arc(MOON[0] + dx, MOON[1] + dy, r, 0, TAU); ctx.fill(); }
  // valley ridges in layers, mist between them
  const layers = [[760, 120, [44, 54, 76], 501], [840, 110, [32, 40, 58], 502], [930, 90, [22, 28, 40], 503]];
  for (const [base, amp, color, seed] of layers) {
    paint.ridgeline(ctx, base, amp, color, seed, [[500, 1], [120, .5], [30, .2], [8, .08]]);
    glow(ctx, W / 2, base + 30, 1200, 50, '120,134,160', .3);
  }
}

// The rocky ridge the pine grows from: a jagged outcrop at the lower left.
function rock(ctx, rnd) {
  const pts = [[0, 640], [180, 660], [320, 720], [420, 800], [560, 900], [700, 1000], [760, H], [0, H]];
  fill(ctx, wobble(pts, 10, 5011, 18), vertical(ctx, 640, H, [[0, '#2a2e36'], [1, '#101216']]));
  for (let i = 0; i < 30; i++) {
    const x = rnd() * 600, y = 680 + rnd() * 380;
    ctx.strokeStyle = 'rgba(160,170,190,.18)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30 + rnd() * 60, y - 10 - rnd() * 20); ctx.stroke();
  }
}

// The pine: a trunk that leans out of the rock and bends toward level as it reaches for the moon, with
// branches stepping off it nearly horizontal. Needle tufts sit along the upper side of every branch and
// crowd at its end, the way a pine carries its foliage in flat layered pads.
function growPine(rnd) {
  const segs = [], tufts = [];
  const bez = (p0, p1, p2, t) => { const u = 1 - t; return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]; };
  const trunk = [[240, 790], [520, 300], [1300, 300]];
  const steps = 26;
  for (let i = 0; i < steps; i++) {
    const a = bez(...trunk, i / steps), b = bez(...trunk, (i + 1) / steps);
    segs.push({ a: [a[0] + (rnd() - .5) * 6, a[1]], b: [b[0] + (rnd() - .5) * 6, b[1]], w: lerp(64, 14, i / steps), depth: 0 });
  }
  for (let i = 5; i < steps; i += 2 + Math.floor(rnd() * 2)) {
    const p = bez(...trunk, i / steps), side = rnd() < .5 ? -1 : 1;
    let x = p[0], y = p[1], ang = side < 0 ? -Math.PI + .2 + rnd() * .3 : -.15 + rnd() * .3;
    if (side < 0 && x < 500) continue;
    const len = 160 + rnd() * 220, n = 6;
    for (let k = 0; k < n; k++) {
      ang += (rnd() - .5) * .3 - (ang + (side < 0 ? Math.PI : 0)) * .1;
      const nx = x + Math.cos(ang) * len / n, ny = y + Math.sin(ang) * len / n;
      segs.push({ a: [x, y], b: [nx, ny], w: lerp(16, 4, k / n) * lerp(1, .5, i / steps), depth: 1 });
      if (k > 1 && rnd() < .7) tufts.push({ x: nx, y: ny, a: -Math.PI / 2 + (rnd() - .5) * .6, size: 34 + rnd() * 22, lag: rnd() * TAU });
      x = nx; y = ny;
    }
    for (let t = 0; t < 3; t++) tufts.push({ x: x + (rnd() - .5) * 40, y: y + (rnd() - .5) * 16, a: ang + (rnd() - .5) * .8, size: 44 + rnd() * 26, lag: rnd() * TAU });
  }
  const tip = bez(...trunk, 1);
  for (let t = 0; t < 5; t++) tufts.push({ x: tip[0] + (rnd() - .5) * 60, y: tip[1] + (rnd() - .5) * 30, a: (rnd() - .5) * 1.4 - .3, size: 50 + rnd() * 20, lag: rnd() * TAU });
  return { segs, tufts };
}

function drawPine(ctx, rnd, pine) {
  ctx.lineCap = 'round';
  for (const s of pine.segs) {
    // red bark plates up high, grey and furrowed lower down
    const low = s.depth === 0 && s.a[1] > 520;
    ctx.strokeStyle = low ? '#2e2a2a' : shade([96, 50, 38], (rnd() - .5) * 20); ctx.lineWidth = s.w;
    ctx.beginPath(); ctx.moveTo(...s.a); ctx.lineTo(...s.b); ctx.stroke();
    ctx.strokeStyle = 'rgba(200,170,150,.18)'; ctx.lineWidth = s.w * .25;
    ctx.beginPath(); ctx.moveTo(s.a[0] + s.w * .2, s.a[1] - s.w * .2); ctx.lineTo(s.b[0] + s.w * .2, s.b[1] - s.w * .2); ctx.stroke();
    if (s.w > 10) for (let p = 0; p < 3; p++) {
      const t = rnd(), x = lerp(s.a[0], s.b[0], t), y = lerp(s.a[1], s.b[1], t);
      ctx.strokeStyle = 'rgba(20,10,8,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - s.w * .3, y); ctx.lineTo(x + s.w * .3, y + 2); ctx.stroke();
    }
  }
}

// A tuft of needles: dozens of fine straight needles fanning from the twig end, upturned like a brush.
function tuft(ctx, t, sway) {
  const rnd = paint.seeded(Math.floor(t.x * 13 + t.y * 7));
  for (let i = 0; i < 46; i++) {
    const a = t.a - Math.PI / 2 * .6 + (rnd() - .5) * 2.4 + sway, l = t.size * (.5 + rnd() * .5);
    const x0 = t.x + (rnd() - .5) * 8, y0 = t.y + (rnd() - .5) * 6;
    ctx.strokeStyle = rnd() < .2 ? 'rgba(120,140,150,.7)' : shade([22, 40, 30], (rnd() - .5) * 16, .95); ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + Math.cos(a) * l, y0 + Math.sin(a) * l); ctx.stroke();
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(50011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  rock(ctx, rnd);
  const pine = growPine(rnd);
  // the pine's reach is aimed so its highest tufts land at the moon
  drawPine(ctx, rnd, pine);
  paint.applyTexture(ctx, make, 5001, .32, 0, 0, W, H, true);
  const mist = make(W * 2, 200), mc = mist.getContext('2d');
  for (let i = 0; i < 30; i++) { const x = rnd() * W * 2; for (const dx of [0, -W * 2, W * 2]) glow(mc, x + dx, 100, 260 + rnd() * 300, 20 + rnd() * 24, '140,154,180', .18); }

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    const mx = (phase * W * 2) % (W * 2);
    target.drawImage(mist, -mx, 760); target.drawImage(mist, W * 2 - mx, 760);
    for (const t of pine.tufts) tuft(target, t, .05 * Math.sin(TAU * phase * 2 + t.lag) + .03 * Math.sin(TAU * phase * 5 + t.lag));
  };
}

module.exports = {
  title: '소나무 끝에 걸린 달',
  slug: 'moon-among-pine-needles',
  sound: 'leaves',
  createScene,
};
