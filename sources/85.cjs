'use strict';

// 85 · 골목 끝 자판기의 불빛
// The dead end of a narrow back lane in the rain. Against a crumbling concrete wall at the end stand three
// vending machines side by side, each its own colour: a red drinks machine with rows of bottles behind its
// lit window, a blue one with cans, a small white coffee machine. They are the only light; it pours out
// across the soaked lane, glazing every puddle, picking out the drainpipe, the AC units and tangled wires
// on the side walls, a stack of crates, a bicycle. Moths circle the lit fronts. Rain falls steadily.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, glow, pathOf, shade, camera } = paint;

const cam = camera({ x: .2, y: 1.5, z: 0, yaw: 0, pitch: .04, focal: 1050, cx: 960, cy: 520 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const END = 11, HALF = 1.9;

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function lane(ctx, rnd) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = vertical(ctx, 0, 300, [[0, '#0c0e18'], [1, '#1a1c28']]); ctx.fillRect(0, 0, W, 300);
  // ground: cracked concrete, a gutter channel down the middle
  const g = (u, v) => P([lerp(-HALF, HALF, u), 0, lerp(END, 1, v)]);
  fill(ctx, paint.outline(g, 8), vertical(ctx, P([0, 0, END])[1], H, [[0, '#3a3634'], [1, '#18181a']]));
  const gutter = [P([-.15, 0, END]), P([.15, 0, END]), P([.15, 0, 1]), P([-.15, 0, 1])]; fill(ctx, gutter, 'rgba(0,0,0,.35)');
  for (let i = 0; i < 20; i++) { const a = g(rnd(), rnd()); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...a); for (let s = 0; s < 4; s++) ctx.lineTo(a[0] + (rnd() - .5) * 80 * (s + 1) / 4, a[1] + (rnd() - .5) * 12 * (s + 1) / 4); ctx.stroke(); }
  // side walls: different old buildings, rendered and patched, with stuff fixed to them
  for (const s of [-1, 1]) {
    const w = (u, v) => P([s * HALF + s * .04 * Math.sin(u * 11), lerp(7 - .3 * Math.sin(Math.PI * u), 0, v), lerp(1, END, u)]);
    fill(ctx, paint.outline(w, 12), s < 0 ? '#4a4640' : '#3e4448');
    ctx.save(); pathOf(ctx, paint.outline(w, 12)); ctx.clip();
    for (let i = 0; i < 70; i++) { const p = w(rnd(), rnd()); glow(ctx, p[0], p[1], 20 + rnd() * 80, 20 + rnd() * 60, rnd() < .6 ? '0,0,0' : '200,190,170', .07 + rnd() * .06); }
    for (let i = 0; i < 30; i++) { const u = rnd(), a = w(u, rnd() * .4), b = w(u, .5 + rnd() * .5); ctx.strokeStyle = `rgba(0,0,0,${.1 + rnd() * .15})`; ctx.lineWidth = 1 + rnd() * 4; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(b[0] + (rnd() - .5) * 4, b[1]); ctx.stroke(); }
    ctx.restore();
    // AC units on brackets
    for (const [z, y] of [[3, 2.6], [6.5, 3.4], [8.5, 2.2]]) paint.box(ctx, cam, { at: [s * (HALF - .25), y, z], sa: .24, sb: .4, h: .5 }, n => (n === 'top' ? '#9a9c98' : '#7a7c78'));
    // a drainpipe
    const a = P([s * (HALF - .06), 7, 4.5 + s]), b = P([s * (HALF - .06), 0, 4.5 + s]), k = cam.focal / (4.5 + s); ctx.strokeStyle = '#2a2c30'; ctx.lineWidth = .08 * k; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  }
  // wires slung across the lane, sagging
  for (let i = 0; i < 6; i++) { const z = 2 + i * 1.6, y = 4.4 + rnd() * 2; ctx.strokeStyle = 'rgba(10,10,14,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let t = 0; t <= 12; t++) { const p = P([lerp(-HALF, HALF, t / 12), y - .5 * Math.sin(Math.PI * t / 12), z + (rnd() - .5) * .1]); t ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke(); }
  // end wall: crumbling concrete with exposed bricks
  const e = (u, v) => P([lerp(-HALF, HALF, u), lerp(6, 0, v), END]);
  fill(ctx, paint.outline(e, 4), '#4a4844');
}

function machines(ctx, rnd) {
  const specs = [{ x: -1.15, w: .5, body: [180, 40, 40], items: 'bottle' }, { x: -.1, w: .5, body: [40, 80, 160], items: 'can' }, { x: .9, w: .38, body: [220, 220, 214], items: 'coffee' }];
  const fronts = [];
  for (const m of specs) {
    const at = [m.x, 0, END - .45];
    paint.box(ctx, cam, { at, sa: m.w, sb: .4, h: 1.85 }, n => shade(m.body, n === 'front' ? 0 : n === 'top' ? 20 : -30));
    const k = cam.focal / (END - .85);
    const fr = (u, v) => P([m.x + lerp(-m.w + .06, m.w - .06, u), lerp(1.75, .1, v), END - .86]);
    // the display window: rows of products on lit shelves
    const win = (u, v) => fr(lerp(.04, m.items === 'coffee' ? .96 : .72, u), lerp(.03, m.items === 'coffee' ? .4 : .55, v));
    fill(ctx, paint.outline(win, 4), vertical(ctx, win(0, 0)[1], win(0, 1)[1], [[0, '#f4f8f8'], [1, '#c8d8e0']]));
    const rows = m.items === 'coffee' ? 2 : 4, cols = m.items === 'coffee' ? 3 : 6;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const p = win((c + .5) / cols, (r + .7) / rows), col = [[220, 80, 60], [60, 160, 90], [240, 200, 60], [80, 120, 220], [230, 230, 230], [120, 60, 40]][Math.floor(rnd() * 6)];
      ctx.fillStyle = shade(col, (rnd() - .5) * 20);
      if (m.items === 'bottle') { ctx.fillRect(p[0] - .02 * k, p[1] - .1 * k, .04 * k, .1 * k); ctx.fillRect(p[0] - .008 * k, p[1] - .13 * k, .016 * k, .03 * k); }
      else if (m.items === 'can') ctx.fillRect(p[0] - .025 * k, p[1] - .08 * k, .05 * k, .08 * k);
      else { ctx.fillRect(p[0] - .05 * k, p[1] - .12 * k, .1 * k, .12 * k); }
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(p[0] - .03 * k, p[1] + .005 * k, .06 * k, .02 * k);
    }
    // the button strip, coin slot and the dispensing bay
    for (let r = 0; r < (m.items === 'coffee' ? 0 : 4); r++) { const p = fr(.86, .1 + r * .13); ctx.fillStyle = '#e8e4d0'; ctx.fillRect(p[0] - .03 * k, p[1], .06 * k, .04 * k); }
    fill(ctx, paint.outline((u, v) => fr(lerp(.2, .8, u), lerp(.78, .92, v)), 2), '#141416');
    fronts.push({ c: win(.5, .5), w: Math.abs(win(1, .5)[0] - win(0, .5)[0]), h: Math.abs(win(.5, 1)[1] - win(.5, 0)[1]), col: m.body });
  }
  // a stack of crates and a bicycle leaning on the right wall
  for (let i = 0; i < 3; i++) paint.box(ctx, cam, { at: [1.45, i * .32, 8.6], sa: .3, sb: .22, h: .3 }, n => shade([[60, 100, 60], [200, 120, 40], [40, 80, 140]][i], n === 'front' ? 0 : -20));
  const bk = cam.focal / 6.5, bc = P([-1.5, .35, 6.5]);
  ctx.strokeStyle = '#141418'; ctx.lineWidth = 3; for (const dz of [-.5, .5]) { const c = P([-1.6, .35, 6.5 + dz]); ctx.beginPath(); ctx.ellipse(c[0], c[1], .1 * bk, .33 * bk, 0, 0, TAU); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(...P([-1.6, .35, 6])); ctx.lineTo(...P([-1.6, .85, 6.4])); ctx.lineTo(...P([-1.6, .35, 7])); ctx.moveTo(...P([-1.6, .85, 6.4])); ctx.lineTo(...P([-1.6, .95, 6.9])); ctx.stroke();
  void bc;
  return fronts;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(85011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  lane(ctx, rnd);
  const fronts = machines(ctx, rnd);
  paint.applyTexture(ctx, make, 8501, .36, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.36, .38, .48], lights: fronts.map(f => paint.LIGHT.lamp(f.c[0], f.c[1] + 160, .28, 480, 600, f.col.map(c => .7 + c / 400))) })(ctx);
  // the wet ground holds long coloured reflections of the machine fronts
  const refl = make(W, H), rc = refl.getContext('2d');
  const ground = P([0, 0, END - .4])[1];
  for (const f of fronts) for (let i = 0; i < 20; i++) glow(rc, f.c[0], ground + 20 + i * 22, f.w * .4, 20, f.col.map(c => Math.round(140 + c * .45)).join(','), .3 * (1 - i / 20));
  const rain = paint.particles(rnd, 300, { kind: 'rain', near: .2, slant: .06, speed: 1 });
  const moths = Array.from({ length: 7 }, (_, i) => ({ f: fronts[i % 3], r: 40 + rnd() * 90, a: rnd() * TAU, turns: (1 + Math.floor(rnd() * 3)) * (rnd() < .5 ? 1 : -1) }));

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save(); target.beginPath(); target.rect(0, ground, W, H - ground); target.clip(); target.globalCompositeOperation = 'lighter';
    paint.ripple(target, refl, ground, phase, { bands: 3, amp: .7, speed: 3 });
    target.restore();
    for (const f of fronts) glow(target, f.c[0], f.c[1], f.w * .9, f.h * .9, '230,240,250', .06 + .02 * Math.sin(TAU * phase * 6));
    for (const m of moths) { const a = m.a + TAU * phase * m.turns, x = m.f.c[0] + Math.cos(a) * m.r + Math.sin(a * 3) * 10, y = m.f.c[1] + Math.sin(a) * m.r * .6; target.fillStyle = 'rgba(230,220,200,.8)'; target.beginPath(); target.ellipse(x, y, 3, 1.5 + Math.abs(Math.sin(TAU * phase * 40 + m.a)) * 2.5, 0, 0, TAU); target.fill(); }
    rain.draw(target, phase, '190,200,220');
  };
}

module.exports = {
  title: '골목 끝 자판기의 불빛',
  slug: 'vending-machines-at-the-lane-end',
  sound: 'rain-street',
  createScene,
};
