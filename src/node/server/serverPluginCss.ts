import { basename } from 'path'
import { Context, ServerPlugin } from '.'
import hash_sum from 'hash-sum'
import { cleanUrl, isImportRequest, readBody } from '../utils'
import { srcImportMap, vueCache } from './serverPluginVue'
import {
  compileCss,
  cssImportMap,
  cssPreprocessLangRE,
  getCssImportBoundaries,
  rewriteCssUrls,
  isCSSRequest
} from '../utils/cssUtils'
import qs from 'querystring'
import chalk from 'chalk'
import { InternalResolver } from '../resolver'
import { hmrClientPublicPath } from './serverPluginHmr'

interface ProcessedEntry {
  css: string
  modules?: Record<string, string>
}

export const debugCSS = require('debug')('vite:css')

const processedCSS = new Map<string, ProcessedEntry>()

export const cssPlugin: ServerPlugin = ({ root, app, watcher, resolver }) => {
  app.use(async (ctx, next) => {
    await next()
    // handle .css imports
    if (
      isCSSRequest(ctx.path) &&
      // note ctx.body could be null if upstream set status to 304
      ctx.body
    ) {
      const id = JSON.stringify(hash_sum(ctx.path))
      if (isImportRequest(ctx)) {
        await processCss(root, ctx)
        // we rewrite css with `?import` to a js module that inserts a style
        // tag linking to the actual raw url
        ctx.type = 'js'
        const { css, modules } = processedCSS.get(ctx.path)!
        ctx.body = codegenCss(id, css, modules)
      } else {
        // raw request, return compiled css
        if (!processedCSS.has(ctx.path)) {
          await processCss(root, ctx)
        }
        ctx.type = 'css'
        ctx.body = processedCSS.get(ctx.path)!.css
      }
    }
  })

  watcher.on('change', (filePath) => {
    if (isCSSRequest(filePath)) {
      const publicPath = resolver.fileToRequest(filePath)

      /** filter unused files */
      if (
        !cssImportMap.has(filePath) &&
        !processedCSS.has(publicPath) &&
        !srcImportMap.has(filePath)
      ) {
        return debugCSS(
          `${basename(publicPath)} has changed, but it is not currently in use`
        )
      }

      if (srcImportMap.has(filePath)) {
        // handle HMR for <style src="xxx.css">
        // it cannot be handled as simple css import because it may be scoped
        const styleImport = srcImportMap.get(filePath)
        vueCache.del(filePath)
        vueStyleUpdate(styleImport)
        return
      }
      // handle HMR for module.css
      // it cannot be handled as normal css because the js exports may change
      if (filePath.endsWith('.module.css')) {
        moduleCssUpdate(filePath, resolver)
      }

      const boundaries = getCssImportBoundaries(filePath)
      if (boundaries.size) {
        for (let boundary of boundaries) {
          if (boundary.includes('.module')) {
            moduleCssUpdate(boundary, resolver)
          } else if (boundary.includes('.vue')) {
            vueCache.del(cleanUrl(boundary))
            vueStyleUpdate(resolver.fileToRequest(boundary))
          } else {
            normalCssUpdate(resolver.fileToRequest(boundary))
          }
        }
        return
      }
      // no boundaries
      normalCssUpdate(publicPath)
    }
  })

  function vueStyleUpdate(styleImport: string) {
    const publicPath = cleanUrl(styleImport)
    const index = qs.parse(styleImport.split('?', 2)[1]).index
    console.log(chalk.green(`[vite:hmr] `) + `${publicPath} updated. (style)`)
    watcher.send({
      type: 'style-update',
      path: `${publicPath}?type=style&index=${index}`,
      timestamp: Date.now()
    })
  }

  function moduleCssUpdate(filePath: string, resolver: InternalResolver) {
    // bust process cache
    processedCSS.delete(resolver.fileToRequest(filePath))

    watcher.handleJSReload(filePath)
  }

  function normalCssUpdate(publicPath: string) {
    // bust process cache
    processedCSS.delete(publicPath)

    watcher.send({
      type: 'style-update',
      path: publicPath,
      timestamp: Date.now()
    })
  }

  async function processCss(root: string, ctx: Context) {
    // source didn't change (marker added by cachedRead)
    // just use previously cached result
    if (ctx.__notModified && processedCSS.has(ctx.path)) {
      return
    }

    const css = (await readBody(ctx.body))!
    const result = await compileCss(root, ctx.path, {
      id: '',
      source: css,
      filename: resolver.requestToFile(ctx.path),
      scoped: false,
      modules: ctx.path.includes('.module'),
      preprocessLang: ctx.path.replace(cssPreprocessLangRE, '$2') as any,
      preprocessOptions: ctx.config.cssPreprocessOptions
    })

    if (typeof result === 'string') {
      processedCSS.set(ctx.path, { css: await rewriteCssUrls(css, ctx.path) })
      return
    }

    if (result.errors.length) {
      console.error(`[vite] error applying css transforms: `)
      result.errors.forEach(console.error)
    }

    result.code = await rewriteCssUrls(result.code, ctx.path)

    processedCSS.set(ctx.path, {
      css: result.code,
      modules: result.modules
    })
  }
}

export function codegenCss(
  id: string,
  css: string,
  modules?: Record<string, string>
): string {
  let code =
    `import { updateStyle } from "${hmrClientPublicPath}"\n` +
    `const css = ${JSON.stringify(css)}\n` +
    `updateStyle(${JSON.stringify(id)}, css)\n`
  if (modules) {
    code += `export default ${JSON.stringify(modules)}`
  } else {
    code += `export default css`
  }
  return code
}
