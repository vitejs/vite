import { initSharedBase } from './shared-base'
import { initChunkA } from './chunk-a'
import './chunk-b.css'

initSharedBase()
initChunkA()

export function initChunkB() {
  console.log('[chunk-b] initialized')

  // Create test element
  const div = document.createElement('div')
  div.className = 'diamond-test'
  div.textContent = 'Diamond Dependency Test'
  document.body.appendChild(div)
}
