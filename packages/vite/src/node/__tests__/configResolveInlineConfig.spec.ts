import path from 'node:path'
import { afterEach, assert, expect, test, vi } from 'vitest'
import type { InlineConfig } from '..'
import { resolveConfig } from '../config'
import { normalizePath } from '../utils'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

test('resolves frozen early compatibility options while keeping the input unchanged', async () => {
  const build = Object.freeze({})
  const worker = Object.freeze({})
  const rolldownOptions = Object.freeze({})
  const optimizeDeps = Object.freeze({ rolldownOptions })
  const ssr = Object.freeze({})
  const inlineConfig = Object.freeze({
    configFile: false,
    envDir: false as const,
    logLevel: 'silent' as const,
    build,
    worker,
    optimizeDeps,
    ssr,
  })

  const resolved = await resolveConfig(inlineConfig, 'serve')

  expect(resolved.inlineConfig).toBe(inlineConfig)
  for (const original of [build, worker, optimizeDeps]) {
    expect(
      Object.getOwnPropertyDescriptor(original, 'rollupOptions'),
    ).toBeUndefined()
  }
  expect('optimizeDeps' in ssr).toBe(false)
  for (const options of [
    resolved.build,
    resolved.worker,
    resolved.optimizeDeps,
    resolved.ssr.optimizeDeps,
  ]) {
    expect(options.rolldownOptions).toBeDefined()
    expect(options.rollupOptions).toBe(options.rolldownOptions)
  }
})

test('copies build before compatibility setup and config hooks', async () => {
  const rolldownOptions = Object.freeze({})
  const build = Object.freeze({ rolldownOptions })
  const configHook = vi.fn()
  const inlineConfig: InlineConfig = {
    configFile: false,
    envDir: false,
    logLevel: 'silent',
    build,
    plugins: [
      {
        name: 'test:early-compatibility',
        config(config) {
          configHook()
          expect(config.build).not.toBe(build)
          expect(
            Object.getOwnPropertyDescriptor(config.build!, 'rollupOptions')
              ?.get,
          ).toBeTypeOf('function')
          expect(config.build!.rollupOptions).toBe(rolldownOptions)
          config.build!.rollupOptions = { external: ['virtual:hook'] }
          expect(config.build!.rolldownOptions).toEqual({
            external: ['virtual:hook'],
          })
        },
      },
    ],
  }

  const resolved = await resolveConfig(inlineConfig, 'serve')

  expect(configHook).toHaveBeenCalledOnce()
  expect(resolved.build.rolldownOptions.external).toEqual(['virtual:hook'])
  expect(build.rolldownOptions).toBe(rolldownOptions)
  expect(
    Object.getOwnPropertyDescriptor(build, 'rollupOptions'),
  ).toBeUndefined()
})

test('keeps server, preview, css, resolve, and environments identity through config hooks', async () => {
  const server = { port: 5173 }
  const preview = { port: 4173 }
  const css = { devSourcemap: true }
  const resolve = { conditions: ['source'] }
  const environments = { client: {} }
  const configHook = vi.fn()
  let getterCalls = 0
  Object.defineProperty(server, 'frameworkService', {
    enumerable: true,
    get() {
      getterCalls++
      return { value: 1 }
    },
  })
  const inlineConfig: InlineConfig = {
    configFile: false,
    envDir: false,
    logLevel: 'silent',
    server,
    preview,
    css,
    resolve,
    environments,
    plugins: [
      {
        name: 'test:config-hook-identity',
        config(config) {
          configHook()
          expect(config.server).toBe(server)
          expect(config.preview).toBe(preview)
          expect(config.css).toBe(css)
          expect(config.resolve).toBe(resolve)
          expect(config.environments).toBe(environments)
          expect(getterCalls).toBe(0)
          config.server!.port = 5180
        },
      },
    ],
  }

  const resolved = await resolveConfig(inlineConfig, 'serve')

  expect(configHook).toHaveBeenCalledOnce()
  expect(resolved.server.port).toBe(5180)
  // Config hooks can intentionally mutate the shared input.
  expect(server.port).toBe(5180)
})

