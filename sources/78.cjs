'use strict';

// 78 · 고가 철길 아래 비 내리는 길
// A street running beside a brick railway viaduct on a rainy night. The viaduct marches away on the right in
// a long row of round arches, each bay a different life: one bricked up with a small door, one a garage
// with a rolled shutter, one a tiny repair shop with a lit window, one open with stacked crates. Rain falls
// hard in the street and streams off the viaduct's edge in thin curtains. Wet cobbles throw back the lamps.
// Once a loop, a late train crosses above, its lit windows sliding along the parapet and flickering on the
// wet street, and then it's gone.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: -2, y: 1.6, z: 0, yaw: .3, pitch: -.04, focal: 950, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(.3) * 1e6, 1.6, Math.cos(.3) * 1e6])[1];
const FACE = 3, TOP = 7.2, BAY = 6, PIER = 1.2, SPRING = 3.2, RISE = 2.4;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}
// An arch opening in the viaduct face (x = FACE), bay i: z from i*BAY+PIER to (i+1)*BAY.
const bayOutline = (i, x = FACE) => {
  const z0 = 4 + i * BAY + PIER, z1 = 4 + (i + 1) * BAY, mid = (z0 + z1) / 2, half = (z1 - z0) / 2, pts = [P([x, 0, z0])];
  for (let a = 0; a <= 16; a++) { const t = Math.PI * (1 - a / 16); pts.push(P([x, SPRING + Math.sin(t) * RISE * Math.min(1, half / RISE), mid + Math.cos(t) * half])); }
  pts.push(P([x, 0, z1])); return pts;
};

