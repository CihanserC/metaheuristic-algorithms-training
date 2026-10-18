// Quick headless sanity checks for site/js/sims.js  ->  node tools/test-sims.js
const S = require('../docs/js/sims.js');
const run = (st, max = 1e6) => { let n = 0; while (st.step() !== false && n++ < max); return st; };
const R = seed => S.mulberry32(seed);
const out = [];
const ok = (name, cond, info) => { out.push((cond ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };

let s = run(S.saFunc({ min: -2, max: 2, tmin: 1e-5, tmax: 100, cool: 0.02, original: false }, R(1)));
ok('SA function (fixed)', Math.abs(s.best + 1.289) < 0.05, `iters=${s.iter} best x=${s.best.toFixed(3)} f=${S.saF(s.best).toFixed(3)}`);
s = run(S.saFunc({ min: -2, max: 2, tmin: 1e-5, tmax: 100, cool: 0.02, original: true }, R(1)));
let acc = 0; const t = S.saFunc({ min: -2, max: 2, tmin: 1e-5, tmax: 100, cool: 0.02, original: true }, R(2));
for (let i = 0; i < 500; i++) { t.step(); if (t.accepted) acc++; }
ok('SA function (original sign => always accepts)', acc === 500, `accepted ${acc}/500`);

const cities = S.makeCities(10, R(3));
s = run(S.saTSP({ cities, tmin: 1e-5, tmax: 1e5, cool: 0.01 }, R(4)));
ok('SA TSP improves', s.bestLen < s.init, `init=${s.init.toFixed(0)} best=${s.bestLen.toFixed(0)} iters=${s.iter}`);

s = run(S.saSudoku({ tmin: 1e-2, tmax: 1e4, cool: 0.999 }, R(5)));
ok('SA Sudoku runs', s.bestFit <= 6, `bestPenalty=${s.bestFit} iters=${s.iter}`);
const givens = S.SUDOKU.every((r, i) => r.every((v, j) => v === 0 || s.best[i][j] === v));
ok('Sudoku keeps given digits', givens);

s = run(S.gaSequence({ pop: 100, mut: 0.015, elite: 5, tour: 20 }, R(6)));
ok('GA sequence converges', s.best.f === 10, `gens=${s.gen}`);
s = run(S.gaKnapsack({ ...S.KNAP_DEFAULT, pop: 50, mut: 0.015, elite: 5, tour: 10 }, R(7)));
ok('GA knapsack optimum', s.best.f === s.optimum, `opt=${s.optimum} got=${s.best.f}`);
s = run(S.gaQueens({ n: 8, pop: 100, mut: 0.05, elite: 5, tour: 20 }, R(8)));
ok('GA 8-queens', s.best.f === 1, `gens=${s.gen} fit=${s.best.f.toFixed(3)}`);

s = run(S.pso({ min: -4, max: 2, n: 100, iters: 30, w: 0.7, c1: 1.4, c2: 1.2 }, R(9)));
ok('PSO finds minimum', Math.abs(s.gbv + 1.347) < 0.01, `x=${s.gbx.toFixed(3)} f=${s.gbv.toFixed(3)}`);

s = run(S.hillClimb({ min: 0, max: 10, delta: 0.3, restart: true, patience: 25, iters: 600 }, R(10)));
ok('Hill climbing + restarts', Math.abs(S.hcF(s.best) - 1.083) < 0.01, `best f=${S.hcF(s.best).toFixed(3)} restarts=${s.restarts}`);

const c2 = S.makeCities(15, R(11));
s = run(S.tabuTSP({ cities: c2, tenure: 8, iters: 150 }, R(12)));
ok('Tabu TSP improves', s.bestLen < s.init * 0.6, `init=${s.init.toFixed(0)} best=${s.bestLen.toFixed(0)}`);
s = run(S.aco({ cities: c2, ants: 15, alpha: 1, beta: 4, rho: 0.4, q: 500, iters: 80 }, R(13)));
ok('ACO TSP', s.bestLen < 4000, `best=${s.bestLen.toFixed(0)}`);

for (const fn of ['rastrigin', 'himmelblau', 'ackley']) {
  s = run(S.de({ fn, np: 30, F: 0.6, CR: 0.8, iters: 80 }, R(14))); ok('DE ' + fn, s.best.f < 1.0, 'f=' + s.best.f.toFixed(4));
  s = run(S.abc({ fn, sn: 20, limit: 20, iters: 100 }, R(15))); ok('ABC ' + fn, s.best.f < 2.5, 'f=' + s.best.f.toFixed(4));
  s = run(S.gwo({ fn, n: 20, iters: 100 }, R(16))); ok('GWO ' + fn, s.best.f < 2.5, 'f=' + s.best.f.toFixed(4));
}
console.log(out.join('\n'));
process.exit(out.some(l => l.startsWith('FAIL')) ? 1 : 0);
