'use strict';

// 74 · 옥상 빨랫줄의 흰 셔츠
// A flat concrete rooftop above a dense old neighbourhood, just before dawn. Two lines strung between a
// rusted pipe frame and the stairwell hut carry white shirts, a sheet and a few small things pegged by their
// shoulders; the wind fills and lifts them in turn. Around: a cylindrical water tank on legs, potted chili
// plants and a styrofoam box garden along the parapet, a plastic chair. Beyond the parapet the roofs fall
// away in steps to a city whose last lights are going out under a sky turning from navy to pale violet.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: 0, y: 1.7, z: 0, yaw: .12, pitch: .04, focal: 950, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(.12) * 1e6, 1.7, Math.cos(.12) * 1e6])[1];
const PARAPET = 9;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function city(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 60, [[0, '#1a1e3a'], [.55, '#4a4a6e'], [.85, '#a08098'], [1, '#d8a898']]);
  ctx.fillRect(0, 0, W, H);
  glow(ctx, 1300, HORIZON + 40, 900, 160, '255,200,170', .3);
  paint.starfield(ctx, rnd, 50, HORIZON * .4);
  // layers of roofs: far ones pale and small, nearer ones darker with lit windows going out
  for (let layer = 0; layer < 5; layer++) {
    const z = 400 - layer * 80, base = P([0, -6 - layer * 3, z])[1], tone = [lerp(120, 34, layer / 4), lerp(110, 32, layer / 4), lerp(140, 46, layer / 4)];
    let x = -120;
    while (x < W + 120) {
      const w = 30 + rnd() * (40 + layer * 30), h = 20 + rnd() * (30 + layer * 30), top = base - h;
      ctx.fillStyle = shade(tone, (rnd() - .5) * 10);
      if (rnd() < .5) { ctx.fillRect(x, top, w, base - top + 400); }
      else { ctx.beginPath(); ctx.moveTo(x, base + 400); ctx.lineTo(x, top + 10); ctx.lineTo(x + w / 2, top - 6); ctx.lineTo(x + w, top + 10); ctx.lineTo(x + w, base + 400); ctx.fill(); }
      if (layer > 1) for (let i = 0; i < 3; i++) if (rnd() < .2) { ctx.fillStyle = '#e8b070'; ctx.fillRect(x + rnd() * (w - 6), top + 14 + rnd() * h, 3 + layer, 3 + layer); }
      if (layer > 2 && rnd() < .25) { ctx.fillStyle = shade(tone, -6); ctx.fillRect(x + w * .3, top - 26, w * .3, 26); }
      x += w + rnd() * 6;
    }
  }
}

