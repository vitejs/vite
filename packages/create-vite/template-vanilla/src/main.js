import './style.css'
import javascriptLogo from './assets/javascript.svg'
import viteLogo from './assets/vite.svg?raw'
import { setupCounter } from './counter.js'

const starterUrl = 'https://vite.dev/starter'

document.querySelector('#app').innerHTML = `
<section id="center">
  <div class="hero">
    <img src="${starterUrl}/hero.png" class="base" width="170" height="179">
    <img src="${javascriptLogo}" class="framework" alt="JavaScript logo"/>
    <span class="vite" aria-label="Vite logo">${viteLogo}</span>
  </div>
  <div>
    <h1>Get started</h1>
    <p>Edit <code>src/main.js</code> and save to test <code>HMR</code></p>
  </div>
  <button id="counter" type="button" class="counter"></button>
</section>

<div class="ticks"></div>

<section id="next-steps">
  <div id="docs">
    <img class="icon" src="${starterUrl}/documentation-icon.svg" role="presentation" inert>
    <h2>Documentation</h2>
    <p>Your questions, answered</p>
    <ul>
      <li>
        <a href="https://vite.dev/" target="_blank">
          <span class="logo">${viteLogo}</span>
          Explore Vite
        </a>
      </li>
      <li>
        <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
          <img src="${javascriptLogo}" alt="">
          Learn more
        </a>
      </li>
    </ul>
  </div>
  <div id="social">
    <img class="icon" src="${starterUrl}/social-icon.svg" role="presentation" inert>
    <h2>Connect with us</h2>
    <p>Join the Vite community</p>
    <ul>
      <li><a href="https://github.com/vitejs/vite" target="_blank"><img src="${starterUrl}/github-icon.svg" role="presentation">GitHub</a></li>
      <li><a href="https://chat.vite.dev/" target="_blank"><img src="${starterUrl}/discord-icon.svg" role="presentation">Discord</a></li>
      <li><a href="https://x.com/vite_js" target="_blank"><img src="${starterUrl}/x-icon.svg" role="presentation">X.com</a></li>
      <li><a href="https://bsky.app/profile/vite.dev" target="_blank"><img src="${starterUrl}/bluesky-icon.svg" role="presentation">Bluesky</a></li>
    </ul>
  </div>
</section>

<div class="ticks"></div>
<section id="spacer"></section>
`

setupCounter(document.querySelector('#counter'))
