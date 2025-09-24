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
        if (files.length === 0) {
          return
        }
        // TODO: how to handle errors?
        if (updates.every((update) => update.type === 'Noop')) {
          debug?.(`ignored file change for ${files.join(', ')}`)
          return
        }
        this.invalidateCalledModules.clear()
        for (const update of updates) {
          this.handleHmrOutput(files, update)
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
      () => {
        debug?.('INITIAL: run error')
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

  protected override invalidateModule(m: {
    path: string
    message?: string
    firstInvalidatedBy: string
  }): void {
    ;(async () => {
      if (this.invalidateCalledModules.has(m.path)) {
        debug?.(
          `INVALIDATE: invalidate received from ${m.path}, but ignored because it was already invalidated`,
        )
        return
      }

      debug?.(
        `INVALIDATE: invalidate received from ${m.path}, re-triggering HMR`,
      )
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
      this.handleHmrOutput([m.path], update, {
        firstInvalidatedBy: m.firstInvalidatedBy,
        reason: m.message,
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
      new: true,
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
              this.memoryFiles.set(outputFile.fileName, () =>
                outputFile.type === 'chunk'
                  ? outputFile.code
                  : outputFile.source,
              )
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
      }
    } else {
      rolldownOptions.output ??= {}
      rolldownOptions.output.entryFileNames = 'assets/[name].js'
      rolldownOptions.output.chunkFileNames = 'assets/[name]-[hash].js'
      rolldownOptions.output.assetFileNames = 'assets/[name]-[hash][extname]'
      rolldownOptions.output.minify = false
      rolldownOptions.output.sourcemap = true
    }

    return rolldownOptions
  }

  private handleHmrOutput(
    files: string[],
    hmrOutput: HmrOutput,
    invalidateInformation?: { firstInvalidatedBy: string; reason?: string },
  ) {
    if (hmrOutput.type === 'Noop') return

    const shortFile = files
      .map((file) => getShortName(file, this.config.root))
      .join(', ')
    if (hmrOutput.type === 'FullReload') {
      const reason =
        (hmrOutput.reason ? colors.dim(` (${hmrOutput.reason})`) : '') +
        (invalidateInformation?.reason
          ? colors.dim(` (${invalidateInformation.reason})`)
          : '')
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
        firstInvalidatedBy: invalidateInformation?.firstInvalidatedBy,
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
      { clear: !invalidateInformation, timestamp: true },
    )
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
