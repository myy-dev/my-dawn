'use strict';

const WIDTH = 1920;
const HEIGHT = 1080;
const TAU = Math.PI * 2;

function random(seed) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shape(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function wash(ctx, x, y, radius, stops, verticalScale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, verticalScale);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  for (const [offset, color] of stops) glow.addColorStop(offset, color);
  ctx.fillStyle = glow;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx.restore();
}

function pine(ctx, x, y, height, width, tone, frost, rng) {
  const tip = x + (rng() - 0.5) * width * 0.32;
  const trunk = y - height;
  shape(ctx, [[x - width * 0.035, y], [tip, trunk], [x + width * 0.03, y]], tone);
  const tiers = Math.round(6 + height / 37);
  for (let tier = 0; tier < tiers; tier++) {
    const level = (tier + 0.6) / (tiers + 0.15);
    const span = width * (0.17 + level * 0.83) * (0.84 + rng() * 0.32);
    const rootX = tip + (x - tip) * level;
    const rootY = trunk + height * level * 0.89;
    for (const direction of [-1, 1]) {
      const length = span * (0.8 + rng() * 0.32);
      const drop = height * (0.055 + rng() * 0.04);
      const points = [[rootX, rootY - height * 0.06]];
      for (let i = 1; i <= 9; i++) {
        const u = i / 9;
        points.push([
          rootX + direction * u * length,
          rootY + Math.sin(u * 2.4) * drop + rng() * height * 0.017 - height * 0.022
        ]);
      }
      for (let i = 8; i >= 0; i--) {
        const u = i / 9;
        points.push([
          rootX + direction * u * length,
          rootY + drop * (0.9 + Math.sin(u * 3) * 0.68) + rng() * height * 0.044
        ]);
      }
      shape(ctx, points, tone);
      for (let needle = 0; needle < 6; needle++) {
        const u = rng() * 0.84 + 0.08;
        const needleX = rootX + direction * u * length;
        const needleY = rootY + Math.sin(u * 2.4) * drop - height * 0.023;
        ctx.strokeStyle = frost;
        ctx.lineWidth = 0.45 + height * 0.007 * (0.3 + rng() ** 2);
        ctx.globalAlpha = 0.45 + rng() * 0.55;
        ctx.beginPath();
        ctx.moveTo(needleX, needleY);
        ctx.quadraticCurveTo(needleX + direction * length * 0.07, needleY + height * 0.022,
          needleX + direction * length * (0.07 + rng() * 0.08), needleY + height * 0.023);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (height > 220 && (tier + (direction > 0 ? 1 : 0)) % 3 !== 0) {
        const u = 0.18 + rng() * 0.59;
        const x = rootX + direction * u * length;
        const y = rootY + Math.sin(u * 2.4) * drop - height * 0.025;
        const spill = height * 0.012;
        shape(ctx, [[x - spill * 0.5, y + 1], [x, y - 0.5 - rng() * 2],
          [x + direction * spill * (1.2 + rng()), y + spill * 0.3],
          [x + direction * spill * 0.91, y + spill * 0.55],
          [x - direction * spill * 0.18, y + spill * 0.31]], '#afc0dc2e');
      }
    }
  }
}

function drawSky(ctx, rng) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 750);
  gradient.addColorStop(0, '#141c2e');
  gradient.addColorStop(0.48, '#27384d');
  gradient.addColorStop(1, '#47576f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  wash(ctx, 1000, 410, 980,
    [[0, '#8292aa42'], [0.47, '#667e9e22'], [1, '#667e9e00']], 0.50);
  for (let n = 0; n < 15; n++) {
    const cloudX = -300 + rng() * 2500;
    const cloudY = 105 + rng() * 380;
    wash(ctx, cloudX, cloudY, 260 + rng() * 620,
      [[0, '#97a3ba16'], [0.5, '#78869b0b'], [1, '#78869b00']], 0.09 + rng() * 0.09);
  }
  for (let n = 0; n < 145; n++) {
    const x = rng() * WIDTH;
    const y = rng() * 405;
    const alpha = 0.06 + rng() ** 3 * 0.29;
    ctx.fillStyle = `rgba(223,231,247,${alpha})`;
    ctx.fillRect(x, y, 0.5 + rng() * 1.5, 0.5 + rng());
  }
}

