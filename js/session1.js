// ===== SESSION 1: Intro to AI =====
(function () {
  // --- rules vs ML flow ---
  const flowBox = document.getElementById('flowBox');
  const flowExplain = document.getElementById('flowExplain');
  const segs = document.querySelectorAll('#s1 .seg[data-mode]');

  function node(title, sub, cls) {
    return `<div class="node ${cls || ''}">${title}<small>${sub}</small></div>`;
  }
  const arrow = '<div class="arrow">➜</div>';

  function renderFlow(mode) {
    if (mode === 'rules') {
      flowBox.innerHTML =
        node('Data', 'e.g. an email') + arrow +
        node('Rules', 'written by a human', 'hl') + arrow +
        node('Answer', 'spam or not');
      flowExplain.innerHTML = '<b>Traditional programming:</b> a human writes every rule by hand ("if it contains \'free money\' → spam"). It breaks the moment reality does something the rules didn\'t expect.';
    } else {
      flowBox.innerHTML =
        node('Data', 'thousands of emails') + arrow +
        node('Answers', 'labelled spam / not') + arrow +
        node('Learning', 'finds rules itself', 'hl') + arrow +
        node('Model', 'predicts new emails');
      flowExplain.innerHTML = '<b>Machine learning:</b> we show the computer many examples <i>with answers</i>, and it figures out the rules on its own. That learned program is called a <b>model</b>.';
    }
  }
  segs.forEach(s => s.addEventListener('click', () => {
    segs.forEach(x => x.classList.remove('active'));
    s.classList.add('active');
    renderFlow(s.dataset.mode);
  }));
  renderFlow('rules');

  // --- nested rings ---
  const info = {
    ai: '<b>Artificial Intelligence</b> is the whole field: any technique that makes a machine act "smart". A chess program with hand-written rules counts as AI even if it never learns.',
    ml: '<b>Machine Learning</b> is a subset of AI where the machine <i>learns patterns from data</i> instead of being told every rule. Sessions 2–5 are all machine learning.',
    dl: '<b>Deep Learning</b> uses many-layered <i>neural networks</i>. It powers image recognition, ChatGPT, and self-driving cars. That\'s Session 6.'
  };
  const ringInfo = document.getElementById('ringInfo');
  document.querySelectorAll('#s1 .ring').forEach(r => {
    const set = e => { e.stopPropagation(); ringInfo.innerHTML = info[r.dataset.info]; };
    r.addEventListener('mouseenter', set);
    r.addEventListener('click', set);
  });

  // --- sort game ---
  const data = [
    { t: '🐱 Label photos as cat or dog', b: 'Supervised' },
    { t: '🏠 Predict a house price', b: 'Supervised' },
    { t: '🛒 Group shoppers by habits', b: 'Unsupervised' },
    { t: '📧 Spam vs. not-spam', b: 'Supervised' },
    { t: '🎵 Discover music genres in a playlist', b: 'Unsupervised' },
    { t: '🎮 A bot learning to win a game by trial & error', b: 'Reinforcement' },
    { t: '🤖 Robot learning to walk via rewards', b: 'Reinforcement' },
    { t: '👥 Find natural customer segments', b: 'Unsupervised' }
  ];
  const buckets = ['Supervised', 'Unsupervised', 'Reinforcement'];
  const hint = {
    Supervised: 'Learns from labelled examples (the answer is given).',
    Unsupervised: 'No labels — finds hidden groups/structure.',
    Reinforcement: 'Learns by trial, error, and rewards.'
  };
  const game = document.getElementById('sortGame');
  let selected = null, placed = 0;

  function build() {
    game.innerHTML =
      '<div class="examples" id="exRow"></div>' +
      '<div class="buckets">' + buckets.map(b =>
        `<div class="bucket" data-b="${b}"><h4>${b}</h4><small class="muted">${hint[b]}</small><div class="got"></div></div>`
      ).join('') + '</div>' +
      '<div class="readout" id="sortMsg">Click an example, then click the bucket you think it belongs to. (8 to go.)</div>';

    const exRow = document.getElementById('exRow');
    data.forEach((d, i) => {
      const c = document.createElement('div');
      c.className = 'chip'; c.textContent = d.t; c.dataset.i = i;
      c.draggable = true;
      c.addEventListener('click', () => selectChip(c));
      c.addEventListener('dragstart', e => { selectChip(c); e.dataTransfer.setData('t', i); });
      exRow.appendChild(c);
    });
    document.querySelectorAll('#s1 .bucket').forEach(bk => {
      bk.addEventListener('click', () => drop(bk));
      bk.addEventListener('dragover', e => { e.preventDefault(); bk.classList.add('over'); });
      bk.addEventListener('dragleave', () => bk.classList.remove('over'));
      bk.addEventListener('drop', e => { e.preventDefault(); bk.classList.remove('over'); drop(bk); });
    });
  }
  function selectChip(c) {
    if (c.classList.contains('done')) return;
    document.querySelectorAll('#s1 .chip').forEach(x => x.classList.remove('sel'));
    c.classList.add('sel'); selected = c;
  }
  function drop(bk) {
    const msg = document.getElementById('sortMsg');
    if (!selected) { msg.textContent = 'First click an example to pick it up.'; return; }
    const d = data[selected.dataset.i];
    if (d.b === bk.dataset.b) {
      bk.querySelector('.got').innerHTML += `<span>${d.t}</span>`;
      selected.classList.add('done'); selected.classList.remove('sel');
      selected = null; placed++;
      msg.innerHTML = placed === data.length
        ? '🎉 <b>Perfect!</b> You\'ve got the three families of machine learning down.'
        : `Nice! ${data.length - placed} to go.`;
    } else {
      msg.innerHTML = `Not quite — <b>${d.t.replace(/^[^ ]+ /, '')}</b> isn\'t ${bk.dataset.b.toLowerCase()}. Hint: ${hint[d.b]}`;
    }
  }
  build();
})();
