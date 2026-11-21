const WIDTH = 1920;
const HEIGHT = 1080;
const TAU = 2 * Math.PI;

function randomGenerator(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function polygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
}

function shade(ctx, x, y, rx, ry, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, `rgba(${color},${alpha})`);
  gradient.addColorStop(0.37, `rgba(${color},${alpha * 0.51})`);
  gradient.addColorStop(0.76, `rgba(${color},${alpha * 0.106})`);
  gradient.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function valueNoise(random, width, height, step) {
  const columns = Math.ceil(width / step) + 2;
  const rows = Math.ceil(height / step) + 2;
  const values = Float32Array.from({ length: columns * rows }, random);
  return (x, y) => {
    const left = Math.floor(x / step);
    const top = Math.floor(y / step);
    const fx = x / step - left;
    const fy = y / step - top;
    const dx = fx * fx * (3 - 2 * fx);
    const dy = fy * fy * (3 - 2 * fy);
    const index = top * columns + left;
    const a = values[index] * (1 - dx) + values[index + 1] * dx;
    const b = values[index + columns] * (1 - dx) + values[index + columns + 1] * dx;
    return a * (1 - dy) + b * dy;
  };
}

function drawBricks(ctx, random) {
  ctx.fillStyle = '#110e11';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const bricks = [];
  for (let row = 0; row < 10; row++) {
    const y = 16 + row * 68;
    const inset = 190 + row * 10;
    for (let cell = -1; cell < 9; cell++) {
      const x = inset + cell * 207 + (row % 2 ? 100 : 0);
      const brightness = 12 + random() * 6 + row * 0.55;
      bricks.push({ x, y, w: 198 + random() * 3, h: 60 + random() * 3, brightness });
    }
  }

  for (const { x, y, w, h, brightness } of bricks) {
    const corners = [[x + 5, y + 2], [x + w - 9, y], [x + w, y + 7], [x + w - 2, y + h - 6], [x + w - 8, y + h], [x + 7, y + h - 1], [x, y + h - 8], [x + 1, y + 7]];
    const grad = ctx.createLinearGradient(x, y, x + 10, y + h);
    const light = brightness + 12 * Math.exp(-(((x + w / 2 - 960) / 520) ** 2 + ((y - 600) / 240) ** 2));
    grad.addColorStop(0, `rgb(${light + 9},${light * 0.66 + 1},${light * 0.56 + 6})`);
    grad.addColorStop(0.14, `rgb(${light + 3},${light * 0.69},${light * 0.66 + 4})`);
    grad.addColorStop(0.81, `rgb(${light + 4},${light * 0.71},${light * 0.65 + 4})`);
    grad.addColorStop(1, `rgb(${light - 2},${light * 0.51},${light * 0.53 + 3})`);
    polygon(ctx, corners);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 94; i++) {
      ctx.fillStyle = random() < 0.52 ? `rgba(1,0,2,${0.16 + random() * 0.52})` : `rgba(115,78,60,${0.045 + random() * 0.085})`;
      const size = 0.8 + random() ** 2 * 4;
      ctx.fillRect(x + random() * w, y + random() * h, size * 1.8, size);
    }
    ctx.restore();
  }

  shade(ctx, 725, 550, 307, 190, '152,88,52', 0.15);
  shade(ctx, 1154, 563, 353, 192, '147,85,52', 0.17);

  const floor = ctx.createLinearGradient(0, 595, 0, 983);
  floor.addColorStop(0, '#100b0a');
  floor.addColorStop(0.24, '#201411');
  floor.addColorStop(0.73, '#322019');
  floor.addColorStop(1, '#100d10');
  ctx.fillStyle = floor;
  polygon(ctx, [[360, 581], [1520, 581], [1853, 980], [51, 980]]);
  ctx.fill();
  shade(ctx, 960, 650, 580, 257, '166,51,27', 0.33);
  shade(ctx, 1210, 581, 365, 178, '194,60,22', 0.12);
  shade(ctx, 650, 577, 310, 178, '149,56,34', 0.15);

  for (let wall = 0; wall < 2; wall++) {
    ctx.save();
    if (wall) {
      ctx.translate(WIDTH, 0);
      ctx.scale(-1, 1);
    }
    const surround = ctx.createLinearGradient(30, 350, 470, 350);
    surround.addColorStop(0, '#17161b');
    surround.addColorStop(0.39, '#252025');
    surround.addColorStop(0.55, '#2b2429');
    surround.addColorStop(0.68, '#1c1417');
    surround.addColorStop(0.88, '#160f11');
    surround.addColorStop(1, '#1a1112');
    polygon(ctx, [[0, 0], [366, 0], [446, 580], [117, 938], [0, 950]]);
    ctx.fillStyle = surround;
    ctx.fill();
    ctx.save();
    ctx.clip();
    shade(ctx, 390, 631, 207, 256, '105,40,28', 0.18);
    shade(ctx, 16, 421, 307, 650, '4,3,8', 0.65);
    for (let row = 0; row < 9; row++) {
      const baseY = row * 107 - 40;
      const slope = 11 + row * 3.7;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      ctx.lineTo(205, baseY - slope * 0.35);
      ctx.lineTo(442, baseY - slope);
      ctx.strokeStyle = 'rgba(6,5,9,0.53)';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, baseY + 3);
      ctx.lineTo(205, baseY - slope * 0.35 + 3);
      ctx.lineTo(442, baseY - slope + 3);
      ctx.strokeStyle = 'rgba(80,55,54,0.21)';
      ctx.lineWidth = 2;
      ctx.stroke();
      const joinX = row % 2 ? 62 : 168;
      ctx.beginPath();
      ctx.moveTo(joinX, baseY);
      ctx.lineTo(joinX + 5, baseY + 105);
      ctx.strokeStyle = 'rgba(9,7,9,0.53)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }
  shade(ctx, 960, 90, 780, 420, '4,3,8', 0.72);
}

