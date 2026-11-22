'use strict';

// 46 · 이슬을 머금은 거미줄
// An orb web strung between two stems of tall grass at dawn, the low sun behind it. Its radii and the long
// spiral are threaded with dew, so every strand is a line of tiny lit beads; the frame threads anchor to
// the stems and a seed head. The meadow behind is a soft blur of gold and green. The air moves: the web
// breathes in and out a little and the stems sway with it, and the beads flicker as the angle to the sun
// changes.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow } = paint;

function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function background(make, rnd) {
  const bg = make(W, H), c = bg.getContext('2d');
  c.fillStyle = vertical(c, 0, H, [[0, '#34404e'], [.4, '#8a7a64'], [.55, '#b49a74'], [.7, '#4e5a3c'], [1, '#1e2618']]);
  c.fillRect(0, 0, W, H);
  glow(c, 1300, 560, 600, 260, '255,220,160', .35);
  for (let i = 0; i < 300; i++) { const x = rnd() * W, y = 560 + rnd() * 520, h = 40 + rnd() * 200; c.strokeStyle = `rgba(${60 + rnd() * 60},${80 + rnd() * 50},50,.5)`; c.lineWidth = 3 + rnd() * 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rnd() - .5) * 40, y - h); c.stroke(); }
  for (let i = 0; i < 50; i++) { c.fillStyle = `rgba(255,236,200,${.06 + rnd() * .12})`; c.beginPath(); c.arc(rnd() * W, 300 + rnd() * 600, 12 + rnd() * 30, 0, TAU); c.fill(); }
  const out = make(W, H), o = out.getContext('2d');
  o.filter = 'blur(20px)'; o.drawImage(bg, 0, 0);
  return out;
}

// Grass stems that hold the web, each with a seed head; returns the stem's points so threads can anchor.
function stalk(ctx, base, lean, len, sway, head) {
  const pts = [];
  for (let i = 0; i <= 30; i++) { const t = i / 30, a = -Math.PI / 2 + lean + sway * t * t; pts.push(i ? [pts[i - 1][0] + Math.cos(a) * len / 30, pts[i - 1][1] + Math.sin(a) * len / 30] : base); }
  ctx.strokeStyle = '#3a3a24'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,160,.6)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0] + 2, p[1]) : ctx.moveTo(p[0] + 2, p[1]))); ctx.stroke();
  if (head) {
    const tip = pts[30];
    for (let k = 0; k < 18; k++) { const a = -Math.PI / 2 + lean + sway + (k / 18 - .5) * .9, l = 40 + (k % 3) * 12; ctx.strokeStyle = 'rgba(200,170,110,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...tip); ctx.lineTo(tip[0] + Math.cos(a) * l * .3, tip[1] + Math.sin(a) * l); ctx.stroke(); }
  }
  return pts;
}

// Thread of dew: a line of beads, brighter where the thread faces the sun's glow.
function dewLine(ctx, a, b, spacing, phase, seed) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.floor(len / spacing));
  ctx.strokeStyle = 'rgba(230,230,220,.25)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  for (let i = 0; i < n; i++) {
    const t = (i + .5) / n, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t);
    const glint = .5 + .5 * Math.sin(TAU * phase * 2 + seed * 13 + i * 1.7);
    const r = 1 + ((i * 7 + seed) % 5) * .35;
    ctx.fillStyle = `rgba(255,246,226,${.18 + glint * .4})`; ctx.beginPath(); ctx.arc(x, y, r * .8, 0, TAU); ctx.fill();
    if (glint > .985) glow(ctx, x, y, 7, 7, '255,240,210', .45);
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(46011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.drawImage(background(make, rnd), 0, 0);
  paint.applyTexture(ctx, make, 4601, .28, 0, 0, W, H, true);
  const centre = [980, 500], radii = 26;
  const spokes = Array.from({ length: radii }, (_, i) => ({ a: i / radii * TAU + (rnd() - .5) * .08, r: 300 + rnd() * 80 }));
  const turns = 17;

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    const breath = 1 + .025 * Math.sin(TAU * phase * 2), shift = 14 * Math.sin(TAU * phase * 2 + .6);
    const left = stalk(target, [420, H + 20], .22, 1000, .05 * Math.sin(TAU * phase * 2), true);
    const right = stalk(target, [1560, H + 20], -.18, 1050, .05 * Math.sin(TAU * phase * 2 + .5), false);
    const c = [centre[0] + shift, centre[1] + shift * .3];
    const at = (s, t) => [c[0] + Math.cos(s.a) * s.r * breath * t, c[1] + Math.sin(s.a) * s.r * breath * t * .95];
    // frame threads from the web's edge to the stems and the seed head
    dewLine(target, at(spokes[0], 1), right[22], 9, phase, 1);
    dewLine(target, at(spokes[Math.floor(radii / 2)], 1), left[20], 9, phase, 2);
    dewLine(target, at(spokes[Math.floor(radii * .75)], 1), left[29], 9, phase, 3);
    dewLine(target, at(spokes[Math.floor(radii / 4)], 1), [c[0] + 60, H + 40], 9, phase, 4);
    for (const [i, s] of spokes.entries()) dewLine(target, c, at(s, 1), 10, phase, i + 10);
    // the spiral: a polyline from turn to turn, beads close together
    for (let t = 0; t < turns; t++) {
      for (let i = 0; i < radii; i++) {
        const s0 = spokes[i], s1 = spokes[(i + 1) % radii], k0 = .12 + (t + i / radii) / turns * .86, k1 = .12 + (t + (i + 1) / radii) / turns * .86;
        if (k1 > .98) continue;
        dewLine(target, at(s0, k0), at(s1, k1), 12, phase, t * radii + i);
      }
    }
    glow(target, c[0], c[1], 30, 30, '255,240,210', .3);
  };
}

module.exports = {
  title: '이슬을 머금은 거미줄',
  slug: 'dew-along-the-silk',
  sound: 'grass',
  createScene,
};
