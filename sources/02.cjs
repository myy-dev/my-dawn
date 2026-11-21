const W = 1920;
const H = 1080;
const TAU = Math.PI * 2;
const fract = value => value - Math.floor(value);
const mix = (a, b, t) => a + (b - a) * t;

function randomFrom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function linear(ctx, x0, y0, x1, y1, colors) {
  const fill = ctx.createLinearGradient(x0, y0, x1, y1);
  colors.forEach(([at, color]) => fill.addColorStop(at, color));
  return fill;
}

function path(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}

function shape(ctx, points, fill) {
  path(ctx, points);
  ctx.fillStyle = fill;
  ctx.fill();
}

function stroke(ctx, points, color, width) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function glow(ctx, x, y, rx, ry, rgb, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const fill = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  fill.addColorStop(0, 'rgba(' + rgb + ',' + opacity + ')');
  fill.addColorStop(.27, 'rgba(' + rgb + ',' + opacity * .63 + ')');
  fill.addColorStop(.68, 'rgba(' + rgb + ',' + opacity * .13 + ')');
  fill.addColorStop(1, 'rgba(' + rgb + ',0)');
  ctx.fillStyle = fill;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function wallMap(quad) {
  return (u, v) => {
    const [topLeft, topRight, bottomRight, bottomLeft] = quad;
    const top = [mix(topLeft[0], topRight[0], u), mix(topLeft[1], topRight[1], u)];
    const bottom = [mix(bottomLeft[0], bottomRight[0], u), mix(bottomLeft[1], bottomRight[1], u)];
    return [mix(top[0], bottom[0], v), mix(top[1], bottom[1], v)];
  };
}

function mappedRect(ctx, map, x, y, width, height, fill) {
  shape(ctx, [map(x,y), map(x+width,y), map(x+width,y+height), map(x,y+height)], fill);
}

function roughWall(ctx, map, rng, amount, warm = false) {
  for (let i = 0; i < amount; i++) {
    const x = rng(), y = rng();
    if (i < amount * .33) {
      const width = .013 + rng() * .1;
      const height = .016 + rng() * .1;
      mappedRect(ctx, map, x, y, Math.min(1 - x, width), Math.min(1 - y, height), warm ? 'rgba(149,101,76,.022)' : 'rgba(99,126,139,.022)');
      continue;
    }
    const [px, py] = map(x, y);
    ctx.fillStyle = i % 3 === 0 ? 'rgba(160,163,154,.055)' : 'rgba(5,11,18,.13)';
    ctx.fillRect(px, py, .5 + rng() * 1.8, .5 + rng() * 1.7);
  }
}

function skyAndDistance(ctx, rng) {
  ctx.fillStyle = linear(ctx, 0, 0, 100, 647, [[0, '#101823'], [.64, '#364959'], [1, '#526771']]);
  ctx.fillRect(0, 0, W, H);
  glow(ctx, 1130, 510, 530, 336, '106,136,143', .53);
  for (let index = 0; index < 94; index++) {
    const x = 720 + rng() * 700;
    const y = 92 + rng() * 432;
    glow(ctx, x, y, 88 + rng() * 210, 10 + rng() * 30, '88,113,129', .008 + rng() * .018);
  }
  for (let band = 0; band < 4; band++) {
    let x = 695 + rng() * 89;
    while (x < 1453) {
      const width = 25 + rng() * 46;
      const y = 388 + band * 25 + rng() * (88 - band * 7);
      const level = 68 - band * 9 + Math.floor(rng() * 7);
      const facade = 'rgb(' + (level - 17) + ',' + (level - 3) + ',' + (level + 8) + ')';
      ctx.fillStyle = facade;
      ctx.fillRect(x, y, width, 629 - y);
      ctx.fillStyle = 'rgba(8,17,27,.2)';
      ctx.fillRect(x + width * .78, y, width * .22, 629 - y);
      if (rng() < .54) {
        ctx.fillStyle = facade;
        ctx.fillRect(x + width * .22, y - 3 - rng() * 10, width * .46, 14);
      }
      for (let yy = y + 12; yy < 586; yy += 13) {
        for (let col = 0; col < 3; col++) {
          if (rng() > .20) continue;
          const xx = x + width * ((col + 1) / 4);
          ctx.fillStyle = rng() < .70 ? 'rgba(194,162,126,.22)' : 'rgba(132,169,183,.25)';
          ctx.fillRect(xx, yy, 2 + band * .5, 2.5 + rng() * 1.6);
        }
      }
      x += width + 2 + rng() * 11;
    }
    glow(ctx, 1107, 592, 368, 86, '132,162,169', .23);
  }
}

function wetPavement(ctx, rng) {
  shape(ctx, [[0, 657], [790, 584], [1277, 590], [1920, 695], [1920, 1080], [0,1080]],
    linear(ctx, 0, 585, 0, 1080, [[0, '#3d5059'], [.12, '#343f49'], [.60, '#25303a'], [1, '#171f29']]));
  shape(ctx, [[1143,584],[1303,591],[1836,1080],[394,1080]], linear(ctx, 600,629,630,1080, [[0,'#3b4850'],[.36,'#344653'],[1,'#25313e']]));
  shape(ctx, [[0,805],[1023,597],[1093,599],[353,1080],[0,1080]], linear(ctx, 680,626,200,1020, [[0,'#33454f'],[1,'#1c2029']]));
  shape(ctx, [[1329,600],[1920,774],[1920,1080],[1784,1080]], linear(ctx, 1429,636,1900,1068, [[0,'#33414a'],[1,'#19212a']]));
  glow(ctx, 740, 859, 588, 331, '193,122,73', .31);
  glow(ctx, 410, 974, 326, 197, '192,120,82', .15);
  glow(ctx, 1242, 743, 435, 269, '110,145,158', .24);
  glow(ctx, 1418, 906, 226, 200, '114,152,165', .16);
  glow(ctx, 1045, 629, 280, 88, '156,182,176', .18);
  stroke(ctx, [[1093,599],[972,622],[807,704],[631,791],[353,1080]], 'rgba(121,124,130,.126)', 1.1);
  stroke(ctx, [[1329,600],[1379,665],[1514,797],[1784,1080]], 'rgba(131,140,149,.12)', 1.1);
  for (let i = 0; i < 11200; i++) {
    const y = 603 + rng() ** .8 * 478;
    const x = rng() * W;
    const depth = (y - 600) / 480;
    const width = 1 + rng() * (2 + depth * 8);
    const light = rng() > .52;
    const warm = x < 1100 && rng() > .43;
    ctx.fillStyle = light ? (warm ? 'rgba(190,129,100,.11)' : 'rgba(166,183,188,.09)') : 'rgba(7,12,18,.22)';
    ctx.fillRect(x, y, width, .5 + rng() * (1 + depth));
  }
  for (let j = 0; j < 12; j++) {
    const y = 612 + j ** 1.71 * 3.3;
    if (y > 1080) break;
    const edge = 1082 - (y - 612) * 1.57;
    if (rng() > .28) stroke(ctx, [[0,y+84],[edge - 255,y+33],[edge-47,y+6]], 'rgba(10,15,22,.11)', .7 + (y-612) * .0035);
    if (rng() > .37) stroke(ctx, [[1393 + (y - 600) * .94,y],[1920, y + 83]], 'rgba(10,15,22,.13)', .6 + (y-612) * .003);
  }
  for (let index = 0; index < 31; index++) {
    const t = index / 30;
    const x = 1062 - t * 907;
    const y = 605 + t * t * 346;
    if (rng() > .45) stroke(ctx, [[x,y],[x + 42 + rng() * t * 53,y + 4 + t * 11]], 'rgba(9,15,23,.13)', .8 + t);
  }
}

function poolShape(ctx, pool, scale) {
  const {x, y, rx, ry, seed, skew, tilt} = pool;
  ctx.beginPath();
  for (let point = 0; point < 96; point++) {
    const angle = point * TAU / 96;
    const jag = 1 + Math.sin(angle * 2 + seed) * .13 + Math.sin(angle * 3 + seed * 1.7) * .15
      + Math.sin(angle * 5 + seed) * .065 + Math.sin(angle * 11 + seed) * .036;
    const dx = (Math.cos(angle) * rx * jag + Math.sin(angle) * skew) * scale;
    const dy = (Math.sin(angle) * ry * jag + Math.cos(angle) * tilt) * scale;
    if (point === 0) ctx.moveTo(x + dx, y + dy);
    else ctx.lineTo(x + dx, y + dy);
  }
  ctx.closePath();
}

function paintPools(ctx, rng, pools) {
  for (const pool of pools) {
    const {x, y, rx, ry, color, light, feather} = pool;
    for (let edge = 4; edge >= 0; edge--) {
      poolShape(ctx, pool, 1 + edge * feather);
      ctx.fillStyle = linear(ctx, x, y - ry, x + rx * .21, y + ry, [
        [0, 'rgba(18,26,34,.018)'],
        [.5, 'rgba(21,29,36,.055)'],
        [1, 'rgba(13,19,27,.072)']
      ]);
      ctx.fill();
    }
    ctx.save();
    poolShape(ctx, pool, 1);
    ctx.clip();
    const sourceLight = x + pool.lightOffset;
    glow(ctx, sourceLight, y - ry * .04, rx * .78, ry * 1.18, color, light);
    glow(ctx, sourceLight + rx * .17, y + ry * .23, rx * .37, ry * .24, color, light * .53);
    for (let i = 0; i < 126; i++) {
      const px = x + (rng() - .5) * rx * 2;
      const py = y + (rng() - .5) * ry * 2;
      const width = 2 + rng() * rx * .12;
      const fade = Math.max(0, 1 - Math.abs(px - sourceLight) / (rx * 1.25));
      ctx.fillStyle = 'rgba(' + color + ',' + (.024 + rng() * .105) * fade + ')';
      ctx.fillRect(px, py, width, .6 + rng() * 1.1);
    }
    ctx.restore();
  }
}

function paintShop(ctx, rng) {
  const quad = [[0,-10],[792,396],[792,642],[0,828]];
  const wall = wallMap(quad);
  shape(ctx, quad, linear(ctx, 82,348,823,624, [[0,'#35343a'],[.44,'#34333a'],[1,'#3a4248']]));
  roughWall(ctx, wall, rng, 4300, true);
  for (let j = 0; j < 12; j++) {
    const y = .025 + j * .051;
    stroke(ctx, [wall(0,y),wall(1,y)], 'rgba(9,14,21,.20)', 1 + y);
    stroke(ctx, [wall(0,y+.0027),wall(1,y+.0027)], 'rgba(154,139,126,.10)', .7);
    if (j < 8) continue;
    for (let col = 0; col < 13; col++) {
      const x = (col + (j % 2) * .5) / 13;
      stroke(ctx,[wall(x,y),wall(x,y+.051)],'rgba(11,14,20,.24)',1.2);
    }
  }
  glow(ctx, 267, 640, 326, 264, '205,131,81', .44);
  for (const x of [.025,.109,.183,.699,.729,.974]) {
    mappedRect(ctx, wall, x, 0, .018, 1, 'rgba(12,17,22,.51)');
    stroke(ctx,[wall(x+.019,0),wall(x+.019,1)],'rgba(132,111,103,.25)',1.3);
  }
  mappedRect(ctx, wall, .17, .40, .57, .52, '#24242b');
  mappedRect(ctx, wall, .197, .432, .503, .432, '#776157');
  mappedRect(ctx, wall, .209, .442, .479, .409, '#171c24');
  const glass = wallMap([wall(.225,.464), wall(.676,.464), wall(.676,.816), wall(.225,.816)]);
  const glassQuad = [glass(0,0),glass(1,0),glass(1,1),glass(0,1)];
  ctx.save();
  path(ctx, glassQuad);
  ctx.clip();
  ctx.fillStyle = linear(ctx, 152,450,522,656, [[0,'#403237'],[.34,'#b77a52'],[.68,'#966345'],[1,'#654854']]);
  ctx.fillRect(0,340,700,474);
  glow(ctx, 311,536,216,134, '255,177,103', .54);
  glow(ctx, 404,486,154,92, '255,198,129', .27);
  for (let row = 0; row < 4; row++) {
    const y = .28 + row * .186;
    mappedRect(ctx, glass,.03,y,.946,.029,'rgba(43,32,42,.59)');
    mappedRect(ctx, glass,.03,y-.01,.946,.01,'rgba(246,184,126,.28)');
    for (let col = 0; col < 43; col++) {
      const x = col * .022 + .026;
      const width = .005 + rng() * .015;
      const height = .035 + rng() * .11;
      if (rng() < .12) continue;
      const hue = rng() > .61 ? '#573b47' : rng() > .54 ? '#7f574c' : '#ae7860';
      mappedRect(ctx, glass,x,y-height,width,height,hue);
      stroke(ctx,[glass(x+.001,y-height),glass(x+.001,y)],'rgba(249,187,139,.35)',.8);
    }
  }
  for (const x of [.23,.72]) {
    const [px, py] = glass(x,.17);
    stroke(ctx, [glass(x,.02), [px,py]], '#534244', 1.3);
    glow(ctx, px, py+8, 70, 48, '250,190,127', .38);
    const width = 14 - x * 5;
    shape(ctx, [[px-width,py+9],[px-width*.51,py-8],[px+width*.39,py-8],[px+width,py+9]], '#674643');
    stroke(ctx, [[px-width,py+10],[px+width,py+10]], '#e4aa7d', 2.3);
  }
  for (let i = 0; i < 150; i++) {
    const x = rng(), y = rng();
    const [px, py] = glass(x, y);
    stroke(ctx, [[px,py],[px-1.2,py+1+rng()*20]], 'rgba(224,185,169,.10)', .6 + rng() * .8);
  }
  for (const x of [.325,.65]) {
    mappedRect(ctx, glass,x,0,.024,1,'#44313a');
    stroke(ctx,[glass(x,0),glass(x,1)],'rgba(219,154,104,.62)',1.3);
  }
  mappedRect(ctx,glass,0,.32,1,.025,'#463039');
  stroke(ctx,[glass(0,.31),glass(1,.31)],'rgba(212,151,114,.42)',.9);
  ctx.restore();
  const awning = [[0,303],[621,465],[610,505],[4,378]];
  shape(ctx, awning, linear(ctx,100,318,100,421,[[0,'#253038'],[.68,'#403634'],[1,'#392f36']]));
  for (let j = 0; j < 54; j++) {
    const t = j / 54;
    const a = [621*t,303+162*t];
    const b = [604*t+13,378+127*t];
    stroke(ctx,[a,b], j%4 ? 'rgba(17,20,25,.29)' : 'rgba(137,112,97,.21)', 1.2);
  }
  stroke(ctx,[[0,379],[610,505]],'#1d222b',6);
  stroke(ctx,[[0,374],[610,503]],'rgba(161,115,87,.39)',1.6);
  shape(ctx,[[657,491],[766,519],[766,642],[657,665]], '#222b32');
  shape(ctx,[[671,510],[754,531],[754,631],[671,649]], '#33343a');
  for (let i = 0; i < 27; i++) {
    const q = i / 26;
    stroke(ctx,[[671,mix(510,649,q)],[754,mix(531,631,q)]],'rgba(112,105,103,.135)',1);
  }
  shape(ctx, [[0,806],[763,629],[806,643],[0,854]], linear(ctx,170,781,680,825,[[0,'#403c3e'],[1,'#2a343c']]));
  stroke(ctx, [[0,851],[806,643]],'rgba(124,112,108,.23)',1.7);
}

function paintRightBuildings(ctx, rng) {
  const walls = [
    {points:[[1396,378],[1535,339],[1535,645],[1396,623]], start:'#404b51', end:'#303940'},
    {points:[[1483,324],[1668,234],[1668,689],[1483,651]], start:'#3e4850', end:'#2b333c'},
    {points:[[1613,275],[1768,198],[1768,728],[1613,664]], start:'#38434c', end:'#26303a'},
    {points:[[1757,231],[1920,80],[1920,828],[1757,741]], start:'#333c46', end:'#171f2a'}
  ];
  for (let index = 0; index < walls.length; index++) {
    const wall = walls[index];
    const map = wallMap(wall.points);
    shape(ctx, wall.points, linear(ctx, wall.points[0][0], 410, wall.points[1][0], 580, [[0, wall.start],[1,wall.end]]));
    roughWall(ctx,map,rng,950);
    for (let i = 0; i < 16; i++) {
      const y = i / 16;
      stroke(ctx,[map(0,y),map(1,y)], i % 2 ? 'rgba(166,170,161,.036)' : 'rgba(7,15,23,.19)',1 + index*.33);
    }
    mappedRect(ctx,map,.08,.51,.40,.44,'rgba(9,16,24,.56)');
    mappedRect(ctx,map,.095,.53,.366,.408,'rgba(102,113,117,.15)');
    for (let line = 0; line < 14; line++) {
      const y = .535 + .027 * line;
      stroke(ctx,[map(.097,y),map(.46,y)],'rgba(118,128,134,.17)',.8 + index*.25);
    }
    for (const x of [.13,.56]) {
      mappedRect(ctx,map,x,.175,.24,.225,'rgba(12,23,34,.77)');
      mappedRect(ctx,map,x+.025,.197,.194,.177,'rgba(93,118,129,.31)');
      stroke(ctx,[map(x+.122,.19),map(x+.121,.381)],'rgba(15,23,33,.79)',1.8 + index*.4);
    }
    mappedRect(ctx,map,.0,.49,1,.03,'rgba(11,17,23,.65)');
    mappedRect(ctx,map,.0,.508,1,.009,'rgba(147,151,148,.18)');
    mappedRect(ctx,map,.05,.023,.029,.958,'rgba(13,19,27,.45)');
    stroke(ctx,[map(.076,.03),map(.076,.981)],'rgba(174,179,172,.17)',1 + index * .37);
  }
  shape(ctx, [[1917,731],[1476,645],[1324,599],[1315,608],[1451,659],[1920,812]], '#232d36');
  stroke(ctx, [[1316,608],[1451,661],[1920,813]], 'rgba(150,156,151,.28)', 2.2);
}

function utilityAndStreetlights(ctx) {
  const cables = [
    [0,188,575,256,1097,388,1779,217],
    [0,205,608,316,1169,353,1920,283],
    [85,66,552,359,1240,460,1910,340]
  ];
  for (const [x,y,x1,y1,x2,y2,x3,y3] of cables) {
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.bezierCurveTo(x1,y1,x2,y2,x3,y3);
    ctx.strokeStyle = '#242c36';
    ctx.lineWidth = 2.0;
    ctx.stroke();
  }
  for (const lamp of [
    {x:1340, ground:622, height:121, arm:36, size:.61},
    {x:1512, ground:710, height:237, arm:64, size:1},
    {x:1165, ground:617, height:77, arm:20, size:.36}
  ]) {
    const {x,ground,height,arm,size} = lamp;
    const y = ground-height;
    glow(ctx,x-arm,y+20,125*size,114*size,'171,205,211',.20);
    glow(ctx,x-arm,y+60,104*size,186*size,'168,197,190',.11);
    stroke(ctx,[[x,ground],[x-2*size,y+32]],'#29343d',7*size);
    stroke(ctx,[[x-2*size,ground],[x-4*size,y+32]],'rgba(145,160,161,.49)',1.4*size);
    ctx.beginPath();
    ctx.moveTo(x-2*size,y+34);
    ctx.quadraticCurveTo(x-6*size,y-14,x-arm,y);
    ctx.strokeStyle = '#2d373f';
    ctx.lineWidth = 5*size;
    ctx.stroke();
    shape(ctx, [[x-arm-14*size,y+3*size],[x-arm-8*size,y-4*size],[x-arm+9*size,y-5*size],[x-arm+14*size,y+3*size]], '#46535b');
    stroke(ctx,[[x-arm-12*size,y+4*size],[x-arm+10*size,y+3*size]],'#c2c7bd',2.7*size);
    glow(ctx,x-arm,y+4,38*size,30*size,'197,218,208',.29);
  }
  for (let i = 0; i < 7; i++) {
    const x = 852 + i * 35, y = 591 + (i%3) * 8;
    glow(ctx,x,y,29,16,i%2 ? '183,152,113' : '169,195,195',.17);
    ctx.fillStyle = '#9ca6a2';
    ctx.fillRect(x,y,1.6,1.9);
  }
  for (const [x,y] of [[870,625],[918,616],[960,609],[1008,606],[1401,672]]) {
    stroke(ctx,[[x,y],[x,y-32]],'rgba(25,34,45,.85)',4.2);
    stroke(ctx,[[x-1,y-31],[x+2,y-32]],'rgba(142,157,160,.38)',1.1);
  }
}

function reflect(ctx, phase, ribbons) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineCap = 'round';
  for (const glint of ribbons) {
    const shift = Math.sin(phase * TAU * glint.cycles + glint.offset);
    const pulse = .63 + Math.sin(phase * TAU * glint.cycles + glint.offset * 2) * .26;
    stroke(ctx,[[glint.x + shift * glint.amplitude,glint.y],[glint.x + glint.width + shift * glint.amplitude,glint.y+.4]], 'rgba(' + glint.color + ',' + glint.alpha * pulse + ')',glint.thick);
  }
  ctx.restore();
}

