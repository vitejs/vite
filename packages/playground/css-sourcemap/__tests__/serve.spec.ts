import { fromComment } from 'convert-source-map'
import { URL } from 'url'
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
    const lastLine = css.split('\n').at(-1)
    expect(lastLine.includes('/*')).toBe(false) // expect no sourcemap
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
    assertSourcemap(map, {
      sources: [`${root}/be-imported.css`, `${root}/linked-with-import.css`]
    })
  })

  test('imported css', async () => {
    const css = await getStyleTagContentIncluding('.imported ')
    const map = extractSourcemap(css)
    assertSourcemap(map, {
      sources: [`${root}/imported.css`]
    })
  })

  test('imported css with import', async () => {
    const css = await getStyleTagContentIncluding('.imported-with-import ')
    const map = extractSourcemap(css)
    assertSourcemap(map, {
      sources: [`${root}/be-imported.css`, `${root}/imported-with-import.css`]
    })
  })
}
