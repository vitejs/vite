import type {
  BundledDevUpdatePayload,
  Update,
  UpdatePayload,
} from '#types/hmrPayload'
import { HMRClient, HMRContext, type HMRLogger } from '../shared/hmr'
import type { NormalizedModuleRunnerTransport } from '../shared/moduleRunnerTransport'

/** the subset of `__rolldown_runtime__` the HMR client uses */
export interface RolldownRuntimeLike {
  staticImports: Map<string, { edges: string[] }>
  getImporters(id: string): string[]
  getImportedBindings(importer: string, id: string): string[] | undefined
  isEntry(id: string): boolean
  isExecuted(id: string): boolean
  hasFactory(id: string): boolean
  removeModuleCache(id: string): void
  initModule(id: string): unknown
  loadExports(id: string): unknown
}

interface PropagationBoundary {
  boundary: string
  acceptedVia: string
  isWithinCircularImport: boolean
}

type HmrUpdate =
  | { type: 'full-reload'; reason: string }
  | {
      type: 'update'
      boundaries: PropagationBoundary[]
      updateSet: string[]
    }

export interface BundledDevHMRClientOptions {
  base: string
  partialAccept: boolean
  /** returning `'reload'` aborts the apply — the hook reloads the page itself */
  beforeApply: () => 'reload' | 'continue'
}

export class BundledDevHMRClient extends HMRClient {
  private applyQueue = Promise.resolve()
  private lastSeq = 0
  private reloadPending = false

  constructor(
    logger: HMRLogger,
    transport: NormalizedModuleRunnerTransport,
    private runtime: RolldownRuntimeLike,
    private options: BundledDevHMRClientOptions,
  ) {
    super(logger, transport, async () => {
      throw new Error(
        'unreachable: full-bundle mode applies patches through its own queue',
      )
    })
  }

  isSelfAccepted(id: string): boolean {
    return this.acceptsDep(id, id)
  }

  acceptsDep(parent: string, id: string): boolean {
    return (
      this.hotModulesMap
        .get(parent)
        ?.callbacks.some((c) => !c.exports && c.deps.includes(id)) ?? false
    )
  }

  private getAcceptedExports(id: string): Set<string> | undefined {
    let accepted: Set<string> | undefined
    for (const c of this.hotModulesMap.get(id)?.callbacks ?? []) {
      if (!c.exports) continue
      accepted ??= new Set()
      for (const name of c.exports) accepted.add(name)
    }
    return accepted
  }

  private acceptsAllExports(id: string, accepted: Set<string>): boolean {
    const exports = this.runtime.loadExports(id)
    if (typeof exports !== 'object' || exports == null) return false
    return Object.keys(exports).every((name) => accepted.has(name))
  }

  private importsOnlyAccepted(
    parent: string,
    id: string,
    accepted: Set<string>,
  ): boolean {
    if (!this.options.partialAccept) return false
    return (
      this.runtime
        .getImportedBindings(parent, id)
        ?.every((name) => accepted.has(name)) ?? false
    )
  }

  computeHmrUpdate(
    changedIds: string[],
    opts?: { firstInvalidatedBy?: string },
  ): HmrUpdate {
    const boundaries: PropagationBoundary[] = []
    const updateSet = new Set<string>()
    const traversedModules = new Set<string>()
    for (const changed of changedIds) {
      if (!this.runtime.isExecuted(changed)) {
        continue
      }
      const fullReload = this.bubble(
        changed,
        [changed],
        updateSet,
        boundaries,
        opts?.firstInvalidatedBy,
        traversedModules,
      )
      if (fullReload) return fullReload
    }
    return { type: 'update', boundaries, updateSet: [...updateSet] }
  }

