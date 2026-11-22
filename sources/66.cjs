'use strict';

// 66 · 새벽빛이 감도는 산 너머
// A high alpine valley in the moment the first light touches the peaks. Across a dark valley floor with a
// winding braided stream, a wall of jagged granite summits rises: snow in their couloirs, glaciers in the
// cirques. The topmost tips are struck pink-gold by the sun while everything below is still deep indigo
// shadow — alpenglow — and the line between light and shadow is very slowly sliding down the faces. Thin
// cloud streamers hang off the highest summit. The stream glints faintly in the valley.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, v3, noise } = paint;

const cam = camera({ x: 0, y: 30, z: 0, yaw: 0, pitch: -.1, focal: 1000, cx: 960, cy: 600 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 30, 1e6])[1];
const SUN = v3.unit([.6, .18, -.3]);

function ridged(x, z, seed, scale) {
  let h = 0, amp = 1, f = 1;
  for (let o = 0; o < 4; o++) { const n = 1 - Math.abs(2 * noise(x * f / scale, z * f / scale, seed + o) - 1); h += n ** 2.2 * amp; amp *= .45; f *= 2.05; }
  return h;
}
const wall = z => Math.min(1, Math.max(0, (z - 1400) / 1600));
function height(x, z) {
  const valley = 12 * noise(x / 300, z / 300, 2);
  const mtn = ridged(x, z, 41, 2600) * 1000 * wall(z) ** .8;
  return valley + mtn;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(66011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON); sky.addColorStop(0, '#141c3a'); sky.addColorStop(.6, '#3a4068'); sky.addColorStop(1, '#a07a88');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 80, HORIZON * .4);
  const layers = [];
  paint.terrain(ctx, cam, height, { z0: 30, z1: 7000, cols: 420, rows: 320, bias: 1.8, fan: 1.05, cx: 0 }, (p, n) => {
    const steep = 1 - n[1], snow = (p[1] > 500 && steep < .55 + noise(p[0] / 40, p[2] / 40, 5) * .2) || (p[1] > 900 && steep < .7);
    const lit = Math.max(0, n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2]);
    const fog = Math.min(1, p[2] / 7000) ** 1.3;
    let c;
    if (p[1] < 40) c = [28, 34, 44].map(v => v + 6 * noise(p[0] / 60, p[2] / 60, 9));
    else if (snow) c = [84, 92, 132].map(v => v * (.55 + .45 * n[1]));
    else c = [44, 46, 70].map(v => v * (.7 + .5 * lit));
    return shade(c.map((v, i) => lerp(v, [110, 104, 140][i], fog * .6)), 0);
  });
  // the stream braided across the valley floor
  for (let s = 0; s < 3; s++) {
    ctx.strokeStyle = `rgba(150,170,210,${.35 - s * .08})`; ctx.lineWidth = 3 - s * .8; ctx.beginPath();
    for (let i = 0; i <= 60; i++) { const z = lerp(200, 1300, i / 60), x = 120 * Math.sin(z / 160 + s * .7) + s * 30 - 80; const p = P([x, height(x, z) + .5, z]); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }
    ctx.stroke();
  }
  paint.applyTexture(ctx, make, 6601, .34, 0, 0, W, H, true);
  // alpenglow overlay: the lit summits, prepared as a mask of everything above a height (drawn per frame)
  const glowLayer = make(W, H), gc = glowLayer.getContext('2d');
  paint.terrain(gc, cam, height, { z0: 1400, z1: 7000, cols: 220, rows: 200, bias: 1.6, fan: 1.05, cx: 0 }, (p, n) => {
    const lit = Math.max(0, n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2]);
    const a = Math.min(1, Math.max(0, (p[1] - 850) / 250)) * lit;
    return a > .25 ? `rgb(255,${Math.round(150 + 40 * a)},${Math.round(130 + 30 * a)})` : 'rgba(0,0,0,0)';
  });
  const summit = (() => { let best = [0, 0, 0]; for (let i = 0; i < 400; i++) { const x = (rnd() - .5) * 3000, z = 2600 + rnd() * 3000, h = height(x, z); if (h > best[1]) best = [x, h, z]; } return P(best); })();

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the light line breathes down and back up the faces once per loop
    const reach = .55 + .25 * (.5 - .5 * Math.cos(TAU * phase));
    target.save(); target.beginPath(); target.rect(0, 0, W, lerp(HORIZON - 620, HORIZON - 300, reach)); target.clip();
    target.globalCompositeOperation = 'soft-light'; target.globalAlpha = .7; target.drawImage(glowLayer, 0, 0);
    target.restore();
    // a cloud banner streaming off the high summit
    for (let i = 0; i < 8; i++) { const t = (phase * 2 + i / 8) % 1; glow(target, summit[0] + 20 + t * 300, summit[1] + 10 + t * 30, 30 + t * 120, 8 + t * 20, '240,210,220', .3 * (1 - t) * Math.min(1, t * 10)); }
  };
}

module.exports = {
  title: '새벽빛이 감도는 산 너머',
  slug: 'indigo-peaks-meet-first-light',
  sound: 'wind',
  createScene,
};
