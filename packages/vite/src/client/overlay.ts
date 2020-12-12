import { ErrorPayload } from 'types/hmrPayload'
import AnsiUp from './ansiup'

const ansi = new AnsiUp()

console.log(ansi.ansi_to_html(`hello`))

const style = `
h1 {
  color: red;
}
`

export class ErrorOverlay extends HTMLElement {
  root: ShadowRoot

  constructor(err: ErrorPayload['err']) {
    super()
    this.root = this.attachShadow({ mode: 'open' })
    this.root.innerHTML = `
    <style>${style}</style>
    <h1>Error: ${err.message}</h1>
    `
  }

  close() {
    this.parentNode?.removeChild(this)
  }
}

export const overlayId = 'vite-error-overlay'
customElements.define(overlayId, ErrorOverlay)
