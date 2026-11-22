'use strict';

// 79 · 지하철 입구에 남은 형광등
// The top of a subway entrance at night, after the last train. We stand on the wet pavement looking down
// the stairs: two walls of small white tiles go down at an angle under a low concrete canopy, a handrail
// running down each side; fluorescent tubes on the ceiling throw a cold blue-white light, and one of them
// flickers. At the bottom, a turnstile and a closed grille. The street at the top is dark and rain-wet; a
// green entrance sign glows at the canopy's edge; water drips from the canopy lip into a puddle.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: 0, y: 1.7, z: 0, yaw: 0, pitch: .32, focal: 900, cx: 960, cy: 500 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HALF = 1.3, STEP_H = .17, STEP_D = .3, STEPS = 22, MOUTH = 2.2;
const stepY = z => -Math.max(0, Math.floor((z - MOUTH) / STEP_D) + 1) * STEP_H;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }

function stairs(ctx, rnd) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(0, 0, W, H);
  // the stair well: walls go down from the pavement, ceiling follows the stair's slope
  const bottomZ = MOUTH + STEPS * STEP_D, bottomY = -STEPS * STEP_H;
  const ceil = z => z < MOUTH + .4 ? 2.6 : 2.6 + (z - MOUTH - .4) * -STEP_H / STEP_D;
  for (const s of [-1, 1]) {
    const wall = (u, v) => { const z = lerp(MOUTH, bottomZ + 1, u); return P([s * HALF, lerp(ceil(z), z < MOUTH ? 0 : -(z - MOUTH) * STEP_H / STEP_D - .2, v), z]); };
    fill(ctx, paint.outline(wall, 8), '#9aa6ac');
    // tiles: a grid of small glazed squares, slightly uneven
    const rows = 40, cols = 70;
    for (let c = 0; c < cols; c++) { const a = wall(c / cols, 0), b = wall(c / cols, 1); ctx.strokeStyle = 'rgba(60,70,80,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    for (let r = 0; r < rows; r++) { ctx.beginPath(); for (let c = 0; c <= 10; c++) { const p = wall(c / 10, r / rows); c ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke(); }
    // a coloured band at shoulder height, and grime along the bottom
    const band = []; for (let c = 0; c <= 10; c++) band.push(wall(c / 10, .32)); for (let c = 10; c >= 0; c--) band.push(wall(c / 10, .36));
    fill(ctx, band, '#2a6a5a');
    for (let i = 0; i < 40; i++) { const p = wall(rnd(), .8 + rnd() * .2); glow(ctx, p[0], p[1], 30 + rnd() * 50, 10 + rnd() * 20, '30,30,26', .2); }
    // handrail on brackets
    const rail = []; for (let i = 0; i <= 20; i++) { const z = lerp(MOUTH - .3, bottomZ, i / 20); rail.push(P([s * (HALF - .08), (z < MOUTH ? 0 : -(z - MOUTH) * STEP_H / STEP_D) + .9, z])); }
    ctx.strokeStyle = '#8a9298'; ctx.lineWidth = 5; ctx.beginPath(); rail.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); rail.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] - 2) : ctx.moveTo(p[0], p[1] - 2))); ctx.stroke();
  }
  // the ceiling, low concrete with tube fittings
  const roof = (u, v) => { const z = lerp(MOUTH, bottomZ + 1, v); return P([lerp(-HALF, HALF, u), ceil(z), z]); };
  fill(ctx, paint.outline(roof, 8), '#8a9096');
  // the far end: the turnstile hall's glow and a closed grille
  const end = (u, v) => P([lerp(-HALF, HALF, u), lerp(bottomY + 2.4, bottomY, v), bottomZ + 1]);
  fill(ctx, paint.outline(end, 4), '#8a9898');
  for (let i = 0; i <= 24; i++) { const a = end(i / 24, 0), b = end(i / 24, 1); ctx.strokeStyle = '#3a4248'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  for (let j = 0; j <= 6; j++) { const a = end(0, j / 6), b = end(1, j / 6); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // steps, from the bottom up so nearer ones overlap: a tread and a riser each, nosing catching light
  for (let i = STEPS - 1; i >= 0; i--) {
    const z0 = MOUTH + i * STEP_D, y = -(i + 1) * STEP_H;
    const tread = [P([-HALF, y, z0]), P([HALF, y, z0]), P([HALF, y, z0 + STEP_D]), P([-HALF, y, z0 + STEP_D])];
    const riser = [P([-HALF, y + STEP_H, z0]), P([HALF, y + STEP_H, z0]), P([HALF, y, z0]), P([-HALF, y, z0])];
    fill(ctx, tread, shade([96, 100, 104], (rnd() - .5) * 8));
    fill(ctx, riser, '#5a5e64');
    ctx.strokeStyle = '#c8b040'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...riser[0]); ctx.lineTo(...riser[1]); ctx.stroke();
    // wet patches on treads
    if (rnd() < .5) { const p = P([(rnd() - .5) * 2, y, z0 + .15]); glow(ctx, p[0], p[1], 40 + rnd() * 60, 6, '200,220,230', .2); }
  }
  // the street level around the mouth: wet paving, kerb, the canopy's sides
  for (const s of [-1, 1]) fill(ctx, [P([s * 6, 0, .6]), P([s * HALF, 0, .6]), P([s * HALF, 0, MOUTH + 1]), P([s * 6, 0, MOUTH + 1])], '#26282e');
  fill(ctx, [P([-6, 0, .6]), P([6, 0, .6]), P([6, 0, MOUTH]), P([-6, 0, MOUTH])], '#2a2c32');
  for (let z = .6; z < MOUTH + 1; z += .4) { ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...P([-6, 0, z])); ctx.lineTo(...P([6, 0, z])); ctx.stroke(); }
  // the canopy lip, a thick concrete edge across the top
  fill(ctx, [P([-HALF - .3, 2.9, MOUTH]), P([HALF + .3, 2.9, MOUTH]), P([HALF + .3, 2.55, MOUTH]), P([-HALF - .3, 2.55, MOUTH])], '#4a4e54');
  // the low parapet walls at the mouth with railings
  // iron railings round the opening instead of solid parapets: posts and a top rail, dark against the light
  for (const s of [-1, 1]) {
    ctx.strokeStyle = '#1c2026'; ctx.lineCap = 'round';
    for (let z = .8; z <= MOUTH + .6; z += .4) { const a = P([s * (HALF + .1), 0, z]), b = P([s * (HALF + .1), 1, z]); ctx.lineWidth = Math.max(2, 18 / z); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    const r0 = P([s * (HALF + .1), 1, .8]), r1 = P([s * (HALF + .1), 1, MOUTH + .6]); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(...r0); ctx.lineTo(...r1); ctx.stroke();
    ctx.strokeStyle = 'rgba(180,200,220,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r0[0], r0[1] - 3); ctx.lineTo(r1[0], r1[1] - 3); ctx.stroke();
  }
  return { bottomZ, bottomY, ceil };
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(79011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const s = stairs(ctx, rnd);
  paint.applyTexture(ctx, make, 7901, .3, 0, 0, W, H, true);
  // tubes along the ceiling's centre line
  const tubes = []; for (let i = 0; i < 6; i++) { const z = MOUTH + .8 + i * 1.1, y = s.ceil(z) - .03; tubes.push([P([-.5, y, z]), P([.5, y, z])]); }
  paint.lighting(make, { ambient: [.38, .42, .52], lights: tubes.map(([a, b], i) => paint.LIGHT.lamp((a[0] + b[0]) / 2, a[1] + 120, .2 - i * .02, 300, 260, [.85, 1, 1.2])) })(ctx);
  const sign = P([HALF + .5, 2.75, MOUTH - .05]);
  const lip = Array.from({ length: 8 }, (_, i) => ({ x: lerp(-HALF, HALF, (i + .5) / 8), offset: rnd(), turns: 2 + Math.floor(rnd() * 3) }));
  const rain = paint.particles(rnd, 200, { kind: 'rain', near: .2, slant: .08, speed: 1 });

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    tubes.forEach(([a, b], i) => {
      // the third tube flickers: mostly on, with stutters at fixed points in the loop
      let on = 1;
      if (i === 2) { const f = (phase * 5 + .5) % 1; on = f < .06 ? .2 : f < .09 ? 1 : f < .12 ? .3 : 1; }
      target.strokeStyle = `rgba(230,244,255,${.6 + .4 * on})`; target.lineWidth = 6; target.beginPath(); target.moveTo(...a); target.lineTo(...b); target.stroke();
      glow(target, (a[0] + b[0]) / 2, a[1] + 10, 120, 36, '200,230,255', .14 * on);
      if (i === 2 && on < 1) { target.fillStyle = `rgba(0,0,10,${.12 * (1 - on)})`; target.fillRect(0, 0, W, H); }
    });
    // the green sign at the canopy corner
    target.fillStyle = '#1a5a3a'; target.fillRect(sign[0] - 50, sign[1] - 26, 100, 52); glow(target, sign[0], sign[1], 90, 50, '80,220,140', .35);
    target.fillStyle = 'rgba(230,255,240,.9)'; target.font = 'bold 28px sans-serif'; target.textAlign = 'center'; target.textBaseline = 'middle'; target.fillText('M', sign[0], sign[1]);
    // drips from the canopy lip into a puddle at the top step
    for (const d of lip) {
      const t = (phase * d.turns + d.offset) % 1, top = P([d.x, 2.55, MOUTH]), bot = P([d.x, 0, MOUTH - .1]);
      if (t < .4) { target.fillStyle = 'rgba(210,230,240,.7)'; target.beginPath(); target.arc(top[0], top[1] + 3, 2 + t * 5, 0, TAU); target.fill(); }
      else if (t < .6) { const y = lerp(top[1], bot[1], (t - .4) / .2); target.fillStyle = 'rgba(210,230,240,.8)'; target.fillRect(top[0] - 1.5, y, 3, 12); }
      else { const r = (t - .6) / .4; target.strokeStyle = `rgba(210,230,240,${.5 * (1 - r)})`; target.lineWidth = 1.2; target.beginPath(); target.ellipse(bot[0], bot[1], 4 + r * 30, 1 + r * 6, 0, 0, TAU); target.stroke(); }
    }
    target.save(); target.beginPath(); target.rect(0, 0, W, P([0, 2.6, MOUTH])[1]); target.clip(); rain.draw(target, phase, '180,190,210'); target.restore();
  };
}

module.exports = {
  title: '지하철 입구에 남은 형광등',
  slug: 'blue-light-down-the-stairs',
  sound: 'drips',
  createScene,
};
