// ===== TOPIC 6: Neural Networks =====
(function () {
  const sig = z => 1 / (1 + Math.exp(-z));

  // ---------- L1: single neuron ----------
  (function neuron() {
    const cv = document.getElementById('neuronCanvas'), ctx = cv.getContext('2d');
    const ids = ['nx1', 'nw1', 'nx2', 'nw2', 'nb'];
    let stepping = false, step = 0, playTimer = null;
    const STEPS = [
      { keys: ['x1', 'x2'], text: v => `Two numbers come in — that's the input.<br><span class="muted">x₁ = ${v.nx1.toFixed(2)}, x₂ = ${v.nx2.toFixed(2)}</span>` },
      { keys: ['w1', 'w2'], text: v => `Each input has an "importance" (its weight), plus a starting nudge (the bias).<br><span class="muted">w₁ = ${v.nw1.toFixed(2)}, w₂ = ${v.nw2.toFixed(2)}, b = ${v.nb.toFixed(2)}</span>` },
      { keys: ['x1', 'w1'], text: v => `Multiply the first input by how important it is.<br><span class="muted">x₁ × w₁ = ${v.nx1.toFixed(2)} × ${v.nw1.toFixed(2)} = ${(v.nx1 * v.nw1).toFixed(2)}</span>` },
      { keys: ['x2', 'w2'], text: v => `Multiply the second input the same way.<br><span class="muted">x₂ × w₂ = ${v.nx2.toFixed(2)} × ${v.nw2.toFixed(2)} = ${(v.nx2 * v.nw2).toFixed(2)}</span>` },
      { keys: ['sum'], text: (v, z) => `Add both of those up, plus the starting nudge.<br><span class="muted">${(v.nx1 * v.nw1).toFixed(2)} + ${(v.nx2 * v.nw2).toFixed(2)} + ${v.nb.toFixed(2)} = ${z.toFixed(2)}</span>` },
      { keys: ['sum'], text: (v, z, out) => `Squash that total into a "how confident" score between 0 and 1.<br><span class="muted">sigmoid(${z.toFixed(2)}) = ${out.toFixed(3)}</span>` },
      { keys: ['out'], text: (v, z, out) => `That's the neuron's answer: <b>${out.toFixed(3)}</b> → it fires ${out > .5 ? '<b>strongly 🔥</b>' : '<b>weakly 💤</b>'}.` }
    ];
    function seenSet(i) { const s = new Set(); for (let k = 0; k <= i; k++) STEPS[k].keys.forEach(x => s.add(x)); return s; }
    function nodeS(x, y, c, label, alpha, glow) {
      ctx.globalAlpha = alpha;
      if (glow) { ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 16; }
      ML.dot(ctx, x, y, 26, c, '#fff');
      if (glow) ctx.restore();
      ctx.fillStyle = '#fff'; ctx.font = '12px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(label, x, y + 4); ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }
    function edgeS(x1, y1, x2, y2, w, label, ly, alpha, glow) {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = w >= 0 ? 'rgba(70,224,138,.85)' : 'rgba(255,93,108,.85)';
      ctx.lineWidth = (1 + Math.abs(w) * 3) * (glow ? 1.3 : 1);
      ctx.beginPath(); ctx.moveTo(x1 + 26, y1); ctx.lineTo(x2 - 38, y2); ctx.stroke();
      ctx.fillStyle = '#9aa3d4'; ctx.font = '12px Segoe UI'; ctx.fillText(label, 150, ly);
      ctx.globalAlpha = 1;
    }
    function drawFull(v, z, out) {
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
    function drawStepped(v, z, out) {
      const ix = 70, ox = 360, mid = 150;
      const focus = new Set(STEPS[step].keys), seen = seenSet(step);
      const a = k => focus.has(k) ? 1 : (seen.has(k) ? 0.55 : 0.15);
      nodeS(ix, 90, '#6c8cff', 'x₁=' + v.nx1.toFixed(2), a('x1'), focus.has('x1'));
      nodeS(ix, 210, '#6c8cff', 'x₂=' + v.nx2.toFixed(2), a('x2'), focus.has('x2'));
      edgeS(ix, 90, ox, mid, v.nw1, 'w₁=' + v.nw1.toFixed(2), 70, a('w1'), focus.has('w1'));
      edgeS(ix, 210, ox, mid, v.nw2, 'w₂=' + v.nw2.toFixed(2), 235, a('w2'), focus.has('w2'));
      if (seen.has('sum')) {
        const activated = step >= 5;
        ctx.globalAlpha = a('sum');
        if (focus.has('sum')) { ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 18; }
        if (activated) { const g = Math.round(60 + out * 195); ctx.fillStyle = `rgb(${Math.round(255 - out * 130)},${g},120)`; } else ctx.fillStyle = '#2c3470';
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(ox, mid, 38, 0, 7); ctx.fill(); ctx.stroke();
        if (focus.has('sum')) ctx.restore();
        ctx.fillStyle = activated ? '#06210f' : '#eef1ff'; ctx.font = 'bold 15px Segoe UI'; ctx.textAlign = 'center';
        ctx.fillText(activated ? 'Σ → f' : 'Σ', ox, mid + 5); ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
      }
      if (seen.has('out')) {
        ctx.globalAlpha = a('out');
        ctx.strokeStyle = '#46e0c8'; ctx.lineWidth = 3 + out * 6;
        ctx.beginPath(); ctx.moveTo(ox + 38, mid); ctx.lineTo(ox + 120, mid); ctx.stroke();
        ctx.fillStyle = '#46e0c8'; ctx.font = 'bold 16px Segoe UI'; ctx.fillText('output ' + out.toFixed(2), ox + 75, mid - 14);
        ctx.globalAlpha = 1;
      }
      document.getElementById('neuronReadout').innerHTML = STEPS[step].text(v, z, out) + `<br><span class="muted">Step ${step + 1} of ${STEPS.length}</span>`;
    }
    function draw() {
      const v = {}; ids.forEach(i => { v[i] = +document.getElementById(i).value; document.getElementById(i + 'v').textContent = v[i].toFixed(2); });
      const z = v.nx1 * v.nw1 + v.nx2 * v.nw2 + v.nb, out = sig(z);
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (stepping) drawStepped(v, z, out); else drawFull(v, z, out);
    }
    function node(x, y, c, label) { ML.dot(ctx, x, y, 26, c, '#fff'); ctx.fillStyle = '#fff'; ctx.font = '12px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(label, x, y + 4); ctx.textAlign = 'left'; }
    function edge(x1, y1, x2, y2, w, label, ly) { ctx.strokeStyle = w >= 0 ? 'rgba(70,224,138,.85)' : 'rgba(255,93,108,.85)'; ctx.lineWidth = 1 + Math.abs(w) * 3; ctx.beginPath(); ctx.moveTo(x1 + 26, y1); ctx.lineTo(x2 - 38, y2); ctx.stroke(); ctx.fillStyle = '#9aa3d4'; ctx.font = '12px Segoe UI'; ctx.fillText(label, 150, ly); }
    function stopPlay() { if (playTimer) { clearInterval(playTimer); playTimer = null; document.getElementById('nStepPlay').textContent = 'Play ▶'; } }
    ids.forEach(i => document.getElementById(i).addEventListener('input', () => { stopPlay(); if (stepping) step = 0; draw(); }));
    document.getElementById('nStepNext').addEventListener('click', () => { stopPlay(); if (!stepping) { stepping = true; step = 0; } else step = Math.min(step + 1, STEPS.length - 1); draw(); });
    document.getElementById('nStepBack').addEventListener('click', () => { stopPlay(); if (stepping) step = Math.max(step - 1, 0); draw(); });
    document.getElementById('nStepReset').addEventListener('click', () => { stopPlay(); stepping = false; step = 0; draw(); });
    document.getElementById('nStepPlay').addEventListener('click', function () {
      if (playTimer) { stopPlay(); return; }
      if (!stepping) { stepping = true; step = 0; }
      this.textContent = 'Pause ⏸';
      playTimer = setInterval(() => { if (step >= STEPS.length - 1) { stopPlay(); return; } step++; draw(); }, 1400);
    });
    draw();
  })();

  // ---------- L2: activation explorer ----------
  (function activation() {
    const cv = document.getElementById('actCanvas'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    const fns = {
      sigmoid: { f: sig, lo: 0, hi: 1, desc: 'Squashes any number into <b>0 to 1</b> — perfect for a probability. Big positive → ~1, big negative → ~0.' },
      tanh: { f: Math.tanh, lo: -1, hi: 1, desc: 'Same idea as sigmoid, but it can go negative too: from <b>−1</b> (strongly against) up to <b>+1</b> (strongly for), with 0 meaning "neutral." That negative side lets a neuron actively vote against something, not just weakly for it — which is why the network in the next tab uses this one for its hidden neurons.' },
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
    const nc = document.getElementById('netNeuronCanvas'), nctx = nc.getContext('2d'), NW = nc.width, NH = nc.height;
    let data = [], N = null, timer = null, epoch = 0, Hn = 8, pattern = 'linear', losses = [];
    function gen() { data = []; for (let i = 0; i < 160; i++) { const x = Math.random(), y = Math.random(); let c; if (pattern === 'linear') c = (x + y > 1) ? 1 : 0; else if (pattern === 'circle') c = (Math.hypot(x - .5, y - .5) < .32) ? 1 : 0; else c = ((x > .5) ^ (y > .5)) ? 1 : 0; data.push({ x, y, c }); } }
    function init() { N = { W1: [], b1: [], W2: [], b2: Math.random() - .5 }; for (let h = 0; h < Hn; h++) { N.W1.push([(Math.random() - .5) * 2, (Math.random() - .5) * 2]); N.b1.push((Math.random() - .5) * 2); N.W2.push((Math.random() - .5) * 2); } epoch = 0; losses = []; }
    // center inputs to [-1,1] — critical for XOR to escape the "predict 0.5" plateau
    function fwd(x, y) { const cx = x * 2 - 1, cy = y * 2 - 1; const h = new Array(Hn); for (let i = 0; i < Hn; i++) h[i] = Math.tanh(N.W1[i][0] * cx + N.W1[i][1] * cy + N.b1[i]); let z = N.b2; for (let i = 0; i < Hn; i++) z += N.W2[i] * h[i]; return { out: sig(z), h }; }
    function trainEpoch() { const lr = 0.3; let loss = 0; for (const d of data) { const cx = d.x * 2 - 1, cy = d.y * 2 - 1; const { out, h } = fwd(d.x, d.y); const dz2 = out - d.c; loss += -(d.c * Math.log(out + 1e-7) + (1 - d.c) * Math.log(1 - out + 1e-7)); for (let i = 0; i < Hn; i++) { const dz1 = dz2 * N.W2[i] * (1 - h[i] * h[i]); N.W2[i] -= lr * dz2 * h[i]; N.W1[i][0] -= lr * dz1 * cx; N.W1[i][1] -= lr * dz1 * cy; N.b1[i] -= lr * dz1; } N.b2 -= lr * dz2; } epoch++; losses.push(loss / data.length); if (losses.length > 200) losses.shift(); }
    function drawLoss() {
      lx.clearRect(0, 0, lc.width, lc.height); lx.fillStyle = '#9aa3d4'; lx.font = '10px Segoe UI'; lx.fillText('loss (error) ↓', 4, 12);
      if (losses.length < 2) return; const mx = Math.max(...losses), mn = Math.min(...losses);
      lx.strokeStyle = '#ff5d6c'; lx.lineWidth = 2; lx.beginPath();
      losses.forEach((l, i) => { const X = i / (losses.length - 1) * (lc.width - 6) + 3, Y = 20 + (1 - (l - mn) / (mx - mn + 1e-6)) * (lc.height - 28); lx[i ? 'lineTo' : 'moveTo'](X, Y); }); lx.stroke();
    }
    function actColor(t) { const p = (t + 1) / 2;
      return `rgb(${Math.round(255 + (70 - 255) * p)},${Math.round(93 + (224 - 93) * p)},${Math.round(108 + (138 - 108) * p)})`; }
    function nnode(x, y, r, c, label, fontSize) { ML.dot(nctx, x, y, r, c, '#fff'); nctx.fillStyle = '#fff'; nctx.font = fontSize + 'px Segoe UI'; nctx.textAlign = 'center'; nctx.fillText(label, x, y + 4); nctx.textAlign = 'left'; }
    function nedge(x1, y1, x2, y2, w, label, showLabel) {
      nctx.strokeStyle = w >= 0 ? 'rgba(70,224,138,.85)' : 'rgba(255,93,108,.85)';
      nctx.lineWidth = Math.min(1 + Math.abs(w) * 3, 8);
      nctx.beginPath(); nctx.moveTo(x1, y1); nctx.lineTo(x2, y2); nctx.stroke();
      if (showLabel) { nctx.fillStyle = '#9aa3d4'; nctx.font = '10px Segoe UI'; nctx.fillText(label, (x1 + x2) / 2, (y1 + y2) / 2); }
    }
    function drawNeurons(hAvg, outAvg) {
      nctx.clearRect(0, 0, NW, NH);
      const topPad = 46, botPad = 30, usableH = NH - topPad - botPad;
      const gap = Hn > 1 ? usableH / (Hn - 1) : 0;
      const r = Math.max(8, Math.min(20, gap / 2 - 3));
      const ix = 90, hx = NW / 2, ox = NW - 90;
      const hy = i => topPad + gap * i;
      const midY = topPad + usableH / 2;
      const iy1 = midY - usableH * 0.22, iy2 = midY + usableH * 0.22;
      const showW = Hn <= 6;
      const fontSize = Hn <= 8 ? 12 : 9;
      for (let i = 0; i < Hn; i++) {
        nedge(ix, iy1, hx, hy(i), N.W1[i][0], 'w=' + N.W1[i][0].toFixed(2), showW);
        nedge(ix, iy2, hx, hy(i), N.W1[i][1], 'w=' + N.W1[i][1].toFixed(2), showW);
      }
      for (let i = 0; i < Hn; i++) nedge(hx, hy(i), ox, midY, N.W2[i], 'w=' + N.W2[i].toFixed(2), showW);
      nnode(ix, iy1, 20, '#6c8cff', 'x₁', 12); nnode(ix, iy2, 20, '#6c8cff', 'x₂', 12);
      for (let i = 0; i < Hn; i++) {
        nnode(hx, hy(i), r, actColor(hAvg[i]), '', fontSize);
        nctx.fillStyle = '#eef1ff'; nctx.font = fontSize + 'px Segoe UI'; nctx.textAlign = 'left';
        nctx.fillText((hAvg[i] >= 0 ? '+' : '') + hAvg[i].toFixed(2), hx + r + 6, hy(i) + 4);
      }
      nctx.fillStyle = `rgb(${Math.round(255 - outAvg * 130)},${Math.round(60 + outAvg * 195)},120)`;
      nctx.strokeStyle = '#fff'; nctx.lineWidth = 3;
      nctx.beginPath(); nctx.arc(ox, midY, 30, 0, 7); nctx.fill(); nctx.stroke();
      nctx.fillStyle = '#06210f'; nctx.font = 'bold 13px Segoe UI'; nctx.textAlign = 'center'; nctx.fillText('Σ→f', ox, midY + 5); nctx.textAlign = 'left';
      nctx.fillStyle = '#46e0c8'; nctx.font = 'bold 13px Segoe UI'; nctx.fillText('out ' + outAvg.toFixed(2), ox - 34, midY - 40);
    }
    function draw() {
      const step = 8;
      for (let X = 0; X < W; X += step) for (let Y = 0; Y < H; Y += step) ctx.fillStyle = ML.classFill(fwd(X / W, Y / H).out, .30), ctx.fillRect(X, Y, step, step);
      data.forEach(d => ML.dot(ctx, d.x * W, d.y * H, 5, ML.COL[d.c], 'rgba(255,255,255,.55)'));
      let correct = 0; const hSum = new Array(Hn).fill(0); let outSum = 0;
      data.forEach(d => { const { out, h } = fwd(d.x, d.y); if ((out >= .5 ? 1 : 0) === d.c) correct++; outSum += out; for (let i = 0; i < Hn; i++) hSum[i] += h[i]; });
      const hAvg = hSum.map(s => s / data.length), outAvg = outSum / data.length;
      document.getElementById('netReadout').innerHTML = `Epoch <b>${epoch}</b> · accuracy <b>${(100 * correct / data.length).toFixed(0)}%</b>`;
      drawLoss();
      drawNeurons(hAvg, outAvg);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; document.getElementById('netTrain').textContent = 'Train ▶'; } }

    // ---------- step-through-training mode ----------
    const LR = 0.3;
    let netStepping = false, netStep = 0, netStepTimer = null, netExampleIdx = 0;
    function stepFwd(d) {
      const cx = d.x * 2 - 1, cy = d.y * 2 - 1;
      const z1 = new Array(Hn), h = new Array(Hn);
      for (let i = 0; i < Hn; i++) { z1[i] = N.W1[i][0] * cx + N.W1[i][1] * cy + N.b1[i]; h[i] = Math.tanh(z1[i]); }
      let z2 = N.b2; for (let i = 0; i < Hn; i++) z2 += N.W2[i] * h[i];
      return { cx, cy, z1, h, z2, out: sig(z2) };
    }
    function netTotalSteps() { return 2 * Hn + 5; }
    function moodWord(v) {
      return v > 0.5 ? 'strongly excited (leaning "yes")' : v > 0.15 ? 'a little excited' :
        v < -0.5 ? 'strongly against (leaning "no")' : v < -0.15 ? 'a little against' : 'unsure, roughly neutral';
    }
    function nnodeS(x, y, r, c, label, fontSize, alpha, glow) {
      nctx.globalAlpha = alpha;
      if (glow) { nctx.save(); nctx.shadowColor = '#fff'; nctx.shadowBlur = 16; }
      ML.dot(nctx, x, y, r, c, '#fff');
      if (glow) nctx.restore();
      nctx.fillStyle = '#fff'; nctx.font = fontSize + 'px Segoe UI'; nctx.textAlign = 'center'; nctx.fillText(label, x, y + 4); nctx.textAlign = 'left';
      nctx.globalAlpha = 1;
    }
    function nedgeS(x1, y1, x2, y2, w, label, alpha, showLabel) {
      nctx.globalAlpha = alpha;
      nctx.strokeStyle = w >= 0 ? 'rgba(70,224,138,.85)' : 'rgba(255,93,108,.85)';
      nctx.lineWidth = Math.min(1 + Math.abs(w) * 3, 8);
      nctx.beginPath(); nctx.moveTo(x1, y1); nctx.lineTo(x2, y2); nctx.stroke();
      if (showLabel) { nctx.fillStyle = '#9aa3d4'; nctx.font = '10px Segoe UI'; nctx.fillText(label, (x1 + x2) / 2, (y1 + y2) / 2); }
      nctx.globalAlpha = 1;
    }
    function drawNetStep() {
      const d = data[netExampleIdx], fw = stepFwd(d);
      const dz2 = fw.out - d.c;
      const dz1 = new Array(Hn); for (let i = 0; i < Hn; i++) dz1[i] = dz2 * N.W2[i] * (1 - fw.h[i] * fw.h[i]);
      const idxFwd = i => 1 + i, idxOutput = 1 + Hn, idxError = idxOutput + 1, idxGradOut = idxError + 1,
        idxGradHidden = i => idxGradOut + 1 + i, idxWeightUpdate = idxGradHidden(Hn - 1) + 1;
      const S = netStep;

      nctx.clearRect(0, 0, NW, NH);
      const topPad = 46, botPad = 30, usableH = NH - topPad - botPad;
      const gap = Hn > 1 ? usableH / (Hn - 1) : 0;
      const r = Math.max(8, Math.min(20, gap / 2 - 3));
      const ix = 90, hx = NW / 2, ox = NW - 90;
      const hy = i => topPad + gap * i;
      const midY = topPad + usableH / 2;
      const iy1 = midY - usableH * 0.22, iy2 = midY + usableH * 0.22;
      const showW = Hn <= 6;
      const fontSize = Hn <= 8 ? 12 : 9;

      for (let i = 0; i < Hn; i++) {
        const onFwd = S === idxFwd(i), onGrad = S === idxGradHidden(i), done = S > idxFwd(i);
        const nodeOn = onFwd || onGrad || (S === idxWeightUpdate && i === 0);
        const nodeAl = nodeOn ? 1 : (done ? 0.55 : 0.12);
        const edgeAl = onFwd ? 1 : (done ? 0.4 : 0.1);
        nedgeS(ix, iy1, hx, hy(i), N.W1[i][0], 'w=' + N.W1[i][0].toFixed(2), edgeAl, onFwd && showW);
        nedgeS(ix, iy2, hx, hy(i), N.W1[i][1], 'w=' + N.W1[i][1].toFixed(2), edgeAl, onFwd && showW);
        const fillC = S >= idxFwd(i) ? actColor(fw.h[i]) : '#2c3470';
        nnodeS(hx, hy(i), r, fillC, '', fontSize, nodeAl, nodeOn);
        if (S >= idxFwd(i)) {
          nctx.globalAlpha = nodeAl;
          nctx.fillStyle = '#eef1ff'; nctx.font = fontSize + 'px Segoe UI'; nctx.textAlign = 'left';
          nctx.fillText((fw.h[i] >= 0 ? '+' : '') + fw.h[i].toFixed(2), hx + r + 6, hy(i) + 4);
          nctx.globalAlpha = 1;
        }
      }
      const exOn = S === 0;
      nnodeS(ix, iy1, 20, '#6c8cff', 'x₁', 12, exOn ? 1 : 0.7, exOn);
      nnodeS(ix, iy2, 20, '#6c8cff', 'x₂', 12, exOn ? 1 : 0.7, exOn);
      for (let i = 0; i < Hn; i++) {
        if (S < idxOutput) continue;
        const onFwd = S === idxOutput, onGrad = S === idxGradHidden(i), onUpdate = S === idxWeightUpdate && i === 0;
        const al = (onFwd || onGrad || onUpdate) ? 1 : 0.55;
        nedgeS(hx, hy(i), ox, midY, N.W2[i], 'w=' + N.W2[i].toFixed(2), al, (onFwd || onGrad || onUpdate) && showW);
      }
      if (S >= idxOutput) {
        const on = S === idxOutput || S === idxError || S === idxGradOut;
        if (on) { nctx.save(); nctx.shadowColor = '#fff'; nctx.shadowBlur = 18; }
        nctx.fillStyle = `rgb(${Math.round(255 - fw.out * 130)},${Math.round(60 + fw.out * 195)},120)`;
        nctx.strokeStyle = '#fff'; nctx.lineWidth = 3;
        nctx.beginPath(); nctx.arc(ox, midY, 30, 0, 7); nctx.fill(); nctx.stroke();
        if (on) nctx.restore();
        nctx.fillStyle = '#06210f'; nctx.font = 'bold 13px Segoe UI'; nctx.textAlign = 'center'; nctx.fillText('Σ→f', ox, midY + 5); nctx.textAlign = 'left';
        nctx.fillStyle = '#46e0c8'; nctx.font = 'bold 13px Segoe UI'; nctx.fillText('p=' + fw.out.toFixed(2), ox - 24, midY - 40);
      }

      let plain, math;
      if (S === 0) {
        plain = `Here's one example from the data — a point that's really supposed to be class <b>${d.c}</b>.`;
        math = `x = (${d.x.toFixed(2)}, ${d.y.toFixed(2)})`;
      } else if (S <= Hn) {
        const i = S - 1;
        plain = `Neuron ${i + 1} looks at both inputs and decides how excited to get. It ends up <b>${moodWord(fw.h[i])}</b>.`;
        math = `z = ${N.W1[i][0].toFixed(2)}×${fw.cx.toFixed(2)} + ${N.W1[i][1].toFixed(2)}×${fw.cy.toFixed(2)} + ${N.b1[i].toFixed(2)} = ${fw.z1[i].toFixed(2)} → tanh(z) = ${fw.h[i].toFixed(2)}`;
      } else if (S === idxOutput) {
        plain = `Every neuron's opinion gets combined into one final guess: the network is <b>${(fw.out * 100).toFixed(0)}%</b> sure this is class 1.`;
        math = `weighted sum of every neuron's score + bias, squashed to 0–1 = ${fw.out.toFixed(3)}`;
      } else if (S === idxError) {
        const loss = -(d.c * Math.log(fw.out + 1e-7) + (1 - d.c) * Math.log(1 - fw.out + 1e-7));
        plain = `Compare that guess to the real answer (<b>${d.c}</b>) to see how wrong it was — smaller is better.`;
        math = `loss = ${loss.toFixed(3)}`;
      } else if (S === idxGradOut) {
        plain = `Work out which direction — and by how much — to correct that final guess.`;
        math = `correction = prediction − true label = ${fw.out.toFixed(3)} − ${d.c} = ${dz2.toFixed(3)}`;
      } else if (S <= idxGradHidden(Hn - 1)) {
        const i = S - idxGradOut - 1;
        plain = `Trace that correction back to neuron ${i + 1}, to see how much it was responsible for the mistake.`;
        math = `flows back through its output connection (${N.W2[i].toFixed(2)}) → ${dz1[i].toFixed(3)}`;
      } else {
        const grad = dz2 * fw.h[0], nw = N.W2[0] - LR * grad;
        plain = `Finally, nudge one connection's strength a little so the network does better next time. Every connection gets a nudge like this.`;
        math = `new strength = old strength − learning rate × correction = ${N.W2[0].toFixed(2)} − ${LR} × ${grad.toFixed(3)} = ${nw.toFixed(2)}`;
      }
      document.getElementById('netStepReadout').innerHTML = `${plain}<br><span class="muted">${math}</span><br><span class="muted">Step ${S + 1} of ${netTotalSteps()} · example ${netExampleIdx + 1}</span>`;
    }
    function stopNetStep() { if (netStepTimer) { clearInterval(netStepTimer); netStepTimer = null; document.getElementById('netStepPlay').textContent = 'Play ▶'; } }
    function resetNetStepState() { stopNetStep(); netStepping = false; const el = document.getElementById('netStepReadout'); if (el) el.innerHTML = ''; }
    function exitNetStep() { resetNetStepState(); draw(); }
    function pickNetExample() {
      stop(); stopNetStep();
      netExampleIdx = Math.floor(Math.random() * data.length);
      netStep = 0; netStepping = true;
      drawNetStep();
    }
    document.getElementById('netStepPick').addEventListener('click', pickNetExample);
    document.getElementById('netStepNext').addEventListener('click', () => { stopNetStep(); if (!netStepping) { pickNetExample(); return; } netStep = Math.min(netStep + 1, netTotalSteps() - 1); drawNetStep(); });
    document.getElementById('netStepBack').addEventListener('click', () => { stopNetStep(); if (netStepping) { netStep = Math.max(netStep - 1, 0); drawNetStep(); } });
    document.getElementById('netStepExit').addEventListener('click', exitNetStep);
    document.getElementById('netStepPlay').addEventListener('click', function () {
      if (netStepTimer) { stopNetStep(); return; }
      if (!netStepping) pickNetExample();
      this.textContent = 'Pause ⏸';
      netStepTimer = setInterval(() => { if (netStep >= netTotalSteps() - 1) { stopNetStep(); return; } netStep++; drawNetStep(); }, 1000);
    });

    document.getElementById('netTrain').addEventListener('click', function () { resetNetStepState(); if (timer) { stop(); return; } this.textContent = 'Pause ⏸'; timer = setInterval(() => { for (let i = 0; i < 4; i++) trainEpoch(); draw(); if (epoch > 1500) stop(); }, 40); });
    document.getElementById('netReset').addEventListener('click', () => { resetNetStepState(); stop(); init(); draw(); });
    document.getElementById('netPattern').addEventListener('change', function () { resetNetStepState(); stop(); pattern = this.value; gen(); init(); draw(); });
    document.getElementById('netH').addEventListener('input', function () { resetNetStepState(); stop(); Hn = +this.value; document.getElementById('netHv').textContent = Hn; init(); draw(); });
    gen(); init(); draw();
  })();
})();
