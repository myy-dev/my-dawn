'use strict';

const shared = require('../lib/paint.cjs');
const W = 1920;
const H = 1080;
const TAU = Math.PI * 2;

function randomFrom(seed) {
  let state = Math.imul(seed, 1597334677) >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function rgba(rgb, alpha) {
  return 'rgba(' + rgb.join(',') + ',' + Math.max(0, Math.min(1, alpha)) + ')';
}

function phaseOf(phase) {
  return phase - Math.floor(phase);
}

function poly(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function line(ctx, x0, y0, x1, y1, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function ellipse(ctx, x, y, rx, ry, color, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
}

function gradient(ctx, y0, y1, stops) {
  const ramp = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [at, color] of stops) ramp.addColorStop(at, color);
  return ramp;
}

function glow(ctx, x, y, radius, rgb, opacity) {
  shared.glow(ctx, x, y, radius, radius, rgb, Math.max(0, Math.min(1, opacity)));
}

const PALETTES = {
  violet: {
    sky: ['#111323', '#303343', '#6c636c'], hills: ['#5a535f', '#494956', '#363947'],
    field: ['#454655', '#242837', '#141b29'], marks: [170, 165, 169], mist: [161, 157, 178],
  },
  straw: {
    sky: ['#111923', '#273743', '#636660'], hills: ['#535a55', '#424c46', '#333e3d'],
    field: ['#4b5146', '#31372b', '#24271f'], marks: [193, 179, 129], mist: [181, 175, 143],
  },
  wet: {
    sky: ['#101b29', '#263746', '#65747a'], hills: ['#4b626b', '#3a4e59', '#303f4b'],
    field: ['#334450', '#26323c', '#17222d'], marks: [143, 181, 187], mist: [125, 178, 191],
  },
  frost: {
    sky: ['#142031', '#2c4154', '#8695a0'], hills: ['#657887', '#526677', '#3e5266'],
    field: ['#8593a0', '#58697a', '#324456'], marks: [216, 224, 223], mist: [184, 203, 220],
  },
  moss: {
    sky: ['#0f1a22', '#283b41', '#829187'], hills: ['#657b70', '#475d55', '#384942'],
    field: ['#54695d', '#344a3e', '#1c2e2a'], marks: [166, 186, 154], mist: [162, 185, 170],
  },
  sepia: {
    sky: ['#172232', '#374656', '#877871'], hills: ['#6c6665', '#565257', '#3e444a'],
    field: ['#625952', '#423f3c', '#242e37'], marks: [187, 160, 136], mist: [184, 163, 157],
  },
  dawn: {
    sky: ['#202839', '#4b5368', '#b88979'], hills: ['#877581', '#65627a', '#4e546a'],
    field: ['#5e6073', '#40495b', '#272f41'], marks: [186, 176, 181], mist: [211, 179, 186],
  },
};

function makeMist(createCanvas, rgb, seed) {
  const mist = createCanvas(640, 100);
  const ctx = mist.getContext('2d');
  const rng = randomFrom(seed);
  ctx.scale(1, .18);
  for (let p = 0; p < 12; p++) {
    glow(ctx, 80 + rng() * 480, 235 + rng() * 90, 80 + rng() * 100, rgb, .045 + rng() * .055);
  }
  return mist;
}

function paintSky(ctx, config, paint, rng) {
  const horizon = config.horizon;
  ctx.fillStyle = gradient(ctx, 0, horizon + 30, [
    [0, paint.sky[0]], [.68, paint.sky[1]], [1, paint.sky[2]],
  ]);
  ctx.fillRect(0, 0, W, H);
  if (config.moon) {
    const [x, y, radius] = config.moon;
    glow(ctx, x, y, radius * 4, [183, 197, 217], .14);
    ellipse(ctx, x, y, radius, radius, '#aebbc4');
    if (config.crescent) {
      ellipse(ctx, x + radius * .41, y - radius * .33, radius * .91, radius * .91, paint.sky[0]);
    } else {
      ellipse(ctx, x - radius * .23, y + radius * .14, radius * .31, radius * .2, '#9dabba', -.34);
    }
  }
  const starCount = config.weather === 'clear' ? 105 : 33;
  for (let n = 0; n < starCount; n++) {
    const x = rng() * W;
    const y = rng() * horizon * .72;
    const size = rng() ** 2 * 1.35 + .42;
    ellipse(ctx, x, y, size, size, rgba([198, 217, 224], .035 + rng() * .29));
  }
  ctx.save();
  ctx.scale(1, .15);
  for (let j = 0; j < 13; j++) {
    const x = -170 + rng() * 2260;
    const y = (horizon * .7 + rng() * horizon * .29) / .15;
    glow(ctx, x, y, 115 + rng() * 360, j % 3 === 1 ? [62, 71, 91] : [161, 154, 162], .035 + rng() * .1);
  }
  ctx.restore();
}

function ridgeAt(x, center, amplitude, phase) {
  return center
    + Math.sin(x * .0024 + phase) * amplitude * .42
    + Math.sin(x * .005 - phase * .53) * amplitude * .17
    + shared.edge(x, Math.round(phase * 977)) * amplitude * .42;
}

function paintLand(ctx, config, paint, rng) {
  const horizon = config.horizon;
  for (let ridge = 0; ridge < 3; ridge++) {
    const nodes = [[0, H]];
    for (let x = 0; x <= W; x += 16) {
      const lift = config.relief ?? 1;
      nodes.push([x, ridgeAt(x, horizon - 11 + 21 * ridge, (64 + 12 * ridge) * lift, config.seed * .41 + ridge * 1.17)]);
    }
    nodes.push([W, H]);
    poly(ctx, nodes, paint.hills[ridge]);
  }
  const top = horizon + 40;
  const outline = [[0, H]];
  for (let x = 0; x <= W; x += 16) {
    outline.push([x, ridgeAt(x, top, 28 * (config.relief ?? 1), config.seed * .31)]);
  }
  outline.push([W, H]);
  const field = gradient(ctx, top - 30, H, [[0, paint.field[0]], [.44, paint.field[1]], [1, paint.field[2]]]);
  poly(ctx, outline, field);
  for (let n = 0; n < 6500; n++) {
    const depth = rng() ** .71;
    const y = top + depth * (H - top);
    const x = rng() * W;
    const length = 1 + rng() * (1.2 + depth * 14);
    const a = rng() * (.025 + depth * .11);
    line(ctx, x, y, x + length, y + rng() * length * .14, rgba(n % 4 === 0 ? paint.marks : [0, 0, 0], a), .35 + depth * 1.2);
  }
  // Distant windbreaks are irregular and stop short of the foreground.
  for (let n = 0; n < 84; n++) {
    const x = rng() * W;
    const y = ridgeAt(x, top + 1, 29 * (config.relief ?? 1), config.seed * .31);
    const height = 3 + rng() ** 2 * (config.sparse ? 13 : 23);
    const width = height * (.21 + rng() * .46);
    poly(ctx, [[x - width, y], [x - width * .31, y - height * .62], [x, y - height], [x + width, y]], paint.hills[2]);
  }
}

function drawRows(ctx, config, paint, rng) {
  const start = config.horizon + 54;
  const pivot = config.vanishing ?? 940;
  const tilt = config.rowTilt ?? 0;
  for (let r = -16; r <= 16; r++) {
    const base = pivot + r * 125 + tilt * 420;
    const crest = pivot + r * 11;
    const dark = [[crest, start], [base - 50, H], [base - 7, H], [crest + 3, start]];
    const glint = [[crest + 3, start], [base - 7, H], [base + 25, H], [crest + 6, start]];
    poly(ctx, dark, config.prop === 'wheat' ? 'rgba(8,12,15,.16)' : 'rgba(8,12,15,.22)');
    poly(ctx, glint, rgba(paint.marks, .045 + rng() * .075));
  }
}

function rollingCropRows(ctx, config, paint, rng) {
  const bend = t => config.vanishing - 460 * Math.sin(t * Math.PI * .61) + 115 * t * t;
  const lineStart = config.horizon + 59;
  for (let root = -21; root < 23; root++) {
    const steps = 21 + Math.floor(rng() * 6);
    const beginning = rng() * .10;
    const side = 3 + rng() * 28;
    const edges = Array.from({ length: steps }, (_, j) => {
      const t = beginning + (1 - beginning) * j / (steps - 1);
      const x = bend(t) + root * (13 + t ** 1.63 * (139 + root * .31));
      const y = lineStart + t * (H - lineStart);
      return [x, y, side * t * t + 3];
    });
    const stripe = edges.map(([x, y, w]) => [x - w, y]);
    for (const [x, y, w] of edges.slice().reverse()) stripe.push([x + w * .85, y]);
    poly(ctx, stripe, 'rgba(13,17,25,' + (.09 + rng() * .20) + ')');
    for (let at = 1; at < edges.length; at++) {
      if (rng() < .32) continue;
      const [x, y, width] = edges[at - 1];
      const [nx, ny, next] = edges[at];
      line(ctx, x + width, y, nx + next, ny, rgba(paint.marks, .04 + rng() * .12), 1.2 + width * .16);
    }
  }
}

function paintFence(ctx, posts, config = {}) {
  const wood = config.wood ?? '#18202a';
  const edge = config.edge ?? '#80919b';
  ctx.lineCap = 'round';
  for (let i = 0; i + 1 < posts.length; i++) {
    const [x, y, size] = posts[i];
    const [nx, ny, next] = posts[i + 1];
    for (const height of [.48, .8]) {
      if (config.broken === i && height < .7) continue;
      ctx.beginPath();
      ctx.moveTo(x, y - size * height);
      ctx.quadraticCurveTo((x + nx) / 2, (y + ny - (size + next) * height) / 2 + 9, nx, ny - next * height);
      ctx.lineWidth = Math.max(1.6, (size + next) * (config.wire ? .014 : .07));
      ctx.strokeStyle = wood;
      ctx.stroke();
    }
  }
  for (const [x, y, size, tilt = 0] of posts) {
    const width = size * .1;
    poly(ctx, [[x - width, y], [x - width * .8 + tilt, y - size], [x + width * .5 + tilt, y - size - 3], [x + width, y]], wood);
    line(ctx, x + tilt - width * .62, y - size + 2, x - width * .82, y - 3, edge, Math.max(1, size * .019));
    if (config.snow) line(ctx, x + tilt - width * .74, y - size - 1, x + tilt + width * .35, y - size - 4, '#8897a4', 2);
  }
  ctx.lineCap = 'butt';
}

function paintTree(ctx, x, y, height, seed, snowy) {
  const rng = randomFrom(seed);
  const bark = snowy ? '#343948' : '#25342e';
  const canopy = snowy ? '#232d38' : '#253f37';
  const trunkWidth = height * .061;
  poly(ctx, [[x - trunkWidth, y], [x - trunkWidth * .31, y - height * .7], [x + trunkWidth * .55, y - height * .88], [x + trunkWidth, y]], bark);
  for (let n = 0; n < 15; n++) {
    const side = n % 2 ? -1 : 1;
    const distance = rng() ** .53;
    const branchY = y - height * (.34 + rng() * .42);
    const tipX = x + side * height * (.09 + distance * .48);
    const tipY = y - height * (.65 + rng() * .44);
    ctx.beginPath();
    ctx.moveTo(x, branchY);
    ctx.quadraticCurveTo(x + (tipX - x) * .49, branchY - height * .12, tipX, tipY);
    ctx.strokeStyle = bark;
    ctx.lineWidth = 1 + height * (.01 + rng() * .026);
    ctx.stroke();
    if (snowy) {
      line(ctx, x + (tipX - x) * .31, branchY - height * .109, tipX, tipY - 1, rgba([161, 176, 183], .31), Math.max(.8, height * .008));
    }
    if (!snowy) {
      for (let leaves = 0; leaves < 4; leaves++) {
        ellipse(ctx, tipX + (rng() - .5) * height * .22, tipY + rng() * height * .15, 3 + height * (.06 + rng() * .1), 3 + height * (.04 + rng() * .07), canopy);
      }
    }
  }
}

function shadow(ctx, x, y, width, height, opacity = .34) {
  ellipse(ctx, x, y, width, height, 'rgba(8,14,20,' + opacity + ')', -.04);
}

function barn(ctx, x, y, scale, option = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  shadow(ctx, 100, 11, 255, 26, .27);
  const dark = option.gray ? '#35444e' : '#422f34';
  const face = option.gray ? '#485660' : '#50383a';
  const bevel = option.gray ? '#72818a' : '#674649';
  const roof = option.snow ? '#8493a0' : '#242a34';
  poly(ctx, [[-240, -157], [28, -157], [28, 0], [-240, 0]], face);
  poly(ctx, [[28, -157], [238, -114], [238, -5], [28, 0]], dark);
  for (let p = -229; p <= 30; p += 12) line(ctx, p, -151, p - 1, -3, bevel, 1.2);
  for (let p = 40; p <= 230; p += 14) line(ctx, p, -155 + (p - 31) * .21, p, -5, 'rgba(6,10,14,.27)', 1.4);
  poly(ctx, [[-276, -149], [-126, -281], [52, -154], [26, -151], [-126, -241], [-246, -145]], roof);
  poly(ctx, [[-126, -281], [71, -241], [263, -111], [52, -154]], option.snow ? '#6a7e8d' : '#343744');
  for (let p = 0; p < 15; p++) {
    line(ctx, -117 + p * 12, -273 + p * 2.05, 55 + p * 13, -158 + p * 2.74,
      option.snow ? 'rgba(210,216,219,.16)' : 'rgba(155,146,149,.14)', 1.1);
  }
  const door = option.door ?? 1;
  ctx.fillStyle = '#192027';
  ctx.fillRect(-173, -128, 102, 128);
  if (door > 0) {
    ctx.fillStyle = gradient(ctx, -128, 0, [[0, '#885c39'], [.72, '#b28451'], [1, '#504539']]);
    ctx.fillRect(-154, -116, door * 72, 116);
    for (let j = 0; j < 6; j++) {
      for (let row = 0; row < 4; row++) {
        if (j * 12 >= door * 70) continue;
        line(ctx, -155 + j * 12, -103 + row * 22, -148 + j * 12, -104 + row * 22, 'rgba(73,47,32,.26)', 1);
      }
    }
  } else {
    line(ctx, -167, -122, -78, -4, '#30414b', 3);
    line(ctx, -78, -122, -167, -4, '#30414b', 3);
  }
  if (option.window) {
    ctx.fillStyle = '#20242e';
    ctx.fillRect(99, -106, 62, 44);
    ctx.fillStyle = '#8d6a45';
    ctx.fillRect(105, -101, 49, 32);
    line(ctx, 130, -99, 132, -69, '#392f31', 2);
    line(ctx, 105, -85, 154, -84, '#392f31', 2);
  }
  ctx.restore();
}

function drawSilo(ctx, x, y, width, height) {
  shadow(ctx, x + 35, y, width * 1.15, 16);
  const roofY = y - height;
  const metal = ctx.createLinearGradient(x - width * .5, 0, x + width * .5, 0);
  metal.addColorStop(0, '#353844');
  metal.addColorStop(.47, '#626470');
  metal.addColorStop(1, '#3c4451');
  ctx.fillStyle = metal;
  ctx.fillRect(x - width * .5, roofY, width, height);
  ellipse(ctx, x, roofY, width * .5, width * .28, '#636779');
  for (let at = roofY + 11; at < y; at += 10) line(ctx, x - width * .46, at, x + width * .47, at + .9, 'rgba(16,24,42,.36)', 1.35);
  line(ctx, x + width * .36, roofY + 9, x + width * .36, y, '#232f3e', 3);
  for (let at = roofY + 35; at < y; at += 29) line(ctx, x + width * .26, at, x + width * .48, at, '#88919d', 1.2);
}

function drawMill(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  shadow(ctx, 0, 11, 132, 22);
  poly(ctx, [[-98, 0], [-64, -221], [68, -221], [101, 0]], '#413f4d');
  poly(ctx, [[53, -221], [68, -221], [101, 0], [78, 0]], '#2f3142');
  for (let z = -205; z < 0; z += 9) line(ctx, -66 + z * .13, z, 79 - z * -.09, z - 2, '#514954', 1.05);
  poly(ctx, [[-82, -213], [-66, -262], [-16, -298], [50, -283], [83, -217]], '#2a2c3b');
  ctx.fillStyle = '#252632';
  ctx.fillRect(-24, -78, 49, 78);
  ctx.fillStyle = '#655647';
  ctx.fillRect(36, -148, 14, 26);
  ctx.restore();
}

function millSails(ctx, x, y, scale, phase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(.33 + phase * Math.PI / 2);
  for (let j = 0; j < 4; j++) {
    ctx.save();
    ctx.rotate(j * Math.PI / 2);
    line(ctx, -3, 10, 2, -200, '#1b2233', 8);
    poly(ctx, [[2, -199], [41, -180], [35, -63], [4, -53]], '#494754');
    for (let p = 0; p < 11; p++) {
      line(ctx, 4, -191 + p * 12, 39 - p * .43, -179 + p * 11, '#66606a', 1.7);
    }
    line(ctx, 22, -188, 22, -61, '#2b2d40', 1.4);
    ctx.restore();
  }
  ellipse(ctx, 0, 0, 12, 12, '#252737');
  ellipse(ctx, 0, 0, 4.6, 4.6, '#666170');
  ctx.restore();
}

function drawTrough(ctx, x, y, width, snow) {
  const lipY = y - (snow ? 69 : 52);
  const rimHeight = width * .102;
  ctx.save();
  ctx.scale(1, .19);
  glow(ctx, x + width * .17, (y + 5) / .19, width * .75, [9, 19, 28], snow ? .39 : .49);
  ctx.restore();
  const side = gradient(ctx, lipY, y + 8, [
    [0, snow ? '#526775' : '#465a63'], [.51, snow ? '#485b68' : '#374853'], [1, '#263b46'],
  ]);
  ctx.beginPath();
  ctx.moveTo(x - width * .57, lipY);
  ctx.bezierCurveTo(x - width * .56, lipY + 29, x - width * .47, y, x - width * .38, y + 3);
  ctx.quadraticCurveTo(x + width * .02, y + 23, x + width * .41, y + 2);
  ctx.quadraticCurveTo(x + width * .52, y - 6, x + width * .58, lipY);
  ctx.closePath();
  ctx.fillStyle = side;
  ctx.fill();
  ellipse(ctx, x, lipY, width * .575, rimHeight, snow ? '#798c98' : '#67777f');
  ellipse(ctx, x - width * .004, lipY - 1, width * .49, rimHeight * .75, '#283b47');
  ctx.beginPath();
  ctx.ellipse(x, lipY + 3, width * .557, rimHeight * .93, 0, .21, Math.PI - .48);
  ctx.strokeStyle = snow ? '#96a7af' : '#6d8889';
  ctx.lineWidth = snow ? 3 : 2.2;
  ctx.stroke();
  for (let j = 0; j < 19; j++) {
    const along = j / 18;
    const xx = x + width * (along - .5) * .83;
    const lowerCurve = Math.sin(Math.PI * along);
    line(ctx, xx, lipY + rimHeight * (.45 + lowerCurve * .6), xx - 3 + along * 8, y - 14 + lowerCurve * 21,
      j % 3 === 0 ? 'rgba(161,185,197,.20)' : 'rgba(15,26,35,.32)', 1.6);
  }
}


function drawStation(ctx, x, y) {
  shadow(ctx, x, y + 10, 195, 23);
  poly(ctx, [[x - 180, y], [x - 180, y - 132], [x + 86, y - 132], [x + 86, y]], '#425764');
  poly(ctx, [[x + 86, y - 132], [x + 162, y - 91], [x + 162, y], [x + 86, y]], '#344853');
  poly(ctx, [[x - 202, y - 132], [x - 134, y - 170], [x + 101, y - 163], [x + 172, y - 88], [x + 87, y - 126]], '#74818c');
  for (let z = 0; z < 27; z++) line(ctx, x - 172 + z * 8.9, y - 129, x - 172 + z * 8.9, y, '#586974', 1.1);
  ctx.fillStyle = '#211f2a';
  ctx.fillRect(x - 125, y - 93, 91, 54);
  ctx.fillStyle = gradient(ctx, y - 90, y - 42, [[0, '#afb18c'], [1, '#786c50']]);
  ctx.fillRect(x - 119, y - 88, 79, 45);
  line(ctx, x - 78, y - 86, x - 78, y - 44, '#554f44', 2.2);
  line(ctx, x - 119, y - 69, x - 40, y - 69, '#554f44', 2.2);
  for (const xx of [x + 281, x + 290]) line(ctx, xx, y + 8, xx + (xx < x + 289 ? 4 : -4), y - 318, '#34434f', 4.3);
  for (let p = 0; p < 12; p++) line(ctx, x + 283, y - p * 25, x + 291, y - p * 25 - 18, '#677986', 1.5);
  line(ctx, x + 253, y - 316, x + 318, y - 316, '#758492', 2.7);
  ellipse(ctx, x + 253, y - 321, 7.1, 4.4, '#919ea9');
  ellipse(ctx, x + 318, y - 320, 7.1, 4.4, '#919ea9');
}

function paintPlow(ctx, x, y, scale, reflect = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (!reflect) shadow(ctx, 0, 10, 249, 27, .43);
  for (const [sx, size] of [[-144, 57], [128, 41]]) {
    ellipse(ctx, sx, 0, size, size * .92, '#1e262d');
    ellipse(ctx, sx, 0, size - 6, (size - 6) * .92, '#606560');
    ellipse(ctx, sx, 0, size - 9, (size - 9) * .92, '#27333b');
    for (let p = 0; p < 12; p++) {
      const angle = p * TAU / 12;
      line(ctx, sx, 0, sx + Math.cos(angle) * (size - 8), Math.sin(angle) * (size - 8) * .92, '#4e5d5e', 1.5);
    }
    ellipse(ctx, sx, 0, 6.5, 6.5, '#857467');
  }
  poly(ctx, [[-217, -45], [-66, -54], [24, -39], [164, -39], [139, -23], [-215, -26]], '#5c4c41');
  poly(ctx, [[-24, -28], [-12, -78], [119, -89], [111, -75], [20, -61], [16, -27]], '#5b514c');
  poly(ctx, [[-83, -30], [-55, 20], [17, 19], [-6, 33], [-71, 34], [-117, -25]], '#48545a');
  line(ctx, -82, -23, -60, 14, '#81919a', 1.6);
  line(ctx, -214, -42, -57, -49, '#827365', 2.2);
  ctx.restore();
}

function stoneWall(ctx, x, y, width, height, rng, tint) {
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, width, height);
  for (let row = 0; row <= height / 37; row++) {
    let stoneX = x - (row % 2) * 42;
    while (stoneX < x + width) {
      const stoneWidth = 54 + rng() * 80;
      const left = Math.max(stoneX, x);
      const right = Math.min(stoneX + stoneWidth, x + width);
      if (right - left < 7) {
        stoneX += stoneWidth;
        continue;
      }
      const top = y + row * 37 + 1;
      const bottom = Math.min(top + 35, y + height);
      if (bottom > top + 3) {
        poly(ctx, [[left, top + 3], [left + 5, top], [right - 5, top + 1], [right, top + 8],
          [right - 3, bottom - 2], [left + 4, bottom]], rgba(rng() < .4 ? [122, 138, 144] : [13, 22, 30], .08 + rng() * .2));
        line(ctx, left + 5, top + 3, right - 5, top + 3, 'rgba(134,153,159,.13)', 1.5);
      }
      stoneX += stoneWidth;
    }
  }
}

function paintGrass(ctx, x, y, height, sweep, rgb, opacity, kind) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + sweep * .38, y - height * .53, x + sweep, y - height);
  ctx.lineWidth = Math.max(.6, height * .016);
  ctx.strokeStyle = rgba(rgb, opacity);
  ctx.stroke();
  if (kind === 'wheat') {
    for (let i = 0; i < 6; i++) {
      const levels = i * height * .026;
      ellipse(ctx, x + sweep * (1 - i * .029) + (i % 2 ? -2 : 2), y - height + levels, 1 + height * .022, 1 + height * .009, rgba(rgb, opacity), i % 2 ? .72 : -.81);
    }
  }
}

