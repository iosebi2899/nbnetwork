import raw from './villages.json';

export type MunicipalityKey = 'dusheti' | 'tianeti' | 'mtskheta' | 'kazbegi';

export interface Place {
  slug: string;
  name: string;
  latin: string;
  kind: 'town' | 'daba' | 'village';
  municipality: MunicipalityKey;
  community: string | null;
  geo: [number, number] | null;
  alt?: string;
}

export interface Municipality {
  key: MunicipalityKey;
  /** დუშეთის მუნიციპალიტეტი */
  full: string;
  /** დუშეთის მუნიციპალიტეტში */
  loc: string;
  /** დუშეთი */
  short: string;
  /** Dusheti */
  latin: string;
}

export const MUNICIPALITIES: readonly Municipality[] = [
  { key: 'dusheti', full: 'დუშეთის მუნიციპალიტეტი', loc: 'დუშეთის მუნიციპალიტეტში', short: 'დუშეთი', latin: 'Dusheti' },
  { key: 'mtskheta', full: 'მცხეთის მუნიციპალიტეტი', loc: 'მცხეთის მუნიციპალიტეტში', short: 'მცხეთა', latin: 'Mtskheta' },
  { key: 'tianeti', full: 'თიანეთის მუნიციპალიტეტი', loc: 'თიანეთის მუნიციპალიტეტში', short: 'თიანეთი', latin: 'Tianeti' },
  { key: 'kazbegi', full: 'ყაზბეგის მუნიციპალიტეტი', loc: 'ყაზბეგის მუნიციპალიტეტში', short: 'ყაზბეგი', latin: 'Kazbegi' },
];

export const REGION = { name: 'მცხეთა-მთიანეთი', loc: 'მცხეთა-მთიანეთში', latin: 'Mtskheta-Mtianeti' } as const;

/** Office location (ჭოპორტი) — used for distance hints. */
export const BASE_SLUG = 'choporti';

/**
 * Settlements where service is confirmed. Everything else gets "call to check" wording
 * instead of a coverage claim. Add slugs (or whole communities) as coverage is confirmed.
 */
export const CONFIRMED = {
  slugs: new Set<string>(['dusheti', 'toncha']),
  communities: new Set<string>(['ჭოპორტის თემი']),
};

export const PLACES = raw as Place[];

export const municipality = (key: MunicipalityKey): Municipality =>
  MUNICIPALITIES.find((m) => m.key === key)!;

export const placesIn = (key: MunicipalityKey): Place[] =>
  PLACES.filter((p) => p.municipality === key).sort(byName);

export const placeUrl = (p: Place): string => `/internet/${p.municipality}/${p.slug}/`;
export const municipalityUrl = (key: MunicipalityKey): string => `/internet/${key}/`;

export const isConfirmed = (p: Place): boolean =>
  CONFIRMED.slugs.has(p.slug) || (p.community !== null && CONFIRMED.communities.has(p.community));

const collator = new Intl.Collator('ka');
export const byName = (a: Place, b: Place): number => collator.compare(a.name, b.name);

/**
 * Locative case: დუშეთი → დუშეთში, ტონჩა → ტონჩაში, ახალი ტონჩა → ახალ ტონჩაში.
 * Leading adjectives ending in -ი lose it (ახალი, ძველი, წითელი).
 */
export function locative(name: string): string {
  const words = name.split(' ');
  const last = words.pop()!;
  const head = words.map((w) => (w.endsWith('ი') ? w.slice(0, -1) : w));
  const tail = last.endsWith('ი') ? `${last.slice(0, -1)}ში` : `${last}ში`;
  return [...head, tail].join(' ');
}

/** Capitalized Latin name for display: "akhali toncha" → "Akhali Toncha". */
export const latinTitle = (p: Place): string => p.latin.replace(/(^|\s)\S/g, (c) => c.toUpperCase());

const toRad = (d: number): number => (d * Math.PI) / 180;

export function distanceKm(a: [number, number], b: [number, number]): number {
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export const BASE = PLACES.find((p) => p.slug === BASE_SLUG && p.municipality === 'dusheti')!;

export function nearest(p: Place, count: number): Place[] {
  const origin = p.geo;
  if (!origin) {
    return PLACES.filter((o) => o !== p && o.municipality === p.municipality && o.community === p.community).slice(0, count);
  }
  return PLACES.filter((o) => o !== p && o.geo)
    .map((o) => ({ o, d: distanceKm(origin, o.geo!) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((x) => x.o);
}

/** Group a municipality's places by community (Dusheti) — others return a single group. */
export function groupByCommunity(list: Place[]): { title: string | null; places: Place[] }[] {
  const groups = new Map<string | null, Place[]>();
  for (const p of list) {
    const key = p.kind === 'village' ? p.community : null;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === null ? -1 : b === null ? 1 : collator.compare(a, b)))
    .map(([title, places]) => ({ title, places }));
}

/** Villages people search for most — shown on the home page. */
export const FEATURED_SLUGS = [
  'choporti', 'dusheti', 'toncha', 'zhinvali', 'pasanauri', 'ananuri', 'bazaleti', 'mchadijvari',
  'magharoskari', 'kvesheti', 'lapanaantkari', 'chartali', 'mtskheta', 'tianeti', 'stepantsminda', 'gudauri',
] as const;

export const featured = (): Place[] =>
  FEATURED_SLUGS.map((s) => PLACES.find((p) => p.slug === s)).filter((p): p is Place => Boolean(p));
