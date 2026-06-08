// ===== TOPIC 6: Neural Networks =====
(function () {
  const sig = z => 1 / (1 + Math.exp(-z));

  // ---------- L1: single neuron ----------
  (function neuron() {
    const cv = document.getElementById('neuronCanvas'), ctx = cv.getContext('2d');
    const ids = ['nx1', 'nw1', 'nx2', 'nw2', 'nb'];
    function draw() {
      const v = {}; ids.forEach(i => { v[i] = +document.getElementById(i).value; document.getElementById(i + 'v').textContent = v[i].toFixed(2); });
      const z = v.nx1 * v.nw1 + v.nx2 * v.nw2 + v.nb, out = sig(z);
      ctx.clearRect(0, 0, cv.width, cv.height);
      const ix = 70, ox = 360, mid = 150;
      node(ix, 90, '#6c8cff', 'x₁=' + v.nx1.toFixed(2)); node(ix, 210, '#6c8cff', 'x₂=' + v.nx2.toFixed(2));
      edge(ix, 90, ox, mid, v.nw1, 'w₁=' + v.nw1.toFixed(2), 70); edge(ix, 210, ox, mid, v.nw2, 'w₂=' + v.nw2.toFixed(2), 235);
      const g = Math.round(60 + out * 195);
      ctx.fillStyle = `rgb(${Math.round(255 - out * 130)},${g},120)`; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(ox, mid, 38, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#06210f'; ctx.font = 'bold 15px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('Σ → f', ox, mid + 5);
      ctx.strokeStyle = '#46e0c8'; ctx.lineWidth = 3 + out * 6; ctx.beginPath(); ctx.moveTo(ox + 38, mid); ctx.lineTo(ox + 120, mid); ctx.stroke();
      ctx.fillStyle = '#46e0c8'; ctx.font = 'bold 16px Segoe UI'; ctx.fillText('output ' + out.toFixed(2), ox + 75, mid - 14); ctx.textAlign = 'left';
      document.getElementById('neuronReadout').innerHTML = `z = x₁·w₁ + x₂·w₂ + b = <b>${z.toFixed(2)}</b><br>f(z) = sigmoid(z) = <b>${out.toFixed(3)}</b> → the neuron fires ${out > .5 ? '<b>strongly 🔥</b>' : '<b>weakly 💤</b>'}`;
    }
    function node(x, y, c, label) { ML.dot(ctx, x, y, 26, c, '#fff'); ctx.fillStyle = '#fff'; ctx.font = '12px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(label, x, y + 4); ctx.textAlign = 'left'; }
    function edge(x1, y1, x2, y2, w, label, ly) { ctx.strokeStyle = w >= 0 ? 'rgba(70,224,138,.85)' : 'rgba(255,93,108,.85)'; ctx.lineWidth = 1 + Math.abs(w) * 3; ctx.beginPath(); ctx.moveTo(x1 + 26, y1); ctx.lineTo(x2 - 38, y2); ctx.stroke(); ctx.fillStyle = '#9aa3d4'; ctx.font = '12px Segoe UI'; ctx.fillText(label, 150, ly); }
    ids.forEach(i => document.getElementById(i).addEventListener('input', draw)); draw();
  })();

  // ---------- L2: activation explorer ----------
  (function activation() {
    const cv = document.getElementById('actCanvas'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    const fns = {
      sigmoid: { f: sig, lo: 0, hi: 1, desc: 'Squashes any number into <b>0 to 1</b> — perfect for a probability. Big positive → ~1, big negative → ~0.' },
      tanh: { f: Math.tanh, lo: -1, hi: 1, desc: 'Like sigmoid but ranges <b>−1 to 1</b>, centred on zero. Often trains a little faster.' },
      relu: { f: z => Math.max(0, z), lo: 0, hi: 4, desc: 'The simplest and most popular: <b>negative → 0, positive → unchanged</b>. Fast, and great for deep networks.' }
    };
    let cur = 'sigmoid', hover = null;
    const PAD = 40, X0 = -5, X1 = 5;
    const px = x => PAD + (x - X0) / (X1 - X0) * (W - 2 * PAD);
    function py(y, lo, hi) { return H - PAD - (y - lo) / (hi - lo) * (H - 2 * PAD); }
    function draw() {
      const fn = fns[cur]; ctx.clearRect(0, 0, W, H);
      // axes
      ctx.strokeStyle = '#2c3470'; ctx.lineWidth = 1;
      const yzero = py(0, fn.lo, fn.hi);
      ctx.beginPath(); ctx.moveTo(PAD, 14); ctx.lineTo(PAD, H - PAD); ctx.lineTo(W - 14, H - PAD); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(PAD, yzero); ctx.lineTo(W - 14, yzero); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(px(0), 14); ctx.lineTo(px(0), H - PAD); ctx.stroke();
      ctx.fillStyle = '#9aa3d4'; ctx.font = '12px Segoe UI'; ctx.fillText('input  z →', W - 90, H - PAD + 24); ctx.fillText('output f(z)', PAD - 30, 24);
      // curve
      ctx.strokeStyle = '#46e0c8'; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = X0 + i / 200 * (X1 - X0), y = fn.f(x); ctx[i ? 'lineTo' : 'moveTo'](px(x), py(y, fn.lo, fn.hi)); } ctx.stroke();
      if (hover !== null) {
        const y = fn.f(hover);
        ctx.strokeStyle = 'rgba(255,211,92,.6)'; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(px(hover), H - PAD); ctx.lineTo(px(hover), py(y, fn.lo, fn.hi)); ctx.lineTo(PAD, py(y, fn.lo, fn.hi)); ctx.stroke(); ctx.setLineDash([]);
        ML.dot(ctx, px(hover), py(y, fn.lo, fn.hi), 6, '#ffd35c', '#fff');
        document.getElementById('actReadout').innerHTML = `Input z = <b>${hover.toFixed(2)}</b> → output = <b>${y.toFixed(3)}</b>. ${fn.desc}`;
      } else document.getElementById('actReadout').innerHTML = `Hover the curve to read values. ${fn.desc}`;
    }
    cv.addEventListener('pointermove', e => { const { x } = ML.pos(cv, e); hover = X0 + (x - PAD) / (W - 2 * PAD) * (X1 - X0); hover = Math.max(X0, Math.min(X1, hover)); draw(); });
    cv.addEventListener('pointerleave', () => { hover = null; draw(); });
    document.querySelectorAll('#actBtns .seg').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('#actBtns .seg').forEach(x => x.classList.remove('active')); b.classList.add('active'); cur = b.dataset.act; draw(); }));
    draw();
  })();

  // ---------- L3: trainable network + loss curve ----------
  (function net() {
    const cv = document.getElementById('netCanvas'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    const lc = document.getElementById('lossCanvas'), lx = lc.getContext('2d');
    let data = [], N = null, timer = null, epoch = 0, Hn = 8, pattern = 'linear', losses = [];
    function gen() { data = []; for (let i = 0; i < 160; i++) { const x = Math.random(), y = Math.random(); let c; if (pattern === 'linear') c = (x + y > 1) ? 1 : 0; else if (pattern === 'circle') c = (Math.hypot(x - .5, y - .5) < .32) ? 1 : 0; else c = ((x > .5) ^ (y > .5)) ? 1 : 0; data.push({ x, y, c }); } }
    function init() { N = { W1: [], b1: [], W2: [], b2: Math.random() - .5 }; for (let h = 0; h < Hn; h++) { N.W1.push([(Math.random() - .5) * 2, (Math.random() - .5) * 2]); N.b1.push((Math.random() - .5) * 2); N.W2.push((Math.random() - .5) * 2); } epoch = 0; losses = []; }
    function fwd(x, y) { const h = new Array(Hn); for (let i = 0; i < Hn; i++) h[i] = Math.tanh(N.W1[i][0] * x + N.W1[i][1] * y + N.b1[i]); let z = N.b2; for (let i = 0; i < Hn; i++) z += N.W2[i] * h[i]; return { out: sig(z), h }; }
    function trainEpoch() { const lr = 0.5; let loss = 0; for (const d of data) { const { out, h } = fwd(d.x, d.y); const dz2 = out - d.c; loss += -(d.c * Math.log(out + 1e-7) + (1 - d.c) * Math.log(1 - out + 1e-7)); for (let i = 0; i < Hn; i++) { const dz1 = dz2 * N.W2[i] * (1 - h[i] * h[i]); N.W2[i] -= lr * dz2 * h[i]; N.W1[i][0] -= lr * dz1 * d.x; N.W1[i][1] -= lr * dz1 * d.y; N.b1[i] -= lr * dz1; } N.b2 -= lr * dz2; } epoch++; losses.push(loss / data.length); if (losses.length > 200) losses.shift(); }
    function drawLoss() {
      lx.clearRect(0, 0, lc.width, lc.height); lx.fillStyle = '#9aa3d4'; lx.font = '10px Segoe UI'; lx.fillText('loss (error) ↓', 4, 12);
      if (losses.length < 2) return; const mx = Math.max(...losses), mn = Math.min(...losses);
      lx.strokeStyle = '#ff5d6c'; lx.lineWidth = 2; lx.beginPath();
      losses.forEach((l, i) => { const X = i / (losses.length - 1) * (lc.width - 6) + 3, Y = 20 + (1 - (l - mn) / (mx - mn + 1e-6)) * (lc.height - 28); lx[i ? 'lineTo' : 'moveTo'](X, Y); }); lx.stroke();
    }
    function draw() {
      const step = 8;
      for (let X = 0; X < W; X += step) for (let Y = 0; Y < H; Y += step) ctx.fillStyle = ML.classFill(fwd(X / W, Y / H).out, .30), ctx.fillRect(X, Y, step, step);
      data.forEach(d => ML.dot(ctx, d.x * W, d.y * H, 5, ML.COL[d.c], 'rgba(255,255,255,.55)'));
      let correct = 0; data.forEach(d => { if ((fwd(d.x, d.y).out >= .5 ? 1 : 0) === d.c) correct++; });
      document.getElementById('netReadout').innerHTML = `Epoch <b>${epoch}</b> · accuracy <b>${(100 * correct / data.length).toFixed(0)}%</b>`;
      drawLoss();
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; document.getElementById('netTrain').textContent = 'Train ▶'; } }
    document.getElementById('netTrain').addEventListener('click', function () { if (timer) { stop(); return; } this.textContent = 'Pause ⏸'; timer = setInterval(() => { for (let i = 0; i < 4; i++) trainEpoch(); draw(); if (epoch > 1500) stop(); }, 40); });
    document.getElementById('netReset').addEventListener('click', () => { stop(); init(); draw(); });
    document.getElementById('netPattern').addEventListener('change', function () { stop(); pattern = this.value; gen(); init(); draw(); });
    document.getElementById('netH').addEventListener('input', function () { stop(); Hn = +this.value; document.getElementById('netHv').textContent = Hn; init(); draw(); });
    gen(); init(); draw();
  })();
})();
