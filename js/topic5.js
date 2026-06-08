// ===== TOPIC 5: Trees, Forests, Grid Search =====
(function () {
  const COL = ML.COL;

  // ---- shared CART builder on 2D data ----
  function gini(rows) { if (!rows.length) return 0; const p = rows.filter(r => r.c === 0).length / rows.length; return 1 - p * p - (1 - p) * (1 - p); }
  function buildTree(rows, d, featureBag) {
    const node = {}; const ones = rows.filter(r => r.c === 1).length;
    node.pred = ones >= rows.length - ones ? 1 : 0; node.n = rows.length;
    node.p1 = rows.length ? ones / rows.length : 0;
    if (d <= 0 || rows.length < 4 || gini(rows) < 1e-6) return node;
    let best = null;
    const feats = featureBag ? [Math.random() < .5 ? 'x' : 'y'] : ['x', 'y'];
    feats.forEach(f => { for (let t = 0.08; t < 0.95; t += 0.06) { const L = rows.filter(r => r[f] < t), R = rows.filter(r => r[f] >= t); if (!L.length || !R.length) continue; const g = (L.length * gini(L) + R.length * gini(R)) / rows.length; if (!best || g < best.g) best = { g, f, t, L, R }; } });
    if (!best) return node;
    node.f = best.f; node.t = best.t; node.L = buildTree(best.L, d - 1, featureBag); node.R = buildTree(best.R, d - 1, featureBag);
    return node;
  }
  function predict(node, x, y) { while (node.f !== undefined) node = ((node.f === 'x' ? x : y) < node.t) ? node.L : node.R; return node.pred; }

  // ---------- L1: decision tree diagram ----------
  (function diagram() {
    const cv = document.getElementById('treeDiagram'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    const NAME = { x: 'colour', y: 'size' };
    let data = [];
    function gen() {
      data = [];
      for (let i = 0; i < 120; i++) { const x = Math.random(), y = Math.random(); const c = (x > .55 && y < .5) ? 1 : (x < .35 ? 0 : (y > .65 ? 0 : (Math.random() < .5 ? 1 : 0))); data.push({ x, y, c }); }
    }
    function layoutLeaves(node, depth, box) {
      // assign x by in-order leaf slot; returns count of leaves
      if (node.f === undefined) { node._x = box.next++; node._d = depth; return; }
      layoutLeaves(node.L, depth + 1, box); layoutLeaves(node.R, depth + 1, box);
      node._x = (node.L._x + node.R._x) / 2; node._d = depth;
    }
    function countLeaves(node) { return node.f === undefined ? 1 : countLeaves(node.L) + countLeaves(node.R); }
    function maxDepth(node) { return node.f === undefined ? 0 : 1 + Math.max(maxDepth(node.L), maxDepth(node.R)); }
    function drawBoxes(node, leaves, md) {
      if (node.f !== undefined) { drawBoxes(node.L, leaves, md); drawBoxes(node.R, leaves, md); }
      const x = node._px, y = node._py;
      if (node.f === undefined) {
        const col = COL[node.pred]; ctx.fillStyle = col; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#06210f'; ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center';
        ctx.fillText(node.pred ? '🍋' : '🍎', x, y + 4);
      } else {
        const w = 96, h = 30; ctx.fillStyle = '#20264f'; ctx.strokeStyle = '#46e0c8'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#eef1ff'; ctx.font = '11px Segoe UI'; ctx.textAlign = 'center';
        ctx.fillText(`${NAME[node.f]} < ${node.t.toFixed(2)}?`, x, y + 4);
      }
    }
    function draw() {
      const depth = +document.getElementById('tdDepth').value;
      const tree = buildTree(data, depth, false);
      const leaves = countLeaves(tree), md = maxDepth(tree);
      const box = { next: 0 }; layoutLeaves(tree, 0, box);
      ctx.clearRect(0, 0, W, H);
      // compute pixel positions for every node first
      (function setpx(n) { const x = 40 + n._x / Math.max(1, leaves - 1) * (W - 120) + 20, y = 34 + n._d / Math.max(1, md) * (H - 90); n._px = x; n._py = y; if (n.f !== undefined) { setpx(n.L); setpx(n.R); } })(tree);
      // edges
      (function edges(n) { if (n.f === undefined) return; [n.L, n.R].forEach((ch, i) => { ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(n._px, n._py); ctx.lineTo(ch._px, ch._py); ctx.stroke(); ctx.fillStyle = '#9aa3d4'; ctx.font = '10px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(i ? 'no' : 'yes', (n._px + ch._px) / 2, (n._py + ch._py) / 2 - 2); edges(ch); }); })(tree);
      drawBoxes(tree, leaves, md);
      ctx.textAlign = 'left';
      let correct = 0; data.forEach(d => { if (predict(tree, d.x, d.y) === d.c) correct++; });
      document.getElementById('tdReadout').innerHTML = `Depth ${depth}: the tree asks up to <b>${depth}</b> question(s), ending in <b>${leaves}</b> answers (🍎 apple / 🍋 lemon). It gets <b>${(100 * correct / data.length).toFixed(0)}%</b> of the fruit right.`;
    }
    document.getElementById('tdDepth').addEventListener('input', function () { document.getElementById('tdDepthv').textContent = this.value; draw(); });
    gen(); draw();
  })();

  // ---------- L2: one tree vs a forest (decision boundary) ----------
  (function forest() {
    const cv = document.getElementById('treeCanvas'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    let data = [], depth = 3, nTrees = 1;
    function makeData() { data = []; const kind = Math.random() * 3 | 0; for (let i = 0; i < 140; i++) { const x = Math.random(), y = Math.random(); let c; if (kind === 0) c = (y > x + (Math.random() - .5) * .25) ? 0 : 1; else if (kind === 1) c = (Math.hypot(x - .5, y - .5) < .3) ? 0 : 1; else c = ((x < .5) ^ (y < .5)) ? 0 : 1; data.push({ x, y, c }); } }
    function bootstrap(rows) { const o = []; for (let i = 0; i < rows.length; i++) o.push(rows[(Math.random() * rows.length) | 0]); return o; }
    function trainForest() { const f = []; if (nTrees === 1) f.push(buildTree(data, depth, false)); else for (let t = 0; t < nTrees; t++) f.push(buildTree(bootstrap(data), depth, true)); return f; }
    function draw() {
      const forest = trainForest();
      const fp = (x, y) => { let v = 0; forest.forEach(t => v += predict(t, x, y)); return v / forest.length; };
      const step = 7;
      for (let X = 0; X < W; X += step) for (let Y = 0; Y < H; Y += step) ctx.fillStyle = ML.classFill(fp(X / W, Y / H), .32), ctx.fillRect(X, Y, step, step);
      data.forEach(d => ML.dot(ctx, d.x * W, d.y * H, 5, COL[d.c], 'rgba(255,255,255,.55)'));
      let correct = 0; data.forEach(d => { if ((fp(d.x, d.y) >= .5 ? 1 : 0) === d.c) correct++; });
      document.getElementById('treeReadout').innerHTML = `${nTrees === 1 ? '🌳 One tree' : `🌲 Forest of ${nTrees} trees`}, depth ${depth} · fits the data at <b>${(100 * correct / data.length).toFixed(0)}%</b>. ` + (nTrees === 1 && depth >= 7 ? 'Notice the jagged, over-fitted boxes!' : nTrees > 1 ? 'Smoother boundary — the crowd averages out mistakes.' : '');
    }
    document.getElementById('depthSlider').addEventListener('input', function () { depth = +this.value; document.getElementById('depthVal').textContent = depth; draw(); });
    document.getElementById('treesSlider').addEventListener('input', function () { nTrees = +this.value; document.getElementById('treesVal').textContent = nTrees; draw(); });
    document.getElementById('treeShuffle').addEventListener('click', () => { makeData(); draw(); });
    makeData(); draw();
  })();

  // ---------- L3: grid search ----------
  (function gridSearch() {
    const host = document.getElementById('gridSearch');
    const depths = [1, 3, 5, 7], trees = [1, 5, 20, 50];
    const score = (d, t) => Math.min(0.98, 0.62 + 0.30 * Math.exp(-((d - 5) ** 2) / 8) * (0.5 + 0.5 * (Math.log(t) / Math.log(50))) + (Math.random() - .5) * 0.02);
    const scores = depths.map(d => trees.map(t => score(d, t)));
    let best = { v: -1 }; scores.forEach((row, i) => row.forEach((v, j) => { if (v > best.v) best = { v, i, j }; }));
    let html = '<table class="gs-table"><tr><th></th>' + trees.map(t => `<th>${t} tree${t > 1 ? 's' : ''}</th>`).join('') + '</tr>';
    depths.forEach((d, i) => { html += `<tr><th>depth ${d}</th>`; trees.forEach((t, j) => { const v = scores[i][j], g = Math.round(60 + v * 160), isBest = i === best.i && j === best.j; html += `<td><div class="gs-cell ${isBest ? 'best' : ''}" data-v="${v.toFixed(3)}" data-d="${d}" data-t="${t}" style="background:rgb(${Math.round(255 - v * 160)},${g},90)">${isBest ? '🏆' : (v * 100).toFixed(0)}</div></td>`; }); html += '</tr>'; });
    html += '</table><div class="gs-info" id="gsInfo">Each cell is one model we trained and scored (accuracy %). Grid search picked <b>depth ' + depths[best.i] + ', ' + trees[best.j] + ' trees</b> → ' + (best.v * 100).toFixed(1) + '% 🏆</div>';
    host.innerHTML = html;
    host.querySelectorAll('.gs-cell').forEach(c => c.addEventListener('mouseenter', () => { document.getElementById('gsInfo').innerHTML = `Model with <b>depth ${c.dataset.d}</b> and <b>${c.dataset.t} tree(s)</b> scored <b>${(c.dataset.v * 100).toFixed(1)}%</b>. Grid search just tries them all and keeps the highest.`; }));
  })();
})();
