'use strict';

const W = 1920;
const H = 1080;
const TAU = Math.PI * 2;
const tau = phase => TAU * ((phase % 1 + 1) % 1);

function randomFrom(seed) {
  return () => (((seed = Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
}

function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (let n = 1; n < points.length; n++) ctx.lineTo(...points[n]);
  ctx.closePath();
  ctx.fill();
}

function line(ctx, points, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (let n = 1; n < points.length; n++) ctx.lineTo(...points[n]);
  ctx.stroke();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
}

function flat(ctx, start, end, stops) {
  const shade = ctx.createLinearGradient(0, start, 0, end);
  stops.forEach(([position, color]) => shade.addColorStop(position, color));
  return shade;
}

function glow(ctx, x, y, rx, ry, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const light = ctx.createRadialGradient(0, 0, 0.03, 0, 0, 1);
  light.addColorStop(0, 'rgba(' + color + ',' + alpha + ')');
  light.addColorStop(1, 'rgba(' + color + ',0)');
  ctx.fillStyle = light;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function renderSurface(createCanvas, paint) {
  const image = createCanvas(W, H);
  paint(image.getContext('2d'));
  return image;
}

function grain(ctx, random, count, top = 0, bottom = H) {
  for (let index = 0; index < count; index++) {
    const x = random() * W;
    const y = top + random() * (bottom - top);
    ctx.fillStyle = random() < 0.55 ? 'rgba(196,207,207,0.033)' : 'rgba(0,4,12,0.073)';
    ctx.fillRect(x, y, 0.6 + random() * 3.7, 0.5 + random() * 1.4);
  }
}

function sky(ctx, random, horizon, tint = 'inlet', moon = null) {
  const colors = {
    inlet: ['#0c1628', '#243747', '#4a5660', '146,168,180'],
    plum: ['#11162a', '#34384b', '#64646a', '194,143,133'],
    cold: ['#071427', '#20394c', '#435f68', '150,190,184'],
    fog: ['#132238', '#344b58', '#596b6d', '163,185,175'],
    warm: ['#141a30', '#393e4b', '#716761', '224,172,133'],
  }[tint];
  ctx.fillStyle = flat(ctx, 0, horizon, [[0, colors[0]], [.6, colors[1]], [1, colors[2]]]);
  ctx.fillRect(0, 0, W, horizon + 2);
  for (let index = 0; index < 104; index++) {
    const x = random() * W, y = random() ** 1.3 * horizon * .61;
    const power = .14 + random() ** 2 * .40;
    ellipse(ctx, x, y, .45 + random() * 1.13, .45 + random() * .89, 'rgba(219,225,230,' + power + ')');
  }
  for (let index = 0; index < 18; index++) {
    const y = horizon * (.43 + random() * .51);
    glow(ctx, random() * W, y, 140 + random() * 490, 6 + random() * 27, colors[3], .03 + random() * .075);
  }
  glow(ctx, W * .57, horizon * .92, 1020, horizon * .39, colors[3], .15);
  if (moon) {
    const [x, y, radius] = moon;
    glow(ctx, x, y, radius * 6, radius * 6, '174,200,203', .20);
    ellipse(ctx, x, y, radius, radius * .99, '#c4cdd0');
    ellipse(ctx, x - radius * .21, y - radius * .18, radius * .65, radius * .63, 'rgba(193,204,208,0.78)');
    ellipse(ctx, x + radius * .28, y + radius * .18, radius * .19, radius * .17, 'rgba(111,135,149,0.16)');
  }
  grain(ctx, random, 9700, 0, horizon);
}

function ridge(ctx, random, baseline, scale, color, profile, roughness = .21) {
  const points = [];
  for (let x = -40; x <= W + 55; x += 9) {
    const u = x / W;
    const silhouette = profile(u) + (random() - .48) * roughness;
    points.push([x, baseline - scale * silhouette]);
  }
  polygon(ctx, [...points, [W + 80, baseline + 30], [-40, baseline + 30]], color);
}

function bodyOfWater(ctx, horizon, theme) {
  const palette = {
    inlet: ['#435464', '#1e374a', '#101c2b'],
    plum: ['#505866', '#2a4252', '#111f2d'],
    cold: ['#425d6b', '#1d3848', '#0e1d2e'],
    fog: ['#566d70', '#284958', '#122935'],
    warm: ['#626465', '#35444c', '#1b2a31'],
  }[theme];
  ctx.fillStyle = flat(ctx, horizon, H, [[0, palette[0]], [.43, palette[1]], [1, palette[2]]]);
  ctx.fillRect(0, horizon, W, H - horizon);
}

function ripples(random, count, horizon, opacity = 1) {
  return Array.from({ length: count }, () => {
    const d = random() ** 1.45;
    return [random() * (W + 80) - 40, horizon + d * (H - horizon),
      (3 + 114 * d) * (random() ** 1.4 + .1), random() * TAU, 1 + (random() * 3 | 0),
      (.04 + random() * .36) * opacity * (1 - d * .39), .38 + d * 1.45];
  });
}

function drawRipples(ctx, data, t, color = '154,187,204', travel = 1) {
  for (const [x, y, width, angle, speed, alpha, weight] of data) {
    const flow = Math.sin(t * speed + angle);
    ctx.fillStyle = 'rgba(' + color + ',' + alpha * (.64 + flow * .36) + ')';
    ctx.fillRect(x + flow * width * .10 * travel, y + Math.cos(t + angle) * weight, width * (.93 + flow * .07), weight);
  }
}

function vignette(ctx) {
  const shade = ctx.createRadialGradient(W * .54, H * .47, H * .29, W * .54, H * .47, W * .60);
  shade.addColorStop(0, 'rgba(3,9,22,0)');
  shade.addColorStop(1, 'rgba(2,5,16,0.43)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
}

function rock(ctx, random, x, y, size, height, light = '#43535a', dark = '#182630', flecks = 45) {
  const points = [[x - size, y + height * .37], [x - size * .72, y - height * .17],
    [x - size * .36, y - height * (.95 + random() * .31)], [x + size * .34, y - height * (.73 + random() * .27)],
    [x + size * (.76 + random() * .19), y - height * .12], [x + size, y + height * .22],
    [x + size * .36, y + height * .39]];
  polygon(ctx, points, dark);
  polygon(ctx, [points[0], points[1], points[2], points[3], points[4], [x + size * .11, y - height * .19]], light);
  for (let index = 0; index < flecks; index++) {
    const dx = (random() * 2 - 1) * size * .67;
    const yy = y - height * (.15 + random() * (.61 - Math.abs(dx / size) * .6));
    ctx.fillStyle = random() > .35 ? 'rgba(158,176,177,.12)' : 'rgba(7,18,27,.18)';
    ctx.fillRect(x + dx, yy, 1 + random() * size * .09, 1 + random() * height * .05);
  }
}

function post(ctx, x, y, top, width, light = '#655b52', dark = '#272b2f') {
  polygon(ctx, [[x, y], [x + width, y + 2], [x + width * .94, top], [x + width * .11, top - 3]], dark);
  polygon(ctx, [[x, y], [x + width * .28, y], [x + width * .29, top + 2], [x + width * .11, top - 3]], light);
  ellipse(ctx, x + width * .50, top + 1, width * .43, Math.max(2, width * .11), light);
}

function dockLamp(ctx, x, y, radius = 9, color = '223,157,103') {
  glow(ctx, x, y, radius * 7, radius * 8, color, .48);
  ctx.fillStyle = '#252930';
  ctx.fillRect(x - radius, y - radius * .8, radius * 2, radius * 1.9);
  ctx.fillStyle = 'rgba(' + color + ',.82)';
  ctx.fillRect(x - radius * .66, y - radius * .57, radius * 1.32, radius * 1.22);
  line(ctx, [[x - radius * 1.15, y - radius * .8], [x, y - radius * 1.7], [x + radius * 1.15, y - radius * .8]], '#544b49', Math.max(1, radius * .23));
}

function foamPlan(random, curve, count) {
  return Array.from({length:count}, () => {
    const u = random();
    return [...curve(u), u, random() * TAU, random()];
  });
}

function sweepFoam(ctx, spots, depth, t, tint = '163,198,204') {
  for (const [x, y, u, angle, detail] of spots) {
    const cycle = Math.sin(t * 2 + u * 9 + angle * .44);
    const width = 3 + detail * (7 + 60 * u);
    const alpha = (.07 + (.5 + cycle * .5) * .42) * (.65 + detail * .34);
    ellipse(ctx, x + cycle * (4 + depth * u * .26), y + cycle * (2 + depth * u) + (detail - .3) * 19,
      width * (1 - Math.abs(cycle) * .43), .83 + detail * u * 1.9, 'rgba(' + tint + ',' + alpha + ')');
  }
}

function drawFerryWake(ctx, patches, start, t) {
  const progress = t / TAU;
  for (const {offset, side, drift, strength, width} of patches) {
    // Width and spacing recede into the fjord as each wash patch travels away.
    const age = (progress + offset) % 1;
    const depth = 1 - age;
    const spread = 9 + 88 * depth + 236 * depth ** 2;
    const x = 1060 + 24 * Math.sin(depth * Math.PI) + side * spread + drift * depth;
    const y = start + (H + 20 - start) * depth;
    const fade = Math.sin(Math.PI * age) ** 1.25;
    const opacity = fade * strength * (.42 + depth * .58);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(side * (.16 + depth * .26));
    glow(ctx, 0, 0, 5 + width * depth, 1.1 + 5.8 * depth, '160,189,196', opacity);
    ctx.restore();
  }
}

function coast(scene, createCanvas) {
  const random = randomFrom(scene.seed);
  const { horizon, tint, moon, seed, kind } = scene;
  const base = renderSurface(createCanvas, ctx => {
    sky(ctx, random, horizon, tint, moon);
    bodyOfWater(ctx, horizon, tint);
    if (kind === 'fjord') {
      ridge(ctx, random, horizon, 390, '#364351', u => Math.max(Math.abs(u - .50) * .88 + Math.sin(u * 31) * .16, .02), .10);
      ridge(ctx, random, horizon + 6, 540, '#162736', u => Math.max(0, (Math.abs(u - .48) * 2.1 - .49) ** 1) * (.83 + .2 * Math.sin(u * 17)), .065);
      ridge(ctx, random, horizon + 23, 250, '#263945', u => Math.max(0, 1 - 6 * Math.abs(u - .20)) * .38, .061);
    } else if (kind === 'inlet') {
      ridge(ctx, random, horizon, 250, '#39434a', u => .13 + .45 * (Math.cos(u * 6 + 1) + 1) / 2 + Math.sin(u * 44) * .10);
      ridge(ctx, random, horizon + 6, 214, '#26323d', u => .07 + .43 * Math.pow(Math.cos(u * 10 + 1), 2), .105);
      for (let i = 0; i < 47; i++) {
        const x = 151 + i * 35 + random() * 23;
        const y = horizon - 5 - random() * 18;
        ctx.fillStyle = random() > .16 ? '#bba883' : '#bcd1cd';
        if ((i % 5) !== 0) ctx.fillRect(x, y, 1.4 + random() * 3.1, 1.3 + random() * 2.1);
        if (i % 4 === 0) glow(ctx, x, y, 28, 12, '176,151,116', .23);
      }
    } else {
      const amplitude = kind === 'cliff' ? 188 : 88;
      ridge(ctx, random, horizon + 2, amplitude, '#293b48', u => Math.max(.03, .13 + (1 - u) ** 3 * .45 + Math.cos(u * 19) * .12));
      ridge(ctx, random, horizon + 8, amplitude * .8, '#223042', u => Math.max(.015, .22 + .17 * Math.sin(u * 23) - u * .30), .085);
    }
    grain(ctx, random, 6700, horizon);
  });
  const foreground = renderSurface(createCanvas, ctx => {
    if (kind === 'cliff') {
      const bank = [[0, 643],[97,638],[234,678],[324,725],[255,776],[208,804],[291,840],[408,868],[344,914],[442,961],[609,1010],[639,1080],[0,1080]];
      polygon(ctx, bank, flat(ctx, 650, H, [[0,'#333d47'],[.38,'#1c2d36'],[1,'#101821']]));
      for (let index = 0; index < 27; index++) {
        const x = random() ** 1.66 * (230 + index * 12);
        const y = 703 + index * 15;
        rock(ctx, random, x, y, 17 + index * 2.7, 14 + random() * 55, index % 4 === 0 ? '#4a5156' : '#35434a', '#1d2833');
      }
      polygon(ctx, [[0,102],[103,227],[124,448],[105,585],[170,652],[0,736]], '#171f29');
      polygon(ctx, [[0,150],[62,333],[35,507],[91,640],[0,678]], '#2a343e');
    } else if (kind === 'fjord') {
      polygon(ctx, [[1357,1080],[1449,881],[1540,793],[1920,720],[1920,1080]],
        flat(ctx, 719, H, [[0,'#556576'],[1,'#252b32']]));
      polygon(ctx, [[1380,1030],[1481,870],[1556,815],[1920,762],[1920,811],[1578,858]], '#3b464d');
      for (const [x,y] of [[1448,900],[1536,846],[1655,810],[1812,771],[1910,759]]) post(ctx, x, y, y - 151 - (x - 1460) * .05, 21, '#798184', '#323e46');
      line(ctx, [[1434,770],[1563,665],[1920,590]], '#343d46', 16);
      line(ctx, [[1434,764],[1563,660],[1920,584]], '#7c8181', 4);
      line(ctx, [[1434,836],[1563,730],[1920,660]], '#252f37', 8);
      post(ctx, 1760, 982, 744, 28);
      dockLamp(ctx, 1774, 745, 10);
      line(ctx, [[1482,1000],[1581,913],[1915,864]], 'rgba(172,164,151,.16)', 3);
    } else if (kind === 'ice') {
      const ice = [[0, 891],[109, 867],[157, 886],[305, 875],[367, 908],[477, 924],[445, 953],[677, 1009],[659, 1084],[0,1084]];
      polygon(ctx, ice, '#344658');
      polygon(ctx, ice.slice(0, -1).map(([x,y]) => [x, y - 17]), '#647181');
      for (let i = 0; i < 48; i++) {
        const xy = [random() * 510, 915 + random() * 161];
        line(ctx, [[xy[0], xy[1]],[xy[0]+9+random()*20,xy[1]+random()*7]], 'rgba(144,162,178,.13)');
      }
      rock(ctx, random, 153, 932, 142, 125, '#6d7c88', '#394755');
      rock(ctx, random, 323, 1003, 80, 48, '#5b6f81', '#344459');
    }
    vignette(ctx);
  });

  const waves = ripples(random, 565, horizon + 10, .72);
  const dockLights = kind === 'inlet' ? [310, 530, 1196, 1450].map(x => ({x, paint: reflectedGlowFactory(random,x,horizon+24,168,36,'193,166,120',.65)})) : [];
  const shine = reflectedGlowFactory(random, moon?.[0] ?? W * .51, horizon + 55, H - horizon - 72, 155, '172,193,204', kind === 'mud' ? .35 : .58);
  const ice = kind === 'ice' ? Array.from({ length: 26 }, (_, i) => {
    const big = i < 13;
    const x = 122 + random() * 1631, y = 632 + (big ? i * 28 : random() * 420);
    const r = big ? 15 + i * 4 + random() * 17 : 4 + random() * 19;
    const edge = Array.from({length:8}, (_, n) => {
      const angle = n / 8 * TAU + (random() - .5) * .46;
      const extent = (.73 + random() * .38) * r;
      return [Math.cos(angle) * extent, Math.sin(angle) * extent * (.22 + random() * .15)];
    });
    return [x,y,r,random() * TAU, edge,big];
  }) : [];
  const bars = kind === 'mud' ? [
    [436,719,244,18], [778,786,197,22], [-58,993,303,48],
  ].map(([x,y,radius,depth], i) => {
    const curves=Array.from({length:30},(_,n)=>{
      const a=n/30*TAU;
      const course=.87+.12*Math.sin(a*2.6+i*.7)+random()*.18;
      let xx=Math.cos(a)*radius*course, yy=Math.sin(a)*depth*(.74 + random()*.57);
      yy+=radius*(.031*Math.sin(a*3+i)+.01*Math.cos(a*5));
      return [xx,yy];
    });
    return [x,y,curves,i];
  }) : [];
  const shelfEdge = [[W + 16, 725], [1746, 743], [1607, 761], [1547, 788],
    [1381, 806], [1242, 809], [1158, 832], [1104, 852], [1155, 883], [1259, 897],
    [1297, 925], [1244, 946], [1128, 959], [1018, 976], [972, 1009], [1026, 1030],
    [1057, 1051], [1032, H + 14]];
  const tidalShelf = kind === 'mud' ? renderSurface(createCanvas, ctx => {
    const edge = shelfEdge.map(([x, y], index) => [x - (index === 0 ? 0 : 16 + index * .65), y + 4]);
    const foot = [W + 28, H + 14];
    polygon(ctx, [...edge, foot], '#344049');
    polygon(ctx, [...shelfEdge, foot], flat(ctx, 730, H, [[0, '#555452'], [.44, '#55524f'], [1, '#413f45']]));

    ctx.save();
    ctx.beginPath(); ctx.moveTo(...shelfEdge[0]);
    shelfEdge.slice(1).forEach(point => ctx.lineTo(...point));
    ctx.lineTo(...foot); ctx.closePath(); ctx.clip();
    for (let row = 0; row < 155; row++) {
      const x = 1050 + random() * 926;
      const y = 733 + random() * 366;
      line(ctx, [[x, y], [x + 17 + random() * 125, y - 2 - random() * 9]],
        row % 4 ? 'rgba(23,38,43,.17)' : 'rgba(154,145,131,.15)', .8 + random() * 1.2);
    }
    for (const [x, y, rx, ry] of [[1710, 891, 164, 17], [1638, 1019, 195, 22], [1423, 911, 56, 8]]) {
      glow(ctx, x, y, rx, ry, '31,50,57', .47);
    }
    ctx.restore();
  }) : null;
  const surf = kind === 'cliff' ? foamPlan(random, u => [208 + u * 489, 743 + 337 * u], 145) : [];
  const ferryWake = kind === 'fjord' ? Array.from({length:100}, (_, index) => ({
    offset: random(),
    side: index % 2 ? 1 : -1,
    drift: (random() - .5) * 126,
    strength: .035 + random() * .185,
    width: 18 + random() * 58,
  })) : [];
  const boats = [[432,horizon+107,93,.1],[708,horizon+42,55,1.3],[1004,horizon+84,85,2.4],[1530,horizon+140,134,3.7]];
  return (ctx, phase) => {
    const t = tau(phase);
    ctx.drawImage(base, 0, 0);
    drawRipples(ctx, waves, t, kind === 'ice' ? '173,201,214' : '153,182,191', 1.1);
    shine(ctx,t);
    dockLights.forEach(light => light.paint(ctx,t));
    if (kind === 'inlet') {
      for (const [x,y,s,a] of boats) {
        const drift = 2.3 * Math.sin(t + a);
        ctx.save();
        ctx.translate(x + drift * .37, y + drift);
        ctx.rotate(Math.sin(t + a) * .024);
        ellipse(ctx, 4, 11, s * .64, 4, 'rgba(11,19,30,.54)');
        polygon(ctx, [[-s*.66,-8],[s*.61,-9],[s*.44,7],[-s*.51,9]], '#212631');
        line(ctx, [[-s*.59,-4],[s*.54,-5]], '#716255', 2);
        polygon(ctx, [[-s*.29,-9],[-s*.25,-25],[s*.18,-25],[s*.26,-10]], '#3b3d41');
        line(ctx, [[s*.17,-10],[s*.14,-s*.63]], '#77737a', 2);
        ctx.fillStyle = '#d7a76f'; ctx.fillRect(-s*.16,-21,s*.17,6);
        glow(ctx,-s*.07,-18,18,12,'225,174,117',.30);
        ctx.restore();
      }
    } else if (kind === 'cliff') {
      sweepFoam(ctx, surf, 38, t);
    } else if (kind === 'fjord') {
      drawFerryWake(ctx, ferryWake, horizon + 41, t);
    } else if (kind === 'mud') {
      ctx.drawImage(tidalShelf, 0, 0);
      for (const [x,y,curves,id] of bars) {
        ctx.save();ctx.translate(x,y);
        polygon(ctx,curves.map(([px,py])=>[px,py+3]),'#2d323a');
        polygon(ctx,curves,flat(ctx,-45,48,[[0,'#69615c'],[.62,'#605757'],[1,'#43424a']]));
        for (let i=1;i<14;i++) {
          if ((id+i)%3===0) continue;
          const [a,b]=curves[i], [c,d]=curves[i+1];
          const surge = Math.sin(t*2+id*.7+i*.61);
          line(ctx,[[a+3,b+2+surge*2.4],[a*.55+c*.45,b*.55+d*.45+3+surge*2.4],[c,d+2+surge*2.4]],
            'rgba(173,159,145,'+(.12+surge*.075)+')', 1.4+(id%3)*.38);
        }
        ctx.restore();
      }
      for (let i = 5; i <= 11; i++) {
        if (i === 7 || i === 10) continue;
        const [a, b] = shelfEdge[i], [c, d] = shelfEdge[i + 1];
        const wash = Math.sin(t * 2 - i * 1.13);
        const offset = -20 + wash * 4;
        line(ctx, [[a + offset, b], [a * .64 + c * .36 + offset - 4, b * .64 + d * .36 + 2],
          [a * .23 + c * .77 + offset, b * .23 + d * .77]],
          'rgba(164,166,155,' + (.07 + .06 * wash) + ')', 1.5);
      }
    } else if (kind === 'ice') {
      for (const [x,y,r,a,edge,big] of ice) {
        const xx=x+Math.sin(t+a)*r*.32, yy=y+Math.cos(t+a)*3;
        ctx.save();ctx.translate(xx,yy);ctx.rotate(Math.sin(t+a)*.024+a*.025-.07);
        if(big) polygon(ctx,edge.map(([px,py])=>[px,py+3.1]),'#233e4f');
        polygon(ctx,edge,big?'#71868f':'#5c7887');
        if(big) line(ctx,[edge[1],edge[2],edge[3]],'rgba(190,207,208,.40)',1.2);
        ctx.restore();
      }
    }
    ctx.drawImage(foreground, 0, 0);
  };
}

function reflectedGlowFactory(random, x, top, depth, width, color, intensity) {
  const strips = Array.from({ length: 76 }, () => [random(), random(), random(), random() * TAU]);
  return (ctx, t) => {
    glow(ctx, x, top + depth * .40, width * .67, depth * .65, color, intensity * .11);
    for (const [d, shift, len, angle] of strips) {
      const wave = Math.sin(t * (d < .45 ? 2 : 3) + angle);
      const offset = (shift * 2 - 1 + wave * .29) * width * (.30 + d * .7);
      ctx.fillStyle = 'rgba(' + color + ',' + intensity * (1 - d) * (.05 + len * .19) * (.59 + wave * .34) + ')';
      ctx.fillRect(x + offset, top + d * depth, (3 + width * len * .45) * (.21 + d * .79), .7 + d * 1.6);
    }
  };
}

const scenes = [
  ['26', '해식 절벽 아래의 밤 파도', 'night-surf-below-the-cliff', 'sea', '절벽 밑에 부서지는 파도', coast, {kind:'cliff',horizon:547,tint:'plum',moon:[1406,257,22],seed:546390}],
  ['27', '작은 어항에 잠든 배들', 'sleeping-boats-in-the-harbor', 'lake', '정박한 배 곁의 잔물결', coast, {kind:'inlet',horizon:535,tint:'warm',moon:null,seed:422803}],
  ['28', '피오르를 빠져나오는 여객선', 'ferry-leaving-the-fjord', 'sea', '배 뒤로 흐르는 물소리', coast, {kind:'fjord',horizon:590,tint:'cold',moon:[1024,232,22],seed:602457}],
  ['35', '달빛이 썰물에 드러낸 모래섬', 'sandbars-under-a-low-moon', 'sea', '갯벌로 스며드는 잔물결', coast, {kind:'mud',horizon:468,tint:'plum',moon:[536,325,32],seed:938504}],
  ['37', '얼음 조각이 떠가는 겨울 바닷가', 'winter-sea-with-drifting-ice', 'wind', '겨울 바닷가의 바람 소리', coast, {kind:'ice',horizon:519,tint:'cold',moon:[1241,166,29],seed:846205}],
];

function reed(ctx, x, y, size, lean, color, sway = 0) {
  const top = y - size;
  const bend = x + lean * size + sway;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size * .035);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * size * .34, y - size * .54, bend, top);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + lean * size * .35, y - size * .47);
  ctx.quadraticCurveTo(x + size * .29 + sway * .4, y - size * .72, x + size * .41 + sway * .7, y - size * .66);
  ctx.quadraticCurveTo(x + size * .20 + sway * .3, y - size * .64, x + lean * size * .35, y - size * .39);
  ctx.fill();
}

function woodSurface(ctx, random, path, minX, maxX, minY, maxY, tone) {
  polygon(ctx, path, tone);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(...path[0]);
  for (let index = 1; index < path.length; index++) ctx.lineTo(...path[index]);
  ctx.closePath(); ctx.clip();
  for (let i = 0; i < 360; i++) {
    const x = minX + random() * (maxX - minX), y = minY + random() * (maxY - minY);
    line(ctx, [[x,y],[x + random()*82,y - random()*5]], i % 4 === 0 ? 'rgba(158,142,118,.16)' : 'rgba(12,14,22,.22)', 1 + random() * 2);
  }
  ctx.restore();
}

function catchRipples(ctx, x, y, width, t, color, phase = .7) {
  for (let i = 0; i < 3; i++) {
    const time = ((t / TAU + i / 3 + phase) % 1);
    const ring = width * (.15 + time * .85);
    ctx.strokeStyle = 'rgba(' + color + ',' + Math.sin(time * Math.PI) * .28 + ')';
    ctx.lineWidth = 1 + (1 - time) * 1.4;
    ctx.beginPath();
    ctx.ellipse(x, y, ring, ring * .24, 0, Math.PI * .13, Math.PI * 1.06);
    ctx.stroke();
  }
}

function bridge(ctx, random, x, y, width, height, material) {
  const dark = material === 'stone' ? '#22313a' : '#2f3033';
  const trim = material === 'stone' ? '#515654' : '#61564c';
  const right = x + width, center = x + width * .5, short = y + height * 1.36;
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.quadraticCurveTo(center, y - height * .42, right, y - height * .04);
  ctx.lineTo(right,short); ctx.lineTo(right-width*.15,short);
  ctx.bezierCurveTo(right-width*.17, y-height*.52, x+width*.16, y-height*.38, x+width*.15, short);
  ctx.lineTo(x,short); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = trim; ctx.lineWidth = Math.max(2, height * .07);
  ctx.beginPath(); ctx.moveTo(x,y);
  ctx.quadraticCurveTo(center, y - height * .42, right, y - height * .04); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + width * .15,short);
  ctx.bezierCurveTo(x+width*.16, y-height*.38, right-width*.17, y-height*.52, right-width*.15, short); ctx.stroke();
  if (material === 'stone') {
    for (let i = 0; i < 55; i++) {
      const u = random(), h = random();
      if (h < .25 || u < .15 || u > .85) {
        const px = x + width*u, py = y + h*height;
        line(ctx,[[px,py],[px+13+random()*16,py]], 'rgba(162,158,144,.18)', 1.3);
      }
    }
  } else {
    for (let i = 0; i <= 9; i++) {
      const u = i / 9, top = y - Math.sin(u * Math.PI) * height * .2;
      post(ctx,x+u*width,top + 7, top - height * .47, 8, '#63564c','#39363b');
    }
    ctx.strokeStyle = trim; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x,y-height*.44); ctx.quadraticCurveTo(center,y-height*.85,right,y-height*.42); ctx.stroke();
  }
}

