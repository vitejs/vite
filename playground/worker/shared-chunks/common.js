// A module shared between multiple ES module workers, and the main thread,
// to reproduce https://github.com/vitejs/vite/issues/18068 (chunk sharing
// between ESM workers) and https://github.com/vitejs/vite/issues/16719
// (chunk sharing between the main build and a worker).
export const sharedChunkMarker = 'shared-chunk-marker'
export const isBool = (v) => typeof v === 'boolean'
