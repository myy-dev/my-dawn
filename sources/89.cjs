'use strict';

// 89 · 전봇대에 내리는 첫눈
// A country road at first light on the morning of the first snow. The road bends away across open fields;
// a line of old timber telephone poles follows it, each leaning its own way, crossarms carrying glass
// insulators, wires sagging between them in real catenaries. The snow has only dusted the fields: dark
// stubble rows show through in streaks. A crow sits on the nearest wire. Snow falls, thin and steady.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, camera, v3 } = paint;
const { add, mul } = v3;

const cam = camera({ x: -1.2, y: 1.6, z: 0, yaw: .06, pitch: .01, focal: 1150, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.6, 1e6])[1];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// The road's centre line bends gently right and then away.
const road = t => [lerp(0, 18, t ** 2.2) + Math.sin(t * 3) * 2, 0, lerp(2, 240, t ** 1.4)];

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 10, [[0, '#2a3242'], [.5, '#4a5262'], [.85, '#767c88'], [1, '#8c8e96']]);
  ctx.fillRect(0, 0, W, HORIZON + 10);
  // low, heavy snow cloud in long soft rolls
  for (let i = 0; i < 40; i++) glow(ctx, rnd() * W, 60 + rnd() * 380, 300 + rnd() * 500, 30 + rnd() * 60, i % 3 ? '60,68,84' : '120,124,136', .12 + rnd() * .1);
  paint.ridgeline(ctx, HORIZON + 1, 22, [90, 96, 108], 91, [[400, 1], [80, .5], [14, .3]], HORIZON + 30);
  paint.ridgeline(ctx, HORIZON + 4, 12, [70, 76, 88], 92, [[160, 1], [30, .6], [7, .4], [3, .3]], HORIZON + 30);
}

// Fields: dark ploughed earth under a thin, patchy snow; stubble rows run toward the road's vanishing point.
function fields(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#8a8e98'], [.3, '#6e727c'], [1, '#3c3e44']]);
  ctx.fillRect(0, HORIZON + 2, W, H);
  for (const side of [-1, 1]) {
    for (let row = 0; row < 40; row++) {
      const off = side * (3 + row * 2.2 + rnd() * .6), pts = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, c = road(t);
        pts.push(P(add(c, [off * (1 + t * 1.5), 0, 0])));
      }
      ctx.strokeStyle = `rgba(34,32,30,${.08 + rnd() * .12})`; ctx.lineWidth = Math.max(.8, 2 - row * .04);
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
    }
  }
  // the dusting is uneven: drifts in hollows, bare patches where the wind scoured
  for (let i = 0; i < 160; i++) {
    const z = 4 + rnd() ** 1.5 * 120, x = (rnd() - .5) * z * 2.6, s = cam.project([x, 0, z]);
    if (s[2] <= 0) continue;
    const k = cam.focal / s[2];
    glow(ctx, s[0], s[1], (2 + rnd() * 6) * k, (.15 + rnd() * .3) * k, rnd() < .6 ? '200,206,216' : '40,40,44', .25);
  }
}

function roadBed(ctx, rnd) {
  const left = [], right = [], shoulderL = [], shoulderR = [];
  for (let i = 0; i <= 50; i++) {
    const t = i / 50, c = road(t);
    left.push(P(add(c, [-2.8, 0, 0]))); right.push(P(add(c, [2.8, 0, 0])));
    shoulderL.push(P(add(c, [-3.6, 0, 0]))); shoulderR.push(P(add(c, [3.6, 0, 0])));
  }
  fill(ctx, shoulderL.concat(shoulderR.slice().reverse()), '#5a5c62');
  fill(ctx, left.concat(right.slice().reverse()), vertical(ctx, HORIZON, H, [[0, '#7c7e86'], [1, '#3e4046']]));
  // snow has settled on the road's crown and stays wet and dark in the two wheel tracks
  for (const off of [-1.3, 1.3]) {
    const track = [];
    for (let i = 0; i <= 50; i++) track.push(P(add(road(i / 50), [off - .35, 0, 0])));
    for (let i = 50; i >= 0; i--) track.push(P(add(road(i / 50), [off + .35, 0, 0])));
    fill(ctx, track, 'rgba(36,38,44,.3)');
  }
  for (let i = 0; i < 600; i++) {
    const t = rnd() ** 1.5, c = add(road(t), [(rnd() - .5) * 5.4, 0, 0]), s = cam.project(c);
    if (s[2] <= 0) continue;
    ctx.fillStyle = `rgba(214,218,226,${.12 + rnd() * .2})`; ctx.fillRect(s[0], s[1], 1.4, 1.2);
  }
}

// Poles along the right verge: each has its own lean, height and crossarm tilt.
function makePoles(rnd) {
  const poles = [];
  for (let t = .03; t < 1; t += .045 + t * .05) {
    const c = road(t), base = add(c, [5.4 + rnd() * .4, 0, 0]);
    poles.push({ base, h: 8.4 + rnd() * .9, lean: [(rnd() - .5) * .05, 0, (rnd() - .5) * .04], tilt: (rnd() - .5) * .06, r: .14 + rnd() * .03 });
  }
  return poles;
}
const topOf = p => add(p.base, [0, p.h, 0], mul(p.lean, p.h));
const armEnd = (p, side) => add(topOf(p), [side * 1.05, -.45 + side * p.tilt, 0]);

