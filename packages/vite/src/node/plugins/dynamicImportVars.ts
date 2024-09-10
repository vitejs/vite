import { posix } from 'node:path'
import MagicString from 'magic-string'
import { init, parse as parseImports } from 'es-module-lexer'
import type { ImportSpecifier } from 'es-module-lexer'
import { parseAst } from 'rollup/parseAst'
import { dynamicImportToGlob } from '@rollup/plugin-dynamic-import-vars'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import { CLIENT_ENTRY } from '../constants'
import { createBackCompatIdResolver } from '../idResolver'
import {
  createFilter,
  normalizePath,
  rawRE,
  requestQueryMaybeEscapedSplitRE,
  requestQuerySplitRE,
  transformStableResult,
  urlRE,
} from '../utils'
import type { Environment } from '../environment'
import { usePerEnvironmentState } from '../environment'
import { hasViteIgnoreRE } from './importAnalysis'
import { workerOrSharedWorkerRE } from './worker'

export const dynamicImportHelperId = '\0vite/dynamic-import-helper.js'

const relativePathRE = /^\.{1,2}\//
// fast path to check if source contains a dynamic import. we check for a
// trailing slash too as a dynamic import statement can have comments between
// the `import` and the `(`.
const hasDynamicImportRE = /\bimport\s*[(/]/

interface DynamicImportRequest {
  query?: string | Record<string, string>
  import?: string
}

interface DynamicImportPattern {
  globParams: DynamicImportRequest | null
  userPattern: string
  rawPattern: string
}

const dynamicImportHelper = (
  glob: Record<string, any>,
  path: string,
  segs: number,
) => {
  const v = glob[path]
  if (v) {
    return typeof v === 'function' ? v() : Promise.resolve(v)
  }
  return new Promise((_, reject) => {
    ;(typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
      reject.bind(
        null,
        new Error(
          'Unknown variable dynamic import: ' +
            path +
            (path.split('/').length !== segs
              ? '. Note that variables only represent file names one level deep.'
              : ''),
        ),
      ),
    )
  })
}

function parseDynamicImportPattern(
  strings: string,
): DynamicImportPattern | null {
  const filename = strings.slice(1, -1)
  const ast = (parseAst(strings).body[0] as any).expression

  const userPatternQuery = dynamicImportToGlob(ast, filename)
  if (!userPatternQuery) {
    return null
  }

  const [userPattern] = userPatternQuery.split(
    // ? is escaped on posix OS
    requestQueryMaybeEscapedSplitRE,
    2,
  )
  let [rawPattern, search] = filename.split(requestQuerySplitRE, 2)
  let globParams: DynamicImportRequest | null = null
  if (search) {
    search = '?' + search
    if (
      workerOrSharedWorkerRE.test(search) ||
      urlRE.test(search) ||
      rawRE.test(search)
    ) {
      globParams = {
        query: search,
        import: '*',
      }
    } else {
      globParams = {
        query: search,
      }
    }
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
    const relativeFileName = normalizePath(
      posix.relative(
        posix.dirname(normalizePath(importer)),
        normalizePath(resolvedFileName),
      ),
    )
    importSource =
      '`' + (relativeFileName[0] === '.' ? '' : './') + relativeFileName + '`'
  }

  const dynamicImportPattern = parseDynamicImportPattern(importSource)
  if (!dynamicImportPattern) {
    return null
  }
  const { globParams, rawPattern, userPattern } = dynamicImportPattern
  const params = globParams ? `, ${JSON.stringify(globParams)}` : ''
  const dir = importer ? posix.dirname(importer) : root
  const normalized =
    rawPattern[0] === '/'
      ? posix.join(root, rawPattern.slice(1))
      : posix.join(dir, rawPattern)

  let newRawPattern = posix.relative(posix.dirname(importer), normalized)

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
  const resolve = createBackCompatIdResolver(config, {
    preferRelative: true,
    tryIndex: false,
    extensions: [],
  })

  const getFilter = usePerEnvironmentState((environment: Environment) => {
    const { include, exclude } =
      environment.config.build.dynamicImportVarsOptions
    return createFilter(include, exclude)
  })

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
      const { environment } = this
      if (
        !getFilter(this)(importer) ||
        importer === CLIENT_ENTRY ||
        !hasDynamicImportRE.test(source)
      ) {
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

        if (hasViteIgnoreRE.test(source.slice(expStart, expEnd))) {
          continue
        }

        s ||= new MagicString(source)
        let result
        try {
          result = await transformDynamicImport(
            source.slice(start, end),
            importer,
            (id, importer) => resolve(environment, id, importer),
            config.root,
          )
        } catch (error) {
          if (environment.config.build.dynamicImportVarsOptions.warnOnError) {
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
          `__variableDynamicImportRuntimeHelper(${glob}, \`${rawPattern}\`, ${rawPattern.split('/').length})`,
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