function drawGround(ctx, rng) {
  const ridge = [[0, 665]];
  for (let x = 0; x <= WIDTH; x += 10) {
    const y = 564 + 28 * Math.sin(x * 0.004 + 1.6) + 11 * Math.sin(x * 0.012 + 1.1) + rng() * 5;
    ridge.push([x, y]);
  }
  ridge.push([WIDTH, 785], [0, 785]);
  shape(ctx, ridge, '#36435c');
  for (let i = 0; i < 164; i++) {
    const x = i * 12.5 + rng() * 26 - 40;
    const y = 649 + 28 * Math.sin(x * 0.004 + 1.6) + 11 * Math.sin(x * 0.012 + 1.1);
    const height = 36 + rng() ** 1.9 * 103;
    pine(ctx, x, y, height, 8 + height * 0.16, '#29394f', '#a5b4d016', rng);
  }
  for (let i = 0; i < 61; i++) {
    const x = i * 33 + rng() * 42 - 45;
    const y = 731 + Math.sin(x * 0.0035) * 29 + rng() * 28;
    const height = 60 + rng() ** 1.6 * 164;
    pine(ctx, x, y, height, 11 + height * 0.2, '#26364c', '#8396b324', rng);
  }
  const gradient = ctx.createLinearGradient(0, 645, 0, HEIGHT);
  gradient.addColorStop(0, '#60738b');
  gradient.addColorStop(0.39, '#52637e');
  gradient.addColorStop(1, '#29374d');
  ctx.beginPath();
  ctx.moveTo(0, 669);
  ctx.bezierCurveTo(295, 681, 553, 754, 832, 711);
  ctx.bezierCurveTo(1131, 667, 1401, 718, 1621, 664);
  ctx.quadraticCurveTo(1792, 630, WIDTH, 663);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  const bands = [
    [[-20, 776], [370, 719, 663, 797, 952, 766], [1180, 731, 1550, 781, 1950, 735]],
    [[-30, 933], [380, 823, 668, 922, 986, 864], [1410, 790, 1550, 867, 1940, 827]],
    [[-30, 1020], [340, 869, 774, 1030, 1040, 923], [1430, 877, 1615, 910, 1950, 886]]
  ];
  for (const [start, left, right] of bands) {
    ctx.beginPath();
    ctx.moveTo(...start);
    ctx.bezierCurveTo(...left);
    ctx.bezierCurveTo(...right);
    ctx.lineTo(WIDTH, HEIGHT);
    ctx.lineTo(0, HEIGHT);
    ctx.closePath();
    const layer = ctx.createLinearGradient(0, start[1], 0, HEIGHT);
    layer.addColorStop(0, '#acbfd82b');
    layer.addColorStop(0.35, '#8da5c11c');
    layer.addColorStop(1, '#3c516d00');
    ctx.fillStyle = layer;
    ctx.fill();
  }
  // A shallow track with wind-drifted edges and traces of older footprints.
  const trackPoint = (t) => {
    const x = 1234 * (1 - t) ** 3 + 572 * (1 - t) ** 2 * t * 3
      + 956 * (1 - t) * t ** 2 * 3 + 1066 * t ** 3;
    const y = 785 * (1 - t) ** 3 + 852 * (1 - t) ** 2 * t * 3
      + 962 * (1 - t) * t ** 2 * 3 + 1112 * t ** 3;
    return [x, y];
  };
  for (let band = 0; band < 7; band++) {
    const nearEdge = [];
    const farEdge = [];
    for (let step = 0; step <= 95; step++) {
      const t = step / 95;
      const [x, y] = trackPoint(t);
      const width = (5 + t * 28 + Math.sin(t * 54) * (2 + t * 2)
        + Math.sin(t * 19 + 1.6) * 4) * (1.35 - band * 0.098);
      nearEdge.push([x - width * 0.91, y - width * 0.26]);
      farEdge.push([x + width * (1 + Math.sin(t * 39) * 0.19), y + width * 0.29]);
    }
    shape(ctx, [...nearEdge, ...farEdge.reverse()], '#1b2b450a');
  }
  for (let print = 0; print < 25; print++) {
    const t = (print + 1) / 27;
    const size = 2 + t * 9;
    const [x, y] = trackPoint(t);
    const foot = print % 2 ? 1 : -1;
    const offset = foot * (2 + t * 7) + (rng() - 0.5) * 9;
    const direction = Math.atan2(trackPoint(t + .01)[1] - y, trackPoint(t + .01)[0] - x);
    ctx.save();
    ctx.translate(x + offset, y + rng() * 4);
    ctx.rotate(direction + foot * 0.16);
    ctx.scale(1, 0.56);
    wash(ctx, 0, 0, size, [[0, '#1a294758'], [0.46, '#202d4934'], [1, '#202d4900']]);
    ctx.restore();
  }

  for (let i = 0; i < 4700; i++) {
    const x = rng() * WIDTH;
    const y = 700 + rng() * 380;
    const stretch = 0.5 + rng() ** 3 * (y - 580) * 0.047;
    const alpha = 0.024 + rng() ** 2 * 0.10;
    ctx.fillStyle = i % 3 ? `rgba(202,215,239,${alpha})` : `rgba(16,29,50,${alpha})`;
    ctx.fillRect(x, y, stretch, 0.44 + rng() ** 2);
  }
  wash(ctx, 1197, 796, 410,
    [[0, '#080c1755'], [0.48, '#10182a36'], [1, '#10182a00']], 0.19);
  wash(ctx, 1241, 797, 246,
    [[0, '#e8b67a50'], [0.38, '#d3a16a29'], [1, '#c18a5000']], 0.23);
  wash(ctx, 1120, 781, 135,
    [[0, '#efb56b2f'], [1, '#efb56b00']], 0.20);
}

