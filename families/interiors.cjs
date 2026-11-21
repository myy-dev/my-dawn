'use strict';

const W = 1920;
const H = 1080;
const TAU = 2 * Math.PI;
const editions = [];

function register(id, title, slug, sound, soundLabel, createScene) {
  editions.push({ id, title, slug, sound, soundLabel, createScene });
}

function seedRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function ramp(ctx, x, y, endX, endY, stops) {
  const g = ctx.createLinearGradient(x, y, endX, endY);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  return g;
}

function haze(ctx, x, y, width, height, color, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(width, height);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, 'rgba(' + color + ',' + opacity + ')');
  g.addColorStop(.35, 'rgba(' + color + ',' + opacity * .45 + ')');
  g.addColorStop(1, 'rgba(' + color + ',0)');
  ctx.fillStyle = g;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function fill(ctx, x, y, width, height, paint) {
  ctx.fillStyle = paint;
  ctx.fillRect(x, y, width, height);
}

function oval(ctx, x, y, width, height, paint, rotate = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, width, height, rotate, 0, TAU);
  ctx.fillStyle = paint;
  ctx.fill();
}

function strokeOval(ctx, x, y, width, height, paint, weight = 1, from = 0, to = TAU) {
  ctx.beginPath();
  ctx.ellipse(x, y, width, height, 0, from, to);
  ctx.strokeStyle = paint;
  ctx.lineWidth = weight;
  ctx.stroke();
}

function line(ctx, x, y, toX, toY, paint, weight = 1) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = paint;
  ctx.lineWidth = weight;
  ctx.stroke();
}

function poly(ctx, points, paint) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fillStyle = paint;
  ctx.fill();
}

function rounded(ctx, x, y, width, height, radius, paint) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = paint;
  ctx.fill();
}

function noiseLayer(createCanvas, seed) {
  const plate = createCanvas(480, 270);
  const ctx = plate.getContext('2d');
  const pixel = ctx.createImageData(480, 270);
  const random = seedRandom(seed);
  for (let i = 0; i < pixel.data.length; i += 4) {
    const shade = random() < .56 ? 0 : 241;
    pixel.data[i] = shade;
    pixel.data[i + 1] = shade;
    pixel.data[i + 2] = shade;
    pixel.data[i + 3] = random() * 13;
  }
  ctx.putImageData(pixel, 0, 0);
  return plate;
}

function matte(ctx, createCanvas, seed, strength = .63) {
  ctx.drawImage(noiseLayer(createCanvas, seed), 0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H * .51);
  ctx.scale(W / 2, H / 2);
  const g = ctx.createRadialGradient(0, 0, .32, 0, 0, 1.38);
  g.addColorStop(0, 'rgba(4,8,15,0)');
  g.addColorStop(.73, 'rgba(3,7,14,.15)');
  g.addColorStop(1, 'rgba(3,6,13,' + strength + ')');
  fill(ctx, -1, -1.05, 2, 2.1, g);
  ctx.restore();
}

function wood(ctx, x, y, width, height, random, colors) {
  fill(ctx, x, y, width, height, ramp(ctx, x, y, x, y + height, [[0, colors[0]], [.42, colors[1]], [1, colors[2]]]));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  for (let i = 0; i < 500; i++) {
    const sx = x + random() * width;
    const sy = y + random() * height;
    const length = 30 + random() * 320;
    const bend = 2 + random() * 5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(sx + length * .27, sy - bend, sx + length * .65, sy + bend, sx + length, sy + bend * .3);
    ctx.strokeStyle = random() < .48 ? 'rgba(235,158,96,.055)' : 'rgba(8,8,11,.12)';
    ctx.lineWidth = .7 + random() * 2;
    ctx.stroke();
  }
  ctx.restore();
}

function tilewall(ctx, random, colors, xStart = 0, yStart = 246) {
  fill(ctx, 0, 0, W, H, ramp(ctx, 0, 0, 300, 800, [[0, colors[0]], [1, colors[1]]]));
  for (let y = yStart; y < 772; y += 80) {
    for (let x = xStart - ((y - yStart) / 80 % 2) * 88; x < W; x += 177) {
      rounded(ctx, x + 3, y + 3, 170, 74, 3, random() > .3 ? colors[2] : colors[3]);
      line(ctx, x + 8, y + 7, x + 163, y + 7, 'rgba(224,216,185,.08)', 1);
      line(ctx, x + 9, y + 73, x + 163, y + 73, 'rgba(2,9,17,.22)', 2);
    }
  }
}

function lampShade(ctx, x, y, size, warm = '255,178,99') {
  line(ctx, x, -15, x, y - size * .36, '#17171d', size * .047);
  haze(ctx, x, y + size, size * 4, size * 4, warm, .24);
  const metal = ramp(ctx, x - size, y, x + size, y, [[0, '#302726'], [.43, '#65473a'], [.67, '#795741'], [1, '#2d272b']]);
  poly(ctx, [[x - size * .22, y - size * .38], [x + size * .23, y - size * .38], [x + size, y + size * .24], [x - size, y + size * .24]], metal);
  oval(ctx, x, y + size * .25, size, size * .16, '#251d20');
  oval(ctx, x, y + size * .25, size * .85, size * .10, '#bb875e');
  oval(ctx, x, y + size * .28, size * .27, size * .06, '#eac18e');
  strokeOval(ctx, x, y + size * .249, size * .91, size * .117, '#805843', 3, 0, Math.PI);
}

function jar(ctx, x, floor, width, height, body) {
  const y = floor - height;
  haze(ctx, x, floor, width * 1.7, 22, '12,8,13', .85);
  rounded(ctx, x - width * .5, y + 17, width, height - 18, width * .19, body);
  rounded(ctx, x - width * .44, y, width * .88, 24, 5, '#342b29');
  line(ctx, x - width * .36, y + 3, x + width * .34, y + 3, 'rgba(184,135,91,.3)', 2);
  line(ctx, x - width * .36, y + 27, x - width * .36, y + height - 20, 'rgba(238,210,171,.1)', 3);
}

function cup(ctx, x, y, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  haze(ctx, 0, 110, 155, 40, '12,8,14', .76);
  oval(ctx, 0, 100, 127, 24, '#4b4d43');
  oval(ctx, 0, 96, 113, 17, '#7b7e67');
  ctx.beginPath();
  ctx.ellipse(73, 25, 51, 29, -.41, -1.35, Math.PI * 1.5);
  ctx.strokeStyle = color[1];
  ctx.lineWidth = 15;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-73, 0);
  ctx.bezierCurveTo(-68, 32, -65, 87, -37, 92);
  ctx.quadraticCurveTo(0, 102, 41, 92);
  ctx.bezierCurveTo(65, 85, 68, 41, 72, 0);
  ctx.closePath();
  ctx.fillStyle = ramp(ctx, -75, 0, 74, 0, [[0, color[0]], [.39, color[1]], [.77, color[2]], [1, color[0]]]);
  ctx.fill();
  oval(ctx, 0, 0, 73, 17, color[2]);
  oval(ctx, 0, 1, 63, 13, '#3d2a23');
  strokeOval(ctx, 0, 0, 71, 16, 'rgba(236,215,173,.38)', 2, Math.PI, TAU);
  ctx.restore();
}

function steamTexture(createCanvas) {
  const plate = createCanvas(140, 144);
  const ctx = plate.getContext('2d');
  haze(ctx, 69, 72, 59, 68, '203,210,210', .64);
  haze(ctx, 56, 75, 38, 44, '220,216,198', .16);
  return plate;
}

function drawSteam(ctx, cloud, x, y, phase, sway, strength) {
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const age = (phase * 2 + i / 7) % 1;
    const envelope = Math.sin(age * Math.PI) ** 1.6;
    const width = 23 + 104 * age;
    const drift = Math.sin(age * TAU * .7 + phase * TAU) * age * sway;
    ctx.globalAlpha = strength * envelope;
    ctx.drawImage(cloud, x + sway * age * .32 + drift - width / 2, y - 181 * age - width * .56, width, width * 1.10);
  }
  ctx.restore();
}

function paintKettle(ctx, x, y) {
  haze(ctx, x, y + 156, 246, 41, '15,9,12', .91);
  ctx.beginPath();
  ctx.moveTo(x + 126, y + 33);
  ctx.quadraticCurveTo(x + 173, y + 20, x + 205, y - 27);
  ctx.lineTo(x + 234, y - 36);
  ctx.quadraticCurveTo(x + 201, y + 53, x + 139, y + 101);
  ctx.closePath();
  ctx.fillStyle = ramp(ctx, x + 110, y, x + 213, y + 96, [[0, '#9a7457'], [.42, '#61483d'], [1, '#393136']]);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 99, y + 20);
  ctx.bezierCurveTo(x - 213, y - 211, x + 142, y - 216, x + 108, y - 5);
  ctx.strokeStyle = '#292326';
  ctx.lineWidth = 35;
  ctx.stroke();
  ctx.strokeStyle = '#624a3e';
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 86, y - 14);
  ctx.bezierCurveTo(x - 132, y + 10, x - 190, y + 89, x - 151, y + 140);
  ctx.bezierCurveTo(x - 99, y + 173, x + 90, y + 174, x + 145, y + 140);
  ctx.bezierCurveTo(x + 170, y + 83, x + 136, y + 11, x + 91, y - 14);
  ctx.closePath();
  ctx.fillStyle = ramp(ctx, x - 140, y - 50, x + 156, y + 110, [[0, '#382e32'], [.25, '#8f6a50'], [.48, '#b8875d'], [.72, '#694c3d'], [1, '#392d31']]);
  ctx.fill();
  oval(ctx, x + 1, y - 15, 94, 21, '#71503c');
  strokeOval(ctx, x, y - 15, 92, 20, 'rgba(230,170,126,.52)', 3, Math.PI, TAU);
  rounded(ctx, x - 16, y - 45, 34, 18, 7, '#2b2426');
  oval(ctx, x, y - 45, 23, 9, '#58443b');
  haze(ctx, x - 61, y + 66, 73, 71, '232,169,108', .18);
}

