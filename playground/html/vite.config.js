import { relative, resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nested: resolve(__dirname, 'nested/index.html'),
        scriptAsync: resolve(__dirname, 'scriptAsync.html'),
        scriptMixed: resolve(__dirname, 'scriptMixed.html'),
        emptyAttr: resolve(__dirname, 'emptyAttr.html'),
        link: resolve(__dirname, 'link.html'),
        'link/target': resolve(__dirname, 'index.html'),
        zeroJS: resolve(__dirname, 'zeroJS.html'),
        noHead: resolve(__dirname, 'noHead.html'),
        noBody: resolve(__dirname, 'noBody.html'),
        inlinea: resolve(__dirname, 'inline/shared_a.html'),
        inline1: resolve(__dirname, 'inline/shared-1.html'),
        inline2: resolve(__dirname, 'inline/shared-2.html'),
        inline3: resolve(__dirname, 'inline/unique.html'),
        unicodePath: resolve(
          __dirname,
          'unicode-path/中文-にほんご-한글-🌕🌖🌗/index.html',
        ),
        linkProps: resolve(__dirname, 'link-props/index.html'),
        valid: resolve(__dirname, 'valid.html'),
        importmapOrder: resolve(__dirname, 'importmapOrder.html'),
        env: resolve(__dirname, 'env.html'),
        sideEffects: resolve(__dirname, 'side-effects/index.html'),
        'a á': resolve(__dirname, 'a á.html'),
        serveFile: resolve(__dirname, 'serve/file.html'),
        serveFolder: resolve(__dirname, 'serve/folder/index.html'),
        serveBothFile: resolve(__dirname, 'serve/both.html'),
        serveBothFolder: resolve(__dirname, 'serve/both/index.html'),
        write: resolve(__dirname, 'write.html'),
        'transform-inline-js': resolve(__dirname, 'transform-inline-js.html'),
        relativeInput: relative(
          process.cwd(),
          resolve(__dirname, 'relative-input.html'),
        ),
      },
      external: ['/external-path-by-rollup-options.js'],
    },
  },

  server: {
    warmup: {
      clientFiles: ['./warmup/*'],
    },
  },

  define: {
    'import.meta.env.VITE_NUMBER': 5173,
    'import.meta.env.VITE_STRING': JSON.stringify('string'),
    'import.meta.env.VITE_OBJECT_STRING': '{ "foo": "bar" }',
    'import.meta.env.VITE_NULL_STRING': 'null',
  },

  plugins: [
    {
      name: 'pre-transform',
      transformIndexHtml: {
        order: 'pre',
        handler(html, { filename }) {
          if (html.includes('/@vite/client')) {
            throw new Error('pre transform applied at wrong time!')
          }

          const doctypeRE = /<!doctype html>/i
          if (doctypeRE.test(html)) return

          const head = `
  <head lang="en">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }}</title>
  </head>`
          return `<!DOCTYPE html>
<html lang="en">${filename.includes('noHead') ? '' : head}
${
  filename.includes('noBody')
    ? html
    : `<body>
  ${html}
</body>`
}
</html>
  `
        },
      },
    },
    {
      name: 'string-transform',
      transformIndexHtml(html) {
        return html.replace('Hello', 'Transformed')
      },
    },
    {
      name: 'tags-transform',
      transformIndexHtml() {
        return [
          {
            tag: 'meta',
            attrs: { name: 'description', content: 'a vite app' },
            // default injection is head-prepend
          },
          {
            tag: 'meta',
            attrs: { name: 'keywords', content: 'es modules' },
            injectTo: 'head',
          },
        ]
      },
    },
    {
      name: 'combined-transform',
      transformIndexHtml(html) {
        return {
          html: html.replace('{{ title }}', 'Test HTML transforms'),
          tags: [
            {
              tag: 'p',
              attrs: { class: 'inject' },
              children: 'This is injected',
              injectTo: 'body',
            },
          ],
        }
      },
    },
    {
      name: 'serve-only-transform',
      transformIndexHtml(_, ctx) {
        if (ctx.server) {
          return [
            {
              tag: 'p',
              attrs: { class: 'server' },
              children: 'This is injected only during dev',
              injectTo: 'body',
            },
          ]
        }
      },
    },
    {
      name: 'build-only-transform',
      transformIndexHtml(_, ctx) {
        if (ctx.bundle) {
          return [
            {
              tag: 'p',
              attrs: { class: 'build' },
              children: 'This is injected only during build',
              injectTo: 'body',
            },
          ]
        }
      },
    },
    {
      name: 'path-conditional-transform',
      transformIndexHtml(_, ctx) {
        if (ctx.path.includes('nested')) {
          return [
            {
              tag: 'p',
              attrs: { class: 'conditional' },
              children: 'This is injected only for /nested/index.html',
              injectTo: 'body',
            },
          ]
        }
      },
    },
    {
      name: 'body-prepend-transform',
      transformIndexHtml() {
        return [
          {
            tag: 'noscript',
            children: '<!-- this is appended to body -->',
            injectTo: 'body',
          },
          {
            tag: 'noscript',
            children: '<!-- this is prepended to body -->',
            injectTo: 'body-prepend',
          },
        ]
      },
    },
    {
      name: 'head-prepend-importmap',
      transformIndexHtml(_, ctx) {
        if (ctx.path.includes('importmapOrder')) return

        return [
          {
            tag: 'script',
            attrs: { type: 'importmap' },
            children: `
              {
                "imports": {
                  "vue": "https://unpkg.com/vue@3.4.38/dist/vue.runtime.esm-browser.js"
                }
              }
            `,
            injectTo: 'head',
          },
        ]
      },
    },
    {
      name: 'escape-html-attribute',
      transformIndexHtml: {
        order: 'post',
        handler() {
          return [
            {
              tag: 'link',
              attrs: {
                href: `"><div class=unescape-div>extra content</div>`,
              },
              injectTo: 'body',
            },
          ]
        },
      },
    },
    {
      name: 'append-external-path-by-rollup-options',
      apply: 'build', // this does not work in serve
      transformIndexHtml: {
        order: 'pre',
        handler(_, ctx) {
          if (!ctx.filename.endsWith('html/index.html')) return
          return [
            {
              tag: 'script',
              attrs: {
                type: 'module',
                src: '/external-path-by-rollup-options.js',
              },
              injectTo: 'body',
            },
          ]
        },
      },
    },
    {
      name: 'transform-inline-js',
      transformIndexHtml: {
        order: 'pre',
        handler(html, ctx) {
          if (!ctx.filename.endsWith('html/transform-inline-js.html')) return
          return html.replaceAll(
            '{{ id }}',
            Math.random().toString(36).slice(2),
          )
        },
      },
    },
    serveExternalPathPlugin(),
  ],
})

/** @returns {import('vite').Plugin} */
function serveExternalPathPlugin() {
  const handler = (req, res, next) => {
    if (req.url === '/external-path.js') {
      res.setHeader('Content-Type', 'application/javascript')
      res.end('document.querySelector(".external-path").textContent = "works"')
    } else if (req.url === '/external-path.css') {
      res.setHeader('Content-Type', 'text/css')
      res.end('.external-path{color:red}')
    } else if (req.url === '/external-path-by-rollup-options.js') {
      res.setHeader('Content-Type', 'application/javascript')
      res.end(
        'document.querySelector(".external-path-by-rollup-options").textContent = "works"',
      )
    } else {
      next()
    }
  }
  return {
    name: 'serve-external-path',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}
