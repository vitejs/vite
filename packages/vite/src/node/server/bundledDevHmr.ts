import path from 'node:path'
import type { ModuleInfo, PartialResolvedId } from 'rolldown'
import { FS_PREFIX } from '../constants'
import { monotonicDateNow, removeTimestampQuery } from '../utils'
import { cleanUrl, withTrailingSlash, wrapId } from '../../shared/utils'
import { getHookHandler } from '../plugins'
import type { Plugin } from '../plugin'
import {
  ignoreDeprecationWarnings,
  warnFutureDeprecation,
} from '../deprecations'
import type { ViteDevServer } from '..'
import { EnvironmentModuleGraph, EnvironmentModuleNode } from './moduleGraph'
import {
  type HmrContext,
  type HotUpdateOptions,
  debugHmr,
  readModifiedFile,
} from './hmr'
import {
  BasicMinimalPluginContext,
  basePluginContextMeta,
} from './pluginContainer'
import type { ModuleNode } from './mixedModuleGraph'
import type { DevEnvironment } from './environment'
import type { BundledDev } from './bundledDev'

// Declared structurally to avoid depending on rolldown's experimental export
// surface.
interface RolldownHotUpdateArgs {
  type: 'create' | 'update' | 'delete'
  file: string
  modules: string[]
}

interface RolldownHotUpdateContext {
  getModuleInfo: (id: string) => ModuleInfo | null
  getModuleIds: () => IterableIterator<string>
}

type RolldownHotUpdateHandler = (
  this: RolldownHotUpdateContext,
  options: RolldownHotUpdateArgs,
) => Promise<string[] | undefined>

/**
 * Facade over the rolldown dev engine's module graph. A node per id is created
 * exactly once — plugins compare nodes by reference and stash state on them —
 * and its `info` / `importers` / `importedModules` are live views over the
 * engine registry.
 */
export class BundledModuleGraph extends EnvironmentModuleGraph {
  /** @internal */
  _root: string
  /** @internal */
  _getModuleInfo: ((id: string) => ModuleInfo | null) | undefined
  /** @internal */
  _getModuleIds: (() => IterableIterator<string>) | undefined
  /** @internal */
  _onInvalidateModule: ((mod: EnvironmentModuleNode) => void) | undefined
  /** @internal */
  _onInvalidateAll: (() => void) | undefined

  constructor(
    environment: string,
    root: string,
    resolveId: (url: string) => Promise<PartialResolvedId | null>,
  ) {
    super(environment, resolveId)
    this._root = root
  }

  /** @internal */
  _updateContext(ctx: RolldownHotUpdateContext): void {
    this._getModuleInfo = (id) => ctx.getModuleInfo(id)
    this._getModuleIds = () => ctx.getModuleIds()
  }

  ensureBundledNode(id: string): EnvironmentModuleNode {
    const existing = this.idToModuleMap.get(id)
    if (existing) {
      return existing
    }
    const mod = new EnvironmentModuleNode(this._urlForId(id), this.environment)
    mod.id = id
    mod.file = cleanUrl(id)
    // Writes are dropped — mutating graph nodes is a no-op under bundled dev.
    const lazy = (prop: string, get: () => unknown) =>
      Object.defineProperty(mod, prop, {
        configurable: true,
        enumerable: true,
        get,
        set: () => { },
      })
    lazy('info', () => this._getModuleInfo?.(id) ?? undefined)
    lazy('importers', () => {
      const info = this._getModuleInfo?.(id)
      return this._nodeSet(info?.importers, info?.dynamicImporters)
    })
    lazy('importedModules', () => {
      const info = this._getModuleInfo?.(id)
      return this._nodeSet(info?.importedIds, info?.dynamicallyImportedIds)
    })
    this.idToModuleMap.set(id, mod)
    if (!this.urlToModuleMap.has(mod.url)) {
      this.urlToModuleMap.set(mod.url, mod)
    }
    let fileMappedModules = this.fileToModulesMap.get(mod.file)
    if (!fileMappedModules) {
      fileMappedModules = new Set()
      this.fileToModulesMap.set(mod.file, fileMappedModules)
    }
    fileMappedModules.add(mod)
    return mod
  }

  override getModuleById(id: string): EnvironmentModuleNode | undefined {
    const mod = super.getModuleById(id)
    if (mod) {
      return mod
    }
    const cleanId = removeTimestampQuery(id)
    if (this._getModuleInfo?.(cleanId)) {
      return this.ensureBundledNode(cleanId)
    }
    return undefined
  }

  override getModulesByFile(
    file: string,
  ): Set<EnvironmentModuleNode> | undefined {
    if (this._getModuleIds) {
      for (const id of this._getModuleIds()) {
        if (!this.idToModuleMap.has(id) && cleanUrl(id) === file) {
          this.ensureBundledNode(id)
        }
      }
    }
    return super.getModulesByFile(file)
  }

