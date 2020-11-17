import { basename } from 'path'
import { Context, ServerPlugin } from '.'
import hash_sum from 'hash-sum'
import {
  appendQuery,
  cleanUrl,
  isImportRequest,
  parseWithQuery,
  readBody
} from '../utils'
import { srcImportMap, vueCache } from './serverPluginVue'
import {
  compileCss,
  cssImporterMap,
  cssPreprocessLangRE,
  getCssImportBoundaries,
  recordCssImportChain,
  rewriteCssUrls,
  isCSSRequest
} from '../utils/cssUtils'
import chalk from 'chalk'
import { InternalResolver } from '../resolver'
import { clientPublicPath } from './serverPluginClient'
import { dataToEsm } from '@rollup/pluginutils'

export const debugCSS = require('debug')('vite:css')

export const cssPlugin: ServerPlugin = ({ root, app, watcher, resolver }) => {
  app.use(async (ctx, next) => {
    await next()
    // handle .css imports
    if (
      isCSSRequest(ctx.path) &&
      // note ctx.body could be null if upstream set status to 304
      ctx.body
    ) {
      const id = hash_sum(ctx.path)
      if (isImportRequest(ctx)) {
        const { css, modules } = await processCss(root, ctx)
        ctx.type = 'js'
        // we rewrite css with `?import` to a js module that inserts a style
        // tag linking to the actual raw url
        ctx.body = codegenCss(id, css, modules)
      }
    }
  })

  watcher.on('change', (filePath) => {
    if (isCSSRequest(filePath)) {
      const publicPath = cleanUrl(resolver.fileToRequest(filePath))

      /** filter unused files */
      if (
        !cssImporterMap.has(filePath) &&
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
      // handle HMR for module css
      // it cannot be handled as normal css because the js exports may change
      if (filePath.includes('.module')) {
        moduleCssUpdate(filePath, resolver)
      }

      const boundaries = getCssImportBoundaries(filePath)
      if (boundaries.size) {
        boundaryCssUpdate(boundaries)
        return
      }
      // no boundaries
      normalCssUpdate(publicPath)
    } else if (cssImporterMap.has(filePath)) {
      const boundaries = getCssImportBoundaries(filePath)
      if (boundaries.size) {
        boundaryCssUpdate(boundaries)
      }
    }
  })

  function boundaryCssUpdate(boundaries: Set<string>) {
    for (let boundary of boundaries) {
      // TODO boundaries can be files or requests (because of recordCssImportChain(result.dependencies, resource))
      const request = boundary.includes('?')
        ? boundary
        : resolver.fileToRequest(boundary)
      const filePath = !boundary.includes('?')
        ? boundary
        : resolver.requestToFile(boundary)
      if (boundary.includes('.module')) {
        moduleCssUpdate(boundary, resolver)
      } else if (boundary.includes('.vue')) {
        vueCache.del(filePath)
        vueStyleUpdate(request)
      } else {
        normalCssUpdate(request)
      }
    }
  }

  function vueStyleUpdate(styleImport: string) {
    const publicPath = cleanUrl(styleImport)
    const index = parseWithQuery(styleImport).query.index
    if (!index) {
      console.error(
        new Error(`no index found for vue style path ${styleImport}`)
      )
    }
    const path = appendQuery(publicPath, `type=style&index=${index}`)
    console.log(chalk.green(`[vite:hmr] `) + `${publicPath} updated. (style)`)
    watcher.send({
      type: 'style-update',
      path,
      changeSrcPath: path,
      timestamp: Date.now()
    })
  }

  function moduleCssUpdate(filePath: string, resolver: InternalResolver) {
    // bust process cache
    processedCSS.delete(cleanUrl(resolver.fileToRequest(filePath)))

    watcher.handleJSReload(filePath)
  }

  function normalCssUpdate(publicPath: string) {
    publicPath = cleanUrl(publicPath)
    // bust process cache
    processedCSS.delete(publicPath)

    watcher.send({
      type: 'style-update',
      path: publicPath,
      changeSrcPath: publicPath,
      timestamp: Date.now()
    })
  }

  interface ProcessedCSS {
    css: string
    modules?: Record<string, string>
  }

  // processed CSS is cached in case the user ticks "disable cache" during dev
  // which can lead to unnecessary processing on page reload
  const processedCSS = new Map<string, ProcessedCSS>()

  async function processCss(root: string, ctx: Context): Promise<ProcessedCSS> {
    // source didn't change (marker added by cachedRead)
    // just use previously cached result
    if (ctx.__notModified && processedCSS.has(ctx.path)) {
      return processedCSS.get(ctx.path)!
    }

    const css = (await readBody(ctx.body))!
    const filePath = resolver.requestToFile(ctx.url)
    const preprocessLang = (ctx.path.match(cssPreprocessLangRE) || [])[1]

    const result = await compileCss(root, ctx.path, {
      id: '',
      source: css,
      filename: filePath,
      scoped: false,
      modules: ctx.path.includes('.module'),
      preprocessLang,
      preprocessOptions: ctx.config.cssPreprocessOptions,
      modulesOptions: ctx.config.cssModuleOptions
    })

    if (typeof result === 'string') {
      const res = { css: await rewriteCssUrls(css, ctx.path) }
      processedCSS.set(ctx.path, res)
      return res
    }

    recordCssImportChain(result.dependencies, filePath)

    if (result.errors.length) {
      console.error(`[vite] error applying css transforms: `)
      result.errors.forEach(console.error)
    }

    const res = {
      css: await rewriteCssUrls(result.code, ctx.path),
      modules: result.modules
    }
    processedCSS.set(ctx.path, res)
    return res
  }
}

export function codegenCss(
  id: string,
  css: string,
  modules?: Record<string, string>
): string {
  let code =
    `import { updateStyle } from "${clientPublicPath}"\n` +
    `const css = ${JSON.stringify(css)}\n` +
    `updateStyle(${JSON.stringify(id)}, css)\n`
  if (modules) {
    code += dataToEsm(modules, { namedExports: true })
  } else {
    code += `export default css`
  }
  return code
}
