'use strict';

// 57 · 별빛이 잠든 모래 분지
// From the rim of a great sand basin on a moonless night. The dunes fall away below us into a wide round
// hollow whose floor is a dry lake: a flat pale crust of salt and clay broken into polygons. A single
// acacia stands on the floor, umbrella-shaped and black. Around the bowl the dunes rise again in soft
// rounded shoulders. Above, the Milky Way arcs across the whole sky, its dust lanes dark, its core low in
// the south. Starlight is enough to tell sand from salt. A satellite slides across; the stars barely move.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, v3, noise } = paint;

const cam = camera({ x: 0, y: 34, z: 0, yaw: 0, pitch: .2, focal: 1050, cx: 960, cy: 480 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 34, 1e6])[1];
const BASIN = [10, 260], SKY = v3.unit([-.8, .55, .25]);

function height(x, z) {
  const r = Math.hypot(x - BASIN[0], z - BASIN[1]);
  const bowl = -30 * Math.exp(-((r / 170) ** 2));
  const dunes = (4 + 3 * Math.min(1, r / 200)) * (Math.sin(x / 23 + z / 41 + 2 * noise(x / 90, z / 90, 4)) * .5 + .5) ** 2 * Math.min(1, r / 120);
  const h = bowl + dunes + 3 * noise(x / 50, z / 50, 7);
  return Math.max(-19, h);                                        // the dry lake floor
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(57011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#03050c'); sky.addColorStop(1, '#141c2c');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // the Milky Way: a broad soft band from lower left to upper right, mottled, with dark rifts
  const band = (t, off) => [lerp(-200, W + 200, t), lerp(HORIZON + 20, -120, t) + off];
  for (let i = 0; i < 260; i++) { const t = rnd(), off = (rnd() - .5) * 260 * (1 - Math.abs(t - .3)); const [x, y] = band(t, off); glow(ctx, x, y, 60 + rnd() * 140, 30 + rnd() * 60, rnd() < .7 ? '170,180,210' : '220,200,180', .05); }
  for (let i = 0; i < 2500; i++) { const t = rnd(), off = (rnd() - .5) * 200; const [x, y] = band(t, off); if (y > HORIZON) continue; ctx.fillStyle = `rgba(230,234,250,${.2 + rnd() * .5})`; ctx.fillRect(x, y, 1, 1); }
  for (let i = 0; i < 40; i++) { const t = .1 + rnd() * .8, off = (rnd() - .5) * 60; const [x, y] = band(t, off); glow(ctx, x, y, 40 + rnd() * 90, 8 + rnd() * 16, '3,5,12', .35); }
  paint.starfield(ctx, rnd, 700, HORIZON);
  // the basin
  paint.terrain(ctx, cam, height, { z0: 20, z1: 1600, cols: 240, rows: 240, bias: 2.2, fan: 1.05, cx: 0 }, (p, n) => {
    const fog = Math.min(1, p[2] / 1600);
    if (p[1] < -18.9) {                                               // salt crust: pale, cracked into polygons
      return shade([118, 128, 150].map((c, i) => lerp(c, [40, 48, 70][i], fog * .6)), (noise(p[0] / 30, p[2] / 30, 11) - .5) * 10);
    }
    const lit = Math.min(1, Math.max(0, (n[0] * SKY[0] + n[1] * SKY[1] + n[2] * SKY[2] - SKY[1] * .55) * 2.4 + .08));
    const base = [lerp(12, 92, lit ** 1.3), lerp(14, 96, lit ** 1.3), lerp(30, 128, lit ** 1.3)];
    return shade(base.map((c, i) => lerp(c, [24, 30, 44][i], fog * .85)), 0);
  });
  // the lake's outline traced smoothly: along rays from the basin centre, find where the floor ends
  const rim = [];
  for (let i = 0; i < 90; i++) { const ang = i / 90 * TAU; let r = 0; while (r < 300 && height(BASIN[0] + Math.cos(ang) * r, BASIN[1] + Math.sin(ang) * r) <= -18.9) r += 1; rim.push(P([BASIN[0] + Math.cos(ang) * r, -19, BASIN[1] + Math.sin(ang) * r])); }
  ctx.beginPath(); rim.forEach((p2, i) => { const n2 = rim[(i + 1) % rim.length], m = [(p2[0] + n2[0]) / 2, (p2[1] + n2[1]) / 2]; i ? ctx.quadraticCurveTo(p2[0], p2[1], ...m) : ctx.moveTo(...m); }); ctx.closePath();
  const lg = ctx.createLinearGradient(0, Math.min(...rim.map(p2 => p2[1])), 0, Math.max(...rim.map(p2 => p2[1]))); lg.addColorStop(0, '#5a6278'); lg.addColorStop(1, '#8a92a8');
  ctx.fillStyle = lg; ctx.fill();
  ctx.strokeStyle = 'rgba(30,34,50,.6)'; ctx.lineWidth = 2; ctx.stroke();
  // cracks in the salt crust: short jagged lines across the lake floor
  for (let i = 0; i < 160; i++) { const a0 = rnd() * TAU, r0 = Math.sqrt(rnd()) * 100, x = BASIN[0] + Math.cos(a0) * r0, z = BASIN[1] + Math.sin(a0) * r0; if (height(x, z) > -18.9) continue; const pts = [P([x, -19, z])]; let ang = rnd() * TAU; for (let s2 = 0; s2 < 4; s2++) { ang += (rnd() - .5) * 1.2; const q = [x + Math.cos(ang) * (s2 + 1) * 2.5, -19, z + Math.sin(ang) * (s2 + 1) * 2.5]; pts.push(P(q)); } ctx.strokeStyle = 'rgba(14,16,24,.55)'; ctx.lineWidth = 1; ctx.beginPath(); pts.forEach((p2, j) => (j ? ctx.lineTo(...p2) : ctx.moveTo(...p2))); ctx.stroke(); }
  // the acacia on the lake floor: a trunk forking into a flat dark crown
  const t = [BASIN[0] - 30, -19, BASIN[1] - 20], tb = P(t), k = cam.focal / cam.project(t)[2];
  ctx.strokeStyle = '#06070c'; ctx.lineCap = 'round';
  ctx.lineWidth = .5 * k; ctx.beginPath(); ctx.moveTo(...tb); ctx.lineTo(tb[0], tb[1] - 2.5 * k); ctx.stroke();
  for (const dx of [-1.8, -.6, .9, 2]) { ctx.lineWidth = .25 * k; ctx.beginPath(); ctx.moveTo(tb[0], tb[1] - 2.5 * k); ctx.quadraticCurveTo(tb[0] + dx * .4 * k, tb[1] - 3.6 * k, tb[0] + dx * k, tb[1] - 4.4 * k); ctx.stroke(); }
  ctx.fillStyle = '#06070c'; ctx.beginPath(); ctx.ellipse(tb[0], tb[1] - 4.6 * k, 3.4 * k, .7 * k, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.ellipse(tb[0] + (rnd() - .5) * 6 * k, tb[1] - (4.6 + (rnd() - .3) * .6) * k, .6 * k, .3 * k, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(tb[0] + .5 * k, tb[1] + .1 * k, 3.6 * k, .6 * k, 0, 0, TAU); ctx.fill();
  paint.applyTexture(ctx, make, 5701, .36, 0, 0, W, H, true);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // a satellite crossing once per loop, high and steady
    const sx = lerp(-40, W + 40, phase), sy = 90 + phase * 160;
    glow(target, sx, sy, 3, 3, '240,244,255', .9 * Math.min(1, Math.sin(Math.PI * phase) * 4));
    // twinkle along the band
    for (let i = 0; i < 24; i++) { const x = (i * 811 + 300) % W, y = ((i * 337) % Math.max(1, HORIZON - 60)); glow(target, x, y, 3, 3, '235,240,255', .25 + .25 * Math.sin(TAU * (phase * (2 + i % 3) + i * .21))); }
    // a breath of sand drifting over the near rim
    for (let i = 0; i < 6; i++) { const t = (phase * 2 + i / 6) % 1; glow(target, lerp(-100, W + 100, t), H - 120 - Math.sin(i) * 60, 200, 14, '90,96,120', .12 * Math.sin(Math.PI * t)); }
  };
}

module.exports = {
  title: '별빛이 잠든 모래 분지',
  slug: 'starlit-sand-basin',
  sound: 'sand',
  createScene,
};
