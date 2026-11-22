'use strict';

// 75 · 먼 옥상의 작은 경고등
// Looking across a sea of dark rooftops at night from one roof's edge. In the foreground a tangle of
// rooftop things in silhouette against the sky glow: TV aerials on bent poles, a satellite dish, guy wires,
// a vent cowl turning slowly, a crooked antenna mast. Far away a tall radio tower stands above the city,
// and at its top and halfway a red warning light pulses slowly, softly lighting the haze around it. Low
// clouds slide by and catch the city's orange glow. The wind hums in the wires.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade } = paint;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}
const TOWER = { x: 1340, base: 760, top: 210 };

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#0a0c18'], [.55, '#2a2232'], [.75, '#5a3a3a'], [1, '#2a1e22']]); ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 60, 300);
  // the city below the far horizon: a band of tiny lights and roof shapes, warmer toward the bottom
  for (let row = 0; row < 6; row++) {
    const y = 700 + row * 40;
    let x = 0;
    while (x < W) {
      const w = 20 + rnd() * (30 + row * 20), h = 10 + rnd() * (20 + row * 22);
      ctx.fillStyle = shade([24 + row * 2, 20 + row * 2, 28 + row * 2], (rnd() - .5) * 8);
      ctx.fillRect(x, y - h, w, H);
      for (let i = 0; i < 3 + row; i++) if (rnd() < .3) { ctx.fillStyle = rnd() < .8 ? '#e8a868' : '#a8c8e8'; ctx.fillRect(x + rnd() * w, y - h + 4 + rnd() * h, 1 + row * .5, 1 + row * .5); }
      x += w + rnd() * 4;
    }
  }
  // the radio tower: a tapering lattice
  const { x, base, top } = TOWER;
  ctx.strokeStyle = '#141018'; ctx.lineWidth = 2;
  const half = y => lerp(28, 3, (base - y) / (base - top));
  ctx.beginPath(); ctx.moveTo(x - half(base), base); ctx.lineTo(x - half(top), top); ctx.moveTo(x + half(base), base); ctx.lineTo(x + half(top), top); ctx.stroke();
  ctx.lineWidth = 1; for (let y = base; y > top; y -= 22) { const h0 = half(y), h1 = half(y - 22); ctx.beginPath(); ctx.moveTo(x - h0, y); ctx.lineTo(x + h1, y - 22); ctx.moveTo(x + h0, y); ctx.lineTo(x - h1, y - 22); ctx.moveTo(x - h0, y); ctx.lineTo(x + h0, y); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top - 40); ctx.stroke();
}

