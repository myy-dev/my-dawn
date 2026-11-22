'use strict';

// 67 · 산마루 텐트 너머의 별
// A small orange tent pitched on a grassy saddle between two summits, late at night. The tent glows from a
// headlamp inside, its fabric showing the shadow of the poles; guy lines run out to stones. Beyond it the
// land drops into a deep dark valley and rises again to a far range edged in faint starlight. The Milky Way
// stands over the far range. Close by, a few boulders and the boots left outside the door. The tent's
// light breathes as the person inside moves; a gust shivers the fly sheet.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, v3, noise, pathOf } = paint;

const cam = camera({ x: 0, y: 1.6, z: 0, yaw: -.12, pitch: -.06, focal: 1050, cx: 960, cy: 600 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(-.12) * 1e6, 1.6, Math.cos(-.12) * 1e6])[1];
const TENT = [-1.2, 0, 7.5];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function height(x, z) {
  const saddle = -.05 * (z - 4) - .002 * (z - 4) ** 2 + .02 * x * x * .1;
  const drop = z > 18 ? -Math.pow(z - 18, 1.25) : 0;
  const far = z > 600 ? 260 * noise(x / 400, 1, 7) + 120 : -1e9;
  return Math.max(saddle + drop + .6 * noise(x / 6, z / 6, 3), far);
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(67011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON); sky.addColorStop(0, '#02040c'); sky.addColorStop(1, '#101a2c');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const band = t => [lerp(400, 1500, t) + 100 * Math.sin(t * 4), lerp(HORIZON - 60, -100, t)];
  for (let i = 0; i < 260; i++) { const t = rnd(), [x, y] = band(t); glow(ctx, x + (rnd() - .5) * 260, y, 60 + rnd() * 120, 50 + rnd() * 100, rnd() < .7 ? '150,170,210' : '220,200,170', .05); }
  for (let i = 0; i < 2600; i++) { const t = rnd(), [x, y] = band(t); ctx.fillStyle = `rgba(230,236,255,${.15 + rnd() * .5})`; ctx.fillRect(x + (rnd() - .5) * 260, y + (rnd() - .5) * 30, 1, 1); }
  for (let i = 0; i < 20; i++) { const t = .1 + rnd() * .7, [x, y] = band(t); glow(ctx, x + (rnd() - .5) * 40, y, 24, 60, '2,4,10', .16); }
  paint.starfield(ctx, rnd, 1000, HORIZON);
  // far range rim and the dark valley
  const rimY = x => HORIZON - 40 - 70 * noise(x / 260, 2, 7) - 20 * noise(x / 60, 3, 8);
  ctx.fillStyle = '#0a0e18'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, rimY(x)); ctx.lineTo(W, H); ctx.fill();
  ctx.strokeStyle = 'rgba(120,140,180,.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let x = 0; x <= W; x += 8) (x ? ctx.lineTo(x, rimY(x)) : ctx.moveTo(x, rimY(x))); ctx.stroke();
  // our saddle: grass under starlight
  paint.terrain(ctx, cam, height, { z0: 1.5, z1: 60, cols: 140, rows: 120, bias: 1.8, fan: 1.05, cx: 0 }, (p, n) => {
    const lit = .4 + .6 * n[1] + .3 * n[0];
    return shade([24 * lit, 34 * lit, 32 * lit], (noise(p[0] * 1.5, p[2] * 1.5, 4) - .5) * 14);
  });
  // boulders
  for (let i = 0; i < 8; i++) { const x = (rnd() - .5) * 10, z = 4 + rnd() * 10, s = cam.project([x, height(x, z), z]), k = cam.focal / s[2], r = (.2 + rnd() * .5) * k; fill(ctx, paint.wobble(Array.from({ length: 9 }, (_, j) => [s[0] + Math.cos(j / 9 * TAU) * r * 1.2, s[1] + Math.sin(j / 9 * TAU) * r * .6 - r * .3]), r * .1, 671 + i, 10), shade([22, 26, 34], (rnd() - .5) * 10)); }
  paint.applyTexture(ctx, make, 6701, .34, 0, 0, W, H, true);
  // the tent, its parts in screen space from its 3D anchor
  const tb = P(TENT), k = cam.focal / cam.project(TENT)[2];
  const tent = { l: [tb[0] - 1.3 * k, tb[1]], r: [tb[0] + 1.1 * k, tb[1] + .1 * k], top: [tb[0] - .1 * k, tb[1] - 1.1 * k], back: [tb[0] + .4 * k, tb[1] - .9 * k], door: [[tb[0] - .6 * k, tb[1] + .02 * k], [tb[0] - .15 * k, tb[1] - .85 * k], [tb[0] + .3 * k, tb[1] + .05 * k]] };
  const boots = [[tb[0] - .2 * k, tb[1] + .3 * k], [tb[0] + .05 * k, tb[1] + .34 * k]];
  const pegs = [[tb[0] - 2 * k, tb[1] + .15 * k], [tb[0] + 1.9 * k, tb[1] + .2 * k], [tb[0] - 1.2 * k, tb[1] - .1 * k]];

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    const breathe = .85 + .1 * Math.sin(TAU * phase) + .05 * Math.sin(TAU * phase * 3 + 1);
    const flap = Math.sin(TAU * phase * 8) * Math.max(0, Math.sin(TAU * phase * 2)) * .04 * k;
    glow(target, tb[0], tb[1] - .4 * k, 3 * k, 1.6 * k, '255,150,70', .25 * breathe);
    // guy lines
    target.strokeStyle = 'rgba(200,170,130,.35)'; target.lineWidth = 1;
    for (const p of pegs) { target.beginPath(); target.moveTo(...tent.top); target.lineTo(...p); target.stroke(); }
    // fly: two panels, lit from inside, the near one with the door
    const g = target.createRadialGradient(tb[0], tb[1] - .4 * k, .1 * k, tb[0], tb[1] - .4 * k, 1.5 * k);
    g.addColorStop(0, `rgba(255,${Math.round(190 * breathe)},110,1)`); g.addColorStop(1, `rgba(${Math.round(200 * breathe)},90,40,1)`);
    fill(target, [tent.l, [tent.top[0] + flap, tent.top[1]], tent.door[2], tent.door[0]], g);
    fill(target, [[tent.top[0] + flap, tent.top[1]], tent.back, tent.r, tent.door[2]], `rgba(${Math.round(170 * breathe)},70,34,1)`);
    // pole shadows through the fabric
    target.strokeStyle = 'rgba(90,30,10,.5)'; target.lineWidth = 3; target.beginPath(); target.moveTo(...tent.l); target.quadraticCurveTo(tb[0] - .7 * k, tb[1] - 1.2 * k + flap, tent.back[0], tent.back[1]); target.stroke();
    fill(target, tent.door, `rgba(255,${Math.round(210 * breathe)},150,.8)`);
    // the boots outside the door
    for (const [x, y] of boots) { fill(target, [[x - .1 * k, y], [x + .1 * k, y], [x + .08 * k, y - .14 * k], [x - .05 * k, y - .16 * k]], '#2a2420'); }
  };
}

module.exports = {
  title: '산마루 텐트 너머의 별',
  slug: 'small-tent-under-highland-stars',
  sound: 'wind',
  createScene,
};
