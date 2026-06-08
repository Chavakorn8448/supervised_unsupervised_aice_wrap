# AICE Wrap · Interactive ML Playground

An interactive, browser-based teaching tool for **CMKL AICE Wrap** — a 6-session introduction to AI and Machine Learning for high school students. Every concept is a hands-on demo students can click, drag, and tweak. No install, no internet, no build step.

🔗 **Live:** _add your Vercel link here_

## The 6 sessions

| # | Session | Interactive demo |
|---|---------|------------------|
| 1 | **Intro to AI** | Rules-vs-learning flow · clickable AI → ML → DL nested rings · drag-and-drop game sorting examples into Supervised / Unsupervised / Reinforcement |
| 2 | **Classification (KNN)** | Drop red/blue points, place a ★ mystery point, slide **k** and watch the neighbor vote flip |
| 3 | **Regression** | Click & drag data points and watch the best-fit line chase them · live equation, error (MSE), and prediction |
| 4 | **Clustering (K-Means)** | Step through the *assign → update* loop, or auto-run and watch centroids converge |
| 5 | **Trees & Forests** | Decision boundaries for one tree vs. a forest (depth & tree-count sliders) · grid-search hyperparameter heatmap |
| 6 | **Neural Networks** | A live single neuron with weight sliders · a network that **trains in front of the class** (backprop in JS) on easy / circle / XOR patterns |

Each session has a green **🎯 Try this** prompt suggesting a concrete experiment.

## Run it locally

It's pure static HTML/CSS/JS — just open the file:

```
# Windows
start index.html

# or serve it (any static server works)
npx serve .
```

## Deploy (Vercel)

This is a static site with **no framework and no build step**:

1. Import the repo at [vercel.com](https://vercel.com) (or drag the folder in).
2. Framework preset: **Other** · Build command: _(leave empty)_ · Output directory: `./`
3. Deploy → share the link.

## Project structure

```
.
├── index.html            # all 6 sessions + sidebar nav
├── css/styles.css        # single stylesheet
└── js/
    ├── app.js            # sidebar navigation
    ├── session1.js       # Intro to AI
    ├── session2_knn.js   # KNN classification
    ├── session3_reg.js   # Linear regression
    ├── session4_kmeans.js# K-Means clustering
    ├── session5_trees.js # Decision trees, random forest, grid search
    └── session6_nn.js    # Single neuron + trainable network
```

## Notes for teaching

- **Refresh the page** to reset any demo.
- Works offline and on a projector; layout is responsive for tablets/phones.
- All ML (KNN, least-squares fit, K-Means, CART trees, MLP backprop) is implemented from scratch in vanilla JavaScript — no libraries — so it's transparent and editable.

---

Built for CMKL · AICE Wrap.
