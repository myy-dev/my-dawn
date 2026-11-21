const TAU = Math.PI * 2;
const fract = value => value - Math.floor(value);

function randomFrom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function linear(ctx, x0, y0, x1, y1, stops) {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  return gradient;
}

function glow(ctx, x, y, rx, ry, rgb, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, 'rgba(' + rgb + ',' + opacity + ')');
  gradient.addColorStop(0.38, 'rgba(' + rgb + ',' + opacity * .45 + ')');
  gradient.addColorStop(1, 'rgba(' + rgb + ',0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function polygon(ctx, points, fill) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function paintView(ctx, rng) {
  ctx.fillStyle = linear(ctx, 0, 56, 0, 830, [[0, '#101c30'], [.54, '#253a4d'], [1, '#233445']]);
  ctx.fillRect(0, 0, 1920, 900);
  glow(ctx, 1480, 485, 860, 470, '135,169,188', .17);
  glow(ctx, 900, 180, 770, 300, '48,72,113', .31);
  for (let band = 0; band < 5; band++) {
    const baseline = 930 + band * 2;
    const averageWidth = 43 + band * 19;
    let x = 315;
    while (x < 1850) {
      const width = averageWidth * (.62 + rng() * .85);
      const rise = (1 - rng() ** 2) * (365 + band * 73);
      const y = baseline - rise;
      const blue = 59 - band * 7 + Math.round(rng() * 10);
      const facade = 'rgb(' + (blue - 19) + ',' + (blue - 8) + ',' + blue + ')';
      ctx.fillStyle = facade;
      ctx.fillRect(x, y, width, rise);
      if (rng() < .38) {
        ctx.fillRect(x + width * .14, y - 7 - rng() * 20, width * (.38 + rng() * .34), 25);
      }
      ctx.fillStyle = 'rgba(8,15,29,.18)';
      ctx.fillRect(x + width * .72, y, width * .28, rise);
      const columns = width > 75 ? 4 : 3;
      for (let yy = y + 15; yy < 840; yy += 15 + band * 3) {
        for (let j = 0; j < columns; j++) {
          const xx = x + (j + .5) * width / columns;
          const choice = rng();
          const warm = rng() > .34;
          if (choice > .17) continue;
          const color = warm ? '239,184,126' : '130,193,211';
          const level = (.16 + rng() * .33) * (.56 + band * .095);
          if (choice < .037) glow(ctx, xx, yy, 16 + band * 2, 13 + band * 2, color, level * .43);
          ctx.fillStyle = 'rgba(' + color + ',' + level + ')';
          ctx.fillRect(xx - (2 + band * .37), yy, 4 + band * .74, 1.8 + band * .66);
        }
      }
      x += width + rng() * 18;
    }
    glow(ctx, 1170, 734, 1230, 170, '122,157,175', .12);
  }
  ctx.fillStyle = linear(ctx, 0, 127, 0, 801, [[0, 'rgba(8,18,38,.10)'], [1, 'rgba(55,75,88,.15)']]);
  ctx.fillRect(200, 110, 1620, 720);
}

