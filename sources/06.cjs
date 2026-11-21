'use strict';

const WIDTH = 1920;
const HEIGHT = 1080;
const TAU = Math.PI * 2;
const WINDOW = { x: 252, y: 103, width: 1388, height: 708, radius: 72 };

function random(seed) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function wash(ctx, x, y, radius, stops, heightScale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, heightScale);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx.restore();
}

function shape(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function rounded(ctx, x, y, width, height, radius, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

function windowPath(ctx, padding = 0) {
  const {x, y, width, height, radius} = WINDOW;
  ctx.beginPath();
  ctx.roundRect(x - padding, y - padding, width + padding * 2, height + padding * 2, radius + padding);
}

function makeMountain(ctx, peaks, color, highlight, rng) {
  const points = [peaks[0]];
  for (let ridge = 1; ridge < peaks.length; ridge++) {
    const [x0, y0] = peaks[ridge - 1];
    const [x1, y1] = peaks[ridge];
    const span = Math.ceil((x1 - x0) / 10);
    for (let index = 1; index <= span; index++) {
      const u = index / span;
      const broken = Math.sin(Math.PI * u) * (Math.sin(u * 11 + ridge) * 11 + rng() * 9);
      points.push([x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + broken]);
    }
  }
  shape(ctx, [...points, [WIDTH, 579], [0, 579]], color);
  ctx.save();
  ctx.clip();
  for (let ridge = 1; ridge < peaks.length - 1; ridge++) {
    const [x, y] = peaks[ridge];
    const [nextX, nextY] = peaks[ridge + 1];
    const [previousX, previousY] = peaks[ridge - 1];
    const rightDown = nextY - y;
    const leftDown = previousY - y;
    if (rightDown > 40) {
      shape(ctx, [[x, y], [x + (nextX - x) * 0.42, y + rightDown * 0.42],
        [x + (nextX - x) * 0.33, y + rightDown * 0.66], [x + 26, y + rightDown * 0.41],
        [x + 51, y + rightDown * 0.86], [x + 12, y + rightDown * 0.47], [x + 2, y + 12]], highlight);
    }
    if (leftDown > 34) {
      shape(ctx, [[x, y], [x - 3, y + 13], [x - 22, y + 36],
        [x - 10, y + leftDown * 0.59], [x + (previousX - x) * 0.37, y + leftDown * 0.55]], '#839eaa17');
    }
  }
  ctx.restore();
}

function drawExterior(ctx, rng) {
  const sky = ctx.createLinearGradient(0, 100, 0, 604);
  sky.addColorStop(0, '#132238');
  sky.addColorStop(0.43, '#233b51');
  sky.addColorStop(0.74, '#416072');
  sky.addColorStop(1, '#739298');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, 621);
  wash(ctx, 1261, 304, 485,
    [[0, '#a4b3b84a'], [0.55, '#8aa8b32d'], [1, '#8aa8b300']], 0.51);
  wash(ctx, 905, 491, 720,
    [[0, '#68929845'], [0.52, '#75979c28'], [1, '#75979c00']], 0.13);

  for (let star = 0; star < 194; star++) {
    const x = rng() * WIDTH;
    const y = 68 + rng() * 375;
    const alpha = (0.09 + rng() ** 3 * 0.43) * (1 - (y / 580) ** 2);
    ctx.fillStyle = `rgba(206,228,239,${alpha})`;
    const size = rng() > 0.92 ? 2.2 : 0.6 + rng() * 0.8;
    ctx.fillRect(x, y, size, size);
  }
  wash(ctx, 1261, 304, 118,
    [[0, '#e2ddca50'], [0.2, '#e0dfca25'], [0.5, '#eee2c416'], [1, '#e6decd00']]);
  ctx.beginPath();
  ctx.arc(1261, 304, 18.3, 0, TAU);
  const moon = ctx.createLinearGradient(1261, 287, 1261, 322);
  moon.addColorStop(0, '#e7e6d6');
  moon.addColorStop(1, '#c9cbbb');
  ctx.fillStyle = moon;
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let dot = 0; dot < 80; dot++) {
    const x = 1242 + rng() * 39;
    const y = 285 + rng() * 39;
    ctx.fillStyle = '#64828433';
    ctx.fillRect(x, y, 0.5 + rng() * 1.5, 0.5 + rng());
  }
  ctx.restore();

  for (let i = 0; i < 17; i++) {
    const x = rng() * WIDTH;
    const y = 210 + rng() * 315;
    wash(ctx, x, y, 180 + rng() * 320,
      [[0, '#93aeb41c'], [0.47, '#91aeb412'], [1, '#93aeb400']], 0.045 + rng() * 0.055);
  }

  makeMountain(ctx, [[0, 561], [140, 455], [209, 481], [320, 402], [355, 437], [423, 421],
    [511, 374], [580, 460], [650, 438], [745, 461], [850, 408], [915, 486], [994, 459], [1117, 532],
    [1297, 558], [1383, 522], [1455, 491], [1534, 459], [1607, 498], [1729, 422], [1803, 465], [1920, 503]],
    '#40596c', '#95a5b03c', rng);
  makeMountain(ctx, [[0, 533], [147, 482], [215, 495], [335, 448], [422, 495], [525, 460],
    [622, 508], [716, 516], [833, 543], [966, 547], [1082, 569], [1306, 571], [1494, 549],
    [1602, 525], [1678, 546], [1790, 508], [1920, 544]], '#31495a', '#71929c5c', rng);
  wash(ctx, 866, 546, 980, [[0, '#8bb4b35c'], [0.48, '#8bb4b32e'], [1, '#8bb4b300']], 0.036);
  wash(ctx, 1515, 539, 485, [[0, '#8cb1b03f'], [1, '#8cb1b000']], 0.045);

  const water = ctx.createLinearGradient(0, 553, 0, 795);
  water.addColorStop(0, '#466371');
  water.addColorStop(0.18, '#3e5967');
  water.addColorStop(1, '#223745');
  ctx.fillStyle = water;
  ctx.fillRect(0, 553, WIDTH, 271);
  wash(ctx, 1263, 596, 280,
    [[0, '#c2c9b843'], [0.46, '#afc0ad21'], [1, '#afc0ad00']], 0.65);
  for (let index = 0; index < 4900; index++) {
    const x = rng() * WIDTH;
    const y = 554 + rng() * 259;
    const scale = (y - 545) * 0.09;
    const alpha = 0.02 + rng() ** 4 * (0.105 + scale * 0.002);
    ctx.fillStyle = index % 3 ? `rgba(176,206,213,${alpha})` : `rgba(9,26,42,${alpha})`;
    ctx.fillRect(x, y, 1 + rng() ** 2 * (12 + scale), 0.55 + rng() * 0.65);
  }

  for (let i = 0; i < 38; i++) {
    const spread = rng();
    const x = i < 24 ? 408 + spread * 272 : 1435 + spread * 140;
    const y = 548 + rng() * 10;
    const a = 0.19 + rng() ** 3 * 0.62;
    wash(ctx, x, y, 7, [[0, `rgba(245,191,120,${a * 0.59})`], [1, '#f5bf7800']]);
    ctx.fillStyle = `rgba(250,219,172,${a})`;
    ctx.fillRect(x, y, 1.35 + rng() * 1.6, 0.9 + rng());
    ctx.fillStyle = `rgba(215,175,131,${a * 0.37})`;
    ctx.fillRect(x, y + 5, 2 + rng() * 3, 0.6);
  }

  const reflection = [];
  for (let i = 0; i < 260; i++) {
    const y = 553 + rng() * 197;
    const halfWidth = 27 + (y - 550) * 0.48;
    const x = 1262 + (rng() + rng() - 1) * halfWidth;
    reflection.push({
      x,
      y,
      width: 3 + rng() * (11 + (y - 550) * 0.11),
      alpha: 0.046 + rng() ** 3 * 0.154,
      phase: rng() * TAU
    });
  }
  return reflection;
}

