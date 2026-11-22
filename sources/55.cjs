'use strict';

// 55 · 불 하나 켜진 숲속 정자
// A small hexagonal pavilion of the old style at the edge of a pond in the woods, before dawn. Six round
// red-brown pillars on stone footings hold a deep tiled roof whose eaves sweep up at the corners; a railing
// runs between the pillars and a single paper lantern hangs from the beam, lit. The pond in front holds its
// reflection and the lantern's light; pines and maples close in behind, dark, with mist low among them.
// Ripples cross the pond and the lantern sways slightly on its cord.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, v3 } = paint;
const { add } = v3;

const cam = camera({ x: 0, y: 1.4, z: 0, yaw: .02, pitch: .03, focal: 1150, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const M = p => P([p[0], -p[1], p[2]]);
const HORIZON = cam.project([0, 1.4, 1e6])[1];
const C = [1.2, .5, 16];                           // the pavilion's centre at floor level
const R = 2.6, PILLAR = 2.6;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function woods(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 40, [[0, '#0a1018'], [.7, '#1a2430'], [1, '#2a3440']]);
  ctx.fillRect(0, 0, W, HORIZON + 40);
  paint.starfield(ctx, rnd, 120, 360);
  // pines and maples behind, as masses of dark foliage clumps on trunks
  for (let i = 0; i < 70; i++) {
    const x = rnd() * W, base = HORIZON + 30 + rnd() * 30, h = 260 + rnd() * 300, w = 60 + rnd() * 90;
    ctx.strokeStyle = '#0c1210'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x + (rnd() - .5) * 20, base - h); ctx.stroke();
    for (let c = 0; c < 8; c++) glow(ctx, x + (rnd() - .5) * w, base - h * (.4 + rnd() * .6), w * (.4 + rnd() * .4), w * (.25 + rnd() * .3), rnd() < .2 ? '40,22,24' : '14,22,20', .9);
  }
  glow(ctx, W / 2, HORIZON + 30, 1200, 50, '60,70,84', .5);
}

