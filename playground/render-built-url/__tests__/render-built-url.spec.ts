import { build } from 'vite'
import { expect, test } from 'vitest'
import type { OutputAsset, OutputChunk, RolldownOutput } from 'rolldown'
import { rootDir } from '~utils'

async function buildWithRenderBuiltUrl(
  renderBuiltUrl: (filename: string) => string,
): Promise<RolldownOutput> {
  return (await build({
    root: rootDir,
    logLevel: 'silent',
    build: { write: false },
    experimental: { renderBuiltUrl },
  })) as RolldownOutput
}

test('changing renderBuiltUrl invalidates JS chunk hashes', async () => {
  const [resultA, resultB] = await Promise.all([
    buildWithRenderBuiltUrl((f) => `/cdn-a/${f}`),
    buildWithRenderBuiltUrl((f) => `/cdn-b/${f}`),
  ])

  const chunksA = resultA.output
    .filter((o): o is OutputChunk => o.type === 'chunk')
    .map((o) => o.fileName)
  const chunksB = resultB.output
    .filter((o): o is OutputChunk => o.type === 'chunk')
    .map((o) => o.fileName)

  expect(chunksA.length).toBeGreaterThan(0)
  expect(chunksA).not.toEqual(chunksB)
})

test('changing renderBuiltUrl invalidates CSS asset hashes', async () => {
  const [resultA, resultB] = await Promise.all([
    buildWithRenderBuiltUrl((f) => `/cdn-a/${f}`),
    buildWithRenderBuiltUrl((f) => `/cdn-b/${f}`),
  ])

  const cssA = resultA.output
    .filter(
      (o): o is OutputAsset =>
        o.type === 'asset' && o.fileName.endsWith('.css'),
    )
    .map((o) => o.fileName)
  const cssB = resultB.output
    .filter(
      (o): o is OutputAsset =>
        o.type === 'asset' && o.fileName.endsWith('.css'),
    )
    .map((o) => o.fileName)

  expect(cssA.length).toBeGreaterThan(0)
  expect(cssA).not.toEqual(cssB)
})