test('keeps environment normalization writes out of frozen caller objects', async () => {
  const clientDev = Object.freeze({})
  const client = Object.freeze({ dev: clientDev })
  const ssrDev = Object.freeze({})
  const ssrBuild = Object.freeze({})
  const ssr = Object.freeze({ dev: ssrDev, build: ssrBuild })
  const environments = Object.freeze({ client, ssr })
  const inlineConfig: InlineConfig = {
    configFile: false,
    envDir: false,
    logLevel: 'silent',
    server: {
      warmup: { clientFiles: ['src/client.ts'], ssrFiles: ['src/ssr.ts'] },
    },
    build: { ssrEmitAssets: true },
    environments,
  }

  const resolved = await resolveConfig(inlineConfig, 'serve')

  expect('warmup' in clientDev).toBe(false)
  expect('warmup' in ssrDev).toBe(false)
  expect('emitAssets' in ssrBuild).toBe(false)
  expect(environments.client).toBe(client)
  expect(environments.ssr).toBe(ssr)
  expect(resolved.environments.client.dev.warmup).toEqual(['src/client.ts'])
  expect(resolved.environments.ssr.dev.warmup).toEqual(['src/ssr.ts'])
  expect(resolved.environments.ssr.build.emitAssets).toBe(true)
})

test('copies resolve before writing client environment values back', async () => {
  const resolve = Object.freeze({ conditions: ['source'] })
  const inlineConfig: InlineConfig = {
    configFile: false,
    envDir: false,
    logLevel: 'silent',
    resolve,
    environments: {
      client: { resolve: { conditions: ['client'], mainFields: ['module'] } },
    },
  }

  const resolved = await resolveConfig(inlineConfig, 'serve')

  expect(resolve).toEqual({ conditions: ['source'] })
  expect(resolved.resolve.conditions).toEqual(['source', 'client'])
  expect(resolved.resolve.mainFields).toEqual(['module'])
})

test('keeps server, preview, css, and fs resolver writes out of caller objects', async () => {
  vi.stubEnv('__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS', '')
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const hmr = Object.freeze({ port: 24678 })
  const allowedHosts = ['server.example.test']
  const previewAllowedHosts = ['preview.example.test']
  const fsAllow = ['./src']
  Object.freeze(allowedHosts)
  Object.freeze(previewAllowedHosts)
  Object.freeze(fsAllow)
  const lightningcss = Object.freeze({})
  const inlineConfig: InlineConfig = {
    configFile: false,
    envDir: false,
    logLevel: 'silent',
    server: {
      host: 'dev.example.test',
      hmr,
      allowedHosts,
      fs: { allow: fsAllow },
    },
    preview: {
      host: 'preview-host.example.test',
      allowedHosts: previewAllowedHosts,
    },
    css: { transformer: 'lightningcss', lightningcss },
  }

  const resolved = await resolveConfig(inlineConfig, 'serve')

  expect(Object.getOwnPropertyDescriptor(hmr, 'port')?.get).toBeUndefined()
  expect(allowedHosts).toEqual(['server.example.test'])
  expect(previewAllowedHosts).toEqual(['preview.example.test'])
  expect(fsAllow).toEqual(['./src'])
  expect('targets' in lightningcss).toBe(false)
  expect(resolved.server.allowedHosts).toEqual([
    'server.example.test',
    'dev.example.test',
    'preview-host.example.test',
  ])
  expect(resolved.preview.allowedHosts).toEqual([
    'preview.example.test',
    'dev.example.test',
    'preview-host.example.test',
  ])
  expect(resolved.server.fs.allow).toContain(
    normalizePath(path.resolve(resolved.root, 'src')),
  )
  expect(resolved.css.lightningcss?.targets).toEqual(
    expect.objectContaining({
      chrome: expect.any(Number),
      edge: expect.any(Number),
      firefox: expect.any(Number),
      safari: expect.any(Number),
    }),
  )
  const { hmr: resolvedHmr, ws } = resolved.server
  assert(typeof resolvedHmr === 'object')
  assert(typeof ws === 'object')
  expect(Object.getOwnPropertyDescriptor(resolvedHmr, 'port')?.get).toBeTypeOf(
    'function',
  )
  expect(Object.getOwnPropertyDescriptor(resolvedHmr, 'port')?.set).toBeTypeOf(
    'function',
  )
  expect(ws.port).toBe(24678)
  ws.port = 24679
  expect(resolvedHmr.port).toBe(24679)
  resolvedHmr.port = 24680
  expect(ws.port).toBe(24680)
  expect(hmr.port).toBe(24678)
})

