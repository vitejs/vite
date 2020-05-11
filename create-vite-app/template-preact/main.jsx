import { render } from 'preact'
import { Logo } from './logo'
import './index.css'

function App(props) {
  return (
    <>
      <Logo />
      <p>Hello Vite + Preact!</p>
      <p>
        <a
          class="link"
          href="https://preactjs.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Preact
        </a>
      </p>
    </>
  )
}

render(<App />, document.getElementById('app'))
