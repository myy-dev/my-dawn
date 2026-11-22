'use strict';

// 91 · 건초 창고의 등불
// An open-sided hay barn at the edge of a field, late at night. Rough timber posts carry a corrugated iron
// roof gone rusty in streaks, its eaves sagging between posts. Inside, square bales are stacked in uneven
// steps, the face of the stack lit gold by a lamp hung from a beam; the light falls out of the barn onto
// the trampled straw and grass in front. The wind is up: loose straw lifts from the stack and skitters out,
// and the lamp sways a little on its hook.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, lambert, v3 } = paint;
const { add, mul, unit, UP } = v3;

const cam = camera({ x: 0, y: 1.6, z: 0, yaw: -.18, pitch: -.03, focal: 1150, cx: 960, cy: 580 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.6, 1e6])[1];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// Barn frame in metres: long axis A running away to the left, open front facing us.
const T = 2.6, A = [Math.cos(T), 0, Math.sin(T)], B = [-Math.sin(T), 0, Math.cos(T)];
const O = [3.2, 0, 9.6];                               // front-right post
const LEN = 12, DEPTH = 6, EAVE_F = 4.2, EAVE_B = 3.4;
const LAMP = add(O, mul(A, 4.4), mul(B, 2.2), [0, 3.4, 0]);
const at = (u, v, h) => add(O, mul(A, u), mul(B, v), [0, h, 0]);
// How lit a surface is by the lamp, by distance and angle.
const lampLight = (p, n) => lambert(n, unit(v3.sub(LAMP, p))) * 9 / (2 + v3.sub(LAMP, p).reduce((s, v) => s + v * v, 0));

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 10, [[0, '#080c18'], [.7, '#161e2e'], [1, '#2a3242']]);
  ctx.fillRect(0, 0, W, HORIZON + 10);
  paint.starfield(ctx, rnd, 200, HORIZON);
  for (let i = 0; i < 16; i++) glow(ctx, rnd() * W, 120 + rnd() * 300, 300 + rnd() * 400, 14 + rnd() * 24, '40,48,66', .25);
  paint.ridgeline(ctx, HORIZON + 2, 34, [22, 28, 36], 111, [[260, 1], [50, .6], [10, .4], [4, .3]], HORIZON + 30);
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#262a26'], [1, '#121410']]);
  ctx.fillRect(0, HORIZON + 4, W, H);
  // grass and trampled straw in front of the barn
  for (let i = 0; i < 6000; i++) {
    const z = 3 + rnd() ** 1.6 * 50, x = (rnd() - .5) * z * 2.6, s = cam.project([x, 0, z]); if (s[2] <= 0 || s[1] < HORIZON) continue;
    const k = cam.focal / s[2], h = (.05 + rnd() * .12) * k, straw = Math.hypot(x - LAMP[0], z - LAMP[2]) < 7 && rnd() < .5;
    ctx.strokeStyle = straw ? `rgba(150,124,70,${.5})` : `rgba(${40 + rnd() * 20},${50 + rnd() * 20},${36},.6)`;
    ctx.lineWidth = Math.max(.5, .012 * k);
    ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[0] + (straw ? h * 1.6 : (rnd() - .5) * h * .5), s[1] - (straw ? h * .2 : h)); ctx.stroke();
  }
}