  /** Buffers into the current hot-update event's affected set; a no-op outside one. */
  override invalidateModule(mod: EnvironmentModuleNode): void {
    this._onInvalidateModule?.(mod)
  }

  override invalidateAll(): void {
    this._onInvalidateAll?.()
  }

  private _nodeSet(
    ...idLists: (readonly string[] | undefined)[]
  ): Set<EnvironmentModuleNode> {
    const nodes = new Set<EnvironmentModuleNode>()
    for (const ids of idLists) {
      for (const id of ids ?? []) {
        nodes.add(this.ensureBundledNode(id))
      }
    }
    return nodes
  }

  private _urlForId(id: string): string {
    if (id.startsWith('\0') || id.startsWith('virtual:')) {
      return wrapId(id)
    }
    if (id.startsWith(withTrailingSlash(this._root))) {
      return id.slice(this._root.length)
    }
    if (path.isAbsolute(id)) {
      return path.posix.join(FS_PREFIX, id)
    }
    return id
  }
}

interface HotUpdateEventState {
  timestamp: number
  invalidatedIds: Set<string>
  envOptions?: HotUpdateOptions
  mixedCtx?: HmrContext
}

/**
 * Runs Vite's `hotUpdate` / `handleHotUpdate` plugin contracts on top of
 * rolldown's `hotUpdate` hook: one wrapper per plugin (order preserved), a
 * pre-ordered hook opens per-file event state, a post-ordered hook merges
 * buffered invalidations.
 */
export class BundledDevHotUpdateAdapter {
  private server: ViteDevServer | undefined
  private states = new Map<string, HotUpdateEventState>()
  private activeFile: string | undefined
  private legacyContext: BasicMinimalPluginContext

  constructor(
    private environment: DevEnvironment,
    private graph: BundledModuleGraph,
    private bundledDev: BundledDev,
  ) {
    this.legacyContext = new BasicMinimalPluginContext(
      { ...basePluginContextMeta, watchMode: true },
      environment.getTopLevelConfig().logger,
    )
    graph._onInvalidateModule = (mod) => {
      const state = this.activeFile
        ? this.states.get(this.activeFile)
        : undefined
      if (state && mod.id) {
        state.invalidatedIds.add(mod.id)
      } else {
        debugHmr?.(
          `invalidateModule(${mod.id}) outside a hot-update event is a no-op under bundled dev`,
        )
      }
    }
    graph._onInvalidateAll = () => {
      this.bundledDev.requestFullBuildReload()
    }
  }

  setServer(server: ViteDevServer): void {
    this.server = server
  }

