// import { h, render } from 'vue'
// import './test.jsx'
// import pkg from '/@fs/Users/evan/Vue/vite/package.json'
// // import '/non-existent'
// import css from './imported.css'
// import { redText } from './foo.module.css'
// import url from './public/logo.png'
// import html from './index.html?raw'

// console.log(html)
// console.log(url)
// console.log(css)
// console.log(pkg)

import { createApp } from 'vue'
import Test from './Test.vue'

createApp(Test).mount('#app')

// render(
//   h('h2', { class: redText }, 'Hello World?'),
//   document.getElementById('app')
// )
