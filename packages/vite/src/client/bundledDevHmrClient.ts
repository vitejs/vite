import type {
  BundledDevUpdatePayload,
  Update,
  UpdatePayload,
} from '#types/hmrPayload'
import { HMRClient, HMRContext, type HMRLogger } from '../shared/hmr'
import type { NormalizedModuleRunnerTransport } from '../shared/moduleRunnerTransport'

/** the subset of `__rolldown_runtime__` the HMR client uses */
export interface RolldownRuntimeLike {
  getImporters(id: string): string[]
  isExecuted(id: string): boolean
  hasFactory(id: string): boolean
  removeModuleCache(id: string): void
  initModule(id: string): unknown
  loadExports(id: string): unknown
}

type HmrUpdate =
  | { type: 'noop' }
  | { type: 'full-reload'; reason: string }
  | {
      type: 'boundaries'
      /** `[boundary, acceptedVia]` pairs */
      boundaries: [string, string][]
      updateSet: string[]
    }

export interface BundledDevHMRClientOptions {
  base: string
  /** returning `'reload'` aborts the apply — the hook reloads the page itself */
  beforeApply: () => 'reload' | 'continue'
  /**
   * How long to wait for a `full-reload` after requesting one before falling
   * back to `location.reload()`. Override in tests.
   */
  reloadAckTimeoutMs?: number
  /** Invoked when the client falls back to reloading the page itself. */
  reloadPage?: () => void
}

/** default wait for the server's `full-reload` reply after `reload-needed` */
export const DEFAULT_RELOAD_ACK_TIMEOUT_MS = 8_000

