import { ServerPlugin } from './server'
import { Plugin as RollupPlugin } from 'rollup'
import { parseWithQuery, readBody, isImportRequest } from './utils'

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
    query: ParsedQuery
  ) => string | Promise<string>
}

export type CustomBlockTransform = (
  src: string,
  attrs: Record<string, string>
) => string | Promise<string>

export function createServerTransformPlugin(
  transforms: Transform[],
  customBlockTransforms: Record<string, CustomBlockTransform>
): ServerPlugin {
  return ({ app }) => {
    app.use(async (ctx, next) => {
      await next()

      const { path, query } = ctx
      let code: string | null = null

      for (const t of transforms) {
        if (t.test(path, query)) {
          ctx.type = 'js'
          if (ctx.body) {
            code = code || (await readBody(ctx.body))
            if (code) {
              ctx.body = await t.transform(
                code,
                isImportRequest(ctx),
                false,
                path,
                query
              )
            }
          }
        }
      }
      // custom blocks
      if (path.endsWith('vue') && query.type === 'custom') {
        const t = customBlockTransforms[query.blockType]
        if (t) {
          ctx.type = 'js'
          if (ctx.body) {
            code = code || (await readBody(ctx.body))
            if (code) {
              ctx.body = await t(code, query)
            }
          }
        }
      }
    })
  }
}

export function createBuildJsTransformPlugin(
  transforms: Transform[],
  customBlockTransforms: Record<string, CustomBlockTransform>
): RollupPlugin {
  return {
    name: 'vite:transforms',
    async transform(code, id) {
      const { path, query } = parseWithQuery(id)
      let result: string | Promise<string> = code
      for (const t of transforms) {
        if (t.test(path, query)) {
          result = await t.transform(result, true, true, path, query)
        }
      }
      // custom blocks
      if (query.vue != null && typeof query.type === 'string') {
        const t = customBlockTransforms[query.type]
        if (t) {
          // normalize lang since rollup-plugin-vue appends it as .xxx
          const normalizedQuery: Record<string, string> = {}
          for (const key in query) {
            if (key.startsWith(`lang.`)) {
              normalizedQuery.lang = key.slice(5)
            } else {
              normalizedQuery[key] = query[key] as string
            }
          }
          result = await t(result, normalizedQuery)
        }
      }
      return result
    }
  }
}
