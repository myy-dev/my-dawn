'use strict';

const canvas = document.getElementById('film');
const screen = document.getElementById('screen');
const list = document.getElementById('film-list');
const category = document.getElementById('category');
const search = document.getElementById('scene-search');
const filterStatus = document.getElementById('filter-status');
const title = document.getElementById('film-title');
const info = document.getElementById('film-info');
const position = document.getElementById('play-position');
const duration = document.getElementById('duration');
const seek = document.getElementById('seek');
const playButton = document.getElementById('toggle-play');
const audioButton = document.getElementById('toggle-audio');
const fullscreen = document.getElementById('fullscreen');
const audio = document.getElementById('ambience');
const warning = document.getElementById('playback-warning');
const context = canvas.getContext('2d', { alpha: false });
const settingsKey = 'my-dawn:lengths:by-scene';
const legacySettingsKeys = [
  'my-dawn:lengths:70dc9621b997',
  'my-dawn:lengths:160a96c79513',
];
const drawIntervalMs = 1000 / 30;
const maxTimerDelayMs = 2_147_483_647;

function isDuration(value) {
  return value === null || (Number.isFinite(value) && value >= 0.1);
}

function storedObject(key) {
  const raw = localStorage.getItem(key);
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function loadLengths() {
  try {
    const currentSettings = storedObject(settingsKey);
    if (currentSettings) return currentSettings;
    // The two earlier releases stored overrides under a hash of the whole timeline.
    const legacy = Object.assign({}, ...legacySettingsKeys.map(storedObject));
    return Object.fromEntries(scenes
      .filter(scene => scene.durationSeconds === null && isDuration(legacy[scene.id]))
      .map(scene => [scene.id, { value: legacy[scene.id], defaultSeconds: null }]));
  } catch {
    return {};
  }
}

const lengths = loadLengths();
let current;
let painter;
let audioScene;
let elapsed = 0;
let anchorSeconds = 0;
let anchorTime = 0;
let lastFrame = -Infinity;
let nextFrame = 0;
let endTimer;
let playing = false;

function limit() {
  const saved = lengths[current.id];
  if (saved?.defaultSeconds === current.durationSeconds && isDuration(saved.value)) return saved.value;
  return current.durationSeconds;
}

function readPosition(now = performance.now()) {
  return playing ? anchorSeconds + Math.max(0, now - anchorTime) / 1000 : elapsed;
}

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const sec = String(total % 60).padStart(2, '0');
  const min = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  return hours ? hours + ':' + String(min).padStart(2, '0') + ':' + sec : min + ':' + sec;
}

function drawFrame() {
  const phase = (elapsed % current.cycleSeconds) / current.cycleSeconds;
  context.save();
  try {
    painter(context, phase);
  } finally {
    context.restore();
  }

  const end = limit();
  seek.max = end ?? current.cycleSeconds;
  seek.value = end === null ? elapsed % current.cycleSeconds : elapsed;
  position.textContent = formatTime(elapsed) + (end === null ? '' : ' / ' + formatTime(end));
}

function makeCanvas(width, height) {
  const layer = document.createElement('canvas');
  layer.width = width;
  layer.height = height;
  return layer;
}

function soundPosition() {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  audio.currentTime = (elapsed + (current.soundOffsetSeconds ?? 0)) % audio.duration;
}

function showWarning(message) {
  warning.textContent = message;
  warning.hidden = !message;
}

function startSound() {
  if (audioScene !== current.id) {
    const data = document.getElementById('audio-' + current.scene.sound);
    audioScene = current.id;
    audio.src = 'data:audio/wav;base64,' + data.textContent;
  }
  soundPosition();
  audio.play().catch(error => {
    if (error.name !== 'AbortError' && playing) {
      showWarning('환경음을 재생하지 못했어요.');
    }
  });
}

function clearEndTimer() {
  if (endTimer !== undefined) clearTimeout(endTimer);
  endTimer = undefined;
}

function scheduleEnd() {
  clearEndTimer();
  if (!playing) return;
  const end = limit();
  if (end === null) return;
  const remainingMs = (end - readPosition()) * 1000;
  if (remainingMs <= 0) {
    pause(end);
    return;
  }
  endTimer = setTimeout(scheduleEnd, Math.min(maxTimerDelayMs, Math.ceil(remainingMs)));
}

function pause(at = readPosition()) {
  clearEndTimer();
  elapsed = Math.min(at, limit() ?? Infinity);
  if (playing) cancelAnimationFrame(nextFrame);
  nextFrame = 0;
  playing = false;
  audio.pause();
  playButton.textContent = '재생';
  drawFrame();
}