function droplets(ctx,phase,ripples,rain) {
  ctx.save();
  ctx.lineCap = 'round';
  for (const drop of rain) {
    const t = fract(drop.offset + phase * drop.cycles);
    const opacity = Math.sin(Math.PI*t) ** 1.7;
    const x = drop.x - drop.distance*.14*t, y = drop.y + drop.distance*t;
    stroke(ctx,[[x,y],[x+drop.length*.13,y-drop.length]],'rgba('+drop.color+',' + opacity*drop.alpha + ')',drop.width);
  }
  for (const ring of ripples) {
    const t = fract(ring.offset + phase * ring.cycles);
    const lifetime = Math.min(t / .56, 1);
    const opacity = Math.sin(lifetime * Math.PI) ** 1.6;
    const rx = ring.radius * (.14 + lifetime * .86);
    ctx.beginPath();
    ctx.ellipse(ring.x,ring.y+1.1,rx,rx*.18,0,ring.arc+.2,ring.arc+Math.PI*1.57);
    ctx.strokeStyle = 'rgba(11,17,24,' + .30*opacity + ')';
    ctx.lineWidth = ring.width * 1.29;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(ring.x,ring.y,rx,rx*.18,0,ring.arc,ring.arc+Math.PI*1.42);
    ctx.strokeStyle = 'rgba(' + ring.color + ',' + ring.alpha*opacity + ')';
    ctx.lineWidth = ring.width;
    ctx.stroke();
  }
  ctx.restore();
}

