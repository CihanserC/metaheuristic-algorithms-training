/* More added algorithms, part 1: Iterated Local Search, VNS, Great Deluge, Threshold Accepting, GRASP, Memetic. */
(function () {
  'use strict';
  const { h, t, col } = MH;
  const S = window.Sims;

  /* shared drawing for the 1-D single-solution demos (maximise S.hcF on [0,10]) */
  function plot1D(ctx, sim, extra) {
    const p = MH.fnPlot(ctx, S.hcF, 0, 10, { x: 0, y: 0, w: 760, h: 270 });
    if (extra) extra(ctx, p);
    return p;
  }
  const chartHist = (ctx, sim, extraSeries = []) => MH.chart(ctx, 0, 280, 760, 140, [
    { data: sim.hist, color: col('--accent'), label: { tr: 'f(mevcut)', en: 'f(current)' } },
    { data: sim.bestHist, color: col('--good'), label: { tr: 'en iyi', en: 'best' }, width: 2 }, ...extraSeries], { title: { tr: 'Uygunluk geçmişi', en: 'Fitness history' } });
  const common1D = [[{ tr: 'Iterasyon', en: 'Iteration' }]];

  /* ================= Iterated Local Search ================= */
  MH.algoPage({
    id: 'ils', group: 'g_local', origin: 'added',
    title: { tr: 'Iterated Local Search (ILS)', en: 'Iterated Local Search (ILS)' },
    nav: { tr: 'Iterated Local Search', en: 'Iterated Local Search' },
    blurb: { tr: 'Yerel arama + sarsma: tepeye çık, kendini fırlat, yeniden tırman.', en: 'Local search + kick: climb, throw yourself away, climb again.' },
    tagline: { tr: 'Hill Climbing\'in en doğal "takılınca ne yapmalı?" cevabı.', en: 'The most natural answer of Hill Climbing to "what to do when stuck?"' },
    files: ['IteratedLocalSearch.py'],
    intuition: {
      tr: ['Rastgele yeniden başlatma, her seferinde bilgiyi çöpe atar. ILS ise iyi bir yerel optimuma <b>yakın bir yerden</b> yeniden başlar: mevcut tepeyi "sarsar" (perturbation) ve oradan tekrar tırmanır.', 'İyi yerel optimumlar çoğunlukla birbirine yakındır; bu yüzden sarsma küçük ama yerel aramanın kaçamayacağı kadar güçlü olmalıdır. Yeni tepe daha iyiyse kabul edilir, değilse eski tepeye dönülür.'],
      en: ['A random restart throws all information away. ILS restarts <b>near a good local optimum</b>: it "kicks" (perturbs) the current peak and climbs again from there.', 'Good local optima tend to lie close to each other, so the kick should be small but strong enough that the local search cannot undo it. If the new peak is better it is accepted, otherwise we return to the old one.']
    },
    steps: {
      tr: ['Rastgele başla ve yerel aramayla (Hill Climbing) bir yerel optimuma tırman.', '<b>Sarsma</b>: yerel optimumdan <code>kick</code> kadar rastgele uzağa fırla.', 'Fırlatılan noktadan yeniden yerel aramayla tırman.', '<b>Kabul kriteri</b>: yeni yerel optimum eskisinden kötü değilse onu kabul et, değilse eskisine dön.', 'En iyi yerel optimumu hatırla; belirlenen iterasyona kadar 2–4\'ü tekrarla.'],
      en: ['Start at random and climb to a local optimum with local search (hill climbing).', '<b>Perturbation</b>: jump randomly up to <code>kick</code> away from the local optimum.', 'Climb again from the kicked point with local search.', '<b>Acceptance criterion</b>: accept the new local optimum if it is not worse than the old one, otherwise go back.', 'Remember the best local optimum; repeat 2–4 until the iteration limit.']
    },
    demo(root) {
      const P = { delta: 0.3, patience: 25, kick: 2.5, iters: 800 }; let sim;
      MH.demo(root, {
        w: 760, h: 420, sps: 30, maxSps: 400,
        init(k) { sim = S.ils({ ...P }, MH.rngFor(k.seed)); },
        step: () => sim.step(), isDone: () => sim.done,
        draw(ctx) {
          const p = plot1D(ctx, sim);
          if (sim.opt !== null) { ctx.fillStyle = col('--violet'); ctx.beginPath(); const x = p.X(sim.opt), y = p.Y(S.hcF(sim.opt)); ctx.moveTo(x, y - 9); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 9); ctx.lineTo(x - 7, y); ctx.fill(); }
          MH.dot(ctx, p.X(sim.best), p.Y(S.hcF(sim.best)), 10, 'transparent', true);
          MH.dot(ctx, p.X(sim.work), p.Y(S.hcF(sim.work)), 6, col(sim.kicked ? '--warm' : '--accent'), true);
          chartHist(ctx, sim);
        },
        stats: () => [[{ tr: 'Iterasyon', en: 'Iteration' }, sim.iter], [{ tr: 'Sarsma sayısı', en: 'Kicks' }, sim.kicks], [{ tr: 'f(kabul edilen optimum)', en: 'f(accepted optimum)' }, sim.opt === null ? '–' : MH.fmt(S.hcF(sim.opt))], [{ tr: 'f(en iyi)', en: 'f(best)' }, MH.fmt(S.hcF(sim.best))]],
        explain: () => sim.kicked ? t({ tr: `Yerel optimuma ulaşıldı → ${sim.lastAccepted ? '<b>kabul edildi</b> (eskisinden kötü değil)' : '<b>reddedildi</b>, eski optimuma dönüldü'}. Turuncu nokta: yeni sarsma sonrası başlangıç.`, en: `Local optimum reached → ${sim.lastAccepted ? '<b>accepted</b> (not worse than the old one)' : '<b>rejected</b>, back to the old optimum'}. The orange dot is the start after the new kick.` }) : t({ tr: 'Mor baklava: şu an kabul edilmiş yerel optimum. Mavi nokta yerel aramayla tırmanıyor; takılınca (sabır kadar adım) sarsılır.', en: 'The purple diamond is the currently accepted local optimum. The blue dot climbs by local search; once stuck (for "patience" steps) it is kicked.' }),
        controls: k => [
          MH.slider({ label: { tr: 'Adım boyu δ', en: 'Step size δ' }, min: 0.05, max: 1, step: 0.05, value: P.delta, fmt: v => v.toFixed(2), onInput: v => { P.delta = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Sabır', en: 'Patience' }, min: 5, max: 80, value: P.patience, onInput: v => { P.patience = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Sarsma gücü', en: 'Kick strength' }, min: 0.2, max: 6, step: 0.1, value: P.kick, fmt: v => v.toFixed(1), onInput: v => { P.kick = v; k.restart(); } })
        ],
        legend: MH.legend([['--accent', { tr: 'yerel aramadaki nokta', en: 'point under local search' }], ['--warm', { tr: 'sarsma sonrası', en: 'just after a kick' }], ['--violet', { tr: 'kabul edilen optimum', en: 'accepted optimum' }], ['--good', { tr: 'en iyi', en: 'best' }]])
      });
    },
    anns: {
      'IteratedLocalSearch.py': [
        { find: 'def __init__', span: 9, text: { tr: '<code>patience</code> yerel optimumu tanımanın ölçütü; <code>kick</code> sarsmanın gücü.', en: '<code>patience</code> is how we recognise a local optimum; <code>kick</code> is the strength of the perturbation.' } },
        { find: '# 1. local search', span: 7, text: { tr: '<b>Yerel arama</b>: sadece iyileştiren komşuya geçen Hill Climbing.', en: '<b>Local search</b>: plain hill climbing that only moves to improving neighbours.' } },
        { find: '# 2. we are stuck', span: 2, text: { tr: '<code>stuck</code> sabrı aşarsa mevcut nokta yerel optimumdur.', en: 'If <code>stuck</code> exceeds the patience the current point is a local optimum.' } },
        { find: '# 3. acceptance criterion', span: 6, text: { tr: '<b>Kabul kriteri</b>: yeni optimum eskisinden kötü değilse kabul; en iyiyi güncelle.', en: '<b>Acceptance criterion</b>: accept the new optimum if not worse than the old one; update the best.' } },
        { find: '# 4. perturbation', span: 3, text: { tr: '<b>Sarsma</b>: kabul edilmiş optimumdan rastgele fırla ve yeniden tırman.', en: '<b>Perturbation</b>: jump randomly from the accepted optimum and climb again.' } }
      ]
    },
    notes: {
      tr: ['Burada kabul kriteri <b>"daha iyi veya eşit"</b>tir. "Her zaman kabul et" rastgele yürüyüşe, "yalnızca daha iyi" ise erken takılmaya yol açar; ara yollar (tavlama benzeri kabul) da kullanılır.', 'Sarsma gücü ILS\'nin en kritik parametresidir: çok küçükse yerel arama aynı tepeye geri düşer, çok büyükse arama rastgele yeniden başlatmaya döner. Kaydırıcıyla 0.2 ve 6 değerlerini deneyin.', 'Burada yerel arama Hill Climbing; gerçek uygulamalarda TSP için 2-opt/Or-opt, sürekli problemler için gradyan iniş gibi çok daha güçlü yerel aramalar kullanılır.'],
      en: ['The acceptance criterion here is <b>"better or equal"</b>. "Always accept" leads to a random walk, "only better" to early stalling; in-between rules (annealing-like acceptance) are also used.', 'The kick strength is the most critical parameter of ILS: too small and the local search falls back to the same peak, too large and the search degenerates into random restarts. Try 0.2 and 6 with the slider.', 'The local search here is hill climbing; in practice much stronger local searches are used, such as 2-opt/Or-opt for TSP or gradient descent for continuous problems.']
    },
    params: {
      tr: [['Sarsma gücü', 'Yerel aramanın kaçamayacağı kadar büyük, iyi bölgeden uzaklaşmayacak kadar küçük olmalı.'], ['Sabır', 'Yerel optimumu tanıma ölçütü; çok küçükse yanlış yerde "takıldı" sanılır.'], ['Adım boyu', 'Yerel aramanın hassasiyetini belirler.']],
      en: [['Kick strength', 'Large enough that local search cannot undo it, small enough not to leave the good region.'], ['Patience', 'The criterion for recognising a local optimum; too small and it wrongly thinks it is stuck.'], ['Step size', 'Sets the precision of the local search.']]
    },
    pros: { tr: ['Hill Climbing\'e göre çok daha güçlü, kodu hâlâ kısa', 'Her yerel arama prosedürüyle kullanılabilir', 'Rastgele yeniden başlatmaktan daha verimli'], en: ['Much stronger than hill climbing with similarly short code', 'Works with any local search procedure', 'More efficient than random restarts'] },
    cons: { tr: ['Sarsma gücü probleme göre ayarlanmalı', 'Tek çözümle ilerler', 'Kabul kriteri seçimi sonucu etkiler'], en: ['The kick strength must be tuned per problem', 'Follows a single solution', 'The choice of acceptance criterion affects the result'] }
  });

  /* ================= Variable Neighborhood Search ================= */
  MH.algoPage({
    id: 'vns', group: 'g_local', origin: 'added',
    title: { tr: 'Değişken Komşuluk Arama (VNS)', en: 'Variable Neighborhood Search (VNS)' },
    nav: { tr: 'Değişken Komşuluk (VNS)', en: 'Variable Neighborhood (VNS)' },
    blurb: { tr: 'Takılınca komşuluğu büyütür, iyileşince küçük komşuluğa döner.', en: 'Enlarges the neighbourhood when stuck and shrinks it again after an improvement.' },
    tagline: { tr: '"Bir yerel optimum, başka bir komşulukta yerel optimum olmayabilir."', en: '"A local optimum in one neighbourhood need not be a local optimum in another."' },
    files: ['VariableNeighborhoodSearch.py'],
    intuition: {
      tr: ['VNS, bir tepeden kurtulmak için sistematik olarak <b>daha uzağa</b> bakar: önce küçük komşulukta (k=1) rastgele bir nokta seçer, oradan yerel aramaya başlar. İyileşme yoksa komşuluğu büyütür (k=2, 3, …).', 'İyileşme bulunursa yeni noktaya geçer ve <b>tekrar en küçük komşuluğa</b> döner: önce yakın çevre, ancak gerekirse uzak çevre.'],
      en: ['To escape from a peak VNS systematically looks <b>farther away</b>: first it picks a random point in a small neighbourhood (k=1) and starts a local search from there. If there is no improvement it enlarges the neighbourhood (k=2, 3, …).', 'When an improvement is found it moves to the new point and <b>returns to the smallest neighbourhood</b>: near first, far only when needed.']
    },
    steps: {
      tr: ['Başlangıç noktası seç; <code>k = 1</code>.', '<b>Sarsma</b>: mevcut noktanın k. komşuluğundan (yarıçap = k·r) rastgele bir nokta seç.', '<b>Yerel arama</b>: o noktadan küçük adımlarla iniş yap.', 'Sonuç mevcut noktadan iyiyse oraya geç ve <code>k = 1</code> yap; değilse <code>k ← k + 1</code> (k_max aşılırsa 1).', 'İterasyon sayısı bitene kadar tekrarla.'],
      en: ['Pick a starting point; <code>k = 1</code>.', '<b>Shaking</b>: pick a random point from the k-th neighbourhood of the current point (radius = k·r).', '<b>Local search</b>: descend from that point with small steps.', 'If the result is better than the current point move there and set <code>k = 1</code>; otherwise <code>k ← k + 1</code> (back to 1 after k_max).', 'Repeat until the iteration limit.']
    },
    demo(root) {
      const P = { fn: 'rastrigin', r0: 0.04, kmax: 6, ls: 25, lsStep: 0.02, iters: 120 };
      MH.demo2D(root, {
        P, sps: 3, make: (p, seed) => S.vns({ ...p }, MH.rngFor(seed)),
        points: sim => [{ x: sim.cur.x[0], y: sim.cur.x[1], c: col('--accent'), r: 6 }],
        extra(ctx, sim, m) {
          const fn = sim.fn, ppu = 420 / (fn.max - fn.min), cx = m.X(sim.cur.x[0]), cy = m.Y(sim.cur.x[1]);
          if (sim.shake) {
            const r = sim.radius * ppu; ctx.strokeStyle = col('--warm'); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.strokeRect(cx - r, cy - r, 2 * r, 2 * r); ctx.setLineDash([]);
            ctx.strokeStyle = col('--violet'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(m.X(sim.shake[0]), m.Y(sim.shake[1])); ctx.lineTo(m.X(sim.result[0]), m.Y(sim.result[1])); ctx.stroke();
            MH.dot(ctx, m.X(sim.shake[0]), m.Y(sim.shake[1]), 4, col('--warm'), true);
            MH.dot(ctx, m.X(sim.result[0]), m.Y(sim.result[1]), 5, col(sim.improved ? '--good' : '--bad'), true);
          }
        },
        stats: sim => [['k', sim.k], [{ tr: 'f(mevcut)', en: 'f(current)' }, MH.fmt(sim.cur.f, 4)]],
        explain: sim => sim.shake ? t({ tr: `Son deneme: k=${sim.usedK} komşuluğunda sarsma (turuncu kare = komşuluk, turuncu nokta = sarsılan nokta), yerel aramayla sonuç ${sim.improved ? '<b>iyileşti</b> → k=1' : '<b>iyileşmedi</b> → komşuluk büyütülüyor'}.`, en: `Last try: shaking in neighbourhood k=${sim.usedK} (orange square = neighbourhood, orange dot = shaken point); the local search ${sim.improved ? '<b>improved</b> → k=1' : '<b>did not improve</b> → the neighbourhood grows'}.` }) : t({ tr: 'Adım\'a basın: mavi nokta mevcut durum. Turuncu kare k. komşuluk, yeşil/kırmızı nokta yerel aramanın sonucu.', en: 'Press Step: the blue dot is the current state. The orange square is the k-th neighbourhood; the green/red dot is the local search result.' }),
        controls: (k, p) => [
          MH.slider({ label: { tr: 'Komşuluk sayısı kmax', en: 'Neighbourhoods kmax' }, min: 2, max: 12, value: p.kmax, onInput: v => { p.kmax = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Temel yarıçap r', en: 'Base radius r' }, min: 0.01, max: 0.15, step: 0.01, value: p.r0, fmt: v => v.toFixed(2), onInput: v => { p.r0 = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Yerel arama adımı', en: 'Local search steps' }, min: 5, max: 60, step: 5, value: p.ls, onInput: v => { p.ls = v; k.restart(); } })
        ],
        legend: MH.legend([['--accent', { tr: 'mevcut durum', en: 'current state' }], ['--warm', { tr: 'komşuluk / sarsılan nokta', en: 'neighbourhood / shaken point' }], ['--good', { tr: 'iyileşen sonuç', en: 'improved result' }], ['--bad', { tr: 'iyileşmeyen sonuç', en: 'non-improving result' }]])
      });
    },
    anns: {
      'VariableNeighborhoodSearch.py': [
        { find: 'def __init__', span: 14, text: { tr: '<code>k_max</code> komşuluk sayısı; k. komşuluk <code>k·radius</code> yarıçaplı kutudur.', en: '<code>k_max</code> is the number of neighbourhoods; the k-th is a box of radius <code>k·radius</code>.' } },
        { find: '# 1. shaking', span: 2, text: { tr: '<b>Sarsma</b>: k. komşuluktan rastgele nokta. k büyüdükçe daha uzağa fırlar.', en: '<b>Shaking</b>: a random point from the k-th neighbourhood. The larger k, the farther it jumps.' } },
        { find: '# 2. local search', span: 2, text: { tr: 'Sarsılan noktadan yerel arama.', en: 'Local search from the shaken point.' } },
        { find: '# 3. move or change', span: 6, text: { tr: '<b>Taşın ya da komşuluğu değiştir</b>: iyileşme → k=1; yoksa k+1 (k_max\'tan sonra 1).', en: '<b>Move or change the neighbourhood</b>: improvement → k=1; otherwise k+1 (back to 1 after k_max).' } },
        { find: 'def local_search', span: 8, text: { tr: 'Gauss adımlarıyla basit rastgele iniş: yalnızca iyileştiren komşu kabul edilir.', en: 'A simple stochastic descent with Gaussian steps: only improving neighbours are accepted.' } }
      ]
    },
    notes: {
      tr: ['Bu sürüm "<b>temel VNS</b>"tir. Yerel aramanın içinde de komşulukları değiştirirseniz <b>VND</b> (Variable Neighborhood Descent), ikisini birleştirirseniz <b>General VNS</b> elde edilir.', 'Komşuluk yapıları iç içe olmak zorunda değildir: TSP\'de "2 şehri değiştir", "bir parçayı ters çevir", "bir şehri başka yere taşı" gibi tamamen farklı hamle türleri de farklı komşuluklar sayılır.', 'Kodda yerel arama bütçesi (<code>ls_steps</code>) sabittir; yetersiz kalırsa sarsılan nokta tam olarak bir yerel optimuma ulaşamaz.'],
      en: ['This is the "<b>basic VNS</b>". Changing neighbourhoods inside the local search gives <b>VND</b> (Variable Neighborhood Descent); combining the two gives <b>General VNS</b>.', 'Neighbourhoods need not be nested: in TSP entirely different move types ("swap 2 cities", "reverse a segment", "relocate a city") also count as different neighbourhoods.', 'The local search budget (<code>ls_steps</code>) is fixed in the code; if it is too small the shaken point cannot reach a true local optimum.']
    },
    params: {
      tr: [['kmax', 'En geniş komşuluk. Çok küçükse uzak tepelere ulaşamaz; çok büyükse zaman rastgele aramaya gider.'], ['Temel yarıçap r', 'k=1 komşuluğunun boyu.'], ['Yerel arama adımı', 'Sarsılan noktanın ne kadar iyi inebileceğini belirler.']],
      en: [['kmax', 'The widest neighbourhood. Too small and distant peaks stay out of reach; too large and time is wasted on random search.'], ['Base radius r', 'The size of the k=1 neighbourhood.'], ['Local search steps', 'Sets how well the shaken point can descend.']]
    },
    pros: { tr: ['Çok az parametre', 'Önce yakın, gerekirse uzak: verimli keşif', 'Birçok problem türüne uyar'], en: ['Very few parameters', 'Near first, far only if needed: efficient exploration', 'Fits many kinds of problems'] },
    cons: { tr: ['İyi komşuluk yapıları tasarlamak gerekir', 'Tek çözümle ilerler', 'Çok yüksek boyutta komşuluklar çok büyür'], en: ['Good neighbourhood structures must be designed', 'Follows a single solution', 'Neighbourhoods blow up in very high dimensions'] }
  });

  /* ================= Great Deluge ================= */
  MH.algoPage({
    id: 'great-deluge', group: 'g_local', origin: 'added',
    title: { tr: 'Büyük Tufan (Great Deluge)', en: 'Great Deluge' },
    nav: { tr: 'Great Deluge', en: 'Great Deluge' },
    blurb: { tr: 'Yükselen su seviyesi: seviyenin altına düşen çözümler reddedilir.', en: 'A rising water level: solutions that fall below it are rejected.' },
    tagline: { tr: 'Tavlamanın tek parametreli, rastgelesiz kuzeni.', en: 'The one-parameter, randomness-free cousin of annealing.' },
    files: ['GreatDeluge.py'],
    intuition: {
      tr: ['Tufan bir dağlık araziyi basıyor; arama yapan <b>yürüyen biri</b> ise ıslanmak istemiyor. Su yükseldikçe alçak vadiler suyla dolar ve yürüyüş alanı gittikçe en yüksek tepeye doğru daralır.', 'Kural çok basit: yeni nokta <b>su seviyesinin üstündeyse</b> kabul edilir (mevcut noktadan kötü olsa bile). Su her adımda sabit bir miktar yükselir ("yağmur"). Rastgelelik yoktur; yalnızca bir parametre (yağış hızı) vardır.'],
      en: ['A flood covers a mountain landscape; the searching <b>walker</b> does not want to get wet. As the water rises the low valleys fill up and the walking area shrinks towards the highest peak.', 'The rule is simple: a new point is accepted if it is <b>above the water level</b> (even if worse than the current point). The water rises by a fixed amount each step ("rain"). There is no randomness in the decision and essentially one parameter (the rain speed).']
    },
    steps: {
      tr: ['Başlangıç noktası seç; su seviyesini başlangıç değerinin biraz altına koy.', 'Rastgele bir komşu üret.', 'Komşunun değeri <b>su seviyesinin üstündeyse</b> oraya geç.', 'Su seviyesini <code>rain</code> kadar yükselt.', 'Seviye en iyi noktaya ulaşıp hareket imkânı kalmayana veya iterasyon bitene kadar tekrarla.'],
      en: ['Pick a starting point; put the water level a little below its value.', 'Generate a random neighbour.', 'If the neighbour\'s value is <b>above the water level</b>, move there.', 'Raise the water level by <code>rain</code>.', 'Repeat until the level reaches the best point and no move is possible, or until the iteration limit.']
    },
    demo(root) {
      const P = { delta: 0.3, depth: 1.5, rain: 0.004, iters: 800 }; let sim;
      MH.demo(root, {
        w: 760, h: 420, sps: 30, maxSps: 400,
        init(k) { sim = S.greatDeluge({ ...P }, MH.rngFor(k.seed)); },
        step: () => sim.step(), isDone: () => sim.done,
        draw(ctx) {
          const p = plot1D(ctx, sim, (c, pp) => {});
          const yl = p.Y(sim.level); ctx.fillStyle = 'rgba(60,120,255,.25)'; ctx.fillRect(0, yl, 760, 270 - yl);
          ctx.strokeStyle = col('--accent'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, yl); ctx.lineTo(760, yl); ctx.stroke();
          if (sim.iter) MH.dot(ctx, p.X(sim.cand), p.Y(S.hcF(sim.cand)), 5, col(sim.moved ? '--good' : '--bad'));
          MH.dot(ctx, p.X(sim.best), p.Y(S.hcF(sim.best)), 10, 'transparent', true);
          MH.dot(ctx, p.X(sim.x), p.Y(S.hcF(sim.x)), 7, col('--accent'), true);
          chartHist(ctx, sim, [{ data: sim.levels, color: col('--warm'), label: { tr: 'su seviyesi', en: 'water level' } }]);
        },
        stats: () => [[{ tr: 'Iterasyon', en: 'Iteration' }, sim.iter], [{ tr: 'Su seviyesi', en: 'Water level' }, MH.fmt(sim.level)], [{ tr: 'f(mevcut)', en: 'f(current)' }, MH.fmt(S.hcF(sim.x))], [{ tr: 'f(en iyi)', en: 'f(best)' }, MH.fmt(S.hcF(sim.best))]],
        explain: () => sim.iter ? (sim.level > S.hcF(sim.best) + 1e-9 ? t({ tr: 'Su en iyi noktanın üstüne çıktı: artık hiçbir hareket kabul edilmez, arama donar.', en: 'The water rose above the best point: no move is accepted any more and the search freezes.' }) : t({ tr: `Komşu ${sim.moved ? '<b>suyun üstünde → kabul</b>' : '<b>suyun altında → ret</b>'}. Su yükseldikçe yürünebilen bölge daralıyor.`, en: `The neighbour is ${sim.moved ? '<b>above the water → accepted</b>' : '<b>below the water → rejected</b>'}. As the water rises the walkable region shrinks.` })) : t({ tr: 'Mavi alan su. Başlangıçta su, mevcut noktanın altında; bu yüzden kötüleşen hamleler de kabul edilir.', en: 'The blue area is water. At the start the water is below the current point, so worse moves are accepted too.' }),
        controls: k => [
          MH.slider({ label: { tr: 'Yağış hızı', en: 'Rain speed' }, min: 0.001, max: 0.02, step: 0.001, value: P.rain, fmt: v => v.toFixed(3), onInput: v => { P.rain = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Başlangıç derinliği', en: 'Initial depth' }, min: 0, max: 3, step: 0.1, value: P.depth, fmt: v => v.toFixed(1), onInput: v => { P.depth = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Adım boyu δ', en: 'Step size δ' }, min: 0.05, max: 1, step: 0.05, value: P.delta, fmt: v => v.toFixed(2), onInput: v => { P.delta = v; k.restart(); } })
        ],
        legend: MH.legend([['--accent', { tr: 'mevcut + su seviyesi', en: 'current + water level' }], ['--good', { tr: 'kabul edilen komşu', en: 'accepted neighbour' }], ['--bad', { tr: 'reddedilen komşu', en: 'rejected neighbour' }]])
      });
    },
    anns: {
      'GreatDeluge.py': [
        { find: 'def __init__', span: 9, text: { tr: '<code>depth</code> başlangıçta suyun ne kadar altta olduğu; <code>rain</code> yağış hızı.', en: '<code>depth</code> is how far below the start the water begins; <code>rain</code> is the rain speed.' } },
        { find: '# we are maximizing', span: 2, text: { tr: 'Maksimizasyon: su seviyesi kabul için gereken en düşük kalite.', en: 'Maximisation: the level is the minimum quality required for acceptance.' } },
        { find: '# the only parameter-free rule', span: 4, text: { tr: '<b>Kabul kuralı</b>: suyun üstündeki her nokta kabul edilir; mevcut noktaya göre kötüleşme önemli değil.', en: '<b>Acceptance rule</b>: everything above the water is accepted; deterioration relative to the current point does not matter.' } },
        { find: '# the rain', span: 2, text: { tr: 'Yağmur: su her iterasyonda yükselir; arama alanı giderek daralır.', en: 'The rain: the water rises every iteration and the search area gradually shrinks.' } }
      ]
    },
    notes: {
      tr: ['Kodda tek bir kabul koşulu var (<code>f(new) &gt;= level</code>); karar tamamen <b>deterministiktir</b>. Tavlamadaki "kabul olasılığı" burada su seviyesinin yarattığı sert bir eşik olur.', 'Yağış hızı iterasyon bütçesine bağlanabilir: <code>rain = (hedef_seviye − başlangıç_seviyesi) / max_iteration</code>. Böylece su tam bütçe bitince hedef seviyeye ulaşır.', 'Hızlı yağış arama alanını çabuk daraltır ve yerel tepeye hapseder; yavaş yağış daha çok keşif ve daha çok iterasyon demektir.'],
      en: ['The code has a single acceptance condition (<code>f(new) &gt;= level</code>); the decision is completely <b>deterministic</b>. What is an "acceptance probability" in annealing becomes a hard threshold set by the water level here.', 'The rain speed can be tied to the iteration budget: <code>rain = (target_level − start_level) / max_iteration</code>, so the water reaches the target level exactly when the budget ends.', 'Fast rain shrinks the search area quickly and traps it on a local peak; slow rain means more exploration and more iterations.']
    },
    params: {
      tr: [['Yağış hızı', 'Tavlamadaki soğuma hızının karşılığı: küçük = yavaş, daha güvenilir.'], ['Başlangıç derinliği', 'Suyun başlangıçta mevcut noktadan ne kadar aşağıda olduğu = başlangıç keşif miktarı.']],
      en: [['Rain speed', 'The counterpart of the cooling rate in annealing: small = slow and more reliable.'], ['Initial depth', 'How far below the current point the water starts = the amount of initial exploration.']]
    },
    pros: { tr: ['Neredeyse tek parametre', 'Rastgele kabul olasılığı gerekmez', 'Tavlamaya benzer güvenilirlik'], en: ['Essentially a single parameter', 'No random acceptance probability needed', 'Reliability similar to annealing'] },
    cons: { tr: ['Su seviyesi uygunluk ölçeğine bağlı: ölçek bilinmeli', 'Su çok yükselirse arama donar', 'Tek çözümle ilerler'], en: ['The level depends on the fitness scale: the scale must be known', 'The search freezes if the water rises too high', 'Follows a single solution'] }
  });

  /* ================= Threshold Accepting ================= */
  MH.algoPage({
    id: 'threshold-accepting', group: 'g_local', origin: 'added',
    title: { tr: 'Eşik Kabulü (Threshold Accepting)', en: 'Threshold Accepting' },
    nav: { tr: 'Threshold Accepting', en: 'Threshold Accepting' },
    blurb: { tr: 'Belli bir eşiğe kadar kötüleşmeyi kabul eder; eşik zamanla küçülür.', en: 'Accepts deterioration up to a threshold that shrinks over time.' },
    tagline: { tr: 'Tavlamanın rastgelesiz hali: olasılık yerine sabit bir tolerans.', en: 'Annealing without randomness: a fixed tolerance instead of a probability.' },
    files: ['ThresholdAccepting.py'],
    intuition: {
      tr: ['Tavlama, kötü hamleleri <code>e<sup>−Δ/T</sup></code> olasılığıyla kabul eder. Threshold Accepting aynı fikri <b>deterministik</b> yapar: kötüleşme <code>T</code>\'den küçükse <b>kesinlikle</b> kabul, büyükse <b>kesinlikle</b> ret.', '<code>T</code> zamanla küçülür; sonunda yalnızca iyileştiren hareketler kabul edilir. Zar atmayı kaldırdığı için uygulaması ve analizi daha basittir; deneylerde çoğu zaman tavlamayla yarışır.'],
      en: ['Annealing accepts bad moves with probability <code>e<sup>−Δ/T</sup></code>. Threshold Accepting makes the same idea <b>deterministic</b>: a deterioration smaller than <code>T</code> is <b>always</b> accepted, a larger one is <b>always</b> rejected.', '<code>T</code> shrinks over time until only improving moves are accepted. Removing the dice roll makes it simpler to implement and analyse; in experiments it often competes with annealing.']
    },
    steps: {
      tr: ['Rastgele başlangıç ve yüksek eşik <code>T</code>.', 'Rastgele komşu üret.', 'Komşu mevcut noktadan <code>T</code>\'den fazla kötü değilse kabul et.', 'Eşiği küçült: <code>T ← T · decay</code>.', 'En iyiyi hatırla ve tekrarla.'],
      en: ['Random start and a high threshold <code>T</code>.', 'Generate a random neighbour.', 'Accept the neighbour if it is not worse than the current point by more than <code>T</code>.', 'Shrink the threshold: <code>T ← T · decay</code>.', 'Remember the best and repeat.']
    },
    demo(root) {
      const P = { delta: 0.3, t0: 1.0, decay: 0.99, iters: 800 }; let sim;
      MH.demo(root, {
        w: 760, h: 420, sps: 30, maxSps: 400,
        init(k) { sim = S.thresholdAccepting({ ...P }, MH.rngFor(k.seed)); },
        step: () => sim.step(), isDone: () => sim.done,
        draw(ctx) {
          const p = plot1D(ctx, sim);
          const yc = p.Y(S.hcF(sim.x)), yt = p.Y(S.hcF(sim.x) - sim.T);
          ctx.fillStyle = 'rgba(240,138,0,.18)'; ctx.fillRect(0, yc, 760, Math.max(0, Math.min(270, yt) - yc));
          ctx.strokeStyle = col('--warm'); ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(0, yt); ctx.lineTo(760, yt); ctx.stroke(); ctx.setLineDash([]);
          if (sim.iter) MH.dot(ctx, p.X(sim.cand), p.Y(S.hcF(sim.cand)), 5, col(sim.moved ? '--good' : '--bad'));
          MH.dot(ctx, p.X(sim.best), p.Y(S.hcF(sim.best)), 10, 'transparent', true);
          MH.dot(ctx, p.X(sim.x), p.Y(S.hcF(sim.x)), 7, col('--accent'), true);
          chartHist(ctx, sim);
        },
        stats: () => [[{ tr: 'Iterasyon', en: 'Iteration' }, sim.iter], ['T', MH.fmt(sim.T, 3)], [{ tr: 'f(mevcut)', en: 'f(current)' }, MH.fmt(S.hcF(sim.x))], [{ tr: 'f(en iyi)', en: 'f(best)' }, MH.fmt(S.hcF(sim.best))]],
        explain: () => sim.iter ? t({ tr: `Turuncu bant: mevcut noktanın altında kabul edilen tolerans (T=${MH.fmt(sim.T, 2)}). Komşu bandın içinde olduğundan ${sim.moved ? '<b>kabul</b>' : '<b>ret</b>'} edildi.`, en: `The orange band is the tolerance below the current point (T=${MH.fmt(sim.T, 2)}). The neighbour was ${sim.moved ? '<b>accepted</b>' : '<b>rejected</b>'}.` }) : t({ tr: 'Turuncu bant, mevcut noktanın altında kabul edilen kötüleşme miktarıdır; zamanla daralır.', en: 'The orange band is the deterioration we accept below the current point; it narrows over time.' }),
        controls: k => [
          MH.slider({ label: { tr: 'Başlangıç eşiği', en: 'Initial threshold' }, min: 0.1, max: 3, step: 0.1, value: P.t0, fmt: v => v.toFixed(1), onInput: v => { P.t0 = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Azalma çarpanı', en: 'Decay factor' }, min: 0.95, max: 0.999, step: 0.001, value: P.decay, fmt: v => v.toFixed(3), onInput: v => { P.decay = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Adım boyu δ', en: 'Step size δ' }, min: 0.05, max: 1, step: 0.05, value: P.delta, fmt: v => v.toFixed(2), onInput: v => { P.delta = v; k.restart(); } })
        ],
        legend: MH.legend([['--accent', { tr: 'mevcut', en: 'current' }], ['--warm', { tr: 'kabul edilen tolerans', en: 'accepted tolerance' }], ['--good', { tr: 'kabul', en: 'accepted' }], ['--bad', { tr: 'ret', en: 'rejected' }]])
      });
    },
    anns: {
      'ThresholdAccepting.py': [
        { find: 'def __init__', span: 10, text: { tr: '<code>threshold</code> tolerans, <code>decay</code> her iterasyondaki küçülme çarpanı.', en: '<code>threshold</code> is the tolerance, <code>decay</code> the shrink factor per iteration.' } },
        { find: '# unlike simulated annealing', span: 5, text: { tr: '<b>Kabul kuralı</b>: kötüleşme eşikten küçükse kabul; rastgelelik yok.', en: '<b>Acceptance rule</b>: accept if the deterioration is smaller than the threshold; no randomness.' } },
        { find: 'threshold *= self.decay', span: 1, text: { tr: 'Eşik geometrik olarak küçülür (tavlamadaki soğutmanın karşılığı).', en: 'The threshold shrinks geometrically (the counterpart of cooling in annealing).' } }
      ]
    },
    notes: {
      tr: ['Aynı fikrin başka varyantlarında eşik, <b>en iyi çözüme göre</b> (Record-to-Record Travel) ya da <b>su seviyesi</b> gibi (Great Deluge) tanımlanır. Üçü de "bir kabul bandı kullan, zamanla daralt" ailesindendir.', 'Eşik problemin uygunluk ölçeğine bağlıdır: uygunluk değerleri 1000\'lerle ölçülüyorsa T=1 anlamsızdır. Genelde eşik, tipik komşu farklarından türetilir.', 'Deterministik olduğu için aynı tohumla tekrar çalıştırmak çok daha tekrarlanabilir sonuç verir.'],
      en: ['In other variants of the same idea the threshold is defined <b>relative to the best solution</b> (Record-to-Record Travel) or as a <b>water level</b> (Great Deluge). All three belong to the "use an acceptance band and shrink it" family.', 'The threshold depends on the fitness scale: if fitness is measured in the thousands, T=1 means nothing. It is usually derived from typical neighbour differences.', 'Because it is deterministic, rerunning with the same seed is much more reproducible.']
    },
    params: {
      tr: [['Başlangıç eşiği', 'Tipik komşu farklarının birkaç katı iyi bir başlangıçtır.'], ['Azalma çarpanı', '1\'e yakın = yavaş daralma = çok keşif.']],
      en: [['Initial threshold', 'A few times the typical neighbour difference is a good start.'], ['Decay factor', 'Close to 1 = slow shrinking = more exploration.']]
    },
    pros: { tr: ['Rastgele sayı gerektirmeyen kabul kararı', 'Uygulaması en basit tavlama benzeri yöntem', 'Pratikte tavlamaya yakın başarı'], en: ['No random numbers in the acceptance decision', 'The simplest annealing-like method to implement', 'In practice close to annealing in quality'] },
    cons: { tr: ['Eşik ölçeği probleme göre ayarlanmalı', 'Tek çözümle ilerler', 'Teorik yakınsama garantileri tavlamadan zayıf'], en: ['The threshold scale must be tuned per problem', 'Follows a single solution', 'Weaker theoretical convergence guarantees than annealing'] }
  });

  /* ================= GRASP ================= */
  MH.algoPage({
    id: 'grasp', group: 'g_local', origin: 'added',
    title: { tr: 'GRASP · Gezgin Satıcı', en: 'GRASP · Traveling Salesman' },
    nav: { tr: 'GRASP', en: 'GRASP' },
    blurb: { tr: 'Açgözlü ama rastgele kurulum + yerel arama, defalarca.', en: 'Greedy-but-randomised construction + local search, many times.' },
    tagline: { tr: 'Greedy Randomized Adaptive Search Procedure: iyi başlangıçlar üret, hepsini iyileştir.', en: 'Greedy Randomized Adaptive Search Procedure: build good starts, improve each one.' },
    files: ['GRASPTSP.py'],
    intuition: {
      tr: ['Saf açgözlü yöntem (hep en yakın şehir) her seferinde aynı turu verir. Saf rastgele ise çok kötü turlar üretir. GRASP ikisini birleştirir: her adımda <b>en iyi birkaç adaydan</b> (kısıtlı aday listesi, RCL) rastgele birini seçer.', 'Her kurulumdan sonra <b>yerel arama</b> (burada 2-opt) turu iyileştirir. Bu "kur + iyileştir" çifti birçok kez tekrarlanır ve en iyi tur saklanır. Her iterasyon bağımsızdır.'],
      en: ['A pure greedy method (always the nearest city) gives the same tour every time. A pure random one gives very bad tours. GRASP combines them: at every step it picks <b>randomly among the best few candidates</b> (the restricted candidate list, RCL).', 'After each construction a <b>local search</b> (2-opt here) improves the tour. This "build + improve" pair is repeated many times and the best tour is kept. Iterations are independent.']
    },
    steps: {
      tr: ['<b>Kurulum</b>: rastgele bir şehirden başla. Her adımda ziyaret edilmemiş şehirleri uzaklığa göre değerlendir; <code>maliyet ≤ min + α·(max − min)</code> olanlar RCL\'dir.', 'RCL\'den rastgele bir şehir seç ve tura ekle; tüm şehirler bitene kadar sürdür.', '<b>Yerel arama</b>: 2-opt ile turu, iyileşme kalmayana kadar düzelt.', 'Sonucu en iyi turla karşılaştır ve gerekirse güncelle.', 'İterasyon sayısı bitene kadar yeni bir kurulumla tekrarla.'],
      en: ['<b>Construction</b>: start at a random city. At each step rate the unvisited cities by distance; those with <code>cost ≤ min + α·(max − min)</code> form the RCL.', 'Pick a random city from the RCL and append it to the tour; continue until all cities are used.', '<b>Local search</b>: improve the tour with 2-opt until no improvement is left.', 'Compare the result with the best tour and update it if better.', 'Repeat with a fresh construction until the iteration limit.']
    },
    demo(root) {
      const P = { n: 14, alpha: 0.2, iters: 30 }; let sim, cities;
      MH.demo(root, {
        w: 760, h: 420, sps: 3, maxSps: 40, minSps: 1,
        init(k) { cities = S.makeCities(P.n, MH.rngFor(k.seed)); sim = S.grasp({ cities, alpha: P.alpha, iters: P.iters }, MH.rngFor(k.seed + 1)); },
        step: () => sim.step(), isDone: () => sim.done,
        draw(ctx) {
          MH.drawTour(ctx, cities, sim.built, { x: 0, y: 0, w: 250, h: 205 }, { title: { tr: '1) Kurulum (açgözlü + rastgele)', en: '1) Construction (greedy + random)' }, color: col('--warm') });
          MH.drawTour(ctx, cities, sim.tour, { x: 255, y: 0, w: 250, h: 205 }, { title: { tr: '2) 2-opt sonrası', en: '2) After 2-opt' }, color: col('--accent') });
          MH.drawTour(ctx, cities, sim.best, { x: 510, y: 0, w: 250, h: 205 }, { title: { tr: 'En iyi tur', en: 'Best tour' }, color: col('--good'), width: 2.5 });
          MH.chart(ctx, 0, 215, 760, 205, [{ data: sim.hist, color: col('--accent'), label: { tr: 'iterasyon sonucu', en: 'iteration result' } }, { data: sim.bestHist, color: col('--good'), label: { tr: 'en iyi', en: 'best' }, width: 2 }], { title: { tr: 'Tur uzunluğu', en: 'Tour length' } });
        },
        stats: () => [[{ tr: 'Iterasyon', en: 'Iteration' }, `${sim.iter}/${P.iters}`], [{ tr: 'Kurulum', en: 'Construction' }, sim.iter ? Math.round(sim.builtLen) : '–'], [{ tr: '2-opt sonrası', en: 'After 2-opt' }, sim.iter ? Math.round(sim.len) : '–'], [{ tr: '2-opt hamle', en: '2-opt moves' }, sim.moves], [{ tr: 'En iyi', en: 'Best' }, Number.isFinite(sim.bestLen) ? Math.round(sim.bestLen) : '–']],
        explain: () => sim.iter ? t({ tr: `Kurulan tur ${Math.round(sim.builtLen)} idi; 2-opt ${sim.moves} hamleyle ${Math.round(sim.len)}'e indirdi. α=${P.alpha.toFixed(2)}: ${P.alpha < 0.05 ? 'neredeyse saf açgözlü (tüm iterasyonlar benzer)' : P.alpha > 0.7 ? 'neredeyse rastgele kurulum' : 'dengeli çeşitlilik'}.`, en: `The constructed tour was ${Math.round(sim.builtLen)}; 2-opt reduced it to ${Math.round(sim.len)} in ${sim.moves} moves. α=${P.alpha.toFixed(2)}: ${P.alpha < 0.05 ? 'almost pure greedy (all iterations look alike)' : P.alpha > 0.7 ? 'almost random construction' : 'balanced diversity'}.` }) : t({ tr: 'Adım\'a basın: her adım bir GRASP iterasyonudur (kurulum + yerel arama).', en: 'Press Step: each step is one GRASP iteration (construction + local search).' }),
        controls: k => [
          MH.slider({ label: { tr: 'Şehir', en: 'Cities' }, min: 6, max: 40, value: P.n, onInput: v => { P.n = v; k.restart(); } }),
          MH.slider({ label: { tr: 'α (0 = açgözlü, 1 = rastgele)', en: 'α (0 = greedy, 1 = random)' }, min: 0, max: 1, step: 0.05, value: P.alpha, fmt: v => v.toFixed(2), onInput: v => { P.alpha = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Iterasyon', en: 'Iterations' }, min: 5, max: 100, step: 5, value: P.iters, onInput: v => { P.iters = v; k.restart(); } })
        ]
      });
    },
    anns: {
      'GRASPTSP.py': [
        { find: 'def __init__(self, num_cities', span: 6, text: { tr: '<code>alpha</code>: 0 = saf açgözlü, 1 = saf rastgele kurulum.', en: '<code>alpha</code>: 0 = pure greedy, 1 = pure random construction.' } },
        { find: 'def run', span: 11, text: { tr: 'Her iterasyon: <code>construct</code> → <code>local_search</code> → en iyiyi güncelle.', en: 'Each iteration: <code>construct</code> → <code>local_search</code> → update the best.' } },
        { find: '# phase 1', span: 20, text: { tr: '<b>Faz 1</b>: kısıtlı aday listesiyle (RCL) açgözlü rastgele kurulum.', en: '<b>Phase 1</b>: greedy randomised construction with the restricted candidate list (RCL).' } },
        { find: 'rcl = [', span: 1, text: { tr: 'RCL: maliyeti <code>min + α·(max−min)</code>\'i aşmayan şehirler.', en: 'The RCL: cities whose cost does not exceed <code>min + α·(max−min)</code>.' } },
        { find: '# phase 2', span: 24, text: { tr: '<b>Faz 2</b>: 2-opt yerel arama: iki kenarı kaldırıp turu ters bağlamak kısaltıyorsa uygula.', en: '<b>Phase 2</b>: 2-opt local search: remove two edges and reconnect the other way whenever that shortens the tour.' } }
      ]
    },
    notes: {
      tr: ['GRASP\'ın gücü <b>çeşitlilik + yoğunlaştırma</b> dengesindedir: RCL çeşitliliği, yerel arama iyileştirmeyi sağlar. α=0\'da tüm iterasyonlar benzer turlar üretir; α=1\'de kurulum rastgeledir ve yerel aramaya çok iş düşer.', 'Burada iterasyonlar birbirinden bağımsızdır. <b>Path relinking</b> gibi eklentilerle iyi çözümlerin arasında yol kurularak sonuç iyileştirilir (reaktif GRASP, α\'yı kendisi ayarlar).', 'Hamle kontrolünde <code>1e-9</code> toleransı, kayan noktalı yuvarlama yüzünden sonsuz döngü riskini önler.'],
      en: ['The power of GRASP lies in the balance of <b>diversification + intensification</b>: the RCL provides diversity, the local search the improvement. At α=0 all iterations build similar tours; at α=1 construction is random and the local search has a lot of work to do.', 'Iterations are independent here. Extensions such as <b>path relinking</b> build paths between good solutions to improve them (reactive GRASP tunes α itself).', 'The <code>1e-9</code> tolerance in the move check prevents an infinite loop caused by floating-point rounding.']
    },
    params: {
      tr: [['α', 'Çeşitlilik düğmesi. Genelde 0.1–0.3 iyi çalışır.'], ['Iterasyon', 'Daha çok iterasyon = daha çok bağımsız deneme; azalan getirili.']],
      en: [['α', 'The diversity knob. 0.1–0.3 usually works well.'], ['Iterations', 'More iterations = more independent tries; with diminishing returns.']]
    },
    pros: { tr: ['Anlaşılması ve paralelleştirilmesi kolay', 'Çok az parametre (α)', 'Güçlü yerel aramayla birleşince çok iyi sonuç'], en: ['Easy to understand and parallelise', 'Very few parameters (α)', 'Very good results when combined with a strong local search'] },
    cons: { tr: ['İterasyonlar birbirinden öğrenmez (temel sürümde)', 'Kurulum kuralı probleme özeldir', 'Yerel aramaya bağımlıdır'], en: ['Iterations do not learn from each other (in the basic version)', 'The construction rule is problem specific', 'Depends on the local search'] }
  });

  /* ================= Memetic Algorithm ================= */
  MH.algoPage({
    id: 'memetic', group: 'g_ga', origin: 'added',
    title: { tr: 'Memetik Algoritma', en: 'Memetic Algorithm' },
    nav: { tr: 'Memetik Algoritma', en: 'Memetic Algorithm' },
    blurb: { tr: 'Genetik algoritma + her çocuğa yerel arama: kalıtım artı öğrenme.', en: 'Genetic algorithm + local search for every child: inheritance plus learning.' },
    tagline: { tr: 'Genler evrimle, "meme"ler (öğrenilmiş bilgi) yaşam boyu iyileştirmeyle aktarılır.', en: 'Genes pass by evolution, "memes" (learned knowledge) by life-time improvement.' },
    files: ['MemeticAlgorithm.py'],
    intuition: {
      tr: ['Genetik algoritma geniş alanı iyi tarar ama hassas ayarda yavaştır. Yerel arama hassas ayarda iyidir ama geniş alanı göremez. <b>Memetik algoritma ikisini birleştirir</b>: her çocuk üretildikten sonra kısa bir yerel aramayla "hayatı boyunca öğrenir".', 'Öğrenilen iyileşme genoma geri yazılır (<b>Lamarckçı</b> evrim); bu yüzden popülasyon çok daha hızlı yakınsar. Bedeli: her nesilde daha çok fonksiyon değerlendirmesi.'],
      en: ['A genetic algorithm scans a wide area well but is slow at fine tuning. Local search is good at fine tuning but cannot see the big picture. The <b>memetic algorithm combines both</b>: every child "learns during its life" through a short local search after it is created.', 'The learned improvement is written back into the genome (<b>Lamarckian</b> evolution), so the population converges much faster. The price: more function evaluations per generation.']
    },
    steps: {
      tr: ['Rastgele bir popülasyonla başla.', '<b>Seçilim</b>: turnuvayla iki ebeveyn seç.', '<b>Çaprazlama</b> ve <b>mutasyon</b> ile çocuk üret.', '<b>Yerel arama</b>: çocuğu birkaç adım rastgele tırmandırarak iyileştir ve sonucu çocuğa yaz.', 'En iyi bireyi (elitizm) koru; yeni nesille devam et.'],
      en: ['Start with a random population.', '<b>Selection</b>: pick two parents by tournament.', 'Create a child with <b>crossover</b> and <b>mutation</b>.', '<b>Local search</b>: improve the child with a few random climbing steps and write the result back.', 'Keep the best individual (elitism); continue with the new generation.']
    },
    demo(root) {
      const P = { fn: 'rastrigin', n: 20, mut: 0.3, sigma: 0.1, ls: 10, lsStep: 0.02, iters: 40 };
      MH.demo2D(root, {
        P, sps: 3, make: (p, seed) => S.memetic({ ...p }, MH.rngFor(seed)),
        points: sim => sim.pop.map(q => ({ x: q.x[0], y: q.x[1], c: col('--accent'), r: 4 })),
        extra(ctx, sim, m) {
          ctx.strokeStyle = col('--warm'); ctx.lineWidth = 1.6;
          for (const [a, b] of sim.lsTrails) { ctx.beginPath(); ctx.moveTo(m.X(a[0]), m.Y(a[1])); ctx.lineTo(m.X(b[0]), m.Y(b[1])); ctx.stroke(); MH.dot(ctx, m.X(a[0]), m.Y(a[1]), 2.5, col('--warm'), false); }
        },
        stats: sim => [[{ tr: 'Fonksiyon değerlendirmesi', en: 'Function evaluations' }, sim.evals]],
        explain: sim => sim.iter ? t({ tr: `Turuncu çizgiler: çocukların yerel aramayla yaptığı iyileşme (başlangıç → sonuç). <b>${sim.evals}</b> değerlendirme harcandı. Yerel aramayı 0 yaparak düz genetik algoritmayla karşılaştırın.`, en: `Orange lines: the improvement children made through local search (start → result). <b>${sim.evals}</b> evaluations were spent. Set local search to 0 to compare with the plain genetic algorithm.` }) : t({ tr: 'Adım\'a basın. "Yerel arama" kaydırıcısı 0 olursa algoritma düz GA\'ya dönüşür.', en: 'Press Step. With the "local search" slider at 0 the algorithm becomes a plain GA.' }),
        controls: (k, p) => [
          MH.slider({ label: { tr: 'Popülasyon', en: 'Population' }, min: 6, max: 60, value: p.n, onInput: v => { p.n = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Yerel arama adımı', en: 'Local search steps' }, min: 0, max: 40, step: 2, value: p.ls, onInput: v => { p.ls = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Mutasyon', en: 'Mutation' }, min: 0, max: 1, step: 0.05, value: p.mut, fmt: v => v.toFixed(2), onInput: v => { p.mut = v; k.restart(); } })
        ],
        legend: MH.legend([['--accent', { tr: 'birey', en: 'individual' }], ['--warm', { tr: 'yerel aramayla iyileşme', en: 'local search improvement' }], ['--good', { tr: 'en iyi', en: 'best' }]])
      });
    },
    anns: {
      'MemeticAlgorithm.py': [
        { find: 'def __init__', span: 6, text: { tr: '<code>ls_steps = 0</code> düz genetik algoritmadır.', en: '<code>ls_steps = 0</code> is the plain genetic algorithm.' } },
        { find: '# elitism', span: 2, text: { tr: 'Elitizm: en iyi birey sonraki nesle aynen geçer.', en: 'Elitism: the best individual passes unchanged to the next generation.' } },
        { find: 'child = self.crossover', span: 3, text: { tr: 'Çaprazlama + mutasyon.', en: 'Crossover + mutation.' } },
        { find: '# the memetic part', span: 4, text: { tr: '<b>Memetik kısım</b>: çocuk yerel arama yapar; sonuç popülasyona yazılır (Lamarckçı).', en: '<b>The memetic part</b>: the child performs a local search; the result is written into the population (Lamarckian).' } },
        { find: '# arithmetic crossover', span: 4, text: { tr: 'Aritmetik çaprazlama: iki ebeveyn arasındaki doğru üzerinde rastgele bir nokta.', en: 'Arithmetic crossover: a random point on the line between the two parents.' } },
        { find: '# stochastic hill climbing', span: 8, text: { tr: 'Yerel arama: Gauss adımlı rastgele Hill Climbing.', en: 'Local search: stochastic hill climbing with Gaussian steps.' } }
      ]
    },
    notes: {
      tr: ['<b>Lamarckçı</b> yaklaşımda yerel aramanın sonucu genoma yazılır; <b>Baldwinci</b> yaklaşımda yalnızca uygunluk hesabında kullanılır, genom değişmez. Lamarckçı olan daha hızlı ama çeşitliliği daha çabuk kaybettirir.', 'Karşılaştırma yaparken <b>fonksiyon değerlendirmesi sayısını</b> eşitleyin: yerel arama her çocuk için ek maliyetlidir. İstatistik satırındaki sayaç bu amaçla konmuştur.', 'Yerel arama maliyeti büyük problemlerde her çocuğa değil, yalnızca en iyi bazı çocuklara uygulanır.'],
      en: ['In the <b>Lamarckian</b> approach the local search result is written into the genome; in the <b>Baldwinian</b> approach it is only used in the fitness and the genome is unchanged. Lamarckian is faster but loses diversity sooner.', 'When comparing, equalise the <b>number of function evaluations</b>: the local search costs extra for every child. The counter in the stats line is there for that.', 'On expensive problems the local search is applied only to some of the best children, not to all of them.']
    },
    params: {
      tr: [['Yerel arama adımı', 'Büyük = hassas ama pahalı; küçük = GA\'ya yakın.'], ['Mutasyon', 'Yerel arama olduğu için GA\'dakinden daha yüksek tutulabilir (çeşitlilik için).']],
      en: [['Local search steps', 'Large = precise but expensive; small = close to a plain GA.'], ['Mutation', 'Because of the local search it can be set higher than in a GA (for diversity).']]
    },
    pros: { tr: ['Çoğu zaman GA veya yerel aramadan tek başına daha iyi', 'Hızlı yakınsama', 'Her yerel arama yöntemiyle birleştirilebilir'], en: ['Often better than a GA or local search alone', 'Fast convergence', 'Combinable with any local search'] },
    cons: { tr: ['Daha çok fonksiyon değerlendirmesi', 'Çeşitlilik hızla azalabilir', 'Yerel arama – genetik denge ayarı gerekir'], en: ['More function evaluations', 'Diversity can drop quickly', 'The balance between local search and evolution must be tuned'] }
  });
})();
