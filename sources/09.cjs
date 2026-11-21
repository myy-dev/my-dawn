'use strict';

const width = 1920;
const height = 1080;
const tau = Math.PI * 2;
const auroraFrames = 24;
const clamp = (value, lower = 0, upper = 1) => Math.max(lower, Math.min(upper, value));
const lerp = (from, to, fraction) => from + (to - from) * fraction;
const ease = value => {
  const fraction = clamp(value);
  return fraction * fraction * (3 - 2 * fraction);
};

function randomGenerator(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function hash(x, y) {
  const value = Math.imul(x ^ 1433, 374761393) + Math.imul(y ^ 23817, 668265263);
  return ((Math.imul(value ^ (value >>> 13), 1274126177) ^ (value >>> 16)) >>> 0) / 4294967295;
}

function noise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const dx = ease(x - ix);
  const dy = ease(y - iy);
  const top = lerp(hash(ix, iy), hash(ix + 1, iy), dx);
  const bottom = lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), dx);
  return lerp(top, bottom, dy);
}

function fillPolygon(ctx, points, style) {
  ctx.beginPath();
  for (const [index, [x, y]] of points.entries()) {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = style;
  ctx.fill();
}

function stroke(ctx, points, color, weight) {
  ctx.beginPath();
  for (const [index, [x, y]] of points.entries()) {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  ctx.stroke();
}

function glow(ctx, x, y, radius, color, strength, innerStop = 0.15) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${color},${strength})`);
  gradient.addColorStop(innerStop, `rgba(${color},${strength * 0.75})`);
  gradient.addColorStop(0.55, `rgba(${color},${strength * 0.25})`);
  gradient.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function buildSky(createCanvas) {
  const sky = createCanvas(width, height);
  const ctx = sky.getContext('2d');
  const backdrop = ctx.createLinearGradient(0, 0, 0, 870);
  backdrop.addColorStop(0, '#060c1d');
  backdrop.addColorStop(0.41, '#0c182e');
  backdrop.addColorStop(0.74, '#183347');
  backdrop.addColorStop(1, '#415762');
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, width, height);

  const mist = createCanvas(640, 288);
  const mistCtx = mist.getContext('2d');
  const image = mistCtx.createImageData(mist.width, mist.height);
  for (let y = 0; y < mist.height; y++) {
    for (let x = 0; x < mist.width; x++) {
      const drift = y - 100 + x * 0.205 - Math.sin(x / 73) * 14;
      const envelope = Math.exp(-Math.pow(drift / 45, 2)) * (0.45 + 0.55 * ease(x / 350));
      const cloud = noise(x / 42, y / 26) * 0.54 + noise(x / 17, y / 15) * 0.29 + noise(x / 9, y / 6) * 0.17;
      const index = (y * mist.width + x) * 4;
      image.data[index] = 82;
      image.data[index + 1] = 103;
      image.data[index + 2] = 145;
      image.data[index + 3] = Math.round(envelope * cloud * 40);
    }
  }
  mistCtx.putImageData(image, 0, 0);
  ctx.drawImage(mist, 0, 0, width, 864);
  glow(ctx, 1200, 744, 740, '92,139,143', 0.17);

  const random = randomGenerator(5541);
  for (let i = 0; i < 1180; i++) {
    const x = random() * width;
    const broadY = random() * 815;
    const clusteredY = 324 - x * 0.18 + (random() + random() - 1) * 240;
    const y = i < 850 ? broadY : clusteredY;
    const size = 0.32 + Math.pow(random(), 5) * 1.36;
    const alpha = (0.17 + Math.pow(random(), 2.4) * 0.71) * (1 - y / 1160);
    const warm = random() > 0.79;
    const color = warm ? '233,213,201' : '194,219,247';
    if (size > 1.22) glow(ctx, x, y, 6.8 + size * 2, color, alpha * 0.27);
    ctx.fillStyle = `rgba(${color},${clamp(alpha)})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, tau);
    ctx.fill();
  }

  for (const [x, y, size] of [[432, 173, 1.9], [1206, 102, 2.2], [1438, 235, 2.3], [1691, 163, 1.8], [776, 132, 1.85]]) {
    glow(ctx, x, y, 17, '111,153,220', 0.32);
    stroke(ctx, [[x - 4.7, y], [x + 4.7, y]], 'rgba(160,203,250,.33)', 0.9);
    stroke(ctx, [[x, y - 5], [x, y + 5]], 'rgba(160,203,250,.33)', 0.9);
    glow(ctx, x, y, size * 2.2, '218,236,252', 0.8, 0.27);
  }
  return sky;
}

