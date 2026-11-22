'use strict';

// 99 · 비가 그친 감자밭
// A potato field at dawn just after the rain has stopped. We look along the rows from low down: each ridge
// carries a line of potato plants, leafy mounds of compound leaves heavy with water, and the furrows
// between them are full, holding strips of the pink-grey sky. A tool shed stands at the far headland under
// a thinning mist. Now and then a drop gathers at a leaf tip and falls, ringing the water below.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: .35, y: 1.1, z: 0, yaw: .02, pitch: -.06, focal: 1100, cx: 960, cy: 540 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.1, 1e6])[1];
const ROW = .75;                                    // spacing between ridges

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}
const SKY = [[0, '#3c4256'], [.5, '#7c7484'], [.85, '#c49a94'], [1, '#d8b4a0']];

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 10, SKY);
  ctx.fillRect(0, 0, W, HORIZON + 10);
  for (let i = 0; i < 30; i++) glow(ctx, rnd() * W, 60 + rnd() * (HORIZON - 160), 260 + rnd() * 400, 18 + rnd() * 40, i % 3 ? '90,88,104' : '210,170,160', .14);
  paint.ridgeline(ctx, HORIZON + 3, 30, [64, 66, 74], 191, [[260, 1], [50, .6], [10, .4], [4, .2]], HORIZON + 30);
  const sh = P([3, 0, 70]);
  fill(ctx, [[sh[0] - 26, sh[1]], [sh[0] + 22, sh[1]], [sh[0] + 22, sh[1] - 22], [sh[0] - 26, sh[1] - 30]], '#3e3c42');
  fill(ctx, [[sh[0] - 30, sh[1] - 30], [sh[0] + 26, sh[1] - 22], [sh[0] + 26, sh[1] - 26], [sh[0] - 30, sh[1] - 34]], '#2a2a30');
  glow(ctx, W / 2, HORIZON + 6, 1100, 30, '200,180,180', .4);
}

// Furrows of standing water: each a strip mirroring the sky's colour band, bounded by the ridges.
function furrows(ctx) {
  ctx.fillStyle = '#2a221e'; ctx.fillRect(0, HORIZON + 3, W, H);
  for (let r = -12; r <= 12; r++) {
    const x0 = r * ROW + .14, x1 = (r + 1) * ROW - .14, a = [], b = [];
    for (let i = 0; i <= 24; i++) { const z = .8 + (i / 24) ** 1.7 * 80; a.push(P([x0, -.08, z])); b.push(P([x1, -.08, z])); }
    const strip = a.concat(b.reverse());
    // the reflection is the sky flipped: the bright horizon nearest the far end, the slate overhead near us
    fill(ctx, strip, vertical(ctx, HORIZON, H, [[0, '#d0aa9a'], [.25, '#8a7880'], [1, '#2e3244']]));
  }
}

// One potato plant: a mound of compound leaves (pairs of leaflets along a stalk), dark green, rain-beaded.
function plant(ctx, rnd, base, scale) {
  const k = cam.focal / cam.project(base)[2] * scale;
  const s = P(base), stems = 5 + Math.floor(rnd() * 5);
  for (let i = 0; i < stems; i++) {
    const a = -Math.PI / 2 + (rnd() - .5) * 2.2, len = (.25 + rnd() * .25) * k;
    const end = [s[0] + Math.cos(a) * len, s[1] + Math.sin(a) * len * .7];
    ctx.strokeStyle = '#2a3a22'; ctx.lineWidth = Math.max(.6, .012 * k);
    ctx.beginPath(); ctx.moveTo(...s); ctx.quadraticCurveTo(s[0] + Math.cos(a) * len * .4, s[1] - len * .5, ...end); ctx.stroke();
    for (let l = 0; l < 4; l++) {
      const t = .35 + l * .2, cx = lerp(s[0], end[0], t), cy = lerp(s[1], end[1], t) - len * .2 * Math.sin(t * Math.PI);
      for (const side of [-1, 1]) {
        const la = a + side * (1 + rnd() * .4), size = (.035 + rnd() * .03) * k;
        const lx = cx + Math.cos(la) * size, ly = cy + Math.sin(la) * size * .7, tone = (rnd() - .5) * 20;
        ctx.fillStyle = shade([44, 70, 40], tone); ctx.beginPath(); ctx.ellipse(lx, ly, size, size * .55, la, 0, TAU); ctx.fill();
        ctx.fillStyle = shade([90, 112, 80], tone, .5); ctx.beginPath(); ctx.ellipse(lx - size * .2, ly - size * .2, size * .5, size * .2, la, 0, TAU); ctx.fill();
        if (rnd() < .25) { ctx.fillStyle = 'rgba(230,220,230,.8)'; ctx.beginPath(); ctx.arc(lx + size * .3, ly, Math.max(.7, size * .1), 0, TAU); ctx.fill(); }
      }
    }
    const tip = [end[0], end[1]];
    ctx.fillStyle = shade([50, 80, 44]); ctx.beginPath(); ctx.ellipse(tip[0], tip[1], .045 * k, .028 * k, a, 0, TAU); ctx.fill();
  }
}

