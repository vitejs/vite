import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { RolldownOutput } from 'rolldown'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import type { Environment, InlineConfig } from '..'
import { createLogger, normalizePath } from '..'
import {
  ChunkMetadataMap,
  createBuilder,
  resolveRolldownOptions,
} from '../build'
import { getConfigCacheKey, hashForCacheKey } from '../rolldownCache'

const createProject = (files: Record<string, string | Buffer>) => {
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

  test('is off with only a lockfile in the project root', async () => {
    const root = createProject({ 'yarn.lock': '# yarn lockfile v1' })
    const warnings: string[] = []
    expect(
      await getCacheOption({
        root,
        configFile: false,
        experimental: { cache: true },
        customLogger: {
          ...createLogger('silent'),
          warnOnce: (msg) => warnings.push(msg),
        },
      }),
    ).toBeUndefined()
    expect(warnings).toStrictEqual([
      expect.stringContaining('`experimental.cache` is off'),
    ])
  })

  test('is off without an installed-packages file', async () => {
    const root = createProject({})
    expect(
      await getCacheOption({
        root,
        configFile: false,
        experimental: { cache: true },
      }),
    ).toBeUndefined()
  })

  test('is off when the installed-packages file is above the workspace root', async () => {
    // For example, a stray `npm i` in the home directory.
    const dir = createProject({
      'node_modules/.package-lock.json': '{}',
      'app/package.json': '{}',
    })
    expect(
      await getCacheOption({
        root: `${dir}/app`,
        configFile: false,
        experimental: { cache: true },
      }),
    ).toBeUndefined()
  })

  test('uses an installed-packages file at the workspace root', async () => {
    const dir = createProject({
      'pnpm-workspace.yaml': 'packages: [packages/*]',
      'package.json': '{}',
      'node_modules/.pnpm/lock.yaml': 'lockfileVersion: 9',
      'packages/web/package.json': '{}',
    })
    const cache = await getCacheOption({
      root: `${dir}/packages/web`,
      configFile: false,
      experimental: { cache: true },
    })
    expect(cache.buildDependencies).toStrictEqual([
      `${dir}/node_modules/.pnpm/lock.yaml`,
    ])
    expect(cache.assumeUnchanged).toStrictEqual(['**/node_modules/**'])
  })

  test('adds the PostCSS config file', async () => {
    const root = createProject({
      'node_modules/.pnpm/lock.yaml': 'lockfileVersion: 9',
      'postcss.config.mjs': 'export default {}',
    })
    const config: InlineConfig = {
      root,
      configFile: false,
      experimental: { cache: true },
    }
    const cache = await getCacheOption(config)
    expect(cache.buildDependencies).toStrictEqual([
      `${root}/node_modules/.pnpm/lock.yaml`,
      `${root}/postcss.config.mjs`,
    ])

    // The key covers a config file that is removed.
    fs.rmSync(`${root}/postcss.config.mjs`)
    const cacheWithoutFile = await getCacheOption(config)
    expect(cacheWithoutFile.buildDependencies).toStrictEqual([
      `${root}/node_modules/.pnpm/lock.yaml`,
    ])
    expect(cacheWithoutFile.cacheKey).not.toBe(cache.cacheKey)
    expect((await getCacheOption(config)).cacheKey).toBe(
      cacheWithoutFile.cacheKey,
    )
  })

  describe('with `DEBUG=vite:sourcemap`', () => {
    // The flag is read when the module is loaded.
    const importWithFlag = async () => {
      vi.resetModules()
      vi.doMock('../server/sourcemap', async (importOriginal) => ({
        ...(await importOriginal<object>()),
        isSourcemapDebugEnabled: true,
      }))
      onTestFinished(() => {
        vi.doUnmock('../server/sourcemap')
        vi.resetModules()
      })
      const [
        { resolveConfig },
        { PartialEnvironment },
        { resolveRolldownCacheOptions },
        { cssPlugin, cssPostPlugin },
      ] = await Promise.all([
        import('../config'),
        import('../baseEnvironment'),
        import('../rolldownCache'),
        import('../plugins/css'),
      ])
      const createEnvironment = async (
        root: string,
        command: 'build' | 'serve',
        devSourcemap: boolean,
      ) => {
        const config = await resolveConfig(
          {
            root,
            configFile: false,
            logLevel: 'silent',
            css: { devSourcemap },
            experimental: { cache: true },
          },
          command,
        )
        return new PartialEnvironment('client', config) as Environment
      }
      return {
        createEnvironment,
        resolveRolldownCacheOptions,
        cssPlugin,
        cssPostPlugin,
      }
    }

    test('is off in dev with CSS source maps', async () => {
      const root = createProject({
        'node_modules/.pnpm/lock.yaml': 'lockfileVersion: 9',
      })
      const { createEnvironment, resolveRolldownCacheOptions } =
        await importWithFlag()
      const getOptions = async (
        command: 'build' | 'serve',
        devSourcemap: boolean,
      ) =>
        resolveRolldownCacheOptions(
          await createEnvironment(root, command, devSourcemap),
        )
      expect(await getOptions('serve', true)).toBeUndefined()
      expect(await getOptions('serve', false)).toBeDefined()
      // A build does not add the source map to the CSS code.
      expect(await getOptions('build', true)).toBeDefined()
    })

    // For a cache that the user turns on in `build.rolldownOptions`.
    test('`vite:css-post` marks the module', async () => {
      const root = createProject({})
      const { createEnvironment, cssPlugin, cssPostPlugin } =
        await importWithFlag()
      const getReasons = async (devSourcemap: boolean) => {
        const environment = await createEnvironment(root, 'serve', devSourcemap)
        const config = environment.getTopLevelConfig()
        // `vite:css` makes the map of CSS modules that `vite:css-post` reads.
        const { buildStart, buildEnd } = cssPlugin(config)
        // @ts-expect-error buildStart is function
        await buildStart.call({})
        onTestFinished(async () => {
          // @ts-expect-error buildEnd is function
          await buildEnd.call({})
        })
        const reasons: string[] = []
        const { transform } = cssPostPlugin(config)
        // @ts-expect-error transform.handler is function
        await transform.handler.call(
          {
            environment,
            markNotCacheable: (reason: string) => reasons.push(reason),
            getCombinedSourcemap: () => ({
              version: 3,
              mappings: '',
              names: [],
              sources: [],
            }),
          },
          '.a { color: red }',
          `${root}/a.css`,
        )
        return reasons
      }
      expect(await getReasons(true)).toStrictEqual([
        '`DEBUG=vite:sourcemap` changes the code',
      ])
      expect(await getReasons(false)).toStrictEqual([])
    })
  })

  test('is off with `DEBUG=vite:resolve-details`', async () => {
    const root = createProject({
      'node_modules/.pnpm/lock.yaml': 'lockfileVersion: 9',
    })
    // The flag is read when the module is loaded.
    vi.resetModules()
    vi.doMock('../plugins/resolve', async (importOriginal) => ({
      ...(await importOriginal<object>()),
      isResolveDetailsDebugEnabled: true,
    }))
    onTestFinished(() => {
      vi.doUnmock('../plugins/resolve')
      vi.resetModules()
    })
    // One at a time: with parallel imports, the mock loads the modules in
    // another order, and a class in an import cycle is still undefined.
    const { resolveConfig } = await import('../config')
    const { PartialEnvironment } = await import('../baseEnvironment')
    const { resolveRolldownCacheOptions } = await import('../rolldownCache')
    const warnings: string[] = []
    const logger = createLogger('silent')
    logger.warnOnce = (msg) => warnings.push(msg)
    const getOptions = async (command: 'build' | 'serve') => {
      const config = await resolveConfig(
        {
          root,
          configFile: false,
          customLogger: logger,
          experimental: { cache: true },
        },
        command,
      )
      return resolveRolldownCacheOptions(
        new PartialEnvironment('client', config) as Environment,
      )
    }
    expect(await getOptions('build')).toBeUndefined()
    expect(await getOptions('serve')).toBeUndefined()
    expect(warnings).toHaveLength(2)
    expect(warnings[0]).toContain(
      '`experimental.cache` is off: `DEBUG=vite:resolve-details`',
    )
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

describe('experimental.cache for CSS modules', () => {
  /**
   * `transformed` lists the CSS modules whose hooks ran. A module that reuses
   * its saved result is not in the list.
   */
  const buildProject = async (
    root: string,
    cache = true,
    config: InlineConfig = {},
  ) => {
    // A test above resets the modules. Vitest then runs the linked Rolldown
    // again, so there are two copies of it. Import `build` here, so that the
    // built-in plugins of Vite and `rolldown()` come from the same copy.
    // Another copy does not see them as built-in plugins (`instanceof`), runs
    // them as JavaScript plugins without `cache: true`, and saves no results.
    const { build } = await import('../build')
    const transformed: string[] = []
    const logs: string[] = []
    const outputs = [
      await build({
        root,
        configFile: false,
        logLevel: 'silent',
        customLogger: {
          ...createLogger('silent'),
          warn: (msg) => logs.push(msg),
          warnOnce: (msg) => logs.push(msg),
          error: (msg) => logs.push(msg),
        },
        experimental: { cache },
        build: {
          write: false,
          rolldownOptions: { input: `${root}/main.js` },
        },
        plugins: [
          {
            name: 'test:record',
            transform: {
              cache: true,
              filter: { id: /\.s?css$/ },
              handler(_, id) {
                transformed.push(path.basename(id))
              },
            },
          },
        ],
        ...config,
      }),
    ].flat() as RolldownOutput[]
    const files: Record<string, string> = {}
    for (const file of outputs.flatMap((output) => output.output)) {
      files[file.fileName] =
        file.type === 'chunk' ? file.code : file.source.toString()
    }
    const css = Object.entries(files)
      .filter(([fileName]) => fileName.endsWith('.css'))
      .map(([, source]) => source)
      .join('\n')
    return { transformed: transformed.sort(), logs, files, css }
  }

  const baseFiles = {
    'node_modules/.pnpm/lock.yaml': 'lockfileVersion: 9',
    'main.js': `import './a.css'`,
  }

  test('a plain CSS file reuses its saved result', async () => {
    const root = createProject({
      ...baseFiles,
      'a.css': '.a { margin: 1px }',
    })
    const withoutCache = await buildProject(root, false)
    expect(withoutCache.css).toContain('1px')

    const first = await buildProject(root)
    expect(first.transformed).toStrictEqual(['a.css'])
    expect(first.files).toStrictEqual(withoutCache.files)

    const second = await buildProject(root)
    expect(second.transformed).toStrictEqual([])
    expect(second.files).toStrictEqual(withoutCache.files)

    fs.writeFileSync(`${root}/a.css`, '.a { margin: 2px }')
    const third = await buildProject(root)
    expect(third.transformed).toStrictEqual(['a.css'])
    expect(third.css).toContain('2px')
  })

  test('a CSS file that uses an output asset file runs its hooks again', async () => {
    const root = createProject({
      ...baseFiles,
      'main.js': `import './a.css'\nimport './b.css'\nimport './c.css'`,
      'a.css': '.a { background: url(./big.png) }',
      'b.css': '.b { margin: 1px }',
      // Small enough to be inlined as a data URL.
      'c.css': '.c { background: url(./small.png) }',
      'big.png': Buffer.alloc(5000, 1),
      'small.png': Buffer.alloc(10, 1),
    })
    const withoutCache = await buildProject(root, false)
    const assetFile = Object.keys(withoutCache.files).find((fileName) =>
      fileName.endsWith('.png'),
    )!
    expect(withoutCache.css).toContain(`url(/${assetFile})`)
    expect(withoutCache.css).toContain('url(data:image/png;base64,')

    const first = await buildProject(root)
    expect(first.transformed).toStrictEqual(['a.css', 'b.css', 'c.css'])
    expect(first.files).toStrictEqual(withoutCache.files)

    const second = await buildProject(root)
    expect(second.transformed).toStrictEqual(['a.css'])
    expect(second.files).toStrictEqual(withoutCache.files)

    // The data URL holds the content of the file.
    fs.writeFileSync(`${root}/small.png`, Buffer.alloc(10, 2))
    const third = await buildProject(root)
    expect(third.transformed).toStrictEqual(['a.css', 'c.css'])
    expect(third.files).toStrictEqual((await buildProject(root, false)).files)
  })

  test('a `url()` to a file in the public directory works on reuse', async () => {
    const root = createProject({
      ...baseFiles,
      'a.css': '.a { background: url(/logo.png) }',
      'public/logo.png': Buffer.alloc(10, 1),
    })
    const withoutCache = await buildProject(root, false)
    expect(withoutCache.css).toContain('url(/logo.png)')

    await buildProject(root)
    const second = await buildProject(root)
    expect(second.transformed).toStrictEqual([])
    expect(second.files).toStrictEqual(withoutCache.files)

    // Without the file, the URL does not point to the public directory.
    fs.rmSync(`${root}/public/logo.png`)
    const third = await buildProject(root)
    expect(third.transformed).toStrictEqual(['a.css'])
    expect(third.logs).toStrictEqual((await buildProject(root, false)).logs)
    expect(third.logs).toHaveLength(1)
  })

  test('a CSS file that sends a message to the logger runs its hooks again', async () => {
    const root = createProject({
      ...baseFiles,
      'main.js': `import './a.css'\nimport './b.css'`,
      'a.css': '.a { background: url(./missing.png) }',
      'b.css': '.b { margin: 1px }',
    })
    const withoutCache = await buildProject(root, false)
    expect(withoutCache.logs).toStrictEqual([
      expect.stringContaining("didn't resolve at build time"),
    ])

    await buildProject(root)
    const second = await buildProject(root)
    expect(second.transformed).toStrictEqual(['a.css'])
    expect(second.logs).toStrictEqual(withoutCache.logs)
    expect(second.files).toStrictEqual(withoutCache.files)
  })

  test('a CSS file whose resolver sends a warning runs its hooks again', async () => {
    const root = createProject({
      ...baseFiles,
      'main.js': `import './a.scss'\nimport './b.css'`,
      // `constants` is also the name of a Node.js module, so the resolver
      // sends a warning. Sass then finds the file through `loadPaths`.
      'a.scss': '@use "constants";\n.a { margin: constants.$m }',
      'styles/_constants.scss': '$m: 1px;',
      'b.css': '.b { margin: 2px }',
    })
    const config: InlineConfig = {
      css: {
        preprocessorOptions: { scss: { loadPaths: [`${root}/styles`] } },
      },
    }
    // The resolver sends this warning only in production.
    vi.stubEnv('NODE_ENV', 'production')
    onTestFinished(() => {
      vi.unstubAllEnvs()
    })
    const withoutCache = await buildProject(root, false, config)
    expect(withoutCache.logs).toStrictEqual([
      expect.stringContaining(
        'Module "constants" has been externalized for browser compatibility',
      ),
    ])
    expect(withoutCache.css).toContain('1px')

    await buildProject(root, true, config)
    const second = await buildProject(root, true, config)
    expect(second.transformed).toStrictEqual(['a.scss'])
    expect(second.logs).toStrictEqual(withoutCache.logs)
    expect(second.files).toStrictEqual(withoutCache.files)
  })

  test('a CSS file that uses a file with a Git LFS warning runs its hooks again', async () => {
    const root = createProject({
      ...baseFiles,
      'main.js': `import './a.css'\nimport './b.css'`,
      // The second `url()` takes the result of the first one from a map.
      'a.css': '.a { background: url(./lfs.png), url(./lfs.png) }',
      'b.css': '.b { margin: 1px }',
      'lfs.png': 'version https://git-lfs.github.com/spec/v1\nsize 1\n',
    })
    const config: InlineConfig = {
      build: {
        write: false,
        lib: {
          entry: `${root}/main.js`,
          formats: ['es'],
          cssFileName: 'style',
        },
      },
    }
    const withoutCache = await buildProject(root, false, config)
    expect(withoutCache.logs).toStrictEqual([
      expect.stringContaining('was not downloaded via Git LFS'),
    ])

    await buildProject(root, true, config)
    const second = await buildProject(root, true, config)
    expect(second.transformed).toStrictEqual(['a.css'])
    expect(second.logs).toStrictEqual(withoutCache.logs)
    expect(second.files).toStrictEqual(withoutCache.files)
  })

  test('a change to the PostCSS config causes a miss', async () => {
    const postcssConfig = (value: string) => `export default {
      plugins: [{
        postcssPlugin: 'test',
        Declaration(decl) {
          decl.value = '${value}'
        },
      }],
    }`
    const root = createProject({
      ...baseFiles,
      'a.css': '.a { margin: 1px }',
      'postcss.config.mjs': postcssConfig('2px'),
    })
    const first = await buildProject(root)
    expect(first.css).toContain('2px')

    const second = await buildProject(root)
    expect(second.transformed).toStrictEqual([])
    expect(second.files).toStrictEqual(first.files)

    fs.writeFileSync(`${root}/postcss.config.mjs`, postcssConfig('3px'))
    const third = await buildProject(root)
    expect(third.transformed).toStrictEqual(['a.css'])
    expect(third.css).toContain('3px')

    fs.rmSync(`${root}/postcss.config.mjs`)
    const fourth = await buildProject(root)
    expect(fourth.transformed).toStrictEqual(['a.css'])
    expect(fourth.css).toContain('1px')
  })

  describe('`composes` picks up a change to the other file', () => {
    const files = {
      ...baseFiles,
      'main.js': `import styles from './a.module.css'\nconsole.log(styles.a)`,
      'a.module.css': `.a { composes: base from './base.module.css'; padding: 1px }`,
      'base.module.css': '.base { margin: 1px }',
    }

    // postcss-modules does not pass `from` to `postcss.parse`. Vite prints a
    // warning for it, so the module gets no saved result.
    test('with PostCSS', async () => {
      const root = createProject(files)
      const first = await buildProject(root)
      expect(first.css).toContain('margin:1px')
      expect(first.logs).toStrictEqual([
        expect.stringContaining('did not pass the `from` option'),
      ])

      const second = await buildProject(root)
      expect(second.transformed).toStrictEqual(['a.module.css'])
      expect(second.logs).toStrictEqual(first.logs)
      expect(second.files).toStrictEqual(first.files)

      fs.writeFileSync(`${root}/base.module.css`, '.base { margin: 2px }')
      const third = await buildProject(root)
      expect(third.transformed).toStrictEqual(['a.module.css'])
      expect(third.css).toContain('margin:2px')
      const withoutCache = await buildProject(root, false)
      expect(third.files).toStrictEqual(withoutCache.files)
      expect(third.logs).toStrictEqual(withoutCache.logs)
    })

    test('with lightningcss', async () => {
      const config: InlineConfig = { css: { transformer: 'lightningcss' } }
      const root = createProject(files)
      const first = await buildProject(root, true, config)
      expect(first.css).toContain('margin:1px')

      const second = await buildProject(root, true, config)
      expect(second.transformed).toStrictEqual([])
      expect(second.files).toStrictEqual(first.files)

      fs.writeFileSync(`${root}/base.module.css`, '.base { margin: 2px }')
      const third = await buildProject(root, true, config)
      expect(third.transformed).toStrictEqual(['a.module.css'])
      expect(third.css).toContain('margin:2px')
      expect(third.files).toStrictEqual(
        (await buildProject(root, false, config)).files,
      )
    })
  })
})