function paintDripper(ctx, x, y) {
  cup(ctx, x, y + 103, 1.54, ['#424944', '#7a806a', '#a59e7e']);
  oval(ctx, x, y + 101, 126, 17, '#443930');
  poly(ctx, [[x - 144, y - 73], [x + 148, y - 73], [x + 60, y + 98], [x - 60, y + 98]],
    ramp(ctx, x - 145, y, x + 145, y, [[0, '#51433b'], [.4, '#b68861'], [.63, '#b68e68'], [1, '#685245']]));
  for (let i = -12; i <= 12; i++) {
    line(ctx, x + i * 11.7, y - 64 + Math.abs(i) * .35, x + i * 4.8, y + 96, i % 3 ? 'rgba(53,38,32,.28)' : 'rgba(231,172,118,.40)', i % 3 ? 2.5 : 4);
  }
  oval(ctx, x, y - 73, 146, 31, '#bc9a70');
  oval(ctx, x, y - 73, 128, 23, '#5b4539');
  oval(ctx, x, y - 69, 103, 16, '#302520');
}

function bread(ctx, x, y, size, random) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.beginPath();
  ctx.moveTo(-208, 34);
  ctx.bezierCurveTo(-241, -73, -134, -118, -19, -120);
  ctx.bezierCurveTo(116, -131, 230, -65, 211, 37);
  ctx.bezierCurveTo(139, 73, -122, 74, -208, 34);
  ctx.fillStyle = ramp(ctx, 0, -100, 0, 59, [[0, '#ae8256'], [.36, '#936744'], [.83, '#664434'], [1, '#3d2d29']]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let i = 0; i < 780; i++) {
    const a = random() * TAU;
    const r = Math.sqrt(random());
    const px = Math.cos(a) * 207 * r;
    const py = Math.sin(a) * 91 * r - 21;
    oval(ctx, px, py, .5 + random() * 2, .4 + random() * 1.3, random() > .47 ? 'rgba(237,199,135,.22)' : 'rgba(49,30,25,.35)', a);
  }
  for (const offset of [-108, -35, 36, 100]) {
    ctx.beginPath();
    ctx.moveTo(offset - 23, -109);
    ctx.quadraticCurveTo(offset + 15, -91, offset + 39, -51);
    ctx.strokeStyle = '#58382c';
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.strokeStyle = '#bf9061';
    ctx.lineWidth = 7;
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

function kitchenScene(kind, seed) {
  return createCanvas => {
    const random = seedRandom(seed);
    const plate = createCanvas(W, H);
    const ctx = plate.getContext('2d');
    const breadRoom = kind === 'bread';
    const coffeeRoom = kind === 'dripper';
    const colors = breadRoom ? ['#211e23', '#4c3830', '#433833', '#46362f'] : coffeeRoom
      ? ['#161c24', '#4a4140', '#454b50', '#42484e'] : ['#141c24', '#303c42', '#39494c', '#354347'];
    tilewall(ctx, random, colors, 0, breadRoom ? 45 : 244);

    if (breadRoom) {
      for (let x = 101; x < 700; x += 183) {
        fill(ctx, x, 97, 153, 451, '#332721');
        fill(ctx, x + 12, 111, 130, 418, '#45332a');
        fill(ctx, x + 21, 126, 112, 385, '#3a2d27');
        line(ctx, x + 115, 287, x + 115, 339, '#8a6b4d', 7);
      }
      lampShade(ctx, 1194, 216, 176, '247,167,101');
    } else if (coffeeRoom) {
      wood(ctx, 218, 407, 630, 27, random, ['#5e463e', '#352b2c', '#211f28']);
      jar(ctx, 340, 401, 120, 185, '#6a5d4a');
      jar(ctx, 500, 401, 91, 155, '#534f48');
      jar(ctx, 637, 401, 102, 137, '#50575a');
      lampShade(ctx, 1229, 207, 124);
    } else {
      fill(ctx, 0, 0, W, 224, '#1c2028');
      for (let x = 3; x < W; x += 328) {
        fill(ctx, x + 12, 0, 309, 189, ramp(ctx, x, 0, x, 189, [[0, '#262b30'], [1, '#383536']]));
        line(ctx, x + 196, 157, x + 265, 157, '#655750', 6);
      }
      fill(ctx, 405, 214, 812, 12, '#93775b');
      haze(ctx, 786, 495, 773, 472, '251,170,97', .37);
    }

    const counter = breadRoom ? 695 : 744;
    wood(ctx, 0, counter, W, H - counter, random, breadRoom ? ['#694e3f', '#513b31', '#282326'] : ['#50423d', '#403736', '#24252d']);
    line(ctx, 0, counter + 2, W, counter + 2, 'rgba(202,158,120,.22)', 4);

    if (kind === 'kettle') {
      rounded(ctx, 455, 744, 865, 132, 13, ramp(ctx, 0, 743, 0, 878, [[0, '#272d33'], [1, '#161921']]));
      oval(ctx, 896, 798, 310, 36, '#181923');
      strokeOval(ctx, 896, 798, 269, 24, '#515052', 4);
      paintKettle(ctx, 869, 635);
      jar(ctx, 1420, 772, 155, 123, '#52564b');
      jar(ctx, 1595, 770, 121, 166, '#494846');
    } else if (coffeeRoom) {
      oval(ctx, 1120, 848, 275, 45, '#52413a');
      strokeOval(ctx, 1120, 848, 255, 38, 'rgba(207,155,126,.27)', 2);
      paintDripper(ctx, 1110, 614);
      poly(ctx, [[277, 803], [658, 783], [770, 896], [343, 927]], '#414743');
      for (let i = 0; i < 10; i++) line(ctx, 282 + i * 35, 808 - i * 2, 345 + i * 41, 922 - i * 2, 'rgba(151,159,130,.3)', 2);
      oval(ctx, 530, 844, 86, 24, '#372d2c', -.09);
      for (let i = 0; i < 26; i++) oval(ctx, 464 + random() * 127, 841 + random() * 11, 4 + random() * 4, 2.8, '#845d43', random() * 2);
    } else {
      poly(ctx, [[689, 728], [1450, 728], [1532, 896], [592, 895]], '#342c2b');
      for (let step = 0; step < 22; step++) {
        line(ctx, 704 + step * 33, 734, 617 + step * 42, 886, '#8b7564', 3);
      }
      for (let step = 0; step < 9; step++) line(ctx, 702 - step * 10, 738 + step * 17, 1440 + step * 10, 738 + step * 17, '#716257', 2.7);
      bread(ctx, 1112, 757, 1.14, random);
      bread(ctx, 770, 804, .47, random);
      oval(ctx, 1559, 885, 104, 32, '#6b4b33', .25);
      oval(ctx, 1552, 881, 94, 25, '#8a6444', .25);
      line(ctx, 1510, 874, 1416, 838, '#a67a4f', 15);
    }

    matte(ctx, createCanvas, seed * 31);
    const steam = steamTexture(createCanvas);
    const steamX = breadRoom ? 1112 : coffeeRoom ? 1113 : 1085;
    const steamY = breadRoom ? 665 : coffeeRoom ? 553 : 609;
    return (target, input) => {
      const phase = input - Math.floor(input);
      target.drawImage(plate, 0, 0);
      drawSteam(target, steam, steamX, steamY, phase, breadRoom ? 131 : 84, breadRoom ? .42 : .39);
      if (coffeeRoom) {
        // Keep the small ripples inside the visible bed of wet grounds.
        target.save();
        target.beginPath();
        target.ellipse(1110, 545, 99, 14, 0, 0, TAU);
        target.clip();
        for (let i = 0; i < 3; i++) {
          const age = (phase * 4 + i / 3) % 1;
          const alpha = Math.sin(age * Math.PI) ** 1.4;
          strokeOval(target, 1116, 546, 4 + age * 42, 1.1 + age * 7,
            'rgba(175,119,86,' + (.58 * alpha) + ')', 1.5, .22, 5.98);
        }
        target.restore();
      }
    };
  };
}

register('14', '구리 주전자가 식는 부엌', 'copper-kettle-kitchen', 'rain-room', '벽 너머의 잔잔한 빗소리', kitchenScene('kettle', 515));
register('15', '새벽에 내리는 한 잔의 커피', 'predawn-coffee-dripper', 'rain-room', '창 너머의 낮은 빗소리', kitchenScene('dripper', 956));
register('16', '빵을 식히는 나무 작업대', 'bread-on-the-cooling-rack', 'wind', '작업실 밖을 스치는 바람', kitchenScene('bread', 708));


function fabric(ctx, x, y, w, h, random, colors) {
  fill(ctx, x, y, w, h, ramp(ctx, x, y, x + w, y + h, [[0, colors[0]], [.47, colors[1]], [1, colors[2]]]));
  for (let i = 0; i < 480; i++) {
    const sx = x + random() * w;
    const sy = y + random() * h;
    line(ctx, sx, sy, sx + 2 + random() * 11, sy + random() * 3, random() > .55 ? 'rgba(189,176,165,.067)' : 'rgba(12,11,19,.28)', 1);
  }
}

function clockRing(ctx, x, y, r, color) {
  oval(ctx, x, y, r, r, '#292125');
  strokeOval(ctx, x, y, r - 3, r - 3, color, 3);
  strokeOval(ctx, x, y, r - 14, r - 14, '#59473e', 2);
  for (let tick = 0; tick < 60; tick++) {
    const a = tick / 60 * TAU;
    const start = r - (tick % 5 ? 17 : 26);
    line(ctx, x + Math.sin(a) * start, y + Math.cos(a) * start, x + Math.sin(a) * (r - 12), y + Math.cos(a) * (r - 12), color, tick % 5 ? 1 : 2.4);
  }
}

function reel(ctx, x, y, r, phase, hue) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(phase * TAU);
  oval(ctx, 0, 0, r, r, '#29292c');
  oval(ctx, 0, 0, r * .85, r * .85, '#1c2027');
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a - .12) * r * .19, Math.sin(a - .12) * r * .19);
    ctx.arc(0, 0, r * .71, a - .11, a + .31);
    ctx.lineTo(Math.cos(a + .41) * r * .19, Math.sin(a + .41) * r * .19);
    ctx.closePath();
    ctx.fillStyle = hue;
    ctx.fill();
  }
  strokeOval(ctx, 0, 0, r * .97, r * .97, hue, 4);
  strokeOval(ctx, 0, 0, r * .80, r * .80, '#725d4c', 1.8);
  if (r > 80) {
    poly(ctx, [[r * .27, -r * .057], [r * .73, -r * .053], [r * .73, r * .134], [r * .26, r * .081]], '#867568');
    line(ctx, r * .31, r * .08, r * .67, r * .116, '#aa8f6f', 2);
    oval(ctx, r * .67, r * .041, r * .035, r * .035, '#ae997f');
  }
  oval(ctx, 0, 0, r * .14, r * .14, hue);
  oval(ctx, 0, 0, r * .057, r * .057, '#938271');
  ctx.restore();
}

