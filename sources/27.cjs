'use strict';

// 27 · 작은 어항에 잠든 배들
// A small fishing harbour at night. Wooden boats lie moored at their own angles inside the breakwater:
// rounded hulls with rubbing strakes, little wheelhouses, a mast or two, buoys and coiled rope, one with a
// lamp left burning. A stone quay with bollards and a single lamp post runs along the left; behind, the
// village climbs the hill, a few windows lit. The harbour water holds all of it upside down, broken by a
// slow swell; the boats rise and fall gently, each in its own time.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, shade, camera, planks, v3 } = paint;
const { add, mul } = v3;

const cam = camera({ x: 0, y: 3, z: 0, yaw: .05, pitch: .05, focal: 1150, cx: 960, cy: 520 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const M = paint.mirrorOf(cam, 0);
const HORIZON = cam.project([0, 3, 1e6])[1];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// The village on the hill behind the harbour, drawn for both the camera and its reflection.
function village(ctx, rnd, Q) {
  const hill = [];
  for (let x = -120; x <= 140; x += 4) hill.push(Q([x, 14 + 10 * Math.sin(x * .03) + 4 * edge(x * 3, 271), 120]));
  hill.push(Q([140, 0, 120]), Q([-120, 0, 120]));
  fill(ctx, hill, '#141a24');
  for (let i = 0; i < 60; i++) {
    const x = -90 + rnd() * 200, z = 100 + rnd() * 20, y = 1 + rnd() * 14, w = 3 + rnd() * 3, h = 3 + rnd() * 2;
    const q = [Q([x, y + h, z]), Q([x + w, y + h, z]), Q([x + w, y, z]), Q([x, y, z])];
    fill(ctx, q, shade([34, 38, 48], (rnd() - .5) * 14));
    fill(ctx, [Q([x - .3, y + h, z]), Q([x + w / 2, y + h + 1.6, z]), Q([x + w + .3, y + h, z])], '#1e222c');
    if (rnd() < .25) { const c = Q([x + w * .5, y + h * .5, z]); glow(ctx, c[0], c[1], 5, 4, '255,196,120', .9); ctx.fillStyle = '#ffcc88'; ctx.fillRect(c[0] - 1.5, c[1] - 1.5, 3, 3); }
  }
}

// The quay: a stone wall along the left with bollards and a lamp post.
function quay(ctx, rnd, Q) {
  const top = 1.4, near = [-9, 0, 4], far = [-9, 0, 80];
  const face = (u, v) => Q(add(v3.lerp(near, far, u), [2.2, top * (1 - v), 0]));
  paint.masonry(ctx, face, rnd, { courses: 5, length: [.008, .016], base: [80, 80, 84], wet: .5 });
  fill(ctx, [Q([-9, top, 4]), Q([-9, top, 80]), Q([-6.8, top, 80]), Q([-6.8, top, 4])], '#3a3a40');
  for (let z = 8; z < 70; z += 9) { const b = Q([-7.4, top, z]), k = cam.focal / z; fill(ctx, [[b[0] - .18 * k, b[1]], [b[0] + .18 * k, b[1]], [b[0] + .14 * k, b[1] - .5 * k], [b[0] - .14 * k, b[1] - .5 * k]], '#1c1c20'); }
}

// A boat, built in its own frame (x along the keel, y up, z across) and drawn through projector Q.
function boat(ctx, b, Q, rnd) {
  const T = b.heading, ax = [Math.cos(T), 0, Math.sin(T)], az = [-Math.sin(T), 0, Math.cos(T)];
  const at = (x, y, z) => Q(add(b.pos, mul(ax, x), [0, y, 0], mul(az, z)));
  const half = b.len / 2, beam = b.beam / 2;
  // hull side facing us: gunwale curve on top, waterline below, sheer rising to the bow
  const side = Math.sign(-(b.pos[2] * az[2] + b.pos[0] * az[0])) || 1;
  const gun = [], wl = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16, x = lerp(-half, half, t), w = beam * Math.sin(Math.PI * Math.min(1, t * 1.1 + .05)) ** .5;
    gun.push(at(x, .7 + .35 * t ** 2, w * side)); wl.push(at(x * .96, 0, w * .85 * side));
  }
  const hull = gun.concat(wl.slice().reverse());
  fill(ctx, hull, shade(b.color));
  planks(ctx, (u, v) => { const i = Math.round(u * 16); return [lerp(gun[i][0], wl[i][0], v), lerp(gun[i][1], wl[i][1], v)]; }, rnd, { along: 'u', width: [.2, .26], base: b.color, vary: 14, streaks: 2 });
  ctx.strokeStyle = shade(b.trim); ctx.lineWidth = 3; ctx.beginPath(); gun.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  // deck seen over the near gunwale, darker
  const far = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16, x = lerp(-half, half, t), w = beam * Math.sin(Math.PI * Math.min(1, t * 1.1 + .05)) ** .5; far.push(at(x, .7 + .35 * t ** 2, -w * side)); }
  fill(ctx, gun.concat(far.slice().reverse()), shade(b.color, -40));
  // wheelhouse: a small box aft with a window
  const wh = [[-half * .55, -half * .15], [-.6, .6]];
  const box = (x0, x1, z0, z1, y0, y1) => {
    fill(ctx, [at(x0, y1, z0 * side), at(x1, y1, z0 * side), at(x1, y0, z0 * side), at(x0, y0, z0 * side)], shade(b.cabin));
    fill(ctx, [at(x1, y1, z0 * side), at(x1, y1, z1 * side), at(x1, y0, z1 * side), at(x1, y0, z0 * side)], shade(b.cabin, -30));
    fill(ctx, [at(x0, y1, z0 * side), at(x1, y1, z0 * side), at(x1, y1, z1 * side), at(x0, y1, z1 * side)], shade(b.cabin, 20));
  };
  box(wh[0][0], wh[0][1], wh[1][1] * beam, wh[1][0] * beam, .9, 2.2);
  fill(ctx, [at(wh[0][0] + .3, 2, wh[1][1] * beam * side), at(wh[0][1] - .2, 2, wh[1][1] * beam * side), at(wh[0][1] - .2, 1.5, wh[1][1] * beam * side), at(wh[0][0] + .3, 1.5, wh[1][1] * beam * side)], b.lit ? '#e8b070' : '#1a2230');
  // mast and its stays
  const base = at(half * .2, 1, 0), top = at(half * .2, 1 + b.mast, 0);
  ctx.strokeStyle = '#1c1a1c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...base); ctx.lineTo(...top); ctx.stroke();
  ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...top); ctx.lineTo(...at(half, 1.05, 0)); ctx.moveTo(...top); ctx.lineTo(...at(-half, .8, 0)); ctx.stroke();
  // a buoy hung on the side and a mooring line running off to the quay or a buoy
  const buoy = at(0, .5, beam * 1.02 * side); ctx.fillStyle = b.buoy; ctx.beginPath(); ctx.ellipse(buoy[0], buoy[1], 5, 7, 0, 0, TAU); ctx.fill();
  return { light: b.lit ? at(wh[0][1], 2.4, 0) : null };
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(27011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#080c18'], [1, '#1e2638']]);
  ctx.fillRect(0, 0, W, HORIZON + 2);
  paint.starfield(ctx, rnd, 200, HORIZON);
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#121a28'], [1, '#05080e']]);
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  village(ctx, paint.seeded(2702), P);
  quay(ctx, paint.seeded(2703), P);
  // the reflection layer: village, quay and boats through the mirror, then darkened and softened
  const refl = make(W, H), rc = refl.getContext('2d');
  village(rc, paint.seeded(2702), M);
  quay(rc, paint.seeded(2703), M);
  const boats = [
    { pos: [-3.8, 0, 14], heading: .3, len: 7, beam: 2.4, color: [60, 90, 110], trim: [200, 190, 170], cabin: [120, 118, 112], mast: 4, lit: true, buoy: '#c0402a' },
    { pos: [3.6, 0, 18], heading: -.5, len: 8, beam: 2.6, color: [150, 60, 46], trim: [220, 214, 200], cabin: [128, 126, 120], mast: 5, lit: false, buoy: '#d8c040' },
    { pos: [-.6, 0, 26], heading: 1.2, len: 6.5, beam: 2.2, color: [70, 110, 80], trim: [190, 180, 160], cabin: [112, 108, 100], mast: 3.4, lit: false, buoy: '#c0402a' },
    { pos: [7.5, 0, 32], heading: .1, len: 9, beam: 2.8, color: [44, 50, 70], trim: [200, 196, 180], cabin: [108, 106, 100], mast: 6, lit: true, buoy: '#e0e0e0' },
    { pos: [-6.2, 0, 40], heading: -1, len: 6, beam: 2.1, color: [120, 110, 90], trim: [210, 200, 180], cabin: [118, 114, 106], mast: 3, lit: false, buoy: '#c0402a' },
  ].sort((a, b) => b.pos[2] - a.pos[2]);
  const sprites = boats.map((b, i) => {
    const c = make(W, H), r = make(W, H);
    const info = boat(c.getContext('2d'), b, P, paint.seeded(2710 + i));
    boat(r.getContext('2d'), b, M, paint.seeded(2710 + i));
    return { c, r, info, lag: i * 1.7, z: b.pos[2] };
  });
  for (const s of sprites) rc.drawImage(s.r, 0, 0);
  rc.globalCompositeOperation = 'source-atop'; rc.fillStyle = 'rgba(6,10,18,.45)'; rc.fillRect(0, 0, W, H);
  const soft = make(W, H), sc = soft.getContext('2d'); sc.filter = 'blur(1.4px)'; sc.drawImage(refl, 0, 0);
  // lamp post on the quay
  const lp = P([-7.6, 1.4, 22]), lk = cam.focal / 22;
  ctx.strokeStyle = '#141418'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(...lp); ctx.lineTo(lp[0], lp[1] - 4 * lk); ctx.stroke();
  const lampTop = [lp[0], lp[1] - 4 * lk];
  paint.applyTexture(ctx, make, 2701, .32, 0, 0, W, H, true);
  const lights = sprites.filter(s => s.info.light).map(s => s.info.light).concat([lampTop]);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    paint.ripple(target, soft, HORIZON, phase, { amp: 1.2 });
    for (const l of lights) for (let i = 0; i < 14; i++) {
      const y = 2 * HORIZON - l[1] + 30 + i * 10, x = l[0] + Math.sin(TAU * (phase * 2 + i * .4)) * (4 + i);
      if (y > H) break;
      target.fillStyle = `rgba(255,190,120,${.32 * (1 - i / 14)})`; target.fillRect(x - 10, y, 20, 2);
    }
    for (const s of sprites) {
      const bob = 3 * Math.sin(TAU * phase * 2 + s.lag) * (22 / s.z), roll = .006 * Math.sin(TAU * phase * 2 + s.lag + 1);
      target.save(); target.translate(W / 2, H / 2 + bob); target.rotate(roll); target.drawImage(s.c, -W / 2, -H / 2); target.restore();
    }
    for (const l of lights) glow(target, l[0], l[1], 50, 50, '255,196,120', .55);
  };
}

module.exports = {
  title: '작은 어항에 잠든 배들',
  slug: 'sleeping-boats-in-the-harbor',
  sound: 'lake',
  createScene,
};
