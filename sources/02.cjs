'use strict';

// 02 · 비에 잠긴 골목의 책방
// A crooked old alley after midnight in steady rain, and halfway along it a small secondhand bookshop that
// has left its lights on. Its timber bay window bows out into the lane on three faces of small panes, every
// pane showing books — stacked, leaning, face-out — in warm lamplight; a hand-painted sign hangs on an iron
// bracket; the door's glass reads 'closed'. The houses lean in over the lane with deep eaves dripping, a
// drainpipe gurgling. The wet cobbles take the shop's light in long gold smears. Rain falls through it.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, shade, camera, noise, pathOf } = paint;

const cam = camera({ x: -1.9, y: 1.6, z: 0, yaw: .5, pitch: .02, focal: 1000, cx: 960, cy: 540 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const LEFT = -2.6, RIGHT = 2.4;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }

// A leaning house front on side s, from z0 to z1, with plaster or timber; returns nothing.
function houseFront(ctx, rnd, s, z0, z1, tone, eaves) {
  const x = s < 0 ? LEFT : RIGHT;
  const f = (u, v) => P([x - s * (1 - v) * .18 * Math.sin(z0) , lerp(eaves - .15 * Math.sin(Math.PI * u), 0, v), lerp(z0, z1, u)]);
  fill(ctx, paint.outline(f, 10), shade(tone, 0));
  ctx.save(); pathOf(ctx, paint.outline(f, 10)); ctx.clip();
  for (let i = 0; i < 50; i++) { const p = f(rnd(), rnd()); glow(ctx, p[0], p[1], 20 + rnd() * 70, 20 + rnd() * 60, rnd() < .6 ? '0,0,0' : '230,210,190', .07); }
  for (let i = 0; i < 26; i++) { const u = rnd(), a = f(u, 0), b = f(u, .3 + rnd() * .6); ctx.strokeStyle = `rgba(0,0,0,${.08 + rnd() * .12})`; ctx.lineWidth = 1 + rnd() * 3; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  ctx.restore();
  fill(ctx, paint.outline(f, 10), 'rgba(10,14,30,.45)');
  // windows upstairs, a couple lit
  for (const u of [.25, .7]) {
    const q = (uu, vv) => f(u + (uu - .5) * .22, .22 + vv * .22);
    const lit = rnd() < .25;
    fill(ctx, paint.outline(q, 2), lit ? '#c8884a' : '#10141c');
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3; pathOf(ctx, paint.outline(q, 2)); ctx.stroke();
  }
  // deep eaves: the roof's underside projecting over the lane
  const e = (u, v) => P([x - s * v * .7, eaves + v * .3 - .15 * Math.sin(Math.PI * u), lerp(z0 - .1, z1 + .1, u)]);
  fill(ctx, paint.outline(e, 8), '#16120f');
  return e;
}

function shop(ctx, rnd) {
  // the bookshop is on the right, z 6..10; its ground floor face, and the bay window that bows out
  const z0 = 4.6, z1 = 8.8, x = RIGHT;
  const face = (u, v) => P([x, lerp(3, 0, v), lerp(z0, z1, u)]);
  fill(ctx, paint.outline(face, 4), '#2a3a34');
  // sign board
  fill(ctx, [P([x - .02, 3, z0 + .2]), P([x - .02, 3, z1 - .2]), P([x - .02, 2.55, z1 - .2]), P([x - .02, 2.55, z0 + .2])], '#1e2a24');
  // bay: three faces — angled left, front (parallel to wall, out by .55), angled right
  const out = .55, b0 = z0 + .5, b1 = b0 + .5, b2 = b1 + 2, b3 = b2 + .5, yb = .55, yt = 2.35;
  const faces = [[[x, b0], [x - out, b1]], [[x - out, b1], [x - out, b2]], [[x - out, b2], [x, b3]]];
  const panes = [];
  // the inside: shelves of books visible through the panes, warm
  for (const [[xa, za], [xb, zb]] of faces) {
    const q = (u, v) => P([lerp(xa, xb, u), lerp(yt, yb, v), lerp(za, zb, u)]);
    fill(ctx, paint.outline(q, 4), '#3a2214');
    ctx.save(); pathOf(ctx, paint.outline(q, 4)); ctx.clip();
    for (let row = 0; row < 5; row++) {
      const vy = (row + .9) / 5; let u = 0;
      while (u < 1) {
        const w = .012 + rnd() * .03, h = .12 + rnd() * .07, lean = rnd() < .1 ? .3 : 0;
        const c = [[140, 50, 40], [40, 70, 110], [180, 150, 90], [60, 90, 60], [200, 190, 170], [110, 70, 40], [90, 40, 70]][Math.floor(rnd() * 7)];
        const a = q(u, vy), b = q(u + w, vy), t = q(u + w + lean * w, vy - h);
        fill(ctx, [a, b, [t[0], t[1]], [a[0] + (t[0] - b[0]), t[1]]], shade(c, (rnd() - .5) * 30));
        u += w + .002;
      }
      const a = q(0, vy), b = q(1, vy); ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
    }
    const c = q(.5, .5); glow(ctx, c[0], c[1], 260, 200, '255,200,120', .35);
    ctx.restore();
    // glazing bars: small panes
    ctx.strokeStyle = '#1e2a26'; ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) { const a = q(i / 4, 0), b = q(i / 4, 1); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    for (let j = 0; j <= 5; j++) { const a = q(0, j / 5), b = q(1, j / 5); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    ctx.lineWidth = 8; pathOf(ctx, paint.outline(q, 4)); ctx.stroke();
    panes.push(q(.5, .5));
    // stall riser below and a little roof above each face
    fill(ctx, [P([xa, yb, za]), P([xb, yb, zb]), P([xb, 0, zb]), P([xa, 0, za])], '#24322c');
    fill(ctx, [P([xa, yt, za]), P([xb, yt, zb]), P([xb + .12 * (xb < x ? -1 : 0) - .1, yt + .25, zb]), P([xa - .1, yt + .25, za])], '#1a2420');
  }
  // the door beyond the bay
  const d = (u, v) => P([x, lerp(2.2, 0, v), lerp(b3 + .3, b3 + 1.2, u)]);
  fill(ctx, paint.outline(d, 4), '#24302a');
  const dg = (u, v) => d(.15 + u * .7, .1 + v * .45); fill(ctx, paint.outline(dg, 4), '#c8884a');
  glow(ctx, ...dg(.5, .5), 40, 50, '255,190,110', .4);
  // the hanging sign on its bracket
  const br = P([x, 2.75, z0 - .2]), bt = P([x - .9, 2.75, z0 - .2]);
  ctx.strokeStyle = '#141414'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(...br); ctx.lineTo(...bt); ctx.stroke();
  return { panes, sign: [P([x - .75, 2.7, z0 - .2]), P([x - .25, 2.7, z0 - .2])] };
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(2011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 500); sky.addColorStop(0, '#0c1018'); sky.addColorStop(1, '#232838');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // cobbles
  const road = (u, v) => P([lerp(LEFT, RIGHT, u), 0, lerp(40, 1, v)]);
  fill(ctx, paint.outline(road, 8), '#1c1c22');
  for (let z = 1; z < 22; z += .16) { const k = cam.focal / Math.max(1, z); for (let x = LEFT; x < RIGHT; x += .18) { const p = P([x + (Math.round(z / .16) % 2) * .09, 0, z]); ctx.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '150,140,130'},${.04 + rnd() * .06})`; ctx.beginPath(); ctx.ellipse(p[0], p[1], .075 * k, .03 * k, 0, 0, TAU); ctx.fill(); } }
  // houses on both sides, far first, then the shop
  const eaves = [];
  let z = 40;
  while (z > 1) { const len = 3 + rnd() * 3; for (const s of [-1, 1]) if (!(s > 0 && z - len < 9.1 && z > 4.1)) eaves.push(houseFront(ctx, rnd, s, Math.max(1, z - len), z, [[120, 106, 92], [96, 100, 104], [128, 114, 96], [104, 92, 84]][Math.floor(rnd() * 4)].map(c => c * .7), 5 + rnd() * 1.5)); z -= len + .05; }
  // upper floors over the shop (the shop's ground floor is drawn over its lower part)
  eaves.push(houseFront(ctx, rnd, 1, 4.2, 9.2, [90, 96, 92], 6.2));
  const sh = shop(ctx, rnd);
  paint.applyTexture(ctx, make, 2012, .36, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.46, .5, .62], lights: sh.panes.map(p => paint.LIGHT.lamp(p[0] - 120, p[1] + 160, .45, 500, 480, [1.35, 1, .6])) })(ctx);
  // reflections on the cobbles under the shop
  const refl = make(W, H), rc = refl.getContext('2d');
  const top = P([0, 0, 40])[1];
  for (const p of sh.panes) for (let i = 0; i < 18; i++) glow(rc, p[0] - 40 - i * 6, p[1] + 200 + i * 22, 50, 18, '255,190,110', .3 * (1 - i / 18));
  const rain = paint.particles(rnd, 340, { kind: 'rain', near: .2, slant: .06, speed: 1 });
  const drips = eaves.slice(-6).map(e => ({ at: e(.5, 1), lag: rnd(), turns: 3 + Math.floor(rnd() * 3) }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.beginPath(); target.rect(0, top, W, H - top); target.clip(); target.globalCompositeOperation = 'lighter';
    paint.ripple(target, refl, top, phase, { bands: 3, amp: .8, speed: 3 });
    target.restore();
    // the sign swinging a little on its chains
    const sw = Math.sin(TAU * phase * 2) * .06, [a, b] = sh.sign, w = b[0] - a[0];
    target.save(); target.translate((a[0] + b[0]) / 2, a[1]); target.rotate(sw);
    target.strokeStyle = '#141414'; target.lineWidth = 2; target.beginPath(); target.moveTo(-w * .4, 0); target.lineTo(-w * .4, 20); target.moveTo(w * .4, 0); target.lineTo(w * .4, 20); target.stroke();
    fill(target, [[-w * .5, 20], [w * .5, 20], [w * .5, 20 + w * .7], [-w * .5, 20 + w * .7]], '#2a3a34');
    target.fillStyle = '#d8b870'; target.font = `italic ${Math.round(w * .16)}px serif`; target.textAlign = 'center'; target.textBaseline = 'middle';
    target.fillText('Books', 0, 20 + w * .25); target.fillText('& Paper', 0, 20 + w * .47);
    target.restore();
    for (const d of drips) { const t = (phase * d.turns + d.lag) % 1, y = d.at[1] + t * t * 600; target.fillStyle = `rgba(200,210,230,${.7 * (1 - t)})`; target.fillRect(d.at[0], y, 2, 8); }
    rain.draw(target, phase, '190,198,220');
  };
}

module.exports = {
  title: '비에 잠긴 골목의 책방',
  slug: 'bookshop-after-the-rain',
  sound: 'rain-street',
  createScene,
};