// One square bale: a box of straw, its faces lit by the lamp, its sides combed with straw strokes and two
// strings across the top.
function bale(ctx, rnd, base) {
  const [bu, bv, bh] = base, l = 1, w = .46, h = .36;
  const c = (du, dv, dh) => at(bu + du, bv + dv, bh + dh);
  const faces = [
    { pts: [c(0, 0, h), c(l, 0, h), c(l, 0, 0), c(0, 0, 0)], n: mul(B, -1) },   // front, toward us
    { pts: [c(0, 0, h), c(0, w, h), c(l, w, h), c(l, 0, h)], n: UP },             // top
    { pts: [c(0, w, h), c(0, 0, h), c(0, 0, 0), c(0, w, 0)], n: mul(A, -1) },   // end
  ];
  for (const f of faces) {
    const mid = v3.lerp(f.pts[0], f.pts[2], .5), light = Math.min(1, .12 + lampLight(mid, f.n));
    const q = f.pts.map(P);
    fill(ctx, q, shade([150 * (.25 + light), 124 * (.25 + light), 70 * (.25 + light)], (rnd() - .5) * 14));
    // straw grain on the face
    for (let i = 0; i < 26; i++) {
      const u = rnd(), v = rnd(), p0 = [lerp(lerp(q[0][0], q[1][0], u), lerp(q[3][0], q[2][0], u), v), lerp(lerp(q[0][1], q[1][1], u), lerp(q[3][1], q[2][1], u), v)];
      ctx.strokeStyle = `rgba(${210 * (.3 + light)},${180 * (.3 + light)},${110 * (.3 + light)},.5)`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(p0[0] + (rnd() - .5) * 10, p0[1] + (rnd() - .5) * 4); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(20,14,8,.5)'; ctx.lineWidth = 1; pathOf(ctx, q); ctx.stroke();
  }
  for (const t of [.3, .7]) {
    ctx.strokeStyle = 'rgba(40,30,20,.7)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(...P(c(l * t, 0, 0))); ctx.lineTo(...P(c(l * t, 0, h))); ctx.lineTo(...P(c(l * t, w, h))); ctx.stroke();
  }
}

function stack(ctx, rnd) {
  // stepped: more bales at the back and bottom, the front rows taken down unevenly through the winter
  const bales = [];
  // the stack has been eaten into from the front and the right: tall at the back left, ragged steps
  // toward us, a few bales knocked askew
  for (let layer = 0; layer < 6; layer++) {
    for (let row = 0; row < 7; row++) {
      const depthRows = Math.max(0, Math.round(9 - layer * 1.2 - row * .5 - rnd() * 2));
      for (let d = 0; d < depthRows; d++) {
        if (rnd() < .05) continue;
        const loose = d === depthRows - 1 ? .12 : .03;
        bales.push([1.2 + row * 1.05 + (rnd() - .5) * loose * 2, DEPTH - .55 - d * .5 + (rnd() - .5) * loose, layer * .37]);
      }
    }
  }
  // draw from far to near: deeper rows first, low layers first, left to right away from us
  bales.sort((p, q) => q[1] - p[1] || p[2] - q[2] || q[0] - p[0]);
  for (const b of bales) if (b[1] > -0.2) bale(ctx, rnd, b);
}

function frame(ctx, rnd) {
  // back wall boards in deep shadow, then the posts and beams
  const back = (u, v) => P(at(u * LEN, DEPTH, EAVE_B * (1 - v)));
  paint.planks(ctx, back, rnd, { along: 'v', width: [.02, .03], base: [40, 34, 30], streaks: 2 });
  const post = (u, v, top) => {
    const r = .11, a = at(u, v, 0), b = at(u, v, top), side = mul(A, r);
    const q = [P(add(b, mul(side, -1))), P(add(b, side)), P(add(a, side)), P(add(a, mul(side, -1)))];
    const light = Math.min(1, .15 + lampLight(at(u, v, top * .5), unit(v3.sub(LAMP, at(u, v, 1)))));
    fill(ctx, q, shade([90 * light + 20, 72 * light + 16, 56 * light + 14], (rnd() - .5) * 10));
  };
  for (let u = 0; u <= LEN + .01; u += 3) post(u, DEPTH, EAVE_B);
  for (let u = 0; u <= LEN + .01; u += 3) post(u, 0, EAVE_F + (u % 6 ? -.1 : 0));
  const beam = (v, h) => {
    const pts = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16 * LEN; pts.push(P(at(u, v, h - .12 * Math.sin(Math.PI * i / 16 * 4) ** 2))); }
    ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 9; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  };
  beam(0, EAVE_F); beam(DEPTH, EAVE_B);
}

