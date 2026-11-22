'use strict';

// 73 · 문을 닫은 새벽 꽃집
// A small flower shop on a corner, closed, at the grey end of a rainy night. A green-and-cream striped
// canvas awning, heavy with water, sags between its arms and its scalloped edge drips steadily onto the
// pavement. Behind the big window the shop is dim; only a cooler glows, lighting buckets of roses, tulips
// and eucalyptus through misted glass. Outside, under the awning, galvanised buckets of chrysanthemums
// wait to be taken in. The pale painted shopfront, a brass handle, a chalkboard sign leaning by the door.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: -.6, y: 1.5, z: 0, yaw: .22, pitch: .02, focal: 1100, cx: 960, cy: 560 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const FRONT = 5.2;                                        // the shopfront plane z = FRONT, from x -2 to 5

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}
const on = (x, y) => P([x, y, FRONT]);

function shopfront(ctx, rnd) {
  ctx.fillStyle = '#16181e'; ctx.fillRect(0, 0, W, H);
  // the building above: old brick, a sash window upstairs
  paint.masonry(ctx, (u, v) => on(lerp(-3, 6, u), lerp(7, 3.1, v)), rnd, { courses: 24, length: [.02, .035], base: [92, 70, 62], vary: 18, mortar: [60, 56, 54] });
  fill(ctx, [on(-3, 7), on(6, 7), on(6, 3.1), on(-3, 3.1)], 'rgba(12,14,26,.35)');
  fill(ctx, [on(.6, 6.2), on(2.2, 6.2), on(2.2, 4.4), on(.6, 4.4)], '#1a1e28');
  ctx.strokeStyle = '#c8c4b8'; ctx.lineWidth = 5; pathOf(ctx, [on(.6, 6.2), on(2.2, 6.2), on(2.2, 4.4), on(.6, 4.4)]); ctx.stroke(); ctx.beginPath(); ctx.moveTo(...on(.6, 5.3)); ctx.lineTo(...on(2.2, 5.3)); ctx.stroke();
  // painted timber front: fascia board with the name, pilasters, stall riser under the window
  fill(ctx, [on(-2.2, 3.1), on(5.2, 3.1), on(5.2, 0), on(-2.2, 0)], '#a8b0a4');
  fill(ctx, [on(-2.2, 3.1), on(5.2, 3.1), on(5.2, 2.6), on(-2.2, 2.6)], '#2e4a3c');
  ctx.fillStyle = '#d8c890'; ctx.font = `italic ${Math.round(cam.focal / 5.6 * .3)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const nm = on(1.2, 2.85); ctx.fillText('Hollyhock · Flowers', nm[0], nm[1]);
  fill(ctx, [on(-1.6, .55), on(3.3, .55), on(3.3, 0), on(-1.6, 0)], '#8a9488');
  for (const x of [-2.2, -1.7, 3.3, 3.8, 4.7]) fill(ctx, [on(x, 2.6), on(x + .14, 2.6), on(x + .14, 0), on(x, 0)], '#b8c0b4');
  // the door at the right: glazed upper half, dark inside, brass handle
  fill(ctx, [on(3.9, 2.4), on(4.7, 2.4), on(4.7, 0), on(3.9, 0)], '#2e4a3c');
  fill(ctx, [on(4, 2.3), on(4.6, 2.3), on(4.6, 1.2), on(4, 1.2)], '#141a1c');
  ctx.fillStyle = '#c8a050'; const hd = on(4.05, 1.05); ctx.fillRect(hd[0], hd[1], 6, 20);
}

// The interior seen through the window: the cooler's glow and buckets of flowers.
function interior(ctx, rnd) {
  const win = [on(-1.6, 2.5), on(3.3, 2.5), on(3.3, .55), on(-1.6, .55)];
  ctx.save(); pathOf(ctx, win); ctx.clip();
  ctx.fillStyle = '#0e1214'; ctx.fillRect(0, 0, W, H);
  // the cooler: a tall glass-door fridge at the back, cold white-green light
  const cool = (u, v) => P([lerp(-.4, 1.6, u), lerp(2.2, .1, v), FRONT + 3]);
  fill(ctx, paint.outline(cool, 4), vertical(ctx, cool(0, 0)[1], cool(0, 1)[1], [[0, '#c8e0d8'], [1, '#7aa094']]));
  const cc = cool(.5, .5); glow(ctx, cc[0], cc[1], 400, 300, '170,230,210', .35);
  for (let s = 1; s < 4; s++) { const a = cool(0, s / 4), b = cool(1, s / 4); ctx.strokeStyle = 'rgba(40,60,56,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // buckets in the cooler and on the floor in front of the window, each with its own flowers
  const kinds = [['#c83a4a', 'rose'], ['#e8c040', 'tulip'], ['#f0e8e0', 'rose'], ['#7a9a8a', 'leaf'], ['#d86aa0', 'tulip'], ['#8a3aa8', 'rose']];
  const bucket = (x, y, z, kind, scale) => {
    const b = P([x, y, z]), k = cam.focal / cam.project([x, y, z])[2] * scale;
    fill(ctx, [[b[0] - .14 * k, b[1] - .3 * k], [b[0] + .14 * k, b[1] - .3 * k], [b[0] + .11 * k, b[1]], [b[0] - .11 * k, b[1]]], '#5a6066');
    for (let f = 0; f < 14; f++) {
      const ang = -Math.PI / 2 + (rnd() - .5) * 1.1, len = (.35 + rnd() * .3) * k, tip = [b[0] + Math.cos(ang) * len * .6, b[1] - .3 * k + Math.sin(ang) * len];
      ctx.strokeStyle = '#3a5a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b[0] + (rnd() - .5) * .1 * k, b[1] - .3 * k); ctx.lineTo(...tip); ctx.stroke();
      if (kind[1] === 'leaf') { ctx.fillStyle = shade([110, 140, 120], (rnd() - .5) * 30); for (let l = 0; l < 4; l++) { ctx.beginPath(); ctx.arc(tip[0] + (rnd() - .5) * 14, tip[1] + l * 8, .03 * k, 0, TAU); ctx.fill(); } }
      else { ctx.fillStyle = shade(kind[0].match(/\w\w/g).map(h => parseInt(h, 16)), (rnd() - .5) * 30); ctx.beginPath(); kind[1] === 'tulip' ? ctx.ellipse(tip[0], tip[1], .035 * k, .05 * k, 0, 0, TAU) : ctx.arc(tip[0], tip[1], .045 * k, 0, TAU); ctx.fill(); if (kind[1] === 'rose') { ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(tip[0], tip[1], .025 * k, 0, 4); ctx.stroke(); } }
    }
  };
  for (let i = 0; i < 6; i++) bucket(lerp(-.25, 1.45, (i % 3) / 2), i < 3 ? 1.15 : .15, FRONT + 2.95, kinds[i], 1);
  for (let i = 0; i < 6; i++) bucket(lerp(-1.3, 3, i / 5) + (rnd() - .5) * .2, 0, FRONT + .8 + (i % 2) * .4, kinds[(i + 2) % 6], 1);
  // the glass: mist and a reflection of the street
  fill(ctx, win, 'rgba(170,180,190,.12)');
  for (let i = 0; i < 12; i++) { const p = on(lerp(-1.6, 3.3, rnd()), lerp(.6, 2.4, rnd())); glow(ctx, p[0], p[1], 120, 80, '200,210,220', .06); }
  ctx.restore();
  ctx.strokeStyle = '#b8c0b4'; ctx.lineWidth = 6; pathOf(ctx, win); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(...on(.85, 2.5)); ctx.lineTo(...on(.85, .55)); ctx.stroke();
  return cool(.5, .5);
}

// The awning: from the fascia it slopes out 1.4 m and sags between its arms; returns its hem points.
function awning(ctx, rnd) {
  const x0 = -2.2, x1 = 3.4, out = 1.5, drop = .7, sag = .14;
  const map = (u, v) => P([lerp(x0, x1, u), lerp(2.7, 2.7 - drop, v) - sag * Math.sin(Math.PI * u) * v, lerp(FRONT, FRONT - out, v)]);
  const stripes = 14;
  for (let s = 0; s < stripes; s++) {
    const q = (u, v) => map((s + u) / stripes, v);
    fill(ctx, paint.outline(q, 6), s % 2 ? '#d8d4c0' : '#2e5a44');
    for (let f = 0; f < 3; f++) { const a = q((f + .5) / 3, 0), b = q((f + .5) / 3, 1); ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  }
  fill(ctx, paint.outline(map, 12), 'rgba(10,14,26,.35)');
  // the valance: scalloped hem hanging below the front edge
  const hem = [];
  for (let i = 0; i <= 28; i++) {
    const u = i / 28, top = map(u, 1), k = cam.focal / cam.project([lerp(x0, x1, u), 2, FRONT - out])[2];
    const s = Math.floor(u * stripes);
    const bot = [top[0], top[1] + .22 * k], scal = [top[0], top[1] + (.22 + .06 * Math.abs(Math.sin(u * stripes * Math.PI))) * k];
    hem.push({ top, bot: scal, s });
    void bot;
  }
  for (let i = 0; i < hem.length - 1; i++) { const a = hem[i], b = hem[i + 1]; fill(ctx, [a.top, b.top, b.bot, a.bot], a.s % 2 ? '#c8c4b0' : '#244a38'); }
  // the iron arms
  for (const x of [x0 + .1, x1 - .1]) { const a = P([x, 2.0, FRONT]), b = map((x - x0) / (x1 - x0), 1); ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  return hem.map(h => h.bot);
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(73011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  shopfront(ctx, rnd);
  const coolAt = interior(ctx, rnd);
  // pavement: wet flags reflecting the cooler and the street lamp off frame
  fill(ctx, [P([-2.5, 0, 1.2]), P([8, 0, 1.2]), P([8, 0, FRONT]), P([-4, 0, FRONT])], vertical(ctx, on(0, 0)[1], H, [[0, '#2a2e34'], [1, '#14161a']]));
  for (let z = 1.2; z < FRONT; z += .6) { ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...P([-2.5, 0, z])); ctx.lineTo(...P([8, 0, z])); ctx.stroke(); }
  for (let x = -2.4; x < 8; x += .6) { ctx.beginPath(); ctx.moveTo(...P([x, 0, 1.2])); ctx.lineTo(...P([x, 0, FRONT])); ctx.stroke(); }
  const hem = awning(ctx, rnd);
  // outside buckets of chrysanthemums and the chalkboard sign
  for (let i = 0; i < 4; i++) {
    const at = [-1.4 + i * .55, 0, FRONT - .45], b = P(at), k = cam.focal / cam.project(at)[2];
    fill(ctx, [[b[0] - .17 * k, b[1] - .32 * k], [b[0] + .17 * k, b[1] - .32 * k], [b[0] + .13 * k, b[1]], [b[0] - .13 * k, b[1]]], '#7a8288');
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(b[0] - .12 * k, b[1] - .3 * k, .05 * k, .28 * k);
    const col = [[230, 200, 80], [240, 236, 220], [200, 90, 60], [220, 140, 160]][i];
    for (let f = 0; f < 22; f++) { const x = b[0] + (rnd() - .5) * .34 * k, y = b[1] - (.36 + rnd() * .16) * k; ctx.fillStyle = shade(col, (rnd() - .5) * 36); ctx.beginPath(); ctx.arc(x, y, .035 * k, 0, TAU); ctx.fill(); }
  }
  const sg = [3.2, 0, FRONT - .7], sb = P(sg), sk = cam.focal / cam.project(sg)[2];
  fill(ctx, [[sb[0] - .3 * sk, sb[1]], [sb[0] - .22 * sk, sb[1] - .9 * sk], [sb[0] + .22 * sk, sb[1] - .9 * sk], [sb[0] + .3 * sk, sb[1]]], '#5a3e26');
  fill(ctx, [[sb[0] - .24 * sk, sb[1] - .1 * sk], [sb[0] - .18 * sk, sb[1] - .82 * sk], [sb[0] + .18 * sk, sb[1] - .82 * sk], [sb[0] + .24 * sk, sb[1] - .1 * sk]], '#1e2420');
  ctx.fillStyle = 'rgba(230,230,220,.75)'; ctx.font = `${Math.round(.08 * sk)}px serif`; ctx.textAlign = 'center';
  ['tulips', 'peonies', 'open 7am'].forEach((t, i) => ctx.fillText(t, sb[0], sb[1] - (.66 - i * .16) * sk));
  paint.applyTexture(ctx, make, 7301, .34, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.52, .56, .66], lights: [paint.LIGHT.lamp(coolAt[0], coolAt[1], .3, 500, 400, [.85, 1.1, 1]), paint.LIGHT.lamp(-200, 400, .35, 900, 700, [1.3, 1, .65])] })(ctx);
  // reflection of the lit window in the wet pavement
  const refl = make(W, H), rc = refl.getContext('2d');
  rc.save(); rc.translate(0, on(0, 0)[1] * 2); rc.scale(1, -1); rc.globalAlpha = .28; rc.drawImage(plate, 0, 0); rc.restore();
  const top = on(0, 0)[1];
  const drops = hem.filter((_, i) => i % 2).map(p => ({ x: p[0], y: p[1], offset: rnd(), turns: 3 + Math.floor(rnd() * 4) }));
  const rain = paint.particles(rnd, 260, { kind: 'rain', near: .15, slant: .1, speed: 1 });

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.beginPath(); target.rect(0, top, W, H - top); target.clip(); target.globalCompositeOperation = 'lighter';
    paint.ripple(target, refl, top, phase, { bands: 3, amp: .6, speed: 3 });
    target.restore();
    // drops gathering at the hem's points and falling to the pavement, a ring where they land
    for (const d of drops) {
      const t = (phase * d.turns + d.offset) % 1, ground = d.y + (H - d.y) * .55;
      if (t < .5) { const sz = 2 + t * 4; target.fillStyle = 'rgba(200,214,230,.7)'; target.beginPath(); target.ellipse(d.x, d.y + 3, sz * .7, sz, 0, 0, TAU); target.fill(); }
      else if (t < .7) { const y = lerp(d.y, ground, (t - .5) / .2); target.fillStyle = 'rgba(200,214,230,.7)'; target.fillRect(d.x - 1, y, 2, 10); }
      else { const r = (t - .7) / .3; target.strokeStyle = `rgba(200,214,230,${.5 * (1 - r)})`; target.lineWidth = 1; target.beginPath(); target.ellipse(d.x, ground, 4 + r * 22, 1 + r * 5, 0, 0, TAU); target.stroke(); }
    }
    rain.draw(target, phase, '190,200,216');
  };
}

module.exports = {
  title: '문을 닫은 새벽 꽃집',
  slug: 'closed-flower-shop-before-dawn',
  sound: 'rain-street',
  createScene,
};
