'use strict';

// 94 · 빗소리만 남은 돌담 마당
// Inside the walled yard of an old stone farmstead on a rainy night. Rubble walls close it in on two sides;
// straight ahead a round-arched gateway opens onto a lane that runs off into the dark. The flagstones are
// black and wet, each slab its own shape, with puddles in the hollows. A granite trough under a drainpipe
// is brimming and spilling. One lantern on the wall lights a circle of wet stone; its light lies broken in
// the puddles. Rain falls steadily and rings spread in every puddle.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, wobble, v3 } = paint;
const { add } = v3;

const cam = camera({ x: 0, y: 1.6, z: 0, yaw: .1, pitch: .04, focal: 1050, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.6, 1e6])[1];
const LANTERN = [3.2, 2.6, 9.6];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}
const wallMap = (a, b, h0, h1, lean = 0) => (u, v) => P(add(v3.lerp(a, b, u), [0, lerp(h1, h0, v) - .08 * Math.sin(Math.PI * u) * (1 - v), 0], [lean * (1 - v), 0, 0]));

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 20, [[0, '#0a0e16'], [1, '#1e2430']]);
  ctx.fillRect(0, 0, W, HORIZON + 20);
  for (let i = 0; i < 20; i++) glow(ctx, rnd() * W, rnd() * HORIZON, 300 + rnd() * 400, 30 + rnd() * 50, '30,36,48', .3);
}

// Flagstones: irregular slabs laid in rough rows, each a slightly different stone, dark with rain, with
// puddles where slabs have sunk. Returns the puddles so the rain can ring them.
function paving(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#1a1c20'], [1, '#0c0d10']]);
  ctx.fillRect(0, HORIZON, W, H);
  const puddles = [];
  for (let row = 0; row < 18; row++) {
    const z0 = 1.2 + row * .78 + (rnd() - .5) * .08, z1 = z0 + .72;
    for (let x = -7 + rnd() * .5; x < 7;) {
      const w = .6 + rnd() * .7, slab = [[x + .03, z0], [x + w - .03, z0 + (rnd() - .5) * .08], [x + w - .03, z1], [x + .03, z1 + (rnd() - .5) * .08]];
      const pts = wobble(slab.map(([sx, sz]) => P([sx, 0, sz])), 1.2, Math.floor(rnd() * 1e6), 8);
      const k = (rnd() - .5) * 18, lampD = Math.hypot(x + w / 2 - LANTERN[0], (z0 + z1) / 2 - LANTERN[2]);
      fill(ctx, pts, shade([34 + Math.max(0, 6 - lampD) * 3, 34 + Math.max(0, 6 - lampD) * 2, 36], k));
      ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.5; pathOf(ctx, pts); ctx.stroke();
      // a wet sheen on the slab nearer the lamp
      if (lampD < 7) fill(ctx, pts, `rgba(255,190,120,${.05 * (7 - lampD) / 7 * rnd()})`);
      if (rnd() < .16 && z0 < 12) puddles.push({ x: x + w * (.3 + rnd() * .4), z: (z0 + z1) / 2, r: .2 + rnd() * .35 });
      x += w;
    }
  }
  return puddles;
}

