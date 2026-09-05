import path from 'node:path'
import { type ImportSpecifier, init, parse } from 'es-module-lexer'
import MagicString from 'magic-string'
import colors from 'picocolors'
import type {
  OutputAsset,
  OutputChunk,
  PluginContext,
  RolldownOutput,
  RollupError,
} from 'rolldown'
import { viteWebWorkerPostPlugin as nativeWebWorkerPostPlugin } from 'rolldown/experimental'
import { cleanUrl, splitFileAndPostfix } from '../../shared/utils'
import {
  BuildEnvironment,
  ChunkMetadataMap,
  injectEnvironmentToHooks,
  onRollupLog,
} from '../build'
import type { ResolvedConfig } from '../config'
import { ENV_ENTRY, ENV_PUBLIC_PATH } from '../constants'
import type { Environment } from '../environment'
import type { Logger } from '../logger'
import type { Plugin } from '../plugin'
import {
  injectQuery,
  normalizePath,
  prettifyUrl,
  trailingSeparatorRE,
  urlRE,
} from '../utils'
import { fileToUrl, toOutputFilePathInJSForBundledDev } from './asset'

type WorkerBundle = {
  entryFilename: string
  entryCode: string
  referencedAssets: Set<string>
  moduleIds: Set<string>
  watchedFiles: string[]
  /**
   * referenceId of the entry emitted for each build via
   * `import.meta.ROLLDOWN_FILE_URL_<id>`. Keyed by `Environment` because
   * referenceIds are per-build and this bundle is shared across the main build
   * and nested worker sub-builds.
   */
  entryReferenceIds: WeakMap<Environment, /* referenceId */ string>
}

type WorkerBundleAsset = {
  fileName: string
  /** @deprecated */
  originalFileName: string | null
  originalFileNames: string[]
  source: string | Uint8Array
}

/** The input ID of a worker entry, which identifies its bundle. */
type WorkerBundleId = string

/** `undefined` identifies the main bundle. */
type BundleId = WorkerBundleId | undefined

class WorkerOutputCache {
  /**
   * worker bundle information for each input id
   * used to bundle the same worker file only once
   */
  private bundles = new Map</* inputId */ string, WorkerBundle>()
  /** list of assets emitted for the worker bundles */
  private assets = new Map<string, WorkerBundleAsset>()
  private invalidatedBundles = new Set</* inputId */ string>()
  /**
   * Worker references grouped by their containing bundle and module.
   * `referencingModuleId` is the module whose inclusion keeps the reference
   * live: the worker wrapper module for a `?worker` import, or the importing
   * module for a `new URL(..., import.meta.url)` worker reference.
   * `childBundleId` identifies the referenced worker bundle and is used as its
   * `BundleId` when traversing that bundle's references.
   */
  private bundleReferences = new Map<
    BundleId,
    Map<
      /* referencingModuleId */ string,
      Set</* childBundleId */ WorkerBundleId>
    >
  >()

  saveWorkerBundle(
    file: string,
    watchedFiles: string[],
    outputEntryFilename: string,
    outputEntryCode: string,
    outputAssets: WorkerBundleAsset[],
    moduleIds: Set<string>,
    logger: Logger,
  ): WorkerBundle {
    for (const asset of outputAssets) {
      this.saveAsset(asset, logger)
    }
    const bundle: WorkerBundle = {
      entryFilename: outputEntryFilename,
      entryCode: outputEntryCode,
      referencedAssets: new Set(outputAssets.map((asset) => asset.fileName)),
      moduleIds,
      watchedFiles,
      entryReferenceIds: new WeakMap(),
    }
    this.bundles.set(file, bundle)
    return bundle
  }

  saveAsset(asset: WorkerBundleAsset, logger: Logger) {
    const duplicateAsset = this.assets.get(asset.fileName)
    if (duplicateAsset) {
      if (!isSameContent(duplicateAsset.source, asset.source)) {
        logger.warn(
          `\n` +
            colors.yellow(
              `The emitted file ${JSON.stringify(asset.fileName)} overwrites a previously emitted file of the same name.`,
            ),
        )
      }
    }
    this.assets.set(asset.fileName, asset)
  }

