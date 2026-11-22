'use strict';

// 97 · 산비탈의 기상관측소
// A small weather station high on a snowy slope before dawn. A timber hut on a stone footing, its window
// lit, stands a little above us; beside it a white louvred instrument screen on four legs and a guyed mast
// carrying a cup anemometer and a wind vane. Behind, the ridge rises and the far range fades blue. The
// wind is steady: the cups spin, the vane holds, and fine snow streams across the slope.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, planks, shade, camera, lambert, v3 } = paint;
const { add, mul, unit } = v3;

const cam = camera({ x: 0, y: 1.5, z: 0, yaw: .08, pitch: -.1, focal: 1150, cx: 960, cy: 600 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const slope = (x, z) => z * .32 + .4 * edge(x * 4 + z * 2, 171, [[200, 1], [60, .3]]);
const TO_SKY = unit([-.4, .8, .3]);

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

function backdrop(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, H, [[0, '#101a2c'], [.45, '#2a3c56'], [.7, '#5a6c84'], [1, '#8494a8']]);
  ctx.fillRect(0, 0, W, H);
  paint.starfield(ctx, rnd, 120, 300);
  // far range: jagged peaks, each layer paler; the near ridge the slope climbs to
  paint.ridgeline(ctx, 520, 220, [96, 112, 136], 172, [[420, 1], [120, .6], [30, .3], [8, .1]]);
  paint.ridgeline(ctx, 600, 160, [120, 134, 156], 173, [[360, 1], [90, .5], [20, .2]]);
  // snow on the slope, wind-scoured into ripples
  // the slope, drawn in bands from the ridge down to our feet so its rise reads: paler and bluer far up
  for (let i = 0; i <= 30; i++) {
    const z = lerp(60, 2, i / 30), band = [];
    const reach = z * 1.1 + 3;
    for (let x = -reach; x <= reach + 1e-9; x += reach / 35) band.push(P([x, slope(x, z), z]));
    band.push([W, H], [0, H]);
    fill(ctx, band, shade(paint.aerial([70, 80, 100], (z / 60) * .7, [150, 162, 184]), -i * .6));
  }
  // the slope's shape: long wind-ridged contours across it, each catching a line of sky light on its crest
  for (let z = 4; z < 60; z += 1.4 + z * .05) {
    const line = [];
    const reach = Math.min(50, z * 1.1 + 3);
    for (let x = -reach; x <= reach + 1e-9; x += reach / 25) line.push(P([x, slope(x, z) + .05 * Math.sin(x * .7 + z), z]));
    ctx.strokeStyle = `rgba(200,212,230,${.08 + .1 * (1 - z / 60)})`; ctx.lineWidth = 1.2; ctx.beginPath(); line.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
    ctx.strokeStyle = `rgba(30,40,60,${.1 + .1 * (1 - z / 60)})`; ctx.beginPath(); line.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] + 3) : ctx.moveTo(p[0], p[1] + 3))); ctx.stroke();
  }
  for (let i = 0; i < 160; i++) {
    const z = 3 + rnd() ** 1.3 * 55, x = (rnd() - .5) * z * 2.2, s = cam.project([x, slope(x, z), z]); if (s[2] <= 0) continue;
    const k = cam.focal / s[2];
    glow(ctx, s[0], s[1], (1 + rnd() * 3) * k, (.05 + rnd() * .08) * k, rnd() < .5 ? '180,192,212' : '50,60,82', .25);
  }
}

