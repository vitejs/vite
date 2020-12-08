export type HMRPayload =
  | ConnectedPayload
  | UpdatePayload
  | FullReloadPayload
  | StyleRemovePayload
  | SWBustCachePayload
  | CustomPayload
  | MultiUpdatePayload

export interface ConnectedPayload {
  type: 'connected'
}

export interface UpdatePayload {
  type: 'js-update' | 'vue-reload' | 'vue-rerender' | 'style-update'
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

export interface SWBustCachePayload {
  type: 'sw-bust-cache'
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
