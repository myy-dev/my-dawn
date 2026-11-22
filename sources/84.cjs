'use strict';

// 84 · 빈 주차장에 불 켜진 경비실
// A big open-air car park in the rain at night, almost empty. Painted bays stretch away across wet tarmac,
// shining with puddles; a single small hatchback sits under a tall lamp. At the entrance, a barrier arm
// striped red and white and a tiny guard booth with windows on three sides, its light on: inside, a desk,
// a kettle, a small TV flickering blue, a jacket on a hook. Rain slants through the floodlights' cones.
// Puddles ripple. Beyond the fence, a dark row of trees and a distant lit apartment block.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: -3, y: 1.7, z: 0, yaw: .2, pitch: .04, focal: 1000, cx: 960, cy: 520 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(.2) * 1e6, 1.7, Math.cos(.2) * 1e6])[1];
const BOOTH = [2.2, 0, 8];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function lot(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#0a0c14'], [1, '#22262e']]); ctx.fillRect(0, 0, W, H);
  // far: trees and an apartment block with scattered lit windows
  const blk = (u, v) => P([lerp(20, 50, u), lerp(24, 0, v), 120]);
  fill(ctx, paint.outline(blk, 4), '#1e2028');
  for (let f = 0; f < 12; f++) for (let c = 0; c < 14; c++) if (rnd() < .18) { const p = blk((c + .5) / 14, (f + .5) / 12); ctx.fillStyle = rnd() < .8 ? '#e0a868' : '#a8c4e8'; ctx.fillRect(p[0] - 3, p[1] - 2, 6, 4); }
  for (let i = 0; i < 80; i++) { const x = -60 + i * 1.6, p = P([x, 0, 70]), h = (4 + rnd() * 5) * cam.focal / 70; ctx.fillStyle = shade([20, 26, 24], (rnd() - .5) * 8); ctx.beginPath(); ctx.ellipse(p[0], p[1] - h * .6, h * .4, h * .6, 0, 0, TAU); ctx.fill(); }
  // tarmac
  // the tarmac: its near edge follows a line in front of the camera, bending away on the left (the camera
  // is turned right, so a straight near edge at z = 1 would run behind it there)
  fill(ctx, [P([-40, 0, 70]), P([40, 0, 70]), P([40, 0, 1]), P([0, 0, 1.2]), P([-8, 0, 5]), P([-20, 0, 12]), P([-40, 0, 20])], vertical(ctx, HORIZON, H, [[0, '#2a2c32'], [1, '#18191c']]));
  // fence along the back
  for (let x = -40; x < 40; x += 2.5) { const a = P([x, 0, 68]), b = P([x, 2, 68]); ctx.strokeStyle = 'rgba(30,32,36,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(...P([-40, 2, 68])); ctx.lineTo(...P([40, 2, 68])); ctx.stroke();
  // bays: rows of white lines across the tarmac
  for (const zr of [14, 24, 34, 44]) {
    for (let x = -20; x <= 24; x += 2.6) { const a = P([x, .005, zr]), b = P([x, .005, zr + 5]); ctx.strokeStyle = 'rgba(200,200,190,.5)'; ctx.lineWidth = Math.max(1, 50 / zr); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(...P([-20, .005, zr])); ctx.lineTo(...P([24, .005, zr])); ctx.stroke();
  }
  // puddles: darker smooth shapes that will hold reflections
  const puddles = [];
  for (let i = 0; i < 9; i++) { const c = [lerp(-10, 14, rnd()), 0, lerp(5, 30, rnd())], r = 1 + rnd() * 2.5; const pts = []; for (let a = 0; a < 16; a++) { const t = a / 16 * TAU, rr = r * (.8 + .3 * Math.sin(t * 3 + i)); pts.push(P([c[0] + Math.cos(t) * rr * 1.4, .005, c[2] + Math.sin(t) * rr])); } fill(ctx, pts, 'rgba(10,12,16,.3)'); puddles.push(pts); }
  return puddles;
}

function booth(ctx, rnd) {
  const [bx, , bz] = BOOTH;
  // base and walls: a small cabin, windows on three sides, flat roof with an overhang
  paint.box(ctx, cam, { at: BOOTH, sa: 1.1, sb: .9, h: .9 }, n => (n === 'top' ? '#6a6e72' : n === 'front' ? '#5a5e62' : '#4a4e52'));
  const glass = paint.box(ctx, cam, { at: [bx, .9, bz], sa: 1.1, sb: .9, h: 1.3 }, () => '#a88a58');
  // inside through the front glass: desk, kettle, TV (lit per frame), a jacket
  const k = cam.focal / cam.project([bx, 1.3, bz - .9])[2];
  const desk = P([bx, 1.05, bz - .5]); fill(ctx, [[desk[0] - .9 * k, desk[1]], [desk[0] + .9 * k, desk[1]], [desk[0] + .9 * k, desk[1] + .08 * k], [desk[0] - .9 * k, desk[1] + .08 * k]], '#6a4a30');
  const kt = P([bx - .6, 1.05, bz - .4]); ctx.fillStyle = '#d8d8d4'; ctx.beginPath(); ctx.ellipse(kt[0], kt[1] - .08 * k, .07 * k, .09 * k, 0, 0, TAU); ctx.fill();
  const tv = P([bx + .4, 1.25, bz - .3]); fill(ctx, [[tv[0] - .2 * k, tv[1] - .3 * k], [tv[0] + .2 * k, tv[1] - .3 * k], [tv[0] + .2 * k, tv[1]], [tv[0] - .2 * k, tv[1]]], '#1a1a1e');
  const jk = P([bx - 1, 1.9, bz]); fill(ctx, [[jk[0], jk[1]], [jk[0] + .25 * k, jk[1] + .1 * k], [jk[0] + .22 * k, jk[1] + .7 * k], [jk[0] - .04 * k, jk[1] + .65 * k]], '#2a3a5a');
  // window frames
  for (const q of Object.values(glass)) { ctx.strokeStyle = '#3a3e42'; ctx.lineWidth = 5; pathOf(ctx, q); ctx.stroke(); ctx.beginPath(); ctx.moveTo((q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2); ctx.lineTo((q[3][0] + q[2][0]) / 2, (q[3][1] + q[2][1]) / 2); ctx.stroke(); }
  paint.box(ctx, cam, { at: [bx, 2.2, bz], sa: 1.35, sb: 1.15, h: .16 }, n => (n === 'top' ? '#3a3e42' : '#2a2e32'));
  // the barrier: a post with a long striped arm across the lane
  const post = [bx - 1.6, 0, bz - 1.2];
  paint.box(ctx, cam, { at: post, sa: .18, sb: .18, h: 1 }, n => (n === 'front' ? '#d8b020' : '#a88a18'));
  const a0 = P([post[0], .95, post[2]]), a1 = P([post[0] - 6, .95, post[2]]);
  for (let s = 0; s < 10; s++) { const p = [lerp(a0[0], a1[0], s / 10), lerp(a0[1], a1[1], s / 10)], q = [lerp(a0[0], a1[0], (s + 1) / 10), lerp(a0[1], a1[1], (s + 1) / 10)]; ctx.strokeStyle = s % 2 ? '#e8e8e4' : '#c83a32'; ctx.lineWidth = Math.max(3, .1 * cam.focal / cam.project([post[0] - s * .6, 1, post[2]])[2]); ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.stroke(); }
  return { tv: [tv[0], tv[1] - .15 * k, k], inside: P([bx, 1.6, bz]) };
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(84011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const puddles = lot(ctx, rnd);
  // the lone car under the far lamp: a small rounded hatchback
  const car = [9, 0, 26], cp = P(car), ck = cam.focal / cam.project(car)[2];
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(cp[0], cp[1], 2.2 * ck, .5 * ck, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5a6a7a'; ctx.beginPath(); ctx.moveTo(cp[0] - 1.9 * ck, cp[1] - .2 * ck); ctx.lineTo(cp[0] - 1.9 * ck, cp[1] - .8 * ck); ctx.quadraticCurveTo(cp[0] - 1.4 * ck, cp[1] - .85 * ck, cp[0] - 1 * ck, cp[1] - 1.4 * ck); ctx.lineTo(cp[0] + .9 * ck, cp[1] - 1.45 * ck); ctx.quadraticCurveTo(cp[0] + 1.7 * ck, cp[1] - 1.2 * ck, cp[0] + 1.9 * ck, cp[1] - .7 * ck); ctx.lineTo(cp[0] + 1.9 * ck, cp[1] - .2 * ck); ctx.fill();
  ctx.fillStyle = '#1a2028'; ctx.beginPath(); ctx.moveTo(cp[0] - .9 * ck, cp[1] - 1.3 * ck); ctx.lineTo(cp[0] + .8 * ck, cp[1] - 1.35 * ck); ctx.lineTo(cp[0] + 1.3 * ck, cp[1] - .9 * ck); ctx.lineTo(cp[0] - 1.3 * ck, cp[1] - .85 * ck); ctx.fill();
  for (const dx of [-1.2, 1.2]) { ctx.fillStyle = '#0e0e10'; ctx.beginPath(); ctx.ellipse(cp[0] + dx * ck, cp[1] - .2 * ck, .35 * ck, .32 * ck, 0, 0, TAU); ctx.fill(); }
  // tall floodlights
  const lamps = [];
  for (const [x, z] of [[9, 23], [-8, 40], [22, 50]]) { const foot = P([x, 0, z]), head = P([x, 9, z]), k = cam.focal / cam.project([x, 9, z])[2]; ctx.strokeStyle = '#16181c'; ctx.lineWidth = Math.max(2, .25 * k); ctx.beginPath(); ctx.moveTo(...foot); ctx.lineTo(...head); ctx.stroke(); fill(ctx, [[head[0] - .5 * k, head[1]], [head[0] + .5 * k, head[1]], [head[0] + .4 * k, head[1] + .25 * k], [head[0] - .4 * k, head[1] + .25 * k]], '#22242a'); lamps.push({ head: [head[0], head[1] + .25 * k], foot, k }); }
  const b = booth(ctx, rnd);
  paint.applyTexture(ctx, make, 8401, .36, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.46, .48, .6], lights: [...lamps.map(l => paint.LIGHT.lamp(l.foot[0], l.foot[1] - 30, .3, 8 * l.k, 3 * l.k, [1.25, 1.05, .8])), paint.LIGHT.lamp(b.inside[0], b.inside[1] + 60, .18, 220, 220, [1.3, 1, .65])] })(ctx);
  // reflections of the lights in the puddles
  const refl = make(W, H), rc = refl.getContext('2d');
  for (const l of lamps) for (let i = 0; i < 12; i++) glow(rc, l.head[0], l.foot[1] + (l.foot[1] - l.head[1]) * (i / 12) * .9, 10, 18, '255,220,170', .5 * (1 - i / 12));
  glow(rc, b.inside[0], b.inside[1] + 260, 80, 140, '255,200,130', .5);
  const top = Math.min(...puddles.flat().map(p => p[1]));
  const rain = paint.particles(rnd, 360, { kind: 'rain', near: .2, slant: .16, speed: 1 });
  const rings = puddles.flatMap(pts => Array.from({ length: 3 }, () => ({ at: pts[Math.floor(rnd() * pts.length)].map((v, i) => lerp(v, pts.reduce((s, p) => s + p[i], 0) / pts.length, .6)), offset: rnd(), turns: 3 + Math.floor(rnd() * 3) })));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.beginPath(); for (const pts of puddles) { pts.forEach((p, i) => (i ? target.lineTo(...p) : target.moveTo(...p))); target.closePath(); } target.clip();
    target.globalCompositeOperation = 'lighter'; paint.ripple(target, refl, top, phase, { bands: 2, amp: .7, speed: 4 });
    target.restore();
    for (const r of rings) { const t = (phase * r.turns + r.offset) % 1; target.strokeStyle = `rgba(210,216,230,${.4 * (1 - t)})`; target.lineWidth = 1; target.beginPath(); target.ellipse(r.at[0], r.at[1], 3 + t * 18, 1 + t * 4, 0, 0, TAU); target.stroke(); }
    // floodlight cones with rain glinting through them
    target.save(); target.globalCompositeOperation = 'lighter';
    for (const l of lamps) { const g = target.createLinearGradient(0, l.head[1], 0, l.foot[1]); g.addColorStop(0, 'rgba(255,230,190,.16)'); g.addColorStop(1, 'rgba(255,230,190,0)'); target.fillStyle = g; target.beginPath(); target.moveTo(l.head[0] - .4 * l.k, l.head[1]); target.lineTo(l.head[0] + .4 * l.k, l.head[1]); target.lineTo(l.foot[0] + 4 * l.k, l.foot[1]); target.lineTo(l.foot[0] - 4 * l.k, l.foot[1]); target.fill(); glow(target, l.head[0], l.head[1], .8 * l.k, .3 * l.k, '255,240,210', .9); }
    target.restore();
    // the TV flickering blue in the booth
    const fl = .6 + .25 * Math.sin(TAU * phase * 13) + .15 * Math.sin(TAU * phase * 29);
    fill(target, [[b.tv[0] - .17 * b.tv[2], b.tv[1] - .12 * b.tv[2]], [b.tv[0] + .17 * b.tv[2], b.tv[1] - .12 * b.tv[2]], [b.tv[0] + .17 * b.tv[2], b.tv[1] + .12 * b.tv[2]], [b.tv[0] - .17 * b.tv[2], b.tv[1] + .12 * b.tv[2]]], `rgba(140,180,255,${fl})`);
    glow(target, b.tv[0], b.tv[1], .8 * b.tv[2], .6 * b.tv[2], '120,160,255', .2 * fl);
    rain.draw(target, phase, '200,210,226');
  };
}

module.exports = {
  title: '빈 주차장에 불 켜진 경비실',
  slug: 'guard-booth-at-the-empty-lot',
  sound: 'rain-street',
  createScene,
};