function makeGrasses(config, paint, rng, count) {
  const grasses = [];
  for (let j = 0; j < count; j++) {
    const depth = rng() ** .52;
    grasses.push({
      x: rng() * (W + 100) - 50,
      y: config.horizon + 88 + depth * (H - config.horizon - 54),
      height: 9 + depth ** 2 * (22 + rng() * (config.grassHeight ?? 85)),
      sweep: -11 + rng() * 32,
      weight: .13 + depth * .32 * rng(),
      lag: rng() * TAU,
      rgb: j % 5 === 0 ? [30, 41, 36] : paint.marks,
    });
  }
  return grasses;
}

function particles(rng, count, type) {
  return Array.from({ length: count }, () => ({
    x: rng(), y: rng(), depth: rng(),
    opacity: .12 + rng() * .76,
    swing: rng() * TAU,
    laps: type === 'snow' ? (rng() < .75 ? 1 : 2) : 1 + Math.floor(rng() * 3),
  }));
}

function paintWeather(ctx, drops, phase, config) {
  if (config.weather !== 'rain' && config.weather !== 'snow') return;
  const snow = config.weather === 'snow';
  const color = snow ? [216, 228, 235] : [177, 203, 213];
  for (const drop of drops) {
    const yWrap = phaseOf(drop.y + phase * drop.laps);
    const xWrap = phaseOf(drop.x + phase * (snow ? 0 : 1));
    const fade = Math.min(1, yWrap * 12, (1 - yWrap) * 12, xWrap * 18, (1 - xWrap) * 18);
    const y = yWrap * (H + 66) - 28;
    const x = xWrap * (W + 100) - 50 + Math.sin(TAU * phase + drop.swing) * (snow ? 20 : 5);
    const alpha = fade * drop.opacity * (snow ? .52 : .24);
    if (snow) {
      const size = .75 + drop.depth ** 3 * 3.1;
      ellipse(ctx, x, y, size, size * .74, rgba(color, alpha));
    } else {
      const length = 10 + drop.depth * 24;
      line(ctx, x, y, x - length * .12, y - length, rgba(color, alpha), .6 + drop.depth * .9);
    }
  }
}

