import './hotpink.css'
import styles from './blue.module.css'

const div = document.createElement('div')
div.className = `base ${styles.blue} async-modules-and-css-blue`
document.body.appendChild(div)
div.textContent = `async css modules and normal css (blue) ${
  getComputedStyle(div).color
}`
