// Live filter for the coverage hub. Items carry data-place="<name latin alt>".
import { normalizeQuery, toLatin } from './place-record';

export function initFilter(): void {
  const form = document.querySelector<HTMLFormElement>('[data-place-search]');
  const input = form?.querySelector<HTMLInputElement>('input');
  if (!form || !input) return;

  const items = [...document.querySelectorAll<HTMLElement>('[data-place]')];
  const groups = [...document.querySelectorAll<HTMLElement>('[data-group]')];
  const empty = document.querySelector<HTMLElement>('[data-empty]');
  const count = document.querySelector<HTMLElement>('[data-count]');

  const apply = (): void => {
    const q = normalizeQuery(input.value);
    const latin = toLatin(q);
    let shown = 0;
    for (const el of items) {
      const key = el.dataset['place'] ?? '';
      const hit = !q || key.includes(q) || key.includes(latin);
      el.hidden = !hit;
      if (hit) shown++;
    }
    for (const g of groups) g.hidden = !g.querySelector('[data-place]:not([hidden])');
    if (empty) empty.hidden = shown > 0;
    if (count) count.textContent = String(shown);
  };

  // With no autocomplete match the hub stays put and just shows the filtered list.
  form.addEventListener('submit', (e) => e.preventDefault());
  input.addEventListener('input', () => {
    apply();
    const url = new URL(location.href);
    if (input.value) url.searchParams.set('q', input.value);
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
  });

  const initial = new URLSearchParams(location.search).get('q');
  if (initial) input.value = initial;
  apply();
}