function buildChannel(scene, createCanvas) {
  const random = randomFrom(scene.seed);
  const {horizon,tint,moon,mode} = scene;
  const shade = mode === 'mangrove' ? '#182c30' : '#26383d';
  const base = renderSurface(createCanvas, ctx => {
    sky(ctx,random,horizon,tint,moon);
    bodyOfWater(ctx,horizon,tint);
    ridge(ctx,random,horizon + 2,222,'#3b4c50',u => .11+ .32 * Math.abs(u-.57)+ .08*Math.sin(u*27),.061);
    ridge(ctx,random,horizon + 17,148,shade,u => .09+ .42*Math.pow(Math.abs(u-.54),.72)+ .13*Math.sin(u*25),.10);
    grain(ctx,random,7400,horizon);
  });
  const foreground = renderSurface(createCanvas, ctx => {
    if (mode === 'marsh') {
      polygon(ctx,[[0,666],[286,625],[572,651],[380,669],[659,697],[614,802],[439,899],[347,1080],[0,1080]],'#263938');
      polygon(ctx,[[W,628],[1470,638],[1368,663],[1567,693],[1430,779],[1588,857],[1491,970],[1039,1080],[W,1080]],'#253936');
      for (let i = 0; i < 268; i++) {
        const edge = random();
        const x = edge < .4 ? random() ** .71 * (470+random()*250) : 1381+random()*589;
        const y = 660+ random()**1.18*455;
        reed(ctx,x,y,12 + (y-600)*(.07+random()*.18),(random()-.5)*.72,edge < .4 ? '#596758' : '#61705b');
      }
      const path = [[32,H],[435,H],[900,664],[852,651]];
      woodSurface(ctx,random,path,22,910,650,H,'#3b4140');
      for (let i = 0; i < 34; i++) {
        const u = (i/34)**1.65;
        const y = 662+u*427;
        const x = 853-823*u;
        line(ctx,[[x,y-8*Math.sin(u)],[x+43+376*u,y+14*u]], '#202d31',1+u*5);
      }
      for (const [x,y,s] of [[441,1021,1.1],[600,892,.78],[750,774,.49],[834,713,.31]]) {
        post(ctx,x,y,y-88*s,19*s);
      }
      line(ctx,[[447,944],[610,837],[754,733],[839,685]],'#494c43',9);
    } else if (mode === 'canal') {
      const leftWall = [[0,545],[797,577],[897,634],[0,938]];
      const rightWall = [[1243,574],[W,484],[W,920],[1255,632]];
      polygon(ctx,leftWall,flat(ctx,535,H,[[0,'#58605f'],[1,'#27343a']]));
      polygon(ctx,rightWall,flat(ctx,475,H,[[0,'#6e6865'],[1,'#313940']]));
      for (let index = 0; index < 10; index++) {
        const y = 565 + index * 32;
        line(ctx,[[0,y],[796,586+index*4.7]],'rgba(21,29,40,.45)',2);
        if (index < 8) line(ctx,[[1267,578+index*6.5],[W,501+index*48]],'rgba(24,31,40,.45)',2.4);
      }
      bridge(ctx,random,678,588,688,65,'stone');
      dockLamp(ctx,404,552,14,'214,151,102');
      dockLamp(ctx,1516,556,12,'226,157,100');
      dockLamp(ctx,1192,580,7,'211,165,119');
      polygon(ctx,[[0,863],[451,772],[390,822],[0,1008]],'#303a40');
      for (let i = 0; i < 6; i++) {
        const y = 871 + i*18;
        line(ctx,[[0,y],[423-i*12,796+i*5]],'rgba(167,160,143,.25)',2+i*.38);
      }
    } else if (mode === 'boathouse') {
      const wall = [[1108,401],[1639,365],[1820,529],[1789,780],[1108,735]];
      woodSurface(ctx,random,wall,1108,1818,361,784,flat(ctx,402,810,[[0,'#5c5148'],[1,'#2d2e31']]));
      polygon(ctx,[[1067,413],[1214,278],[1652,331],[1835,498],[1762,477],[1622,373],[1108,442]],'#252a33');
      line(ctx,[[1067,407],[1214,274],[1651,326],[1839,493]],'#6f6968',9);
      polygon(ctx,[[1108,435],[1220,329],[1617,376],[1122,469]],'#3d3738');
      for (let i = 0; i < 38; i++) {
        const x = 1112 + i * 15;
        line(ctx,[[x,435-(x-1120)*.126],[x-2,736+(x-1120)*.063]], i%4 ? 'rgba(31,28,28,.52)' : 'rgba(192,141,96,.14)',1.2);
      }
      polygon(ctx,[[1365,464],[1584,438],[1559,748],[1356,731]],'#1c252f');
      line(ctx,[[1371,456],[1593,432],[1571,749]],'#746057',11);
      glow(ctx,1465,511,105,92,'220,148,100',.2);
      ctx.fillStyle='#a77753'; ctx.fillRect(1166,513,86,76);
      ctx.fillStyle='#d39867'; ctx.fillRect(1175,521,65,62);
      line(ctx,[[1206,522],[1206,584]],'#775647',5);
      line(ctx,[[1174,550],[1240,550]],'#775647',5);
      polygon(ctx,[[1076,730],[1811,770],[1830,827],[1072,793]],'#4b4642');
      line(ctx,[[1072,731],[1804,773]],'#796f61',7);
      for (const [x,y] of [[1112,846],[1314,844],[1647,893],[1764,924]]) post(ctx,x,y,y-110,28,'#635949','#332f30');
      const dock = [[1487,H],[W,H],[W,837],[1738,863]];
      woodSurface(ctx,random,dock,1480,W,834,H,'#3c3b3b');
    } else if (mode === 'mangrove') {
      polygon(ctx,[[0,563],[433,561],[697,589],[548,629],[601,713],[472,677],[302,766],[217,881],[0,952]],'#1a2a2d');
      polygon(ctx,[[W,546],[1534,571],[1424,619],[1469,682],[1621,730],[1740,822],[W,912]],'#1c2a2b');
      for (const [x,y,s] of [[-31,877,1.2],[211,787,.93],[452,680,.70],[580,630,.47],[1601,768,.86],[1786,853,1.07],[1944,978,1.45]]) {
        const canopy = y - s * 445;
        line(ctx,[[x - 17*s,y - 5*s],[x + 19*s,y-s*175],[x-29*s,canopy]],'#273534',43*s);
        for (let i = 0; i < 9; i++) {
          const sign = random() > .5 ? 1 : -1, run = sign * (32 + random()*152)*s;
          ctx.strokeStyle = i%3 ? '#1d2c2e' : '#3d4540'; ctx.lineWidth = (5+random()*10)*s;
          ctx.beginPath(); ctx.moveTo(x + 18*s,y-195*s+random()*40*s);
          ctx.quadraticCurveTo(x+run*.59,y-43*s,x+run,y+(random()-.5)*45*s); ctx.stroke();
        }
        for (let i = 0; i < 62; i++) {
          const xx=x+(random()-.48)*319*s, yy=canopy+(random()-.42)*192*s;
          ellipse(ctx,xx,yy,18*s+random()*64*s,8*s+random()*31*s,i%5 ? '#243c39' : '#3d5146');
        }
      }
    } else if (mode === 'lotus') {
      const banks = [
        [[0,568],[167,581],[290,569],[433,584],[532,573],[618,586],[638,613],[661,636],
          [630,658],[568,655],[515,683],[428,672],[324,698],[215,685],[117,709],[0,701]],
        [[1323,582],[1432,577],[1510,593],[1652,577],[1780,592],[W,569],[W,718],[1772,716],
          [1647,693],[1540,704],[1455,676],[1382,680],[1306,648],[1274,625]],
      ];
      for (const bank of banks) {
        polygon(ctx, bank.map(([x, y]) => [x, y + 10]), '#172a32');
        polygon(ctx, bank, flat(ctx, 570, 720, [[0, '#35413d'], [.64, '#313b38'], [1, '#283938']]));
      }
      line(ctx, [[344,604],[446,599],[540,604],[607,596]], 'rgba(128,115,93,.22)', 2.8);
      line(ctx, [[1345,594],[1411,592],[1500,606],[1610,599]], 'rgba(128,115,93,.24)', 2.8);
      for (const [x, y, size, bend] of [[245,672,23,-.2],[444,652,17,-.35],[530,663,23,-.12],
        [1415,661,21,.24],[1507,669,19,.28],[1660,684,28,-.22]]) {
        reed(ctx, x, y, size, bend, '#4c5843');
      }
      ellipse(ctx, 651, 735, 63, 8, 'rgba(12,20,28,.47)');
      ellipse(ctx, 1298, 737, 67, 8, 'rgba(12,20,28,.45)');
      bridge(ctx,random,606,595,742,105,'wood');
      post(ctx,389,758,622,18);
      dockLamp(ctx,398,619,12,'221,162,107');
      post(ctx,1440,789,641,19);
      dockLamp(ctx,1449,638,11,'227,173,119');
      for (let i=0; i<110; i++) {
        const right = i%7 > 1, x = right ? 1438+random()*489 : random()*455;
        const y = 777+random()*301;
        reed(ctx,x,y,22 + random()*76,(random()-.5)*.62,'#384b43');
      }
    }
    grain(ctx,random,1200,horizon);
    vignette(ctx);
  });
  const waves = ripples(random,600,horizon,.76);
  const featureX = mode === 'boathouse' ? [1208] : mode === 'canal' ? [414,1495] : mode === 'lotus' ? [398,1449] : [moon?.[0] ?? 1043];
  const glowDraws = featureX.map(x => reflectedGlowFactory(random,x,horizon + (mode==='boathouse'?180:88),H-horizon-160,78,mode==='marsh' || mode === 'mangrove' ? '167,193,198' : '217,152,98',.83));
  const floating = Array.from({length:mode === 'lotus' ? 24 : 10},(_,i)=>[327+random()*1344,horizon+90+(H-horizon-110)*random(),25+random()*46,random()*TAU,i%7 === 1]);
  const reeds = Array.from({length:62},()=>[random()>.55?1410+random()*540:random()*546,689+random()*405,14+random()*55,random()*TAU]);
  return (ctx,phase) => {
    const t = tau(phase);
    ctx.drawImage(base,0,0);
    drawRipples(ctx,waves,t,'154,183,185',.71);
    glowDraws.forEach(draw=>draw(ctx,t));
    if (mode === 'marsh' || mode === 'mangrove') catchRipples(ctx,1143,798,93,t,'144,190,182',.16);
    if (mode === 'boathouse') {
      catchRipples(ctx,1259,877,133,t,'196,171,142',.22);
      const xx = 790 + Math.cos(t)*19, yy = 861 + Math.sin(t)*4;
      ctx.save(); ctx.translate(xx,yy); ctx.rotate(Math.sin(t)*.043);
      ellipse(ctx,0,9,132,11,'rgba(13,21,32,.7)');
      polygon(ctx,[[-133,-1],[84,-18],[122,-10],[93,20],[-68,23]],'#48443d');
      line(ctx,[[-132,-2],[-38,4],[86,-15],[121,-10]],'#8a7256',4);
      line(ctx,[[-84,10],[79,4]],'#252b30',4);
      ctx.restore();
    }
    if (mode === 'lotus' || mode === 'mangrove') {
      for (const [x,y,width,shift,flower] of floating) {
        const xx=x+Math.sin(t+shift)*19, yy=y+Math.cos(t+shift)*4;
        if (mode === 'mangrove') {
          ellipse(ctx,xx,yy,width*.26,2.6,'rgba(101,115,76,.70)');
        } else {
          ellipse(ctx,xx,yy,width,width*.24,'#40514b');
          polygon(ctx,[[xx+width*.15,yy],[xx+width*.95,yy-5],[xx+width*.82,yy+8]],'#304344');
          line(ctx,[[xx-width*.69,yy+1],[xx+width*.36,yy+1]],'rgba(146,147,115,.38)',1.2);
          if (flower) {
            ellipse(ctx,xx-width*.28,yy-7,10,5,'#b78a8a');
            ellipse(ctx,xx-width*.27-4,yy-10,5,7,'#a26f81');
          }
        }
      }
    }
    ctx.drawImage(foreground,0,0);
    if (mode === 'marsh' || mode === 'lotus') {
      for (const [x,y,size,shift] of reeds) reed(ctx,x,y,size,Math.sin(shift)*.3,'rgba(106,125,90,.6)',Math.sin(t+shift)*size*.14);
    }
  };
}

