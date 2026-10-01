import { URL } from 'node:url'
import { describe, expect, test } from 'vitest'
import {
  extractSourcemap,
  formatSourcemapForSnapshot,
  isBuild,
  isBundled,
  isBundledDev,
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
    if (isBundledDev) {
      // has a sourcemap, unlike unbundled dev below
      const css = await getStyleTagContentIncluding('.linked ')
      expect(formatSourcemapForSnapshot(extractSourcemap(css), css))
        .toMatchInlineSnapshot(`
        SourceMap {
          content: {
            "mappings": "",
            "sources": [],
            "version": 3,
          },
          visualization: "https://evanw.github.io/source-map-visualization/#MjYALmxpbmtlZCB7CiAgY29sb3I6IHJlZDsKfQo0MAB7Im1hcHBpbmdzIjoiIiwic291cmNlcyI6W10sInZlcnNpb24iOjN9"
        }
      `)
      return
    }
    const res = await page.request.get(
      new URL('./linked.css', page.url()).href,
      {
        headers: {
          accept: 'text/css',
        },
      },
    )
    const css = await res.text()
    // drops transform result when the transformed result is the same as the source file.
    expect(css).not.toContain('sourceMappingURL')
  })

  test('linked css with import', async () => {
    if (isBundledDev) {
      // not served at its own URL, so check the style tag the bundle added
      const css = await getStyleTagContentIncluding('.linked-with-import ')
      expect(formatSourcemapForSnapshot(extractSourcemap(css), css))
        .toMatchInlineSnapshot(`
          SourceMap {
            content: {
              "mappings": "AAAA;EACE,UAAU;AACZ;ACAA;EACE,UAAU;AACZ",
              "sources": [
                "/root/be-imported.css",
                "/root/linked-with-import.css",
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
            visualization: "https://evanw.github.io/source-map-visualization/#NjkALmJlLWltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9Ci5saW5rZWQtd2l0aC1pbXBvcnQgewogIGNvbG9yOiByZWQ7Cn0KMjY1AHsibWFwcGluZ3MiOiJBQUFBO0VBQ0UsVUFBVTtBQUNaO0FDQUE7RUFDRSxVQUFVO0FBQ1oiLCJzb3VyY2VzIjpbIi9yb290L2JlLWltcG9ydGVkLmNzcyIsIi9yb290L2xpbmtlZC13aXRoLWltcG9ydC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiLmJlLWltcG9ydGVkIHtcbiAgY29sb3I6IHJlZDtcbn1cbiIsIkBpbXBvcnQgJ0AvYmUtaW1wb3J0ZWQuY3NzJztcblxuLmxpbmtlZC13aXRoLWltcG9ydCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iXSwidmVyc2lvbiI6M30="
          }
        `)
      return
    }
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
          "mappings": "AAAA;EACE,UAAU;AACZ;ACAA;EACE,UAAU;AACZ",
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
        visualization: "https://evanw.github.io/source-map-visualization/#NjkALmJlLWltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9Ci5saW5rZWQtd2l0aC1pbXBvcnQgewogIGNvbG9yOiByZWQ7Cn0KMjUzAHsibWFwcGluZ3MiOiJBQUFBO0VBQ0UsVUFBVTtBQUNaO0FDQUE7RUFDRSxVQUFVO0FBQ1oiLCJzb3VyY2VzIjpbImJlLWltcG9ydGVkLmNzcyIsImxpbmtlZC13aXRoLWltcG9ydC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiLmJlLWltcG9ydGVkIHtcbiAgY29sb3I6IHJlZDtcbn1cbiIsIkBpbXBvcnQgJ0AvYmUtaW1wb3J0ZWQuY3NzJztcblxuLmxpbmtlZC13aXRoLWltcG9ydCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iXSwidmVyc2lvbiI6M30="
      }
    `)
  })

  test.runIf(!isBundled)(
    'js .css request does not include sourcemap',
    async () => {
      const res = await page.request.get(
        new URL('./linked-with-import.css', page.url()).href,
      )
      const content = await res.text()
      // The response is the JS module that wraps the CSS. The JS itself must
      // not carry a `//# sourceMappingURL` comment. The CSS text inlined in
      // that JS still contains its own `/*# sourceMappingURL` comment; that
      // one is fine.
      expect(content).not.toMatch('//# sourceMappingURL')
    },
  )

  test('imported css', async () => {
    const css = await getStyleTagContentIncluding('.imported ')
    const map = extractSourcemap(css)
    if (isBundledDev) {
      // the empty map with no sources is a known gap (vitejs/vite#23028);
      // once fixed, this should match the lightningcss twin
      expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
        SourceMap {
          content: {
            "mappings": "",
            "sources": [],
            "version": 3,
          },
          visualization: "https://evanw.github.io/source-map-visualization/#MjgALmltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CjQwAHsibWFwcGluZ3MiOiIiLCJzb3VyY2VzIjpbXSwidmVyc2lvbiI6M30="
        }
      `)
      return
    }
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
        visualization: "https://evanw.github.io/source-map-visualization/#MjgALmltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CjE3MwB7Im1hcHBpbmdzIjoiQUFBQSxDQUFDLFFBQVEsQ0FBQztBQUNWLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHO0FBQ1o7Iiwic291cmNlcyI6WyIvcm9vdC9pbXBvcnRlZC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiLmltcG9ydGVkIHtcbiAgY29sb3I6IHJlZDtcbn1cbiJdLCJ2ZXJzaW9uIjozfQ=="
      }
    `)
  })

  test('imported css with import', async () => {
    const css = await getStyleTagContentIncluding('.imported-with-import ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AAAA;EACE,UAAU;AACZ;ACAA;EACE,UAAU;AACZ",
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
        visualization: "https://evanw.github.io/source-map-visualization/#NzEALmJlLWltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9Ci5pbXBvcnRlZC13aXRoLWltcG9ydCB7CiAgY29sb3I6IHJlZDsKfQoyNjkAeyJtYXBwaW5ncyI6IkFBQUE7RUFDRSxVQUFVO0FBQ1o7QUNBQTtFQUNFLFVBQVU7QUFDWiIsInNvdXJjZXMiOlsiL3Jvb3QvYmUtaW1wb3J0ZWQuY3NzIiwiL3Jvb3QvaW1wb3J0ZWQtd2l0aC1pbXBvcnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIi5iZS1pbXBvcnRlZCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iLCJAaW1wb3J0ICdAL2JlLWltcG9ydGVkLmNzcyc7XG5cbi5pbXBvcnRlZC13aXRoLWltcG9ydCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iXSwidmVyc2lvbiI6M30="
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
        visualization: "https://evanw.github.io/source-map-visualization/#MzMALmltcG9ydGVkLXNhc3MgewogIGNvbG9yOiByZWQ7Cn0KMjUyAHsibWFwcGluZ3MiOiJBQUdFO0VBQ0UsT0NKTSIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi9yb290L2ltcG9ydGVkLnNhc3MiLCIvcm9vdC9pbXBvcnRlZC1uZXN0ZWQuc2FzcyJdLCJzb3VyY2VzQ29udGVudCI6WyJAdXNlIFwiL2ltcG9ydGVkLW5lc3RlZC5zYXNzXCJcblxuLmltcG9ydGVkXG4gICYtc2Fzc1xuICAgIGNvbG9yOiBpbXBvcnRlZC1uZXN0ZWQuJHByaW1hcnlcbiIsIiRwcmltYXJ5OiByZWRcbiJdLCJ2ZXJzaW9uIjozfQ=="
      }
    `)
  })

  test('imported sass module', async () => {
    const css = await getStyleTagContentIncluding('._imported-sass-module_')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
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
        visualization: "https://evanw.github.io/source-map-visualization/#NDkALl9pbXBvcnRlZC1zYXNzLW1vZHVsZV9yMXFjcF8xIHsKICBjb2xvcjogcmVkOwp9CjE0MwB7Im1hcHBpbmdzIjoiQUFDRTtFQUNFIiwic291cmNlcyI6WyIvcm9vdC9pbXBvcnRlZC5tb2R1bGUuc2FzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIuaW1wb3J0ZWRcbiAgJi1zYXNzLW1vZHVsZVxuICAgIGNvbG9yOiByZWRcbiJdLCJ2ZXJzaW9uIjozfQ=="
      }
    `)
  })

  test('imported less', async () => {
    const css = await getStyleTagContentIncluding('.imported-less ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
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
        visualization: "https://evanw.github.io/source-map-visualization/#MzMALmltcG9ydGVkLWxlc3MgewogIGNvbG9yOiByZWQ7Cn0KMTUwAHsibWFwcGluZ3MiOiJBQUNFLFNBQUM7RUFDQyIsInNvdXJjZXMiOlsiL3Jvb3QvaW1wb3J0ZWQubGVzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIuaW1wb3J0ZWQge1xuICAmLWxlc3Mge1xuICAgIGNvbG9yOiBAY29sb3I7XG4gIH1cbn1cbiJdLCJ2ZXJzaW9uIjozfQ=="
      }
    `)
  })

  test('imported stylus', async () => {
    const css = await getStyleTagContentIncluding('.imported-stylus ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
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
        visualization: "https://evanw.github.io/source-map-visualization/#MzkALmltcG9ydGVkLXN0eWx1cyB7CiAgY29sb3I6ICM4MDAwODA7Cn0KMTUxAHsibWFwcGluZ3MiOiJBQUNFO0VBQ0UsT0FBTSxRQUFOIiwic291cmNlcyI6WyIvcm9vdC9pbXBvcnRlZC5zdHlsIl0sInNvdXJjZXNDb250ZW50IjpbIi5pbXBvcnRlZFxuICAmLXN0eWx1c1xuICAgIGNvbG9yIGJsdWUtcmVkLW1peGVkXG4iXSwidmVyc2lvbiI6M30="
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