// The hut, built in metres on the slope: walls of grey boards, a shallow roof heavy with snow, a lit window.
function hut(ctx, rnd) {
  const T = -.35, A = [Math.cos(T), 0, Math.sin(T)], B = [-Math.sin(T), 0, Math.cos(T)];
  const O = [3.4, slope(3.4, 16) + .3, 16], L = 4.2, D = 3.2, Hh = 2.4;
  const pt = (a, b, h) => add(O, mul(A, a), mul(B, b), [0, h, 0]);
  // footing on the downhill side
  fill(ctx, [pt(0, 0, 0), pt(L, 0, 0), pt(L, 0, -.5), pt(0, 0, -.6)].map(P), '#4a4a50');
  const front = (u, v) => P(pt(u * L, 0, Hh * (1 - v)));
  planks(ctx, front, rnd, { along: 'u', width: [.07, .09], base: [100, 104, 108], vary: 14, streaks: 4 });
  fill(ctx, paint.outline(front, 12), `rgba(10,14,30,${.55 - lambert(mul(B, -1), TO_SKY) * .4})`);
  const end = (u, v) => P(pt(L, u * D, (Hh + .4 * u) * (1 - v)));
  planks(ctx, end, rnd, { along: 'u', width: [.07, .09], base: [90, 94, 100], vary: 14, streaks: 3 });
  fill(ctx, paint.outline(end, 12), `rgba(10,14,30,${.6 - lambert(A, TO_SKY) * .4})`);
  // window: recessed, lamplit, a curtain half drawn
  const w = [pt(1.4, 0, 1.8), pt(2.4, 0, 1.8), pt(2.4, 0, 1.0), pt(1.4, 0, 1.0)], wi = w.map(p => add(p, mul(B, .12)));
  fill(ctx, w.map(P), '#2a2a30');
  const c = v3.lerp(wi[0], wi[2], .5), cs = P(c), warm = ctx.createRadialGradient(...cs, 3, ...cs, 60);
  warm.addColorStop(0, '#ffdca0'); warm.addColorStop(1, '#a05a30');
  fill(ctx, wi.map(P), warm);
  fill(ctx, [wi[0], v3.lerp(wi[0], wi[1], .35), v3.lerp(wi[3], wi[2], .25), wi[3]].map(P), 'rgba(120,60,50,.6)');
  fill(ctx, [w[0], wi[0], wi[3], w[3]].map(P), '#3a3a40');
  // roof: snow slab with visible thickness and a cornice blown out over the lee edge
  const roof = [pt(-.3, -.4, Hh + .15), pt(L + .3, -.4, Hh + .15), pt(L + .3, D + .4, Hh + .6), pt(-.3, D + .4, Hh + .6)];
  const snowTop = roof.map(p => add(p, [0, .45, 0]));
  fill(ctx, snowTop.map(P), '#d0d8e4');
  fill(ctx, [snowTop[0], snowTop[1], add(roof[1], [0, -.1, 0]), add(roof[0], [0, -.1, 0])].map(P), '#8a96aa');
  fill(ctx, [snowTop[1], snowTop[2], add(roof[2], [.2, -.05, 0]), add(roof[1], [.25, -.1, 0])].map(P), '#9aa6ba');
  // chimney pipe with a thread of smoke
  const pipe = pt(.8, 1.6, Hh + .5);
  fill(ctx, [add(pipe, [-.07, 0, 0]), add(pipe, [.07, 0, 0]), add(pipe, [.07, .9, 0]), add(pipe, [-.07, .9, 0])].map(P), '#2a2a30');
  return { window: cs, smoke: P(add(pipe, [0, .95, 0])), O };
}

// Stevenson screen: a white louvred box on four legs, the louvres drawn as slats on its two visible faces.
function screenBox(ctx, rnd, base) {
  const T = .4, A = [Math.cos(T), 0, Math.sin(T)], B = [-Math.sin(T), 0, Math.cos(T)];
  const pt = (a, b, h) => add(base, mul(A, a), mul(B, b), [0, h, 0]);
  for (const [a, b] of [[.05, .05], [.75, .05], [.05, .55], [.75, .55]]) {
    ctx.strokeStyle = '#d0d4d8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...P(pt(a, b, 0))); ctx.lineTo(...P(pt(a, b, 1.1))); ctx.stroke();
  }
  const face = [pt(0, 0, 1.7), pt(.8, 0, 1.7), pt(.8, 0, 1.1), pt(0, 0, 1.1)], side = [pt(.8, 0, 1.7), pt(.8, .6, 1.7), pt(.8, .6, 1.1), pt(.8, 0, 1.1)];
  fill(ctx, face.map(P), '#c8ccd2'); fill(ctx, side.map(P), '#9aa0aa');
  for (let i = 1; i < 10; i++) {
    const t = i / 10;
    for (const f of [face, side]) {
      const a = P(v3.lerp(f[0], f[3], t)), b = P(v3.lerp(f[1], f[2], t));
      ctx.strokeStyle = 'rgba(40,46,60,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
    }
  }
  fill(ctx, [pt(-.08, -.08, 1.78), pt(.88, -.08, 1.78), pt(.88, .68, 1.78), pt(-.08, .68, 1.78)].map(P), '#e4e8ee');
  fill(ctx, [pt(-.08, -.08, 1.78), pt(.88, -.08, 1.78), pt(.88, -.08, 1.7), pt(-.08, -.08, 1.7)].map(P), '#aab0ba');
}

