import { URL } from 'url'
import {
  extractSourcemap,
  formatSourcemapForSnapshot,
  isServe,
  page,
  serverLogs
} from '~utils'

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
          accept: 'text/css'
        }
      }
    )
    const css = await res.text()
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AAAA,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;AACT,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;AACb,CAAC;",
        "sources": [
          "/root/linked.css",
        ],
        "sourcesContent": [
          ".linked {
        color: red;
      }
      ",
        ],
        "version": 3,
      }
    `)
  })

  test('linked css with import', async () => {
    const res = await page.request.get(
      new URL('./linked-with-import.css', page.url()).href,
      {
        headers: {
          accept: 'text/css'
        }
      }
    )
    const css = await res.text()
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AAAA;EACE,UAAU;AACZ;;ACAA;EACE,UAAU;AACZ",
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
      }
    `)
  })

  test('imported css', async () => {
    const css = await getStyleTagContentIncluding('.imported ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AAAA,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;AACX,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;AACb,CAAC;",
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
      }
    `)
  })

  test('imported css with import', async () => {
    const css = await getStyleTagContentIncluding('.imported-with-import ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
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
      }
    `)
  })

  test('imported sass', async () => {
    const css = await getStyleTagContentIncluding('.imported-sass ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AACE;EACE",
        "sources": [
          "/root/imported.sass",
        ],
        "sourcesContent": [
          ".imported
        &-sass
          color: red
      ",
        ],
        "version": 3,
      }
    `)
  })

  test('imported sass module', async () => {
    const css = await getStyleTagContentIncluding('._imported-sass-module_')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
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
      }
    `)
  })

  test('imported less', async () => {
    const css = await getStyleTagContentIncluding('.imported-less ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AACE;EACE",
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
      }
    `)
  })

  test('imported stylus', async () => {
    const css = await getStyleTagContentIncluding('.imported-stylus ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AACE;EACE,cAAM",
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
      }
    `)
  })

  test('should not output missing source file warning', () => {
    serverLogs.forEach((log) => {
      expect(log).not.toMatch(/Sourcemap for .+ points to missing source files/)
    })
  })
})
