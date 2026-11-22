'use strict';

// 76 · 기와 위로 흐르는 굴뚝 연기
// An old hillside village of tiled roofs in the blue before dawn, seen from above. The curved roofs overlap
// one another down the slope: each a long sweep of grey clay tiles in ridged rows, its ridge line lifting at
// both ends, white-plastered ridge caps, the eaves turning up at the corners. Stone walls and a narrow lane
// run between them. From a few chimneys at the backs of the kitchens, wood smoke rises, leans in the cold
// wind and drifts over the roofs in long fading streams. One paper door glows from a lamp inside.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, v3 } = paint;

const cam = camera({ x: 0, y: 9, z: -6, yaw: 0, pitch: .42, focal: 1100, cx: 960, cy: 500 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// A curved tiled roof: ridge along x from -L to L at height h over a house at (cx, cz), depth d each side.
// The ridge rises toward its ends (by `lift`), the eaves curve up at the corners; tiles in rows down the slope.
function roof(ctx, rnd, { cx, cy, cz, L, d, h, lift, tone }) {
  const ridgeY = u => h + lift * (2 * u - 1) ** 4;               // u 0..1 along the ridge
  const eaveY = u => lift * .9 * (2 * u - 1) ** 6;
  const slope = side => (u, v) => {
    const x = cx + lerp(-L - .4 * Math.abs(2 * u - 1) ** 6 * 0, L, u) , z = cz + side * lerp(0, d + .3 * (2 * u - 1) ** 6, v);
    const y = cy + lerp(ridgeY(u), eaveY(u), v) - .35 * Math.sin(Math.PI * v) * (1 - .3 * Math.abs(2 * u - 1));
    return P([x - L * 0 + (u - .5) * .0, y, z]);
  };
  for (const side of [1, -1]) {
    // the far slope first (side +1 is away from the camera)
    const S = slope(side), lightK = side < 0 ? 1 : .7;
    fill(ctx, paint.outline(S, 20), shade(tone.map(c => c * lightK), -10));
    // rows of round tiles running down the slope: alternating convex (lit) and channel (dark) lines
    const cols = Math.round(L * 2 * 4.2);
    for (let c = 0; c <= cols; c++) {
      const u = c / cols, line = [];
      for (let v = 0; v <= 1.0001; v += .1) line.push(S(u, v));
      ctx.strokeStyle = c % 2 ? `rgba(10,12,20,${.5 * lightK})` : shade(tone.map(t => t * lightK), 18 + (rnd() - .5) * 10);
      ctx.lineWidth = c % 2 ? 2 : 3.2; ctx.beginPath(); line.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
    }
    // the end tiles along the eave: a row of little round faces
    for (let c = 0; c <= cols; c += 2) { const p = S(c / cols, 1); ctx.fillStyle = shade(tone.map(t => t * lightK), -6); ctx.beginPath(); ctx.arc(p[0], p[1], 3.5, 0, TAU); ctx.fill(); }
  }
  // the ridge: a thick white-mortared band, lifting at both ends
  const ridge = []; for (let i = 0; i <= 20; i++) { const u = i / 20; ridge.push(P([cx + lerp(-L, L, u), cy + ridgeY(u) + .12, cz])); }
  ctx.strokeStyle = '#1e2028'; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ridge.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  ctx.strokeStyle = '#a8acb4'; ctx.lineWidth = 3; ctx.beginPath(); ridge.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] + 5) : ctx.moveTo(p[0], p[1] + 5))); ctx.stroke();
}