function poles(ctx, rnd, list) {
  // wires first, as catenaries between matching insulators, sagging more on the longer spans
  for (const side of [-1, -.4, .4, 1]) {
    for (let i = 1; i < list.length; i++) {
      const a = add(armEnd(list[i - 1], side), [0, .12, 0]), b = add(armEnd(list[i], side), [0, .12, 0]);
      const span = Math.hypot(b[0] - a[0], b[2] - a[2]), sag = span * .035;
      ctx.strokeStyle = 'rgba(30,30,36,.85)'; ctx.lineWidth = Math.max(.7, 2.2 - i * .12);
      ctx.beginPath();
      for (let k = 0; k <= 16; k++) {
        const t = k / 16, p = add(v3.lerp(a, b, t), [0, -sag * 4 * t * (1 - t), 0]), s = P(p);
        k ? ctx.lineTo(...s) : ctx.moveTo(...s);
      }
      ctx.stroke();
    }
  }
  for (const p of list.slice().reverse()) {
    const top = topOf(p), side = [p.r, 0, 0];
    const body = [P(add(top, mul(side, -.8))), P(add(top, mul(side, .8))), P(add(p.base, side)), P(add(p.base, mul(side, -1)))];
    const g = ctx.createLinearGradient(body[3][0], 0, body[2][0], 0);
    g.addColorStop(0, '#2e2622'); g.addColorStop(.35, '#5a4a40'); g.addColorStop(1, '#1e1a18');
    fill(ctx, body, g);
    // snow caught on the pole top and the crossarm
    const arm = [armEnd(p, -1.08), armEnd(p, 1.08)].map(P), w = Math.max(2, (body[1][0] - body[0][0]) * .8);
    ctx.strokeStyle = '#2a2220'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(...arm[0]); ctx.lineTo(...arm[1]); ctx.stroke();
    ctx.strokeStyle = 'rgba(220,224,232,.7)'; ctx.lineWidth = Math.max(1, w * .35); ctx.beginPath(); ctx.moveTo(arm[0][0], arm[0][1] - w * .5); ctx.lineTo(arm[1][0], arm[1][1] - w * .5); ctx.stroke();
    for (const s of [-1, -.4, .4, 1]) {
      const ins = P(add(armEnd(p, s), [0, .1, 0])), r = Math.max(1.5, w * .45);
      ctx.fillStyle = 'rgba(120,170,160,.85)'; ctx.beginPath(); ctx.ellipse(ins[0], ins[1], r * .7, r, 0, 0, TAU); ctx.fill();
    }
    const cap = P(add(top, [0, .05, 0]));
    ctx.fillStyle = 'rgba(220,224,232,.8)'; ctx.beginPath(); ctx.ellipse(cap[0], cap[1], w * .7, w * .3, 0, 0, TAU); ctx.fill();
  }
}

// A crow on the nearest span, hunched against the cold.
function crow(ctx, list) {
  const a = add(armEnd(list[0], -.4), [0, .12, 0]), b = add(armEnd(list[1], -.4), [0, .12, 0]), t = .38;
  const span = Math.hypot(b[0] - a[0], b[2] - a[2]), at = P(add(v3.lerp(a, b, t), [0, -span * .035 * 4 * t * (1 - t), 0]));
  const k = cam.focal / cam.project(a)[2] * .5;
  ctx.fillStyle = '#0e0e12';
  ctx.beginPath(); ctx.ellipse(at[0], at[1] - k * .2, k * .16, k * .2, -.3, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(at[0] - k * .08, at[1] - k * .42, k * .08, k * .08, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(at[0] - k * .14, at[1] - k * .44); ctx.lineTo(at[0] - k * .26, at[1] - k * .4); ctx.lineTo(at[0] - k * .14, at[1] - k * .38); ctx.fill();
  ctx.beginPath(); ctx.moveTo(at[0] + k * .08, at[1] - k * .1); ctx.lineTo(at[0] + k * .28, at[1] + k * .1); ctx.lineTo(at[0] + k * .12, at[1]); ctx.fill();
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(89011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  fields(ctx, rnd);
  roadBed(ctx, rnd);
  // a farmhouse far down the road, its kitchen light on
  const fh = P(add(road(.75), [-14, 0, 0]));
  fill(ctx, [[fh[0] - 20, fh[1]], [fh[0] + 16, fh[1]], [fh[0] + 16, fh[1] - 12], [fh[0] - 2, fh[1] - 22], [fh[0] - 20, fh[1] - 12]], '#3a3c44');
  glow(ctx, fh[0] + 6, fh[1] - 6, 10, 8, '255,190,120', .8);
  const list = makePoles(rnd);
  poles(ctx, rnd, list);
  crow(ctx, list);
  paint.applyTexture(ctx, make, 8901, .4, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.8, .82, .88], lights: [] })(ctx);
  const snow = paint.particles(rnd, 380, { kind: 'snow', near: .2 });

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    snow.draw(target, phase, '236,240,246');
  };
}

module.exports = {
  title: '전봇대에 내리는 첫눈',
  slug: 'first-snow-on-the-telephone-poles',
  sound: 'snow',
  createScene,
};
