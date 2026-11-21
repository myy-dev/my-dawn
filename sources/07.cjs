const width = 1920;
const height = 1080;
const tau = Math.PI * 2;

function seededRandom(initialSeed) {
  let seed = initialSeed;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function range(random, low, high) {
  return low + (high - low) * random();
}

function haze(ctx, x, y, radiusX, radiusY, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(radiusX, radiusY);
  const wash = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  wash.addColorStop(0, `rgba(${color},${alpha})`);
  wash.addColorStop(.45, `rgba(${color},${alpha * .5})`);
  wash.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = wash;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function ribbon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0] - points[0][2] / 2, points[0][1]);
  for (const [index, [x, y, size]] of points.entries()) {
    if (index) ctx.lineTo(x - size / 2, y);
  }
  for (let index = points.length - 1; index >= 0; index--) {
    const [x, y, size] = points[index];
    ctx.lineTo(x + size / 2, y);
  }
  ctx.fill();
}

function branch(ctx, random, x, y, dx, dy, breadth, color) {
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (let part = 0; part < 3; part++) {
    const t = part / 3;
    const next = (part + 1) / 3;
    ctx.beginPath();
    ctx.lineWidth = Math.max(.55, breadth * (1 - t));
    ctx.moveTo(x + t * dx, y + dy * (.65 * t + .35 * t * t));
    ctx.quadraticCurveTo(x + (t + .15) * dx, y + dy * (.65 * t + .35 * t * t) + dy * .08,
      x + next * dx, y + dy * (.65 * next + .35 * next * next));
    ctx.stroke();
  }
  ctx.lineWidth = Math.max(.45, breadth * .24);
  for (let i = 0; i < 3; i++) {
    const p = range(random, .44, .92);
    const x0 = x + p * dx;
    const y0 = y + dy * (.65 * p + .35 * p * p);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(x0 + dx * .1, y0 - Math.abs(dy) * .14, x0 + dx * range(random, .14, .35), y0 - Math.abs(dy) * range(random, .28, .65));
    ctx.stroke();
  }
}

function tree(ctx, random, x, foot, size, lean, shadow, light) {
  const tall = range(random, 560, 945) * (.73 + size / 130);
  const points = [
    [x, foot + 8, size * 1.7],
    [x + size * .1, foot - 22, size * 1.14],
    [x + size * .19 + lean * .1, foot - tall * .25, size * .89],
    [x + lean * .5, foot - tall * .55, size * .64],
    [x + lean * .79, foot - tall * .76, size * .48],
    [x + lean, foot - tall, size * .16]
  ];
  const bark = ctx.createLinearGradient(x - size * .6, foot, x + size * .68, foot);
  bark.addColorStop(0, shadow);
  bark.addColorStop(x < 1020 ? .8 : .22, light);
  bark.addColorStop(1, shadow);
  for (let i = 0; i < 5; i++) {
    const p = range(random, .39, .81);
    const direction = random() < .5 ? -1 : 1;
    const drift = x + p * lean;
    branch(ctx, random, drift, foot - tall * p, direction * range(random, .065, .28) * tall,
      -range(random, .055, .24) * tall, size * range(random, .11, .31), shadow);
  }
  ribbon(ctx, points, bark);
  if (size < 24) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0][0] - points[0][2] / 2, points[0][1]);
  for (const [tx, ty, span] of points.slice(1)) ctx.lineTo(tx - span / 2, ty);
  for (const [tx, ty, span] of points.slice().reverse()) ctx.lineTo(tx + span / 2, ty);
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < size * 7; i++) {
    const p = range(random, 0, .84);
    const strokeX = x + lean * p + range(random, -.6, .6) * size * (1 - .6 * p);
    const strokeY = foot - tall * p;
    const drift = range(random, -6, 6);
    const run = range(random, 3, 42 + size * .45);
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(101,124,108,.073)' : 'rgba(2,8,14,.2)';
    ctx.lineWidth = range(random, .4, 2.1);
    ctx.beginPath();
    ctx.moveTo(strokeX, strokeY);
    ctx.quadraticCurveTo(strokeX + drift - lean * run / tall * .55, strokeY + run * .55,
      strokeX - lean * run / tall, strokeY + run);
    ctx.stroke();
  }
  ctx.restore();
}