function scene(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 40, [[0, '#0c0e16'], [1, '#2a2a36']]); ctx.fillRect(0, 0, W, H);
  glow(ctx, 600, HORIZON, 800, 200, '160,110,80', .2);
  // the left side: a low terrace of houses, set back, mostly dark
  for (let i = 0; i < 8; i++) {
    const z0 = 4 + i * 7, f = (u, v) => P([-6, lerp(6 + (i % 3) * .6 - .2 * Math.sin(Math.PI * u), 0, v), z0 + u * 6.8]);
    fill(ctx, paint.outline(f, 8), shade([40, 38, 44], (rnd() - .5) * 10 - i * 2));
    for (const u of [.2, .6]) for (const v of [.2, .55]) { const w = (uu, vv) => f(u + uu * .2, v + vv * .2); const on = rnd() < .15; fill(ctx, paint.outline(w, 2), on ? '#d89a58' : '#12141c'); if (on) glow(ctx, ...w(.5, .5), 30, 24, '255,180,110', .4); }
  }
  // the street: cobbles toward us, smoother tarmac in the middle
  const road = (u, v) => P([lerp(-6, FACE, u), 0, lerp(60, 1.5, v)]);
  fill(ctx, paint.outline(road, 8), vertical(ctx, HORIZON, H, [[0, '#2a2a30'], [1, '#141418']]));
  for (let z = 1.5; z < 30; z += .2) for (let x = -6; x < FACE; x += .25 + rnd() * .05) {
    if (rnd() < .5) continue; const p = P([x + (Math.floor(z * 5) % 2) * .12, 0, z]), k = cam.focal / cam.project([x, 0, z])[2];
    ctx.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '160,160,170'},.05)`; ctx.beginPath(); ctx.ellipse(p[0], p[1], .1 * k, .04 * k, 0, 0, TAU); ctx.fill();
  }
  // the viaduct face: brick, with the arches cut out
  const face = (u, v) => P([FACE, lerp(TOP, 0, v), lerp(2, 70, u)]);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); for (let i = 0; i < 10; i++) { const o = bayOutline(i); o.forEach((p, j) => (j ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath(); } ctx.clip('evenodd');
  paint.masonry(ctx, face, rnd, { courses: 46, length: [.006, .01], base: [92, 52, 40], vary: 18, mortar: [44, 36, 34] });
  fill(ctx, paint.outline(face, 8), 'rgba(12,14,28,.45)');
  ctx.restore();
  // the parapet: a darker coping and an iron rail
  fill(ctx, [P([FACE, TOP, 2]), P([FACE, TOP, 70]), P([FACE, TOP + .8, 70]), P([FACE, TOP + .8, 2])], '#3a2a24');
  ctx.strokeStyle = '#141418'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...P([FACE, TOP + 1.7, 2])); ctx.lineTo(...P([FACE, TOP + 1.7, 70])); ctx.stroke();
  for (let z = 2; z < 70; z += 1.2) { ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...P([FACE, TOP + .8, z])); ctx.lineTo(...P([FACE, TOP + 1.7, z])); ctx.stroke(); }
  // each bay
  const fills = ['bricked', 'shop', 'garage', 'open', 'bricked', 'garage', 'open', 'shop', 'garage', 'open'];
  const shops = [];
  for (let i = 0; i < 10; i++) {
    const o = bayOutline(i, FACE + .4);
    const kind = fills[i];
    if (kind === 'bricked') { paint.masonry(ctx, o, rnd, { courses: 18, length: [.04, .07], base: [80, 50, 42], vary: 14, mortar: [40, 34, 32] }); const d = [P([FACE + .38, 1.9, 4 + i * BAY + PIER + 1.6]), P([FACE + .38, 1.9, 4 + i * BAY + PIER + 2.5]), P([FACE + .38, 0, 4 + i * BAY + PIER + 2.5]), P([FACE + .38, 0, 4 + i * BAY + PIER + 1.6])]; fill(ctx, d, '#2a3a3a'); }
    else if (kind === 'garage') { fill(ctx, o, '#3a3c40'); const top = o[Math.floor(o.length / 2)][1]; for (let y = top; y < o[0][1]; y += 6) { ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(o[0][0], y); ctx.lineTo(o[o.length - 1][0], y); ctx.stroke(); } }
    else if (kind === 'open') { fill(ctx, o, '#0c0c10'); const c = P([FACE + 2, 0, 4 + i * BAY + PIER + 1]), k = cam.focal / cam.project([FACE + 2, 0, 4 + i * BAY + 3])[2]; for (let s = 0; s < 4; s++) fill(ctx, [[c[0], c[1] - s * .4 * k], [c[0] + .8 * k, c[1] - s * .4 * k], [c[0] + .8 * k, c[1] - (s + 1) * .4 * k + 2], [c[0], c[1] - (s + 1) * .4 * k + 2]], shade([90, 70, 44], s * 4 - 30)); }
    else { fill(ctx, o, '#2a2420'); const w = [P([FACE + .38, 2.6, 4 + i * BAY + PIER + .6]), P([FACE + .38, 2.6, 4 + i * BAY + PIER + 3]), P([FACE + .38, 1, 4 + i * BAY + PIER + 3]), P([FACE + .38, 1, 4 + i * BAY + PIER + .6])]; fill(ctx, w, '#f0b468'); shops.push(paint.v3 ? [(w[0][0] + w[1][0]) / 2, (w[0][1] + w[2][1]) / 2] : null); ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo((w[0][0] + w[1][0]) / 2, w[0][1]); ctx.lineTo((w[3][0] + w[2][0]) / 2, w[3][1]); ctx.stroke(); for (let t = 0; t < 5; t++) { ctx.fillStyle = 'rgba(40,30,20,.5)'; ctx.fillRect(lerp(w[0][0], w[1][0], .1 + t * .17), lerp(w[0][1], w[3][1], .55), 8, 30); } }
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2; pathOf(ctx, bayOutline(i)); ctx.stroke();
  }
  return shops;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(78011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const shops = scene(ctx, rnd);
  // lamps on the left pavement
  const lamps = [];
  for (const z of [8, 22, 40]) { const foot = P([-5, 0, z]), head = P([-4.4, 5, z]), k = cam.focal / cam.project([-4.4, 5, z])[2]; ctx.strokeStyle = '#141418'; ctx.lineWidth = .12 * k; ctx.beginPath(); ctx.moveTo(...foot); ctx.lineTo(foot[0], head[1]); ctx.lineTo(head[0], head[1]); ctx.stroke(); lamps.push(head); }
  paint.applyTexture(ctx, make, 7801, .36, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.48, .5, .62], lights: [...lamps.map((l, i) => paint.LIGHT.lamp(l[0], l[1] + 200 / (i + 1), .5 / (i + 1), 400 / (i + 1), 500 / (i + 1), [1.35, .95, .55])), ...shops.map(s => paint.LIGHT.lamp(s[0], s[1], .3, 200, 200, [1.3, 1, .6]))] })(ctx);
  const refl = make(W, H), rc = refl.getContext('2d');
  const roadTop = P([0, 0, 60])[1];
  for (const [x, y] of [...lamps, ...shops]) for (let i = 0; i < 16; i++) glow(rc, x, Math.max(roadTop, y + (H - y) * .4) + i * 14, 14, 16, '255,180,110', .12 * (1 - i / 16));
  const rain = paint.particles(rnd, 380, { kind: 'rain', near: .2, slant: .08, speed: 1.2 });
  const curtain = Array.from({ length: 60 }, () => ({ z: lerp(2, 50, rnd()), offset: rnd(), turns: 4 + Math.floor(rnd() * 3) }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.beginPath(); target.rect(0, roadTop, W, H - roadTop); target.clip(); target.globalCompositeOperation = 'lighter';
    paint.ripple(target, refl, roadTop, phase, { bands: 3, amp: .8, speed: 3 });
    target.restore();
    // the train: a run of lit windows along the parapet, crossing in the first part of the loop
    const t = phase / .45;
    if (t < 1) {
      const head = lerp(80, -60, t);
      for (let c = 0; c < 4; c++) for (let w = 0; w < 8; w++) {
        const z = head + c * 16 + w * 1.8; if (z < 2 || z > 70) continue;
        const a = P([FACE - .3, TOP + 2.2, z]), b = P([FACE - .3, TOP + 3, z + 1.2]);
        target.fillStyle = 'rgba(255,230,180,.85)'; target.fillRect(a[0], b[1], Math.max(2, b[0] - a[0]), a[1] - b[1]);
        glow(target, (a[0] + b[0]) / 2, a[1], 20, 10, '255,220,160', .25);
      }
      // the body silhouette above the parapet
      if (head < 70 && head + 64 > 2) { const n = P([FACE - .3, TOP + 3.6, Math.min(70, Math.max(2, head))]), f = P([FACE - .3, TOP + 1.7, Math.max(2, Math.min(70, head + 64))]);
      const z0 = Math.min(70, Math.max(2, head)), z1 = Math.max(2, Math.min(70, head + 64)); fill(target, [P([FACE - .3, TOP + 3.6, z0]), P([FACE - .3, TOP + 3.6, z1]), P([FACE - .3, TOP + 1.7, z1]), P([FACE - .3, TOP + 1.7, z0])], 'rgba(14,16,22,.6)'); void n; void f; }
      // flicker of its light on the street
      glow(target, 1300, 900, 700, 200, '255,220,170', .06 * Math.sin(Math.PI * t) * (.6 + .4 * Math.sin(TAU * phase * 40)));
    }
    // water pouring off the viaduct edge in strings
    for (const c of curtain) { const top = P([FACE - .1, TOP, c.z]), bot = P([FACE - .1, 0, c.z]), y = lerp(top[1], bot[1], (c.offset + phase * c.turns) % 1); target.strokeStyle = 'rgba(190,200,220,.35)'; target.lineWidth = 1.2; target.beginPath(); target.moveTo(lerp(top[0], bot[0], (y - top[1]) / (bot[1] - top[1])), y); target.lineTo(lerp(top[0], bot[0], (y + 30 - top[1]) / (bot[1] - top[1])), y + 30); target.stroke(); }
    rain.draw(target, phase, '190,200,220');
    for (const l of lamps) glow(target, l[0], l[1] + 4, 22, 12, '255,200,130', .8);
  };
}

module.exports = {
  title: '고가 철길 아래 비 내리는 길',
  slug: 'rain-under-the-rail-viaduct',
  sound: 'rain-street',
  createScene,
};
