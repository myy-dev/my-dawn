'use strict';

// 33 · 잔물결 위에 불 켠 보트 창고
// A weathered boathouse standing on pilings in a still lake at night, built in metres and seen from low on
// the water. Its long side faces us, one window lit; the gable end turns toward the moon with the boat bay
// open onto the water and a lantern hung above it. The ridge has settled, the eave dips between rafters,
// the pilings lean. A plank dock runs out from the left and a rowboat lies tied off by the bay. The water is
// a true mirror: everything is drawn a second time below the surface, then broken up by ripples.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, pathOf, planks, shingles, shade, camera, lambert } = paint;

const cam = camera({ x: 0, y: 1.5, z: 0, yaw: .04, pitch: .015, focal: 1150, cx: 960, cy: 560 });
const project = p => { const s = cam.project(p); return [s[0], s[1]]; };
const mirror = p => project([p[0], -p[1], p[2]]);
const HORIZON = Math.round(cam.project([0, 1.5, 1e6])[1]);
const MOON = [1560, 190];
const TO_MOON = [.7, .45, .55];

const add = (...vs) => vs.reduce((s, v) => [s[0] + v[0], s[1] + v[1], s[2] + v[2]], [0, 0, 0]);
const mul = (v, k) => [v[0] * k, v[1] * k, v[2] * k];
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const UP = [0, 1, 0];

function fill(ctx, points, style) { pathOf(ctx, points); ctx.fillStyle = style; ctx.fill(); }
function vertical(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}
const faceShade = (ctx, pts, normal, deepest) => fill(ctx, pts, `rgba(6,10,24,${(1 - lambert(normal, TO_MOON)) * deepest})`);

// ---- the boathouse, in metres ----
const T = -.62, A = [Math.cos(T), 0, Math.sin(T)], B = [-Math.sin(T), 0, Math.cos(T)];
const FLOOR = .9, O = [-5.2, FLOOR, 18.5];          // back-left corner of the long wall, at floor level
const LEN = 7.6, WIDTH = 5.2, WALL = 2.5, RIDGE = 4.3, EAVE_OUT = .45, RAKE_OUT = .3;
const SLOPE = (RIDGE - WALL) / (WIDTH / 2);
const sag = u => Math.sin(Math.PI * u ** 1.15);
const wall3 = (u, v) => add(O, mul(A, u * LEN), mul(UP, WALL * (1 - v)), mul(B, -.05 * sag(u) * (1 - v * .5)), mul(UP, -.12 * sag(u) * (1 - v)));
const gableCorner = add(O, mul(A, LEN));             // where the long wall meets the gable end
const gable3 = (u, v) => add(gableCorner, mul(B, WIDTH * u), mul(UP, -FLOOR * .65 + (RIDGE + FLOOR * .65) * (1 - v)));
const gableTop = u => WALL + SLOPE * (WIDTH / 2 - Math.abs(WIDTH * u - WIDTH / 2));
const roof3 = (u, v, lift = 0) => {
  const along = -RAKE_OUT + u * (LEN + 2 * RAKE_OUT), across = lerp(WIDTH / 2, -EAVE_OUT, v);
  return add(O, mul(A, along), mul(B, across), mul(UP, RIDGE - SLOPE * (WIDTH / 2 - across) - .3 * sag(u) * (1 - v) - .16 * sag(u) * v
    - .04 * Math.abs(Math.sin(u * Math.PI * 7)) * v + lift));
};

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON, [[0, '#080d1a'], [.55, '#18223a'], [1, '#3a4258']]);
  ctx.fillRect(0, 0, W, HORIZON + 4);
  for (let i = 0; i < 320; i++) {
    const x = rnd() * W, y = rnd() ** 1.5 * HORIZON * .85, r = rnd();
    ctx.fillStyle = `rgba(220,228,244,${.12 + r * .55 * (1 - y / HORIZON)})`;
    ctx.fillRect(x, y, r > .93 ? 2 : 1.1, r > .93 ? 2 : 1.1);
  }
  for (let i = 0; i < 18; i++) glow(ctx, rnd() * W, 120 + rnd() * 300, 200 + rnd() * 300, 8 + rnd() * 16, '90,100,130', .14);
  glow(ctx, ...MOON, 260, 260, '200,210,230', .28);
  glow(ctx, ...MOON, 60, 60, '230,236,246', .5);
  ctx.fillStyle = '#e8ecf2'; ctx.beginPath(); ctx.arc(...MOON, 22, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(160,170,190,.35)'; ctx.beginPath(); ctx.arc(MOON[0] - 6, MOON[1] + 4, 6, 0, TAU); ctx.arc(MOON[0] + 8, MOON[1] - 6, 4, 0, TAU); ctx.fill();
}

