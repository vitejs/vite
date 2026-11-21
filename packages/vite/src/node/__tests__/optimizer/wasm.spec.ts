import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { rolldown } from 'rolldown'
import { expect, onTestFinished, test, vi } from 'vitest'
import { createBackCompatIdResolver } from '../../idResolver'
import { runOptimizeDeps, toDiscoveredDependencies } from '../../optimizer'
import { rolldownDepPlugin } from '../../optimizer/rolldownDepPlugin'
import * as wasmPlugin from '../../plugins/wasm'
import { normalizePath } from '../../utils'
import { createTestServer } from '../testUtils'

async function setup(exclude: string[] = []) {
  const builds = { count: 0 }
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'vite-optimizer-wasm-'),
  )
  onTestFinished(() => fs.rmSync(root, { recursive: true, force: true }))
  const server = await createTestServer({
    configFile: false,
    root,
    cacheDir: path.join(root, '.vite'),
    logLevel: 'silent',
    optimizeDeps: {
      noDiscovery: true,
      exclude,
      rolldownOptions: {
        plugins: [
          {
            name: 'delay-wasm-resolution',
            buildStart() {
              builds.count++
            },
            resolveId: {
              filter: { id: /\.wasm$/ },
              async handler() {
                await setTimeout(20)
              },
            },
          },
        ],
      },
    },
    server: { middlewareMode: true, ws: false },
  })
  return { root, environment: server.environments.client, builds }
}

test('externalizes nested and bare wasm imports even when JS resolves first', async () => {
  const { root, environment, builds } = await setup()
  const parseWasm = vi.spyOn(wasmPlugin, 'parseWasm')
  onTestFinished(() => parseWasm.mockRestore())
  const depDir = path.join(root, 'node_modules/@vitejs/test-wasm-dep')
  fs.cpSync(
    path.resolve(
      import.meta.dirname,
      '../../../../../../playground/wasm/wasm-dep',
    ),
    depDir,
    { recursive: true },
  )
  // A neighboring invalid wasm is not part of the import graph.
  fs.writeFileSync(path.join(depDir, 'unrelated.wasm'), 'invalid')
  const deps = toDiscoveredDependencies(environment, {
    '@vitejs/test-wasm-dep': normalizePath(path.join(depDir, 'index.js')),
    '@vitejs/test-wasm-dep/bare-glue': normalizePath(
      path.join(depDir, 'bare-glue.js'),
    ),
  })
  const result = await runOptimizeDeps(environment, deps).result
  onTestFinished(() => result.cancel())
  await result.commit()
  const code = fs.readFileSync(
    result.metadata.optimized['@vitejs/test-wasm-dep'].file,
    'utf8',
  )
  expect(code).toContain(
    JSON.stringify(normalizePath(path.join(depDir, 'nested/glue.js'))),
  )
  expect(code).toContain('bare-glue.js')
  expect(code).not.toContain('return wasm.value()')
  const entry = fs.readFileSync(
    result.metadata.optimized['@vitejs/test-wasm-dep/bare-glue'].file,
    'utf8',
  )
  expect(entry).toContain('bare-glue.js')
  expect(entry).not.toContain('return wasm.value()')
  expect(builds.count).toBe(2)
  expect(parseWasm).toHaveBeenCalledTimes(3)
})

test.each(['C:/deps/glue.js', String.raw`C:\deps\glue.js`])(
  'externalizes a wasm-imported entry with a Windows drive path: %s',
  async (file) => {
    const { environment } = await setup()
    const bundle = await rolldown({
      input: { glue: file },
      plugins: [
        ...rolldownDepPlugin(environment, { glue: file }, [], {
          files: new Set([normalizePath(file)]),
          external: new Set([normalizePath(file)]),
          entryExports: { glue: ['value'] },
        }),
        {
          name: 'windows-path-fixture',
          resolveId(id, importer) {
            if (id === file) {
              return { id, external: importer ? 'absolute' : false }
            }
          },
          load(id) {
            if (id === file) return 'export const value = 42'
          },
        },
      ],
    })
    onTestFinished(() => bundle.close())
    const { output } = await bundle.generate({ format: 'esm' })
    expect(output[0].type).toBe('chunk')
    if (output[0].type === 'chunk') {
      expect(output[0].moduleIds).toStrictEqual(['vite:wasm-entry:glue'])
      expect(output[0].code).not.toContain('42')
    }
  },
)

