import { fromComment } from 'convert-source-map'
import { URL } from 'url'
import { normalizePath } from 'vite'
import { isBuild, testDir } from 'testUtils'

if (!isBuild) {
  const root = normalizePath(testDir)

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

  test('js', async () => {
    const res = await page.request.get(new URL('./foo.js', page.url()).href)
    const js = await res.text()
    const lines = js.split('\n')
    expect(lines[lines.length - 1].includes('//')).toBe(false) // expect no sourcemap
  })

  test('ts', async () => {
    const res = await page.request.get(new URL('./bar.ts', page.url()).href)
    const js = await res.text()
    const map = extractSourcemap(js)
    expect(formatSourcemapForSnapshot(map)).toMatchInlineSnapshot(`
      Object {
        "mappings": "AAAO,aAAM,MAAM;",
        "sources": Array [
          "/root/bar.ts",
        ],
        "sourcesContent": Array [
          "export const bar = 'bar'
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