const stream = [
  [436, 1085, 1106], [470, 1027, 1131], [506, 971, 1120], [552, 903, 1115],
  [602, 881, 1087], [646, 887, 1091], [698, 850, 1136], [744, 748, 1215],
  [780, 647, 1254], [822, 603, 1273], [862, 559, 1315], [907, 484, 1455],
  [949, 375, 1585], [1000, 320, 1650], [1080, 238, 1751]
];

function marginAt(y, side) {
  let index = 1;
  while (index < stream.length - 1 && y > stream[index][0]) index++;
  const from = stream[index - 1];
  const to = stream[index];
  const prior = stream[Math.max(0, index - 2)];
  const next = stream[Math.min(stream.length - 1, index + 1)];
  const interval = to[0] - from[0];
  const t = (y - from[0]) / interval;
  const d0 = (to[side] - prior[side]) / (to[0] - prior[0]) * interval;
  const d1 = (next[side] - from[side]) / (next[0] - from[0]) * interval;
  const smooth = from[side] + t * (d0 + t * (3 * (to[side] - from[side]) - 2 * d0 - d1 + t * (2 * (from[side] - to[side]) + d0 + d1)));
  const detail = (Math.sin(y * .069 + side * 11) * 6.2 + Math.sin(y * .178 + side * 2) * 2.2) * Math.min(1, Math.max(0, (y - 436) / 200));
  return smooth + detail;
}

function streamPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(stream[0][1], stream[0][0]);
  for (let y = 438; y <= 1080; y += 3) ctx.lineTo(marginAt(y, 1), y);
  ctx.lineTo(marginAt(1080, 1), 1080);
  ctx.lineTo(marginAt(1080, 2), 1080);
  for (let y = 1079; y >= 436; y -= 3) ctx.lineTo(marginAt(y, 2), y);
  ctx.closePath();
}

function shrub(ctx, random, x, y, span, height, dark, light) {
  const mass = ctx.createLinearGradient(x, y - height, x, y + height * .23);
  mass.addColorStop(0, light);
  mass.addColorStop(1, dark);
  ctx.fillStyle = mass;
  ctx.beginPath();
  ctx.moveTo(x - span, y);
  for (let step = 0; step <= 26; step++) {
    const across = -1 + step / 13;
    const crown = Math.sin(Math.PI * step / 26) ** .55;
    const tip = height * crown * range(random, .58, 1.05);
    ctx.lineTo(x + across * span, y - tip);
  }
  ctx.quadraticCurveTo(x + span * .13, y + height * .33, x - span, y);
  ctx.fill();
  for (let i = 0; i < span * .56; i++) {
    const across = range(random, -.9, .9);
    const crown = Math.cos(across * Math.PI * .5);
    const leafY = y - height * crown * range(random, .1, .81);
    const leafX = x + across * span;
    const size = range(random, .45, 2.7) * Math.min(1.65, height / 25);
    ctx.fillStyle = i % 3 ? 'rgba(121,152,111,.13)' : 'rgba(9,23,21,.27)';
    ctx.beginPath();
    ctx.ellipse(leafX, leafY, size * 1.11, size * .54, range(random, -1.5, 1.5), 0, tau);
    ctx.fill();
  }
}

function skylineY(portion, side) {
  const right = side === 2;
  const hill = (right ? 397 : 394) + (right ? 39 : 42) * portion;
  const rise = Math.sin(portion * 12.5 + side * 2) * 11 + Math.sin(portion * 23.5 + side * 2) * 7;
  const bluff = right ? -24 * Math.exp(-(((portion - .61) / .18) ** 2)) : -19 * Math.exp(-(((portion - .72) / .13) ** 2));
  return hill + (rise + bluff) * Math.sin(portion * Math.PI);
}

