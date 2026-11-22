'use strict';

// 88 · 잠든 농장의 사일로
// A farmyard asleep in the small hours. Two silos stand beside a gambrel-roofed barn: an old concrete stave
// silo with steel hoops and a dome cap, and a younger corrugated steel one with a conical roof and a caged
// ladder. The barn's roof breaks partway down; a sliding door hangs on its rail. The gravel yard is white
// with frost and cut by tractor ruts. A yard light on a pole is the only lamp, and it throws the silos'
// shadows long across the frost. Clouds drift over a pale moon.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, planks, shade, camera, lambert, v3 } = paint;
const { add, mul, unit, UP } = v3;

const cam = camera({ x: 0, y: 1.7, z: 0, yaw: -.08, pitch: -.06, focal: 1150, cx: 960, cy: 600 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.7, 1e6])[1];
const LAMP = [1.8, 6, 21];                       // the yard light on its pole
const TO_MOON = unit([-.6, .55, .55]);

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}
// How much light a surface gets from the yard lamp and the moon together, 0..1.
const lit = (point, normal) => Math.min(1, lambert(normal, TO_MOON) * .35 + lambert(normal, unit(v3.sub(LAMP, point))) * 7 / (3 + Math.hypot(...v3.sub(LAMP, point))));

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#0b1020'], [.6, '#1e2638'], [1, '#3a4254']]);
  ctx.fillRect(0, 0, W, HORIZON + 4);
  paint.starfield(ctx, rnd, 140, HORIZON * .7);
  glow(ctx, 380, 210, 300, 300, '170,182,206', .25);
  ctx.fillStyle = 'rgba(214,222,236,.8)'; ctx.beginPath(); ctx.arc(380, 210, 18, 0, TAU); ctx.fill();
  paint.ridgeline(ctx, HORIZON + 2, 26, [32, 38, 48], 81, [[300, 1], [60, .5], [12, .3]], HORIZON + 40);
}

