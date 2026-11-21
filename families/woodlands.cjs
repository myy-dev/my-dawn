'use strict';

const W = 1920;
const H = 1080;
const TAU = 2 * Math.PI;

function seeded(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function plate(createCanvas) {
  const canvas = createCanvas(W, H);
  return [canvas, canvas.getContext('2d')];
}

function tint(rgb, shift) {
  return 'rgb(' + rgb.map(channel => Math.min(255, Math.max(0, channel + shift | 0))).join(',') + ')';
}

function alpha(rgb, opacity) {
  return 'rgba(' + rgb.join(',') + ',' + Math.max(0, Math.min(1, opacity)) + ')';
}

function wash(ctx, first, middle, last) {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, first);
  gradient.addColorStop(0.6, middle);
  gradient.addColorStop(1, last);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

function light(ctx, x, y, radiusX, radiusY, rgb, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(radiusX, radiusY);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, alpha(rgb, opacity));
  gradient.addColorStop(0.32, alpha(rgb, opacity * 0.72));
  gradient.addColorStop(1, alpha(rgb, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function stroke(ctx, x, y, endX, endY, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function disk(ctx, x, y, rx, ry, color, rotation = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rotation, 0, TAU);
  ctx.fill();
}

function shade(ctx, random, strength = 1) {
  const vignette = ctx.createRadialGradient(W * 0.48, H * 0.46, 235, W * 0.48, H * 0.46, 1190);
  vignette.addColorStop(0, 'rgba(2,6,10,0)');
  vignette.addColorStop(0.68, alpha([2, 6, 10], 0.12 * strength));
  vignette.addColorStop(1, alpha([2, 6, 10], 0.63 * strength));
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
  for (let index = 0; index < 12500; index++) {
    ctx.fillStyle = index % 2 ? 'rgba(122,145,150,0.034)' : 'rgba(3,8,13,0.075)';
    ctx.fillRect(random() * W, random() * H, 1 + random() * 2.5, 1);
  }
}

function leaf(ctx, x, y, size, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.44, -size * 0.3, size, -size * 0.06);
  ctx.quadraticCurveTo(size * 0.7, size * 0.22, 0, 0);
  ctx.fill();
  ctx.restore();
}

function grasses(ctx, x, y, size, colors, random, count) {
  for (let index = 0; index < count; index++) {
    const bend = (random() - 0.5) * size;
    const h = size * (0.24 + random() * 0.8);
    ctx.strokeStyle = colors[index % colors.length];
    ctx.lineWidth = Math.max(0.6, size * 0.021);
    ctx.beginPath();
    ctx.moveTo(x + (random() - 0.5) * size * 0.3, y);
    ctx.quadraticCurveTo(x + bend * 0.18, y - h * 0.62, x + bend, y - h);
    ctx.stroke();
  }
}

function hill(ctx, y, amplitude, frequency, phase, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-30, H);
  for (let x = -30; x <= W + 30; x += 20) {
    const h = y + amplitude * (Math.sin(x * frequency + phase) + Math.sin(x * frequency * 2.6 + 1) * 0.25);
    ctx.lineTo(x, h);
  }
  ctx.lineTo(W + 30, H);
  ctx.fill();
}

function trailTree(ctx, species, x, y, h, width, lean, color, foliage, lightness, random) {
  const endX = x + lean;
  const endY = y - h;
  const tip = species === 'bamboo' ? 0.11 : 0.018;
  const half = width * 0.5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - half, y);
  ctx.quadraticCurveTo(x + lean * 0.38 - width * 0.31, y - h * 0.49, endX - width * tip, endY);
  ctx.lineTo(endX + width * tip, endY);
  ctx.quadraticCurveTo(x + lean * 0.38 + width * 0.31, y - h * 0.49, x + half, y);
  ctx.closePath();
  ctx.fill();
  if (species === 'bamboo') {
    for (let index = 1; index < 10; index++) {
      const t = index / 10;
      const cx = x + lean * t * t;
      const yy = y - h * t;
      stroke(ctx, cx - width * 0.6, yy, cx + width * 0.55, yy - 1, alpha([144, 172, 133], 0.18), 2);
    }
  } else {
    const lines = Math.min(24, Math.floor(h / 25));
    for (let index = 0; index < lines; index++) {
      const t = random();
      const cx = x + lean * t * t;
      const yy = y - h * t;
      const color = species === 'birch' ? '#26343d' : alpha([146, 129, 99], 0.18);
      const extent = (0.15 + random() * 0.8) * width;
      stroke(ctx, cx - extent * 0.48, yy, cx + extent * 0.48, yy + (random() - 0.4) * 5, color, Math.max(0.8, width * (0.035 + random() * 0.095)));
    }
  }
  const branches = species === 'bamboo' ? 9 : 7;
  for (let index = 0; index < branches; index++) {
    const t = 0.39 + index * 0.077;
    const side = index % 2 ? 1 : -1;
    const sx = x + lean * t * t;
    const sy = y - h * t;
    const bx = sx + h * (0.04 + random() * 0.15) * side * (1 - (t - 0.4));
    const by = sy - h * (0.04 + random() * 0.12);
    stroke(ctx, sx, sy, bx, by, color, Math.max(0.6, width * (1 - t) * 0.28));
    if (species === 'birch') {
      for (let curl = 0; curl < 4; curl++) {
        const at = (curl + 1) / 5;
        const ax = sx + (bx - sx) * at;
        const ay = sy + (by - sy) * at;
        stroke(ctx, ax, ay, ax + (random() - 0.28) * h * 0.068, ay - h * (0.02 + random() * 0.105), color, Math.max(0.65, width * 0.065));
      }
      continue;
    }
    for (let detail = 0; detail < (species === 'bamboo' ? 17 : 32); detail++) {
      const at = random();
      const px = sx + (bx - sx) * at + (random() - 0.5) * h * 0.07;
      const py = sy + (by - sy) * at + (random() - 0.45) * h * 0.075;
      const length = h * (0.013 + random() * (species === 'bamboo' ? 0.048 : 0.025));
      leaf(ctx, px, py, length, -0.8 + random() * 3.9, tint(foliage, lightness + random() * 15));
    }
  }
}

