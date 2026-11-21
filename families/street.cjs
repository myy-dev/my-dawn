'use strict';

const width = 1920;
const height = 1080;
const tau = 2 * Math.PI;
const wrap = value => value - Math.floor(value);

function randomFor(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function fill(ctx, color, x = 0, y = 0, w = width, h = height) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function shape(ctx, color, coords) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(coords[0], coords[1]);
  for (let index = 2; index < coords.length; index += 2) ctx.lineTo(coords[index], coords[index + 1]);
  ctx.closePath();
  ctx.fill();
}

function stroke(ctx, color, weight, coords) {
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  ctx.beginPath();
  ctx.moveTo(coords[0], coords[1]);
  for (let index = 2; index < coords.length; index += 2) ctx.lineTo(coords[index], coords[index + 1]);
  ctx.stroke();
}

function ellipse(ctx, color, x, y, rx, ry, rotation = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, tau);
  ctx.fill();
}

function wheel(ctx, x, y, radius) {
  ellipse(ctx, '#11181e', x, y, radius, radius);
  ellipse(ctx, '#3b4850', x, y, radius - 6, radius - 6);
  ellipse(ctx, '#253239', x, y, radius - 9, radius - 9);
  for (let k = 0; k < 12; k++) {
    const angle = tau * k / 12;
    stroke(ctx, '#4b5556', 1.1, [x, y, x + Math.cos(angle) * (radius - 9), y + Math.sin(angle) * (radius - 9)]);
  }
  ellipse(ctx, '#858e80', x, y, 4, 4);
}

function lineGradient(ctx, top, bottom, start = 0, end = height) {
  const g = ctx.createLinearGradient(0, start, 0, end);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  return g;
}

function light(ctx, x, y, rx, ry, hue, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, 'rgba(' + hue + ',' + opacity + ')');
  g.addColorStop(.29, 'rgba(' + hue + ',' + opacity * .47 + ')');
  g.addColorStop(1, 'rgba(' + hue + ',0)');
  fill(ctx, g, -1, -1, 2, 2);
  ctx.restore();
}

function scuff(ctx, random, x, y, w, h, count, alpha = .075) {
  for (let i = 0; i < count; i++) {
    const posX = x + w * random(), posY = y + h * random();
    const colour = random() < .54 ? '8,12,17' : '147,154,144';
    fill(ctx, 'rgba(' + colour + ',' + alpha * random() + ')', posX, posY, .5 + random() * 5, .5 + random() * 2);
  }
}

function finish(ctx, random) {
  scuff(ctx, random, 0, 0, width, height, 16000, .06);
  grade(ctx);
  const v = ctx.createRadialGradient(960, 515, 490, 960, 540, 1090);
  v.addColorStop(0, 'rgba(5,9,15,0)');
  v.addColorStop(.67, 'rgba(5,9,15,.115)');
  v.addColorStop(1, 'rgba(3,6,10,.49)');
  fill(ctx, v);
}

// One-time tone curve on the static plate: deeper shadows, brighter lamps and windows, a little more colour.
function grade(ctx) {
  const image = ctx.getImageData(0, 0, width, height), data = image.data;
  const pivot = .2, curve = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    const y = x < pivot ? pivot * (x / pivot) ** 1.3 : pivot + (1 - pivot) * ((x - pivot) / (1 - pivot)) ** .78;
    curve[i] = Math.round(y * 255);
  }
  for (let i = 0; i < data.length; i += 4) {
    const luma = .3 * data[i] + .59 * data[i + 1] + .11 * data[i + 2];
    for (let k = 0; k < 3; k++) data[i + k] = curve[Math.max(0, Math.min(255, Math.round(luma + (data[i + k] - luma) * 1.08)))];
  }
  ctx.putImageData(image, 0, 0);
}

function skyline(ctx, random, horizon, tone, windowHue, left = 0, right = width) {
  for (let x = left - 15; x < right;) {
    const w = 42 + random() * 138;
    const h = 12 + Math.pow(random(), 1.7) * 152;
    fill(ctx, tone, x, horizon - h, w + 1, h);
    if (random() < .42) stroke(ctx, tone, 1.5, [x + w * .67, horizon - h - 18, x + w * .67, horizon - h]);
    for (let px = x + 13; px < x + w - 12; px += 19) {
      for (let py = horizon - h + 15; py < horizon - 5; py += 20) {
        if (random() < .135) fill(ctx, 'rgba(' + windowHue + ',' + (.023 + random() * .22) + ')', px, py, 4, 2);
      }
    }
    x += w;
  }
}

function rainSet(random, count) {
  return Array.from({ length: count }, () => ({
    x: random() * (width + 260) - 130,
    y: random(),
    n: 2 + Math.floor(random() * 4),
    h: 13 + random() * 34,
    a: .018 + random() * .108,
  }));
}

function rain(ctx, particles, phase, cutoff = height) {
  for (const p of particles) {
    const f = wrap(p.y + phase * p.n);
    const y = -90 + f * (cutoff + 170);
    const x = p.x + f * 72;
    stroke(ctx, 'rgba(153,175,186,' + p.a + ')', 1, [x, y, x + p.h * .11, y + p.h]);
  }
}

function snowSet(random, count) {
  return Array.from({ length: count }, () => ({
    x: random() * (width + 150) - 75, y: random(),
    n: 1 + Math.floor(random() * 2), r: .45 + random() * 2.5,
    a: .04 + random() * .20, shift: random() * tau,
  }));
}

function snow(ctx, particles, phase, cutoff = height) {
  for (const p of particles) {
    const f = wrap(p.y + phase * p.n);
    const y = f * (cutoff + 14) - 7;
    const x = p.x + 19 * Math.sin(f * 8 + p.shift) + 10 * Math.sin(phase * tau + p.shift);
    ellipse(ctx, 'rgba(209,221,215,' + p.a + ')', x, y, p.r, p.r * .77);
  }
}

function pavement(ctx, random, horizon, wet, warmX) {
  fill(ctx, lineGradient(ctx, '#303a41', wet ? '#1c242b' : '#323a40', horizon), 0, horizon, width, height - horizon);
  const walkwayLeft = 855, walkwayRight = 1320;
  for (let i = 0; i < 28; i++) {
    const y = horizon + (height - horizon) * (i / 27) ** 1.8;
    stroke(ctx, 'rgba(12,16,19,.31)', 1.1, [0, y, width, y + (y - horizon) * .055]);
  }
  // Paving joints fan out from a vanishing point; many faint seams read as texture, not as guide lines.
  const vanishX = (walkwayLeft + walkwayRight) / 2;
  for (let i = -11; i <= 11; i++) {
    stroke(ctx, 'rgba(10,14,18,' + (.05 + random() * .05) + ')', 1, [vanishX + i * 30, horizon, vanishX + i * 215, height]);
  }
  scuff(ctx, random, 0, horizon, width, height - horizon, 7900, .13);
  if (wet) {
    light(ctx, warmX, horizon + (height - horizon) * .42, 260, 230, '214,156,99', .15);
    // Light on wet asphalt stretches toward the viewer as short vertical streaks.
    for (let i = 0; i < 320; i++) {
      const y = horizon + 10 + random() ** 1.3 * (height - horizon - 10);
      const spread = 70 + (y - horizon) * 1.1;
      const x = warmX + (random() + random() - 1) * spread;
      const tint = random() > .28 ? '214,165,108' : '150,178,186';
      stroke(ctx, 'rgba(' + tint + ',' + random() * .16 + ')', 1 + random() * 2.2, [x, y, x + (random() - .5) * 3, y + 6 + random() * 34]);
    }
  }
  const near = ctx.createLinearGradient(0, horizon, 0, height);
  near.addColorStop(0, 'rgba(6,10,14,0)');
  near.addColorStop(1, 'rgba(6,10,14,.42)');
  fill(ctx, near, 0, horizon, width, height - horizon);
}

// Mirror everything above the base line onto wet ground, fading and rippling toward the viewer.
function wetReflection(ctx, createCanvas, base, strength) {
  const snap = createCanvas(width, height);
  snap.getContext('2d').drawImage(ctx.canvas, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let y = base; y < height; y += 3) {
    const d = y - base, source = base - d * 1.15;
    if (source < 3) break;
    ctx.globalAlpha = strength * (1 - d / (height - base)) ** 1.4;
    ctx.drawImage(snap, 0, source - 3, width, 3, Math.sin(y * .23) * (1 + d / 90), y, width, 3);
  }
  ctx.restore();
}

function masonry(ctx, random, x, y, w, h, base, brickW, brickH) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  fill(ctx, base, x, y, w, h);
  for (let row = 0; row < h / brickH; row++) {
    const py = y + row * brickH;
    for (let px = x - (row % 2) * brickW / 2; px < x + w; px += brickW) {
      fill(ctx, 'rgba(117,116,105,' + random() * .12 + ')', px + 3, py + 2, brickW - 4, brickH - 3);
      stroke(ctx, 'rgba(7,11,17,.45)', 1.2, [px + 1, py + 1, px + brickW, py + 1, px + brickW, py + brickH]);
    }
  }
  scuff(ctx, random, x, y, w, h, 5400, .1);
  ctx.restore();
}

