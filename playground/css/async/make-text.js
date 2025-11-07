export function makeText(className, content) {
  const div = document.createElement('div')
  div.className = `base hotpink ${className}`
  document.body.appendChild(div)
  div.textContent = `${content} ${getComputedStyle(div).color}`
}
