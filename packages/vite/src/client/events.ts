import { ConnectedPayload, ErrorPayload, UpdatePayload } from 'types/hmrPayload'

export class ViteEventDispatcher {
  readonly target: ViteEventTarget = new EventTarget()

  dispatchEvent(type: 'vite:connected', payload: ConnectedPayload): void
  dispatchEvent(type: 'vite:update', payload: UpdatePayload): void
  dispatchEvent(type: 'vite:error', payload: ErrorPayload): void
  dispatchEvent<P>(type: string, payload?: P): void {
    this.target.dispatchEvent(
      new CustomEvent(type, {
        detail: {
          ...(payload && { payload })
        }
      })
    )
  }
}

export interface ViteEventTarget extends EventTarget {
  addEventListener(
    type: 'vite:connected',
    listener: CustomEventListenerOrCustomEventListenerObject<ConnectedPayload> | null,
    options?: EventListenerOptions | boolean
  ): void
  addEventListener(
    type: 'vite:update',
    listener: CustomEventListenerOrCustomEventListenerObject<UpdatePayload> | null,
    options?: EventListenerOptions | boolean
  ): void
  addEventListener(
    type: 'vite:error',
    listener: CustomEventListenerOrCustomEventListenerObject<ErrorPayload> | null,
    options?: EventListenerOptions | boolean
  ): void

  removeEventListener(
    type: 'vite:connected',
    listener: CustomEventListenerOrCustomEventListenerObject<ConnectedPayload> | null,
    options?: EventListenerOptions | boolean
  ): void
  removeEventListener(
    type: 'vite:update',
    listener: CustomEventListenerOrCustomEventListenerObject<UpdatePayload> | null,
    options?: EventListenerOptions | boolean
  ): void
  removeEventListener(
    type: 'vite:error',
    listener: CustomEventListenerOrCustomEventListenerObject<ErrorPayload> | null,
    options?: EventListenerOptions | boolean
  ): void
}

type CustomEventListenerOrCustomEventListenerObject<T> =
  | CustomEventListener<T>
  | CustomEventListenerObject<T>

interface CustomEventListener<T> {
  (evt: CustomEvent<T>): void
}

interface CustomEventListenerObject<T> {
  handleEvent(evt: CustomEvent<T>): void
}