function ridges(ctx, rnd) {
  const tips = [];
  for (let zi = 60; zi >= 0; zi--) {
    const z = .9 + (zi / 60) ** 1.7 * 80;
    for (let r = -12; r <= 12; r++) {
      const x = r * ROW, a = P([x - .16, 0, z]), b = P([x + .16, 0, z]), top = P([x, .12, z]);
      // the soil ridge itself, wet and dark
      fill(ctx, [a, top, b, P([x + .2, -.08, z]), P([x - .2, -.08, z])], shade([58, 46, 38], (rnd() - .5) * 10));
      if (rnd() < .82) {
        const p = [x + (rnd() - .5) * .08, .1, z + (rnd() - .5) * .4];
        plant(ctx, rnd, p, .9 + rnd() * .3);
        if (z < 6 && rnd() < .5) tips.push(P([p[0] + (rnd() - .5) * .3, .32, p[2]]));
      }
    }
  }
  return tips;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(99011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  furrows(ctx);
  const tips = ridges(ctx, rnd);
  paint.applyTexture(ctx, make, 9901, .36, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.8, .78, .84], lights: [paint.LIGHT.dawn(HORIZON, .18, 960, 1200)] })(ctx);
  // a handful of drops, each falling from its leaf tip at its own time in the loop, then a ring below
  const drops = tips.slice(0, 14).map(t => ({ t, offset: rnd(), fall: 30 + rnd() * 40 }));
  const mist = make(W * 2, 160), mc = mist.getContext('2d');
  for (let i = 0; i < 30; i++) { const x = rnd() * W * 2; for (const dx of [0, -W * 2, W * 2]) glow(mc, x + dx, 80, 260 + rnd() * 300, 20 + rnd() * 20, '210,196,200', .14); }

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    const mx = (phase * W * 2) % (W * 2);
    target.drawImage(mist, -mx, HORIZON - 70); target.drawImage(mist, W * 2 - mx, HORIZON - 70);
    for (const d of drops) {
      const age = (phase + d.offset) % 1;
      if (age < .5) {                             // the bead swells at the tip
        target.fillStyle = `rgba(230,224,232,${.4 + age})`; target.beginPath(); target.arc(d.t[0], d.t[1], 1 + age * 3, 0, TAU); target.fill();
      } else if (age < .56) {                     // it falls
        const f = (age - .5) / .06;
        target.fillStyle = 'rgba(230,224,232,.8)'; target.fillRect(d.t[0] - 1, d.t[1] + f * d.fall, 2, 5);
      } else {                                    // and rings the water
        const r = (age - .56) / .44;
        target.strokeStyle = `rgba(220,210,220,${.5 * (1 - r)})`; target.lineWidth = 1;
        target.beginPath(); target.ellipse(d.t[0], d.t[1] + d.fall, 3 + r * 26, 1 + r * 6, 0, 0, TAU); target.stroke();
      }
    }
  };
}

module.exports = {
  title: '비가 그친 감자밭',
  slug: 'the-potato-field-after-a-shower',
  sound: 'drips',
  createScene,
};
