'use strict';

// 05 · 눈 덮인 숲속의 오두막
// A small log cabin in a clearing of a snowbound spruce forest, late on a winter night. Its walls are
// stacked round logs whose ends cross and stick out at the corners; the roof carries a thick soft blanket
// of snow that bulges and overhangs the eaves, with icicles below. Two small windows glow amber, a lantern
// hangs by the door, a woodpile is stacked under the eave, a path of footprints leads to the door. Smoke
// rises from the stone chimney and bends away. Snow falls; the spruces around stand heavy with it.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, v3, noise, pathOf } = paint;

const cam = camera({ x: -2, y: 1.7, z: 0, yaw: .14, pitch: -.03, focal: 1050, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = cam.project([Math.sin(.14) * 1e6, 1.7, Math.cos(.14) * 1e6])[1];
const CAB = { x: 0, z: 16, w: 6, d: 4.4, wall: 2.6, ridge: 4.6 };       // front face at z, facing -z

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }

// A snowy spruce: tiers of drooping branches, each tier with a snow load on its upper side.
function spruce(ctx, rnd, base, h) {
  const b = P(base), k = cam.focal / cam.project(base)[2], tiers = 9;
  ctx.fillStyle = '#0c1410'; ctx.fillRect(b[0] - .08 * k, b[1] - .6 * k, .16 * k, .6 * k);
  for (let t = 0; t < tiers; t++) {
    const u = t / tiers, y = b[1] - (.4 + u * (h - .4)) * k, w = (1 - u) * h * .32 * k + .1 * k, droop = .25 * k * (1 - u);
    ctx.fillStyle = shade([14, 26, 22], (rnd() - .5) * 8);
    ctx.beginPath(); ctx.moveTo(b[0], y - h / tiers * 1.4 * k); ctx.quadraticCurveTo(b[0] - w * .6, y - droop, b[0] - w, y + droop); ctx.lineTo(b[0] + w, y + droop); ctx.quadraticCurveTo(b[0] + w * .6, y - droop, b[0], y - h / tiers * 1.4 * k); ctx.fill();
    ctx.fillStyle = '#c8d0e0';
    ctx.beginPath(); ctx.moveTo(b[0] - w * .9, y + droop * .7); ctx.quadraticCurveTo(b[0] - w * .4, y - droop * .6, b[0], y - h / tiers * .9 * k); ctx.quadraticCurveTo(b[0] + w * .4, y - droop * .6, b[0] + w * .9, y + droop * .7); ctx.quadraticCurveTo(b[0], y + droop * .1, b[0] - w * .9, y + droop * .7); ctx.fill();
  }
}

function cabin(ctx, rnd) {
  const { x, z, w, d, wall, ridge } = CAB, x0 = x - w / 2, x1 = x + w / 2;
  // side wall (left, visible because we're off to the left) and front wall, logs as rounded bands
  const logs = 9;
  const side = (u, v) => P([x0, lerp(wall, 0, v), lerp(z + d, z, u)]);
  const front = (u, v) => P([lerp(x0, x1, u), lerp(wall, 0, v), z]);
  for (const [face, tone] of [[side, [70, 46, 32]], [front, [96, 64, 42]]]) {
    for (let l = 0; l < logs; l++) {
      const v0 = l / logs, v1 = (l + 1) / logs;
      const band = [face(0, v0), face(1, v0), face(1, v1), face(0, v1)];
      const g = ctx.createLinearGradient(0, band[0][1], 0, band[3][1]); g.addColorStop(0, shade(tone, 18)); g.addColorStop(.5, shade(tone, 0)); g.addColorStop(1, shade(tone, -30));
      fill(ctx, band, g);
      ctx.strokeStyle = 'rgba(20,12,8,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...band[3]); ctx.lineTo(...band[2]); ctx.stroke();
    }
  }
  // log ends crossing out at the front-left corner: round cut faces
  for (let l = 0; l < logs; l++) { const y = lerp(wall, 0, (l + .5) / logs), p = P([x0 - .15, y, z - .1]), k = cam.focal / cam.project([x0, y, z])[2]; ctx.fillStyle = '#b08458'; ctx.beginPath(); ctx.ellipse(p[0], p[1], .14 * k, .13 * k, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(80,50,30,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p[0], p[1], .07 * k, 0, TAU); ctx.stroke(); }
  // gable above the front wall
  fill(ctx, [P([x0, wall, z]), P([x1, wall, z]), P([x, ridge, z])], '#5a3a26');
  // windows and door on the front
  const wins = [];
  for (const u of [.18, .72]) {
    const q = [front(u, .3), front(u + .14, .3), front(u + .14, .62), front(u, .62)];
    fill(ctx, q, '#f0b060'); glow(ctx, (q[0][0] + q[1][0]) / 2, (q[0][1] + q[2][1]) / 2, 80, 60, '255,180,100', .5);
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 4; pathOf(ctx, q); ctx.stroke(); ctx.beginPath(); ctx.moveTo((q[0][0] + q[1][0]) / 2, q[0][1]); ctx.lineTo((q[3][0] + q[2][0]) / 2, q[3][1]); ctx.moveTo(q[0][0], (q[0][1] + q[3][1]) / 2); ctx.lineTo(q[1][0], (q[1][1] + q[2][1]) / 2); ctx.stroke();
    // snow on the sill
    ctx.fillStyle = '#d8e0ee'; ctx.beginPath(); ctx.ellipse((q[3][0] + q[2][0]) / 2, q[3][1], (q[2][0] - q[3][0]) * .6, 6, 0, Math.PI, TAU); ctx.fill();
    wins.push([(q[0][0] + q[1][0]) / 2, (q[0][1] + q[2][1]) / 2]);
  }
  const door = [front(.42, .15), front(.58, .15), front(.58, 1), front(.42, 1)];
  fill(ctx, door, '#3a2416'); for (let b = 1; b < 4; b++) { ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lerp(door[0][0], door[1][0], b / 4), door[0][1]); ctx.lineTo(lerp(door[3][0], door[2][0], b / 4), door[3][1]); ctx.stroke(); }
  const lantern = front(.64, .25);
  // woodpile against the side wall
  for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { const p = P([x0 - .35, .15 + r * .2, z + .6 + c * .2 + (r % 2) * .1]), k = cam.focal / cam.project([x0, .5, z + 1])[2]; ctx.fillStyle = shade([150, 110, 70], (rnd() - .5) * 30); ctx.beginPath(); ctx.ellipse(p[0], p[1], .08 * k, .09 * k, 0, 0, TAU); ctx.fill(); }
  // the roof: two slopes, then a thick rounded snow blanket over them with an overhanging lip and icicles
  const eave = .5, rf = (side2, u, v) => { const xx = side2 < 0 ? lerp(x - .0, x0 - eave, v) : lerp(x, x1 + eave, v); return [xx, lerp(ridge, wall - .25, v), lerp(z - eave, z + d + eave, u)]; };
  fill(ctx, [P(rf(-1, 0, 0)), P(rf(-1, 1, 0)), P(rf(-1, 1, 1)), P(rf(-1, 0, 1))], '#2a2020');
  // snow: the near (left) slope's blanket, bulging
  const snow = [];
  for (let i = 0; i <= 16; i++) { const u = i / 16; snow.push(P([lerp(x0 - eave - .25, x - .1, 0), wall - .2 + .45 + .1 * Math.sin(u * 9), lerp(z - eave - .2, z + d + eave, u)])); }
  const ridgeLine = []; for (let i = 16; i >= 0; i--) { const u = i / 16; ridgeLine.push(P([x, ridge + .55 + .08 * Math.sin(u * 7), lerp(z - eave, z + d + eave, u)])); }
  fill(ctx, [...snow, ...ridgeLine], '#c4cce0');
  // front edge of the blanket: a soft thick rounded lip over the gable
  const lip = []; for (let i = 0; i <= 20; i++) { const t = i / 20, xx = lerp(x0 - eave - .25, x1 + eave + .25, t), yy = lerp(wall + .25, ridge + .55, 1 - Math.abs(2 * t - 1)); lip.push(P([xx, yy, z - eave - .2])); }
  for (let i = 20; i >= 0; i--) { const t = i / 20, xx = lerp(x0 - eave - .25, x1 + eave + .25, t), yy = lerp(wall - .2, ridge + .05, 1 - Math.abs(2 * t - 1)); lip.push(P([xx, yy - .08 * Math.sin(t * 13), z - eave - .2])); }
  fill(ctx, lip, '#dce2f0');
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); lip.slice(0, 21).forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  // icicles under the lip
  for (let i = 0; i < 18; i++) { const t = .05 + rnd() * .9, xx = lerp(x0 - eave, x1 + eave, t), yy = lerp(wall - .2, ridge + .05, 1 - Math.abs(2 * t - 1)), p = P([xx, yy, z - eave - .2]), L = 10 + rnd() * 26; ctx.fillStyle = 'rgba(210,230,250,.8)'; ctx.beginPath(); ctx.moveTo(p[0] - 3, p[1]); ctx.lineTo(p[0] + 3, p[1]); ctx.lineTo(p[0], p[1] + L); ctx.fill(); }
  // stone chimney at the back right
  const chimney = [x + 1.6, ridge - .6, z + d - .8];
  paint.box(ctx, cam, { at: chimney, sa: .35, sb: .35, h: 1.8 }, n => (n === 'left' ? '#5a5a60' : n === 'top' ? '#c8d0e0' : '#4a4a50'));
  return { wins, lantern, smoke: P([chimney[0], chimney[1] + 1.9, chimney[2]]) };
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(5011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON); sky.addColorStop(0, '#0e1426'); sky.addColorStop(1, '#2a3248');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // ground snow, with soft drifts
  const g = ctx.createLinearGradient(0, HORIZON, 0, H); g.addColorStop(0, '#5a6278'); g.addColorStop(1, '#9aa2b8');
  ctx.fillStyle = g; ctx.fillRect(0, HORIZON - 4, W, H);
  for (let i = 0; i < 40; i++) { const z = 3 + rnd() * 60, x = (rnd() - .5) * z * 2, s = cam.project([x, 0, z]), k = cam.focal / s[2]; glow(ctx, s[0], s[1], (2 + rnd() * 4) * k, .4 * k, rnd() < .5 ? '40,46,66' : '200,206,224', .12); }
  // forest behind: rows of spruces, far ones small and bluish
  const trees = [];
  for (let i = 0; i < 70; i++) { const z = 26 + rnd() * 60, x = (rnd() - .5) * 90; trees.push([x, z]); }
  for (let i = 0; i < 10; i++) { const z = 5 + rnd() * 16, x = rnd() < .5 ? -9 - rnd() * 8 : 7 + rnd() * 8; trees.push([x, z]); }
  trees.sort((a, b) => b[1] - a[1]);
  let cabinDrawn = false, c;
  for (const [x, z] of trees) {
    if (!cabinDrawn && z < CAB.z + CAB.d) { // footprints then the cabin
      for (let f = 0; f < 22; f++) { const t = f / 22, zz = lerp(2, CAB.z - .5, t), xx = lerp(-1.5, .2, t) + (f % 2 ? .18 : -.18) + Math.sin(t * 5) * .4, s = cam.project([xx, 0, zz]), k = cam.focal / s[2]; ctx.fillStyle = 'rgba(40,46,70,.4)'; ctx.beginPath(); ctx.ellipse(s[0], s[1], .1 * k, .04 * k, 0, 0, TAU); ctx.fill(); }
      c = cabin(ctx, rnd); cabinDrawn = true;
    }
    spruce(ctx, rnd, [x, 0, z], 5 + rnd() * 9);
  }
  if (!cabinDrawn) c = cabin(ctx, rnd);
  paint.applyTexture(ctx, make, 5012, .34, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.5, .55, .72], lights: [...c.wins.map(w => paint.LIGHT.lamp(w[0], w[1] + 120, .4, 300, 260, [1.35, 1, .6])), paint.LIGHT.lamp(c.lantern[0], c.lantern[1] + 60, .3, 160, 160, [1.35, 1, .6])] })(ctx);
  const snow = paint.particles(rnd, 420, { kind: 'snow', near: .15, speed: 1 });

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // chimney smoke bending away to the right
    for (let i = 0; i < 12; i++) { const t = (phase * 2 + i / 12) % 1; glow(target, c.smoke[0] + t * t * 260 + Math.sin(t * 8 + i) * 8, c.smoke[1] - t * 220, 10 + t * 50, 8 + t * 34, '170,176,196', .26 * (1 - t)); }
    // lantern flicker
    const fl = .8 + .12 * Math.sin(TAU * phase * 9) + .08 * Math.sin(TAU * phase * 23);
    glow(target, c.lantern[0], c.lantern[1], 26, 30, '255,190,110', .7 * fl); glow(target, c.lantern[0], c.lantern[1], 5, 6, '255,240,200', fl);
    for (const w of c.wins) glow(target, w[0], w[1], 60, 50, '255,190,110', .12 * fl);
    snow.draw(target, phase, '230,234,246');
  };
}

module.exports = {
  title: '눈 덮인 숲속의 오두막',
  slug: 'snowbound-cabin',
  sound: 'snow',
  createScene,
};
