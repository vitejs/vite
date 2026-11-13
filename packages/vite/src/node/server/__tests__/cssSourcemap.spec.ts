import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import convertSourceMap from 'convert-source-map'
import { expect, onTestFinished, test } from 'vitest'
import { createTestServer } from '../../__tests__/testUtils'

test.each(['postcss', 'lightningcss'] as const)(
  '%s CSS sourcemap sources with a base and an import outside root',
  async (transformer) => {
    // Match Vite's realpath resolution when the temp directory is an alias.
    const tempDir = await fs.realpath(os.tmpdir())
    const workspace = await fs.mkdtemp(path.join(tempDir, 'vite-css-map-'))
    onTestFinished(() => fs.rm(workspace, { recursive: true, force: true }))

    const root = path.join(workspace, 'app')
    const file = path.join(root, 'nested/style.css')
    const outsideFile = path.join(workspace, 'shared.css')
    const shared = '.shared { color: blue }\n'
    const style = '@import "../../shared.css";\n.style { color: red }\n'
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, style)
    await fs.writeFile(outsideFile, shared)

    const server = await createTestServer({
      root,
      base: '/custom/',
      configFile: false,
      css: { transformer, devSourcemap: true },
      server: { origin: 'http://vite.example', fs: { allow: [workspace] } },
    })

    const injected = await server.transformRequest('/nested/style.css')
    const css = JSON.parse(
      injected!.code.match(/^const __vite__css = (.*)$/m)![1],
    )
    const inline = convertSourceMap.fromSource(css).toObject()
    const expected = {
      'http://vite.example/custom/nested/style.css': style,
      [pathToFileURL(outsideFile).href]: shared,
    }
    expect(
      Object.fromEntries(
        inline.sources.map((source: string, i: number) => [
          source,
          inline.sourcesContent[i],
        ]),
      ),
    ).toEqual(expected)
    for (const page of ['/custom/', '/custom/admin/index.html']) {
      const url = new URL(
        inline.sources.find((source: string) => source.endsWith('/style.css')),
        'http://backend.example' + page,
      )
      expect(url.href).toBe('http://vite.example/custom/nested/style.css')
    }

    const direct = await server.transformRequest('/nested/style.css?direct')
    expect(direct?.map).toHaveProperty('version', 3)
    const map = direct!.map as typeof inline
    expect(
      Object.fromEntries(
        map.sources.map((source: string, i: number) => [
          source,
          map.sourcesContent[i],
        ]),
      ),
    ).toEqual({
      'style.css': style,
      [pathToFileURL(outsideFile).href]: shared,
    })
  },
)
