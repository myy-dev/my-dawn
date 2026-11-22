'use strict';

// 96 · 눈 내리는 마구간 앞 물통
// A long, low stable seen from its gable corner before dawn. It is built in metres and seen through a
// camera, so its walls converge, its ridge sags with age, the eave droops between rafters and the long wall
// bows. The moon sits behind it, so the gable catches thin light, the long wall stands in shade lit only
// by the lantern, and the stable, the trough and the fence throw long shadows across the snow toward us.
// The top half of the stall door is open onto warm hay; an old plank trough has frozen over but for one
// dark hole where drips land. Snow falls in two depths.
const paint = require('../lib/paint.cjs');
const { W, H, TAU, lerp, edge, glow, wobble, pathOf, planks, shade, camera, lambert, groundShadow } = paint;

const SNOW = [176, 186, 206];
const cam = camera({ x: 0, y: 1.45, z: 0, yaw: .1, pitch: .035, focal: 1180, cx: 960, cy: 545 });
const P = p => { const s = cam.project(p); return [s[0], s[1]]; };
const HORIZON = Math.round(cam.project([0, 1.45, 1e6])[1]);
const TO_MOON = [-.62, .5, .6];                     // from the scene toward the moon: up, left and behind
const MOON_RAY = TO_MOON.map(v => -v);              // the direction its light travels

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
// Darken a face by how little moonlight reaches it: the shade side goes cool and deep.
function faceShade(ctx, points, normal, deepest = .55) {
  fill(ctx, points, `rgba(8,12,28,${(1 - lambert(normal, TO_MOON)) * deepest})`);
}

// ---- the stable, in metres ----
const T = .42, A = [Math.cos(T), 0, Math.sin(T)], B = [-Math.sin(T), 0, Math.cos(T)];
const O = [2.3, 0, 15.5];                     // front corner at ground level
const LEN = 13, WIDTH = 6.4, WALL = 3, RIDGE = 5.3, EAVE_OUT = .5, RAKE_OUT = .35;
const SLOPE = (RIDGE - WALL) / (WIDTH / 2);
// sag is a little lopsided: the far end of an old roof settles more than the end by the gable
const sag = u => Math.sin(Math.PI * u ** 1.25);
// long front wall: u along its length, v from the top down; it bows out a little and its top sags
const wall3 = (u, v) => add(O, mul(A, u * LEN), mul(UP, WALL * (1 - v)), mul(B, -.07 * sag(u) * (1 - v * .6)), mul(UP, -.2 * sag(u) * (1 - v)));
// gable end: u from its far corner to the front corner, v from the ridge height down
const gable3 = (u, v) => add(O, mul(B, WIDTH * (1 - u)), mul(UP, RIDGE * (1 - v)));
const gableTop = u => WALL + SLOPE * (WIDTH / 2 - Math.abs(WIDTH * (1 - u) - WIDTH / 2));
// visible roof slope: u along the ridge, v from the ridge down to the overhanging eave; the ridge sags more
// than the eave, and the plane dips a little between the rafters
const roof3 = (u, v, lift = 0) => {
  const along = -RAKE_OUT + u * (LEN + 2 * RAKE_OUT);
  const across = lerp(WIDTH / 2, -EAVE_OUT, v);
  const height = RIDGE - SLOPE * (WIDTH / 2 - across) - .42 * sag(u) * (1 - v) - .22 * sag(u) * v - .05 * Math.abs(Math.sin(u * Math.PI * 9)) * v + lift;
  return add(O, mul(A, along), mul(B, across), mul(UP, height));
};
const map = (f, ...extra) => (u, v) => P(f(u, v, ...extra));

function sky(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, 0, HORIZON + 40, [[0, '#0b111f'], [.45, '#1c283c'], [.8, '#36435a'], [1, '#56627a']]);
  ctx.fillRect(0, 0, W, HORIZON + 40);
  for (let i = 0; i < 46; i++) glow(ctx, rnd() * W, 60 + rnd() * 400, 200 + rnd() * 380, 16 + rnd() * 40, i % 4 ? '110,124,150' : '150,160,182', .08 + rnd() * .08);
  glow(ctx, 470, 170, 420, 220, '180,190,214', .22);   // the moon, hidden behind thin cloud
}

function hills(ctx) {
  const layers = [[HORIZON - 26, 66, [74, 84, 104], 31], [HORIZON - 2, 52, [92, 102, 122], 32], [HORIZON + 24, 40, [110, 120, 140], 33]];
  for (const [base, amp, color, seed] of layers) {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) ctx.lineTo(x, base - amp * (.5 + edge(x, seed, [[520, 1], [160, .5], [40, .15]])));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = shade(color); ctx.fill();
  }
}

