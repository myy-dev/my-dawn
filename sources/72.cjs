'use strict';

// 72 · 가로등 아래 묶인 자전거
// A narrow old alley on a snowy night. On the left a wall of rough brick with a drainpipe and a low wooden
// door under a little tiled hood; on the right a plastered wall stepping back, an iron gate, a window with
// bars. The alley climbs gently away to a bend. Halfway along, an iron lamp on a bracket throws a cone of
// warm light, and under it a bicycle is chained to a railing, snow piled on its saddle and rack. Snow lies
// soft and rounded on every ledge, slowly falling through the light; a gust now and then sweeps it sideways.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, camera } = paint;

const cam = camera({ x: .3, y: 1.55, z: 0, yaw: -.04, pitch: .02, focal: 1050, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const LEFT = -1.6, RIGHT = 2.6, LAMP = [-1.2, 3.2, 5.6];
const rise = z => Math.max(0, z - 4) * .06;            // the alley climbs

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}
// A soft snow cap along a 3D edge from a to b: a rounded white bulge on top, thicker in the middle.
function snowCap(ctx, a, b, depth, k) {
  const pa = P(a), pb = P(b), n = 10, top = [];
  for (let i = 0; i <= n; i++) { const t = i / n, p = P([lerp(a[0], b[0], t), lerp(a[1], b[1], t) + depth * Math.sin(Math.PI * t) ** .5, lerp(a[2], b[2], t)]); top.push(p); }
  fill(ctx, [pa, ...top, pb], '#c8ccd8');
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = Math.max(1, k * .01); ctx.beginPath(); top.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] + 1) : ctx.moveTo(p[0], p[1] + 1))); ctx.stroke();
}

