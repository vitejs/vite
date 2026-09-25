import { isBool, sharedChunkMarker } from './common.js'

self.addEventListener('message', () => {
  self.postMessage(['worker-b', sharedChunkMarker, isBool(false)])
})