function terrain(ctx, random, side) {
  const right = side === 2;
  const ground = ctx.createLinearGradient(0, 422, 0, 1080);
  ground.addColorStop(0, right ? '#243a3c' : '#223637');
  ground.addColorStop(.42, right ? '#11272a' : '#172b2a');
  ground.addColorStop(1, right ? '#081415' : '#091815');
  const edge = right ? width : 0;
  ctx.fillStyle = ground;
  ctx.beginPath();
  const boundary = marginAt(436, side);
  ctx.moveTo(edge, right ? 397 : 394);
  for (let i = 1; i <= 100; i++) {
    const portion = i / 100;
    const x = edge + (boundary - edge) * portion;
    ctx.lineTo(x, skylineY(portion, side));
  }
  for (let y = 439; y <= 1080; y += 3) ctx.lineTo(marginAt(y, side) + (right ? 1 : -1), y);
  ctx.lineTo(edge, height);
  ctx.fill();
  for (let i = 0; i < 42; i++) {
    const progress = range(random, .03, .993);
    const x = edge + progress * (boundary - edge);
    const hillY = skylineY(progress, side);
    shrub(ctx, random, x, hillY + range(random, 8, 20), range(random, 12, 49), range(random, 5, 32), '#243a38', '#304840');
  }
  for (let i = 0; i < 22; i++) {
    const depth = range(random, .09, 1);
    const y = 440 + depth * 620;
    const x = range(random, marginAt(y, side) + (right ? 7 : -7), edge);
    const spread = range(random, 18, 130) * (.28 + depth);
    haze(ctx, x, y, spread, spread * .3, i % 2 ? '83,111,69' : '5,17,22', .22);
  }
  for (let i = 0; i < 2270; i++) {
    const y = range(random, 442, height);
    const depth = (y - 436) / (height - 436);
    const bank = marginAt(y, side);
    const isAlongBank = i < (right ? 950 : 1220);
    const x = isAlongBank ? bank + (right ? 1 : -1) * range(random, 1, (right ? 90 : 48) + depth * 230) : range(random, edge, bank);
    const span = range(random, 1, 8.5) * (.42 + depth);
    const patchiness = .56 + Math.sin(y * .037 + x * .015) * .24 + Math.sin(x * .03 - y * .011) * .23;
    const palette = i % 7 === 0 ? '108,135,87' : i % 3 === 0 ? '91,115,100' : i % 2 ? '61,90,65' : '4,13,15';
    ctx.fillStyle = `rgba(${palette},${range(random, .08, .44) * patchiness})`;
    ctx.beginPath();
    ctx.ellipse(x, y, span, span * range(random, .15, .53), range(random, -.38, .38), 0, tau);
    ctx.fill();
    if (i < 200 && depth > .13) {
      const rise = range(random, 4, 30) * (.3 + depth);
      ctx.strokeStyle = `rgba(${palette},.51)`;
      ctx.lineWidth = Math.max(.5, depth * 1.5);
      for (let stem = 0; stem < 4; stem++) {
        const spur = range(random, -14, 14) * depth;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + spur * .34, y - rise * .42, x + spur, y - rise * range(random, .6, 1.45));
        ctx.stroke();
      }
    }
  }
}

function stone(ctx, random, x, y, span, color, highlight) {
  const rise = span * range(random, .20, .44);
  const shape = [];
  for (let i = 0; i < 11; i++) shape.push([
    x + (i / 5 - 1) * span,
    y - Math.max(0, Math.sin(i * Math.PI / 10)) ** .55 * rise * range(random, .61, 1.13)
  ]);
  haze(ctx, x, y + 1, span * 1.58, rise * .81, '3,13,14', .44);
  const tone = ctx.createLinearGradient(x, y - rise, x, y + rise * .2);
  tone.addColorStop(0, highlight);
  tone.addColorStop(1, color);
  ctx.fillStyle = tone;
  ctx.beginPath();
  ctx.moveTo(...shape[0]);
  for (const point of shape.slice(1)) ctx.lineTo(...point);
  ctx.quadraticCurveTo(x + span * .54, y + rise * .29, x - span * .15, y + rise * .23);
  ctx.quadraticCurveTo(x - span * .8, y + rise * .12, ...shape[0]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let i = 0; i < span * 1.3; i++) {
    const px = range(random, x - span, x + span);
    const py = range(random, y - rise, y + rise * .2);
    ctx.fillStyle = i % 3 ? 'rgba(91,122,103,.24)' : 'rgba(172,174,125,.22)';
    ctx.fillRect(px, py, range(random, 1, 4), range(random, 1, 1.8));
  }
  ctx.restore();
}

