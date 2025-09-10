import type { RolldownBuild } from 'rolldown'
import { type DevEngine, dev } from 'rolldown/experimental'
import type { Update } from 'types/hmrPayload'
import colors from 'picocolors'
import { ChunkMetadataMap, resolveRolldownOptions } from '../../build'
import { getHmrImplementation } from '../../plugins/clientInjections'
import { DevEnvironment, type DevEnvironmentContext } from '../environment'
import type { ResolvedConfig } from '../../config'
import type { ViteDevServer } from '../../server'
import { createDebugger } from '../../utils'
import { getShortName } from '../hmr'

const debug = createDebugger('vite:full-bundle-mode')

type HmrOutput = Exclude<
  Awaited<ReturnType<RolldownBuild['hmrInvalidate']>>,
  undefined
>

export class MemoryFiles {
  private files = new Map<
    string,
    string | Uint8Array | (() => string | Uint8Array)
  >()

  get size(): number {
    return this.files.size
  }

  get(file: string): string | Uint8Array | undefined {
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

  set(
    file: string,
    content: string | Uint8Array | (() => string | Uint8Array),
  ): void {
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
  private invalidateCalledModules = new Set<string>()

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

    this.devEngine = await dev(rollupOptions, outputOptions, {
      onHmrUpdates: (updates, files) => {
        this.invalidateCalledModules.clear()
        // TODO: how to handle errors?
        if (updates.every((update) => update.type === 'Noop')) {
          debug?.(`ignored file change for ${files.join(', ')}`)
          return
        }
        for (const update of updates) {
          this.handleHmrOutput(files, update)
        }
      },
    })
    debug?.('INITIAL: setup dev engine')
    this.devEngine.run().then(
      () => {
        debug?.('INITIAL: run done')
      },
      () => {
        debug?.('INITIAL: run error')
      },
    )
    this.devEngine.ensureCurrentBuildFinish().then(() => {
      debug?.('INITIAL: build done')
      this.hot.send({ type: 'full-reload', path: '*' })
    })
  }

  override async warmupRequest(_url: string): Promise<void> {
    // no-op
  }

  protected override invalidateModule(m: {
    path: string
    message?: string
    firstInvalidatedBy: string
  }): void {
    ;(async () => {
      if (this.invalidateCalledModules.has(m.path)) {
        debug?.(
          'INVALIDATE: invalidate received, but ignored because it was already invalidated',
        )
        return
      }

      debug?.('INVALIDATE: invalidate received, re-triggering HMR')
      this.invalidateCalledModules.add(m.path)

      // TODO: how to handle errors?
      const update = await this.devEngine.invalidate(
        m.path,
        m.firstInvalidatedBy,
      )

      if (update.type === 'Patch') {
        this.logger.info(
          colors.yellow(`hmr invalidate `) +
            colors.dim(m.path) +
            (m.message ? ` ${m.message}` : ''),
          { timestamp: true },
        )
      }

      // TODO: need to check if this is enough
      this.handleHmrOutput([m.path], update, m.firstInvalidatedBy)
    })()
  }

  async triggerBundleRegenerationIfStale(): Promise<boolean> {
    const scheduled = await this.devEngine.scheduleBuildIfStale()
    if (scheduled === 'scheduled') {
      this.devEngine.ensureCurrentBuildFinish().then(() => {
        this.hot.send({ type: 'full-reload', path: '*' })
        this.logger.info(colors.green(`page reload`), { timestamp: true })
      })
      debug?.(`TRIGGER: access to stale bundle, triggered bundle re-generation`)
    }
    return !!scheduled
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
      new: true,
      implement: await getHmrImplementation(this.getTopLevelConfig()),
    }

    rolldownOptions.plugins = [
      rolldownOptions.plugins,
      {
        name: 'vite:full-bundle-mode:save-output',
        generateBundle: (_, bundle) => {
          // NOTE: don't clear memoryFiles here as incremental build re-uses the files
          for (const outputFile of Object.values(bundle)) {
            this.memoryFiles.set(outputFile.fileName, () =>
              outputFile.type === 'chunk' ? outputFile.code : outputFile.source,
            )
          }
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
      }
    } else {
      rolldownOptions.output ??= {}
      rolldownOptions.output.entryFileNames = 'assets/[name].js'
      rolldownOptions.output.chunkFileNames = 'assets/[name]-[hash].js'
      rolldownOptions.output.assetFileNames = 'assets/[name]-[hash][extname]'
      rolldownOptions.output.minify = false
    }

    return rolldownOptions
  }

  private handleHmrOutput(
    files: string[],
    hmrOutput: HmrOutput,
    firstInvalidatedBy?: string,
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
        { clear: !firstInvalidatedBy, timestamp: true },
      )
      this.devEngine.ensureLatestBuild().then(() => {
        this.hot.send({ type: 'full-reload', path: '*' })
        this.logger.info(colors.green(`page reload`), { timestamp: true })
      })
      return
    }

    debug?.(`handle hmr output for ${shortFile}`, {
      ...hmrOutput,
      code: typeof hmrOutput.code === 'string' ? '[code]' : hmrOutput.code,
    })

    this.memoryFiles.set(hmrOutput.filename, hmrOutput.code)
    if (hmrOutput.sourcemapFilename && hmrOutput.sourcemap) {
      this.memoryFiles.set(hmrOutput.sourcemapFilename, hmrOutput.sourcemap)
    }
    const updates: Update[] = hmrOutput.hmrBoundaries.map((boundary: any) => {
      return {
        type: 'js-update',
        url: hmrOutput.filename,
        path: boundary.boundary,
        acceptedPath: boundary.acceptedVia,
        firstInvalidatedBy,
        timestamp: Date.now(),
      }
    })
    this.hot.send({
      type: 'update',
      updates,
    })
    this.logger.info(
      colors.green(`hmr update `) +
        colors.dim([...new Set(updates.map((u) => u.path))].join(', ')),
      { clear: !firstInvalidatedBy, timestamp: true },
    )
  }
}