// The mast: a lattice pole with guy wires; the anemometer and vane are drawn each frame.
function mast(ctx, base) {
  const top = add(base, [0, 7, 0]);
  ctx.strokeStyle = '#2a2e36'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(...P(base)); ctx.lineTo(...P(top)); ctx.stroke();
  for (let h = .5; h < 7; h += .5) {
    const a = P(add(base, [-.08, h, 0])), b = P(add(base, [.08, h + .25, 0]));
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(40,44,54,.6)'; ctx.lineWidth = 1;
  for (const d of [[-3, 0, -2], [3, 0, -1.5], [.5, 0, 3]]) {
    const anchor = add(base, d); anchor[1] = slope(anchor[0], anchor[2]);
    ctx.beginPath(); ctx.moveTo(...P(add(base, [0, 5.5, 0]))); ctx.lineTo(...P(anchor)); ctx.stroke();
  }
  return top;
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(97011);
  const plate = make(W, H), ctx = plate.getContext('2d');
  backdrop(ctx, rnd);
  const mastBase = [-1.8, slope(-1.8, 19), 19];
  const top = mast(ctx, mastBase);
  const h = hut(ctx, rnd);
  screenBox(ctx, rnd, [-4.6, slope(-4.6, 12.5), 12.5]);
  // a snow fence along the slope, half drifted over
  for (let i = 0; i < 18; i++) {
    const x = -14 + i * 1.2, z = 9 + i * .2, b = [x, slope(x, z), z], t = add(b, [0, .9 - (i % 5) * .08, 0]);
    ctx.strokeStyle = '#3a3230'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...P(b)); ctx.lineTo(...P(t)); ctx.stroke();
    glow(ctx, ...P(add(b, [.4, .2, 0])), 40, 10, '220,228,240', .5);
  }
  paint.applyTexture(ctx, make, 9701, .36, 0, 0, W, H, true);
  paint.lighting(make, { ambient: [.76, .8, .9], lights: [paint.LIGHT.lamp(h.window[0], h.window[1] + 80, .3, 260, 160)] })(ctx);
  const snow = paint.particles(rnd, 300, { kind: 'rain', near: .3, slant: -1.4, speed: .6 });
  const topS = P(top);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    // anemometer: three cups on arms, whole turns per loop
    const spin = TAU * phase * 18;
    target.strokeStyle = '#1e2228'; target.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const a = spin + k * TAU / 3, ex = topS[0] + Math.cos(a) * 26, ey = topS[1] - 6 + Math.sin(a) * 7;
      target.beginPath(); target.moveTo(topS[0], topS[1] - 6); target.lineTo(ex, ey); target.stroke();
      target.fillStyle = '#2a2e36'; target.beginPath(); target.ellipse(ex, ey, 6, 5, 0, 0, TAU); target.fill();
    }
    // the vane, holding into the wind with a small shiver
    const vy = topS[1] + 30, wob = .06 * Math.sin(TAU * phase * 7);
    target.beginPath(); target.moveTo(topS[0] - 40 * Math.cos(wob), vy); target.lineTo(topS[0] + 30 * Math.cos(wob), vy + 30 * Math.sin(wob)); target.stroke();
    target.fillStyle = '#2a2e36'; target.beginPath(); target.moveTo(topS[0] + 30, vy - 12); target.lineTo(topS[0] + 48, vy); target.lineTo(topS[0] + 30, vy + 12); target.fill();
    // smoke from the hut's stovepipe, torn sideways by the wind
    for (let i = 0; i < 8; i++) {
      const t = ((phase * 2 + i / 8) % 1);
      glow(target, h.smoke[0] - t * 260, h.smoke[1] - t * 60, 10 + t * 40, 6 + t * 18, '200,206,216', .25 * (1 - t) * Math.min(1, t * 10));
    }
    snow.draw(target, phase, '236,240,248');
  };
}

module.exports = {
  title: '산비탈의 기상관측소',
  slug: 'weather-station-on-the-slope',
  sound: 'snow',
  createScene,
};
