import './style.css'
import viteLogo from '/vite.svg'
import javascriptLogo from './javascript.svg'
import { setupCounter } from './counter.js'

document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank"><img class="logo" alt="Vite logo" src="${viteLogo}" /></a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank"><img class="logo" alt="JavaScript logo" src="${javascriptLogo}" /></a>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
`

setupCounter(document.querySelector('#counter'))
