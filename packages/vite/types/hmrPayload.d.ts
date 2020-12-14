export type HMRPayload =
  | ConnectedPayload
  | UpdatePayload
  | FullReloadPayload
  | StyleRemovePayload
  | CustomPayload
  | ErrorPayload
  | PrunePayload

export interface ConnectedPayload {
  type: 'connected'
}

export interface UpdatePayload {
  type: 'update'
  updates: Update[]
}

export interface Update {
  type: 'js-update' | 'css-update'
  path: string
  changedPath: string
  timestamp: number
}

export interface PrunePayload {
  type: 'prune'
  paths: string[]
}

export interface StyleRemovePayload {
  type: 'css-remove'
  path: string
}

export interface FullReloadPayload {
  type: 'full-reload'
  path?: string
}

export interface CustomPayload {
  type: 'custom'
  path: string
  customData: any
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
