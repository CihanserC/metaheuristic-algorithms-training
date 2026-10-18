/* Home, core concepts and comparison pages + shared plotting helper. */
(function () {
  'use strict';
  const { h, t, col } = MH;

  /* Draws f on [x0,x1] inside box b; returns coordinate mappers. */
  MH.fnPlot = function (ctx, f, x0, x1, b, yr) {
    if (!yr) {
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i <= 240; i++) { const v = f(x0 + (x1 - x0) * i / 240); lo = Math.min(lo, v); hi = Math.max(hi, v); }
      const pad = (hi - lo) * 0.1; yr = [lo - pad, hi + pad];
    }
    const X = x => b.x + (x - x0) / (x1 - x0) * b.w, Y = y => b.y + (1 - (y - yr[0]) / (yr[1] - yr[0])) * b.h;
    ctx.save();
    ctx.fillStyle = col('--panel2'); ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = col('--line'); ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) { const gx = b.x + b.w * i / 8; ctx.beginPath(); ctx.moveTo(gx, b.y); ctx.lineTo(gx, b.y + b.h); ctx.stroke(); }
    if (yr[0] < 0 && yr[1] > 0) { ctx.strokeStyle = col('--muted'); ctx.beginPath(); ctx.moveTo(b.x, Y(0)); ctx.lineTo(b.x + b.w, Y(0)); ctx.stroke(); }
    ctx.strokeStyle = col('--accent'); ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 400; i++) { const x = x0 + (x1 - x0) * i / 400, px = X(x), py = Y(f(x)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke(); ctx.restore();
    return { X, Y };
  };
  MH.dot = function (ctx, x, y, r, color, ring) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = color; ctx.fill();
    if (ring) { ctx.strokeStyle = col('--text'); ctx.lineWidth = 1.5; ctx.stroke(); }
  };
  MH.legend = items => h('div', { class: 'legend' }, items.map(([c, l]) => h('span', null, h('i', { style: 'background:' + col(c) }), t(l))));

  /* ---------- Home ---------- */
  MH.register({
    id: 'home', group: 'g_start', title: MH.UI.home, nav: MH.UI.home,
    render(root) {
      root.append(h('header', { class: 'pagehead' },
        h('h1', null, t({ tr: 'Metasezgisel algoritmaları görerek öğrenin', en: 'Learn metaheuristics by watching them think' })),
        h('p', { class: 'lead' }, t({
          tr: 'Her algoritma için sezgi, adım adım çalışma mantığı, canlı animasyon ve çalıştırılabilir Python kodu aynı sayfada. Kodlar repodaki dosyalardan; ayrıca repoda olmayan altı algoritma daha eklendi.',
          en: 'For every algorithm: the intuition, a step-by-step explanation, a live animation and runnable Python code on one page. The code comes from the repository files, plus six more algorithms that were not in the repository.'
        }))));
      const mk = (pg) => h('a', { class: 'card', href: '#/' + pg.id },
        h('span', { class: 'badge ' + pg.origin }, MH.ui(pg.origin === 'repo' ? 'badgeRepo' : 'badgeAdded')),
        h('h3', null, t(pg.title)), h('p', null, t(pg.blurb)));
      for (const [label, origin] of [[MH.UI.g_repo, 'repo'], [MH.UI.g_added, 'added']]) {
        const list = MH.pages.filter(p => p.origin === origin);
        if (!list.length) continue;
        root.append(h('section', { class: 'sec' }, h('h2', null, t(label)), h('div', { class: 'cards' }, list.map(mk))));
      }
      root.append(h('section', { class: 'sec' }, h('h2', null, t({ tr: 'Nasıl kullanılır?', en: 'How to use' })),
        h('ul', { class: 'notes' },
          h('li', { html: t({ tr: 'Animasyonlarda <b>Oynat</b> ile başlayın, <b>Adım</b> ile algoritmanın tek bir iterasyonunu izleyin.', en: 'Press <b>Play</b> in the animations, or <b>Step</b> to watch a single iteration of the algorithm.' }) }),
          h('li', { html: t({ tr: 'Kaydırıcılarla parametreleri değiştirip davranışın nasıl farklılaştığını görün.', en: 'Change the parameters with the sliders and see how the behaviour changes.' }) }),
          h('li', { html: t({ tr: 'Kod bölümünde bir açıklamaya tıklayınca ilgili satırlar vurgulanır.', en: 'In the code section, click a note to highlight the matching lines.' }) }),
          h('li', { html: t({ tr: 'Sağ üstten dili (TR/EN) ve temayı (açık/koyu) değiştirebilirsiniz.', en: 'Use the top-right buttons to switch language (TR/EN) and theme (light/dark).' }) }))));
    }
  });

  /* ---------- Concepts ---------- */
  MH.register({
    id: 'concepts', group: 'g_start', title: MH.UI.concepts, nav: MH.UI.concepts,
    render(root) {
      root.append(h('header', { class: 'pagehead' }, h('h1', null, t(MH.UI.concepts)),
        h('p', { class: 'lead' }, t({ tr: 'Tüm algoritmalarda tekrar eden dört fikir.', en: 'Four ideas that repeat in every algorithm.' }))));
      const cv = MH.canvas(760, 280), c = cv.ctx;
      const f = Sims.hcF;
      const p = MH.fnPlot(c, f, 0, 10, { x: 0, y: 0, w: 760, h: 280 });
      c.font = '13px system-ui, sans-serif';
      const mark = (x, label, color) => {
        MH.dot(c, p.X(x), p.Y(f(x)), 6, col(color), true);
        c.fillStyle = col('--text'); c.textAlign = 'center'; c.fillText(t(label), p.X(x), p.Y(f(x)) - 12);
      };
      mark(2.11, { tr: 'global maksimum', en: 'global maximum' }, '--good');
      mark(5.2, { tr: 'yerel maksimum', en: 'local maximum' }, '--warm');
      mark(7.32, { tr: 'yerel maksimum', en: 'local maximum' }, '--warm');
      root.append(h('section', { class: 'sec' }, h('h2', null, t({ tr: 'Yerel ve global optimum', en: 'Local vs. global optimum' })),
        h('p', { html: t({ tr: 'Arama uzayı genellikle dağlık bir arazi gibidir. Sadece "bulunduğum yerden daha yüksek komşuya git" kuralıyla ilerleyen bir yöntem, en yakın tepede (<b>yerel optimum</b>) takılır. Metasezgiseller, <b>global optimuma</b> ulaşmak için bilinçli olarak rastgelelik ve hafıza kullanır.', en: 'The search space often looks like a mountain range. A method that only moves to a better neighbour gets stuck on the nearest peak (a <b>local optimum</b>). Metaheuristics deliberately use randomness and memory to reach the <b>global optimum</b>.' }) }),
        cv.el));
      root.append(h('section', { class: 'sec' }, h('h2', null, t({ tr: 'Keşif ve sömürü dengesi', en: 'Exploration vs. exploitation' })),
        h('p', { html: t({ tr: '<b>Keşif (exploration)</b>: uzayın yeni bölgelerine bakmak. <b>Sömürü (exploitation)</b>: bulunan iyi bölgeyi ayrıntılı taramak. Çok keşif = yavaş yakınsama; çok sömürü = erken takılma. Her algoritmanın parametreleri bu dengeyi ayarlar: tavlamada <i>sıcaklık</i>, genetik algoritmada <i>mutasyon oranı</i>, PSO\'da <i>atalet ağırlığı w</i>, karınca kolonisinde <i>buharlaşma ρ</i>.', en: '<b>Exploration</b> means looking at new regions of the space; <b>exploitation</b> means searching a good region thoroughly. Too much exploration converges slowly; too much exploitation gets stuck early. Each algorithm\'s parameters tune this balance: <i>temperature</i> in annealing, <i>mutation rate</i> in genetic algorithms, <i>inertia weight w</i> in PSO, <i>evaporation ρ</i> in ant colony.' }) })));
      root.append(h('section', { class: 'sec' }, h('h2', null, t({ tr: 'Tek çözüm mü, popülasyon mu?', en: 'Single solution or population?' })),
        h('ul', { class: 'notes' },
          h('li', { html: t({ tr: '<b>Tek çözümlü</b> (trajectory) yöntemler: Hill Climbing, Tavlama Benzetimi, Tabu Arama. Tek bir noktayı arazide gezdirirler.', en: '<b>Single-solution</b> (trajectory) methods: Hill Climbing, Simulated Annealing, Tabu Search. They walk one point across the landscape.' }) }),
          h('li', { html: t({ tr: '<b>Popülasyonlu</b> yöntemler: Genetik Algoritma, PSO, Diferansiyel Evrim, Karınca Kolonisi, Arı Kolonisi, Gri Kurt. Birçok çözüm bilgi paylaşarak birlikte ilerler.', en: '<b>Population-based</b> methods: Genetic Algorithm, PSO, Differential Evolution, Ant Colony, Bee Colony, Grey Wolf. Many solutions advance together and share information.' }) }))));
      root.append(h('section', { class: 'sec' }, h('h2', null, t({ tr: 'Uygunluk (fitness) fonksiyonu', en: 'The fitness function' })),
        h('p', { html: t({ tr: 'Algoritmanın tek bilmesi gereken şey, bir çözümün <b>ne kadar iyi</b> olduğunu söyleyen bir sayıdır. Türevi, matematiksel yapıyı bilmesine gerek yok. Bu yüzden aynı algoritma Sudoku\'da çakışma sayısını, TSP\'de tur uzunluğunu, N-Vezir\'de saldırı çiftlerini ölçebilir. Bazı kodlarda büyük değer iyi (maksimizasyon), bazılarında küçük değer iyidir (minimizasyon); sayfalarda hangisi olduğu belirtilir.', en: 'The only thing the algorithm needs is a number saying <b>how good</b> a solution is. It does not need derivatives or any mathematical structure. That is why the same algorithm can measure conflicts in Sudoku, tour length in TSP, or attacking pairs in N-Queens. In some codes bigger is better (maximisation), in others smaller is better (minimisation); each page says which.' }) })));
    }
  });

  /* ---------- Comparison ---------- */
  MH.register({
    id: 'compare', group: 'g_start', title: MH.UI.compare, nav: MH.UI.compare,
    render(root) {
      root.append(h('header', { class: 'pagehead' }, h('h1', null, t(MH.UI.compare)),
        h('p', { class: 'lead' }, t({ tr: 'Hangi algoritma ne zaman? Kısa bir rehber.', en: 'Which algorithm when? A short guide.' }))));
      const rows = [
        ['hill-climbing', { tr: 'Tek çözüm', en: 'Single' }, { tr: 'Tepe tırmanma', en: 'Hill climbing' }, { tr: 'Sürekli / ayrık', en: 'Continuous / discrete' }, { tr: 'adım boyu, yeniden başlatma', en: 'step size, restarts' }],
        ['sa-function', { tr: 'Tek çözüm', en: 'Single' }, { tr: 'Metal tavlama', en: 'Metal annealing' }, { tr: 'Sürekli / ayrık', en: 'Continuous / discrete' }, { tr: 'başlangıç sıcaklığı, soğuma hızı', en: 'start temperature, cooling rate' }],
        ['tabu-search', { tr: 'Tek çözüm', en: 'Single' }, { tr: 'İnsan hafızası', en: 'Memory' }, { tr: 'Çoğunlukla ayrık (sıralama)', en: 'Mostly discrete (permutations)' }, { tr: 'tabu süresi, komşuluk', en: 'tabu tenure, neighbourhood' }],
        ['ga-sequence', { tr: 'Popülasyon', en: 'Population' }, { tr: 'Doğal seçilim', en: 'Natural selection' }, { tr: 'Ayrık / sürekli', en: 'Discrete / continuous' }, { tr: 'popülasyon, mutasyon, elitizm', en: 'population, mutation, elitism' }],
        ['pso', { tr: 'Popülasyon', en: 'Population' }, { tr: 'Kuş sürüsü', en: 'Bird flocks' }, { tr: 'Sürekli', en: 'Continuous' }, { tr: 'w, c1, c2', en: 'w, c1, c2' }],
        ['aco', { tr: 'Popülasyon', en: 'Population' }, { tr: 'Karınca izleri', en: 'Ant trails' }, { tr: 'Grafik / rota problemleri', en: 'Graph / routing problems' }, { tr: 'α, β, ρ, karınca sayısı', en: 'α, β, ρ, number of ants' }],
        ['diff-evolution', { tr: 'Popülasyon', en: 'Population' }, { tr: 'Evrim', en: 'Evolution' }, { tr: 'Sürekli', en: 'Continuous' }, { tr: 'NP, F, CR', en: 'NP, F, CR' }],
        ['abc', { tr: 'Popülasyon', en: 'Population' }, { tr: 'Bal arıları', en: 'Honey bees' }, { tr: 'Sürekli', en: 'Continuous' }, { tr: 'kaynak sayısı, limit', en: 'sources, limit' }],
        ['gwo', { tr: 'Popülasyon', en: 'Population' }, { tr: 'Kurt sürüsü', en: 'Wolf pack' }, { tr: 'Sürekli', en: 'Continuous' }, { tr: 'kurt sayısı, iterasyon (a: 2→0)', en: 'wolves, iterations (a: 2→0)' }]
      ];
      const head = [{ tr: 'Algoritma', en: 'Algorithm' }, { tr: 'Tür', en: 'Type' }, { tr: 'Esin kaynağı', en: 'Inspiration' }, { tr: 'Problem tipi', en: 'Problem type' }, { tr: 'Ana parametreler', en: 'Key parameters' }];
      root.append(h('section', { class: 'sec' }, h('div', { class: 'tblwrap' }, h('table', { class: 'cmp' },
        h('thead', null, h('tr', null, head.map(x => h('th', null, t(x))))),
        h('tbody', null, rows.map(r => h('tr', null,
          h('td', null, h('a', { href: '#/' + r[0] }, t(MH.pageMap[r[0]].title))), h('td', null, t(r[1])), h('td', null, t(r[2])), h('td', null, t(r[3])), h('td', null, t(r[4])))))))));
      root.append(h('section', { class: 'sec' }, h('h2', null, t({ tr: 'Pratik rehber', en: 'Rules of thumb' })),
        h('ul', { class: 'notes' },
          h('li', { html: t({ tr: '<b>Hızlı ve basit bir taban çizgisi</b> lazımsa: rastgele yeniden başlatmalı Hill Climbing.', en: 'Need a <b>fast, simple baseline</b>: Hill Climbing with random restarts.' }) }),
          h('li', { html: t({ tr: '<b>Sıralama / rota</b> problemleri (TSP): Tavlama, Tabu, Karınca Kolonisi, GA (sıralama operatörleriyle).', en: '<b>Ordering / routing</b> problems (TSP): Annealing, Tabu, Ant Colony, GA (with permutation operators).' }) }),
          h('li', { html: t({ tr: '<b>Sürekli</b> parametre optimizasyonu: Diferansiyel Evrim ve PSO çoğu zaman en az ayarla iyi sonuç verir.', en: '<b>Continuous</b> parameter optimisation: Differential Evolution and PSO usually work well with little tuning.' }) }),
          h('li', { html: t({ tr: '<b>Kısıtlı ayrık</b> problemler (Sudoku, N-Vezir, sırt çantası): GA veya Tavlama; uygunluk fonksiyonuna ceza terimi koyun.', en: '<b>Constrained discrete</b> problems (Sudoku, N-Queens, knapsack): GA or Annealing; put a penalty term in the fitness.' }) }),
          h('li', { html: t({ tr: '"Bedava öğle yemeği yok": hiçbir algoritma her problemde en iyisi değildir; parametre ayarı çoğu zaman algoritma seçiminden daha etkilidir.', en: '"No free lunch": no algorithm wins on every problem; tuning the parameters often matters more than the choice of algorithm.' }) }))));
    }
  });
})();
