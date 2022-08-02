import { module } from './module'

self.onmessage = () => {
  self.postMessage(module)
}
