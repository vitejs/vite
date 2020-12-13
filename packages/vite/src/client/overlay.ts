import { ErrorPayload } from 'types/hmrPayload'

const template = /*html*/ `
<style>
:host {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  background: rgba(0, 0, 0, 0.66);
  --monospace: 'SFMono-Regular', Consolas,
              'Liberation Mono', Menlo, Courier, monospace;
  --red: #ff5555;
  --yellow: #e2aa53;
  --cyan: #2dd9da;
  --dim: #c9c9c9;
}

.window {
  word-break: break-word;
  font-family: var(--monospace);
  line-height: 1.5;
  width: 800px;
  color: #d8d8d8;
  margin: 30px auto;
  padding: 25px 40px;
  position: relative;
  background: #181818;
  border-radius: 6px 6px 8px 8px;
  box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);
  overflow: hidden;
  border-top: 8px solid var(--red);
}

pre {
  font-family: var(--monospace);
  overflow-x: scroll;
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 1em;
}

.message {
  line-height: 1.3;
  color: var(--red);
  font-weight: 600;
}

.file {
  color: var(--cyan);
  margin-bottom: 0;
}

.frame {
  color: var(--yellow);
}

.stack {
  font-size: 13px;
  color: var(--dim);
}

.tip {
  font-size: 13px;
  color: #999;
  border-top: 1px dotted #999;
  padding-top: 13px;
}

code {
  font-size: 13px;
  font-family: var(--monospace);
  color: var(--yellow);
}
</style>
<div class="window">
  <pre class="message"></pre>
  <pre class="file"></pre>
  <pre class="frame"></pre>
  <pre class="stack"></pre>
  <div class="tip">
    Click outside or fix the code to dismiss.<br>
    You can also disable this overlay with
    <code>hmr: { overlay: false }</code> in <code>vite.config.js.</code>
  </div>
</div>
`

export class ErrorOverlay extends HTMLElement {
  root: ShadowRoot

  constructor(err: ErrorPayload['err']) {
    super()
    this.root = this.attachShadow({ mode: 'open' })
    this.root.innerHTML = template
    this.text(
      '.message',
      (err.plugin ? `[plugin:${err.plugin}] ` : ``) + err.message.trim()
    )
    err.id && this.text('.file', err.id)
    this.text('.stack', err.stack.trim())
    err.frame && this.text('.frame', err.frame.trim())

    this.root.querySelector('.window')!.addEventListener('click', (e) => {
      e.stopPropagation()
    })
    this.addEventListener('click', () => {
      this.close()
    })
  }

  text(selector: string, text: string) {
    this.root.querySelector(selector)!.textContent = text
  }

  close() {
    this.parentNode?.removeChild(this)
  }
}

export const overlayId = 'vite-error-overlay'
customElements.define(overlayId, ErrorOverlay)
