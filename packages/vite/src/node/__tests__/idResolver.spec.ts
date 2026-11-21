import path from 'node:path'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { cleanUrl } from '../../shared/utils'
import type { PartialEnvironment } from '../baseEnvironment'
import { resolveConfig } from '../config'
import { createBackCompatIdResolver } from '../idResolver'
import type { Plugin } from '../plugin'
import { createCSSResolvers, preprocessCSS } from '../plugins/css'
import { createServer } from '../server'
import { normalizePath } from '../utils'

const playgroundCss = path.resolve(
  import.meta.dirname,
  '../../../../../playground/css',
)
const clientCss = normalizePath(path.join(playgroundCss, 'glob-import/foo.css'))
const ssrCss = normalizePath(path.join(playgroundCss, 'glob-import/bar.css'))

async function createTestServer(plugins: Plugin[], root = import.meta.dirname) {
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    plugins,
    optimizeDeps: { noDiscovery: true, include: [] },
    environments: { custom: {} },
    server: { middlewareMode: true, ws: false, watch: null },
  })
  onTestFinished(() => server.close())
  await Promise.all(
    Object.values(server.environments).map((environment) =>
      environment.pluginContainer.buildStart(),
    ),
  )
  return server
}

describe('CSS user resolvers', () => {
  test('shares the CSS resolver across client and SSR when there are no user plugins', async () => {
    const server = await createTestServer([], playgroundCss)
    const createResolver = vi.spyOn(server.config, 'createResolver')
    const resolve = createCSSResolvers(server.config).css
    const importer = path.join(playgroundCss, 'entry.css')
    for (const environment of [
      server.environments.client,
      server.environments.ssr,
    ]) {
      expect(
        await resolve(environment, './glob-import/foo.css', importer),
      ).toBe(clientCss)
    }
    expect(createResolver).toHaveBeenCalledTimes(1)
  })

  test('continues CSS resolution when a user hook returns a virtual or queried module ID', async () => {
    const diskImport = './glob-import/foo.css'
    const secondDiskImport = './glob-import/bar.css'
    const aliasImport = '~aliased.css'
    const pluginImport = '~from-plugin.css'
    const virtualId = '\0virtual:theme.css'
    const queriedId = `${ssrCss}?flavor=custom`
    const server = await createTestServer(
      [
        {
          name: 'module-resolver',
          config: () => ({ resolve: { alias: { [aliasImport]: ssrCss } } }),
          resolveId: {
            order: 'pre',
            handler(id) {
              if (id === diskImport || id === aliasImport) return virtualId
              if (id === secondDiskImport) return 'virtual:theme.css'
              if (id === pluginImport) return { id: queriedId }
            },
          },
        },
        {
          name: 'file-resolver',
          enforce: 'pre',
          resolveId(id) {
            if (id === pluginImport) return clientCss
          },
        },
      ],
      playgroundCss,
    )
    const client = server.environments.client
    const resolve = createCSSResolvers(server.config).css
    const importer = path.join(playgroundCss, 'entry.css')
    expect([
      await resolve(client, diskImport, importer),
      await resolve(client, secondDiskImport, importer),
      await resolve(client, aliasImport, importer),
      await resolve(client, pluginImport, importer),
    ]).toStrictEqual([clientCss, ssrCss, ssrCss, clientCss])

    const jsImporter = path.join(playgroundCss, 'main.js')
    expect(
      (await client.pluginContainer.resolveId(diskImport, jsImporter))?.id,
    ).toBe(virtualId)
    expect(
      (await client.pluginContainer.resolveId(pluginImport, jsImporter))?.id,
    ).toBe(queriedId)
  })

  test('does not reset plugin state when creating a CSS resolver', async () => {
    let ready = false
    let optionsCalls = 0
    const server = await createTestServer([
      {
        name: 'stateful-js-resolver',
        enforce: 'pre',
        options() {
          optionsCalls++
          ready = false
        },
        buildStart() {
          ready = true
        },
        resolveId(id) {
          if (id === 'virtual:js') {
            if (!ready) throw new Error('Plugin state was reset')
            return '\0virtual:js'
          }
        },
      },
    ])
    const environment = server.environments.client
    const callsBeforeCss = optionsCalls
    const resolve = createCSSResolvers(server.config).css
    await resolve(
      environment,
      './plugins/fixtures/css-module-compose/css/bar.module.css',
      path.join(import.meta.dirname, 'entry.css'),
    )
    expect(optionsCalls).toBe(callsBeforeCss)
    expect(
      await environment.pluginContainer.resolveId('virtual:js'),
    ).toMatchObject({ id: '\0virtual:js' })
  })

  test('keeps the environment through legacy resolver extensions', async () => {
    const started = new WeakSet<PartialEnvironment>()
    const server = await createTestServer([
      {
        name: 'environment-resolver',
        enforce: 'pre',
        perEnvironmentStartEndDuringDev: true,
        buildStart() {
          started.add(this.environment)
        },
        async resolveId(id) {
          if (id !== '~environment.css') return
          await Promise.resolve()
          if (!started.has(this.environment)) {
            throw new Error('Unknown environment')
          }
          return `/${this.environment.name}.css`
        },
        configResolved(config) {
          const createResolver = config.createResolver.bind(config)
          config.createResolver = (options) => {
            const resolve = createResolver({ ...options })
            // Existing wrappers only forward the original four arguments.
            return (id, importer, aliasOnly, ssr) => {
              if (id === '~legacy.css') {
                return Promise.resolve(`/legacy-${ssr ? 'ssr' : 'client'}.css`)
              }
              return resolve(
                id === '~delegated.css' ? '~environment.css' : id,
                importer,
                aliasOnly,
                ssr,
              )
            }
          }
        },
      },
    ])
    const resolve = createCSSResolvers(server.config).css
    const { client, ssr, custom } = server.environments
    expect(
      await Promise.all([
        resolve(client, '~delegated.css'),
        resolve(ssr, '~delegated.css'),
        resolve(client, '~legacy.css'),
        resolve(ssr, '~legacy.css'),
        resolve(custom, '~environment.css'),
      ]),
    ).toStrictEqual([
      '/client.css',
      '/ssr.css',
      '/legacy-client.css',
      '/legacy-ssr.css',
      '/custom.css',
    ])
    expect(await resolve(client, '~delegated.css')).toBe('/client.css')
  })

  test('honors the SSR argument a legacy resolver wrapper forwards', async () => {
    const alias = '~environment-alias.css'
    const server = await createTestServer([
      {
        name: 'swap-environment',
        enforce: 'pre',
        resolveId: () => undefined,
        configResolved(config) {
          config.environments.client.resolve.alias = [
            { find: alias, replacement: clientCss },
          ]
          config.environments.ssr.resolve.alias = [
            { find: alias, replacement: ssrCss },
          ]
          const createResolver = config.createResolver.bind(config)
          config.createResolver = (options) => {
            const resolve = createResolver(options)
            return (id, importer, aliasOnly, ssr) =>
              resolve(id, importer, aliasOnly, !ssr)
          }
        },
      },
    ])
    const resolve = createCSSResolvers(server.config).css
    const { client, ssr } = server.environments
    expect(await resolve(client, alias)).toBe(ssrCss)
    expect(await resolve(ssr, alias)).toBe(clientCss)
  })

  test.each(['postcss', 'lightningcss'] as const)(
    'reuses the standalone %s resolver across preprocessCSS calls',
    async (transformer) => {
      const specifier = '~standalone.css'
      let resolverCreations = 0
      const config = await resolveConfig(
        {
          configFile: false,
          root: playgroundCss,
          css: { transformer, postcss: { plugins: [] } },
          plugins: [
            {
              name: 'standalone-resolver',
              enforce: 'pre',
              resolveId(id) {
                if (id === specifier) return ssrCss
              },
              configResolved(config) {
                const createResolver = config.createResolver.bind(config)
                config.createResolver = (options) => {
                  resolverCreations++
                  return createResolver(options)
                }
              },
            },
          ],
        },
        'serve',
      )
      for (let i = 0; i < 3; i++) {
        const result = await preprocessCSS(
          `@import '${specifier}';`,
          path.join(playgroundCss, 'entry.css'),
          config,
        )
        expect(result.code).toContain('.dir-import-2')
      }
      expect(resolverCreations).toBe(1)
    },
  )

  test('selects replacement hooks according to their environment-specific order', async () => {
    const specifier = '~replacement.css'
    const declaredPreSpecifier = '~declared-pre.css'
    const replacement: Plugin = {
      name: 'replacement-resolver',
      resolveId(id) {
        if (id === specifier) return ssrCss
      },
    }
    const server = await createTestServer([
      {
        name: 'client-pre-resolver',
        enforce: 'pre',
        applyToEnvironment(environment) {
          return environment.name === 'client' && replacement
        },
      },
      {
        name: 'ssr-normal-resolver',
        applyToEnvironment(environment) {
          if (environment.name === 'ssr') {
            return [
              replacement,
              {
                name: 'declared-pre-resolver',
                enforce: 'pre',
                resolveId(id) {
                  if (id === declaredPreSpecifier) return ssrCss
                },
              },
            ]
          }
          return false
        },
      },
    ])
    const { client, ssr } = server.environments
    for (const environment of [client, ssr]) {
      expect(
        await environment.pluginContainer.resolveId(specifier),
      ).toMatchObject({
        id: ssrCss,
      })
    }

    const resolve = createCSSResolvers(server.config).css
    expect(await resolve(client, specifier)).toBe(ssrCss)
    expect(await resolve(ssr, specifier)).toBeUndefined()
    expect(
      await ssr.pluginContainer.resolveId(declaredPreSpecifier),
    ).toMatchObject({ id: ssrCss })
    expect(await resolve(ssr, declaredPreSpecifier)).toBeUndefined()
  })

  test('keeps alias priority unless the user resolveId hook specifies pre order', async () => {
    const id = '~alias-priority.css'
    const handler = (source: string) => (source === id ? ssrCss : undefined)
    const server = await createTestServer([
      {
        name: 'alias-priority',
        enforce: 'pre',
        config: () => ({ resolve: { alias: { [id]: clientCss } } }),
        applyToEnvironment(environment) {
          return {
            name: 'stylesheet-resolver',
            resolveId:
              environment.name === 'client'
                ? handler
                : { order: 'pre', handler },
          }
        },
      },
    ])
    const resolve = createCSSResolvers(server.config).css
    expect(await resolve(server.environments.client, id)).toBe(clientCss)
    expect(await resolve(server.environments.ssr, id)).toBe(ssrCss)
  })

  test.each([
    ['sass.scss', `@use '~environment-target' as fixture;`],
    ['less.less', `@import (less) '~environment-target';`],
  ])(
    'resolves %s imports in the environment of each request',
    async (entry, source) => {
      const entryPath = normalizePath(path.join(playgroundCss, entry))
      const server = await createTestServer(
        [
          {
            name: 'stylesheet-environment-resolver',
            enforce: 'pre',
            config() {
              return {
                css: { postcss: { plugins: [] }, preprocessorMaxWorkers: 1 },
              }
            },
            load(id) {
              if (cleanUrl(id) === entryPath) return source
            },
            resolveId(id) {
              if (/^~environment-target(?:\.less)?$/.test(id)) {
                return this.environment.name === 'ssr' ? ssrCss : clientCss
              }
            },
          },
        ],
        playgroundCss,
      )
      const { client, ssr } = server.environments
      const url = `/${entry}?inline`

      expect((await client.transformRequest(url))?.code).toMatch(
        /\.dir-import\s*\{/,
      )
      expect((await ssr.transformRequest(url))?.code).toMatch(
        /\.dir-import-2\s*\{/,
      )

      // A new URL forces both environments to preprocess the same file again.
      const [ssrResult, clientResult] = await Promise.all([
        ssr.transformRequest(`${url}&repeated`),
        client.transformRequest(`${url}&repeated`),
      ])
      expect(ssrResult?.code).toMatch(/\.dir-import-2\s*\{/)
      expect(clientResult?.code).toMatch(/\.dir-import\s*\{/)
    },
  )

  test('preserves hook filters and this.resolve delegation', async () => {
    const calls: string[] = []
    const server = await createTestServer([
      {
        name: 'delegate',
        resolveId: {
          order: 'pre',
          filter: { id: /^~delegate\.css$/ },
          async handler(id, importer, options) {
            calls.push('delegate')
            return this.resolve(id, importer, {
              ...options,
              custom: { fromDelegate: true },
            })
          },
        },
      },
      {
        name: 'target',
        enforce: 'pre',
        resolveId(id, _importer, options) {
          if (id === '~delegate.css') {
            expect(options.custom?.fromDelegate).toBe(true)
            calls.push('target')
            return '/target.css'
          }
          if (id === '~other.css') return '/other.css'
        },
      },
    ])
    const resolve = createBackCompatIdResolver(server.config, {
      userPrePlugins: true,
    })
    const environment = server.environments.client
    expect(await resolve(environment, '~delegate.css')).toBe('/target.css')
    expect(await resolve(environment, '~other.css')).toBe('/other.css')
    expect(calls).toStrictEqual(['delegate', 'target'])
    // Alias-only resolution must not call either user hook.
    expect(
      await resolve(environment, '~delegate.css', undefined, true),
    ).toBeUndefined()
    expect(calls).toStrictEqual(['delegate', 'target'])
  })
})
