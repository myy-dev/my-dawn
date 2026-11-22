'use strict';

// 03 · 안개 낀 곶의 등대
// A rocky headland at night in sea fog, seen from the water's edge across a small cove. The land runs out
// from the left in stepped cliffs of dark fractured rock, each step a ledge with a lip of grass; at its tip
// stands a white lighthouse with a black gallery and a red-domed lantern, a keeper's cottage crouched
// beside it with one lit window. The lamp turns: its beam sweeps through the fog as a broad pale shaft,
// brightening as it swings toward us. Below, swells roll in and break white over the rocks at the foot.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, noise, pathOf } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
const SEA = 690, TOWER = { x: 1180, base: 340, h: 230, rb: 40, rt: 28 };

// The cliff: a plateau edge (top line) and a foot line, filled with vertical facets that catch the light
// from the left differently, broken by horizontal ledges.
function cliff(ctx, rnd) {
  const topY = x => x < 1320 ? 330 + 20 * noise(x / 120, 1, 3) + (x < 300 ? -60 + x * .2 : 0) : 330 + (x - 1320) * 2.2;
  const footY = x => SEA + 6 * noise(x / 50, 2, 4);
  const end = 1460;
  // the body, dark
  fill(ctx, [[-20, topY(-20)], ...Array.from({ length: 80 }, (_, i) => { const x = lerp(-20, end, i / 79); return [x, topY(x)]; }), [end, footY(end)], [-20, footY(-20)]], '#14161c');
  // facets
  for (let i = 0; i < 520; i++) {
    const x = rnd() * end, yTop = topY(x) + 6, yBot = footY(x), y = lerp(yTop, yBot, rnd()), w = 12 + rnd() * 22, h = 90 + rnd() * 180;
    if (y + h > yBot + 10 || x + w > end - (end - 1320) * (y - 330) / 330) continue;
    const facing = rnd(), light = .55 + .5 * facing * (1 - (y - 330) / 600);
    const pts = [[x, y], [x + w, y + w * (rnd() - .5) * .3], [x + w * (.9 + rnd() * .2), y + h], [x - w * .1, y + h * (.9 + rnd() * .1)]];
    fill(ctx, pts, shade([30, 32, 40].map(c => c * light), 0));
    if (facing > .7) { ctx.strokeStyle = 'rgba(150,160,170,.18)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.lineTo(...pts[3]); ctx.stroke(); }
  }
  // ledges with grass lips
  for (let l = 0; l < 6; l++) {
    const y0 = 380 + l * 50 + rnd() * 20, x0 = rnd() * 400, x1 = x0 + 300 + rnd() * 600;
    ctx.strokeStyle = 'rgba(10,10,14,.7)'; ctx.lineWidth = 4; ctx.beginPath(); for (let x = x0; x <= x1; x += 20) ctx.lineTo(x, y0 + 6 * Math.sin(x / 60 + l)); ctx.stroke();
    ctx.strokeStyle = 'rgba(70,90,60,.6)'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = x0; x <= x1; x += 20) ctx.lineTo(x, y0 - 3 + 6 * Math.sin(x / 60 + l)); ctx.stroke();
  }
  // the grassy top
  ctx.fillStyle = '#26362a'; ctx.beginPath(); ctx.moveTo(-20, topY(-20) + 12); for (let x = -20; x <= 1340; x += 10) ctx.lineTo(x, topY(x) - 4 - 3 * noise(x / 20, 4, 5)); ctx.lineTo(1340, topY(1340) + 14); for (let x = 1340; x >= -20; x -= 10) ctx.lineTo(x, topY(x) + 14); ctx.fill();
  // rocks at the foot
  for (let i = 0; i < 26; i++) { const x = 100 + rnd() * 1400, r = 14 + rnd() * 40; fill(ctx, paint.wobble(Array.from({ length: 9 }, (_, k) => [x + Math.cos(k / 9 * TAU) * r * 1.4, SEA + 4 + Math.sin(k / 9 * TAU) * r * .5 - r * .3]), r * .1, 301 + i, 10), shade([24, 26, 32], (rnd() - .5) * 10)); }
  return topY;
}

