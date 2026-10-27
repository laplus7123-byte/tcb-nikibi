(() => {
  'use strict';
  document.querySelectorAll('[data-concern-carousel]').forEach((carousel) => {
    if (carousel.dataset.carouselReady) return;
    carousel.dataset.carouselReady = 'true';
    const viewport = carousel.querySelector('[data-carousel-viewport]');
    const track = carousel.querySelector('[data-carousel-track]');
    const original = carousel.querySelector('[data-carousel-original]');
    const toggle = carousel.querySelector('[data-carousel-toggle]');
    const toggleText = carousel.querySelector('[data-carousel-toggle-text]');
    const toggleIcon = carousel.querySelector('[data-carousel-toggle-icon]');
    if (!viewport || !track || !original) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const clone = () => {
      const group = original.cloneNode(true);
      group.removeAttribute('data-carousel-original');
      group.setAttribute('data-carousel-clone', '');
      group.setAttribute('aria-hidden', 'true');
      // Visible duplicate links remain clickable without creating extra tab stops.
      group.querySelectorAll('a,button,input,select,textarea,summary,[contenteditable],[tabindex],[role="button"]').forEach((element) => element.setAttribute('tabindex', '-1'));
      group.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      return group;
    };
    track.prepend(clone());
    track.append(clone());
    let userPaused = motion.matches;
    let hovered = false;
    let focused = false;
    let touching = false;
    let dragging = false;
    let pointerId = null;
    let lastX = 0;
    let resumeAt = 0;
    let span = 0;
    let position = 0;
    let visible = true;
    let lastTime = 0;
    let frame = 0;
    const speed = 54;

    const updateToggle = () => {
      toggle?.setAttribute('aria-pressed', String(userPaused));
      if (toggleText) toggleText.textContent = userPaused ? '自動スクロールを再開' : '自動スクロールを停止';
      if (toggleIcon) toggleIcon.textContent = userPaused ? '▶' : 'Ⅱ';
      carousel.dataset.autoplay = userPaused ? 'paused' : 'enabled';
    };
    const normalize = () => {
      if (!span) return;
      let x = viewport.scrollLeft;
      if (x < span) x += span;
      else if (x >= span * 2) x -= span;
      if (Math.abs(x - viewport.scrollLeft) > 1) viewport.scrollLeft = x;
      position = x;
    };
    const measure = () => {
      const nextSpan = original.getBoundingClientRect().width;
      if (!nextSpan) return;
      const offset = span ? ((viewport.scrollLeft - span) % span + span) % span : 0;
      const ratio = span ? offset / span : 0;
      span = nextSpan;
      viewport.scrollLeft = span + ratio * span;
      position = viewport.scrollLeft;
    };
    const hold = () => { resumeAt = performance.now() + 4000; };
    const canRun = (now) => visible && !viewport.querySelector('details[open]') && !document.hidden && !userPaused && !hovered && !focused && !touching && now >= resumeAt && span > 0;
    const tick = (now) => {
      const elapsed = lastTime ? Math.min(now - lastTime, 40) : 0;
      lastTime = now;
      if (canRun(now)) {
        position += speed * elapsed / 1000;
        if (position >= span * 2) position -= span;
        viewport.scrollLeft = position;
      } else if (!touching) {
        normalize();
      }
      frame = requestAnimationFrame(tick);
    };
    toggle?.addEventListener('click', () => {
      userPaused = !userPaused;
      if (!userPaused) { resumeAt = 0; position = viewport.scrollLeft; }
      updateToggle();
    });
    viewport.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') hovered = true;
    });
    viewport.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse') hovered = false;
    });
    viewport.addEventListener('focusin', () => { focused = true; });
    viewport.addEventListener('focusout', (event) => {
      if (!viewport.contains(event.relatedTarget)) focused = false;
    });
    viewport.addEventListener('pointerdown', (event) => {
      touching = true;
      hold();
      // Let links and controls keep their native click/focus behavior.
      if (event.target instanceof Element && event.target.closest('a,button,input,select,textarea,summary,[contenteditable="true"],[role="button"]')) return;
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      dragging = true;
      pointerId = event.pointerId;
      lastX = event.clientX;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    viewport.addEventListener('pointermove', (event) => {
      if (!dragging || event.pointerId !== pointerId) return;
      viewport.scrollLeft += lastX - event.clientX;
      lastX = event.clientX;
      normalize();
    });
    const endPointer = () => {
      if (!touching) return;
      touching = false;
      dragging = false;
      pointerId = null;
      viewport.classList.remove('is-dragging');
      normalize();
      hold();
    };
    window.addEventListener('pointerup', endPointer, {passive:true});
    window.addEventListener('pointercancel', endPointer, {passive:true});
    viewport.addEventListener('lostpointercapture', endPointer);
    viewport.addEventListener('dragstart', (event) => event.preventDefault());
    viewport.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaX) < 1 && !event.shiftKey) return;
      hold();
      viewport.scrollLeft += event.deltaX || event.deltaY;
      normalize();
      event.preventDefault();
    }, {passive:false});
    const step = (direction) => {
      hold();
      const card = original.firstElementChild;
      const gap = parseFloat(getComputedStyle(original).columnGap) || 14;
      viewport.scrollLeft += direction * (card.getBoundingClientRect().width + gap);
      normalize();
    };
    carousel.querySelectorAll('[data-carousel-step]').forEach((button) => {
      button.addEventListener('click', () => step(Number(button.dataset.carouselStep)));
    });
    viewport.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      step(event.key === 'ArrowRight' ? 1 : -1);
      event.preventDefault();
    });
    viewport.addEventListener('scroll', () => {
      if (touching || performance.now() < resumeAt || focused || hovered || userPaused) position = viewport.scrollLeft;
    }, {passive:true});
    motion.addEventListener('change', (event) => {
      if (event.matches) { userPaused = true; updateToggle(); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible && !span) measure();
        lastTime = 0;
      }, {rootMargin:'100px'}).observe(viewport);
    }
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(original);
    else window.addEventListener('resize', measure, {passive:true});
    document.addEventListener('visibilitychange', () => { lastTime = 0; });
    window.addEventListener('pagehide', () => cancelAnimationFrame(frame), {once:true});
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) { lastTime = 0; frame = requestAnimationFrame(tick); }
    });
    measure();
    updateToggle();
    frame = requestAnimationFrame(tick);
  });
})();
