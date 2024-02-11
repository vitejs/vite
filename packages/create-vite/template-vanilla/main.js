import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

const app = document.querySelector('#app')

// Create a node with provided attributes and optional children
function h(e, attrs = {}, ...children) {
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
          href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
          target: '_blank',
        },
        h('img', {
          src: javascriptLogo,
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
