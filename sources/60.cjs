'use strict';

// 60 · 바람이 잠든 돌기둥 평원
// A badlands plain at the first grey-pink of dawn, perfectly still. Hundreds of hoodoos rise from the
// eroded floor: thin columns of banded soft rock, each wearing a harder flat cap stone, some tall and
// slender, some stubby, some leaning, some in clusters, some single. The light comes low from the left so
// every column has a lit side, a shadow side and a long shadow laid across the pale ground. The air is
// still; a faint haze lies in the hollows and slowly breathes; the last stars fade; a hawk circles.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, v3, noise, pathOf } = paint;

const cam = camera({ x: 0, y: 9, z: 0, yaw: .1, pitch: .1, focal: 1100, cx: 960, cy: 500 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(.1) * 1e6, 9, Math.cos(.1) * 1e6])[1];
const SUN = v3.unit([-1, .2, .25]);

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
const ground = (x, z) => 2.5 * noise(x / 40, z / 40, 3) + 1.2 * noise(x / 12, z / 12, 8) - 1.5;

// One hoodoo: a column of stacked, slightly wobbling drums tapering to a neck, then a flat cap.
function hoodoo(ctx, rnd, base, h, r, lean) {
  const k = cam.focal / cam.project(base)[2], b = P(base);
  // long shadow toward the right on the ground
  const tip = [base[0] - SUN[0] * h * 3.5, base[1], base[2] - SUN[2] * h * 3.5], tp = P(tip);
  ctx.fillStyle = 'rgba(40,30,50,.35)'; ctx.beginPath(); ctx.moveTo(b[0] - r * k, b[1]); ctx.lineTo(tp[0], tp[1] - r * .3 * k); ctx.lineTo(tp[0], tp[1] + r * .3 * k); ctx.lineTo(b[0] + r * k, b[1] + 2); ctx.fill();
  const drums = Math.max(4, Math.round(h * 1.4));
  for (let d = 0; d < drums; d++) {
    const t0 = d / drums, t1 = (d + 1) / drums, y0 = t0 * h, y1 = t1 * h;
    const rad = t => r * (1 - .45 * t ** 1.5) * (1 + .12 * Math.sin(t * 17 + base[0])) * (t > .85 ? .7 : 1);
    const cx = t => b[0] + lean * t * h * k, cy = y => b[1] - y * k;
    const band = [[100, 72, 68], [150, 104, 86], [180, 136, 110], [130, 90, 80]][(d + Math.floor(base[2])) % 4];
    const lit = ctx.createLinearGradient(cx(t0) - rad(t0) * k, 0, cx(t0) + rad(t0) * k, 0);
    lit.addColorStop(0, shade(band.map(c => c * 1.15), 0)); lit.addColorStop(.45, shade(band.map(c => c * .8), 0)); lit.addColorStop(1, shade(band.map(c => c * .42), 0));
    fill(ctx, [[cx(t0) - rad(t0) * k, cy(y0)], [cx(t0) + rad(t0) * k, cy(y0)], [cx(t1) + rad(t1) * k, cy(y1)], [cx(t1) - rad(t1) * k, cy(y1)]], lit);
    ctx.strokeStyle = 'rgba(30,20,24,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx(t1) - rad(t1) * k, cy(y1)); ctx.lineTo(cx(t1) + rad(t1) * k, cy(y1)); ctx.stroke();
  }
  // cap stone: a wider, darker, flat slab
  const cxTop = b[0] + lean * h * k, cyTop = b[1] - h * k, cr = r * (.9 + rnd() * .5) * k;
  fill(ctx, [[cxTop - cr, cyTop], [cxTop + cr, cyTop + .05 * k], [cxTop + cr * .9, cyTop - .45 * r * k], [cxTop - cr * .95, cyTop - .4 * r * k]], '#4a3a40');
  ctx.fillStyle = 'rgba(230,190,170,.35)'; ctx.fillRect(cxTop - cr, cyTop - .45 * r * k, cr * .8, 2);
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(60011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON); sky.addColorStop(0, '#2a3050'); sky.addColorStop(.7, '#9a8098'); sky.addColorStop(1, '#e0b0a0');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  glow(ctx, 0, HORIZON, 900, 200, '255,200,170', .4);
  paint.ridgeline(ctx, HORIZON, 30, [96, 84, 110], 601, [[300, 1], [60, .4]], HORIZON + 30);
  paint.terrain(ctx, cam, ground, { z0: 3, z1: 1200, cols: 160, rows: 160, bias: 2.2, fan: 1, cx: 0 }, (p, n) => {
    const lit = Math.max(0, n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2]), fog = Math.min(1, p[2] / 900);
    const c = [lerp(110, 196, lit), lerp(84, 150, lit), lerp(86, 132, lit)];
    return shade(c.map((v, i) => lerp(v, [196, 160, 170][i], fog * .8)), 0);
  });
  // the hoodoos, far to near
  const list = [];
  for (let i = 0; i < 160; i++) { const z = 14 + rnd() ** 1.6 * 500, x = (rnd() - .5) * z * 1.9; list.push([x, z]); }
  for (let c = 0; c < 6; c++) { const cx = (rnd() - .5) * 60, cz = 30 + rnd() * 80; for (let j = 0; j < 5; j++) list.push([cx + (rnd() - .5) * 6, cz + (rnd() - .5) * 6]); }
  list.sort((a, b) => b[1] - a[1]);
  for (const [x, z] of list) hoodoo(ctx, rnd, [x, ground(x, z), z], 3 + rnd() * 9, .5 + rnd() * .8, (rnd() - .5) * .06);
  paint.applyTexture(ctx, make, 6001, .34, 0, 0, W, H, true);
  const hazeBands = Array.from({ length: 8 }, () => ({ y: lerp(HORIZON + 20, HORIZON + 260, rnd()), x: rnd() * W, w: 300 + rnd() * 500, lag: rnd() }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const b of hazeBands) glow(target, b.x + Math.sin(TAU * (phase + b.lag)) * 40, b.y, b.w, 18, '230,200,210', .12 + .06 * Math.sin(TAU * (phase * 2 + b.lag)));
    // a hawk circling high over the plain, one circle per loop
    const a = TAU * phase, hx = 1300 + Math.cos(a) * 160, hy = 220 + Math.sin(a) * 50, wing = 9 + 2 * Math.sin(TAU * phase * 6);
    target.strokeStyle = 'rgba(40,30,40,.85)'; target.lineWidth = 2.4; target.beginPath(); target.moveTo(hx - wing * 1.6, hy - 2); target.quadraticCurveTo(hx - wing * .6, hy - wing * .5, hx, hy); target.quadraticCurveTo(hx + wing * .6, hy - wing * .5, hx + wing * 1.6, hy - 2); target.stroke();
  };
}

module.exports = {
  title: '바람이 잠든 돌기둥 평원',
  slug: 'silent-hoodoo-plain',
  sound: 'gust',
  createScene,
};