test('builds once without wasm', async () => {
  const { root, environment, builds } = await setup()
  const parseWasm = vi.spyOn(wasmPlugin, 'parseWasm')
  onTestFinished(() => parseWasm.mockRestore())
  fs.writeFileSync(path.join(root, 'index.js'), 'export const value = 42')
  const deps = toDiscoveredDependencies(environment, {
    dep: normalizePath(path.join(root, 'index.js')),
  })
  const result = await runOptimizeDeps(environment, deps).result
  onTestFinished(() => result.cancel())
  expect(builds.count).toBe(1)
  expect(parseWasm).not.toHaveBeenCalled()
})

test('does not rebuild when wasm glue is already external', async () => {
  const { root, environment, builds } = await setup([
    '@vitejs/test-wasm-dep/bare-glue',
  ])
  const depDir = path.join(root, 'node_modules/@vitejs/test-wasm-dep')
  fs.cpSync(
    path.resolve(
      import.meta.dirname,
      '../../../../../../playground/wasm/wasm-dep',
    ),
    depDir,
    { recursive: true },
  )
  fs.writeFileSync(
    path.join(root, 'index.js'),
    "export * from '@vitejs/test-wasm-dep/bare-glue'; import './node_modules/@vitejs/test-wasm-dep/nested/bare.wasm'",
  )
  const deps = toDiscoveredDependencies(environment, {
    dep: normalizePath(path.join(root, 'index.js')),
  })
  const result = await runOptimizeDeps(environment, deps).result
  onTestFinished(() => result.cancel())
  expect(builds.count).toBe(1)
})

test('keeps wasm with no imports external', async () => {
  const { root, environment, builds } = await setup()
  fs.writeFileSync(
    path.join(root, 'empty.wasm'),
    new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]),
  )
  fs.writeFileSync(
    path.join(root, 'index.js'),
    "import './empty.wasm'; export const value = 42",
  )
  const deps = toDiscoveredDependencies(environment, {
    dep: normalizePath(path.join(root, 'index.js')),
  })
  const result = await runOptimizeDeps(environment, deps).result
  onTestFinished(() => result.cancel())
  await result.commit()
  expect(fs.readFileSync(result.metadata.optimized.dep.file, 'utf8')).toContain(
    'empty.wasm',
  )
  expect(builds.count).toBe(1)
})

test('keeps malformed wasm external without failing optimization', async () => {
  const { root, environment, builds } = await setup()
  fs.writeFileSync(path.join(root, 'invalid.wasm'), 'invalid')
  fs.writeFileSync(path.join(root, 'index.js'), "import './invalid.wasm'")
  const deps = toDiscoveredDependencies(environment, {
    dep: normalizePath(path.join(root, 'index.js')),
  })
  const result = await runOptimizeDeps(environment, deps).result
  onTestFinished(() => result.cancel())
  await result.commit()
  expect(fs.readFileSync(result.metadata.optimized.dep.file, 'utf8')).toContain(
    JSON.stringify(normalizePath(path.join(root, 'invalid.wasm'))),
  )
  expect(builds.count).toBe(1)
})

test('ignores wasm import resolution errors during optimization', async () => {
  const { root, environment, builds } = await setup()
  const depDir = path.join(root, 'node_modules/@vitejs/test-wasm-dep')
  fs.mkdirSync(depDir, { recursive: true })
  fs.writeFileSync(
    path.join(depDir, 'package.json'),
    JSON.stringify({ exports: { '.': './index.js' } }),
  )
  const wasmFile = path.join(root, 'bare.wasm')
  fs.copyFileSync(
    path.resolve(
      import.meta.dirname,
      '../../../../../../playground/wasm/wasm-dep/nested/bare.wasm',
    ),
    wasmFile,
  )
  const resolve = createBackCompatIdResolver(environment.getTopLevelConfig(), {
    asSrc: false,
    scan: true,
  })
  await expect(
    resolve(environment, '@vitejs/test-wasm-dep/bare-glue', wasmFile),
  ).rejects.toThrow('"./bare-glue" is not exported')
  fs.writeFileSync(path.join(root, 'index.js'), "import './bare.wasm'")
  const deps = toDiscoveredDependencies(environment, {
    dep: normalizePath(path.join(root, 'index.js')),
  })
  const result = await runOptimizeDeps(environment, deps).result
  onTestFinished(() => result.cancel())
  await result.commit()
  expect(fs.readFileSync(result.metadata.optimized.dep.file, 'utf8')).toContain(
    JSON.stringify(normalizePath(wasmFile)),
  )
  expect(builds.count).toBe(1)
})
