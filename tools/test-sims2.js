// Headless sanity tests for docs/js/sims2.js  ->  node tools/test-sims2.js
const S = require('../docs/js/sims.js'); require('../docs/js/sims2.js');
const run = (st, max = 1e6) => { let n = 0; while (st.step() !== false && n++ < max); return st; };
const R = seed => S.mulberry32(seed);
const out = [];
const ok = (name, cond, info) => out.push((cond ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : ''));
const GM = 1.083; // global maximum of S.hcF on [0,10]

let s = run(S.ils({ delta: 0.3, patience: 25, kick: 2.5, iters: 800 }, R(1)));
ok('ILS finds global max', Math.abs(S.hcF(s.best) - GM) < 0.02, `best=${S.hcF(s.best).toFixed(3)} kicks=${s.kicks}`);
s = run(S.greatDeluge({ delta: 0.3, depth: 1.5, rain: 0.004, iters: 800 }, R(2)));
ok('Great Deluge', S.hcF(s.best) > 0.9, `best=${S.hcF(s.best).toFixed(3)}`);
s = run(S.thresholdAccepting({ delta: 0.3, t0: 1.0, decay: 0.99, iters: 800 }, R(3)));
ok('Threshold Accepting', S.hcF(s.best) > 0.9, `best=${S.hcF(s.best).toFixed(3)}`);

for (const fn of ['rastrigin', 'himmelblau', 'ackley']) {
  const lim = fn === 'rastrigin' ? 2.5 : 0.5;
  s = run(S.vns({ fn, r0: 0.04, kmax: 6, ls: 25, lsStep: 0.02, iters: 120 }, R(4))); ok('VNS ' + fn, s.best.f < lim, 'f=' + s.best.f.toFixed(4));
  s = run(S.firefly({ fn, n: 20, alpha: 0.3, beta0: 1, gamma: 2, iters: 80 }, R(5))); ok('Firefly ' + fn, s.best.f < lim + 1, 'f=' + s.best.f.toFixed(4));
  s = run(S.cuckoo({ fn, n: 20, pa: 0.25, alpha: 1, iters: 120 }, R(6))); ok('Cuckoo ' + fn, s.best.f < lim + 1, 'f=' + s.best.f.toFixed(4));
  s = run(S.bat({ fn, n: 20, fmax: 2, A0: 1, r0: 0.5, alpha: 0.9, gamma: 0.9, iters: 120 }, R(7))); ok('Bat ' + fn, s.best.f < lim + 1, 'f=' + s.best.f.toFixed(4));
  s = run(S.woa({ fn, n: 20, iters: 100 }, R(8))); ok('WOA ' + fn, s.best.f < lim + 1, 'f=' + s.best.f.toFixed(4));
  s = run(S.hho({ fn, n: 20, iters: 100 }, R(9))); ok('HHO ' + fn, s.best.f < lim + 1, 'f=' + s.best.f.toFixed(4));
  s = run(S.harmony({ fn, hms: 20, hmcr: 0.9, par: 0.3, bw: 0.02, iters: 3000 }, R(10))); ok('Harmony ' + fn, s.best.f < lim + 1, 'f=' + s.best.f.toFixed(4));
  s = run(S.tlbo({ fn, n: 20, iters: 60 }, R(11))); ok('TLBO ' + fn, s.best.f < lim, 'f=' + s.best.f.toFixed(4));
  s = run(S.memetic({ fn, n: 20, mut: 0.3, sigma: 0.1, ls: 10, lsStep: 0.02, iters: 40 }, R(12))); ok('Memetic ' + fn, s.best.f < lim, `f=${s.best.f.toFixed(4)} evals=${s.evals}`);
  s = run(S.crossEntropy({ fn, n: 60, rho: 0.2, smooth: 0.7, iters: 40 }, R(13))); ok('CE ' + fn, s.best.f < lim + 1, 'f=' + s.best.f.toFixed(4));
  s = run(S.cmaes({ fn, lambda: 12, sigma0: 0.3, iters: 80 }, R(14))); ok('CMA-ES ' + fn, s.best.f < lim, `f=${s.best.f.toFixed(5)} sigma=${s.sigma.toExponential(1)}`);
}
const cities = S.makeCities(14, R(15));
s = run(S.grasp({ cities, alpha: 0.2, iters: 30 }, R(16)));
ok('GRASP improves over construction', s.bestLen < s.builtLen * 1.001 && s.bestLen < 3800 /* 3790 is the optimum found by tabu, ACO and GRASP */, `best=${s.bestLen.toFixed(0)} lastBuilt=${s.builtLen.toFixed(0)}`);
s = run(S.pbil({ len: 24, n: 30, lr: 0.1, mutP: 0.02, mutShift: 0.05, maxGen: 200 }, R(17)));
ok('PBIL solves OneMax-like target', s.best.f === 24, `gens=${s.gen} best=${s.best.f}`);
console.log(out.join('\n'));
process.exit(out.some(l => l.startsWith('FAIL')) ? 1 : 0);
