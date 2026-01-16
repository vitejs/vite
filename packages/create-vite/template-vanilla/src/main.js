import './style.css'
import javascriptLogo from './assets/javascript.svg'
import viteLogo from './assets/vite.svg'
import { setupCounter } from './counter.js'
import heroImg from './assets/hero.png'
import documentationIcon from './assets/documentation-icon.svg'
import socialIcon from './assets/social-icon.svg'
import githubIcon from './assets/github-icon.svg'
import discordIcon from './assets/discord-icon.svg'
import blueskyIcon from './assets/bluesky-icon.svg'
import xIcon from './assets/x-icon.svg'

document.querySelector('#app').innerHTML = `
<section id="framework-logos">
    <a href="https://vite.dev" target="_blank">
        <img src="${viteLogo}" class="logo vite" alt="Vite logo" height="32"/>
    </a>
    <span>+</span>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
        <img src="${javascriptLogo}" class="logo javascript" alt="JavaScript logo" height="36"/>
    </a>
</section>

<div class="ticks"></div>

<section id="center">
    <div class="hero-image">
        <img src="${heroImg}" alt="Vite" class="hero-image__base">
        <img src="${javascriptLogo}" class="hero-image__framework" alt="JavaScript logo"/>
    </div>
    <div>
        <h1>Get started</h1>
        <p>Edit <code>src/main.js</code> and save to test <code>HMR</code></p>
    </div>
    <button id="counter" type="button" class="counter"></button>
</section>

<div class="ticks"></div>

<section id="next-steps">
    <div id="documentation">
        <img class="icon" src="${documentationIcon}" alt="Documentation" inert>
        <h2>Documentation</h2>
        <p>Explore our guides and API reference</p>
        <a href="https://vite.dev/?ref=vite-starter-learn-more" class="button">Learn more</a>
    </div>
    <div id="social">
        <img class="icon" src="${socialIcon}" alt="Connect with us" inert>
        <h2>Connect with us</h2>
        <p>Join the Vite community</p>
        <ul>
            <li><a href="https://github.com/vitejs/vite" target="_blank"><img src="${githubIcon}" alt="GitHub">GitHub</a></li>
            <li><a href="https://chat.vite.dev/" target="_blank"><img src="${discordIcon}" alt="Discord">Discord</a></li>
            <li><a href="https://x.com/vite_js" target="_blank"><img src="${xIcon}" alt="X">X.com</a></li>
            <li><a href="https://bsky.app/profile/vite.dev" target="_blank"><img src="${blueskyIcon}" alt="Bluesky">Bluesky</a></li>
        </ul>
    </div>
</section>

<div class="ticks"></div>
<section id="spacer"></section>
`

setupCounter(document.querySelector('#counter'))
