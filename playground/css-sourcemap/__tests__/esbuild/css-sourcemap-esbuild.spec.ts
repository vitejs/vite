import { describe, expect, test } from 'vitest'
import { removeSourceMappingURL } from '../utils'
import { findAssetFile, formatSourcemapForSnapshot, isBuild } from '~utils'

describe.runIf(isBuild)('css with esbuild minification', () => {
  test('remap minified css to compiled module sources', () => {
    const css = findAssetFile(/index-[-\w]+\.css$/, 'esbuild')!
    const map = JSON.parse(findAssetFile(/index-[-\w]+\.css\.map$/, 'esbuild')!)

    expect(formatSourcemapForSnapshot(removeSourceMappingURL(map), css))
      .toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "ignoreList": [],
          "mappings": "AAAA,CAAC,OCAD,aCEA,oBCFA,CAAC,SCED,sBCCE,eCFA,+BCAA,ePAA,MAAO,GACT,CQDE,iBACE,MAAM,OCFV,kBACE,SADe,CCAjB,CAAC,UACC,MAAO,IACT",
          "sources": [
            "../../../linked.css",
            "../../../be-imported.css",
            "../../../linked-with-import.css",
            "../../../imported.css",
            "../../../imported-with-import.css",
            "../../../imported.sass",
            "../../../imported.module.sass",
            "../../../imported.less",
            "../../../imported.styl",
            "../../../imported.sss",
            "../../../input-map.css",
          ],
          "sourcesContent": [
            ".linked {
        color: red;
      }
      ",
            ".be-imported {
        color: red;
      }
      ",
            "@import '@/be-imported.css';

      .linked-with-import {
        color: red;
      }
      ",
            ".imported {
        color: red;
      }
      ",
            "@import '@/be-imported.css';

      .imported-with-import {
        color: red;
      }
      ",
            "@use "/imported-nested.sass"

      .imported
        &-sass
          color: imported-nested.$primary
      ",
            ".imported
        &-sass-module
          color: red
      ",
            ".imported {
        &-less {
          color: @color;
        }
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
        visualization: "https://evanw.github.io/source-map-visualization/#MjcyAC5saW5rZWQsLmJlLWltcG9ydGVkLC5saW5rZWQtd2l0aC1pbXBvcnQsLmltcG9ydGVkLC5pbXBvcnRlZC13aXRoLWltcG9ydCwuaW1wb3J0ZWQtc2FzcywuX2ltcG9ydGVkLXNhc3MtbW9kdWxlX3IxcWNwXzEsLmltcG9ydGVkLWxlc3N7Y29sb3I6cmVkfS5pbXBvcnRlZC1zdHlsdXN7Y29sb3I6cHVycGxlfS5pbXBvcnRlZC1zdWdhcnNze2NvbG9yOnJlZH0uaW5wdXQtbWFwe2NvbG9yOiMwMGZ9CgovKiMgc291cmNlTWFwcGluZ1VSTD1pbmRleC1CYWhUTjdNaS5jc3MubWFwICovMTA3NwB7InZlcnNpb24iOjMsIm1hcHBpbmdzIjoiQUFBQSxDQUFDLE9DQUQsYUNFQSxvQkNGQSxDQUFDLFNDRUQsc0JDQ0UsZUNGQSwrQkNBQSxlUEFBLE1BQU8sR0FDVCxDUURFLGlCQUNFLE1BQU0sT0NGVixrQkFDRSxTQURlLENDQWpCLENBQUMsVUFDQyxNQUFPLElBQ1QiLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyIuLi8uLi8uLi9saW5rZWQuY3NzIiwiLi4vLi4vLi4vYmUtaW1wb3J0ZWQuY3NzIiwiLi4vLi4vLi4vbGlua2VkLXdpdGgtaW1wb3J0LmNzcyIsIi4uLy4uLy4uL2ltcG9ydGVkLmNzcyIsIi4uLy4uLy4uL2ltcG9ydGVkLXdpdGgtaW1wb3J0LmNzcyIsIi4uLy4uLy4uL2ltcG9ydGVkLnNhc3MiLCIuLi8uLi8uLi9pbXBvcnRlZC5tb2R1bGUuc2FzcyIsIi4uLy4uLy4uL2ltcG9ydGVkLmxlc3MiLCIuLi8uLi8uLi9pbXBvcnRlZC5zdHlsIiwiLi4vLi4vLi4vaW1wb3J0ZWQuc3NzIiwiLi4vLi4vLi4vaW5wdXQtbWFwLmNzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIubGlua2VkIHtcbiAgY29sb3I6IHJlZDtcbn1cbiIsIi5iZS1pbXBvcnRlZCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iLCJAaW1wb3J0ICdAL2JlLWltcG9ydGVkLmNzcyc7XG5cbi5saW5rZWQtd2l0aC1pbXBvcnQge1xuICBjb2xvcjogcmVkO1xufVxuIiwiLmltcG9ydGVkIHtcbiAgY29sb3I6IHJlZDtcbn1cbiIsIkBpbXBvcnQgJ0AvYmUtaW1wb3J0ZWQuY3NzJztcblxuLmltcG9ydGVkLXdpdGgtaW1wb3J0IHtcbiAgY29sb3I6IHJlZDtcbn1cbiIsIkB1c2UgXCIvaW1wb3J0ZWQtbmVzdGVkLnNhc3NcIlxuXG4uaW1wb3J0ZWRcbiAgJi1zYXNzXG4gICAgY29sb3I6IGltcG9ydGVkLW5lc3RlZC4kcHJpbWFyeVxuIiwiLmltcG9ydGVkXG4gICYtc2Fzcy1tb2R1bGVcbiAgICBjb2xvcjogcmVkXG4iLCIuaW1wb3J0ZWQge1xuICAmLWxlc3Mge1xuICAgIGNvbG9yOiBAY29sb3I7XG4gIH1cbn1cbiIsIi5pbXBvcnRlZFxuICAmLXN0eWx1c1xuICAgIGNvbG9yIGJsdWUtcmVkLW1peGVkXG4iLCIuaW1wb3J0ZWQtc3VnYXJzc1xuICBjb2xvcjogcmVkXG4iLCIuaW5wdXQtbWFwIHtcbiAgY29sb3I6ICMwMGY7XG59XG4iXX0="
      }
    `)
  })
})
