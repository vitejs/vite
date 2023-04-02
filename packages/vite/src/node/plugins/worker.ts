import path from 'node:path'
import MagicString from 'magic-string'
import type {
  EmittedAsset,
  NormalizedOutputOptions,
  OutputChunk,
  OutputOptions,
  PluginContext,
  RollupBuild,
} from 'rollup'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import type { ViteDevServer } from '../server'
import { ENV_ENTRY, ENV_PUBLIC_PATH } from '../constants'
import { cleanUrl, getHash, injectQuery, parseRequest } from '../utils'
import {
  createToImportMetaURLBasedRelativeRuntime,
  onRollupWarning,
  toOutputFilePathInJS,
} from '../build'
import { fileToUrl } from './asset'

type WorkerOutput = [
  OutputChunk, // The entry point
  ...(OutputChunk | EmittedAsset)[],
]
type WorkerOutputResult = { output: WorkerOutput; referencedId?: string }

interface WorkerData {
  bundle: RollupBuild
  entryMap: Map<
    NormalizedOutputOptions,
    { promise: Promise<WorkerOutputResult> } | { result: WorkerOutputResult }
  >
  hash: string
}

interface WorkerCache {
  // save the bundle and the hash that are created per each worker
  // <workerId, data>
  workersData: Map<string, WorkerData>

  // assets created by the workers (including the worker themself)
  workersAssets: Map<string, { referencedId: string; asset: EmittedAsset }>

  // <hash, id>
  idHash: Map<string, string>
}

export type WorkerType = 'classic' | 'module' | 'ignore'

export const WORKER_FILE_ID = 'worker_file'
const workerCache = new WeakMap<ResolvedConfig, WorkerCache>()
const getWorkerCache = (config: ResolvedConfig) =>
  workerCache.get(config.mainConfig || config)!

function getReferencedId(
  context: PluginContext,
  workerCache: WorkerCache,
  result: WorkerOutputResult,
): string {
  if (result.referencedId) {
    // If this processs already was done for this worker
    return result.referencedId
  }

  const { output } = result

  // emit assets
  for (let i = 0; i < output.length; ++i) {
    const file = output[i]
    const description: EmittedAsset =
      file.type === 'asset'
        ? file
        : {
            fileName: file.fileName,
            source: file.code,
            type: 'asset',
          }

    const existingAsset = workerCache.workersAssets.get(description.fileName!)

    let referencedId: string

    if (existingAsset === undefined) {
      referencedId = context.emitFile(description)
    } else {
      if (existingAsset.asset.source !== description.source) {
        // Should never be triggered because of proper hashing
        throw `vite: worker error! asset filename ${JSON.stringify(
          description.fileName!,
        )} for some worker was already emitted by a different worker but with a different name.`
      }

      referencedId = existingAsset.referencedId
    }

    if (i === 0) {
      result.referencedId = referencedId
    }
  }

  return result.referencedId!
}

export async function bundleWorker(
  config: ResolvedConfig,
  id: string,
): Promise<RollupBuild> {
  // bundle the file as entry to support imports
  const { rollup } = await import('rollup')
  const { plugins, rollupOptions } = config.worker
  const bundle = await rollup({
    ...rollupOptions,
    input: cleanUrl(id),
    plugins,
    onwarn(warning, warn) {
      onRollupWarning(warning, warn, config)
    },
    preserveEntrySignatures: false,
  })
  return bundle
}

async function generateWorker(
  bundle: RollupBuild,
  config: ResolvedConfig,
  callerOutputOptions: OutputOptions,
): Promise<{ output: WorkerOutput }> {
  const { format } = config.worker

  const workerOutputConfig = config.worker.rollupOptions.output
  const workerConfig = workerOutputConfig
    ? typeof workerOutputConfig === 'function'
      ? // @ts-expect-error this is an internal(currently) option to have output config as a function
        workerOutputConfig(callerOutputOptions)
      : Array.isArray(workerOutputConfig)
      ? workerOutputConfig[0] || {}
      : workerOutputConfig
    : {}
  const rollupOutput = await bundle.generate({
    entryFileNames: path.posix.join(config.build.assetsDir, '[name]-[hash].js'),
    chunkFileNames: path.posix.join(config.build.assetsDir, '[name]-[hash].js'),
    assetFileNames: path.posix.join(
      config.build.assetsDir,
      '[name]-[hash].[ext]',
    ),
    ...workerConfig,
    format,
    sourcemap: config.build.sourcemap && 'hidden',
  })
  const output: WorkerOutput = rollupOutput.output
  return { output }
}

