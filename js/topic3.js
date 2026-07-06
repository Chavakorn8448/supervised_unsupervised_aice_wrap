// ===== TOPIC 3: Regression =====
(function () {
  // shared axis helpers for a 0..10 domain canvas
  function axes(cv, ctx, PAD, xlab, ylab) {
    const W = cv.width, H = cv.height;
    ctx.strokeStyle = '#2c3470'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD); ctx.stroke();
    ctx.fillStyle = '#9aa3d4'; ctx.font = '12px Segoe UI';
    ctx.fillText(xlab, W - 150, H - PAD + 26);
    ctx.save(); ctx.translate(16, 110); ctx.rotate(-Math.PI / 2); ctx.fillText(ylab, 0, 0); ctx.restore();
  }
  const mk = (cv, PAD) => ({
    px: x => PAD + x / 10 * (cv.width - 2 * PAD),
    py: y => cv.height - PAD - y / 10 * (cv.height - 2 * PAD),
    dx: X => (X - PAD) / (cv.width - 2 * PAD) * 10,
    dy: Y => (cv.height - PAD - Y) / (cv.height - 2 * PAD) * 10
  });
  function raf(fn) { (window.requestAnimationFrame || (cb => setTimeout(() => cb(Date.now()), 16)))(fn); }
  function ease(t) { return 1 - (1 - t) * (1 - t); }
  function animate(ms, render, done) {
    const start = Date.now();
    function frame() {
      const t = Math.min(1, (Date.now() - start) / ms);
      render(ease(t));
      if (t < 1) raf(frame); else if (done) done();
    }
    frame();
  }
  function fit(pts) {
    const n = pts.length; if (n < 2) return null;
    let sx = 0, sy = 0, sxy = 0, sxx = 0;
    pts.forEach(p => { sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; });
    const m = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1e-9);
    return { m, b: (sy - m * sx) / n };
  }
  const mse = (pts, l) => pts.length ? pts.reduce((s, p) => s + (p.y - (l.m * p.x + l.b)) ** 2, 0) / pts.length : null;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function seedRegData(kind) {
    const pts = [];
    for (let i = 0; i < 24; i++) {
      const x = .3 + Math.random() * 9.4;
      let y;
      if (kind === 'steps') y = x < 3.2 ? 2.2 : x < 6.5 ? 6.6 : 4.0;
      else if (kind === 'bumpy') y = 4.7 + 2.2 * Math.sin(x * .9) + .12 * (x - 5);
      else y = 1.2 + .72 * x + 1.5 * Math.sin(x * .65);
      pts.push({ x, y: clamp(y + (Math.random() - .5) * 1.2, .3, 9.7) });
    }
    return pts.sort((a, b) => a.x - b.x);
  }
  function drawPoints(ctx, M, pts, color) {
    pts.forEach(p => ML.dot(ctx, M.px(p.x), M.py(p.y), 6, color || '#6c8cff', 'rgba(255,255,255,.6)'));
  }
  function drawPredictionCurve(ctx, M, fn, color, width) {
    ctx.strokeStyle = color || '#46e0c8'; ctx.lineWidth = width || 3; ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const x = i / 120 * 10, y = clamp(fn(x), 0, 10);
      ctx[i ? 'lineTo' : 'moveTo'](M.px(x), M.py(y));
    }
    ctx.stroke();
  }
  function drawProbe(ctx, M, x, y, label) {
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(M.px(x), M.py(0)); ctx.lineTo(M.px(x), M.py(y)); ctx.stroke(); ctx.setLineDash([]);
    ML.dot(ctx, M.px(x), M.py(y), 7, '#46e08a', '#fff');
    if (label) { ctx.fillStyle = '#46e08a'; ctx.font = '12px Segoe UI'; ctx.fillText(label, M.px(x) + 8, M.py(y) - 8); }
  }
  function knnNeighbors(pts, x, k) {
    return pts.map(p => ({ p, d: Math.abs(p.x - x) })).sort((a, b) => a.d - b.d).slice(0, Math.min(k, pts.length));
  }
  function knnReg(pts, x, k) {
    const ns = knnNeighbors(pts, x, k);
    return ns.length ? ns.reduce((s, o) => s + o.p.y, 0) / ns.length : 0;
  }
  function avgY(rows) { return rows.reduce((s, p) => s + p.y, 0) / rows.length; }
  function sse(rows) {
    if (!rows.length) return 0;
    const a = avgY(rows);
    return rows.reduce((s, p) => s + (p.y - a) ** 2, 0);
  }
  function buildRegTree(rows, depth, randomize) {
    const node = { pred: rows.length ? avgY(rows) : 0, n: rows.length };
    if (depth <= 0 || rows.length < 5) return node;
    const sorted = rows.slice().sort((a, b) => a.x - b.x);
    let candidates = [];
    for (let i = 2; i < sorted.length - 2; i++) {
      const t = (sorted[i - 1].x + sorted[i].x) / 2;
      if (!candidates.length || Math.abs(candidates[candidates.length - 1] - t) > .05) candidates.push(t);
    }
    if (randomize && candidates.length > 8) {
      const sample = [];
      for (let i = 0; i < 8; i++) sample.push(candidates[(Math.random() * candidates.length) | 0]);
      candidates = sample;
    }
    let best = null;
    candidates.forEach(t => {
      const L = rows.filter(p => p.x < t), R = rows.filter(p => p.x >= t);
      if (L.length < 2 || R.length < 2) return;
      const score = sse(L) + sse(R);
      if (!best || score < best.score) best = { t, L, R, score };
    });
    if (!best || best.score >= sse(rows) - 1e-6) return node;
    node.t = best.t;
    node.L = buildRegTree(best.L, depth - 1, randomize);
    node.R = buildRegTree(best.R, depth - 1, randomize);
    return node;
  }
  function predTree(node, x) {
    while (node.t !== undefined) node = x < node.t ? node.L : node.R;
    return node.pred;
  }
  function bootstrap(rows) {
    const out = [];
    for (let i = 0; i < rows.length; i++) out.push(rows[(Math.random() * rows.length) | 0]);
    return out;
  }
  function trainRegForest(rows, depth, nTrees) {
    const forest = [], n = Math.max(1, nTrees | 0);
    if (n === 1) forest.push(buildRegTree(rows, depth, false));
    else for (let i = 0; i < n; i++) forest.push(buildRegTree(bootstrap(rows), depth, true));
    return forest;
  }
  function predForest(forest, x) {
    return forest.reduce((s, t) => s + predTree(t, x), 0) / forest.length;
  }
  function trainingMse(pts, fn) {
    return pts.reduce((s, p) => s + (p.y - fn(p.x)) ** 2, 0) / pts.length;
  }

  // ---------- L1: best-fit playground ----------
  (function playground() {
    const cv = document.getElementById('regCanvas'), ctx = cv.getContext('2d'), PAD = 40, M = mk(cv, PAD);
    let pts = [], drag = null, shownLine = null;
    function seed() { pts = []; for (let i = 0; i < 12; i++) { const x = Math.random() * 9 + .5; pts.push({ x, y: Math.max(.2, Math.min(9.8, .8 * x + 1 + (Math.random() - .5) * 2.5)) }); } }
    function draw(lineOverride) {
      ctx.clearRect(0, 0, cv.width, cv.height); axes(cv, ctx, PAD, 'hours studied →', 'exam score →');
      const line = lineOverride || fit(pts);
      shownLine = line;
      if (document.getElementById('regResid').checked && line) {
        ctx.strokeStyle = 'rgba(255,211,92,.7)'; ctx.lineWidth = 1.5;
        pts.forEach(p => { ctx.beginPath(); ctx.moveTo(M.px(p.x), M.py(p.y)); ctx.lineTo(M.px(p.x), M.py(line.m * p.x + line.b)); ctx.stroke(); });
      }
      if (line) { ctx.strokeStyle = '#46e0c8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(M.px(0), M.py(line.b)); ctx.lineTo(M.px(10), M.py(line.m * 10 + line.b)); ctx.stroke(); }
      pts.forEach(p => ML.dot(ctx, M.px(p.x), M.py(p.y), 7, '#6c8cff', 'rgba(255,255,255,.6)'));
      const xv = +document.getElementById('regX').value;
      if (line) {
        const yv = line.m * xv + line.b;
        ML.dot(ctx, M.px(xv), M.py(yv), 6, '#46e08a');
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(M.px(xv), cv.height - PAD); ctx.lineTo(M.px(xv), M.py(yv)); ctx.stroke(); ctx.setLineDash([]);
        document.getElementById('regPred').innerHTML = `ŷ = <b>${yv.toFixed(2)}</b>`;
        document.getElementById('regEq').textContent = `y = ${line.m.toFixed(2)}·x + ${line.b.toFixed(2)}`;
        document.getElementById('regMse').textContent = mse(pts, line).toFixed(3);
      } else { document.getElementById('regEq').textContent = 'add ≥2 points'; document.getElementById('regMse').textContent = '—'; }
    }
    function animateLine() {
      const to = fit(pts);
      if (!to || !shownLine) { shownLine = to; draw(to); return; }
      const from = shownLine;
      animate(360, t => draw({ m: from.m + (to.m - from.m) * t, b: from.b + (to.b - from.b) * t }), () => { shownLine = to; draw(to); });
    }
    cv.addEventListener('pointerdown', e => {
      const { x: X, y: Y } = ML.pos(cv, e);
      for (let i = 0; i < pts.length; i++) if (Math.hypot(M.px(pts[i].x) - X, M.py(pts[i].y) - Y) < 12) { drag = i; return; }
      pts.push({ x: Math.max(0, Math.min(10, M.dx(X))), y: Math.max(0, Math.min(10, M.dy(Y))) }); animateLine();
    });
    cv.addEventListener('pointermove', e => { if (drag === null) return; const { x: X, y: Y } = ML.pos(cv, e); pts[drag] = { x: Math.max(0, Math.min(10, M.dx(X))), y: Math.max(0, Math.min(10, M.dy(Y))) }; draw(); });
    window.addEventListener('pointerup', () => drag = null);
    document.getElementById('regResid').addEventListener('change', draw);
    document.getElementById('regX').addEventListener('input', function () { document.getElementById('regXval').textContent = (+this.value).toFixed(1); draw(); });
    document.getElementById('regClear').addEventListener('click', () => { pts = []; shownLine = null; draw(); });
    document.getElementById('regSeed').addEventListener('click', () => { seed(); animateLine(); });
    seed(); shownLine = fit(pts); draw();
  })();

  // ---------- L2: cost (tilt the line yourself) ----------
  (function cost() {
    const cv = document.getElementById('costCanvas'), ctx = cv.getContext('2d'), PAD = 40, M = mk(cv, PAD);
    const pts = []; for (let i = 0; i < 14; i++) { const x = Math.random() * 9 + .5; pts.push({ x, y: Math.max(.3, Math.min(9.7, .9 * x + .8 + (Math.random() - .5) * 2)) }); }
    const best = fit(pts), bestMse = mse(pts, best);
    function draw() {
      const m = +document.getElementById('costM').value, b = +document.getElementById('costB').value;
      document.getElementById('csM').textContent = m.toFixed(2); document.getElementById('csB').textContent = b.toFixed(2);
      ctx.clearRect(0, 0, cv.width, cv.height); axes(cv, ctx, PAD, 'x →', 'y →');
      const line = { m, b };
      ctx.strokeStyle = 'rgba(255,211,92,.6)'; ctx.lineWidth = 1.5;
      pts.forEach(p => { ctx.beginPath(); ctx.moveTo(M.px(p.x), M.py(p.y)); ctx.lineTo(M.px(p.x), M.py(m * p.x + b)); ctx.stroke(); });
      ctx.strokeStyle = '#ffd35c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(M.px(0), M.py(b)); ctx.lineTo(M.px(10), M.py(m * 10 + b)); ctx.stroke();
      pts.forEach(p => ML.dot(ctx, M.px(p.x), M.py(p.y), 7, '#6c8cff', 'rgba(255,255,255,.6)'));
      const c = mse(pts, line);
      const ratio = Math.min(1, (c - bestMse) / (bestMse * 6 + 0.01));
      document.getElementById('costFill').style.width = (8 + ratio * 92) + '%';
      document.getElementById('costReadout').innerHTML = `Cost (average squared error) = <b>${c.toFixed(2)}</b>. ` +
        (c < bestMse * 1.08 ? '🎉 That\'s essentially the best possible line!' : c < bestMse * 1.5 ? 'Getting close — nudge it a little more.' : 'High cost — the line doesn\'t match the trend yet.');
    }
    document.getElementById('costM').addEventListener('input', draw);
    document.getElementById('costB').addEventListener('input', draw);
    document.getElementById('costSolve').addEventListener('click', () => {
      const mS = document.getElementById('costM'), bS = document.getElementById('costB');
      let m = +mS.value, b = +bS.value; const steps = 40, dm = (best.m - m) / steps, db = (best.b - b) / steps; let i = 0;
      const id = setInterval(() => { i++; mS.value = (m + dm * i).toFixed(2); bS.value = (b + db * i).toFixed(2); draw(); if (i >= steps) clearInterval(id); }, 18);
    });
    draw();
  })();

  // ---------- L3: gradient descent ----------
  (function gd() {
    const cv = document.getElementById('gdCanvas'), ctx = cv.getContext('2d'), PAD = 40, M = mk(cv, PAD);
    // normalized data (0..1) for stable gradients
    const raw = []; for (let i = 0; i < 16; i++) { const x = Math.random() * 9 + .5; raw.push({ x, y: Math.max(.3, Math.min(9.7, .85 * x + 1 + (Math.random() - .5) * 1.8)) }); }
    const data = raw.map(p => ({ x: p.x / 10, y: p.y / 10 }));
    let m, b, step, timer = null, trace = [];
    function reset() { m = Math.random() * 2 - 1; b = Math.random(); step = 0; trace = []; stop(); draw(); document.getElementById('gdReadout').innerHTML = 'Step 0 · the line starts random and rolls toward the best fit.'; }
    function costNow() { return data.reduce((s, p) => s + (p.y - (m * p.x + b)) ** 2, 0) / data.length; }
    function train() {
      const lr = +document.getElementById('gdLr').value;
      let gm = 0, gb = 0; data.forEach(p => { const e = (m * p.x + b) - p.y; gm += e * p.x; gb += e; });
      gm = 2 * gm / data.length; gb = 2 * gb / data.length;
      m -= lr * gm * 6; b -= lr * gb * 6; step++;
      trace.push(Math.min(0.2, costNow())); if (trace.length > 120) trace.shift();
    }
    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height); axes(cv, ctx, PAD, 'x →', 'y →');
      raw.forEach(p => ML.dot(ctx, M.px(p.x), M.py(p.y), 6, '#6c8cff', 'rgba(255,255,255,.6)'));
      // line: y_norm = m*x_norm + b  -> real = *10
      ctx.strokeStyle = '#46e0c8'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(M.px(0), M.py(b * 10)); ctx.lineTo(M.px(10), M.py((m + b) * 10)); ctx.stroke();
      // mini cost trace, top-right
      if (trace.length > 1) {
        const x0 = cv.width - 150, y0 = 30, w = 120, h = 60, mx = Math.max(...trace);
        ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.strokeRect(x0, y0, w, h);
        ctx.fillStyle = '#9aa3d4'; ctx.font = '10px Segoe UI'; ctx.fillText('cost ↓', x0, y0 - 4);
        ctx.strokeStyle = '#ff5d6c'; ctx.lineWidth = 2; ctx.beginPath();
        trace.forEach((c, i) => { const X = x0 + i / (trace.length - 1) * w, Y = y0 + h - (c / (mx || 1)) * h; ctx[i ? 'lineTo' : 'moveTo'](X, Y); }); ctx.stroke();
      }
    }
    function loop() { for (let i = 0; i < 3; i++) train(); draw(); document.getElementById('gdReadout').innerHTML = `Step <b>${step}</b> · cost <b>${costNow().toFixed(4)}</b> — the line is rolling downhill toward least error.`; if (step > 1200) stop(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; document.getElementById('gdPlay').textContent = 'Train ▶'; } }
    document.getElementById('gdPlay').addEventListener('click', function () { if (timer) { stop(); return; } this.textContent = 'Pause ⏸'; timer = setInterval(loop, 40); });
    document.getElementById('gdReset').addEventListener('click', reset);
    document.getElementById('gdLr').addEventListener('input', function () { document.getElementById('gdLrv').textContent = (+this.value).toFixed(3); });
    reset();
  })();

  // ---------- KNN regressor L1: big idea ----------
  (function knnRegIdea() {
    const cv = document.getElementById('knnrIdeaCanvas'), ctx = cv.getContext('2d'), PAD = 40, M = mk(cv, PAD);
    const pts = seedRegData('bumpy').slice(0, 14);
    function draw() {
      const k = +document.getElementById('knnrIdeaK').value, x = +document.getElementById('knnrIdeaX').value;
      document.getElementById('knnrIdeaKv').textContent = k; document.getElementById('knnrIdeaXv').textContent = x.toFixed(1);
      const ns = knnNeighbors(pts, x, k), y = knnReg(pts, x, k);
      ctx.clearRect(0, 0, cv.width, cv.height); axes(cv, ctx, PAD, 'x →', 'number to predict →');
      ns.forEach(o => {
        ctx.strokeStyle = 'rgba(70,224,200,.55)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(M.px(x), M.py(y)); ctx.lineTo(M.px(o.p.x), M.py(o.p.y)); ctx.stroke();
      });
      drawPoints(ctx, M, pts);
      ns.forEach(o => ML.dot(ctx, M.px(o.p.x), M.py(o.p.y), 8, '#46e0c8', '#fff'));
      drawProbe(ctx, M, x, y, 'average');
      document.getElementById('knnrIdeaReadout').innerHTML = `The <b>${ns.length}</b> nearest y-values average to <b>${y.toFixed(2)}</b>.`;
    }
    document.getElementById('knnrIdeaK').addEventListener('input', draw);
    document.getElementById('knnrIdeaX').addEventListener('input', draw);
    draw();
  })();

  function knnRegPlay(ids, options) {
    const cv = document.getElementById(ids.canvas), ctx = cv.getContext('2d'), PAD = 40, M = mk(cv, PAD);
    let pts = [], drag = null;
    function seed() { pts = seedRegData(options.kind || 'bumpy'); pulse(); }
    function draw(progress) {
      progress = progress === undefined ? 1 : progress;
      const k = +document.getElementById(ids.k).value;
      document.getElementById(ids.kv).textContent = k;
      ctx.clearRect(0, 0, cv.width, cv.height); axes(cv, ctx, PAD, 'x →', 'y →');
      if (pts.length) drawPredictionCurve(ctx, M, x => knnReg(pts, x, k), '#46e0c8');
      drawPoints(ctx, M, pts);
      if (ids.x) {
        const x = +document.getElementById(ids.x).value, y = pts.length ? knnReg(pts, x, k) : 0;
        document.getElementById(ids.xv).textContent = x.toFixed(1);
        if (pts.length) {
          const ns = knnNeighbors(pts, x, k);
          ns.forEach(o => {
            ctx.strokeStyle = 'rgba(70,224,200,.55)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(M.px(x), M.py(y)); ctx.lineTo(M.px(x + (o.p.x - x) * progress), M.py(y + (o.p.y - y) * progress)); ctx.stroke();
          });
          ns.forEach(o => ML.dot(ctx, M.px(o.p.x), M.py(o.p.y), 7, '#46e0c8', '#fff'));
          drawProbe(ctx, M, x, y);
        }
        document.getElementById(ids.readout).innerHTML = pts.length ? `KNN predicts ŷ = <b>${y.toFixed(2)}</b> from <b>${Math.min(k, pts.length)}</b> neighbors.` : 'Add points to predict.';
      } else {
        const err = pts.length ? trainingMse(pts, x => knnReg(pts, x, k)) : 0;
        document.getElementById(ids.readout).innerHTML = `k = <b>${k}</b>. Training MSE: <b>${err.toFixed(2)}</b>. ` +
          (k <= 3 ? 'Very local and wiggly.' : k >= 17 ? 'Very smooth, but detail is blurred.' : 'A balanced local average.');
      }
    }
    function pulse() { animate(360, draw, () => draw()); }
    cv.addEventListener('pointerdown', e => {
      const { x: X, y: Y } = ML.pos(cv, e);
      for (let i = 0; i < pts.length; i++) if (Math.hypot(M.px(pts[i].x) - X, M.py(pts[i].y) - Y) < 12) { drag = i; return; }
      pts.push({ x: clamp(M.dx(X), 0, 10), y: clamp(M.dy(Y), 0, 10) }); pulse();
    });
    cv.addEventListener('pointermove', e => {
      if (drag === null) return;
      const { x: X, y: Y } = ML.pos(cv, e);
      pts[drag] = { x: clamp(M.dx(X), 0, 10), y: clamp(M.dy(Y), 0, 10) }; draw();
    });
    window.addEventListener('pointerup', () => drag = null);
    document.getElementById(ids.k).addEventListener('input', pulse);
    if (ids.x) document.getElementById(ids.x).addEventListener('input', pulse);
    if (ids.clear) document.getElementById(ids.clear).addEventListener('click', () => { pts = []; draw(); });
    if (ids.seed) document.getElementById(ids.seed).addEventListener('click', seed);
    if (ids.shuffle) document.getElementById(ids.shuffle).addEventListener('click', seed);
    seed();
  }
  knnRegPlay({ canvas: 'knnrPlayCanvas', k: 'knnrK', kv: 'knnrKv', x: 'knnrX', xv: 'knnrXv', readout: 'knnrReadout', clear: 'knnrClear', seed: 'knnrSeed' }, { kind: 'bumpy' });
  knnRegPlay({ canvas: 'knnrTuneCanvas', k: 'knnrTuneK', kv: 'knnrTuneKv', readout: 'knnrTuneReadout', shuffle: 'knnrTuneShuffle' }, { kind: 'bumpy' });

  // ---------- Decision tree regressor L1/L2/L3 ----------
  function treeRegDemo(ids, options) {
    const cv = document.getElementById(ids.canvas), ctx = cv.getContext('2d'), PAD = 40, M = mk(cv, PAD);
    let pts = [], drag = null, tree = null, buildTimer = null, shownDepth = null;
    function depth() { return +document.getElementById(ids.depth).value; }
    function stopBuild() { if (buildTimer) { clearInterval(buildTimer); buildTimer = null; } shownDepth = null; }
    function train(animateBuild) {
      stopBuild();
      if (!animateBuild || !ids.train) { tree = buildRegTree(pts, depth(), false); draw(false); return; }
      let d = 0;
      buildTimer = setInterval(() => {
        d++;
        shownDepth = d;
        tree = buildRegTree(pts, d, false);
        draw(false);
        if (d >= depth()) stopBuild(), draw(false);
      }, 180);
    }
    function seed() { stopBuild(); pts = seedRegData(options.kind || 'steps'); tree = options.auto ? buildRegTree(pts, depth(), false) : null; draw(false); }
    function draw(retrain) {
      const d = shownDepth || depth(); document.getElementById(ids.depthv).textContent = d;
      if (options.auto && retrain !== false) tree = buildRegTree(pts, d, false);
      ctx.clearRect(0, 0, cv.width, cv.height); axes(cv, ctx, PAD, 'x →', 'y →');
      if (tree) drawPredictionCurve(ctx, M, x => predTree(tree, x), '#46e0c8');
      drawPoints(ctx, M, pts);
      let msg = tree ? `Depth <b>${d}</b> tree. Training MSE: <b>${trainingMse(pts, x => predTree(tree, x)).toFixed(2)}</b>.` : 'Train the tree to draw its step prediction.';
      if (ids.x) {
        const x = +document.getElementById(ids.x).value; document.getElementById(ids.xv).textContent = x.toFixed(1);
        if (tree) { const y = predTree(tree, x); drawProbe(ctx, M, x, y); msg += ` ŷ at x = ${x.toFixed(1)} is <b>${y.toFixed(2)}</b>.`; }
      }
      if (tree && !ids.x) msg += d <= 2 ? ' Broad leaves underfit.' : d >= 7 ? ' Many tiny leaves can overfit.' : ' The staircase follows the main shape.';
      document.getElementById(ids.readout).innerHTML = msg;
    }
    cv.addEventListener('pointerdown', e => {
      if (!options.editable) return;
      const { x: X, y: Y } = ML.pos(cv, e);
      for (let i = 0; i < pts.length; i++) if (Math.hypot(M.px(pts[i].x) - X, M.py(pts[i].y) - Y) < 12) { drag = i; return; }
      stopBuild(); pts.push({ x: clamp(M.dx(X), 0, 10), y: clamp(M.dy(Y), 0, 10) }); tree = null; draw(false);
    });
    cv.addEventListener('pointermove', e => {
      if (drag === null) return;
      const { x: X, y: Y } = ML.pos(cv, e);
      stopBuild(); pts[drag] = { x: clamp(M.dx(X), 0, 10), y: clamp(M.dy(Y), 0, 10) }; tree = null; draw(false);
    });
    window.addEventListener('pointerup', () => drag = null);
    document.getElementById(ids.depth).addEventListener('input', () => { if (tree) train(true); else draw(true); });
    if (ids.x) document.getElementById(ids.x).addEventListener('input', () => draw(false));
    if (ids.train) document.getElementById(ids.train).addEventListener('click', () => train(true));
    if (ids.clear) document.getElementById(ids.clear).addEventListener('click', () => { pts = []; tree = null; draw(false); });
    if (ids.seed) document.getElementById(ids.seed).addEventListener('click', seed);
    if (ids.shuffle) document.getElementById(ids.shuffle).addEventListener('click', seed);
    seed();
  }
  treeRegDemo({ canvas: 'dtrIdeaCanvas', depth: 'dtrIdeaDepth', depthv: 'dtrIdeaDepthv', readout: 'dtrIdeaReadout' }, { kind: 'steps', auto: true });
  treeRegDemo({ canvas: 'dtrPlayCanvas', depth: 'dtrDepth', depthv: 'dtrDepthv', x: 'dtrX', xv: 'dtrXv', readout: 'dtrReadout', train: 'dtrTrain', clear: 'dtrClear', seed: 'dtrSeed' }, { kind: 'steps', editable: true, auto: false });
  treeRegDemo({ canvas: 'dtrTuneCanvas', depth: 'dtrTuneDepth', depthv: 'dtrTuneDepthv', readout: 'dtrTuneReadout', shuffle: 'dtrTuneShuffle' }, { kind: 'bumpy', auto: true });

  // ---------- Random forest regressor L1/L2/L3 ----------
  function forestRegDemo(ids, options) {
    const cv = document.getElementById(ids.canvas), ctx = cv.getContext('2d'), PAD = 40, M = mk(cv, PAD);
    let pts = [], drag = null, forest = null, buildTimer = null, shownTrees = null;
    function depth() { return +document.getElementById(ids.depth).value; }
    function trees() { return +document.getElementById(ids.trees).value; }
    function stopBuild() { if (buildTimer) { clearInterval(buildTimer); buildTimer = null; } shownTrees = null; }
    function train(animateBuild) {
      stopBuild();
      if (!animateBuild || !ids.train) { forest = trainRegForest(pts, depth(), trees()); draw(false); return; }
      forest = [];
      buildTimer = setInterval(() => {
        const target = trees();
        for (let i = 0; i < 2 && forest.length < target; i++) forest.push(buildRegTree(bootstrap(pts), depth(), true));
        shownTrees = forest.length;
        draw(false);
        if (forest.length >= target) stopBuild(), draw(false);
      }, 120);
    }
    function seed() { stopBuild(); pts = seedRegData(options.kind || 'bumpy'); forest = options.auto ? trainRegForest(pts, depth(), trees()) : null; draw(false); }
    function draw(retrain) {
      const d = depth(), n = shownTrees || trees();
      document.getElementById(ids.depthv).textContent = d; document.getElementById(ids.treesv).textContent = n;
      if (options.auto && retrain !== false) forest = trainRegForest(pts, d, n);
      ctx.clearRect(0, 0, cv.width, cv.height); axes(cv, ctx, PAD, 'x →', 'y →');
      if (forest) drawPredictionCurve(ctx, M, x => predForest(forest, x), '#46e0c8');
      drawPoints(ctx, M, pts);
      let msg = forest ? `<b>${n}</b> tree${n > 1 ? 's' : ''}, depth <b>${d}</b>. Training MSE: <b>${trainingMse(pts, x => predForest(forest, x)).toFixed(2)}</b>.` : 'Train the forest to average many tree predictions.';
      if (ids.x) {
        const x = +document.getElementById(ids.x).value; document.getElementById(ids.xv).textContent = x.toFixed(1);
        if (forest) { const y = predForest(forest, x); drawProbe(ctx, M, x, y); msg += ` ŷ at x = ${x.toFixed(1)} is <b>${y.toFixed(2)}</b>.`; }
      } else if (forest) msg += n === 1 ? ' One tree is jumpy.' : ' Averaging many trees smooths the staircase.';
      document.getElementById(ids.readout).innerHTML = msg;
    }
    cv.addEventListener('pointerdown', e => {
      if (!options.editable) return;
      const { x: X, y: Y } = ML.pos(cv, e);
      for (let i = 0; i < pts.length; i++) if (Math.hypot(M.px(pts[i].x) - X, M.py(pts[i].y) - Y) < 12) { drag = i; return; }
      stopBuild(); pts.push({ x: clamp(M.dx(X), 0, 10), y: clamp(M.dy(Y), 0, 10) }); forest = null; draw(false);
    });
    cv.addEventListener('pointermove', e => {
      if (drag === null) return;
      const { x: X, y: Y } = ML.pos(cv, e);
      stopBuild(); pts[drag] = { x: clamp(M.dx(X), 0, 10), y: clamp(M.dy(Y), 0, 10) }; forest = null; draw(false);
    });
    window.addEventListener('pointerup', () => drag = null);
    document.getElementById(ids.depth).addEventListener('input', () => { if (forest) train(true); else draw(true); });
    document.getElementById(ids.trees).addEventListener('input', () => { if (forest) train(true); else draw(true); });
    if (ids.x) document.getElementById(ids.x).addEventListener('input', () => draw(false));
    if (ids.train) document.getElementById(ids.train).addEventListener('click', () => train(true));
    if (ids.clear) document.getElementById(ids.clear).addEventListener('click', () => { pts = []; forest = null; draw(false); });
    if (ids.seed) document.getElementById(ids.seed).addEventListener('click', seed);
    if (ids.shuffle) document.getElementById(ids.shuffle).addEventListener('click', seed);
    seed();
  }
  forestRegDemo({ canvas: 'rfrIdeaCanvas', trees: 'rfrIdeaTrees', treesv: 'rfrIdeaTreesv', depth: 'rfrIdeaDepth', depthv: 'rfrIdeaDepthv', readout: 'rfrIdeaReadout', shuffle: 'rfrIdeaShuffle' }, { kind: 'bumpy', auto: true });
  forestRegDemo({ canvas: 'rfrPlayCanvas', trees: 'rfrTrees', treesv: 'rfrTreesv', depth: 'rfrDepth', depthv: 'rfrDepthv', x: 'rfrX', xv: 'rfrXv', readout: 'rfrReadout', train: 'rfrTrain', clear: 'rfrClear', seed: 'rfrSeed' }, { kind: 'bumpy', editable: true, auto: false });
  forestRegDemo({ canvas: 'rfrTuneCanvas', trees: 'rfrTuneTrees', treesv: 'rfrTuneTreesv', depth: 'rfrTuneDepth', depthv: 'rfrTuneDepthv', readout: 'rfrTuneReadout', shuffle: 'rfrTuneShuffle' }, { kind: 'bumpy', auto: true });
})();
