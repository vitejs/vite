// A module worker whose dynamic import uses a non-literal specifier.
// Import analysis then prepends `import { injectQuery } from "/@vite/client"`,
// which loads the full HMR client inside the worker. When a stylesheet on the
// page is edited, the worker's copy of the client receives the css-update and
// must not throw `document is not defined` (it has no DOM). See #23925.

self.addEventListener('unhandledrejection', (event) => {
  console.error(String(event.reason))
})

const moduleUrl = './modules/module0.js'

import(moduleUrl).then((module) => {
  self.postMessage(module.default)
})
