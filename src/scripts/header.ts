const NARROW_QUERY = '(max-width: 819px)';
const SPY_OFFSET = 120;

export function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.getElementById('mobile-menu');
  const spyLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-nav]')];

  const setMenu = (open: boolean): void => {
    if (!toggle || !menu) return;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  window.matchMedia(NARROW_QUERY).addEventListener('change', (e) => {
    if (!e.matches) setMenu(false);
  });

  // --- Scroll-spy -------------------------------------------------------------
  // Sections are resolved in DOM order, so nav order (სერვისი before პაკეტები)
  // doesn't matter: the active one is the last section whose top has passed the offset.
  const sections = spyLinks
    .map((a) => document.getElementById(a.dataset['nav'] ?? ''))
    .filter((el): el is HTMLElement => el !== null)
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

  let active = '';
  let animating = false;

  const setActive = (id: string): void => {
    if (id === active) return;
    active = id;
    for (const a of spyLinks) {
      if (a.dataset['nav'] === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };

  const spy = (): void => {
    if (!sections.length || animating) return;
    let cur = '';
    for (const el of sections) if (el.getBoundingClientRect().top <= SPY_OFFSET) cur = el.id;
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) cur = sections[sections.length - 1]!.id;
    setActive(cur);
  };

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        spy();
      });
    },
    { passive: true },
  );

  // --- Smooth in-page navigation -------------------------------------------------
  const headerHeight = (): number => header?.getBoundingClientRect().height ?? 0;

  const targetTop = (id: string): number => {
    const target = id === 'top' ? null : document.getElementById(id);
    const top = target ? target.getBoundingClientRect().top + window.scrollY - headerHeight() : 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.round(Math.min(Math.max(0, top), max));
  };

  // Own easing animation instead of native smooth scroll: browsers skip native smooth
  // scrolling when the OS "reduce motion" / "animation effects off" setting is enabled.
  let anim = 0;
  let fallback = 0;
  const cancelAnim = (): void => {
    clearTimeout(fallback);
    if (!anim) return;
    cancelAnimationFrame(anim);
    anim = 0;
    animating = false;
  };
  const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  const scrollToId = (id: string, smooth: boolean): void => {
    cancelAnim();
    const to = targetTop(id);
    const from = window.scrollY;
    const dist = to - from;
    if (!smooth || document.hidden || Math.abs(dist) < 2) {
      window.scrollTo({ top: to, behavior: 'instant' });
      animating = false;
      spy();
      return;
    }
    const duration = Math.min(900, Math.max(350, Math.abs(dist) * 0.35));
    const start = performance.now();
    animating = true;
    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / duration);
      window.scrollTo({ top: from + dist * easeInOutCubic(t), behavior: 'instant' });
      if (t < 1) {
        anim = requestAnimationFrame(step);
      } else {
        clearTimeout(fallback);
        anim = 0;
        animating = false;
        spy();
      }
    };
    anim = requestAnimationFrame(step);
    // If frames are throttled (background tab), still end up at the target.
    fallback = window.setTimeout(() => {
      if (!anim) return;
      cancelAnim();
      window.scrollTo({ top: to, behavior: 'instant' });
      spy();
    }, duration + 250);
  };

  // Let the user take over mid-animation.
  for (const ev of ['wheel', 'touchstart', 'keydown'] as const) {
    window.addEventListener(ev, cancelAnim, { passive: true });
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const id = decodeURIComponent(url.hash.slice(1));
    if (id !== 'top' && !document.getElementById(id)) return;

    e.preventDefault();
    // Close the mobile menu first so the header height is final before measuring.
    setMenu(false);
    // Highlight the destination right away; the spy is paused while the animation runs.
    if (spyLinks.some((l) => l.dataset['nav'] === id)) setActive(id);
    else if (id === 'top') setActive('');
    // Measuring in scrollToId forces layout, so the closed menu is already accounted for.
    scrollToId(id, true);
    history.pushState(null, '', id === 'top' ? url.pathname : `#${id}`);
  });

  // Arriving from another page with a hash (e.g. /#education): align under the sticky header.
  if (location.hash.length > 1) {
    const id = decodeURIComponent(location.hash.slice(1));
    if (document.getElementById(id)) {
      void document.fonts.ready.then(() => scrollToId(id, false));
    }
  }

  spy();
}
