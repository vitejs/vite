const { readFileSync } = require('fs')
const { resolve } = require('path')
const vite = require('vite')
const devalue = require('@nuxt/devalue')

function getHandler (options, getTemplate, viteApp) {
  return async function (req, reply) {
    try {
      const url = req.raw.url
      const { source, render } = await getTemplate(req, url, viteApp)
      const [appHTML, preloadLinks] = await render(req, url, options.distManifest)

      const html = source
        .replace('<!--preload-links-->', preloadLinks)
        .replace('<!--app-html-->', appHTML)

      reply.code(200)
      reply.type('text/html')
      reply.send(html)

      return reply
    } catch (e) {
      console.error(e.stack)
      vite && vite.ssrFixStacktrace(e)
      reply.code(500)
      reply.send(e.stack)
    }
  }
}

function getTemplateGetter (options) {
  const { srcDir, rootDir } = options
  const indexPath = resolve(rootDir, 'index.html')
  if (options.dev) {
    return async (req, url, viteApp) => {
      req.$viteSSRData = req.$viteSSRData || {foobar: 'foobar'}
      let source = readFileSync(indexPath, 'utf-8')
      source = source.replace(
        '<!--ssr-data-->',
        `<script>window.$ssrData = ${devalue(req.$viteSSRData)}</script>`
      )
      source = await viteApp.transformIndexHtml(url, source)
      const { render } = await viteApp.ssrLoadModule(resolve(srcDir, 'entry-server.js'))
      return { source, render }
    }
  } else {
    const source = readFileSync(options.distIndex)
    const { render } = require(resolve(options.distDir, 'entry-server.js'))
    return () => {
      return { source, render }
    }
  }
}

module.exports = { getHandler, getTemplateGetter }
