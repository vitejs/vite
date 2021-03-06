const { readFileSync } = require('fs')
const { resolve } = require('path')
const vite = require('vite')
const devalue = require('@nuxt/devalue')

function getHandler (options, getTemplate, viteDevServer) {
  return async function (req, reply) {
    try {
      const url = req.raw.url
      const { source, render } = await getTemplate(url, viteDevServer)
      const [ appHTML, preloadLinks ] = await render(req, url, options.distManifest, options.ssrDataKey)

      let html = source
        .replace('<!--preload-links-->', preloadLinks)
        .replace('<!--app-html-->', appHTML)

      const ssrData = req[options.ssrDataKey]
      if (ssrData) {
        html = html.replace(
          '<!--ssr-data-->',
          `<script>window.$ssrData = ${devalue(ssrData)}</script>`
        )
      }

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

function getTemplateGetter ({ dev, rootDir, srcDir, distDir, distIndex }) {
  const indexPath = resolve(rootDir, 'index.html')
  if (dev) {
    return async (url, viteDevServer) => {
      // Reload template source every time in dev
      const source = await viteDevServer.transformIndexHtml(url, readFileSync(indexPath, 'utf-8'))
      const { render } = await viteDevServer.ssrLoadModule(resolve(srcDir, 'entry/server.js'))
      return { source, render }
    }
  } else {
    // Load production template source only once in prod
    const source = readFileSync(distIndex, 'utf8')
    const { render } = require(resolve(distDir, 'entry/server.js'))
    const template = { source, render }
    return () => template
  }
}

module.exports = { getHandler, getTemplateGetter }
