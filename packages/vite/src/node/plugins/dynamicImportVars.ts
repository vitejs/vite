import { posix } from 'path'
import MagicString from 'magic-string'
import { init, parse as parseImports } from 'es-module-lexer'
import type { ImportSpecifier } from 'es-module-lexer'
import { parse as parseJS } from 'acorn'
import { createFilter } from '@rollup/pluginutils'
import { dynamicImportToGlob } from '@rollup/plugin-dynamic-import-vars'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import {
  normalizePath,
  parseRequest,
  requestQuerySplitRE,
  transformResult
} from '../utils'

export const dynamicImportHelperId = '/@vite/dynamic-import-helper'

interface DynamicImportRequest {
  as?: 'raw'
}

interface DynamicImportPattern {
  globParams: DynamicImportRequest | null
  userPattern: string
  rawPattern: string
}

const dynamicImportHelper = (glob: Record<string, any>, path: string) => {
  const v = glob[path]
  if (v) {
    return typeof v === 'function' ? v() : Promise.resolve(v)
  }
  return new Promise((_, reject) => {
    ;(typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
      reject.bind(null, new Error('Unknown variable dynamic import: ' + path))
    )
  })
}

function parseDynamicImportPattern(
  strings: string
): DynamicImportPattern | null {
  const filename = strings.slice(1, -1)
  const rawQuery = parseRequest(filename)
  let globParams: DynamicImportRequest | null = null
  const ast = (
    parseJS(strings, {
      ecmaVersion: 'latest',
      sourceType: 'module'
    }) as any
  ).body[0].expression

  const userPatternQuery = dynamicImportToGlob(ast, filename)
  if (!userPatternQuery) {
    return null
  }

  const [userPattern] = userPatternQuery.split(requestQuerySplitRE, 2)
  const [rawPattern] = filename.split(requestQuerySplitRE, 2)

  if (rawQuery?.raw !== undefined) {
    globParams = { as: 'raw' }
  }

  return {
    globParams,
    userPattern,
    rawPattern
  }
}

export async function transformDynamicImport(
  importSource: string,
  importer: string,
  resolve: (
    url: string,
    importer?: string
  ) => Promise<string | undefined> | string | undefined
): Promise<{
  glob: string
  pattern: string
  rawPattern: string
} | null> {
  if (importSource[1] !== '.' && importSource[1] !== '/') {
    const resolvedFileName = await resolve(importSource.slice(1, -1), importer)
    if (!resolvedFileName) {
      return null
    }
    const relativeFileName = posix.relative(
      posix.dirname(normalizePath(importer)),
      normalizePath(resolvedFileName)
    )
    importSource = normalizePath(
      '`' + (relativeFileName[0] === '.' ? '' : './') + relativeFileName + '`'
    )
  }

  const dynamicImportPattern = parseDynamicImportPattern(importSource)
  if (!dynamicImportPattern) {
    return null
  }
  const { globParams, rawPattern, userPattern } = dynamicImportPattern
  const params = globParams
    ? `, ${JSON.stringify({ ...globParams, import: '*' })}`
    : ''
  const exp = `(import.meta.glob(${JSON.stringify(userPattern)}${params}))`

  return {
    rawPattern,
    pattern: userPattern,
    glob: exp
  }
}

export function dynamicImportVarsPlugin(config: ResolvedConfig): Plugin {
  const resolve = config.createResolver({
    preferRelative: true,
    tryIndex: false,
    extensions: []
  })
  const { include, exclude, warnOnError } =
    config.build.dynamicImportVarsOptions
  const filter = createFilter(include, exclude)

  return {
    name: 'vite:dynamic-import-vars',

    resolveId(id) {
      if (id === dynamicImportHelperId) {
        return id
      }
    },

    load(id) {
      if (id === dynamicImportHelperId) {
        return 'export default ' + dynamicImportHelper.toString()
      }
    },

    async transform(source, importer) {
      if (!filter(importer)) {
        return
      }

      await init

      let imports: readonly ImportSpecifier[] = []
      try {
        imports = parseImports(source)[0]
      } catch (e: any) {
        // ignore as it might not be a JS file, the subsequent plugins will catch the error
        return null
      }

      if (!imports.length) {
        return null
      }

      let s: MagicString | undefined
      let needDynamicImportHelper = false

      for (let index = 0; index < imports.length; index++) {
        const {
          s: start,
          e: end,
          ss: expStart,
          se: expEnd,
          d: dynamicIndex
        } = imports[index]

        if (dynamicIndex === -1 || source[start] !== '`') {
          continue
        }

        s ||= new MagicString(source)
        let result
        try {
          result = await transformDynamicImport(
            source.slice(start, end),
            importer,
            resolve
          )
        } catch (error) {
          if (warnOnError) {
            this.warn(error)
          } else {
            this.error(error)
          }
        }

        if (!result) {
          continue
        }

        const { rawPattern, glob } = result

        needDynamicImportHelper = true
        s.overwrite(
          expStart,
          expEnd,
          `__variableDynamicImportRuntimeHelper(${glob}, \`${rawPattern}\`)`
        )
      }

      if (s) {
        if (needDynamicImportHelper) {
          s.prepend(
            `import __variableDynamicImportRuntimeHelper from "${dynamicImportHelperId}";`
          )
        }
        return transformResult(s, importer, config)
      }
    }
  }
}
