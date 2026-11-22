'use strict';

// 93 · 보리밭을 지나는 구름 그림자
// Early morning, seen from the top of a rise. Rolling farmland falls away below: a patchwork of barley,
// stubble and pasture divided by dark hedgerows with a few trees standing in them, a farm track winding
// between. The sun is still low on the left and the barley glows; big clouds float high and their shadows
// slide over the fields and up the far slopes. Close by, the barley heads lean in the wind.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: 0, y: 7, z: 0, yaw: 0, pitch: .07, focal: 1100, cx: 960, cy: 520 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([0, 7, 1e6])[1];
const land = (x, z) => 3 * Math.sin(x * .02 + .5) * Math.sin(z * .015 + 1) + 2 * edge(x * 2 + z * 3, 131, [[300, 1], [80, .3]]) - 4 + z * .02;
const HAZE = [160, 160, 158];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 20, [[0, '#4a6080'], [.6, '#8a98a6'], [1, '#c4b49a']]);
  ctx.fillRect(0, 0, W, HORIZON + 20);
  glow(ctx, 200, HORIZON - 30, 600, 200, '255,220,170', .22);
  // cumulus: stacked rounded clumps, bright on the sun side, shadowed underneath
  for (let c = 0; c < 6; c++) {
    const cx = 200 + c * 320 + (rnd() - .5) * 120, cy = 100 + rnd() * 150, size = 60 + rnd() * 60;
    for (let i = 0; i < 18; i++) {
      const x = cx + (rnd() - .5) * size * 3, y = cy - rnd() * size * .8, r = size * (.4 + rnd() * .5);
      glow(ctx, x, y + r * .3, r * 1.1, r * .8, '120,128,150', .3);
      glow(ctx, x - r * .2, y, r, r * .75, '236,222,210', .32);
    }
  }
}