function makeShore(createCanvas, width, tier, rng) {
  const height = 167;
  const layer = createCanvas(width, height);
  const ctx = layer.getContext('2d');
  const distant = tier === 0;
  // Give each shoreline a different span and leave genuine gaps between points.
  const banks = distant
    ? [[140, 213, 21, 105], [406, 151, 18, 126], [741, 298, 26, 97]]
    : [[310, 556, 67, 151], [690, 110, 29, 147], [989, 261, 51, 133],
       [1234, 87, 22, 140], [1524, 348, 61, 155]];

  for (const [center, span, rise, baseY] of banks) {
    const left = center - span / 2;
    const right = center + span / 2;
    const offset = rng() * TAU;
    const topY = x => {
      const progress = (x - left) / span;
      const shoulder = Math.sin(Math.PI * progress) ** .87;
      const undulation = Math.sin(progress * 17 + offset) * rise * .14
        + Math.sin(progress * 31 + offset) * rise * .065;
      return baseY - shoulder * (rise + undulation);
    };

    wash(ctx, center, baseY, span * .6,
      [[0, distant ? '#10273438' : '#0b1c2b71'], [.55, '#132a3841'], [1, '#132a3800']], .13);
    const rim = [];
    for (let part = 0; part <= 36; part++) {
      const x = left + span * part / 36;
      rim.push([x, topY(x)]);
    }
    const tail = [[right, baseY], [center + span * .3, baseY + 11],
      [center - span * .2, baseY + 14], [left, baseY]];
    const earth = ctx.createLinearGradient(0, baseY - rise, 0, baseY + 15);
    earth.addColorStop(0, distant ? '#435d69' : '#48616d');
    earth.addColorStop(.43, distant ? '#354f5b' : '#324955');
    earth.addColorStop(1, distant ? '#283f4b' : '#1c3140');
    shape(ctx, [...rim, ...tail], earth);

    ctx.save();
    ctx.clip();
    for (let grain = 0; grain < span * 1.2; grain++) {
      const x = left + rng() * span;
      const y = topY(x) + rng() ** 1.7 * (baseY + 13 - topY(x));
      ctx.fillStyle = grain % 3 ? '#a7c0c220' : '#111f2a52';
      ctx.fillRect(x, y, 1 + rng() * (distant ? 6 : 10), .65 + rng());
    }
    for (let strip = 0; strip < Math.floor(span / 30); strip++) {
      const x = left + span * (.11 + rng() * .75);
      const y = topY(x) + 2 + rng() * 11;
      wash(ctx, x, y, 9 + rng() * 25,
        [[0, distant ? '#8fa8b135' : '#9db2b94f'], [.45, '#91abb928'], [1, '#91abb900']], .27);
    }
    ctx.restore();

    const groups = distant ? 3 : Math.ceil(span / 33);
    for (let group = 0; group < groups; group++) {
      const x = left + (.12 + rng() * .77) * span;
      const y = Math.min(baseY - 2, topY(x) + 4 + rng() * 18);
      for (let stalk = 0; stalk < (distant ? 4 : 7); stalk++) {
        const root = x + (rng() - .5) * 17;
        const length = 3 + rng() ** 1.6 * (distant ? 14 : 26);
        const bend = rng() * 9 + length * .25;
        ctx.beginPath();
        ctx.moveTo(root, y);
        ctx.quadraticCurveTo(root - bend * .17, y - length * .6, root - bend, y - length);
        ctx.strokeStyle = stalk % 4 ? '#101f2b95' : '#526e79a8';
        ctx.lineWidth = .7 + rng() * (distant ? .7 : 1.15);
        ctx.stroke();
      }
    }
  }
  return layer;
}

