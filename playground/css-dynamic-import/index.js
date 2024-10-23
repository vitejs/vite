import './static.js'

const link = document.head.appendChild(document.createElement('link'))
link.rel = 'preload'
link.as = 'style'
link.href = new URL('./dynamic.css', import.meta.url).href

import('./dynamic.js').then(async ({ lazyLoad }) => {
  await lazyLoad()
})
