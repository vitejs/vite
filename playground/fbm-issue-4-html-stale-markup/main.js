// Entry script linked from index.html — mirrors Vite's playground/hmr/counter/index.ts.
//
// HTML is the dev-server entry, not an `import`. The button's "Counter 0" text comes
// from the HTML markup itself; main.js only wires up the click handler and a load
// marker. On a FULL PAGE RELOAD (Vite's behavior for an index.html edit) this whole
// script re-runs against the freshly-served HTML.
const btn = document.querySelector('button.counter')
let count = 0
btn.onclick = () => {
  count++
  btn.textContent = `Counter ${count}`
}

document.querySelector('.app').textContent = 'html entry loaded'

// Surface full reloads so the HMR spec can confirm the page reloaded. An index.html
// edit is NOT an acceptable HMR boundary, so Vite (non-FBM) sends a full-reload
// payload rather than a hot patch; main.js logs on `vite:beforeFullReload`.
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', () => {
    console.log('html full reload')
  })
}