module.exports = {
  title: '비에 잠긴 골목의 책방',
  slug: 'bookshop-after-the-rain',
  sound: 'rain-street',
  createScene(createCanvas) {
    const rng = randomFrom(137711);
    const base = createCanvas(W,H);
    const ctx = base.getContext('2d');
    skyAndDistance(ctx,rng);
    wetPavement(ctx,rng);
    const pools = [
      {x:506,y:880,rx:218,ry:35,seed:2.3,skew:57,tilt:-19,color:'216,159,116',light:.22,lightOffset:-20,feather:.035},
      {x:707,y:810,rx:106,ry:13,seed:3.5,skew:12,tilt:-6,color:'198,139,104',light:.12,lightOffset:-4,feather:.04},
      {x:361,y:957,rx:79,ry:15,seed:1.8,skew:-13,tilt:-8,color:'174,122,96',light:.085,lightOffset:17,feather:.05},
      {x:1377,y:843,rx:120,ry:29,seed:.8,skew:10,tilt:9,color:'155,189,198',light:.21,lightOffset:13,feather:.045},
      {x:1549,y:964,rx:185,ry:31,seed:4.7,skew:-47,tilt:14,color:'142,176,189',light:.11,lightOffset:-46,feather:.065},
      {x:1225,y:691,rx:58,ry:8,seed:1.55,skew:5,tilt:2,color:'182,204,199',light:.17,lightOffset:14,feather:.035}
    ];
    paintPools(ctx,rng,pools);
    paintShop(ctx,rng);
    paintRightBuildings(ctx,rng);
    utilityAndStreetlights(ctx);
    glow(ctx,1105,578,300,169,'156,181,181',.13);
    const overlay = createCanvas(W,H);
    const finish = overlay.getContext('2d');
    for (let i = 0; i < 23000; i++) {
      finish.fillStyle = i % 4 ? 'rgba(0,2,8,.15)' : 'rgba(201,211,208,.062)';
      finish.fillRect(rng()*W,rng()*H,.65+rng()*1.4,.5+rng()*1.3);
    }
    const vignette = finish.createRadialGradient(1000,590,280,989,600,1130);
    vignette.addColorStop(0,'rgba(5,8,17,0)');
    vignette.addColorStop(.58,'rgba(5,8,17,.10)');
    vignette.addColorStop(1,'rgba(4,6,15,.52)');
    finish.fillStyle = vignette;
    finish.fillRect(0,0,W,H);
    const ribbons = Array.from({length:210}, (_, index) => {
      const pool = pools[index % pools.length];
      const angle = rng() * TAU;
      const radius = rng() ** .65 * .65;
      const dx = radius * (Math.cos(angle) * pool.rx + Math.sin(angle) * pool.skew);
      const dy = radius * (Math.sin(angle) * pool.ry + Math.cos(angle) * pool.tilt);
      return {
        x:pool.x + dx + pool.lightOffset * .29, y:pool.y + dy,
        width:1 + rng() * (7 + pool.ry * .48), thick:.65 + rng(),
        amplitude:1.2 + rng() * 6, cycles:1 + Math.floor(rng() * 3), offset:rng() * TAU,
        color:pool.color, alpha:(.035 + rng() * .16) * pool.light / .22
      };
    });
    const rain = Array.from({length:137},(_,i) => {
      const cool = i < 77, broad = i < 32;
      const column = broad ? 1100 : cool ? 1421 : 530;
      return {
        x:column+(rng()-.5)*(broad?1230:cool?414:592),y:140+rng()*639,
        distance:126+rng()*279,offset:rng(),cycles:3+Math.floor(rng()*6),
        length:8+rng()*(broad?18:35),alpha:.025+rng()*(broad?.11:.27),
        width:.63+rng()*(broad?.59:1.16),color:cool?'166,193,208':'200,172,159'
      };
    });
    const ripples = [
      {pool:0,dx:-36,dy:-3,radius:31,cycles:4,offset:.0},
      {pool:0,dx:54,dy:4,radius:22,cycles:4,offset:.48},
      {pool:1,dx:13,dy:-1,radius:21,cycles:4,offset:.72},
      {pool:3,dx:8,dy:2,radius:34,cycles:4,offset:.26},
      {pool:4,dx:-26,dy:-4,radius:29,cycles:4,offset:.88}
    ].map(ring => ({
      ...ring, x:pools[ring.pool].x + ring.dx, y:pools[ring.pool].y + ring.dy,
      color:pools[ring.pool].color, alpha:.30, width:1.45, arc:rng() * TAU
    }));
    return (destination, t) => {
      const phase=fract(t);
      destination.drawImage(base,0,0);
      reflect(destination,phase,ribbons);
      droplets(destination,phase,ripples,rain);
      destination.drawImage(overlay,0,0);
    };
  }
};
