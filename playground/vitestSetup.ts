import type * as http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-chromium'
import type {
  ConfigEnv,
  InlineConfig,
  Logger,
  PluginOption,
  ResolvedConfig,
  UserConfig,
  ViteDevServer,
} from 'vite'
import {
  build,
  createBuilder,
  createServer,
  loadConfigFromFile,
  mergeConfig,
  preview,
} from 'vite'
import type { Browser, Page } from 'playwright-chromium'
import type {
  RolldownWatcher,
  RolldownWatcherEvent,
  RollupError,
} from 'rolldown'
import { afterEach, beforeAll, expect, inject, vi } from 'vitest'

// #region serializer

export const sourcemapSnapshot = Symbol()

const generateVisualizationLink = (code: string, map: string) => {
  const utf16ToUTF8 = (x) => unescape(encodeURIComponent(x))
  const convertedCode = utf16ToUTF8(code)
  const convertedMap = utf16ToUTF8(map)
  const hash = `${convertedCode.length}\0${convertedCode}${convertedMap.length}\0${convertedMap}`
  return `https://evanw.github.io/source-map-visualization/#${btoa(hash)}`
}

expect.addSnapshotSerializer({
  serialize(val, config, indentation, depth, refs, printer) {
    const options = val[sourcemapSnapshot]
    const map = { ...val.map }
    if (options.withoutContent) {
      delete map.sourcesContent
    }

    return `${indentation}SourceMap {
${indentation}${config.indent}content: ${printer(map, config, indentation + config.indent, depth, refs)},
${indentation}${config.indent}visualization: ${JSON.stringify(generateVisualizationLink(val.code, JSON.stringify(val.map)))}
${indentation}}`
  },
  test(val) {
    return typeof val === 'object' && val && val[sourcemapSnapshot]
  },
})

// #endregion

// #region env

export const workspaceRoot = path.resolve(import.meta.dirname, '../')

export const isBuild = !!process.env.VITE_TEST_BUILD
export const isServe = !isBuild
/**
 * Serve mode with `experimental.bundledDev` force-enabled for every playground
 * (`VITE_TEST_BUNDLED_DEV=1`). `isServe` stays `true` in this mode; use
 * `test.skipIf(isBundledDev)` / `describe.skipIf(isBundledDev)` for cases that
 * don't pass under bundled dev yet.
 */
export const isBundledDev = isServe && !!process.env.VITE_TEST_BUNDLED_DEV
export const isBundled = isBuild || isBundledDev
export const isWindows = process.platform === 'win32'
export const viteBinPath = path.posix.join(
  workspaceRoot,
  'packages/vite/bin/vite.js',
)

// #endregion

// #region context

let server: ViteDevServer | http.Server

/**
 * Vite Dev Server when testing serve
 */
export let viteServer: ViteDevServer
/**
 * Root of the Vite fixture
 */
export let rootDir: string
/**
 * Path to the current test file
 */
export let testPath: string
/**
 * Path to the test folder
 */
export let testDir: string
/**
 * Test folder name
 */
export let testName: string

export const serverLogs: string[] = []
export const browserLogs: string[] = []
export const browserErrors: Error[] = []

export let page: Page = undefined!
export let browser: Browser = undefined!
export let viteTestUrl: string = ''
export let watcher: RolldownWatcher | undefined = undefined

export function setViteUrl(url: string): void {
  viteTestUrl = url
}

function throwHtmlParseError() {
  return {
    name: 'vite-plugin-throw-html-parse-error',
    configResolved(config: ResolvedConfig) {
      const warn = config.logger.warn
      config.logger.warn = (msg, opts) => {
        // convert HTML parse warnings to make it easier to test
        if (msg.includes('Unable to parse HTML;')) {
          throw new Error(msg)
        }
        warn.call(config.logger, msg, opts)
      }
    },
  }
}
// #endregion