  invalidateAffectedBundles(file: string) {
    for (const [bundleInputFile, bundle] of this.bundles.entries()) {
      if (bundle.watchedFiles.includes(file)) {
        this.invalidatedBundles.add(bundleInputFile)
      }
    }
  }

  removeBundleIfInvalidated(file: string) {
    if (this.invalidatedBundles.has(file)) {
      this.invalidatedBundles.delete(file)
      this.removeBundle(file)
    }
  }

  private removeBundle(file: string) {
    const bundle = this.bundles.get(file)
    if (!bundle) return

    this.bundles.delete(file)

    this.assets.delete(bundle.entryFilename)

    const keptBundles = [...this.bundles.values()]
    // remove assets that are only referenced by this bundle
    for (const asset of bundle.referencedAssets) {
      if (keptBundles.every((b) => !b.referencedAssets.has(asset))) {
        this.assets.delete(asset)
      }
    }

    this.bundleReferences.delete(file)
  }

  recordReference(
    parentInputId: BundleId,
    childBundleId: WorkerBundleId,
    referencingModuleId: string,
  ) {
    let referencesByModule = this.bundleReferences.get(parentInputId)
    if (!referencesByModule) {
      referencesByModule = new Map()
      this.bundleReferences.set(parentInputId, referencesByModule)
    }
    let childBundleIds = referencesByModule.get(referencingModuleId)
    if (!childBundleIds) {
      childBundleIds = new Set()
      referencesByModule.set(referencingModuleId, childBundleIds)
    }
    childBundleIds.add(childBundleId)
  }

  getLiveAssetFileNames(mainLiveModuleIds: Set<string>): Set<string> {
    const liveBundles = new Set<string>()
    const queue: [BundleId, Set<string>][] = [[undefined, mainLiveModuleIds]]
    while (queue.length > 0) {
      const [bundleId, moduleIds] = queue.shift()!
      const referencesByModule = this.bundleReferences.get(bundleId)
      if (!referencesByModule) continue
      for (const moduleId of moduleIds) {
        const childBundleIds = referencesByModule.get(moduleId)
        if (!childBundleIds) continue
        for (const childBundleId of childBundleIds) {
          if (liveBundles.has(childBundleId)) continue
          liveBundles.add(childBundleId)
          const childBundle = this.bundles.get(childBundleId)
          if (childBundle) {
            queue.push([childBundleId, childBundle.moduleIds])
          }
        }
      }
    }

    const liveFileNames = new Set<string>()
    for (const inputId of liveBundles) {
      const wb = this.bundles.get(inputId)
      if (!wb) continue
      liveFileNames.add(wb.entryFilename)
      for (const fileName of wb.referencedAssets) {
        liveFileNames.add(fileName)
      }
    }
    return liveFileNames
  }

  getDeadDirectlyReferencedBundles(
    bundleId: BundleId,
    liveModuleIds: Set<string>,
  ): WorkerBundle[] {
    const referencesByModule = this.bundleReferences.get(bundleId)
    if (!referencesByModule) return []
    const deadBundleIds = new Set<WorkerBundleId>()
    for (const references of referencesByModule.values()) {
      for (const childBundleId of references) {
        deadBundleIds.add(childBundleId)
      }
    }
    for (const moduleId of liveModuleIds) {
      for (const childBundleId of referencesByModule.get(moduleId) || []) {
        deadBundleIds.delete(childBundleId)
      }
    }
    const deadBundles: WorkerBundle[] = []
    for (const childBundleId of deadBundleIds) {
      const bundle = this.bundles.get(childBundleId)
      if (bundle) deadBundles.push(bundle)
    }
    return deadBundles
  }

  getWorkerBundle(file: string) {
    return this.bundles.get(file)
  }

  getAssets() {
    return this.assets.values()
  }