function contactShadow(ctx, x, y, rx, ry) {
  light(ctx, x, y, rx, ry, '6,12,17', .74);
  light(ctx, x - rx * .31, y + 6, rx * .55, ry * .64, '8,13,17', .26);
  light(ctx, x + rx * .49, y - 2, rx * .58, ry * .47, '8,13,17', .27);
}

function stopShelter(ctx, random) {
  contactShadow(ctx, 943, 741, 618, 68);
  shape(ctx, '#3f4a4d', [335, 215, 1384, 266, 1575, 407, 512, 368]);
  shape(ctx, '#222e37', [349, 234, 1377, 285, 1558, 400, 516, 365]);
  shape(ctx, '#596062', [333, 214, 1384, 267, 1587, 405, 513, 367, 503, 350, 1550, 384, 1379, 258, 341, 224]);
  const bays = [493, 779, 1106, 1407];
  for (let i = 0; i < bays.length - 1; i++) {
    const x = bays[i];
    const wallHeight = 338 - i * 8;
    const y = 358 + i * 10;
    const w = bays[i + 1] - x;
    const gray = ctx.createLinearGradient(x, y, x + w, y + wallHeight);
    gray.addColorStop(0, 'rgba(124,150,158,.43)');
    gray.addColorStop(.48, 'rgba(41,66,83,.42)');
    gray.addColorStop(1, 'rgba(114,129,133,.36)');
    fill(ctx, gray, x, y, w, wallHeight);
    shape(ctx, 'rgba(173,175,150,.13)', [x + 30, y + 10, x + 59, y + 10, x + w * .82, y + wallHeight, x + w * .76, y + wallHeight]);
    stroke(ctx, '#5e6661', 2, [x, y + wallHeight - 3, x + w, y + wallHeight - 3]);
  }
  for (const x of [...bays, 1536]) {
    stroke(ctx, '#263239', 20, [x, x === 1536 ? 393 : 361, x + 4, 757]);
    stroke(ctx, '#536065', 3, [x - 8, x === 1536 ? 403 : 372, x - 4, 751]);
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(542, 376, 850, 280);
  ctx.clip();
  for (let i = 0; i < 1250; i++) {
    const x = 540 + random() * 870, y = 370 + random() * 286;
    ellipse(ctx, 'rgba(150,179,181,' + random() * .20 + ')', x, y, .6 + random() * 1.6, .7 + random() * 2);
  }
  ctx.restore();
  shape(ctx, '#646860', [721, 626, 1230, 631, 1340, 662, 811, 658]);
  shape(ctx, '#484c45', [811, 658, 1340, 662, 1336, 676, 813, 672]);
  for (const x of [822, 1290]) stroke(ctx, '#414748', 7, [x, 667, x - 8, 727]);
  fill(ctx, '#c3b496', 530, 453, 79, 110);
  fill(ctx, '#716c56', 536, 460, 67, 19);
  for (let i = 0; i < 6; i++) fill(ctx, '#8c8067', 541, 487 + i * 9, 49 + random() * 7, 1.5);
  light(ctx, 923, 379, 450, 190, '238,183,120', .23);
  stroke(ctx, 'rgba(244,205,149,.68)', 6, [603, 372, 1260, 393]);
}

function bicycleStreet(ctx) {
  const x = 991, y = 772;
  stroke(ctx, '#292c2e', 15, [1110, 756, 1110, 283, 1084, 246, 968, 246]);
  stroke(ctx, '#676c6b', 3, [1106, 747, 1106, 283, 1082, 250, 975, 250]);
  light(ctx, 972, 262, 252, 210, '219,176,113', .24);
  light(ctx, 1010, 725, 350, 169, '219,176,113', .20);
  shape(ctx, '#423e37', [935, 246, 992, 245, 1008, 260, 916, 259]);
  stroke(ctx, '#cead79', 4, [926, 261, 998, 262]);
  contactShadow(ctx, x, y + 10, 296, 39);
  wheel(ctx, x - 144, y - 58, 61);
  wheel(ctx, x + 111, y - 59, 65);
  stroke(ctx, '#8e604b', 6, [x - 144, y - 58, x - 69, y - 163, x - 20, y - 61, x - 144, y - 58]);
  stroke(ctx, '#855646', 6, [x - 69, y - 163, x + 68, y - 144, x - 20, y - 61, x + 69, y - 146, x + 111, y - 59]);
  stroke(ctx, '#86908b', 4, [x + 69, y - 138, x + 59, y - 186, x + 29, y - 197, x + 45, y - 198]);
  stroke(ctx, '#232734', 9, [x - 90, y - 169, x - 53, y - 167]);
  ellipse(ctx, '#414448', x - 20, y - 61, 14, 14);

  // The shackle passes behind the post and rejoins its crossbar at the fork.
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(1063, 661);
  ctx.bezierCurveTo(1084, 650, 1118, 644, 1127, 652);
  ctx.bezierCurveTo(1139, 664, 1124, 675, 1081, 686);
  ctx.strokeStyle = '#151d20';
  ctx.lineWidth = 9;
  ctx.stroke();
  stroke(ctx, '#282f30', 14, [1062, 659, 1081, 686]);
  stroke(ctx, 'rgba(190,157,111,.58)', 2.5, [1063, 655, 1070, 665]);
  ctx.beginPath();
  ctx.moveTo(1107, 649);
  ctx.quadraticCurveTo(1122, 646, 1126, 652);
  ctx.strokeStyle = 'rgba(177,158,124,.43)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
}

function florist(ctx, random) {
  const start = 379, base = 739;
  masonry(ctx, random, 146, 127, 1595, 615, '#394445', 160, 31);
  for (const [left, w] of [[start, 695], [1114, 379]]) {
    fill(ctx, '#202b31', left, 330, w, 409);
    const shutter = lineGradient(ctx, '#495350', '#323d41', 339, base);
    fill(ctx, shutter, left + 16, 338, w - 32, 386);
    for (let y = 344; y < 728; y += 12) {
      stroke(ctx, '#252e32', 2, [left + 16, y, left + w - 16, y - 2]);
      stroke(ctx, 'rgba(180,187,166,.14)', 1, [left + 17, y + 3, left + w - 16, y + 1]);
    }
  }
  shape(ctx, '#5e514a', [298, 277, 1451, 284, 1534, 369, 353, 369]);
  for (let i = 0; i < 15; i++) {
    const x = 300 + i * 76;
    shape(ctx, i % 2 === 0 ? '#594744' : '#73665c', [x, 279, x + 76, 280, x + 137, 368, x + 54, 369]);
  }
  stroke(ctx, '#918075', 5, [351, 369, 1537, 369]);
  stroke(ctx, 'rgba(240,191,132,.57)', 4, [401, 375, 1449, 375]);
  light(ctx, 884, 426, 650, 166, '217,168,109', .25);
  for (const [x, y, w] of [[414, 662, 192], [623, 680, 175], [1300, 669, 163]]) {
    fill(ctx, '#342c23', x, y, w, 70);
    for (let j = 0; j < 5; j++) fill(ctx, '#605045', x + 2, y + j * 13, w - 4, 9);
    if (x === 623) {
      for (let j = 0; j < 9; j++) {
        const px = x + random() * w, py = y - random() * 57;
        ellipse(ctx, j % 3 === 0 ? '#65725e' : '#49584a', px, py, 9 + random() * 7, 4 + random() * 6, random() * 4);
        stroke(ctx, '#495449', 1.3, [x + w * .5, y + 3, px, py]);
      }
    }
  }
}

function illuminatedDrops(ctx, particles, phase, frozen) {
  for (const p of particles) {
    const age = wrap(p.offset + phase * p.speed);
    const alpha = p.alpha * Math.sin(Math.PI * age) ** 1.42;
    const x = p.x + age * p.slant, y = p.y + age * p.fall;
    if (frozen) {
      const drift = Math.sin(phase * tau + p.offset * tau) * 11;
      const fineLight = 'rgba(202,193,155,' + alpha + ')';
      ellipse(ctx, fineLight, x + drift, y, p.length * .13, p.length * .1);
    } else {
      stroke(ctx, 'rgba(213,192,151,' + alpha + ')', 1.4, [x, y, x + p.length * .18, y + p.length]);
    }
  }
}

function streetView(createCanvas, seed, kind) {
  const rnd = randomFor(seed);
  const layer = createCanvas(width, height);
  const c = layer.getContext('2d');
  fill(c, lineGradient(c, '#141e2a', '#44505a', 0, 760));
  light(c, 1090, 610, 1110, 375, '139,154,163', .36);
  skyline(c, rnd, 718, '#33404a', '201,181,136');
  skyline(c, rnd, 764, '#252e38', '202,166,107');
  if (kind === 'bicycle') {
    masonry(c, rnd, 0, 318, 1920, 454, '#394449', 145, 28);
    for (const x of [247, 598, 1313, 1650]) {
      fill(c, '#28373f', x, 372, 142, 181);
      stroke(c, '#4b5557', 4, [x + 70, 376, x + 70, 551]);
      stroke(c, '#4b5557', 4, [x + 3, 461, x + 138, 461]);
    }
  } else if (kind === 'shelter') {
    shape(c, '#222c34', [0, 438, 264, 486, 267, 728, 0, 744]);
    shape(c, '#242e38', [1754, 382, 1920, 336, 1920, 760, 1754, 728]);
  }
  pavement(c, rnd, 713, kind !== 'bicycle', kind === 'shelter' ? 864 : 920);
  if (kind === 'shelter') stopShelter(c, rnd);
  if (kind === 'bicycle') bicycleStreet(c);
  if (kind === 'florist') florist(c, rnd);
  if (kind === 'shelter') wetReflection(c, createCanvas, 757, .42);
  if (kind === 'florist') wetReflection(c, createCanvas, 739, .42);
  finish(c, rnd);
  const particles = kind === 'bicycle' ? snowSet(rnd, 100) : rainSet(rnd, kind === 'shelter' ? 148 : 83);
  const lit = Array.from({length: 48}, () => ({
    offset: rnd(), speed: 2 + Math.floor(rnd() * 4),
    x: (kind === 'bicycle' ? 751 : 671) + rnd() * (kind === 'bicycle' ? 366 : 614),
    y: (kind === 'bicycle' ? 261 : 377) + rnd() * 200,
    length: 17 + rnd() * 37, alpha: .075 + rnd() * (kind === 'bicycle' ? .28 : .19),
    slant: (kind === 'bicycle' ? 63 : 46) + rnd() * 40,
    fall: 240 + rnd() * 199,
  }));
  const foliage = [507, 1379].map((x, i) => ({
    x, y: i === 0 ? 663 : 671,
    twigs: Array.from({length: 16}, () => ({
      dx: (rnd() - .5) * 140, dy: 26 + rnd() * 68, rx: 6 + rnd() * 10, angle: rnd() * tau,
    })),
  }));
  return (ctx, phase) => {
    const p = wrap(phase);
    ctx.drawImage(layer, 0, 0);
    if (kind === 'bicycle') {
      snow(ctx, particles, p);
      illuminatedDrops(ctx, lit, p, true);
    } else {
      rain(ctx, particles, p);
      if (kind === 'shelter') illuminatedDrops(ctx, lit, p, false);
      if (kind === 'florist') {
        for (const plant of foliage) {
          for (const leaf of plant.twigs) {
            const sway = Math.sin(tau * (p * 3) + leaf.angle) * leaf.dy * .125;
            const x = plant.x + leaf.dx + sway, y = plant.y - leaf.dy;
            stroke(ctx, '#4b5848', 1.65, [plant.x + leaf.dx * .29, plant.y + 1, x, y]);
            ellipse(ctx, Math.sin(leaf.angle) > 0 ? '#63735f' : '#535f51', x, y, leaf.rx, leaf.rx * .48, leaf.angle + sway * .024);
          }
        }
      }
      const x = kind === 'shelter' ? 770 : 947;
      for (let i = 0; i < 6; i++) {
        const f = wrap(p * 7 + i * .391);
        const cx = x + Math.sin(i * 7) * (119 + i * 42);
        const cy = 784 + i * 39;
        ctx.strokeStyle = 'rgba(159,164,157,' + Math.sin(Math.PI * f) * .19 + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 3 + f * (17 + i * 3), 1 + f * (3 + i), 0, 0, tau);
        ctx.stroke();
      }
    }
  };
}

