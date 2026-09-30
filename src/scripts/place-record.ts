/** Shape of one entry in /places.json (short keys keep the file small). */
export interface PlaceRecord {
  /** name */
  n: string;
  /** alternate spelling */
  a?: string;
  /** latin transliteration */
  l: string;
  /** kind */
  k: 'town' | 'daba' | 'village';
  /** municipality short name */
  m: string;
  /** page url */
  u: string;
  /** [lat, lon] */
  g?: [number, number];
  /** coverage confirmed */
  c?: 1;
  /** office / base */
  b?: 1;
}

let cache: Promise<PlaceRecord[]> | null = null;

/** Loads /places.json once per page. */
export function loadPlaces(): Promise<PlaceRecord[]> {
  cache ??= fetch('/places.json')
    .then((r) => {
      if (!r.ok) throw new Error(`places.json ${r.status}`);
      return r.json() as Promise<PlaceRecord[]>;
    })
    .catch((err: unknown) => {
      cache = null;
      throw err;
    });
  return cache;
}

const TR: Record<string, string> = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i', კ: 'k', ლ: 'l', მ: 'm', ნ: 'n', ო: 'o',
  პ: 'p', ჟ: 'zh', რ: 'r', ს: 's', ტ: 't', უ: 'u', ფ: 'p', ქ: 'k', ღ: 'gh', ყ: 'q', შ: 'sh', ჩ: 'ch', ც: 'ts',
  ძ: 'dz', წ: 'ts', ჭ: 'ch', ხ: 'kh', ჯ: 'j', ჰ: 'h',
};

export const toLatin = (s: string): string => [...s].map((c) => TR[c] ?? c).join('');

/** Strips what people type around a place name: "ინტერნეტი ტონჩაში" → "ტონჩა". */
export const normalizeQuery = (s: string): string =>
  s
    .trim()
    .toLowerCase()
    .replace(/^ინტერნეტი\s+|^internet\s+/, '')
    .replace(/(ში|shi)$/, '');
