import path from 'path'
import glob from 'fast-glob'
import { ResolvedConfig } from '../config'
import { Plugin } from '../plugin'
import { cleanUrl } from '../utils'
import MagicString from 'magic-string'
import { ImportSpecifier, init, parse as parseImports } from 'es-module-lexer'
import { RollupError, OutputChunk } from 'rollup'
import { chunkToEmittedCssFileMap } from './css'

/**
 * A flag for injected helpers. This flag will be set to `false` if the output
 * target is not native es - so that injected helper logic can be conditinally
 * dropped.
 */
export const isModernFlag = `__VITE_IS_MODERN__`

const preloadHelperId = 'vite/preload-helper'
const preloadMethod = __vitePreload.name
const preloadModuleCode = `const seen = new Set();export ${__vitePreload.toString()}`
const preloadMarker = `__VITE_PRELOAD__`
const preloadMarkerRE = new RegExp(`,?"${preloadMarker}"`, 'g')

/**
 * Helper for preloading CSS and direct imports of async chunks in parallell to
 * the async chunk itself.
 */
function __vitePreload(baseModule: () => Promise<{}>, deps?: string[]) {
  // @ts-ignore
  if (!__VITE_IS_MODERN__ || !deps) {
    return baseModule()
  }
  return Promise.all(
    deps.map((dep) => {
      // @ts-ignore
      if (seen.has(dep)) return
      // @ts-ignore
      seen.add(dep)
      // @ts-ignore
      const link = document.createElement('link')
      const isCss = /\.css$/.test(dep)
      link.rel = isCss
        ? 'stylesheet'
        : link.relList &&
          link.relList.supports &&
          link.relList.supports('modulepreload')
        ? 'modulepreload'
        : 'preload'
      if (!isCss) {
        link.as = 'script'
        link.crossOrigin = ''
      }
      link.href = dep
      // @ts-ignore
      document.head.appendChild(link)
      if (isCss) {
        return new Promise((res) => {
          link.addEventListener('load', res)
        })
      }
    })
  ).then(() => baseModule())
}

/**
 * Build only. During serve this is performed as part of ./importAnalysis.
 */
export function buildImportAnalysisPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:import-analysis',

    resolveId(id) {
      if (id === preloadHelperId) {
        return id
      }
    },

    load(id) {
      if (id === preloadHelperId) {
        return preloadModuleCode
      }
    },

    async transform(source, importer) {
      if (importer.includes('node_modules')) {
        return
      }

      await init

      let imports: ImportSpecifier[] = []
      try {
        imports = parseImports(source)[0]
      } catch (e) {
        this.error(e, e.idx)
      }

      if (!imports.length) {
        return null
      }

      let s: MagicString | undefined
      const str = () => s || (s = new MagicString(source))
      let hasInjectedHelper = false

      for (let index = 0; index < imports.length; index++) {
        const { s: start, e: end, ss: expStart, d: dynamicIndex } = imports[
          index
        ]

        const isGlob =
          source.slice(start, end) === 'import.meta' &&
          source.slice(end, end + 5) === '.glob'

        if (isGlob || dynamicIndex > -1) {
          // inject parallelPreload helper.
          if (!hasInjectedHelper) {
            hasInjectedHelper = true
            str().prepend(
              `import { ${preloadMethod} } from "${preloadHelperId}";`
            )
          }
        }

        // import.meta.glob
        if (isGlob) {
          const { imports, exp, endIndex } = await transformImportGlob(
            source,
            start,
            importer,
            index
          )
          str().prepend(imports)
          str().overwrite(expStart, endIndex, exp)
          continue
        }

        if (dynamicIndex > -1) {
          const dynamicEnd = source.indexOf(`)`, end) + 1
          const original = source.slice(dynamicIndex, dynamicEnd)
          str().overwrite(
            dynamicIndex,
            dynamicEnd,
            `${preloadMethod}(()=>${original}${
              isModernFlag ? `,"${preloadMarker}"` : ``
            })`
          )
        }
      }

      if (s) {
        return {
          code: s.toString(),
          map: config.build.sourcemap ? s.generateMap({ hires: true }) : null
        }
      }
    },

    renderChunk(code, _, { format }) {
      // make sure we only perform the preload logic in modern builds.
      if (code.indexOf(isModernFlag) > -1) {
        return code.replace(/__VITE_IS_MODERN__/g, String(format === 'es'))
      }
      return null
    },

    generateBundle({ format }, bundle) {
      if (format !== 'es') {
        return
      }

      const isPolyfillEnabled = config.build.polyfillDynamicImport
      for (const file in bundle) {
        const chunk = bundle[file]
        // can't use chunk.dynamicImports.length here since some modules e.g.
        // dynamic import to constant json may get inlined.
        if (chunk.type === 'chunk' && chunk.code.indexOf(preloadMarker) > -1) {
          const code = chunk.code
          let imports: ImportSpecifier[]
          try {
            imports = parseImports(code)[0]
          } catch (e) {
            this.error(e, e.idx)
          }

          if (imports.length) {
            const s = new MagicString(code)
            for (let index = 0; index < imports.length; index++) {
              const { s: start, e: end, d: dynamicIndex } = imports[index]
              if (dynamicIndex > -1) {
                // if dynmamic import polyfill is used, rewrite the import to
                // use the polyfilled function.
                if (isPolyfillEnabled) {
                  s.overwrite(dynamicIndex, dynamicIndex + 6, `__import__`)
                }
                // check the chunk being imported
                const url = code.slice(start, end)
                if (url[0] !== `"` || url[url.length - 1] !== `"`) {
                  // non literal chunk import, skip
                  continue
                }

                const deps: Set<string> = new Set()

                // trace direct imports and add to deps
                const addDeps = (filename: string) => {
                  const chunk = bundle[filename] as OutputChunk | undefined
                  if (chunk) {
                    deps.add(config.build.base + chunk.fileName)
                    const cssId = chunkToEmittedCssFileMap.get(chunk)
                    if (cssId) {
                      deps.add(config.build.base + this.getFileName(cssId))
                    }
                    chunk.imports.forEach(addDeps)
                  }
                }
                const normalizedFile = path.posix.join(
                  path.posix.dirname(chunk.fileName),
                  url.slice(1, -1)
                )
                addDeps(normalizedFile)

                const markPos = code.indexOf(preloadMarker, end)
                s.overwrite(
                  markPos - 1,
                  markPos + preloadMarker.length + 1,
                  deps.size
                    ? `[${[...deps].map((d) => JSON.stringify(d)).join(',')}]`
                    : ``
                )
              }
            }
            chunk.code = s.toString()
            // TODO source map
          } else {
            // inlined dynamic import, remove the marker
            chunk.code = code.replace(preloadMarkerRE, 'void 0')
          }
        }
      }
    }
  }
}

