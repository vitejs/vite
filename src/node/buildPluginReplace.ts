import { Plugin, TransformResult } from 'rollup'
import MagicString from 'magic-string'

const filter = /\.(j|t)sx?$/

export const createReplacePlugin = (
  replacements: Record<string, string>
): Plugin => {
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

  return {
    name: 'vite:replace',
    transform(code, id) {
      if (filter.test(id)) {
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
        // TODO source map
        // result.map = s.generateMap({ hires: true })
        return result
      }
    }
  }
}
