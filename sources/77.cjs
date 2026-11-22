'use strict';

// 77 · 돌다리 아치 아래의 물결
// Standing on a stony bank beneath an old stone bridge at first light. The arch fills the frame: its
// voussoirs radiating around the curve, the underside dark and dripping, moss and ferns in the joints, a
// tide line of pale lime. Through the arch the river runs on toward a misty bend with willows, catching the
// pale sky. The water under the arch is dark and glassy; the arch and its reflection make a near-complete
// ring that wavers as the current pulls at it. Lights on the bridge above throw a gleam on the water.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: .4, y: 1.3, z: 0, yaw: -.04, pitch: -.04, focal: 900, cx: 960, cy: 520 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const M = paint.mirrorOf(cam, 0);
const ARCH = { z: 5.5, depth: 5, span: 7.4, spring: .5, rise: 4.6 };
const WATER = cam.project([0, 0, 1e5])[1];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}
// A point on the arch's intrados: t from 0 (left springing) to 1 (right), at depth z.
const archAt = (t, z, out = 0) => { const a = Math.PI * (1 - t); return [Math.cos(a) * (ARCH.span / 2 + out), ARCH.spring + Math.sin(a) * (ARCH.rise + out), z]; };

// Everything visible through the arch: sky, far banks, willows, the river.
function beyond(ctx, rnd, project) {
  const horizon = project([0, 0, 1e5])[1];
  ctx.fillStyle = vertical(ctx, horizon - 500, horizon, [[0, '#5a6a88'], [.7, '#a8a8b8'], [1, '#d0c4c0']]); ctx.fillRect(0, horizon - 900, W, 900);
  for (const [x0, z, h, tone] of [[-30, 60, 6, [80, 90, 96]], [8, 45, 8, [60, 72, 70]], [-14, 30, 7, [44, 56, 52]]]) {
    const pts = [project([x0 - 40, 0, z])]; for (let i = 0; i <= 30; i++) { const x = x0 - 40 + i * 3; pts.push(project([x, h * (.6 + .4 * paint.noise(i * .3, z, 3)), z])); } pts.push(project([x0 + 60, 0, z]));
    fill(ctx, pts, shade(tone));
  }
  // willows on the right bank: drooping curtains of strokes
  for (const [x, z] of [[6, 26], [9, 34], [-8, 22]]) {
    const top = project([x, 7, z]), k = cam.focal / z;
    for (let i = 0; i < 70; i++) { const a = (rnd() - .5) * 2.6, sx = top[0] + Math.sin(a) * 2.6 * k, sy = top[1] + (1 - Math.cos(a)) * 1.2 * k; ctx.strokeStyle = shade([70, 90, 70], (rnd() - .5) * 20, .6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + 4, sy + 2 * k, sx + (rnd() - .5) * 10, sy + (4 + rnd() * 2) * k); ctx.stroke(); }
  }
  glow(ctx, W / 2, horizon, 600, 60, '230,220,220', .35);
}

