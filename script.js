// SET MDA site scripts
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Language
  var titles = { en: 'SET MDA · Sustainable Energy Team', es: 'SET MDA · Equipo de Energía Sostenible' };
  function setLang(l) {
    root.lang = l;
    document.title = titles[l];
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === l ? 'true' : 'false');
    });
    try { localStorage.setItem('setmda-lang', l); } catch (e) {}
    if (typeof fit === 'function') fit();
  }
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
  });
  setLang(root.lang === 'es' ? 'es' : 'en');

  // Make the giant words always fit the screen width, whatever the font or language
  function fit() {
    document.querySelectorAll('.fit').forEach(function (el) {
      el.style.fontSize = '';
      var base = parseFloat(getComputedStyle(el).fontSize);
      var probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font:inherit;letter-spacing:inherit;font-stretch:inherit;';
      probe.textContent = (el.innerText || el.textContent).replace(/\s+/g, ' ').trim();
      el.appendChild(probe);
      var w = probe.getBoundingClientRect().width;
      el.removeChild(probe);
      var avail = el.clientWidth;
      if (w > 0 && avail > 0) {
        var size = base * avail / w * 0.985;
        if (el.closest('.lights') && window.innerWidth > 900) size = Math.min(size, window.innerHeight * 0.155);
        el.style.fontSize = size + 'px';
      }
    });
  }
  window.addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  // Live Panama clock
  var clock = document.getElementById('clock');
  function tick() {
    try {
      clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Panama' }).format(new Date());
    } catch (e) { clock.textContent = ''; }
  }
  if (clock) { tick(); setInterval(tick, 20000); }

  // Top bar adapts to the section underneath it
  var bar = document.getElementById('bar');
  var sections = Array.prototype.slice.call(document.querySelectorAll('main > section, footer'));
  function onScroll() {
    var y = 40, cur = null;
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { cur = sections[i]; break; }
    }
    if (!cur) return;
    var dark = cur.matches('.lights, .navy-sec, .donate');
    bar.classList.toggle('on-light', !dark);
    bar.classList.toggle('scrolled', window.scrollY > 40);
    bar.style.setProperty('--bg-bar', getComputedStyle(cur).backgroundColor);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Full-screen menu
  var menuBtn = document.getElementById('menu-btn');
  var menu = document.getElementById('menu');
  function setMenu(open) {
    menu.hidden = !open;
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { var a = menu.querySelector('a'); if (a) a.focus(); } else { onScroll(); }
  }
  menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.querySelectorAll('a[href^="#"]').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

  // Lights out: flashlight + solar panel connector
  var lights = document.getElementById('lights');
  var win = document.getElementById('window');
  var svg = document.getElementById('rig-svg');
  var rig = document.getElementById('rig');
  var plug = document.getElementById('plug');
  var cable = document.getElementById('cable');
  var flow = document.getElementById('cable-flow');
  var connectBtn = document.getElementById('connect');
  if (lights && win && svg && plug) {
    var moved = false, t0 = performance.now();
    function spot(x, y) { win.style.setProperty('--x', x + '%'); win.style.setProperty('--y', y + '%'); }
    function wander(ts) {
      if (moved || lights.classList.contains('on')) return;
      var t = (ts - t0) / 1000;
      // drift around the room, passing over the bulb every few seconds
      spot(47 + 26 * Math.sin(t * 0.6), 34 + 26 * Math.sin(t * 0.9 + 2.2));
      requestAnimationFrame(wander);
    }
    if (!reduce) requestAnimationFrame(wander); else spot(47, 12);
    win.addEventListener('pointermove', function (e) {
      var r = win.getBoundingClientRect();
      moved = true; win.classList.add('touched');
      spot((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100);
    });

    var START = { x: 176, y: 204 }, TARGET = { x: 236, y: 190 }, SNAP = 46;
    var pos = { x: START.x, y: START.y }, dragging = false, dragMoved = false, anim = null;
    function draw() {
      plug.setAttribute('transform', 'translate(' + pos.x.toFixed(1) + ' ' + pos.y.toFixed(1) + ')');
      var ex = pos.x - 15, ey = pos.y;
      var d = 'M120 122 C 120 214, ' + (ex - 70).toFixed(1) + ' ' + (ey + 18).toFixed(1) + ', ' + ex.toFixed(1) + ' ' + ey.toFixed(1);
      cable.setAttribute('d', d); flow.setAttribute('d', d);
    }
    function animateTo(to, done) {
      if (anim) cancelAnimationFrame(anim);
      var from = { x: pos.x, y: pos.y }, s = null, dur = reduce ? 1 : 380;
      function step(ts) {
        if (!s) s = ts;
        var p = Math.min((ts - s) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        pos.x = from.x + (to.x - from.x) * e; pos.y = from.y + (to.y - from.y) * e; draw();
        if (p < 1) anim = requestAnimationFrame(step); else { anim = null; if (done) done(); }
      }
      anim = requestAnimationFrame(step);
    }
    function setOn(on) {
      lights.classList.toggle('on', on);
      plug.setAttribute('aria-pressed', on ? 'true' : 'false');
      var st = svg.querySelector('.screen-t'); if (st) st.textContent = on ? 'ON' : '0%';
      fit();
      if (!on && !reduce) { moved = false; t0 = performance.now(); requestAnimationFrame(wander); }
    }
    function connect() { animateTo(TARGET, function () { setOn(true); }); }
    function disconnect() { setOn(false); animateTo(START); }
    function toSvg(e) {
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    }
    plug.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (lights.classList.contains('on')) { disconnect(); return; }
      dragging = true; dragMoved = false; rig.classList.add('dragging');
      try { plug.setPointerCapture(e.pointerId); } catch (err) {}
    });
    plug.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var p = toSvg(e); dragMoved = true;
      pos.x = Math.max(20, Math.min(380, p.x)); pos.y = Math.max(20, Math.min(235, p.y));
      if (Math.hypot(pos.x - TARGET.x, pos.y - TARGET.y) < SNAP) { dragging = false; rig.classList.remove('dragging'); connect(); return; }
      draw();
    });
    function release() {
      if (!dragging) return;
      dragging = false; rig.classList.remove('dragging');
      if (!dragMoved || Math.hypot(pos.x - TARGET.x, pos.y - TARGET.y) < SNAP * 1.4) connect();
      else animateTo(START);
    }
    plug.addEventListener('pointerup', release);
    plug.addEventListener('pointercancel', release);
    plug.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lights.classList.contains('on') ? disconnect() : connect(); }
    });
    if (connectBtn) connectBtn.addEventListener('click', connect);
    draw();
  }

  // Draw the dot-matrix map of Panama (Natural Earth 1:110m outline)
  var mapCells = document.getElementById('map-cells');
  if (mapCells) {
    var POLY = [[-77.881571,7.223771],[-78.214936,7.512255],[-78.429161,8.052041],[-78.182096,8.319182],[-78.435465,8.387705],[-78.622121,8.718124],[-79.120307,8.996092],[-79.557877,8.932375],[-79.760578,8.584515],[-80.164481,8.333316],[-80.382659,8.298409],[-80.480689,8.090308],[-80.00369,7.547524],[-80.276671,7.419754],[-80.421158,7.271572],[-80.886401,7.220541],[-81.059543,7.817921],[-81.189716,7.647906],[-81.519515,7.70661],[-81.721311,8.108963],[-82.131441,8.175393],[-82.390934,8.292362],[-82.820081,8.290864],[-82.850958,8.073823],[-82.965783,8.225028],[-82.913176,8.423517],[-82.829771,8.626295],[-82.868657,8.807266],[-82.719183,8.925709],[-82.927155,9.07433],[-82.932891,9.476812],[-82.546196,9.566135],[-82.187123,9.207449],[-82.207586,8.995575],[-81.808567,8.950617],[-81.714154,9.031955],[-81.439287,8.786234],[-80.947302,8.858504],[-80.521901,9.111072],[-79.9146,9.312765],[-79.573303,9.61161],[-79.021192,9.552931],[-79.05845,9.454565],[-78.500888,9.420459],[-78.055928,9.24773],[-77.729514,8.946844],[-77.353361,8.670505],[-77.474723,8.524286],[-77.242566,7.935278],[-77.431108,7.638061],[-77.753414,7.70984],[-77.881571,7.223771]];
    var LON0 = -83.2, LON1 = -77.0, LAT0 = 7.0, LAT1 = 9.85, STEP = 0.06, SC = 100, out = '';
    function inPoly(x, y) {
      var c = false;
      for (var i = 0, k = POLY.length - 1; i < POLY.length; k = i++) {
        var xi = POLY[i][0], yi = POLY[i][1], xk = POLY[k][0], yk = POLY[k][1];
        if (((yi > y) !== (yk > y)) && (x < (xk - xi) * (y - yi) / (yk - yi) + xi)) c = !c;
      }
      return c;
    }
    for (var la = LAT0 + STEP / 2; la <= LAT1; la += STEP) {
      for (var lo = LON0 + STEP / 2; lo <= LON1; lo += STEP) {
        if (inPoly(lo, la)) {
          var x = (lo - LON0) * SC - 2.2, y = (LAT1 - la) * SC - 2.2;
          out += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="4.4" height="4.4"/>';
        }
      }
    }
    mapCells.innerHTML = out;
  }

  // System diagram
  var nodes = Array.prototype.slice.call(document.querySelectorAll('.node'));
  nodes.forEach(function (n) {
    function pick() {
      nodes.forEach(function (m) { m.setAttribute('aria-pressed', m === n ? 'true' : 'false'); });
      document.querySelectorAll('.desc').forEach(function (d) { d.hidden = d.getAttribute('data-desc') !== n.getAttribute('data-node'); });
    }
    n.addEventListener('click', pick);
    n.addEventListener('mouseenter', pick);
  });

  // 41 homes fill in one by one
  var hcard = document.getElementById('homes-card');
  if (hcard && 'IntersectionObserver' in window && !reduce && hcard.getBoundingClientRect().top > window.innerHeight) {
    hcard.classList.add('arm');
    var hc = document.getElementById('home-count');
    if (hc) hc.textContent = '0';
    new IntersectionObserver(function (es, obs) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        hcard.classList.remove('arm'); hcard.classList.add('go');
        if (hc) { var n = 0; var iv = setInterval(function () { n++; hc.textContent = n; if (n >= 41) clearInterval(iv); }, 40); }
        obs.disconnect();
      });
    }, { threshold: 0.35 }).observe(hcard);
  }

  // Copy Yappy number
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.getAttribute('data-copy'), before = b.innerHTML;
      var msg = root.lang === 'es' ? b.getAttribute('data-done-es') : b.getAttribute('data-done-en');
      function show(m) { b.textContent = m; setTimeout(function () { b.innerHTML = before; }, 1800); }
      try { navigator.clipboard.writeText(text).then(function () { show(msg); }, function () { show(text); }); }
      catch (e) { show(text); }
    });
  });

  // Reveal, count-up, and photos lighting up in color
  root.classList.add('js');
  function countUp(el) {
    var end = parseInt(el.getAttribute('data-count'), 10), start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 1400, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.remove('pre');
        if (el.classList.contains('mono-img')) el.classList.add('lit');
        if (el.hasAttribute('data-count') && !reduce) countUp(el);
        io.unobserve(el);
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('.rv, .mono-img, [data-count]').forEach(function (el, i) {
      if (el.classList.contains('rv') && !reduce && el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add('pre'); el.style.transitionDelay = (i % 3) * 80 + 'ms';
      }
      io.observe(el);
    });
  } else {
    document.querySelectorAll('.mono-img').forEach(function (el) { el.classList.add('lit'); });
  }

  fit();
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
