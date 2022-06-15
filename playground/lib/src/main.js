import('./index.css')
import './dynamic.css'
import png from './asset.png?url'
export default function myLib(sel) {
  const worker = new Worker(new URL('./worker.js', import.meta.url))
  worker.addEventListener('message', (e) => {
    console.log(e.data)
  })
  import('./message').then((mod) => {
    console.log(mod.default)
  })
  // Force esbuild spread helpers (https://github.com/evanw/esbuild/issues/951)
  console.log({ ...'foo' })

  document.querySelector(sel).textContent = 'It works'

  const img = document.createElement('img')
  img.src = png
  document.body.appendChild(img)

  // Env vars should not be replaced
  console.log(process.env.NODE_ENV)
}