// The pavilion, drawn through projector `Q` (the camera or its reflection in the pond).
function pavilion(ctx, rnd, Q) {
  const corner = i => { const a = i / 6 * TAU + .25; return [Math.cos(a) * R, Math.sin(a) * R]; };
  const pt = (i, y, out = 0) => { const [x, z] = corner(i); return add(C, [x * (1 + out), y, z * (1 + out)]); };
  // platform: a stone base with a timber edge
  fill(ctx, [0, 1, 2, 3, 4, 5].map(i => Q(pt(i, 0, .12))), '#3a3834');
  fill(ctx, [0, 1, 2].flatMap(i => [Q(pt(i, 0, .12))]).concat([2, 1, 0].map(i => Q(pt(i, -.5, .14)))), '#2a2826');
  // pillars on stone footings, round, lit from inside by the lantern
  const visible = [5, 0, 1, 2, 3, 4].filter(i => pt(i, 0)[2] < C[2] + R * .4);
  for (const i of [0, 1, 2, 3, 4, 5]) {
    const base = Q(pt(i, 0)), top = Q(pt(i, PILLAR)), w = Math.max(3, 260 / cam.project(pt(i, 0))[2]);
    const g = ctx.createLinearGradient(base[0] - w, 0, base[0] + w, 0);
    g.addColorStop(0, '#3a1a14'); g.addColorStop(.5, '#7a3a26'); g.addColorStop(1, '#2a120e');
    fill(ctx, [[base[0] - w, base[1]], [base[0] + w, base[1]], [top[0] + w * .9, top[1]], [top[0] - w * .9, top[1]]], g);
    fill(ctx, [[base[0] - w * 1.5, base[1]], [base[0] + w * 1.5, base[1]], [base[0] + w * 1.3, base[1] - w], [base[0] - w * 1.3, base[1] - w]], '#5a5850');
  }
  void visible;
  // railing between the front pillars
  for (const [a, b] of [[0, 1], [1, 2], [5, 0]]) {
    for (const h of [.5, .8]) { ctx.strokeStyle = '#4a2418'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...Q(pt(a, h))); ctx.lineTo(...Q(pt(b, h))); ctx.stroke(); }
    for (let k = 1; k < 6; k++) { const p = v3.lerp(pt(a, .5), pt(b, .5), k / 6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...Q(p)); ctx.lineTo(...Q(add(p, [0, .3, 0]))); ctx.stroke(); }
  }
  // beams, then the roof: six curved planes rising to a finial, eaves swept up at the corners
  for (let i = 0; i < 6; i++) { ctx.strokeStyle = '#3a1c14'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(...Q(pt(i, PILLAR))); ctx.lineTo(...Q(pt(i + 1, PILLAR))); ctx.stroke(); }
  const apex = add(C, [0, PILLAR + 2.1, 0]);
  // the eave runs nearly straight along each side and sweeps up only near the corners
  const eave = (i, t) => { const p = v3.lerp(pt(i, PILLAR + .25, .42), pt(i + 1, PILLAR + .25, .42), t), lift = .7 * (Math.abs(t - .5) * 2) ** 5; return add(p, [0, lift, 0]); };
  const order = [0, 1, 2, 3, 4, 5].sort((a, b) => pt(b, 0)[2] - pt(a, 0)[2]);
  for (const i of order) {
    const pts = [];
    for (let k = 0; k <= 12; k++) pts.push(Q(eave(i, k / 12)));
    const face = pts.concat([Q(apex)]);
    const lit = .3 + .4 * Math.max(0, -Math.sin((i + .5) / 6 * TAU + .25));
    fill(ctx, face, shade([30 + lit * 24, 32 + lit * 24, 38 + lit * 26]));
    // the eave's thickness and the rafter ends under it
    const under = pts.map(([x, y]) => [x, y + 9]);
    fill(ctx, pts.concat(under.slice().reverse()), '#1c1414');
    for (let k = 1; k < 12; k++) { const p = under[k]; ctx.fillStyle = '#5a2a1e'; ctx.fillRect(p[0] - 1.5, p[1] - 6, 3, 6); }
    // the hip ridge from this corner up to the finial, capped with round tiles
    ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.quadraticCurveTo((pts[0][0] + Q(apex)[0]) / 2, (pts[0][1] + Q(apex)[1]) / 2 + 12, ...Q(apex)); ctx.stroke();
    // tile rows: curves following the eave, closer together toward the top
    for (let r = 1; r < 7; r++) {
      const t = r / 7; ctx.strokeStyle = 'rgba(10,10,14,.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); pts.forEach((p, k) => { const a = Q(apex), x = lerp(p[0], a[0], t), y = lerp(p[1], a[1], t); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(200,190,170,.3)'; ctx.lineWidth = 2; ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  }
  const fin = Q(apex); ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(...fin); ctx.lineTo(fin[0], fin[1] - 26); ctx.stroke();
  return add(C, [0, PILLAR - .55, 0]);
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(55011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  woods(ctx, rnd);
  // the pond: dark, reflecting the woods and the pavilion
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#1a2228'], [1, '#06090c']]);
  ctx.fillRect(0, HORIZON + 30, W, H);
  const reflection = make(W, H), rc = reflection.getContext('2d');
  pavilion(rc, paint.seeded(5502), M);
  rc.globalCompositeOperation = 'source-atop'; rc.fillStyle = 'rgba(6,10,16,.5)'; rc.fillRect(0, 0, W, H);
  const lantern3 = pavilion(ctx, paint.seeded(5502), P);
  // the bank: grass and stones between pavilion and water
  for (let i = 0; i < 400; i++) { const x = rnd() * W, y = HORIZON + 26 + rnd() * 12, h = 6 + rnd() * 20; ctx.strokeStyle = 'rgba(20,30,24,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rnd() - .5) * 6, y - h); ctx.stroke(); }
  paint.applyTexture(ctx, make, 5501, .34, 0, 0, W, H, true);
  const L = P(lantern3), hook = P(add(lantern3, [0, .45, 0])), Lm = M(lantern3);
  paint.lighting(make, { skyline: HORIZON - 200, skyFade: 400, ambient: [.56, .6, .7], lights: [paint.LIGHT.lamp(L[0], L[1] + 40, .65, 380, 320), paint.LIGHT.lamp(Lm[0], Lm[1], .3, 200, 260)] })(ctx);
  const waterTop = HORIZON + 30;

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (let y = waterTop; y < H; y += 3) {
      const d = (y - waterTop) / (H - waterTop), off = Math.sin(TAU * (phase * 2 + y * .03)) * (1 + d * 7);
      target.drawImage(reflection, 0, y, W, 3, off, y, W, 3);
    }
    // the lantern's light on the water in broken bars
    for (let i = 0; i < 18; i++) {
      const y = Lm[1] - 60 + i * 9, x = Lm[0] + Math.sin(TAU * (phase * 3 + i * .4)) * (6 + i);
      target.fillStyle = `rgba(255,190,120,${.3 * (1 - i / 18)})`; target.fillRect(x - 14, y, 28, 2);
    }
    // the lantern: a paper globe on its cord, swaying
    const sw = .05 * Math.sin(TAU * phase * 2), lx = hook[0] + Math.sin(sw) * (L[1] - hook[1]), ly = hook[1] + Math.cos(sw) * (L[1] - hook[1]);
    target.strokeStyle = '#1a1210'; target.lineWidth = 1.5; target.beginPath(); target.moveTo(...hook); target.lineTo(lx, ly - 14); target.stroke();
    const g = target.createRadialGradient(lx, ly, 2, lx, ly, 18);
    g.addColorStop(0, '#fff0c0'); g.addColorStop(.7, '#ffb060'); g.addColorStop(1, '#c05a30');
    target.fillStyle = g; target.beginPath(); target.ellipse(lx, ly, 14, 18, sw, 0, TAU); target.fill();
    target.strokeStyle = 'rgba(120,50,20,.5)'; for (let r = -1; r <= 1; r++) { target.beginPath(); target.ellipse(lx, ly, 14 * Math.cos(r * .5), 18, sw, 0, TAU); target.stroke(); }
    const flicker = 1 + .08 * paint.loopNoise(phase, 2, 8);
    glow(target, lx, ly, 120, 110, '255,180,100', .35 * flicker);
  };
}

module.exports = {
  title: '불 하나 켜진 숲속 정자',
  slug: 'the-garden-pavilion-lamp',
  sound: 'forest',
  createScene,
};
