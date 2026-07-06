# agent.md

Guidance for AI coding agents working in this repository. Keep this file synchronized with `CLAUDE.md`.

## What This Is

An interactive teaching tool for the CMKL AICE Wrap course: six browser-based modules introducing AI and machine learning to high school students.

This is intentionally a static site:

- Plain HTML, CSS, and JavaScript.
- No framework.
- No package manager.
- No dependencies.
- No build step.
- Must work by opening `index.html` directly from `file://`.

The project can also be deployed to any static host such as Vercel.

## Current Architecture

- `index.html` is the single page app. It contains the Home page plus six topic sections.
- `css/styles.css` is the only stylesheet. It defines the dark theme, layout, controls, tabs, cards, and responsive behavior.
- `js/core.js` defines shared helpers on `window.ML`, controls topic navigation, algorithm tabs, lesson tabs, and renders the animated hero canvas.
- `js/topic1.js` through `js/topic6.js` each contain one self-contained topic module.

Navigation works by toggling classes:

- Top-level panels use `<section class="topic">`; only one has `.active`.
- Lesson panels use `<div class="lesson">`; only one within a topic has `.active`.
- Sidebar buttons use `.nav-btn` and `data-target`.
- In-page navigation uses `data-go`.
- Long algorithm modules use `.algo-tabs` for algorithm selection and `.lesson-tabset` for each algorithm's three lesson tabs.
- Topic switches dispatch `topic-shown`.
- Lesson switches dispatch `lesson-shown`.

## File Map

- `index.html`: markup for Home, six topics, algorithm tabs, lesson tabs, controls, canvases, and script tags.
- `css/styles.css`: theme variables, layout, cards, tabs, controls, responsive behavior, and canvas styling.
- `js/core.js`: `ML.pos`, `ML.dot`, `ML.classFill`, shared class colors, topic navigation, algorithm-tab navigation, lesson-tab navigation, hero animation.
- `js/topic1.js`: Intro to AI, rules vs. learning flow, nested AI/ML/DL rings, sorting game, ML workflow.
- `js/topic2.js`: classification algorithms: KNN, logistic regression, decision tree, random forest, and Naive Bayes.
- `js/topic3.js`: regression algorithms: linear regression, KNN regressor, decision tree regressor, and random forest regressor.
- `js/topic4.js`: K-Means playground, elbow method, customer segmentation.
- `js/topic5.js`: trees, forests, and grid search as a more advanced deep dive.
- `js/topic6.js`: neuron demo, activation functions, small neural network training.

## Conventions

- Keep everything in vanilla JavaScript. Do not add npm packages, libraries, bundlers, frameworks, TypeScript, JSX, or ES module imports.
- Scripts are loaded with plain `<script src="..."></script>` tags. Preserve direct browser compatibility.
- `js/core.js` must load before topic scripts because topic scripts use `window.ML`.
- Keep topic scripts self-contained. Use the existing IIFE style:

```js
(function () {
  // topic code
})();
```

- Avoid shared mutable globals. If shared behavior is truly needed, add a small helper to `window.ML` in `js/core.js`.
- Reuse `ML.pos(canvas, event)` for pointer coordinates so canvases stay correct when CSS-resized.
- Preserve class color meaning across demos: red is class A / class 0, blue is class B / class 1.
- Reuse CSS variables from `:root` instead of hard-coding new colors when practical.
- Keep student-facing text short, plain, and concrete. Put hands-on prompts in `.tryit` callouts.
- The ML implementations are intentionally from scratch for teaching clarity. Do not replace KNN, logistic regression, Naive Bayes, linear regression, KNN regression, K-Means, trees, forests, or neural-network logic with library calls.
- Playground demos should be interactive and visibly responsive. Where the algorithm supports iterative training, animate the training. Where it does not, animate the build or prediction process instead of faking epochs.

## Editing Guidelines

- For a new lesson, add the markup in the relevant topic section of `index.html`, then add the behavior in that topic's `js/topicN.js`.
- For a new algorithm inside Module 2 or Module 3, add an `.algo-tab`, a matching `.lesson-tabset`, and three lessons using the pattern `Big picture`, `Playground`, and a tuning/learning tab.
- For a new topic-level demo, use a new self-contained block inside the topic IIFE.
- Match existing control patterns: `.seg` buttons, range inputs with visible value readouts, `.readout` status boxes, and canvases inside `.demo-grid`.
- If adding a new JavaScript file, add its script tag in `index.html` after `js/core.js`.
- Keep DOM IDs unique across the full page.
- Stop timers/intervals when a demo reset button already implies a reset. Avoid runaway intervals.
- For canvas drawing, read `canvas.width` and `canvas.height`; do not rely on CSS size.
- Make mobile/responsive changes in `css/styles.css` and verify the sidebar, algorithm tabs, lesson tabs, and canvases still fit.

## Verification

There is no automated test suite. At minimum:

```bash
for f in js/*.js; do node --check "$f" || exit 1; done
```

For files you touch, syntax-check those files before finishing.

Manual checks:

- Open `index.html` in a browser.
- Click the sidebar topic buttons and Home cards.
- In Modules 2 and 3, click each algorithm tab, then each lesson tab.
- Exercise changed sliders, buttons, selects, and canvas interactions.
- Confirm animated playgrounds move in a way that matches the algorithm.
- Confirm readout text updates with the visual state.
- Confirm no console errors.

Useful structural checks:

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
const lessons = new Set([...html.matchAll(/class="lesson[^"]*" id="([^"]+)"/g)].map(m => m[1]));
const refs = [...html.matchAll(/data-lesson="([^"]+)"/g)].map(m => m[1]);
const missing = refs.filter(id => !lessons.has(id));
console.log('duplicate ids:', [...new Set(dup)].join(', ') || 'none');
console.log('missing lesson refs:', [...new Set(missing)].join(', ') || 'none');
NODE
```

## Deployment

Static deployment only.

For Vercel:

- Framework preset: Other.
- Build command: leave empty.
- Output directory: `./`.

Do not introduce a build output directory unless the project is explicitly changed away from static hosting.
