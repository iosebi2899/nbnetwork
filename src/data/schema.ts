import { SITE, PACKAGES, faqAnswerText, type FaqItem } from './site';
import { BASE, MUNICIPALITIES, REGION, locative, municipality, type Place } from './places';

type Node = Record<string, unknown>;

export const BUSINESS_ID = `${SITE.url}/#business`;
const abs = (path: string): string => new URL(path, SITE.url).href;

const offers = (): Node[] =>
  PACKAGES.map((p) => ({
    '@type': 'Offer',
    name: `${p.speed} Mbps ინტერნეტი`,
    price: p.price,
    priceCurrency: 'GEL',
    priceSpecification: { '@type': 'UnitPriceSpecification', price: p.price, priceCurrency: 'GEL', unitCode: 'MON' },
  }));

export function business(): Node {
  return {
    '@type': ['LocalBusiness', 'Organization'],
    '@id': BUSINESS_ID,
    name: SITE.name,
    alternateName: ['NBNet', 'ენბინეტი', 'nbnetworks', 'NB Networks დუშეთი'],
    legalName: SITE.legalName,
    description: SITE.description,
    url: `${SITE.url}/`,
    logo: abs('/favicon.svg'),
    image: abs('/og.png'),
    telephone: SITE.phoneIntl,
    email: SITE.email,
    priceRange: '25–50 ₾',
    currenciesAccepted: 'GEL',
    sameAs: [SITE.facebook],
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.locality,
      addressRegion: SITE.address.region,
      addressCountry: SITE.address.country,
    },
    ...(BASE.geo ? { geo: { '@type': 'GeoCoordinates', latitude: BASE.geo[0], longitude: BASE.geo[1] } } : {}),
    areaServed: [
      { '@type': 'AdministrativeArea', name: REGION.name },
      ...MUNICIPALITIES.map((m) => ({ '@type': 'AdministrativeArea', name: m.full })),
    ],
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    knowsAbout: ['ინტერნეტის შემოყვანა', 'WI-FI ინსტალაცია', 'ქსელის მონტაჟი', 'ოპტიკური ინტერნეტი', 'უსადენო ინტერნეტი'],
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'ინტერნეტ პაკეტები', itemListElement: offers() },
  };
}

export function website(): Node {
  return {
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: `${SITE.url}/`,
    name: SITE.name,
    inLanguage: 'ka',
    publisher: { '@id': BUSINESS_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/internet/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface Crumb {
  name: string;
  href: string;
}

export const breadcrumbs = (crumbs: Crumb[]): Node => ({
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.href) })),
});

export const faqPage = (items: readonly FaqItem[]): Node => ({
  '@type': 'FAQPage',
  mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: faqAnswerText(f) } })),
});

export function placeService(p: Place, url: string): Node {
  const m = municipality(p.municipality);
  return {
    '@type': 'Service',
    '@id': `${abs(url)}#service`,
    name: `ინტერნეტი ${locative(p.name)}`,
    serviceType: 'ინტერნეტ პროვაიდერი',
    url: abs(url),
    provider: { '@id': BUSINESS_ID },
    areaServed: {
      '@type': 'Place',
      name: p.name,
      ...(p.geo ? { geo: { '@type': 'GeoCoordinates', latitude: p.geo[0], longitude: p.geo[1] } } : {}),
      containedInPlace: { '@type': 'AdministrativeArea', name: m.full, containedInPlace: { '@type': 'AdministrativeArea', name: REGION.name } },
    },
    offers: offers(),
  };
}

export function areaService(name: string, loc: string, url: string): Node {
  return {
    '@type': 'Service',
    name: `ინტერნეტი ${loc}`,
    serviceType: 'ინტერნეტ პროვაიდერი',
    url: abs(url),
    provider: { '@id': BUSINESS_ID },
    areaServed: { '@type': 'AdministrativeArea', name },
    offers: offers(),
  };
}
