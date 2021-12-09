import styles from './black.module.css'

export function baseAsync(className, color) {
  const div = document.createElement('div')
  div.className = `${styles.black} ${className} async-modules-${color}`
  document.body.appendChild(div)
  div.textContent = `async css modules (${color}) ${
    getComputedStyle(div).color
  }`
}
