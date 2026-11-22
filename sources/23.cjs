'use strict';

// 23 · 달빛이 드는 처마 밑 다락
// An attic under the roof at night. Rough rafters slope down on both sides to the knee walls; at the far
// end a dormer window pushes out through the roof, its small panes full of moonlight. The moon's light
// comes in as a long slanted shaft full of dust and lands on the floorboards in a bright stretched
// window-shape. Things stored here: a domed travelling trunk, a dress form, a chair under a sheet, a
// stack of picture frames, a wooden rocking horse. A thin curtain at the dormer stirs in a draught.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, planks } = paint;

const cam = camera({ x: .3, y: 1.4, z: 2.4, yaw: -.03, pitch: -.02, focal: 900, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const RIDGE = 3.6, KNEE = .9, HALF = 2.8, END = 9;
const roofY = x => lerp(RIDGE, KNEE, Math.abs(x) / HALF);
const MOON = paint.v3.unit([.15, -.55, -1]);

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }

function shell(ctx, rnd) {
  ctx.fillStyle = '#0c0b10'; ctx.fillRect(0, 0, W, H);
  // floor boards running away from us
  const floor = [P([-HALF, 0, 2.6]), P([HALF, 0, 2.6]), P([HALF, 0, END]), P([-HALF, 0, END])];
  planks(ctx, [floor[3], floor[2], floor[1], floor[0]], rnd, { along: 'v', width: [.035, .05], base: [64, 52, 44], vary: 12, streaks: 2 });
  // knee walls and the sloping roof between rafters (boards seen from below)
  for (const s of [-1, 1]) {
    fill(ctx, [P([s * HALF, 0, 2.6]), P([s * HALF, 0, END]), P([s * HALF, KNEE, END]), P([s * HALF, KNEE, 2.6])], '#1e1a1e');
    fill(ctx, [P([s * HALF, KNEE, 2.6]), P([s * HALF, KNEE, END]), P([0, RIDGE, END]), P([0, RIDGE, 2.6])], '#18141a');
    for (let z = 2.8; z < END; z += .6) {
      const a = P([s * HALF, KNEE, z]), b = P([0, RIDGE, z]), k = cam.focal / Math.max(.5, cam.project([s * HALF * .5, 2, z])[2]);
      ctx.strokeStyle = shade([58, 44, 36], -z * 2); ctx.lineWidth = .09 * k; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = .03 * k; ctx.beginPath(); ctx.moveTo(a[0] + s * .04 * k, a[1] + .02 * k); ctx.lineTo(b[0] + s * .04 * k, b[1] + .02 * k); ctx.stroke();
    }
    for (let i = 1; i < 6; i++) { const x = s * HALF * i / 6; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...P([x, roofY(x), 2.6])); ctx.lineTo(...P([x, roofY(x), END])); ctx.stroke(); }
  }
  // end gable wall with the dormer: wall, the window's deep reveal, panes of moonlit sky
  fill(ctx, [P([-HALF, 0, END]), P([HALF, 0, END]), P([HALF, KNEE, END]), P([0, RIDGE, END]), P([-HALF, KNEE, END])], '#241e22');
  for (let i = 0; i < 30; i++) { const p = P([lerp(-HALF, HALF, rnd()), lerp(0, 2.4, rnd()), END]); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(p[0], p[1], 30 + rnd() * 50, 2); }
}