function drawWoodGrain(ctx, rng, x, y, w, h, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  for (let fleck = 0; fleck < 2600; fleck++) {
    const u = rng() * w;
    const v = rng() * h;
    ctx.fillStyle = fleck % 3 ? '#dab69812' : '#0c090d35';
    ctx.fillRect(u, v, 1 + rng() ** 3 * 108, 0.55 + rng() * 0.9);
  }
  ctx.restore();
}

function drawLamp(ctx) {
  const x = 1768;
  wash(ctx, x, 383, 322,
    [[0, '#f2a76632'], [0.37, '#e0925a19'], [1, '#e2975800']], 1.20);
  wash(ctx, x, 318, 102, [[0, '#ffd6a837'], [0.56, '#d59a5721'], [1, '#e9b37a00']], 1.34);
  rounded(ctx, x - 35, 281, 70, 141, 29, '#15171f');
  rounded(ctx, x - 29, 285, 60, 133, 24, '#71604f');
  rounded(ctx, x - 23, 294, 47, 112, 18, '#42353a');
  rounded(ctx, x - 13, 309, 27, 79, 13, '#a87045');
  const glass = ctx.createLinearGradient(x - 15, 330, x + 14, 330);
  glass.addColorStop(0, '#d79760');
  glass.addColorStop(0.46, '#f6cca5');
  glass.addColorStop(0.72, '#fed2a0');
  glass.addColorStop(1, '#c68b60');
  rounded(ctx, x - 11, 311, 22, 74, 11, glass);
  for (let rib = -8; rib <= 8; rib += 4) {
    ctx.fillStyle = '#6d4a4847';
    ctx.fillRect(x + rib, 321, 1, 54);
  }
  ctx.fillStyle = '#c29570aa';
  ctx.fillRect(x - 19, 302, 38, 2.2);
  ctx.fillRect(x - 19, 392, 38, 2.6);
}