function roof(ctx, rnd) {
  // the concrete deck, stained and patched, with the parapet's low wall
  const deck = (u, v) => P([lerp(-7, 9, u), 0, lerp(PARAPET, 1.2, v)]);
  fill(ctx, paint.outline(deck, 8), '#46464c');
  ctx.save(); pathOf(ctx, paint.outline(deck, 8)); ctx.clip();
  for (let i = 0; i < 90; i++) { const p = deck(rnd(), rnd()); glow(ctx, p[0], p[1], 40 + rnd() * 120, 10 + rnd() * 30, rnd() < .6 ? '20,20,24' : '140,140,140', .08 + rnd() * .1); }
  for (let i = 0; i < 14; i++) { const a = deck(rnd(), rnd()); ctx.strokeStyle = 'rgba(20,20,24,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...a); for (let s = 0; s < 5; s++) ctx.lineTo(a[0] + (rnd() - .5) * 120 * (s + 1) / 5, a[1] + (rnd() - .5) * 20 * (s + 1) / 5); ctx.stroke(); }
  ctx.restore();
  const wall = (u, v) => P([lerp(-7, 9, u), lerp(1, 0, v), PARAPET]);
  fill(ctx, paint.outline(wall, 4), '#6a6a6c');
  fill(ctx, [wall(0, 0), wall(1, 0), P([9, 1, PARAPET + .2]), P([-7, 1, PARAPET + .2])], '#8a8a88');
  // styrofoam boxes with greens and chili pots along the parapet
  for (let i = 0; i < 9; i++) {
    const x = -5.5 + i * 1.3 + (rnd() - .5) * .3, at = [x, 0, PARAPET - .4];
    paint.box(ctx, cam, { at, sa: .32, sb: .2, h: .3 }, n => (n === 'top' ? '#d8d8d4' : n === 'front' ? '#c8c8c2' : '#b0b0aa'));
    const t = P([x, .3, PARAPET - .4]), k = cam.focal / (PARAPET - .4);
    for (let l = 0; l < 14; l++) { ctx.fillStyle = shade([60, 100, 50], (rnd() - .5) * 30); ctx.beginPath(); ctx.ellipse(t[0] + (rnd() - .5) * .5 * k, t[1] - rnd() * .3 * k, .05 * k, .025 * k, rnd() * 3, 0, TAU); ctx.fill(); }
    if (i % 3 === 1) for (let c = 0; c < 4; c++) { ctx.fillStyle = '#c8302a'; ctx.beginPath(); ctx.ellipse(t[0] + (rnd() - .5) * .4 * k, t[1] - rnd() * .25 * k, .012 * k, .04 * k, .3, 0, TAU); ctx.fill(); }
  }
  // the water tank on legs at the right
  const tk = [6, 0, 6.5], tb = P(tk), k = cam.focal / cam.project([6, 1.5, 6.5])[2];
  for (const dx of [-.5, .5]) { ctx.strokeStyle = '#3a3230'; ctx.lineWidth = .08 * k; ctx.beginPath(); ctx.moveTo(tb[0] + dx * k, tb[1]); ctx.lineTo(tb[0] + dx * .8 * k, tb[1] - 1 * k); ctx.stroke(); }
  const g = ctx.createLinearGradient(tb[0] - .8 * k, 0, tb[0] + .8 * k, 0); g.addColorStop(0, '#3a5a7a'); g.addColorStop(.4, '#5a7a9a'); g.addColorStop(1, '#2a3a52');
  ctx.fillStyle = g; ctx.fillRect(tb[0] - .8 * k, tb[1] - 2.4 * k, 1.6 * k, 1.4 * k);
  ctx.fillStyle = '#4a6a8a'; ctx.beginPath(); ctx.ellipse(tb[0], tb[1] - 2.4 * k, .8 * k, .14 * k, 0, 0, TAU); ctx.fill();
  for (let r = 1; r < 4; r++) { ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(tb[0], tb[1] - 2.4 * k + r * .35 * k, .8 * k, .14 * k, 0, 0, Math.PI); ctx.stroke(); }
  // the stairwell hut at the left, its door ajar with a light inside
  paint.box(ctx, cam, { at: [-5.6, 0, 4.4], sa: 1.2, sb: 1.4, h: 2.4 }, n => (n === 'top' ? '#7a7a7a' : n === 'right' ? '#6e6c68' : '#5a5854'));
  const dq = [P([-4.39, 2, 3.6]), P([-4.39, 2, 4.4]), P([-4.39, 0, 4.4]), P([-4.39, 0, 3.6])];
  fill(ctx, dq, '#e8b878'); glow(ctx, ...P([-4.3, 1, 4]), 80, 120, '255,190,120', .3);
  fill(ctx, [dq[0], P([-4, 2, 3.4]), P([-4, 0, 3.4]), dq[3]], '#3a4a5a');
  // a plastic chair
  const ch = [1.8, 0, 3.4], cb = P(ch), ck = cam.focal / 3.4;
  ctx.fillStyle = '#7e8888'; fill(ctx, [[cb[0] - .25 * ck, cb[1] - .45 * ck], [cb[0] + .25 * ck, cb[1] - .45 * ck], [cb[0] + .22 * ck, cb[1] - .4 * ck], [cb[0] - .22 * ck, cb[1] - .4 * ck]], '#7e8888');
  fill(ctx, [[cb[0] - .22 * ck, cb[1] - .45 * ck], [cb[0] + .22 * ck, cb[1] - .45 * ck], [cb[0] + .2 * ck, cb[1] - .9 * ck], [cb[0] - .2 * ck, cb[1] - .9 * ck]], '#727c7c');
  ctx.strokeStyle = '#6a7272'; ctx.lineWidth = .04 * ck; for (const dx of [-.22, .22]) { ctx.beginPath(); ctx.moveTo(cb[0] + dx * ck, cb[1] - .42 * ck); ctx.lineTo(cb[0] + dx * 1.1 * ck, cb[1]); ctx.stroke(); }
}

// Washing on the lines: each item pegged at its top, its lower edge lifting with the wind.
function makeLines(rnd) {
  const lines = [[[-4.4, 2.1, 6.2], [4.6, 1.95, 7.4]], [[-4.4, 1.9, 6.9], [4.6, 1.75, 8.2]]];
  const items = [];
  lines.forEach(([a, b], li) => {
    let t = .06;
    while (t < .94) {
      const kind = rnd() < .55 ? 'shirt' : rnd() < .5 ? 'sheet' : 'small', w = kind === 'sheet' ? .14 : kind === 'shirt' ? .08 : .04;
      items.push({ li, t0: t, t1: Math.min(.95, t + w), kind, lag: rnd() * TAU, tone: kind === 'small' ? [[200, 120, 120], [120, 150, 200], [230, 220, 180]][Math.floor(rnd() * 3)] : [236, 236, 232] });
      t += w + .02 + rnd() * .04;
    }
  });
  return { lines, items };
}
const sagAt = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t) - .25 * Math.sin(Math.PI * t), lerp(a[2], b[2], t)];

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(74011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  city(ctx, rnd);
  roof(ctx, rnd);
  // the pipe frame the lines are tied to
  const fr = P([4.6, 0, 7.6]), ft = P([4.6, 2.2, 7.6]), fk = cam.focal / 7.6;
  ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = .06 * fk; ctx.beginPath(); ctx.moveTo(...fr); ctx.lineTo(...ft); ctx.stroke();
  paint.applyTexture(ctx, make, 7401, .34, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.56, .55, .7], lights: [paint.LIGHT.lamp(1300, HORIZON + 20, .15, 1100, 400, [1.25, 1, .9])] })(ctx);
  const wash = makeLines(rnd);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const [a, b] of wash.lines) {
      target.strokeStyle = '#2a2a2e'; target.lineWidth = 1.5; target.beginPath();
      for (let i = 0; i <= 20; i++) { const p = P(sagAt(a, b, i / 20)); i ? target.lineTo(...p) : target.moveTo(...p); } target.stroke();
    }
    // wind: a wave travelling along the lines, two passes per loop
    for (const it of wash.items) {
      const [a, b] = wash.lines[it.li], mid = (it.t0 + it.t1) / 2;
      const gust = .5 + .5 * Math.sin(TAU * (phase * 2 - mid * 1.5) + it.lag * .3);
      const lift = gust * (it.kind === 'sheet' ? .5 : .35), flutter = Math.sin(TAU * phase * 8 + it.lag) * .04 * gust;
      const len = it.kind === 'sheet' ? 1.3 : it.kind === 'shirt' ? .75 : .3;
      const top0 = sagAt(a, b, it.t0), top1 = sagAt(a, b, it.t1);
      const hang = (p, t) => [p[0] + lift * .6, p[1] - len * Math.cos(lift) + flutter * t, p[2] + lift * .5 + flutter];
      const pts = [P(top0), P(top1), P(hang(top1, 1)), P(hang(top0, .5))];
      // a soft middle bulge where the wind fills the cloth
      const mb = P([lerp(top0[0], top1[0], .5) + lift * .8, top0[1] - len * .55, top0[2] + lift * .7]);
      const tone = it.tone.map(c => c * (.5 + .18 * gust));
      target.fillStyle = shade(tone, 0);
      target.beginPath(); target.moveTo(...pts[0]); target.lineTo(...pts[1]); target.quadraticCurveTo(lerp(pts[1][0], mb[0], .5) + 6, mb[1], pts[2][0], pts[2][1]);
      target.lineTo(pts[3][0], pts[3][1]); target.quadraticCurveTo(lerp(pts[0][0], mb[0], .5) - 6, mb[1], pts[0][0], pts[0][1]); target.fill();
      // shading folds
      target.strokeStyle = 'rgba(60,60,80,.25)'; target.lineWidth = 2;
      for (let f = 1; f < 3; f++) { const x0 = lerp(pts[0][0], pts[1][0], f / 3), x1 = lerp(pts[3][0], pts[2][0], f / 3); target.beginPath(); target.moveTo(x0, pts[0][1] + 6); target.quadraticCurveTo((x0 + x1) / 2 + 8 * gust, (pts[0][1] + pts[2][1]) / 2, x1, pts[2][1] - 4); target.stroke(); }
      if (it.kind === 'shirt') { // sleeves out to the sides, a collar
        for (const [p, s] of [[pts[0], -1], [pts[1], 1]]) { target.fillStyle = shade(tone, -8); target.beginPath(); target.moveTo(p[0], p[1] + 4); target.lineTo(p[0] + s * 16, p[1] + 34 + lift * 30); target.lineTo(p[0] + s * 4, p[1] + 40 + lift * 30); target.fill(); }
        target.fillStyle = shade(tone, -20); target.fillRect((pts[0][0] + pts[1][0]) / 2 - 6, pts[0][1], 12, 5);
      }
      for (const p of [pts[0], pts[1]]) { target.fillStyle = '#8a6a4a'; target.fillRect(p[0] - 2, p[1] - 5, 4, 9); }
    }
  };
}

module.exports = {
  title: '옥상 빨랫줄의 흰 셔츠',
  slug: 'linen-over-the-night-roofs',
  sound: 'gust',
  createScene,
};
