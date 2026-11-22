'use strict';

// 56 · 초승달 아래 모래 능선
// Deep desert at night under a thin crescent moon low in the west. Great transverse dunes run across the
// view in sharp-crested waves: each windward slope long and gentle, catching the moonlight in pale silver,
// each lee face steep and falling into blue-black shadow, the crest line between them knife-sharp and
// sinuous. Fine ripples score the lit slopes. The wind lifts thin veils of sand off the crests and carries
// them over into the shadow. Stars fill the sky down to the dark line of the farthest dunes.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, v3, noise } = paint;

const cam = camera({ x: 0, y: 16, z: 0, yaw: .05, pitch: .13, focal: 1100, cx: 960, cy: 520 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(.05) * 1e6, 16, Math.cos(.05) * 1e6])[1];
const MOON = v3.unit([1, .22, .55]);                        // low, from the right and a little behind

// Transverse dunes: a sawtooth across z, gentle windward rise then a steep slip face; the crest wanders.
function phaseOf(x, z) { return (z * .55 - x * .83) / 30 + .35 * Math.sin(x / 41 + z / 90) + .25 * noise(x / 60, z / 60, 5); }
function height(x, z) {
  const t = phaseOf(x, z), f = t - Math.floor(t);
  const saw = f < .66 ? Math.sin(f / .66 * Math.PI / 2) ** 1.6 : .5 + .5 * Math.cos((f - .66) / .34 * Math.PI);
  return saw * (9 + 4 * noise(x / 80, z / 80, 9)) + 1.5 * noise(x / 30, z / 30, 2) - 2;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(56011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#05070f'); sky.addColorStop(.7, '#101a30'); sky.addColorStop(1, '#2a3048');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 900, HORIZON);
  // the crescent: a lit disc with a shadow disc bitten out of it
  const m = [1420, 330];
  glow(ctx, m[0], m[1], 220, 220, '200,210,230', .14);
  ctx.save(); ctx.beginPath(); ctx.arc(m[0], m[1], 26, 0, TAU); ctx.clip();
  ctx.fillStyle = '#eef0f4'; ctx.fillRect(m[0] - 30, m[1] - 30, 60, 60);
  ctx.fillStyle = '#101a30'; ctx.beginPath(); ctx.arc(m[0] - 12, m[1] - 6, 25, 0, TAU); ctx.fill();
  ctx.restore();
  // the dune sea
  paint.terrain(ctx, cam, height, { z0: 6, z1: 1400, cols: 260, rows: 260, bias: 2.4, fan: .95, cx: 40 }, (p, n) => {
    const lit = Math.min(1, Math.max(0, (n[0] * MOON[0] + n[1] * MOON[1] + n[2] * MOON[2] - MOON[1] * .6) * 1.7));
    const fog = Math.min(1, p[2] / 1400);
    // ripples: fine stripes on the windward slopes only
    const rip = lit > .3 ? .06 * Math.sin(p[0] * 2.1 + p[2] * 3.3 + noise(p[0] / 4, p[2] / 4, 1) * 4) * (1 - fog) : 0;
    const base = [lerp(22, 150, lit ** 1.4) * (1 + rip), lerp(28, 156, lit ** 1.4) * (1 + rip), lerp(52, 176, lit ** 1.4) * (1 + rip)];
    return shade(base.map((c, i) => lerp(c, [40, 48, 72][i], fog * .8)), 0);
  });
  paint.applyTexture(ctx, make, 5601, .34, 0, 0, W, H, true);
  // crests: sample the crest line of a few near dunes, for the blowing sand
  const crests = [];
  for (let i = 0; i < 60; i++) {
    const x = (rnd() - .5) * 200, zGuess = 50 + rnd() * 220;
    let best = zGuess, bh = -1e9;
    for (let dz = -18; dz <= 18; dz += .5) { const h = height(x, zGuess + dz); if (h > bh) { bh = h; best = zGuess + dz; } }
    const s = cam.project([x, bh, best]); if (s[2] > 0 && s[1] > HORIZON) crests.push({ at: [s[0], s[1]], k: cam.focal / s[2], lag: rnd(), turns: 2 + Math.floor(rnd() * 2) });
  }

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // veils of sand lifting from the crests and drifting left into the lee
    for (const c of crests) {
      const gust = .5 + .5 * Math.sin(TAU * (phase * 2 + c.lag));
      for (let j = 0; j < 4; j++) {
        const t = (phase * c.turns + c.lag + j / 4) % 1;
        glow(target, c.at[0] - t * 12 * c.k, c.at[1] - (1 - (1 - t) ** 2) * 2 * c.k + t * t * 1.5 * c.k, (1 + t * 3) * c.k, (.2 + t * .6) * c.k, '190,196,214', .12 * gust * (1 - t));
      }
    }
    // a slow twinkle in a few bright stars
    for (let i = 0; i < 12; i++) { const x = (i * 467) % W, y = (i * 211) % Math.max(1, HORIZON - 80); glow(target, x, y, 3, 3, '230,236,255', .3 + .3 * Math.sin(TAU * (phase * (1 + i % 3) + i * .37))); }
  };
}

module.exports = {
  title: '초승달 아래 모래 능선',
  slug: 'crescent-over-sand-ridges',
  sound: 'sand',
  createScene,
};