function drawCoal(ctx, random, x, y, radius, hot) {
  const sideCount = 7 + Math.floor(random() * 3);
  const sides = Array.from({ length: sideCount }, (_, i) => {
    const angle = i * TAU / sideCount;
    const r = radius * (0.7 + random() * 0.52);
    return [x + Math.cos(angle) * r, y + Math.sin(angle) * r * (0.47 + random() * 0.2)];
  });
  if (hot) shade(ctx, x, y - radius * 0.14, radius * 2.2, radius * 1.38, '221,47,9', 0.36 + random() * 0.24);
  polygon(ctx, sides);
  const base = 15 + random() * 23;
  ctx.fillStyle = `rgb(${base + 10},${base + 1},${base})`;
  ctx.fill();
  const center = [x + radius * (random() - 0.5) * 0.65, y - radius * 0.21];
  for (let i = 0; i < sideCount; i++) {
    const value = Math.max(11, base * (0.58 + random() * 0.8) + (i > sideCount / 2 ? 5 : 0));
    polygon(ctx, [center, sides[i], sides[(i + 1) % sideCount]]);
    ctx.fillStyle = `rgb(${value + 12},${value * 0.89 + 4},${value * 0.87 + 6})`;
    ctx.fill();
  }
  if (hot) {
    ctx.beginPath();
    ctx.moveTo(...sides[2]);
    ctx.lineTo(x + radius * 0.05, y + radius * 0.13);
    ctx.lineTo(x - radius * 0.1, y - radius * 0.17);
    ctx.lineTo(...sides[6]);
    ctx.strokeStyle = `rgba(236,${47 + Math.floor(random() * 38)},22,${0.23 + random() * 0.49})`;
    ctx.lineWidth = 0.5 + random() * 2.5;
    ctx.stroke();
  }
}

