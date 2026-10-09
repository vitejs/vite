import { describe, expect, test } from 'vitest'
import {
  extractSourcemap,
  findAssetFile,
  formatSourcemapForSnapshot,
  isBuild,
} from '~utils'
import { removeSourceMappingURL } from '../utils'

describe.runIf(isBuild)('css with inline sourcemap', () => {
  test('inline css sourcemap without emitting a map asset', () => {
    const css = findAssetFile(/index-[-\w]+\.css$/, 'inline')!
    expect(css).toMatch(
      /\/\*# sourceMappingURL=data:application\/json(?:;charset=utf-8)?;base64,/,
    )
    expect(findAssetFile(/\.css\.map$/, 'inline')).toBeUndefined()

    expect(
      formatSourcemapForSnapshot(
        removeSourceMappingURL(extractSourcemap(css)),
        css,
      ),
    ).toMatchInlineSnapshot(`
      SourceMap {
        content: {
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
        visualization: "https://evanw.github.io/source-map-visualization/#MjM4AC5saW5rZWQsLmJlLWltcG9ydGVkLC5saW5rZWQtd2l0aC1pbXBvcnQsLmltcG9ydGVkLC5iZS1pbXBvcnRlZCwuaW1wb3J0ZWQtd2l0aC1pbXBvcnQsLmltcG9ydGVkLXNhc3MsLl9pbXBvcnRlZC1zYXNzLW1vZHVsZV9yMXFjcF8xLC5pbXBvcnRlZC1sZXNze2NvbG9yOnJlZH0uaW1wb3J0ZWQtc3R5bHVze2NvbG9yOnB1cnBsZX0uaW1wb3J0ZWQtc3VnYXJzc3tjb2xvcjpyZWR9LmlucHV0LW1hcHtjb2xvcjojMDBmfQozMzIAeyJtYXBwaW5ncyI6IkFBQUEsNkpDQ0UsOEJDREYsNEJDQUEiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpbmtlZC5jc3MiLCIuLi8uLi8uLi9pbXBvcnRlZC5zdHlsIiwiLi4vLi4vLi4vaW1wb3J0ZWQuc3NzIiwiLi4vLi4vLi4vaW5wdXQtbWFwLmNzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIubGlua2VkIHtcbiAgY29sb3I6IHJlZDtcbn1cbiIsIi5pbXBvcnRlZFxuICAmLXN0eWx1c1xuICAgIGNvbG9yIGJsdWUtcmVkLW1peGVkXG4iLCIuaW1wb3J0ZWQtc3VnYXJzc1xuICBjb2xvcjogcmVkXG4iLCIuaW5wdXQtbWFwIHtcbiAgY29sb3I6ICMwMGY7XG59XG4iXSwidmVyc2lvbiI6M30="
      }
    `)
  })
})
