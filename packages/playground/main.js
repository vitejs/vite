import { h, render } from 'vue'
import './test.jsx'
import pkg from '/@fs/Users/evan/Vue/vite/package.json'
import '/non-existent'
// import './imported.css'

console.log(pkg)

render(h('h1', 'Hello World?'), document.getElementById('app'))
