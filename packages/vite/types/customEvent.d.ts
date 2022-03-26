import type {
  ErrorPayload,
  FullReloadPayload,
  PrunePayload,
  UpdatePayload
} from './hmrPayload'

export interface CustomEventMap {
  'vite:beforeUpdate': UpdatePayload
  'vite:beforePrune': PrunePayload
  'vite:beforeFullReload': FullReloadPayload
  'vite:error': ErrorPayload
}

export type GetCustomEventPayload<T extends string> =
  T extends keyof CustomEventMap ? CustomEventMap[T] : unknown
