export class HMRContext {
  hmrClient
  ownerPath
  newListeners
  constructor(hmrClient, ownerPath) {
    this.hmrClient = hmrClient
    this.ownerPath = ownerPath
    if (!hmrClient.dataMap.has(ownerPath)) {
      hmrClient.dataMap.set(ownerPath, {})
    }
    // when a file is hot updated, a new context is created
    // clear its stale callbacks
    const mod = hmrClient.hotModulesMap.get(ownerPath)
    if (mod) {
      mod.callbacks = []
    }
    // clear stale custom event listeners
    const staleListeners = hmrClient.ctxToListenersMap.get(ownerPath)
    if (staleListeners) {
      for (const [event, staleFns] of staleListeners) {
        const listeners = hmrClient.customListenersMap.get(event)
        if (listeners) {
          hmrClient.customListenersMap.set(
            event,
            listeners.filter((l) => !staleFns.includes(l)),
          )
        }
      }
    }
    this.newListeners = new Map()
    hmrClient.ctxToListenersMap.set(ownerPath, this.newListeners)
  }
  get data() {
    return this.hmrClient.dataMap.get(this.ownerPath)
  }
  accept(deps, callback) {
    if (typeof deps === 'function' || !deps) {
      // self-accept: hot.accept(() => {})
      this.acceptDeps([this.ownerPath], ([mod]) => deps?.(mod))
    } else if (typeof deps === 'string') {
      // explicit deps
      this.acceptDeps([deps], ([mod]) => callback?.(mod))
    } else if (Array.isArray(deps)) {
      this.acceptDeps(deps, callback)
    } else {
      throw new Error(`invalid hot.accept() usage.`)
    }
  }
  // export names (first arg) are irrelevant on the client side, they're
  // extracted in the server for propagation
  acceptExports(_, callback) {
    this.acceptDeps([this.ownerPath], ([mod]) => callback?.(mod))
  }
  dispose(cb) {
    this.hmrClient.disposeMap.set(this.ownerPath, cb)
  }
  prune(cb) {
    this.hmrClient.pruneMap.set(this.ownerPath, cb)
  }
  // Kept for backward compatibility (#11036)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  decline() {}
  invalidate(message) {
    this.hmrClient.notifyListeners('vite:invalidate', {
      path: this.ownerPath,
      message,
    })
    this.send('vite:invalidate', { path: this.ownerPath, message })
    this.hmrClient.logger.debug(
      `[vite] invalidate ${this.ownerPath}${message ? `: ${message}` : ''}`,
    )
  }
  on(event, cb) {
    const addToMap = (map) => {
      const existing = map.get(event) || []
      existing.push(cb)
      map.set(event, existing)
    }
    addToMap(this.hmrClient.customListenersMap)
    addToMap(this.newListeners)
  }
  off(event, cb) {
    const removeFromMap = (map) => {
      const existing = map.get(event)
      if (existing === undefined) {
        return
      }
      const pruned = existing.filter((l) => l !== cb)
      if (pruned.length === 0) {
        map.delete(event)
        return
      }
      map.set(event, pruned)
    }
    removeFromMap(this.hmrClient.customListenersMap)
    removeFromMap(this.newListeners)
  }
  send(event, data) {
    this.hmrClient.messenger.send(
      JSON.stringify({ type: 'custom', event, data }),
    )
  }
  acceptDeps(deps, callback = () => {}) {
    const mod = this.hmrClient.hotModulesMap.get(this.ownerPath) || {
      id: this.ownerPath,
      callbacks: [],
    }
    mod.callbacks.push({
      deps,
      fn: callback,
    })
    this.hmrClient.hotModulesMap.set(this.ownerPath, mod)
  }
}
class HMRMessenger {
  connection
  constructor(connection) {
    this.connection = connection
  }
  queue = []
  send(message) {
    this.queue.push(message)
    this.flush()
  }
  flush() {
    if (this.connection.isReady()) {
      this.queue.forEach((msg) => this.connection.send(msg))
      this.queue = []
    }
  }
}
export class HMRClient {
  logger
  importUpdatedModule
  hotModulesMap = new Map()
  disposeMap = new Map()
  pruneMap = new Map()
  dataMap = new Map()
  customListenersMap = new Map()
  ctxToListenersMap = new Map()
  messenger
  constructor(
    logger,
    connection,
    // This allows implementing reloading via different methods depending on the environment
    importUpdatedModule,
  ) {
    this.logger = logger
    this.importUpdatedModule = importUpdatedModule
    this.messenger = new HMRMessenger(connection)
  }
  async notifyListeners(event, data) {
    const cbs = this.customListenersMap.get(event)
    if (cbs) {
      await Promise.allSettled(cbs.map((cb) => cb(data)))
    }
  }
  clear() {
    this.hotModulesMap.clear()
    this.disposeMap.clear()
    this.pruneMap.clear()
    this.dataMap.clear()
    this.customListenersMap.clear()
    this.ctxToListenersMap.clear()
  }
  // After an HMR update, some modules are no longer imported on the page
  // but they may have left behind side effects that need to be cleaned up
  // (.e.g style injections)
  async prunePaths(paths) {
    await Promise.all(
      paths.map((path) => {
        const disposer = this.disposeMap.get(path)
        if (disposer) return disposer(this.dataMap.get(path))
      }),
    )
    paths.forEach((path) => {
      const fn = this.pruneMap.get(path)
      if (fn) {
        fn(this.dataMap.get(path))
      }
    })
  }
  warnFailedUpdate(err, path) {
    if (!err.message.includes('fetch')) {
      this.logger.error(err)
    }
    this.logger.error(
      `[hmr] Failed to reload ${path}. ` +
        `This could be due to syntax errors or importing non-existent ` +
        `modules. (see errors above)`,
    )
  }
  updateQueue = []
  pendingUpdateQueue = false
  /**
   * buffer multiple hot updates triggered by the same src change
   * so that they are invoked in the same order they were sent.
   * (otherwise the order may be inconsistent because of the http request round trip)
   */
  async queueUpdate(payload) {
    this.updateQueue.push(this.fetchUpdate(payload))
    if (!this.pendingUpdateQueue) {
      this.pendingUpdateQueue = true
      await Promise.resolve()
      this.pendingUpdateQueue = false
      const loading = [...this.updateQueue]
      this.updateQueue = []
      ;(await Promise.all(loading)).forEach((fn) => fn && fn())
    }
  }
  async fetchUpdate(update) {
    const { path, acceptedPath } = update
    const mod = this.hotModulesMap.get(path)
    if (!mod) {
      // In a code-splitting project,
      // it is common that the hot-updating module is not loaded yet.
      // https://github.com/vitejs/vite/issues/721
      return
    }
    let fetchedModule
    const isSelfUpdate = path === acceptedPath
    // determine the qualified callbacks before we re-import the modules
    const qualifiedCallbacks = mod.callbacks.filter(({ deps }) =>
      deps.includes(acceptedPath),
    )
    if (isSelfUpdate || qualifiedCallbacks.length > 0) {
      const disposer = this.disposeMap.get(acceptedPath)
      if (disposer) await disposer(this.dataMap.get(acceptedPath))
      try {
        fetchedModule = await this.importUpdatedModule(update)
      } catch (e) {
        this.warnFailedUpdate(e, acceptedPath)
      }
    }
    return () => {
      for (const { deps, fn } of qualifiedCallbacks) {
        fn(
          deps.map((dep) => (dep === acceptedPath ? fetchedModule : undefined)),
        )
      }
      const loggedPath = isSelfUpdate ? path : `${acceptedPath} via ${path}`
      this.logger.debug(`[vite] hot updated: ${loggedPath}`)
    }
  }
}
