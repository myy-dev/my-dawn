'use strict';

const width = 1920;
const height = 1080;
const horizon = 746;
const loopSeconds = 24;
const tau = Math.PI * 2;
const moonX = 1518;
const moonY = 195;

const bursts = [
  { second: 4.8, x: 620, y: 389, radius: 150, color: [201, 170, 119] },
  { second: 11.2, x: 1168, y: 419, radius: 136, color: [190, 142, 159] },
  { second: 17.6, x: 884, y: 349, radius: 166, color: [143, 181, 176] },
];

const clamp = (value, lower = 0, upper = 1) => Math.max(lower, Math.min(upper, value));
const mix = (start, end, amount) => start + (end - start) * amount;
const smooth = v => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};

function randomFrom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function colorWithAlpha(color, alpha) {
  return `rgba(${color.join(',')},${clamp(alpha).toFixed(4)})`;
}

function bloom(ctx, x, y, radiusX, radiusY, color, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(radiusX, radiusY);
  const wash = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  wash.addColorStop(0, colorWithAlpha(color, opacity));
  wash.addColorStop(0.25, colorWithAlpha(color, opacity * 0.62));
  wash.addColorStop(0.65, colorWithAlpha(color, opacity * 0.16));
  wash.addColorStop(1, colorWithAlpha(color, 0));
  ctx.fillStyle = wash;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function stroke(ctx, x0, y0, x1, y1, color, thickness) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineWidth = thickness;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function ridge(ctx, y, amplitude, frequency, color) {
  ctx.beginPath();
  ctx.moveTo(0, horizon + 2);
  for (let x = 0; x <= width; x += 4) {
    const leftHeadland = 25 * Math.exp(-((x - 110) ** 2) / 88400);
    const rightHill = 12 * Math.exp(-((x - width) ** 2) / 70600);
    const roll = Math.sin(x * 0.0102 + 0.9) * 6 + Math.cos(x * 0.029) * 1.8;
    const ragged = Math.sin(x * 0.104) * 0.7 + Math.sin(x * 0.313) * 0.36;
    ctx.lineTo(x, y + roll * frequency + ragged - (leftHeadland + rightHill) * amplitude);
  }
  ctx.lineTo(width, horizon + 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawMoon(createCanvas, ctx) {
  bloom(ctx, moonX, moonY, 160, 130, [106, 142, 179], 0.093);
  bloom(ctx, moonX, moonY, 55, 51, [119, 150, 186], 0.12);

  const moon = createCanvas(74, 74);
  const surface = moon.getContext('2d');
  const shimmer = surface.createLinearGradient(14, 12, 55, 62);
  shimmer.addColorStop(0, '#a6b4c6');
  shimmer.addColorStop(0.52, '#8297ae');
  shimmer.addColorStop(1, '#5d7994');
  surface.fillStyle = shimmer;
  surface.beginPath();
  surface.arc(37, 37, 26, 0, tau);
  surface.fill();
  surface.globalCompositeOperation = 'destination-out';
  surface.beginPath();
  surface.arc(48, 30, 24, 0, tau);
  surface.fill();
  ctx.drawImage(moon, moonX - 37, moonY - 37);
}

function makeBackdrop(createCanvas, random) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#0a111f');
  sky.addColorStop(0.48, '#111d2d');
  sky.addColorStop(0.80, '#233444');
  sky.addColorStop(0.94, '#354652');
  sky.addColorStop(1, '#3e4e58');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, horizon + 1);

  bloom(ctx, 995, 710, 960, 126, [121, 108, 115], 0.09);
  bloom(ctx, 294, 593, 670, 251, [29, 46, 68], 0.20);
  bloom(ctx, 1644, 594, 660, 240, [49, 72, 98], 0.12);

  for (let i = 0; i < 120; i++) {
    const y = 428 + random() ** 0.66 * 310;
    const x = random() * 2400 - 240;
    bloom(ctx, x, y, 48 + 330 * random(), 3 + 26 * random(), [80, 103, 121], 0.012 + 0.017 * random());
  }
  for (let i = 0; i < 275; i++) {
    const x = 12 + random() * (width - 24);
    const y = random() ** 1.35 * 571;
    const light = random();
    const opacity = (0.06 + light ** 2 * 0.33) * (1 - y / 950);
    const radius = 0.25 + 1.4 * light ** 4;
    if (light > 0.965) bloom(ctx, x, y, radius * 4, radius * 4, [178, 199, 221], 0.12);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, tau);
    ctx.fillStyle = colorWithAlpha([199, 216, 226], opacity);
    ctx.fill();
  }
  drawMoon(createCanvas, ctx);
  ridge(ctx, 736, 0.9, 0.85, '#1c2b37');
  ridge(ctx, 744, 0.51, 0.44, '#101e2a');

  for (const [x, y, opacity] of [[203, 737, 0.32], [224, 739, 0.25], [305, 740, 0.23], [392, 742, 0.35], [1754, 742, 0.24]]) {
    ctx.fillStyle = colorWithAlpha([192, 159, 104], opacity);
    ctx.fillRect(x, y, 2.7, 1.4);
  }

  const water = ctx.createLinearGradient(0, horizon, 0, height);
  water.addColorStop(0, '#172633');
  water.addColorStop(0.22, '#182a38');
  water.addColorStop(0.70, '#122230');
  water.addColorStop(1, '#0d1925');
  ctx.fillStyle = water;
  ctx.fillRect(0, horizon, width, height - horizon);

  bloom(ctx, 1230, horizon + 16, 910, 114, [84, 102, 112], 0.08);
  bloom(ctx, moonX + 13, 937, 149, 133, [93, 121, 143], 0.085);
  return canvas;
}

