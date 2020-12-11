export type HMRPayload =
  | ConnectedPayload
  | UpdatePayload
  | FullReloadPayload
  | StyleRemovePayload
  | CustomPayload
  | MultiUpdatePayload
  | ErrorPayload

export interface ConnectedPayload {
  type: 'connected'
}

export interface MultiUpdatePayload {
  type: 'multi'
  updates: UpdatePayload[]
}

export interface UpdatePayload {
  type: 'js-update' | 'css-update'
  path: string
  changedPath: string
  timestamp: number
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
    pos?: number
  }
}
