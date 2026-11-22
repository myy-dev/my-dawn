'use strict';

// 87 · 밀밭에 부는 밤바람
// Down among the wheat at night, eye level with the ears. The nearest stalks stand tall in front of us,
// each with its own height, lean and heavy bearded ear; behind them the field runs off to a low horizon
// where one old oak stands and a farmhouse window burns. A thin crescent moon. Gusts roll across the field
// as travelling bands of light and shadow, and the near stalks bow as each gust reaches them.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: 0, y: .95, z: 0, yaw: -.05, pitch: -.02, focal: 1100, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, .95, 1e6])[1];
const WHEAT = [168, 150, 104];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 10, [[0, '#070b18'], [.5, '#121c30'], [.85, '#24324a'], [1, '#384660']]);
  ctx.fillRect(0, 0, W, HORIZON + 10);
  paint.starfield(ctx, rnd, 420, HORIZON);
  // a crescent: the lit sliver, the dark disc faintly visible by earthshine, and a halo
  const [mx, my] = [430, 170];
  glow(ctx, mx, my, 160, 160, '200,210,230', .2);
  ctx.fillStyle = 'rgba(70,80,100,.35)'; ctx.beginPath(); ctx.arc(mx, my, 20, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e6eaf0'; ctx.beginPath(); ctx.arc(mx, my, 20, -1.2, 1.9); ctx.arc(mx + 7, my - 3, 17, 1.9, -1.2, true); ctx.fill();
  for (let i = 0; i < 12; i++) glow(ctx, rnd() * W, 160 + rnd() * 260, 240 + rnd() * 360, 10 + rnd() * 16, '60,74,100', .14);
}

// The far edge: a hedge line, one spreading oak, and a farmhouse with a lit window, all small and hazy.
function horizonLine(ctx, rnd) {
  paint.ridgeline(ctx, HORIZON + 2, 18, [30, 38, 46], 71, [[220, 1], [40, .7], [9, .5], [3, .3]], HORIZON + 30);
  const [ox, oy] = P([-38, 0, 160]);
  // oak: a short trunk splitting into limbs, crowned with lumpy masses, one side thinner where a limb fell
  ctx.strokeStyle = '#141a20'; ctx.lineCap = 'round';
  const limb = (x, y, a, len, w, d) => {
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
    ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
    if (d > 0) for (let k = 0; k < 2 + (rnd() < .3 ? 1 : 0); k++) limb(ex, ey, a + (rnd() - .5) * 1.2, len * (.6 + rnd() * .2), w * .6, d - 1);
    else for (let k = 0; k < 3; k++) glow(ctx, ex + (rnd() - .5) * 8, ey + (rnd() - .5) * 6, 9 + rnd() * 8, 6 + rnd() * 6, '20,26,32', .9);
  };
  limb(ox, oy, -Math.PI / 2 - .05, 22, 6, 4);
  const house = P([46, 0, 210]);
  fill(ctx, [[house[0] - 22, house[1]], [house[0] + 18, house[1]], [house[0] + 18, house[1] - 14], [house[0] - 2, house[1] - 26], [house[0] - 22, house[1] - 14]], '#161c24');
  glow(ctx, house[0] + 6, house[1] - 8, 14, 10, '255,190,120', .8);
  ctx.fillStyle = '#ffcf8a'; ctx.fillRect(house[0] + 4, house[1] - 10, 4, 3);
}

// The field as a surface: the tops of the wheat seen at a low angle, finer and paler with distance.
function field(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#3a3a34'], [.2, '#4a4636'], [.6, '#3a3424'], [1, '#1c1a14']]);
  ctx.fillRect(0, HORIZON + 1, W, H);
  for (let i = 0; i < 9000; i++) {
    const z = 3 + rnd() ** 2.2 * 160, x = (rnd() - .5) * z * 2.4, s = cam.project([x, 1, z]);
    if (s[2] <= 0 || s[1] < HORIZON) continue;
    const k = cam.focal / s[2], fog = Math.min(1, z / 150);
    ctx.strokeStyle = shade(paint.aerial(WHEAT, .3 + fog * .6, [60, 70, 90]), (rnd() - .5) * 40 - 40, .5);
    ctx.lineWidth = Math.max(.5, .025 * k);
    ctx.beginPath(); ctx.moveTo(s[0], s[1] + .15 * k); ctx.lineTo(s[0] + .04 * k, s[1] - .12 * k); ctx.stroke();
  }
}