function listeningScene(kind, seed) {
  return createCanvas => {
    const random = seedRandom(seed);
    const plate = createCanvas(W, H);
    const ctx = plate.getContext('2d');
    const projector = kind === 'projector';
    const cassette = kind === 'cassette';
    fill(ctx, 0, 0, W, H, ramp(ctx, 0, 0, 630, 1060, [[0, '#171f2a'], [.55, '#393935'], [1, '#141923']]));

    if (projector) {
      const screen = ramp(ctx, 1209, 191, W, 699, [[0, '#464449'], [.38, '#585357'], [1, '#302e38']]);
      rounded(ctx, 1094, 119, 714, 563, 7, '#161922');
      fill(ctx, 1121, 147, 659, 505, screen);
      fill(ctx, 1066, 662, 761, 28, '#28272d');
      for (let y = 157; y < 650; y += 11) line(ctx, 1122, y, 1779, y, 'rgba(167,160,160,.042)', 1);
      haze(ctx, 1378, 395, 300, 303, '240,210,158', .18);
      wood(ctx, 0, 782, W, 298, random, ['#524335', '#3b312d', '#221f24']);
      rounded(ctx, 236, 711, 753, 129, 12, ramp(ctx, 0, 700, 0, 862, [[0, '#574d43'], [.47, '#393433'], [1, '#25232b']]));
      rounded(ctx, 317, 405, 504, 329, 41, ramp(ctx, 339, 416, 727, 729, [[0, '#625747'], [.45, '#443d35'], [1, '#232732']]));
      rounded(ctx, 387, 527, 386, 164, 16, '#343139');
      for (let i = 0; i < 13; i++) line(ctx, 442 + i * 14, 549, 442 + i * 14, 661, '#22242b', 4);
      rounded(ctx, 721, 486, 197, 99, 20, '#29262b');
      rounded(ctx, 859, 481, 75, 105, 12, '#51443a');
      fill(ctx, 899, 493, 34, 75, '#bca277');
      haze(ctx, 938, 530, 88, 68, '238,205,155', .33);
      poly(ctx, [[912, 521], [1413, 322], [1413, 578], [912, 558]],
        ramp(ctx, 922, 531, 1413, 423, [[0, 'rgba(252,228,168,.15)'], [1, 'rgba(237,212,181,.015)']]));
      for (let i = 0; i < 9; i++) line(ctx, 246 + i * 65, 820, 268 + i * 65, 820, '#6d5a46', 2);
    } else if (cassette) {
      wood(ctx, 111, 90, 1697, 396, random, ['#4e4238', '#372e2f', '#211f2a']);
      wood(ctx, 0, 681, W, 399, random, ['#504138', '#342d2e', '#271f22']);
      lampShade(ctx, 489, 278, 96, '231,165,109');
      haze(ctx, 1012, 650, 849, 343, '15,135,167', .14);
      haze(ctx, 1013, 774, 825, 149, '8,9,17', .99);
      rounded(ctx, 399, 447, 1180, 352, 18, ramp(ctx, 411, 479, 1489, 794, [[0, '#554d49'], [.45, '#454a50'], [1, '#2b3038']]));
      rounded(ctx, 477, 497, 619, 238, 9, '#212631');
      rounded(ctx, 523, 524, 524, 185, 3, '#464a52');
      rounded(ctx, 558, 546, 456, 140, 10, '#313741');
      fill(ctx, 617, 562, 321, 43, '#75665b');
      fill(ctx, 651, 618, 251, 29, '#23242f');
      for (let i = 0; i < 4; i++) rounded(ctx, 526 + i * 112, 759, 85, 15, 4, '#676367');
      rounded(ctx, 1161, 506, 346, 110, 8, '#25363d');
      fill(ctx, 1191, 540, 287, 42, '#295460');
      for (let j = 0; j < 23; j++) fill(ctx, 1201 + j * 11.8, 572, 5, 4, '#618585');
      oval(ctx, 1357, 698, 71, 59, '#1e2129');
      oval(ctx, 1355, 696, 59, 48, ramp(ctx, 1305, 663, 1404, 730, [[0, '#766c62'], [1, '#464c54']]));
      line(ctx, 1354, 665, 1352, 687, '#aaa295', 3);
    } else {
      fabric(ctx, 0, 0, 470, 793, random, ['#1a202b', '#3d353b', '#211f29']);
      fill(ctx, 591, 104, 558, 522, '#292330');
      fill(ctx, 609, 121, 522, 485, '#454048');
      line(ctx, 611, 126, 1129, 126, '#635555', 2);
      for (let j = 0; j < 16; j++) {
        const x = 641 + j * 25;
        const width = 15 + random() * 14;
        const rise = 194 + random() * 197;
        poly(ctx, [[x, 571], [x + width, 571], [x + width - 15, 571 - rise], [x - 19, 571 - rise]], ['#48383b', '#6d5545', '#4e5555', '#51464a'][j % 4]);
        line(ctx, x + 5, 564, x - 8, 580 - rise, '#826865', 2);
      }
      fill(ctx, 615, 572, 509, 31, '#4f403b');
      lampShade(ctx, 1473, 247, 137);
      wood(ctx, 0, 700, W, 380, random, ['#634b3d', '#493b33', '#272329']);
      haze(ctx, 1059, 872, 629, 142, '10,7,13', .92);
      const woodGrain = ramp(ctx, 542, 583, 1480, 904, [[0, '#75533c'], [.57, '#64473a'], [1, '#32272a']]);
      poly(ctx, [[532, 630], [1448, 600], [1576, 874], [492, 916]], woodGrain);
      poly(ctx, [[492, 916], [1576, 874], [1576, 920], [490, 962]], '#392924');
      poly(ctx, [[567, 655], [1411, 625], [1513, 846], [538, 884]], '#3b3938');
      oval(ctx, 956, 748, 347, 119, '#1c1e24', -.037);
      for (let i = 0; i < 43; i++) {
        const amount = 1 - i * .0139;
        strokeOval(ctx, 956, 748, 338 * amount, 112 * amount, i % 4 ? '#282a2e' : '#414044', .68);
      }
      strokeOval(ctx, 956, 748, 349, 121, '#7b756b', 4);
      rounded(ctx, 1376, 651, 79, 60, 9, '#1e222d');
      oval(ctx, 1415, 682, 22, 19, '#746961');
      ctx.beginPath();
      ctx.moveTo(1414, 682);
      ctx.bezierCurveTo(1390, 714, 1370, 750, 1339, 778);
      ctx.lineTo(1263, 798);
      ctx.strokeStyle = '#a2998c';
      ctx.lineWidth = 5;
      ctx.stroke();
      poly(ctx, [[1261, 791], [1292, 788], [1291, 801], [1258, 807]], '#654f41');
    }

    matte(ctx, createCanvas, seed * 21);
    const dust = Array.from({length: 31}, () => [random(), random(), random()]);
    return (target, input) => {
      const phase = input - Math.floor(input);
      target.drawImage(plate, 0, 0);
      if (projector) {
        reel(target, 482, 314, 134, phase * 2, '#5d544c');
        reel(target, 762, 328, 99, -phase * 2, '#514c45');
        for (const [baseX, baseY, speed] of dust) {
          const angle = TAU * (phase + speed);
          const x = 966 + baseX * 402 + 17 * Math.cos(angle);
          const range = 39 + (x - 966) * .192;
          const y = 530 + (baseY - .48) * range + 10 * Math.sin(angle);
          oval(target, x, y, .5 + speed * 1.7, .4 + speed * 1.6, 'rgba(216,204,170,' + (.10 + .11 * Math.sin(angle) ** 2) + ')');
        }
      } else if (cassette) {
        reel(target, 671, 630, 29, phase * 2, '#9b8f75');
        reel(target, 892, 631, 30, phase, '#9b8f75');
        const pulse = .51 + .11 * Math.sin(phase * TAU);
        for (let i = 0; i < 19; i++) {
          const active = 4 + (4 + 3.8 * Math.sin(phase * TAU * 2 + i * .42));
          fill(target, 1204 + i * 12.3, 565 - active, 5, active, 'rgba(122,203,199,' + pulse + ')');
        }
      } else {
        target.save();
        target.translate(956, 748);
        target.scale(1, .35);
        target.rotate(phase * TAU);
        oval(target, 0, 0, 100, 100, '#8f5f4a');
        oval(target, 0, 0, 85, 85, '#aa785b');
        poly(target, [[-73, -34], [43, -78], [75, -30], [-48, 14]], '#c39066');
        strokeOval(target, 0, 0, 73, 73, '#7c5449', 1.7, .5, 4.5);
        oval(target, 0, 0, 6, 6, '#26262e');
        target.restore();
        haze(target, 914, 716, 299, 37, '216,176,127', .07);
      }
    };
  };
}

