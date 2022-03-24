import { fromComment } from 'convert-source-map'
import { normalizePath } from 'vite'
import { isBuild, testDir } from 'testUtils'

if (!isBuild) {
  const root = normalizePath(testDir)

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

  const extractSourcemap = (content: string) => {
    const lines = content.trim().split('\n')
    return fromComment(lines[lines.length - 1]).toObject()
  }

  const formatSourcemapForSnapshot = (map: any) => {
    const m = { ...map }
    delete m.file
    delete m.names
    m.sources = m.sources.map((source) => source.replace(root, '/root'))
    return m
  }

  test('css', async () => {
    const css = await getStyleTagContentIncluding('.css ')
    const map = extractSourcemap(css)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      Object {
        "mappings": ";AAOA;EACE,UAAU;AACZ",
        "sources": Array [
          "/root/Css.vue",
        ],
        "sourcesContent": Array [
          "<template>
        <p class=\\"css\\">&lt;css&gt;</p>
        <p :class=\\"$style['css-module']\\">&lt;css&gt; module</p>
        <p class=\\"css-scoped\\">&lt;css&gt; scoped</p>
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
      Object {
        "mappings": ";AAaA;EACE,UAAU;AACZ",
        "sources": Array [
          "/root/Css.vue",
        ],
        "sourcesContent": Array [
          "<template>
        <p class=\\"css\\">&lt;css&gt;</p>
        <p :class=\\"$style['css-module']\\">&lt;css&gt; module</p>
        <p class=\\"css-scoped\\">&lt;css&gt; scoped</p>
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
      Object {
        "mappings": ";AAmBA;EACE,UAAU;AACZ",
        "sources": Array [
          "/root/Css.vue",
        ],
        "sourcesContent": Array [
          "<template>
        <p class=\\"css\\">&lt;css&gt;</p>
        <p :class=\\"$style['css-module']\\">&lt;css&gt; module</p>
        <p class=\\"css-scoped\\">&lt;css&gt; scoped</p>
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
      Object {
        "mappings": "AAKA;EACE",
        "sources": Array [
          "/root/Sass.vue",
        ],
        "sourcesContent": Array [
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
      Object {
        "mappings": "AAAA;EACE;;ACOF;EACE",
        "sources": Array [
          "/root/sassWithImportImported.sass",
          "/root/SassWithImport.vue",
        ],
        "sourcesContent": Array [
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
      Object {
        "mappings": "AAKA;EACE",
        "sources": Array [
          "/root/Less.vue",
        ],
        "sourcesContent": Array [
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
      Object {
        "mappings": "AAAA;EACE,UAAU;AACZ",
        "sources": Array [
          "/root/src-import/src-import.css",
        ],
        "sourcesContent": Array [
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
      Object {
        "mappings": "AAAA;EACE;;ACCF;EACE",
        "sources": Array [
          "/root/src-import/src-import-imported.sass",
          "/root/src-import/src-import.sass",
        ],
        "sourcesContent": Array [
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
} else {
  test('this file only includes test for serve', () => {
    expect(true).toBe(true)
  })
}