scenes.push(
  ['31', '염습지에 놓인 새벽 나무길', 'boardwalk-over-the-salt-marsh', 'wind', '갈대 사이로 스치는 바람', buildChannel, {mode:'marsh',horizon:541,tint:'fog',moon:[1218,168,23],seed:561401}],
  ['32', '돌다리 밑으로 흐르는 밤 운하', 'old-stone-canal-after-midnight', 'lake', '운하에 부딪히는 물소리', buildChannel, {mode:'canal',horizon:575,tint:'warm',moon:null,seed:405009}],
  ['33', '잔물결 위에 불 켠 보트 창고', 'window-of-the-quiet-boathouse', 'lake', '창고 아래 고요한 잔물결', buildChannel, {mode:'boathouse',horizon:583,tint:'plum',moon:[544,297,23],seed:841291}],
  ['34', '맹그로브 숲길 끝의 물빛', 'mangrove-water-at-first-light', 'forest', '나무뿌리 사이 흐르는 물', buildChannel, {mode:'mangrove',horizon:545,tint:'fog',moon:[1093,239,20],seed:134004}],
  ['40', '연잎이 흔들리는 나무다리', 'lotus-pond-under-the-footbridge', 'lake', '연잎 사이 번지는 잔물결', buildChannel, {mode:'lotus',horizon:547,tint:'plum',moon:[1284,175,21],seed:436876}],
);