export class BundledDevHMRClient extends HMRClient {
  private applyQueue = Promise.resolve()
  private lastSeq = 0
  private reloadPending = false
  private reloadAckTimeout: ReturnType<typeof setTimeout> | null = null

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
    return (
      this.hotModulesMap.get(id)?.callbacks.some((c) => c.deps.includes(id)) ??
      false
    )
  }

  acceptsDep(parent: string, id: string): boolean {
    return (
      this.hotModulesMap
        .get(parent)
        ?.callbacks.some((c) => c.deps.includes(id)) ?? false
    )
  }

  computeHmrUpdate(
    changedIds: string[],
    opts?: { firstInvalidatedBy?: string },
  ): HmrUpdate {
    const boundaries: [string, string][] = []
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
    return boundaries.length
      ? { type: 'boundaries', boundaries, updateSet: [...updateSet] }
      : { type: 'noop' }
  }

  private bubble(
    id: string,
    stack: string[],
    updateSet: Set<string>,
    boundaries: [string, string][],
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
    if (this.isSelfAccepted(id)) {
      boundaries.push([id, id])
      return
    }
    const parents = this.runtime
      .getImporters(id)
      .filter((p) => this.runtime.isExecuted(p))
    if (!parents.length) {
      return {
        type: 'full-reload',
        reason: `no hmr boundary found for module \`${id}\``,
      }
    }
    for (const parent of parents) {
      if (this.acceptsDep(parent, id)) {
        boundaries.push([parent, id])
        continue
      }
      if (stack.includes(parent)) {
        return {
          type: 'full-reload',
          reason: `circular import chain between \`${id}\` and \`${parent}\``,
        }
      }
      const fullReload = this.bubble(
        parent,
        [...stack, parent],
        updateSet,
        boundaries,
        firstInvalidatedBy,
        traversedModules,
      )
      if (fullReload) return fullReload
    }
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
    // A later update while waiting for `full-reload` means the reply was lost.
    // Re-request a server-driven reload instead of navigating blindly (the
    // in-memory bundle may still be stale until `ensureLatestBuildOutput`).
    if (this.reloadPending) {
      this.rerequestFullReload(
        'received hmr update while full reload was pending (reply likely lost)',
      )
      return
    }
    if (seq !== this.lastSeq + 1) {
      this.requestFullReload(
        `hmr update sequence gap (expected ${this.lastSeq + 1}, got ${seq})`,
      )
      return
    }
    this.lastSeq = seq

    const update = this.computeHmrUpdate(changedIds)
    if (update.type === 'noop') return
    if (update.type === 'full-reload') {
      this.requestFullReload(update.reason)
      return
    }

    const listenerPayload = this.toUpdatePayload(update.boundaries, undefined)
    await this.notifyListeners('vite:beforeUpdate', listenerPayload)
    if (this.options.beforeApply() === 'reload') return

    try {
      await import(/* @vite-ignore */ this.options.base + url)
    } catch {
      this.requestFullReload(`failed to import hmr patch ${url}`)
      return
    }

    await this.applyUpdate(update)
    await this.notifyListeners('vite:afterUpdate', listenerPayload)
  }

  private async applyInvalidate(id: string): Promise<void> {
    if (this.reloadPending) {
      this.rerequestFullReload(
        'received invalidate while full reload was pending (reply likely lost)',
      )
      return
    }
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
    if (update.type === 'noop') return
    if (update.type === 'full-reload') {
      this.requestFullReload(update.reason)
      return
    }

    const listenerPayload = this.toUpdatePayload(
      update.boundaries,
      firstInvalidatedBy,
    )
    await this.notifyListeners('vite:beforeUpdate', listenerPayload)
    if (this.options.beforeApply() === 'reload') return
    await this.applyUpdate(update, firstInvalidatedBy)
    await this.notifyListeners('vite:afterUpdate', listenerPayload)
  }

  private async applyUpdate(
    update: Extract<HmrUpdate, { type: 'boundaries' }>,
    firstInvalidatedBy?: string,
  ): Promise<void> {
    for (const id of update.updateSet) {
      if (!this.runtime.hasFactory(id)) {
        this.requestFullReload(`no factory for module \`${id}\``)
        return
      }
    }

    // collect callbacks before the caches are removed
    const applies = update.boundaries.map(([boundary, acceptedVia]) => ({
      boundary,
      acceptedVia,
      callbacks:
        this.hotModulesMap
          .get(boundary)
          ?.callbacks.filter((c) => c.deps.includes(acceptedVia)) ?? [],
    }))

    for (const id of update.updateSet) {
      this.runtime.removeModuleCache(id)
    }

    for (const { boundary, acceptedVia, callbacks } of applies) {
      this.runtime.initModule(acceptedVia)
      const fresh = this.runtime.loadExports(acceptedVia)
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
    boundaries: [string, string][],
    firstInvalidatedBy: string | undefined,
  ): UpdatePayload {
    const updates: Update[] = boundaries.map(([boundary, acceptedVia]) => ({
      type: 'js-update',
      path: boundary,
      acceptedPath: acceptedVia,
      timestamp: Date.now(),
      firstInvalidatedBy,
    }))
    return { type: 'update', updates }
  }

  private requestFullReload(reason: string): void {
    if (this.reloadPending) return
    this.reloadPending = true
    // Visible at Chrome's default console level (unlike `debug`).
    console.info(`[vite] full reload needed: ${reason}`)
    this.logger.debug(`full reload needed: ${reason}`)
    this.send({
      type: 'custom',
      event: 'vite:bundled-dev:reload-needed',
      data: { reason },
    })
    const timeoutMs =
      this.options.reloadAckTimeoutMs ?? DEFAULT_RELOAD_ACK_TIMEOUT_MS
    this.reloadAckTimeout = setTimeout(() => {
      this.reloadAckTimeout = null
      this.fallbackReload(
        `full reload reply timed out after ${timeoutMs}ms (${reason})`,
      )
    }, timeoutMs)
  }

  /**
   * Called when the server's `full-reload` message arrives so the client stops
   * waiting and does not fall back to a second navigation.
   */
  acknowledgeFullReload(): void {
    if (this.reloadAckTimeout != null) {
      clearTimeout(this.reloadAckTimeout)
      this.reloadAckTimeout = null
    }
  }

  private rerequestFullReload(reason: string): void {
    this.acknowledgeFullReload()
    this.reloadPending = false
    console.warn(`[vite] ${reason}; re-requesting full reload`)
    this.requestFullReload(reason)
  }

  private fallbackReload(reason: string): void {
    this.acknowledgeFullReload()
    console.warn(`[vite] ${reason}; reloading page`)
    ;(this.options.reloadPage ?? (() => location.reload()))()
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