const collection = [
  { id: '71', title: '막차가 떠난 버스 정류장', slug: 'after-the-last-bus', sound: 'rain-street', soundLabel: '지붕과 보도에 떨어지는 빗소리', createScene: maker => streetView(maker, 71544, 'shelter') },
  { id: '72', title: '가로등 아래 묶인 자전거', slug: 'bicycle-below-a-streetlamp', sound: 'snow', soundLabel: '골목을 스치는 바람 소리', createScene: maker => streetView(maker, 72324, 'bicycle') },
  { id: '73', title: '문을 닫은 새벽 꽃집', slug: 'closed-flower-shop-before-dawn', sound: 'rain-street', soundLabel: '차양 끝에서 떨어지는 빗물 소리', createScene: maker => streetView(maker, 73667, 'florist') },
];

module.exports = collection;

function skyPlate(ctx, rnd, base) {
  fill(ctx, lineGradient(ctx, base, '#45525d', 0, 785));
  light(ctx, 1170, 529, 970, 388, '140,155,163', .33);
  for (let i = 0; i < 110; i++) {
    const x = rnd() * width, y = 10 + rnd() * 385;
    ellipse(ctx, 'rgba(205,207,193,' + rnd() * .15 + ')', x, y, .5 + rnd() * 1.5, .7);
  }
}

function driftingClouds(ctx, phase, clouds) {
  for (const p of clouds) {
    const f = wrap(p.offset + phase * p.speed);
    const x = -520 + f * (width + 1040);
    light(ctx, x, p.y, p.w, p.h, p.color, p.alpha);
  }
}

function addClouds(random, count, minY, maxY, tone) {
  return Array.from({ length: count }, () => ({
    y: minY + random() * (maxY - minY), w: 140 + random() * 290, h: 14 + random() * 38,
    offset: random(), speed: 1, color: tone, alpha: .035 + random() * .07,
  }));
}

