'use strict';

// 86 · 안개를 가르는 풍차
// An old stone tower mill on the crown of a hill, seen from the slope below in the hour before dawn. Its
// tower tapers as it rises, laid in rough courses; its cap is a weathered timber cone; four lattice sails
// turn slowly. Fog lies in the hollows and drifts across the hill in layers that the sails cut through.
// The moon is hidden in the cloud behind the mill, so the tower is lit along one edge and dark in front.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, shade, camera, lambert, v3 } = paint;
const { add, mul, unit } = v3;

const cam = camera({ x: 0, y: 1.6, z: 0, yaw: .12, pitch: -.12, focal: 1250, cx: 960, cy: 600 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.6, 1e6])[1];
const TO_MOON = unit([.8, .35, .2]);
const MILL = [4.2, 9.2, 46];                        // foot of the tower on the hilltop
const TOWER_H = 13, R0 = 3.4, R1 = 2.3;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#121427'], [.35, '#2a2a46'], [.6, '#4e4560'], [.8, '#6c5c70'], [1, '#3a3446']]);
  ctx.fillRect(0, 0, W, H);
  const moon = P(add(MILL, [6, 30, 60]));
  glow(ctx, moon[0], moon[1], 520, 340, '190,176,200', .28);
  for (let i = 0; i < 26; i++) glow(ctx, rnd() * W, 80 + rnd() * 420, 260 + rnd() * 420, 18 + rnd() * 40, i % 3 ? '96,86,118' : '140,122,150', .1 + rnd() * .08);
  paint.starfield(ctx, rnd, 90, 360, '210,206,230');
}

// The hill: a long swell rising to the mill, its grass going grey-violet in the fog toward the top.
function hill(ctx, rnd) {
  const far = [[HORIZON + 30, 70, [70, 62, 88], 41], [HORIZON + 60, 50, [58, 54, 76], 42]];
  for (const [base, amp, color, seed] of far) paint.ridgeline(ctx, base, amp, color, seed, [[500, 1], [140, .4], [30, .12]]);
  const crest = [];
  for (let i = 0; i <= 80; i++) {
    const x = (i / 80 - .5) * 120, z = MILL[2] + 2;
    const y = Math.max(0, MILL[1] * (1 - (Math.abs(x - MILL[0]) / 62) ** 2)) + edge(i * 30, 43) * .4;
    crest.push(P([x, y, z]));
  }
  crest.push([W, H], [0, H]);
  fill(ctx, crest, vertical(ctx, P(MILL)[1] - 40, H, [[0, '#4a4458'], [.4, '#2e2c3a'], [1, '#14141c']]));
  // grass combed by the wind: strokes laid on the slope, longer and darker near us
  for (let i = 0; i < 2600; i++) {
    const z = 4 + rnd() ** 1.8 * 42, x = (rnd() - .5) * z * 2.2, y = Math.max(0, MILL[1] * (1 - (Math.abs(x - MILL[0]) / 62) ** 2)) * (z / MILL[2]) ** 1.2;
    const s = cam.project([x, y, z]); if (s[2] <= 0) continue;
    const k = cam.focal / s[2], h = (.08 + rnd() * .22) * k, fade = Math.min(1, z / 50), bend = (rnd() - .3) * .5;
    ctx.strokeStyle = shade(paint.aerial([54, 58, 52], fade * .8, [90, 82, 104]), (rnd() - .5) * 24, .35 + rnd() * .3);
    ctx.lineWidth = Math.max(.6, .02 * k);
    ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.quadraticCurveTo(s[0] + h * bend * .3, s[1] - h * .6, s[0] + h * bend, s[1] - h); ctx.stroke();
  }
}

