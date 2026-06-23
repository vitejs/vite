// CSS `?inline` imported from JS — mirrors Vite's `playground/css` "inlined" case
// (main.js: `import inlined from './inlined.css?inline'`).
//
// With `?inline`, the import returns the processed CSS as a STRING (default export)
// and does NOT inject a `<style>` tag. So:
//   - the `.inline` element must render the DEFAULT color (no injected rule), and
//   - the imported string itself must contain the CSS source.
import inlineCss from './inline.css?inline'

// Render the string into the DOM so the spec can read its content.
document.querySelector('.inline-code').textContent = inlineCss

document.querySelector('.app').textContent = 'css-inline loaded'

// Re-render the string whenever the `?inline` module re-evaluates (HMR). This mirrors
// how a real consumer would react to the inlined string changing.
if (import.meta.hot) {
  import.meta.hot.accept('./inline.css?inline', (mod) => {
    if (mod) {
      document.querySelector('.inline-code').textContent = mod.default
    }
  })
}
