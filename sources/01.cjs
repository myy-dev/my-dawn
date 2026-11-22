'use strict';

// 01 · 빗방울 너머의 새벽
// Close up against a tall window at the blue hour, rain on the glass. The city beyond is out of focus:
// tower blocks as soft dark shapes, their lit windows and the street lamps below swollen into round bokeh
// discs of amber and teal. On the glass itself, sharp and near, hundreds of raindrops cling; each one is a
// tiny lens holding an upside-down spark of the city light behind it. Some gather and run down in
// wandering trails that leave a clear track behind them. On the sill inside: a mug with steam, a small
// potted fern, a folded letter, a desk lamp's warm spill from the left.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, noise, pathOf } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
const SILL = 900, FRAME = { x0: 60, x1: 1860, y0: 0, y1: SILL - 20 };

// The city, defocused: drawn as large soft shapes and bokeh discs.
function city(ctx, rnd) {
  const sky = ctx.createLinearGradient(0, 0, 0, SILL); sky.addColorStop(0, '#0e1a34'); sky.addColorStop(.6, '#2a3c5e'); sky.addColorStop(1, '#4a5470');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.filter = 'blur(14px)';
  for (let i = 0; i < 18; i++) { const x = rnd() * W, w = 80 + rnd() * 220, h = 200 + rnd() * 520; ctx.fillStyle = shade([18, 26, 44], (rnd() - .5) * 14); ctx.fillRect(x - w / 2, SILL - h, w, h); }
  ctx.restore();
  const lights = [];
  for (let i = 0; i < 90; i++) {
    const x = rnd() * W, y = 200 + rnd() ** .7 * (SILL - 220), r = 10 + rnd() * 34, warm = rnd() < .7;
    const col = warm ? [255, 180 + rnd() * 40, 100] : [120, 220, 230];
    const g = ctx.createRadialGradient(x, y, r * .2, x, y, r);
    g.addColorStop(0, `rgba(${col.map(Math.round)},${.35 + rnd() * .2})`); g.addColorStop(.85, `rgba(${col.map(Math.round)},.18)`); g.addColorStop(1, `rgba(${col.map(Math.round)},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    lights.push([x, y, col]);
  }
  return lights;
}

// The room side: frame, sill, the things on it, the lamp spill.
function room(ctx, rnd) {
  // window frame and mullion
  ctx.fillStyle = '#1e1816';
  ctx.fillRect(0, 0, FRAME.x0, H); ctx.fillRect(FRAME.x1, 0, W - FRAME.x1, H); ctx.fillRect(940, 0, 40, FRAME.y1);
  ctx.fillStyle = 'rgba(255,200,150,.08)'; ctx.fillRect(FRAME.x0 - 8, 0, 8, FRAME.y1); ctx.fillRect(980, 0, 6, FRAME.y1);
  // sill: deep painted wood, slightly worn, catching the lamp
  fill(ctx, [[0, FRAME.y1], [W, FRAME.y1], [W, SILL + 40], [0, SILL + 40]], '#5a4434');
  const s = ctx.createLinearGradient(0, SILL + 40, 0, H); s.addColorStop(0, '#6a5240'); s.addColorStop(1, '#2a1e16');
  ctx.fillStyle = s; ctx.fillRect(0, SILL + 40, W, H);
  paint.planks(ctx, [[0, SILL + 40], [W, SILL + 40], [W, H], [0, H]], rnd, { along: 'u', width: [.3, .4], base: [120, 90, 66], vary: 10, streaks: 4 });
  // mug with steam (steam per frame), on a saucer
  const mx = 1280, my = SILL + 120;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(mx + 20, my + 8, 120, 22, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d8d0c4'; ctx.beginPath(); ctx.ellipse(mx, my, 110, 20, 0, 0, TAU); ctx.fill();
  const body = ctx.createLinearGradient(mx - 70, 0, mx + 70, 0); body.addColorStop(0, '#f0e8dc'); body.addColorStop(.6, '#c8b8a8'); body.addColorStop(1, '#7a6a5e');
  fill(ctx, [[mx - 70, my - 140], [mx + 70, my - 140], [mx + 64, my - 6], [mx - 64, my - 6]], body);
  ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.ellipse(mx, my - 140, 70, 14, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#e4dcd0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(mx, my - 140, 70, 14, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = '#d8ccbe'; ctx.lineWidth = 16; ctx.beginPath(); ctx.ellipse(mx + 86, my - 76, 26, 36, 0, -1.4, 1.4); ctx.stroke();
  // the fern in a clay pot
  const px = 420, py = SILL + 110;
  fill(ctx, [[px - 70, py - 110], [px + 70, py - 110], [px + 54, py], [px - 54, py]], '#a8603a');
  fill(ctx, [[px - 78, py - 124], [px + 78, py - 124], [px + 74, py - 104], [px - 74, py - 104]], '#b8704a');
  for (let f = 0; f < 16; f++) {
    const a = -Math.PI / 2 + (f / 15 - .5) * 2.6, len = 120 + rnd() * 120, x0 = px, y0 = py - 118;
    const tip = [x0 + Math.cos(a) * len, y0 + Math.sin(a) * len * .8 + (Math.abs(a + Math.PI / 2) > .8 ? 50 : 0)];
    ctx.strokeStyle = '#2a4a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + Math.cos(a) * len * .5, y0 + Math.sin(a) * len * .7, ...tip); ctx.stroke();
    for (let l = 2; l < 14; l++) { const t = l / 14, x = lerp(x0, tip[0], t), y = lerp(y0, tip[1], t) - Math.sin(Math.PI * t) * 20, sz = 14 * (1 - t * .7); for (const sd of [-1, 1]) { ctx.fillStyle = shade([60, 110, 60], (rnd() - .5) * 20); ctx.beginPath(); ctx.ellipse(x + sd * sz * .6, y - sz * .3, sz * .7, sz * .25, a + sd * .9, 0, TAU); ctx.fill(); } }
  }
  // a folded letter and a pencil
  fill(ctx, [[760, SILL + 140], [1020, SILL + 120], [1040, SILL + 180], [780, SILL + 200]], '#e8e0d0');
  ctx.strokeStyle = 'rgba(80,70,60,.3)'; ctx.lineWidth = 1; for (let l = 0; l < 4; l++) { ctx.beginPath(); ctx.moveTo(790, SILL + 150 + l * 10); ctx.lineTo(1010, SILL + 132 + l * 10); ctx.stroke(); }
  ctx.strokeStyle = '#c89a3a'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(1060, SILL + 210); ctx.lineTo(1200, SILL + 190); ctx.stroke();
  return { steam: [mx, my - 150] };
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(1011);
  const back = make(W, H), bc = back.getContext('2d');
  const lights = city(bc, rnd);
  // the glass: a faint fog over the city, heavier at the bottom where the room is warm
  const fog = bc.createLinearGradient(0, 0, 0, SILL); fog.addColorStop(0, 'rgba(160,180,200,.04)'); fog.addColorStop(1, 'rgba(180,190,200,.18)'); bc.fillStyle = fog; bc.fillRect(0, 0, W, SILL);
  // static drops: each a little lens — dark rim, a bright inverted spark of the light behind, a highlight
  const drops = [];
  for (let i = 0; i < 520; i++) {
    const x = FRAME.x0 + rnd() * (FRAME.x1 - FRAME.x0), y = rnd() * (SILL - 40), r = 2 + rnd() ** 3 * 12;
    drops.push({ x, y, r });
  }
  const drawDrop = (ctx, x, y, r) => {
    const near = lights.reduce((b, l) => (Math.hypot(l[0] - x, l[1] - y) < Math.hypot(b[0] - x, b[1] - y) ? l : b), lights[0]);
    ctx.fillStyle = 'rgba(10,16,30,.45)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.08, 0, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(x, y + r * .3, 0, x, y, r); g.addColorStop(0, `rgba(${near[2].map(Math.round)},.8)`); g.addColorStop(.6, 'rgba(70,90,120,.35)'); g.addColorStop(1, 'rgba(160,190,220,.5)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r * .86, r * .94, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(x - r * .35, y - r * .4, Math.max(.6, r * .18), 0, TAU); ctx.fill();
  };
  for (const d of drops) drawDrop(bc, d.x, d.y, d.r);
  const front = make(W, H), fc = front.getContext('2d');
  const r = room(fc, rnd);
  const plate = make(W, H), ctx = plate.getContext('2d');
  ctx.drawImage(back, 0, 0); ctx.drawImage(front, 0, 0);
  paint.applyTexture(ctx, make, 1012, .3, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.66, .7, .84], lights: [paint.LIGHT.lamp(-40, SILL - 100, .7, 900, 600, [1.35, 1, .62])] })(ctx);
  // running drops: each runs down a wandering path, a set number of times per loop, leaving a clear trail
  const runners = Array.from({ length: 22 }, () => ({ x: FRAME.x0 + 40 + rnd() * (FRAME.x1 - FRAME.x0 - 80), seed: rnd() * 10, r: 4 + rnd() * 5, turns: 1 + Math.floor(rnd() * 2), lag: rnd() }));
  const pathX = (rn, y) => rn.x + 18 * Math.sin(y / 60 + rn.seed) + 10 * noise(y / 40, rn.seed, 3);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.beginPath(); target.rect(FRAME.x0, 0, FRAME.x1 - FRAME.x0, FRAME.y1); target.rect(980, 0, -40, FRAME.y1); target.clip('evenodd');
    for (const rn of runners) {
      const t = (phase * rn.turns + rn.lag) % 1, yHead = lerp(-60, FRAME.y1 + 60, t);
      // the trail: a thin clear streak behind the head, fading upward
      target.strokeStyle = 'rgba(150,180,210,.22)'; target.lineWidth = rn.r * .6; target.lineCap = 'round'; target.beginPath();
      for (let y = Math.max(-60, yHead - 260); y <= yHead; y += 10) { const x = pathX(rn, y); y === Math.max(-60, yHead - 260) ? target.moveTo(x, y) : target.lineTo(x, y); }
      target.stroke();
      drawDrop(target, pathX(rn, yHead), yHead, rn.r);
    }
    target.restore();
    // steam from the mug
    for (let i = 0; i < 8; i++) { const t = (phase * 2 + i / 8) % 1; glow(target, r.steam[0] + Math.sin(t * 6 + i) * 24 * t, r.steam[1] - t * 260, 16 + t * 40, 12 + t * 30, '240,236,230', .16 * (1 - t) * Math.min(1, t * 10)); }
  };
}

module.exports = {
  title: '빗방울 너머의 새벽',
  slug: 'rain-on-the-window',
  sound: 'rain-room',
  createScene,
};