function trailFactory(createCanvas, scene) {
  const [image, ctx] = plate(createCanvas);
  const random = seeded(scene.seed);
  const species = scene.species;
  const floor = species === 'birch' ? [70, 91, 107] : species === 'ginkgo' ? [74, 64, 47] : [38, 66, 59];
  const path = species === 'birch' ? [91, 110, 125] : species === 'ginkgo' ? [109, 94, 70] : [74, 96, 83];
  const leafPalette = species === 'ginkgo' ? [98, 84, 46] : [53, 85, 63];
  const horizon = species === 'ginkgo' ? 540 : 510;
  const center = species === 'bamboo'
    ? t => scene.center + 132 * t + 398 * t * t - 71 * Math.sin(t * Math.PI)
    : t => scene.center + Math.sin(t * 3.4) * scene.curve + (t * t) * scene.end;
  const spread = species === 'bamboo'
    ? t => 5 + 158 * t ** 1.42 + 11 * t * Math.sin(t * 12)
    : t => 8 + 330 * t ** 1.57;

  wash(ctx, '#121e2a', '#40565b', '#182d30');
  light(ctx, scene.center, horizon - 30, 590, 345, species === 'ginkgo' ? [152, 134, 95] : [132, 162, 155], 0.39);
  for (let index = 0; index < 125; index++) {
    const x = random() * W;
    const bottom = 520 + random() * 55;
    const height = 210 + random() * 380;
    const shade = -7 + random() * 17;
    const rgb = [59 + shade | 0, 78 + shade | 0, 80 + shade | 0];
    const fade = ctx.createLinearGradient(0, bottom - height, 0, bottom);
    fade.addColorStop(0, alpha(rgb, 0));
    fade.addColorStop(0.37, alpha(rgb, 0.48));
    fade.addColorStop(1, alpha(rgb, 0.9));
    stroke(ctx, x, bottom, x + (random() - 0.5) * 55, bottom - height, fade, 1 + random() * 7);
    if (index % 3 === 0) stroke(ctx, x, bottom - height * 0.48, x - 38 * random(), bottom - height * 0.74, fade, 2);
  }
  const floorGradient = ctx.createLinearGradient(0, horizon - 55, 0, horizon + 83);
  floorGradient.addColorStop(0, alpha(floor, 0));
  floorGradient.addColorStop(0.6, alpha(floor, 0.65));
  floorGradient.addColorStop(1, tint(floor, -12));
  ctx.fillStyle = floorGradient;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 18) {
    ctx.lineTo(x, horizon - 39 + Math.sin(x * 0.006 + 1) * 19 + Math.sin(x * 0.022) * 7);
  }
  ctx.lineTo(W, H);
  ctx.fill();
  for (let i = 0; i < 80; i++) {
    const x = random() * W;
    const y = horizon - 25 + random() * 61;
    if (Math.abs(x - scene.center) < 33) continue;
    disk(ctx, x, y, 18 + random() * 54, 5 + random() * 14, alpha(floor, 0.13 + random() * 0.24));
  }

  for (let index = 0; index <= 90; index++) {
    const t = index / 90;
    const y = horizon + (H - horizon) * t;
    const x = center(t);
    const width = spread(t);
    const shift = 14 - 35 * t + random() * 6;
    const tone = path.map(channel => channel + shift | 0);
    if (species === 'bamboo') {
      const reach = width * (1.17 + .06 * Math.sin(t * 29));
      const feather = ctx.createLinearGradient(x - reach, y, x + reach, y);
      const opacity = Math.min(1, t * 7) * (.71 + .13 * Math.sin(t * 33) + .09 * Math.sin(t * 63));
      feather.addColorStop(0, alpha(tone, 0));
      feather.addColorStop(.25, alpha(tone, opacity * .75));
      feather.addColorStop(.46, alpha(tone, opacity));
      feather.addColorStop(.75, alpha(tone, opacity * .59));
      feather.addColorStop(1, alpha(tone, 0));
      stroke(ctx, x - reach, y, x + reach, y, feather, 8.3);
    } else {
      stroke(ctx, x - width, y, x + width, y, alpha(tone, Math.min(1, t * 8)), 7);
    }
  }
  for (let index = 0; index < 9500; index++) {
    const t = random();
    const y = horizon + (H - horizon) * t;
    const x = random() * W;
    const distance = Math.abs(x - center(t)) / spread(t);
    const inPath = species === 'bamboo'
      ? distance < .90 + .14 * Math.sin(t * 29) && random() > distance * .35
      : distance < 1;
    ctx.fillStyle = tint(inPath ? path : floor, (inPath ? 14 : 6) - 34 * t + (random() - 0.5) * 20);
    const size = 0.6 + t * t * (2 + random() * (inPath ? 13 : 21));
    ctx.fillRect(x, y, size, 0.45 + t * random() * 1.85);
  }

  if (species === 'bamboo') {
    for (let i = 0; i < 27; i++) {
      const t = .19 + random() * .81;
      const y = horizon + t * (H - horizon);
      const nearLeft = i % 4 !== 0;
      const x = center(t) + (nearLeft ? -1 : 1) * (spread(t) * (.65 + random() * .56));
      disk(ctx, x, y + 3, 9 + t * 35, 2 + t * 7, alpha([39, 61, 48], .35), -.16);
      grasses(ctx, x, y, 9 + t * (19 + random() * 29), ['#344e3d', '#3b5845', '#4b6450'], random, 7);
    }
  } else if (species === 'ginkgo') {
    for (let index = 0; index < 18; index++) {
      const t = (index / 17) ** 1.45;
      const y = horizon + (H - horizon) * t;
      const x = center(t);
      const width = spread(t) * 0.94;
      stroke(ctx, x - width, y, x + width, y + 2 + t * 7, tint(path, -20 - t * 11), 1 + t * 6);
      stroke(ctx, x - width, y - 2, x + width, y + t * 6, tint(path, 2 - t * 15), 1 + t * 3);
    }
  }

  for (let index = 0; index < 74; index++) {
    const depth = index / 73;
    const side = index % 2 ? 1 : -1;
    const y = horizon + 24 + depth * (H - horizon + 18);
    const x = center(depth) + side * (spread(depth) + 19 + random() * (206 + depth * 510));
    const h = 170 + depth ** 1.3 * (380 + random() * 360);
    const width = species === 'bamboo' ? 1.8 + depth * 16 : 2.8 + depth * (15 + random() * 54);
    const lean = (random() - 0.48) * (40 + depth * 180);
    const base = species === 'birch' ? [103, 124, 132] : species === 'bamboo' ? [70, 104, 75] : [71, 66, 53];
    disk(ctx, x + depth * 22, y + 3, 8 + depth * 51, 2 + depth * 8, alpha([9, 19, 22], 0.42), -0.15);
    if (depth > 0.48 && species !== 'birch') grasses(ctx, x, y, depth * 45, ['#263f35', '#394e3b', '#55634a'], random, 11);
    trailTree(ctx, species, x, y, h, width, lean, tint(base, -depth * 31 + (random() - 0.5) * 15), leafPalette, -depth * 36, random);
  }

  if (species === 'bamboo') {
    for (let i = 0; i < 18; i++) {
      const side = i < 9 ? -1 : 1;
      const x = side < 0 ? i * 63 - 72 : W - (i - 9) * 58 + 31;
      const y = H + random() * 105;
      const lean = (108 + random() * 228) * -side;
      trailTree(ctx, species, x, y, y + 225 + random() * 380, 13 + random() * 12, lean, tint([50, 73, 57], (random() - 0.5) * 19), [52, 84, 62], -16, random);
    }
    for (let i = 0; i < 205; i++) {
      const x = random() * W;
      const y = 19 + Math.sin(x * 0.003 + 0.8) * 73 + random() * 76;
      if (Math.abs(x - 1000) < 175 && random() < 0.82) continue;
      leaf(ctx, x, y, 14 + random() * 57, random() * TAU, tint([49, 70, 57], (random() - 0.5) * 30));
    }
  } else if (species === 'ginkgo') {
    const silhouette = {
      species: 'maple', bark: [62, 57, 47], foliage: [103, 82, 48], arch: true,
    };
    canopyBranch(ctx, -120, 1004, 590, -991, 141, 3, silhouette, random);
    canopyBranch(ctx, 1944, 982, -483, -1010, 122, 3, silhouette, random);
    canopyBranch(ctx, -63, 81, 893, 110, 47, 2, silhouette, random);
    canopyBranch(ctx, 1980, 110, -676, 87, 36, 2, silhouette, random);
  } else {
    for (const [x, y, h, width, lean] of [[4,1190,1475,95,125],[267,1004,1229,63,-101],[149,976,1155,42,116],[1746,1094,1305,66,-79],[1925,982,1300,78,103]]) {
      trailTree(ctx, species, x, y, h, width, lean, tint([95, 120, 133], (random() - 0.5) * 14), [0,0,0], 0, random);
    }
    for (let i = 0; i < 170; i++) {
      const t = random();
      const x = random() * W;
      if (Math.abs(x - center(t)) > spread(t) * 1.16) continue;
      const y = horizon + t * (H - horizon);
      disk(ctx, x, y, 5 + t * random() * 28, 0.8 + t * random() * 3.5, alpha([162, 186, 190], 0.08 + t * 0.08), -0.07);
    }
  }

  if (species === 'ginkgo') {
    const x = center(0.11) + spread(0.11) + 41;
    const y = horizon + (H - horizon) * 0.14;
    light(ctx, x + 9, y - 55, 93, 102, [227, 170, 100], 0.19);
    ctx.fillStyle = '#35393a';
    ctx.fillRect(x + 6, y - 44, 18, 49);
    ctx.fillRect(x - 7, y - 74, 44, 9);
    ctx.fillStyle = '#433f35';
    ctx.fillRect(x - 1, y - 65, 32, 28);
    ctx.fillStyle = '#b09160';
    ctx.fillRect(x + 5, y - 61, 22, 17);
    ctx.fillStyle = '#dec99c';
    ctx.fillRect(x + 12, y - 58, 8, 13);
  }

  const [rim, rimCtx] = plate(createCanvas);
  shade(rimCtx, random, 1);
  const drift = Array.from({length: species === 'birch' ? 87 : 16}, (_, i) => ({
    x: random() * (W + 160) - 80, y: random() * (H + 200) - 140, phase: random(),
    radius: species === 'birch' ? (i > 65 ? 2.7 : 0.85) + random() ** 2 * 3.6 : 2.2 + random() * 4.1,
    drift: (random() - 0.5) * 47, speed: 1 + i % 2, opacity: 0.22 + random() * 0.36,
  }));
  return (out, phase) => {
    const t = ((phase % 1) + 1) % 1;
    out.drawImage(image, 0, 0);
    const hazeX = scene.center + 40 * Math.sin(t * TAU);
    light(out, hazeX, horizon + 23, 510, 46, species === 'ginkgo' ? [189, 163, 119] : [134, 164, 156], 0.09);
    for (const item of drift) {
      const p = (t * item.speed + item.phase) % 1;
      const y = (item.y + p * (H + 200) + 150) % (H + 200) - 150;
      const x = item.x + item.drift * Math.sin(p * TAU);
      const envelope = Math.sin(Math.PI * p) ** 1.35;
      if (species === 'birch') disk(out, x, y, item.radius, item.radius * 0.78, alpha([189, 211, 218], envelope * item.opacity));
      else leaf(out, x, y, item.radius * 2.5, p * TAU * 2, alpha(species === 'ginkgo' ? [204, 160, 83] : [134, 174, 112], envelope * item.opacity));
    }
    out.drawImage(rim, 0, 0);
  };
}

