import path from 'path'
import _debug from 'debug'
import { Plugin } from '..'
import chalk from 'chalk'
import { FILE_PREFIX } from './resolve'
import MagicString from 'magic-string'
import { init, parse, ImportSpecifier } from 'es-module-lexer'

const debugRewrite = _debug('vite:rewrite')

const canSkip = new Set([
  '.map',
  '.json',
  '.css',
  '.less',
  '.sass',
  '.scss',
  '.styl',
  '.stylus'
])

export function rewritePlugin(): Plugin {
  return {
    name: 'vite:rewrite',
    async transform(source, importer) {
      if (canSkip.has(path.extname(importer))) {
        return null
      }

      await init
      let imports: ImportSpecifier[] = []
      try {
        imports = parse(source)[0]
      } catch (e) {
        console.warn(
          chalk.yellow(
            `[vite] failed to parse ${chalk.cyan(
              importer
            )} for import rewrite.\nIf you are using ` +
              `JSX, make sure to named the file with the .jsx extension.`
          )
        )
        return source
      }

      if (!imports.length) {
        debugRewrite(`${importer}: no imports found.`)
        return source
      }

      let s: MagicString | undefined
      for (let i = 0; i < imports.length; i++) {
        const { s: start, e: end, d: dynamicIndex } = imports[i]
        let id = source.substring(start, end)
        const hasViteIgnore = /\/\*\s*@vite-ignore\s*\*\//.test(id)
        let hasLiteralDynamicId = false
        if (dynamicIndex >= 0) {
          // #998 remove comment
          id = id.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '')
          const literalIdMatch = id.match(/^\s*(?:'([^']+)'|"([^"]+)")\s*$/)
          if (literalIdMatch) {
            hasLiteralDynamicId = true
            id = literalIdMatch[1] || literalIdMatch[2]
          }
        }
        if (dynamicIndex === -1 || hasLiteralDynamicId) {
          if (id[0] !== '/' && id[0] !== '.') {
            const resolved = await this.resolve(id)
            if (resolved) {
              const prefixed = FILE_PREFIX + resolved.id
              ;(s || (s = new MagicString(source))).overwrite(
                start,
                end,
                hasLiteralDynamicId ? `'${prefixed}'` : prefixed
              )
            } else {
              console.warn(
                chalk.yellow(`[vite] cannot resolve bare import "${id}".`)
              )
            }
          }
        } else if (id !== 'import.meta' && !hasViteIgnore) {
          console.warn(
            chalk.yellow(`[vite] ignored dynamic import(${id}) in ${importer}.`)
          )
        }
      }

      // TODO env?
      // if (hasEnv) {
      //   debug(`    injecting import.meta.env for ${importer}`)
      //   s.prepend(
      //     `import __VITE_ENV__ from "${envPublicPath}"; ` +
      //       `import.meta.env = __VITE_ENV__; `
      //   )
      //   hasReplaced = true
      // }

      if (!s) {
        debugRewrite(`nothing needs rewriting.`)
      }

      // TODO source map
      return s ? s.toString() : source
    }
  }
}
