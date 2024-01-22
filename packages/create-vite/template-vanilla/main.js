import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

const app = document.querySelector('#app')

if (app) {
  const wrapper = document.createElement('div')

  // Set up Vite link and logo
  const viteLink = document.createElement('a')
  viteLink.setAttribute('href', 'https://vitejs.dev')
  viteLink.setAttribute('target', '_blank')
  const viteLinkLogo = document.createElement('img')
  viteLinkLogo.setAttribute('src', viteLogo)
  viteLinkLogo.setAttribute('class', 'logo')
  viteLinkLogo.setAttribute('alt', 'Vite logo')
  viteLink.appendChild(viteLinkLogo)

  // Set up JavaScript link and logo
  const javascriptLink = document.createElement('a')
  javascriptLink.setAttribute(
    'href',
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  )
  javascriptLink.setAttribute('target', '_blank')
  const jsLinkLogo = document.createElement('img')
  jsLinkLogo.setAttribute('src', javascriptLogo)
  jsLinkLogo.setAttribute('class', 'logo vanilla')
  jsLinkLogo.setAttribute('alt', 'JavaScript logo')
  javascriptLink.appendChild(jsLinkLogo)

  // Set up title
  const title = document.createElement('h1')
  title.textContent = 'Hello Vite!'

  // Set up card
  const card = document.createElement('div')
  card.setAttribute('class', 'card')
  const counterButton = document.createElement('button')
  counterButton.setAttribute('id', 'counter')
  card.appendChild(counterButton)

  // Set up docs
  const readTheDocs = document.createElement('p')
  readTheDocs.setAttribute('class', 'read-the-docs')
  readTheDocs.textContent = 'Click on the Vite logo to learn more'

  // Append all elements to wrapper, then the app
  wrapper.appendChild(viteLink)
  wrapper.appendChild(javascriptLink)
  wrapper.appendChild(title)
  wrapper.appendChild(card)
  wrapper.appendChild(readTheDocs)
  app.appendChild(wrapper)

  setupCounter(counterButton)
}
