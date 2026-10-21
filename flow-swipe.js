(() => {
  document.querySelectorAll('[data-flow-carousel]').forEach(carousel => {
    const track = carousel.querySelector('[data-flow-track]');
    const slides = Array.from(track.children);
    const prev = carousel.querySelector('[data-flow-prev]');
    const next = carousel.querySelector('[data-flow-next]');
    const dots = Array.from(carousel.querySelectorAll('[data-flow-dot]'));
    let index = 0;
    let frame = 0;
    const paint = () => {
      prev.disabled = index === 0;
      next.disabled = index === slides.length - 1;
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    };
    const go = target => {
      index = Math.max(0, Math.min(slides.length - 1, target));
      track.scrollTo({left: slides[index].offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
      paint();
    };
    prev.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => go(i)));
    track.addEventListener('keydown', event => {
      const targets = {ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: slides.length - 1};
      if (!(event.key in targets)) return;
      event.preventDefault();
      go(targets[event.key]);
    });
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!track.clientWidth) return;
        index = slides.reduce((best, slide, i) => Math.abs(slide.offsetLeft - track.scrollLeft) < Math.abs(slides[best].offsetLeft - track.scrollLeft) ? i : best, 0);
        paint();
      });
    }, {passive: true});
    new ResizeObserver(() => {
      if (track.clientWidth) track.scrollTo({left: slides[index].offsetLeft, behavior: 'instant'});
    }).observe(track);
    if (carousel.hasAttribute('data-autoplay')) {
      const toggle = carousel.querySelector('[data-autoplay-toggle]');
      let visible = false;
      let paused = false;
      let timer;
      const schedule = () => {
        clearTimeout(timer);
        if (!visible || paused || document.hidden) return;
        timer = setTimeout(() => {
          go((index + 1) % slides.length);
          schedule();
        }, Number(carousel.dataset.autoplay));
      };
      toggle.addEventListener('click', () => {
        paused = !paused;
        toggle.textContent = paused ? '▷ 自動再生' : 'Ⅱ 一時停止';
        toggle.setAttribute('aria-pressed', String(paused));
        toggle.setAttribute('aria-label', paused ? '自動スクロールを再開' : '自動スクロールを一時停止');
        schedule();
      });
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        schedule();
      }, {threshold: 0.2}).observe(track);
      document.addEventListener('visibilitychange', schedule);
      track.addEventListener('pointerdown', () => clearTimeout(timer));
      track.addEventListener('pointerup', schedule);
      track.addEventListener('pointercancel', schedule);
      carousel.addEventListener('keydown', schedule);
      dots.forEach(dot => dot.addEventListener('click', schedule));
      prev.addEventListener('click', schedule);
      next.addEventListener('click', schedule);
    }
    paint();
  });
})();
