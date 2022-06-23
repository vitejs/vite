import styles from './black.module.css'
import './hotpink.css'

const div = document.createElement('div')
div.className = `base ${styles.black} async-modules-and-css-black`
document.body.appendChild(div)
div.textContent = `async css modules and normal css (black) ${
  getComputedStyle(div).color
}`