function buildPools(scene, createCanvas) {
  const random = randomFrom(scene.seed);
  const terrace = scene.mode === 'terrace';
  const horizon = terrace ? 287 : 0;
  const pools = terrace
    ? [
        [1210,374,370,54,[[824,374],[890,350],[1048,329],[1240,336],[1390,354],[1525,359],[1568,380],[1524,398],[1453,404],[1320,397],[1181,405],[1062,417],[947,413],[845,399]]],
        [1054,473,532,69,[[518,468],[636,438],[797,446],[964,425],[1155,435],[1298,425],[1444,440],[1572,445],[1620,477],[1566,506],[1444,516],[1272,505],[1090,535],[885,520],[733,527],[558,500]]],
        [879,589,618,75,[[208,583],[270,559],[455,543],[592,553],[743,540],[850,561],[1029,557],[1213,539],[1428,556],[1508,582],[1524,612],[1450,642],[1343,657],[1195,654],[1033,681],[828,655],[644,669],[477,643],[310,639],[231,620]]],
        [1027,732,731,80,[[253,732],[307,697],[503,687],[659,687],[823,707],[1007,698],[1198,694],[1288,683],[1442,672],[1608,697],[1746,723],[1798,751],[1751,785],[1624,804],[1481,803],[1331,799],[1152,831],[985,821],[821,834],[692,811],[571,810],[470,788],[331,783]]],
        [693,907,838,87,[[0,850],[126,839],[304,865],[443,848],[578,858],[795,872],[954,859],[1116,883],[1271,869],[1436,885],[1618,913],[1650,946],[1590,962],[1471,964],[1345,996],[1066,987],[864,1012],[677,999],[454,1006],[273,984],[83,958],[0,945]]],
        [434,1073,872,83,[[0,981],[103,1002],[242,1001],[408,1045],[594,1034],[755,1049],[884,1037],[1066,1048],[1224,1036],[1389,1063],[1454,1100],[0,1100]]],
      ]
    : [[950,558,790,471,Array.from({length:94},(_,i)=>{
      const angle=i/94*TAU;
      const swell=.84+.11*Math.cos(angle*3+.9)+.13*Math.sin(angle*4-1.6)+.06*Math.cos(angle*7+1);
      const notch=.93+.11*Math.cos(angle*5-2)+(i % 7 === 0 ? -.025 : 0);
      return [944+Math.cos(angle)*828*swell,548+Math.sin(angle)*482*notch+65*Math.sin(angle*2+1.4)];
    })]];
  const margins = pools.map(([x,y,rx,ry,edges]) => {
    const outline=[];
    for(let n=0;n<edges.length;n++) {
      const [x0,y0]=edges[n], [x1,y1]=edges[(n+1)%edges.length];
      const count=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)/(terrace ? 16 : 17)));
      for(let j=0;j<count;j++) {
        const u=j/count, irregular=(random()-.5)*Math.sin(Math.PI*u)*(terrace?13:18);
        outline.push([x0+(x1-x0)*u,y0+(y1-y0)*u+irregular]);
      }
    }
    return outline;
  });
  function poolPath(ctx, outline) {
    ctx.beginPath(); ctx.moveTo(...outline[0]);
    for (let index=1;index<outline.length;index++) ctx.lineTo(...outline[index]);
    ctx.closePath();
  }
  const base = renderSurface(createCanvas, ctx => {
    if (terrace) {
      sky(ctx,random,horizon,'warm',[1294,126,21]);
      ridge(ctx,random,horizon+4,159,'#414952',u => .13+Math.sin(u*16)*.23+.38*Math.abs(u-.48),.071);
      ridge(ctx,random,horizon+20,99,'#303d48',u => .16+Math.sin(u*11+2)*.20,.114);
    }
    ctx.fillStyle = flat(ctx,horizon,H,[[0,terrace?'#464b42':'#25353e'],[1,terrace?'#222b32':'#141d2a']]);
    ctx.fillRect(0,horizon,W,H-horizon);
    for (const [[x,y,rx,ry],i] of pools.map((pool,index)=>[pool,index])) {
      const outline=margins[i], brown=terrace ? '#4f5145' : '#53645e';
      polygon(ctx,outline.map(([px,py])=>[px,py+(terrace?22:8)]),brown);
      polygon(ctx,outline.map(([px,py])=>[px,py+(terrace?7:4)]),terrace ? '#5a594b' : '#60716d');
      ctx.save(); poolPath(ctx,outline); ctx.clip();
      ctx.fillStyle=flat(ctx,y-ry,y+ry,[[0,terrace?'#455457':'#3f585c'],[.52,terrace?'#3d4c58':'#274854'],[1,terrace?'#2c414c':'#193643']]);
      ctx.fillRect(0,0,W,H);
      glow(ctx,x+rx*.13,y-ry*.26,rx,ry,'151,165,154',terrace?.30:.35);
      glow(ctx,x-rx*.28,y+ry*.29,rx*.82,ry*.65,terrace?'108,127,157':'86,143,125',.24);
      if (!terrace) {
        glow(ctx,1407,460,285,219,'149,167,136',.46);
        glow(ctx,558,740,229,204,'141,150,121',.25);
        const shelf=[[444,715],[539,690],[652,718],[704,751],[648,780],[597,792],[458,765]];
        polygon(ctx,shelf,'rgba(94,126,116,.30)');
        for(let index=0;index<143;index++) {
          const scatterX=435+random()*1008,scatterY=318+random()*565;
          ellipse(ctx,scatterX,scatterY,1.4+random()*3.8,.7+random()*2,
            random()<.4?'rgba(198,185,156,.18)':'rgba(45,75,71,.45)');
        }
      }
      ctx.restore();
    }
    grain(ctx,random,15000,terrace ? horizon : 0);
  });
  const front = renderSurface(createCanvas, ctx => {
    if (terrace) {
      const bankEdge = [[1628,318],[1568,346],[1514,365],[1518,394],[1550,425],[1513,454],
        [1494,491],[1471,525],[1484,552],[1445,584],[1460,624],[1489,645],[1552,676],
        [1602,708],[1562,748],[1534,775],[1508,823],[1554,861],[1510,912],[1457,954],
        [1340,1000],[1374,1031],[1325,H + 8]];
      const bank = [...bankEdge, [W + 2, H + 8], [W + 2, 295], [1762, 305]];
      polygon(ctx, bank.map(([x,y], index)=>[index < bankEdge.length ? x - 19 : x, y + 7]), '#2b3538');
      polygon(ctx, bank, flat(ctx, 298, H, [[0,'#464b43'],[.48,'#40473f'],[1,'#303b36']]));
      ctx.save(); poolPath(ctx, bank); ctx.clip();
      for (let i = 0; i < 85; i++) {
        const x = 1340 + random() * 670, y = 325 + random() * 765;
        line(ctx, [[x, y], [x + 18 + random() * 73, y - 1 - random() * 7]],
          i % 3 ? 'rgba(21,34,34,.16)' : 'rgba(160,155,119,.14)', 1 + random());
      }
      ctx.restore();
      for (let i = 1; i < bankEdge.length - 1; i += 3) {
        const [x, y] = bankEdge[i];
        const [endX, endY] = bankEdge[i + 1];
        line(ctx, [[x + 4, y], [endX + 4, endY]], 'rgba(135,128,105,.26)', 3);
      }
      for (const outline of margins) {
        for (const [x,y] of outline) {
          if (random()<.75 || x>1420) continue;
          const width=2+random()*11;
          line(ctx,[[x-width,y+5],[x+width,y+5+random()*3]],
            random()<.63?'rgba(173,169,130,.11)':'rgba(26,37,42,.34)',1+random()*1.8);
        }
      }
      for(let i=0;i<61;i++) {
        const x=1465+ random()*479,y=553 + random()*520;
        if(x+y*.44>1785) reed(ctx,x,y,12+random()*36,.09,'#5b6650');
      }
      for(const [x,y,r] of [[1620,775,104],[1720,876,113],[1850,914,163],[45,727,93],[110,906,99]]) {
        rock(ctx,random,x,y,r,r*.38,'#52564b','#31383a');
      }
    } else {
      for (let i=0;i<73;i++) {
        const a=i/73*TAU + random()*.1;
        const distance=.84+random()*.36;
        const x=961+Math.cos(a)*distance*964,y=544+Math.sin(a)*distance*520;
        const size=23 + random()*95;
        rock(ctx,random,x,y,size,22 + random()*68,i%4?'#45575b':'#637371','#24323b',25);
      }
      for (const [x,y,s,h] of [[339,330,105,63],[1418,535,142,67],[142,953,179,125],[428,985,144,86],[1655,902,171,106]]) {
        rock(ctx,random,x,y,s,h,'#65746b','#2a373a');
      }
      for(let i=0;i<223;i++) {
        const a=random()*TAU,x=937+Math.cos(a)*(774+random()*238),y=544+Math.sin(a)*(389+random()*128);
        ellipse(ctx,x,y,2+random()*5,1.7+random()*3,'rgba(172,159,137,.35)');
      }
    }
    vignette(ctx);
  });
  const lightInWater = pools.map(([x,y,rx,ry]) => Array.from({length: terrace?44:110},() => [
    x + (random()-.5)*rx*1.60, y+(random()-.5)*ry*1.24,
    9+random()*(terrace?112:195), random()*TAU, .05+random()*.20,
  ]));
  const drips = terrace ? [[578,610,75],[1225,745,92],[910,909,128]] : [[821,437,175],[1026,521,270],[1296,755,138],[607,740,134]];
  return (ctx,phase) => {
    const t=tau(phase);
    ctx.drawImage(base,0,0);
    for (let index=0;index<lightInWater.length;index++) {
      ctx.save(); poolPath(ctx,margins[index]); ctx.clip();
      for(const [x,y,width,offset,opacity] of lightInWater[index]) {
        const flow=Math.sin(t*2+offset);
        const xx=x+flow*(terrace?13:34);
        const yy=y+Math.cos(t+offset)*5;
        if (terrace) {
          line(ctx,[[xx,yy],[xx+width*.47,yy-.7],[xx+width,yy+1.2]],'rgba(207,210,192,'+opacity*(.53+flow*.43)+')',1.6);
        } else {
          line(ctx,[[xx,yy+2],[xx+width*.37,yy-3-flow*4],[xx+width*.70,yy-flow*3],[xx+width,yy+3]],'rgba(147,201,177,'+opacity*(.45+flow*.40)+')',1.65);
        }
      }
      ctx.restore();
    }
    drips.forEach(([x,y,width],i)=>catchRipples(ctx,x,y,width,t,terrace?'182,200,192':'167,211,192',.23+i*.19));
    ctx.drawImage(front,0,0);
  };
}

