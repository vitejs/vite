export * from './fsUtils'
export * from './pathUtils'
export * from './transformUtils'
export * from './resolveVue'

export function toArray<T>(arg: T | T[] | undefined) {
  return arg === void 0 ? [] : Array.isArray(arg) ? arg : [arg]
}

export const isPlainObject = (val: unknown): val is object =>
  Object.prototype.toString.call(val) === '[object Object]'