const curtains = [
  {shift: -0.11, level: 322, lift: 136, spread: 82, cycles: 2.8, power: 0.47, top: '90,104,182', middle: '69,151,190', base: '116,215,196'},
  {shift: 0.02, level: 466, lift: 176, spread: 188, cycles: 3.25, power: 0.93, top: '117,95,178', middle: '63,161,151', base: '142,244,194'},
  {shift: 0.19, level: 536, lift: 114, spread: 105, cycles: 3.65, power: 0.38, top: '79,95,171', middle: '50,155,151', base: '99,203,170'},
];

function drawCurtain(ctx, curtain, phase) {
  const rotation = phase * tau;
  const stripeCount = 440;
  for (let stripe = 0; stripe < stripeCount; stripe++) {
    const fraction = stripe / (stripeCount - 1);
    const n = fraction + curtain.shift;
    const sweep = n * 10.4 + Math.sin(rotation) * 0.16;
    const cloud = noise(n * 21 + Math.cos(rotation) * 0.36, 3 + curtain.shift * 44 + Math.sin(rotation) * 0.36);
    const filament = Math.pow(noise(n * 125 + Math.sin(rotation) * 0.27, 91 + curtain.shift * 43), 1.7);
    const fold = Math.sin(tau * n * curtain.cycles + Math.sin(rotation + n * 3) * 0.18);
    const broadArc = Math.sin(n * Math.PI * 0.94 + 0.12);
    const taper = ease(fraction / 0.14) * ease((1 - fraction) / 0.15);
    const x = -185 + 2350 * fraction + 90 * fold + 26 * Math.sin(sweep * 3.2) + Math.cos(rotation + n * 5) * 15;
    const y = curtain.level - curtain.lift * broadArc + 58 * Math.sin(sweep) + 34 * fold + Math.sin(rotation + n * 7) * 14;
    const drop = (curtain.spread + cloud * 74 + Math.sin(sweep * 1.75) * 32) * (0.6 + 0.4 * taper);
    const lean = 47 + 24 * fold + 21 * Math.cos(n * 6 + rotation);
    const rayContrast = 0.43 + filament * (0.88 - filament * 0.30);
    const brightness = taper * curtain.power * (0.28 + cloud * 0.6) * rayContrast;
    const gradient = ctx.createLinearGradient(x + lean, y - drop, x, y + 36);
    gradient.addColorStop(0, `rgba(${curtain.top},0)`);
    gradient.addColorStop(0.2, `rgba(${curtain.top},${brightness * 0.21})`);
    gradient.addColorStop(0.65, `rgba(${curtain.middle},${brightness * 0.64})`);
    gradient.addColorStop(0.88, `rgba(${curtain.base},${brightness})`);
    gradient.addColorStop(0.94, `rgba(${curtain.middle},${brightness * 0.4})`);
    gradient.addColorStop(1, `rgba(${curtain.middle},0)`);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8.6 + filament * 6.1;
    ctx.beginPath();
    ctx.moveTo(x + lean, y - drop);
    ctx.quadraticCurveTo(x + lean * 0.17, y - drop * 0.51, x, y + 36);
    ctx.stroke();
  }
}