// One tier of boughs: two flanks from the top, a lower edge of drooping, uneven tips.
function tierShape(rnd, cx, top, half, height, ragged) {
  const pts = [[cx + (rnd() - .5) * 3, top]];
  const tips = 3 + Math.floor(rnd() * 4);
  for (let i = 0; i <= tips * 2; i++) {
    const u = i / (tips * 2), x = cx - half + u * half * 2 * (.9 + rnd() * .1);
    const lift = i % 2 ? -.22 * ragged * (.4 + rnd()) : .1 * rnd();
    pts.push([x + (rnd() - .5) * half * .08, top + height * (1 - Math.sin(u * Math.PI) * .12 + lift)]);
  }
  return pts;
}
// A spruce of its own: tiers of drooping boughs, a leaning leader, gaps where branches broke.
function conifer(ctx, rnd, x, base, height, color, snowy) {
  const lean = (rnd() - .5) * .08, tiers = 6 + Math.floor(rnd() * 5), width = height * (.3 + rnd() * .16);
  ctx.strokeStyle = shade(color, -20); ctx.lineWidth = Math.max(1, height / 60);
  ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x + lean * height, base - height); ctx.stroke();
  for (let t = 0; t < tiers; t++) {
    if (rnd() < .08) continue;
    const k = t / tiers, y = base - height * (.12 + k * .86), cx = x + lean * height * (.12 + k * .86);
    const half = width * (1 - k * .82) * (.75 + rnd() * .5), droop = height * (.05 + rnd() * .05);
    const top = y - height / tiers * 1.1;
    fill(ctx, tierShape(rnd, cx, top, half, y + droop - top, 1), shade(color, (rnd() - .5) * 10));
    fill(ctx, tierShape(rnd, cx + half * .35, top + 2, half * .6, y + droop - top, 1), shade(color, -14, .6));
    if (snowy) fill(ctx, tierShape(rnd, cx - half * .1, top + droop * .2, half * .7, (y + droop - top) * .42, .5), shade(SNOW, -50 + (rnd() - .5) * 12, .8));
  }
}

function treeLines(ctx, rnd) {
  for (let i = 0; i < 26; i++) {
    const x = rnd() * 900, h = 40 + rnd() * 70;
    if (rnd() < .3) continue;
    conifer(ctx, rnd, x, HORIZON - 8 + rnd() * 18, h, paint.aerial([60, 76, 82], .62, [150, 160, 178]), false);
  }
  for (const [x, base, h] of [[86, 640, 230], [214, 626, 168], [292, 650, 262], [1910, 610, 210]]) conifer(ctx, rnd, x + (rnd() - .5) * 30, base, h * (.9 + rnd() * .2), [38, 52, 56], true);
}

function ground(ctx, rnd) {
  ctx.fillStyle = vertical(ctx, HORIZON + 20, H, [[0, shade(SNOW, -62)], [.35, shade(SNOW, -50)], [1, shade(SNOW, -88)]]);
  ctx.fillRect(0, HORIZON + 20, W, H);
  for (let i = 0; i < 22; i++) {
    const x = rnd() * W, y = HORIZON + 80 + rnd() ** .8 * 420, w = 140 + rnd() * 380, h = 10 + rnd() * 22;
    glow(ctx, x, y + h * .6, w, h, '90,105,140', .18);
    glow(ctx, x - w * .1, y, w * .8, h * .7, '200,210,228', .12);
  }
}

// Long moon shadows on the snow: everything tall is dropped along the light onto the ground.
function castShadows(ctx, make, shapes) {
  const layer = make(W, H), c = layer.getContext('2d');
  c.fillStyle = 'rgb(28,36,66)';
  for (const pts of shapes) { pathOf(c, pts.map(p => P(groundShadow(p, MOON_RAY)))); c.fill(); }
  ctx.save();
  ctx.filter = 'blur(5px)';
  ctx.globalAlpha = .42;
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}
// The stable's silhouette as the moon sees it, as a ring of points to drop on the ground.
const stableShadowOutline = () => [O, add(O, mul(B, WIDTH)), add(O, mul(B, WIDTH), mul(UP, WALL)), add(O, mul(B, WIDTH / 2), mul(UP, RIDGE)),
  add(O, mul(B, WIDTH / 2), mul(A, LEN), mul(UP, RIDGE)), add(O, mul(A, LEN), mul(UP, WALL)), add(O, mul(A, LEN))];

