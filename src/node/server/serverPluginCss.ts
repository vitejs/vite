import { Plugin } from '.'
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

export const cssPlugin: Plugin = ({ root, app, watcher, resolver }) => {
  app.use(async (ctx, next) => {
    await next()
    // handle .css imports
    if (
      ctx.path.endsWith('.css') &&
      // note ctx.body could be null if upstream set status to 304
      ctx.body
    ) {
      if (
        isImportRequest(ctx) &&
        // skip raw requests
        ctx.query.raw == null
      ) {
        await processCss(ctx)
        // we rewrite it to JS that injects a <style> tag pointing to the same url
        // but with a `?raw` query which returns the actual css
        ctx.type = 'js'
        const id = JSON.stringify(hash_sum(ctx.path))
        const rawPath = JSON.stringify(ctx.path + '?raw')
        let code =
          `import { updateStyle } from "${hmrClientId}"\n` +
          `updateStyle(${id}, ${rawPath})\n`
        if (ctx.path.endsWith('.module.css')) {
          code += `export default ${JSON.stringify(
            processedCSS.get(ctx.path)!.modules
          )}`
        }
        ctx.body = code.trim()
      } else {
        // raw request, return compiled css
        if (!processedCSS.has(ctx.path)) {
          await processCss(ctx)
        }
        ctx.body = processedCSS.get(ctx.path)!.css
      }
    }
  })

  // handle hmr
  watcher.on('change', (file) => {
    if (file.endsWith('.css')) {
      if (srcImportMap.has(file)) {
        // this is a vue src import, skip
        return
      }

      const publicPath = resolver.fileToRequest(file)
      const id = hash_sum(publicPath)

      // bust process cache
      processedCSS.delete(publicPath)

      // css modules are updated as js
      if (!file.endsWith('.module.css')) {
        watcher.send({
          type: 'style-update',
          id,
          path: publicPath,
          timestamp: Date.now()
        })
      }
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