function buildAurora(createCanvas, phase, sky) {
  const captured = createCanvas(960, 365);
  const ctx = captured.getContext('2d');
  ctx.scale(0.5, 0.5);
  ctx.drawImage(sky, 0, 0);
  const diffuse = createCanvas(480, 185);
  const veil = diffuse.getContext('2d');
  veil.scale(0.25, 0.25);
  for (const curtain of curtains) drawCurtain(veil, curtain, phase);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.69;
  ctx.filter = 'blur(13px)';
  ctx.drawImage(diffuse, 0, 0, 1920, 740);
  ctx.filter = 'none';
  ctx.globalAlpha = 0.47;
  ctx.drawImage(diffuse, 0, 0, 1920, 740);
  return captured;
}

function sampleProfile(points, x) {
  let start = points[0];
  for (const endpoint of points.slice(1)) {
    if (x <= endpoint[0]) return lerp(start[1], endpoint[1], (x - start[0]) / (endpoint[0] - start[0]));
    start = endpoint;
  }
  return start[1];
}

function drawSnowFaces(ctx, facets, seed) {
  const random = randomGenerator(seed * 239);
  for (const [index, {points, color, depth}] of facets.entries()) {
    const serrated = [];
    const top = Math.min(...points.map(([, y]) => y));
    const bottom = Math.max(...points.map(([, y]) => y));
    for (const [side, [x, y]] of points.entries()) {
      const [nextX, nextY] = points[(side + 1) % points.length];
      const distance = Math.hypot(nextX - x, nextY - y);
      const subdivisions = Math.max(2, Math.ceil(distance / 9));
      for (let part = 0; part < subdivisions; part++) {
        const u = part / subdivisions;
        const currentX = lerp(x, nextX, u);
        const currentY = lerp(y, nextY, u);
        const relief = Math.sin(Math.PI * u) * (noise(currentX / 19, seed + index + side * 4) - 0.5);
        const depthWeight = ease((currentY - top) / 34);
        const amplitude = (7 + depthWeight * 23) * lerp(0.7, 1, depth);
        serrated.push([
          currentX + (nextY - y) * relief * amplitude / distance,
          currentY - (nextX - x) * relief * amplitude / distance,
        ]);
      }
    }
    const light = ctx.createLinearGradient(0, top - 5, 0, bottom + 2);
    light.addColorStop(0, `rgba(${color},${0.25 * depth})`);
    light.addColorStop(0.38, `rgba(${color},${0.21 * depth})`);
    light.addColorStop(0.71, `rgba(${color},${0.09 * depth})`);
    light.addColorStop(1, `rgba(${color},0)`);
    ctx.save();
    ctx.filter = 'blur(1.8px)';
    fillPolygon(ctx, serrated, light);
    ctx.filter = 'none';
    for (let pocket = 0; pocket < 24; pocket++) {
      const anchor = points[1];
      const fraction = Math.pow(random(), 0.88);
      const y = lerp(top + 5, bottom - 10, fraction) + random() * 5;
      const direction = index % 3 === 0 ? -1 : 1;
      const x = anchor[0] + direction * (8 + random() * 73) * fraction + (random() - 0.5) * 15;
      const span = 5 + (8 + random() * 29) * fraction;
      const opacity = (0.035 + random() * 0.07) * (1 - fraction * 0.65) * depth;
      fillPolygon(ctx, [
        [x, y],
        [x + direction * span * 0.49, y + span * 0.47],
        [x + direction * span, y + span * 0.88 + random() * 5],
        [x + direction * span * 0.32, y + span * 0.62],
        [x + direction * span * 0.09, y + span * 0.23],
      ], `rgba(${color},${opacity})`);
    }
    ctx.restore();
  }
}

