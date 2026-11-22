'use strict';

// 31 · 염습지에 놓인 새벽 나무길
// A boardwalk of weathered planks zigzags out across a salt marsh at dawn, on posts above mud and winding
// tidal creeks. Cordgrass and glasswort cover the marsh in tussocks of green, rust and wine; the creeks hold
// the sky's rose and gold. A rail runs along one side of the walk. Far off, a line of low hills and a
// thread of dunes. The grass leans in the wind in long waves; the creeks shine.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, shade, camera, planks, v3 } = paint;
const { add, mul } = v3;

const cam = camera({ x: .2, y: 1.7, z: 0, yaw: -.08, pitch: -.03, focal: 1100, cx: 960, cy: 540 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.7, 1e6])[1];
const HAZE = [190, 170, 170];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// The walk's centre line: straight runs that turn at angles, out over the marsh.
const legs = [[0, 0, 1.2], [1.2, 0, 14], [-6, 0, 30], [3, 0, 52], [-2, 0, 90]];
function walkAt(t) {
  const f = t * (legs.length - 1), i = Math.min(legs.length - 2, Math.floor(f));
  return v3.lerp(legs[i], legs[i + 1], f - i);
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 10, [[0, '#2e3456'], [.5, '#8a6e86'], [.85, '#e4a088'], [1, '#f4c49c']]);
  ctx.fillRect(0, 0, W, HORIZON + 10);
  glow(ctx, 640, HORIZON, 700, 160, '255,200,150', .4);
  for (let i = 0; i < 16; i++) glow(ctx, rnd() * W, 100 + rnd() * 280, 300 + rnd() * 400, 10 + rnd() * 14, '220,150,150', .18);
  paint.ridgeline(ctx, HORIZON + 2, 30, [120, 100, 116], 311, [[500, 1], [100, .4], [20, .1]], HORIZON + 30);
}

function marsh(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#8a7064'], [.3, '#5a4a3c'], [1, '#2a2418']]);
  ctx.fillRect(0, HORIZON + 2, W, H);
  // tidal creeks: meandering strips of sky-coloured water
  for (let c = 0; c < 6; c++) {
    let x = (rnd() - .5) * 60, z = 10 + rnd() * 70;
    const left = [], right = [];
    for (let i = 0; i < 40; i++) {
      x += (rnd() - .5) * 3 + Math.sin(i * .4 + c) * 1.6; z += 1.2 + z * .02;
      const w = .6 + rnd() * .5 + z * .01;
      left.push(P([x - w, 0, z])); right.push(P([x + w, 0, z]));
    }
    fill(ctx, left.concat(right.reverse()), vertical(ctx, HORIZON, H, [[0, '#f0c4a4'], [.5, '#a88494'], [1, '#4a4058']]));
  }
  // tussocks of cordgrass and glasswort in three tones
  for (let i = 0; i < 9000; i++) {
    const z = 1.5 + rnd() ** 1.8 * 90, x = (rnd() - .5) * z * 2.6, s = cam.project([x, 0, z]); if (s[2] <= 0 || s[1] < HORIZON) continue;
    const k = cam.focal / s[2], h = (.15 + rnd() * .35) * k, tone = [[88, 110, 60], [140, 80, 50], [110, 50, 60]][Math.floor(rnd() * 3)];
    ctx.strokeStyle = shade(paint.aerial(tone, Math.min(.8, z / 100), HAZE), (rnd() - .5) * 30, .7); ctx.lineWidth = Math.max(.5, .015 * k);
    ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[0] + h * .25, s[1] - h); ctx.stroke();
  }
}

