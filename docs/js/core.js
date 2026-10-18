/* Core: i18n, theme, router, and reusable UI components (player, charts, code viewer, controls). */
(function () {
  'use strict';
  const MH = window.MH = { pages: [], pageMap: {}, lang: 'tr', theme: 'light', code: window.MH_CODE || {} };

  /* ---------- helpers ---------- */
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    for (const c of kids.flat(Infinity)) { if (c == null || c === false) continue; el.append(c.nodeType ? c : document.createTextNode(c)); }
    return el;
  }
  const t = o => (o == null ? '' : typeof o === 'string' ? o : (o[MH.lang] != null ? o[MH.lang] : o.en));
  const col = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  MH.h = h; MH.t = t; MH.col = col;
  MH.fmt = (v, d = 3) => (Number.isFinite(v) ? (Math.abs(v) >= 1e5 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(2) : v.toFixed(d)) : String(v));
  MH.rngFor = seed => window.Sims.mulberry32(seed);
  MH.newSeed = () => (Math.random() * 1e9) | 0;

  /* ---------- UI strings ---------- */
  const UI = {
    siteTitle: { tr: 'Metasezgisel Algoritmalar Eğitimi', en: 'Metaheuristic Algorithms Training' },
    home: { tr: 'Ana Sayfa', en: 'Home' }, concepts: { tr: 'Temel Kavramlar', en: 'Core Concepts' }, compare: { tr: 'Karşılaştırma', en: 'Comparison' },
    g_sa: { tr: 'Tavlama Benzetimi', en: 'Simulated Annealing' }, g_ga: { tr: 'Genetik Algoritma', en: 'Genetic Algorithm' },
    g_pso: { tr: 'Sürü Zekâsı', en: 'Swarm Intelligence' }, g_local: { tr: 'Yerel Arama', en: 'Local Search' },
    g_evo: { tr: 'Evrimsel / Dağılım Tabanlı', en: 'Evolutionary / Distribution-Based' }, g_nature: { tr: 'Doğadan Esinlenen', en: 'Nature-Inspired' },
    g_start: { tr: 'Başlangıç', en: 'Start' }, g_repo: { tr: 'Repodaki kodlardan', en: 'From the repository code' }, g_added: { tr: 'Eklenen algoritmalar', en: 'Added algorithms' },
    badgeRepo: { tr: 'Repodaki kod', en: 'Repository code' }, badgeAdded: { tr: 'Eklenen kod', en: 'Added code' },
    secIntuition: { tr: 'Sezgi', en: 'Intuition' }, secSteps: { tr: 'Nasıl çalışır?', en: 'How does it work?' },
    secDemo: { tr: 'Canlı animasyon', en: 'Live animation' }, secCode: { tr: 'Kod', en: 'Code' },
    secNotes: { tr: 'Kod notları', en: 'Code notes' }, secParams: { tr: 'Parametrelerin etkisi', en: 'Effect of the parameters' },
    secPros: { tr: 'Artıları ve eksileri', en: 'Strengths and weaknesses' }, pros: { tr: 'Artıları', en: 'Strengths' }, cons: { tr: 'Eksileri', en: 'Weaknesses' },
    play: { tr: 'Oynat', en: 'Play' }, pause: { tr: 'Duraklat', en: 'Pause' }, step: { tr: 'Adım', en: 'Step' }, reset: { tr: 'Sıfırla', en: 'Reset' },
    speed: { tr: 'Hız', en: 'Speed' }, newRun: { tr: 'Yeni rastgele başlangıç', en: 'New random start' },
    annotations: { tr: 'Satır açıklamaları (tıklayın)', en: 'Line-by-line notes (click)' }, lines: { tr: 'satır', en: 'lines' },
    stepsSec: { tr: 'adım/sn', en: 'steps/s' }, finished: { tr: 'Tamamlandı', en: 'Finished' },
    footer: { tr: 'Python kodları repodaki dosyalardır; animasyonlar aynı mantığın tarayıcıdaki JavaScript karşılığıdır.', en: 'The Python files come from the repository; the animations are a JavaScript port of the same logic running in your browser.' }
  };
  MH.UI = UI; MH.ui = k => t(UI[k]);

  /* ---------- theme / language ---------- */
  function applyTheme(th) { MH.theme = th; document.documentElement.setAttribute('data-theme', th); store('mh-theme', th); }
  function applyLang(l) { MH.lang = l; document.documentElement.setAttribute('lang', l); store('mh-lang', l); }

  /* ---------- python syntax highlighting (tiny) ---------- */
  const KW = 'def|class|if|elif|else|while|for|in|return|import|from|as|not|and|or|is|None|True|False|self|continue|break|print|lambda|pass';
  const HL = new RegExp('(#.*$)|(\'(?:[^\'\\\\\\n]|\\\\.)*\'|"(?:[^"\\\\\\n]|\\\\.)*")|\\b(def|class)(\\s+)(\\w+)|\\b(' + KW + ')\\b|\\b(\\d+\\.?\\d*(?:e-?\\d+)?)\\b', 'g');
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  MH.highlight = function (line) {
    return esc(line).replace(HL, (m, com, str, dc, sp, name, kw, num) => {
      if (com) return '<span class="tk-c">' + com + '</span>';
      if (str) return '<span class="tk-s">' + str + '</span>';
      if (dc) return '<span class="tk-k">' + dc + '</span>' + sp + '<span class="tk-f">' + name + '</span>';
      if (kw) return '<span class="tk-k">' + kw + '</span>';
      if (num) return '<span class="tk-n">' + num + '</span>';
      return m;
    });
  };

  /* ---------- controls ---------- */
  MH.slider = function ({ label, min, max, step = 1, value, fmt, onInput }) {
    const out = h('output');
    const inp = h('input', { type: 'range', min, max, step, value });
    const show = () => { out.textContent = fmt ? fmt(+inp.value) : inp.value; };
    inp.addEventListener('input', () => { show(); onInput && onInput(+inp.value); });
    show();
    return h('label', { class: 'ctl' }, h('span', { class: 'ctl-l' }, t(label)), inp, out);
  };
  MH.toggle = function ({ label, value, onChange }) {
    const inp = h('input', { type: 'checkbox' }); inp.checked = !!value;
    inp.addEventListener('change', () => onChange && onChange(inp.checked));
    return h('label', { class: 'ctl ctl-check' }, inp, h('span', { class: 'ctl-l' }, t(label)));
  };
  MH.select = function ({ label, options, value, onChange }) {
    const sel = h('select', null, options.map(o => h('option', { value: o.v }, t(o.label))));
    sel.value = value;
    sel.addEventListener('change', () => onChange && onChange(sel.value));
    return h('label', { class: 'ctl' }, h('span', { class: 'ctl-l' }, t(label)), sel);
  };
  MH.button = (label, onClick, cls) => h('button', { class: 'btn ' + (cls || ''), type: 'button', onclick: onClick }, t(label));

  /* ---------- canvas ---------- */
  MH.canvas = function (w, hh) {
    const c = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = w * dpr; c.height = hh * dpr; c.style.aspectRatio = w + ' / ' + hh;
    const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
    return { el: c, ctx, w, h: hh };
  };

  /* ---------- line chart ---------- */
  MH.chart = function (ctx, x, y, w, hh, series, o = {}) {
    ctx.save();
    ctx.fillStyle = col('--panel2'); ctx.fillRect(x, y, w, hh);
    ctx.strokeStyle = col('--line'); ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, hh - 1);
    let n = 0, lo = Infinity, hi = -Infinity;
    for (const s of series) {
      n = Math.max(n, s.data.length);
      for (const v of s.data) if (Number.isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; }
    }
    if (o.minY != null) lo = o.minY; if (o.maxY != null) hi = o.maxY;
    ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = col('--muted');
    if (o.title) ctx.fillText(t(o.title), x + 8, y + 14);
    if (n < 2 || !Number.isFinite(lo)) { ctx.restore(); return; }
    if (hi === lo) { hi += 1; lo -= 1; }
    const px = 8, py = 22, pw = w - 2 * px, ph = hh - py - 8;
    ctx.textAlign = 'right';
    ctx.fillText(MH.fmt(hi, 2), x + w - 6, y + 14);
    ctx.fillText(MH.fmt(lo, 2), x + w - 6, y + hh - 4);
    ctx.textAlign = 'left';
    for (const s of series) {
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 1.6; ctx.beginPath();
      let started = false;
      s.data.forEach((v, i) => {
        if (!Number.isFinite(v)) return;
        const X = x + px + (i / (n - 1)) * pw, Y = y + py + (1 - (v - lo) / (hi - lo)) * ph;
        if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
      });
      ctx.stroke();
    }
    let lx = x + 8;
    ctx.font = '10px system-ui, sans-serif';
    for (const s of series) {
      if (!s.label) continue;
      ctx.fillStyle = s.color; ctx.fillRect(lx, y + hh - 14, 10, 3);
      ctx.fillStyle = col('--muted'); ctx.fillText(t(s.label), lx + 14, y + hh - 9);
      lx += 22 + ctx.measureText(t(s.label)).width;
    }
    ctx.restore();
  };

  /* ---------- player (play / pause / step / reset / speed) ---------- */
  MH.player = function (o) {
    let playing = false, last = 0, acc = 0, sps = o.sps || 20;
    const min = o.minSps || 1, max = o.maxSps || 400;
    const toSps = v => Math.round(min * Math.pow(max / min, v / 100));
    const fromSps = s => Math.round(100 * Math.log(s / min) / Math.log(max / min));
    const status = h('span', { class: 'status' });
    const play = MH.button(UI.play, () => (playing ? pause() : start()), 'primary');
    const speedOut = h('output');
    const speed = h('input', { type: 'range', min: 0, max: 100, step: 1, value: fromSps(sps) });
    speed.addEventListener('input', () => { sps = toSps(+speed.value); speedOut.textContent = sps + ' ' + MH.ui('stepsSec'); });
    speedOut.textContent = sps + ' ' + MH.ui('stepsSec');
    function label() { play.textContent = MH.ui(playing ? 'pause' : 'play'); }
    function start() { if (o.isDone && o.isDone()) { o.reset(); } playing = true; last = performance.now(); acc = 0; label(); requestAnimationFrame(loop); }
    function pause() { playing = false; label(); }
    function loop(ts) {
      if (!playing) return;
      if (!el.isConnected) { playing = false; return; }
      acc += Math.min(0.1, (ts - last) / 1000) * sps; last = ts;
      let n = Math.min(Math.floor(acc), 300); acc -= Math.floor(acc);
      let alive = true;
      for (let i = 0; i < n && alive; i++) alive = o.step() !== false;
      o.draw();
      if (!alive) { pause(); return; }
      requestAnimationFrame(loop);
    }
    const el = h('div', { class: 'player' },
      play,
      MH.button(UI.step, () => { pause(); o.step(); o.draw(); }),
      MH.button(UI.reset, () => { pause(); o.reset(); o.draw(); }),
      h('label', { class: 'ctl' }, h('span', { class: 'ctl-l' }, MH.ui('speed')), speed, speedOut),
      status);
    return { el, pause, start, setStatus: s => { status.textContent = s || ''; } };
  };

  /* ---------- code viewer ---------- */
  MH.codeViewer = function (files, anns) {
    anns = anns || {};
    const wrap = h('div', { class: 'codeviewer' });
    const tabs = h('div', { class: 'tabs' });
    const body = h('div', { class: 'codebody' });
    wrap.append(tabs, body);
    let active = 0;
    function show(i) {
      active = i;
      tabs.innerHTML = '';
      files.forEach((f, k) => tabs.append(h('button', { class: 'tab' + (k === i ? ' on' : ''), type: 'button', onclick: () => show(k) }, f)));
      body.innerHTML = '';
      const code = MH.code[files[i]] || '# (missing)';
      const lines = code.replace(/\r/g, '').replace(/\n$/, '').split('\n');
      const pre = h('div', { class: 'code' });
      const rows = lines.map((ln, idx) => {
        const row = h('div', { class: 'ln' }, h('span', { class: 'n' }, String(idx + 1)), h('span', { class: 'c', html: MH.highlight(ln) || '&nbsp;' }));
        pre.append(row); return row;
      });
      const list = (anns[files[i]] || []).map(a => {
        const start = Math.max(0, lines.findIndex(l => l.includes(a.find)));
        return { a, start, end: Math.min(lines.length - 1, start + (a.span || 1) - 1) };
      });
      const side = h('div', { class: 'ann' });
      if (list.length) side.append(h('div', { class: 'ann-h' }, MH.ui('annotations')));
      let sel = null;
      list.forEach(it => {
        const btn = h('button', { type: 'button', class: 'ann-i' },
          h('b', null, 'L' + (it.start + 1) + (it.end > it.start ? '–' + (it.end + 1) : '')), ' ', t(it.a.text));
        btn.addEventListener('click', () => {
          rows.forEach(r => r.classList.remove('hl'));
          if (sel === btn) { sel.classList.remove('on'); sel = null; return; }
          if (sel) sel.classList.remove('on');
          sel = btn; btn.classList.add('on');
          for (let k = it.start; k <= it.end; k++) rows[k].classList.add('hl');
          pre.scrollTo({ top: Math.max(0, rows[it.start].offsetTop - 40), behavior: 'smooth' });
          wrap.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
        side.append(btn);
      });
      body.append(pre, side);
    }
    show(0);
    return wrap;
  };

  /* ---------- page registration / algorithm page template ---------- */
  MH.register = function (p) { MH.pages.push(p); MH.pageMap[p.id] = p; };

  const section = (title, ...kids) => h('section', { class: 'sec' }, h('h2', null, t(title)), ...kids);
  const paras = arr => (arr || []).map(x => h('p', { html: x }));
  const per = o => (o && o[MH.lang]) || (o && o.en) || [];

  MH.algoPage = function (d) {
    MH.register({
      id: d.id, group: d.group, title: d.title, nav: d.nav || d.title, origin: d.origin, blurb: d.blurb,
      render(root) {
        root.append(h('header', { class: 'pagehead' },
          h('span', { class: 'badge ' + d.origin }, MH.ui(d.origin === 'repo' ? 'badgeRepo' : 'badgeAdded')),
          h('h1', null, t(d.title)), h('p', { class: 'lead', html: t(d.tagline) })));
        root.append(section(UI.secIntuition, ...paras(per(d.intuition))));
        root.append(section(UI.secSteps, h('ol', { class: 'steps' }, per(d.steps).map(s => h('li', { html: s })))));
        const demo = h('div', { class: 'demo' });
        root.append(section(UI.secDemo, demo));
        d.demo(demo);
        root.append(section(UI.secCode, MH.codeViewer(d.files, d.anns)));
        if (d.notes) root.append(section(UI.secNotes, h('ul', { class: 'notes' }, per(d.notes).map(s => h('li', { html: s })))));
        if (d.params) root.append(section(UI.secParams, h('dl', { class: 'params' }, per(d.params).flatMap(([k, v]) => [h('dt', { html: k }), h('dd', { html: v })]))));
        root.append(section(UI.secPros, h('div', { class: 'proscons' },
          h('div', { class: 'pc good' }, h('h3', null, MH.ui('pros')), h('ul', null, per(d.pros).map(s => h('li', { html: s })))),
          h('div', { class: 'pc bad' }, h('h3', null, MH.ui('cons')), h('ul', null, per(d.cons).map(s => h('li', { html: s })))))));
      }
    });
  };

  /* ---------- shell + router ---------- */
  function buildNav() {
    const nav = document.getElementById('nav'); nav.innerHTML = '';
    const groups = [];
    MH.pages.forEach(p => { if (!groups.find(g => g.id === p.group)) groups.push({ id: p.group, items: [] }); groups.find(g => g.id === p.group).items.push(p); });
    groups.forEach(g => {
      nav.append(h('div', { class: 'nav-g' }, MH.ui(g.id)));
      g.items.forEach(p => nav.append(h('a', { href: '#/' + p.id, class: 'nav-i', 'data-id': p.id }, t(p.nav))));
    });
  }
  let current = null;
  function render() {
    const id = location.hash.replace(/^#\/?/, '') || 'home';
    const page = MH.pageMap[id] || MH.pageMap.home;
    current = page;
    document.title = t(page.title) + ' · ' + MH.ui('siteTitle');
    document.querySelectorAll('.nav-i').forEach(a => a.classList.toggle('on', a.dataset.id === page.id));
    const root = document.getElementById('page'); root.innerHTML = '';
    page.render(root);
    root.append(h('footer', { class: 'foot' }, MH.ui('footer')));
    window.scrollTo(0, 0);
    document.body.classList.remove('nav-open');
  }
  MH.rerender = () => { buildNav(); const y = window.scrollY; render(); window.scrollTo(0, y); };

  MH.start = function () {
    applyLang(store('mh-lang') || ((navigator.language || 'tr').toLowerCase().startsWith('tr') ? 'tr' : 'en'));
    applyTheme(store('mh-theme') || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    const langBtn = document.getElementById('btn-lang'), themeBtn = document.getElementById('btn-theme');
    const syncBtns = () => {
      langBtn.textContent = MH.lang === 'tr' ? 'EN' : 'TR';
      langBtn.title = MH.lang === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç';
      themeBtn.textContent = MH.theme === 'dark' ? '☀' : '☾';
      themeBtn.title = MH.theme === 'dark' ? 'Light theme / Aydınlık tema' : 'Dark theme / Karanlık tema';
      document.getElementById('site-title').textContent = MH.ui('siteTitle');
    };
    langBtn.addEventListener('click', () => { applyLang(MH.lang === 'tr' ? 'en' : 'tr'); syncBtns(); MH.rerender(); });
    themeBtn.addEventListener('click', () => { applyTheme(MH.theme === 'dark' ? 'light' : 'dark'); syncBtns(); MH.rerender(); });
    document.getElementById('btn-menu').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    window.addEventListener('hashchange', render);
    syncBtns(); buildNav(); render();
  };
})();