const trails = [
  {id:'41', title:'대숲 사이로 스미는 새벽', slug:'bamboo-grove-at-first-light', sound:'wind',soundLabel:'대나무 잎 사이를 스치는 바람', seed:4107, species:'bamboo', center:792},
  {id:'42', title:'은행잎이 놓인 돌길', slug:'ginkgo-stone-path', sound:'wind', soundLabel:'돌길을 지나는 잔바람', seed:4207, species:'ginkgo', center:730, curve:236, end:158},
  {id:'43', title:'자작나무 사이로 내리는 눈', slug:'snowfall-in-the-birch-grove', sound:'snow', soundLabel:'눈 내리는 숲의 바람', seed:4307, species:'birch', center:1145, curve:-261, end:-19},
];
module.exports = trails.map(scene => ({
  id:scene.id, title:scene.title, slug:scene.slug, sound:scene.sound, soundLabel:scene.soundLabel,
  createScene: createCanvas => trailFactory(createCanvas, scene),
}));

function drop(ctx, x, y, radius, rgb, opacity = 0.8) {
  disk(ctx, x, y, radius, radius * 1.18, alpha([10, 23, 29], opacity));
  disk(ctx, x + radius * 0.15, y + radius * 0.42, radius * 0.62, radius * 0.5, alpha(rgb, opacity * 0.61), -0.3);
  disk(ctx, x - radius * 0.35, y - radius * 0.45, radius * 0.25, radius * 0.21, alpha([224, 230, 214], opacity));
}

function fernFrond(ctx, x, y, h, bend, rgb, random) {
  const point = t => [x + bend * t * t, y - t * h + h * 0.22 * t ** 4];
  const [tx, ty] = point(1);
  ctx.strokeStyle = tint(rgb, 17);
  ctx.lineWidth = Math.max(1, h * 0.008);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + bend * 0.04, y - h * 0.69, tx, ty);
  ctx.stroke();
  for (let index = 1; index <= 19; index++) {
    const t = (index / 20) ** 0.86;
    const [cx, cy] = point(t);
    const length = (Math.sin(t * Math.PI) ** 0.7) * h * (0.12 + random() * 0.075);
    for (const side of [-1, 1]) {
      const angle = side === 1 ? -0.69 : -2.52;
      leaf(ctx, cx, cy, length, angle + (random() - 0.5) * 0.43, tint(rgb, -15 + random() * 30));
      const [lx, ly] = [cx + Math.cos(angle) * length * 0.74, cy + Math.sin(angle) * length * 0.74];
      stroke(ctx, cx, cy, lx, ly, alpha([163, 183, 128], 0.2), 1.2);
      if (h > 400 && random() < 0.25) drop(ctx, lx, ly, 2 + random() * 4, [129, 179, 154], 0.55);
    }
  }
}

function bells(ctx, x, y, height, direction, random, foreground) {
  const endX = x + height * 0.32 * direction;
  const endY = y - height * 0.89;
  ctx.strokeStyle = foreground ? '#667d5b' : '#3f5754';
  ctx.lineWidth = foreground ? 5 : 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + height * 0.06 * direction, y - height * 0.94, endX, endY);
  ctx.stroke();
  const color = foreground ? [168, 177, 140] : [106, 133, 120];
  for (let index = 0; index < 7; index++) {
    const t = 0.38 + index * 0.08;
    const cx = x + height * t ** 2 * 0.31 * direction;
    const cy = y - height * (1.78 * t - 0.89 * t * t);
    const offX = cx + direction * (height * 0.08 + random() * 13);
    const offY = cy + (0.28 + random() * 0.4) * height * 0.07;
    stroke(ctx, cx, cy, offX, offY, foreground ? '#667d5b' : '#3f5754', 2);
    const scale = (1.07 - t * 0.64) * height / 18;
    ctx.fillStyle = tint(color, random() * 22 - 4);
    ctx.beginPath();
    ctx.moveTo(offX, offY - scale * 0.32);
    ctx.bezierCurveTo(offX - scale * 0.73, offY - scale * 0.23, offX - scale * 0.34, offY + scale * 0.44, offX - scale * 0.78, offY + scale * 0.66);
    ctx.quadraticCurveTo(offX, offY + scale * 0.95, offX + scale * 0.65, offY + scale * 0.59);
    ctx.bezierCurveTo(offX + scale * 0.25, offY + scale * 0.42, offX + scale * 0.57, offY - scale * 0.28, offX, offY - scale * 0.32);
    ctx.fill();
    disk(ctx, offX - scale * 0.03, offY + scale * 0.67, scale * 0.58, scale * 0.14, tint(color, -35), 0);
    disk(ctx, offX - scale * 0.18, offY + scale * 0.13, scale * 0.12, scale * 0.36, alpha([224, 221, 170], foreground ? 0.56 : 0.21), 0.17);
  }
  for (let index = 0; index < 6; index++) {
    leaf(ctx, x + (random() - 0.5) * 122, y - random() * height * 0.14, (0.42 + random() * 0.46) * height, -2.65 + random() * 1.69, tint(foreground ? [42, 75, 60] : [34, 59, 56], index * 8 - 11));
  }
}

function silk(ctx, cx, cy, scale, random) {
  const count = 23;
  const spokeEnds = Array.from({length:count}, (_, i) => {
    const angle = i / count * TAU + (random() - 0.5) * 0.08;
    const radius = 0.9 + random() * 0.36;
    const x = Math.cos(angle) * scale * radius;
    const y = Math.sin(angle) * scale * radius * 0.79;
    return [x, y];
  });
  for (const [x, y] of spokeEnds) {
    stroke(ctx, cx, cy, cx + x * 1.24, cy + y * 1.24, alpha([163, 191, 180], 0.23), 1.25);
  }
  for (let ring = 1; ring < 15; ring++) {
    const r = 0.095 + ring * 0.059;
    for (let i = 0; i < count; i++) {
      if (random() < 0.025) continue;
      const a = spokeEnds[i];
      const b = spokeEnds[(i + 1) % count];
      const rx = cx + a[0] * r;
      const ry = cy + a[1] * r;
      const nx = cx + b[0] * r;
      const ny = cy + b[1] * r;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo((rx + nx) / 2 + r * 1.2, (ry + ny) / 2 + r * 2, nx, ny);
      ctx.lineWidth = 0.8 + random() * 1.2;
      ctx.strokeStyle = alpha([186, 197, 177], 0.15 + 0.32 * random());
      ctx.stroke();
      if (random() < 0.31) drop(ctx, rx, ry, 1.5 + random() ** 2 * 5.3, [143, 189, 155], 0.5 + random() * 0.32);
    }
  }
  const beads = [[1,11,9.8],[4,8,8.6],[8,12,11.3],[12,7,8.3],[15,11,10.7],[20,9,9.2]];
  for (const [spoke, ring, radius] of beads) {
    const [x, y] = spokeEnds[spoke];
    const distance = 0.095 + ring * 0.059;
    const px = cx + x * distance;
    const py = cy + y * distance;
    light(ctx, px, py, radius * 1.6, radius * 1.8, [143, 191, 172], .13);
    drop(ctx, px, py, radius, [183, 215, 188], .89);
    disk(ctx, px - radius * .41, py - radius * .47, radius * .26, radius * .14, alpha([219, 232, 215], .69), -.21);
  }
}