function drawGlass(ctx, rng) {
  windowPath(ctx);
  ctx.save();
  ctx.clip();
  const reflection = ctx.createLinearGradient(248, 0, 1640, 0);
  reflection.addColorStop(0, '#0d192877');
  reflection.addColorStop(0.27, '#0e213406');
  reflection.addColorStop(0.70, '#091a2f00');
  reflection.addColorStop(1, '#1f182346');
  ctx.fillStyle = reflection;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  wash(ctx, 1500, 378, 152, [[0, '#ca92521b'], [0.52, '#b3875110'], [1, '#b3875100']], 1.1);
  wash(ctx, 1490, 369, 19, [[0, '#ecb67828'], [0.35, '#d8a57518'], [1, '#e7b57d00']], 2.6);
  wash(ctx, 1505, 379, 25, [[0, '#ffd19b1e'], [0.43, '#d4a47611'], [1, '#edb98400']], 1.92);

  for (let i = 0; i < 1800; i++) {
    const left = i % 3 === 0;
    const x = left ? 256 + rng() ** 2 * 150 : 1637 - rng() ** 2 * 133;
    const y = 699 + rng() ** 0.32 * 127;
    const a = rng() ** 2 * (0.16 + (y - 699) / 600);
    const size = 0.6 + rng() ** 2 * 2.4;
    ctx.fillStyle = `rgba(169,194,202,${a})`;
    ctx.fillRect(x, y, size, size * 0.7);
  }
  ctx.restore();
}

