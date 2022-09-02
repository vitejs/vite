import './static.js'

import('./dynamic.js').then(async ({ lazyLoad }) => {
  await lazyLoad()
})
