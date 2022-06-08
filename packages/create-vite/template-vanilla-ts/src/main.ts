import './style.css'
import viteLogo from '/vite.svg'
import typescriptLogo from './typescript.svg'
import { setupCounter } from './counter'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank"><img class="logo" alt="Vite logo" src="${viteLogo}" /></a>
    <a href="https://www.typescriptlang.org/" target="_blank"><img class="logo" alt="TypeScript logo" src="${typescriptLogo}" /></a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