function macroFactory(createCanvas, scene) {
  const [image, ctx] = plate(createCanvas);
  const random = seeded(scene.seed);
  const palette = scene.subject === 'bells' ? [117, 145, 109] : scene.subject === 'silk' ? [103, 145, 140] : [93, 136, 114];
  wash(ctx, '#101c26', '#2c4b48', '#182627');
  light(ctx, scene.subject === 'silk' ? 1150 : 760, 440, 850, 720, palette, 0.57);
  for (let index = 0; index < 29; index++) {
    const x = random() * W;
    const y = random() * H;
    const radius = 19 + random() * 85;
    light(ctx, x, y, radius, radius * 0.87, palette, 0.09 + random() * 0.18);
  }
  for (let index = 0; index < 39; index++) {
    const x = random() * (W + 140) - 70;
    const y = 822 + random() * 330;
    grasses(ctx, x, y, 70 + 150 * random(), ['#243d36', '#2f473a', '#334c39', '#405d4a'], random, 7);
  }
  if (scene.subject === 'fern') {
    disk(ctx, 388, 935, 745, 190, '#263a37', -0.08);
    for (let i = 0; i < 11000; i++) {
      const x = random() * 1330;
      const y = 806 + random() * 274;
      if (((x - 400) / 715) ** 2 + ((y - 946) / 177) ** 2 > 0.89) continue;
      disk(ctx, x, y, 0.7 + random() * 4, 0.55 + random() * 2.3, tint([49, 72, 51], (random() - 0.5) * 43));
    }
    for (let i = 0; i < 6; i++) {
      fernFrond(ctx, 250 + i * 155, 975 + random() * 48, 185 + random() * 253, (random() - 0.45) * 360, [51, 88, 62], random);
    }
  } else if (scene.subject === 'bells') {
    for (let i = 0; i < 17; i++) {
      const x = (i < 8 ? 380 : 1370) + (random() - 0.5) * 810;
      bells(ctx, x, 870 + random() * 245, 155 + random() * 267, i % 2 ? 1 : -1, random, false);
    }
  } else {
    const supports = [[0,880,492,120],[46,1120,523,-80],[1910,1020,1550,25],[1710,1100,1720,-120],[1380,1020,1580,-35]];
    for (const [x, y, ex, ey] of supports) {
      stroke(ctx, x, y, ex, ey, '#293b33', 14 + random() * 20);
      stroke(ctx, x + 7, y, ex + 4, ey, '#354a3d', 2.7);
      for (let i = 0; i < 14; i++) {
        const t = random();
        leaf(ctx, x + (ex - x) * t, y + (ey - y) * t, 64 + random() * 148, i % 2 ? -2.6 : -0.7, tint([46, 70, 53], random() * 24 - 10));
      }
    }
  }
  shade(ctx, random, 1.02);
  const [feature, f] = plate(createCanvas);
  const fx = scene.subject === 'bells' ? 925 : scene.subject === 'silk' ? 1040 : 658;
  const fy = scene.subject === 'silk' ? 518 : 970;
  if (scene.subject === 'fern') {
    fernFrond(f, fx - 73, fy + 32, 700, -319, [68, 100, 64], random);
    fernFrond(f, fx, fy, 718, 314, [83, 119, 73], random);
    fernFrond(f, fx + 79, fy - 40, 560, 474, [61, 99, 67], random);
    fernFrond(f, fx - 36, fy + 12, 458, -425, [60, 92, 65], random);
  } else if (scene.subject === 'bells') {
    bells(f, fx - 186, fy + 20, 568, -1, random, true);
    bells(f, fx, fy, 688, 1, random, true);
    bells(f, fx + 193, fy + 46, 435, 1, random, true);
  } else {
    silk(f, fx, fy, 410, random);
  }
  const motes = Array.from({length:18}, () => ({x: 380 + random() * 1200, y: 216 + random() * 680, p:random(), r:1 + random() * 3.5}));
  return (out, phase) => {
    const t = ((phase % 1) + 1) % 1;
    const clock = t * TAU;
    out.drawImage(image, 0, 0);
    out.save();
    out.translate(fx + Math.sin(clock) * 4, fy + Math.cos(clock) * 3);
    out.rotate(Math.sin(clock * 2 + 1) * (scene.subject === 'silk' ? 0.007 : 0.024));
    out.drawImage(feature, -fx, -fy);
    out.restore();
    for (const mote of motes) {
      const softness = 0.5 + 0.5 * Math.sin(clock + mote.p * TAU);
      const x = mote.x + 24 * Math.sin(clock + mote.p * TAU);
      const y = mote.y + 42 * Math.sin(clock + mote.p * TAU + 1.2);
      disk(out, x, y, mote.r, mote.r, alpha([170, 190, 147], 0.09 + softness * 0.19));
    }
  };
}

function stem(ctx, x, y, h, bend, kind, tone, angle) {
  const tipX = x + bend;
  const tipY = y - h;
  ctx.strokeStyle = tint(tone, -9);
  ctx.lineWidth = Math.max(0.8, h * 0.015);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + bend * 0.28, y - h * 0.49, tipX, tipY);
  ctx.stroke();
  if (kind === 'lavender') {
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(angle);
    for (let j = 0; j < 8; j++) {
      const sy = h * (0.008 - j * 0.027);
      const rx = h * (0.023 - 0.0016 * j);
      disk(ctx, -rx, sy, rx * 1.1, rx * 0.68, tint(tone, 11 + j * 2), -0.52);
      disk(ctx, rx, sy - 1.5, rx, rx * 0.61, tint(tone, j * 4 - 1), 0.48);
    }
    ctx.restore();
  } else if (kind === 'silver') {
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(angle - 0.35);
    for (let j = 0; j < 12; j++) {
      const t = j / 12;
      const sx = h * (0.11 - t * 0.1);
      const sy = -h * t * 0.34;
      stroke(ctx, 0, sy + h * 0.037, sx, sy - h * 0.051, tint(tone, 17 + t * 13), Math.max(1, h * 0.006));
      stroke(ctx, 0, sy + h * 0.039, -sx, sy - h * 0.054, tint(tone, 4 + t * 5), Math.max(1, h * 0.006));
    }
    ctx.restore();
  } else {
    disk(ctx, tipX + 1, tipY - h * 0.052, Math.max(2, h * 0.047), Math.max(4, h * 0.119), tint(tone, 12), angle);
    leaf(ctx, x + bend * 0.4, y - h * 0.51, h * 0.31, -0.84, tint(tone, -17));
  }
}

