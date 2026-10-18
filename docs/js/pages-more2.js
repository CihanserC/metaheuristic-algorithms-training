/* More added algorithms, part 2: CMA-ES, PBIL, Cross-Entropy, Firefly, Cuckoo, Bat, Whale, Harris Hawks, Harmony, TLBO. */
(function () {
  'use strict';
  const { h, t, col } = MH;
  const S = window.Sims;
  const iterSlider = (k, p, max = 300) => MH.slider({ label: { tr: 'Iterasyon', en: 'Iterations' }, min: 10, max, step: 10, value: p.iters, onInput: v => { p.iters = v; k.restart(); } });
  const sizeSlider = (k, p, key, label, min = 5, max = 60) => MH.slider({ label, min, max, value: p[key], onInput: v => { p[key] = v; k.restart(); } });
  const popPoints = (list, color = '--accent', r = 4) => list.map(q => ({ x: q.x[0], y: q.x[1], c: col(color), r }));

  /* ================= CMA-ES ================= */
  MH.algoPage({
    id: 'cmaes', group: 'g_evo', origin: 'added',
    title: { tr: 'Evrim Stratejileri · CMA-ES', en: 'Evolution Strategies · CMA-ES' },
    nav: { tr: 'CMA-ES', en: 'CMA-ES' },
    blurb: { tr: 'Arama bulutunun şeklini ve boyunu kendi kendine öğrenen evrim stratejisi.', en: 'An evolution strategy that learns the shape and size of its own search cloud.' },
    tagline: { tr: 'Sürekli optimizasyonun en güçlü genel amaçlı yöntemlerinden biri.', en: 'One of the strongest general-purpose methods for continuous optimisation.' },
    files: ['CMAES.py'],
    intuition: {
      tr: ['Evrim stratejileri (ES) sürekli uzayda çalışır ve mutasyonu <b>Gauss gürültüsü</b> olarak yapar. En basit ES, bir ortalama etrafında örnekler çeker, iyilerini seçip ortalamayı onlara kaydırır; mutasyon boyu (σ) ise elle ayarlanır.', '<b>CMA-ES</b> bu elle ayarı bırakır: arama bulutunu bir <b>elips</b> (kovaryans matrisi) olarak tutar ve iyi adımların nereye gittiğine bakarak elipsin yönünü, şeklini ve genel boyunu her nesilde öğrenir. Vadi uzunsa elips vadi boyunca uzar.'],
      en: ['Evolution strategies (ES) work in continuous space and mutate with <b>Gaussian noise</b>. The simplest ES draws samples around a mean, selects the best and shifts the mean to them; the mutation size (σ) is set by hand.', '<b>CMA-ES</b> drops the hand tuning: it keeps its search cloud as an <b>ellipse</b> (a covariance matrix) and, by looking at where the good steps went, learns the ellipse\'s orientation, shape and overall size every generation. If the valley is long, the ellipse stretches along it.']
    },
    steps: {
      tr: ['<b>Örnekleme</b>: <code>x = m + σ·y</code>, <code>y ~ N(0, C)</code> ile λ aday üret.', '<b>Seçilim</b>: en iyi μ adayı al; en iyiye en çok ağırlık ver.', '<b>Ortalamayı kaydır</b>: <code>m ← m + σ·Σ w<sub>i</sub> y<sub>i</sub></code>.', '<b>Evrim yolları</b>: son adımların yönünü biriktir (<code>p<sub>σ</sub></code>, <code>p<sub>c</sub></code>).', '<b>Kovaryansı güncelle</b>: iyi adımların yönünü elipse ekle (rank-1 ve rank-μ güncellemeleri).', '<b>σ\'yı ayarla</b>: yol uzunsa (hep aynı yönde gidiyoruz) büyüt, kısaysa küçült.'],
      en: ['<b>Sampling</b>: draw λ candidates with <code>x = m + σ·y</code>, <code>y ~ N(0, C)</code>.', '<b>Selection</b>: take the best μ candidates; weight the best the most.', '<b>Shift the mean</b>: <code>m ← m + σ·Σ w<sub>i</sub> y<sub>i</sub></code>.', '<b>Evolution paths</b>: accumulate the direction of the recent steps (<code>p<sub>σ</sub></code>, <code>p<sub>c</sub></code>).', '<b>Update the covariance</b>: add the direction of good steps to the ellipse (rank-one and rank-μ updates).', '<b>Adapt σ</b>: grow it if the path is long (we keep going the same way), shrink it if it is short.']
    },
    demo(root) {
      const P = { fn: 'rastrigin', lambda: 12, sigma0: 0.3, iters: 80 };
      MH.demo2D(root, {
        P, sps: 3, make: (p, seed) => S.cmaes({ ...p }, MH.rngFor(seed)),
        points: sim => sim.samples.map(q => ({ x: q.x[0], y: q.x[1], c: q.sel ? col('--accent') : col('--muted'), r: q.sel ? 4.5 : 3 })),
        extra(ctx, sim, m) {
          const fn = sim.fn, ppu = 420 / (fn.max - fn.min), { B, l } = sim.axes;
          const ra = 2 * sim.sigma * Math.sqrt(l[0]) * ppu, rb = 2 * sim.sigma * Math.sqrt(l[1]) * ppu;
          ctx.save(); ctx.translate(m.X(sim.m[0]), m.Y(sim.m[1])); ctx.rotate(-Math.atan2(B[1][0], B[0][0]));
          ctx.strokeStyle = col('--warm'); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, Math.max(ra, 1), Math.max(rb, 1), 0, 0, 7); ctx.stroke(); ctx.restore();
          ctx.strokeStyle = col('--warm'); ctx.beginPath(); ctx.moveTo(m.X(sim.m[0]) - 6, m.Y(sim.m[1])); ctx.lineTo(m.X(sim.m[0]) + 6, m.Y(sim.m[1])); ctx.moveTo(m.X(sim.m[0]), m.Y(sim.m[1]) - 6); ctx.lineTo(m.X(sim.m[0]), m.Y(sim.m[1]) + 6); ctx.stroke();
        },
        stats: sim => [['σ', MH.fmt(sim.sigma, 3)], [{ tr: 'Elips oranı', en: 'Ellipse ratio' }, sim.axes ? MH.fmt(Math.sqrt(Math.max(sim.axes.l[0], 1e-20) / Math.max(sim.axes.l[1], 1e-20)), 2) : '–']],
        explain: sim => sim.iter ? t({ tr: 'Turuncu elips arama dağılımıdır (2σ). <b>Mavi</b> noktalar seçilen en iyi μ aday, gri noktalar elenenlerdir. İlerledikçe elips küçülür ve vadinin yönüne döner. Rastrigin\'de küçük bir popülasyon yerel bir çukura (f≈1) yerleşebilir: λ\'yı artırın.', en: 'The orange ellipse is the search distribution (2σ). <b>Blue</b> dots are the selected best μ candidates, grey dots the discarded ones. As it proceeds the ellipse shrinks and turns along the valley. On Rastrigin a small population may settle in a local pit (f≈1): increase λ.' }) : t({ tr: 'Adım\'a basın. Himmelblau veya Ackley\'de elipsin vadi boyunca uzamasını izleyin.', en: 'Press Step. On Himmelblau or Ackley watch the ellipse stretch along the valley.' }),
        controls: (k, p) => [
          MH.slider({ label: { tr: 'Popülasyon λ', en: 'Population λ' }, min: 6, max: 60, step: 2, value: p.lambda, onInput: v => { p.lambda = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Başlangıç σ', en: 'Initial σ' }, min: 0.05, max: 0.6, step: 0.05, value: p.sigma0, fmt: v => v.toFixed(2), onInput: v => { p.sigma0 = v; k.restart(); } }),
          iterSlider(k, p, 200)
        ],
        legend: MH.legend([['--accent', { tr: 'seçilen aday', en: 'selected candidate' }], ['--muted', { tr: 'elenen aday', en: 'discarded candidate' }], ['--warm', { tr: 'arama dağılımı', en: 'search distribution' }], ['--good', { tr: 'en iyi', en: 'best' }]])
      });
    },
    anns: {
      'CMAES.py': [
        { find: 'def f(position)', span: 2, text: { tr: 'Rastrigin: çok yerel minimumlu zor test fonksiyonu.', en: 'Rastrigin: a hard multimodal test function.' } },
        { find: 'def __init__', span: 28, text: { tr: 'Ağırlıklar ve öğrenme oranları (makaledeki varsayılanlar). <code>mu_eff</code> seçilen örneklerin "etkin sayısı"dır.', en: 'Weights and learning rates (the defaults of the paper). <code>mu_eff</code> is the "effective number" of the selected samples.' } },
        { find: '# eigen decomposition', span: 3, text: { tr: 'C = B·D²·Bᵀ: B elipsin eksenlerini, D eksen uzunluklarını verir.', en: 'C = B·D²·Bᵀ: B gives the axes of the ellipse, D their lengths.' } },
        { find: '# 1. sampling', span: 4, text: { tr: '<b>Örnekleme</b>: <code>y ~ N(0, C)</code>, <code>x = mean + σ·y</code>.', en: '<b>Sampling</b>: <code>y ~ N(0, C)</code>, <code>x = mean + σ·y</code>.' } },
        { find: '# 2. selection', span: 7, text: { tr: '<b>Seçilim ve yeniden birleştirme</b>: en iyi μ adımın ağırlıklı ortalaması ortalamayı taşır.', en: '<b>Selection and recombination</b>: the weighted mean of the μ best steps moves the mean.' } },
        { find: '# 3. evolution paths', span: 7, text: { tr: '<b>Evrim yolları</b>: arka arkaya adımların yönü birikir; hep aynı yöne gidiyorsak yol uzar.', en: '<b>Evolution paths</b>: the direction of consecutive steps accumulates; if we keep going the same way the path gets long.' } },
        { find: '# 4. covariance matrix adaptation', span: 5, text: { tr: '<b>Kovaryans güncellemesi</b>: rank-1 (yol) ve rank-μ (seçilen adımlar) güncellemeleri.', en: '<b>Covariance update</b>: rank-one (the path) and rank-μ (the selected steps) updates.' } },
        { find: '# 5. step size control', span: 2, text: { tr: '<b>σ kontrolü</b>: yol beklenenden uzunsa σ büyür, kısaysa küçülür.', en: '<b>σ control</b>: σ grows if the path is longer than expected, shrinks if shorter.' } }
      ]
    },
    notes: {
      tr: ['Bu kod <b>numpy</b> gerektirir (repodaki diğer dosyalar gibi) ve <b>(μ/μ<sub>w</sub>, λ)-CMA-ES</b>\'tir: seçilen adımlar ağırlıklı ortalanır. Bu sürümde yeniden başlatma yoktur; üretim sürümlerinde (IPOP-CMA-ES) takılınca popülasyon iki katına çıkarılarak yeniden başlanır.', '<b>Sınır</b> kısıtı yalnızca değerlendirme anında kırpma ile ele alınır (<code>np.clip</code>); gerçek uygulamalarda ceza ya da yeniden örnekleme tercih edilir.', '"En basit evrim stratejisi" (1+1)-ES\'tir: tek bireyli, 1/5 başarı kuralıyla σ ayarlayan bir yöntemdir. CMA-ES, bunu popülasyona ve tam kovaryansa genişletir.', 'Arama dağılımının elipsi <b>ölçekten ve dönmeden bağımsız</b> bir şekle uyum sağladığı için dar, eğri vadilerde (Rosenbrock gibi) PSO ve DE\'den çok daha hızlıdır.'],
      en: ['This code needs <b>numpy</b> (like the other repository files) and is a <b>(μ/μ<sub>w</sub>, λ)-CMA-ES</b>: the selected steps are weighted-averaged. There are no restarts in this version; production versions (IPOP-CMA-ES) restart with a doubled population when stalled.', 'The <b>bound</b> constraint is handled only by clipping at evaluation time (<code>np.clip</code>); real implementations prefer penalties or resampling.', 'The "simplest evolution strategy" is (1+1)-ES: a single individual with the 1/5 success rule for σ. CMA-ES extends it to a population and a full covariance.', 'Because the ellipse adapts to a shape <b>independent of scale and rotation</b>, it is much faster than PSO or DE on narrow, curved valleys (such as Rosenbrock).']
    },
    params: {
      tr: [['λ (popülasyon)', 'Varsayılan 4+⌊3 ln n⌋ küçüktür ve yerel çukura takılabilir; çok modlu problemlerde büyütmek (IPOP) güvenilirliği artırır.'], ['Başlangıç σ', 'Arama aralığının yaklaşık üçte biri iyi bir başlangıçtır; σ zaten otomatik ayarlanır.']],
      en: [['λ (population)', 'The default 4+⌊3 ln n⌋ is small and may fall into a local pit; enlarging it (IPOP) on multimodal problems increases reliability.'], ['Initial σ', 'About a third of the search range is a good start; σ is adapted automatically anyway.']]
    },
    pros: { tr: ['Neredeyse parametresiz (varsayılanlar iyi)', 'Ölçek ve dönmeden bağımsız', 'Kötü koşullu, eğri vadilerde çok güçlü'], en: ['Almost parameter-free (good defaults)', 'Invariant to scale and rotation', 'Very strong on ill-conditioned, curved valleys'] },
    cons: { tr: ['Matris işlemleri nedeniyle çok yüksek boyutta (≫100) pahalı', 'Yalnızca sürekli problemler', 'Gürültülü/çok modlu problemlerde büyük popülasyon ister'], en: ['Expensive in very high dimensions (≫100) because of matrix operations', 'Continuous problems only', 'Needs a large population on noisy/multimodal problems'] }
  });

  /* ================= PBIL ================= */
  MH.algoPage({
    id: 'pbil', group: 'g_evo', origin: 'added',
    title: { tr: 'PBIL · Olasılık Vektörü Öğrenmesi', en: 'PBIL · Probability Vector Learning' },
    nav: { tr: 'PBIL (EDA)', en: 'PBIL (EDA)' },
    blurb: { tr: 'Popülasyon yok: sadece "her bit 1 olur mu?" olasılıkları öğrenilir.', en: 'No population: only the "is each bit 1?" probabilities are learned.' },
    tagline: { tr: 'Dağılım Tahmini Algoritmalarının (EDA) en basiti: örnekle, en iyiye doğru öğren.', en: 'The simplest Estimation of Distribution Algorithm (EDA): sample, then learn towards the best.' },
    files: ['PBIL.py'],
    intuition: {
      tr: ['Genetik algoritma bireyleri evrimleştirir; PBIL ise <b>bireyleri hiç saklamaz</b>. Elinde her bit için "1 olma olasılığı" vardır (başta hepsi 0.5: hiçbir şey bilmiyoruz). Bu olasılıklardan çözümler üretir ve <b>en iyi örneğe doğru</b> olasılıkları kaydırır.', 'Zamanla olasılıklar 0\'a ya da 1\'e yaklaşır ve vektör, çözümün kendisine dönüşür. Çaprazlama yoktur; yerine "bu örnekten ne öğrendik?" vardır.'],
      en: ['A genetic algorithm evolves individuals; PBIL <b>stores no individuals at all</b>. It keeps, for each bit, a "probability of being 1" (all 0.5 at the start: we know nothing). It generates solutions from these probabilities and <b>shifts the probabilities towards the best sample</b>.', 'Over time the probabilities approach 0 or 1 and the vector turns into the solution itself. There is no crossover; instead there is "what did we learn from this sample?".']
    },
    steps: {
      tr: ['Tüm bitler için olasılık = 0.5.', '<b>Örnekle</b>: N çözüm üret (her bit olasılığıyla 1 olur).', 'Uygunluğu hesapla, <b>en iyi örneği</b> seç.', '<b>Öğren</b>: <code>p ← (1−LR)·p + LR·en_iyi</code>.', '<b>Mutasyon</b>: küçük olasılıkla bazı <code>p</code>\'leri rastgele 0/1\'e doğru it (keşfi koru).', 'Hedefe ulaşılana kadar tekrarla.'],
      en: ['Probability = 0.5 for every bit.', '<b>Sample</b>: generate N solutions (each bit is 1 with its probability).', 'Evaluate fitness and pick the <b>best sample</b>.', '<b>Learn</b>: <code>p ← (1−LR)·p + LR·best</code>.', '<b>Mutation</b>: with a small probability push some <code>p</code> towards a random 0/1 (keeps exploration alive).', 'Repeat until the target is reached.']
    },
    demo(root) {
      const P = { len: 24, n: 30, lr: 0.1, mutP: 0.02, mutShift: 0.05, maxGen: 200 }; let sim;
      MH.demo(root, {
        w: 760, h: 420, sps: 4, maxSps: 60, minSps: 1,
        init(k) { sim = S.pbil({ ...P }, MH.rngFor(k.seed)); },
        step: () => sim.step(), isDone: () => sim.done,
        draw(ctx) {
          ctx.fillStyle = col('--panel2'); ctx.fillRect(0, 0, 760, 260);
          ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = col('--muted'); ctx.fillText(t({ tr: 'Olasılık vektörü: her çubuk "bu bit 1 olur" olasılığı (altta gizli hedef bit)', en: 'Probability vector: each bar is "this bit is 1" (the hidden target bit below)' }), 10, 17);
          const L = P.len, cw = Math.min(30, 740 / L), x0 = 10 + (740 - cw * L) / 2;
          sim.prob.forEach((q, i) => {
            const x = x0 + i * cw, bh = 170 * q;
            const right = (q >= 0.5 ? 1 : 0) === sim.target[i];
            ctx.fillStyle = right ? col('--good') + 'bb' : col('--bad') + '88'; ctx.fillRect(x + 2, 215 - bh, cw - 4, bh);
            ctx.strokeStyle = col('--line'); ctx.strokeRect(x + 2.5, 45.5, cw - 5, 169);
            ctx.fillStyle = col('--text'); ctx.textAlign = 'center'; ctx.font = '700 12px ui-monospace, Consolas, monospace'; ctx.fillText(sim.target[i], x + cw / 2, 235);
            if (cw >= 22) { ctx.font = '10px system-ui, sans-serif'; ctx.fillStyle = col('--muted'); ctx.fillText(q.toFixed(2), x + cw / 2, 40); }
          });
          ctx.strokeStyle = col('--warm'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x0, 130); ctx.lineTo(x0 + cw * L, 130); ctx.stroke(); ctx.setLineDash([]); ctx.textAlign = 'left';
          MH.chart(ctx, 0, 270, 760, 150, [{ data: sim.histAvg, color: col('--warm'), label: { tr: 'örnek ortalaması', en: 'sample average' } }, { data: sim.histBest, color: col('--good'), label: { tr: 'en iyi örnek', en: 'best sample' }, width: 2 }], { title: { tr: 'Doğru bit sayısı / nesil', en: 'Correct bits / generation' }, minY: 0, maxY: P.len });
        },
        stats: () => [[{ tr: 'Nesil', en: 'Generation' }, sim.gen], [{ tr: 'En iyi örnek', en: 'Best sample' }, `${sim.histBest.length ? sim.histBest[sim.histBest.length - 1] : '–'}/${P.len}`]],
        explain: () => sim.done && sim.best.f === P.len ? t({ tr: `Hedef ${sim.gen} nesilde bulundu: olasılıklar tüm bitlerde doğru uca (0/1) yaklaştı.`, en: `The target was found in ${sim.gen} generations: the probabilities moved to the correct end (0/1) for all bits.` }) : t({ tr: 'Yeşil çubuk: olasılık doğru yönde (≥0.5 ise hedef 1, değilse 0). Başta hepsi 0.5; öğrendikçe çubuklar tavana ya da tabana gider.', en: 'A green bar means the probability points the right way (≥0.5 when the target is 1, otherwise 0). All bars start at 0.5; as it learns they move to the top or bottom.' }),
        controls: k => [
          MH.slider({ label: { tr: 'Bit sayısı', en: 'Bits' }, min: 8, max: 40, value: P.len, onInput: v => { P.len = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Örnek sayısı N', en: 'Samples N' }, min: 5, max: 100, value: P.n, onInput: v => { P.n = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Öğrenme oranı', en: 'Learning rate' }, min: 0.01, max: 0.5, step: 0.01, value: P.lr, fmt: v => v.toFixed(2), onInput: v => { P.lr = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Mutasyon olasılığı', en: 'Mutation probability' }, min: 0, max: 0.2, step: 0.01, value: P.mutP, fmt: v => v.toFixed(2), onInput: v => { P.mutP = v; k.restart(); } })
        ],
        legend: MH.legend([['--good', { tr: 'doğru yönde', en: 'pointing the right way' }], ['--bad', { tr: 'yanlış yönde', en: 'pointing the wrong way' }]])
      });
    },
    anns: {
      'PBIL.py': [
        { find: 'TARGET = ', span: 5, text: { tr: 'Aranan gizli çözüm ve uygunluk (doğru bit sayısı).', en: 'The hidden solution we search and the fitness (number of correct bits).' } },
        { find: 'def __init__', span: 11, text: { tr: 'Popülasyon yok, yalnızca <code>probabilities</code> vektörü (başta 0.5).', en: 'No population, only the <code>probabilities</code> vector (0.5 at the start).' } },
        { find: '# 1. sampling', span: 2, text: { tr: '<b>Örnekleme</b>: olasılık vektöründen çözümler üretilir.', en: '<b>Sampling</b>: solutions are generated from the probability vector.' } },
        { find: '# 2. learning', span: 3, text: { tr: '<b>Öğrenme</b>: olasılıklar en iyi örneğe doğru <code>learning_rate</code> kadar kayar.', en: '<b>Learning</b>: the probabilities move towards the best sample by <code>learning_rate</code>.' } },
        { find: '# 3. mutation', span: 4, text: { tr: 'Olasılık vektörüne mutasyon: keşif, bitlerin erken 0/1\'e kilitlenmesini önler.', en: 'Mutation of the probability vector: exploration prevents bits from locking to 0/1 too early.' } }
      ]
    },
    notes: {
      tr: ['Bu örnekte uygunluk <b>bitler arasında bağımsızdır</b> (doğru bit sayısı), PBIL\'in tam olarak çözebildiği problem sınıfıdır. Bitler arası bağımlılığı (epistazi) olan problemlerde <b>MIMIC</b>, <b>BOA</b> gibi daha zengin modeller gerekir.', 'Öğrenme oranı büyükse hızlı ama erken yakınsar (yanlış bitler 0/1\'e kilitlenir); küçükse güvenilir ama yavaştır. Mutasyon, kilitlenmeyi önleyen güvenlik supabıdır.', 'Python kodunda hedef (<code>TARGET</code>) rastgele üretilir; gerçek bir problemde <code>fitness</code> fonksiyonu sırt çantası, programlama vb. olurdu.'],
      en: ['In this example fitness is <b>independent across bits</b> (number of correct bits), which is exactly the class of problems PBIL can solve. For problems with dependencies between bits (epistasis) richer models such as <b>MIMIC</b> or <b>BOA</b> are needed.', 'A large learning rate converges fast but prematurely (wrong bits lock to 0/1); a small one is reliable but slow. The mutation is the safety valve that prevents locking.', 'In the Python code the target (<code>TARGET</code>) is generated randomly; in a real problem the <code>fitness</code> function would be a knapsack, a scheduling problem, etc.']
    },
    params: {
      tr: [['Öğrenme oranı', 'Hız ile güvenilirlik arasındaki ana düğme.'], ['Örnek sayısı', 'Çok örnek = en iyi örnek daha iyi; nesil başına daha pahalı.'], ['Mutasyon', 'Kilitlenmeyi önler; çok büyükse öğrenileni bozar.']],
      en: [['Learning rate', 'The main dial between speed and reliability.'], ['Sample count', 'More samples = better best sample; more expensive per generation.'], ['Mutation', 'Prevents locking; if too large it destroys what was learned.']]
    },
    pros: { tr: ['Çok basit ve hafif', 'Çaprazlama operatörü tasarlamak gerekmez', 'Öğrenilen model (olasılıklar) yorumlanabilir'], en: ['Very simple and lightweight', 'No crossover operator to design', 'The learned model (the probabilities) is interpretable'] },
    cons: { tr: ['Bitler arası bağımlılığı yakalayamaz', 'Erken yakınsama riski', 'İkili / ayrık problemler için tasarlanmıştır'], en: ['Cannot capture dependencies between bits', 'Risk of premature convergence', 'Designed for binary / discrete problems'] }
  });

  /* ================= Cross-Entropy Method ================= */
  MH.algoPage({
    id: 'cross-entropy', group: 'g_evo', origin: 'added',
    title: { tr: 'Çapraz Entropi Yöntemi (CEM)', en: 'Cross-Entropy Method (CEM)' },
    nav: { tr: 'Çapraz Entropi (CEM)', en: 'Cross-Entropy (CEM)' },
    blurb: { tr: 'Normal dağılımdan örnekle, en iyi %20\'ye dağılımı uydur, tekrarla.', en: 'Sample from a Gaussian, fit it to the best 20%, repeat.' },
    tagline: { tr: 'Sürekli uzay için dağılım tabanlı arama; pekiştirmeli öğrenmede de yaygın.', en: 'Distribution-based search for continuous spaces; also common in reinforcement learning.' },
    files: ['CrossEntropyMethod.py'],
    intuition: {
      tr: ['Sürekli uzayda iyi çözümlerin nerede olduğuna dair bir <b>inanç</b> tutarız: her koordinat için bir ortalama ve standart sapma. Bu inançtan örnekler çeker, <b>en iyi %ρ</b>\'sini (elit) seçer ve inancı bu elitlere uydururuz.', 'Dağılım her turda iyi bölgeye doğru kayar ve daralır. Kodda "çapraz entropi" ifadesi, elitlere uydurulan dağılımın en çok olabilirlik (maximum likelihood) tahminiyle aynı olduğundan gelir.'],
      en: ['In continuous space we keep a <b>belief</b> about where good solutions are: a mean and a standard deviation for each coordinate. We draw samples from the belief, pick the <b>best ρ fraction</b> (the elite) and fit the belief to those elites.', 'Each round the distribution drifts towards the good region and narrows. The name "cross-entropy" comes from the fact that fitting the distribution to the elites is the same as a maximum-likelihood estimate.']
    },
    steps: {
      tr: ['Başlangıç dağılımı: ortalama ve geniş bir standart sapma.', '<b>Örnekle</b>: N nokta çek.', '<b>Elit seç</b>: en iyi <code>ρ·N</code> nokta.', '<b>Uydur</b>: yeni ortalama ve std = elitlerin ortalaması ve std\'si.', '<b>Yumuşat</b>: <code>yeni = α·uydurulan + (1−α)·eski</code> (ani sıçramaları önler).', 'Dağılım daralana kadar tekrarla.'],
      en: ['Initial distribution: a mean and a wide standard deviation.', '<b>Sample</b>: draw N points.', '<b>Pick the elite</b>: the best <code>ρ·N</code> points.', '<b>Fit</b>: new mean and std = mean and std of the elite.', '<b>Smooth</b>: <code>new = α·fitted + (1−α)·old</code> (prevents sudden jumps).', 'Repeat until the distribution has collapsed.']
    },
    demo(root) {
      const P = { fn: 'rastrigin', n: 60, rho: 0.2, smooth: 0.7, iters: 40 };
      MH.demo2D(root, {
        P, sps: 3, make: (p, seed) => S.crossEntropy({ ...p }, MH.rngFor(seed)),
        points: sim => { const el = new Set(sim.elites); return sim.samples.map(q => ({ x: q.x[0], y: q.x[1], c: el.has(q) ? col('--accent') : col('--muted'), r: el.has(q) ? 4.5 : 3 })); },
        extra(ctx, sim, m) {
          const ppu = 420 / (sim.fn.max - sim.fn.min), cx = m.X(sim.mean[0]), cy = m.Y(sim.mean[1]);
          ctx.strokeStyle = col('--warm'); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(2 * sim.std[0] * ppu, 1), Math.max(2 * sim.std[1] * ppu, 1), 0, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6); ctx.stroke();
        },
        stats: sim => [[{ tr: 'std (x, y)', en: 'std (x, y)' }, `${MH.fmt(sim.std[0], 3)}, ${MH.fmt(sim.std[1], 3)}`]],
        explain: sim => sim.iter ? t({ tr: 'Turuncu elips mevcut dağılımın (2σ) şeklidir. <b>Mavi</b> noktalar elit, gri noktalar elenenler. Yumuşatma (α) küçükse dağılım yavaş ve temkinli değişir; Rastrigin gibi çok çukurlu fonksiyonlarda bu daha güvenlidir.', en: 'The orange ellipse is the current distribution (2σ). <b>Blue</b> dots are the elite, grey dots the others. With a small smoothing α the distribution changes slowly and cautiously, which is safer on pit-filled functions like Rastrigin.' }) : t({ tr: 'Adım\'a basın: örnekle → elit seç → dağılımı uydur.', en: 'Press Step: sample → pick the elite → fit the distribution.' }),
        controls: (k, p) => [
          MH.slider({ label: { tr: 'Örnek N', en: 'Samples N' }, min: 20, max: 200, step: 10, value: p.n, onInput: v => { p.n = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Elit oranı ρ', en: 'Elite fraction ρ' }, min: 0.05, max: 0.5, step: 0.05, value: p.rho, fmt: v => v.toFixed(2), onInput: v => { p.rho = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Yumuşatma α', en: 'Smoothing α' }, min: 0.1, max: 1, step: 0.05, value: p.smooth, fmt: v => v.toFixed(2), onInput: v => { p.smooth = v; k.restart(); } }),
          iterSlider(k, p, 100)
        ],
        legend: MH.legend([['--accent', { tr: 'elit', en: 'elite' }], ['--muted', { tr: 'diğer örnekler', en: 'other samples' }], ['--warm', { tr: 'dağılım', en: 'distribution' }], ['--good', { tr: 'en iyi', en: 'best' }]])
      });
    },
    anns: {
      'CrossEntropyMethod.py': [
        { find: 'def __init__', span: 14, text: { tr: '<code>mean</code> ve <code>std</code> arama dağılımıdır; <code>rho</code> elit oranı, <code>smoothing</code> dağılımın ne kadar hızlı değiştiği.', en: '<code>mean</code> and <code>std</code> are the search distribution; <code>rho</code> is the elite fraction, <code>smoothing</code> how fast the distribution changes.' } },
        { find: '# 1. sampling', span: 3, text: { tr: '<b>Örnekleme</b>: her koordinat kendi normal dağılımından çekilir ve sınırlara kırpılır.', en: '<b>Sampling</b>: each coordinate is drawn from its own normal distribution and clamped to the bounds.' } },
        { find: '# 2. the elite', span: 2, text: { tr: '<b>Elitler</b>: en iyi <code>rho·N</code> örnek.', en: '<b>The elite</b>: the best <code>rho·N</code> samples.' } },
        { find: '# 3. fit', span: 7, text: { tr: '<b>Uydurma + yumuşatma</b>: elitlerin ortalaması/std\'si ile eski dağılım harmanlanır.', en: '<b>Fit + smoothing</b>: the elite mean/std are blended with the old distribution.' } }
      ]
    },
    notes: {
      tr: ['Dağılım <b>çapraz terimsiz</b> (diyagonal kovaryans) tutulur: koordinatlar bağımsız kabul edilir. CMA-ES\'in farkı tam kovaryansı öğrenmesidir; bu yüzden döndürülmüş vadilerde CEM zayıf kalır.', '<b>Yumuşatma</b> olmadan (α=1) standart sapma bir turda aşırı daralıp aramayı yerel bir çukura kilitleyebilir. Std\'ye küçük bir taban (<code>1e-6</code>) eklenir.', 'CEM aynı zamanda <b>nadir olay simülasyonu</b> ve <b>pekiştirmeli öğrenme</b> (politika arama) için de standart bir araçtır; örnekleme + elit seçimi fikri aynıdır.'],
      en: ['The distribution is kept <b>without cross terms</b> (diagonal covariance): the coordinates are assumed independent. CMA-ES differs by learning the full covariance, which is why CEM is weak on rotated valleys.', 'Without <b>smoothing</b> (α=1) the standard deviation can collapse in one round and lock the search into a local pit. A small floor (<code>1e-6</code>) is added to the std.', 'CEM is also a standard tool for <b>rare-event simulation</b> and for <b>reinforcement learning</b> (policy search); the idea of sampling + elite selection is the same.']
    },
    params: {
      tr: [['Örnek N', 'Çok örnek = daha güvenilir dağılım tahmini.'], ['Elit oranı ρ', 'Küçük = hızlı ama gürültülü; büyük = yavaş ve kararlı.'], ['Yumuşatma α', '1\'e yakın = hızlı; 0.5–0.8 çok modlu fonksiyonlarda daha güvenli.']],
      en: [['Samples N', 'More samples = a more reliable distribution estimate.'], ['Elite fraction ρ', 'Small = fast but noisy; large = slow and stable.'], ['Smoothing α', 'Near 1 = fast; 0.5–0.8 is safer on multimodal functions.']]
    },
    pros: { tr: ['Çok kısa ve anlaşılır', 'Türev gerektirmez', 'RL ve nadir olay simülasyonuyla bağ kurar'], en: ['Very short and easy to understand', 'No derivatives needed', 'Connects to RL and rare-event simulation'] },
    cons: { tr: ['Diyagonal dağılım: koordinatlar arası ilişkiyi yakalayamaz', 'Çok modlu fonksiyonda tek tepeye kilitlenebilir', 'Çok örnek ister'], en: ['Diagonal distribution: cannot capture relationships between coordinates', 'May lock onto one peak on multimodal functions', 'Needs many samples'] }
  });

  /* ================= Firefly ================= */
  MH.algoPage({
    id: 'firefly', group: 'g_nature', origin: 'added',
    title: { tr: 'Ateş Böceği Algoritması', en: 'Firefly Algorithm' },
    nav: { tr: 'Ateş Böceği', en: 'Firefly' },
    blurb: { tr: 'Her ateş böceği, daha parlak olan komşularına doğru çekilir.', en: 'Every firefly is drawn towards the brighter ones.' },
    tagline: { tr: 'Çekicilik uzaklıkla azalır: böylece sürü doğal olarak birden fazla tepeye bölünebilir.', en: 'Attraction fades with distance, so the swarm can naturally split into several groups.' },
    files: ['FireflyAlgorithm.py'],
    intuition: {
      tr: ['Ateş böcekleri ışıkla eş çeker; parlak olan daha çekicidir, ama ışık uzaklıkla ve havada sönümlenir. Algoritmada <b>parlaklık = çözümün kalitesi</b>dir.', 'Her böcek, kendisinden daha parlak <b>her</b> böceğe doğru, uzaklıkla azalan bir çekimle hareket eder ve biraz rastgele sapar. PSO\'dan farkı: tek bir "sürü en iyisi" yoktur; herkes yakındaki parlaklara bakar. Bu, çok modlu fonksiyonlarda <b>birden çok tepede toplanma</b> sağlar.'],
      en: ['Fireflies attract mates with light; a brighter one is more attractive, but light fades with distance and in the air. In the algorithm <b>brightness = solution quality</b>.', 'Each firefly moves towards <b>every</b> brighter firefly with an attraction that decays with distance and adds a bit of random drift. Unlike PSO there is no single "swarm best"; everyone looks at the bright ones nearby. This lets the swarm <b>gather on several peaks</b> of a multimodal function.']
    },
    steps: {
      tr: ['Ateş böceklerini rastgele konumlandır; parlaklık = uygunluk.', 'Her çift (i, j) için j, i\'den parlaksa: <code>β = β₀·e<sup>−γ·r²</sup></code> hesapla.', '<code>x<sub>i</sub> ← x<sub>i</sub> + β·(x<sub>j</sub> − x<sub>i</sub>) + α·rastgele</code>.', 'Yeni konumun parlaklığını güncelle.', 'α\'yı küçült ve tekrarla.'],
      en: ['Place the fireflies at random; brightness = fitness.', 'For each pair (i, j) where j is brighter than i compute <code>β = β₀·e<sup>−γ·r²</sup></code>.', '<code>x<sub>i</sub> ← x<sub>i</sub> + β·(x<sub>j</sub> − x<sub>i</sub>) + α·random</code>.', 'Update the brightness of the new position.', 'Shrink α and repeat.']
    },
    demo(root) {
      const P = { fn: 'himmelblau', n: 20, alpha: 0.3, beta0: 1, gamma: 2, iters: 80 };
      MH.demo2D(root, {
        P, sps: 3, make: (p, seed) => S.firefly({ ...p }, MH.rngFor(seed)),
        points: sim => sim.ff.map(q => ({ x: q.x[0], y: q.x[1], c: col('--warm'), r: 4.5 })),
        stats: sim => [['α', sim.alpha.toFixed(3)]],
        explain: sim => sim.iter ? t({ tr: 'γ büyükse (güçlü sönümleme) böcekler yalnızca yakındaki parlaklara bakar ve Himmelblau\'nun 4 çukuruna <b>bölünebilir</b>; γ küçükse tek bir noktada toplanırlar.', en: 'With a large γ (strong absorption) the fireflies only look at nearby bright ones and can <b>split</b> among Himmelblau\'s 4 pits; with a small γ they gather on a single point.' }) : t({ tr: 'Himmelblau\'da 4 eşit minimum vardır. γ\'yı değiştirip sürünün tek mi çok mu gruba ayrıldığını izleyin.', en: 'Himmelblau has 4 equal minima. Change γ and watch whether the swarm gathers in one or several groups.' }),
        controls: (k, p) => [
          sizeSlider(k, p, 'n', { tr: 'Ateş böceği', en: 'Fireflies' }, 5, 50),
          MH.slider({ label: { tr: 'γ (sönümleme)', en: 'γ (absorption)' }, min: 0.1, max: 10, step: 0.1, value: p.gamma, fmt: v => v.toFixed(1), onInput: v => { p.gamma = v; k.restart(); } }),
          MH.slider({ label: { tr: 'α (rastgelelik)', en: 'α (randomness)' }, min: 0, max: 1, step: 0.05, value: p.alpha, fmt: v => v.toFixed(2), onInput: v => { p.alpha = v; k.restart(); } }),
          iterSlider(k, p, 200)
        ],
        legend: MH.legend([['--warm', { tr: 'ateş böceği', en: 'firefly' }], ['--good', { tr: 'en iyi', en: 'best' }]])
      });
    },
    anns: {
      'FireflyAlgorithm.py': [
        { find: 'def __init__', span: 14, text: { tr: '<code>beta0</code> temel çekicilik, <code>gamma</code> ışık sönümlemesi, <code>alpha</code> rastgele adım.', en: '<code>beta0</code> base attractiveness, <code>gamma</code> light absorption, <code>alpha</code> random step.' } },
        { find: '# we are minimizing', span: 2, text: { tr: 'Minimizasyon: küçük değer = parlak. Yalnızca <b>daha parlak</b> böceğe doğru hareket edilir.', en: 'Minimisation: smaller value = brighter. A firefly only moves towards a <b>brighter</b> one.' } },
        { find: '# the attractiveness', span: 2, text: { tr: 'Çekicilik uzaklıkla üstel azalır: <code>β = β₀·e^(−γr²)</code>.', en: 'Attractiveness decays exponentially with distance: <code>β = β₀·e^(−γr²)</code>.' } },
        { find: '# move towards', span: 6, text: { tr: 'Parlak böceğe doğru adım + küçük rastgele sapma; sınırlara kırpılır.', en: 'A step towards the brighter firefly + a small random drift; clamped to the bounds.' } },
        { find: '# the randomness', span: 2, text: { tr: 'α azalır: keşiften sömürüye geçiş.', en: 'α decays: from exploration to exploitation.' } }
      ]
    },
    notes: {
      tr: ['İki iç içe döngü olduğundan iterasyon başına maliyet <b>O(n²)</b>\'dir; çok sayıda böcekte yavaştır.', 'Mesafe, arama alanının genişliğine bölünerek normalize edilir; makalenin ham mesafe kullanan sürümlerinde γ\'nın anlamı problem ölçeğine bağlıdır.', 'Böcek, yeni konumuna gittikten <b>hemen sonra</b> parlaklığını günceller; bu yüzden aynı iterasyonda sonraki çiftler güncel değerleri görür.'],
      en: ['With two nested loops the cost per iteration is <b>O(n²)</b>; it is slow with many fireflies.', 'The distance is normalised by the width of the search space; in versions of the paper that use the raw distance the meaning of γ depends on the problem scale.', 'A firefly updates its brightness <b>immediately</b> after moving, so later pairs in the same iteration see the up-to-date values.']
    },
    params: {
      tr: [['γ', 'Büyük = yerel gruplar (çok modlu); küçük = tek küresel sürü (PSO\'ya benzer).'], ['α', 'Rastgelelik; başta büyük, sonra küçük tutmak (burada ×0.97) iyi çalışır.'], ['β₀', 'Çekimin gücü; 1 standarttır.']],
      en: [['γ', 'Large = local groups (multimodal); small = one global swarm (similar to PSO).'], ['α', 'Randomness; large at first and then small (×0.97 here) works well.'], ['β₀', 'Strength of the attraction; 1 is standard.']]
    },
    pros: { tr: ['Çok modlu fonksiyonlarda doğal alt-sürü oluşumu', 'Sezgisel ve görselleştirmesi güzel', 'Kısıt koymak kolay'], en: ['Natural sub-swarms on multimodal functions', 'Intuitive and nice to visualise', 'Easy to add constraints'] },
    cons: { tr: ['O(n²) maliyet', 'Parametrelere (γ, α) duyarlı', 'Yüksek boyutta yakınsama yavaş'], en: ['O(n²) cost', 'Sensitive to the parameters (γ, α)', 'Slow convergence in high dimensions'] }
  });

  /* ================= Cuckoo Search ================= */
  MH.algoPage({
    id: 'cuckoo', group: 'g_nature', origin: 'added',
    title: { tr: 'Guguk Kuşu Arayışı', en: 'Cuckoo Search' },
    nav: { tr: 'Guguk Kuşu', en: 'Cuckoo' },
    blurb: { tr: 'Lévy uçuşlarıyla yeni yuva bulur, bir kısım yuva keşfedilip bırakılır.', en: 'Finds new nests with Lévy flights; a fraction of nests is discovered and abandoned.' },
    tagline: { tr: 'Çok küçük adımlar ve ara sıra çok uzun sıçramalar: kuyruğu ağır dağılım.', en: 'Many tiny steps and now and then a very long jump: a heavy-tailed distribution.' },
    files: ['CuckooSearch.py'],
    intuition: {
      tr: ['Guguk kuşları yumurtalarını başka kuşların yuvasına bırakır. Ev sahibi yabancı yumurtayı fark ederse yumurtayı atar ya da yuvayı terk eder. Algoritmada <b>yuva = aday çözüm</b>, yumurta = yeni çözümdür.', 'Yeni yuva bulmak için <b>Lévy uçuşu</b> kullanılır: çoğunlukla küçük adımlar (yerel arama), ara sıra çok büyük sıçramalar (global keşif). İnsan, hayvan ve ışık aramalarında da gözlenen bu adım dağılımı, tek bir ölçekli Gauss adımından çok daha etkilidir.'],
      en: ['Cuckoos lay their eggs in other birds\' nests. If the host notices the alien egg it throws it out or abandons the nest. In the algorithm a <b>nest = a candidate solution</b> and an egg = a new solution.', 'To find new nests it uses a <b>Lévy flight</b>: mostly small steps (local search) and occasionally huge jumps (global exploration). This step distribution, also observed in animal and light foraging, is much more effective than a single-scale Gaussian step.']
    },
    steps: {
      tr: ['Rastgele yuvalar oluştur.', '<b>Lévy uçuşu</b>: her yuva için en iyi yuvaya göre Lévy adımlı yeni bir çözüm üret; daha iyiyse yuvanın yerine koy.', '<b>Keşfedilme</b>: her yuva <code>pa</code> olasılıkla keşfedilir; başka iki yuvadan türetilen yeni bir çözümle denenir (daha iyiyse değişir).', 'En iyi yuvayı güncelle ve tekrarla.'],
      en: ['Create random nests.', '<b>Lévy flight</b>: for each nest build a new solution with a Lévy step relative to the best nest; replace the nest if better.', '<b>Discovery</b>: each nest is discovered with probability <code>pa</code>; a new solution derived from two other nests is tried (replaces if better).', 'Update the best nest and repeat.']
    },
    demo(root) {
      const P = { fn: 'rastrigin', n: 20, pa: 0.25, alpha: 1, iters: 120 };
      MH.demo2D(root, {
        P, sps: 4, maxSps: 80, make: (p, seed) => S.cuckoo({ ...p }, MH.rngFor(seed)),
        points: sim => popPoints(sim.nests, '--accent'),
        extra(ctx, sim, m) {
          ctx.strokeStyle = col('--violet'); ctx.lineWidth = 1;
          for (const [a, b] of sim.lastFlights) { ctx.beginPath(); ctx.moveTo(m.X(a[0]), m.Y(a[1])); ctx.lineTo(m.X(b[0]), m.Y(b[1])); ctx.stroke(); }
        },
        stats: sim => [[{ tr: 'Keşfedilen yuva (son)', en: 'Discovered nests (last)' }, sim.abandoned]],
        explain: sim => sim.iter ? t({ tr: 'Mor çizgiler bu iterasyonun Lévy uçuşlarıdır: çoğu kısa, bazıları çok uzun. Uzun sıçramalar arama alanının uzak köşelerini de dener.', en: 'The purple lines are this iteration\'s Lévy flights: most are short, a few very long. The long jumps also probe distant corners of the search space.' }) : t({ tr: 'Adım\'a basın ve mor çizgilerdeki adım uzunluklarının dağılımına bakın.', en: 'Press Step and look at the distribution of step lengths in the purple lines.' }),
        controls: (k, p) => [
          sizeSlider(k, p, 'n', { tr: 'Yuva', en: 'Nests' }, 5, 50),
          MH.slider({ label: { tr: 'pa (keşif olasılığı)', en: 'pa (discovery prob.)' }, min: 0, max: 0.8, step: 0.05, value: p.pa, fmt: v => v.toFixed(2), onInput: v => { p.pa = v; k.restart(); } }),
          MH.slider({ label: { tr: 'α (adım ölçeği)', en: 'α (step scale)' }, min: 0.1, max: 3, step: 0.1, value: p.alpha, fmt: v => v.toFixed(1), onInput: v => { p.alpha = v; k.restart(); } }),
          iterSlider(k, p, 300)
        ],
        legend: MH.legend([['--accent', { tr: 'yuva', en: 'nest' }], ['--violet', { tr: 'Lévy uçuşu', en: 'Lévy flight' }], ['--good', { tr: 'en iyi', en: 'best' }]])
      });
    },
    anns: {
      'CuckooSearch.py': [
        { find: 'def __init__', span: 10, text: { tr: '<code>pa</code> yabancı yumurtanın keşfedilme olasılığı, <code>alpha</code> Lévy adımının ölçeği.', en: '<code>pa</code> is the probability that the alien egg is discovered, <code>alpha</code> the scale of the Lévy step.' } },
        { find: '# 1. every cuckoo', span: 10, text: { tr: '<b>Lévy uçuşları</b>: en iyi yuvaya göre kuyruğu ağır adım; daha iyiyse yuva değişir.', en: '<b>Lévy flights</b>: a heavy-tailed step relative to the best nest; the nest changes if better.' } },
        { find: '# 2. a fraction pa', span: 10, text: { tr: '<b>Keşif</b>: yuvanın <code>pa</code> olasılıkla "bulunup" başka iki yuvanın farkıyla yeniden kurulması.', en: '<b>Discovery</b>: with probability <code>pa</code> a nest is "found" and rebuilt from the difference of two other nests.' } },
        { find: '# Levy flight step', span: 6, text: { tr: '<b>Mantegna algoritması</b> (β=1.5): Lévy dağılımına yakın adım üretir.', en: '<b>The Mantegna algorithm</b> (β=1.5): generates a step close to a Lévy distribution.' } }
      ]
    },
    notes: {
      tr: ['Burada her yuva yalnızca <b>kendi eski değeriyle</b> yarışır (greedy). Orijinal makalenin kodunda yeni çözüm rastgele seçilen bir yuvayla yarıştırılır; sonuç benzerdir.', 'Lévy adımının çarpanı (<code>x − best</code>) olduğundan en iyi yuvanın adımı <b>sıfırdır</b>; en iyi bu uçuşlarda yerinde durur ve yalnızca keşif aşamasıyla değişebilir.', 'Lévy dağılımının ağır kuyruğu nedeniyle bazı adımlar çok büyük olabilir; kod sonucu sınırlara kırpar. Adım ölçeğini (α) fazla büyütmek aramayı rastgeleleştirir.'],
      en: ['Here each nest competes only with <b>its own old value</b> (greedy). In the code of the original paper the new solution competes with a randomly chosen nest; the outcome is similar.', 'Because the Lévy step is multiplied by <code>(x − best)</code> the best nest\'s step is <b>zero</b>; the best stays put in these flights and can change only in the discovery phase.', 'Because of the heavy tail of the Lévy distribution some steps can be huge; the code clamps the result to the bounds. Making the step scale (α) too large turns the search random.']
    },
    params: {
      tr: [['pa', 'Küçük = daha çok sömürü; büyük = daha çok yeniden başlatma (keşif). 0.25 standarttır.'], ['α', 'Lévy adımının ölçeği; arama alanı büyüklüğüne göre seçilmeli.'], ['Yuva sayısı', 'Genelde 15–50.']],
      en: [['pa', 'Small = more exploitation; large = more restarts (exploration). 0.25 is standard.'], ['α', 'The scale of the Lévy step; choose it relative to the size of the search space.'], ['Number of nests', 'Typically 15–50.']]
    },
    pros: { tr: ['Çok az parametre (pa, α)', 'Lévy uçuşu keşif/sömürüyü doğal dengeler', 'Çok modlu fonksiyonlarda güçlü'], en: ['Very few parameters (pa, α)', 'The Lévy flight balances exploration/exploitation naturally', 'Strong on multimodal functions'] },
    cons: { tr: ['Lévy adımlarının ölçeğine duyarlı', 'Biyolojik metafor yoğun; sonuçlar Gauss varyantlarına yakın olabilir', 'Yüksek boyutta yavaşlar'], en: ['Sensitive to the scale of the Lévy steps', 'Heavy biological metaphor; results can be close to Gaussian variants', 'Slows down in high dimensions'] }
  });

  /* ================= Bat Algorithm ================= */
  MH.algoPage({
    id: 'bat', group: 'g_nature', origin: 'added',
    title: { tr: 'Yarasa Algoritması', en: 'Bat Algorithm' },
    nav: { tr: 'Yarasa', en: 'Bat' },
    blurb: { tr: 'Ekolokasyon: ava yaklaştıkça sesi kısar, darbe sıklığını artırır.', en: 'Echolocation: gets quieter and pulses faster as it nears the prey.' },
    tagline: { tr: 'Frekansla ayarlanan hız + avın yakınında yerel rastgele yürüyüş.', en: 'Frequency-tuned velocity + a local random walk near the prey.' },
    files: ['BatAlgorithm.py'],
    intuition: {
      tr: ['Yarasalar karanlıkta ses darbeleri göndererek avlanır. Av uzaktayken <b>yüksek sesli ve seyrek</b> darbeler gönderir, ava yaklaştıkça sesi <b>kısar</b> ve darbeleri <b>sıklaştırır</b>.', 'Algoritmada ses şiddeti <code>A</code> azalır, darbe oranı <code>r</code> artar. Yarasa rastgele bir frekansla en iyi konuma doğru uçar; darbe oranı yüksekse en iyi çözümün <b>etrafında yerel bir yürüyüş</b> yapar. Yeni çözüm ancak hem daha iyiyse hem de yarasa "yeterince yüksek sesliyse" kabul edilir.'],
      en: ['Bats hunt in the dark by sending sound pulses. When the prey is far they send <b>loud, sparse</b> pulses; when closing in they get <b>quieter</b> and <b>pulse faster</b>.', 'In the algorithm the loudness <code>A</code> decreases and the pulse rate <code>r</code> increases. A bat flies towards the best position with a random frequency; with a high pulse rate it makes a <b>local walk around the best solution</b>. A new solution is accepted only if it is better <i>and</i> the bat is "loud enough".']
    },
    steps: {
      tr: ['Yarasaları rastgele konum, sıfır hız, ses A₀ ve düşük darbe oranıyla başlat.', '<b>Frekans</b>: rastgele <code>f ∈ [0, f<sub>max</sub>]</code>; <code>v ← v + (x − en_iyi)·f</code>; <code>x ← x + v</code>.', 'Rastgele sayı <code>r</code>\'den büyükse: en iyi çözümün etrafında <b>yerel yürüyüş</b>.', 'Yeni çözüm daha iyiyse <b>ve</b> rastgele sayı <code>A</code>\'dan küçükse kabul et; <code>A ← α·A</code>, <code>r ← r₀(1 − e<sup>−γt</sup>)</code>.', 'En iyiyi güncelle ve tekrarla.'],
      en: ['Start the bats at random positions, zero velocity, loudness A₀ and a low pulse rate.', '<b>Frequency</b>: random <code>f ∈ [0, f<sub>max</sub>]</code>; <code>v ← v + (x − best)·f</code>; <code>x ← x + v</code>.', 'If a random number is greater than <code>r</code>: a <b>local walk</b> around the best solution.', 'Accept the new solution if it is better <b>and</b> a random number is below <code>A</code>; <code>A ← α·A</code>, <code>r ← r₀(1 − e<sup>−γt</sup>)</code>.', 'Update the best and repeat.']
    },
    demo(root) {
      const P = { fn: 'rastrigin', n: 20, fmax: 2, A0: 1, r0: 0.5, alpha: 0.9, gamma: 0.9, iters: 120 };
      MH.demo2D(root, {
        P, sps: 4, maxSps: 80, make: (p, seed) => S.bat({ ...p }, MH.rngFor(seed)),
        points: sim => sim.bats.map(b => ({ x: b.x[0], y: b.x[1], c: col('--violet'), r: 3 + 4 * Math.min(1, b.A) })),
        stats: sim => [[{ tr: 'Ort. ses şiddeti A', en: 'Mean loudness A' }, MH.fmt(sim.bats.reduce((s, b) => s + b.A, 0) / sim.bats.length, 3)], [{ tr: 'Ort. darbe oranı r', en: 'Mean pulse rate r' }, MH.fmt(sim.bats.reduce((s, b) => s + b.r, 0) / sim.bats.length, 3)]],
        explain: sim => t({ tr: 'Nokta büyüklüğü yarasanın <b>ses şiddetini</b> gösterir: başta büyük (gürültülü, keşif), zamanla küçülür (sessiz, sömürü). Rastrigin\'de yarasa algoritması sıklıkla bir yerel çukurda kalır: bu normaldir, notlara bakın.', en: 'The dot size shows the bat\'s <b>loudness</b>: large at first (loud, exploring) and smaller over time (quiet, exploiting). On Rastrigin the bat algorithm often stays in a local pit: this is normal, see the notes.' }),
        controls: (k, p) => [
          sizeSlider(k, p, 'n', { tr: 'Yarasa', en: 'Bats' }, 5, 50),
          MH.slider({ label: { tr: 'f_max', en: 'f_max' }, min: 0.5, max: 4, step: 0.5, value: p.fmax, fmt: v => v.toFixed(1), onInput: v => { p.fmax = v; k.restart(); } }),
          MH.slider({ label: { tr: 'α (ses azalması)', en: 'α (loudness decay)' }, min: 0.5, max: 0.99, step: 0.01, value: p.alpha, fmt: v => v.toFixed(2), onInput: v => { p.alpha = v; k.restart(); } }),
          iterSlider(k, p, 300)
        ],
        legend: MH.legend([['--violet', { tr: 'yarasa (büyüklük = ses şiddeti)', en: 'bat (size = loudness)' }], ['--good', { tr: 'en iyi', en: 'best' }]])
      });
    },
    anns: {
      'BatAlgorithm.py': [
        { find: 'class Bat', span: 14, text: { tr: 'Yarasa: konum, hız, <b>ses şiddeti</b> (azalır) ve <b>darbe oranı</b> (artar).', en: 'A bat: position, velocity, <b>loudness</b> (decreases) and <b>pulse rate</b> (increases).' } },
        { find: 'def __init__(self, min_x, max_x, dimensions=2, n_bats', span: 5, text: { tr: '<code>f_max</code> hız ölçeği, <code>alpha</code> ses azalması, <code>gamma</code> darbe oranı artışı.', en: '<code>f_max</code> velocity scale, <code>alpha</code> loudness decay, <code>gamma</code> pulse-rate growth.' } },
        { find: '# the frequency is random', span: 5, text: { tr: '<b>Frekans ve hız</b>: en iyi konuma doğru, rastgele frekansla orantılı çekim.', en: '<b>Frequency and velocity</b>: a pull towards the best position proportional to a random frequency.' } },
        { find: '# the bat is close', span: 4, text: { tr: '<b>Yerel yürüyüş</b>: en iyi çözümün etrafında, ortalama ses şiddetiyle ölçeklenen küçük rastgele adım.', en: '<b>Local walk</b>: a small random step around the best solution scaled by the mean loudness.' } },
        { find: '# the new solution is accepted', span: 5, text: { tr: '<b>Kabul</b>: daha iyi <i>ve</i> yeterince yüksek sesli; sonra A azalır, r artar.', en: '<b>Acceptance</b>: better <i>and</i> loud enough; then A decreases and r increases.' } }
      ]
    },
    notes: {
      tr: ['<b>Ses şiddeti her kabulde α ile çarpılır</b>; kabul sayısı arttıkça yarasa sessizleşir ve yeni çözümleri kabul etmeyi bırakır. Bu, algoritmanın erken donmasına yol açabilir; çok modlu fonksiyonlarda (Rastrigin) takılma sık görülür.', 'Algoritma, yeterince büyük <code>f_max</code> ve en iyiye doğru hız çekimi nedeniyle <b>PSO\'nun bir varyantı</b> olarak da yorumlanabilir; farkı yerel yürüyüş ve ses/darbe mekanizmasıdır.', 'Yerel yürüyüş adımı <code>0.1·genişlik·ortalama_ses</code> ile ölçeklenir; ses azaldıkça adım küçülür (kendiliğinden bir "soğuma").'],
      en: ['<b>The loudness is multiplied by α at every acceptance</b>; as acceptances accumulate the bat gets quiet and stops accepting new solutions. This can freeze the algorithm early; getting stuck is common on multimodal functions (Rastrigin).', 'Because of the velocity pull towards the best with a large enough <code>f_max</code> the algorithm can also be read as a <b>variant of PSO</b>; what differs is the local walk and the loudness/pulse mechanism.', 'The local-walk step scales with <code>0.1·width·mean_loudness</code>; as the loudness drops the step shrinks (a built-in "cooling").']
    },
    params: {
      tr: [['f_max', 'Hız ölçeği: büyük = daha büyük sıçramalar.'], ['α', 'Ses azalması: küçük = hızlı sessizleşme = erken sömürü.'], ['γ', 'Darbe oranının artış hızı.']],
      en: [['f_max', 'Velocity scale: large = bigger jumps.'], ['α', 'Loudness decay: small = fast quieting = early exploitation.'], ['γ', 'How fast the pulse rate grows.']]
    },
    pros: { tr: ['Otomatik keşif→sömürü geçişi (ses/darbe)', 'Basit güncelleme kuralları', 'Düşük boyutlu problemlerde hızlı'], en: ['Automatic exploration→exploitation switch (loudness/pulse)', 'Simple update rules', 'Fast on low-dimensional problems'] },
    cons: { tr: ['Erken donma / yerel optimuma takılma', 'Çok parametre (f_max, A₀, r₀, α, γ)', 'Teorik temeli zayıf, PSO ile benzer'], en: ['Early freezing / stalling in local optima', 'Many parameters (f_max, A₀, r₀, α, γ)', 'Weak theoretical basis; similar to PSO'] }
  });

  /* ================= Whale Optimization ================= */
  MH.algoPage({
    id: 'woa', group: 'g_nature', origin: 'added',
    title: { tr: 'Balina Optimizasyon Algoritması (WOA)', en: 'Whale Optimization Algorithm (WOA)' },
    nav: { tr: 'Balina (WOA)', en: 'Whale (WOA)' },
    blurb: { tr: 'Kambur balinaların kabarcık ağı: avı çevreleme ve sarmal saldırı.', en: 'The bubble-net feeding of humpback whales: encircling the prey and a spiral attack.' },
    tagline: { tr: 'Üç davranış: çevrele, rastgele ara, sarmalla.', en: 'Three behaviours: encircle, search randomly, spiral.' },
    files: ['WhaleOptimization.py'],
    intuition: {
      tr: ['Kambur balinalar avı (balık sürüsünü) çevreleyip <b>sarmal şeklinde yüzerek</b> kabarcıklarla sıkıştırır. WOA bu davranışı üç harekete çevirir: <b>avı çevrele</b> (en iyi çözüme yaklaş), <b>sarmal saldırı</b> (en iyi etrafında logaritmik sarmal) ve <b>rastgele arama</b> (başka bir balinaya göre hareket).', 'Hangisinin seçileceği, GWO\'daki gibi 2\'den 0\'a azalan <code>a</code> katsayısıyla ve rastgele bir olasılıkla (%50) belirlenir.'],
      en: ['Humpback whales encircle prey (a school of fish) and squeeze it with bubbles while <b>swimming in a spiral</b>. WOA turns this into three moves: <b>encircle the prey</b> (approach the best solution), <b>spiral attack</b> (a logarithmic spiral around the best) and <b>random search</b> (move relative to another whale).', 'Which one is used is decided by the coefficient <code>a</code> falling from 2 to 0 (as in GWO) and by a random 50% choice.']
    },
    steps: {
      tr: ['Balinaları rastgele konumlandır; en iyisi "av".', '<code>a</code>\'yı 2→0 azalt. Her balina için <code>A = 2a·r − a</code>, <code>C = 2r</code>, <code>p ∈ [0,1]</code> çek.', '<b>p &lt; 0.5</b> ve <b>|A| &lt; 1</b>: <b>çevrele</b>: <code>x ← en_iyi − A·|C·en_iyi − x|</code>.', '<b>p &lt; 0.5</b> ve <b>|A| ≥ 1</b>: <b>rastgele ara</b>: aynı formül, ama rastgele bir balinaya göre.', '<b>p ≥ 0.5</b>: <b>sarmal</b>: <code>x ← |en_iyi − x|·e<sup>l</sup>·cos(2πl) + en_iyi</code>.', 'En iyiyi güncelle ve tekrarla.'],
      en: ['Place the whales at random; the best one is the "prey".', 'Decrease <code>a</code> from 2 to 0. For each whale draw <code>A = 2a·r − a</code>, <code>C = 2r</code>, <code>p ∈ [0,1]</code>.', '<b>p &lt; 0.5</b> and <b>|A| &lt; 1</b>: <b>encircle</b>: <code>x ← best − A·|C·best − x|</code>.', '<b>p &lt; 0.5</b> and <b>|A| ≥ 1</b>: <b>random search</b>: the same formula but relative to a random whale.', '<b>p ≥ 0.5</b>: <b>spiral</b>: <code>x ← |best − x|·e<sup>l</sup>·cos(2πl) + best</code>.', 'Update the best and repeat.']
    },
    demo(root) {
      const P = { fn: 'rastrigin', n: 20, iters: 100 };
      const mc = { encircle: '--accent', search: '--violet', spiral: '--warm' };
      MH.demo2D(root, {
        P, sps: 3, make: (p, seed) => S.woa({ ...p }, MH.rngFor(seed)),
        points: sim => sim.whales.map((w, i) => ({ x: w.x[0], y: w.x[1], c: col(mc[sim.mode[i]] || '--accent'), r: 4.5 })),
        stats: sim => [['a', sim.a.toFixed(2)]],
        explain: sim => sim.iter ? t({ tr: `Renkler son hamlenin türünü gösterir: <b>mavi</b> çevreleme, <b>turuncu</b> sarmal, <b>mor</b> rastgele arama. a=${sim.a.toFixed(2)}: ${sim.a > 1 ? '|A| sık sık ≥ 1 olduğundan arama (keşif) sık görülür' : '|A| < 1 baskın: çevreleme ve sarmal (sömürü)'}.`, en: `Colours show the type of the last move: <b>blue</b> encircle, <b>orange</b> spiral, <b>purple</b> random search. a=${sim.a.toFixed(2)}: ${sim.a > 1 ? '|A| is often ≥ 1 so random search (exploration) is common' : '|A| < 1 dominates: encircling and spiral (exploitation)'}.` }) : t({ tr: 'Adım\'a basın ve balinaların renklerinin zamanla nasıl değiştiğini izleyin.', en: 'Press Step and watch how the whales\' colours change over time.' }),
        controls: (k, p) => [sizeSlider(k, p, 'n', { tr: 'Balina', en: 'Whales' }, 5, 50), iterSlider(k, p, 300)],
        legend: MH.legend([['--accent', { tr: 'çevreleme', en: 'encircling' }], ['--warm', { tr: 'sarmal', en: 'spiral' }], ['--violet', { tr: 'rastgele arama', en: 'random search' }], ['--good', { tr: 'en iyi', en: 'best' }]])
      });
    },
    anns: {
      'WhaleOptimization.py': [
        { find: '# a decreases', span: 2, text: { tr: '<code>a</code> doğrusal olarak 2→0: keşiften sömürüye geçiş.', en: '<code>a</code> falls linearly 2→0: the shift from exploration to exploitation.' } },
        { find: 'A = 2 * a * random() - a', span: 4, text: { tr: 'Her balina için <code>A</code> (hareket yönü/uzunluğu), <code>C</code>, olasılık <code>p</code> ve sarmal parametresi <code>l</code>.', en: 'For each whale: <code>A</code> (direction/length of the move), <code>C</code>, the probability <code>p</code> and the spiral parameter <code>l</code>.' } },
        { find: '# shrinking encircling', span: 2, text: { tr: '<b>Çevreleme</b>: <code>|A| &lt; 1</code> iken en iyiye doğru hareket.', en: '<b>Encircling</b>: move towards the best when <code>|A| &lt; 1</code>.' } },
        { find: '# exploration: swim', span: 3, text: { tr: '<b>Rastgele arama</b>: <code>|A| ≥ 1</code> iken rastgele bir balinaya göre hareket (keşif).', en: '<b>Random search</b>: when <code>|A| ≥ 1</code> move relative to a random whale (exploration).' } },
        { find: '# bubble-net attack', span: 2, text: { tr: '<b>Sarmal saldırı</b>: en iyinin etrafında logaritmik sarmal.', en: '<b>Spiral attack</b>: a logarithmic spiral around the best.' } }
      ]
    },
    notes: {
      tr: ['Sarmal formülünde balina, avı <b>çevreleyen</b> bir yol izler ama formül <code>|en_iyi − x|·e^l·cos(2πl) + en_iyi</code> olduğundan bu hareket çoğu zaman en iyi çözümün civarındaki bir nokta örneklemekten farksızdır; faydası "yerel yoğunlaştırma"dır.', 'Boyutlar <b>bağımsız</b> işlenir (<code>zip</code>), ancak <code>A</code>, <code>C</code>, <code>p</code> ve <code>l</code> tüm koordinatlar için tektir; bu yüzden hareket koordinat eksenleri boyunca değil, en iyiye doğru bir <b>doğru</b> üzerinde olur.', 'WOA\'nın GWO ve PSO ile benzerliği dikkat çekicidir: üçü de "en iyiye doğru çekim + zamanla azalan rastgelelik" fikrine dayanır. Optimumun merkezde olduğu fonksiyonlarda daha iyi görünme eğilimi gibi, bu ailenin ortak eleştirileri vardır.'],
      en: ['In the spiral formula the whale follows a path <b>around</b> the prey, but since the formula is <code>|best − x|·e^l·cos(2πl) + best</code> this move is often little more than sampling a point near the best solution; its benefit is "local intensification".', 'The dimensions are processed <b>independently</b> (<code>zip</code>), but <code>A</code>, <code>C</code>, <code>p</code> and <code>l</code> are single values for all coordinates; the movement therefore lies on a <b>line</b> towards the best rather than along coordinate axes.', 'The similarity of WOA to GWO and PSO is striking: all three rely on "pull towards the best + randomness that decays over time". This family shares common criticisms, such as looking better on functions whose optimum lies at the centre.']
    },
    params: {
      tr: [['Balina sayısı', 'Çok = daha iyi keşif; WOA\'da çok az parametre vardır.'], ['İterasyon', '<code>a</code> doğrusal azaldığı için iterasyon sayısı, keşif/sömürü dengesini de belirler.']],
      en: [['Number of whales', 'More = better exploration; WOA has very few parameters.'], ['Iterations', 'Because <code>a</code> decreases linearly, the iteration count also sets the exploration/exploitation balance.']]
    },
    pros: { tr: ['Neredeyse parametresiz', 'Kolay uygulanır', 'Hızlı yakınsar'], en: ['Almost parameter-free', 'Easy to implement', 'Converges quickly'] },
    cons: { tr: ['Erken yakınsama', 'Optimumu merkezde olan problemlerde yanıltıcı olabilir', 'Metafor güçlü, yenilik sınırlı'], en: ['Premature convergence', 'Can be misleading on problems with the optimum at the centre', 'A strong metaphor but limited novelty'] }
  });

  /* ================= Harris Hawks ================= */
  MH.algoPage({
    id: 'hho', group: 'g_nature', origin: 'added',
    title: { tr: 'Harris Şahinleri Optimizasyonu (HHO)', en: 'Harris Hawks Optimization (HHO)' },
    nav: { tr: 'Harris Şahini (HHO)', en: 'Harris Hawks (HHO)' },
    blurb: { tr: 'Şahinler tavşanı sürpriz baskınla yakalar: enerjiye göre dört saldırı stratejisi.', en: 'Hawks catch the rabbit with a surprise pounce: four attack strategies depending on its energy.' },
    tagline: { tr: 'Tavşanın kaçış enerjisi azaldıkça keşif, kuşatma ve dalış evreleri birbirini izler.', en: 'As the rabbit\'s escape energy drops, exploration, besiege and dive phases follow each other.' },
    files: ['HarrisHawksOptimization.py'],
    intuition: {
      tr: ['Harris şahinleri gruplar halinde avlanır: önce yüksekte <b>bekler ve ararlar</b> (keşif), sonra tavşanı <b>sürpriz baskınla</b> kuşatır. Tavşanın kaçış enerjisi <code>E</code> zamanla azalır; bu enerji hangi stratejinin kullanılacağını belirler.', '<code>|E| ≥ 1</code> iken şahinler keşif yapar. <code>|E| &lt; 1</code> iken dört kuşatma stratejisinden biri (yumuşak/sert, dalışlı/dalışsız) seçilir; seçim tavşanın kaçma şansına (<code>r</code>) ve enerjisine bağlıdır.'],
      en: ['Harris hawks hunt in groups: first they <b>perch and search</b> from above (exploration), then they besiege the rabbit with a <b>surprise pounce</b>. The rabbit\'s escape energy <code>E</code> decreases over time and decides which strategy is used.', 'While <code>|E| ≥ 1</code> the hawks explore. When <code>|E| &lt; 1</code> one of four besiege strategies (soft/hard, with/without dives) is chosen, depending on the rabbit\'s escape chance (<code>r</code>) and its energy.']
    },
    steps: {
      tr: ['<code>E = 2·E₀·(1 − t/T)</code>, <code>E₀ ∈ [−1,1]</code>.', '<b>|E| ≥ 1 → keşif</b>: rastgele bir şahine ya da tavşan–ortalama farkına göre yeni bir konum.', '<b>|E| &lt; 1 ve r ≥ 0.5</b>: <b>yumuşak</b> (|E| ≥ 0.5) ya da <b>sert</b> (|E| &lt; 0.5) kuşatma.', '<b>|E| &lt; 1 ve r &lt; 0.5</b>: Lévy uçuşlu <b>hızlı dalışlarla</b> kuşatma; dalış daha iyiyse kabul.', 'Sömürüde yalnızca iyileşen konuma geçilir. En iyi (tavşan) güncellenir.'],
      en: ['<code>E = 2·E₀·(1 − t/T)</code>, <code>E₀ ∈ [−1,1]</code>.', '<b>|E| ≥ 1 → exploration</b>: a new position relative to a random hawk or to the rabbit–mean difference.', '<b>|E| &lt; 1 and r ≥ 0.5</b>: <b>soft</b> (|E| ≥ 0.5) or <b>hard</b> (|E| &lt; 0.5) besiege.', '<b>|E| &lt; 1 and r &lt; 0.5</b>: besiege with <b>rapid dives</b> using Lévy flights; the dive is accepted if better.', 'In exploitation a hawk moves only if the new position is better. The best (the rabbit) is updated.']
    },
    demo(root) {
      const P = { fn: 'rastrigin', n: 20, iters: 100 };
      MH.demo2D(root, {
        P, sps: 3, make: (p, seed) => S.hho({ ...p }, MH.rngFor(seed)),
        points: sim => popPoints(sim.hawks, '--warm', 4.5),
        stats: sim => [['E', sim.E.toFixed(2)], [{ tr: 'Evre', en: 'Phase' }, sim.phase || '–']],
        explain: sim => sim.iter ? t({ tr: `|E| = ${Math.abs(sim.E).toFixed(2)} → ${Math.abs(sim.E) >= 1 ? '<b>keşif</b> (şahinler rastgele konumlanıyor)' : Math.abs(sim.E) >= 0.5 ? '<b>yumuşak kuşatma</b>' : '<b>sert kuşatma</b>'}. İterasyonlar ilerledikçe |E| küçülür ve şahinler tavşana (en iyiye) sıkıca yaklaşır.`, en: `|E| = ${Math.abs(sim.E).toFixed(2)} → ${Math.abs(sim.E) >= 1 ? '<b>exploration</b> (the hawks perch at random positions)' : Math.abs(sim.E) >= 0.5 ? '<b>soft besiege</b>' : '<b>hard besiege</b>'}. As iterations proceed |E| shrinks and the hawks close in on the rabbit (the best).` }) : t({ tr: 'Adım\'a basın: enerji E rastgele işaretli bir değerdir ve sürekli küçülür.', en: 'Press Step: the energy E has a random sign and keeps shrinking.' }),
        controls: (k, p) => [sizeSlider(k, p, 'n', { tr: 'Şahin', en: 'Hawks' }, 5, 50), iterSlider(k, p, 300)],
        legend: MH.legend([['--warm', { tr: 'şahin', en: 'hawk' }], ['--good', { tr: 'tavşan (en iyi)', en: 'rabbit (best)' }]])
      });
    },
    anns: {
      'HarrisHawksOptimization.py': [
        { find: '# the energy', span: 2, text: { tr: 'Kaçış enerjisi <code>E</code> zamanla azalır: |E|≥1 keşif, |E|&lt;1 sömürü.', en: 'The escape energy <code>E</code> decreases over time: |E|≥1 exploration, |E|&lt;1 exploitation.' } },
        { find: '# exploration: the hawks', span: 8, text: { tr: '<b>Keşif</b>: iki eşit olasılıklı strateji; şahin yeni konuma koşulsuz geçer.', en: '<b>Exploration</b>: two equally likely strategies; the hawk moves to the new position unconditionally.' } },
        { find: '# exploitation: the surprise', span: 3, text: { tr: '<b>Sömürü</b>: <code>r</code> (kaçış şansı) ve <code>J</code> (tavşanın rastgele sıçraması).', en: '<b>Exploitation</b>: <code>r</code> (escape chance) and <code>J</code> (the rabbit\'s random jump).' } },
        { find: '# soft besiege', span: 2, text: { tr: '<b>Yumuşak kuşatma</b>: tavşan hâlâ enerjik; şahin yavaşça çevreler.', en: '<b>Soft besiege</b>: the rabbit is still energetic; the hawk encircles gently.' } },
        { find: '# hard besiege', span: 2, text: { tr: '<b>Sert kuşatma</b>: tavşan yorgun; şahin doğrudan saldırır.', en: '<b>Hard besiege</b>: the rabbit is tired; the hawk attacks directly.' } },
        { find: '# (soft / hard) besiege with progressive', span: 7, text: { tr: '<b>Hızlı dalışlar</b>: Lévy uçuşuyla zikzaklı dalış; <code>Y</code> ve <code>Z</code> adaylarından daha iyisi seçilir.', en: '<b>Rapid dives</b>: a zig-zag dive using a Lévy flight; the better of the candidates <code>Y</code> and <code>Z</code> is chosen.' } },
        { find: '# in the exploitation phase', span: 4, text: { tr: 'Sömürüde şahin yalnızca <b>daha iyi</b> konuma geçer.', en: 'In exploitation a hawk moves only to a <b>better</b> position.' } }
      ]
    },
    notes: {
      tr: ['HHO, <b>aynı anda 5 farklı güncelleme kuralı</b> içerir ve hangisinin çalışacağı rastgele ile enerjiye bağlıdır. Çok sayıda koşul olması, her kuralın tek tek etkisini ölçmeyi zorlaştırır.', 'Sömürü evresinde <b>açgözlü seçim</b> (yalnızca iyileşme) uygulanır; keşif evresinde ise şahin konumunu koşulsuz değiştirir. Bu yüzden iterasyon başına en iyi değer kötüleşmez ama şahinlerin kendi değeri kötüleşebilir.', 'Orijinal makalede Lévy adımı <code>0.01·u·σ/|v|^(1/β)</code> olarak tanımlanır; bu kodda aramanın alanıyla ölçeklenen bir çarpanla (0.4·genişlik) uyarlanmıştır.'],
      en: ['HHO contains <b>five different update rules at once</b>, and which one runs depends on randomness and the energy. With so many conditions it is hard to measure the effect of each rule individually.', 'In the exploitation phase a <b>greedy selection</b> (only improvement) is applied, while in exploration the hawk changes position unconditionally. So the best value never worsens per iteration but individual hawks can get worse.', 'In the original paper the Lévy step is defined as <code>0.01·u·σ/|v|^(1/β)</code>; this code adapts it with a factor scaled to the search space (0.4·width).']
    },
    params: {
      tr: [['Şahin sayısı', 'Çok = daha iyi keşif.'], ['İterasyon', 'E, iterasyonla orantılı azaldığı için keşif/sömürü oranını da belirler.']],
      en: [['Number of hawks', 'More = better exploration.'], ['Iterations', 'E decreases in proportion to the iteration, so it also sets the exploration/exploitation ratio.']]
    },
    pros: { tr: ['Birden çok strateji sayesinde farklı arazilere uyum', 'Parametre sayısı az', 'Dalış stratejisi yerel ince ayara iyi'], en: ['Adapts to different landscapes thanks to multiple strategies', 'Few parameters', 'The dive strategy is good for local fine tuning'] },
    cons: { tr: ['Karmaşık yapı: yorumlaması ve hata ayıklaması zor', 'Optimumu merkezde olan fonksiyonlarda iyi görünme eğilimi', 'Lévy ölçeği ayarı gerekir'], en: ['Complex structure: hard to interpret and debug', 'Tends to look good on functions with the optimum at the centre', 'The Lévy scale needs tuning'] }
  });

  /* ================= Harmony Search ================= */
  MH.algoPage({
    id: 'harmony', group: 'g_nature', origin: 'added',
    title: { tr: 'Armoni Arama', en: 'Harmony Search' },
    nav: { tr: 'Armoni Arama', en: 'Harmony Search' },
    blurb: { tr: 'Müzisyen gibi: hafızadan nota al, perdeyi hafifçe ayarla, ya da yeni nota dene.', en: 'Like a musician: take a note from memory, tweak the pitch slightly or try a new note.' },
    tagline: { tr: 'Doğaçlama: tek seferde bir "armoni" üretir ve hafızadaki en kötüsünün yerine koyar.', en: 'Improvisation: creates one "harmony" at a time and replaces the worst one in memory.' },
    files: ['HarmonySearch.py'],
    intuition: {
      tr: ['Bir caz müzisyeni doğaçlama yaparken üç şeyden birini yapar: (1) <b>hafızadaki</b> güzel bir melodiden bir nota çalar, (2) o notayı <b>biraz yükseltip alçaltır</b> (perde ayarı), (3) <b>tamamen yeni bir nota</b> dener. İyi çıkan armoni hafızaya girer.', 'Algoritmada bir armoni bir çözüm vektörü, nota ise bir koordinattır. <b>Hafıza (HM)</b> en iyi armonileri tutar. Üç olasılık (<code>HMCR</code>, <code>PAR</code>, kalan) keşif ve sömürüyü ayarlar.'],
      en: ['When improvising, a jazz musician does one of three things: (1) plays a note from a nice melody in their <b>memory</b>, (2) <b>nudges that note</b> up or down (pitch adjustment), (3) tries a <b>completely new note</b>. A good harmony enters the memory.', 'In the algorithm a harmony is a solution vector and a note a coordinate. The <b>harmony memory (HM)</b> holds the best harmonies. Three probabilities (<code>HMCR</code>, <code>PAR</code>, the rest) tune exploration and exploitation.']
    },
    steps: {
      tr: ['<code>HMS</code> rastgele armoniyle hafızayı doldur.', 'Yeni bir armoni <b>doğaçla</b>: her koordinat için olasılık <code>HMCR</code> ile hafızadan bir değer al, aksi halde rastgele üret.', 'Hafızadan alınan değere olasılık <code>PAR</code> ile <b>±bw</b> perde ayarı uygula.', 'Yeni armoni hafızadaki <b>en kötüden</b> iyiyse onun yerine koy.', 'Bu doğaçlamayı çok kez tekrarla (bir adım = bir armoni).'],
      en: ['Fill the memory with <code>HMS</code> random harmonies.', '<b>Improvise</b> a new harmony: for each coordinate take a value from memory with probability <code>HMCR</code>, otherwise generate one at random.', 'Apply a <b>±bw</b> pitch adjustment to a memory value with probability <code>PAR</code>.', 'If the new harmony is better than the <b>worst</b> in memory, replace it.', 'Repeat the improvisation many times (one step = one harmony).']
    },
    demo(root) {
      const P = { fn: 'rastrigin', hms: 20, hmcr: 0.9, par: 0.3, bw: 0.02, iters: 3000 };
      MH.demo2D(root, {
        P, sps: 60, maxSps: 600, make: (p, seed) => S.harmony({ ...p }, MH.rngFor(seed)),
        points: sim => sim.hm.map(q => ({ x: q.x[0], y: q.x[1], c: col('--accent'), r: 4.5 })),
        extra(ctx, sim, m) { if (sim.cand) MH.dot(ctx, m.X(sim.cand[0]), m.Y(sim.cand[1]), 6, col(sim.accepted ? '--good' : '--bad'), true); },
        stats: sim => [[{ tr: 'Hafızadaki en kötü f', en: 'Worst f in memory' }, MH.fmt(Math.max(...sim.hm.map(q => q.f)), 3)]],
        explain: sim => sim.iter ? t({ tr: `Son doğaçlama (büyük nokta) hafızadaki en kötüden ${sim.accepted ? '<b>iyi → hafızaya girdi</b>' : '<b>kötü → atıldı</b>'}. Hafıza zamanla iyi armonilerle dolar ve birbirine benzemeye başlar.`, en: `The last improvisation (the big dot) was ${sim.accepted ? '<b>better than the worst → entered the memory</b>' : '<b>worse → discarded</b>'}. The memory gradually fills with good harmonies that resemble each other.` }) : t({ tr: 'Her adım tek bir armoni üretir; hız kaydırıcısını yükseltin.', en: 'Each step creates a single harmony; raise the speed slider.' }),
        controls: (k, p) => [
          MH.slider({ label: { tr: 'Hafıza HMS', en: 'Memory HMS' }, min: 5, max: 60, value: p.hms, onInput: v => { p.hms = v; k.restart(); } }),
          MH.slider({ label: { tr: 'HMCR', en: 'HMCR' }, min: 0.5, max: 0.99, step: 0.01, value: p.hmcr, fmt: v => v.toFixed(2), onInput: v => { p.hmcr = v; k.restart(); } }),
          MH.slider({ label: { tr: 'PAR', en: 'PAR' }, min: 0, max: 1, step: 0.05, value: p.par, fmt: v => v.toFixed(2), onInput: v => { p.par = v; k.restart(); } }),
          MH.slider({ label: { tr: 'bw (bant genişliği)', en: 'bw (bandwidth)' }, min: 0.002, max: 0.1, step: 0.002, value: p.bw, fmt: v => v.toFixed(3), onInput: v => { p.bw = v; k.restart(); } }),
          MH.slider({ label: { tr: 'Doğaçlama sayısı', en: 'Improvisations' }, min: 500, max: 10000, step: 500, value: p.iters, onInput: v => { p.iters = v; k.restart(); } })
        ],
        legend: MH.legend([['--accent', { tr: 'hafızadaki armoni', en: 'harmony in memory' }], ['--good', { tr: 'hafızaya giren', en: 'entered the memory' }], ['--bad', { tr: 'atılan', en: 'discarded' }]])
      });
    },
    anns: {
      'HarmonySearch.py': [
        { find: 'def __init__', span: 14, text: { tr: '<code>hms</code> hafıza boyutu, <code>hmcr</code> hafızadan alma olasılığı, <code>par</code> perde ayarı olasılığı, <code>bw</code> ayar genişliği.', en: '<code>hms</code> memory size, <code>hmcr</code> probability of using memory, <code>par</code> pitch-adjust probability, <code>bw</code> adjustment width.' } },
        { find: '# the new harmony replaces', span: 5, text: { tr: 'Yeni armoni, hafızadaki <b>en kötüyü</b> yalnızca ondan iyiyse değiştirir.', en: 'The new harmony replaces the <b>worst</b> in memory only if it is better.' } },
        { find: '# every note of the new harmony', span: 22, text: { tr: '<b>Doğaçlama</b>: hafıza → (perde ayarı) → ya da rastgele nota.', en: '<b>Improvisation</b>: memory → (pitch adjustment) → or a random note.' } },
        { find: '# memory consideration', span: 2, text: { tr: '<b>Hafızadan alma</b>: rastgele bir armoninin aynı koordinatı.', en: '<b>Memory consideration</b>: the same coordinate of a random harmony.' } },
        { find: '# pitch adjustment', span: 3, text: { tr: '<b>Perde ayarı</b>: notaya <code>±bw</code> kadar küçük sapma (yerel arama).', en: '<b>Pitch adjustment</b>: a small deviation of up to <code>±bw</code> (local search).' } },
        { find: '# random selection', span: 2, text: { tr: '<b>Rastgele seçim</b>: tamamen yeni nota (keşif).', en: '<b>Random selection</b>: a completely new note (exploration).' } }
      ]
    },
    notes: {
      tr: ['Bu bir <b>kararlı durum (steady-state)</b> algoritmadır: her iterasyonda tek bir yeni çözüm üretilir ve hafızada yalnızca bir birey değişir. Genetik algoritma gibi nesil nesil ilerlemez.', 'Çaprazlama gibi iki ebeveyn zorunluluğu yoktur: yeni çözümün <b>her koordinatı farklı bir armoniden</b> gelebilir; bu da çok sayıda ebeveynli bir çaprazlama gibi davranır.', '<code>bw</code> sabit tutulduğu için yakınsama sonunda ince ayar kısıtlanır. Gelişmiş sürümlerde <code>bw</code> ve <code>PAR</code> iterasyonla değişir (örn. Improved Harmony Search).'],
      en: ['This is a <b>steady-state</b> algorithm: one new solution is created per iteration and only one individual in memory changes. It does not advance generation by generation like a genetic algorithm.', 'There is no two-parent requirement as in crossover: <b>each coordinate of the new solution can come from a different harmony</b>, which behaves like a crossover with many parents.', 'Because <code>bw</code> is constant, fine tuning at the end is limited. In advanced versions <code>bw</code> and <code>PAR</code> change over the iterations (e.g. Improved Harmony Search).']
    },
    params: {
      tr: [['HMCR', 'Yüksek (0.9+) = hafızaya güven = sömürü; düşük = rastgele = keşif.'], ['PAR', 'Notaya ince ayar olasılığı.'], ['bw', 'İnce ayarın boyu; çok büyükse arama kabalaşır.'], ['HMS', 'Çok büyük hafıza yavaş yakınsar.']],
      en: [['HMCR', 'High (0.9+) = trust memory = exploitation; low = random = exploration.'], ['PAR', 'The probability of fine-tuning a note.'], ['bw', 'The size of the fine-tuning; too large makes the search coarse.'], ['HMS', 'A very large memory converges slowly.']]
    },
    pros: { tr: ['Çok basit ve hafif (tek çözüm/iterasyon)', 'Her koordinat bağımsız doğaçlanır: ayrık ve sürekli problemlere uyar', 'Türev gerekmez'], en: ['Very simple and lightweight (one solution/iteration)', 'Each coordinate is improvised independently: fits discrete and continuous problems', 'No derivatives needed'] },
    cons: { tr: ['Sabit <code>bw</code> ince ayarı kısıtlar', 'Koordinatlar arası bağımlılığı yakalayamaz', 'Çok sayıda iterasyon gerekir'], en: ['A fixed <code>bw</code> limits fine tuning', 'Cannot capture dependencies between coordinates', 'Needs many iterations'] }
  });

  /* ================= TLBO ================= */
  MH.algoPage({
    id: 'tlbo', group: 'g_nature', origin: 'added',
    title: { tr: 'Öğretme-Öğrenme Tabanlı Optimizasyon (TLBO)', en: 'Teaching-Learning-Based Optimization (TLBO)' },
    nav: { tr: 'Öğretme-Öğrenme (TLBO)', en: 'Teaching-Learning (TLBO)' },
    blurb: { tr: 'Sınıf modeli: önce öğretmenden, sonra birbirinden öğren.', en: 'A classroom model: learn from the teacher first, then from each other.' },
    tagline: { tr: 'Algoritmaya özgü hiçbir parametresi olmayan nadir yöntemlerden biri.', en: 'One of the rare methods with no algorithm-specific parameters.' },
    files: ['TeachingLearningBasedOptimization.py'],
    intuition: {
      tr: ['Bir sınıfı düşünün: öğrenciler (çözümler) ve bir öğretmen (en iyi çözüm). <b>Öğretmen fazında</b> öğretmen sınıf ortalamasını kendine doğru çekmeye çalışır; her öğrenci öğretmenle sınıf ortalaması arasındaki farkın yönünde ilerler.', '<b>Öğrenci fazında</b> öğrenciler ikişer ikişer etkileşir: kötü olan, daha iyi olandan öğrenir. İki fazın sonunda yalnızca <b>iyileşen</b> öğrenci yeni bilgisini tutar. Popülasyon boyutu ve iterasyon dışında ayarlanacak bir şey yoktur.'],
      en: ['Think of a classroom: students (solutions) and a teacher (the best solution). In the <b>teacher phase</b> the teacher tries to pull the class mean towards themselves; each student moves along the difference between the teacher and the class mean.', 'In the <b>learner phase</b> students interact in pairs: the weaker one learns from the better one. After both phases only a student who <b>improved</b> keeps the new knowledge. Apart from the population size and iterations there is nothing to tune.']
    },
    steps: {
      tr: ['Sınıfı rastgele oluştur; <b>öğretmen</b> = en iyi öğrenci, <b>ortalama</b> = sınıf ortalaması.', '<b>Öğretmen fazı</b>: <code>x<sub>yeni</sub> = x + r·(öğretmen − T<sub>F</sub>·ortalama)</code>, <code>T<sub>F</sub> ∈ {1, 2}</code>. Daha iyiyse kabul.', '<b>Öğrenci fazı</b>: rastgele bir arkadaş j seç; i, j\'den iyiyse <code>x + r·(x<sub>i</sub> − x<sub>j</sub>)</code>, değilse <code>x + r·(x<sub>j</sub> − x<sub>i</sub>)</code>. Daha iyiyse kabul.', 'İterasyon sayısı bitene kadar tekrarla.'],
      en: ['Create the class at random; the <b>teacher</b> = the best learner, the <b>mean</b> = the class mean.', '<b>Teacher phase</b>: <code>x<sub>new</sub> = x + r·(teacher − T<sub>F</sub>·mean)</code>, <code>T<sub>F</sub> ∈ {1, 2}</code>. Accept if better.', '<b>Learner phase</b>: pick a random classmate j; if i is better than j use <code>x + r·(x<sub>i</sub> − x<sub>j</sub>)</code>, otherwise <code>x + r·(x<sub>j</sub> − x<sub>i</sub>)</code>. Accept if better.', 'Repeat until the iteration limit.']
    },
    demo(root) {
      const P = { fn: 'rastrigin', n: 20, iters: 60 };
      MH.demo2D(root, {
        P, sps: 3, make: (p, seed) => S.tlbo({ ...p }, MH.rngFor(seed)),
        points: sim => popPoints(sim.pop, '--accent', 4.5),
        extra(ctx, sim, m) {
          if (!sim.teacher) return;
          ctx.strokeStyle = col('--warm'); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(m.X(sim.mean[0]), m.Y(sim.mean[1])); ctx.lineTo(m.X(sim.teacher[0]), m.Y(sim.teacher[1])); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = col('--violet'); ctx.fillRect(m.X(sim.mean[0]) - 5, m.Y(sim.mean[1]) - 5, 10, 10);
          MH.dot(ctx, m.X(sim.teacher[0]), m.Y(sim.teacher[1]), 7, col('--warm'), true);
        },
        explain: sim => sim.iter ? t({ tr: 'Mor kare: sınıf ortalaması, turuncu nokta: öğretmen. Öğretmen fazında öğrenciler ortalamadan öğretmene uzanan yöne çekilir. Öğrenci fazı ise ikili etkileşimle yerel keşfi sağlar.', en: 'The purple square is the class mean, the orange dot the teacher. In the teacher phase learners are pulled in the direction from the mean to the teacher. The learner phase provides local exploration through pairwise interaction.' }) : t({ tr: 'Adım\'a basın: her adım iki fazı (öğretmen + öğrenci) çalıştırır.', en: 'Press Step: each step runs both phases (teacher + learner).' }),
        controls: (k, p) => [sizeSlider(k, p, 'n', { tr: 'Öğrenci (sınıf)', en: 'Learners (class)' }, 5, 60), iterSlider(k, p, 200)],
        legend: MH.legend([['--accent', { tr: 'öğrenci', en: 'learner' }], ['--warm', { tr: 'öğretmen (en iyi)', en: 'teacher (best)' }], ['--violet', { tr: 'sınıf ortalaması', en: 'class mean' }]])
      });
    },
    anns: {
      'TeachingLearningBasedOptimization.py': [
        { find: 'def __init__', span: 6, text: { tr: 'Yalnızca sınıf büyüklüğü ve iterasyon sayısı: algoritmaya özgü parametre yok.', en: 'Only the class size and the iteration count: no algorithm-specific parameters.' } },
        { find: '# the teacher is the best', span: 3, text: { tr: '<b>Öğretmen</b> = en iyi öğrenci; <b>ortalama</b> = sınıfın ortalama konumu.', en: 'The <b>teacher</b> = the best learner; the <b>mean</b> = the average position of the class.' } },
        { find: '# phase 1', span: 6, text: { tr: '<b>Öğretmen fazı</b>: öğrenci, ortalamadan öğretmene doğru kayar (<code>T_F ∈ {1, 2}</code>).', en: '<b>Teacher phase</b>: the learner moves from the mean towards the teacher (<code>T_F ∈ {1, 2}</code>).' } },
        { find: '# phase 2', span: 9, text: { tr: '<b>Öğrenci fazı</b>: iki öğrenciden zayıf olan, iyi olanın yönünde ilerler.', en: '<b>Learner phase</b>: of two students the weaker one moves in the direction of the better one.' } },
        { find: '# greedy selection', span: 7, text: { tr: '<b>Açgözlü seçim</b>: öğrenci yalnızca yeni bilgi daha iyiyse değişir.', en: '<b>Greedy selection</b>: a learner changes only if the new knowledge is better.' } }
      ]
    },
    notes: {
      tr: ['Her iterasyonda <b>iki kez</b> fonksiyon değerlendirilir (öğretmen + öğrenci fazı); bu yüzden "eşit iterasyon" yerine "eşit değerlendirme sayısı" ile karşılaştırma yapın.', 'Öğretmen fazının ortalamaya bağlı yapısı, optimumun arama uzayının <b>merkezinde</b> olduğu fonksiyonlarda (Rastrigin, Ackley) avantaj sağlar; optimumu merkezde olmayan Himmelblau ile de deneyin.', '"Parametresiz" iddiası popülasyon büyüklüğü ve iterasyon sayısı gibi ortak parametreleri kapsamaz; yine de ayarlanması gereken algoritmaya özgü bir katsayı (<code>w</code>, <code>c1</code>, <code>F</code>, <code>CR</code> gibi) yoktur.'],
      en: ['Two function evaluations happen per iteration (teacher + learner phase), so compare at an "equal number of evaluations" rather than an equal number of iterations.', 'The teacher phase\'s reliance on the mean favours functions whose optimum is at the <b>centre</b> of the search space (Rastrigin, Ackley); also try Himmelblau, whose optimum is off-centre.', 'The "parameter-free" claim does not cover the common parameters such as population size and iteration count; still, there is no algorithm-specific coefficient to tune (like <code>w</code>, <code>c1</code>, <code>F</code>, <code>CR</code>).']
    },
    params: {
      tr: [['Sınıf büyüklüğü', 'Çok = daha iyi keşif, iterasyon başına daha pahalı.'], ['İterasyon', 'Tek ayar; yeterince yüksek olmalı.']],
      en: [['Class size', 'More = better exploration, more expensive per iteration.'], ['Iterations', 'The only setting; it must be large enough.']]
    },
    pros: { tr: ['Algoritmaya özgü parametre yok', 'Hızlı yakınsama', 'Uygulaması çok kolay'], en: ['No algorithm-specific parameters', 'Fast convergence', 'Very easy to implement'] },
    cons: { tr: ['İterasyon başına iki kat değerlendirme', 'Merkezde optimumlu fonksiyonlarda yanıltıcı iyi sonuç', 'Çeşitlilik hızla azalır'], en: ['Twice the evaluations per iteration', 'Misleadingly good on functions with the optimum at the centre', 'Diversity drops quickly'] }
  });
})();
