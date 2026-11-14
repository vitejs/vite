export const test = 'I am initialized'

let _resolve
const deferredPromise = new Promise((resolve) => {
  _resolve = resolve
})
deferredPromise.resolve = _resolve

globalThis.__HMR_PROMISE__ ??= deferredPromise

import.meta.hot?.accept()
