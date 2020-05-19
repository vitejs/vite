import { ServerPlugin } from '.'
import { hmrClientId } from './serverPluginHmr'
import hash_sum from 'hash-sum'
import { Context } from 'koa'
import { isImportRequest, readBody, loadPostcssConfig } from '../utils'
import { srcImportMap } from './serverPluginVue'

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
      ctx.response.is('css') &&
      // note ctx.body could be null if upstream set status to 304
      ctx.body
    ) {
      if (isImportRequest(ctx)) {
        await processCss(ctx)
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
          await processCss(ctx)
        }
        ctx.type = 'js'
        ctx.body = `export default ${JSON.stringify(
          processedCSS.get(ctx.path)!.css
        )}`
      }
    }
  })

  // handle hmr
  const cssTransforms = config.transforms
    ? config.transforms.filter((t) => t.as === 'css')
    : []

  watcher.on('change', (file) => {
    if (file.endsWith('.css') || cssTransforms.some((t) => t.test(file, {}))) {
      if (srcImportMap.has(file)) {
        // this is a vue src import, skip
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

  async function processCss(ctx: Context) {
    let css = (await readBody(ctx.body))!
    let modules
    const postcssConfig = await loadPostcssConfig(root)
    const expectsModule = ctx.path.endsWith('.module.css')

    // postcss processing
    if (postcssConfig || expectsModule) {
      try {
        css = (
          await require('postcss')([
            ...((postcssConfig && postcssConfig.plugins) || []),
            ...(expectsModule
              ? [
                  require('postcss-modules')({
                    generateScopedName: `[local]_${hash_sum(ctx.path)}`,
                    getJSON(_: string, json: Record<string, string>) {
                      modules = json
                    }
                  })
                ]
              : [])
          ]).process(css, {
            ...(postcssConfig && postcssConfig.options),
            from: resolver.requestToFile(ctx.path)
          })
        ).css
      } catch (e) {
        console.error(`[vite] error applying postcss transforms: `, e)
      }
    }

    processedCSS.set(ctx.path, {
      css,
      modules
    })
  }
}
