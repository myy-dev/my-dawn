'use strict';

// Shared painting helpers for the scene families. Everything here is deterministic (hash-based, no
// Math.random) and never consumes a scene's own random() sequence, so adopting a helper does not move
// anything else in the scene.

const W = 1920;
const H = 1080;
const TAU = Math.PI * 2;

const smoothstep = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

// Integer lattice hash in [0, 1).
function hash(x, y, seed = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Smooth value noise in [0, 1). With `period`, the lattice wraps so the result tiles.
function noise(x, y, seed = 0, period = 0) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smoothstep(x - ix), fy = smoothstep(y - iy);
  const wrap = v => (period ? ((v % period) + period) % period : v);
  const a = hash(wrap(ix), wrap(iy), seed), b = hash(wrap(ix + 1), wrap(iy), seed);
  const c = hash(wrap(ix), wrap(iy + 1), seed), d = hash(wrap(ix + 1), wrap(iy + 1), seed);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}

// Multi-scale edge profile in roughly [-0.5, 0.5]: broad swells with smaller bumps on top, the way real
// ridgelines, shores and treelines look. Wavelengths are in pixels.
const EDGE_SCALES = [[260, 1], [70, .48], [19, .22], [5, .08]];
const EDGE_NORM = EDGE_SCALES.reduce((sum, [, amp]) => sum + amp, 0);
function edge(x, seed = 0, scales = EDGE_SCALES) {
  let total = 0;
  scales.forEach(([wavelength, amp], k) => { total += amp * (noise(x / wavelength, k * 7.3, seed + k * 101) - .5); });
  return total / EDGE_NORM * 2;
}

// Seamless noise over a loop: sample on a circle so phase 0 and 1 meet exactly. Returns roughly [-0.5, 0.5].
function loopNoise(phase, seed = 0, radius = 1.6) {
  const a = phase * TAU;
  return noise(Math.cos(a) * radius + 50 + seed * 3.17, Math.sin(a) * radius + 50 + seed * 1.91, seed) - .5;
}

const toRgb = rgb => (Array.isArray(rgb) ? rgb.join(',') : rgb);