function meadowFactory(createCanvas, scene) {
  const [landscape, ctx] = plate(createCanvas);
  const random = seeded(scene.seed);
  const type = scene.plant;
  const moon = type === 'silver' ? [368, 359, 36] : type === 'lavender' ? [1470, 254, 26] : [1370, 361, 34];
  const sky = type === 'silver' ? [160,148,102] : type === 'lavender' ? [142,131,159] : [147,138,93];
  const ground = type === 'silver' ? [61,78,63] : type === 'lavender' ? [63,63,83] : [57,75,57];
  const vegetation = type === 'silver' ? [96,103,76] : type === 'lavender' ? [91,81,119] : [93,96,57];
  const creekCenter = t => 1247 - 727 * t + 107 * Math.sin(TAU * t * 0.57);
  const creekHalf = t => 5 + 266 * t ** 1.59;
  const inCreek = (x, y) => {
    const t = (y - 754) / 326;
    return t >= 0 && Math.abs(x - creekCenter(t)) < creekHalf(t);
  };
  wash(ctx, '#121d29', '#47565d', '#334738');
  light(ctx, moon[0], 565, 860, 360, sky, type === 'reed' ? 0.46 : 0.31);
  for (let i = 0; i < 83; i++) {
    const x = random() * W;
    const y = random() * 386;
    disk(ctx, x, y, random() * 1.2 + 0.3, random() * 1.2 + 0.3, alpha([199, 205, 204], 0.19 + random() * 0.29));
  }
  if (type === 'reed') light(ctx, 1244, 694, 694, 173, [177, 166, 115], 0.23);
  else {
    light(ctx, moon[0], moon[1], moon[2] * 4.1, moon[2] * 4.1, [196, 189, 151], 0.22);
    disk(ctx, moon[0], moon[1], moon[2], moon[2], tint([183,192,167], 2));
    disk(ctx, moon[0] + moon[2] * 0.38, moon[1] - moon[2] * 0.24, moon[2] * 0.89, moon[2] * 0.96, '#4b5a61');
  }
  hill(ctx, 618, 67, 0.0032, 1 + scene.seed, '#465954');
  hill(ctx, 652, 51, 0.0039, 2.1 + scene.seed, '#374d48');
  hill(ctx, type === 'reed' ? 749 : 708, type === 'reed' ? 40 : 53, 0.0024, 1.9 + scene.seed, tint(ground, -5));
  if (type === 'lavender') {
    const sx = 1105;
    const y0 = 674;
    for (let row = -5; row <= 6; row++) {
      const end = row * 291;
      ctx.fillStyle = tint(vegetation, -29 - Math.abs(row) * 1.4);
      ctx.beginPath();
      ctx.moveTo(sx + row * 16, y0 + Math.abs(row) * 1.62);
      ctx.bezierCurveTo(sx + end * 0.1, 768, sx + end * 0.49, 920, sx + end, H);
      ctx.lineTo(sx + end + 160, H);
      ctx.quadraticCurveTo(sx + end * 0.32 + 25, 820, sx + row * 16 + 7, y0);
      ctx.fill();
    }
  } else if (type === 'reed') {
    for (let i = 0; i <= 88; i++) {
      const t = i / 88;
      const cy = 754 + 326 * t;
      const cx = creekCenter(t);
      const w = creekHalf(t);
      stroke(ctx, cx - w, cy, cx + w, cy, tint([72, 102, 100], -31 * t + random() * 8), 5);
      for (let j = 0; j < 7; j++) {
        const x = cx + (random() - 0.5) * w * 1.93;
        stroke(ctx, x, cy, x + w * (0.02 + random() * 0.18), cy, alpha([166, 183, 156], 0.03 + 0.075 * random()), 1.15);
      }
    }
    for (let i = 0; i < 75; i++) {
      const x = random() * W;
      const y = 702 + random() * 87;
      if (inCreek(x, y)) continue;
      grasses(ctx, x, y, 12 + random() * 65, ['#3d5a45', '#465b46', '#536447'], random, 11);
    }
  }
  for (let i = 0; i < 5700; i++) {
    const x = random() * W;
    const t = random();
    const y = 737 + t * 345;
    if (type === 'reed' && inCreek(x, y)) continue;
    const depth = (type === 'lavender' ? random() * 0.58 : random()) * t;
    const length = 0.7 + depth * 13;
    ctx.fillStyle = tint(ground, (random() - 0.53) * 29 - 18 * t);
    ctx.fillRect(x, y, length, 0.45 + depth * 2.0);
  }
  for (let i = 0; i < 275; i++) {
    const x = random() * W;
    const y = 747 + random() * 352;
    if (type === 'reed' && inCreek(x, y)) continue;
    const h = 7 + ((y - 694) / 410) ** 2.1 * (23 + random() * 54);
    if (type === 'lavender') {
      const lane = Math.abs(Math.sin((x - 1092) / ((y - 682) * 0.23 + 12)));
      if (lane <= 0.43) continue;
    }
    stem(ctx, x, y, h, -h * (0.05 + random() * 0.17), type, vegetation.map(value => value - 22 + random() * 19 | 0), -0.18);
  }
  const [rim, rimCtx] = plate(createCanvas);
  shade(rimCtx, random, 0.85);

  const accents = Array.from({length:type === 'lavender' ? 52 : 74}, (_, i) => {
    const half = i % 2 ? -1 : 1;
    const y = 870 + random() ** 0.82 * 250;
    const t = Math.min(1, (y - 754) / 326);
    const x = type === 'reed'
      ? creekCenter(t) + half * (creekHalf(t) + 9 + random() * (half > 0 ? 370 : 630))
      : random() * (W + 160) - 80;
    const h = type === 'lavender' ? 31 + (y - 820) * (0.39 + random() * 0.34) : 48 + (y - 826) * (0.51 + random() * 0.43);
    return {x, y, h, p:random(), tone:vegetation.map(channel => channel + (random() - 0.52) * 24 | 0)};
  }).sort((a, b) => a.y - b.y);
  return (out, phase) => {
    const t = ((phase % 1) + 1) % 1;
    out.drawImage(landscape, 0, 0);
    light(out, moon[0] + Math.sin(t * TAU) * 155, 678, 365, 37, sky, 0.1);
    if (type === 'reed') {
      for (let i = 0; i < 24; i++) {
        const depth = 0.19 + 0.8 * i / 24;
        const width = creekHalf(depth);
        const y = 754 + 326 * depth;
        const x = creekCenter(depth) + Math.sin(t * TAU + i * 1.67) * width * 0.65;
        stroke(out, x, y, x + width * 0.28, y, alpha([149, 178, 157], 0.09 + 0.039 * Math.sin(t * TAU * 2 + i)), 1.2 + depth * 1.6);
      }
    }
    for (const item of accents) {
      const wind = Math.sin(t * TAU * 2 + item.p * 3 + item.x * 0.0022);
      const bend = item.h * (-0.1 + wind * 0.072 + Math.sin(t * TAU + item.p * 3.4) * 0.055);
      stem(out, item.x, item.y, item.h, bend, type, item.tone, bend / item.h);
    }
    out.drawImage(rim, 0, 0);
  };
}

const macros = [
  {id:'44',title:'이슬 맺힌 고사리 잎',slug:'dew-on-the-ferns',sound:'drips',soundLabel:'고사리 잎 끝의 드문 물방울',seed:4407,subject:'fern'},
  {id:'45',title:'새벽에 핀 은방울꽃',slug:'lily-bells-before-dawn',sound:'forest',soundLabel:'숲속의 가벼운 물소리',seed:4507,subject:'bells'},
  {id:'46',title:'이슬을 머금은 거미줄',slug:'dew-along-the-silk',sound:'wind',soundLabel:'풀잎을 스치는 잔바람',seed:4607,subject:'silk'},
];
const meadows = [
  {id:'47',title:'달빛을 받는 억새밭',slug:'moon-on-the-silver-grass',sound:'wind',soundLabel:'억새 사이를 움직이는 바람',seed:4707,plant:'silver'},
  {id:'48',title:'새벽빛에 흐르는 라벤더 밭',slug:'lavender-field-in-blue-hour',sound:'wind',soundLabel:'꽃밭 가장자리의 부드러운 바람',seed:4807,plant:'lavender'},
  {id:'49',title:'갈대 숲 너머 희미한 아침',slug:'first-light-beyond-the-reeds',sound:'wind',soundLabel:'갈대를 흔드는 바람',seed:4907,plant:'reed'},
];

function addScenes(configurations, factory) {
  module.exports.push(...configurations.map(scene => ({
    id:scene.id, title:scene.title, slug:scene.slug, sound:scene.sound, soundLabel:scene.soundLabel,
    createScene: createCanvas => factory(createCanvas, scene),
  })));
}
addScenes(macros, macroFactory);
addScenes(meadows, meadowFactory);