function millHouse(ctx, random) {
  const wall = [[1143,443],[1709,409],[W,532],[W,895],[1116,832]];
  polygon(ctx,wall,flat(ctx,412,934,[[0,'#695952'],[.64,'#3e3b3c'],[1,'#292e34']]));
  ctx.save();
  ctx.beginPath(); ctx.moveTo(...wall[0]);
  wall.slice(1).forEach(point=>ctx.lineTo(...point)); ctx.closePath();ctx.clip();
  for(let row=0;row<26;row++) {
    const y=430+row*19;
    line(ctx,[[1104,y+12],[W,y-1]],'#373437',2.7);
    for(let column=0;column<9;column++) {
      const x=1122+column*110+(row%2)*39+random()*18;
      line(ctx,[[x,y-4],[x-1,y+12]],'#403a3b',2);
      line(ctx,[[x+4,y+1],[x+21+random()*56,y]],'rgba(215,180,148,.16)',1.4);
    }
  }
  ctx.restore();
  polygon(ctx,[[1064,474],[1241,281],[1694,360],[W,472],[W,520],[1678,407],[1238,331],[1137,484]],'#2b2d34');
  line(ctx,[[1064,474],[1241,281],[1694,360],[W,472]],'#645856',8);
  polygon(ctx,[[1140,450],[1250,337],[1638,403],[1192,473]],'#473b3a');
  post(ctx,1202,798,470,16);
  for(const [x,y] of [[1289,474],[1736,540]]) {
    glow(ctx,x+30,y+28,113,107,'216,145,91',.29);
    ctx.fillStyle='#634841';ctx.fillRect(x-5,y-5,84,105);
    ctx.fillStyle='#c58a5e';ctx.fillRect(x+4,y+3,65,82);
    line(ctx,[[x+35,y+3],[x+35,y+86]],'#775144',6);
    line(ctx,[[x+4,y+38],[x+69,y+38]],'#775144',5);
  }
}

