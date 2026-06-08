// ===== SESSION 6: Neural Networks =====
(function () {
  // ---------- Single neuron ----------
  (function neuronDemo() {
    const cv = document.getElementById('neuronCanvas');
    const ctx = cv.getContext('2d');
    const ids = ['nx1', 'nw1', 'nx2', 'nw2', 'nb'];
    const sig = z => 1 / (1 + Math.exp(-z));

    function read() {
      const v = {}; ids.forEach(i => v[i] = +document.getElementById(i).value);
      ['nx1', 'nw1', 'nx2', 'nw2', 'nb'].forEach((i, k) =>
        document.getElementById(i + 'v').textContent = (+document.getElementById(i).value).toFixed(2));
      return v;
    }
    function draw() {
      const v = read();
      const z = v.nx1 * v.nw1 + v.nx2 * v.nw2 + v.nb;
      const out = sig(z);
      ctx.clearRect(0, 0, cv.width, cv.height);
      // input nodes
      const ix = 70, ox = 360, mid = 150;
      drawNode(ix, 90, '#6c8cff', 'x₁=' + v.nx1.toFixed(2));
      drawNode(ix, 210, '#6c8cff', 'x₂=' + v.nx2.toFixed(2));
      // edges with thickness ~ |weight|
      edge(ix, 90, ox, mid, v.nw1, 'w₁=' + v.nw1.toFixed(2), 70);
      edge(ix, 210, ox, mid, v.nw2, 'w₂=' + v.nw2.toFixed(2), 235);
      // neuron body, brightness ~ output
      const g = Math.round(60 + out * 195);
      ctx.fillStyle = `rgb(${Math.round(255 - out * 130)},${g},120)`;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(ox, mid, 38, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#06210f'; ctx.font = 'bold 15px Segoe UI'; ctx.textAlign = 'center';
      ctx.fillText('Σ + f', ox, mid + 5);
      // output arrow
      ctx.strokeStyle = '#46e0c8'; ctx.lineWidth = 3 + out * 6;
      ctx.beginPath(); ctx.moveTo(ox + 38, mid); ctx.lineTo(ox + 120, mid); ctx.stroke();
      ctx.fillStyle = '#46e0c8'; ctx.font = 'bold 16px Segoe UI';
      ctx.fillText('output ' + out.toFixed(2), ox + 75, mid - 14);
      ctx.textAlign = 'left';
      document.getElementById('neuronReadout').innerHTML =
        `weighted sum z = x₁·w₁ + x₂·w₂ + b = <b>${z.toFixed(2)}</b><br>` +
        `activation f(z) = sigmoid(z) = <b>${out.toFixed(3)}</b> → the neuron fires ` +
        (out > .5 ? '<b>strongly 🔥</b>' : '<b>weakly 💤</b>');
    }
    function drawNode(x, y, c, label) {
      ctx.fillStyle = c; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 26, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '12px Segoe UI'; ctx.textAlign = 'center';
      ctx.fillText(label, x, y + 4); ctx.textAlign = 'left';
    }
    function edge(x1, y1, x2, y2, w, label, ly) {
      ctx.strokeStyle = w >= 0 ? 'rgba(70,224,138,.85)' : 'rgba(255,93,108,.85)';
      ctx.lineWidth = 1 + Math.abs(w) * 3;
      ctx.beginPath(); ctx.moveTo(x1 + 26, y1); ctx.lineTo(x2 - 38, y2); ctx.stroke();
      ctx.fillStyle = '#9aa3d4'; ctx.font = '12px Segoe UI';
      ctx.fillText(label, 150, ly);
    }
    ids.forEach(i => document.getElementById(i).addEventListener('input', draw));
    draw();
  })();

  // ---------- Trainable network ----------
  (function netDemo() {
    const cv = document.getElementById('netCanvas');
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const COL = ['#ff5d6c', '#3aa0ff'];
    let data = [], net = null, timer = null, epoch = 0, Hn = 8, pattern = 'linear';

    function gen() {
      data = [];
      for (let i = 0; i < 160; i++) {
        const x = Math.random(), y = Math.random(); let c;
        if (pattern === 'linear') c = (x + y > 1) ? 1 : 0;
        else if (pattern === 'circle') c = (Math.hypot(x - .5, y - .5) < .32) ? 1 : 0;
        else c = ((x > .5) ^ (y > .5)) ? 1 : 0;
        data.push({ x, y, c });
      }
    }
    // network: 2 -> Hn (tanh) -> 1 (sigmoid)
    function initNet() {
      net = { W1: [], b1: [], W2: [], b2: (Math.random() - .5) };
      for (let h = 0; h < Hn; h++) {
        net.W1.push([(Math.random() - .5) * 2, (Math.random() - .5) * 2]);
        net.b1.push((Math.random() - .5) * 2);
        net.W2.push((Math.random() - .5) * 2);
      }
      epoch = 0;
    }
    const sig = z => 1 / (1 + Math.exp(-z));
    function forward(x, y) {
      const h = new Array(Hn), z1 = new Array(Hn);
      for (let i = 0; i < Hn; i++) { z1[i] = net.W1[i][0] * x + net.W1[i][1] * y + net.b1[i]; h[i] = Math.tanh(z1[i]); }
      let z2 = net.b2; for (let i = 0; i < Hn; i++) z2 += net.W2[i] * h[i];
      return { out: sig(z2), h };
    }
    function trainEpoch() {
      const lr = 0.5;
      for (const d of data) {
        const { out, h } = forward(d.x, d.y);
        const dz2 = out - d.c;                 // dL/dz2 (cross-entropy + sigmoid)
        for (let i = 0; i < Hn; i++) {
          const dh = dz2 * net.W2[i];
          const dz1 = dh * (1 - h[i] * h[i]);   // tanh'
          net.W2[i] -= lr * dz2 * h[i];
          net.W1[i][0] -= lr * dz1 * d.x;
          net.W1[i][1] -= lr * dz1 * d.y;
          net.b1[i] -= lr * dz1;
        }
        net.b2 -= lr * dz2;
      }
      epoch++;
    }
    function draw() {
      const step = 8;
      for (let X = 0; X < W; X += step)
        for (let Y = 0; Y < H; Y += step) {
          const p = forward(X / W, Y / H).out;
          ctx.fillStyle = `rgba(${Math.round(255 - p * 197)},${Math.round(93 + p * 67)},${Math.round(108 + p * 147)},0.30)`;
          ctx.fillRect(X, Y, step, step);
        }
      data.forEach(d => {
        ctx.fillStyle = COL[d.c];
        ctx.beginPath(); ctx.arc(d.x * W, d.y * H, 5, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.stroke();
      });
      let correct = 0; data.forEach(d => { if ((forward(d.x, d.y).out >= .5 ? 1 : 0) === d.c) correct++; });
      document.getElementById('netReadout').innerHTML =
        `Epoch <b>${epoch}</b> · accuracy <b>${(100 * correct / data.length).toFixed(0)}%</b>`;
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; document.getElementById('netTrain').textContent = 'Train ▶'; } }

    document.getElementById('netTrain').addEventListener('click', function () {
      if (timer) { stop(); return; }
      this.textContent = 'Pause ⏸';
      timer = setInterval(() => { for (let i = 0; i < 4; i++) trainEpoch(); draw(); if (epoch > 1500) stop(); }, 40);
    });
    document.getElementById('netReset').addEventListener('click', () => { stop(); initNet(); draw(); });
    document.getElementById('netPattern').addEventListener('change', function () { stop(); pattern = this.value; gen(); initNet(); draw(); });
    document.getElementById('netH').addEventListener('input', function () {
      stop(); Hn = +this.value; document.getElementById('netHv').textContent = Hn; initNet(); draw();
    });

    gen(); initNet(); draw();
  })();
})();
