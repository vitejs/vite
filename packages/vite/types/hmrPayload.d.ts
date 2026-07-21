/** @deprecated use HotPayload */
export type HMRPayload = HotPayload
export type HotPayload =
  | ConnectedPayload
  | PingPayload
  | UpdatePayload
  | FbmUpdatePayload
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
 * Full-bundle-mode update notification. The client computes the HMR boundaries
 * itself from `changedIds`.
 */
export interface FbmUpdatePayload {
  type: 'fbm-update'
  changedIds: string[]
  /** URL of the per-client HMR patch chunk */
  url: string
  /** Per-client sequence number */
  seq: number
}

export interface Update {
  type: 'js-update' | 'css-update'
  path: string
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