function rainRings(ctx, rings, phase, config) {
  for (const ring of rings) {
    const age = phaseOf(ring.offset + phase * 4);
    const strength = Math.sin(age * Math.PI) ** 2 * ring.strength;
    ctx.strokeStyle = rgba(config.palette === 'sepia' ? [189, 155, 122] : [172, 195, 210], strength);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(ring.x, ring.y, 3 + age * ring.size, 1 + age * ring.size * .24, 0, 0, TAU);
    ctx.stroke();
  }
}

function paintFog(ctx, sprites, phase) {
  const a = TAU * phase;
  for (const cloud of sprites) {
    ctx.globalAlpha = cloud.opacity;
    ctx.drawImage(cloud.image, cloud.x + Math.sin(a + cloud.shift) * cloud.travel, cloud.y + Math.sin(a * 2 + cloud.shift) * 10, cloud.width, cloud.height);
  }
  ctx.globalAlpha = 1;
}

function vignette(createCanvas) {
  const canvas = createCanvas(480, 270);
  const ctx = canvas.getContext('2d');
  ctx.scale(1, .71);
  const fade = ctx.createRadialGradient(240, 185, 132, 240, 185, 315);
  fade.addColorStop(0, 'rgba(7,10,18,0)');
  fade.addColorStop(1, 'rgba(7,10,18,.31)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, 480, 385);
  return canvas;
}

function smallBales(ctx, x, y, scale, seeds) {
  const rng = randomFrom(seeds);
  const bales = [[x, y, 82], [x + 104 * scale, y + 26 * scale, 62], [x - 126 * scale, y - 14 * scale, 64]];
  for (const [xx, yy, raw] of bales) {
    const height = raw * scale;
    shadow(ctx, xx, yy + 6, height * .76, height * .15, .52);
    const bale = gradient(ctx, yy - height, yy, [[0, '#725944'], [.4, '#5c503b'], [1, '#32353a']]);
    ctx.fillStyle = bale;
    ctx.fillRect(xx - height * .68, yy - height * .75, height * 1.14, height * .72);
    ellipse(ctx, xx + height * .42, yy - height * .42, height * .38, height * .35, '#4c4439');
    for (let h = 0; h < 38; h++) {
      const xy = rng() * height * .85;
      const sy = yy - height * .1 - rng() * height * .64;
      line(ctx, xx - height * .58 + xy, sy, xx - height * .58 + xy + rng() * height * .25, sy - rng() * height * .09, 'rgba(161,134,85,.28)', .8);
    }
    for (const k of [-.4, .18]) line(ctx, xx + height * k, yy - height * .78, xx + height * k - 2, yy - height * .04, '#333039', 2);
  }
}

function littleSettlement(ctx, horizon, x, seed) {
  const rng = randomFrom(seed);
  for (let b = 0; b < 8; b++) {
    const sx = x - 115 + rng() * 330;
    const sy = horizon + 21 + rng() * 25;
    const size = 13 + rng() * 22;
    poly(ctx, [[sx - size, sy], [sx - size, sy - size * .57], [sx, sy - size], [sx + size, sy - size * .57], [sx + size, sy]], '#414353');
    if (b % 3 === 0) {
      glow(ctx, sx - 3, sy - size * .29, 13, [226, 171, 110], .11);
      ctx.fillStyle = '#83706b';
      ctx.fillRect(sx - 4, sy - size * .38, 5, 4);
    }
  }
}

function paintFarm(ctx, config, rng, paint) {
  const y = config.y;
  const x = config.x;
  if (config.prop === 'mill') {
    drawMill(ctx, x, y, config.scale);
    for (let j = 0; j < 15; j++) {
      paintGrass(ctx, x - 143 + rng() * 333, y + 6 + rng() * 40, 8 + rng() * 36, rng() * 12, paint.marks, .24, '');
    }
    paintFence(ctx, [[110, 946, 147, -14], [321, 889, 122, -5], [542, 810, 76, 6], [677, 768, 49], [794, 750, 38]], { wood: '#232831', edge: '#676473', wire: true });
    littleSettlement(ctx, config.horizon, 370, config.seed + 620);
  } else if (config.prop === 'silos') {
    drawSilo(ctx, x - 274, y + 8, 128, 318);
    drawSilo(ctx, x - 119, y + 24, 108, 265);
    barn(ctx, x + 126, y + 31, .8, { gray: true, window: true, door: .08 });
    paintFence(ctx, [[1199, 801, 41], [1356, 827, 57], [1493, 875, 77, -8], [1653, 923, 109, -17], [1857, 1031, 146, 4]], { wood: '#354754', edge: '#74828b', wire: true, broken: 2 });
    for (let b = 0; b < 6; b++) {
      const xx = x + 310 + rng() * 330;
      paintTree(ctx, xx, y - 37 + rng() * 12, 32 + rng() * 56, config.seed + 48 + b, false);
    }
  } else if (config.prop === 'haybarn') {
    barn(ctx, x, y, 1.42, { window: true, door: .88 });
    smallBales(ctx, x + 270, y + 60, 1.12, config.seed + 14);
    smallBales(ctx, x - 349, y - 18, .64, config.seed + 23);
    const lampX = x - 92, lampY = y - 149;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 272, y - 186, 316, 190);
    ctx.clip();
    glow(ctx, lampX, lampY, 81, [223, 167, 109], .27);
    ctx.restore();
    line(ctx, lampX + 13, lampY - 36, lampX + 13, lampY - 20, '#2d2930', 4);
    line(ctx, lampX + 13, lampY - 35, lampX, lampY - 21, '#3d3332', 4);
    poly(ctx, [
      [lampX - 13, lampY - 12], [lampX - 6, lampY - 23], [lampX + 7, lampY - 23],
      [lampX + 14, lampY - 12], [lampX + 11, lampY + 15], [lampX - 10, lampY + 15],
    ], '#2f2d30');
    poly(ctx, [
      [lampX - 8, lampY - 10], [lampX + 9, lampY - 10],
      [lampX + 7, lampY + 11], [lampX - 6, lampY + 11],
    ], gradient(ctx, lampY - 10, lampY + 11, [[0, '#996752'], [.59, '#ddab74'], [1, '#916a52']]));
    line(ctx, lampX, lampY - 9, lampX, lampY + 10, 'rgba(54,47,44,.49)', 1.7);

    const ground = gradient(ctx, y + 15, H, [
      [0, 'rgba(116,91,69,.17)'], [.61, 'rgba(93,80,65,.08)'], [1, 'rgba(93,80,65,0)'],
    ]);
    poly(ctx, [[x - 147, y + 24], [x - 268, H], [x - 593, H], [x - 195, y + 24]], ground);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y + 1, W, H - y);
    ctx.clip();
    ctx.scale(1, .30);
    glow(ctx, x - 154, (y + 75) / .30, 258, [213, 146, 90], .17);
    glow(ctx, x - 209, (y + 118) / .30, 239, [163, 114, 78], .074);
    ctx.restore();
  } else if (config.prop === 'station') {
    const roadway = [[x - 129, y], [x - 19, y], [x - 406, H], [x - 837, H]];
    poly(ctx, roadway, 'rgba(25,42,52,.3)');
    drawStation(ctx, x, y);
    paintFence(ctx, [[566, 819, 70], [643, 782, 57, 9], [723, 757, 36, -3], [769, 737, 26]], { wood: '#384957', edge: '#77919d', wire: true });
    for (let c = 0; c < 34; c++) {
      const px = 980 + rng() * 950;
      const py = 798 + rng() * 290;
      shadow(ctx, px, py, 7 + rng() * 44, 2.2 + rng() * 7, .09 + rng() * .11);
    }
  }
}

