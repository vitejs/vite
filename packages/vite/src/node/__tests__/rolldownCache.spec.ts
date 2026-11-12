import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import type { InlineConfig } from '..'
import { normalizePath } from '..'
import {
  ChunkMetadataMap,
  createBuilder,
  resolveRolldownOptions,
} from '../build'
import { getConfigCacheKey, hashForCacheKey } from '../rolldownCache'

describe('hashForCacheKey', () => {
  test('ignores the order of object keys', () => {
    expect(hashForCacheKey({ a: 1, b: { c: 2, d: 3 } })).toBe(
      hashForCacheKey({ b: { d: 3, c: 2 }, a: 1 }),
    )
  })

  test('hashes plain values', () => {
    const base = hashForCacheKey({ a: 1, b: 'x', c: [true, null] })
    expect(hashForCacheKey({ a: 2, b: 'x', c: [true, null] })).not.toBe(base)
    expect(hashForCacheKey({ a: 1, b: 'y', c: [true, null] })).not.toBe(base)
    expect(hashForCacheKey({ a: 1, b: 'x', c: [null, true] })).not.toBe(base)
    expect(hashForCacheKey({ a: '1', b: 'x', c: [true, null] })).not.toBe(base)
  })

  test('treats an undefined value like a missing key', () => {
    expect(hashForCacheKey({ a: 1, b: undefined })).toBe(
      hashForCacheKey({ a: 1 }),
    )
  })

  test('hashes a RegExp by its source and flags', () => {
    expect(hashForCacheKey({ a: /foo/g })).toBe(hashForCacheKey({ a: /foo/g }))
    expect(hashForCacheKey({ a: /foo/g })).not.toBe(
      hashForCacheKey({ a: /foo/i }),
    )
    expect(hashForCacheKey({ a: /foo/ })).not.toBe(
      hashForCacheKey({ a: /bar/ }),
    )
    expect(hashForCacheKey({ a: /foo/ })).not.toBe(
      hashForCacheKey({ a: 'foo' }),
    )
  })

  test('skips the code of functions', () => {
    expect(hashForCacheKey({ a: () => 1 })).toBe(
      hashForCacheKey({
        a: function other() {
          return 2
        },
      }),
    )
    expect(hashForCacheKey({ a: () => 1 })).not.toBe(
      hashForCacheKey({ a: 'x' }),
    )
  })

  test('skips callbacks into the host, also whether they are set', () => {
    expect(hashForCacheKey({ a: 1, onLog: () => {}, onwarn: () => {} })).toBe(
      hashForCacheKey({ a: 1 }),
    )
  })

  test('hashes only the names of plugins, in order', () => {
    const a = { name: 'a', transform: () => {}, options: { x: 1 } }
    const b = { name: 'b' }
    expect(hashForCacheKey({ plugins: [a, [b]] })).toBe(
      hashForCacheKey({ plugins: [{ name: 'a', options: { x: 2 } }, b] }),
    )
    expect(hashForCacheKey({ plugins: [a, b] })).not.toBe(
      hashForCacheKey({ plugins: [b, a] }),
    )
  })

  test('ignores the order of Map and Set entries', () => {
    expect(
      hashForCacheKey(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
      ),
    ).toBe(
      hashForCacheKey(
        new Map([
          ['b', 2],
          ['a', 1],
        ]),
      ),
    )
    expect(hashForCacheKey(new Set([1, 2]))).toBe(
      hashForCacheKey(new Set([2, 1])),
    )
  })

  test('adds only the class name of a class instance', () => {
    class State {
      constructor(public count: number) {}
    }
    expect(hashForCacheKey({ a: new State(1) })).toBe(
      hashForCacheKey({ a: new State(2) }),
    )
  })

  test('handles cycles', () => {
    const make = (value: number) => {
      const obj: Record<string, unknown> = { value }
      obj.self = obj
      return obj
    }
    expect(hashForCacheKey(make(1))).toBe(hashForCacheKey(make(1)))
    expect(hashForCacheKey(make(1))).not.toBe(hashForCacheKey(make(2)))
  })
})

