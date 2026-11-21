// TeleCloud Cadence page: reveals, the nav's shadow, and the hero (a dot waveform with a scan line
// that lights the lyric line word by word). No dependencies.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  const nav = document.querySelector('.nav');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 20), { passive: true });

  // ---- stage 01: the mix, and what is left of it once the music steps aside
  const mix = document.querySelector('.bars.mix'), voice = document.querySelector('.bars.voice');
  if (mix && voice) {
    const N = 48;
    for (let i = 0; i < N; i++) {
      const x = i / N;
      const sing = Math.sin(x * Math.PI * 3.6 + .3) > .05;               // phrases of the singer
      const all = .35 + .6 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * .63)); // drums and all, everywhere
      const v = sing ? .3 + .6 * Math.abs(Math.sin(i * .9 + 1)) : .06;
      mix.insertAdjacentHTML('beforeend', `<i style="--v:${all.toFixed(2)};--k:${i}"></i>`);
      voice.insertAdjacentHTML('beforeend', `<i class="${sing ? '' : 'off'}" style="--v:${v.toFixed(2)};--k:${i}"></i>`);
    }
  }

  // ---- hero
  const canvas = document.getElementById('cad-wave');
  const stage = canvas.parentElement;
  const words = [...document.querySelectorAll('#cad-line .w')];
  const clock = document.getElementById('cad-clock');
  const stageName = document.getElementById('cad-stage-name');
  const ctx = canvas.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue('--accent').trim() || '#4f8dff';
  const LOOP = 7.5;        // s for one pass of the scan
  const SING = [.12, .86]; // part of the pass the line is sung over
  let cols = [], w = 0, h = 0, dpr = 1;

  // a made-up singing envelope: phrases with gaps, steady per column so the picture does not flicker
  const envelope = (x) => {
    const phrase = Math.max(0, Math.sin(x * Math.PI * 5.2 + .4)) ** .6;
    const grain = .55 + .45 * Math.sin(x * 97.3) * Math.sin(x * 23.1 + 1.3);
    return Math.min(1, .08 + phrase * grain * .95);
  };
  const size = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = stage.clientWidth; h = stage.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.floor(w / 9);
    cols = Array.from({ length: n }, (_, i) => envelope(i / n));
  };
  const draw = (t) => {
    const scan = (t % LOOP) / LOOP;
    stage.style.setProperty('--scan', `${scan * 100}%`);
    ctx.clearRect(0, 0, w, h);
    const step = 9, dot = 2.2, mid = h / 2, rows = Math.floor((h - 30) / step / 2);
    cols.forEach((v, i) => {
      const x = i * step + step / 2;
      const past = x / w < scan;
      const near = Math.max(0, 1 - Math.abs(x / w - scan) * 18);
      const live = v * (1 + near * .35 + (past ? .04 * Math.sin(t * 6 + i) : 0));
      const n = Math.max(1, Math.round(live * rows));
      ctx.fillStyle = past ? accent : 'rgba(255,255,255,.14)';
      ctx.globalAlpha = past ? .55 + .45 * near : .9;
      for (let r = 0; r < n; r++) {
        ctx.fillRect(x - dot / 2, mid - r * step - dot / 2, dot, dot);
        if (r) ctx.fillRect(x - dot / 2, mid + r * step - dot / 2, dot, dot);
      }
    });
    ctx.globalAlpha = 1;
    // the line: words fill as the scan passes their time
    const sung = Math.min(1, Math.max(0, (scan - SING[0]) / (SING[1] - SING[0]))) * 1.4;
    words.forEach(el => {
      const a = +el.dataset.a, b = +el.dataset.b;
      el.style.setProperty('--p', (sung <= a ? 0 : sung >= b ? 1 : (sung - a) / (b - a)).toFixed(3));
    });
    const sec = 42.18 + scan * LOOP;
    clock.textContent = `00:${sec.toFixed(2).padStart(5, '0')}`;
    stageName.textContent = scan < SING[0] ? 'STAGE 01 · VOICE' : scan < SING[1] ? 'STAGE 02 · PLACE' : 'STAGE 03 · CHECK';
  };

  size();
  addEventListener('resize', size);
  if (reduce) { draw(LOOP * .7); return; }
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
  const start = performance.now();
  const frame = (now) => { if (visible) draw((now - start) / 1000); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
})();
