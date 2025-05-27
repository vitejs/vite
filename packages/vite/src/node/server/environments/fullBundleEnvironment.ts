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

export class FullBundleDevEnvironment extends DevEnvironment {
  private rolldownOptions: RolldownOptions | undefined
  private bundle: RolldownBuild | undefined
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

    debug?.('setup bundle options')
    const rollupOptions = await this.getRolldownOptions()
    const { rolldown } = await import('rolldown')
    this.rolldownOptions = rollupOptions
    this.bundle = await rolldown(rollupOptions)
    debug?.('bundle created')

    this.triggerGenerateInitialBundle(rollupOptions.output)
  }

  async onFileChange(
    _type: 'create' | 'update' | 'delete',
    file: string,
    server: ViteDevServer,
  ): Promise<void> {
    // TODO: handle the case when the initial bundle is not generated yet

    debug?.(`file update detected ${file}, generating hmr patch`)
    // NOTE: only single outputOptions is supported here
    const hmrOutput = (await this.bundle!.generateHmrPatch([file]))!

    debug?.(`handle hmr output for ${file}`, {
      ...hmrOutput,
      code: typeof hmrOutput.code === 'string' ? '[code]' : hmrOutput.code,
    })
    if (hmrOutput.fullReload) {
      try {
        await this.generateBundle(this.rolldownOptions!.output)
      } catch (e) {
        // TODO: support multiple errors
        server.ws.send({ type: 'error', err: prepareError(e.errors[0]) })
        return
      }

      server.ws.send({ type: 'full-reload' })
      const reason = hmrOutput.fullReloadReason
        ? colors.dim(` (${hmrOutput.fullReloadReason})`)
        : ''
      this.logger.info(
        colors.green(`page reload `) + colors.dim(file) + reason,
        {
          clear: !hmrOutput.firstInvalidatedBy,
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
      server!.ws.send({
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

  override async close(): Promise<void> {
    await Promise.all([
      super.close(),
      this.bundle?.close().finally(() => {
        this.bundle = undefined
        this.watchFiles.clear()
        this.memoryFiles.clear()
      }),
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

  private async triggerGenerateInitialBundle(
    outOpts: RolldownOptions['output'],
  ) {
    this.generateBundle(outOpts).then(
      () => {
        debug?.('initial bundle generated')
      },
      (e) => {
        enhanceRollupError(e)
        clearLine()
        this.logger.error(`${colors.red('✗')} Build failed` + e.stack)
        // TODO: show error message on the browser
      },
    )
  }

  // TODO: should debounce this
  private async generateBundle(outOpts: RolldownOptions['output']) {
    for (const outputOpts of arraify(outOpts)) {
      const output = await this.bundle!.generate(outputOpts)
      for (const outputFile of output.output) {
        this.memoryFiles.set(
          outputFile.fileName,
          outputFile.type === 'chunk' ? outputFile.code : outputFile.source,
        )
      }
    }

    // TODO: should this be done for hmr patch file generation?
    for (const file of await this.bundle!.watchFiles) {
      this.watchFiles.add(file)
    }
  }
}
