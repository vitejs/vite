import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'

const app = document.querySelector<HTMLDivElement>('#app')

// Create a node with provided attributes and optional children
function h(
  e: string,
  attrs: Record<string, string> = {},
  ...children: (string | Node)[]
): Node {
  const elem = document.createElement(e)
  for (const [k, v] of Object.entries(attrs)) {
    elem.setAttribute(k, v)
  }
  elem.append(...children)
  return elem
}

if (app) {
  app.append(
    h(
      'div',
      {},
      h(
        'a',
        { href: 'https://vitejs.dev', target: '_blank' },
        h('img', { src: viteLogo, class: 'logo', alt: 'Vite logo' }),
      ),
      h(
        'a',
        {
          href: 'https://www.typescriptlang.org/',
          target: '_blank',
        },
        h('img', {
          src: typescriptLogo,
          class: 'logo vanilla',
          alt: 'JavaScript logo',
        }),
      ),
      h('h1', {}, 'Hello Vite!'),
      h('div', { class: 'card' }, h('button', { id: 'counter' })),
      h(
        'p',
        { class: 'read-the-docs' },
        'Click on the Vite logo to learn more',
      ),
    ),
  )

  setupCounter(documment.querySelector('#counter'))
}
