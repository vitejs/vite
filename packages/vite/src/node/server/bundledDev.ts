import { setTimeout } from 'node:timers/promises'
import getEtag from 'etag'
import colors from 'picocolors'
import type {
  OutputOptions,
  Plugin,
  RolldownOptions,
  RolldownOutput,
} from 'rolldown'
import {
  type BindingHmrUpdate,
  type DevEngine,
  type DevOutputInfo,
  dev,
} from 'rolldown/experimental'
import { ChunkMetadataMap, resolveRolldownOptions } from '../build'
import {
  BUNDLED_DEV_CLIENT_FILENAME,
  BUNDLED_DEV_ROLLDOWN_RUNTIME_FILENAME,
} from '../constants'
import {
  getBundledDevClientAliases,
  getHmrImplementation,
  getRolldownDevRuntime,
} from '../plugins/clientInjections'
import {
  createDebugger,
  formatAndTruncateFileList,
  normalizePath,
} from '../utils'
import { convertToDevWatchOptions } from '../watch'
import type { DevEnvironment } from './environment'
import { type NormalizedHotChannelClient, debugHmr, getShortName } from './hmr'
import { PayloadMapStore } from './middlewares/bundledDevPayload'
import { prepareError } from './middlewares/error'

const debug = createDebugger('vite:full-bundle-mode')

/**
 * The code of an HMR patch or a lazy chunk, and its sourcemap as JSON. The
 * code has no `sourceMappingURL` comment: the server that serves it adds one.
 */
export type BundledDevPayload = { code: string; map: string | undefined }

type MemoryFile = {
  source: string | Uint8Array
  sourcemapPath?: string
  etag?: string
  contentType?: string
}

export class MemoryFiles {
  private files = new Map<string, MemoryFile | (() => MemoryFile)>()

  get size(): number {
    return this.files.size
  }

  get(file: string): MemoryFile | undefined {
    const result = this.files.get(file)
    if (result === undefined) {
      return undefined
    }
    if (typeof result === 'function') {
      const content = result()
      this.files.set(file, content)
      return content
    }
    return result
  }

  set(file: string, content: MemoryFile | (() => MemoryFile)): void {
    this.files.set(file, content)
  }

  has(file: string): boolean {
    return this.files.has(file)
  }

  clear(): void {
    this.files.clear()
  }
}

export class BundledDev {
  private _devEngine!: DevEngine
  /** the vite client and the rolldown runtime; set before the first build so `hasBuildOutput` can count them */
  private staticFiles = new Map<string, MemoryFile>()
  private initialBuildCompleted = false
  private _closed = false
  private clients = new Clients()
  private debouncedFullReload = debounce(20, () => {
    this.environment.hot.send({ type: 'full-reload', path: '*' })
    this.environment.logger.info(colors.green(`page reload`), {
      timestamp: true,
    })
  })

  private fullReloadPending = false

  private reloadNeededClientIds = new Set<string>()
  private debouncedReloadNeededFlush = debounce(20, () => {
    if (this.lastBuildError || this.reloadNeededClientIds.size === 0) return
    for (const clientId of this.reloadNeededClientIds) {
      this.clients.get(clientId)?.send({ type: 'full-reload', path: '*' })
    }
    this.reloadNeededClientIds.clear()
    this.environment.logger.info(colors.green(`page reload`), {
      timestamp: true,
    })
  })

  private lastBuildError: Error | null = null

  memoryFiles: MemoryFiles = new MemoryFiles()
  patchMaps: PayloadMapStore = new PayloadMapStore('p')
  lazyMaps: PayloadMapStore = new PayloadMapStore('l')
  /**
   * The HMR generation of the stored output. A page that loads this output
   * starts at it (`DevRuntime.setOutputGeneration`).
   */
  outputGeneration: number | undefined
  facadeToChunk: Map<string, string> = new Map()
  private entryResolver?: (id: string) => Promise<string | undefined>

  constructor(private environment: DevEnvironment) {}

  private get devEngine(): DevEngine {
    if (!this._devEngine) {
      throw new Error(`dev engine was not yet initialized`)
    }
    return this._devEngine
  }

  get hasBuildOutput(): boolean {
    return this.memoryFiles.size > this.staticFiles.size
  }