function walls(ctx, rnd) {
  // left wall runs from near us away to the gate; the end wall holds the gate; the right wall is short
  const leftA = [-4.2, 0, 1], leftB = [-4.2, 0, 15], endA = [-4.2, 0, 15], endB = [5, 0, 15], rightA = [5, 0, 15], rightB = [5, 0, 8.5];
  paint.masonry(ctx, wallMap(leftA, leftB, 0, 2.6), rnd, { courses: 9, length: [.025, .05], base: [92, 90, 86], wet: .6 });
  fill(ctx, paint.outline(wallMap(leftA, leftB, 0, 2.6), 16), 'rgba(4,6,12,.45)');
  // end wall with the gate cut through it
  const gateL = -.3, gateR = 2.3, archTop = 3.1, spring = 2.1;
  const endWall = wallMap(endA, endB, 0, 3.6);
  paint.masonry(ctx, endWall, rnd, { courses: 12, length: [.03, .06], base: [100, 96, 90], wet: .5 });
  // the gateway: the opening, then the arch's voussoirs around it
  const arch = [];
  for (let i = 0; i <= 20; i++) { const a = Math.PI * (1 - i / 20), cx = (gateL + gateR) / 2, r = (gateR - gateL) / 2; arch.push(P([cx + Math.cos(a) * r, spring + Math.sin(a) * (archTop - spring), 15])); }
  const opening = [P([gateL, 0, 15]), ...arch, P([gateR, 0, 15])];
  const lane = vertical(ctx, P([0, archTop, 15])[1], P([0, 0, 15])[1], [[0, '#0e1220'], [.7, '#121620'], [1, '#08090c']]);
  fill(ctx, opening, lane);
  // the lane beyond, wet and faintly lit by a distant window
  const far = P([.6, 0, 40]);
  glow(ctx, far[0], far[1] - 20, 30, 20, '255,190,120', .4);
  for (let i = 0; i < 20; i++) {
    const a = Math.PI * (1 - i / 20), b = Math.PI * (1 - (i + 1) / 20), cx = (gateL + gateR) / 2, r = (gateR - gateL) / 2, R = r + .38;
    const q = [[a, r], [b, r], [b, R], [a, R]].map(([ang, rr]) => P([cx + Math.cos(ang) * rr, spring + Math.sin(ang) * (archTop - spring) * rr / r, 15.02]));
    fill(ctx, q, shade([118, 112, 104], (rnd() - .5) * 26));
    ctx.strokeStyle = 'rgba(20,18,18,.8)'; ctx.lineWidth = 1.5; pathOf(ctx, q); ctx.stroke();
  }
  fill(ctx, paint.outline(endWall, 16), 'rgba(4,6,12,.35)');
  paint.masonry(ctx, wallMap(rightA, rightB, 0, 2.4), rnd, { courses: 8, length: [.05, .09], base: [96, 92, 88], wet: .7 });
  fill(ctx, paint.outline(wallMap(rightA, rightB, 0, 2.4), 16), 'rgba(4,6,12,.25)');
  // coping stones along the wall tops, rounded and dark
  for (const [a, b, h] of [[leftA, leftB, 2.6], [endA, endB, 3.6], [rightA, rightB, 2.4]]) {
    for (let i = 0; i < 24; i++) {
      const p0 = P(add(v3.lerp(a, b, i / 24), [0, h, 0])), p1 = P(add(v3.lerp(a, b, (i + .9) / 24), [0, h, 0])), r = Math.abs(p1[0] - p0[0]) * .5 + 2;
      ctx.fillStyle = shade([70, 68, 66], (rnd() - .5) * 20); ctx.beginPath(); ctx.ellipse((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, r, r * .4, 0, Math.PI, TAU); ctx.fill();
    }
  }
}

// Granite trough by the right wall, under a drainpipe, brim-full and spilling at one corner.
function trough(ctx, rnd) {
  const c = (x, y, z) => P([x, y, z]);
  const x0 = 2.6, x1 = 4.6, z0 = 9.6, z1 = 10.4, h = .62;
  fill(ctx, [c(x0, h, z0), c(x1, h, z0), c(x1, 0, z0), c(x0, 0, z0)], vertical(ctx, c(0, h, z0)[1], c(0, 0, z0)[1], [[0, '#6a6864'], [1, '#2a2a2a']]));
  fill(ctx, [c(x0, h, z1), c(x0, h, z0), c(x0, 0, z0), c(x0, 0, z1)], '#3a3a3c');
  fill(ctx, [c(x0, h, z0), c(x1, h, z0), c(x1, h, z1), c(x0, h, z1)], '#5a5a5a');
  fill(ctx, [c(x0 + .1, h - .01, z0 + .1), c(x1 - .1, h - .01, z0 + .1), c(x1 - .1, h - .01, z1 - .1), c(x0 + .1, h - .01, z1 - .1)], '#141a24');
  for (let i = 0; i < 40; i++) { const p = c(lerp(x0, x1, rnd()), lerp(0, h, rnd()), z0); ctx.fillStyle = `rgba(${rnd() < .5 ? '20,20,22' : '150,148,140'},.4)`; ctx.fillRect(p[0], p[1], 2, 2); }
  // drainpipe down the wall into it
  const top = c(4.2, 2.4, 10.8), bend = c(4.2, .95, 10.8), out = c(4, .9, 10.2);
  ctx.strokeStyle = '#26282c'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...top); ctx.lineTo(...bend); ctx.lineTo(...out); ctx.stroke();
  return { spout: out, surface: [c(x0 + .1, h, z0 + .1), c(x1 - .1, h, z1 - .1)], spill: c(x0 + .05, h, z0) };
}