test.each([
  { name: 'explicit', targets: Object.freeze({ chrome: 120 << 16 }) },
  { name: 'null', targets: null },
])('resolves Lightning CSS with $name targets', async ({ targets }) => {
  const lightningcss = Object.freeze({ targets })
  const resolved = await resolveConfig(
    {
      configFile: false,
      envDir: false,
      logLevel: 'silent',
      css: {
        transformer: 'lightningcss',
        // @ts-expect-error Preserve the existing null fallback for JavaScript config.
        lightningcss,
      },
    },
    'serve',
  )

  expect(lightningcss.targets).toBe(targets)
  if (targets == null) {
    expect(resolved.css.lightningcss?.targets).toEqual(
      expect.objectContaining({ chrome: expect.any(Number) }),
    )
  } else {
    expect(resolved.css.lightningcss).toBe(lightningcss)
    expect(resolved.css.lightningcss?.targets).toBe(targets)
  }
})

test.each(['top-level', 'custom'] as const)(
  'keeps dependency optimizer writes out of frozen %s options',
  async (name) => {
    const resolve = Object.freeze({})
    const output = Object.freeze({})
    const transform = Object.freeze({})
    const moduleTypes = Object.freeze({ '.existing': 'js' as const })
    const define = Object.freeze({ __FROM_ESBUILD__: 'true' })
    const loader = Object.freeze({
      '.txt': 'text' as const,
      '.existing': 'json' as const,
      '.css': 'css' as const,
    })
    const rolldownOptions = Object.freeze({
      resolve,
      output,
      transform,
      moduleTypes,
    })
    const esbuildOptions = Object.freeze({ minify: true, define, loader })
    const optimizeDeps = Object.freeze({ rolldownOptions, esbuildOptions })
    const inlineConfig: InlineConfig = {
      configFile: false,
      envDir: false,
      logLevel: 'silent',
      resolve: { preserveSymlinks: true },
      ...(name === 'top-level'
        ? { optimizeDeps }
        : { environments: { [name]: { optimizeDeps } } }),
    }

    const resolved = await resolveConfig(inlineConfig, 'serve')
    const optimizer =
      name === 'top-level'
        ? resolved.optimizeDeps
        : resolved.environments[name].optimizeDeps

    expect(resolve).toEqual({})
    expect(output).toEqual({})
    expect(transform).toEqual({})
    expect(moduleTypes).toEqual({ '.existing': 'js' })
    expect('preserveSymlinks' in esbuildOptions).toBe(false)
    expect(optimizer.rolldownOptions?.resolve?.symlinks).toBe(false)
    expect(optimizer.rolldownOptions?.output).toMatchObject({
      minify: true,
      topLevelVar: true,
    })
    expect(optimizer.rolldownOptions?.transform?.define).toEqual(define)
    expect(optimizer.rolldownOptions?.moduleTypes).toEqual({
      '.existing': 'js',
      '.txt': 'text',
    })
    expect(optimizer.esbuildOptions?.preserveSymlinks).toBe(true)
  },
)

