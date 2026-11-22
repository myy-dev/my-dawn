'use strict';

// Shared painting helpers for the scene families. Everything here is deterministic (hash-based, never the
// platform random generator) and never consumes a scene's own random() sequence, so adopting a helper does not move
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
// While a scene is being built under a look, the baked paper texture is scaled by that look.
let TEXTURE_SCALE = 1;
const textureScale = () => TEXTURE_SCALE;
function applyTexture(ctx, createCanvas, seed, strength = .5, x = 0, y = 0, w = W, h = H, opaque) {
  strength *= TEXTURE_SCALE;
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
// setup = { ambient: [r, g, b] factors, lights: [light], keep: [[x, y, w, h]], skyline: y (outdoors: no
//           darkening above it, full ambient skyFade px below it) }
// light = { x, y, rx, ry, power, color: [r, g, b] factors, down: px (soft cut-off above the source, for
//           shaded lamps), up: px (cut-off below, for light that only climbs a wall) }
// keep  = emissive areas (window glass, bulbs) that must never be darkened.
const MAP_SCALE = 4;
function lightFactor(setup, x, y, out) {
  let r = setup.ambient[0], g = setup.ambient[1], b = setup.ambient[2];
  if (setup.skyline !== undefined) {
    // Outdoors the sky is the light: keep it, and let the darkening set in below the horizon.
    const t = smoothstep(Math.min(1, Math.max(0, (y - setup.skyline) / (setup.skyFade || 260))));
    r = lerp(1, r, t); g = lerp(1, g, t); b = lerp(1, b, t);
  }
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
// Drawing tools. These paint surfaces and outlines; they never decide what an object looks like. Each scene
// designs its own shapes and uses these to give them material, so no two scenes share a stamped object.

// ---- 3D placement: build objects in metres, see them through a camera with real perspective ----

// A pinhole camera. yaw turns right (toward +x), pitch tilts down. project(p) -> [sx, sy, depth].
function camera({ x = 0, y = 1.6, z = 0, yaw = 0, pitch = 0, focal = 1200, cx = W / 2, cy = H / 2 } = {}) {
  const cy_ = Math.cos(yaw), sy_ = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  return {
    focal, cx, cy, pos: [x, y, z],
    project([px, py, pz]) {
      const dx = px - x, dy = py - y, dz = pz - z;
      const rx = dx * cy_ - dz * sy_, rz = dx * sy_ + dz * cy_;
      const ry = dy * cp + rz * sp, depth = -dy * sp + rz * cp;
      return [cx + focal * rx / depth, cy - focal * ry / depth, depth];
    },
  };
}

// A surface through four 3D corners (top-left, top-right, bottom-right, bottom-left), optionally bent by
// deform(u, v) -> [dx, dy, dz] in metres. Returns map(u, v) -> screen [x, y].
function surface(cam, corners, deform) {
  const [a, b, c, d] = corners;
  return (u, v) => {
    const p = [0, 1, 2].map(i => lerp(lerp(a[i], b[i], u), lerp(d[i], c[i], u), v));
    if (deform) { const o = deform(u, v); p[0] += o[0]; p[1] += o[1]; p[2] += o[2]; }
    const s = cam.project(p);
    return [s[0], s[1]];
  };
}

// The border of a mapped surface, n points per side, clockwise from (0, 0).
function outline(map, n = 24) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push(map(i / n, 0));
  for (let i = 0; i < n; i++) pts.push(map(1, i / n));
  for (let i = 0; i < n; i++) pts.push(map(1 - i / n, 1));
  for (let i = 0; i < n; i++) pts.push(map(0, 1 - i / n));
  return pts;
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
// How directly a face with this normal faces the light (toLight points from the surface to the light).
function lambert(normal, toLight) { return Math.max(0, dot(unit(normal), unit(toLight))); }
// Where a point's shadow falls on the ground (y = 0) for light travelling along `dir`.
function groundShadow(p, dir) { const t = -p[1] / dir[1]; return [p[0] + dir[0] * t, 0, p[2] + dir[2] * t]; }

// Small vector helpers for building scenes in metres.
const v3 = {
  add: (...vs) => vs.reduce((s, v) => [s[0] + v[0], s[1] + v[1], s[2] + v[2]], [0, 0, 0]),
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (v, k) => [v[0] * k, v[1] * k, v[2] * k],
  lerp: (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)],
  unit: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  UP: [0, 1, 0],
};

// A box in metres: centre-bottom `at`, horizontal unit axes `ax` and `bx`, half-sizes `sa`, `sb`, height
// `h`. Draws only the faces turned toward the camera, farthest first, each filled by face(name, normal)
// (a colour string). Returns the drawn faces' screen polygons by name for further detailing.
function box(ctx, cam, { at, ax = [1, 0, 0], bx = [0, 0, 1], sa, sb, h }, face) {
  const pt = (u, v, w) => v3.add(at, v3.mul(ax, u * sa), v3.mul(bx, v * sb), [0, w * h, 0]);
  const faces = [
    ['front', v3.mul(bx, -1), [[-1, -1, 1], [1, -1, 1], [1, -1, 0], [-1, -1, 0]]],
    ['back', bx, [[1, 1, 1], [-1, 1, 1], [-1, 1, 0], [1, 1, 0]]],
    ['left', v3.mul(ax, -1), [[-1, 1, 1], [-1, -1, 1], [-1, -1, 0], [-1, 1, 0]]],
    ['right', ax, [[1, -1, 1], [1, 1, 1], [1, 1, 0], [1, -1, 0]]],
    ['top', [0, 1, 0], [[-1, 1, 1], [1, 1, 1], [1, -1, 1], [-1, -1, 1]]],
    ['bottom', [0, -1, 0], [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0]]],
  ];
  const out = {};
  const visible = faces.map(([name, n, corners]) => {
    const pts = corners.map(c => pt(...c)), centre = v3.mul(pts.reduce((s, p) => v3.add(s, p), [0, 0, 0]), .25);
    return { name, n, pts, centre, facing: dot(n, v3.sub(cam.pos, centre)) };
  }).filter(f => f.facing > 0).sort((p, q) => Math.hypot(...v3.sub(q.centre, cam.pos)) - Math.hypot(...v3.sub(p.centre, cam.pos)));
  for (const f of visible) {
    const poly = f.pts.map(p => { const s = cam.project(p); return [s[0], s[1]]; });
    pathOf(ctx, poly); ctx.fillStyle = face(f.name, f.n); ctx.fill();
    out[f.name] = poly;
  }
  return out;
}

