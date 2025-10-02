import { normalizePath, type Plugin } from 'vite'
import path from 'node:path'

// use plugin to simulate server rendered css link
export function TestCssLinkPlugin(): Plugin {
  return {
    name: 'test-css-link',
    transformIndexHtml: {
      handler(_html, ctx) {
        if (!ctx.filename.endsWith('/css-link/index.html')) return
        return [
          {
            tag: 'link',
            attrs: {
              rel: 'stylesheet',
              href: '/css-link/styles.css',
              'data-vite-dev-id': normalizePath(
                path.resolve(import.meta.dirname, 'styles.css'),
              ),
            },
          },
        ]
      },
    },
  }
}
