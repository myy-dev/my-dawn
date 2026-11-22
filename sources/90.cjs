'use strict';

// 90 · 사과밭에 내려앉은 서리
// An apple orchard on a frosted night after the harvest. Old trees stand in loose rows running away from
// us: short gnarled trunks that split into three to five thick scaffold limbs, then into crooked
// secondary branches and a haze of twigs. A few apples were left on the high branches. The grass between
// the rows is silvered with frost, the moon throws the trees' branch shadows across it, and a mist lies
// low down the rows. A ladder still leans into the nearest tree; a crate of windfalls sits at its foot.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera, groundShadow, v3 } = paint;
const { add, mul, unit } = v3;

const cam = camera({ x: 0, y: 1.55, z: 0, yaw: .22, pitch: -.03, focal: 1100, cx: 960, cy: 580 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.55, 1e6])[1];
const MOON_SCREEN = [1560, 150];
const MOON_RAY = unit([-.55, -.45, -.7]);            // moonlight falls from behind-right toward us
const FOG = [96, 108, 130];
const fogAt = z => Math.min(.9, 1 - Math.exp(-Math.max(0, z - 6) / 30));

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 10, [[0, '#09101e'], [.6, '#1c2a40'], [1, '#3e4c64']]);
  ctx.fillRect(0, 0, W, HORIZON + 10);
  paint.starfield(ctx, rnd, 260, HORIZON);
  glow(ctx, ...MOON_SCREEN, 300, 300, '200,214,236', .3);
  ctx.fillStyle = '#e8eef6'; ctx.beginPath(); ctx.arc(...MOON_SCREEN, 24, 0, TAU); ctx.fill();
  paint.ridgeline(ctx, HORIZON + 2, 30, [40, 50, 64], 101, [[300, 1], [60, .5], [12, .3]], HORIZON + 40);
}

function ground(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#56627a'], [.3, '#6a7488'], [1, '#2e3440']]);
  ctx.fillRect(0, HORIZON + 2, W, H);
  // frost on the grass: a glitter of pale blades, brighter in the open, matted along the tractor rows
  for (let i = 0; i < 9000; i++) {
    const z = 1.5 + rnd() ** 1.7 * 70, x = (rnd() - .5) * z * 2.6, s = cam.project([x, 0, z]);
    if (s[2] <= 0 || s[1] < HORIZON) continue;
    const k = cam.focal / s[2], h = (.04 + rnd() * .08) * k;
    ctx.strokeStyle = rnd() < .55 ? `rgba(210,222,240,${.2 + rnd() * .35})` : `rgba(30,40,46,${.3})`;
    ctx.lineWidth = Math.max(.5, .01 * k);
    ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[0] + (rnd() - .5) * h * .6, s[1] - h); ctx.stroke();
  }
}

// One apple tree, grown as 3D limbs. Returns its limb segments so its shadow can be cast.
function growTree(rnd, base) {
  const segs = [];
  const trunkH = .9 + rnd() * .5, lean = [(rnd() - .5) * .3, 0, (rnd() - .5) * .2];
  const crotch = add(base, [0, trunkH, 0], lean);
  segs.push({ a: base, b: crotch, r: .16 + rnd() * .06, depth: 0 });
  const scaffolds = 3 + Math.floor(rnd() * 3), spin = rnd() * TAU;
  const branch = (from, dir, len, r, depth) => {
    // crooked: each limb is two segments with a kink, the way pruned apple wood grows
    const kink = add(from, mul(unit(add(dir, [(rnd() - .5) * .5, (rnd() - .3) * .4, (rnd() - .5) * .5])), len * .5));
    const end = add(kink, mul(unit(add(dir, [(rnd() - .5) * .6, (rnd() - .2) * .5, (rnd() - .5) * .6])), len * .5));
    segs.push({ a: from, b: kink, r, depth }, { a: kink, b: end, r: r * .8, depth });
    if (depth >= 3) return;
    const kids = depth < 2 ? 2 + Math.floor(rnd() * 2) : 3 + Math.floor(rnd() * 3);
    for (let k = 0; k < kids; k++) {
      const nd = unit(add(dir, [(rnd() - .5) * 1.4, .2 + rnd() * .6, (rnd() - .5) * 1.4]));
      branch(rnd() < .5 ? end : kink, nd, len * (.55 + rnd() * .2), r * .55, depth + 1);
    }
  };
  for (let s = 0; s < scaffolds; s++) {
    const a = spin + s / scaffolds * TAU + (rnd() - .5) * .6;
    branch(crotch, unit([Math.cos(a), .7 + rnd() * .5, Math.sin(a)]), 1.6 + rnd() * .8, .1 + rnd() * .03, 1);
  }
  const apples = [];
  for (const s of segs) if (s.depth >= 2 && rnd() < .06) apples.push(add(s.b, [0, -.06, 0]));
  return { segs, apples, base };
}