describe('getConfigCacheKey', () => {
  const root = path.resolve(import.meta.dirname, 'packages/build-project')
  const getKey = async (config: InlineConfig = {}, cacheKey?: string) => {
    const builder = await createBuilder({
      root,
      logLevel: 'silent',
      configFile: false,
      ...config,
    })
    return getConfigCacheKey(builder.environments.client, cacheKey)
  }

  test('is the same for two resolutions of the same config', async () => {
    const key = await getKey()
    expect(await getKey()).toBe(key)

    // Fresh module state, like a new process.
    vi.resetModules()
    const build = await import('../build')
    const rolldownCache = await import('../rolldownCache')
    const builder = await build.createBuilder({
      root,
      logLevel: 'silent',
      configFile: false,
    })
    expect(
      rolldownCache.getConfigCacheKey(builder.environments.client, undefined),
    ).toBe(key)
  })

  test('changes with the config, the mode, NODE_ENV and the cacheKey', async () => {
    const key = await getKey()
    expect(await getKey({ define: { __A__: '1' } })).not.toBe(key)
    expect(await getKey({ mode: 'staging' })).not.toBe(key)
    expect(await getKey({}, 'theme-dark')).not.toBe(key)

    vi.stubEnv('NODE_ENV', 'test-cache-key')
    onTestFinished(() => {
      vi.unstubAllEnvs()
    })
    expect(await getKey()).not.toBe(key)
  })

  test('does not change with experimental.cache', async () => {
    const key = await getKey({ experimental: { cache: true } })
    expect(
      await getKey({
        experimental: {
          cache: {
            maxAge: 1000,
            dir: 'other',
            cacheKey: 'x',
            buildDependencies: ['a.json'],
          },
        },
      }),
    ).toBe(key)
  })

  test('differs between environments', async () => {
    const builder = await createBuilder({
      root,
      logLevel: 'silent',
      configFile: false,
      environments: { ssr: {} },
    })
    expect(getConfigCacheKey(builder.environments.client, undefined)).not.toBe(
      getConfigCacheKey(builder.environments.ssr, undefined),
    )
  })
})