function rooftopView(makeCanvas, seed, kind) {
  const rnd = randomFor(seed);
  const base = makeCanvas(width, height);
  const c = base.getContext('2d');
  skyPlate(c, rnd, '#111d2c');
  const skylineHeight = kind === 'radio' ? 785 : 685;
  skyline(c, rnd, skylineHeight - 75, '#3c4a52', '175,190,182');
  skyline(c, rnd, skylineHeight + 40, '#292f39', '201,170,107');
  if (kind === 'laundry') {
    fill(c, lineGradient(c, '#414a4c', '#1e252e', 708), 0, 714, width, 366);
    shape(c, '#59605c', [0, 703, 1920, 683, 1920, 730, 0, 745]);
    stroke(c, '#72736a', 2, [0, 707, 1920, 687]);
    for (let i = 0; i < 19; i++) {
      const d = (i / 19) ** 1.8;
      const y = 774 + d * 360;
      stroke(c, 'rgba(10,16,19,.40)', 1.4, [0, y, width, y - 15 - d * 20]);
    }
    for (const x of [299, 1569]) {
      stroke(c, '#53605f', 16, [x, 879, x, 282]);
      stroke(c, '#7b8581', 2, [x - 6, 880, x - 6, 288]);
      fill(c, '#313d41', x - 15, 278, 29, 12);
    }
    for (const x of [439, 1453]) {
      shape(c, '#514c43', [x - 41, 847, x + 31, 847, x + 23, 918, x - 34, 915]);
      for (let i = 0; i < 29; i++) {
        const px = x + 100 * (rnd() - .5), py = 756 + rnd() * 95;
        stroke(c, 'rgba(105,132,119,.52)', 1.8, [x, 859, px, py]);
        ellipse(c, '#536d60', px, py, 10 + rnd() * 7, 3 + rnd() * 3, rnd() * 4);
      }
    }
  } else if (kind === 'radio') {
    shape(c, '#242a33', [0, 883, 490, 819, 1613, 838, 1920, 873, 1920, 1080, 0, 1080]);
    stroke(c, '#697172', 5, [0, 864, 485, 811, 1613, 821, 1920, 861]);
    shape(c, '#2a333a', [270, 816, 588, 766, 603, 922, 301, 1006]);
    ellipse(c, '#4c5150', 434, 780, 157, 32, -.11);
    for (let y = 804; y < 981; y += 17) stroke(c, 'rgba(138,139,120,.21)', 2, [292, y + 13, 588, y - 43]);
    const towerX = 1225;
    contactShadow(c, towerX, 939, 346, 42);
    shape(c, '#30373c', [1051, 927, 1369, 928, 1423, 943, 1091, 950]);
    stroke(c, '#464d4e', 2, [1065, 928, 1365, 929]);
    for (const x of [1084, 1366]) {
      shape(c, '#353e42', [x - 8, 910, x + 8, 910, x + 14, 934, x - 15, 934]);
      stroke(c, '#2b3a41', 9, [x, 924, towerX, 150]);
      stroke(c, '#617074', 2.7, [x + (x < towerX ? 3 : -3), 917, towerX, 151]);
    }
    for (let y = 225; y < 906; y += 44) {
      const half = (y - 150) * .182;
      stroke(c, '#3b4a50', 4, [towerX - half, y, towerX + half, y, towerX - (half + 8), y + 44]);
      stroke(c, '#546167', 1.45, [towerX - half, y - 1, towerX + half, y - 1]);
    }
    for (let y = 240; y < 575; y += 82) {
      stroke(c, '#4e6167', 3, [1225 - 52, y - 16, 1225 + 83, y - 12]);
      for (let k = 0; k < 5; k++) stroke(c, '#617175', 1.2, [1180 + 27 * k, y - 34, 1180 + 27 * k, y + 2]);
    }
    stroke(c, '#667478', 3, [1225, 155, 1225, 132]);
    ellipse(c, '#8d5955', 1225, 131, 4.7, 4.7);
  } else {
    shape(c, '#33363c', [0, 633, 663, 488, 1451, 913, 1920, 821, 1920, 1080, 0, 1080]);
    c.save();
    c.clip();
    for (let j = 0; j < 17; j++) {
      const y = 664 + (j / 17) ** 1.35 * 526;
      const x = (y - 650) * 1.34;
      stroke(c, '#20282e', 6, [0, y + 14, 656 + x, y - 155, 1451 + x, y + 274]);
      stroke(c, 'rgba(145,126,111,.20)', 2, [0, y + 9, 656 + x, y - 159, 1451 + x, y + 268]);
      for (let i = 0; i < 23; i++) {
        const ox = i * (56 + j * 3) - (j % 2) * 41;
        stroke(c, 'rgba(19,24,29,.34)', 1.8, [ox, y - ox * .24, ox + 12, y + 24 - ox * .24]);
      }
    }
    c.restore();
    for (const [x, y, w, h] of [[668, 410, 137, 277], [1262, 655, 103, 185]]) {
      masonry(c, rnd, x, y, w, h, '#463f3e', 68, 25);
      shape(c, '#394047', [x + w, y, x + w + 39, y + 18, x + w + 39, y + h - 6, x + w, y + h]);
      shape(c, '#5a5149', [x - 12, y - 19, x + w + 9, y - 20, x + w + 50, y + 6, x - 12, y + 7]);
      stroke(c, 'rgba(194,162,128,.32)', 3, [x - 8, y - 15, x + w + 8, y - 16]);
    }
  }
  finish(c, rnd);
  const clouds = addClouds(rnd, kind === 'radio' ? 7 : 4, 139, 342, '177,194,202');
  const fabrics = [[446, 486, 191, '#6d7d7c'], [642, 756, 131, '#927d70'], [831, 1157, 241, '#586975'], [1223, 1349, 113, '#7f857c']];
  return (ctx, phase) => {
    const p = wrap(phase), angle = p * tau;
    ctx.drawImage(base, 0, 0);
    if (kind === 'laundry') {
      ctx.strokeStyle = 'rgba(184,186,166,.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(298, 343);
      ctx.quadraticCurveTo(961, 445, 1569, 339);
      ctx.stroke();
      for (const [left, right, drop, color] of fabrics) {
        const a = (left - 299) / 1270, b = (right - 299) / 1270;
        const ly = 343 + 196 * a * (1 - a), ry = 343 + 196 * b * (1 - b);
        const offset = Math.sin(angle * 3 + left * .01) * 23 + Math.sin(angle * 2) * 8;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(left, ly);
        ctx.lineTo(right, ry);
        ctx.bezierCurveTo(right + offset * .7, ry + drop * .36, right - offset * .32, ry + drop * .75, right + offset, ry + drop - 12);
        ctx.quadraticCurveTo((left + right) / 2 + offset, (ly + ry) / 2 + drop + Math.sin(angle * 3 + left * .01) * 14, left + offset * .7, ly + drop);
        ctx.quadraticCurveTo(left + offset * .42, ly + drop * .4, left, ly);
        ctx.fill();
        for (let i = 1; i < 6; i++) {
          const x = left + (right - left) * i / 6;
          const y = ly + (ry - ly) * i / 6;
          stroke(ctx, 'rgba(34,44,53,.22)', 1.5, [x, y + 2, x + offset * .58, y + drop * .94]);
        }
        for (const x of [left + 4, right - 4]) fill(ctx, '#b29a6d', x - 1, (x === left + 4 ? ly : ry) - 5, 4, 10);
      }
    }
    if (kind === 'radio') {
      driftingClouds(ctx, p, clouds);
      const glow = .11 + .09 * (.5 + .5 * Math.cos(angle * 6)) ** 3;
      light(ctx, 1225, 131, 23, 20, '220,106,84', glow);
      ellipse(ctx, 'rgba(232,134,112,' + (.39 + glow) + ')', 1225, 131, 3, 3);
    }
    if (kind === 'tile') {
      for (const [x, y, strength] of [[741, 388, 1], [1321, 633, .63]]) {
        for (let i = 0; i < 12; i++) {
          const f = wrap(p * 2 + i / 12);
          light(ctx, x + (f ** 1.25) * 157 + Math.sin(f * 9 + angle * 3) * f * 23, y - f * 184,
            (18 + f * 61) * strength, (10 + f * 33) * strength, '165,178,181', .19 * Math.sin(Math.PI * f) ** 1.1);
        }
      }
    }
  };
}

collection.push(
  { id: '74', title: '옥상 빨랫줄의 흰 셔츠', slug: 'linen-over-the-night-roofs', sound: 'gust', soundLabel: '옥상에 부는 잔잔한 바람', createScene: maker => rooftopView(maker, 74651, 'laundry') },
  { id: '75', title: '먼 옥상의 작은 경고등', slug: 'little-rooftop-beacon', sound: 'gust', soundLabel: '안테나 사이에 부는 바람', createScene: maker => rooftopView(maker, 75049, 'radio') },
  { id: '76', title: '기와 위로 흐르는 굴뚝 연기', slug: 'smoke-above-the-roof-tiles', sound: 'gust', soundLabel: '기와를 스치는 찬 바람', createScene: maker => rooftopView(maker, 76467, 'tile') },
);

function drawOpenArch(ctx, rnd) {
  const horizon = 640;
  fill(ctx, lineGradient(ctx, '#233644', '#4d5b62', 83, horizon));
  skyline(ctx, rnd, horizon + 4, '#3a444c', '204,172,109');
  fill(ctx, lineGradient(ctx, '#394b56', '#202b34', horizon), 0, horizon, width, height - horizon);
  light(ctx, 940, 674, 384, 189, '165,177,172', .24);
  shape(ctx, '#2c373e', [0, 670, 669, 618, 838, 644, 421, 1080, 0, 1080]);
  shape(ctx, '#2b343c', [1920, 681, 1254, 621, 1180, 640, 1678, 1080, 1920, 1080]);
  for (let i = 0; i < 230; i++) {
    const r = rnd();
    const y = 643 + r * 437, x = 958 + (rnd() - .5) * (202 + r * 824);
    stroke(ctx, 'rgba(149,171,179,' + rnd() * .12 + ')', .8 + r, [x, y, x + 8 + rnd() * (8 + 69 * r), y + r * .7]);
  }
}

function archMask(c) {
  c.beginPath();
  c.rect(0, 0, width, height);
  c.moveTo(363, 1080);
  c.lineTo(432, 636);
  c.bezierCurveTo(475, 71, 1452, 40, 1480, 627);
  c.lineTo(1556, 1080);
  c.closePath();
  c.clip('evenodd');
}

function drawArchOverlay(c, rnd) {
  c.save();
  archMask(c);
  masonry(c, rnd, 0, 0, width, height, '#374047', 154, 59);
  light(c, 950, 411, 900, 700, '159,149,123', .17);
  scuff(c, rnd, 0, 0, width, height, 6000, .12);
  c.restore();
  c.strokeStyle = '#59615e';
  c.lineWidth = 21;
  c.beginPath();
  c.moveTo(363, 1080);
  c.lineTo(431, 640);
  c.bezierCurveTo(465, 72, 1453, 43, 1481, 631);
  c.lineTo(1556, 1080);
  c.stroke();
  c.strokeStyle = 'rgba(173,172,150,.17)';
  c.lineWidth = 3;
  c.stroke();
}

function underTrain(ctx, rnd) {
  const horizon = 580, vx = 1200;
  fill(ctx, lineGradient(ctx, '#162331', '#47565e', 0, horizon + 60));
  skyline(ctx, rnd, horizon + 30, '#39464e', '204,174,130');
  pavement(ctx, rnd, horizon + 45, true, 1157);
  shape(ctx, '#25323b', [0, 114, 1920, 285, 1920, 461, vx, 405, 0, 431]);
  shape(ctx, '#34444d', [0, 286, 1920, 353, 1920, 394, vx, 388, 0, 395]);
  for (let i = 0; i < 11; i++) {
    const x = -130 + i * 207;
    stroke(ctx, '#1d2731', 11, [x, 181 + i * 10, x + 203, 352 + i * 2, x + 207, 195 + i * 10]);
    stroke(ctx, '#566166', 1.8, [x, 179 + i * 10, x + 206, 348 + i * 2, x + 207, 191 + i * 10]);
  }
  for (const [x, y, w, h] of [[310, 385, 95, 449], [836, 385, 52, 316], [1221, 390, 40, 269], [1649, 394, 68, 315]]) {
    const metallic = ctx.createLinearGradient(x, y, x + w, y);
    metallic.addColorStop(0, '#536068');
    metallic.addColorStop(.17, '#46545b');
    metallic.addColorStop(.85, '#2b3842');
    metallic.addColorStop(1, '#17232e');
    fill(ctx, metallic, x, y, w, h);
    fill(ctx, '#566064', x - 9, y + h - 17, w + 17, 23);
    stroke(ctx, 'rgba(167,168,148,.24)', 1.4, [x + w * .24, y + 16, x + w * .24, y + h - 19]);
    for (let j = 0; j < 4; j++) ellipse(ctx, '#687372', x + 11, y + 26 + j * 12, 2, 1.6);
  }
  for (const [x, y, r] of [[650, 472, 156], [1144, 461, 117], [1480, 462, 96]]) {
    stroke(ctx, '#59615e', 4, [x, y - 39, x, y]);
    ellipse(ctx, '#c3a67d', x, y + 1, 13, 3);
    light(ctx, x, y + 36, r, r * .84, '225,178,124', .24);
    light(ctx, x, y + 254, r * 1.35, r * .36, '189,154,103', .11);
  }
}

