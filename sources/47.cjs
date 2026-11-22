'use strict';

// 47 · 달빛을 받는 억새밭
// A hillside of silver grass under a crescent moon. Seen from among the clumps, the grass rises in tufts
// toward the ridge: long arching leaves below, tall stems above carrying feathery plumes that the
// moonlight turns to silver along their edges. The ridge line is a soft wave of plumes against a deep blue
// sky. Wind runs uphill in waves: each tuft bends in turn and its plume flashes brighter as it tilts toward
// the moon.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: 0, y: 1.2, z: 0, yaw: -.05, pitch: .12, focal: 1100, cx: 960, cy: 640 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const hill = (x, z) => z * .2 + .3 * Math.sin(x * .3 + z * .2);
const MOON = [380, 190];

function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#070b18'], [.5, '#182640'], [.75, '#2a3a54'], [1, '#141c28']]);
  ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 380, 600);
  glow(ctx, ...MOON, 260, 260, '200,214,236', .28);
  ctx.fillStyle = 'rgba(60,70,90,.5)'; ctx.beginPath(); ctx.arc(...MOON, 22, 0, TAU); ctx.fill();
  ctx.fillStyle = '#eef2f6'; ctx.beginPath(); ctx.arc(...MOON, 22, -1.3, 1.6); ctx.arc(MOON[0] + 9, MOON[1] - 2, 20, 1.6, -1.3, true); ctx.fill();
  // the slope's body, dark, rising to the ridge
  const ridge = [];
  for (let x = -40; x <= 40; x += 1) ridge.push(P([x, hill(x, 40) + .6 * Math.sin(x * .2), 40]));
  ridge.push([W, H], [0, H]);
  pathOf(ctx, ridge); ctx.fillStyle = vertical(ctx, ridge[40][1], H, [[0, '#2a3040'], [1, '#10141a']]); ctx.fill();
}

// A tuft: a fountain of arching leaves and a few tall stems with plumes.
function makeTufts(rnd) {
  const tufts = [];
  for (let i = 0; i < 160; i++) {
    const z = 1.5 + rnd() ** 1.5 * 38, x = (rnd() - .5) * z * 2.4;
    tufts.push({ x, z, y: hill(x, z), stems: 2 + Math.floor(rnd() * 4), h: 1.4 + rnd() * .7, lag: z * .35 + x * .05, seed: rnd() * 1e6 | 0 });
  }
  return tufts.sort((a, b) => b.z - a.z);
}

function tuft(ctx, t, bend) {
  const base = cam.project([t.x, t.y, t.z]); if (base[2] <= .3) return;
  const k = cam.focal / base[2], rnd = paint.seeded(t.seed), fog = Math.min(.8, t.z / 45);
  // leaves: long ribbons fountaining out and down
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (rnd() - .5) * 2, len = (.6 + rnd() * .5) * k;
    const tip = [base[0] + Math.cos(a) * len + bend * len * .3, base[1] + Math.sin(a) * len * .5 + len * .35];
    ctx.strokeStyle = shade(paint.aerial([44, 56, 52], fog, [40, 52, 76]), (rnd() - .5) * 20, .9); ctx.lineWidth = Math.max(.6, .015 * k);
    ctx.beginPath(); ctx.moveTo(...base); ctx.quadraticCurveTo(base[0] + Math.cos(a) * len * .7, base[1] - len * .7, ...tip); ctx.stroke();
  }
  // stems with plumes; the plume is a drooping fan of fine silky rays, its upper edge lit by the moon
  for (let s = 0; s < t.stems; s++) {
    const lean = (rnd() - .5) * .3 + bend, h = t.h * (.8 + rnd() * .3) * k;
    const top = [base[0] + Math.sin(lean) * h, base[1] - Math.cos(lean) * h];
    ctx.strokeStyle = shade(paint.aerial([90, 84, 70], fog, [40, 52, 76]), 0, .9); ctx.lineWidth = Math.max(.5, .01 * k);
    ctx.beginPath(); ctx.moveTo(...base); ctx.quadraticCurveTo(base[0] + Math.sin(lean * .5) * h * .5, base[1] - h * .55, ...top); ctx.stroke();
    // the plume: a loose spray of silky branches that rise from the stem tip and arch over to one side,
    // hanging down; the upper side of each branch catches the moon
    const plume = .4 * k, side = Math.sign(lean + .05) || 1, shine = Math.max(0, Math.cos(lean * 3 - .4));
    for (let r = 0; r < 14; r++) {
      const f = r / 14, l = plume * (.55 + .45 * Math.sin(f * Math.PI)), rise = l * (.25 + .35 * (1 - f));
      const ctrl = [top[0] + side * l * (.15 + f * .35), top[1] - rise], end = [top[0] + side * l * (.35 + f * .55), top[1] + l * (.15 + f * .5)];
      ctx.strokeStyle = `rgba(${200 + shine * 50},${206 + shine * 44},${226},${(.18 + shine * .32) * (1 - fog * .6)})`; ctx.lineWidth = Math.max(.5, .005 * k);
      ctx.beginPath(); ctx.moveTo(...top); ctx.quadraticCurveTo(...ctrl, ...end); ctx.stroke();
    }
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(47011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  const tufts = makeTufts(rnd);
  const far = tufts.filter(t => t.z > 14), near = tufts.filter(t => t.z <= 14);
  for (const t of far) tuft(ctx, t, .15);
  paint.applyTexture(ctx, make, 4701, .32, 0, 0, W, H, true);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const t of near) {
      // the gust's crest runs from below the frame to past the near tufts, so it wraps where nothing is
      const d = (((phase * 2) % 1) * 64 - 14 - t.z) / 4, wave = Math.exp(-(d * d));   // a gust climbing the slope twice a loop
      tuft(target, t, .12 + .1 * Math.sin(TAU * phase * 3 + t.lag) + .3 * wave);
    }
  };
}

module.exports = {
  title: '달빛을 받는 억새밭',
  slug: 'moon-on-the-silver-grass',
  sound: 'grass',
  createScene,
};
