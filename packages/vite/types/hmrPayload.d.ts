/** @deprecated use HotPayload */
export type HMRPayload = HotPayload
export type HotPayload =
  | ConnectedPayload
  | PingPayload
  | UpdatePayload
  | BundledDevUpdatePayload
  | FullReloadPayload
  | CustomPayload
  | ErrorPayload
  | PrunePayload

export interface ConnectedPayload {
  type: 'connected'
}

export interface PingPayload {
  type: 'ping'
}

export interface UpdatePayload {
  type: 'update'
  updates: Update[]
}

/**
 * Full-bundle-mode update notification, the same for every client. The client
 * computes the HMR boundaries itself from `changedIds` and requests the code it
 * needs.
 */
export interface BundledDevUpdatePayload {
  type: 'bundled-dev-update'
  changedIds: string[]
  /** Every module whose code changed in this update. The client drops its old factories. */
  staleIds: string[]
  /** The bundler generation of this update */
  gen: number
  /** Per-connection sequence number */
  seq: number
}

export interface Update {
  type: 'js-update' | 'css-update'
  /** Module URL of the HMR boundary */
  path: string
  /** Module URL of the accepted module */
  acceptedPath: string
  timestamp: number
  /** @internal */
  explicitImportRequired?: boolean
  /** @internal */
  isWithinCircularImport?: boolean
  /** @internal */
  firstInvalidatedBy?: string
  /** @internal */
  invalidates?: string[]
}

export interface PrunePayload {
  type: 'prune'
  paths: string[]
}

export interface FullReloadPayload {
  type: 'full-reload'
  path?: string
  /** @internal */
  triggeredBy?: string
  /**
   * When set, only the bundling-fallback page acts on the reload;
   * other pages ignore the message.
   * @internal
   */
  ifFallback?: boolean
}

export interface CustomPayload {
  type: 'custom'
  event: string
  data?: any
}

export interface ErrorPayload {
  type: 'error'
  err: {
    [name: string]: any
    message: string
    stack: string
    id?: string
    frame?: string
    plugin?: string
    pluginCode?: string
    loc?: {
      file?: string
      line: number
      column: number
    }
  }
}
