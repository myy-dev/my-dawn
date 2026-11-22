'use strict';

// 19 · 빈 상영실의 작은 영사기
// A small screening room, empty, before dawn. From the back, past rows of worn velvet seats, a 16mm
// projector on a stand throws its cone of light across the dark toward a screen; the beam is full of
// drifting dust, and on the screen a pale, flickering image of the sea plays to no one. The projector's
// reels turn and its little lamp housing glows; the beam flickers with the shutter. Exit lights glow red.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: 0, y: 1.7, z: 0, yaw: 0, pitch: .06, focal: 900, cx: 960, cy: 540 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const LENS = [.9, 1.35, 2.6], SCREEN = { x0: -2.6, x1: 2.4, y0: 1.1, y1: 3.9, z: 14 };

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }

function room(ctx, rnd) {
  ctx.fillStyle = '#07070a'; ctx.fillRect(0, 0, W, H);
  // walls with acoustic panels catching faint spill from the screen
  const wl = [P([-4, 0, 1]), P([-4, 0, 14]), P([-4, 5, 14]), P([-4, 5, 1])];
  fill(ctx, wl, '#120e12');
  for (let i = 0; i < 6; i++) { const z0 = 2 + i * 2; fill(ctx, [P([-3.98, 1, z0]), P([-3.98, 1, z0 + 1.6]), P([-3.98, 3.6, z0 + 1.6]), P([-3.98, 3.6, z0])], shade([26, 14, 18], i * 2)); }
  const wr = [P([4, 0, 1]), P([4, 0, 14]), P([4, 5, 14]), P([4, 5, 1])];
  fill(ctx, wr, '#100c10');
  // screen with its black masking frame
  const s = [P([SCREEN.x0, SCREEN.y1, SCREEN.z]), P([SCREEN.x1, SCREEN.y1, SCREEN.z]), P([SCREEN.x1, SCREEN.y0, SCREEN.z]), P([SCREEN.x0, SCREEN.y0, SCREEN.z])];
  fill(ctx, s.map(([x, y], i) => [x + [-14, 14, 14, -14][i], y + [-14, -14, 14, 14][i]]), '#020203');
  // exit signs
  for (const x of [-3.6, 3.6]) { const p = P([x, 3.2, 13.8]); ctx.fillStyle = '#3a0a0a'; ctx.fillRect(p[0] - 22, p[1] - 9, 44, 18); glow(ctx, p[0], p[1], 50, 30, '255,60,50', .4); ctx.fillStyle = '#ff5a4a'; ctx.fillRect(p[0] - 16, p[1] - 4, 32, 8); }
  // the seats: rows of curved velvet backs stepping down toward the screen
  for (let r = 7; r >= 0; r--) {
    const z = 2.6 + r * 1.3, y = .55 - r * .05;
    for (let c = -6; c <= 6; c++) {
      if (c === 0) continue;
      const x = c * .62, a = P([x - .26, y + .55, z]), b = P([x + .26, y + .55, z]), base = P([x, y, z]), k = cam.focal / cam.project([x, y, z])[2];
      // a padded seat back: rounded shoulders, a soft vertical gradient, tufted seams, and a wooden armrest
      const tone = shade([50, 16, 22], -r * 3 + (rnd() - .5) * 8, 1);
      const g = ctx.createLinearGradient(a[0], 0, b[0], 0); g.addColorStop(0, shade([34, 10, 16], -r * 2)); g.addColorStop(.45, tone); g.addColorStop(1, shade([24, 8, 12], -r * 2));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(a[0] + .02 * k, base[1]); ctx.lineTo(a[0], a[1] + .12 * k);
      ctx.bezierCurveTo(a[0], a[1] - .04 * k, a[0] + .1 * k, a[1] - .07 * k, base[0], a[1] - .07 * k); ctx.bezierCurveTo(b[0] - .1 * k, a[1] - .07 * k, b[0], b[1] - .04 * k, b[0], b[1] + .12 * k); ctx.lineTo(b[0] - .02 * k, base[1]); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; for (const t of [.33, .66]) { const x2 = lerp(a[0], b[0], t); ctx.beginPath(); ctx.moveTo(x2, a[1] - .02 * k); ctx.lineTo(x2, base[1] - .1 * k); ctx.stroke(); }
      ctx.fillStyle = 'rgba(200,180,220,.07)'; ctx.beginPath(); ctx.ellipse(base[0] - .05 * k, a[1] - .02 * k, .16 * k, .03 * k, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a120e'; ctx.fillRect(b[0] - .01 * k, base[1] - .3 * k, .05 * k, .3 * k);
    }
  }
}

// The projector on its stand, close at the lower right: the body, lamp housing, two reels on arms.
function projectorParts(ctx) {
  const lens = P(LENS), k = cam.focal / cam.project(LENS)[2];
  fill(ctx, [[lens[0] + .1 * k, lens[1] - .2 * k], [lens[0] + .9 * k, lens[1] - .26 * k], [lens[0] + .95 * k, lens[1] + .3 * k], [lens[0] + .1 * k, lens[1] + .24 * k]], '#2a2c30');
  fill(ctx, [[lens[0] + .5 * k, lens[1] - .5 * k], [lens[0] + .9 * k, lens[1] - .52 * k], [lens[0] + .9 * k, lens[1] - .26 * k], [lens[0] + .5 * k, lens[1] - .22 * k]], '#3a3c42');
  ctx.fillStyle = '#1a1a1e'; ctx.beginPath(); ctx.ellipse(lens[0], lens[1], .08 * k, .1 * k, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c8d8f0'; ctx.beginPath(); ctx.ellipse(lens[0], lens[1], .05 * k, .065 * k, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = .05 * k;
  ctx.beginPath(); ctx.moveTo(lens[0] + .5 * k, lens[1] + .3 * k); ctx.lineTo(lens[0] + .3 * k, H); ctx.moveTo(lens[0] + .7 * k, lens[1] + .3 * k); ctx.lineTo(lens[0] + 1 * k, H); ctx.stroke();
  return { lens, k };
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(19011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  room(ctx, rnd);
  paint.applyTexture(ctx, make, 1901, .3, 0, 0, W, H, true);
  const scr = [P([SCREEN.x0, SCREEN.y1, SCREEN.z]), P([SCREEN.x1, SCREEN.y1, SCREEN.z]), P([SCREEN.x1, SCREEN.y0, SCREEN.z]), P([SCREEN.x0, SCREEN.y0, SCREEN.z])];
  const proj = make(W, H), pc = proj.getContext('2d');
  const { lens, k } = projectorParts(pc);
  const motes = Array.from({ length: 90 }, () => ({ t: rnd(), off: (rnd() - .5) * .9, v: (rnd() - .5) * .9, turns: 1 + Math.floor(rnd() * 2), lag: rnd() * TAU }));
  const reels = [[lens[0] + .45 * k, lens[1] - .95 * k, .32 * k], [lens[0] + 1.05 * k, lens[1] - .9 * k, .3 * k]];

  return (target, input) => {
    const phase = input - Math.floor(input);
    const flicker = .88 + .06 * Math.sin(TAU * phase * 48) + .04 * Math.sin(TAU * phase * 31);
    target.drawImage(plate, 0, 0);
    // the image on the screen: a pale sea with a horizon and slow waves
    target.save(); pathOf(target, scr); target.clip();
    const [sx0, sy0] = scr[0], [sx1, sy1] = scr[2];
    const g = target.createLinearGradient(0, sy0, 0, sy1); g.addColorStop(0, '#9aa4b4'); g.addColorStop(.45, '#c8ccd2'); g.addColorStop(.5, '#6a7486'); g.addColorStop(1, '#3a4252');
    target.globalAlpha = flicker; target.fillStyle = g; target.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
    for (let i = 0; i < 12; i++) { const y = lerp(sy0, sy1, .52 + i * .04), x = sx0 + ((i * 97 + phase * (sx1 - sx0) * (i % 2 ? 1 : 2)) % (sx1 - sx0)); target.strokeStyle = 'rgba(220,226,236,.5)'; target.lineWidth = 2; target.beginPath(); target.moveTo(x - 60, y); target.quadraticCurveTo(x, y - 4, x + 60, y); target.stroke(); }
    target.globalAlpha = 1; target.restore();
    glow(target, (sx0 + sx1) / 2, sy1 + 40, (sx1 - sx0) * .7, 120, '160,170,190', .12 * flicker);
    // the beam: a cone from the lens to the screen's corners, brighter near the lens
    target.save(); target.globalCompositeOperation = 'lighter';
    const beam = target.createLinearGradient(lens[0], lens[1], (sx0 + sx1) / 2, (sy0 + sy1) / 2);
    beam.addColorStop(0, `rgba(210,220,245,${.32 * flicker})`); beam.addColorStop(1, `rgba(210,220,245,${.04 * flicker})`);
    target.fillStyle = beam;
    target.beginPath(); target.moveTo(...lens); target.lineTo(...scr[0]); target.lineTo(...scr[3]); target.closePath(); target.fill();
    target.beginPath(); target.moveTo(...lens); target.lineTo(...scr[1]); target.lineTo(...scr[2]); target.closePath(); target.fill();
    target.beginPath(); target.moveTo(...lens); target.lineTo(...scr[0]); target.lineTo(...scr[1]); target.closePath(); target.fill();
    // dust in the beam, drifting slowly, brightest near the lens
    for (const m of motes) {
      const t = (m.t + phase * .05 * m.turns) % 1, cx = lerp(lens[0], (sx0 + sx1) / 2, t), cy = lerp(lens[1], (sy0 + sy1) / 2, t);
      const spread = t * (sy1 - sy0) * .5, x = cx + m.off * spread * .3 + Math.sin(TAU * phase * m.turns + m.lag) * 6, y = cy + m.v * spread;
      glow(target, x, y, 2 + (1 - t) * 3, 2 + (1 - t) * 3, '230,236,255', .55 * (1 - t) * flicker);
    }
    target.restore();
    target.drawImage(proj, 0, 0);
    // the reels, turning, and the glow of the lamp housing's vents
    target.strokeStyle = '#1a1a1e'; target.lineWidth = .05 * k;
    for (const [x, y] of reels) { target.beginPath(); target.moveTo(lens[0] + .6 * k, lens[1] - .3 * k); target.lineTo(x, y); target.stroke(); }
    for (const [x, y, r] of reels) {
      target.fillStyle = '#1e1e22'; target.beginPath(); target.arc(x, y, r, 0, TAU); target.fill();
      target.fillStyle = '#3a2a20'; target.beginPath(); target.arc(x, y, r * .7, 0, TAU); target.fill();
      for (let s = 0; s < 3; s++) { const a = TAU * phase * 3 + s * TAU / 3; target.fillStyle = '#0a0a0c'; target.beginPath(); target.arc(x + Math.cos(a) * r * .38, y + Math.sin(a) * r * .38, r * .16, 0, TAU); target.fill(); }
      target.fillStyle = '#8a8a8e'; target.beginPath(); target.arc(x, y, r * .1, 0, TAU); target.fill();
    }
    for (let v = 0; v < 4; v++) { const x = lens[0] + (.56 + v * .08) * k, y = lens[1] - .4 * k; target.fillStyle = `rgba(255,190,120,${.6 * flicker})`; target.fillRect(x, y, .03 * k, .12 * k); }
    glow(target, lens[0], lens[1], 60, 60, '220,230,255', .6 * flicker);
  };
}

module.exports = {
  title: '빈 상영실의 작은 영사기',
  slug: 'empty-room-projector',
  sound: 'mechanism',
  createScene,
};
