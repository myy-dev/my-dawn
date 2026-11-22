'use strict';

// 58 · 모래 지평선에 스미는 새벽
// Low among rounded star dunes in the minutes before sunrise. The sun is just below the far dune line:
// the sky above it burns orange to rose to violet, and that light grazes the dunes from in front of us, so
// every crest and ridge is rimmed in gold while the slopes facing us stay a cool lavender in their own
// shadow. Ripples catch the light in fine bright lines near the crests. Long tongues of sand stream off the
// tops in the morning wind; a small flock of birds crosses the glow; the light swells and settles.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, v3, noise } = paint;

const cam = camera({ x: 0, y: 16, z: 0, yaw: -.08, pitch: .07, focal: 1150, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(-.08) * 1e6, 16, Math.cos(-.08) * 1e6])[1];
const SUN = v3.unit([-.75, .1, .66]);                         // just under the horizon, ahead and to the left

// Star dunes: several radiating arms meeting at peaks; built from a few peaks with ridged falloff.
const PEAKS = [[-50, 80, 14], [60, 140, 18], [-150, 190, 22], [150, 270, 24], [-20, 380, 28], [240, 110, 12], [-260, 130, 16], [20, 520, 30]];
function height(x, z) {
  let h = 0;
  for (const [px, pz, ph] of PEAKS) {
    const dx = x - px, dz = z - pz, r = Math.hypot(dx, dz), a = Math.atan2(dz, dx);
    const arms = .55 + .45 * Math.abs(Math.cos(a * 1.5 + px));
    h = Math.max(h, ph * Math.exp(-r / (ph * 3.6 * arms)));
  }
  return h + 2.5 * noise(x / 40, z / 40, 3) - 2;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(58011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#2a2a52'); sky.addColorStop(.45, '#7a5a7e'); sky.addColorStop(.8, '#e09070'); sky.addColorStop(1, '#f8c888');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 60, HORIZON * .35);
  const sunAt = P(v3.add(cam.pos, v3.mul(SUN, 1e5)));
  glow(ctx, sunAt[0], HORIZON, 900, 260, '255,190,120', .45);
  // thin high clouds lit from below
  for (let i = 0; i < 14; i++) { const x = rnd() * W, y = 120 + rnd() * 260; glow(ctx, x, y, 180 + rnd() * 260, 6 + rnd() * 10, '255,170,140', .25); }
  paint.terrain(ctx, cam, height, { z0: 1.5, z1: 1500, cols: 240, rows: 240, bias: 2.3, fan: 1, cx: 0 }, (p, n) => {
    const fog = Math.min(1, p[2] / 1300) ** .8;
    const L = [-.62, .5, .6], graze = n[0] * L[0] + n[1] * L[1] + n[2] * L[2];
    const rim = Math.min(1, Math.max(0, (graze - .45) * 2.4)) ** 1.2;
    const rip = rim > .2 ? .08 * Math.sin(p[0] * 2.3 - p[2] * 1.7 + 3 * noise(p[0] / 5, p[2] / 5, 6)) : 0;
    const shadowCol = [70, 56, 96], litCol = [240, 160, 100];
    const c = shadowCol.map((s0, i) => lerp(s0, litCol[i], rim) * (1 + rip));
    return shade(c.map((v, i) => lerp(v, [214, 140, 128][i], fog * .6)), 0);
  });
  paint.applyTexture(ctx, make, 5801, .34, 0, 0, W, H, true);
  // crest tops for the streamers
  const crests = PEAKS.map(([x, z, h]) => { const s = cam.project([x, height(x, z), z]); return { at: [s[0], s[1]], k: cam.focal / s[2] }; }).filter(c => c.at[1] > 0);
  const birds = Array.from({ length: 9 }, (_, i) => ({ dx: (i % 3) * 22 + (rnd() - .5) * 10, dy: Math.floor(i / 3) * 14 + (rnd() - .5) * 8, flap: rnd() }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the glow swells and settles once per loop
    const swell = .5 - .5 * Math.cos(TAU * phase);
    glow(target, sunAt[0], HORIZON - 10, 500, 120, '255,210,150', .12 + .12 * swell);
    for (const c of crests) for (let j = 0; j < 5; j++) {
      const t = (phase * 3 + j / 5) % 1;
      glow(target, c.at[0] + t * 30 * c.k, c.at[1] - t * 4 * c.k, (2 + t * 10) * c.k, (.4 + t) * c.k, '255,200,150', .14 * (1 - t) * Math.min(1, t * 10));
    }
    // the flock: crosses once per loop left to right, wings beating
    const fx = lerp(-200, W + 200, phase), fy = HORIZON - 180 + Math.sin(TAU * phase) * 30;
    for (const b of birds) {
      const w = Math.sin(TAU * (phase * 24 + b.flap)) * 5;
      target.strokeStyle = 'rgba(40,24,40,.85)'; target.lineWidth = 2; target.beginPath();
      target.moveTo(fx + b.dx - 7, fy + b.dy - w); target.quadraticCurveTo(fx + b.dx - 3, fy + b.dy - 2, fx + b.dx, fy + b.dy); target.quadraticCurveTo(fx + b.dx + 3, fy + b.dy - 2, fx + b.dx + 7, fy + b.dy - w); target.stroke();
    }
  };
}

module.exports = {
  title: '모래 지평선에 스미는 새벽',
  slug: 'first-light-beyond-the-dunes',
  sound: 'sand',
  createScene,
};
