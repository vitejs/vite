import { posix } from 'node:path'
import MagicString from 'magic-string'
import { init, parse as parseImports } from 'es-module-lexer'
import type { ImportSpecifier } from 'es-module-lexer'
import { parse as parseJS } from 'acorn'
import { dynamicImportToGlob } from '@rollup/plugin-dynamic-import-vars'
import type { KnownAsTypeMap } from 'types/importGlob'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import {
  createFilter,
  normalizePath,
  parseRequest,
  removeComments,
  requestQuerySplitRE,
  transformStableResult,
} from '../utils'
import { toAbsoluteGlob } from './importMetaGlob'

export const dynamicImportHelperId = '\0vite/dynamic-import-helper'

const relativePathRE = /^\.{1,2}\//
interface DynamicImportRequest {
  as?: keyof KnownAsTypeMap
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
      reject.bind(null, new Error('Unknown variable dynamic import: ' + path)),
    )
  })
}

function parseDynamicImportPattern(
  strings: string,
): DynamicImportPattern | null {
  const filename = strings.slice(1, -1)
  const rawQuery = parseRequest(filename)
  let globParams: DynamicImportRequest | null = null
  const ast = (
    parseJS(strings, {
      ecmaVersion: 'latest',
      sourceType: 'module',
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

  if (rawQuery?.url !== undefined) {
    globParams = { as: 'url' }
  }

  if (rawQuery?.worker !== undefined) {
    globParams = { as: 'worker' }
  }

  return {
    globParams,
    userPattern,
    rawPattern,
  }
}

export async function transformDynamicImport(
  importSource: string,
  importer: string,
  resolve: (
    url: string,
    importer?: string,
  ) => Promise<string | undefined> | string | undefined,
  root: string,
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
      normalizePath(resolvedFileName),
    )
    importSource = normalizePath(
      '`' + (relativeFileName[0] === '.' ? '' : './') + relativeFileName + '`',
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

  let newRawPattern = posix.relative(
    posix.dirname(importer),
    await toAbsoluteGlob(rawPattern, root, importer, resolve),
  )

  if (!relativePathRE.test(newRawPattern)) {
    newRawPattern = `./${newRawPattern}`
  }

  const exp = `(import.meta.glob(${JSON.stringify(userPattern)}${params}))`

  return {
    rawPattern: newRawPattern,
    pattern: userPattern,
    glob: exp,
  }
}

export function dynamicImportVarsPlugin(config: ResolvedConfig): Plugin {
  const resolve = config.createResolver({
    preferRelative: true,
    tryIndex: false,
    extensions: [],
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
          d: dynamicIndex,
        } = imports[index]

        if (dynamicIndex === -1 || source[start] !== '`') {
          continue
        }

        s ||= new MagicString(source)
        let result
        try {
          // When import string is using backticks, es-module-lexer `end` captures
          // until the closing parenthesis, instead of the closing backtick.
          // There may be inline comments between the backtick and the closing
          // parenthesis, so we manually remove them for now.
          // See https://github.com/guybedford/es-module-lexer/issues/118
          const importSource = removeComments(source.slice(start, end)).trim()
          result = await transformDynamicImport(
            importSource,
            importer,
            resolve,
            config.root,
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
          `__variableDynamicImportRuntimeHelper(${glob}, \`${rawPattern}\`)`,
        )
      }

      if (s) {
        if (needDynamicImportHelper) {
          s.prepend(
            `import __variableDynamicImportRuntimeHelper from "${dynamicImportHelperId}";`,
          )
        }
        return transformStableResult(s, importer, config)
      }
    },
  }
}
