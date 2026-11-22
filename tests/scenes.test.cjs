'use strict';

// Scene-level checks run against a recording canvas: the loop is seamless (the frame just before the end
// of the loop matches the first), a fresh instance draws the same as one that has been used, and no
// drawing coordinate is thrown far off screen by a point behind the camera.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { createCanvas, frame, build, difference } = require('./mockcanvas.cjs');

const scene = id => require(path.join(__dirname, '..', 'sources', id + '.cjs'));

for (const id of ['09', '17', '19', '23', '61', '82']) {
  test(`scene ${id} loops seamlessly`, () => {
    const paint = scene(id).createScene(createCanvas);
    const d = difference(frame(paint, 0), frame(paint, 1 - 1e-7));
    assert.ok(d < .05, `phase 0 and phase 1- differ by ${d}`);
  });
}

test('scene 35 draws the same on a second instance as on the first', () => {
  const first = frame(scene('35').createScene(createCanvas), .37);
  const second = frame(scene('35').createScene(createCanvas), .37);
  assert.strictEqual(difference(first, second), 0);
});

// Count projections of points at or behind the camera while a scene is built: such points land anywhere
// and turn the polygons that use them into wedges across the frame.
const paint = require('../lib/paint.cjs');
function behindCamera(id) {
  const original = paint.camera;
  let behind = 0;
  paint.camera = options => { const cam = original(options), project = cam.project.bind(cam); cam.project = p => { const s = project(p); if (s[2] <= 0) behind++; return s; }; return cam; };
  try {
    const file = path.join(__dirname, '..', 'sources', id + '.cjs');
    delete require.cache[require.resolve(file)];
    build(require(file));
  } finally { paint.camera = original; }
  return behind;
}
for (const id of ['13', '84', '69', '97']) {
  test(`scene ${id} never projects a point behind the camera`, () => {
    assert.strictEqual(behindCamera(id), 0);
  });
}

for (const id of ['07', '33', '61']) {
  test(`scene ${id} draws no non-finite coordinates`, () => {
    const log = [...build(scene(id)), ...frame(scene(id).createScene(createCanvas), .3)];
    const bad = log.filter(([, a]) => a.some(v => !Number.isFinite(v)));
    assert.strictEqual(bad.length, 0, `${bad.length} calls with NaN/Infinity, e.g. ${bad[0] && bad[0][0]}`);
  });
}
