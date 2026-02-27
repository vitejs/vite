// base.css is imported as a standalone CSS import.
// When manualChunks splits it into a pure CSS chunk,
// the CSS ordering must still be preserved:
// base.css should come BEFORE page.css in the cascade.
import './base.css'
import './page.css'

export function render() {
  const el = document.createElement('div')
  el.className = 'async-order-el'
  el.textContent = 'async order test'
  document.body.appendChild(el)
}
