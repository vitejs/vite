import assetUrl from './worker-inline-asset-data.txt?url'

const label = 'inline-asset-label-v1'

self.onmessage = async (e) => {
  if (e.data === 'ping') {
    const res = await fetch(new URL(assetUrl, self.location.origin))
    self.postMessage(`${assetUrl}#${label}#${await res.text()}`)
  }
}