  wrapPlugins(plugins: unknown[]): void {
    // Only wrap top-level vite plugins: a plugin swapped in per environment
    // via `applyToEnvironment` is a rolldown plugin whose `hotUpdate` already
    // expects raw ids. `plugins[i]` is a clone of `environment.plugins[i]`,
    // so the original is looked up by index, with a name check.
    const environmentPlugins = this.environment.plugins
    const topLevelPlugins = new Set(
      this.environment.getTopLevelConfig().plugins,
    )
    let wrapped = 0
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i] as Plugin
      if (!plugin || typeof plugin !== 'object') continue
      const source = environmentPlugins[i]
      if (
        !source ||
        source.name !== plugin.name ||
        !topLevelPlugins.has(source)
      ) {
        continue
      }
      if (plugin.hotUpdate) {
        ; (plugin as any).hotUpdate = this._wrapHotUpdate(plugin)
        wrapped++
      } else if (plugin.handleHotUpdate) {
        ; (plugin as any).hotUpdate = this._wrapHandleHotUpdate(plugin)
        wrapped++
      }
    }

    const adapter = this
    const pre: any = {
      name: 'vite:bundled-dev-hot-update-pre',
      // lets the module graph facade serve reads outside hot-update events
      buildStart(this: RolldownHotUpdateContext) {
        adapter.graph._updateContext(this)
      },
    }
    if (wrapped > 0) {
      pre.hotUpdate = {
        order: 'pre',
        handler(
          this: RolldownHotUpdateContext,
          options: RolldownHotUpdateArgs,
        ) {
          adapter.graph._updateContext(this)
          adapter.activeFile = options.file
          adapter.states.set(options.file, {
            timestamp: monotonicDateNow(),
            invalidatedIds: new Set(),
          })
          return adapter._expandModulesByFile(options)
        },
      }
    }
    plugins.unshift(pre)
    if (wrapped > 0) {
      plugins.push({
        name: 'vite:bundled-dev-hot-update-post',
        hotUpdate: {
          order: 'post',
          handler(options: RolldownHotUpdateArgs) {
            const state = adapter.states.get(options.file)
            adapter.states.delete(options.file)
            if (adapter.activeFile === options.file) {
              adapter.activeFile = undefined
            }
            if (state && state.invalidatedIds.size > 0) {
              const merged = new Set(options.modules)
              for (const id of state.invalidatedIds) {
                merged.add(id)
              }
              return [...merged]
            }
          },
        },
      })
    }
  }

  private _wrapHotUpdate(plugin: Plugin): unknown {
    const hook = plugin.hotUpdate!
    const handler = getHookHandler(hook)
    const adapter = this
    const wrappedHandler: RolldownHotUpdateHandler = async function(options) {
      adapter.graph._updateContext(this)
      const state = adapter._ensureState(options.file)
      const toNodes = () =>
        options.modules.map((id) => adapter.graph.ensureBundledNode(id))
      let viteOptions = state.envOptions
      if (!viteOptions) {
        viteOptions = state.envOptions = {
          type: options.type,
          file: options.file,
          timestamp: state.timestamp,
          modules: toNodes(),
          read: () => readModifiedFile(options.file),
          server: adapter._requireServer(),
        }
      } else {
        // vite threads one shared options object through the chain so
        // cross-plugin mutations stay visible; only the module set is rebuilt
        viteOptions.modules = toNodes()
      }
      const result = await handler.call(
        adapter.environment.pluginContainer.minimalContext as any,
        viteOptions,
      )
      if (result) {
        return result
          .map((mod: EnvironmentModuleNode) => mod.id)
          .filter((id: string | null): id is string => id != null)
      }
    }
    return typeof hook === 'object' && hook.order
      ? { order: hook.order, handler: wrappedHandler }
      : wrappedHandler
  }

  private _wrapHandleHotUpdate(plugin: Plugin): unknown {
    const hook = plugin.handleHotUpdate!
    const handler = getHookHandler(hook)
    const config = this.environment.getTopLevelConfig()
    const adapter = this
    const wrappedHandler: RolldownHotUpdateHandler = async function(options) {
      // vite parity: the legacy hook only fires for updates
      if (options.type !== 'update') {
        return
      }
      adapter.graph._updateContext(this)
      const state = adapter._ensureState(options.file)
      const server = adapter._requireServer()
      const mixedGraph = ignoreDeprecationWarnings(() => server.moduleGraph)
      const toMixed = (id: string) =>
        mixedGraph.getBackwardCompatibleModuleNode(
          adapter.graph.ensureBundledNode(id),
        )
      let ctx = state.mixedCtx
      if (!ctx) {
        ctx = state.mixedCtx = {
          file: options.file,
          timestamp: state.timestamp,
          modules: options.modules.map(toMixed),
          read: () => readModifiedFile(options.file),
          server,
        }
      } else {
        // an interleaved new-contract hook may have replaced the affected
        // set — reconcile while keeping the event's shared context object
        const currentIds = new Set(options.modules)
        ctx.modules = ctx.modules.filter(
          (mod) => mod.id != null && currentIds.has(mod.id),
        )
        for (const id of options.modules) {
          if (!ctx.modules.some((mod) => mod.id === id)) {
            ctx.modules.push(toMixed(id))
          }
        }
      }
      warnFutureDeprecation(
        config,
        'removePluginHookHandleHotUpdate',
        `Used in plugin "${plugin.name}".`,
        false,
      )
      const result = await handler.call(adapter.legacyContext as any, ctx)
      if (result) {
        ctx.modules = result
        return result
          .map((mod: ModuleNode) => mod.id)
          .filter((id: string | null): id is string => id != null)
      }
    }
    return typeof hook === 'object' && hook.order
      ? { order: hook.order, handler: wrappedHandler }
      : wrappedHandler
  }

  private _expandModulesByFile(
    options: RolldownHotUpdateArgs,
  ): string[] | undefined {
    const getModuleIds = this.graph._getModuleIds
    if (!getModuleIds) return undefined
    const merged = new Set(options.modules)
    const before = merged.size
    for (const id of getModuleIds()) {
      if (id.includes('?rolldown-lazy=')) continue
      if (!merged.has(id) && cleanUrl(id) === options.file) {
        merged.add(id)
      }
    }
    return merged.size > before ? [...merged] : undefined
  }

  private _ensureState(file: string): HotUpdateEventState {
    let state = this.states.get(file)
    if (!state) {
      state = { timestamp: monotonicDateNow(), invalidatedIds: new Set() }
      this.states.set(file, state)
    }
    this.activeFile = file
    return state
  }

  private _requireServer(): ViteDevServer {
    if (!this.server) {
      throw new Error(
        'a hotUpdate hook fired before the dev server was ready',
      )
    }
    return this.server
  }
}