function wheel(ctx, x, y, radius, t) {
  ctx.save(); ctx.translate(x,y); ctx.scale(.91,1);
  for(const [ring,width,color] of [[radius+2,16,'#2b2a2b'],[radius-6,7,'#80705a'],[radius*.83,8,'#6e594a'],[15,17,'#8e7661']]) {
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(0,0,ring,0,TAU);ctx.stroke();
  }
  ctx.rotate(t);
  for(let i=0;i<13;i++) {
    const a=i*TAU/13;
    const sins=Math.sin(a), cos=Math.cos(a);
    const px=cos*radius,py=sins*radius;
    line(ctx,[[0,0],[px*.93,py*.93]],i%2?'#796650':'#625548',8);
    line(ctx,[[px-cos*16+sins*21,py-sins*16-cos*21],[px+cos*9+sins*21,py+sins*9-cos*21]],'#58473c',14);
    line(ctx,[[px-cos*16+sins*21,py-sins*16-cos*21],[px+cos*9+sins*21,py+sins*9-cos*21]],'#9b8061',2);
  }
  ctx.restore();
}

function buildShelter(scene, createCanvas) {
  const random = randomFrom(scene.seed);
  const {mode,horizon,tint,moon} = scene;
  const base=renderSurface(createCanvas,ctx=>{
    sky(ctx,random,horizon,tint,moon);
    bodyOfWater(ctx,horizon,tint);
    ridge(ctx,random,horizon+10,178,'#435861',u=>.2+Math.cos(u*16)*.13+.40*Math.abs(u-.51),.06);
    ridge(ctx,random,horizon+19,125,'#293a46',u=>.14 + Math.sin(u*19)*.16+.50*Math.abs(u-.47),.07);
    if(mode==='mill') millHouse(ctx,random);
    if(mode==='cascade') {
      const shoulder=[[0,277],[185,127],[372,191],[513,180],[700,279],[832,242],[1083,418],[990,514],[1045,616],[973,773],[891,732],[0,838]];
      polygon(ctx,shoulder,flat(ctx,165,884,[[0,'#44565a'],[.48,'#354649'],[1,'#1c3438']]));
      for(let i=0;i<40;i++) {
        const y=253+i*14.7;
        const x=random()*687*(.71+.34*Math.sin(i));
        rock(ctx,random,x,y,35+random()*101,19+random()*50,i%4?'#40534d':'#52665e','#23383b');
      }
      polygon(ctx,[[465,298],[548,302],[620,332],[667,346],[728,363],[807,392],[847,425],
        [811,443],[720,434],[688,418],[620,412],[553,391],[504,364]],'#334b4b');
      polygon(ctx,[[531,325],[638,346],[706,366],[763,387],[779,402],[809,411],[823,429],
        [777,435],[750,419],[740,406],[684,394],[624,369],[562,356]],'#46605b');
      line(ctx,[[700,388],[741,402],[769,423],[813,429]],'rgba(161,188,174,.47)',3.4);
      line(ctx,[[824,437],[859,447],[875,467],[911,475]],'#263e41',8);
    }
    grain(ctx,random,6500,horizon);
  });
  const foreground=renderSurface(createCanvas,ctx=>{
    if(mode==='grotto') {
      const shell=[[0,0],[W,0],[W,H],[1465,H],[1543,957],[1503,816],[1522,705],[1476,620],[1526,544],[1502,426],[1420,360],[1400,252],[1327,180],[1157,183],[1071,119],[1011,138],[873,139],[782,228],[668,243],[546,506],[515,613],[478,737],[442,855],[488,H],[0,H]];
      polygon(ctx,shell,flat(ctx,0,H,[[0,'#1b202c'],[.56,'#23333c'],[1,'#182830']]));
      for(let i=0;i<57;i++) {
        const side=i%2===0, y=52+random()*1053;
        const x=side?random()**.6*(y<300?876:478):W-random()**.6*(y<300?595:380);
        const size=24+random()*119;
        rock(ctx,random,x,y,size,23+random()*91,i%4?'#34424a':'#4b5a60','#212e36',23);
      }
      for(let i=0;i<7;i++) {
        const x=571 + i*140,y=22+random()*51;
        polygon(ctx,[[x-18,y],[x+38,y],[x+22,y+33+random()*146],[x+1,y+15]],'#202a32');
      }
    } else if (mode==='cascade') {
      for(const [x,y,r] of [[53,841,164],[241,936,133],[940,844,82],[1543,1002,154],[1743,1024,152],[1874,942,87]]) rock(ctx,random,x,y,r,r*.52,'#536563','#243741');
      for(let i=0;i<73;i++) {
        const x=i%6<2?1390+random()*582:random()*258;
        const y=903+random()*184;
        reed(ctx,x,y,15+random()*53,(random()-.5)*.46,'#405750');
      }
    } else {
      for (const [x,y,r] of [[1540,829,73],[1740,902,72],[1853,926,122],[1604,1029,262],[39,1004,178]]) rock(ctx,random,x,y,r,r*.59,'#4e5654','#28353a');
    }
    vignette(ctx);
  });
  const waves=ripples(random,626,horizon,.74);
  const shine=reflectedGlowFactory(random,mode==='mill'?1365:(moon?.[0]??977),horizon+41,H-horizon-55,mode==='mill'?120:139,mode==='mill'?'212,145,95':'171,205,206',.84);
  const trickles=Array.from({length:74},()=>[random(),random(),18+random()*44,.08+random()*.32]);
  const mist=Array.from({length:31},()=>[735+random()*130,783+random()*43,random()*TAU,15+random()*29]);
  return (ctx,phase)=>{
    const t=tau(phase);
    ctx.drawImage(base,0,0);
    drawRipples(ctx,waves,t,'157,180,185');
    shine(ctx,t);
    if(mode==='cascade') {
      const volume=flat(ctx,423,824,[[0,'rgba(157,189,177,.38)'],[.26,'rgba(142,181,174,.18)'],[.76,'rgba(160,197,185,.24)'],[1,'rgba(113,180,159,.07)']]);
      polygon(ctx,[[769,422],[811,429],[813,490],[805,568],[812,654],[837,786],
        [860,822],[727,814],[755,784],[770,641],[771,526],[778,459]],volume);
      for(const [strand, offset, length, opacity] of trickles) {
        const travel=(t/TAU*2+offset)%1;
        const yy=423+travel*393;
        const width=39+49*travel**2;
        const x=791+(strand-.5)*width+Math.sin(travel*5.7)*3;
        const tail=Math.min(822,yy+length*(.65+travel*.35));
        const fade=Math.sin(Math.PI*travel)**.53;
        if (fade > .006) line(ctx,[[x,yy],[x+(strand-.5)*(tail-yy)*.18,tail]],
          'rgba(186,215,205,'+fade*opacity+')',1+strand*1.45);
      }
      for (const [x,y,shift,s] of mist) {
        const v=Math.sin(t*2+shift);
        glow(ctx,x+v*17,y+v*6,s,7+s*.21,'162,201,186',.032+.045*(.55+v*.44));
      }
      for (let i=0;i<3;i++) {
        const glide=(t/TAU+i/3+.15)%1;
        const radius=38+glide*108;
        ctx.strokeStyle='rgba(168,202,187,'+Math.sin(Math.PI*glide)*.20+')';
        ctx.lineWidth=1.7-glide*.5;
        ctx.beginPath();
        ctx.ellipse(793,827+glide*11,radius,radius*.18,0,.17,1.21);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(793,827+glide*11,radius,radius*.18,0,1.46,2.76);
        ctx.stroke();
      }
    } else if(mode==='mill') {
      const rimWater = 851;
      glow(ctx, 1208, 867, 172, 28, '10,24,36', .48);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, rimWater);
      ctx.clip();
      wheel(ctx,1202,724,146,t);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, rimWater, W, H - rimWater);
      ctx.clip();
      ctx.globalAlpha = .25;
      wheel(ctx,1202,724,146,t);
      ctx.restore();
      glow(ctx, 1202, rimWater + 7, 105, 11, '41,63,69', .37);
      catchRipples(ctx,1187,rimWater + 7,124,t,'147,166,162',.27);
      catchRipples(ctx,1230,rimWater + 14,93,t,'152,174,168',.69);
    } else {
      catchRipples(ctx,992,922,134,t,'163,191,202',.28);
      catchRipples(ctx,1172,723,78,t,'154,200,201',.62);
    }
    ctx.drawImage(foreground,0,0);
  };
}