function passingRailLight(ctx, phase) {
  const travel = wrap(phase + .39);
  const x = -300 + 2500 * travel;
  const darkness = Math.sin(Math.PI * travel) ** 2;
  ctx.save();
  // The far-side edge of the girder hides the coach below its window strip.
  ctx.beginPath();
  ctx.moveTo(0, 299);
  ctx.lineTo(width, 366);
  ctx.lineTo(width, 387);
  ctx.lineTo(0, 329);
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < 5; i++) {
    const px = x + i * 26;
    const y = 314 + px * .033;
    // Let darker upright truss members interrupt the soft glimmer.
    const withinBay = wrap((px + 130) / 207);
    const visibility = darkness * Math.sin(Math.PI * withinBay) ** 2;
    const opacity = visibility * (.06 + .02 * (i % 2));
    fill(ctx, 'rgba(184,174,130,' + opacity + ')', px, y, 15, 5);
    light(ctx, px + 7, y + 4, 25, 12, '212,184,137', visibility * .062);
  }
  ctx.restore();
}

const metroDrips = [
  { x: 650, y: 628, tread: 7, n: 3, offset: .15 },
  { x: 1321, y: 625, tread: 9, n: 2, offset: .44 },
  { x: 1219, y: 650, tread: 11, n: 2, offset: .83 },
];

function metroTread(tread) {
  return 660 + 508 * (tread / 18) ** 1.55;
}

function fallingStairDrops(ctx, phase) {
  for (const drip of metroDrips) {
    const age = wrap(phase * drip.n + drip.offset);
    const landingY = metroTread(drip.tread);
    const drift = drip.x < 960 ? 3 : -4;
    const endX = drip.x + drift;
    if (age > .68 && age < .77) {
      const falling = (age - .68) / .09;
      const travel = falling ** 2;
      const x = drip.x + drift * travel;
      const y = drip.y + (landingY - drip.y) * travel;
      const opacity = .40 * Math.sin(Math.PI * falling) ** .60;
      stroke(ctx, 'rgba(176,205,194,' + opacity + ')', 3.1, [x, y - (4 + 13 * falling), x, y]);
    } else if (age >= .77 && age < .96) {
      const ripple = (age - .77) / .19;
      const fade = .47 * Math.sin(Math.PI * ripple) * (1 - ripple);
      const rx = 4 + 29 * ripple;
      ctx.beginPath();
      ctx.ellipse(endX, landingY, rx, 1.3 + 4.5 * ripple, 0, .08, Math.PI * .91);
      ctx.strokeStyle = 'rgba(170,202,195,' + fade + ')';
      ctx.lineWidth = 2.3;
      ctx.stroke();
      light(ctx, endX, landingY + 2, 21, 6, '165,197,190', fade * .36);
    }
  }
}

function metroStairs(ctx, rnd) {
  fill(ctx, '#28343e');
  shape(ctx, '#3b484d', [111, 0, 1776, 0, 1325, 646, 670, 646]);
  light(ctx, 980, 317, 548, 276, '157,175,172', .27);
  shape(ctx, '#29343b', [0, 0, 280, 0, 671, 607, 266, 1080, 0, 1080]);
  shape(ctx, '#2d383f', [1623, 0, 1920, 0, 1920, 1080, 1696, 1080, 1326, 610]);
  shape(ctx, '#3c4e55', [282, 0, 651, 625, 268, 1080, 0, 774, 0, 0]);
  shape(ctx, '#414d51', [1621, 0, 1327, 625, 1698, 1080, 1920, 749, 1920, 0]);
  for (let y = 58; y < 1080; y += 37) {
    const center = Math.min(y, 620);
    const leftEnd = 282 + center * .61 - (y - center) * .79;
    const rightStart = 1621 - center * .474 + (y - center) * .82;
    stroke(ctx, 'rgba(14,21,25,.45)', 2, [0, y + (620 - center) * .21, leftEnd, y]);
    stroke(ctx, 'rgba(11,22,28,.46)', 2, [1920, y + (620 - center) * .21, rightStart, y]);
  }
  fill(ctx, '#223039', 725, 351, 538, 309);
  fill(ctx, '#37494e', 741, 366, 505, 291);
  fill(ctx, '#475c5e', 774, 376, 451, 270);
  for (const x of [859, 1125]) stroke(ctx, '#5c7272', 5, [x, 379, x, 642]);
  light(ctx, 996, 466, 435, 269, '159,195,183', .26);
  fill(ctx, '#92a29b', 856, 313, 277, 8);
  for (let i = 0; i < 18; i++) {
    const t = (i / 18) ** 1.55, tNext = ((i + 1) / 18) ** 1.55;
    const y = 652 + 508 * t, nextY = 652 + 508 * tNext;
    const x = 645 - 450 * t, right = 1329 + 467 * t;
    shape(ctx, i % 2 ? '#3a464d' : '#3f4a4f', [x, y, right, y + 3, right + 37, nextY, x - 47, nextY]);
    stroke(ctx, 'rgba(174,177,161,.28)', 2.4, [x + 6, y + 1, right - 1, y + 3]);
  }
  for (const coords of [[74, 827, 657, 481], [1873, 826, 1335, 481], [315, 1080, 766, 563], [1637, 1080, 1225, 563]]) {
    stroke(ctx, '#27383f', 12, coords);
    stroke(ctx, '#739796', 3, [coords[0], coords[1] - 4, coords[2], coords[3] - 3]);
  }
  scuff(ctx, rnd, 0, 396, width, 684, 5200, .10);
  light(ctx, 1000, 644, 250, 41, '155,198,188', .12);
  for (const drip of metroDrips) {
    ellipse(ctx, 'rgba(17,35,41,.37)', drip.x, metroTread(drip.tread), 27, 5);
    light(ctx, drip.x, metroTread(drip.tread), 28, 5, '155,185,176', .15);
    ellipse(ctx, '#46575a', drip.x, drip.y, 4, 2.7);
  }
}

function infrastructure(makeCanvas, seed, kind) {
  const rnd = randomFor(seed);
  const base = makeCanvas(width, height), c = base.getContext('2d');
  if (kind === 'arch') drawOpenArch(c, rnd);
  if (kind === 'under-train') underTrain(c, rnd);
  if (kind === 'metro') metroStairs(c, rnd);
  finish(c, rnd);
  const overlay = makeCanvas(width, height);
  if (kind === 'arch') drawArchOverlay(overlay.getContext('2d'), rnd);
  const particles = rainSet(rnd, 89);
  const sparks = Array.from({length: 76}, () => {
    const depth = rnd() ** .86;
    return {
      x: 946 + (rnd() - .5) * (235 + depth * 428), y: 658 + depth * 395,
      a: .06 + rnd() * .16, f: rnd(), len: 8 + rnd() * (14 + depth * 70), depth,
    };
  });
  const underLamp = kind === 'under-train' ? [650, 1144, 1480].flatMap((x, index) =>
    Array.from({ length: 11 - index * 2 }, () => ({
      x: x - 69 + rnd() * 124, y: 453 + rnd() * 30, fall: 120 + rnd() * 203,
      slant: -33 + rnd() * 39, length: 15 + rnd() * 27, alpha: .18 + rnd() * .18,
      offset: rnd(), speed: 2 + Math.floor(rnd() * 3),
    })),
  ) : [];
  return (ctx, phase) => {
    const p = wrap(phase), angle = p * tau;
    ctx.drawImage(base, 0, 0);
    if (kind === 'arch') {
      for (const f of sparks) {
        const x = f.x + (15 + f.depth * 31) * Math.sin(angle * 2 + f.f * tau);
        const y = f.y + (1.8 + f.depth * 4.7) * Math.sin(angle * 3 + f.f * tau);
        const a = f.a * (.49 + .51 * Math.sin(angle * 3 + f.f * tau));
        const pale = 'rgba(181,198,197,' + a + ')';
        stroke(ctx, pale, 1.5 + f.depth * 1.3, [x, y, x + f.len * .46, y - 1, x + f.len * .58, y - .85]);
        stroke(ctx, 'rgba(147,174,181,' + a * .73 + ')', 1.1 + f.depth * .8, [x + f.len * .76, y - 1.4, x + f.len + 5, y - .75]);
      }
      ctx.drawImage(overlay, 0, 0);
    } else if (kind === 'under-train') {
      passingRailLight(ctx, p);
      rain(ctx, particles, p);
      illuminatedDrops(ctx, underLamp, p, false);
    } else {
      fallingStairDrops(ctx, p);
      // Two short flickers per loop, at fixed points so every pass looks the same.
      let dim = 0;
      for (const at of [.31, .74]) {
        const d = (p - at) * 24;
        if (d > 0 && d < .55) dim = Math.max(dim, Math.sin(d * 37) > -.2 ? .55 * (1 - d / .55) : .15);
      }
      const hum = .5 + .5 * Math.sin(angle * 4);
      light(ctx, 996, 330, 260, 60, '205,232,222', (.08 + .03 * hum) * (1 - dim));
      fill(ctx, `rgba(230,240,232,${.35 * (1 - dim)})`, 858, 314, 273, 6);
      if (dim) fill(ctx, `rgba(8,13,17,${.38 * dim})`, 0, 0, width, height);
    }
  };
}

