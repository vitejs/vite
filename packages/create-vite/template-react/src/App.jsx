import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import documentationIcon from './assets/documentation-icon.svg'
import socialIcon from './assets/social-icon.svg'
import githubIcon from './assets/github-icon.svg'
import discordIcon from './assets/discord-icon.svg'
import blueskyIcon from './assets/bluesky-icon.svg'
import xIcon from './assets/x-icon.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section id="framework-logos">
        <a href="https://vite.dev" target="_blank">
          <img
            src={viteLogo}
            className="logo vite"
            alt="Vite logo"
            height="32"
          />
        </a>
        <span>+</span>
        <a href="https://react.dev" target="_blank">
          <img
            src={reactLogo}
            className="logo react"
            alt="React logo"
            height="36"
          />
        </a>
      </section>

      <div className="ticks"></div>

      <section id="center">
        <div className="hero-image">
          <img src={heroImg} alt="Vite" className="hero-image__base" />
          <img
            src={reactLogo}
            className="hero-image__framework"
            alt="React logo"
          />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="documentation">
          <img className="icon" src={documentationIcon} alt="Documentation" />
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <div className="button-group">
            <a
              href="https://vite.dev/?ref=vite-starter-learn-more"
              className="button"
            >
              <img src={viteLogo} alt="" />
              Explore Vite
            </a>
            <a
              href="https://react.dev/?ref=vite-starter-learn-more"
              className="button"
            >
              <img src={reactLogo} alt="" />
              Learn more
            </a>
          </div>
        </div>
        <div id="social">
          <img className="icon" src={socialIcon} alt="Connect with us" />
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

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