function makeRipples(random) {
  return Array.from({ length: 520 }, () => {
    const depth = random() ** 1.23;
    const spread = 39 + depth * 141;
    const moonlit = random() > 0.62;
    return {
      x: moonlit ? moonX + (random() + random() - 1) * spread : random() * width,
      y: horizon + depth * (height - horizon),
      length: (2.5 + depth * depth * 53) * (0.65 + random() * 0.95),
      amplitude: (1.6 + depth * 6) * random(),
      tone: moonlit ? [116, 143, 163] : [98, 123, 143],
      light: (0.045 + random() * 0.11) * (moonlit ? 1 : 0.5),
      offset: random() * tau,
      speed: depth > 0.64 ? 2 : 1,
      thickness: 0.45 + 0.78 * depth * depth,
    };
  });
}

function makeParticles(shot, random) {
  return Array.from({ length: 164 }, (_, index) => {
    const core = index < 49;
    const angle = index * Math.PI * (3 - Math.sqrt(5)) + (random() - 0.5) * 0.41;
    const radius = core ? 0.04 + 0.54 * random() ** 1.1 : 0.53 + 0.45 * random() ** 0.46;
    return {
      vx: shot.radius * radius * Math.cos(angle),
      vy: shot.radius * radius * Math.sin(angle) * (0.85 + random() * 0.17),
      life: (core ? 2.54 : 2.82) + random() * (core ? 1.14 : 0.9),
      delay: random() * 0.14,
      thickness: (core ? 0.85 : 0.68) + random() * 1.05,
      brightness: (core ? 0.46 : 0.54) + random() * 0.36,
      gravity: 3.4 + random() * 6.4,
      tail: 0.13 + random() * 0.20,
    };
  });
}

function drawRipples(ctx, ripples, t) {
  ctx.lineCap = 'round';
  for (const ripple of ripples) {
    const angle = ripple.offset + t * ripple.speed;
    const sway = ripple.amplitude * Math.sin(angle);
    const shift = Math.sin(angle + 0.9) * 1.35;
    const opacity = ripple.light * (0.72 + 0.28 * Math.sin(angle + 0.1));
    stroke(ctx, ripple.x + sway, ripple.y + shift, ripple.x + sway + ripple.length, ripple.y + shift,
      colorWithAlpha(ripple.tone, opacity), ripple.thickness);
  }
}

function drawLaunch(ctx, shot, age) {
  const u = (age + 1.32) / 1.32;
  const lift = (1 - (1 - u) ** 1.35);
  const x = shot.x - 39 * (1 - lift) ** 1.2;
  const y = mix(horizon - 34, shot.y + 2, lift);
  const opacity = 0.51 * smooth(u / 0.24) * (1 - smooth((u - 0.76) / 0.24));
  bloom(ctx, x, y, 10, 15, shot.color, opacity * 0.18);
  stroke(ctx, x - 2.8, y + 8 + (1 - u) * 14, x, y, colorWithAlpha(shot.color, opacity * 0.65), 1.35);
}

