// Mounts coverage maps lazily: Leaflet and the place data load only when a map
// is about to scroll into view, so pages stay fast for visitors who never reach it.
export function initCoverageMaps(): void {
  const maps = document.querySelectorAll<HTMLElement>('[data-coverage-map]');
  if (!maps.length) return;

  const mount = (el: HTMLElement): void => {
    if (el.dataset['mounted']) return;
    el.dataset['mounted'] = '1';
    import('./map-impl')
      .then((m) => m.mountMap(el))
      .catch(() => {
        const ph = el.querySelector<HTMLElement>('[data-map-placeholder]');
        if (ph) ph.textContent = 'რუკის ჩატვირთვა ვერ მოხერხდა.';
      });
  };

  if (!('IntersectionObserver' in window)) {
    maps.forEach(mount);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        mount(e.target as HTMLElement);
      }
    },
    { rootMargin: '300px 0px' },
  );
  maps.forEach((el) => io.observe(el));
}
