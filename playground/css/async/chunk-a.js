import { initSharedBase } from './shared-base'
import './chunk-a.css'

initSharedBase()

export function initChunkA() {
  console.log('[chunk-a] initialized')
}
