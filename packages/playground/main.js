import { h, render } from 'vue'
import './test.jsx'
import pkg from '/@fs/Users/evan/Vue/vite/package.json'

console.log(pkg)

render(h('h1', 'Hello World?'), document.getElementById('app'))
