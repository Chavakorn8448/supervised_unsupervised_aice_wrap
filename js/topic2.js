// ===== TOPIC 2: KNN =====
(function () {
  const COL = ML.COL;
  const COLF = ['rgba(255,93,108,.18)', 'rgba(58,160,255,.18)'];

  // ---------- L1: distance demo ----------
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
      const nb = sorted.slice(0, kk);
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

  // ---------- L2: KNN playground ----------
  (function playground() {
    const cv = document.getElementById('knnCanvas');
    const ctx = cv.getContext('2d');
    let pts = [], test = null, addClass = 0, placingTest = false, k = 3;
    function seed() {
      pts = [];
      [[140, 130, 0], [380, 290, 1]].forEach(([cx, cy, c]) => {
        for (let i = 0; i < 7; i++) pts.push({ x: cx + (Math.random() - .5) * 120, y: cy + (Math.random() - .5) * 120, c });
      });
      test = { x: 260, y: 210 };
    }
    function nearest() {
      if (!test) return null;
      const d = pts.map(p => ({ p, d: Math.hypot(p.x - test.x, p.y - test.y) })).sort((a, b) => a.d - b.d).slice(0, Math.min(k, pts.length));
      let v = [0, 0]; d.forEach(o => v[o.p.c]++);
      return { neighbors: d, pred: v[0] >= v[1] ? 0 : 1, votes: v };
    }
    function star(x, y, r, fill) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r * .45 : r; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
    }
    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      const res = nearest();
      if (res && res.neighbors.length) {
        const rad = res.neighbors[res.neighbors.length - 1].d;
        ctx.fillStyle = COLF[res.pred]; ctx.beginPath(); ctx.arc(test.x, test.y, rad, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(test.x, test.y, rad, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        res.neighbors.forEach(o => { ctx.strokeStyle = COL[o.p.c]; ctx.lineWidth = 2; ctx.globalAlpha = .6; ctx.beginPath(); ctx.moveTo(test.x, test.y); ctx.lineTo(o.p.x, o.p.y); ctx.stroke(); });
        ctx.globalAlpha = 1;
      }
      pts.forEach(p => ML.dot(ctx, p.x, p.y, 7, COL[p.c], 'rgba(255,255,255,.5)'));
      if (test) star(test.x, test.y, 11, res ? COL[res.pred] : '#fff');
      const el = document.getElementById('knnReadout');
      if (!test || !res || !res.neighbors.length) el.innerHTML = 'Drop some red &amp; blue points, then place a ★ test point.';
      else el.innerHTML = `Among the <b>${res.neighbors.length}</b> nearest: 🔴 ${res.votes[0]} vs 🔵 ${res.votes[1]} → prediction <b>${res.pred === 0 ? '🔴 Class A' : '🔵 Class B'}</b>.`;
    }
    cv.addEventListener('click', e => {
      const p = ML.pos(cv, e);
      if (placingTest) { test = { x: p.x, y: p.y }; placingTest = false; document.getElementById('placeTest').classList.remove('active'); }
      else pts.push({ x: p.x, y: p.y, c: addClass });
      draw();
    });
    document.querySelectorAll('#t2 .seg[data-knnclass]').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('#t2 .seg[data-knnclass]').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); addClass = +b.dataset.knnclass;
    }));
    document.getElementById('placeTest').addEventListener('click', function () { placingTest = !placingTest; this.classList.toggle('active', placingTest); });
    document.getElementById('knnClear').addEventListener('click', () => { pts = []; test = null; draw(); });
    const ks = document.getElementById('kSlider');
    ks.addEventListener('input', () => { k = +ks.value; document.getElementById('kVal').textContent = k; draw(); });
    seed(); draw();
  })();

  // ---------- L3: decision boundary ----------
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
      // a couple of noisy strays
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
})();
