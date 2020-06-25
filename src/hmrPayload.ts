export type HMRPayload =
  | ConnectedPayload
  | UpdatePayload
  | FullReloadPayload
  | StyleRemovePayload
  | SWBustCachePayload
  | CustomPayload
  | MultiUpdatePayload

export const enum PayloadType {
  Connected = 'connected',
  JsUpdate = 'js-update',
  VueReload = 'vue-reload',
  VueRerender = 'vue-rerender',
  StyleUpdate = 'style-update',
  StyleRemove = 'style-remove',
  FullReload = 'full-reload',
  SwBustCache = 'sw-bust-cache',
  Custom = 'custom',
  Multi = 'multi'
}

interface ConnectedPayload {
  type: PayloadType.Connected
}

export interface UpdatePayload {
  type:
    | PayloadType.JsUpdate
    | PayloadType.VueReload
    | PayloadType.VueRerender
    | PayloadType.StyleUpdate
  path: string
  changeSrcPath: string
  timestamp: number
}

interface StyleRemovePayload {
  type: PayloadType.StyleRemove
  path: string
  id: string
}

interface FullReloadPayload {
  type: PayloadType.FullReload
  path: string
}

interface SWBustCachePayload {
  type: PayloadType.SwBustCache
  path: string
}

interface CustomPayload {
  type: PayloadType.Custom
  id: string
  customData: any
}

export interface MultiUpdatePayload {
  type: PayloadType.Multi
  updates: UpdatePayload[]
}
