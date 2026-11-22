'use strict';

// 35 · 달빛이 썰물에 드러낸 모래섬
// Tidal flats at low water under a moon just above the horizon, large and amber from the thick air near the
// sea. The ebb has left long sandbars, rippled and wet, between braided channels that still hold water;
// the channels catch the moon in bright ribbons and the wet sand gleams. Far out the sea is a thin line,
// a headland dark at one end. A few wading birds pick along a channel's edge. The water still slides
// seaward in the channels and the ripples on it glint.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: 0, y: 1.8, z: 0, yaw: .05, pitch: -.01, focal: 1100, cx: 960, cy: 500 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 1.8, 1e6])[1];
const MOON = [760, HORIZON - 90];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#0a0e1e'], [.6, '#22283e'], [1, '#4a4450']]);
  ctx.fillRect(0, 0, W, HORIZON + 2);
  paint.starfield(ctx, rnd, 240, HORIZON);
  glow(ctx, ...MOON, 360, 260, '240,196,150', .3);
  ctx.fillStyle = '#f2d2a6'; ctx.beginPath(); ctx.arc(...MOON, 52, 0, TAU); ctx.fill();
  for (const [dx, dy, r] of [[-16, -10, 16], [12, 8, 12], [-6, 20, 9]]) { ctx.fillStyle = 'rgba(200,160,120,.4)'; ctx.beginPath(); ctx.arc(MOON[0] + dx, MOON[1] + dy, r, 0, TAU); ctx.fill(); }
  for (let i = 0; i < 6; i++) glow(ctx, MOON[0] + (rnd() - .5) * 600, MOON[1] + (rnd() - .5) * 80, 300, 8, '40,40,56', .5);
  // the sea's edge and a headland
  ctx.fillStyle = '#2a2c3a'; ctx.fillRect(0, HORIZON - 2, W, 6);
  paint.ridgeline(ctx, HORIZON, 60, [20, 22, 30], 351, [[300, 1], [60, .4], [12, .2]], HORIZON + 4);
  ctx.fillStyle = '#2a2c3a'; ctx.fillRect(500, HORIZON - 60, W, 64);
}

// Channels: braided ribbons of water meandering seaward across the flats.
const channels = [];
function flats(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, HORIZON, H, [[0, '#5a5048'], [.3, '#3e3630'], [1, '#1a1612']]);
  ctx.fillRect(0, HORIZON + 2, W, H);
  // sand ripples: fine curved ridges, lit on the side toward the moon
  for (let i = 0; i < 3000; i++) {
    const z = 2 + rnd() ** 1.6 * 120, x = (rnd() - .5) * z * 2.6, s = cam.project([x, 0, z]); if (s[2] <= 0 || s[1] < HORIZON) continue;
    const k = cam.focal / s[2], w = (.2 + rnd() * .4) * k;
    ctx.strokeStyle = `rgba(200,170,140,${.08 + rnd() * .14})`; ctx.lineWidth = Math.max(.5, .01 * k);
    ctx.beginPath(); ctx.moveTo(s[0] - w, s[1]); ctx.quadraticCurveTo(s[0], s[1] - .03 * k, s[0] + w, s[1]); ctx.stroke();
  }
  for (let c = 0; c < 5; c++) {
    let x = (rnd() - .5) * 40 + (c - 2) * 10, z = 2.5;
    const left = [], right = [], centre = [];
    for (let i = 0; i < 60; i++) {
      x += Math.sin(i * .25 + c * 2) * (.6 + z * .02) + (rnd() - .5) * .4; z += .5 + z * .045;
      const w = .4 + c * .15 + rnd() * .2 + z * .008;
      left.push(P([x - w, 0, z])); right.push(P([x + w, 0, z])); centre.push([x, z, w]);
    }
    fill(ctx, left.concat(right.reverse()), vertical(ctx, HORIZON, H, [[0, '#c4a080'], [.2, '#5a5260'], [1, '#1e2030']]));
    channels.push(centre);
  }
}

function birds(ctx) {
  for (const [x, z, f] of [[-2, 14, 1], [-1.1, 15.5, -1], [4, 22, 1]]) {
    const s = P([x, 0, z]), k = cam.focal / z;
    ctx.fillStyle = '#0e0e12';
    ctx.beginPath(); ctx.ellipse(s[0], s[1] - .22 * k, .14 * k, .07 * k, f * .2, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#0e0e12'; ctx.lineWidth = Math.max(1, .012 * k);
    ctx.beginPath(); ctx.moveTo(s[0] + f * .1 * k, s[1] - .26 * k); ctx.quadraticCurveTo(s[0] + f * .16 * k, s[1] - .38 * k, s[0] + f * .2 * k, s[1] - .34 * k); ctx.lineTo(s[0] + f * .34 * k, s[1] - .3 * k); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s[0], s[1] - .17 * k); ctx.lineTo(s[0] - .02 * k, s[1]); ctx.moveTo(s[0] + .03 * k, s[1] - .17 * k); ctx.lineTo(s[0] + .04 * k, s[1]); ctx.stroke();
  }
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(35011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  flats(ctx, rnd);
  birds(ctx);
  paint.applyTexture(ctx, make, 3501, .32, 0, 0, W, H, true);
  paint.lighting(make, { skyline: HORIZON, ambient: [.76, .74, .8], lights: [paint.LIGHT.glade(MOON[0], HORIZON, .35, 380, 700)] })(ctx);
  const glints = [];
  for (const ch of channels) for (let i = 0; i < ch.length; i += 2) { const [x, z, w] = ch[i]; glints.push({ p: P([x + (rnd() - .5) * w, 0, z]), z, offset: rnd() }); }

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // the moon's light in the channels: dashes sliding seaward along the water as it runs out
    for (const g of glints) {
      const near = Math.max(0, 1 - Math.abs(g.p[0] - MOON[0]) / (200 + (g.p[1] - HORIZON) * 1.2));
      const a = near * (.5 + .5 * Math.sin(TAU * (phase * 3 + g.offset))) * .7;
      if (a < .02) continue;
      const k = cam.focal / g.z;
      target.fillStyle = `rgba(248,214,170,${a})`; target.fillRect(g.p[0] - .4 * k, g.p[1], .8 * k, Math.max(1, .02 * k));
    }
  };
}

module.exports = {
  title: '달빛이 썰물에 드러낸 모래섬',
  slug: 'sandbars-under-a-low-moon',
  sound: 'sea',
  createScene,
};
