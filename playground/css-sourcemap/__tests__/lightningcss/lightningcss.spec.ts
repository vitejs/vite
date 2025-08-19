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
        visualization: "https://evanw.github.io/source-map-visualization/#NDY0AC5iZS1pbXBvcnRlZCB7CiAgY29sb3I6IHJlZDsKfQoKLmxpbmtlZC13aXRoLWltcG9ydCB7CiAgY29sb3I6IHJlZDsKfQoKLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZTYjI5MElqcHVkV3hzTENKdFlYQndhVzVuY3lJNklrRkRRVUU3T3pzN1FVUkZRU0lzSW5OdmRYSmpaWE1pT2xzaWJHbHVhMlZrTFhkcGRHZ3RhVzF3YjNKMExtTnpjeUlzSW1KbExXbHRjRzl5ZEdWa0xtTnpjeUpkTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKQWFXMXdiM0owSUNkQUwySmxMV2x0Y0c5eWRHVmtMbU56Y3ljN1hHNWNiaTVzYVc1clpXUXRkMmwwYUMxcGJYQnZjblFnZTF4dUlDQmpiMnh2Y2pvZ2NtVmtPMXh1ZlZ4dUlpd2lMbUpsTFdsdGNHOXlkR1ZrSUh0Y2JpQWdZMjlzYjNJNklISmxaRHRjYm4xY2JpSmRMQ0p1WVcxbGN5STZXMTE5ICovMjQ0AHsidmVyc2lvbiI6Mywic291cmNlUm9vdCI6bnVsbCwibWFwcGluZ3MiOiJBQ0FBOzs7O0FERUEiLCJzb3VyY2VzIjpbImxpbmtlZC13aXRoLWltcG9ydC5jc3MiLCJiZS1pbXBvcnRlZC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiQGltcG9ydCAnQC9iZS1pbXBvcnRlZC5jc3MnO1xuXG4ubGlua2VkLXdpdGgtaW1wb3J0IHtcbiAgY29sb3I6IHJlZDtcbn1cbiIsIi5iZS1pbXBvcnRlZCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iXX0="
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
        visualization: "https://evanw.github.io/source-map-visualization/#MjcwAC5pbXBvcnRlZCB7CiAgY29sb3I6IHJlZDsKfQoKLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZTYjI5MElqcHVkV3hzTENKdFlYQndhVzVuY3lJNklrRkJRVUVpTENKemIzVnlZMlZ6SWpwYkltbHRjRzl5ZEdWa0xtTnpjeUpkTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lJdWFXMXdiM0owWldRZ2UxeHVJQ0JqYjJ4dmNqb2djbVZrTzF4dWZWeHVJbDBzSW01aGJXVnpJanBiWFgwPSAqLzEyOQB7InZlcnNpb24iOjMsInNvdXJjZVJvb3QiOm51bGwsIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZXMiOlsiaW1wb3J0ZWQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIi5pbXBvcnRlZCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iXX0="
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
        visualization: "https://evanw.github.io/source-map-visualization/#NDc0AC5iZS1pbXBvcnRlZCB7CiAgY29sb3I6IHJlZDsKfQoKLmltcG9ydGVkLXdpdGgtaW1wb3J0IHsKICBjb2xvcjogcmVkOwp9CgovKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVlNiMjkwSWpwdWRXeHNMQ0p0WVhCd2FXNW5jeUk2SWtGRFFVRTdPenM3UVVSRlFTSXNJbk52ZFhKalpYTWlPbHNpYVcxd2IzSjBaV1F0ZDJsMGFDMXBiWEJ2Y25RdVkzTnpJaXdpWW1VdGFXMXdiM0owWldRdVkzTnpJbDBzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiSWtCcGJYQnZjblFnSjBBdlltVXRhVzF3YjNKMFpXUXVZM056Snp0Y2JseHVMbWx0Y0c5eWRHVmtMWGRwZEdndGFXMXdiM0owSUh0Y2JpQWdZMjlzYjNJNklISmxaRHRjYm4xY2JpSXNJaTVpWlMxcGJYQnZjblJsWkNCN1hHNGdJR052Ykc5eU9pQnlaV1E3WEc1OVhHNGlYU3dpYm1GdFpYTWlPbHRkZlE9PSAqLzI0OAB7InZlcnNpb24iOjMsInNvdXJjZVJvb3QiOm51bGwsIm1hcHBpbmdzIjoiQUNBQTs7OztBREVBIiwic291cmNlcyI6WyJpbXBvcnRlZC13aXRoLWltcG9ydC5jc3MiLCJiZS1pbXBvcnRlZC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiQGltcG9ydCAnQC9iZS1pbXBvcnRlZC5jc3MnO1xuXG4uaW1wb3J0ZWQtd2l0aC1pbXBvcnQge1xuICBjb2xvcjogcmVkO1xufVxuIiwiLmJlLWltcG9ydGVkIHtcbiAgY29sb3I6IHJlZDtcbn1cbiJdfQ=="
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
        visualization: "https://evanw.github.io/source-map-visualization/#NTMxAC5pbXBvcnRlZC1zYXNzIHsKICBjb2xvcjogcmVkOwp9CgovKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p0WVhCd2FXNW5jeUk2SWtGQlIwVWlMQ0p1WVcxbGN5STZXMTBzSW1sbmJtOXlaVXhwYzNRaU9sdGRMQ0p6YjNWeVkyVnpJanBiSWtRNkwyUnZZM1Z0Wlc1MGN5OUhhWFJJZFdJdmRtbDBaUzl3YkdGNVozSnZkVzVrTFhSbGJYQXZZM056TFhOdmRYSmpaVzFoY0M5cGJYQnZjblJsWkM1ellYTnpJbDBzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiSWtCMWMyVWdYQ0l2YVcxd2IzSjBaV1F0Ym1WemRHVmtMbk5oYzNOY0lseHVYRzR1YVcxd2IzSjBaV1JjYmlBZ0ppMXpZWE56WEc0Z0lDQWdZMjlzYjNJNklHbHRjRzl5ZEdWa0xXNWxjM1JsWkM0a2NISnBiV0Z5ZVZ4dUlsMHNJbVpwYkdVaU9pSkVPaTlrYjJOMWJXVnVkSE12UjJsMFNIVmlMM1pwZEdVdmNHeGhlV2R5YjNWdVpDMTBaVzF3TDJOemN5MXpiM1Z5WTJWdFlYQXZhVzF3YjNKMFpXUXVjMkZ6Y3lKOSAqLzE5NQB7InZlcnNpb24iOjMsIm1hcHBpbmdzIjoiQUFHRSIsImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIi9yb290L2ltcG9ydGVkLnNhc3MiXSwic291cmNlc0NvbnRlbnQiOlsiQHVzZSBcIi9pbXBvcnRlZC1uZXN0ZWQuc2Fzc1wiXG5cbi5pbXBvcnRlZFxuICAmLXNhc3NcbiAgICBjb2xvcjogaW1wb3J0ZWQtbmVzdGVkLiRwcmltYXJ5XG4iXX0="
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
        visualization: "https://evanw.github.io/source-map-visualization/#NTAxAC5ob1FNdFdfaW1wb3J0ZWQtc2Fzcy1tb2R1bGUgewogIGNvbG9yOiByZWQ7Cn0KCi8qIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnRZWEJ3YVc1bmN5STZJa0ZCUTBVaUxDSnVZVzFsY3lJNlcxMHNJbWxuYm05eVpVeHBjM1FpT2x0ZExDSnpiM1Z5WTJWeklqcGJJa1E2TDJSdlkzVnRaVzUwY3k5SGFYUklkV0l2ZG1sMFpTOXdiR0Y1WjNKdmRXNWtMWFJsYlhBdlkzTnpMWE52ZFhKalpXMWhjQzlwYlhCdmNuUmxaQzV0YjJSMWJHVXVjMkZ6Y3lKZExDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SXVhVzF3YjNKMFpXUmNiaUFnSmkxellYTnpMVzF2WkhWc1pWeHVJQ0FnSUdOdmJHOXlPaUJ5WldSY2JpSmRMQ0ptYVd4bElqb2lSRG92Wkc5amRXMWxiblJ6TDBkcGRFaDFZaTkyYVhSbEwzQnNZWGxuY205MWJtUXRkR1Z0Y0M5amMzTXRjMjkxY21ObGJXRndMMmx0Y0c5eWRHVmtMbTF2WkhWc1pTNXpZWE56SW4wPSAqLzE1NAB7InZlcnNpb24iOjMsIm1hcHBpbmdzIjoiQUFDRSIsImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIi9yb290L2ltcG9ydGVkLm1vZHVsZS5zYXNzIl0sInNvdXJjZXNDb250ZW50IjpbIi5pbXBvcnRlZFxuICAmLXNhc3MtbW9kdWxlXG4gICAgY29sb3I6IHJlZFxuIl19"
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
        visualization: "https://evanw.github.io/source-map-visualization/#NDc5AC5pbXBvcnRlZC1sZXNzIHsKICBjb2xvcjogcmVkOwp9CgovKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p0WVhCd2FXNW5jeUk2SWtGQlEwVWlMQ0p1WVcxbGN5STZXMTBzSW1sbmJtOXlaVXhwYzNRaU9sdGRMQ0p6YjNWeVkyVnpJanBiSWtRNkwyUnZZM1Z0Wlc1MGN5OUhhWFJJZFdJdmRtbDBaUzl3YkdGNVozSnZkVzVrTFhSbGJYQXZZM056TFhOdmRYSmpaVzFoY0M5cGJYQnZjblJsWkM1c1pYTnpJbDBzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiSWk1cGJYQnZjblJsWkNCN1hHNGdJQ1l0YkdWemN5QjdYRzRnSUNBZ1kyOXNiM0k2SUVCamIyeHZjanRjYmlBZ2ZWeHVmVnh1SWwwc0ltWnBiR1VpT2lKRU9pOWtiMk4xYldWdWRITXZSMmwwU0hWaUwzWnBkR1V2Y0d4aGVXZHliM1Z1WkMxMFpXMXdMMk56Y3kxemIzVnlZMlZ0WVhBdmFXMXdiM0owWldRdWJHVnpjeUo5ICovMTU2AHsidmVyc2lvbiI6MywibWFwcGluZ3MiOiJBQUNFIiwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiL3Jvb3QvaW1wb3J0ZWQubGVzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIuaW1wb3J0ZWQge1xuICAmLWxlc3Mge1xuICAgIGNvbG9yOiBAY29sb3I7XG4gIH1cbn1cbiJdfQ=="
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
        visualization: "https://evanw.github.io/source-map-visualization/#NDgwAC5pbXBvcnRlZC1zdHlsdXMgewogIGNvbG9yOiBwdXJwbGU7Cn0KCi8qIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnRZWEJ3YVc1bmN5STZJa0ZCUTBVaUxDSnVZVzFsY3lJNlcxMHNJbWxuYm05eVpVeHBjM1FpT2x0ZExDSnpiM1Z5WTJWeklqcGJJa1E2TDJSdlkzVnRaVzUwY3k5SGFYUklkV0l2ZG1sMFpTOXdiR0Y1WjNKdmRXNWtMWFJsYlhBdlkzTnpMWE52ZFhKalpXMWhjQzlwYlhCdmNuUmxaQzV6ZEhsc0lsMHNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJaTVwYlhCdmNuUmxaRnh1SUNBbUxYTjBlV3gxYzF4dUlDQWdJR052Ykc5eUlHSnNkV1V0Y21Wa0xXMXBlR1ZrWEc0aVhTd2labWxzWlNJNklrUTZMMlJ2WTNWdFpXNTBjeTlIYVhSSWRXSXZkbWwwWlM5d2JHRjVaM0p2ZFc1a0xYUmxiWEF2WTNOekxYTnZkWEpqWlcxaGNDOXBiWEJ2Y25SbFpDNXpkSGxzSW4wPSAqLzE1MgB7InZlcnNpb24iOjMsIm1hcHBpbmdzIjoiQUFDRSIsImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIi9yb290L2ltcG9ydGVkLnN0eWwiXSwic291cmNlc0NvbnRlbnQiOlsiLmltcG9ydGVkXG4gICYtc3R5bHVzXG4gICAgY29sb3IgYmx1ZS1yZWQtbWl4ZWRcbiJdfQ=="
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
        visualization: "https://evanw.github.io/source-map-visualization/#NDU0AC5pbXBvcnRlZC1zdWdhcnNzIHsKICBjb2xvcjogcmVkOwp9CgovKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p0WVhCd2FXNW5jeUk2SWtGQlFVRWlMQ0p1WVcxbGN5STZXMTBzSW1sbmJtOXlaVXhwYzNRaU9sdGRMQ0p6YjNWeVkyVnpJanBiSWtRNkwyUnZZM1Z0Wlc1MGN5OUhhWFJJZFdJdmRtbDBaUzl3YkdGNVozSnZkVzVrTFhSbGJYQXZZM056TFhOdmRYSmpaVzFoY0M5cGJYQnZjblJsWkM1emMzTWlYU3dpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpTG1sdGNHOXlkR1ZrTFhOMVoyRnljM05jYmlBZ1kyOXNiM0k2SUhKbFpGeHVJbDBzSW1acGJHVWlPaUpFT2k5a2IyTjFiV1Z1ZEhNdlIybDBTSFZpTDNacGRHVXZjR3hoZVdkeWIzVnVaQzEwWlcxd0wyTnpjeTF6YjNWeVkyVnRZWEF2YVcxd2IzSjBaV1F1YzNOekluMD0gKi8xMzUAeyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6IkFBQUEiLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyIvcm9vdC9pbXBvcnRlZC5zc3MiXSwic291cmNlc0NvbnRlbnQiOlsiLmltcG9ydGVkLXN1Z2Fyc3NcbiAgY29sb3I6IHJlZFxuIl19"
      }
    `)
  })

  test('should not output missing source file warning', () => {
    serverLogs.forEach((log) => {
      expect(log).not.toMatch(/Sourcemap for .+ points to missing source files/)
    })
  })
})