register('17', '오래된 턴테이블의 한 바퀴', 'turntable-last-side', 'record', '레코드 표면의 낮은 잡음', listeningScene('record', 188));
register('18', '푸른 불빛이 켜진 카세트', 'blue-cassette-deck', 'mechanism', '카세트 모터의 낮은 울림', listeningScene('cassette', 126));
register('19', '빈 상영실의 작은 영사기', 'empty-room-projector', 'mechanism', '영사기의 조용한 모터음', listeningScene('projector', 377));

function leaf(ctx, x, y, length, width, angle, colors) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-width * .61, -length * .11, -width * .87, -length * .76, 0, -length);
  ctx.bezierCurveTo(width * .68, -length * .72, width * .67, -length * .25, 0, 0);
  ctx.fillStyle = ramp(ctx, -width * .5, 0, width * .6, -length * .6, [[0, colors[0]], [.58, colors[1]], [1, colors[2]]]);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.quadraticCurveTo(5, -length * .47, 0, -length * .91);
  ctx.strokeStyle = colors[2];
  ctx.lineWidth = Math.min(1.55, width * .089);
  ctx.stroke();
  ctx.restore();
}

function shoot(ctx, x, y, height, bend, colors, random) {
  const topX = x + bend;
  const topY = y - height;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + bend * .2, y - height * .53, topX, topY);
  ctx.strokeStyle = colors[1];
  ctx.lineWidth = Math.max(2, height / 67);
  ctx.stroke();
  const leaves = Math.floor(height / 45) + 3;
  for (let i = 1; i < leaves; i++) {
    const u = i / leaves;
    const stemX = x + bend * (.4 * u + .6 * u * u);
    const stemY = y - height * u;
    const angle = (i % 2 ? -1 : 1) * (.66 + random() * .45) + bend / height * .17;
    const length = (47 + random() * 45) * (1 - u * .48) * Math.min(1.55, height / 190);
    leaf(ctx, stemX, stemY, length, length * (.34 + random() * .1), angle, colors);
  }
  leaf(ctx, topX, topY, height * .28, height * .081, Math.atan2(bend, height), colors);
}

function planter(ctx, x, y, width, height, light) {
  haze(ctx, x, y + height, width * .94, 35, '8,12,15', .86);
  poly(ctx, [[x - width / 2, y], [x + width / 2, y], [x + width * .32, y + height], [x - width * .32, y + height]],
    ramp(ctx, x - width / 2, y, x + width / 2, y + height, [[0, '#29262a'], [.46, light], [1, '#373131']]));
  oval(ctx, x, y, width * .5, height * .17, light);
  oval(ctx, x, y, width * .446, height * .108, '#32322d');
  strokeOval(ctx, x, y, width * .475, height * .15, 'rgba(235,207,168,.33)', 1.8, 0, Math.PI);
}

const botanical = ['#273b3b', '#345c51', '#79a68a'];
const brassLeaf = ['#293d38', '#526547', '#89986f'];
const wateryLeaf = ['#183937', '#235b55', '#498678'];

function greenhouseScene(seed) {
  return createCanvas => {
    const random = seedRandom(seed);
    const plate = createCanvas(W, H);
    const ctx = plate.getContext('2d');
    const top = '#151e2c';
    const bottom = '#3c5a53';
    fill(ctx, 0, 0, W, H, ramp(ctx, 0, 0, 370, H, [[0, top], [.7, bottom], [1, '#151e24']]));
    const glassX = 437;
    const glassY = 59;
    const glassW = 1040;
    const glassH = 706;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(glassX, glassY, glassW, glassH, [126, 126, 2, 2]);
    ctx.clip();
    fill(ctx, glassX, glassY, glassW, glassH, ramp(ctx, 0, glassY, 0, glassY + glassH, [[0, '#14243a'], [.63, '#365867'], [1, '#46645d']]));
    haze(ctx, 927, 262, 574, 393, '117,175,177', .22);
    haze(ctx, 1189, 551, 519, 219, '187,179,147', .14);
    for (let i = 0; i < 100; i++) {
      const x = glassX + random() * glassW;
      const h = 30 + random() * 248;
      poly(ctx, [[x - h * .26, 746], [x, 746 - h], [x + h * .22, 746]], i % 2 ? '#274c48' : '#2d514d');
    }

    for (let i = 0; i < 90; i++) {
      const x = glassX + random() * glassW;
      const y = glassY + random() * glassH;
      if (random() < .68) strokeOval(ctx, x, y, 1.4 + random() * 2.5, 2.1 + random() * 4.1, 'rgba(172,209,197,.32)', 1.3, .4, 4);
    }
    for (let x = glassX + 178; x < glassX + glassW; x += 175) {
      fill(ctx, x - 7, glassY, 14, glassH, '#282e2d');
      fill(ctx, x + 4, glassY, 2, glassH, '#677879');
    }
    for (const y of [263, 485, 717]) {
      fill(ctx, glassX, y, glassW, 9, '#303a3a');
      line(ctx, glassX, y, glassX + glassW, y, '#607277', 1.9);
    }
    ctx.restore();
    ctx.beginPath();
    ctx.roundRect(glassX, glassY, glassW, glassH, [126, 126, 2, 2]);
    ctx.strokeStyle = '#303936';
    ctx.lineWidth = 23;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(150,147,109,.32)';
    ctx.lineWidth = 3;
    ctx.stroke();

    fill(ctx, 0, 764, W, 316, ramp(ctx, 0, 748, 0, 1080, [[0, '#49544c'], [1, '#292e2f']]));
    for (let i = -10; i <= 12; i++) line(ctx, 964 + i * 26, 764, 964 + i * 110, 1080, 'rgba(17,24,25,.6)', 2.3);
    for (const y of [792, 829, 881, 952, 1025]) line(ctx, 0, y, W, y, 'rgba(17,24,25,.43)', 2.5);
    for (let i = 0; i < 8; i++) {
      const x = i === 0 ? 1830 : 110 + i * 173;
      const y = 786 + (i % 3) * 49 + random() * 64;
      if (x > 654 && x < 1202) continue;
      planter(ctx, x, y, 116 + random() * 146, 62 + random() * 66, i % 2 ? '#635446' : '#655e46');
      for (let j = 0; j < 10; j++) shoot(ctx, x + 70 * (random() - .5), y - 2, 80 + random() * 302, (random() - .5) * 277, i % 2 ? botanical : brassLeaf, random);
    }
    const x = 50;
    for (let i = 0; i < 22; i++) shoot(ctx, x + random() * 90, 902, 283 + random() * 443, (random() - .5) * 344, botanical, random);
    matte(ctx, createCanvas, seed * 39);
    const leaves = Array.from({length: 12}, () => [random(), random(), random(), random()]);
    return (target, input) => {
      const phase = input - Math.floor(input);
      target.drawImage(plate, 0, 0);
      for (const [a, b, c] of leaves) {
        const along = (phase + a) % 1;
        const x = 540 + a * 866 + Math.sin(along * TAU) * 3;
        const y = 123 + b * 422 + 92 * along;
        strokeOval(target, x, y, 1.6 + c * 2.3, 4.1 + c * 6, 'rgba(192,225,210,' + (.43 * Math.sin(along * Math.PI)) + ')', 1.6, Math.PI * .12, Math.PI * 1.42);
      }
      for (let i = 0; i < 5; i++) {
        const age = (phase + i * .211) % 1;
        const x = 623 + i * 158 + 5.2 * Math.sin(age * TAU);
        const y = 297 + (i % 3) * 65 + 169 * age ** 1.36;
        const alpha = Math.sin(age * Math.PI) ** 1.55;
        line(target, x, y - 26 - i * 2, x, y - 5, 'rgba(143,193,184,' + (.26 * alpha) + ')', 3.1);
        oval(target, x, y, 3.1, 6.4, 'rgba(188,230,217,' + (.62 * alpha) + ')');
      }
    };
  };
}

