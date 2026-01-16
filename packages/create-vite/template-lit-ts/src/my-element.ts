import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import litLogo from './assets/lit.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import documentationIcon from './assets/documentation-icon.svg'
import socialIcon from './assets/social-icon.svg'
import githubIcon from './assets/github-icon.svg'
import discordIcon from './assets/discord-icon.svg'
import blueskyIcon from './assets/bluesky-icon.svg'
import xIcon from './assets/x-icon.svg'

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('my-element')
export class MyElement extends LitElement {
  /**
   * The number of times the button has been clicked.
   */
  @property({ type: Number })
  count = 0

  render() {
    return html`
      <section id="framework-logos">
        <a href="https://vite.dev" target="_blank">
          <img src=${viteLogo} class="logo vite" alt="Vite logo" height="32" />
        </a>
        <span>+</span>
        <a href="https://lit.dev" target="_blank">
          <img src=${litLogo} class="logo lit" alt="Lit logo" height="36" />
        </a>
      </section>

      <div class="ticks"></div>

      <section id="center">
        <div class="hero-image">
          <img src=${heroImg} alt="Vite" class="hero-image__base" />
          <img src=${litLogo} class="hero-image__framework" alt="Lit logo" />
        </div>
        <div>
          <slot></slot>
          <p>
            Edit <code>src/my-element.ts</code> and save to test
            <code>HMR</code>
          </p>
        </div>
        <button class="counter" @click=${this._onClick} part="button">
          Count is ${this.count}
        </button>
      </section>

      <div class="ticks"></div>

      <section id="next-steps">
        <div id="documentation">
          <img class="icon" src=${documentationIcon} alt="Documentation" />
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <div class="button-group">
            <a
              href="https://vite.dev/?ref=vite-starter-learn-more"
              class="button"
              ><img src=${viteLogo} alt="" />Explore Vite</a
            >
            <a
              href="https://lit.dev/?ref=vite-starter-learn-more"
              class="button"
              ><img src=${litLogo} alt="" />Learn more</a
            >
          </div>
        </div>
        <div id="social">
          <img class="icon" src=${socialIcon} alt="Connect with us" />
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a
                href="https://github.com/vitejs/vite?ref=vite-starter-icon"
                target="_blank"
                ><img src=${githubIcon} alt="GitHub" />GitHub</a
              >
            </li>
            <li>
              <a
                href="https://chat.vite.dev/?ref=vite-starter-icon"
                target="_blank"
                ><img src=${discordIcon} alt="Discord" />Discord</a
              >
            </li>
            <li>
              <a
                href="https://x.com/vite_js?ref=vite-starter-icon"
                target="_blank"
                ><img src=${xIcon} alt="X" />X.com</a
              >
            </li>
            <li>
              <a
                href="https://bsky.app/profile/vite.dev?ref=vite-starter-icon"
                target="_blank"
                ><img src=${blueskyIcon} alt="Bluesky" />Bluesky</a
              >
            </li>
          </ul>
        </div>
      </section>

      <div class="ticks"></div>
      <section id="spacer"></section>
    `
  }

  private _onClick() {
    this.count++
  }

