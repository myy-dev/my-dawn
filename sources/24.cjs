'use strict';

// 24 · 복도 끝의 둥근 색유리 창
// A long, high corridor in an old stone building. At the far end, above a pair of doors, a round rose
// window of stained glass: a ring of petals in deep blue, ruby and amber around a gold centre, held in
// tracery. The first light outside sets it glowing, and its colours fall down the corridor as long
// coloured shapes over the worn flagstones and up the panelled walls. Dust hangs in the air; the colours
// strengthen and fade a little as clouds pass the sun.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: 0, y: 1.6, z: 0, yaw: 0, pitch: -.1, focal: 1250, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HALF = 1.7, TOP = 5.4, END = 15, ROSE = { y: 3.8, r: 1.05 };
const SUN = paint.v3.unit([0, -.32, -1]);

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }

function corridor(ctx, rnd) {
  ctx.fillStyle = '#0e0c10'; ctx.fillRect(0, 0, W, H);
  // flagstones: irregular rectangles receding
  let z = 1;
  while (z < END) {
    const d = .5 + rnd() * .4;
    let x = -HALF;
    while (x < HALF) {
      const w = .5 + rnd() * .5, x1 = Math.min(HALF, x + w);
      fill(ctx, [P([x + .015, 0, z + .015]), P([x1 - .015, 0, z + .015]), P([x1 - .015, 0, z + d - .015]), P([x + .015, 0, z + d - .015])], shade([66, 62, 60], (rnd() - .5) * 18 - z * .6));
      x = x1;
    }
    z += d;
  }
  // walls: dark oak panelling to 1.4 m, then pale plaster to a vaulted ceiling
  for (const s of [-1, 1]) {
    fill(ctx, [P([s * HALF, 0, 1]), P([s * HALF, 0, END]), P([s * HALF, 1.4, END]), P([s * HALF, 1.4, 1])], '#2a1c14');
    for (let pz = 1; pz < END; pz += 1.2) {
      fill(ctx, [P([s * HALF, .15, pz + .12]), P([s * HALF, .15, pz + 1.08]), P([s * HALF, 1.25, pz + 1.08]), P([s * HALF, 1.25, pz + .12])], '#3a281c');
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2; pathOf(ctx, [P([s * HALF, .15, pz + .12]), P([s * HALF, .15, pz + 1.08]), P([s * HALF, 1.25, pz + 1.08]), P([s * HALF, 1.25, pz + .12])]); ctx.stroke();
    }
    fill(ctx, [P([s * HALF, 1.4, 1]), P([s * HALF, 1.4, END]), P([s * HALF, TOP, END]), P([s * HALF, TOP, 1])], '#3e3630');
    for (let i = 0; i < 300; i++) { const p = P([s * HALF, lerp(1.5, TOP, rnd()), lerp(1, END, rnd())]); ctx.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '255,240,220'},.05)`; ctx.fillRect(p[0], p[1], 10 + rnd() * 20, 3 + rnd() * 6); }
    // pilasters and the transverse arches every 3 m
    for (let pz = 2.5; pz < END; pz += 3) {
      fill(ctx, [P([s * HALF, 0, pz]), P([s * HALF, 0, pz + .3]), P([s * HALF, TOP - .6, pz + .3]), P([s * HALF, TOP - .6, pz])], '#2e2824');
    }
  }
  for (let pz = 2.5; pz < END; pz += 3) {
    ctx.strokeStyle = '#3a3430'; ctx.lineWidth = cam.focal / pz * .25;
    ctx.beginPath(); for (let a = 0; a <= 20; a++) { const t = a / 20 * Math.PI, p = P([-Math.cos(t) * HALF, TOP - .6 + Math.sin(t) * .6, pz + .15]); a ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke();
  }
  fill(ctx, [P([-HALF, TOP, 1]), P([HALF, TOP, 1]), P([HALF, TOP, END]), P([-HALF, TOP, END])], '#16120f');
  // end wall with the doors
  fill(ctx, [P([-HALF, 0, END]), P([HALF, 0, END]), P([HALF, TOP, END]), P([-HALF, TOP, END])], '#3a322c');
  fill(ctx, [P([-.7, 0, END]), P([.7, 0, END]), P([.7, 2.4, END]), P([-.7, 2.4, END])], '#2a1a12');
  ctx.strokeStyle = '#1a100a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...P([0, 0, END])); ctx.lineTo(...P([0, 2.4, END])); ctx.stroke();
  ctx.beginPath(); for (let a = 0; a <= 16; a++) { const t = a / 16 * Math.PI, p = P([-Math.cos(t) * .7, 2.4 + Math.sin(t) * .35, END]); a ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.fillStyle = '#2a1a12'; ctx.fill();
}

// The rose: 12 petals in two rings and a centre, drawn at its projected centre; returns its pieces.
function rose(ctx, k, c, light) {
  const R = ROSE.r * k;
  ctx.fillStyle = '#18141a'; ctx.beginPath(); ctx.arc(c[0], c[1], R * 1.08, 0, TAU); ctx.fill();
  const cols = ['40,70,170', '170,30,40', '220,150,40'];
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU;
    for (const [rr, sz, col] of [[.72, .24, cols[i % 2]], [.42, .17, cols[(i + 1) % 3]]]) {
      const x = c[0] + Math.cos(a) * R * rr, y = c[1] + Math.sin(a) * R * rr;
      ctx.fillStyle = `rgba(${col},${.75 + .25 * light})`; ctx.beginPath(); ctx.ellipse(x, y, R * sz, R * sz * .7, a, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#18141a'; ctx.lineWidth = Math.max(1.5, R * .03); ctx.stroke();
    }
  }
  ctx.fillStyle = `rgba(240,200,90,${.8 + .2 * light})`; ctx.beginPath(); ctx.arc(c[0], c[1], R * .2, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#18141a'; ctx.lineWidth = Math.max(2, R * .04); ctx.beginPath(); ctx.arc(c[0], c[1], R * .2, 0, TAU); ctx.stroke();
  glow(ctx, c[0], c[1], R * 1.6, R * 1.6, '240,190,140', .2 * light);
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(24011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  corridor(ctx, rnd);
  paint.applyTexture(ctx, make, 2401, .32, 0, 0, W, H, true);
  const c = P([0, ROSE.y, END]), k = cam.focal / cam.project([0, ROSE.y, END])[2];
  paint.lighting(make, { ambient: [.58, .56, .62], lights: [paint.LIGHT.lamp(c[0], c[1], .35, 600, 900, [1.1, .9, .8])] })(ctx);
  // each petal's colour lands on the floor along the sunlight, stretched toward us
  const pools = [];
  const cols = ['40,70,170', '170,30,40', '220,150,40'];
  for (let i = 0; i < 12; i++) for (const [rr, col] of [[.72, cols[i % 2]], [.42, cols[(i + 1) % 3]]]) {
    const a = i / 12 * TAU, p = [Math.cos(a) * ROSE.r * rr, ROSE.y - Math.sin(a) * ROSE.r * rr, END];
    const t = p[1] / -SUN[1], f = [p[0] + SUN[0] * t, 0, p[2] + SUN[2] * t];
    if (f[2] < 1.5) continue;
    pools.push({ at: P(f), col, len: cam.focal / f[2] * 1.2, w: cam.focal / f[2] * .28 });
  }
  const motes = Array.from({ length: 80 }, () => ({ x: lerp(-HALF, HALF, rnd()), y: lerp(.3, 4.5, rnd()), z: lerp(3, END - 1, rnd()), lag: rnd() * TAU, turns: 1 + Math.floor(rnd() * 2) }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    const light = .7 + .3 * Math.sin(TAU * phase) * Math.sin(TAU * phase * 2 + .5);
    target.drawImage(plate, 0, 0);
    rose(target, k, c, light);
    target.save(); target.globalCompositeOperation = 'lighter';
    for (const p of pools) { target.fillStyle = `rgba(${p.col},${.22 * light})`; target.beginPath(); target.ellipse(p.at[0], p.at[1], p.w, p.len * .2, 0, 0, TAU); target.fill(); }
    const beam = target.createLinearGradient(c[0], c[1], c[0], H);
    beam.addColorStop(0, `rgba(230,190,150,${.12 * light})`); beam.addColorStop(1, 'rgba(230,190,150,0)');
    target.fillStyle = beam; target.beginPath(); target.moveTo(c[0] - k * ROSE.r, c[1]); target.lineTo(c[0] + k * ROSE.r, c[1]); target.lineTo(1500, H); target.lineTo(420, H); target.fill();
    for (const m of motes) {
      const s = cam.project([m.x + Math.sin(TAU * phase * m.turns + m.lag) * .1, m.y + Math.cos(TAU * phase * m.turns + m.lag) * .06, m.z]);
      glow(target, s[0], s[1], 2, 2, '255,230,200', .35 * light);
    }
    target.restore();
  };
}

module.exports = {
  title: '복도 끝의 둥근 색유리 창',
  slug: 'rose-glass-at-hall-end',
  sound: 'room-wind',
  createScene,
};
