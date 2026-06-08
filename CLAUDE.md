# CLAUDE.md

Guidance for Claude Code (claude.com/claude-code) when working in this repository.

## What this is

An interactive teaching tool for the **CMKL AICE Wrap** course — 6 sessions introducing AI/ML to high school students. It is a **static site**: plain HTML/CSS/JS, no framework, no build step, no package manager, no dependencies. The whole point is that a TA can open `index.html` directly or deploy it to any static host (Vercel).

## Architecture

- `index.html` — single page. A sidebar (`.nav-btn`) switches between six `<section class="session">` panels; only one is `.active` at a time. Navigation lives in `js/app.js`, which toggles the active class and emits a `session-shown` event.
- `css/styles.css` — one stylesheet. Dark theme driven by CSS variables in `:root` (`--bg`, `--acc`, class colors `--red`/`--blue`, etc.). Reuse these variables instead of hard-coding colors.
- `js/sessionN_*.js` — one self-contained IIFE per session. Each wires up its own DOM and renders into its own `<canvas>`. They do **not** share state or globals; they only read/write their own element IDs.

## Conventions (match these when editing)

- **No libraries.** Every algorithm (KNN vote, least-squares regression, K-Means, CART decision tree + bagging, MLP forward/backprop) is written from scratch in vanilla JS. Keep it that way — it's meant to be readable by students. Don't introduce npm packages, a bundler, or a framework.
- **No build step.** Scripts are loaded with plain `<script src>` tags (not ES modules), so the page works from `file://` with no server. Don't convert to `import`/`export`.
- Each session demo is an IIFE: `(function () { ... })();`. Add new demos the same way and load them with a `<script>` tag in `index.html` (before `app.js`).
- Class colors are consistent across sessions: **red = class A**, **blue = class B**. Preserve this.
- Canvas pixel coordinates come from a `pos(e)` helper that scales client coords by `canvas.width / rect.width` — reuse that pattern so demos stay correct when the canvas is CSS-resized.
- Student-facing copy is intentionally plain-language. Keep explanations short; put concrete experiments in the green `.tryit` callouts.

## Verifying changes

There are no tests. To check work:

```bash
node --check js/<file>.js        # syntax-check any JS you touch
start index.html                 # open in a browser and click through the session
```

When changing a demo, manually exercise its controls (sliders, buttons, canvas clicks) and confirm the readout text and canvas update.

## Deploy

Static site. On Vercel: framework preset **Other**, no build command, output directory `./`.