// eslint-disable-next-line no-empty-pattern
beforeAll(async ({}, suite) => {
  testPath = suite.file.filepath!
  testName = slash(testPath).match(/playground\/([\w-]+)\//)?.[1]
  testDir = path.dirname(testPath)
  if (testName) {
    testDir = path.resolve(workspaceRoot, 'playground-temp', testName)
  }

  // skip browser setup for hmr-ssr playground
  if (testName === 'hmr-ssr') {
    return
  }

  const wsEndpoint = inject('wsEndpoint')
  if (!wsEndpoint) {
    throw new Error('wsEndpoint not found')
  }

  browser = await chromium.connect(wsEndpoint)
  page = await browser.newPage()

  try {
    page.on('console', (msg) => {
      // ignore favicon request in headed browser
      if (
        process.env.VITE_DEBUG_SERVE &&
        msg.text().includes('Failed to load resource:') &&
        msg.location().url.includes('favicon.ico')
      ) {
        return
      }
      browserLogs.push(msg.text())
    })
    page.on('pageerror', (error) => {
      browserErrors.push(error)
    })

    // if this is a test placed under playground/xxx/__tests__
    // start a vite server in that directory.
    if (testName) {
      // when `root` dir is present, use it as vite's root
      const testCustomRoot = path.resolve(testDir, 'root')
      rootDir = fs.existsSync(testCustomRoot) ? testCustomRoot : testDir

      // separate rootDir for variant
      const variantName = path.basename(path.dirname(testPath))
      if (variantName !== '__tests__') {
        const variantTestDir = testDir + '__' + variantName
        if (fs.existsSync(variantTestDir)) {
          rootDir = testDir = variantTestDir
        }
      }

      const testCustomServe = [
        path.resolve(path.dirname(testPath), 'serve.ts'),
        path.resolve(path.dirname(testPath), 'serve.js'),
      ].find((i) => fs.existsSync(i))

      if (testCustomServe) {
        // test has custom server configuration.
        const mod = await import(testCustomServe)
        const serve = mod.serve || mod.default?.serve
        const preServe = mod.preServe || mod.default?.preServe
        if (preServe) {
          await preServe()
        }
        if (serve) {
          server = await serve()
          viteServer = mod.viteServer
        }
      } else {
        await startDefaultServe()
      }
    }
  } catch (e) {
    // Closing the page since an error in the setup, for example a runtime error
    // when building the playground should skip further tests.
    // If the page remains open, a command like `await page.click(...)` produces
    // a timeout with an exception that hides the real error in the console.
    await page.close()
    await server?.close()
    throw e
  }

  return async () => {
    serverLogs.length = 0
    await page?.close()
    await server?.close()
    await watcher?.close()
    if (browser) {
      await browser.close()
    }
  }
})

async function loadConfig(configEnv: ConfigEnv) {
  let config: UserConfig | null = null

  // config file named by convention as the *.spec.ts folder
  const variantName = path.basename(path.dirname(testPath))
  if (variantName !== '__tests__') {
    const configVariantPath = path.resolve(
      rootDir,
      `vite.config-${variantName}.js`,
    )
    if (fs.existsSync(configVariantPath)) {
      const res = await loadConfigFromFile(configEnv, configVariantPath)
      if (res) {
        config = res.config
      }
    }
  }
  // config file from test root dir
  if (!config) {
    const res = await loadConfigFromFile(configEnv, undefined, rootDir)
    if (res) {
      config = res.config
    }
  }

  const options: InlineConfig = {
    root: rootDir,
    logLevel: 'silent',
    configFile: false,
    server: {
      watch: {
        // During tests we edit the files too fast and sometimes chokidar
        // misses change events, so enforce polling for consistency
        usePolling: true,
        interval: 100,
      },
    },
    build: {
      // esbuild do not minify ES lib output since that would remove pure annotations and break tree-shaking
      // skip transpilation during tests to make it faster
      target: 'esnext',
    },
    customLogger: createInMemoryLogger(serverLogs),
    plugins: [
      throwHtmlParseError(),
      ...(isBundledDev ? [bundledDevSettle()] : []),
    ],
  }
  let merged = mergeConfig(options, config || {})
  // applied after the merge so the playground's own config cannot turn it off —
  // the whole point of the bundled-dev run is to force the mode everywhere
  if (isBundledDev) {
    merged = mergeConfig(merged, { experimental: { bundledDev: true } })
  }
  return merged
}

/** playgrounds that assert the bundling-fallback page itself — exempt from settle guards */
const FALLBACK_ASSERTING_PLAYGROUNDS = ['hmr-full-bundle-mode']

/** bumped by editFile/addFile/removeFile (test-utils) */
export let fileMutationCount = 0
export function noteFileMutation(): void {
  fileMutationCount++
}

// #region bundled-dev settle plugin

/** the rolldown module the bundled-dev client implement is appended to */
const ROLLDOWN_RUNTIME_MODULE_ID = '\0rolldown/runtime.js'

/**
 * Reload ledger kept by the `bundledDevSettle` plugin for the current server.
 * Owed reloads are split by decision kind because production cancels them
 * differently: an error broadcast cancels the HMR-decided reload (the server
 * clears `fullReloadPending`), but a reload scheduled by
 * `triggerBundleRegenerationIfStale` still fires after an errored rebuild
 * (`ensureLatestBuildOutput` resolves on failure), so only an actual send pays
 * it. A `full-reload` send pays every owed reload at once (the server debounce
 * merges them), so both counters being zero means no reload is on the way.
 * `sent` counts `full-reload` events that went out; `clientEpochs` stamps each
 * client with the value of `sent` at registration (client current ⟺ epoch >=
 * sent); `clientLastSentSeq` holds the seq of the last `bundled-dev-update`
 * patch sent to each client. `fallbackServeEpoch` holds the value of `sent`
 * when the latest fallback page was served — a fallback page obeys every
 * reload, so `sent > fallbackServeEpoch` means the current fallback page has
 * a navigation on the way.
 */
interface BundledDevSettleState {
  bundledDev: unknown
  /** owed reloads decided via HMR `FullReload` output (error broadcast cancels these) */
  owedHmr: number
  /** owed reloads scheduled by `triggerBundleRegenerationIfStale` (paid only by a send) */
  owedScheduled: number
  sent: number
  fallbackServeEpoch: number
  clientEpochs: Map<string, number>
  clientLastSentSeq: Map<string, number>
}

let settleState: BundledDevSettleState | undefined

/**
 * Monotone count of `watchChange` calls: the dev engine awaits the hook once
 * per changed file before it starts rebuilding, so a bump means the engine has
 * seen the change. Never reset (survives server restarts).
 */
let watchChangeCount = 0

/**
 * prototype wraps outlive server restarts — apply once; each call charges
 * `settleState` only when the calling instance is the current generation's
 * (during a restart the old server stays live while the new one is built, and
 * an old-generation decision must not be charged to the new ledger)
 */
let bundledDevPrototypeWrapped = false

/**
 * Instrumentation appended to the bundle after the vite client implement.
 * `__settle_reload_pending` is the only observable sign of a
 * decided-but-not-started navigation; the navigation itself clears it (fresh
 * globals). `__settle_applied_seq` advances once the client's apply queue has
 * fully processed a pushed patch. `__settle_instrumented` marks a successful
 * install — the settle predicate refuses to trust an uninstrumented runtime,
 * so a silent install failure cannot re-open the races this harness closes.
 */
const SETTLE_CLIENT_INSTRUMENTATION = `
;(() => {
  // test-only settle instrumentation appended by playground/vitestSetup.ts
  if (typeof BundledDevHMRClient === 'undefined') return
  try {
    const proto = BundledDevHMRClient.prototype
    const origHandlePush = proto.handlePush
    proto.handlePush = function (payload) {
      const seq = payload && payload.seq
      origHandlePush.call(this, payload)
      // applyQueue is the client's serialization point — it settles once the
      // push is applied, turned into a reload, or dropped as a silent noop
      this.applyQueue = this.applyQueue.then(() => {
        globalThis.__settle_applied_seq = seq
      })
    }
    const origRequestFullReload = proto.requestFullReload
    proto.requestFullReload = function (reason) {
      // set before the (debounced) reload starts, so the flag is never late
      globalThis.__settle_reload_pending = true
      return origRequestFullReload.call(this, reason)
    }
    if (globalThis.__rolldown_runtime__) {
      // server-sent full reloads notify listeners before reloading. Assumes
      // bundled-dev reloads always use path '*' (true today: the vite watcher
      // skips root and handleHmrUpdate returns early in this mode) — a
      // path-specific '.html' reload aimed at another page would set the flag
      // with no navigation following and wedge the settle wait
      globalThis.__rolldown_runtime__
        .createModuleHotContext('/__settle__')
        .on('vite:beforeFullReload', () => {
          globalThis.__settle_reload_pending = true
        })
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
      // covers reloads that skip the flags above (e.g. the
      // overlay-on-first-update path calls location.reload() directly)
      window.addEventListener('pagehide', () => {
        globalThis.__settle_reload_pending = true
      })
    }
    globalThis.__settle_instrumented = true
  } catch (e) {
    console.error('[bundled-dev settle] client instrumentation failed', e)
  }
})()
`

/**
 * Test-only plugin providing the tracking `waitForBundledDevSettled` reads:
 * it counts watched-file changes, keeps the server-side reload ledger, and
 * appends `SETTLE_CLIENT_INSTRUMENTATION` to the client bundle. Installed by
 * `loadConfig` only when `isBundledDev`.
 */
function bundledDevSettle(): PluginOption {
  const missing = (what: string) =>
    new Error(
      `[bundled-dev settle] ${what} is missing — production code changed, update the harness plugin in playground/vitestSetup.ts`,
    )
  return {
    name: 'vite-plugin-test-bundled-dev-settle',
    watchChange() {
      watchChangeCount++
    },
    transform(code: string, id: string) {
      if (id !== ROLLDOWN_RUNTIME_MODULE_ID) return null
      if (!code.includes('BundledDevHMRClient')) {
        // 'vite:client-connected' marks the inlined vite client implement; if
        // the implement is present but the class name is not, the class was
        // renamed and the appended instrumentation would silently no-op
        if (code.includes('vite:client-connected')) {
          throw missing('BundledDevHMRClient in the client implement')
        }
        // no implement in this bundle (e.g. a worker build) — skip
        return null
      }
      // rolldown's hmr plugin appended the vite client implement to this
      // module in its Pre-stage transform, so this appends into the same
      // scope, after it. `map: null` is correct: no existing code moved.
      return { code: code + SETTLE_CLIENT_INSTRUMENTATION, map: null }
    },
    configureServer(server: ViteDevServer) {
      // runs before `bundledDev.listen()` (fired from `httpServer.listen`),
      // so every wrap is in place before the dev engine starts
      const clientEnv = server.environments.client
      const bundledDev = (clientEnv as any).bundledDev
      if (!bundledDev) throw missing('server.environments.client.bundledDev')
      const proto = Object.getPrototypeOf(bundledDev)
      if (typeof proto.handleHmrOutput !== 'function') {
        throw missing('BundledDev.prototype.handleHmrOutput')
      }
      if (typeof proto.triggerBundleRegenerationIfStale !== 'function') {
        throw missing('BundledDev.prototype.triggerBundleRegenerationIfStale')
      }
      const hot = clientEnv.hot as any
      if (typeof hot?.send !== 'function' || typeof hot?.on !== 'function') {
        throw missing('server.environments.client.hot.send/on')
      }

      // fresh ledger per server generation (`server.restart()` re-runs this)
      const state: BundledDevSettleState = {
        bundledDev,
        owedHmr: 0,
        owedScheduled: 0,
        sent: 0,
        fallbackServeEpoch: 0,
        clientEpochs: new Map(),
        clientLastSentSeq: new Map(),
      }
      settleState = state

      if (!bundledDevPrototypeWrapped) {
        bundledDevPrototypeWrapped = true
        const origHandleHmrOutput = proto.handleHmrOutput
        proto.handleHmrOutput = function (
          client: unknown,
          files: unknown,
          hmrOutput: any,
        ) {
          // a FullReload decision defers its send to the `onOutput` callback
          const current = settleState
          if (
            current &&
            current.bundledDev === this &&
            hmrOutput?.type === 'FullReload'
          ) {
            current.owedHmr++
          }
          return origHandleHmrOutput.call(this, client, files, hmrOutput)
        }
        // a `true` return means a fallback page is served for this request
        // and a reload was scheduled for build completion (covers both the
        // stale-output and the HMR-failure recovery branches)
        const origTriggerRegen = proto.triggerBundleRegenerationIfStale
        proto.triggerBundleRegenerationIfStale = async function () {
          const scheduled = await origTriggerRegen.call(this)
          // read `settleState` after the await: a restart may swap
          // generations mid-call, and the identity check drops the decision
          const current = settleState
          if (current && current.bundledDev === this && scheduled) {
            current.owedScheduled++
            current.fallbackServeEpoch = current.sent
          }
          return scheduled
        }
      }

      // canonical `sent` site: every full reload, whoever triggers it, goes
      // through `hot.send`
      const origHotSend = hot.send.bind(hot)
      hot.send = (...args: any[]) => {
        const payload = args[0]
        if (payload && typeof payload === 'object') {
          // `ifFallback` reloads only address the bundling-fallback page
          if (payload.type === 'full-reload' && !payload.ifFallback) {
            state.sent++
            // one send pays every owed reload (the debounce merges them)
            state.owedHmr = 0
            state.owedScheduled = 0
          } else if (payload.type === 'error') {
            // the error broadcast replaces only the HMR-decided reload (the
            // server clears `fullReloadPending`); a scheduled regeneration
            // reload still fires after an errored rebuild and stays owed
            // until its send
            state.owedHmr = 0
          }
        }
        return origHotSend(...args)
      }

      const clientIdByClient = new WeakMap<object, string>()
      const wrappedClients = new WeakSet<object>()
      hot.on('vite:client-connected', (payload: any, client: any) => {
        const clientId = payload?.clientId
        if (typeof clientId !== 'string') return
        state.clientEpochs.set(clientId, state.sent)
        clientIdByClient.set(client, clientId)
        // `client` is the same normalized object bundledDev keeps (normalized
        // clients are cached per connection), so wrapping its `send` observes
        // the per-client `bundled-dev-update` patches
        if (typeof client?.send === 'function' && !wrappedClients.has(client)) {
          wrappedClients.add(client)
          const origClientSend = client.send.bind(client)
          client.send = (p: any) => {
            const id = clientIdByClient.get(client)
            if (id !== undefined && p?.type === 'bundled-dev-update') {
              state.clientLastSentSeq.set(id, p.seq)
            }
            return origClientSend(p)
          }
        }
      })
      hot.on('vite:client:disconnect', (_payload: any, client: any) => {
        const clientId = clientIdByClient.get(client)
        if (clientId !== undefined) {
          clientIdByClient.delete(client)
          state.clientEpochs.delete(clientId)
          state.clientLastSentSeq.delete(clientId)
        }
      })
    },
  }
}

// #endregion

/** thrown through the settle poll (never swallowed): the harness itself is broken */
class SettleHarnessError extends Error {}

/**
 * Waits until bundled dev has finished processing the latest change and the
 * page is at rest. Every condition is a definite state, not a timing guess,
 * so slow builds just make it wait longer:
 *   - no full reload is waiting to be sent (server) or started (page marker)
 *   - the page is loaded and not the fallback page (a fallback page counts
 *     only while the build is broken AND no reload went out since it was
 *     served — it obeys every reload, so a later send means it will navigate)
 *   - the page's client registered after the latest reload send
 * A loaded page without the client runtime (e.g. SSR) counts as settled.
 * Prefer `withPageReload` (test-utils) over calling this directly.
 */
export async function waitForBundledDevSettled(opts?: {
  timeout?: number
}): Promise<void> {
  if (!isBundledDev || !page) return
  // not public API — reached via `as any`
  const bundledDev = (viteServer as any)?.environments?.client?.bundledDev
  const state = settleState
  // only servers created through `loadConfig` carry the settle plugin
  if (!bundledDev || !state || state.bundledDev !== bundledDev) return
  const deadline = performance.now() + (opts?.timeout ?? 40_000)
  const remaining = () => Math.max(1, deadline - performance.now())
  // Reload decisions reach the ledger when the wraps run, inside the closures
  // the dev engine enqueues (`onHmrUpdates` / `onOutput`) — an enqueued but
  // not-yet-run closure is invisible to the ledger for a tick. The
  // `afterHmrEventCount` pre-wait (`watchChange` fires before the rebuild),
  // `ensureCurrentBuildFinish()` and the ledger re-check after the page probe
  // bound that window. TODO: harden with a sentinel flushed through the
  // engine's queue so the ledger is provably caught up.
  await vi.waitUntil(
    async () => {
      try {
        // ledger clear: no decided or scheduled reload is waiting to be sent
        if (state.owedHmr + state.owedScheduled !== 0) return false
        if (page.isClosed()) return true
        const devEngine = (bundledDev as any)._devEngine
        let lastBuildErrored = false
        if (devEngine) {
          await devEngine.ensureCurrentBuildFinish()
          lastBuildErrored = (await devEngine.getBundleState()).lastBuildErrored
        }
        const pageState = await page
          .evaluate(() => ({
            loaded: document.readyState === 'complete',
            pendingReload: !!(globalThis as any).__settle_reload_pending,
            isFallback: !!(globalThis as any).__vite_is_fallback_page__,
            hasRuntime: !!(globalThis as any).__rolldown_runtime__,
            instrumented: !!(globalThis as any).__settle_instrumented,
            clientId: (globalThis as any).__rolldown_runtime__?.clientId as
              | string
              | undefined,
            appliedSeq: (globalThis as any).__settle_applied_seq as
              | number
              | undefined,
          }))
          .catch(() => undefined)
        if (!pageState || !pageState.loaded || pageState.pendingReload) {
          return false
        }
        // the fallback page is legitimate only while the build is broken and
        // no reload went out since it was served. (A send that beat the
        // page's socket connect makes this block until the timeout — loud
        // and attributable, unlike letting a possible navigation trail out.)
        if (pageState.isFallback) {
          return lastBuildErrored && state.sent === state.fallbackServeEpoch
        }
        if (pageState.hasRuntime) {
          // the transform guarantees instrumentation whenever the implement
          // is in the bundle — a bare runtime means the harness is broken
          if (!pageState.instrumented) {
            throw new SettleHarnessError(
              '[bundled-dev settle] the page has the rolldown runtime but the settle instrumentation did not install — check the browser console for "[bundled-dev settle] client instrumentation failed"',
            )
          }
          if (!pageState.clientId) return false
          const epoch = state.clientEpochs.get(pageState.clientId)
          if (epoch === undefined || epoch < state.sent) return false
          // the last patch sent to this client went through its apply queue
          // (`undefined === undefined` when nothing was sent yet)
          if (
            pageState.appliedSeq !==
            state.clientLastSentSeq.get(pageState.clientId)
          ) {
            return false
          }
        }
        // re-check: a reload decision may have landed while probing the page
        return state.owedHmr + state.owedScheduled === 0
      } catch (e) {
        if (e instanceof SettleHarnessError) throw e
        // transient server-side errors (e.g. engine closing) — keep polling
        return false
      }
    },
    { timeout: remaining(), interval: 20 },
  )
}

function getBundledDevHmrEventCount(): number | undefined {
  const bundledDev = (viteServer as any)?.environments?.client?.bundledDev
  if (!bundledDev || !settleState || settleState.bundledDev !== bundledDev) {
    return undefined
  }
  return watchChangeCount
}

// settle-guard bookkeeping: what the last guard pass had already seen
let guardSeenMutations = 0
let guardSeenHmrEvents = 0

afterEach(async (ctx) => {
  // No test may hand the next one a page with updates or navigations still
  // in flight. Reload-expecting tests should still use `withPageReload`.
  if (
    !isBundledDev ||
    FALLBACK_ASSERTING_PLAYGROUNDS.includes(testName) ||
    !page ||
    page.isClosed()
  ) {
    return
  }
  if (fileMutationCount > guardSeenMutations) {
    // best-effort only: a mutation of an unwatched file never produces an event
    const seen = guardSeenHmrEvents
    await vi
      .waitUntil(() => (getBundledDevHmrEventCount() ?? seen + 1) > seen, {
        timeout: 2_000,
        interval: 20,
      })
      .catch(() => {})
  }
  try {
    await waitForBundledDevSettled({ timeout: 10_000 })
  } catch (e) {
    // a broken harness must fail the run, not degrade into warnings
    if (e instanceof SettleHarnessError) throw e
    console.warn(
      `[bundled-dev settle guard] "${ctx.task.name}" did not settle within 10s — later tests may see its trailing updates`,
    )
  }
  guardSeenMutations = fileMutationCount
  guardSeenHmrEvents = getBundledDevHmrEventCount() ?? guardSeenHmrEvents
})

export async function startDefaultServe(): Promise<void> {
  setupConsoleWarnCollector(serverLogs)

  if (!isBuild) {
    process.env.VITE_INLINE = 'inline-serve'
    const config = await loadConfig({ command: 'serve', mode: 'development' })
    viteServer = server = await (await createServer(config)).listen()
    viteTestUrl = stripTrailingSlashIfNeeded(
      server.resolvedUrls.local[0],
      server.config.base,
    )
    await page.goto(viteTestUrl)
    // bundled dev serves a self-reloading fallback page until the first
    // bundle completes; tests must not assert against that placeholder.
    // Wait server-side for the first build to settle (success or error) so
    // slow builds (e.g. many HTML inputs) don't race a fixed page timeout.
    // A playground whose first bundle fails keeps the fallback page, and its
    // tests are expected to handle that state themselves.
    // hmr-full-bundle-mode is exempt — it asserts the fallback page itself.
    if (isBundledDev && testName !== 'hmr-full-bundle-mode') {
      // `initialBuildCompleted` / `lastBuildError` are private — the harness
      // reaches in rather than widening the public API for tests only.
      const bundledDev = server.environments.client.bundledDev as any
      if (bundledDev) {
        await vi.waitUntil(
          () => bundledDev.initialBuildCompleted || bundledDev.lastBuildError,
          { timeout: 40_000 },
        )
      }
      if (bundledDev?.initialBuildCompleted) {
        await page
          .waitForFunction(
            () => !(globalThis as any).__vite_is_fallback_page__,
            undefined,
            { timeout: 15_000 },
          )
          .catch(() => {})
        // TODO: workaround — an edit fired while no client is connected is
        // dropped (vitejs/vite#23028). Remove this settle once the server
        // buffers updates for clients that connect later.
        await waitForBundledDevSettled()
      }
    }
  } else {
    process.env.VITE_INLINE = 'inline-build'
    let resolvedConfig: ResolvedConfig
    // determine build watch
    const resolvedPlugin: () => PluginOption = () => ({
      name: 'vite-plugin-watcher',
      configResolved(config) {
        resolvedConfig = config
      },
    })
    const buildConfig = mergeConfig(
      await loadConfig({ command: 'build', mode: 'production' }),
      {
        plugins: [resolvedPlugin()],
      },
    )
    if (buildConfig.builder) {
      const builder = await createBuilder(buildConfig)
      await builder.buildApp()
    } else {
      const rollupOutput = await build(buildConfig)
      const isWatch = !!resolvedConfig!.build.watch
      // in build watch,call startStaticServer after the build is complete
      if (isWatch) {
        watcher = rollupOutput as RolldownWatcher
        await notifyRebuildComplete(watcher)
      }
      if (buildConfig.__test__) {
        buildConfig.__test__()
      }
    }

    const previewConfig = await loadConfig({
      command: 'serve',
      mode: 'development',
      isPreview: true,
    })
    const _nodeEnv = process.env.NODE_ENV
    const previewServer = await preview(previewConfig)
    // prevent preview change NODE_ENV
    process.env.NODE_ENV = _nodeEnv
    viteTestUrl = stripTrailingSlashIfNeeded(
      previewServer.resolvedUrls.local[0],
      previewServer.config.base,
    )
    await page.goto(viteTestUrl)
  }
}

/**
 * Send the rebuild complete message in build watch
 */
export async function notifyRebuildComplete(
  watcher: RolldownWatcher,
): Promise<void> {
  let resolveFn: undefined | (() => void)
  const callback = (event: RolldownWatcherEvent): void => {
    if (event.code === 'END') {
      resolveFn?.()
    }
  }
  watcher.on('event', callback)
  await new Promise<void>((resolve) => {
    resolveFn = resolve
  })

  watcher.off('event', callback)
}

export function createInMemoryLogger(logs: string[]): Logger {
  const loggedErrors = new WeakSet<Error | RollupError>()
  const warnedMessages = new Set<string>()

  const logger: Logger = {
    hasWarned: false,
    hasErrorLogged: (err) => loggedErrors.has(err),
    clearScreen: () => {},
    info(msg) {
      logs.push(msg)
    },
    warn(msg) {
      logs.push(msg)
      logger.hasWarned = true
    },
    warnOnce(msg) {
      if (warnedMessages.has(msg)) return
      logs.push(msg)
      logger.hasWarned = true
      warnedMessages.add(msg)
    },
    error(msg, opts) {
      logs.push(msg)
      if (opts?.error) {
        loggedErrors.add(opts.error)
      }
    },
  }

  return logger
}

function setupConsoleWarnCollector(logs: string[]) {
  const warn = console.warn
  console.warn = (...args) => {
    logs.push(args.join(' '))
    return warn.call(console, ...args)
  }
}

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

function stripTrailingSlashIfNeeded(url: string, base: string): string {
  if (base === '/') {
    return url.replace(/\/$/, '')
  }
  return url
}

declare module 'vite' {
  export interface UserConfig {
    /**
     * special test only hook
     *
     * runs after build and before preview
     */
    __test__?: () => void
  }
}

declare module 'vitest' {
  export interface ProvidedContext {
    wsEndpoint: string
  }
}
