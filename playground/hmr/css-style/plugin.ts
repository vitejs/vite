import fs from 'node:fs'
import path from 'node:path'
import { type Plugin, normalizePath } from 'vite'

// use plugin to simulate server rendered style
export function TestCssStylePlugin(): Plugin {
  const file = path.resolve(import.meta.dirname, 'styles.css')
  return {
    name: 'test-css-style',
    transformIndexHtml: {
      handler(_html, ctx) {
        if (!ctx.filename.endsWith('/css-style/index.html')) return
        return [
          {
            tag: 'style',
            attrs: { 'data-vite-dev-id': normalizePath(file) },
            children: fs.readFileSync(file, 'utf-8'),
          },
          {
            tag: 'script',
            children: `
              window.__ssrStyleMutations = 0
              new MutationObserver((records) => {
                window.__ssrStyleMutations += records.length
              }).observe(document.querySelector('style[data-vite-dev-id]'), {
                childList: true,
                characterData: true,
                subtree: true,
              })
            `,
          },
        ]
      },
    },
  }
}
