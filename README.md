# AICE Wrap · Interactive ML Playground

An interactive, browser-based course for **CMKL University · AICE Wrap** — six modules introducing AI and Machine Learning for high school students. Every concept is a hands-on demo students can click, drag, and watch learn in real time. No install, no internet, no build step.

🔗 **Live:** _add your Vercel link here_

## The course

A landing **Home** page plus **6 modules**, each with multiple lessons (sub-tabs) that build intuition → hands-on → real-world. **16+ interactive demos** in total.

| # | Module | Lessons (each its own interactive demo) |
|---|--------|------------------------------------------|
| 1 | **Intro to AI** | What is AI? (rules-vs-learning + nested AI⊃ML⊃DL rings) · How machines learn (3 families + sorting game) · The ML workflow (5-step pipeline walkthrough) |
| 2 | **Classification Algorithms** | KNN · Logistic Regression · Decision Tree · Random Forest · Naive Bayes, each with big idea, playground, and tuning/boundary demos |
| 3 | **Regression Algorithms** | Linear Regression · KNN Regressor · Decision Tree Regressor · Random Forest Regressor, each with hands-on prediction and tuning demos |
| 4 | **Clustering · K-Means** | Step-through playground · How many clusters? (elbow method) · Real-world customer segments |
| 5 | **Ensembles & Tuning** | Tree overfitting · Forest voting · Grid-search heatmap for choosing settings |
| 6 | **Neural Networks** | One neuron (weight sliders) · Activation functions explorer · A network that trains itself (+ loss curve) |

Most lessons include a green **🎯 Try this** challenge. Pedagogy throughout: plain-language hook → play with it → why it matters.

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
├── index.html            # Home + 6 modules, sidebar + sub-tab nav
├── css/styles.css        # single stylesheet
└── js/
    ├── core.js           # navigation, shared canvas helpers, hero animation
    ├── topic1.js         # Intro to AI (flow, rings, sorting game, ML pipeline)
    ├── topic2.js         # Classification algorithms (KNN, Logistic Regression, Trees, Forests, Naive Bayes)
    ├── topic3.js         # Regression algorithms (linear, KNN, tree, forest regressors)
    ├── topic4.js         # K-Means (playground, elbow method, segments)
    ├── topic5.js         # Ensembles and tuning (tree overfitting, forest voting, grid search)
    └── topic6.js         # Neural nets (neuron, activations, training + loss)
```

## Notes for teaching

- **Refresh the page** to reset any demo.
- Works offline and on a projector; layout is responsive for tablets/phones.
- All ML (KNN, logistic regression, Naive Bayes, least-squares fit, KNN regression, K-Means, CART trees, forests, MLP backprop) is implemented from scratch in vanilla JavaScript — no libraries — so it's transparent and editable.

---

Built for CMKL · AICE Wrap.