function paintWindsock(ctx, x, y, phase) {
  const lag = TAU * phase;
  const top = y - 273;
  const sleeve = [];
  for (let n = 0; n < 12; n++) {
    const at = n / 11;
    const wobble = Math.sin(lag * 2 - at * 3) * at * 13 + Math.sin(lag - at * 4) * at * 5;
    sleeve.push([x + 289 + at * 79, top + wobble + at * 13, 11 - at * 7]);
  }
  const points = sleeve.map(([px, py, w]) => [px, py - w]);
  sleeve.slice().reverse().forEach(([px, py, w]) => points.push([px, py + w]));
  poly(ctx, points, '#8c6b64');
  for (const at of [2, 6, 9]) {
    const [px, py, w] = sleeve[at];
    line(ctx, px - 1, py - w + 1, px + 1, py + w - 1, '#b2a6a0', 4.2);
  }
  line(ctx, x + 287, top - 14, x + 287, top + 13, '#81919e', 2.8);
}

function paintCrop(ctx, config, rng, paint) {
  if (config.prop === 'wheat' || config.prop === 'barley') {
    if (config.prop === 'barley') rollingCropRows(ctx, config, paint, rng);
    else drawRows(ctx, config, paint, rng);
    for (const stalk of makeGrasses(config, paint, rng, config.prop === 'wheat' ? 720 : 470)) {
      paintGrass(ctx, stalk.x, stalk.y, stalk.height * .76, stalk.sweep, stalk.rgb, stalk.weight * .63, config.prop === 'wheat' ? 'wheat' : 'stalk');
    }
    if (config.prop === 'barley') {
      paintFence(ctx, [[1553, 673, 34], [1660, 689, 42], [1783, 712, 49], [1907, 729, 53]], { wood: '#3b4649', wire: true });
    }
  } else if (config.prop === 'potatoes') {
    drawRows(ctx, config, paint, rng);
    for (let j = 0; j < 360; j++) {
      const depth = rng() ** .68;
      const y = config.horizon + 80 + depth * 450;
      const x = rng() * W;
      const lens = 5 + depth * 20;
      ellipse(ctx, x, y, lens, lens * .24, 'rgba(16,28,31,.27)', -.1);
      ellipse(ctx, x + 2, y - lens * .12, lens * .55, lens * .22, rgba([98, 124, 111], .13 + rng() * .31), -.44);
      if (j % 6 === 0) ellipse(ctx, x + 8, y + 6, lens * .62, lens * .12, 'rgba(148,173,176,.24)');
    }
    littleSettlement(ctx, config.horizon - 16, 1110, config.seed + 200);
    smallBales(ctx, 1730, 763, .52, config.seed + 670);
  } else if (config.prop === 'dawn') {
    littleSettlement(ctx, config.horizon, 1322, config.seed + 200);
    const path = [[750, config.horizon + 55], [784, config.horizon + 53], [688, H], [255, H]];
    poly(ctx, path, 'rgba(130,125,133,.25)');
    for (let c = 0; c < 18; c++) {
      const x = 100 + c * 61;
      paintTree(ctx, x + rng() * 23, config.horizon + 40 + c * 1.4, 22 + rng() * 53, config.seed + c + 353, false);
    }
  } else {
    paintFence(ctx, [[-12, 938, 163, -10], [171, 910, 123, 7], [328, 846, 103, -7], [499, 785, 74], [612, 754, 54, -2], [711, 738, 43]], { wood: '#23392f', edge: '#65776b', broken: 0 });
    for (let j = 0; j < 73; j++) {
      const x = 540 + rng() * 1390;
      const y = config.horizon + 82 + rng() ** .84 * 409;
      const width = 7 + rng() * 44;
      shadow(ctx, x, y, width, width * .17, .12 + rng() * .15);
    }
    for (const [x, y, size] of [[1199, 761, 89], [1477, 739, 77]]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(size / 100, size / 100);
      const color = '#25372e';
      ellipse(ctx, -8, -26, 57, 23, color, -.1);
      poly(ctx, [[22, -27], [43, -45], [73, -27], [79, -2], [64, 12], [57, -12]], color);
      line(ctx, -38, -27, -47, 18, color, 6.5);
      line(ctx, 26, -28, 30, 23, color, 7.7);
      line(ctx, 1, -26, -4, 12, color, 6.2);
      line(ctx, -55, -35, -72, -11, color, 3);
      ctx.restore();
    }
  }
}