  static styles = css`
    :host {
      --color-text: #6b6375;
      --color-text-heading: #08060d;
      --color-bg: #ffffff;
      --color-border: #e5e4e7;
      --color-code-bg: #f4f3ec;
      --color-accent: #aa3bff;
      --color-accent-bg: rgba(170, 59, 255, 0.1);
      --color-accent-border: rgba(170, 59, 255, 0.5);
      --color-social-bg: rgba(244, 243, 236, 0.5);
      --shadow-hover:
        rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px;

      --font-sans:
        'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
        Roboto, sans-serif;
      --font-heading:
        'Zalando Sans', system-ui, -apple-system, BlinkMacSystemFont,
        'Segoe UI', Roboto, sans-serif;
      --font-mono:
        'Azeret Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas,
        monospace;

      font-family: var(--font-sans);
      font-size: 18px;
      line-height: 145%;
      letter-spacing: 0.18px;

      width: 1126px;
      max-width: 100vw;
      margin: 0 auto;
      text-align: center;
      border-inline: 1px solid var(--color-border);
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      color: var(--color-text);
    }

    h1,
    h2,
    ::slotted(h1),
    ::slotted(h2) {
      font-family: var(--font-heading);
      font-weight: 500;
      color: var(--color-text-heading);
    }

    h1,
    ::slotted(h1) {
      font-size: 56px;
      letter-spacing: -1.68px;
      margin: 32px 0;
    }

    h2 {
      font-size: 24px;
      line-height: 118%;
      letter-spacing: -0.24px;
      margin: 0 0 8px;
    }

    p {
      margin: 0;
    }

    code {
      font-family: var(--font-mono);
      font-size: 15px;
      line-height: 135%;
      display: inline-flex;
      padding: 4px 8px;
      justify-content: center;
      align-items: center;
      border-radius: 4px;
      color: var(--color-text-heading);
      background: var(--color-code-bg);
    }

    .counter {
      color: var(--color-accent);
      font-family: var(--font-mono);
      font-size: 16px;
      display: inline-flex;
      padding: 5px 10px;
      justify-content: center;
      align-items: center;
      border-radius: 5px;
      background: var(--color-accent-bg);
      border: 2px solid transparent;
      transition: border-color 0.3s ease;
      margin-bottom: 24px;
      cursor: pointer;
    }

    .counter:hover {
      border-color: var(--color-accent-border);
    }

    .counter:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .hero-image {
      position: relative;
      margin-top: 40px;
    }

    .hero-image__base {
      width: 170px;
      position: relative;
      z-index: 0;
    }

    .hero-image__framework {
      position: absolute;
      z-index: 1;
      top: 34px;
      inset-inline: 0;
      margin: 0 auto;
      height: 28px;
      transform: perspective(2000px) rotateZ(300deg) rotateX(44deg)
        rotateY(39deg) scale(1.4);
    }

    #center {
      display: flex;
      flex-direction: column;
      gap: 25px;
      justify-content: center;
      align-items: center;
      flex-grow: 1;
    }

    #framework-logos {
      color: var(--color-text);
      display: flex;
      gap: 14px;
      justify-content: center;
      align-items: center;
      height: 88px;
      border-bottom: 1px solid var(--color-border);
      margin-left: -1rem;
      font-size: 1.5rem;
    }

    #framework-logos a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 8px;
      border-radius: 10px;
    }

    #framework-logos a:focus-visible {
      outline: none;
    }

    #framework-logos a:focus-visible .logo.vite {
      filter: drop-shadow(0 0 18px #bd34fe);
    }

    #framework-logos a:focus-visible .logo.lit {
      filter: drop-shadow(0 0 18px #325cff);
    }

    #framework-logos .logo {
      transition: filter 200ms ease;
    }

    #framework-logos .logo.vite {
      height: 2rem;
    }

    #framework-logos .logo.vite:hover {
      filter: drop-shadow(0 0 18px #bd34fe);
    }

    #framework-logos .logo.lit {
      height: 2.25rem;
    }

    #framework-logos .logo.lit:hover {
      filter: drop-shadow(0 0 18px #325cff);
    }

    #next-steps {
      display: flex;
      border-top: 1px solid var(--color-border);
      text-align: left;
    }

    #next-steps > div {
      flex: 1 1 0;
      padding: 32px;
    }

    #next-steps .icon {
      margin-bottom: 16px;
      width: 22px;
    }

    #documentation {
      border-right: 1px solid var(--color-border);
    }

    #documentation .button-group {
      display: flex;
      gap: 8px;
      margin-top: 32px;
    }

    #documentation .button img {
      height: 18px;
    }

    #social ul {
      list-style: none;
      padding: 0;
      display: flex;
      gap: 8px;
      margin: 32px 0 0;
    }

    #social ul li > a {
      color: var(--color-text-heading);
      font-size: 16px;
      border-radius: 6px;
      background: var(--color-social-bg);
      display: flex;
      padding: 6px 12px;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      transition: box-shadow 0.3s ease;
    }

    #social ul li > a:hover {
      box-shadow: var(--shadow-hover);
    }

    #social ul li > a img {
      height: 18px;
    }

    #spacer {
      height: 88px;
      border-top: 1px solid var(--color-border);
    }

    .button {
      display: flex;
      padding: 10px 12px;
      justify-content: center;
      align-items: center;
      gap: 8px;
      border-radius: 6px;
      border: 1px solid var(--color-border);
      color: var(--color-text-heading);
      font-size: 15px;
      font-weight: 500;
      line-height: 120%;
      text-decoration: none;
      width: fit-content;
      letter-spacing: 0.3px;
      transition: box-shadow 0.3s ease;
    }

    .button:hover {
      box-shadow: var(--shadow-hover);
    }

    .ticks {
      position: relative;
      width: 100%;
    }

    .ticks::before,
    .ticks::after {
      content: '';
      position: absolute;
      top: -5px;
      width: 0;
      height: 0;
      border: 5px solid transparent;
    }

    .ticks::before {
      left: 0;
      border-left-color: var(--color-border);
    }

    .ticks::after {
      right: 0;
      border-right-color: var(--color-border);
    }

    @media (max-width: 1024px) {
      :host {
        font-size: 16px;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }

      h1,
      ::slotted(h1) {
        font-size: 36px;
        margin: 20px 0;
      }

      h2,
      ::slotted(h2) {
        font-size: 20px;
      }

      #framework-logos {
        height: 64px;
        gap: 10px;
      }

      #center {
        padding: 32px 20px 24px;
        gap: 18px;
      }

      .hero-image {
        margin-top: 12px;
      }

      .hero-image__base {
        width: 140px;
      }

      .hero-image__framework {
        top: 28px;
        height: 24px;
      }

      #next-steps {
        flex-direction: column;
        text-align: center;
      }

      #next-steps > div {
        padding: 24px 20px;
      }

      #documentation {
        border-right: none;
        border-bottom: 1px solid var(--color-border);
      }

      #social ul {
        margin-top: 20px;
        flex-wrap: wrap;
        justify-content: center;
      }

      #social ul li {
        flex: 1 1 calc(50% - 8px);
      }

      #social ul li > a {
        width: 100%;
        justify-content: center;
        box-sizing: border-box;
      }

      .icon,
      .button,
      .button-group {
        margin-inline: auto;
      }

      #spacer {
        height: 48px;
      }
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement
  }
}
