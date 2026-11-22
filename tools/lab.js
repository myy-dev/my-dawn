// Scene check tools. Load into the built preview page served by tools/labserver.py:
//   const s = document.createElement('script'); s.src = '/tools/lab.js'; document.head.append(s);
// Everything is exposed on window.lab. Images go to review/lab/ through PUT /lab/out/<name>.jpg.
(() => {
  const W = 1920, H = 1080;
  const LIMITS = { frameMs: 33, createMs: 1000, seamFactor: 1.6, seamFloor: .5, nondeterminism: .5 };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const byId = id => scenes.find(s => s.id === id);
  const pick = ids => (ids ? ids.map(byId) : scenes);
  const poster = e => e.scene.posterPhase ?? .28;
  const tick = () => new Promise(r => setTimeout(r, 0));

  async function put(canvas, name, quality = .9) {
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality));
    const res = await fetch('/lab/out/' + name + '.jpg', { method: 'PUT', body: blob });
    if (!res.ok) throw new Error('PUT ' + name + ' failed: ' + res.status);
  }
  async function putJson(value, name) {
    await fetch('/lab/out/' + name + '.json', { method: 'PUT', body: JSON.stringify(value, null, 1) });
  }

  // Mean absolute channel difference between two RGBA buffers.
  function diff(a, b) {
    let t = 0;
    for (let i = 0; i < a.length; i += 4) t += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    return t / (a.length / 4 * 3);
  }

  // Errors, loop seam, frame time, creation time and determinism for each scene.
  async function audit(ids) {
    const out = { errors: [], seams: [], slowFrames: [], slowCreate: [], nondeterministic: [], times: {} };
    const c = mk(W, H), ctx = c.getContext('2d', { alpha: false });
    const sm = mk(240, 135), sx = sm.getContext('2d', { willReadFrequently: true });
    const snap = () => { sx.drawImage(c, 0, 0, 240, 135); return sx.getImageData(0, 0, 240, 135).data; };
    for (const e of pick(ids)) {
      try {
        let t = performance.now();
        const p = e.scene.createScene(mk);
        const createMs = performance.now() - t;
        const step = 1 / (e.cycleSeconds * 30);
        p(ctx, 1 - step); const last = snap(); p(ctx, 0); const seam = diff(last, snap());
        let base = 0;
        for (const q of [.2, .5, .8]) { p(ctx, q); const a = snap(); p(ctx, q + step); base = Math.max(base, diff(a, snap())); }
        if (seam > base * LIMITS.seamFactor + LIMITS.seamFloor) out.seams.push(`${e.id} ${seam.toFixed(2)}/${base.toFixed(2)}`);
        // Determinism: a fresh instance and a repeat draw must match the first at the same phase.
        p(ctx, .37); const first = snap();
        e.scene.createScene(mk)(ctx, .37); const fresh = snap();
        const drift = diff(first, fresh);
        if (drift > LIMITS.nondeterminism) out.nondeterministic.push(`${e.id} ${drift.toFixed(2)}`);
        t = performance.now();
        for (let i = 0; i < 12; i++) p(ctx, i / 12);
        ctx.getImageData(0, 0, 1, 1);
        const frameMs = (performance.now() - t) / 12;
        out.times[e.id] = { frameMs: +frameMs.toFixed(1), createMs: +createMs.toFixed(0) };
        if (frameMs > LIMITS.frameMs) out.slowFrames.push(`${e.id} ${frameMs.toFixed(1)}`);
        if (createMs > LIMITS.createMs) out.slowCreate.push(`${e.id} ${createMs.toFixed(0)}`);
      } catch (err) {
        out.errors.push(`${e.id} ${err.message}`);
      }
      await tick();
    }
    return out;
  }

  // Poster stills, 960x540 JPEG, as still-<id>.jpg.
  async function stills(ids) {
    const c = mk(W, H), ctx = c.getContext('2d', { alpha: false }), s = mk(960, 540), sx = s.getContext('2d');
    for (const e of pick(ids)) {
      e.scene.createScene(mk)(ctx, poster(e));
      sx.drawImage(c, 0, 0, 960, 540);
      await put(s, 'still-' + e.id);
      await tick();
    }
  }

  function label(x, text, px, py) {
    x.font = '600 24px -apple-system, "Apple SD Gothic Neo"';
    x.fillStyle = 'rgba(0,0,0,.6)'; x.fillText(text, px + 1, py + 1);
    x.fillStyle = '#fff'; x.fillText(text, px, py);
  }
  function sheet(w, h) { const s = mk(w, h), x = s.getContext('2d'); x.fillStyle = '#121216'; x.fillRect(0, 0, w, h); return [s, x]; }
  async function image(src) { const im = new Image(); im.src = src + (src.includes('?') ? '&' : '?') + Date.now(); await im.decode(); return im; }

  // Contact grid of live renders.
  async function grid(ids, name, cols = 3, cw = 640) {
    const ch = cw * 9 / 16, pad = 6, rows = Math.ceil(ids.length / cols);
    const [s, x] = sheet(pad + cols * (cw + pad), pad + rows * (ch + pad));
    const c = mk(W, H), ctx = c.getContext('2d', { alpha: false });
    for (const [k, id] of ids.entries()) {
      const e = byId(id), px = pad + (k % cols) * (cw + pad), py = pad + Math.floor(k / cols) * (ch + pad);
      e.scene.createScene(mk)(ctx, poster(e));
      x.drawImage(c, px, py, cw, ch);
      label(x, id, px + 8, py + 28);
      await tick();
    }
    await put(s, name, .88);
  }

  // Before (installed still) / after (still-<id>.jpg from stills()) sheet.
  async function ab(ids, name, titles = ['이전', '이후']) {
    const cw = 800, ch = 450, pad = 10, top = 50;
    const [s, x] = sheet(pad + 2 * (cw + pad), top + ids.length * (ch + pad));
    label(x, titles[0], pad + 8, 34); label(x, titles[1], pad + cw + pad + 8, 34);
    for (const [r, id] of ids.entries()) {
      const before = await image('/assets/stills/' + id + '.jpg'), after = await image('/lab/out/still-' + id + '.jpg');
      x.drawImage(before, pad, top + r * (ch + pad), cw, ch);
      x.drawImage(after, pad + cw + pad, top + r * (ch + pad), cw, ch);
      label(x, id, pad + 10, top + r * (ch + pad) + 32);
    }
    await put(s, name, .88);
  }

  // Crops of several scenes side by side, for comparing objects of the same kind.
  async function crops(entries, name, cols = 4, cw = 480) {
    const pad = 8, rows = Math.ceil(entries.length / cols);
    const cells = entries.map(e => ({ ...e, ch: Math.round(cw * e.h / e.w) }));
    const ch = Math.max(...cells.map(e => e.ch));
    const [s, x] = sheet(pad + cols * (cw + pad), pad + rows * (ch + pad));
    const c = mk(W, H), ctx = c.getContext('2d', { alpha: false });
    for (const [k, e] of cells.entries()) {
      const scene = byId(e.id), px = pad + (k % cols) * (cw + pad), py = pad + Math.floor(k / cols) * (ch + pad);
      scene.scene.createScene(mk)(ctx, poster(scene));
      x.drawImage(c, e.x, e.y, e.w, e.h, px, py, cw, e.ch);
      label(x, e.label || e.id, px + 8, py + 28);
      await tick();
    }
    await put(s, name, .88);
  }

  window.lab = { LIMITS, audit, stills, grid, ab, crops, put, putJson, mk };
})();