function paintOrchard(ctx, config, rng, paint) {
  if (config.prop === 'orchard') {
    for (const offset of [-1, 1]) {
      const x = config.vanishing + offset * 18;
      poly(ctx, [[x - 3, 600], [x + 3, 600], [x + offset * 175 + 25, H], [x + offset * 175 - 25, H]],
        'rgba(31,50,67,.15)');
    }
    for (let j = 0; j < 640; j++) {
      const x = rng() * W;
      const y = 644 + rng() * 430;
      const width = (y - 600) * (.012 + rng() * .04);
      ellipse(ctx, x, y, width, Math.max(.5, width * .14), rgba(j % 4 === 0 ? [190, 209, 217] : [28, 51, 64], .10 + rng() * .17), -.05);
    }
    for (let j = 7; j >= 0; j--) {
      const depth = 1 - j / 8;
      const size = 56 + 238 * depth * depth;
      const span = 46 + 572 * depth * depth;
      const base = 595 + 386 * depth ** 1.7;
      for (const side of [-1, 1]) {
        const x = config.vanishing + side * span;
        shadow(ctx, x, base + 8, size * .44, size * .055, .29);
        paintTree(ctx, x, base, size, config.seed + j * 112 + (side + 1) * 42, true);
      }
    }
  } else if (config.prop === 'pole') {
    const drawPole = (x, y, height, color) => {
      poly(ctx, [[x - 9, y], [x - 5, y - height], [x + 5, y - height], [x + 12, y]], color);
      line(ctx, x - 37, y - height + 34, x + 43, y - height + 32, color, 9);
      for (const at of [-29, 0, 31]) ellipse(ctx, x + at, y - height + 25, 4, 6, '#83949f');
    };
    for (const row of [[377, 856, 436], [755, 780, 286], [1036, 735, 183], [1272, 707, 112]]) {
      drawPole(...row, '#334650');
    }
    for (const step of [0, 13]) {
      ctx.beginPath();
      ctx.moveTo(0, 365 + step);
      ctx.quadraticCurveTo(210, 467 + step, 377, 440 + step);
      ctx.quadraticCurveTo(566, 530 + step, 755, 513 + step);
      ctx.quadraticCurveTo(882, 579 + step, 1036, 566 + step);
      ctx.quadraticCurveTo(1168, 615 + step, 1272, 614 + step);
      ctx.lineWidth = 1.7;
      ctx.strokeStyle = '#425668';
      ctx.stroke();
    }
    paintFence(ctx, [[1322, 804, 37], [1477, 829, 46], [1675, 857, 60, 5], [1911, 904, 77, -9]], { snow: true, wire: true, wood: '#48606f' });
  } else {
    ctx.beginPath();
    ctx.moveTo(1131, 635);
    ctx.bezierCurveTo(1118, 701, 1030, 730, 1047, 815);
    ctx.bezierCurveTo(1055, 901, 1171, 994, 1230, H);
    ctx.lineTo(959, H);
    ctx.bezierCurveTo(941, 994, 873, 910, 913, 818);
    ctx.bezierCurveTo(936, 752, 1058, 691, 1124, 635);
    ctx.closePath();
    ctx.fillStyle = gradient(ctx, 635, H, [[0, 'rgba(93,107,99,.08)'], [.56, 'rgba(122,136,127,.26)'], [1, 'rgba(88,103,97,.36)']]);
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(111,127,119,.06)';
    ctx.stroke();
    const foregroundPosts = [[98, 1080, 176, 26], [281, 1028, 191, -27], [461, 998, 164, 8], [663, 951, 163, -13], [791, 891, 112, 19]];
    paintFence(ctx, foregroundPosts, { snow: true, wood: '#28363b', edge: '#839293', broken: 1 });
    for (const [x0, y0, x1, y1] of [[103, 936, 159, 924], [171, 921, 243, 899], [324, 871, 378, 873],
      [468, 865, 517, 861], [527, 860, 575, 847], [654, 818, 703, 813]]) {
      line(ctx, x0, y0, x1, y1, 'rgba(160,182,177,.28)', 2.6);
      line(ctx, x0, y0 - 1.5, x1 - 10, y1 - 1.5, 'rgba(201,215,211,.20)', 1.1);
    }
    paintFence(ctx, [[-19, 880, 116], [193, 840, 84, -7], [349, 795, 62, 6], [527, 761, 44, 4]], { snow: true, edge: '#738383', wood: '#4b5b59', wire: true });
    for (let j = 0; j < 49; j++) {
      const x = rng() * 795;
      const y = 830 + rng() * 242;
      ellipse(ctx, x, y, 3 + rng() * 9, 2 + rng() * 4, 'rgba(169,181,176,.25)', -.1);
    }
  }
}

