import './b'

export const c = 'c'

function render(content) {
  globalThis.__HMR__['.self-accept-within-circular'] = content
}
render(c)

import.meta.hot?.accept((nextExports) => {
  render(nextExports.c)
})