function stable(ctx, rnd) {
  // gable end: clapboard rising to a slightly sagging peak
  const outlineGable = [];
  for (let i = 0; i <= 24; i++) { const u = i / 24; outlineGable.push(P(add(O, mul(B, WIDTH * (1 - u)), mul(UP, gableTop(u) - .12 * Math.sin(Math.PI * u) ** 4)))); }
  const gableEdge = outlineGable.slice();
  outlineGable.push(P(O), P(add(O, mul(B, WIDTH))));
  ctx.save(); pathOf(ctx, outlineGable); ctx.clip();
  planks(ctx, map(gable3), rnd, { along: 'u', width: [.03, .042], base: [120, 64, 54], vary: 22, streaks: 5 });
  faceShade(ctx, outlineGable, mul(A, -1), .5);
  // the rake overhang shades the top of the gable
  for (let i = 0; i < 6; i++) fill(ctx, gableEdge.map(([x, y]) => [x, y + i * 5]).concat(gableEdge.slice().reverse().map(([x, y]) => [x, y + i * 5 + 5])), `rgba(8,10,20,${.12 - i * .016})`);
  ctx.restore();
  // hay loft door in the gable, set back into the wall, a wisp of hay caught in it
  const loftOuter = [gable3(.42, .36), gable3(.58, .36), gable3(.58, .5), gable3(.42, .5)];
  fill(ctx, loftOuter.map(P), '#24130f');
  planks(ctx, loftOuter.map(p => P(add(p, mul(A, .12)))), rnd, { along: 'v', width: [.22, .3], base: [70, 38, 32], streaks: 1 });
  for (let i = 0; i < 14; i++) {
    const p = P(gable3(.45 + rnd() * .12, .5)); ctx.strokeStyle = shade([170, 140, 84], (rnd() - .5) * 30, .9); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(p[0] + (rnd() - .5) * 14, p[1] + 6 + rnd() * 10); ctx.stroke();
  }

  // long wall: board and batten, bowed and sagging, in the moon's shade
  const wallMap = map(wall3), wallOutline = paint.outline(wallMap, 24);
  planks(ctx, wallMap, rnd, { along: 'v', width: [.022, .034], base: [104, 52, 46], vary: 22, streaks: 4 });
  faceShade(ctx, wallOutline, mul(B, -1), .6);
  // the overhang keeps the top of the wall in deeper shadow
  ctx.save(); pathOf(ctx, wallOutline); ctx.clip();
  for (let i = 0; i < 8; i++) {
    const band = [];
    for (let k = 0; k <= 24; k++) band.push(P(wall3(k / 24, i * .03)));
    for (let k = 24; k >= 0; k--) band.push(P(wall3(k / 24, i * .03 + .03)));
    fill(ctx, band, `rgba(6,8,18,${.32 - i * .035})`);
  }
  ctx.restore();
  // soffit: the underside of the overhang, seen from below
  const soffit = [];
  for (let i = 0; i <= 24; i++) soffit.push(P(roof3(i / 24, 1)));
  for (let i = 24; i >= 0; i--) soffit.push(P(wall3(i / 24, 0)));
  fill(ctx, soffit, '#1a100e');
  for (let i = 1; i < 14; i++) {      // rafter tails along it
    const a = P(roof3(i / 14, 1)), b = P(wall3(i / 14, 0));
    ctx.strokeStyle = '#2c1a16'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  }
  // corner board where the two walls meet, a line of moonlight on its gable side
  const corner = [P(add(O, mul(UP, WALL - .1))), P(O)];
  ctx.strokeStyle = '#5a302a'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(...corner[0]); ctx.lineTo(...corner[1]); ctx.stroke();
  ctx.strokeStyle = 'rgba(170,176,200,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(corner[0][0] - 4, corner[0][1]); ctx.lineTo(corner[1][0] - 4, corner[1][1]); ctx.stroke();
  // stone footing, half buried
  // stone footing laid in two courses on the face of each wall, so the stones follow the perspective
  const footing = (from, dir, length, normal) => {
    for (const [y0, y1] of [[0, .16], [.16, .3]]) {
      for (let s = (rnd() * .2); s < length;) {
        const w = .28 + rnd() * .3, e = Math.min(length, s + w);
        const q = [add(from, mul(dir, s), [0, y1, 0]), add(from, mul(dir, e - .02), [0, y1 - .01 * rnd(), 0]), add(from, mul(dir, e - .02), [0, y0 + .01, 0]), add(from, mul(dir, s), [0, y0 + .01, 0])]
          .map(p => add(p, mul(normal, .03)));
        const pts = q.map(P), k = (rnd() - .5) * 30;
        fill(ctx, wobble(pts, Math.max(.6, Math.abs(pts[1][0] - pts[0][0]) * .04), Math.floor(rnd() * 1e6), 6), shade([92, 94, 100], k));
        fill(ctx, [pts[2], pts[3], lerp2(pts[3], pts[0], .3), lerp2(pts[2], pts[1], .3)], 'rgba(10,10,16,.35)');
        s = e;
      }
    }
  };
  footing(add(O, mul(B, WIDTH)), mul(B, -1), WIDTH, mul(A, -1));
  footing(O, A, LEN, mul(B, -1));

  // openings are recessed: an outer frame on the wall and an inner face set back into it
  const into = mul(B, .18);
  const opening = (u0, u1, v0, v1) => {
    const o3 = [wall3(u0, v0), wall3(u1, v0), wall3(u1, v1), wall3(u0, v1)], i3 = o3.map(p => add(p, into));
    return { outer: o3.map(P), inner: i3.map(P), o3, i3 };
  };
  const jambs = o => {
    // the far jamb and the head are the faces we can see from here
    fill(ctx, [o.outer[0], o.inner[0], o.inner[3], o.outer[3]], '#3a1e18');
    fill(ctx, [o.outer[0], o.outer[1], o.inner[1], o.inner[0]], '#1e0f0c');
  };
  const frame = (o, grow) => fill(ctx, o.outer.map(([x, y], i) => [x + [-grow, grow, grow, -grow][i], y + [-grow, -grow, 0, 0][i]]), '#2a1612');
  // stall door: top leaf swung open onto lamplit hay
  const door = opening(.31, .39, .2, 1);
  frame(door, 8);
  const top = [door.inner[0], door.inner[1], P(lerp3(door.i3[1], door.i3[2], .48)), P(lerp3(door.i3[0], door.i3[3], .48))];
  const centre = lerp2(top[0], top[2], .5);
  const hay = ctx.createRadialGradient(...centre, 3, ...centre, 80);
  hay.addColorStop(0, '#ffd690'); hay.addColorStop(.55, '#d4843e'); hay.addColorStop(1, '#4a2414');
  fill(ctx, top, hay);
  fill(ctx, [top[3], top[2], [top[2][0], top[2][1] - 24], [top[3][0], top[3][1] - 18]], 'rgba(120,68,28,.9)');
  const lower = [P(lerp3(door.o3[0], door.o3[3], .5)), P(lerp3(door.o3[1], door.o3[2], .5)), door.outer[2], door.outer[3]];
  planks(ctx, lower, rnd, { along: 'v', width: [.24, .3], base: [96, 50, 42], streaks: 2 });
  jambs(door);
  ctx.strokeStyle = '#2c1814'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(...lower[0]); ctx.lineTo(...lower[2]); ctx.stroke();
  // the open top leaf hangs out from its hinge, seen nearly edge-on and darker
  const hinge = door.o3[1], hingeLow = lerp3(door.o3[1], door.o3[2], .48), swing = add(mul(B, -.72), mul(A, .22));
  const leaf = [hinge, add(hinge, swing), add(hingeLow, swing), hingeLow].map(P);
  planks(ctx, leaf, rnd, { along: 'v', width: [.3, .36], base: [100, 52, 44], streaks: 1 });
  fill(ctx, leaf, 'rgba(8,8,18,.35)');
  // a second stall door, shut, braced
  const d2 = opening(.62, .71, .22, 1);
  frame(d2, 7);
  planks(ctx, d2.inner, rnd, { along: 'v', width: [.24, .3], base: [84, 44, 38], streaks: 2 });
  jambs(d2);
  ctx.strokeStyle = '#30201b'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(...d2.inner[0]); ctx.lineTo(...d2.inner[2]); ctx.moveTo(...d2.inner[1]); ctx.lineTo(...d2.inner[3]); ctx.stroke();
  // frosted window between them, with a sill that sticks out
  const win = opening(.48, .55, .3, .54);
  frame(win, 6);
  const pane = ctx.createLinearGradient(...win.inner[0], ...win.inner[2]);
  pane.addColorStop(0, '#e2a462'); pane.addColorStop(1, '#7a4226');
  fill(ctx, win.inner, pane);
  fill(ctx, [win.inner[0], lerp2(win.inner[0], win.inner[1], .7), lerp2(win.inner[0], win.inner[3], .6)], 'rgba(210,222,236,.4)');
  jambs(win);
  ctx.strokeStyle = '#2a1612'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(...P(lerp3(win.i3[0], win.i3[1], .5))); ctx.lineTo(...P(lerp3(win.i3[3], win.i3[2], .5))); ctx.stroke();
  const sill = [add(win.o3[3], mul(B, -.1), mul(A, -.06)), add(win.o3[2], mul(B, -.1), mul(A, .06)), add(win.o3[2], mul(A, .06)), add(win.o3[3], mul(A, -.06))];
  fill(ctx, sill.map(P), '#5a3428');
  fill(ctx, [sill[0], sill[1], add(sill[1], [0, -.05, 0]), add(sill[0], [0, -.05, 0])].map(P), '#3a2018');

  // roof: thick snow on the slope, its thickness showing at the eave, icicles below
  const snowTop = map(roof3, .32), snowOutline = paint.outline(snowTop, 24);
  fill(ctx, snowOutline, shade(SNOW, -52));
  ctx.save(); pathOf(ctx, snowOutline); ctx.clip();
  for (let i = 0; i < 40; i++) { const p = snowTop(rnd(), rnd()); glow(ctx, p[0], p[1], 40 + rnd() * 120, 6 + rnd() * 10, '110,124,160', .12); }
  ctx.fillStyle = vertical(ctx, P(roof3(.5, 0))[1], P(roof3(.5, 1))[1], [[0, 'rgba(225,232,246,.12)'], [1, 'rgba(40,50,80,.4)']]);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const lipTop = [], lipBottom = [];
  for (let i = 0; i <= 48; i++) {
    const u = i / 48, droop = .12 + .1 * Math.max(0, edge(u * 700, 91)) + (u > .3 && u < .36 ? .12 : 0);
    lipTop.push(P(roof3(u, 1, .32)));
    lipBottom.push(P(add(roof3(u, 1), mul(UP, -droop), mul(B, -.06))));
  }
  fill(ctx, lipTop.concat(lipBottom.slice().reverse()), shade(SNOW, -60));
  ctx.strokeStyle = 'rgba(190,200,222,.35)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); lipTop.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  // icicles grow where meltwater runs: a few clusters along the eave, mostly short, a few long and thin
  for (let i = 0; i < 46; i++) {
    const cluster = [.08, .21, .33, .47, .74, .9][Math.floor(rnd() * 6)], u = Math.min(1, Math.max(0, cluster + (rnd() - .5) * .07));
    const p = lipBottom[Math.floor(u * 48)], len = 3 + rnd() ** 4 * 60;
    const w = .8 + rnd() * 1.6, g = ctx.createLinearGradient(p[0], p[1], p[0], p[1] + len);
    g.addColorStop(0, 'rgba(200,212,232,.95)'); g.addColorStop(1, 'rgba(180,200,226,.15)');
    fill(ctx, [[p[0] - w, p[1] - 2], [p[0] + w, p[1] - 2], [p[0] + (rnd() - .5) * 2, p[1] + len]], g);
  }
  // gable rakes: barge boards with snow riding on top, thicker toward the eaves
  const rake = (far, seed) => {
    const board = [], snow = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, across = far ? lerp(WIDTH / 2, WIDTH + EAVE_OUT, t) : lerp(WIDTH / 2, -EAVE_OUT, t);
      const h = RIDGE - SLOPE * Math.abs(across - WIDTH / 2);
      const base = add(O, mul(A, -RAKE_OUT), mul(B, across), mul(UP, h));
      board.push(P(base)); snow.push(P(add(base, mul(UP, .3 + .12 * t))));
    }
    fill(ctx, board.concat(board.slice().reverse().map(([x, y]) => [x, y + 12])), '#2a1814');
    fill(ctx, wobble(snow.concat(board.slice().reverse()), 1.5, seed, 8), shade(SNOW, far ? -30 : -44));
  };
  rake(true, 81); rake(false, 82);
  return { lantern: add(wall3(.43, .3), mul(B, -.35)) };
}

