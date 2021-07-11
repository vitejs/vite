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

text('#env', `is legacy: ${isLegacy}`)

// Iterators
text('#iterators', [...new Set(['hello'])].join(''))

// babel-helpers
// Using `String.raw` to inject `@babel/plugin-transform-template-literals`
// helpers.
text(
  '#babel-helpers',
  String.raw`exposed babel helpers: ${window._templateObject != null}`
)

// dynamic chunk names
import('./immutable-chunk.js')
  .then(({ fn }) => fn())
  .then((assets) => {
    text('#assets', assets.join('\n'))
  })

function text(el, text) {
  document.querySelector(el).textContent = text
}
