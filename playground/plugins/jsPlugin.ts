import { Plugin } from '../../'
import MagicString from 'magic-string'

export const jsPlugin: Plugin = {
  transforms: [
    {
      test({ path }) {
        return path.endsWith('testTransform.js')
      },
      transform({ id, code }) {
        const s = new MagicString(code)

        const i = code.indexOf(`=`)
        const cur = code.substring(i + 2, i + 3)
        s.overwrite(i + 2, i + 3, String(Number(cur) + 1))
        // test source map by appending lines
        s.prepend(`\n\n\n`)
        // test if es2020 stntax works in vite.config.ts
        s?.append('') ?? null

        return {
          code: s.toString(),
          map: s.generateMap({
            source: id,
            includeContent: true
          })
        }
      }
    }
  ]
}
