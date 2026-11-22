'use strict';

// 43 · 자작나무 사이로 내리는 눈
// Looking low into a birch grove before dawn, toward a pale opening in the trees. The grove is planted in
// metres and seen through a camera: every trunk is a leaning, bending cylinder of its own girth, with a root
// flare, the birch's dark "eyebrow" scars, curls of peeling bark and fine drooping twigs that reach toward
// or away from us. The opening lights the grove from behind, so each trunk is dark in the middle with a pale
// rim along both edges, and its shadow stretches across the snow toward the camera. Farther trees sink
// into blue fog. Snow drifts down slowly.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, wobble, pathOf, shade, camera, groundShadow } = paint;

const cam = camera({ x: 0, y: 1.15, z: 0, yaw: .03, pitch: -.04, focal: 1050, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.15, 1e6])[1];
const OPENING = [1.6, 2.4, 70];                       // where the light comes through the grove
const FOG = [118, 134, 158];
const SNOW = [150, 164, 188];

const add = (...vs) => vs.reduce((s, v) => [s[0] + v[0], s[1] + v[1], s[2] + v[2]], [0, 0, 0]);
const mul = (v, k) => [v[0] * k, v[1] * k, v[2] * k];
const unit = v => { const l = Math.hypot(...v) || 1; return mul(v, 1 / l); };
const fogAt = z => Math.min(.94, 1 - Math.exp(-Math.max(0, z - 4) / 26));

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function backdrop(ctx, rnd) {
  const open = P(OPENING);
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 40, [[0, '#0c1322'], [.5, '#1e2b40'], [.85, '#4a5a74'], [1, '#6c7a92']]);
  ctx.fillRect(0, 0, W, HORIZON + 40);
  glow(ctx, open[0], open[1], 700, 320, '170,182,206', .38);
  glow(ctx, open[0], open[1] + 20, 260, 140, '226,224,232', .18);
  ctx.fillStyle = vertical(ctx, HORIZON - 4, H, [[0, shade(SNOW, -6)], [.25, shade(SNOW, -24)], [1, shade(SNOW, -70)]]);
  ctx.fillRect(0, HORIZON - 4, W, H);
  // drifts: swells on the snow, laid out on the ground so they shrink and flatten with distance
  for (let i = 0; i < 40; i++) {
    const p = [(rnd() - .5) * 40, 0, 3 + rnd() ** 1.6 * 50], s = cam.project(p), k = cam.focal / s[2];
    if (s[2] <= 0) continue;
    glow(ctx, s[0], s[1], (1.5 + rnd() * 3) * k, (.08 + rnd() * .1) * k, '60,72,102', .16 * (1 - fogAt(p[2])));
    glow(ctx, s[0] - .3 * k, s[1] - .04 * k, (1 + rnd() * 2) * k, .06 * k, '190,200,222', .1 * (1 - fogAt(p[2])));
  }
}

// The trodden path, a strip on the ground winding to the opening, with boot prints along it.
const pathAt = t => [lerp(-.6, OPENING[0], t) + Math.sin(t * 5 + .5) * 1.4 * (1 - t), 0, lerp(1.5, OPENING[2], t ** 1.6)];
function trail(ctx, rnd) {
  const left = [], right = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60, c = pathAt(t), half = .75 * (1 + .18 * edge(i * 37, 5));
    left.push(P(add(c, [-half, 0, 0]))); right.push(P(add(c, [half, 0, 0])));
  }
  const band = left.concat(right.reverse());
  fill(ctx, band, vertical(ctx, HORIZON, H, [[0, shade(SNOW, 2)], [1, shade(SNOW, -82)]]));
  for (let i = 0; i < 90; i++) {
    const t = (i + rnd() * .4) / 90, c = add(pathAt(t), [(i % 2 ? .14 : -.14) + (rnd() - .5) * .06, 0, 0]);
    const s = cam.project(c); if (s[2] <= 0) continue;
    const k = cam.focal / s[2], fade = 1 - fogAt(c[2]);
    ctx.fillStyle = `rgba(50,62,90,${.3 * fade})`;
    ctx.beginPath(); ctx.ellipse(s[0], s[1], .14 * k, .04 * k, (rnd() - .5) * .3, 0, TAU); ctx.fill();
  }
}