function drawCabin(ctx, rng) {
  const leftWall = [[1061, 652], [1161, 570], [1298, 660], [1298, 780], [1061, 753]];
  const rightWall = [[1298, 660], [1431, 618], [1431, 739], [1298, 780]];
  const foundation = [[1052, 747], [1298, 771], [1438, 735], [1438, 751], [1298, 793], [1052, 763]];
  shape(ctx, foundation, '#374050');
  shape(ctx, leftWall, '#413b43');
  shape(ctx, rightWall, '#2b3240');

  ctx.save();
  for (const [points, dark, light] of [
    [leftWall, '#26293299', '#9e7b674f'],
    [rightWall, '#191f2eaf', '#8e81924a']
  ]) {
    ctx.save();
    shape(ctx, points, 'transparent');
    ctx.clip();
    for (let i = -1; i < 20; i++) {
      const y = 591 + i * 10;
      ctx.strokeStyle = dark;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(1047, y); ctx.lineTo(1298, y + 32); ctx.lineTo(1453, y - 12);
      ctx.stroke();
      ctx.strokeStyle = light;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(1047, y + 2.4); ctx.lineTo(1298, y + 34.4); ctx.lineTo(1453, y - 9.6);
      ctx.stroke();
    }
    for (let i = 0; i < 550; i++) {
      const x = 1050 + rng() * 400;
      const y = 590 + rng() * 190;
      ctx.fillStyle = i % 2 ? '#ceada12b' : '#131a2b48';
      ctx.fillRect(x, y, 1 + rng() * 5, 0.75);
    }
    ctx.restore();
  }
  ctx.restore();

  shape(ctx, [[1058, 650], [1069, 650], [1069, 755], [1058, 753]], '#272934');
  shape(ctx, [[1292, 657], [1304, 654], [1304, 777], [1292, 779]], '#292e38');
  shape(ctx, [[1426, 620], [1436, 615], [1436, 742], [1426, 745]], '#202333');

  shape(ctx, [[1199, 727], [1270, 735], [1270, 784], [1199, 776]], '#182034');
  shape(ctx, [[1205, 672], [1267, 680], [1267, 763], [1205, 756]], '#252b35');
  shape(ctx, [[1212, 681], [1260, 687], [1260, 758], [1212, 752]], '#664735');
  shape(ctx, [[1218, 688], [1254, 693], [1254, 752], [1218, 748]], '#483239');
  shape(ctx, [[1215, 701], [1256, 707], [1256, 711], [1215, 705]], '#9065464c');
  shape(ctx, [[1191, 779], [1267, 788], [1277, 796], [1196, 787]], '#a6adbb4f');
  shape(ctx, [[1186, 786], [1276, 797], [1285, 805], [1193, 794]], '#a9b4c447');
  wash(ctx, 1222, 674, 59, [[0, '#ffc07845'], [1, '#ffc07800']], 0.85);
  wash(ctx, 1213, 671, 18, [[0, '#ff9d4366'], [1, '#ff9d4300']]);
  ctx.fillStyle = '#232632';
  ctx.fillRect(1205, 659, 15, 18);
  ctx.fillStyle = '#e2a25e';
  ctx.fillRect(1208, 663, 9, 11);
  ctx.fillStyle = '#ffdcad';
  ctx.fillRect(1210, 665, 4, 7);

  const windows = [
    {x: 1098, y: 663, w: 80, h: 60, skew: 9},
    {x: 1330, y: 675, w: 64, h: 53, skew: -19}
  ];
  for (const window of windows) {
    const {x, y, w, h, skew} = window;
    ctx.save();
    ctx.translate(x, y);
    ctx.transform(1, skew / w, 0, 1, 0, 0);
    wash(ctx, w * 0.5, h * 0.5, 92, [[0, '#f2ad7446'], [1, '#f2ad7400']], 0.75);
    ctx.fillStyle = '#252635';
    ctx.fillRect(-10, -8, w + 20, h + 20);
    ctx.fillStyle = '#8c6652';
    ctx.fillRect(-5, -5, w + 10, h + 10);
    const glass = ctx.createLinearGradient(0, 0, w * 0.44, h);
    glass.addColorStop(0, '#a66544');
    glass.addColorStop(0.48, '#f0b86f');
    glass.addColorStop(0.79, '#f6ce91');
    glass.addColorStop(1, '#b77948');
    ctx.fillStyle = glass;
    ctx.fillRect(0, 0, w, h);
    shape(ctx, [[3, 0], [w * 0.27, 0], [w * 0.21, h * 0.58], [w * 0.29, h], [3, h]], '#8053509b');
    shape(ctx, [[w * 0.82, 0], [w - 2, 0], [w - 2, h], [w * 0.76, h], [w * 0.85, h * 0.63]], '#9159449c');
    ctx.fillStyle = '#553a39';
    ctx.fillRect(w * 0.5 - 2, 0, 4, h);
    ctx.fillRect(0, h * 0.51, w, 3);
    ctx.fillStyle = '#f5b27d7e';
    ctx.fillRect(w * 0.5 + 2, 0, 1, h);
    ctx.fillStyle = '#d0b7ac';
    ctx.fillRect(-9, h + 5, w + 18, 2.5);
    ctx.restore();
  }

  shape(ctx, [[1119, 562], [1270, 518], [1438, 606], [1297, 653]], '#3d4455');
  shape(ctx, [[1040, 666], [1157, 553], [1308, 647], [1298, 666], [1159, 579], [1044, 673]], '#202633');
  shape(ctx, [[1157, 553], [1285, 516], [1447, 615], [1308, 648]], '#76859b');
  shape(ctx, [[1038, 661], [1155, 548], [1285, 511], [1173, 588], [1066, 661]], '#a0a8bb');
  shape(ctx, [[1154, 552], [1286, 511], [1439, 603], [1449, 614], [1397, 623], [1341, 641],
    [1307, 655], [1280, 640], [1230, 615], [1196, 592]], '#9daabe');
  shape(ctx, [[1154, 552], [1286, 511], [1439, 603], [1408, 603], [1340, 616], [1302, 630], [1250, 608]], '#aebbd0');
  shape(ctx, [[1040, 660], [1155, 548], [1192, 540], [1100, 635], [1054, 663]], '#b5c0d1');
  ctx.strokeStyle = '#c8d2e142';
  ctx.lineWidth = 2;
  for (let i = 0; i < 78; i++) {
    const u = rng();
    const v = rng() * 0.82;
    const x = 1159 + 132 * u + 148 * v;
    const y = 551 - 40 * u + 91 * v;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2 + rng() * 6, y + 1.1);
    ctx.stroke();
  }
  shape(ctx, [[1278, 541], [1306, 533], [1337, 550], [1308, 559]], '#6c7b92');
  shape(ctx, [[1281, 492], [1309, 497], [1309, 552], [1281, 536]], '#534c54');
  shape(ctx, [[1309, 497], [1321, 491], [1321, 546], [1309, 552]], '#313843');
  shape(ctx, [[1279, 487], [1292, 482], [1325, 491], [1310, 500], [1279, 495]], '#808a9e');
  shape(ctx, [[1284, 486], [1294, 482], [1321, 490], [1309, 495]], '#1b2332');
}

