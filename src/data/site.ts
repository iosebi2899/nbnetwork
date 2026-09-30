export const SITE = {
  /** From astro.config `site` (SITE_URL env), without trailing slash. */
  url: import.meta.env.SITE.replace(/\/$/, ''),
  name: 'NB Networks',
  title: 'ინტერნეტ პროვაიდერი მცხეთა-მთიანეთში | NB Networks',
  description:
    'ინტერნეტის შემოყვანა დუშეთის, მცხეთის, თიანეთის და ყაზბეგის სოფლებში. სტაბილური ინტერნეტი 25–50 Mbps, 25 ლარიდან. WI-FI და ქსელის მონტაჟი, 24/7 მხარდაჭერა. ☎ 599-298-456',
  phone: '599298456',
  phoneDisplay: '599-298-456',
  phoneIntl: '+995599298456',
  email: 'lnugzar@gmail.com',
  legalName: 'ი.მ. ნუგზარ ლაფანაშვილი',
  facebook: 'https://www.facebook.com/ispnbnet',
  address: {
    street: 'ს. ჭოპორტი, მე–6 ქ. N 35',
    locality: 'დუშეთი',
    region: 'მცხეთა-მთიანეთი',
    country: 'GE',
  },
} as const;

export interface Package {
  speed: number;
  price: number;
}

export const PACKAGES: readonly Package[] = [
  { speed: 25, price: 25 },
  { speed: 30, price: 30 },
  { speed: 50, price: 50 },
];

/** `id` links are in-page sections of the home page; `href` links are separate pages. */
export const NAV_LINKS = [
  { id: 'education', label: 'სერვისი' },
  { id: 'packages', label: 'პაკეტები' },
  { href: '/internet/', label: 'დაფარვა' },
  { id: 'contact', label: 'კონტაქტი' },
] as const;

export const PAYNET_URL = 'https://paynet.ge/';

export interface FaqItem {
  q: string;
  /** Answer paragraph (shown before the list when both are set). */
  a?: string;
  /** Answer bullet points. */
  list?: readonly string[];
}

/** Plain-text answer for structured data. */
export const faqAnswerText = (f: FaqItem): string => [f.a, ...(f.list ?? [])].filter(Boolean).join(' ');

export interface Service {
  title: string;
  items: readonly string[];
}

export const SERVICES: readonly Service[] = [
  {
    title: 'მაღალ ხარისხიან სტაბილურ ინტერნეტს',
    items: ['მაღალი დონის მომსახურებას', 'მაქსიმალურად მოკლე დროში პრობლემაზე რეაგირებას'],
  },
  {
    title: 'ქსელი და WI-FI ინსტალაცია/მონტაჟი',
    items: ['WI-FI მოდემების მონტაჟი, პაროლის და სახელის ცვლილება', 'ქსელის მონტაჟი/გაყვანა'],
  },
];