// The lantern on its iron bracket beside the stall door. Returns where its flame is on screen.
function lanternFixture(ctx, at3) {
  const anchor = P(add(at3, mul(B, .3), [0, .2, 0])), hook = P(add(at3, [0, .2, 0])), body = P(at3);
  ctx.strokeStyle = '#1b1416'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(...anchor); ctx.lineTo(...hook); ctx.lineTo(body[0], body[1] - 26); ctx.stroke();
  const [x, y] = body;
  fill(ctx, [[x - 10, y - 20], [x + 10, y - 20], [x + 13, y + 15], [x - 13, y + 15]], '#1f1a1a');
  fill(ctx, [[x - 7, y - 16], [x + 7, y - 16], [x + 9, y + 11], [x - 9, y + 11]], '#ffd28a');
  fill(ctx, [[x - 15, y - 24], [x + 15, y - 24], [x + 5, y - 32], [x - 5, y - 32]], '#1f1a1a');
  return body;
}

// ---- the trough, in metres: a plank box on squat legs, turned a little toward the stable ----
const TA = -.22, TX = [Math.cos(TA), 0, Math.sin(TA)], TZ = [-Math.sin(TA), 0, Math.cos(TA)];
const T0 = [-1.9, 0, 6.2], TL_ = 2.6, TW = .8, TH = .62, LEG = .14;
const t3 = (x, y, z) => add(T0, mul(TX, x), mul(UP, y), mul(TZ, z));
function trough(ctx, rnd) {
  const corners = (y, inset = 0) => [t3(inset, y, TW - inset), t3(TL_ - inset, y, TW - inset), t3(TL_ - inset, y, inset), t3(inset, y, inset)];
  const top = corners(TH), bottom = corners(LEG);
  for (const [x, z] of [[.12, .12], [TL_ - .12, .12], [.12, TW - .12], [TL_ - .12, TW - .12]]) {
    fill(ctx, [t3(x - .07, LEG, z), t3(x + .07, LEG, z), t3(x + .07, 0, z), t3(x - .07, 0, z)].map(P), '#2a2220');
  }
  // the two faces we see: the long front and the short end, each shaded by how it faces the moon
  const front = [top[3], top[2], bottom[2], bottom[3]].map(P);
  const end = [top[2], top[1], bottom[1], bottom[2]].map(P);
  planks(ctx, front, rnd, { along: 'u', width: [.3, .36], base: [96, 78, 64], streaks: 7 });
  planks(ctx, end, rnd, { along: 'u', width: [.3, .36], base: [70, 56, 48], streaks: 2 });
  faceShade(ctx, end, TX, .5);
  faceShade(ctx, front, mul(TZ, -1), .4);
  for (const x of [.2, TL_ / 2, TL_ - .2]) {          // iron bands
    const a = P(t3(x, TH + .01, 0)), b = P(t3(x, LEG, 0));
    ctx.strokeStyle = '#26201f'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,80,40,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a[0] + 3, a[1] + 12); ctx.lineTo(b[0] + 3, b[1] - 6); ctx.stroke();
  }
  // rim thickness, the inner wall above the ice, the ice itself set below the rim
  const rimInner = corners(TH, .07).map(P), ice = corners(TH - .06, .07).map(P);
  fill(ctx, top.map(P), '#6e5848');
  fill(ctx, rimInner, '#2a2220');
  const iceFill = ctx.createLinearGradient(...ice[0], ...ice[2]);
  iceFill.addColorStop(0, '#6c7e96'); iceFill.addColorStop(.5, '#8a9ab0'); iceFill.addColorStop(1, '#5c6c84');
  fill(ctx, ice, iceFill);
  const hole = P(t3(TL_ * .42, TH - .06, TW * .5)), holeR = P(t3(TL_ * .42 + .2, TH - .06, TW * .5))[0] - hole[0];
  for (let i = 0; i < 10; i++) {
    const ang = rnd() * TAU, len = holeR * (1.5 + rnd() * 3);
    let x = hole[0] + Math.cos(ang) * holeR, y = hole[1] + Math.sin(ang) * holeR * .3;
    ctx.strokeStyle = 'rgba(220,232,246,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += Math.cos(ang + (rnd() - .5) * .8) * len / 4; y += Math.sin(ang + (rnd() - .5) * .8) * len / 14; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  ctx.fillStyle = '#141c2a'; ctx.beginPath(); ctx.ellipse(hole[0], hole[1], holeR, holeR * .26, -.04, 0, TAU); ctx.fill();
  fill(ctx, wobble([t3(-.05, TH + .04, TW + .02), t3(TL_ + .05, TH + .05, TW + .02), t3(TL_ + .05, TH, TW - .1), t3(-.05, TH, TW - .1)].map(P), 2.5, 91, 10), shade(SNOW, -40));
  fill(ctx, wobble([t3(-.04, TH + .03, .06), t3(TL_ + .04, TH + .03, .06), t3(TL_ + .04, TH - .02, -.02), t3(-.04, TH - .02, -.02)].map(P), 2, 92, 10), shade(SNOW, -26));
  return { hole, holeR };
}
const troughShadow = () => [t3(0, 0, 0), t3(0, TH, 0), t3(TL_, TH, 0), t3(TL_, TH, TW), t3(TL_, 0, TW), t3(0, 0, TW)];