// The walls under a roof: the front wall's visible strip with posts and paper doors.
function walls(ctx, { cx, cy, cz, L, d, glowDoor }) {
  const f = (u, v) => P([cx + lerp(-L + .4, L - .4, u), cy + lerp(-.1, -2.2, v), cz - d + .7]);
  fill(ctx, paint.outline(f, 4), '#8a8478');
  for (let i = 0; i <= 6; i++) { const a = f(i / 6, 0), b = f(i / 6, 1); ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  const doors = [];
  for (const i of [1, 2, 4]) { const q = (u, v) => f((i + .1 + u * .8) / 6, .25 + v * .7); const on = glowDoor === i; fill(ctx, paint.outline(q, 4), on ? '#f0c880' : '#c8c4b4'); for (let g = 1; g < 4; g++) { const a = q(g / 4, 0), b = q(g / 4, 1); ctx.strokeStyle = 'rgba(60,40,30,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); } if (on) doors.push(q(.5, .5)); }
  // a stone foundation below
  fill(ctx, paint.outline((u, v) => P([cx + lerp(-L + .3, L - .3, u), cy + lerp(-2.2, -2.7, v), cz - d + .6]), 4), '#4a4a50');
  return doors;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(76011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  // the hillside ground: dark earth and frosted terraces, and the far ridge in mist
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#2a3450'], [.25, '#58607a'], [.3, '#3a4256'], [1, '#20242e']]); ctx.fillRect(0, 0, W, H);
  paint.ridgeline(ctx, 300, 40, [44, 52, 72], 761, [[400, 1], [90, .4]], 420);
  paint.ridgeline(ctx, 360, 30, [34, 40, 56], 762, [[300, 1], [60, .4]], 520);
  // houses arranged down the slope; farther ones higher up the hill
  const houses = [
    { cx: -5.5, cy: 6, cz: 30, L: 4, d: 2.6, h: 2.2, lift: .5, tone: [92, 96, 108] },
    { cx: 4, cy: 5.2, cz: 26, L: 5, d: 2.8, h: 2.4, lift: .6, tone: [84, 88, 100] },
    { cx: -9, cy: 3.6, cz: 20, L: 3.5, d: 2.4, h: 2, lift: .45, tone: [88, 90, 100] },
    { cx: 1.5, cy: 2.8, cz: 17, L: 4.5, d: 2.8, h: 2.3, lift: .6, tone: [96, 98, 110], glowDoor: 2 },
    { cx: 10, cy: 2.4, cz: 18, L: 3.6, d: 2.5, h: 2.1, lift: .5, tone: [80, 84, 96] },
    { cx: -4, cy: 0, cz: 9, L: 5.2, d: 3, h: 2.6, lift: .7, tone: [90, 92, 104] },
    { cx: 7.5, cy: -.6, cz: 8, L: 3.8, d: 2.6, h: 2.2, lift: .55, tone: [86, 88, 100] },
  ];
  const doors = [], chimneys = [];
  for (const hs of houses) {
    // a stone wall around each yard
    // the house's terrace: a frosted yard it stands on, held up by a dry-stone retaining wall in front
    const yard = [P([hs.cx - hs.L - 1.4, hs.cy - 2.7, hs.cz - hs.d - 1.6]), P([hs.cx + hs.L + 1.4, hs.cy - 2.7, hs.cz - hs.d - 1.6]), P([hs.cx + hs.L + 1.4, hs.cy - 2.7, hs.cz + hs.d + 2]), P([hs.cx - hs.L - 1.4, hs.cy - 2.7, hs.cz + hs.d + 2])];
    fill(ctx, yard, '#6a7084');
    const wq = (u, v) => P([hs.cx + lerp(-hs.L - 1.4, hs.L + 1.4, u), hs.cy + lerp(-2.7, -7, v), hs.cz - hs.d - 1.6]);
    paint.masonry(ctx, wq, rnd, { courses: 6, length: [.03, .06], base: [92, 92, 98], vary: 26, mortar: [44, 44, 50] });
    fill(ctx, paint.outline(wq, 4), 'rgba(14,18,34,.3)');
    doors.push(...walls(ctx, hs));
    roof(ctx, rnd, hs);
    chimneys.push(P([hs.cx + hs.L * .6, hs.cy + hs.h + .6, hs.cz + hs.d * .4]));
    // a stub chimney of stones at the back
    const c = chimneys[chimneys.length - 1], k = cam.focal / cam.project([hs.cx, hs.cy, hs.cz])[2];
    fill(ctx, [[c[0] - .2 * k, c[1] + .8 * k], [c[0] + .2 * k, c[1] + .8 * k], [c[0] + .16 * k, c[1]], [c[0] - .16 * k, c[1]]], '#3a3a42');
  }
  // the lane winding down between them, frosted
  const lane = []; for (let i = 0; i <= 20; i++) { const t = i / 20; lane.push(P([lerp(-1, 3, t) + Math.sin(t * 4) * 2 - .8, lerp(4.4, -3, t), lerp(24, 2, t)])); }
  for (let i = 20; i >= 0; i--) { const t = i / 20; lane.push(P([lerp(-1, 3, t) + Math.sin(t * 4) * 2 + .8, lerp(4.4, -3, t), lerp(24, 2, t)])); }
  ctx.globalCompositeOperation = 'destination-over'; fill(ctx, lane, '#5a6070'); ctx.globalCompositeOperation = 'source-over';
  paint.applyTexture(ctx, make, 7601, .34, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.62, .68, .9], lights: doors.map(d => paint.LIGHT.lamp(d[0], d[1], .45, 160, 120, [1.3, 1, .6])) })(ctx);
  const smoking = [1, 3, 5];
  const puffs = smoking.flatMap(i => Array.from({ length: 18 }, (_, j) => ({ from: chimneys[i], lag: j / 18, size: .8 + rnd() * .6, side: (rnd() - .5) * 30 })));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // smoke: puffs leave the chimney, rise, then lean with the wind and spread, fading; 2 cycles per loop
    for (const p of puffs) {
      const t = (phase * 2 + p.lag) % 1, rise = Math.min(t * 3, 1) * 90 + t * 60, drift = t * t * 520;
      const x = p.from[0] + drift + p.side * t + Math.sin(TAU * (t * 2 + p.lag)) * 12, y = p.from[1] - rise + t * t * 40;
      glow(target, x, y, (14 + t * 90) * p.size, (10 + t * 46) * p.size, '200,204,216', .55 * (1 - t) * Math.min(1, t * 10));
    }
    for (const d of doors) glow(target, d[0], d[1], 30, 20, '255,200,120', .25 + .05 * Math.sin(TAU * phase * 4));
  };
}

module.exports = {
  title: '기와 위로 흐르는 굴뚝 연기',
  slug: 'smoke-above-the-roof-tiles',
  sound: 'gust',
  createScene,
};
