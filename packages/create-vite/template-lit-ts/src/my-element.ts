import { html, css, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import viteLogo from '/vite.svg'
import litLogo from './assets/lit.svg'

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('my-element')
export class MyElement extends LitElement {
  static styles = css`
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

  /**
   * Copy for the read the docs hint.
   */
  @property()
  docsHint = 'Click on the Vite and Lit logos to learn more'

  /**
   * The number of times the button has been clicked.
   */
  @property({ type: Number })
  count = 0

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

  private _onClick() {
    this.count++
  }

  foo(): string {
    return 'foo'
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement
  }
}