export const workerAssetUrlRE = /__VITE_WORKER_ASSET__([a-z\d]{8})__/g
export const workerInlineRE = /__VITE_WORKER_INLINE__([a-z\d]{8})__/g

/**
 * Return a token that will be replaced by the actual URL (or the inlined code in base64, when `isInline` is `true`) of the worker.
 * If the worker hasn't been built yet, it will also build the worker bundle (but the output will be generated only later!).
 * @param config
 * @param id
 * @param isInline
 * @returns
 */
export async function workerIdToToken(
  config: ResolvedConfig,
  id: string,
  isInline = false,
): Promise<string> {
  const workerMap = getWorkerCache(config)
  let data = workerMap.workersData.get(id)
  if (data == null) {
    data = {
      bundle: await bundleWorker(config, id),
      entryMap: new Map(),
      hash: getHash(id),
    }
    workerMap.workersData.set(id, data)
    workerMap.idHash.set(data.hash, id)
  }
  return `__VITE_WORKER_${isInline ? 'INLINE' : 'ASSET'}__${data.hash}__`
}

export function webWorkerPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  let server: ViteDevServer
  const isWorker = config.isWorker

  const isWorkerQueryId = (id: string) => {
    const parsedQuery = parseRequest(id)
    if (
      parsedQuery &&
      (parsedQuery.worker ?? parsedQuery.sharedworker) != null
    ) {
      return true
    }

    return false
  }

  return {
    name: 'vite:worker',

    configureServer(_server) {
      server = _server
    },

    buildStart() {
      if (isWorker) {
        return
      }
      workerCache.set(config, {
        workersData: new Map(),
        workersAssets: new Map(),
        idHash: new Map(),
      })
    },

    load(id) {
      if (isBuild && isWorkerQueryId(id)) {
        return ''
      }
    },

    shouldTransformCachedModule({ id }) {
      if (isBuild && isWorkerQueryId(id) && config.build.watch) {
        return true
      }
      return false
    },

    async transform(raw, id) {
      const query = parseRequest(id)
      if (query && query[WORKER_FILE_ID] != null) {
        // if import worker by worker constructor will have query.type
        // other type will be import worker by esm
        const workerType = query['type']! as WorkerType
        let injectEnv = ''

        if (workerType === 'classic') {
          injectEnv = `importScripts('${ENV_PUBLIC_PATH}')\n`
        } else if (workerType === 'module') {
          injectEnv = `import '${ENV_PUBLIC_PATH}'\n`
        } else if (workerType === 'ignore') {
          if (isBuild) {
            injectEnv = ''
          } else if (server) {
            // dynamic worker type we can't know how import the env
            // so we copy /@vite/env code of server transform result into file header
            const { moduleGraph } = server
            const module = moduleGraph.getModuleById(ENV_ENTRY)
            injectEnv = module?.transformResult?.code || ''
          }
        }
        return {
          code: injectEnv + raw,
        }
      }
      if (
        query == null ||
        (query && (query.worker ?? query.sharedworker) == null)
      ) {
        return
      }

      // stringified url or `new URL(...)`
      let url: string
      const { format } = config.worker
      const workerConstructor =
        query.sharedworker != null ? 'SharedWorker' : 'Worker'
      const workerType = isBuild
        ? format === 'es'
          ? 'module'
          : 'classic'
        : 'module'
      const workerOptions = workerType === 'classic' ? '' : ',{type: "module"}'

      if (isBuild) {
        if (query.inline != null) {
          const codeBase64Token = await workerIdToToken(config, id, true)
          const encodedJs = `const encodedJs = ${codeBase64Token};`

          const code =
            // Using blob URL for SharedWorker results in multiple instances of a same worker
            workerConstructor === 'Worker'
              ? `${encodedJs}
          const blob = typeof window !== "undefined" && window.Blob && new Blob([atob(encodedJs)], { type: "text/javascript;charset=utf-8" });
          export default function WorkerWrapper() {
            let objURL;
            try {
              objURL = blob && (window.URL || window.webkitURL).createObjectURL(blob);
              if (!objURL) throw ''
              return new ${workerConstructor}(objURL)
            } catch(e) {
              return new ${workerConstructor}("data:application/javascript;base64," + encodedJs${workerOptions});
            } finally {
              objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
            }
          }`
              : `${encodedJs}
          export default function WorkerWrapper() {
            return new ${workerConstructor}("data:application/javascript;base64," + encodedJs${workerOptions});
          }
          `

          return {
            code,
            // Empty sourcemap to suppress Rollup warning
            map: { mappings: '' },
          }
        } else {
          url = await workerIdToToken(config, id)
        }
      } else {
        url = await fileToUrl(cleanUrl(id), config, this)
        url = injectQuery(url, WORKER_FILE_ID)
        url = injectQuery(url, `type=${workerType}`)
        url = JSON.stringify(url)
      }

      if (query.url != null) {
        return {
          code: `export default ${url}`,
          map: { mappings: '' }, // Empty sourcemap to suppress Rollup warning
        }
      }

      return {
        code: `export default function WorkerWrapper() {
          return new ${workerConstructor}(${url}${workerOptions})
        }`,
        map: { mappings: '' }, // Empty sourcemap to suppress Rollup warning
      }
    },

    async renderStart(outputOptions) {
      if (isWorker) {
        return
      }
      const { workersData } = getWorkerCache(config)

      for (const { bundle, entryMap } of workersData.values()) {
        const promise = generateWorker(bundle, config, outputOptions)
        entryMap.set(outputOptions, { promise })
      }
    },

    async generateBundle(outputOptions) {
      if (isWorker) {
        return
      }
      const { workersData } = getWorkerCache(config)

      await Promise.all(
        [...workersData.values()]
          .map(async ({ entryMap }) => {
            const resultOrPromise = entryMap.get(outputOptions)!
            return 'promise' in resultOrPromise
              ? await resultOrPromise.promise
              : undefined
          })
          .filter(Boolean),
      )
    },

    async closeBundle() {
      if (isWorker) {
        return
      }
      const workerMap = getWorkerCache(config)
      if (workerMap != null) {
        await Promise.all(
          [...workerMap.workersData.values()].map(async ({ bundle }) => {
            await bundle.close()
          }),
        )
      }
    },
  }
}

