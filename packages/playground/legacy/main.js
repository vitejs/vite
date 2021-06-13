async function run() {
  const { fn } = await import('./async.js')
  fn()
}

run()

let isLegacy

// make sure that branching works despite esbuild's constant folding (#1999)
if (import.meta.env.LEGACY) {
  if (import.meta.env.LEGACY === true) isLegacy = true
} else {
  if (import.meta.env.LEGACY === false) isLegacy = false
}

document.getElementById('env').textContent = `is legacy: ${isLegacy}`

// Iterators

document.getElementById('iterators').textContent = [...new Set(['hello'])].join(
  ''
)

// babel-helpers

document.getElementById('babel-helpers').textContent =
  // Using `String.raw` to inject `@babel/plugin-transform-template-literals`
  // helpers.
  String.raw`exposed babel helpers: ${window._templateObject != null}`
