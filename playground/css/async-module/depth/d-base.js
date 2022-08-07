import './d-black.css'

export function baseText(className, content) {
  const div = document.createElement('div')
  div.className = `d-black ${className}`
  document.body.appendChild(div)
  div.textContent = `${content} ${getComputedStyle(div).color}`
}
