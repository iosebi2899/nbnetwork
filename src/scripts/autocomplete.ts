import { loadPlaces, normalizeQuery, toLatin, type PlaceRecord } from './place-record';

const MAX_RESULTS = 8;
const KIND_LABEL: Record<PlaceRecord['k'], string> = { town: 'ქალაქი', daba: 'დაბა', village: 'სოფელი' };
const KIND_ORDER: Record<PlaceRecord['k'], number> = { town: 0, daba: 1, village: 2 };
const collator = new Intl.Collator('ka');

/** Lower score = better match; null = no match. */
function score(p: PlaceRecord, q: string, qLatin: string): number | null {
  const names = [p.n, p.a].filter((s): s is string => Boolean(s)).map((s) => s.toLowerCase());
  if (names.some((n) => n === q)) return 0;
  if (names.some((n) => n.startsWith(q))) return 1;
  if (names.some((n) => n.split(' ').some((w) => w.startsWith(q)))) return 2;
  if (qLatin && p.l.startsWith(qLatin)) return 3;
  if (names.some((n) => n.includes(q)) || (qLatin && p.l.includes(qLatin))) return 4;
  return null;
}

export function search(places: PlaceRecord[], raw: string): PlaceRecord[] {
  const q = normalizeQuery(raw);
  if (!q) return [];
  const qLatin = toLatin(q);
  return places
    .map((p) => ({ p, s: score(p, q, qLatin) }))
    .filter((x): x is { p: PlaceRecord; s: number } => x.s !== null)
    .sort((a, b) => a.s - b.s || KIND_ORDER[a.p.k] - KIND_ORDER[b.p.k] || (b.p.c ?? 0) - (a.p.c ?? 0) || collator.compare(a.p.n, b.p.n))
    .slice(0, MAX_RESULTS)
    .map((x) => x.p);
}

let uid = 0;

function attach(form: HTMLFormElement): void {
  const input = form.querySelector<HTMLInputElement>('input[name="q"]');
  const list = form.querySelector<HTMLUListElement>('[data-ac-list]');
  if (!input || !list) return;

  const listId = `ac-list-${++uid}`;
  list.id = listId;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', listId);
  input.setAttribute('aria-expanded', 'false');

  let places: PlaceRecord[] = [];
  let results: PlaceRecord[] = [];
  let active = -1;

  const ensureData = (): void => {
    if (places.length) return;
    loadPlaces()
      .then((data) => {
        places = data;
        if (document.activeElement === input && input.value) render();
      })
      .catch(() => {
        /* offline or blocked: the form still submits to /internet/?q= */
      });
  };

  const close = (): void => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  };

  const setActive = (i: number): void => {
    active = i;
    [...list.children].forEach((li, idx) => li.setAttribute('aria-selected', String(idx === i)));
    if (i >= 0) {
      input.setAttribute('aria-activedescendant', `${listId}-${i}`);
      list.children[i]?.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  };

  const render = (): void => {
    results = search(places, input.value);
    list.replaceChildren();
    if (!normalizeQuery(input.value) || !places.length) return close();

    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'ac-empty';
      li.textContent = 'ვერ მოიძებნა — დაგვირეკეთ და გადავამოწმებთ თქვენს მისამართს';
      list.append(li);
    }
    results.forEach((p, i) => {
      const li = document.createElement('li');
      li.id = `${listId}-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.dataset['index'] = String(i);

      const name = document.createElement('span');
      name.className = 'ac-name';
      name.textContent = p.n;
      const meta = document.createElement('span');
      meta.className = 'ac-meta';
      meta.textContent = `${KIND_LABEL[p.k]} · ${p.m}`;
      li.append(name, meta);
      if (p.c) {
        const ok = document.createElement('span');
        ok.className = 'ac-ok';
        ok.textContent = 'დაფარულია';
        li.append(ok);
      }
      list.append(li);
    });
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    setActive(results.length ? 0 : -1);
  };

  const go = (p: PlaceRecord | undefined): void => {
    if (!p) return;
    close();
    location.href = p.u;
  };

  input.addEventListener('focus', () => {
    ensureData();
    if (input.value) render();
  });
  input.addEventListener('input', () => {
    ensureData();
    render();
  });
  input.addEventListener('keydown', (e) => {
    if (list.hidden) {
      if (e.key === 'ArrowDown' && input.value) render();
      return;
    }
    if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault();
      setActive((active + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault();
      setActive((active - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results.length) {
      e.preventDefault();
      go(results[Math.max(active, 0)]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });
  input.addEventListener('blur', () => setTimeout(close, 120));

  // mousedown (not click) so the input doesn't blur and close the list first.
  list.addEventListener('mousedown', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLLIElement>('[role="option"]');
    if (!li) return;
    e.preventDefault();
    go(results[Number(li.dataset['index'])]);
  });
  list.addEventListener('mousemove', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLLIElement>('[role="option"]');
    if (li) setActive(Number(li.dataset['index']));
  });

  // Submitting with a known match goes straight to that place's page.
  form.addEventListener('submit', (e) => {
    const best = search(places, input.value)[0];
    if (best) {
      e.preventDefault();
      go(best);
    }
  });
}

export function initAutocomplete(): void {
  document.querySelectorAll<HTMLFormElement>('form[data-autocomplete]').forEach(attach);
}