scenes.push(
  ['29', '조수 웅덩이에 남은 달빛', 'moonlight-in-a-tide-pool', 'sea', '갯바위 틈에 고인 물소리', buildPools, {mode:'tidepool',seed:815942}],
  ['30', '물 채운 다랑논의 푸른 새벽', 'flooded-rice-terraces-before-dawn', 'lake', '논두렁 물길의 잔잔한 소리', buildPools, {mode:'terrace',seed:945628}],
  ['36', '해식동굴 밖 달빛 물결', 'moonlit-water-through-the-grotto', 'sea', '동굴 입구에 닿는 바닷물', buildShelter, {mode:'grotto',horizon:564,tint:'cold',moon:[1015,309,26],seed:273589}],
  ['38', '깊은 골짜기의 작은 밤 폭포', 'small-waterfall-in-the-dark-gorge', 'cascade', '바위를 타고 쏟아지는 물소리', buildShelter, {mode:'cascade',horizon:588,tint:'fog',moon:[1384,220,23],seed:912603}],
  ['39', '강가 물레방앗간의 새벽 불빛', 'lamplit-watermill-before-dawn', 'lake', '물레 밑을 지나는 강물', buildShelter, {mode:'mill',horizon:549,tint:'warm',moon:[628,246,18],seed:143607}],
);

module.exports = scenes.sort(([left], [right]) => Number(left) - Number(right)).map(([id,title,slug,sound,soundLabel,render,settings]) => ({
  id,title,slug,sound,soundLabel,createScene(createCanvas) { return render(settings, createCanvas); },
}));