function charMosaic(ctx, random, longitudinal, hue) {
  const ashPatches = [
    { t: 0.16, u: -0.63, width: 0.22, height: 0.57 },
    { t: 0.45, u: -0.17, width: 0.25, height: 0.65 },
    { t: 0.82, u: 0.47, width: 0.28, height: 0.60 },
  ];
  for (const patch of ashPatches) {
    for (let i = 0; i < 120; i++) {
      const theta = random() * TAU;
      const distance = Math.sqrt(random());
      const t = patch.t + Math.cos(theta) * patch.width * distance;
      const u = patch.u + Math.sin(theta) * patch.height * distance;
      if (t < 0.008 || t > 0.988 || Math.abs(u) > 1.03) continue;
      const span = 0.008 + random() ** 1.6 * 0.088;
      const thickness = 0.025 + random() ** 1.3 * 0.19;
      const facets = [
        longitudinal(t - span * 0.58, u - thickness * 0.18),
        longitudinal(t - span * 0.34, u - thickness * 0.53),
        longitudinal(t + span * 0.22, u - thickness * 0.66),
        longitudinal(t + span * 0.57, u - thickness * 0.09),
        longitudinal(t + span * 0.29, u + thickness * 0.48),
        longitudinal(t - span * 0.17, u + thickness * 0.34),
      ];
      polygon(ctx, facets);
      const light = 14 + random() * hue * 1.37;
      ctx.fillStyle = `rgba(${light + 16},${light + 6},${light + 5},${(1 - distance * 0.84) * (0.28 + random() * 0.55)})`;
      ctx.fill();
      ctx.lineWidth = 0.5 + random() * 1.3;
      ctx.strokeStyle = `rgba(8,5,5,${(1 - distance * 0.68) * 0.62})`;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(...facets[0]);
      ctx.lineTo(...facets[1]);
      ctx.lineTo(...facets[2]);
      ctx.strokeStyle = `rgba(169,141,125,${(1 - distance * 0.82) * 0.16})`;
      ctx.stroke();
    }
  }
}