function bridge(ctx, rnd) {
  // the face of the bridge: masonry around the arch, the parapet above with lamp posts
  const face = (u, v) => P([lerp(-14, 14, u), lerp(7.6, -.2, v), ARCH.z]);
  const opening = (z) => { const pts = [P([-ARCH.span / 2, -.2, z])]; for (let i = 0; i <= 30; i++) pts.push(P(archAt(i / 30, z))); pts.push(P([ARCH.span / 2, -.2, z])); return pts; };
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); const op = opening(ARCH.z); op.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath(); ctx.clip('evenodd');
  paint.masonry(ctx, face, rnd, { courses: 30, length: [.014, .026], base: [88, 86, 82], vary: 20, mortar: [58, 56, 56] });
  fill(ctx, paint.outline(face, 4), 'rgba(18,22,36,.45)');
  ctx.restore();
  // cut out the arch opening (draw the underside barrel over it)
  const barrel = [];
  for (let i = 0; i <= 30; i++) barrel.push(P(archAt(i / 30, ARCH.z)));
  // the barrel vault going back: rings of stones toward the far face
  for (let r = 10; r >= 0; r--) {
    const z0 = ARCH.z + ARCH.depth * r / 10, z1 = ARCH.z + ARCH.depth * (r + 1) / 10;
    for (let i = 0; i < 30; i++) {
      const q = [P(archAt(i / 30, z0)), P(archAt((i + 1) / 30, z0)), P(archAt((i + 1) / 30, z1)), P(archAt(i / 30, z1))];
      const light = .3 + .15 * (i / 30);
      fill(ctx, q, shade([62, 62, 64].map(c => c * (.5 + light)), (rnd() - .5) * 14));
      ctx.strokeStyle = 'rgba(10,10,14,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...q[0]); ctx.lineTo(...q[3]); ctx.stroke();
    }
  }
  for (const side of [-1, 1]) fill(ctx, [P([side * ARCH.span / 2, -.2, ARCH.z]), P([side * ARCH.span / 2, ARCH.spring, ARCH.z]), P([side * ARCH.span / 2, ARCH.spring, ARCH.z + ARCH.depth]), P([side * ARCH.span / 2, -.2, ARCH.z + ARCH.depth])], '#2e3034');
  // the voussoirs on the face: wedge stones radiating round the arch
  for (let i = 0; i < 23; i++) {
    const t0 = i / 23, t1 = (i + 1) / 23, out = .55 + (i % 2) * .15;
    const q = [P(archAt(t0 + .004, ARCH.z - .01)), P(archAt(t1 - .004, ARCH.z - .01)), P(archAt(t1 - .004, ARCH.z - .01, out)), P(archAt(t0 + .004, ARCH.z - .01, out))];
    fill(ctx, q, shade([118, 112, 102], (rnd() - .5) * 24));
    ctx.strokeStyle = 'rgba(255,250,230,.12)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...q[3]); ctx.lineTo(...q[2]); ctx.stroke();
  }
  // lime streaks and moss down the face from the joints
  for (let i = 0; i < 40; i++) { const u = rnd(), a = face(u, rnd() * .5), len = 20 + rnd() * 120; ctx.strokeStyle = rnd() < .6 ? `rgba(220,220,210,${.08 + rnd() * .1})` : `rgba(60,90,50,${.2 + rnd() * .2})`; ctx.lineWidth = 2 + rnd() * 5; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(a[0] + (rnd() - .5) * 6, a[1] + len); ctx.stroke(); }
  // ferns tucked in the joints near the springing
  for (const t of [.02, .96]) { const b = P(archAt(t, ARCH.z - .05, .3)); for (let f = 0; f < 7; f++) { const a = -Math.PI / 2 + (f - 3) * .35; ctx.strokeStyle = '#3a5a32'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...b); ctx.quadraticCurveTo(b[0] + Math.cos(a) * 30, b[1] + Math.sin(a) * 30, b[0] + Math.cos(a + .4) * 60, b[1] + Math.sin(a + .4) * 50); ctx.stroke(); } }
  // parapet and lamps on top
  fill(ctx, [P([-14, 7.6, ARCH.z - .1]), P([14, 7.6, ARCH.z - .1]), P([14, 8.6, ARCH.z - .1]), P([-14, 8.6, ARCH.z - .1])], '#4a4844');
  const lamps = [];
  for (const x of [-4.5, 4.5]) { const a = P([x, 8.6, ARCH.z]), b = P([x, 10.4, ARCH.z]); ctx.strokeStyle = '#18181c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); lamps.push(b); }
  return { barrel, lamps };
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(77011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.fillStyle = '#1a1e2a'; ctx.fillRect(0, 0, W, H);
  // the scene above the water, and its mirror below
  const above = make(W, H), ac = above.getContext('2d');
  beyond(ac, rnd, p => cam.project(p));
  const b = bridge(ac, paint.seeded(77012));
  const refl = make(W, H), rc = refl.getContext('2d');
  beyond(rc, paint.seeded(77013), p => { const s = M(p); return [s[0], s[1], 1]; });
  rc.save(); rc.translate(0, 2 * WATER); rc.scale(1, -1); rc.drawImage(above, 0, 0, W, WATER, 0, 0, W, WATER); rc.restore();
  rc.fillStyle = 'rgba(14,20,30,.45)'; rc.fillRect(0, WATER, W, H);
  ctx.drawImage(above, 0, 0, W, WATER, 0, 0, W, WATER);
  // our bank: wet stones and pebbles in the lower left foreground
  const bank = make(W, H), bc = bank.getContext('2d');
  bc.fillStyle = '#22262a'; bc.beginPath(); bc.moveTo(0, H); bc.lineTo(0, 760); bc.bezierCurveTo(300, 780, 480, 900, 620, H); bc.fill();
  for (let i = 0; i < 70; i++) { const x = rnd() * 560, y = 800 + rnd() * 300; if (y < 760 + x * .4) continue; const r = 10 + rnd() * 40; bc.fillStyle = shade([70, 72, 76], (rnd() - .5) * 30); bc.beginPath(); bc.ellipse(x, y, r * 1.3, r * .7, (rnd() - .5) * .5, 0, TAU); bc.fill(); bc.fillStyle = 'rgba(255,255,255,.08)'; bc.beginPath(); bc.ellipse(x - r * .3, y - r * .3, r * .5, r * .15, 0, 0, TAU); bc.fill(); }
  paint.applyTexture(ctx, make, 7701, .32, 0, 0, W, H, true);
  const light = paint.lighting(make, { skyline: WATER, ambient: [.6, .64, .78], lights: b.lamps.map(l => paint.LIGHT.lamp(l[0], l[1] + 60, .3, 260, 200, [1.3, 1, .7])) });
  light(ctx);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    paint.ripple(target, refl, WATER, phase, { bands: 3, amp: 1.2, speed: 2 });
    // current lines sliding through the arch toward us
    for (let i = 0; i < 26; i++) { const t = (phase * 2 + i / 26) % 1, y = lerp(WATER + 4, H, t * t), x = 960 + Math.sin(i * 2.3) * lerp(120, 900, t * t); target.strokeStyle = `rgba(200,210,225,${.12 * Math.sin(Math.PI * t)})`; target.lineWidth = 1 + t * 2; target.beginPath(); target.moveTo(x - 20 - t * 80, y); target.lineTo(x + 20 + t * 80, y); target.stroke(); }
    for (const l of b.lamps) { glow(target, l[0], l[1], 18, 18, '255,210,150', .9); const ry = 2 * WATER - l[1]; glow(target, l[0] + Math.sin(TAU * phase * 3) * 6, ry, 10, 40, '255,200,140', .35); }
    target.drawImage(bank, 0, 0);
  };
}

module.exports = {
  title: '돌다리 아치 아래의 물결',
  slug: 'beneath-the-stone-arch',
  sound: 'lake',
  createScene,
};
