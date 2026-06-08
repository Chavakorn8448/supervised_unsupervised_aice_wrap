// ===== TOPIC 4: K-Means =====
(function () {
  const PAL = ['#ff5d6c', '#3aa0ff', '#46e08a', '#ffd35c', '#b07bff', '#46e0c8'];

  // generic k-means used by the elbow + segments demos
  function runKMeans(pts, k, iters) {
    let cents = [];
    const used = new Set();
    while (cents.length < k) { const i = (Math.random() * pts.length) | 0; if (!used.has(i)) { used.add(i); cents.push({ x: pts[i].x, y: pts[i].y }); } }
    let assign = new Array(pts.length).fill(0);
    for (let it = 0; it < iters; it++) {
      pts.forEach((p, i) => { let bd = 1e9, bi = 0; cents.forEach((c, ci) => { const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2; if (d < bd) { bd = d; bi = ci; } }); assign[i] = bi; });
      cents.forEach((c, ci) => { const g = pts.filter((p, i) => assign[i] === ci); if (g.length) { c.x = g.reduce((s, p) => s + p.x, 0) / g.length; c.y = g.reduce((s, p) => s + p.y, 0) / g.length; } });
    }
    let inertia = 0; pts.forEach((p, i) => { const c = cents[assign[i]]; inertia += (c.x - p.x) ** 2 + (c.y - p.y) ** 2; });
    return { cents, assign, inertia };
  }
  function diamond(ctx, c, col) {
    ctx.fillStyle = col; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(c.x, c.y - 12); ctx.lineTo(c.x + 12, c.y); ctx.lineTo(c.x, c.y + 12); ctx.lineTo(c.x - 12, c.y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  // ---------- L1: step-through playground ----------
  (function playground() {
    const cv = document.getElementById('kmCanvas'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    let pts = [], cents = [], k = 3, phase = 'assign', auto = null;
    function scatter() { pts = []; const g = 3 + (Math.random() * 2 | 0); for (let i = 0; i < g; i++) { const cx = 80 + Math.random() * (W - 160), cy = 70 + Math.random() * (H - 140), n = 12 + (Math.random() * 10 | 0); for (let j = 0; j < n; j++) pts.push({ x: cx + (Math.random() - .5) * 90, y: cy + (Math.random() - .5) * 90, c: -1 }); } }
    function newCenters() { cents = []; for (let i = 0; i < k; i++) cents.push({ x: 60 + Math.random() * (W - 120), y: 50 + Math.random() * (H - 100) }); pts.forEach(p => p.c = -1); phase = 'assign'; msg('New centers placed. Press <b>Step</b> to assign each point to its nearest center.'); }
    function assign() { pts.forEach(p => { let bd = 1e9, bi = 0; cents.forEach((c, i) => { const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2; if (d < bd) { bd = d; bi = i; } }); p.c = bi; }); phase = 'update'; msg('<b>Assign:</b> every point is now coloured by its nearest center. Press <b>Step</b> to move centers to their group\'s middle.'); }
    function update() { let shift = 0; cents.forEach((c, i) => { const g = pts.filter(p => p.c === i); if (g.length) { const nx = g.reduce((s, p) => s + p.x, 0) / g.length, ny = g.reduce((s, p) => s + p.y, 0) / g.length; shift += Math.hypot(nx - c.x, ny - c.y); c.x = nx; c.y = ny; } }); phase = 'assign'; msg(shift < 0.5 ? '✅ <b>Converged!</b> The centers stopped moving — K-Means found stable clusters.' : '<b>Update:</b> centers jumped to the average of their points. Press <b>Step</b> to re-assign.'); }
    function step() { if (phase === 'assign') assign(); else update(); draw(); }
    function draw() { ctx.clearRect(0, 0, W, H); pts.forEach(p => ML.dot(ctx, p.x, p.y, 6, p.c < 0 ? '#7e87bf' : PAL[p.c])); cents.forEach((c, i) => diamond(ctx, c, PAL[i])); }
    function msg(h) { document.getElementById('kmReadout').innerHTML = h; }
    document.getElementById('kmStep').addEventListener('click', step);
    document.getElementById('kmReset').addEventListener('click', () => { newCenters(); draw(); });
    document.getElementById('kmScatter').addEventListener('click', () => { scatter(); newCenters(); draw(); });
    document.getElementById('kmK').addEventListener('input', function () { k = +this.value; document.getElementById('kmKval').textContent = k; newCenters(); draw(); });
    document.getElementById('kmAuto').addEventListener('click', function () { if (auto) { clearInterval(auto); auto = null; this.textContent = 'Auto-run ⏩'; return; } this.textContent = 'Stop ⏸'; auto = setInterval(step, 700); });
    scatter(); newCenters(); draw();
  })();

  // ---------- L2: elbow method ----------
  (function elbow() {
    const cv = document.getElementById('elbowCanvas'), ctx = cv.getContext('2d');
    const sc = document.getElementById('elbowScatter'), sx = sc.getContext('2d');
    const W = cv.width, H = cv.height;
    let pts = [], inertias = [], k = 3, trueK = 4;
    function gen() {
      pts = []; trueK = 3 + (Math.random() * 2 | 0);
      for (let g = 0; g < trueK; g++) { const cx = 40 + Math.random() * (sc.width - 80), cy = 30 + Math.random() * (sc.height - 60); for (let i = 0; i < 16; i++) pts.push({ x: cx + (Math.random() - .5) * 40, y: cy + (Math.random() - .5) * 40 }); }
      inertias = []; for (let kk = 1; kk <= 8; kk++) { let best = 1e18; for (let t = 0; t < 4; t++) best = Math.min(best, runKMeans(pts, kk, 10).inertia); inertias.push(best); }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const PAD = 36, mx = inertias[0];
      ctx.strokeStyle = '#2c3470'; ctx.beginPath(); ctx.moveTo(PAD, 20); ctx.lineTo(PAD, H - PAD); ctx.lineTo(W - 14, H - PAD); ctx.stroke();
      ctx.fillStyle = '#9aa3d4'; ctx.font = '11px Segoe UI'; ctx.fillText('number of clusters k →', PAD, H - 12); ctx.save(); ctx.translate(14, H - PAD); ctx.rotate(-Math.PI / 2); ctx.fillText('tightness (inertia) →', 0, 0); ctx.restore();
      const X = kk => PAD + (kk - 1) / 7 * (W - PAD - 18), Y = v => 20 + (1 - v / mx) * (H - PAD - 20);
      ctx.strokeStyle = '#46e0c8'; ctx.lineWidth = 2.5; ctx.beginPath(); inertias.forEach((v, i) => ctx[i ? 'lineTo' : 'moveTo'](X(i + 1), Y(v))); ctx.stroke();
      inertias.forEach((v, i) => ML.dot(ctx, X(i + 1), Y(v), (i + 1) === k ? 7 : 4, (i + 1) === k ? '#ffd35c' : '#46e0c8'));
      ctx.fillStyle = '#9aa3d4'; for (let kk = 1; kk <= 8; kk++) ctx.fillText(kk, X(kk) - 3, H - PAD + 14);
      // arrow at the true elbow
      ctx.fillStyle = '#ffd35c'; ctx.font = '11px Segoe UI'; ctx.fillText('← elbow', X(trueK) + 10, Y(inertias[trueK - 1]));
      // scatter coloured by current k
      const r = runKMeans(pts, k, 12);
      sx.clearRect(0, 0, sc.width, sc.height);
      pts.forEach((p, i) => ML.dot(sx, p.x, p.y, 4, PAL[r.assign[i] % PAL.length]));
      r.cents.forEach((c, i) => diamond(sx, c, PAL[i % PAL.length]));
      document.getElementById('elbowReadout').innerHTML = `You picked <b>k = ${k}</b>. The data really has about <b>${trueK}</b> groups — that's where the curve bends sharpest. ` + (k === trueK ? '🎯 Nailed it!' : k < trueK ? 'Too few — some real groups are merged.' : 'Too many — real groups got split.');
    }
    document.getElementById('elbowK').addEventListener('input', function () { k = +this.value; document.getElementById('elbowKv').textContent = k; draw(); });
    document.getElementById('elbowNew').addEventListener('click', () => { gen(); draw(); });
    gen(); draw();
  })();

  // ---------- L3: customer segments ----------
  (function segments() {
    const cv = document.getElementById('segCanvas'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    let pts = [], result = null, k = 4, anim = null;
    function gen() {
      pts = [];
      const blobs = [[140, 300], [380, 120], [380, 320], [200, 130], [300, 230]];
      blobs.forEach(([cx, cy]) => { for (let i = 0; i < 22; i++) pts.push({ x: cx + (Math.random() - .5) * 95, y: cy + (Math.random() - .5) * 95 }); });
      result = null;
    }
    // one assign+update pass on a persistent set of centers (so it visibly settles)
    function stepKMeans(cents, assign) {
      pts.forEach((p, i) => { let bd = 1e9, bi = 0; cents.forEach((c, ci) => { const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2; if (d < bd) { bd = d; bi = ci; } }); assign[i] = bi; });
      cents.forEach((c, ci) => { const g = pts.filter((p, i) => assign[i] === ci); if (g.length) { c.x = g.reduce((s, p) => s + p.x, 0) / g.length; c.y = g.reduce((s, p) => s + p.y, 0) / g.length; } });
    }
    function axesDraw() {
      ctx.strokeStyle = '#2c3470'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(40, 20); ctx.lineTo(40, H - 34); ctx.lineTo(W - 14, H - 34); ctx.stroke();
      ctx.fillStyle = '#9aa3d4'; ctx.font = '12px Segoe UI'; ctx.fillText('annual income →', W - 150, H - 14);
      ctx.save(); ctx.translate(16, 140); ctx.rotate(-Math.PI / 2); ctx.fillText('spending score →', 0, 0); ctx.restore();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H); axesDraw();
      if (result) { pts.forEach((p, i) => ML.dot(ctx, p.x, p.y, 5, PAL[result.assign[i] % PAL.length])); result.cents.forEach((c, i) => diamond(ctx, c, PAL[i % PAL.length])); }
      else pts.forEach(p => ML.dot(ctx, p.x, p.y, 5, '#7e87bf'));
    }
    document.getElementById('segK').addEventListener('input', function () { k = +this.value; document.getElementById('segKv').textContent = k; });
    document.getElementById('segReset').addEventListener('click', () => { if (anim) clearInterval(anim); gen(); draw(); document.getElementById('segReadout').innerHTML = 'Each axis is a real customer trait. Press <b>Find segments</b> to let K-Means group similar customers.'; });
    document.getElementById('segRun').addEventListener('click', () => {
      if (anim) clearInterval(anim);
      const cents = []; const used = new Set();
      while (cents.length < k) { const i = (Math.random() * pts.length) | 0; if (!used.has(i)) { used.add(i); cents.push({ x: pts[i].x, y: pts[i].y }); } }
      const assign = new Array(pts.length).fill(0);
      let it = 0;
      anim = setInterval(() => { it++; stepKMeans(cents, assign); result = { cents, assign }; draw(); if (it >= 9) { clearInterval(anim); document.getElementById('segReadout').innerHTML = `K-Means split the customers into <b>${k}</b> segments — e.g. high-income/high-spending vs. budget-conscious. A business could now target each group differently.`; } }, 250);
    });
    gen(); draw();
  })();
})();