function shore(ctx) {
  const layers = [[HORIZON - 8, 64, [44, 54, 72], 61, [[300, 1], [60, .6], [14, .5], [5, .3]]],
    [HORIZON + 1, 40, [24, 32, 42], 62, [[200, 1], [40, .7], [11, .6], [4, .35]]]];
  for (const [base, amp, color, seed, scales] of layers) {
    ctx.beginPath(); ctx.moveTo(0, HORIZON + 2);
    for (let x = 0; x <= W; x += 3) ctx.lineTo(x, base - amp * (.5 + edge(x, seed, scales)));
    ctx.lineTo(W, HORIZON + 2); ctx.closePath(); ctx.fillStyle = shade(color); ctx.fill();
  }
  glow(ctx, 1320, HORIZON - 6, 10, 8, '255,190,120', .9);
  ctx.fillStyle = '#ffcf8a'; ctx.fillRect(1318, HORIZON - 8, 4, 3);
}

// Everything that stands in the water, drawn through projector `P` (the camera, or its mirror image).
function scenery(ctx, P, rnd, reflected) {
  const map = f => (u, v) => P(f(u, v));
  // pilings under the long wall and the gable, leaning a little, with cross-bracing behind them
  const posts = [];
  for (let u = 0; u <= 1.001; u += .19 + rnd() * .05) posts.push(add(O, mul(A, u * LEN), mul(B, .05)));
  for (let u = .22; u <= 1.001; u += .3 + rnd() * .06) posts.push(add(gableCorner, mul(B, u * WIDTH)));
  for (let i = 1; i < posts.length; i++) {
    const a = posts[i - 1], b = posts[i];
    if (Math.hypot(a[0] - b[0], a[2] - b[2]) > 2.2) continue;
    ctx.strokeStyle = '#1c1a1c'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(...P(add(a, [0, -.1, 0]))); ctx.lineTo(...P([b[0], 0, b[2]])); ctx.moveTo(...P(add(b, [0, -.1, 0]))); ctx.lineTo(...P([a[0], 0, a[2]])); ctx.stroke();
  }
  for (const p of posts) {
    const lean = [(rnd() - .5) * .06, 0, (rnd() - .5) * .06], r = .1 + rnd() * .04, side = mul(A, r);
    const top = p, foot = add([p[0], 0, p[2]], lean);       // the water surface hides the rest
    const body = [P(add(top, mul(side, -1))), P(add(top, side)), P(add(foot, side)), P(add(foot, mul(side, -1)))];
    paint.bark(ctx, body, rnd, { base: [70, 60, 54], dir: 'v', marks: 8, light: 1 });
    // the wet band and weed where the lake level rises and falls
    const wet = [P(add([p[0], .35, p[2]], mul(side, -1))), P(add([p[0], .35, p[2]], side)), P(add([p[0], 0, p[2]], side)), P(add([p[0], 0, p[2]], mul(side, -1)))];
    fill(ctx, wet, vertical(ctx, Math.min(wet[0][1], wet[3][1]), Math.max(wet[0][1], wet[3][1]), [[0, 'rgba(30,48,34,.2)'], [1, 'rgba(14,22,18,.9)']]));
    fill(ctx, [body[1], lerp2(body[0], body[1], .5), lerp2(body[3], body[2], .5), body[2]], 'rgba(6,8,16,.4)');
  }
  // the dock: a plank deck on posts running in from the left
  const deck = [[-7.6, .72, 5.6], [-6.3, .72, 6], [-4.6, .75, 17], [-5.8, .75, 16.8]];
  for (let s = 0; s <= 1.001; s += .14) {
    for (const side of [0, 1]) {
      const p = lerp3(lerp3(deck[0], deck[3], s), lerp3(deck[1], deck[2], s), side);
      fill(ctx, [P(add(p, [-.07, 0, 0])), P(add(p, [.07, 0, 0])), P(add([p[0], 0, p[2]], [.07, 0, 0])), P(add([p[0], 0, p[2]], [-.07, 0, 0]))], '#2e2724');
    }
  }
  const deckMap = (u, v) => P(lerp3(lerp3(deck[0], deck[1], u), lerp3(deck[3], deck[2], u), 1 - v));
  planks(ctx, deckMap, rnd, { along: 'u', width: [.02, .03], base: [96, 86, 76], vary: 26, streaks: 1 });
  const edgeTop = [deck[1], deck[2]].map(P), edgeLow = [add(deck[2], [0, -.12, 0]), add(deck[1], [0, -.12, 0])].map(P);
  fill(ctx, edgeTop.concat(edgeLow), '#241e1c');
  if (!reflected) {
    const coil = project([-6.6, .73, 7.6]);
    ctx.strokeStyle = 'rgba(170,150,110,.9)'; ctx.lineWidth = 2.2;
    for (let r = 0; r < 4; r++) { ctx.beginPath(); ctx.ellipse(coil[0], coil[1], 26 - r * 5, 6 - r, -.1, 0, TAU); ctx.stroke(); }
  }

  // long wall: grey-green clapboard that bows and sags, facing us
  const wallMap = map(wall3), wallOutline = paint.outline(wallMap, 24);
  planks(ctx, wallMap, rnd, { along: 'u', width: [.06, .08], base: [84, 98, 92], vary: 16, streaks: 5 });
  faceShade(ctx, wallOutline, mul(B, -1), .5);
  // floor joists and the skirt board under the wall
  const skirt = [];
  for (let i = 0; i <= 24; i++) skirt.push(P(wall3(i / 24, 1)));
  for (let i = 24; i >= 0; i--) skirt.push(P(add(wall3(i / 24, 1), [0, -.25, 0])));
  fill(ctx, skirt, '#2a2a2c');
  // the eave's shadow along the top of the wall
  ctx.save(); pathOf(ctx, wallOutline); ctx.clip();
  for (let i = 0; i < 7; i++) {
    const band = [];
    for (let k = 0; k <= 24; k++) band.push(P(wall3(k / 24, i * .035)));
    for (let k = 24; k >= 0; k--) band.push(P(wall3(k / 24, i * .035 + .035)));
    fill(ctx, band, `rgba(6,8,18,${.34 - i * .045})`);
  }
  ctx.restore();
  // gable end: same boards, turned toward the moon, with the boat bay cut out of it
  const gableEdge = [];
  for (let i = 0; i <= 24; i++) { const u = i / 24; gableEdge.push(P(add(gableCorner, mul(B, WIDTH * u), mul(UP, gableTop(u) - .14 * Math.sin(Math.PI * u) ** 4)))); }
  const gableOutline = gableEdge.concat([P(add(gableCorner, mul(B, WIDTH), [0, -FLOOR * .65, 0])), P(add(gableCorner, [0, -FLOOR * .65, 0]))]);
  ctx.save(); pathOf(ctx, gableOutline); ctx.clip();
  planks(ctx, map(gable3), rnd, { along: 'u', width: [.035, .05], base: [92, 106, 100], vary: 16, streaks: 6 });
  faceShade(ctx, gableOutline, A, .45);
  for (let i = 0; i < 6; i++) fill(ctx, gableEdge.map(([x, y]) => [x, y + i * 5]).concat(gableEdge.slice().reverse().map(([x, y]) => [x, y + i * 5 + 5])), `rgba(6,8,18,${.12 - i * .016})`);
  ctx.restore();
  // corner and fascia trim in worn pale paint
  ctx.strokeStyle = '#8a8e86'; ctx.lineWidth = 7;
  const c0 = P(add(gableCorner, mul(UP, WALL - .12))), c1 = P(add(gableCorner, [0, -.2, 0]));
  ctx.beginPath(); ctx.moveTo(...c0); ctx.lineTo(...c1); ctx.stroke();
  // boat bay: deep shadow inside, a moored bow, a beam across the top
  const bayO = [gable3(.2, .52), gable3(.8, .52), gable3(.8, 1), gable3(.2, 1)];
  const bayI = bayO.map(p => add(p, mul(A, -.4)));
  fill(ctx, bayO.map(P).map(([x, y], i) => [x + [-6, 6, 6, -6][i], y + [-9, -9, 0, 0][i]]), '#8e9088');
  fill(ctx, bayO.map(P), '#05070c');
  fill(ctx, [bayO[0], bayI[0], bayI[3], bayO[3]].map(P), '#121418');
  fill(ctx, [bayO[0], bayO[1], bayI[1], bayI[0]].map(P), '#0a0b0e');
  const bow = [add(bayI[3], mul(B, .3), [0, .35, 0]), add(bayI[3], mul(B, 1.4), [0, .45, 0]), add(lerp3(bayO[3], bayO[2], .55), mul(A, .3), [0, .3, 0]), add(bayI[3], mul(B, 1.6), [0, .05, 0]), add(bayI[3], mul(B, .3), [0, .05, 0])];
  fill(ctx, bow.map(P), '#3c3430');
  fill(ctx, [bow[0], bow[1], bow[2], add(bow[2], [0, -.06, 0]), add(bow[1], [0, -.06, 0]), add(bow[0], [0, -.06, 0])].map(P), '#8a7a66');
  // lit side window: frame, warm glow, a plant on the sill inside, the sash cross, recessed
  const wO = [wall3(.5, .26), wall3(.64, .26), wall3(.64, .58), wall3(.5, .58)], wI = wO.map(p => add(p, mul(B, .14)));
  fill(ctx, wO.map(P).map(([x, y], i) => [x + [-7, 7, 7, -7][i], y + [-7, -7, 7, 7][i]]), '#a8aaa0');
  const wc = lerp2(P(wI[0]), P(wI[2]), .5), warm = ctx.createRadialGradient(...wc, 4, ...wc, 70);
  warm.addColorStop(0, '#ffdca0'); warm.addColorStop(.6, '#e49a54'); warm.addColorStop(1, '#7a4426');
  fill(ctx, wI.map(P), warm);
  fill(ctx, [wO[0], wI[0], wI[3], wO[3]].map(P), '#56594f');
  fill(ctx, [wO[0], wO[1], wI[1], wI[0]].map(P), '#3a3c36');
  fill(ctx, [lerp3(wI[3], wI[2], .12), lerp3(wI[3], wI[2], .4), add(lerp3(wI[3], wI[2], .32), [0, .38, 0]), add(lerp3(wI[3], wI[2], .18), [0, .42, 0])].map(P), 'rgba(50,60,30,.85)');
  ctx.strokeStyle = '#a8aaa0'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(...P(lerp3(wI[0], wI[1], .5))); ctx.lineTo(...P(lerp3(wI[3], wI[2], .5))); ctx.moveTo(...P(lerp3(wI[0], wI[3], .5))); ctx.lineTo(...P(lerp3(wI[1], wI[2], .5))); ctx.stroke();

  // roof: soffit seen from below, mossy shingles on the sagging slope, lit rake edges, a stovepipe
  const soffit = [];
  for (let i = 0; i <= 24; i++) soffit.push(P(roof3(i / 24, 1)));
  for (let i = 24; i >= 0; i--) soffit.push(P(wall3(i / 24, 0)));
  fill(ctx, soffit, '#161518');
  shingles(ctx, map(roof3), rnd, { rows: 13, cols: 16, base: [46, 44, 48], moss: [52, 64, 44], mossAt: .58, seed: 3 });
  faceShade(ctx, paint.outline(map(roof3), 16), [B[0] * -.6, 1, B[2] * -.6], .35);
  const fascia = [];
  for (let i = 0; i <= 24; i++) fascia.push(P(roof3(i / 24, 1)));
  for (let i = 24; i >= 0; i--) fascia.push(P(add(roof3(i / 24, 1), [0, -.16, 0])));
  fill(ctx, fascia, '#2a2828');
  const rake = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16, across = lerp(-EAVE_OUT, WIDTH + EAVE_OUT, t);
    rake.push(P(add(O, mul(A, LEN + RAKE_OUT), mul(B, across), mul(UP, RIDGE - SLOPE * Math.abs(across - WIDTH / 2) - .1 * Math.sin(Math.PI * t) ** 4))));
  }
  fill(ctx, rake.concat(rake.slice().reverse().map(([x, y]) => [x, y + 14])), '#2a2626');
  ctx.strokeStyle = 'rgba(180,190,210,.5)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); rake.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  const pipe = roof3(.3, .4);
  fill(ctx, [add(pipe, [-.1, -.1, 0]), add(pipe, [.1, -.1, 0]), add(pipe, [.1, .7, 0]), add(pipe, [-.1, .7, 0])].map(P), '#24232a');
  fill(ctx, [add(pipe, [-.16, .7, 0]), add(pipe, [.16, .7, 0]), add(pipe, [.1, .8, 0]), add(pipe, [-.1, .8, 0])].map(P), '#1a191e');

  // lantern on its bracket over the bay
  const l3 = add(gable3(.5, .46), mul(A, .3));
  const lp = P(l3), arm = P(add(gable3(.5, .4), mul(A, .02)));
  ctx.strokeStyle = '#141214'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...arm); ctx.lineTo(lp[0], arm[1]); ctx.lineTo(lp[0], lp[1] - 14); ctx.stroke();
  fill(ctx, [[lp[0] - 9, lp[1] - 12], [lp[0] + 9, lp[1] - 12], [lp[0] + 11, lp[1] + 16], [lp[0] - 11, lp[1] + 16]], '#1a1618');
  fill(ctx, [[lp[0] - 6, lp[1] - 8], [lp[0] + 6, lp[1] - 8], [lp[0] + 8, lp[1] + 12], [lp[0] - 8, lp[1] + 12]], '#ffd48e');

  // rowboat tied off by the bay: a hull lofted from a gunwale curve down to the waterline
  const bc = [3.6, 0, 11.2], bAxis = [.96, 0, .28], bSide = [.28, 0, -.96];
  const gunwale = [], water = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20, s = Math.sin(Math.PI * t) ** .7, along = (t - .5) * 3.4;
    const sheer = .38 + .16 * (2 * t - 1) ** 2;
    gunwale.push(add(bc, mul(bAxis, along), mul(bSide, -.62 * s), [0, sheer, 0]));
    water.push(add(bc, mul(bAxis, along * .94), mul(bSide, -.5 * s), [0, .02, 0]));
  }
  const far = gunwale.map((p, i) => add(p, mul(bSide, 1.24 * Math.sin(Math.PI * i / 20) ** .7)));
  fill(ctx, gunwale.concat(far.slice().reverse()).map(P), '#2a2220');                 // inside of the hull
  for (const t of [.38, .64]) { const a = gunwale[Math.round(t * 20)], b = far[Math.round(t * 20)]; fill(ctx, [a, b, add(b, [0, -.05, 0]), add(a, [0, -.05, 0])].map(P), '#6a5444'); }
  const hull = gunwale.concat(water.slice().reverse()).map(P);
  planks(ctx, (u, v) => P(lerp3(gunwale[Math.round(u * 20)], water[Math.round(u * 20)], v)), rnd, { along: 'u', width: [.3, .36], base: [96, 74, 58], streaks: 2 });
  faceShade(ctx, hull, mul(bSide, -1), .45);
  if (!reflected) {
    ctx.strokeStyle = 'rgba(160,140,100,.9)'; ctx.lineWidth = 1.6;
    const bowTip = P(gunwale[0]), pile = P(add(gableCorner, mul(B, WIDTH), [0, .2, 0]));
    ctx.beginPath(); ctx.moveTo(...bowTip); ctx.quadraticCurveTo((bowTip[0] + pile[0]) / 2, Math.max(bowTip[1], pile[1]) + 30, ...pile); ctx.stroke();
  }
  return { lantern: lp, window: wc };
}

