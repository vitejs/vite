export type HMRPayload =
  | ConnectedPayload
  | UpdatePayload
  | FullReloadPayload
  | StyleRemovePayload
  | SWBustCachePayload
  | CustomPayload
  | MultiUpdatePayload

export const enum PayloadType {
  connected = 'connected',
  jsUpdate = 'js-update',
  vueReload = 'vue-reload',
  vueRerender = 'vue-rerender',
  styleUpdate = 'style-update',
  styleRemove = 'style-remove',
  fullReload = 'full-reload',
  swBustCache = 'sw-bust-cache',
  custom = 'custom',
  multi = 'multi'
}

interface ConnectedPayload {
  type: PayloadType.connected
}

export interface UpdatePayload {
  type:
    | PayloadType.jsUpdate
    | PayloadType.vueReload
    | PayloadType.vueRerender
    | PayloadType.styleUpdate
  path: string
  changeSrcPath: string
  timestamp: number
}

interface StyleRemovePayload {
  type: PayloadType.styleRemove
  path: string
  id: string
}

interface FullReloadPayload {
  type: PayloadType.fullReload
  path: string
}

interface SWBustCachePayload {
  type: PayloadType.swBustCache
  path: string
}

interface CustomPayload {
  type: PayloadType.custom
  id: string
  customData: any
}

export interface MultiUpdatePayload {
  type: PayloadType.multi
  updates: UpdatePayload[]
}