function fern(ctx, x, y, scale, tilt, color, accent) {
  ctx.fillStyle = color;
  ctx.strokeStyle = accent;
  for (let stem = 0; stem < 7; stem++) {
    const swing = (stem - 3) * .42 + tilt;
    const spread = Math.sin(swing) * scale * 1.22;
    const lift = Math.cos(swing / 1.4) * scale * (1 - Math.abs(stem - 3) * .067);
    ctx.lineWidth = Math.max(.7, scale / 81);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + spread * .31, y - lift * .73, x + spread, y - lift);
    ctx.stroke();
    for (let pair = 2; pair < 13; pair++) {
      const at = pair / 13;
      const onX = x + spread * (.62 * at + .38 * at * at);
      const onY = y - lift * (1.46 * at - .46 * at * at);
      const reach = Math.sin(at * Math.PI) * (1 - at * .54) * scale * .34;
      for (const direction of [-1, 1]) {
        const tipX = onX + direction * Math.cos(swing * .71) * reach + spread * .13;
        const tipY = onY - reach * (.49 - direction * Math.sin(swing * .81) * .65);
        ctx.beginPath();
        ctx.moveTo(onX, onY);
        ctx.quadraticCurveTo(tipX + spread * .018, tipY + reach * .4, tipX, tipY);
        ctx.quadraticCurveTo(onX + direction * reach * .37 + spread * .086, onY - reach * .76, onX, onY);
        ctx.fill();
      }
    }
  }
}