// ---- fence, in metres: posts that lean, rails that sag, snow caps ----
function fencePosts(rnd) {
  const posts = [];
  for (let s = 0; s < 1;) {
    posts.push({ p: add([-7.5, 0, 8.6], mul([8.8, 0, 7.2], s)), h: 1.15 + rnd() * .2, lean: [(rnd() - .5) * .12, 0, (rnd() - .5) * .08], r: .07 + rnd() * .03 });
    s += .1 + rnd() * .04;
  }
  return posts;
}
const postTop = q => add(q.p, mul(UP, q.h), q.lean);
function fence(ctx, rnd, posts) {
  for (const rail of [.35, .78]) {
    for (let i = 1; i < posts.length; i++) {
      if (rnd() < .1) continue;
      const a = posts[i - 1], b = posts[i];
      const pa = lerp3(a.p, postTop(a), rail), pb = lerp3(b.p, postTop(b), rail), mid = add(lerp3(pa, pb, .5), [0, -.06 - rnd() * .06, 0]);
      const sa = P(pa), sb = P(pb), sm = P(mid), w = 900 / cam.project(pa)[2] * .06;
      const ctrl = [sm[0] * 2 - (sa[0] + sb[0]) / 2, sm[1] * 2 - (sa[1] + sb[1]) / 2];
      ctx.lineCap = 'round';
      ctx.strokeStyle = shade([58, 46, 40], (rnd() - .5) * 14); ctx.lineWidth = Math.max(2, w);
      ctx.beginPath(); ctx.moveTo(...sa); ctx.quadraticCurveTo(...ctrl, ...sb); ctx.stroke();
      ctx.strokeStyle = shade(SNOW, -44, .8); ctx.lineWidth = Math.max(1.2, w * .4);
      ctx.beginPath(); ctx.moveTo(sa[0], sa[1] - w * .5); ctx.quadraticCurveTo(ctrl[0], ctrl[1] - w * .5, sb[0], sb[1] - w * .5); ctx.stroke();
    }
  }
  for (const q of posts) {
    const top = postTop(q), side = mul(TX, q.r);
    const body = [P(add(top, mul(side, -1))), P(add(top, side)), P(add(q.p, side)), P(add(q.p, mul(side, -1)))];
    fill(ctx, wobble(body, 1, Math.floor(rnd() * 1e6), 8), shade([64, 50, 42], (rnd() - .5) * 16));
    fill(ctx, [lerp2(body[0], body[1], .55), body[1], body[2], lerp2(body[3], body[2], .55)], 'rgba(8,8,18,.45)');   // round post: dark away from the moon
    const capW = Math.abs(body[1][0] - body[0][0]);
    fill(ctx, wobble([[body[0][0] - capW * .3, body[0][1] + 2], [body[0][0] + capW * .3, body[0][1] - capW * .7], [body[1][0] + capW * .2, body[1][1] - capW * .45], [body[1][0] + capW * .4, body[1][1] + 3]], 1, Math.floor(rnd() * 1e6), 5), shade(SNOW, -36));
  }
}