collection.push(
  { id: '77', title: '돌다리 아치 아래의 물결', slug: 'beneath-the-stone-arch', sound: 'lake', soundLabel: '돌다리 아래 흐르는 물소리', createScene: maker => infrastructure(maker, 77466, 'arch') },
  { id: '78', title: '고가 철길 아래 비 내리는 길', slug: 'rain-under-the-rail-viaduct', sound: 'rain-street', soundLabel: '교각 둘레의 빗소리', createScene: maker => infrastructure(maker, 78221, 'under-train') },
  { id: '79', title: '지하철 입구에 남은 형광등', slug: 'blue-light-down-the-stairs', sound: 'drips', soundLabel: '계단 가장자리에 드문드문 떨어지는 물소리', createScene: maker => infrastructure(maker, 79807, 'metro') },
);

function platformPlate(c, rnd) {
  skyPlate(c, rnd, '#152530');
  skyline(c, rnd, 617, '#37474e', '177,185,165');
  fill(c, lineGradient(c, '#344149', '#262e35', 575), 0, 575, width, 505);
  shape(c, '#465252', [0, 673, 906, 594, 531, 1080, 0, 1080]);
  shape(c, '#3f484a', [1119, 594, 1920, 664, 1920, 1080, 1561, 1080]);
  for (const [x, x2] of [[736, 981], [1089, 1024], [1473, 1091]]) {
    stroke(c, '#1d2b31', 18, [x, 1080, x2, 606]);
    stroke(c, '#687271', 3.5, [x + 1, 1080, x2, 608]);
  }
  for (let i = 0; i < 26; i++) {
    const f = (i / 26) ** 2.5;
    const y = 604 + f * 507, x = 980 - f * 287;
    stroke(c, '#252a2d', 1 + f * 5, [x - 39 * f, y, 1048 + f * 506, y + 13 * f]);
  }
  stroke(c, '#a1966d', 5, [460, 1080, 903, 596]);
  stroke(c, '#7e7a60', 4, [1539, 1080, 1119, 595]);
  shape(c, '#26333c', [0, 126, 876, 472, 938, 522, 0, 342]);
  shape(c, '#324249', [0, 132, 904, 487, 0, 322]);
  for (let i = 0; i < 8; i++) {
    const f = (i / 8) ** .68, x = 111 + f * 783;
    const yTop = 333 + f * 143, yBottom = 996 - f * 405;
    stroke(c, '#293438', 24 - f * 17, [x, yTop, x, yBottom]);
    stroke(c, '#5c6865', 3.5 - f * 2.1, [x - 5 * (1 - f), yTop, x - 5 * (1 - f), yBottom]);
    stroke(c, '#526263', 4 - f * 2.8, [x, yTop + 21 - f * 10, x + 59 * (1 - f), yTop + 38 - f * 8]);
    const xl = x + 57 * (1 - f), yl = yTop + 38 - f * 8;
    ellipse(c, '#d6bf93', xl, yl, 13 - f * 8, 2.7 - f * 1.6);
    light(c, xl, yl + 18 * (1 - f), 171 - f * 153, 118 - f * 105, '226,185,129', .23);
  }
  scuff(c, rnd, 0, 620, width, 460, 8200, .13);
  // The foot sits on the right ballast, away from the converging rails.
  stroke(c, '#343f42', 8, [1194, 635, 1194, 543]);
  stroke(c, '#62716d', 1.8, [1191, 631, 1191, 550]);
  ellipse(c, '#2c383b', 1193, 634, 13, 3.8);
  shape(c, '#273538', [1180, 541, 1190, 530, 1205, 532, 1209, 566, 1180, 566]);
  stroke(c, '#586060', 1.8, [1183, 541, 1191, 532, 1203, 533]);
  ellipse(c, '#4d5147', 1194, 549, 8.1, 8.6);
}

function tramPlate(c, rnd) {
  skyPlate(c, rnd, '#1a2333');
  skyline(c, rnd, 519, '#3e4751', '171,155,132');
  shape(c, '#333d46', [0, 585, 498, 492, 1072, 530, 1509, 384, 1920, 442, 1920, 1080, 0, 1080]);
  for (let i = 0; i < 19; i++) {
    const x = i * 105 - 32, y = 492 + 150 * rnd() - i * 4.2;
    const w = 42 + rnd() * 82, h = 63 + rnd() * 153;
    fill(c, '#27333c', x, y, w, h);
    if (i % 3 === 0) shape(c, '#26313a', [x - 5, y, x + w * .51, y - 29, x + w + 10, y]);
    for (let j = 0; j < 4 + i % 4; j++) {
      const tint = rnd() < .34 ? '#a68d6c' : '#2b4248';
      fill(c, tint, x + 12 + (j % 2) * (w * .40), y + 18 + Math.floor(j / 2) * 24, 7 + rnd() * 4, 8);
    }
  }
  shape(c, '#333b40', [670, 1080, 807, 828, 1104, 703, 1366, 615, 1613, 513, 1920, 459, 1920, 495, 1630, 541, 1392, 668, 1143, 788, 956, 1080]);
  for (const [offset, strength] of [[0, 4.4], [49, 2.8], [116, 4.4]]) {
    c.strokeStyle = '#797467';
    c.lineWidth = strength;
    c.beginPath();
    c.moveTo(726 + offset, 1080);
    c.bezierCurveTo(788 + offset, 812, 1300 + offset * .6, 753, 1445 + offset * .5, 585);
    c.quadraticCurveTo(1628 + offset * .35, 492, 1920, 465 + offset * .29);
    c.stroke();
  }
  const cables = [[749, 776, 1396, 476], [1396, 476, 1700, 432], [1700, 432, 1905, 396]];
  for (const [x0, y0, x1, y1] of cables) {
    stroke(c, '#283743', 4, [x0, y0, x0, y0 + 147 * ((width - x0) / width) + 45]);
    c.strokeStyle = 'rgba(25,35,43,.8)';
    c.lineWidth = 1.9;
    c.beginPath();
    c.moveTo(x0, y0);
    c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 29, x1, y1);
    c.stroke();
  }
  const lights = [[403, 755], [941, 668], [1398, 511], [1688, 462]];
  for (const [x, y] of lights) {
    stroke(c, '#3b4649', 3, [x, y + 110, x, y + 2]);
    light(c, x, y, 85, 64, '227,176,119', .24);
    ellipse(c, '#cbad83', x, y, 6, 2);
  }
  scuff(c, rnd, 0, 485, width, 595, 7200, .11);
}

function runwayPlate(c, rnd) {
  skyPlate(c, rnd, '#112332');
  shape(c, '#31424b', [0, 591, 297, 519, 434, 553, 770, 482, 1023, 563, 1419, 510, 1679, 548, 1920, 501, 1920, 657, 0, 657]);
  fill(c, lineGradient(c, '#3b4c51', '#222c34', 646), 0, 644, width, 436);
  shape(c, '#39434a', [1033, 649, 1092, 651, 1480, 1080, 389, 1080]);
  stroke(c, '#505b5e', 3, [417, 1080, 1036, 651]);
  stroke(c, '#535e60', 3, [1507, 1080, 1095, 652]);
  for (let j = 0; j < 17; j++) {
    const f = (j / 16) ** 2.35, y = 654 + 402 * f;
    const left = 1028 - 635 * f, right = 1104 + 422 * f;
    for (const x of [left, right]) {
      const size = .25 + f * .75;
      light(c, x, y + 5 * f, 8 + 31 * f, 4 + 17 * f, '72,133,196', .12 + f * .24);
      if (j > 8) {
        light(c, x + (x < 1060 ? 1 : -1) * 11 * f, y + 12 * f, 12 + f * 38, 3 + f * 5, '89,150,198', .10 + .14 * f);
        stroke(c, 'rgba(88,141,180,' + f * .35 + ')', 1.5 + f, [x - 2 * f, y + 9 * f, x + 13 * f, y + 9 * f]);
      }
      ellipse(c, 'rgba(114,179,230,' + (.42 + f * .36) + ')', x, y, 1.3 + 4.3 * size, .9 + 2.4 * size);
      if (j >= 12) ellipse(c, 'rgba(157,204,236,' + f * .56 + ')', x, y, 1.3 + 1.6 * f, 1 + 1.3 * f);
    }
    if (j > 5 && j % 2 === 0) {
      shape(c, '#555e5f', [1063 - f * 137, y, 1067 - f * 126, y, 1056 - f * 125, y + 8 + f * 12, 1051 - f * 137, y + 8 + f * 12]);
    }
  }
  for (const [x, y] of [[420, 615], [547, 626], [1317, 633], [1690, 637]]) {
    fill(c, '#465557', x - 71, y, 145, 24);
    for (let i = -55; i < 70; i += 20) ellipse(c, '#b6aa7d', x + i, y + 12, 2.2, 1.1);
  }
  scuff(c, rnd, 0, 645, width, 435, 6300, .105);
}