// A vertical cylinder seen by this camera: shades it in narrow vertical strips by how each faces the light.
function cylinder(ctx, base, radius, height, color, rnd, { ribs = 0, hoops = [], staves = 0 } = {}) {
  const view = Math.atan2(-base[2], -base[0]), strips = 28, pts = [];
  for (let s = 0; s < strips; s++) {
    const a0 = view - Math.PI / 2 + s / strips * Math.PI, a1 = view - Math.PI / 2 + (s + 1) / strips * Math.PI, am = (a0 + a1) / 2;
    const p = a => add(base, [Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    const n = [Math.cos(am), 0, Math.sin(am)], light = lit(add(p(am), [0, height * .5, 0]), n);
    const q = [add(p(a0), [0, height, 0]), add(p(a1), [0, height, 0]), p(a1), p(a0)].map(P);
    const g = ctx.createLinearGradient(q[0][0], q[0][1], q[3][0], q[3][1]);
    g.addColorStop(0, shade(color.map(c => c * (.35 + light * .9)), 6)); g.addColorStop(1, shade(color.map(c => c * (.35 + light * .9)), -22));
    fill(ctx, q, g);
    if (ribs && s % 2) { ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...q[1]); ctx.lineTo(...q[2]); ctx.stroke(); }
    pts.push(q);
  }
  // staves: the concrete silo is built of stacked blocks, offset course to course
  for (let c = 0; c < staves; c++) {
    const y = height * c / staves;
    const ring = [];
    for (let s = 0; s <= 20; s++) { const a = view - Math.PI / 2 + s / 20 * Math.PI; ring.push(P(add(base, [Math.cos(a) * radius, y, Math.sin(a) * radius]))); }
    ctx.strokeStyle = 'rgba(20,20,26,.28)'; ctx.lineWidth = 1; ctx.beginPath(); ring.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  }
  for (const y of hoops) {
    const ring = [];
    for (let s = 0; s <= 24; s++) { const a = view - Math.PI / 2 + s / 24 * Math.PI; ring.push(P(add(base, [Math.cos(a) * (radius + .03), y, Math.sin(a) * (radius + .03)]))); }
    ctx.strokeStyle = '#1e1e24'; ctx.lineWidth = 2.4; ctx.beginPath(); ring.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  }
  // rust and lime run down from the hoops and the top in streaks
  for (let i = 0; i < 30; i++) {
    const a = view - Math.PI / 2 + (.1 + rnd() * .8) * Math.PI, y0 = height * (.4 + rnd() * .6), y1 = y0 - height * (.1 + rnd() * .35);
    const p0 = P(add(base, [Math.cos(a) * radius, y0, Math.sin(a) * radius])), p1 = P(add(base, [Math.cos(a) * radius, y1, Math.sin(a) * radius]));
    ctx.strokeStyle = ribs ? `rgba(120,60,30,${.12 + rnd() * .15})` : `rgba(200,200,190,${.06 + rnd() * .08})`; ctx.lineWidth = 1 + rnd() * 2.5;
    ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.stroke();
  }
  return view;
}

// A roof of revolution over a cylinder: a dome (profile bulging) or a cone, in rings of shaded segments.
function roofOf(ctx, base, radius, rise, dome, color) {
  const view = Math.atan2(-base[2], -base[0]), rings = 8, segs = 24;
  for (let r = 0; r < rings; r++) {
    const t0 = r / rings, t1 = (r + 1) / rings;
    const prof = t => [radius * (dome ? Math.cos(t * Math.PI / 2) : 1 - t) * 1.04, rise * (dome ? Math.sin(t * Math.PI / 2) : t)];
    const [r0, h0] = prof(t0), [r1, h1] = prof(t1);
    for (let s = 0; s < segs; s++) {
      const a0 = view - Math.PI / 2 - .2 + s / segs * (Math.PI + .4), a1 = view - Math.PI / 2 - .2 + (s + 1) / segs * (Math.PI + .4), am = (a0 + a1) / 2;
      const n = unit([Math.cos(am) * (h1 - h0), r0 - r1, Math.sin(am) * (h1 - h0)]);
      const point = add(base, [Math.cos(am) * r0, h0, Math.sin(am) * r0]), light = lit(point, n);
      fill(ctx, [[a0, r0, h0], [a1, r0, h0], [a1, r1, h1], [a0, r1, h1]].map(([a, rr, hh]) => P(add(base, [Math.cos(a) * rr, hh, Math.sin(a) * rr]))),
        shade(color.map(c => c * (.35 + light * .9)), 0));
    }
  }
}

// The barn: gambrel profile (steep lower slopes, shallow upper), in metres.
const BT = -.72, BA = [Math.cos(BT), 0, Math.sin(BT)], BB = [-Math.sin(BT), 0, Math.cos(BT)];
const BO = [-16, 0, 36], BLEN = 14, BW = 10, BWALL = 4;
const gambrel = [[0, BWALL], [1.2, 6.4], [BW / 2, 8.2], [BW - 1.2, 6.4], [BW, BWALL]];   // across, height
function barn(ctx, rnd) {
  const sideWall = (u, v) => P(add(BO, mul(BA, u * BLEN), mul(UP, BWALL * (1 - v) - .1 * Math.sin(Math.PI * u) * (1 - v))));
  planks(ctx, sideWall, rnd, { along: 'v', width: [.018, .026], base: [110, 46, 40], vary: 22, streaks: 3 });
  const outline = paint.outline(sideWall, 16);
  fill(ctx, outline, `rgba(6,8,20,${.65 - lit(add(BO, mul(BA, 7), [0, 2, 0]), mul(BB, -1)) * .6})`);
  // gable end facing us, in the gambrel profile, with a hay door and its hood
  const g3 = ([across, h]) => add(BO, mul(BA, BLEN), mul(BB, across), mul(UP, h));
  const gable = [g3([0, 0]), ...gambrel.map(g3), g3([BW, 0])].map(P);
  ctx.save(); pathOf(ctx, gable); ctx.clip();
  planks(ctx, (u, v) => P(g3([u * BW, 8.4 * (1 - v)])), rnd, { along: 'v', width: [.035, .05], base: [124, 54, 46], vary: 22, streaks: 5 });
  fill(ctx, gable, `rgba(6,8,20,${.6 - lit(g3([BW / 2, 3]), BA) * .6})`);
  ctx.restore();
  // white trim along the gambrel edge, the barn's signature
  ctx.strokeStyle = '#a8a69c'; ctx.lineWidth = 5; ctx.beginPath(); gambrel.map(g3).map(P).forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  const door = [g3([BW * .3, 3.4]), g3([BW * .7, 3.4]), g3([BW * .7, 0]), g3([BW * .3, 0])].map(P);
  fill(ctx, door, '#3a1a16');
  planks(ctx, door, rnd, { along: 'v', width: [.14, .2], base: [100, 44, 38], streaks: 2 });
  ctx.strokeStyle = '#c0beb2'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(...door[0]); ctx.lineTo(...door[1]); ctx.lineTo(...door[2]); ctx.lineTo(...door[3]); ctx.closePath(); ctx.moveTo(...door[0]); ctx.lineTo(...door[2]); ctx.moveTo(...door[1]); ctx.lineTo(...door[3]); ctx.stroke();
  const rail = [g3([BW * .2, 3.6]), g3([BW * .8, 3.6])].map(P);
  ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...rail[0]); ctx.lineTo(...rail[1]); ctx.stroke();
  const loft = [g3([BW * .4, 6.2]), g3([BW * .6, 6.2]), g3([BW * .6, 4.8]), g3([BW * .4, 4.8])].map(P);
  fill(ctx, loft, '#22100e');
  // the visible roof slopes: lower steep and upper shallow, dark shingles, a sag along the ridge
  for (const [a, b, tone] of [[gambrel[0], gambrel[1], 46], [gambrel[1], gambrel[2], 56]]) {
    const map = (u, v) => P(add(BO, mul(BA, -.3 + u * (BLEN + .6)), mul(BB, lerp(b[0], a[0], v)), mul(UP, lerp(b[1], a[1], v) - .18 * Math.sin(Math.PI * u) * (1 - v * .5))));
    paint.shingles(ctx, map, rnd, { rows: 10, cols: 22, base: [tone, tone - 2, tone + 4], moss: [tone + 4, tone + 10, tone - 4], mossAt: .75, seed: tone });
    fill(ctx, paint.outline(map, 12), 'rgba(10,12,26,.35)');
  }
}

