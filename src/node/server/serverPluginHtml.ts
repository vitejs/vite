import { rewriteImports, ServerPlugin } from './index'
import { debugHmr, ensureMapEntry, importerMap } from './serverPluginHmr'
import { clientPublicPath } from './serverPluginClient'
import { init as initLexer } from 'es-module-lexer'
import { cleanUrl, readBody, injectScriptToHtml } from '../utils'
import LRUCache from 'lru-cache'
import path from 'path'
import chalk from 'chalk'

const debug = require('debug')('vite:rewrite')

const rewriteHtmlPluginCache = new LRUCache({ max: 20 })

export const htmlRewritePlugin: ServerPlugin = ({
  root,
  app,
  watcher,
  resolver,
  config
}) => {
  const devInjectionCode = `\n<script type="module">import "${clientPublicPath}"</script>\n`
  const scriptRE = /(<script\b[^>]*>)([\s\S]*?)<\/script>/gm
  const srcRE = /\bsrc=(?:"([^"]+)"|'([^']+)'|([^'"\s]+)\b)/

  async function rewriteHtml(importer: string, html: string) {
    await initLexer
    html = html.replace(scriptRE, (matched, openTag, script) => {
      if (script) {
        return `${openTag}${rewriteImports(
          root,
          script,
          importer,
          resolver
        )}</script>`
      } else {
        const srcAttr = openTag.match(srcRE)
        if (srcAttr) {
          // register script as a import dep for hmr
          const importee = resolver.normalizePublicPath(
            cleanUrl(path.posix.resolve('/', srcAttr[1] || srcAttr[2]))
          )
          debugHmr(`        ${importer} imports ${importee}`)
          ensureMapEntry(importerMap, importee).add(importer)
        }
        return matched
      }
    })
    return injectScriptToHtml(html, devInjectionCode)
  }

  app.use(async (ctx, next) => {
    await next()

    if (ctx.status === 304) {
      return
    }

    if (ctx.response.is('html') && ctx.body) {
      const importer = ctx.path
      const html = await readBody(ctx.body)
      if (rewriteHtmlPluginCache.has(html)) {
        debug(`${ctx.path}: serving from cache`)
        ctx.body = rewriteHtmlPluginCache.get(html)
      } else {
        if (!html) return
        ctx.body = await rewriteHtml(importer, html)
        rewriteHtmlPluginCache.set(html, ctx.body)
      }
      return
    }
  })

  watcher.on('change', (file) => {
    const path = resolver.fileToRequest(file)
    if (path.endsWith('.html')) {
      debug(`${path}: cache busted`)
      watcher.send({
        type: 'full-reload',
        path
      })
      console.log(chalk.green(`[vite] `) + ` ${path} page reloaded.`)
    }
  })
}
