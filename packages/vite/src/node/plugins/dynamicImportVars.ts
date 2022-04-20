import MagicString from 'magic-string'
import { init, parse as parseImports } from 'es-module-lexer'
import type { ImportSpecifier } from 'es-module-lexer'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import { transformDynamicImportGlob } from '../importGlob'
import { createFilter } from '@rollup/pluginutils'

export function dynamicImportVars(config: ResolvedConfig): Plugin {
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
      let importIndex = 0
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
            expStart,
            expEnd,
            importer,
            start,
            end,
            config.root,
            undefined,
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

        s.prepend(`function __variableDynamicImportRuntime_${importIndex}_(path) {
          const glob = ${exp}
          const v = glob[path]
          if (v) {
            return typeof v === 'function' ? v() : Promise.resolve(v)
          }
          return new Promise((resolve, reject) => {
            (typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
              reject.bind(null, new Error("Unknown variable dynamic import: " + path))
            );
          })
        }\n`)
        s.overwrite(
          expStart,
          expEnd,
          `__variableDynamicImportRuntime_${importIndex}_(\`${rawPattern}\`)`
        )
        importIndex++
      }

      if (s) {
        return {
          code: s.toString(),
          map: config.build.sourcemap ? s.generateMap({ hires: true }) : null
        }
      }
    }
  }
}