// Fields as a quilt of four-sided patches laid on the ground in metres. Neighbouring patches share their
// jittered corners, so the boundaries are clean irregular lines; each patch has its own crop and tone.
const crops = [[188, 160, 92], [150, 132, 86], [84, 112, 66], [176, 150, 84], [110, 120, 70], [196, 170, 100]];
function farmland(ctx, rnd) {
  const cols = 22, rows = 16, corner = [];
  for (let j = 0; j <= rows; j++) {
    corner.push([]);
    for (let i = 0; i <= cols; i++) {
      const z = 8 + (j / rows) ** 1.7 * 650, x = (i - cols / 2) * (40 + z * .12);
      corner[j].push([x + (rnd() - .5) * 26, z + (j ? (rnd() - .5) * 18 : 0)]);
    }
  }
  const edgePts = (a, b) => Array.from({ length: 9 }, (_, k) => { const t = k / 8, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t); return P([x, land(x, z), z]); });
  for (let j = rows - 1; j >= 0; j--) {
    for (let i = 0; i < cols; i++) {
      const a = corner[j][i], b = corner[j][i + 1], c = corner[j + 1][i + 1], d = corner[j + 1][i];
      const outline = [...edgePts(a, b), ...edgePts(b, c), ...edgePts(c, d), ...edgePts(d, a)];
      if (outline.some(v => !isFinite(v[0]))) continue;
      const haze = Math.min(.85, a[1] / 720), color = crops[Math.floor(rnd() * crops.length)];
      const g = ctx.createLinearGradient(0, Math.min(...outline.map(p => p[1])), 0, Math.max(...outline.map(p => p[1])));
      g.addColorStop(0, shade(paint.aerial(color, haze, HAZE), 8)); g.addColorStop(1, shade(paint.aerial(color, haze, HAZE), -10));
      fill(ctx, outline, g);
      // rows within the patch, drilled in the patch's own direction
      if (a[1] < 200) {
        ctx.save(); pathOf(ctx, outline); ctx.clip();
        const dir = rnd() < .5;
        for (let r = 1; r < 12; r++) {
          const t = r / 12, p0 = dir ? [lerp(a[0], d[0], t), lerp(a[1], d[1], t)] : [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
          const p1 = dir ? [lerp(b[0], c[0], t), lerp(b[1], c[1], t)] : [lerp(d[0], c[0], t), lerp(d[1], c[1], t)];
          ctx.strokeStyle = 'rgba(40,36,20,.12)'; ctx.lineWidth = 1;
          ctx.beginPath(); edgePts(p0, p1).forEach((p, k) => (k ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
        }
        ctx.restore();
      }
    }
  }
  // hedgerows along the patch edges: a dark band of bushes, with a tree standing in it now and then
  for (let j = rows; j >= 0; j--) {
    for (let i = 0; i <= cols; i++) {
      for (const [p, q] of [[corner[j][i], corner[j][i + 1]], [corner[j][i], corner[j + 1] && corner[j + 1][i]]]) {
        if (!p || !q || rnd() < .35) continue;
        // a continuous hedge: a lumpy band along the edge, its top edge broken by shrubs
        const top = [], bottom = [];
        for (let k = 0; k <= 24; k++) {
          const t = k / 24, x = lerp(p[0], q[0], t), z = lerp(p[1], q[1], t), hgt = .6 + .5 * Math.max(0, edge(k * 50 + i * 7 + j * 13, 133));
          top.push(P([x, land(x, z) + hgt, z])); bottom.push(P([x, land(x, z), z]));
        }
        if (top.some(v => !isFinite(v[0]))) continue;
        const haze = Math.min(.85, Math.min(p[1], q[1]) / 720);
        fill(ctx, top.concat(bottom.reverse()), shade(paint.aerial([50, 64, 42], haze, HAZE)));
        if (rnd() < .4) {
          const t = rnd(), x = lerp(p[0], q[0], t), z = lerp(p[1], q[1], t), s = cam.project([x, land(x, z), z]);
          if (s[2] > 0) { const kk = cam.focal / s[2]; glow(ctx, s[0], s[1] - 5 * kk, 3.4 * kk, 4 * kk, shade(paint.aerial([32, 44, 30], haze, HAZE)).slice(5, -3), .95); }
        }
      }
    }
  }
  // the farm track, pale and winding down into the valley
  ctx.strokeStyle = 'rgba(206,190,156,.4)'; ctx.lineCap = 'round';
  let prev = null;
  for (let i = 0; i <= 50; i++) {
    const t = i / 50, z = lerp(8, 300, t ** 1.4), x = Math.sin(t * 6) * 30 * t + 10 * t, s = P([x, land(x, z) + .05, z]);
    if (prev) { ctx.lineWidth = Math.max(.8, 1.6 * cam.focal / cam.project([x, 0, z])[2]); ctx.beginPath(); ctx.moveTo(...prev); ctx.lineTo(...s); ctx.stroke(); }
    prev = s;
  }
  const fs = P([40, land(40, 220), 220]);
  for (const [dx, w, h] of [[0, 22, 16], [26, 14, 22], [-20, 12, 10]]) fill(ctx, [[fs[0] + dx, fs[1]], [fs[0] + dx + w, fs[1]], [fs[0] + dx + w, fs[1] - h], [fs[0] + dx + w / 2, fs[1] - h - 6], [fs[0] + dx, fs[1] - h]], dx ? '#8a7a6a' : '#a08870');
}

// The near barley: heads on the slope just below us, drawn every frame so they can lean in the wind.
function makeHeads(rnd) {
  return Array.from({ length: 420 }, () => {
    const z = 6 + rnd() ** 1.5 * 10, x = (rnd() - .5) * z * 2.2;
    return { x, z, y: land(x, z), h: .7 + rnd() * .3, lag: x * .3 + z * .2, c: (rnd() - .5) * 30 };
  }).sort((a, b) => b.z - a.z);
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(93011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  farmland(ctx, rnd);
  paint.applyTexture(ctx, make, 9301, .35, 0, 0, W, H, true);
  const heads = makeHeads(rnd);
  // cloud shadows: soft dark shapes that slide across the land once per loop
  const shadows = make(W * 2, H), sc = shadows.getContext('2d');
  for (let i = 0; i < 7; i++) {
    const x = rnd() * W * 2, y = HORIZON + 30 + rnd() * (H - HORIZON - 60), w = 200 + rnd() * 300, h = 30 + (y - HORIZON) * .25;
    for (const dx of [0, -W * 2, W * 2]) for (let k = 0; k < 6; k++) glow(sc, x + dx + (rnd() - .5) * w, y + (rnd() - .5) * h, w * (.5 + rnd() * .5), h * (.6 + rnd() * .4), '30,36,50', .2);
  }

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.beginPath(); target.rect(0, HORIZON - 4, W, H); target.clip();
    const sx = (phase * W * 2) % (W * 2);
    target.drawImage(shadows, -sx, 0); target.drawImage(shadows, W * 2 - sx, 0);
    target.restore();
    for (const s of heads) {
      const base = cam.project([s.x, s.y, s.z]); if (base[2] <= 0) continue;
      const k = cam.focal / base[2], lean = .35 + .15 * Math.sin(TAU * phase * 3 + s.lag) + .1 * Math.sin(TAU * phase * 5 + s.lag * 1.7);
      const tip = [base[0] + Math.sin(lean) * s.h * k, base[1] - Math.cos(lean) * s.h * k];
      target.strokeStyle = shade([150, 140, 86], s.c * .5, .8); target.lineWidth = Math.max(.6, .01 * k);
      target.beginPath(); target.moveTo(base[0], base[1]); target.quadraticCurveTo(base[0] + Math.sin(lean) * s.h * k * .3, base[1] - s.h * k * .6, tip[0], tip[1]); target.stroke();
      target.fillStyle = shade([214, 190, 120], s.c, .9);
      target.beginPath(); target.ellipse(tip[0] + Math.sin(lean) * .04 * k, tip[1] + .03 * k, .05 * k, .018 * k, lean + .6, 0, TAU); target.fill();
      target.strokeStyle = `rgba(240,220,160,.4)`; target.lineWidth = .6;
      target.beginPath(); target.moveTo(tip[0], tip[1]); target.lineTo(tip[0] + Math.sin(lean + .5) * .16 * k, tip[1] - Math.cos(lean + .5) * .16 * k); target.stroke();
    }
  };
}

module.exports = {
  title: '보리밭을 지나는 구름 그림자',
  slug: 'cloud-shadow-on-the-barley',
  sound: 'grass',
  createScene,
};
