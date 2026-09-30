import L from 'leaflet';
// Imported as a URL (not a side-effect import) so Astro doesn't inline it into every page.
import leafletCss from 'leaflet/dist/leaflet.css?url';
import { loadPlaces, type PlaceRecord } from './place-record';

let cssReady: Promise<void> | null = null;
const loadCss = (): Promise<void> =>
  (cssReady ??= new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = leafletCss;
    link.onload = link.onerror = () => resolve();
    document.head.append(link);
  }));

const COLORS = {
  ok: '#b026c9',
  check: '#8a90b0',
  base: '#141a3a',
  basering: '#e58cf5',
  focus: '#e58cf5',
};
const KIND: Record<PlaceRecord['k'], string> = { town: 'ქალაქი', daba: 'დაბა', village: 'სოფელი' };

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const popup = (p: PlaceRecord, status: string): string =>
  `<div class="map-pop"><strong>${esc(p.n)}</strong>` +
  `<span class="muted">${KIND[p.k]} · ${esc(p.m)} · ${status}</span><br>` +
  `<a href="${esc(p.u)}">დეტალურად →</a></div>`;

export async function mountMap(root: HTMLElement): Promise<void> {
  const canvas = root.querySelector<HTMLElement>('[data-map-canvas]');
  if (!canvas) return;
  const focus = root.dataset['focus'] ? (JSON.parse(root.dataset['focus']) as { g: [number, number]; u: string }) : null;

  const [all] = await Promise.all([loadPlaces(), loadCss()]);
  const places = all.filter((p): p is PlaceRecord & { g: [number, number] } => Boolean(p.g));
  root.querySelector('[data-map-placeholder]')?.remove();

  const touch = window.matchMedia('(pointer: coarse)').matches;
  const map = L.map(canvas, {
    preferCanvas: true,
    scrollWheelZoom: false, // don't hijack page scrolling
    dragging: !touch, // on phones, one-finger drag keeps scrolling the page until the map is tapped
    zoomSnap: 0.5,
    attributionControl: true,
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const renderer = L.canvas({ padding: 0.5 });
  const bounds = L.latLngBounds([]);

  // Draw unconfirmed first so confirmed/base markers sit on top.
  const ordered = [...places].sort((a, b) => (a.c ?? 0) + (a.b ?? 0) * 2 - ((b.c ?? 0) + (b.b ?? 0) * 2));
  for (const p of ordered) {
    const isFocus = focus?.u === p.u;
    const isBase = Boolean(p.b);
    const confirmed = Boolean(p.c);
    const marker = L.circleMarker(p.g, {
      renderer,
      radius: isBase ? 9 : isFocus ? 10 : confirmed ? 7 : p.k === 'village' ? 5 : 6,
      color: isBase ? COLORS.basering : isFocus ? COLORS.ok : '#ffffff',
      weight: isBase || isFocus ? 3 : 1.5,
      fillColor: isBase ? COLORS.base : isFocus ? COLORS.focus : confirmed ? COLORS.ok : COLORS.check,
      fillOpacity: confirmed || isBase || isFocus ? 0.95 : 0.8,
    })
      .bindTooltip(isBase ? `${p.n} — NB Networks` : p.n, { direction: 'top', offset: [0, -6] })
      .bindPopup(popup(p, isBase ? 'ჩვენი ბაზა' : confirmed ? 'დაფარვის ზონაში' : 'გადაამოწმეთ დაფარვა'))
      .addTo(map);
    if (isFocus) marker.bringToFront();
    bounds.extend(p.g);
  }

  if (focus) map.setView(focus.g, 12);
  else map.fitBounds(bounds, { padding: [24, 24] });

  // Enable wheel zoom / touch drag only once the visitor interacts with the map.
  const hint = root.querySelector<HTMLElement>('[data-map-hint]');
  if (touch && hint) hint.hidden = false;
  const activate = (): void => {
    map.scrollWheelZoom.enable();
    map.dragging.enable();
    if (hint) hint.hidden = true;
  };
  map.on('click focus', activate);
  canvas.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());
}