function winterBayScene(createCanvas) {
  const random = seedRandom(693);
  const backdrop = createCanvas(W, H);
  const background = backdrop.getContext('2d');
  const facade = createCanvas(W, H);
  const wall = facade.getContext('2d');

  const front = [[107, 120], [1153, 205], [1153, 700], [107, 825]];
  const returnPane = [[1178, 207], [1450, 113], [1450, 766], [1178, 699]];
  function panes(ctx) {
    ctx.beginPath();
    for (const points of [front, returnPane]) {
      points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
    }
  }

  fill(background, 0, 0, W, H, ramp(background, 100, 80, W, H, [[0, '#182230'], [.62, '#272a30'], [1, '#3e302a']]));
  haze(background, 1590, 624, 654, 567, '232,144,73', .20);
  background.save();
  panes(background);
  background.clip();
  fill(background, 60, 90, 1420, 750, ramp(background, 110, 83, 430, 820, [[0, '#16243a'], [.57, '#364f65'], [1, '#566970']]));
  haze(background, 646, 290, 245, 220, '146,180,211', .29);
  oval(background, 651, 277, 40, 40, '#acbac2');
  for (let i = 0; i < 17; i++) {
    const angle = random() * TAU;
    const spread = random() * 36;
    haze(background, 651 + Math.cos(angle) * spread, 277 + Math.sin(angle) * spread, 3 + random() * 9, 4 + random() * 8, '99,135,167', .22);
  }
  poly(background, [[71, 604], [279, 548], [455, 576], [622, 539], [862, 601], [1054, 569], [1303, 533], [1470, 562], [1480, 852], [71, 852]], '#536675');
  poly(background, [[71, 677], [250, 632], [406, 663], [601, 621], [781, 637], [914, 676], [1086, 644], [1253, 673], [1470, 625], [1480, 852], [71, 852]],
    ramp(background, 0, 613, 0, 820, [[0, '#687d87'], [1, '#4b5a67']]));
  for (let i = 0; i < 68; i++) {
    const x = 80 + random() * 1399;
    const y = 651 + random() * 167;
    const length = 14 + random() * 93;
    line(background, x, y, x + length, y - 2.1, i % 2 ? 'rgba(176,192,199,.15)' : 'rgba(35,54,70,.20)', 1 + random() * 2.2);
  }
  for (const [x, y, size] of [[171, 690, 158], [378, 704, 126], [924, 683, 62], [1317, 697, 124]]) {
    const apex = x - size * .21;
    line(background, x, y, apex, y - size, '#30434e', 3 + size * .04);
    for (let i = 0; i < 10; i++) {
      const t = (i + 2) / 12;
      const startX = x - size * .21 * t;
      const startY = y - size * t;
      const direction = i % 2 ? 1 : -1;
      const dx = direction * size * (.16 + random() * .49) * (1 - t * .7);
      const dy = -size * (.13 + random() * .16);
      line(background, startX, startY, startX + dx, startY + dy, '#354955', 1 + (1 - t) * 2.1);
      line(background, startX + dx * .64, startY + dy * .64, startX + dx, startY + dy * 1.44, 'rgba(111,130,144,.64)', 1.2);
    }
  }
  fill(background, 1178, 100, 272, 700, 'rgba(13,28,45,.20)');
  background.restore();

  for (const pane of [front, returnPane]) {
    poly(wall, pane, 'rgba(104,138,165,.05)');
    wall.strokeStyle = '#19242e';
    wall.lineWidth = 22;
    wall.stroke();
    wall.strokeStyle = '#62727b';
    wall.lineWidth = 2.1;
    wall.stroke();
  }
  for (const [x, y, low, tone] of [[423, 146, 785, '#34434d'], [835, 180, 739, '#394955'], [1310, 161, 729, '#323c45']]) {
    line(wall, x, y, x, low, tone, 12);
    line(wall, x + 5, y, x + 5, low, 'rgba(127,157,172,.26)', 1.5);
  }
  line(wall, 1157, 198, 1157, 710, '#1a242d', 19);
  line(wall, 1168, 204, 1168, 713, '#505e64', 3.5);

  poly(wall, [[-8, 848], [1156, 708], [1478, 787], [1503, 840], [1101, 972], [-8, 1065]],
    ramp(wall, 280, 754, 1327, 1014, [[0, '#64747c'], [.49, '#46545d'], [1, '#4d413c']]));
  poly(wall, [[-8, 1065], [1101, 972], [1503, 840], [1502, 883], [1109, 1010], [165, 1081], [-8, 1081]], '#262e36');
  line(wall, -8, 1064, 1101, 972, 'rgba(157,169,172,.34)', 1.7);
  line(wall, 1101, 972, 1503, 840, 'rgba(137,133,124,.28)', 1.9);
  for (let i = 0; i < 128; i++) {
    const x = 101 + random() * 1030;
    const at = x / 1136;
    const y = 842 - at * 134 + random() * 24;
    const half = 1.2 + random() * 7;
    line(wall, x - half, y, x + half, y - random() * 3.6, 'rgba(193,212,215,.12)', .8 + random() * 1.7);
  }
  haze(wall, 1465, 817, 269, 77, '14,15,19', .6);
  planter(wall, 1457, 754, 225, 123, '#8e6546');
  for (let index = 0; index < 11; index++) {
    const size = 107 + random() * 245;
    shoot(wall, 1457 + (random() - .5) * 77, 748, size, (random() - .49) * 267, ['#394238', '#625a3f', '#a28b5f'], random);
  }
  lampShade(wall, 1739, 454, 72, '245,163,92');
  matte(wall, createCanvas, 693 * 39, .64);

  const flakes = Array.from({ length: 115 }, () => {
    const depth = random();
    return {
      x: 77 + random() * 1393,
      offset: random(),
      fall: depth > .72 ? 2 : 1,
      tail: .65 + depth ** 2.5 * 5.9,
      radiance: .08 + depth ** 1.7 * .45,
      drift: 13 + 25 * depth,
      flakeSize: depth > .87 ? 2.1 + 2.8 * (depth - .87) / .13 : 0,
    };
  });
  return (out, input) => {
    const phase = input - Math.floor(input);
    out.drawImage(backdrop, 0, 0);
    out.save();
    panes(out);
    out.clip();
    for (const { x, offset, fall, tail, radiance, drift, flakeSize } of flakes) {
      const at = (phase * fall + offset) % 1;
      const travel = Math.sin(at * TAU + offset * TAU) * drift + 37 * at;
      const y = 88 + at * 754;
      const fade = Math.min(1, Math.sin(at * Math.PI) * 3);
      const color = 'rgba(201,221,235,' + (radiance * fade) + ')';
      line(out, x + travel - 1.1, y - tail, x + travel, y, color, 1.05 + tail * .32);
      if (flakeSize) {
        oval(out, x + travel, y, flakeSize, flakeSize * .64, 'rgba(211,227,235,' + (.52 * fade) + ')', -.43);
      }
    }
    out.restore();
    out.drawImage(facade, 0, 0);
  };
}

