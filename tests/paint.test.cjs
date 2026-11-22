'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const paint = require('../lib/paint.cjs');

const square = [[0, 0], [100, 0], [100, 60], [0, 60]];

// Distance from a point to the segment a-b.
function toSegment([x, y], [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}
const toOutline = (p, pts) => Math.min(...pts.map((a, i) => toSegment(p, a, pts[(i + 1) % pts.length])));

test('seeded gives the same sequence for the same seed', () => {
  const a = paint.seeded(7), b = paint.seeded(7);
  const first = Array.from({ length: 5 }, a), second = Array.from({ length: 5 }, b);
  assert.deepStrictEqual(first, second);
  first.forEach(v => assert.ok(v >= 0 && v < 1));
});

test('seeded differs between seeds', () => {
  assert.notStrictEqual(paint.seeded(7)(), paint.seeded(8)());
});

test('wobble with zero amplitude keeps every point on the outline', () => {
  for (const p of paint.wobble(square, 0, 1)) assert.ok(toOutline(p, square) < 1e-9);
});

test('wobble subdivides each edge by step and stays within the amplitude', () => {
  const out = paint.wobble(square, 4, 1, 10);
  assert.strictEqual(out.length, 10 + 6 + 10 + 6);
  // edge() is bounded by 1, so no point moves further than the amplitude
  for (const p of out) assert.ok(toOutline(p, square) <= 4 + 1e-9);
});

test('wobble is deterministic per seed', () => {
  assert.deepStrictEqual(paint.wobble(square, 4, 3), paint.wobble(square, 4, 3));
  assert.notDeepStrictEqual(paint.wobble(square, 4, 3), paint.wobble(square, 4, 4));
});

test('paint.cjs never uses Math.random', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'lib', 'paint.cjs'), 'utf8');
  assert.ok(!source.includes('Math.random'));
});

test('drawing tools are exported', () => {
  for (const name of ['pathOf', 'strokesIn', 'planks', 'stones', 'shingles', 'bark']) {
    assert.strictEqual(typeof paint[name], 'function', name);
  }
});

// ---- 3D tools ----
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test('camera puts a point straight ahead at eye height on the horizon centre', () => {
  const cam = paint.camera({ x: 0, y: 1.6, z: 0, focal: 1200, cx: 960, cy: 540 });
  const [sx, sy] = cam.project([0, 1.6, 10]);
  assert.ok(near(sx, 960) && near(sy, 540));
});

test('camera: farther points of the same height sit closer to the horizon', () => {
  const cam = paint.camera({ x: 0, y: 1.6, z: 0, focal: 1200, cx: 960, cy: 540 });
  const a = cam.project([2, 0, 5]), b = cam.project([2, 0, 20]);
  assert.ok(a[1] > b[1] && b[1] > 540);
  assert.ok(a[0] > b[0] && b[0] > 960);
});

test('camera yaw turns the view: a point to the right comes to the centre', () => {
  const cam = paint.camera({ x: 0, y: 1.6, z: 0, yaw: Math.atan2(5, 10), focal: 1200, cx: 960, cy: 540 });
  const [sx] = cam.project([5, 1.6, 10]);
  assert.ok(near(sx, 960, 1e-6));
});

test('surface maps (u, v) through its corners and adds the deformation', () => {
  const cam = paint.camera({ x: 0, y: 0, z: 0, focal: 1000, cx: 0, cy: 0 });
  const flat = paint.surface(cam, [[-1, 1, 10], [1, 1, 10], [1, -1, 10], [-1, -1, 10]]);
  assert.deepStrictEqual(flat(.5, .5).map(v => Math.round(v * 1e6) / 1e6), [0, 0]);
  const sag = paint.surface(cam, [[-1, 1, 10], [1, 1, 10], [1, -1, 10], [-1, -1, 10]], (u, v) => [0, -1, 0]);
  assert.ok(near(sag(.5, .5)[1], 100));
});

test('lambert is 1 facing the light, 0 facing away', () => {
  assert.ok(near(paint.lambert([0, 0, -1], [0, 0, -1]), 1));
  assert.strictEqual(paint.lambert([0, 0, 1], [0, 0, -1]), 0);
});

test('groundShadow drops a point along the light onto the ground', () => {
  // light coming down at 45 degrees toward +x: a point 2 m up lands 2 m further along x
  const p = paint.groundShadow([1, 2, 5], [1, -1, 0]);
  assert.ok(near(p[0], 3) && near(p[1], 0) && near(p[2], 5));
});

test('outline walks the border of a mapped surface', () => {
  const pts = paint.outline((u, v) => [u * 10, v * 20], 4);
  assert.strictEqual(pts.length, 16);
  assert.deepStrictEqual(pts[0], [0, 0]);
});

// A context that accepts every drawing call and does nothing: enough to run the surface tools end to end.
function stubContext() {
  const gradient = { addColorStop() {} };
  return new Proxy({}, {
    get: (_, key) => (key === 'createLinearGradient' || key === 'createRadialGradient' ? () => gradient : () => {}),
    set: () => true,
  });
}