function drawTree(ctx, tree) {
  const z = tree.base[2], fog = fogAt(z), bark = paint.aerial([44, 38, 36], fog, FOG), lit = paint.aerial([92, 96, 110], fog, FOG);
  ctx.lineCap = 'round';
  for (const s of tree.segs.slice().sort((p, q) => p.depth - q.depth)) {
    const a = cam.project(s.a), b = cam.project(s.b); if (a[2] <= .5 || b[2] <= .5) continue;
    // a tapered limb: wide where it leaves its parent, narrower at its end, with a rounded joint
    const w = Math.max(.6, s.r * 2 * cam.focal / a[2]), w2 = Math.max(.5, s.r * 1.6 * cam.focal / b[2]);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
    const bow = (s.depth % 2 ? 1 : -1) * len * .06;
    const mid = [(a[0] + b[0]) / 2 + nx * bow, (a[1] + b[1]) / 2 + ny * bow];
    ctx.fillStyle = shade(bark);
    ctx.beginPath();
    ctx.moveTo(a[0] + nx * w / 2, a[1] + ny * w / 2);
    ctx.quadraticCurveTo(mid[0] + nx * (w + w2) / 4, mid[1] + ny * (w + w2) / 4, b[0] + nx * w2 / 2, b[1] + ny * w2 / 2);
    ctx.lineTo(b[0] - nx * w2 / 2, b[1] - ny * w2 / 2);
    ctx.quadraticCurveTo(mid[0] - nx * (w + w2) / 4, mid[1] - ny * (w + w2) / 4, a[0] - nx * w / 2, a[1] - ny * w / 2);
    ctx.fill();
    ctx.beginPath(); ctx.arc(b[0], b[1], w2 / 2, 0, TAU); ctx.fill();
    // moonlight catches the upper right edge of thick limbs
    if (w > 3) {
      ctx.strokeStyle = shade(lit, 0, .5); ctx.lineWidth = w * .25;
      ctx.beginPath(); ctx.moveTo(a[0] + w * .3, a[1] - w * .2); ctx.lineTo(b[0] + w * .3, b[1] - w * .2); ctx.stroke();
    }
  }
  for (const p of tree.apples) {
    const s = cam.project(p); if (s[2] <= .5) continue;
    const r = Math.max(1.2, .045 * cam.focal / s[2]);
    ctx.fillStyle = shade(paint.aerial([120, 30, 30], fog, FOG)); ctx.beginPath(); ctx.arc(s[0], s[1], r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(220,200,200,.35)'; ctx.beginPath(); ctx.arc(s[0] - r * .3, s[1] - r * .3, r * .35, 0, TAU); ctx.fill();
  }
}

// Branch shadows in the moonlight, laid onto the frost as thin dark strokes.
function treeShadow(ctx, make, tree) {
  const layer = make(W, H), c = layer.getContext('2d');
  c.strokeStyle = 'rgb(20,26,40)'; c.lineCap = 'round';
  for (const s of tree.segs) {
    const a = cam.project(groundShadow(s.a, MOON_RAY)), b = cam.project(groundShadow(s.b, MOON_RAY));
    if (a[2] <= .5 || b[2] <= .5) continue;
    c.lineWidth = Math.max(.5, s.r * 1.6 * cam.focal / a[2]);
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  }
  ctx.save(); ctx.filter = 'blur(1.5px)'; ctx.globalAlpha = .35 * (1 - fogAt(tree.base[2])); ctx.drawImage(layer, 0, 0); ctx.restore();
}

// The ladder in the nearest tree and the crate of windfalls at its foot.
function ladder(ctx, foot, top) {
  for (const off of [-.22, .22]) {
    const a = P(add(foot, [off, 0, 0])), b = P(add(top, [off * .6, 0, 0]));
    ctx.strokeStyle = '#6a5442'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  }
  for (let i = 1; i < 9; i++) {
    const p = v3.lerp(foot, top, i / 9), w = lerp(.22, .13, i / 9);
    ctx.strokeStyle = '#7a6250'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(...P(add(p, [-w, 0, 0]))); ctx.lineTo(...P(add(p, [w, 0, 0]))); ctx.stroke();
  }
}
function crate(ctx, rnd, at) {
  const [x, , z] = at, c = (dx, dy, dz) => P([x + dx, dy, z + dz]);
  fill(ctx, [c(-.3, .3, -.2), c(.3, .3, -.2), c(.3, 0, -.2), c(-.3, 0, -.2)], '#6a5644');
  fill(ctx, [c(.3, .3, -.2), c(.3, .3, .2), c(.3, 0, .2), c(.3, 0, -.2)], '#4a3c30');
  for (let y = .06; y < .3; y += .09) { ctx.strokeStyle = 'rgba(20,14,10,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...c(-.3, y, -.2)); ctx.lineTo(...c(.3, y, -.2)); ctx.stroke(); }
  for (let i = 0; i < 12; i++) {
    const p = c(-.24 + rnd() * .48, .3 + rnd() * .06, -.15 + rnd() * .3), r = 7 + rnd() * 3;
    ctx.fillStyle = shade([150, 40, 36], (rnd() - .5) * 30); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill();
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(90011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  ground(ctx, rnd);
  // rows run diagonally away; trees keep roughly to their rows but not to a grid, and some are missing
  const trees = [];
  for (let row = -3; row <= 3; row++) {
    for (let i = 0; i < 14; i++) {
      if (rnd() < .12) continue;
      const along = 6.5 + i * 5.2 + (rnd() - .5) * 1.2;
      trees.push(growTree(rnd, [row * 6.4 + along * .35 + (rnd() - .5) * .8, 0, along + row * 1.2]));
    }
  }
  const visible = trees.filter(t => t.base[2] > 2.2 && Math.abs(cam.project(t.base)[0] - W / 2) < W).sort((a, b) => b.base[2] - a.base[2]);
  for (const t of visible) if (t.base[2] < 40) treeShadow(ctx, make, t);
  let misted = false;
  for (const t of visible) {
    if (!misted && t.base[2] < 18) { glow(ctx, W / 2, P([0, 0, 18])[1], 1400, 70, '150,164,188', .35); misted = true; }
    drawTree(ctx, t);
  }
  const near = visible[visible.length - 1];
  ladder(ctx, add(near.base, [-.9, 0, -.6]), add(near.base, [-.2, 2.6, .1]));
  crate(ctx, rnd, add(near.base, [-1.6, 0, -1.3]));
  paint.applyTexture(ctx, make, 9001, .4, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.72, .76, .86], lights: [paint.LIGHT.glade(MOON_SCREEN[0] - 200, HORIZON, .2, 700, 700)] })(ctx);
  // mist breathing along the rows
  const mist = make(W * 2, 300), mc = mist.getContext('2d');
  for (let i = 0; i < 40; i++) { const x = rnd() * W * 2; for (const dx of [0, -W * 2, W * 2]) glow(mc, x + dx, 150 + (rnd() - .5) * 100, 220 + rnd() * 380, 18 + rnd() * 30, '150,164,188', .16); }
  const mistY = P([0, 0, 24])[1] - 150;

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    const x = (phase * W * 2) % (W * 2);
    target.drawImage(mist, -x, mistY); target.drawImage(mist, W * 2 - x, mistY);
  };
}

module.exports = {
  title: '사과밭에 내려앉은 서리',
  slug: 'rime-in-the-apple-orchard',
  sound: 'snow',
  createScene,
};
