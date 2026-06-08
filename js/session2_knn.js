// ===== SESSION 2: KNN classification =====
(function () {
  const cv = document.getElementById('knnCanvas');
  const ctx = cv.getContext('2d');
  const COL = ['#ff5d6c', '#3aa0ff'];
  const COLF = ['rgba(255,93,108,.18)', 'rgba(58,160,255,.18)'];
  let pts = [];           // {x,y,c}
  let test = null;        // {x,y}
  let addClass = 0;
  let placingTest = false;
  let k = 3;

  // seed a few points
  function seed() {
    pts = [];
    const blobs = [[140, 130, 0], [380, 290, 1]];
    blobs.forEach(([cx, cy, c]) => {
      for (let i = 0; i < 7; i++)
        pts.push({ x: cx + (Math.random() - .5) * 120, y: cy + (Math.random() - .5) * 120, c });
    });
    test = { x: 260, y: 210 };
  }

  function pos(e) {
    const r = cv.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * cv.width / r.width, y: (t.clientY - r.top) * cv.height / r.height };
  }

  function nearest() {
    if (!test) return null;
    const d = pts.map(p => ({ p, d: Math.hypot(p.x - test.x, p.y - test.y) }))
      .sort((a, b) => a.d - b.d).slice(0, Math.min(k, pts.length));
    let votes = [0, 0];
    d.forEach(o => votes[o.p.c]++);
    return { neighbors: d, pred: votes[0] >= votes[1] ? 0 : 1, votes };
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    const res = nearest();
    // draw circle to the kth neighbor
    if (res && res.neighbors.length) {
      const rad = res.neighbors[res.neighbors.length - 1].d;
      ctx.fillStyle = COLF[res.pred];
      ctx.beginPath(); ctx.arc(test.x, test.y, rad, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.arc(test.x, test.y, rad, 0, 7); ctx.stroke();
      ctx.setLineDash([]);
      // lines to neighbors
      res.neighbors.forEach(o => {
        ctx.strokeStyle = COL[o.p.c]; ctx.lineWidth = 2; ctx.globalAlpha = .6;
        ctx.beginPath(); ctx.moveTo(test.x, test.y); ctx.lineTo(o.p.x, o.p.y); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
    // training points
    pts.forEach(p => {
      ctx.fillStyle = COL[p.c];
      ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.stroke();
    });
    // test point (star)
    if (test) {
      const res2 = res;
      star(test.x, test.y, 11, res2 ? COL[res2.pred] : '#fff');
    }
    updateReadout(res);
  }

  function star(x, y, r, fill) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = Math.PI / 5 * i - Math.PI / 2;
      const rr = i % 2 ? r * .45 : r;
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
  }

  function updateReadout(res) {
    const el = document.getElementById('knnReadout');
    if (!test) { el.innerHTML = 'Place a ★ test point to classify it.'; return; }
    if (!res || !res.neighbors.length) { el.innerHTML = 'Add some training points first.'; return; }
    const name = res.pred === 0 ? '🔴 Class A' : '🔵 Class B';
    el.innerHTML = `Looking at the <b>${res.neighbors.length}</b> nearest neighbors: ` +
      `🔴 ${res.votes[0]} vs 🔵 ${res.votes[1]} → prediction is <b>${name}</b>.`;
  }

  // events
  cv.addEventListener('click', e => {
    const p = pos(e);
    if (placingTest) { test = { x: p.x, y: p.y }; placingTest = false;
      document.getElementById('placeTest').classList.remove('active'); }
    else pts.push({ x: p.x, y: p.y, c: addClass });
    draw();
  });

  document.querySelectorAll('#s2 .seg[data-knnclass]').forEach(b =>
    b.addEventListener('click', () => {
      document.querySelectorAll('#s2 .seg[data-knnclass]').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); addClass = +b.dataset.knnclass;
    }));
  document.getElementById('placeTest').addEventListener('click', function () {
    placingTest = !placingTest; this.classList.toggle('active', placingTest);
  });
  document.getElementById('knnClear').addEventListener('click', () => { pts = []; test = null; draw(); });
  const ks = document.getElementById('kSlider');
  ks.addEventListener('input', () => { k = +ks.value; document.getElementById('kVal').textContent = k; draw(); });

  seed(); draw();
})();
