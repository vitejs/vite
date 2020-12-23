const { resolve } = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nested: resolve(__dirname, 'nested/index.html')
      }
    }
  },

  plugins: [
    {
      name: 'pre-transform',
      transformIndexHtml: {
        enforce: 'pre',
        transform(html) {
          if (html.includes('/@vite/client')) {
            throw new Error('pre transform applied at wrong time!')
          }
          return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
</head>
<body>
  ${html}
</body>
</html>
  `
        }
      }
    },
    {
      name: 'string-transform',
      transformIndexHtml(html) {
        return html.replace('Hello', 'Transformed')
      }
    },
    {
      name: 'tags-transform',
      transformIndexHtml() {
        return [
          {
            tag: 'meta',
            attrs: { name: 'description', content: 'a vite app' }
            // default injection is head-prepend
          },
          {
            tag: 'meta',
            attrs: { name: 'keywords', content: 'es modules' },
            injectTo: 'head'
          }
        ]
      }
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
              injectTo: 'body'
            }
          ]
        }
      }
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
              injectTo: 'body'
            }
          ]
        }
      }
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
              injectTo: 'body'
            }
          ]
        }
      }
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
              injectTo: 'body'
            }
          ]
        }
      }
    }
  ]
}
