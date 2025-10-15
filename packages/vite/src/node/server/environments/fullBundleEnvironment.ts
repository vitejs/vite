import { randomUUID } from 'node:crypto'
import {
  type BindingClientHmrUpdate,
  type DevEngine,
  dev,
} from 'rolldown/experimental'
import type { Update } from 'types/hmrPayload'
import colors from 'picocolors'
import getEtag from 'etag'
import { ChunkMetadataMap, resolveRolldownOptions } from '../../build'
import { getHmrImplementation } from '../../plugins/clientInjections'
import { DevEnvironment, type DevEnvironmentContext } from '../environment'
import type { ResolvedConfig } from '../../config'
import type { ViteDevServer } from '../../server'
import { createDebugger } from '../../utils'
import { getShortName } from '../hmr'
import type { WebSocketClient } from '../ws'

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
    /* clientId */ string,
    Set<string>
  >()
  private debouncedFullReload = debounce(20, () => {
    this.hot.send({ type: 'full-reload', path: '*' })
    this.logger.info(colors.green(`page reload`), { timestamp: true })
  })

  memoryFiles = new MemoryFiles()

  constructor(
    name: string,
    config: ResolvedConfig,
    context: DevEnvironmentContext,
  ) {
    if (name !== 'client') {
      throw new Error(
        'currently full bundle mode is only available for client environment',
      )
    }

    super(name, config, { ...context, disableDepsOptimizer: true })
  }

  override async listen(server: ViteDevServer): Promise<void> {
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

    // TODO: use hot API
    server.ws.on(
      'vite:module-loaded',
      (payload: { modules: string[] }, client: WebSocketClient) => {
        const clientId = this.clients.setupIfNeeded(client, () => {
          this.devEngine.removeClient(clientId)
        })
        this.devEngine.registerModules(clientId, payload.modules)
      },
    )
    server.ws.on('vite:invalidate', (payload, client: WebSocketClient) => {
      this.handleInvalidateModule(client, payload)
    })

    this.devEngine = await dev(rollupOptions, outputOptions, {
      onHmrUpdates: (result) => {
        if (result instanceof Error) {
          // TODO: handle error
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
          this.invalidateCalledModules.get(clientId)?.clear()
          const client = this.clients.get(clientId)!
          this.handleHmrOutput(client, changedFiles, update)
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
    this.waitForInitialBuildFinish().then(() => {
      debug?.('INITIAL: build done')
      this.hot.send({ type: 'full-reload', path: '*' })
    })
  }

  private async waitForInitialBuildFinish(): Promise<void> {
    await this.devEngine.ensureCurrentBuildFinish()
    while (this.memoryFiles.size === 0) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      await this.devEngine.ensureCurrentBuildFinish()
    }
  }

  override async warmupRequest(_url: string): Promise<void> {
    // no-op
  }

  protected override invalidateModule(_m: unknown): void {
    // no-op, handled via `server.ws` instead
  }

  private handleInvalidateModule(
    client: WebSocketClient,
    m: {
      path: string
      message?: string
      firstInvalidatedBy: string
    },
  ): void {
    ;(async () => {
      const clientId = this.clients.getId(client)
      if (!clientId) return

      const invalidateCalledModules = this.invalidateCalledModules.get(clientId)
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
        this.invalidateCalledModules.set(clientId, new Set([]))
      }
      this.invalidateCalledModules.get(clientId)!.add(m.path)

      // TODO: how to handle errors?
      const _update = await this.devEngine.invalidate(
        m.path,
        m.firstInvalidatedBy,
      )
      const update = _update.find((u) => u.clientId === clientId)?.update
      if (!update) return

      if (update.type === 'Patch') {
        this.logger.info(
          colors.yellow(`hmr invalidate `) +
            colors.dim(m.path) +
            (m.message ? ` ${m.message}` : ''),
          { timestamp: true },
        )
      }

      // TODO: need to check if this is enough
      this.handleHmrOutput(client, [m.path], update, {
        firstInvalidatedBy: m.firstInvalidatedBy,
      })
    })()
  }

  async triggerBundleRegenerationIfStale(): Promise<boolean> {
    const hasLatestBuildOutput = await this.devEngine.hasLatestBuildOutput()
    if (!hasLatestBuildOutput) {
      this.devEngine.ensureLatestBuildOutput().then(() => {
        this.debouncedFullReload()
      })
      debug?.(`TRIGGER: access to stale bundle, triggered bundle re-generation`)
    }
    return !hasLatestBuildOutput
  }

  override async close(): Promise<void> {
    await Promise.all([
      super.close(),
      (async () => {
        this.memoryFiles.clear()
        // TODO: do we need close?
      })(),
    ])
  }

  private async getRolldownOptions() {
    const chunkMetadataMap = new ChunkMetadataMap()
    const rolldownOptions = resolveRolldownOptions(this, chunkMetadataMap)
    rolldownOptions.experimental ??= {}
    rolldownOptions.experimental.hmr = {
      implement: await getHmrImplementation(this.getTopLevelConfig()),
    }

    rolldownOptions.plugins = [
      rolldownOptions.plugins,
      {
        name: 'vite:full-bundle-mode:save-output',
        generateBundle: {
          order: 'post',
          handler: (_, bundle) => {
            // NOTE: don't clear memoryFiles here as incremental build re-uses the files
            for (const outputFile of Object.values(bundle)) {
              this.memoryFiles.set(outputFile.fileName, () => {
                const source =
                  outputFile.type === 'chunk'
                    ? outputFile.code
                    : outputFile.source
                return {
                  source,
                  etag: getEtag(Buffer.from(source), { weak: true }),
                }
              })
            }
          },
        },
      },
    ]

    // set filenames to make output paths predictable so that `renderChunk` hook does not need to be used
    if (Array.isArray(rolldownOptions.output)) {
      for (const output of rolldownOptions.output) {
        output.entryFileNames = 'assets/[name].js'
        output.chunkFileNames = 'assets/[name]-[hash].js'
        output.assetFileNames = 'assets/[name]-[hash][extname]'
        output.minify = false
        output.sourcemap = true
        // output.advancedChunks ||= {}
        // output.advancedChunks.groups = [
        //   { name: 'chunk', maxSize: 1024 * 1024 },
        // ]
      }
    } else {
      rolldownOptions.output ??= {}
      rolldownOptions.output.entryFileNames = 'assets/[name].js'
      rolldownOptions.output.chunkFileNames = 'assets/[name]-[hash].js'
      rolldownOptions.output.assetFileNames = 'assets/[name]-[hash][extname]'
      rolldownOptions.output.minify = false
      rolldownOptions.output.sourcemap = true
      // rolldownOptions.output.advancedChunks ||= {}
      // rolldownOptions.output.advancedChunks.groups = [
      //   { name: 'chunk', maxSize: 1024 * 1024 },
      // ]
    }
    // rolldownOptions.experimental.strictExecutionOrder = true

    return rolldownOptions
  }

  private handleHmrOutput(
    client: WebSocketClient,
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
      this.devEngine.ensureCurrentBuildFinish().then(() => {
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
  private clientToId = new Map<WebSocketClient, string>()
  private idToClient = new Map<string, WebSocketClient>()

  setupIfNeeded(client: WebSocketClient, onClose?: () => void): string {
    const id = this.clientToId.get(client)
    if (id) return id

    const newId = randomUUID()
    this.clientToId.set(client, newId)
    this.idToClient.set(newId, client)
    client.socket.once('close', () => {
      this.clientToId.delete(client)
      this.idToClient.delete(newId)
      onClose?.()
    })
    return newId
  }

  get(id: string): WebSocketClient | undefined {
    return this.idToClient.get(id)
  }

  getId(client: WebSocketClient): string | undefined {
    return this.clientToId.get(client)
  }

  delete(client: WebSocketClient): void {
    const id = this.clientToId.get(client)
    if (id) {
      this.clientToId.delete(client)
      this.idToClient.delete(id)
    }
  }
}

function debounce(time: number, cb: () => void) {
  let timer: ReturnType<typeof setTimeout> | null
  return () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    timer = setTimeout(cb, time)
  }
}
