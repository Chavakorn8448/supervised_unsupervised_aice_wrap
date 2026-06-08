// ===== SESSION 4: K-Means clustering =====
(function () {
  const cv = document.getElementById('kmCanvas');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const PAL = ['#ff5d6c', '#3aa0ff', '#46e08a', '#ffd35c', '#b07bff', '#46e0c8'];
  let pts = [];       // {x,y,c}
  let cents = [];     // {x,y}
  let k = 3;
  let phase = 'assign'; // next action
  let auto = null;

  function scatter() {
    pts = [];
    const groups = 3 + Math.floor(Math.random() * 2);
    for (let g = 0; g < groups; g++) {
      const cx = 80 + Math.random() * (W - 160), cy = 70 + Math.random() * (H - 140);
      const n = 12 + Math.floor(Math.random() * 10);
      for (let i = 0; i < n; i++)
        pts.push({ x: cx + (Math.random() - .5) * 90, y: cy + (Math.random() - .5) * 90, c: -1 });
    }
  }
  function newCenters() {
    cents = [];
    for (let i = 0; i < k; i++)
      cents.push({ x: 60 + Math.random() * (W - 120), y: 50 + Math.random() * (H - 100) });
    pts.forEach(p => p.c = -1);
    phase = 'assign';
    msg('New centers placed. Press <b>Step</b> to assign each point to its nearest center.');
  }
  function assign() {
    let moved = 0;
    pts.forEach(p => {
      let best = 0, bd = 1e9;
      cents.forEach((c, i) => { const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2; if (d < bd) { bd = d; best = i; } });
      if (p.c !== best) moved++; p.c = best;
    });
    phase = 'update';
    msg(`<b>Assign:</b> every point is now colored by its nearest center. Press <b>Step</b> to move centers to the middle of their group.`);
    return moved;
  }
  function update() {
    let totalShift = 0;
    cents.forEach((c, i) => {
      const grp = pts.filter(p => p.c === i);
      if (grp.length) {
        const nx = grp.reduce((s, p) => s + p.x, 0) / grp.length;
        const ny = grp.reduce((s, p) => s + p.y, 0) / grp.length;
        totalShift += Math.hypot(nx - c.x, ny - c.y);
        c.x = nx; c.y = ny;
      }
    });
    phase = 'assign';
    if (totalShift < 0.5)
      msg('✅ <b>Converged!</b> The centers stopped moving — K-Means has found stable clusters.');
    else
      msg('<b>Update:</b> centers jumped to the average of their points. Press <b>Step</b> to re-assign.');
    return totalShift;
  }
  function step() {
    if (phase === 'assign') assign(); else update();
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      ctx.fillStyle = p.c < 0 ? '#7e87bf' : PAL[p.c];
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 7); ctx.fill();
    });
    cents.forEach((c, i) => {
      ctx.fillStyle = PAL[i];
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      // diamond
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - 12); ctx.lineTo(c.x + 12, c.y); ctx.lineTo(c.x, c.y + 12); ctx.lineTo(c.x - 12, c.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    });
  }
  function msg(h) { document.getElementById('kmReadout').innerHTML = h; }

  document.getElementById('kmStep').addEventListener('click', step);
  document.getElementById('kmReset').addEventListener('click', newCenters);
  document.getElementById('kmScatter').addEventListener('click', () => { scatter(); newCenters(); draw(); });
  const ksl = document.getElementById('kmK');
  ksl.addEventListener('input', () => { k = +ksl.value; document.getElementById('kmKval').textContent = k; newCenters(); draw(); });
  document.getElementById('kmAuto').addEventListener('click', function () {
    if (auto) { clearInterval(auto); auto = null; this.textContent = 'Auto-run ⏩'; return; }
    this.textContent = 'Stop ⏸';
    auto = setInterval(step, 700);
  });

  scatter(); newCenters(); draw();
})();
