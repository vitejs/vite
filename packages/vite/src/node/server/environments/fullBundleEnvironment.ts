import type { RolldownBuild, RolldownOptions } from 'rolldown'
import type { Update } from 'types/hmrPayload'
import colors from 'picocolors'
import {
  ChunkMetadataMap,
  clearLine,
  enhanceRollupError,
  resolveRolldownOptions,
} from '../../build'
import { getHmrImplementation } from '../../plugins/clientInjections'
import { DevEnvironment, type DevEnvironmentContext } from '../environment'
import type { ResolvedConfig } from '../../config'
import type { ViteDevServer } from '../../server'
import { arraify, createDebugger } from '../../utils'
import { prepareError } from '../middlewares/error'

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
  private state: BundleState = { type: 'initial' }
  private invalidateCalledModules = new Set<string>()

  watchFiles = new Set<string>()
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
    const { rolldown } = await import('rolldown')
    const bundle = await rolldown(rollupOptions)
    debug?.('INITIAL: bundle created')

    debug?.('BUNDLING: trigger initial bundle')
    this.triggerGenerateBundle({ options: rollupOptions, bundle })
  }

  async onFileChange(
    _type: 'create' | 'update' | 'delete',
    file: string,
  ): Promise<void> {
    if (this.state.type === 'initial') {
      return
    }

    if (this.state.type === 'bundling') {
      // FIXME: we should retrigger only when we know that file is watched.
      //        but for the initial bundle we don't know that and need to trigger after the initial bundle
      debug?.(
        `BUNDLING: file update detected ${file}, retriggering bundle generation`,
      )
      this.triggerGenerateBundle(this.state)
      return
    }
    if (this.state.type === 'bundle-error') {
      const files = await this.state.bundle.watchFiles
      if (files.includes(file)) {
        debug?.(
          `BUNDLE-ERROR: file update detected ${file}, retriggering bundle generation`,
        )
        this.triggerGenerateBundle(this.state)
      } else {
        debug?.(
          `BUNDLE-ERROR: file update detected ${file}, but ignored as it is not a dependency`,
        )
      }
      return
    }

    if (
      this.state.type === 'bundled' ||
      this.state.type === 'generating-hmr-patch'
    ) {
      if (this.state.type === 'bundled') {
        debug?.(`BUNDLED: file update detected ${file}, generating HMR patch`)
      } else if (this.state.type === 'generating-hmr-patch') {
        debug?.(
          `GENERATING-HMR-PATCH: file update detected ${file}, regenerating HMR patch`,
        )
      }

      this.state = {
        type: 'generating-hmr-patch',
        options: this.state.options,
        bundle: this.state.bundle,
        patched: this.state.patched,
      }

      const startTime = Date.now()
      let hmrOutput: HmrOutput[]
      try {
        // NOTE: only single outputOptions is supported here
        hmrOutput = await this.state.bundle.generateHmrPatch([file])
      } catch (e) {
        // TODO: support multiple errors
        this.hot.send({ type: 'error', err: prepareError(e.errors[0]) })

        this.state = {
          type: 'bundled',
          options: this.state.options,
          bundle: this.state.bundle,
          patched: this.state.patched,
        }
        return
      } finally {
        this.invalidateCalledModules.clear()
      }

      if (hmrOutput.every((output) => output.type === 'Noop')) {
        debug?.(`ignored file change for ${file}`)
        return
      }
      const generateTime = Date.now()
      debug?.(
        `GENERATING-HMR-PATCH: patch generated in ${generateTime - startTime}ms`,
      )

      for (const output of hmrOutput) {
        this.handleHmrOutput(file, output, this.state)
      }
      return
    }
    this.state satisfies never // exhaustive check
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
          `${this.state.type.toUpperCase()}: invalidate received, but ignored because it was already invalidated`,
        )
        return
      }

      if (
        this.state.type === 'initial' ||
        this.state.type === 'bundling' ||
        this.state.type === 'bundle-error'
      ) {
        debug?.(
          `${this.state.type.toUpperCase()}: invalidate received, but ignored because the state type has changed`,
        )
        return
      }
      this.state.type satisfies 'bundled' | 'generating-hmr-patch' // exhaustive check

      debug?.(
        `${this.state.type.toUpperCase()}: invalidate received, re-triggering HMR`,
      )

      // TODO: should this be a separate state?
      this.state = {
        type: 'generating-hmr-patch',
        options: this.state.options,
        bundle: this.state.bundle,
        patched: this.state.patched,
      }
      this.invalidateCalledModules.add(m.path)

      let hmrOutput: HmrOutput
      try {
        // NOTE: only single outputOptions is supported here
        hmrOutput = await this.state.bundle.hmrInvalidate(
          m.path,
          m.firstInvalidatedBy,
        )
      } catch (e) {
        // TODO: support multiple errors
        this.hot.send({ type: 'error', err: prepareError(e.errors[0]) })

        this.state = {
          type: 'bundled',
          options: this.state.options,
          bundle: this.state.bundle,
          patched: this.state.patched,
        }
        return
      }

      if (hmrOutput.type === 'Patch') {
        this.logger.info(
          colors.yellow(`hmr invalidate `) +
            colors.dim(m.path) +
            (m.message ? ` ${m.message}` : ''),
          { timestamp: true },
        )
      }

      // TODO: need to check if this is enough
      this.handleHmrOutput(m.path, hmrOutput, this.state, m.firstInvalidatedBy)
    })()
  }

  triggerBundleRegenerationIfStale(): boolean {
    if (
      (this.state.type === 'bundled' ||
        this.state.type === 'generating-hmr-patch') &&
      this.state.patched
    ) {
      this.triggerGenerateBundle(this.state)
      debug?.(
        `${this.state.type.toUpperCase()}: access to stale bundle, triggered bundle re-generation`,
      )
      return true
    }
    return false
  }

  override async close(): Promise<void> {
    await Promise.all([
      super.close(),
      (async () => {
        if (this.state.type === 'initial') {
          return
        }
        if (this.state.type === 'bundling') {
          this.state.abortController.abort()
        }
        const bundle = this.state.bundle
        this.state = { type: 'initial' }

        this.watchFiles.clear()
        this.memoryFiles.clear()
        await bundle.close()
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

    // set filenames to make output paths predictable so that `renderChunk` hook does not need to be used
    if (Array.isArray(rolldownOptions.output)) {
      for (const output of rolldownOptions.output) {
        output.entryFileNames = 'assets/[name].js'
        output.chunkFileNames = 'assets/[name]-[hash].js'
        output.assetFileNames = 'assets/[name]-[hash][extname]'
      }
    } else {
      rolldownOptions.output ??= {}
      rolldownOptions.output.entryFileNames = 'assets/[name].js'
      rolldownOptions.output.chunkFileNames = 'assets/[name]-[hash].js'
      rolldownOptions.output.assetFileNames = 'assets/[name]-[hash][extname]'
    }

    return rolldownOptions
  }

  private triggerGenerateBundle({
    options,
    bundle,
  }: BundleStateCommonProperties) {
    if (this.state.type === 'bundling') {
      this.state.abortController.abort()
    }

    const controller = new AbortController()
    const promise = this.generateBundle(
      options.output,
      bundle,
      controller.signal,
    )
    this.state = {
      type: 'bundling',
      options,
      bundle,
      promise,
      abortController: controller,
    }
  }

  private async generateBundle(
    outOpts: RolldownOptions['output'],
    bundle: RolldownBuild,
    signal: AbortSignal,
  ) {
    try {
      const startTime = Date.now()
      const newMemoryFiles = new Map<string, () => string | Uint8Array>()
      for (const outputOpts of arraify(outOpts)) {
        const output = await bundle.generate(outputOpts)
        if (signal.aborted) return

        for (const outputFile of output.output) {
          newMemoryFiles.set(outputFile.fileName, () =>
            outputFile.type === 'chunk' ? outputFile.code : outputFile.source,
          )
        }
      }
      const generateTime = Date.now()

      this.memoryFiles.clear()
      for (const [file, code] of newMemoryFiles) {
        this.memoryFiles.set(file, code)
      }

      // TODO: should this be done for hmr patch file generation?
      for (const file of await bundle.watchFiles) {
        this.watchFiles.add(file)
      }
      if (signal.aborted) return
      const postGenerateTime = Date.now()

      if (this.state.type === 'initial') throw new Error('unreachable')
      this.state = {
        type: 'bundled',
        bundle: this.state.bundle,
        options: this.state.options,
        patched: false,
      }
      debug?.(
        `BUNDLED: bundle generated in ${generateTime - startTime}ms + ${postGenerateTime - generateTime}ms`,
      )

      this.hot.send({ type: 'full-reload' })
      this.logger.info(colors.green(`page reload`), { timestamp: true })
    } catch (e) {
      enhanceRollupError(e)
      clearLine()
      this.logger.error(`${colors.red('✗')} Build failed` + e.stack)

      // TODO: support multiple errors
      this.hot.send({ type: 'error', err: prepareError(e.errors[0]) })

      if (this.state.type === 'initial') throw new Error('unreachable')
      this.state = {
        type: 'bundle-error',
        bundle: this.state.bundle,
        options: this.state.options,
      }
      debug?.('BUNDLED: bundle errored')
    }
  }

  private handleHmrOutput(
    file: string,
    hmrOutput: HmrOutput,
    { options, bundle }: BundleStateCommonProperties,
    firstInvalidatedBy?: string,
  ) {
    if (hmrOutput.type === 'Noop') return

    if (hmrOutput.type === 'FullReload') {
      this.triggerGenerateBundle({ options, bundle })

      const reason = hmrOutput.reason
        ? colors.dim(` (${hmrOutput.reason})`)
        : ''
      this.logger.info(
        colors.green(`trigger page reload `) + colors.dim(file) + reason,
        { clear: !firstInvalidatedBy, timestamp: true },
      )
      return
    }

    debug?.(`handle hmr output for ${file}`, {
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

    this.state = {
      type: 'bundled',
      options,
      bundle,
      patched: true,
    }
  }
}

// https://mermaid.live/edit#pako:eNqdUk1v4jAQ_SujuRSkFAUMJOSwalWuPXVPq0jIjYfEWmeMHKe0i_jvaxJoqcRuUX2x3se8mZFmh4VVhBmujd0WlXQefi5zhvAaH9Bg0H3DIdze_gDN2mtpev0IOuG5ZWU0l71yQkECcs66Dw-tOuLMd2QO3rU2BGEILumL1OudTVsU1DRnE6jz5upSWklMTvqQsKpqt9pIX1R90SXl0pbq__bTUIPADr9RxhY-V76v_q_S61bsM-7vdtBUckMZeHr1ERj5TCaDHLcVMRC_aGe5JvagGyiMbUhFoD1stTFQWvAWbo7XcZMj7HPGCGtytdQqnNru0CZHX1FNOR5ylXS_c8x5H3yy9fbpjQvMvGspQmfbssJsLU0TULtR0tNSy9LJ-p3dSP5lbX0qIaW9dY_9YXf3HWHpDr2PkcSK3INt2WM2XswnXQJmO3wNOJmOxCIdx0ksRDwX4zTCN8zS-SidTRbxNAlkIvYR_uk6xqNkFk9TMZ2JSSKSREz2fwERkhWq
type BundleState =
  | BundleStateInitial
  | BundleStateBundling
  | BundleStateBundled
  | BundleStateBundleError
  | BundleStateGeneratingHmrPatch
type BundleStateInitial = { type: 'initial' }
type BundleStateBundling = {
  type: 'bundling'
  promise: Promise<void>
  abortController: AbortController
} & BundleStateCommonProperties
type BundleStateBundled = {
  type: 'bundled'
  /**
   * Whether a hmr patch was generated.
   *
   * In other words, whether the bundle is stale.
   */
  patched: boolean
} & BundleStateCommonProperties
type BundleStateBundleError = {
  type: 'bundle-error'
} & BundleStateCommonProperties
type BundleStateGeneratingHmrPatch = {
  type: 'generating-hmr-patch'
  /**
   * Whether a hmr patch was generated.
   *
   * In other words, whether the bundle is stale.
   */
  patched: boolean
} & BundleStateCommonProperties

type BundleStateCommonProperties = {
  options: RolldownOptions
  bundle: RolldownBuild
}
