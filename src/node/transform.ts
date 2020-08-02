import { ServerPlugin } from './server'
import { Plugin as RollupPlugin } from 'rollup'
import { parseWithQuery, readBody, isImportRequest } from './utils'
import { SourceMap, mergeSourceMap } from './server/serverPluginSourceMap'
import { InternalResolver } from './resolver'

type ParsedQuery = Record<string, string | string[] | undefined>

interface TransformTestContext {
  /**
   * Full specifier of the transformed module, including query parameters
   */
  id: string
  /**
   * Path without query (use this to check for file extensions)
   */
  path: string
  /**
   * Parsed query object
   */
  query: ParsedQuery
  /**
   * Indicates whether this is a request made by js import(), or natively by
   * the browser (e.g. `<img src="...">`).
   */
  isImport: boolean
  isBuild: boolean
  /**
   * Indicates that the file for this request was not modified since last call.
   */
  notModified?: true
}

export interface TransformContext extends TransformTestContext {
  code: string
}

export interface TransformResult {
  code: string
  map?: SourceMap
}

export type TransformFn = (
  ctx: TransformContext
) => string | TransformResult | Promise<string | TransformResult>

export interface Transform {
  test: (ctx: TransformTestContext) => boolean
  transform: TransformFn
}

export type CustomBlockTransform = TransformFn

export function createServerTransformPlugin(
  transforms: Transform[],
  customBlockTransforms: Record<string, CustomBlockTransform>,
  resolver: InternalResolver
): ServerPlugin {
  return ({ app }) => {
    if (!transforms.length && !Object.keys(customBlockTransforms).length) {
      return
    }

    app.use(async (ctx, next) => {
      await next()

      if (
        !ctx.body ||
        (ctx.type === 'text/html' && !isImportRequest(ctx)) ||
        resolver.isPublicRequest(ctx.path)
      ) {
        return
      }

      let { url, path, query, __notModified } = ctx
      const id = resolver.requestToFile(url)
      path = resolver.requestToFile(path)
      const isImport = isImportRequest(ctx)
      const isBuild = false
      let code: string = ''

      for (const t of transforms) {
        const transformContext: TransformTestContext = {
          id,
          path,
          query,
          isImport,
          isBuild
        }
        if (__notModified) {
          transformContext.notModified = true
        }

        if (t.test(transformContext)) {
          code = code || (await readBody(ctx.body))!
          const result = await t.transform({
            ...transformContext,
            code
          })
          if (typeof result === 'string') {
            code = result
          } else {
            code = result.code
            if (result.map) {
              ctx.map = mergeSourceMap(ctx.map, result.map)
            }
          }
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
            id,
            path,
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
      let transformed: string = code
      let map: SourceMap | null = null

      const runTransform = async (t: TransformFn, ctx: TransformContext) => {
        const result = await t(ctx)
        if (typeof result === 'string') {
          transformed = result
        } else {
          transformed = result.code
          if (result.map) {
            map = mergeSourceMap(map, result.map)
          }
        }
      }

      for (const t of transforms) {
        const transformContext: TransformContext = {
          code: transformed,
          id,
          path,
          query,
          isImport: true,
          isBuild: true
        }
        if (t.test(transformContext)) {
          await runTransform(t.transform, transformContext)
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
          await runTransform(t, {
            code: transformed,
            id,
            path,
            query: normalizedQuery,
            isImport: true,
            isBuild: true
          })
        }
      }

      return {
        code: transformed,
        map
      }
    }
  }
}
