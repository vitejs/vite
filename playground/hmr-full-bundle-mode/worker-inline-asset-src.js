import assetUrl from './worker-inline-asset-data.txt?url'

const label = 'inline-asset-label-v1'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage(`${assetUrl}#${label}`)
  }
}
