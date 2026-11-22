'use strict';

// 95 · 소나기 뒤 쟁기 옆 웅덩이
// The edge of a ploughed field just after a shower, at first light. An old horse-drawn plough has been
// left where it stopped: an iron beam curving down to the share, the twisted moldboard that turns the
// sod, a small gauge wheel, two worn wooden handles. Rust runs down it. Beside it a puddle lies in the
// furrows and holds the sky, which is breaking open in pale gold behind slate cloud. The last drops are
// still falling; a farmhouse and a shed stand along the far hedge.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, wobble, v3 } = paint;
const { add, mul } = v3;

const cam = camera({ x: 0, y: 1.3, z: 0, yaw: -.06, pitch: -.05, focal: 1150, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.3, 1e6])[1];
const furrow = (x, z) => .09 * Math.sin(x * 9.5 + z * .25) * Math.min(1, z / 3);

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 10, [[0, '#2a3446'], [.5, '#55606e'], [.85, '#c4a884'], [1, '#e4c89c']]);
  ctx.fillRect(0, 0, W, HORIZON + 10);
  // slate cloud breaking up: heavy masses above, torn edges lit gold from below near the horizon
  for (let i = 0; i < 50; i++) {
    const y = 40 + rnd() ** 1.3 * (HORIZON - 120), x = rnd() * W, w = 200 + rnd() * 400, h = 20 + rnd() * 50, low = y / HORIZON;
    glow(ctx, x, y, w, h, low > .6 ? '120,100,96' : '46,54,70', .35);
    if (low > .45) glow(ctx, x, y + h * .5, w * .8, h * .25, '240,200,150', .25 * low);
  }
}

function farmEdge(ctx) {
  paint.ridgeline(ctx, HORIZON + 4, 26, [40, 46, 40], 141, [[200, 1], [40, .7], [9, .5], [3, .3]], HORIZON + 40);
  const h = P([-26, 0, 90]), s = P([-14, 0, 96]);
  fill(ctx, [[h[0] - 40, h[1]], [h[0] + 30, h[1]], [h[0] + 30, h[1] - 28], [h[0] - 5, h[1] - 48], [h[0] - 40, h[1] - 28]], '#2a2c2c');
  fill(ctx, [[h[0] + 12, h[1] - 40], [h[0] + 18, h[1] - 40], [h[0] + 18, h[1] - 54], [h[0] + 12, h[1] - 54]], '#2a2c2c');
  glow(ctx, h[0] - 18, h[1] - 14, 12, 9, '255,190,120', .7);
  fill(ctx, [[s[0] - 20, s[1]], [s[0] + 24, s[1]], [s[0] + 24, s[1] - 18], [s[0] - 20, s[1] - 24]], '#34342e');
}

// Ploughed earth: ridges and troughs running away from us, wet and shining in the troughs.
function field(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#4a3e34'], [.4, '#3a2e26'], [1, '#1e1814']]);
  ctx.fillRect(0, HORIZON + 4, W, H);
  for (let r = -22; r <= 22; r++) {
    const x = r * .66, top = [], low = [];
    for (let i = 0; i <= 30; i++) {
      const z = 1.2 + (i / 30) ** 1.6 * 90;
      top.push(P([x + .02 * Math.sin(z * .3), .12, z])); low.push(P([x + .33, -.02, z]));
    }
    // the lit face of each ridge toward the bright sky, the shaded face behind it
    fill(ctx, top.concat(low.slice().reverse()), 'rgba(110,90,72,.35)');
    ctx.strokeStyle = 'rgba(20,14,10,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); low.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
    ctx.strokeStyle = 'rgba(220,190,150,.12)'; ctx.lineWidth = 1; ctx.beginPath(); top.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  }
  // clods and stones in the near furrows
  for (let i = 0; i < 1400; i++) {
    const z = 1 + rnd() ** 2 * 14, x = (rnd() - .5) * z * 2.6, s = cam.project([x, .08, z]); if (s[2] <= 0) continue;
    const k = cam.focal / s[2], r = (.02 + rnd() * .05) * k;
    ctx.fillStyle = shade([70, 56, 44], (rnd() - .5) * 30, .8); ctx.beginPath(); ctx.ellipse(s[0], s[1], r, r * .6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(230,200,160,.18)'; ctx.beginPath(); ctx.ellipse(s[0] - r * .2, s[1] - r * .3, r * .5, r * .2, 0, 0, TAU); ctx.fill();
  }
}

// The puddle: an irregular sheet of water across several furrows, reflecting the sky flipped about its edge.
function puddle(ctx, rnd) {
  const centre = [1.9, 0, 6.4], pts = [];
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = .8 + .3 * Math.sin(a * 3 + 1) + rnd() * .12; pts.push(P(add(centre, [Math.cos(a) * r * 1.3, 0, Math.sin(a) * r * 2.2]))); }
  const shape = wobble(pts, 2, 951, 6);
  // still water gives back the sky upside down: the bright gold of the horizon at its far edge, the
  // slate cloud overhead at its near edge, with a torn cloud edge lying across it
  const ys = shape.map(p => p[1]), top = Math.min(...ys), bottom = Math.max(...ys);
  fill(ctx, shape, vertical(ctx, top, bottom, [[0, '#8a765c'], [.35, '#4a4448'], [1, '#1e222e']]));
  ctx.save(); pathOf(ctx, shape); ctx.clip();
  for (let i = 0; i < 6; i++) glow(ctx, lerp(Math.min(...shape.map(p => p[0])), Math.max(...shape.map(p => p[0])), rnd()), lerp(top, bottom, .2 + rnd() * .5), 80 + rnd() * 120, 6 + rnd() * 8, '70,72,84', .5);
  ctx.restore();
  ctx.strokeStyle = 'rgba(30,22,18,.8)'; ctx.lineWidth = 2; pathOf(ctx, shape); ctx.stroke();
  return { shape, centre };
}

