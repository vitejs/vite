import type {
  BundledDevUpdatePayload,
  Update,
  UpdatePayload,
} from '#types/hmrPayload'
import type { ModuleNamespace } from '#types/hot'
import { HMRClient, HMRContext, type HMRLogger } from './hmr'
import type { NormalizedModuleRunnerTransport } from './moduleRunnerTransport'

/** the subset of `__rolldown_runtime__` the HMR client uses */
export interface RolldownRuntimeLike {
  staticImports: Map<string, { edges: string[] }>
  getImporters(id: string): string[]
  getImportedBindings(importer: string, id: string): string[] | undefined
  isEntry(id: string): boolean
  isExecuted(id: string): boolean
  canRun(updateIds: Set<string>): boolean
  removeModuleCache(id: string): void
  initModule(id: string): unknown
  loadExports(id: string): unknown
  appliedGen: number
  knownGen: number
  registerCount: number
  markStale(ids: string[], gen: number): void
  missedUpdate(): boolean
  hasCaughtUpChanges(): boolean
  ensureRunnable(updateIds: Set<string>): Promise<EnsureRunnableResult>
  refetchDropped(): Promise<void>
}

type EnsureRunnableResult =
  | { type: 'ready' }
  | { type: 'caught-up'; changedIds: string[] }
  | { type: 'reload'; reason: string }

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

type RunnableUpdate = Extract<HmrUpdate, { type: 'update' }> & {
  /** the changed modules from catch-ups that the walk added */
  caughtUpIds: string[]
  /** `runtime.knownGen` when the update became runnable */
  gen: number
  /** `runtime.registerCount` when the walk ran */
  registerCount: number
}