  /**
   * Emit the worker entry as an asset (once per build) and return the JS
   * expression referencing it: `import.meta.ROLLDOWN_FILE_URL_<referenceId>`. The
   * `vite:asset` `resolveFileUrl` hook turns that into the final URL (respecting
   * base / `renderBuiltUrl`). The emitted file is deduplicated against this
   * cache's `generateBundle` emit via its content check.
   */
  generateEntryUrlExpr(
    pluginContext: PluginContext,
    bundle: WorkerBundle,
  ): string {
    const { environment } = pluginContext
    let referenceId = bundle.entryReferenceIds.get(environment)
    if (!referenceId) {
      referenceId = pluginContext.emitFile({
        type: 'asset',
        fileName: bundle.entryFilename,
        source: bundle.entryCode,
      })
      bundle.entryReferenceIds.set(environment, referenceId)
    }
    return `import.meta.ROLLDOWN_FILE_URL_${referenceId}`
  }

  clearEntryReferenceIds(environment: Environment): void {
    for (const bundle of this.bundles.values()) {
      bundle.entryReferenceIds.delete(environment)
    }
  }
}

export type WorkerType = 'classic' | 'module' | 'ignore'

export const workerOrSharedWorkerRE: RegExp =
  /(?:\?|&)(worker|sharedworker)(?:&|$)/
const workerFileRE = /(?:\?|&)worker_file&type=(\w+)(?:&|$)/
const inlineRE = /[?&]inline\b/
const workerQueriesRE =
  /(\?|&)(?:(?:worker|sharedworker|inline|url)=?(?:&|$))+/g

export function splitWorkerRequest(id: string): {
  file: string
  postfix: string
} {
  const { file, postfix } = splitFileAndPostfix(id)
  if (!postfix || postfix[0] !== '?') {
    return { file, postfix: '' }
  }
  return {
    file,
    postfix: postfix
      .replace(workerQueriesRE, '$1')
      .replace(trailingSeparatorRE, ''),
  }
}

export const WORKER_FILE_ID = 'worker_file'
const workerOutputCaches = new WeakMap<ResolvedConfig, WorkerOutputCache>()

export function recordWorkerReference(
  config: ResolvedConfig,
  parentInputId: string | undefined,
  childBundleId: WorkerBundleId,
  referencingModuleId: string,
): void {
  workerOutputCaches
    .get(config.mainConfig || config)!
    .recordReference(parentInputId, childBundleId, referencingModuleId)
}

/**
 * Reference a bundled worker entry as `import.meta.ROLLDOWN_FILE_URL_<id>` from the
 * given build. Thin accessor over `WorkerOutputCache.generateEntryUrlExpr` so
 * both `vite:worker` and `vite:worker-import-meta-url` can share the cache.
 */
export function generateWorkerEntryUrlExpr(
  pluginContext: PluginContext,
  config: ResolvedConfig,
  bundle: WorkerBundle,
): string {
  return workerOutputCaches
    .get(config.mainConfig || config)!
    .generateEntryUrlExpr(pluginContext, bundle)
}