// The tower: a tapered cylinder of rough stone courses, lit along its moon edge, with a door and a window.
const towerAt = (h, a) => { const r = lerp(R0, R1, h / TOWER_H); return add(MILL, [Math.cos(a) * r, h, Math.sin(a) * r]); };
function tower(ctx, rnd) {
  const view = Math.atan2(-(MILL[2]), -(MILL[0]));        // the angle on the tower that faces the camera
  const steps = 26, courses = 34;
  for (let c = 0; c < courses; c++) {
    const h0 = c / courses * TOWER_H, h1 = (c + 1) / courses * TOWER_H, shift = (c % 2) * .5;
    for (let s = 0; s < steps; s++) {
      const a0 = view - Math.PI / 2 + (s + shift) / steps * Math.PI, a1 = view - Math.PI / 2 + (s + shift + 1) / steps * Math.PI;
      if (a0 < view - Math.PI / 2 - .01 || a1 > view + Math.PI / 2 + .01) continue;
      const normal = [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)];
      const lit = lambert(normal, TO_MOON), k = (rnd() - .5) * 26;
      const q = [towerAt(h1, a0), towerAt(h1, a1), towerAt(h0, a1), towerAt(h0, a0)].map(P);
      fill(ctx, q, shade([38 + lit * 120, 36 + lit * 104, 44 + lit * 106], k));
      ctx.strokeStyle = 'rgba(12,10,16,.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(...q[2]); ctx.lineTo(...q[3]); ctx.lineTo(...q[0]); ctx.stroke();
    }
  }
  // weathering: lime streaks under the window, damp darkening near the ground
  const base = P(MILL), mid = P(add(MILL, [0, TOWER_H * .5, 0]));
  ctx.fillStyle = vertical(ctx, mid[1], base[1], [[0, 'rgba(10,10,16,0)'], [1, 'rgba(10,10,16,.45)']]);
  const left = P(towerAt(0, view - Math.PI / 2)), right = P(towerAt(0, view + Math.PI / 2));
  ctx.fillRect(left[0], mid[1], right[0] - left[0], base[1] - mid[1]);
  // door and window set into the wall's thickness
  const opening = (h0, h1, half, color) => {
    const pts = [towerAt(h1, view - half), towerAt(h1, view + half), towerAt(h0, view + half), towerAt(h0, view - half)].map(P);
    const inner = pts.map(([x, y]) => [x + (pts[1][0] - pts[0][0]) * .12, y]);
    fill(ctx, pts, '#1a1418');
    fill(ctx, [pts[0], inner[0], inner[3], pts[3]], '#2a2228');
    fill(ctx, inner.map(([x, y], i) => [x + [0, -4, -4, 0][i], y]), color);
    return pts;
  };
  opening(0, 2.4, .18, '#2a2024');
  const win = opening(6.4, 7.6, .1, '#c08050');
  glow(ctx, (win[0][0] + win[1][0]) / 2, (win[0][1] + win[2][1]) / 2, 40, 40, '255,180,110', .3);
  // gallery: a timber ring at the cap's foot
  const ring = [];
  for (let s = 0; s <= 30; s++) ring.push(P(towerAt(TOWER_H, view - Math.PI / 2 - .3 + s / 30 * (Math.PI + .6))));
  const below = ring.map(([x, y]) => [x, y + 10]).reverse();
  fill(ctx, ring.concat(below), '#2a2024');
}

// Cap: a weathered timber cone leaning toward the wind, with its boarding catching the moon on one side.
function cap(ctx, rnd) {
  const top = add(MILL, [.4, TOWER_H + 4.2, .2]);
  const view = Math.atan2(-(MILL[2]), -(MILL[0]));
  for (let s = 0; s < 22; s++) {
    const a0 = view - Math.PI / 2 - .2 + s / 22 * (Math.PI + .4), a1 = view - Math.PI / 2 - .2 + (s + 1) / 22 * (Math.PI + .4);
    const lit = lambert([Math.cos((a0 + a1) / 2), .6, Math.sin((a0 + a1) / 2)], TO_MOON);
    fill(ctx, [P(top), P(towerAt(TOWER_H, a0).map((v, i) => (i === 1 ? v + .1 : v))), P(towerAt(TOWER_H, a1).map((v, i) => (i === 1 ? v + .1 : v)))],
      shade([60 + lit * 60, 50 + lit * 46, 48 + lit * 40], (rnd() - .5) * 16));
  }
  const finial = P(top);
  ctx.strokeStyle = '#1a1416'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...finial); ctx.lineTo(finial[0] + 2, finial[1] - 26); ctx.stroke();
}

