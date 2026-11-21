const WIDTH = 1920;
const HEIGHT = 1080;
const SHORE = 650;
const TAU = Math.PI * 2;

function randomFrom(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function path(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (let index = 1; index < points.length; index += 1) ctx.lineTo(...points[index]);
  ctx.closePath();
}

function polygon(ctx, points, color) {
  path(ctx, points);
  ctx.fillStyle = color;
  ctx.fill();
}

function oval(ctx, x, y, width, height, stops) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(width, height);
  const field = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  for (const [offset, color] of stops) field.addColorStop(offset, color);
  ctx.fillStyle = field;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function roughen(points, rng, roughness, maxStep = 14) {
  const contour = [points[0]];
  for (let index = 1; index < points.length; index += 1) {
    const [leftX, leftY] = points[index - 1];
    const [rightX, rightY] = points[index];
    const steps = Math.max(1, Math.ceil(Math.abs(rightX - leftX) / maxStep));
    for (let step = 1; step < steps; step += 1) {
      const fraction = step / steps;
      const offset = (rng() - 0.5) * roughness * Math.sin(Math.PI * fraction) ** 0.42;
      contour.push([leftX + (rightX - leftX) * fraction, leftY + (rightY - leftY) * fraction + offset]);
    }
    contour.push([rightX, rightY]);
  }
  return contour;
}

function drawSky(ctx, rng) {
  const sky = ctx.createLinearGradient(0, 0, 65, SHORE);
  sky.addColorStop(0, '#10162d');
  sky.addColorStop(0.3, '#202941');
  sky.addColorStop(0.66, '#41495b');
  sky.addColorStop(0.86, '#696473');
  sky.addColorStop(1, '#887173');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, SHORE);
  oval(ctx, 1375, 598, 832, 310, [[0, 'rgba(231,171,133,0.39)'], [0.4, 'rgba(200,144,128,0.19)'], [1, 'rgba(163,102,122,0)']]);
  oval(ctx, 595, 539, 712, 279, [[0, 'rgba(140,164,178,0.25)'], [1, 'rgba(132,155,183,0)']]);

  for (let index = 0; index < 125; index += 1) {
    const x = rng() * WIDTH;
    const y = Math.pow(rng(), 1.26) * 383;
    const strength = (0.18 + rng() * 0.56) * (1 - y / 413) ** 1.65;
    ctx.fillStyle = 'rgba(229,226,224,' + strength + ')';
    ctx.beginPath();
    ctx.arc(x, y, 0.3 + Math.pow(rng(), 5) * 1.4, 0, TAU);
    ctx.fill();
  }

  const bands = [[1708, 392, 472, 29, '#393a55'], [457, 288, 525, 18, '#202a45'], [1588, 318, 420, 25, '#303851'], [1209, 452, 562, 20, '#515067'], [755, 419, 580, 30, '#505168'], [298, 476, 512, 18, '#676576']];
  for (const [x, y, width, height, color] of bands) {
    for (let index = 0; index < 13; index += 1) {
      const center = x + (rng() - 0.5) * width * 1.5;
      const altitude = y + (rng() - 0.5) * height * 1.35;
      oval(ctx, center, altitude, width * (0.24 + rng() * 0.35), height * (0.3 + rng() * 0.6), [[0, color + '36'], [1, color + '00']]);
    }
  }
}