// A heightfield seen through the camera: the ground y = height(x, z) over [x0,x1] x [z0,z1], cut into
// cols x rows cells (rows spaced more finely near the camera), painted back to front. Each cell is filled
// with color(centre, normal) so the scene decides the material and the light.
// With `fan`, the strip widens with depth instead (x from cx - fan*z - 4 to cx + fan*z + 4), keeping near
// cells small.
function terrain(ctx, cam, height, { x0, x1, z0, z1, cols = 60, rows = 60, bias = 2, fan = 0, cx = 0 }, color) {
  const zAt = r => z0 + (z1 - z0) * Math.pow(r / rows, bias);
  const xAt = (c, z) => (fan ? lerp(cx - fan * z - 4, cx + fan * z + 4, c / cols) : lerp(x0, x1, c / cols));
  for (let r = rows - 1; r >= 0; r--) {
    const za = zAt(r), zb = zAt(r + 1);
    for (let c = 0; c < cols; c++) {
      const xa = xAt(c, za), xb = xAt(c + 1, za), xc = xAt(c + 1, zb), xd = xAt(c, zb);
      const p00 = [xa, height(xa, za), za], p10 = [xb, height(xb, za), za], p11 = [xc, height(xc, zb), zb], p01 = [xd, height(xd, zb), zb];
      const ex = v3.sub(p10, p00), ez = v3.sub(p01, p00);
      const n = v3.unit([ex[1] * ez[2] - ex[2] * ez[1], ex[2] * ez[0] - ex[0] * ez[2], ex[0] * ez[1] - ex[1] * ez[0]]);
      const normal = n[1] < 0 ? v3.mul(n, -1) : n;
      const centre = [(xa + xb + xc + xd) / 4, (p00[1] + p10[1] + p11[1] + p01[1]) / 4, (za + zb) / 2];
      const quad = [p01, p11, p10, p00].map(p => cam.project(p));
      if (quad.some(q => q[2] <= .05)) continue;
      pathOf(ctx, quad.map(q => [q[0], q[1]]));
      ctx.fillStyle = color(centre, normal);
      ctx.fill();
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1; ctx.stroke();
    }
  }
}