  private bubble(
    id: string,
    stack: string[],
    updateSet: Set<string>,
    boundaries: PropagationBoundary[],
    firstInvalidatedBy: string | undefined,
    traversedModules: Set<string>,
  ): HmrUpdate | undefined {
    if (traversedModules.has(id)) return
    traversedModules.add(id)
    updateSet.add(id)
    if (firstInvalidatedBy !== undefined && id === firstInvalidatedBy) {
      return {
        type: 'full-reload',
        reason: `update propagated back to ${firstInvalidatedBy}, which already called \`import.meta.hot.invalidate()\``,
      }
    }
    const acceptedExports = this.getAcceptedExports(id)
    const selfAccepted =
      this.isSelfAccepted(id) ||
      (acceptedExports !== undefined &&
        this.acceptsAllExports(id, acceptedExports))
    if (selfAccepted || acceptedExports) {
      boundaries.push({
        boundary: id,
        acceptedVia: id,
        isWithinCircularImport: this.isNodeWithinCircularImports(id, stack),
      })
      if (selfAccepted) return
    }
    const parents = this.runtime
      .getImporters(id)
      .filter((p) => this.runtime.isExecuted(p))
    // No importer that ran: either an entry, which `applyUpdate` handles, or a
    // module that is no longer imported, where the update stops.
    if (!parents.length) return
    for (const parent of parents) {
      const subChain = [...stack, parent]
      if (this.acceptsDep(parent, id)) {
        boundaries.push({
          boundary: parent,
          acceptedVia: id,
          isWithinCircularImport: this.isNodeWithinCircularImports(
            parent,
            subChain,
          ),
        })
        continue
      }
      if (
        acceptedExports &&
        this.importsOnlyAccepted(parent, id, acceptedExports)
      ) {
        continue
      }
      if (!stack.includes(parent)) {
        const fullReload = this.bubble(
          parent,
          subChain,
          updateSet,
          boundaries,
          firstInvalidatedBy,
          traversedModules,
        )
        if (fullReload) return fullReload
      }
    }
  }

  /**
   * Check importers recursively if it's an import loop. An accepted module within
   * an import loop cannot recover its execution order and should be reloaded.
   *
   * @param node The node that accepts HMR and is a boundary
   * @param nodeChain The chain of nodes/imports that lead to the node.
   *   (The last node in the chain imports the `node` parameter)
   * @param currentChain The current chain tracked from the `node` parameter
   * @param traversedModules The set of modules that have traversed
   */
  private isNodeWithinCircularImports(
    node: string,
    nodeChain: string[],
    currentChain: string[] = [node],
    traversedModules = new Set<string>(),
  ): boolean {
    // To help visualize how each parameter works, imagine this import graph:
    //
    // A -> B -> C -> ACCEPTED -> D -> E -> NODE
    //      ^--------------------------|
    //
    // ACCEPTED: the node that accepts HMR. the `node` parameter.
    // NODE    : the initial node that triggered this HMR.
    //
    // This function will return true in the above graph, which:
    // `node`         : ACCEPTED
    // `nodeChain`    : [NODE, E, D, ACCEPTED]
    // `currentChain` : [ACCEPTED, C, B]
    //
    // It works by checking if any `node` importers are within `nodeChain`, which
    // means there's an import loop with a HMR-accepted module in it.

    if (traversedModules.has(node)) {
      return false
    }
    traversedModules.add(node)

    for (const importer of this.runtime.getImporters(node)) {
      // Node may import itself which is safe
      if (importer === node) continue

      // Check circular imports
      const importerIndex = nodeChain.indexOf(importer)
      if (importerIndex > -1) {
        // Log extra debug information so users can fix and remove the circular imports
        // Following explanation above:
        // `importer`                    : E
        // `currentChain` reversed       : [B, C, ACCEPTED]
        // `nodeChain` sliced & reversed : [D, E]
        // Combined                      : [E, B, C, ACCEPTED, D, E]
        const importChain = [
          importer,
          ...currentChain.toReversed(),
          ...nodeChain.slice(importerIndex, -1).reverse(),
        ]
        this.logger.debug(
          `circular imports detected: ${importChain.join(' -> ')}`,
        )
        return true
      }

      // Continue recursively
      if (!currentChain.includes(importer)) {
        const result = this.isNodeWithinCircularImports(
          importer,
          nodeChain,
          [...currentChain, importer],
          traversedModules,
        )
        if (result) return result
      }
    }
    return false
  }