  async resolveEntryFacade(id: string): Promise<string | undefined> {
    return this.entryResolver?.(id)
  }

  async listen(): Promise<void> {
    this._closed = false
    debug?.('INITIAL: setup bundle options')
    const rolldownOptions = await this.getRolldownOptions()
    if (isEmptyInput(rolldownOptions.input)) {
      debug?.('INITIAL: no entry points, skipping the build')
      return
    }
    if (this.environment.config.consumer !== 'server') {
      await this.storeStaticFiles()
    }
    // NOTE: only single outputOptions is supported here
    if (
      Array.isArray(rolldownOptions.output) &&
      rolldownOptions.output.length > 1
    ) {
      throw new Error('multiple output options are not supported in dev mode')
    }
    const outputOptions = (
      Array.isArray(rolldownOptions.output)
        ? rolldownOptions.output[0]
        : rolldownOptions.output
    )!

    this.environment.hot.on('vite:client-connected', (payload, client) => {
      this.clients.setupIfNeeded(client, payload.clientId)
    })
    this.environment.hot.on('vite:client:connect', (_payload, client) => {
      // Replay the cached build error to freshly connected clients.
      if (this.lastBuildError) {
        debug?.('REPLAY: replaying last build error to newly connected client')

        client.send({
          type: 'error',
          err: prepareError(this.lastBuildError),
        })
      }
    })
    this.environment.hot.on('vite:client:disconnect', (_payload, client) => {
      const clientId = this.clients.delete(client)
      if (clientId) {
        this.reloadNeededClientIds.delete(clientId)
      }
    })
    this.environment.hot.on(
      'vite:bundled-dev:reload-needed',
      (payload, client) => {
        const clientId = this.clients.getId(client)
        if (!clientId) return
        debug?.(
          `TRIGGER: client ${clientId} requested a page reload (${payload.reason})`,
        )
        this.environment.logger.info(
          colors.green(`bundling for page reload `) +
            colors.dim(payload.reason),
          { clear: true, timestamp: true },
        )
        this.reloadNeededClientIds.add(clientId)
        this.ensureOutputAndFlushReloadNeeded()
      },
    )

    this._devEngine = await dev(rolldownOptions, outputOptions, {
      onHmrUpdates: (result) => this.handleHmrUpdates(result),
      onOutput: (result, info) => this.handleOutput(result, info),
      onAdditionalAssets: (result) => {
        this.storeOutputFiles(result.output)
      },
      watch: {
        skipWrite: true,
        ...convertToDevWatchOptions(this.environment.config.server.watch),
      },
    })
    debug?.('INITIAL: setup dev engine')
    this.devEngine.run().then(
      () => {
        debug?.('INITIAL: run done')
      },
      (e) => {
        debug?.('INITIAL: run error', e)
      },
    )
    this.waitForInitialBuildFinish().then(() => {
      if (this._closed) return
      debug?.('INITIAL: build done')
      this.initialBuildCompleted = true
      if (!this.lastBuildError) {
        this.environment.hot.send({
          type: 'full-reload',
          path: '*',
          ifFallback: true,
        })
      }
    })
  }

  /** @internal */
  handleHmrUpdates(
    result: Error | { update: BindingHmrUpdate; changedFiles: string[] },
  ): void {
    if (result instanceof Error) {
      this.environment.logger.error(
        colors.red(`✘ Build error: ${result.message}`),
        {
          error: result,
        },
      )
      // TODO: send to the specific client
      for (const client of this.clients.getAll()) {
        client.send({
          type: 'error',
          err: prepareError(result),
        })
      }
      return
    }
    const { update, changedFiles } = result
    if (changedFiles.length === 0) {
      return
    }
    if (update.type === 'Noop') {
      debug?.(`ignored file change for ${changedFiles.join(', ')}`)
      return
    }
    this.handleHmrUpdate(changedFiles, update)
    // an edit requested a reload but its rebuild failed, leaving the page
    // waiting behind the error overlay. The fix produced this successful
    // build — regenerate output now, or the page would never reload.
    if (this.reloadNeededClientIds.size) {
      this.ensureOutputAndFlushReloadNeeded()
    }
  }

