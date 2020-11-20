export type HMRPayload =
  | ConnectedPayload
  | UpdatePayload
  | FullReloadPayload
  | StyleRemovePayload
  | SWBustCachePayload
  | CustomPayload
  | MultiUpdatePayload
  | AssetsUpdatePayload

interface ConnectedPayload {
  type: 'connected'
}

export interface UpdatePayload {
  type: 'js-update' | 'vue-reload' | 'vue-rerender' | 'style-update'
  path: string
  changeSrcPath: string
  timestamp: number
}

interface AssetsUpdatePayload {
  type: 'assets-update'
  path: string
  timestamp: number
}

interface StyleRemovePayload {
  type: 'style-remove'
  path: string
  id: string
}

interface FullReloadPayload {
  type: 'full-reload'
  path: string
}

interface SWBustCachePayload {
  type: 'sw-bust-cache'
  path: string
}

interface CustomPayload {
  type: 'custom'
  id: string
  customData: any
}

export interface MultiUpdatePayload {
  type: 'multi'
  updates: UpdatePayload[]
}
