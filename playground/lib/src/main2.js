export default async function message(sel) {
  const message = await import('./message.js')
  document.querySelector(sel).textContent = message.default
}