function step(now) {
  const positionNow = readPosition(now);
  const end = limit();
  if (end !== null && positionNow >= end) {
    pause(end);
    return;
  }

  if (now - lastFrame >= drawIntervalMs - 0.5) {
    lastFrame = now;
    elapsed = positionNow;
    drawFrame();
  }
  nextFrame = requestAnimationFrame(step);
}

function play() {
  if (playing) return;
  const end = limit();
  if (end !== null && elapsed >= end) elapsed = 0;
  showWarning('');
  playing = true;
  anchorSeconds = elapsed;
  anchorTime = performance.now();
  lastFrame = -Infinity;
  playButton.textContent = '일시정지';
  startSound();
  nextFrame = requestAnimationFrame(step);
  scheduleEnd();
}

function choose(entry, start) {
  if (entry !== current) {
    if (current && playing) pause();
    current = entry;
    painter = entry.scene.createScene(makeCanvas);
    elapsed = 0;
    title.textContent = entry.scene.title;
    info.textContent = entry.soundLabel;
    duration.value = limit() ?? '';
    for (const button of list.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.scene === entry.id));
    }
    showWarning('');
    drawFrame();
  }
  if (start) {
    play();
    const bounds = screen.getBoundingClientRect();
    if (bounds.top < 0 || bounds.bottom > window.innerHeight) {
      screen.scrollIntoView({ block: 'start' });
    }
  }
}

for (const entry of scenes) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'film-button';
  button.dataset.scene = entry.id;
  button.dataset.category = entry.category;
  button.dataset.search = (entry.scene.title + ' ' + entry.category).normalize('NFC').toLowerCase();
  button.setAttribute('aria-controls', 'screen');
  const image = document.createElement('img');
  image.src = 'data:image/jpeg;base64,' + document.getElementById('still-' + entry.id).textContent;
  image.alt = '';
  image.className = 'film-still';
  image.width = 960;
  image.height = 540;
  image.decoding = 'async';
  image.loading = 'lazy';
  const label = document.createElement('span');
  label.textContent = entry.scene.title;
  button.append(image, label);
  button.addEventListener('click', () => choose(entry, true));
  list.append(button);
}

for (const name of new Set(scenes.map(scene => scene.category))) {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  category.append(option);
}

function filterScenes() {
  const words = search.value.trim().normalize('NFC').toLowerCase().split(/\s+/);
  let count = 0;
  for (const item of list.querySelectorAll('button')) {
    const inCategory = !category.value || item.dataset.category === category.value;
    item.hidden = !inCategory || !words.every(word => item.dataset.search.includes(word));
    count += Number(!item.hidden);
  }
  filterStatus.hidden = count === scenes.length;
  filterStatus.textContent = count === 0 ? '검색 결과가 없어요.' : count + '편';
}

category.addEventListener('change', filterScenes);
search.addEventListener('input', filterScenes);

playButton.addEventListener('click', () => playing ? pause() : play());
duration.addEventListener('change', () => {
  const value = duration.value === '' ? null : duration.valueAsNumber;
  if (!isDuration(value) || !duration.validity.valid) {
    duration.value = limit() ?? '';
    return;
  }
  lengths[current.id] = { value, defaultSeconds: current.durationSeconds };
  try {
    localStorage.setItem(settingsKey, JSON.stringify(lengths));
  } catch {
    // File-based pages can be configured to keep preferences only until they close.
  }
  const at = readPosition();
  if (playing && value !== null && at >= value) pause(value);
  else {
    elapsed = Math.min(at, value ?? Infinity);
    drawFrame();
    scheduleEnd();
  }
});

seek.addEventListener('input', () => {
  const target = seek.valueAsNumber;
  const cycle = current.cycleSeconds;
  elapsed = limit() === null ? Math.floor(readPosition() / cycle) * cycle + target : target;
  anchorSeconds = elapsed;
  anchorTime = performance.now();
  soundPosition();
  drawFrame();
  scheduleEnd();
});

document.addEventListener('visibilitychange', scheduleEnd);

audio.addEventListener('loadedmetadata', soundPosition);
audioButton.addEventListener('click', () => {
  audio.muted = !audio.muted;
  audioButton.setAttribute('aria-pressed', String(audio.muted));
  audioButton.textContent = audio.muted ? '소리 켜기' : '음소거';
});

if (screen.requestFullscreen) {
  fullscreen.hidden = false;
  fullscreen.addEventListener('click', () => screen.requestFullscreen().catch(() => {}));
}

choose(scenes[0], false);
