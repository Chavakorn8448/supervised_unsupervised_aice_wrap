// ===== TOPIC 1: Intro to AI =====
(function () {
  // --- rules vs ML flow ---
  const flowBox = document.getElementById('flowBox');
  const flowExplain = document.getElementById('flowExplain');
  const node = (t, s, c) => `<div class="node ${c || ''}">${t}<small>${s}</small></div>`;
  const arrow = '<div class="arrow">➜</div>';
  function renderFlow(mode) {
    if (mode === 'rules') {
      flowBox.innerHTML = node('Data', 'an email') + arrow + node('Rules', 'written by a human', 'hl') + arrow + node('Answer', 'spam or not');
      flowExplain.innerHTML = '<b>Traditional programming:</b> a human writes every rule by hand ("if it says \'free money\' → spam"). It breaks the moment reality does something the rules didn\'t expect.';
    } else {
      flowBox.innerHTML = node('Data', 'many emails') + arrow + node('Answers', 'marked spam / not') + arrow + node('Learning', 'finds rules itself', 'hl') + arrow + node('Model', 'predicts new email');
      flowExplain.innerHTML = '<b>Machine learning:</b> we show the computer many examples <i>with answers</i>, and it figures out the rules itself. That learned program is the <b>model</b>.';
    }
  }
  document.querySelectorAll('#t1 .seg[data-mode]').forEach(s => s.addEventListener('click', () => {
    document.querySelectorAll('#t1 .seg[data-mode]').forEach(x => x.classList.remove('active'));
    s.classList.add('active'); renderFlow(s.dataset.mode);
  }));
  renderFlow('rules');

  // --- nested rings ---
  const info = {
    ai: '<b>Artificial Intelligence</b> — the whole field: any technique that makes a machine act "smart". A chess engine with hand-written rules counts as AI even though it never learns.',
    ml: '<b>Machine Learning</b> — a subset of AI where the machine <i>learns patterns from data</i> instead of being told every rule. Modules 2–5 are all machine learning.',
    dl: '<b>Deep Learning</b> — machine learning using many-layered <i>neural networks</i>. It powers image recognition, ChatGPT and self-driving cars. That\'s Module 6.'
  };
  const ringInfo = document.getElementById('ringInfo');
  document.querySelectorAll('#t1 .ring').forEach(r => {
    const set = e => { e.stopPropagation(); ringInfo.innerHTML = info[r.dataset.info]; };
    r.addEventListener('mouseenter', set); r.addEventListener('click', set);
  });

  // --- sort game ---
  const data = [
    { t: '🐱 Label photos as cat or dog', b: 'Supervised' },
    { t: '🏠 Predict a house price', b: 'Supervised' },
    { t: '🛒 Group shoppers by habits', b: 'Unsupervised' },
    { t: '📧 Spam vs. not-spam', b: 'Supervised' },
    { t: '🎵 Discover genres in a playlist', b: 'Unsupervised' },
    { t: '🎮 A bot winning a game by trial & error', b: 'Reinforcement' },
    { t: '🤖 Robot learning to walk via rewards', b: 'Reinforcement' },
    { t: '👥 Find natural customer segments', b: 'Unsupervised' }
  ];
  const buckets = ['Supervised', 'Unsupervised', 'Reinforcement'];
  const hint = { Supervised: 'Labelled examples — the answer is given.', Unsupervised: 'No labels — finds hidden groups.', Reinforcement: 'Learns by trial, error & rewards.' };
  const game = document.getElementById('sortGame');
  let selected = null, placed = 0;
  function build() {
    game.innerHTML = '<div class="examples" id="exRow"></div><div class="buckets">' +
      buckets.map(b => `<div class="bucket" data-b="${b}"><h4>${b}</h4><small class="muted">${hint[b]}</small><div class="got"></div></div>`).join('') +
      '</div><div class="readout" id="sortMsg">Click an example, then click the family it belongs to. (8 to go.)</div>' +
      '<button class="seg" id="sortReset" style="margin-top:12px">↺ Play again</button>';
    const exRow = document.getElementById('exRow');
    data.forEach((d, i) => {
      const c = document.createElement('div'); c.className = 'chip'; c.textContent = d.t; c.dataset.i = i;
      c.addEventListener('click', () => selectChip(c)); exRow.appendChild(c);
    });
    document.querySelectorAll('#t1 .bucket').forEach(bk => bk.addEventListener('click', () => drop(bk)));
    document.getElementById('sortReset').addEventListener('click', () => { placed = 0; selected = null; build(); });
  }
  function selectChip(c) {
    if (c.classList.contains('done')) return;
    document.querySelectorAll('#t1 .chip').forEach(x => x.classList.remove('sel'));
    c.classList.add('sel'); selected = c;
  }
  function drop(bk) {
    const msg = document.getElementById('sortMsg');
    if (!selected) { msg.textContent = 'First click an example to pick it up.'; return; }
    const d = data[selected.dataset.i];
    if (d.b === bk.dataset.b) {
      bk.querySelector('.got').innerHTML += `<span>${d.t}</span>`;
      selected.classList.add('done'); selected.classList.remove('sel'); selected = null; placed++;
      msg.innerHTML = placed === data.length ? '🎉 <b>Perfect!</b> You\'ve got the three families down.' : `Nice! ${data.length - placed} to go.`;
    } else {
      msg.innerHTML = `Not quite. Hint: ${hint[d.b]}`;
    }
  }
  build();

  // --- ML workflow pipeline ---
  const stages = [
    { i: '📦', t: 'Collect data', h: 'Gather examples',
      body: 'We collect <b>5,000 photos</b>, each tagged 🐱 cat or 🐶 dog by a human. Good data is everything — a model can only be as good as what it learns from.' },
    { i: '✂️', t: 'Split data', h: 'Train vs. test',
      body: 'We split the photos: <b>80% to train</b> on, and <b>20% hidden away</b> to test later. This is crucial — testing on photos the model already memorised would be cheating.' },
    { i: '🧠', t: 'Train', h: 'Learn the pattern',
      body: 'The model studies the 80%, adjusting itself until it reliably tells cats from dogs. This "studying" is the actual <b>learning</b> — exactly what Modules 2–6 show in action.' },
    { i: '📊', t: 'Evaluate', h: 'Grade it honestly',
      body: 'Now we reveal the hidden 20%. The model has never seen them. It scores <b>92% correct</b> — that\'s our honest estimate of how it\'ll do in the real world.<br><span class="muted" style="font-size:13px">↪ Pros often hold back a third "<b>validation</b>" slice too — used for <i>choosing</i> the best settings without peeking at the test set. You\'ll meet it in Module 5.</span>' },
    { i: '🚀', t: 'Predict', h: 'Use it',
      body: 'Happy with 92%? Deploy it. Now show it a <b>brand-new</b> photo and it instantly predicts 🐱 or 🐶. The model is doing useful work.' }
  ];
  const host = document.getElementById('pipeline');
  let step = 0;
  function renderPipe() {
    host.innerHTML =
      '<div class="pipe-stages">' + stages.map((s, i) =>
        `<div class="pipe-stage ${i === step ? 'on' : ''}"><div class="pi">${s.i}</div><div class="pt">${s.t}</div></div>`).join('') + '</div>' +
      `<div class="pipe-body"><h4>Step ${step + 1}: ${stages[step].h}</h4>${stages[step].body}</div>` +
      '<div class="pipe-ctrl"><button class="seg" id="pipePrev">← Back</button><button class="seg" id="pipeNext">Next →</button>' +
      '<div class="pipe-dots">' + stages.map((s, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('') + '</div></div>';
    document.getElementById('pipeNext').onclick = () => { step = (step + 1) % stages.length; renderPipe(); };
    document.getElementById('pipePrev').onclick = () => { step = (step + stages.length - 1) % stages.length; renderPipe(); };
  }
  renderPipe();
})();
