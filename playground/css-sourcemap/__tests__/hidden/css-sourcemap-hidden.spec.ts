import { describe, expect, test } from 'vitest'
import { removeSourceMappingURL } from '../utils'
import { findAssetFile, formatSourcemapForSnapshot, isBuild } from '~utils'

describe.runIf(isBuild)('css with hidden sourcemap', () => {
  test('emit css sourcemap without a comment', () => {
    const css = findAssetFile(/index-[-\w]+\.css$/, 'hidden')
    expect(css).not.toContain('sourceMappingURL')

    const map = JSON.parse(findAssetFile(/index-[-\w]+\.css\.map$/, 'hidden')!)
    expect(formatSourcemapForSnapshot(removeSourceMappingURL(map), css!))
      .toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "ignoreList": [],
          "mappings": "AAAA,6JCCE,8BCDF,4BCAA",
          "sources": [
            "../../../linked.css",
            "../../../imported.styl",
            "../../../imported.sss",
            "../../../input-map.css",
          ],
          "sourcesContent": [
            ".linked {
        color: red;
      }
      ",
            ".imported
        &-stylus
          color blue-red-mixed
      ",
            ".imported-sugarss
        color: red
      ",
            ".input-map {
        color: #00f;
      }
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MjM4AC5saW5rZWQsLmJlLWltcG9ydGVkLC5saW5rZWQtd2l0aC1pbXBvcnQsLmltcG9ydGVkLC5iZS1pbXBvcnRlZCwuaW1wb3J0ZWQtd2l0aC1pbXBvcnQsLmltcG9ydGVkLXNhc3MsLl9pbXBvcnRlZC1zYXNzLW1vZHVsZV9yMXFjcF8xLC5pbXBvcnRlZC1sZXNze2NvbG9yOnJlZH0uaW1wb3J0ZWQtc3R5bHVze2NvbG9yOnB1cnBsZX0uaW1wb3J0ZWQtc3VnYXJzc3tjb2xvcjpyZWR9LmlucHV0LW1hcHtjb2xvcjojMDBmfQozNDgAeyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6IkFBQUEsNkpDQ0UsOEJDREYsNEJDQUEiLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyIuLi8uLi8uLi9saW5rZWQuY3NzIiwiLi4vLi4vLi4vaW1wb3J0ZWQuc3R5bCIsIi4uLy4uLy4uL2ltcG9ydGVkLnNzcyIsIi4uLy4uLy4uL2lucHV0LW1hcC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiLmxpbmtlZCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iLCIuaW1wb3J0ZWRcbiAgJi1zdHlsdXNcbiAgICBjb2xvciBibHVlLXJlZC1taXhlZFxuIiwiLmltcG9ydGVkLXN1Z2Fyc3NcbiAgY29sb3I6IHJlZFxuIiwiLmlucHV0LW1hcCB7XG4gIGNvbG9yOiAjMDBmO1xufVxuIl19"
      }
    `)
  })
})