// Clustered placement in metres, never a grid; the path's corridor and the opening stay clear.
function plant(rnd) {
  const trees = [];
  for (let c = 0; c < 14; c++) {
    const cx = (rnd() - .5) * 34, cz = 5 + rnd() ** 1.3 * 50, n = 2 + Math.floor(rnd() * 5);
    for (let i = 0; i < n; i++) trees.push({ x: cx + (rnd() - .5) * 4, z: cz + (rnd() - .5) * 4 });
  }
  for (let i = 0; i < 70; i++) trees.push({ x: (rnd() - .5) * 70, z: 40 + rnd() * 40 });
  const clear = t => {
    const along = Math.max(0, Math.min(1, ((t.z - 1.5) / (OPENING[2] - 1.5)) ** (1 / 1.6)));
    return Math.abs(t.x - pathAt(along)[0]) > 1.4 + t.z * .02;
  };
  const near = [{ x: -2.2, z: 3.2 }, { x: -3.6, z: 5.4 }, { x: 2.9, z: 4.1 }, { x: 4.4, z: 2.7 }, { x: 1.9, z: 8.5 }];
  return trees.filter(clear).concat(near).map(t => ({ ...t, r: (.09 + rnd() * .14) * (rnd() < .15 ? .55 : 1) + (t.z < 6 ? .08 : 0) }))
    .sort((a, b) => b.z - a.z);
}

