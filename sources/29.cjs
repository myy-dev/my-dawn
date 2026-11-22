'use strict';

// 29 · 조수 웅덩이에 남은 달빛
// Looking down into a rock pool on a shore at low tide by moonlight. Ledges of dark, barnacled rock enclose
// a pool of still sea water; through it you see its floor: pebbles, a few shells, a starfish, the soft
// fronds of weed and the open mouths of anemones. The moon floats on its surface. The tide's last trickle
// spills over a lip at one side and sends faint rings across the pool; the weed sways in it.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, wobble } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }

const POOL = wobble(Array.from({ length: 26 }, (_, i) => {
  const a = i / 26 * TAU; return [960 + Math.cos(a) * (560 + 60 * Math.sin(a * 3)), 560 + Math.sin(a) * (300 + 40 * Math.cos(a * 2))];
}), 18, 291, 30);

function rocks(ctx, rnd) {
  ctx.fillStyle = '#16181c'; ctx.fillRect(0, 0, W, H);
  // rock surface: plates and cracks, barnacles in drifts, wet highlights on the edges facing the moon
  for (let i = 0; i < 60; i++) {
    const x = rnd() * W, y = rnd() * H, r = 60 + rnd() * 200;
    const pts = wobble(Array.from({ length: 9 }, (_, k) => [x + Math.cos(k / 9 * TAU) * r, y + Math.sin(k / 9 * TAU) * r * .7]), r * .12, 292 + i, 20);
    fill(ctx, pts, shade([40, 42, 48], (rnd() - .5) * 24));
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 3; pathOf(ctx, pts); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,200,220,.18)'; ctx.lineWidth = 2; ctx.beginPath(); pts.slice(5, 8).forEach((p, k) => (k ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  }
  for (let i = 0; i < 3000; i++) {
    const x = rnd() * W, y = rnd() * H, r = 1.5 + rnd() * 3;
    ctx.fillStyle = 'rgba(160,160,150,.45)'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(20,20,20,.7)'; ctx.beginPath(); ctx.arc(x, y, r * .4, 0, TAU); ctx.fill();
  }
}

function poolFloor(ctx, rnd) {
  ctx.save(); pathOf(ctx, POOL); ctx.clip();
  ctx.fillStyle = '#1a2a2c'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 400; i++) {
    const x = 400 + rnd() * 1100, y = 260 + rnd() * 600, r = 6 + rnd() * 22;
    ctx.fillStyle = shade([90, 96, 92], (rnd() - .5) * 50, .9); ctx.beginPath(); ctx.ellipse(x, y, r, r * .7, rnd(), 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(200,220,220,.12)'; ctx.beginPath(); ctx.ellipse(x - r * .2, y - r * .2, r * .4, r * .2, 0, 0, TAU); ctx.fill();
  }
  // a starfish, a few shells, anemones
  const star = [1180, 640];
  ctx.fillStyle = '#b05a3a';
  ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU - .3, r = k % 2 ? 18 : 60; ctx.lineTo(star[0] + Math.cos(a) * r, star[1] + Math.sin(a) * r * .8); } ctx.fill();
  for (let i = 0; i < 8; i++) { const x = 500 + rnd() * 900, y = 300 + rnd() * 500; ctx.fillStyle = '#d0c8b8'; ctx.beginPath(); ctx.ellipse(x, y, 14, 9, rnd(), 0, Math.PI); ctx.fill(); }
  for (let i = 0; i < 6; i++) {
    const x = 520 + rnd() * 880, y = 320 + rnd() * 460;
    ctx.fillStyle = '#6a2a3a'; ctx.beginPath(); ctx.arc(x, y, 18, 0, TAU); ctx.fill();
    for (let t = 0; t < 16; t++) { const a = t / 16 * TAU; ctx.strokeStyle = 'rgba(200,120,140,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 30, y + Math.sin(a) * 24); ctx.stroke(); }
  }
  ctx.restore();
}

function makeWeed(rnd) {
  return Array.from({ length: 30 }, () => ({ x: 450 + rnd() * 1000, y: 300 + rnd() * 520, len: 60 + rnd() * 120, a: rnd() * TAU, lag: rnd() * TAU, tone: rnd() }));
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(29011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  rocks(ctx, rnd);
  poolFloor(ctx, rnd);
  paint.applyTexture(ctx, make, 2901, .36, 0, 0, W, H, true);
  const weed = makeWeed(rnd);
  const lip = [1500, 440];

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); pathOf(target, POOL); target.clip();
    for (const w of weed) {
      target.strokeStyle = w.tone < .5 ? 'rgba(60,110,60,.85)' : 'rgba(120,60,50,.8)'; target.lineWidth = 5; target.lineCap = 'round';
      target.beginPath(); target.moveTo(w.x, w.y);
      for (let k = 1; k <= 8; k++) { const t = k / 8, a = w.a + Math.sin(TAU * phase * 2 + w.lag + t * 2) * .35 * t; target.lineTo(w.x + Math.cos(a) * w.len * t, w.y + Math.sin(a) * w.len * t); }
      target.stroke();
    }
    // the water: a blue-black film over the floor, the moon floating on it, the sky's faint sheen
    target.fillStyle = 'rgba(10,20,40,.4)'; target.fillRect(0, 0, W, H);
    const mx = 760 + Math.sin(TAU * phase * 2) * 3, my = 430;
    glow(target, mx, my, 150, 110, '200,214,236', .35);
    target.fillStyle = 'rgba(236,240,246,.9)'; target.beginPath(); target.ellipse(mx, my, 34, 30, 0, 0, TAU); target.fill();
    // rings from the trickle at the lip
    for (let r = 0; r < 4; r++) {
      const age = (phase * 4 + r / 4) % 1;
      target.strokeStyle = `rgba(200,214,236,${.35 * (1 - age)})`; target.lineWidth = 1.5;
      target.beginPath(); target.ellipse(lip[0] - 40, lip[1] + 40, 20 + age * 400, 12 + age * 240, 0, 0, TAU); target.stroke();
    }
    target.restore();
    // the trickle itself, spilling over the rock lip
    target.strokeStyle = 'rgba(210,224,240,.6)'; target.lineWidth = 3;
    target.beginPath(); target.moveTo(lip[0] + 30, lip[1] - 30); target.quadraticCurveTo(lip[0] + 10 + Math.sin(TAU * phase * 6) * 2, lip[1], lip[0] - 30, lip[1] + 30); target.stroke();
    target.strokeStyle = 'rgba(190,200,220,.35)'; target.lineWidth = 2; pathOf(target, POOL); target.stroke();
  };
}

module.exports = {
  title: '조수 웅덩이에 남은 달빛',
  slug: 'moonlight-in-a-tide-pool',
  sound: 'sea',
  createScene,
};