export function webWorkerPostBuildPlugin(config: ResolvedConfig): Plugin {
  const isWorker = config.isWorker

  return {
    name: 'vite:worker-post-build',

    async renderChunk(code, chunk, outputOptions) {
      if (isWorker) {
        return
      }
      // otherwise

      let s: MagicString
      const result = () => {
        return (
          s && {
            code: s.toString(),
            map: config.build.sourcemap ? s.generateMap({ hires: true }) : null,
          }
        )
      }
      if (
        code.match(workerAssetUrlRE) ||
        code.match(workerInlineRE) ||
        code.includes('import.meta.url')
      ) {
        const toRelativeRuntime = createToImportMetaURLBasedRelativeRuntime(
          outputOptions.format,
        )

        let match: RegExpExecArray | null
        s = new MagicString(code)
        // though the RE are accessed from many coroutines, it's safe since the scanning itself isn't async
        workerAssetUrlRE.lastIndex = 0
        workerInlineRE.lastIndex = 0

        // Replace "__VITE_WORKER_ASSET__5aa0ddc0__" using relative paths
        const workerMap = getWorkerCache(config)
        const { workersData: workers_data, idHash } = workerMap

        while ((match = workerAssetUrlRE.exec(code))) {
          const [full, hash] = match
          const id = idHash.get(hash)!
          const resultOrPromise = workers_data
            .get(id)!
            .entryMap.get(outputOptions)!
          const result =
            'promise' in resultOrPromise
              ? await resultOrPromise.promise
              : resultOrPromise.result
          const referencedId = getReferencedId(this, workerMap, result)
          const filename = this.getFileName(referencedId)
          const replacement = toOutputFilePathInJS(
            filename,
            'asset',
            chunk.fileName,
            'js',
            config,
            toRelativeRuntime,
          )
          const replacementString =
            typeof replacement === 'string'
              ? JSON.stringify(replacement)
              : replacement.runtime
          s.update(match.index, match.index + full.length, replacementString)
        }

        while ((match = workerInlineRE.exec(code))) {
          const [full, hash] = match
          const id = idHash.get(hash)!
          const resultOrPromise = workers_data
            .get(id)!
            .entryMap.get(outputOptions)!
          const result =
            'promise' in resultOrPromise
              ? await resultOrPromise.promise
              : resultOrPromise.result
          const replacement = Buffer.from(result.output[0].code).toString(
            'base64',
          )
          const replacementString = JSON.stringify(replacement)
          s.update(match.index, match.index + full.length, replacementString)
        }
      }
      return result()
    },
  }
}