describe('experimental.cache in resolveRolldownOptions', () => {
  const createProject = (files: Record<string, string>) => {
    const root = fs.mkdtempSync(path.join(tmpdir(), 'vite-rolldown-cache-'))
    onTestFinished(() => {
      fs.rmSync(root, { recursive: true, force: true })
    })
    for (const [file, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
      fs.writeFileSync(path.join(root, file), content)
    }
    return normalizePath(fs.realpathSync(root))
  }

  const getCacheOption = async (
    config: InlineConfig,
    environment: 'client' | 'ssr' = 'client',
  ) => {
    const builder = await createBuilder({ logLevel: 'silent', ...config })
    const options = resolveRolldownOptions(
      builder.environments[environment],
      new ChunkMetadataMap(),
    )
    return (options.experimental as { cache?: any }).cache
  }

  test('is not set by default', async () => {
    const root = createProject({})
    expect(await getCacheOption({ root, configFile: false })).toBeUndefined()
  })

  test("passes the user's rolldownOptions value through when off", async () => {
    const root = createProject({})
    const userCache = { dir: 'user-dir', cacheKey: 'user' }
    expect(
      await getCacheOption({
        root,
        configFile: false,
        build: {
          rolldownOptions: { experimental: { cache: userCache } as any },
        },
      }),
    ).toStrictEqual(userCache)
  })

  test('fills in the defaults', async () => {
    const root = createProject({
      'node_modules/.pnpm/lock.yaml': 'lockfileVersion: 9',
      'vite.config.mjs': `import './helper.mjs'\nexport default { experimental: { cache: true } }`,
      'helper.mjs': 'export {}',
    })
    const cache = await getCacheOption({
      root,
      build: {
        rolldownOptions: { experimental: { cache: { dir: 'user' } } as any },
      },
    })
    expect(cache).toStrictEqual({
      dir: `${root}/node_modules/.vite/rolldown-cache`,
      cacheKey: expect.stringMatching(/^[0-9a-f]{64}$/),
      buildDependencies: expect.arrayContaining([
        `${root}/vite.config.mjs`,
        `${root}/helper.mjs`,
        `${root}/node_modules/.pnpm/lock.yaml`,
      ]),
      assumeUnchanged: ['**/node_modules/**'],
    })
    expect(new Set(cache.buildDependencies).size).toBe(
      cache.buildDependencies.length,
    )
  })

  test('uses the user values', async () => {
    const root = createProject({
      'node_modules/.pnpm/lock.yaml': 'lockfileVersion: 9',
      'theme.json': '{}',
    })
    const cache = await getCacheOption({
      root,
      configFile: false,
      experimental: {
        cache: {
          dir: 'my-cache',
          maxAge: 1000,
          buildDependencies: ['theme.json'],
        },
      },
    })
    expect(cache.dir).toBe(`${root}/my-cache`)
    expect(cache.maxAge).toBe(1000)
    expect(cache.buildDependencies).toStrictEqual([
      `${root}/node_modules/.pnpm/lock.yaml`,
      `${root}/theme.json`,
    ])
  })

  test('adds the files in the patches directory', async () => {
    const root = createProject({
      'node_modules/.package-lock.json': '{}',
      'patches/react+19.0.0.patch': 'diff',
      'patches/nested/dom+19.0.0.patch': 'diff',
    })
    const cache = await getCacheOption({
      root,
      configFile: false,
      experimental: { cache: true },
    })
    expect(cache.buildDependencies).toStrictEqual([
      `${root}/node_modules/.package-lock.json`,
      `${root}/patches/nested/dom+19.0.0.patch`,
      `${root}/patches/react+19.0.0.patch`,
    ])
    expect(cache.assumeUnchanged).toStrictEqual(['**/node_modules/**'])
  })

  test('is off when the imports of the config file are unknown', async () => {
    const root = createProject({})
    const builder = await createBuilder({
      root,
      configFile: false,
      logLevel: 'silent',
      experimental: { cache: true },
    })
    const environment = builder.environments.client
    // What `configLoader: 'native'` gives on a runtime without module hooks.
    ;(
      environment.getTopLevelConfig() as {
        configFileDependenciesUnknown: boolean
      }
    ).configFileDependenciesUnknown = true
    const options = resolveRolldownOptions(environment, new ChunkMetadataMap())
    expect((options.experimental as { cache?: unknown }).cache).toBeUndefined()
  })

  test('sets no assumeUnchanged with only a lockfile', async () => {
    const root = createProject({ 'yarn.lock': '# yarn lockfile v1' })
    const cache = await getCacheOption({
      root,
      configFile: false,
      experimental: { cache: true },
    })
    expect(cache.buildDependencies).toStrictEqual([`${root}/yarn.lock`])
    expect(cache.assumeUnchanged).toBeUndefined()
  })

  test('sets no assumeUnchanged without an installed-packages file', async () => {
    const root = createProject({})
    const cache = await getCacheOption({
      root,
      configFile: false,
      experimental: { cache: true },
    })
    expect(cache.buildDependencies).toStrictEqual([])
    expect(cache.assumeUnchanged).toBeUndefined()
  })

  test('sets no assumeUnchanged with resolve.preserveSymlinks', async () => {
    const root = createProject({
      'node_modules/.pnpm/lock.yaml': 'lockfileVersion: 9',
    })
    const cache = await getCacheOption({
      root,
      configFile: false,
      resolve: { preserveSymlinks: true },
      experimental: { cache: true },
    })
    expect(cache.buildDependencies).toStrictEqual([
      `${root}/node_modules/.pnpm/lock.yaml`,
    ])
    expect(cache.assumeUnchanged).toBeUndefined()
  })
})