function drawRange(ctx, peaks, base, colors, seed, facets) {
  const radius = seed + 72;
  const profile = [];
  for (let x = 0; x <= width; x += 4) {
    const roughness = (noise(x / 39, radius) - 0.5) * 21 + (noise(x / 11, radius + 5) - 0.5) * 7 + (noise(x / 4, radius + 12) - 0.5) * 2.8;
    profile.push([x, sampleProfile(peaks, x) + roughness]);
  }
  const gradient = ctx.createLinearGradient(0, 465, 0, base);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, base);
  for (const [x, y] of profile) ctx.lineTo(x, y);
  ctx.lineTo(width, base);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 420, width, base);
  drawSnowFaces(ctx, facets, seed);
  const random = randomGenerator(seed);
  for (let i = 0; i < 6200; i++) {
    const x = random() * width;
    const y = sampleProfile(peaks, x) + random() * 150;
    const brightness = random();
    const weight = 0.24 + random() * 2;
    const length = 1 + Math.pow(random(), 4) * 38;
    const rise = (sampleProfile(peaks, x + length) - sampleProfile(peaks, x)) * 0.33;
    const alpha = (0.02 + random() * 0.11) * (1 - ease((y - 690) / 170));
    const color = brightness > 0.56 ? '118,159,173' : '6,16,27';
    stroke(ctx, [[x, y], [x + length, y + Math.abs(rise) + length * 0.21]], `rgba(${color},${alpha})`, weight);
  }
  const haze = ctx.createLinearGradient(0, base - 147, 0, base);
  haze.addColorStop(0, 'rgba(89,127,141,0)');
  haze.addColorStop(1, 'rgba(85,120,132,.26)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, base - 150, width, 151);
  ctx.restore();
}

const edge = x => 831 - 21 * Math.sin(x / 235) - 15 * Math.cos(x / 373) - 46 * ease((x - 1150) / 740);

function drawSnow(ctx) {
  const drape = ctx.createLinearGradient(0, 730, 0, 1080);
  drape.addColorStop(0, '#314852');
  drape.addColorStop(0.5, '#233945');
  drape.addColorStop(1, '#1a2b36');
  const ridge = Array.from({length: 161}, (_, i) => [i * 12, edge(i * 12)]);
  fillPolygon(ctx, [...ridge, [width, height], [0, height]], drape);
  const drift = ctx.createLinearGradient(0, 846, 0, 1050);
  drift.addColorStop(0, 'rgba(101,149,158,.27)');
  drift.addColorStop(1, 'rgba(44,74,86,.02)');
  ctx.beginPath();
  ctx.moveTo(0, 926);
  ctx.bezierCurveTo(504, 1033, 779, 886, 975, 903);
  ctx.bezierCurveTo(1302, 914, 1537, 825, 1920, 849);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fillStyle = drift;
  ctx.fill();
  const shadow = ctx.createLinearGradient(0, 985, 0, 1080);
  shadow.addColorStop(0, 'rgba(10,21,28,0)');
  shadow.addColorStop(1, 'rgba(10,21,28,.35)');
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 970, width, 110);

  const random = randomGenerator(76192);
  for (let i = 0; i < 4100; i++) {
    const x = random() * width;
    const depth = random();
    const y = lerp(edge(x) + 4, height, depth);
    const length = (3 + Math.pow(random(), 3.1) * 45) * depth;
    const weight = 0.11 + depth * random() * 1.2;
    const alpha = (0.025 + depth * 0.09) * (0.63 + random() * 0.61);
    const dark = random() < 0.43;
    const color = dark ? '8,19,27' : '120,162,173';
    const tilt = Math.sin(x / 244) * 0.93 + Math.cos(y / 17);
    stroke(ctx, [[x, y], [x + length * 0.44, y + tilt], [x + length, y + tilt * 1.1]], `rgba(${color},${alpha})`, weight);
  }

  for (let tuft = 0; tuft < 38; tuft++) {
    const x = random() * width;
    const depth = random();
    const y = lerp(edge(x) + 18, height + 3, depth);
    const size = 1.1 + depth * 7;
    for (let blade = 0; blade < 3 + Math.floor(random() * 6); blade++) {
      const shift = random() * size - size * 0.5;
      const grass = (0.3 + random()) * size;
      stroke(ctx, [[x + shift, y], [x + shift - grass * 0.35, y - grass * 0.65], [x + shift - grass * 0.8, y - grass]], 'rgba(13,27,32,.78)', 0.56 + depth * 0.71);
    }
  }
}

