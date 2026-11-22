'use strict';

// A recording canvas for tests: every drawing call and style assignment is logged with its numeric
// arguments, so two frames can be compared without a browser. Gradients and patterns are tokens.
let LOG = null;
let token = 0;
// numbers inside a value; hex colours like '#3e400a' are read as their three channels, not as '3e400'
const hex = v => v.replace(/#([0-9a-f]{6})\b/gi, (_, h) => [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(','));
const numbers = v => (typeof v === 'number' ? [v] : typeof v === 'string' ? (hex(v).match(/-?\d*\.?\d+(e-?\d+)?/g) || []).map(Number) : []);
function record(name, args) { if (LOG) LOG.push([name, args.flatMap(a => (Array.isArray(a) ? a.flatMap(numbers) : numbers(a)))]); }
function handle(kind) { const o = { __token: kind + token++ }; o.addColorStop = (...a) => record('stop', a); return o; }

function context(canvas) {
  const state = {};
  const target = {
    canvas,
    createLinearGradient: (...a) => { record('linear', a); return handle('g'); },
    createRadialGradient: (...a) => { record('radial', a); return handle('g'); },
    createPattern: () => { record('pattern', []); return handle('p'); },
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(0, w * h * 4)) }),
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    measureText: t => ({ width: String(t).length * 8 }),
    getLineDash: () => [],
  };
  return new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k];
      if (k in state) return state[k];
      if (typeof k === 'symbol') return undefined;
      return (...a) => record(k, a.map(x => (x && x.__canvas !== undefined ? 'canvas' : x)));
    },
    set(t, k, v) { state[k] = v; record('=' + String(k), [v && v.__token ? '' : v]); return true; },
  });
}

let canvases = 0;
function createCanvas(w, h) {
  const c = { width: w, height: h, __canvas: canvases++ };
  let ctx;
  c.getContext = () => ctx || (ctx = context(c));
  return c;
}

// Draw one frame of a scene painter and return the log of calls.
function frame(painter, phase) {
  LOG = []; token = 1e6;
  painter(createCanvas(1920, 1080).getContext('2d'), phase);
  const out = LOG; LOG = null;
  return out;
}

// The largest numeric difference between two logs (Infinity if they differ in shape).
function difference(a, b) {
  if (a.length !== b.length) return Infinity;
  let worst = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i][0] !== b[i][0] || a[i][1].length !== b[i][1].length) return Infinity;
    let x = a[i][1], y = b[i][1];
    // rotations are compared on the circle: a whole turn is no change
    const turn = 2 * Math.PI, gap = (u, v) => (a[i][0] === 'rotate' ? Math.min(Math.abs(u - v) % turn, turn - Math.abs(u - v) % turn) : Math.abs(u - v));
    for (let j = 0; j < x.length; j++) worst = Math.max(worst, gap(x[j], y[j]));
  }
  return worst;
}

// Build a scene and return the log of everything drawn while building it (its static layers).
function build(sceneModule) {
  LOG = []; token = 0;
  sceneModule.createScene(createCanvas);
  const out = LOG; LOG = null;
  return out;
}

module.exports = { createCanvas, frame, build, difference };
