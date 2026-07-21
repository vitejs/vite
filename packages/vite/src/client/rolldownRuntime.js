// This file is adapted from
// https://github.com/rolldown/rolldown/blob/v1.1.5/crates/rolldown_plugin_hmr/src/runtime/runtime-extra-dev-common.js
/* eslint-disable @typescript-eslint/no-this-alias -- The upstream closure intentionally captures this. */
// @ts-check

import {
  __exportAll,
  __reExport,
  __toCommonJS,
  __toESM,
} from '\0rolldown/runtime.js'

class Module {
  /** @type {{ exports: any }} */
  exportsHolder = { exports: null }
  /** @type {string} */
  id

  /** @param {string} id */
  constructor(id) {
    this.id = id
  }

  get exports() {
    return this.exportsHolder.exports
  }
}

/**
 * @typedef {{ type: 'hmr:module-registered', modules: string[] }} DevRuntimeMessage
 * @typedef {{ send(message: DevRuntimeMessage): void }} Messenger
 */

export class DevRuntime {
  /** @type {string} */
  clientId

  /**
   * @param {Messenger} messenger
   * @param {string} clientId
   */
  constructor(messenger, clientId) {
    this.messenger = messenger
    this.clientId = clientId
  }

  /** @type {Record<string, Module>} */
  modules = {}
  /** @param {string} _moduleId */
  createModuleHotContext(_moduleId) {
    throw new Error('createModuleHotContext should be implemented')
  }
  /** @param {[string, string][]} _boundaries */
  applyUpdates(_boundaries) {
    throw new Error('applyUpdates should be implemented')
  }
  /**
   * @param {string} id
   * @param {{ exports: any }} exportsHolder
   */
  registerModule(id, exportsHolder) {
    const module = new Module(id)
    module.exportsHolder = exportsHolder
    this.modules[id] = module
    this.sendModuleRegisteredMessage(id)
  }
  /** @param {string} id */
  loadExports(id) {
    const module = this.modules[id]
    if (module) {
      return module.exportsHolder.exports
    } else {
      console.warn(`Module ${id} not found`)
      return {}
    }
  }

  /**
   * @type {<T>(id: string, fn: any, dedup: any, res: T) => () => T}
   * @internal
   */
  createEsmInitializer = (id, fn, dedup, res) => () => (
    fn && (dedup && this.modules[id] ? (fn = 0) : (res = fn(((fn = 0), id)))),
    res
  )
  /**
   * @type {<T extends { exports: any }>(id: string, cb: any, dedup: any, mod: { exports: any }, registered: any) => () => T}
   * @internal
   */
  createCjsInitializer = (id, cb, dedup, mod, registered) => () => (
    mod ||
      (dedup && (registered = this.modules[id])
        ? (mod = { exports: registered.exports })
        : cb((mod = { exports: {} }).exports, mod, id)),
    mod.exports
  )
  /** @internal */
  // @ts-expect-error The variable will be injected at build time.
  __toESM = __toESM
  /** @internal */
  // @ts-expect-error The variable will be injected at build time.
  __toCommonJS = __toCommonJS
  /** @internal */
  // @ts-expect-error The variable will be injected at build time.
  __exportAll = __exportAll
  /**
   * @param {boolean} [isNodeMode]
   * @returns {(mod: any) => any}
   * @internal
   */
  // @ts-expect-error The variable will be injected at build time.
  __toDynamicImportESM = (isNodeMode) => (mod) =>
    __toESM(mod.default, isNodeMode)
  /** @internal */
  // @ts-expect-error The variable will be injected at build time.
  __reExport = __reExport

  sendModuleRegisteredMessage = (() => {
    const cache = /** @type {string[]} */ ([])
    let timeout = /** @type {NodeJS.Timeout | null} */ (null)
    let timeoutSetLength = 0
    const self = this

    /** @param {string} module */
    return function sendModuleRegisteredMessage(module) {
      if (!self.messenger) {
        return
      }
      cache.push(module)
      if (!timeout) {
        timeout = setTimeout(
          /** @returns void */
          function flushCache() {
            if (cache.length > timeoutSetLength) {
              timeout = setTimeout(flushCache)
              timeoutSetLength = cache.length
              return
            }

            self.messenger.send({
              type: 'hmr:module-registered',
              modules: cache,
            })
            cache.length = 0
            timeout = null
            timeoutSetLength = 0
          },
        )
        timeoutSetLength = cache.length
      }
    }
  })()
}
