import { randomUUID } from 'node:crypto'
import { setTimeout } from 'node:timers/promises'
import {
  type BindingClientHmrUpdate,
  type DevEngine,
  dev,
} from 'rolldown/experimental'
import colors from 'picocolors'
import getEtag from 'etag'
import type { OutputOptions, RolldownOptions } from 'rolldown'
import type { Update } from '#types/hmrPayload'
import { ChunkMetadataMap, resolveRolldownOptions } from '../../build'
import { getHmrImplementation } from '../../plugins/clientInjections'
import { DevEnvironment, type DevEnvironmentContext } from '../environment'
import type { ResolvedConfig } from '../../config'
import type { ViteDevServer } from '../../server'
import { createDebugger } from '../../utils'
import { type NormalizedHotChannelClient, getShortName } from '../hmr'
import { prepareError } from '../middlewares/error'

const debug = createDebugger('vite:full-bundle-mode')

type HmrOutput = BindingClientHmrUpdate['update']

type MemoryFile = {
  source: string | Uint8Array
  etag?: string
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

export class FullBundleDevEnvironment extends DevEnvironment {
  private devEngine!: DevEngine
  private clients = new Clients()
  private invalidateCalledModules = new Map<
    NormalizedHotChannelClient,
    Set<string>
  >()
  private debouncedFullReload = debounce(20, () => {
    this.hot.send({ type: 'full-reload', path: '*' })
    this.logger.info(colors.green(`page reload`), { timestamp: true })
  })

  memoryFiles: MemoryFiles = new MemoryFiles()
  facadeToChunk: Map<string, string> = new Map()

  // private buildFinishPromise = promiseWithResolvers<void>()

  constructor(
    name: string,
    config: ResolvedConfig,
    context: DevEnvironmentContext,
  ) {
    // if (name !== 'client') {
    //   throw new Error(
    //     'currently full bundle mode is only available for client environment',
    //   )
    // }

    super(name, config, { ...context, disableDepsOptimizer: true })
  }

  override async listen(_server: ViteDevServer): Promise<void> {
    this.hot.listen()

    debug?.('INITIAL: setup bundle options')
    const rollupOptions = await this.getRolldownOptions()
    // NOTE: only single outputOptions is supported here
    if (
      Array.isArray(rollupOptions.output) &&
      rollupOptions.output.length > 1
    ) {
      throw new Error('multiple output options are not supported in dev mode')
    }
    const outputOptions = (
      Array.isArray(rollupOptions.output)
        ? rollupOptions.output[0]
        : rollupOptions.output
    )!

    this.hot.on('vite:module-loaded', (payload, client) => {
      const clientId = this.clients.setupIfNeeded(client)
      this.devEngine.registerModules(clientId, payload.modules)
    })
    this.hot.on('vite:client:disconnect', (_payload, client) => {
      const clientId = this.clients.delete(client)
      if (clientId) {
        this.devEngine.removeClient(clientId)
      }
    })

    this.devEngine = await dev(rollupOptions, outputOptions, {
      onHmrUpdates: (result) => {
        if (result instanceof Error) {
          // TODO: send to the specific client
          for (const client of this.clients.getAll()) {
            client.send({
              type: 'error',
              err: prepareError(result),
            })
          }
          return
        }
        const { updates, changedFiles } = result
        if (changedFiles.length === 0) {
          return
        }
        if (updates.every((update) => update.update.type === 'Noop')) {
          debug?.(`ignored file change for ${changedFiles.join(', ')}`)
          return
        }
        for (const { clientId, update } of updates) {
          const client = this.clients.get(clientId)
          if (client) {
            this.invalidateCalledModules.get(client)?.clear()
            this.handleHmrOutput(client, changedFiles, update)
          }
        }
      },
      onOutput: (result) => {
        if (result instanceof Error) {
          this.logger.error(colors.red(`✘ Build error: ${result.message}`), {
            error: result,
          })
          this.hot.send({
            type: 'error',
            err: prepareError(result),
          })
          return
        }

        // NOTE: don't clear memoryFiles here as incremental build re-uses the files
        for (const outputFile of result.output) {
          if (outputFile.type === 'chunk' && outputFile.facadeModuleId) {
            this.facadeToChunk.set(
              outputFile.facadeModuleId,
              outputFile.fileName,
            )
          }
          this.memoryFiles.set(outputFile.fileName, () => {
            const source =
              outputFile.type === 'chunk' ? outputFile.code : outputFile.source
            return {
              source,
              etag: getEtag(Buffer.from(source), { weak: true }),
            }
          })
        }
      },
      watch: {
        skipWrite: true,
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
    this._waitForInitialBuildFinish().then(() => {
      debug?.('INITIAL: build done')
      this.hot.send({ type: 'full-reload', path: '*' })
    })
  }

  /**
   * @internal
   */
  public async _waitForInitialBuildFinish(): Promise<void> {
    // TODO: need a better way to handle errors from the outside
    // maybe `await buildFinishPromise.promise`
    await this.devEngine.ensureCurrentBuildFinish()
    while (this.memoryFiles.size === 0) {
      await setTimeout(10)
      await this.devEngine.ensureCurrentBuildFinish()
    }
  }

  override async warmupRequest(_url: string): Promise<void> {
    // no-op
  }

  protected override invalidateModule(
    m: {
      path: string
      message?: string
      firstInvalidatedBy: string
    },
    client: NormalizedHotChannelClient,
  ): void {
    ;(async () => {
      const invalidateCalledModules = this.invalidateCalledModules.get(client)
      if (invalidateCalledModules?.has(m.path)) {
        debug?.(
          `INVALIDATE: invalidate received from ${m.path}, but ignored because it was already invalidated`,
        )
        return
      }

      debug?.(
        `INVALIDATE: invalidate received from ${m.path}, re-triggering HMR`,
      )
      if (!invalidateCalledModules) {
        this.invalidateCalledModules.set(client, new Set([]))
      }
      this.invalidateCalledModules.get(client)!.add(m.path)

      let update: BindingClientHmrUpdate['update'] | undefined
      try {
        const _update = await this.devEngine.invalidate(
          m.path,
          m.firstInvalidatedBy,
        )
        update = _update.find(
          (u) => this.clients.get(u.clientId) === client,
        )?.update
      } catch (e) {
        client.send({
          type: 'error',
          err: prepareError(e as Error),
        })
        return
      }
      if (!update) return

      if (update.type === 'Patch') {
        this.logger.info(
          colors.yellow(`hmr invalidate `) +
            colors.dim(m.path) +
            (m.message ? ` ${m.message}` : ''),
          { timestamp: true },
        )
      }

      this.handleHmrOutput(client, [m.path], update, {
        firstInvalidatedBy: m.firstInvalidatedBy,
      })
    })()
  }

  async triggerBundleRegenerationIfStale(): Promise<boolean> {
    const bundleState = await this.devEngine.getBundleState()
    const shouldTrigger =
      bundleState.hasStaleOutput && !bundleState.lastFullBuildFailed
    if (shouldTrigger) {
      this.devEngine.ensureLatestBuildOutput().then(() => {
        this.debouncedFullReload()
      })
      debug?.(`TRIGGER: access to stale bundle, triggered bundle re-generation`)
    }
    return shouldTrigger
  }

  override async close(): Promise<void> {
    this.memoryFiles.clear()
    await Promise.all([super.close(), this.devEngine.close()])
  }

  protected async getDevRuntimeImplementation(): Promise<string> {
    return await getHmrImplementation(this.getTopLevelConfig())
  }

  protected async getRolldownOptions(): Promise<RolldownOptions> {
    const chunkMetadataMap = new ChunkMetadataMap()
    const rolldownOptions = resolveRolldownOptions(this, chunkMetadataMap)
    rolldownOptions.experimental ??= {}
    rolldownOptions.experimental.devMode = {
      implement: await this.getDevRuntimeImplementation(),
    }

    if (rolldownOptions.optimization) {
      // disable inlineConst optimization due to a bug in Rolldown
      rolldownOptions.optimization.inlineConst = false
    }

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

  private handleHmrOutput(
    client: NormalizedHotChannelClient,
    files: string[],
    hmrOutput: HmrOutput,
    invalidateInformation?: { firstInvalidatedBy: string },
  ) {
    if (hmrOutput.type === 'Noop') return

    const shortFile = files
      .map((file) => getShortName(file, this.config.root))
      .join(', ')
    if (hmrOutput.type === 'FullReload') {
      const reason = hmrOutput.reason
        ? colors.dim(` (${hmrOutput.reason})`)
        : ''
      this.logger.info(
        colors.green(`trigger page reload `) + colors.dim(shortFile) + reason,
        { clear: !invalidateInformation, timestamp: true },
      )
      this.devEngine.ensureLatestBuildOutput().then(() => {
        this.debouncedFullReload()
      })
      return
    }

    debug?.(`handle hmr output for ${shortFile}`, {
      ...hmrOutput,
      code: typeof hmrOutput.code === 'string' ? '[code]' : hmrOutput.code,
    })

    this.memoryFiles.set(hmrOutput.filename, { source: hmrOutput.code })
    if (hmrOutput.sourcemapFilename && hmrOutput.sourcemap) {
      this.memoryFiles.set(hmrOutput.sourcemapFilename, {
        source: hmrOutput.sourcemap,
      })
    }
    const updates: Update[] = hmrOutput.hmrBoundaries.map((boundary: any) => {
      return {
        type: 'js-update',
        url: hmrOutput.filename,
        path: boundary.boundary,
        acceptedPath: boundary.acceptedVia,
        firstInvalidatedBy: invalidateInformation?.firstInvalidatedBy,
        timestamp: Date.now(),
      }
    })
    client.send({
      type: 'update',
      updates,
    })
    this.logger.info(
      colors.green(`hmr update `) +
        colors.dim([...new Set(updates.map((u) => u.path))].join(', ')),
      { clear: !invalidateInformation, timestamp: true },
    )
  }
}

class Clients {
  private clientToId = new Map<NormalizedHotChannelClient, string>()
  private idToClient = new Map<string, NormalizedHotChannelClient>()

  setupIfNeeded(client: NormalizedHotChannelClient): string {
    const id = this.clientToId.get(client)
    if (id) return id

    const newId = randomUUID()
    this.clientToId.set(client, newId)
    this.idToClient.set(newId, client)
    return newId
  }

  get(id: string): NormalizedHotChannelClient | undefined {
    return this.idToClient.get(id)
  }

  getAll(): NormalizedHotChannelClient[] {
    return Array.from(this.idToClient.values())
  }

  delete(client: NormalizedHotChannelClient): string | undefined {
    const id = this.clientToId.get(client)
    if (id) {
      this.clientToId.delete(client)
      this.idToClient.delete(id)
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
