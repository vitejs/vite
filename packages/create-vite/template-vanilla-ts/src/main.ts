import './style.css'
import typescriptLogo from './assets/typescript.svg'
import viteLogo from './assets/vite.svg?raw'
import { setupCounter } from './counter.ts'
import heroImg from './assets/hero.png'
import documentationIcon from './assets/documentation-icon.svg'
import socialIcon from './assets/social-icon.svg'
import githubIcon from './assets/github-icon.svg'
import discordIcon from './assets/discord-icon.svg'
import blueskyIcon from './assets/bluesky-icon.svg'
import xIcon from './assets/x-icon.svg'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<section id="framework-logos">
    <a href="https://vite.dev" target="_blank" class="logo vite" aria-label="Vite logo">${viteLogo}</a>
    <span>+</span>
    <a href="https://www.typescriptlang.org/" target="_blank">
        <img src="${typescriptLogo}" class="logo typescript" alt="TypeScript logo" height="36"/>
    </a>
</section>

<div class="ticks"></div>

<section id="center">
    <div class="hero-image">
        <img src="${heroImg}" alt="Vite" class="hero-image__base">
        <img src="${typescriptLogo}" class="hero-image__framework" alt="TypeScript logo"/>
        <span class="hero-image__vite" aria-label="Vite logo">${viteLogo}</span>
    </div>
    <div>
        <h1>Get started</h1>
        <p>Edit <code>src/main.ts</code> and save to test <code>HMR</code></p>
    </div>
    <button id="counter" type="button" class="counter"></button>
</section>

<div class="ticks"></div>

<section id="next-steps">
    <div id="documentation">
        <img class="icon" src="${documentationIcon}" alt="Documentation" inert>
        <h2>Documentation</h2>
        <p>Your questions, answered</p>
        <div class="button-group">
            <a href="https://vite.dev/?ref=vite-starter-learn-more" class="button">
                <span class="button-logo">${viteLogo}</span>
                Explore Vite
            </a>
            <a href="https://www.typescriptlang.org/?ref=vite-starter-learn-more" class="button">
                <img src="${typescriptLogo}" alt="">
                Learn more
            </a>
        </div>
    </div>
    <div id="social">
        <img class="icon" src="${socialIcon}" alt="Connect with us" inert>
        <h2>Connect with us</h2>
        <p>Join the Vite community</p>
        <ul>
            <li><a href="https://github.com/vitejs/vite?ref=vite-starter-icon" target="_blank"><img src="${githubIcon}" alt="GitHub">GitHub</a></li>
            <li><a href="https://chat.vite.dev/?ref=vite-starter-icon" target="_blank"><img src="${discordIcon}" alt="Discord">Discord</a></li>
            <li><a href="https://x.com/vite_js?ref=vite-starter-icon" target="_blank"><img src="${xIcon}" alt="X">X.com</a></li>
            <li><a href="https://bsky.app/profile/vite.dev?ref=vite-starter-icon" target="_blank"><img src="${blueskyIcon}" alt="Bluesky">Bluesky</a></li>
        </ul>
    </div>
</section>

<div class="ticks"></div>
<section id="spacer"></section>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
