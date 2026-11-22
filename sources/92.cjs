'use strict';

// 92 · 안개가 흐르는 목초지
// A pasture of low swells just before sunrise, under a sky going from slate to pale green-gold. A zigzag
// split-rail fence wanders across it, each rail laid on the next at the corners. Two horses stand in the
// wet grass, one grazing with its head down, one lifting its head toward us. A great field maple stands
// half lost in the fog behind them. Fog drifts across in three layers at their own speeds, and the wind
// combs the grass in passing waves.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, shade, camera, v3 } = paint;
const { add } = v3;

const cam = camera({ x: 0, y: 1.5, z: 0, yaw: .05, pitch: -.02, focal: 1150, cx: 960, cy: 570 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.5, 1e6])[1];
const FOG = [118, 128, 130];
const fogAt = z => Math.min(.9, 1 - Math.exp(-Math.max(0, z - 5) / 28));
const ground = (x, z) => .6 * Math.sin(x * .07 + 1) * Math.sin(z * .05) + .4 * edge(x * 3 + z * 7, 121);

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 10, [[0, '#24304a'], [.45, '#3e4c60'], [.8, '#6a7a76'], [1, '#9a9480']]);
  ctx.fillRect(0, 0, W, HORIZON + 10);
  glow(ctx, 1300, HORIZON, 800, 160, '220,190,140', .2);
  for (let i = 0; i < 26; i++) glow(ctx, rnd() * W, 80 + rnd() * 320, 260 + rnd() * 420, 14 + rnd() * 26, i % 3 ? '110,120,130' : '200,190,170', .12);
  paint.ridgeline(ctx, HORIZON + 4, 40, [110, 122, 120], 122, [[500, 1], [120, .4], [30, .15]], HORIZON + 60);
}

function pasture(ctx, rnd) {
  // the land in bands from far to near, each a little darker and greener as the fog thins
  for (let band = 0; band < 14; band++) {
    const z = lerp(120, 3, band / 13), pts = [];
    for (let x = -80; x <= 80; x += 2) pts.push(P([x * z / 30, ground(x * z / 30, z), z]));
    pts.push([W, H], [0, H]);
    fill(ctx, pts, shade(paint.aerial([54, 78, 56], fogAt(z), FOG), -band * 1.2));
  }
  for (let i = 0; i < 9000; i++) {
    const z = 1.5 + rnd() ** 1.8 * 60, x = (rnd() - .5) * z * 2.6, y = ground(x, z), s = cam.project([x, y, z]);
    if (s[2] <= 0) continue;
    const k = cam.focal / s[2], h = (.05 + rnd() * .14) * k;
    ctx.strokeStyle = shade(paint.aerial([70, 96, 66], fogAt(z), FOG), (rnd() - .5) * 30, .55);
    ctx.lineWidth = Math.max(.5, .01 * k);
    ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[0] + (rnd() - .3) * h * .5, s[1] - h); ctx.stroke();
  }
}

// The maple: a broad dome of foliage on a short trunk, built of many lumpy clumps, mostly fog-coloured.
function maple(ctx, rnd, base) {
  const fog = fogAt(base[2]), dark = paint.aerial([30, 42, 34], fog, FOG);
  const top = P(add(base, [0, 3.4, 0])), foot = P(base), k = cam.focal / cam.project(base)[2];
  ctx.strokeStyle = shade(dark); ctx.lineWidth = .5 * k; ctx.beginPath(); ctx.moveTo(...foot); ctx.lineTo(...top); ctx.stroke();
  for (let i = 0; i < 90; i++) {
    const a = rnd() * TAU, r = Math.sqrt(rnd());
    const p = P(add(base, [Math.cos(a) * r * 6.5, 6 + Math.sin(a) * r * 3.6 + 1.2 * (1 - r), 0]));
    glow(ctx, p[0], p[1], (1 + rnd()) * k, (.8 + rnd() * .6) * k, shade(dark, (rnd() - .5) * 20).slice(5, -3), .7);
  }
}