function drawInterior(ctx, rng) {
  const wall = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  wall.addColorStop(0, '#222a35');
  wall.addColorStop(0.45, '#292531');
  wall.addColorStop(1, '#443134');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  wash(ctx, 1650, 487, 584,
    [[0, '#df975333'], [0.56, '#b7794b15'], [1, '#bf7b5000']], 1.39);
  wash(ctx, 690, 74, 762,
    [[0, '#65758726'], [0.66, '#6c798c10'], [1, '#65758700']], 0.25);

  for (let i = 0; i < 5300; i++) {
    const x = rng() * WIDTH;
    const y = rng() * HEIGHT;
    ctx.fillStyle = i % 2 ? '#f1e4df0e' : '#0707101c';
    ctx.fillRect(x, y, 0.65 + rng() * 1.65, 0.65 + rng() * 1.35);
  }

  const trim = ctx.createLinearGradient(270, 80, 1650, 834);
  trim.addColorStop(0, '#566577');
  trim.addColorStop(0.26, '#242938');
  trim.addColorStop(0.51, '#302a37');
  trim.addColorStop(0.79, '#634e4c');
  trim.addColorStop(1, '#201d2b');
  windowPath(ctx, 36);
  ctx.fillStyle = '#151823';
  ctx.fill();
  windowPath(ctx, 28);
  ctx.fillStyle = trim;
  ctx.fill();
  windowPath(ctx, 24);
  ctx.strokeStyle = '#d8b59c3f';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  windowPath(ctx, 11);
  ctx.fillStyle = '#161a25';
  ctx.fill();
  windowPath(ctx, 4);
  ctx.strokeStyle = '#8999a251';
  ctx.lineWidth = 3.8;
  ctx.stroke();
  for (const [x, y] of [[341, 82], [633, 82], [947, 82], [1261, 82], [1554, 82],
    [1661, 219], [1661, 466], [1661, 708], [1557, 832], [1261, 832], [947, 832], [633, 832], [339, 832]]) {
    wash(ctx, x + 1, y + 1, 6, [[0, '#18151cd7'], [0.43, '#221e2a77'], [1, '#211e2600']]);
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, TAU);
    ctx.fillStyle = '#aba1957a';
    ctx.fill();
    ctx.fillStyle = '#2b2630b2';
    ctx.fillRect(x - 1.2, y, 2.5, 0.6);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  windowPath(ctx);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
  drawGlass(ctx, rng);

  const upper = ctx.createLinearGradient(0, 0, 0, 57);
  upper.addColorStop(0, '#161b25');
  upper.addColorStop(0.85, '#232a36');
  upper.addColorStop(1, '#454954');
  ctx.fillStyle = upper;
  ctx.fillRect(0, 0, WIDTH, 55);
  ctx.fillStyle = '#b8a39b20';
  ctx.fillRect(0, 54, WIDTH, 2);
  ctx.fillStyle = '#120e1867';
  ctx.fillRect(0, 894, WIDTH, 7);

  const curtain = ctx.createLinearGradient(0, 0, 257, 0);
  curtain.addColorStop(0, '#212333');
  curtain.addColorStop(0.26, '#3c3441');
  curtain.addColorStop(0.49, '#262635');
  curtain.addColorStop(0.73, '#453747');
  curtain.addColorStop(1, '#202333');
  ctx.beginPath();
  ctx.moveTo(0, 32);
  ctx.lineTo(235, 32);
  ctx.bezierCurveTo(243, 242, 188, 426, 210, 577);
  ctx.bezierCurveTo(216, 673, 233, 786, 217, 866);
  ctx.lineTo(0, 868);
  ctx.closePath();
  ctx.fillStyle = curtain;
  ctx.fill();
  for (let fold = 0; fold < 6; fold++) {
    const x = 17 + fold * 38;
    ctx.beginPath();
    ctx.moveTo(x, 41);
    ctx.bezierCurveTo(x + 21, 213, x - 41, 466, x - 10, 587);
    ctx.bezierCurveTo(x + 6, 657, x + 20, 810, x - 2, 866);
    ctx.lineWidth = 2.5 + fold * 0.33;
    ctx.strokeStyle = fold % 2 ? '#121a2974' : '#96778539';
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(1, 604);
  ctx.quadraticCurveTo(119, 606, 208, 531);
  ctx.strokeStyle = '#78604c88';
  ctx.lineWidth = 11;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1, 602);
  ctx.quadraticCurveTo(119, 604, 207, 529);
  ctx.strokeStyle = '#b4976e66';
  ctx.lineWidth = 2.6;
  ctx.stroke();

  drawLamp(ctx);

  const shelf = ctx.createLinearGradient(0, 817, 0, 873);
  shelf.addColorStop(0, '#2b2530');
  shelf.addColorStop(0.18, '#71625b');
  shelf.addColorStop(0.60, '#4a3a3c');
  shelf.addColorStop(1, '#211d29');
  shape(ctx, [[259, 820], [1615, 818], [1648, 853], [240, 852]], shelf);
  shape(ctx, [[241, 852], [1648, 853], [1647, 862], [242, 861]], '#26212b');
  ctx.fillStyle = '#c0a3943f';
  ctx.fillRect(265, 842, 1343, 1.7);

  const seat = ctx.createLinearGradient(0, 691, 534, HEIGHT);
  seat.addColorStop(0, '#3e3c51');
  seat.addColorStop(0.4, '#302e3f');
  seat.addColorStop(1, '#181d2c');
  ctx.beginPath();
  ctx.moveTo(0, 691);
  ctx.bezierCurveTo(89, 663, 190, 665, 282, 701);
  ctx.bezierCurveTo(337, 716, 363, 803, 413, 856);
  ctx.bezierCurveTo(463, 892, 529, 939, 540, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.closePath();
  ctx.fillStyle = seat;
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let dot = 0; dot < 9800; dot++) {
    const x = rng() * 550;
    const y = 668 + rng() * 412;
    ctx.fillStyle = dot % 2 ? '#b2adcb12' : '#16132327';
    ctx.fillRect(x, y, 1.5 + rng() * 12, 0.65 + rng() * 1.3);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(0, 704);
  ctx.bezierCurveTo(89, 679, 190, 678, 276, 712);
  ctx.bezierCurveTo(331, 731, 351, 809, 406, 871);
  ctx.bezierCurveTo(465, 912, 513, 960, 523, HEIGHT);
  ctx.strokeStyle = '#9a8aa066';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 720);
  ctx.bezierCurveTo(113, 693, 241, 692, 299, 757);
  ctx.bezierCurveTo(342, 817, 388, 890, 447, 931);
  ctx.strokeStyle = '#171827c7';
  ctx.lineWidth = 3;
  ctx.setLineDash([3, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  const table = ctx.createLinearGradient(1333, 925, 1711, 1120);
  table.addColorStop(0, '#574347');
  table.addColorStop(0.45, '#76534a');
  table.addColorStop(0.86, '#43333c');
  table.addColorStop(1, '#2b2936');
  ctx.beginPath();
  ctx.moveTo(1186, 1045);
  ctx.bezierCurveTo(1205, 1005, 1240, 973, 1308, 953);
  ctx.quadraticCurveTo(1487, 894, 1920, 905);
  ctx.lineTo(1920, HEIGHT);
  ctx.lineTo(1208, HEIGHT);
  ctx.closePath();
  ctx.fillStyle = table;
  ctx.fill();
  ctx.save();
  ctx.clip();
  drawWoodGrain(ctx, rng, 1123, 950, 920, 251, -0.111);
  wash(ctx, 1682, 955, 345, [[0, '#d38e5a31'], [1, '#d38e5a00']], 0.22);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(1186, 1045);
  ctx.bezierCurveTo(1205, 1005, 1240, 973, 1308, 953);
  ctx.quadraticCurveTo(1487, 894, 1920, 905);
  ctx.strokeStyle = '#a47c6c86';
  ctx.lineWidth = 3.6;
  ctx.stroke();

  wash(ctx, 1563, 985, 116, [[0, '#130f1b85'], [1, '#130f1b00']], 0.18);
  ctx.beginPath();
  ctx.ellipse(1552, 977, 69, 17, -0.045, 0, TAU);
  ctx.fillStyle = '#292532';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(1550, 972, 67, 15, -0.045, 0, TAU);
  ctx.fillStyle = '#7f7778';
  ctx.fill();
  ctx.strokeStyle = '#b1a8a1a6';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1586, 916);
  ctx.bezierCurveTo(1624, 893, 1635, 944, 1593, 954);
  ctx.strokeStyle = '#666472';
  ctx.lineWidth = 11;
  ctx.stroke();
  ctx.strokeStyle = '#aea19795';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1507, 906);
  ctx.bezierCurveTo(1509, 946, 1512, 962, 1533, 968);
  ctx.quadraticCurveTo(1557, 973, 1580, 966);
  ctx.bezierCurveTo(1598, 960, 1599, 935, 1601, 903);
  ctx.closePath();
  const ceramic = ctx.createLinearGradient(1507, 906, 1600, 944);
  ceramic.addColorStop(0, '#666674');
  ceramic.addColorStop(0.38, '#a3a2a8');
  ceramic.addColorStop(0.72, '#ada4a0');
  ceramic.addColorStop(1, '#766a72');
  ctx.fillStyle = ceramic;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(1554, 904, 47, 16, -0.02, 0, TAU);
  ctx.fillStyle = '#c2af9c';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(1554, 907, 41, 11.7, -0.02, 0, TAU);
  ctx.fillStyle = '#463235';
  ctx.fill();
  wash(ctx, 1576, 908, 24, [[0, '#dcad743e'], [1, '#dcad7400']], 0.22);
}

