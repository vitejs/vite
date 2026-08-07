import path from 'node:path'
import { describe, expect, onTestFinished, test } from 'vitest'
import { createServer } from '../server'
import {
  optionalPeerDepId,
  tryResolveOptionalPeerDep,
} from '../plugins/resolve'
import type { InternalResolveOptions } from '../plugins/resolve'

const appRoot = path.join(import.meta.dirname, 'fixtures/optional-peer-dep')
const importer = path.join(
  appRoot,
  'node_modules/@vitejs/test-optional-peer-importer/index.js',
)

function baseOptions(
  overrides: Partial<InternalResolveOptions> = {},
): InternalResolveOptions {
  return {
    root: appRoot,
    isBuild: false,
    isProduction: false,
    asSrc: true,
    preferRelative: false,
    scan: false,
    mainFields: ['module', 'main'],
    conditions: [],
    externalConditions: [],
    extensions: ['.js', '.json'],
    tryIndex: true,
    preserveSymlinks: false,
    tsconfigPaths: false,
    dedupe: [],
    optimizeDeps: false,
    externalize: false,
    packageCache: new Map(),
    builtins: [],
    ...overrides,
  } as InternalResolveOptions
}

describe('tryResolveOptionalPeerDep', () => {
  // regression helper for https://github.com/vitejs/vite/issues/21881
  test('resolves uninstalled optional peer to optionalPeerDepId', () => {
    const resolved = tryResolveOptionalPeerDep(
      'not-installed-optional-peer',
      importer,
      baseOptions(),
    )
    expect(resolved).toEqual({
      id: `${optionalPeerDepId}:not-installed-optional-peer:@vitejs/test-optional-peer-importer`,
    })
  })

  test('resolves optional peer submodule', () => {
    const resolved = tryResolveOptionalPeerDep(
      'not-installed-optional-peer/sub',
      importer,
      baseOptions(),
    )
    expect(resolved).toEqual({
      id: `${optionalPeerDepId}:not-installed-optional-peer/sub:@vitejs/test-optional-peer-importer`,
    })
  })

  test('returns undefined when disabled', () => {
    expect(
      tryResolveOptionalPeerDep('not-installed-optional-peer', importer, {
        ...baseOptions(),
        disableOptionalPeerDepHandling: true,
      }),
    ).toBeUndefined()
  })

  test('returns undefined for non-peer imports', () => {
    expect(
      tryResolveOptionalPeerDep('totally-missing-pkg', importer, baseOptions()),
    ).toBeUndefined()
  })
})

describe('resolveId optional peer fallback', () => {
  // Ensures the JS fallback plugin (after native resolve) still maps optional
  // peers — the path Yarn PnP needs when oxc-resolver skips zip importers.
  test('plugin container resolves uninstalled optional peer', async () => {
    const server = await createServer({
      configFile: false,
      root: appRoot,
      logLevel: 'error',
      optimizeDeps: {
        noDiscovery: true,
        include: [],
      },
      server: {
        middlewareMode: true,
        ws: false,
      },
    })
    onTestFinished(() => server.close())

    const resolved = await server.environments.client.pluginContainer.resolveId(
      'not-installed-optional-peer',
      importer,
    )
    expect(resolved?.id).toBe(
      `${optionalPeerDepId}:not-installed-optional-peer:@vitejs/test-optional-peer-importer`,
    )
  })
})
