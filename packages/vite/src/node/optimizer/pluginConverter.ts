import { dirname } from 'node:path'
import type * as esbuild from 'esbuild'
import type {
  ImportKind,
  LoadResult,
  PluginContext,
  ResolveIdResult,
  Plugin as RolldownPlugin,
  RolldownPluginOption,
} from 'rolldown'

type MaybePromise<T> = T | Promise<T>
type EsbuildOnResolveCallback = (
  args: esbuild.OnResolveArgs,
) => MaybePromise<esbuild.OnResolveResult | null | undefined>
type EsbuildOnLoadCallback = (
  args: esbuild.OnLoadArgs,
) => MaybePromise<esbuild.OnLoadResult | null | undefined>
type ResolveIdHandler = (
  this: PluginContext,
  id: string,
  importer: string | undefined,
  opts: { kind: ImportKind },
) => MaybePromise<ResolveIdResult>
type LoadHandler = (this: PluginContext, id: string) => MaybePromise<LoadResult>

export function convertEsbuildPluginToRolldownPlugin(
  esbuildPlugin: esbuild.Plugin,
): RolldownPlugin {
  const onStartCallbacks: Array<() => void> = []
  const onEndCallbacks: Array<(buildResult: esbuild.BuildResult) => void> = []
  const onDisposeCallbacks: Array<() => void> = []
  let resolveIdHandlers: ResolveIdHandler[]
  let loadHandlers: LoadHandler[]

  let isSetupDone = false
  const setup = async (
    plugins: RolldownPluginOption[],
    platform: 'browser' | 'node' | 'neutral',
  ) => {
    const onResolveCallbacks: Array<
      [options: esbuild.OnResolveOptions, callback: EsbuildOnResolveCallback]
    > = []
    const onLoadCallbacks: Array<
      [options: esbuild.OnLoadOptions, callback: EsbuildOnLoadCallback]
    > = []

    const pluginBuild: esbuild.PluginBuild = {
      initialOptions: new Proxy(
        {
          platform,
          plugins:
            plugins?.flatMap((p) =>
              p && 'name' in p
                ? [
                    {
                      name: p.name,
                      // eslint-disable-next-line @typescript-eslint/no-empty-function
                      setup() {},
                    },
                  ]
                : [],
            ) ?? [],
        },
        {
          get(target, p, _receiver) {
            if (p in target) return (target as any)[p]
            throw new Error('Not implemented')
          },
        },
      ) as esbuild.BuildOptions,
      resolve() {
        throw new Error('Not implemented')
      },
      onStart(callback) {
        onStartCallbacks.push(callback)
      },
      onEnd(callback) {
        onEndCallbacks.push(callback)
      },
      onResolve(options, callback) {
        onResolveCallbacks.push([options, callback])
      },
      onLoad(options, callback) {
        onLoadCallbacks.push([options, callback])
      },
      onDispose(callback) {
        onDisposeCallbacks.push(callback)
      },
      get esbuild(): esbuild.PluginBuild['esbuild'] {
        throw new Error('Not implemented')
      },
      set esbuild(_: unknown) {
        throw new Error('Not implemented')
      },
    }

    await esbuildPlugin.setup(pluginBuild)

    resolveIdHandlers = onResolveCallbacks.map(([options, callback]) =>
      createResolveIdHandler(options, callback),
    )
    loadHandlers = onLoadCallbacks.map(([options, callback]) =>
      createLoadHandler(options, callback),
    )
    isSetupDone = true
  }

  return {
    name: esbuildPlugin.name,
    async options(inputOptions) {
      await setup(
        inputOptions.plugins as RolldownPluginOption[],
        inputOptions.platform ?? 'node',
      )
    },
    async buildStart(inputOptions) {
      // options hook is not called for scanner
      if (!isSetupDone) {
        // inputOptions.plugins is not available for buildStart hook
        // put a dummy plugin to tell that this is a scan
        await setup(
          [{ name: 'vite:dep-scan' }],
          inputOptions.platform ?? 'node',
        )
      }

      for (const cb of onStartCallbacks) {
        cb()
      }
    },
    generateBundle() {
      const buildResult = new Proxy(
        {},
        {
          get(_target, _prop) {
            throw new Error('Not implemented')
          },
        },
      ) as esbuild.BuildResult
      for (const cb of onEndCallbacks) {
        cb(buildResult)
      }
    },
    async resolveId(id, importer, opts) {
      for (const handler of resolveIdHandlers) {
        const result = await handler.call(this, id, importer, opts)
        if (result) {
          return result
        }
      }
    },
    async load(id) {
      for (const handler of loadHandlers) {
        const result = await handler.call(this, id)
        if (result) {
          return result
        }
      }
    },
    closeBundle() {
      if (!this.meta.watchMode) {
        for (const cb of onDisposeCallbacks) {
          cb()
        }
      }
    },
    closeWatcher() {
      for (const cb of onDisposeCallbacks) {
        cb()
      }
    },
  }
}

