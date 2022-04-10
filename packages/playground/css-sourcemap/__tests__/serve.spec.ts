import { URL } from 'url'
import {
  extractSourcemap,
  formatSourcemapForSnapshot,
  isBuild
} from 'testUtils'

if (!isBuild) {
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

  test('inline css', async () => {
    const css = await getStyleTagContentIncluding('.inline ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      Object {
        "mappings": "AAGO;AACP,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;AACX,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;AACf,CAAC,CAAC,CAAC;",
        "sources": Array [
          "/root/index.html",
        ],
        "sourcesContent": Array [
          "<link rel=\\"stylesheet\\" href=\\"./linked.css\\" />
      <link rel=\\"stylesheet\\" href=\\"./linked-with-import.css\\" />

      <style>
        .inline {
          color: red;
        }
      </style>

      <div class=\\"wrapper\\">
        <h1>CSS Sourcemap</h1>

        <p class=\\"inline\\">&lt;inline&gt;</p>

        <p class=\\"linked\\">&lt;linked&gt;: no import</p>
        <p class=\\"linked-with-import\\">&lt;linked&gt;: with import</p>

        <p class=\\"imported\\">&lt;imported&gt;: no import</p>
        <p class=\\"imported-with-import\\">&lt;imported&gt;: with import</p>

        <p class=\\"imported-sass\\">&lt;imported sass&gt;</p>
        <p class=\\"imported-sass-module\\">&lt;imported sass&gt; with module</p>

        <p class=\\"imported-less\\">&lt;imported less&gt; with string additionalData</p>

        <p class=\\"imported-stylus\\">&lt;imported stylus&gt;</p>
      </div>

      <script type=\\"module\\">
        import './imported.css'
        import './imported-with-import.css'

        import './imported.sass'
        import sassModule from './imported.module.sass'

        document
          .querySelector('.imported-sass-module')
          .classList.add(sassModule['imported-sass-module'])

        import './imported.less'

        import './imported.styl'
      </script>

      <iframe src=\\"virtual.html\\"></iframe>
      ",
        ],
        "version": 3,
      }
    `)
  })

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
    const lines = css.split('\n')
    expect(lines[lines.length - 1].includes('/*')).toBe(false) // expect no sourcemap
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
      Object {
        "mappings": "AAAA;EACE,UAAU;AACZ;;ACAA;EACE,UAAU;AACZ",
        "sources": Array [
          "/root/be-imported.css",
          "/root/linked-with-import.css",
        ],
        "sourcesContent": Array [
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
      Object {
        "mappings": "AAAA,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;AACX,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;AACb,CAAC;",
        "sources": Array [
          "/root/imported.css",
        ],
        "sourcesContent": Array [
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
      Object {
        "mappings": "AAAA;EACE,UAAU;AACZ;;ACAA;EACE,UAAU;AACZ",
        "sources": Array [
          "/root/be-imported.css",
          "/root/imported-with-import.css",
        ],
        "sourcesContent": Array [
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
      Object {
        "mappings": "AACE;EACE",
        "sources": Array [
          "/root/imported.sass",
        ],
        "sourcesContent": Array [
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
      Object {
        "mappings": "AACE;EACE",
        "sources": Array [
          "/root/imported.module.sass",
        ],
        "sourcesContent": Array [
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
      Object {
        "mappings": "AACE;EACE",
        "sources": Array [
          "/root/imported.less",
        ],
        "sourcesContent": Array [
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
      Object {
        "mappings": "AACE;EACE,cAAM",
        "sources": Array [
          "/root/imported.styl",
        ],
        "sourcesContent": Array [
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
} else {
  test('this file only includes test for serve', () => {
    expect(true).toBe(true)
  })
}