function drawWood(ctx, active, random, config) {
  const { start, end, radius, taper, hue, hot, bounce } = config;
  const vx = end[0] - start[0];
  const vy = end[1] - start[1];
  const length = Math.hypot(vx, vy);
  const nx = -vy / length;
  const ny = vx / length;
  const phase = random() * TAU;
  const longitudinal = (t, u) => {
    const thickness = radius * (1 - taper * t) * (1 + 0.065 * Math.sin(t * 11 + phase) + 0.045 * Math.cos(t * 40));
    const ripple = (Math.sin(t * 17 + phase) * 3.4 + Math.sin(t * 50) * 1.9) * (1 + Math.abs(u) * 0.3);
    return [start[0] + vx * t + nx * (u * thickness + ripple), start[1] + vy * t + ny * (u * thickness + ripple)];
  };
  const upper = Array.from({ length: 43 }, (_, i) => longitudinal(i / 42, -1 + random() * 0.085));
  const lower = Array.from({ length: 43 }, (_, i) => longitudinal(1 - i / 42, 1 - random() * 0.105));
  const body = [...upper, ...lower];
  const surface = ctx.createLinearGradient(start[0] - nx * radius, start[1] - ny * radius, start[0] + nx * radius, start[1] + ny * radius);
  surface.addColorStop(0, `rgb(${hue + 8},${hue - 3},${hue - 2})`);
  surface.addColorStop(0.22, `rgb(${hue + 10},${hue + 1},${hue + 2})`);
  surface.addColorStop(0.49, `rgb(${hue},${hue - 6},${hue - 5})`);
  surface.addColorStop(0.83, `rgb(${hue - 7},${hue - 9},${hue - 7})`);
  surface.addColorStop(1, `rgb(${hue + 11},${hue - 8},${hue - 9})`);
  active.save();
  active.globalCompositeOperation = 'destination-out';
  active.fillStyle = '#000';
  polygon(active, body);
  active.fill();
  active.restore();
  polygon(ctx, body);
  ctx.fillStyle = surface;
  ctx.fill();
  ctx.save();
  ctx.clip();
  shade(ctx, end[0], end[1], radius * 1.9, radius * 1.32, '222,57,17', hot * 0.31);
  const bands = 48;
  for (let line = 0; line < bands; line++) {
    const u = -1.03 + line * 2.06 / (bands - 1);
    const fuzz = 0.016 + random() * 0.038;
    const pointPhase = random() * TAU;
    const startT = 0.015 + random() ** 3 * 0.54;
    const finish = Math.min(1, startT + 0.11 + random() * 0.85);
    const strokes = Array.from({ length: 29 }, (_, i) => {
      const t = startT + (finish - startT) * i / 28;
      return longitudinal(t, u + fuzz * Math.sin(t * 59 + pointPhase) + 0.027 * Math.sin(t * 21 + pointPhase));
    });
    const light = random();
    const width = 0.35 + random() ** 2 * 6.1;
    for (const [target, bump, color] of [[ctx, -1, `rgba(107,78,68,${0.042 + light * 0.13})`], [ctx, 1, `rgba(3,2,3,${0.09 + light * 0.54})`]]) {
      target.beginPath();
      target.moveTo(strokes[0][0] + nx * bump, strokes[0][1] + ny * bump);
      for (const point of strokes.slice(1)) target.lineTo(point[0] + nx * bump, point[1] + ny * bump);
      target.lineWidth = width;
      target.strokeStyle = color;
      target.stroke();
    }
  }
  for (let i = 0; i < 1850; i++) {
    const t = random();
    const u = random() * 2 - 1;
    const point = longitudinal(t, u);
    const l = 0.7 + random() ** 3 * 12;
    ctx.fillStyle = random() < 0.52 ? `rgba(2,1,2,${0.07 + random() * 0.46})` : `rgba(118,105,101,${0.035 + random() * 0.17})`;
    ctx.fillRect(point[0], point[1], l, 0.55 + l * 0.18);
  }
  charMosaic(ctx, random, longitudinal, hue);
  for (const [along, strength] of bounce) {
    const [x, y] = longitudinal(along, 0.50);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(vy, vx));
    shade(ctx, 0, 0, radius * 2.6, radius * 1.05, '184,109,66', strength);
    ctx.restore();
  }
  const glowingZones = [0.18, 0.36, 0.57, 0.83];
  for (const t of glowingZones) {
    if (random() > hot) continue;
    const position = t + (random() - 0.5) * 0.1;
    const startU = 0.69 + random() * 0.28;
    const endU = -0.58 + random() * 0.92;
    const points = Array.from({ length: 16 }, (_, index) => {
      const amount = index / 15;
      return longitudinal(position + 0.03 * amount + (random() - 0.5) * 0.012, startU + (endU - startU) * amount);
    });
    for (let i = 0; i < points.length - 1; i++) {
      const [x, y] = points[i];
      const [x2, y2] = points[i + 1];
      const localGlow = (0.36 + random() * 0.52) * (1 - 0.66 * i / points.length);
      for (const [target, color, width] of [[ctx, `rgba(203,46,12,${localGlow * 0.52})`, 6.8], [ctx, `rgba(11,3,3,${localGlow})`, 3.7], [active, `rgba(246,56,19,${localGlow * 0.61})`, 3.7], [active, `rgba(255,${66 + Math.floor(random() * 84)},37,${localGlow * 0.85})`, 0.45 + random() * 1.65]]) {
        target.beginPath();
        target.moveTo(x, y);
        target.lineTo(x2, y2);
        target.lineWidth = width;
        target.strokeStyle = color;
        target.stroke();
      }
    }
  }
  ctx.restore();

  // The split face is irregular, with ash caught along its exposed outer edge.
  ctx.save();
  const orientation = Math.atan2(vy, vx);
  ctx.translate(start[0], start[1]);
  ctx.rotate(orientation);
  const edge = Array.from({ length: 21 }, (_, i) => {
    const angle = i * TAU / 21;
    const jagged = 0.9 + random() * 0.2;
    return [Math.cos(angle) * radius * 0.46 * jagged - 2, Math.sin(angle) * radius * jagged];
  });
  polygon(ctx, edge);
  const grainColor = ctx.createLinearGradient(-radius / 2, -radius, radius * 0.3, radius);
  grainColor.addColorStop(0, `rgb(${hue + 10},${hue + 2},${hue + 4})`);
  grainColor.addColorStop(0.57, `rgb(${hue + 4},${hue - 2},${hue - 1})`);
  grainColor.addColorStop(1, `rgb(${hue - 6},${hue - 10},${hue - 8})`);
  ctx.fillStyle = grainColor;
  ctx.fill();
  ctx.clip();
  for (let ring = 1; ring < 17; ring++) {
    ctx.beginPath();
    for (let i = 0; i <= 54; i++) {
      const angle = i * TAU / 54;
      const radiusAt = ring / 16 * (radius + Math.cos(angle * 3 + phase) * 5 + Math.cos(angle * 7) * 2) - random() * 0.9;
      const x = Math.cos(angle) * radiusAt * 0.45 - ring * 0.2;
      const y = Math.sin(angle) * radiusAt + ring * 0.13;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = ring % 3 ? 'rgba(3,2,3,0.24)' : 'rgba(115,95,87,0.15)';
    ctx.lineWidth = 0.8 + random() * 2;
    ctx.stroke();
  }
  for (let i = 0; i < 7; i++) {
    const angle = random() * TAU;
    ctx.beginPath();
    for (let index = 0; index <= 12; index++) {
      const r = (0.16 + 0.84 * index / 12) * radius;
      const x = Math.cos(angle) * r * 0.49 + random() * 4 - 2;
      const y = Math.sin(angle) * r + random() * 4 - 2;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineWidth = 1.1 + random() * 2.5;
    ctx.strokeStyle = 'rgba(3,1,2,0.72)';
    ctx.stroke();
  }
  ctx.restore();
}

function makeHotPocket(createCanvas, random, config) {
  const surface = createCanvas(256, 128);
  const ctx = surface.getContext('2d');
  shade(ctx, 128, 67, 108, 51, '218,69,18', 0.35);
  shade(ctx, 127, 70, 78, 26, '255,73,12', 0.29);
  for (let n = 0; n < 168; n++) {
    const angle = random() * TAU;
    const distance = Math.sqrt(random());
    const x = 128 + Math.cos(angle) * distance * 101;
    const y = 71 + Math.sin(angle) * distance * 26;
    const length = 0.55 + random() ** 2.7 * 7.1;
    const light = (0.97 - distance * 0.62) * (0.22 + random() * 0.73);
    const color = Math.round(70 + random() ** 1.5 * 102);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length * 0.59, y - length * (random() * 0.89 - 0.2));
    ctx.lineTo(x + length, y + length * (random() * 0.59 - 0.24));
    ctx.lineWidth = 0.55 + random() * Math.min(1.7, length * 0.23);
    ctx.strokeStyle = `rgba(255,${color},${color * 0.27},${light})`;
    ctx.stroke();
  }
  return { surface, ...config };
}

