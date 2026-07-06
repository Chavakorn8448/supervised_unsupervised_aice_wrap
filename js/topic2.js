// ===== TOPIC 2: Classification algorithms =====
(function () {
  const COL = ML.COL;
  const COLF = ['rgba(255,93,108,.18)', 'rgba(58,160,255,.18)'];

  function star(ctx, x, y, r, fill) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 5 * i - Math.PI / 2;
      const rr = i % 2 ? r * .45 : r;
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
  }
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
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function sigmoid(z) { return 1 / (1 + Math.exp(-Math.max(-40, Math.min(40, z)))); }
  function normPoint(cv, p) { return { x: p.x / cv.width, y: p.y / cv.height, c: p.c }; }
  function drawProb(ctx, W, H, fn, alpha) {
    const step = 8;
    for (let X = 0; X < W; X += step) for (let Y = 0; Y < H; Y += step) {
      ctx.fillStyle = ML.classFill(clamp01(fn((X + step / 2) / W, (Y + step / 2) / H)), alpha || .30);
      ctx.fillRect(X, Y, step, step);
    }
  }
  function seedBlobs(W, H) {
    const pts = [];
    [[.28, .30, 0], [.72, .68, 1]].forEach(([cx, cy, c]) => {
      for (let i = 0; i < 16; i++) pts.push({ x: (cx + (Math.random() - .5) * .24) * W, y: (cy + (Math.random() - .5) * .24) * H, c });
    });
    return pts;
  }
  function seedCurve(W, H) {
    const pts = [];
    for (let i = 0; i < 90; i++) {
      const x = Math.random(), y = Math.random();
      const c = (Math.hypot(x - .5, y - .5) < .28) ? 0 : 1;
      pts.push({ x: x * W, y: y * H, c: Math.random() < .08 ? 1 - c : c });
    }
    return pts;
  }
  function seedChecker(W, H) {
    const pts = [];
    for (let i = 0; i < 110; i++) {
      const x = Math.random(), y = Math.random();
      pts.push({ x: x * W, y: y * H, c: ((x < .5) ^ (y < .5)) ? 1 : 0 });
    }
    return pts;
  }
  function seedBayes(W, H) {
    const pts = [];
    [[.30, .62, 0], [.70, .38, 1]].forEach(([cx, cy, c]) => {
      for (let i = 0; i < 22; i++) pts.push({ x: (cx + (Math.random() - .5) * .30) * W, y: (cy + (Math.random() - .5) * .22) * H, c });
    });
    return pts;
  }

  function trainLogistic(rows, epochs, lr) {
    let w0 = 0, w1 = 0, b = 0;
    if (rows.length < 2) return { w0, w1, b, ready: false };
    for (let e = 0; e < epochs; e++) {
      let gw0 = 0, gw1 = 0, gb = 0;
      rows.forEach(r => {
        const x0 = r.x - .5, x1 = r.y - .5;
        const p = sigmoid(w0 * x0 + w1 * x1 + b);
        const err = p - r.c;
        gw0 += err * x0; gw1 += err * x1; gb += err;
      });
      w0 -= lr * gw0 / rows.length; w1 -= lr * gw1 / rows.length; b -= lr * gb / rows.length;
    }
    return { w0, w1, b, ready: true };
  }
  function stepLogistic(model, rows, lr) {
    if (rows.length < 2) return model;
    let gw0 = 0, gw1 = 0, gb = 0;
    rows.forEach(r => {
      const x0 = r.x - .5, x1 = r.y - .5;
      const p = sigmoid(model.w0 * x0 + model.w1 * x1 + model.b);
      const err = p - r.c;
      gw0 += err * x0; gw1 += err * x1; gb += err;
    });
    model.w0 -= lr * gw0 / rows.length;
    model.w1 -= lr * gw1 / rows.length;
    model.b -= lr * gb / rows.length;
    model.ready = true;
    model.step++;
    return model;
  }
  function logProb(m, x, y) { return sigmoid(m.w0 * (x - .5) + m.w1 * (y - .5) + m.b); }
  function drawLogLine(ctx, cv, m, threshold) {
    if (!m.ready || Math.abs(m.w1) < 1e-4) return;
    const t = Math.log(threshold / (1 - threshold));
    const y0 = .5 + (t - m.b - m.w0 * (0 - .5)) / m.w1;
    const y1 = .5 + (t - m.b - m.w0 * (1 - .5)) / m.w1;
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.setLineDash([7, 5]);
    ctx.beginPath(); ctx.moveTo(0, y0 * cv.height); ctx.lineTo(cv.width, y1 * cv.height); ctx.stroke(); ctx.setLineDash([]);
  }

  function gini(rows) {
    if (!rows.length) return 0;
    const p = rows.filter(r => r.c === 1).length / rows.length;
    return 1 - p * p - (1 - p) * (1 - p);
  }
  function buildTree(rows, depth, featureBag) {
    const ones = rows.filter(r => r.c === 1).length;
    const node = { pred: ones >= rows.length - ones ? 1 : 0, p1: rows.length ? ones / rows.length : .5, n: rows.length };
    if (depth <= 0 || rows.length < 5 || gini(rows) < 1e-6) return node;
    let best = null;
    const feats = featureBag ? [Math.random() < .5 ? 'x' : 'y'] : ['x', 'y'];
    feats.forEach(f => {
      for (let t = .08; t < .96; t += .04) {
        const L = rows.filter(r => r[f] < t), R = rows.filter(r => r[f] >= t);
        if (!L.length || !R.length) continue;
        const score = (L.length * gini(L) + R.length * gini(R)) / rows.length;
        if (!best || score < best.score) best = { score, f, t, L, R };
      }
    });
    if (!best) return node;
    node.f = best.f; node.t = best.t;
    node.L = buildTree(best.L, depth - 1, featureBag);
    node.R = buildTree(best.R, depth - 1, featureBag);
    return node;
  }
  function treeLeaf(node, x, y) {
    while (node.f !== undefined) node = ((node.f === 'x' ? x : y) < node.t) ? node.L : node.R;
    return node;
  }
  function bootstrap(rows) {
    const out = [];
    for (let i = 0; i < rows.length; i++) out.push(rows[(Math.random() * rows.length) | 0]);
    return out;
  }
  function trainForest(rows, depth, nTrees) {
    const n = Math.max(1, nTrees | 0), forest = [];
    if (n === 1) forest.push(buildTree(rows, depth, false));
    else for (let i = 0; i < n; i++) forest.push(buildTree(bootstrap(rows), depth, true));
    return forest;
  }
  function forestProb(forest, x, y) {
    let v = 0;
    forest.forEach(t => { v += treeLeaf(t, x, y).p1; });
    return v / forest.length;
  }

  function trainNB(rows, smooth) {
    const groups = [rows.filter(r => r.c === 0), rows.filter(r => r.c === 1)];
    if (!groups[0].length || !groups[1].length) return { ready: false };
    const stats = groups.map(g => {
      const mx = g.reduce((s, r) => s + r.x, 0) / g.length, my = g.reduce((s, r) => s + r.y, 0) / g.length;
      const vx = Math.max(smooth * smooth, g.reduce((s, r) => s + (r.x - mx) ** 2, 0) / g.length + smooth * smooth);
      const vy = Math.max(smooth * smooth, g.reduce((s, r) => s + (r.y - my) ** 2, 0) / g.length + smooth * smooth);
      return { mx, my, vx, vy, prior: g.length / rows.length };
    });
    return { ready: true, stats };
  }
  function logGauss(v, m, va) { return -0.5 * Math.log(2 * Math.PI * va) - ((v - m) ** 2) / (2 * va); }
  function nbScores(model, x, y) {
    if (!model.ready) return { p: .5, a: 0, b: 0 };
    const s = model.stats.map(st => Math.log(st.prior) + logGauss(x, st.mx, st.vx) + logGauss(y, st.my, st.vy));
    const m = Math.max(s[0], s[1]);
    const a = Math.exp(s[0] - m), b = Math.exp(s[1] - m);
    return { p: b / (a + b), a, b };
  }

  // ---------- KNN L1: distance demo ----------
  (function distance() {
    const cv = document.getElementById('distCanvas');
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    let pts = [], probe = { x: W / 2, y: H / 2 }, kk = 3, drag = false;
    function seed() {
      pts = [];
      for (let i = 0; i < 10; i++) pts.push({ x: 50 + Math.random() * (W - 100), y: 40 + Math.random() * (H - 80), c: i % 2 });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const sorted = pts.map(p => ({ p, d: Math.hypot(p.x - probe.x, p.y - probe.y) })).sort((a, b) => a.d - b.d);
      sorted.forEach((o, i) => {
        const near = i < kk;
        ctx.strokeStyle = near ? 'rgba(70,224,200,.9)' : 'rgba(255,255,255,.12)';
        ctx.lineWidth = near ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(probe.x, probe.y); ctx.lineTo(o.p.x, o.p.y); ctx.stroke();
        if (near) {
          ctx.fillStyle = 'rgba(70,224,200,.9)'; ctx.font = '11px Segoe UI';
          ctx.fillText(Math.round(o.d), (probe.x + o.p.x) / 2 + 4, (probe.y + o.p.y) / 2 - 3);
        }
      });
      pts.forEach(p => ML.dot(ctx, p.x, p.y, 7, COL[p.c], 'rgba(255,255,255,.5)'));
      ML.dot(ctx, probe.x, probe.y, 10, '#fff', '#46e0c8');
      document.getElementById('distReadout').innerHTML =
        `The <b>${kk}</b> nearest points are highlighted. KNN would let just these <b>${kk}</b> vote on the white point's label — everything farther away is ignored.`;
    }
    function move(e) { if (!drag) return; probe = ML.pos(cv, e); draw(); }
    cv.addEventListener('pointerdown', e => { drag = true; probe = ML.pos(cv, e); draw(); });
    window.addEventListener('pointerup', () => drag = false);
    cv.addEventListener('pointermove', move);
    document.getElementById('distK').addEventListener('input', function () {
      kk = +this.value; document.getElementById('distKv').textContent = kk; draw();
    });
    seed(); draw();
  })();

  // ---------- KNN L2: playground ----------
  (function playground() {
    const cv = document.getElementById('knnCanvas');
    const ctx = cv.getContext('2d');
    let pts = [], test = null, addClass = 0, placingTest = false, k = 3;
    let animating = false;
    function seed() { pts = seedBlobs(cv.width, cv.height).slice(0, 14); test = { x: 260, y: 210 }; }
    function nearest() {
      if (!test) return null;
      const d = pts.map(p => ({ p, d: Math.hypot(p.x - test.x, p.y - test.y) })).sort((a, b) => a.d - b.d).slice(0, Math.min(k, pts.length));
      let v = [0, 0]; d.forEach(o => v[o.p.c]++);
      return { neighbors: d, pred: v[0] >= v[1] ? 0 : 1, votes: v };
    }
    function draw(progress) {
      progress = progress === undefined ? 1 : progress;
      ctx.clearRect(0, 0, cv.width, cv.height);
      const res = nearest();
      if (res && res.neighbors.length) {
        const rad = res.neighbors[res.neighbors.length - 1].d * progress;
        ctx.fillStyle = COLF[res.pred]; ctx.beginPath(); ctx.arc(test.x, test.y, rad, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(test.x, test.y, rad, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        res.neighbors.forEach(o => { ctx.strokeStyle = COL[o.p.c]; ctx.lineWidth = 2; ctx.globalAlpha = .15 + .55 * progress; ctx.beginPath(); ctx.moveTo(test.x, test.y); ctx.lineTo(test.x + (o.p.x - test.x) * progress, test.y + (o.p.y - test.y) * progress); ctx.stroke(); });
        ctx.globalAlpha = 1;
      }
      pts.forEach(p => ML.dot(ctx, p.x, p.y, 7, COL[p.c], 'rgba(255,255,255,.5)'));
      if (test) star(ctx, test.x, test.y, 11, res ? COL[res.pred] : '#fff');
      const el = document.getElementById('knnReadout');
      if (!test || !res || !res.neighbors.length) el.innerHTML = 'Drop some red &amp; blue points, then place a ★ test point.';
      else el.innerHTML = `Among the <b>${res.neighbors.length}</b> nearest: 🔴 ${res.votes[0]} vs 🔵 ${res.votes[1]} → prediction <b>${res.pred === 0 ? '🔴 Class A' : '🔵 Class B'}</b>.`;
    }
    function animateVote() {
      if (animating) return draw();
      animating = true;
      animate(420, draw, () => { animating = false; draw(); });
    }
    cv.addEventListener('click', e => {
      const p = ML.pos(cv, e);
      if (placingTest) { test = { x: p.x, y: p.y }; placingTest = false; document.getElementById('placeTest').classList.remove('active'); }
      else pts.push({ x: p.x, y: p.y, c: addClass });
      animateVote();
    });
    document.querySelectorAll('#t2 .seg[data-knnclass]').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('#t2 .seg[data-knnclass]').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); addClass = +b.dataset.knnclass;
    }));
    document.getElementById('placeTest').addEventListener('click', function () { placingTest = !placingTest; this.classList.toggle('active', placingTest); });
    document.getElementById('knnClear').addEventListener('click', () => { pts = []; test = null; draw(); });
    const ks = document.getElementById('kSlider');
    ks.addEventListener('input', () => { k = +ks.value; document.getElementById('kVal').textContent = k; animateVote(); });
    seed(); draw();
  })();

  // ---------- KNN L3: decision boundary ----------
  (function boundary() {
    const cv = document.getElementById('boundCanvas');
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    let pts = [], k = 1;
    function seed() {
      pts = [];
      [[150, 150, 0], [370, 270, 1], [360, 130, 1]].forEach(([cx, cy, c]) => {
        for (let i = 0; i < 12; i++) pts.push({ x: cx + (Math.random() - .5) * 130, y: cy + (Math.random() - .5) * 130, c });
      });
      pts.push({ x: 380, y: 300, c: 0 }); pts.push({ x: 150, y: 280, c: 1 });
    }
    function classify(x, y) {
      const d = pts.map(p => ({ c: p.c, d: (p.x - x) ** 2 + (p.y - y) ** 2 })).sort((a, b) => a.d - b.d).slice(0, k);
      let v = [0, 0]; d.forEach(o => v[o.c]++); return v[1] > v[0] ? 1 : 0;
    }
    function draw() {
      const step = 8;
      for (let X = 0; X < W; X += step) for (let Y = 0; Y < H; Y += step) {
        ctx.fillStyle = ML.classFill(classify(X + step / 2, Y + step / 2), .32); ctx.fillRect(X, Y, step, step);
      }
      pts.forEach(p => ML.dot(ctx, p.x, p.y, 6, COL[p.c], 'rgba(255,255,255,.6)'));
      document.getElementById('boundReadout').innerHTML =
        `k = <b>${k}</b>: ` + (k <= 3 ? 'the boundary is wiggly and wraps tightly around individual points — including the noisy strays.' :
          k >= 15 ? 'the boundary is very smooth — but it may now ignore small real clusters.' :
            'a balanced boundary — smooth, but still respects the groups.');
    }
    document.getElementById('boundK').addEventListener('input', function () { k = +this.value; document.getElementById('boundKv').textContent = k; draw(); });
    document.getElementById('boundShuffle').addEventListener('click', () => { seed(); draw(); });
    seed(); draw();
  })();

  // ---------- Logistic L1: big idea ----------
  (function logisticIdea() {
    const cv = document.getElementById('logIdeaCanvas'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    const pts = seedBlobs(W, H);
    function draw() {
      const bias = +document.getElementById('logIdeaBias').value;
      const slope = +document.getElementById('logIdeaSlope').value;
      document.getElementById('logIdeaBiasv').textContent = bias.toFixed(2);
      document.getElementById('logIdeaSlopev').textContent = slope;
      ctx.clearRect(0, 0, W, H);
      drawProb(ctx, W, H, (x, y) => sigmoid(slope * (x + y - 1 + bias)), .32);
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(0, (1 - bias) * H); ctx.lineTo(W, -bias * H); ctx.stroke(); ctx.setLineDash([]);
      pts.forEach(p => ML.dot(ctx, p.x, p.y, 6, COL[p.c], 'rgba(255,255,255,.55)'));
      document.getElementById('logIdeaReadout').innerHTML = `The dashed line is the <b>50/50 boundary</b>. Farther into blue means a higher probability of Class B.`;
    }
    document.getElementById('logIdeaBias').addEventListener('input', draw);
    document.getElementById('logIdeaSlope').addEventListener('input', draw);
    draw();
  })();

  // ---------- Logistic L2: playground ----------
  (function logisticPlay() {
    const cv = document.getElementById('logPlayCanvas'), ctx = cv.getContext('2d');
    let pts = [], addClass = 0, placing = false, test = { x: 260, y: 210 }, model = { ready: false, step: 0 };
    let timer = null;
    function rows() { return pts.map(p => normPoint(cv, p)); }
    function stopTrain() {
      if (timer) { clearInterval(timer); timer = null; document.getElementById('logTrain').textContent = 'Train ▶'; }
    }
    function startTrain() {
      if (timer) { stopTrain(); return; }
      model = { w0: 0, w1: 0, b: 0, ready: true, step: 0 };
      document.getElementById('logTrain').textContent = 'Pause ⏸';
      timer = setInterval(() => {
        const lr = +document.getElementById('logLr').value;
        for (let i = 0; i < 4 && model.step < 240; i++) stepLogistic(model, rows(), lr);
        draw();
        if (model.step >= 240) stopTrain();
      }, 45);
    }
    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (model.ready) { drawProb(ctx, cv.width, cv.height, (x, y) => logProb(model, x, y), .30); drawLogLine(ctx, cv, model, .5); }
      pts.forEach(p => ML.dot(ctx, p.x, p.y, 7, COL[p.c], 'rgba(255,255,255,.55)'));
      if (test) {
        const p = model.ready ? logProb(model, test.x / cv.width, test.y / cv.height) : .5;
        star(ctx, test.x, test.y, 11, COL[p >= .5 ? 1 : 0]);
      }
      const out = document.getElementById('logReadout');
      if (!model.ready) out.innerHTML = 'Train the model, then place the ★ test point.';
      else {
        const p = test ? logProb(model, test.x / cv.width, test.y / cv.height) : .5;
        out.innerHTML = `Gradient step <b>${model.step}</b> / 240. P(blue) = <b>${p.toFixed(2)}</b> → prediction <b>${p >= .5 ? '🔵 Class B' : '🔴 Class A'}</b>.`;
      }
    }
    function reset() { stopTrain(); pts = seedBlobs(cv.width, cv.height); test = { x: 260, y: 210 }; model = { ready: false, step: 0 }; draw(); }
    cv.addEventListener('click', e => {
      const p = ML.pos(cv, e);
      if (placing) { test = p; placing = false; document.getElementById('logPlace').classList.remove('active'); }
      else { stopTrain(); pts.push({ x: p.x, y: p.y, c: addClass }); model = { ready: false, step: 0 }; }
      draw();
    });
    document.querySelectorAll('#t2 .seg[data-logclass]').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('#t2 .seg[data-logclass]').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); addClass = +b.dataset.logclass;
    }));
    document.getElementById('logTrain').addEventListener('click', startTrain);
    document.getElementById('logPlace').addEventListener('click', function () { placing = !placing; this.classList.toggle('active', placing); });
    document.getElementById('logReset').addEventListener('click', reset);
    document.getElementById('logLr').addEventListener('input', function () { document.getElementById('logLrv').textContent = (+this.value).toFixed(2); });
    reset();
  })();

  // ---------- Logistic L3: threshold ----------
  (function logisticTune() {
    const cv = document.getElementById('logTuneCanvas'), ctx = cv.getContext('2d');
    let pts = [];
    function reset() { pts = seedBlobs(cv.width, cv.height); pts.push({ x: .75 * cv.width, y: .25 * cv.height, c: 0 }); draw(); }
    function draw() {
      const th = +document.getElementById('logThresh').value, epochs = +document.getElementById('logEpoch').value;
      document.getElementById('logThreshv').textContent = th.toFixed(2); document.getElementById('logEpochv').textContent = epochs;
      const model = trainLogistic(pts.map(p => normPoint(cv, p)), epochs, .8);
      ctx.clearRect(0, 0, cv.width, cv.height);
      drawProb(ctx, cv.width, cv.height, (x, y) => logProb(model, x, y) >= th ? 1 : 0, .32);
      drawLogLine(ctx, cv, model, th);
      pts.forEach(p => ML.dot(ctx, p.x, p.y, 6, COL[p.c], 'rgba(255,255,255,.55)'));
      let ok = 0; pts.forEach(p => { if ((logProb(model, p.x / cv.width, p.y / cv.height) >= th ? 1 : 0) === p.c) ok++; });
      document.getElementById('logTuneReadout').innerHTML = `Threshold <b>${th.toFixed(2)}</b> gives <b>${(100 * ok / pts.length).toFixed(0)}%</b> training accuracy. Higher threshold shrinks the blue region.`;
    }
    document.getElementById('logThresh').addEventListener('input', draw);
    document.getElementById('logEpoch').addEventListener('input', draw);
    document.getElementById('logTuneShuffle').addEventListener('click', reset);
    reset();
  })();

  // ---------- Decision tree L1/L2/L3 ----------
  function treeDemo(ids, seedFn, options) {
    const cv = document.getElementById(ids.canvas), ctx = cv.getContext('2d');
    let pts = [], addClass = 0, placing = false, test = null, tree = null;
    let buildTimer = null, shownDepth = null;
    function rows() { return pts.map(p => normPoint(cv, p)); }
    function depth() { return +document.getElementById(ids.depth).value; }
    function stopBuild() { if (buildTimer) { clearInterval(buildTimer); buildTimer = null; } shownDepth = null; }
    function train(animateBuild) {
      stopBuild();
      if (!animateBuild || !ids.train) { tree = buildTree(rows(), depth(), false); draw(); return; }
      let d = 0;
      buildTimer = setInterval(() => {
        d++;
        shownDepth = d;
        tree = buildTree(rows(), d, false);
        draw();
        if (d >= depth()) stopBuild(), draw();
      }, 180);
    }
    function reset() { stopBuild(); pts = seedFn(cv.width, cv.height); test = options.test ? { x: cv.width * .5, y: cv.height * .5 } : null; tree = options.auto ? buildTree(rows(), depth(), false) : null; draw(); }
    function draw() {
      const d = shownDepth || depth(); document.getElementById(ids.depthv).textContent = d;
      if (options.auto) tree = buildTree(rows(), d, false);
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (tree) drawProb(ctx, cv.width, cv.height, (x, y) => treeLeaf(tree, x, y).p1 >= .5 ? 1 : 0, .32);
      pts.forEach(p => ML.dot(ctx, p.x, p.y, 6, COL[p.c], 'rgba(255,255,255,.55)'));
      if (test && tree) star(ctx, test.x, test.y, 11, COL[treeLeaf(tree, test.x / cv.width, test.y / cv.height).pred]);
      let msg = tree ? `Built a complete depth <b>${d}</b> tree from <b>${pts.length}</b> points.` : 'Train the tree, then place the ★ test point.';
      if (tree) {
        let ok = 0; pts.forEach(p => { if (treeLeaf(tree, p.x / cv.width, p.y / cv.height).pred === p.c) ok++; });
        msg += ` Training accuracy: <b>${(100 * ok / pts.length).toFixed(0)}%</b>.`;
      }
      if (test && tree) msg += ` ★ prediction: <b>${treeLeaf(tree, test.x / cv.width, test.y / cv.height).pred ? '🔵 Class B' : '🔴 Class A'}</b>.`;
      document.getElementById(ids.readout).innerHTML = msg;
    }
    if (ids.train) document.getElementById(ids.train).addEventListener('click', () => train(true));
    if (ids.reset) document.getElementById(ids.reset).addEventListener('click', reset);
    if (ids.shuffle) document.getElementById(ids.shuffle).addEventListener('click', reset);
    document.getElementById(ids.depth).addEventListener('input', () => { if (tree) train(true); else draw(); });
    if (ids.place) document.getElementById(ids.place).addEventListener('click', function () { placing = !placing; this.classList.toggle('active', placing); });
    cv.addEventListener('click', e => {
      if (!ids.place) return;
      const p = ML.pos(cv, e);
      if (placing) { test = p; placing = false; document.getElementById(ids.place).classList.remove('active'); }
      else { stopBuild(); pts.push({ x: p.x, y: p.y, c: addClass }); tree = null; }
      draw();
    });
    if (ids.classAttr) document.querySelectorAll(`#t2 .seg[data-${ids.classAttr}]`).forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll(`#t2 .seg[data-${ids.classAttr}]`).forEach(x => x.classList.remove('active'));
      b.classList.add('active'); addClass = +b.dataset[ids.classAttr];
    }));
    reset();
  }
  treeDemo({ canvas: 'dtIdeaCanvas', depth: 'dtIdeaDepth', depthv: 'dtIdeaDepthv', readout: 'dtIdeaReadout' }, seedChecker, { auto: true, test: false });
  treeDemo({ canvas: 'dtPlayCanvas', depth: 'dtDepth', depthv: 'dtDepthv', readout: 'dtReadout', train: 'dtTrain', reset: 'dtReset', place: 'dtPlace', classAttr: 'dtclass' }, seedChecker, { auto: false, test: true });
  treeDemo({ canvas: 'dtTuneCanvas', depth: 'dtTuneDepth', depthv: 'dtTuneDepthv', readout: 'dtTuneReadout', shuffle: 'dtTuneShuffle' }, seedCurve, { auto: true, test: false });

  // ---------- Random forest L1/L2/L3 ----------
  function forestDemo(ids, seedFn, options) {
    const cv = document.getElementById(ids.canvas), ctx = cv.getContext('2d');
    let pts = [], addClass = 0, placing = false, test = null, forest = null;
    let buildTimer = null, shownTrees = null;
    function rows() { return pts.map(p => normPoint(cv, p)); }
    function depth() { return +document.getElementById(ids.depth).value; }
    function trees() { return +document.getElementById(ids.trees).value; }
    function stopBuild() { if (buildTimer) { clearInterval(buildTimer); buildTimer = null; } shownTrees = null; }
    function train(animateBuild) {
      stopBuild();
      if (!animateBuild || !ids.train) { forest = trainForest(rows(), depth(), trees()); draw(false); return; }
      forest = [];
      buildTimer = setInterval(() => {
        const target = trees();
        for (let i = 0; i < 2 && forest.length < target; i++) forest.push(buildTree(bootstrap(rows()), depth(), true));
        shownTrees = forest.length;
        draw(false);
        if (forest.length >= target) stopBuild(), draw(false);
      }, 120);
    }
    function reset() { stopBuild(); pts = seedFn(cv.width, cv.height); test = options.test ? { x: cv.width * .5, y: cv.height * .5 } : null; forest = options.auto ? trainForest(rows(), depth(), trees()) : null; draw(false); }
    function draw(retrain) {
      const d = depth(), n = shownTrees || trees();
      document.getElementById(ids.depthv).textContent = d; document.getElementById(ids.treesv).textContent = n;
      if (options.auto && retrain !== false) forest = trainForest(rows(), d, n);
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (forest) drawProb(ctx, cv.width, cv.height, (x, y) => forestProb(forest, x, y), .32);
      pts.forEach(p => ML.dot(ctx, p.x, p.y, 6, COL[p.c], 'rgba(255,255,255,.55)'));
      if (test && forest) star(ctx, test.x, test.y, 11, COL[forestProb(forest, test.x / cv.width, test.y / cv.height) >= .5 ? 1 : 0]);
      let msg = forest ? `Built <b>${n}</b> complete tree${n > 1 ? 's' : ''}, each up to depth <b>${d}</b>.` : 'Train the forest, then place the ★ test point.';
      if (forest) {
        let ok = 0; pts.forEach(p => { if ((forestProb(forest, p.x / cv.width, p.y / cv.height) >= .5 ? 1 : 0) === p.c) ok++; });
        msg += ` Training accuracy: <b>${(100 * ok / pts.length).toFixed(0)}%</b>.`;
      }
      if (test && forest) {
        const p = forestProb(forest, test.x / cv.width, test.y / cv.height);
        msg += ` ★ vote for blue: <b>${p.toFixed(2)}</b> → <b>${p >= .5 ? '🔵 Class B' : '🔴 Class A'}</b>.`;
      }
      document.getElementById(ids.readout).innerHTML = msg;
    }
    if (ids.train) document.getElementById(ids.train).addEventListener('click', () => train(true));
    if (ids.reset) document.getElementById(ids.reset).addEventListener('click', reset);
    if (ids.shuffle) document.getElementById(ids.shuffle).addEventListener('click', reset);
    document.getElementById(ids.depth).addEventListener('input', () => { if (forest) train(true); else draw(true); });
    document.getElementById(ids.trees).addEventListener('input', () => { if (forest) train(true); else draw(true); });
    if (ids.place) document.getElementById(ids.place).addEventListener('click', function () { placing = !placing; this.classList.toggle('active', placing); });
    cv.addEventListener('click', e => {
      if (!ids.place) return;
      const p = ML.pos(cv, e);
      if (placing) { test = p; placing = false; document.getElementById(ids.place).classList.remove('active'); }
      else { stopBuild(); pts.push({ x: p.x, y: p.y, c: addClass }); forest = null; }
      draw(false);
    });
    if (ids.classAttr) document.querySelectorAll(`#t2 .seg[data-${ids.classAttr}]`).forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll(`#t2 .seg[data-${ids.classAttr}]`).forEach(x => x.classList.remove('active'));
      b.classList.add('active'); addClass = +b.dataset[ids.classAttr];
    }));
    reset();
  }
  forestDemo({ canvas: 'rfIdeaCanvas', trees: 'rfIdeaTrees', treesv: 'rfIdeaTreesv', depth: 'rfIdeaDepth', depthv: 'rfIdeaDepthv', readout: 'rfIdeaReadout', shuffle: 'rfIdeaShuffle' }, seedCurve, { auto: true, test: false });
  forestDemo({ canvas: 'rfPlayCanvas', trees: 'rfTrees', treesv: 'rfTreesv', depth: 'rfDepth', depthv: 'rfDepthv', readout: 'rfReadout', train: 'rfTrain', reset: 'rfReset', place: 'rfPlace', classAttr: 'rfclass' }, seedCurve, { auto: false, test: true });
  forestDemo({ canvas: 'rfTuneCanvas', trees: 'rfTuneTrees', treesv: 'rfTuneTreesv', depth: 'rfTuneDepth', depthv: 'rfTuneDepthv', readout: 'rfTuneReadout', shuffle: 'rfTuneShuffle' }, seedCurve, { auto: true, test: false });

  // ---------- Naive Bayes L1/L2/L3 ----------
  (function nbIdea() {
    const cv = document.getElementById('nbIdeaCanvas'), ctx = cv.getContext('2d');
    const pts = seedBayes(cv.width, cv.height);
    const model = trainNB(pts.map(p => normPoint(cv, p)), .04);
    function draw() {
      const x = +document.getElementById('nbIdeaX').value, y = +document.getElementById('nbIdeaY').value;
      document.getElementById('nbIdeaXv').textContent = x.toFixed(2); document.getElementById('nbIdeaYv').textContent = y.toFixed(2);
      ctx.clearRect(0, 0, cv.width, cv.height);
      drawProb(ctx, cv.width, cv.height, (px, py) => nbScores(model, px, py).p, .32);
      pts.forEach(p => ML.dot(ctx, p.x, p.y, 6, COL[p.c], 'rgba(255,255,255,.55)'));
      const s = nbScores(model, x, y);
      star(ctx, x * cv.width, y * cv.height, 11, COL[s.p >= .5 ? 1 : 0]);
      document.getElementById('nbIdeaReadout').innerHTML = `Evidence gives P(blue) = <b>${s.p.toFixed(2)}</b>, so the probe is <b>${s.p >= .5 ? '🔵 Class B' : '🔴 Class A'}</b>.`;
    }
    document.getElementById('nbIdeaX').addEventListener('input', draw);
    document.getElementById('nbIdeaY').addEventListener('input', draw);
    draw();
  })();

  function nbPlay(ids, seedFn, options) {
    const cv = document.getElementById(ids.canvas), ctx = cv.getContext('2d');
    let pts = [], addClass = 0, placing = false, test = null;
    function smooth() { return +document.getElementById(ids.smooth).value; }
    function model() { return trainNB(pts.map(p => normPoint(cv, p)), smooth()); }
    function reset() { pts = seedFn(cv.width, cv.height); test = options.test ? { x: cv.width * .5, y: cv.height * .5 } : null; pulse(); }
    function draw(progress) {
      progress = progress === undefined ? 1 : progress;
      const sm = smooth(); document.getElementById(ids.smoothv).textContent = sm.toFixed(2);
      const m = model();
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (m.ready) drawProb(ctx, cv.width, cv.height, (x, y) => nbScores(m, x, y).p, .12 + .20 * progress);
      pts.forEach(p => ML.dot(ctx, p.x, p.y, 6, COL[p.c], 'rgba(255,255,255,.55)'));
      let msg = `Smoothing <b>${sm.toFixed(2)}</b>.`;
      if (test && m.ready) {
        const s = nbScores(m, test.x / cv.width, test.y / cv.height);
        star(ctx, test.x, test.y, 8 + 5 * progress, COL[s.p >= .5 ? 1 : 0]);
        msg += ` ★ P(blue) = <b>${s.p.toFixed(2)}</b> → <b>${s.p >= .5 ? '🔵 Class B' : '🔴 Class A'}</b>.`;
      } else if (!m.ready) msg = 'Add at least one point from each class.';
      else msg += ' Place the ★ test point to compare class evidence.';
      document.getElementById(ids.readout).innerHTML = msg;
    }
    function pulse() { animate(320, draw, () => draw()); }
    if (ids.reset) document.getElementById(ids.reset).addEventListener('click', reset);
    if (ids.shuffle) document.getElementById(ids.shuffle).addEventListener('click', reset);
    document.getElementById(ids.smooth).addEventListener('input', pulse);
    if (ids.place) document.getElementById(ids.place).addEventListener('click', function () { placing = !placing; this.classList.toggle('active', placing); });
    cv.addEventListener('click', e => {
      if (!ids.place) return;
      const p = ML.pos(cv, e);
      if (placing) { test = p; placing = false; document.getElementById(ids.place).classList.remove('active'); }
      else pts.push({ x: p.x, y: p.y, c: addClass });
      pulse();
    });
    if (ids.classAttr) document.querySelectorAll(`#t2 .seg[data-${ids.classAttr}]`).forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll(`#t2 .seg[data-${ids.classAttr}]`).forEach(x => x.classList.remove('active'));
      b.classList.add('active'); addClass = +b.dataset[ids.classAttr];
    }));
    reset();
  }
  nbPlay({ canvas: 'nbPlayCanvas', smooth: 'nbSmooth', smoothv: 'nbSmoothv', readout: 'nbReadout', reset: 'nbReset', place: 'nbPlace', classAttr: 'nbclass' }, seedBayes, { test: true });
  nbPlay({ canvas: 'nbTuneCanvas', smooth: 'nbTuneSmooth', smoothv: 'nbTuneSmoothv', readout: 'nbTuneReadout', shuffle: 'nbTuneShuffle' }, seedBayes, { test: false });
})();
