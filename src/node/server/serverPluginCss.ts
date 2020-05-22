import { ServerPlugin } from '.'
import { hmrClientId } from './serverPluginHmr'
import hash_sum from 'hash-sum'
import { Context } from 'koa'
import { isImportRequest, readBody } from '../utils'
import { srcImportMap } from './serverPluginVue'
import {
  compileCss,
  cssPreprocessLangReg,
  rewriteCssUrls
} from '../utils/cssUtils'

interface ProcessedEntry {
  css: string
  modules: Record<string, string> | undefined
}

const processedCSS = new Map<string, ProcessedEntry>()

export const cssPlugin: ServerPlugin = ({
  root,
  app,
  watcher,
  resolver,
  config
}) => {
  app.use(async (ctx, next) => {
    await next()
    // handle .css imports
    if (
      (cssPreprocessLangReg.test(ctx.path) || ctx.response.is('css')) &&
      // note ctx.body could be null if upstream set status to 304
      ctx.body
    ) {
      if (isImportRequest(ctx)) {
        await processCss(root, ctx)
        // we rewrite css with `?import` to a js module that inserts a style
        // tag linking to the actual raw url
        ctx.type = 'js'
        const id = JSON.stringify(hash_sum(ctx.path))
        let code =
          `import { updateStyle } from "${hmrClientId}"\n` +
          `const css = ${JSON.stringify(processedCSS.get(ctx.path)!.css)}\n` +
          `updateStyle(${id}, css)\n`
        if (ctx.path.endsWith('.module.css')) {
          code += `export default ${JSON.stringify(
            processedCSS.get(ctx.path)!.modules
          )}`
        } else {
          code += `export default css`
        }
        ctx.body = code.trim()
      } else {
        // raw request, return compiled css
        if (!processedCSS.has(ctx.path)) {
          await processCss(root, ctx)
        }
        ctx.type = 'js'
        ctx.body = `export default ${JSON.stringify(
          processedCSS.get(ctx.path)!.css
        )}`
      }
    }
  })

  watcher.on('change', (file) => {
    if (file.endsWith('.css') || cssPreprocessLangReg.test(file)) {
      if (srcImportMap.has(file)) {
        // this is a vue src import, skip
        return
      }
      if (file.endsWith('.module.css')) {
        watcher.handleJSReload(file, Date.now())
        return
      }

      const publicPath = resolver.fileToRequest(file)
      const id = hash_sum(publicPath)

      // bust process cache
      processedCSS.delete(publicPath)

      watcher.send({
        type: 'style-update',
        id,
        path: publicPath,
        timestamp: Date.now()
      })
    }
  })

  async function processCss(root: string, ctx: Context) {
    let css = (await readBody(ctx.body))!

    const result = await compileCss(root, ctx.path, {
      id: '',
      source: css,
      filename: resolver.requestToFile(ctx.path),
      scoped: false,
      modules: ctx.path.endsWith('.module.css'),
      preprocessLang: ctx.path.replace(cssPreprocessLangReg, '$2') as any
    })

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
