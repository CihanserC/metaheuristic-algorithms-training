/* Genetic Algorithm pages: sequence (+elitism), knapsack, N-Queens. */
(function () {
  'use strict';
  const { h, t, col } = MH;
  const S = window.Sims;
  const mono = (ctx, px, w = 400) => { ctx.font = `${w} ${px}px ui-monospace, Consolas, monospace`; };

  function drawGenes(ctx, x, y, genes, w, colors, label) {
    const cw = Math.min(26, (w - 96) / genes.length), ch = 22;
    ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = col('--muted'); ctx.textAlign = 'left'; ctx.fillText(label, x, y + 15);
    genes.forEach((g, i) => {
      const gx = x + 90 + i * cw;
      ctx.fillStyle = colors && colors[i] ? colors[i] : 'transparent'; ctx.fillRect(gx, y, cw, ch);
      ctx.strokeStyle = col('--line'); ctx.strokeRect(gx + 0.5, y + 0.5, cw - 1, ch - 1);
      if (cw >= 13) { mono(ctx, cw >= 20 ? 12 : 10); ctx.fillStyle = col('--text'); ctx.textAlign = 'center'; ctx.fillText(g, gx + cw / 2, y + 15); }
    });
    ctx.textAlign = 'left';
  }

  function gaDemo(root, o) {
    const P = o.P; let sim;
    MH.demo(root, {
      w: 760, h: 490, sps: 5, maxSps: 150, minSps: 1,
      init(k) { sim = o.make(P, k.seed); },
      step: () => sim.step(), isDone: () => sim.done,
      draw(ctx) {
        // population table
        ctx.fillStyle = col('--panel2'); ctx.fillRect(0, 0, 370, 250); ctx.fillRect(380, 0, 380, 250); ctx.fillRect(0, 260, 370, 230); ctx.fillRect(380, 260, 380, 230);
        ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = col('--muted');
        ctx.fillText(t({ tr: 'Popülasyon (uygunluğa göre ilk 12)', en: 'Population (top 12 by fitness)' }), 10, 17);
        const sorted = sim.pop.slice().sort((a, b) => b.f - a.f).slice(0, 12);
        sorted.forEach((ind, i) => {
          const y = 36 + i * 17;
          mono(ctx, 12, i === 0 ? 700 : 400);
          ctx.fillStyle = i === 0 ? col('--good') : col('--text');
          let s = o.geneStr(ind.g); const maxw = 250;
          while (ctx.measureText(s).width > maxw && s.length > 4) s = s.slice(0, -2);
          ctx.fillText(s + (s.length < o.geneStr(ind.g).length ? '…' : ''), 12, y);
          ctx.textAlign = 'right'; ctx.fillText(o.fmtFit(ind.f), 360, y); ctx.textAlign = 'left';
        });
        // problem panel
        ctx.save(); ctx.translate(380, 0); o.drawProblem(ctx, sim, { w: 380, h: 250 }); ctx.restore();
        // chart
        MH.chart(ctx, 0, 260, 370, 230, [{ data: sim.histAvg, color: col('--warm'), label: { tr: 'ortalama', en: 'average' } }, { data: sim.histBest, color: col('--good'), label: { tr: 'en iyi', en: 'best' }, width: 2.2 }], { title: { tr: 'Uygunluk / nesil', en: 'Fitness / generation' } });
        // operator panel
        ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = col('--muted');
        ctx.fillText(t({ tr: 'Son nesildeki ilk çocuğun üretimi', en: 'How the first child of the last generation was made' }), 390, 277);
        const d = sim.demo;
        if (!d) { ctx.fillText(t({ tr: 'Bir nesil ilerletin (Adım).', en: 'Advance one generation (Step).' }), 390, 310); return; }
        const L = d.a.length, ca = d.a.map((_, i) => (i >= d.s && i < d.e ? null : col('--accent'))), cb = d.b.map((_, i) => (i >= d.s && i < d.e ? col('--warm') : null));
        const tint = c => (c ? c + '55' : null);
        drawGenes(ctx, 390, 292, d.a, 360, d.a.map((_, i) => tint(i >= d.s && i < d.e ? null : col('--accent'))), t({ tr: 'Ebeveyn A', en: 'Parent A' }));
        drawGenes(ctx, 390, 322, d.b, 360, d.b.map((_, i) => tint(i >= d.s && i < d.e ? col('--warm') : null)), t({ tr: 'Ebeveyn B', en: 'Parent B' }));
        drawGenes(ctx, 390, 362, d.child, 360, d.child.map((_, i) => tint(i >= d.s && i < d.e ? col('--warm') : col('--accent'))), t({ tr: 'Çocuk', en: 'Child' }));
        drawGenes(ctx, 390, 392, d.after || d.child, 360, (d.after || d.child).map((_, i) => (d.mut.includes(i) ? col('--bad') + '99' : null)), t({ tr: 'Mutasyon sonrası', en: 'After mutation' }));
        ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = col('--muted');
        ctx.fillText(t({ tr: 'Mavi: A\'dan, turuncu: B\'den (iki noktalı çaprazlama), kırmızı: mutasyon', en: 'Blue: from A, orange: from B (two-point crossover), red: mutation' }), 390, 440);
        ctx.fillText(d.crossed === false ? t({ tr: 'Çaprazlama uygulanmadı (çaprazlama oranı): çocuk A\'nın kopyası', en: 'No crossover this time (crossover rate): the child is a copy of A' }) : t({ tr: `Kesme noktaları: [${d.s}, ${d.e}) · mutasyona uğrayan gen: ${d.mut.length}`, en: `Cut points: [${d.s}, ${d.e}) · mutated genes: ${d.mut.length}` }), 390, 456);
      },
      stats: () => [[{ tr: 'Nesil', en: 'Generation' }, sim.gen], [{ tr: 'En iyi', en: 'Best' }, o.fmtFit(sim.best.f)], [{ tr: 'Ortalama', en: 'Average' }, MH.fmt(sim.histAvg[sim.histAvg.length - 1], 2)], ...(o.extraStats ? o.extraStats(sim) : [])],
      explain() {
        if (sim.done) return o.doneText(sim);
        if (!sim.gen) return t({ tr: 'Başlangıç popülasyonu rastgele. <b>Oynat</b> ile nesilleri izleyin: her nesilde seçilim → çaprazlama → mutasyon uygulanır.', en: 'The initial population is random. Press <b>Play</b> to watch the generations: each one applies selection → crossover → mutation.' });
        return t({ tr: `Nesil ${sim.gen}: turnuva seçimi (${P.tour} rastgele birey arasından en iyi) ile iki ebeveyn seçildi. ${P.elite ? 'En iyi ' + P.elite + ' birey <b>elitizm</b> ile aynen aktarıldı.' : 'Elitizm kapalı: en iyiler bile kaybolabilir.'}`, en: `Generation ${sim.gen}: two parents were picked by tournament selection (best of ${P.tour} random individuals). ${P.elite ? 'The top ' + P.elite + ' individuals were copied unchanged by <b>elitism</b>.' : 'Elitism is off: even the best can be lost.'}` });
      },
      controls: k => [
        MH.slider({ label: { tr: 'Popülasyon', en: 'Population' }, min: 10, max: 200, step: 10, value: P.pop, onInput: v => { P.pop = v; k.restart(); } }),
        MH.slider({ label: { tr: 'Çaprazlama oranı', en: 'Crossover rate' }, min: 0, max: 1, step: 0.05, value: P.cross, fmt: v => v.toFixed(2), onInput: v => { P.cross = v; k.restart(); } }),
        MH.slider({ label: { tr: 'Mutasyon', en: 'Mutation' }, min: 0, max: 0.2, step: 0.005, value: P.mut, fmt: v => v.toFixed(3), onInput: v => { P.mut = v; k.restart(); } }),
        MH.slider({ label: { tr: 'Elitizm', en: 'Elitism' }, min: 0, max: 10, step: 1, value: P.elite, onInput: v => { P.elite = v; k.restart(); } }),
        MH.slider({ label: { tr: 'Turnuva', en: 'Tournament' }, min: 2, max: 30, step: 1, value: P.tour, onInput: v => { P.tour = v; k.restart(); } }),
        ...(o.extraControls ? o.extraControls(k, P) : [])
      ]
    });
  }

  const finite = f => (Number.isFinite(f) ? f : null);

  /* ================= GA: sequence + elitism ================= */
  MH.algoPage({
    id: 'ga-sequence', group: 'g_ga', origin: 'repo',
    title: { tr: 'Genetik Algoritma · Dizi Bulma ve Elitizm', en: 'Genetic Algorithm · Sequence Search & Elitism' },
    nav: { tr: 'Dizi bulma + Elitizm', en: 'Sequence + Elitism' },
    blurb: { tr: 'Gizli bir rakam dizisini seçilim, çaprazlama ve mutasyonla evrimleştirir.', en: 'Evolves a hidden digit sequence with selection, crossover and mutation.' },
    tagline: { tr: 'Doğal seçilimi taklit eden popülasyonlu arama: iyi bireyler daha çok çoğalır.', en: 'A population search that imitates natural selection: fitter individuals reproduce more.' },
    files: ['GeneticAlgorithmSequence.py', 'GeneticAlgorithmElitism.py'],
    intuition: {
      tr: ['Bir <b>birey</b> (kromozom) bir aday çözümdür; burada 10 rakamlık bir dizi. <b>Uygunluk</b>, hedef dizi <code>0 1 2 … 9</code> ile kaç konumda eşleştiğidir. Hedef = 10.', 'Her nesilde iyi bireyler ebeveyn seçilir, genleri karıştırılır (çaprazlama), arada rastgele bozulur (mutasyon). Zamanla popülasyon hedefe yaklaşır.'],
      en: ['An <b>individual</b> (chromosome) is a candidate solution — here a sequence of 10 digits. <b>Fitness</b> is the number of positions that match the target <code>0 1 2 … 9</code>. The goal is 10.', 'In every generation fit individuals are picked as parents, their genes are mixed (crossover) and occasionally corrupted at random (mutation). The population drifts towards the target.']
    },
    steps: {
      tr: ['Rastgele bir başlangıç popülasyonu oluştur.', 'Her bireyin uygunluğunu hesapla.', '<b>Seçilim</b> (turnuva): rastgele <code>k</code> birey çek, en iyisini ebeveyn yap. İki ebeveyn için tekrarla.', '<b>Çaprazlama</b>: iki kesme noktası seç; ortadaki parçayı B\'den, kalanını A\'dan al.', '<b>Mutasyon</b>: her gen küçük bir olasılıkla rastgele değiştirilir.', '<b>Elitizm</b> (isteğe bağlı): en iyi birkaç birey değişmeden bir sonraki nesle geçer.', 'Hedefe ulaşılana kadar tekrarla.'],
      en: ['Create a random initial population.', 'Compute the fitness of every individual.', '<b>Selection</b> (tournament): draw <code>k</code> random individuals and take the best as a parent. Repeat for the second parent.', '<b>Crossover</b>: pick two cut points; take the middle part from B and the rest from A.', '<b>Mutation</b>: each gene is randomly changed with a small probability.', '<b>Elitism</b> (optional): the best few individuals pass unchanged to the next generation.', 'Repeat until the target is reached.']
    },
    demo(root) {
      const P = { pop: 100, mut: 0.015, cross: 0.7, elite: 5, tour: 20 };
      gaDemo(root, {
        P, make: (p, seed) => S.gaSequence(p, MH.rngFor(seed)),
        geneStr: g => g.join(' '), fmtFit: f => String(f) + '/10',
        drawProblem(ctx, sim, b) {
          ctx.fillStyle = col('--panel2'); ctx.fillRect(0, 0, b.w, b.h);
          ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = col('--muted');
          ctx.fillText(t({ tr: 'Hedef ve şimdiye kadarki en iyi birey', en: 'Target and the best individual so far' }), 10, 17);
          const cw = 34, x0 = 20;
          [['target', 60], ['best', 130]].forEach(([k, y]) => {
            const g = k === 'target' ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] : sim.best.g;
            ctx.fillStyle = col('--muted'); ctx.font = '11px system-ui, sans-serif'; ctx.fillText(k === 'target' ? t({ tr: 'hedef', en: 'target' }) : t({ tr: 'en iyi', en: 'best' }), x0, y - 8);
            g.forEach((v, i) => {
              const ok = k === 'best' && v === i;
              ctx.fillStyle = k === 'target' ? col('--accent-soft') : (ok ? col('--good') + '55' : col('--bad') + '33');
              ctx.fillRect(x0 + i * cw, y, cw - 3, 44); ctx.strokeStyle = col('--line'); ctx.strokeRect(x0 + i * cw + .5, y + .5, cw - 4, 43);
              mono(ctx, 18, 700); ctx.fillStyle = col('--text'); ctx.textAlign = 'center'; ctx.fillText(v, x0 + i * cw + (cw - 3) / 2, y + 29); ctx.textAlign = 'left';
            });
          });
          ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = col('--muted');
          ctx.fillText(t({ tr: 'Yeşil = hedefle aynı konumda olan gen.', en: 'Green = a gene at the same position as in the target.' }), 10, 222);
        },
        doneText: sim => t({ tr: `Hedef dizi <b>${sim.gen}</b> nesilde bulundu.`, en: `The target sequence was found in <b>${sim.gen}</b> generations.` })
      });
    },
    anns: {
      'GeneticAlgorithmSequence.py': [
        { find: 'class Individual', span: 4, text: { tr: 'Birey: 10 genli kromozom; her gen 0–9 arasından rastgele başlar.', en: 'Individual: a 10-gene chromosome; each gene starts as a random digit 0–9.' } },
        { find: 'def get_fitness', span: 8, text: { tr: 'Uygunluk: hedef dizide aynı konumda eşleşen gen sayısı (0–10). <b>Büyük = iyi.</b>', en: 'Fitness: number of genes matching the target at the same position (0–10). <b>Bigger is better.</b>' } },
        { find: 'def get_fittest(self)', span: 9, text: { tr: 'Popülasyondaki en uygun bireyi doğrusal tarama ile bulur.', en: 'Finds the fittest individual with a linear scan.' } },
        { find: 'def run(self)', span: 12, text: { tr: 'Ana döngü: <code>MAX_FITNESS</code> bulunana kadar nesil üretir.', en: 'Main loop: evolves generations until <code>MAX_FITNESS</code> is found.' } },
        { find: 'def evolve_population', span: 15, text: { tr: 'Bir nesil: her çocuk için iki ebeveyn seç → çaprazla → sonra tüm bireylere mutasyon uygula.', en: 'One generation: for each child pick two parents → cross them → then mutate all individuals.' } },
        { find: 'def crossover', span: 12, text: { tr: 'İki noktalı çaprazlama <code>A[:start] + B[start:end] + A[end:]</code>; yalnızca <code>crossover_rate</code> olasılığıyla (aksi halde A\'nın kopyası).', en: 'Two-point crossover <code>A[:start] + B[start:end] + A[end:]</code>, applied only with probability <code>crossover_rate</code> (otherwise a copy of A).' } },
        { find: 'def mutate', span: 4, text: { tr: 'Her gen <code>mutation_rate</code> olasılıkla 0–9 arasında yeni bir değer alır.', en: 'Each gene gets a new value in 0–9 with probability <code>mutation_rate</code>.' } },
        { find: 'def random_selection', span: 10, text: { tr: 'Turnuva seçimi: tüm popülasyondan rastgele <code>TOURNAMENT_SIZE</code> birey çekilir, en iyisi ebeveyn olur.', en: 'Tournament selection: <code>TOURNAMENT_SIZE</code> random individuals are drawn from the whole population and the best becomes the parent.' } }
      ],
      'GeneticAlgorithmElitism.py': [
        { find: 'def get_fittest_elitism', span: 5, text: { tr: 'Popülasyonu uygunluğa göre sıralayıp en iyi <code>n</code> bireyi döndürür (elitler).', en: 'Sorts the population by fitness and returns the best <code>n</code> individuals (the elite).' } },
        { find: 'def __init__(self, population_size=100, crossover_rate', span: 5, text: { tr: '<code>elitism_param</code>: kaç bireyin aynen aktarılacağı.', en: '<code>elitism_param</code>: how many individuals are copied unchanged.' } },
        { find: 'for index, individual in enumerate(population.get_fittest_elitism', span: 2, text: { tr: 'Elitleri yeni neslin <b>ilk indekslerine</b> yazar (artık popülasyon boyutunun dışına taşmaz).', en: 'Writes the elite to the <b>first indices</b> of the new generation (they no longer spill outside the population size).' } },
        { find: 'for index in range(self.elitism_param', span: 4, text: { tr: 'Çaprazlama yalnızca <code>elitism_param</code> indeksinden itibaren çocukları yazar.', en: 'Crossover writes children only from index <code>elitism_param</code> onwards.' } },
        { find: 'for individual in next_population.individuals[self.elitism_param:]', span: 2, text: { tr: 'Mutasyon elitlere uygulanmaz: en iyiler bozulmaz.', en: 'Mutation is not applied to the elite: the best are not damaged.' } }
      ]
    },
    notes: {
      tr: [`<b><code>crossover_rate</code> artık kullanılıyor (düzeltildi):</b> parametre alınıyordu ama hiçbir yerde okunmuyordu; çaprazlama her zaman uygulanıyordu. Şimdi çaprazlama bu olasılıkla yapılır, aksi halde çocuk ilk ebeveynin kopyasıdır.`, `<b>Turnuva tüm popülasyondan (düzeltildi):</b> eskiden <code>randint(new_population.get_size())</code> turnuva boyutu (20) kadar aralıktan çekiyordu, yani ebeveynler hep popülasyonun ilk 20 elemanından geliyordu. Şimdi indeks tüm popülasyondan çekilir.`, `<b>Elitizm (düzeltildi):</b> eskiden yeni <code>Population</code> zaten 100 rastgele birey içeriyordu; <code>extend</code> elitleri 100–104. indekslere ekliyor, çaprazlama döngüsü 5–99 arasını dolduruyordu. Sonuçta 0–4. indekste rastgele bireyler kalıyor ve elitler sonraki mutasyon döngüsünde bozulabiliyordu. Şimdi elitler ilk indekslere yazılır ve mutasyondan <b>muaftır</b>; uygunluk gerçekten düşmez.`, `<b>Başlangıç genleri (düzeltildi):</b> <code>randint(1, 10)</code> hiç 0 üretmiyordu, oysa hedef dizide 0 var. Şimdi genler 0–9 arasından gelir.`, `Küçük düzeltmeler: <code>run</code> artık global <code>algorithm</code> yerine <code>self.evolve_population</code> çağırır; <code>get_fittest</code> uygunluğu her karşılaştırmada iki kez hesaplamak yerine bir kez hesaplar; elitizm dosyasındaki hata ayıklama <code>print</code>'leri kaldırıldı.`],
      en: [`<b><code>crossover_rate</code> is now used (fixed):</b> the parameter was accepted but never read; crossover was always applied. Crossover now happens with this probability, otherwise the child is a copy of the first parent.`, `<b>Tournament over the whole population (fixed):</b> <code>randint(new_population.get_size())</code> used to draw from a range equal to the tournament size (20), so parents always came from the first 20 members. The index is now drawn from the whole population.`, `<b>Elitism (fixed):</b> the new <code>Population</code> already held 100 random individuals; <code>extend</code> appended the elite at indices 100–104 and the crossover loop filled 5–99. As a result indices 0–4 kept random individuals and the elite could be damaged by the following mutation loop. The elite is now written to the first indices and is <b>exempt</b> from mutation; fitness really never drops.`, `<b>Initial genes (fixed):</b> <code>randint(1, 10)</code> never produced a 0 although the target contains one. Genes now come from 0–9.`, `Small fixes: <code>run</code> now calls <code>self.evolve_population</code> instead of the global <code>algorithm</code>; <code>get_fittest</code> computes the fitness once instead of twice per comparison; the debugging <code>print</code>s in the elitism file were removed.`]
    },
    params: {
      tr: [['Popülasyon', 'Büyük popülasyon = daha çok çeşitlilik ama nesil başına daha pahalı.'], ['Mutasyon oranı', '0 ise yeni gen değeri üretilemez; yalnızca başlangıç genleri karıştırılır. Çok yüksekse arama rastgele yürüyüşe döner. Genelde 1/genUzunluğu civarı iyi bir başlangıçtır.'], ['Elitizm', 'En iyi çözümün kaybolmasını engeller; ama çok büyükse çeşitlilik azalır, erken yakınsama olur.'], ['Turnuva boyutu', 'Büyük = güçlü seçilim baskısı (hızlı ama erken yakınsama riski). 2 = hafif baskı.']],
      en: [['Population', 'Larger = more diversity but more expensive per generation.'], ['Mutation rate', 'At 0 no new gene values can appear; only the initial genes get shuffled. Too high and the search becomes a random walk. Around 1/chromosome length is a good start.'], ['Elitism', 'Prevents losing the best solution; if too large, diversity shrinks and the population converges prematurely.'], ['Tournament size', 'Large = strong selection pressure (fast but risks premature convergence). 2 = mild pressure.']]
    },
    pros: { tr: ['Türev gerektirmez', 'Ayrık ve karmaşık yapılara uygun', 'Birçok çözümü paralel arar', 'Operatörler probleme göre özelleştirilebilir'], en: ['No derivatives needed', 'Fits discrete and complex structures', 'Searches many solutions in parallel', 'Operators can be tailored to the problem'] },
    cons: { tr: ['Çok sayıda parametre ayarlamak gerekir', 'Uygunluk hesabı pahalıysa yavaştır', 'Erken yakınsama (çeşitlilik kaybı) riski vardır'], en: ['Many parameters to tune', 'Slow if fitness evaluation is expensive', 'Risk of premature convergence (loss of diversity)'] }
  });

  /* ================= GA: knapsack ================= */
  MH.algoPage({
    id: 'ga-knapsack', group: 'g_ga', origin: 'repo',
    title: { tr: 'Genetik Algoritma · Sırt Çantası', en: 'Genetic Algorithm · Knapsack' },
    nav: { tr: 'Sırt çantası', en: 'Knapsack' },
    blurb: { tr: 'Kapasiteyi aşmadan toplam değeri en yüksek eşya kümesini bulur.', en: 'Finds the item set with the highest value that fits in the capacity.' },
    tagline: { tr: 'İkili (0/1) kromozomlar ve ceza ile kısıtlı optimizasyon.', en: 'Constrained optimisation with binary (0/1) chromosomes and a penalty.' },
    files: ['GeneticAlgorithmKnapsack.py'],
    intuition: {
      tr: ['Her gen bir eşyayı temsil eder: <code>1</code> = çantaya koy, <code>0</code> = koyma. Toplam ağırlık kapasiteyi aşarsa birey <b>geçersizdir</b> ve uygunluğu −∞ olur; böylece seçilimde elenir.', 'Kapasite kısıtını çözümün içine gömmek yerine uygunluk fonksiyonuyla zorluyoruz — kısıtlı problemlerde sık kullanılan bir yaklaşım.'],
      en: ['Each gene stands for an item: <code>1</code> = put it in the bag, <code>0</code> = leave it. If the total weight exceeds the capacity the individual is <b>infeasible</b> and its fitness is −∞, so selection weeds it out.', 'Instead of building the constraint into the representation we enforce it through the fitness function — a common approach for constrained problems.']
    },
    steps: {
      tr: ['Her birey rastgele bir 0/1 dizisidir (eşya seçimi).', 'Uygunluk = seçilen eşyaların toplam değeri; ağırlık kapasiteyi aşarsa −∞.', 'Turnuva seçimi → iki noktalı çaprazlama → bit çevirme mutasyonu.', 'En iyi <code>elitism_param</code> birey aynen sonraki nesle taşınır.', '100 nesil sonra en iyi bireyi yazdır.'],
      en: ['Each individual is a random 0/1 string (item selection).', 'Fitness = total value of the chosen items; −∞ if the weight exceeds the capacity.', 'Tournament selection → two-point crossover → bit-flip mutation.', 'The best <code>elitism_param</code> individuals pass unchanged to the next generation.', 'After 100 generations print the best individual.']
    },
    demo(root) {
      const P = { pop: 50, mut: 0.015, cross: 0.85, elite: 5, tour: 10, items: 4 };
      const inst = seed => {
        if (P.items === 4) return { ...S.KNAP_DEFAULT };
        const r = MH.rngFor(seed + 99), w = [], v = [];
        for (let i = 0; i < P.items; i++) { w.push(1 + Math.floor(r() * 9)); v.push(1 + Math.floor(r() * 20)); }
        return { weights: w, values: v, cap: Math.floor(w.reduce((a, b) => a + b, 0) / 2.2) };
      };
      let cur;
      gaDemo(root, {
        P, make: (p, seed) => { cur = inst(seed); return S.gaKnapsack({ ...cur, ...p }, MH.rngFor(seed)); },
        geneStr: g => g.join(''), fmtFit: f => (Number.isFinite(f) ? String(f) : t({ tr: 'geçersiz', en: 'invalid' })),
        extraStats: sim => [[{ tr: 'Optimum', en: 'Optimum' }, sim.optimum]],
        extraControls: (k) => [MH.slider({ label: { tr: 'Eşya sayısı', en: 'Items' }, min: 4, max: 16, step: 1, value: P.items, onInput: v => { P.items = v; k.restart(); } })],
        drawProblem(ctx, sim, b) {
          const g = sim.best.g, n = cur.weights.length;
          ctx.fillStyle = col('--panel2'); ctx.fillRect(0, 0, b.w, b.h);
          ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = col('--muted');
          ctx.fillText(t({ tr: `Eşyalar (ağırlık / değer) · kapasite ${cur.cap}`, en: `Items (weight / value) · capacity ${cur.cap}` }), 10, 17);
          const cw = Math.min(46, (b.w - 20) / n);
          let wsum = 0, vsum = 0;
          for (let i = 0; i < n; i++) {
            const sel = g[i] === 1, x = 10 + i * cw, hh = 20 + cur.values[i] * (n === 4 ? 12 : 5);
            if (sel) { wsum += cur.weights[i]; vsum += cur.values[i]; }
            ctx.fillStyle = sel ? col('--good') + 'aa' : col('--line'); ctx.fillRect(x, 150 - hh * 0.8, cw - 6, hh * 0.8);
            ctx.strokeStyle = col('--line'); ctx.strokeRect(x + .5, 150.5 - hh * 0.8, cw - 7, hh * 0.8);
            ctx.fillStyle = col('--text'); ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('w' + cur.weights[i], x + (cw - 6) / 2, 166); ctx.fillText('v' + cur.values[i], x + (cw - 6) / 2, 180); ctx.textAlign = 'left';
          }
          const barW = b.w - 20, ratio = wsum / cur.cap;
          ctx.fillStyle = col('--line'); ctx.fillRect(10, 205, barW, 14);
          ctx.fillStyle = ratio > 1 ? col('--bad') : col('--accent'); ctx.fillRect(10, 205, barW * Math.min(1, ratio), 14);
          ctx.fillStyle = col('--text'); ctx.font = '12px system-ui, sans-serif';
          ctx.fillText(t({ tr: `Çanta: ağırlık ${wsum}/${cur.cap} · değer ${vsum} (optimum ${sim.optimum})`, en: `Bag: weight ${wsum}/${cur.cap} · value ${vsum} (optimum ${sim.optimum})` }), 10, 240);
        },
        doneText: sim => t({ tr: sim.best.f >= sim.optimum ? `Optimum değer (${sim.optimum}) <b>${sim.gen}</b> nesilde bulundu.` : `100 nesil bitti; en iyi değer ${sim.best.f}, optimum ${sim.optimum}.`, en: sim.best.f >= sim.optimum ? `The optimum value (${sim.optimum}) was found in <b>${sim.gen}</b> generations.` : `100 generations finished; best value ${sim.best.f}, optimum ${sim.optimum}.` })
      });
    },
    anns: {
      'GeneticAlgorithmKnapsack.py': [
        { find: 'CAPACITY = 8', span: 1, text: { tr: 'Çanta kapasitesi (sabit).', en: 'Bag capacity (constant).' } },
        { find: 'def get_fitness', span: 14, text: { tr: 'Seçilen eşyaların ağırlık ve değer toplamı. Kapasiteyi aşarsa <code>-inf</code> döner: geçersiz çözüm asla seçilmez.', en: 'Sums weight and value of the chosen items. Exceeding the capacity returns <code>-inf</code>: an infeasible solution is never preferred.' } },
        { find: 'def evolve_population', span: 20, text: { tr: 'Elitizm + çaprazlama + mutasyon (diğer GA sayfasındakiyle aynı iskelet).', en: 'Elitism + crossover + mutation (same skeleton as the other GA page).' } },
        { find: 'def mutate', span: 4, text: { tr: 'Mutasyon: gen 0 veya 1 olarak yeniden çekilir (<code>randint(0, 2)</code>).', en: 'Mutation: the gene is redrawn as 0 or 1 (<code>randint(0, 2)</code>).' } },
        { find: 'w = [2, 3, 4, 5]', span: 5, text: { tr: 'Örnek: 4 eşya. En iyi seçim ağırlık 3+5=8, değer 2+6=8 veren eşyalardır.', en: 'Example: 4 items. The best choice is the items with weight 3+5=8 and value 2+6=8.' } }
      ]
    },
    notes: {
      tr: [`<b><code>CHROMOSOME_LENGTH = 4</code> sabiti kaldırıldı (düzeltildi):</b> çaprazlama ve mutasyon artık eşya sayısına (<code>len(values)</code>) göre çalışır; eşya sayısı değişince kod sessizce yanlış çalışmaz (animasyonda eşya sayısı dinamiktir).`, `Geçersiz bireylere <code>-inf</code> vermek seçilimi basitleştirir ama tüm popülasyon geçersizse bile ayırt edici bilgi kalmaz. Alternatif: ağırlık aşımıyla orantılı bir <b>ceza</b> ya da bireyi onarmak.`, `Turnuva, elitizm ve <code>crossover_rate</code> düzeltmeleri için <a href="#/ga-sequence">Dizi Bulma</a> sayfasına bakın; aynı değişiklikler bu dosyaya da uygulandı.`, `4 eşyalık örnek, kaba kuvvetle (2⁴ = 16 olasılık) çözülebilir; GA'nın gücü eşya sayısı 30–100'lere çıkınca görülür.`],
      en: [`<b>The <code>CHROMOSOME_LENGTH = 4</code> constant was removed (fixed):</b> crossover and mutation now use the number of items (<code>len(values)</code>), so the code no longer misbehaves silently when the number of items changes (the animation uses a dynamic item count).`, `Giving infeasible individuals <code>-inf</code> keeps selection simple, but if the whole population is infeasible there is no gradient left. Alternatives: a <b>penalty</b> proportional to the overweight, or repairing the individual.`, `For the tournament, elitism and <code>crossover_rate</code> fixes see the <a href="#/ga-sequence">Sequence Search</a> page; the same changes were applied to this file.`, `The 4-item example can be solved by brute force (2⁴ = 16 possibilities); the strength of a GA shows with 30–100 items.`]
    },
    params: {
      tr: [['Eşya sayısı', 'Arama uzayı 2ⁿ büyür. Animasyonda 16 eşyada bile GA optimumu hızla bulur.'], ['Mutasyon', 'İkili genlerde düşük oran (≈1/n) yeterlidir; çok yüksekse iyi çözümler bozulur.']],
      en: [['Number of items', 'The search space grows as 2ⁿ. In the animation the GA finds the optimum quickly even with 16 items.'], ['Mutation', 'For binary genes a low rate (≈1/n) is enough; too high destroys good solutions.']]
    },
    pros: { tr: ['İkili temsil çok doğal', 'Kısıt, uygunluk fonksiyonuna kolayca gömülür', 'Büyük örneklerde dinamik programlamadan bağımsız ölçeklenir'], en: ['Binary encoding is very natural', 'The constraint is easily embedded in fitness', 'Scales independently of the capacity, unlike dynamic programming'] },
    cons: { tr: ['Optimum garantisi yok', 'Geçersiz çözümlerle çok zaman harcanabilir', 'Dinamik programlama pseudo-polinom sürede kesin çözer'], en: ['No optimality guarantee', 'A lot of time can be wasted on infeasible solutions', 'Dynamic programming solves it exactly in pseudo-polynomial time'] }
  });

  /* ================= GA: N-Queens ================= */
  MH.algoPage({
    id: 'ga-nqueens', group: 'g_ga', origin: 'repo',
    title: { tr: 'Genetik Algoritma · N-Vezir', en: 'Genetic Algorithm · N-Queens' },
    nav: { tr: 'N-Vezir', en: 'N-Queens' },
    blurb: { tr: 'Birbirini tehdit etmeyen N vezirin satranç tahtasına yerleştirilmesi.', en: 'Places N queens on a chessboard so none attacks another.' },
    tagline: { tr: 'Çakışmaları sayan bir ceza fonksiyonuyla permütasyona benzer bir problem.', en: 'A permutation-like problem solved with a penalty that counts attacks.' },
    files: ['GeneticAlgorithmNQueens.py'],
    intuition: {
      tr: ['Her sütuna <b>tam bir vezir</b> koyarız; kromozom, her sütundaki vezirin satır numarasıdır. Böylece sütun çakışması yapı gereği yoktur.', 'Kalan saldırılar aynı satırda olanlar ve çaprazlardır. Uygunluk <code>1/(ceza+1)</code>: ceza 0 ise uygunluk 1 ve problem çözülmüştür.'],
      en: ['We put <b>exactly one queen in every column</b>; the chromosome stores the row of the queen in each column, so column conflicts cannot occur by construction.', 'The remaining attacks are along rows and diagonals. Fitness is <code>1/(penalty+1)</code>: penalty 0 gives fitness 1 and the problem is solved.']
    },
    steps: {
      tr: ['Her birey: <code>N</code> sütun için rastgele satır numaraları.', 'Ceza: aynı satırdaki ve aynı çaprazdaki (<code>|i−j| = |g[i]−g[j]|</code>) vezir çiftleri.', 'Uygunluk = 1/(ceza+1); 1 olduğunda dur.', 'Turnuva seçimi, iki noktalı çaprazlama, mutasyon ve elitizm ile yeni nesil üret.'],
      en: ['Each individual: random row numbers for the <code>N</code> columns.', 'Penalty: queen pairs on the same row or on the same diagonal (<code>|i−j| = |g[i]−g[j]|</code>).', 'Fitness = 1/(penalty+1); stop when it equals 1.', 'Build the next generation with tournament selection, two-point crossover, mutation and elitism.']
    },
    demo(root) {
      const P = { pop: 100, mut: 0.05, cross: 0.85, elite: 5, tour: 20, n: 8 };
      gaDemo(root, {
        P, make: (p, seed) => S.gaQueens({ ...p }, MH.rngFor(seed)),
        geneStr: g => g.length > 12 ? g.join(' ') : g.join(' '), fmtFit: f => f.toFixed(3),
        extraStats: sim => [[{ tr: 'Çakışan çift', en: 'Attacking pairs' }, S.queensPenalty(sim.best.g)]],
        extraControls: k => [MH.slider({ label: { tr: 'Vezir sayısı N', en: 'Queens N' }, min: 4, max: 24, step: 1, value: P.n, onInput: v => { P.n = v; k.restart(); } })],
        drawProblem(ctx, sim, b) {
          const g = sim.best.g, n = g.length, cs = Math.min(230 / n, 40), ox = (b.w - cs * n) / 2, oy = 12;
          ctx.fillStyle = col('--panel2'); ctx.fillRect(0, 0, b.w, b.h);
          for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
            ctx.fillStyle = (r + c) % 2 ? col('--line') : 'transparent'; ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
          }
          ctx.strokeStyle = col('--muted'); ctx.strokeRect(ox + .5, oy + .5, cs * n, cs * n);
          for (let c = 0; c < n; c++) {
            let bad = false;
            for (let j = 0; j < n; j++) if (j !== c && (g[j] === g[c] || Math.abs(j - c) === Math.abs(g[j] - g[c]))) bad = true;
            const cx = ox + c * cs + cs / 2, cy = oy + g[c] * cs + cs / 2;
            ctx.fillStyle = bad ? col('--bad') : col('--good'); ctx.beginPath(); ctx.arc(cx, cy, cs * 0.36, 0, 7); ctx.fill();
            if (cs > 16) { ctx.fillStyle = '#fff'; ctx.font = `700 ${cs * 0.5}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♛', cx, cy + 1); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; }
          }
        },
        doneText: sim => t({ tr: `${sim.cfg.glen} vezirlik çözüm <b>${sim.gen}</b> nesilde bulundu (çakışma yok).`, en: `A ${sim.cfg.glen}-queens solution was found in <b>${sim.gen}</b> generations (no attacks).` })
      });
    },
    anns: {
      'GeneticAlgorithmNQueens.py': [
        { find: 'CHROMOSOME_LENGTH = 100', span: 1, text: { tr: 'Vezir sayısı (100). Animasyon daha okunaklı olsun diye 4–24 arası değişir.', en: 'Number of queens (100). The animation uses 4–24 to stay readable.' } },
        { find: 'def get_fitness', span: 33, text: { tr: 'Ceza fonksiyonu: aynı satırdaki ve aynı çaprazdaki vezir çiftlerini sayar; sütun çakışması olmaz.', en: 'Penalty function: counts queen pairs on the same row or diagonal; column conflicts cannot occur.' } },
        { find: 'if abs(i - j) == abs(self.genes[i] - self.genes[j])', span: 2, text: { tr: 'Çapraz kontrol: sütun farkı = satır farkı ise iki vezir birbirini görür.', en: 'Diagonal test: if the column difference equals the row difference the two queens attack each other.' } },
        { find: 'return 1 / (penalty + 1)', span: 1, text: { tr: 'Ceza ne kadar azsa uygunluk 1\'e o kadar yakın. 1 = çözüm.', en: 'The smaller the penalty the closer the fitness to 1. A value of 1 means solved.' } },
        { find: 'while pop.get_fittest().get_fitness() != 1', span: 6, text: { tr: 'Ceza 0 olana kadar nesil üretir; sonlanma garantisi yoktur.', en: 'Evolves until the penalty is 0; termination is not guaranteed.' } }
      ]
    },
    notes: {
      tr: [`<b>Çift sayımı (düzeltildi):</b> ceza eskiden <code>(i, j)</code> ve <code>(j, i)</code> sıralarını ayrı saydığı için her saldıran çifti <b>iki kez</b> sayıyordu. Şimdi her çift bir kez sayılır (<code>j &gt; i</code>); sonuç (ceza 0 ⇒ uygunluk 1) değişmez, hesap yarıya iner ve animasyondaki "çakışan çift" sayısı doğrudan cezadır.`, `Ceza her bireyde O(N²) sürer; N=100 için binlerce karşılaştırma × popülasyon × nesil. Satır ve çapraz sayaçlarla O(N)'e inebilir.`, `Satır numaralarını bir <b>permütasyon</b> olarak tutmak (her satırda da tek vezir) aramayı çok daraltır; bu kodda satır tekrarına izin verilip cezalandırılıyor.`, `Mutasyon oranı çok düşükse (0.015, N=100) tek bir bireyde genlerin ancak ~1.5'i değişir; N büyüdükçe oranı 1/N civarında tutmak mantıklıdır.`, `Elitizm, turnuva ve <code>crossover_rate</code> düzeltmeleri için <a href="#/ga-sequence">Dizi Bulma</a> sayfasına bakın.`],
      en: [`<b>Double counting (fixed):</b> the penalty used to count the ordered pairs <code>(i, j)</code> and <code>(j, i)</code> separately, so every attacking pair was counted <b>twice</b>. Each pair is now counted once (<code>j &gt; i</code>); the outcome (penalty 0 ⇒ fitness 1) is unchanged, the work is halved and the animation's "attacking pairs" is the penalty itself.`, `The penalty costs O(N²) per individual; for N=100 that is thousands of comparisons × population × generations. Row and diagonal counters bring it down to O(N).`, `Storing the rows as a <b>permutation</b> (one queen per row too) would shrink the search a lot; this code allows repeated rows and penalises them.`, `With a very low mutation rate (0.015, N=100) only ~1.5 genes change per individual; as N grows keeping the rate near 1/N makes sense.`, `For the elitism, tournament and <code>crossover_rate</code> fixes see the <a href="#/ga-sequence">Sequence Search</a> page.`]
    },
    params: {
      tr: [['N (vezir sayısı)', 'N büyüdükçe arama uzayı Nᴺ büyür; popülasyonu ve mutasyonu artırmak gerekir.'], ['Mutasyon', 'Çözüme çok yakın bireyleri "son bir gen" ile tamamlayabilir; çok yüksekse iyi bireyleri bozar.'], ['Turnuva', 'Büyük turnuva hızlı yakınsama ama çeşitlilik kaybı demektir.']],
      en: [['N (queens)', 'The search space grows as Nᴺ; raise population and mutation as N increases.'], ['Mutation', 'Can complete a near-solution with a "last gene"; too high breaks good individuals.'], ['Tournament', 'A large tournament converges fast but loses diversity.']]
    },
    pros: { tr: ['Büyük N için sistematik arama (backtracking) yavaşlarken GA hızlı çözüm bulabilir', 'Ceza fonksiyonu sezgisel ve basit'], en: ['For large N where systematic search (backtracking) slows down a GA can still find a solution quickly', 'The penalty function is intuitive and simple'] },
    cons: { tr: ['Kesin çözümü her zaman bulacağı garanti değil', 'Ceza hesabı O(N²) olduğundan büyük N\'de pahalı'], en: ['No guarantee to find a solution', 'The O(N²) penalty is expensive for large N'] }
  });
})();