// One stalk: a slender stem bending under its ear, the ear a stack of grains, long awns fanning up.
function stalk(ctx, s, bow) {
  const base = cam.project([s.x, 0, s.z]); if (base[2] <= .2) return;
  const k = cam.focal / base[2], h = s.h * k, lean = s.lean + bow;
  const tip = [base[0] + Math.sin(lean) * h, base[1] - Math.cos(lean) * h];
  const ctrl = [base[0] + Math.sin(lean * .4) * h * .6, base[1] - h * .6];
  ctx.strokeStyle = shade(s.color, -30, .95); ctx.lineWidth = Math.max(.7, .007 * k); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.quadraticCurveTo(ctrl[0], ctrl[1], tip[0], tip[1]); ctx.stroke();
  // the ear hangs on along the stem's last direction, heavier ears droop more
  const dir = Math.atan2(tip[1] - ctrl[1], tip[0] - ctrl[0]) + s.droop + bow * .5, len = s.ear * k;
  const grains = s.z < 2 ? 8 : 5;
  for (let g = 0; g < grains; g++) {
    const t = g / grains, cx = tip[0] + Math.cos(dir) * len * t, cy = tip[1] + Math.sin(dir) * len * t;
    const w = len * .11 * (1 - Math.abs(t - .45));
    for (const side of [-1, 1]) {
      ctx.fillStyle = shade(s.color, (side < 0 ? 18 : -8) + (g % 2) * 6, 1);
      ctx.beginPath(); ctx.ellipse(cx + Math.cos(dir + side * 1.3) * w * .5, cy + Math.sin(dir + side * 1.3) * w * .5, w * .9, w * .45, dir + side * .5, 0, TAU); ctx.fill();
      if (s.z < 2.5 && g % 2 === 0) {          // awns only where they can be seen
        ctx.strokeStyle = shade(s.color, 30, .55); ctx.lineWidth = Math.max(.4, .002 * k);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(dir + side * .35) * len * .9, cy + Math.sin(dir + side * .35) * len * .9); ctx.stroke();
      }
    }
  }
}

function makeStalks(rnd) {
  const out = [];
  for (let i = 0; i < 190; i++) {
    const z = .7 + rnd() ** 1.4 * 5, x = (rnd() - .5) * z * 2.2;
    out.push({
      x, z, h: .85 + rnd() * .3, lean: (rnd() - .5) * .16, droop: .25 + rnd() * .5, ear: .08 + rnd() * .05,
      color: [lerp(112, 150, rnd()), lerp(100, 130, rnd()), lerp(70, 92, rnd())], lag: x * .35 + z * .2,
    });
  }
  return out.sort((a, b) => b.z - a.z);
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(87011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  field(ctx, rnd);
  horizonLine(ctx, rnd);
  paint.applyTexture(ctx, make, 8701, .38, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, skyFade: 400, ambient: [.66, .7, .8], lights: [] })(ctx);
  const stalks = makeStalks(rnd);
  // gust bands: soft light and shadow lying on the field, travelling left to right once or twice a loop
  const bands = [[0, 1, .16, '214,198,150'], [.5, 1, .12, '214,198,150'], [.27, 2, .12, '10,10,20']];

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save();
    target.beginPath(); target.rect(0, HORIZON + 2, W, H); target.clip();
    for (const [off, turns, a, rgb] of bands) {
      const x = ((phase * turns + off) % 1) * (W + 1200) - 600;
      target.save(); target.translate(x, HORIZON + 200); target.rotate(.25);
      glow(target, 0, 0, 260, 900, rgb, a);
      target.restore();
    }
    target.restore();
    // a gust reaches each stalk when the band passes over it, plus a slow steady sway
    for (const s of stalks) {
      const sx = P([s.x, 0, s.z])[0];
      let gust = 0;
      for (const [off, turns] of bands.slice(0, 2)) {
        const bx = ((phase * turns + off) % 1) * (W + 1200) - 600;
        gust += Math.exp(-(((sx - bx) / 260) ** 2));
      }
      const bow = .05 * Math.sin(TAU * (phase * 3) + s.lag) + .22 * gust;
      stalk(target, s, bow);
    }
  };
}

module.exports = {
  title: '밀밭에 부는 밤바람',
  slug: 'night-wind-in-the-wheat',
  sound: 'grass',
  createScene,
};
