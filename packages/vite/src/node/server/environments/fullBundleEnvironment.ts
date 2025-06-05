import type { RolldownBuild, RolldownOptions } from 'rolldown'
import type { Update } from 'types/hmrPayload'
import colors from 'picocolors'
import type { ChunkMetadata } from 'types/metadata'
import {
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
  Awaited<ReturnType<RolldownBuild['generateHmrPatch']>>,
  undefined
>

export class FullBundleDevEnvironment extends DevEnvironment {
  private state: BundleState = { type: 'initial' }

  watchFiles = new Set<string>()
  memoryFiles = new Map<string, string | Uint8Array>()

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
    await super.listen(server)

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
    server: ViteDevServer,
  ): Promise<void> {
    if (this.state.type === 'initial') {
      return
    }

    if (this.state.type === 'bundling') {
      debug?.(
        `BUNDLING: file update detected ${file}, retriggering bundle generation`,
      )
      this.state.abortController.abort()
      this.triggerGenerateBundle(this.state)
      return
    }
    if (this.state.type === 'bundle-error') {
      debug?.(
        `BUNDLE-ERROR: file update detected ${file}, retriggering bundle generation`,
      )
      this.triggerGenerateBundle(this.state)
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
      }

      let hmrOutput: HmrOutput
      try {
        // NOTE: only single outputOptions is supported here
        hmrOutput = (await this.state.bundle.generateHmrPatch([file]))!
      } catch (e) {
        // TODO: support multiple errors
        server.ws.send({ type: 'error', err: prepareError(e.errors[0]) })

        this.state = {
          type: 'bundled',
          options: this.state.options,
          bundle: this.state.bundle,
        }
        return
      }

      debug?.(`handle hmr output for ${file}`, {
        ...hmrOutput,
        code: typeof hmrOutput.code === 'string' ? '[code]' : hmrOutput.code,
      })

      this.handleHmrOutput(file, hmrOutput, this.state)
      return
    }
    this.state satisfies never // exhaustive check
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
    const chunkMetadataMap = new Map<string, ChunkMetadata>()
    const rolldownOptions = resolveRolldownOptions(this, chunkMetadataMap)
    rolldownOptions.experimental ??= {}
    rolldownOptions.experimental.hmr = {
      implement: await getHmrImplementation(this.getTopLevelConfig()),
    }

    rolldownOptions.treeshake = false

    return rolldownOptions
  }

  private triggerGenerateBundle({
    options,
    bundle,
  }: BundleStateCommonProperties) {
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
      const newMemoryFiles = new Map<string, string | Uint8Array>()
      for (const outputOpts of arraify(outOpts)) {
        const output = await bundle.generate(outputOpts)
        if (signal.aborted) return

        for (const outputFile of output.output) {
          newMemoryFiles.set(
            outputFile.fileName,
            outputFile.type === 'chunk' ? outputFile.code : outputFile.source,
          )
        }
      }

      this.memoryFiles.clear()
      for (const [file, code] of newMemoryFiles) {
        this.memoryFiles.set(file, code)
      }

      // TODO: should this be done for hmr patch file generation?
      for (const file of await bundle.watchFiles) {
        this.watchFiles.add(file)
      }
      if (signal.aborted) return

      if (this.state.type === 'initial') throw new Error('unreachable')
      this.state = {
        type: 'bundled',
        bundle: this.state.bundle,
        options: this.state.options,
      }
      debug?.('BUNDLED: bundle generated')

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

  private async handleHmrOutput(
    file: string,
    hmrOutput: HmrOutput,
    { options, bundle }: BundleStateCommonProperties,
  ) {
    if (hmrOutput.fullReload) {
      this.triggerGenerateBundle({ options, bundle })

      const reason = hmrOutput.fullReloadReason
        ? colors.dim(` (${hmrOutput.fullReloadReason})`)
        : ''
      this.logger.info(
        colors.green(`trigger page reload `) + colors.dim(file) + reason,
        {
          // clear: !hmrOutput.firstInvalidatedBy,
          timestamp: true,
        },
      )
      return
    }

    if (hmrOutput.code) {
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
          firstInvalidatedBy: hmrOutput.firstInvalidatedBy,
          timestamp: 0,
        }
      })
      this.hot.send({
        type: 'update',
        updates,
      })
      this.logger.info(
        colors.green(`hmr update `) +
          colors.dim([...new Set(updates.map((u) => u.path))].join(', ')),
        { clear: !hmrOutput.firstInvalidatedBy, timestamp: true },
      )
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
type BundleStateBundled = { type: 'bundled' } & BundleStateCommonProperties
type BundleStateBundleError = {
  type: 'bundle-error'
} & BundleStateCommonProperties
type BundleStateGeneratingHmrPatch = {
  type: 'generating-hmr-patch'
} & BundleStateCommonProperties

type BundleStateCommonProperties = {
  options: RolldownOptions
  bundle: RolldownBuild
}
