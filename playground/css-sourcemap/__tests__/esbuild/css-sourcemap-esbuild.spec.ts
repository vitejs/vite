import { describe, expect, test } from 'vitest'
import { findAssetFile, formatSourcemapForSnapshot, isBuild } from '~utils'
import { removeSourceMappingURL } from '../utils'

describe.runIf(isBuild)('css with esbuild minification', () => {
  test('remap minified css to compiled module sources', () => {
    const css = findAssetFile(/index-[-\w]+\.css$/, 'esbuild')!
    const map = JSON.parse(findAssetFile(/index-[-\w]+\.css\.map$/, 'esbuild')!)

    expect(formatSourcemapForSnapshot(removeSourceMappingURL(map), css))
      .toMatchInlineSnapshot(`
        SourceMap {
          content: {
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
          visualization: "https://evanw.github.io/source-map-visualization/#MjcyAC5saW5rZWQsLmJlLWltcG9ydGVkLC5saW5rZWQtd2l0aC1pbXBvcnQsLmltcG9ydGVkLC5pbXBvcnRlZC13aXRoLWltcG9ydCwuaW1wb3J0ZWQtc2FzcywuX2ltcG9ydGVkLXNhc3MtbW9kdWxlX3IxcWNwXzEsLmltcG9ydGVkLWxlc3N7Y29sb3I6cmVkfS5pbXBvcnRlZC1zdHlsdXN7Y29sb3I6cHVycGxlfS5pbXBvcnRlZC1zdWdhcnNze2NvbG9yOnJlZH0uaW5wdXQtbWFwe2NvbG9yOiMwMGZ9CgovKiMgc291cmNlTWFwcGluZ1VSTD1pbmRleC1CYWhUTjdNaS5jc3MubWFwICovMTA2MQB7Im1hcHBpbmdzIjoiQUFBQSxDQUFDLE9DQUQsYUNFQSxvQkNGQSxDQUFDLFNDRUQsc0JDQ0UsZUNGQSwrQkNBQSxlUEFBLE1BQU8sR0FDVCxDUURFLGlCQUNFLE1BQU0sT0NGVixrQkFDRSxTQURlLENDQWpCLENBQUMsVUFDQyxNQUFPLElBQ1QiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpbmtlZC5jc3MiLCIuLi8uLi8uLi9iZS1pbXBvcnRlZC5jc3MiLCIuLi8uLi8uLi9saW5rZWQtd2l0aC1pbXBvcnQuY3NzIiwiLi4vLi4vLi4vaW1wb3J0ZWQuY3NzIiwiLi4vLi4vLi4vaW1wb3J0ZWQtd2l0aC1pbXBvcnQuY3NzIiwiLi4vLi4vLi4vaW1wb3J0ZWQuc2FzcyIsIi4uLy4uLy4uL2ltcG9ydGVkLm1vZHVsZS5zYXNzIiwiLi4vLi4vLi4vaW1wb3J0ZWQubGVzcyIsIi4uLy4uLy4uL2ltcG9ydGVkLnN0eWwiLCIuLi8uLi8uLi9pbXBvcnRlZC5zc3MiLCIuLi8uLi8uLi9pbnB1dC1tYXAuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIi5saW5rZWQge1xuICBjb2xvcjogcmVkO1xufVxuIiwiLmJlLWltcG9ydGVkIHtcbiAgY29sb3I6IHJlZDtcbn1cbiIsIkBpbXBvcnQgJ0AvYmUtaW1wb3J0ZWQuY3NzJztcblxuLmxpbmtlZC13aXRoLWltcG9ydCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iLCIuaW1wb3J0ZWQge1xuICBjb2xvcjogcmVkO1xufVxuIiwiQGltcG9ydCAnQC9iZS1pbXBvcnRlZC5jc3MnO1xuXG4uaW1wb3J0ZWQtd2l0aC1pbXBvcnQge1xuICBjb2xvcjogcmVkO1xufVxuIiwiQHVzZSBcIi9pbXBvcnRlZC1uZXN0ZWQuc2Fzc1wiXG5cbi5pbXBvcnRlZFxuICAmLXNhc3NcbiAgICBjb2xvcjogaW1wb3J0ZWQtbmVzdGVkLiRwcmltYXJ5XG4iLCIuaW1wb3J0ZWRcbiAgJi1zYXNzLW1vZHVsZVxuICAgIGNvbG9yOiByZWRcbiIsIi5pbXBvcnRlZCB7XG4gICYtbGVzcyB7XG4gICAgY29sb3I6IEBjb2xvcjtcbiAgfVxufVxuIiwiLmltcG9ydGVkXG4gICYtc3R5bHVzXG4gICAgY29sb3IgYmx1ZS1yZWQtbWl4ZWRcbiIsIi5pbXBvcnRlZC1zdWdhcnNzXG4gIGNvbG9yOiByZWRcbiIsIi5pbnB1dC1tYXAge1xuICBjb2xvcjogIzAwZjtcbn1cbiJdLCJ2ZXJzaW9uIjozfQ=="
        }
      `)
  })
})