const plowPools = [[737, 964, 415], [1395, 820, 171], [1722, 1015, 194], [337, 800, 129]];

function reflectPlow(ctx, createCanvas, x, y, scale) {
  const [poolX, poolY, poolWidth] = plowPools[0];
  const poolHeight = poolWidth * .081;
  const left = Math.floor(poolX - poolWidth - 2);
  const top = Math.floor(poolY - poolHeight - 4);
  const image = createCanvas(Math.ceil(2 * poolWidth + 4), Math.ceil(2 * poolHeight + 8));
  const reflection = image.getContext('2d');
  const contact = y + 57 * .92 * scale;
  reflection.save();
  reflection.translate(-left, contact - top);
  reflection.scale(1, -.53);
  paintPlow(reflection, x, y - contact, scale, true);
  reflection.restore();

  reflection.globalCompositeOperation = 'destination-in';
  reflection.fillStyle = gradient(reflection, 0, image.height,
    [[0, 'rgba(0,0,0,.49)'], [.42, 'rgba(0,0,0,.31)'], [1, 'rgba(0,0,0,0)']]);
  reflection.fillRect(0, 0, image.width, image.height);

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(poolX, poolY, poolWidth, poolHeight, -.04, 0, TAU);
  ctx.clip();
  ctx.drawImage(image, left, top);
  ctx.restore();
}

