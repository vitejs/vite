export * from './fsUtils'
export * from './pathUtils'
export * from './transformUtils'
export * from './resolveVue'

export function toArray<T>(arg: T | T[] | undefined) {
  return arg === void 0 ? [] : Array.isArray(arg) ? arg : [arg]
}