// Frosted gravel yard: pale, glittering where the lamp catches it, cut by two curving tractor ruts.
function yard(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#3a424e'], [.5, '#4a525e'], [1, '#22262e']]);
  ctx.fillRect(0, HORIZON + 4, W, H);
  for (let i = 0; i < 5000; i++) {
    const z = 2 + rnd() ** 1.8 * 60, x = (rnd() - .5) * z * 2.4, s = cam.project([x, 0, z]);
    if (s[2] <= 0 || s[1] < HORIZON) continue;
    const k = cam.focal / s[2], d = Math.hypot(x - LAMP[0], z - LAMP[2]), glint = Math.max(0, 1 - d / 14);
    ctx.fillStyle = rnd() < .5 ? `rgba(30,32,40,${.4})` : `rgba(${190 + glint * 60},${196 + glint * 36},${214},${.08 + glint * .4})`;
    ctx.fillRect(s[0], s[1], Math.max(1, .04 * k * rnd()), Math.max(1, .02 * k));
  }
  for (const off of [-.9, .9]) {
    const rut = [];
    for (let i = 0; i <= 30; i++) { const t = i / 30, z = lerp(2, 40, t), x = lerp(-1, -10, t ** 1.5) + off * lerp(1, .8, t); rut.push(P([x - .22, 0, z])); }
    for (let i = 30; i >= 0; i--) { const t = i / 30, z = lerp(2, 40, t), x = lerp(-1, -10, t ** 1.5) + off * lerp(1, .8, t); rut.push(P([x + .22, 0, z])); }
    fill(ctx, rut, 'rgba(24,26,34,.55)');
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(88011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  yard(ctx, rnd);
  // the far farmhouse, a lit window across the fields
  const fh = P([-30, 0, 120]);
  fill(ctx, [[fh[0] - 30, fh[1]], [fh[0] + 26, fh[1]], [fh[0] + 26, fh[1] - 18], [fh[0] - 2, fh[1] - 34], [fh[0] - 30, fh[1] - 18]], '#161a22');
  glow(ctx, fh[0] + 12, fh[1] - 10, 16, 12, '255,190,120', .8);
  // long lamp shadows of the silos and the pole across the frost, cast from the yard light
  const silos = [{ base: [6, 0, 33], r: 3, h: 15 }, { base: [13, 0, 42], r: 3.4, h: 12 }];
  const shadowFrom = (p, rr, h) => {
    const ring = [];
    for (let s = 0; s < 16; s++) { const a = s / 16 * TAU; ring.push(add(p, [Math.cos(a) * rr, 0, Math.sin(a) * rr]), add(p, [Math.cos(a) * rr, h, Math.sin(a) * rr])); }
    return ring;
  };
  for (const s of silos) {
    const dir = unit(v3.sub(add(s.base, [0, s.h * .5, 0]), LAMP));
    paint.castShadows(ctx, make, cam.project, [shadowFrom(s.base, s.r, Math.min(s.h, LAMP[1] - .3))], [dir[0], Math.min(-.2, dir[1]), dir[2]], { alpha: .35, blur: 8 });
  }
  barn(ctx, rnd);
  // silos: the far steel one first, then the concrete one nearer the lamp
  cylinder(ctx, silos[1].base, silos[1].r, silos[1].h, [150, 154, 158], rnd, { ribs: 1, hoops: [] });
  roofOf(ctx, add(silos[1].base, [0, silos[1].h, 0]), silos[1].r, 2.6, false, [130, 134, 140]);
  cylinder(ctx, silos[0].base, silos[0].r, silos[0].h, [168, 160, 146], rnd, { staves: 38, hoops: [2, 4.5, 7, 9.5, 12, 14.5] });
  roofOf(ctx, add(silos[0].base, [0, silos[0].h, 0]), silos[0].r, 2.4, true, [120, 112, 100]);
  // the steel silo's caged ladder, catching the lamp
  for (let y = .6; y < silos[1].h; y += .45) {
    const a = Math.atan2(-silos[1].base[2], -silos[1].base[0]) - .5, p = add(silos[1].base, [Math.cos(a) * (silos[1].r + .15), y, Math.sin(a) * (silos[1].r + .15)]);
    const q = P(p), q2 = P(add(p, [Math.sin(a) * .4, 0, -Math.cos(a) * .4]));
    ctx.strokeStyle = 'rgba(40,40,46,.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(...q); ctx.lineTo(...q2); ctx.stroke();
  }
  // the lamp pole and its fixture
  const foot = P([LAMP[0], 0, LAMP[2]]), head = P(LAMP);
  ctx.strokeStyle = '#1c1a1c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(...foot); ctx.lineTo(head[0], head[1] - 10); ctx.stroke();
  fill(ctx, [[head[0] - 4, head[1] - 12], [head[0] + 30, head[1] - 16], [head[0] + 34, head[1] - 4], [head[0], head[1]]], '#1c1a1c');
  paint.applyTexture(ctx, make, 8801, .4, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.6, .64, .76], lights: [paint.LIGHT.lamp(head[0] + 20, foot[1] - 20, .55, 600, 320, [1.25, 1.05, .8])] })(ctx);
  // clouds drift across the moon, one full pass per loop
  const clouds = make(W * 2, 400), cc = clouds.getContext('2d');
  for (let i = 0; i < 30; i++) {
    const x = rnd() * W * 2;
    for (const dx of [0, -W * 2, W * 2]) glow(cc, x + dx, 140 + rnd() * 180, 180 + rnd() * 320, 18 + rnd() * 30, '60,70,92', .3);
  }
  const lampAt = [head[0] + 20, head[1] - 8];

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.beginPath(); target.rect(0, 0, W, HORIZON); target.clip();
    const x = (phase * W * 2) % (W * 2);
    target.drawImage(clouds, -x, 0); target.drawImage(clouds, W * 2 - x, 0);
    target.restore();
    glow(target, lampAt[0], lampAt[1], 50, 50, '255,220,170', .7);
    glow(target, lampAt[0], lampAt[1], 160, 160, '255,200,140', .12);
  };
}

module.exports = {
  title: '잠든 농장의 사일로',
  slug: 'silos-at-the-sleeping-farm',
  sound: 'gust',
  createScene,
};
