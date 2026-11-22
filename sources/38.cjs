'use strict';

// 38 · 깊은 골짜기의 작은 밤 폭포
// Deep in a wooded gorge at night, a small waterfall drops over a ledge of dark rock into a round pool.
// The gorge walls rise steeply on both sides, mossy and dripping, ferns in their cracks, the gap of sky far
// above holding a few stars. The fall is a ribbon that frays into strands and spray as it drops, white
// against the black rock; mist rolls off the pool and the pool's surface trembles in rings from the
// plunge. A little moonlight comes down the gorge and silvers the falling water.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, wobble } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

const LIP = [[860, 330], [1080, 320]];         // the ledge the water pours over
const POOL_Y = 820;

function gorge(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#18223a'], [.2, '#0e1420'], [1, '#06080c']]);
  ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 40, 160);
  // the walls: two great masses of rock closing in from the sides, their inner edges jagged and leaning,
  // seamed with vertical cracks, moss on the ledges, ferns hanging from the seams
  for (const side of [-1, 1]) {
    const edgePts = [];
    for (let y = -40; y <= H + 40; y += 20) edgePts.push([(side < 0 ? 620 : 1320) + side * (y / H) * -160 + 60 * edge(y * 3 + side * 99, 381) * side, y]);
    const outer = side < 0 ? -60 : W + 60;
    const mass = edgePts.concat([[outer, H + 40], [outer, -40]]);
    fill(ctx, mass, vertical(ctx, 0, H, [[0, '#22262c'], [1, '#0e1012']]));
    ctx.save(); pathOf(ctx, mass); ctx.clip();
    for (let c = 0; c < 26; c++) {
      const x0 = side < 0 ? rnd() * 640 : 1300 + rnd() * 620, len = 100 + rnd() * 400, y0 = rnd() * H;
      ctx.strokeStyle = 'rgba(4,4,6,.6)'; ctx.lineWidth = 1 + rnd() * 3; ctx.beginPath(); ctx.moveTo(x0, y0);
      for (let k = 1; k < 8; k++) ctx.lineTo(x0 + (rnd() - .5) * 20, y0 + len * k / 8); ctx.stroke();
    }
    for (let m = 0; m < 14; m++) {
      const y = rnd() * H, x = side < 0 ? 200 + rnd() * 420 : 1340 + rnd() * 400;
      glow(ctx, x, y, 60 + rnd() * 80, 8 + rnd() * 6, '60,96,50', .55);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(160,176,206,.22)'; ctx.lineWidth = 2; ctx.beginPath(); edgePts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
    for (let f = 0; f < 7; f++) {
      const p = edgePts[2 + Math.floor(rnd() * (edgePts.length - 6))], x = p[0] - side * 6, y = p[1];
      for (let k = 0; k < 5; k++) { const a = Math.PI / 2 + (k - 2) * .4 - side * .5; ctx.strokeStyle = 'rgba(50,80,44,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * 30, y + 10, x + Math.cos(a) * 50, y + Math.sin(a) * 40); ctx.stroke(); }
    }
  }
  // the back wall behind the fall and the ledge
  fill(ctx, wobble([[700, 300], [1240, 290], [1260, POOL_Y], [680, POOL_Y]], 8, 391, 20), '#181a1e');
  fill(ctx, wobble([[840, 300], [1100, 296], [1090, 340], [850, 344]], 4, 392, 12), '#2a2c30');
  // the pool, dark with a skin of reflected sky
  fill(ctx, wobble(Array.from({ length: 20 }, (_, i) => [970 + Math.cos(i / 20 * TAU) * 520, POOL_Y + 120 + Math.sin(i / 20 * TAU) * 130]), 12, 393, 20), vertical(ctx, POOL_Y, H, [[0, '#1a2434'], [1, '#080a10']]));
  // boulders at the pool's edge, wet
  for (let i = 0; i < 10; i++) {
    const x = 450 + rnd() * 1050, y = POOL_Y + 120 + (rnd() < .5 ? -1 : 1) * (80 + rnd() * 60), r = 30 + rnd() * 50;
    fill(ctx, wobble(Array.from({ length: 10 }, (_, k) => [x + Math.cos(k / 10 * TAU) * r * 1.3, y + Math.sin(k / 10 * TAU) * r * .7]), r * .1, 394 + i, 10), '#1e2024');
    ctx.strokeStyle = 'rgba(180,196,222,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x - r * .2, y - r * .2, r * .8, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
  }
}

function makeStrands(rnd) {
  return Array.from({ length: 70 }, () => ({ x: lerp(LIP[0][0] + 30, LIP[1][0] - 30, rnd()), w: 1 + rnd() * 4, offset: rnd(), drift: (rnd() - .5) * 60, a: .3 + rnd() * .5 }));
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(38011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  gorge(ctx, rnd);
  paint.applyTexture(ctx, make, 3801, .34, 0, 0, W, H, true);
  const strands = makeStrands(rnd);
  const mist = make(W, 400), mc = mist.getContext('2d');
  for (let i = 0; i < 30; i++) glow(mc, 970 + (rnd() - .5) * 900, 200 + (rnd() - .5) * 160, 120 + rnd() * 200, 40 + rnd() * 60, '200,210,226', .15);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the fall: strands pouring from the lip, fraying as they fall, with bright beads running down them
    for (const s of strands) {
      target.strokeStyle = `rgba(210,222,240,${s.a})`; target.lineWidth = s.w; target.beginPath();
      for (let k = 0; k <= 12; k++) { const t = k / 12, y = lerp(LIP[0][1] + 10, POOL_Y + 100, t), x = s.x + s.drift * t * t + Math.sin(TAU * (phase * 4 + s.offset + t)) * 3 * t; k ? target.lineTo(x, y) : target.moveTo(x, y); }
      target.stroke();
      for (let b = 0; b < 3; b++) {
        const t = ((phase * 6 + s.offset + b / 3) % 1), y = lerp(LIP[0][1] + 10, POOL_Y + 100, t), x = s.x + s.drift * t * t;
        target.fillStyle = `rgba(240,246,255,${.7 * (1 - t * .5)})`; target.fillRect(x - 1, y, 2, 6);
      }
    }
    // spray and rings where it lands, mist rolling off
    for (let i = 0; i < 4; i++) {
      const age = (phase * 4 + i / 4) % 1;
      target.strokeStyle = `rgba(200,214,236,${.4 * (1 - age) * Math.min(1, age * 12)})`; target.lineWidth = 1.5;
      target.beginPath(); target.ellipse(970, POOL_Y + 110, 60 + age * 400, 14 + age * 90, 0, 0, TAU); target.stroke();
    }
    glow(target, 970, POOL_Y + 90, 220, 70, '220,230,244', .3 + .08 * Math.sin(TAU * phase * 8));
    target.globalAlpha = .8 + .2 * Math.sin(TAU * phase);
    target.drawImage(mist, Math.sin(TAU * phase) * 60, POOL_Y - 160);
    target.globalAlpha = 1;
  };
}

module.exports = {
  title: '깊은 골짜기의 작은 밤 폭포',
  slug: 'small-waterfall-in-the-dark-gorge',
  sound: 'cascade',
  createScene,
};
