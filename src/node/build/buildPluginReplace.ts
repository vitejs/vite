import { Plugin, TransformResult } from 'rollup'
import MagicString from 'magic-string'

export const createReplacePlugin = (
  test: (id: string) => boolean,
  replacements: Record<string, string>,
  sourcemap: boolean
): Plugin => {
  const replace = (code: string, replacements: Record<string, string>) => {
    const pattern = new RegExp(
      '\\b(' +
        Object.keys(replacements)
          .map((str) => {
            return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
          })
          .join('|') +
        ')\\b',
      'g'
    )
    const s = new MagicString(code)
    let hasReplaced = false
    let match

    while ((match = pattern.exec(code))) {
      hasReplaced = true
      const start = match.index
      const end = start + match[0].length
      const replacement = replacements[match[1]]
      s.overwrite(start, end, replacement)
    }

    if (!hasReplaced) {
      return null
    }

    const result: TransformResult = { code: s.toString() }
    if (sourcemap) {
      result.map = s.generateMap({ hires: true })
    }
    return result
  }

  return {
    name: 'vite:replace',
    transform(code, id) {
      if (test(id)) {
        // This part collect any import.meta.env undefined statements and replace them with an empty string
        // if it was not found and replace in the transform step. Otherwise it will fail at runtime on production.
        // It happens if the user is not defining the env variable but uses it in the codebase.
        const IMPORT_META_REGEXP = /(import\.meta\.env\.\w+)/g
        function* getImportMetaStatements(str: string) {
          while (true) {
            const match = IMPORT_META_REGEXP.exec(str)
            if (match === null) {
              break
            }
            yield match[1]
          }
        }
        const importMetaStatementsToReplace = [...getImportMetaStatements(code)]
        if (importMetaStatementsToReplace.length) {
          const replacementsWithFallback = importMetaStatementsToReplace.reduce(
            (obj, k) => ({
              ...obj,
              [k]: k in replacements ? replacements[k] : "''"
            }),
            {}
          )
          return replace(code, replacementsWithFallback)
        }
        return replace(code, replacements)
      }
    }
  }
}