function createScene(createCanvas) {
  const make = createCanvas;
  // above the water: the far scene, mirrored about the shoreline; the near scenery, drawn a second time
  // through the mirrored camera so its reflection shows what the water really sees (the soffit, the
  // underside of the boat), then cooled, darkened and softened
  const far = make(W, H), fc = far.getContext('2d');
  sky(fc, paint.seeded(33071)); shore(fc);
  const near = make(W, H), nc = near.getContext('2d');
  const spots = scenery(nc, project, paint.seeded(33072), false);
  const nearMirror = make(W, H), mc = nearMirror.getContext('2d');
  scenery(mc, mirror, paint.seeded(33072), true);
  const cool = (canvas, top) => {
    const c = canvas.getContext('2d');
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = vertical(c, top, H, [[0, 'rgba(10,20,34,.45)'], [1, 'rgba(6,12,22,.85)']]);
    c.fillRect(0, top, W, H - top);
    const soft = make(W, H), s = soft.getContext('2d');
    s.filter = 'blur(1.6px)'; s.drawImage(canvas, 0, 0);
    return soft;
  };
  const farMirror = make(W, H), fm = farMirror.getContext('2d');
  fm.translate(0, HORIZON * 2); fm.scale(1, -1); fm.drawImage(far, 0, 0, W, HORIZON + 2, 0, 0, W, HORIZON + 2);
  // both reflections merged into one layer, so each frame only slices one image into ripple bands
  const reflection = cool(farMirror, HORIZON);
  reflection.getContext('2d').drawImage(cool(nearMirror, HORIZON), 0, 0);
  const water = make(W, H), wc = water.getContext('2d');
  wc.fillStyle = vertical(wc, HORIZON, H, [[0, '#1c2436'], [.4, '#121a2a'], [1, '#070b14']]);
  wc.fillRect(0, HORIZON, W, H - HORIZON);
  // the water hides everything of the near layer that is below the surface (y < 0 is drawn by the mirror)
  const waterline = make(W, H), wl = waterline.getContext('2d');
  wl.drawImage(near, 0, 0);
  const light = paint.lighting(make, {
    skyline: HORIZON, ambient: [.58, .62, .74],
    lights: [paint.LIGHT.lamp(spots.window[0], spots.window[1] + 60, .55, 300, 260), paint.LIGHT.lamp(spots.lantern[0], spots.lantern[1] + 60, .35, 260, 220),
      paint.LIGHT.glade(MOON[0], HORIZON, .3, 420, 600)],
  });
  const bands = 4;

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(water, 0, 0);
    for (let y = HORIZON; y < H; y += bands) {
      const depth = (y - HORIZON) / (H - HORIZON);
      const off = (Math.sin(TAU * (phase * 2 + y * .021)) * (1 + depth * 8) + Math.sin(TAU * (phase * 3 + y * .047 + .3)) * depth * 4) * 1.3;
      target.drawImage(reflection, 0, y, W, bands, off, y, W, bands);
    }
    for (let i = 0; i < 70; i++) {
      const y = HORIZON + 16 + (i / 70) ** 1.3 * (H - HORIZON - 16), spread = 10 + (y - HORIZON) * .35;
      const x = MOON[0] + Math.sin(TAU * (phase * 2 + i * .37)) * spread * .5, a = (.5 + .5 * Math.sin(TAU * (phase * 3 + i * .61))) * .35;
      target.fillStyle = `rgba(210,220,236,${a})`; target.fillRect(x - spread * .3, y, spread * .6, 1.6);
    }
    target.drawImage(far, 0, 0, W, HORIZON + 2, 0, 0, W, HORIZON + 2);
    target.drawImage(waterline, 0, 0);
    light(target);
    const flicker = 1 + .1 * paint.loopNoise(phase, 5, 9);
    glow(target, ...spots.lantern, 70, 70, '255,190,110', .5 * flicker);
    glow(target, ...spots.window, 120, 100, '255,180,100', .16 * flicker);
    for (let i = 0; i < 22; i++) {
      const y = mirror([0, 0, 15])[1] + 20 + i * 12, x = spots.window[0] + Math.sin(TAU * (phase * 2 + i * .53)) * (8 + i * 1.4);
      const a = (.5 + .5 * Math.sin(TAU * (phase * 4 + i * .29))) * .35 * (1 - i / 22);
      target.fillStyle = `rgba(255,190,110,${a})`; target.fillRect(x - 18, y, 36, 2);
    }
  };
}

module.exports = {
  title: '잔물결 위에 불 켠 보트 창고',
  slug: 'window-of-the-quiet-boathouse',
  sound: 'lake',
  createScene,
};