function limestoneTexture(createCanvas, rng) {
  const texture = createCanvas(384, 113);
  const ctx = texture.getContext('2d');
  const pixels = ctx.createImageData(texture.width, texture.height);
  const side = 84;
  const noise = Float32Array.from({ length: side * side }, rng);
  function sample(x, y) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const a = x - i;
    const b = y - j;
    const u = a * a * (3 - 2 * a);
    const v = b * b * (3 - 2 * b);
    const top = noise[j % side * side + i % side] * (1 - u) + noise[j % side * side + (i + 1) % side] * u;
    const bottom = noise[(j + 1) % side * side + i % side] * (1 - u) + noise[(j + 1) % side * side + (i + 1) % side] * u;
    return top * (1 - v) + bottom * v;
  }
  for (let y = 0; y < texture.height; y += 1) {
    for (let x = 0; x < texture.width; x += 1) {
      const light = sample(x / 25 + 3, y / 12 + 7) * 0.56 + sample((x + y * 0.64) / 7 + 11, y / 4 + 5) * 0.28 + sample((x + y * 0.15) / 2 + 19, y / 3 + 17) * 0.16;
      const offset = (y * texture.width + x) * 4;
      const gray = 128 + (light - 0.5) * 196;
      pixels.data[offset] = gray;
      pixels.data[offset + 1] = gray;
      pixels.data[offset + 2] = gray;
      pixels.data[offset + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return texture;
}

function drawMassif(ctx, rng, createCanvas) {
  const skyline = roughen([
    [0, 554], [70, 557], [118, 546], [177, 557], [227, 531], [268, 528],
    [303, 509], [348, 512], [425, 450], [470, 437], [503, 450], [579, 382],
    [631, 398], [669, 379], [710, 408], [758, 393], [783, 372], [819, 380],
    [868, 321], [906, 305], [947, 254], [1012, 184], [1034, 204], [1075, 248],
    [1118, 272], [1155, 313], [1179, 318], [1200, 307], [1218, 312], [1247, 290],
    [1272, 304], [1305, 350], [1340, 366], [1406, 428], [1442, 435], [1490, 468],
    [1564, 488], [1647, 526], [1696, 521], [1756, 548], [1850, 555], [1920, 568],
  ], rng, 16, 10);
  const boundary = [...skyline, [WIDTH, SHORE], [0, SHORE]];
  const stone = ctx.createLinearGradient(0, 201, 95, SHORE);
  stone.addColorStop(0, '#7b7f92');
  stone.addColorStop(0.33, '#626d84');
  stone.addColorStop(0.69, '#465872');
  stone.addColorStop(1, '#303d58');
  polygon(ctx, boundary, stone);

  ctx.save();
  path(ctx, boundary);
  ctx.clip();
  // Major glacial faces and gullies converge down the ridgelines.
  const faces = [
    { points: [[355, 486], [579, 365], [692, 410], [646, 453], [620, 478], [521, 492], [484, 530], [385, 556]], color: '#687a8f', slant: -1.42, density: 1080 },
    { points: [[574, 387], [651, 373], [759, 398], [846, 448], [689, 455], [664, 509], [585, 550], [610, 481], [597, 447]], color: '#4d6079', slant: 0.69, density: 960 },
    { points: [[657, 390], [817, 357], [971, 230], [1018, 179], [1014, 256], [988, 267], [971, 331], [924, 357], [900, 418], [860, 452], [806, 475], [780, 522], [663, 564], [699, 519], [748, 452], [754, 426]], color: '#526581', slant: -0.83, density: 2240 },
    { points: [[1013, 181], [1153, 279], [1207, 361], [1259, 414], [1203, 432], [1175, 400], [1109, 371], [1097, 335], [1050, 311], [1032, 262]], color: '#9b97a4', slant: 0.72, density: 1530 },
    { points: [[1015, 188], [1034, 258], [1044, 279], [1048, 311], [1095, 336], [1108, 373], [1180, 402], [1206, 436], [1161, 447], [1113, 432], [1084, 402], [1004, 383], [985, 350], [970, 330], [990, 275], [1007, 255]], color: '#758197', slant: 0.76, density: 2260 },
    { points: [[971, 328], [1007, 381], [1057, 390], [1085, 400], [1109, 432], [1163, 449], [1191, 441], [1230, 496], [1191, 531], [1131, 538], [1098, 574], [1020, 577], [982, 600], [887, 611], [875, 555], [815, 545], [927, 452]], color: '#435671', slant: -0.43, density: 2600 },
    { points: [[1160, 334], [1251, 278], [1344, 340], [1428, 403], [1506, 479], [1418, 476], [1355, 482], [1290, 445], [1251, 417], [1217, 375]], color: '#738397', slant: 1.1, density: 1470 },
    { points: [[1246, 293], [1271, 303], [1310, 346], [1352, 364], [1410, 426], [1388, 422], [1345, 390], [1321, 395], [1284, 367], [1276, 338]], color: '#9b98a0', slant: 1.53, density: 600 },
    { points: [[1410, 436], [1535, 457], [1676, 518], [1763, 554], [1729, 574], [1571, 573], [1487, 550], [1380, 555], [1300, 510], [1385, 497]], color: '#54657f', slant: 1.58, density: 1400 },
  ];

  for (const face of faces) {
    const minX = Math.min(...face.points.map(([x]) => x));
    const maxX = Math.max(...face.points.map(([x]) => x));
    const minY = Math.min(...face.points.map(([, y]) => y));
    const maxY = Math.max(...face.points.map(([, y]) => y));
    const contour = roughen([...face.points, face.points[0]], rng, 10.5, 10);
    polygon(ctx, contour, face.color);
    ctx.save();
    path(ctx, contour);
    ctx.clip();
    const shade = ctx.createLinearGradient(minX + (maxX - minX) * 0.4, minY, maxX, maxY);
    shade.addColorStop(0, 'rgba(176,181,202,0.13)');
    shade.addColorStop(0.31, 'rgba(170,170,190,0.022)');
    shade.addColorStop(0.81, 'rgba(24,39,65,0.055)');
    shade.addColorStop(1, 'rgba(23,39,65,0.16)');
    ctx.fillStyle = shade;
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    for (let index = 0; index < face.density; index += 1) {
      const x = minX + rng() * (maxX - minX);
      const y = minY + rng() * (maxY - minY);
      const length = 1 + Math.pow(rng(), 5) * 46;
      const field = 0.4 + 0.6 * Math.sin(x * 0.014 + y * 0.028 + face.slant) ** 2;
      const strength = (0.04 + rng() * 0.135) * field;
      ctx.strokeStyle = 'rgba(' + (rng() > 0.52 ? '211,211,214,' : '28,42,63,') + strength + ')';
      ctx.lineWidth = 0.45 + rng() * 1.15;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const direction = face.slant + 0.32 * Math.sin(x * 0.018 + y * 0.041) + (rng() - 0.5) * 0.59;
      ctx.lineTo(x + length * direction, y + length);
      ctx.stroke();
    }
    ctx.restore();
  }

  const drifts = [
    [[937, 271], [971, 227], [1013, 185], [1025, 214], [1012, 225], [1013, 246], [996, 252], [994, 270], [975, 290], [977, 276], [963, 293], [950, 302], [954, 281], [940, 289]],
    [[1013, 185], [1075, 247], [1116, 272], [1158, 314], [1176, 333], [1155, 327], [1140, 315], [1122, 311], [1109, 291], [1090, 285], [1072, 267], [1062, 264], [1044, 242], [1034, 246], [1025, 216]],
    [[985, 289], [998, 278], [1009, 263], [1015, 284], [1023, 299], [1032, 317], [1029, 330], [1022, 323], [1014, 307], [1000, 311], [991, 326], [981, 332]],
    [[881, 322], [906, 307], [938, 271], [932, 296], [906, 320], [897, 339], [880, 342], [860, 365], [846, 371], [866, 350]],
    [[904, 374], [935, 338], [963, 316], [951, 345], [936, 354], [925, 376], [901, 412], [879, 420], [886, 401]],
    [[517, 432], [578, 381], [602, 388], [631, 397], [619, 411], [588, 406], [579, 420], [557, 421], [531, 447]],
    [[735, 401], [771, 386], [783, 369], [816, 382], [808, 396], [791, 396], [773, 408], [750, 414]],
    [[1201, 315], [1247, 286], [1270, 303], [1289, 330], [1271, 321], [1265, 329], [1250, 309], [1235, 332], [1228, 323], [1203, 343]],
    [[1323, 364], [1345, 368], [1371, 391], [1394, 413], [1374, 407], [1359, 390], [1346, 394], [1334, 380]],
  ];
  for (const [index, points] of drifts.entries()) {
    const snow = ctx.createLinearGradient(0, 197, 39, 479);
    snow.addColorStop(0, index === 1 ? '#c3aeb1' : '#b3b5c6');
    snow.addColorStop(0.43, index === 1 ? '#baaeb6' : '#9aa8bb');
    snow.addColorStop(1, '#7689a2');
    const brokenEdge = roughen([...points, points[0]], rng, 4.8, 7);
    polygon(ctx, brokenEdge, snow);
    ctx.save();
    path(ctx, brokenEdge);
    ctx.clip();
    for (let mark = 0; mark < 560; mark += 1) {
      const [x, y] = points[Math.floor(rng() * points.length)];
      const offsetX = (rng() - 0.5) * 67;
      const offsetY = (rng() - 0.5) * 75;
      const length = 0.7 + rng() ** 3 * 16;
      ctx.fillStyle = rng() > 0.44 ? 'rgba(55,73,98,0.15)' : 'rgba(245,224,217,0.12)';
      ctx.fillRect(x + offsetX, y + offsetY, length, 0.5 + rng() * 1.3);
    }
    ctx.restore();
  }

  const brokenSnow = [
    { color: 'rgba(163,176,194,0.52)', points: [[972, 252], [981, 248], [980, 260], [974, 268], [969, 282], [953, 301], [954, 289], [965, 277], [964, 271]] },
    { color: 'rgba(163,176,194,0.43)', points: [[953, 327], [962, 318], [957, 333], [948, 340], [944, 355], [932, 362], [924, 376], [927, 359], [937, 347], [941, 335]] },
    { color: 'rgba(201,191,196,0.43)', points: [[1051, 278], [1057, 283], [1065, 296], [1086, 306], [1090, 317], [1107, 326], [1097, 324], [1081, 321], [1072, 309], [1061, 308], [1054, 300]] },
    { color: 'rgba(163,171,190,0.45)', points: [[1114, 354], [1126, 360], [1140, 364], [1150, 376], [1163, 381], [1172, 393], [1164, 389], [1149, 388], [1138, 375], [1124, 375]] },
    { color: 'rgba(161,169,187,0.39)', points: [[1264, 323], [1271, 326], [1286, 344], [1292, 347], [1301, 364], [1319, 378], [1305, 375], [1294, 366], [1279, 356], [1271, 338]] },
    { color: 'rgba(32,46,68,0.34)', points: [[1015, 225], [1022, 224], [1027, 237], [1032, 241], [1030, 250], [1038, 272], [1031, 267], [1023, 250], [1021, 241], [1015, 236]] },
    { color: 'rgba(38,53,77,0.22)', points: [[865, 379], [886, 360], [876, 381], [868, 389], [868, 399], [848, 420], [854, 403], [860, 394]] },
  ];
  for (const ledge of brokenSnow) {
    polygon(ctx, roughen([...ledge.points, ledge.points[0]], rng, 2.5, 5), ledge.color);
  }
  const texture = limestoneTexture(createCanvas, randomFrom(14244426));
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.59;
  ctx.drawImage(texture, 0, 179, WIDTH, SHORE - 179);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  const atmosphere = ctx.createLinearGradient(0, 320, 0, SHORE);
  atmosphere.addColorStop(0, 'rgba(128,153,182,0)');
  atmosphere.addColorStop(0.56, 'rgba(119,139,165,0.12)');
  atmosphere.addColorStop(1, 'rgba(153,150,167,0.39)');
  ctx.fillStyle = atmosphere;
  ctx.fillRect(0, 208, WIDTH, SHORE - 208);
  ctx.restore();
}

function pine(ctx, x, base, height, width, color, rng) {
  const bend = (rng() - 0.5) * width * 0.24;
  const tiers = height > 53 ? 16 : 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + bend, base - height);
  for (let tier = 1; tier <= tiers; tier += 1) {
    const altitude = tier / (tiers + 0.4);
    const center = x + bend * (1 - altitude);
    const spread = width * (0.1 + altitude * 0.86) * (0.69 + rng() * 0.47);
    const y = base - height * (1 - altitude);
    ctx.lineTo(center + spread, y + height * (0.012 + rng() * 0.045));
    ctx.lineTo(center + spread * (0.48 + rng() * 0.17), y + height * 0.022);
  }
  ctx.lineTo(x + width * 0.105, base - height * 0.058);
  ctx.lineTo(x + width * 0.084, base);
  ctx.lineTo(x - width * 0.068, base);
  ctx.lineTo(x - width * 0.107, base - height * 0.062);
  for (let tier = tiers; tier >= 1; tier -= 1) {
    const altitude = tier / (tiers + 0.4);
    const center = x + bend * (1 - altitude);
    const spread = width * (0.09 + altitude * 0.93) * (0.69 + rng() * 0.47);
    const y = base - height * (1 - altitude);
    ctx.lineTo(center - spread * (0.48 + rng() * 0.17), y + height * 0.022);
    ctx.lineTo(center - spread, y + height * (0.012 + rng() * 0.045));
  }
  ctx.closePath();
  ctx.fill();
}

function drawValley(ctx, rng) {
  const leftHills = [[0, 472], [88, 499], [151, 507], [243, 525], [316, 555], [406, 564], [510, 587], [579, 600], [685, 633], [747, 646], [879, 650]];
  const rightHills = [[1051, 650], [1119, 644], [1169, 642], [1246, 632], [1384, 601], [1463, 563], [1550, 529], [1613, 512], [1693, 507], [1779, 474], [1855, 437], [1920, 413]];
  polygon(ctx, [...roughen(leftHills, rng, 8), [0, SHORE]], '#424f69');
  polygon(ctx, [...roughen(rightHills, rng, 8), [WIDTH, SHORE]], '#3b4b63');

  const hillBands = [
    { points: [[0, 527], [98, 534], [178, 564], [254, 571], [315, 591], [441, 608], [494, 623], [625, 637], [747, 649]], color: '#354760', tip: 0 },
    { points: [[1246, 650], [1307, 640], [1372, 624], [1448, 607], [1536, 585], [1584, 578], [1690, 541], [1755, 535], [1828, 513], [1920, 500]], color: '#31465d', tip: WIDTH },
    { points: [[0, 581], [88, 589], [141, 591], [201, 611], [272, 619], [359, 638], [482, 643], [552, 650]], color: '#283c52', tip: 0 },
    { points: [[1460, 650], [1521, 639], [1577, 624], [1644, 609], [1713, 574], [1798, 548], [1858, 541], [1920, 530]], color: '#263b50', tip: WIDTH },
  ];
  for (const layer of hillBands) {
    const treeline = roughen(layer.points, rng, 5, 8);
    polygon(ctx, [...treeline, [layer.tip, SHORE]], layer.color);
    for (let index = 1; index < treeline.length; index += 1) {
      const [x1, y1] = treeline[index - 1];
      const [x2, y2] = treeline[index];
      for (let seedling = 0; seedling < 2; seedling += 1) {
        const fraction = rng();
        const x = x1 + fraction * (x2 - x1);
        const altitude = y1 + fraction * (y2 - y1);
        const height = 6 + Math.pow(rng(), 2.5) * (11 + (SHORE - altitude) * 0.105);
        pine(ctx, x, altitude + height * 0.39, height, height * (0.19 + rng() * 0.11), layer.color, rng);
      }
    }
  }

  oval(ctx, 960, SHORE - 3, 680, 52, [[0, 'rgba(179,160,163,0.21)'], [0.6, 'rgba(151,156,170,0.10)'], [1, 'rgba(151,156,170,0)']]);
}

function drawNearBank(ctx, rng) {
  const near = roughen([[0, 747], [50, 766], [91, 784], [134, 811], [157, 843], [189, 857], [207, 875], [264, 895], [290, 917], [353, 927], [403, 962], [440, 980], [488, 1015], [526, 1060], [589, 1080]], rng, 15, 11);
  const bank = [...near, [0, HEIGHT]];
  polygon(ctx, bank, '#0a1627');
  polygon(ctx, [[0, 783], [80, 802], [135, 833], [183, 872], [256, 901], [213, 914], [157, 904], [86, 886], [0, 858]], '#15273a');

  for (const [x, base, height, width] of [[24, 865, 332, 102], [103, 853, 242, 66], [174, 932, 168, 47], [248, 970, 139, 43], [349, 1014, 91, 26], [403, 1052, 70, 17]]) {
    pine(ctx, x + 5, base, height, width, '#152538', rng);
    pine(ctx, x, base + 5, height * 1.01, width * 0.95, '#0a172a', rng);
  }
  for (let index = 0; index < 200; index += 1) {
    const x = rng() ** 0.77 * 568;
    const y = 776 + x * 0.52 + rng() * 35;
    const height = 3 + rng() ** 2 * 19;
    ctx.strokeStyle = rng() > 0.5 ? 'rgba(29,50,62,0.54)' : 'rgba(14,29,43,0.77)';
    ctx.lineWidth = 0.58 + rng() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + height * 0.05, y - height * 0.56, x + (rng() - 0.56) * height, y - height);
    ctx.stroke();
  }

  for (const [x, y, w, h] of [[1638, 1027, 82, 22], [1758, 1045, 64, 25], [1857, 1058, 122, 35]]) {
    polygon(ctx, [[x - w, y + h * 0.74], [x - w * 0.52, y + h * 0.01], [x + w * 0.08, y], [x + w * 0.67, y + h * 0.37], [x + w, y + h], [x - w * 0.5, y + h * 1.02]], '#0b192a');
    polygon(ctx, [[x - w, y + h * 0.74], [x - w * 0.52, y + h * 0.01], [x + w * 0.08, y], [x + w * 0.62, y + h * 0.37], [x + w * 0.36, y + h * 0.58], [x - w * 0.3, y + h * 0.4]], '#192a3c');
  }
}