// Soft light: a Gaussian-like falloff instead of the cone that two-stop radial gradients give.
const GLOW_STOPS = [[0, 1], [.12, .86], [.26, .6], [.42, .34], [.6, .15], [.78, .05], [1, 0]];
function glow(ctx, x, y, rx, ry, rgb, alpha) {
  if (!(rx > 0 && ry > 0) || !(alpha > 0)) return;
  const color = toRgb(rgb);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const fill = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  for (const [at, k] of GLOW_STOPS) fill.addColorStop(at, 'rgba(' + color + ',' + alpha * k + ')');
  ctx.fillStyle = fill;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

// Blend a colour toward the haze colour with distance (0 = near, 1 = at the horizon).
function aerial(rgb, amount, haze) {
  const t = Math.max(0, Math.min(1, amount));
  return rgb.map((v, i) => Math.round(lerp(v, haze[i], t)));
}

// Material texture: a 512 px tile, grey-centred, mostly fine grain with faint mottling. Applied with
// overlay at native resolution: on dark colours overlay scales brightness up and down evenly, so unlike
// soft-light it adds surface variation without lifting the shadows into a grey film.
const TILE = 512;
const tiles = new Map();
function makeCanvas(createCanvas, w, h) {
  if (createCanvas) return createCanvas(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function textureTile(createCanvas, seed = 0) {
  const key = seed | 0;
  if (tiles.has(key)) return tiles.get(key);
  const tile = makeCanvas(createCanvas, TILE, TILE);
  const ctx = tile.getContext('2d');
  const image = ctx.createImageData(TILE, TILE);
  const data = image.data;
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const blotch = noise(x / 64, y / 64, key + 11, TILE / 64) - .5;
      const mottle = noise(x / 16, y / 16, key + 23, TILE / 16) - .5;
      const fine = hash(x, y, key + 37) - .5;
      const v = 128 + blotch * 12 + mottle * 16 + fine * 44;
      const i = (y * TILE + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, Math.round(v)));
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  tiles.set(key, tile);
  return tile;
}

// True when every sampled pixel in the region is fully opaque.
function isOpaque(ctx, x, y, w, h) {
  const left = Math.max(0, Math.floor(x)), top = Math.max(0, Math.floor(y));
  const right = Math.min(ctx.canvas.width, Math.ceil(x + w)), bottom = Math.min(ctx.canvas.height, Math.ceil(y + h));
  if (right <= left || bottom <= top) return true;
  const data = ctx.getImageData(left, top, right - left, bottom - top).data;
  const step = Math.max(4, Math.floor(data.length / 4 / 4096)) * 4;
  for (let i = 3; i < data.length; i += step) if (data[i] < 255) return false;
  return true;
}

// Overlay the texture onto a layer. On an opaque layer it is a single fill. On a layer with transparent
// pixels (an overlay sheet drawn later), overlay would paint the grey texture into the empty areas, so
// the result is masked back to the layer's own alpha. Pass opaque=true for per-frame calls on the screen.
function applyTexture(ctx, createCanvas, seed, strength = .5, x = 0, y = 0, w = W, h = H, opaque) {
  if (!(strength > 0) || w <= 0 || h <= 0) return;
  const tile = textureTile(createCanvas, seed);
  if (opaque ?? isOpaque(ctx, x, y, w, h)) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = Math.min(1, strength);
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    return;
  }
  const sheet = makeCanvas(createCanvas, ctx.canvas.width, ctx.canvas.height);
  const s = sheet.getContext('2d');
  s.drawImage(ctx.canvas, 0, 0);
  s.globalCompositeOperation = 'overlay';
  s.globalAlpha = Math.min(1, strength);
  s.fillStyle = s.createPattern(tile, 'repeat');
  s.fillRect(x, y, w, h);
  s.globalCompositeOperation = 'destination-in';
  s.globalAlpha = 1;
  s.drawImage(ctx.canvas, 0, 0);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalCompositeOperation = 'copy';
  ctx.drawImage(sheet, 0, 0);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------
// Lighting: a light map that darkens whatever no light reaches and brightens what a light falls on.
// The scene's own colours act as surface colour; the map multiplies them (factor < 1) and colour-dodges
// them (factor > 1, since dodge by d scales by 1 / (1 - d)). Both maps are built once at low resolution.
//
// setup = { ambient: [r, g, b] factors, lights: [light], keep: [[x, y, w, h]] }
// light = { x, y, rx, ry, power, color: [r, g, b] factors, down: px (soft cut-off above the source, for
//           shaded lamps), up: px (cut-off below, for light that only climbs a wall) }
// keep  = emissive areas (window glass, bulbs) that must never be darkened.
const MAP_SCALE = 4;
function lightFactor(setup, x, y, out) {
  let r = setup.ambient[0], g = setup.ambient[1], b = setup.ambient[2];
  for (const L of setup.lights) {
    const dx = (x - L.x) / L.rx, dy = (y - L.y) / L.ry;
    let k = L.power / (1 + (dx * dx + dy * dy) * 6);
    if (L.down !== undefined && y < L.y) k *= smoothstep(Math.max(0, 1 - (L.y - y) / L.down));
    if (L.up !== undefined && y > L.y) k *= smoothstep(Math.max(0, 1 - (y - L.y) / L.up));
    r += k * L.color[0]; g += k * L.color[1]; b += k * L.color[2];
  }
  for (const [kx, ky, kw, kh] of setup.keep || []) {
    if (x >= kx && x <= kx + kw && y >= ky && y <= ky + kh) { r = Math.max(r, 1); g = Math.max(g, 1); b = Math.max(b, 1); }
  }
  out[0] = r; out[1] = g; out[2] = b;
}

function lightMaps(createCanvas, setup) {
  const w = W / MAP_SCALE, h = H / MAP_SCALE;
  const mul = makeCanvas(createCanvas, w, h), dodge = makeCanvas(createCanvas, w, h);
  const mc = mul.getContext('2d'), dc = dodge.getContext('2d');
  const mi = mc.createImageData(w, h), di = dc.createImageData(w, h);
  const f = [0, 0, 0];
  let lifts = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      lightFactor(setup, (x + .5) * MAP_SCALE, (y + .5) * MAP_SCALE, f);
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const v = f[c];
        mi.data[i + c] = Math.round(Math.min(1, Math.max(0, v)) * 255);
        const d = v > 1 ? 1 - 1 / Math.min(v, 4) : 0;
        di.data[i + c] = Math.round(d * 255);
        if (d > 0) lifts = true;
      }
      mi.data[i + 3] = di.data[i + 3] = 255;
    }
  }
  mc.putImageData(mi, 0, 0);
  dc.putImageData(di, 0, 0);
  return { mul, dodge: lifts ? dodge : null };
}

// Returns apply(ctx): draw the light maps over the current frame in the context's current transform,
// so a scene with a camera can light in its own (plate) coordinates. `strength` (0..1) fades the pass,
// e.g. for a flickering lamp.
function lighting(createCanvas, setup) {
  const { mul, dodge } = lightMaps(createCanvas, setup);
  return (ctx, strength = 1) => {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = strength;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(mul, 0, 0, W, H);
    if (dodge) {
      ctx.globalCompositeOperation = 'color-dodge';
      ctx.drawImage(dodge, 0, 0, W, H);
    }
    ctx.restore();
  };
}