function drawBrokenReflection(ctx, shot, x, y, wave, pulse) {
  const fragments = [
    { x: -35, y: -13, span: 57, opacity: 0.62 },
    { x: 2, y: 2, span: 71, opacity: 0.78 },
    { x: 27, y: 16, span: 43, opacity: 0.56 },
  ];
  for (const [index, fragment] of fragments.entries()) {
    const cycle = wave * 3 + index * 1.87 + shot.x * 0.013;
    const left = x + fragment.x + 7 * Math.sin(cycle);
    const right = left + fragment.span * (0.87 + 0.13 * Math.sin(cycle + 1.12));
    const level = y + fragment.y + 1.6 * Math.sin(cycle + 2.3);
    const strength = pulse * fragment.opacity * (0.83 + 0.17 * Math.sin(cycle + 0.5));

    const tint = ctx.createLinearGradient(left, level, right, level);
    tint.addColorStop(0, colorWithAlpha(shot.color, 0));
    tint.addColorStop(0.23, colorWithAlpha(shot.color, strength));
    tint.addColorStop(0.40, colorWithAlpha(shot.color, strength * 0.76));
    tint.addColorStop(0.55, colorWithAlpha(shot.color, 0));
    tint.addColorStop(0.72, colorWithAlpha(shot.color, strength * 0.54));
    tint.addColorStop(1, colorWithAlpha(shot.color, 0));
    stroke(ctx, left, level, right, level + 1.0, tint, 2.8);
  }
}

function drawBurst(ctx, shot, age, time) {
  const pulse = smooth(age / 0.38) * Math.exp(-age * 0.85) * (1 - smooth((age - 2.9) / 1));
  const driftX = age * 3.5;
  const centerX = shot.x + driftX;
  bloom(ctx, centerX + 12, shot.y + 4, 164, 117, shot.color, pulse * 0.071);
  bloom(ctx, centerX, shot.y + 2.5 * age * age, 34 + age * 8, 29 + age * 5, shot.color, pulse * 0.16);

  const reflectionY = horizon + (horizon - shot.y) * 0.53;
  bloom(ctx, centerX, reflectionY + 5, 114 + age * 11, 33 + age * 3, shot.color, pulse * 0.068);
  drawBrokenReflection(ctx, shot, centerX - 19, reflectionY, time, pulse);
  for (const spark of shot.sparks) {
    const local = age - spark.delay;
    if (local <= 0 || local >= spark.life) continue;
    const carry = 1 - Math.exp(-local * 0.66);
    const past = Math.max(0, local - spark.tail);
    const oldCarry = 1 - Math.exp(-past * 0.66);
    const x = centerX + carry * spark.vx;
    const y = shot.y + carry * spark.vy + local * local * spark.gravity;
    const tailX = centerX + oldCarry * spark.vx - (local - past) * 3.5;
    const tailY = shot.y + oldCarry * spark.vy + past * past * spark.gravity;
    const intensity = smooth(local / 0.46) * (1 - smooth((local - 0.63) / (spark.life - 0.63)));
    const opacity = intensity * spark.brightness;
    stroke(ctx, tailX, tailY, x, y, colorWithAlpha(shot.color, opacity * 0.17), spark.thickness * 4.2);
    stroke(ctx, tailX, tailY, x, y, colorWithAlpha(shot.color, opacity * 0.91), spark.thickness);

    const reflectedY = horizon + (horizon - y) * 0.53;
    const shimmer = time * 2 + reflectedY * 0.115;
    const breakX = Math.sin(shimmer) * 9 + Math.sin(reflectedY * 0.037 - time) * 4.5;
    const waterOpacity = opacity * (0.14 + 0.064 * Math.sin(shimmer - 1.0));
    const reflectedX = x + breakX;
    stroke(ctx, reflectedX - 2.3, reflectedY, reflectedX + 3.5, reflectedY + 0.6,
      colorWithAlpha(shot.color, waterOpacity), 1.1);
  }
}

function createScene(createCanvas) {
  const random = randomFrom(271828);
  const backdrop = makeBackdrop(createCanvas, random);
  const ripples = makeRipples(random);
  const shots = bursts.map(shot => ({ ...shot, sparks: makeParticles(shot, random) }));

  return (ctx, phase) => {
    const u = ((phase % 1) + 1) % 1;
    const second = u * loopSeconds;
    const wave = u * tau;
    ctx.drawImage(backdrop, 0, 0);
    drawRipples(ctx, ripples, wave);
    for (const shot of shots) {
      const age = second - shot.second;
      if (age > -1.32 && age < 0) drawLaunch(ctx, shot, age);
      if (age > 0 && age < 3.9) drawBurst(ctx, shot, age, wave);
    }
  };
}

module.exports = {
  title: '달빛 아래, 먼 불꽃',
  slug: 'distant-fireworks',
  sound: 'fireworks',
  createScene,
};
