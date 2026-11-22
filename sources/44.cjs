'use strict';

// 44 · 이슬 맺힌 고사리 잎
// Close among the ferns on a forest floor at first light. Three or four fronds arch through the frame,
// each a stalk carrying paired pinnae that shrink toward the tip, every pinna cut into its own lobes; one
// young fiddlehead is still uncurling. Dew hangs in beads along the edges and catches the cool light that
// filters down from behind. The forest behind is out of focus: dark trunks, soft green, a few glints. Now
// and then a bead at a tip grows heavy and drops.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade } = paint;

function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function background(make, rnd) {
  const bg = make(W, H), c = bg.getContext('2d');
  c.fillStyle = vertical(c, 0, H, [[0, '#1e3028'], [.5, '#3a5440'], [1, '#141c16']]);
  c.fillRect(0, 0, W, H);
  glow(c, 1300, 260, 700, 500, '200,220,190', .4);
  for (let i = 0; i < 9; i++) { const x = rnd() * W, w = 40 + rnd() * 90; c.fillStyle = `rgba(16,24,20,${.4 + rnd() * .4})`; c.fillRect(x, 0, w, H); }
  for (let i = 0; i < 60; i++) glow(c, rnd() * W, rnd() * H, 60 + rnd() * 160, 40 + rnd() * 120, rnd() < .5 ? '60,90,60' : '20,34,26', .4);
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(230,240,220,${.05 + rnd() * .12})`; c.beginPath(); c.arc(rnd() * W, rnd() * H * .7, 10 + rnd() * 30, 0, TAU); c.fill(); }
  const out = make(W, H), o = out.getContext('2d');
  o.filter = 'blur(18px)'; o.drawImage(bg, 0, 0);
  return out;
}

// A frond: a curved rachis; pinnae in pairs, each a tapering blade with lobed edges; returns tip points
// where dew collects.
function frond(ctx, rnd, f, sway, blur) {
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, a = f.angle + f.bend * t * t + sway * t * t;
    pts.push(i ? [pts[i - 1][0] + Math.cos(a) * f.len / 40, pts[i - 1][1] + Math.sin(a) * f.len / 40] : f.base);
  }
  const dark = shade(f.color, -40), mid = shade(f.color), lit = shade(f.color, 36);
  ctx.strokeStyle = dark; ctx.lineWidth = f.w; ctx.lineCap = 'round';
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  const tips = [];
  for (let i = 6; i < 40; i += 2) {
    const t = i / 40, p = pts[i], q = pts[i + 1], dir = Math.atan2(q[1] - p[1], q[0] - p[0]);
    const len = f.len * .22 * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (1 - t * .4);
    for (const side of [-1, 1]) {
      const a = dir + side * (1.25 - t * .3), lobes = Math.max(3, Math.round(len / 10));
      // the pinna's outline: a tapering blade whose edges are scalloped into lobes
      const outline = [p];
      for (let k = 1; k <= lobes; k++) {
        const s = k / lobes, w = len * .16 * (1 - s) + 1, cx = p[0] + Math.cos(a) * len * s, cy = p[1] + Math.sin(a) * len * s;
        outline.push([cx + Math.cos(a - Math.PI / 2) * w * side, cy + Math.sin(a - Math.PI / 2) * w * side]);
      }
      const tip = [p[0] + Math.cos(a) * len, p[1] + Math.sin(a) * len];
      outline.push(tip);
      for (let k = lobes; k >= 1; k--) {
        const s = k / lobes, w = len * .16 * (1 - s) + 1, cx = p[0] + Math.cos(a) * len * (s - .5 / lobes), cy = p[1] + Math.sin(a) * len * (s - .5 / lobes);
        outline.push([cx - Math.cos(a - Math.PI / 2) * w * side * .8, cy - Math.sin(a - Math.PI / 2) * w * side * .8]);
      }
      const g = ctx.createLinearGradient(p[0], p[1], tip[0], tip[1]);
      g.addColorStop(0, dark); g.addColorStop(.4, side > 0 ? lit : mid); g.addColorStop(1, mid);
      pathOf(ctx, outline); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = shade(f.color, -30, .5); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...tip); ctx.stroke();
      if (!blur && rnd() < .35) tips.push(tip);
      // dew beads along the edge
      if (!blur) for (let d = 0; d < 2; d++) if (rnd() < .3) { const b = outline[1 + Math.floor(rnd() * lobes)]; bead(ctx, b[0], b[1], 1.5 + rnd() * 2.5); }
    }
  }
  return tips;
}

// A bead of dew: dark rim, a bright highlight up toward the light, a faint caustic below.
function bead(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(30,46,36,.6)'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(210,230,214,.55)'; ctx.beginPath(); ctx.arc(x, y, r * .78, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(x - r * .3, y - r * .35, r * .25, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(230,250,230,.5)'; ctx.beginPath(); ctx.arc(x + r * .2, y + r * .35, r * .2, 0, TAU); ctx.fill();
}

// The fiddlehead: a young frond still coiled, a spiral of furred stalk.
function fiddlehead(ctx, x, y, s) {
  ctx.strokeStyle = '#4a6a34'; ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y + 220 * s); ctx.quadraticCurveTo(x - 20 * s, y + 80 * s, x, y);
  for (let i = 0; i < 40; i++) { const a = i / 40 * TAU * 1.6, r = 40 * s * (1 - i / 44); ctx.lineTo(x + Math.cos(a) * r - 40 * s * .1, y - Math.sin(a) * r * .9 - 30 * s); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(160,140,100,.6)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 30; i++) { const a = i / 30 * TAU * 1.5, r = 40 * s * (1 - i / 44); const px = x + Math.cos(a) * r - 4 * s, py = y - Math.sin(a) * r * .9 - 30 * s; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 3, py - 4); ctx.stroke(); }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(44011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.drawImage(background(make, rnd), 0, 0);
  // ferns behind, soft
  const back = make(W, H), bc = back.getContext('2d');
  for (let i = 0; i < 5; i++) frond(bc, rnd, { base: [rnd() * W, H + 40], angle: -Math.PI / 2 - .6 + rnd() * 1.2, bend: (rnd() - .5) * 1.2, len: 400 + rnd() * 300, w: 3, color: [50, 76, 50] }, 0, true);
  ctx.save(); ctx.filter = 'blur(6px)'; ctx.globalAlpha = .8; ctx.drawImage(back, 0, 0); ctx.restore();
  fiddlehead(ctx, 1500, 640, 1.3);
  paint.applyTexture(ctx, make, 4401, .3, 0, 0, W, H, true);
  const fronds = [
    { base: [180, H + 30], angle: -1.05, bend: 1.3, len: 1150, w: 6, color: [70, 112, 56], lag: 0 },
    { base: [760, H + 40], angle: -1.55, bend: -1.1, len: 980, w: 5, color: [84, 124, 60], lag: 1.4 },
    { base: [1240, H + 30], angle: -2.1, bend: -.9, len: 900, w: 5, color: [64, 102, 52], lag: 2.6 },
  ];
  const tips = [];
  // pick drip points from a still pose, so drops fall from leaf tips
  const probe = make(W, H);
  for (const f of fronds) tips.push(...frond(probe.getContext('2d'), paint.seeded(4402 + f.lag * 10), f, 0, false));
  const drips = tips.slice(0, 8).map(t => ({ t, offset: rnd(), turns: 1 + Math.floor(rnd() * 2) }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const f of fronds) frond(target, paint.seeded(4402 + f.lag * 10), f, .04 * Math.sin(TAU * phase + f.lag), false);
    for (const d of drips) {
      const age = (phase * d.turns + d.offset) % 1;
      if (age < .7) bead(target, d.t[0], d.t[1] + 3, 2 + age * 4);
      else { const f = (age - .7) / .3; target.fillStyle = `rgba(220,240,226,${.8 * (1 - f)})`; target.fillRect(d.t[0] - 1.5, d.t[1] + 6 + f * f * 500, 3, 8); }
    }
  };
}

module.exports = {
  title: '이슬 맺힌 고사리 잎',
  slug: 'dew-on-the-ferns',
  sound: 'drips',
  createScene,
};
