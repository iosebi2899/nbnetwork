// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://nbnetworks.ge',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  build: {
    // Single-page site: inline all CSS so there is no render-blocking stylesheet request.
    inlineStylesheets: 'always',
  },
  compressHTML: true,
});
