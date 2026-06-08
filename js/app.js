// ---- Navigation between sessions ----
(function () {
  const btns = document.querySelectorAll('.nav-btn');
  const sessions = document.querySelectorAll('.session');
  const pill = document.getElementById('progressPill');
  const names = ['Intro to AI', 'Classification', 'Regression', 'Clustering', 'Trees & Forests', 'Neural Nets'];

  function show(idx, target) {
    sessions.forEach(s => s.classList.toggle('active', s.id === target));
    btns.forEach(b => b.classList.toggle('active', b.dataset.target === target));
    pill.textContent = `Session ${idx + 1} of 6 · ${names[idx]}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // let a demo know it became visible (canvas sizing / kick-off)
    document.dispatchEvent(new CustomEvent('session-shown', { detail: target }));
  }

  btns.forEach((b, i) => b.addEventListener('click', () => show(i, b.dataset.target)));
})();