// Sails: four lattice frames on a stock, turning a quarter-turn's worth so the loop is seamless.
const HUB = add(MILL, [-1.2, TOWER_H + 1.6, -2.6]);
const SAIL_AXIS = unit([-.35, .08, -1]);                   // the windshaft points down the hill toward us
const sailFrame = () => {
  const u = unit([SAIL_AXIS[2], 0, -SAIL_AXIS[0]]), v = unit([-u[1] * SAIL_AXIS[2] + u[2] * SAIL_AXIS[1], u[0] * SAIL_AXIS[2] - u[2] * SAIL_AXIS[0], u[1] * SAIL_AXIS[0] - u[0] * SAIL_AXIS[1]]);
  return [u, v];
};
function sails(ctx, angle, wear) {
  const [u, v] = sailFrame(), arm = 11.5;
  for (let k = 0; k < 4; k++) {
    const a = angle + k * TAU / 4, dir = add(mul(u, Math.cos(a)), mul(v, Math.sin(a))), side = add(mul(u, -Math.sin(a)), mul(v, Math.cos(a)));
    const tip = add(HUB, mul(dir, arm)), root = add(HUB, mul(dir, 1.6));
    // the stock
    ctx.strokeStyle = '#1c1618'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(...P(HUB)); ctx.lineTo(...P(tip)); ctx.stroke();
    // the lattice: a frame trailing the stock, with bars; some cells keep their tattered cloth
    const w = 2.2, trail = mul(side, w);
    const frame = [root, tip, add(tip, trail), add(root, trail)].map(P);
    ctx.strokeStyle = '#2a2224'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(...frame[1]); ctx.lineTo(...frame[2]); ctx.lineTo(...frame[3]); ctx.stroke();
    for (let b = 1; b < 11; b++) {
      const t = b / 11, p = add(root, mul(dir, t * (arm - 1.6)));
      ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(...P(p)); ctx.lineTo(...P(add(p, trail))); ctx.stroke();
      if (wear[k][b]) fill(ctx, [p, add(p, trail), add(p, trail, mul(dir, (arm - 1.6) / 11)), add(p, mul(dir, (arm - 1.6) / 11))].map(P), 'rgba(150,136,128,.45)');
    }
    ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(...P(add(root, mul(trail, .5)))); ctx.lineTo(...P(add(tip, mul(trail, .5)))); ctx.stroke();
  }
  const hub = P(HUB);
  ctx.fillStyle = '#18141a'; ctx.beginPath(); ctx.arc(hub[0], hub[1], 9, 0, TAU); ctx.fill();
}

// Fog in three layers, each a wide strip that slides sideways and wraps over the loop.
function fogLayer(make, rnd, height, tint, alpha) {
  const strip = make(W * 2, height), c = strip.getContext('2d');
  for (let i = 0; i < 60; i++) {
    const x = rnd() * W * 2;
    for (const dx of [0, -W * 2, W * 2]) glow(c, x + dx, height / 2 + (rnd() - .5) * height * .4, 200 + rnd() * 420, height * (.15 + rnd() * .2), tint, alpha * (.5 + rnd() * .6));
  }
  return strip;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(86031);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  hill(ctx, rnd);
  tower(ctx, rnd);
  cap(ctx, rnd);
  paint.applyTexture(ctx, make, 8601, .4, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON - 200, skyFade: 600, ambient: [.74, .72, .82], lights: [] })(ctx);
  const wear = Array.from({ length: 4 }, () => Array.from({ length: 12 }, () => rnd() < .3));
  const fogs = [[fogLayer(make, rnd, 260, '150,138,170', .22), P(add(MILL, [0, 2, 0]))[1] - 130, 1],
    [fogLayer(make, rnd, 320, '120,112,140', .26), P(add(MILL, [0, 0, -20]))[1] - 80, 2],
    [fogLayer(make, rnd, 380, '96,92,116', .3), H - 330, 1]];
  const front = make(W, H), fc = front.getContext('2d');      // the slope in front of the fog, nearest us
  for (let i = 0; i < 500; i++) {
    const x = rnd() * W, y = H - rnd() ** 2 * 120, h = 30 + rnd() * 90;
    fc.strokeStyle = shade([24, 26, 30], (rnd() - .5) * 10, .9); fc.lineWidth = 1 + rnd() * 1.6;
    fc.beginPath(); fc.moveTo(x, y); fc.quadraticCurveTo(x + h * .15, y - h * .6, x + h * .4, y - h); fc.stroke();
  }

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the far fog band behind the sails, then the sails (one quarter-turn per loop), then nearer fog
    const [f0, y0, t0] = fogs[0];
    target.drawImage(f0, -((phase * t0 * W * 2) % (W * 2)), y0);
    target.drawImage(f0, W * 2 - ((phase * t0 * W * 2) % (W * 2)), y0);
    sails(target, phase * TAU / 4, wear);
    for (const [img, y, turns] of fogs.slice(1)) {
      const x = (phase * turns * W * 2) % (W * 2);
      target.drawImage(img, -x, y); target.drawImage(img, W * 2 - x, y);
    }
    target.drawImage(front, 0, 0);
  };
}

module.exports = {
  title: '안개를 가르는 풍차',
  slug: 'windmill-through-the-mist',
  sound: 'wind',
  createScene,
};
