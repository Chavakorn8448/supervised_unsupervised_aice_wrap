// ===== SESSION 5: Decision Trees, Random Forest, Grid Search =====
(function () {
  const cv = document.getElementById('treeCanvas');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const COL = ['#ff5d6c', '#3aa0ff'];
  const COLF = ['rgba(255,93,108,.28)', 'rgba(58,160,255,.28)'];
  let data = [];     // {x,y,c} in 0..1
  let depth = 3, nTrees = 1, forest = [];

  function makeData() {
    data = [];
    const kind = Math.floor(Math.random() * 3);
    for (let i = 0; i < 140; i++) {
      const x = Math.random(), y = Math.random();
      let c;
      if (kind === 0) c = (y > x + (Math.random() - .5) * .25) ? 0 : 1;          // diagonal
      else if (kind === 1) c = (Math.hypot(x - .5, y - .5) < .3) ? 0 : 1;          // circle
      else c = ((x < .5) ^ (y < .5)) ? 0 : 1;                                       // XOR-ish
      data.push({ x, y, c });
    }
  }

  // ---- simple CART tree ----
  function gini(rows) {
    if (!rows.length) return 0;
    const p = rows.filter(r => r.c === 0).length / rows.length;
    return 1 - p * p - (1 - p) * (1 - p);
  }
  function buildTree(rows, d, featureBag) {
    const node = {};
    const ones = rows.filter(r => r.c === 1).length;
    node.pred = ones >= rows.length - ones ? 1 : 0;
    if (d <= 0 || rows.length < 4 || gini(rows) < 1e-6) return node;
    let best = null;
    const feats = featureBag ? [Math.random() < .5 ? 'x' : 'y'] : ['x', 'y'];
    feats.forEach(f => {
      // try several thresholds
      for (let t = 0.08; t < 0.95; t += 0.06) {
        const L = rows.filter(r => r[f] < t), R = rows.filter(r => r[f] >= t);
        if (!L.length || !R.length) continue;
        const g = (L.length * gini(L) + R.length * gini(R)) / rows.length;
        if (!best || g < best.g) best = { g, f, t, L, R };
      }
    });
    if (!best) return node;
    node.f = best.f; node.t = best.t;
    node.L = buildTree(best.L, d - 1, featureBag);
    node.R = buildTree(best.R, d - 1, featureBag);
    return node;
  }
  function predict(node, x, y) {
    while (node.f !== undefined) node = ((node.f === 'x' ? x : y) < node.t) ? node.L : node.R;
    return node.pred;
  }
  function bootstrap(rows) {
    const out = []; for (let i = 0; i < rows.length; i++) out.push(rows[(Math.random() * rows.length) | 0]); return out;
  }

  function trainForest() {
    forest = [];
    if (nTrees === 1) {
      forest.push(buildTree(data, depth, false));
    } else {
      for (let t = 0; t < nTrees; t++) forest.push(buildTree(bootstrap(data), depth, true));
    }
  }
  function forestPredict(x, y) {
    let v = 0; forest.forEach(t => v += predict(t, x, y));
    return v / forest.length; // probability of class 1
  }

  function draw() {
    trainForest();
    const step = 7;
    for (let X = 0; X < W; X += step)
      for (let Y = 0; Y < H; Y += step) {
        const p = forestPredict(X / W, Y / H);
        // blend red->blue by probability
        ctx.fillStyle = `rgba(${Math.round(255 - p * 197)},${Math.round(93 + p * 67)},${Math.round(108 + p * 147)},0.32)`;
        ctx.fillRect(X, Y, step, step);
      }
    data.forEach(d => {
      ctx.fillStyle = COL[d.c];
      ctx.beginPath(); ctx.arc(d.x * W, d.y * H, 5, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.stroke();
    });
    // training accuracy
    let correct = 0; data.forEach(d => { if ((forestPredict(d.x, d.y) >= .5 ? 1 : 0) === d.c) correct++; });
    const acc = (100 * correct / data.length).toFixed(0);
    document.getElementById('treeReadout').innerHTML =
      `${nTrees === 1 ? '🌳 One tree' : `🌲 Forest of ${nTrees} trees`}, depth ${depth} · ` +
      `fits training data at <b>${acc}%</b>. ` +
      (nTrees === 1 && depth >= 7 ? 'Notice the jagged, over-fitted boxes!' :
        nTrees > 1 ? 'Smoother boundary — the crowd averages out mistakes.' : '');
  }

  document.getElementById('depthSlider').addEventListener('input', function () {
    depth = +this.value; document.getElementById('depthVal').textContent = depth; draw();
  });
  document.getElementById('treesSlider').addEventListener('input', function () {
    nTrees = +this.value; document.getElementById('treesVal').textContent = nTrees; draw();
  });
  document.getElementById('treeShuffle').addEventListener('click', () => { makeData(); draw(); });

  makeData(); draw();

  // ---------- Grid Search heatmap ----------
  (function gridSearch() {
    const host = document.getElementById('gridSearch');
    const depths = [1, 3, 5, 7];
    const trees = [1, 5, 20, 50];
    // a fake-but-believable score surface: peaks at mid depth + many trees
    function score(d, t) {
      const base = 0.62 + 0.30 * Math.exp(-((d - 5) ** 2) / 8) * (0.5 + 0.5 * (Math.log(t) / Math.log(50)));
      return Math.min(0.98, base + (Math.random() - .5) * 0.02);
    }
    const scores = depths.map(d => trees.map(t => score(d, t)));
    let best = { v: -1 };
    scores.forEach((row, i) => row.forEach((v, j) => { if (v > best.v) best = { v, i, j }; }));

    let html = '<table class="gs-table"><tr><th></th>' +
      trees.map(t => `<th>${t} tree${t > 1 ? 's' : ''}</th>`).join('') + '</tr>';
    depths.forEach((d, i) => {
      html += `<tr><th>depth ${d}</th>`;
      trees.forEach((t, j) => {
        const v = scores[i][j];
        const g = Math.round(60 + v * 160); // greener = better
        const isBest = i === best.i && j === best.j;
        html += `<td><div class="gs-cell ${isBest ? 'best' : ''}" data-v="${v.toFixed(3)}" data-d="${d}" data-t="${t}" ` +
          `style="background:rgb(${Math.round(255 - v * 160)},${g},90)">${isBest ? '🏆' : (v * 100).toFixed(0)}</div></td>`;
      });
      html += '</tr>';
    });
    html += '</table><div class="gs-info" id="gsInfo">Each cell is one model we trained and scored (accuracy %). ' +
      `Grid search picked <b>depth ${depths[best.i]}, ${trees[best.j]} trees</b> → ${(best.v * 100).toFixed(1)}% 🏆</div>`;
    host.innerHTML = html;
    host.querySelectorAll('.gs-cell').forEach(c => c.addEventListener('mouseenter', () => {
      document.getElementById('gsInfo').innerHTML =
        `Model with <b>depth ${c.dataset.d}</b> and <b>${c.dataset.t} tree(s)</b> scored <b>${(c.dataset.v * 100).toFixed(1)}%</b>. ` +
        'Grid search just tries them all and keeps the highest.';
    }));
  })();
})();
