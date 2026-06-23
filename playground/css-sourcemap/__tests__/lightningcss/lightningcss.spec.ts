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