// Soft cast shadows on the ground: every shape (a ring of 3D points) is dropped along `ray` onto y = 0,
// filled on a separate layer, blurred and laid over the plate.
function castShadows(ctx, createCanvas, project, shapes, ray, { color = 'rgb(28,36,66)', alpha = .42, blur = 5 } = {}) {
  const layer = makeCanvas(createCanvas, ctx.canvas.width, ctx.canvas.height), c = layer.getContext('2d');
  c.fillStyle = color;
  for (const pts of shapes) { pathOf(c, pts.map(p => { const s = project(groundShadow(p, ray)); return [s[0], s[1]]; })); c.fill(); }
  ctx.save();
  ctx.filter = `blur(${blur}px)`;
  ctx.globalAlpha = alpha;
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

// Falling snow or rain that loops exactly: each particle crosses the frame a whole number of times per loop.
// kind 'snow' drifts and sways; 'rain' falls fast and slanted as short streaks. at(p, phase) -> [x, y].
function particles(rnd, count, { kind = 'snow', near = .2, slant = .18, speed = 1 } = {}) {
  const items = Array.from({ length: count }, () => {
    const close = rnd() < near;
    return {
      x: rnd() * (W + 200) - 100, y: rnd(), close, offset: rnd(),
      turns: kind === 'rain' ? Math.round((3 + rnd() * 3) * speed) + (close ? 2 : 0) : 1 + Math.floor(rnd() * (close ? 3 : 2) * speed),
      wobble: 1 + Math.floor(rnd() * 3), sway: kind === 'rain' ? 0 : 6 + rnd() * (close ? 30 : 14),
      r: kind === 'rain' ? (close ? 1.4 : .8) : close ? 2 + rnd() * 2.6 : .7 + rnd() * 1.3,
      a: close ? .5 + rnd() * .35 : .25 + rnd() * .35, len: kind === 'rain' ? (close ? 34 : 18) + rnd() * 14 : 0,
    };
  });
  const at = (p, phase) => {
    const fall = (p.y + phase * p.turns) % 1;
    const y = fall * (H + 80) - 40;
    const x = p.x + Math.sin(TAU * (phase * p.wobble + p.offset)) * p.sway + (kind === 'rain' ? (fall - .5) * slant * H : 0);
    return [x, y];
  };
  const draw = (ctx, phase, rgb = '230,238,248') => {
    if (kind === 'rain') ctx.lineCap = 'round';
    for (const p of items) {
      const [x, y] = at(p, phase);
      if (kind === 'rain') {
        ctx.strokeStyle = `rgba(${rgb},${p.a * .6})`; ctx.lineWidth = p.r;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - slant * p.len, y - p.len); ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(${rgb},${p.a})`;
        ctx.beginPath(); ctx.arc(x, y, p.r, 0, TAU); ctx.fill();
      }
    }
  };
  return { items, at, draw };
}

// Water: draw `image` (a reflection layer) from row `top` down in thin bands, each pushed sideways by
// ripples that complete whole cycles per loop, stronger nearer the viewer.
function ripple(ctx, image, top, phase, { bands = 4, amp = 1, bottom = H, speed = 2 } = {}) {
  for (let y = Math.floor(top); y < bottom; y += bands) {
    const depth = (y - top) / Math.max(1, H - top), settle = Math.min(1, (y - top) / 50);
    const off = (Math.sin(TAU * (phase * speed + y * .021)) * (1 + depth * 8) + Math.sin(TAU * (phase * (speed + 1) + y * .047 + .3)) * depth * 4) * amp * (.3 + .7 * settle);
    ctx.drawImage(image, 0, y, W, bands, off, y, W, bands);
  }
}

// The camera's mirror image in a water plane at height `level`: project(p) of the reflected point.
function mirrorOf(cam, level = 0) {
  return p => { const s = cam.project([p[0], 2 * level - p[1], p[2]]); return [s[0], s[1]]; };
}

// Stars, fainter toward the horizon, a few brighter ones.
function starfield(ctx, rnd, count, horizon, rgb = '220,228,244') {
  for (let i = 0; i < count; i++) {
    const x = rnd() * W, y = rnd() ** 1.5 * horizon * .9, r = rnd();
    ctx.fillStyle = `rgba(${rgb},${.1 + r * .55 * (1 - y / horizon)})`;
    const s = r > .94 ? 2 : 1.1;
    ctx.fillRect(x, y, s, s);
  }
}

// A filled ridgeline (hills, forest edge, far shore) with the multi-scale edge.
function ridgeline(ctx, base, amp, color, seed, scales = EDGE_SCALES, bottom = H) {
  ctx.beginPath(); ctx.moveTo(0, bottom);
  for (let x = 0; x <= W; x += 3) ctx.lineTo(x, base - amp * (.5 + edge(x, seed, scales)));
  ctx.lineTo(W, bottom); ctx.closePath();
  ctx.fillStyle = Array.isArray(color) ? 'rgb(' + color.join(',') + ')' : color;
  ctx.fill();
}

// Seeded LCG in [0, 1), for scenes and tools that need their own sequence.
function seeded(seed) {
  let state = seed | 0;
  return () => ((state = Math.imul(state, 1664525) + 1013904223 | 0) >>> 0) / 4294967296;
}

// A hand-made outline: each edge of the closed polygon is cut every `step` px and the points are pushed
// along the edge normal by multi-scale noise, at most `amp` px.
function wobble(points, amp, seed, step = 10) {
  const out = [];
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!len) return;
    const n = Math.max(1, Math.round(len / step)), nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
    for (let k = 0; k < n; k++) {
      const t = k / n, d = amp ? edge(i * 997 + k * step, seed) * amp : 0;
      out.push([lerp(a[0], b[0], t) + nx * d, lerp(a[1], b[1], t) + ny * d]);
    }
  });
  return out;
}

function pathOf(ctx, points) {
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
}

const shade = (rgb, k = 0, a = 1) => 'rgba(' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v + k)))).join(',') + ',' + a + ')';
const at = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
// Point on a quad (top-left, top-right, bottom-right, bottom-left) at u across and v down.
const onQuad = (q, u, v) => at(at(q[0], q[1], u), at(q[3], q[2], u), v);

function bounds(points) {
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

// Fill a polygon with short brush strokes over its current colour (gouache-like build-up).
function strokesIn(ctx, points, color, rnd, { angle = 0, density = 1 / 70, len = 40, width = 10, spread = 16, alpha = [.28, .58] } = {}) {
  const [x0, y0, x1, y1] = bounds(points);
  const n = Math.round((x1 - x0) * (y1 - y0) * density);
  ctx.save();
  pathOf(ctx, points);
  ctx.clip();
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, rnd()), y = lerp(y0, y1, rnd()), a = angle + (rnd() - .5) * .3, l = len * (.5 + rnd());
    ctx.strokeStyle = shade(color, (rnd() - .45) * spread * 2.6, lerp(alpha[0], alpha[1], rnd()));
    ctx.lineWidth = width * (.5 + rnd());
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  ctx.restore();
}

// Planks over a quad (may be in perspective). along 'v' = boards run top to bottom (board and batten),
// 'u' = boards run across (clapboard). Each board has its own shade, warmth drift, darkening toward the
// ground, nail holes and rain streaks.
function planks(ctx, quad, rnd, { along = 'v', width = [.06, .09], base = [88, 72, 64], vary = 18, gap = 1.4, streaks = 3 } = {}) {
  const Q = typeof quad === 'function' ? quad : (u, v) => onQuad(quad, u, v);
  ctx.save();
  pathOf(ctx, typeof quad === 'function' ? outline(quad, 24) : quad);
  ctx.clip();
  for (let s = 0; s < 1;) {
    const w = lerp(width[0], width[1], rnd()), e = Math.min(1, s + w), k = (rnd() - .5) * vary, warm = (noise(s * 9, 3, 41) - .5) * 14;
    const run = k => Array.from({ length: 9 }, (_, i) => i / 8).map(t => (along === 'v' ? Q(k, t) : Q(t, k)));
    const sideA = run(s), sideB = run(e);
    const cell = [sideA[0], sideB[0], sideB[8], sideA[8]];
    const shape = sideA.concat(sideB.slice().reverse());
    const top = along === 'v' ? at(cell[0], cell[1], .5) : at(cell[0], cell[3], .5);
    const bottom = along === 'v' ? at(cell[3], cell[2], .5) : at(cell[1], cell[2], .5);
    const g = along === 'v' ? ctx.createLinearGradient(top[0], top[1], bottom[0], bottom[1])
      : ctx.createLinearGradient(cell[0][0], cell[0][1], cell[1][0], cell[1][1]);
    g.addColorStop(0, shade(base, k + warm));
    g.addColorStop(.7, shade(base, k + warm + 6));
    g.addColorStop(1, shade(base, k - 26));
    pathOf(ctx, shape);
    ctx.fillStyle = g;
    ctx.fill();
    // the seam between boards: a dark gap with a faint lit lip above it
    ctx.strokeStyle = 'rgba(12,9,10,.6)'; ctx.lineWidth = gap;
    ctx.beginPath(); sideB.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,170,150,.08)'; ctx.lineWidth = 1;
    ctx.beginPath(); sideB.forEach((p, i) => (i ? ctx.lineTo(p[0] - 1.5, p[1] - 1.5) : ctx.moveTo(p[0] - 1.5, p[1] - 1.5))); ctx.stroke();
    for (let r = 0; r < streaks; r++) {
      const u = lerp(s, e, rnd()), v0 = rnd() * .4, v1 = v0 + .2 + rnd() * .5;
      const p0 = along === 'v' ? Q(u, v0) : Q(lerp(0, 1, rnd()), lerp(s, e, rnd()));
      const p1 = along === 'v' ? Q(u + (rnd() - .5) * .004, v1) : [p0[0] + (rnd() - .5) * 2, p0[1] + 8 + rnd() * 24];
      ctx.strokeStyle = 'rgba(30,22,22,' + (.08 + rnd() * .14) + ')'; ctx.lineWidth = .8 + rnd() * 1.8;
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
    }
    if (rnd() < .35) {
      const p = along === 'v' ? Q((s + e) / 2, .1 + rnd() * .8) : Q(.1 + rnd() * .8, (s + e) / 2);
      ctx.fillStyle = 'rgba(25,18,16,.55)'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 1.6, 1.6, 0, 0, TAU); ctx.fill();
    }
    s = e;
  }
  ctx.restore();
}

// A course of irregular stones along a line (a foundation, a wall top, a kerb).
function stones(ctx, from, to, rnd, { size = 26, base = [82, 82, 86], vary = 36, shrink = 1 } = {}) {
  const n = Math.max(1, Math.round(Math.hypot(to[0] - from[0], to[1] - from[1]) / size));
  for (let i = 0; i < n; i++) {
    const p = at(from, to, (i + .5) / n), s = size / 2 * lerp(1, shrink, i / n) * (.85 + rnd() * .3);
    const outline = wobble([[p[0] - s, p[1] - s * .3], [p[0] + s, p[1] - s * .4], [p[0] + s * 1.02, p[1] + s * 1.05], [p[0] - s, p[1] + s * 1.1]],
      s * .18, Math.floor(rnd() * 1e6), Math.max(3, s / 2));
    pathOf(ctx, outline);
    const g = ctx.createLinearGradient(p[0], p[1] - s, p[0], p[1] + s);
    const k = (rnd() - .5) * vary;
    g.addColorStop(0, shade(base, k + 14)); g.addColorStop(1, shade(base, k - 22));
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(10,10,14,.6)'; ctx.lineWidth = 1.4; ctx.stroke();
  }
}

// Staggered roof shingles over a quad whose top edge is the ridge and bottom edge the eave.
function shingles(ctx, quad, rnd, { rows = 16, cols = 15, base = [52, 48, 54], moss = [58, 66, 50], mossAt = .66, seed = 0, vary = 22 } = {}) {
  const Q = typeof quad === 'function' ? quad : (u, v) => onQuad(quad, u, v);
  const border = typeof quad === 'function' ? outline(quad, 24) : quad;
  ctx.save();
  pathOf(ctx, border);
  ctx.clip();
  pathOf(ctx, border);
  ctx.fillStyle = shade(base, -18); ctx.fill();
  for (let r = 0; r < rows; r++) {
    const v0 = 1 - r / rows, v1 = 1 - (r + 1.25) / rows, n = cols + (r % 2), off = (r % 2) * .5 / n;
    for (let i = -1; i < n; i++) {
      const u0 = Math.max(0, i / n + off), u1 = Math.min(1, (i + 1) / n + off - .004);
      if (u1 <= u0) continue;
      const mossy = noise(u0 * 6, r / 3, seed + 21) > mossAt;
      pathOf(ctx, [Q(u0, v1), Q(u1, v1), Q(u1 + .003, v0), Q(u0 - .003, v0)]);
      ctx.fillStyle = shade(mossy ? moss : base, (rnd() - .5) * vary - r * .6); ctx.fill();
      const a = Q(u0, v0), b = Q(u1, v0);
      ctx.strokeStyle = 'rgba(8,8,12,.55)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
  }
  ctx.restore();
}

// Rubble masonry over a surface (flat quad or mapped surface): courses of irregular stones, each its own
// size and shade, set in darker mortar, lit along their top edges. `courses` across v, stones across u.
function masonry(ctx, quad, rnd, { courses = 8, length = [.08, .16], base = [110, 106, 100], vary = 30, mortar = [44, 42, 40], wet = 0 } = {}) {
  const Q = typeof quad === 'function' ? quad : (u, v) => onQuad(quad, u, v);
  const border = typeof quad === 'function' ? outline(quad, 24) : quad;
  ctx.save();
  pathOf(ctx, border);
  ctx.clip();
  pathOf(ctx, border);
  ctx.fillStyle = shade(mortar);
  ctx.fill();
  for (let c = 0; c < courses; c++) {
    const v0 = c / courses, v1 = (c + 1) / courses;
    for (let u = -rnd() * length[1]; u < 1;) {
      const w = lerp(length[0], length[1], rnd()), e = u + w;
      const gu = .006 + rnd() * .006, gv = .08 + rnd() * .06;
      const a = Q(Math.max(0, u + gu), v0 + (v1 - v0) * gv), b = Q(Math.min(1, e - gu), v0 + (v1 - v0) * gv * (.5 + rnd()));
      const cc = Q(Math.min(1, e - gu), v1 - (v1 - v0) * gv), d = Q(Math.max(0, u + gu), v1 - (v1 - v0) * gv * (.5 + rnd()));
      const size = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const stone = wobble([a, b, cc, d], Math.max(.5, size * .06), Math.floor(rnd() * 1e6), Math.max(3, size / 5));
      const k = (rnd() - .5) * vary;
      const g = ctx.createLinearGradient(a[0], a[1], d[0], d[1]);
      g.addColorStop(0, shade(base, k + 16)); g.addColorStop(1, shade(base, k - 18));
      pathOf(ctx, stone); ctx.fillStyle = g; ctx.fill();
      if (wet) { ctx.fillStyle = `rgba(200,210,230,${wet * rnd() * .25})`; ctx.fill(); }
      u = e;
    }
  }
  ctx.restore();
}

// Bark inside a trunk polygon. dir 'h' = horizontal lenticels and dark patches (birch, cherry), 'v' =
// vertical furrows (pine, oak). `light` is the lit side, -1 left or 1 right.
function bark(ctx, points, rnd, { base = [120, 110, 100], dir = 'v', marks = 40, light = -1, vary = 20 } = {}) {
  const [x0, y0, x1, y1] = bounds(points);
  ctx.save();
  pathOf(ctx, points);
  ctx.clip();
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, shade(base, light < 0 ? 18 : -34)); g.addColorStop(.5, shade(base, 0)); g.addColorStop(1, shade(base, light < 0 ? -34 : 18));
  ctx.fillStyle = g; ctx.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
  const w = x1 - x0;
  for (let i = 0; i < marks; i++) {
    const y = lerp(y0, y1, rnd()), x = lerp(x0, x1, rnd());
    ctx.strokeStyle = shade(dir === 'h' ? [28, 26, 30] : base, dir === 'h' ? (rnd() - .5) * vary : -40 + (rnd() - .5) * vary, .35 + rnd() * .45);
    ctx.lineWidth = dir === 'h' ? 1 + rnd() * 3 : .8 + rnd() * 1.6;
    ctx.beginPath();
    if (dir === 'h') {
      const l = w * (.15 + rnd() * .5);
      ctx.moveTo(x - l / 2, y); ctx.lineTo(x + l / 2, y + (rnd() - .5) * 2);
    } else {
      const l = 10 + rnd() * 50;
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x + (rnd() - .5) * 4, y + l / 2, x + (rnd() - .5) * 3, y + l);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// Light presets shared by the families. Colours are multipliers on the scene's own colours.
const LIGHT = {
  WARM: [1.35, 1, .62],
  COOL: [.6, .76, 1.04],
  MOON: [.72, .84, 1.05],
  DAWN: [1.16, .9, .82],
  NIGHT: [.62, .66, .76],
  ROOM: [.5, .53, .63],
  // a small warm source: lamp, lantern, lit window or door
  lamp: (x, y, power = .8, rx = 260, ry = 300, color = [1.35, 1, .62]) => ({ x, y, rx, ry, power, color }),
  // a hanging or post lamp that throws its light downward
  hood: (x, y, power = 1, rx = 600, ry = 800, color = [1.35, 1, .62]) => ({ x, y, rx, ry, power, color, down: 30 }),
  // the moon's light on the ground or water below it
  glade: (x, horizon, power = .35, rx = 480, ry = 620) => ({ x, y: horizon + 260, rx, ry, power, color: [.72, .84, 1.05] }),
  // dawn light off the bright horizon onto the land below; the sky above already holds it
  dawn: (horizon, power = .45, x = 960, rx = 1250) => ({ x, y: horizon + 10, rx, ry: 520, power, color: [1.16, .9, .82], down: 12 }),
};

// Wrap a scene factory so every frame is lit by its light map.
function lit(setup, createScene) {
  if (!setup) return createScene;
  return createCanvas => {
    const render = createScene(createCanvas);
    const light = lighting(createCanvas, setup);
    return (target, input) => {
      render(target, input);
      light(target);
    };
  };
}

// Light every scene of a family that has an entry in `table` (keyed by scene id).
function litScenes(scenes, table) {
  return scenes.map(scene => (table[scene.id]
    ? { ...scene, createScene: lit(table[scene.id], createCanvas => scene.createScene(createCanvas)) } : scene));
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

// Finishing looks. 'film' is the original pass; 'paint' trades grain for a still canvas weave, softer
// edges, warmer shadows and gentler bloom; 'clean' is a crisp illustration finish with almost no grain.
const LOOKS = [
  { id: 'film', soft: .3, edge: 1, bloom: 1, base: 'rgb(9,12,19)', grain: .26, canvas: 0, vignette: .42, warm: 0 },
  { id: 'paint', soft: .5, edge: 1.2, bloom: .7, base: 'rgb(20,16,15)', grain: .07, canvas: .22, vignette: .3, warm: .05 },
  { id: 'clean', soft: 0, edge: .3, bloom: .65, base: 'rgb(5,7,11)', grain: .08, canvas: 0, vignette: .22, warm: 0 },
  // city-pop illustration: flat clean fills, crisp edges, saturated colour, indigo shadows, no grain
  { id: 'citypop', soft: 0, edge: 0, bloom: .5, base: 'rgb(10,8,26)', grain: 0, canvas: 0, vignette: 0, warm: 0, texture: .12, saturate: 1.45, contrast: 1.15, grade: true },
];
function lookOf(look) {
  const id = (typeof look === 'function' ? look() : look) || 'film';
  const found = LOOKS.find(l => l.id === id);
  if (!found) throw new Error('unknown look: ' + id);
  return found;
}
// A canvas weave: fine crossing threads with slub variation, tiled.
let weaveTile = null;
function weave(createCanvas) {
  if (weaveTile) return weaveTile;
  const n = 192; weaveTile = makeCanvas(createCanvas, n, n);
  const c = weaveTile.getContext('2d'), img = c.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const x = i % n, y = (i / n) | 0;
    const warp = Math.sin(x * TAU / 4) * .5 + .5, weft = Math.sin(y * TAU / 4) * .5 + .5, over = ((x >> 2) + (y >> 2)) % 2;
    const v = 128 + ((over ? warp : weft) - .5) * 44 + (hash(x >> 1, y >> 3, 31) - .5) * 30 + (hash(x >> 3, y >> 1, 32) - .5) * 24;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return weaveTile;
}

function finisher(createCanvas, options = {}) {
  const amount = options.amount ?? 1;
  const look = lookOf(options.look);
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
  let vignette = null, canvasPattern = null, full = null, grade = null;

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
    ctx.globalAlpha = look.soft * amount;
    if (look.soft > 0) ctx.drawImage(half, 0, 0, W, H);
    ec.globalCompositeOperation = 'copy';
    ec.filter = 'blur(3px)';
    ec.drawImage(half, 0, 0);
    ec.filter = 'none';
    ec.globalCompositeOperation = 'destination-in';
    ec.fillStyle = edgeMask;
    ec.fillRect(0, 0, W / 2, H / 2);
    ctx.globalAlpha = Math.min(1, look.edge * amount);
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
      ctx.globalAlpha = b.a * look.bloom * amount;
      ctx.drawImage(b.c, 0, 0, W, H);
    }

    // 3. film base: lift the blacks a little toward a cool tone so shadows read as air, not ink
    ctx.globalCompositeOperation = 'lighten';
    ctx.globalAlpha = amount;
    ctx.fillStyle = look.base;
    ctx.fillRect(0, 0, W, H);
    if (look.saturate) {
      full = full || makeCanvas(createCanvas, W, H); const fc = full.getContext('2d');
      fc.globalCompositeOperation = 'copy'; fc.drawImage(ctx.canvas, 0, 0);
      ctx.globalCompositeOperation = 'copy'; ctx.globalAlpha = 1; ctx.filter = `saturate(${look.saturate}) contrast(${look.contrast})`;
      ctx.drawImage(full, 0, 0); ctx.filter = 'none';
    }
    if (look.grade) {
      // city-pop grade: shadows pushed to indigo-violet, highlights to peach, sky edge to magenta
      grade = grade || (() => { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgb(120,70,200)'); g.addColorStop(.55, 'rgb(230,120,150)'); g.addColorStop(1, 'rgb(40,90,200)'); return g; })();
      ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .26 * amount; ctx.fillStyle = grade; ctx.fillRect(0, 0, W, H);
    }
    if (look.warm) { ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = look.warm * 4 * amount; ctx.fillStyle = 'rgb(200,150,110)'; ctx.fillRect(0, 0, W, H); }

    // 4. grain: one of a few tiles per film frame (12 fps), offset by a hash so it never repeats visibly
    const frame = Math.floor(phase * cycle * 12);
    const tile = tiles[frame % GRAIN_FRAMES];
    const ox = Math.floor(hash(frame, 1, 77) * GRAIN), oy = Math.floor(hash(frame, 2, 77) * GRAIN);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = look.grain * amount;
    if (look.grain > 0) {
    ctx.translate(-ox, -oy);
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(ox, oy, W, H);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (look.canvas) { ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = look.canvas * amount; ctx.fillStyle = canvasPattern || (canvasPattern = ctx.createPattern(weave(createCanvas), 'repeat')); ctx.fillRect(0, 0, W, H); }

    // 5. vignette
    if (!vignette) {
      vignette = ctx.createRadialGradient(W / 2, H / 2, H * .38, W / 2, H / 2, W * .64);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(.6, 'rgba(0,0,0,.12)');
      vignette.addColorStop(1, `rgba(0,0,0,${look.vignette})`);
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
    const look = lookOf(options && options.look);
    TEXTURE_SCALE = look.texture ?? 1;
    let painter;
    try { painter = createScene(make); } finally { TEXTURE_SCALE = 1; }
    const finish = finisher(make, options);
    return (ctx, phase) => {
      painter(ctx, phase);
      finish(ctx, phase);
    };
  };
}

module.exports = {
  W, H, TAU, hash, noise, edge, loopNoise, glow, aerial, textureTile, applyTexture, smoothstep, lerp,
  seeded, wobble, pathOf, strokesIn, planks, stones, shingles, bark, masonry, shade, onQuad,
  camera, surface, outline, lambert, groundShadow, v3, castShadows, particles, starfield, ridgeline, ripple, mirrorOf, box, terrain,
  LIGHT, lighting, lit, litScenes, finisher, finished, LOOKS, lookOf, textureScale,
};
