'use strict';

// 65 · 구름 바다 위 어두운 산등성이
// Standing on a high rocky ridge before sunrise, above a sea of cloud. The ridge we stand on runs out in
// front of us in dark jagged rock and alpine turf, falling away on both sides. Below, the valleys are
// filled to the brim with a level white sea of cloud, and other ridges and summits rise out of it like
// islands, dark blue, catching a rose rim on their eastern edges. The sky glows from peach to violet. The
// cloud sea moves: slow swells roll across it and wisps spill over the low saddles.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, v3, noise } = paint;

const cam = camera({ x: 0, y: 2.2, z: 0, yaw: -.05, pitch: .06, focal: 1000, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(-.05) * 1e6, 2.2, Math.cos(-.05) * 1e6])[1];
const CLOUD = -140, SUN = v3.unit([.8, .25, .55]);

function ridged(x, z, seed) {
  let h = 0, amp = 1, f = 1;
  for (let o = 0; o < 5; o++) { const n = 1 - Math.abs(2 * noise(x * f / 900, z * f / 900, seed + o) - 1); h += n * n * amp; amp *= .5; f *= 2.1; }
  return h;
}
// Our ridge: a narrow spine running away along z, plus far peaks everywhere else.
function height(x, z) {
  const dx = Math.abs(x + 6 * Math.sin(z / 40)) / (4 + 2 * noise(z / 30, 0, 4)), spine = .2 - 6 * dx ** 1.6 - z * .12 + .8 * noise(x / 4, z / 4, 6);
  const peaks = ridged(x * .5, z * .5, 21) * 260 - 420 + Math.min(1, z / 3000) * 140;
  return Math.max(spine, peaks);
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(65011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON + 40); sky.addColorStop(0, '#1a2244'); sky.addColorStop(.6, '#6a5a80'); sky.addColorStop(.9, '#e0a08a'); sky.addColorStop(1, '#f0c0a0');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  glow(ctx, 1500, HORIZON, 800, 160, '255,200,160', .4);
  paint.starfield(ctx, rnd, 40, HORIZON * .3);
  // the cloud sea's flat top as a pale plane under everything
  const cloudTop = cam.project([0, CLOUD, 3000])[1], cloudNear = cam.project([0, CLOUD, 200])[1];
  const cg = ctx.createLinearGradient(0, cloudTop, 0, H); cg.addColorStop(0, '#c8b4c0'); cg.addColorStop(.3, '#9890a8'); cg.addColorStop(1, '#5a5a78');
  ctx.fillStyle = cg; ctx.fillRect(0, cloudTop, W, H);
  void cloudNear;
  // mountains: only what rises above the cloud is drawn (cells below CLOUD are skipped as transparent)
  paint.applyTexture(ctx, make, 6501, .34, 0, 0, W, H, true);
  const peaks = make(W, H), pc = peaks.getContext('2d');
  paint.terrain(pc, cam, height, { z0: 2, z1: 9000, cols: 260, rows: 260, bias: 2.6, fan: 1.05, cx: 0 }, (p, n) => {
    const sink = Math.min(1, Math.max(0, (CLOUD + 30 - p[1]) / 30)), cloudCol = [150, 140, 166];
    const lit = Math.max(0, n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2]), fog = Math.min(1, p[2] / 9000) ** .7;
    const near = p[2] < 60, rock = near ? [46, 44, 52] : [34, 44, 70];
    const c = rock.map((v, i) => v + lit ** 2 * [200, 120, 110][i] * (near ? .5 : 1));
    return shade(c.map((v, i) => lerp(lerp(v, [180, 160, 184][i], fog * .8), cloudCol[i] * (1 - fog * .2), sink)), near ? (noise(p[0] * 2, p[2] * 2, 3) - .5) * 20 : 0);
  });
  // alpine turf tufts on our ridge, drawn into the plate
  for (let i = 0; i < 260; i++) { const z = 3 + rnd() ** 2 * 40, x = (rnd() - .5) * 8 - 6 * Math.sin(z / 40), y = height(x, z); if (y < CLOUD) continue; const s = cam.project([x, y, z]); if (s[2] <= 0) continue; const k = cam.focal / s[2]; pc.fillStyle = shade([50, 70, 50], (rnd() - .5) * 20); pc.beginPath(); pc.ellipse(s[0], s[1], .12 * k, .05 * k, 0, Math.PI, TAU); pc.fill(); }
  const swells = Array.from({ length: 14 }, (_, i) => ({ z: 300 + i * 260 + rnd() * 100, lag: rnd(), dir: rnd() < .5 ? 1 : -1 }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    // the clouds' slow swell: soft bright bands rolling under the islands (drawn under the plate's peaks
    // by drawing first and letting the plate's transparent cloud region show them through)
    target.drawImage(plate, 0, 0);
    target.drawImage(peaks, 0, 0);
    target.save();
    for (const s of swells) {
      const y = cam.project([0, CLOUD, s.z])[1], k = cam.focal / s.z;
      for (let j = 0; j < 3; j++) { const x = (((j / 3 + phase * s.dir + s.lag) % 1) + 1) % 1 * (W + 1200) - 600; glow(target, x, y, 300 * k * 3 + 200, 12 + 300 * k, '250,236,240', .045); }
    }
    target.restore();
    // wisps spilling over a saddle on the left, twice a loop
    for (let i = 0; i < 5; i++) { const t = (phase * 2 + i / 5) % 1; glow(target, 260 + t * 240, cloudTopAt() - 10 + t * 30, 120, 18, '240,230,236', .2 * Math.sin(Math.PI * t)); }
  };
  function cloudTopAt() { return cam.project([0, CLOUD, 1400])[1]; }
}

module.exports = {
  title: '구름 바다 위 어두운 산등성이',
  slug: 'high-ridge-above-the-cloud-sea',
  sound: 'wind',
  createScene,
};
