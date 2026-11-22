'use strict';

// 98 · 서리 낀 목책과 들풀
// Close to the ground at the edge of a meadow on a frosty dawn. An old split fence post fills the left of
// the frame, its grain opened by weather and every ridge furred with frost; two strands of rusted wire run
// from it off into the soft distance. Wild grasses stand in front and behind: foxtails, timothy, bent
// seed heads, each rimmed white with hoar. The far field is out of focus, a wash of blue shadow and the
// first warm light low behind it. The wind moves the grass a little.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, wobble } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// The far field, painted then blurred heavily: shallow depth of field.
function background(make, rnd) {
  const bg = make(W, H), c = bg.getContext('2d');
  c.fillStyle = vertical(c, 0, H, [[0, '#4a5a78'], [.45, '#8a8ea0'], [.58, '#e0b890'], [.66, '#7a8090'], [1, '#3a4252']]);
  c.fillRect(0, 0, W, H);
  glow(c, 1350, 640, 600, 180, '255,210,160', .5);
  for (let i = 0; i < 40; i++) glow(c, rnd() * W, 620 + rnd() * 200, 100 + rnd() * 300, 20 + rnd() * 40, rnd() < .5 ? '70,80,100' : '150,150,160', .4);
  // distant post line and trees, soft
  for (let i = 0; i < 9; i++) { const x = 900 + i * 120 + rnd() * 40; c.fillStyle = 'rgba(40,46,60,.6)'; c.fillRect(x, 600 - 30 * (1 - i / 9), 8, 80); }
  for (let i = 0; i < 6; i++) glow(c, 200 + rnd() * 1500, 560 + rnd() * 40, 80 + rnd() * 120, 60 + rnd() * 50, '50,58,76', .7);
  // bokeh: out-of-focus frost glints as soft discs
  for (let i = 0; i < 60; i++) {
    const x = rnd() * W, y = 500 + rnd() * 500, r = 8 + rnd() * 26;
    c.fillStyle = `rgba(255,230,200,${.05 + rnd() * .12})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  const out = make(W, H), o = out.getContext('2d');
  o.filter = 'blur(14px)'; o.drawImage(bg, 0, 0);
  return out;
}

// The post: a split timber with deep weather checks running along the grain, frost on every ridge.
function post(ctx, rnd) {
  const left = [], right = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30, y = lerp(-40, H + 20, t);
    left.push([lerp(120, 96, t) + 8 * Math.sin(t * 7) , y]); right.push([lerp(430, 470, t) + 6 * Math.sin(t * 5 + 1), y]);
  }
  const body = wobble(left.concat(right.reverse()), 3, 981, 14);
  const g = ctx.createLinearGradient(100, 0, 470, 0);
  g.addColorStop(0, '#2a2a2e'); g.addColorStop(.3, '#5a564e'); g.addColorStop(.7, '#4a463e'); g.addColorStop(1, '#1e1e22');
  fill(ctx, body, g);
  ctx.save(); pathOf(ctx, body); ctx.clip();
  // grain: long wandering lines, and deep checks with frost on their lips
  for (let i = 0; i < 60; i++) {
    const x0 = 110 + rnd() * 350, wav = rnd() * 6;
    ctx.strokeStyle = `rgba(20,18,18,${.2 + rnd() * .3})`; ctx.lineWidth = 1 + rnd() * 2;
    ctx.beginPath(); for (let y = -40; y < H + 40; y += 20) ctx.lineTo(x0 + Math.sin(y * .01 + wav) * 8, y); ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const x0 = 160 + rnd() * 250, y0 = rnd() * H * .6, len = 200 + rnd() * 400, pts = [];
    for (let y = y0; y < y0 + len; y += 10) pts.push([x0 + Math.sin(y * .02) * 6 + (rnd() - .5) * 2, y]);
    ctx.strokeStyle = '#0c0c0e'; ctx.lineWidth = 4 + rnd() * 4; ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
    ctx.strokeStyle = 'rgba(230,236,246,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0] - 4, p[1]) : ctx.moveTo(p[0] - 4, p[1]))); ctx.stroke();
  }
  // hoar frost: tiny crystals scattered thickest on the side facing the open sky
  for (let i = 0; i < 2600; i++) {
    const x = 100 + rnd() ** .7 * 370, y = rnd() * H, a = rnd() * TAU, l = 1 + rnd() * 4;
    ctx.strokeStyle = `rgba(230,238,250,${.25 + rnd() * .5})`; ctx.lineWidth = .8;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
  }
  ctx.restore();
  // lichen patches, grey-green
  for (let i = 0; i < 8; i++) glow(ctx, 160 + rnd() * 260, 200 + rnd() * 700, 20 + rnd() * 30, 14 + rnd() * 20, '120,130,100', .4);
}

// Two strands of barbed wire stapled to the post, running away in perspective and sagging.
function wire(ctx, rnd) {
  for (const [y0, y1] of [[380, 560], [640, 610]]) {
    const pts = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([lerp(440, 1900, t), lerp(y0, y1, t) + 26 * Math.sin(t * Math.PI) * (1 - t)]); }
    ctx.strokeStyle = '#3a2820'; ctx.lineWidth = 4; ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
    ctx.strokeStyle = 'rgba(230,236,246,.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1] - 2) : ctx.moveTo(p[0], p[1] - 2))); ctx.stroke();
    // barbs, smaller with distance
    for (let i = 1; i < 14; i++) {
      const t = (i / 14) ** 1.6, p = pts[Math.round(t * 40)], s = lerp(12, 2, t);
      ctx.strokeStyle = '#2a1c16'; ctx.lineWidth = Math.max(1, s * .25);
      ctx.beginPath(); ctx.moveTo(p[0] - s, p[1] - s); ctx.lineTo(p[0] + s, p[1] + s); ctx.moveTo(p[0] + s, p[1] - s); ctx.lineTo(p[0] - s, p[1] + s); ctx.stroke();
    }
    fill(ctx, [[436, y0 - 8], [452, y0 - 8], [452, y0 + 8], [436, y0 + 8]], '#5a5a60');
  }
}

// Grasses: each stem its own curve; heads of three kinds, rimmed with frost.
function makeGrass(rnd) {
  return Array.from({ length: 70 }, () => {
    const near = rnd() < .35;
    return {
      x: 300 + rnd() * 1650, base: H + 20, h: near ? 500 + rnd() * 450 : 220 + rnd() * 300, lean: (rnd() - .4) * .35,
      kind: Math.floor(rnd() * 3), w: near ? 2.6 + rnd() * 2 : 1 + rnd(), blur: near ? 0 : 1, lag: rnd() * TAU, head: near ? 70 + rnd() * 60 : 30 + rnd() * 30,
    };
  }).sort((a, b) => a.w - b.w);
}
function drawGrass(ctx, g, sway) {
  const lean = g.lean + sway, tip = [g.x + Math.sin(lean) * g.h, g.base - Math.cos(lean) * g.h];
  const ctrl = [g.x + Math.sin(lean * .3) * g.h * .5, g.base - g.h * .55];
  ctx.strokeStyle = g.blur ? 'rgba(90,90,80,.6)' : '#6a6450'; ctx.lineWidth = g.w;
  ctx.beginPath(); ctx.moveTo(g.x, g.base); ctx.quadraticCurveTo(...ctrl, ...tip); ctx.stroke();
  ctx.strokeStyle = 'rgba(230,238,250,.5)'; ctx.lineWidth = g.w * .35;
  ctx.beginPath(); ctx.moveTo(g.x - g.w * .3, g.base); ctx.quadraticCurveTo(ctrl[0] - g.w * .3, ctrl[1], tip[0] - g.w * .3, tip[1]); ctx.stroke();
  const dir = Math.atan2(tip[1] - ctrl[1], tip[0] - ctrl[0]);
  if (g.kind === 0) {           // foxtail: a soft bristly cylinder
    for (let i = 0; i < 26; i++) {
      const t = i / 26, cx = tip[0] - Math.cos(dir) * g.head * t, cy = tip[1] - Math.sin(dir) * g.head * t, a = dir + Math.PI / 2 + (i % 2 ? 1 : -1) * .7;
      ctx.strokeStyle = i % 3 ? 'rgba(200,190,160,.8)' : 'rgba(240,244,252,.9)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * g.head * .14, cy + Math.sin(a) * g.head * .14); ctx.stroke();
    }
  } else if (g.kind === 1) {    // timothy: a dense narrow spike
    ctx.strokeStyle = '#8a8268'; ctx.lineWidth = g.w * 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(...tip); ctx.lineTo(tip[0] - Math.cos(dir) * g.head, tip[1] - Math.sin(dir) * g.head); ctx.stroke();
    ctx.strokeStyle = 'rgba(236,242,252,.7)'; ctx.lineWidth = g.w;
    ctx.beginPath(); ctx.moveTo(tip[0] - 1, tip[1]); ctx.lineTo(tip[0] - Math.cos(dir) * g.head - 1, tip[1] - Math.sin(dir) * g.head); ctx.stroke();
  } else {                      // bent grass: an airy spray of fine branches with seeds at the tips
    for (let i = 0; i < 9; i++) {
      const t = i / 9, a = dir + (i % 2 ? .6 : -.6) + (t - .5) * .4, l = g.head * (.4 + (1 - t) * .5);
      const sx = tip[0] - Math.cos(dir) * g.head * t, sy = tip[1] - Math.sin(dir) * g.head * t;
      ctx.strokeStyle = 'rgba(150,140,110,.8)'; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l); ctx.stroke();
      ctx.fillStyle = 'rgba(236,242,252,.9)'; ctx.beginPath(); ctx.arc(sx + Math.cos(a) * l, sy + Math.sin(a) * l, 1.6, 0, TAU); ctx.fill();
    }
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(98011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.drawImage(background(make, rnd), 0, 0);
  const grass = makeGrass(rnd);
  const far = grass.filter(g => g.blur), near = grass.filter(g => !g.blur);
  // far grass is behind the post and slightly soft: drawn on its own layer and blurred once
  const farLayer = make(W, H), fc = farLayer.getContext('2d');
  for (const g of far) drawGrass(fc, g, 0);
  ctx.save(); ctx.filter = 'blur(2px)'; ctx.drawImage(farLayer, 0, 0); ctx.restore();
  wire(ctx, rnd);
  post(ctx, rnd);
  paint.applyTexture(ctx, make, 9801, .34, 0, 0, W, H, true);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const g of near) drawGrass(target, g, .05 * Math.sin(TAU * phase * 2 + g.lag) + .03 * Math.sin(TAU * phase * 5 + g.lag * 2));
  };
}

module.exports = {
  title: '서리 낀 목책과 들풀',
  slug: 'frosted-fence-and-wild-grass',
  sound: 'grass',
  createScene,
};