async function bundleWorkerEntry(
  config: ResolvedConfig,
  id: string,
): Promise<WorkerBundle> {
  const input = cleanUrl(id)

  const workerOutput = workerOutputCaches.get(config.mainConfig || config)!
  workerOutput.removeBundleIfInvalidated(input)

  const bundleInfo = workerOutput.getWorkerBundle(input)
  if (bundleInfo) {
    return bundleInfo
  }

  const newBundleChain = [...config.bundleChain, input]
  if (config.bundleChain.includes(input)) {
    throw new Error(
      'Circular worker imports detected. Vite does not support it. ' +
        `Import chain: ${newBundleChain.map((id) => prettifyUrl(id, config.root)).join(' -> ')}`,
    )
  }

  // bundle the file as entry to support imports
  const { rolldown } = await import('rolldown')
  const { plugins, rolldownOptions, format } = config.worker
  const workerConfig = await plugins(newBundleChain)
  const workerEnvironment = new BuildEnvironment('client', workerConfig) // TODO: should this be 'worker'?
  await workerEnvironment.init()

  const chunkMetadataMap = new ChunkMetadataMap()
  const workerBuildTarget = workerEnvironment.config.build.target
  const bundle = await rolldown({
    ...rolldownOptions,
    input,
    plugins: workerEnvironment.plugins.map((p) =>
      injectEnvironmentToHooks(workerEnvironment, chunkMetadataMap, p),
    ),
    onLog(level, log) {
      onRollupLog(level, log, workerEnvironment)
    },
    transform: {
      target: workerBuildTarget === false ? undefined : workerBuildTarget,
      ...rolldownOptions.transform,
      define: {
        ...rolldownOptions.transform?.define,
        // disable builtin process.env.NODE_ENV replacement as it is handled by the define plugin
        'process.env.NODE_ENV': 'process.env.NODE_ENV',
      },
    },
    // TODO: remove this and enable rolldown's CSS support later
    moduleTypes: {
      '.css': 'js',
      ...rolldownOptions.moduleTypes,
    },
    preserveEntrySignatures: false,
    experimental: {
      ...rolldownOptions.experimental,
      viteMode: true,
    },
  })
  let result: RolldownOutput
  let watchedFiles: string[] | undefined
  try {
    const workerOutputConfig = config.worker.rolldownOptions.output
    const workerConfig = workerOutputConfig
      ? Array.isArray(workerOutputConfig)
        ? workerOutputConfig[0] || {}
        : workerOutputConfig
      : {}
    result = await bundle.generate({
      entryFileNames: path.posix.join(
        config.build.assetsDir,
        '[name]-[hash].js',
      ),
      chunkFileNames: path.posix.join(
        config.build.assetsDir,
        '[name]-[hash].js',
      ),
      assetFileNames: path.posix.join(
        config.build.assetsDir,
        '[name]-[hash].[ext]',
      ),
      minify:
        workerEnvironment.config.build.minify === 'oxc'
          ? true
          : workerEnvironment.config.build.minify === false
            ? 'dce-only'
            : undefined,
      ...workerConfig,
      format,
      sourcemap: workerEnvironment.config.build.sourcemap,
    })
    watchedFiles = (await bundle.watchFiles).map((f) => normalizePath(f))
  } catch (e) {
    // adjust rollup format error
    if (
      e instanceof Error &&
      e.name === 'RollupError' &&
      (e as RollupError).code === 'INVALID_OPTION' &&
      e.message.includes('"output.format"')
    ) {
      e.message = e.message.replace('output.format', 'worker.format')
    }
    throw e
  } finally {
    await bundle.close()
  }

  const moduleIds = collectIncludedModuleIds(result.output)

  const {
    output: [outputChunk, ...outputChunks],
  } = result
  const assets = outputChunks.map((outputChunk) =>
    outputChunk.type === 'asset'
      ? outputChunk
      : {
          fileName: outputChunk.fileName,
          originalFileName: null,
          originalFileNames: [],
          source: outputChunk.code,
        },
  )
  if (
    (config.build.sourcemap === 'hidden' || config.build.sourcemap === true) &&
    outputChunk.map
  ) {
    assets.push({
      fileName: outputChunk.fileName + '.map',
      originalFileName: null,
      originalFileNames: [],
      source: outputChunk.map.toString(),
    })
  }

  const newBundleInfo = workerOutputCaches
    .get(config.mainConfig || config)!
    .saveWorkerBundle(
      input,
      watchedFiles,
      outputChunk.fileName,
      outputChunk.code,
      assets,
      moduleIds,
      config.logger,
    )
  return newBundleInfo
}

export async function workerFileToUrl(
  config: ResolvedConfig,
  id: string,
): Promise<WorkerBundle> {
  const workerOutput = workerOutputCaches.get(config.mainConfig || config)!
  const bundle = await bundleWorkerEntry(config, id)
  workerOutput.saveAsset(
    {
      fileName: bundle.entryFilename,
      originalFileName: null,
      originalFileNames: [],
      source: bundle.entryCode,
    },
    config.logger,
  )
  return bundle
}

