// CSS `?raw` imported from JS — mirrors Vite's `playground/css` "?raw" case
// (main.js: `import rawCss from './raw-imported.css?raw'; text('.raw-imported-css', rawCss)`).
//
// With `?raw`, the import returns the RAW, UN-transformed file contents as a STRING
// (default export). No CSS processing, no `<style>` injection. So the rendered string
// must equal the on-disk file byte-for-byte (comment + nested selector preserved).
import rawCss from './raw.css?raw'

// Render the raw string into the DOM so the spec can read its content.
document.querySelector('.raw-imported-css').textContent = rawCss

document.querySelector('.app').textContent = 'css-raw loaded'

// Re-render the raw string whenever the `?raw` module re-evaluates (HMR). This mirrors
// how a real consumer would react to the raw string changing.
if (import.meta.hot) {
  import.meta.hot.accept('./raw.css?raw', (mod) => {
    if (mod) {
      document.querySelector('.raw-imported-css').textContent = mod.default
    }
  })
}