function tower(ctx) {
  const { x, base, h, rb, rt } = TOWER, top = base - h;
  const g = ctx.createLinearGradient(x - rb, 0, x + rb, 0); g.addColorStop(0, '#7a8288'); g.addColorStop(.3, '#e4e8e8'); g.addColorStop(.7, '#9aa0a4'); g.addColorStop(1, '#40464c');
  fill(ctx, [[x - rb, base], [x + rb, base], [x + rt, top], [x - rt, top]], g);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, base, rb, 8, 0, 0, Math.PI); ctx.fill();
  for (let w = 1; w < 4; w++) { const y = lerp(base, top, w / 4); ctx.fillStyle = '#1a1e22'; ctx.fillRect(x - 5, y - 14, 10, 20); }
  // gallery: a black deck and railing
  fill(ctx, [[x - rt - 16, top], [x + rt + 16, top], [x + rt + 12, top - 8], [x - rt - 12, top - 8]], '#16181c');
  ctx.strokeStyle = '#16181c'; ctx.lineWidth = 2; for (let r = -6; r <= 6; r++) { ctx.beginPath(); ctx.moveTo(x + r * (rt + 12) / 6, top - 8); ctx.lineTo(x + r * (rt + 12) / 6, top - 30); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(x - rt - 12, top - 30); ctx.lineTo(x + rt + 12, top - 30); ctx.stroke();
  // lantern room: glass panes with mullions, red dome, vent ball
  fill(ctx, [[x - rt + 4, top - 8], [x + rt - 4, top - 8], [x + rt - 4, top - 58], [x - rt + 4, top - 58]], '#f0dca0');
  ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3; for (let m = -1; m <= 1; m++) { ctx.beginPath(); ctx.moveTo(x + m * rt * .5, top - 8); ctx.lineTo(x + m * rt * .5, top - 58); ctx.stroke(); }
  ctx.fillStyle = '#8a2a22'; ctx.beginPath(); ctx.ellipse(x, top - 58, rt, 22, 0, Math.PI, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,180,.25)'; ctx.beginPath(); ctx.ellipse(x - rt * .4, top - 66, rt * .3, 6, -.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#16181c'; ctx.beginPath(); ctx.arc(x, top - 84, 5, 0, TAU); ctx.fill();
  // cottage
  const cx = 1010, cy = TOWER.base + 4;
  fill(ctx, [[cx - 90, cy], [cx + 70, cy], [cx + 70, cy - 70], [cx - 90, cy - 70]], '#a0a6a8');
  fill(ctx, [[cx - 100, cy - 70], [cx + 80, cy - 70], [cx + 50, cy - 118], [cx - 70, cy - 118]], '#2a2c32');
  ctx.fillStyle = '#3a3c42'; ctx.fillRect(cx + 30, cy - 136, 14, 30);
  ctx.fillStyle = '#e8a860'; ctx.fillRect(cx - 50, cy - 48, 24, 24); glow(ctx, cx - 38, cy - 36, 40, 30, '255,180,110', .5);
  return [x, top - 34];
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(3011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, SEA); sky.addColorStop(0, '#0a1018'); sky.addColorStop(1, '#2c3844');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 60, 300);
  // the far sea under fog, and the near swell
  const sea = ctx.createLinearGradient(0, 600, 0, H); sea.addColorStop(0, '#2a3640'); sea.addColorStop(1, '#080c12');
  ctx.fillStyle = sea; ctx.fillRect(0, 600, W, H);
  for (let i = 0; i < 40; i++) { const y = lerp(SEA + 4, H, (i / 40) ** 1.5); ctx.strokeStyle = `rgba(150,170,180,${.05 + .05 * rnd()})`; ctx.lineWidth = 1 + i * .08; ctx.beginPath(); for (let x = -1; x <= W + 1; x += 40) ctx.lineTo(x, y + Math.sin(x * .006 + i * 1.3) * (2 + i * .3)); ctx.stroke(); }
  cliff(ctx, rnd);
  const lantern = tower(ctx);
  paint.applyTexture(ctx, make, 3012, .36, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.6, .66, .76], lights: [paint.LIGHT.lamp(lantern[0], lantern[1] + 80, .35, 500, 300, [1.3, 1.1, .8])] })(ctx);
  const foot = Array.from({ length: 30 }, () => ({ x: 80 + rnd() * 1420, lag: rnd(), w: 30 + rnd() * 70 }));
  const fogBands = Array.from({ length: 10 }, () => ({ y: lerp(250, H, rnd()), lag: rnd(), w: 600 + rnd() * 600 }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const f of foot) { const t = (phase * 2 + f.lag) % 1, burst = t < .35 ? Math.sin(Math.PI * t / .35) : 0, drain = t >= .35 ? 1 - (t - .35) / .65 : 0; glow(target, f.x, SEA - burst * 26, f.w * (1 + burst), 8 + burst * 30, '220,230,236', .45 * burst + .12 * drain); }
    for (const fb of fogBands) glow(target, ((phase + fb.lag) % 1) * (W + 1200) - 600, fb.y, fb.w, 60, '150,164,176', .08);
    // the beam: two opposite shafts on a turning lamp — seen from the side, each swings across and back
    const a = TAU * phase;
    target.save(); target.globalCompositeOperation = 'lighter';
    for (const off of [0, Math.PI]) {
      const ang = a + off, side = Math.sin(ang), toward = Math.cos(ang);
      const len = 1900 * Math.abs(side) + 120, spread = 40 + 220 * Math.max(0, toward);
      const ex = lantern[0] + side * len, ey = lantern[1] + 30 * Math.max(0, toward);
      const gb = target.createLinearGradient(...lantern, ex, ey); gb.addColorStop(0, `rgba(255,240,200,${.28 + .3 * Math.max(0, toward)})`); gb.addColorStop(1, 'rgba(255,240,200,0)');
      target.fillStyle = gb; target.beginPath(); target.moveTo(lantern[0], lantern[1] - 6); target.lineTo(ex, ey - spread); target.lineTo(ex, ey + spread); target.lineTo(lantern[0], lantern[1] + 6); target.fill();
    }
    target.restore();
    const flash = Math.max(0, Math.cos(a)) ** 30 + Math.max(0, Math.cos(a + Math.PI)) ** 30;
    glow(target, lantern[0], lantern[1], 24 + 220 * flash, 24 + 220 * flash, '255,240,200', .6 + .4 * flash);
  };
}

module.exports = {
  title: '안개 낀 곶의 등대',
  slug: 'beacon-on-the-headland',
  sound: 'sea',
  createScene,
};
