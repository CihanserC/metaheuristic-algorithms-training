/* Particle Swarm Optimization page + 2-D landscape helpers used by DE / ABC / GWO. */
(function () {
  'use strict';
  const { h, t, col } = MH;
  const S = window.Sims;

  /* ---------- 2-D landscape heat map (cached per function / theme) ---------- */
  const cache = {};
  MH.landscape = function (ctx, fnName, box) {
    const fn = S.FUNCS[fnName], key = fnName + MH.theme;
    if (!cache[key]) {
      const N = 150, c = document.createElement('canvas'); c.width = c.height = N;
      const g = c.getContext('2d'), img = g.createImageData(N, N);
      let lo = Infinity, hi = -Infinity; const vals = [];
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const v = fn.f(fn.min + (fn.max - fn.min) * i / (N - 1), fn.max - (fn.max - fn.min) * j / (N - 1));
        vals.push(v); lo = Math.min(lo, v); hi = Math.max(hi, v);
      }
      const dark = MH.theme === 'dark';
      vals.forEach((v, k) => {
        const u = Math.pow((v - lo) / (hi - lo), 0.5);          // sqrt for more contrast near the minimum
        const r = dark ? 20 + 120 * u : 255 - 150 * u, gr = dark ? 30 + 130 * u : 255 - 120 * u, b = dark ? 70 + 150 * (1 - u * 0.4) : 255 - 60 * u;
        img.data[k * 4] = r; img.data[k * 4 + 1] = gr; img.data[k * 4 + 2] = b; img.data[k * 4 + 3] = 255;
      });
      g.putImageData(img, 0, 0); cache[key] = c;
    }
    ctx.imageSmoothingEnabled = true; ctx.drawImage(cache[key], box.x, box.y, box.w, box.h);
    ctx.strokeStyle = col('--line'); ctx.strokeRect(box.x + .5, box.y + .5, box.w - 1, box.h - 1);
    return { X: x => box.x + (x - fn.min) / (fn.max - fn.min) * box.w, Y: y => box.y + (1 - (y - fn.min) / (fn.max - fn.min)) * box.h };
  };

  /* Shared 2-D demo for DE / ABC / GWO. o.P params, o.make, o.points(sim)->[{x,y,c,r,ring}], o.extra(ctx,sim,m) */
  MH.demo2D = function (root, o) {
    const P = o.P; let sim;
    const fnSel = (k) => MH.select({
      label: { tr: 'Fonksiyon', en: 'Function' }, value: P.fn,
      options: [{ v: 'rastrigin', label: { tr: 'Rastrigin (çok yerel minimum)', en: 'Rastrigin (many local minima)' } }, { v: 'himmelblau', label: { tr: 'Himmelblau (4 eşit minimum)', en: 'Himmelblau (4 equal minima)' } }, { v: 'ackley', label: { tr: 'Ackley (düz yüzey + çukur)', en: 'Ackley (flat surface + pit)' } }],
      onChange: v => { P.fn = v; k.restart(); }
    });
    return MH.demo(root, {
      w: 760, h: 430, sps: o.sps || 4, maxSps: 60, minSps: 1,
      init(k) { sim = o.make(P, k.seed); },
      step: () => sim.step(), isDone: () => sim.done,
      draw(ctx) {
        const m = MH.landscape(ctx, P.fn, { x: 0, y: 0, w: 420, h: 420 });
        if (o.extra) o.extra(ctx, sim, m);
        for (const p of o.points(sim)) {
          MH.dot(ctx, m.X(p.x), m.Y(p.y), p.r || 4.5, p.c, p.ring !== false);
        }
        const b = sim.best;
        ctx.strokeStyle = col('--good'); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(m.X(b.x[0]), m.Y(b.x[1]), 9, 0, 7); ctx.stroke();
        MH.chart(ctx, 430, 10, 330, 410, [{ data: sim.hist, color: col('--good'), label: { tr: 'en iyi f(x)', en: 'best f(x)' }, width: 2 }], { title: { tr: 'En iyi değer / iterasyon (küçük = iyi)', en: 'Best value / iteration (smaller = better)' }, minY: 0 });
      },
      stats: () => [[{ tr: 'Iterasyon', en: 'Iteration' }, sim.iter], [{ tr: 'En iyi f', en: 'Best f' }, MH.fmt(sim.best.f, 4)], ['x*', `(${MH.fmt(sim.best.x[0], 2)}, ${MH.fmt(sim.best.x[1], 2)})`], ...(o.stats ? o.stats(sim) : [])],
      explain: () => (sim.done ? t({ tr: `Tamamlandı: en iyi f = <b>${MH.fmt(sim.best.f, 5)}</b>.`, en: `Finished: best f = <b>${MH.fmt(sim.best.f, 5)}</b>.` }) : o.explain(sim)),
      controls: k => [fnSel(k), ...o.controls(k, P)],
      legend: o.legend
    });
  };

  /* ================= PSO ================= */
  MH.algoPage({
    id: 'pso', group: 'g_pso', origin: 'repo',
    title: { tr: 'Parçacık Sürü Optimizasyonu (PSO)', en: 'Particle Swarm Optimization (PSO)' },
    nav: { tr: 'Parçacık Sürüsü (PSO)', en: 'Particle Swarm (PSO)' },
    blurb: { tr: 'Parçacıklar kendi ve sürünün en iyisine doğru uçarak minimum arar.', en: 'Particles fly towards their own and the swarm\'s best to find the minimum.' },
    tagline: { tr: 'Kuş sürüsü gibi: her parçacık hem kendi deneyimini hem sürünün bilgisini kullanır.', en: 'Like a flock of birds: every particle uses its own experience and the swarm\'s knowledge.' },
    files: ['ParticleSwarmOptimizationFunction.py'],
    intuition: {
      tr: ['Bir sürü yiyecek arayan kuşlar düşünün. Her kuş (parçacık) bir konum ve hıza sahiptir; şimdiye kadar <b>kendi</b> bulduğu en iyi yeri ve <b>sürünün</b> bulduğu en iyi yeri hatırlar.', 'Hızı üç etki belirler: <b>atalet</b> (eski yönünde devam), <b>bilişsel çekim</b> (kendi en iyisine) ve <b>sosyal çekim</b> (sürünün en iyisine). Bu karışım hem keşfi hem sömürüyü sağlar.'],
      en: ['Think of birds looking for food. Each bird (particle) has a position and a velocity; it remembers the best place <b>it</b> has found and the best place the <b>swarm</b> has found.', 'Three influences set the velocity: <b>inertia</b> (keep the old direction), the <b>cognitive pull</b> (towards its own best) and the <b>social pull</b> (towards the swarm best). Together they balance exploration and exploitation.']
    },
    steps: {
      tr: ['Parçacıkları aralıkta rastgele konum ve hızlarla başlat.', 'Hızı güncelle: <code>v ← w·v + c1·r1·(kendi_en_iyi − x) + c2·r2·(sürü_en_iyi − x)</code>.', 'Konumu güncelle: <code>x ← x + v</code> (sınırlarda kırp).', 'Yeni konumların uygunluğunu hesapla; sürünün ve parçacıkların en iyilerini güncelle.', 'İterasyon sayısı bitene kadar tekrarla.'],
      en: ['Start the particles at random positions and velocities within the interval.', 'Update the velocity: <code>v ← w·v + c1·r1·(own_best − x) + c2·r2·(swarm_best − x)</code>.', 'Update the position: <code>x ← x + v</code> (clamped at the bounds).', 'Evaluate the new positions; update the swarm best and each particle\'s best.', 'Repeat until the iteration count is reached.']
    },
    demo(root) {
      const P = { n: 20, iters: 30, w: 0.7, c1: 1.4, c2: 1.2 }; let sim;
      MH.demo(root, {
        w: 760, h: 440, sps: 3, maxSps: 40, minSps: 1,
        init(k) { sim = S.pso({ min: -4, max: 2, ...P }, MH.rngFor(k.seed)); },
        step: () => sim.step(), isDone: () => sim.done,
        draw(ctx) {
          const p = MH.fnPlot(ctx, sim.f, -4, 2, { x: 0, y: 0, w: 760, h: 280 });
          for (const q of sim.parts) {
            const px = p.X(q.x), py = p.Y(sim.f(q.x));
            const len = Math.max(-60, Math.min(60, q.v * 28));
            ctx.strokeStyle = col('--warm'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, py - 10); ctx.lineTo(px + len, py - 10); ctx.stroke();
            if (Math.abs(len) > 6) { ctx.fillStyle = col('--warm'); ctx.beginPath(); const s = Math.sign(len); ctx.moveTo(px + len, py - 10); ctx.lineTo(px + len - 5 * s, py - 14); ctx.lineTo(px + len - 5 * s, py - 6); ctx.fill(); }
            if (q.bv < 1e9) { ctx.fillStyle = col('--violet'); ctx.fillRect(p.X(q.bx) - 2.5, p.Y(q.bv) - 2.5, 5, 5); }
            MH.dot(ctx, px, py, 5, col('--accent'), true);
          }
          if (sim.gbv < 1e9) {
            ctx.strokeStyle = col('--good'); ctx.lineWidth = 3; ctx.beginPath();
            ctx.arc(p.X(sim.gbx), p.Y(sim.gbv), 10, 0, 7); ctx.stroke();
          }
          MH.chart(ctx, 0, 290, 760, 150, [{ data: sim.hist, color: col('--good'), label: { tr: 'sürü en iyi f', en: 'swarm best f' }, width: 2 }], { title: { tr: 'Sürünün en iyi değeri (küçük = iyi)', en: 'Swarm best value (smaller = better)' } });
        },
        stats: () => [[{ tr: 'Iterasyon', en: 'Iteration' }, `${sim.iter}/${P.iters}`], [{ tr: 'En iyi x', en: 'Best x' }, sim.gbv < 1e9 ? MH.fmt(sim.gbx) : '–'], [{ tr: 'En iyi f', en: 'Best f' }, sim.gbv < 1e9 ? MH.fmt(sim.gbv) : '–']],
        explain: () => (sim.iter ? (sim.done ? t({ tr: `Sürü x≈<b>${MH.fmt(sim.gbx, 3)}</b> noktasında f≈<b>${MH.fmt(sim.gbv, 3)}</b> değerine yakınsadı (gerçek minimum x≈−2.50, f≈−1.35).`, en: `The swarm converged to x≈<b>${MH.fmt(sim.gbx, 3)}</b> with f≈<b>${MH.fmt(sim.gbv, 3)}</b> (true minimum x≈−2.50, f≈−1.35).` }) : t({ tr: 'Turuncu çizgi hız, mor kare parçacığın kendi en iyisi, yeşil halka sürünün en iyisi. Hız büyükse parçacık sınırlara çarpıp kırpılır.', en: 'The orange line is the velocity, the purple square is the particle\'s own best, the green ring the swarm best. A large velocity makes a particle hit the bound and get clamped.' })) : t({ tr: 'Kod <b>minimum</b> arar. Oynat\'a basın: parçacıklar önce dağınık, sonra tek bir çukura toplanır.', en: 'The code looks for the <b>minimum</b>. Press Play: the particles start scattered and gather in one valley.' })),
        controls: k => [
          MH.slider({ label: { tr: 'Parçacık', en: 'Particles' }, min: 3, max: 100, value: P.n, onInput: v => { P.n = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Iterasyon', en: 'Iterations' }, min: 10, max: 200, step: 10, value: P.iters, onInput: v => { P.iters = v; k.restart(); } }),
          MH.slider({ label: { tr: 'w (atalet)', en: 'w (inertia)' }, min: 0, max: 1.2, step: 0.05, value: P.w, fmt: v => v.toFixed(2), onInput: v => { P.w = v; k.restart(); } }),
          MH.slider({ label: { tr: 'c1 (bilişsel)', en: 'c1 (cognitive)' }, min: 0, max: 3, step: 0.1, value: P.c1, fmt: v => v.toFixed(1), onInput: v => { P.c1 = v; k.restart(); } }),
          MH.slider({ label: { tr: 'c2 (sosyal)', en: 'c2 (social)' }, min: 0, max: 3, step: 0.1, value: P.c2, fmt: v => v.toFixed(1), onInput: v => { P.c2 = v; k.restart(); } })
        ],
        legend: MH.legend([['--accent', { tr: 'parçacık', en: 'particle' }], ['--warm', { tr: 'hız', en: 'velocity' }], ['--violet', { tr: 'parçacığın en iyisi', en: 'particle best' }], ['--good', { tr: 'sürünün en iyisi', en: 'swarm best' }]])
      });
    },
    anns: {
      'ParticleSwarmOptimizationFunction.py': [
        { find: 'def f(x)', span: 2, text: { tr: 'Amaç: <code>(x+1)²·sin(x)</code>. Bu kod <b>minimum</b> arar (küçük = iyi).', en: 'Objective: <code>(x+1)²·sin(x)</code>. This code looks for the <b>minimum</b> (smaller is better).' } },
        { find: 'class Particle', span: 17, text: { tr: 'Parçacık: konum, hız, kendi en iyi konumu ve değeri. Boyut ayarlanabilir (1B, 2B, … NB).', en: 'A particle: position, velocity, own best position and value. The dimension is configurable (1-D, 2-D, … N-D).' } },
        { find: 'def move(self)', span: 7, text: { tr: 'Konumu hızla ilerletir ve aralığın dışına çıkanları sınıra kırpar.', en: 'Advances the position by the velocity and clamps anything outside the interval to the bound.' } },
        { find: '# c1=0 it means', span: 8, text: { tr: '<b>c1=0</b> → bireysel hafıza yok → yüzde yüz sömürü. <b>c2=0</b> → parçacıklar bağımsız → yüzde yüz keşif.', en: '<b>c1=0</b> → no individual memory → 100% exploitation. <b>c2=0</b> → independent particles → 100% exploration.' } },
        { find: 'def __init__(self, min_x, max_x, n_particles', span: 14, text: { tr: 'Parametreler: <code>w</code> atalet, <code>c1</code> bilişsel, <code>c2</code> sosyal ağırlık.', en: 'Parameters: <code>w</code> inertia, <code>c1</code> cognitive, <code>c2</code> social weight.' } },
        { find: 'def run(self)', span: 10, text: { tr: 'Ana döngü: hareket ettir → sürü en iyisini güncelle → parçacık en iyilerini güncelle.', en: 'Main loop: move → update the swarm best → update each particle\'s best.' } },
        { find: 'def set_particle_best', span: 6, text: { tr: 'Her parçacığın kendi en iyisi (bireysel hafıza).', en: 'Each particle\'s own best (individual memory).' } },
        { find: 'def set_best', span: 7, text: { tr: 'Sürünün en iyisi (sosyal bilgi).', en: 'The swarm best (social information).' } },
        { find: 'def move_particles', span: 8, text: { tr: 'Hız güncelleme formülü: atalet + bireysel çekim + sosyal çekim (her biri rastgele bir katsayıyla).', en: 'The velocity update: inertia + individual pull + social pull (each with a random factor).' } }
      ]
    },
    notes: {
      tr: ['<b>Başlangıç hızı</b> konum gibi <code>[min_x, max_x]</code> aralığından çekilir; yani ilk adımda parçacıklar aralığın genişliği kadar sıçrayıp sınıra yapışabilir. Genellikle başlangıç hızı aralığın küçük bir kesri olur.', 'Sürünün başlangıç "en iyi" konumu <code>particles[0].position</code>\'dır (değeri 1e10 olarak işaretlenmiş) — ilk iterasyonda gerçek bir değerle hemen değiştirilir, ancak ilk hız güncellemesi bu keyfi konuma doğru çeker.', 'Hızda <b>sınır yok</b>; yalnızca konum kırpılır. Duvara çarpan parçacık hızını korur ve sınırda "yapışık" kalabilir. Hız kırpma (<code>v_max</code>) yaygın bir iyileştirmedir.', 'Sonuç değeri (<code>best_value</code>) minimum olduğu için 1e10 gibi büyük bir sayıyla başlatılır; maksimizasyonda işaret ters çevrilmelidir.'],
      en: ['The <b>initial velocity</b> is drawn from <code>[min_x, max_x]</code> like the position, so in the first step particles may jump across the whole interval and stick to a bound. Usually the initial velocity is a small fraction of the range.', 'The swarm\'s initial "best" position is <code>particles[0].position</code> (its value marked as 1e10) — replaced by a real value in the first iteration, but the very first velocity update is pulled towards this arbitrary point.', 'There is <b>no velocity limit</b>; only the position is clamped. A particle hitting the wall keeps its speed and may stay glued to the bound. Velocity clamping (<code>v_max</code>) is a common improvement.', 'The best value is a minimum, hence it starts at a large number such as 1e10; for maximisation the sign must be flipped.']
    },
    params: {
      tr: [['w (atalet)', 'Yüksek = daha çok keşif ve savrulma; düşük = hızlı yavaşlama ve sömürü. Zamanla azaltmak yaygındır.'], ['c1 (bilişsel)', 'Parçacığın kendi geçmişine güveni. 0 ise sürü tek noktaya çöker (yüzde yüz sömürü).'], ['c2 (sosyal)', 'Sürünün ortak bilgisine güven. 0 ise parçacıklar birbirinden bağımsız (yüzde yüz keşif).'], ['Parçacık sayısı', 'Çok parçacık = daha iyi keşif, iterasyon başına daha pahalı.']],
      en: [['w (inertia)', 'High = more exploration and overshooting; low = quick slowing and exploitation. Decreasing it over time is common.'], ['c1 (cognitive)', 'Trust in the particle\'s own history. At 0 the swarm collapses to one point (100% exploitation).'], ['c2 (social)', 'Trust in the swarm\'s shared knowledge. At 0 the particles are independent (100% exploration).'], ['Number of particles', 'More particles = better exploration, more expensive per iteration.']]
    },
    pros: { tr: ['Çok az parametre; uygulaması kolay', 'Sürekli problemlerde hızlı yakınsar', 'Türev gerekmez', 'Boyut sayısından bağımsız aynı kod'], en: ['Few parameters; easy to implement', 'Converges fast on continuous problems', 'No derivatives needed', 'The same code for any dimension'] },
    cons: { tr: ['Çok yerel minimumlu yüzeylerde erken yakınsayabilir', 'Doğrudan ayrık problemlere uymaz', 'Parametrelere duyarlıdır'], en: ['May converge prematurely on landscapes with many local minima', 'Does not directly fit discrete problems', 'Sensitive to its parameters'] }
  });
})();
