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
              "mappings": "AAAA",
              "sources": [
                "/linked.css",
              ],
              "sourcesContent": [
                ".linked {
            color: red;
          }
          ",
              ],
              "version": 3,
            },
            visualization: "https://evanw.github.io/source-map-visualization/#MjYALmxpbmtlZCB7CiAgY29sb3I6IHJlZDsKfQoxMDgAeyJtYXBwaW5ncyI6IkFBQUEiLCJzb3VyY2VzIjpbIi9saW5rZWQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIi5saW5rZWQge1xuICBjb2xvcjogcmVkO1xufVxuIl0sInZlcnNpb24iOjN9"
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
    let css: string
    if (isBundledDev) {
      // not served at its own URL, so check the style tag the bundle added
      css = await getStyleTagContentIncluding('.linked-with-import ')
    } else {
      const res = await page.request.get(
        new URL('./linked-with-import.css', page.url()).href,
        {
          headers: {
            accept: 'text/css',
          },
        },
      )
      css = await res.text()
    }
    const map = extractSourcemap(css)
    if (isBundledDev) {
      expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "ACAA;;;;ADEA",
          "sources": [
            "/linked-with-import.css",
            "/be-imported.css",
          ],
          "sourcesContent": [
            "@import '@/be-imported.css';

      .linked-with-import {
        color: red;
      }
      ",
            ".be-imported {
        color: red;
      }
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#NzAALmJlLWltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CgoubGlua2VkLXdpdGgtaW1wb3J0IHsKICBjb2xvcjogcmVkOwp9CjIyOAB7Im1hcHBpbmdzIjoiQUNBQTs7OztBREVBIiwic291cmNlcyI6WyIvbGlua2VkLXdpdGgtaW1wb3J0LmNzcyIsIi9iZS1pbXBvcnRlZC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiQGltcG9ydCAnQC9iZS1pbXBvcnRlZC5jc3MnO1xuXG4ubGlua2VkLXdpdGgtaW1wb3J0IHtcbiAgY29sb3I6IHJlZDtcbn1cbiIsIi5iZS1pbXBvcnRlZCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iXSwidmVyc2lvbiI6M30="
      }
    `)
      return
    }
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "ACAA;;;;ADEA",
          "sources": [
            "linked-with-import.css",
            "be-imported.css",
          ],
          "sourcesContent": [
            "@import '@/be-imported.css';

      .linked-with-import {
        color: red;
      }
      ",
            ".be-imported {
        color: red;
      }
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#NzAALmJlLWltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CgoubGlua2VkLXdpdGgtaW1wb3J0IHsKICBjb2xvcjogcmVkOwp9CjIyNgB7Im1hcHBpbmdzIjoiQUNBQTs7OztBREVBIiwic291cmNlcyI6WyJsaW5rZWQtd2l0aC1pbXBvcnQuY3NzIiwiYmUtaW1wb3J0ZWQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIkBpbXBvcnQgJ0AvYmUtaW1wb3J0ZWQuY3NzJztcblxuLmxpbmtlZC13aXRoLWltcG9ydCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iLCIuYmUtaW1wb3J0ZWQge1xuICBjb2xvcjogcmVkO1xufVxuIl0sInZlcnNpb24iOjN9"
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
      expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
        SourceMap {
          content: {
            "mappings": "AAAA",
            "sources": [
              "/imported.css",
            ],
            "sourcesContent": [
              ".imported {
          color: red;
        }
        ",
            ],
            "version": 3,
          },
          visualization: "https://evanw.github.io/source-map-visualization/#MjgALmltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CjExMgB7Im1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZXMiOlsiL2ltcG9ydGVkLmNzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIuaW1wb3J0ZWQge1xuICBjb2xvcjogcmVkO1xufVxuIl0sInZlcnNpb24iOjN9"
        }
      `)
      return
    }
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AAAA",
          "sources": [
            "/imported.css",
          ],
          "sourcesContent": [
            ".imported {
        color: red;
      }
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MjgALmltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CjExMgB7Im1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZXMiOlsiL2ltcG9ydGVkLmNzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIuaW1wb3J0ZWQge1xuICBjb2xvcjogcmVkO1xufVxuIl0sInZlcnNpb24iOjN9"
      }
    `)
  })

  test('imported css with import', async () => {
    const css = await getStyleTagContentIncluding('.imported-with-import ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "ACAA;;;;ADEA",
          "sources": [
            "/imported-with-import.css",
            "/be-imported.css",
          ],
          "sourcesContent": [
            "@import '@/be-imported.css';

      .imported-with-import {
        color: red;
      }
      ",
            ".be-imported {
        color: red;
      }
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#NzIALmJlLWltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CgouaW1wb3J0ZWQtd2l0aC1pbXBvcnQgewogIGNvbG9yOiByZWQ7Cn0KMjMyAHsibWFwcGluZ3MiOiJBQ0FBOzs7O0FERUEiLCJzb3VyY2VzIjpbIi9pbXBvcnRlZC13aXRoLWltcG9ydC5jc3MiLCIvYmUtaW1wb3J0ZWQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIkBpbXBvcnQgJ0AvYmUtaW1wb3J0ZWQuY3NzJztcblxuLmltcG9ydGVkLXdpdGgtaW1wb3J0IHtcbiAgY29sb3I6IHJlZDtcbn1cbiIsIi5iZS1pbXBvcnRlZCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iXSwidmVyc2lvbiI6M30="
      }
    `)
  })

  test('imported sass', async () => {
    const css = await getStyleTagContentIncluding('.imported-sass ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AAGE",
          "sources": [
            "/imported.sass",
          ],
          "sourcesContent": [
            "@use "/imported-nested.sass"

      .imported
        &-sass
          color: imported-nested.$primary
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MzMALmltcG9ydGVkLXNhc3MgewogIGNvbG9yOiByZWQ7Cn0KMTc0AHsibWFwcGluZ3MiOiJBQUdFIiwic291cmNlcyI6WyIvaW1wb3J0ZWQuc2FzcyJdLCJzb3VyY2VzQ29udGVudCI6WyJAdXNlIFwiL2ltcG9ydGVkLW5lc3RlZC5zYXNzXCJcblxuLmltcG9ydGVkXG4gICYtc2Fzc1xuICAgIGNvbG9yOiBpbXBvcnRlZC1uZXN0ZWQuJHByaW1hcnlcbiJdLCJ2ZXJzaW9uIjozfQ=="
      }
    `)
  })

  test('imported sass module', async () => {
    const css = await getStyleTagContentIncluding('_imported-sass-module')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AACE",
          "sources": [
            "/imported.module.sass",
          ],
          "sourcesContent": [
            ".imported
        &-sass-module
          color: red
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#NDcALmhvUU10V19pbXBvcnRlZC1zYXNzLW1vZHVsZSB7CiAgY29sb3I6IHJlZDsKfQoxMzMAeyJtYXBwaW5ncyI6IkFBQ0UiLCJzb3VyY2VzIjpbIi9pbXBvcnRlZC5tb2R1bGUuc2FzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIuaW1wb3J0ZWRcbiAgJi1zYXNzLW1vZHVsZVxuICAgIGNvbG9yOiByZWRcbiJdLCJ2ZXJzaW9uIjozfQ=="
      }
    `)
  })

  test('imported less', async () => {
    const css = await getStyleTagContentIncluding('.imported-less ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AACE",
          "sources": [
            "/imported.less",
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
        visualization: "https://evanw.github.io/source-map-visualization/#MzMALmltcG9ydGVkLWxlc3MgewogIGNvbG9yOiByZWQ7Cn0KMTM1AHsibWFwcGluZ3MiOiJBQUNFIiwic291cmNlcyI6WyIvaW1wb3J0ZWQubGVzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIuaW1wb3J0ZWQge1xuICAmLWxlc3Mge1xuICAgIGNvbG9yOiBAY29sb3I7XG4gIH1cbn1cbiJdLCJ2ZXJzaW9uIjozfQ=="
      }
    `)
  })

  test('imported stylus', async () => {
    const css = await getStyleTagContentIncluding('.imported-stylus ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AACE",
          "sources": [
            "/imported.styl",
          ],
          "sourcesContent": [
            ".imported
        &-stylus
          color blue-red-mixed
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MzgALmltcG9ydGVkLXN0eWx1cyB7CiAgY29sb3I6IHB1cnBsZTsKfQoxMzEAeyJtYXBwaW5ncyI6IkFBQ0UiLCJzb3VyY2VzIjpbIi9pbXBvcnRlZC5zdHlsIl0sInNvdXJjZXNDb250ZW50IjpbIi5pbXBvcnRlZFxuICAmLXN0eWx1c1xuICAgIGNvbG9yIGJsdWUtcmVkLW1peGVkXG4iXSwidmVyc2lvbiI6M30="
      }
    `)
  })

  test('imported sugarss', async () => {
    const css = await getStyleTagContentIncluding('.imported-sugarss ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AAAA",
          "sources": [
            "/imported.sss",
          ],
          "sourcesContent": [
            ".imported-sugarss
        color: red
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MzYALmltcG9ydGVkLXN1Z2Fyc3MgewogIGNvbG9yOiByZWQ7Cn0KMTE0AHsibWFwcGluZ3MiOiJBQUFBIiwic291cmNlcyI6WyIvaW1wb3J0ZWQuc3NzIl0sInNvdXJjZXNDb250ZW50IjpbIi5pbXBvcnRlZC1zdWdhcnNzXG4gIGNvbG9yOiByZWRcbiJdLCJ2ZXJzaW9uIjozfQ=="
      }
    `)
  })

  test('should not output missing source file warning', () => {
    serverLogs.forEach((log) => {
      expect(log).not.toMatch(/Sourcemap for .+ points to missing source files/)
    })
  })
})
