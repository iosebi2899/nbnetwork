import type { APIRoute } from 'astro';
import { BASE, PLACES, isConfirmed, municipality, placeUrl } from '../data/places';
import type { PlaceRecord } from '../scripts/place-record';

// Compact place index shared by the coverage map and search autocomplete.
// Fetched lazily on the client, so it never weighs on the initial page load.
export const GET: APIRoute = () => {
  const records: PlaceRecord[] = PLACES.map((p) => ({
    n: p.name,
    ...(p.alt ? { a: p.alt } : {}),
    l: p.latin,
    k: p.kind,
    m: municipality(p.municipality).short,
    u: placeUrl(p),
    ...(p.geo ? { g: p.geo } : {}),
    ...(isConfirmed(p) ? { c: 1 as const } : {}),
    ...(p === BASE ? { b: 1 as const } : {}),
  }));
  return new Response(JSON.stringify(records), { headers: { 'Content-Type': 'application/json' } });
};
