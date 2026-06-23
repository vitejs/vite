// `.json` imported from JS — mirrors Vite's `playground/json` case.
//
// `import data from './x.json'` returns the PARSED object (default export); Vite also
// supports a NAMED export per top-level key (`import { hello } from './x.json'`).
//
// This is exactly the #6332 scenario: a STATIC `.json` import must not throw a
// ReferenceError under FBM HMR. We render both the default and the named import so the
// spec can assert their values, and on HMR (a `.json` edit triggers a full reload in
// Vite) the entry re-runs and re-renders the new value.
import json, { hello } from './test.json'

text('.full', JSON.stringify(json))
text('.named', hello)
text('.hmr', json.hmr)

document.querySelector('.app').textContent = 'json loaded'

function text(sel, value) {
  document.querySelector(sel).textContent = value
}

// Surface full reloads so the HMR spec can confirm the page reloaded (Vite's json
// `should full reload` test). A `.json` change is a non-accepted dependency of the
// entry, so Vite sends a full-reload payload rather than a hot patch.
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', () => {
    console.log('json full reload')
  })
}
