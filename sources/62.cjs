'use strict';

// 62 · 별똥별을 기다리는 고원
// A high grassy plateau on a clear moonless night in meteor season. Someone has left a camp mat and a
// rolled sleeping bag on the short grass, a thermos and a cup beside them, and a small telescope on its
// tripod pointing up. The plateau's edge falls away to a sea of low hills under faint mist. The whole sky
// is stars, the Milky Way rising from the hills. Every so often a meteor streaks across and fades; the
// short grass shivers in a light wind.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, noise, pathOf } = paint;

const cam = camera({ x: 0, y: 1.2, z: 0, yaw: .06, pitch: -.12, focal: 1000, cx: 960, cy: 640 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(.06) * 1e6, 1.2, Math.cos(.06) * 1e6])[1];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(62011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON); sky.addColorStop(0, '#02040a'); sky.addColorStop(.75, '#0a1222'); sky.addColorStop(1, '#1a2236');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // Milky Way rising almost vertically from the hills at the right
  const band = t => [lerp(1500, 700, t) + 120 * Math.sin(t * 3), lerp(HORIZON + 30, -200, t)];
  // the band: a broad soft spine first, then fine mottling spread like a bell curve across it, so it reads
  // as one glowing river of stars rather than separate blotches
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
  for (let i = 0; i <= 60; i++) { const [x, y] = band(i / 60); glow(ctx, x, y, 230, 120, '150,164,210', .05 * (1 - i / 80)); }
  for (let i = 0; i < 1100; i++) { const t = rnd(), [x, y] = band(t); glow(ctx, x + gauss() * 160, y + gauss() * 30, 24 + rnd() * 46, 18 + rnd() * 36, rnd() < .75 ? '170,180,220' : '230,210,180', .03 * (1 - t * .6)); }
  for (let i = 0; i < 4000; i++) { const t = rnd(), [x, y] = band(t); if (y > HORIZON) continue; ctx.fillStyle = `rgba(230,236,255,${.15 + rnd() * .5})`; ctx.fillRect(x + gauss() * 150, y + gauss() * 20, 1, 1); }
  // the dark dust lane: a thin wandering rift just off the spine, made of small elongated shadows
  for (let i = 0; i < 70; i++) { const t = .03 + i / 70 * .7, [x, y] = band(t); glow(ctx, x - 30 + 40 * Math.sin(t * 9), y, 14 + rnd() * 10, 26 + rnd() * 20, '2,4,10', .12); }
  paint.starfield(ctx, rnd, 1200, HORIZON);
  // distant hills in layers with mist between
  for (let l = 0; l < 4; l++) {
    const base = HORIZON + 6 + l * 10, tone = [22 + l * 4, 28 + l * 4, 42 + l * 4];
    ctx.fillStyle = shade(tone, 0); ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, base - 30 * (noise(x / (300 - l * 50), l, 7) - .3) - 10 * noise(x / 60, l, 8));
    ctx.lineTo(W, H); ctx.fill();
    glow(ctx, 960, base + 6, 1400, 10, '90,100,130', .18);
  }
  // the plateau: short grass sloping to an edge, darker near
  const edgeY = HORIZON + 60;
  const g = ctx.createLinearGradient(0, edgeY, 0, H); g.addColorStop(0, '#1e2a26'); g.addColorStop(1, '#0a100e');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, edgeY + 20); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, edgeY + 12 * Math.sin(x / 300) + 8 * noise(x / 80, 0, 2)); ctx.lineTo(W, H); ctx.fill();
  for (let i = 0; i < 6000; i++) { const y = edgeY + rnd() ** 1.8 * (H - edgeY), x = rnd() * W, h = 2 + (y - edgeY) * .03; ctx.strokeStyle = shade([40, 60, 50], (rnd() - .5) * 30, .6); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rnd() - .5) * 2, y - h); ctx.stroke(); }
  // the camp: mat, sleeping bag roll, thermos, cup, telescope
  const mat = [P([-1.4, 0, 3.4]), P([.4, 0, 3.4]), P([.6, 0, 5.4]), P([-1.2, 0, 5.4])].map(([x, y]) => [x, y]);
  fill(ctx, mat, '#26304a'); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2; for (let r = 1; r < 6; r++) { const a = [lerp(mat[0][0], mat[3][0], r / 6), lerp(mat[0][1], mat[3][1], r / 6)], b = [lerp(mat[1][0], mat[2][0], r / 6), lerp(mat[1][1], mat[2][1], r / 6)]; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  const bag = P([-.5, .2, 5.3]), bk = cam.focal / 5.3;
  ctx.fillStyle = '#4a2a24'; ctx.beginPath(); ctx.ellipse(bag[0], bag[1], .7 * bk, .14 * bk, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; for (let s = -2; s <= 2; s++) { ctx.beginPath(); ctx.ellipse(bag[0] + s * .3 * bk, bag[1], .05 * bk, .2 * bk, 0, 0, TAU); ctx.stroke(); }
  const th = P([.8, 0, 3.6]), tk = cam.focal / 3.6;
  fill(ctx, [[th[0] - .05 * tk, th[1]], [th[0] + .05 * tk, th[1]], [th[0] + .05 * tk, th[1] - .32 * tk], [th[0] - .05 * tk, th[1] - .32 * tk]], '#2a5a4a');
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(th[0] - .055 * tk, th[1] - .36 * tk, .11 * tk, .06 * tk);
  const cu = P([1.05, 0, 3.4]); fill(ctx, [[cu[0] - .04 * tk, cu[1]], [cu[0] + .04 * tk, cu[1]], [cu[0] + .05 * tk, cu[1] - .08 * tk], [cu[0] - .05 * tk, cu[1] - .08 * tk]], '#c8c4bc');
  const tp = P([1.8, 1.3, 6]), tf = P([1.8, 0, 6]), k6 = cam.focal / 6;
  ctx.strokeStyle = '#0c0e14'; ctx.lineWidth = 3; for (const dx of [-.4, 0, .4]) { ctx.beginPath(); ctx.moveTo(...tp); ctx.lineTo(tf[0] + dx * k6, tf[1] + (dx === 0 ? -.05 : .05) * k6); ctx.stroke(); }
  ctx.save(); ctx.translate(tp[0], tp[1]); ctx.rotate(-.9); ctx.fillStyle = '#4a4e58'; ctx.fillRect(-.1 * k6, -.07 * k6, .9 * k6, .14 * k6); ctx.fillStyle = '#1a1a1e'; ctx.fillRect(.8 * k6, -.08 * k6, .1 * k6, .16 * k6); ctx.restore();
  paint.applyTexture(ctx, make, 6201, .36, 0, 0, W, H, true);
  // near grass blades drawn per frame for the wind
  const blades = Array.from({ length: 900 }, () => { const y = lerp(H - 260, H + 10, rnd() ** .7); return { x: rnd() * W, y, h: 10 + (y - (H - 260)) * .18 * (.6 + rnd() * .6), lag: rnd() * TAU, tone: (rnd() - .5) * 20 }; });
  // meteors: three per loop at fixed times, each a streak that grows and fades
  const meteors = [{ t: .12, x: 300, y: 160, dx: 380, dy: 180 }, { t: .47, x: 1100, y: 90, dx: -300, dy: 220 }, { t: .78, x: 1500, y: 260, dx: 260, dy: 120 }];

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const m of meteors) {
      const t = (phase - m.t + 1) % 1; if (t > .05) continue;
      const u = t / .05, head = [m.x + m.dx * u, m.y + m.dy * u], tail = [m.x + m.dx * Math.max(0, u - .4), m.y + m.dy * Math.max(0, u - .4)];
      const g2 = target.createLinearGradient(...tail, ...head); g2.addColorStop(0, 'rgba(220,235,255,0)'); g2.addColorStop(1, `rgba(240,248,255,${Math.sin(Math.PI * u)})`);
      target.strokeStyle = g2; target.lineWidth = 2.2; target.beginPath(); target.moveTo(...tail); target.lineTo(...head); target.stroke();
      glow(target, head[0], head[1], 8, 8, '230,240,255', .7 * Math.sin(Math.PI * u));
    }
    target.lineCap = 'round';
    for (const b of blades) {
      const sway = Math.sin(TAU * phase * 2 + b.lag + b.x * .004) * b.h * .2;
      target.strokeStyle = shade([26, 40, 34], b.tone); target.lineWidth = 1.5 + b.h * .03;
      target.beginPath(); target.moveTo(b.x, b.y); target.quadraticCurveTo(b.x + sway * .3, b.y - b.h * .6, b.x + sway, b.y - b.h); target.stroke();
    }
  };
}

module.exports = {
  title: '별똥별을 기다리는 고원',
  slug: 'meteor-watch-on-the-plateau',
  sound: 'grass',
  posterPhase: .132,
  createScene,
};