// The plough, in metres: beam, moldboard, share, landside, gauge wheel, handles.
function plough(ctx, rnd) {
  const O = [-.7, 0, 3.1], A = v3.unit([.85, 0, .5]), S = v3.unit([-.5, 0, .85]);
  const at = (a, s, y) => add(O, mul(A, a), mul(S, s), [0, y, 0]);
  const rust = (k = 0) => shade([96, 54, 34], k);
  // beam: a curving iron bar from the hitch at the front down to the share
  const beam = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16; beam.push(at(lerp(1.9, -.2, t), 0, .55 + .25 * Math.sin(t * Math.PI) - t * .35)); }
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2a1a14'; ctx.lineWidth = 12; ctx.beginPath(); beam.map(P).forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  ctx.strokeStyle = rust(20); ctx.lineWidth = 5; ctx.beginPath(); beam.map(P).forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] - 3) : ctx.moveTo(p[0], p[1] - 3))); ctx.stroke();
  // moldboard: a twisted plate, sampled as a grid whose rows turn from upright to laid over
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 10; c++) {
      const q = [[r, c], [r, c + 1], [r + 1, c + 1], [r + 1, c]].map(([i, j]) => {
        const u = j / 10, v = i / 8, twist = u * 1.1;
        return P(at(-.35 + u * .9, -.05 - Math.sin(twist) * v * .45, .05 + Math.cos(twist) * v * .42));
      });
      const light = .4 + .5 * (c / 10) * (1 - r / 8);
      fill(ctx, q, shade([110 * light + 40, 76 * light + 30, 52 * light + 24], (rnd() - .5) * 12));
    }
  }
  // the share's polished edge where the soil wore off the rust
  ctx.strokeStyle = 'rgba(190,190,196,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...P(at(-.4, -.02, .04))); ctx.lineTo(...P(at(.5, -.2, .03))); ctx.stroke();
  // gauge wheel at the front, spoked, half sunk in the mud
  const hub = at(1.7, .25, .28), wheel = [];
  for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; wheel.push(P(add(hub, mul(A, Math.cos(a) * .28), [0, Math.sin(a) * .28, 0]))); }
  ctx.strokeStyle = '#22160f'; ctx.lineWidth = 5; ctx.beginPath(); wheel.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  for (let i = 0; i < 6; i++) { ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...P(hub)); ctx.lineTo(...wheel[i * 4]); ctx.stroke(); }
  // handles: two worn ash poles rising back toward us, grey where hands polished them
  for (const s of [-.28, .3]) {
    const a = P(at(-.1, s * .4, .45)), b = P(at(-1.5, s, 1.05));
    ctx.strokeStyle = '#4a3c30'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,176,150,.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...lerp2(a, b, .7)); ctx.lineTo(...b); ctx.stroke();
  }
  ctx.strokeStyle = '#3a2e26'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(...P(at(-1.1, -.21, .9))); ctx.lineTo(...P(at(-1.1, .22, .9))); ctx.stroke();
  // rust run-off staining the mud under it
  glow(ctx, ...P(at(.3, 0, 0)), 140, 26, '60,30,16', .5);
}
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(95011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  farmEdge(ctx);
  field(ctx, rnd);
  const pd = puddle(ctx, rnd);
  plough(ctx, rnd);
  paint.applyTexture(ctx, make, 9501, .4, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.78, .76, .8], lights: [paint.LIGHT.dawn(HORIZON, .25, 1100, 1200)] })(ctx);
  const drops = paint.particles(rnd, 90, { kind: 'rain', near: .3, slant: .05, speed: .8 });
  const c = cam.project(pd.centre), k = cam.focal / c[2];
  const rings = Array.from({ length: 14 }, () => ({ x: c[0] + (rnd() - .5) * 2.4 * k, y: c[1] + (rnd() - .5) * .8 * k * .5, offset: rnd(), turns: 1 + Math.floor(rnd() * 3) }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); pathOf(target, pd.shape); target.clip();
    for (const r of rings) {
      const age = (phase * r.turns + r.offset) % 1;
      target.strokeStyle = `rgba(240,220,190,${.45 * (1 - age)})`; target.lineWidth = 1.2;
      target.beginPath(); target.ellipse(r.x, r.y, 3 + age * 40, 1 + age * 9, 0, 0, TAU); target.stroke();
    }
    target.restore();
    drops.draw(target, phase, '200,196,190');
  };
}

module.exports = {
  title: '소나기 뒤 쟁기 옆 웅덩이',
  slug: 'puddle-by-a-plow-after-rain',
  sound: 'rain-street',
  createScene,
};
