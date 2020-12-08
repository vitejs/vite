export type HMRPayload =
  | ConnectedPayload
  | UpdatePayload
  | FullReloadPayload
  | StyleRemovePayload
  | CustomPayload
  | MultiUpdatePayload

export interface ConnectedPayload {
  type: 'connected'
}

export interface UpdatePayload {
  type: 'js-update' | 'style-update'
  path: string
  changeSrcPath: string
  timestamp: number
}

export interface StyleRemovePayload {
  type: 'style-remove'
  path: string
  id: string
}

export interface FullReloadPayload {
  type: 'full-reload'
  path: string
}

export interface CustomPayload {
  type: 'custom'
  id: string
  customData: any
}

export interface MultiUpdatePayload {
  type: 'multi'
  updates: UpdatePayload[]
}