function canopy(ctx, random) {
  const clusters = [[84, 90, 278, 250], [334, 91, 283, 139], [565, 89, 210, 81],
    [785, -32, 282, 83], [1095, -39, 277, 114], [1395, 44, 251, 103],
    [1665, 114, 305, 183], [1850, 110, 270, 305], [1850, 374, 185, 87], [82, 356, 170, 81]];
  for (const [atX, atY, rX, rY] of clusters) {
    for (let i = 0; i < 620; i++) {
      const direction = random() * tau;
      const radius = Math.sqrt(random());
      const x = atX + Math.cos(direction) * radius * rX;
      const y = atY + Math.sin(direction) * radius * rY;
      const size = range(random, 1.2, 24.5) * (1 - .39 * radius);
      const color = i % 4 === 0 ? '34,68,63' : i % 3 === 0 ? '11,28,31' : '5,18,23';
      ctx.fillStyle = `rgba(${color},${(.29 + .59 * (1 - radius)) * range(random, .53, 1)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, size, size * range(random, .24, .67), direction + 1.4, 0, tau);
      ctx.fill();
    }
  }
}

function speckle(createCanvas, random) {
  const canvas = createCanvas(960, 540);
  const ctx = canvas.getContext('2d');
  const pixels = ctx.createImageData(canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const light = random() > .52;
    pixels.data[index] = light ? 104 : 3;
    pixels.data[index + 1] = light ? 128 : 11;
    pixels.data[index + 2] = light ? 124 : 17;
    pixels.data[index + 3] = Math.floor(random() ** 1.6 * (light ? 16 : 31));
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

function createScene(createCanvas) {
  const random = seededRandom(80153);
  const background = createCanvas(width, height);
  const behind = background.getContext('2d');
  const sky = behind.createLinearGradient(0, 0, 0, 619);
  sky.addColorStop(0, '#102534');
  sky.addColorStop(.54, '#1a3540');
  sky.addColorStop(1, '#284548');
  behind.fillStyle = sky;
  behind.fillRect(0, 0, width, height);
  haze(behind, 1010, 349, 620, 345, '92,131,135', .36);
  haze(behind, 1089, 416, 315, 168, '136,165,148', .25);
  for (let i = 0; i < 160; i++) {
    const x = range(random, 55, 1850);
    const y = range(random, 8, 328);
    if (random() > .96 && x > 580 && x < 1520) continue;
    behind.fillStyle = `rgba(165,191,204,${range(random, .045, .23)})`;
    behind.beginPath();
    behind.arc(x, y, range(random, .28, 1.3), 0, tau);
    behind.fill();
  }
  for (let i = 0; i < 101; i++) {
    const x = range(random, -65, 1940);
    const y = range(random, 394, 458);
    const size = range(random, 1.4, 10.2);
    tree(behind, random, x, y, size, range(random, -66, 66), i % 3 === 0 ? '#345358' : '#40585a', '#4d6264');
  }
  haze(behind, 1058, 421, 710, 159, '110,139,129', .33);
  for (let i = 0; i < 55; i++) {
    const x = range(random, -35, 1955);
    const distance = Math.abs(x - 1069) / 1100;
    if (distance < .18 && random() < .92) continue;
    tree(behind, random, x, range(random, 422, 470 + distance * 70), range(random, 4, 29), range(random, -77, 73),
      i % 3 ? '#163238' : '#244045', i % 4 ? '#29474b' : '#385354');
  }
  haze(behind, 1010, 458, 305, 46, '107,139,131', .14);

  const shoreline = createCanvas(width, height);
  const shore = shoreline.getContext('2d');
  terrain(shore, random, 1);
  terrain(shore, random, 2);
  const frontTrees = [[40, 878, 146, 38], [156, 840, 126, -56], [315, 678, 71, -45],
    [472, 568, 33, -52], [576, 527, 23, 24], [740, 478, 13, 28], [808, 488, 17, 15],
    [1256, 472, 12, 24], [1371, 527, 34, -25], [1504, 595, 55, -43], [1630, 675, 78, 34],
    [1778, 852, 154, -125], [1881, 883, 160, 25], [1958, 992, 206, -68]];
  for (const [x, y, size, lean] of frontTrees) {
    tree(shore, random, x, y, size, lean, size > 100 ? '#080f15' : '#0c1c22',
      size > 100 ? '#22312d' : '#29413f');
    if (size < 23) continue;
    for (let root = 0; root < 8; root++) {
      const direction = root < 4 ? -1 : 1;
      const drift = direction * range(random, .65, 2) * size;
      const depth = range(random, .07, .33) * size;
      shore.fillStyle = root % 2 ? '#101e1b' : '#14251f';
      shore.beginPath();
      shore.moveTo(x + size * direction * .38, y - size * .26);
      shore.quadraticCurveTo(x + drift * .42, y + depth * .9, x + drift, y + depth);
      shore.quadraticCurveTo(x + drift * .32, y + depth * 1.08, x - size * direction * .21, y + depth * .34);
      shore.fill();
    }
  }
  canopy(shore, random);
  for (const side of [1, 2]) {
    for (let index = 0; index < 14; index++) {
      const portion = range(random, .2, 1);
      const y = 443 + portion * 640;
      const offset = (side === 1 ? -1 : 1) * range(random, -12, 90) * portion;
      const x = marginAt(y, side) + offset;
      stone(shore, random, x, y, range(random, 8, 50) * portion, '#172d2b', '#405248');
    }
  }
  for (const [x, y, scale] of [[620, 842, 32], [588, 873, 44], [569, 923, 37], [534, 943, 23],
    [1310, 808, 24], [1308, 844, 46], [1380, 882, 68], [1428, 925, 45], [1229, 824, 15]]) {
    stone(shore, random, x, y, scale, '#172c29', '#49594c');
  }
  for (const [x, y, span, rise] of [[237, 895, 94, 55], [345, 783, 99, 74], [467, 667, 72, 43],
    [575, 565, 59, 20], [811, 499, 42, 18], [1280, 492, 31, 17], [1401, 596, 65, 30],
    [1502, 738, 54, 39], [1716, 881, 99, 53], [1680, 974, 87, 58]]) {
    shrub(shore, random, x, y, span, rise, '#101e1d', '#213a2e');
  }
  for (const [x, y, scale, tilt, color] of [
    [105, 1013, 135, .23, '#132a22'], [201, 992, 97, -.12, '#172e25'], [315, 1049, 91, -.38, '#1a3329'],
    [462, 939, 72, -.4, '#142c27'], [547, 842, 61, -.33, '#182d26'], [714, 736, 46, -.28, '#1b332c'],
    [1450, 921, 64, .35, '#1b362d'], [1561, 1015, 105, .43, '#1b392f'], [1740, 1065, 176, .35, '#16352b'],
    [1859, 1012, 147, .22, '#152f27'], [1925, 1080, 222, -.09, '#102a23']
  ]) fern(shore, x, y, scale, tilt, color, '#34483a');
  haze(shore, 1068, 425, 222, 99, '123,148,135', .38);
  haze(shore, 1024, 442, 182, 52, '114,143,132', .19);
  const shade = shore.createRadialGradient(986, 475, 297, 986, 475, 1193);
  shade.addColorStop(0, 'rgba(5,12,17,0)');
  shade.addColorStop(.59, 'rgba(5,12,17,.06)');
  shade.addColorStop(1, 'rgba(4,9,14,.57)');
  shore.fillStyle = shade;
  shore.fillRect(0, 0, width, height);

  const waterLayer = createCanvas(width, height);
  const water = waterLayer.getContext('2d');
  streamPath(water);
  water.clip();
  const waterColor = water.createLinearGradient(0, 432, 0, 1080);
  waterColor.addColorStop(0, '#3c5657');
  waterColor.addColorStop(.13, '#2c4e50');
  waterColor.addColorStop(.42, '#203c43');
  waterColor.addColorStop(1, '#122932');
  water.fillStyle = waterColor;
  water.fillRect(0, 430, width, 650);
  for (let i = 0; i < 295; i++) {
    const y = range(random, 455, 1080);
    const depth = (y - 430) / 650;
    const left = marginAt(y, 1);
    const right = marginAt(y, 2);
    const sourceY = 440 - depth * 400;
    const sourceWidth = 95 + depth * 760;
    const height = range(random, 1, 2 + depth * 4);
    const turbulentOffset = range(random, -40, 40) * depth + Math.sin(y * .066) * depth * 35;
    water.globalAlpha = range(random, .04, .25) * depth;
    water.drawImage(background, (left + right) * .5 - sourceWidth * .5 + turbulentOffset, sourceY, sourceWidth, height,
      left - 15 + turbulentOffset, y, right - left + 30, height);
  }
  water.globalAlpha = 1;
  // Broken canopy shadows sit below the moving surface lines.
  for (const [x, y, sweep, depth, alpha] of [
    [1075, 463, 50, 19, .24], [1005, 488, 100, 22, .22], [1120, 526, 102, 32, .33],
    [918, 552, 114, 33, .26], [945, 625, 166, 37, .23], [1119, 682, 186, 52, .24],
    [840, 732, 205, 53, .23],
  ]) {
    haze(water, x, y, sweep, depth, '6,23,32', alpha);
    haze(water, x - sweep * .61, y + depth * .29, sweep * .74, depth * .43, '10,28,33', alpha * .56);
  }
  haze(water, 1048, 506, 94, 53, '144,185,174', .066);
  haze(water, 1000, 690, 298, 205, '72,123,130', .27);
  haze(water, 554, 868, 240, 108, '59,86,62', .34);
  haze(water, 1360, 882, 291, 125, '66,97,77', .22);
  for (let i = 0; i < 130; i++) {
    const y = range(random, 485, 1090);
    const depth = (y - 436) / 644;
    const side = i % 2 + 1;
    const offset = range(random, 5, side === 1 ? 140 : 90) * depth;
    const x = marginAt(y, side) + (side === 1 ? offset : -offset);
    const stretch = range(random, 4, 30) * depth;
    water.fillStyle = `rgba(108,135,108,${range(random, .025, .12)})`;
    water.beginPath();
    water.ellipse(x, y, stretch, stretch * range(random, .075, .24), range(random, -.1, .1), 0, tau);
    water.fill();
  }
  const rippleSeeds = Array.from({length: 240}, () => ({
    y: range(random, 446, 1100), position: range(random, -.1, 1.06), size: range(random, .18, 1),
    offset: random() * tau, speed: random() < .75 ? 1 : 2, brightness: range(random, .11, .55)
  }));
  const flecks = [
    [611, 699, 45, 38, 2.1, 1], [711, 645, 42, 18, 1.4, 1], [779, 529, 18, 47, 2.1, 2],
    [828, 567, 28, 27, 1.65, 1], [888, 715, 25, 38, 2.25, 1], [936, 511, 19, 19, 1.38, 1],
    [1016, 635, 30, 39, 1.83, 1], [1089, 574, 22, 14, 1.48, 2], [1166, 666, 36, 27, 1.98, 1],
    [1204, 515, 16, 20, 1.19, 1], [1345, 601, 42, 38, 2.18, 1], [1384, 734, 20, 35, 2.30, 2],
    [1467, 549, 39, 26, 1.60, 1], [1480, 845, 37, 52, 3.25, 1], [490, 895, 29, 51, 2.64, 1],
    [536, 768, 54, 26, 4.2, 1, '225,183,90'], [782, 612, 39, 33, 2.5, 2, '201,181,93'],
    [1042, 750, 69, 33, 5.8, 1, '234,176,78'], [1318, 641, 26, 34, 3.1, 1, '216,193,106'],
    [1533, 909, 51, 42, 4.6, 1, '225,168,83']
  ].map(([x, y, sway, rise, radius, speed, warmTint]) => ({x, y, sway, rise, radius, speed, warmTint, offset: random() * tau}));
  const grain = speckle(createCanvas, random);

  return (ctx, phase) => {
    const angle = (phase - Math.floor(phase)) * tau;
    ctx.drawImage(background, 0, 0);
    ctx.drawImage(waterLayer, 0, 0);
    ctx.save();
    streamPath(ctx);
    ctx.clip();
    for (const {y, position, size, offset, speed, brightness} of rippleSeeds) {
      const depth = (y - 436) / 644;
      const atY = y + Math.sin(angle * speed + offset) * (1.5 + depth * 8);
      const left = marginAt(atY, 1);
      const span = marginAt(atY, 2) - left;
      const shift = Math.sin(angle + offset) * (2 + depth * 17);
      const x = left + span * position + shift;
      const run = span * size * (.09 + depth * .12);
      const taper = .68 + Math.sin(angle * speed + offset + 1.2) * .31;
      const alpha = brightness * (.46 + depth * .21) * taper;
      ctx.strokeStyle = `rgba(133,170,169,${alpha})`;
      ctx.lineWidth = Math.max(.46, .62 + depth * 1.2);
      ctx.beginPath();
      ctx.moveTo(x - run * .56, atY);
      ctx.quadraticCurveTo(x - run * .09, atY - 1.2 * depth, x + run * .45, atY + .52);
      ctx.stroke();
    }
    // Only a few glints move across the far bend where the sky is reflected.
    for (const [y, portion, length, offset] of [
      [474, .64, 27, .7], [491, .31, 28, 2.9], [515, .63, 35, 2.4], [541, .68, 39, 1.9],
      [573, .47, 54, .4], [592, .2, 38, 2.6], [618, .56, 66, 1.4], [641, .78, 43, 3.8],
      [670, .29, 71, 4.1], [693, .53, 77, 4.9], [712, .71, 65, 5.7],
    ]) {
      const current = Math.sin(angle * 2 + offset);
      const atY = y + 3 * current;
      const left = marginAt(atY, 1);
      const run = marginAt(atY, 2) - left;
      const x = left + run * portion + 5.5 * Math.cos(angle + offset);
      haze(ctx, x, atY, length * .55, 2.1, '143,178,174', .13 + .075 * current);
      haze(ctx, x - length * .27, atY + 4.3, length * .41, 1.6, '106,154,153', .065 + .036 * current);
    }
    for (const [x, y, length, offset] of [[663, 878, 61, 0], [614, 926, 82, 1.3], [1270, 873, 51, 2],
      [1319, 911, 74, 3.1], [1229, 851, 40, 4.8]]) {
      const flow = angle + offset;
      ctx.strokeStyle = `rgba(139,174,160,${.15 + .075 * Math.sin(flow)})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x - length * .5, y + Math.sin(flow) * 3);
      ctx.bezierCurveTo(x - length * .32, y - 6, x + length * .27, y + 6, x + length * .5, y + Math.cos(flow) * 4);
      ctx.stroke();
    }
    ctx.restore();
    ctx.drawImage(shoreline, 0, 0);
    for (const {x, y, sway, rise, radius, speed, warmTint, offset} of flecks) {
      const floor = warmTint ? .22 + .18 * Math.sin(offset) ** 2 : .17;
      const pulse = floor + (1 - floor) * ((1 + Math.sin(angle * (speed + 1) + offset * 1.63)) / 2) ** 2.15;
      const drift = angle * speed + offset;
      const dotX = x + sway * Math.sin(drift) + sway * .18 * Math.cos(angle * 2 + offset * 2.4);
      const dotY = y + rise * Math.cos(angle * speed + offset * 1.11) + 3.5 * Math.sin(angle * 3 + offset);
      const halo = radius * (6 + pulse * 1.1);
      const core = radius * (.74 + pulse * .32);
      haze(ctx, dotX, dotY, halo * (1.06 + .2 * Math.cos(drift) ** 2), halo * .84,
        warmTint || '181,202,112', pulse * (warmTint ? .40 : .30));
      haze(ctx, dotX, dotY, core, core * .89, warmTint ? '253,226,151' : '239,235,158', pulse);
    }
    ctx.drawImage(grain, 0, 0, width, height);
  };
}

module.exports = {title: '반딧불이 머무는 밤의 개울', slug: 'firefly-creek', sound: 'forest', createScene};
