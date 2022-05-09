import MagicString from 'magic-string'
import { init, parse as parseImports } from 'es-module-lexer'
import type { ImportSpecifier } from 'es-module-lexer'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import { createFilter } from '@rollup/pluginutils'

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
export const dynamicImportHelperId = '/@vite/dynamic-import-helper'

export async function transformDynamicImportGlob(
  source: string,
  importer: string,
  start: number,
  end: number,
  resolve?: (url: string, importer?: string) => Promise<string | undefined>
): Promise<{
  exp: string
  pattern: string
  rawPattern: string
} | null> {
  const err = (msg: string) => {
    const e = new Error(`Invalid dynamic import syntax: ${msg}`)
    ;(e as any).pos = start
    return e
  }
  let fileName = source.slice(start, end)

  if (fileName[1] !== '.' && fileName[1] !== '/' && resolve) {
    const resolvedFileName = await resolve(fileName.slice(1, -1), importer)
    if (!resolvedFileName) {
      return null
    }
    const relativeFileName = path.posix.relative(
      path.dirname(importer),
      resolvedFileName
    )
    fileName = `\`${relativeFileName}\``
  }

  const dynamicImportPattern = parseDynamicImportPattern(fileName)
  if (!dynamicImportPattern) {
    return null
  }
  const { query, rawPattern, userPattern } = dynamicImportPattern

  return {
    rawPattern,
    pattern: userPattern,
    exp: `import.meta.glob(${JSON.stringify(userPattern)})`
  }
}

export function dynamicImportHelperPlugin(): Plugin {
  return {
    name: 'vite:dynamic-import-helper',
    resolveId(id) {
      if (id === dynamicImportHelperId) {
        return id
      }
    },

    load(id) {
      if (id === dynamicImportHelperId) {
        return 'export default' + dynamicImportHelper.toString()
      }
    }
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

    async transform(source, importer) {
      if (!filter(importer)) {
        return
      }

      await init

      let imports: readonly ImportSpecifier[] = []
      try {
        imports = parseImports(source)[0]
      } catch (e: any) {
        this.error(e, e.idx)
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
          result = await transformDynamicImportGlob(
            source,
            importer,
            start,
            end,
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

        const { rawPattern, exp } = result

        needDynamicImportHelper = true
        s.overwrite(
          expStart,
          expEnd,
          `__variableDynamicImportRuntimeHelper(${exp}, \`${rawPattern}\`)`
        )
      }

      if (s) {
        if (needDynamicImportHelper) {
          s.prepend(
            `import __variableDynamicImportRuntimeHelper from "${dynamicImportHelperId}";`
          )
        }
        return {
          code: s.toString(),
          map: config.build.sourcemap ? s.generateMap({ hires: true }) : null
        }
      }
    }
  }
}
