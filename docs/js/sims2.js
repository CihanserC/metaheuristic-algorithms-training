/* More pure simulation cores (no DOM): local-search family, nature-inspired and distribution-based methods.
   Loaded after sims.js; extends window.Sims (or the module in Node). */
(function (root) {
  'use strict';
  const S = root.Sims || (typeof require !== 'undefined' ? require('./sims.js') : null);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const randn = rnd => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const levy = rnd => randn(rnd) * 0.6966 / Math.pow(Math.abs(randn(rnd)) + 1e-12, 1 / 1.5); // Mantegna, beta = 1.5
  const randPt = (fn, rnd) => [fn.min + (fn.max - fn.min) * rnd(), fn.min + (fn.max - fn.min) * rnd()];
  const evalAt = (fn, x) => fn.f(x[0], x[1]);
  const mkInd = (fn, rnd) => { const x = randPt(fn, rnd); return { x, f: evalAt(fn, x) }; };
  const bestOf = pop => pop.reduce((b, c) => (c.f < b.f ? c : b), pop[0]);
  const copyBest = b => ({ x: b.x.slice(), f: b.f });

  /* ---------- 1-D single-solution methods on S.hcF (maximise on [0,10]) ---------- */
  // Iterated Local Search. p: {delta,patience,kick,iters}
  S.ils = function (p, rnd) {
    const f = S.hcF, rx = () => 10 * rnd();
    const st = { f, p, iter: 0, hist: [], bestHist: [], done: false, kicks: 0, acceptedKicks: 0, opt: null, kicked: false, lastAccepted: null };
    st.work = rx(); st.stuck = 0; st.best = st.work;
    st.step = function () {
      if (st.done) return false;
      st.kicked = false;
      const nx = clamp(st.work + (rnd() * 2 - 1) * p.delta, 0, 10);
      if (f(nx) > f(st.work)) { st.work = nx; st.stuck = 0; } else st.stuck++;
      if (st.stuck >= p.patience) {                                   // local optimum reached
        const better = st.opt === null || f(st.work) >= f(st.opt);
        st.lastAccepted = better;
        if (better) { st.opt = st.work; if (st.kicks) st.acceptedKicks++; } else st.work = st.opt;
        if (f(st.opt) > f(st.best)) st.best = st.opt;
        st.kicks++; st.kicked = true; st.stuck = 0;
        st.work = clamp(st.opt + (rnd() * 2 - 1) * p.kick, 0, 10);    // perturbation (kick)
      }
      if (st.opt === null && f(st.work) > f(st.best)) st.best = st.work;
      st.iter++; st.hist.push(f(st.work)); st.bestHist.push(f(st.best));
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  // Great Deluge (maximisation: the water level rises). p: {delta,depth,rain,iters}
  S.greatDeluge = function (p, rnd) {
    const f = S.hcF;
    const st = { f, p, x: 10 * rnd(), iter: 0, hist: [], bestHist: [], levels: [], done: false, moved: false, cand: 0 };
    st.level = f(st.x) - p.depth; st.best = st.x;
    st.step = function () {
      if (st.done) return false;
      const nx = clamp(st.x + (rnd() * 2 - 1) * p.delta, 0, 10);
      st.cand = nx; st.moved = f(nx) >= st.level;
      if (st.moved) st.x = nx;
      if (f(st.x) > f(st.best)) st.best = st.x;
      st.level += p.rain;
      st.iter++; st.hist.push(f(st.x)); st.bestHist.push(f(st.best)); st.levels.push(st.level);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  // Threshold Accepting: accept if the new value is not worse than the current one by more than T. p: {delta,t0,decay,iters}
  S.thresholdAccepting = function (p, rnd) {
    const f = S.hcF;
    const st = { f, p, x: 10 * rnd(), T: p.t0, iter: 0, hist: [], bestHist: [], done: false, moved: false, cand: 0, Ts: [] };
    st.best = st.x;
    st.step = function () {
      if (st.done) return false;
      const nx = clamp(st.x + (rnd() * 2 - 1) * p.delta, 0, 10);
      st.cand = nx; st.moved = f(nx) >= f(st.x) - st.T;
      if (st.moved) st.x = nx;
      if (f(st.x) > f(st.best)) st.best = st.x;
      st.T *= p.decay;
      st.iter++; st.hist.push(f(st.x)); st.bestHist.push(f(st.best)); st.Ts.push(st.T);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- Variable Neighborhood Search (2-D landscape, minimise) ---------- */
  // p: {fn,r0,kmax,ls,lsStep,iters}
  S.vns = function (p, rnd) {
    const fn = S.FUNCS[p.fn], W = fn.max - fn.min;
    const cur = mkInd(fn, rnd);
    const st = { fn, p, cur, k: 1, iter: 0, hist: [], done: false, shake: null, result: null, improved: false, radius: p.r0 * W };
    st.best = copyBest(cur);
    st.step = function () {
      if (st.done) return false;
      st.radius = st.k * p.r0 * W;
      const xs = [0, 1].map(d => clamp(cur.x[d] + (rnd() * 2 - 1) * st.radius, fn.min, fn.max));   // shaking in the k-th neighbourhood
      let y = { x: xs, f: evalAt(fn, xs) };
      for (let l = 0; l < p.ls; l++) {                                                               // local search
        const yn = y.x.map(v => clamp(v + randn(rnd) * p.lsStep * W, fn.min, fn.max)), fy = evalAt(fn, yn);
        if (fy < y.f) y = { x: yn, f: fy };
      }
      st.shake = xs; st.result = y.x; st.improved = y.f < cur.f;
      st.usedK = st.k;
      if (st.improved) { cur.x = y.x; cur.f = y.f; st.k = 1; } else st.k = st.k % p.kmax + 1;
      if (cur.f < st.best.f) st.best = copyBest(cur);
      st.iter++; st.hist.push(st.best.f);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- GRASP on TSP ---------- */
  S.twoOpt = function (cities, tour) {
    const n = tour.length, d = (a, b) => Math.hypot(cities[a].x - cities[b].x, cities[a].y - cities[b].y);
    let improved = true, moves = 0;
    while (improved) {
      improved = false;
      for (let i = 0; i < n - 1 && !improved; i++) for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const a = tour[i], b = tour[i + 1], c = tour[j], e = tour[(j + 1) % n];
        if (d(a, c) + d(b, e) < d(a, b) + d(c, e) - 1e-9) {
          let l = i + 1, r = j; while (l < r) { [tour[l], tour[r]] = [tour[r], tour[l]]; l++; r--; }
          improved = true; moves++; break;
        }
      }
    }
    return moves;
  };
  // p: {cities,alpha,iters}
  S.grasp = function (p, rnd) {
    const cities = p.cities, n = cities.length;
    const d = (a, b) => Math.hypot(cities[a].x - cities[b].x, cities[a].y - cities[b].y);
    const st = { cities, p, iter: 0, hist: [], bestHist: [], done: false, built: null, builtLen: 0, tour: null, len: Infinity, best: null, bestLen: Infinity, moves: 0 };
    st.step = function () {
      if (st.done) return false;
      const tour = [Math.floor(rnd() * n)], seen = new Array(n).fill(false); seen[tour[0]] = true;
      while (tour.length < n) {                                          // greedy randomised construction
        const cur = tour[tour.length - 1], cand = [];
        for (let j = 0; j < n; j++) if (!seen[j]) cand.push({ j, c: d(cur, j) });
        let lo = Infinity, hi = -Infinity; for (const c of cand) { lo = Math.min(lo, c.c); hi = Math.max(hi, c.c); }
        const rcl = cand.filter(c => c.c <= lo + p.alpha * (hi - lo) + 1e-12);
        const pick = rcl[Math.floor(rnd() * rcl.length)].j;
        tour.push(pick); seen[pick] = true;
      }
      st.built = tour.slice(); st.builtLen = S.tourLen(cities, tour);
      st.moves = S.twoOpt(cities, tour);                                   // local search
      st.tour = tour; st.len = S.tourLen(cities, tour);
      if (st.len < st.bestLen) { st.best = tour.slice(); st.bestLen = st.len; }
      st.iter++; st.hist.push(st.len); st.bestHist.push(st.bestLen);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- Nature-inspired population methods (2-D, minimise) ---------- */
  // Firefly Algorithm. p: {fn,n,alpha,beta0,gamma,iters}
  S.firefly = function (p, rnd) {
    const fn = S.FUNCS[p.fn], W = fn.max - fn.min;
    const ff = Array.from({ length: p.n }, () => mkInd(fn, rnd));
    const st = { fn, p, ff, iter: 0, hist: [], done: false, alpha: p.alpha, best: copyBest(bestOf(ff)) };
    st.step = function () {
      if (st.done) return false;
      for (let i = 0; i < p.n; i++) for (let j = 0; j < p.n; j++) {
        if (ff[j].f < ff[i].f) {
          const r = Math.hypot(ff[i].x[0] - ff[j].x[0], ff[i].x[1] - ff[j].x[1]) / W;
          const beta = p.beta0 * Math.exp(-p.gamma * r * r);
          ff[i].x = ff[i].x.map((v, k) => clamp(v + beta * (ff[j].x[k] - v) + st.alpha * (rnd() - 0.5) * W, fn.min, fn.max));
          ff[i].f = evalAt(fn, ff[i].x);
        }
      }
      const b = bestOf(ff); if (b.f < st.best.f) st.best = copyBest(b);
      st.alpha *= 0.97;
      st.iter++; st.hist.push(st.best.f);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  // Cuckoo Search (Yang & Deb). p: {fn,n,pa,alpha,iters}
  S.cuckoo = function (p, rnd) {
    const fn = S.FUNCS[p.fn], W = fn.max - fn.min;
    const nests = Array.from({ length: p.n }, () => mkInd(fn, rnd));
    const st = { fn, p, nests, iter: 0, hist: [], done: false, best: copyBest(bestOf(nests)), abandoned: 0, lastFlights: [] };
    st.step = function () {
      if (st.done) return false;
      st.lastFlights = [];
      const b = st.best;
      for (let i = 0; i < p.n; i++) {                                   // Levy flights
        const L = levy(rnd);
        const xn = nests[i].x.map((v, k) => clamp(v + p.alpha * L * (v - b.x[k]) * randn(rnd) * 0.1 + 0.002 * W * randn(rnd), fn.min, fn.max));
        const fnew = evalAt(fn, xn);
        st.lastFlights.push([nests[i].x.slice(), xn]);
        if (fnew < nests[i].f) { nests[i].x = xn; nests[i].f = fnew; }
      }
      st.abandoned = 0;
      for (let i = 0; i < p.n; i++) {                                   // discovery of alien eggs (fraction pa)
        if (rnd() < p.pa) {
          const a = nests[Math.floor(rnd() * p.n)], c = nests[Math.floor(rnd() * p.n)];
          const xn = nests[i].x.map((v, k) => clamp(v + rnd() * (a.x[k] - c.x[k]), fn.min, fn.max));
          const fnew = evalAt(fn, xn); st.abandoned++;
          if (fnew < nests[i].f) { nests[i].x = xn; nests[i].f = fnew; }
        }
      }
      const nb = bestOf(nests); if (nb.f < st.best.f) st.best = copyBest(nb);
      st.iter++; st.hist.push(st.best.f);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  // Bat Algorithm. p: {fn,n,fmax,A0,r0,alpha,gamma,iters}
  S.bat = function (p, rnd) {
    const fn = S.FUNCS[p.fn], W = fn.max - fn.min;
    const bats = Array.from({ length: p.n }, () => ({ ...mkInd(fn, rnd), v: [0, 0], A: p.A0, r: p.r0 * 0.2 }));
    const st = { fn, p, bats, iter: 0, hist: [], done: false, best: copyBest(bestOf(bats)) };
    st.step = function () {
      if (st.done) return false;
      const meanA = bats.reduce((s, b) => s + b.A, 0) / p.n;
      for (const bt of bats) {
        const freq = p.fmax * rnd();
        bt.v = bt.v.map((v, k) => v + (bt.x[k] - st.best.x[k]) * freq);
        let xn = bt.x.map((v, k) => clamp(v + bt.v[k], fn.min, fn.max));
        if (rnd() > bt.r) xn = st.best.x.map(v => clamp(v + 0.1 * W * (rnd() * 2 - 1) * meanA, fn.min, fn.max)); // local walk around the best
        const fnew = evalAt(fn, xn);
        if (fnew <= bt.f && rnd() < bt.A) { bt.x = xn; bt.f = fnew; bt.A *= p.alpha; bt.r = p.r0 * (1 - Math.exp(-p.gamma * (st.iter + 1))); }
      }
      const b = bestOf(bats); if (b.f < st.best.f) st.best = copyBest(b);
      st.iter++; st.hist.push(st.best.f);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  // Whale Optimization Algorithm. p: {fn,n,iters}
  S.woa = function (p, rnd) {
    const fn = S.FUNCS[p.fn];
    const whales = Array.from({ length: p.n }, () => mkInd(fn, rnd));
    const st = { fn, p, whales, iter: 0, hist: [], done: false, a: 2, best: copyBest(bestOf(whales)), mode: [] };
    st.step = function () {
      if (st.done) return false;
      st.a = 2 - 2 * st.iter / p.iters; st.mode = [];
      for (const w of whales) {
        const A = 2 * st.a * rnd() - st.a, C = 2 * rnd(), pr = rnd(), l = rnd() * 2 - 1;
        let xn;
        if (pr < 0.5) {
          if (Math.abs(A) < 1) { xn = w.x.map((v, k) => st.best.x[k] - A * Math.abs(C * st.best.x[k] - v)); st.mode.push('encircle'); }
          else { const r = whales[Math.floor(rnd() * p.n)]; xn = w.x.map((v, k) => r.x[k] - A * Math.abs(C * r.x[k] - v)); st.mode.push('search'); }
        } else { xn = w.x.map((v, k) => Math.abs(st.best.x[k] - v) * Math.exp(l) * Math.cos(2 * Math.PI * l) + st.best.x[k]); st.mode.push('spiral'); }
        w.x = xn.map(v => clamp(v, fn.min, fn.max)); w.f = evalAt(fn, w.x);
      }
      const b = bestOf(whales); if (b.f < st.best.f) st.best = copyBest(b);
      st.iter++; st.hist.push(st.best.f);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  // Harris Hawks Optimization. p: {fn,n,iters}
  S.hho = function (p, rnd) {
    const fn = S.FUNCS[p.fn], W = fn.max - fn.min;
    const hawks = Array.from({ length: p.n }, () => mkInd(fn, rnd));
    const st = { fn, p, hawks, iter: 0, hist: [], done: false, E: 1, best: copyBest(bestOf(hawks)), phase: '' };
    const lf = () => 0.01 * rnd() * 0.6966 / Math.pow(Math.abs(rnd()) + 1e-9, 1 / 1.5);
    st.step = function () {
      if (st.done) return false;
      const rabbit = st.best.x, mean = [0, 1].map(k => hawks.reduce((s, h) => s + h.x[k], 0) / p.n);
      const E0 = rnd() * 2 - 1; st.E = 2 * E0 * (1 - st.iter / p.iters);
      const E = st.E; let ph = {};
      for (const h of hawks) {
        let xn;
        if (Math.abs(E) >= 1) {                                                    // exploration
          const q = rnd(), r1 = rnd(), r2 = rnd(), r3 = rnd(), r4 = rnd();
          if (q < 0.5) { const hr = hawks[Math.floor(rnd() * p.n)]; xn = h.x.map((v, k) => hr.x[k] - r1 * Math.abs(hr.x[k] - 2 * r2 * v)); ph.explore = 1; }
          else { xn = h.x.map((v, k) => (rabbit[k] - mean[k]) - r3 * (fn.min + r4 * W)); ph.explore = 1; }
        } else {                                                                   // exploitation
          const r = rnd(), J = 2 * (1 - rnd());
          if (r >= 0.5 && Math.abs(E) >= 0.5) { xn = h.x.map((v, k) => (rabbit[k] - v) - E * Math.abs(J * rabbit[k] - v)); ph.soft = 1; }
          else if (r >= 0.5) { xn = h.x.map((v, k) => rabbit[k] - E * Math.abs(rabbit[k] - v)); ph.hard = 1; }
          else {
            const base = Math.abs(E) >= 0.5 ? h.x : mean;
            const Y = h.x.map((v, k) => rabbit[k] - E * Math.abs(J * rabbit[k] - base[k]));
            const Z = Y.map(v => v + 0.4 * W * lf() * (rnd() - 0.5) * 2);
            const cl = a => a.map(v => clamp(v, fn.min, fn.max));
            const fy = evalAt(fn, cl(Y)), fz = evalAt(fn, cl(Z));
            xn = fy < h.f ? Y : (fz < h.f ? Z : h.x.slice()); ph.dive = 1;
          }
        }
        xn = xn.map(v => clamp(v, fn.min, fn.max)); const fnew = evalAt(fn, xn);
        if (fnew < h.f || Math.abs(E) >= 1) { h.x = xn; h.f = fnew; }               // greedy in exploitation, free in exploration
      }
      st.phase = Object.keys(ph).join(',');
      const b = bestOf(hawks); if (b.f < st.best.f) st.best = copyBest(b);
      st.iter++; st.hist.push(st.best.f);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  // Harmony Search. p: {fn,hms,hmcr,par,bw,iters}   (one step = one improvised harmony)
  S.harmony = function (p, rnd) {
    const fn = S.FUNCS[p.fn], W = fn.max - fn.min;
    const hm = Array.from({ length: p.hms }, () => mkInd(fn, rnd));
    const st = { fn, p, hm, iter: 0, hist: [], done: false, best: copyBest(bestOf(hm)), cand: null, accepted: false };
    st.step = function () {
      if (st.done) return false;
      const xn = [0, 1].map(k => {
        let v;
        if (rnd() < p.hmcr) {                                              // memory consideration
          v = hm[Math.floor(rnd() * p.hms)].x[k];
          if (rnd() < p.par) v += (rnd() * 2 - 1) * p.bw * W;              // pitch adjustment
        } else v = fn.min + W * rnd();                                     // random selection
        return clamp(v, fn.min, fn.max);
      });
      const fnew = evalAt(fn, xn);
      let worst = 0; for (let i = 1; i < p.hms; i++) if (hm[i].f > hm[worst].f) worst = i;
      st.cand = xn; st.accepted = fnew < hm[worst].f;
      if (st.accepted) hm[worst] = { x: xn, f: fnew };
      const b = bestOf(hm); if (b.f < st.best.f) st.best = copyBest(b);
      st.iter++; st.hist.push(st.best.f);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  // Teaching-Learning-Based Optimization. p: {fn,n,iters}
  S.tlbo = function (p, rnd) {
    const fn = S.FUNCS[p.fn];
    const pop = Array.from({ length: p.n }, () => mkInd(fn, rnd));
    const st = { fn, p, pop, iter: 0, hist: [], done: false, best: copyBest(bestOf(pop)), teacher: null, mean: [0, 0] };
    const tryMove = (i, xn) => { xn = xn.map(v => clamp(v, fn.min, fn.max)); const f = evalAt(fn, xn); if (f < pop[i].f) { pop[i].x = xn; pop[i].f = f; } };
    st.step = function () {
      if (st.done) return false;
      const teacher = bestOf(pop), mean = [0, 1].map(k => pop.reduce((s, q) => s + q.x[k], 0) / p.n);
      st.teacher = teacher.x.slice(); st.mean = mean;
      for (let i = 0; i < p.n; i++) {                                          // teacher phase
        const TF = 1 + Math.round(rnd());
        tryMove(i, pop[i].x.map((v, k) => v + rnd() * (teacher.x[k] - TF * mean[k])));
      }
      for (let i = 0; i < p.n; i++) {                                          // learner phase
        let j; do { j = Math.floor(rnd() * p.n); } while (j === i);
        const dir = pop[i].f < pop[j].f ? 1 : -1;
        tryMove(i, pop[i].x.map((v, k) => v + dir * rnd() * (v - pop[j].x[k])));
      }
      const b = bestOf(pop); if (b.f < st.best.f) st.best = copyBest(b);
      st.iter++; st.hist.push(st.best.f);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- Memetic algorithm: real-coded GA + local search ---------- */
  // p: {fn,n,mut,sigma,ls,lsStep,iters}
  S.memetic = function (p, rnd) {
    const fn = S.FUNCS[p.fn], W = fn.max - fn.min;
    let pop = Array.from({ length: p.n }, () => mkInd(fn, rnd));
    const st = { fn, p, get pop() { return pop; }, iter: 0, hist: [], done: false, evals: p.n, evalHist: [], best: copyBest(bestOf(pop)), lsTrails: [] };
    const tour = () => { let b = null; for (let i = 0; i < 3; i++) { const c = pop[Math.floor(rnd() * p.n)]; if (!b || c.f < b.f) b = c; } return b; };
    st.step = function () {
      if (st.done) return false;
      const next = [copyBest(bestOf(pop))]; st.lsTrails = [];
      while (next.length < p.n) {
        const a = tour(), b = tour(), lam = rnd();
        let x = a.x.map((v, k) => lam * v + (1 - lam) * b.x[k]);
        x = x.map(v => (rnd() < p.mut ? clamp(v + randn(rnd) * p.sigma * W, fn.min, fn.max) : v));
        let f = evalAt(fn, x); st.evals++;
        const start = x.slice();
        for (let l = 0; l < p.ls; l++) {                                    // local search (Lamarckian: result is written back)
          const xn = x.map(v => clamp(v + randn(rnd) * p.lsStep * W, fn.min, fn.max)), fnn = evalAt(fn, xn); st.evals++;
          if (fnn < f) { x = xn; f = fnn; }
        }
        if (p.ls > 0 && st.lsTrails.length < 12) st.lsTrails.push([start, x.slice()]);
        next.push({ x, f });
      }
      pop = next;
      const b = bestOf(pop); if (b.f < st.best.f) st.best = copyBest(b);
      st.iter++; st.hist.push(st.best.f); st.evalHist.push(st.evals);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- Cross-Entropy Method (Gaussian, diagonal) ---------- */
  // p: {fn,n,rho,smooth,iters}
  S.crossEntropy = function (p, rnd) {
    const fn = S.FUNCS[p.fn], W = fn.max - fn.min, mid = (fn.max + fn.min) / 2;
    const st = { fn, p, mean: [mid + (rnd() - 0.5) * W * 0.4, mid + (rnd() - 0.5) * W * 0.4], std: [W / 3, W / 3], iter: 0, hist: [], done: false, samples: [], elites: [], best: { x: [mid, mid], f: Infinity } };
    st.best = { x: st.mean.slice(), f: evalAt(fn, st.mean) };
    st.step = function () {
      if (st.done) return false;
      const smp = Array.from({ length: p.n }, () => { const x = [0, 1].map(k => clamp(st.mean[k] + st.std[k] * randn(rnd), fn.min, fn.max)); return { x, f: evalAt(fn, x) }; });
      smp.sort((a, b) => a.f - b.f);
      const ne = Math.max(2, Math.ceil(p.rho * p.n)), el = smp.slice(0, ne);
      const nm = [0, 1].map(k => el.reduce((s, e) => s + e.x[k], 0) / ne);
      const ns = [0, 1].map(k => Math.sqrt(el.reduce((s, e) => s + (e.x[k] - nm[k]) ** 2, 0) / ne) + 1e-6);
      st.mean = st.mean.map((m, k) => p.smooth * nm[k] + (1 - p.smooth) * m);
      st.std = st.std.map((s, k) => p.smooth * ns[k] + (1 - p.smooth) * s);
      st.samples = smp; st.elites = el;
      if (smp[0].f < st.best.f) st.best = copyBest(smp[0]);
      st.iter++; st.hist.push(st.best.f);
      if (st.iter >= p.iters) st.done = true;
      return !st.done;
    };
    return st;
  };

  /* ---------- CMA-ES in 2-D ---------- */
  const eig2 = C => {                                         // symmetric 2x2: returns {B (cols = eigenvectors), d (eigenvalues)}
    const a = C[0][0], b = C[0][1], d = C[1][1];
    if (Math.abs(b) < 1e-14) return { B: [[1, 0], [0, 1]], l: [a, d] };
    const tr = a + d, det = a * d - b * b, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
    const v1 = [l1 - d, b], n1 = Math.hypot(v1[0], v1[1]); v1[0] /= n1; v1[1] /= n1;
    return { B: [[v1[0], -v1[1]], [v1[1], v1[0]]], l: [l1, l2] };
  };
  // p: {fn,lambda,sigma0,iters}
  S.cmaes = function (p, rnd) {
    const fn = S.FUNCS[p.fn], W = fn.max - fn.min, n = 2;
    const lambda = p.lambda, mu = Math.floor(lambda / 2);
    let w = Array.from({ length: mu }, (_, i) => Math.log(mu + 0.5) - Math.log(i + 1)); const sw = w.reduce((a, b) => a + b, 0); w = w.map(v => v / sw);
    const mueff = 1 / w.reduce((s, v) => s + v * v, 0);
    const cc = (4 + mueff / n) / (n + 4 + 2 * mueff / n), cs = (mueff + 2) / (n + mueff + 5);
    const c1 = 2 / ((n + 1.3) ** 2 + mueff), cmu = Math.min(1 - c1, 2 * (mueff - 2 + 1 / mueff) / ((n + 2) ** 2 + mueff));
    const damps = 1 + 2 * Math.max(0, Math.sqrt((mueff - 1) / (n + 1)) - 1) + cs, chiN = Math.sqrt(n) * (1 - 1 / (4 * n) + 1 / (21 * n * n));
    const st = { fn, p, m: randPt(fn, rnd), sigma: p.sigma0 * W, C: [[1, 0], [0, 1]], ps: [0, 0], pc: [0, 0], iter: 0, hist: [], done: false, samples: [], best: { x: [0, 0], f: Infinity }, axes: null, mu };
    st.step = function () {
      if (st.done) return false;
      const { B, l } = eig2(st.C), D = l.map(v => Math.sqrt(Math.max(v, 1e-20)));
      const pts = Array.from({ length: lambda }, () => {
        const z = [randn(rnd), randn(rnd)], dz = [D[0] * z[0], D[1] * z[1]];
        const y = [B[0][0] * dz[0] + B[0][1] * dz[1], B[1][0] * dz[0] + B[1][1] * dz[1]];
        const x = [st.m[0] + st.sigma * y[0], st.m[1] + st.sigma * y[1]];
        const xc = [clamp(x[0], fn.min, fn.max), clamp(x[1], fn.min, fn.max)];
        return { x: xc, y, f: evalAt(fn, xc) };
      });
      pts.sort((a, b) => a.f - b.f);
      const yw = [0, 0]; for (let i = 0; i < mu; i++) { yw[0] += w[i] * pts[i].y[0]; yw[1] += w[i] * pts[i].y[1]; }
      st.m = [st.m[0] + st.sigma * yw[0], st.m[1] + st.sigma * yw[1]];
      const bt = [B[0][0] * yw[0] + B[1][0] * yw[1], B[0][1] * yw[0] + B[1][1] * yw[1]];            // B^T yw
      const inv = [B[0][0] * bt[0] / D[0] + B[0][1] * bt[1] / D[1], B[1][0] * bt[0] / D[0] + B[1][1] * bt[1] / D[1]]; // C^-1/2 yw
      const k = Math.sqrt(cs * (2 - cs) * mueff);
      st.ps = [(1 - cs) * st.ps[0] + k * inv[0], (1 - cs) * st.ps[1] + k * inv[1]];
      const psn = Math.hypot(st.ps[0], st.ps[1]);
      const hsig = psn / Math.sqrt(1 - Math.pow(1 - cs, 2 * (st.iter + 1))) / chiN < 1.4 + 2 / (n + 1) ? 1 : 0;
      const k2 = hsig * Math.sqrt(cc * (2 - cc) * mueff);
      st.pc = [(1 - cc) * st.pc[0] + k2 * yw[0], (1 - cc) * st.pc[1] + k2 * yw[1]];
      const C = st.C, nC = [[0, 0], [0, 0]];
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
        let rank = 0; for (let i = 0; i < mu; i++) rank += w[i] * pts[i].y[a] * pts[i].y[b];
        nC[a][b] = (1 - c1 - cmu) * C[a][b] + c1 * (st.pc[a] * st.pc[b] + (1 - hsig) * cc * (2 - cc) * C[a][b]) + cmu * rank;
      }
      nC[1][0] = nC[0][1] = (nC[0][1] + nC[1][0]) / 2;
      st.C = nC;
      st.sigma = Math.min(W, st.sigma * Math.exp((cs / damps) * (psn / chiN - 1)));
      const e = eig2(st.C); st.axes = { B: e.B, l: e.l };
      st.samples = pts.map((q, i) => ({ x: q.x, f: q.f, sel: i < mu }));
      if (pts[0].f < st.best.f) st.best = copyBest(pts[0]);
      st.iter++; st.hist.push(st.best.f);
      if (st.iter >= p.iters || st.sigma < 1e-9) st.done = true;
      return !st.done;
    };
    st.axes = { B: [[1, 0], [0, 1]], l: [1, 1] };
    st.best = { x: st.m.slice(), f: evalAt(fn, st.m) };
    return st;
  };

  /* ---------- PBIL (binary Estimation of Distribution Algorithm) ---------- */
  // p: {len,n,lr,mutP,mutShift,maxGen}
  S.pbil = function (p, rnd) {
    const target = Array.from({ length: p.len }, () => (rnd() < 0.5 ? 1 : 0));
    const prob = new Array(p.len).fill(0.5);
    const st = { p, target, prob, gen: 0, histBest: [], histAvg: [], done: false, samples: [], best: { g: prob.map(() => 0), f: 0 } };
    st.step = function () {
      if (st.done) return false;
      const smp = Array.from({ length: p.n }, () => { const g = prob.map(q => (rnd() < q ? 1 : 0)); return { g, f: g.reduce((s, v, i) => s + (v === target[i] ? 1 : 0), 0) }; });
      smp.sort((a, b) => b.f - a.f);
      const b = smp[0];
      for (let i = 0; i < p.len; i++) {
        prob[i] = prob[i] * (1 - p.lr) + b.g[i] * p.lr;                                 // move the distribution towards the best sample
        if (rnd() < p.mutP) prob[i] = prob[i] * (1 - p.mutShift) + (rnd() < 0.5 ? 0 : 1) * p.mutShift; // mutate the distribution
      }
      st.samples = smp; if (b.f > st.best.f) st.best = { g: b.g.slice(), f: b.f };
      st.gen++; st.histBest.push(b.f); st.histAvg.push(smp.reduce((s, q) => s + q.f, 0) / smp.length);
      if (b.f === p.len || st.gen >= p.maxGen) st.done = true;
      return !st.done;
    };
    return st;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