function transport(makeCanvas, seed, kind) {
  const rnd = randomFor(seed);
  const plate = makeCanvas(width, height), c = plate.getContext('2d');
  if (kind === 'platform') platformPlate(c, rnd);
  if (kind === 'tram') tramPlate(c, rnd);
  if (kind === 'runway') runwayPlate(c, rnd);
  finish(c, rnd);
  const clouds = addClouds(rnd, 9, 222, 560, '159,179,185');
  const snowflakes = snowSet(rnd, 82);
  const lamplitSnow = Array.from({length: 52}, () => ({
    offset: rnd(), speed: 1 + Math.floor(rnd() * 2),
    x: 159 + rnd() * 618, y: 309 + rnd() * 321,
    length: 12 + rnd() * 26, alpha: .09 + rnd() * .22,
    slant: 48 + rnd() * 102, fall: 132 + rnd() * 237,
  }));
  return (ctx, phase) => {
    const p = wrap(phase), a = tau * p;
    ctx.drawImage(plate, 0, 0);
    if (kind === 'platform') {
      snow(ctx, snowflakes, p);
      illuminatedDrops(ctx, lamplitSnow, p, true);
      const f = .50 + .50 * Math.cos(2 * a - .85);
      light(ctx, 1194, 549, 34, 25, '194,127,90', .105 + .055 * f);
      ellipse(ctx, 'rgba(201,138,93,' + (.75 + .12 * f) + ')', 1194, 549, 5.2, 5.9);
      ellipse(ctx, 'rgba(226,172,119,.62)', 1192.6, 548, 1.9, 2.3);
    }
    if (kind === 'tram') {
      const f = wrap(p + .08);
      const x = 1034 + f * 722, y = 818 - 334 * f + 29 * Math.sin(f * Math.PI);
      const w = 108 - f * 64, h = 32 - 13 * f;
      const opacity = Math.sin(Math.PI * f) ** .69;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(x, y);
      ctx.rotate(-.23 - .06 * Math.sin(f * Math.PI));
      shape(ctx, '#57433e', [-w * .52, -h, w * .43, -h + 3, w * .55, 0, -w * .44, 4]);
      stroke(ctx, '#847061', 1.5, [-w * .47, -h + 1, w * .43, -h + 2]);
      for (let i = 0; i < 5; i++) fill(ctx, '#b09c78', w * (-.40 + i * .164), -h * .75, w * .115, h * .35);
      ellipse(ctx, '#d0b887', w * .50, -h * .14, 2.4, 1.6);
      light(ctx, w * .37, h * .57, w * 1.15, h, '211,164,104', .14);
      ctx.restore();
      driftingClouds(ctx, p, clouds);
    }
    if (kind === 'runway') {
      driftingClouds(ctx, p, clouds);
      for (const i of [10, 12, 14, 15]) {
        const depth = (i / 16) ** 2.35;
        const shimmer = .5 + .5 * Math.sin(a * 2 + i * .7);
        const y = 654 + 414 * depth;
        for (const x of [1028 - 635 * depth, 1104 + 422 * depth]) {
          light(ctx, x + 9 * depth, y, 12 + 20 * depth, 3 + 3 * depth, '104,161,201', .035 + .07 * shimmer);
        }
      }
    }
  };
}

collection.push(
  { id: '80', title: '눈 쌓인 승강장의 먼 신호', slug: 'snow-on-the-empty-platform', sound: 'snow', soundLabel: '눈 쌓인 승강장을 스치는 찬 바람', createScene: maker => transport(maker, 80720, 'platform') },
  { id: '81', title: '언덕을 오르는 막차 전차', slug: 'last-tram-up-the-hill', sound: 'train', soundLabel: '멀어지는 전차의 차륜 소리', createScene: maker => transport(maker, 81948, 'tram') },
  { id: '82', title: '텅 빈 활주로의 푸른 점등', slug: 'blue-lights-on-an-empty-runway', sound: 'gust', soundLabel: '넓은 활주로를 가로지르는 바람', createScene: maker => transport(maker, 82009, 'runway') },
);

function pane(c, x, y, w, h, color) {
  fill(c, '#253138', x - 8, y - 8, w + 16, h + 16);
  fill(c, color, x, y, w, h);
  stroke(c, 'rgba(125,144,148,.32)', 2.4, [x + w, y, x + w, y + h, x, y + h]);
}

function appliance(c, x, y, w) {
  const color = lineGradient(c, '#858d86', '#657b78', y, y + w * 1.1);
  fill(c, color, x, y, w, w * 1.15);
  fill(c, '#505d5d', x + 4, y + 6, w - 8, w * .14);
  fill(c, '#69756e', x + 12, y + 11, w * .25, 4);
  ellipse(c, '#a3a58d', x + w * .79, y + w * .085, 6, 6);
  const cx = x + w * .50, cy = y + w * .61, r = w * .36;
  ellipse(c, '#505f61', cx, cy, r + 5, r + 5);
  ellipse(c, '#a3aba1', cx, cy, r + 2, r + 2);
  ellipse(c, '#435459', cx, cy, r - 2, r - 2);
  return {cx, cy, r};
}

function laundromat(c, rnd) {
  masonry(c, rnd, 0, 0, width, 794, '#344149', 165, 40);
  light(c, 980, 479, 848, 471, '146,174,170', .21);
  fill(c, '#3b494d', 183, 154, 1577, 92);
  fill(c, '#6d7f78', 193, 163, 1557, 72);
  for (let i = 0; i < 8; i++) {
    fill(c, 'rgba(164,176,156,.44)', 680 + i * 77, 181, 44 - i % 4 * 5, 8);
    if (i % 2) fill(c, 'rgba(164,176,156,.35)', 687 + i * 77, 197, 31, 4);
  }
  stroke(c, '#697c7a', 1.5, [187, 247, 1756, 247]);
  const glass = lineGradient(c, '#5a7372', '#42585c', 312, 739);
  pane(c, 234, 283, 1475, 454, glass);
  fill(c, '#85908a', 250, 348, 1445, 67);
  for (let x = 251; x < 1669; x += 78) stroke(c, 'rgba(65,78,76,.40)', 2, [x, 350, x, 413]);
  fill(c, '#7f9289', 250, 421, 1433, 208);
  for (const [x, y] of [[295, 449], [786, 455], [1245, 451]]) {
    fill(c, '#59706b', x, y, 242, 32);
    fill(c, '#89917d', x + 17, y + 3, 95, 16);
    fill(c, '#667a76', x + 127, y + 2, 90, 14);
  }
  fill(c, '#5a6d6f', 250, 631, 1434, 98);
  for (let i = 0; i < 8; i++) stroke(c, 'rgba(63,81,87,.42)', 1, [261, 635 + (i / 8) ** 1.65 * 93, 1691, 635 + (i / 8) ** 1.65 * 93]);
  const drums = [];
  for (const x of [271, 444, 681, 855, 1031, 1304, 1478]) drums.push(appliance(c, x, 498, 142));
  for (const x of [237, 604, 1205, 1707]) stroke(c, '#3b4b52', 10, [x, 285, x, 739]);
  stroke(c, '#6e827c', 6, [245, 735, 1702, 734]);
  for (const x of [383, 841, 1251]) {
    stroke(c, '#bfc1a4', 4, [x, 318, x + 232, 319]);
    light(c, x + 110, 377, 187, 97, '183,201,180', .20);
  }
  return drums;
}