// Foreground: our roof's edge and the rooftop clutter in silhouette, slightly lit from the city below.
function foreground(ctx, rnd) {
  const dark = '#08080c';
  fill(ctx, [[0, 900], [W, 860], [W, H], [0, H]], dark);
  // a neighbouring roof's tiled slope at the left
  paint.shingles(ctx, [[-40, 700], [560, 820], [620, H], [-40, H]], rnd, { rows: 10, cols: 12, base: [22, 20, 26], moss: [26, 28, 26], seed: 7, vary: 10 });
  ctx.strokeStyle = 'rgba(200,120,80,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-40, 700); ctx.lineTo(560, 820); ctx.stroke();
  // the parapet edge with a rail
  ctx.fillStyle = dark; ctx.fillRect(560, 840, W - 560, 60);
  ctx.strokeStyle = 'rgba(200,130,90,.22)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(560, 840); ctx.lineTo(W, 820); ctx.stroke();
  // aerials: a mast with cross elements, bent with age
  const aerial = (x, base, h, lean, elements) => {
    ctx.strokeStyle = dark; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + lean * .3, base - h * .5, x + lean, base - h); ctx.stroke();
    for (let e = 0; e < elements; e++) {
      const t = .55 + e * .12, px = x + lean * t * t, py = base - h * t, w = 70 - e * 10;
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - w, py + 4); ctx.lineTo(px + w, py - 4); ctx.stroke();
      ctx.lineWidth = 2; for (let r = -3; r <= 3; r++) { ctx.beginPath(); ctx.moveTo(px + r * w / 3.5, py - r * 1.1); ctx.lineTo(px + r * w / 3.5 + 6, py - r * 1.1 - 18); ctx.stroke(); }
    }
    return [x + lean, base - h];
  };
  const tips = [aerial(300, 760, 420, 30, 3), aerial(820, 850, 300, -18, 2), aerial(1700, 830, 520, 40, 4)];
  // guy wires to the roof
  ctx.strokeStyle = 'rgba(8,8,12,.9)'; ctx.lineWidth = 1.2;
  for (const [tx, ty] of tips) for (const dx of [-260, 220]) { ctx.beginPath(); ctx.moveTo(tx, ty + 60); ctx.quadraticCurveTo(tx + dx * .5, ty + 200, tx + dx, 860); ctx.stroke(); }
  // a satellite dish on a bracket
  ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(1080, 700, 90, 110, -.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(200,130,90,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(1080, 700, 90, 110, -.5, -2.2, -.4); ctx.stroke();
  ctx.strokeStyle = dark; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(1080, 760); ctx.lineTo(1100, 860); ctx.moveTo(1080, 700); ctx.lineTo(1170, 640); ctx.stroke();
  // a chimney stack with pots
  ctx.fillStyle = dark; ctx.fillRect(140, 560, 130, 200); ctx.fillRect(150, 530, 40, 40); ctx.fillRect(210, 520, 44, 50);
  ctx.strokeStyle = 'rgba(200,130,90,.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(270, 560); ctx.lineTo(270, 760); ctx.stroke();
  return { vent: [560, 790] };
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(75011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  glow(ctx, 960, 760, 1300, 220, '255,140,80', .18);
  paint.applyTexture(ctx, make, 7501, .32, 0, 0, W, H, true);
  const front = make(W, H), fc = front.getContext('2d');
  const fg = foreground(fc, rnd);
  // clouds: a strip twice the width, lit from below
  const clouds = make(W * 2, 600), cc = clouds.getContext('2d');
  for (let i = 0; i < 40; i++) { const x = rnd() * W * 2, y = 80 + rnd() * 360; for (const dx of [0, -W * 2, W * 2]) { glow(cc, x + dx, y, 200 + rnd() * 300, 24 + rnd() * 30, '90,60,70', .35); glow(cc, x + dx, y + 16, 160, 12, '200,120,90', .1); } }

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // clouds slide between the tower and us, once across per loop (drawn behind the foreground silhouettes)
    const x = (phase * W * 2) % (W * 2);
    target.save(); target.beginPath(); target.rect(0, 0, W, 700); target.clip();
    target.drawImage(clouds, -x, 0); target.drawImage(clouds, W * 2 - x, 0);
    target.restore();
    // the warning lights: top and middle pulse slowly, out of step
    for (const [y, off] of [[TOWER.top - 40, 0], [lerp(TOWER.base, TOWER.top, .5), .5]]) {
      const pulse = Math.max(0, Math.sin(TAU * (phase * 6 + off))) ** 2;
      glow(target, TOWER.x, y, 90, 90, '255,40,40', .3 * pulse);
      glow(target, TOWER.x, y, 10, 10, '255,80,70', .3 + .7 * pulse);
    }
    // foreground over the clouds again (only the dark silhouettes), then the turning vent cowl
    target.drawImage(front, 0, 0);
    const [vx, vy] = fg.vent, a = TAU * phase * 3;
    target.fillStyle = '#08080c'; target.fillRect(vx - 8, vy, 16, 70);
    target.beginPath(); target.ellipse(vx, vy - 10, 40, 34, 0, 0, TAU); target.fill();
    for (let f = 0; f < 6; f++) { const t = a + f * TAU / 6, s = Math.sin(t); target.strokeStyle = `rgba(200,130,90,${.15 + .2 * Math.max(0, s)})`; target.lineWidth = 2; target.beginPath(); target.moveTo(vx + Math.cos(t) * 38, vy - 40); target.quadraticCurveTo(vx + Math.cos(t) * 44, vy - 10, vx + Math.cos(t) * 38, vy + 20); target.stroke(); }
  };
}

module.exports = {
  title: '먼 옥상의 작은 경고등',
  slug: 'little-rooftop-beacon',
  sound: 'gust',
  createScene,
};
