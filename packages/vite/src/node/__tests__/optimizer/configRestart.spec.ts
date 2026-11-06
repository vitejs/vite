import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, test, vi } from 'vitest'
import type { InlineConfig, ViteDevServer } from '../..'
import { createServer } from '../..'

test('reuses the optimizer cache on restart and invalidates it when plugins change', async () => {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'vite-config-restart-'),
  )
  const depDir = path.join(root, 'node_modules', 'restart-dep')
  fs.mkdirSync(depDir, { recursive: true })
  fs.writeFileSync(
    path.join(depDir, 'package.json'),
    JSON.stringify({ name: 'restart-dep', type: 'module', main: 'index.js' }),
  )
  fs.writeFileSync(path.join(depDir, 'index.js'), 'export const value = 1')

  const buildStart = vi.fn()
  const optimizerPlugin = { name: 'test:restart-optimizer', buildStart }
  const optimizerPlugins = [optimizerPlugin]
  Object.freeze(optimizerPlugins)
  const esbuildPlugin = {
    name: 'test:restart-esbuild',
    setup(build: unknown) {
      void build
    },
  }
  const inlineConfig: InlineConfig = {
    root,
    cacheDir: path.join(root, '.vite'),
    configFile: false,
    envDir: false,
    logLevel: 'silent',
    server: { middlewareMode: true, ws: false, watch: null },
    optimizeDeps: {
      noDiscovery: true,
      include: ['restart-dep'],
      rolldownOptions: { plugins: optimizerPlugins },
      esbuildOptions: { plugins: [esbuildPlugin] },
    },
  }
  let server: ViteDevServer | undefined
  try {
    server = await createServer(inlineConfig)
    const firstEnvironment = server.environments.client
    const first = firstEnvironment.depsOptimizer!.metadata
    expect(first.optimized['restart-dep']).toBeDefined()
    expect(fs.existsSync(first.optimized['restart-dep'].file)).toBe(true)
    expect(buildStart).toHaveBeenCalled()
    buildStart.mockClear()

    await server.restart()
    const secondEnvironment = server.environments.client
    expect(secondEnvironment).not.toBe(firstEnvironment)
    const second = secondEnvironment.depsOptimizer!.metadata
    expect(server.config.inlineConfig).toBe(inlineConfig)
    expect(second.configHash).toBe(first.configHash)
    expect(second.hash).toBe(first.hash)
    expect(second.browserHash).toBe(first.browserHash)
    expect(second.optimized['restart-dep'].file).toBe(
      first.optimized['restart-dep'].file,
    )
    expect(buildStart).not.toHaveBeenCalled()
    expect(optimizerPlugins).toEqual([optimizerPlugin])
    expect(server.config.environments.client.optimizeDepsPluginNames).toEqual([
      optimizerPlugin.name,
      esbuildPlugin.name,
    ])

    inlineConfig.optimizeDeps = {
      ...inlineConfig.optimizeDeps,
      rolldownOptions: {
        plugins: [{ ...optimizerPlugin, name: 'test:changed-optimizer' }],
      },
    }
    await server.restart()
    expect(server.environments.client).not.toBe(secondEnvironment)
    const third = server.environments.client.depsOptimizer!.metadata
    expect(third.configHash).not.toBe(first.configHash)
    expect(buildStart).toHaveBeenCalled()
    expect(third.optimized['restart-dep']).toBeDefined()
    expect(optimizerPlugins).toEqual([optimizerPlugin])
  } finally {
    try {
      await server?.close()
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  }
})