const WIN = { x0: -.55, x1: .55, y0: 1.1, y1: 2.5, z: END };
function dormer(ctx, rnd) {
  const q = [P([WIN.x0, WIN.y1, WIN.z]), P([WIN.x1, WIN.y1, WIN.z]), P([WIN.x1, WIN.y0, WIN.z]), P([WIN.x0, WIN.y0, WIN.z])];
  fill(ctx, q.map(([x, y], i) => [x + [-18, 18, 18, -18][i], y + [-18, -18, 10, 10][i]]), '#3a3034');
  fill(ctx, q, '#22304a');
  ctx.save(); pathOf(ctx, q); ctx.clip();
  const g = ctx.createRadialGradient(q[0][0] + 50, q[0][1] + 40, 4, q[0][0] + 50, q[0][1] + 40, 220);
  g.addColorStop(0, '#f4f6f8'); g.addColorStop(.12, '#b4c4dc'); g.addColorStop(1, '#22304a');
  ctx.fillStyle = g; ctx.fillRect(q[0][0], q[0][1], q[1][0] - q[0][0], q[2][1] - q[0][1]);
  // the neighbouring roofs and a chimney in silhouette
  ctx.fillStyle = '#0e1220'; ctx.beginPath(); ctx.moveTo(q[3][0], q[3][1]); ctx.lineTo(q[3][0], q[3][1] - 40); ctx.lineTo(q[3][0] + 70, q[3][1] - 70); ctx.lineTo(q[2][0] - 40, q[3][1] - 30); ctx.lineTo(q[2][0], q[3][1] - 46); ctx.lineTo(q[2][0], q[2][1]); ctx.fill();
  ctx.fillRect(q[2][0] - 50, q[3][1] - 96, 18, 40);
  ctx.restore();
  ctx.strokeStyle = '#3a3034'; ctx.lineWidth = 6;
  const mx = (q[0][0] + q[1][0]) / 2, my = (q[0][1] + q[2][1]) / 2;
  ctx.beginPath(); ctx.moveTo(mx, q[0][1]); ctx.lineTo(mx, q[2][1]); ctx.moveTo(q[0][0], my); ctx.lineTo(q[1][0], my); ctx.stroke();
  return q;
}