  /** @internal */
  handleOutput(
    result: Error | RolldownOutput,
    info: DevOutputInfo | undefined,
  ): void {
    if (result instanceof Error) {
      this.environment.logger.error(
        colors.red(`✘ Build error: ${result.message}`),
        {
          error: result,
        },
      )
      this.lastBuildError = result
      // keep a pending reload until a build succeeds: the pages still run
      // the output from before the change that needed the reload
      this.environment.hot.send({
        type: 'error',
        err: prepareError(result),
      })
      return
    }
    this.lastBuildError = null

    this.storeOutputFiles(result.output)
    this.outputGeneration = info?.hmrGeneration

    // Trigger a full reload if there's no error in the result and a reload is pending from HMR.
    if (this.fullReloadPending) {
      this.fullReloadPending = false
      this.debouncedFullReload()
    }
    if (this.reloadNeededClientIds.size) {
      this.debouncedReloadNeededFlush()
    }
  }

  /**
   * @internal
   */
  public async _waitForInitialBuildSuccess(): Promise<void> {
    // the build is skipped when there are no entry points
    if (!this._devEngine) return
    await this.devEngine.ensureCurrentBuildFinish()
    const bundleState = await this.devEngine.getBundleState()
    if (bundleState.lastBuildErrored) {
      throw new Error(
        `The last full bundle mode build has failed. See logs for more information.`,
      )
    }
  }

  private async waitForInitialBuildFinish(): Promise<void> {
    if (this._closed) return
    await this.devEngine.ensureCurrentBuildFinish()
    if (this._closed) return

    let state = await this.devEngine.getBundleState()
    while (!this.hasBuildOutput && !state.lastBuildErrored) {
      await setTimeout(10)
      if (this._closed) return
      await this.devEngine.ensureCurrentBuildFinish()
      if (this._closed) return
      state = await this.devEngine.getBundleState()
    }
  }

  private ensureOutputAndFlushReloadNeeded(): void {
    this.devEngine.ensureLatestBuildOutput().then(
      () => this.debouncedReloadNeededFlush(),
      () => {},
    )
  }

  async triggerBundleRegenerationIfStale(): Promise<boolean> {
    const bundleState = await this.devEngine.getBundleState()

    // Trigger full build if the HMR errors,
    // this is to make it easier to recover if the HMR generation is broken for some reason.
    if (
      this.initialBuildCompleted &&
      bundleState.lastBuildErrored &&
      bundleState.lastErrorStage === 'Hmr'
    ) {
      debug?.(`TRIGGER: access after HMR-stage failure, forcing full rebuild`)

      this.devEngine.triggerFullBuild()
      this.devEngine.ensureLatestBuildOutput().then(() => {
        this.debouncedFullReload()
      })
      return true
    }

    const shouldTrigger =
      bundleState.hasStaleOutput &&
      !bundleState.lastBuildErrored &&
      this.initialBuildCompleted
    if (shouldTrigger) {
      this.devEngine.ensureLatestBuildOutput().then(() => {
        this.debouncedFullReload()
      })
      debug?.(`TRIGGER: access to stale bundle, triggered bundle re-generation`)
    }
    return shouldTrigger
  }

  /**
   * Renders the HMR patch a client requests. `query` describes what the client
   * holds; the runtime builds it (`DevRuntime.encodeHave`).
   */
  async renderPatch(query: string): Promise<BundledDevPayload> {
    debug?.(`PATCH: render the hmr patch for ${query}`)
    const result = await this.devEngine.renderPatch(
      this.resolveHaveQuery(query),
    )
    if (result.type === 'Reload') {
      return reloadNeededPayload(result.reason)
    }
    return { code: result.code, map: result.sourcemap }
  }

  /**
   * A client that does not know the generation of its output leaves out `g`:
   * it gets the generation of the stored output, the one it most likely loaded.
   */
  private resolveHaveQuery(query: string): string {
    if (
      this.outputGeneration === undefined ||
      new URLSearchParams(query).has('g')
    ) {
      return query
    }
    return `${query}&g=${this.outputGeneration}`
  }

  /**
   * Compiles the lazy entry `moduleId`. `query` describes what the client
   * holds, like the query of `renderPatch`.
   */
  async triggerLazyBundling(
    moduleId: string,
    query: string,
  ): Promise<BundledDevPayload> {
    debug?.(`TRIGGER-LAZY: trigger lazy bundling for module ${moduleId}`)
    const result = await this.devEngine.compileEntry(
      moduleId,
      this.resolveHaveQuery(query),
    )
    if (result.type === 'Reload') {
      return reloadNeededPayload(result.reason)
    }
    return { code: result.code, map: result.sourcemap }
  }

