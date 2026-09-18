import { isBool, sharedChunkMarker } from './common.js'

self.addEventListener('message', () => {
  self.postMessage(['worker-a', sharedChunkMarker, isBool(true)])
})