// A zigzag rail fence: posts are the crossings of rails, rails stacked four high, each at its own angle.
function fence(ctx, rnd) {
  const corners = [];
  for (let i = 0; i < 16; i++) {
    const t = i / 15, z = lerp(4, 46, t), x = lerp(-8, 30, t) + (i % 2 ? 1.6 : -1.6);
    corners.push([x, ground(x, z), z]);
  }
  for (let i = corners.length - 1; i > 0; i--) {
    const a = corners[i - 1], b = corners[i], fog = fogAt(b[2]);
    for (let r = 0; r < 4; r++) {
      const h0 = .18 + r * .32 + (i % 2 ? .16 : 0), sag = .04 + rnd() * .05;
      const pa = add(a, [0, h0, 0]), pb = add(b, [0, h0 + (rnd() - .5) * .08, 0]), mid = add(v3.lerp(pa, pb, .5), [0, -sag, 0]);
      const sa = P(pa), sb = P(pb), sm = P(mid), w = Math.max(1.2, .1 * cam.focal / cam.project(pa)[2]);
      ctx.strokeStyle = shade(paint.aerial([86, 76, 64], fog, FOG), (rnd() - .5) * 20); ctx.lineWidth = w; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(...sa); ctx.quadraticCurveTo(sm[0] * 2 - (sa[0] + sb[0]) / 2, sm[1] * 2 - (sa[1] + sb[1]) / 2, ...sb); ctx.stroke();
      ctx.strokeStyle = shade(paint.aerial([150, 150, 136], fog, FOG), 0, .35); ctx.lineWidth = w * .3;
      ctx.beginPath(); ctx.moveTo(sa[0], sa[1] - w * .3); ctx.lineTo(sb[0], sb[1] - w * .3); ctx.stroke();
    }
  }
}