// ---------------------------------------------------------------------------------------------------
// Finishing pass shared by every scene: lens softness, bloom from the bright parts, a lifted cool film
// base, moving film grain and a vignette. Built for real-time use: the only per-pixel work is the bloom
// threshold at 1/8 resolution; everything else is GPU compositing.
const GRAIN = 256, GRAIN_FRAMES = 6;
let grainFrames = null;
function grainTiles(createCanvas) {
  if (grainFrames) return grainFrames;
  grainFrames = Array.from({ length: GRAIN_FRAMES }, (_, f) => {
    const tile = makeCanvas(createCanvas, GRAIN, GRAIN);
    const c = tile.getContext('2d');
    const img = c.createImageData(GRAIN, GRAIN);
    for (let i = 0; i < GRAIN * GRAIN; i++) {
      const x = i % GRAIN, y = (i / GRAIN) | 0;
      // two hashes summed: a softer, film-like distribution than flat white noise
      const v = 128 + (hash(x, y, 900 + f) + hash(x, y, 950 + f) - 1) * 70;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    return tile;
  });
  return grainFrames;
}

function finisher(createCanvas, options = {}) {
  const amount = options.amount ?? 1;
  if (!(amount > 0)) return () => {};
  const cycle = options.cycleSeconds || 24;
  const half = makeCanvas(createCanvas, W / 2, H / 2), hc = half.getContext('2d');
  const small = makeCanvas(createCanvas, W / 8, H / 8), sc = small.getContext('2d', { willReadFrequently: true });
  const blooms = [[2, .55], [6, .6], [16, .7]].map(([r, a]) => {
    const c = makeCanvas(createCanvas, W / 8, H / 8);
    return { c, x: c.getContext('2d'), r, a };
  });
  const edges = makeCanvas(createCanvas, W / 2, H / 2), ec = edges.getContext('2d');
  const edgeMask = ec.createRadialGradient(W / 4, H / 4, H * .2, W / 4, H / 4, W * .31);
  edgeMask.addColorStop(0, 'rgba(0,0,0,0)');
  edgeMask.addColorStop(1, 'rgba(0,0,0,.85)');
  const tiles = grainTiles(createCanvas);
  let vignette = null;

  return (ctx, input) => {
    const phase = input - Math.floor(input);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // 1. lens softness: a slightly blurred copy overall, more of it toward the frame edges
    hc.filter = 'blur(1.2px)';
    hc.drawImage(ctx.canvas, 0, 0, W / 2, H / 2);
    hc.filter = 'none';
    ctx.globalAlpha = .3 * amount;
    ctx.drawImage(half, 0, 0, W, H);
    ec.globalCompositeOperation = 'copy';
    ec.filter = 'blur(3px)';
    ec.drawImage(half, 0, 0);
    ec.filter = 'none';
    ec.globalCompositeOperation = 'destination-in';
    ec.fillStyle = edgeMask;
    ec.fillRect(0, 0, W / 2, H / 2);
    ctx.globalAlpha = amount;
    ctx.drawImage(edges, 0, 0, W, H);

    // 2. bloom: threshold the frame at 1/8 resolution, blur at three radii, add back warm
    sc.drawImage(ctx.canvas, 0, 0, W / 8, H / 8);
    const img = sc.getImageData(0, 0, W / 8, H / 8), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const L = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255;
      const k = Math.max(0, (L - .34) / .66), k2 = k * Math.sqrt(k);
      d[i] *= k2 * 1.12; d[i + 1] *= k2; d[i + 2] *= k2 * .86;
    }
    sc.putImageData(img, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    for (const b of blooms) {
      b.x.globalCompositeOperation = 'copy';
      b.x.filter = 'blur(' + b.r + 'px)';
      b.x.drawImage(small, 0, 0);
      b.x.filter = 'none';
      ctx.globalAlpha = b.a * amount;
      ctx.drawImage(b.c, 0, 0, W, H);
    }

    // 3. film base: lift the blacks a little toward a cool tone so shadows read as air, not ink
    ctx.globalCompositeOperation = 'lighten';
    ctx.globalAlpha = amount;
    ctx.fillStyle = 'rgb(9,12,19)';
    ctx.fillRect(0, 0, W, H);

    // 4. grain: one of a few tiles per film frame (12 fps), offset by a hash so it never repeats visibly
    const frame = Math.floor(phase * cycle * 12);
    const tile = tiles[frame % GRAIN_FRAMES];
    const ox = Math.floor(hash(frame, 1, 77) * GRAIN), oy = Math.floor(hash(frame, 2, 77) * GRAIN);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = .26 * amount;
    ctx.translate(-ox, -oy);
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(ox, oy, W, H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 5. vignette
    if (!vignette) {
      vignette = ctx.createRadialGradient(W / 2, H / 2, H * .38, W / 2, H / 2, W * .64);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(.6, 'rgba(0,0,0,.12)');
      vignette.addColorStop(1, 'rgba(0,0,0,.42)');
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = amount;
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };
}

// Wrap a scene factory so every frame goes through the finishing pass.
function finished(createScene, options) {
  return createCanvas => {
    const make = createCanvas || ((w, h) => makeCanvas(null, w, h));
    const painter = createScene(make);
    const finish = finisher(make, options);
    return (ctx, phase) => {
      painter(ctx, phase);
      finish(ctx, phase);
    };
  };
}

module.exports = {
  W, H, TAU, hash, noise, edge, loopNoise, glow, aerial, textureTile, applyTexture, smoothstep, lerp,
  lighting, finisher, finished,
};
