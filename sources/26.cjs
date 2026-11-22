'use strict';

// 26 · 해식 절벽 아래의 밤 파도
// Low on the wet rocks at the foot of a sea cliff at night. The cliff rises on the right in tilted layers of
// sandstone and shale, its seaward faces silvered by the moon, its gullies black. Out on the water the moon
// lays a long broken glade. Swells come in from the dark in long lines; each steepens, its crest whitens,
// and it breaks over the ledge in front of us, foam running back in lace across the rock and spray thrown
// up where it hits the boulders.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, shade, camera, wobble, v3 } = paint;

const cam = camera({ x: 0, y: 2.2, z: 0, yaw: -.12, pitch: -.02, focal: 1100, cx: 960, cy: 520 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 2.2, 1e6])[1];
const MOON = [560, 180];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#060a16'], [.6, '#141c30'], [1, '#26304a']]);
  ctx.fillRect(0, 0, W, HORIZON + 2);
  paint.starfield(ctx, rnd, 260, HORIZON);
  glow(ctx, ...MOON, 300, 300, '200,212,234', .28);
  ctx.fillStyle = '#eef2f6'; ctx.beginPath(); ctx.arc(...MOON, 26, 0, TAU); ctx.fill();
  for (let i = 0; i < 12; i++) glow(ctx, rnd() * W, 120 + rnd() * 260, 260 + rnd() * 400, 10 + rnd() * 14, '40,50,72', .3);
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#1e283c'], [.3, '#121a2a'], [1, '#060a12']]);
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
}

// The cliff: a great mass on the right with tilted strata, its faces turned toward the moon catching light.
function cliff(ctx, rnd) {
  const outline = wobble([[1180, HORIZON + 40], [1250, 360], [1320, 210], [1430, 120], [1560, 60], [1720, -20], [W + 40, -20], [W + 40, H], [1300, H], [1220, 760]], 16, 261, 24);
  fill(ctx, outline, vertical(ctx, 0, H, [[0, '#2a2e3a'], [1, '#101218']]));
  ctx.save(); pathOf(ctx, outline); ctx.clip();
  // strata: bands dipping to the left, each a slightly different stone
  for (let i = 0; i < 40; i++) {
    const y0 = -100 + i * 32 + (rnd() - .5) * 10, tone = (rnd() - .5) * 26;
    ctx.fillStyle = shade([52, 52, 60], tone, .5);
    ctx.beginPath(); ctx.moveTo(1100, y0 + 120); for (let x = 1100; x <= W + 40; x += 40) ctx.lineTo(x, y0 + 120 - (x - 1100) * .22 + 6 * Math.sin(x * .03 + i)); ctx.lineTo(W + 40, y0 + 120 - (W - 1060) * .22 + 30); ctx.lineTo(1100, y0 + 150); ctx.fill();
    ctx.strokeStyle = 'rgba(10,10,14,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let x = 1100; x <= W + 40; x += 40) ctx.lineTo(x, y0 + 120 - (x - 1100) * .22 + 6 * Math.sin(x * .03 + i)); ctx.stroke();
  }
  // gullies: a few irregular clefts slanting down the face, each with a moonlit lip on its left side
  for (let g = 0; g < 6; g++) {
    const x = 1260 + g * 110 + (rnd() - .5) * 60, w = 8 + rnd() * 30, slant = 60 + rnd() * 120, pts = [];
    for (let y = -20; y <= H; y += 60) pts.push([x + (y / H) * slant + 14 * edge(y + g * 50, 265), y]);
    ctx.fillStyle = 'rgba(6,6,10,.45)'; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); pts.slice().reverse().forEach(p => ctx.lineTo(p[0] + w * (.6 + .4 * Math.sin(p[1] * .01)), p[1])); ctx.fill();
    ctx.strokeStyle = 'rgba(170,184,210,.18)'; ctx.lineWidth = 3; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0] - 3, p[1]) : ctx.moveTo(p[0] - 3, p[1]))); ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(190,200,224,.45)'; ctx.lineWidth = 2; ctx.beginPath(); outline.slice(0, 6).forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
}