// Footprints from the stall door to the trough, smaller with distance.
function prints(ctx, rnd) {
  const from = wall3(.35, 1), to = t3(TL_ * .7, 0, -.4);
  for (let i = 0; i < 30; i++) {
    const t = i / 30, side = i % 2 ? .12 : -.12;
    const p = add(lerp3(from, to, t), mul(B, -1.6 * Math.sin(Math.PI * t)), mul(TX, side), [(rnd() - .5) * .05, 0, 0]);
    // a boot print is about 30 cm by 12 cm; its size on screen follows its distance
    const s = cam.project(p), k = cam.focal / s[2];
    ctx.fillStyle = 'rgba(60,72,108,.32)';
    ctx.beginPath(); ctx.ellipse(s[0], s[1], .15 * k, .045 * k, -.05, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(200,210,230,.14)';
    ctx.beginPath(); ctx.ellipse(s[0] + 1, s[1] - .02 * k, .12 * k, .02 * k, -.05, 0, TAU); ctx.fill();
  }
}

// Clumps of dry grass poking through the snow: each its own count, height, lean and colour.
function dryGrass(ctx, rnd) {
  const spots = [[90, 1030, 1.3], [230, 990, 1], [1180, 1050, 1.4], [1320, 980, .9], [1700, 1040, 1.2], [1860, 960, .8], [60, 760, .6], [1580, 860, .7]];
  for (const [x, y, s] of spots) {
    const n = 8 + Math.floor(rnd() * 18), lean = (rnd() - .5) * .6, hue = rnd();
    for (let i = 0; i < n; i++) {
      const bx = x + (rnd() - .5) * 60 * s, h = (24 + rnd() * 70) * s, a = lean + (rnd() - .5) * .7, tip = [bx + Math.sin(a) * h, y - Math.cos(a) * h];
      ctx.strokeStyle = shade(hue < .5 ? [122, 104, 78] : [104, 96, 84], (rnd() - .5) * 30, .85); ctx.lineWidth = (1 + rnd()) * s;
      ctx.beginPath(); ctx.moveTo(bx, y); ctx.quadraticCurveTo(bx + Math.sin(a) * h * .3, y - h * .6, ...tip); ctx.stroke();
    }
    glow(ctx, x, y + 2, 50 * s, 7 * s, '60,70,100', .3);
  }
}

function makeFlakes(rnd) {
  return Array.from({ length: 340 }, () => {
    const near = rnd() < .22;
    return {
      x: rnd() * W, y: rnd(), turns: 1 + Math.floor(rnd() * (near ? 4 : 2)), sway: 6 + rnd() * (near ? 26 : 12),
      wobble: 1 + Math.floor(rnd() * 3), offset: rnd(), r: near ? 2 + rnd() * 2.6 : .7 + rnd() * 1.3, a: near ? .55 + rnd() * .35 : .3 + rnd() * .4,
    };
  });
}

function createScene(createCanvas) {
  const make = createCanvas;
  const rnd = paint.seeded(96021);
  const plate = make(W, H), ctx = plate.getContext('2d');
  sky(ctx, rnd);
  hills(ctx);
  treeLines(ctx, rnd);
  ground(ctx, rnd);
  const posts = fencePosts(rnd);
  castShadows(ctx, make, [stableShadowOutline(), troughShadow(),
    ...posts.map(q => [add(q.p, mul(TX, -q.r)), add(q.p, mul(TX, q.r)), add(postTop(q), mul(TX, q.r)), add(postTop(q), mul(TX, -q.r))])]);
  prints(ctx, rnd);
  fence(ctx, rnd, posts);
  const spots = stable(ctx, rnd);
  const flame = lanternFixture(ctx, spots.lantern);
  // snow banked against the long wall
  const bank = [];
  for (let i = 0; i <= 24; i++) bank.push(P(add(wall3(i / 24, 1), mul(UP, .12 + .1 * Math.max(0, edge(i * 40, 7))), mul(B, -.05))));
  for (let i = 24; i >= 0; i--) bank.push(P(add(wall3(i / 24, 1), mul(B, -.6))));
  fill(ctx, bank, shade(SNOW, -58));
  const t = trough(ctx, rnd);
  dryGrass(ctx, rnd);
  paint.applyTexture(ctx, make, 9601, .42, 0, 0, W, H, true);
  const floor = P(wall3(.43, 1));
  paint.lighting(make, {
    skyline: HORIZON, ambient: [.72, .76, .86],
    lights: [paint.LIGHT.lamp(flame[0], floor[1] + 10, .45, 380, 190), paint.LIGHT.lamp(flame[0], flame[1] + 40, .3, 200, 200)],
  })(ctx);
  const flakes = makeFlakes(rnd);

  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    const flicker = 1 + .12 * paint.loopNoise(phase, 7, 9) + .05 * paint.loopNoise(phase, 8, 22);
    glow(target, flame[0], flame[1], 60, 60, '255,190,110', .55 * flicker);
    glow(target, flame[0], flame[1] + 60, 200, 140, '255,170,90', .12 * flicker);
    const age = (phase * 3) % 1, ring = Math.sin(age * Math.PI) ** 2, r = .2 + age * .8;
    target.strokeStyle = `rgba(190,205,225,${.32 * ring})`; target.lineWidth = 1.4;
    target.beginPath(); target.ellipse(t.hole[0], t.hole[1], t.holeR * r, t.holeR * .26 * r, 0, 0, TAU); target.stroke();
    for (const f of flakes) {
      const y = ((f.y + phase * f.turns) % 1) * (H + 40) - 20;
      const x = f.x + Math.sin(TAU * (phase * f.wobble + f.offset)) * f.sway;
      target.fillStyle = `rgba(236,242,250,${f.a})`;
      target.beginPath(); target.arc(x, y, f.r, 0, TAU); target.fill();
    }
  };
}

module.exports = {
  title: '눈 내리는 마구간 앞 물통',
  slug: 'the-stable-trough-in-falling-snow',
  sound: 'snow',
  createScene,
};