function alley(ctx, rnd) {
  ctx.fillStyle = '#0c0e16'; ctx.fillRect(0, 0, W, H);
  // sky slot above the alley: a little glow from the town
  ctx.fillStyle = vertical(ctx, 0, 500, [[0, '#0e1220'], [1, '#2a2c3a']]); ctx.fillRect(0, 0, W, 520);
  // the ground: snow, trampled down the middle, rising toward the bend
  const ground = (u, v) => P([lerp(LEFT, RIGHT, u), rise(lerp(30, 1, v)), lerp(30, 1, v)]);
  fill(ctx, paint.outline(ground, 16), vertical(ctx, ground(0, 0)[1], H, [[0, '#5a5e70'], [1, '#8a8ea0']]));
  for (let i = 0; i < 90; i++) { const z = 1.5 + rnd() * 16, x = (rnd() - .5) * 1.2 + Math.sin(z) * .2, p = P([x, rise(z), z]), k = cam.focal / z; ctx.fillStyle = 'rgba(40,44,60,.35)'; ctx.beginPath(); ctx.ellipse(p[0], p[1], .06 * k, .025 * k, 0, 0, TAU); ctx.fill(); }
  // left wall: brick, darker, with a door under a hood and a drainpipe
  const lw = (u, v) => P([LEFT, lerp(5.5, rise(lerp(1, 30, u)), v), lerp(1, 30, u)]);
  paint.masonry(ctx, lw, rnd, { courses: 60, length: [.008, .014], base: [88, 58, 48], vary: 20, mortar: [50, 44, 44] });
  fill(ctx, paint.outline(lw, 16), 'rgba(10,12,26,.4)');
  const door = (u, v) => P([LEFT + .02, lerp(1.9, 0, v), lerp(4.2, 5.1, u)]);
  fill(ctx, paint.outline(door, 4), '#3a2a20');
  for (let b = 1; b < 5; b++) { const a = door(b / 5, 0), c = door(b / 5, 1); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...c); ctx.stroke(); }
  const hood = [P([LEFT, 2.2, 4]), P([LEFT + .5, 2, 4]), P([LEFT + .5, 2, 5.3]), P([LEFT, 2.2, 5.3])];
  paint.shingles(ctx, hood, rnd, { rows: 4, cols: 8, base: [50, 40, 40], seed: 3 });
  snowCap(ctx, [LEFT + .5, 2, 4], [LEFT + .5, 2, 5.3], .12, 200);
  const dp = [P([LEFT + .08, 5.5, 3]), P([LEFT + .08, 0, 3])], dk = cam.focal / 3; ctx.strokeStyle = '#2a2c34'; ctx.lineWidth = .08 * dk; ctx.beginPath(); ctx.moveTo(...dp[0]); ctx.lineTo(...dp[1]); ctx.stroke();
  // right wall: plaster, stepping back after the gate, a barred window
  const rw = (u, v) => P([RIGHT - (u > .35 ? .3 : 0), lerp(4.8 - .3 * Math.sin(Math.PI * u), rise(lerp(1, 30, u)), v), lerp(1, 30, u)]);
  fill(ctx, paint.outline(rw, 24), '#6e6a60');
  ctx.save(); pathOf(ctx, paint.outline(rw, 24)); ctx.clip();
  for (let i = 0; i < 80; i++) { const p = rw(rnd(), rnd()); glow(ctx, p[0], p[1], 30 + rnd() * 80, 20 + rnd() * 60, rnd() < .6 ? '0,0,0' : '200,196,180', .06 + rnd() * .06); }
  ctx.restore();
  fill(ctx, paint.outline(rw, 24), 'rgba(10,12,26,.3)');
  // a second door and a meter box on the near stretch of the right wall
  const rd = (u, v) => P([RIGHT - .01, lerp(2.1, 0, v), lerp(2.6, 3.5, u)]);
  fill(ctx, paint.outline(rd, 4), '#2a3a44'); for (let b = 1; b < 3; b++) { const a = rd(0, b / 3), c = rd(1, b / 3); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...c); ctx.stroke(); }
  snowCap(ctx, [RIGHT - .3, 2.25, 2.5], [RIGHT - .3, 2.25, 3.6], .12, 400);
  fill(ctx, paint.outline((u, v) => P([RIGHT - .02, lerp(1.6, 1.1, v), lerp(4.2, 4.6, u)]), 4), '#8a8a7e');
  const win = (u, v) => P([RIGHT - .3, lerp(3, 2, v), lerp(14, 15.2, u)]);
  fill(ctx, paint.outline(win, 4), '#e8a050'); glow(ctx, ...win(.5, .5), 60, 40, '255,180,100', .5);
  for (let b = 1; b < 5; b++) { const a = win(b / 5, 0), c = win(b / 5, 1); ctx.strokeStyle = '#141414'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...c); ctx.stroke(); }
  snowCap(ctx, [RIGHT - .3, 3, 14], [RIGHT - .3, 3, 15.2], .1, 90);
  snowCap(ctx, [RIGHT - .3, 2, 14], [RIGHT - .3, 2, 15.2], .07, 90);
  // the gate: iron bars between the step
  for (let i = 0; i <= 10; i++) { const z = lerp(10.2, 11.6, i / 10), a = P([RIGHT - .15, 0, z]), b = P([RIGHT - .15, 2 + .1 * Math.sin(i * .6), z]); ctx.strokeStyle = '#141418'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // the bend at the end: a house face across the alley with its roof in snow
  const endH = (u, v) => P([lerp(LEFT - 1, RIGHT + 1, u), lerp(6, rise(30), v), 30]);
  fill(ctx, paint.outline(endH, 4), '#2a2a32');
  const roof = [P([LEFT - 1.3, 6, 30.5]), P([RIGHT + 1.3, 6, 30.5]), P([RIGHT, 7.6, 32]), P([LEFT, 7.6, 32])];
  fill(ctx, roof, '#9a9eb0');
  glow(ctx, ...endH(.6, .5), 20, 16, '255,190,110', .8);
  // wall-top snow along both walls
  snowCap(ctx, [LEFT, 5.5, 1], [LEFT, 5.5, 30], .18, 60);
}

