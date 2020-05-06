import { Plugin } from './server'
import { readBody, isImportRequest, genSourceMapString } from './utils'
import { TransformOptions } from 'esbuild'
import { transform } from './esbuildService'

const testRE = /\.(tsx?|jsx)$/

export const esbuildPlugin: Plugin = ({ app, watcher, jsxConfig }) => {
  app.use(async (ctx, next) => {
    await next()
    if (isImportRequest(ctx) && ctx.body && testRE.test(ctx.path)) {
      ctx.type = 'js'
      let options: TransformOptions = {}
      if (ctx.path.endsWith('.ts')) {
        options = { loader: 'ts' }
      } else if (ctx.path.endsWith('tsx')) {
        options = { loader: 'tsx', ...jsxConfig }
      } else if (ctx.path.endsWith('jsx')) {
        options = { loader: 'jsx', ...jsxConfig }
      }
      const src = await readBody(ctx.body)
      const { code, map } = await transform(
        src!,
        options,
        `transpiling ${ctx.path}`
      )
      ctx.body = code
      if (map) {
        ctx.body += genSourceMapString(map)
      }
    }
  })

  watcher.on('change', (file) => {
    if (testRE.test(file)) {
      watcher.handleJSReload(file)
    }
  })
}
