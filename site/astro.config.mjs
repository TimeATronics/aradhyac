import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aradhyac.com',
  integrations: [sitemap()],
  vite: {
  server: {
    proxy: {
      '/api/edit': 'http://localhost:8080',
    },
  },
  },
});
