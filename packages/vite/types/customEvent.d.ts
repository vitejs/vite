// See https://stackoverflow.com/a/63549561.
export type CustomEventName<T extends string> = (T extends `vite:${T}`
  ? never
  : T) &
  (`vite:${T}` extends T ? never : T)
