'use strict';

// 04 · 새벽 안개가 흐르는 산정호수
// A high mountain lake at first light, glass-still. Across it a great snow peak rises, its summit already
// rose-gold, its flanks and couloirs blue; dark spruce forests climb the lower slopes and come down to the
// water. The lake holds the whole mountain upside down. Over the water, low mist lies in drifting skeins,
// thickening along the far shore and slowly sliding sideways; now and then a fish rises and a ring spreads.
// In the near shallows, rounded stones show through the water, and a few reeds stand.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, v3, noise } = paint;

const cam = camera({ x: 0, y: 2, z: 0, yaw: .04, pitch: -.02, focal: 1100, cx: 960, cy: 520 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const M = paint.mirrorOf(cam, 0);
const HORIZON = cam.project([Math.sin(.04) * 1e6, 2, Math.cos(.04) * 1e6])[1];
const SUN = v3.unit([.7, .3, -.4]);

function ridged(x, z) {
  let h = 0, amp = 1, f = 1;
  for (let o = 0; o < 5; o++) { const n = 1 - Math.abs(2 * noise(x * f / 1500, z * f / 1500, 11 + o) - 1); h += n ** 2 * amp; amp *= .47; f *= 2.1; }
  return h;
}
// The massif behind the lake: one dominant peak and its shoulders; the shore at z ~ 900.
function height(x, z) {
  if (z < 900) return -1;
  const d = Math.hypot(x - 300, (z - 6500) * .8), peak = 2200 * Math.exp(-((d / 2200) ** 2));
  return 8 + peak * (.55 + .45 * ridged(x, z)) + 140 * ridged(x * 2, z * 2) * Math.min(1, (z - 900) / 1500);
}

function paintWorld(ctx, project, mirrored) {
  const horizon = project([0, 2, 1e6])[1];
  const sky = mirrored ? ctx.createLinearGradient(0, horizon + 900, 0, horizon) : ctx.createLinearGradient(0, horizon - 900, 0, horizon); sky.addColorStop(0, '#1e2a4a'); sky.addColorStop(.6, '#6a6a8e'); sky.addColorStop(1, '#e0a898');
  ctx.fillStyle = sky; ctx.fillRect(0, Math.min(0, horizon - 900), W, H + 900);
  paint.terrain(ctx, { ...cam, project }, height, { z0: 880, z1: 14000, cols: 360, rows: 280, bias: 1.7, fan: 1, cx: 0 }, (p, n) => {
    if (p[1] < 0) return 'rgba(0,0,0,0)';
    const steep = 1 - n[1], lit = Math.max(0, n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2]), fog = Math.min(1, p[2] / 9000);
    const snow = p[1] > 900 + 300 * noise(p[0] / 200, p[2] / 200, 3) && steep < .75;
    const forest = p[1] < 260 + 120 * noise(p[0] / 100, p[2] / 100, 4);
    let c;
    if (snow) c = [lerp(90, 250, lit), lerp(100, 190, lit), lerp(150, 180, lit)];
    else if (forest) c = [18 + lit * 20, 30 + lit * 24, 30 + lit * 20];
    else c = [50 + lit * 70, 48 + lit * 50, 64 + lit * 40];
    return shade(c.map((v, i) => lerp(v, [140, 130, 160][i], fog * .5)), forest ? (noise(p[0] / 6, p[2] / 6, 8) - .5) * 20 : 0);
  });
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(4011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  paintWorld(ctx, p => cam.project(p));
  const shore = P([0, 0, 900])[1];
  // the reflection, built from the mirrored camera and darkened
  const refl = make(W, H), rc = refl.getContext('2d');
  paintWorld(rc, p => cam.project([p[0], -p[1], p[2]]), true);
  rc.fillStyle = 'rgba(10,16,30,.35)'; rc.fillRect(0, 0, W, H);
  // the water itself: under the reflection, darker toward us
  ctx.fillStyle = '#141c2a'; ctx.fillRect(0, shore - 3, W, H - shore + 3);
  // near shallows: stones under water and reeds (drawn on a front layer)
  const front = make(W, H), fc = front.getContext('2d');
  for (let i = 0; i < 60; i++) { const z = 3 + rnd() * 10, x = (rnd() - .5) * z * 1.8, s = cam.project([x, -.1, z]), k = cam.focal / s[2], r = (.06 + rnd() * .16) * k; fc.fillStyle = `rgba(${40 + rnd() * 20},${44 + rnd() * 20},${50 + rnd() * 16},.35)`; fc.beginPath(); fc.ellipse(s[0], s[1], r * 1.4, r * .5, 0, 0, TAU); fc.fill(); }
  const reeds = Array.from({ length: 50 }, () => { const x = -6 + rnd() * 3, z = 3 + rnd() * 4; const s = cam.project([x, 0, z]), k = cam.focal / s[2]; return { at: [s[0], s[1]], h: (.6 + rnd() * .8) * k, lag: rnd() * TAU }; });
  paint.applyTexture(ctx, make, 4012, .3, 0, 0, W, H, true);
  const mists = Array.from({ length: 16 }, () => ({ z: 30 + rnd() ** .7 * 870, lag: rnd(), w: 300 + rnd() * 700, dir: rnd() < .7 ? 1 : -1 }));
  const rings = [{ x: 4, z: 60, t: .2 }, { x: -12, z: 120, t: .55 }, { x: 9, z: 35, t: .83 }];

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.globalAlpha = .9; paint.ripple(target, refl, shore - 2, phase, { bands: 2, amp: .35, speed: 1 }); target.restore();
    target.drawImage(front, 0, 0);
    for (const r of rings) {
      const t = (phase - r.t + 1) % 1; if (t > .4) continue;
      const u = t / .4, s = cam.project([r.x, 0, r.z]), k = cam.focal / s[2];
      for (let j = 0; j < 3; j++) { const rr = (u * 1.6 - j * .25) * k; if (rr <= 0) continue; target.strokeStyle = `rgba(220,220,236,${.4 * (1 - u)})`; target.lineWidth = 1; target.beginPath(); target.ellipse(s[0], s[1], rr, rr * .12, 0, 0, TAU); target.stroke(); }
    }
    for (const m of mists) {
      const y = cam.project([0, .5, m.z])[1], k = cam.focal / m.z;
      for (let j = 0; j < 3; j++) { const x = ((((j / 3 + phase * m.dir + m.lag) % 1) + 1) % 1) * (W + 1400) - 700; glow(target, x, y - 2 * k, m.w, 4 + 3 * k, '236,224,236', .16); }
    }
    target.lineCap = 'round';
    for (const r of reeds) { const sw = Math.sin(TAU * phase + r.lag) * r.h * .04; target.strokeStyle = 'rgba(30,36,30,.9)'; target.lineWidth = 2; target.beginPath(); target.moveTo(...r.at); target.quadraticCurveTo(r.at[0] + sw * .3, r.at[1] - r.h * .6, r.at[0] + sw, r.at[1] - r.h); target.stroke(); }
  };
}

module.exports = {
  title: '새벽 안개가 흐르는 산정호수',
  slug: 'mist-on-the-alpine-lake',
  sound: 'lake',
  createScene,
};
