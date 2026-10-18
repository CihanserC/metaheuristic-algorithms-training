/* Simulated Annealing pages (+ shared demo scaffold and tour drawing helper). */
(function () {
  'use strict';
  const { h, t, col } = MH;
  const S = window.Sims;

  /* Generic demo scaffold: canvas + player + controls + stats + explanation line. */
  MH.demo = function (root, o) {
    const cv = MH.canvas(o.w, o.h);
    const stats = h('div', { class: 'stats' }), explain = h('div', { class: 'explain' });
    const kit = { ctx: cv.ctx, w: o.w, h: o.h, seed: MH.newSeed(), cv };
    let player;
    const redraw = () => {
      cv.ctx.clearRect(0, 0, o.w, o.h);
      o.draw(cv.ctx, kit);
      stats.replaceChildren(...((o.stats && o.stats(kit)) || []).map(([k, v]) => h('span', null, t(k) + ': ', h('b', null, String(v)))));
      const ex = o.explain && o.explain(kit);
      explain.innerHTML = ex || ''; explain.style.display = ex ? '' : 'none';
      player.setStatus(o.isDone(kit) ? MH.ui('finished') : '');
    };
    player = MH.player({ step: () => o.step(kit), reset: () => o.init(kit), draw: redraw, isDone: () => o.isDone(kit), sps: o.sps, maxSps: o.maxSps, minSps: o.minSps });
    kit.redraw = redraw;
    kit.restart = () => { player.pause(); o.init(kit); redraw(); };
    kit.player = player;
    const ctrls = h('div', { class: 'controls' }, ...(o.controls ? o.controls(kit) : []),
      MH.button(MH.UI.newRun, () => { kit.seed = MH.newSeed(); kit.restart(); }));
    root.append(cv.el, player.el, ctrls, stats, explain);
    if (o.legend) root.append(o.legend);
    o.init(kit); redraw();
    return kit;
  };

  /* Draws a closed tour of cities (coords 0..1000) inside box. */
  MH.drawTour = function (ctx, cities, tour, box, opt = {}) {
    const pad = 16;
    const X = c => box.x + pad + c.x / 1000 * (box.w - 2 * pad), Y = c => box.y + pad + c.y / 1000 * (box.h - 2 * pad);
    ctx.save();
    ctx.fillStyle = col('--panel2'); ctx.fillRect(box.x, box.y, box.w, box.h);
    if (opt.title) { ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = col('--muted'); ctx.fillText(t(opt.title), box.x + 8, box.y + 15); }
    if (opt.pheromone) {
      const tau = opt.pheromone; let mx = 0;
      for (let i = 0; i < tau.length; i++) for (let j = i + 1; j < tau.length; j++) mx = Math.max(mx, tau[i][j]);
      ctx.strokeStyle = col('--violet');
      for (let i = 0; i < tau.length; i++) for (let j = i + 1; j < tau.length; j++) {
        const v = tau[i][j] / mx; if (v < 0.04) continue;
        ctx.globalAlpha = Math.min(1, v * 0.9); ctx.lineWidth = 0.5 + v * 4;
        ctx.beginPath(); ctx.moveTo(X(cities[i]), Y(cities[i])); ctx.lineTo(X(cities[j]), Y(cities[j])); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (tour) {
      ctx.strokeStyle = opt.color || col('--accent'); ctx.lineWidth = opt.width || 2; ctx.lineJoin = 'round';
      ctx.beginPath();
      tour.forEach((idx, i) => { const c = cities[idx]; i ? ctx.lineTo(X(c), Y(c)) : ctx.moveTo(X(c), Y(c)); });
      ctx.closePath(); ctx.stroke();
    }
    cities.forEach((c, i) => MH.dot(ctx, X(c), Y(c), 4.5, col('--text')));
    if (tour) MH.dot(ctx, X(cities[tour[0]]), Y(cities[tour[0]]), 6, col('--warm'), true);
    ctx.restore();
  };

  const pct = p => (p * 100).toFixed(p < 0.1 ? 1 : 0) + '%';

  /* ================= SA: function ================= */
  MH.algoPage({
    id: 'sa-function', group: 'g_sa', origin: 'repo',
    title: { tr: 'Tavlama Benzetimi · Fonksiyon', en: 'Simulated Annealing · Function' },
    nav: { tr: 'Fonksiyon maksimumu', en: 'Function maximum' },
    blurb: { tr: 'Sıcaklık düşerken tek bir noktanın fonksiyon üzerinde gezinmesi.', en: 'One point wandering over a function while the temperature drops.' },
    tagline: { tr: 'Isıyı yavaş yavaş düşürerek yerel tepelerden kaçan, tek çözümlü bir arama.', en: 'A single-solution search that escapes local peaks by cooling slowly.' },
    files: ['SimulatedAnnealingFunction.py'],
    intuition: {
      tr: ['Metal yavaş soğutulduğunda atomlar düşük enerjili düzgün bir yapıya oturur; hızlı soğutulursa kusurlu kalır. Tavlama Benzetimi bu fikri aramaya uygular.', 'Yüksek sıcaklıkta algoritma <b>kötüleşen</b> hamleleri bile sık sık kabul eder (keşif). Sıcaklık düştükçe giderek seçici olur ve yalnızca iyileşmeleri kabul eder (sömürü).'],
      en: ['When metal is cooled slowly, its atoms settle into a low-energy regular structure; cooled quickly, it stays defective. Simulated Annealing applies this idea to search.', 'At high temperature the algorithm accepts even <b>worse</b> moves often (exploration). As the temperature drops it becomes pickier and accepts mostly improvements (exploitation).']
    },
    steps: {
      tr: ['Rastgele bir başlangıç durumu ve yüksek bir sıcaklık <code>T</code> ile başla.', 'Yeni bir aday durum üret (bu kodda aralıktan rastgele bir <code>x</code>).', 'Daha iyiyse <b>her zaman</b> kabul et; daha kötüyse <code>e<sup>−Δ/T</sup></code> olasılığıyla kabul et.', 'Bulunan en iyi durumu hatırla.', 'Sıcaklığı küçült: <code>T ← T·(1 − soğuma_hızı)</code>. <code>T</code> alt sınırın altına inene kadar 2. adıma dön.'],
      en: ['Start from a random state and a high temperature <code>T</code>.', 'Generate a new candidate state (in this code: a random <code>x</code> from the interval).', 'If it is better, <b>always</b> accept; if it is worse, accept with probability <code>e<sup>−Δ/T</sup></code>.', 'Remember the best state found.', 'Cool down: <code>T ← T·(1 − cooling_rate)</code>. Repeat from step 2 until <code>T</code> falls below the minimum.']
    },
    demo(root) {
      const P = { cool: 0.02, tmax: 100, original: false }; let sim;
      MH.demo(root, {
        w: 760, h: 430, sps: 30, maxSps: 400,
        init(k) { sim = S.saFunc({ min: -2, max: 2, tmin: 1e-5, tmax: P.tmax, cool: P.cool, original: P.original }, MH.rngFor(k.seed)); },
        step: () => sim.step(), isDone: () => sim.done,
        draw(ctx) {
          const p = MH.fnPlot(ctx, sim.f, -2, 2, { x: 0, y: 0, w: 760, h: 270 });
          if (sim.iter > 0) {
            MH.dot(ctx, p.X(sim.cand), p.Y(sim.f(sim.cand)), 6, col(sim.accepted ? '--good' : '--bad'));
            ctx.strokeStyle = col(sim.accepted ? '--good' : '--bad'); ctx.setLineDash([4, 4]); ctx.beginPath();
            ctx.moveTo(p.X(sim.cand), p.Y(sim.f(sim.cand))); ctx.lineTo(p.X(sim.cand), 270); ctx.stroke(); ctx.setLineDash([]);
          }
          MH.dot(ctx, p.X(sim.best), p.Y(sim.f(sim.best)), 9, 'transparent', true);
          MH.dot(ctx, p.X(sim.x), p.Y(sim.f(sim.x)), 7, col('--accent'), true);
          ctx.fillStyle = col('--muted'); ctx.font = '12px system-ui, sans-serif'; ctx.fillText('T', 10, 24);
          ctx.fillStyle = col('--line'); ctx.fillRect(24, 14, 160, 10);
          ctx.fillStyle = col('--warm'); ctx.fillRect(24, 14, 160 * Math.max(0, sim.temp / P.tmax), 10);
          MH.chart(ctx, 0, 280, 760, 150, [{ data: sim.hist, color: col('--accent'), label: { tr: 'f(mevcut)', en: 'f(current)' } }, { data: sim.bestHist, color: col('--good'), label: { tr: 'en iyi', en: 'best' } }], { title: { tr: 'Uygunluk geçmişi', en: 'Fitness history' } });
        },
        stats: () => [[{ tr: 'Iterasyon', en: 'Iteration' }, sim.iter], ['T', MH.fmt(sim.temp, 2)], [{ tr: 'f(mevcut)', en: 'f(current)' }, MH.fmt(sim.f(sim.x))], [{ tr: 'f(en iyi)', en: 'f(best)' }, MH.fmt(sim.f(sim.best))], ['x*', MH.fmt(sim.best)]],
        explain() {
          if (!sim.iter) return t({ tr: 'Oynat veya Adım\'a basın. <b>Mavi</b> nokta mevcut durum, yeşil/kırmızı nokta aday (kabul/ret), halkalı nokta şimdiye kadarki en iyidir.', en: 'Press Play or Step. The <b>blue</b> dot is the current state, the green/red dot the candidate (accepted/rejected), the ringed dot the best so far.' });
          return t({ tr: `Aday x=${MH.fmt(sim.cand, 2)}; kabul olasılığı <b>${pct(sim.prob)}</b> → <b>${sim.accepted ? 'kabul edildi' : 'reddedildi'}</b>.`, en: `Candidate x=${MH.fmt(sim.cand, 2)}; acceptance probability <b>${pct(sim.prob)}</b> → <b>${sim.accepted ? 'accepted' : 'rejected'}</b>.` }) +
            (P.original ? ' ' + t({ tr: '(Eski kodda işaret hatası yüzünden olasılık hep ≥ %100 idi.)', en: '(In the old code the sign bug made the probability always ≥ 100%.)' }) : '');
        },
        controls: k => [
          MH.slider({ label: { tr: 'Soğuma hızı', en: 'Cooling rate' }, min: 0.005, max: 0.1, step: 0.005, value: P.cool, fmt: v => v.toFixed(3), onInput: v => { P.cool = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Başlangıç T', en: 'Start T' }, min: 1, max: 1000, step: 1, value: P.tmax, onInput: v => { P.tmax = v; k.restart(); } }),
          MH.toggle({ label: { tr: 'Eski (hatalı) davranış: işaret ters', en: 'Old (buggy) behaviour: reversed sign' }, value: P.original, onChange: v => { P.original = v; k.restart(); } })
        ],
        legend: MH.legend([['--accent', { tr: 'mevcut durum', en: 'current state' }], ['--good', { tr: 'kabul edilen aday', en: 'accepted candidate' }], ['--bad', { tr: 'reddedilen aday', en: 'rejected candidate' }]])
      });
    },
    anns: {
      'SimulatedAnnealingFunction.py': [
        { find: 'def f(x)', span: 2, text: { tr: 'Amaç fonksiyonu. Bu kodda <b>maksimum</b> aranıyor: aralıkta tepe yaklaşık x≈−1.29, f≈2.09.', en: 'The objective function. This code looks for the <b>maximum</b>: on the interval the peak is near x≈−1.29, f≈2.09.' } },
        { find: 'def __init__', span: 10, text: { tr: 'Arama aralığı, sıcaklık sınırları ve soğuma hızı. Büyük soğuma hızı = az sayıda durum denenir.', en: 'Search interval, temperature bounds and cooling rate. A large cooling rate means few states are tried.' } },
        { find: 'while temp > self.min_temp', span: 15, text: { tr: 'Ana döngü: sıcaklık <code>min_temp</code>\'in altına inene kadar sürer.', en: 'Main loop: runs until the temperature falls below <code>min_temp</code>.' } },
        { find: 'new_state = self.generate_random_x()', span: 1, text: { tr: 'Aday durum: aralıktan <b>tamamen rastgele</b> bir nokta (yerel komşu değil).', en: 'Candidate: a <b>completely random</b> point from the interval (not a local neighbour).' } },
        { find: 'if random() < self.accept_prob', span: 2, text: { tr: 'Metropolis kabul kuralı: olasılıkla yeni duruma geç.', en: 'Metropolis acceptance rule: move to the new state with that probability.' } },
        { find: 'temp = temp * (1-self.cooling_rate)', span: 1, text: { tr: 'Geometrik soğutma: her iterasyonda sıcaklık sabit bir oranda azalır.', en: 'Geometric cooling: the temperature shrinks by a constant ratio each iteration.' } },
        { find: 'def accept_prob', span: 6, text: { tr: 'Kabul olasılığı. Maksimizasyon için üs <code>next − actual</code> (negatif) olmalıdır; işaret hatası düzeltildi.', en: 'Acceptance probability. For maximisation the exponent must be <code>next − actual</code> (negative); the sign bug was fixed.' } }
      ]
    },
    notes: {
      tr: [`<b>İşaret hatası (bu kopyada düzeltildi):</b> repodaki ilk sürümde <code>accept_prob</code> minimizasyon için yazılmıştı (<code>actual − next</code>) ama <code>f</code> maksimize ediliyordu. Aday daha kötüyse <code>actual_energy − next_energy &gt; 0</code> olur ve <code>exp(pozitif) ≥ 1</code> çıkardı; yani kötü adaylar <b>her zaman</b> kabul edilirdi ve algoritma "rastgele arama + en iyiyi hatırla"ya dönüşürdü. Şimdi <code>exp((next_energy − actual_energy) / temp)</code> kullanılıyor. Animasyondaki kutucukla eski davranışı görebilirsiniz.`, `Aday her seferinde <b>tüm aralıktan</b> seçildiği için bu, klasik komşuluk tabanlı tavlamadan çok "global öneri" kullanan bir varyanttır.`, `<code>best_state</code> mevcut durum her iyileştiğinde güncellenir; bu yüzden döngü sonunda yazdırılan sonuç, sıcaklıktan bağımsız olarak şimdiye kadar görülen en iyi noktadır.`],
      en: [`<b>Sign bug (fixed in this copy):</b> in the first repository version <code>accept_prob</code> was written for minimisation (<code>actual − next</code>) while <code>f</code> is maximised. For a worse candidate <code>actual_energy − next_energy &gt; 0</code> and <code>exp(positive) ≥ 1</code>, so worse candidates were <b>always</b> accepted and the algorithm degenerated into "random search + remember the best". It now uses <code>exp((next_energy − actual_energy) / temp)</code>. Use the checkbox in the animation to see the old behaviour.`, `Because the candidate is drawn from the <b>whole interval</b> each time, this is a variant with global proposals rather than classic neighbourhood-based annealing.`, `<code>best_state</code> is updated whenever the current state improves, so the printed result is the best point seen so far regardless of temperature.`]
    },
    params: {
      tr: [['Soğuma hızı', 'Küçük = yavaş soğuma = daha çok deneme, daha güvenilir ama yavaş. Büyük = hızlı ama erken takılabilir.'], ['Başlangıç sıcaklığı', 'Fonksiyonun değer farklarına göre ölçeklenmeli. Çok düşükse baştan itibaren sömürü yapar; çok yüksekse zaman rastgele gezinerek boşa gider.'], ['Alt sıcaklık', 'Duruş kriteri. Çok yüksek tutulursa algoritma erken biter.']],
      en: [['Cooling rate', 'Small = slow cooling = more trials, more reliable but slower. Large = fast but may get stuck early.'], ['Start temperature', 'Should match the scale of the objective differences. Too low and it exploits from the start; too high and time is wasted wandering randomly.'], ['Minimum temperature', 'The stopping criterion. If it is too high the algorithm ends early.']]
    },
    pros: { tr: ['Uygulaması çok basit', 'Yalnızca uygunluk fonksiyonu gerekir', 'Yerel optimumdan kaçabilir', 'Tek çözüm tuttuğu için bellek dostu'], en: ['Very simple to implement', 'Only needs a fitness function', 'Can escape local optima', 'Memory friendly: it keeps a single solution'] },
    cons: { tr: ['Sıcaklık planı elle ayarlanır', 'Tek çözümle ilerlediği için paralelleştirmesi zor', 'Yavaş soğuma uzun sürer'], en: ['The cooling schedule must be tuned by hand', 'Hard to parallelise since it follows one solution', 'Slow cooling takes long'] }
  });

  /* ================= SA: TSP ================= */
  MH.algoPage({
    id: 'sa-tsp', group: 'g_sa', origin: 'repo',
    title: { tr: 'Tavlama Benzetimi · Gezgin Satıcı (TSP)', en: 'Simulated Annealing · Traveling Salesman (TSP)' },
    nav: { tr: 'Gezgin Satıcı (TSP)', en: 'Traveling Salesman (TSP)' },
    blurb: { tr: 'İki şehrin yerini değiştirerek en kısa turu arar.', en: 'Swaps two cities at a time to find the shortest tour.' },
    tagline: { tr: 'Her şehri bir kez gezip başlangıca dönen en kısa turu bulmaya çalışır.', en: 'Tries to find the shortest round trip that visits every city once.' },
    files: ['SimulatedAnnealingTSP.py'],
    intuition: {
      tr: ['TSP\'de çözüm bir <b>şehir sıralamasıdır</b>; enerji ise tur uzunluğudur. Komşu çözüm, iki şehrin yerini değiştirmekle elde edilir.', 'Yüksek sıcaklıkta tur uzunluğunu artıran değişimler de kabul edilir, bu sayede tur "çözülüp" yeniden şekillenebilir. Soğudukça tur giderek kararlı hale gelir.'],
      en: ['In TSP a solution is an <b>ordering of cities</b>; the energy is the tour length. A neighbouring solution is made by swapping two cities.', 'At high temperature even moves that lengthen the tour are accepted, so the tour can "melt" and re-form. As it cools the tour settles.']
    },
    steps: {
      tr: ['Şehirleri rastgele sırala (başlangıç turu).', 'İki rastgele şehri değiştirerek komşu tur üret.', 'Yeni tur kısaysa kabul et; uzunsa <code>e<sup>−Δ/T</sup></code> olasılığıyla kabul et (Δ = uzunluk artışı).', 'Şimdiye kadarki en kısa turu sakla.', 'Sıcaklığı <code>T ← T·(1 − hız)</code> ile düşür ve tekrarla.'],
      en: ['Shuffle the cities (initial tour).', 'Swap two random cities to build a neighbouring tour.', 'If the new tour is shorter accept it; otherwise accept with probability <code>e<sup>−Δ/T</sup></code> (Δ = length increase).', 'Keep the shortest tour seen so far.', 'Cool with <code>T ← T·(1 − rate)</code> and repeat.']
    },
    demo(root) {
      const P = { n: 12, cool: 0.01, texp: 5 }; let sim, cities;
      MH.demo(root, {
        w: 760, h: 420, sps: 60, maxSps: 1500,
        init(k) { cities = S.makeCities(P.n, MH.rngFor(k.seed)); sim = S.saTSP({ cities, tmin: 1e-5, tmax: Math.pow(10, P.texp), cool: P.cool }, MH.rngFor(k.seed + 1)); },
        step: () => sim.step(), isDone: () => sim.done,
        draw(ctx) {
          MH.drawTour(ctx, cities, sim.tour, { x: 0, y: 0, w: 400, h: 420 }, { title: { tr: 'Mevcut tur', en: 'Current tour' } });
          MH.drawTour(ctx, cities, sim.best, { x: 410, y: 0, w: 350, h: 200 }, { title: { tr: 'En iyi tur', en: 'Best tour' }, color: col('--good'), width: 2.5 });
          MH.chart(ctx, 410, 210, 350, 210, [{ data: sim.hist, color: col('--accent'), label: { tr: 'mevcut', en: 'current' } }, { data: sim.bestHist, color: col('--good'), label: { tr: 'en iyi', en: 'best' } }], { title: { tr: 'Tur uzunluğu', en: 'Tour length' } });
        },
        stats: () => [[{ tr: 'Iterasyon', en: 'Iteration' }, sim.iter], ['T', MH.fmt(sim.temp, 1)], [{ tr: 'Başlangıç', en: 'Initial' }, Math.round(sim.init)], [{ tr: 'Mevcut', en: 'Current' }, Math.round(sim.len)], [{ tr: 'En iyi', en: 'Best' }, Math.round(sim.bestLen)]],
        explain() {
          if (!sim.iter) return t({ tr: 'Turuncu şehir turun başlangıcıdır. Başlangıçtaki rastgele tur, <b>çapraz çizgilerle</b> doludur; en iyi turda çizgiler kesişmez.', en: 'The orange city is the tour start. The random initial tour is full of <b>crossing lines</b>; the best tour has none.' });
          return t({ tr: `Aday tur ${Math.round(sim.candLen)}, mevcut ${Math.round(sim.accepted ? sim.candLen : sim.len)}; kabul olasılığı <b>${pct(sim.prob)}</b> → ${sim.accepted ? 'kabul' : 'ret'}.`, en: `Candidate tour ${Math.round(sim.candLen)}, current ${Math.round(sim.accepted ? sim.candLen : sim.len)}; acceptance probability <b>${pct(sim.prob)}</b> → ${sim.accepted ? 'accepted' : 'rejected'}.` });
        },
        controls: k => [
          MH.slider({ label: { tr: 'Şehir sayısı', en: 'Cities' }, min: 5, max: 50, value: P.n, onInput: v => { P.n = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Soğuma hızı', en: 'Cooling rate' }, min: 0.001, max: 0.05, step: 0.001, value: P.cool, fmt: v => v.toFixed(3), onInput: v => { P.cool = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Başlangıç T', en: 'Start T' }, min: 2, max: 7, step: 0.5, value: P.texp, fmt: v => '10^' + v, onInput: v => { P.texp = v; k.restart(); } })
        ]
      });
    },
    anns: {
      'SimulatedAnnealingTSP.py': [
        { find: 'class City', span: 8, text: { tr: 'Şehir: 1000×1000 düzleminde rastgele (x, y) noktası.', en: 'A city: a random (x, y) point on a 1000×1000 plane.' } },
        { find: 'def get_distance', span: 9, text: { tr: 'Uygunluk (maliyet) fonksiyonu: kapalı turun toplam uzunluğu. <b>Ne kadar küçükse o kadar iyi.</b>', en: 'The fitness (cost) function: total length of the closed tour. <b>Smaller is better.</b>' } },
        { find: 'while temp > self.min_temp', span: 22, text: { tr: 'Ana döngü: komşu üret → kabul et/etme → en iyiyi güncelle → soğut.', en: 'Main loop: propose a neighbour → accept/reject → update the best → cool.' } },
        { find: 'def generate_random_state', span: 10, text: { tr: 'Komşuluk operatörü: <code>sample</code> ile seçilen iki <b>farklı</b> şehrin yeri değiştirilir (swap).', en: 'Neighbourhood operator: two <b>different</b> cities picked with <code>sample</code> are swapped.' } },
        { find: 'def accept_prob', span: 6, text: { tr: 'Minimizasyon için <b>doğru</b> işaret: kötüleşme (<code>next &gt; actual</code>) durumunda <code>exp(negatif)</code> &lt; 1 çıkar.', en: 'The <b>correct</b> sign for minimisation: when the tour gets longer (<code>next &gt; actual</code>), <code>exp(negative)</code> &lt; 1.' } },
        { find: 'temp *= 1 - self.cooling_rate', span: 1, text: { tr: 'Geometrik soğutma.', en: 'Geometric cooling.' } }
      ]
    },
    notes: {
      tr: [`Başlangıç sıcaklığı 100 000, koordinatlar ise 0–1000 aralığında; yani Δ değerleri sıcaklığa göre küçüktür ve ilk yüzlerce iterasyonda hemen her hamle kabul edilir (neredeyse saf rastgele yürüyüş). Gerçek iyileşme sıcaklık Δ mertebesine indiğinde başlar. Animasyondaki "Başlangıç T" kaydırıcısıyla bunu görebilirsiniz.`, `<b>Düzeltildi:</b> rastgele iki indeks aynı çıkabiliyordu (<code>i == j</code>) ve takas hiçbir şey yapmıyordu. Artık <code>sample()</code> ile iki <b>farklı</b> şehir seçilir.`, `<b>Düzeltildi:</b> <code>plot_solution</code> turun sonuna ilk şehri doğrudan <code>best_state.tour</code> üzerine ekliyordu; fonksiyonu iki kez çağırmak (ya da ardından <code>get_distance</code>) turu bozuyordu. Artık kapalı tur bir kopya üzerinde kurulur.`, `Repoda aynı konunun ikinci bir sürümü (<code>SimulatedAnnelaingTSP.py</code>) bulunuyor; bu sayfa daha tam olan sürümü gösterir.`],
      en: [`The start temperature is 100 000 while coordinates are in 0–1000, so Δ values are small compared with T and almost every move is accepted during the first hundreds of iterations (nearly a pure random walk). Real improvement begins when T drops to the order of Δ. Use the "Start T" slider in the animation to see this.`, `<b>Fixed:</b> the two random indices could be equal (<code>i == j</code>) and the swap then changed nothing. <code>sample()</code> now picks two <b>different</b> cities.`, `<b>Fixed:</b> <code>plot_solution</code> appended the first city directly to <code>best_state.tour</code>; calling it twice (or calling <code>get_distance</code> afterwards) corrupted the tour. The closed tour is now built on a copy.`, `The repository has a second version of the same topic (<code>SimulatedAnnelaingTSP.py</code>); this page shows the more complete one.`]
    },
    params: {
      tr: [['Şehir sayısı', 'Arama uzayı n! büyür; 50 şehirde bile tavlama makul turlar bulur ama optimumu garanti etmez.'], ['Soğuma hızı', 'Şehir sayısı arttıkça daha yavaş soğutmak (küçük hız) gerekir.'], ['Başlangıç T', 'Tur uzunluklarındaki tipik farkın birkaç katı iyi bir başlangıçtır.']],
      en: [['Number of cities', 'The search space grows as n!; even with 50 cities annealing finds reasonable tours but does not guarantee the optimum.'], ['Cooling rate', 'More cities need slower cooling (a smaller rate).'], ['Start T', 'A few times the typical difference between tour lengths is a good start.']]
    },
    pros: { tr: ['Çapraz çizgileri kendiliğinden temizler', 'Birkaç satırda yazılır', 'Büyük örneklerde makul sürede yeterince iyi tur verir'], en: ['Removes crossing lines by itself', 'Fits in a few lines', 'Gives good-enough tours in reasonable time on large instances'] },
    cons: { tr: ['Optimumu garanti etmez', 'Swap komşuluğu 2-opt kadar etkili değildir', 'Her adımda turu baştan hesaplamak O(n) sürer'], en: ['No optimality guarantee', 'Swap neighbourhood is less effective than 2-opt', 'Recomputing the tour from scratch each step costs O(n)'] }
  });

  /* ================= SA: Sudoku ================= */
  MH.algoPage({
    id: 'sa-sudoku', group: 'g_sa', origin: 'repo',
    title: { tr: 'Tavlama Benzetimi · Sudoku', en: 'Simulated Annealing · Sudoku' },
    nav: { tr: 'Sudoku', en: 'Sudoku' },
    blurb: { tr: 'Sudoku\'yu satır/sütun çakışmalarını azaltarak çözer.', en: 'Solves Sudoku by reducing row/column conflicts.' },
    tagline: { tr: 'Her 3×3 kutuyu geçerli doldurup çakışmaları hamle hamle yok eder.', en: 'Fills every 3×3 box validly, then removes conflicts move by move.' },
    files: ['SimulatedAnnealingSudoku.py'],
    intuition: {
      tr: ['Çözümü baştan kurmak yerine <b>kısıtlardan birini baştan sağlıyoruz</b>: her 3×3 kutu 1–9 rakamlarını tam bir kez içerir. Geriye satır ve sütunlardaki tekrarlar (çakışmalar) kalır.', 'Enerji = toplam çakışma sayısı; hedef 0. Hamle: aynı kutu içinde iki <b>boş</b> hücrenin yerini değiştirmek — kutu bütünlüğü korunur.'],
      en: ['Instead of building the solution from scratch, we <b>satisfy one constraint up front</b>: every 3×3 box contains 1–9 exactly once. What remains are repeats (conflicts) in rows and columns.', 'Energy = total number of conflicts; the goal is 0. A move swaps two <b>empty</b> cells inside the same box, so box validity is preserved.']
    },
    steps: {
      tr: ['Her kutudaki boş hücreleri, kutuda eksik olan rakamlarla rastgele doldur.', 'Maliyet = satırlardaki + sütunlardaki tekrar eden rakam sayısı.', 'Rastgele bir kutu seç, içinde iki boş hücrenin değerini değiştir.', 'Çakışma azalıyorsa kabul et; artıyorsa <code>e<sup>−Δ/T</sup></code> olasılığıyla kabul et.', 'Çakışma 0 olunca veya sıcaklık bitince dur.'],
      en: ['Fill the empty cells of every box with the digits that box is missing, at random.', 'Cost = number of repeated digits in rows + in columns.', 'Pick a random box and swap the values of two empty cells in it.', 'If conflicts drop accept; otherwise accept with probability <code>e<sup>−Δ/T</sup></code>.', 'Stop when conflicts reach 0 or the temperature runs out.']
    },
    demo(root) {
      const P = { cool: 0.999, texp: 4 }; let sim;
      MH.demo(root, {
        w: 760, h: 420, sps: 300, maxSps: 4000, minSps: 5,
        init(k) { sim = S.saSudoku({ tmin: 1e-2, tmax: Math.pow(10, P.texp), cool: P.cool }, MH.rngFor(k.seed)); },
        step: () => sim.step(), isDone: () => sim.done,
        draw(ctx) {
          const cs = 44, ox = 12, oy = 12;
          ctx.fillStyle = col('--panel2'); ctx.fillRect(0, 0, 420, 420);
          const g = sim.grid;
          for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
            let bad = false;
            for (let k = 0; k < 9; k++) { if ((k !== c && g[r][k] === g[r][c]) || (k !== r && g[k][c] === g[r][c])) bad = true; }
            ctx.fillStyle = bad ? 'rgba(220,60,60,.28)' : (((r / 3 | 0) + (c / 3 | 0)) % 2 ? 'rgba(120,130,160,.12)' : 'transparent');
            ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
          }
          if (sim.swap) for (const [r, c] of sim.swap) { ctx.strokeStyle = col(sim.accepted ? '--good' : '--warm'); ctx.lineWidth = 3; ctx.strokeRect(ox + c * cs + 2, oy + r * cs + 2, cs - 4, cs - 4); }
          ctx.strokeStyle = col('--line'); ctx.lineWidth = 1;
          for (let i = 0; i <= 9; i++) {
            ctx.lineWidth = i % 3 === 0 ? 2.5 : 1; ctx.strokeStyle = i % 3 === 0 ? col('--text') : col('--line');
            ctx.beginPath(); ctx.moveTo(ox + i * cs, oy); ctx.lineTo(ox + i * cs, oy + 9 * cs); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ox, oy + i * cs); ctx.lineTo(ox + 9 * cs, oy + i * cs); ctx.stroke();
          }
          ctx.font = '22px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
            ctx.font = (sim.fixed[r][c] ? '700 ' : '400 ') + '22px system-ui, sans-serif';
            ctx.fillStyle = sim.fixed[r][c] ? col('--text') : col('--accent');
            ctx.fillText(g[r][c], ox + c * cs + cs / 2, oy + r * cs + cs / 2 + 1);
          }
          ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
          MH.chart(ctx, 430, 10, 330, 400, [{ data: sim.hist, color: col('--accent'), label: { tr: 'mevcut çakışma', en: 'current conflicts' } }, { data: sim.bestHist, color: col('--good'), label: { tr: 'en iyi', en: 'best' } }], { title: { tr: 'Çakışma sayısı (ceza)', en: 'Conflict count (penalty)' }, minY: 0 });
        },
        stats: () => [[{ tr: 'Iterasyon', en: 'Iteration' }, sim.iter], ['T', MH.fmt(sim.temp, 2)], [{ tr: 'Çakışma', en: 'Conflicts' }, sim.fit], [{ tr: 'En iyi', en: 'Best' }, sim.bestFit]],
        explain() {
          if (sim.bestFit === 0 && sim.done) return t({ tr: '🎉 Çakışma 0: Sudoku çözüldü.', en: '🎉 Zero conflicts: the Sudoku is solved.' });
          if (sim.done) return t({ tr: 'Sıcaklık bitti ama çakışma kaldı. Soğuma hızını yükseltin (yavaş soğutun) veya yeni bir deneme başlatın: tavlama garanti vermez.', en: 'The temperature ran out with conflicts left. Raise the cooling factor (cool slower) or start a new run: annealing gives no guarantee.' });
          return t({ tr: '<b>Kalın</b> rakamlar verilenlerdir, <b>mavi</b> rakamlar algoritmanın doldurduklarıdır. Kırmızı hücreler satır/sütunda tekrar edenlerdir; çerçeveli iki hücre son denenen takas.', en: '<b>Bold</b> digits are the givens, <b>blue</b> digits were filled by the algorithm. Red cells repeat in their row/column; the two framed cells are the last swap tried.' });
        },
        controls: k => [
          MH.slider({ label: { tr: 'Soğuma çarpanı', en: 'Cooling factor' }, min: 0.99, max: 0.9995, step: 0.0005, value: P.cool, fmt: v => v.toFixed(4), onInput: v => { P.cool = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Başlangıç T', en: 'Start T' }, min: 0, max: 6, step: 0.5, value: P.texp, fmt: v => '10^' + v, onInput: v => { P.texp = v; k.restart(); } })
        ]
      });
    },
    anns: {
      'SimulatedAnnealingSudoku.py': [
        { find: 'def generate_solution', span: 22, text: { tr: 'Başlangıç: her kutudaki boş hücreleri o kutuda eksik olan rakamlarla doldurur; kutu kısıtı baştan sağlanmış olur.', en: 'Initialisation: fills each box\'s empty cells with the digits the box is missing, so the box constraint holds from the start.' } },
        { find: 'def mutate', span: 18, text: { tr: 'Komşuluk: rastgele bir kutuda iki <b>boş</b> hücrenin değerini değiştirir; verilen rakamlar (<code>fixed</code>) asla taşınmaz.', en: 'Neighbourhood: swaps two <b>empty</b> cells in a random box; the given digits (<code>fixed</code>) are never moved.' } },
        { find: 'def fitness', span: 17, text: { tr: 'Ceza = satırlardaki + sütunlardaki tekrarlar (<code>uzunluk − küme boyutu</code>). Kutular zaten geçerli olduğu için kontrol edilmez.', en: 'Penalty = repeats in rows + in columns (<code>length − set size</code>). Boxes are valid by construction so they are not checked.' } },
        { find: 'while temp > self.min_temp and', span: 17, text: { tr: 'Çakışma 0 olunca veya sıcaklık bitince durur.', en: 'Stops when the conflicts reach 0 or the temperature runs out.' } },
        { find: 'def generate_next_state', span: 4, text: { tr: 'Mevcut durumun kopyasında tek bir hamle yapar.', en: 'Makes a single move on a copy of the current state.' } },
        { find: 'def accept_prob', span: 6, text: { tr: 'Minimizasyon için doğru Metropolis kuralı.', en: 'The correct Metropolis rule for minimisation.' } }
      ]
    },
    notes: {
      tr: [`<b>Sabit hücreler (düzeltildi):</b> ilk sürümde <code>mutate</code>, <code>original_table</code>'da <code>!= 0</code> olan hücreleri seçiyordu. Yeni durumlar <code>SingleSolution(actual_state.table)</code> ile üretildiği için <code>original_table</code> <b>doldurulmuş</b> tablonun kopyası oluyor, her hücre "orijinal" sayılıyor ve verilen rakamlar da yer değiştirebiliyordu. Şimdi hangi hücrelerin verilen rakam olduğu ayrı bir <code>fixed</code> matrisinde tutulur ve yalnızca <b>boş</b> hücreler takas edilir.`, `<b>Düzeltildi:</b> kutuda iki boş hücre yoksa <code>sample(indexes, 2)</code> hata veriyordu; artık en az iki boş hücresi olan bir kutu aranır.`, `Soğuma çarpanı 0.999 ve sıcaklık 10⁴ → 10⁻² olduğundan yaklaşık 13 800 iterasyon çalışır; bu sürede çakışma 0'a inmeyebilir.`, `<code>fitness()</code> her çağrıda 81 hücreyi tarar ve döngüde birkaç kez çağrılır; küçük bir önbellek hızı artırır.`],
      en: [`<b>Fixed cells (fixed):</b> in the first version <code>mutate</code> picked cells where <code>original_table != 0</code>. New states are built with <code>SingleSolution(actual_state.table)</code>, so <code>original_table</code> became a copy of the <b>already filled</b> grid — every cell counted as "original" and given digits could be swapped too. Which cells are givens is now kept in a separate <code>fixed</code> matrix and only <b>empty</b> cells are swapped.`, `<b>Fixed:</b> if a box had fewer than two empty cells <code>sample(indexes, 2)</code> raised an error; a box with at least two empty cells is now searched for.`, `With cooling factor 0.999 and temperature 10⁴ → 10⁻² it runs about 13 800 iterations; the conflicts may not reach 0 in that time.`, `<code>fitness()</code> scans 81 cells and is called several times per loop; a small cache would speed it up.`]
    },
    params: {
      tr: [['Soğuma çarpanı', '0.999 → çok yavaş soğur. 0.99\'a yaklaştıkça çok az iterasyon yapılır ve takılma olasılığı artar.'], ['Başlangıç T', 'Ceza farkları 1–2 mertebesinde; T=10⁴ başta her hamleyi kabul eder. T küçük seçilirse algoritma hızlı ama yerel optimumda takılır.']],
      en: [['Cooling factor', '0.999 cools very slowly. Closer to 0.99 means few iterations and a higher chance of getting stuck.'], ['Start T', 'Penalty differences are of order 1–2; T=10⁴ accepts every move at first. A small T is fast but stalls in a local optimum.']]
    },
    pros: { tr: ['Kısıtın bir kısmını yapı gereği sağlar (kutular)', 'Çakışma sayısı doğal bir uygunluk ölçüsüdür', 'Genel amaçlı; Sudoku kuralları dışında bilgi gerekmez'], en: ['Satisfies part of the constraints by construction (boxes)', 'Conflict count is a natural fitness measure', 'General purpose; no Sudoku-specific reasoning needed'] },
    cons: { tr: ['Kesin çözüm garantisi yok', 'Takılabilir; birkaç yeniden başlatma gerekebilir', 'Sistematik çözücülerden (backtracking) yavaştır'], en: ['No guarantee of a perfect solution', 'May stall; a few restarts may be needed', 'Slower than systematic solvers (backtracking)'] }
  });
})();
