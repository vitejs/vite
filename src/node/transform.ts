import { ServerPlugin } from './server'
import { Plugin as RollupPlugin } from 'rollup'
import { parseWithQuery, readBody, isImportRequest } from './utils'

type ParsedQuery = Record<string, string | string[] | undefined>

interface TransformTestContext {
  id: string
  query: ParsedQuery
  /**
   * Indicates whether this is a request made by js import(), or natively by
   * the browser (e.g. `<img src="...">`).
   */
  isImport: boolean
  isBuild: boolean
}

export interface TransformContext extends TransformTestContext {
  code: string
}

export type TransformFn = (ctx: TransformContext) => string | Promise<string>

export interface Transform {
  test: (ctx: TransformTestContext) => boolean
  transform: TransformFn
}

export type CustomBlockTransform = TransformFn

export function createServerTransformPlugin(
  transforms: Transform[],
  customBlockTransforms: Record<string, CustomBlockTransform>
): ServerPlugin {
  return ({ app }) => {
    if (!transforms.length && !Object.keys(customBlockTransforms).length) {
      return
    }

    app.use(async (ctx, next) => {
      await next()

      if (!ctx.body) {
        return
      }

      const { path, query } = ctx
      const isImport = isImportRequest(ctx)
      const isBuild = false
      let code: string = ''

      for (const t of transforms) {
        const transformContext: TransformTestContext = {
          id: path,
          query,
          isImport,
          isBuild
        }
        if (t.test(transformContext)) {
          code = code || (await readBody(ctx.body))!
          code = await t.transform({
            ...transformContext,
            code
          })
          ctx.type = 'js'
          ctx.body = code
        }
      }

      // custom blocks
      if (path.endsWith('vue') && query.type === 'custom') {
        const t = customBlockTransforms[query.blockType]
        if (t) {
          ctx.type = 'js'
          code = code || (await readBody(ctx.body))!
          ctx.body = await t({
            code,
            id: path,
            query,
            isImport,
            isBuild
          })
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
        const transformContext: TransformContext = {
          code: result,
          id: path,
          query,
          isImport: true,
          isBuild: true
        }
        if (t.test(transformContext)) {
          result = await t.transform(transformContext)
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
          result = await t({
            code: result,
            id: path,
            query: normalizedQuery,
            isImport: true,
            isBuild: true
          })
        }
      }
      return result
    }
  }
}
