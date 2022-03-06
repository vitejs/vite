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

  const extractSourcemap = (content: string) =>
    fromComment(content.trim().split('\n').at(-1)).toObject()

  const assertSourcemap = (map: any, { sources }: { sources: string[] }) => {
    expect(map.sources).toStrictEqual(sources)
    expect(map.mappings).toMatchSnapshot('mappings')
    expect(map.sourcesContent).toMatchSnapshot('sourcesContent')
  }

  test('css', async () => {
    const css = await getStyleTagContentIncluding('.css ')
    const map = extractSourcemap(css)
    assertSourcemap(map, {
      sources: [`${root}/Css.vue`]
    })
  })

  test('css module', async () => {
    const css = await getStyleTagContentIncluding('._css-module_')
    const map = extractSourcemap(css)
    assertSourcemap(map, {
      sources: [`${root}/Css.vue`]
    })
  })

  test('css scoped', async () => {
    const css = await getStyleTagContentIncluding('.css-scoped[data-v-')
    const map = extractSourcemap(css)
    assertSourcemap(map, {
      sources: [`${root}/Css.vue`]
    })
  })

  test('sass', async () => {
    const css = await getStyleTagContentIncluding('.sass ')
    const map = extractSourcemap(css)
    assertSourcemap(map, {
      sources: [`${root}/Sass.vue`]
    })
  })

  test('sass with import', async () => {
    const css = await getStyleTagContentIncluding('.sass-with-import ')
    const map = extractSourcemap(css)
    assertSourcemap(map, {
      sources: [
        `${root}/sassWithImportImported.sass`,
        `${root}/SassWithImport.vue`
      ]
    })
  })

  test('less with additionalData', async () => {
    const css = await getStyleTagContentIncluding('.less ')
    const map = extractSourcemap(css)
    assertSourcemap(map, {
      sources: [`${root}/Less.vue`]
    })
  })

  test('src imported', async () => {
    const css = await getStyleTagContentIncluding('.src-import[data-v-')
    const map = extractSourcemap(css)
    assertSourcemap(map, {
      sources: [`${root}/src-import/src-import.css`]
    })
  })

  test('src imported sass', async () => {
    const css = await getStyleTagContentIncluding('.src-import-sass[data-v-')
    const map = extractSourcemap(css)
    assertSourcemap(map, {
      sources: [
        `${root}/src-import/src-import-imported.sass`,
        `${root}/src-import/src-import.sass`
      ]
    })
  })
}
