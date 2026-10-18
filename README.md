# Metaheuristic Algorithms Training

Interactive, bilingual (TR / EN) web training on metaheuristic algorithms. Every algorithm has an intuition,
a step-by-step explanation, a **live animation** with adjustable parameters, and **runnable Python code** with
line-by-line notes. Light and dark themes are supported.

Etkileşimli, iki dilli (TR / EN) metasezgisel algoritma eğitimi: sezgi, adım adım anlatım, parametreleri
değiştirilebilen canlı animasyon ve satır satır açıklamalı çalıştırılabilir Python kodu. Açık / koyu tema desteklenir.

## Algorithms / Algoritmalar

| Group | Algorithm | Source |
|---|---|---|
| Simulated Annealing | Function maximum, TSP, Sudoku | original repository code |
| Genetic Algorithm | Sequence + Elitism, Knapsack, N-Queens | original repository code |
| Swarm | Particle Swarm Optimization | original repository code |
| Local search | Hill Climbing, Tabu Search (TSP) | added |
| Evolutionary / nature-inspired | Ant Colony (TSP), Differential Evolution, Artificial Bee Colony, Grey Wolf Optimizer | added |

## Run

No build step. Open `site/index.html` in a browser, or serve the folder:

```
cd site
python -m http.server 8000      # then open http://localhost:8000
```

## Structure

```
site/
  index.html          page shell
  css/style.css       light / dark themes
  js/sims.js          pure algorithm simulations (no DOM, tested with Node)
  js/core.js          i18n, theme, router, player, charts, code viewer
  js/pages-*.js       one file per algorithm family (texts in TR + EN)
  js/code-data.js     generated bundle of site/code/*.py
  code/*.py           the Python sources shown on the site
tools/
  build_code_data.py  regenerates js/code-data.js after editing site/code
  test-sims.js        headless sanity tests:  node tools/test-sims.js
```

After editing a file in `site/code/`, run `python tools/build_code_data.py`.

## Notes on the repository code

The original files contain a few quirks that the site points out in each "Code notes" section
(e.g. the sign of `accept_prob` in the function annealing example, the unused `crossover_rate`, how elitism
and the tournament are implemented, and which Sudoku cells count as fixed). The animations show the
*intended* behaviour; the Python files are left exactly as written.
