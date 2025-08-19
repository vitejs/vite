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
        visualization: "https://evanw.github.io/source-map-visualization/#NTk2AC5iZS1pbXBvcnRlZCB7CiAgY29sb3I6IHJlZDsKfQoKLmxpbmtlZC13aXRoLWltcG9ydCB7CiAgY29sb3I6IHJlZDsKfQoKLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUptYVd4bElqb2lSRG92Wkc5amRXMWxiblJ6TDBkcGRFaDFZaTkyYVhSbEwzQnNZWGxuY205MWJtUXRkR1Z0Y0M5amMzTXRjMjkxY21ObGJXRndMMnhwYm10bFpDMTNhWFJvTFdsdGNHOXlkQzVqYzNNaUxDSnRZWEJ3YVc1bmN5STZJa0ZCUVVFN1JVRkRSU3hWUVVGVk8wRkJRMW83TzBGRFFVRTdSVUZEUlN4VlFVRlZPMEZCUTFvaUxDSnVZVzFsY3lJNlcxMHNJbk52ZFhKalpYTWlPbHNpWW1VdGFXMXdiM0owWldRdVkzTnpJaXdpYkdsdWEyVmtMWGRwZEdndGFXMXdiM0owTG1OemN5SmRMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUl1WW1VdGFXMXdiM0owWldRZ2UxeHVJQ0JqYjJ4dmNqb2djbVZrTzF4dWZWeHVJaXdpUUdsdGNHOXlkQ0FuUUM5aVpTMXBiWEJ2Y25SbFpDNWpjM01uTzF4dVhHNHViR2x1YTJWa0xYZHBkR2d0YVcxd2IzSjBJSHRjYmlBZ1kyOXNiM0k2SUhKbFpEdGNibjFjYmlKZExDSjJaWEp6YVc5dUlqb3pmUT09ICovMjU0AHsibWFwcGluZ3MiOiJBQUFBO0VBQ0UsVUFBVTtBQUNaOztBQ0FBO0VBQ0UsVUFBVTtBQUNaIiwic291cmNlcyI6WyJiZS1pbXBvcnRlZC5jc3MiLCJsaW5rZWQtd2l0aC1pbXBvcnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIi5iZS1pbXBvcnRlZCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iLCJAaW1wb3J0ICdAL2JlLWltcG9ydGVkLmNzcyc7XG5cbi5saW5rZWQtd2l0aC1pbXBvcnQge1xuICBjb2xvcjogcmVkO1xufVxuIl0sInZlcnNpb24iOjN9"
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
        visualization: "https://evanw.github.io/source-map-visualization/#Mzk0AC5pbXBvcnRlZCB7CiAgY29sb3I6IHJlZDsKfQoKLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklrUTZMMlJ2WTNWdFpXNTBjeTlIYVhSSWRXSXZkbWwwWlM5d2JHRjVaM0p2ZFc1a0xYUmxiWEF2WTNOekxYTnZkWEpqWlcxaGNDOXBiWEJ2Y25SbFpDNWpjM01pWFN3aWMyOTFjbU5sYzBOdmJuUmxiblFpT2xzaUxtbHRjRzl5ZEdWa0lIdGNiaUFnWTI5c2IzSTZJSEpsWkR0Y2JuMWNiaUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lRVUZCUVN4RFFVRkRMRkZCUVZFc1EwRkJRenRCUVVOV0xFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4SFFVRkhPMEZCUTFvN0luMD0gKi8xNzMAeyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9yb290L2ltcG9ydGVkLmNzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIuaW1wb3J0ZWQge1xuICBjb2xvcjogcmVkO1xufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLFFBQVEsQ0FBQztBQUNWLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHO0FBQ1o7In0="
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
        visualization: "https://evanw.github.io/source-map-visualization/#NzUwAC5iZS1pbXBvcnRlZCB7CiAgY29sb3I6IHJlZDsKfQoKLmltcG9ydGVkLXdpdGgtaW1wb3J0IHsKICBjb2xvcjogcmVkOwp9CgovKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5Sm1hV3hsSWpvaVJEb3ZaRzlqZFcxbGJuUnpMMGRwZEVoMVlpOTJhWFJsTDNCc1lYbG5jbTkxYm1RdGRHVnRjQzlqYzNNdGMyOTFjbU5sYldGd0wybHRjRzl5ZEdWa0xYZHBkR2d0YVcxd2IzSjBMbU56Y3lJc0ltMWhjSEJwYm1keklqb2lRVUZCUVR0RlFVTkZMRlZCUVZVN1FVRkRXanM3UVVOQlFUdEZRVU5GTEZWQlFWVTdRVUZEV2lJc0ltNWhiV1Z6SWpwYlhTd2ljMjkxY21ObGN5STZXeUpFT2k5a2IyTjFiV1Z1ZEhNdlIybDBTSFZpTDNacGRHVXZjR3hoZVdkeWIzVnVaQzEwWlcxd0wyTnpjeTF6YjNWeVkyVnRZWEF2WW1VdGFXMXdiM0owWldRdVkzTnpJaXdpUkRvdlpHOWpkVzFsYm5SekwwZHBkRWgxWWk5MmFYUmxMM0JzWVhsbmNtOTFibVF0ZEdWdGNDOWpjM010YzI5MWNtTmxiV0Z3TDJsdGNHOXlkR1ZrTFhkcGRHZ3RhVzF3YjNKMExtTnpjeUpkTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lJdVltVXRhVzF3YjNKMFpXUWdlMXh1SUNCamIyeHZjam9nY21Wa08xeHVmVnh1SWl3aVFHbHRjRzl5ZENBblFDOWlaUzFwYlhCdmNuUmxaQzVqYzNNbk8xeHVYRzR1YVcxd2IzSjBaV1F0ZDJsMGFDMXBiWEJ2Y25RZ2UxeHVJQ0JqYjJ4dmNqb2djbVZrTzF4dWZWeHVJbDBzSW5abGNuTnBiMjRpT2pOOSAqLzI3MAB7Im1hcHBpbmdzIjoiQUFBQTtFQUNFLFVBQVU7QUFDWjs7QUNBQTtFQUNFLFVBQVU7QUFDWiIsInNvdXJjZXMiOlsiL3Jvb3QvYmUtaW1wb3J0ZWQuY3NzIiwiL3Jvb3QvaW1wb3J0ZWQtd2l0aC1pbXBvcnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIi5iZS1pbXBvcnRlZCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iLCJAaW1wb3J0ICdAL2JlLWltcG9ydGVkLmNzcyc7XG5cbi5pbXBvcnRlZC13aXRoLWltcG9ydCB7XG4gIGNvbG9yOiByZWQ7XG59XG4iXSwidmVyc2lvbiI6M30="
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
        visualization: "https://evanw.github.io/source-map-visualization/#NTcwAC5pbXBvcnRlZC1zYXNzIHsKICBjb2xvcjogcmVkOwp9Ci8qIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWU2IyOTBJam9pSWl3aWMyOTFjbU5sY3lJNld5SkVPaTlrYjJOMWJXVnVkSE12UjJsMFNIVmlMM1pwZEdVdmNHeGhlV2R5YjNWdVpDMTBaVzF3TDJOemN5MXpiM1Z5WTJWdFlYQXZhVzF3YjNKMFpXUXVjMkZ6Y3lJc0lrUTZMMlJ2WTNWdFpXNTBjeTlIYVhSSWRXSXZkbWwwWlM5d2JHRjVaM0p2ZFc1a0xYUmxiWEF2WTNOekxYTnZkWEpqWlcxaGNDOXBiWEJ2Y25SbFpDMXVaWE4wWldRdWMyRnpjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lRVUZIUlR0RlFVTkZMRTlEU2swaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SkFkWE5sSUZ3aUwybHRjRzl5ZEdWa0xXNWxjM1JsWkM1ellYTnpYQ0pjYmx4dUxtbHRjRzl5ZEdWa1hHNGdJQ1l0YzJGemMxeHVJQ0FnSUdOdmJHOXlPaUJwYlhCdmNuUmxaQzF1WlhOMFpXUXVKSEJ5YVcxaGNubGNiaUlzSWlSd2NtbHRZWEo1T2lCeVpXUmNiaUpkZlE9PSAqLzI1MgB7InZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi9yb290L2ltcG9ydGVkLnNhc3MiLCIvcm9vdC9pbXBvcnRlZC1uZXN0ZWQuc2FzcyJdLCJtYXBwaW5ncyI6IkFBR0U7RUFDRSxPQ0pNIiwic291cmNlc0NvbnRlbnQiOlsiQHVzZSBcIi9pbXBvcnRlZC1uZXN0ZWQuc2Fzc1wiXG5cbi5pbXBvcnRlZFxuICAmLXNhc3NcbiAgICBjb2xvcjogaW1wb3J0ZWQtbmVzdGVkLiRwcmltYXJ5XG4iLCIkcHJpbWFyeTogcmVkXG4iXX0="
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
        visualization: "https://evanw.github.io/source-map-visualization/#NTEwAC5faW1wb3J0ZWQtc2Fzcy1tb2R1bGVfcjFxY3BfMSB7CiAgY29sb3I6IHJlZDsKfQovKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2lSRG92Wkc5amRXMWxiblJ6TDBkcGRFaDFZaTkyYVhSbEwzQnNZWGxuY205MWJtUXRkR1Z0Y0M5amMzTXRjMjkxY21ObGJXRndMMmx0Y0c5eWRHVmtMbTF2WkhWc1pTNXpZWE56SWl3aWJXRndjR2x1WjNNaU9pSkJRVU5GTzBWQlEwVWlMQ0p1WVcxbGN5STZXMTBzSW1sbmJtOXlaVXhwYzNRaU9sdGRMQ0p6YjNWeVkyVnpJanBiSWtRNkwyUnZZM1Z0Wlc1MGN5OUhhWFJJZFdJdmRtbDBaUzl3YkdGNVozSnZkVzVrTFhSbGJYQXZZM056TFhOdmRYSmpaVzFoY0M5cGJYQnZjblJsWkM1dGIyUjFiR1V1YzJGemN5SmRMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUl1YVcxd2IzSjBaV1JjYmlBZ0ppMXpZWE56TFcxdlpIVnNaVnh1SUNBZ0lHTnZiRzl5T2lCeVpXUmNiaUpkZlE9PSAqLzE1OQB7InZlcnNpb24iOjMsIm1hcHBpbmdzIjoiQUFDRTtFQUNFIiwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiL3Jvb3QvaW1wb3J0ZWQubW9kdWxlLnNhc3MiXSwic291cmNlc0NvbnRlbnQiOlsiLmltcG9ydGVkXG4gICYtc2Fzcy1tb2R1bGVcbiAgICBjb2xvcjogcmVkXG4iXX0="
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
        visualization: "https://evanw.github.io/source-map-visualization/#NDk1AC5pbXBvcnRlZC1sZXNzIHsKICBjb2xvcjogcmVkOwp9CgovKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p0WVhCd2FXNW5jeUk2SWtGQlEwVXNVMEZCUXp0RlFVTkRJaXdpYm1GdFpYTWlPbHRkTENKcFoyNXZjbVZNYVhOMElqcGJYU3dpYzI5MWNtTmxjeUk2V3lKRU9pOWtiMk4xYldWdWRITXZSMmwwU0hWaUwzWnBkR1V2Y0d4aGVXZHliM1Z1WkMxMFpXMXdMMk56Y3kxemIzVnlZMlZ0WVhBdmFXMXdiM0owWldRdWJHVnpjeUpkTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lJdWFXMXdiM0owWldRZ2UxeHVJQ0FtTFd4bGMzTWdlMXh1SUNBZ0lHTnZiRzl5T2lCQVkyOXNiM0k3WEc0Z0lIMWNibjFjYmlKZExDSm1hV3hsSWpvaVJEb3ZaRzlqZFcxbGJuUnpMMGRwZEVoMVlpOTJhWFJsTDNCc1lYbG5jbTkxYm1RdGRHVnRjQzlqYzNNdGMyOTFjbU5sYldGd0wybHRjRzl5ZEdWa0xteGxjM01pZlE9PSAqLzE2NgB7InZlcnNpb24iOjMsIm1hcHBpbmdzIjoiQUFDRSxTQUFDO0VBQ0MiLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyIvcm9vdC9pbXBvcnRlZC5sZXNzIl0sInNvdXJjZXNDb250ZW50IjpbIi5pbXBvcnRlZCB7XG4gICYtbGVzcyB7XG4gICAgY29sb3I6IEBjb2xvcjtcbiAgfVxufVxuIl19"
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
        visualization: "https://evanw.github.io/source-map-visualization/#NTAxAC5pbXBvcnRlZC1zdHlsdXMgewogIGNvbG9yOiAjODAwMDgwOwp9CgovKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2lSRG92Wkc5amRXMWxiblJ6TDBkcGRFaDFZaTkyYVhSbEwzQnNZWGxuY205MWJtUXRkR1Z0Y0M5amMzTXRjMjkxY21ObGJXRndMMmx0Y0c5eWRHVmtMbk4wZVd3aUxDSnRZWEJ3YVc1bmN5STZJa0ZCUTBVN1JVRkRSU3hQUVVGTkxGRkJRVTRpTENKdVlXMWxjeUk2VzEwc0ltbG5ibTl5WlV4cGMzUWlPbHRkTENKemIzVnlZMlZ6SWpwYklrUTZMMlJ2WTNWdFpXNTBjeTlIYVhSSWRXSXZkbWwwWlM5d2JHRjVaM0p2ZFc1a0xYUmxiWEF2WTNOekxYTnZkWEpqWlcxaGNDOXBiWEJ2Y25SbFpDNXpkSGxzSWwwc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYklpNXBiWEJ2Y25SbFpGeHVJQ0FtTFhOMGVXeDFjMXh1SUNBZ0lHTnZiRzl5SUdKc2RXVXRjbVZrTFcxcGVHVmtYRzRpWFgwPSAqLzE2NwB7InZlcnNpb24iOjMsIm1hcHBpbmdzIjoiQUFDRTtFQUNFLE9BQU0sUUFBTiIsImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIi9yb290L2ltcG9ydGVkLnN0eWwiXSwic291cmNlc0NvbnRlbnQiOlsiLmltcG9ydGVkXG4gICYtc3R5bHVzXG4gICAgY29sb3IgYmx1ZS1yZWQtbWl4ZWRcbiJdfQ=="
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
        visualization: "https://evanw.github.io/source-map-visualization/#NDQ1AC5pbXBvcnRlZC1zdWdhcnNzIHsKICBjb2xvcjogcmVkCn0KCi8qIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKbWFXeGxJam9pUkRvdlpHOWpkVzFsYm5SekwwZHBkRWgxWWk5MmFYUmxMM0JzWVhsbmNtOTFibVF0ZEdWdGNDOWpjM010YzI5MWNtTmxiV0Z3TDJsdGNHOXlkR1ZrTG5OemN5SXNJbTFoY0hCcGJtZHpJam9pUVVGQlFUdEZRVU5GTzBGQlJHVWlMQ0p1WVcxbGN5STZXMTBzSW5OdmRYSmpaWE1pT2xzaVJEb3ZaRzlqZFcxbGJuUnpMMGRwZEVoMVlpOTJhWFJsTDNCc1lYbG5jbTkxYm1RdGRHVnRjQzlqYzNNdGMyOTFjbU5sYldGd0wybHRjRzl5ZEdWa0xuTnpjeUpkTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lJdWFXMXdiM0owWldRdGMzVm5ZWEp6YzF4dUlDQmpiMnh2Y2pvZ2NtVmtYRzRpWFN3aWRtVnljMmx2YmlJNk0zMD0gKi8xMjkAeyJtYXBwaW5ncyI6IkFBQUE7RUFDRTtBQURlIiwic291cmNlcyI6WyIvcm9vdC9pbXBvcnRlZC5zc3MiXSwic291cmNlc0NvbnRlbnQiOlsiLmltcG9ydGVkLXN1Z2Fyc3NcbiAgY29sb3I6IHJlZFxuIl0sInZlcnNpb24iOjN9"
      }
    `)
  })

  test('should not output missing source file warning', () => {
    serverLogs.forEach((log) => {
      expect(log).not.toMatch(/Sourcemap for .+ points to missing source files/)
    })
  })
})
