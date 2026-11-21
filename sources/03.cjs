const WIDTH = 1920;
const HEIGHT = 1080;
const HORIZON = 593;
const TAU = Math.PI * 2;
const LIGHT = { x: 566, y: 388 };

function randomFrom(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function fillPath(ctx, points, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fill();
}

function erodedEdge(points, rng, depth, loop = false) {
  const route = loop ? [...points, points[0]] : points;
  const result = [route[0]];
  for (let index = 1; index < route.length; index += 1) {
    const [x, y] = route[index - 1];
    const [endX, endY] = route[index];
    const dx = endX - x;
    const dy = endY - y;
    const length = Math.hypot(dx, dy);
    const steps = Math.ceil(length / 10);
    for (let step = 1; step < steps; step += 1) {
      const u = step / steps;
      const shift = (rng() - 0.5) * depth * Math.sin(Math.PI * u) ** 0.42;
      result.push([x + dx * u - dy / length * shift, y + dy * u + dx / length * shift]);
    }
    result.push(route[index]);
  }
  return result;
}

function radial(ctx, x, y, radius, light, clear) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, light);
  gradient.addColorStop(1, clear);
  return gradient;
}

function softOval(ctx, x, y, width, height, light, clear) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(width, height);
  ctx.fillStyle = radial(ctx, 0, 0, 1, light, clear);
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function drawSky(ctx, rng) {
  const sky = ctx.createLinearGradient(0, 0, 65, HORIZON);
  sky.addColorStop(0, '#0a0e19');
  sky.addColorStop(0.38, '#131c2b');
  sky.addColorStop(0.72, '#27333e');
  sky.addColorStop(1, '#4a4c50');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HORIZON + 3);

  softOval(ctx, 1610, 572, 805, 215, 'rgba(160,122,114,0.26)', 'rgba(153,120,116,0)');
  softOval(ctx, 625, 574, 658, 276, 'rgba(121,141,142,0.16)', 'rgba(121,141,142,0)');

  for (let index = 0; index < 128; index += 1) {
    const x = rng() * WIDTH;
    const y = 12 + Math.pow(rng(), 1.38) * 330;
    const visibility = (1 - y / 386) * (0.08 + rng() * 0.42);
    ctx.fillStyle = 'rgba(201,211,225,' + visibility + ')';
    ctx.beginPath();
    ctx.arc(x, y, 0.3 + Math.pow(rng(), 4) * 1.2, 0, TAU);
    ctx.fill();
  }

  // Wind-sheared banks of low maritime cloud, layered toward the horizon.
  const cloudBands = [
    [1580, 428, 460, 28, 0.28], [1203, 478, 400, 22, 0.2],
    [1766, 497, 520, 29, 0.26], [754, 506, 535, 34, 0.15],
    [1652, 546, 483, 17, 0.33], [1098, 554, 448, 11, 0.22],
    [281, 460, 490, 31, 0.23], [255, 526, 644, 21, 0.26],
    [1502, 339, 569, 49, 0.12], [400, 307, 520, 46, 0.12],
  ];
  for (const [x, y, width, height, opacity] of cloudBands) {
    for (let layer = 0; layer < 13; layer += 1) {
      const leafX = x + (rng() - 0.5) * width * 1.6;
      const leafY = y + (rng() - 0.5) * height * 0.9;
      const leafWidth = width * (0.18 + rng() * 0.28);
      const leafHeight = height * (0.23 + rng() * 0.48);
      softOval(ctx, leafX, leafY, leafWidth, leafHeight, 'rgba(16,23,37,' + opacity * (0.22 + rng() * 0.66) + ')', 'rgba(21,28,40,0)');
    }
  }

  const shore = [[0, 569], [122, 561], [165, 557], [248, 561], [333, 571], [386, 568], [446, 576], [489, 573], [541, 582], [616, 589], [701, 592], [0, 597]];
  fillPath(ctx, shore, '#293640');
  fillPath(ctx, [[0, 579], [151, 577], [211, 568], [251, 570], [309, 574], [359, 572], [390, 579], [428, 580], [470, 589], [538, 593], [0, 596]], '#25333c');

  const water = ctx.createLinearGradient(0, HORIZON, 46, HEIGHT);
  water.addColorStop(0, '#353e48');
  water.addColorStop(0.08, '#273740');
  water.addColorStop(0.36, '#1b2a37');
  water.addColorStop(0.77, '#13212d');
  water.addColorStop(1, '#09151e');
  ctx.fillStyle = water;
  ctx.fillRect(0, HORIZON, WIDTH, HEIGHT - HORIZON);
  softOval(ctx, 1506, 632, 746, 122, 'rgba(152,127,120,0.18)', 'rgba(152,127,120,0)');
  softOval(ctx, 1180, 852, 712, 230, 'rgba(100,126,132,0.10)', 'rgba(100,126,132,0)');

  ctx.fillStyle = 'rgba(151,153,151,0.15)';
  ctx.fillRect(703, HORIZON, WIDTH - 703, 1);
}