test('planks and shingles run on a flat quad and on a mapped surface', () => {
  const quad = [[0, 0], [100, 0], [100, 60], [0, 60]];
  const mapped = (u, v) => [u * 100, v * 60 + Math.sin(u * 3) * 4];
  for (const target of [quad, mapped]) {
    assert.doesNotThrow(() => paint.planks(stubContext(), target, paint.seeded(1)));
    assert.doesNotThrow(() => paint.shingles(stubContext(), target, paint.seeded(1)));
    assert.doesNotThrow(() => paint.masonry(stubContext(), target, paint.seeded(1)));
  }
});

// ---- scene plumbing ----
test('v3 adds, scales, interpolates and normalises', () => {
  const { v3 } = paint;
  assert.deepStrictEqual(v3.add([1, 2, 3], [1, 1, 1], [0, 0, 1]), [2, 3, 5]);
  assert.deepStrictEqual(v3.mul([1, 2, 3], 2), [2, 4, 6]);
  assert.deepStrictEqual(v3.lerp([0, 0, 0], [2, 4, 6], .5), [1, 2, 3]);
  assert.ok(near(Math.hypot(...v3.unit([3, 4, 0])), 1));
});

test('falling particles return to where they started after one loop', () => {
  const rain = paint.particles(paint.seeded(4), 50, { kind: 'snow' });
  for (const p of rain.items) {
    const a = rain.at(p, 0), b = rain.at(p, 1);
    assert.ok(near(a[0], b[0], 1e-6) && near(a[1], b[1], 1e-6));
  }
});

test('particles move between phases', () => {
  const snow = paint.particles(paint.seeded(5), 20, { kind: 'rain' });
  const p = snow.items[0];
  assert.notDeepStrictEqual(snow.at(p, .1), snow.at(p, .2));
});

test('mirrorOf reflects a point through the water plane', () => {
  const cam = paint.camera({ x: 0, y: 2, z: 0, focal: 1000, cx: 0, cy: 0 });
  const m = paint.mirrorOf(cam, 0);
  assert.deepStrictEqual(m([1, 3, 10]).map(v => Math.round(v * 1e6) / 1e6), cam.project([1, -3, 10]).slice(0, 2).map(v => Math.round(v * 1e6) / 1e6));
});

test('ripple draws every band of the water', () => {
  let calls = 0;
  const ctx = { drawImage: () => { calls++; } };
  paint.ripple(ctx, {}, 680, .3, { bands: 4 });
  assert.strictEqual(calls, Math.ceil((1080 - 680) / 4));
});

test('box draws only the faces turned toward the camera', () => {
  const cam = paint.camera({ x: 0, y: 1.6, z: 0, focal: 1000, cx: 960, cy: 540 });
  const drawn = paint.box(stubContext(), cam, { at: [0, 0, 5], sa: .5, sb: .5, h: 1 }, () => '#000');
  assert.ok(drawn.front && drawn.top);
  assert.ok(!drawn.back && !drawn.bottom);
});

test('terrain paints rows far to near and passes each cell its normal', () => {
  const cam = paint.camera({ x: 0, y: 5, z: 0, pitch: .2, focal: 1000, cx: 960, cy: 540 });
  const seen = [];
  paint.terrain(stubContext(), cam, (x, z) => Math.sin(x) * .5, { x0: -10, x1: 10, z0: 2, z1: 40, cols: 8, rows: 6 }, (p, n) => { seen.push([p, n]); return '#000'; });
  assert.strictEqual(seen.length, 48);
  assert.ok(seen[0][0][2] > seen[seen.length - 1][0][2]);            // first cell is the farthest
  assert.ok(seen.every(([, n]) => n[1] > 0 && Math.abs(Math.hypot(...n) - 1) < 1e-9));
});

test('finisher knows its looks and rejects an unknown one', () => {
  assert.deepStrictEqual(paint.LOOKS.map(l => l.id), ['film', 'paint', 'clean', 'citypop']);
  assert.throws(() => paint.lookOf('glossy'), /unknown look/);
  assert.strictEqual(paint.lookOf(() => 'paint').id, 'paint');
  assert.strictEqual(paint.lookOf(undefined).id, 'film');
});

test('citypop look is grain-free and scales down the baked paper texture while a scene is built', () => {
  const cp = paint.lookOf('citypop');
  assert.strictEqual(cp.grain, 0);
  assert.ok(cp.texture < .3 && cp.saturate > 1);
  let seen = null;
  const factory = paint.finished(() => { seen = paint.textureScale(); return () => {}; }, { look: 'citypop' });
  try { factory((w, h) => ({ width: w, height: h, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }) }) })); } catch (e) { /* the stub canvas cannot run the finisher; only creation matters */ }
  assert.strictEqual(seen, cp.texture);
  assert.strictEqual(paint.textureScale(), 1);
});