function paintYard(ctx, config, rng, createCanvas) {
  const horizon = config.horizon;
  const wet = config.prop !== 'stable';
  if (wet) {
    ctx.fillStyle = gradient(ctx, horizon, H, [[0, '#34434b'], [.6, '#394650'], [1, '#222e3a']]);
    ctx.fillRect(0, horizon, W, H - horizon);
    const center = config.prop === 'stones' ? 1000 : 500;
    for (let tile = -25; tile <= 25; tile++) {
      const top = center + tile * 6.7;
      const bottom = center + tile * 132;
      line(ctx, top, horizon, bottom, H, 'rgba(13,22,30,.32)', 2);
    }
    for (let row = 1; row < 15; row++) {
      const y = horizon + (row / 15) ** 2 * (H - horizon);
      line(ctx, 0, y, W, y + (config.prop === 'stones' ? .7 : 8), 'rgba(7,20,26,.28)', 1.1 + row * .13);
    }
    for (let n = 0; n < 400; n++) {
      const x = rng() * W;
      const y = horizon + rng() ** .7 * (H - horizon);
      const width = 1.1 + rng() * 14;
      line(ctx, x, y, x + width, y + .3, rgba([161, 173, 179], .03 + rng() * .13), .8);
    }
  }
  if (config.prop === 'stones') {
    stoneWall(ctx, 0, 333, 450, 320, rng, '#384852');
    stoneWall(ctx, 447, 472, 330, 188, rng, '#465561');
    stoneWall(ctx, 1188, 416, 735, 244, rng, '#44525a');
    poly(ctx, [[-35, 345], [475, 328], [481, 356], [359, 365], [-30, 375]], '#2d3a47');
    poly(ctx, [[1158, 425], [1960, 413], [1960, 444], [1188, 449]], '#35424d');
    ctx.fillStyle = '#1f2a34';
    ctx.fillRect(785, 460, 390, 204);
    ctx.beginPath();
    ctx.arc(980, 461, 195, Math.PI, TAU);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(813, 664);
    ctx.lineTo(813, 461);
    ctx.arc(980, 461, 167, Math.PI, TAU);
    ctx.lineTo(1147, 664);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = gradient(ctx, 292, 663, [[0, '#2b3643'], [.64, '#647680'], [1, '#314350']]);
    ctx.fillRect(810, 290, 340, 375);
    poly(ctx, [[810, 559], [943, 491], [1028, 516], [1149, 535], [1149, 663], [810, 665]], '#405260');
    poly(ctx, [[809, 631], [971, 531], [1029, 528], [1147, 663], [809, 663]], '#4d606a');
    poly(ctx, [[897, 663], [983, 536], [1000, 534], [1051, 663]], '#63717a');
    for (const [x, y, h] of [[858, 545, 77], [917, 548, 36], [1092, 549, 56], [1133, 570, 76]]) {
      paintTree(ctx, x, y, h, config.seed + x, false);
    }
    ctx.fillStyle = gradient(ctx, 355, 665, [[0, 'rgba(19,28,39,.35)'], [.53, 'rgba(19,28,39,0)'], [1, 'rgba(20,33,41,.16)']]);
    ctx.fillRect(810, 290, 340, 375);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(980, 461, 167, Math.PI, TAU);
    ctx.strokeStyle = '#556471';
    ctx.lineWidth = 3.4;
    ctx.stroke();
    for (let j = 0; j <= 18; j++) {
      const angle = Math.PI + j * Math.PI / 18;
      const ix = 980 + Math.cos(angle) * 169;
      const iy = 461 + Math.sin(angle) * 169;
      const ox = 980 + Math.cos(angle) * 193;
      const oy = 461 + Math.sin(angle) * 193;
      line(ctx, ix, iy, ox, oy, '#51606b', 1.15);
    }
    line(ctx, 1356, 416, 1356, 469, '#27303b', 5.2);
    glow(ctx, 1356, 473, 191, [226, 171, 111], .16);
    poly(ctx, [[1333, 456], [1379, 456], [1370, 493], [1341, 493]], '#85694d');
    poly(ctx, [[1343, 460], [1369, 460], [1364, 488], [1347, 488]], '#be9662');
    line(ctx, 1355, 460, 1355, 488, '#826040', 2.7);
    ctx.save();
    ctx.scale(1, .3);
    glow(ctx, 1358, 868 / .3, 256, [229, 166, 104], .20);
    ctx.restore();
    drawTrough(ctx, 329, 822, 254, false);
    for (const [x, y, w] of [[601, 836, 191], [1392, 899, 209], [1089, 789, 143], [854, 991, 221]]) {
      ellipse(ctx, x, y, w, w * .088, 'rgba(23,39,49,.37)', -.04);
      line(ctx, x - w * .63, y + 2, x + w * .8, y + 1.3, 'rgba(149,177,190,.17)', 2);
    }
  } else if (config.prop === 'plow') {
    barn(ctx, 1476, 665, 1.08, { gray: true, door: .24, window: true });
    paintFence(ctx, [[0, 713, 75], [181, 679, 54, 11], [368, 650, 44], [542, 639, 32], [689, 627, 27]], { wire: true, wood: '#293a44', edge: '#667a83' });
    for (const [x, y, w] of plowPools) {
      ellipse(ctx, x, y, w, w * .081, 'rgba(120,149,158,.16)', -.04);
      ellipse(ctx, x + 3, y + 8, w * .92, w * .066, 'rgba(12,30,42,.42)', -.045);
      line(ctx, x - w * .7, y + 3, x + w * .74, y + 2, 'rgba(161,179,183,.19)', 2);
    }
    reflectPlow(ctx, createCanvas, 764, 825, 1.61);
    paintPlow(ctx, 764, 825, 1.61);
  } else {
    barn(ctx, 1181, 710, 1.8, { snow: true, gray: true, window: true, door: .40 });
    poly(ctx, [[0, 784], [261, 772], [483, 802], [856, 799], [1138, 777], [1368, 801], [1920, 823], [1920, H], [0, H]],
      gradient(ctx, 782, H, [[0, '#7d8e9b'], [1, '#485e6d']]));
    for (let n = 0; n < 465; n++) {
      const x = rng() * W;
      const y = 800 + rng() * 280;
      line(ctx, x, y, x + 8 * rng(), y + 1, rgba([190, 206, 214], .13 + rng() * .16), .7);
    }
    paintFence(ctx, [[-20, 881, 167], [195, 826, 126, 7], [388, 786, 96], [580, 743, 69]], { snow: true, edge: '#8195a2' });
    drawTrough(ctx, 681, 944, 380, true);
    shadow(ctx, 1137, 818, 83, 8, .2);
  }
}

const entries = [
  { id: '86', title: '안개를 가르는 풍차', slug: 'windmill-through-the-mist', sound: 'wind', soundLabel: '언덕 너머로 부는 밤바람',
    family: 'farm', prop: 'mill', palette: 'violet', weather: 'fog', horizon: 592, relief: 1.45, x: 1360, y: 695, scale: 1.12, drift: 1.5 },
  { id: '87', title: '밀밭에 부는 밤바람', slug: 'night-wind-in-the-wheat', sound: 'grass', soundLabel: '밤바람과 들판의 바스락거림',
    family: 'crop', prop: 'wheat', palette: 'straw', weather: 'clear', horizon: 438, relief: .4, moon: [463, 202, 18], crescent: true, vanishing: 658, grassHeight: 152 },
  { id: '88', title: '잠든 농장의 사일로', slug: 'silos-at-the-sleeping-farm', sound: 'gust', soundLabel: '농장 너머로 지나가는 바람',
    family: 'farm', prop: 'silos', palette: 'wet', weather: 'fog', horizon: 562, relief: .45, x: 733, y: 730, drift: 1.2 },
  { id: '89', title: '전봇대에 내리는 첫눈', slug: 'first-snow-on-the-telephone-poles', sound: 'snow', soundLabel: '눈 내리는 들판의 낮은 바람',
    family: 'orchard', prop: 'pole', palette: 'frost', weather: 'snow', horizon: 620, relief: .32, sparse: true, flakes: 153 },
  { id: '90', title: '사과밭에 내려앉은 서리', slug: 'rime-in-the-apple-orchard', sound: 'snow', soundLabel: '서리 내린 과수원의 밤바람',
    family: 'orchard', prop: 'orchard', palette: 'frost', weather: 'fog', horizon: 532, relief: .66, vanishing: 973, moon: [1536, 219, 22], drift: .9 },
  { id: '91', title: '건초 창고의 등불', slug: 'lamp-in-the-hay-barn', sound: 'gust', soundLabel: '창고 곁을 스치는 바람',
    family: 'farm', prop: 'haybarn', palette: 'sepia', weather: 'clear', horizon: 563, relief: .68, x: 1311, y: 780, drift: .58 },
  { id: '92', title: '안개가 흐르는 목초지', slug: 'drifting-fog-over-the-pasture', sound: 'gust', soundLabel: '목책 사이를 지나는 바람',
    family: 'crop', prop: 'pasture', palette: 'moss', weather: 'fog', horizon: 580, relief: 1, grassHeight: 58, drift: 1.46 },
  { id: '93', title: '보리밭을 지나는 구름 그림자', slug: 'cloud-shadow-on-the-barley', sound: 'grass', soundLabel: '보리 이삭에 스치는 바람',
    family: 'crop', prop: 'barley', palette: 'sepia', weather: 'fog', horizon: 524, relief: 1.65, vanishing: 1340, rowTilt: -.8, grassHeight: 88, drift: 1.2 },
  { id: '94', title: '빗소리만 남은 돌담 마당', slug: 'rain-in-the-stone-courtyard', sound: 'rain-street', soundLabel: '돌바닥과 물통에 떨어지는 빗물',
    family: 'yard', prop: 'stones', palette: 'wet', weather: 'rain', horizon: 661, relief: .4, flakes: 167 },
  { id: '95', title: '소나기 뒤 쟁기 옆 웅덩이', slug: 'puddle-by-a-plow-after-rain', sound: 'rain-street', soundLabel: '고인 물을 두드리는 빗방울',
    family: 'yard', prop: 'plow', palette: 'wet', weather: 'rain', horizon: 641, relief: .69, flakes: 91 },
  { id: '96', title: '눈 내리는 마구간 앞 물통', slug: 'the-stable-trough-in-falling-snow', sound: 'snow', soundLabel: '마구간 앞을 스치는 겨울바람',
    family: 'yard', prop: 'stable', palette: 'frost', weather: 'snow', horizon: 584, relief: .42, flakes: 160 },
  { id: '97', title: '산비탈의 기상관측소', slug: 'weather-station-on-the-slope', sound: 'snow', soundLabel: '관측소 주변의 고른 바람',
    family: 'farm', prop: 'station', palette: 'frost', weather: 'snow', horizon: 563, relief: 1.73, x: 1220, y: 756, flakes: 58, drift: .7 },
  { id: '98', title: '서리 낀 목책과 들풀', slug: 'frosted-fence-and-wild-grass', sound: 'grass', soundLabel: '낡은 목책과 들풀을 스치는 바람',
    family: 'orchard', prop: 'fence', palette: 'moss', weather: 'fog', horizon: 570, relief: .87, moon: [1600, 241, 22], crescent: true, drift: 1.1, grassHeight: 100 },
  { id: '99', title: '비가 그친 감자밭', slug: 'the-potato-field-after-a-shower', sound: 'drips', soundLabel: '고랑 가장자리에서 떨어지는 드문 물방울',
    family: 'crop', prop: 'potatoes', palette: 'dawn', weather: 'clear', horizon: 540, relief: 1.07, vanishing: 1070, rowTilt: .83, drift: .56 },
  { id: '100', title: '시나브로 밝는 들판', slug: 'first-light-over-the-fields', sound: 'wind', soundLabel: '새벽 들판의 고요한 바람',
    family: 'crop', prop: 'dawn', palette: 'dawn', weather: 'fog', horizon: 689, relief: .68, drift: 1.4, grassHeight: 60 },
];