  resetClient(oldClientId: string, newClientId: string): void {
    const client = this.clients.get(oldClientId)
    if (!client) {
      throw new Error(`bundled dev client ${oldClientId} is not registered`)
    }
    this.clients.replace(client, newClientId)
    this.reloadNeededClientIds.delete(oldClientId)
  }

  async close(): Promise<void> {
    this._closed = true
    this.memoryFiles.clear()
    try {
      await this._devEngine?.close()
    } finally {
      this.entryResolver = undefined
      this.initialBuildCompleted = false
    }
  }

  private async storeStaticFiles(): Promise<void> {
    const sources = new Map<string, string>([
      [
        BUNDLED_DEV_CLIENT_FILENAME,
        await getHmrImplementation(this.environment.getTopLevelConfig()),
      ],
      [BUNDLED_DEV_ROLLDOWN_RUNTIME_FILENAME, getRolldownDevRuntime()],
    ])
    const aliases = getBundledDevClientAliases(
      this.environment.getTopLevelConfig(),
    )
    this.staticFiles.clear()
    for (const [fileName, source] of [...sources, ...aliases]) {
      const file: MemoryFile = {
        source,
        etag: getEtag(Buffer.from(source), { weak: true }),
        ...(aliases.has(fileName) ? { contentType: 'text/javascript' } : {}),
      }
      this.staticFiles.set(fileName, file)
      this.memoryFiles.set(fileName, file)
    }
  }

  private storeOutputFiles(output: RolldownOutput['output'][number][]): void {
    // NOTE: don't clear memoryFiles here as incremental build reuses the files
    for (const outputFile of output) {
      if (
        outputFile.type === 'chunk' &&
        outputFile.isEntry &&
        outputFile.facadeModuleId
      ) {
        this.facadeToChunk.set(
          outputFile.facadeModuleId,
          normalizePath(outputFile.fileName),
        )
      }
      this.memoryFiles.set(normalizePath(outputFile.fileName), () => {
        const source =
          outputFile.type === 'chunk' ? outputFile.code : outputFile.source
        return {
          source,
          sourcemapPath:
            outputFile.type === 'chunk' && outputFile.sourcemapFileName
              ? normalizePath(outputFile.sourcemapFileName)
              : undefined,
          etag: getEtag(Buffer.from(source), { weak: true }),
        }
      })
    }
  }

  protected async getRolldownOptions(): Promise<RolldownOptions> {
    const chunkMetadataMap = new ChunkMetadataMap()
    const rolldownOptions = resolveRolldownOptions(
      this.environment,
      chunkMetadataMap,
    )
    const setEntryResolver = (
      resolver: (id: string) => Promise<string | undefined>,
    ) => {
      this.entryResolver = resolver
    }
    const resolveEntriesPlugin: Plugin = {
      name: 'vite:bundled-dev-resolve-entries',
      buildStart() {
        setEntryResolver(async (id) => {
          return (await this.resolve(id, undefined, { isEntry: true }))?.id
        })
      },
    }
    rolldownOptions.plugins = [rolldownOptions.plugins, resolveEntriesPlugin]
    rolldownOptions.experimental ??= {}
    rolldownOptions.experimental.devMode = {
      lazy: true,
      ...(typeof rolldownOptions.experimental.devMode === 'object'
        ? rolldownOptions.experimental.devMode
        : {}),
      implement: '',
      skipCommonRuntimeInjection: true,
    }

    // disable inlineConst optimization due to a bug in Rolldown
    // https://github.com/vitejs/vite/issues/21843
    rolldownOptions.optimization ??= {}
    rolldownOptions.optimization.inlineConst = false

    // set filenames to make output paths predictable so that `renderChunk` hook does not need to be used
    if (Array.isArray(rolldownOptions.output)) {
      for (const output of rolldownOptions.output) {
        Object.assign(output, this.getOutputOptions())
      }
    } else {
      rolldownOptions.output ??= {}
      Object.assign(rolldownOptions.output, this.getOutputOptions())
    }

    return rolldownOptions
  }

