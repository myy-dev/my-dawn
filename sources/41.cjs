'use strict';

// 41 · 대숲 사이로 스미는 새벽
// Standing in a bamboo grove as dawn seeps in. Culms rise past the top of the frame, each its own girth,
// green going grey-gold with age, banded by nodes at its own spacing, leaning a little. Behind them the
// grove thins toward a pale opening; shafts of light slant through the mist between the stems. Up high the
// leaf sprays hang in feathered clusters, and the wind sways the tall culms, the far ones more slowly.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, v3 } = paint;
const { add, unit } = v3;

const cam = camera({ x: 0, y: 1.6, z: 0, yaw: -.02, pitch: .1, focal: 1000, cx: 960, cy: 620 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const OPENING = [2, 3, 60];
const FOG = [150, 170, 150];
const fogAt = z => Math.min(.92, 1 - Math.exp(-Math.max(0, z - 3) / 18));

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function backdrop(ctx, rnd) {
  const open = P(OPENING);
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#2a3a30'], [.5, '#6a7c64'], [.7, '#aab49a'], [1, '#3a4232']]);
  ctx.fillRect(0, 0, W, H);
  glow(ctx, open[0], open[1], 700, 500, '236,230,196', .45);
  // the floor: dry fallen leaves, pale, with dark hollows
  const ground = P([0, 0, 8])[1];
  ctx.fillStyle = vertical(ctx, ground - 120, H, [[0, 'rgba(120,118,90,0)'], [.3, '#6a6650'], [1, '#2a2a20']]);
  ctx.fillRect(0, ground - 120, W, H);
  for (let i = 0; i < 3000; i++) {
    const z = 1.5 + rnd() ** 1.6 * 40, x = (rnd() - .5) * z * 2.4, s = cam.project([x, 0, z]); if (s[2] <= 0) continue;
    const k = cam.focal / s[2], l = (.05 + rnd() * .08) * k;
    ctx.strokeStyle = shade(paint.aerial([150, 136, 96], fogAt(z), FOG), (rnd() - .5) * 40, .6); ctx.lineWidth = Math.max(.6, .015 * k);
    const a = rnd() * Math.PI; ctx.beginPath(); ctx.moveTo(s[0] - Math.cos(a) * l, s[1] - Math.sin(a) * l * .3); ctx.lineTo(s[0] + Math.cos(a) * l, s[1] + Math.sin(a) * l * .3); ctx.stroke();
  }
}

// A culm: a tall slender tube, nodes ringed every so often, lit on the side toward the opening.
function makeCulms(rnd) {
  const culms = [];
  for (let c = 0; c < 12; c++) {
    const cx = (rnd() - .5) * 30, cz = 3 + rnd() ** 1.2 * 40, n = 3 + Math.floor(rnd() * 6);
    for (let i = 0; i < n; i++) culms.push({ x: cx + (rnd() - .5) * 2.5, z: Math.max(1.6, cz + (rnd() - .5) * 2.5) });
  }
  for (let i = 0; i < 60; i++) culms.push({ x: (rnd() - .5) * 60, z: 25 + rnd() * 35 });
  return culms.filter(c => Math.abs(c.x - OPENING[0] * c.z / OPENING[2]) > .8 + c.z * .03).map(c => ({
    ...c, r: .04 + rnd() * .05, h: 14 + rnd() * 6, lean: [(rnd() - .5) * .05, 0, (rnd() - .5) * .04],
    node: .35 + rnd() * .2, age: rnd(), lag: c.x * .1 + rnd(), flex: .4 + rnd() * .6,
  })).sort((a, b) => b.z - a.z);
}

function culm(ctx, c, sway) {
  const fog = fogAt(c.z), base = [c.x, 0, c.z];
  const at = h => add(base, v3.mul(c.lean, h), [sway * (h / c.h) ** 2 * c.flex, h, 0]);
  const steps = 24, left = [], right = [];
  for (let i = 0; i <= steps; i++) {
    const h = i / steps * c.h, p = at(h), r = c.r * (1 - h / c.h * .3);
    left.push(P(add(p, [-r, 0, 0]))); right.push(P(add(p, [r, 0, 0])));
  }
  const tone = c.age < .7 ? [70, 110, 60] : [140, 136, 90];
  const lit = paint.aerial(tone.map(v => v * 1.35), fog, FOG), dark = paint.aerial(tone.map(v => v * .55), fog, FOG);
  const lightRight = OPENING[0] > c.x;
  for (let i = 0; i < steps; i++) {
    const a = left[i], b = right[i], d = left[i + 1], e = right[i + 1];
    const g = ctx.createLinearGradient(a[0], 0, b[0], 0);
    g.addColorStop(0, shade(lightRight ? dark : lit)); g.addColorStop(.6, shade(paint.aerial(tone, fog, FOG))); g.addColorStop(1, shade(lightRight ? lit : dark));
    fill(ctx, [a, b, e, d], g);
  }
  // nodes: a raised ring with a pale band of bloom below it
  for (let h = c.node; h < c.h; h += c.node * (1 + h / c.h * .5)) {
    const p = at(h), r = c.r * 1.08, a = P(add(p, [-r, 0, 0])), b = P(add(p, [r, 0, 0]));
    ctx.strokeStyle = shade(dark, -10, .9); ctx.lineWidth = Math.max(.6, (b[0] - a[0]) * .12);
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
    ctx.strokeStyle = shade(lit, 20, .35); ctx.lineWidth = Math.max(.5, (b[0] - a[0]) * .1);
    ctx.beginPath(); ctx.moveTo(a[0], a[1] + 3); ctx.lineTo(b[0], b[1] + 3); ctx.stroke();
  }
}

// Leaf sprays: twigs from the upper nodes, each holding a fan of narrow lance leaves that hang down.
function makeSprays(rnd, culms) {
  const sprays = [];
  for (const c of culms) {
    if (c.z > 30) continue;
    for (let i = 0; i < 6; i++) {
      const h = c.h * (.45 + rnd() * .5), a = rnd() * TAU;
      sprays.push({ c, h, dir: [Math.cos(a), .2 + rnd() * .3, Math.sin(a)], len: .5 + rnd() * .7, leaves: 4 + Math.floor(rnd() * 5), seed: rnd() });
    }
  }
  return sprays;
}
function spray(ctx, s, sway) {
  const c = s.c, fog = fogAt(c.z), lean = v3.mul(c.lean, s.h);
  const root = add([c.x, s.h, c.z], lean, [sway * (s.h / c.h) ** 2 * c.flex, 0, 0]);
  const tip = add(root, v3.mul(unit(s.dir), s.len)), a = cam.project(root), b = cam.project(tip);
  if (a[2] <= .5 || b[2] <= .5) return;
  const k = cam.focal / a[2], color = shade(paint.aerial([54, 84, 46], fog, FOG)), light = shade(paint.aerial([110, 140, 80], fog, FOG), 0, .7);
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(.5, .01 * k);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  for (let l = 0; l < s.leaves; l++) {
    const t = .4 + l / s.leaves * .6, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t);
    const ang = Math.PI / 2 + (l % 2 ? .6 : -.6) + (s.seed - .5) + Math.sin(sway * 3 + l) * .1, len = (.18 + .05 * (l % 3)) * k;
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, w = len * .12;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(ang + .3) * len * .5 + w, y + Math.sin(ang + .3) * len * .5, ex, ey);
    ctx.quadraticCurveTo(x + Math.cos(ang - .3) * len * .5 - w, y + Math.sin(ang - .3) * len * .5, x, y); ctx.fill();
    ctx.strokeStyle = light; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(41011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  backdrop(ctx, rnd);
  const culms = makeCulms(rnd);
  const far = culms.filter(c => c.z > 22), near = culms.filter(c => c.z <= 22);
  for (const c of far) culm(ctx, c, 0);
  glow(ctx, P(OPENING)[0], P([0, 1, 22])[1], 1300, 260, '210,214,190', .3);
  paint.applyTexture(ctx, make, 4101, .36, 0, 0, W, H, true);
  // light shafts: long pale wedges slanting down from the opening, drawn once, breathing over the loop
  const shafts = make(W, H), sc = shafts.getContext('2d');
  sc.globalCompositeOperation = 'lighter';
  const open = P(OPENING);
  for (let i = 0; i < 7; i++) {
    const x = open[0] + (rnd() - .5) * 600, spread = 40 + rnd() * 90, a = .05 + rnd() * .05;
    const g = sc.createLinearGradient(x, 0, x - 300, H);
    g.addColorStop(0, `rgba(240,236,200,${a})`); g.addColorStop(1, 'rgba(240,236,200,0)');
    fill(sc, [[x - spread * .2, 0], [x + spread * .2, 0], [x - 260 + spread, H], [x - 260 - spread, H]], g);
  }
  const sprays = makeSprays(rnd, near);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.globalAlpha = .75 + .25 * Math.sin(TAU * phase);
    target.drawImage(shafts, 0, 0);
    target.globalAlpha = 1;
    for (const c of near) {
      const sway = .9 * Math.sin(TAU * phase * 2 + c.lag) + .4 * Math.sin(TAU * phase * 3 + c.lag * 1.7);
      culm(target, c, sway);
    }
    for (const s of sprays) spray(target, s, .9 * Math.sin(TAU * phase * 2 + s.c.lag) + .4 * Math.sin(TAU * phase * 3 + s.c.lag * 1.7));
  };
}

module.exports = {
  title: '대숲 사이로 스미는 새벽',
  slug: 'bamboo-grove-at-first-light',
  sound: 'leaves',
  createScene,
};
