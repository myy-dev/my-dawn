'use strict';

// 69 · 얼어붙은 호수의 달빛 균열
// A wide frozen lake at night, seen from just above the ice. The surface is black, clear ice in places and
// dusted with thin snow in others, and it is cut through by long white cracks: branching fractures that run
// away toward the far shore, some straight, some forking, with frozen bubbles strung beneath them. The
// moon is low over a line of dark spruce on the far shore and lays a long glossy path across the ice.
// Snow dust drifts across the surface in thin snakes; a new crack now and then flashes and spreads.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, noise, pathOf } = paint;

const cam = camera({ x: 0, y: 1.4, z: 0, yaw: -.1, pitch: -.02, focal: 1000, cx: 960, cy: 520 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(-.1) * 1e6, 1.4, Math.cos(-.1) * 1e6])[1];
const SHORE = 600;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }

// A crack: a random walk on the ice from a start point, branching; returns 3D polylines.
function crack(rnd, start, dir, len, depth) {
  const lines = [], pts = [start]; let p = start, a = dir;
  for (let s = 0; s < len; s++) {
    a += (rnd() - .5) * .5; const step = .6 + rnd() * 1.4 + p[2] * .01;
    p = [p[0] + Math.sin(a) * step, 0, p[2] + Math.cos(a) * step]; if (p[2] < 1.6 || p[2] > SHORE * .8) break; pts.push(p);
    if (depth < 3 && rnd() < .08) lines.push(...crack(rnd, p, a + (rnd() < .5 ? -1 : 1) * (.4 + rnd() * .7), Math.floor(len * .4), depth + 1));
  }
  lines.push({ pts, depth });
  return lines;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(69011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON); sky.addColorStop(0, '#050a18'); sky.addColorStop(1, '#1c2a40');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 500, HORIZON);
  const moon = [760, HORIZON - 150];
  glow(ctx, moon[0], moon[1], 300, 300, '210,225,245', .18); ctx.fillStyle = '#f2f4f8'; ctx.beginPath(); ctx.arc(moon[0], moon[1], 34, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(180,190,210,.25)'; ctx.beginPath(); ctx.arc(moon[0] + 8, moon[1] - 6, 8, 0, TAU); ctx.arc(moon[0] - 10, moon[1] + 8, 5, 0, TAU); ctx.fill();
  // the far shore: spruce tops in a ragged line
  ctx.fillStyle = '#060a12';
  for (let i = 0; i < 260; i++) { const x = rnd() * W, h = 10 + rnd() * 30, y = HORIZON + 2; ctx.beginPath(); ctx.moveTo(x - h * .25, y); ctx.lineTo(x, y - h); ctx.lineTo(x + h * .25, y); ctx.fill(); }
  ctx.fillRect(0, HORIZON - 4, W, 8);
  // the ice: near-black with patches of snow dust, and the moon's long glossy path
  const ice = ctx.createLinearGradient(0, HORIZON, 0, H); ice.addColorStop(0, '#26344a'); ice.addColorStop(1, '#080c16');
  ctx.fillStyle = ice; ctx.fillRect(0, HORIZON + 2, W, H);
  for (let i = 0; i < 260; i++) { const z = 3 + rnd() ** 1.5 * 400, x = (rnd() - .5) * z * 2, s = cam.project([x, 0, z]); if (s[2] <= 0) continue; const k = cam.focal / s[2]; glow(ctx, s[0], s[1], (2 + rnd() * 6) * k, (.5 + rnd()) * k, '120,136,160', .18); }
  for (let i = 0; i < 80; i++) { const y = lerp(HORIZON + 6, H, (i / 80) ** 1.4), w = lerp(20, 160, (y - HORIZON) / (H - HORIZON)); glow(ctx, moon[0] + Math.sin(i * 7.1) * w * .3, y, w, 3 + (y - HORIZON) * .01, '200,215,240', .16); }
  // cracks, far to near, white with a bluish bloom; bubbles strung under a few
  const cracks = [];
  for (let c = 0; c < 9; c++) cracks.push(...crack(rnd, [(rnd() - .5) * 20, 0, 2 + rnd() * 6], (rnd() - .5) * .9, 50 + Math.floor(rnd() * 70), 0));
  for (const l of cracks) {
    const pts = l.pts.map(P);
    ctx.strokeStyle = 'rgba(150,180,220,.18)'; ctx.lineWidth = 5 - l.depth; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
    ctx.strokeStyle = `rgba(230,240,255,${.7 - l.depth * .15})`; ctx.lineWidth = Math.max(.8, 2 - l.depth * .5); ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
    if (l.depth === 0) for (let b = 0; b < l.pts.length; b += 3) { const q = l.pts[b], s = cam.project([q[0] + .3, 0, q[2]]); if (s[2] <= 0) continue; const k = cam.focal / s[2]; ctx.strokeStyle = 'rgba(200,220,240,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(s[0], s[1], Math.max(1, .05 * k), 0, TAU); ctx.stroke(); }
  }
  paint.applyTexture(ctx, make, 6901, .32, 0, 0, W, H, true);
  // the new crack that flashes once per loop
  const fresh = crack(paint.seeded(6902), [3, 0, 4], .5, 60, 2).map(l => l.pts.map(P));
  const snakes = Array.from({ length: 16 }, () => ({ z: 3 + rnd() * 30, x0: (rnd() - .5) * 20, lag: rnd(), turns: 1 + Math.floor(rnd() * 2) }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // drifting snow snakes, wind from right to left
    for (const s of snakes) for (let j = 0; j < 4; j++) {
      const t = ((phase * s.turns + s.lag + j / 4) % 1), x = s.x0 + lerp(20, -20, t) * s.z * .4;
      const p = cam.project([x, .02, s.z + Math.sin(TAU * t + j) * .5]); if (p[2] <= 0) continue; const k = cam.focal / p[2];
      glow(target, p[0], p[1], 1.6 * k, .12 * k, '200,210,230', .25 * Math.sin(Math.PI * t));
    }
    // the fresh crack: races out at a moment in the loop, glows, then settles to a faint line
    const t = (phase - .4 + 1) % 1;
    const grow = Math.min(1, t / .06), shine = t < .06 ? 1 : Math.max(.15, 1 - (t - .06) * 3);
    for (const pts of fresh) {
      const n = Math.max(2, Math.floor(pts.length * grow));
      target.strokeStyle = `rgba(230,240,255,${.75 * shine * (t < .94 ? 1 : (1 - t) / .06)})`; target.lineWidth = 1.4;
      target.beginPath(); pts.slice(0, n).forEach((p, i) => (i ? target.lineTo(...p) : target.moveTo(...p))); target.stroke();
    }
  };
}

module.exports = {
  title: '얼어붙은 호수의 달빛 균열',
  slug: 'moonlit-cracks-on-frozen-water',
  sound: 'snow',
  createScene,
};