  protected getOutputOptions(): OutputOptions {
    return {
      entryFileNames: 'assets/[name].js',
      chunkFileNames: 'assets/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash][extname]',
      minify: false,
      sourcemap: true,
    }
  }

  private handleHmrUpdate(files: string[], update: BindingHmrUpdate) {
    const shortFile = files
      .map((file) => getShortName(file, this.environment.config.root))
      .join(', ')
    if (update.type === 'FullReload') {
      const reason = update.reason ? colors.dim(` (${update.reason})`) : ''
      this.environment.logger.info(
        colors.green(`trigger page reload `) + colors.dim(shortFile) + reason,
        { clear: true, timestamp: true },
      )
      // `import.meta.hot.invalidate()` is fully client-side now, so every server-sent
      // reload comes from a file change: defer it until the `onOutput` callback to
      // avoid error overlay flashes.
      this.fullReloadPending = true
      return
    }
    if (update.type !== 'Changed') return

    debug?.(`handle hmr update for ${shortFile}`, update)
    for (const client of this.clients.getAll()) {
      client.send({
        type: 'bundled-dev-update',
        changedIds: update.changedIds,
        staleIds: update.staleIds,
        gen: update.gen,
        seq: this.clients.nextSeq(client),
      })
    }
    const { formatted, truncated } = formatAndTruncateFileList(
      update.changedIds,
    )
    if (truncated) debugHmr?.(`hmr update ${update.changedIds.join(', ')}`)
    this.environment.logger.info(
      colors.green(`hmr update `) + colors.dim(formatted),
      {
        clear: true,
        timestamp: true,
      },
    )
  }
}

class Clients {
  private clientToId = new Map<NormalizedHotChannelClient, string>()
  private idToClient = new Map<string, NormalizedHotChannelClient>()
  private lastSeq = new Map<NormalizedHotChannelClient, number>()

  setupIfNeeded(client: NormalizedHotChannelClient, clientId: string) {
    const id = this.clientToId.get(client)
    if (id && id !== clientId) {
      throw new Error(
        'client ID conflict detected. Please restart the dev server.',
      )
    }
    this.clientToId.set(client, clientId)
    this.idToClient.set(clientId, client)
  }

  /** The new runtime behind `client` counts updates from the start again. */
  replace(client: NormalizedHotChannelClient, clientId: string): void {
    const previousClientId = this.clientToId.get(client)
    if (previousClientId) this.idToClient.delete(previousClientId)
    this.clientToId.set(client, clientId)
    this.idToClient.set(clientId, client)
    this.lastSeq.delete(client)
  }

  nextSeq(client: NormalizedHotChannelClient): number {
    const seq = (this.lastSeq.get(client) ?? 0) + 1
    this.lastSeq.set(client, seq)
    return seq
  }

  get(id: string): NormalizedHotChannelClient | undefined {
    return this.idToClient.get(id)
  }

  getId(client: NormalizedHotChannelClient): string | undefined {
    return this.clientToId.get(client)
  }

  getAll(): NormalizedHotChannelClient[] {
    return [...this.idToClient.values()]
  }

  delete(client: NormalizedHotChannelClient): string | undefined {
    const id = this.clientToId.get(client)
    if (id) {
      this.clientToId.delete(client)
      this.idToClient.delete(id)
      this.lastSeq.delete(client)
      return id
    }
  }
}

function debounce(time: number, cb: () => void) {
  let timer: ReturnType<typeof globalThis.setTimeout> | null
  return () => {
    if (timer) {
      globalThis.clearTimeout(timer)
      timer = null
    }
    timer = globalThis.setTimeout(cb, time)
  }
}

/**
 * The answer to a client that the dev engine cannot serve. It is served with
 * status 200: a failed import would only reject the `import()` that made the
 * request, and the page would not reload.
 */
function reloadNeededPayload(reason: string): BundledDevPayload {
  debug?.(`RELOAD-NEEDED: ${reason}`)
  return {
    code: `__rolldown_runtime__.reloadNeeded(${JSON.stringify(reason)});\nexport {}`,
    map: undefined,
  }
}

function isEmptyInput(input: RolldownOptions['input']): boolean {
  if (Array.isArray(input)) return input.length === 0
  if (typeof input === 'object' && input != null) {
    return Object.keys(input).length === 0
  }
  return false
}