export async function transformImportGlob(
  source: string,
  pos: number,
  importer: string,
  importIndex: number,
  normalizeUrl?: (url: string, pos: number) => Promise<[string, string]>
): Promise<{ imports: string; exp: string; endIndex: number }> {
  const err = (msg: string) => {
    const e = new Error(`Invalid glob import syntax: ${msg}`)
    ;(e as any).pos = pos
    return e
  }

  importer = cleanUrl(importer)
  const importerBasename = path.basename(importer)

  let [pattern, endIndex] = lexGlobPattern(source, pos)
  if (!pattern.startsWith('.')) {
    throw err(`pattern must start with "."`)
  }
  let base = path.dirname(importer)
  let parentDepth = 0
  while (pattern.startsWith('../')) {
    pattern = pattern.slice(3)
    base = path.resolve(base, '../')
    parentDepth++
  }
  if (pattern.startsWith('./')) {
    pattern = pattern.slice(2)
  }

  const files = glob.sync(pattern, { cwd: base })
  let imports = ``
  let entries = ``
  for (let i = 0; i < files.length; i++) {
    // skip importer itself
    if (files[i] === importerBasename) continue
    const file = parentDepth
      ? `${'../'.repeat(parentDepth)}${files[i]}`
      : `./${files[i]}`
    let importee = file
    if (normalizeUrl) {
      ;[importee] = await normalizeUrl(file, pos)
    }
    const identifier = `__glob_${importIndex}_${i}`
    const isEager = source.slice(pos, pos + 21) === 'import.meta.globEager'
    if (isEager) {
      imports += `import * as ${identifier} from ${JSON.stringify(importee)};`
      entries += ` ${JSON.stringify(file)}: ${identifier},`
    } else {
      let imp = `import(${JSON.stringify(importee)})`
      if (!normalizeUrl) {
        imp =
          `(${isModernFlag}` +
          `? ${preloadMethod}(()=>${imp},"${preloadMarker}")` +
          `: ${imp})`
      }
      entries += ` ${JSON.stringify(file)}: () => ${imp},`
    }
  }

  return {
    imports,
    exp: `{${entries}}`,
    endIndex
  }
}

const enum LexerState {
  inCall,
  inSingleQuoteString,
  inDoubleQuoteString,
  inTemplateString
}

function lexGlobPattern(code: string, pos: number): [string, number] {
  let state = LexerState.inCall
  let pattern = ''

  let i = code.indexOf(`(`, pos) + 1
  outer: for (; i < code.length; i++) {
    const char = code.charAt(i)
    switch (state) {
      case LexerState.inCall:
        if (char === `'`) {
          state = LexerState.inSingleQuoteString
        } else if (char === `"`) {
          state = LexerState.inDoubleQuoteString
        } else if (char === '`') {
          state = LexerState.inTemplateString
        } else if (/\s/.test(char)) {
          continue
        } else {
          error(i)
        }
        break
      case LexerState.inSingleQuoteString:
        if (char === `'`) {
          break outer
        } else {
          pattern += char
        }
        break
      case LexerState.inDoubleQuoteString:
        if (char === `"`) {
          break outer
        } else {
          pattern += char
        }
        break
      case LexerState.inTemplateString:
        if (char === '`') {
          break outer
        } else {
          pattern += char
        }
        break
      default:
        throw new Error('unknown import.meta.glob lexer state')
    }
  }
  return [pattern, code.indexOf(`)`, i) + 1]
}

function error(pos: number) {
  const err = new Error(
    `import.meta.glob() can only accept string literals.`
  ) as RollupError
  err.pos = pos
  throw err
}