  handlePush(payload: BundledDevUpdatePayload): void {
    this.applyQueue = this.applyQueue
      .then(() => this.applyPush(payload))
      .catch((err) => {
        this.warnFailedUpdate(err, payload.changedIds)
      })
  }

  invalidateLocally(id: string, message?: string): void {
    this.logger.debug(`invalidate ${id}${message ? `: ${message}` : ''}`)
    this.applyQueue = this.applyQueue
      .then(() => this.applyInvalidate(id))
      .catch((err) => {
        this.warnFailedUpdate(err, id)
      })
  }

  handleModuleCacheRemoval(id: string): void {
    const disposer = this.disposeMap.get(id)
    if (disposer) {
      disposer(this.dataMap.get(id))
    }
  }

  private async applyPush({
    changedIds,
    url,
    seq,
  }: BundledDevUpdatePayload): Promise<void> {
    if (this.reloadPending) return
    if (seq !== this.lastSeq + 1) {
      this.requestFullReload(
        `hmr update sequence gap (expected ${this.lastSeq + 1}, got ${seq})`,
      )
      return
    }
    this.lastSeq = seq

    const update = this.computeHmrUpdate(changedIds)
    if (update.type === 'full-reload') {
      this.requestFullReload(update.reason)
      return
    }
    // none of the changed modules has run in this page
    if (!update.updateSet.length) return
    // A reload found with the old import edges saves fetching the patch.
    // `applyUpdate` checks again with the new import edges.
    const entry = this.findEntryWithoutBoundary(update)
    if (entry !== undefined) {
      this.requestFullReload(`no hmr boundary found for module \`${entry}\``)
      return
    }

    const notify = update.boundaries.length > 0
    const listenerPayload = this.toUpdatePayload(update.boundaries, undefined)
    if (notify) await this.notifyListeners('vite:beforeUpdate', listenerPayload)
    if (this.options.beforeApply() === 'reload') return

    try {
      await import(/* @vite-ignore */ this.options.base + url)
    } catch {
      this.requestFullReload(`failed to import hmr patch ${url}`)
      return
    }

    await this.applyUpdate(update)
    if (notify) await this.notifyListeners('vite:afterUpdate', listenerPayload)
  }

  private async applyInvalidate(id: string): Promise<void> {
    if (this.reloadPending) return
    const firstInvalidatedBy = this.currentFirstInvalidatedBy ?? id
    const importers = this.runtime
      .getImporters(id)
      .filter((p) => this.runtime.isExecuted(p))
    if (!importers.length) {
      this.requestFullReload(
        `no importers to handle \`import.meta.hot.invalidate()\` called by \`${id}\``,
      )
      return
    }

    // no rebuild happened, so there is no patch to fetch
    const update = this.computeHmrUpdate(importers, { firstInvalidatedBy })
    if (update.type === 'full-reload') {
      this.requestFullReload(update.reason)
      return
    }

    const notify = update.boundaries.length > 0
    const listenerPayload = this.toUpdatePayload(
      update.boundaries,
      firstInvalidatedBy,
    )
    if (notify) await this.notifyListeners('vite:beforeUpdate', listenerPayload)
    if (this.options.beforeApply() === 'reload') return
    await this.applyUpdate(update, firstInvalidatedBy)
    if (notify) await this.notifyListeners('vite:afterUpdate', listenerPayload)
  }

  /**
   * Find an entry in the update that nothing runs again. The page started each
   * entry, and only a page load starts it again, so such an entry should be
   * reloaded.
   *
   * The modules run again with the import edges of the patch. Called before the
   * patch is imported, it uses the old import edges: a found entry still needs
   * a reload, but `undefined` must be checked again after the import, as the
   * patch can remove an import.
   */
  private findEntryWithoutBoundary(
    update: Extract<HmrUpdate, { type: 'update' }>,
  ): string | undefined {
    // To help visualize how it works, imagine this import graph, where c.js is
    // edited:
    //
    // a.js (entry) -> c.js <- d.js (accepts c.js)
    //   ^--------------|
    //
    // `update.boundaries`: [d.js accepts c.js]
    // `update.updateSet` : [c.js, a.js]
    //
    // d.js runs c.js again, and c.js runs a.js again, because a module runs its
    // static imports that were removed from the module cache. So this function
    // will return undefined in the above graph. Without d.js, it will return
    // a.js.
    const executedByBoundaries = new Set<string>()
    const queue = update.boundaries.map(({ acceptedVia }) => acceptedVia)
    while (queue.length) {
      const id = queue.pop()!
      if (executedByBoundaries.has(id) || !update.updateSet.includes(id)) {
        continue
      }
      executedByBoundaries.add(id)
      // an `import()` may not run again, so only static imports count
      queue.push(...(this.runtime.staticImports.get(id)?.edges ?? []))
    }
    return update.updateSet.find(
      (id) => this.runtime.isEntry(id) && !executedByBoundaries.has(id),
    )
  }

