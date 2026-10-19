import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: path.resolve(import.meta.dirname, 'new-manifest'),
  experimental: { newManifestFormat: true },
  build: {
    manifest: true,
    outDir: '../dist/new-manifest',
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
  plugins: [
    {
      name: 'post-tags',
      transformIndexHtml: {
        order: 'post',
        handler() {
          return [
            {
              tag: 'noscript',
              injectTo: 'body',
              children: [{ tag: 'p', children: 'fallback' }],
            },
          ]
        },
      },
    },
    {
      name: 'normal-tags',
      transformIndexHtml(html, ctx) {
        if (html !== undefined) {
          return {
            html: html.replace('Manifest', 'Transformed'),
            tags: [{ tag: 'meta', attrs: { name: 'document' } }],
          }
        }
        return {
          tags: [
            {
              tag: 'meta',
              attrs: { name: 'context', content: Object.keys(ctx).join(',') },
            },
            {
              tag: 'meta',
              attrs: {
                name: 'bundle',
                content: Object.keys(ctx.bundle).join(','),
              },
            },
          ],
        }
      },
    },
    {
      name: 'pre-tags',
      transformIndexHtml: {
        order: 'pre',
        async handler() {
          await Promise.resolve()
          return {
            tags: [
              { tag: 'meta', attrs: { name: 'a', content: '"<&' } },
              {
                tag: 'meta',
                attrs: { name: 'b', hidden: true, disabled: false },
              },
            ],
          }
        },
      },
    },
    {
      name: 'string-transform',
      transformIndexHtml: (html) => html ?? '<html>ignored</html>',
    },
    { name: 'empty-tags', transformIndexHtml: () => [] },
    { name: 'void-hook', transformIndexHtml: () => undefined },
  ],
})
