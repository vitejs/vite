import { sharedBetweenWorkerAndMain } from './shared'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage({ msg })
  }
}
self.postMessage({
  msg,
  mode,
  bundleWithPlugin,
  msgFromDep,
  viteSvg,
  metaUrl,
  name,
})

// for sourcemap
sharedBetweenWorkerAndMain('dep-worker')