  private async applyUpdate(
    update: Extract<HmrUpdate, { type: 'update' }>,
    firstInvalidatedBy?: string,
  ): Promise<void> {
    for (const id of update.updateSet) {
      if (!this.runtime.hasFactory(id)) {
        this.requestFullReload(`no factory for module \`${id}\``)
        return
      }
    }
    // the patch may have removed an import that ran an entry again
    const entry = this.findEntryWithoutBoundary(update)
    if (entry !== undefined) {
      this.requestFullReload(`no hmr boundary found for module \`${entry}\``)
      return
    }

    // collect callbacks before the caches are removed
    const applies = update.boundaries.map(
      ({ boundary, acceptedVia, isWithinCircularImport }) => ({
        boundary,
        acceptedVia,
        isWithinCircularImport,
        callbacks:
          this.hotModulesMap
            .get(boundary)
            ?.callbacks.filter((c) => c.deps.includes(acceptedVia)) ?? [],
      }),
    )

    for (const id of update.updateSet) {
      this.runtime.removeModuleCache(id)
    }

    for (const {
      boundary,
      acceptedVia,
      isWithinCircularImport,
      callbacks,
    } of applies) {
      let fresh: unknown
      try {
        this.runtime.initModule(acceptedVia)
        fresh = this.runtime.loadExports(acceptedVia)
      } catch (err) {
        if (isWithinCircularImport) {
          this.requestFullReload(
            `${acceptedVia} failed to apply HMR as it's within a circular import. Reloading page to reset the execution order.`,
          )
          return
        }
        throw err
      }
      try {
        this.currentFirstInvalidatedBy = firstInvalidatedBy
        for (const { deps, fn } of callbacks) {
          fn(
            deps.map((dep) =>
              dep === acceptedVia ? (fresh as any) : undefined,
            ),
          )
        }
      } finally {
        this.currentFirstInvalidatedBy = undefined
      }
      this.logger.debug(
        `hot updated: ${
          boundary === acceptedVia ? boundary : `${acceptedVia} via ${boundary}`
        }`,
      )
    }
  }

  private toUpdatePayload(
    boundaries: PropagationBoundary[],
    firstInvalidatedBy: string | undefined,
  ): UpdatePayload {
    const updates: Update[] = boundaries.map(
      ({ boundary, acceptedVia, isWithinCircularImport }) => ({
        type: 'js-update',
        path: boundary,
        acceptedPath: acceptedVia,
        timestamp: Date.now(),
        isWithinCircularImport,
        firstInvalidatedBy,
      }),
    )
    return { type: 'update', updates }
  }

  private requestFullReload(reason: string): void {
    if (this.reloadPending) return
    this.reloadPending = true
    this.logger.debug(`full reload needed: ${reason}`)
    this.send({
      type: 'custom',
      event: 'vite:bundled-dev:reload-needed',
      data: { reason },
    })
  }
}

export class BundledDevHMRContext extends HMRContext {
  constructor(
    private bundledDevClient: BundledDevHMRClient,
    private owner: string,
  ) {
    super(bundledDevClient, owner)
  }

  override invalidate(message: string): void {
    this.bundledDevClient.notifyListeners('vite:invalidate', {
      path: this.owner,
      message,
      firstInvalidatedBy:
        this.bundledDevClient.currentFirstInvalidatedBy ?? this.owner,
    })
    this.bundledDevClient.invalidateLocally(this.owner, message)
  }
}