// Grow one birch as a cylinder: a centre line that leans and bends, sampled up its height.
function birch(ctx, rnd, t) {
  // birches rarely stand plumb: most lean, many curve back toward the light as they grow
  const height = 13 + rnd() * 7, lean = [(rnd() - .5) * .22, 0, (rnd() - .5) * .12], bend = [(rnd() - .5) * .16 - lean[0] * .6, 0, (rnd() - .5) * .06];
  const broken = t.z > 6 && rnd() < .12, top = broken ? height * (.3 + rnd() * .35) : height;
  const fog = fogAt(t.z), tint = c => paint.aerial(c, fog, FOG);
  const centre = h => add([t.x, h, t.z], mul(lean, h), mul(bend, h * h / height), [edge(h * 40 + t.x * 9, 7) * (t.r * .5 + .08), 0, 0]);
  const radius = h => t.r * (h < .6 ? 1 + (.6 - h) * 1.1 : 1) * lerp(1, .45, h / height) * (1 + .05 * edge(h * 90, 9));

  // shadow: the opening is behind the tree, so its shadow runs toward the camera
  const ray = unit(add([t.x, 0, t.z], mul(OPENING, -1)));
  const shadowDir = [ray[0], -.18, ray[2]];
  const foot = [add([t.x, 0, t.z], [-t.r, 0, 0]), add([t.x, 0, t.z], [t.r, 0, 0])];
  const tip = groundShadow(add(centre(Math.min(top, 9)), [0, 0, 0]), shadowDir);
  const grad = ctx.createLinearGradient(...P(foot[0]), ...P(tip));
  grad.addColorStop(0, `rgba(40,50,82,${.26 * (1 - fog)})`); grad.addColorStop(1, 'rgba(40,50,82,0)');
  ctx.fillStyle = grad;
  pathOf(ctx, [P(foot[0]), P(foot[1]), P(add(tip, [t.r * 1.4, 0, 0])), P(add(tip, [-t.r * 1.4, 0, 0]))]); ctx.fill();

  // tree well: snow scoured into a hollow around the base
  const base = cam.project([t.x, 0, t.z]); if (base[2] <= .5) return;
  const k = cam.focal / base[2];
  glow(ctx, base[0], base[1], t.r * 4 * k, t.r * 1.2 * k, '40,50,80', .45 * (1 - fog));

  // trunk outline: both silhouette edges of the cylinder, up to the top or the break
  const steps = 30, leftEdge = [], rightEdge = [];
  for (let i = 0; i <= steps; i++) {
    const h = i / steps * top, c = centre(h), r = radius(h);
    leftEdge.push(P(add(c, [-r, 0, 0]))); rightEdge.push(P(add(c, [r, 0, 0])));
  }
  const trunk = leftEdge.concat(rightEdge.slice().reverse());
  paint.bark(ctx, trunk, rnd, { base: tint([224, 224, 220]), dir: 'h', marks: Math.round(8 + t.r * k * 1.6), light: -1, vary: 30 });
  ctx.save(); pathOf(ctx, trunk); ctx.clip();
  // round-ness: backlit, so the middle of the trunk falls into shade and both edges keep a pale rim
  for (let i = 0; i < steps; i++) {
    const a = leftEdge[i], b = rightEdge[i], c = rightEdge[i + 1], d = leftEdge[i + 1];
    const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
    const deep = .5 * (1 - fog * .8);
    g.addColorStop(0, 'rgba(10,16,36,0)'); g.addColorStop(.12, `rgba(10,16,36,${deep * .6})`);
    g.addColorStop(.5, `rgba(10,16,36,${deep})`); g.addColorStop(.88, `rgba(10,16,36,${deep * .7})`); g.addColorStop(1, 'rgba(10,16,36,0)');
    fill(ctx, [a, b, c, d], g);
  }
  // the base turns rough and black where old birch bark cracks
  const baseH = P(centre(t.r * 6));
  ctx.fillStyle = vertical(ctx, baseH[1], base[1], [[0, 'rgba(26,26,30,0)'], [1, `rgba(26,26,30,${.8 * (1 - fog)})`]]);
  ctx.fillRect(0, baseH[1], W, base[1] - baseH[1] + 4);
  // eyebrow scars: dark wings where branches once grew, arching up
  const scars = Math.round(2 + rnd() * 5);
  for (let i = 0; i < scars; i++) {
    const h = (.12 + rnd() * .75) * top, c = P(centre(h)), w = radius(h) * k * (.5 + rnd() * .5), lift = w * (.25 + rnd() * .2), tilt = (rnd() - .5) * .3 * w;
    fill(ctx, [[c[0] - w, c[1] + tilt], [c[0], c[1] - lift], [c[0] + w * (.8 + rnd() * .3), c[1] - tilt], [c[0], c[1] - lift * .45]], shade(tint([22, 20, 22]), 0, .85));
  }
  // peeling curls catching the backlight on the rims
  if (t.r * k > 8) {
    for (let i = 0; i < 6; i++) {
      const side = rnd() < .5 ? leftEdge : rightEdge, p = side[Math.floor(rnd() * steps * .9)];
      ctx.fillStyle = shade(tint([246, 240, 232]), 0, .8);
      ctx.beginPath(); ctx.ellipse(p[0], p[1], t.r * k * .14, t.r * k * .05, (side === leftEdge ? -1 : 1) * .4, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
  // a ring of snow banked against the root flare
  glow(ctx, base[0] - t.r * .3 * k, base[1] - t.r * .15 * k, t.r * 2.2 * k, t.r * .5 * k, shade(tint(SNOW), -10).slice(5, -3), .7);

  if (broken) {
    const p = leftEdge[steps], q = rightEdge[steps], w = q[0] - p[0];
    fill(ctx, [p, [lerp(p[0], q[0], .3), p[1] - w * .5], [lerp(p[0], q[0], .55), p[1] - w * .15], [lerp(p[0], q[0], .8), p[1] - w * .7], q], tint([170, 150, 124]));
    return;
  }
  // crown: limbs reaching out in every direction, toward and away from us, ending in hanging twigs
  const color = tint([46, 42, 44]), limbs = 4 + Math.floor(rnd() * 6);
  for (let i = 0; i < limbs; i++) {
    const h = top * (.5 + rnd() * .45), dirA = rnd() * TAU, rise = .6 + rnd() * .5;
    limb(ctx, rnd, centre(h), unit([Math.cos(dirA), rise, Math.sin(dirA)]), height * (.12 + rnd() * .14), radius(h) * .5, color, 3);
  }
}

function limb(ctx, rnd, from, dir, len, r, color, depth) {
  const end = add(from, mul(dir, len)), mid = add(from, mul(dir, len * .5), [0, len * .05, 0]);
  const a = cam.project(from), b = cam.project(end); if (a[2] <= 2 || b[2] <= 2) return;
  const m = P(mid), w = Math.max(.5, r * cam.focal / a[2]);
  ctx.strokeStyle = shade(color, 0, .9); ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(m[0], m[1], b[0], b[1]); ctx.stroke();
  if (depth <= 0) {
    for (let k = 0; k < 4; k++) {                    // hanging twigs, pulled down by their own weight
      const drop = add(end, mul(dir, len * (.2 + rnd() * .3)), [0, -len * (.6 + rnd() * .6), 0], [(rnd() - .5) * len * .3, 0, (rnd() - .5) * len * .3]);
      const d = P(drop), c = P(add(end, mul(dir, len * .25)));
      ctx.lineWidth = Math.max(.4, w * .45);
      ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.quadraticCurveTo(c[0], c[1], d[0], d[1]); ctx.stroke();
    }
    return;
  }
  const forks = 2 + (rnd() < .4 ? 1 : 0);
  for (let k = 0; k < forks; k++) {
    const turn = unit(add(dir, [(rnd() - .5) * .9, (rnd() - .3) * .5, (rnd() - .5) * .9]));
    limb(ctx, rnd, end, turn, len * (.5 + rnd() * .25), r * .62, color, depth - 1);
  }
}

function fogStrip(make, rnd) {
  const strip = make(W + 400, 360), c = strip.getContext('2d');
  for (let i = 0; i < 40; i++) glow(c, rnd() * (W + 400), 160 + (rnd() - .5) * 160, 200 + rnd() * 400, 20 + rnd() * 50, '150,164,190', .16);
  return strip;
}

function makeFlakes(rnd) {
  return Array.from({ length: 240 }, () => {
    const near = rnd() < .18;
    return {
      x: rnd() * W, y: rnd(), turns: 1 + Math.floor(rnd() * (near ? 2 : 1.6)), sway: 10 + rnd() * (near ? 40 : 18),
      wobble: 1 + Math.floor(rnd() * 2), offset: rnd(), r: near ? 2.4 + rnd() * 3 : .8 + rnd() * 1.4, a: near ? .5 + rnd() * .3 : .25 + rnd() * .35,
    };
  });
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(43017);
  const plate = make(W, H), ctx = plate.getContext('2d');
  backdrop(ctx, rnd);
  trail(ctx, rnd);
  const open = P(OPENING);
  let fogged = 0;
  for (const t of plant(rnd)) {
    // bands of fog settle between the depth layers as we come nearer
    for (const [z, a] of [[34, .35], [16, .25]]) if (fogged < z && t.z < z && !(fogged & 1 << (z > 20 ? 0 : 1))) {
      const y = P([0, 0, z])[1];
      glow(ctx, open[0], y - 10, 1400, 110, '140,154,180', a);
      fogged |= 1 << (z > 20 ? 0 : 1);
    }
    birch(ctx, rnd, t);
  }
  for (let i = 0; i < 8; i++) glow(ctx, rnd() * W, H + 20, 260 + rnd() * 300, 60 + rnd() * 40, '96,110,140', .35);
  paint.applyTexture(ctx, make, 4301, .4, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.66, .7, .8], lights: [{ x: open[0], y: open[1] + 120, rx: 900, ry: 520, power: .3, color: [.92, .96, 1.04] }] })(ctx);
  const fog = fogStrip(make, rnd), fogY = P([0, 0, 22])[1] - 200;
  const flakes = makeFlakes(rnd);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.globalAlpha = .7;
    target.drawImage(fog, -200 + Math.sin(TAU * phase) * 160, fogY);
    target.globalAlpha = 1;
    for (const f of flakes) {
      const y = ((f.y + phase * f.turns) % 1) * (H + 40) - 20;
      const x = f.x + Math.sin(TAU * (phase * f.wobble + f.offset)) * f.sway;
      target.fillStyle = `rgba(226,234,246,${f.a})`;
      target.beginPath(); target.arc(x, y, f.r, 0, TAU); target.fill();
    }
  };
}

module.exports = {
  title: '자작나무 사이로 내리는 눈',
  slug: 'snowfall-in-the-birch-grove',
  sound: 'snow',
  createScene,
};