function drawForeground(ctx, rng) {
  const trees = [
    [-31, 1072, 676, 142], [102, 982, 544, 110], [238, 852, 228, 45],
    [1674, 892, 258, 51], [1803, 994, 484, 91], [1923, 1092, 652, 137]
  ];
  for (const [x, y, height, width] of trees) {
    wash(ctx, x, y + 3, width * 2.2,
      [[0, '#12203370'], [0.45, '#12203343'], [1, '#12203300']], 0.17);
    pine(ctx, x, y, height, width, '#192637', '#9aafd245', rng);
  }
  for (let i = 0; i < 32; i++) {
    const side = i % 2;
    const x = (side ? 1645 : 0) + rng() * 275;
    const y = 807 + rng() * 243;
    ctx.strokeStyle = '#17263980';
    ctx.lineWidth = 1.2;
    for (let j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + (rng() - 0.5) * 27, y - rng() * 12,
        x + (rng() - 0.5) * 26, y - 6 - rng() * 17);
      ctx.stroke();
    }
  }
  const vignette = ctx.createRadialGradient(1010, 624, 291, 969, 558, 1130);
  vignette.addColorStop(0, '#090e1a00');
  vignette.addColorStop(0.74, '#080d1713');
  vignette.addColorStop(1, '#070a165e');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function createScene(createCanvas) {
  const plate = createCanvas(WIDTH, HEIGHT);
  const painted = plate.getContext('2d');
  const rng = random(50231);
  drawSky(painted, rng);
  drawGround(painted, rng);
  drawCabin(painted, rng);
  drawForeground(painted, rng);

  const smoke = createCanvas(160, 96);
  wash(smoke.getContext('2d'), 80, 48, 80,
    [[0, '#a5acbcaa'], [0.3, '#9ca8be68'], [0.65, '#b7bdd62b'], [1, '#c2cee300']], 0.60);

  const snowBokeh = createCanvas(48, 58);
  wash(snowBokeh.getContext('2d'), 24, 29, 22,
    [[0, '#eaf3ffcb'], [0.24, '#e1edff9c'], [0.47, '#e0ecff50'], [0.72, '#d5e1f715'], [1, '#d5e1f700']], 1.25);
  const closeFlakes = [
    {x: 125, y: 95, across: 128, down: 700, offset: 0.07, width: 8.4, height: 10.9, opacity: 0.31},
    {x: 318, y: 42, across: 105, down: 780, offset: 0.21, width: 6.1, height: 5.8, opacity: 0.46},
    {x: 526, y: -42, across: 86, down: 765, offset: 0.46, width: 9.6, height: 11.9, opacity: 0.37},
    {x: 744, y: -76, across: 96, down: 603, offset: 0.62, width: 5.9, height: 8.2, opacity: 0.29},
    {x: 891, y: -75, across: 69, down: 635, offset: 0.82, width: 6.8, height: 5.5, opacity: 0.40},
    {x: 1494, y: -22, across: 112, down: 855, offset: 0.93, width: 9.9, height: 10.4, opacity: 0.28},
    {x: 1666, y: 34, across: 88, down: 777, offset: 0.31, width: 7.8, height: 10.0, opacity: 0.42},
    {x: 1783, y: 88, across: 73, down: 876, offset: 0.72, width: 6.2, height: 7.1, opacity: 0.34}
  ];

  const flakes = Array.from({length: 480}, (_, i) => {
    const depth = i < 332 ? 0 : (i < 451 ? 1 : 2);
    return {
      x: rng() * (WIDTH + 60) - 30, y: rng(), roll: rng() * TAU,
      radius: [0.55, 0.95, 1.6][depth] + rng() ** 2 * [0.75, 1, 2.1][depth],
      alpha: [0.15, 0.26, 0.45][depth] * (0.33 + 0.67 * rng()),
      travel: [0.21, 0.39, 0.61][depth] + rng() * 0.12,
      sway: [7, 16, 27][depth] * (0.4 + rng()),
      depth
    };
  });

  // Each flake fades at its reset and traverses only part of the frame per cycle.
  return (ctx, phase) => {
    const t = phase - Math.floor(phase);
    const angle = t * TAU;
    ctx.drawImage(plate, 0, 0);
    for (let index = 0; index < 8; index++) {
      const age = (t + index / 8) % 1;
      const envelope = Math.sin(Math.PI * age) ** 1.5;
      const spread = 11 + age * 56;
      const drift = Math.sin(angle + age * 5) * 10 * age;
      ctx.globalAlpha = envelope * (0.19 - age * 0.09);
      ctx.drawImage(smoke, 1298 + age ** 1.25 * 105 + drift - spread,
        484 - age * 142 - spread * 0.63, spread * 2, spread * 1.24);
    }
    ctx.globalAlpha = 1;

    wash(ctx, 1142, 694, 67, [[0, `rgba(251,177,90,${0.039 + 0.008 * Math.sin(angle * 2)})`],
      [0.56, '#fcad6510'], [1, '#fcad6500']], 0.74);

    for (const flake of flakes) {
      const age = (t + flake.y) % 1;
      const envelope = Math.sin(Math.PI * age) ** 1.4;
      const y = ((flake.y * 1717 + age * flake.travel) % 1) * (HEIGHT + 40) - 20;
      const x = flake.x + Math.sin(age * TAU + flake.roll) * flake.sway + age * (16 + flake.depth * 14);
      const alpha = envelope * flake.alpha;
      ctx.fillStyle = `rgba(217,229,248,${alpha})`;
      if (flake.radius < 1.25) {
        ctx.fillRect(x, y, flake.radius * 2, flake.radius * 1.35);
      } else {
        ctx.beginPath();
        ctx.ellipse(x, y, flake.radius * 0.79, flake.radius * 1.25, -0.39, 0, TAU);
        ctx.fill();
      }
    }
    for (const flake of closeFlakes) {
      const age = (t + flake.offset) % 1;
      const focus = 0.85 + 0.2 * age;
      const width = flake.width * focus;
      const height = flake.height * focus;
      const sway = Math.sin(age * TAU * 1.5 + flake.offset * TAU);
      const x = flake.x + age * flake.across + sway * (10 + flake.width * 1.1);
      const y = flake.y + age * flake.down;
      ctx.globalAlpha = flake.opacity * Math.sin(Math.PI * age) ** 2.65;
      ctx.drawImage(snowBokeh, x - width, y - height, width * 2, height * 2);
    }
    ctx.globalAlpha = 1;
  };
}

module.exports = {
  title: '눈 덮인 숲속의 오두막',
  slug: 'snowbound-cabin',
  sound: 'snow',
  createScene
};