// Corrugated roof: sloping from the front eave down to the back, in ribbed sheets with rust streaks.
function roof(ctx, rnd) {
  const sheet = (u, v) => P(at(-.3 + u * (LEN + .6), -.5 + v * (DEPTH + 1), lerp(EAVE_F + .25, EAVE_B + .1, v) - .1 * Math.sin(Math.PI * u * 4) ** 2 * (1 - v * .5)));
  const outline = paint.outline(sheet, 16);
  fill(ctx, outline, '#3a3634');
  for (let i = 0; i <= 120; i++) {
    const u = i / 120, a = sheet(u, 0), b = sheet(u, 1);
    ctx.strokeStyle = i % 2 ? 'rgba(120,116,112,.35)' : 'rgba(10,10,12,.45)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  }
  for (let i = 0; i < 50; i++) {
    const u = rnd(), v0 = rnd() * .6, a = sheet(u, v0), b = sheet(u + (rnd() - .5) * .01, v0 + .1 + rnd() * .4);
    ctx.strokeStyle = `rgba(130,62,30,${.15 + rnd() * .25})`; ctx.lineWidth = 1.5 + rnd() * 4;
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  }
  // the front edge, rolled and dented, catching a line of lamp light underneath
  const edge = [];
  for (let i = 0; i <= 30; i++) edge.push(sheet(i / 30, 0));
  ctx.strokeStyle = '#1e1c1c'; ctx.lineWidth = 5; ctx.beginPath(); edge.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,180,110,.25)'; ctx.lineWidth = 2; ctx.beginPath(); edge.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] + 4) : ctx.moveTo(p[0], p[1] + 4))); ctx.stroke();
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(91011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  frame(ctx, rnd);
  stack(ctx, rnd);
  roof(ctx, rnd);
  paint.applyTexture(ctx, make, 9101, .4, 0, 0, W, H, true);
  const lamp = P(LAMP), floor = P(add(LAMP, [0, -3.4, -2]));
  paint.lighting(make, { skyline: HORIZON, ambient: [.5, .54, .66], lights: [paint.LIGHT.lamp(lamp[0], lamp[1] + 60, .6, 520, 360), paint.LIGHT.lamp(floor[0], floor[1], .5, 600, 220)] })(ctx);
  // loose straw lifted by the gusts: short stalks tumbling out of the barn and away, looping
  const straws = Array.from({ length: 40 }, () => ({ x: lamp[0] + (rnd() - .5) * 300, y: floor[1] - rnd() * 200, turns: 1 + Math.floor(rnd() * 2), offset: rnd(), spin: 1 + Math.floor(rnd() * 3), len: 6 + rnd() * 10 }));
  const hook = P(add(LAMP, [0, .6, 0]));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the lamp swings a few degrees on its hook, and its glow follows
    const swing = .08 * Math.sin(TAU * phase * 3) + .04 * Math.sin(TAU * phase * 5 + 1);
    const lx = hook[0] + Math.sin(swing) * (lamp[1] - hook[1]), ly = hook[1] + Math.cos(swing) * (lamp[1] - hook[1]);
    target.strokeStyle = '#141010'; target.lineWidth = 2; target.beginPath(); target.moveTo(...hook); target.lineTo(lx, ly - 12); target.stroke();
    fill(target, [[lx - 8, ly - 12], [lx + 8, ly - 12], [lx + 10, ly + 12], [lx - 10, ly + 12]], '#1a1414');
    fill(target, [[lx - 5, ly - 8], [lx + 5, ly - 8], [lx + 7, ly + 9], [lx - 7, ly + 9]], '#ffd48e');
    const flicker = 1 + .08 * paint.loopNoise(phase, 4, 9);
    glow(target, lx, ly, 60, 60, '255,200,130', .6 * flicker);
    glow(target, lx, ly + 40, 300, 220, '255,170,90', .1 * flicker);
    for (const s of straws) {
      const t = (s.offset + phase * s.turns) % 1;
      const x = s.x - 40 + t * 700, y = s.y + Math.sin(t * Math.PI * 2) * 30 - t * 80 + t * t * 160, a = Math.sin(t * Math.PI);
      const ang = TAU * (phase * s.spin + s.offset);
      target.strokeStyle = `rgba(200,170,100,${.6 * a})`; target.lineWidth = 1.4;
      target.beginPath(); target.moveTo(x - Math.cos(ang) * s.len / 2, y - Math.sin(ang) * s.len / 2); target.lineTo(x + Math.cos(ang) * s.len / 2, y + Math.sin(ang) * s.len / 2); target.stroke();
    }
  };
}

module.exports = {
  title: '건초 창고의 등불',
  slug: 'lamp-in-the-hay-barn',
  sound: 'gust',
  createScene,
};