function shingledLeaf(ctx, x, y, size, color, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-size * 0.38, 0);
  for (let i = 0; i < 9; i++) {
    const a = (i * 0.27 + 0.02) * Math.PI;
    const radius = size * (i % 2 ? 0.44 : 0.77);
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function canopyBranch(ctx, x, y, dx, dy, width, depth, scene, random) {
  const lightness = depth === 3 ? -13 : depth === 2 ? -5 : 10 - depth * 2;
  const shoot = [x + dx, y + dy];
  const midpoint = [x + dx * (0.56 + random() * 0.14), y + dy * (0.33 + random() * 0.23)];
  ctx.strokeStyle = tint(scene.bark, lightness);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(...midpoint, ...shoot);
  ctx.stroke();
  if (width > 6) {
    ctx.lineWidth = width * 0.175;
    ctx.strokeStyle = alpha(scene.foliage, 0.19);
    ctx.beginPath();
    ctx.moveTo(x - width * 0.29, y - width * 0.17);
    ctx.quadraticCurveTo(midpoint[0] - width * 0.31, midpoint[1] - width * 0.14, shoot[0], shoot[1]);
    ctx.stroke();
  }
  if (depth > 0) {
    for (let index = 0; index < 4; index++) {
      const t = 0.31 + index * 0.177;
      const left = index % 2 === 0 ? 1 : -1;
      const startX = x * (1 - t) ** 2 + 2 * midpoint[0] * t * (1 - t) + shoot[0] * t * t;
      const startY = y * (1 - t) ** 2 + 2 * midpoint[1] * t * (1 - t) + shoot[1] * t * t;
      const branchScale = (0.31 + 0.19 * random()) * (depth === 1 ? 1.38 : 1);
      canopyBranch(ctx, startX, startY, (dx + left * dy * 0.74) * branchScale, (dy - left * dx * 0.74) * branchScale, width * (0.39 + random() * 0.23), depth - 1, scene, random);
    }
  }
  if (depth > 1) return;
  const length = Math.hypot(dx, dy);
  for (let index = 0; index < (scene.species === 'pine' ? 21 : 15); index++) {
    const t = 0.37 + random() * 0.76;
    const lx = x + dx * t + (random() - 0.5) * length * 0.51;
    const ly = y + dy * t + (random() - 0.5) * length * 0.47;
    const angle = Math.atan2(dy, dx);
    const size = 3 + length * (0.03 + random() * 0.22);
    if (scene.species === 'pine') {
      const needleLength = 10 + size * (0.8 + random() * 0.69);
      for (let twig = 0; twig < 3; twig++) {
        const direction = angle + (twig - 1) * 0.9 + (random() - 0.5) * 0.53;
        stroke(ctx, lx, ly, lx + Math.cos(direction) * needleLength, ly + Math.sin(direction) * needleLength, tint(scene.foliage, (random() - 0.5) * 33), 0.78 + random() * 2.4);
      }
    } else if (scene.species === 'maple') {
      const brightness = (random() - 0.5) * 37;
      const rotation = angle - 0.5 + random();
      const distance = scene.moon ? Math.hypot(lx - scene.moon[0], ly - scene.moon[1]) : 180;
      const edge = 202 + ((lx - 965) / 490) ** 2 * 735
        + 41 * Math.sin(lx * 0.023) + 21 * Math.cos(lx * 0.057);
      const openPath = scene.arch && ly > edge - size * 0.21;
      if (!openPath && (distance > 96 + size * 0.28 || (distance > 73 && size < 8))) {
        shingledLeaf(ctx, lx, ly, size * 1.15, tint(scene.foliage, brightness), rotation);
      }
    } else {
      const bloom = 2 + size * 0.7;
      for (let petal = 0; petal < 5; petal++) {
        const a = petal / 5 * TAU;
        disk(ctx, lx + Math.cos(a) * bloom * 0.55, ly + Math.sin(a) * bloom * 0.57, bloom * 0.68, bloom * 0.47, tint(scene.foliage, (random() - 0.5) * 34), a);
      }
      disk(ctx, lx, ly, bloom * 0.19, bloom * 0.19, '#bda698');
    }
  }
}

function canopyFactory(createCanvas, scene) {
  const [sky, ctx] = plate(createCanvas);
  const random = seeded(scene.seed);
  wash(ctx, '#101929', scene.species === 'maple' ? '#39404f' : '#344653', '#233341');
  const [mx, my, size] = scene.moon;
  light(ctx, mx, my, 885, 600, scene.species === 'blossom' ? [146, 150, 169] : [126, 156, 167], 0.26);
  for (let index = 0; index < 168; index++) {
    const x = random() * W;
    const y = random() * H;
    const size = 0.38 + random() ** 3 * 2.5;
    if (size > 1.9) light(ctx, x, y, size * 4.4, size * 4.4, [193, 212, 214], 0.17);
    disk(ctx, x, y, size, size * 0.95, alpha([182, 202, 213], 0.14 + random() * 0.48));
  }
  light(ctx, mx, my, size * 4.8, size * 4.8, [185, 194, 181], 0.46);
  disk(ctx, mx, my, size, size, '#b8c6bb');
  if (scene.species !== 'pine') disk(ctx, mx + size * 0.38, my - size * 0.18, size * 0.91, size * 0.94, scene.species === 'maple' ? '#4b5460' : '#53636e');
  else {
    for (let i = 0; i < 115; i++) {
      const rx = (random() - 0.5) * size * 2;
      const ry = (random() - 0.5) * size * 2;
      if (rx * rx + ry * ry < size * size * 0.91) disk(ctx, mx + rx, my + ry, 1 + random() * 4, 1 + random() * 2.2, alpha([121, 139, 137], 0.33));
    }
  }
  // Leaves can sway without exposing the straight edge of the drawing surface.
  const overscan = 10;
  const canopy = createCanvas(W + overscan * 2, H + overscan * 2);
  const foreground = canopy.getContext('2d');
  foreground.translate(overscan, overscan);
  foreground.lineCap = 'round';
  for (const shoot of scene.shoots) canopyBranch(foreground, ...shoot, 3, scene, random);
  const [rim, rimCtx] = plate(createCanvas);
  shade(rimCtx, random);
  const floaters = Array.from({length: scene.species === 'pine' ? 3 : 13}, () => ({
    x: 470 + 1050 * random(), y: 90 + 680 * random(), p:random(), r: 2.8 + random() * 5,
  }));
  return (out, phase) => {
    const t = ((phase % 1) + 1) % 1;
    const clock = t * TAU;
    out.drawImage(sky, 0, 0);
    light(out, mx + Math.sin(clock) * 310, my + 45 + Math.cos(clock) * 35, 700, 61, [104, 140, 152], 0.16);
    out.drawImage(canopy, Math.sin(clock) * 4 - overscan, Math.cos(clock) * 2 - overscan);
    for (const item of floaters) {
      const p = (t + item.p) % 1;
      const env = Math.sin(p * Math.PI) ** 2;
      const x = item.x + Math.sin(p * TAU) * 115;
      const y = item.y + p * 180;
      if (scene.species === 'maple') shingledLeaf(out, x, y, item.r * 2.1, alpha([180, 129, 74], env * 0.67), 2 * TAU * p);
      else if (scene.species === 'blossom') disk(out, x, y, item.r, item.r * 0.51, alpha([200, 173, 165], env * 0.65), p * TAU * 2);
      else light(out, x, y, item.r * 5, item.r * 5, [163, 191, 190], env * 0.24);
    }
    out.drawImage(rim, 0, 0);
  };
}

const canopies = [
  {id:'50',title:'소나무 끝에 걸린 달',slug:'moon-among-pine-needles',sound:'wind',soundLabel:'솔잎 사이를 지나는 바람',seed:5007,species:'pine',bark:[39,51,49],foliage:[34,65,57],moon:[1080,407,52],shoots:[[-12,1090,691,-430,111],[1938,1067,-579,-623,95],[-63,-32,673,316,73],[2005,-42,-514,307,96]]},
  {id:'51',title:'단풍나무 사이의 반달',slug:'crescent-through-the-maples',sound:'wind',soundLabel:'단풍잎을 스치는 바람',seed:5107,species:'maple',bark:[51,47,46],foliage:[99,61,46],moon:[685,772,49],shoots:[[-39,970,520,-725,107],[1928,1040,-711,-418,106],[1948,-80,-802,346,71],[386,-45,-145,497,66]]},
  {id:'52',title:'벚꽃 가지가 흔들리는 새벽 하늘',slug:'blossom-boughs-at-dawn',sound:'wind',soundLabel:'꽃잎을 스쳐 가는 바람',seed:5207,species:'blossom',bark:[58,52,57],foliage:[107,81,97],moon:[1310,362,37],shoots:[[-40,833,1118,-491,89],[-50,1030,756,-244,106],[1986,1120,-603,-636,76],[104,-62,530,316,48]]},
];
addScenes(canopies, canopyFactory);

function stone(ctx, x, y, width, height, rgb, random) {
  const corners = [
    [x + random() * width * 0.12, y + height * (0.1 + random() * 0.18)],
    [x + width * (0.59 + random() * 0.21), y + random() * height * 0.16],
    [x + width * (0.9 + random() * 0.1), y + height * (0.28 + random() * 0.27)],
    [x + width * (0.65 + random() * 0.31), y + height * (0.8 + random() * 0.2)],
    [x + width * (0.08 + random() * 0.14), y + height],
  ];
  ctx.beginPath();
  ctx.moveTo(...corners[0]);
  corners.slice(1).forEach(point => ctx.lineTo(...point));
  ctx.closePath();
  ctx.fillStyle = tint(rgb, (random() - 0.42) * 17);
  ctx.fill();
  ctx.save();
  ctx.clip();
  light(ctx, x + width * 0.37, y + height * 0.11, width * 0.8, height * 0.65, [150, 157, 136], 0.24);
  for (let i = 0; i < 16; i++) {
    const p = random() * width;
    const yy = y + (random() * 0.85 + 0.1) * height;
    stroke(ctx, x + p, yy, x + p + (1 + random() * 0.12 * width), yy - 0.5, alpha([27, 43, 40], random() * 0.25), 0.7 + random() * 1.4);
  }
  ctx.restore();
}

function pavilion(ctx, cx, y, scale, random) {
  ctx.save();
  ctx.translate(cx, y);
  ctx.scale(scale, scale);
  const groundLight = [172, 133, 80];
  light(ctx, 0, -7, 300, 97, groundLight, 0.22);
  ctx.fillStyle = '#253d3c';
  ctx.fillRect(-244, -23, 488, 24);
  ctx.fillStyle = '#4d5550';
  ctx.fillRect(-204, -28, 409, 11);
  ctx.fillStyle = '#3a4240';
  ctx.fillRect(-242, -41, 492, 15);
  for (let index = 0; index <= 4; index++) {
    const x = -207 + index * 104;
    if (index === 2) continue;
    ctx.fillStyle = index % 2 ? '#48504b' : '#615a4a';
    ctx.fillRect(x, -203, 15, 167);
    ctx.fillStyle = '#8a7756';
    ctx.fillRect(x + 3, -189, 3.5, 146);
    if (index < 4 && index !== 1) {
      stroke(ctx, x, -74, x + 112, -74, '#4a4d41', 8);
      for (let bar = 1; bar < 7; bar++) {
        stroke(ctx, x + 15 * bar, -67, x + 15 * bar, -44, '#494f46', 4);
      }
    }
  }
  ctx.beginPath();
  ctx.moveTo(-298, -219);
  ctx.quadraticCurveTo(-166, -226, -21, -336);
  ctx.quadraticCurveTo(146, -277, 278, -216);
  ctx.quadraticCurveTo(164, -215, -75, -213);
  ctx.lineTo(-263, -204);
  ctx.closePath();
  ctx.fillStyle = '#222e34';
  ctx.fill();
  ctx.strokeStyle = '#687370';
  ctx.lineWidth = 5;
  ctx.stroke();
  for (let row = 0; row <= 12; row++) {
    const p = row / 12;
    const x = 21 + p * 277;
    const y = -324 + p * 109;
    stroke(ctx, -x, y + p * 3, x * 0.86, y + 2, alpha([116, 124, 112], 0.26), 2);
    for (let t = 0; t < 20 * p; t++) {
      const q = Math.floor(t - p * 10) * 25 + (row % 2 ? 15 : 0);
      stroke(ctx, q, y - 8, q - 2, y + 1, alpha([6, 16, 19], 0.31), 2);
    }
  }
  stroke(ctx, -254, -203, 239, -203, '#494c42', 15);
  light(ctx, -13, -146, 130, 135, groundLight, 0.26);
  ctx.fillStyle = '#b89a66';
  ctx.fillRect(-24, -160, 23, 31);
  ctx.fillStyle = '#d6b87f';
  ctx.fillRect(-20, -154, 15, 22);
  stroke(ctx, -13, -200, -13, -160, '#817052', 2);
  for (let index = 0; index < 220; index++) {
    const x = (random() - 0.5) * 460;
    const y = -32 - random() * 11;
    ctx.fillStyle = alpha([14, 29, 32], 0.19);
    ctx.fillRect(x, y, 1 + random() * 7, 1);
  }
  ctx.restore();
}

function gardenFactory(createCanvas, scene) {
  const [room, ctx] = plate(createCanvas);
  const random = seeded(scene.seed);
  const variant = scene.structure;
  wash(ctx, '#14212d', '#41565a', '#293e3c');
  light(ctx, variant === 'pavilion' ? 1510 : 860, 391, 704, 440, [147, 170, 153], 0.32);
  for (let series = 0; series < 3; series++) {
    const shade = [53 - series * 6, 81 - series * 8, 74 - series * 6];
    for (let index = 0; index < 52; index++) {
      const x = index / 51 * W + (random() - 0.5) * 68;
      const y = 592 + series * 28 + random() * 36;
      const height = (0.31 + random()) * 644 + series * 49;
      const top = y - height;
      const drift = (random() - 0.5) * 70;
      const tone = tint(shade, (random() - 0.5) * 13);
      const base = 2 + series * 4 + random() * 8;
      ctx.beginPath();
      ctx.moveTo(x - base * 0.56, y);
      ctx.quadraticCurveTo(x * 0.997 + drift * 0.38 - base * 0.4, top + height * 0.41, x + drift, top);
      ctx.quadraticCurveTo(x + drift * 0.33 + base * 0.38, top + height * 0.55, x + base * 0.47, y);
      ctx.fillStyle = tone;
      ctx.fill();
      for (let twig = 0; twig < 4; twig++) {
        const t = 0.18 + twig * 0.128;
        const branchX = x + drift * (1 - t) * (1 - t);
        const yy = top + t * height;
        const side = twig % 2 ? -1 : 1;
        const tipX = branchX + side * (12 + random() * 68);
        const tipY = yy - 15 - random() * 47;
        stroke(ctx, branchX, yy, tipX, tipY, tone, 0.6 + series * 1.26);
        stroke(ctx, (branchX + tipX) / 2, (yy + tipY) / 2, tipX + side * 7, tipY - 16, tone, 0.7 + series * 0.19);
      }
    }
  }
  for (let x = 8; x < W; x += 23) {
    const y = 50 + random() * 105 + Math.sin(x * 0.009) * 47;
    if (variant === 'stairs' && Math.abs(x - 1490) < 280) continue;
    disk(ctx, x, y, random() * 53 + 8, 6 + random() * 28, alpha([36, 64, 55], 0.22 + random() * 0.14), random() * 0.9);
  }
  light(ctx, variant === 'stairs' ? 1440 : 880, 551, 1070, 111, [131, 158, 151], 0.17);
  hill(ctx, 640, 27, 0.0031, scene.seed, '#354c43');
  hill(ctx, 721, 45, 0.0027, scene.seed + 4.1, '#2b423b');
  for (let index = 0; index < 79; index++) {
    const x = random() * W;
    const y = 630 + random() * 120;
    disk(ctx, x, y, 40 + random() * 120, 19 + random() * 51, tint([43, 68, 53], (random() - 0.5) * 25), -0.15 + random() * 0.32);
  }

  if (variant === 'wall') {
    const wallHeight = 214;
    const top = x => 610 - x * .13 + Math.sin(x * .009) * 13;
    const foot = x => top(x) + wallHeight + 47;
    const course = Array.from({length: 45}, (_, i) => -50 + 36 * i);
    for (let i = 0; i < course.length; i++) {
      const x = course[i];
      light(ctx, x + 13, foot(x) + 3, 67, 31, [13, 29, 27], .15 + (i % 4) * .039);
    }

    ctx.beginPath();
    ctx.moveTo(course[0], top(course[0]) + 21);
    for (const x of course.slice(1)) {
      if (x > 1455) break;
      ctx.lineTo(x, top(x) + 19);
    }
    for (const x of course.slice().reverse()) ctx.lineTo(x, foot(x) - 5);
    ctx.closePath();
    ctx.fillStyle = '#394844';
    ctx.fill();

    for (let row = 0; row < 5; row++) {
      for (let x = -70 + row * -35; x < 1420 + row * 24; x += 91 + random() * 56) {
        const y = top(x) + row * wallHeight / 5;
        const width = Math.min(118 + random() * 41, 1435 + row * 30 - x);
        stone(ctx, x, y, width, 44 + random() * 22, row < 3 ? [83, 97, 88] : [65, 82, 73], random);
      }
    }
    for (let i = 0; i < course.length - 1; i++) {
      const x = course[i];
      const y = foot(x);
      stroke(ctx, x, y + 1, course[i + 1] + 4, foot(course[i + 1]) - 4, alpha([22, 41, 34], .4 + random() * .16), 3 + random() * 7);
      disk(ctx, x + random() * 24, y + 9, 9 + random() * 17, 2 + random() * 8, tint([38, 60, 43], random() * 15 - 7));
    }
    for (const [start, span, cover] of [[0,146,31],[184,183,26],[427,208,26],[708,117,21],[923,103,22],[1146,150,29],[1339,98,24]]) {
      for (let i = 0; i < span * .28; i++) {
        const x = start + random() * span;
        const y = top(x) + 4 + random() ** 1.6 * cover;
        disk(ctx, x, y, 2 + random() * 8, 1 + random() * 3.6, tint([61, 86, 60], random() * 29 - 17), random());
      }
    }
    for (let index = 0; index < 16; index++) fernFrond(ctx, 100 + random() * 1390, 887 + random() * 190, 69 + random() * 213, (random() - 0.4) * 320, [49, 82, 57], random);
  } else if (variant === 'stairs') {
    for (let step = 0; step < 21; step++) {
      const t = (step / 20) ** 1.77;
      const cx = 1390 - t * 884 + Math.sin(t * Math.PI) * 145;
      const y = 528 + t * 593;
      const width = 34 + t ** 0.85 * 740;
      const h = 6 + t * 76;
      ctx.fillStyle = tint([101, 111, 106], -10 - t * 24 + random() * 12);
      ctx.beginPath();
      ctx.moveTo(cx - width * 0.55, y);
      ctx.lineTo(cx + width * 0.42, y - 18 * t);
      ctx.lineTo(cx + width * 0.69, y + h * 0.37 - 12 * t);
      ctx.lineTo(cx - width * 0.59, y + h * 0.7);
      ctx.closePath();
      ctx.fill();
      stroke(ctx, cx - width * 0.59, y + h * 0.7, cx + width * 0.68, y + h * 0.37 - 12 * t, tint([94, 108, 101], -36 + t * 24), Math.max(1, h * 0.24));
      for (let crack = 0; crack < 7; crack++) {
        const x = cx + (random() - 0.5) * width;
        const dy = (random() - 0.65) * h * 0.5;
        stroke(ctx, x, y + dy, x + 4 + t * random() * 40, y + dy + t * 3.5, alpha([31, 51, 48], 0.35), Math.max(0.8, t * 1.6));
      }
      if (step % 2 === 0) {
        for (const left of [-1, 1]) stone(ctx, cx + left * (width * 0.69 + 26), y - t * 35, 19 + t * 54, 13 + t * 28, [62,79,74], random);
      }
    }
  } else {
    pavilion(ctx, 1138, 736, 1.13, random);
    for (let row = 0; row < 17; row++) {
      const t = row / 16;
      const x = 1123 - 428 * t + 15 * Math.sin(row);
      const y = 753 + t ** 1.4 * 340;
      const w = 7 + Math.pow(t, 1.52) * 165;
      disk(ctx, x, y, 18 + w, 3 + w * 0.15, tint([100, 110, 98], -14 - t * 26 + (random() - 0.5) * 15), -0.14);
      stroke(ctx, x - w * 1.1, y + 2, x + w * 0.93, y - t * 4, tint([83, 101, 89], -22 - t * 24), 1 + t * 3);
    }
  }
  for (let i = 0; i < 43; i++) {
    const y = 800 + random() * 330;
    const x = random() * W;
    const gap = variant === 'stairs' ? 1390 - 750 * ((y - 528) / 593) : variant === 'wall' ? 1500 : 1120 - 400 * ((y - 740) / 340);
    if (Math.abs(x - gap) < (variant === 'wall' ? 100 : 240)) continue;
    grasses(ctx, x, y, 25 + (y - 795) * random() * 0.51, ['#263e36', '#365147', '#3e604b', '#4e7252'], random, 13);
  }
  if (variant !== 'stairs') {
    const side = variant === 'pavilion' ? 30 : 1960;
    trailTree(ctx, 'bamboo', side, H + 10, 1040, 33, -82, '#28453b', [56, 81, 59], -17, random);
  }
  const [rim, rimCtx] = plate(createCanvas);
  shade(rimCtx, random);
  const motes = Array.from({length:12}, () => ({
    x: 480 + random() * 1200, y: 405 + random() * 434, r: 0.7 + random() * 2.2, p: random(),
  }));
  return (out, phase) => {
    const t = ((phase % 1) + 1) % 1;
    const clock = t * TAU;
    out.drawImage(room, 0, 0);
    light(out, 950 + Math.sin(clock) * 155, variant === 'stairs' ? 582 : 720, 662, 54, [139, 159, 143], 0.15 + Math.sin(clock * 2 + 0.8) * 0.021);
    if (variant === 'pavilion') light(out, 1124, 568, 137, 121, [180, 138, 84], 0.12 + Math.sin(clock * 2 + 1.8) * 0.022);
    if (variant === 'stairs') {
      light(out, 1390 + Math.sin(clock) * 181, 554 + Math.sin(clock + 0.9) * 16, 507, 35, [153, 181, 163], 0.19 + Math.cos(clock + 0.5) * 0.031);
      light(out, 990 + Math.sin(clock + 1.8) * 230, 605 + Math.sin(clock + 1.0) * 11, 650, 34, [132, 156, 151], 0.12);
    }
    for (const item of motes) {
      const h = 0.5 + 0.5 * Math.sin(clock * 2 + item.p * TAU);
      const x = item.x + 46 * Math.sin(clock + item.p * TAU);
      const y = item.y + 16 * Math.cos(clock + item.p * TAU);
      if (variant === 'wall') disk(out, x, y, item.r, item.r * 0.8, alpha([159, 187, 130], h * 0.36));
      else leaf(out, x, y, item.r * 4, h * Math.PI * 2, alpha([173, 175, 121], h * 0.38));
    }
    out.drawImage(rim, 0, 0);
  };
}

const gardens = [
  {id:'53',title:'이끼가 번진 오래된 돌담',slug:'moss-on-the-old-garden-wall',sound:'forest',soundLabel:'돌담 곁 숲의 작은 물소리',seed:5307,structure:'wall'},
  {id:'54',title:'숲속 안개가 덮은 돌계단',slug:'quiet-fog-on-the-stone-steps',sound:'wind',soundLabel:'계단을 따라 흐르는 잔바람',seed:5407,structure:'stairs'},
  {id:'55',title:'불 하나 켜진 숲속 정자',slug:'the-garden-pavilion-lamp',sound:'forest',soundLabel:'정자와 숲 사이의 고요한 숲소리',seed:5507,structure:'pavilion'},
];
addScenes(gardens, gardenFactory);
