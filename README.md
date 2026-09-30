# nbnetworks.ge

Landing page for NB Networks, an internet provider in the Dusheti / Mtskheta-Mtianeti region. Built with **Astro + TypeScript** and output as a fully static site.

## Commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Type-check (`astro check`) and build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run og` | Regenerate `public/og.png` (social share image) |

## Structure

- `src/data/site.ts`: all content (phone, email, packages, services, nav). Edit this file to change prices or text.
- `src/layouts/Base.astro`: `<head>`, SEO meta, Open Graph, JSON-LD (`LocalBusiness` + offer catalog)
- `src/components/*.astro`: page sections
- `src/scripts/header.ts`: mobile menu and scroll-spy. This is the only client JS, under 1 KB.
- `public/`: favicon, robots.txt, og.png

## Performance notes

- No framework runtime is shipped. CSS and the small script are inlined into `index.html` (about 10 KB gzipped).
- Fonts are self-hosted variable woff2 files, split by `unicode-range`. The Georgian subset is preloaded.
- Sitemap is generated at build time (`@astrojs/sitemap`).

## Local SEO: village pages

Every settlement in Mtskheta-Mtianeti gets its own page: `/internet/<municipality>/<village>/`, for example `/internet/dusheti/toncha/`, "ინტერნეტი ტონჩაში". That is 418 settlements across Dusheti, Mtskheta, Tianeti and Kazbegi, plus 4 municipality pages and the `/internet/` hub with live search.

- **Data:** `src/data/villages.json` is generated from Georgian Wikipedia and Wikidata (names, communities, coordinates). Refresh it with `npm run villages`. Only needed if the list changes.
- **Coverage:** edit `CONFIRMED` in `src/data/places.ts`. Confirmed places show "დაფარვის ზონაში" (in the coverage zone). All others use "call to check" wording, so no page claims coverage that doesn't exist.
- **Unique content per page:** each page carries its community, municipality, straight-line distance from the Chopórti base, a Google Maps link, the 10 nearest villages with distances, a Latin-script name and village-specific FAQ.
- **Structured data (JSON-LD):** LocalBusiness, WebSite with SearchAction, BreadcrumbList, Service with areaServed and geo, and FAQPage.

### Coverage map and search autocomplete

- `/places.json` is a compact index of every place, generated at build time from `src/pages/places.json.ts`. The map and the search autocomplete both use it, and it is fetched only on search focus or when a map scrolls near.
- The map (`CoverageMap.astro`) uses Leaflet with OpenStreetMap tiles. The Leaflet JS (about 44 KB gzipped) and CSS load only when a map is about to enter the viewport. It appears on the home coverage section, on `/internet/`, and on every village page (centered on that village). Wheel zoom and one-finger drag on phones stay off until the visitor taps or clicks the map, so the page scroll isn't hijacked.
- OSM's public tiles are fine for a small local site, but under OSM's tile usage policy they are not meant for heavy traffic. If traffic grows, switch the `tileLayer` URL in `src/scripts/map-impl.ts` to a provider such as MapTiler or Stadia (both have free tiers).

### After deploying (required for location-based results)

1. **Google Business Profile** (business.google.com). This is what makes Google show the business for "ინტერნეტი" or "internet provider near me" in Maps and the local pack. Create a service-area business with category *Internet service provider*, add the service areas (Dusheti, Mtskheta, Tianeti, Kazbegi municipalities), set the website to `https://nbnetworks.ge/`, and use the same phone number. Ask customers for reviews.
2. **Google Search Console:** verify the domain and submit `https://nbnetworks.ge/sitemap-index.xml`.
3. **Bing Webmaster Tools:** import from Search Console.
4. Link the site from the Facebook page (`ispnbnet`) and ask PayNet to link `nbnetworks.ge` from their contact page.

## Deploy

`dist/` is plain static files. Host it on Cloudflare Pages, Netlify, Vercel or any static host. Build command: `npm run build`; output directory: `dist`.
