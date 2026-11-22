'use strict';

const paint = require('../lib/paint.cjs');

const width = 1920;
const height = 1080;
const tau = Math.PI * 2;
const norm = phase => ((phase % 1) + 1) % 1;

function random(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function polygon(ctx, points, fill) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

function line(ctx, points, stroke, weight = 1) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = stroke;
  ctx.lineWidth = weight;
  ctx.stroke();
}

function gradient(ctx, x0, y0, x1, y1, stops) {
  const fill = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [offset, tone] of stops) fill.addColorStop(offset, tone);
  return fill;
}

function glow(ctx, x, y, rx, ry, rgb, alpha) {
  paint.glow(ctx, x, y, rx, ry, rgb, alpha);
}

// Native-resolution material texture (soft-light) instead of a stretched 480x270 speck film.
function grain(createCanvas, seed) {
  paint.textureTile(createCanvas, seed);
  return { seed };
}

function applyGrain(ctx, layer) {
  paint.applyTexture(ctx, null, layer.seed, .42, 0, 0, width, height, true);
}

function moon(ctx, config) {
  const { x, y, radius, shape = 'full', tint = '165,186,199' } = config;
  glow(ctx, x, y, radius * 6.2, radius * 6.2, tint, 0.105);
  glow(ctx, x, y, radius * 2.6, radius * 2.6, tint, 0.15);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, tau);
  if (shape === 'crescent') {
    ctx.moveTo(x + radius * 1.31, y - radius * 0.36);
    ctx.arc(x + radius * 0.42, y - radius * 0.36, radius * 0.89, 0, tau, true);
    ctx.clip('evenodd');
  } else {
    ctx.clip();
  }
  ctx.fillStyle = gradient(ctx, x - radius, y - radius, x + radius, y + radius, [
    [0, '#cbd7d7'], [0.49, '#aebfc4'], [1, '#859ba8'],
  ]);
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  const rng = random(2406);
  for (let crater = 0; crater < 38; crater++) {
    const cx = x + (rng() - 0.5) * radius * 2;
    const cy = y + (rng() - 0.5) * radius * 2;
    glow(ctx, cx, cy, radius * (0.06 + rng() * 0.19), radius * 0.11, '70,112,145', 0.14);
  }
  ctx.restore();
}

