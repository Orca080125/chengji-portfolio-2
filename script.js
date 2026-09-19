/* Chengji Song — lightweight, progressively enhanced interactions. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const animated = () => !reducedMotion.matches;

  // Content stays readable when JavaScript or observers are unavailable.
  if ('IntersectionObserver' in window && animated()) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    document.documentElement.classList.add('js-motion');
  }

  const scores = document.querySelectorAll('.score');
  function paintScore(el, value) {
    el.replaceChildren(document.createTextNode(String(value)));
    if (el.dataset.suffix) {
      const suffix = document.createElement('span');
      suffix.className = 'score-suffix';
      suffix.textContent = el.dataset.suffix;
      el.append(suffix);
    }
  }
  scores.forEach(el => {
    el.setAttribute('aria-label', el.dataset.target + (el.dataset.suffix || ''));
    paintScore(el, Number(el.dataset.target));
  });
  if ('IntersectionObserver' in window) {
    const scoreObserver = new IntersectionObserver(entries => {
      entries.forEach(({ target: el, isIntersecting }) => {
        if (!isIntersecting) return;
        scoreObserver.unobserve(el);
        el.dataset.animated = 'true';
        const target = Number(el.dataset.target);
        if (!animated()) return;
        const start = performance.now();
        function tick(now) {
          const progress = animated() ? Math.min((now - start) / 1500, 1) : 1;
          paintScore(el, Math.round(target * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.7 });
    scores.forEach(el => scoreObserver.observe(el));
  }

  const nav = document.querySelector('nav');
  const progress = document.getElementById('progressFill');
  const topButton = document.getElementById('toTop');
  const sections = [...document.querySelectorAll('section[id]')];
  const links = [...document.querySelectorAll('.nav-links a')];
  // Sample the actual section beneath the glass, including its vertical gradient.
  // No screenshot, duplicated page, or animation loop is needed: scroll already uses rAF.
  const surfaceCache = new Map();
  const rgb = value => (value.match(/[\d.]+/g) || []).map(Number);
  const bodyColor = rgb(getComputedStyle(document.body).backgroundColor);
  function surfaceAt(x, y) {
    const underneath = document.elementsFromPoint(x, y).find(el =>
      !nav.contains(el) && !el.closest('.progress-bar,.cursor-glow,.to-top,.glass-filter-defs'));
    const section = underneath?.closest('section') || document.body;
    let model = surfaceCache.get(section);
    if (!model) {
      const style = getComputedStyle(section);
      const color = rgb(style.backgroundColor);
      const alpha = color[3] ?? 1;
      const base = bodyColor.slice(0, 3).map((v, i) => v * (1 - alpha) + color[i] * alpha);
      const stops = style.backgroundImage.startsWith('linear-gradient(rgb') ||
        style.backgroundImage.startsWith('linear-gradient(180deg')
        ? [...style.backgroundImage.matchAll(/(rgba?\([^)]+\))\s+([\d.]+)%/g)]
          .map(match => ({ color: rgb(match[1]), at: Number(match[2]) / 100 }))
        : [];
      model = { base, stops };
      surfaceCache.set(section, model);
    }
    if (model.stops.length < 2) return model.base;
    const bounds = section.getBoundingClientRect();
    const at = Math.max(0, Math.min(1, (y - bounds.top) / bounds.height));
    const next = model.stops.findIndex(stop => stop.at >= at);
    if (next <= 0) return model.stops[next === 0 ? 0 : model.stops.length - 1].color;
    const a = model.stops[next - 1], b = model.stops[next];
    const t = (at - a.at) / (b.at - a.at);
    return a.color.slice(0, 3).map((value, i) => value + (b.color[i] - value) * t);
  }
  function updateGlass(scroll) {
    const bounds = nav.getBoundingClientRect();
    let luminance = 0;
    for (const x of [.2, .5, .8]) for (const y of [.25, .75]) {
      const color = surfaceAt(innerWidth * x, bounds.top + bounds.height * y);
      const linear = color.slice(0, 3).map(value => {
        value /= 255;
        return value <= .04045 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4);
      });
      luminance += linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
    }
    luminance /= 6;
    // Hysteresis avoids flickering near the light/dark gradient boundary.
    const light = luminance > (nav.dataset.surface === 'light' ? .27 : .34);
    nav.dataset.surface = light ? 'light' : 'dark';
    nav.style.setProperty('--glass-shift', animated() ? `${50 + Math.sin(scroll / 480) * 48}%` : '50%');
    nav.style.setProperty('--glass-drift', animated() ? `${Math.sin(scroll / 360) * .65}px` : '0px');
  }
  let scrollPending = false;
  function updateScroll() {
    const scroll = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (height > 0 ? scroll / height * 100 : 0) + '%';
    nav.classList.toggle('scrolled', scroll > 40);
    topButton.classList.toggle('show', scroll > 600);
    let current = '';
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= 190) current = section.id;
    }
    links.forEach(link => {
      const active = link.hash === '#' + current;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    updateGlass(scroll);
    scrollPending = false;
  }
  function scheduleScroll() {
    if (!scrollPending) {
      scrollPending = true;
      requestAnimationFrame(updateScroll);
    }
  }
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', () => { surfaceCache.clear(); scheduleScroll(); }, { passive: true });
  reducedMotion.addEventListener('change', scheduleScroll);
  window.addEventListener('load', updateScroll);
  updateScroll();
  topButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: animated() ? 'smooth' : 'auto' });
  });

  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navLinks');
  function setMenu(open, returnFocus = false) {
    menu.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  links.forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('open')) setMenu(false, true);
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target)) setMenu(false);
  });
  nav.addEventListener('focusout', event => {
    if (!nav.contains(event.relatedTarget)) setMenu(false);
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', () => setMenu(false));

  // Fine-pointer interactions use one animation frame per paint.
  if (finePointer.matches) {
    const hero = document.querySelector('.hero');
    const circles = [...document.querySelectorAll('.floating-circle')];
    let heroFrame = 0;
    hero.addEventListener('pointermove', event => {
      if (!animated()) return;
      cancelAnimationFrame(heroFrame);
      heroFrame = requestAnimationFrame(() => {
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        circles.forEach((circle, i) => {
          circle.style.transform = `translate(${x * (i + 1) * 30}px, ${y * (i + 1) * 30}px)`;
        });
      });
    });
    document.querySelectorAll('.project-card').forEach(card => {
      let frame = 0;
      card.addEventListener('pointermove', event => {
        if (!animated()) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const box = card.getBoundingClientRect();
          const x = (event.clientX - box.left) / box.width - 0.5;
          const y = (event.clientY - box.top) / box.height - 0.5;
          card.style.transform = `perspective(1200px) rotateX(${-y * 5}deg) rotateY(${x * 6}deg) translateY(-4px)`;
        });
      });
      card.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame);
        card.style.transform = '';
      });
    });
    const cursor = document.createElement('div');
    cursor.className = 'cursor-glow';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.append(cursor);
    let cursorFrame = 0;
    document.addEventListener('pointermove', event => {
      if (!animated()) return;
      cancelAnimationFrame(cursorFrame);
      cursorFrame = requestAnimationFrame(() => {
        cursor.style.opacity = '1';
        cursor.style.left = event.clientX + 'px';
        cursor.style.top = event.clientY + 'px';
      });
    });
    document.documentElement.addEventListener('pointerleave', () => {
      cancelAnimationFrame(cursorFrame);
      cursor.style.opacity = '0';
    });
  }
})();