function bicycle(ctx) {
  // a railing post at the left wall and the bicycle leaning on it, side-on along z
  const z0 = 4.6, x = LEFT + .35, k = cam.focal / cam.project([x, .5, z0 + .6])[2];
  const at = (y, dz) => P([x, y, z0 + dz]);
  for (const dz of [-.2, 1.6]) { const a = at(0, dz), b = at(.9, dz); ctx.strokeStyle = '#18181c'; ctx.lineWidth = .04 * k; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(...at(.9, -.2)); ctx.lineTo(...at(.9, 1.6)); ctx.stroke(); snowCap(ctx, [x, .9, z0 - .2], [x, .9, z0 + 1.6], .05, k);
  const wheel = dz => { const c = at(.34, dz); ctx.strokeStyle = '#141418'; ctx.lineWidth = .03 * k; ctx.beginPath(); ctx.ellipse(c[0], c[1], .12 * k, .34 * k, 0, 0, TAU); ctx.stroke(); ctx.lineWidth = 1; for (let s = 0; s < 12; s++) { const a = s / 12 * TAU; ctx.beginPath(); ctx.moveTo(...c); ctx.lineTo(c[0] + Math.cos(a) * .11 * k, c[1] + Math.sin(a) * .32 * k); ctx.stroke(); } return c; };
  const rear = wheel(.2), front = wheel(1.25);
  const seat = at(.88, .45), bar = at(.95, 1.1), crank = at(.34, .62);
  ctx.strokeStyle = '#5a1e22'; ctx.lineWidth = .035 * k; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(...rear); ctx.lineTo(...crank); ctx.lineTo(...seat); ctx.lineTo(...rear); ctx.moveTo(...crank); ctx.lineTo(...at(.82, 1.08)); ctx.lineTo(...seat); ctx.moveTo(...at(.82, 1.08)); ctx.lineTo(...front); ctx.stroke();
  ctx.strokeStyle = '#18181c'; ctx.lineWidth = .025 * k; ctx.beginPath(); ctx.moveTo(...at(.82, 1.08)); ctx.lineTo(...bar); ctx.lineTo(...at(.95, 1.25)); ctx.stroke();
  fill(ctx, [at(.9, .36), at(.9, .56), at(.86, .56), at(.86, .36)], '#1a1a1a');
  // a rack over the rear wheel, a basket on the front, and snow heaped on them
  ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = .02 * k; ctx.beginPath(); ctx.moveTo(...at(.72, .05)); ctx.lineTo(...at(.72, .42)); ctx.stroke();
  fill(ctx, [at(.98, 1.18), at(.98, 1.46), at(.78, 1.44), at(.78, 1.2)], '#6a4a2a');
  snowCap(ctx, [x, .9, z0 + .34], [x, .9, z0 + .58], .07, k);
  snowCap(ctx, [x, .72, z0 + .02], [x, .72, z0 + .44], .08, k);
  snowCap(ctx, [x, .98, z0 + 1.18], [x, .98, z0 + 1.46], .1, k);
  // the chain around the post
  ctx.strokeStyle = '#8a8a90'; ctx.lineWidth = 2; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.moveTo(...at(.5, -.2)); ctx.quadraticCurveTo(...at(.3, .1), ...rear); ctx.stroke(); ctx.setLineDash([]);
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(72011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  alley(ctx, rnd);
  bicycle(ctx);
  // the lamp on its bracket from the left wall
  const head = P(LAMP), k = cam.focal / cam.project(LAMP)[2], root = P([LEFT, LAMP[1] + .3, LAMP[2]]);
  ctx.strokeStyle = '#141418'; ctx.lineWidth = .04 * k; ctx.beginPath(); ctx.moveTo(...root); ctx.quadraticCurveTo(root[0] + .3 * k, root[1] - .2 * k, head[0], head[1] - .2 * k); ctx.stroke();
  fill(ctx, [[head[0] - .14 * k, head[1] - .22 * k], [head[0] + .14 * k, head[1] - .22 * k], [head[0] + .1 * k, head[1]], [head[0] - .1 * k, head[1]]], '#1a1a1e');
  snowCap(ctx, [LAMP[0] - .14, LAMP[1] + .22, LAMP[2]], [LAMP[0] + .14, LAMP[1] + .22, LAMP[2]], .06, k);
  paint.applyTexture(ctx, make, 7201, .34, 0, 0, W, H, true);
  const pool = P([LAMP[0] + .4, 0, LAMP[2]]);
  paint.lighting(make, { ambient: [.46, .5, .66], lights: [paint.LIGHT.lamp(pool[0], pool[1] - 140, .7, 420, 420, [1.3, 1, .7])] })(ctx);
  const snow = paint.particles(rnd, 420, { kind: 'snow', near: .15, speed: 1 });

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the cone of light under the lamp
    target.save(); target.globalCompositeOperation = 'lighter';
    const cone = target.createLinearGradient(0, head[1], 0, pool[1]);
    cone.addColorStop(0, 'rgba(255,200,130,.22)'); cone.addColorStop(1, 'rgba(255,200,130,.02)');
    target.fillStyle = cone; target.beginPath(); target.moveTo(head[0] - .1 * k, head[1]); target.lineTo(head[0] + .1 * k, head[1]); target.lineTo(pool[0] + 1.3 * k, pool[1]); target.lineTo(pool[0] - 1.1 * k, pool[1]); target.fill();
    target.restore();
    glow(target, head[0], head[1] + 4, 30, 14, '255,220,160', .9);
    // snow; a gust pushes it sideways twice a loop
    const gust = Math.max(0, Math.sin(TAU * phase * 2)) ** 3 * 60;
    target.save(); target.translate(gust, 0);
    snow.draw(target, phase, '230,232,244');
    target.restore();
    // the flakes that pass through the light catch it
    for (const p of snow.items) { if (!p.close) continue; const [x, y] = snow.at(p, phase); const dx = x + gust - head[0]; if (y > head[1] && Math.abs(dx) < (y - head[1]) * .5 + 30) glow(target, x + gust, y, p.r * 3, p.r * 3, '255,220,170', .35); }
  };
}

module.exports = {
  title: '가로등 아래 묶인 자전거',
  slug: 'bicycle-below-a-streetlamp',
  sound: 'snow',
  createScene,
};