/**
 * Emit the bundled worker files during `load` / `transform`.
 *
 * They normally reach the output through `generateBundle`, which an HMR patch
 * skips, so without this a patched worker points at a file that was never
 * emitted.
 */
export function emitWorkerAssetsForBundledDev(
  pluginContext: { emitFile: PluginContext['emitFile'] },
  config: ResolvedConfig,
): void {
  if (config.isWorker) return

  const workerOutput = workerOutputCaches.get(config.mainConfig || config)!
  for (const asset of workerOutput.getAssets()) {
    pluginContext.emitFile({
      type: 'asset',
      fileName: asset.fileName,
      source: asset.source,
    })
  }
}

export function webWorkerPostPlugin(_config: ResolvedConfig): Plugin {
  return {
    name: 'vite:worker-post',
    applyToEnvironment(environment) {
      if (environment.config.isBundled) {
        if (environment.config.worker.format === 'iife') {
          return nativeWebWorkerPostPlugin()
        }
        return false
      }
      return true
    },
    transform: {
      filter: {
        code: 'import.meta',
      },
      order: 'post',
      async handler(code, id) {
        // import.meta is unavailable in the IIFE worker, so we need to replace it
        if (this.environment.config.worker.format === 'iife') {
          await init

          let imports: readonly ImportSpecifier[]
          try {
            imports = parse(code)[0]
          } catch {
            // ignore if parse fails
            return
          }

          let injectedImportMeta = false
          let s: MagicString | undefined
          for (const { s: start, e: end, d: dynamicIndex } of imports) {
            // is import.meta
            if (dynamicIndex === -2) {
              const prop = code.slice(end, end + 4)
              if (prop === '.url') {
                s ||= new MagicString(code)
                s.overwrite(start, end + 4, 'self.location.href')
              } else {
                s ||= new MagicString(code)
                if (!injectedImportMeta) {
                  s.prepend(
                    'const _vite_importMeta = { url: self.location.href };\n',
                  )
                  injectedImportMeta = true
                }
                s.overwrite(start, end, '_vite_importMeta')
              }
            }
          }

          if (!s) return

          return {
            code: s.toString(),
            map: s.generateMap({ hires: 'boundary', source: id }),
          }
        }
      },
    },
  }
}