// A horse in side view, sized by distance: barrel, deep chest, neck and head (down to graze or up),
// four legs with the near pair darker, a tail and mane, a thin rim of dawn light along its back.
function horse(ctx, base, facing, headDown, coat, rnd) {
  const s = cam.project(base), k = cam.focal / s[2] * 1.05, f = facing;
  const X = dx => s[0] + dx * k * f, Y = dy => s[1] - dy * k;
  const fog = fogAt(base[2]), c = paint.aerial(coat, fog, FOG), dim = paint.aerial(coat.map(v => v * .7), fog, FOG);
  // far legs
  ctx.strokeStyle = shade(dim); ctx.lineCap = 'round'; ctx.lineWidth = .11 * k;
  for (const [x0, x1] of [[-.55, -.62], [.62, .55]]) { ctx.beginPath(); ctx.moveTo(X(x0), Y(.9)); ctx.lineTo(X(x1), Y(0)); ctx.stroke(); }
  // barrel and chest
  ctx.fillStyle = shade(c);
  ctx.beginPath(); ctx.ellipse(X(0), Y(1.25), .9 * k, .38 * k, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(X(.62), Y(1.22), .34 * k, .42 * k, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(X(-.68), Y(1.3), .34 * k, .4 * k, 0, 0, TAU); ctx.fill();
  // neck and head
  const nx = headDown ? .95 : .9, ny = headDown ? .9 : 1.55, hx = headDown ? 1.3 : 1.25, hy = headDown ? .25 : 1.9;
  ctx.beginPath(); ctx.moveTo(X(.55), Y(1.5)); ctx.quadraticCurveTo(X(nx), Y(ny + .3), X(hx), Y(hy + .15)); ctx.lineTo(X(hx + .1), Y(hy - .15));
  ctx.quadraticCurveTo(X(nx - .05), Y(ny - .25), X(.7), Y(1.05)); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(X(hx + .12), Y(hy - .05), .26 * k, .12 * k, (headDown ? 1.3 : -.4) * f, 0, TAU); ctx.fill();
  // mane and tail
  ctx.strokeStyle = shade(dim, -20); ctx.lineWidth = .06 * k;
  ctx.beginPath(); ctx.moveTo(X(.55), Y(1.6)); ctx.quadraticCurveTo(X(nx - .05), Y(ny + .45), X(hx - .1), Y(hy + .3)); ctx.stroke();
  ctx.lineWidth = .08 * k; ctx.beginPath(); ctx.moveTo(X(-.95), Y(1.4)); ctx.quadraticCurveTo(X(-1.15), Y(1.1), X(-1.05), Y(.55)); ctx.stroke();
  // near legs with hocks and knees
  ctx.strokeStyle = shade(c, -10); ctx.lineWidth = .12 * k;
  for (const [x0, xm, x1] of [[-.7, -.78, -.66], [.58, .6, .66]]) { ctx.beginPath(); ctx.moveTo(X(x0), Y(1)); ctx.lineTo(X(xm), Y(.5)); ctx.lineTo(X(x1), Y(0)); ctx.stroke(); }
  // rim light along the top line from the bright east behind
  ctx.strokeStyle = `rgba(240,220,180,${.35 * (1 - fog)})`; ctx.lineWidth = .03 * k;
  ctx.beginPath(); ctx.moveTo(X(-.9), Y(1.6)); ctx.quadraticCurveTo(X(0), Y(1.68), X(.55), Y(1.62)); ctx.stroke();
  glow(ctx, X(0), Y(0), 1.1 * k, .15 * k, '20,26,22', .4);
}

function fogLayer(make, rnd, height, alpha) {
  const strip = make(W * 2, height), c = strip.getContext('2d');
  for (let i = 0; i < 60; i++) {
    const x = rnd() * W * 2;
    for (const dx of [0, -W * 2, W * 2]) glow(c, x + dx, height / 2 + (rnd() - .5) * height * .4, 220 + rnd() * 420, height * (.12 + rnd() * .2), '190,198,192', alpha * (.5 + rnd() * .6));
  }
  return strip;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(92011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  pasture(ctx, rnd);
  maple(ctx, rnd, [-14, ground(-14, 70), 70]);
  fence(ctx, rnd);
  horse(ctx, [3.4, ground(3.4, 24), 24], 1, true, [44, 34, 30], rnd);
  horse(ctx, [-1.6, ground(-1.6, 30), 30], -1, false, [70, 64, 60], rnd);
  // tall wet grass right at our feet, dark against the field, a few seed heads catching the light
  for (let i = 0; i < 700; i++) {
    const x = rnd() * W, y = H - rnd() ** 2.5 * 160, h = 40 + rnd() * 130, lean = (rnd() - .4) * .5;
    ctx.strokeStyle = shade([26, 38, 28], (rnd() - .5) * 16, .9); ctx.lineWidth = 1 + rnd() * 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + h * lean * .3, y - h * .6, x + h * lean, y - h); ctx.stroke();
    if (rnd() < .08) { ctx.fillStyle = 'rgba(200,196,160,.6)'; ctx.beginPath(); ctx.ellipse(x + h * lean, y - h, 2, 6, lean, 0, TAU); ctx.fill(); }
  }
  paint.applyTexture(ctx, make, 9201, .38, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.84, .86, .88], lights: [paint.LIGHT.dawn(HORIZON, .12, 1300, 900)] })(ctx);
  const layers = [[fogLayer(make, rnd, 240, .2), P([0, 0, 50])[1] - 120, 1], [fogLayer(make, rnd, 260, .12), P([0, 0, 30])[1] - 150, 1], [fogLayer(make, rnd, 220, .08), H - 260, 2]];
  // the wind's passing waves over the grass: pale bands sliding across the ground
  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (let k = 0; k < 2; k++) {
      const x = ((phase + k * .5) % 1) * (W + 1000) - 500;
      target.save(); target.translate(x, P([0, 0, 12])[1]); target.rotate(-.2);
      glow(target, 0, 0, 220, 600, '200,214,180', .08);
      target.restore();
    }
    for (const [img, y, turns] of layers) {
      const x = (phase * turns * W * 2) % (W * 2);
      target.drawImage(img, -x, y); target.drawImage(img, W * 2 - x, y);
    }
  };
}

module.exports = {
  title: '안개가 흐르는 목초지',
  slug: 'drifting-fog-over-the-pasture',
  sound: 'gust',
  createScene,
};