function aquariumScene(createCanvas) {
  const seed = 887;
  const random = seedRandom(seed);
  const plate = createCanvas(W, H);
  const ctx = plate.getContext('2d');
  fill(ctx, 0, 0, W, H, ramp(ctx, 190, 0, 1712, 1010, [[0, '#25262d'], [.47, '#363c41'], [1, '#17222d']]));
  wood(ctx, 0, 874, W, 206, random, ['#65544a', '#483d38', '#23252d']);
  haze(ctx, 1085, 656, 1069, 458, '46,118,119', .25);
  rounded(ctx, 353, 173, 1204, 671, 11, '#20292f');
  const waterTop = 243;
  const waterBottom = 785;
  const left = 386;
  const width = 1142;
  const right = left + width;
  const water = ramp(ctx, left, waterTop, right, waterBottom, [[0, '#427572'], [.39, '#2f5e5e'], [.9, '#25484b'], [1, '#234343']]);
  fill(ctx, left, waterTop, width, waterBottom - waterTop, water);
  haze(ctx, 728, 468, 548, 319, '119,171,148', .19);
  poly(ctx, [[left, 726], [560, 693], [896, 710], [991, 744], [1360, 683], [right, 719], [right, waterBottom], [left, waterBottom]], '#4a5148');
  for (let i = 0; i < 500; i++) {
    const x = left + random() * width;
    const y = 730 + random() * 56;
    oval(ctx, x, y, 1.1 + random() * 5.9, 1 + random() * 3.2, ['#323b3b', '#6c6659', '#5e6256'][i % 3], random());
  }
  const movingShoots = [];
  for (let i = 0; i < 22; i++) {
    const x = i < 11 ? 456 + random() * 376 : 1099 + random() * 355;
    const floor = 738 + random() * 24;
    const height = 64 + random() * (i < 11 ? 324 : 251);
    const bend = (random() - .5) * 147;
    if (i === 4 || i === 8 || i === 16 || i === 20) {
      // Keep leaf proportions fixed while the anchored stems bend in the current.
      const leafCount = Math.floor(height / 45) + 2;
      const leafRandom = Array.from({ length: leafCount * 3 }, random);
      movingShoots.push({ x, floor, height, bend, leafRandom, offset: .87 * i });
    } else {
      shoot(ctx, x, floor, height, bend, wateryLeaf, random);
    }
  }
  for (let i = 0; i < 12; i++) {
    const x = 888 + random() * 150;
    const y = 727 + random() * 28;
    oval(ctx, x, y, 14 + random() * 50, 5 + random() * 27, '#3a4545', (random() - .5) * 1.32);
    strokeOval(ctx, x, y, 8 + random() * 20, 6 + random() * 9, 'rgba(156,176,160,.19)', 2, 3.14, 5.8);
  }
  line(ctx, left, 243, right, 243, 'rgba(181,226,207,.58)', 3);
  line(ctx, left + 8, 250, left + 8, 774, 'rgba(182,223,210,.28)', 3);
  line(ctx, right - 10, 250, right - 10, 772, 'rgba(176,213,221,.27)', 3);
  rounded(ctx, 345, 185, 1223, 45, 5, '#31383a');
  fill(ctx, 369, 221, 1173, 12, '#687d74');
  rounded(ctx, 339, 797, 1232, 46, 5, '#2c3036');
  fill(ctx, 489, 842, 926, 34, '#342a2d');
  jar(ctx, 1733, 901, 104, 183, '#4e5850');
  matte(ctx, createCanvas, seed * 41);

  const spores = Array.from({length: 31}, () => [random(), random(), random()]);
  return (target, input) => {
    const phase = input - Math.floor(input);
    target.drawImage(plate, 0, 0);
    target.save();
    target.beginPath();
    target.rect(left + 10, waterTop + 3, width - 20, waterBottom - waterTop - 6);
    target.clip();
    const angle = phase * TAU;
    for (const { x, floor, height, bend, leafRandom, offset } of movingShoots) {
      let index = 0;
      const sway = Math.sin(angle + offset) * 24 + Math.sin(angle * 2 + offset * 1.7) * 6;
      shoot(target, x, floor, height, bend + sway, wateryLeaf, () => leafRandom[index++]);
    }
    for (const [a, b, c] of spores) {
      const wave = (phase + a) * TAU;
      const x = left + 40 + b * 1028 + Math.sin(wave) * (10 + c * 16);
      const y = waterTop + 43 + c * 426 + Math.cos(wave * 2) * 23;
      oval(target, x, y, .7 + a * 2.2, .7 + c * 2, 'rgba(200,226,202,' + (.12 + Math.sin(wave) ** 2 * .28) + ')');
    }
    for (let i = 0; i < 12; i++) {
      const x = 562 + i * 63 + Math.cos(phase * TAU + i * .73) * 27;
      const y = 278 + Math.sin(i * 2.54) * 22 + Math.cos(phase * TAU + i) * 14;
      const shine = ramp(target, x - 33, y, x + 53, y, [
        [0, 'rgba(185,226,214,0)'], [.48, 'rgba(185,226,214,.14)'], [1, 'rgba(185,226,214,0)'],
      ]);
      line(target, x - 33, y + 1.4, x + 53, y, shine, 2.8);
    }
    target.restore();
  };
}

register('11', '유리 온실에 맺힌 새벽 이슬', 'glasshouse-before-dawn', 'drips', '유리 곁에 맺힌 물방울 소리', greenhouseScene(163));
register('12', '청록빛이 감도는 수초 수조', 'quiet-aquarium-plants', 'lake', '수초 너머로 번지는 잔물결 소리', aquariumScene);
register('13', '달빛이 드는 겨울 정원', 'winter-conservatory-moon', 'wind', '온실 밖에서 스치는 바람', winterBayScene);

function paintPages(ctx, x, y, random) {
  const cover = [[x - 409, y + 88], [x - 322, y - 141], [x - 39, y - 115], [x + 21, y - 89], [x + 327, y - 167], [x + 460, y + 74], [x + 135, y + 163], [x + 16, y + 156]];
  poly(ctx, cover, '#43302c');
  const offWhite = ramp(ctx, x - 380, y - 112, x + 440, y + 77, [[0, '#948876'], [.53, '#b9a686'], [1, '#958070']]);
  poly(ctx, [[x - 379, y + 57], [x - 309, y - 136], [x - 43, y - 116], [x + 18, y - 88], [x + 317, y - 155], [x + 416, y + 54], [x + 126, y + 128], [x + 11, y + 136]], offWhite);
  poly(ctx, [[x - 371, y + 47], [x - 308, y - 136], [x - 43, y - 116], [x + 18, y - 88], [x + 11, y + 142], [x - 80, y + 113]], '#a89a83');
  poly(ctx, [[x + 18, y - 88], [x + 317, y - 155], [x + 416, y + 52], [x + 129, y + 117], [x + 11, y + 142]],
    ramp(ctx, x + 1, y - 18, x + 275, y, [[0, '#87715f'], [.18, '#b9a58a'], [1, '#a8957c']]));
  for (let i = 0; i < 14; i++) {
    const shift = i * 3;
    line(ctx, x - 364, y + 57 + shift, x + 11, y + 144 + shift * .16, 'rgba(79,59,47,.36)', 1);
    line(ctx, x + 122, y + 122 + shift * .36, x + 411, y + 58 + shift * .43, 'rgba(86,65,50,.40)', 1);
  }
  for (let i = 0; i < 12; i++) {
    const offset = i * 13;
    const start = x - 288 - offset * .25;
    const end = x - 47 - .18 * offset - 27 * random();
    line(ctx, start, y - 100 + offset, end, y - 53 + offset, 'rgba(92,73,59,.29)', 1);
    line(ctx, x + 49 + offset * .17, y - 59 + offset, x + 288 + offset * .21 - 40 * random(), y - 111 + offset, 'rgba(90,70,62,.32)', 1);
  }
}

function spool(ctx, x, y, width, height, thread) {
  haze(ctx, x, y + 5, width * 1.35, 29, '11,10,17', .79);
  oval(ctx, x, y, width * .55, width * .17, '#6b5141');
  rounded(ctx, x - width * .4, y - height, width * .8, height + 1, width * .11, thread);
  for (let i = 7; i < height; i += 5) {
    line(ctx, x - width * .38, y - i, x + width * .37, y - i - 2.5, 'rgba(199,159,123,.27)', .9);
    line(ctx, x - width * .4, y - i + 1, x + width * .38, y - i - 1.5, 'rgba(34,27,31,.38)', 1.05);
  }
  oval(ctx, x, y - height, width * .56, width * .16, '#927259');
  oval(ctx, x, y - height, width * .16, width * .062, '#3b302d');
}