export function webWorkerPlugin(config: ResolvedConfig): Plugin {
  const isWorker = config.isWorker

  workerOutputCaches.set(config, new WorkerOutputCache())
  const emittedAssets = new Set<string>()

  return {
    name: 'vite:worker',

    buildStart() {
      if (isWorker) return
      emittedAssets.clear()
      workerOutputCaches.get(config)!.clearEntryReferenceIds(this.environment)
    },

    load: {
      filter: { id: workerOrSharedWorkerRE },
      async handler(id) {
        const workerMatch = workerOrSharedWorkerRE.exec(id)
        if (!workerMatch) return

        const { format } = config.worker
        const workerConstructor =
          workerMatch[1] === 'sharedworker' ? 'SharedWorker' : 'Worker'
        const isBundled = this.environment.config.isBundled
        const workerType = isBundled
          ? format === 'es'
            ? 'module'
            : 'classic'
          : 'module'
        const workerTypeOption = `{
          ${workerType === 'module' ? `type: "module",` : ''}
          name: options?.name
        }`

        let urlCode: string
        if (isBundled) {
          if (isWorker && config.bundleChain.at(-1) === cleanUrl(id)) {
            urlCode = 'self.location.href'
          } else if (inlineRE.test(id)) {
            recordWorkerReference(
              config,
              config.bundleChain.at(-1),
              cleanUrl(id),
              id,
            )
            const result = await bundleWorkerEntry(config, id)
            for (const file of result.watchedFiles) {
              this.addWatchFile(file)
            }
            // The entry is inlined, but assets referenced by the worker
            // still need to be emitted during `load` since an HMR patch
            // skips the generate phase.
            if (this.environment.config.command === 'serve') {
              emitWorkerAssetsForBundledDev(this, config)
            }

            const jsContent = `const jsContent = ${JSON.stringify(result.entryCode)};`

            const code =
              // Using blob URL for SharedWorker results in multiple instances of a same worker
              workerConstructor === 'Worker'
                ? `${jsContent}
            const blob = typeof self !== "undefined" && self.Blob && new Blob([${
              // NOTE: Revoke the objURL after creating the worker, otherwise it breaks WebKit-based browsers
              workerType === 'classic'
                ? `'(self.URL || self.webkitURL).revokeObjectURL(self.location.href);',`
                : // `URL` is always available, in `Worker[type="module"]`
                  `'URL.revokeObjectURL(import.meta.url);',`
            }jsContent], { type: "text/javascript;charset=utf-8" });
            export default function WorkerWrapper(options) {
              let objURL;
              try {
                objURL = blob && (self.URL || self.webkitURL).createObjectURL(blob);
                if (!objURL) throw ''
                const worker = new ${workerConstructor}(objURL, ${workerTypeOption});
                worker.addEventListener("error", () => {
                  (self.URL || self.webkitURL).revokeObjectURL(objURL);
                });
                return worker;
              } catch(e) {
                return new ${workerConstructor}(
                  'data:text/javascript;charset=utf-8,' + encodeURIComponent(jsContent),
                  ${workerTypeOption}
                );
              }
            }`
                : `${jsContent}
            export default function WorkerWrapper(options) {
              return new ${workerConstructor}(
                'data:text/javascript;charset=utf-8,' + encodeURIComponent(jsContent),
                ${workerTypeOption}
              );
            }
            `

            return {
              code,
              // Empty sourcemap to suppress Rollup warning
              map: { mappings: '' },
            }
          } else {
            recordWorkerReference(
              config,
              config.bundleChain.at(-1),
              cleanUrl(id),
              id,
            )
            const result = await workerFileToUrl(config, id)
            if (
              this.environment.config.command === 'serve' &&
              this.environment.config.isBundled
            ) {
              emitWorkerAssetsForBundledDev(this, config)
              urlCode = JSON.stringify(
                toOutputFilePathInJSForBundledDev(
                  this.environment,
                  result.entryFilename,
                ),
              )
            } else {
              urlCode = generateWorkerEntryUrlExpr(this, config, result)
            }
            for (const file of result.watchedFiles) {
              this.addWatchFile(file)
            }
          }
        } else {
          const { file, postfix } = splitWorkerRequest(id)
          let url = await fileToUrl(this, file, 'string')
          url = injectQuery(
            `${url}${postfix}`,
            `${WORKER_FILE_ID}&type=${workerType}`,
          )
          urlCode = JSON.stringify(url)
        }

        if (urlRE.test(id)) {
          return {
            code: `export default ${urlCode}`,
            map: { mappings: '' }, // Empty sourcemap to suppress Rollup warning
          }
        }

        return {
          code: `export default function WorkerWrapper(options) {
            return new ${workerConstructor}(
              ${urlCode},
              ${workerTypeOption}
            );
          }`,
          map: { mappings: '' }, // Empty sourcemap to suppress Rollup warning
        }
      },
    },

    transform: {
      filter: { id: workerFileRE },
      handler(raw, id) {
        const workerFileMatch = workerFileRE.exec(id)
        if (workerFileMatch) {
          // if import worker by worker constructor will have query.type
          // other type will be import worker by esm
          const workerType = workerFileMatch[1] as WorkerType
          let injectEnv = ''

          if (workerType === 'classic') {
            // base needs to be joined as the base is not injected to `importScripts` automatically
            const scriptPath = JSON.stringify(
              path.posix.join(config.base, ENV_PUBLIC_PATH),
            )
            injectEnv = `importScripts(${scriptPath})\n`
          } else if (workerType === 'module') {
            const scriptPath = JSON.stringify(ENV_PUBLIC_PATH)
            injectEnv = `import ${scriptPath}\n`
          } else if (workerType === 'ignore') {
            if (this.environment.config.isBundled) {
              injectEnv = ''
            } else {
              // dynamic worker type we can't know how import the env
              // so we copy /@vite/env code of server transform result into file header
              const environment = this.environment
              const moduleGraph =
                environment.mode === 'dev' ? environment.moduleGraph : undefined
              const module = moduleGraph?.getModuleById(ENV_ENTRY)
              injectEnv = module?.transformResult?.code || ''
            }
          }
          if (injectEnv) {
            const s = new MagicString(raw)
            s.prepend(injectEnv + ';\n')
            return {
              code: s.toString(),
              map: s.generateMap({ hires: 'boundary' }),
            }
          }
        }
      },
    },

    generateBundle(opts, bundle) {
      // to avoid emitting duplicate assets for modern build and legacy build
      if (this.environment.config.isOutputOptionsForLegacyChunks?.(opts)) {
        return
      }
      const cache = workerOutputCaches.get(config.mainConfig || config)!
      const liveModuleIds = collectIncludedModuleIds(Object.values(bundle))
      // Reference tracking relies on hooks running for every module, which is
      // not guaranteed when an incremental build reuses cached modules.
      const shouldFilter =
        this.environment.config.command === 'build' && !config.build.watch

      // `import.meta.ROLLDOWN_FILE_URL_*` requires calling `emitFile` while the
      // referencing module is loaded. Remove those eagerly emitted assets when
      // Rolldown later tree-shakes the module that referenced them. This also
      // needs to run for worker sub-builds so dead nested workers don't become
      // referenced assets of their parent worker bundle.
      if (shouldFilter) {
        const rootBundleId = isWorker ? config.bundleChain.at(-1) : undefined
        for (const workerBundle of cache.getDeadDirectlyReferencedBundles(
          rootBundleId,
          liveModuleIds,
        )) {
          const emittedAsset = bundle[workerBundle.entryFilename]
          if (emittedAsset?.type === 'asset') {
            delete bundle[workerBundle.entryFilename]
          }
        }
      }

      if (isWorker) return

      const liveFileNames = shouldFilter
        ? cache.getLiveAssetFileNames(liveModuleIds)
        : undefined
      for (const asset of cache.getAssets()) {
        if (liveFileNames && !liveFileNames.has(asset.fileName)) continue
        if (emittedAssets.has(asset.fileName)) continue
        emittedAssets.add(asset.fileName)

        const duplicateAsset = bundle[asset.fileName]
        if (duplicateAsset) {
          const content =
            duplicateAsset.type === 'asset'
              ? duplicateAsset.source
              : duplicateAsset.code
          // don't emit if the file name and the content is same
          if (isSameContent(content, asset.source)) {
            continue
          }
        }

        this.emitFile({
          type: 'asset',
          fileName: asset.fileName,
          source: asset.source,
          // NOTE: fileName is already generated when bundling the worker
          //       so no need to pass originalFileNames/names
        })
      }
    },

    watchChange(file) {
      if (isWorker) return
      workerOutputCaches
        .get(config)!
        .invalidateAffectedBundles(normalizePath(file))
    },
  }
}

function collectIncludedModuleIds(
  outputs: (OutputChunk | OutputAsset)[],
): Set<string> {
  const moduleIds = new Set<string>()
  for (const output of outputs) {
    if (output.type === 'chunk') {
      for (const moduleId of output.moduleIds) {
        moduleIds.add(moduleId)
      }
    }
  }
  return moduleIds
}

function isSameContent(a: string | Uint8Array, b: string | Uint8Array) {
  if (typeof a === 'string') {
    if (typeof b === 'string') {
      return a === b
    }
    return Buffer.from(a).equals(b)
  }
  return Buffer.from(b).equals(a)
}