function applyTexture(ctx, createCanvas, random) {
  const texture = createCanvas(960, 540);
  const surface = texture.getContext('2d');
  const data = surface.createImageData(texture.width, texture.height);
  const broad = valueNoise(random, texture.width, texture.height, 34);
  const middle = valueNoise(random, texture.width, texture.height, 9);
  const small = valueNoise(random, texture.width, texture.height, 3);
  for (let y = 0; y < texture.height; y++) {
    for (let x = 0; x < texture.width; x++) {
      const value = (broad(x, y) - 0.5) * 16 + (middle(x, y) - 0.5) * 13 + (small(x, y) - 0.5) * 11 + (random() - 0.5) * 11;
      const offset = (y * texture.width + x) * 4;
      const light = value > 0;
      data.data[offset] = light ? 120 : 0;
      data.data[offset + 1] = light ? 105 : 0;
      data.data[offset + 2] = light ? 101 : 4;
      data.data[offset + 3] = Math.abs(value) * (light ? 1.37 : 4.7);
    }
  }
  surface.putImageData(data, 0, 0);
  ctx.drawImage(texture, 0, 0, WIDTH, HEIGHT);
}

module.exports = {
  title: '잿불이 남은 벽난로',
  slug: 'quiet-hearth',
  sound: 'embers',
  createScene(createCanvas) {
    const random = randomGenerator(412089);
    const background = createCanvas(WIDTH, HEIGHT);
    const ctx = background.getContext('2d');
    const liveCracks = createCanvas(WIDTH, HEIGHT);
    const live = liveCracks.getContext('2d');
    drawBricks(ctx, random);

    shade(ctx, 947, 733, 682, 244, '5,3,5', 0.92);
    shade(ctx, 965, 742, 460, 134, '238,53,11', 0.41);
    shade(ctx, 733, 704, 277, 87, '204,44,15', 0.53);
    shade(ctx, 1180, 697, 304, 111, '204,44,15', 0.35);

    const floorAsh = Array.from({ length: 2130 }, () => {
      const angle = random() * TAU;
      const distance = Math.sqrt(random());
      return [960 + Math.cos(angle) * distance * 710, 745 + Math.sin(angle) * distance * 198];
    });
    for (const [x, y] of floorAsh) {
      const r = random() ** 4 * 6 + 0.35;
      const alpha = 0.11 + random() * 0.44;
      ctx.fillStyle = random() > 0.53 ? `rgba(133,95,81,${alpha * 0.52})` : `rgba(9,7,9,${alpha})`;
      ctx.fillRect(x, y, r * 2, r * 0.7);
    }

    const coals = Array.from({ length: 424 }, () => {
      const angle = random() * TAU;
      const distance = Math.sqrt(random());
      const x = 960 + Math.cos(angle) * distance * (470 + 80 * random());
      const y = 730 + Math.sin(angle) * distance * (86 + 22 * random());
      return { x, y, radius: 1.1 + random() ** 2.45 * 25, hot: random() > 0.71 && distance < 0.9 };
    }).sort((a, b) => a.y - b.y);
    for (const coal of coals) drawCoal(ctx, random, coal.x, coal.y, coal.radius, coal.hot);

    drawWood(ctx, live, random, { start: [1285, 625], end: [809, 509], radius: 56, taper: 0.43, hue: 24, hot: 0.51, bounce: [[0.33, 0.09], [0.76, 0.10]] });
    drawWood(ctx, live, random, { start: [545, 693], end: [1254, 556], radius: 66, taper: 0.36, hue: 32, hot: 0.87, bounce: [[0.30, 0.22], [0.69, 0.17]] });
    drawWood(ctx, live, random, { start: [1242, 731], end: [801, 613], radius: 53, taper: 0.46, hue: 25, hot: 0.89, bounce: [[0.20, 0.17], [0.68, 0.23]] });
    drawWood(ctx, live, random, { start: [736, 761], end: [1117, 720], radius: 24, taper: 0.41, hue: 21, hot: 0.73, bounce: [[0.42, 0.10], [0.81, 0.12]] });

    for (const coal of coals) {
      if (coal.y > 767 && random() < 0.47) drawCoal(ctx, random, coal.x, coal.y + 9, coal.radius * 0.75, coal.hot);
    }

    const points = [];
    for (let i = 0; i < 1120; i++) {
      const group = random();
      const x = group < 0.4 ? 720 + (random() - 0.5) * 215 : group < 0.76 ? 1012 + (random() - 0.5) * 260 : 1232 + (random() - 0.5) * 188;
      const y = 739 + (random() - 0.5) * (34 + random() * 57);
      const size = 0.34 + random() ** 3.9 * 2.9;
      if (random() > 0.77) points.push({ x, y, size, phase: random() * TAU, period: random() > 0.67 ? 2 : 1, brightness: 0.17 + random() * 0.67, tint: Math.round(46 + random() * 76) });
      live.fillStyle = `rgba(243,${Math.round(49 + random() * 95)},22,${0.06 + random() * 0.42})`;
      live.fillRect(x, y, size * 1.15, size * 0.64);
    }
    applyTexture(ctx, createCanvas, random);

    const vignette = createCanvas(960, 540);
    const vignetteContext = vignette.getContext('2d');
    vignetteContext.save();
    vignetteContext.translate(480, 339);
    vignetteContext.scale(1.34, 1);
    const darkness = vignetteContext.createRadialGradient(0, 0, 116, 0, 0, 519);
    darkness.addColorStop(0, 'rgba(5,4,8,0)');
    darkness.addColorStop(0.47, 'rgba(5,4,8,0.07)');
    darkness.addColorStop(0.73, 'rgba(5,4,8,0.55)');
    darkness.addColorStop(1, 'rgba(5,4,8,0.94)');
    vignetteContext.fillStyle = darkness;
    vignetteContext.fillRect(-390, -350, 780, 565);
    vignetteContext.restore();

    const pockets = [
      { x: 704, y: 732, scale: 0.78, offset: 0.25, harmonic: 2 },
      { x: 969, y: 768, scale: 0.9, offset: 2.42, harmonic: 1 },
      { x: 1248, y: 746, scale: 0.72, offset: 4.19, harmonic: 2 },
    ].map(config => makeHotPocket(createCanvas, random, config));
    const floating = [
      { x: 699, y: 686, lift: 178, offset: 0.04 },
      { x: 1017, y: 699, lift: 141, offset: 0.27 },
      { x: 1154, y: 685, lift: 166, offset: 0.48 },
      { x: 798, y: 653, lift: 139, offset: 0.71 },
      { x: 956, y: 673, lift: 95, offset: 0.92 },
    ].map(speck => ({
      ...speck, drift: 18 + random() * 35, phase: random() * TAU,
      size: 1.5 + random() * 1.45, opacity: 0.38 + random() * 0.29,
    }));

    return (out, phase) => {
      const angle = TAU * (phase % 1);
      out.save();
      out.translate(929, 603);
      out.scale(1.22, 1.22);
      out.translate(-1019, -648);
      out.drawImage(background, 0, 0);
      shade(out, 722, 726, 332, 114, '210,48,13', 0.085 + 0.029 * Math.sin(angle + 1.7));
      shade(out, 1078, 706, 474, 154, '189,45,14', 0.071 + 0.022 * Math.cos(angle * 2 - 1.4));
      shade(out, 989, 555, 302, 169, '155,86,51', 0.041 + 0.014 * Math.cos(angle + 1.8));
      for (const pocket of pockets) {
        const heat = 0.5 + 0.39 * Math.cos(angle * pocket.harmonic + pocket.offset) + 0.11 * Math.sin(angle + pocket.offset * 2);
        const width = pocket.surface.width * pocket.scale;
        const height = pocket.surface.height * pocket.scale;
        shade(out, pocket.x - 10, pocket.y - 52, 163, 72, '201,68,21', 0.023 + heat * 0.093);
        out.save();
        out.globalAlpha = 0.21 + heat * 0.66;
        out.drawImage(pocket.surface, pocket.x - width / 2, pocket.y - height * 0.54, width, height);
        out.restore();
      }
      out.save();
      out.globalAlpha = 0.7 + 0.13 * Math.sin(angle - 0.7) + 0.07 * Math.cos(angle * 2 + 1);
      out.drawImage(liveCracks, 0, 0);
      out.restore();
      for (const ember of points) {
        const brightness = ember.brightness * (0.67 + 0.33 * Math.cos(angle * ember.period + ember.phase));
        out.fillStyle = `rgba(239,${ember.tint},30,${brightness})`;
        out.fillRect(ember.x, ember.y, ember.size, ember.size * 0.74);
      }
      for (const speck of floating) {
        const age = (phase + speck.offset) % 1;
        const alpha = Math.sin(Math.PI * age) ** 4 * speck.opacity;
        const x = speck.x + Math.sin(age * 2.5 + speck.phase) * speck.drift;
        const y = speck.y - age * speck.lift;
        shade(out, x, y, speck.size * 3.9, speck.size * 3.9, '248,83,35', alpha * 0.47);
        out.fillStyle = `rgba(251,137,65,${alpha})`;
        out.beginPath();
        out.ellipse(x, y, speck.size * 0.57, speck.size * 0.8, 0.34, 0, TAU);
        out.fill();
      }
      out.drawImage(vignette, 0, 0, WIDTH, HEIGHT);
      out.restore();
    };
  },
};