function sky(ctx, config, rng) {
  const { colors, haze, stars = 180, moonData, milky } = config;
  ctx.fillStyle = gradient(ctx, 0, 0, 0, height, [
    [0, colors[0]], [0.47, colors[1]], [1, colors[2]],
  ]);
  ctx.fillRect(0, 0, width, height);
  if (haze) glow(ctx, haze.x, haze.y, haze.w, haze.h, haze.tint, haze.alpha);
  if (milky) {
    for (let index = 0; index < 43; index++) {
      const t = index / 42;
      const x = milky.x + t * milky.dx;
      const y = milky.y + t * milky.dy;
      glow(ctx, x, y, 117 + rng() * 46, 61 + rng() * 34, '148,164,183', 0.016 + rng() * 0.025);
    }
  }
  for (let index = 0; index < stars; index++) {
    const x = rng() * width;
    const y = rng() ** 1.12 * 600;
    const b = (0.14 + rng() ** 2 * 0.59) * (1 - y / 770);
    const size = 0.38 + rng() ** 4 * 1.2;
    ctx.fillStyle = `rgba(215,226,224,${b})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, tau);
    ctx.fill();
  }
  if (milky) {
    for (let i = 0; i < 700; i++) {
      const p = rng();
      const spread = (rng() + rng() - 1) * 155;
      const x = milky.x + p * milky.dx + spread;
      const y = milky.y + p * milky.dy + spread * 0.49;
      ctx.fillStyle = `rgba(196,215,232,${0.095 + rng() * 0.18})`;
      ctx.fillRect(x, y, rng() * 1.1 + 0.38, rng() * 0.95 + 0.4);
    }
  }
  if (config.mode === 'basin') {
    const cluster = [[998,220,2.0],[1061,261,3.1],[1090,228,1.6],[1138,173,2.8],[1205,196,1.7],[1124,306,2.05],[1166,287,1.40]];
    for (const [x,y,r] of cluster) {
      glow(ctx,x,y,r*6,r*6,'181,215,219',0.15);
      ctx.fillStyle = 'rgba(219,225,220,0.75)';
      ctx.beginPath();
      ctx.arc(x,y,r,0,tau);
      ctx.fill();
    }
  }
  if (config.theme === 'silver') {
    for (let i = 0; i < 32; i++) {
      const t = i / 31;
      glow(ctx,345+t*1210,-40+t*588,141+rng()*55,63+rng()*26,'174,211,216',0.039+rng()*0.023);
    }
  }
  if (moonData) moon(ctx, moonData);
}

function cloudMap(createCanvas, seed, tint, thickness) {
  const canvas = createCanvas(720, 155);
  const ctx = canvas.getContext('2d');
  const rng = random(seed);
  for (let i = 0; i < 49; i++) {
    const x = 90 + rng() * 540;
    const y = 82 + Math.sin(x / 152) * 15 + (rng() - 0.5) * 59;
    const weight = Math.sin((x - 55) / 610 * Math.PI);
    glow(ctx, x, y, 48 + rng() * 53, 9 + thickness * rng(), tint, rng() * 0.1 * weight);
  }
  return canvas;
}

function clouds(ctx, map, bands, angle) {
  for (const [x, y, w, h, opacity, drift, offset] of bands) {
    ctx.globalAlpha = Math.min(1, opacity * (0.88 + 0.12 * Math.sin(angle + offset)));
    ctx.drawImage(map, x + Math.sin(angle + offset) * drift, y + 2.7 * Math.sin(angle + offset * 2), w, h);
  }
  ctx.globalAlpha = 1;
}

function meteor(ctx, i, phase, tint) {
  const p = ((phase - i.time + 1) % 1) / i.span;
  if (p >= 1 || p === 0) return;
  const alpha = Math.sin(p * Math.PI) ** 1.75 * .61;
  const x = i.x + p * i.dx;
  const y = i.y + p * i.dy;
  const tail = Math.max(0, p - .49);
  const startX = i.x + tail * i.dx;
  const startY = i.y + tail * i.dy;
  const size = Math.hypot(i.dx, i.dy);
  const px = -i.dy / size * 2.9;
  const py = i.dx / size * 2.9;
  const trace = gradient(ctx, startX, startY, x, y, [
    [0, `rgba(${tint},0)`],
    [.44, `rgba(${tint},${alpha * .34})`],
    [1, `rgba(${tint},${alpha})`],
  ]);
  polygon(ctx, [[startX, startY], [x + px, y + py], [x + 3, y + 2], [x - px, y - py]], trace);
  glow(ctx, x, y, 15, 11, tint, alpha * .09);
}

function ridge(points, seed, jitter = 8, steps = 8) {
  const rng = random(seed);
  return points.flatMap(([x, y], index) => {
    if (index === points.length - 1) return [[x, y]];
    const [right, endY] = points[index + 1];
    return Array.from({ length: steps }, (_, at) => {
      const unit = at / steps;
      rng();
      const px = x + unit * (right - x);
      const wobble = at ? paint.edge(px, seed) * jitter * .9 : 0;
      return [px, y + unit * (endY - y) + wobble];
    });
  });
}

function flank(ctx, points, fill) {
  polygon(ctx, [...points, [width + 5, height], [-5, height]], fill);
}

function addTrack(ctx, path, shade) {
  ctx.beginPath();
  ctx.moveTo(...path[0]);
  ctx.bezierCurveTo(...path[1], ...path[2], ...path[3]);
  ctx.bezierCurveTo(...path[4], ...path[5], ...path[6]);
  ctx.strokeStyle = shade;
  ctx.lineWidth = 2.3;
  ctx.stroke();
}

const dunes = [
  { id: '56', title: '초승달 아래 모래 능선', slug: 'crescent-over-sand-ridges', mode: 'crest', seed: 6303, colors: ['#0c1122','#202537','#69515b'], haze: { x: 1240, y: 561, w:1040,h:230,tint:'160,99,84',alpha:0.27 }, moonData: { x: 1354,y:213,radius:31,shape:'crescent' }, shades:['#4d424d','#473946','#3e313e','#2b2634','#171d2b'], sun: 0.86 },
  { id: '57', title: '별빛이 잠든 모래 분지', slug: 'starlit-sand-basin', mode: 'basin', seed: 6772, colors: ['#0a1826','#183847','#52616b'], haze: {x:913,y:581,w:980,h:220,tint:'136,150,138',alpha:0.17}, milky: {x:-75,y:438,dx:1960,dy:-400}, shades:['#426068','#3d4b54','#38414c','#2b3444','#1d2634'], sun: 0.2 },
  { id: '58', title: '모래 지평선에 스미는 새벽', slug: 'first-light-beyond-the-dunes', mode: 'horizontal', seed: 6228, colors: ['#142135','#40394e','#a37363'], haze: {x:287,y:528,w:931,h:247,tint:'223,125,97',alpha:0.38}, stars: 50, shades:['#6f5860','#584650','#473a49','#312c38','#1d2532'], sun: 0.49 },
];

function duneLayer(ctx, config, rng) {
  const modes = {
    crest: [0.9, 1.7, 2.8, 5.1, 3.4],
    basin: [2.9, 0.22, 1.35, 2.2, 1.7],
    horizontal: [0.88, 1.19, 0.6, 1.55, 0.8],
  };
  const waves = modes[config.mode];
  for (let level = 0; level < 5; level++) {
    const base = (config.mode === 'basin' ? [623,682,774,852,977] : [551,619,712,857,1021])[level];
    const amp = (config.mode === 'horizontal' ? [31,47,75,150,168] : [28,44,79,159,129])[level];
    const f = waves[level];
    const point = x => base + amp * (
      Math.cos(x / width * (1.87 + level * 0.17) + f) * 0.72
      + Math.sin(x / width * 6.2 + f * 1.8) * 0.37
    ) + (config.mode === 'basin' ? (level < 3 ? 98 : 176) * (1 - (2 * x / width - 1) ** 2)
      : config.mode === 'horizontal' && level > 1 ? (x / width - 0.5) * (level * 59) : 0);
    const points = Array.from({ length: 131 }, (_, i) => [i / 130 * width, point(i / 130 * width)]);
    const mid = config.shades[level];
    flank(ctx, points, mid);
    ctx.save();
    ctx.clip();
    const toned = ctx.createLinearGradient(0, base - amp, 0, base + amp * 1.92);
    toned.addColorStop(0, 'rgba(201,164,137,0.19)');
    toned.addColorStop(0.44, 'rgba(110,103,100,0.09)');
    toned.addColorStop(1, 'rgba(2,14,26,0.54)');
    ctx.fillStyle = toned;
    ctx.fillRect(0, base - amp * 1.4, width, height - base + amp * 1.4);
    for (let i = 0; i < 280; i++) {
      const x = rng() * width;
      const yOffset = (rng() ** 1.35) * (50 + level * 44);
      const y = point(x) + yOffset;
      const streak = rng() * (58 + level * 18) + 7;
      const alpha = (0.015 + rng() * 0.07) * (1 - Math.min(yOffset / (120 + level * 74), 0.9));
      line(ctx, [[x,y],[x + streak * 0.51,point(x + streak * 0.51) + yOffset + 1.3],[x + streak,point(x + streak) + yOffset]], `rgba(215,188,165,${alpha})`, 0.55 + level * 0.18);
    }
    glow(ctx, width * config.sun, base - amp * 0.43, 490 + level * 58, amp * 2.4, '207,158,119', 0.06 + level * 0.009);
    ctx.restore();
  }
  if (config.mode === 'basin') {
    // Dry dune grasses silhouette the close ridge and keep the star bowl open.
    for (let i = 0; i < 7; i++) {
      const x = 123 + rng() * 215;
      const y = 987 + rng() * 71;
      const size = 24 + rng() * 51;
      line(ctx, [[x,y],[x+size*0.04,y-size],[x+size*0.22,y-size*1.25]], '#929581', 1.2);
      line(ctx, [[x,y],[x-size*0.13,y-size*0.66],[x-size*0.52,y-size*0.85]], '#748478', 1.18);
      line(ctx, [[x,y],[x+size*0.31,y-size*0.71],[x+size*0.71,y-size*0.73]], '#5e766f', 0.97);
    }
    const leftBowl=ridge([[-4,799],[75,759],[161,749],[213,760],[235,782],[367,831],[407,866],[536,926],[580,1082]],config.seed+87,10);
    polygon(ctx,[...leftBowl,[-4,1083]],gradient(ctx,65,786,318,1080,
      [[0,'rgba(27,39,52,.93)'],[1,'rgba(16,28,40,.21)']]));
  }
  if (config.mode === 'horizontal') {
    const track = [[590,1080],[672,976],[917,920],[1036,888],[1103,879],[1122,850],[1121,833]];
    addTrack(ctx, track, 'rgba(184,152,133,0.18)');
    addTrack(ctx, track.map(([x,y]) => [x+11,y+3]), 'rgba(16,22,31,0.13)');
  }
}

function renderDunes(createCanvas, config) {
  const backdrop = createCanvas(width, height);
  const land = createCanvas(width, height);
  const ctx = backdrop.getContext('2d');
  const rng = random(config.seed);
  sky(ctx, config, rng);
  duneLayer(land.getContext('2d'), config, rng);
  const vapour = cloudMap(createCanvas, config.seed + 21, '172,153,155', 19);
  const grainLayer = grain(createCanvas, config.seed + 3);
  const bands = config.mode === 'crest'
    ? [[22,357,1040,121,0.8,48,2.1],[774,465,1220,85,0.56,23,0.6]]
    : config.mode === 'basin' ? [[-185,432,1210,105,0.72,45,0.6],[835,518,1180,112,0.68,46,2.4]] : [[-257,442,1180,97,0.76,61,0.6],[460,521,1310,63,0.69,43,2.4]];
  return (out, phase) => {
    const angle = norm(phase) * tau;
    out.drawImage(backdrop, 0, 0);
    clouds(out, vapour, bands, angle);
    out.drawImage(land, 0, 0);
    applyGrain(out, grainLayer);
  };
}

function entry(config, renderer, sound = 'wind', soundLabel = '바람이 모래를 스치는 소리') {
  const { id, title, slug, posterPhase } = config;
  return { id, title, slug, sound, soundLabel, ...(posterPhase === undefined ? {} : { posterPhase }), createScene: createCanvas => renderer(createCanvas, config) };
}

module.exports = dunes.map(config => entry(config, renderDunes, 'sand'));

const canyons = [
  {
    id:'59', title:'별이 보이는 사암 협곡', slug:'stars-through-sandstone', seed:61274, theme:'walls',
    colors:['#08101d','#182635','#554452'], strata:'#95776a', faces:['#362f3d','#332934','#201f2d','#1a1e26'],
    haze:{x:1062,y:680,w:588,h:262,tint:'207,122,107',alpha:0.22}, milky:{x:794,y:54,dx:405,dy:716},
    left:[[-3,114],[163,120],[220,176],[450,203],[513,302],[719,367],[752,470],[891,583],[856,731],[958,1000]],
    right:[[1923,4],[1684,17],[1633,110],[1559,106],[1545,245],[1353,333],[1350,481],[1196,565],[1170,654],[1068,1012]],
    ground:[[-5,831],[311,846],[433,810],[774,862],[925,839],[976,799],[1097,805],[1178,832],[1386,821],[1700,850],[1925,824]],
  },
  {
    id:'60', title:'바람이 잠든 돌기둥 평원', slug:'silent-hoodoo-plain', seed:61724, theme:'columns',
    colors:['#101a2e','#3a3550','#a36c66'], strata:'#a0837c', faces:['#48394a','#382f3f','#252638','#242232'],
    haze:{x:1520,y:612,w:830,h:300,tint:'232,150,118',alpha:0.32},
    ground:[[-5,688],[212,705],[384,682],[585,700],[735,678],[968,691],[1247,671],[1438,699],[1552,674],[1817,694],[1925,678]],
    pillars:[[292,468,113,726],[467,521,84,723],[754,389,110,748],[993,558,78,721],[1260,433,138,753],[1530,506,148,721],[1701,595,89,738]],
  },
  {
    id:'61', title:'달빛 한 줄이 닿는 절벽', slug:'moonlight-between-slate-walls', seed:61742, theme:'slot',
    colors:['#080f20','#182c41','#516378'], strata:'#778fac', faces:['#284155','#213345','#141f32','#192c3f'],
    haze:{x:1125,y:667,w:581,h:256,tint:'130,166,195',alpha:0.21},
    moonData:{x:635,y:249,radius:30,shape:'crescent',tint:'156,183,214'},
    left:[[-3,26],[177,106],[264,90],[315,177],[414,243],[460,355],[483,379],[490,514],[532,596],[568,718],[590,1005]],
    right:[[1923,1],[1510,11],[1200,32],[1110,90],[956,88],[873,166],[792,202],[808,235],[765,329],[780,381],[755,509],[708,699],[704,1010]],
    ground:[[-5,829],[349,799],[559,813],[606,803],[674,764],[762,779],[925,741],[1033,749],[1118,762],[1264,776],[1500,809],[1925,795]],
  },
];

function rockWall(ctx, profile, side, config, level, rng) {
  const points = ridge(profile, config.seed + level * 2, level === 0 ? 8 : 13, 9);
  const outer = side < 0 ? -16 : width + 16;
  const face = [...points,[points.at(-1)[0],height+6],[outer,height+6],[outer,points[0][1]]];
  polygon(ctx, face, config.faces[level % config.faces.length]);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = gradient(ctx, side < 0 ? 0 : width, 0, width / 2, 0, [
    [0,'rgba(3,10,21,0.68)'],[0.79,'rgba(19,18,28,0.12)'],[1,'rgba(217,186,160,0.13)'],
  ]);
  ctx.fillRect(0, 0, width, height);
  for (let index = 0; index < 67; index++) {
    const y = index * 16 + rng() * 14;
    const offset = config.theme === 'slot' ? 17 : 32;
    const tip = 40 + rng() ** 0.75 * 380;
    const end = side < 0 ? width * 0.56 : width * 0.44;
    const points = [[outer,y],[outer-side*tip*0.55,y-offset*0.24],[end+side*tip*1.32,y+offset],[end,y+offset*2]];
    ctx.globalAlpha = 0.02 + rng() * (config.theme==='slot' ? 0.065 : level === 0 ? 0.19 : 0.13);
    line(ctx, points, index % 4 ? config.strata : '#020c16', rng() * (index % 6 ? 3.2 : 8.2) + 0.6);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function rockPillar(ctx, config, data, index, rng) {
  const [x,y,r,bottom] = data;
  const lean = (rng() - 0.5) * r * 0.42;
  const points = [
    [x-r*0.22,y+17], [x-r*0.35,y+9], [x-r*0.22,y], [x+r*0.11,y-4],[x+r*0.34,y+8],
    [x+r*0.29,y+23],[x+r*0.14,y+33],[x+r*0.22,y+(bottom-y)*0.5],
    [x+r*0.57,y+(bottom-y)*0.81],[x+r,bottom],[x-r,bottom],[x-r*0.61,y+(bottom-y)*0.79],
    [x-r*0.27+lean,y+(bottom-y)*0.44],[x-r*0.09+lean,y+37],
  ];
  polygon(ctx, ridge([...points, points[0]], config.seed+index, 8, 6), gradient(ctx, x-r,y,x+r,y,[
    [0,config.faces[3]],[0.5,config.faces[index%2]],[1,config.faces[1]],
  ]));
  ctx.save();
  ctx.clip();
  for (let j = 0; j < 28; j++) {
    const sy = y + j / 28 * (bottom-y);
    ctx.globalAlpha = 0.03 + rng() * 0.17;
    line(ctx, [[x-r,sy],[x-r*0.14,sy-4],[x+r,sy+2]], j%3 ? config.strata : '#251b2a', j % 6 ? 1.15 : 3.9);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function canyonGround(ctx, config, rng) {
  const path = ridge(config.ground, config.seed + 81, 13, 16);
  flank(ctx, path, gradient(ctx,0,630,0,height, [[0,config.faces[0]],[1,'#121b26']]));
  if (config.theme === 'columns') {
    for (const [index, data] of config.pillars.entries()) rockPillar(ctx, config, data, index, rng);
    flank(ctx, ridge([[-8,877],[187,896],[491,836],[667,856],[887,841],[1098,869],[1374,822],[1925,858]], config.seed+4,28), config.faces[2]);
  }
  if (config.theme === 'slot') {
    const boulders = [[275,916,134,51],[930,837,53,33],[1163,892,102,38],[1450,913,119,42],[1592,1000,160,60]];
    for (const [x,y,w,h] of boulders) {
      polygon(ctx, [[x-w,y],[x-w*0.48,y-h*0.81],[x+w*0.18,y-h],[x+w*0.52,y-h*0.37],[x+w,y]], '#172837');
      line(ctx, [[x-w*0.75,y-h*0.4],[x-w*0.48,y-h*0.81],[x+w*0.18,y-h],[x+w*0.52,y-h*0.37]], 'rgba(112,151,177,.21)', 1.2);
    }
  }
  for (let j = 0; j < 430; j++) {
    const x = rng() * width;
    const y = 856 + (rng() ** 0.54) * 255;
    const spread = 6 + rng() * 30 * ((y - 740) / 270);
    ctx.globalAlpha = (0.035 + rng() * 0.13) * Math.max(0.09, 1 - Math.abs(x - 966) / 1120);
    line(ctx, [[x,y],[x+spread*0.52,y-1.6],[x+spread,y+0.6]], j%4 ? config.strata : '#061320', 0.4 + rng());
  }
  ctx.globalAlpha = 1;
  if (config.theme === 'walls') {
    const track = [[977,799],[960,840],[1023,874],[985,910],[958,939],[842,1013],[845,1081]];
    addTrack(ctx, track, 'rgba(203,150,124,0.22)');
    addTrack(ctx, track.map(([x,y]) => [x+9,y+2]), 'rgba(16,18,25,0.17)');
  }
}

function renderCanyon(createCanvas, config) {
  const backdrop = createCanvas(width, height);
  const geometry = createCanvas(width, height);
  const rng = random(config.seed);
  sky(backdrop.getContext('2d'), config, rng);
  const rock = geometry.getContext('2d');
  canyonGround(rock, config, rng);
  if (config.left) {
    rockWall(rock, config.left.map(([x,y]) => [x+48,y-27]),-1,config,0,rng);
    rockWall(rock, config.right.map(([x,y]) => [x-49,y-30]),1,config,0,rng);
    rockWall(rock,config.left,-1,config,1,rng);
    rockWall(rock,config.right,1,config,2,rng);
  }
  const vapour = cloudMap(createCanvas, config.seed + 11, config.theme==='slot'?'156,191,211':'188,153,152', 21);
  const grainLayer = grain(createCanvas, config.seed + 78);
  const high = config.theme === 'columns'
    ? [[-70,404,1190,109,0.76,46,1.8],[942,463,1120,100,0.58,19,1.04]]
    : [[406,433,970,106,0.61,59,1.3],[617,583,660,76,0.52,22,2.4]];
  const low = config.theme === 'columns'
    ? [[-48,667,1255,122,0.47,76,2.6],[790,674,1255,99,0.33,54,1.8]]
    : [[697,730,565,115,0.51,28,2.06],[780,781,386,84,0.38,16,0.8]];
  return (out, phase) => {
    const angle = norm(phase) * tau;
    out.drawImage(backdrop,0,0);
    clouds(out,vapour,high,angle);
    out.drawImage(geometry,0,0);
    clouds(out,vapour,low,angle);
    applyGrain(out, grainLayer);
  };
}

const meadows = [
  {
    id:'62', posterPhase:.222, title:'별똥별을 기다리는 고원', slug:'meteor-watch-on-the-plateau',
    seed:65393, theme:'meteor', colors:['#071122','#142336','#44526a'], hills:['#304252','#223447','#192b38'],
    milky:{x:-100,y:262,dx:1810,dy:-180}, haze:{x:1302,y:654,w:811,h:275,tint:'142,155,187',alpha:.16},
    skyline:[[-4,662],[206,600],[363,613],[505,658],[641,658],[813,717],[1032,749],[1205,752],[1440,714],[1694,687],[1924,711]],
    walkers:[{time:.17,span:.102,dx:245,dy:94,x:701,y:241},{time:.66,span:.093,dx:196,dy:76,x:1291,y:145}],
  },
  {id:'63', title:'고원 전망대의 빈 나무 의자', slug:'empty-bench-on-the-highland', seed:64579, theme:'bench', colors:['#111a30','#3c3a58','#b07a6c'], hills:['#404050','#303740','#242e38'], haze:{x:498,y:623,w:791,h:256,tint:'236,156,124',alpha:0.34}, skyline:[[-4,735],[202,746],[399,714],[615,730],[801,721],[1015,714],[1194,695],[1574,764],[1924,725]]},
  {id:'64', title:'은하수 아래 바스락이는 억새', slug:'silver-grass-under-the-milky-way', seed:65056, theme:'silver', colors:['#081420','#142937','#49616c'], hills:['#344d54','#2b424a','#1b333d'], milky:{x:345,y:-40,dx:1210,dy:588}, haze:{x:829,y:624,w:899,h:272,tint:'127,171,187',alpha:0.19}, skyline:[[-4,697],[285,716],[443,729],[623,742],[837,767],[1036,769],[1213,752],[1491,714],[1762,711],[1924,685]]},
];

function grassGroups(ctx, config, rng) {
  const density = config.theme === 'silver' ? 1.1 : 0.64;
  const groups = [];
  for (let index = 0; index < 120; index++) {
    const x = rng() * width;
    const y = (config.theme==='silver' ? 811 : 858) + rng() * 240;
    if (config.theme === 'bench' && x>820 && x<1290 && y<944) continue;
    if (config.theme === 'meteor' && x > 295 && x < 1585 && rng() > 0.6) continue;
    const depth = Math.max(0.3,(y - 832) / 256);
    const edge = config.theme==='silver' ? 1 + 1.97 * (Math.abs(x-width/2)/(width/2)) ** 1.8 : 1;
    const h = (12 + rng() ** 1.95 * 134 * density) * depth * edge;
    const k = rng() * tau;
    const lean = (rng()-0.35) * h * 0.38;
    const light = (config.theme === 'silver' ? 0.24 : 0.19) + depth * 0.20;
    groups.push({x,y,h,k,lean,light});
    for (let tuft = 1; tuft <= 3; tuft++) {
      const offset = lean + (tuft - 2) * h * 0.36;
      const blade = h * (0.28 + rng() * 0.44);
      line(ctx, [[x,y],[x+offset*0.53,y-blade*.63],[x+offset,y-blade]], `rgba(92,125,125,${0.072+depth*0.13})`, 0.8);
    }
  }
  return groups;
}

function drawTallGrass(ctx, groups, angle, tint) {
  for (const { x,y,h,k,lean,light } of groups) {
    const tipX = x + lean + Math.sin(angle + k) * h * 0.16;
    const tipY = y - h + Math.sin(angle + k) * h * 0.025;
    line(ctx, [[x,y],[x+(tipX-x)*0.44, y-h*0.65],[tipX,tipY]], `rgba(${tint},${light*0.63})`, 0.95);
    if (h < 29) continue;
    const size = Math.min(11, h*0.13);
    for (let index = 0; index < 4; index++) {
      const dip = index / 4;
      const dx = (tipX-x)*dip*.20;
      const hy = size*(1-dip*.29);
      const wx = tipX + index%2*2;
      line(ctx, [[wx-dx,tipY+dip*size],[wx+hy*0.37-dx,tipY-hy*0.63+dip*size]], `rgba(${tint},${light*0.72})`, 0.66);
    }
  }
}

function bench(ctx) {
  const left = 930;
  const right = 1095;
  const heightY = 854;
  polygon(ctx, [[left,heightY-47],[right,heightY-47],[right+22,heightY-64],[left+19,heightY-64]], '#544646');
  polygon(ctx, [[left+4,heightY-80],[right+11,heightY-80],[right+14,heightY-69],[left+5,heightY-68]], '#473d44');
  polygon(ctx, [[left+4,heightY-95],[right+12,heightY-94],[right+13,heightY-84],[left+5,heightY-84]], '#56484a');
  line(ctx, [[left+16,heightY],[left+18,heightY-48],[left+16,heightY-98]], '#151e29', 6.4);
  line(ctx, [[right-7,heightY],[right+4,heightY-45],[right+5,heightY-95]], '#171d29', 5.7);
  line(ctx, [[left+13,heightY-60],[right+17,heightY-60]], 'rgba(183,148,124,.24)', 1.5);
  line(ctx, [[left+7,heightY-94],[right+11,heightY-93]], 'rgba(188,153,148,.27)', 0.95);
}

function renderMeadow(createCanvas, config) {
  const backdrop = createCanvas(width,height);
  const landscape = createCanvas(width,height);
  const rng = random(config.seed);
  sky(backdrop.getContext('2d'), config, rng);
  const ctx = landscape.getContext('2d');
  const far = ridge(config.skyline, config.seed+14, 25, 11);
  flank(ctx,far, config.hills[0]);
  flank(ctx, ridge(config.skyline.map(([x,y]) => [x,y+63+(Math.sin(x/388)*39)]),config.seed+42,9), config.hills[1]);
  const ground = [[-6,862],[267,846],[405,859],[629,872],[859,851],[1130,854],[1301,875],[1519,865],[1925,839]];
  flank(ctx, ridge(ground, config.seed+872,8),gradient(ctx,0,843,0,1080,[[0,config.hills[2]],[1,'#121f29']]));
  for (let detail = 0; detail < 360; detail++) {
    const x = rng() * width;
    const y = 881 + rng() * 211;
    const breadth = rng() * 37 + 4;
    line(ctx, [[x,y],[x+breadth*0.41,y-0.5],[x+breadth,y+1]], `rgba(116,145,135,${0.02+rng()*0.089})`, rng()*1.2+0.5);
  }
  if (config.theme === 'bench') bench(ctx);
  const grass = grassGroups(ctx,config,rng);
  const vapour=cloudMap(createCanvas,config.seed+542,'158,177,185',15);
  const bands = config.theme === 'meteor'
    ? [[-333,501,1610,120,0.66,54,1],[934,483,1200,104,0.46,31,2.5]]
    : [[-303,477,1530,116,0.68,57,0.2],[1087,547,1150,111,0.62,44,2.4]];
  const grainLayer = grain(createCanvas, config.seed+82);
  return (out, phase) => {
    const p = norm(phase);
    const angle = p * tau;
    out.drawImage(backdrop,0,0);
    if (config.walkers) config.walkers.forEach(i => meteor(out,i,p,'205,223,226'));
    clouds(out,vapour,bands,angle);
    out.drawImage(landscape,0,0);
    drawTallGrass(out,grass,angle,config.theme==='silver'?'162,179,176':'107,144,145');
    applyGrain(out, grainLayer);
  };
}

module.exports.push(
  ...canyons.map(config => entry(config, renderCanyon, 'gust',
    config.theme === 'columns' ? '돌기둥 사이를 스치는 바람 소리' : '절벽 사이를 지나는 바람 소리')),
  ...meadows.map(config => entry(config, renderMeadow, 'grass', '풀잎을 스치고 지나는 바람 소리')),
);

const mountains = [
  {id:'65',title:'구름 바다 위 어두운 산등성이',slug:'high-ridge-above-the-cloud-sea',seed:65302, theme:'sea', colors:['#0f1830','#38405e','#a67a7a'], haze:{x:1503,y:563,w:951,h:309,tint:'230,158,128',alpha:0.33}, shades:['#3d485d','#313b50','#232b3e'], silhouette:[[-6,651],[165,632],[383,542],[480,554],[596,634],[754,687],[945,693],[1254,742],[1926,789]], summit:[[-9,443],[88,382],[176,398],[309,315],[384,350],[503,495],[562,481],[739,589],[1924,724]], cloudsTint:'153,180,201'},
  {id:'66',title:'새벽빛이 감도는 산 너머',slug:'indigo-peaks-meet-first-light',seed:66867,theme:'first',colors:['#10182b','#384059','#9b6967'], haze:{x:659,y:625,w:934,h:366,tint:'221,133,106',alpha:0.36}, shades:['#5f5367','#464054','#303344'], stars:72, silhouette:[[-6,745],[215,722],[398,712],[497,680],[558,695],[766,653],[921,674],[1064,631],[1303,557],[1437,580],[1561,537],[1740,655],[1926,592]], summit:[[-9,528],[155,579],[239,496],[383,507],[468,429],[595,404],[659,489],[812,521],[884,517],[978,615],[1924,624]], cloudsTint:'205,155,156'},
  {id:'67',title:'산마루 텐트 너머의 별',slug:'small-tent-under-highland-stars',seed:67712,theme:'camp',colors:['#081522','#192938','#4b5867'], milky:{x:265,y:5,dx:1458,dy:474}, haze:{x:1488,y:647,w:898,h:273,tint:'125,169,184',alpha:0.22}, shades:['#3c515e','#31404d','#24343f'], silhouette:[[-6,808],[176,754],[304,700],[417,706],[558,676],[766,715],[922,777],[1046,793],[1304,873],[1536,861],[1717,813],[1926,801]], summit:[[-9,594],[159,634],[239,565],[393,536],[478,442],[594,494],[700,480],[834,567],[999,546],[1138,625],[1382,643],[1571,575],[1715,603],[1924,545]], cloudsTint:'151,180,191'},
];

function mountainFace(ctx, config, rng) {
  const mount = ridge(config.summit,config.seed+123,24,13);
  flank(ctx,mount,gradient(ctx,0,382,0,855,[[0,config.shades[0]],[0.59,config.shades[1]],[1,'#222c3c']]));
  ctx.save();
  ctx.clip();
  for (let index = 1; index < config.summit.length - 1; index++) {
    const [x,y] = config.summit[index];
    if (x > width || y > 660) continue;
    const spread = 64 + rng()*120;
    const fold = 142+rng()*170;
    const trail = [[x,y],[x+spread*1.06,y+fold*0.34],[x+spread*0.62,y+fold*0.52],[x+spread*1.61,y+fold],[x+spread*0.63,y+fold*0.81],[x+spread*0.18,y+fold*0.58]];
    const alpha = 0.063 + rng()*0.12;
    polygon(ctx,ridge([...trail,trail[0]],config.seed+index*33,20,7),`rgba(7,15,31,${alpha})`);
    if (index % 2 || y < 490) {
      polyLight(ctx,x,y,spread,fold,config,seedRgb(config.theme));
    }
  }
  for (let i = 0; i < 160; i++) {
    const x = rng()*width;
    const y = 350+rng()*441;
    const begin = 9 + rng()*46;
    line(ctx,[[x,y],[x+begin,y+begin*0.73],[x+begin*1.42,y+begin*0.7]],`rgba(215,223,230,${0.008+rng()*0.038})`,0.4+rng());
  }
  ctx.restore();
}

function seedRgb(theme) {
  return theme === 'first' ? '215,178,187' : '184,203,216';
}

function polyLight(ctx,x,y,spread,fold,config,tint) {
  const points=[[x,y],[x-spread*0.28,y+fold*0.28],[x-spread*0.61,y+fold*0.43],[x-spread*0.54,y+fold*0.46],[x-spread*0.91,y+fold*.70],[x-spread*0.22,y+fold*0.45],[x-spread*0.02,y+fold*0.51],[x-spread*0.08,y+fold*.33],[x+spread*0.11,y+fold*0.12]];
  polygon(ctx,ridge([...points,points[0]],config.seed+Math.round(x),12,6),`rgba(${tint},0.16)`);
}

function rockDetail(ctx, rng, low, dark) {
  for (let i=0; i<365;i++) {
    const x=rng()*width;
    const y=low+rng()*(height-low);
    const length=4+rng()*37;
    const alpha=0.021+rng()*0.14;
    line(ctx, [[x,y],[x+length*.57,y-length*.22],[x+length,y-length*.17]],dark? `rgba(173,182,183,${alpha})`:`rgba(162,179,195,${alpha})`,0.44+rng()*1.41);
  }
}

function tent(ctx) {
  const silhouette=[[298,888],[394,792],[439,804],[530,870],[472,893],[350,903]];
  polygon(ctx,silhouette,'#342d2d');
  polygon(ctx,[[394,792],[439,804],[530,870],[471,895]],'#493b35');
  polygon(ctx,[[296,888],[394,792],[472,895]],gradient(ctx,385,801,391,880,[[0,'#4e413d'],[1,'#634941']]));
  polygon(ctx,[[367,886],[395,838],[440,890]],'#201f2c');
  line(ctx,[[296,888],[394,792],[472,895]],'rgba(210,155,103,.29)',1.4);
  line(ctx,[[305,894],[273,926]],'rgba(183,167,149,.28)',1.25);
  line(ctx,[[486,883],[566,913]],'rgba(174,158,141,.27)',1.25);
  polygon(ctx,[[386,890],[405,872],[434,892]],'#624438');
}

function renderMountain(createCanvas,config) {
  const backdrop=createCanvas(width,height);
  const mid=createCanvas(width,height);
  const front=createCanvas(width,height);
  const rng=random(config.seed);
  sky(backdrop.getContext('2d'),config,rng);
  const mountainsCtx=mid.getContext('2d');
  mountainFace(mountainsCtx,config,rng);
  const foreground=front.getContext('2d');
  const ridgeLine=ridge(config.silhouette,config.seed+89,25,12);
  flank(foreground,ridgeLine,gradient(foreground,0,590,0,height,[[0,config.shades[2]],[0.68,'#212933'],[1,'#131f2b']]));
  foreground.save();
  foreground.clip();
  rockDetail(foreground,rng,657,config.theme==='camp');
  foreground.restore();
  if (config.theme==='camp') tent(foreground);
  const vapour=cloudMap(createCanvas,config.seed+91,config.cloudsTint,25);
  const cloudSea = config.theme === 'sea';
  const bank = cloudSea ? cloudMap(createCanvas, config.seed+341, '174,194,218', 34) : null;
  const wisps = cloudSea ? cloudMap(createCanvas, config.seed+512, '159,182,205', 19) : null;
  const grainLayer=grain(createCanvas,config.seed+82);
  const veil=config.theme==='sea'
    ? [[-98,616,1376,189,1.17,81,0.6],[751,639,1477,165,1.05,55,2.12],[851,687,1165,124,0.71,34,3.56]]
    : config.theme==='first'
      ? [[-303,628,1660,128,.93,53,1.2],[787,657,1250,105,.7,51,2.9]]
      : [[648,610,1500,152,.72,66,1.45],[-242,658,1440,102,.62,36,3.2]];
  return (out,phase)=>{
    const angle=norm(phase)*tau;
    out.drawImage(backdrop,0,0);
    clouds(out,vapour,[[-311,476,1430,129,0.49,43,2.12],[951,542,1160,111,0.53,36,1.8]],angle);
    out.drawImage(mid,0,0);
    clouds(out,vapour,veil,angle);
    if (cloudSea) {
      // Broad low cloud across the valley, with irregular wisps above and below the shelf.
      glow(out, 1191 + 30 * Math.sin(angle + .45), 649, 766, 102, '157,179,207', .25);
      glow(out, 1603 + 29 * Math.sin(angle + 1.53), 696, 575, 77, '174,195,217', .21);
      clouds(out, bank, [
        [160, 565, 1510, 156, .92, 65, 2.76],
        [652, 594, 1450, 187, 1.1, 52, .9],
        [1029, 651, 1330, 138, .92, 44, 1.9],
      ], angle);
      clouds(out, wisps, [
        [487, 610, 1090, 96, .84, 56, 3.46],
        [1049, 629, 1187, 111, .74, 74, .23],
      ], angle);
    }
    out.drawImage(front,0,0);
    if (cloudSea) {
      clouds(out, wisps, [
        [464, 754, 1366, 123, .44, 68, 2.3],
        [1009, 799, 1160, 137, .40, 53, .73],
      ], angle);
    }
    if(config.theme==='camp') glow(out,413,882,106,50,'218,151,100',(0.35+0.05*Math.sin(angle))*0.39);
    applyGrain(out, grainLayer);
  };
}

const icefields = [
  {id:'68',title:'달 아래 빙하의 푸른 단면',slug:'blue-glacier-wall-in-moonlight',seed:68611,theme:'glacier',colors:['#0a1423','#20364b','#526e81'], haze:{x:989,y:631,w:1100,h:291,tint:'130,168,190',alpha:0.19}, moonData:{x:1316,y:205,radius:38}, contours:['#465e76','#324e65','#24384c'], profile:[[-5,589],[180,573],[282,610],[475,560],[596,557],[739,601],[864,562],[1012,570],[1120,613],[1260,571],[1454,603],[1534,552],[1645,552],[1786,576],[1925,563]]},
  {id:'69',title:'얼어붙은 호수의 달빛 균열',slug:'moonlit-cracks-on-frozen-water',seed:69384,theme:'cracks',colors:['#090f20','#183748','#596d7a'], haze:{x:1041,y:613,w:1070,h:276,tint:'150,178,181',alpha:0.18}, moonData:{x:756,y:274,radius:48,tint:'164,202,217'}, contours:['#3f5c6c','#2f4b5a','#233b4c'], profile:[[-5,711],[172,669],[227,677],[355,645],[441,656],[590,604],[683,639],[849,666],[917,651],[1098,676],[1196,669],[1309,707],[1478,685],[1645,646],[1789,659],[1925,625]]},
  {id:'70',title:'서리가 스치는 설원 언덕',slug:'drift-frost-over-snow-hollows',seed:70426,theme:'splay',colors:['#10182b','#253548','#756879'], haze:{x:1341,y:603,w:970,h:369,tint:'176,144,163',alpha:0.27}, contours:['#586775','#445364','#2d4051'], moonData:{x:371,y:267,radius:21,shape:'crescent'}, profile:[[-5,672],[112,615],[260,615],[452,676],[665,680],[864,662],[1024,612],[1226,658],[1387,626],[1583,676],[1743,638],[1924,652]]},
];

function glacier(ctx,config,rng) {
  const front = ridge(config.profile,config.seed+11,15,16);
  const wall = [...front,[1924,875],[1670,901],[1546,871],[1428,907],[1277,855],[1094,893],[931,869],[767,875],[554,870],[428,889],[121,869],[-6,883]];
  polygon(ctx,wall,gradient(ctx,0,555,0,907,[[0,'#698497'],[0.18,'#46637e'],[0.62,'#37566d'],[1,'#253e56']]));
  ctx.save();
  ctx.clip();
  for(let i=0;i<145;i++) {
    const x=rng()*width;
    const y=544+rng()*108;
    const depth=113+rng()*280;
    const lean=(rng()-0.36)*144;
    const offset=2+rng()*7;
    const points=[[x,y],[x+lean*.45,y+depth*.32],[x+lean*.27,y+depth*.6],[x+lean,y+depth]];
    line(ctx,points,`rgba(13,31,47,${0.04+rng()*0.35})`,0.6+offset*.44);
    line(ctx,points.map(([x1,y1])=>[x1+offset,y1]),`rgba(178,223,232,${0.037+rng()*0.18})`,0.55+rng()*1.42);
  }
  for(const [x,y] of config.profile) {
    if(x<0 || x>width) continue;
    glow(ctx,x,y+95,79+rng()*59,137+rng()*47,'117,175,205',0.16);
  }
  ctx.restore();
  line(ctx,front,'rgba(181,208,219,.18)',1.3);
}

function lakeCracks(ctx, config, rng) {
  const farBreaks = [
    [[-8,841],[216,817],[328,840],[489,812],[657,805],[782,784],[938,795]],
    [[1166,801],[1288,787],[1413,808],[1554,787],[1638,793],[1774,782],[1925,763]],
    [[168,997],[351,939],[420,951],[625,907],[699,917],[874,878]],
  ];
  for (const [index, nodes] of farBreaks.entries()) {
    const broken = ridge(nodes, config.seed + index * 7, 4, 10);
    line(ctx, broken, 'rgba(15,31,43,.42)', 1.35 + index * .68);
    line(ctx, broken.map(([x,y]) => [x,y + 1.4]), 'rgba(131,177,194,.25)', 1.15);
  }

  const fracture = [[891,778],[927,798],[920,814],[984,842],[1007,870],[1070,883],[1065,907],[1154,943],[1174,982],[1265,997],[1334,1030],[1447,1060],[1480,1085]];
  const forks = [
    [[986,844],[1052,832],[1091,847],[1153,834],[1219,841],[1284,820]],
    [[1066,906],[1015,922],[955,920],[914,940],[899,968],[844,1000]],
    [[1174,982],[1241,964],[1317,971],[1358,950],[1406,951],[1448,926],[1502,918]],
    [[1335,1030],[1312,1050],[1292,1064],[1280,1088]],
  ];
  for (const [index, points] of [fracture, ...forks].entries()) {
    const edges = points.map(([x, y], i) => {
      const t = i / (points.length - 1);
      const thickness = index === 0
        ? 1.3 + 8.2 * t * t + (i ? rng() * 3.2 : 0)
        : 5.3 * (1 - t) ** 1.3 + .55;
      return [x, y, thickness];
    });
    const upper = edges.map(([x, y, t]) => [x + t * .42, y - t * .75]);
    const lower = edges.map(([x, y, t]) => [x - t * .37, y + t]);
    polygon(ctx, [...upper, ...lower.slice().reverse()], gradient(ctx, 0, 760, 0, 1080, [
      [0, 'rgba(22,42,56,.57)'], [.54, 'rgba(13,31,49,.77)'], [1, 'rgba(9,24,39,.9)'],
    ]));
    line(ctx, upper, 'rgba(103,146,167,.47)', index === 0 ? 2.0 : 1.15);
    line(ctx, lower, 'rgba(168,202,214,.55)', index === 0 ? 1.8 : .98);
  }

  glow(ctx, config.moonData.x, 834, 277, 123, '156,199,218', .23);
  for (let i = 0; i < 20; i++) {
    const y = 747 + rng() ** .85 * 213;
    const spread = 39 + (y - 747) * .63;
    const x = config.moonData.x + (rng() - .5) * spread * 2;
    const length = 6 + rng() * spread * .27;
    const alpha = .045 + rng() * .17;
    line(ctx, [[x, y], [x + length, y + .3]], `rgba(175,209,220,${alpha})`, .62 + rng() * 1.3);
  }
}

function snowbank(ctx,config,rng) {
  for(let index=0;index<4;index++) {
    const phase=[1.9,2.4,.85,1.66][index];
    const base=746+index*104;
    const amplitude=25+index*21;
    const y=x=>base+Math.sin(x/width*tau+phase)*amplitude+Math.sin(x/width*9.8-phase)*amplitude*.37;
    const profile=Array.from({length:103},(_,i)=>[i*19,y(i*19)]);
    flank(ctx,profile,gradient(ctx,0,base-40,0,base+190,[
      [0,config.contours[Math.min(index,2)]],[0.62,'#344558'],[1,'#22313f'],
    ]));
    ctx.save();
    ctx.clip();
    for(let j=0;j<95;j++){
      const x=rng()*width;
      const distance=9+rng()*236;
      const span=19+rng()*104;
      line(ctx,[[x,y(x)+distance],[x+span*.57,y(x+span*.57)+distance+1],[x+span,y(x+span)+distance]],`rgba(178,191,207,${0.025+rng()*0.115})`,0.5+rng()*1.1);
    }
    ctx.restore();
    line(ctx,profile,'rgba(179,192,211,.17)',1.4);
  }
}

function renderIce(createCanvas,config) {
  const backdrop=createCanvas(width,height);
  const ground=createCanvas(width,height);
  const rng=random(config.seed);
  sky(backdrop.getContext('2d'),config,rng);
  const ctx=ground.getContext('2d');
  flank(ctx,ridge(config.profile,config.seed+138,11,9),gradient(ctx,0,620,0,1080,[
    [0,config.contours[0]],[0.29,config.contours[1]],[1,config.contours[2]],
  ]));
  if(config.theme==='glacier') glacier(ctx,config,rng);
  if(config.theme==='cracks') lakeCracks(ctx,config,rng);
  if(config.theme==='splay') snowbank(ctx,config,rng);
  if(config.theme==='glacier') {
    ctx.save();
    ctx.clip();
    rockDetail(ctx,rng,902,false);
    ctx.restore();
  }
  const vapour=cloudMap(createCanvas,config.seed+186,'148,189,217',23);
  const specks=Array.from({length:64},()=>{
    const x=rng()*width;
    const y=(config.theme==='glacier'?899:725)+rng()*198;
    return [x,y,5+rng()*19,rng()*tau,.034+rng()*.089];
  });
  const grainLayer=grain(createCanvas,config.seed+627);
  return (out,phase)=>{
    const a=norm(phase)*tau;
    out.drawImage(backdrop,0,0);
    clouds(out,vapour,[[-210,411,1110,98,.59,23,1.4],[856,478,1311,92,.48,36,2.75]],a);
    out.drawImage(ground,0,0);
    const heightY=config.theme==='glacier'?816:config.theme==='cracks'?727:694;
    clouds(out,vapour,[[-219,heightY,1530,154,.95,69,.76],[965,heightY+42,1320,112,.69,41,2.12]],a);
    for(const [x,y,v,k,alpha] of specks){
      const offset=Math.sin(a+k)*v;
      const dip=Math.sin(a*2+k)*3;
      line(out,[[x+offset*0.83,y+dip],[x+offset+v*.36,y+dip+1]],`rgba(180,216,226,${alpha*(0.58+0.42*Math.sin(a+k))})`,0.9);
    }
    applyGrain(out, grainLayer);
  };
}

module.exports.push(
  ...mountains.map(config=>entry(config,renderMountain,'wind','산등성이를 스치는 잔잔한 바람 소리')),
  ...icefields.map(config=>entry(config,renderIce,'snow','얼음과 눈 위로 스치는 바람 소리')),
);
