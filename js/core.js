// ===== CORE: navigation + shared helpers =====
window.ML = (function () {
  // canvas pointer position, scaled to the canvas's intrinsic pixels
  function pos(canvas, e) {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {
      x: (t.clientX - r.left) * canvas.width / r.width,
      y: (t.clientY - r.top) * canvas.height / r.height
    };
  }
  function dot(ctx, x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.lineWidth = 1.5; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  // red(0) -> blue(1) blend used across classifier demos
  function classFill(p, a) {
    return `rgba(${Math.round(255 - p * 197)},${Math.round(93 + p * 67)},${Math.round(108 + p * 147)},${a})`;
  }
  return { pos, dot, classFill, COL: ['#ff5d6c', '#3aa0ff'] };
})();

// ---- navigation ----
(function () {
  const topics = document.querySelectorAll('.topic');
  const navBtns = document.querySelectorAll('.nav-btn');
  const pill = document.getElementById('progressPill');
  const labels = { home: 'Home', t1: 'Module 1 · Intro to AI', t2: 'Module 2 · Classification', t3: 'Module 3 · Regression Algorithms', t4: 'Module 4 · K-Means', t5: 'Module 5 · Trees & Forests', t6: 'Module 6 · Neural Networks' };

  function goTopic(id) {
    topics.forEach(t => t.classList.toggle('active', t.id === id));
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.target === id));
    pill.textContent = labels[id] || id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.dispatchEvent(new CustomEvent('topic-shown', { detail: id }));
  }
  navBtns.forEach(b => b.addEventListener('click', () => goTopic(b.dataset.target)));
  // any element with data-go navigates (hero buttons, module cards, brand)
  document.querySelectorAll('[data-go]').forEach(el =>
    el.addEventListener('click', () => goTopic(el.dataset.go)));

  // algorithm-level tabs reveal a smaller lesson tabset inside long modules
  document.querySelectorAll('.algo-tabs').forEach(bar => {
    const topic = bar.closest('.topic');
    bar.querySelectorAll('.algo-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        bar.querySelectorAll('.algo-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        topic.querySelectorAll('.lesson-tabset').forEach(set =>
          set.classList.toggle('active', set.dataset.algo === tab.dataset.algo));
        const lessonSet = topic.querySelector(`.lesson-tabset[data-algo="${tab.dataset.algo}"]`);
        const firstLesson = lessonSet && lessonSet.querySelector('.subtab');
        if (firstLesson) firstLesson.click();
      });
    });
  });

  // sub-tabs within a topic
  document.querySelectorAll('.subtabs').forEach(bar => {
    const topic = bar.closest('.topic');
    bar.querySelectorAll('.subtab').forEach(tab => {
      tab.addEventListener('click', () => {
        bar.querySelectorAll('.subtab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        topic.querySelectorAll('.lesson').forEach(l =>
          l.classList.toggle('active', l.id === tab.dataset.lesson));
        document.dispatchEvent(new CustomEvent('lesson-shown', { detail: tab.dataset.lesson }));
      });
    });
  });
})();

// ---- hero background: gently drifting neural network ----
(function heroNet() {
  const cv = document.getElementById('heroNet');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const layers = [3, 5, 5, 2];
  const nodes = [];
  layers.forEach((n, li) => {
    const x = 90 + li * (W - 180) / (layers.length - 1);
    for (let i = 0; i < n; i++) nodes.push({ x, y: H * (i + 1) / (n + 1), li, ph: Math.random() * 6.28 });
  });
  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    // edges
    nodes.forEach(a => nodes.forEach(b => {
      if (b.li === a.li + 1) {
        const pulse = 0.5 + 0.5 * Math.sin(t / 700 + a.ph + b.ph);
        ctx.strokeStyle = `rgba(108,140,255,${0.05 + pulse * 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }));
    nodes.forEach(a => {
      const g = 0.5 + 0.5 * Math.sin(t / 600 + a.ph);
      ML.dot(ctx, a.x, a.y, 6, `rgba(70,224,200,${0.4 + g * 0.6})`);
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
