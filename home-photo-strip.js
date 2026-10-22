(() => {
  'use strict';
  const strip = document.querySelector('.home-photo-strip');
  const track = strip?.querySelector('.home-photo-track');
  if (!track) return;
  const previous = strip.querySelector('[data-home-photo-step="-1"]');
  const next = strip.querySelector('[data-home-photo-step="1"]');
  const items = Array.from(track.querySelectorAll('.home-photo-item'));
  if (!previous || !next || !items.length) return;

  function updateControls() {
    const end = Math.max(0, track.scrollWidth - track.clientWidth);
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= end - 2;
  }

  function move(direction) {
    const trackLeft = track.getBoundingClientRect().left;
    const positions = items.map(item => item.getBoundingClientRect().left - trackLeft + track.scrollLeft);
    const current = track.scrollLeft;
    const candidates = direction > 0 ? positions : positions.slice().reverse();
    const target = candidates.find(left => direction > 0 ? left > current + 5 : left < current - 5);
    const end = Math.max(0, track.scrollWidth - track.clientWidth);
    track.scrollTo({
      left: Math.max(0, Math.min(target ?? (direction > 0 ? end : 0), end)),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  }

  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  let frame = 0;
  track.addEventListener('scroll', () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; updateControls(); });
  }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(updateControls).observe(track);
  else window.addEventListener('resize', updateControls, { passive: true });
  updateControls();
})();
