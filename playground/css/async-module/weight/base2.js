import styles from './red.module.css'

export function baseAsync(className, color) {
  const div = document.createElement('div')
  div.className = `${styles.red} ${className} async-modules-${color}`
  document.body.appendChild(div)
  div.textContent = `[weight2] (${color}) ${getComputedStyle(div).color}`
}
