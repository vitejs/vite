import { html, css, LitElement } from 'lit'
import viteLogo from '/vite.svg'
import litLogo from './assets/lit.svg'

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
export class MyElement extends LitElement {
  static get styles() {
    return css`
      :host {
        max-width: 1280px;
        margin: 0 auto;
        padding: 2rem;
        text-align: center;
      }

      .logo {
        height: 6em;
        padding: 1.5em;
      }
      .logo:hover {
        filter: drop-shadow(0 0 2em #888);
      }

      .card {
        padding: 2em;
      }

      .read-the-docs {
        color: #888;
      }

      button {
        border: 0;
        border-radius: 4px;
        padding: 0.5em 1em;
        outline: 1px solid #8888;
        font-size: 1em;
        font-family: inherit;
        background-color: transparent;
      }
      button:hover {
        outline-color: #888;
      }
      button:focus,
      button:focus-visible {
        outline: 4px auto -webkit-focus-ring-color;
      }
    `
  }

  static get properties() {
    return {
      /**
       * Copy for the read the docs hint.
       */
      docsHint: { type: String },

      /**
       * The number of times the button has been clicked.
       */
      count: { type: Number }
    }
  }

  constructor() {
    super()
    this.docsHint = 'Click on the Vite and Lit logos to learn more'
    this.count = 0
  }

  render() {
    return html`
      <div>
        <a href="https://vitejs.dev" target="_blank"
          ><img src="${viteLogo}" class="logo" alt="Vite logo"
        /></a>
        <a href="https://lit.dev" target="_blank"
          ><img src=${litLogo} class="logo" alt="Lit logo"
        /></a>
      </div>
      <slot></slot>
      <div class="card">
        <button @click=${this._onClick} part="button">
          count is ${this.count}
        </button>
      </div>
      <p class="read-the-docs">${this.docsHint}</p>
    `
  }

  _onClick() {
    this.count++
  }
}

window.customElements.define('my-element', MyElement)