test('preserves explicit Rolldown values when converting esbuild options', async () => {
  const define = Object.freeze({ __NATIVE__: 'true' })
  const transform = Object.freeze({ define })
  const moduleTypes = Object.freeze({ '.txt': 'json' as const })
  const output = Object.freeze({ minify: false, topLevelVar: false })
  const resolve = Object.freeze({ symlinks: true })
  const resolved = await resolveConfig(
    {
      configFile: false,
      envDir: false,
      logLevel: 'silent',
      optimizeDeps: {
        rolldownOptions: Object.freeze({
          transform,
          moduleTypes,
          output,
          resolve,
        }),
        esbuildOptions: Object.freeze({
          define: { __ESBUILD__: 'true' },
          loader: { '.txt': 'text' as const },
          minify: true,
          preserveSymlinks: true,
        }),
      },
    },
    'serve',
  )

  expect(resolved.optimizeDeps.rolldownOptions?.transform?.define).toEqual(
    define,
  )
  expect(resolved.optimizeDeps.rolldownOptions?.moduleTypes).toEqual(
    moduleTypes,
  )
  expect(resolved.optimizeDeps.rolldownOptions?.output).toMatchObject(output)
  expect(resolved.optimizeDeps.rolldownOptions?.resolve).toMatchObject(resolve)
})

test('preserves explicit Rollup and Rolldown aliases without duplicating plugins', async () => {
  const plugins = [{ name: 'native-optimizer-plugin' }]
  Object.freeze(plugins)
  const rolldownOptions = Object.freeze({ plugins })
  const optimizeDeps = Object.freeze({
    rolldownOptions,
    rollupOptions: rolldownOptions,
  })
  const inlineConfig: InlineConfig = {
    configFile: false,
    envDir: false,
    logLevel: 'silent',
    optimizeDeps,
  }

  const resolved = await resolveConfig(inlineConfig, 'serve')
  expect(resolved.optimizeDeps.rollupOptions).toBe(
    resolved.optimizeDeps.rolldownOptions,
  )
  expect(resolved.environments.client.optimizeDepsPluginNames).toEqual([
    'native-optimizer-plugin',
  ])
  expect(optimizeDeps.rolldownOptions).toBe(rolldownOptions)
  expect(optimizeDeps.rollupOptions).toBe(rolldownOptions)
  expect(plugins).toHaveLength(1)
})

test('converts esbuild plugins when Rolldown plugins are disabled', async () => {
  const rolldownOptions = Object.freeze({ plugins: false as const })
  const inlineConfig: InlineConfig = {
    configFile: false,
    envDir: false,
    logLevel: 'silent',
    optimizeDeps: {
      rolldownOptions,
      esbuildOptions: {
        plugins: [
          {
            name: 'test:esbuild-with-disabled-rolldown-plugins',
            setup(build) {
              void build
            },
          },
        ],
      },
    },
  }

  for (let i = 0; i < 2; i++) {
    const resolved = await resolveConfig(inlineConfig, 'serve')
    expect(resolved.environments.client.optimizeDepsPluginNames).toEqual([
      'test:esbuild-with-disabled-rolldown-plugins',
    ])
    expect(rolldownOptions.plugins).toBe(false)
  }
})

