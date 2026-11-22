'use strict';

// 83 · 새벽 세탁방의 돌아가는 드럼
// Inside a coin laundromat at four in the morning, rain on the big front window. A row of front-loading
// washers runs along the left wall, their round glass doors showing clothes tumbling in soapy water; two
// are running, one has finished with its door ajar. Above them a shelf of detergent boxes and a hand-
// written notice; across the room a bench of moulded chairs, a folding table with a basket, a vending
// machine of soap. The fluorescent ceiling is a little greenish. Outside the window, the wet dark street.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: .8, y: 1.55, z: 0, yaw: -.08, pitch: .1, focal: 950, cx: 960, cy: 540 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const WALL = -1.8, BACK = 6.2, RIGHT = 3.2;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }

function room(ctx, rnd) {
  ctx.fillStyle = '#1a1e1e'; ctx.fillRect(0, 0, W, H);
  // floor: a chequer of worn vinyl tiles
  for (let z = 1; z < BACK; z += .4) for (let x = WALL; x < RIGHT; x += .4) {
    const q = [P([x, 0, z]), P([x + .4, 0, z]), P([x + .4, 0, z + .4]), P([x, 0, z + .4])];
    fill(ctx, q, ((Math.round(x / .4) + Math.round(z / .4)) % 2) ? shade([120, 122, 112], (rnd() - .5) * 10) : shade([50, 60, 58], (rnd() - .5) * 10));
  }
  // left wall: pale green tiles to 1.2m, cream paint above
  const lw = (u, v) => P([WALL, lerp(2.8, 0, v), lerp(.5, BACK, u)]);
  fill(ctx, paint.outline(lw, 4), '#9a9a88');
  fill(ctx, paint.outline((u, v) => P([WALL, lerp(1.2, 0, v), lerp(.5, BACK, u)]), 4), '#6e8478');
  // back wall with a notice board and a clock
  const bw = (u, v) => P([lerp(WALL, RIGHT, u), lerp(2.8, 0, v), BACK]);
  fill(ctx, paint.outline(bw, 4), '#8e8e7e');
  fill(ctx, [P([-.6, 2, BACK - .01]), P([.4, 2, BACK - .01]), P([.4, 1.3, BACK - .01]), P([-.6, 1.3, BACK - .01])], '#a8804e');
  for (let i = 0; i < 6; i++) { const x = -.5 + (i % 3) * .3, y = 1.9 - Math.floor(i / 3) * .3; fill(ctx, [P([x, y, BACK - .02]), P([x + .22, y, BACK - .02]), P([x + .22, y - .22, BACK - .02]), P([x, y - .22, BACK - .02])], ['#f0ece0', '#f0e8a0', '#e8f0f0'][i % 3]); }
  const ck = P([1.8, 2.2, BACK - .01]), kk = cam.focal / cam.project([1.8, 2.2, BACK])[2]; ctx.fillStyle = '#f0f0ea'; ctx.beginPath(); ctx.arc(ck[0], ck[1], .2 * kk, 0, TAU); ctx.fill(); ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.moveTo(...ck); ctx.lineTo(ck[0], ck[1] - .13 * kk); ctx.moveTo(...ck); ctx.lineTo(ck[0] + .09 * kk, ck[1] + .04 * kk); ctx.stroke();
  // the front window on the right: wet glass and the street beyond
  const win = (u, v) => P([RIGHT, lerp(2.6, .5, v), lerp(.6, BACK - .5, u)]);
  fill(ctx, paint.outline(win, 4), '#0e1218');
  for (let i = 0; i < 6; i++) { const p = win(.15 + i * .14, .6 + (i % 2) * .1); glow(ctx, p[0], p[1], 50, 30, i % 3 ? '255,180,110' : '160,200,255', .35); }
  const sill = (u, v) => P([RIGHT, lerp(.5, 0, v), lerp(.6, BACK - .5, u)]);
  fill(ctx, paint.outline(sill, 4), '#5a6260');
  for (let m = 1; m < 4; m++) { const a = win(m / 4, 0), b = win(m / 4, 1); ctx.strokeStyle = '#3a4040'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // ceiling with fluorescent fittings
  fill(ctx, [P([WALL, 2.8, .5]), P([RIGHT, 2.8, .5]), P([RIGHT, 2.8, BACK]), P([WALL, 2.8, BACK])], '#7a7a70');
  const tubes = []; for (let z = 2; z < BACK; z += 2.2) { const a = P([-.2, 2.78, z]), b = P([-.2, 2.78, z + 1.2]); ctx.strokeStyle = '#f4fff4'; ctx.lineWidth = Math.max(3, 30 / z); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); tubes.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); }
  // chairs along the window, a folding table with a basket
  for (let i = 0; i < 4; i++) { const z = 1.6 + i * .6; paint.box(ctx, cam, { at: [RIGHT - .4, .42, z], sa: .22, sb: .24, h: .05 }, () => '#d8783a'); paint.box(ctx, cam, { at: [RIGHT - .2, .47, z], sa: .03, sb: .24, h: .4 }, () => '#c8682a'); }
  paint.box(ctx, cam, { at: [1.4, .75, 3.8], sa: .5, sb: .8, h: .04 }, n => (n === 'top' ? '#d8d8d0' : '#9a9a92'));
  for (const [dx, dz] of [[-.45, -.75], [.45, -.75]]) { const a = P([1.4 + dx, 0, 3.8 + dz]), b = P([1.4 + dx, .75, 3.8 + dz]); ctx.strokeStyle = '#6a6a66'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  paint.box(ctx, cam, { at: [1.3, .79, 3.7], sa: .25, sb: .18, h: .22 }, n => (n === 'top' ? '#3a5a8a' : '#2a4a7a'));
  for (let f = 0; f < 6; f++) { const p = P([1.2 + f * .04, 1.02, 3.7]); ctx.fillStyle = ['#e8e4dc', '#c84a4a', '#4a6a9a'][f % 3]; ctx.beginPath(); ctx.ellipse(p[0], p[1], 10, 5, 0, 0, TAU); ctx.fill(); }
  return tubes;
}

