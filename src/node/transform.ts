import { ServerPlugin } from './server'
import { Plugin as RollupPlugin } from 'rollup'
import { parseWithQuery, readBody, isImportRequest } from './utils'
import { Service } from 'esbuild'
import { ensureService } from './esbuildService'

type ParsedQuery = Record<string, string | string[] | undefined>

export interface Transform {
  test: (path: string, query: ParsedQuery) => boolean
  transform: (
    code: string,
    /**
     * Indicates whether this is a request made by js import(), or natively by
     * the browser (e.g. `<img src="...">`).
     */
    isImport: boolean,
    isBuild: boolean,
    path: string,
    query: ParsedQuery,
    getEsBuild: () => Promise<Service>
  ) => string | Promise<string>
}

export function createServerTransformPlugin(
  transforms: Transform[]
): ServerPlugin {
  return ({ app }) => {
    app.use(async (ctx, next) => {
      await next()
      for (const t of transforms) {
        if (t.test(ctx.path, ctx.query)) {
          ctx.type = 'js'
          if (ctx.body) {
            const code = await readBody(ctx.body)
            if (code) {
              ctx.body = await t.transform(
                code,
                isImportRequest(ctx),
                false,
                ctx.path,
                ctx.query,
                ensureService
              )
              ctx._transformed = true
            }
          }
        }
      }
    })
  }
}

export function createBuildJsTransformPlugin(
  transforms: Transform[]
): RollupPlugin {
  return {
    name: 'vite:transforms',
    async transform(code, id) {
      const { path, query } = parseWithQuery(id)
      let result: string | Promise<string> = code
      for (const t of transforms) {
        if (t.test(path, query)) {
          result = await t.transform(
            result,
            true,
            true,
            path,
            query,
            ensureService
          )
        }
      }
      return result
    }
  }
}