function parkingBooth(c, rnd) {
  skyPlate(c, rnd, '#172733');
  skyline(c, rnd, 754, '#2b3b43', '164,155,112');
  for (const x of [205, 1521]) {
    stroke(c, '#415359', 13, [x, 750, x, 270, x + 73, 251]);
    stroke(c, '#7c8571', 3, [x + 61, 253, x + 98, 253]);
    light(c, x + 74, 271, 191, 115, '185,181,129', .17);
  }
  const x = 618, y = 354, w = 654, h = 389;
  shape(c, '#485053', [x - 61, y - 59, x + w - 13, y - 82, x + w + 137, y + 9, x - 21, y + 25]);
  shape(c, '#5b6666', [x - 61, y - 59, x + w - 11, y - 82, x + w + 135, y - 9, x - 24, y + 12]);
  fill(c, '#3c494e', x, y, w, h);
  shape(c, '#34444c', [x + w, y + 3, x + w + 104, y + 11, x + w + 104, y + h - 29, x + w, y + h]);
  const interior = lineGradient(c, '#857b62', '#524d43', y + 37, y + 269);
  pane(c, x + 32, y + 40, w - 75, 212, interior);
  for (const xo of [84, 299, 467]) fill(c, '#655d4f', x + xo, y + 61, 83, 2);
  fill(c, '#696455', x + 62, y + 144, w - 134, 54);
  fill(c, '#9a8862', x + 139, y + 86, 70, 41);
  fill(c, '#655f4d', x + 147, y + 92, 53, 23);
  for (const xo of [226, 404]) stroke(c, '#414b4d', 9, [x + xo, y + 32, x + xo, y + 261]);
  light(c, x + 356, y + 102, 268, 137, '224,169,116', .24);
  stroke(c, '#be9b74', 4, [x + 232, y + 46, x + 385, y + 46]);
  scuff(c, rnd, x, y + 262, w, h - 262, 2100, .11);
  fill(c, '#465354', x + 347, y + h - 112, 58, 116);
  fill(c, '#8b7c67', x + 357, y + h - 98, 39, 25);
  stroke(c, '#775e57', 15, [x + 381, y + h - 109, 1798, y + h - 167]);
  for (let j = 0; j < 14; j++) stroke(c, '#a89577', 7, [x + 405 + j * 55, y + h - 111 - j * 3.8, x + 429 + j * 55, y + h - 113 - j * 3.8]);
}

function vendingLane(c, rnd) {
  masonry(c, rnd, 0, 0, width, 739, '#344044', 173, 38);
  shape(c, '#213039', [0, 0, 282, 0, 610, 741, 0, 834]);
  shape(c, '#2a353a', [1920, 0, 1610, 0, 1450, 730, 1920, 764]);
  pane(c, 481, 238, 966, 508, lineGradient(c, '#38484a', '#2e3a40', 231, 746));
  light(c, 971, 461, 543, 328, '122,157,160', .21);
  const palettes = [
    {x: 633, w: 318, body: '#53534b', face: '#7c897d', item: ['#ab9571', '#aaa994', '#848f87', '#53756e']},
    {x: 1006, w: 270, body: '#515d63', face: '#718886', item: ['#88a29b', '#9daa9a', '#749594', '#667f82']},
  ];
  for (const item of palettes) {
    const y = item.x < 1000 ? 348 : 388;
    fill(c, item.body, item.x, y, item.w, 741 - y);
    fill(c, '#2d3f46', item.x + 17, y + 15, item.w - 34, 226);
    fill(c, item.face, item.x + 26, y + 23, item.w - 52, 211);
    for (let r = 0; r < 5; r++) {
      const py = y + 34 + r * 37;
      for (let j = 0; j < 7; j++) {
        const x = item.x + 34 + j * ((item.w - 66) / 7);
        const color = item.item[Math.floor(rnd() * item.item.length)];
        fill(c, color, x + 3, py + 4 + Math.floor(rnd() * 5), 13 + rnd() * 3, 20 + rnd() * 7);
        fill(c, 'rgba(224,217,176,.36)', x + 3, py + 13, 13, 6);
      }
      stroke(c, 'rgba(56,68,67,.52)', 2, [item.x + 28, py + 34, item.x + item.w - 28, py + 34]);
    }
    fill(c, '#344348', item.x + 31, 660, item.w - 107, 39);
    fill(c, '#809085', item.x + item.w - 61, 621, 36, 42);
    for (let i = 0; i < 4; i++) ellipse(c, '#506662', item.x + item.w - 45, 628 + i * 7, 2.8, 2);
    light(c, item.x + item.w / 2, y + 121, item.w * .74, 189, item.x < 1000 ? '192,190,150' : '161,200,201', .26);
  }
}

function tumblingCloth(ctx, drum, angle) {
  const {cx, cy, r} = drum;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, 0, tau);
  ctx.clip();
  light(ctx, cx - 1, cy + 15, r * .87, r * .64, '22,33,36', .43);

  const pieces = [
    { turn: .2, dx: .52, dy: .49, w: 32, h: 14, color: ['#a3a597', '#64736f'] },
    { turn: 2.6, dx: .45, dy: .41, w: 23, h: 11, color: ['#b1b19b', '#6d8175'] },
    { turn: 4.5, dx: .48, dy: .45, w: 20, h: 10, color: ['#7d9490', '#576d6c'] },
  ];
  for (const piece of pieces) {
    const t = angle + piece.turn;
    const x = cx + r * piece.dx * Math.cos(t);
    const y = cy + r * piece.dy * Math.sin(t) + 5 * Math.sin(t * 2 + .7);
    const bend = 1 + .12 * Math.sin(t + .4);
    const w = piece.w * bend / 2;
    const h = piece.h * bend;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t + .73 + .34 * Math.sin(t - .55));
    ctx.beginPath();
    ctx.moveTo(-w, h * .28);
    ctx.bezierCurveTo(-w * .86, -h * .7, -w * .28, -h, w * .08, -h * .37);
    ctx.bezierCurveTo(w * .7, -.06 * h, w * .87, -h * .64, w, -h * .18);
    ctx.bezierCurveTo(w * 1.05, h * .43, w * .43, h * .74, -w * .05, h * .72);
    ctx.bezierCurveTo(-w * .46, h * 1.02, -w * .82, h * .83, -w, h * .28);
    ctx.closePath();
    ctx.fillStyle = lineGradient(ctx, piece.color[0], piece.color[1], -h, h);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-w * .68, h * .18);
    ctx.quadraticCurveTo(-w * .22, -h * .18, w * .55, h * .14);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(220,220,194,.24)';
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function litFront(makeCanvas, seed, kind) {
  const rnd = randomFor(seed);
  const background = makeCanvas(width, height), c = background.getContext('2d');
  fill(c, '#35404a');
  const drums = kind === 'laundromat' ? laundromat(c, rnd) : [];
  if (kind === 'parking') parkingBooth(c, rnd);
  if (kind === 'vending') vendingLane(c, rnd);
  pavement(c, rnd, 749, true, kind === 'parking' ? 949 : 987);
  wetReflection(c, makeCanvas, 749, .45);
  finish(c, rnd);
  const drops = rainSet(rnd, kind === 'vending' ? 92 : 60);
  const flakes = addClouds(rnd, 5, 891, 1059, '165,179,184');
  return (ctx, phase) => {
    const p = wrap(phase), a = p * tau;
    ctx.drawImage(background, 0, 0);
    if (kind === 'laundromat') {
      for (let i = 0; i < drums.length; i++) {
        const { cx, cy, r } = drums[i];
        if ((i + 1) % 3 === 0) {
          const rotations = i === 2 ? 4 : 3;
          tumblingCloth(ctx, drums[i], a * rotations + (i === 2 ? .13 : 1.79));
          light(ctx, cx + 14, cy - 20, 29, 23, '189,201,183', .19);
        } else {
          light(ctx, cx + 13, cy - 16, 24, 17, '165,189,183', .15);
        }
      }
      rain(ctx, drops, p);
    } else if (kind === 'parking') {
      driftingClouds(ctx, p, flakes);
      const f = wrap(p + .27);
      const x = -270 + (width + 520) * f;
      const opacity = Math.sin(Math.PI * f) ** 2;
      light(ctx, x, 797, 363, 93, '216,182,129', .14 * opacity);
      light(ctx, x - 120, 846, 257, 83, '173,188,177', .073 * opacity);
      rain(ctx, drops, p);
    } else {
      rain(ctx, drops, p);
      for (let i = 0; i < 8; i++) {
        const f = wrap(p * 5 + i * .387);
        const x = 650 + 78 * i, y = 788 + (i * 37) % 264;
        ctx.strokeStyle = 'rgba(143,188,184,' + Math.sin(Math.PI * f) * .20 + ')';
        ctx.lineWidth = .9;
        ctx.beginPath();
        ctx.ellipse(x, y, 5 + f * 39, 1 + f * 7, 0, 0, tau);
        ctx.stroke();
      }
    }
  };
}

collection.push(
  { id: '83', title: '새벽 세탁방의 돌아가는 드럼', slug: 'spinning-drums-in-a-laundromat', sound: 'laundry', soundLabel: '빗소리에 섞여 들리는 세탁기의 낮은 울림', createScene: maker => litFront(maker, 83018, 'laundromat') },
  { id: '84', title: '빈 주차장에 불 켜진 경비실', slug: 'guard-booth-at-the-empty-lot', sound: 'rain-street', soundLabel: '빗물에 젖은 주차장의 빗소리', createScene: maker => litFront(maker, 84926, 'parking') },
  { id: '85', title: '골목 끝 자판기의 불빛', slug: 'vending-machines-at-the-lane-end', sound: 'rain-street', soundLabel: '푹 젖은 골목에 떨어지는 빗소리', createScene: maker => litFront(maker, 85589, 'vending') },
);