function createLandscape(createCanvas, config) {
  config = { ...config, seed: Number(config.id) };
  const paint = PALETTES[config.palette];
  const rng = randomFrom(config.seed);
  const backdrop = createCanvas(W, H);
  const base = backdrop.getContext('2d');
  paintSky(base, config, paint, rng);
  paintLand(base, config, paint, rng);

  if (config.family === 'farm') paintFarm(base, config, rng, paint);
  else if (config.family === 'crop') paintCrop(base, config, rng, paint);
  else if (config.family === 'orchard') paintOrchard(base, config, rng, paint);
  else paintYard(base, config, rng, createCanvas);
  shared.applyTexture(base, createCanvas, config.seed * 13, .4);

  const cloudCount = config.weather === 'fog' ? 5 : 3;
  const clouds = [];
  for (let cloud = 0; cloud < cloudCount; cloud++) {
    const high = config.prop === 'dawn' && cloud % 2 === 0;
    clouds.push({
      image: makeMist(createCanvas, paint.mist, config.seed * 19 + cloud * 107),
      x: cloud * 508 - 450, y: high ? config.horizon - 253 + 49 * cloud : config.horizon - 62 + 33 * cloud,
      width: 1010 + 145 * (cloud % 3), height: high ? 104 : 155 + cloud * 20,
      travel: (config.drift ?? .68) * (79 + rng() * 108), shift: cloud * 1.73,
      opacity: config.weather === 'fog' ? .58 + rng() * .31 : .27 + rng() * .20,
    });
  }

  const animatedGrass = ['wheat', 'barley', 'fence', 'pasture', 'dawn', 'haybarn'].includes(config.prop);
  const grass = animatedGrass ? makeGrasses(config, paint, rng, config.prop === 'wheat' ? 152 : 93) : [];
  const falling = particles(rng, config.flakes ?? 0, config.weather);
  const rings = [];
  if (config.prop === 'stones' || config.prop === 'plow') {
    const pools = config.prop === 'stones' ? [[601, 836, 150], [1392, 899, 174], [1089, 789, 119], [854, 991, 153]]
      : plowPools.map(([x, y, width]) => [x, y, width * .82]);
    for (let ring = 0; ring < 16; ring++) {
      const [px, py, pw] = pools[ring % pools.length];
      rings.push({ x: px - pw * .72 + rng() * pw * 1.44, y: py + (rng() - .5) * 16, offset: rng(), strength: .09 + rng() * .11, size: 12 + rng() * 35 });
    }
  }
  const moisture = config.prop === 'potatoes' ? Array.from({ length: 32 }, () => {
    const depth = rng() ** .7;
    return {
      x: rng() * W, y: 743 + 328 * depth, len: 4 + rng() * depth * 17, offset: rng() * TAU,
    };
  }) : [];
  const matte = vignette(createCanvas);

  return (ctx, rawPhase) => {
    const phase = phaseOf(rawPhase);
    ctx.drawImage(backdrop, 0, 0);
    if (config.prop === 'mill') millSails(ctx, config.x, config.y - 229 * config.scale, config.scale, phase);
    if (config.prop === 'station') paintWindsock(ctx, config.x, config.y, phase);
    if (config.prop === 'dawn') {
      ctx.save();
      ctx.scale(1, .22);
      const warmth = .075 + Math.sin(TAU * phase - Math.PI / 2) * .039;
      glow(ctx, 1287 + Math.sin(TAU * phase) * 105, (config.horizon - 41) / .22, 510, [234, 156, 124], warmth);
      ctx.restore();
    }
    paintFog(ctx, clouds, phase);
    if (config.prop === 'barley') {
      ctx.save();
      ctx.scale(1, .32);
      glow(ctx, 995 + Math.sin(TAU * phase) * 490, 850 / .32, 648, [11, 17, 26], .22);
      ctx.restore();
    }
    for (const stalk of grass) {
      const sway = Math.sin(TAU * phase + stalk.lag) * stalk.height * .16 + Math.sin(TAU * phase * 2 + stalk.x * .017) * stalk.height * .08;
      paintGrass(ctx, stalk.x, stalk.y, stalk.height, stalk.sweep + sway, stalk.rgb, stalk.weight, config.prop === 'wheat' ? 'wheat' : '');
    }
    for (const { x, y, len, offset } of moisture) {
      const shimmer = (.5 + .5 * Math.sin(TAU * phase * 2 + offset)) ** 3;
      line(ctx, x, y, x + len, y - .5, rgba([145, 173, 181], .14 * shimmer), 1.6);
    }
    rainRings(ctx, rings, phase, config);
    if (config.prop === 'stable') {
      const age = phaseOf(phase * 3);
      const stroke = .14 * Math.sin(age * Math.PI) ** 2;
      ctx.strokeStyle = rgba([180, 202, 218], stroke);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(682, 874, 6 + age * 49, 2 + age * 11, 0, 0, TAU);
      ctx.stroke();
    }
    paintWeather(ctx, falling, phase, config);
    ctx.drawImage(matte, 0, 0, W, H);
  };
}

module.exports = entries.map(config => ({
  id: config.id,
  title: config.title,
  slug: config.slug,
  sound: config.sound,
  soundLabel: config.soundLabel,
  createScene(createCanvas) {
    return createLandscape(createCanvas, config);
  },
}));
