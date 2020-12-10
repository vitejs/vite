import { h, render } from 'vue'
import './test.jsx'
import pkg from '/@fs/Users/evan/Vue/vite/package.json'
// import '/non-existent'
import css from './imported.css'
import { redText } from './foo.module.css'

console.log(css)

console.log(pkg)

render(
  h('h2', { class: redText }, 'Hello World?'),
  document.getElementById('app')
)