function craftScene(kind, seed) {
  return createCanvas => {
    const random = seedRandom(seed);
    const plate = createCanvas(W, H);
    const ctx = plate.getContext('2d');
    const book = kind === 'book';
    const cloth = kind === 'cloth';
    fill(ctx, 0, 0, W, H, ramp(ctx, 0, 0, 1183, 840, [[0, '#23212c'], [.51, '#3f393d'], [1, '#191c26']]));

    if (book) {
      wood(ctx, 60, 251, 770, 26, random, ['#6a5042', '#3a2e30', '#231d25']);
      for (let i = 0; i < 13; i++) {
        const x = 143 + 48 * i;
        const height = 76 + random() * 149;
        rounded(ctx, x, 251 - height, 42, height, 3, ['#565256', '#655647', '#473e42', '#555d5c'][i % 4]);
        line(ctx, x + 5, 264 - height, x + 5, 240, 'rgba(197,156,113,.25)', 2);
        line(ctx, x + 10, 228, x + 33, 228, 'rgba(183,139,93,.4)', 2);
      }
    } else if (cloth) {
      fabric(ctx, 16, 24, 428, 485, random, ['#2c3f47', '#435450', '#293942']);
      for (let x = 28; x < 439; x += 34) line(ctx, x, 28, x + 6, 514, 'rgba(130,156,137,.11)', 2);
      for (let x = 1; x < 7; x++) spool(ctx, 608 + x * 125, 396, 61, 104 + random() * 44, ['#715448', '#616b60', '#514853'][x % 3]);
      wood(ctx, 694, 396, 700, 30, random, ['#635046', '#42353a', '#26242c']);
    } else {
      for (let j = 0; j < 8; j++) {
        const x = 74 + (j % 4) * 158;
        const y = 121 + Math.floor(j / 4) * 130;
        rounded(ctx, x, y, 143, 108, 4, '#473b37');
        rounded(ctx, x + 13, y + 13, 115, 81, 3, '#523f3b');
        line(ctx, x + 45, y + 56, x + 90, y + 56, '#a5835f', 4);
      }
    }
    lampShade(ctx, book ? 1187 : cloth ? 438 : 1420, book ? 220 : 182, book ? 111 : 109);
    haze(ctx, book ? 1114 : cloth ? 866 : 1310, 549, 658, 420, '229,165,101', .15);
    wood(ctx, 0, 482, W, 598, random, book ? ['#6d5748', '#564138', '#27242a'] : cloth
      ? ['#5b4c40', '#423740', '#27242c'] : ['#625144', '#4f413b', '#28242b']);

    if (book) {
      haze(ctx, 1021, 829, 556, 218, '16,10,14', .84);
      paintPages(ctx, 1065, 697, random);
      rounded(ctx, 399, 638, 115, 228, 5, '#3b3735');
      line(ctx, 417, 650, 418, 836, 'rgba(159,119,81,.37)', 3);
      spool(ctx, 1566, 742, 72, 131, '#936d59');
      line(ctx, 510, 843, 617, 758, '#a18669', 9);
      line(ctx, 613, 759, 650, 730, '#8b8d89', 2);
    } else if (cloth) {
      const fabricCut = [[545, 624], [1259, 577], [1586, 874], [686, 1003], [705, 895]];
      ctx.save();
      ctx.beginPath();
      fabricCut.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.clip();
      fabric(ctx, 515, 559, 1080, 465, random, ['#374950', '#65716b', '#3c4a4b']);
      for (let i = 0; i < 63; i++) line(ctx, 515 + i * 15, 566, 597 + i * 18, 1036, 'rgba(189,191,158,.14)', i % 7 ? 1 : 2.5);
      for (let i = 0; i < 25; i++) line(ctx, 542, 600 + i * 18, 1570, 547 + i * 18, 'rgba(150,171,156,.16)', 2);
      ctx.restore();
      poly(ctx, [[545, 624], [706, 895], [686, 1003], [646, 947]], '#48545a');
      line(ctx, 708, 895, 1585, 874, 'rgba(189,183,142,.36)', 3);
      spool(ctx, 453, 797, 113, 151, '#a07963');
      spool(ctx, 625, 878, 92, 121, '#62675d');
      strokeOval(ctx, 974, 698, 52, 31, '#a19880', 18);
      strokeOval(ctx, 1057, 684, 46, 29, '#a19880', 17);
      poly(ctx, [[1012, 696], [1291, 647], [1103, 712], [1009, 711]], '#807e6e');
      poly(ctx, [[1019, 704], [1298, 758], [1091, 685], [1010, 688]], '#938c7a');
    } else {
      rounded(ctx, 325, 578, 1229, 345, 22, '#393838');
      rounded(ctx, 347, 591, 1188, 305, 19, '#414743');
      for (let i = 0; i < 21; i++) line(ctx, 358, 606 + i * 12, 1523, 603 + i * 12, 'rgba(146,156,138,.08)', 1);
      strokeOval(ctx, 926, 749, 158, 156, '#b4946b', 10);
      clockRing(ctx, 926, 749, 152, '#ddc498');
      strokeOval(ctx, 914, 586, 22, 24, '#b59b77', 7);
      oval(ctx, 911, 595, 15, 12, '#a68664');
      for (let i = 0; i < 6; i++) {
        const x = 1211 + i * 43;
        line(ctx, x, 670 + i * 9, x + 9, 798 - i * 4, '#797f7d', 7);
        rounded(ctx, x - 4, 777 - i * 4, 25, 60, 7, i % 2 ? '#776859' : '#5f574f');
      }
      for (const [x, y, r] of [[557, 733, 35], [636, 802, 29], [594, 845, 21], [698, 682, 19]]) {
        strokeOval(ctx, x, y, r, r, '#977e64', 6);
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * TAU;
          line(ctx, x + Math.cos(a) * (r - 8), y + Math.sin(a) * (r - 8), x + Math.cos(a) * (r + 6), y + Math.sin(a) * (r + 6), '#9e8467', 2);
        }
      }
    }
    matte(ctx, createCanvas, seed * 19);
    return (target, input) => {
      const phase = input - Math.floor(input);
      target.drawImage(plate, 0, 0);
      const angle = phase * TAU;
      if (book || cloth) {
        const x = book ? 1565 : 454;
        const y = book ? 694 : 727;
        target.beginPath();
        target.moveTo(x, y);
        if (book) target.bezierCurveTo(x + Math.sin(angle) * 21 - 45, 793, 1276 + Math.cos(angle) * 20, 824, 1097, 778);
        else target.bezierCurveTo(x + Math.sin(angle) * 40 - 12, 942, 860 + Math.cos(angle) * 27, 953, 975, 712);
        target.strokeStyle = book ? 'rgba(214,174,131,.65)' : 'rgba(197,165,127,.63)';
        target.lineWidth = 2.8;
        target.stroke();
      } else {
        line(target, 926, 749, 876, 702, '#a59477', 7.4);
        line(target, 926, 749, 940, 657, '#ad9a7d', 5);
        line(target, 926 - Math.sin(angle) * 18, 749 + Math.cos(angle) * 18, 926 + Math.sin(angle) * 119, 749 - Math.cos(angle) * 119, '#bf7c67', 2.1);
        oval(target, 926, 749, 7.6, 7.6, '#aa9273');
      }
    };
  };
}

register('20', '실을 꿰는 제본 작업대', 'quiet-bookbinding-bench', 'wind', '창호 너머의 희미한 바람', craftScene('book', 606));
register('21', '천 조각과 재봉등', 'sewing-room-fabric', 'rain-room', '고요하게 깔리는 빗소리', craftScene('cloth', 230));
register('22', '회중시계를 고치는 방', 'pocket-watch-repair', 'wind', '닫힌 창 너머의 잔잔한 바람', craftScene('watch', 889));

function stoneFloor(ctx, target, paint) {
  fill(ctx, 0, target, W, H - target, ramp(ctx, 0, target, 0, H, [[0, paint[0]], [1, paint[1]]]));
  for (let i = -12; i <= 12; i++) line(ctx, 962 + i * 63, target, 962 + i * 122, H, 'rgba(11,14,23,.48)', 2.5);
  for (let i = 1; i <= 8; i++) {
    const y = target + (H - target) * (i / 8) ** 2.2;
    line(ctx, 0, y, W, y, 'rgba(15,17,25,.45)', 2);
    line(ctx, 0, y + 3, W, y + 3, 'rgba(130,140,143,.13)', 1.6);
  }
}

function roseWindow(ctx, x, y, r, random) {
  const palette = ['#4a615d', '#50495f', '#685258', '#5b6879', '#665d4e', '#545970'];
  oval(ctx, x, y, r + 22, r + 22, '#4d4449');
  strokeOval(ctx, x, y, r + 13, r + 13, '#69595a', 5);
  oval(ctx, x, y, r, r, '#282e3c');
  for (let ring = 0; ring < 3; ring++) {
    for (let i = 0; i < 12; i++) {
      const rotation = TAU * i / 12;
      const outside = .37 + ring * .278;
      const inside = .18 + ring * .235;
      const points = [
        [x + Math.cos(rotation - .22) * r * inside, y + Math.sin(rotation - .22) * r * inside],
        [x + Math.cos(rotation - .195) * r * outside, y + Math.sin(rotation - .195) * r * outside],
        [x + Math.cos(rotation) * r * (outside + .054), y + Math.sin(rotation) * r * (outside + .054)],
        [x + Math.cos(rotation + .195) * r * outside, y + Math.sin(rotation + .195) * r * outside],
        [x + Math.cos(rotation + .22) * r * inside, y + Math.sin(rotation + .22) * r * inside],
      ];
      poly(ctx, points, palette[(i + ring * 3) % 6]);
      const spotX = x + Math.cos(rotation) * r * (inside + outside) * .5;
      const spotY = y + Math.sin(rotation) * r * (inside + outside) * .5;
      haze(ctx, spotX, spotY, 32, 32, '201,205,174', .10 + random() * .12);
    }
  }
  oval(ctx, x, y, r * .163, r * .163, '#97856a');
  oval(ctx, x, y, r * .092, r * .092, '#c0ab8a');
  strokeOval(ctx, x, y, r - 3, r - 3, '#7c6c76', 3);
}

function shelves(ctx, x, y, width, height, random) {
  fill(ctx, x, y, width, height, '#4c3b37');
  fill(ctx, x + 16, y + 19, width - 32, height - 27, '#26242b');
  const rows = 4;
  for (let j = 0; j < rows; j++) {
    const roof = y + j * height / rows;
    const floor = roof + height / rows - 9;
    for (let book = 0, location = x + 23; location < x + width - 37; book++) {
      const w = 15 + random() * 30;
      const h = 55 + random() * 64;
      if (location + w > x + width - 19) break;
      const colors = ['#56453e', '#634e49', '#4f5358', '#53645b', '#6f6255', '#4d3b48'];
      rounded(ctx, location, floor - h, w, h, 2, colors[(book + j * 3) % colors.length]);
      line(ctx, location + 3, floor - h + 5, location + 3, floor - 3, 'rgba(230,171,123,.2)', 2);
      if (book % 3 !== 0) {
        line(ctx, location + 6, floor - h + 15, location + w - 4, floor - h + 15, '#807067', 1.5);
        line(ctx, location + 5, floor - 11, location + w - 4, floor - 11, '#807067', 1.4);
      }
      location += w + 2 + random() * 3;
    }
    fill(ctx, x + 8, floor, width - 16, 14, '#5c463e');
    line(ctx, x + 11, floor + 1, x + width - 11, floor + 1, 'rgba(190,137,86,.27)', 2);
  }
  line(ctx, x + width - 3, y, x + width - 3, y + height, '#3e3232', 5);
}

function corridorLight(createCanvas) {
  const plate = createCanvas(W, H);
  const ctx = plate.getContext('2d');
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(682, 772);
  ctx.lineTo(1226, 772);
  ctx.lineTo(1461, H);
  ctx.lineTo(534, H);
  ctx.closePath();
  ctx.clip();
  haze(ctx, 964, 817, 241, 105, '136,132,159', .23);

  // Colour patches widen toward the near end of the stone floor.
  for (const [x, y, rx, ry, tint, alpha] of [
    [930, 823, 84, 35, '164,143,189', .21],
    [1030, 844, 89, 43, '133,175,173', .22],
    [814, 885, 110, 56, '144,145,202', .23],
    [948, 913, 137, 72, '198,147,172', .26],
    [1119, 905, 123, 65, '149,187,191', .24],
    [793, 976, 158, 90, '124,140,177', .18],
    [1000, 1004, 178, 86, '202,169,123', .24],
    [1188, 994, 165, 70, '160,142,183', .17],
  ]) {
    haze(ctx, x, y, rx, ry, tint, alpha);
  }
  ctx.restore();
  return plate;
}

