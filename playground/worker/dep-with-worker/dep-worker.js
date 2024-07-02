import { sharedBetweenWorkerAndMain } from './shared'

self.onmessage = (e) => {
  self.postMessage(e.data)
}

sharedBetweenWorkerAndMain('', 'entry: worker')
