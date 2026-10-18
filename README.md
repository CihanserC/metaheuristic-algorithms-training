# Metaheuristic Algorithms Training

Interactive, bilingual (TR / EN) web training on metaheuristic algorithms. Every algorithm has an intuition,
a step-by-step explanation, a **live animation** with adjustable parameters, and **runnable Python code** with
line-by-line notes. Light and dark themes are supported.

Etkileşimli, iki dilli (TR / EN) metasezgisel algoritma eğitimi: sezgi, adım adım anlatım, parametreleri
değiştirilebilen canlı animasyon ve satır satır açıklamalı çalıştırılabilir Python kodu. Açık / koyu tema desteklenir.

## Algorithms / Algoritmalar

Live site: https://cihanserc.github.io/metaheuristic-algorithms-training/

| Group | Algorithms | Source |
|---|---|---|
| Simulated Annealing | Function maximum, TSP, Sudoku | original repository code (bugs fixed) |
| Genetic Algorithm | Sequence + Elitism, Knapsack, N-Queens | original repository code (bugs fixed) |
| Swarm | Particle Swarm Optimization | original repository code (bugs fixed) |
| Genetic family | Memetic Algorithm | added |
| Local search | Hill Climbing, Iterated Local Search, Variable Neighborhood Search, Great Deluge, Threshold Accepting, Tabu Search, GRASP | added |
| Evolutionary / distribution-based | Differential Evolution, CMA-ES, PBIL, Cross-Entropy Method | added |
| Nature-inspired | Ant Colony, Artificial Bee Colony, Grey Wolf, Firefly, Cuckoo Search, Bat, Whale, Harris Hawks, Harmony Search, TLBO | added |

## Run

No build step. Open `docs/index.html` in a browser, or serve the folder:

```
cd docs
python -m http.server 8000      # then open http://localhost:8000
```

## Structure

```
docs/
  index.html          page shell
  css/style.css       light / dark themes
  js/sims.js          pure algorithm simulations (no DOM, tested with Node)
  js/core.js          i18n, theme, router, player, charts, code viewer
  js/pages-*.js       one file per algorithm family (texts in TR + EN)
  js/code-data.js     generated bundle of docs/code/*.py
  code/*.py           the Python sources shown on the site
tools/
  build_code_data.py  regenerates js/code-data.js after editing docs/code
  test-sims.js        headless sanity tests:  node tools/test-sims.js
```

After editing a file in `docs/code/`, run `python tools/build_code_data.py`.

## Fixes to the repository code

The original files had a few bugs. They are fixed in `docs/code/` (the comments marked `# fixed:` explain each change)
and every page lists them under "Code notes":

- `SimulatedAnnealingFunction.py`: the sign of `accept_prob` was reversed for a maximisation problem (every worse state was accepted).
- `GeneticAlgorithm*.py`: the unused `crossover_rate`; the tournament that only drew from the first 20 individuals;
  elitism that left random individuals in the first slots and let the elite be mutated; initial genes that never contained `0`;
  the hard-coded `CHROMOSOME_LENGTH = 4` in the knapsack; double counted attacks in N-Queens; use of the global `algorithm`.
- `SimulatedAnnealingSudoku.py`: the given digits could be swapped away (and `sample()` could fail on a box with < 2 free cells).
- `SimulatedAnnealingTSP.py`: a swap of a city with itself; `plot_solution` modified `best_state.tour`.
- `ParticleSwarmOptimizationFunction.py`: velocities initialised across the whole interval; arbitrary initial swarm best.

The site's SA-function demo still has a switch to reproduce the old (buggy) behaviour.
