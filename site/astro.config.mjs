import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

function wrapTables() {
  return (tree) => {
    const walk = (children) => {
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.type === 'element' && node.tagName === 'table') {
          children[i] = {
            type: 'element',
            tagName: 'div',
            properties: { className: ['table-wrap'] },
            children: [node],
          };
        }
        if (node.children) walk(node.children);
      }
    };
    if (tree.children) walk(tree.children);
  };
}

export default defineConfig({
  site: 'https://aradhyac.com',
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [wrapTables],
  },
  server: {
    proxy: {
      '/api/edit': 'http://localhost:8080',
    },
  },
});
