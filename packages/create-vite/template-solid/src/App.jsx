import { createSignal } from 'solid-js'
import solidLogo from './assets/solid.svg'
import viteLogo from './assets/vite.svg?raw'
import heroImg from './assets/hero.png'
import documentationIcon from './assets/documentation-icon.svg'
import socialIcon from './assets/social-icon.svg'
import githubIcon from './assets/github-icon.svg'
import discordIcon from './assets/discord-icon.svg'
import blueskyIcon from './assets/bluesky-icon.svg'
import xIcon from './assets/x-icon.svg'
import './App.css'

function App() {
  const [count, setCount] = createSignal(0)

  return (
    <>
      <section id="framework-logos">
        <a
          href="https://vite.dev"
          target="_blank"
          class="logo vite"
          aria-label="Vite logo"
          innerHTML={viteLogo}
        />
        <span>+</span>
        <a href="https://solidjs.com" target="_blank">
          <img
            src={solidLogo}
            class="logo solid"
            alt="Solid logo"
            height="36"
          />
        </a>
      </section>

      <div class="ticks"></div>

      <section id="center">
        <div class="hero-image">
          <img src={heroImg} alt="Vite" class="hero-image__base" />
          <img src={solidLogo} class="hero-image__framework" alt="Solid logo" />
          <span
            class="hero-image__vite"
            aria-label="Vite logo"
            innerHTML={viteLogo}
          />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button class="counter" onClick={() => setCount((count) => count + 1)}>
          Count is {count()}
        </button>
      </section>

      <div class="ticks"></div>

      <section id="next-steps">
        <div id="documentation">
          <img class="icon" src={documentationIcon} alt="Documentation" />
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <div class="button-group">
            <a
              href="https://vite.dev/?ref=vite-starter-learn-more"
              class="button"
            >
              <span class="button-logo" innerHTML={viteLogo} />
              Explore Vite
            </a>
            <a
              href="https://solidjs.com/?ref=vite-starter-learn-more"
              class="button"
            >
              <img src={solidLogo} alt="" />
              Learn more
            </a>
          </div>
        </div>
        <div id="social">
          <img class="icon" src={socialIcon} alt="Connect with us" />
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a
                href="https://github.com/vitejs/vite?ref=vite-starter-icon"
                target="_blank"
              >
                <img src={githubIcon} alt="GitHub" />
                GitHub
              </a>
            </li>
            <li>
              <a
                href="https://chat.vite.dev/?ref=vite-starter-icon"
                target="_blank"
              >
                <img src={discordIcon} alt="Discord" />
                Discord
              </a>
            </li>
            <li>
              <a
                href="https://x.com/vite_js?ref=vite-starter-icon"
                target="_blank"
              >
                <img src={xIcon} alt="X" />
                X.com
              </a>
            </li>
            <li>
              <a
                href="https://bsky.app/profile/vite.dev?ref=vite-starter-icon"
                target="_blank"
              >
                <img src={blueskyIcon} alt="Bluesky" />
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div class="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