function drawTower(ctx, rng) {
  fillPath(ctx, [[514, 558], [665, 563], [656, 576], [490, 570]], '#101b23');
  fillPath(ctx, [[518, 558], [624, 554], [624, 565], [514, 570]], '#273239');
  fillPath(ctx, [[494, 529], [517, 511], [550, 525], [546, 566], [487, 565]], '#333d41');
  fillPath(ctx, [[481, 529], [515, 500], [557, 526], [549, 531], [516, 511], [490, 535]], '#111c24');
  fillPath(ctx, [[515, 514], [550, 529], [546, 566], [518, 566]], '#202c32');
  ctx.fillStyle = '#18242b';
  ctx.fillRect(498, 537, 10, 15);
  ctx.fillRect(522, 537, 8, 12);
  ctx.fillStyle = 'rgba(199,151,91,0.48)';
  ctx.fillRect(499, 538, 6, 10);
  ctx.fillStyle = '#30302b';
  ctx.fillRect(501, 537, 1, 13);

  const body = ctx.createLinearGradient(529, 0, 608, 0);
  body.addColorStop(0, '#727f7b');
  body.addColorStop(0.26, '#64756f');
  body.addColorStop(0.56, '#53605d');
  body.addColorStop(1, '#303f42');
  const tower = [[542, 418], [590, 418], [604, 558], [529, 559]];
  fillPath(ctx, tower, body);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...tower[0]);
  for (const point of tower.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.clip();
  for (let index = 0; index < 360; index += 1) {
    const x = 528 + rng() * 78;
    const y = 419 + rng() * 140;
    ctx.fillStyle = rng() < 0.62 ? 'rgba(21,39,42,0.07)' : 'rgba(180,181,152,0.08)';
    ctx.fillRect(x, y, 0.6 + rng() * 3, 1.1 + rng() * 5.8);
  }
  for (const y of [445, 473, 503, 532, 553]) {
    ctx.fillStyle = 'rgba(23,39,40,0.23)';
    ctx.fillRect(532, y, 70, 1.3);
  }
  fillPath(ctx, [[543, 420], [551, 423], [542, 557], [534, 557]], 'rgba(213,203,156,0.08)');
  ctx.restore();

  ctx.fillStyle = '#263739';
  ctx.fillRect(559, 468, 9, 18);
  ctx.fillRect(555, 502, 8, 13);
  ctx.fillStyle = '#394546';
  ctx.fillRect(560, 470, 5, 13);
  ctx.fillRect(556, 503, 5, 11);
  fillPath(ctx, [[565, 558], [565, 536], [569, 531], [577, 531], [581, 536], [581, 558]], '#253239');

  fillPath(ctx, [[535, 417], [597, 417], [594, 424], [539, 424]], '#243138');
  fillPath(ctx, [[532, 412], [599, 412], [596, 417], [535, 417]], '#4b5551');
  fillPath(ctx, [[542, 374], [589, 374], [588, 412], [543, 412]], '#302f2c');
  const glass = ctx.createLinearGradient(542, 0, 586, 0);
  glass.addColorStop(0, '#8b7653');
  glass.addColorStop(0.35, '#e1bd7a');
  glass.addColorStop(0.57, '#f3d997');
  glass.addColorStop(1, '#a08358');
  fillPath(ctx, [[545, 376], [586, 376], [585, 408], [546, 408]], glass);

  ctx.strokeStyle = '#252e30';
  ctx.lineWidth = 2;
  for (const x of [543, 553, 579, 588]) {
    ctx.beginPath();
    ctx.moveTo(x, 373);
    ctx.lineTo(x + (x < 566 ? 1 : -1), 413);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(74,67,54,0.68)';
  ctx.fillRect(545, 400, 42, 1.5);
  ctx.fillStyle = '#344140';
  ctx.fillRect(532, 410, 67, 2.4);
  ctx.fillStyle = '#1b292d';
  ctx.fillRect(532, 404, 67, 1.1);
  for (const x of [533, 542, 552, 579, 589, 598]) ctx.fillRect(x, 403, 1.5, 10);

  fillPath(ctx, [[533, 375], [544, 368], [559, 356], [572, 355], [590, 366], [599, 374], [588, 378], [544, 378]], '#202c32');
  fillPath(ctx, [[543, 371], [558, 357], [569, 356], [560, 368], [537, 374]], '#39494c');
  ctx.fillStyle = '#43504d';
  ctx.fillRect(565, 346, 2, 11);
  ctx.fillRect(562, 349, 8, 1);
  ctx.fillRect(576, 551, 59, 1.2);
  for (const x of [583, 598, 612, 626, 635]) ctx.fillRect(x, 551, 1.5, 12);
}

function drawTerrain(ctx, rng) {
  const anchors = [[0, 569], [48, 549], [83, 553], [127, 534], [171, 551], [216, 545], [257, 552], [293, 548], [316, 560], [385, 556], [420, 564], [458, 552], [484, 557], [519, 556], [549, 561], [588, 559], [625, 561], [647, 569], [658, 585], [683, 595], [693, 614], [680, 633], [656, 641], [638, 660], [658, 678], [628, 699], [587, 711], [563, 729], [515, 745], [488, 765], [444, 780], [433, 796], [382, 819], [372, 849], [329, 862], [290, 890], [249, 909], [202, 949], [166, 971], [105, 998], [68, 1027], [20, 1062], [0, 1080]];
  const profile = erodedEdge(anchors, rng, 7);
  const shore = erodedEdge(anchors.slice(15), randomFrom(78233), 3);
  const base = ctx.createLinearGradient(258, 536, 283, 971);
  base.addColorStop(0, '#303d42');
  base.addColorStop(0.38, '#202f35');
  base.addColorStop(1, '#0a171e');
  fillPath(ctx, profile, base);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...profile[0]);
  for (const point of profile.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.clip();

  const planes = [
    [[[34, 584], [340, 575], [396, 594], [348, 707], [271, 746], [213, 842], [0, 944]], '#1c2931'],
    [[[0, 574], [124, 551], [206, 567], [161, 620], [86, 661], [0, 661]], '#3b4546'],
    [[[179, 571], [331, 561], [421, 577], [372, 619], [228, 619], [142, 664]], '#364145'],
    [[[410, 569], [535, 554], [629, 564], [679, 593], [634, 610], [529, 610], [441, 646], [368, 646]], '#354247'],
    [[[574, 602], [684, 594], [675, 633], [630, 655], [565, 666], [526, 697], [459, 720], [484, 663]], '#25353d'],
    [[[623, 652], [679, 654], [633, 703], [562, 730], [509, 751], [537, 712]], '#172830'],
    [[[42, 672], [135, 642], [224, 646], [205, 701], [128, 752], [0, 775]], '#273439'],
    [[[22, 788], [131, 752], [264, 715], [213, 787], [154, 823], [0, 879]], '#1d2c32'],
    [[[261, 659], [415, 621], [458, 630], [396, 710], [363, 757], [241, 819], [221, 771]], '#28363c'],
    [[[412, 721], [553, 673], [520, 733], [474, 776], [383, 818]], '#1b2b33'],
    [[[140, 836], [282, 779], [380, 774], [356, 833], [299, 856], [222, 897], [100, 924]], '#233238'],
    [[[22, 911], [123, 846], [175, 827], [151, 880], [86, 924], [0, 950]], '#17272f'],
  ];
  ctx.globalAlpha = 0.79;
  for (const [points, color] of planes) fillPath(ctx, erodedEdge(points, rng, 13, true), color);
  ctx.globalAlpha = 1;

  for (let cluster = 0; cluster < 350; cluster += 1) {
    const x = rng() * 699;
    const y = 548 + rng() * 535;
    const width = 4 + rng() ** 2 * 27;
    const shear = 0.23 + rng() * 0.62;
    const color = rng() < 0.55 ? 'rgba(181,179,152,0.096)' : 'rgba(7,15,18,0.17)';
    const edge = [[x, y], [x + width * 0.28, y - width * shear + 3], [x + width * 0.82, y - width * shear], [x + width, y - width * 0.45], [x + width * 0.39, y + 1]];
    fillPath(ctx, edge, color);
  }

  for (let index = 0; index < 190; index += 1) {
    const x = rng() * 710;
    const y = 548 + rng() * 510;
    const run = 7 + rng() ** 2 * 43;
    const descent = 4 + rng() ** 2 * 23;
    const alpha = 0.1 + rng() * 0.16;
    ctx.strokeStyle = 'rgba(9,20,24,' + alpha + ')';
    ctx.lineWidth = 0.6 + rng() * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - run * 0.2, y + descent * 1.1);
    ctx.lineTo(x - run * 0.59, y + descent * 1.21);
    ctx.lineTo(x - run, y + descent * 1.9);
    ctx.stroke();
  }

  // Eroded strata with fine but irregular seams.
  for (let index = 0; index < 7200; index += 1) {
    const x = rng() * 696;
    const y = 544 + rng() * 525;
    const length = 0.6 + Math.pow(rng(), 6) * 39;
    const shine = rng() < 0.53;
    const strength = (0.045 + rng() * 0.18) * (1 - (y - 544) / 1100);
    ctx.strokeStyle = 'rgba(' + (shine ? '154,158,143,' : '8,18,22,') + strength + ')';
    ctx.lineWidth = 0.45 + rng() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y - length * (0.12 + rng() * 0.41));
    ctx.stroke();
  }

  for (let index = 0; index < 49; index += 1) {
    const x = 26 + rng() * 636;
    const y = 561 + rng() * 437;
    const width = 9 + rng() * 46;
    const height = 3 + rng() * 15;
    fillPath(ctx, [[x - 4, y], [x + width * 0.28, y - height], [x + width, y - height * 0.4], [x + width * 0.62, y + height * 0.48]], 'rgba(10,22,27,0.24)');
    fillPath(ctx, [[x - 4, y], [x + width * 0.28, y - height], [x + width, y - height * 0.4], [x + width * 0.29, y - height * 0.48]], 'rgba(154,159,142,0.11)');
  }
  ctx.restore();

  fillPath(ctx, [[0, 908], [39, 900], [83, 914], [122, 907], [152, 928], [189, 934], [213, 951], [202, 967], [241, 983], [269, 985], [298, 1004], [352, 1024], [384, 1062], [459, 1080], [0, 1080]], '#0b171e');
  fillPath(ctx, [[0, 940], [56, 927], [106, 931], [139, 946], [132, 962], [75, 986], [0, 1007]], '#111f27');

  for (let index = 0; index < 226; index += 1) {
    const x = rng() * 450;
    const y = 916 + x * 0.37 + rng() * 34;
    const height = 4 + Math.pow(rng(), 2.2) * 36;
    ctx.strokeStyle = rng() < 0.56 ? 'rgba(24,38,43,0.81)' : 'rgba(12,27,30,0.84)';
    ctx.lineWidth = 0.6 + rng() * 1.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - height * 0.24, y - height * 0.7, x - height * (0.3 + rng() * 0.32), y - height);
    ctx.stroke();
  }

  drawTower(ctx, rng);
  return shore;
}