// The boardwalk: plank deck on cross-beams and posts, a single rail on the left.
function boardwalk(ctx, rnd) {
  const deckH = .6, half = .75, segs = 80;
  for (let i = segs - 1; i >= 0; i--) {
    const a = walkAt(i / segs), b = walkAt((i + 1) / segs);
    const dir = v3.unit(v3.sub(b, a)), side = [dir[2], 0, -dir[0]];
    const q = [add(b, mul(side, -half), [0, deckH, 0]), add(b, mul(side, half), [0, deckH, 0]), add(a, mul(side, half), [0, deckH, 0]), add(a, mul(side, -half), [0, deckH, 0])].map(P);
    if (q.some(p => !isFinite(p[0]))) continue;
    const fog = Math.min(.8, a[2] / 100);
    // the deck's planks run across the walk
    fill(ctx, q, shade(paint.aerial([128, 112, 96], fog, HAZE), (rnd() - .5) * 22));
    ctx.strokeStyle = shade(paint.aerial([40, 32, 26], fog, HAZE), 0, .8); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...q[2]); ctx.lineTo(...q[3]); ctx.stroke();
    // the deck's edge and the posts beneath
    const edge = [q[2], q[1], P(add(b, mul(side, half), [0, deckH - .15, 0])), P(add(a, mul(side, half), [0, deckH - .15, 0]))];
    fill(ctx, edge, shade(paint.aerial([70, 58, 48], fog, HAZE)));
    if (i % 3 === 0) for (const s of [-1, 1]) {
      const top = P(add(a, mul(side, s * half * .9), [0, deckH - .1, 0])), foot = P(add(a, mul(side, s * half * .9))), k = cam.focal / Math.max(1, cam.project(a)[2]);
      ctx.strokeStyle = shade(paint.aerial([50, 40, 34], fog, HAZE)); ctx.lineWidth = Math.max(1, .12 * k); ctx.beginPath(); ctx.moveTo(...top); ctx.lineTo(...foot); ctx.stroke();
    }
    if (i % 5 === 0) {
      const rb = P(add(a, mul(side, -half), [0, deckH + 1, 0])), rf = P(add(a, mul(side, -half), [0, deckH, 0])), k = cam.focal / Math.max(1, cam.project(a)[2]);
      ctx.strokeStyle = shade(paint.aerial([90, 76, 64], fog, HAZE)); ctx.lineWidth = Math.max(1, .08 * k); ctx.beginPath(); ctx.moveTo(...rf); ctx.lineTo(...rb); ctx.stroke();
    }
  }
  // the hand rail: one continuous line along the left posts
  ctx.strokeStyle = 'rgba(120,100,86,.9)'; ctx.lineWidth = 3; ctx.beginPath();
  for (let i = 0; i <= segs; i += 1) { const a = walkAt(i / segs), b = walkAt(Math.min(1, (i + 1) / segs)), dir = v3.unit(v3.sub(b, a)), side = [dir[2], 0, -dir[0]]; const p = P(add(a, mul(side, -half), [0, deckH + 1, 0])); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }
  ctx.stroke();
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(31011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  marsh(ctx, rnd);
  boardwalk(ctx, rnd);
  paint.applyTexture(ctx, make, 3101, .32, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.86, .8, .84], lights: [paint.LIGHT.dawn(HORIZON, .3, 640, 1000)] })(ctx);
  const waves = make(W * 2, H), wc = waves.getContext('2d');
  for (let i = 0; i < 10; i++) { const x = rnd() * W * 2; for (const dx of [0, -W * 2, W * 2]) { wc.save(); wc.translate(x + dx, P([0, 0, 10])[1]); wc.rotate(-.15); glow(wc, 0, 0, 200, 700, '240,210,180', .07); wc.restore(); } }

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.beginPath(); target.rect(0, HORIZON + 4, W, H); target.clip();
    const x = (phase * W * 2) % (W * 2);
    target.drawImage(waves, -x, 0); target.drawImage(waves, W * 2 - x, 0);
    target.restore();
  };
}

module.exports = {
  title: '염습지에 놓인 새벽 나무길',
  slug: 'boardwalk-over-the-salt-marsh',
  sound: 'grass',
  createScene,
};