test.each(['config', 'configEnvironment'] as const)(
  'copies optimizer options supplied by the %s hook before normalization',
  async (phase) => {
    const transform = Object.freeze({})
    const moduleTypes = Object.freeze({})
    const rolldownOptions = Object.freeze({ transform, moduleTypes })
    const optimizeDeps = Object.freeze({
      rolldownOptions,
      rollupOptions: rolldownOptions,
      esbuildOptions: Object.freeze({
        define: { __HOOK__: 'true' },
        loader: { '.txt': 'text' as const },
      }),
    })
    const hook = vi.fn()
    const resolved = await resolveConfig(
      {
        configFile: false,
        envDir: false,
        logLevel: 'silent',
        plugins: [
          {
            name: 'test:hook-options',
            config() {
              if (phase === 'config') {
                hook()
                return { optimizeDeps }
              }
            },
            configEnvironment(name, config) {
              if (phase === 'configEnvironment' && name === 'client') {
                hook()
                config.optimizeDeps = optimizeDeps
              }
            },
          },
        ],
      },
      'serve',
    )

    expect(hook).toHaveBeenCalledOnce()
    expect(transform).toEqual({})
    expect(moduleTypes).toEqual({})
    expect(optimizeDeps.rollupOptions).toBe(rolldownOptions)
    expect(optimizeDeps.rolldownOptions).toBe(rolldownOptions)
    expect(resolved.optimizeDeps.rollupOptions).toBe(
      resolved.optimizeDeps.rolldownOptions,
    )
    expect(resolved.optimizeDeps.rolldownOptions?.transform?.define).toEqual({
      __HOOK__: 'true',
    })
    expect(resolved.optimizeDeps.rolldownOptions?.moduleTypes).toEqual({
      '.txt': 'text',
    })
  },
)

test.each(['mutable', 'frozen'] as const)(
  'copies %s optimizer options supplied by configResolved before plugin conversion',
  async (state) => {
    const plugins = [{ name: 'test:native-optimizer' }]
    const rolldownOptions = { plugins }
    if (state === 'frozen') Object.freeze(rolldownOptions)
    const inlineConfig: InlineConfig = {
      configFile: false,
      envDir: false,
      logLevel: 'silent',
      optimizeDeps: {
        esbuildOptions: {
          plugins: [
            {
              name: 'test:converted-optimizer',
              setup(build) {
                void build
              },
            },
          ],
        },
      },
      plugins: [
        {
          name: 'test:late-optimizer-options',
          configResolved(config) {
            config.optimizeDeps.rolldownOptions = rolldownOptions
          },
        },
      ],
    }

    for (let i = 0; i < 2; i++) {
      const resolved = await resolveConfig(inlineConfig, 'serve')
      expect(rolldownOptions.plugins).toBe(plugins)
      expect(rolldownOptions).toEqual({
        plugins: [{ name: 'test:native-optimizer' }],
      })
      expect(resolved.environments.client.optimizeDepsPluginNames).toEqual([
        'test:native-optimizer',
        'test:converted-optimizer',
      ])
    }
  },
)

test('resolves shared optimizer options independently for each environment', async () => {
  const resolve = Object.freeze({})
  const output = Object.freeze({})
  const rolldownOptions = Object.freeze({ resolve, output })
  const optimizeDeps = Object.freeze({ rolldownOptions })
  const resolved = await resolveConfig(
    {
      configFile: false,
      envDir: false,
      logLevel: 'silent',
      optimizeDeps,
      environments: {
        ssr: {
          optimizeDeps: {
            ...optimizeDeps,
            esbuildOptions: { preserveSymlinks: true },
          },
        },
        custom: { optimizeDeps },
      },
    },
    'serve',
  )

  expect(resolve).toEqual({})
  expect(output).toEqual({})
  expect(resolved.optimizeDeps).toBe(resolved.environments.client.optimizeDeps)
  expect(resolved.optimizeDeps.rolldownOptions?.resolve?.symlinks).toBe(true)
  expect(
    resolved.environments.ssr.optimizeDeps.rolldownOptions?.resolve?.symlinks,
  ).toBe(false)
  expect(
    resolved.environments.custom.optimizeDeps.rolldownOptions?.resolve
      ?.symlinks,
  ).toBe(true)
  expect(resolved.environments.ssr.optimizeDeps.rolldownOptions).not.toBe(
    resolved.environments.custom.optimizeDeps.rolldownOptions,
  )
})
