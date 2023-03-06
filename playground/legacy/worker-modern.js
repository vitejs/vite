import { module } from './module'

self.onmessage = () => {
  // tests if the worker entry file gets polyfilled with the "Promise" polyfill
  Promise.resolve().finally(() => self.postMessage(module))
}