// The washers along the left wall: white boxes, each with a round door; returns door centres and radii.
function washers(ctx, rnd) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const x = WALL + .5 + i * .76, z = BACK - .4, at = [x, 0, z];
    paint.box(ctx, cam, { at, sa: .34, sb: .34, h: .92 }, n => (n === 'top' ? '#e8e8e4' : n === 'back' ? '#d8dad6' : '#b8bab4'));
    const c = P([x, .48, z - .35]), k = cam.focal / cam.project([x, .48, z - .35])[2];
    // control strip at the top: a coin slot, a dial and a little red display
    const cs = P([x - .2, .84, z - .35]); ctx.fillStyle = '#5a5e62'; ctx.fillRect(cs[0] - .05 * k, cs[1] - .02 * k, .08 * k, .04 * k);
    ctx.fillStyle = '#2a0a0a'; const ds = P([x + .12, .84, z - .35]); ctx.fillRect(ds[0] - .05 * k, ds[1] - .025 * k, .1 * k, .05 * k);
    // the door: a chrome ring, then glass (filled per frame)
    const rx = .21 * k, ry = .21 * k;
    ctx.fillStyle = '#9aa0a4'; ctx.beginPath(); ctx.ellipse(c[0], c[1], rx * 1.25, ry * 1.25, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d8dce0'; ctx.beginPath(); ctx.ellipse(c[0] - rx * .1, c[1] - ry * .1, rx * 1.2, ry * 1.2, 0, Math.PI * 1.1, Math.PI * 1.6); ctx.lineTo(c[0], c[1]); ctx.fill();
    ctx.fillStyle = '#1a2024'; ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, ry, 0, 0, TAU); ctx.fill();
    out.push({ c, rx, ry, k, run: i === 1 || i === 3 || i === 4, done: i === 5, disp: ds, rate: 2 + i % 2, lag: rnd() * TAU, cols: [[200, 60, 60], [60, 90, 160], [230, 220, 200], [80, 120, 80]].sort(() => rnd() - .5) });
  }
  return out;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(83011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const tubes = room(ctx, rnd);
  const ws = washers(ctx, rnd);
  paint.applyTexture(ctx, make, 8301, .3, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.52, .56, .54], lights: tubes.map(([x, y]) => paint.LIGHT.lamp(x, y + 200, .06, 420, 420, [1, 1.1, 1])) })(ctx);
  const winQuad = [P([RIGHT, 2.6, .6]), P([RIGHT, 2.6, BACK - .5]), P([RIGHT, .5, BACK - .5]), P([RIGHT, .5, .6])];
  const rain = Array.from({ length: 50 }, () => ({ u: rnd(), v: rnd(), turns: 1 + Math.floor(rnd() * 2), len: 10 + rnd() * 30 }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    for (const w of ws) {
      const { c, rx, ry } = w;
      target.save(); target.beginPath(); target.ellipse(c[0], c[1], rx, ry, 0, 0, TAU); target.clip();
      if (w.run) {
        // water level sloshing, clothes tumbling round with the drum (integer turns per loop)
        const a = TAU * phase * w.rate * 3;
        target.fillStyle = 'rgba(160,190,210,.5)'; target.fillRect(c[0] - rx, c[1] + ry * (.1 + .08 * Math.sin(a * 2)), rx * 2, ry * 2);
        w.cols.forEach((col, i) => { const t = a + i * 1.6, r = ry * .5; target.fillStyle = shade(col, -10); target.beginPath(); target.ellipse(c[0] + Math.cos(t) * r * .5, c[1] + Math.sin(t) * r, rx * .5, ry * .3, t, 0, TAU); target.fill(); });
        for (let b = 0; b < 8; b++) { const t = (phase * 4 + b / 8) % 1; target.fillStyle = 'rgba(255,255,255,.5)'; target.beginPath(); target.arc(c[0] + Math.sin(b * 3) * rx * .6, c[1] + ry * (.8 - t * 1.4), 2 + b % 3, 0, TAU); target.fill(); }
      } else if (w.done) {
        target.fillStyle = 'rgba(200,200,190,.6)'; target.beginPath(); target.ellipse(c[0], c[1] + ry * .5, rx * .8, ry * .4, 0, 0, TAU); target.fill();
      }
      target.fillStyle = 'rgba(200,230,240,.12)'; target.beginPath(); target.ellipse(c[0] - rx * .3, c[1] - ry * .4, rx * .3, ry * .2, -.4, 0, TAU); target.fill();
      target.restore();
      if (w.run) { target.fillStyle = '#ff4a3a'; target.font = `${Math.round(.04 * w.k)}px monospace`; target.textAlign = 'center'; target.textBaseline = 'middle'; target.fillText(String(12 + (w.rate % 3) * 7).padStart(2, '0'), w.disp[0], w.disp[1]); }
      if (w.done) { target.strokeStyle = '#9aa0a4'; target.lineWidth = 6; target.beginPath(); target.ellipse(c[0] + rx * .9, c[1], rx * .4, ry * 1.2, 0, 0, TAU); target.stroke(); }
    }
    // rain streaming on the front window
    target.save(); pathOf(target, winQuad); target.clip();
    const xs = winQuad.map(p => p[0]), ys = winQuad.map(p => p[1]);
    for (const r of rain) { const x = lerp(Math.min(...xs), Math.max(...xs), r.u), y = lerp(Math.min(...ys) - 40, Math.max(...ys), (r.v + phase * r.turns) % 1); target.strokeStyle = 'rgba(190,210,230,.35)'; target.lineWidth = 1.2; target.beginPath(); target.moveTo(x, y); target.lineTo(x + 1, y + r.len); target.stroke(); }
    target.restore();
  };
}

module.exports = {
  title: '새벽 세탁방의 돌아가는 드럼',
  slug: 'spinning-drums-in-a-laundromat',
  sound: 'laundry',
  createScene,
};
