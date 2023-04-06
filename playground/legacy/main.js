import './style.css'
import viteSvgPath from './vite.svg'
import MyWorker from './worker?worker'

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

const metaEnvObj = import.meta.env
text('#env-equal', import.meta.env.LEGACY === metaEnvObj.LEGACY)

// Iterators
text('#iterators', [...new Set(['hello'])].join(''))

// structuredClone is supported core.js v3.20.0+
text(
  '#features-after-corejs-3',
  JSON.stringify(structuredClone({ foo: 'foo' })),
)

// async generator
async function* asyncGenerator() {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve, 10))
    yield i
  }
}
;(async () => {
  const result = []
  for await (const i of asyncGenerator()) {
    result.push(i)
  }
  text('#async-generator', JSON.stringify(result))
})()

// babel-helpers
// Using `String.raw` to inject `@babel/plugin-transform-template-literals`
// helpers.
text(
  '#babel-helpers',
  String.raw`exposed babel helpers: ${window._templateObject != null}`,
)

// dynamic chunk names
import('./immutable-chunk.js')
  .then(({ fn }) => fn())
  .then((assets) => {
    text('#assets', assets.join('\n'))
  })

// dynamic css
document
  .querySelector('#dynamic-css-button')
  .addEventListener('click', async () => {
    await import('./dynamic.css')
    text('#dynamic-css', 'dynamic import css')
  })

text('#asset-path', viteSvgPath)

function text(el, text) {
  document.querySelector(el).textContent = text
}

const worker = new MyWorker()
worker.postMessage('ping')
worker.addEventListener('message', (ev) => {
  text('.worker-message', JSON.stringify(ev.data))
})
