import { URL } from 'url'
import {
  extractSourcemap,
  formatSourcemapForSnapshot,
  isServe,
  page
} from '~utils'

describe.runIf(isServe)('serve:vue-sourcemap', () => {
  const getStyleTagContentIncluding = async (content: string) => {
    const styles = await page.$$('style')
    for (const style of styles) {
      const text = await style.textContent()
      if (text.includes(content)) {
        return text
      }
    }
    throw new Error('Style not found: ' + content)
  }

  test('js', async () => {
    const res = await page.request.get(new URL('./Js.vue', page.url()).href)
    const js = await res.text()
    const map = extractSourcemap(js)
    expect(formatSourcemapForSnapshot(map)).toMatchSnapshot()
  })

  test('ts', async () => {
    const res = await page.request.get(new URL('./Ts.vue', page.url()).href)
    const js = await res.text()
    const map = extractSourcemap(js)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": ";AAKA,QAAQ,IAAI,WAAW;;;;;AAIvB,YAAQ,IAAI,UAAU;;;;;;;;uBARpB,oBAAiB,WAAd,MAAU",
        "sources": [
          "/root/Ts.vue",
        ],
        "sourcesContent": [
          "<template>
        <p>&lt;ts&gt;</p>
      </template>

      <script lang=\\"ts\\">
      console.log('ts script')
      </script>

      <script lang=\\"ts\\" setup>
      console.log('ts setup')
      </script>
      ",
        ],
        "version": 3,
      }
    `)
  })

  test('css', async () => {
    const css = await getStyleTagContentIncluding('.css ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": ";AAQA;EACE,UAAU;AACZ",
        "sources": [
          "/root/Css.vue",
        ],
        "sourcesContent": [
          "<template>
        <p class=\\"css\\">&lt;css&gt;</p>
        <p :class=\\"\$style['css-module']\\">&lt;css&gt; module</p>
        <p class=\\"css-scoped\\">&lt;css&gt; scoped</p>
        <p class=\\"css-scoped-nested\\">&lt;css&gt; scoped with nested</p>
      </template>

      <style>
      .css {
        color: red;
      }
      </style>

      <style module>
      .css-module {
        color: red;
      }
      </style>

      <style scoped>
      .css-scoped {
        color: red;
      }
      </style>

      <style scoped>
      .css-scoped-nested {
        color: red;
        .dummy {
          color: green;
        }
        font-weight: bold;
      }
      </style>
      ",
        ],
        "version": 3,
      }
    `)
  })

  test('css module', async () => {
    const css = await getStyleTagContentIncluding('._css-module_')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": ";AAcA;EACE,UAAU;AACZ",
        "sources": [
          "/root/Css.vue",
        ],
        "sourcesContent": [
          "<template>
        <p class=\\"css\\">&lt;css&gt;</p>
        <p :class=\\"\$style['css-module']\\">&lt;css&gt; module</p>
        <p class=\\"css-scoped\\">&lt;css&gt; scoped</p>
        <p class=\\"css-scoped-nested\\">&lt;css&gt; scoped with nested</p>
      </template>

      <style>
      .css {
        color: red;
      }
      </style>

      <style module>
      .css-module {
        color: red;
      }
      </style>

      <style scoped>
      .css-scoped {
        color: red;
      }
      </style>

      <style scoped>
      .css-scoped-nested {
        color: red;
        .dummy {
          color: green;
        }
        font-weight: bold;
      }
      </style>
      ",
        ],
        "version": 3,
      }
    `)
  })

  test('css scoped', async () => {
    const css = await getStyleTagContentIncluding('.css-scoped[data-v-')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": ";AAoBA;EACE,UAAU;AACZ",
        "sources": [
          "/root/Css.vue",
        ],
        "sourcesContent": [
          "<template>
        <p class=\\"css\\">&lt;css&gt;</p>
        <p :class=\\"\$style['css-module']\\">&lt;css&gt; module</p>
        <p class=\\"css-scoped\\">&lt;css&gt; scoped</p>
        <p class=\\"css-scoped-nested\\">&lt;css&gt; scoped with nested</p>
      </template>

      <style>
      .css {
        color: red;
      }
      </style>

      <style module>
      .css-module {
        color: red;
      }
      </style>

      <style scoped>
      .css-scoped {
        color: red;
      }
      </style>

      <style scoped>
      .css-scoped-nested {
        color: red;
        .dummy {
          color: green;
        }
        font-weight: bold;
      }
      </style>
      ",
        ],
        "version": 3,
      }
    `)
  })

  test('sass', async () => {
    const css = await getStyleTagContentIncluding('.sass ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AAKA;EACE",
        "sources": [
          "/root/Sass.vue",
        ],
        "sourcesContent": [
          "<template>
        <p class=\\"sass\\">&lt;sass&gt;</p>
      </template>

      <style lang=\\"sass\\">
      .sass
        color: red
      </style>
      ",
        ],
        "version": 3,
      }
    `)
  })

  test('sass with import', async () => {
    const css = await getStyleTagContentIncluding('.sass-with-import ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AAAA;EACE;;ACOF;EACE",
        "sources": [
          "/root/sassWithImportImported.sass",
          "/root/SassWithImport.vue",
        ],
        "sourcesContent": [
          ".sass-with-import-imported
        color: red
      ",
          "<template>
        <p class=\\"sass-with-import\\">&lt;sass&gt; with import</p>
        <p class=\\"sass-with-import-imported\\">&lt;sass&gt; with import (imported)</p>
      </template>

      <style lang=\\"sass\\">
      @import './sassWithImportImported'

      .sass-with-import
        color: red
      </style>
      ",
        ],
        "version": 3,
      }
    `)
  })

  test('less with additionalData', async () => {
    const css = await getStyleTagContentIncluding('.less ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AAKA;EACE",
        "sources": [
          "/root/Less.vue",
        ],
        "sourcesContent": [
          "<template>
        <p class=\\"less\\">&lt;less&gt; with additionalData</p>
      </template>

      <style lang=\\"less\\">
      .less {
        color: @color;
      }
      </style>
      ",
        ],
        "version": 3,
      }
    `)
  })

  test('src imported', async () => {
    const css = await getStyleTagContentIncluding('.src-import[data-v-')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AAAA;EACE,UAAU;AACZ",
        "sources": [
          "/root/src-import/src-import.css",
        ],
        "sourcesContent": [
          ".src-import {
        color: red;
      }
      ",
        ],
        "version": 3,
      }
    `)
  })

  test('src imported sass', async () => {
    const css = await getStyleTagContentIncluding('.src-import-sass[data-v-')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      {
        "mappings": "AAAA;EACE;;ACCF;EACE",
        "sources": [
          "/root/src-import/src-import-imported.sass",
          "/root/src-import/src-import.sass",
        ],
        "sourcesContent": [
          ".src-import-sass-imported
        color: red
      ",
          "@import './src-import-imported'

      .src-import-sass
        color: red
      ",
        ],
        "version": 3,
      }
    `)
  })
})