function makeLightShaft(createCanvas) {
  const shaft = createCanvas(512, 144);
  const ctx = shaft.getContext('2d');
  const pixels = ctx.createImageData(shaft.width, shaft.height);
  for (let x = 0; x < shaft.width; x += 1) {
    const u = x / (shaft.width - 1);
    const spread = 0.07 + u ** 0.76 * 0.72;
    const attenuation = (1 - u) ** 1.65 * (0.91 + 0.09 * Math.sin(u * 32));
    for (let y = 0; y < shaft.height; y += 1) {
      const v = 2 * y / (shaft.height - 1) - 1;
      const center = u * (0.043 * Math.sin(u * 9) - 0.026);
      const relativeDistance = (v - center) / spread;
      const glow = Math.max(0, Math.exp(-5 * relativeDistance ** 2) - 0.0068);
      const halo = Math.max(0, 1 - (relativeDistance * 0.76) ** 2) ** 3;
      const index = (y * shaft.width + x) * 4;
      pixels.data[index] = 231;
      pixels.data[index + 1] = 202;
      pixels.data[index + 2] = 155;
      pixels.data[index + 3] = attenuation * (32 * glow + 11 * halo);
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return shaft;
}

function createScene(createCanvas) {
  const rng = randomFrom(37654673);
  const backdrop = createCanvas(WIDTH, HEIGHT);
  const foreground = createCanvas(WIDTH, HEIGHT);
  const details = createCanvas(WIDTH, HEIGHT - HORIZON);
  const vignette = createCanvas(WIDTH, HEIGHT);
  const lightShaft = makeLightShaft(createCanvas);
  drawSky(backdrop.getContext('2d'), rng);
  const shore = drawTerrain(foreground.getContext('2d'), rng);
  const waterDetail = details.getContext('2d');
  const shade = vignette.getContext('2d');

  for (let index = 0; index < 2190; index += 1) {
    const x = rng() * WIDTH;
    const y = Math.pow(rng(), 2.2) * (HEIGHT - HORIZON);
    const depth = y / (HEIGHT - HORIZON);
    const length = (2 + Math.pow(rng(), 1.7) * (70 + depth * 80)) * (0.33 + depth * 0.63);
    const alpha = (0.025 + rng() * 0.105) * (0.46 + 0.38 * Math.sin(x * 0.0013 + 0.1) + depth * 0.24);
    waterDetail.fillStyle = rng() < 0.71 ? 'rgba(142,160,166,' + alpha + ')' : 'rgba(7,15,25,' + alpha * 1.3 + ')';
    waterDetail.fillRect(x, y, length, (0.44 + rng() * 0.56) * (0.7 + depth * 1.8));
  }
  const darkEdges = shade.createRadialGradient(1070, 518, 341, 988, 520, 1147);
  darkEdges.addColorStop(0, 'rgba(3,7,16,0)');
  darkEdges.addColorStop(0.63, 'rgba(3,7,16,0.04)');
  darkEdges.addColorStop(1, 'rgba(3,7,16,0.41)');
  shade.fillStyle = darkEdges;
  shade.fillRect(0, 0, WIDTH, HEIGHT);

  const ripples = Array.from({ length: 306 }, () => ({
    x: rng() * WIDTH,
    depth: Math.pow(rng(), 1.76),
    length: 11 + Math.pow(rng(), 2) * 119,
    offset: rng() * TAU,
    alpha: 0.024 + rng() * 0.095,
    cycle: 1 + Math.floor(rng() * 3),
  }));
  const swashes = [];
  const contact = createCanvas(WIDTH, HEIGHT);
  const tidalEdge = contact.getContext('2d');
  for (let index = 1; index < shore.length; index += 1) {
    const [x, y] = shore[index - 1];
    const [endX, endY] = shore[index];
    const dx = endX - x;
    const dy = endY - y;
    const length = Math.hypot(dx, dy);
    const outwardX = dy / length;
    const outwardY = -dx / length;
    const depth = Math.max(0, (y - HORIZON) / (HEIGHT - HORIZON));
    if (y < HORIZON) continue;
    for (let mark = 0; mark < 9; mark += 1) {
      const fraction = rng();
      const opacity = (0.05 + rng() * 0.07) * (1 - depth * 0.55);
      const offset = 1 + rng() ** 2 * 14;
      tidalEdge.strokeStyle = 'rgba(4,13,19,' + opacity + ')';
      tidalEdge.lineWidth = 1 + rng() * 4;
      tidalEdge.beginPath();
      tidalEdge.moveTo(x + fraction * dx + outwardX * offset, y + fraction * dy + outwardY * offset);
      tidalEdge.lineTo(x + (fraction + 0.85) * dx + outwardX * offset, y + (fraction + 0.85) * dy + outwardY * offset);
      tidalEdge.stroke();
    }
    if (rng() < 0.14) continue;
    swashes.push({
      x, y, dx, dy, outwardX, outwardY, depth,
      length: 0.48 + rng() * 1.58,
      offset: x * 0.008 + y * 0.004 + (rng() - 0.5) * 1.8,
      strength: (0.15 + rng() * 0.21) * (1 - depth * 0.44),
    });
  }
  const lanternWash = radial(shade, LIGHT.x, LIGHT.y, 38, 'rgba(220,164,92,0.11)', 'rgba(220,164,92,0)');
  shade.fillStyle = lanternWash;
  shade.fillRect(527, 349, 78, 78);

  return (ctx, phase) => {
    const time = (phase % 1) * TAU;
    ctx.drawImage(backdrop, 0, 0);
    ctx.drawImage(details, Math.sin(time) * 4, HORIZON);

    for (const ripple of ripples) {
      const wave = Math.sin(time * ripple.cycle + ripple.offset);
      const y = HORIZON + 2 + ripple.depth * (HEIGHT - HORIZON) + wave * (0.6 + ripple.depth * 5);
      const x = ripple.x + wave * (3 + ripple.depth * 14);
      const length = ripple.length * (0.27 + ripple.depth);
      ctx.strokeStyle = 'rgba(160,177,179,' + ripple.alpha * (0.67 + wave * 0.28) + ')';
      ctx.lineWidth = 0.5 + ripple.depth * 1.65;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + length * 0.48, y - 0.3 - ripple.depth * 1.8, x + length, y + wave * 0.64);
      ctx.stroke();
    }

    ctx.drawImage(contact, 0, 0);
    for (const crest of swashes) {
      const lap = 0.5 + 0.5 * Math.sin(time * 4 + crest.offset);
      const advance = 5 + (1 - lap) ** 2 * (7 + crest.depth * 11);
      const x = crest.x + crest.outwardX * advance;
      const y = crest.y + crest.outwardY * advance;
      const dx = crest.dx * crest.length + 4 * lap;
      const dy = crest.dy * crest.length;
      const strength = crest.strength * lap ** 2;
      ctx.strokeStyle = 'rgba(143,163,166,' + strength + ')';
      ctx.lineWidth = 0.65 + lap * 0.92;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + dx * 0.55 + 4, y + dy * 0.49 - 1.3, x + dx, y + dy);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(178,193,185,' + strength * 0.48 + ')';
      ctx.lineWidth = 0.69 + crest.depth * 0.64;
      ctx.beginPath();
      ctx.moveTo(x + dx * 0.24 + crest.outwardX * 4, y + dy * 0.24 + crest.outwardY * 4);
      ctx.lineTo(x + dx * 0.7 + crest.outwardX * 7, y + dy * 0.7 + crest.outwardY * 7);
      ctx.stroke();
    }

    const rotation = Math.sin(time - 0.88);
    const forward = Math.cos(time - 0.88);
    const castX = LIGHT.x + rotation * 1690;
    const castY = LIGHT.y - 9 + 31 * rotation - 23 * forward;
    const reach = Math.abs(rotation);
    if (reach > 0.01) {
      const dx = castX - LIGHT.x;
      const dy = castY - LIGHT.y;
      const width = 83 + reach * 83;
      ctx.save();
      ctx.translate(LIGHT.x, LIGHT.y);
      ctx.rotate(Math.atan2(dy, dx));
      ctx.globalAlpha = reach ** 1.38 * (0.69 + (1 + forward) * 0.12);
      ctx.drawImage(lightShaft, 0, -width / 2, Math.hypot(dx, dy), width);
      ctx.restore();
    }

    ctx.drawImage(foreground, 0, 0);
    const light = 0.27 + 0.13 * Math.pow(0.5 + 0.5 * forward, 1.35);
    softOval(ctx, LIGHT.x, LIGHT.y, 70, 65, 'rgba(240,180,98,' + light + ')', 'rgba(240,180,98,0)');
    softOval(ctx, LIGHT.x, LIGHT.y, 10, 12, 'rgba(255,228,158,0.61)', 'rgba(255,228,158,0)');
    ctx.drawImage(vignette, 0, 0);
  };
}

module.exports = { title: '안개 낀 곶의 등대', slug: 'beacon-on-the-headland', sound: 'sea', createScene };