function roomScene(kind, seed) {
  return createCanvas => {
    const random = seedRandom(seed);
    const plate = createCanvas(W, H);
    const ctx = plate.getContext('2d');
    const attic = kind === 'attic';
    const corridor = kind === 'corridor';
    fill(ctx, 0, 0, W, H, ramp(ctx, 0, 0, 911, H, [[0, '#171c29'], [.48, '#35383f'], [1, '#2b2730']]));

    if (attic) {
      const wall = ramp(ctx, 220, 226, 1651, 746, [[0, '#302f3a'], [.52, '#514946'], [1, '#33313a']]);
      poly(ctx, [[216, 595], [963, 58], [1704, 595], [1704, 786], [216, 786]], wall);
      for (let i = 0; i < 23; i++) {
        const x = 215 + i * 64;
        const top = 69 + 541 * Math.abs(x - 963) / 751;
        line(ctx, x, top, x, 775, 'rgba(25,22,28,.37)', 4);
        line(ctx, x + 5, top + 6, x + 5, 775, 'rgba(159,133,113,.1)', 1.6);
      }
      poly(ctx, [[0, 599], [947, 42], [1009, 82], [14, 683]], '#3d312d');
      poly(ctx, [[1919, 620], [968, 44], [907, 86], [1909, 694]], '#46372f');
      line(ctx, 30, 635, 930, 107, '#71564a', 4);
      line(ctx, 991, 101, 1860, 625, '#726053', 4);
      fill(ctx, 326, 604, 1320, 40, '#41352f');
      oval(ctx, 1007, 386, 174, 170, '#51413c');
      oval(ctx, 1007, 386, 149, 145, ramp(ctx, 0, 246, 0, 536, [[0, '#26364e'], [1, '#537281']]));
      haze(ctx, 1055, 357, 139, 126, '156,188,194', .18);
      oval(ctx, 1067, 352, 32, 32, '#a6c1c5');
      fill(ctx, 1000, 244, 12, 282, '#574a45');
      fill(ctx, 866, 381, 280, 12, '#574a45');
      strokeOval(ctx, 1007, 386, 151, 149, '#85715d', 4);
      wood(ctx, 0, 793, W, 287, random, ['#56483f', '#433a38', '#27262d']);
      rounded(ctx, 185, 716, 641, 215, 31, '#463c35');
      rounded(ctx, 212, 739, 605, 128, 13, '#6b5b52');
      line(ctx, 224, 793, 799, 793, '#3d3332', 3);
      oval(ctx, 481, 750, 235, 68, '#6b7472', -.12);
      oval(ctx, 445, 728, 120, 51, '#83888a', -.12);
      for (let i = 0; i < 16; i++) line(ctx, 287 + i * 30, 730 + 13 * Math.sin(i * .28), 296 + i * 30, 769 + 9 * Math.sin(i * .28), 'rgba(45,55,65,.28)', 2.3);
      for (let i = 0; i < 3; i++) rounded(ctx, 1417 + 31 * i, 809 - 47 * i, 317 - 26 * i, 110, 9, ['#51443e','#524941','#614f43'][i]);
    } else if (corridor) {
      const stone = ramp(ctx, 0, 0, 1920, 852, [[0, '#2b2a38'], [.53, '#41434e'], [1, '#252b37']]);
      fill(ctx, 84, 0, 1752, 817, stone);
      stoneFloor(ctx, 772, ['#414a57', '#272a37']);
      poly(ctx, [[0, 0], [466, 201], [681, 716], [0, 1059]], '#30303b');
      poly(ctx, [[1920, 0], [1431, 196], [1230, 716], [1920, 1058]], '#30303b');
      ctx.beginPath();
      ctx.roundRect(664, 105, 592, 699, [292, 292, 11, 11]);
      ctx.fillStyle = '#353543';
      ctx.fill();
      ctx.strokeStyle = '#60616a';
      ctx.lineWidth = 4;
      ctx.stroke();
      for (const [x, w, height] of [[112, 259, 1047], [387, 173, 872], [1469, 170, 873], [1641, 227, 1038]]) {
        fill(ctx, x, 0, w, height, ramp(ctx, x, 0, x + w, 0, [[0, '#41414e'], [.5, '#535260'], [1, '#333646']]));
        for (let y = 164; y < height; y += 123) line(ctx, x + 1, y, x + w - 3, y, 'rgba(24,27,40,.27)', 3);
        line(ctx, x + 6, 0, x + 6, height, 'rgba(138,143,156,.20)', 3);
      }
      roseWindow(ctx, 960, 399, 203, random);
      haze(ctx, 964, 751, 454, 114, '165,153,182', .23);
    } else {
      shelves(ctx, 120, 86, 498, 630, random);
      shelves(ctx, 643, 86, 447, 630, random);
      shelves(ctx, 1320, 169, 433, 534, random);
      fill(ctx, 1129, 109, 172, 616, '#35414d');
      line(ctx, 1217, 110, 1217, 724, '#64605d', 4);
      line(ctx, 1130, 304, 1302, 304, '#554d50', 6);
      haze(ctx, 1185, 367, 243, 510, '75,134,132', .25);
      stoneFloor(ctx, 736, ['#4b4947', '#272633']);
      rounded(ctx, 669, 804, 825, 117, 12, '#4d3934');
      poly(ctx, [[698, 819], [668, 974], [618, 965], [639, 815]], '#4e3c34');
      poly(ctx, [[1452, 820], [1499, 962], [1460, 965], [1417, 852]], '#45332f');
      wood(ctx, 630, 777, 898, 56, random, ['#705441', '#5f4437', '#453431']);
      rounded(ctx, 912, 751, 167, 23, 7, '#786d56');
      ctx.beginPath();
      ctx.moveTo(997, 763);
      ctx.bezierCurveTo(987, 591, 1045, 556, 1105, 659);
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#7d6146';
      ctx.stroke();
      poly(ctx, [[1060, 641], [1107, 633], [1185, 704], [1055, 720]], '#936d4d');
      oval(ctx, 1120, 713, 66, 16, '#b39462', -.11);
      haze(ctx, 1141, 743, 287, 200, '246,171,93', .35);
      poly(ctx, [[1232, 800], [1353, 801], [1416, 776], [1292, 774]], '#97816e');
      poly(ctx, [[1231, 795], [1356, 795], [1411, 773], [1290, 768]], '#514d44');
    }

    matte(ctx, createCanvas, seed * 83);
    const sparkles = Array.from({ length: 28 }, () => [random(), random(), random()]);
    const projection = corridor ? corridorLight(createCanvas) : null;
    return (target, input) => {
      const phase = input - Math.floor(input);
      const angle = phase * TAU;
      target.drawImage(plate, 0, 0);
      if (corridor) {
        target.save();
        target.globalAlpha = .77 + .13 * Math.cos(angle - .44);
        target.drawImage(projection, 0, 0);
        target.restore();
      } else {
        if (!attic) {
          const sway = 9 * Math.cos(angle) + 5 * Math.sin(angle * 2);
          const fold = ramp(target, 1129, 217, 1191, 217, [[0, '#2b333b'], [.46, '#4c5157'], [.71, '#3d424e'], [1, '#525761']]);
          target.beginPath();
          target.moveTo(1130, 111);
          target.lineTo(1163, 111);
          target.bezierCurveTo(1168 + sway * .36, 289, 1172 + sway * .8, 479, 1179 + sway, 719);
          target.lineTo(1130, 719);
          target.closePath();
          target.fillStyle = fold;
          target.fill();
          target.beginPath();
          target.moveTo(1159, 121);
          target.bezierCurveTo(1164 + sway * .36, 297, 1168 + sway * .8, 487, 1173 + sway, 713);
          target.strokeStyle = 'rgba(146,155,156,.23)';
          target.lineWidth = 2.1;
          target.stroke();
        }
        for (const [a, b, c] of sparkles) {
          const tide = angle + TAU * b;
          const x = (attic ? 746 : 938) + a * (attic ? 537 : 515) + 47 * c * Math.cos(tide);
          const y = (attic ? 426 : 664) + b * (attic ? 316 : 125) + 18 * Math.sin(tide);
          const shimmer = 'rgba(211,198,161,' + (.12 + .22 * Math.sin(tide) ** 2) + ')';
          oval(target, x, y, .62 + c * 1.84, .54 + c * 1.33, shimmer);
        }
        if (attic) haze(target, 974 + 42 * Math.sin(angle), 773, 203, 80, '179,196,211', .11);
      }
    };
  };
}

register('23', '달빛이 드는 처마 밑 다락', 'attic-moonlit-dormer', 'wind', '기와 지붕 너머를 지나는 바람', roomScene('attic', 464));
register('24', '복도 끝의 둥근 색유리 창', 'rose-glass-at-hall-end', 'wind', '먼 복도를 스치는 미세한 바람', roomScene('corridor', 799));
register('25', '작은 등이 켜진 새벽 독서실', 'reading-room-before-dawn', 'rain-room', '닫힌 독서실 창의 낮은 빗소리', roomScene('study', 591));

module.exports = editions.sort((a, b) => a.id.localeCompare(b.id));
