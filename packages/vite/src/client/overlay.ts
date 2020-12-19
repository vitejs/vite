import { ErrorPayload } from 'types/hmrPayload'

const template = /*html*/ `
<style>
:host {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  margin: 0;
  background: rgba(0, 0, 0, 0.66);
  --monospace: 'SFMono-Regular', Consolas,
              'Liberation Mono', Menlo, Courier, monospace;
  --red: #ff5555;
  --yellow: #e2aa53;
  --purple: #cfa4ff;
  --cyan: #2dd9da;
  --dim: #c9c9c9;
}

.window {
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
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 1em;
  overflow-x: scroll;
  scrollbar-width: none;
}

pre::-webkit-scrollbar {
  display: none;
}

.message {
  line-height: 1.3;
  font-weight: 600;
  white-space: pre-wrap;
}

.message-body {
  color: var(--red);
}

.plugin {
  color: var(--purple);
}

.file {
  color: var(--cyan);
  margin-bottom: 0;
  white-space: pre-wrap;
  word-break: break-all;
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

.file-link {
  text-decoration: underline;
  cursor: pointer;
}
</style>
<div class="window">
  <pre class="message"><span class="plugin"></span><span class="message-body"></span></pre>
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

const fileRE = /(?:[a-zA-Z]:\\|\/).*?:\d+:\d+/g
const codeframeRE = /^(?:>?\s+\d+\s+\|.*|\s+\|\s*\^.*)\r?\n/gm

export class ErrorOverlay extends HTMLElement {
  root: ShadowRoot

  constructor(err: ErrorPayload['err']) {
    super()
    this.root = this.attachShadow({ mode: 'open' })
    this.root.innerHTML = template

    const hasFrame = err.frame && codeframeRE.test(err.frame)
    const message = hasFrame
      ? err.message.replace(codeframeRE, '')
      : err.message
    if (err.plugin) {
      this.text('.plugin', `[plugin:${err.plugin}] `)
    }
    this.text('.message-body', message.trim())

    const [file] = (err.loc?.file || err.id || 'unknown file').split(`?`)
    if (err.loc) {
      this.text('.file', `${file}:${err.loc.line}:${err.loc.column}`, true)
    } else if (err.id) {
      this.text('.file', file)
    }

    if (hasFrame) {
      this.text('.frame', err.frame!.trim())
    }
    this.text('.stack', err.stack.replace(codeframeRE, '').trim(), true)

    this.root.querySelector('.window')!.addEventListener('click', (e) => {
      e.stopPropagation()
    })
    this.addEventListener('click', () => {
      this.close()
    })
  }

  text(selector: string, text: string, linkFiles = false) {
    const el = this.root.querySelector(selector)!
    if (!linkFiles) {
      el.textContent = text
    } else {
      let curIndex = 0
      let match
      while ((match = fileRE.exec(text))) {
        const { 0: file, index } = match
        if (index != null) {
          const frag = text.slice(curIndex, index)
          el.appendChild(document.createTextNode(frag))
          const link = document.createElement('a')
          link.textContent = file
          link.className = 'file-link'
          link.onclick = () => {
            fetch('/__open-in-editor?file=' + encodeURIComponent(file))
          }
          el.appendChild(link)
          curIndex += frag.length + file.length
        }
      }
    }
  }

  close() {
    this.parentNode?.removeChild(this)
  }
}

export const overlayId = 'vite-error-overlay'
customElements.define(overlayId, ErrorOverlay)