function createResolveIdHandler(
  options: esbuild.OnResolveOptions,
  callback: EsbuildOnResolveCallback,
): ResolveIdHandler {
  return async function (id, importer, opts) {
    const [importerWithoutNamespace, importerNamespace] =
      idToPathAndNamespace(importer)
    if (
      options.namespace !== undefined &&
      options.namespace !== importerNamespace
    ) {
      return
    }
    if (options.filter !== undefined && !options.filter.test(id)) {
      return
    }

    const result = await callback({
      path: id,
      importer: importerWithoutNamespace ?? '',
      namespace: importerNamespace,
      resolveDir: dirname(importerWithoutNamespace ?? ''),
      kind:
        importerWithoutNamespace === undefined
          ? 'entry-point'
          : opts.kind === 'import'
            ? 'import-statement'
            : opts.kind,
      pluginData: {},
      with: {},
    })
    if (!result) return
    if (result.errors && result.errors.length > 0) {
      throw new AggregateError(result.errors)
    }
    if (
      (result.warnings && result.warnings.length > 0) ||
      (result.watchDirs && result.watchDirs.length > 0) ||
      !result.path
    ) {
      throw new Error('not implemented')
    }
    for (const file of result.watchFiles ?? []) {
      this.addWatchFile(file)
    }

    return {
      id: result.namespace ? `${result.namespace}:${result.path}` : result.path,
      external: result.external,
      moduleSideEffects: result.sideEffects,
    }
  }
}

function createLoadHandler(
  options: esbuild.OnLoadOptions,
  callback: EsbuildOnLoadCallback,
): LoadHandler {
  const textDecoder = new TextDecoder()
  return async function (id) {
    const [idWithoutNamespace, idNamespace] = idToPathAndNamespace(id)
    if (options.namespace !== undefined && options.namespace !== idNamespace) {
      return
    }
    if (options.filter !== undefined && !options.filter.test(id)) {
      return
    }

    const result = await callback.call(this, {
      path: idWithoutNamespace,
      namespace: idNamespace,
      suffix: '',
      pluginData: {},
      with: {},
    })
    if (!result) return
    if (result.errors && result.errors.length > 0) {
      throw new AggregateError(result.errors)
    }
    if (
      (result.warnings && result.warnings.length > 0) ||
      (result.watchDirs && result.watchDirs.length > 0) ||
      !result.contents
    ) {
      throw new Error('not implemented')
    }
    for (const file of result.watchFiles ?? []) {
      this.addWatchFile(file)
    }

    return {
      code:
        typeof result.contents === 'string'
          ? result.contents
          : textDecoder.decode(result.contents),
      moduleType: result.loader,
    }
  }
}

function idToPathAndNamespace(id: string): [path: string, namespace: string]
function idToPathAndNamespace(
  id: string | undefined,
): [path: string | undefined, namespace: string]
function idToPathAndNamespace(
  id: string | undefined,
): [path: string | undefined, namespace: string] {
  if (id === undefined) return [undefined, 'file']

  const namespaceIndex = id.indexOf(':')
  if (namespaceIndex >= 0) {
    return [id.slice(namespaceIndex + 1), id.slice(0, namespaceIndex)]
  } else {
    return [id, 'file']
  }
}