function paintLamp(ctx) {
  ctx.strokeStyle = '#19161b';
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(213, 781);
  ctx.bezierCurveTo(198, 600, 182, 382, 201, 280);
  ctx.bezierCurveTo(211, 226, 257, 218, 300, 239);
  ctx.stroke();
  ctx.strokeStyle = '#5b4640';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(209, 769);
  ctx.bezierCurveTo(191, 581, 181, 373, 199, 283);
  ctx.bezierCurveTo(215, 227, 253, 224, 292, 238);
  ctx.stroke();
  glow(ctx, 292, 376, 354, 340, '255,157,75', .24);
  ctx.fillStyle = linear(ctx, 220, 305, 315, 305, [[0, '#725149'], [.42, '#a16f55'], [1, '#4d3437']]);
  ctx.beginPath();
  ctx.moveTo(214, 347);
  ctx.bezierCurveTo(213, 282, 235, 240, 274, 239);
  ctx.bezierCurveTo(329, 232, 361, 287, 386, 329);
  ctx.bezierCurveTo(353, 350, 271, 373, 214, 347);
  ctx.fill();
  ctx.fillStyle = '#a96749';
  ctx.beginPath();
  ctx.ellipse(300, 342, 87, 21, -.12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = linear(ctx, 0, 325, 0, 370, [[0, '#c27b55'], [.61, '#f1b880'], [1, '#b07554']]);
  ctx.beginPath();
  ctx.ellipse(301, 342, 77, 14, -.12, 0, TAU);
  ctx.fill();
  glow(ctx, 304, 343, 92, 44, '255,177,94', .37);
  ctx.fillStyle = '#2c2227';
  ctx.beginPath();
  ctx.ellipse(214, 776, 92, 15, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(218,153,101,.34)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(214, 775, 86, 12, 0, Math.PI * 1.02, Math.PI * 1.84);
  ctx.stroke();
}

function paintDesk(ctx, rng) {
  polygon(ctx, [[0, 793], [1652, 787], [1920, 853], [1920, 1080], [0, 1080]], linear(ctx, 0, 796, 0, 1080, [[0, '#423036'], [.29, '#2b252e'], [1, '#121721']]));
  glow(ctx, 312, 781, 690, 380, '195,110,57', .34);
  glow(ctx, 1190, 842, 1020, 231, '55,84,106', .22);
  const grainColors = ['rgba(235,155,106,.035)', 'rgba(10,12,22,.15)', 'rgba(144,100,90,.057)'];
  for (let i = 0; i < 890; i++) {
    const y = 802 + rng() * 278;
    const x = rng() * 1919;
    const slope = (x - 950) * (y - 795) * .000052;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + slope + (rng() - .5) * 25, y + 1.3, x + slope * 2 + 55 + rng() * 106, y + 1.5 + rng() * 3);
    ctx.strokeStyle = grainColors[i % grainColors.length];
    ctx.lineWidth = .45 + rng() * .9;
    ctx.stroke();
  }
  glow(ctx, 864, 921, 314, 128, '233,143,83', .12);
  glow(ctx, 991, 938, 229, 69, '7,10,17', .38);
  polygon(ctx, [[799, 915], [1013, 872], [1189, 924], [959, 985]], '#181a23');
  polygon(ctx, [[804, 909], [1013, 868], [1186, 920], [956, 979]], '#94766b');
  polygon(ctx, [[810, 903], [1011, 865], [1180, 914], [955, 968]], linear(ctx, 851, 885, 1100, 964, [[0, '#886457'], [.42, '#71564e'], [1, '#493a41']]));
  polygon(ctx, [[810, 904], [955, 968], [954, 977], [808, 912]], linear(ctx, 809, 904, 956, 973, [[0, '#b0917b'], [1, '#635353']]));
  polygon(ctx, [[955, 968], [1180, 914], [1184, 921], [956, 977]], '#867065');
  for (let row = 0; row < 4; row++) {
    ctx.beginPath();
    ctx.moveTo(812, 905 + row * 1.8);
    ctx.lineTo(955, 969 + row * 1.8);
    ctx.lineTo(1178 + row, 916 + row * 1.4);
    ctx.strokeStyle = row % 2 ? 'rgba(38,31,35,.49)' : 'rgba(204,164,130,.26)';
    ctx.lineWidth = .75;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(826, 905);
  ctx.lineTo(954, 960);
  ctx.lineTo(1164, 914);
  ctx.lineTo(1013, 872);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(235,187,147,.27)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(810, 903);
  ctx.lineTo(1011, 865);
  ctx.lineTo(1180, 914);
  ctx.lineTo(955, 968);
  ctx.closePath();
  ctx.clip();
  glow(ctx, 866, 895, 220, 101, '232,145,82', .15);
  for (let speck = 0; speck < 1300; speck++) {
    ctx.fillStyle = speck % 4 ? 'rgba(38,27,32,.12)' : 'rgba(201,160,125,.10)';
    ctx.fillRect(805 + rng() * 386, 861 + rng() * 114, .55 + rng() * 1.4, .55 + rng() * .95);
  }
  ctx.restore();
  ctx.lineCap = 'round';
  const pen = linear(ctx, 1169, 969, 1167, 962, [[0,'#20232c'],[.69,'#65504d'],[1,'#9f7764']]);
  ctx.strokeStyle = 'rgba(8,11,18,.68)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(1157, 970);
  ctx.lineTo(1265, 937);
  ctx.stroke();
  ctx.strokeStyle = pen;
  ctx.lineWidth = 5.7;
  ctx.beginPath();
  ctx.moveTo(1158, 965);
  ctx.lineTo(1261, 933);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(225,157,112,.67)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(1159, 963);
  ctx.lineTo(1173, 959);
  ctx.moveTo(1245, 936);
  ctx.lineTo(1259, 932);
  ctx.stroke();
  polygon(ctx, [[1157, 963], [1158, 968], [1149, 968]], '#a87f6c');
  ctx.lineCap = 'butt';
  glow(ctx, 629, 887, 206, 35, '4,8,15', .88);
  ctx.fillStyle = linear(ctx, 520, 847, 520, 908, [[0, '#a17e6c'], [.47, '#594649'], [1, '#2c2b33']]);
  ctx.beginPath();
  ctx.ellipse(620, 879, 111, 24, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(220,164,120,.53)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(620, 874, 104, 20, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#7c594f';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.ellipse(684, 831, 31, 22, -.25, -1.44, 1.63);
  ctx.stroke();
  ctx.strokeStyle = '#ae7a62';
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.ellipse(684, 831, 33, 24, -.25, -1.48, .82);
  ctx.stroke();
  ctx.fillStyle = linear(ctx, 546, 840, 687, 846, [[0, '#7b5248'], [.23, '#bc8e70'], [.41, '#a87860'], [.77, '#725454'], [1, '#41353f']]);
  ctx.beginPath();
  ctx.moveTo(548, 807);
  ctx.bezierCurveTo(550, 838, 559, 877, 579, 884);
  ctx.bezierCurveTo(598, 891, 635, 891, 656, 882);
  ctx.bezierCurveTo(673, 874, 687, 835, 686, 809);
  ctx.fill();
  ctx.fillStyle = '#d7a37d';
  ctx.beginPath();
  ctx.ellipse(617, 808, 70, 20, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = linear(ctx, 564, 819, 643, 797, [[0, '#875744'], [1, '#332731']]);
  ctx.beginPath();
  ctx.ellipse(617, 809, 64, 15.5, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(235,162,103,.40)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(615, 810, 53, 11.5, 0, 2.9, 4.72);
  ctx.stroke();
  for (let index = 0; index < 170; index++) {
    const x = 554 + rng() * 126;
    const y = 827 + rng() * 64;
    if (((x - 617) / 63) ** 2 + ((y - 847) / 42) ** 2 > 1) continue;
    ctx.fillStyle = index % 3 === 0 ? 'rgba(243,173,128,.15)' : 'rgba(28,26,34,.21)';
    ctx.fillRect(x, y, .5 + rng() * 1.1, .65 + rng() * .85);
  }
}

function paintRoom(ctx, rng) {
  ctx.fillStyle = linear(ctx, 0, 0, 670, 660, [[0, '#131721'], [.47, '#2d232a'], [1, '#161c29']]);
  ctx.fillRect(0, 0, 489, 824);
  glow(ctx, 258, 490, 295, 525, '141,80,57', .29);
  for (let i = 0; i < 35; i++) {
    const x = 430 - i ** 1.32 * 4.3;
    if (x < -20) break;
    const width = 18 + i * 1.5;
    ctx.fillStyle = linear(ctx, x - width, 0, x + width, 0, [[0, 'rgba(9,12,24,0)'], [.5, 'rgba(10,11,21,.15)'], [.83, 'rgba(106,64,59,.09)'], [1, 'rgba(45,28,36,0)']]);
    ctx.beginPath();
    ctx.moveTo(x - width, 0);
    ctx.bezierCurveTo(x - width * .6, 265, x - width * 1.44, 503, x - width * .92, 769);
    ctx.lineTo(x + width * 1.15, 760);
    ctx.bezierCurveTo(x + width * .31, 525, x + width * .8, 266, x + width, 0);
    ctx.closePath();
    ctx.fill();
  }
  for (const x of [470, 937, 1382, 1829]) {
    ctx.fillStyle = linear(ctx, x, 0, x + 30, 0, [[0, '#3a3540'], [.16, '#2d2b35'], [.63, '#181d29'], [1, '#111a28']]);
    ctx.fillRect(x, 22, 30, 770);
    ctx.fillStyle = 'rgba(8,13,23,.37)';
    ctx.fillRect(x + 29, 38, 11, 738);
  }
  ctx.fillStyle = linear(ctx, 0, 57, 0, 107, [[0, '#171d2a'], [.78, '#292935'], [1, '#3a3540']]);
  ctx.fillRect(465, 43, 1420, 52);
  ctx.fillStyle = '#111723';
  ctx.fillRect(467, 96, 1412, 6);
  ctx.fillStyle = linear(ctx, 1861, 0, 1920, 0, [[0, '#171c29'], [1, '#111520']]);
  ctx.fillRect(1860, 0, 60, 863);
  ctx.fillStyle = linear(ctx, 0, 758, 0, 813, [[0, '#111722'], [.40, '#254257'], [.46, '#4b5360'], [.61, '#24252f'], [1, '#151925']]);
  ctx.fillRect(460, 759, 1400, 55);
  paintDesk(ctx, rng);
  paintLamp(ctx);
}

function rainOnGlass(ctx, drops, phase) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(505, 105, 430, 654);
  ctx.rect(975, 105, 406, 654);
  ctx.rect(1422, 105, 403, 654);
  ctx.clip();
  for (const drop of drops) {
    const t = fract(drop.offset + phase * drop.cycles);
    const visibility = Math.sin(t * Math.PI) ** 1.8;
    const x = drop.x + t * drop.drift + Math.sin(t * TAU) * drop.sway;
    const y = drop.y + (t * .36 + t * t * .64) * drop.span;
    ctx.beginPath();
    ctx.moveTo(x - drop.drift * .06, y - drop.length);
    ctx.quadraticCurveTo(x - drop.sway, y - drop.length * .45, x, y);
    ctx.lineWidth = drop.width;
    ctx.strokeStyle = 'rgba(177,202,229,' + drop.alpha * visibility + ')';
    ctx.stroke();
    if (drop.width <= 1.32) continue;
    ctx.fillStyle = 'rgba(213,230,244,' + drop.alpha * visibility * 1.25 + ')';
    ctx.beginPath();
    ctx.ellipse(x - .8, y, drop.width * .41, drop.width * .66, -.14, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function largeDrops(ctx, drops, phase) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(505, 105, 430, 654);
  ctx.rect(975, 105, 406, 654);
  ctx.rect(1422, 105, 403, 654);
  ctx.clip();
  ctx.lineCap = 'round';
  for (const drop of drops) {
    const t = fract(drop.offset + phase * drop.cycles);
    const fade = Math.sin(t * Math.PI) ** 1.42;
    const y = drop.y + (t * .56 + t * t * .44) * drop.span;
    const x = drop.x + t * drop.drift + Math.sin(t * TAU * 1.4) * 4.6;
    const tail = drop.length * (.53 + Math.sin(t * Math.PI) * .62);
    const color = x < 825 ? '209,193,189' : '177,203,228';
    const tip = fade * drop.alpha;
    const trail = linear(ctx, x, y - tail, x, y, [[0,'rgba('+color+',0)'],[.48,'rgba('+color+','+tip*.18+')'],[1,'rgba('+color+','+tip*.88+')']]);
    const trailPath = (offset = 0) => {
      ctx.beginPath();
      ctx.moveTo(x + drop.sway + offset, y - tail);
      ctx.bezierCurveTo(x + drop.sway * .09 + offset, y - tail * .59, x - drop.sway * .41 + offset, y - tail * .22, x + offset, y);
    };
    trailPath(1.15);
    ctx.strokeStyle = 'rgba(10,19,39,' + fade * .25 + ')';
    ctx.lineWidth = drop.width * 1.57;
    ctx.stroke();
    trailPath();
    ctx.strokeStyle = trail;
    ctx.lineWidth = drop.width;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y, drop.width * .68, drop.width * .95, -.19, 0, TAU);
    ctx.fillStyle = 'rgba(14,24,41,' + tip * .68 + ')';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - .48, y + .54, drop.width * .35, drop.width * .43, -.15, 0, TAU);
    ctx.fillStyle = 'rgba(230,223,224,' + tip * 1.32 + ')';
    ctx.fill();
  }
  ctx.restore();
}

function steam(ctx, phase, plume) {
  const mouthX = 617;
  const mouthY = 808;
  const breath = Math.sin(phase * TAU * 2);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .13 + breath * .025;
  ctx.drawImage(plume, mouthX - 18, mouthY - 22, 36, 28);
  for (let index = 0; index < 12; index++) {
    const age = fract(phase * 4 + index / 12);
    const rise = 8 + age * 122;
    const lean = age * (7 + 12 * Math.sin(age * 5 + phase * TAU * 2));
    const x = mouthX + lean;
    const y = mouthY - rise;
    const spread = 15 + age * age * 56;
    const visibility = Math.min(age * 12, 1) * (1 - age) ** 1.58;
    ctx.globalAlpha = .46 * visibility;
    ctx.drawImage(plume, x - spread / 2, y - spread * .57, spread, spread * 1.14);
  }
  ctx.restore();
}

module.exports = {
  title: '빗방울 너머의 새벽',
  slug: 'rain-on-the-window',
  sound: 'rain-room',
  createScene(createCanvas) {
    const rng = randomFrom(512914);
    const view = createCanvas(960, 540);
    const room = createCanvas(1920, 1080);
    const finish = createCanvas(1920, 1080);
    const viewContext = view.getContext('2d');
    const roomContext = room.getContext('2d');
    const finishContext = finish.getContext('2d');
    viewContext.scale(.5, .5);
    paintView(viewContext, rng);
    paintRoom(roomContext, rng);
    const vignette = finishContext.createRadialGradient(972, 496, 332, 974, 548, 1120);
    vignette.addColorStop(0, 'rgba(5,8,14,0)');
    vignette.addColorStop(.65, 'rgba(4,7,14,.13)');
    vignette.addColorStop(1, 'rgba(4,6,14,.47)');
    finishContext.fillStyle = vignette;
    finishContext.fillRect(0, 0, 1920, 1080);
    for (let i = 0; i < 26500; i++) {
      finishContext.fillStyle = rng() > .55 ? 'rgba(195,183,182,.045)' : 'rgba(0,0,4,.13)';
      finishContext.fillRect(rng() * 1920, rng() * 1080, .65 + rng() * 1.4, .5 + rng() * 1.3);
    }
    const drops = Array.from({ length: 174 }, (_, index) => {
      const heavy = index < 40;
      return {
        x: 503 + rng() * 1324, y: 56 + rng() * 702,
        offset: rng(), cycles: heavy ? 1 + Math.floor(rng() * 3) : 2 + Math.floor(rng() * 5),
        drift: (rng() - .23) * (heavy ? 19 : 13), sway: 1.4 + rng() * 4,
        span: (heavy ? 38 : 61) + rng() * (heavy ? 105 : 148),
        length: heavy ? 16 + rng() * 65 : 4 + rng() * 43,
        width: heavy ? 1.09 + rng() * 1.79 : .65 + rng() * .87,
        alpha: heavy ? .07 + rng() * .19 : .042 + rng() * .085
      };
    });
    const large = [550, 624, 676, 744, 832, 886, 1010, 1084, 1156, 1278, 1354, 1465, 1536, 1635, 1738, 1800].map((x, index) => ({
      x, y: 100 + rng() * 535, offset: rng(), cycles: index % 4 === 0 ? 1 : 2,
      drift: (rng() - .46) * 41, sway: (rng() - .5) * 16, span: 152 + rng() * 245,
      length: 50 + rng() * 107, width: 1.9 + rng() * 2.22, alpha: .30 + rng() * .25,
    }));
    const plume = createCanvas(64, 64);
    const plumeContext = plume.getContext('2d');
    glow(plumeContext, 32, 32, 32, 32, '200,182,179', .39);
    return (ctx, phase) => {
      phase = fract(phase);
      ctx.drawImage(view, 0, 0, 1920, 1080);
      rainOnGlass(ctx, drops, phase);
      largeDrops(ctx, large, phase);
      ctx.drawImage(room, 0, 0);
      steam(ctx, phase, plume);
      ctx.drawImage(finish, 0, 0);
    };
  }
};
