'use strict';

// 70 · 서리가 스치는 설원 언덕
// Rolling snowfields in the last of the night, just as the sky pinkens. Smooth hills of deep snow fold
// into hollows; the wind has carved their surfaces into sastrugi — long scalloped ridges and grooves that
// catch the low light in fine lines. A row of old fence posts half buried in drift runs over a rise. The
// wind is up: ground blizzard streams across the snow in low glittering sheets, pouring over the crests
// and swirling in the hollows, and points of frost glint where the light catches.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, v3, noise } = paint;

const cam = camera({ x: 0, y: 2.2 + 46 * noise(0, 0, 3) + 12 * noise(0, 0, 4) - 30, z: 0, yaw: .14, pitch: .02, focal: 1050, cx: 960, cy: 520 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(.14) * 1e6, cam.pos[1], Math.cos(.14) * 1e6])[1];
const LOW = v3.unit([-.85, .22, .45]);

function height(x, z) {
  const hills = 46 * noise(x / 240, z / 240, 3) + 12 * noise(x / 70, z / 70, 4) - 30;
  const sastrugi = .07 * (noise(x / 3 + z / 9, z / 2.2, 5) - .5) * Math.min(1, 30 / (z + 1));
  return hills + sastrugi;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(70011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON); sky.addColorStop(0, '#141c34'); sky.addColorStop(.6, '#4a4a6a'); sky.addColorStop(1, '#c09098');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 70, HORIZON * .4);
  glow(ctx, 200, HORIZON, 700, 140, '255,190,180', .3);
  paint.terrain(ctx, cam, height, { z0: 2, z1: 1500, cols: 300, rows: 280, bias: 2.4, fan: 1.5, cx: 0 }, (p, n) => {
    const lit = Math.min(1, Math.max(0, (n[0] * LOW[0] + n[1] * LOW[1] + n[2] * LOW[2] - LOW[1]) * 3.2 + .36));
    const fog = Math.min(1, p[2] / 1300) ** .8;
    const rose = Math.max(0, lit - .6) * 2.5, c = [lerp(40, 214, lit) + 30 * rose, lerp(52, 196, lit) - 6 * rose, lerp(108, 212, lit) - 10 * rose];
    return shade(c.map((v, i) => lerp(v, [176, 150, 168][i], fog * .7)), 0);
  });
  // a few wind-bent birches on the far rise, their white trunks barely brighter than the snow
  for (let i = 0; i < 9; i++) {
    const x = 26 + i * 2.6 + (rnd() - .5) * 2, z = 130 + (rnd() - .5) * 14, y = height(x, z), b = P([x, y, z]), k = cam.focal / cam.project([x, y, z])[2], h = (5 + rnd() * 4) * k, lean = (.12 + rnd() * .1) * h;
    ctx.strokeStyle = 'rgba(40,36,52,.9)'; ctx.lineWidth = Math.max(1.5, .25 * k); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(...b); ctx.quadraticCurveTo(b[0] + lean * .3, b[1] - h * .5, b[0] + lean, b[1] - h); ctx.stroke();
    for (let t = 0; t < 7; t++) { const u = .35 + t * .09, px = b[0] + lean * u * u, py = b[1] - h * u, len = h * (.25 - t * .02); ctx.lineWidth = Math.max(1, .1 * k); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + len * (t % 2 ? .9 : -.5), py - len * .5); ctx.stroke(); }
  }
  // the fence: posts half buried, a sagging wire between them, over the rise
  const posts = [];
  for (let i = 0; i < 16; i++) { const z = 10 + i * 6, x = -14 + i * 2.2 + Math.sin(i) * .4, y = height(x, z); posts.push([x, y, z]); }
  ctx.strokeStyle = 'rgba(30,24,30,.8)'; ctx.lineWidth = 1;
  for (let i = 0; i < posts.length - 1; i++) { const a = P([posts[i][0], posts[i][1] + .9, posts[i][2]]), b = P([posts[i + 1][0], posts[i + 1][1] + .9, posts[i + 1][2]]); ctx.beginPath(); ctx.moveTo(...a); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 6, ...b); ctx.stroke(); }
  for (const p of posts) { const base = P(p), top = P([p[0], p[1] + 1.1 - rnd() * .4, p[2]]), k = cam.focal / cam.project(p)[2]; ctx.strokeStyle = '#2a2224'; ctx.lineWidth = Math.max(1.5, .12 * k); ctx.beginPath(); ctx.moveTo(...base); ctx.lineTo(...top); ctx.stroke(); ctx.fillStyle = '#e0e4ee'; ctx.beginPath(); ctx.ellipse(top[0], top[1], .09 * k, .04 * k, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(220,228,240,.9)'; ctx.beginPath(); ctx.ellipse(base[0] - .15 * k, base[1], .35 * k, .1 * k, 0, Math.PI, TAU); ctx.fill(); }
  paint.applyTexture(ctx, make, 7001, .3, 0, 0, W, H, true);
  // sheets of drifting snow: ribbons of glow hugging the ground, moving right to left
  const sheets = Array.from({ length: 26 }, () => ({ z: 4 + rnd() ** 1.4 * 120, lag: rnd(), turns: 1 + Math.floor(rnd() * 2), w: .6 + rnd() }));
  const glints = Array.from({ length: 90 }, () => { const z = 2.5 + rnd() ** 2 * 40, x = (rnd() - .5) * z * 1.8, s = cam.project([x, height(x, z) + .02, z]); return { at: [s[0], s[1]], lag: rnd(), turns: 1 + Math.floor(rnd() * 4) }; });

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const s of sheets) for (let j = 0; j < 5; j++) {
      const t = ((j / 5 + phase * s.turns + s.lag) % 1), x = lerp(s.z * 1.4, -s.z * 1.4, t), y = height(x, s.z) + .2;
      const p = cam.project([x, y, s.z]); if (p[2] <= 0) continue; const k = cam.focal / p[2];
      glow(target, p[0], p[1] - .1 * k, 5 * s.w * k, .25 * k, '232,236,248', .16 * Math.sin(Math.PI * t));
    }
    for (const g of glints) { const a = Math.max(0, Math.sin(TAU * (phase * g.turns + g.lag))) ** 12; if (a > .02) glow(target, g.at[0], g.at[1], 4, 4, '255,250,240', .9 * a); }
  };
}

module.exports = {
  title: '서리가 스치는 설원 언덕',
  slug: 'drift-frost-over-snow-hollows',
  sound: 'snow',
  createScene,
};