function createScene(createCanvas) {
  const rng = randomFrom(84442389);
  const upper = createCanvas(WIDTH, SHORE);
  const still = createCanvas(WIDTH, HEIGHT);
  const reflection = createCanvas(WIDTH, HEIGHT - SHORE);
  const softReflection = createCanvas(384, 149);
  const thinMist = createCanvas(900, 130);
  const farMist = createCanvas(760, 95);
  const foreground = createCanvas(WIDTH, HEIGHT);
  const matte = createCanvas(WIDTH, HEIGHT);
  const sky = upper.getContext('2d');
  const background = still.getContext('2d');
  const mirror = reflection.getContext('2d');
  const grade = matte.getContext('2d');
  drawSky(sky, rng);
  drawMassif(sky, rng, createCanvas);
  drawValley(sky, rng);
  drawNearBank(foreground.getContext('2d'), rng);
  background.drawImage(upper, 0, 0);

  const lake = background.createLinearGradient(0, SHORE, 0, HEIGHT);
  lake.addColorStop(0, '#38475e');
  lake.addColorStop(0.32, '#26374f');
  lake.addColorStop(0.72, '#1c2c45');
  lake.addColorStop(1, '#0d1b32');
  background.fillStyle = lake;
  background.fillRect(0, SHORE, WIDTH, HEIGHT - SHORE);
  oval(background, 1169, 822, 762, 244, [[0, 'rgba(112,116,146,0.18)'], [1, 'rgba(112,116,146,0)']]);

  mirror.save();
  mirror.scale(1, -0.846);
  mirror.drawImage(upper, 0, -SHORE);
  mirror.restore();
  softReflection.getContext('2d').drawImage(reflection, 0, 0, softReflection.width, softReflection.height);
  for (let bandY = 109; bandY < reflection.height; bandY += 9) {
    const bandHeight = Math.min(9, reflection.height - bandY);
    const scale = softReflection.height / reflection.height;
    mirror.globalAlpha = 0.16 + 0.81 * (bandY / reflection.height) ** 1.42;
    mirror.drawImage(softReflection, 0, bandY * scale, softReflection.width, bandHeight * scale, 0, bandY, WIDTH, bandHeight);
  }
  mirror.globalAlpha = 1;
  const reflectionFade = mirror.createLinearGradient(0, 0, 0, reflection.height);
  reflectionFade.addColorStop(0, 'rgba(0,0,0,0.73)');
  reflectionFade.addColorStop(0.36, 'rgba(0,0,0,0.48)');
  reflectionFade.addColorStop(0.76, 'rgba(0,0,0,0.205)');
  reflectionFade.addColorStop(1, 'rgba(0,0,0,0.058)');
  mirror.globalCompositeOperation = 'destination-in';
  mirror.fillStyle = reflectionFade;
  mirror.fillRect(0, 0, WIDTH, reflection.height);
  mirror.globalCompositeOperation = 'source-over';

  const mistOne = thinMist.getContext('2d');
  const mistTwo = farMist.getContext('2d');
  for (let index = 0; index < 37; index += 1) {
    const x = 74 + rng() * 748;
    const y = 46 + rng() * 36;
    const width = 65 + rng() * 160;
    const height = 6 + rng() * 17;
    oval(mistOne, x, y, width, height, [[0, 'rgba(169,179,191,0.045)'], [0.5, 'rgba(165,171,185,0.025)'], [1, 'rgba(151,163,177,0)']]);
    oval(mistTwo, x * 0.85, y * 0.75, width * 0.83, height * 0.55, [[0, 'rgba(198,187,197,0.048)'], [1, 'rgba(186,176,190,0)']]);
  }

  const shading = grade.createRadialGradient(1115, 524, 312, 1090, 504, 1220);
  shading.addColorStop(0, 'rgba(3,7,21,0)');
  shading.addColorStop(0.63, 'rgba(3,7,21,0.05)');
  shading.addColorStop(1, 'rgba(3,7,21,0.48)');
  grade.fillStyle = shading;
  grade.fillRect(0, 0, WIDTH, HEIGHT);

  const ripples = Array.from({ length: 431 }, () => ({
    x: rng() * WIDTH,
    depth: rng() ** 1.74,
    width: rng() ** 1.9 * 80 + 4,
    phase: rng() * TAU,
    speed: 1 + Math.floor(rng() * 2),
    opacity: rng() ** 2 * 0.16 + 0.013,
    shade: rng() < 0.51 ? '158,172,195,' : '14,22,44,',
  }));

  const bands = [];
  for (let y = 0; y < reflection.height;) {
    const height = Math.min(6 + Math.floor(rng() * (7 + y * 0.012)), reflection.height - y);
    bands.push({ y, height, offset: 0.057 * y + (rng() - 0.5) * 1.2 });
    y += height;
  }
  const wideCrests = Array.from({ length: 36 }, () => ({
    x: 600 + rng() * 840,
    depth: 0.26 + rng() ** 0.74 * 0.69,
    length: 39 + rng() ** 2 * 218,
    strength: 0.046 + rng() * 0.102,
    phase: rng() * TAU,
  }));
  const crosswaves = Array.from({ length: 17 }, () => ({
    x: 410 + rng() * 1060,
    depth: 0.31 + rng() ** 0.87 * 0.57,
    length: 37 + rng() ** 1.4 * 148,
    height: 1.7 + rng() * 4.9,
    phase: rng() * TAU,
  }));

  return (ctx, phase) => {
    const time = (phase % 1) * TAU;
    ctx.drawImage(still, 0, 0);
    for (const band of bands) {
      const depth = band.y / reflection.height;
      const swell = Math.sin(time * 2 + band.offset);
      const swing = swell * (1.4 + 15.5 * depth ** 1.25);
      const sourceY = Math.max(0, Math.min(reflection.height - band.height, band.y + swell * depth * 2.3));
      ctx.drawImage(reflection, 0, sourceY, WIDTH, band.height, -19 + swing, SHORE + band.y, WIDTH + 38, band.height);
    }

    // Low swells briefly interrupt the lower part of the reflected ridge.
    for (const wave of crosswaves) {
      const offset = Math.sin(time * 2 + wave.phase);
      const y = SHORE + wave.depth * (HEIGHT - SHORE) + offset * 6.4;
      const x = wave.x + 17 * Math.cos(time + wave.phase);
      const visible = (0.45 + 0.37 * offset) * (0.64 + 0.36 * wave.depth);
      oval(ctx, x, y + 1.3, wave.length, wave.height, [
        [0, 'rgba(12,24,44,' + visible * 0.44 + ')'],
        [0.5, 'rgba(16,28,48,' + visible * 0.22 + ')'],
        [1, 'rgba(16,28,48,0)'],
      ]);
      oval(ctx, x + wave.length * 0.13, y - 1.7, wave.length * 0.69, wave.height * 0.56, [
        [0, 'rgba(150,167,190,' + visible * 0.17 + ')'],
        [1, 'rgba(150,167,190,0)'],
      ]);
    }

    for (const crest of wideCrests) {
      const wave = Math.sin(time * 2 + crest.phase);
      const y = SHORE + crest.depth * (HEIGHT - SHORE) + wave * (0.6 + crest.depth * 2.3);
      const x = crest.x + 10 * wave;
      const length = crest.length * (0.28 + crest.depth * 0.72);
      const streak = ctx.createLinearGradient(x - length, y, x + length, y);
      const strength = crest.strength * (0.58 + 0.36 * wave);
      streak.addColorStop(0, 'rgba(140,156,184,0)');
      streak.addColorStop(0.4, 'rgba(151,165,188,' + strength + ')');
      streak.addColorStop(0.72, 'rgba(143,159,182,' + strength * 0.35 + ')');
      streak.addColorStop(1, 'rgba(140,156,184,0)');
      ctx.fillStyle = streak;
      ctx.fillRect(x - length, y, length * 2, 0.8 + crest.depth * 1.4);
    }

    for (const ripple of ripples) {
      const offset = Math.sin(time * ripple.speed + ripple.phase);
      const x = ripple.x + offset * (2.2 + ripple.depth * 8);
      const y = SHORE + 2 + ripple.depth * (HEIGHT - SHORE) + offset * (0.2 + ripple.depth * 1.5);
      const width = ripple.width * (0.34 + ripple.depth * 0.9);
      ctx.fillStyle = 'rgba(' + ripple.shade + ripple.opacity * (0.55 + 0.36 * offset) + ')';
      ctx.fillRect(x, y, width, 0.65 + ripple.depth * 0.78);
    }

    ctx.globalAlpha = 0.91 + 0.08 * Math.sin(time + 0.6);
    ctx.drawImage(farMist, 354 + 48 * Math.sin(time), 611, 1210, 124);
    ctx.globalAlpha = 0.72 + 0.1 * Math.cos(time);
    ctx.drawImage(thinMist, 91 + 44 * Math.sin(time + 1.8), 650 + 4 * Math.sin(time), 1781, 154);
    ctx.globalAlpha = 1;
    ctx.drawImage(foreground, 0, 0);
    ctx.drawImage(matte, 0, 0);
  };
}

module.exports = { title: '새벽 안개가 흐르는 산정호수', slug: 'mist-on-the-alpine-lake', sound: 'lake', createScene };