// Foreground ledge and boulders, black and wet, with moonlit rims.
function rocks(ctx, rnd) {
  const ledge = wobble([[-40, 860], [300, 820], [620, 850], [900, 900], [1240, 880], [1400, 940], [W + 40, 900], [W + 40, H + 40], [-40, H + 40]], 12, 262, 20);
  fill(ctx, ledge, vertical(ctx, 820, H, [[0, '#1a1c22'], [1, '#08090c']]));
  for (let i = 0; i < 14; i++) {
    const x = rnd() * W, y = 840 + rnd() * 220, r = 30 + rnd() * 90;
    const b = wobble(Array.from({ length: 10 }, (_, k) => [x + Math.cos(k / 10 * TAU) * r * 1.3, y + Math.sin(k / 10 * TAU) * r * .7 - r * .4]), r * .1, 263 + i, 12);
    fill(ctx, b, shade([26, 28, 34], (rnd() - .5) * 10));
    ctx.strokeStyle = 'rgba(190,204,230,.35)'; ctx.lineWidth = 2; ctx.beginPath(); b.slice(5, 9).forEach((p, k) => (k ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  }
  return ledge;
}

// One swell line at distance z: a band of water whose crest whitens as it nears the ledge.
function swell(ctx, z, foam, seed) {
  const pts = [], left = -60, right = 1300;
  for (let x = left; x <= right; x += 12) {
    const p = P([lerp(-30, 26, (x - left) / (right - left)) * z / 14, .02, z]);
    pts.push([x, p[1] + 3 * edge(x * 1.4 + seed, 264)]);
  }
  const k = cam.focal / z;
  // the swell's shadowed back, a dark band
  ctx.strokeStyle = 'rgba(4,8,16,.4)'; ctx.lineWidth = Math.max(1, .14 * k);
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] + .1 * k) : ctx.moveTo(p[0], p[1] + .1 * k))); ctx.stroke();
  // its crest: white only in broken stretches where it is spilling, thin and lacy
  ctx.lineWidth = Math.max(.8, .03 * k * (1 + foam * 2));
  for (let i = 1; i < pts.length; i++) {
    const n = edge(pts[i][0] * 2 + seed, 266);
    if (n < .25 - foam * .9) continue;
    ctx.strokeStyle = `rgba(214,226,240,${Math.min(.85, foam * (.5 + n))})`;
    ctx.beginPath(); ctx.moveTo(...pts[i - 1]); ctx.lineTo(...pts[i]); ctx.stroke();
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(26011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  cliff(ctx, rnd);
  paint.applyTexture(ctx, make, 2601, .34, 0, 0, W, H, true);
  const fg = make(W, H);
  rocks(fg.getContext('2d'), rnd);
  const foamLace = Array.from({ length: 60 }, () => ({ x: rnd() * 1300, y: 800 + rnd() * 120, w: 40 + rnd() * 160, offset: rnd() }));
  const spray = Array.from({ length: 70 }, () => ({ x: 300 + rnd() * 900, vx: (rnd() - .5) * 120, vy: 200 + rnd() * 260, r: 1 + rnd() * 2.5 }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the moon's glade, shivering
    for (let i = 0; i < 60; i++) {
      const y = HORIZON + 6 + (i / 60) ** 1.4 * 320, spread = 8 + (y - HORIZON) * .35;
      const x = MOON[0] + Math.sin(TAU * (phase * 3 + i * .37)) * spread * .4, a = (.5 + .5 * Math.sin(TAU * (phase * 4 + i * .61))) * .4;
      target.fillStyle = `rgba(214,224,240,${a})`; target.fillRect(x - spread * .35, y, spread * .7, 1.6);
    }
    // swells march in: four sets per loop, each line moving from far to the ledge, whitening as it comes
    for (let s = 0; s < 7; s++) {
      const t = (phase * 4 + s / 7) % 1, z = lerp(70, 8, t);
      swell(target, z, Math.max(0, (t - .6) / .4) ** 1.5 * .9 + .05, s * 97);
    }
    // the break: when a swell reaches the ledge, a white burst runs along it and spray goes up
    const hit = (phase * 4) % 1, burst = Math.max(0, 1 - hit / .35);
    for (const f of foamLace) {
      const a = burst * .6 + .15 * Math.sin(TAU * (phase * 4 + f.offset)) ** 2;
      target.fillStyle = `rgba(220,230,242,${a})`; target.fillRect(f.x, f.y - burst * 20, f.w * (1 - hit * .5), 2);
    }
    target.drawImage(fg, 0, 0);
    if (hit < .4) {
      const t = hit / .4;
      for (const d of spray) {
        const x = d.x + d.vx * t, y = 860 - d.vy * t + 400 * t * t;
        target.fillStyle = `rgba(226,234,246,${.7 * (1 - t)})`; target.beginPath(); target.arc(x, y, d.r, 0, TAU); target.fill();
      }
    }
  };
}

module.exports = {
  title: '해식 절벽 아래의 밤 파도',
  slug: 'night-surf-below-the-cliff',
  sound: 'sea',
  createScene,
};