function drawTree(ctx) {
  const x = 1451;
  const y = 861;
  const stem = [[x - 8, y + 5], [x - 4, y - 32], [x - 6, y - 83], [x - 11, y - 133], [x - 26, y - 171], [x - 46, y - 196], [x - 35, y - 193], [x - 17, y - 172], [x - 4, y - 140], [x + 5, y - 103], [x + 8, y - 61], [x + 11, y + 4]];
  const roots = [[x - 23, y + 6], [x - 10, y - 6], [x + 7, y - 10], [x + 27, y + 1], [x + 17, y + 7]];
  glow(ctx, x - 4, y + 1, 54, '10,23,30', 0.3);
  fillPolygon(ctx, roots, '#111e25');
  fillPolygon(ctx, stem, '#0b171e');
  stroke(ctx, [[x + 2, y], [x + 1, y - 51], [x - 4, y - 99], [x - 14, y - 143], [x - 31, y - 173]], 'rgba(123,166,177,.52)', 1.6);

  const limbs = [
    [[x - 5, y - 87], -2.59, 76, 6.3],
    [[x - 10, y - 119], -2.44, 112, 7.4],
    [[x - 19, y - 149], -2.2, 75, 5.5],
    [[x - 30, y - 177], -2.12, 64, 4.1],
    [[x - 31, y - 174], -1.32, 50, 3.2],
    [[x - 7, y - 118], -0.82, 58, 4.7],
    [[x - 6, y - 96], -0.61, 76, 4.5],
    [[x + 1, y - 53], -0.39, 52, 3.2],
  ];
  const random = randomGenerator(44816);
  function branch(origin, initialAngle, length, size, depth) {
    const points = [origin];
    let angle = initialAngle;
    let [branchX, branchY] = origin;
    for (let segment = 0; segment < 4; segment++) {
      angle += (random() - 0.52) * 0.36 - 0.026;
      const step = length * (0.2 + random() * 0.1);
      const endpoint = [branchX + Math.cos(angle) * step, branchY + Math.sin(angle) * step];
      const thickness = size * (1 - 0.218 * segment);
      stroke(ctx, [[branchX, branchY], endpoint], '#0b171e', thickness);
      if (depth < 1) {
        stroke(ctx, [[branchX, branchY - thickness * 0.28], [endpoint[0], endpoint[1] - thickness * 0.22]], 'rgba(107,153,163,.48)', Math.max(0.36, thickness * 0.22));
      }
      [branchX, branchY] = endpoint;
      points.push(endpoint);
    }
    if (depth > 3 || length < 7) return;
    const splitPoint = depth === 0 ? 1 : 2;
    const direction = random() < 0.47 ? -1 : 1;
    branch(points[splitPoint], initialAngle + direction * (0.44 + random() * 0.44), length * (0.34 + random() * 0.24), size * 0.49, depth + 1);
    branch(points[3], initialAngle - direction * (0.3 + random() * 0.62), length * (0.37 + random() * 0.26), size * 0.55, depth + 1);
  }
  for (const [origin, angle, length, weight] of limbs) branch(origin, angle, length, weight, 0);
}