export interface BundledDevHMRClientOptions {
  partialAccept: boolean
  /** returning `'reload'` aborts the apply — the hook reloads the page itself */
  beforeApply: () => 'reload' | 'continue'
  /**
   * Only used for the plain `update` payloads this client inherits from
   * `HMRClient`. Full-bundle updates never go through it, but the module runner
   * uses the same client for both modes, so it needs a working implementation.
   */
  importUpdatedModule?: (update: Update) => Promise<ModuleNamespace>
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
    super(
      logger,
      transport,
      options.importUpdatedModule ??
        (async () => {
          throw new Error(
            'unreachable: full-bundle mode applies patches through its own queue',
          )
        }),
    )
  }

  resetForFullReload(runtime: RolldownRuntimeLike): Promise<void> {
    this.applyQueue = this.applyQueue.then(() => {
      this.runtime = runtime
      this.lastSeq = 0
      this.reloadPending = false
      this.currentFirstInvalidatedBy = undefined
      this.clear()
    })
    return this.applyQueue
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

  /**
   * `caughtUpIds` are walked after `changedIds` and without
   * `firstInvalidatedBy`: a new edit of the module that called `invalidate()`
   * is a normal update.
   */
  computeHmrUpdate(
    changedIds: string[],
    opts?: { firstInvalidatedBy?: string; caughtUpIds?: string[] },
  ): HmrUpdate {
    const boundaries: PropagationBoundary[] = []
    const updateSet = new Set<string>()
    const traversedModules = new Set<string>()
    const walks: [string[], string | undefined][] = [
      [changedIds, opts?.firstInvalidatedBy],
      [opts?.caughtUpIds ?? [], undefined],
    ]
    for (const [ids, firstInvalidatedBy] of walks) {
      for (const changed of ids) {
        if (!this.runtime.isExecuted(changed)) {
          continue
        }
        const fullReload = this.bubble(
          changed,
          [changed],
          updateSet,
          boundaries,
          firstInvalidatedBy,
          traversedModules,
        )
        if (fullReload) return fullReload
      }
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

  /**
   * Pulls the missed updates and applies them, with the changes that a
   * catch-up outside an update brought (a lazy load, for example). A push can
   * come before the page ran its output, and the output then runs the code from
   * before the push, so the client also calls this after the output ran.
   * Resolves when the catch-up was applied or failed.
   */
  catchUpMissedUpdates(): Promise<void> {
    return (this.applyQueue = this.applyQueue
      .then(async () => {
        if (
          this.reloadPending ||
          (!this.runtime.missedUpdate() && !this.runtime.hasCaughtUpChanges())
        ) {
          return
        }
        await this.runUpdate([])
      })
      .catch((err) => {
        this.warnFailedUpdate(err, [])
      }))
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
    staleIds,
    gen,
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

    const alreadyApplied = gen <= this.runtime.appliedGen
    this.runtime.markStale(staleIds, gen)
    // a catch-up in an earlier response already brought these changes
    if (!alreadyApplied) {
      await this.runUpdate(changedIds)
    }
    // not awaited: the next update does not wait for code that may never run
    if (!this.reloadPending) void this.runtime.refetchDropped()
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

    await this.runUpdate(importers, firstInvalidatedBy)
  }

  /**
   * Lazy loads and `loadDynamic` are not queued behind updates. When one of
   * them changes the client during an `await`, `applyUpdate` finds the update
   * outdated, and it is prepared again.
   */
  private async runUpdate(
    changedIds: string[],
    firstInvalidatedBy?: string,
  ): Promise<void> {
    let caughtUpIds: string[] = []
    for (let attempts = 1; ; attempts++) {
      const update = await this.prepareUpdate(
        changedIds,
        caughtUpIds,
        firstInvalidatedBy,
      )
      if (!update) return
      // none of the changed modules has run in this page
      if (!update.updateSet.length) {
        this.markApplied(update)
        return
      }

      const notify = update.boundaries.length > 0
      const listenerPayload = this.toUpdatePayload(
        update.boundaries,
        firstInvalidatedBy,
      )
      if (notify) {
        await this.notifyListeners('vite:beforeUpdate', listenerPayload)
      }
      if (this.options.beforeApply() === 'reload') return
      if (await this.applyUpdate(update, firstInvalidatedBy)) {
        if (notify) {
          await this.notifyListeners('vite:afterUpdate', listenerPayload)
        }
        return
      }
      if (attempts === 3) {
        this.requestFullReload('the page kept changing during the hmr update')
        return
      }
      caughtUpIds = update.caughtUpIds
    }
  }

  /**
   * Walk from `changedIds` and make sure every module of the update can run,
   * requesting the missing code from the server. Nothing is removed from the
   * module cache yet. Returns `undefined` when a full reload was requested.
   *
   * A response can report updates this client did not handle yet (a catch-up).
   * Their changed modules join the walk, which runs once more. A module that
   * ran during the request may import a module of the update, so a changed
   * `registerCount` also makes the walk run again.
   */
  private async prepareUpdate(
    changedIds: string[],
    caughtUpIds: string[],
    firstInvalidatedBy?: string,
  ): Promise<RunnableUpdate | undefined> {
    for (let catchUps = 0; ;) {
      const registerCount = this.runtime.registerCount
      const update = this.computeHmrUpdate(changedIds, {
        firstInvalidatedBy,
        caughtUpIds,
      })
      if (update.type === 'full-reload') {
        this.requestFullReload(update.reason)
        return
      }
      // A reload found with the old import edges saves the request. `applyUpdate`
      // checks again with the new import edges.
      const entry = this.findEntryWithoutBoundary(update)
      if (entry !== undefined) {
        this.requestFullReload(`no hmr boundary found for module \`${entry}\``)
        return
      }
      let result: EnsureRunnableResult
      try {
        result = await this.runtime.ensureRunnable(new Set(update.updateSet))
      } catch (err) {
        this.requestFullReload(`failed to request the hmr patch: ${err}`)
        return
      }
      if (result.type === 'ready') {
        if (this.runtime.registerCount !== registerCount) continue
        return {
          ...update,
          caughtUpIds,
          gen: this.runtime.knownGen,
          registerCount,
        }
      }
      if (result.type === 'reload') {
        this.requestFullReload(result.reason)
        return
      }
      if (++catchUps === 2) {
        this.requestFullReload('the server kept reporting missed hmr updates')
        return
      }
      caughtUpIds = [...new Set([...caughtUpIds, ...result.changedIds])]
    }
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
    const entriesInUpdateSet = update.updateSet.filter((id) =>
      this.runtime.isEntry(id),
    )
    if (entriesInUpdateSet.length === 0) {
      return undefined
    }

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
    const updateSet = new Set(update.updateSet)
    const executedByBoundaries = new Set<string>()
    const queue = update.boundaries.map(({ acceptedVia }) => acceptedVia)
    while (queue.length) {
      const id = queue.pop()!
      if (executedByBoundaries.has(id) || !updateSet.has(id)) continue
      executedByBoundaries.add(id)
      // Only static imports count. An `import()` inside a function may not run
      // again, and skipping a top-level one only costs an extra reload.
      queue.push(...(this.runtime.staticImports.get(id)?.edges ?? []))
    }
    return entriesInUpdateSet.find((id) => !executedByBoundaries.has(id))
  }

  /**
   * Returns `false`, with nothing changed, when the update is outdated: a
   * module ran or a catch-up dropped a factory after the walk. This check and
   * the removal from the module cache below must stay in one synchronous step.
   */
  private async applyUpdate(
    update: RunnableUpdate,
    firstInvalidatedBy?: string,
  ): Promise<boolean> {
    if (
      this.runtime.registerCount !== update.registerCount ||
      !this.runtime.canRun(new Set(update.updateSet))
    ) {
      return false
    }
    // the patch may have removed an import that ran an entry again
    const entry = this.findEntryWithoutBoundary(update)
    if (entry !== undefined) {
      this.requestFullReload(`no hmr boundary found for module \`${entry}\``)
      return true
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
    this.markApplied(update)

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
          return true
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
    return true
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

  private markApplied(update: RunnableUpdate): void {
    this.runtime.appliedGen = Math.max(this.runtime.appliedGen, update.gen)
  }

  handleMissingFactory(id: string): void {
    this.requestFullReload(`no factory for module \`${id}\``)
  }

  handleReloadNeeded(reason: string): void {
    this.requestFullReload(reason)
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
