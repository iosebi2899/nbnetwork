// Live filter for the coverage hub. Items carry data-place="<name latin alt>".
const TR: Record<string, string> = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i', კ: 'k', ლ: 'l', მ: 'm', ნ: 'n', ო: 'o',
  პ: 'p', ჟ: 'zh', რ: 'r', ს: 's', ტ: 't', უ: 'u', ფ: 'p', ქ: 'k', ღ: 'gh', ყ: 'q', შ: 'sh', ჩ: 'ch', ც: 'ts',
  ძ: 'dz', წ: 'ts', ჭ: 'ch', ხ: 'kh', ჯ: 'j', ჰ: 'h',
};

// Drop common suffixes people type ("ტონჩაში", "dushetshi") so the base name still matches.
const normalize = (s: string): string =>
  s
    .trim()
    .toLowerCase()
    .replace(/^ინტერნეტი\s+|^internet\s+/, '')
    .replace(/(ში|shi)$/, '');

export function initFilter(): void {
  const form = document.querySelector<HTMLFormElement>('[data-place-search]');
  const input = form?.querySelector<HTMLInputElement>('input');
  if (!form || !input) return;

  const items = [...document.querySelectorAll<HTMLElement>('[data-place]')];
  const groups = [...document.querySelectorAll<HTMLElement>('[data-group]')];
  const empty = document.querySelector<HTMLElement>('[data-empty]');
  const count = document.querySelector<HTMLElement>('[data-count]');

  const apply = (): void => {
    const q = normalize(input.value);
    const latin = [...q].map((c) => TR[c] ?? c).join('');
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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const first = items.find((el) => !el.hidden)?.querySelector('a');
    if (first && items.filter((el) => !el.hidden).length === 1) first.click();
  });
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
