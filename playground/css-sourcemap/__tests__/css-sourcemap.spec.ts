import { URL } from 'node:url'
import { describe, expect, test } from 'vitest'
import {
  extractSourcemap,
  formatSourcemapForSnapshot,
  isBuild,
  isServe,
  page,
  serverLogs,
} from '~utils'

test.runIf(isBuild)('should not output sourcemap warning (#4939)', () => {
  serverLogs.forEach((log) => {
    expect(log).not.toMatch('Sourcemap is likely to be incorrect')
  })
})

describe.runIf(isServe)('serve', () => {
  const getStyleTagContentIncluding = async (content: string) => {
    const styles = await page.$$('style')
    for (const style of styles) {
      const text = await style.textContent()
      if (text.includes(content)) {
        return text
      }
    }
    throw new Error('Not found')
  }

  test('linked css', async () => {
    const res = await page.request.get(
      new URL('./linked.css', page.url()).href,
      {
        headers: {
          accept: 'text/css',
        },
      },
    )
    const css = await res.text()
    expect(css).not.toContain('sourceMappingURL')
  })

  test('linked css with import', async () => {
    const res = await page.request.get(
      new URL('./linked-with-import.css', page.url()).href,
      {
        headers: {
          accept: 'text/css',
        },
      },
    )
    const css = await res.text()
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AAAA;EACE,UAAU;AACZ;;ACAA;EACE,UAAU;AACZ",
          "sources": [
            "be-imported.css",
            "linked-with-import.css",
          ],
          "sourcesContent": [
            ".be-imported {
        color: red;
      }
      ",
            "@import '@/be-imported.css';

      .linked-with-import {
        color: red;
      }
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#NzAALmJlLWltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CgoubGlua2VkLXdpdGgtaW1wb3J0IHsKICBjb2xvcjogcmVkOwp9CjI1NAB7Im1hcHBpbmdzIjoiQUFBQTtFQUNFLFVBQVU7QUFDWjs7QUNBQTtFQUNFLFVBQVU7QUFDWiIsInNvdXJjZXMiOlsiYmUtaW1wb3J0ZWQuY3NzIiwibGlua2VkLXdpdGgtaW1wb3J0LmNzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIuYmUtaW1wb3J0ZWQge1xuICBjb2xvcjogcmVkO1xufVxuIiwiQGltcG9ydCAnQC9iZS1pbXBvcnRlZC5jc3MnO1xuXG4ubGlua2VkLXdpdGgtaW1wb3J0IHtcbiAgY29sb3I6IHJlZDtcbn1cbiJdLCJ2ZXJzaW9uIjozfQ=="
      }
    `)
  })

  test.runIf(isServe)(
    'js .css request does not include sourcemap',
    async () => {
      const res = await page.request.get(
        new URL('./linked-with-import.css', page.url()).href,
      )
      const content = await res.text()
      expect(content).not.toMatch('//#s*sourceMappingURL')
    },
  )

  test('imported css', async () => {
    const css = await getStyleTagContentIncluding('.imported ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AAAA,CAAC,QAAQ,CAAC;AACV,CAAC,CAAC,KAAK,CAAC,CAAC,GAAG;AACZ;",
          "sources": [
            "/root/imported.css",
          ],
          "sourcesContent": [
            ".imported {
        color: red;
      }
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MjgALmltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CjE3MwB7InZlcnNpb24iOjMsInNvdXJjZXMiOlsiL3Jvb3QvaW1wb3J0ZWQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIi5pbXBvcnRlZCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLENBQUMsUUFBUSxDQUFDO0FBQ1YsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUc7QUFDWjsifQ=="
      }
    `)
  })

  test('imported css with import', async () => {
    const css = await getStyleTagContentIncluding('.imported-with-import ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AAAA;EACE,UAAU;AACZ;;ACAA;EACE,UAAU;AACZ",
          "sources": [
            "/root/be-imported.css",
            "/root/imported-with-import.css",
          ],
          "sourcesContent": [
            ".be-imported {
        color: red;
      }
      ",
            "@import '@/be-imported.css';

      .imported-with-import {
        color: red;
      }
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#NzIALmJlLWltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CgouaW1wb3J0ZWQtd2l0aC1pbXBvcnQgewogIGNvbG9yOiByZWQ7Cn0KMjcwAHsibWFwcGluZ3MiOiJBQUFBO0VBQ0UsVUFBVTtBQUNaOztBQ0FBO0VBQ0UsVUFBVTtBQUNaIiwic291cmNlcyI6WyIvcm9vdC9iZS1pbXBvcnRlZC5jc3MiLCIvcm9vdC9pbXBvcnRlZC13aXRoLWltcG9ydC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiLmJlLWltcG9ydGVkIHtcbiAgY29sb3I6IHJlZDtcbn1cbiIsIkBpbXBvcnQgJ0AvYmUtaW1wb3J0ZWQuY3NzJztcblxuLmltcG9ydGVkLXdpdGgtaW1wb3J0IHtcbiAgY29sb3I6IHJlZDtcbn1cbiJdLCJ2ZXJzaW9uIjozfQ=="
      }
    `)
  })

  test('imported sass', async () => {
    const css = await getStyleTagContentIncluding('.imported-sass ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AAGE;EACE,OCJM",
          "sourceRoot": "",
          "sources": [
            "/root/imported.sass",
            "/root/imported-nested.sass",
          ],
          "sourcesContent": [
            "@use "/imported-nested.sass"

      .imported
        &-sass
          color: imported-nested.$primary
      ",
            "$primary: red
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MzMALmltcG9ydGVkLXNhc3MgewogIGNvbG9yOiByZWQ7Cn0KMjUyAHsidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3Jvb3QvaW1wb3J0ZWQuc2FzcyIsIi9yb290L2ltcG9ydGVkLW5lc3RlZC5zYXNzIl0sIm1hcHBpbmdzIjoiQUFHRTtFQUNFLE9DSk0iLCJzb3VyY2VzQ29udGVudCI6WyJAdXNlIFwiL2ltcG9ydGVkLW5lc3RlZC5zYXNzXCJcblxuLmltcG9ydGVkXG4gICYtc2Fzc1xuICAgIGNvbG9yOiBpbXBvcnRlZC1uZXN0ZWQuJHByaW1hcnlcbiIsIiRwcmltYXJ5OiByZWRcbiJdfQ=="
      }
    `)
  })

  test('imported sass module', async () => {
    const css = await getStyleTagContentIncluding('._imported-sass-module_')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "ignoreList": [],
          "mappings": "AACE;EACE",
          "sources": [
            "/root/imported.module.sass",
          ],
          "sourcesContent": [
            ".imported
        &-sass-module
          color: red
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#NDkALl9pbXBvcnRlZC1zYXNzLW1vZHVsZV9yMXFjcF8xIHsKICBjb2xvcjogcmVkOwp9CjE1OQB7InZlcnNpb24iOjMsIm1hcHBpbmdzIjoiQUFDRTtFQUNFIiwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiL3Jvb3QvaW1wb3J0ZWQubW9kdWxlLnNhc3MiXSwic291cmNlc0NvbnRlbnQiOlsiLmltcG9ydGVkXG4gICYtc2Fzcy1tb2R1bGVcbiAgICBjb2xvcjogcmVkXG4iXX0="
      }
    `)
  })

  test('imported less', async () => {
    const css = await getStyleTagContentIncluding('.imported-less ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "ignoreList": [],
          "mappings": "AACE,SAAC;EACC",
          "sources": [
            "/root/imported.less",
          ],
          "sourcesContent": [
            ".imported {
        &-less {
          color: @color;
        }
      }
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MzMALmltcG9ydGVkLWxlc3MgewogIGNvbG9yOiByZWQ7Cn0KMTY2AHsidmVyc2lvbiI6MywibWFwcGluZ3MiOiJBQUNFLFNBQUM7RUFDQyIsImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIi9yb290L2ltcG9ydGVkLmxlc3MiXSwic291cmNlc0NvbnRlbnQiOlsiLmltcG9ydGVkIHtcbiAgJi1sZXNzIHtcbiAgICBjb2xvcjogQGNvbG9yO1xuICB9XG59XG4iXX0="
      }
    `)
  })

  test('imported stylus', async () => {
    const css = await getStyleTagContentIncluding('.imported-stylus ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "ignoreList": [],
          "mappings": "AACE;EACE,OAAM,QAAN",
          "sources": [
            "/root/imported.styl",
          ],
          "sourcesContent": [
            ".imported
        &-stylus
          color blue-red-mixed
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MzkALmltcG9ydGVkLXN0eWx1cyB7CiAgY29sb3I6ICM4MDAwODA7Cn0KMTY3AHsidmVyc2lvbiI6MywibWFwcGluZ3MiOiJBQUNFO0VBQ0UsT0FBTSxRQUFOIiwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiL3Jvb3QvaW1wb3J0ZWQuc3R5bCJdLCJzb3VyY2VzQ29udGVudCI6WyIuaW1wb3J0ZWRcbiAgJi1zdHlsdXNcbiAgICBjb2xvciBibHVlLXJlZC1taXhlZFxuIl19"
      }
    `)
  })

  test('imported sugarss', async () => {
    const css = await getStyleTagContentIncluding('.imported-sugarss ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AAAA;EACE;AADe",
          "sources": [
            "/root/imported.sss",
          ],
          "sourcesContent": [
            ".imported-sugarss
        color: red
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MzUALmltcG9ydGVkLXN1Z2Fyc3MgewogIGNvbG9yOiByZWQKfQoxMjkAeyJtYXBwaW5ncyI6IkFBQUE7RUFDRTtBQURlIiwic291cmNlcyI6WyIvcm9vdC9pbXBvcnRlZC5zc3MiXSwic291cmNlc0NvbnRlbnQiOlsiLmltcG9ydGVkLXN1Z2Fyc3NcbiAgY29sb3I6IHJlZFxuIl0sInZlcnNpb24iOjN9"
      }
    `)
  })

  test('should not output missing source file warning', () => {
    serverLogs.forEach((log) => {
      expect(log).not.toMatch(/Sourcemap for .+ points to missing source files/)
    })
  })
})