function createScene(createCanvas) {
  const rng = random(18651);
  const exterior = createCanvas(WIDTH, HEIGHT);
  const reflection = drawExterior(exterior.getContext('2d'), rng);
  const interior = createCanvas(WIDTH, HEIGHT);
  drawInterior(interior.getContext('2d'), rng);
  const middleBank = makeShore(createCanvas, 960, 0, rng);
  const nearBank = makeShore(createCanvas, 1760, 1, rng);

  const steam = createCanvas(120, 106);
  wash(steam.getContext('2d'), 60, 54, 58,
    [[0, '#d2bbaa88'], [0.41, '#ccb69e46'], [1, '#d7c5ac00']], 0.79);

  return (ctx, phase) => {
    const t = phase - Math.floor(phase);
    const angle = t * TAU;
    ctx.fillStyle = '#191e28';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.save();
    windowPath(ctx);
    ctx.clip();
    ctx.drawImage(exterior, 0, 0);
    for (const glint of reflection) {
      const sway = Math.sin(glint.phase + angle) * (1 + (glint.y - 545) * 0.032);
      const alpha = glint.alpha * (0.68 + 0.25 * Math.sin(glint.phase + angle * 2));
      ctx.fillStyle = `rgba(215,212,186,${alpha})`;
      ctx.fillRect(glint.x + sway, glint.y, glint.width, 0.75 + (glint.y - 548) * 0.004);
    }
    for (const [bank, y] of [[middleBank, 640], [nearBank, 680]]) {
      for (let x = -t * bank.width; x < WIDTH; x += bank.width) {
        ctx.drawImage(bank, x, y);
      }
    }
    ctx.restore();
    ctx.drawImage(interior, 0, 0);

    for (let i = 0; i < 11; i++) {
      const age = (t * 3 + i / 11) % 1;
      const width = 11 + age * 35;
      ctx.globalAlpha = Math.sin(Math.PI * age) ** 1.8 * (0.13 - age * 0.048);
      const x = 1551 + age * 14 + Math.sin(age * 8 + angle * 3) * 11 * age;
      const y = 901 - age * 123;
      ctx.drawImage(steam, x - width, y - width * 0.82, width * 2, width * 1.64);
    }
    ctx.globalAlpha = 1;
  };
}

module.exports = {
  title: '달빛 해안을 지나는 야간열차',
  slug: 'moonlit-coastal-train',
  sound: 'train',
  createScene
};