function lantern(ctx) {
  const p = P(LANTERN), arm = P([3.2, 2.9, 10.6]);
  ctx.strokeStyle = '#141414'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(...arm); ctx.lineTo(p[0], arm[1]); ctx.lineTo(p[0], p[1] - 22); ctx.stroke();
  fill(ctx, [[p[0] - 14, p[1] - 22], [p[0] + 14, p[1] - 22], [p[0] + 16, p[1] + 20], [p[0] - 16, p[1] + 20]], '#161414');
  fill(ctx, [[p[0] - 10, p[1] - 17], [p[0] + 10, p[1] - 17], [p[0] + 12, p[1] + 15], [p[0] - 12, p[1] + 15]], '#ffd28c');
  return p;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(94011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  const puddles = paving(ctx, rnd);
  walls(ctx, rnd);
  const tr = trough(ctx, rnd);
  const lamp = lantern(ctx);
  // puddles: dark mirrors with the lantern's light lying in them as a broken streak
  const pud = puddles.map(p => {
    const s = cam.project([p.x, 0, p.z]), k = cam.focal / s[2];
    const shape = wobble(Array.from({ length: 12 }, (_, i) => [s[0] + Math.cos(i / 12 * TAU) * p.r * k, s[1] + Math.sin(i / 12 * TAU) * p.r * k * .3]), p.r * k * .08, Math.floor(rnd() * 1e6), 6);
    fill(ctx, shape, 'rgba(30,38,54,.85)');
    ctx.strokeStyle = 'rgba(120,134,160,.25)'; ctx.lineWidth = 1; pathOf(ctx, shape); ctx.stroke();
    return { ...p, s, k, shape };
  });
  paint.applyTexture(ctx, make, 9401, .38, 0, 0, W, H, true);
  const floor = P([LANTERN[0], 0, LANTERN[2] - 1]);
  paint.lighting(make, { ambient: [.62, .66, .76], lights: [paint.LIGHT.lamp(lamp[0], lamp[1] + 40, .7, 480, 420), paint.LIGHT.lamp(floor[0], floor[1], .55, 520, 160)] })(ctx);
  const rain = paint.particles(rnd, 520, { kind: 'rain', near: .25, slant: .1 });
  const rings = Array.from({ length: 40 }, (_, i) => ({ p: pud[i % pud.length], dx: (rnd() - .5) * 1.4, offset: rnd(), turns: 2 + Math.floor(rnd() * 3) }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // lamp light shivering in the puddles
    for (const p of pud) {
      if (Math.abs(p.s[0] - lamp[0]) > 400) continue;
      target.save(); pathOf(target, p.shape); target.clip();
      for (let i = 0; i < 6; i++) {
        const y = p.s[1] - p.k * p.r * .2 + i * 3, x = lamp[0] + (p.s[0] - lamp[0]) * .15 + Math.sin(TAU * (phase * 4 + i * .3 + p.x)) * 4;
        target.fillStyle = `rgba(255,200,130,${.35 - i * .05})`; target.fillRect(x - 10, y, 20, 2);
      }
      target.restore();
    }
    for (const r of rings) {
      if (!r.p) continue;
      const age = (phase * r.turns + r.offset) % 1, x = r.p.s[0] + r.dx * r.p.r * r.p.k * .5, y = r.p.s[1];
      target.strokeStyle = `rgba(170,184,206,${.5 * (1 - age) * Math.min(1, age * 12)})`; target.lineWidth = 1;
      target.beginPath(); target.ellipse(x, y, (2 + age * 16) * r.p.k / 120, (1 + age * 5) * r.p.k / 120, 0, 0, TAU); target.stroke();
    }
    // the trough spills: a thin sheet over the corner, and the drainpipe pours in
    const spill = .5 + .5 * Math.sin(TAU * phase * 6);                // the sheet's length breathes smoothly instead of stepping
    target.strokeStyle = 'rgba(180,196,220,.5)'; target.lineWidth = 2;
    target.beginPath(); target.moveTo(...tr.spout); target.lineTo(tr.spout[0] + Math.sin(TAU * phase * 8) * 1.5, tr.surface[0][1]); target.stroke();
    target.beginPath(); target.moveTo(tr.spill[0], tr.spill[1]); target.quadraticCurveTo(tr.spill[0] - 6, tr.spill[1] + 20, tr.spill[0] - 4, tr.spill[1] + 60 + spill * 4); target.stroke();
    const flicker = 1 + .08 * paint.loopNoise(phase, 3, 8);
    glow(target, lamp[0], lamp[1], 70, 70, '255,200,130', .55 * flicker);
    rain.draw(target, phase, '170,182,204');
  };
}

module.exports = {
  title: '빗소리만 남은 돌담 마당',
  slug: 'rain-in-the-stone-courtyard',
  sound: 'rain-street',
  createScene,
};
