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
  function fit(pts) {
    const n = pts.length; if (n < 2) return null;
    let sx = 0, sy = 0, sxy = 0, sxx = 0;
    pts.forEach(p => { sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; });
    const m = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1e-9);
    return { m, b: (sy - m * sx) / n };
  }
  const mse = (pts, l) => pts.length ? pts.reduce((s, p) => s + (p.y - (l.m * p.x + l.b)) ** 2, 0) / pts.length : null;

  // ---------- L1: best-fit playground ----------
  (function playground() {
    const cv = document.getElementById('regCanvas'), ctx = cv.getContext('2d'), PAD = 40, M = mk(cv, PAD);
    let pts = [], drag = null;
    function seed() { pts = []; for (let i = 0; i < 12; i++) { const x = Math.random() * 9 + .5; pts.push({ x, y: Math.max(.2, Math.min(9.8, .8 * x + 1 + (Math.random() - .5) * 2.5)) }); } }
    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height); axes(cv, ctx, PAD, 'hours studied →', 'exam score →');
      const line = fit(pts);
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
    cv.addEventListener('pointerdown', e => {
      const { x: X, y: Y } = ML.pos(cv, e);
      for (let i = 0; i < pts.length; i++) if (Math.hypot(M.px(pts[i].x) - X, M.py(pts[i].y) - Y) < 12) { drag = i; return; }
      pts.push({ x: Math.max(0, Math.min(10, M.dx(X))), y: Math.max(0, Math.min(10, M.dy(Y))) }); draw();
    });
    cv.addEventListener('pointermove', e => { if (drag === null) return; const { x: X, y: Y } = ML.pos(cv, e); pts[drag] = { x: Math.max(0, Math.min(10, M.dx(X))), y: Math.max(0, Math.min(10, M.dy(Y))) }; draw(); });
    window.addEventListener('pointerup', () => drag = null);
    document.getElementById('regResid').addEventListener('change', draw);
    document.getElementById('regX').addEventListener('input', function () { document.getElementById('regXval').textContent = (+this.value).toFixed(1); draw(); });
    document.getElementById('regClear').addEventListener('click', () => { pts = []; draw(); });
    document.getElementById('regSeed').addEventListener('click', () => { seed(); draw(); });
    seed(); draw();
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
})();
