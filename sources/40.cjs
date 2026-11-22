'use strict';

// 40 · 연잎이 흔들리는 나무다리
// A lotus pond at night under an arched wooden footbridge. The bridge springs from bank to bank in a
// shallow curve, its deck of planks and its rail posts dark against the sky, two stone lanterns at its feet
// lit. The pond is crowded with lotus: big round leaves lying flat or held up on stalks and cupped, buds
// standing up, two or three flowers open and pale. Between the leaves the water reflects the bridge and the
// moon. A breeze lifts the standing leaves; ripples spread from where a drop falls off a leaf.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, v3 } = paint;
const { add } = v3;

const cam = camera({ x: 0, y: 1.4, z: 0, yaw: 0, pitch: .02, focal: 1100, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const M = paint.mirrorOf(cam, 0);
const HORIZON = cam.project([0, 1.4, 1e6])[1];
const MOON = [1380, 160];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// The bridge: an arch of plank deck from bank to bank, posts and a rail along its near side.
const span = t => [lerp(-9, 9, t), .6 + 2.2 * Math.sin(Math.PI * t), 22 + Math.sin(t * 2) * .5];
function bridge(ctx, Q) {
  const near = [], far = [], under = [];
  for (let i = 0; i <= 30; i++) { const p = span(i / 30); near.push(Q(p)); far.push(Q(add(p, [0, 0, 2]))); under.push(Q(add(p, [0, -.35, 0]))); }
  fill(ctx, near.concat(far.slice().reverse()), '#4a3a30');
  for (let i = 0; i < 30; i++) { ctx.strokeStyle = 'rgba(10,6,4,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...near[i]); ctx.lineTo(...far[i]); ctx.stroke(); }
  fill(ctx, near.concat(under.slice().reverse()), '#2a201a');
  for (let i = 0; i <= 30; i += 3) {
    const p = span(i / 30);
    ctx.strokeStyle = '#2a201a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(...Q(p)); ctx.lineTo(...Q(add(p, [0, 1, 0]))); ctx.stroke();
    if (i > 0 && i < 30) { ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(...Q(add(p, [0, -.35, 0]))); ctx.lineTo(...Q([p[0], 0, p[2]])); ctx.stroke(); }
  }
  ctx.strokeStyle = '#3a2c24'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i <= 30; i++) { const p = Q(add(span(i / 30), [0, 1, 0])); i ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke();
}

// A lotus leaf: a round shield with radiating veins, flat on the water or raised on a stalk and cupped.
function leaf(ctx, l, lift) {
  const c = P([l.x, l.y + lift, l.z]), k = cam.focal / l.z, r = l.r * k;
  if (l.y > 0) { const base = P([l.x, 0, l.z]); ctx.strokeStyle = '#2a3a24'; ctx.lineWidth = Math.max(1, .03 * k); ctx.beginPath(); ctx.moveTo(...base); ctx.lineTo(...c); ctx.stroke(); }
  const squash = l.y > 0 ? .55 : .3;
  ctx.fillStyle = shade(l.tone); ctx.beginPath(); ctx.ellipse(c[0], c[1], r, r * squash, l.tilt + lift * .3, 0, TAU); ctx.fill();
  ctx.fillStyle = shade(l.tone, 26, .6); ctx.beginPath(); ctx.ellipse(c[0] - r * .15, c[1] - r * squash * .2, r * .6, r * squash * .5, l.tilt, 0, TAU); ctx.fill();
  ctx.strokeStyle = shade(l.tone, -30, .5); ctx.lineWidth = Math.max(.5, .006 * k);
  for (let v = 0; v < 10; v++) { const a = v / 10 * TAU; ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0] + Math.cos(a) * r * .95, c[1] + Math.sin(a) * r * squash * .95); ctx.stroke(); }
}

function flower(ctx, f, sway) {
  const c = P([f.x, 1 + sway * .1, f.z]), base = P([f.x, 0, f.z]), k = cam.focal / f.z;
  ctx.strokeStyle = '#2a3a24'; ctx.lineWidth = Math.max(1, .025 * k); ctx.beginPath(); ctx.moveTo(...base); ctx.quadraticCurveTo(base[0] + sway * 10, (base[1] + c[1]) / 2, ...c); ctx.stroke();
  const r = .2 * k;
  if (f.bud) { ctx.fillStyle = '#c87a8a'; ctx.beginPath(); ctx.ellipse(c[0], c[1] - r * .4, r * .35, r * .7, 0, 0, TAU); ctx.fill(); return; }
  for (let p = 0; p < 9; p++) {
    const a = -Math.PI / 2 + (p - 4) * .32, len = r * (p % 2 ? .9 : 1.1);
    ctx.fillStyle = p % 2 ? '#e8c4cc' : '#f4dce0';
    ctx.beginPath(); ctx.ellipse(c[0] + Math.cos(a) * len * .4, c[1] + Math.sin(a) * len * .4, len * .28, len * .55, a + Math.PI / 2, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = '#e8c060'; ctx.beginPath(); ctx.arc(c[0], c[1] - r * .2, r * .18, 0, TAU); ctx.fill();
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(40011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#0a1020'], [1, '#26304a']]);
  ctx.fillRect(0, 0, W, HORIZON + 2);
  paint.starfield(ctx, rnd, 200, HORIZON);
  glow(ctx, ...MOON, 220, 220, '206,220,240', .25); ctx.fillStyle = '#eef2f6'; ctx.beginPath(); ctx.arc(...MOON, 22, 0, TAU); ctx.fill();
  paint.ridgeline(ctx, HORIZON + 2, 60, [18, 26, 26], 401, [[200, 1], [40, .7], [9, .5], [3, .3]], HORIZON + 10);
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#1a2234'], [1, '#06090e']]);
  ctx.fillRect(0, HORIZON, W, H);
  const refl = make(W, H), rc = refl.getContext('2d');
  rc.save(); rc.translate(0, HORIZON * 2); rc.scale(1, -1); rc.drawImage(plate, 0, 0, W, HORIZON, 0, 0, W, HORIZON); rc.restore();
  bridge(ctx, P); bridge(rc, M);
  rc.globalCompositeOperation = 'source-atop'; rc.fillStyle = 'rgba(6,10,18,.4)'; rc.fillRect(0, 0, W, H);
  // stone lanterns at the bridge's feet
  const lanterns = [P([-9.5, 1.1, 21]), P([9.5, 1.1, 21])];
  for (const l of lanterns) { const k = cam.focal / 21; fill(ctx, [[l[0] - .2 * k, l[1] + 1.1 * k], [l[0] + .2 * k, l[1] + 1.1 * k], [l[0] + .15 * k, l[1] - .2 * k], [l[0] - .15 * k, l[1] - .2 * k]], '#4a4842'); fill(ctx, [[l[0] - .1 * k, l[1] - .05 * k], [l[0] + .1 * k, l[1] - .05 * k], [l[0] + .1 * k, l[1] - .2 * k], [l[0] - .1 * k, l[1] - .2 * k]], '#ffcf8a'); }
  // leaves: lying ones baked into the plate; raised ones and flowers move each frame
  const leaves = [], flowers = [];
  for (let i = 0; i < 160; i++) {
    const z = 3 + rnd() ** 1.4 * 18, x = (rnd() - .5) * z * 2.2, up = rnd() < .3;
    leaves.push({ x, z, y: up ? .3 + rnd() * .6 : 0, r: .3 + rnd() * .3, tilt: (rnd() - .5) * .4, tone: [lerp(40, 70, rnd()), lerp(70, 100, rnd()), lerp(44, 60, rnd())], lag: rnd() * TAU });
  }
  for (let i = 0; i < 9; i++) flowers.push({ x: (rnd() - .5) * 12, z: 5 + rnd() * 10, bud: rnd() < .4, lag: rnd() * TAU });
  leaves.sort((a, b) => b.z - a.z);
  const still = leaves.filter(l => l.y === 0), raised = leaves.filter(l => l.y > 0);
  const pads = make(W, H), pc = pads.getContext('2d');
  for (const l of still) leaf(pc, l, 0);
  paint.applyTexture(ctx, make, 4001, .32, 0, 0, W, H, true);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    paint.ripple(target, refl, HORIZON, phase, { amp: .7, bands: 3 });
    target.drawImage(pads, 0, 0);
    for (const l of raised) leaf(target, l, .05 * Math.sin(TAU * phase * 2 + l.lag));
    for (const f of flowers) flower(target, f, Math.sin(TAU * phase * 2 + f.lag));
    for (const l of lanterns) glow(target, l[0], l[1] - 10, 50, 50, '255,200,130', .5);
  };
}

module.exports = {
  title: '연잎이 흔들리는 나무다리',
  slug: 'lotus-pond-under-the-footbridge',
  sound: 'lake',
  createScene,
};
