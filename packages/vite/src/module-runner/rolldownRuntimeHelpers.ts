// TODO(upstream): `rolldown/experimental/runtime` is meant to be importable as a
// standalone ESM entry (rolldown/rolldown#10338), but `DevRuntime`'s instance
// fields read `__toESM` / `__toCommonJS` / `__exportAll` / `__reExport` as free
// variables. Those only exist when the class source is concatenated into a
// rolldown bundle, so `new DevRuntime()` throws a ReferenceError when the entry
// is imported normally. Publishing them from the entry (or letting the
// constructor take them) would delete this file.
//
// Definitions mirror `crates/rolldown/src/runtime/runtime-base.js`.

const __defProp = Object.defineProperty
const __create = Object.create
const __getProtoOf = Object.getPrototypeOf
const __getOwnPropNames = Object.getOwnPropertyNames
const __getOwnPropDesc = Object.getOwnPropertyDescriptor
const __hasOwnProp = Object.prototype.hasOwnProperty

const __copyProps = (to: any, from: any, except?: string, desc?: any) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (
      let keys = __getOwnPropNames(from), i = 0, n = keys.length, key;
      i < n;
      i++
    ) {
      key = keys[i]
      if (!__hasOwnProp.call(to, key) && key !== except) {
        __defProp(to, key, {
          get: ((k: string) => from[k]).bind(null, key),
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        })
      }
    }
  }
  return to
}

const helpers = {
  __exportAll: (all: any, no_symbols?: boolean) => {
    const target: any = {}
    for (const name in all) {
      __defProp(target, name, { get: all[name], enumerable: true })
    }
    if (!no_symbols) {
      __defProp(target, Symbol.toStringTag, { value: 'Module' })
    }
    return target
  },
  __reExport: (target: any, mod: any, secondTarget?: any) => (
    __copyProps(target, mod, 'default'),
    secondTarget && __copyProps(secondTarget, mod, 'default')
  ),
  __toESM: (mod: any, isNodeMode?: boolean, target?: any) => (
    (target = mod != null ? __create(__getProtoOf(mod)) : {}),
    __copyProps(
      isNodeMode ||
        !mod ||
        !mod.__esModule ||
        !__hasOwnProp.call(mod, 'default')
        ? __defProp(target, 'default', { value: mod, enumerable: true })
        : target,
      mod,
    )
  ),
  __toCommonJS: (mod: any) =>
    __hasOwnProp.call(mod, 'module.exports')
      ? mod['module.exports']
      : __copyProps(__defProp({}, '__esModule', { value: true }), mod),
}

/**
 * `DevRuntime` resolves these through the scope chain, so defining them as
 * globals is what makes the standalone entry constructible.
 */
export function installRolldownRuntimeHelpers(): void {
  for (const [name, fn] of Object.entries(helpers)) {
    ;(globalThis as any)[name] ??= fn
  }
}