function buildLand(createCanvas) {
  const land = createCanvas(width, height);
  const ctx = land.getContext('2d');
  const far = [[0, 667], [110, 625], [170, 635], [282, 590], [330, 612], [428, 588], [508, 605], [602, 541], [675, 626], [729, 609], [792, 653], [934, 564], [1089, 601], [1158, 574], [1262, 602], [1372, 568], [1437, 614], [1512, 593], [1668, 629], [1752, 585], [1907, 626], [1920, 624]];
  drawRange(ctx, far, 844, ['#35485c', '#3a5260'], 622, [
    {points: [[156, 634], [278, 583], [329, 613], [465, 707], [327, 686]], color: '113,147,162', depth: 0.73},
    {points: [[554, 585], [600, 536], [664, 623], [717, 624], [754, 685], [654, 654]], color: '138,162,173', depth: 0.81},
    {points: [[851, 613], [935, 560], [986, 587], [1062, 665], [973, 650]], color: '144,170,178', depth: 0.96},
    {points: [[1322, 581], [1372, 563], [1437, 609], [1502, 672], [1382, 651]], color: '146,166,172', depth: 0.66},
    {points: [[1670, 638], [1751, 584], [1800, 590], [1910, 698], [1784, 659]], color: '140,160,174', depth: 0.89},
  ]);
  const front = [[0, 696], [58, 663], [101, 644], [146, 655], [234, 690], [306, 710], [370, 755], [471, 711], [537, 680], [596, 683], [675, 720], [773, 736], [846, 752], [915, 756], [1025, 698], [1100, 705], [1178, 741], [1262, 730], [1359, 752], [1440, 735], [1560, 687], [1648, 696], [1749, 644], [1820, 673], [1884, 653], [1920, 653]];
  drawRange(ctx, front, 963, ['#263744', '#223843'], 279, [
    {points: [[42, 673], [102, 643], [169, 667], [239, 716], [179, 723], [133, 696]], color: '116,148,162', depth: 0.59},
    {points: [[415, 743], [541, 680], [591, 676], [632, 711], [699, 763], [589, 735], [510, 749]], color: '102,139,152', depth: 0.65},
    {points: [[949, 743], [1026, 694], [1098, 704], [1182, 738], [1122, 767], [1048, 754]], color: '111,140,154', depth: 0.60},
    {points: [[1699, 677], [1748, 642], [1803, 662], [1853, 708], [1786, 700], [1758, 684]], color: '113,139,150', depth: 0.86},
  ]);

  const valley = ctx.createLinearGradient(0, 737, 0, 861);
  valley.addColorStop(0, 'rgba(142,180,183,0)');
  valley.addColorStop(0.51, 'rgba(142,180,183,.14)');
  valley.addColorStop(1, 'rgba(142,180,183,0)');
  ctx.fillStyle = valley;
  ctx.fillRect(0, 737, width, 124);
  drawSnow(ctx);
  drawTree(ctx);
  return land;
}

function buildGrade(createCanvas) {
  const grade = createCanvas(width, height);
  const ctx = grade.getContext('2d');
  ctx.save();
  ctx.scale(1, 0.83);
  const shade = ctx.createRadialGradient(950, 615, 200, 950, 640, 1240);
  shade.addColorStop(0, 'rgba(3,8,16,0)');
  shade.addColorStop(0.4, 'rgba(3,8,16,.02)');
  shade.addColorStop(1, 'rgba(3,8,16,.58)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height / 0.83);
  ctx.restore();

  const grain = createCanvas(360, 220);
  const grainCtx = grain.getContext('2d');
  const image = grainCtx.createImageData(grain.width, grain.height);
  const random = randomGenerator(12581);
  for (let i = 0; i < image.data.length; i += 4) {
    const sample = random() > 0.5 ? 190 : 0;
    image.data[i] = sample;
    image.data[i + 1] = sample;
    image.data[i + 2] = sample;
    image.data[i + 3] = 2 + Math.floor(random() * 8);
  }
  grainCtx.putImageData(image, 0, 0);
  ctx.fillStyle = ctx.createPattern(grain, 'repeat');
  ctx.fillRect(0, 0, width, height);
  return grade;
}

module.exports = {
  title: '오로라가 흐르는 설원',
  slug: 'aurora-over-the-tundra',
  sound: 'wind',
  createScene(createCanvas) {
    const sky = buildSky(createCanvas);
    const land = buildLand(createCanvas);
    const grade = buildGrade(createCanvas);
    const curtains = Array.from({length: auroraFrames}, (_, i) => buildAurora(createCanvas, i / auroraFrames, sky));
    return (ctx, phase) => {
      const position = ((phase % 1 + 1) % 1) * auroraFrames;
      const index = Math.floor(position);
      const blend = position - index;
      ctx.save();
      ctx.drawImage(sky, 0, 0);
      ctx.drawImage(curtains[index], 0, 0, width, 730);
      ctx.globalAlpha = blend;
      ctx.drawImage(curtains[(index + 1) % auroraFrames], 0, 0, width, 730);
      ctx.globalAlpha = 1;
      ctx.drawImage(land, 0, 0);
      ctx.drawImage(grade, 0, 0);
      ctx.restore();
    };
  },
};
