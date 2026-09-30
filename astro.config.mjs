// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Public address of the site. Free Cloudflare Pages URL by default; set SITE_URL
  // (e.g. https://nbnetworks.ge) once a custom domain is attached.
  site: process.env.SITE_URL ?? 'https://nbnetworks.pages.dev',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  build: {
    // Single-page site: inline all CSS so there is no render-blocking stylesheet request.
    inlineStylesheets: 'always',
  },
  compressHTML: true,
});
