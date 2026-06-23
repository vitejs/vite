// General (non-CSS) `?raw` imported from JS — mirrors Vite's `playground/assets`
// "?raw import" case (index.html L557-564:
//   `import rawSvg from './nested/fragment.svg?raw'; text('.raw', rawSvg)`
//   `import rawHtml from './nested/partial.html?raw'; text('.raw-html', rawHtml)`
//   + `import.meta.hot.accept('./nested/partial.html?raw', m => text('.raw-html', m.default))`).
//
// With `?raw`, the import returns the RAW, UN-transformed file contents as a STRING
// (default export). This applies to ANY file extension — here a `.svg` and a `.html`
// (deliberately NON-CSS; CSS `?raw` is a separate item). No asset emit, no transform:
// the imported value is the file's bytes verbatim, baked into the JS module as a string.
import rawSvg from './fragment.svg?raw'
import rawHtml from './partial.html?raw'

// Render the raw strings into the DOM so the spec can read them.
document.querySelector('.raw-svg').textContent = rawSvg
document.querySelector('.raw-html').textContent = rawHtml

document.querySelector('.app').textContent = 'query-raw loaded'

// Re-render the raw HTML string whenever the `?raw` module re-evaluates (HMR).
// This mirrors Vite's own accept handler in playground/assets/index.html L562-564.
if (import.meta.hot) {
  import.meta.hot.accept('./partial.html?raw', (mod) => {
    if (mod) {
      document.querySelector('.raw-html').textContent = mod.default
    }
  })
}
