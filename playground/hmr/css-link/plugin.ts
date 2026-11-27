import path from 'node:path'
import { type Plugin, normalizePath } from 'vite'

// use plugin to simulate server rendered css link
export function TestCssLinkPlugin(): Plugin {
  return {
    name: 'test-css-link',
    transformIndexHtml: {
      handler(_html, ctx) {
        if (!ctx.filename.endsWith('/css-link/index.html')) return
        const id = normalizePath(
          path.resolve(import.meta.dirname, 'styles.css'),
        )
        ctx.server?.environments.client.addSafeModule(`${id}?direct`)
        return [
          {
            tag: 'link',
            attrs: {
              rel: 'stylesheet',
              href: '/css-link/styles.css',
              'data-vite-dev-id': id,
            },
          },
        ]
      },
    },
  }
}
