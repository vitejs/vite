import { ServerPlugin } from './server'
import { Plugin as RollupPlugin } from 'rollup'
import { parseWithQuery, readBody, isImportRequest } from './utils'

export interface Transform {
  /**
   * @default 'js'
   */
  as?: 'js' | 'css'
  test: (
    path: string,
    query: Record<string, string | string[] | undefined>
  ) => boolean
  transform: (code: string, isImport: boolean) => string | Promise<string>
}

export function normalizeTransforms(transforms: Transform[]) {}

export function createServerTransformPlugin(
  transforms: Transform[]
): ServerPlugin {
  return ({ app }) => {
    app.use(async (ctx, next) => {
      await next()
      for (const t of transforms) {
        if (t.test(ctx.path, ctx.query)) {
          ctx.type = t.as || 'js'
          if (ctx.body) {
            const code = await readBody(ctx.body)
            if (code) {
              ctx.body = await t.transform(code, isImportRequest(ctx))
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
  transforms = transforms.filter((t) => t.as === 'js' || !t.as)

  return {
    name: 'vite:transforms',
    async transform(code, id) {
      const { path, query } = parseWithQuery(id)
      for (const t of transforms) {
        if (t.test(path, query)) {
          return t.transform(code, true)
        }
      }
    }
  }
}
