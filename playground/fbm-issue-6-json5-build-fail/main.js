// `.json5` imported from JS — mirrors Vite's `playground/json` case, adapted to JSON5.
//
// `.json5` is relaxed JSON (comments, unquoted keys, single quotes, trailing commas).
// Vite parses it to a JS module just like `.json`: `import data from './x.json5'` returns
// the PARSED object (default export), and Vite exposes a NAMED export per top-level key
// (`import { hello } from './x.json5'`) when `json.namedExports` is on (the default).
//
// The source (test.json5) uses genuine JSON5-only syntax, so if the default import equals
// the parsed object then the JSON5 parser MUST have run (a plain JSON.parse would throw).
//
// Same #6332 scenario as `.json`: a STATIC json import must not throw a ReferenceError
// under FBM HMR. We render the default + named import so the spec can assert their values,
// and on HMR (a json edit triggers a full reload in Vite) the entry re-runs + re-renders.
import json, { hello } from './test.json5'

text('.full', JSON.stringify(json))
text('.named', hello)
text('.hmr', json.hmr)

document.querySelector('.app').textContent = 'json5 loaded'

function text(sel, value) {
  document.querySelector(sel).textContent = value
}

// Surface full reloads so the HMR spec can confirm the page reloaded (Vite's json
// `should full reload` test). A json change is a non-accepted dependency of the entry,
// so Vite sends a full-reload payload rather than a hot patch.
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', () => {
    console.log('json5 full reload')
  })
}
