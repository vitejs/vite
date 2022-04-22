import './index.css'

export default async function message(sel) {
  const message = await import('./message.js')

  await import('./dynamic.css')

  document.querySelector(sel).textContent = message.default
}