function things(ctx, rnd) {
  // the trunk: a domed lid with straps and brass corners
  const t = [-1.6, 0, 6.4], tk = cam.focal / cam.project(t)[2], tp = P(t);
  paint.box(ctx, cam, { at: t, sa: .5, sb: .3, h: .45 }, n => (n === 'top' ? '#4a3020' : n === 'front' ? '#3a2618' : '#2a1c12'));
  const lid = P([t[0], .45, t[2] - .3]);
  ctx.fillStyle = '#4a3222'; ctx.beginPath(); ctx.ellipse(lid[0], lid[1], .5 * tk, .14 * tk, 0, Math.PI, TAU); ctx.fill();
  for (const dx of [-.3, .3]) { const a = P([t[0] + dx, 0, t[2] - .3]), b = P([t[0] + dx, .45, t[2] - .3]); ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = .06 * tk; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  for (const dx of [-.5, .5]) { const p = P([t[0] + dx, .45, t[2] - .3]); ctx.fillStyle = '#a8883a'; ctx.fillRect(p[0] - 6, p[1] - 4, 12, 14); }
  void tp;
  // the dress form: a torso on a pole and tripod
  const d = [1.5, 0, 6.8], dk = cam.focal / cam.project(d)[2], db = P(d);
  ctx.strokeStyle = '#2a2420'; ctx.lineWidth = .03 * dk; ctx.beginPath(); ctx.moveTo(db[0], db[1]); ctx.lineTo(db[0], db[1] - 1 * dk); ctx.moveTo(db[0], db[1] - .1 * dk); ctx.lineTo(db[0] - .2 * dk, db[1]); ctx.moveTo(db[0], db[1] - .1 * dk); ctx.lineTo(db[0] + .2 * dk, db[1]); ctx.stroke();
  ctx.fillStyle = '#6a5a4a'; ctx.beginPath(); ctx.moveTo(db[0] - .16 * dk, db[1] - 1 * dk); ctx.bezierCurveTo(db[0] - .22 * dk, db[1] - 1.25 * dk, db[0] - .12 * dk, db[1] - 1.35 * dk, db[0] - .2 * dk, db[1] - 1.55 * dk); ctx.lineTo(db[0] + .2 * dk, db[1] - 1.55 * dk); ctx.bezierCurveTo(db[0] + .12 * dk, db[1] - 1.35 * dk, db[0] + .22 * dk, db[1] - 1.25 * dk, db[0] + .16 * dk, db[1] - 1 * dk); ctx.fill();
  ctx.fillStyle = '#3a302a'; ctx.fillRect(db[0] - .03 * dk, db[1] - 1.66 * dk, .06 * dk, .12 * dk);
  // the sheet-covered chair: a soft lumpy pale shape
  const c = [-.4, 0, 7.6], ck = cam.focal / cam.project(c)[2], cb = P(c);
  ctx.fillStyle = '#7a7c86'; ctx.beginPath(); ctx.moveTo(cb[0] - .45 * ck, cb[1]); ctx.bezierCurveTo(cb[0] - .5 * ck, cb[1] - .6 * ck, cb[0] - .3 * ck, cb[1] - 1.1 * ck, cb[0] - .1 * ck, cb[1] - 1.05 * ck); ctx.bezierCurveTo(cb[0] + .2 * ck, cb[1] - 1.1 * ck, cb[0] + .3 * ck, cb[1] - .7 * ck, cb[0] + .32 * ck, cb[1] - .5 * ck); ctx.bezierCurveTo(cb[0] + .5 * ck, cb[1] - .5 * ck, cb[0] + .5 * ck, cb[1] - .2 * ck, cb[0] + .48 * ck, cb[1]); ctx.fill();
  for (let f = 0; f < 5; f++) { ctx.strokeStyle = 'rgba(30,30,40,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cb[0] - .3 * ck + f * .15 * ck, cb[1]); ctx.quadraticCurveTo(cb[0] - .2 * ck + f * .12 * ck, cb[1] - .3 * ck, cb[0] - .1 * ck + f * .1 * ck, cb[1] - .6 * ck); ctx.stroke(); }
  // picture frames leaning against the right knee wall
  for (let i = 0; i < 3; i++) { const z = 4.6 + i * .25, a = P([2.7, 0, z]), b = P([2.4, .8 - i * .1, z + .05]), k = cam.focal / z; fill(ctx, [a, [a[0], a[1] - (.8 - i * .1) * k], [b[0], b[1]], [b[0], a[1]]], shade([90, 70, 40], i * 8)); fill(ctx, [[a[0] - 8, a[1] - 8], [a[0] - 8, a[1] - (.7 - i * .1) * k], [b[0] + 8, b[1] + 8], [b[0] + 8, a[1] - 8]], shade([50, 54, 64], i * 6)); }
  // rocking horse on the left near us
  const r = [-1.8, 0, 4.4], rk = cam.focal / cam.project(r)[2], rb = P(r);
  ctx.strokeStyle = '#5a3a24'; ctx.lineWidth = .05 * rk; ctx.beginPath(); ctx.ellipse(rb[0], rb[1] - .2 * rk, .6 * rk, .2 * rk, 0, .2, Math.PI - .2); ctx.stroke();
  ctx.lineWidth = .04 * rk; for (const dx of [-.3, .3]) { ctx.beginPath(); ctx.moveTo(rb[0] + dx * rk, rb[1] - .05 * rk); ctx.lineTo(rb[0] + dx * .6 * rk, rb[1] - .45 * rk); ctx.stroke(); }
  ctx.fillStyle = '#8a5a34'; ctx.beginPath(); ctx.ellipse(rb[0], rb[1] - .52 * rk, .36 * rk, .13 * rk, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(rb[0] + .26 * rk, rb[1] - .56 * rk); ctx.lineTo(rb[0] + .44 * rk, rb[1] - .9 * rk); ctx.lineTo(rb[0] + .62 * rk, rb[1] - .82 * rk); ctx.lineTo(rb[0] + .4 * rk, rb[1] - .5 * rk); ctx.fill();
  ctx.fillStyle = '#2a1a10'; for (let m = 0; m < 6; m++) ctx.fillRect(rb[0] + (.28 + m * .03) * rk, rb[1] - (.62 + m * .05) * rk, .05 * rk, .04 * rk);
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(23011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  shell(ctx, rnd);
  const q = dormer(ctx, rnd);
  // the moon's patch on the floor: the window corners carried down along the moonlight
  const drop = p => { const t = p[1] / -MOON[1]; return P([p[0] + MOON[0] * t, 0, p[2] + MOON[2] * t]); };
  const patch = [[WIN.x0, WIN.y1, WIN.z], [WIN.x1, WIN.y1, WIN.z], [WIN.x1, WIN.y0, WIN.z], [WIN.x0, WIN.y0, WIN.z]].map(drop);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; fill(ctx, patch, 'rgba(110,130,170,.4)'); ctx.restore();
  const mx = (patch[0][0] + patch[1][0]) / 2, my = (patch[0][1] + patch[3][1]) / 2;
  ctx.strokeStyle = 'rgba(20,24,36,.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo((patch[0][0] + patch[1][0]) / 2, patch[0][1]); ctx.lineTo((patch[3][0] + patch[2][0]) / 2, patch[3][1]); ctx.moveTo((patch[0][0] + patch[3][0]) / 2, my); ctx.lineTo((patch[1][0] + patch[2][0]) / 2, my); ctx.stroke();
  void mx;
  things(ctx, rnd);
  paint.applyTexture(ctx, make, 2301, .32, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.6, .66, .86], lights: [paint.LIGHT.lamp((q[0][0] + q[1][0]) / 2, (q[0][1] + q[2][1]) / 2, .3, 500, 500, [.7, .8, 1.1])] })(ctx);
  const motes = Array.from({ length: 70 }, () => ({ t: rnd(), u: rnd(), v: rnd(), lag: rnd() * TAU, turns: 1 + Math.floor(rnd() * 2) }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the shaft: a soft quad from window to patch, with dust turning slowly in it
    target.save(); target.globalCompositeOperation = 'lighter';
    const shaft = target.createLinearGradient(0, q[0][1], 0, patch[2][1]);
    shaft.addColorStop(0, 'rgba(120,140,180,.16)'); shaft.addColorStop(1, 'rgba(120,140,180,.04)');
    target.fillStyle = shaft;
    target.beginPath(); target.moveTo(...q[0]); target.lineTo(...q[1]); target.lineTo(...patch[1]); target.lineTo(...patch[2]); target.lineTo(...patch[3]); target.lineTo(...patch[0]); target.closePath(); target.fill();
    for (const m of motes) {
      const top = [lerp(q[0][0], q[1][0], m.u), q[0][1]], bot = [lerp(patch[0][0], patch[1][0], m.u), lerp(patch[0][1], patch[3][1], m.v)];
      const t = (m.t + phase * .1 * m.turns) % 1, x = lerp(top[0], bot[0], t) + Math.sin(TAU * phase * m.turns + m.lag) * 10, y = lerp(top[1], bot[1], t);
      glow(target, x, y, 2.5, 2.5, '210,220,250', .5 * Math.sin(Math.PI * t));
    }
    target.restore();
    // the curtain at the dormer's edge, a thin gauze billowing
    const b = Math.sin(TAU * phase * 2) * .5 + Math.sin(TAU * phase * 3 + 1) * .3;
    target.fillStyle = 'rgba(200,206,220,.22)';
    target.beginPath(); target.moveTo(q[0][0] - 10, q[0][1] - 10); target.lineTo(q[0][0] + 40, q[0][1] - 10);
    target.bezierCurveTo(q[0][0] + 50 + b * 30, q[0][1] + 80, q[0][0] + 30 + b * 50, q[3][1] - 60, q[0][0] + 26 + b * 40, q[3][1] + 10);
    target.lineTo(q[0][0] - 10, q[3][1] + 10); target.fill();
  };
}

module.exports = {
  title: '달빛이 드는 처마 밑 다락',
  slug: 'attic-moonlit-dormer',
  sound: 'room-wind',
  createScene,
};
