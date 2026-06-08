// ===== SESSION 3: Linear regression =====
(function () {
  const cv = document.getElementById('regCanvas');
  const ctx = cv.getContext('2d');
  const PAD = 40;
  let pts = [];          // data points in DATA coords (x 0..10, y 0..10)
  let manual = false;
  let mLine = { m: 0.5, b: 2 }; // manual line
  let drag = null;       // {type:'pt', i} or {type:'line'}

  // coordinate transforms (data <-> pixel)
  const W = cv.width, H = cv.height;
  const px = x => PAD + x / 10 * (W - 2 * PAD);
  const py = y => H - PAD - y / 10 * (H - 2 * PAD);
  const dx = X => (X - PAD) / (W - 2 * PAD) * 10;
  const dy = Y => (H - PAD - Y) / (H - 2 * PAD) * 10;

  function seed() {
    pts = [];
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * 9 + .5;
      const y = 0.8 * x + 1 + (Math.random() - .5) * 2.5;
      pts.push({ x, y: Math.max(.2, Math.min(9.8, y)) });
    }
  }

  function fit() {
    const n = pts.length;
    if (n < 2) return null;
    let sx = 0, sy = 0, sxy = 0, sxx = 0;
    pts.forEach(p => { sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; });
    const m = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1e-9);
    const b = (sy - m * sx) / n;
    return { m, b };
  }
  function mse(line) {
    if (!line || !pts.length) return null;
    let s = 0; pts.forEach(p => { const e = p.y - (line.m * p.x + line.b); s += e * e; });
    return s / pts.length;
  }

  function pos(e) {
    const r = cv.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { X: (t.clientX - r.left) * W / r.width, Y: (t.clientY - r.top) * H / r.height };
  }

  function activeLine() { return manual ? mLine : fit(); }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // axes
    ctx.strokeStyle = '#2c3470'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD); ctx.stroke();
    ctx.fillStyle = '#9aa3d4'; ctx.font = '12px Segoe UI';
    ctx.fillText('size / hours →', W - 130, H - PAD + 26);
    ctx.save(); ctx.translate(16, 90); ctx.rotate(-Math.PI / 2);
    ctx.fillText('price / score →', 0, 0); ctx.restore();

    const line = activeLine();
    // residuals
    if (document.getElementById('regResid').checked && line) {
      ctx.strokeStyle = 'rgba(255,211,92,.7)'; ctx.lineWidth = 1.5;
      pts.forEach(p => {
        const yhat = line.m * p.x + line.b;
        ctx.beginPath(); ctx.moveTo(px(p.x), py(p.y)); ctx.lineTo(px(p.x), py(yhat)); ctx.stroke();
      });
    }
    // line
    if (line) {
      ctx.strokeStyle = manual ? '#ffd35c' : '#46e0c8'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px(0), py(line.b));
      ctx.lineTo(px(10), py(line.m * 10 + line.b));
      ctx.stroke();
    }
    // points
    pts.forEach(p => {
      ctx.fillStyle = '#6c8cff';
      ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 7, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    });
    // prediction marker
    const xv = +document.getElementById('regX').value;
    if (line) {
      const yv = line.m * xv + line.b;
      ctx.fillStyle = '#46e08a';
      ctx.beginPath(); ctx.arc(px(xv), py(yv), 6, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(px(xv), H - PAD); ctx.lineTo(px(xv), py(yv)); ctx.stroke();
      ctx.setLineDash([]);
      document.getElementById('regPred').innerHTML = `ŷ = <b>${yv.toFixed(2)}</b>`;
    }
    // stats
    if (line) {
      document.getElementById('regEq').textContent = `y = ${line.m.toFixed(2)}·x + ${line.b.toFixed(2)}`;
      const e = mse(line);
      document.getElementById('regMse').textContent = e == null ? '—' : e.toFixed(3);
    } else {
      document.getElementById('regEq').textContent = 'add ≥2 points';
      document.getElementById('regMse').textContent = '—';
    }
  }

  // interactions
  cv.addEventListener('pointerdown', e => {
    const { X, Y } = pos(e);
    // grab existing point?
    for (let i = 0; i < pts.length; i++)
      if (Math.hypot(px(pts[i].x) - X, py(pts[i].y) - Y) < 12) { drag = { type: 'pt', i }; return; }
    if (manual) { drag = { type: 'line', startY: Y, b0: mLine.b }; return; }
    // else add a point
    pts.push({ x: Math.max(0, Math.min(10, dx(X))), y: Math.max(0, Math.min(10, dy(Y))) });
    draw();
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    const { X, Y } = pos(e);
    if (drag.type === 'pt') {
      pts[drag.i] = { x: Math.max(0, Math.min(10, dx(X))), y: Math.max(0, Math.min(10, dy(Y))) };
    } else if (drag.type === 'line') {
      mLine.b = Math.max(-5, Math.min(15, dy(Y)));
    }
    draw();
  });
  window.addEventListener('pointerup', () => drag = null);

  document.getElementById('regResid').addEventListener('change', draw);
  document.getElementById('regManual').addEventListener('change', function () {
    manual = this.checked;
    if (manual) { const f = fit(); if (f) mLine = { ...f }; }
    draw();
  });
  document.getElementById('regX').addEventListener('input', function () {
    document.getElementById('regXval').textContent = (+this.value).toFixed(1); draw();
  });
  document.getElementById('regClear').addEventListener('click', () => { pts = []; draw(); });
  document.getElementById('regSeed').addEventListener('click', () => { seed(); draw(); });

  seed(); draw();
})();
