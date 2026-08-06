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
      const css = await getStyleTagContentIncluding('.linked ')
      // different from unbundled dev below
      expect(css).toContain('sourceMappingURL')
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
          visualization: "https://evanw.github.io/source-map-visualization/#NzAALmJlLWltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CgoubGlua2VkLXdpdGgtaW1wb3J0IHsKICBjb2xvcjogcmVkOwp9CjIyNgB7InZlcnNpb24iOjMsInNvdXJjZXMiOlsibGlua2VkLXdpdGgtaW1wb3J0LmNzcyIsImJlLWltcG9ydGVkLmNzcyJdLCJzb3VyY2VzQ29udGVudCI6WyJAaW1wb3J0ICdAL2JlLWltcG9ydGVkLmNzcyc7XG5cbi5saW5rZWQtd2l0aC1pbXBvcnQge1xuICBjb2xvcjogcmVkO1xufVxuIiwiLmJlLWltcG9ydGVkIHtcbiAgY29sb3I6IHJlZDtcbn1cbiJdLCJtYXBwaW5ncyI6IkFDQUE7Ozs7QURFQSJ9"
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
          "mappings": "ACAA;;;;ADEA",
          "sourceRoot": null,
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
        visualization: "https://evanw.github.io/source-map-visualization/#NzAALmJlLWltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CgoubGlua2VkLXdpdGgtaW1wb3J0IHsKICBjb2xvcjogcmVkOwp9CjI0NAB7InZlcnNpb24iOjMsInNvdXJjZVJvb3QiOm51bGwsIm1hcHBpbmdzIjoiQUNBQTs7OztBREVBIiwic291cmNlcyI6WyJsaW5rZWQtd2l0aC1pbXBvcnQuY3NzIiwiYmUtaW1wb3J0ZWQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIkBpbXBvcnQgJ0AvYmUtaW1wb3J0ZWQuY3NzJztcblxuLmxpbmtlZC13aXRoLWltcG9ydCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iLCIuYmUtaW1wb3J0ZWQge1xuICBjb2xvcjogcmVkO1xufVxuIl19"
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
          visualization: "https://evanw.github.io/source-map-visualization/#MjgALmltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CjExNwB7InZlcnNpb24iOjMsInNvdXJjZXMiOlsiL3Jvb3QvaW1wb3J0ZWQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIi5pbXBvcnRlZCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBIn0="
        }
      `)
      return
    }
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "AAAA",
          "sourceRoot": null,
          "sources": [
            "imported.css",
          ],
          "sourcesContent": [
            ".imported {
        color: red;
      }
      ",
          ],
          "version": 3,
        },
        visualization: "https://evanw.github.io/source-map-visualization/#MjgALmltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CjEyOQB7InZlcnNpb24iOjMsInNvdXJjZVJvb3QiOm51bGwsIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZXMiOlsiaW1wb3J0ZWQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIi5pbXBvcnRlZCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iXX0="
      }
    `)
  })

  test('imported css with import', async () => {
    const css = await getStyleTagContentIncluding('.imported-with-import ')
    const map = extractSourcemap(css)
    if (isBundledDev) {
      expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
        SourceMap {
          content: {
            "mappings": "ACAA;;;;ADEA",
            "sources": [
              "imported-with-import.css",
              "be-imported.css",
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
          visualization: "https://evanw.github.io/source-map-visualization/#NzIALmJlLWltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CgouaW1wb3J0ZWQtd2l0aC1pbXBvcnQgewogIGNvbG9yOiByZWQ7Cn0KMjMwAHsidmVyc2lvbiI6Mywic291cmNlcyI6WyJpbXBvcnRlZC13aXRoLWltcG9ydC5jc3MiLCJiZS1pbXBvcnRlZC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiQGltcG9ydCAnQC9iZS1pbXBvcnRlZC5jc3MnO1xuXG4uaW1wb3J0ZWQtd2l0aC1pbXBvcnQge1xuICBjb2xvcjogcmVkO1xufVxuIiwiLmJlLWltcG9ydGVkIHtcbiAgY29sb3I6IHJlZDtcbn1cbiJdLCJtYXBwaW5ncyI6IkFDQUE7Ozs7QURFQSJ9"
        }
      `)
      return
    }
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "mappings": "ACAA;;;;ADEA",
          "sourceRoot": null,
          "sources": [
            "imported-with-import.css",
            "be-imported.css",
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
        visualization: "https://evanw.github.io/source-map-visualization/#NzIALmJlLWltcG9ydGVkIHsKICBjb2xvcjogcmVkOwp9CgouaW1wb3J0ZWQtd2l0aC1pbXBvcnQgewogIGNvbG9yOiByZWQ7Cn0KMjQ4AHsidmVyc2lvbiI6Mywic291cmNlUm9vdCI6bnVsbCwibWFwcGluZ3MiOiJBQ0FBOzs7O0FERUEiLCJzb3VyY2VzIjpbImltcG9ydGVkLXdpdGgtaW1wb3J0LmNzcyIsImJlLWltcG9ydGVkLmNzcyJdLCJzb3VyY2VzQ29udGVudCI6WyJAaW1wb3J0ICdAL2JlLWltcG9ydGVkLmNzcyc7XG5cbi5pbXBvcnRlZC13aXRoLWltcG9ydCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iLCIuYmUtaW1wb3J0ZWQge1xuICBjb2xvcjogcmVkO1xufVxuIl19"
      }
    `)
  })

  test('imported sass', async () => {
    const css = await getStyleTagContentIncluding('.imported-sass ')
    const map = extractSourcemap(css)
    if (isBundledDev) {
      expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
        SourceMap {
          content: {
            "mappings": "AAGE",
            "sources": [
              "/root/imported.sass",
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
          visualization: "https://evanw.github.io/source-map-visualization/#MzMALmltcG9ydGVkLXNhc3MgewogIGNvbG9yOiByZWQ7Cn0KMTc5AHsidmVyc2lvbiI6Mywic291cmNlcyI6WyIvcm9vdC9pbXBvcnRlZC5zYXNzIl0sInNvdXJjZXNDb250ZW50IjpbIkB1c2UgXCIvaW1wb3J0ZWQtbmVzdGVkLnNhc3NcIlxuXG4uaW1wb3J0ZWRcbiAgJi1zYXNzXG4gICAgY29sb3I6IGltcG9ydGVkLW5lc3RlZC4kcHJpbWFyeVxuIl0sIm1hcHBpbmdzIjoiQUFHRSJ9"
        }
      `)
      return
    }
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "ignoreList": [],
          "mappings": "AAGE",
          "sources": [
            "/root/imported.sass",
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
        visualization: "https://evanw.github.io/source-map-visualization/#MzMALmltcG9ydGVkLXNhc3MgewogIGNvbG9yOiByZWQ7Cn0KMTk1AHsidmVyc2lvbiI6MywibWFwcGluZ3MiOiJBQUdFIiwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiL3Jvb3QvaW1wb3J0ZWQuc2FzcyJdLCJzb3VyY2VzQ29udGVudCI6WyJAdXNlIFwiL2ltcG9ydGVkLW5lc3RlZC5zYXNzXCJcblxuLmltcG9ydGVkXG4gICYtc2Fzc1xuICAgIGNvbG9yOiBpbXBvcnRlZC1uZXN0ZWQuJHByaW1hcnlcbiJdfQ=="
      }
    `)
  })

  test('imported sass module', async () => {
    const css = await getStyleTagContentIncluding('_imported-sass-module')
    const map = extractSourcemap(css)
    if (isBundledDev) {
      expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
        SourceMap {
          content: {
            "mappings": "AACE",
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
          visualization: "https://evanw.github.io/source-map-visualization/#NDcALmhvUU10V19pbXBvcnRlZC1zYXNzLW1vZHVsZSB7CiAgY29sb3I6IHJlZDsKfQoxMzgAeyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9yb290L2ltcG9ydGVkLm1vZHVsZS5zYXNzIl0sInNvdXJjZXNDb250ZW50IjpbIi5pbXBvcnRlZFxuICAmLXNhc3MtbW9kdWxlXG4gICAgY29sb3I6IHJlZFxuIl0sIm1hcHBpbmdzIjoiQUFDRSJ9"
        }
      `)
      return
    }
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "ignoreList": [],
          "mappings": "AACE",
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
        visualization: "https://evanw.github.io/source-map-visualization/#NDcALmhvUU10V19pbXBvcnRlZC1zYXNzLW1vZHVsZSB7CiAgY29sb3I6IHJlZDsKfQoxNTQAeyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6IkFBQ0UiLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyIvcm9vdC9pbXBvcnRlZC5tb2R1bGUuc2FzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIuaW1wb3J0ZWRcbiAgJi1zYXNzLW1vZHVsZVxuICAgIGNvbG9yOiByZWRcbiJdfQ=="
      }
    `)
  })

  test('imported less', async () => {
    const css = await getStyleTagContentIncluding('.imported-less ')
    const map = extractSourcemap(css)
    if (isBundledDev) {
      expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
        SourceMap {
          content: {
            "mappings": "AACE",
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
          visualization: "https://evanw.github.io/source-map-visualization/#MzMALmltcG9ydGVkLWxlc3MgewogIGNvbG9yOiByZWQ7Cn0KMTQwAHsidmVyc2lvbiI6Mywic291cmNlcyI6WyIvcm9vdC9pbXBvcnRlZC5sZXNzIl0sInNvdXJjZXNDb250ZW50IjpbIi5pbXBvcnRlZCB7XG4gICYtbGVzcyB7XG4gICAgY29sb3I6IEBjb2xvcjtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFDRSJ9"
        }
      `)
      return
    }
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "ignoreList": [],
          "mappings": "AACE",
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
        visualization: "https://evanw.github.io/source-map-visualization/#MzMALmltcG9ydGVkLWxlc3MgewogIGNvbG9yOiByZWQ7Cn0KMTU2AHsidmVyc2lvbiI6MywibWFwcGluZ3MiOiJBQUNFIiwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiL3Jvb3QvaW1wb3J0ZWQubGVzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIuaW1wb3J0ZWQge1xuICAmLWxlc3Mge1xuICAgIGNvbG9yOiBAY29sb3I7XG4gIH1cbn1cbiJdfQ=="
      }
    `)
  })

  test('imported stylus', async () => {
    const css = await getStyleTagContentIncluding('.imported-stylus ')
    const map = extractSourcemap(css)
    if (isBundledDev) {
      expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
        SourceMap {
          content: {
            "mappings": "AACE",
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
          visualization: "https://evanw.github.io/source-map-visualization/#MzgALmltcG9ydGVkLXN0eWx1cyB7CiAgY29sb3I6IHB1cnBsZTsKfQoxMzYAeyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9yb290L2ltcG9ydGVkLnN0eWwiXSwic291cmNlc0NvbnRlbnQiOlsiLmltcG9ydGVkXG4gICYtc3R5bHVzXG4gICAgY29sb3IgYmx1ZS1yZWQtbWl4ZWRcbiJdLCJtYXBwaW5ncyI6IkFBQ0UifQ=="
        }
      `)
      return
    }
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "ignoreList": [],
          "mappings": "AACE",
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
        visualization: "https://evanw.github.io/source-map-visualization/#MzgALmltcG9ydGVkLXN0eWx1cyB7CiAgY29sb3I6IHB1cnBsZTsKfQoxNTIAeyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6IkFBQ0UiLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyIvcm9vdC9pbXBvcnRlZC5zdHlsIl0sInNvdXJjZXNDb250ZW50IjpbIi5pbXBvcnRlZFxuICAmLXN0eWx1c1xuICAgIGNvbG9yIGJsdWUtcmVkLW1peGVkXG4iXX0="
      }
    `)
  })

  test('imported sugarss', async () => {
    const css = await getStyleTagContentIncluding('.imported-sugarss ')
    const map = extractSourcemap(css)
    if (isBundledDev) {
      expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
        SourceMap {
          content: {
            "mappings": "AAAA",
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
          visualization: "https://evanw.github.io/source-map-visualization/#MzYALmltcG9ydGVkLXN1Z2Fyc3MgewogIGNvbG9yOiByZWQ7Cn0KMTE5AHsidmVyc2lvbiI6Mywic291cmNlcyI6WyIvcm9vdC9pbXBvcnRlZC5zc3MiXSwic291cmNlc0NvbnRlbnQiOlsiLmltcG9ydGVkLXN1Z2Fyc3NcbiAgY29sb3I6IHJlZFxuIl0sIm1hcHBpbmdzIjoiQUFBQSJ9"
        }
      `)
      return
    }
    expect(formatSourcemapForSnapshot(map, css)).toMatchInlineSnapshot(`
      SourceMap {
        content: {
          "ignoreList": [],
          "mappings": "AAAA",
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
        visualization: "https://evanw.github.io/source-map-visualization/#MzYALmltcG9ydGVkLXN1Z2Fyc3MgewogIGNvbG9yOiByZWQ7Cn0KMTM1AHsidmVyc2lvbiI6MywibWFwcGluZ3MiOiJBQUFBIiwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiL3Jvb3QvaW1wb3J0ZWQuc3NzIl0sInNvdXJjZXNDb250ZW50IjpbIi5pbXBvcnRlZC1zdWdhcnNzXG4gIGNvbG9yOiByZWRcbiJdfQ=="
      }
    `)
  })

  test('should not output missing source file warning', () => {
    serverLogs.forEach((log) => {
      expect(log).not.toMatch(/Sourcemap for .+ points to missing source files/)
    })
  })
})
