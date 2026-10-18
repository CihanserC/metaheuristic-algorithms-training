/* Pure simulation cores (no DOM). Each factory returns a state object with a step() method.
   step() returns false when the run has finished. Works in the browser and in Node (for tests). */
(function (root) {
  'use strict';
  const S = {};

  S.mulberry32 = function (a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const shuffle = (arr, rnd) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  S.shuffle = shuffle;
  const range = n => Array.from({ length: n }, (_, i) => i);

  /* ---------- TSP helpers ---------- */
  S.makeCities = (n, rnd, size = 1000) => Array.from({ length: n }, () => ({ x: size * rnd(), y: size * rnd() }));
  S.tourLen = (c, t) => {
    let d = 0;
    for (let i = 0; i < t.length; i++) {
      const a = c[t[i]], b = c[t[(i + 1) % t.length]];
      d += Math.hypot(a.x - b.x, a.y - b.y);
    }
    return d;
  };

  /* ---------- Simulated Annealing: 1-D function (SimulatedAnnealingFunction.py) ---------- */
  S.saF = x => (x - 0.3) * (x - 0.3) * (x - 0.3) - 5 * x + x * x - 2;
  // p: {min,max,tmin,tmax,cool,original}  original=true reproduces the sign of accept_prob in the repo code
  S.saFunc = function (p, rnd) {
    const f = S.saF;
    const st = { f, p, x: 0, best: 0, cand: 0, temp: p.tmax, iter: 0, accepted: false, prob: 1, hist: [], bestHist: [], done: false };
    st.step = function () {
      if (st.done) return false;
      const nx = p.min + (p.max - p.min) * rnd();
      const ea = f(st.x), en = f(nx);
      if (p.original) st.prob = en > ea ? 1 : Math.exp((ea - en) / st.temp); // exp(positive) >= 1 -> always accepted
      else st.prob = en > ea ? 1 : Math.exp((en - ea) / st.temp);
      st.cand = nx;
      st.accepted = rnd() < st.prob;
      if (st.accepted) st.x = nx;
      if (f(st.x) > f(st.best)) st.best = st.x;
      st.temp *= 1 - p.cool;
      st.iter++;
      st.hist.push(f(st.x)); st.bestHist.push(f(st.best));
      if (st.temp <= p.tmin) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- Simulated Annealing: TSP (SimulatedAnnealingTSP.py) ---------- */
  // p: {cities,tmin,tmax,cool}
  S.saTSP = function (p, rnd) {
    const cities = p.cities, n = cities.length;
    const st = { cities, p, temp: p.tmax, iter: 0, hist: [], bestHist: [], done: false, cand: null, accepted: false, prob: 1 };
    st.tour = shuffle(range(n), rnd);
    st.len = S.tourLen(cities, st.tour);
    st.init = st.len; st.best = st.tour.slice(); st.bestLen = st.len;
    st.step = function () {
      if (st.done) return false;
      const i = Math.floor(rnd() * n);
      let j = Math.floor(rnd() * (n - 1)); if (j >= i) j++;            // two DIFFERENT cities
      const t = st.tour.slice();
      [t[i], t[j]] = [t[j], t[i]];
      const nl = S.tourLen(cities, t);
      st.prob = nl < st.len ? 1 : Math.exp((st.len - nl) / st.temp);
      st.accepted = rnd() < st.prob;
      st.cand = t; st.candLen = nl; st.swap = [i, j];
      if (st.accepted) { st.tour = t; st.len = nl; }
      if (st.len < st.bestLen) { st.best = st.tour.slice(); st.bestLen = st.len; }
      st.temp *= 1 - p.cool;
      st.iter++;
      st.hist.push(st.len); st.bestHist.push(st.bestLen);
      if (st.temp <= p.tmin) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- Simulated Annealing: Sudoku (SimulatedAnnealingSudoku.py) ---------- */
  S.SUDOKU = [
    [3, 0, 6, 5, 0, 8, 4, 0, 0], [5, 2, 0, 0, 0, 0, 0, 0, 0], [0, 8, 7, 0, 0, 0, 0, 3, 1],
    [0, 0, 3, 0, 1, 0, 0, 8, 0], [9, 0, 0, 8, 6, 3, 0, 0, 5], [0, 5, 0, 0, 9, 0, 6, 0, 0],
    [1, 3, 0, 0, 0, 0, 2, 5, 0], [0, 0, 0, 0, 0, 0, 0, 7, 4], [0, 0, 5, 2, 0, 6, 3, 0, 0]
  ];
  S.sudokuPenalty = g => {
    let pen = 0;
    for (let r = 0; r < 9; r++) pen += 9 - new Set(g[r]).size;
    for (let c = 0; c < 9; c++) { const col = new Set(); for (let r = 0; r < 9; r++) col.add(g[r][c]); pen += 9 - col.size; }
    return pen;
  };
  // p: {tmin,tmax,cool}
  S.saSudoku = function (p, rnd) {
    const fixed = S.SUDOKU.map(r => r.map(v => v !== 0));
    const g = S.SUDOKU.map(r => r.slice());
    for (let bi = 0; bi < 3; bi++) for (let bj = 0; bj < 3; bj++) {
      const used = new Set();
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (g[bi * 3 + i][bj * 3 + j]) used.add(g[bi * 3 + i][bj * 3 + j]);
      const nums = shuffle(range(9).map(x => x + 1).filter(x => !used.has(x)), rnd);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (!g[bi * 3 + i][bj * 3 + j]) g[bi * 3 + i][bj * 3 + j] = nums.pop();
    }
    const st = { fixed, p, grid: g, temp: p.tmax, iter: 0, hist: [], bestHist: [], done: false, accepted: false, prob: 1 };
    st.fit = S.sudokuPenalty(g); st.best = g.map(r => r.slice()); st.bestFit = st.fit; st.swap = null;
    st.step = function () {
      if (st.done) return false;
      const bi = Math.floor(rnd() * 3), bj = Math.floor(rnd() * 3);
      const free = [];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (!fixed[bi * 3 + i][bj * 3 + j]) free.push([bi * 3 + i, bj * 3 + j]);
      if (free.length >= 2) {
        const a = Math.floor(rnd() * free.length);
        let b = Math.floor(rnd() * (free.length - 1)); if (b >= a) b++;
        const [r1, c1] = free[a], [r2, c2] = free[b];
        const ng = st.grid.map(r => r.slice());
        [ng[r1][c1], ng[r2][c2]] = [ng[r2][c2], ng[r1][c1]];
        const nf = S.sudokuPenalty(ng);
        st.prob = nf < st.fit ? 1 : Math.exp((st.fit - nf) / st.temp);
        st.accepted = rnd() < st.prob;
        st.swap = [[r1, c1], [r2, c2]];
        if (st.accepted) { st.grid = ng; st.fit = nf; }
      }
      if (st.fit < st.bestFit) { st.best = st.grid.map(r => r.slice()); st.bestFit = st.fit; }
      st.temp *= p.cool; st.iter++;
      st.hist.push(st.fit); st.bestHist.push(st.bestFit);
      if (st.bestFit === 0 || st.temp <= p.tmin) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- Genetic Algorithm (GeneticAlgorithm*.py) ---------- */
  // cfg: {pop,glen,init(rnd),mutGene(rnd),fitness(g),mut,elite,tour,target,maxGen}
  S.GA = function (cfg, rnd) {
    const st = { cfg, gen: 0, histBest: [], histAvg: [], done: false, demo: null };
    const mk = () => Array.from({ length: cfg.glen }, () => cfg.init(rnd));
    st.pop = Array.from({ length: cfg.pop }, () => ({ g: mk() }));
    const evalAll = () => { for (const ind of st.pop) ind.f = cfg.fitness(ind.g); };
    const tournament = () => {
      let b = null;
      for (let i = 0; i < cfg.tour; i++) {
        const c = st.pop[Math.floor(rnd() * st.pop.length)];
        if (!b || c.f > b.f) b = c;
      }
      return b;
    };
    const record = () => {
      let b = st.pop[0];
      for (const x of st.pop) if (x.f > b.f) b = x;
      st.best = b;
      const fin = st.pop.filter(x => isFinite(x.f));
      st.histBest.push(b.f);
      st.histAvg.push(fin.length ? fin.reduce((s, x) => s + x.f, 0) / fin.length : NaN);
    };
    evalAll(); record();
    st.step = function () {
      if (st.done) return false;
      const sorted = st.pop.slice().sort((a, b) => b.f - a.f);
      const next = sorted.slice(0, cfg.elite).map(e => ({ g: e.g.slice(), f: e.f, elite: true }));
      let demo = null;
      while (next.length < cfg.pop) {
        const a = tournament(), b = tournament();
        let s = Math.floor(rnd() * cfg.glen), e = Math.floor(rnd() * cfg.glen);
        if (s > e) [s, e] = [e, s];
        const crossed = cfg.cross == null || rnd() < cfg.cross;                 // crossover_rate
        if (!crossed) e = s;                                                     // empty middle part: the child is a copy of A
        const g = a.g.slice(0, s).concat(b.g.slice(s, e), a.g.slice(e));
        if (!demo) demo = { a: a.g.slice(), b: b.g.slice(), s, e, child: g.slice(), mut: [], crossed };
        next.push({ g });
      }
      next.forEach((ind, idx) => {
        if (ind.elite) return;
        for (let i = 0; i < cfg.glen; i++) if (rnd() <= cfg.mut) {
          ind.g[i] = cfg.mutGene(rnd);
          if (idx === cfg.elite && demo) demo.mut.push(i);
        }
      });
      if (demo && next[cfg.elite]) demo.after = next[cfg.elite].g.slice();
      st.pop = next; evalAll(); st.gen++; st.demo = demo; record();
      if (cfg.target != null && st.best.f >= cfg.target) st.done = true;
      if (cfg.maxGen && st.gen >= cfg.maxGen) st.done = true;
      return !st.done;
    };
    return st;
  };

  S.gaSequence = (o, rnd) => S.GA({
    pop: o.pop, glen: 10, mut: o.mut, cross: o.cross, elite: o.elite, tour: o.tour, target: 10, maxGen: 2000,
    init: r => Math.floor(r() * 10),             // numpy randint(0, 10)
    mutGene: r => Math.floor(r() * 10),          // numpy randint(10)
    fitness: g => g.reduce((s, v, i) => s + (v === i ? 1 : 0), 0)
  }, rnd);

  S.KNAP_DEFAULT = { weights: [2, 3, 4, 5], values: [1, 2, 5, 6], cap: 8 };
  S.knapsackBest = (w, v, cap) => {
    let best = 0;
    for (let m = 0; m < (1 << w.length); m++) {
      let ws = 0, vs = 0;
      for (let i = 0; i < w.length; i++) if (m & (1 << i)) { ws += w[i]; vs += v[i]; }
      if (ws <= cap && vs > best) best = vs;
    }
    return best;
  };
  S.knapsackFit = (g, w, v, cap) => {
    let ws = 0, vs = 0;
    g.forEach((x, i) => { if (x === 1) { ws += w[i]; vs += v[i]; } });
    return ws <= cap ? vs : -Infinity;
  };
  // o: {weights,values,cap,pop,mut,elite,tour}
  S.gaKnapsack = (o, rnd) => {
    const opt = S.knapsackBest(o.weights, o.values, o.cap);
    const st = S.GA({
      pop: o.pop, glen: o.weights.length, mut: o.mut, cross: o.cross, elite: o.elite, tour: o.tour, target: opt, maxGen: 100,
      init: r => Math.floor(r() * 2), mutGene: r => Math.floor(r() * 2),
      fitness: g => S.knapsackFit(g, o.weights, o.values, o.cap)
    }, rnd);
    st.optimum = opt;
    return st;
  };

  S.queensPenalty = g => {
    let pen = 0;
    for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) {   // every pair once
      if (g[i] === g[j]) pen++;
      if (Math.abs(i - j) === Math.abs(g[i] - g[j])) pen++;
    }
    return pen;
  };
  // o: {n,pop,mut,elite,tour}
  S.gaQueens = (o, rnd) => S.GA({
    pop: o.pop, glen: o.n, mut: o.mut, cross: o.cross, elite: o.elite, tour: o.tour, target: 1, maxGen: 3000,
    init: r => Math.floor(r() * o.n), mutGene: r => Math.floor(r() * o.n),
    fitness: g => 1 / (S.queensPenalty(g) + 1)
  }, rnd);

  /* ---------- Particle Swarm Optimization (ParticleSwarmOptimizationFunction.py) ---------- */
  S.psoF = x => (x + 1) * (x + 1) * Math.sin(x);
  // p: {min,max,n,iters,w,c1,c2}
  S.pso = function (p, rnd) {
    const f = S.psoF;
    const span = p.max - p.min;
    const parts = Array.from({ length: p.n }, () => {
      const x = p.min + span * rnd(), v = 0.1 * span * (rnd() * 2 - 1);   // small initial velocity (10% of the interval)
      return { x, v, bx: x, bv: 1e10 };
    });
    const st = { f, p, parts, gbx: parts[0].x, gbv: 1e10, iter: 0, hist: [], done: false };
    for (const q of parts) { const fx = f(q.x); if (st.gbv > fx) { st.gbv = fx; st.gbx = q.x; } }   // evaluate before the first move
    for (const q of parts) { const fx = f(q.x); if (q.bv > fx) { q.bv = fx; q.bx = q.x; } }
    st.step = function () {
      if (st.done) return false;
      for (const q of parts) {
        q.v = p.w * q.v + p.c1 * rnd() * (q.bx - q.x) + p.c2 * rnd() * (st.gbx - q.x);
        q.x = Math.min(p.max, Math.max(p.min, q.x + q.v));
      }
      for (const q of parts) { const fx = f(q.x); if (st.gbv > fx) { st.gbv = fx; st.gbx = q.x; } }
      for (const q of parts) { const fx = f(q.x); if (q.bv > fx) { q.bv = fx; q.bx = q.x; } }
      st.iter++; st.hist.push(st.gbv);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- Hill Climbing (extra) ---------- */
  S.hcF = x => Math.sin(x) + 0.5 * Math.sin(3 * x) + 0.25 * Math.sin(7 * x);
  // p: {min,max,delta,restart,patience,iters}
  S.hillClimb = function (p, rnd) {
    const f = S.hcF;
    const st = { f, p, x: p.min + (p.max - p.min) * rnd(), iter: 0, stuck: 0, restarts: 0, hist: [], bestHist: [], done: false, cand: 0, moved: false };
    st.best = st.x;
    st.step = function () {
      if (st.done) return false;
      const nx = Math.min(p.max, Math.max(p.min, st.x + (rnd() * 2 - 1) * p.delta));
      st.cand = nx;
      if (f(nx) > f(st.x)) { st.x = nx; st.stuck = 0; st.moved = true; } else { st.stuck++; st.moved = false; }
      if (p.restart && st.stuck >= p.patience) {
        st.x = p.min + (p.max - p.min) * rnd(); st.stuck = 0; st.restarts++;
      }
      if (f(st.x) > f(st.best)) st.best = st.x;
      st.iter++; st.hist.push(f(st.x)); st.bestHist.push(f(st.best));
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- Tabu Search on TSP (extra) ---------- */
  // p: {cities,tenure,iters}
  S.tabuTSP = function (p, rnd) {
    const cities = p.cities, n = cities.length;
    const tabu = Array.from({ length: n }, () => new Array(n).fill(0));
    const st = { cities, p, iter: 0, hist: [], bestHist: [], done: false, lastMove: null, tabuCount: 0 };
    st.tour = shuffle(range(n), rnd); st.len = S.tourLen(cities, st.tour);
    st.best = st.tour.slice(); st.bestLen = st.len; st.init = st.len;
    st.step = function () {
      if (st.done) return false;
      let bi = -1, bj = -1, bl = Infinity;
      for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) {
        const t = st.tour.slice(); [t[i], t[j]] = [t[j], t[i]];
        const l = S.tourLen(cities, t);
        const isTabu = tabu[st.tour[i]][st.tour[j]] > st.iter;
        if (isTabu && !(l < st.bestLen)) continue; // aspiration criterion
        if (l < bl) { bl = l; bi = i; bj = j; }
      }
      if (bi >= 0) {
        const a = st.tour[bi], b = st.tour[bj];
        [st.tour[bi], st.tour[bj]] = [st.tour[bj], st.tour[bi]];
        st.len = bl;
        tabu[a][b] = tabu[b][a] = st.iter + p.tenure;
        st.lastMove = [a, b];
        if (st.len < st.bestLen) { st.best = st.tour.slice(); st.bestLen = st.len; }
      }
      let c = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (tabu[i][j] > st.iter) c++;
      st.tabuCount = c;
      st.iter++; st.hist.push(st.len); st.bestHist.push(st.bestLen);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- Ant Colony Optimization on TSP (extra) ---------- */
  // p: {cities,ants,alpha,beta,rho,q,iters}
  S.aco = function (p, rnd) {
    const cities = p.cities, n = cities.length;
    const d = cities.map(a => cities.map(b => Math.hypot(a.x - b.x, a.y - b.y)));
    const tau = Array.from({ length: n }, () => new Array(n).fill(1));
    const st = { cities, p, tau, iter: 0, hist: [], bestHist: [], done: false, best: null, bestLen: Infinity, iterBest: null, iterLen: 0 };
    st.step = function () {
      if (st.done) return false;
      let ib = null, il = Infinity;
      const tours = [];
      for (let a = 0; a < p.ants; a++) {
        const start = Math.floor(rnd() * n);
        const tour = [start], seen = new Array(n).fill(false); seen[start] = true;
        while (tour.length < n) {
          const cur = tour[tour.length - 1], w = [];
          let sum = 0;
          for (let j = 0; j < n; j++) {
            const v = seen[j] ? 0 : Math.pow(tau[cur][j], p.alpha) * Math.pow(1 / (d[cur][j] + 1e-9), p.beta);
            w.push(v); sum += v;
          }
          let r = rnd() * sum, pick = -1;
          for (let j = 0; j < n; j++) { if (w[j] > 0) { pick = j; r -= w[j]; if (r <= 0) break; } }
          tour.push(pick); seen[pick] = true;
        }
        const len = S.tourLen(cities, tour);
        tours.push({ tour, len });
        if (len < il) { il = len; ib = tour; }
        if (len < st.bestLen) { st.bestLen = len; st.best = tour.slice(); }
      }
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) tau[i][j] *= 1 - p.rho;
      for (const { tour, len } of tours) {
        for (let i = 0; i < n; i++) {
          const a = tour[i], b = tour[(i + 1) % n];
          tau[a][b] += p.q / len; tau[b][a] += p.q / len;
        }
      }
      st.iterBest = ib; st.iterLen = il;
      st.iter++; st.hist.push(il); st.bestHist.push(st.bestLen);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- 2-D benchmark landscapes (DE, ABC, GWO) ---------- */
  S.FUNCS = {
    rastrigin: { f: (x, y) => 20 + x * x - 10 * Math.cos(2 * Math.PI * x) + y * y - 10 * Math.cos(2 * Math.PI * y), min: -5.12, max: 5.12 },
    himmelblau: { f: (x, y) => Math.pow(x * x + y - 11, 2) + Math.pow(x + y * y - 7, 2), min: -5, max: 5 },
    ackley: {
      f: (x, y) => -20 * Math.exp(-0.2 * Math.sqrt(0.5 * (x * x + y * y))) - Math.exp(0.5 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y))) + Math.E + 20,
      min: -5, max: 5
    }
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const randPt = (fn, rnd) => [fn.min + (fn.max - fn.min) * rnd(), fn.min + (fn.max - fn.min) * rnd()];

  /* ---------- Differential Evolution DE/rand/1/bin (extra) ---------- */
  // p: {fn,np,F,CR,iters}
  S.de = function (p, rnd) {
    const fn = S.FUNCS[p.fn];
    const pop = Array.from({ length: p.np }, () => { const x = randPt(fn, rnd); return { x, f: fn.f(x[0], x[1]) }; });
    const st = { fn, p, pop, iter: 0, hist: [], done: false, demo: null };
    const bestOf = () => pop.reduce((b, c) => (c.f < b.f ? c : b), pop[0]);
    st.best = bestOf();
    st.step = function () {
      if (st.done) return false;
      for (let i = 0; i < p.np; i++) {
        let r1, r2, r3;
        do { r1 = Math.floor(rnd() * p.np); } while (r1 === i);
        do { r2 = Math.floor(rnd() * p.np); } while (r2 === i || r2 === r1);
        do { r3 = Math.floor(rnd() * p.np); } while (r3 === i || r3 === r1 || r3 === r2);
        const m = [0, 1].map(k => clamp(pop[r1].x[k] + p.F * (pop[r2].x[k] - pop[r3].x[k]), fn.min, fn.max));
        const jr = Math.floor(rnd() * 2);
        const trial = [0, 1].map(k => (rnd() < p.CR || k === jr ? m[k] : pop[i].x[k]));
        const ft = fn.f(trial[0], trial[1]);
        if (i === 0) st.demo = { target: pop[i].x.slice(), r1: pop[r1].x.slice(), r2: pop[r2].x.slice(), r3: pop[r3].x.slice(), mutant: m, trial, win: ft <= pop[i].f };
        if (ft <= pop[i].f) { pop[i].x = trial; pop[i].f = ft; }
      }
      st.best = bestOf();
      st.iter++; st.hist.push(st.best.f);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- Artificial Bee Colony (extra) ---------- */
  // p: {fn,sn,limit,iters}
  S.abc = function (p, rnd) {
    const fn = S.FUNCS[p.fn];
    const mk = () => { const x = randPt(fn, rnd); return { x, f: fn.f(x[0], x[1]), trial: 0 }; };
    const src = Array.from({ length: p.sn }, mk);
    const fitOf = f => (f >= 0 ? 1 / (1 + f) : 1 + Math.abs(f));
    const st = { fn, p, src, iter: 0, hist: [], done: false, scouts: 0, best: null };
    const upd = () => { for (const s of src) if (!st.best || s.f < st.best.f) st.best = { x: s.x.slice(), f: s.f }; };
    upd();
    const tryNeighbor = i => {
      let k; do { k = Math.floor(rnd() * p.sn); } while (k === i);
      const j = Math.floor(rnd() * 2);
      const v = src[i].x.slice();
      v[j] = clamp(v[j] + (rnd() * 2 - 1) * (v[j] - src[k].x[j]), fn.min, fn.max);
      const fv = fn.f(v[0], v[1]);
      if (fv < src[i].f) { src[i].x = v; src[i].f = fv; src[i].trial = 0; } else src[i].trial++;
    };
    st.step = function () {
      if (st.done) return false;
      for (let i = 0; i < p.sn; i++) tryNeighbor(i);                       // employed bees
      const fits = src.map(s => fitOf(s.f)), tot = fits.reduce((a, b) => a + b, 0);
      for (let o = 0; o < p.sn; o++) {                                     // onlooker bees: roulette wheel
        let r = rnd() * tot, i = 0;
        while (i < p.sn - 1 && (r -= fits[i]) > 0) i++;
        tryNeighbor(i);
      }
      st.scouts = 0;
      for (let q = 0; q < p.sn; q++) if (src[q].trial > p.limit) { src[q] = mk(); st.scouts++; } // scout bees
      upd();
      st.iter++; st.hist.push(st.best.f);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- Grey Wolf Optimizer (extra) ---------- */
  // p: {fn,n,iters}
  S.gwo = function (p, rnd) {
    const fn = S.FUNCS[p.fn];
    const wolves = Array.from({ length: p.n }, () => { const x = randPt(fn, rnd); return { x, f: fn.f(x[0], x[1]) }; });
    const st = { fn, p, wolves, iter: 0, hist: [], done: false, a: 2, leaders: null };
    const rank = () => wolves.slice().sort((u, v) => u.f - v.f).slice(0, 3).map(w => w.x.slice());
    st.leaders = rank();
    st.step = function () {
      if (st.done) return false;
      st.a = 2 - 2 * st.iter / p.iters;
      const [al, be, de] = st.leaders;
      for (const w of wolves) {
        const nx = [0, 1].map(k => {
          const parts = [al, be, de].map(L => {
            const A = 2 * st.a * rnd() - st.a, C = 2 * rnd();
            const D = Math.abs(C * L[k] - w.x[k]);
            return L[k] - A * D;
          });
          return clamp((parts[0] + parts[1] + parts[2]) / 3, fn.min, fn.max);
        });
        w.x = nx; w.f = fn.f(nx[0], nx[1]);
      }
      st.leaders = rank();
      st.best = { x: st.leaders[0], f: fn.f(st.leaders[0][0], st.leaders[0][1]) };
      st.iter++; st.hist.push(st.best.f);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    st.best = { x: st.leaders[0], f: fn.f(st.leaders[0][0], st.leaders[0][1]) };
    return st;
  };

  root.Sims = S;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
