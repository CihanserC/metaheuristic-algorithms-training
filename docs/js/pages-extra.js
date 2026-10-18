/* Added algorithms (not in the original repository): Hill Climbing, Tabu Search, Ant Colony,
   Differential Evolution, Artificial Bee Colony, Grey Wolf Optimizer. */
(function () {
  'use strict';
  const { h, t, col } = MH;
  const S = window.Sims;
  const pct = p => (p * 100).toFixed(p < 0.1 ? 1 : 0) + '%';

  /* ================= Hill Climbing ================= */
  MH.algoPage({
    id: 'hill-climbing', group: 'g_local', origin: 'added',
    title: { tr: 'Hill Climbing (Tepe Tırmanma)', en: 'Hill Climbing' },
    nav: { tr: 'Hill Climbing', en: 'Hill Climbing' },
    blurb: { tr: 'Yalnızca iyileşen komşuya gider; yerel tepede takılır, yeniden başlatma kurtarır.', en: 'Only moves to a better neighbour; stalls on a local peak, restarts rescue it.' },
    tagline: { tr: 'En basit yerel arama: tavlama ve tabu aramanın başlangıç noktası.', en: 'The simplest local search: the starting point for annealing and tabu search.' },
    files: ['HillClimbing.py'],
    intuition: {
      tr: ['Sisli bir dağda tırmandığınızı düşünün: sadece ayağınızın altındaki eğimi görürsünüz ve hep yukarı adım atarsınız. Bir tepeye varınca duruyorsunuz — ama bu <b>en yüksek</b> tepe olmayabilir.', 'Bu yüzden Hill Climbing hızlıdır ama <b>yerel optimumda takılır</b>. En basit çare: takılınca rastgele yeni bir noktadan başlamak (random restart). Tavlama Benzetimi ve Tabu Arama bu zayıflığı daha akıllıca giderir.'],
      en: ['Imagine climbing a foggy mountain: you only see the slope under your feet and always step uphill. When you reach a peak you stop — but it may not be the <b>highest</b> peak.', 'So Hill Climbing is fast but <b>gets stuck in local optima</b>. The simplest cure is to restart from a random point when stuck (random restart). Simulated Annealing and Tabu Search fix the weakness more cleverly.']
    },
    steps: {
      tr: ['Rastgele bir başlangıç noktası seç.', 'Küçük bir adımla rastgele bir komşu üret.', 'Komşu <b>daha iyiyse</b> oraya git; değilse kal (kötüleşmeyi asla kabul etme).', '(İsteğe bağlı) <code>patience</code> adım boyunca iyileşme yoksa rastgele yeni bir noktadan yeniden başla.', 'Şimdiye kadarki en iyiyi sakla ve tekrarla.'],
      en: ['Pick a random starting point.', 'Generate a random neighbour with a small step.', 'If the neighbour is <b>better</b>, move there; otherwise stay (never accept a worse state).', '(Optional) if there is no improvement for <code>patience</code> steps, restart from a new random point.', 'Keep the best seen so far and repeat.']
    },
    demo(root) {
      const P = { delta: 0.3, restart: false, patience: 25 }; let sim;
      MH.demo(root, {
        w: 760, h: 420, sps: 25, maxSps: 300,
        init(k) { sim = S.hillClimb({ min: 0, max: 10, delta: P.delta, restart: P.restart, patience: P.patience, iters: 600 }, MH.rngFor(k.seed)); },
        step: () => sim.step(), isDone: () => sim.done,
        draw(ctx) {
          const p = MH.fnPlot(ctx, sim.f, 0, 10, { x: 0, y: 0, w: 760, h: 270 });
          if (sim.iter) MH.dot(ctx, p.X(sim.cand), p.Y(sim.f(sim.cand)), 5, col(sim.moved ? '--good' : '--bad'));
          MH.dot(ctx, p.X(sim.best), p.Y(sim.f(sim.best)), 10, 'transparent', true);
          MH.dot(ctx, p.X(sim.x), p.Y(sim.f(sim.x)), 7, col('--accent'), true);
          MH.chart(ctx, 0, 280, 760, 140, [{ data: sim.hist, color: col('--accent'), label: { tr: 'f(mevcut)', en: 'f(current)' } }, { data: sim.bestHist, color: col('--good'), label: { tr: 'en iyi', en: 'best' } }], { title: { tr: 'Uygunluk geçmişi', en: 'Fitness history' } });
        },
        stats: () => [[{ tr: 'Iterasyon', en: 'Iteration' }, sim.iter], [{ tr: 'f(mevcut)', en: 'f(current)' }, MH.fmt(sim.f(sim.x))], [{ tr: 'f(en iyi)', en: 'f(best)' }, MH.fmt(sim.f(sim.best))], [{ tr: 'Takılma sayacı', en: 'Stuck counter' }, sim.stuck], [{ tr: 'Yeniden başlatma', en: 'Restarts' }, sim.restarts]],
        explain() {
          if (!sim.iter) return t({ tr: 'Yeniden başlatma <b>kapalıyken</b> nokta ilk tepede kalır; açın ve farkı görün. Gerçek global maksimum x≈2.11, f≈1.08.', en: 'With restarts <b>off</b> the point stays on the first peak; turn them on to see the difference. The true global maximum is x≈2.11, f≈1.08.' });
          return sim.stuck >= P.patience - 1 && !P.restart ? t({ tr: 'Nokta bir tepeye takıldı: etrafındaki tüm komşular daha kötü.', en: 'The point is stuck on a peak: all its neighbours are worse.' }) : t({ tr: sim.moved ? 'Komşu daha iyi → hareket edildi.' : 'Komşu daha kötü → reddedildi.', en: sim.moved ? 'The neighbour is better → moved.' : 'The neighbour is worse → rejected.' });
        },
        controls: k => [
          MH.slider({ label: { tr: 'Adım boyu δ', en: 'Step size δ' }, min: 0.05, max: 1.5, step: 0.05, value: P.delta, fmt: v => v.toFixed(2), onInput: v => { P.delta = v; k.restart(); } }),
          MH.toggle({ label: { tr: 'Rastgele yeniden başlatma', en: 'Random restarts' }, value: P.restart, onChange: v => { P.restart = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Sabır (adım)', en: 'Patience (steps)' }, min: 5, max: 80, value: P.patience, onInput: v => { P.patience = v; k.restart(); } })
        ],
        legend: MH.legend([['--accent', { tr: 'mevcut', en: 'current' }], ['--good', { tr: 'kabul edilen komşu', en: 'accepted neighbour' }], ['--bad', { tr: 'reddedilen komşu', en: 'rejected neighbour' }]])
      });
    },
    anns: {
      'HillClimbing.py': [
        { find: 'def f(x)', span: 2, text: { tr: 'Üç sinüsün toplamı: birkaç yerel, bir global tepe.', en: 'A sum of three sines: several local peaks and one global peak.' } },
        { find: 'def __init__', span: 10, text: { tr: '<code>delta</code> adım boyu, <code>restart</code> ve <code>patience</code> yeniden başlatma stratejisini belirler.', en: '<code>delta</code> is the step size; <code>restart</code> and <code>patience</code> define the restart strategy.' } },
        { find: 'if f(new_state) > f(self.actual_state)', span: 5, text: { tr: 'Çekirdek kural: yalnızca <b>daha iyi</b> komşuya geç. Tavlamadan fark burada.', en: 'The core rule: move only to a <b>better</b> neighbour. This is where it differs from annealing.' } },
        { find: 'if self.restart and stuck >= self.patience', span: 3, text: { tr: 'Takılınca rastgele yeni bir noktaya zıpla.', en: 'When stuck, jump to a new random point.' } },
        { find: 'def generate_neighbor', span: 3, text: { tr: 'Komşu: mevcut noktadan en fazla <code>delta</code> uzaklıkta, aralıkta kırpılmış.', en: 'Neighbour: at most <code>delta</code> away from the current point, clamped to the interval.' } }
      ]
    },
    notes: {
      tr: ['Bu sürüm "<b>basit/stokastik</b>" tepe tırmanmadır: tüm komşulara bakmak yerine bir rastgele komşu dener. <b>Dik yokuş</b> (steepest-ascent) sürümünde tüm komşular taranır ve en iyisi seçilir.', 'Kodun yazdığı "Global maximum" ifadesi, yeniden başlatma kapalıyken yanıltıcı olabilir: bulunan sadece ulaşılan tepedir.', 'Yeniden başlatmalı tırmanma, basit problemlerde şaşırtıcı derecede güçlü bir <b>taban çizgisidir</b>; daha karmaşık bir algoritmayı savunmadan önce onunla kıyaslayın.'],
      en: ['This is <b>simple / stochastic</b> hill climbing: it tries one random neighbour instead of scanning them all. In <b>steepest-ascent</b> hill climbing all neighbours are scanned and the best is chosen.', 'The printed "Global maximum" can be misleading with restarts off: what it finds is just the peak it reached.', 'Hill climbing with restarts is a surprisingly strong <b>baseline</b> on simple problems; compare against it before defending a more complex algorithm.']
    },
    params: {
      tr: [['Adım boyu δ', 'Küçük = hassas ama yavaş ve takılmaya yatkın; büyük = tepeleri atlayabilir ama keşfi artırır.'], ['Yeniden başlatma', 'Takılmayı aşmanın en basit yolu; hesaplama bütçesinin bir kısmını yeni başlangıçlara harcar.'], ['Sabır', 'Çok kısa = erken vazgeçer; çok uzun = takılı kalıp zaman harcar.']],
      en: [['Step size δ', 'Small = precise but slow and prone to stalling; large = may jump over peaks but explores more.'], ['Restarts', 'The simplest way past stalling; spends part of the budget on fresh starts.'], ['Patience', 'Too short gives up early; too long wastes time while stuck.']]
    },
    pros: { tr: ['Son derece basit ve hızlı', 'Bellek gerektirmez', 'Yeniden başlatmalı hali güçlü bir taban çizgisi'], en: ['Extremely simple and fast', 'Needs no memory', 'With restarts it is a strong baseline'] },
    cons: { tr: ['Yerel optimumda takılır', 'Platolarda yön bulamaz', 'Sonuç başlangıç noktasına çok bağlıdır'], en: ['Gets stuck in local optima', 'Has no direction on plateaus', 'The result depends heavily on the start'] }
  });

  /* ================= Tabu Search ================= */
  MH.algoPage({
    id: 'tabu-search', group: 'g_local', origin: 'added',
    title: { tr: 'Tabu Arama · Gezgin Satıcı', en: 'Tabu Search · Traveling Salesman' },
    nav: { tr: 'Tabu Arama', en: 'Tabu Search' },
    blurb: { tr: 'Hafızayla çalışır: yakın zamanda yapılan hamleleri yasaklayarak döngüleri kırar.', en: 'Uses memory: forbids recent moves to break cycles.' },
    tagline: { tr: 'Her adımda en iyi komşuya (kötü olsa bile) gider, ama geri dönüşü yasaklar.', en: 'Always moves to the best neighbour (even a worse one) but forbids going back.' },
    files: ['TabuSearchTSP.py'],
    intuition: {
      tr: ['Hill Climbing bir tepede durur. Tabu Arama ise tepede bile <b>en iyi komşuya geçmeye zorlanır</b> — bu komşu daha kötü olsa da. Böylece tepeden inip başka tepelere gidebilir.', 'Ama inip hemen geri çıkarsak aynı yerde döneriz. Bu yüzden son birkaç hamle <b>tabu listesine</b> yazılır ve bir süre yasaklanır. Liste, algoritmanın kısa süreli <b>hafızasıdır</b>.'],
      en: ['Hill climbing stops on a peak. Tabu Search is <b>forced to move to the best neighbour</b> even at a peak — even if that neighbour is worse. So it can descend and wander to other peaks.', 'But if we climb straight back we would circle in place. So the last few moves are written to a <b>tabu list</b> and forbidden for a while. The list is the algorithm\'s short-term <b>memory</b>.']
    },
    steps: {
      tr: ['Rastgele bir turla başla.', 'Tüm komşuları incele: her iki şehrin yer değiştirmesi (n(n−1)/2 komşu).', 'Tabu <b>olmayan</b> en iyi komşuyu seç (tabu olsa bile şimdiye kadarki en iyiden iyiyse seç: <i>aspirasyon</i>).', 'Hamleyi uygula ve bu iki şehrin takasını <code>tenure</code> iterasyon boyunca yasakla.', 'En iyi turu güncelle ve tekrarla.'],
      en: ['Start from a random tour.', 'Examine all neighbours: every swap of two cities (n(n−1)/2 neighbours).', 'Pick the best <b>non-tabu</b> neighbour (a tabu move is allowed if it beats the best so far: the <i>aspiration</i> criterion).', 'Apply the move and forbid swapping these two cities for <code>tenure</code> iterations.', 'Update the best tour and repeat.']
    },
    demo(root) {
      const P = { n: 12, tenure: 8, iters: 150 }; let sim, cities;
      MH.demo(root, {
        w: 760, h: 420, sps: 6, maxSps: 60, minSps: 1,
        init(k) { cities = S.makeCities(P.n, MH.rngFor(k.seed)); sim = S.tabuTSP({ cities, tenure: P.tenure, iters: P.iters }, MH.rngFor(k.seed + 1)); },
        step: () => sim.step(), isDone: () => sim.done,
        draw(ctx) {
          MH.drawTour(ctx, cities, sim.tour, { x: 0, y: 0, w: 400, h: 420 }, { title: { tr: 'Mevcut tur', en: 'Current tour' } });
          MH.drawTour(ctx, cities, sim.best, { x: 410, y: 0, w: 350, h: 200 }, { title: { tr: 'En iyi tur', en: 'Best tour' }, color: col('--good'), width: 2.5 });
          MH.chart(ctx, 410, 210, 350, 210, [{ data: sim.hist, color: col('--accent'), label: { tr: 'mevcut', en: 'current' } }, { data: sim.bestHist, color: col('--good'), label: { tr: 'en iyi', en: 'best' } }], { title: { tr: 'Tur uzunluğu', en: 'Tour length' } });
        },
        stats: () => [[{ tr: 'Iterasyon', en: 'Iteration' }, `${sim.iter}/${P.iters}`], [{ tr: 'Başlangıç', en: 'Initial' }, Math.round(sim.init)], [{ tr: 'Mevcut', en: 'Current' }, Math.round(sim.len)], [{ tr: 'En iyi', en: 'Best' }, Math.round(sim.bestLen)], [{ tr: 'Tabu hamle sayısı', en: 'Tabu moves' }, sim.tabuCount]],
        explain() {
          if (!sim.iter) return t({ tr: 'Tabu Arama her adımda <b>tüm</b> komşuları değerlendirir; bu yüzden adım başına tavlamadan pahalıdır ama çok daha az adımda iyi tura ulaşır.', en: 'Tabu Search evaluates <b>all</b> neighbours each step; it is costlier per step than annealing but needs far fewer steps to reach a good tour.' });
          return t({ tr: `Son hamle: şehir ${sim.lastMove ? sim.lastMove[0] + ' ↔ ' + sim.lastMove[1] : '–'} takası. Mevcut tur en iyiden ${sim.len > sim.bestLen + 1e-9 ? '<b>kötü</b>' : 'iyi'} — kötüleşmeyi kabul etmek tabunun gücüdür.`, en: `Last move: swap of cities ${sim.lastMove ? sim.lastMove[0] + ' ↔ ' + sim.lastMove[1] : '–'}. The current tour is ${sim.len > sim.bestLen + 1e-9 ? '<b>worse</b> than' : 'as good as'} the best — accepting worse moves is the strength of tabu.` });
        },
        controls: k => [
          MH.slider({ label: { tr: 'Şehir', en: 'Cities' }, min: 5, max: 25, value: P.n, onInput: v => { P.n = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Tabu süresi', en: 'Tabu tenure' }, min: 0, max: 30, value: P.tenure, onInput: v => { P.tenure = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Iterasyon', en: 'Iterations' }, min: 20, max: 400, step: 10, value: P.iters, onInput: v => { P.iters = v; k.restart(); } })
        ]
      });
    },
    anns: {
      'TabuSearchTSP.py': [
        { find: 'def tour_distance', span: 2, text: { tr: 'Maliyet: kapalı turun uzunluğu (küçük = iyi).', en: 'Cost: length of the closed tour (smaller is better).' } },
        { find: 'def __init__(self, num_cities', span: 8, text: { tr: '<code>tenure</code>: bir hamlenin kaç iterasyon yasak kalacağı. <code>self.tabu</code> sözlüğü hamle → bitiş iterasyonu tutar.', en: '<code>tenure</code>: how many iterations a move stays forbidden. The <code>self.tabu</code> dict maps a move to its expiry iteration.' } },
        { find: 'for i in range(len(self.actual_state) - 1)', span: 14, text: { tr: 'Tüm komşuluk taranır; tabu olmayan (veya aspirasyonu sağlayan) en iyi komşu seçilir.', en: 'The whole neighbourhood is scanned; the best non-tabu (or aspirated) neighbour is chosen.' } },
        { find: 'if self.is_tabu(move, iteration) and dist >=', span: 2, text: { tr: '<b>Aspirasyon kriteri</b>: tabu bir hamle, global en iyiyi geçiyorsa yine de serbesttir.', en: 'The <b>aspiration criterion</b>: a tabu move is still allowed if it beats the global best.' } },
        { find: 'self.actual_state = best_neighbor', span: 4, text: { tr: 'Daha kötü olsa bile en iyi komşuya geçilir ve hamle tabu listesine yazılır.', en: 'We move to the best neighbour even if worse, and record the move in the tabu list.' } }
      ]
    },
    notes: {
      tr: ['Hamle, şehir <b>nesnelerinin</b> kimliği (<code>id</code>) ile tutuluyor; iki yönü de (<code>a,b</code> ve <code>b,a</code>) tabu yapılır.', 'Her komşunun maliyeti O(n) ile yeniden hesaplanır; toplam adım başına O(n³). Büyük örneklerde sadece değişen kenarların farkı hesaplanmalıdır (delta değerlendirme).', 'Tabu süresi çok kısaysa algoritma aynı döngüde dönebilir (tabu süresi 0 ile deneyin); çok uzunsa neredeyse tüm iyi hamleler yasaklanır.', 'Gerçek uygulamalarda ek olarak <b>uzun vadeli hafıza</b> (sıklık tablosu, çeşitlendirme) ve <b>2-opt</b> komşuluğu kullanılır.'],
      en: ['Moves are stored by the <b>identity</b> (<code>id</code>) of the city objects; both directions (<code>a,b</code> and <code>b,a</code>) are made tabu.', 'Each neighbour\'s cost is recomputed in O(n), giving O(n³) per step. For large instances compute only the delta of the changed edges.', 'If the tenure is too short the search can cycle (try tenure 0); if too long nearly all good moves are forbidden.', 'Real implementations add <b>long-term memory</b> (frequency tables, diversification) and a <b>2-opt</b> neighbourhood.']
    },
    params: {
      tr: [['Tabu süresi', 'Hafızanın uzunluğu. 0 = hafıza yok (yerel aramada döngü). Genelde √n ile n/2 arası denenir.'], ['Komşuluk', 'Burada tüm swap\'lar; 2-opt gibi daha güçlü komşulukla aynı sürede daha iyi tur bulunur.']],
      en: [['Tabu tenure', 'Length of the memory. 0 = no memory (cycling local search). Typically √n to n/2 is tried.'], ['Neighbourhood', 'All swaps here; a stronger neighbourhood such as 2-opt finds better tours in the same time.']]
    },
    pros: { tr: ['Yerel optimumlardan sistematik kaçar', 'Çok az adımda iyi sonuç', 'Hafıza mekanizması esnek ve genişletilebilir'], en: ['Escapes local optima systematically', 'Good results in very few steps', 'The memory mechanism is flexible and extensible'] },
    cons: { tr: ['Adım başına tüm komşuluğu değerlendirmek pahalı', 'Tabu süresi probleme bağlı ayarlanmalı', 'Tek çözümle ilerler (paralellik yok)'], en: ['Evaluating the whole neighbourhood every step is costly', 'The tenure must be tuned per problem', 'Follows a single solution (no parallelism)'] }
  });

  /* ================= Ant Colony Optimization ================= */
  MH.algoPage({
    id: 'aco', group: 'g_nature', origin: 'added',
    title: { tr: 'Karınca Kolonisi Optimizasyonu · TSP', en: 'Ant Colony Optimization · TSP' },
    nav: { tr: 'Karınca Kolonisi', en: 'Ant Colony' },
    blurb: { tr: 'Karıncalar feromon izi bırakır; kısa yollar daha çok iz toplar.', en: 'Ants leave pheromone trails; short routes collect more.' },
    tagline: { tr: 'Doğrudan iletişim yok: bilgi, çevreye bırakılan izle (stigmerji) paylaşılır.', en: 'No direct communication: information is shared through marks left in the environment (stigmergy).' },
    files: ['AntColonyOptimizationTSP.py'],
    intuition: {
      tr: ['Gerçek karıncalar yuva ile yiyecek arasında kısa yolu bulur: her biri geçtiği yola <b>feromon</b> bırakır, diğerleri feromonu yoğun yolları tercih eder. Kısa yolda karıncalar daha sık gidip gelir, iz güçlenir; uzun yoldaki iz <b>buharlaşır</b>.', 'Algoritmada her karınca şehirleri tek tek seçerek bir tur kurar. Sonraki şehir, <b>iz yoğunluğu</b> ve <b>yakınlık</b> ile orantılı olasılıkla seçilir.'],
      en: ['Real ants find the short path between nest and food: each leaves <b>pheromone</b> on its way and the others prefer pheromone-rich paths. Ants travel the short path more often, so its trail strengthens while the trail on long paths <b>evaporates</b>.', 'In the algorithm each ant builds a tour city by city. The next city is chosen with a probability proportional to the <b>trail intensity</b> and the <b>closeness</b>.']
    },
    steps: {
      tr: ['Tüm kenarlarda eşit feromonla başla.', 'Her karınca rastgele bir şehirden başlar; sıradaki şehri olasılıkla seçer: <code>P ∝ τ<sup>α</sup> · (1/d)<sup>β</sup></code>.', 'Tüm karıncaların turu bitince uzunlukları hesaplanır; en iyi tur güncellenir.', '<b>Buharlaşma</b>: tüm izler <code>(1 − ρ)</code> ile çarpılır.', '<b>Biriktirme</b>: her karınca turundaki kenarlara <code>Q / tur_uzunluğu</code> kadar feromon ekler (kısa tur = çok iz).', 'İterasyon sayısı bitene kadar tekrarla.'],
      en: ['Start with equal pheromone on all edges.', 'Each ant starts at a random city and picks the next city by probability: <code>P ∝ τ<sup>α</sup> · (1/d)<sup>β</sup></code>.', 'When all ants have finished, compute the tour lengths and update the best tour.', '<b>Evaporation</b>: multiply all trails by <code>(1 − ρ)</code>.', '<b>Deposit</b>: every ant adds <code>Q / tour_length</code> pheromone to the edges of its tour (short tour = more pheromone).', 'Repeat until the iteration count is reached.']
    },
    demo(root) {
      const P = { n: 14, ants: 14, alpha: 1, beta: 4, rho: 0.4, iters: 80 }; let sim, cities;
      MH.demo(root, {
        w: 760, h: 420, sps: 4, maxSps: 40, minSps: 1,
        init(k) { cities = S.makeCities(P.n, MH.rngFor(k.seed)); sim = S.aco({ cities, ants: P.ants, alpha: P.alpha, beta: P.beta, rho: P.rho, q: 500, iters: P.iters }, MH.rngFor(k.seed + 1)); },
        step: () => sim.step(), isDone: () => sim.done,
        draw(ctx) {
          MH.drawTour(ctx, cities, sim.best, { x: 0, y: 0, w: 400, h: 420 }, { title: { tr: 'Feromon izi (mor) ve en iyi tur', en: 'Pheromone trails (purple) and best tour' }, pheromone: sim.tau, color: col('--good'), width: 2 });
          MH.drawTour(ctx, cities, sim.iterBest, { x: 410, y: 0, w: 350, h: 200 }, { title: { tr: 'Bu iterasyonun en iyi karıncası', en: 'Best ant of this iteration' }, color: col('--accent') });
          MH.chart(ctx, 410, 210, 350, 210, [{ data: sim.hist, color: col('--accent'), label: { tr: 'iterasyon en iyisi', en: 'iteration best' } }, { data: sim.bestHist, color: col('--good'), label: { tr: 'genel en iyi', en: 'overall best' } }], { title: { tr: 'Tur uzunluğu', en: 'Tour length' } });
        },
        stats: () => [[{ tr: 'Iterasyon', en: 'Iteration' }, `${sim.iter}/${P.iters}`], [{ tr: 'Bu iterasyon', en: 'This iteration' }, sim.iter ? Math.round(sim.iterLen) : '–'], [{ tr: 'En iyi', en: 'Best' }, Number.isFinite(sim.bestLen) ? Math.round(sim.bestLen) : '–']],
        explain: () => (sim.iter ? t({ tr: 'Mor çizgilerin kalınlığı feromon yoğunluğudur. Zamanla kısa kenarlar kalınlaşır, uzunlar silinir: koloni ortak bir turda uzlaşır.', en: 'The thickness of the purple lines is the pheromone intensity. Over time short edges thicken and long ones fade: the colony converges on a common tour.' }) : t({ tr: 'Adım\'a basarak bir iterasyonu (tüm karıncaların tur kurması) izleyin.', en: 'Press Step to watch one iteration (all ants building tours).' })),
        controls: k => [
          MH.slider({ label: { tr: 'Şehir', en: 'Cities' }, min: 5, max: 30, value: P.n, onInput: v => { P.n = v; P.ants = v; k.restart(); } }),
          MH.slider({ label: { tr: 'α (iz)', en: 'α (trail)' }, min: 0, max: 3, step: 0.1, value: P.alpha, fmt: v => v.toFixed(1), onInput: v => { P.alpha = v; k.restart(); } }),
          MH.slider({ label: { tr: 'β (yakınlık)', en: 'β (closeness)' }, min: 0, max: 8, step: 0.5, value: P.beta, fmt: v => v.toFixed(1), onInput: v => { P.beta = v; k.restart(); } }),
          MH.slider({ label: { tr: 'ρ (buharlaşma)', en: 'ρ (evaporation)' }, min: 0.02, max: 0.9, step: 0.02, value: P.rho, fmt: v => v.toFixed(2), onInput: v => { P.rho = v; k.restart(); } })
        ]
      });
    },
    anns: {
      'AntColonyOptimizationTSP.py': [
        { find: 'def __init__(self, num_cities', span: 16, text: { tr: 'Parametreler: α iz, β yakınlık, ρ buharlaşma, Q biriktirilen feromon miktarı. <code>pheromone</code> matrisi 1.0 ile başlar.', en: 'Parameters: α trail, β closeness, ρ evaporation, Q deposited amount. The <code>pheromone</code> matrix starts at 1.0.' } },
        { find: 'def run(self)', span: 11, text: { tr: 'Her iterasyonda tüm karıncalar tur kurar, en iyi tur kaydedilir, sonra izler güncellenir.', en: 'In each iteration all ants build tours, the best tour is recorded, then the trails are updated.' } },
        { find: 'def construct_tour', span: 22, text: { tr: 'Tur kurma: ziyaret edilmemiş şehirler arasından <code>τ^α · (1/d)^β</code> ağırlıklı <b>rulet tekerleği</b> ile seçim.', en: 'Tour construction: a <b>roulette wheel</b> over the unvisited cities weighted by <code>τ^α · (1/d)^β</code>.' } },
        { find: 'def update_pheromone', span: 16, text: { tr: 'Buharlaşma + biriktirme. Kısa turlar kenarlarına daha çok feromon bırakır.', en: 'Evaporation + deposit. Short tours leave more pheromone on their edges.' } }
      ]
    },
    notes: {
      tr: ['Bu <b>Ant System</b> (AS) varyantıdır: tüm karıncalar izi günceller. <b>Ant Colony System</b> ve <b>MAX-MIN</b> varyantlarında yalnızca en iyi karınca iz bırakır; bu, erken yakınsamayı azaltır.', 'Rulet döngüsünde <code>w &gt; 0 and r &lt;= 0</code> kontrolü, ağırlığı sıfır olan (ziyaret edilmiş) şehirlerin seçilmesini engeller.', 'α=0 iken izler hiç kullanılmaz (açgözlü en yakın komşu); β=0 iken yakınlık hiç kullanılmaz ve algoritma yalnızca izlere güvenir — her iki durumda sonuçlar belirgin biçimde kötüleşir.'],
      en: ['This is the <b>Ant System</b> (AS) variant: all ants update the trails. In <b>Ant Colony System</b> and <b>MAX-MIN</b> variants only the best ant deposits, which reduces premature convergence.', 'The <code>w &gt; 0 and r &lt;= 0</code> check in the roulette loop prevents selecting cities with zero weight (already visited).', 'With α=0 the trails are ignored (greedy nearest neighbour); with β=0 closeness is ignored and the algorithm trusts only the trails — results degrade noticeably in both cases.']
    },
    params: {
      tr: [['α', 'İzin ağırlığı. Yüksek = sürü hızla aynı rotaya yığılır (sömürü).'], ['β', 'Yakınlığın ağırlığı. Yüksek = açgözlü davranır.'], ['ρ', 'Buharlaşma. Yüksek = hızlı unutma (keşif); düşük = eski izler kalıcı (erken yakınsama riski).'], ['Karınca sayısı', 'Genelde şehir sayısı kadar.']],
      en: [['α', 'Weight of the trail. High = the colony piles onto one route quickly (exploitation).'], ['β', 'Weight of closeness. High = greedy behaviour.'], ['ρ', 'Evaporation. High = fast forgetting (exploration); low = old trails persist (risk of premature convergence).'], ['Number of ants', 'Usually equal to the number of cities.']]
    },
    pros: { tr: ['Rota ve çizge problemleri için çok doğal', 'Dinamik değişen problemlere (yeni şehir/yol) uyum sağlar', 'Doğası gereği paralel'], en: ['Very natural for routing and graph problems', 'Adapts to changing problems (new city/road)', 'Inherently parallel'] },
    cons: { tr: ['Sürekli problemlere doğrudan uymaz', 'Çok parametre ve ağır bellek (n×n matris)', 'Yakınsama analizi karmaşık'], en: ['Does not directly fit continuous problems', 'Many parameters and heavy memory (n×n matrix)', 'Convergence analysis is complex'] }
  });

  /* ================= Differential Evolution ================= */
  MH.algoPage({
    id: 'diff-evolution', group: 'g_evo', origin: 'added',
    title: { tr: 'Diferansiyel Evrim (DE)', en: 'Differential Evolution (DE)' },
    nav: { tr: 'Diferansiyel Evrim', en: 'Differential Evolution' },
    blurb: { tr: 'Üç bireyin fark vektörüyle yeni aday üretir; sadece daha iyiyse yer değiştirir.', en: 'Builds a new candidate from a difference vector of three individuals; replaces only if better.' },
    tagline: { tr: 'Sürekli optimizasyonun en sağlam, en az ayar isteyen popülasyon yöntemlerinden biri.', en: 'One of the most robust population methods for continuous optimisation, needing little tuning.' },
    files: ['DifferentialEvolution.py'],
    intuition: {
      tr: ['Popülasyon bir bulut gibidir. Bulutun şekli, arama adımlarının yönünü ve boyunu <b>kendiliğinden</b> belirler: iki bireyin farkı (x₂ − x₃), "buradan buraya doğru iyi bir yön olabilir" diyen bir adım vektörüdür.', 'Başlangıçta bulut geniş olduğu için adımlar büyüktür (keşif); popülasyon çukurda toplandıkça adımlar küçülür (sömürü). Adım boyunu ayrıca ayarlamaya gerek yoktur.'],
      en: ['The population is like a cloud. Its shape <b>automatically</b> sets the direction and length of the search steps: the difference of two individuals (x₂ − x₃) is a step vector saying "this way from here could be good".', 'At first the cloud is wide so steps are large (exploration); as the population gathers in a valley the steps shrink (exploitation). There is no separate step size to tune.']
    },
    steps: {
      tr: ['Rastgele bir popülasyonla başla.', 'Her birey <i>x<sub>i</sub></i> (hedef) için üç farklı birey seç: <i>r1, r2, r3</i>.', '<b>Mutasyon</b>: <code>v = x<sub>r1</sub> + F·(x<sub>r2</sub> − x<sub>r3</sub>)</code>.', '<b>Çaprazlama</b>: her koordinat <code>CR</code> olasılığıyla <i>v</i>\'den, aksi halde hedeften alınır (en az biri <i>v</i>\'den).', '<b>Seçilim</b>: deneme vektörü hedeften iyi veya eşitse hedefin yerine geçer.', 'Tüm bireyler için tekrarla; iterasyon sayısı bitene kadar sürdür.'],
      en: ['Start with a random population.', 'For each individual <i>x<sub>i</sub></i> (the target) pick three different individuals: <i>r1, r2, r3</i>.', '<b>Mutation</b>: <code>v = x<sub>r1</sub> + F·(x<sub>r2</sub> − x<sub>r3</sub>)</code>.', '<b>Crossover</b>: each coordinate comes from <i>v</i> with probability <code>CR</code>, otherwise from the target (at least one from <i>v</i>).', '<b>Selection</b>: the trial vector replaces the target if it is better or equal.', 'Repeat for every individual and continue until the iteration count is reached.']
    },
    demo(root) {
      const P = { fn: 'rastrigin', np: 30, F: 0.6, CR: 0.8, iters: 80 };
      MH.demo2D(root, {
        P, make: (p, seed) => S.de({ ...p }, MH.rngFor(seed)),
        points: sim => sim.pop.map((q, i) => ({ x: q.x[0], y: q.x[1], c: col('--accent'), r: 4 })),
        extra(ctx, sim, m) {
          const d = sim.demo; if (!d) return;
          const pt = a => [m.X(a[0]), m.Y(a[1])];
          ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
          ctx.strokeStyle = col('--warm'); ctx.beginPath(); ctx.moveTo(...pt(d.r2)); ctx.lineTo(...pt(d.r3)); ctx.stroke();
          ctx.strokeStyle = col('--violet'); ctx.beginPath(); ctx.moveTo(...pt(d.r1)); ctx.lineTo(...pt(d.mutant)); ctx.stroke(); ctx.setLineDash([]);
          for (const [a, c] of [[d.r1, '--violet'], [d.r2, '--warm'], [d.r3, '--warm']]) MH.dot(ctx, ...pt(a), 6, col(c), true);
          const tp = pt(d.target); ctx.strokeStyle = col('--text'); ctx.lineWidth = 2; ctx.strokeRect(tp[0] - 7, tp[1] - 7, 14, 14);
          const mp = pt(d.mutant); ctx.fillStyle = col('--bad'); ctx.fillRect(mp[0] - 4, mp[1] - 4, 8, 8);
          const trp = pt(d.trial); MH.dot(ctx, trp[0], trp[1], 6, col(d.win ? '--good' : '--bad'), true);
        },
        stats: sim => [[{ tr: 'Popülasyon', en: 'Population' }, sim.pop.length]],
        explain: sim => sim.iter ? t({ tr: '1. bireyin son üretimi: turuncu çizgi <b>fark vektörü</b> (x<sub>r2</sub>−x<sub>r3</sub>), mor nokta temel vektör x<sub>r1</sub>, kırmızı kare mutant, kare çerçeve hedef; sondaki yuvarlak deneme vektörüdür (yeşil = kazandı, kırmızı = kaybetti).', en: 'Latest construction for individual 1: the orange line is the <b>difference vector</b> (x<sub>r2</sub>−x<sub>r3</sub>), the purple dot the base vector x<sub>r1</sub>, the red square the mutant, the framed square the target; the last circle is the trial vector (green = won, red = lost).' }) : t({ tr: 'Adım\'a basın: her adım bir tüm nesil (her birey için mutasyon + çaprazlama + seçilim).', en: 'Press Step: each step is a whole generation (mutation + crossover + selection for every individual).' }),
        controls: (k, p) => [
          MH.slider({ label: { tr: 'Popülasyon NP', en: 'Population NP' }, min: 8, max: 60, value: p.np, onInput: v => { p.np = v; k.restart(); } }),
          MH.slider({ label: { tr: 'F (ölçek)', en: 'F (scale)' }, min: 0.1, max: 2, step: 0.05, value: p.F, fmt: v => v.toFixed(2), onInput: v => { p.F = v; k.restart(); } }),
          MH.slider({ label: { tr: 'CR (çaprazlama)', en: 'CR (crossover)' }, min: 0, max: 1, step: 0.05, value: p.CR, fmt: v => v.toFixed(2), onInput: v => { p.CR = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Iterasyon', en: 'Iterations' }, min: 10, max: 200, step: 10, value: p.iters, onInput: v => { p.iters = v; k.restart(); } })
        ],
        legend: MH.legend([['--accent', { tr: 'birey', en: 'individual' }], ['--violet', { tr: 'temel vektör r1', en: 'base vector r1' }], ['--warm', { tr: 'fark vektörü r2→r3', en: 'difference r2→r3' }], ['--good', { tr: 'en iyi', en: 'best' }]])
      });
    },
    anns: {
      'DifferentialEvolution.py': [
        { find: 'def f(position)', span: 2, text: { tr: 'Rastrigin: çok sayıda yerel minimumu olan zor bir test fonksiyonu; global minimum (0, 0).', en: 'Rastrigin: a hard test function with many local minima; the global minimum is (0, 0).' } },
        { find: 'def __init__(self, min_x, max_x, dimensions=2', span: 12, text: { tr: '<code>F</code> mutasyon ölçeği, <code>CR</code> çaprazlama olasılığı, <code>np_size</code> popülasyon.', en: '<code>F</code> mutation scale, <code>CR</code> crossover probability, <code>np_size</code> population.' } },
        { find: 'r1, r2, r3 = sample', span: 4, text: { tr: '<b>Mutasyon (DE/rand/1)</b>: üç farklı bireyden <code>x_r1 + F·(x_r2 − x_r3)</code>; sonra sınırlara kırpılır.', en: '<b>Mutation (DE/rand/1)</b>: <code>x_r1 + F·(x_r2 − x_r3)</code> from three distinct individuals, then clamped to the bounds.' } },
        { find: 'j_rand = randint', span: 3, text: { tr: '<b>Binom çaprazlama</b>: her koordinat CR olasılığıyla mutanttan; <code>j_rand</code> en az bir koordinatın mutanttan gelmesini garanti eder.', en: '<b>Binomial crossover</b>: each coordinate comes from the mutant with probability CR; <code>j_rand</code> guarantees at least one coordinate from the mutant.' } },
        { find: 'trial_fitness = f(trial)', span: 4, text: { tr: '<b>Seçilim</b>: deneme vektörü hedeften iyiyse (veya eşitse) onun yerine geçer. Hiç kötüleşme yoktur.', en: '<b>Selection</b>: the trial vector replaces the target if better or equal. The population never gets worse.' } }
      ]
    },
    notes: {
      tr: ['Seçilim <b>bire bir</b>dir (deneme vektörü yalnızca kendi hedefiyle yarışır); bu, çeşitliliği korur ve popülasyonun en iyi değeri hiç kötüleşmez.', 'Seçilimde <code>&lt;=</code> kullanılır: eşitlikte deneme vektörü kazanır; bu, platolarda arama akışını sürdürür.', 'F büyükse adımlar büyür, popülasyon daha çok keşfeder; F küçükse sömürü ağır basar. Tipik başlangıç: F=0.5–0.8, CR=0.7–0.9.', 'Bu sürüm DE/rand/1/bin\'dir. En iyiye doğru yönelen <code>DE/best/1</code> ve <code>DE/current-to-best/1</code> gibi varyantlar daha hızlı ama daha takılgandır.'],
      en: ['Selection is <b>one-to-one</b> (a trial vector competes only with its own target); this preserves diversity and the best value never worsens.', 'Selection uses <code>&lt;=</code>: on ties the trial vector wins, which keeps the search moving across plateaus.', 'A large F makes steps big and the population explores more; a small F favours exploitation. Typical start: F=0.5–0.8, CR=0.7–0.9.', 'This is DE/rand/1/bin. Variants like <code>DE/best/1</code> and <code>DE/current-to-best/1</code> are faster but more prone to stalling.']
    },
    params: {
      tr: [['NP', 'Genelde boyutun 5–10 katı (en az 4); 2B\'de 20–40 yeterlidir.'], ['F', '0.4–1.0 genelde iyidir. Çok küçükse erken yakınsama, çok büyükse yavaş.'], ['CR', 'Yüksek CR = koordinatlar birlikte değişir (döndürülmüş problemlerde iyi); düşük CR = koordinat başına arama.']],
      en: [['NP', 'Commonly 5–10× the dimension (and at least 4); 20–40 is enough in 2-D.'], ['F', '0.4–1.0 is usually good. Too small converges prematurely, too large is slow.'], ['CR', 'High CR = coordinates change together (good for rotated problems); low CR = per-coordinate search.']]
    },
    pros: { tr: ['Çok az parametre (NP, F, CR)', 'Adım boyunu otomatik uyarlar', 'Gürültülü ve türevsiz fonksiyonlarda sağlam'], en: ['Very few parameters (NP, F, CR)', 'Adapts the step size automatically', 'Robust on noisy and non-differentiable functions'] },
    cons: { tr: ['Yüksek boyutta fonksiyon değerlendirmesi çok olabilir', 'Doğrudan ayrık problemlere uymaz', 'Çok yerel minimumlu yüzeylerde NP küçükse takılabilir'], en: ['Many function evaluations in high dimensions', 'Does not directly fit discrete problems', 'May stall on very multimodal surfaces if NP is small'] }
  });

  /* ================= Artificial Bee Colony ================= */
  MH.algoPage({
    id: 'abc', group: 'g_nature', origin: 'added',
    title: { tr: 'Yapay Arı Kolonisi (ABC)', en: 'Artificial Bee Colony (ABC)' },
    nav: { tr: 'Yapay Arı Kolonisi', en: 'Artificial Bee Colony' },
    blurb: { tr: 'İşçi, gözcü ve kâşif arıların görev paylaşımıyla çiçek alanı arar.', en: 'Employed, onlooker and scout bees share roles to search flower patches.' },
    tagline: { tr: 'Üç arı rolü: sömür, yönlendir, keşfet.', en: 'Three bee roles: exploit, recruit, explore.' },
    files: ['ArtificialBeeColony.py'],
    intuition: {
      tr: ['Bal arıları bir <b>besin kaynağını</b> (aday çözüm) bulur, kovana dönüp dans ederek bilgi verir. Kaliteli kaynakların dansı daha çok izlenir ve oraya daha çok arı gider. Kaynak tükenince terk edilir ve <b>kâşif</b> arılar yenisini bulur.', 'Algoritma bu üç görevi taklit eder: <b>işçi</b> arılar kendi kaynaklarını komşuda dener, <b>gözcü</b> arılar iyi kaynakları olasılıkla seçip dener, <b>kâşif</b> arılar tükenen kaynakları rastgele yenisiyle değiştirir.'],
      en: ['Honey bees find a <b>food source</b> (a candidate solution), return to the hive and dance to share the information. Dances for rich sources are watched more and attract more bees. A depleted source is abandoned and <b>scouts</b> find a new one.', 'The algorithm mimics these three jobs: <b>employed</b> bees try the neighbourhood of their own source, <b>onlooker</b> bees pick good sources by probability and try them, <b>scouts</b> replace exhausted sources with random ones.']
    },
    steps: {
      tr: ['<code>SN</code> rastgele besin kaynağı oluştur.', '<b>İşçi arılar</b>: her kaynak için bir komşu dene: <code>v<sub>j</sub> = x<sub>j</sub> + φ·(x<sub>j</sub> − x<sub>k</sub>)</code>, φ∈[−1,1]. Daha iyiyse değiştir, değilse başarısızlık sayacını artır.', '<b>Gözcü arılar</b>: kaynakları uygunlukla orantılı rulet ile seç ve aynı komşu denemesini yap (iyi kaynaklara daha çok arı gider).', '<b>Kâşif arılar</b>: sayacı <code>limit</code>\'i aşan kaynağı terk et, yerine rastgele yenisini koy.', 'En iyi kaynağı hatırla ve tekrarla.'],
      en: ['Create <code>SN</code> random food sources.', '<b>Employed bees</b>: for each source try a neighbour: <code>v<sub>j</sub> = x<sub>j</sub> + φ·(x<sub>j</sub> − x<sub>k</sub>)</code>, φ∈[−1,1]. Replace if better, otherwise increase the failure counter.', '<b>Onlooker bees</b>: choose sources by roulette proportional to fitness and try the same neighbour move (good sources get more bees).', '<b>Scout bees</b>: abandon a source whose counter exceeds <code>limit</code> and replace it with a random one.', 'Remember the best source and repeat.']
    },
    demo(root) {
      const P = { fn: 'rastrigin', sn: 20, limit: 20, iters: 100 };
      MH.demo2D(root, {
        P, make: (p, seed) => S.abc({ ...p }, MH.rngFor(seed)),
        points: sim => sim.src.map(s => ({ x: s.x[0], y: s.x[1], c: s.trial > sim.p.limit * 0.6 ? col('--warm') : col('--accent'), r: 4.5 })),
        stats: sim => [[{ tr: 'Kâşif arı (son)', en: 'Scouts (last)' }, sim.scouts]],
        explain: sim => sim.iter ? t({ tr: `Mavi noktalar sağlıklı kaynaklar; <b>turuncu</b> noktalar uzun süredir iyileşmeyen, terk edilmeye yakın kaynaklardır. Bu iterasyonda ${sim.scouts} kâşif arı yeni kaynak buldu.`, en: `Blue dots are healthy sources; <b>orange</b> dots have not improved for a long time and are close to abandonment. In this iteration ${sim.scouts} scout bee(s) found a new source.` }) : t({ tr: 'Adım\'a basın: bir iterasyon = işçi + gözcü + kâşif aşamaları.', en: 'Press Step: one iteration = employed + onlooker + scout phases.' }),
        controls: (k, p) => [
          MH.slider({ label: { tr: 'Kaynak sayısı SN', en: 'Food sources SN' }, min: 6, max: 60, value: p.sn, onInput: v => { p.sn = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Limit', en: 'Limit' }, min: 3, max: 100, value: p.limit, onInput: v => { p.limit = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Iterasyon', en: 'Iterations' }, min: 10, max: 300, step: 10, value: p.iters, onInput: v => { p.iters = v; k.restart(); } })
        ],
        legend: MH.legend([['--accent', { tr: 'besin kaynağı', en: 'food source' }], ['--warm', { tr: 'tükenmek üzere', en: 'nearly exhausted' }], ['--good', { tr: 'en iyi', en: 'best' }]])
      });
    },
    anns: {
      'ArtificialBeeColony.py': [
        { find: 'class FoodSource', span: 12, text: { tr: 'Besin kaynağı: konum, amaç değeri ve ardışık başarısızlık sayacı (<code>trial</code>). Uygunluk, küçük değer için büyük sayıdır.', en: 'A food source: position, objective value and the consecutive failure counter (<code>trial</code>). Fitness is larger for smaller values.' } },
        { find: 'def __init__(self, min_x, max_x, dimensions=2, sn=20', span: 7, text: { tr: '<code>limit</code>: kaç başarısız denemeden sonra kaynak terk edilir.', en: '<code>limit</code>: how many failed attempts before the source is abandoned.' } },
        { find: '# 1. employed bees', span: 3, text: { tr: '<b>İşçi arılar</b>: her biri kendi kaynağının komşusunu dener.', en: '<b>Employed bees</b>: each tries the neighbourhood of its own source.' } },
        { find: '# 2. onlooker bees', span: 9, text: { tr: '<b>Gözcü arılar</b>: uygunlukla orantılı rulet tekerleği ile iyi kaynakları daha sık seçer.', en: '<b>Onlooker bees</b>: roulette wheel proportional to fitness picks good sources more often.' } },
        { find: '# 3. scout bees', span: 4, text: { tr: '<b>Kâşif arılar</b>: tükenen kaynağı rastgele yeni bir kaynakla değiştirir (keşif).', en: '<b>Scout bees</b>: replace an exhausted source with a random new one (exploration).' } },
        { find: 'def search_neighbor', span: 17, text: { tr: 'Komşu üretimi: tek bir koordinatı başka bir kaynağa göre <code>φ·(x_j − x_k)</code> kadar kaydırır; açgözlü seçim yapılır.', en: 'Neighbour generation: shifts one coordinate by <code>φ·(x_j − x_k)</code> relative to another source; selection is greedy.' } }
      ]
    },
    notes: {
      tr: ['Komşu üretiminde yalnızca <b>tek bir koordinat</b> değişir (rastgele seçilen <code>j</code>); bu, yüksek boyutlarda küçük, kararlı adımlar sağlar.', 'Adım boyu, kaynaklar arasındaki mesafeye bağlıdır (DE\'deki fark vektörü fikrine benzer): kaynaklar toplandıkça adımlar otomatik küçülür.', '<code>limit</code> kâşif mekanizmasını belirler: çok küçükse iyi kaynaklar erken terk edilir; çok büyükse takılan kaynaklar bellekte kalır.', 'Uygunluk dönüşümü (<code>1/(1+f)</code>) yalnızca rulet olasılıklarını hesaplar; seçilimin kendisi amaç değeriyle yapılır.'],
      en: ['Neighbour generation changes only <b>one coordinate</b> (a randomly chosen <code>j</code>); this gives small, stable steps in high dimensions.', 'The step size depends on the distance between sources (similar to the difference-vector idea in DE): as sources gather the steps shrink automatically.', '<code>limit</code> controls the scout mechanism: too small and good sources are abandoned early; too large and stagnant sources linger.', 'The fitness transform (<code>1/(1+f)</code>) is used only for the roulette probabilities; the greedy selection itself uses the objective value.']
    },
    params: {
      tr: [['SN', 'Kaynak (ve arı) sayısı. Çok kaynak = daha iyi keşif, iterasyon başına daha çok değerlendirme.'], ['Limit', 'Terk eşiği. Genelde SN·boyut civarı önerilir.']],
      en: [['SN', 'Number of sources (and bees). More sources = better exploration, more evaluations per iteration.'], ['Limit', 'The abandonment threshold. SN·dimension is a common recommendation.']]
    },
    pros: { tr: ['Yerleşik keşif mekanizması (kâşif arılar)', 'Çok az parametre', 'Sürekli ve karma problemlerde sağlam'], en: ['Built-in exploration mechanism (scout bees)', 'Very few parameters', 'Robust on continuous and mixed problems'] },
    cons: { tr: ['Sömürü zayıf olabilir; hassas yakınsama yavaş', 'Her iterasyonda iki kat değerlendirme (işçi + gözcü)', 'Yüksek boyutta yakınsama yavaşlar'], en: ['Exploitation can be weak; fine convergence is slow', 'Two rounds of evaluations per iteration (employed + onlooker)', 'Convergence slows in high dimensions'] }
  });

  /* ================= Grey Wolf Optimizer ================= */
  MH.algoPage({
    id: 'gwo', group: 'g_nature', origin: 'added',
    title: { tr: 'Gri Kurt Optimizasyonu (GWO)', en: 'Grey Wolf Optimizer (GWO)' },
    nav: { tr: 'Gri Kurt Optimizasyonu', en: 'Grey Wolf Optimizer' },
    blurb: { tr: 'Üç lider kurt (alfa, beta, delta) sürünün avı kuşatmasını yönlendirir.', en: 'Three leader wolves (alpha, beta, delta) steer the pack\'s encirclement of the prey.' },
    tagline: { tr: 'Liderlik hiyerarşisi ve zamanla küçülen bir "saldırı" katsayısı.', en: 'A leadership hierarchy and an "attack" coefficient that shrinks over time.' },
    files: ['GreyWolfOptimizer.py'],
    intuition: {
      tr: ['Gri kurtlar hiyerarşik avlanır: en iyi üç kurt (<b>alfa, beta, delta</b>) avın nerede olduğunu en iyi bilenlerdir; diğer kurtlar (omega) onların etrafında konum alır.', 'Her kurt, üç lidere doğru birer adım atar ve bu üç yeni konumun <b>ortalamasına</b> geçer. Katsayı <code>a</code> 2\'den 0\'a düşerken kurtlar önce avdan uzaklaşıp ararlar (keşif), sonra ava saldırırlar (sömürü).'],
      en: ['Grey wolves hunt in a hierarchy: the best three wolves (<b>alpha, beta, delta</b>) know best where the prey is; the other wolves (omegas) position themselves around them.', 'Each wolf takes a step towards each of the three leaders and moves to the <b>average</b> of those three positions. While the coefficient <code>a</code> falls from 2 to 0 the wolves first diverge from the prey to search (exploration), then attack it (exploitation).']
    },
    steps: {
      tr: ['Kurtları rastgele konumlandır.', 'Uygunluğa göre en iyi üç kurdu belirle: α, β, δ.', '<code>a = 2 − 2·iterasyon/maksimum</code> ile doğrusal azalt.', 'Her kurt ve her koordinat için, her lider L için: <code>A = 2a·r₁ − a</code>, <code>C = 2·r₂</code>, <code>D = |C·L − x|</code>, <code>x<sub>L</sub> = L − A·D</code>.', 'Yeni konum = üç <code>x<sub>L</sub></code> değerinin ortalaması (sınırlara kırp).', 'Tekrarla.'],
      en: ['Place the wolves at random.', 'Identify the best three wolves by fitness: α, β, δ.', 'Decrease linearly: <code>a = 2 − 2·iteration/max</code>.', 'For every wolf and coordinate, for each leader L: <code>A = 2a·r₁ − a</code>, <code>C = 2·r₂</code>, <code>D = |C·L − x|</code>, <code>x<sub>L</sub> = L − A·D</code>.', 'New position = average of the three <code>x<sub>L</sub></code> values (clamped to the bounds).', 'Repeat.']
    },
    demo(root) {
      const P = { fn: 'rastrigin', n: 20, iters: 100 };
      MH.demo2D(root, {
        P, make: (p, seed) => S.gwo({ ...p }, MH.rngFor(seed)),
        points: sim => sim.wolves.map(w => ({ x: w.x[0], y: w.x[1], c: col('--text'), r: 4 })),
        extra(ctx, sim, m) {
          const cs = ['--bad', '--warm', '--violet'];
          sim.leaders.forEach((L, i) => MH.dot(ctx, m.X(L[0]), m.Y(L[1]), 8 - i, col(cs[i]), true));
        },
        stats: sim => [['a', sim.a.toFixed(2)]],
        explain: sim => t({ tr: `a = <b>${sim.a.toFixed(2)}</b>: ${sim.a > 1 ? 'a > 1 → kurtlar avdan uzaklaşıp <b>keşfeder</b>.' : 'a < 1 → kurtlar ava <b>saldırır</b> (sömürü).'}`, en: `a = <b>${sim.a.toFixed(2)}</b>: ${sim.a > 1 ? 'a > 1 → wolves diverge from the prey and <b>explore</b>.' : 'a < 1 → wolves <b>attack</b> the prey (exploitation).'}` }),
        controls: (k, p) => [
          MH.slider({ label: { tr: 'Kurt sayısı', en: 'Wolves' }, min: 5, max: 60, value: p.n, onInput: v => { p.n = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Iterasyon', en: 'Iterations' }, min: 10, max: 300, step: 10, value: p.iters, onInput: v => { p.iters = v; k.restart(); } })
        ],
        legend: MH.legend([['--bad', { tr: 'alfa α', en: 'alpha α' }], ['--warm', { tr: 'beta β', en: 'beta β' }], ['--violet', { tr: 'delta δ', en: 'delta δ' }], ['--text', { tr: 'omega kurtlar', en: 'omega wolves' }]])
      });
    },
    anns: {
      'GreyWolfOptimizer.py': [
        { find: 'def __init__', span: 7, text: { tr: 'Kurtlar rastgele konumlanır. Parametre sayısı çok azdır: kurt sayısı ve iterasyon.', en: 'Wolves start at random positions. There are very few parameters: the number of wolves and iterations.' } },
        { find: 'leaders = sorted(self.wolves, key=f)[:3]', span: 1, text: { tr: 'Her iterasyonda en iyi üç kurt lider olur (alfa, beta, delta).', en: 'In every iteration the best three wolves become the leaders (alpha, beta, delta).' } },
        { find: 'a = 2 - 2 * iteration', span: 1, text: { tr: '<code>a</code> doğrusal olarak 2→0: <b>keşiften sömürüye</b> geçişi belirler.', en: '<code>a</code> falls linearly 2→0: it controls the shift <b>from exploration to exploitation</b>.' } },
        { find: 'A = 2 * a * random() - a', span: 4, text: { tr: '<code>|A| &gt; 1</code> → lidere göre uzağa; <code>|A| &lt; 1</code> → lidere doğru. <code>C</code> liderin etkisini rastgele ölçekler.', en: '<code>|A| &gt; 1</code> → away from the leader; <code>|A| &lt; 1</code> → towards it. <code>C</code> randomly scales the leader\'s influence.' } },
        { find: 'wolf[d] = min(self.max_x', span: 1, text: { tr: 'Yeni konum: üç liderin önerdiği konumların ortalaması, sınırlara kırpılmış.', en: 'New position: the average of the positions suggested by the three leaders, clamped to the bounds.' } }
      ]
    },
    notes: {
      tr: ['Konum güncellemesinde <code>a</code> sıfıra yaklaştıkça <code>A</code> küçülür ve tüm kurtlar liderlerin etrafında toplanır; bu, son iterasyonlarda hassas ama <b>geri dönüşsüz</b> bir sömürü anlamına gelir.', 'Kodda liderler her iterasyonun başında bir kez belirlenir; kurtlar konumunu güncellerken liderler değişmez.', 'GWO\'nun bilinen bir eleştirisi, optimumun arama uzayının <b>merkezinde</b> (örneğin 0,0) olduğu problemlerde, ortalama alma sebebiyle gereğinden iyi görünmesidir. Optimum merkezde olmayan fonksiyonlarda (Himmelblau) davranışı kontrol edin.'],
      en: ['As <code>a</code> approaches zero, <code>A</code> shrinks and all wolves gather around the leaders; in the last iterations this means precise but <b>irreversible</b> exploitation.', 'In the code the leaders are determined once at the start of each iteration; they do not change while the wolves update.', 'A known criticism of GWO is that, because of the averaging, it can look better than it deserves on problems whose optimum lies at the <b>centre</b> of the search space (e.g. (0,0)). Check its behaviour on functions whose optimum is off-centre (Himmelblau).']
    },
    params: {
      tr: [['Kurt sayısı', 'Çok kurt = daha iyi keşif. 20–30 çoğu 2–10 boyutlu problem için yeterlidir.'], ['Iterasyon', '<code>a</code> doğrusal azaldığı için iterasyon sayısı, keşif/sömürü dengesini de belirler.']],
      en: [['Number of wolves', 'More wolves = better exploration. 20–30 is enough for most 2–10 dimensional problems.'], ['Iterations', 'Because <code>a</code> decreases linearly, the iteration count also sets the exploration/exploitation balance.']]
    },
    pros: { tr: ['Neredeyse hiç ayar gerektirmez', 'Kolay uygulanır', 'Hızlı yakınsar'], en: ['Needs almost no tuning', 'Easy to implement', 'Converges quickly'] },
    cons: { tr: ['Erken yakınsama ve çeşitlilik kaybı', 'Optimumu merkezde olan problemlerde yanıltıcı olabilir', 'Yüksek boyutlu çok modlu problemlerde zayıflar'], en: ['Premature convergence and loss of diversity', 'Can be misleading on problems with the optimum at the centre', 'Weakens on high-dimensional multimodal problems'] }
  });
})();
